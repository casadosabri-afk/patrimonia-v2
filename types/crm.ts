import type { Id, ISODate } from './common';

export type InteractionKind = 'appel' | 'email' | 'rendez_vous' | 'note' | 'tache' | 'document';

export type InteractionStatus = 'a_faire' | 'en_cours' | 'termine';

export interface Interaction {
  id: Id;
  firmId: Id;
  clientId: Id;
  advisorId: Id;
  kind: InteractionKind;
  title: string;
  body: string;
  status: InteractionStatus;
  occurredAt: ISODate;
  dueAt: ISODate | null;
  createdAt: ISODate;
}

export type AppointmentKind = 'bilan_annuel' | 'point_investissement' | 'signature' | 'decouverte' | 'suivi';

export type AppointmentStatus = 'planifie' | 'confirme' | 'annule' | 'realise';

export interface Appointment {
  id: Id;
  firmId: Id;
  clientId: Id;
  advisorId: Id;
  kind: AppointmentKind;
  title: string;
  startsAt: ISODate;
  durationMin: number;
  location: string;
  status: AppointmentStatus;
  notes: string | null;
}

export interface Conversation {
  id: Id;
  firmId: Id;
  clientId: Id;
  advisorId: Id;
  subject: string;
  updatedAt: ISODate;
  unreadForAdvisor: number;
  unreadForClient: number;
}

export interface Message {
  id: Id;
  firmId: Id;
  conversationId: Id;
  authorRole: 'advisor' | 'client';
  authorId: Id;
  body: string;
  sentAt: ISODate;
  attachmentIds: Id[];
}

export type DocumentKind = 'releve' | 'justificatif' | 'rapport' | 'contrat' | 'fiscal' | 'autre';

export interface StoredDocument {
  id: Id;
  firmId: Id;
  clientId: Id;
  kind: DocumentKind;
  name: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: ISODate;
  uploadedBy: Id;
  /** Chemin dans le bucket Supabase Storage. `null` en mode démonstration. */
  storagePath: string | null;
  /** `true` lorsque le fichier est un document fictif du jeu de démonstration. */
  demo: boolean;
  visibleToClient: boolean;
}
