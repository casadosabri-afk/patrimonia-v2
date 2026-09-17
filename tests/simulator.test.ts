import { describe, expect, it } from 'vitest';
import type { Goal } from '@/types';
import {
  CENTRAL_RETURN_PCT,
  futureValue,
  projectGoal,
  requiredMonthlyContribution,
  runSimulation,
} from '@/lib/patrimony/goals';

describe('capitalisation', () => {
  it('rend le capital initial pour une durée nulle', () => {
    expect(futureValue(10000, 500, 5, 0)).toBe(10000);
  });

  it('additionne simplement les versements à rendement nul', () => {
    expect(futureValue(1000, 100, 0, 2)).toBeCloseTo(1000 + 100 * 24, 6);
  });

  it('capitalise un capital initial au taux annuel indiqué', () => {
    // 10 000 € à 6 % pendant un an, capitalisation mensuelle.
    expect(futureValue(10000, 0, 6, 1)).toBeCloseTo(10000 * (1 + 0.06 / 12) ** 12, 6);
  });

  it('croît avec la durée et avec le rendement', () => {
    expect(futureValue(10000, 200, 5, 10)).toBeGreaterThan(futureValue(10000, 200, 5, 5));
    expect(futureValue(10000, 200, 7, 10)).toBeGreaterThan(futureValue(10000, 200, 4, 10));
  });

  it("calcule l'effort mensuel nécessaire pour atteindre une cible", () => {
    const needed = requiredMonthlyContribution(10000, 50000, 5, 10);
    expect(futureValue(10000, needed, 5, 10)).toBeCloseTo(50000, 4);
  });

  it("renvoie zéro d'effort lorsque la cible est déjà dépassée", () => {
    expect(requiredMonthlyContribution(60000, 50000, 5, 10)).toBe(0);
  });
});

describe('simulateur patrimonial', () => {
  const input = {
    initialCapital: 50000,
    monthlyContribution: 500,
    annualReturnPct: 4.5,
    years: 20,
    annualInflationPct: 2,
    targetAmount: 250000,
  };

  it('ordonne les trois scénarios', () => {
    const result = runSimulation(input);
    expect(result.finalPessimistic).toBeLessThan(result.finalCentral);
    expect(result.finalCentral).toBeLessThan(result.finalOptimistic);
  });

  it('produit un point par année, borne incluse', () => {
    const result = runSimulation(input);
    expect(result.points).toHaveLength(21);
    expect(result.points[0]?.year).toBe(0);
    expect(result.points[20]?.year).toBe(20);
  });

  it('démarre au capital initial', () => {
    const result = runSimulation(input);
    expect(result.points[0]?.central).toBe(input.initialCapital);
  });

  it('sépare versements cumulés et intérêts', () => {
    const result = runSimulation(input);
    expect(result.totalContributed).toBe(50000 + 500 * 12 * 20);
    expect(result.totalInterest).toBeCloseTo(result.finalCentral - result.totalContributed, 6);
  });

  it('exprime un capital réel inférieur au capital nominal quand il y a de l’inflation', () => {
    const result = runSimulation(input);
    expect(result.finalCentralReal).toBeLessThan(result.finalCentral);
  });

  it('indique si la cible est atteinte', () => {
    expect(runSimulation({ ...input, targetAmount: 10000 }).targetReached).toBe(true);
    expect(runSimulation({ ...input, targetAmount: 100_000_000 }).targetReached).toBe(false);
    expect(runSimulation({ ...input, targetAmount: null }).targetReached).toBeNull();
  });

  it('expose systématiquement ses hypothèses', () => {
    const result = runSimulation(input);
    expect(result.assumptions.length).toBeGreaterThanOrEqual(5);
    expect(result.assumptions.join(' ')).toContain('pédagogique');
  });

  it('borne la durée dans une plage exploitable', () => {
    expect(runSimulation({ ...input, years: 0 }).input.years).toBe(1);
    expect(runSimulation({ ...input, years: 500 }).input.years).toBe(60);
  });
});

describe('projection d’objectif', () => {
  const goal: Goal = {
    id: 'goal-1',
    firmId: 'firm-1',
    clientId: 'client-1',
    kind: 'retraite',
    label: 'Retraite',
    targetAmount: 200000,
    currentAmount: 100000,
    monthlyContribution: 500,
    targetDate: '2036-01-15',
    priority: 'haute',
    createdAt: '2020-01-01',
    notes: null,
  };

  const now = new Date('2026-01-15T00:00:00Z');

  it('mesure la progression déjà réalisée', () => {
    expect(projectGoal(goal, now).progressPct).toBeCloseTo(50, 1);
  });

  it('projette le capital à la date cible au rendement central', () => {
    const projection = projectGoal(goal, now);
    expect(projection.projectedAmount).toBeCloseTo(
      futureValue(goal.currentAmount, goal.monthlyContribution, CENTRAL_RETURN_PCT, projection.yearsLeft),
      2,
    );
  });

  it("marque l'objectif atteint lorsque l'écart est comblé", () => {
    const projection = projectGoal({ ...goal, targetAmount: 120000 }, now);
    expect(projection.onTrack).toBe(true);
    expect(projection.gap).toBeLessThanOrEqual(0);
  });

  it('borne la probabilité indicative entre deux et quatre-vingt-dix-huit pour cent', () => {
    const impossible = projectGoal({ ...goal, targetAmount: 50_000_000 }, now);
    const easy = projectGoal({ ...goal, targetAmount: 1000 }, now);

    expect(impossible.successProbabilityPct).toBeGreaterThanOrEqual(2);
    expect(easy.successProbabilityPct).toBeLessThanOrEqual(98);
    expect(impossible.successProbabilityPct).toBeLessThan(easy.successProbabilityPct);
  });

  it('ne renvoie jamais de durée restante négative', () => {
    expect(projectGoal({ ...goal, targetDate: '2020-01-01' }, now).yearsLeft).toBe(0);
  });
});
