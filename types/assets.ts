import type { Euro, Id, ISODate } from './common';

/** Grandes familles patrimoniales utilisées pour la répartition. */
export type AssetClass =
  | 'immobilier'
  | 'liquidites'
  | 'actions'
  | 'etf'
  | 'obligations'
  | 'assurance_vie'
  | 'pea'
  | 'compte_titres'
  | 'per'
  | 'crypto'
  | 'private_equity'
  | 'autres';

/** Regroupement macro affiché dans la vue de répartition. */
export type AssetBucket = 'immobilier' | 'financier' | 'liquidites' | 'autres';

/** Enveloppe fiscale / contenant détenant les lignes d'investissement. */
export type AccountKind =
  | 'pea'
  | 'compte_titres'
  | 'assurance_vie'
  | 'per'
  | 'livret'
  | 'compte_courant'
  | 'crypto'
  | 'private_equity';

export interface AssetAccount {
  id: Id;
  firmId: Id;
  clientId: Id;
  kind: AccountKind;
  label: string;
  institution: string;
  openedAt: ISODate;
  /** Solde en espèces non investi du contenant. */
  cashBalance: Euro;
  currency: 'EUR';
}

export type InstrumentType = 'action' | 'etf' | 'obligation' | 'fonds' | 'crypto' | 'non_cote';

export interface Investment {
  id: Id;
  firmId: Id;
  clientId: Id;
  accountId: Id;
  name: string;
  /** Ticker exploité par le MarketDataService. `null` pour les actifs non cotés. */
  ticker: string | null;
  isin: string | null;
  type: InstrumentType;
  assetClass: AssetClass;
  sector: string;
  region: string;
  quantity: number;
  averageCost: Euro;
  /** Dernière valorisation connue, utilisée en repli si le marché est indisponible. */
  fallbackPrice: Euro;
  currency: 'EUR' | 'USD';
  purchasedAt: ISODate;
}

export interface ValuedInvestment extends Investment {
  price: Euro;
  value: Euro;
  investedAmount: Euro;
  gain: Euro;
  gainPct: number;
  dayChangePct: number;
  /** Poids dans la totalité des placements financiers du client. */
  weightPct: number;
  priceOrigin: 'live' | 'mock' | 'fixture';
  priceProvider: string;
}

export type PropertyKind =
  | 'residence_principale'
  | 'residence_secondaire'
  | 'locatif'
  | 'scpi'
  | 'terrain'
  | 'commercial';

export interface RealEstateAsset {
  id: Id;
  firmId: Id;
  clientId: Id;
  label: string;
  kind: PropertyKind;
  city: string;
  postalCode: string;
  surfaceM2: number;
  purchasePrice: Euro;
  currentValue: Euro;
  purchasedAt: ISODate;
  /** Loyer mensuel brut ; 0 si le bien n'est pas loué. */
  monthlyRent: Euro;
  monthlyCharges: Euro;
  annualPropertyTax: Euro;
  ownershipPct: number;
  linkedDebtId: Id | null;
}

export type DebtKind = 'credit_immobilier' | 'credit_consommation' | 'credit_travaux' | 'autre';

export interface Debt {
  id: Id;
  firmId: Id;
  clientId: Id;
  label: string;
  kind: DebtKind;
  lender: string;
  initialAmount: Euro;
  remainingAmount: Euro;
  annualRatePct: number;
  insuranceRatePct: number;
  monthlyPayment: Euro;
  startedAt: ISODate;
  endsAt: ISODate;
}

export interface AllocationSlice {
  key: AssetClass;
  label: string;
  bucket: AssetBucket;
  value: Euro;
  sharePct: number;
}

export interface BucketSlice {
  key: AssetBucket;
  label: string;
  value: Euro;
  sharePct: number;
}

export interface NetWorthPoint {
  date: ISODate;
  netWorth: Euro;
  grossAssets: Euro;
  debt: Euro;
}

export interface Patrimony {
  clientId: Id;
  grossAssets: Euro;
  totalDebt: Euro;
  netWorth: Euro;
  liquidity: Euro;
  realEstateValue: Euro;
  financialValue: Euro;
  otherValue: Euro;
  allocation: AllocationSlice[];
  buckets: BucketSlice[];
  history: NetWorthPoint[];
  yearPerformancePct: number;
}
