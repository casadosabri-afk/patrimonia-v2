'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { NetWorthPoint } from '@/types';
import { formatEuro, formatEuroCompact } from '@/lib/utils/format';
import { AXIS_STYLE, GRID_COLOR } from './palette';
import { ChartTooltip } from './ChartTooltip';

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function monthLabel(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getMonth()] ?? ''} ${`${date.getFullYear()}`.slice(2)}`;
}

/** Évolution du patrimoine net, avec actif brut et endettement. */
export function NetWorthChart({
  points,
  height = 240,
  showDebt = true,
}: {
  points: NetWorthPoint[];
  height?: number;
  showDebt?: boolean;
}) {
  const data = points.map((point) => ({ ...point, label: monthLabel(point.date) }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent-500)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-accent-500)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => formatEuroCompact(value)}
          />
          <Tooltip
            content={<ChartTooltip valueFormatter={(value) => formatEuro(value)} />}
            cursor={{ stroke: 'var(--color-border-strong)' }}
          />
          {showDebt ? <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} /> : null}
          <Area
            type="monotone"
            dataKey="netWorth"
            name="Patrimoine net"
            stroke="var(--color-accent-500)"
            strokeWidth={2}
            fill="url(#netWorthFill)"
          />
          {showDebt ? (
            <Area
              type="monotone"
              dataKey="debt"
              name="Endettement"
              stroke="var(--color-negative)"
              strokeWidth={1.5}
              fillOpacity={0}
              strokeDasharray="4 3"
            />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
