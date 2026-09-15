import type { Id } from './common';

export type InsightKind = 'risque' | 'opportunite' | 'information' | 'action';

export type InsightSeverity = 'critique' | 'eleve' | 'moyen' | 'faible';

export interface Insight {
  id: string;
  ruleId: string;
  clientId: Id;
  kind: InsightKind;
  severity: InsightSeverity;
  title: string;
  /** Constat factuel, formulé à partir des données du client. */
  finding: string;
  /** Explication pédagogique du mécanisme observé. */
  explanation: string;
  /** Piste d'analyse proposée au conseiller (jamais un conseil réglementé). */
  suggestedAction: string;
  /** Chiffres ayant déclenché la règle, affichés pour rendre l'analyse vérifiable. */
  evidence: { label: string; value: string }[];
  /** Poids de l'insight dans le tri du dashboard (0-100). */
  weight: number;
}

export interface ScoreFactor {
  key:
    | 'diversification'
    | 'objectifs'
    | 'liquidites'
    | 'risque'
    | 'horizon'
    | 'concentration'
    | 'endettement';
  label: string;
  /** Note du facteur sur 100. */
  score: number;
  /** Pondération du facteur dans le score global (somme = 1). */
  weight: number;
  /** Phrase expliquant la note obtenue. */
  explanation: string;
  measure: string;
}

export interface CoherenceScore {
  clientId: Id;
  score: number;
  label: 'Excellente' | 'Bonne' | 'Correcte' | 'Fragile' | 'Insuffisante';
  factors: ScoreFactor[];
  strengths: string[];
  weaknesses: string[];
}
