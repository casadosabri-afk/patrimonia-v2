'use client';

import { CreditCard } from 'lucide-react';
import type { DebtMetrics } from '@/lib/patrimony/debt';
import { amortizationSeries } from '@/lib/patrimony/debt';
import { Card, CardContent, CardHeader, CardTitle, EmptyState, Badge, Progress } from '@/components/ui';
import { BarComparison } from '@/components/charts/BarComparison';
import { DEBT_KIND_LABELS } from '@/lib/utils/labels';
import { formatDate, formatEuro, formatPercent } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export function DebtsSection({
  metrics,
  debtRatio,
  annualIncome,
}: {
  metrics: DebtMetrics[];
  debtRatio: number;
  annualIncome: number;
}) {
  if (metrics.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={CreditCard}
          title="Aucune dette enregistrée"
          description="Ce client n’a aucun crédit en cours dans PATRIMONIA."
        />
      </Card>
    );
  }

  const totalRemaining = metrics.reduce((sum, item) => sum + item.debt.remainingAmount, 0);
  const totalInitial = metrics.reduce((sum, item) => sum + item.debt.initialAmount, 0);
  const totalMonthly = metrics.reduce((sum, item) => sum + item.debt.monthlyPayment, 0);
  const weightedRate =
    totalRemaining > 0
      ? metrics.reduce((sum, item) => sum + item.debt.annualRatePct * item.debt.remainingAmount, 0) /
        totalRemaining
      : 0;

  const heaviest = [...metrics].sort(
    (a, b) => b.debt.remainingAmount - a.debt.remainingAmount,
  )[0];
  const projection = heaviest ? amortizationSeries(heaviest.debt, 36) : [];

  const ratioTone = debtRatio >= 40 ? 'negative' : debtRatio >= 33 ? 'warning' : 'positive';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-fg-muted">Capital restant dû</p>
          <p className="mt-1 text-xl font-semibold text-fg tabular">{formatEuro(totalRemaining)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-fg-muted">Mensualités</p>
          <p className="mt-1 text-xl font-semibold text-fg tabular">{formatEuro(totalMonthly)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-fg-muted">Taux moyen pondéré</p>
          <p className="mt-1 text-xl font-semibold text-fg tabular">{formatPercent(weightedRate, 2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-fg-muted">Taux d’endettement</p>
          <p
            className={cn(
              'mt-1 text-xl font-semibold tabular',
              ratioTone === 'negative' ? 'text-negative' : ratioTone === 'warning' ? 'text-warning' : 'text-positive',
            )}
          >
            {formatPercent(debtRatio, 1)}
          </p>
          <p className="mt-0.5 text-[10px] text-fg-subtle">
            sur {formatEuro(annualIncome)} de revenus annuels
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Progression du remboursement</CardTitle>
            <p className="mt-0.5 text-xs text-fg-muted">
              {formatPercent(totalInitial > 0 ? ((totalInitial - totalRemaining) / totalInitial) * 100 : 0, 1)} du
              capital initial déjà remboursé.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {metrics.map((item) => (
              <li key={item.debt.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">{item.debt.label}</p>
                    <p className="truncate text-[11px] text-fg-subtle">
                      {item.debt.lender} · fin le {formatDate(item.debt.endsAt)}
                    </p>
                  </div>
                  <Badge tone="neutral">{DEBT_KIND_LABELS[item.debt.kind]}</Badge>
                </div>

                <Progress
                  value={item.repaidPct}
                  tone="accent"
                  className="mt-2 h-1.5"
                  label={`Remboursement de ${item.debt.label}`}
                />

                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] sm:grid-cols-4">
                  <div className="flex justify-between">
                    <dt className="text-fg-subtle">Capital initial</dt>
                    <dd className="text-fg-muted tabular">{formatEuro(item.debt.initialAmount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-fg-subtle">Restant dû</dt>
                    <dd className="font-medium text-fg tabular">{formatEuro(item.debt.remainingAmount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-fg-subtle">Taux</dt>
                    <dd className="text-fg-muted tabular">{formatPercent(item.debt.annualRatePct, 2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-fg-subtle">Mensualité</dt>
                    <dd className="text-fg-muted tabular">{formatEuro(item.debt.monthlyPayment)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition de l’endettement</CardTitle>
          </CardHeader>
          <CardContent>
            <BarComparison
              data={metrics.map((item) => ({ label: item.debt.label, value: item.debt.remainingAmount }))}
              height={Math.max(180, metrics.length * 42)}
            />
          </CardContent>
        </Card>

        {heaviest && projection.length > 0 ? (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Amortissement projeté</CardTitle>
                <p className="mt-0.5 text-xs text-fg-muted">
                  {heaviest.debt.label}, sur trois ans, à taux constant.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <BarComparison
                data={projection
                  .filter((_, index) => index % 6 === 0)
                  .map((point) => ({
                    label: formatDate(point.date),
                    value: point.remaining,
                  }))}
                horizontal={false}
                height={220}
                monochrome
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
