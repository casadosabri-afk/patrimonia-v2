'use client';

import { useActionState, useMemo, useState, useTransition } from 'react';
import { Pencil, Plus, Target, Trash2 } from 'lucide-react';
import type { Goal, GoalProjection } from '@/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DisclaimerNote,
  EmptyState,
  Field,
  Input,
  Modal,
  Progress,
  Select,
  Textarea,
} from '@/components/ui';
import { GOAL_KIND_LABELS } from '@/lib/utils/labels';
import { formatDate, formatEuro, formatNumber, formatPercent } from '@/lib/utils/format';
import { CENTRAL_RETURN_PCT } from '@/lib/patrimony/goals';
import {
  EMPTY_ACTION_STATE,
  createGoalAction,
  deleteGoalAction,
  updateGoalAction,
  type ActionState,
} from '@/app/(app)/actions';

const PRIORITY_LABELS = { haute: 'Haute', moyenne: 'Moyenne', basse: 'Basse' } as const;

function GoalForm({
  clientId,
  goal,
  action,
  submitLabel,
  onCancel,
}: {
  clientId: string;
  goal?: Goal;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_ACTION_STATE);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="clientId" value={clientId} />

      <Field label="Intitulé" required>
        {(id) => (
          <Input
            id={id}
            name="label"
            required
            defaultValue={goal?.label}
            placeholder="Compléter mes revenus à la retraite"
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type de projet" required>
          {(id) => (
            <Select id={id} name="kind" defaultValue={goal?.kind ?? 'retraite'}>
              {Object.entries(GOAL_KIND_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Priorité" required>
          {(id) => (
            <Select id={id} name="priority" defaultValue={goal?.priority ?? 'moyenne'}>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Montant cible (€)" required>
          {(id) => (
            <Input
              id={id}
              name="targetAmount"
              type="number"
              min={1}
              step={1000}
              required
              defaultValue={goal?.targetAmount ?? 100000}
            />
          )}
        </Field>

        <Field label="Capital déjà constitué (€)" required>
          {(id) => (
            <Input
              id={id}
              name="currentAmount"
              type="number"
              min={0}
              step={1000}
              required
              defaultValue={goal?.currentAmount ?? 0}
            />
          )}
        </Field>

        <Field label="Versement mensuel (€)" required>
          {(id) => (
            <Input
              id={id}
              name="monthlyContribution"
              type="number"
              min={0}
              step={50}
              required
              defaultValue={goal?.monthlyContribution ?? 0}
            />
          )}
        </Field>

        <Field label="Date cible" required>
          {(id) => (
            <Input id={id} name="targetDate" type="date" required defaultValue={goal?.targetDate} />
          )}
        </Field>
      </div>

      <Field label="Notes">
        {(id) => (
          <Textarea
            id={id}
            name="notes"
            defaultValue={goal?.notes ?? ''}
            placeholder="Contexte du projet, contraintes, échéances intermédiaires…"
          />
        )}
      </Field>

      {state.error ? <p className="text-xs text-negative">{state.error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function GoalsSection({
  clientId,
  goals,
  canManage = true,
}: {
  clientId: string;
  goals: GoalProjection[];
  canManage?: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateAction = useMemo(
    () => (editing ? updateGoalAction.bind(null, editing.id) : null),
    [editing],
  );

  const onTrack = goals.filter((item) => item.onTrack).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-fg">Objectifs</h2>
          <p className="mt-0.5 text-xs text-fg-muted">
            {goals.length} projet{goals.length > 1 ? 's' : ''} suivi{goals.length > 1 ? 's' : ''}, dont{' '}
            {onTrack} sur trajectoire.
          </p>
        </div>
        {canManage ? (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Ajouter un objectif
          </Button>
        ) : null}
      </div>

      {goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={Target}
            title="Aucun objectif défini"
            description="Sans objectif, le patrimoine ne peut pas être évalué au regard d’un projet."
            action={
              canManage ? (
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="size-4" aria-hidden />
                  Définir un objectif
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs text-fg-muted">Objectifs suivis</p>
              <p className="mt-1 text-xl font-semibold text-fg tabular">{goals.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-fg-muted">Sur trajectoire</p>
              <p className="mt-1 text-xl font-semibold text-positive tabular">{onTrack}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-fg-muted">Capital cumulé visé</p>
              <p className="mt-1 text-xl font-semibold text-fg tabular">
                {formatEuro(goals.reduce((sum, item) => sum + item.goal.targetAmount, 0))}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-fg-muted">Effort mensuel total</p>
              <p className="mt-1 text-xl font-semibold text-fg tabular">
                {formatEuro(goals.reduce((sum, item) => sum + item.goal.monthlyContribution, 0))}
              </p>
            </Card>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {goals.map((projection) => {
              const { goal } = projection;
              return (
                <Card key={goal.id}>
                  <CardHeader>
                    <div className="min-w-0">
                      <CardTitle>{goal.label}</CardTitle>
                      <p className="mt-0.5 text-xs text-fg-muted">
                        {GOAL_KIND_LABELS[goal.kind]} · priorité {PRIORITY_LABELS[goal.priority].toLowerCase()} ·
                        échéance {formatDate(goal.targetDate, 'long')}
                      </p>
                    </div>
                    <Badge tone={projection.onTrack ? 'positive' : 'warning'}>
                      {projection.onTrack ? 'Sur trajectoire' : 'Écart à combler'}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between">
                      <p className="text-lg font-semibold text-fg tabular">
                        {formatEuro(goal.currentAmount)}
                      </p>
                      <p className="text-xs text-fg-subtle tabular">sur {formatEuro(goal.targetAmount)}</p>
                    </div>
                    <Progress
                      value={projection.progressPct}
                      tone={projection.onTrack ? 'positive' : 'warning'}
                      className="mt-2"
                      label={`Progression de ${goal.label}`}
                    />
                    <p className="mt-1 text-[11px] text-fg-subtle">
                      {formatPercent(projection.progressPct, 0)} du montant cible déjà constitué.
                    </p>

                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div className="flex justify-between">
                        <dt className="text-fg-subtle">Versement mensuel</dt>
                        <dd className="text-fg-muted tabular">{formatEuro(goal.monthlyContribution)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-fg-subtle">Durée restante</dt>
                        <dd className="text-fg-muted tabular">{formatNumber(projection.yearsLeft, 1)} ans</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-fg-subtle">Capital projeté</dt>
                        <dd className="font-medium text-fg tabular">
                          {formatEuro(projection.projectedAmount)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-fg-subtle">Écart</dt>
                        <dd className={projection.gap > 0 ? 'text-negative tabular' : 'text-positive tabular'}>
                          {projection.gap > 0
                            ? `− ${formatEuro(projection.gap)}`
                            : `+ ${formatEuro(-projection.gap)}`}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-fg-subtle">Probabilité indicative</dt>
                        <dd className="text-fg-muted tabular">
                          {formatPercent(projection.successProbabilityPct, 0)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-fg-subtle">Effort requis</dt>
                        <dd className="text-fg-muted tabular">
                          {formatEuro(projection.requiredMonthlyContribution)}/mois
                        </dd>
                      </div>
                    </dl>

                    {goal.notes ? (
                      <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-[11px] text-fg-muted">
                        {goal.notes}
                      </p>
                    ) : null}

                    {canManage ? (
                      <div className="mt-3 flex justify-end gap-1.5 border-t border-border pt-3">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(goal)}>
                          <Pencil className="size-3.5" aria-hidden />
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() =>
                            startTransition(() => {
                              void deleteGoalAction(goal.id, clientId);
                            })
                          }
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                          Supprimer
                        </Button>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <DisclaimerNote>
        Projections établies avec un rendement annuel constant de {formatPercent(CENTRAL_RETURN_PCT, 1)}, hors
        fiscalité et hors frais. La probabilité affichée est un repère de lecture, pas une garantie : les
        rendements passés ne préjugent pas des rendements futurs.
      </DisclaimerNote>

      {canManage ? (
        <>
          <Modal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            title="Nouvel objectif"
            description="L’objectif est immédiatement pris en compte par l’analyse et le score de cohérence."
            size="lg"
          >
            <GoalForm
              clientId={clientId}
              action={createGoalAction}
              submitLabel="Créer l’objectif"
              onCancel={() => setCreateOpen(false)}
            />
          </Modal>

          <Modal
            open={editing !== null}
            onClose={() => setEditing(null)}
            title="Modifier l’objectif"
            size="lg"
          >
            {editing && updateAction ? (
              <GoalForm
                clientId={clientId}
                goal={editing}
                action={updateAction}
                submitLabel="Enregistrer"
                onCancel={() => setEditing(null)}
              />
            ) : null}
          </Modal>
        </>
      ) : null}
    </div>
  );
}
