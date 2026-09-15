import type {
  CompanyFinancials,
  CompanyProfile,
  HistoricalSeries,
  IndexSnapshot,
  MacroIndicator,
  MarketRange,
  NewsItem,
  PricePoint,
  Quote,
} from '@/types';
import { INSTRUMENT_BY_TICKER, TRACKED_INDICES } from '@/data/demo/instruments';
import { createRng, gaussian, seedFrom } from '@/lib/utils/random';
import { toISODate } from '@/lib/utils/dates';
import { RANGE_CONFIG, type MarketDataProvider } from './provider';

/**
 * Fournisseur de DÉMONSTRATION.
 *
 * ⚠️ Les prix produits ici sont SIMULÉS. Ils ne correspondent à aucun cours réel.
 * Toute réponse issue de ce fournisseur est marquée `origin: 'mock'` et
 * l'interface l'affiche explicitement comme donnée de démonstration.
 *
 * La trajectoire est déterministe (marche aléatoire à graine fixe) afin que la
 * démonstration reste reproductible d'une session à l'autre.
 */
export class MockMarketDataProvider implements MarketDataProvider {
  readonly id = 'mock';
  readonly label = 'Données simulées (DEMO)';
  readonly isLive = false;

  private reference(symbol: string): { price: number; volatility: number; drift: number; name: string; currency: string } {
    const instrument = INSTRUMENT_BY_TICKER.get(symbol);
    if (instrument) {
      return {
        price: instrument.fallbackPrice,
        volatility: instrument.volatility,
        drift: instrument.drift,
        name: instrument.name,
        currency: instrument.currency,
      };
    }
    const index = TRACKED_INDICES.find((item) => item.symbol === symbol);
    if (index) {
      return {
        price: index.fallbackValue,
        volatility: index.volatility,
        drift: 0.06,
        name: index.name,
        currency: index.currency,
      };
    }
    const rng = createRng(seedFrom(symbol));
    return { price: 50 + rng() * 150, volatility: 0.25, drift: 0.07, name: symbol, currency: 'EUR' };
  }

  /** Série journalière déterministe se terminant aujourd'hui. */
  private series(symbol: string, days: number): PricePoint[] {
    const { price, volatility, drift } = this.reference(symbol);
    const rng = createRng(seedFrom(`series:${symbol}`));
    const dailyVol = volatility / Math.sqrt(252);
    const dailyDrift = drift / 252;

    // Construction à rebours pour que le dernier point vaille le prix de référence.
    const shocks: number[] = [];
    for (let index = 0; index < days; index += 1) shocks.push(gaussian(rng) * dailyVol);

    const closes: number[] = new Array(days).fill(0);
    let current = price;
    for (let index = days - 1; index >= 0; index -= 1) {
      closes[index] = current;
      current = current / (1 + dailyDrift + (shocks[index] ?? 0));
    }

    const today = new Date();
    return closes.map((close, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (days - 1 - index));
      const rounded = Math.round(close * 10000) / 10000;
      return {
        date: toISODate(date),
        close: rounded,
        open: Math.round(rounded * 0.998 * 10000) / 10000,
        high: Math.round(rounded * 1.006 * 10000) / 10000,
        low: Math.round(rounded * 0.994 * 10000) / 10000,
      } satisfies PricePoint;
    });
  }

  async getQuote(symbol: string): Promise<Quote | null> {
    const { name, currency } = this.reference(symbol);
    const points = this.series(symbol, 3);
    const last = points[points.length - 1];
    const previous = points[points.length - 2];
    if (!last || !previous) return null;

    const change = last.close - previous.close;
    return {
      symbol,
      name,
      price: last.close,
      currency,
      change,
      changePct: previous.close > 0 ? (change / previous.close) * 100 : 0,
      previousClose: previous.close,
      dayHigh: last.high ?? null,
      dayLow: last.low ?? null,
      marketCap: null,
      updatedAt: new Date().toISOString(),
    };
  }

  async getQuotes(symbols: string[]): Promise<Map<string, Quote>> {
    const result = new Map<string, Quote>();
    for (const symbol of symbols) {
      const quote = await this.getQuote(symbol);
      if (quote) result.set(symbol, quote);
    }
    return result;
  }

  async getHistoricalPrices(symbol: string, range: MarketRange): Promise<HistoricalSeries | null> {
    const config = RANGE_CONFIG[range];
    const points = this.series(symbol, Math.max(2, Math.min(config.days, 2600)));
    const first = points[0];
    const last = points[points.length - 1];
    if (!first || !last) return null;

    return {
      symbol,
      range,
      points,
      changePct: first.close > 0 ? ((last.close - first.close) / first.close) * 100 : 0,
    };
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
    const instrument = INSTRUMENT_BY_TICKER.get(symbol);
    if (!instrument) return null;

    return {
      symbol,
      name: instrument.name,
      sector: instrument.sector,
      industry: instrument.sector,
      country: instrument.region,
      currency: instrument.currency,
      description:
        "Fiche descriptive de démonstration. Les caractéristiques de l'instrument sont réelles ; la description détaillée et les agrégats financiers proviennent du fournisseur de données configuré.",
      website: null,
      employees: null,
    };
  }

  async getFinancials(symbol: string): Promise<CompanyFinancials | null> {
    const instrument = INSTRUMENT_BY_TICKER.get(symbol);
    if (!instrument) return null;
    const rng = createRng(seedFrom(`fin:${symbol}`));
    const price = instrument.fallbackPrice;

    return {
      symbol,
      peRatio: Math.round((12 + rng() * 26) * 10) / 10,
      dividendYieldPct: Math.round(rng() * 380) / 100,
      beta: Math.round((0.6 + rng() * 1.1) * 100) / 100,
      eps: Math.round((price / (12 + rng() * 26)) * 100) / 100,
      revenue: null,
      profitMarginPct: Math.round((4 + rng() * 26) * 10) / 10,
      fiftyTwoWeekHigh: Math.round(price * (1.08 + rng() * 0.22) * 100) / 100,
      fiftyTwoWeekLow: Math.round(price * (0.62 + rng() * 0.2) * 100) / 100,
    };
  }

  async getNews(symbols?: string[], limit = 8): Promise<NewsItem[]> {
    const now = Date.now();
    const templates = [
      {
        title: 'Les marchés européens terminent en hausse après les chiffres de l’inflation',
        summary:
          'Article de démonstration. Dans une version connectée à un fournisseur d’actualités, ce bloc affiche des dépêches financières réelles.',
        source: 'PATRIMONIA DEMO',
      },
      {
        title: 'La banque centrale maintient le cap sur sa trajectoire de taux',
        summary:
          'Article de démonstration. Le flux réel est fourni par l’API d’actualités configurée dans les variables d’environnement.',
        source: 'PATRIMONIA DEMO',
      },
      {
        title: 'Le secteur des semi-conducteurs reste le moteur des indices américains',
        summary: 'Article de démonstration destiné à illustrer la mise en page du fil d’actualité.',
        source: 'PATRIMONIA DEMO',
      },
      {
        title: 'Immobilier résidentiel : les volumes de transaction se stabilisent',
        summary: 'Article de démonstration destiné à illustrer la mise en page du fil d’actualité.',
        source: 'PATRIMONIA DEMO',
      },
      {
        title: 'Obligations souveraines : la pente de la courbe se redresse',
        summary: 'Article de démonstration destiné à illustrer la mise en page du fil d’actualité.',
        source: 'PATRIMONIA DEMO',
      },
      {
        title: 'Le luxe européen retrouve de la visibilité sur ses ventes en Asie',
        summary: 'Article de démonstration destiné à illustrer la mise en page du fil d’actualité.',
        source: 'PATRIMONIA DEMO',
      },
      {
        title: 'Énergie : les cours du brut évoluent dans une bande étroite',
        summary: 'Article de démonstration destiné à illustrer la mise en page du fil d’actualité.',
        source: 'PATRIMONIA DEMO',
      },
      {
        title: 'Épargne réglementée : le rendement du livret A reste sous surveillance',
        summary: 'Article de démonstration destiné à illustrer la mise en page du fil d’actualité.',
        source: 'PATRIMONIA DEMO',
      },
    ];

    return templates.slice(0, limit).map((template, index) => ({
      id: `mock-news-${index}`,
      title: template.title,
      summary: template.summary,
      source: template.source,
      url: null,
      publishedAt: new Date(now - index * 3600_000 * 5).toISOString(),
      symbols: symbols?.slice(0, 2) ?? [],
    }));
  }

  async getIndexData(): Promise<IndexSnapshot[]> {
    const snapshots: IndexSnapshot[] = [];
    for (const index of TRACKED_INDICES) {
      const quote = await this.getQuote(index.symbol);
      snapshots.push({
        symbol: index.symbol,
        name: index.name,
        value: quote?.price ?? index.fallbackValue,
        changePct: quote?.changePct ?? 0,
        currency: index.currency,
      });
    }
    return snapshots;
  }

  async getMacroIndicators(): Promise<MacroIndicator[]> {
    const asOf = toISODate(new Date());
    return [
      { key: 'livret-a', label: 'Taux du Livret A', value: 2.4, unit: '%', asOf, source: 'DEMO' },
      { key: 'inflation-fr', label: 'Inflation France (glissement annuel)', value: 1.9, unit: '%', asOf, source: 'DEMO' },
      { key: 'oat-10', label: 'OAT 10 ans', value: 3.05, unit: '%', asOf, source: 'DEMO' },
      { key: 'euribor-3m', label: 'Euribor 3 mois', value: 2.62, unit: '%', asOf, source: 'DEMO' },
      { key: 'credit-immo-20', label: 'Crédit immobilier 20 ans (moyenne)', value: 3.35, unit: '%', asOf, source: 'DEMO' },
    ];
  }

  async getFxToEur(currencies: string[]): Promise<Record<string, number>> {
    // Taux de repli. Ils sont remplacés par les taux réels dès qu'un
    // fournisseur connecté est disponible.
    const fallback: Record<string, number> = { EUR: 1, USD: 0.92, GBP: 1.17, CHF: 1.04, JPY: 0.0062 };
    const result: Record<string, number> = { EUR: 1 };
    for (const currency of currencies) {
      result[currency] = fallback[currency] ?? 1;
    }
    return result;
  }
}
