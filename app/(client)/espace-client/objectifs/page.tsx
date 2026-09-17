import type { Metadata } from 'next';
import { Target } from 'lucide-react';
import { requireClientOverview } from '@/lib/auth/clientAccess';
import { projectGoal } from '@/lib/patrimony/goals';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { EmptyState } from '@/components/ui/EmptyState';
import { DisclaimerNote } from '@/components/ui/DataNotice';
import { GOAL_KIND_LABELS } from '@/lib/utils/labels';
import { formatDate, formatEuro, formatNumber, formatPercent } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Mes objectifs' };
export const dynamic = 'force-dynamic';

export default async function ClientGoalsPage() {
  const { overview } = await requireClientOverview();
  const goals = overview.record.goals.map((goal) => projectGoal(goal));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vos objectifs"
        subtitle="Où vous en êtes par rapport aux projets définis avec votre conseiller."
      />

      {goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={Target}
            title="Aucun objectif défini"
            description="Échangez avec votre conseiller pour formaliser vos projets."
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((projection) => (
            <Card key={projection.goal.id}>
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle>{projection.goal.label}</CardTitle>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    {GOAL_KIND_LABELS[projection.goal.kind]} · échéance{' '}
                    {formatDate(projection.goal.targetDate, 'long')}
                  </p>
                </div>
                <Badge tone={projection.onTrack ? 'positive' : 'warning'}>
                  {projection.onTrack ? 'Sur la bonne voie' : 'À renforcer'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <p className="text-xl font-semibold text-fg tabular">
                    {formatEuro(projection.goal.currentAmount)}
                  </p>
                  <p className="text-xs text-fg-subtle tabular">
                    sur {formatEuro(projection.goal.targetAmount)}
                  </p>
                </div>
                <Progress
                  value={projection.progressPct}
                  tone={projection.onTrack ? 'positive' : 'warning'}
                  className="mt-2"
                  label={projection.goal.label}
                />
                <p className="mt-2 text-xs leading-relaxed text-fg-muted">
                  Vous avez constitué {formatPercent(projection.progressPct, 0)} du montant visé. En continuant
                  à verser {formatEuro(projection.goal.monthlyContribution)} par mois pendant{' '}
                  {formatNumber(projection.yearsLeft, 1)} an(s), le capital projeté atteindrait{' '}
                  {formatEuro(projection.projectedAmount)}.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DisclaimerNote>
        Les projections reposent sur une hypothèse de rendement constante et ne constituent pas une garantie.
        Votre conseiller peut ajuster ces objectifs avec vous à tout moment.
      </DisclaimerNote>
    </div>
  );
}
