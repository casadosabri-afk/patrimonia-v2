'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { HistoricalSeries, MarketRange } from '@/types';
import { MARKET_RANGES } from '@/services/market/provider';
import { TRACKED_INDICES } from '@/data/demo/instruments';
import { formatNumber, formatSignedPercent } from '@/lib/utils/format';
import { SegmentedControl, Select, Skeleton } from '@/components/ui';
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

async function loadSeries(symbol: string, range: MarketRange): Promise<SeriesResponse> {
  const response = await fetch(
    `/api/market/history?symbol=${encodeURIComponent(symbol)}&range=${range}`,
  );
  if (!response.ok) throw new Error('Historique indisponible');
  return (await response.json()) as SeriesResponse;
}

/**
 * Graphique de cours interactif.
 *
 * Les séries sont chargées depuis l'API interne, qui appelle elle-même le
 * MarketDataService côté serveur : aucune clé ni appel externe n'est exposé ici.
 * Le mode comparaison ramène les deux séries en base 100 afin de comparer des
 * trajectoires et non des niveaux de prix.
 */
export function PriceChart({
  symbol,
  currency = 'EUR',
  initialRange = '1A',
  height = 260,
  comparable = true,
}: {
  symbol: string;
  currency?: string;
  initialRange?: MarketRange;
  height?: number;
  comparable?: boolean;
}) {
  const [range, setRange] = useState<MarketRange>(initialRange);
  const [benchmark, setBenchmark] = useState<string>('');
  const [state, setState] = useState<SeriesResponse | null>(null);
  const [reference, setReference] = useState<SeriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const benchmarks = useMemo(
    () => TRACKED_INDICES.filter((index) => index.symbol !== symbol),
    [symbol],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    loadSeries(symbol, range)
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

  useEffect(() => {
    if (!benchmark) {
      setReference(null);
      return;
    }

    let cancelled = false;
    loadSeries(benchmark, range)
      .then((payload) => {
        if (!cancelled) setReference(payload);
      })
      .catch(() => {
        if (!cancelled) setReference(null);
      });

    return () => {
      cancelled = true;
    };
  }, [benchmark, range]);

  const points = state?.series?.points ?? [];
  const changePct = state?.series?.changePct ?? 0;
  const positive = changePct >= 0;
  const comparing = Boolean(benchmark) && (reference?.series?.points.length ?? 0) > 1;

  /** En mode comparaison, les deux séries sont ramenées en base 100. */
  const data = useMemo(() => {
    if (!comparing) return points;

    const referencePoints = reference?.series?.points ?? [];
    const base = points[0]?.close ?? 1;
    const referenceBase = referencePoints[0]?.close ?? 1;
    const referenceByDate = new Map(referencePoints.map((point) => [point.date.slice(0, 10), point.close]));

    let lastReference = 100;
    return points.map((point) => {
      const raw = referenceByDate.get(point.date.slice(0, 10));
      if (typeof raw === 'number' && referenceBase > 0) lastReference = (raw / referenceBase) * 100;
      return {
        ...point,
        indexed: base > 0 ? (point.close / base) * 100 : 100,
        reference: lastReference,
      };
    });
  }, [comparing, points, reference]);

  const benchmarkName = benchmarks.find((index) => index.symbol === benchmark)?.name ?? 'Référence';

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
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

        <div className="flex flex-wrap items-center gap-2">
          {comparable ? (
            <Select
              value={benchmark}
              onChange={(event) => setBenchmark(event.target.value)}
              aria-label="Comparer à un indice"
              className="h-8 w-auto text-xs"
            >
              <option value="">Comparer à…</option>
              {benchmarks.map((index) => (
                <option key={index.symbol} value={index.symbol}>
                  {index.name}
                </option>
              ))}
            </Select>
          ) : null}
          <SegmentedControl
            size="sm"
            options={MARKET_RANGES.map((value) => ({ value, label: value }))}
            value={range}
            onChange={setRange}
          />
        </div>
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
        <>
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
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
                  tickFormatter={(value: number) =>
                    comparing ? formatNumber(value, 0) : formatNumber(value, value > 100 ? 0 : 2)
                  }
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      valueFormatter={(value) =>
                        comparing
                          ? `base ${formatNumber(value, 1)}`
                          : `${formatNumber(value, 2)} ${currency}`
                      }
                      labelRenderer={(value) => axisLabel(value, range)}
                    />
                  }
                  cursor={{ stroke: 'var(--color-border-strong)' }}
                />
                {comparing ? <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 6 }} /> : null}

                <Area
                  type="monotone"
                  dataKey={comparing ? 'indexed' : 'close'}
                  name={comparing ? 'Ce support' : 'Cours'}
                  stroke={positive ? 'var(--color-positive)' : 'var(--color-negative)'}
                  strokeWidth={2}
                  fill={`url(#priceFill-${symbol})`}
                />

                {comparing ? (
                  <Line
                    type="monotone"
                    dataKey="reference"
                    name={benchmarkName}
                    stroke="var(--color-brand-500)"
                    strokeWidth={1.6}
                    strokeDasharray="4 3"
                    dot={false}
                  />
                ) : null}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {comparing ? (
            <p className="mt-2 text-[11px] text-fg-subtle">
              Les deux séries sont ramenées en base 100 au début de la période : la comparaison porte sur les
              trajectoires, pas sur les niveaux de cours.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
