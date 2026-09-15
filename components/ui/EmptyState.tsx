import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div className="flex size-11 items-center justify-center rounded-2xl bg-surface-2 text-fg-subtle">
        <Icon className="size-5" aria-hidden />
      </div>
      <p className="mt-3 text-sm font-medium text-fg">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs text-fg-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
