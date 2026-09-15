import type {
  Alert,
  AssetAccount,
  Client,
  ClientAdvisorLink,
  Debt,
  Goal,
  Investment,
  RealEstateAsset,
} from '@/types';
import { INSTRUMENT_BY_TICKER } from './instruments';
import { CLIENT_SPECS, type ClientSpec } from './clients';
import { addMonths, toISODate } from '@/lib/utils/dates';

export interface ClientBundle {
  client: Client;
  accounts: AssetAccount[];
  investments: Investment[];
  properties: RealEstateAsset[];
  debts: Debt[];
  goals: Goal[];
}

function buildAdvisors(spec: ClientSpec): ClientAdvisorLink[] {
  return spec.advisorIds.map((advisorId, index) => ({
    advisorId,
    primary: index === 0,
    since: spec.createdAt,
  }));
}

/** Transforme une fiche de démonstration en entités du domaine. */
export function buildClientBundle(spec: ClientSpec, now: Date): ClientBundle {
  const client: Client = {
    id: spec.id,
    firmId: spec.firmId,
    firstName: spec.firstName,
    lastName: spec.lastName,
    email: spec.email,
    phone: spec.phone,
    birthDate: spec.birthDate,
    city: spec.city,
    postalCode: spec.postalCode,
    profession: spec.profession,
    maritalStatus: spec.maritalStatus,
    matrimonialRegime: spec.matrimonialRegime,
    dependents: spec.dependents,
    riskProfile: spec.riskProfile,
    status: spec.status,
    horizonYears: spec.horizonYears,
    annualIncome: spec.annualIncome,
    annualExpenses: spec.annualExpenses,
    taxBracketRate: spec.taxBracketRate,
    advisors: buildAdvisors(spec),
    createdAt: spec.createdAt,
    lastReviewAt:
      spec.lastReviewMonthsAgo === null ? null : toISODate(addMonths(now, -spec.lastReviewMonthsAgo)),
    profileUpdatedAt: toISODate(addMonths(now, -spec.profileAgeMonths)),
    notes: spec.notes,
    avatarColor: spec.avatarColor,
  };

  const accounts: AssetAccount[] = [];
  const investments: Investment[] = [];

  for (const envelope of spec.envelopes) {
    const accountId = `${spec.id}-acc-${envelope.key}`;
    accounts.push({
      id: accountId,
      firmId: spec.firmId,
      clientId: spec.id,
      kind: envelope.kind,
      label: envelope.label,
      institution: envelope.institution,
      openedAt: envelope.openedAt,
      cashBalance: envelope.cash,
      currency: 'EUR',
    });

    envelope.holdings.forEach(([ticker, quantity, averageCost, purchasedAt], index) => {
      const instrument = INSTRUMENT_BY_TICKER.get(ticker);
      if (!instrument) return;

      investments.push({
        id: `${accountId}-inv-${index}`,
        firmId: spec.firmId,
        clientId: spec.id,
        accountId,
        name: instrument.name,
        ticker: instrument.ticker,
        isin: instrument.isin,
        type: instrument.type,
        assetClass: instrument.assetClass,
        sector: instrument.sector,
        region: instrument.region,
        quantity,
        averageCost,
        fallbackPrice: instrument.fallbackPrice,
        currency: instrument.currency,
        purchasedAt,
      });
    });

    (envelope.unlisted ?? []).forEach((unlisted, index) => {
      investments.push({
        id: `${accountId}-unl-${index}`,
        firmId: spec.firmId,
        clientId: spec.id,
        accountId,
        name: unlisted.name,
        ticker: null,
        isin: null,
        type: 'non_cote',
        assetClass: unlisted.assetClass,
        sector: unlisted.sector,
        region: 'France',
        quantity: unlisted.quantity,
        averageCost: unlisted.unitCost,
        fallbackPrice: unlisted.unitValue,
        currency: 'EUR',
        purchasedAt: unlisted.purchasedAt,
      });
    });
  }

  const debts: Debt[] = spec.debts.map((debt) => ({
    id: `${spec.id}-debt-${debt.key}`,
    firmId: spec.firmId,
    clientId: spec.id,
    label: debt.label,
    kind: debt.kind,
    lender: debt.lender,
    initialAmount: debt.initialAmount,
    remainingAmount: debt.remainingAmount,
    annualRatePct: debt.annualRatePct,
    insuranceRatePct: debt.insuranceRatePct,
    monthlyPayment: debt.monthlyPayment,
    startedAt: debt.startedAt,
    endsAt: debt.endsAt,
  }));

  const properties: RealEstateAsset[] = spec.properties.map((property) => ({
    id: `${spec.id}-prop-${property.key}`,
    firmId: spec.firmId,
    clientId: spec.id,
    label: property.label,
    kind: property.kind,
    city: property.city,
    postalCode: property.postalCode,
    surfaceM2: property.surfaceM2,
    purchasePrice: property.purchasePrice,
    currentValue: property.currentValue,
    purchasedAt: property.purchasedAt,
    monthlyRent: property.monthlyRent,
    monthlyCharges: property.monthlyCharges,
    annualPropertyTax: property.annualPropertyTax,
    ownershipPct: property.ownershipPct,
    linkedDebtId: property.debtKey ? `${spec.id}-debt-${property.debtKey}` : null,
  }));

  const goals: Goal[] = spec.goals.map((goal) => ({
    id: `${spec.id}-goal-${goal.key}`,
    firmId: spec.firmId,
    clientId: spec.id,
    kind: goal.kind,
    label: goal.label,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    monthlyContribution: goal.monthlyContribution,
    targetDate: goal.targetDate,
    priority: goal.priority,
    createdAt: spec.createdAt,
    notes: goal.notes ?? null,
  }));

  return { client, accounts, investments, properties, debts, goals };
}

export function buildAllBundles(now: Date): ClientBundle[] {
  return CLIENT_SPECS.map((spec) => buildClientBundle(spec, now));
}

/** Alertes marché et administratives, indépendantes de l'analyse patrimoniale. */
export function buildStandaloneAlerts(now: Date): Alert[] {
  const iso = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400_000).toISOString();

  return [
    {
      id: 'alert-marche-1',
      firmId: 'firm-horizon',
      clientId: null,
      category: 'marche',
      severity: 'moyen',
      status: 'ouverte',
      title: 'Volatilité en hausse sur les marchés actions',
      description:
        "La volatilité implicite des indices européens progresse depuis une semaine. Les portefeuilles fortement exposés aux actions peuvent connaître des variations plus marquées.",
      suggestedAction: 'Identifier les clients dont l’exposition actions dépasse leur profil déclaré.',
      assigneeId: 'user-advisor-thomas',
      createdAt: iso(2),
      resolvedAt: null,
      comments: [],
      ruleId: null,
    },
    {
      id: 'alert-marche-2',
      firmId: 'firm-horizon',
      clientId: null,
      category: 'marche',
      severity: 'faible',
      status: 'ouverte',
      title: 'Rendement des fonds euros : campagne annuelle à préparer',
      description:
        'Les revalorisations annuelles des fonds en euros seront publiées prochainement par les assureurs partenaires.',
      suggestedAction: 'Préparer la communication client sur les rendements des contrats d’assurance-vie.',
      assigneeId: null,
      createdAt: iso(6),
      resolvedAt: null,
      comments: [],
      ruleId: null,
    },
    {
      id: 'alert-admin-1',
      firmId: 'firm-horizon',
      clientId: 'client-mercier',
      category: 'administratif',
      severity: 'moyen',
      status: 'ouverte',
      title: 'Dossier de connaissance client incomplet',
      description:
        "Le justificatif de domicile et la pièce d'identité n'ont pas encore été déposés pour ce prospect.",
      suggestedAction: 'Relancer le client pour compléter le dossier avant la souscription.',
      assigneeId: 'user-advisor-thomas',
      createdAt: iso(4),
      resolvedAt: null,
      comments: [],
      ruleId: null,
    },
    {
      id: 'alert-client-1',
      firmId: 'firm-horizon',
      clientId: 'client-petit',
      category: 'client',
      severity: 'moyen',
      status: 'en_cours',
      title: 'Départ à la retraite dans moins de trois ans',
      description:
        'La cliente approche de son départ à la retraite. Un point de bilan complet est recommandé avant la liquidation des droits.',
      suggestedAction: 'Planifier un bilan retraite et vérifier la trajectoire de sécurisation du capital.',
      assigneeId: 'user-advisor-thomas',
      createdAt: iso(9),
      resolvedAt: null,
      comments: [
        {
          id: 'alert-client-1-c1',
          authorId: 'user-advisor-thomas',
          authorLabel: 'Thomas Martin',
          body: 'Rendez-vous de bilan proposé pour le mois prochain, en attente de confirmation.',
          createdAt: iso(5),
        },
      ],
      ruleId: null,
    },
    {
      id: 'alert-admin-2',
      firmId: 'firm-meridien',
      clientId: 'client-vidal',
      category: 'administratif',
      severity: 'faible',
      status: 'ouverte',
      title: 'Renouvellement annuel du questionnaire client',
      description: 'Le questionnaire de connaissance client arrive à échéance dans deux mois.',
      suggestedAction: 'Programmer l’envoi du questionnaire de mise à jour.',
      assigneeId: 'user-advisor-meridien',
      createdAt: iso(3),
      resolvedAt: null,
      comments: [],
      ruleId: null,
    },
  ];
}
