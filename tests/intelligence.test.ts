import { describe, expect, it } from 'vitest';
import type { Client, Goal, Patrimony, ValuedInvestment } from '@/types';
import { analyzeClient } from '@/lib/intelligence/rules';
import { computeCoherenceScore } from '@/lib/intelligence/score';
import type { AnalysisContext } from '@/lib/intelligence/context';
import { analyzeInvestment } from '@/lib/intelligence/investment';

const baseClient: Client = {
  id: 'client-1',
  firmId: 'firm-1',
  firstName: 'Test',
  lastName: 'Client',
  email: 'test@exemple.demo',
  phone: '',
  birthDate: '1980-01-01',
  city: 'Paris',
  postalCode: '75000',
  profession: 'Cadre',
  maritalStatus: 'celibataire',
  matrimonialRegime: 'non_applicable',
  dependents: 0,
  riskProfile: 'equilibre',
  status: 'actif',
  horizonYears: 15,
  annualIncome: 80000,
  annualExpenses: 48000,
  taxBracketRate: 30,
  advisors: [{ advisorId: 'advisor-1', primary: true, since: '2020-01-01' }],
  createdAt: '2020-01-01',
  lastReviewAt: null,
  profileUpdatedAt: '2025-01-01',
  notes: null,
  avatarColor: '#4152ab',
};

function patrimony(overrides: Partial<Patrimony> = {}): Patrimony {
  return {
    clientId: 'client-1',
    grossAssets: 500000,
    totalDebt: 0,
    netWorth: 500000,
    liquidity: 20000,
    realEstateValue: 250000,
    financialValue: 230000,
    otherValue: 0,
    allocation: [
      { key: 'immobilier', label: 'Immobilier', bucket: 'immobilier', value: 250000, sharePct: 50 },
      { key: 'pea', label: 'PEA', bucket: 'financier', value: 230000, sharePct: 46 },
      { key: 'liquidites', label: 'Liquidités', bucket: 'liquidites', value: 20000, sharePct: 4 },
    ],
    buckets: [
      { key: 'immobilier', label: 'Immobilier', value: 250000, sharePct: 50 },
      { key: 'financier', label: 'Financier', value: 230000, sharePct: 46 },
      { key: 'liquidites', label: 'Liquidités', value: 20000, sharePct: 4 },
    ],
    history: [],
    yearPerformancePct: 4,
    ...overrides,
  };
}

function valued(overrides: Partial<ValuedInvestment> = {}): ValuedInvestment {
  return {
    id: 'inv-1',
    firmId: 'firm-1',
    clientId: 'client-1',
    accountId: 'acc-1',
    name: 'ETF Monde',
    ticker: 'CW8.PA',
    isin: null,
    type: 'etf',
    assetClass: 'etf',
    sector: 'Diversifié',
    region: 'Monde',
    quantity: 100,
    averageCost: 1000,
    fallbackPrice: 2300,
    currency: 'EUR',
    purchasedAt: '2020-01-01',
    price: 2300,
    value: 230000,
    investedAmount: 100000,
    gain: 130000,
    gainPct: 130,
    dayChangePct: 0,
    weightPct: 100,
    priceOrigin: 'live',
    priceProvider: 'Test',
    ...overrides,
  };
}

function context(overrides: Partial<AnalysisContext> = {}): AnalysisContext {
  return {
    client: baseClient,
    patrimony: patrimony(),
    accounts: [],
    investments: [valued()],
    properties: [],
    debts: [],
    goals: [],
    now: new Date('2026-01-15T00:00:00Z'),
    ...overrides,
  };
}

describe('moteur de règles PATRIMONIA INTELLIGENCE', () => {
  it('détecte une trésorerie importante non investie', () => {
    const insights = analyzeClient(
      context({
        patrimony: patrimony({ liquidity: 120000, grossAssets: 600000 }),
      }),
    );

    const idle = insights.find((item) => item.ruleId === 'liquidites-excessives');
    expect(idle).toBeDefined();
    expect(idle?.kind).toBe('opportunite');
    expect(idle?.evidence.length).toBeGreaterThan(0);
  });

  it('détecte une épargne de précaution insuffisante', () => {
    const insights = analyzeClient(context({ patrimony: patrimony({ liquidity: 2000 }) }));
    const thin = insights.find((item) => item.ruleId === 'liquidites-insuffisantes');

    expect(thin).toBeDefined();
    expect(thin?.kind).toBe('risque');
  });

  it('ne déclenche pas les deux règles de liquidité en même temps', () => {
    const insights = analyzeClient(context({ patrimony: patrimony({ liquidity: 120000, grossAssets: 600000 }) }));
    expect(insights.some((item) => item.ruleId === 'liquidites-insuffisantes')).toBe(false);
  });

  it('détecte une concentration immobilière marquée', () => {
    const insights = analyzeClient(
      context({
        patrimony: patrimony({
          buckets: [
            { key: 'immobilier', label: 'Immobilier', value: 800000, sharePct: 80 },
            { key: 'liquidites', label: 'Liquidités', value: 200000, sharePct: 20 },
          ],
        }),
      }),
    );

    const concentration = insights.find((item) => item.ruleId === 'concentration-bucket');
    expect(concentration).toBeDefined();
    expect(concentration?.severity).toBe('eleve');
  });

  it('signale un horizon court associé à une forte exposition marché', () => {
    const insights = analyzeClient(
      context({ client: { ...baseClient, horizonYears: 3, riskProfile: 'prudent' } }),
    );

    const horizon = insights.find((item) => item.ruleId === 'horizon-risque');
    expect(horizon).toBeDefined();
    expect(horizon?.severity).toBe('critique');
  });

  it('signale un profil investisseur non actualisé depuis plus de deux ans', () => {
    const insights = analyzeClient(
      context({ client: { ...baseClient, profileUpdatedAt: '2022-01-01' } }),
    );

    const stale = insights.find((item) => item.ruleId === 'profil-a-actualiser');
    expect(stale).toBeDefined();
    expect(stale?.kind).toBe('action');
  });

  it('classe les résultats par poids décroissant', () => {
    const insights = analyzeClient(context({ patrimony: patrimony({ liquidity: 2000 }) }));
    const weights = insights.map((item) => item.weight);
    expect([...weights].sort((a, b) => b - a)).toEqual(weights);
  });

  it('fournit toujours un constat, une explication et une action suggérée', () => {
    for (const insight of analyzeClient(context())) {
      expect(insight.finding.length).toBeGreaterThan(0);
      expect(insight.explanation.length).toBeGreaterThan(0);
      expect(insight.suggestedAction.length).toBeGreaterThan(0);
    }
  });

  it("détecte un objectif dont la trajectoire ne converge pas", () => {
    const goal: Goal = {
      id: 'goal-1',
      firmId: 'firm-1',
      clientId: 'client-1',
      kind: 'retraite',
      label: 'Retraite',
      targetAmount: 1000000,
      currentAmount: 10000,
      monthlyContribution: 50,
      targetDate: '2031-01-01',
      priority: 'haute',
      createdAt: '2020-01-01',
      notes: null,
    };

    const insights = analyzeClient(context({ goals: [goal] }));
    expect(insights.some((item) => item.ruleId === 'objectif-non-aligne')).toBe(true);
  });
});

describe('score de cohérence', () => {
  it('reste borné entre zéro et cent', () => {
    const score = computeCoherenceScore(context());
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
  });

  it('expose sept facteurs dont les pondérations totalisent un', () => {
    const score = computeCoherenceScore(context());
    expect(score.factors).toHaveLength(7);
    const weight = score.factors.reduce((sum, factor) => sum + factor.weight, 0);
    expect(weight).toBeCloseTo(1, 6);
  });

  it('accompagne chaque facteur d’une mesure et d’une explication', () => {
    for (const factor of computeCoherenceScore(context()).factors) {
      expect(factor.measure.length).toBeGreaterThan(0);
      expect(factor.explanation.length).toBeGreaterThan(0);
      expect(factor.score).toBeGreaterThanOrEqual(0);
      expect(factor.score).toBeLessThanOrEqual(100);
    }
  });

  it('correspond à la moyenne pondérée des facteurs', () => {
    const score = computeCoherenceScore(context());
    const expected = Math.round(
      score.factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0),
    );
    expect(score.score).toBe(expected);
  });

  it('pénalise une épargne de précaution insuffisante', () => {
    const healthy = computeCoherenceScore(context());
    const thin = computeCoherenceScore(context({ patrimony: patrimony({ liquidity: 1000 }) }));

    const healthyLiquidity = healthy.factors.find((factor) => factor.key === 'liquidites')?.score ?? 0;
    const thinLiquidity = thin.factors.find((factor) => factor.key === 'liquidites')?.score ?? 0;
    expect(thinLiquidity).toBeLessThan(healthyLiquidity);
  });

  it('associe un libellé cohérent avec la note', () => {
    const score = computeCoherenceScore(context());
    const labels = ['Excellente', 'Bonne', 'Correcte', 'Fragile', 'Insuffisante'];
    expect(labels).toContain(score.label);
  });
});

describe('analyse d’une ligne d’investissement', () => {
  it('signale la concentration et le risque de change', () => {
    const analysis = analyzeInvestment(
      valued({ currency: 'USD', type: 'action', value: 100000 }),
      { grossAssets: 400000, financialTotal: 200000, sameSectorValue: 100000 },
    );

    expect(analysis.risks.some((risk) => risk.includes('Concentration'))).toBe(true);
    expect(analysis.risks.some((risk) => risk.includes('change'))).toBe(true);
    expect(analysis.portfolioImpact.length).toBeGreaterThan(0);
  });

  it('avertit lorsque la valorisation ne provient pas du marché', () => {
    const analysis = analyzeInvestment(valued({ priceOrigin: 'fixture' }), {
      grossAssets: 400000,
      financialTotal: 200000,
      sameSectorValue: 10000,
    });

    expect(analysis.watchPoints.some((point) => point.includes('flux de marché'))).toBe(true);
  });

  it('propose toujours au moins une opportunité et un point de vigilance', () => {
    const analysis = analyzeInvestment(valued(), {
      grossAssets: 4000000,
      financialTotal: 2000000,
      sameSectorValue: 10000,
    });

    expect(analysis.opportunities.length).toBeGreaterThan(0);
    expect(analysis.watchPoints.length).toBeGreaterThan(0);
  });
});
