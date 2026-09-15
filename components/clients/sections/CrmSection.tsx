'use client';

import { useActionState, useState, useTransition } from 'react';
import { CheckCircle2, Circle, Mail, FileText, NotebookPen, Phone, Plus, Users } from 'lucide-react';
import type { Interaction } from '@/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from '@/components/ui';
import { INTERACTION_KIND_LABELS } from '@/lib/utils/labels';
import { formatDate, formatDateTime } from '@/lib/utils/format';
import {
  EMPTY_ACTION_STATE,
  addInteractionAction,
  completeInteractionAction,
} from '@/app/(app)/actions';

const ICONS = {
  appel: Phone,
  email: Mail,
  rendez_vous: Users,
  note: NotebookPen,
  tache: Circle,
  document: FileText,
} as const;

export function CrmSection({
  clientId,
  interactions,
}: {
  clientId: string;
  interactions: Interaction[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addInteractionAction, EMPTY_ACTION_STATE);
  const [isPending, startTransition] = useTransition();

  if (state.success && open) setOpen(false);

  const tasks = interactions.filter((item) => item.kind === 'tache' && item.status !== 'termine');
  const timeline = interactions.filter((item) => item.kind !== 'tache' || item.status === 'termine');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-fg">Suivi de la relation</h2>
          <p className="mt-0.5 text-xs text-fg-muted">
            {interactions.length} interaction{interactions.length > 1 ? 's' : ''} enregistrée
            {interactions.length > 1 ? 's' : ''}.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="size-4" aria-hidden />
          Ajouter
        </Button>
      </div>

      {tasks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Tâches en cours</CardTitle>
            <Badge tone="warning">{tasks.length}</Badge>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-start gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(() => {
                        void completeInteractionAction(task.id, clientId);
                      })
                    }
                    aria-label={`Marquer « ${task.title} » comme terminée`}
                    className="mt-0.5 text-fg-subtle transition-colors hover:text-positive disabled:opacity-50"
                  >
                    <Circle className="size-4" aria-hidden />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-fg">{task.title}</p>
                    {task.body ? <p className="mt-0.5 text-[11px] text-fg-muted">{task.body}</p> : null}
                  </div>
                  {task.dueAt ? (
                    <span className="shrink-0 text-[11px] text-fg-subtle">
                      échéance {formatDate(task.dueAt)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <EmptyState title="Aucune interaction" description="Enregistrez un appel, un e-mail ou une note." />
          ) : (
            <ol className="relative space-y-4 border-l border-border pl-5">
              {timeline.map((item) => {
                const Icon = ICONS[item.kind];
                return (
                  <li key={item.id} className="relative">
                    <span className="absolute top-0.5 -left-[27px] flex size-5 items-center justify-center rounded-full border border-border bg-surface text-fg-subtle">
                      <Icon className="size-2.5" aria-hidden />
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-medium text-fg">{item.title}</p>
                      <Badge tone="neutral">{INTERACTION_KIND_LABELS[item.kind]}</Badge>
                      {item.status === 'termine' ? (
                        <CheckCircle2 className="size-3 text-positive" aria-hidden />
                      ) : null}
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

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle interaction">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />

          <Field label="Type" required>
            {(id) => (
              <Select id={id} name="kind" defaultValue="note">
                {Object.entries(INTERACTION_KIND_LABELS)
                  .filter(([value]) => value !== 'document')
                  .map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
              </Select>
            )}
          </Field>

          <Field label="Titre" required>
            {(id) => <Input id={id} name="title" required placeholder="Appel de suivi, note de rendez-vous…" />}
          </Field>

          <Field label="Détail">
            {(id) => <Textarea id={id} name="body" placeholder="Contenu de l’échange, points abordés…" />}
          </Field>

          <Field label="Échéance" hint="À renseigner pour une tâche.">
            {(id) => <Input id={id} name="dueAt" type="date" />}
          </Field>

          {state.error ? <p className="text-xs text-negative">{state.error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={pending}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
