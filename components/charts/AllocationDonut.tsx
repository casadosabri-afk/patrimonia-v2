'use client';

import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { AllocationSlice } from '@/types';
import { formatEuro, formatPercent } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { colorAt } from './palette';

/** Répartition du patrimoine : anneau + légende cliquable. */
export function AllocationDonut({
  slices,
  total,
  onSelect,
  selectedKey,
}: {
  slices: AllocationSlice[];
  total: number;
  onSelect?: (slice: AllocationSlice) => void;
  selectedKey?: string | null;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const focused = hovered !== null ? slices[hovered] : slices.find((slice) => slice.key === selectedKey);

  if (slices.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-fg-subtle">Aucun actif renseigné pour ce client.</p>
    );
  }

  return (
    <div className="@container/donut">
      <div className="flex flex-col gap-4 @md/donut:flex-row @md/donut:items-center">
      <div className="relative mx-auto h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="66%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
              onMouseLeave={() => setHovered(null)}
            >
              {slices.map((slice, index) => (
                <Cell
                  key={slice.key}
                  fill={colorAt(index)}
                  opacity={hovered === null || hovered === index ? 1 : 0.35}
                  onMouseEnter={() => setHovered(index)}
                  onClick={() => onSelect?.(slice)}
                  style={{ cursor: onSelect ? 'pointer' : 'default', outline: 'none' }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] text-fg-subtle">{focused ? focused.label : 'Patrimoine brut'}</p>
          <p className="text-base font-semibold tracking-tight text-fg tabular">
            {formatEuro(focused ? focused.value : total)}
          </p>
          {focused ? (
            <p className="text-[11px] text-fg-muted tabular">{formatPercent(focused.sharePct, 1)}</p>
          ) : null}
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-1">
        {slices.map((slice, index) => (
          <li key={slice.key}>
            <button
              type="button"
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect?.(slice)}
              disabled={!onSelect}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors',
                onSelect && 'hover:bg-surface-2',
                selectedKey === slice.key && 'bg-surface-2',
              )}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colorAt(index) }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-xs text-fg-muted">{slice.label}</span>
              <span className="text-xs font-medium text-fg tabular">{formatPercent(slice.sharePct, 1)}</span>
              <span className="hidden w-24 shrink-0 text-right text-xs text-fg-subtle tabular @lg/donut:block">
                {formatEuro(slice.value)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
}
