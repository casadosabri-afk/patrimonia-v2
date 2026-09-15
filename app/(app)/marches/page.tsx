import type { Metadata } from 'next';
import { requireAccess } from '@/lib/auth/session';
import { getMarketDataService } from '@/services/market';
import { getRepository } from '@/services/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { OriginBadge, DisclaimerNote } from '@/components/ui/DataNotice';
import { TrendPill } from '@/components/ui/TrendPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { IndexGrid } from '@/components/markets/IndexCard';
import { NewsFeed } from '@/components/dashboard/NewsFeed';
import { formatDate, formatNumber, formatPercent } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Marchés' };
export const dynamic = 'force-dynamic';

export default async function MarketsPage() {
  const { access } = await requireAccess('advisor', 'admin');
  const repository = getRepository();
  const market = getMarketDataService();

  const clients = await repository.listClients(access);
  const records = await Promise.all(
    clients.slice(0, 40).map((client) => repository.getClientRecord(access, client.id)),
  );

  // Les supports les plus détenus dans le cabinet, pour un suivi ciblé.
  const holdings = new Map<string, { name: string; count: number }>();
  for (const record of records) {
    for (const investment of record?.investments ?? []) {
      if (!investment.ticker) continue;
      const entry = holdings.get(investment.ticker) ?? { name: investment.name, count: 0 };
      entry.count += 1;
      holdings.set(investment.ticker, entry);
    }
  }

  const topSymbols = [...holdings.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);

  const [indices, quotes, news, macro] = await Promise.all([
    market.getIndexData(),
    market.getQuotes(topSymbols.map(([symbol]) => symbol)),
    market.getNews(topSymbols.slice(0, 3).map(([symbol]) => symbol), 8),
    market.getMacroIndicators(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marchés"
        subtitle="Indices suivis, supports les plus détenus dans le cabinet et repères macroéconomiques."
        actions={<OriginBadge origin={indices.origin} provider={indices.provider} />}
      />

      <IndexGrid indices={indices.data} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Supports les plus détenus</CardTitle>
              <p className="mt-0.5 text-xs text-fg-muted">
                Classés par nombre de clients du cabinet exposés à la ligne.
              </p>
            </div>
            <OriginBadge origin={quotes.origin} provider={quotes.provider} />
          </CardHeader>
          <CardContent>
            {topSymbols.length === 0 ? (
              <EmptyState title="Aucun support coté" description="Aucune ligne cotée dans les portefeuilles." />
            ) : (
              <ul className="divide-y divide-border">
                {topSymbols.map(([symbol, info]) => {
                  const quote = quotes.data.get(symbol);
                  return (
                    <li key={symbol} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-fg">{info.name}</p>
                        <p className="truncate text-[11px] text-fg-subtle">
                          {symbol} · détenu par {info.count} client{info.count > 1 ? 's' : ''}
                        </p>
                      </div>
                      <p className="shrink-0 text-xs font-medium text-fg tabular">
                        {quote ? `${formatNumber(quote.price, 2)} ${quote.currency}` : '—'}
                      </p>
                      <div className="w-20 shrink-0 text-right">
                        {quote ? <TrendPill value={quote.changePct} digits={2} /> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Repères macroéconomiques</CardTitle>
            <OriginBadge origin={macro.origin} provider={macro.provider} />
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {macro.data.map((indicator) => (
                <li key={indicator.key} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs text-fg-muted">{indicator.label}</p>
                    <p className="text-[10px] text-fg-subtle">au {formatDate(indicator.asOf)}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-fg tabular">
                    {indicator.unit === '%'
                      ? formatPercent(indicator.value, 2)
                      : `${formatNumber(indicator.value, 2)} ${indicator.unit}`}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <NewsFeed items={news.data} origin={news.origin} provider={news.provider} limit={8} />

      <DisclaimerNote>
        Les données de marché proviennent du fournisseur configuré dans les variables d’environnement. Lorsque ce
        fournisseur est injoignable, PATRIMONIA bascule sur un jeu simulé, signalé par la mention DEMO sur chaque
        bloc concerné. Une donnée simulée n’est jamais présentée comme un cours réel.
      </DisclaimerNote>
    </div>
  );
}
