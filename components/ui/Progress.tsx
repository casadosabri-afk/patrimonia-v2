import { cn } from '@/lib/utils/cn';

export function Progress({
  value,
  tone = 'accent',
  className,
  label,
}: {
  value: number;
  tone?: 'accent' | 'positive' | 'warning' | 'negative' | 'brand';
  className?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const tones = {
    accent: 'bg-accent-500',
    positive: 'bg-positive',
    warning: 'bg-warning',
    negative: 'bg-negative',
    brand: 'bg-brand-500',
  } as const;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-bg-subtle', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', tones[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
