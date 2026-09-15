import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { TrendPill } from './TrendPill';

export function MetricCard({
  label,
  value,
  sublabel,
  changePct,
  icon: Icon,
  tone = 'default',
  className,
  children,
}: {
  label: string;
  value: string;
  sublabel?: string;
  changePct?: number;
  icon?: LucideIcon;
  tone?: 'default' | 'accent' | 'brand';
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface p-4 shadow-card transition-shadow hover:shadow-pop sm:p-5',
        tone === 'accent' && 'bg-linear-to-br from-accent-50 to-surface',
        tone === 'brand' && 'bg-linear-to-br from-brand-50 to-surface',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-fg-muted">{label}</p>
        {Icon ? (
          <span className="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-fg-subtle">
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-fg tabular">{value}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {typeof changePct === 'number' ? <TrendPill value={changePct} /> : null}
        {sublabel ? <span className="text-xs text-fg-subtle">{sublabel}</span> : null}
      </div>
      {children}
    </div>
  );
}
