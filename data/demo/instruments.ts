import type { AssetClass, InstrumentType } from '@/types';

/**
 * Catalogue d'instruments réellement cotés.
 *
 * Seules les caractéristiques descriptives sont figées ici (nom, secteur,
 * région, devise). Les PRIX proviennent du MarketDataService : `fallbackPrice`
 * n'est utilisé qu'en dernier recours et l'interface indique alors clairement
 * que la valorisation n'est pas une donnée de marché temps réel.
 */
export interface InstrumentDefinition {
  ticker: string;
  isin: string | null;
  name: string;
  type: InstrumentType;
  assetClass: AssetClass;
  sector: string;
  region: string;
  currency: 'EUR' | 'USD';
  /** Ordre de grandeur de référence, en devise de cotation. */
  fallbackPrice: number;
  /** Volatilité annualisée indicative, utilisée par le provider de démonstration. */
  volatility: number;
  /** Dérive annuelle indicative, utilisée par le provider de démonstration. */
  drift: number;
}

export const INSTRUMENTS: InstrumentDefinition[] = [
  { ticker: 'AAPL', isin: 'US0378331005', name: 'Apple Inc.', type: 'action', assetClass: 'actions', sector: 'Technologie', region: 'Amérique du Nord', currency: 'USD', fallbackPrice: 226.4, volatility: 0.26, drift: 0.14 },
  { ticker: 'MSFT', isin: 'US5949181045', name: 'Microsoft Corp.', type: 'action', assetClass: 'actions', sector: 'Technologie', region: 'Amérique du Nord', currency: 'USD', fallbackPrice: 418.2, volatility: 0.24, drift: 0.16 },
  { ticker: 'NVDA', isin: 'US67066G1040', name: 'NVIDIA Corp.', type: 'action', assetClass: 'actions', sector: 'Semi-conducteurs', region: 'Amérique du Nord', currency: 'USD', fallbackPrice: 121.5, volatility: 0.48, drift: 0.28 },
  { ticker: 'AMZN', isin: 'US0231351067', name: 'Amazon.com Inc.', type: 'action', assetClass: 'actions', sector: 'Consommation discrétionnaire', region: 'Amérique du Nord', currency: 'USD', fallbackPrice: 185.3, volatility: 0.3, drift: 0.13 },
  { ticker: 'GOOGL', isin: 'US02079K3059', name: 'Alphabet Inc.', type: 'action', assetClass: 'actions', sector: 'Technologie', region: 'Amérique du Nord', currency: 'USD', fallbackPrice: 168.7, volatility: 0.28, drift: 0.12 },
  { ticker: 'JNJ', isin: 'US4781601046', name: 'Johnson & Johnson', type: 'action', assetClass: 'actions', sector: 'Santé', region: 'Amérique du Nord', currency: 'USD', fallbackPrice: 158.9, volatility: 0.16, drift: 0.05 },
  { ticker: 'KO', isin: 'US1912161007', name: 'The Coca-Cola Company', type: 'action', assetClass: 'actions', sector: 'Consommation de base', region: 'Amérique du Nord', currency: 'USD', fallbackPrice: 68.4, volatility: 0.15, drift: 0.05 },
  { ticker: 'MC.PA', isin: 'FR0000121014', name: 'LVMH', type: 'action', assetClass: 'actions', sector: 'Luxe', region: 'Europe', currency: 'EUR', fallbackPrice: 612.0, volatility: 0.27, drift: 0.07 },
  { ticker: 'OR.PA', isin: 'FR0000120321', name: "L'Oréal", type: 'action', assetClass: 'actions', sector: 'Consommation de base', region: 'Europe', currency: 'EUR', fallbackPrice: 372.5, volatility: 0.21, drift: 0.06 },
  { ticker: 'AIR.PA', isin: 'NL0000235190', name: 'Airbus SE', type: 'action', assetClass: 'actions', sector: 'Aéronautique', region: 'Europe', currency: 'EUR', fallbackPrice: 143.8, volatility: 0.25, drift: 0.1 },
  { ticker: 'TTE.PA', isin: 'FR0000120271', name: 'TotalEnergies', type: 'action', assetClass: 'actions', sector: 'Énergie', region: 'Europe', currency: 'EUR', fallbackPrice: 58.3, volatility: 0.22, drift: 0.06 },
  { ticker: 'BNP.PA', isin: 'FR0000131104', name: 'BNP Paribas', type: 'action', assetClass: 'actions', sector: 'Finance', region: 'Europe', currency: 'EUR', fallbackPrice: 62.1, volatility: 0.26, drift: 0.07 },
  { ticker: 'SAN.PA', isin: 'FR0000120578', name: 'Sanofi', type: 'action', assetClass: 'actions', sector: 'Santé', region: 'Europe', currency: 'EUR', fallbackPrice: 97.6, volatility: 0.19, drift: 0.05 },
  { ticker: 'SU.PA', isin: 'FR0000121972', name: 'Schneider Electric', type: 'action', assetClass: 'actions', sector: 'Industrie', region: 'Europe', currency: 'EUR', fallbackPrice: 226.7, volatility: 0.24, drift: 0.11 },
  { ticker: 'ASML', isin: 'NL0010273215', name: 'ASML Holding', type: 'action', assetClass: 'actions', sector: 'Semi-conducteurs', region: 'Europe', currency: 'EUR', fallbackPrice: 685.0, volatility: 0.34, drift: 0.15 },
  { ticker: 'SAP', isin: 'DE0007164600', name: 'SAP SE', type: 'action', assetClass: 'actions', sector: 'Technologie', region: 'Europe', currency: 'EUR', fallbackPrice: 196.4, volatility: 0.23, drift: 0.12 },
  { ticker: 'CW8.PA', isin: 'LU1681043599', name: 'Amundi MSCI World UCITS ETF', type: 'etf', assetClass: 'etf', sector: 'Diversifié', region: 'Monde', currency: 'EUR', fallbackPrice: 512.8, volatility: 0.15, drift: 0.08 },
  { ticker: 'ESE.PA', isin: 'FR0011550185', name: 'BNP Paribas Easy S&P 500 UCITS ETF', type: 'etf', assetClass: 'etf', sector: 'Diversifié', region: 'Amérique du Nord', currency: 'EUR', fallbackPrice: 25.9, volatility: 0.17, drift: 0.09 },
  { ticker: 'IWDA.AS', isin: 'IE00B4L5Y983', name: 'iShares Core MSCI World UCITS ETF', type: 'etf', assetClass: 'etf', sector: 'Diversifié', region: 'Monde', currency: 'EUR', fallbackPrice: 97.2, volatility: 0.15, drift: 0.08 },
  { ticker: 'EUNL.DE', isin: 'IE00B4L5Y983', name: 'iShares Core MSCI World (Xetra)', type: 'etf', assetClass: 'etf', sector: 'Diversifié', region: 'Monde', currency: 'EUR', fallbackPrice: 96.8, volatility: 0.15, drift: 0.08 },
  { ticker: 'PE500.PA', isin: 'FR0011871128', name: 'Amundi PEA S&P 500 UCITS ETF', type: 'etf', assetClass: 'etf', sector: 'Diversifié', region: 'Amérique du Nord', currency: 'EUR', fallbackPrice: 38.6, volatility: 0.17, drift: 0.09 },
  { ticker: 'CAC.PA', isin: 'FR0007052782', name: 'Lyxor CAC 40 UCITS ETF', type: 'etf', assetClass: 'etf', sector: 'Diversifié', region: 'Europe', currency: 'EUR', fallbackPrice: 78.5, volatility: 0.18, drift: 0.06 },
  { ticker: 'EMIM.AS', isin: 'IE00BKM4GZ66', name: 'iShares Core MSCI EM IMI UCITS ETF', type: 'etf', assetClass: 'etf', sector: 'Diversifié', region: 'Marchés émergents', currency: 'EUR', fallbackPrice: 32.4, volatility: 0.2, drift: 0.06 },
  { ticker: 'AGGH.MI', isin: 'IE00BDBRDM35', name: 'iShares Core Global Aggregate Bond UCITS ETF', type: 'etf', assetClass: 'obligations', sector: 'Obligataire', region: 'Monde', currency: 'EUR', fallbackPrice: 4.86, volatility: 0.06, drift: 0.025 },
  { ticker: 'IBTS.AS', isin: 'IE00B14X4S71', name: 'iShares $ Treasury Bond 1-3yr UCITS ETF', type: 'etf', assetClass: 'obligations', sector: 'Obligataire', region: 'Amérique du Nord', currency: 'EUR', fallbackPrice: 138.2, volatility: 0.05, drift: 0.02 },
  { ticker: 'SGLD.L', isin: 'JE00B1VS3770', name: 'Invesco Physical Gold ETC', type: 'etf', assetClass: 'autres', sector: 'Matières premières', region: 'Monde', currency: 'USD', fallbackPrice: 243.5, volatility: 0.14, drift: 0.05 },
  { ticker: 'BTC-EUR', isin: null, name: 'Bitcoin', type: 'crypto', assetClass: 'crypto', sector: 'Crypto-actifs', region: 'Monde', currency: 'EUR', fallbackPrice: 54800, volatility: 0.62, drift: 0.2 },
  { ticker: 'ETH-EUR', isin: null, name: 'Ethereum', type: 'crypto', assetClass: 'crypto', sector: 'Crypto-actifs', region: 'Monde', currency: 'EUR', fallbackPrice: 2380, volatility: 0.7, drift: 0.18 },
];

export const INSTRUMENT_BY_TICKER = new Map(INSTRUMENTS.map((item) => [item.ticker, item]));

/** Indices suivis sur la page Marchés. */
export const TRACKED_INDICES = [
  { symbol: '^FCHI', name: 'CAC 40', currency: 'EUR', fallbackValue: 7580, volatility: 0.16 },
  { symbol: '^GSPC', name: 'S&P 500', currency: 'USD', fallbackValue: 5620, volatility: 0.15 },
  { symbol: '^STOXX50E', name: 'Euro Stoxx 50', currency: 'EUR', fallbackValue: 4890, volatility: 0.16 },
  { symbol: '^IXIC', name: 'Nasdaq Composite', currency: 'USD', fallbackValue: 17800, volatility: 0.21 },
  { symbol: '^GDAXI', name: 'DAX', currency: 'EUR', fallbackValue: 18450, volatility: 0.17 },
  { symbol: '^N225', name: 'Nikkei 225', currency: 'JPY', fallbackValue: 38200, volatility: 0.19 },
] as const;
