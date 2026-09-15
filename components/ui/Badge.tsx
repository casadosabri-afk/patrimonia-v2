import { cn } from '@/lib/utils/cn';

export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'accent'
  | 'positive'
  | 'negative'
  | 'warning'
  | 'info';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-fg-muted border-border',
  brand: 'bg-brand-50 text-brand-600 border-brand-100 dark:text-brand-700',
  accent: 'bg-accent-50 text-accent-700 border-accent-100',
  positive: 'bg-positive-soft text-positive border-transparent',
  negative: 'bg-negative-soft text-negative border-transparent',
  warning: 'bg-warning-soft text-warning border-transparent',
  info: 'bg-info-soft text-info border-transparent',
};

export function Badge({
  tone = 'neutral',
  className,
  dot = false,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; dot?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {props.children}
    </span>
  );
}
