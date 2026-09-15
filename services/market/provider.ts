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

/**
 * Contrat que doit respecter tout fournisseur de données de marché.
 *
 * Changer de fournisseur ne demande que l'ajout d'une implémentation de cette
 * interface et son enregistrement dans `createMarketDataService`.
 */
export interface MarketDataProvider {
  readonly id: string;
  readonly label: string;
  /** `true` lorsque le fournisseur renvoie de véritables données de marché. */
  readonly isLive: boolean;

  getQuote(symbol: string): Promise<Quote | null>;
  getQuotes(symbols: string[]): Promise<Map<string, Quote>>;
  getHistoricalPrices(symbol: string, range: MarketRange): Promise<HistoricalSeries | null>;
  getCompanyProfile(symbol: string): Promise<CompanyProfile | null>;
  getFinancials(symbol: string): Promise<CompanyFinancials | null>;
  getNews(symbols?: string[], limit?: number): Promise<NewsItem[]>;
  getIndexData(): Promise<IndexSnapshot[]>;
  getMacroIndicators(): Promise<MacroIndicator[]>;
  /** Taux de change vers l'euro, par devise. */
  getFxToEur(currencies: string[]): Promise<Record<string, number>>;
}

/** Nombre de points et pas de temps associés à chaque plage. */
export const RANGE_CONFIG: Record<
  MarketRange,
  { days: number; interval: '5m' | '1h' | '1d' | '1wk'; label: string }
> = {
  '1D': { days: 1, interval: '5m', label: "Aujourd'hui" },
  '1S': { days: 7, interval: '1h', label: 'Une semaine' },
  '1M': { days: 30, interval: '1d', label: 'Un mois' },
  '3M': { days: 92, interval: '1d', label: 'Trois mois' },
  '6M': { days: 183, interval: '1d', label: 'Six mois' },
  '1A': { days: 365, interval: '1d', label: 'Un an' },
  '3A': { days: 1095, interval: '1wk', label: 'Trois ans' },
  MAX: { days: 3650, interval: '1wk', label: 'Depuis dix ans' },
};

export const MARKET_RANGES: MarketRange[] = ['1D', '1S', '1M', '3M', '6M', '1A', '3A', 'MAX'];
