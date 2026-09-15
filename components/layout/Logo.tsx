import { cn } from '@/lib/utils/cn';

/** Marque PATRIMONIA : losange en dégradé jade + nuit, propre au produit. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-8', className)}>
      <defs>
        <linearGradient id="patrimonia-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-accent-400)" />
          <stop offset="100%" stopColor="var(--color-brand-500)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#patrimonia-mark)" />
      <path
        d="M9 21.5 14 13l4 5.2L23 10"
        fill="none"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <circle cx="23" cy="10" r="2.1" fill="white" />
    </svg>
  );
}

export function Logo({
  className,
  showTagline = false,
  firmName,
}: {
  className?: string;
  showTagline?: boolean;
  firmName?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <div className="min-w-0">
        <p className="truncate text-[15px] leading-tight font-semibold tracking-tight text-fg">
          PATRIMONIA
        </p>
        {showTagline ? (
          <p className="truncate text-[11px] leading-tight text-fg-subtle">
            {firmName ?? 'La vision intelligente du patrimoine'}
          </p>
        ) : null}
      </div>
    </div>
  );
}
