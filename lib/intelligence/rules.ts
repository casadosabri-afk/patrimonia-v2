import type { Insight } from '@/types';
import { RISK_PROFILE_EQUITY_TARGET, RISK_PROFILE_LABELS, BUCKET_LABELS } from '@/lib/utils/labels';
import { debtServiceRatio, computePropertyMetrics } from '@/lib/patrimony/debt';
import { equityExposurePct } from '@/lib/patrimony/patrimony';
import { formatEuro, formatPercent, formatNumber } from '@/lib/utils/format';
import { projectGoal } from '@/lib/patrimony/goals';
import { concentrationIndex, liquidityMonths, type AnalysisContext } from './context';

type Rule = (context: AnalysisContext) => Insight[];

function insight(
  context: AnalysisContext,
  partial: Omit<Insight, 'clientId' | 'id'> & { id?: string },
): Insight {
  return {
    ...partial,
    id: partial.id ?? `${context.client.id}:${partial.ruleId}`,
    clientId: context.client.id,
  };
}

/** R1 — Concentration sur une grande classe patrimoniale. */
const bucketConcentration: Rule = (context) => {
  const dominant = [...context.patrimony.buckets].sort((a, b) => b.sharePct - a.sharePct)[0];
  if (!dominant || dominant.sharePct < 55) return [];

  const severity = dominant.sharePct >= 75 ? 'eleve' : 'moyen';
  return [
    insight(context, {
      ruleId: 'concentration-bucket',
      kind: 'risque',
      severity,
      title: `Concentration importante sur « ${dominant.label} »`,
      finding: `${formatPercent(dominant.sharePct, 0)} du patrimoine brut est exposé à la catégorie « ${dominant.label} ».`,
      explanation:
        "Lorsqu'une part majoritaire du patrimoine dépend d'une seule catégorie d'actifs, sa valeur suit les cycles de cette catégorie. Une baisse durable du secteur se répercute alors sur l'ensemble du patrimoine.",
      suggestedAction:
        'Examiner le niveau de diversification et les marges de manœuvre disponibles pour rééquilibrer progressivement.',
      evidence: [
        { label: dominant.label, value: formatEuro(dominant.value) },
        { label: 'Part du patrimoine brut', value: formatPercent(dominant.sharePct, 1) },
      ],
      weight: dominant.sharePct,
    }),
  ];
};

/** R2 — Poids excessif d'une seule ligne d'investissement. */
const singleLineConcentration: Rule = (context) => {
  const gross = context.patrimony.grossAssets;
  if (gross <= 0) return [];

  return context.investments
    .filter((item) => item.value / gross >= 0.1)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map((item) => {
      const share = (item.value / gross) * 100;
      return insight(context, {
        id: `${context.client.id}:ligne-${item.id}`,
        ruleId: 'concentration-ligne',
        kind: 'risque',
        severity: share >= 18 ? 'eleve' : 'moyen',
        title: `Exposition élevée sur ${item.name}`,
        finding: `Cette seule ligne représente ${formatPercent(share, 1)} du patrimoine brut, soit ${formatEuro(item.value)}.`,
        explanation:
          "Le risque spécifique d'un émetteur ne se compense pas au sein d'un portefeuille lorsqu'il pèse un poids important. Un événement propre à cette valeur affecte directement le patrimoine global.",
        suggestedAction:
          'Analyser l’opportunité d’un allègement progressif et les conséquences fiscales d’une cession partielle.',
        evidence: [
          { label: 'Valorisation', value: formatEuro(item.value) },
          { label: 'Poids patrimoine brut', value: formatPercent(share, 1) },
          { label: 'Plus ou moins-value latente', value: formatPercent(item.gainPct, 1) },
        ],
        weight: share * 2,
      });
    });
};

/** R3 — Trésorerie importante non investie. */
const idleCash: Rule = (context) => {
  const months = liquidityMonths(context);
  const liquidity = context.patrimony.liquidity;
  if (months < 12 || liquidity < 40000) return [];

  return [
    insight(context, {
      ruleId: 'liquidites-excessives',
      kind: 'opportunite',
      severity: months >= 24 ? 'eleve' : 'moyen',
      title: 'Trésorerie importante non investie',
      finding: `${formatEuro(liquidity)} de liquidités disponibles, soit ${formatNumber(months, 0)} mois de dépenses courantes.`,
      explanation:
        "Au-delà d'une épargne de précaution de trois à six mois de dépenses, les liquidités ne sont plus rémunérées au niveau de l'inflation et perdent du pouvoir d'achat au fil du temps.",
      suggestedAction:
        'Étudier avec le client l’allocation d’une partie de cette trésorerie, en cohérence avec son horizon et son profil.',
      evidence: [
        { label: 'Liquidités', value: formatEuro(liquidity) },
        { label: 'Couverture des dépenses', value: `${formatNumber(months, 0)} mois` },
      ],
      weight: 55 + Math.min(months, 36),
    }),
  ];
};

/** R4 — Épargne de précaution insuffisante. */
const thinCashBuffer: Rule = (context) => {
  const months = liquidityMonths(context);
  if (months >= 3) return [];

  return [
    insight(context, {
      ruleId: 'liquidites-insuffisantes',
      kind: 'risque',
      severity: months < 1.5 ? 'eleve' : 'moyen',
      title: 'Épargne de précaution insuffisante',
      finding: `Les liquidités couvrent ${formatNumber(months, 1)} mois de dépenses courantes.`,
      explanation:
        "Une épargne de précaution de trois à six mois de dépenses permet d'absorber un imprévu sans céder d'actifs au mauvais moment ni recourir au crédit.",
      suggestedAction:
        'Prioriser la reconstitution d’une réserve de sécurité avant tout nouvel investissement long terme.',
      evidence: [
        { label: 'Liquidités', value: formatEuro(context.patrimony.liquidity) },
        { label: 'Dépenses mensuelles', value: formatEuro(context.client.annualExpenses / 12) },
      ],
      weight: 80,
    }),
  ];
};

/** R5 — Diversification insuffisante du patrimoine. */
const weakDiversification: Rule = (context) => {
  const slices = context.patrimony.allocation;
  if (slices.length === 0) return [];
  const hhi = concentrationIndex(slices.map((slice) => slice.value));
  if (hhi < 0.35 && slices.length >= 4) return [];

  return [
    insight(context, {
      ruleId: 'diversification',
      kind: 'risque',
      severity: hhi >= 0.55 ? 'eleve' : 'moyen',
      title: 'Diversification limitée',
      finding: `Le patrimoine se répartit sur ${slices.length} catégorie${slices.length > 1 ? 's' : ''} d'actifs, avec un indice de concentration de ${formatNumber(hhi, 2)}.`,
      explanation:
        "La diversification répartit le risque entre des actifs dont les évolutions ne sont pas parfaitement corrélées. Un patrimoine peu diversifié subit plus fortement les cycles d'une seule catégorie.",
      suggestedAction:
        'Identifier les classes d’actifs absentes et évaluer leur pertinence au regard du profil et de l’horizon du client.',
      evidence: [
        { label: "Nombre de classes d'actifs", value: `${slices.length}` },
        { label: 'Indice de concentration (HHI)', value: formatNumber(hhi, 2) },
      ],
      weight: 50 + hhi * 60,
    }),
  ];
};

/** R6 — Exposition actions écartée du profil déclaré. */
const riskProfileGap: Rule = (context) => {
  const exposure = equityExposurePct(context.investments, context.patrimony.grossAssets);
  const target = RISK_PROFILE_EQUITY_TARGET[context.client.riskProfile];
  if (exposure >= target.min && exposure <= target.max) return [];

  const above = exposure > target.max;
  return [
    insight(context, {
      ruleId: 'profil-risque',
      kind: above ? 'risque' : 'information',
      severity: above ? 'eleve' : 'faible',
      title: above
        ? 'Exposition actions supérieure au profil déclaré'
        : 'Exposition actions inférieure au profil déclaré',
      finding: `L'exposition actions et ETF représente ${formatPercent(exposure, 1)} du patrimoine brut, pour une fourchette indicative de ${target.min} à ${target.max} % associée au profil ${RISK_PROFILE_LABELS[context.client.riskProfile].toLowerCase()}.`,
      explanation: above
        ? "Une exposition supérieure au profil signifie que les variations de marché ressenties par le client peuvent dépasser ce qu'il a déclaré accepter."
        : "Une exposition inférieure au profil peut limiter le rendement attendu sur la durée, au regard de la tolérance au risque exprimée par le client.",
      suggestedAction: above
        ? 'Vérifier que le profil investisseur reste d’actualité, puis examiner les arbitrages possibles.'
        : 'Vérifier si cette prudence est volontaire ou si elle résulte d’un défaut d’allocation.',
      evidence: [
        { label: 'Exposition actions et ETF', value: formatPercent(exposure, 1) },
        { label: 'Fourchette indicative du profil', value: `${target.min} – ${target.max} %` },
      ],
      weight: above ? 70 : 30,
    }),
  ];
};

/** R7 — Horizon court associé à une exposition marché élevée. */
const shortHorizonHighRisk: Rule = (context) => {
  const exposure = equityExposurePct(context.investments, context.patrimony.grossAssets);
  if (context.client.horizonYears > 5 || exposure < 35) return [];

  return [
    insight(context, {
      ruleId: 'horizon-risque',
      kind: 'risque',
      severity: 'critique',
      title: 'Horizon court et exposition marché élevée',
      finding: `Horizon déclaré de ${context.client.horizonYears} ans avec ${formatPercent(exposure, 1)} du patrimoine exposé aux marchés actions.`,
      explanation:
        "Sur un horizon court, une baisse de marché laisse peu de temps pour être compensée. Le risque de devoir céder des actifs en phase de repli devient significatif.",
      suggestedAction:
        'Examiner une sécurisation progressive de la part correspondant aux besoins des prochaines années.',
      evidence: [
        { label: 'Horizon déclaré', value: `${context.client.horizonYears} ans` },
        { label: 'Exposition actions', value: formatPercent(exposure, 1) },
      ],
      weight: 95,
    }),
  ];
};

/** R8 — Charge de remboursement élevée. */
const debtLoad: Rule = (context) => {
  const ratio = debtServiceRatio(context.debts, context.client.annualIncome);
  if (ratio < 33) return [];

  return [
    insight(context, {
      ruleId: 'endettement',
      kind: 'risque',
      severity: ratio >= 40 ? 'eleve' : 'moyen',
      title: 'Charge de remboursement élevée',
      finding: `Les mensualités de crédit représentent ${formatPercent(ratio, 1)} des revenus annuels.`,
      explanation:
        "Au-delà d'environ 35 % des revenus, la charge de remboursement réduit la capacité d'épargne et la marge de manœuvre en cas de baisse de revenus.",
      suggestedAction:
        'Analyser les possibilités de renégociation, d’allongement de durée ou de remboursement anticipé partiel.',
      evidence: [
        { label: 'Taux d’endettement', value: formatPercent(ratio, 1) },
        {
          label: 'Mensualités totales',
          value: formatEuro(context.debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0)),
        },
      ],
      weight: 60 + ratio,
    }),
  ];
};

/** R9 — Profil investisseur à actualiser. */
const staleProfile: Rule = (context) => {
  const updated = new Date(context.client.profileUpdatedAt);
  const months =
    (context.now.getFullYear() - updated.getFullYear()) * 12 +
    (context.now.getMonth() - updated.getMonth());
  if (months < 24) return [];

  return [
    insight(context, {
      ruleId: 'profil-a-actualiser',
      kind: 'action',
      severity: 'moyen',
      title: 'Profil client à actualiser',
      finding: `Le profil investisseur n'a pas été mis à jour depuis ${months} mois.`,
      explanation:
        "La situation personnelle, les revenus et les projets évoluent. Un profil ancien ne reflète plus nécessairement la tolérance au risque ni l'horizon réels du client.",
      suggestedAction: 'Planifier un point de mise à jour du profil et vérifier les informations du dossier.',
      evidence: [{ label: 'Dernière actualisation', value: `${months} mois` }],
      weight: 45,
    }),
  ];
};

/** R10 — Objectif dont la trajectoire ne converge pas. */
const goalsOffTrack: Rule = (context) =>
  context.goals
    .map((goal) => projectGoal(goal, context.now))
    .filter((projection) => !projection.onTrack && projection.yearsLeft > 0.5)
    .sort((a, b) => a.successProbabilityPct - b.successProbabilityPct)
    .slice(0, 2)
    .map((projection) =>
      insight(context, {
        id: `${context.client.id}:objectif-${projection.goal.id}`,
        ruleId: 'objectif-non-aligne',
        kind: 'risque',
        severity: projection.successProbabilityPct < 40 ? 'eleve' : 'moyen',
        title: `Objectif « ${projection.goal.label} » non aligné`,
        finding: `Capital projeté de ${formatEuro(projection.projectedAmount)} à l'échéance, pour un objectif de ${formatEuro(projection.goal.targetAmount)}.`,
        explanation:
          "La projection compare le capital déjà constitué et l'effort d'épargne en cours avec le montant visé à la date cible, sous une hypothèse de rendement central.",
        suggestedAction: `Étudier un effort d'épargne d'environ ${formatEuro(projection.requiredMonthlyContribution)} par mois, un décalage de l'échéance ou une révision du montant cible.`,
        evidence: [
          { label: 'Écart projeté', value: formatEuro(projection.gap) },
          { label: 'Effort mensuel actuel', value: formatEuro(projection.goal.monthlyContribution) },
          { label: 'Probabilité indicative', value: formatPercent(projection.successProbabilityPct, 0) },
        ],
        weight: 75,
      }),
    );

/** R11 — Exposition crypto significative. */
const cryptoExposure: Rule = (context) => {
  const gross = context.patrimony.grossAssets;
  if (gross <= 0) return [];
  const crypto = context.investments
    .filter((item) => item.assetClass === 'crypto')
    .reduce((sum, item) => sum + item.value, 0);
  const share = (crypto / gross) * 100;
  if (share < 5) return [];

  return [
    insight(context, {
      ruleId: 'crypto',
      kind: 'risque',
      severity: share >= 12 ? 'eleve' : 'moyen',
      title: 'Exposition aux crypto-actifs significative',
      finding: `Les crypto-actifs représentent ${formatPercent(share, 1)} du patrimoine brut, soit ${formatEuro(crypto)}.`,
      explanation:
        "Les crypto-actifs présentent une volatilité nettement supérieure à celle des marchés actions et ne bénéficient pas des mêmes protections réglementaires.",
      suggestedAction: 'Vérifier que cette exposition reste compatible avec le profil de risque et les projets du client.',
      evidence: [
        { label: 'Valorisation crypto', value: formatEuro(crypto) },
        { label: 'Part du patrimoine brut', value: formatPercent(share, 1) },
      ],
      weight: 55 + share * 2,
    }),
  ];
};

/** R12 — Rendement locatif faible. */
const lowRentalYield: Rule = (context) =>
  context.properties
    .filter((property) => property.monthlyRent > 0)
    .map((property) => computePropertyMetrics(property, context.debts))
    .filter((metrics) => metrics.netYieldPct < 2.5)
    .slice(0, 1)
    .map((metrics) =>
      insight(context, {
        id: `${context.client.id}:rendement-${metrics.property.id}`,
        ruleId: 'rendement-locatif',
        kind: 'information',
        severity: 'faible',
        title: `Rendement net limité sur « ${metrics.property.label} »`,
        finding: `Rendement net de charges de ${formatPercent(metrics.netYieldPct, 2)}, pour un rendement brut de ${formatPercent(metrics.grossYieldPct, 2)}.`,
        explanation:
          "L'écart entre rendement brut et rendement net mesure le poids des charges et de la taxe foncière. Un rendement net faible réduit l'intérêt économique de la détention.",
        suggestedAction: 'Comparer le rendement net à celui d’autres emplois possibles du capital immobilisé.',
        evidence: [
          { label: 'Loyers annuels', value: formatEuro(metrics.annualGrossRent) },
          { label: 'Valeur du bien', value: formatEuro(metrics.property.currentValue) },
          { label: 'Cash-flow mensuel', value: formatEuro(metrics.monthlyCashflow) },
        ],
        weight: 30,
      }),
    );

/** R13 — Absence de PER malgré une tranche marginale élevée. */
const missingRetirementWrapper: Rule = (context) => {
  const hasPer = context.accounts.some((account) => account.kind === 'per');
  if (hasPer || context.client.taxBracketRate < 30 || context.client.horizonYears < 8) return [];

  return [
    insight(context, {
      ruleId: 'enveloppe-retraite',
      kind: 'opportunite',
      severity: 'moyen',
      title: 'Aucune enveloppe retraite dédiée',
      finding: `Tranche marginale d'imposition de ${context.client.taxBracketRate} % et horizon de ${context.client.horizonYears} ans, sans plan d'épargne retraite ouvert.`,
      explanation:
        "Le plan d'épargne retraite permet, dans certaines limites, de déduire les versements du revenu imposable, l'imposition intervenant à la sortie. Son intérêt dépend de la situation fiscale présente et future.",
      suggestedAction: 'Étudier la pertinence d’une enveloppe retraite et chiffrer l’effet sur l’imposition annuelle.',
      evidence: [
        { label: 'Tranche marginale', value: `${context.client.taxBracketRate} %` },
        { label: 'Horizon', value: `${context.client.horizonYears} ans` },
      ],
      weight: 50,
    }),
  ];
};

/** R14 — Plus-value latente importante à surveiller fiscalement. */
const largeLatentGain: Rule = (context) =>
  context.investments
    .filter((item) => item.gainPct >= 100 && item.gain >= 20000)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, 1)
    .map((item) =>
      insight(context, {
        id: `${context.client.id}:pv-${item.id}`,
        ruleId: 'plus-value-latente',
        kind: 'information',
        severity: 'faible',
        title: `Plus-value latente importante sur ${item.name}`,
        finding: `Plus-value latente de ${formatEuro(item.gain)}, soit ${formatPercent(item.gainPct, 1)} du montant investi.`,
        explanation:
          "Une plus-value latente n'est pas imposée tant qu'elle n'est pas réalisée. Le régime applicable dépend de l'enveloppe de détention et de la durée.",
        suggestedAction: 'Anticiper le traitement fiscal d’une cession éventuelle avant tout arbitrage.',
        evidence: [
          { label: 'Montant investi', value: formatEuro(item.investedAmount) },
          { label: 'Valorisation', value: formatEuro(item.value) },
        ],
        weight: 28,
      }),
    );

/** R15 — Évolution inhabituelle du patrimoine sur les derniers mois. */
const unusualTrend: Rule = (context) => {
  const history = context.patrimony.history;
  if (history.length < 4) return [];
  const last = history[history.length - 1];
  const threeMonthsAgo = history[history.length - 4];
  if (!last || !threeMonthsAgo || threeMonthsAgo.netWorth <= 0) return [];

  const change = ((last.netWorth - threeMonthsAgo.netWorth) / threeMonthsAgo.netWorth) * 100;
  if (change > -7) return [];

  return [
    insight(context, {
      ruleId: 'evolution-inhabituelle',
      kind: 'information',
      severity: 'moyen',
      title: 'Repli marqué du patrimoine sur trois mois',
      finding: `Le patrimoine net a évolué de ${formatPercent(change, 1)} sur les trois derniers mois.`,
      explanation:
        "Un repli marqué sur une courte période peut provenir d'un mouvement de marché, d'un retrait ou d'une réévaluation d'actif. Identifier la cause évite une interprétation erronée.",
      suggestedAction: 'Vérifier l’origine du mouvement avant le prochain échange avec le client.',
      evidence: [
        { label: 'Patrimoine net actuel', value: formatEuro(last.netWorth) },
        { label: 'Il y a trois mois', value: formatEuro(threeMonthsAgo.netWorth) },
      ],
      weight: 48,
    }),
  ];
};

const RULES: Rule[] = [
  bucketConcentration,
  singleLineConcentration,
  idleCash,
  thinCashBuffer,
  weakDiversification,
  riskProfileGap,
  shortHorizonHighRisk,
  debtLoad,
  staleProfile,
  goalsOffTrack,
  cryptoExposure,
  lowRentalYield,
  missingRetirementWrapper,
  largeLatentGain,
  unusualTrend,
];

/**
 * PATRIMONIA INTELLIGENCE — exécute l'ensemble des règles d'analyse.
 *
 * Les résultats produits sont des aides à l'analyse à visée pédagogique. Ils ne
 * constituent pas un conseil en investissement au sens réglementaire.
 */
export function analyzeClient(context: AnalysisContext): Insight[] {
  return RULES.flatMap((rule) => rule(context)).sort((a, b) => b.weight - a.weight);
}

export const RULE_COUNT = RULES.length;
