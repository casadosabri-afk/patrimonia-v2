import type { Goal, GoalProjection, SimulationInput, SimulationPoint, SimulationResult } from '@/types';
import { yearsUntil } from '@/lib/utils/dates';

/** Hypothèse de rendement central retenue pour les projections d'objectifs. */
export const CENTRAL_RETURN_PCT = 4.5;

/** Écart appliqué au scénario pessimiste et au scénario optimiste. */
export const SCENARIO_SPREAD_PCT = 3;

/** Capitalisation d'un capital initial et de versements mensuels constants. */
export function futureValue(
  initialCapital: number,
  monthlyContribution: number,
  annualReturnPct: number,
  years: number,
): number {
  const months = Math.max(0, Math.round(years * 12));
  const monthlyRate = annualReturnPct / 100 / 12;

  if (months === 0) return initialCapital;
  if (Math.abs(monthlyRate) < 1e-9) return initialCapital + monthlyContribution * months;

  const growth = (1 + monthlyRate) ** months;
  return initialCapital * growth + monthlyContribution * ((growth - 1) / monthlyRate);
}

/** Versement mensuel nécessaire pour atteindre un montant cible. */
export function requiredMonthlyContribution(
  initialCapital: number,
  targetAmount: number,
  annualReturnPct: number,
  years: number,
): number {
  const months = Math.max(0, Math.round(years * 12));
  if (months === 0) return Math.max(0, targetAmount - initialCapital);

  const monthlyRate = annualReturnPct / 100 / 12;
  if (Math.abs(monthlyRate) < 1e-9) {
    return Math.max(0, (targetAmount - initialCapital) / months);
  }

  const growth = (1 + monthlyRate) ** months;
  const needed = (targetAmount - initialCapital * growth) / ((growth - 1) / monthlyRate);
  return Math.max(0, needed);
}

/**
 * Projette un objectif à sa date cible.
 *
 * ⚠️ Projection pédagogique : elle repose sur un rendement constant et ne
 * garantit aucun résultat.
 */
export function projectGoal(goal: Goal, now = new Date()): GoalProjection {
  const yearsLeft = Math.max(0, yearsUntil(goal.targetDate, now));
  const projectedAmount = futureValue(
    goal.currentAmount,
    goal.monthlyContribution,
    CENTRAL_RETURN_PCT,
    yearsLeft,
  );
  const gap = goal.targetAmount - projectedAmount;
  const progressPct =
    goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;

  // Probabilité indicative : rapport entre capital projeté et cible, borné,
  // pondéré par la durée restante (plus l'échéance est lointaine, plus l'écart
  // reste rattrapable).
  const ratio = goal.targetAmount > 0 ? projectedAmount / goal.targetAmount : 1;
  const horizonBonus = Math.min(12, yearsLeft) / 12;
  const raw = ratio >= 1 ? 88 + Math.min(10, (ratio - 1) * 40) : 100 * ratio ** 1.6 * (0.75 + 0.25 * horizonBonus);
  const successProbabilityPct = Math.max(2, Math.min(98, raw));

  return {
    goal,
    progressPct,
    gap,
    yearsLeft,
    projectedAmount,
    successProbabilityPct,
    requiredMonthlyContribution: requiredMonthlyContribution(
      goal.currentAmount,
      goal.targetAmount,
      CENTRAL_RETURN_PCT,
      yearsLeft,
    ),
    onTrack: gap <= 0,
  };
}

/**
 * Simulateur patrimonial à trois scénarios.
 *
 * Les hypothèses sont retournées avec le résultat afin d'être affichées : une
 * simulation dont les hypothèses ne sont pas visibles n'est pas exploitable.
 */
export function runSimulation(input: SimulationInput): SimulationResult {
  const years = Math.max(1, Math.min(60, Math.round(input.years)));
  const pessimisticRate = input.annualReturnPct - SCENARIO_SPREAD_PCT;
  const optimisticRate = input.annualReturnPct + SCENARIO_SPREAD_PCT;

  const points: SimulationPoint[] = [];
  for (let year = 0; year <= years; year += 1) {
    const contributed = input.initialCapital + input.monthlyContribution * 12 * year;
    const central = futureValue(input.initialCapital, input.monthlyContribution, input.annualReturnPct, year);
    const inflationFactor = (1 + input.annualInflationPct / 100) ** year;

    points.push({
      year,
      pessimistic: Math.round(
        futureValue(input.initialCapital, input.monthlyContribution, pessimisticRate, year),
      ),
      central: Math.round(central),
      optimistic: Math.round(
        futureValue(input.initialCapital, input.monthlyContribution, optimisticRate, year),
      ),
      centralReal: Math.round(central / inflationFactor),
      contributed: Math.round(contributed),
    });
  }

  const last = points[points.length - 1];
  const finalCentral = last?.central ?? input.initialCapital;
  const totalContributed = last?.contributed ?? input.initialCapital;

  return {
    input: { ...input, years },
    points,
    finalPessimistic: last?.pessimistic ?? input.initialCapital,
    finalCentral,
    finalOptimistic: last?.optimistic ?? input.initialCapital,
    finalCentralReal: last?.centralReal ?? input.initialCapital,
    totalContributed,
    totalInterest: finalCentral - totalContributed,
    targetReached: input.targetAmount === null ? null : finalCentral >= input.targetAmount,
    assumptions: [
      `Rendement annuel central retenu : ${input.annualReturnPct.toFixed(1)} %, constant sur toute la durée.`,
      `Scénarios encadrants : ${pessimisticRate.toFixed(1)} % et ${optimisticRate.toFixed(1)} %.`,
      `Inflation annuelle retenue : ${input.annualInflationPct.toFixed(1)} % pour le calcul en euros constants.`,
      'Versements mensuels constants, effectués en début de mois, sans revalorisation.',
      'Fiscalité, frais de gestion et frais de versement non pris en compte.',
      'Simulation pédagogique : les rendements passés ne préjugent pas des rendements futurs.',
    ],
  };
}
