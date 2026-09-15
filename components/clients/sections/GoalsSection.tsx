'use client';

import { Target } from 'lucide-react';
import type { GoalProjection } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, EmptyState, Badge, Progress, DisclaimerNote } from '@/components/ui';
import { GOAL_KIND_LABELS } from '@/lib/utils/labels';
import { formatDate, formatEuro, formatNumber, formatPercent } from '@/lib/utils/format';
import { CENTRAL_RETURN_PCT } from '@/lib/patrimony/goals';

export function GoalsSection({ goals }: { goals: GoalProjection[] }) {
  if (goals.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Target}
          title="Aucun objectif défini"
          description="Sans objectif, le patrimoine ne peut pas être évalué au regard d’un projet."
        />
      </Card>
    );
  }

  const onTrack = goals.filter((item) => item.onTrack).length;

  return (
    <div className="space-y-5">
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
                    {GOAL_KIND_LABELS[goal.kind]} · échéance {formatDate(goal.targetDate, 'long')}
                  </p>
                </div>
                <Badge tone={projection.onTrack ? 'positive' : 'warning'}>
                  {projection.onTrack ? 'Sur trajectoire' : 'Écart à combler'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <p className="text-lg font-semibold text-fg tabular">{formatEuro(goal.currentAmount)}</p>
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
                    <dd className="font-medium text-fg tabular">{formatEuro(projection.projectedAmount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-fg-subtle">Écart</dt>
                    <dd
                      className={projection.gap > 0 ? 'text-negative tabular' : 'text-positive tabular'}
                    >
                      {projection.gap > 0 ? `− ${formatEuro(projection.gap)}` : `+ ${formatEuro(-projection.gap)}`}
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
                  <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-[11px] text-fg-muted">{goal.notes}</p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DisclaimerNote>
        Projections établies avec un rendement annuel constant de {formatPercent(CENTRAL_RETURN_PCT, 1)}, hors
        fiscalité et hors frais. La probabilité affichée est un repère de lecture, pas une garantie : les
        rendements passés ne préjugent pas des rendements futurs.
      </DisclaimerNote>
    </div>
  );
}
