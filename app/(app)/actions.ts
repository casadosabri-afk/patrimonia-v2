'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { getDemoStore } from '@/services/db/demoStore';
import { AccessDeniedError } from '@/services/db/access';
import { isSupabaseConfigured } from '@/lib/env';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export interface ActionState {
  error: string | null;
  success: boolean;
  message?: string;
}

export const EMPTY_ACTION_STATE: ActionState = { error: null, success: false };

function failure(error: unknown, fallback: string): ActionState {
  return {
    error: error instanceof AccessDeniedError ? error.message : fallback,
    success: false,
  };
}

/* ------------------------------------------------------------------ CRM -- */

const interactionSchema = z.object({
  clientId: z.string().min(1),
  kind: z.enum(['appel', 'email', 'rendez_vous', 'note', 'tache', 'document']),
  title: z.string().trim().min(1, 'Un titre est requis').max(160),
  body: z.string().trim().max(4000).default(''),
  dueAt: z.string().nullable().default(null),
});

export async function addInteractionAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { access } = await requireAccess('advisor', 'admin');
  const dueRaw = (formData.get('dueAt') as string | null)?.trim();

  const parsed = interactionSchema.safeParse({
    clientId: formData.get('clientId'),
    kind: formData.get('kind'),
    title: formData.get('title'),
    body: formData.get('body') ?? '',
    dueAt: dueRaw ? new Date(dueRaw).toISOString() : null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.', success: false };
  }

  try {
    await getRepository().createInteraction(access, parsed.data);
  } catch (error) {
    return failure(error, "L'enregistrement de l'interaction a échoué.");
  }

  revalidatePath(`/clients/${parsed.data.clientId}`);
  revalidatePath('/crm');
  return { error: null, success: true, message: 'Interaction enregistrée.' };
}

export async function completeInteractionAction(interactionId: string, clientId: string): Promise<void> {
  const { access } = await requireAccess('advisor', 'admin');
  await getRepository().completeInteraction(access, interactionId);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath('/crm');
}

/* ---------------------------------------------------------- Rendez-vous -- */

const appointmentSchema = z.object({
  clientId: z.string().min(1),
  kind: z.enum(['bilan_annuel', 'point_investissement', 'signature', 'decouverte', 'suivi']),
  title: z.string().trim().min(1, 'Un titre est requis').max(160),
  startsAt: z.string().min(1, 'Une date est requise'),
  durationMin: z.coerce.number().int().min(15).max(480),
  location: z.string().trim().max(160).default(''),
  notes: z.string().trim().max(2000).nullable().default(null),
});

export async function createAppointmentAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { access } = await requireAccess('advisor', 'admin');
  const startRaw = (formData.get('startsAt') as string | null)?.trim();

  const parsed = appointmentSchema.safeParse({
    clientId: formData.get('clientId'),
    kind: formData.get('kind'),
    title: formData.get('title'),
    startsAt: startRaw ? new Date(startRaw).toISOString() : '',
    durationMin: formData.get('durationMin'),
    location: formData.get('location') ?? '',
    notes: (formData.get('notes') as string | null)?.trim() || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.', success: false };
  }

  try {
    await getRepository().createAppointment(access, parsed.data);
  } catch (error) {
    return failure(error, 'La création du rendez-vous a échoué.');
  }

  revalidatePath(`/clients/${parsed.data.clientId}`);
  revalidatePath('/calendrier');
  revalidatePath('/dashboard');
  return { error: null, success: true, message: 'Rendez-vous planifié.' };
}

/* ----------------------------------------------------------- Messagerie -- */

const messageSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().trim().min(1, 'Le message est vide').max(4000),
});

export async function sendMessageAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, access } = await requireAccess();
  const parsed = messageSchema.safeParse({
    conversationId: formData.get('conversationId'),
    body: formData.get('body'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Message invalide.', success: false };
  }

  try {
    await getRepository().sendMessage(access, parsed.data.conversationId, parsed.data.body);
  } catch (error) {
    return failure(error, "L'envoi du message a échoué.");
  }

  revalidatePath('/messages');
  revalidatePath('/espace-client/conseiller');
  if (user.role !== 'client') revalidatePath('/clients');
  return { error: null, success: true };
}

/* ----------------------------------------------------------- Objectifs -- */

const goalSchema = z.object({
  clientId: z.string().min(1),
  kind: z.enum([
    'retraite',
    'achat_immobilier',
    'transmission',
    'etudes_enfants',
    'creation_entreprise',
    'voyage',
    'epargne_precaution',
    'autre',
  ]),
  label: z.string().trim().min(1, 'Un intitulé est requis').max(160),
  targetAmount: z.coerce.number().min(1, 'Le montant cible doit être positif').max(1_000_000_000),
  currentAmount: z.coerce.number().min(0).max(1_000_000_000),
  monthlyContribution: z.coerce.number().min(0).max(1_000_000),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Une date cible est requise'),
  priority: z.enum(['haute', 'moyenne', 'basse']),
  notes: z.string().trim().max(1000).nullable().default(null),
});

function parseGoalForm(formData: FormData) {
  return goalSchema.safeParse({
    clientId: formData.get('clientId'),
    kind: formData.get('kind'),
    label: formData.get('label'),
    targetAmount: formData.get('targetAmount'),
    currentAmount: formData.get('currentAmount'),
    monthlyContribution: formData.get('monthlyContribution'),
    targetDate: formData.get('targetDate'),
    priority: formData.get('priority'),
    notes: (formData.get('notes') as string | null)?.trim() || null,
  });
}

export async function createGoalAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { access } = await requireAccess('advisor', 'admin');
  const parsed = parseGoalForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.', success: false };
  }

  try {
    await getRepository().createGoal(access, parsed.data);
  } catch (error) {
    return failure(error, "La création de l'objectif a échoué.");
  }

  revalidatePath(`/clients/${parsed.data.clientId}`);
  revalidatePath('/simulateur');
  return { error: null, success: true, message: 'Objectif créé.' };
}

export async function updateGoalAction(
  goalId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { access } = await requireAccess('advisor', 'admin');
  const parsed = parseGoalForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.', success: false };
  }

  try {
    await getRepository().updateGoal(access, goalId, parsed.data);
  } catch (error) {
    return failure(error, 'La mise à jour a échoué.');
  }

  revalidatePath(`/clients/${parsed.data.clientId}`);
  revalidatePath('/simulateur');
  return { error: null, success: true, message: 'Objectif mis à jour.' };
}

export async function deleteGoalAction(goalId: string, clientId: string): Promise<void> {
  const { access } = await requireAccess('advisor', 'admin');
  await getRepository().deleteGoal(access, goalId);

  revalidatePath(`/clients/${clientId}`);
  revalidatePath('/simulateur');
}

/* ------------------------------------------------------------- Alertes -- */

const alertStatusSchema = z.enum(['ouverte', 'en_cours', 'traitee', 'ignoree']);

export async function updateAlertStatusAction(alertId: string, status: string): Promise<void> {
  const { access } = await requireAccess('advisor', 'admin');
  const parsed = alertStatusSchema.safeParse(status);
  if (!parsed.success) return;

  await getRepository().updateAlertStatus(access, alertId, parsed.data);
  revalidatePath('/alertes');
  revalidatePath('/dashboard');
}

export async function assignAlertAction(alertId: string, assigneeId: string): Promise<void> {
  const { access } = await requireAccess('advisor', 'admin');
  await getRepository().assignAlert(access, alertId, assigneeId || null);
  revalidatePath('/alertes');
}

export async function commentAlertAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { access } = await requireAccess('advisor', 'admin');
  const alertId = String(formData.get('alertId') ?? '');
  const body = String(formData.get('body') ?? '').trim();

  if (!alertId || body.length === 0) {
    return { error: 'Le commentaire est vide.', success: false };
  }

  try {
    await getRepository().commentAlert(access, alertId, body);
  } catch (error) {
    return failure(error, "L'ajout du commentaire a échoué.");
  }

  revalidatePath('/alertes');
  return { error: null, success: true };
}

/** Crée une tâche CRM à partir d'une alerte. */
export async function createTaskFromAlertAction(
  alertId: string,
  clientId: string,
  title: string,
): Promise<void> {
  const { access } = await requireAccess('advisor', 'admin');
  const repository = getRepository();

  await repository.createInteraction(access, {
    clientId,
    kind: 'tache',
    title: title.slice(0, 160),
    body: `Tâche créée depuis l'alerte ${alertId}.`,
    dueAt: new Date(Date.now() + 7 * 86400_000).toISOString(),
  });
  await repository.updateAlertStatus(access, alertId, 'en_cours');

  revalidatePath('/alertes');
  revalidatePath('/crm');
  revalidatePath(`/clients/${clientId}`);
}

/* ----------------------------------------------------------- Documents -- */

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const documentSchema = z.object({
  clientId: z.string().min(1),
  kind: z.enum(['releve', 'justificatif', 'rapport', 'contrat', 'fiscal', 'autre']),
  visibleToClient: z.boolean(),
});

export async function uploadDocumentAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { access } = await requireAccess('advisor', 'admin');

  const parsed = documentSchema.safeParse({
    clientId: formData.get('clientId'),
    kind: formData.get('kind'),
    visibleToClient: formData.get('visibleToClient') === 'on',
  });

  if (!parsed.success) return { error: 'Formulaire invalide.', success: false };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Sélectionnez un fichier à déposer.', success: false };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: 'Fichier trop volumineux : 5 Mo maximum.', success: false };
  }

  const repository = getRepository();
  let storagePath: string | null = null;

  try {
    if (isSupabaseConfigured()) {
      const supabase = await getSupabaseServerClient();
      if (supabase) {
        storagePath = `${access.firmId}/${parsed.data.clientId}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from('client-documents')
          .upload(storagePath, file, { contentType: file.type, upsert: false });
        if (error) return { error: `Dépôt impossible : ${error.message}`, success: false };
      }
    }

    const document = await repository.createDocument(access, {
      clientId: parsed.data.clientId,
      kind: parsed.data.kind,
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      storagePath,
      visibleToClient: parsed.data.visibleToClient,
      demo: storagePath === null,
    });

    // En mode démonstration, le contenu est conservé en mémoire afin que le
    // téléchargement et l'aperçu fonctionnent réellement.
    if (storagePath === null) {
      const buffer = Buffer.from(await file.arrayBuffer());
      getDemoStore().documentBlobs.set(document.id, {
        mimeType: file.type || 'application/octet-stream',
        base64: buffer.toString('base64'),
      });
    }
  } catch (error) {
    return failure(error, 'Le dépôt du document a échoué.');
  }

  revalidatePath(`/clients/${parsed.data.clientId}`);
  revalidatePath('/documents');
  return { error: null, success: true, message: 'Document déposé.' };
}

export async function deleteDocumentAction(documentId: string, clientId: string): Promise<void> {
  const { access } = await requireAccess('advisor', 'admin');
  await getRepository().deleteDocument(access, documentId);
  getDemoStore().documentBlobs.delete(documentId);

  revalidatePath(`/clients/${clientId}`);
  revalidatePath('/documents');
}
