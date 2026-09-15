'use client';

import { cn } from '@/lib/utils/cn';

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('-mx-1 overflow-x-auto pat-scroll', className)}>
      <div role="tablist" className="flex min-w-max gap-1 px-1">
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChange(item.value)}
              className={cn(
                'relative rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                active ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
              )}
            >
              {item.label}
              {typeof item.count === 'number' ? (
                <span
                  className={cn(
                    'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                    active ? 'bg-accent-50 text-accent-700' : 'bg-surface-2 text-fg-subtle',
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0 rounded-xl border border-border bg-surface-2 p-0.5',
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={option.value === value}
          className={cn(
            'rounded-[10px] font-medium transition-all',
            size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
            option.value === value
              ? 'bg-surface text-fg shadow-sm'
              : 'text-fg-muted hover:text-fg',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
