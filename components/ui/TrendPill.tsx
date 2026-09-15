import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatSignedPercent } from '@/lib/utils/format';

export function TrendPill({
  value,
  digits = 1,
  size = 'sm',
  suffix,
  className,
}: {
  value: number;
  digits?: number;
  size?: 'xs' | 'sm';
  suffix?: string;
  className?: string;
}) {
  const flat = Math.abs(value) < 0.05;
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium tabular',
        size === 'xs' ? 'text-[10px]' : 'text-xs',
        flat
          ? 'bg-surface-2 text-fg-muted'
          : value > 0
            ? 'bg-positive-soft text-positive'
            : 'bg-negative-soft text-negative',
        className,
      )}
    >
      <Icon className={size === 'xs' ? 'size-2.5' : 'size-3'} aria-hidden />
      {formatSignedPercent(value, digits)}
      {suffix ? <span className="ml-0.5 font-normal opacity-80">{suffix}</span> : null}
    </span>
  );
}
