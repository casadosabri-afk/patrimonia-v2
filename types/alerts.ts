import type { Id, ISODate } from './common';

export type AlertCategory = 'risque' | 'opportunite' | 'marche' | 'client' | 'administratif';

export type AlertSeverity = 'critique' | 'eleve' | 'moyen' | 'faible';

export type AlertStatus = 'ouverte' | 'en_cours' | 'traitee' | 'ignoree';

export interface AlertComment {
  id: Id;
  authorId: Id;
  authorLabel: string;
  body: string;
  createdAt: ISODate;
}

export interface Alert {
  id: Id;
  firmId: Id;
  clientId: Id | null;
  category: AlertCategory;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  suggestedAction: string;
  assigneeId: Id | null;
  createdAt: ISODate;
  resolvedAt: ISODate | null;
  comments: AlertComment[];
  /** Identifiant de la règle PATRIMONIA INTELLIGENCE à l'origine de l'alerte. */
  ruleId: string | null;
}
