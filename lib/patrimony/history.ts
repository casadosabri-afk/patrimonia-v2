import type { NetWorthPoint } from '@/types';
import { createRng, gaussian, seedFrom } from '@/lib/utils/random';

/**
 * Construit l'historique de patrimoine net d'un client.
 *
 * ⚠️ DONNÉE DE DÉMONSTRATION : l'historique est reconstitué à partir de la
 * situation actuelle et d'une trajectoire pseudo-aléatoire déterministe. Il ne
 * provient d'aucun relevé réel et l'interface l'indique.
 */
export function buildNetWorthHistory(options: {
  clientId: string;
  currentGrossAssets: number;
  currentDebt: number;
  months: number;
  /** Progression annuelle moyenne visée sur la période, en pourcentage. */
  annualDriftPct: number;
  volatility: number;
  now?: Date;
}): NetWorthPoint[] {
  const { clientId, currentGrossAssets, currentDebt, months, annualDriftPct, volatility } = options;
  const now = options.now ?? new Date();
  const rng = createRng(seedFrom(`history:${clientId}`));

  // Trajectoire construite à rebours depuis la situation actuelle.
  const monthlyDrift = annualDriftPct / 100 / 12;
  const shocks: number[] = [];
  for (let index = 0; index < months; index += 1) {
    shocks.push(gaussian(rng) * (volatility / Math.sqrt(12)));
  }

  const points: NetWorthPoint[] = [];
  let gross = currentGrossAssets;
  let debt = currentDebt;

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
    points.unshift({
      date: `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-01`,
      netWorth: Math.round(gross - debt),
      grossAssets: Math.round(gross),
      debt: Math.round(debt),
    });
    const shock = shocks[index] ?? 0;
    gross = gross / (1 + monthlyDrift + shock);
    // Le capital restant dû décroît avec le temps : à rebours, il augmente.
    debt = debt * 1.0042;
  }

  return points;
}
