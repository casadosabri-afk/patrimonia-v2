'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Clock, Mail, NotebookPen, Phone, Users } from 'lucide-react';
import type { Client, Interaction, UserAccount } from '@/types';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  SegmentedControl,
  Select,
} from '@/components/ui';
import { INTERACTION_KIND_LABELS } from '@/lib/utils/labels';
import { formatDate, formatDateTime, formatRelative, fullName } from '@/lib/utils/format';
import { completeInteractionAction } from '@/app/(app)/actions';
import { cn } from '@/lib/utils/cn';

const ICONS = {
  appel: Phone,
  email: Mail,
  rendez_vous: Users,
  note: NotebookPen,
  tache: Circle,
  document: NotebookPen,
} as const;

export function CrmBoard({
  interactions,
  clients,
  advisors,
}: {
  interactions: Interaction[];
  clients: Client[];
  advisors: UserAccount[];
}) {
  const [view, setView] = useState<'taches' | 'timeline'>('taches');
  const [search, setSearch] = useState('');
  const [advisor, setAdvisor] = useState('tous');
  const [isPending, startTransition] = useTransition();

  const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return interactions.filter((item) => {
      if (advisor !== 'tous' && item.advisorId !== advisor) return false;
      if (!needle) return true;
      const client = clientsById.get(item.clientId);
      return `${item.title} ${item.body} ${client ? fullName(client) : ''}`.toLowerCase().includes(needle);
    });
  }, [interactions, search, advisor, clientsById]);

  const now = Date.now();
  const tasks = filtered
    .filter((item) => item.kind === 'tache' && item.status !== 'termine')
    .sort((a, b) => new Date(a.dueAt ?? a.occurredAt).getTime() - new Date(b.dueAt ?? b.occurredAt).getTime());

  const overdue = tasks.filter((task) => task.dueAt && new Date(task.dueAt).getTime() < now);
  const upcoming = tasks.filter((task) => !task.dueAt || new Date(task.dueAt).getTime() >= now);

  const renderTask = (task: Interaction, late: boolean) => {
    const client = clientsById.get(task.clientId);
    return (
      <li key={task.id} className="flex items-start gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              void completeInteractionAction(task.id, task.clientId);
            })
          }
          aria-label={`Marquer « ${task.title} » comme terminée`}
          className="mt-0.5 text-fg-subtle transition-colors hover:text-positive disabled:opacity-50"
        >
          <Circle className="size-4" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-fg">{task.title}</p>
          {client ? (
            <Link
              href={`/clients/${client.id}?section=crm`}
              className="text-[11px] text-accent-700 hover:underline"
            >
              {fullName(client)}
            </Link>
          ) : null}
          {task.body ? <p className="mt-0.5 text-[11px] text-fg-muted">{task.body}</p> : null}
        </div>
        {task.dueAt ? (
          <span
            className={cn(
              'flex shrink-0 items-center gap-1 text-[11px]',
              late ? 'text-negative' : 'text-fg-subtle',
            )}
          >
            <Clock className="size-3" aria-hidden />
            {formatDate(task.dueAt)}
          </span>
        ) : null}
      </li>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher une interaction, un client…"
            className="sm:col-span-2"
          />
          <Select value={advisor} onChange={(event) => setAdvisor(event.target.value)} aria-label="Conseiller">
            <option value="tous">Tous les conseillers</option>
            {advisors.map((item) => (
              <option key={item.id} value={item.id}>
                {fullName(item)}
              </option>
            ))}
          </Select>
        </div>
        <SegmentedControl
          className="mt-3"
          options={[
            { value: 'taches', label: `Tâches (${tasks.length})` },
            { value: 'timeline', label: `Historique (${filtered.length})` },
          ]}
          value={view}
          onChange={(value) => setView(value as 'taches' | 'timeline')}
        />
      </Card>

      {view === 'taches' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>En retard</CardTitle>
              <Badge tone={overdue.length > 0 ? 'negative' : 'neutral'}>{overdue.length}</Badge>
            </CardHeader>
            <CardContent>
              {overdue.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="Aucune tâche en retard" />
              ) : (
                <ul className="space-y-2">{overdue.map((task) => renderTask(task, true))}</ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>À venir</CardTitle>
              <Badge tone="accent">{upcoming.length}</Badge>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <EmptyState title="Aucune tâche planifiée" />
              ) : (
                <ul className="space-y-2">{upcoming.map((task) => renderTask(task, false))}</ul>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Historique des interactions</CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <EmptyState title="Aucune interaction" description="Ajustez la recherche ou le filtre." />
            ) : (
              <ol className="relative space-y-4 border-l border-border pl-5">
                {filtered.slice(0, 60).map((item) => {
                  const Icon = ICONS[item.kind];
                  const client = clientsById.get(item.clientId);
                  return (
                    <li key={item.id} className="relative">
                      <span className="absolute top-0.5 -left-[27px] flex size-5 items-center justify-center rounded-full border border-border bg-surface text-fg-subtle">
                        <Icon className="size-2.5" aria-hidden />
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-medium text-fg">{item.title}</p>
                        <Badge tone="neutral">{INTERACTION_KIND_LABELS[item.kind]}</Badge>
                        {client ? (
                          <Link
                            href={`/clients/${client.id}?section=crm`}
                            className="text-[11px] text-accent-700 hover:underline"
                          >
                            {fullName(client)}
                          </Link>
                        ) : null}
                        <span className="ml-auto text-[11px] text-fg-subtle">
                          {formatRelative(item.occurredAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-fg-subtle">{formatDateTime(item.occurredAt)}</p>
                      {item.body ? (
                        <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">{item.body}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
