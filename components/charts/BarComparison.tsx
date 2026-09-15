'use client';

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatEuro, formatEuroCompact } from '@/lib/utils/format';
import { AXIS_STYLE, GRID_COLOR, colorAt } from './palette';
import { ChartTooltip } from './ChartTooltip';

export interface BarDatum {
  label: string;
  value: number;
}

/** Comparaison horizontale simple (immobilier, dettes, objectifs…). */
export function BarComparison({
  data,
  height = 220,
  valueName = 'Valeur',
  horizontal = true,
  monochrome = false,
}: {
  data: BarDatum[];
  height?: number;
  valueName?: string;
  horizontal?: boolean;
  monochrome?: boolean;
}) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-xs text-fg-subtle">Aucune donnée à représenter.</p>;
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" horizontal={!horizontal} vertical={horizontal} />
          {horizontal ? (
            <>
              <XAxis
                type="number"
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => formatEuroCompact(value)}
              />
              <YAxis type="category" dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} width={124} />
            </>
          ) : (
            <>
              <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
              <YAxis
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(value: number) => formatEuroCompact(value)}
              />
            </>
          )}
          <Tooltip
            cursor={{ fill: 'var(--color-surface-2)' }}
            content={<ChartTooltip valueFormatter={(value) => formatEuro(value)} />}
          />
          <Bar dataKey="value" name={valueName} radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={monochrome ? 'var(--color-accent-500)' : colorAt(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
