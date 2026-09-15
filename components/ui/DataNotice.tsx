import { FlaskConical, Radio, ShieldAlert } from 'lucide-react';
import type { DataOrigin } from '@/types';
import { cn } from '@/lib/utils/cn';

/** Pastille d'origine de la donnée. Règle produit : une donnée simulée n'est
 *  jamais présentée comme une donnée réelle. */
export function OriginBadge({
  origin,
  provider,
  className,
}: {
  origin: DataOrigin;
  provider?: string;
  className?: string;
}) {
  const config = {
    live: {
      icon: Radio,
      label: provider ? `Données réelles · ${provider}` : 'Données réelles',
      tone: 'bg-positive-soft text-positive',
    },
    mock: {
      icon: FlaskConical,
      label: 'Données de marché simulées (DEMO)',
      tone: 'bg-warning-soft text-warning',
    },
    fixture: {
      icon: ShieldAlert,
      label: 'Données client fictives (DEMO)',
      tone: 'bg-info-soft text-info',
    },
  }[origin];

  const Icon = config.icon;

  return (
    <span
      title={config.label}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
        config.tone,
        className,
      )}
    >
      <Icon className="size-2.5" aria-hidden />
      {config.label}
    </span>
  );
}

/** Bandeau pédagogique : analyse non réglementée, simulation, etc. */
export function DisclaimerNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'rounded-xl border border-border bg-surface-2 px-3 py-2 text-[11px] leading-relaxed text-fg-muted',
        className,
      )}
    >
      {children}
    </p>
  );
}
