import type { DataOrigin, ISODate } from './common';

export type MarketRange = '1D' | '1S' | '1M' | '3M' | '6M' | '1A' | '3A' | 'MAX';

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  change: number;
  changePct: number;
  previousClose: number;
  dayHigh: number | null;
  dayLow: number | null;
  marketCap: number | null;
  updatedAt: ISODate;
}

export interface PricePoint {
  date: ISODate;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface HistoricalSeries {
  symbol: string;
  range: MarketRange;
  points: PricePoint[];
  changePct: number;
}

export interface CompanyProfile {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  country: string;
  currency: string;
  description: string;
  website: string | null;
  employees: number | null;
}

export interface CompanyFinancials {
  symbol: string;
  peRatio: number | null;
  dividendYieldPct: number | null;
  beta: number | null;
  eps: number | null;
  revenue: number | null;
  profitMarginPct: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string | null;
  publishedAt: ISODate;
  symbols: string[];
}

export interface IndexSnapshot {
  symbol: string;
  name: string;
  value: number;
  changePct: number;
  currency: string;
}

export interface MacroIndicator {
  key: string;
  label: string;
  value: number;
  unit: string;
  asOf: ISODate;
  source: string;
}

/** Enveloppe systématique des réponses du MarketDataService : l'origine de la
 *  donnée voyage avec la donnée elle-même jusqu'à l'affichage. */
export interface MarketResponse<T> {
  data: T;
  origin: DataOrigin;
  provider: string;
  fetchedAt: ISODate;
  notice?: string;
}
