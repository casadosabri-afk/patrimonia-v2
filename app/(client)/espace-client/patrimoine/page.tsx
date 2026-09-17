import type { Metadata } from 'next';
import { requireClientOverview } from '@/lib/auth/clientAccess';
import { computePropertyMetrics } from '@/lib/patrimony/debt';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { DisclaimerNote } from '@/components/ui/DataNotice';
import { AllocationDonut } from '@/components/charts/AllocationDonut';
import { NetWorthChart } from '@/components/charts/NetWorthChart';
import { BarComparison } from '@/components/charts/BarComparison';
import { PROPERTY_KIND_LABELS } from '@/lib/utils/labels';
import { formatEuro, formatPercent } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Mon patrimoine' };
export const dynamic = 'force-dynamic';

export default async function ClientPatrimonyPage() {
  const { overview } = await requireClientOverview();
  const { patrimony } = overview;
  const properties = overview.record.properties.map((property) =>
    computePropertyMetrics(property, overview.record.debts),
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Votre patrimoine"
        subtitle="Une vue d’ensemble de ce que vous possédez et de ce que vous devez."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Patrimoine net"
          value={formatEuro(patrimony.netWorth)}
          changePct={patrimony.yearPerformancePct}
          tone="accent"
        />
        <MetricCard label="Ce que vous possédez" value={formatEuro(patrimony.grossAssets)} />
        <MetricCard label="Ce que vous devez" value={formatEuro(patrimony.totalDebt)} />
        <MetricCard label="Disponible immédiatement" value={formatEuro(patrimony.liquidity)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Évolution sur douze mois</CardTitle>
        </CardHeader>
        <CardContent>
          <NetWorthChart points={patrimony.history} height={240} showDebt={false} />
          <p className="mt-3 text-xs leading-relaxed text-fg-muted">
            Cette courbe montre l’évolution de votre patrimoine net, c’est-à-dire la valeur de vos biens et
            placements diminuée de vos crédits en cours.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition</CardTitle>
          </CardHeader>
          <CardContent>
            <AllocationDonut slices={patrimony.allocation} total={patrimony.grossAssets} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grandes catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <BarComparison
              data={patrimony.buckets.map((bucket) => ({ label: bucket.label, value: bucket.value }))}
            />
            <ul className="mt-3 space-y-1.5">
              {patrimony.buckets.map((bucket) => (
                <li key={bucket.key} className="flex items-center justify-between text-xs">
                  <span className="text-fg-muted">{bucket.label}</span>
                  <span className="font-medium text-fg tabular">
                    {formatPercent(bucket.sharePct, 1)} · {formatEuro(bucket.value)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {properties.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Vos biens immobiliers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {properties.map((item) => (
                <li key={item.property.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{item.property.label}</p>
                    <p className="truncate text-[11px] text-fg-subtle">
                      {PROPERTY_KIND_LABELS[item.property.kind]} · {item.property.city}
                    </p>
                  </div>
                  {item.remainingDebt > 0 ? (
                    <p className="text-[11px] text-fg-subtle">
                      Crédit restant {formatEuro(item.remainingDebt)}
                    </p>
                  ) : null}
                  <p className="text-sm font-medium text-fg tabular">{formatEuro(item.property.currentValue)}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <DisclaimerNote>
        Les valeurs immobilières sont des estimations enregistrées dans votre dossier. Les valeurs de vos
        placements financiers suivent les cours de marché fournis par notre prestataire de données.
      </DisclaimerNote>
    </div>
  );
}
