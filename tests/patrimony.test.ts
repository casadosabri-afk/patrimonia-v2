import { describe, expect, it } from 'vitest';
import type { AssetAccount, Debt, Investment, RealEstateAsset } from '@/types';
import { valueInvestments } from '@/lib/patrimony/valuation';
import { computePatrimony, equityExposurePct, propertyShareValue } from '@/lib/patrimony/patrimony';
import { computeDebtMetrics, computePropertyMetrics, debtServiceRatio } from '@/lib/patrimony/debt';
import { buildNetWorthHistory } from '@/lib/patrimony/history';

const account = (id: string, kind: AssetAccount['kind'], cash: number): AssetAccount => ({
  id,
  firmId: 'firm-1',
  clientId: 'client-1',
  kind,
  label: id,
  institution: 'Banque de test',
  openedAt: '2020-01-01',
  cashBalance: cash,
  currency: 'EUR',
});

const investment = (
  id: string,
  accountId: string,
  overrides: Partial<Investment> = {},
): Investment => ({
  id,
  firmId: 'firm-1',
  clientId: 'client-1',
  accountId,
  name: id,
  ticker: id.toUpperCase(),
  isin: null,
  type: 'action',
  assetClass: 'actions',
  sector: 'Technologie',
  region: 'Europe',
  quantity: 10,
  averageCost: 100,
  fallbackPrice: 150,
  currency: 'EUR',
  purchasedAt: '2021-01-01',
  ...overrides,
});

describe('valorisation des investissements', () => {
  it('utilise le prix de marché quand il est disponible', () => {
    const [valued] = valueInvestments([investment('aapl', 'acc-1')], {
      prices: new Map([
        ['AAPL', { price: 200, currency: 'EUR', dayChangePct: 1.2, origin: 'live', provider: 'Test' }],
      ]),
      fxToEur: { EUR: 1 },
    });

    expect(valued?.price).toBe(200);
    expect(valued?.value).toBe(2000);
    expect(valued?.investedAmount).toBe(1000);
    expect(valued?.gain).toBe(1000);
    expect(valued?.gainPct).toBe(100);
    expect(valued?.priceOrigin).toBe('live');
  });

  it("retombe sur la dernière valorisation connue et le signale", () => {
    const [valued] = valueInvestments([investment('aapl', 'acc-1')], {
      prices: new Map(),
      fxToEur: { EUR: 1 },
    });

    expect(valued?.price).toBe(150);
    expect(valued?.priceOrigin).toBe('fixture');
  });

  it('convertit les cours en devise étrangère vers l’euro', () => {
    const [valued] = valueInvestments(
      [investment('msft', 'acc-1', { currency: 'USD', averageCost: 100, quantity: 5 })],
      {
        prices: new Map([
          ['MSFT', { price: 200, currency: 'USD', dayChangePct: 0, origin: 'live', provider: 'Test' }],
        ]),
        fxToEur: { EUR: 1, USD: 0.9 },
      },
    );

    // 200 USD × 0,9 = 180 € ; coût 100 USD × 0,9 = 90 €.
    expect(valued?.price).toBeCloseTo(180, 6);
    expect(valued?.value).toBeCloseTo(900, 6);
    expect(valued?.investedAmount).toBeCloseTo(450, 6);
  });

  it('calcule des poids dont la somme fait cent pour cent', () => {
    const valued = valueInvestments(
      [investment('a', 'acc-1'), investment('b', 'acc-1', { quantity: 30 })],
      { prices: new Map(), fxToEur: { EUR: 1 } },
    );

    const total = valued.reduce((sum, item) => sum + item.weightPct, 0);
    expect(total).toBeCloseTo(100, 6);
  });
});

describe('consolidation patrimoniale', () => {
  const accounts = [account('acc-cash', 'compte_courant', 20000), account('acc-pea', 'pea', 5000)];

  const properties: RealEstateAsset[] = [
    {
      id: 'prop-1',
      firmId: 'firm-1',
      clientId: 'client-1',
      label: 'Résidence principale',
      kind: 'residence_principale',
      city: 'Paris',
      postalCode: '75011',
      surfaceM2: 80,
      purchasePrice: 400000,
      currentValue: 500000,
      purchasedAt: '2015-01-01',
      monthlyRent: 0,
      monthlyCharges: 200,
      annualPropertyTax: 1200,
      ownershipPct: 100,
      linkedDebtId: 'debt-1',
    },
  ];

  const debts: Debt[] = [
    {
      id: 'debt-1',
      firmId: 'firm-1',
      clientId: 'client-1',
      label: 'Crédit immobilier',
      kind: 'credit_immobilier',
      lender: 'Banque de test',
      initialAmount: 300000,
      remainingAmount: 150000,
      annualRatePct: 1.5,
      insuranceRatePct: 0.25,
      monthlyPayment: 1500,
      startedAt: '2015-01-01',
      endsAt: '2035-01-01',
    },
  ];

  const investments = valueInvestments([investment('a', 'acc-pea', { quantity: 100, averageCost: 50 })], {
    prices: new Map([
      ['A', { price: 100, currency: 'EUR', dayChangePct: 0, origin: 'live', provider: 'Test' }],
    ]),
    fxToEur: { EUR: 1 },
  });

  const patrimony = computePatrimony({
    clientId: 'client-1',
    accounts,
    investments,
    properties,
    debts,
    history: [],
  });

  it('additionne liquidités, placements et immobilier dans l’actif brut', () => {
    // 20 000 € d'espèces + 5 000 € sur le PEA + 10 000 € de titres + 500 000 € d'immobilier.
    expect(patrimony.grossAssets).toBe(535000);
  });

  it('déduit les dettes pour obtenir le patrimoine net', () => {
    expect(patrimony.totalDebt).toBe(150000);
    expect(patrimony.netWorth).toBe(385000);
  });

  it('produit une répartition dont les parts totalisent cent pour cent', () => {
    const total = patrimony.allocation.reduce((sum, slice) => sum + slice.sharePct, 0);
    expect(total).toBeCloseTo(100, 6);
  });

  it("rattache les titres d'un PEA à la classe de l'enveloppe", () => {
    const pea = patrimony.allocation.find((slice) => slice.key === 'pea');
    expect(pea?.value).toBe(15000);
  });

  it('isole les liquidités et la valeur immobilière', () => {
    expect(patrimony.liquidity).toBe(20000);
    expect(patrimony.realEstateValue).toBe(500000);
  });

  it('mesure l’exposition actions rapportée à l’actif brut', () => {
    expect(equityExposurePct(investments, patrimony.grossAssets)).toBeCloseTo((10000 / 535000) * 100, 6);
  });

  it('prend en compte la quote-part de détention d’un bien', () => {
    const shared = { ...properties[0]!, ownershipPct: 50 };
    expect(propertyShareValue(shared)).toBe(250000);
  });
});

describe('indicateurs d’endettement et de rendement', () => {
  const debt: Debt = {
    id: 'debt-1',
    firmId: 'firm-1',
    clientId: 'client-1',
    label: 'Crédit',
    kind: 'credit_immobilier',
    lender: 'Banque de test',
    initialAmount: 200000,
    remainingAmount: 50000,
    annualRatePct: 2,
    insuranceRatePct: 0.3,
    monthlyPayment: 1000,
    startedAt: '2015-01-01',
    endsAt: '2030-01-01',
  };

  it('calcule la part de capital déjà remboursée', () => {
    expect(computeDebtMetrics(debt).repaidPct).toBe(75);
  });

  it('rapporte les mensualités aux revenus', () => {
    // 1 000 € par mois sur 60 000 € de revenus annuels, soit 20 %.
    expect(debtServiceRatio([debt], 60000)).toBeCloseTo(20, 6);
  });

  it('renvoie zéro lorsque le revenu est inconnu', () => {
    expect(debtServiceRatio([debt], 0)).toBe(0);
  });

  it('calcule rendement brut, rendement net et cash-flow d’un bien loué', () => {
    const metrics = computePropertyMetrics(
      {
        id: 'prop-2',
        firmId: 'firm-1',
        clientId: 'client-1',
        label: 'Locatif',
        kind: 'locatif',
        city: 'Rennes',
        postalCode: '35000',
        surfaceM2: 40,
        purchasePrice: 100000,
        currentValue: 120000,
        purchasedAt: '2018-01-01',
        monthlyRent: 600,
        monthlyCharges: 100,
        annualPropertyTax: 600,
        ownershipPct: 100,
        linkedDebtId: 'debt-1',
      },
      [debt],
    );

    expect(metrics.annualGrossRent).toBe(7200);
    expect(metrics.grossYieldPct).toBeCloseTo(6, 6);
    expect(metrics.annualNetRent).toBe(7200 - 1200 - 600);
    expect(metrics.monthlyCashflow).toBeCloseTo(600 - 100 - 50 - 1000, 6);
    expect(metrics.capitalGainPct).toBeCloseTo(20, 6);
  });
});

describe('historique de patrimoine', () => {
  it('produit une série se terminant sur la situation actuelle', () => {
    const history = buildNetWorthHistory({
      clientId: 'client-1',
      currentGrossAssets: 500000,
      currentDebt: 100000,
      months: 13,
      annualDriftPct: 4,
      volatility: 0.08,
      now: new Date('2026-01-15T00:00:00Z'),
    });

    expect(history).toHaveLength(13);
    expect(history[history.length - 1]?.grossAssets).toBe(500000);
    expect(history[history.length - 1]?.netWorth).toBe(400000);
  });

  it('est déterministe pour un même client', () => {
    const options = {
      clientId: 'client-1',
      currentGrossAssets: 500000,
      currentDebt: 100000,
      months: 13,
      annualDriftPct: 4,
      volatility: 0.08,
      now: new Date('2026-01-15T00:00:00Z'),
    };

    expect(buildNetWorthHistory(options)).toEqual(buildNetWorthHistory(options));
  });
});
