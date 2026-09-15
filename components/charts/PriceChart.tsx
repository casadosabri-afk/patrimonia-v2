'use client';

import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HistoricalSeries, MarketRange } from '@/types';
import { MARKET_RANGES } from '@/services/market/provider';
import { formatNumber, formatSignedPercent } from '@/lib/utils/format';
import { SegmentedControl, Skeleton } from '@/components/ui';
import { OriginBadge } from '@/components/ui/DataNotice';
import { cn } from '@/lib/utils/cn';
import { AXIS_STYLE, GRID_COLOR } from './palette';
import { ChartTooltip } from './ChartTooltip';

interface SeriesResponse {
  series: HistoricalSeries | null;
  origin: 'live' | 'mock' | 'fixture';
  provider: string;
}

function axisLabel(value: string, range: MarketRange): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  if (range === '1D' || range === '1S') {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
  }
  if (range === '3A' || range === 'MAX') {
    return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' }).format(date);
  }
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(date);
}

/**
 * Graphique de cours interactif.
 *
 * Les séries sont chargées depuis l'API interne, qui appelle elle-même le
 * MarketDataService côté serveur : aucune clé ni appel externe n'est exposé ici.
 */
export function PriceChart({
  symbol,
  currency = 'EUR',
  initialRange = '1A',
  height = 260,
}: {
  symbol: string;
  currency?: string;
  initialRange?: MarketRange;
  height?: number;
}) {
  const [range, setRange] = useState<MarketRange>(initialRange);
  const [state, setState] = useState<SeriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/market/history?symbol=${encodeURIComponent(symbol)}&range=${range}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Historique indisponible');
        return (await response.json()) as SeriesResponse;
      })
      .then((payload) => {
        if (!cancelled) setState(payload);
      })
      .catch(() => {
        if (!cancelled) setError('Impossible de charger l’historique de ce support.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, range]);

  const points = state?.series?.points ?? [];
  const changePct = state?.series?.changePct ?? 0;
  const positive = changePct >= 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {state?.series ? (
            <span
              className={cn(
                'text-sm font-semibold tabular',
                positive ? 'text-positive' : 'text-negative',
              )}
            >
              {formatSignedPercent(changePct, 2)}
            </span>
          ) : null}
          {state ? <OriginBadge origin={state.origin} provider={state.provider} /> : null}
        </div>
        <SegmentedControl
          size="sm"
          options={MARKET_RANGES.map((value) => ({ value, label: value }))}
          value={range}
          onChange={setRange}
        />
      </div>

      {loading ? (
        <Skeleton style={{ height }} className="w-full" />
      ) : error || points.length < 2 ? (
        <div
          style={{ height }}
          className="flex items-center justify-center rounded-xl border border-dashed border-border text-xs text-fg-subtle"
        >
          {error ?? 'Aucune donnée disponible sur cette période.'}
        </div>
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`priceFill-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={positive ? 'var(--color-positive)' : 'var(--color-negative)'}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={positive ? 'var(--color-positive)' : 'var(--color-negative)'}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
                tickFormatter={(value: string) => axisLabel(value, range)}
              />
              <YAxis
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
                width={56}
                domain={['auto', 'auto']}
                tickFormatter={(value: number) => formatNumber(value, value > 100 ? 0 : 2)}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    valueFormatter={(value) => `${formatNumber(value, 2)} ${currency}`}
                    labelRenderer={(value) => axisLabel(value, range)}
                  />
                }
                cursor={{ stroke: 'var(--color-border-strong)' }}
              />
              <Area
                type="monotone"
                dataKey="close"
                name="Cours"
                stroke={positive ? 'var(--color-positive)' : 'var(--color-negative)'}
                strokeWidth={2}
                fill={`url(#priceFill-${symbol})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
