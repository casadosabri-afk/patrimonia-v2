'use client';

import { Building2, MapPin } from 'lucide-react';
import type { PropertyMetrics } from '@/lib/patrimony/debt';
import { Card, CardContent, CardHeader, CardTitle, EmptyState, Badge, TrendPill } from '@/components/ui';
import { BarComparison } from '@/components/charts/BarComparison';
import { PROPERTY_KIND_LABELS } from '@/lib/utils/labels';
import { formatEuro, formatNumber, formatPercent, formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export function RealEstateSection({ metrics }: { metrics: PropertyMetrics[] }) {
  if (metrics.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Building2}
          title="Aucun bien immobilier"
          description="Ce client ne détient aucun actif immobilier enregistré dans PATRIMONIA."
        />
      </Card>
    );
  }

  const totalValue = metrics.reduce((sum, item) => sum + item.property.currentValue, 0);
  const totalDebt = metrics.reduce((sum, item) => sum + item.remainingDebt, 0);
  const totalCashflow = metrics.reduce((sum, item) => sum + item.monthlyCashflow, 0);
  const rentedValue = metrics
    .filter((item) => item.property.monthlyRent > 0)
    .reduce((sum, item) => sum + item.property.currentValue, 0);
  const totalRent = metrics.reduce((sum, item) => sum + item.annualGrossRent, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-fg-muted">Valeur du parc</p>
          <p className="mt-1 text-xl font-semibold text-fg tabular">{formatEuro(totalValue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-fg-muted">Dette adossée</p>
          <p className="mt-1 text-xl font-semibold text-fg tabular">{formatEuro(totalDebt)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-fg-muted">Valeur nette</p>
          <p className="mt-1 text-xl font-semibold text-fg tabular">{formatEuro(totalValue - totalDebt)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-fg-muted">Cash-flow mensuel</p>
          <p
            className={cn(
              'mt-1 text-xl font-semibold tabular',
              totalCashflow >= 0 ? 'text-positive' : 'text-negative',
            )}
          >
            {formatEuro(totalCashflow)}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Valeur par bien</CardTitle>
          </CardHeader>
          <CardContent>
            <BarComparison
              data={metrics.map((item) => ({ label: item.property.label, value: item.property.currentValue }))}
              height={Math.max(180, metrics.length * 42)}
              monochrome
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dette restante par bien</CardTitle>
          </CardHeader>
          <CardContent>
            {totalDebt === 0 ? (
              <p className="py-8 text-center text-xs text-fg-subtle">Aucun crédit adossé au parc immobilier.</p>
            ) : (
              <BarComparison
                data={metrics
                  .filter((item) => item.remainingDebt > 0)
                  .map((item) => ({ label: item.property.label, value: item.remainingDebt }))}
                height={Math.max(180, metrics.length * 42)}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {rentedValue > 0 ? (
        <Card className="p-4">
          <p className="text-xs text-fg-muted">
            Rendement brut moyen du parc loué :{' '}
            <span className="font-medium text-fg">
              {formatPercent(rentedValue > 0 ? (totalRent / rentedValue) * 100 : 0, 2)}
            </span>{' '}
            pour {formatEuro(totalRent)} de loyers annuels.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {metrics.map((item) => (
          <Card key={item.property.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{item.property.label}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-fg-subtle">
                  <MapPin className="size-3" aria-hidden />
                  {item.property.city} {item.property.postalCode}
                  {item.property.surfaceM2 > 0 ? ` · ${formatNumber(item.property.surfaceM2, 0)} m²` : ''}
                </p>
              </div>
              <Badge tone="brand">{PROPERTY_KIND_LABELS[item.property.kind]}</Badge>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-fg-subtle">Valeur</dt>
                <dd className="font-medium text-fg tabular">{formatEuro(item.property.currentValue)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-subtle">Prix d’achat</dt>
                <dd className="text-fg-muted tabular">{formatEuro(item.property.purchasePrice)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-subtle">Dette restante</dt>
                <dd className="text-fg-muted tabular">{formatEuro(item.remainingDebt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-subtle">Loyer mensuel</dt>
                <dd className="text-fg-muted tabular">{formatEuro(item.property.monthlyRent)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-subtle">Rendement brut</dt>
                <dd className="text-fg-muted tabular">{formatPercent(item.grossYieldPct, 2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-subtle">Rendement net</dt>
                <dd className="text-fg-muted tabular">{formatPercent(item.netYieldPct, 2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-subtle">Cash-flow</dt>
                <dd
                  className={cn(
                    'font-medium tabular',
                    item.monthlyCashflow >= 0 ? 'text-positive' : 'text-negative',
                  )}
                >
                  {formatEuro(item.monthlyCashflow)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-subtle">Acquis le</dt>
                <dd className="text-fg-muted">{formatDate(item.property.purchasedAt)}</dd>
              </div>
            </dl>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-[11px] text-fg-subtle">Plus-value depuis l’acquisition</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-fg-muted tabular">{formatEuro(item.capitalGain)}</span>
                <TrendPill value={item.capitalGainPct} />
              </div>
            </div>

            {item.property.ownershipPct < 100 ? (
              <p className="mt-2 text-[11px] text-fg-subtle">
                Détention à {formatPercent(item.property.ownershipPct, 0)} : seule cette quote-part est
                comptabilisée dans le patrimoine.
              </p>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
