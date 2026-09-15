'use client';

import type { TooltipContentProps } from 'recharts';
import { formatEuro } from '@/lib/utils/format';

/** Les props Recharts sont injectées à l'exécution : elles sont donc optionnelles. */
export type ChartTooltipProps = Partial<TooltipContentProps<number, string>> & {
  valueFormatter?: (value: number) => string;
  labelRenderer?: (label: string) => string;
};

/** Infobulle commune : fond opaque, valeurs formatées. */
export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = (value: number) => formatEuro(value),
  labelRenderer,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const heading = label === undefined || label === null ? null : String(label);

  return (
    <div className="rounded-xl border border-border bg-elevated px-3 py-2 shadow-pop">
      {heading ? (
        <p className="mb-1 text-[11px] font-medium text-fg-subtle">
          {labelRenderer ? labelRenderer(heading) : heading}
        </p>
      ) : null}
      <ul className="space-y-0.5">
        {payload.map((entry, index) => (
          <li key={`${String(entry.name)}-${index}`} className="flex items-center gap-2 text-xs">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color ?? 'var(--color-accent-500)' }}
              aria-hidden
            />
            <span className="text-fg-muted">{String(entry.name ?? '')}</span>
            <span className="ml-auto font-medium text-fg tabular">
              {typeof entry.value === 'number' ? valueFormatter(entry.value) : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
