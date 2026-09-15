import type {
  AssetAccount,
  Client,
  Debt,
  Goal,
  Patrimony,
  RealEstateAsset,
  ValuedInvestment,
} from '@/types';

/** Ensemble des données nécessaires à l'analyse d'un client. */
export interface AnalysisContext {
  client: Client;
  patrimony: Patrimony;
  accounts: AssetAccount[];
  investments: ValuedInvestment[];
  properties: RealEstateAsset[];
  debts: Debt[];
  goals: Goal[];
  now: Date;
}

export function monthlyExpenses(client: Client): number {
  return client.annualExpenses / 12;
}

/** Nombre de mois de dépenses couverts par les liquidités disponibles. */
export function liquidityMonths(context: AnalysisContext): number {
  const monthly = monthlyExpenses(context.client);
  if (monthly <= 0) return 0;
  return context.patrimony.liquidity / monthly;
}

/** Indice de Herfindahl-Hirschman normalisé (0 = diversifié, 1 = concentré). */
export function concentrationIndex(shares: number[]): number {
  const total = shares.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return 0;
  return shares.reduce((sum, value) => {
    const weight = value / total;
    return sum + weight * weight;
  }, 0);
}
