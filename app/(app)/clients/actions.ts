'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { AccessDeniedError } from '@/services/db/access';

const clientSchema = z.object({
  firstName: z.string().trim().min(1, 'Prénom requis').max(80),
  lastName: z.string().trim().min(1, 'Nom requis').max(80),
  email: z.email('Adresse e-mail invalide'),
  phone: z.string().trim().max(30).default(''),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance requise'),
  city: z.string().trim().max(80).default(''),
  postalCode: z.string().trim().max(10).default(''),
  profession: z.string().trim().max(120).default(''),
  riskProfile: z.enum(['prudent', 'equilibre', 'dynamique', 'offensif']),
  status: z.enum(['actif', 'prospect', 'archive']),
  horizonYears: z.coerce.number().int().min(1).max(60),
  annualIncome: z.coerce.number().min(0).max(100_000_000),
  annualExpenses: z.coerce.number().min(0).max(100_000_000),
  taxBracketRate: z.coerce.number().min(0).max(60),
  primaryAdvisorId: z.string().trim().min(1, 'Conseiller principal requis'),
  associateAdvisorIds: z.array(z.string()).default([]),
  notes: z.string().trim().max(2000).nullable().default(null),
});

export interface ClientFormState {
  error: string | null;
  fieldErrors: Record<string, string>;
  success: boolean;
}

export const EMPTY_CLIENT_FORM_STATE: ClientFormState = {
  error: null,
  fieldErrors: {},
  success: false,
};

function parseForm(formData: FormData) {
  return clientSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    birthDate: formData.get('birthDate'),
    city: formData.get('city') ?? '',
    postalCode: formData.get('postalCode') ?? '',
    profession: formData.get('profession') ?? '',
    riskProfile: formData.get('riskProfile'),
    status: formData.get('status'),
    horizonYears: formData.get('horizonYears'),
    annualIncome: formData.get('annualIncome'),
    annualExpenses: formData.get('annualExpenses'),
    taxBracketRate: formData.get('taxBracketRate'),
    primaryAdvisorId: formData.get('primaryAdvisorId'),
    associateAdvisorIds: formData.getAll('associateAdvisorIds').map(String),
    notes: (formData.get('notes') as string | null)?.trim() || null,
  });
}

function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function createClientAction(
  _state: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const { access } = await requireAccess('advisor', 'admin');
  const parsed = parseForm(formData);

  if (!parsed.success) {
    return { error: 'Certains champs sont invalides.', fieldErrors: toFieldErrors(parsed.error), success: false };
  }

  try {
    await getRepository().createClient(access, parsed.data);
  } catch (error) {
    return {
      error: error instanceof AccessDeniedError ? error.message : 'La création du client a échoué.',
      fieldErrors: {},
      success: false,
    };
  }

  revalidatePath('/clients');
  revalidatePath('/dashboard');
  return { error: null, fieldErrors: {}, success: true };
}

export async function updateClientAction(
  clientId: string,
  _state: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const { access } = await requireAccess('advisor', 'admin');
  const parsed = parseForm(formData);

  if (!parsed.success) {
    return { error: 'Certains champs sont invalides.', fieldErrors: toFieldErrors(parsed.error), success: false };
  }

  try {
    await getRepository().updateClient(access, clientId, parsed.data);
  } catch (error) {
    return {
      error: error instanceof AccessDeniedError ? error.message : 'La mise à jour a échoué.',
      fieldErrors: {},
      success: false,
    };
  }

  revalidatePath('/clients');
  revalidatePath(`/clients/${clientId}`);
  return { error: null, fieldErrors: {}, success: true };
}

const statusSchema = z.enum(['actif', 'prospect', 'archive']);

export async function setClientStatusAction(clientId: string, status: string): Promise<void> {
  const { access } = await requireAccess('advisor', 'admin');
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return;

  await getRepository().setClientStatus(access, clientId, parsed.data);
  revalidatePath('/clients');
  revalidatePath(`/clients/${clientId}`);
}
