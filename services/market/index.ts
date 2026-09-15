import 'server-only';

import type {
  CompanyFinancials,
  CompanyProfile,
  HistoricalSeries,
  IndexSnapshot,
  MacroIndicator,
  MarketRange,
  MarketResponse,
  NewsItem,
  Quote,
} from '@/types';
import { serverEnv } from '@/lib/env';
import type { MarketDataProvider } from './provider';
import { MockMarketDataProvider } from './mockProvider';
import { YahooFinanceProvider } from './yahooProvider';
import { FinancialModelingPrepProvider } from './fmpProvider';

const MOCK_NOTICE =
  'Données de marché simulées : le fournisseur configuré est indisponible. Ces valeurs sont des données de DÉMONSTRATION.';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/** Cache mémoire à durée de vie courte, partagé par toutes les requêtes du serveur. */
class TtlCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}

const cache = new TtlCache();

/**
 * MarketDataService — point d'entrée unique pour toute donnée de marché.
 *
 * Aucun composant React n'appelle directement une API financière. Le service
 * essaie les fournisseurs réels dans l'ordre configuré puis, en cas d'échec,
 * bascule sur le fournisseur de démonstration en marquant l'origine `mock`.
 */
export class MarketDataService {
  private readonly mock = new MockMarketDataProvider();

  constructor(
    private readonly providers: MarketDataProvider[],
    private readonly ttlSeconds: number,
  ) {}

  private wrap<T>(data: T, provider: MarketDataProvider): MarketResponse<T> {
    return {
      data,
      origin: provider.isLive ? 'live' : 'mock',
      provider: provider.label,
      fetchedAt: new Date().toISOString(),
      notice: provider.isLive ? undefined : MOCK_NOTICE,
    };
  }

  /** Essaie chaque fournisseur réel puis retombe sur la démonstration. */
  private async resolve<T>(
    cacheKey: string,
    call: (provider: MarketDataProvider) => Promise<T | null>,
    isEmpty: (value: T) => boolean,
  ): Promise<MarketResponse<T>> {
    const cached = cache.get<MarketResponse<T>>(cacheKey);
    if (cached) return cached;

    for (const provider of this.providers) {
      try {
        const value = await call(provider);
        if (value !== null && !isEmpty(value)) {
          const response = this.wrap(value, provider);
          cache.set(cacheKey, response, this.ttlSeconds);
          return response;
        }
      } catch {
        // Fournisseur en échec : on passe au suivant.
      }
    }

    const fallback = await call(this.mock);
    const response = this.wrap(
      (fallback ?? ([] as unknown as T)) as T,
      this.mock,
    );
    cache.set(cacheKey, response, Math.min(this.ttlSeconds, 60));
    return response;
  }

  getQuote(symbol: string): Promise<MarketResponse<Quote | null>> {
    return this.resolve(
      `quote:${symbol}`,
      (provider) => provider.getQuote(symbol),
      (value) => value === null,
    );
  }

  getQuotes(symbols: string[]): Promise<MarketResponse<Map<string, Quote>>> {
    const key = `quotes:${[...symbols].sort().join(',')}`;
    return this.resolve(
      key,
      (provider) => provider.getQuotes(symbols),
      (value) => value.size === 0,
    );
  }

  getHistoricalPrices(symbol: string, range: MarketRange): Promise<MarketResponse<HistoricalSeries | null>> {
    return this.resolve(
      `history:${symbol}:${range}`,
      (provider) => provider.getHistoricalPrices(symbol, range),
      (value) => value === null || value.points.length < 2,
    );
  }

  getCompanyProfile(symbol: string): Promise<MarketResponse<CompanyProfile | null>> {
    return this.resolve(
      `profile:${symbol}`,
      (provider) => provider.getCompanyProfile(symbol),
      (value) => value === null,
    );
  }

  getFinancials(symbol: string): Promise<MarketResponse<CompanyFinancials | null>> {
    return this.resolve(
      `financials:${symbol}`,
      (provider) => provider.getFinancials(symbol),
      (value) => value === null,
    );
  }

  getNews(symbols?: string[], limit = 8): Promise<MarketResponse<NewsItem[]>> {
    return this.resolve(
      `news:${symbols?.join(',') ?? 'general'}:${limit}`,
      (provider) => provider.getNews(symbols, limit),
      (value) => value.length === 0,
    );
  }

  getIndexData(): Promise<MarketResponse<IndexSnapshot[]>> {
    return this.resolve(
      'indices',
      (provider) => provider.getIndexData(),
      (value) => value.length === 0,
    );
  }

  getMacroIndicators(): Promise<MarketResponse<MacroIndicator[]>> {
    return this.resolve(
      'macro',
      (provider) => provider.getMacroIndicators(),
      (value) => value.length === 0,
    );
  }

  getFxToEur(currencies: string[]): Promise<MarketResponse<Record<string, number>>> {
    const key = `fx:${[...currencies].sort().join(',')}`;
    return this.resolve(
      key,
      (provider) => provider.getFxToEur(currencies),
      (value) => Object.keys(value).length <= 1 && currencies.some((currency) => currency !== 'EUR'),
    );
  }

  /** Description de la chaîne de fournisseurs, affichée dans les réglages. */
  describe(): { id: string; label: string; isLive: boolean }[] {
    return [...this.providers, this.mock].map((provider) => ({
      id: provider.id,
      label: provider.label,
      isLive: provider.isLive,
    }));
  }
}

let cachedService: MarketDataService | null = null;

/** Construit le service à partir de la configuration d'environnement. */
export function getMarketDataService(): MarketDataService {
  if (cachedService) return cachedService;

  const env = serverEnv();
  const providers: MarketDataProvider[] = [];

  const addFmp = () => {
    if (env.FMP_API_KEY) providers.push(new FinancialModelingPrepProvider(env.FMP_API_KEY));
  };

  switch (env.MARKET_DATA_PROVIDER) {
    case 'yahoo':
      providers.push(new YahooFinanceProvider());
      break;
    case 'fmp':
      addFmp();
      break;
    case 'mock':
      break;
    default:
      addFmp();
      providers.push(new YahooFinanceProvider());
      break;
  }

  cachedService = new MarketDataService(providers, env.MARKET_DATA_CACHE_TTL);
  return cachedService;
}
