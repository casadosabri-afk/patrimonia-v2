import { cn } from '@/lib/utils/cn';

export function Avatar({
  label,
  color = '#4152ab',
  size = 'md',
  className,
}: {
  label: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    xs: 'size-6 text-[10px]',
    sm: 'size-8 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-14 text-lg',
  } as const;

  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        sizes[size],
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}
