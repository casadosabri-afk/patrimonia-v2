import type { CoherenceScore } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { DisclaimerNote } from '@/components/ui/DataNotice';
import { ScoreDial } from './ScoreDial';
import { formatPercent } from '@/lib/utils/format';

function tone(score: number): 'positive' | 'accent' | 'warning' | 'negative' {
  if (score >= 72) return 'positive';
  if (score >= 58) return 'accent';
  if (score >= 42) return 'warning';
  return 'negative';
}

/** Score de cohérence : jamais un chiffre seul, toujours ses sept facteurs. */
export function ScoreBreakdown({ score }: { score: CoherenceScore }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Cohérence du patrimoine</CardTitle>
          <p className="mt-0.5 text-xs text-fg-muted">
            Sept facteurs pondérés, chacun calculé à partir des données du dossier.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="flex items-center gap-4 lg:w-56 lg:flex-col lg:items-start">
            <ScoreDial score={score.score} size={104} label="sur 100" />
            <div>
              <p className="text-sm font-semibold text-fg">{score.label}</p>
              {score.strengths.length > 0 ? (
                <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">
                  Points forts : {score.strengths.join(', ').toLowerCase()}.
                </p>
              ) : null}
              {score.weaknesses.length > 0 ? (
                <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">
                  À travailler : {score.weaknesses.join(', ').toLowerCase()}.
                </p>
              ) : null}
            </div>
          </div>

          <ul className="min-w-0 flex-1 space-y-3">
            {score.factors.map((factor) => (
              <li key={factor.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xs font-medium text-fg">
                    {factor.label}
                    <span className="ml-1.5 text-[10px] font-normal text-fg-subtle">
                      pondération {formatPercent(factor.weight * 100, 0)}
                    </span>
                  </p>
                  <p className="shrink-0 text-xs font-semibold text-fg tabular">{factor.score}/100</p>
                </div>
                <Progress value={factor.score} tone={tone(factor.score)} className="mt-1.5 h-1.5" label={factor.label} />
                <p className="mt-1 text-[11px] text-fg-subtle">{factor.measure}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-fg-muted">{factor.explanation}</p>
              </li>
            ))}
          </ul>
        </div>

        <DisclaimerNote className="mt-4">
          Indicateur pédagogique construit par PATRIMONIA à partir des données du dossier. Il facilite la
          lecture d’ensemble et ne constitue pas une évaluation réglementaire ni un conseil en investissement.
        </DisclaimerNote>
      </CardContent>
    </Card>
  );
}
