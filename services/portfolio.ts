import 'server-only';

import type {
  Client,
  ClientSummary,
  CoherenceScore,
  DataOrigin,
  Insight,
  Patrimony,
  ValuedInvestment,
} from '@/types';
import { getMarketDataService } from '@/services/market';
import { getRepository, type ClientRecord } from '@/services/db';
import type { AccessContext } from '@/services/db/access';
import { valueInvestments, type PriceInfo } from '@/lib/patrimony/valuation';
import { computePatrimony } from '@/lib/patrimony/patrimony';
import { buildNetWorthHistory } from '@/lib/patrimony/history';
import { analyzeClient } from '@/lib/intelligence/rules';
import { computeCoherenceScore } from '@/lib/intelligence/score';
import type { AnalysisContext } from '@/lib/intelligence/context';

export interface ClientOverview {
  record: ClientRecord;
  patrimony: Patrimony;
  investments: ValuedInvestment[];
  insights: Insight[];
  score: CoherenceScore;
  /** Origine dominante des prix utilisés pour la valorisation. */
  priceOrigin: DataOrigin;
  priceProvider: string;
}

/** Récupère les prix de marché des lignes cotées d'un ensemble d'investissements. */
async function resolvePrices(
  tickers: string[],
  currencies: string[],
): Promise<{ prices: Map<string, PriceInfo>; fxToEur: Record<string, number>; origin: DataOrigin; provider: string }> {
  const prices = new Map<string, PriceInfo>();

  if (tickers.length === 0) {
    return { prices, fxToEur: { EUR: 1 }, origin: 'fixture', provider: 'Dernière valorisation connue' };
  }

  const market = getMarketDataService();
  const [quotes, fx] = await Promise.all([
    market.getQuotes(tickers),
    market.getFxToEur(currencies),
  ]);

  for (const [symbol, quote] of quotes.data) {
    prices.set(symbol, {
      price: quote.price,
      currency: quote.currency === 'USD' ? 'USD' : 'EUR',
      dayChangePct: quote.changePct,
      origin: quotes.origin === 'live' ? 'live' : 'mock',
      provider: quotes.provider,
    });
  }

  return {
    prices,
    fxToEur: fx.data,
    origin: quotes.origin,
    provider: quotes.provider,
  };
}

/**
 * Vue 360° d'un client : patrimoine consolidé, analyse et score.
 *
 * Toutes les données de marché passent par le MarketDataService ; leur origine
 * est propagée jusqu'à l'interface.
 */
export async function getClientOverview(
  access: AccessContext,
  clientId: string,
  now = new Date(),
): Promise<ClientOverview | null> {
  const repository = getRepository();
  const record = await repository.getClientRecord(access, clientId);
  if (!record) return null;

  return buildOverview(record, now);
}

export async function buildOverview(record: ClientRecord, now = new Date()): Promise<ClientOverview> {
  const tickers = [...new Set(record.investments.flatMap((item) => (item.ticker ? [item.ticker] : [])))];
  const currencies = [...new Set(record.investments.map((item) => item.currency))];
  const { prices, fxToEur, origin, provider } = await resolvePrices(tickers, currencies);

  const investments = valueInvestments(record.investments, { prices, fxToEur });

  const grossEstimate =
    investments.reduce((sum, item) => sum + item.value, 0) +
    record.accounts.reduce((sum, account) => sum + account.cashBalance, 0) +
    record.properties.reduce(
      (sum, property) => sum + (property.currentValue * property.ownershipPct) / 100,
      0,
    );
  const debtTotal = record.debts.reduce((sum, debt) => sum + debt.remainingAmount, 0);

  const patrimony = computePatrimony({
    clientId: record.client.id,
    accounts: record.accounts,
    investments,
    properties: record.properties,
    debts: record.debts,
    history: buildNetWorthHistory({
      clientId: record.client.id,
      currentGrossAssets: grossEstimate,
      currentDebt: debtTotal,
      months: 13,
      annualDriftPct: 4.5,
      volatility: 0.05,
      now,
    }),
  });

  const context: AnalysisContext = {
    client: record.client,
    patrimony,
    accounts: record.accounts,
    investments,
    properties: record.properties,
    debts: record.debts,
    goals: record.goals,
    now,
  };

  return {
    record,
    patrimony,
    investments,
    insights: analyzeClient(context),
    score: computeCoherenceScore(context),
    priceOrigin: tickers.length > 0 ? origin : 'fixture',
    priceProvider: provider,
  };
}

/** Synthèse légère utilisée par les listes et le dashboard. */
export async function getClientSummaries(
  access: AccessContext,
  clients: Client[],
  now = new Date(),
): Promise<ClientSummary[]> {
  const repository = getRepository();
  const alerts = await repository.listAlerts(access, { status: 'tous' });
  const interactions = access.role === 'client' ? [] : await repository.listInteractions(access);

  const summaries = await Promise.all(
    clients.map(async (client) => {
      const record = await repository.getClientRecord(access, client.id);
      if (!record) return null;

      const overview = await buildOverview(record, now);
      const openAlerts = alerts.filter(
        (alert) =>
          alert.clientId === client.id && (alert.status === 'ouverte' || alert.status === 'en_cours'),
      ).length;

      // « Dernier échange » désigne un contact avec le client, pas une note ou
      // une tâche interne du conseiller.
      const lastInteraction = interactions.find(
        (item) =>
          item.clientId === client.id &&
          (item.kind === 'appel' || item.kind === 'email' || item.kind === 'rendez_vous'),
      );

      return {
        client,
        netWorth: overview.patrimony.netWorth,
        grossAssets: overview.patrimony.grossAssets,
        totalDebt: overview.patrimony.totalDebt,
        liquidity: overview.patrimony.liquidity,
        realEstateValue: overview.patrimony.realEstateValue,
        financialValue: overview.patrimony.financialValue,
        otherValue: overview.patrimony.otherValue,
        yearPerformancePct: overview.patrimony.yearPerformancePct,
        openAlerts,
        coherenceScore: overview.score.score,
        primaryAdvisorId: client.advisors.find((link) => link.primary)?.advisorId ?? null,
        lastInteractionAt: lastInteraction?.occurredAt ?? null,
      } satisfies ClientSummary;
    }),
  );

  return summaries.filter((summary): summary is ClientSummary => summary !== null);
}

/** Insights consolidés de tout le portefeuille, pour la file « à traiter ». */
export async function getPortfolioInsights(
  access: AccessContext,
  clients: Client[],
  now = new Date(),
): Promise<{ client: Client; insight: Insight }[]> {
  const repository = getRepository();

  const perClient = await Promise.all(
    clients.map(async (client) => {
      const record = await repository.getClientRecord(access, client.id);
      if (!record) return [];
      const overview = await buildOverview(record, now);
      return overview.insights.slice(0, 3).map((insight) => ({ client, insight }));
    }),
  );

  return perClient.flat().sort((a, b) => b.insight.weight - a.insight.weight);
}
