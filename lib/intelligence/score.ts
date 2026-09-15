import type { CoherenceScore, ScoreFactor } from '@/types';
import { RISK_PROFILE_EQUITY_TARGET, RISK_PROFILE_LABELS } from '@/lib/utils/labels';
import { debtServiceRatio } from '@/lib/patrimony/debt';
import { equityExposurePct } from '@/lib/patrimony/patrimony';
import { projectGoal } from '@/lib/patrimony/goals';
import { formatNumber, formatPercent } from '@/lib/utils/format';
import { concentrationIndex, liquidityMonths, type AnalysisContext } from './context';

/** Pondération des sept facteurs du score de cohérence. La somme vaut 1. */
const WEIGHTS = {
  diversification: 0.18,
  objectifs: 0.17,
  liquidites: 0.14,
  risque: 0.17,
  horizon: 0.12,
  concentration: 0.12,
  endettement: 0.1,
} as const;

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Score « Cohérence du patrimoine ».
 *
 * Le score n'est jamais affiché seul : chaque facteur porte sa note, sa mesure
 * et la phrase qui explique le résultat obtenu.
 */
export function computeCoherenceScore(context: AnalysisContext): CoherenceScore {
  const { client, patrimony, investments, debts, goals } = context;

  // 1. Diversification — nombre de classes d'actifs et dispersion.
  const classCount = patrimony.allocation.length;
  const hhi = concentrationIndex(patrimony.allocation.map((slice) => slice.value));
  const diversificationScore = clamp(100 - (hhi - 0.15) * 190 + Math.min(classCount, 6) * 3);

  // 2. Objectifs — moyenne des probabilités indicatives d'atteinte.
  const projections = goals.map((goal) => projectGoal(goal, context.now));
  const goalScore = projections.length
    ? clamp(projections.reduce((sum, item) => sum + item.successProbabilityPct, 0) / projections.length)
    : 50;

  // 3. Liquidités — cible de trois à douze mois de dépenses.
  const months = liquidityMonths(context);
  const liquidityScore = clamp(
    months < 3 ? (months / 3) * 60 : months <= 12 ? 100 : Math.max(45, 100 - (months - 12) * 2.5),
  );

  // 4. Risque — écart entre exposition actions et fourchette du profil.
  const exposure = equityExposurePct(investments, patrimony.grossAssets);
  const target = RISK_PROFILE_EQUITY_TARGET[client.riskProfile];
  const gap =
    exposure < target.min ? target.min - exposure : exposure > target.max ? exposure - target.max : 0;
  const riskScore = clamp(100 - gap * 2.2);

  // 5. Horizon — cohérence entre durée annoncée et exposition marché.
  const horizonScore = clamp(
    client.horizonYears >= 10
      ? 100 - Math.max(0, 35 - exposure) * 0.8
      : client.horizonYears >= 5
        ? 100 - Math.max(0, exposure - 55) * 1.6
        : 100 - Math.max(0, exposure - 25) * 2.4,
  );

  // 6. Concentration — poids de la ligne la plus lourde.
  const heaviest = patrimony.grossAssets
    ? Math.max(0, ...investments.map((item) => (item.value / patrimony.grossAssets) * 100))
    : 0;
  const dominantBucket = Math.max(0, ...patrimony.buckets.map((bucket) => bucket.sharePct));
  const concentrationScore = clamp(
    100 - Math.max(0, heaviest - 8) * 3.2 - Math.max(0, dominantBucket - 55) * 1.1,
  );

  // 7. Endettement — charge de remboursement rapportée aux revenus.
  const ratio = debtServiceRatio(debts, client.annualIncome);
  const debtScore = clamp(ratio <= 25 ? 100 : 100 - (ratio - 25) * 3.4);

  const factors: ScoreFactor[] = [
    {
      key: 'diversification',
      label: 'Diversification',
      score: Math.round(diversificationScore),
      weight: WEIGHTS.diversification,
      measure: `${classCount} classes d'actifs · indice ${formatNumber(hhi, 2)}`,
      explanation:
        diversificationScore >= 70
          ? "Le patrimoine est réparti sur un nombre suffisant de classes d'actifs, ce qui limite la dépendance à un seul marché."
          : "La répartition reste concentrée sur un nombre limité de classes d'actifs, ce qui expose le patrimoine aux cycles de ces marchés.",
    },
    {
      key: 'objectifs',
      label: 'Objectifs',
      score: Math.round(goalScore),
      weight: WEIGHTS.objectifs,
      measure: projections.length
        ? `${projections.filter((item) => item.onTrack).length}/${projections.length} objectifs sur trajectoire`
        : 'Aucun objectif renseigné',
      explanation: projections.length
        ? goalScore >= 70
          ? "Les capitaux constitués et l'effort d'épargne en cours convergent vers les montants visés."
          : "L'effort d'épargne actuel ne permet pas d'atteindre les montants visés aux échéances prévues."
        : "Aucun objectif n'est renseigné : le patrimoine ne peut pas être évalué au regard d'un projet.",
    },
    {
      key: 'liquidites',
      label: 'Liquidités',
      score: Math.round(liquidityScore),
      weight: WEIGHTS.liquidites,
      measure: `${formatNumber(months, 1)} mois de dépenses couverts`,
      explanation:
        months < 3
          ? "L'épargne de précaution est inférieure à trois mois de dépenses : un imprévu obligerait à céder des actifs."
          : months <= 12
            ? 'Le niveau de liquidités couvre les imprévus sans immobiliser inutilement de capital.'
            : "Les liquidités dépassent largement le besoin de précaution : une part perd du pouvoir d'achat face à l'inflation.",
    },
    {
      key: 'risque',
      label: 'Risque',
      score: Math.round(riskScore),
      weight: WEIGHTS.risque,
      measure: `${formatPercent(exposure, 1)} d'exposition actions · cible ${target.min}–${target.max} %`,
      explanation:
        gap === 0
          ? `L'exposition aux marchés actions correspond à la fourchette associée au profil ${RISK_PROFILE_LABELS[client.riskProfile].toLowerCase()}.`
          : exposure > target.max
            ? "L'exposition actions dépasse la fourchette du profil déclaré : la volatilité subie peut excéder ce que le client a accepté."
            : "L'exposition actions est inférieure à la fourchette du profil, ce qui peut limiter le rendement attendu sur la durée.",
    },
    {
      key: 'horizon',
      label: 'Horizon',
      score: Math.round(horizonScore),
      weight: WEIGHTS.horizon,
      measure: `${client.horizonYears} ans déclarés`,
      explanation:
        horizonScore >= 70
          ? "La durée de placement annoncée est cohérente avec le niveau d'exposition aux marchés."
          : client.horizonYears < 5
            ? "L'horizon court laisse peu de temps pour absorber une baisse de marché compte tenu de l'exposition actuelle."
            : "L'horizon long est peu exploité : une exposition aussi faible réduit le rendement attendu sur la période.",
    },
    {
      key: 'concentration',
      label: 'Concentration',
      score: Math.round(concentrationScore),
      weight: WEIGHTS.concentration,
      measure: `Ligne la plus lourde : ${formatPercent(heaviest, 1)} du patrimoine brut`,
      explanation:
        concentrationScore >= 70
          ? "Aucune ligne ni catégorie ne pèse un poids susceptible de déséquilibrer le patrimoine."
          : "Une ligne ou une catégorie pèse un poids important : un événement isolé affecterait directement le patrimoine global.",
    },
    {
      key: 'endettement',
      label: 'Endettement',
      score: Math.round(debtScore),
      weight: WEIGHTS.endettement,
      measure: `${formatPercent(ratio, 1)} des revenus`,
      explanation:
        ratio <= 25
          ? "La charge de remboursement laisse une capacité d'épargne confortable."
          : ratio <= 35
            ? "La charge de remboursement reste maîtrisée mais réduit la capacité d'épargne disponible."
            : "La charge de remboursement est élevée : la marge de manœuvre en cas de baisse de revenus est réduite.",
    },
  ];

  const score = Math.round(
    factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0),
  );

  const sorted = [...factors].sort((a, b) => b.score - a.score);
  const label: CoherenceScore['label'] =
    score >= 85 ? 'Excellente' : score >= 72 ? 'Bonne' : score >= 58 ? 'Correcte' : score >= 42 ? 'Fragile' : 'Insuffisante';

  return {
    clientId: client.id,
    score,
    label,
    factors,
    strengths: sorted.filter((factor) => factor.score >= 72).slice(0, 3).map((factor) => factor.label),
    weaknesses: sorted
      .slice()
      .reverse()
      .filter((factor) => factor.score < 60)
      .slice(0, 3)
      .map((factor) => factor.label),
  };
}
