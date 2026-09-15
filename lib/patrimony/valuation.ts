import type { AssetAccount, Investment, ValuedInvestment } from '@/types';

export interface PriceInfo {
  price: number;
  currency: 'EUR' | 'USD';
  dayChangePct: number;
  origin: 'live' | 'mock' | 'fixture';
  provider: string;
}

export interface ValuationContext {
  /** Prix par ticker, dans la devise de cotation. */
  prices: Map<string, PriceInfo>;
  /** Taux de change vers l'euro, par devise de cotation. */
  fxToEur: Record<string, number>;
}

function toEur(amount: number, currency: string, fxToEur: Record<string, number>): number {
  if (currency === 'EUR') return amount;
  const rate = fxToEur[currency];
  return typeof rate === 'number' && rate > 0 ? amount * rate : amount;
}

/**
 * Valorise les lignes d'un portefeuille.
 *
 * Le prix retenu provient du MarketDataService quand il est disponible. À
 * défaut, la dernière valorisation connue (`fallbackPrice`) est utilisée et
 * l'origine `fixture` est propagée jusqu'à l'affichage : l'interface ne
 * présente alors jamais cette valeur comme un cours de marché.
 */
export function valueInvestments(
  investments: Investment[],
  context: ValuationContext,
): ValuedInvestment[] {
  const valued = investments.map((investment) => {
    const info = investment.ticker ? context.prices.get(investment.ticker) : undefined;
    const currency = info?.currency ?? investment.currency;
    const rawPrice = info?.price ?? investment.fallbackPrice;

    const price = toEur(rawPrice, currency, context.fxToEur);
    const cost = toEur(investment.averageCost, investment.currency, context.fxToEur);
    const value = price * investment.quantity;
    const investedAmount = cost * investment.quantity;
    const gain = value - investedAmount;

    return {
      ...investment,
      price,
      value,
      investedAmount,
      gain,
      gainPct: investedAmount > 0 ? (gain / investedAmount) * 100 : 0,
      dayChangePct: info?.dayChangePct ?? 0,
      weightPct: 0,
      priceOrigin: info?.origin ?? 'fixture',
      priceProvider: info?.provider ?? 'Dernière valorisation connue',
    } satisfies ValuedInvestment;
  });

  const total = valued.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return valued;
  return valued.map((item) => ({ ...item, weightPct: (item.value / total) * 100 }));
}

/** Espèces disponibles sur l'ensemble des enveloppes d'un client. */
export function sumAccountCash(accounts: AssetAccount[]): number {
  return accounts.reduce((sum, account) => sum + account.cashBalance, 0);
}

/** Liquidités immédiatement disponibles : comptes courants et livrets. */
export function sumLiquidity(accounts: AssetAccount[]): number {
  return accounts
    .filter((account) => account.kind === 'compte_courant' || account.kind === 'livret')
    .reduce((sum, account) => sum + account.cashBalance, 0);
}
