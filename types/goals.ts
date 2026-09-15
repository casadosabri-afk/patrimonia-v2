import type { Euro, Id, ISODate } from './common';

export type GoalKind =
  | 'retraite'
  | 'achat_immobilier'
  | 'transmission'
  | 'etudes_enfants'
  | 'creation_entreprise'
  | 'voyage'
  | 'epargne_precaution'
  | 'autre';

export type GoalPriority = 'haute' | 'moyenne' | 'basse';

export interface Goal {
  id: Id;
  firmId: Id;
  clientId: Id;
  kind: GoalKind;
  label: string;
  targetAmount: Euro;
  currentAmount: Euro;
  monthlyContribution: Euro;
  targetDate: ISODate;
  priority: GoalPriority;
  createdAt: ISODate;
  notes: string | null;
}

export interface GoalProjection {
  goal: Goal;
  progressPct: number;
  gap: Euro;
  yearsLeft: number;
  /** Capital projeté à la date cible, hypothèse de rendement central. */
  projectedAmount: Euro;
  /** Probabilité indicative issue d'une simulation simplifiée (pédagogique). */
  successProbabilityPct: number;
  requiredMonthlyContribution: Euro;
  onTrack: boolean;
}

export interface SimulationInput {
  initialCapital: Euro;
  monthlyContribution: Euro;
  annualReturnPct: number;
  years: number;
  annualInflationPct: number;
  targetAmount: Euro | null;
}

export interface SimulationPoint {
  year: number;
  pessimistic: Euro;
  central: Euro;
  optimistic: Euro;
  centralReal: Euro;
  contributed: Euro;
}

export interface SimulationResult {
  input: SimulationInput;
  points: SimulationPoint[];
  finalPessimistic: Euro;
  finalCentral: Euro;
  finalOptimistic: Euro;
  finalCentralReal: Euro;
  totalContributed: Euro;
  totalInterest: Euro;
  targetReached: boolean | null;
  assumptions: string[];
}
