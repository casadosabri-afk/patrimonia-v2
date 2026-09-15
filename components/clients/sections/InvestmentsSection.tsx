'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { AssetAccount, ValuedInvestment } from '@/types';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  SegmentedControl,
  TrendPill,
  OriginBadge,
  type Column,
} from '@/components/ui';
import { BarComparison } from '@/components/charts/BarComparison';
import { ACCOUNT_KIND_LABELS, INSTRUMENT_TYPE_LABELS } from '@/lib/utils/labels';
import { formatEuro, formatNumber, formatPercent } from '@/lib/utils/format';

type GroupBy = 'ligne' | 'enveloppe' | 'secteur' | 'region';

export function InvestmentsSection({
  clientId,
  investments,
  accounts,
  priceOrigin,
  priceProvider,
}: {
  clientId: string;
  investments: ValuedInvestment[];
  accounts: AssetAccount[];
  priceOrigin: 'live' | 'mock' | 'fixture';
  priceProvider: string;
}) {
  const [groupBy, setGroupBy] = useState<GroupBy>('ligne');
  const accountById = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts]);

  const total = investments.reduce((sum, item) => sum + item.value, 0);
  const invested = investments.reduce((sum, item) => sum + item.investedAmount, 0);
  const gain = total - invested;

  const grouped = useMemo(() => {
    if (groupBy === 'ligne') return [];
    const key = (item: ValuedInvestment) =>
      groupBy === 'enveloppe'
        ? (accountById.get(item.accountId)?.label ?? 'Autre')
        : groupBy === 'secteur'
          ? item.sector
          : item.region;

    const totals = new Map<string, number>();
    for (const item of investments) totals.set(key(item), (totals.get(key(item)) ?? 0) + item.value);
    return [...totals.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [groupBy, investments, accountById]);

  const columns: Column<ValuedInvestment>[] = [
    {
      key: 'name',
      header: 'Support',
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{row.name}</p>
          <p className="truncate text-[11px] text-fg-subtle">
            {row.ticker ?? 'Non coté'} · {INSTRUMENT_TYPE_LABELS[row.type]}
          </p>
        </div>
      ),
    },
    {
      key: 'account',
      header: 'Enveloppe',
      hideOnMobile: true,
      cell: (row) => {
        const account = accountById.get(row.accountId);
        return (
          <Badge tone="neutral">{account ? ACCOUNT_KIND_LABELS[account.kind] : '—'}</Badge>
        );
      },
    },
    {
      key: 'quantity',
      header: 'Quantité',
      align: 'right',
      hideOnMobile: true,
      cell: (row) => <span className="text-xs text-fg-muted">{formatNumber(row.quantity, 4)}</span>,
    },
    {
      key: 'cost',
      header: 'Prix de revient',
      align: 'right',
      hideOnMobile: true,
      cell: (row) => <span className="text-xs text-fg-muted">{formatEuro(row.averageCost, true)}</span>,
    },
    {
      key: 'price',
      header: 'Cours',
      align: 'right',
      cell: (row) => <span className="text-xs text-fg">{formatEuro(row.price, true)}</span>,
    },
    {
      key: 'value',
      header: 'Valeur',
      align: 'right',
      cell: (row) => <span className="text-sm font-medium text-fg">{formatEuro(row.value)}</span>,
    },
    {
      key: 'gain',
      header: 'Plus-value',
      align: 'right',
      cell: (row) => (
        <div>
          <TrendPill value={row.gainPct} />
          <p className="mt-0.5 text-[11px] text-fg-subtle tabular">{formatEuro(row.gain)}</p>
        </div>
      ),
    },
    {
      key: 'weight',
      header: 'Poids',
      align: 'right',
      hideOnMobile: true,
      cell: (row) => <span className="text-xs text-fg-muted">{formatPercent(row.weightPct, 1)}</span>,
    },
    {
      key: 'link',
      header: '',
      align: 'right',
      cell: (row) => (
        <Link
          href={`/clients/${clientId}/investissements/${row.id}`}
          aria-label={`Ouvrir la fiche de ${row.name}`}
          className="inline-flex text-fg-subtle hover:text-accent-600"
        >
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-fg-muted">Valorisation</p>
          <p className="mt-1 text-xl font-semibold text-fg tabular">{formatEuro(total)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-fg-muted">Montant investi</p>
          <p className="mt-1 text-xl font-semibold text-fg tabular">{formatEuro(invested)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-fg-muted">Plus-value latente</p>
          <p className="mt-1 text-xl font-semibold text-fg tabular">{formatEuro(gain)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-fg-muted">Performance</p>
          <div className="mt-2">
            <TrendPill value={invested > 0 ? (gain / invested) * 100 : 0} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Portefeuille</CardTitle>
            <p className="mt-0.5 text-xs text-fg-muted">
              {investments.length} ligne{investments.length > 1 ? 's' : ''} d’investissement.
            </p>
          </div>
          <OriginBadge origin={priceOrigin} provider={priceProvider} />
        </CardHeader>
        <CardContent>
          <SegmentedControl
            className="mb-3"
            options={[
              { value: 'ligne', label: 'Par ligne' },
              { value: 'enveloppe', label: 'Par enveloppe' },
              { value: 'secteur', label: 'Par secteur' },
              { value: 'region', label: 'Par région' },
            ]}
            value={groupBy}
            onChange={(value) => setGroupBy(value as GroupBy)}
          />

          {groupBy === 'ligne' ? (
            <DataTable
              rows={[...investments].sort((a, b) => b.value - a.value)}
              columns={columns}
              rowKey={(row) => row.id}
              emptyTitle="Aucun investissement"
              emptyDescription="Ce client ne détient aucune ligne d’investissement enregistrée."
              mobileCard={(row) => (
                <Link
                  href={`/clients/${clientId}/investissements/${row.id}`}
                  className="block rounded-xl border border-border bg-surface p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg">{row.name}</p>
                      <p className="truncate text-[11px] text-fg-subtle">
                        {row.ticker ?? 'Non coté'} · {formatPercent(row.weightPct, 1)} du portefeuille
                      </p>
                    </div>
                    <TrendPill value={row.gainPct} />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-fg tabular">{formatEuro(row.value)}</p>
                </Link>
              )}
            />
          ) : (
            <BarComparison data={grouped} height={Math.max(180, grouped.length * 34)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
