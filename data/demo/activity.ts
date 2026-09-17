import type {
  Appointment,
  AppointmentKind,
  Conversation,
  Interaction,
  InteractionKind,
  Message,
  StoredDocument,
  DocumentKind,
} from '@/types';
import { createRng, seedFrom } from '@/lib/utils/random';
import { CLIENT_SPECS } from './clients';

/**
 * ⚠️ HISTORIQUE D'ACTIVITÉ FICTIF.
 * Interactions, rendez-vous, messages et documents sont générés de façon
 * déterministe pour alimenter la démonstration. Rien de tout cela ne provient
 * d'un système réel.
 */

const INTERACTION_TEMPLATES: { kind: InteractionKind; title: string; body: string }[] = [
  { kind: 'appel', title: 'Appel de suivi', body: "Point téléphonique sur l'évolution du portefeuille et les versements programmés." },
  { kind: 'email', title: 'Envoi du reporting trimestriel', body: 'Reporting adressé par courriel avec le détail des performances et de la répartition.' },
  { kind: 'rendez_vous', title: 'Rendez-vous de suivi', body: "Revue de l'allocation et des objectifs en cours." },
  { kind: 'note', title: 'Note interne', body: "Le client évoque un projet d'acquisition à moyen terme, à intégrer dans la prochaine revue." },
  { kind: 'appel', title: 'Appel entrant du client', body: 'Question sur la fiscalité des rachats partiels en assurance-vie.' },
  { kind: 'email', title: 'Relance documents', body: 'Demande des justificatifs manquants pour la mise à jour du dossier.' },
  { kind: 'tache', title: 'Préparer la revue annuelle', body: 'Rassembler les relevés et préparer la synthèse patrimoniale.' },
  { kind: 'note', title: 'Compte rendu de rendez-vous', body: 'Le client confirme son horizon de placement et son niveau de tolérance au risque.' },
  { kind: 'rendez_vous', title: 'Point investissement', body: 'Présentation des arbitrages envisagés sur le contrat d’assurance-vie.' },
  { kind: 'tache', title: 'Mettre à jour le profil investisseur', body: 'Questionnaire à refaire signer lors du prochain échange.' },
];

const APPOINTMENT_TEMPLATES: { kind: AppointmentKind; title: string; location: string; duration: number }[] = [
  { kind: 'bilan_annuel', title: 'Bilan patrimonial annuel', location: 'Cabinet — salle Horizon', duration: 90 },
  { kind: 'point_investissement', title: 'Point investissement', location: 'Visioconférence', duration: 45 },
  { kind: 'suivi', title: 'Rendez-vous de suivi', location: 'Visioconférence', duration: 30 },
  { kind: 'signature', title: 'Signature de bulletin de souscription', location: 'Cabinet — bureau 2', duration: 60 },
  { kind: 'decouverte', title: 'Rendez-vous de découverte', location: 'Cabinet — salle Horizon', duration: 60 },
];

const DOCUMENT_TEMPLATES: { kind: DocumentKind; name: string; mime: string; size: number }[] = [
  { kind: 'releve', name: 'Relevé de situation assurance-vie.pdf', mime: 'application/pdf', size: 184_320 },
  { kind: 'rapport', name: 'Rapport patrimonial annuel.pdf', mime: 'application/pdf', size: 642_112 },
  { kind: 'contrat', name: 'Conditions générales du contrat.pdf', mime: 'application/pdf', size: 318_540 },
  { kind: 'fiscal', name: 'Imprimé fiscal unique.pdf', mime: 'application/pdf', size: 96_240 },
  { kind: 'justificatif', name: "Justificatif de domicile.pdf", mime: 'application/pdf', size: 72_800 },
  { kind: 'releve', name: 'Relevé de compte-titres.pdf', mime: 'application/pdf', size: 221_460 },
  { kind: 'autre', name: 'Questionnaire de connaissance client.pdf', mime: 'application/pdf', size: 148_900 },
];

const MESSAGE_THREADS: { subject: string; exchanges: { role: 'advisor' | 'client'; body: string }[] }[] = [
  {
    subject: 'Votre reporting trimestriel',
    exchanges: [
      { role: 'advisor', body: 'Bonjour, je viens de déposer votre reporting trimestriel dans votre espace documents. Je reste disponible pour en discuter.' },
      { role: 'client', body: 'Merci, je viens de le consulter. La part immobilière me semble importante, est-ce un problème ?' },
      { role: 'advisor', body: "C'est un point que je souhaitais aborder avec vous. Je vous propose d'en parler lors de notre prochain rendez-vous, avec plusieurs pistes de rééquilibrage." },
    ],
  },
  {
    subject: 'Versement programmé',
    exchanges: [
      { role: 'client', body: 'Bonjour, serait-il possible d’augmenter mon versement mensuel à partir du mois prochain ?' },
      { role: 'advisor', body: 'Tout à fait. Souhaitez-vous conserver la même répartition entre les supports ou en profiter pour ajuster l’allocation ?' },
    ],
  },
  {
    subject: 'Question fiscale',
    exchanges: [
      { role: 'client', body: 'Quelle est la fiscalité si je fais un rachat partiel sur mon contrat cette année ?' },
      { role: 'advisor', body: 'Cela dépend de l’antériorité du contrat et de la part d’intérêts dans le rachat. Je vous prépare une simulation pédagogique chiffrée.' },
    ],
  },
];

export interface ActivityDataset {
  interactions: Interaction[];
  appointments: Appointment[];
  conversations: Conversation[];
  messages: Message[];
  documents: StoredDocument[];
}

export function buildActivity(now: Date): ActivityDataset {
  const interactions: Interaction[] = [];
  const appointments: Appointment[] = [];
  const conversations: Conversation[] = [];
  const messages: Message[] = [];
  const documents: StoredDocument[] = [];

  CLIENT_SPECS.forEach((spec, clientIndex) => {
    const rng = createRng(seedFrom(`activity:${spec.id}`));
    const advisorId = spec.advisorIds[0] ?? 'user-advisor-thomas';

    // — Interactions passées ------------------------------------------------
    const interactionCount = 5 + Math.floor(rng() * 5);
    for (let index = 0; index < interactionCount; index += 1) {
      const template = INTERACTION_TEMPLATES[Math.floor(rng() * INTERACTION_TEMPLATES.length)];
      if (!template) continue;
      const daysAgo = Math.floor(3 + rng() * 240);
      const occurredAt = new Date(now.getTime() - daysAgo * 86400_000);

      interactions.push({
        id: `${spec.id}-int-${index}`,
        firmId: spec.firmId,
        clientId: spec.id,
        advisorId: spec.advisorIds[index % spec.advisorIds.length] ?? advisorId,
        kind: template.kind,
        title: template.title,
        body: template.body,
        status: template.kind === 'tache' ? (rng() > 0.5 ? 'a_faire' : 'termine') : 'termine',
        occurredAt: occurredAt.toISOString(),
        dueAt: template.kind === 'tache' ? new Date(now.getTime() + Math.floor(rng() * 20) * 86400_000).toISOString() : null,
        createdAt: occurredAt.toISOString(),
      });
    }

    // — Tâches à venir ------------------------------------------------------
    if (rng() > 0.35) {
      const dueInDays = Math.floor(1 + rng() * 14);
      const createdDaysAgo = Math.floor(1 + rng() * 10);
      const createdAt = new Date(now.getTime() - createdDaysAgo * 86400_000).toISOString();
      interactions.push({
        id: `${spec.id}-task-next`,
        firmId: spec.firmId,
        clientId: spec.id,
        advisorId,
        kind: 'tache',
        title: 'Préparer la prochaine revue patrimoniale',
        body: 'Rassembler les relevés récents et actualiser la synthèse avant l’échange.',
        status: 'a_faire',
        occurredAt: createdAt,
        dueAt: new Date(now.getTime() + dueInDays * 86400_000).toISOString(),
        createdAt,
      });
    }

    // — Rendez-vous ---------------------------------------------------------
    const pastAppointments = 1 + Math.floor(rng() * 2);
    for (let index = 0; index < pastAppointments; index += 1) {
      const template = APPOINTMENT_TEMPLATES[Math.floor(rng() * APPOINTMENT_TEMPLATES.length)];
      if (!template) continue;
      const daysAgo = Math.floor(20 + rng() * 200);
      const start = new Date(now.getTime() - daysAgo * 86400_000);
      start.setHours(9 + Math.floor(rng() * 8), rng() > 0.5 ? 30 : 0, 0, 0);

      appointments.push({
        id: `${spec.id}-appt-past-${index}`,
        firmId: spec.firmId,
        clientId: spec.id,
        advisorId,
        kind: template.kind,
        title: template.title,
        startsAt: start.toISOString(),
        durationMin: template.duration,
        location: template.location,
        status: 'realise',
        notes: null,
      });
    }

    if (spec.status !== 'archive' && clientIndex % 4 !== 3) {
      const template = APPOINTMENT_TEMPLATES[Math.floor(rng() * APPOINTMENT_TEMPLATES.length)];
      const inDays = Math.floor(rng() * 21);
      const start = new Date(now.getTime() + inDays * 86400_000);
      start.setHours(9 + Math.floor(rng() * 8), rng() > 0.5 ? 30 : 0, 0, 0);

      appointments.push({
        id: `${spec.id}-appt-next`,
        firmId: spec.firmId,
        clientId: spec.id,
        advisorId,
        kind: template?.kind ?? 'suivi',
        title: template?.title ?? 'Rendez-vous de suivi',
        startsAt: start.toISOString(),
        durationMin: template?.duration ?? 45,
        location: template?.location ?? 'Visioconférence',
        status: inDays < 3 ? 'confirme' : 'planifie',
        notes: null,
      });
    }

    // — Documents -----------------------------------------------------------
    const documentCount = 2 + Math.floor(rng() * 4);
    for (let index = 0; index < documentCount; index += 1) {
      const template = DOCUMENT_TEMPLATES[Math.floor(rng() * DOCUMENT_TEMPLATES.length)];
      if (!template) continue;
      const daysAgo = Math.floor(10 + rng() * 400);

      documents.push({
        id: `${spec.id}-doc-${index}`,
        firmId: spec.firmId,
        clientId: spec.id,
        kind: template.kind,
        name: template.name,
        mimeType: template.mime,
        sizeBytes: template.size,
        uploadedAt: new Date(now.getTime() - daysAgo * 86400_000).toISOString(),
        uploadedBy: advisorId,
        storagePath: null,
        demo: true,
        visibleToClient: template.kind !== 'autre',
      });
    }

    // — Conversation --------------------------------------------------------
    const thread = MESSAGE_THREADS[clientIndex % MESSAGE_THREADS.length];
    if (thread) {
      const conversationId = `${spec.id}-conv`;
      let cursor = now.getTime() - Math.floor(4 + rng() * 40) * 86400_000;

      thread.exchanges.forEach((exchange, index) => {
        cursor += Math.floor(1 + rng() * 3) * 3600_000;
        messages.push({
          id: `${conversationId}-msg-${index}`,
          firmId: spec.firmId,
          conversationId,
          authorRole: exchange.role,
          authorId: exchange.role === 'advisor' ? advisorId : spec.id,
          body: exchange.body,
          sentAt: new Date(cursor).toISOString(),
          attachmentIds: [],
        });
      });

      const last = thread.exchanges[thread.exchanges.length - 1];
      conversations.push({
        id: conversationId,
        firmId: spec.firmId,
        clientId: spec.id,
        advisorId,
        subject: thread.subject,
        updatedAt: new Date(cursor).toISOString(),
        unreadForAdvisor: last?.role === 'client' ? 1 : 0,
        unreadForClient: last?.role === 'advisor' ? 1 : 0,
      });
    }
  });

  return { interactions, appointments, conversations, messages, documents };
}
