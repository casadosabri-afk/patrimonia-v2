'use client';

import { useMemo, useState } from 'react';
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
import { Info, RotateCcw } from 'lucide-react';
import type { SimulationInput } from '@/types';
import { runSimulation } from '@/lib/patrimony/goals';
import { Button, Card, CardContent, CardHeader, CardTitle, Field, Input, DisclaimerNote, Badge } from '@/components/ui';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { AXIS_STYLE, GRID_COLOR } from '@/components/charts/palette';
import { formatEuro, formatEuroCompact, formatPercent } from '@/lib/utils/format';

const DEFAULTS: SimulationInput = {
  initialCapital: 50000,
  monthlyContribution: 500,
  annualReturnPct: 4.5,
  years: 20,
  annualInflationPct: 2,
  targetAmount: 250000,
};

export function SimulatorView({
  presets,
}: {
  presets: { id: string; label: string; input: SimulationInput }[];
}) {
  const [input, setInput] = useState<SimulationInput>(DEFAULTS);

  const result = useMemo(() => runSimulation(input), [input]);

  const update = (patch: Partial<SimulationInput>) => setInput((current) => ({ ...current, ...patch }));

  const slider = (
    label: string,
    key: keyof SimulationInput,
    min: number,
    max: number,
    step: number,
    format: (value: number) => string,
  ) => (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={`sim-${key}`} className="text-xs font-medium text-fg-muted">
          {label}
        </label>
        <span className="text-sm font-semibold text-fg tabular">
          {format((input[key] as number) ?? 0)}
        </span>
      </div>
      <input
        id={`sim-${key}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={(input[key] as number) ?? 0}
        onChange={(event) => update({ [key]: Number(event.target.value) } as Partial<SimulationInput>)}
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-bg-subtle accent-accent-500"
      />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Hypothèses</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setInput(DEFAULTS)}>
              <RotateCcw className="size-3.5" aria-hidden />
              Réinitialiser
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            {slider('Capital initial', 'initialCapital', 0, 1_000_000, 1000, (value) => formatEuro(value))}
            {slider('Épargne mensuelle', 'monthlyContribution', 0, 5000, 50, (value) => formatEuro(value))}
            {slider('Rendement annuel', 'annualReturnPct', 0, 12, 0.1, (value) => formatPercent(value, 1))}
            {slider('Durée', 'years', 1, 40, 1, (value) => `${value} ans`)}
            {slider('Inflation annuelle', 'annualInflationPct', 0, 6, 0.1, (value) => formatPercent(value, 1))}

            <Field label="Objectif de capital (optionnel)">
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  step={5000}
                  value={input.targetAmount ?? ''}
                  onChange={(event) =>
                    update({ targetAmount: event.target.value === '' ? null : Number(event.target.value) })
                  }
                  placeholder="Aucun objectif"
                />
              )}
            </Field>

            {presets.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium text-fg-muted">Partir d’un objectif client</p>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setInput(preset.input)}
                      className="rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Scénario pessimiste', value: result.finalPessimistic, tone: 'text-negative' },
              { label: 'Scénario central', value: result.finalCentral, tone: 'text-fg' },
              { label: 'Scénario optimiste', value: result.finalOptimistic, tone: 'text-positive' },
            ].map((scenario) => (
              <Card key={scenario.label} className="p-4">
                <p className="text-[11px] text-fg-muted">{scenario.label}</p>
                <p className={`mt-1 text-lg font-semibold tabular sm:text-xl ${scenario.tone}`}>
                  {formatEuroCompact(scenario.value)}
                </p>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Projection du capital</CardTitle>
                <p className="mt-0.5 text-xs text-fg-muted">
                  Versements cumulés : {formatEuro(result.totalContributed)} · intérêts capitalisés :{' '}
                  {formatEuro(result.totalInterest)}
                </p>
              </div>
              {result.targetReached !== null ? (
                <Badge tone={result.targetReached ? 'positive' : 'warning'}>
                  {result.targetReached ? 'Objectif atteint' : 'Objectif non atteint'}
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.points} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="simRange" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-accent-500)" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="var(--color-accent-500)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="year"
                      tick={AXIS_STYLE}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: number) => `${value} an${value > 1 ? 's' : ''}`}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={AXIS_STYLE}
                      tickLine={false}
                      axisLine={false}
                      width={58}
                      tickFormatter={(value: number) => formatEuroCompact(value)}
                    />
                    <Tooltip
                      content={<ChartTooltip labelRenderer={(value) => `Année ${value}`} />}
                      cursor={{ stroke: 'var(--color-border-strong)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Area
                      type="monotone"
                      dataKey="optimistic"
                      name="Optimiste"
                      stroke="var(--color-positive)"
                      strokeWidth={1.5}
                      fillOpacity={0}
                      strokeDasharray="4 3"
                    />
                    <Area
                      type="monotone"
                      dataKey="central"
                      name="Central"
                      stroke="var(--color-accent-500)"
                      strokeWidth={2.4}
                      fill="url(#simRange)"
                    />
                    <Area
                      type="monotone"
                      dataKey="pessimistic"
                      name="Pessimiste"
                      stroke="var(--color-negative)"
                      strokeWidth={1.5}
                      fillOpacity={0}
                      strokeDasharray="4 3"
                    />
                    <Line
                      type="monotone"
                      dataKey="contributed"
                      name="Versements cumulés"
                      stroke="var(--color-fg-subtle)"
                      strokeWidth={1.2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-xs text-fg-muted">
                En euros constants, c’est-à-dire corrigés d’une inflation de{' '}
                {formatPercent(input.annualInflationPct, 1)}, le scénario central représente{' '}
                <span className="font-medium text-fg">{formatEuro(result.finalCentralReal)}</span> de pouvoir
                d’achat d’aujourd’hui.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="size-4 text-info" aria-hidden />
            Hypothèses retenues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5">
            {result.assumptions.map((assumption) => (
              <li key={assumption} className="flex items-start gap-2 text-xs text-fg-muted">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-fg-subtle" aria-hidden />
                {assumption}
              </li>
            ))}
          </ul>
          <DisclaimerNote className="mt-4">
            Simulation pédagogique. Elle illustre un mécanisme de capitalisation et ne constitue ni une
            prévision, ni une promesse de rendement, ni un conseil en investissement.
          </DisclaimerNote>
        </CardContent>
      </Card>
    </div>
  );
}
