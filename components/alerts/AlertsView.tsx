'use client';

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Bell, Check, ListPlus, MessageSquarePlus, UserPlus, X } from 'lucide-react';
import type { Alert, AlertCategory, AlertStatus, Client, UserAccount } from '@/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Modal,
  SegmentedControl,
  Select,
  Tabs,
  Textarea,
  type BadgeTone,
} from '@/components/ui';
import { ALERT_CATEGORY_LABELS, ALERT_SEVERITY_LABELS, ALERT_STATUS_LABELS } from '@/lib/utils/labels';
import { formatRelative, fullName } from '@/lib/utils/format';
import {
  EMPTY_ACTION_STATE,
  assignAlertAction,
  commentAlertAction,
  createTaskFromAlertAction,
  updateAlertStatusAction,
} from '@/app/(app)/actions';

const CATEGORY_TONE: Record<AlertCategory, BadgeTone> = {
  risque: 'negative',
  opportunite: 'positive',
  marche: 'info',
  client: 'brand',
  administratif: 'warning',
};

const SEVERITY_ORDER = { critique: 0, eleve: 1, moyen: 2, faible: 3 } as const;

export function AlertsView({
  alerts,
  clients,
  advisors,
}: {
  alerts: Alert[];
  clients: Client[];
  advisors: UserAccount[];
}) {
  const [category, setCategory] = useState<string>('tous');
  const [status, setStatus] = useState<AlertStatus | 'tous'>('ouverte');
  const [commentTarget, setCommentTarget] = useState<Alert | null>(null);
  const [state, formAction, pending] = useActionState(commentAlertAction, EMPTY_ACTION_STATE);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) setCommentTarget(null);
  }, [state.success]);

  const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
  const advisorsById = useMemo(() => new Map(advisors.map((item) => [item.id, item])), [advisors]);

  const visible = useMemo(
    () =>
      alerts
        .filter((alert) => (category === 'tous' ? true : alert.category === category))
        .filter((alert) => (status === 'tous' ? true : alert.status === status))
        .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]),
    [alerts, category, status],
  );

  const countByCategory = (key: AlertCategory) =>
    alerts.filter((alert) => alert.category === key && (status === 'tous' || alert.status === status)).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">Alertes</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {alerts.filter((alert) => alert.status === 'ouverte').length} alerte(s) ouverte(s) sur{' '}
          {alerts.length} au total.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          items={[
            { value: 'tous', label: 'Toutes', count: alerts.length },
            ...(Object.keys(ALERT_CATEGORY_LABELS) as AlertCategory[]).map((key) => ({
              value: key,
              label: ALERT_CATEGORY_LABELS[key],
              count: countByCategory(key),
            })),
          ]}
          value={category}
          onChange={setCategory}
          className="rounded-xl bg-surface-2 p-1"
        />
        <SegmentedControl
          options={[
            { value: 'ouverte', label: 'Ouvertes' },
            { value: 'en_cours', label: 'En cours' },
            { value: 'traitee', label: 'Traitées' },
            { value: 'tous', label: 'Toutes' },
          ]}
          value={status}
          onChange={(value) => setStatus(value as AlertStatus | 'tous')}
        />
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={Bell}
            title="Aucune alerte dans cette vue"
            description="Changez de catégorie ou de statut pour afficher d’autres alertes."
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((alert) => {
            const client = alert.clientId ? clientsById.get(alert.clientId) : undefined;
            const assignee = alert.assigneeId ? advisorsById.get(alert.assigneeId) : undefined;
            const resolved = alert.status === 'traitee' || alert.status === 'ignoree';

            return (
              <li key={alert.id}>
                <Card className={resolved ? 'opacity-70' : undefined}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={CATEGORY_TONE[alert.category]}>
                        {ALERT_CATEGORY_LABELS[alert.category]}
                      </Badge>
                      <span className="text-[10px] font-medium tracking-wide text-fg-subtle uppercase">
                        {ALERT_SEVERITY_LABELS[alert.severity]}
                      </span>
                      <Badge tone={resolved ? 'neutral' : alert.status === 'en_cours' ? 'warning' : 'info'}>
                        {ALERT_STATUS_LABELS[alert.status]}
                      </Badge>
                      <span className="ml-auto text-[11px] text-fg-subtle">
                        {formatRelative(alert.createdAt)}
                      </span>
                    </div>

                    {client ? (
                      <Link
                        href={`/clients/${client.id}`}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-accent-700 hover:underline"
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: client.avatarColor }}
                          aria-hidden
                        />
                        {fullName(client)}
                      </Link>
                    ) : (
                      <p className="mt-2 text-xs font-medium text-fg-subtle">Alerte de cabinet</p>
                    )}

                    <h2 className="mt-1.5 text-sm font-semibold text-fg">{alert.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-fg-muted">{alert.description}</p>
                    <p className="mt-2 text-xs font-medium text-accent-700">→ {alert.suggestedAction}</p>

                    {alert.comments.length > 0 ? (
                      <ul className="mt-3 space-y-1.5 border-l-2 border-border pl-3">
                        {alert.comments.map((comment) => (
                          <li key={comment.id}>
                            <p className="text-[11px] text-fg-muted">{comment.body}</p>
                            <p className="text-[10px] text-fg-subtle">
                              {comment.authorLabel} · {formatRelative(comment.createdAt)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      <Select
                        value={alert.assigneeId ?? ''}
                        onChange={(event) =>
                          startTransition(() => {
                            void assignAlertAction(alert.id, event.target.value);
                          })
                        }
                        aria-label="Attribuer l’alerte"
                        className="h-8 w-auto text-xs"
                      >
                        <option value="">Non attribuée</option>
                        {advisors.map((advisor) => (
                          <option key={advisor.id} value={advisor.id}>
                            {fullName(advisor)}
                          </option>
                        ))}
                      </Select>

                      {assignee ? (
                        <span className="flex items-center gap-1 text-[11px] text-fg-subtle">
                          <UserPlus className="size-3" aria-hidden />
                          {fullName(assignee)}
                        </span>
                      ) : null}

                      <div className="ml-auto flex flex-wrap items-center gap-1.5">
                        <Button size="sm" variant="ghost" onClick={() => setCommentTarget(alert)}>
                          <MessageSquarePlus className="size-3.5" aria-hidden />
                          Commenter
                        </Button>

                        {client ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() =>
                              startTransition(() => {
                                void createTaskFromAlertAction(alert.id, client.id, alert.suggestedAction);
                              })
                            }
                          >
                            <ListPlus className="size-3.5" aria-hidden />
                            Créer une tâche
                          </Button>
                        ) : null}

                        {resolved ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() =>
                              startTransition(() => {
                                void updateAlertStatusAction(alert.id, 'ouverte');
                              })
                            }
                          >
                            Rouvrir
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isPending}
                              onClick={() =>
                                startTransition(() => {
                                  void updateAlertStatusAction(alert.id, 'ignoree');
                                })
                              }
                            >
                              <X className="size-3.5" aria-hidden />
                              Ignorer
                            </Button>
                            <Button
                              size="sm"
                              disabled={isPending}
                              onClick={() =>
                                startTransition(() => {
                                  void updateAlertStatusAction(alert.id, 'traitee');
                                })
                              }
                            >
                              <Check className="size-3.5" aria-hidden />
                              Marquer traitée
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={commentTarget !== null}
        onClose={() => setCommentTarget(null)}
        title="Commenter l’alerte"
        description={commentTarget?.title}
      >
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="alertId" value={commentTarget?.id ?? ''} />
          <label>
            <span className="sr-only">Commentaire</span>
            <Textarea name="body" required placeholder="Décidé de…, à revoir lors du prochain rendez-vous…" />
          </label>
          {state.error ? <p className="text-xs text-negative">{state.error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCommentTarget(null)}>
              Annuler
            </Button>
            <Button type="submit" loading={pending}>
              Ajouter
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
