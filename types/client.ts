import type { Euro, Id, ISODate } from './common';

export type RiskProfile = 'prudent' | 'equilibre' | 'dynamique' | 'offensif';

export type ClientStatus = 'actif' | 'prospect' | 'archive';

export type MaritalStatus =
  | 'celibataire'
  | 'marie'
  | 'pacse'
  | 'divorce'
  | 'veuf';

export type MatrimonialRegime =
  | 'communaute_reduite'
  | 'separation_biens'
  | 'communaute_universelle'
  | 'participation_acquets'
  | 'non_applicable';

export interface ClientAdvisorLink {
  advisorId: Id;
  /** `true` pour le conseiller principal, `false` pour un conseiller associé. */
  primary: boolean;
  since: ISODate;
}

export interface Client {
  id: Id;
  firmId: Id;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: ISODate;
  city: string;
  postalCode: string;
  profession: string;
  maritalStatus: MaritalStatus;
  matrimonialRegime: MatrimonialRegime;
  dependents: number;
  riskProfile: RiskProfile;
  status: ClientStatus;
  /** Horizon d'investissement déclaré, en années. */
  horizonYears: number;
  annualIncome: Euro;
  annualExpenses: Euro;
  taxBracketRate: number;
  advisors: ClientAdvisorLink[];
  createdAt: ISODate;
  lastReviewAt: ISODate | null;
  /** Date de la dernière actualisation du profil investisseur (KYC démo). */
  profileUpdatedAt: ISODate;
  notes: string | null;
  avatarColor: string;
}

export interface ClientSummary {
  client: Client;
  netWorth: Euro;
  grossAssets: Euro;
  totalDebt: Euro;
  liquidity: Euro;
  realEstateValue: Euro;
  financialValue: Euro;
  otherValue: Euro;
  yearPerformancePct: number;
  openAlerts: number;
  coherenceScore: number;
  primaryAdvisorId: Id | null;
  lastInteractionAt: ISODate | null;
}
