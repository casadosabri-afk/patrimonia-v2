import { describe, expect, it } from 'vitest';
import { MockMarketDataProvider } from '@/services/market/mockProvider';
import { MARKET_RANGES } from '@/services/market/provider';
import {
  DIRECT_LINE_ALLOWANCE,
  IFI_THRESHOLD,
  INCOME_TAX_BRACKETS,
  applyBrackets,
  simulateIfi,
  simulateIncomeTax,
  simulateTransmission,
} from '@/lib/tax/france';

describe('fournisseur de données de marché de démonstration', () => {
  const provider = new MockMarketDataProvider();

  it("se déclare explicitement comme non réel", () => {
    expect(provider.isLive).toBe(false);
    expect(provider.label).toContain('DEMO');
  });

  it('renvoie une cotation exploitable pour un ticker connu', async () => {
    const quote = await provider.getQuote('AAPL');
    expect(quote).not.toBeNull();
    expect(quote?.price).toBeGreaterThan(0);
    expect(quote?.currency).toBe('USD');
  });

  it('produit des séries déterministes', async () => {
    const first = await provider.getHistoricalPrices('AAPL', '1M');
    const second = await provider.getHistoricalPrices('AAPL', '1M');
    expect(first?.points).toEqual(second?.points);
  });

  it('couvre toutes les plages temporelles proposées', async () => {
    for (const range of MARKET_RANGES) {
      const series = await provider.getHistoricalPrices('CW8.PA', range);
      expect(series?.points.length ?? 0).toBeGreaterThan(1);
    }
  });

  it('allonge la série avec la plage demandée', async () => {
    const month = await provider.getHistoricalPrices('CW8.PA', '1M');
    const year = await provider.getHistoricalPrices('CW8.PA', '1A');
    expect(year!.points.length).toBeGreaterThan(month!.points.length);
  });

  it('renvoie les indices suivis et un taux de change vers l’euro', async () => {
    expect((await provider.getIndexData()).length).toBeGreaterThan(0);
    const fx = await provider.getFxToEur(['USD']);
    expect(fx.EUR).toBe(1);
    expect(fx.USD).toBeGreaterThan(0);
  });

  it('identifie ses actualités comme des contenus de démonstration', async () => {
    const news = await provider.getNews(undefined, 3);
    expect(news).toHaveLength(3);
    expect(news.every((item) => item.source.includes('DEMO'))).toBe(true);
  });
});

describe('barèmes fiscaux pédagogiques', () => {
  it("n'impose pas la première tranche", () => {
    expect(applyBrackets(10000, INCOME_TAX_BRACKETS).total).toBe(0);
  });

  it('applique le barème par tranches successives', () => {
    // 20 000 € : 11 294 € à 0 %, le reste à 11 %.
    const result = applyBrackets(20000, INCOME_TAX_BRACKETS);
    expect(result.total).toBeCloseTo((20000 - 11294) * 0.11, 6);
    expect(result.marginalRate).toBe(11);
  });

  it("applique l'abattement de dix pour cent sur le revenu", () => {
    const result = simulateIncomeTax({ annualIncome: 50000, parts: 1 });
    expect(result.taxableIncome).toBeCloseTo(45000, 6);
  });

  it('réduit l’impôt lorsque le nombre de parts augmente', () => {
    const single = simulateIncomeTax({ annualIncome: 90000, parts: 1 });
    const couple = simulateIncomeTax({ annualIncome: 90000, parts: 2 });
    expect(couple.totalTax).toBeLessThan(single.totalTax);
  });

  it('maintient un taux moyen inférieur au taux marginal', () => {
    const result = simulateIncomeTax({ annualIncome: 120000, parts: 1 });
    expect(result.averageRate).toBeLessThan(result.marginalRate);
  });

  it("n'assujettit pas à l'IFI en dessous du seuil", () => {
    const result = simulateIfi({
      realEstateValue: 900000,
      primaryResidenceValue: 500000,
      realEstateDebt: 200000,
    });

    expect(result.taxableBase).toBeLessThan(IFI_THRESHOLD);
    expect(result.liable).toBe(false);
    expect(result.totalTax).toBe(0);
  });

  it("applique l'abattement de trente pour cent sur la résidence principale", () => {
    const result = simulateIfi({
      realEstateValue: 3000000,
      primaryResidenceValue: 1000000,
      realEstateDebt: 0,
    });

    expect(result.taxableBase).toBe(3000000 - 300000);
    expect(result.liable).toBe(true);
    expect(result.totalTax).toBeGreaterThan(0);
  });

  it('exonère une transmission couverte par l’abattement', () => {
    const result = simulateTransmission({ estateValue: DIRECT_LINE_ALLOWANCE, children: 1 });
    expect(result.taxableBase).toBe(0);
    expect(result.taxPerChild).toBe(0);
  });

  it('réduit les droits lorsque la succession est partagée entre plusieurs enfants', () => {
    const one = simulateTransmission({ estateValue: 900000, children: 1 });
    const three = simulateTransmission({ estateValue: 900000, children: 3 });
    expect(three.totalTax).toBeLessThan(one.totalTax);
  });

  it('laisse un net par enfant inférieur à la part brute', () => {
    const result = simulateTransmission({ estateValue: 900000, children: 2 });
    expect(result.netPerChild).toBeLessThan(result.grossPerChild);
    expect(result.effectiveRate).toBeGreaterThan(0);
  });
});
