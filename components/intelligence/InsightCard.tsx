import Link from 'next/link';
import { ArrowRight, Lightbulb, ShieldAlert, Info, ListChecks } from 'lucide-react';
import type { Client, Insight } from '@/types';
import { Badge, type BadgeTone } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils/cn';
import { fullName, initials } from '@/lib/utils/format';

const KIND_CONFIG: Record<
  Insight['kind'],
  { icon: typeof ShieldAlert; label: string; tone: BadgeTone; accent: string }
> = {
  risque: { icon: ShieldAlert, label: 'Risque', tone: 'negative', accent: 'bg-negative' },
  opportunite: { icon: Lightbulb, label: 'Opportunité', tone: 'positive', accent: 'bg-positive' },
  information: { icon: Info, label: 'Information', tone: 'info', accent: 'bg-info' },
  action: { icon: ListChecks, label: 'Action', tone: 'warning', accent: 'bg-warning' },
};

const SEVERITY_LABEL: Record<Insight['severity'], string> = {
  critique: 'Critique',
  eleve: 'Élevé',
  moyen: 'Moyen',
  faible: 'Faible',
};

export function InsightCard({
  insight,
  client,
  compact = false,
  className,
}: {
  insight: Insight;
  client?: Client;
  compact?: boolean;
  className?: string;
}) {
  const config = KIND_CONFIG[insight.kind];
  const Icon = config.icon;

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-card border border-border bg-surface p-4 transition-shadow hover:shadow-card',
        className,
      )}
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', config.accent)} aria-hidden />

      <div className="flex flex-wrap items-center gap-2 pl-2">
        <Badge tone={config.tone}>
          <Icon className="size-3" aria-hidden />
          {config.label}
        </Badge>
        <span className="text-[10px] font-medium tracking-wide text-fg-subtle uppercase">
          {SEVERITY_LABEL[insight.severity]}
        </span>
        {client ? (
          <Link
            href={`/clients/${client.id}`}
            className="ml-auto flex items-center gap-1.5 text-xs font-medium text-fg-muted hover:text-fg"
          >
            <Avatar
              label={initials(client.firstName, client.lastName)}
              color={client.avatarColor}
              size="xs"
            />
            {fullName(client)}
          </Link>
        ) : null}
      </div>

      <h3 className="mt-2.5 pl-2 text-sm font-semibold text-fg">{insight.title}</h3>
      <p className="mt-1 pl-2 text-xs leading-relaxed text-fg-muted">{insight.finding}</p>

      {!compact ? (
        <>
          <p className="mt-2 pl-2 text-xs leading-relaxed text-fg-subtle">{insight.explanation}</p>
          {insight.evidence.length > 0 ? (
            <dl className="mt-3 ml-2 grid grid-cols-1 gap-x-4 gap-y-1.5 rounded-xl bg-surface-2 p-3 sm:grid-cols-2">
              {insight.evidence.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <dt className="truncate text-[11px] text-fg-subtle">{item.label}</dt>
                  <dd className="shrink-0 text-[11px] font-medium text-fg tabular">{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </>
      ) : null}

      <p className="mt-3 flex items-start gap-1.5 pl-2 text-xs font-medium text-accent-700">
        <ArrowRight className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {insight.suggestedAction}
      </p>
    </article>
  );
}
