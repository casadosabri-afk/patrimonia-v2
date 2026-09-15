import { cn } from '@/lib/utils/cn';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-linear-to-r from-surface-2 via-bg-subtle to-surface-2 bg-size-[200%_100%]',
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-36" />
      <Skeleton className="mt-4 h-2 w-full" />
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}
