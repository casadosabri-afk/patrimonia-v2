import type {
  AccountKind,
  AlertCategory,
  AlertSeverity,
  AlertStatus,
  AssetBucket,
  AssetClass,
  AppointmentKind,
  DebtKind,
  DocumentKind,
  GoalKind,
  InteractionKind,
  MaritalStatus,
  MatrimonialRegime,
  PropertyKind,
  RiskProfile,
  Role,
  ClientStatus,
  InstrumentType,
} from '@/types';

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  immobilier: 'Immobilier',
  liquidites: 'Liquidités',
  actions: 'Actions',
  etf: 'ETF',
  obligations: 'Obligations',
  assurance_vie: 'Assurance-vie',
  pea: 'PEA',
  compte_titres: 'Compte-titres',
  per: 'PER',
  crypto: 'Crypto',
  private_equity: 'Private equity',
  autres: 'Autres actifs',
};

export const ASSET_CLASS_BUCKET: Record<AssetClass, AssetBucket> = {
  immobilier: 'immobilier',
  liquidites: 'liquidites',
  actions: 'financier',
  etf: 'financier',
  obligations: 'financier',
  assurance_vie: 'financier',
  pea: 'financier',
  compte_titres: 'financier',
  per: 'financier',
  crypto: 'autres',
  private_equity: 'autres',
  autres: 'autres',
};

export const BUCKET_LABELS: Record<AssetBucket, string> = {
  immobilier: 'Immobilier',
  financier: 'Financier',
  liquidites: 'Liquidités',
  autres: 'Autres',
};

export const ACCOUNT_KIND_LABELS: Record<AccountKind, string> = {
  pea: 'PEA',
  compte_titres: 'Compte-titres',
  assurance_vie: 'Assurance-vie',
  per: 'PER',
  livret: 'Livret',
  compte_courant: 'Compte courant',
  crypto: 'Portefeuille crypto',
  private_equity: 'Private equity',
};

export const INSTRUMENT_TYPE_LABELS: Record<InstrumentType, string> = {
  action: 'Action',
  etf: 'ETF',
  obligation: 'Obligation',
  fonds: 'Fonds',
  crypto: 'Crypto-actif',
  non_cote: 'Non coté',
};

export const RISK_PROFILE_LABELS: Record<RiskProfile, string> = {
  prudent: 'Prudent',
  equilibre: 'Équilibré',
  dynamique: 'Dynamique',
  offensif: 'Offensif',
};

/** Part actions cible indicative par profil, utilisée par l'analyse pédagogique. */
export const RISK_PROFILE_EQUITY_TARGET: Record<RiskProfile, { min: number; max: number }> = {
  prudent: { min: 5, max: 25 },
  equilibre: { min: 25, max: 50 },
  dynamique: { min: 45, max: 70 },
  offensif: { min: 65, max: 90 },
};

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  actif: 'Actif',
  prospect: 'Prospect',
  archive: 'Archivé',
};

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  celibataire: 'Célibataire',
  marie: 'Marié(e)',
  pacse: 'Pacsé(e)',
  divorce: 'Divorcé(e)',
  veuf: 'Veuf(ve)',
};

export const MATRIMONIAL_REGIME_LABELS: Record<MatrimonialRegime, string> = {
  communaute_reduite: 'Communauté réduite aux acquêts',
  separation_biens: 'Séparation de biens',
  communaute_universelle: 'Communauté universelle',
  participation_acquets: 'Participation aux acquêts',
  non_applicable: 'Non applicable',
};

export const PROPERTY_KIND_LABELS: Record<PropertyKind, string> = {
  residence_principale: 'Résidence principale',
  residence_secondaire: 'Résidence secondaire',
  locatif: 'Investissement locatif',
  scpi: 'SCPI',
  terrain: 'Terrain',
  commercial: 'Local commercial',
};

export const DEBT_KIND_LABELS: Record<DebtKind, string> = {
  credit_immobilier: 'Crédit immobilier',
  credit_consommation: 'Crédit consommation',
  credit_travaux: 'Crédit travaux',
  autre: 'Autre dette',
};

export const GOAL_KIND_LABELS: Record<GoalKind, string> = {
  retraite: 'Retraite',
  achat_immobilier: 'Achat immobilier',
  transmission: 'Transmission',
  etudes_enfants: 'Études des enfants',
  creation_entreprise: "Création d'entreprise",
  voyage: 'Voyage',
  epargne_precaution: 'Épargne de précaution',
  autre: 'Autre projet',
};

export const INTERACTION_KIND_LABELS: Record<InteractionKind, string> = {
  appel: 'Appel',
  email: 'Email',
  rendez_vous: 'Rendez-vous',
  note: 'Note',
  tache: 'Tâche',
  document: 'Document',
};

export const APPOINTMENT_KIND_LABELS: Record<AppointmentKind, string> = {
  bilan_annuel: 'Bilan annuel',
  point_investissement: 'Point investissement',
  signature: 'Signature',
  decouverte: 'Rendez-vous découverte',
  suivi: 'Suivi',
};

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  releve: 'Relevé',
  justificatif: 'Justificatif',
  rapport: 'Rapport',
  contrat: 'Contrat',
  fiscal: 'Document fiscal',
  autre: 'Autre',
};

export const ALERT_CATEGORY_LABELS: Record<AlertCategory, string> = {
  risque: 'Risque',
  opportunite: 'Opportunité',
  marche: 'Marché',
  client: 'Client',
  administratif: 'Administratif',
};

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  critique: 'Critique',
  eleve: 'Élevé',
  moyen: 'Moyen',
  faible: 'Faible',
};

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  ouverte: 'Ouverte',
  en_cours: 'En cours',
  traitee: 'Traitée',
  ignoree: 'Ignorée',
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrateur',
  advisor: 'Conseiller',
  client: 'Client',
};
