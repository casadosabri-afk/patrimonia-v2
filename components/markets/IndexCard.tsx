'use client';

import { useState } from 'react';
import type { IndexSnapshot } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, TrendPill } from '@/components/ui';
import { PriceChart } from '@/components/charts/PriceChart';
import { formatNumber } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export function IndexGrid({ indices }: { indices: IndexSnapshot[] }) {
  const [selected, setSelected] = useState(indices[0]?.symbol ?? null);
  const current = indices.find((index) => index.symbol === selected);

  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {indices.map((index) => (
          <li key={index.symbol}>
            <button
              type="button"
              onClick={() => setSelected(index.symbol)}
              aria-pressed={selected === index.symbol}
              className={cn(
                'w-full rounded-card border p-4 text-left transition-all',
                selected === index.symbol
                  ? 'border-accent-300 bg-accent-50'
                  : 'border-border bg-surface hover:-translate-y-0.5 hover:shadow-card',
              )}
            >
              <p className="truncate text-xs text-fg-muted">{index.name}</p>
              <p className="mt-1 text-lg font-semibold text-fg tabular">
                {formatNumber(index.value, index.value > 1000 ? 0 : 2)}
              </p>
              <TrendPill value={index.changePct} digits={2} className="mt-1.5" />
            </button>
          </li>
        ))}
      </ul>

      {current ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{current.name}</CardTitle>
              <p className="mt-0.5 text-xs text-fg-muted">
                {formatNumber(current.value, 2)} {current.currency}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <PriceChart symbol={current.symbol} currency={current.currency} initialRange="1A" height={300} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
