import type {
  CompanyFinancials,
  CompanyProfile,
  HistoricalSeries,
  IndexSnapshot,
  MacroIndicator,
  MarketRange,
  NewsItem,
  Quote,
} from '@/types';
import { TRACKED_INDICES } from '@/data/demo/instruments';
import { RANGE_CONFIG, type MarketDataProvider } from './provider';

const BASE = 'https://financialmodelingprep.com/api/v3';

/**
 * Fournisseur de données de marché RÉELLES adossé à Financial Modeling Prep.
 *
 * Activé uniquement lorsque `FMP_API_KEY` est renseignée côté serveur. La clé
 * n'est jamais exposée au navigateur : ce module est importé exclusivement
 * depuis du code serveur.
 */
export class FinancialModelingPrepProvider implements MarketDataProvider {
  readonly id = 'fmp';
  readonly label = 'Financial Modeling Prep';
  readonly isLive = true;

  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs = 6000,
  ) {}

  private async get<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
    const url = new URL(`${BASE}${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    url.searchParams.set('apikey', this.apiKey);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) return null;
      return (await response.json()) as T;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async getQuote(symbol: string): Promise<Quote | null> {
    const quotes = await this.getQuotes([symbol]);
    return quotes.get(symbol) ?? null;
  }

  async getQuotes(symbols: string[]): Promise<Map<string, Quote>> {
    const map = new Map<string, Quote>();
    if (symbols.length === 0) return map;

    const payload = await this.get<
      {
        symbol?: string;
        name?: string;
        price?: number;
        change?: number;
        changesPercentage?: number;
        previousClose?: number;
        dayHigh?: number;
        dayLow?: number;
        marketCap?: number;
      }[]
    >(`/quote/${symbols.map(encodeURIComponent).join(',')}`);

    if (!Array.isArray(payload)) return map;

    for (const item of payload) {
      if (!item.symbol || typeof item.price !== 'number') continue;
      map.set(item.symbol, {
        symbol: item.symbol,
        name: item.name ?? item.symbol,
        price: item.price,
        currency: 'USD',
        change: item.change ?? 0,
        changePct: item.changesPercentage ?? 0,
        previousClose: item.previousClose ?? item.price,
        dayHigh: item.dayHigh ?? null,
        dayLow: item.dayLow ?? null,
        marketCap: item.marketCap ?? null,
        updatedAt: new Date().toISOString(),
      });
    }

    return map;
  }

  async getHistoricalPrices(symbol: string, range: MarketRange): Promise<HistoricalSeries | null> {
    const days = RANGE_CONFIG[range].days;
    const payload = await this.get<{
      historical?: { date?: string; close?: number; open?: number; high?: number; low?: number; volume?: number }[];
    }>(`/historical-price-full/${encodeURIComponent(symbol)}`, { timeseries: String(Math.min(days, 3650)) });

    const historical = payload?.historical;
    if (!Array.isArray(historical) || historical.length === 0) return null;

    const points = historical
      .filter((item): item is { date: string; close: number } & typeof item =>
        typeof item.date === 'string' && typeof item.close === 'number',
      )
      .map((item) => ({
        date: item.date,
        close: item.close,
        open: item.open,
        high: item.high,
        low: item.low,
        volume: item.volume,
      }))
      .reverse();

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
    const payload = await this.get<
      {
        symbol?: string;
        companyName?: string;
        sector?: string;
        industry?: string;
        country?: string;
        currency?: string;
        description?: string;
        website?: string;
        fullTimeEmployees?: string;
      }[]
    >(`/profile/${encodeURIComponent(symbol)}`);

    const item = Array.isArray(payload) ? payload[0] : null;
    if (!item) return null;

    const employees = Number.parseInt(item.fullTimeEmployees ?? '', 10);
    return {
      symbol,
      name: item.companyName ?? symbol,
      sector: item.sector ?? '—',
      industry: item.industry ?? '—',
      country: item.country ?? '—',
      currency: item.currency ?? 'USD',
      description: item.description ?? '',
      website: item.website ?? null,
      employees: Number.isFinite(employees) ? employees : null,
    };
  }

  async getFinancials(symbol: string): Promise<CompanyFinancials | null> {
    const payload = await this.get<
      { peRatioTTM?: number; dividendYielTTM?: number; dividendYieldTTM?: number; netProfitMarginTTM?: number }[]
    >(`/ratios-ttm/${encodeURIComponent(symbol)}`);

    const item = Array.isArray(payload) ? payload[0] : null;
    if (!item) return null;

    const yieldTtm = item.dividendYieldTTM ?? item.dividendYielTTM;
    return {
      symbol,
      peRatio: item.peRatioTTM ?? null,
      dividendYieldPct: typeof yieldTtm === 'number' ? yieldTtm * 100 : null,
      beta: null,
      eps: null,
      revenue: null,
      profitMarginPct: typeof item.netProfitMarginTTM === 'number' ? item.netProfitMarginTTM * 100 : null,
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
    };
  }

  async getNews(symbols?: string[], limit = 8): Promise<NewsItem[]> {
    const payload = await this.get<
      { symbol?: string; publishedDate?: string; title?: string; site?: string; text?: string; url?: string }[]
    >('/stock_news', {
      limit: String(limit),
      ...(symbols?.length ? { tickers: symbols.slice(0, 5).join(',') } : {}),
    });

    if (!Array.isArray(payload)) return [];

    return payload.slice(0, limit).map((item, index) => ({
      id: `${item.symbol ?? 'fmp'}-${index}`,
      title: item.title ?? 'Sans titre',
      summary: item.text ?? '',
      source: item.site ?? 'Financial Modeling Prep',
      url: item.url ?? null,
      publishedAt: item.publishedDate ? new Date(item.publishedDate).toISOString() : new Date().toISOString(),
      symbols: item.symbol ? [item.symbol] : [],
    }));
  }

  async getIndexData(): Promise<IndexSnapshot[]> {
    const quotes = await this.getQuotes(TRACKED_INDICES.map((index) => index.symbol));
    return TRACKED_INDICES.flatMap((index) => {
      const quote = quotes.get(index.symbol);
      if (!quote) return [];
      return [
        {
          symbol: index.symbol,
          name: index.name,
          value: quote.price,
          changePct: quote.changePct,
          currency: index.currency,
        },
      ];
    });
  }

  async getMacroIndicators(): Promise<MacroIndicator[]> {
    return [];
  }

  async getFxToEur(currencies: string[]): Promise<Record<string, number>> {
    const rates: Record<string, number> = { EUR: 1 };
    const targets = [...new Set(currencies)].filter((currency) => currency !== 'EUR');
    if (targets.length === 0) return rates;

    const payload = await this.get<{ ticker?: string; bid?: number; ask?: number }[]>('/fx');
    if (!Array.isArray(payload)) return rates;

    for (const currency of targets) {
      const pair = payload.find((item) => item.ticker === `${currency}/EUR`);
      const price = pair?.bid ?? pair?.ask;
      if (typeof price === 'number' && price > 0) rates[currency] = price;
    }

    return rates;
  }
}
