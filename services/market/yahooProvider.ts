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
import { TRACKED_INDICES } from '@/data/demo/instruments';
import { toISODate } from '@/lib/utils/dates';
import { RANGE_CONFIG, type MarketDataProvider } from './provider';

const BASE = 'https://query1.finance.yahoo.com';

const RANGE_PARAM: Record<MarketRange, { range: string; interval: string }> = {
  '1D': { range: '1d', interval: '5m' },
  '1S': { range: '5d', interval: '30m' },
  '1M': { range: '1mo', interval: '1d' },
  '3M': { range: '3mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
  '1A': { range: '1y', interval: '1d' },
  '3A': { range: '3y', interval: '1wk' },
  MAX: { range: '10y', interval: '1wk' },
};

interface YahooChartResponse {
  chart?: {
    result?: {
      meta?: {
        symbol?: string;
        shortName?: string;
        longName?: string;
        currency?: string;
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: {
          close?: (number | null)[];
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          volume?: (number | null)[];
        }[];
      };
    }[];
    error?: unknown;
  };
}

/**
 * Fournisseur de données de marché RÉELLES adossé aux points de terminaison
 * publics de Yahoo Finance. Aucune clé d'API n'est requise.
 *
 * Toutes les requêtes sont exécutées côté serveur : ce module n'est jamais
 * importé depuis un composant client.
 */
export class YahooFinanceProvider implements MarketDataProvider {
  readonly id = 'yahoo';
  readonly label = 'Yahoo Finance';
  readonly isLive = true;

  constructor(private readonly timeoutMs = 6000) {}

  private async fetchJson<T>(url: string): Promise<T | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          // Un agent explicite évite les réponses tronquées du service public.
          'User-Agent': 'PATRIMONIA/2.0 (application de gestion de patrimoine)',
          Accept: 'application/json',
        },
        cache: 'no-store',
      });
      if (!response.ok) return null;
      return (await response.json()) as T;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  private async chart(symbol: string, range: string, interval: string): Promise<YahooChartResponse | null> {
    const url = `${BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
    return this.fetchJson<YahooChartResponse>(url);
  }

  async getQuote(symbol: string): Promise<Quote | null> {
    const payload = await this.chart(symbol, '5d', '1d');
    const result = payload?.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta || typeof meta.regularMarketPrice !== 'number') return null;

    const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
    const change = meta.regularMarketPrice - previousClose;

    return {
      symbol,
      name: meta.longName ?? meta.shortName ?? symbol,
      price: meta.regularMarketPrice,
      currency: meta.currency ?? 'EUR',
      change,
      changePct: previousClose > 0 ? (change / previousClose) * 100 : 0,
      previousClose,
      dayHigh: meta.regularMarketDayHigh ?? null,
      dayLow: meta.regularMarketDayLow ?? null,
      marketCap: null,
      updatedAt: new Date().toISOString(),
    };
  }

  async getQuotes(symbols: string[]): Promise<Map<string, Quote>> {
    const results = await Promise.all(symbols.map((symbol) => this.getQuote(symbol)));
    const map = new Map<string, Quote>();
    results.forEach((quote, index) => {
      const symbol = symbols[index];
      if (quote && symbol) map.set(symbol, quote);
    });
    return map;
  }

  async getHistoricalPrices(symbol: string, range: MarketRange): Promise<HistoricalSeries | null> {
    const params = RANGE_PARAM[range];
    const payload = await this.chart(symbol, params.range, params.interval);
    const result = payload?.chart?.result?.[0];
    const timestamps = result?.timestamp;
    const quote = result?.indicators?.quote?.[0];
    if (!timestamps || !quote?.close) return null;

    const points: PricePoint[] = [];
    timestamps.forEach((timestamp, index) => {
      const close = quote.close?.[index];
      if (typeof close !== 'number') return;
      const date = new Date(timestamp * 1000);
      points.push({
        date: params.interval.includes('m') || params.interval.includes('h') ? date.toISOString() : toISODate(date),
        close,
        open: quote.open?.[index] ?? undefined,
        high: quote.high?.[index] ?? undefined,
        low: quote.low?.[index] ?? undefined,
        volume: quote.volume?.[index] ?? undefined,
      });
    });

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
    const payload = await this.fetchJson<{
      quoteSummary?: {
        result?: {
          assetProfile?: {
            sector?: string;
            industry?: string;
            country?: string;
            longBusinessSummary?: string;
            website?: string;
            fullTimeEmployees?: number;
          };
          price?: { longName?: string; shortName?: string; currency?: string };
        }[];
      };
    }>(
      `${BASE}/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=assetProfile,price`,
    );

    const result = payload?.quoteSummary?.result?.[0];
    const profile = result?.assetProfile;
    if (!profile) return null;

    return {
      symbol,
      name: result?.price?.longName ?? result?.price?.shortName ?? symbol,
      sector: profile.sector ?? '—',
      industry: profile.industry ?? '—',
      country: profile.country ?? '—',
      currency: result?.price?.currency ?? 'EUR',
      description: profile.longBusinessSummary ?? '',
      website: profile.website ?? null,
      employees: profile.fullTimeEmployees ?? null,
    };
  }

  async getFinancials(symbol: string): Promise<CompanyFinancials | null> {
    const payload = await this.fetchJson<{
      quoteSummary?: {
        result?: {
          summaryDetail?: {
            trailingPE?: { raw?: number };
            dividendYield?: { raw?: number };
            beta?: { raw?: number };
            fiftyTwoWeekHigh?: { raw?: number };
            fiftyTwoWeekLow?: { raw?: number };
          };
          defaultKeyStatistics?: { trailingEps?: { raw?: number }; profitMargins?: { raw?: number } };
          financialData?: { totalRevenue?: { raw?: number }; profitMargins?: { raw?: number } };
        }[];
      };
    }>(
      `${BASE}/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=summaryDetail,defaultKeyStatistics,financialData`,
    );

    const result = payload?.quoteSummary?.result?.[0];
    if (!result) return null;
    const detail = result.summaryDetail;
    const margins = result.financialData?.profitMargins?.raw ?? result.defaultKeyStatistics?.profitMargins?.raw;

    return {
      symbol,
      peRatio: detail?.trailingPE?.raw ?? null,
      dividendYieldPct: typeof detail?.dividendYield?.raw === 'number' ? detail.dividendYield.raw * 100 : null,
      beta: detail?.beta?.raw ?? null,
      eps: result.defaultKeyStatistics?.trailingEps?.raw ?? null,
      revenue: result.financialData?.totalRevenue?.raw ?? null,
      profitMarginPct: typeof margins === 'number' ? margins * 100 : null,
      fiftyTwoWeekHigh: detail?.fiftyTwoWeekHigh?.raw ?? null,
      fiftyTwoWeekLow: detail?.fiftyTwoWeekLow?.raw ?? null,
    };
  }

  async getNews(symbols?: string[], limit = 8): Promise<NewsItem[]> {
    const query = symbols?.[0] ?? 'marchés financiers';
    const payload = await this.fetchJson<{
      news?: { uuid?: string; title?: string; publisher?: string; link?: string; providerPublishTime?: number; relatedTickers?: string[] }[];
    }>(`${BASE}/v1/finance/search?q=${encodeURIComponent(query)}&newsCount=${limit}&quotesCount=0`);

    const news = payload?.news;
    if (!news?.length) return [];

    return news.slice(0, limit).map((item, index) => ({
      id: item.uuid ?? `yahoo-${index}`,
      title: item.title ?? 'Sans titre',
      summary: '',
      source: item.publisher ?? 'Yahoo Finance',
      url: item.link ?? null,
      publishedAt: new Date((item.providerPublishTime ?? Date.now() / 1000) * 1000).toISOString(),
      symbols: item.relatedTickers ?? [],
    }));
  }

  async getIndexData(): Promise<IndexSnapshot[]> {
    const quotes = await this.getQuotes(TRACKED_INDICES.map((index) => index.symbol));
    const snapshots: IndexSnapshot[] = [];

    for (const index of TRACKED_INDICES) {
      const quote = quotes.get(index.symbol);
      if (!quote) continue;
      snapshots.push({
        symbol: index.symbol,
        name: index.name,
        value: quote.price,
        changePct: quote.changePct,
        currency: quote.currency,
      });
    }

    return snapshots;
  }

  async getMacroIndicators(): Promise<MacroIndicator[]> {
    // Yahoo Finance n'expose pas de série macroéconomique exploitable :
    // le service composite bascule sur le fournisseur de démonstration, en
    // signalant l'origine de la donnée.
    return [];
  }

  async getFxToEur(currencies: string[]): Promise<Record<string, number>> {
    const targets = [...new Set(currencies)].filter((currency) => currency !== 'EUR');
    const rates: Record<string, number> = { EUR: 1 };

    await Promise.all(
      targets.map(async (currency) => {
        const quote = await this.getQuote(`${currency}EUR=X`);
        if (quote && quote.price > 0) rates[currency] = quote.price;
      }),
    );

    return rates;
  }
}
