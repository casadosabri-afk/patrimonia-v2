import type { Metadata } from 'next';
import { requireClientOverview } from '@/lib/auth/clientAccess';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { TrendPill } from '@/components/ui/TrendPill';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { OriginBadge, DisclaimerNote } from '@/components/ui/DataNotice';
import { BarComparison } from '@/components/charts/BarComparison';
import { ACCOUNT_KIND_LABELS, INSTRUMENT_TYPE_LABELS } from '@/lib/utils/labels';
import { formatEuro, formatPercent } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Mes investissements' };
export const dynamic = 'force-dynamic';

export default async function ClientInvestmentsPage() {
  const { overview } = await requireClientOverview();
  const investments = [...overview.investments].sort((a, b) => b.value - a.value);
  const accountsById = new Map(overview.record.accounts.map((account) => [account.id, account]));

  const total = investments.reduce((sum, item) => sum + item.value, 0);
  const invested = investments.reduce((sum, item) => sum + item.investedAmount, 0);
  const gain = total - invested;

  const byType = new Map<string, number>();
  for (const investment of investments) {
    const label = INSTRUMENT_TYPE_LABELS[investment.type];
    byType.set(label, (byType.get(label) ?? 0) + investment.value);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vos investissements"
        subtitle="Le détail de vos placements financiers et leur performance depuis l’achat."
        actions={<OriginBadge origin={overview.priceOrigin} provider={overview.priceProvider} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Valeur actuelle" value={formatEuro(total)} tone="accent" />
        <MetricCard label="Montant investi" value={formatEuro(invested)} />
        <MetricCard label="Gain latent" value={formatEuro(gain)} />
        <MetricCard
          label="Performance"
          value={formatPercent(invested > 0 ? (gain / invested) * 100 : 0, 1)}
        />
      </div>

      {investments.length === 0 ? (
        <Card>
          <EmptyState
            title="Aucun investissement"
            description="Votre dossier ne comporte pas encore de placement financier."
          />
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Répartition par type de support</CardTitle>
            </CardHeader>
            <CardContent>
              <BarComparison
                data={[...byType.entries()].map(([label, value]) => ({ label, value }))}
                height={Math.max(160, byType.size * 40)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vos lignes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {investments.map((investment) => {
                  const account = accountsById.get(investment.accountId);
                  return (
                    <li key={investment.id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">{investment.name}</p>
                        <p className="truncate text-[11px] text-fg-subtle">
                          {INSTRUMENT_TYPE_LABELS[investment.type]}
                          {account ? ` · ${ACCOUNT_KIND_LABELS[account.kind]}` : ''}
                        </p>
                      </div>
                      <Badge tone="neutral">{formatPercent(investment.weightPct, 1)}</Badge>
                      <div className="text-right">
                        <p className="text-sm font-medium text-fg tabular">{formatEuro(investment.value)}</p>
                        <div className="mt-0.5 flex justify-end">
                          <TrendPill value={investment.gainPct} size="xs" />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      <DisclaimerNote>
        La performance affichée compare la valeur actuelle au prix d’achat. Elle ne tient pas compte de la
        fiscalité applicable en cas de retrait. Les performances passées ne préjugent pas des performances
        futures.
      </DisclaimerNote>
    </div>
  );
}
