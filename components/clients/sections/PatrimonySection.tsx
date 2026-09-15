'use client';

import { useState } from 'react';
import type { AllocationSlice, AssetAccount, Patrimony, ValuedInvestment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, EmptyState, Badge } from '@/components/ui';
import { AllocationDonut } from '@/components/charts/AllocationDonut';
import { BarComparison } from '@/components/charts/BarComparison';
import { NetWorthChart } from '@/components/charts/NetWorthChart';
import { ACCOUNT_KIND_LABELS } from '@/lib/utils/labels';
import { envelopeAssetClass } from '@/lib/patrimony/patrimony';
import { formatEuro, formatPercent } from '@/lib/utils/format';

export function PatrimonySection({
  patrimony,
  accounts,
  investments,
}: {
  patrimony: Patrimony;
  accounts: AssetAccount[];
  investments: ValuedInvestment[];
}) {
  const [selected, setSelected] = useState<AllocationSlice | null>(null);
  const accountById = new Map(accounts.map((account) => [account.id, account]));

  /** Contenu détaillé de la catégorie sélectionnée. */
  const details = selected
    ? [
        ...accounts
          .filter(
            (account) =>
              account.cashBalance > 0 && envelopeAssetClass(account.kind, 'liquidites') === selected.key,
          )
          .map((account) => ({
            id: account.id,
            label: `${account.label} — espèces`,
            sublabel: account.institution,
            value: account.cashBalance,
          })),
        ...investments
          .filter((investment) => {
            const account = accountById.get(investment.accountId);
            return envelopeAssetClass(account?.kind, investment.assetClass) === selected.key;
          })
          .map((investment) => ({
            id: investment.id,
            label: investment.name,
            sublabel: `${investment.quantity} × ${formatEuro(investment.price, true)}`,
            value: investment.value,
          })),
      ].sort((a, b) => b.value - a.value)
    : [];

  const isRealEstate = selected?.key === 'immobilier';

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Patrimoine total</CardTitle>
            <p className="mt-0.5 text-xs text-fg-muted">
              Cliquez sur une catégorie pour afficher son contenu détaillé.
            </p>
          </div>
          <p className="text-xl font-semibold tracking-tight text-fg tabular">
            {formatEuro(patrimony.grossAssets)}
          </p>
        </CardHeader>
        <CardContent>
          <AllocationDonut
            slices={patrimony.allocation}
            total={patrimony.grossAssets}
            selectedKey={selected?.key ?? null}
            onSelect={(slice) => setSelected((current) => (current?.key === slice.key ? null : slice))}
          />
        </CardContent>
      </Card>

      {selected ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{selected.label}</CardTitle>
              <p className="mt-0.5 text-xs text-fg-muted">
                {formatEuro(selected.value)} · {formatPercent(selected.sharePct, 1)} du patrimoine brut
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs font-medium text-accent-700 hover:underline"
            >
              Fermer
            </button>
          </CardHeader>
          <CardContent>
            {isRealEstate ? (
              <p className="text-xs text-fg-muted">
                Le détail des biens immobiliers est présenté dans la section Immobilier.
              </p>
            ) : details.length === 0 ? (
              <EmptyState title="Aucun élément détaillé" />
            ) : (
              <ul className="divide-y divide-border">
                {details.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-fg">{item.label}</p>
                      <p className="truncate text-[11px] text-fg-subtle">{item.sublabel}</p>
                    </div>
                    <p className="shrink-0 text-xs font-medium text-fg tabular">{formatEuro(item.value)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Grandes masses</CardTitle>
          </CardHeader>
          <CardContent>
            <BarComparison
              data={patrimony.buckets.map((bucket) => ({ label: bucket.label, value: bucket.value }))}
            />
            <ul className="mt-2 space-y-1">
              {patrimony.buckets.map((bucket) => (
                <li key={bucket.key} className="flex items-center justify-between text-xs">
                  <span className="text-fg-muted">{bucket.label}</span>
                  <span className="font-medium text-fg tabular">{formatPercent(bucket.sharePct, 1)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enveloppes et comptes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {accounts.map((account) => {
                const invested = investments
                  .filter((investment) => investment.accountId === account.id)
                  .reduce((sum, investment) => sum + investment.value, 0);
                return (
                  <li key={account.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-fg">{account.label}</p>
                      <p className="truncate text-[11px] text-fg-subtle">{account.institution}</p>
                    </div>
                    <Badge tone="neutral">{ACCOUNT_KIND_LABELS[account.kind]}</Badge>
                    <p className="w-24 shrink-0 text-right text-xs font-medium text-fg tabular">
                      {formatEuro(invested + account.cashBalance)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actif brut et endettement</CardTitle>
        </CardHeader>
        <CardContent>
          <NetWorthChart points={patrimony.history} height={260} />
        </CardContent>
      </Card>
    </div>
  );
}
