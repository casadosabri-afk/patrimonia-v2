import type {
  AccountKind,
  ClientStatus,
  DebtKind,
  GoalKind,
  GoalPriority,
  MaritalStatus,
  MatrimonialRegime,
  PropertyKind,
  RiskProfile,
} from '@/types';

/**
 * ⚠️ DONNÉES CLIENTS ENTIÈREMENT FICTIVES.
 * Les identités, revenus, patrimoines et opérations décrits ci-dessous sont
 * inventés pour la démonstration. Seuls les instruments financiers référencés
 * (tickers) correspondent à des titres réellement cotés, dont les prix sont
 * récupérés par le MarketDataService.
 */

/** [ticker, quantité, prix de revient unitaire, date d'achat] */
export type HoldingSpec = [string, number, number, string];

/** Ligne non cotée : aucune donnée de marché n'existe, la valorisation est
 *  une estimation fictive du jeu de démonstration. */
export interface UnlistedSpec {
  name: string;
  assetClass: 'private_equity' | 'autres';
  sector: string;
  quantity: number;
  unitCost: number;
  unitValue: number;
  purchasedAt: string;
}

export interface EnvelopeSpec {
  key: string;
  kind: AccountKind;
  label: string;
  institution: string;
  openedAt: string;
  /** Espèces non investies dans l'enveloppe. */
  cash: number;
  holdings: HoldingSpec[];
  unlisted?: UnlistedSpec[];
}

export interface PropertySpec {
  key: string;
  label: string;
  kind: PropertyKind;
  city: string;
  postalCode: string;
  surfaceM2: number;
  purchasePrice: number;
  currentValue: number;
  purchasedAt: string;
  monthlyRent: number;
  monthlyCharges: number;
  annualPropertyTax: number;
  ownershipPct: number;
  debtKey: string | null;
}

export interface DebtSpec {
  key: string;
  label: string;
  kind: DebtKind;
  lender: string;
  initialAmount: number;
  remainingAmount: number;
  annualRatePct: number;
  insuranceRatePct: number;
  monthlyPayment: number;
  startedAt: string;
  endsAt: string;
}

export interface GoalSpec {
  key: string;
  kind: GoalKind;
  label: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate: string;
  priority: GoalPriority;
  notes?: string;
}

export interface ClientSpec {
  id: string;
  firmId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  city: string;
  postalCode: string;
  profession: string;
  maritalStatus: MaritalStatus;
  matrimonialRegime: MatrimonialRegime;
  dependents: number;
  riskProfile: RiskProfile;
  status: ClientStatus;
  horizonYears: number;
  annualIncome: number;
  annualExpenses: number;
  taxBracketRate: number;
  /** Premier identifiant = conseiller principal. */
  advisorIds: string[];
  createdAt: string;
  /** Ancienneté de l'actualisation du profil investisseur, en mois. */
  profileAgeMonths: number;
  lastReviewMonthsAgo: number | null;
  avatarColor: string;
  notes: string | null;
  envelopes: EnvelopeSpec[];
  properties: PropertySpec[];
  debts: DebtSpec[];
  goals: GoalSpec[];
}

const T = 'user-advisor-thomas';
const L = 'user-advisor-laura';
const N = 'user-advisor-meridien';

export const CLIENT_SPECS: ClientSpec[] = [
  {
    id: 'client-dupont',
    firmId: 'firm-horizon',
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@exemple.demo',
    phone: '06 12 45 78 90',
    birthDate: '1972-05-14',
    city: 'Versailles',
    postalCode: '78000',
    profession: 'Directeur commercial',
    maritalStatus: 'marie',
    matrimonialRegime: 'communaute_reduite',
    dependents: 2,
    riskProfile: 'equilibre',
    status: 'actif',
    horizonYears: 12,
    annualIncome: 142000,
    annualExpenses: 78000,
    taxBracketRate: 41,
    advisorIds: [T, L],
    createdAt: '2020-02-18',
    profileAgeMonths: 9,
    lastReviewMonthsAgo: 7,
    avatarColor: '#2bbf95',
    notes: "Souhaite préparer la retraite et financer les études des enfants. Vend une participation en 2025, d'où la trésorerie élevée.",
    envelopes: [
      {
        key: 'cc',
        kind: 'compte_courant',
        label: 'Compte courant',
        institution: 'Banque Lafayette',
        openedAt: '2005-06-01',
        cash: 24000,
        holdings: [],
      },
      {
        key: 'livret',
        kind: 'livret',
        label: 'Livret A + LDDS',
        institution: 'Banque Lafayette',
        openedAt: '2005-06-01',
        cash: 34950,
        holdings: [],
      },
      {
        key: 'attente',
        kind: 'compte_courant',
        label: 'Compte de dépôt — produit de cession',
        institution: 'Banque Lafayette',
        openedAt: '2025-01-15',
        cash: 186000,
        holdings: [],
      },
      {
        key: 'pea',
        kind: 'pea',
        label: 'PEA',
        institution: 'Bourse Directe',
        openedAt: '2014-03-11',
        cash: 3200,
        holdings: [
          ['CW8.PA', 210, 388.4, '2019-05-20'],
          ['MC.PA', 85, 498.0, '2020-11-03'],
          ['OR.PA', 60, 298.2, '2019-09-12'],
          ['SU.PA', 120, 132.6, '2018-07-02'],
        ],
      },
      {
        key: 'av',
        kind: 'assurance_vie',
        label: 'Assurance-vie Multisupport',
        institution: 'Assur Patrimoine',
        openedAt: '2011-04-22',
        cash: 42000,
        holdings: [
          ['IWDA.AS', 480, 72.1, '2018-02-14'],
          ['AGGH.MI', 12500, 5.02, '2021-06-30'],
        ],
      },
    ],
    properties: [
      {
        key: 'rp',
        label: 'Maison familiale',
        kind: 'residence_principale',
        city: 'Versailles',
        postalCode: '78000',
        surfaceM2: 165,
        purchasePrice: 620000,
        currentValue: 742000,
        purchasedAt: '2011-09-30',
        monthlyRent: 0,
        monthlyCharges: 290,
        annualPropertyTax: 2380,
        ownershipPct: 100,
        debtKey: 'pret-rp',
      },
      {
        key: 'locatif',
        label: 'Appartement T2 locatif',
        kind: 'locatif',
        city: 'Rennes',
        postalCode: '35000',
        surfaceM2: 44,
        purchasePrice: 168000,
        currentValue: 196000,
        purchasedAt: '2017-06-15',
        monthlyRent: 720,
        monthlyCharges: 145,
        annualPropertyTax: 890,
        ownershipPct: 100,
        debtKey: 'pret-locatif',
      },
    ],
    debts: [
      {
        key: 'pret-rp',
        label: 'Crédit résidence principale',
        kind: 'credit_immobilier',
        lender: 'Banque Lafayette',
        initialAmount: 480000,
        remainingAmount: 218000,
        annualRatePct: 1.65,
        insuranceRatePct: 0.28,
        monthlyPayment: 2180,
        startedAt: '2011-09-30',
        endsAt: '2031-09-30',
      },
      {
        key: 'pret-locatif',
        label: 'Crédit investissement locatif',
        kind: 'credit_immobilier',
        lender: 'Crédit de l’Ouest',
        initialAmount: 150000,
        remainingAmount: 96500,
        annualRatePct: 1.45,
        insuranceRatePct: 0.25,
        monthlyPayment: 690,
        startedAt: '2017-06-15',
        endsAt: '2037-06-15',
      },
    ],
    goals: [
      {
        key: 'retraite',
        kind: 'retraite',
        label: 'Compléter mes revenus à la retraite',
        targetAmount: 600000,
        currentAmount: 318000,
        monthlyContribution: 900,
        targetDate: '2037-06-30',
        priority: 'haute',
        notes: 'Objectif : 1 800 € de revenus complémentaires mensuels.',
      },
      {
        key: 'etudes',
        kind: 'etudes_enfants',
        label: 'Études des deux enfants',
        targetAmount: 120000,
        currentAmount: 38000,
        monthlyContribution: 350,
        targetDate: '2031-09-01',
        priority: 'haute',
      },
    ],
  },
  {
    id: 'client-martin-claire',
    firmId: 'firm-horizon',
    firstName: 'Claire',
    lastName: 'Leroy',
    email: 'claire.leroy@exemple.demo',
    phone: '06 78 90 12 34',
    birthDate: '1985-11-02',
    city: 'Paris',
    postalCode: '75011',
    profession: 'Chirurgienne-dentiste',
    maritalStatus: 'pacse',
    matrimonialRegime: 'separation_biens',
    dependents: 1,
    riskProfile: 'dynamique',
    status: 'actif',
    horizonYears: 20,
    annualIncome: 168000,
    annualExpenses: 92000,
    taxBracketRate: 41,
    advisorIds: [T],
    createdAt: '2021-05-04',
    profileAgeMonths: 31,
    lastReviewMonthsAgo: 14,
    avatarColor: '#4152ab',
    notes: "Profil investisseur non actualisé depuis plus de deux ans.",
    envelopes: [
      {
        key: 'cc',
        kind: 'compte_courant',
        label: 'Compte courant',
        institution: 'Néo Banque Pro',
        openedAt: '2013-01-10',
        cash: 18500,
        holdings: [],
      },
      {
        key: 'livret',
        kind: 'livret',
        label: 'Livret A',
        institution: 'Néo Banque Pro',
        openedAt: '2013-01-10',
        cash: 22950,
        holdings: [],
      },
      {
        key: 'ct',
        kind: 'compte_titres',
        label: 'Compte-titres ordinaire',
        institution: 'Trade Republic',
        openedAt: '2019-02-08',
        cash: 5400,
        holdings: [
          ['AAPL', 180, 141.2, '2019-08-05'],
          ['MSFT', 95, 232.6, '2020-04-17'],
          ['NVDA', 260, 42.8, '2021-03-22'],
          ['GOOGL', 120, 108.4, '2022-10-11'],
          ['ASML', 22, 520.0, '2022-06-14'],
        ],
      },
      {
        key: 'pea',
        kind: 'pea',
        label: 'PEA',
        institution: 'Bourse Directe',
        openedAt: '2018-09-19',
        cash: 2100,
        holdings: [
          ['PE500.PA', 1450, 26.4, '2020-01-15'],
          ['AIR.PA', 140, 96.5, '2021-02-09'],
        ],
      },
      {
        key: 'per',
        kind: 'per',
        label: 'PER individuel',
        institution: 'Assur Patrimoine',
        openedAt: '2021-12-01',
        cash: 1800,
        holdings: [['CW8.PA', 95, 432.0, '2022-01-20']],
      },
    ],
    properties: [
      {
        key: 'rp',
        label: 'Appartement Haussmannien',
        kind: 'residence_principale',
        city: 'Paris',
        postalCode: '75011',
        surfaceM2: 92,
        purchasePrice: 845000,
        currentValue: 910000,
        purchasedAt: '2018-04-12',
        monthlyRent: 0,
        monthlyCharges: 410,
        annualPropertyTax: 1980,
        ownershipPct: 100,
        debtKey: 'pret-rp',
      },
    ],
    debts: [
      {
        key: 'pret-rp',
        label: 'Crédit résidence principale',
        kind: 'credit_immobilier',
        lender: 'Banque Lafayette',
        initialAmount: 680000,
        remainingAmount: 472000,
        annualRatePct: 1.9,
        insuranceRatePct: 0.22,
        monthlyPayment: 3120,
        startedAt: '2018-04-12',
        endsAt: '2043-04-12',
      },
      {
        key: 'pro',
        label: 'Crédit matériel cabinet dentaire',
        kind: 'autre',
        lender: 'Crédit de l’Ouest',
        initialAmount: 90000,
        remainingAmount: 41000,
        annualRatePct: 2.8,
        insuranceRatePct: 0.2,
        monthlyPayment: 1210,
        startedAt: '2021-03-01',
        endsAt: '2028-03-01',
      },
    ],
    goals: [
      {
        key: 'immo',
        kind: 'achat_immobilier',
        label: 'Résidence secondaire en Bretagne',
        targetAmount: 350000,
        currentAmount: 84000,
        monthlyContribution: 700,
        targetDate: '2032-06-30',
        priority: 'moyenne',
      },
      {
        key: 'retraite',
        kind: 'retraite',
        label: 'Retraite à 62 ans',
        targetAmount: 900000,
        currentAmount: 246000,
        monthlyContribution: 1200,
        targetDate: '2047-11-02',
        priority: 'haute',
      },
    ],
  },
  {
    id: 'client-garnier',
    firmId: 'firm-horizon',
    firstName: 'Thomas',
    lastName: 'Garnier',
    email: 'thomas.garnier@exemple.demo',
    phone: '06 34 56 78 12',
    birthDate: '1968-02-21',
    city: 'Bordeaux',
    postalCode: '33000',
    profession: 'Pharmacien titulaire',
    maritalStatus: 'marie',
    matrimonialRegime: 'communaute_reduite',
    dependents: 3,
    riskProfile: 'prudent',
    status: 'actif',
    horizonYears: 10,
    annualIncome: 128000,
    annualExpenses: 71000,
    taxBracketRate: 41,
    advisorIds: [T],
    createdAt: '2019-11-08',
    profileAgeMonths: 5,
    lastReviewMonthsAgo: 4,
    avatarColor: '#b5741a',
    notes: 'Patrimoine très largement immobilier, construit par acquisitions successives.',
    envelopes: [
      { key: 'cc', kind: 'compte_courant', label: 'Compte courant', institution: 'Banque du Sud-Ouest', openedAt: '2001-04-02', cash: 12400, holdings: [] },
      { key: 'livret', kind: 'livret', label: 'Livret A', institution: 'Banque du Sud-Ouest', openedAt: '2001-04-02', cash: 22950, holdings: [] },
      {
        key: 'av',
        kind: 'assurance_vie',
        label: 'Assurance-vie Sérénité',
        institution: 'Assur Patrimoine',
        openedAt: '2013-05-17',
        cash: 38000,
        holdings: [['AGGH.MI', 9800, 5.1, '2019-03-04'], ['CAC.PA', 320, 61.2, '2020-09-15']],
      },
    ],
    properties: [
      { key: 'rp', label: 'Maison de ville', kind: 'residence_principale', city: 'Bordeaux', postalCode: '33000', surfaceM2: 178, purchasePrice: 540000, currentValue: 685000, purchasedAt: '2008-07-18', monthlyRent: 0, monthlyCharges: 240, annualPropertyTax: 2140, ownershipPct: 100, debtKey: null },
      { key: 'loc1', label: 'Immeuble de rapport', kind: 'locatif', city: 'Bordeaux', postalCode: '33800', surfaceM2: 240, purchasePrice: 520000, currentValue: 620000, purchasedAt: '2015-03-25', monthlyRent: 3100, monthlyCharges: 520, annualPropertyTax: 3400, ownershipPct: 100, debtKey: 'pret-loc1' },
      { key: 'loc2', label: 'Studio étudiant', kind: 'locatif', city: 'Talence', postalCode: '33400', surfaceM2: 24, purchasePrice: 96000, currentValue: 118000, purchasedAt: '2018-09-12', monthlyRent: 480, monthlyCharges: 95, annualPropertyTax: 620, ownershipPct: 100, debtKey: 'pret-loc2' },
      { key: 'scpi', label: 'Parts de SCPI Rendement Europe', kind: 'scpi', city: 'Paris', postalCode: '75008', surfaceM2: 0, purchasePrice: 140000, currentValue: 134000, purchasedAt: '2021-01-20', monthlyRent: 520, monthlyCharges: 0, annualPropertyTax: 0, ownershipPct: 100, debtKey: null },
    ],
    debts: [
      { key: 'pret-loc1', label: 'Crédit immeuble de rapport', kind: 'credit_immobilier', lender: 'Banque du Sud-Ouest', initialAmount: 430000, remainingAmount: 268000, annualRatePct: 1.75, insuranceRatePct: 0.3, monthlyPayment: 2150, startedAt: '2015-03-25', endsAt: '2035-03-25' },
      { key: 'pret-loc2', label: 'Crédit studio', kind: 'credit_immobilier', lender: 'Crédit de l’Ouest', initialAmount: 80000, remainingAmount: 52000, annualRatePct: 1.55, insuranceRatePct: 0.26, monthlyPayment: 390, startedAt: '2018-09-12', endsAt: '2038-09-12' },
    ],
    goals: [
      { key: 'transmission', kind: 'transmission', label: 'Transmettre aux trois enfants', targetAmount: 900000, currentAmount: 620000, monthlyContribution: 400, targetDate: '2038-02-21', priority: 'haute' },
      { key: 'retraite', kind: 'retraite', label: 'Revenus complémentaires retraite', targetAmount: 450000, currentAmount: 186000, monthlyContribution: 600, targetDate: '2033-02-21', priority: 'moyenne' },
    ],
  },
  {
    id: 'client-bernard',
    firmId: 'firm-horizon',
    firstName: 'Sophie',
    lastName: 'Bernard',
    email: 'sophie.bernard@exemple.demo',
    phone: '07 61 23 45 67',
    birthDate: '1990-08-30',
    city: 'Lyon',
    postalCode: '69006',
    profession: 'Directrice produit',
    maritalStatus: 'celibataire',
    matrimonialRegime: 'non_applicable',
    dependents: 0,
    riskProfile: 'offensif',
    status: 'actif',
    horizonYears: 25,
    annualIncome: 112000,
    annualExpenses: 54000,
    taxBracketRate: 41,
    advisorIds: [L],
    createdAt: '2022-01-17',
    profileAgeMonths: 11,
    lastReviewMonthsAgo: 6,
    avatarColor: '#d1344b',
    notes: 'Portefeuille très concentré sur la technologie américaine.',
    envelopes: [
      { key: 'cc', kind: 'compte_courant', label: 'Compte courant', institution: 'Néo Banque Pro', openedAt: '2014-09-01', cash: 9800, holdings: [] },
      { key: 'livret', kind: 'livret', label: 'Livret A', institution: 'Néo Banque Pro', openedAt: '2014-09-01', cash: 12000, holdings: [] },
      {
        key: 'ct',
        kind: 'compte_titres',
        label: 'Compte-titres',
        institution: 'Interactive Brokers',
        openedAt: '2020-06-10',
        cash: 4200,
        holdings: [
          ['NVDA', 620, 38.4, '2020-11-02'],
          ['AAPL', 210, 124.8, '2020-08-19'],
          ['MSFT', 130, 214.5, '2020-09-30'],
          ['AMZN', 90, 152.3, '2022-05-16'],
        ],
      },
      {
        key: 'pea',
        kind: 'pea',
        label: 'PEA',
        institution: 'Bourse Directe',
        openedAt: '2021-03-05',
        cash: 1500,
        holdings: [['PE500.PA', 720, 30.1, '2021-03-20'], ['SAP', 55, 118.4, '2021-11-08']],
      },
      { key: 'crypto', kind: 'crypto', label: 'Portefeuille crypto', institution: 'Plateforme régulée PSAN', openedAt: '2021-02-11', cash: 800, holdings: [['ETH-EUR', 4.2, 1620, '2021-04-03']] },
    ],
    properties: [],
    debts: [],
    goals: [
      { key: 'immo', kind: 'achat_immobilier', label: 'Achat de ma résidence principale', targetAmount: 180000, currentAmount: 62000, monthlyContribution: 1400, targetDate: '2029-06-30', priority: 'haute', notes: 'Apport visé pour un bien à Lyon.' },
      { key: 'precaution', kind: 'epargne_precaution', label: 'Épargne de précaution', targetAmount: 30000, currentAmount: 21800, monthlyContribution: 200, targetDate: '2027-12-31', priority: 'moyenne' },
    ],
  },
  {
    id: 'client-moreau',
    firmId: 'firm-horizon',
    firstName: 'Antoine',
    lastName: 'Moreau',
    email: 'antoine.moreau@exemple.demo',
    phone: '06 45 67 89 01',
    birthDate: '1979-04-09',
    city: 'Nantes',
    postalCode: '44000',
    profession: 'Architecte',
    maritalStatus: 'marie',
    matrimonialRegime: 'separation_biens',
    dependents: 2,
    riskProfile: 'equilibre',
    status: 'actif',
    horizonYears: 15,
    annualIncome: 96000,
    annualExpenses: 68000,
    taxBracketRate: 30,
    advisorIds: [L, T],
    createdAt: '2020-10-22',
    profileAgeMonths: 14,
    lastReviewMonthsAgo: 11,
    avatarColor: '#2f5fd0',
    notes: 'Charge de remboursement élevée rapportée aux revenus.',
    envelopes: [
      { key: 'cc', kind: 'compte_courant', label: 'Compte courant', institution: 'Banque de l’Atlantique', openedAt: '2009-02-14', cash: 6200, holdings: [] },
      { key: 'livret', kind: 'livret', label: 'Livret A', institution: 'Banque de l’Atlantique', openedAt: '2009-02-14', cash: 9400, holdings: [] },
      { key: 'av', kind: 'assurance_vie', label: 'Assurance-vie Horizon', institution: 'Assur Patrimoine', openedAt: '2016-07-04', cash: 11000, holdings: [['IWDA.AS', 145, 78.4, '2019-10-21'], ['AGGH.MI', 4200, 5.06, '2021-02-18']] },
      { key: 'pea', kind: 'pea', label: 'PEA', institution: 'Bourse Directe', openedAt: '2017-05-30', cash: 900, holdings: [['CW8.PA', 42, 402.6, '2020-07-08'], ['TTE.PA', 260, 44.2, '2021-05-12']] },
    ],
    properties: [
      { key: 'rp', label: 'Maison contemporaine', kind: 'residence_principale', city: 'Nantes', postalCode: '44000', surfaceM2: 142, purchasePrice: 498000, currentValue: 532000, purchasedAt: '2019-06-28', monthlyRent: 0, monthlyCharges: 210, annualPropertyTax: 1720, ownershipPct: 100, debtKey: 'pret-rp' },
      { key: 'loc', label: 'Appartement T3', kind: 'locatif', city: 'Saint-Nazaire', postalCode: '44600', surfaceM2: 62, purchasePrice: 185000, currentValue: 192000, purchasedAt: '2021-11-05', monthlyRent: 690, monthlyCharges: 160, annualPropertyTax: 940, ownershipPct: 100, debtKey: 'pret-loc' },
    ],
    debts: [
      { key: 'pret-rp', label: 'Crédit résidence principale', kind: 'credit_immobilier', lender: 'Banque de l’Atlantique', initialAmount: 420000, remainingAmount: 352000, annualRatePct: 1.35, insuranceRatePct: 0.24, monthlyPayment: 1780, startedAt: '2019-06-28', endsAt: '2044-06-28' },
      { key: 'pret-loc', label: 'Crédit locatif', kind: 'credit_immobilier', lender: 'Crédit de l’Ouest', initialAmount: 175000, remainingAmount: 158000, annualRatePct: 3.45, insuranceRatePct: 0.28, monthlyPayment: 980, startedAt: '2021-11-05', endsAt: '2046-11-05' },
      { key: 'auto', label: 'Crédit automobile', kind: 'credit_consommation', lender: 'Crédit Express', initialAmount: 32000, remainingAmount: 18600, annualRatePct: 4.9, insuranceRatePct: 0, monthlyPayment: 520, startedAt: '2023-03-10', endsAt: '2029-03-10' },
    ],
    goals: [
      { key: 'retraite', kind: 'retraite', label: 'Préparer la retraite', targetAmount: 500000, currentAmount: 92000, monthlyContribution: 250, targetDate: '2044-04-09', priority: 'moyenne' },
      { key: 'travaux', kind: 'autre', label: 'Rénovation énergétique du locatif', targetAmount: 45000, currentAmount: 8000, monthlyContribution: 200, targetDate: '2028-09-30', priority: 'basse' },
    ],
  },
  {
    id: 'client-petit',
    firmId: 'firm-horizon',
    firstName: 'Isabelle',
    lastName: 'Petit',
    email: 'isabelle.petit@exemple.demo',
    phone: '06 22 33 44 55',
    birthDate: '1964-12-05',
    city: 'Strasbourg',
    postalCode: '67000',
    profession: 'Cadre de santé',
    maritalStatus: 'divorce',
    matrimonialRegime: 'non_applicable',
    dependents: 0,
    riskProfile: 'prudent',
    status: 'actif',
    horizonYears: 3,
    annualIncome: 68000,
    annualExpenses: 44000,
    taxBracketRate: 30,
    advisorIds: [T],
    createdAt: '2018-06-11',
    profileAgeMonths: 7,
    lastReviewMonthsAgo: 3,
    avatarColor: '#8d9cdd',
    notes: 'Départ à la retraite envisagé dans trois ans : sensibilité forte au risque de marché.',
    envelopes: [
      { key: 'cc', kind: 'compte_courant', label: 'Compte courant', institution: 'Banque Rhénane', openedAt: '2000-01-05', cash: 8600, holdings: [] },
      { key: 'livret', kind: 'livret', label: 'Livret A + LEP', institution: 'Banque Rhénane', openedAt: '2000-01-05', cash: 18500, holdings: [] },
      {
        key: 'av',
        kind: 'assurance_vie',
        label: 'Assurance-vie Patrimoine Plus',
        institution: 'Assur Patrimoine',
        openedAt: '2009-03-19',
        cash: 9000,
        holdings: [['IWDA.AS', 1450, 62.4, '2015-06-10'], ['EMIM.AS', 1200, 29.8, '2018-04-22'], ['AGGH.MI', 3000, 5.2, '2022-01-14']],
      },
      { key: 'per', kind: 'per', label: 'PER', institution: 'Assur Patrimoine', openedAt: '2020-11-02', cash: 2200, holdings: [['CW8.PA', 62, 448.0, '2021-01-11']] },
    ],
    properties: [
      { key: 'rp', label: 'Appartement centre-ville', kind: 'residence_principale', city: 'Strasbourg', postalCode: '67000', surfaceM2: 78, purchasePrice: 268000, currentValue: 312000, purchasedAt: '2012-05-14', monthlyRent: 0, monthlyCharges: 220, annualPropertyTax: 1240, ownershipPct: 100, debtKey: null },
    ],
    debts: [],
    goals: [
      { key: 'retraite', kind: 'retraite', label: 'Sécuriser mes revenus de retraite', targetAmount: 320000, currentAmount: 248000, monthlyContribution: 500, targetDate: '2029-01-31', priority: 'haute' },
      { key: 'voyage', kind: 'voyage', label: 'Tour du monde au départ à la retraite', targetAmount: 40000, currentAmount: 14000, monthlyContribution: 300, targetDate: '2029-06-30', priority: 'basse' },
    ],
  },
  {
    id: 'client-girard',
    firmId: 'firm-horizon',
    firstName: 'Nicolas',
    lastName: 'Girard',
    email: 'nicolas.girard@exemple.demo',
    phone: '07 88 99 00 11',
    birthDate: '1987-07-19',
    city: 'Toulouse',
    postalCode: '31000',
    profession: 'Ingénieur aéronautique',
    maritalStatus: 'marie',
    matrimonialRegime: 'communaute_reduite',
    dependents: 1,
    riskProfile: 'dynamique',
    status: 'actif',
    horizonYears: 22,
    annualIncome: 86000,
    annualExpenses: 52000,
    taxBracketRate: 30,
    advisorIds: [L],
    createdAt: '2021-09-30',
    profileAgeMonths: 8,
    lastReviewMonthsAgo: 5,
    avatarColor: '#00a97f',
    notes: 'Exposition crypto significative, à surveiller au regard du profil déclaré.',
    envelopes: [
      { key: 'cc', kind: 'compte_courant', label: 'Compte courant', institution: 'Banque Occitane', openedAt: '2011-08-23', cash: 7400, holdings: [] },
      { key: 'livret', kind: 'livret', label: 'Livret A', institution: 'Banque Occitane', openedAt: '2011-08-23', cash: 15300, holdings: [] },
      { key: 'pea', kind: 'pea', label: 'PEA', institution: 'Bourse Directe', openedAt: '2019-04-17', cash: 2600, holdings: [['CW8.PA', 78, 412.0, '2020-03-24'], ['AIR.PA', 95, 88.6, '2020-10-12'], ['SU.PA', 45, 148.2, '2022-02-07']] },
      { key: 'crypto', kind: 'crypto', label: 'Portefeuille crypto', institution: 'Plateforme régulée PSAN', openedAt: '2020-12-04', cash: 600, holdings: [['BTC-EUR', 1.35, 18400, '2021-01-18'], ['ETH-EUR', 9.5, 1240, '2021-02-02']] },
      { key: 'av', kind: 'assurance_vie', label: 'Assurance-vie Dynamique', institution: 'Assur Patrimoine', openedAt: '2022-03-15', cash: 4800, holdings: [['ESE.PA', 620, 21.4, '2022-04-01']] },
    ],
    properties: [
      { key: 'rp', label: 'Maison avec jardin', kind: 'residence_principale', city: 'Toulouse', postalCode: '31200', surfaceM2: 118, purchasePrice: 342000, currentValue: 378000, purchasedAt: '2019-09-05', monthlyRent: 0, monthlyCharges: 165, annualPropertyTax: 1380, ownershipPct: 100, debtKey: 'pret-rp' },
    ],
    debts: [
      { key: 'pret-rp', label: 'Crédit résidence principale', kind: 'credit_immobilier', lender: 'Banque Occitane', initialAmount: 290000, remainingAmount: 226000, annualRatePct: 1.25, insuranceRatePct: 0.22, monthlyPayment: 1190, startedAt: '2019-09-05', endsAt: '2044-09-05' },
    ],
    goals: [
      { key: 'retraite', kind: 'retraite', label: 'Indépendance financière à 60 ans', targetAmount: 750000, currentAmount: 142000, monthlyContribution: 950, targetDate: '2047-07-19', priority: 'haute' },
      { key: 'etudes', kind: 'etudes_enfants', label: 'Études de mon fils', targetAmount: 60000, currentAmount: 9500, monthlyContribution: 220, targetDate: '2036-09-01', priority: 'moyenne' },
    ],
  },
  {
    id: 'client-rousseau',
    firmId: 'firm-horizon',
    firstName: 'Camille',
    lastName: 'Rousseau',
    email: 'camille.rousseau@exemple.demo',
    phone: '06 55 44 33 22',
    birthDate: '1981-03-27',
    city: 'Lille',
    postalCode: '59000',
    profession: 'Notaire associée',
    maritalStatus: 'marie',
    matrimonialRegime: 'participation_acquets',
    dependents: 2,
    riskProfile: 'equilibre',
    status: 'actif',
    horizonYears: 18,
    annualIncome: 185000,
    annualExpenses: 98000,
    taxBracketRate: 41,
    advisorIds: [T, L],
    createdAt: '2019-01-28',
    profileAgeMonths: 4,
    lastReviewMonthsAgo: 2,
    avatarColor: '#008b68',
    notes: 'Allocation équilibrée et régulièrement arbitrée.',
    envelopes: [
      { key: 'cc', kind: 'compte_courant', label: 'Compte courant', institution: 'Banque du Nord', openedAt: '2006-11-13', cash: 16800, holdings: [] },
      { key: 'livret', kind: 'livret', label: 'Livret A + LDDS', institution: 'Banque du Nord', openedAt: '2006-11-13', cash: 34950, holdings: [] },
      {
        key: 'av',
        kind: 'assurance_vie',
        label: 'Assurance-vie Architecture',
        institution: 'Assur Patrimoine',
        openedAt: '2012-02-08',
        cash: 26000,
        holdings: [['IWDA.AS', 1250, 68.2, '2016-05-19'], ['AGGH.MI', 22000, 5.14, '2020-03-02'], ['EMIM.AS', 1800, 28.9, '2019-07-25']],
      },
      { key: 'pea', kind: 'pea', label: 'PEA', institution: 'Bourse Directe', openedAt: '2013-10-04', cash: 4100, holdings: [['CW8.PA', 165, 356.4, '2017-04-11'], ['OR.PA', 48, 246.8, '2018-01-22'], ['SAN.PA', 190, 78.4, '2019-11-14'], ['BNP.PA', 240, 48.6, '2021-06-09']] },
      { key: 'per', kind: 'per', label: 'PER individuel', institution: 'Assur Patrimoine', openedAt: '2020-01-15', cash: 3400, holdings: [['ESE.PA', 980, 19.8, '2020-02-03']] },
      { key: 'ct', kind: 'compte_titres', label: 'Compte-titres', institution: 'Bourse Directe', openedAt: '2018-03-12', cash: 2800, holdings: [['SGLD.L', 140, 168.5, '2020-08-06'], ['JNJ', 85, 138.4, '2019-05-28']] },
    ],
    properties: [
      { key: 'rp', label: 'Maison de maître', kind: 'residence_principale', city: 'Lille', postalCode: '59000', surfaceM2: 196, purchasePrice: 610000, currentValue: 688000, purchasedAt: '2014-08-21', monthlyRent: 0, monthlyCharges: 320, annualPropertyTax: 2560, ownershipPct: 100, debtKey: 'pret-rp' },
      { key: 'scpi', label: 'Parts de SCPI Bureaux Europe', kind: 'scpi', city: 'Paris', postalCode: '75009', surfaceM2: 0, purchasePrice: 92000, currentValue: 88500, purchasedAt: '2020-06-18', monthlyRent: 340, monthlyCharges: 0, annualPropertyTax: 0, ownershipPct: 100, debtKey: null },
    ],
    debts: [
      { key: 'pret-rp', label: 'Crédit résidence principale', kind: 'credit_immobilier', lender: 'Banque du Nord', initialAmount: 450000, remainingAmount: 196000, annualRatePct: 1.55, insuranceRatePct: 0.24, monthlyPayment: 2260, startedAt: '2014-08-21', endsAt: '2034-08-21' },
    ],
    goals: [
      { key: 'retraite', kind: 'retraite', label: 'Retraite à 63 ans', targetAmount: 850000, currentAmount: 412000, monthlyContribution: 1600, targetDate: '2044-03-27', priority: 'haute' },
      { key: 'etudes', kind: 'etudes_enfants', label: 'Études des enfants', targetAmount: 140000, currentAmount: 68000, monthlyContribution: 500, targetDate: '2032-09-01', priority: 'moyenne' },
      { key: 'transmission', kind: 'transmission', label: 'Organiser la transmission', targetAmount: 400000, currentAmount: 210000, monthlyContribution: 300, targetDate: '2040-12-31', priority: 'basse' },
    ],
  },
  {
    id: 'client-lambert',
    firmId: 'firm-horizon',
    firstName: 'Philippe',
    lastName: 'Lambert',
    email: 'philippe.lambert@exemple.demo',
    phone: '06 77 66 55 44',
    birthDate: '1975-09-12',
    city: 'Aix-en-Provence',
    postalCode: '13100',
    profession: "Chef d'entreprise",
    maritalStatus: 'marie',
    matrimonialRegime: 'separation_biens',
    dependents: 2,
    riskProfile: 'offensif',
    status: 'actif',
    horizonYears: 16,
    annualIncome: 260000,
    annualExpenses: 132000,
    taxBracketRate: 45,
    advisorIds: [T],
    createdAt: '2018-03-14',
    profileAgeMonths: 6,
    lastReviewMonthsAgo: 5,
    avatarColor: '#1a2250',
    notes: 'Part importante en actifs non cotés liés à son secteur professionnel.',
    envelopes: [
      { key: 'cc', kind: 'compte_courant', label: 'Compte courant', institution: 'Banque Méditerranée', openedAt: '2003-05-06', cash: 42000, holdings: [] },
      { key: 'livret', kind: 'livret', label: 'Livret A', institution: 'Banque Méditerranée', openedAt: '2003-05-06', cash: 22950, holdings: [] },
      { key: 'ct', kind: 'compte_titres', label: 'Compte-titres', institution: 'Interactive Brokers', openedAt: '2016-09-20', cash: 12600, holdings: [['MSFT', 160, 198.4, '2019-01-14'], ['ASML', 48, 402.0, '2020-05-11'], ['KO', 380, 48.2, '2018-11-26'], ['SGLD.L', 220, 152.8, '2019-09-17']] },
      { key: 'pea', kind: 'pea', label: 'PEA', institution: 'Bourse Directe', openedAt: '2012-01-09', cash: 8400, holdings: [['MC.PA', 120, 412.6, '2019-03-18'], ['SU.PA', 210, 112.4, '2018-06-25'], ['CW8.PA', 185, 368.2, '2017-10-30']] },
      {
        key: 'pe',
        kind: 'private_equity',
        label: 'Participations non cotées',
        institution: 'Holding personnelle',
        openedAt: '2016-04-01',
        cash: 0,
        holdings: [],
        unlisted: [
          { name: 'Participation SAS Logistique Sud', assetClass: 'private_equity', sector: 'Logistique', quantity: 1, unitCost: 240000, unitValue: 395000, purchasedAt: '2016-04-01' },
          { name: 'Fonds de private equity Sélection III', assetClass: 'private_equity', sector: 'Capital-développement', quantity: 1, unitCost: 150000, unitValue: 184000, purchasedAt: '2019-11-12' },
        ],
      },
    ],
    properties: [
      { key: 'rp', label: 'Villa provençale', kind: 'residence_principale', city: 'Aix-en-Provence', postalCode: '13100', surfaceM2: 240, purchasePrice: 980000, currentValue: 1150000, purchasedAt: '2013-06-11', monthlyRent: 0, monthlyCharges: 480, annualPropertyTax: 4200, ownershipPct: 100, debtKey: 'pret-rp' },
      { key: 'rs', label: 'Appartement vue mer', kind: 'residence_secondaire', city: 'Cassis', postalCode: '13260', surfaceM2: 68, purchasePrice: 420000, currentValue: 496000, purchasedAt: '2019-07-22', monthlyRent: 0, monthlyCharges: 290, annualPropertyTax: 1860, ownershipPct: 50, debtKey: null },
    ],
    debts: [
      { key: 'pret-rp', label: 'Crédit villa', kind: 'credit_immobilier', lender: 'Banque Méditerranée', initialAmount: 700000, remainingAmount: 318000, annualRatePct: 1.85, insuranceRatePct: 0.3, monthlyPayment: 3480, startedAt: '2013-06-11', endsAt: '2033-06-11' },
    ],
    goals: [
      { key: 'transmission', kind: 'transmission', label: 'Transmission de la holding', targetAmount: 1200000, currentAmount: 579000, monthlyContribution: 0, targetDate: '2041-09-12', priority: 'haute' },
      { key: 'entreprise', kind: 'creation_entreprise', label: 'Nouveau projet entrepreneurial', targetAmount: 300000, currentAmount: 118000, monthlyContribution: 2000, targetDate: '2030-01-31', priority: 'moyenne' },
    ],
  },
  {
    id: 'client-fontaine',
    firmId: 'firm-horizon',
    firstName: 'Marie',
    lastName: 'Fontaine',
    email: 'marie.fontaine@exemple.demo',
    phone: '06 10 20 30 40',
    birthDate: '1993-01-16',
    city: 'Montpellier',
    postalCode: '34000',
    profession: 'Enseignante',
    maritalStatus: 'celibataire',
    matrimonialRegime: 'non_applicable',
    dependents: 1,
    riskProfile: 'prudent',
    status: 'actif',
    horizonYears: 20,
    annualIncome: 38000,
    annualExpenses: 31000,
    taxBracketRate: 11,
    advisorIds: [L],
    createdAt: '2023-04-19',
    profileAgeMonths: 10,
    lastReviewMonthsAgo: 9,
    avatarColor: '#59d6b2',
    notes: 'Épargne de précaution insuffisante au regard des dépenses annuelles.',
    envelopes: [
      { key: 'cc', kind: 'compte_courant', label: 'Compte courant', institution: 'Banque du Languedoc', openedAt: '2015-09-08', cash: 1450, holdings: [] },
      { key: 'livret', kind: 'livret', label: 'Livret A', institution: 'Banque du Languedoc', openedAt: '2015-09-08', cash: 2100, holdings: [] },
      { key: 'av', kind: 'assurance_vie', label: 'Assurance-vie Première', institution: 'Assur Patrimoine', openedAt: '2023-05-02', cash: 800, holdings: [['IWDA.AS', 95, 88.4, '2023-06-12']] },
    ],
    properties: [],
    debts: [
      { key: 'conso', label: 'Prêt personnel', kind: 'credit_consommation', lender: 'Crédit Express', initialAmount: 12000, remainingAmount: 7400, annualRatePct: 5.4, insuranceRatePct: 0, monthlyPayment: 235, startedAt: '2023-09-01', endsAt: '2028-09-01' },
    ],
    goals: [
      { key: 'precaution', kind: 'epargne_precaution', label: 'Constituer une épargne de précaution', targetAmount: 12000, currentAmount: 3550, monthlyContribution: 120, targetDate: '2028-12-31', priority: 'haute' },
      { key: 'immo', kind: 'achat_immobilier', label: 'Acheter un appartement', targetAmount: 45000, currentAmount: 8900, monthlyContribution: 180, targetDate: '2034-06-30', priority: 'moyenne' },
    ],
  },
  {
    id: 'client-dubois',
    firmId: 'firm-horizon',
    firstName: 'Émilie',
    lastName: 'Dubois',
    email: 'emilie.dubois@exemple.demo',
    phone: '07 12 34 56 78',
    birthDate: '1989-06-23',
    city: 'Annecy',
    postalCode: '74000',
    profession: 'Consultante indépendante',
    maritalStatus: 'pacse',
    matrimonialRegime: 'separation_biens',
    dependents: 0,
    riskProfile: 'dynamique',
    status: 'actif',
    horizonYears: 21,
    annualIncome: 94000,
    annualExpenses: 48000,
    taxBracketRate: 30,
    advisorIds: [L],
    createdAt: '2022-07-06',
    profileAgeMonths: 13,
    lastReviewMonthsAgo: 8,
    avatarColor: '#6274c8',
    notes: null,
    envelopes: [
      { key: 'cc', kind: 'compte_courant', label: 'Compte courant', institution: 'Néo Banque Pro', openedAt: '2016-02-29', cash: 11200, holdings: [] },
      { key: 'livret', kind: 'livret', label: 'Livret A + LDDS', institution: 'Néo Banque Pro', openedAt: '2016-02-29', cash: 28400, holdings: [] },
      { key: 'pea', kind: 'pea', label: 'PEA', institution: 'Bourse Directe', openedAt: '2020-02-14', cash: 3100, holdings: [['CW8.PA', 96, 396.8, '2020-03-30'], ['PE500.PA', 540, 28.2, '2021-01-25']] },
      { key: 'per', kind: 'per', label: 'PER individuel', institution: 'Assur Patrimoine', openedAt: '2022-09-01', cash: 1600, holdings: [['IWDA.AS', 185, 82.6, '2022-09-20']] },
      { key: 'ct', kind: 'compte_titres', label: 'Compte-titres', institution: 'Trade Republic', openedAt: '2021-06-08', cash: 2400, holdings: [['NVDA', 45, 58.2, '2022-08-11'], ['AMZN', 60, 128.4, '2023-01-19']] },
    ],
    properties: [
      { key: 'loc', label: 'Studio locatif saisonnier', kind: 'locatif', city: 'Chamonix', postalCode: '74400', surfaceM2: 31, purchasePrice: 218000, currentValue: 246000, purchasedAt: '2022-03-18', monthlyRent: 980, monthlyCharges: 240, annualPropertyTax: 1120, ownershipPct: 100, debtKey: 'pret-loc' },
    ],
    debts: [
      { key: 'pret-loc', label: 'Crédit studio Chamonix', kind: 'credit_immobilier', lender: 'Banque des Alpes', initialAmount: 190000, remainingAmount: 172000, annualRatePct: 2.95, insuranceRatePct: 0.26, monthlyPayment: 1020, startedAt: '2022-03-18', endsAt: '2047-03-18' },
    ],
    goals: [
      { key: 'immo', kind: 'achat_immobilier', label: 'Résidence principale à Annecy', targetAmount: 150000, currentAmount: 46000, monthlyContribution: 900, targetDate: '2030-09-30', priority: 'haute' },
      { key: 'retraite', kind: 'retraite', label: 'Retraite indépendante', targetAmount: 600000, currentAmount: 88000, monthlyContribution: 700, targetDate: '2049-06-23', priority: 'moyenne' },
    ],
  },
  {
    id: 'client-mercier',
    firmId: 'firm-horizon',
    firstName: 'Lucas',
    lastName: 'Mercier',
    email: 'lucas.mercier@exemple.demo',
    phone: '06 98 76 54 32',
    birthDate: '1996-10-08',
    city: 'Rennes',
    postalCode: '35000',
    profession: 'Développeur logiciel',
    maritalStatus: 'celibataire',
    matrimonialRegime: 'non_applicable',
    dependents: 0,
    riskProfile: 'dynamique',
    status: 'prospect',
    horizonYears: 28,
    annualIncome: 58000,
    annualExpenses: 32000,
    taxBracketRate: 30,
    advisorIds: [T],
    createdAt: '2025-06-02',
    profileAgeMonths: 2,
    lastReviewMonthsAgo: null,
    avatarColor: '#93e7ce',
    notes: 'Prospect issu du site web. Premier rendez-vous de découverte réalisé.',
    envelopes: [
      { key: 'cc', kind: 'compte_courant', label: 'Compte courant', institution: 'Néo Banque Pro', openedAt: '2018-11-20', cash: 6800, holdings: [] },
      { key: 'livret', kind: 'livret', label: 'Livret A', institution: 'Néo Banque Pro', openedAt: '2018-11-20', cash: 19400, holdings: [] },
      { key: 'ct', kind: 'compte_titres', label: 'Compte-titres', institution: 'Trade Republic', openedAt: '2023-02-10', cash: 900, holdings: [['EUNL.DE', 120, 88.2, '2023-03-06']] },
    ],
    properties: [],
    debts: [],
    goals: [
      { key: 'precaution', kind: 'epargne_precaution', label: 'Sécuriser six mois de dépenses', targetAmount: 18000, currentAmount: 19400, monthlyContribution: 0, targetDate: '2026-12-31', priority: 'moyenne' },
      { key: 'immo', kind: 'achat_immobilier', label: 'Premier achat immobilier', targetAmount: 60000, currentAmount: 11500, monthlyContribution: 600, targetDate: '2031-12-31', priority: 'haute' },
    ],
  },
  {
    id: 'client-noel',
    firmId: 'firm-horizon',
    firstName: 'Gabriel',
    lastName: 'Noël',
    email: 'gabriel.noel@exemple.demo',
    phone: '06 65 43 21 09',
    birthDate: '1958-04-03',
    city: 'Reims',
    postalCode: '51100',
    profession: 'Retraité (ancien cadre bancaire)',
    maritalStatus: 'veuf',
    matrimonialRegime: 'non_applicable',
    dependents: 0,
    riskProfile: 'prudent',
    status: 'actif',
    horizonYears: 5,
    annualIncome: 46000,
    annualExpenses: 38000,
    taxBracketRate: 30,
    advisorIds: [T, L],
    createdAt: '2017-02-09',
    profileAgeMonths: 3,
    lastReviewMonthsAgo: 2,
    avatarColor: '#5a6478',
    notes: 'Priorité donnée à la transmission aux petits-enfants.',
    envelopes: [
      { key: 'cc', kind: 'compte_courant', label: 'Compte courant', institution: 'Banque de Champagne', openedAt: '1995-03-15', cash: 14200, holdings: [] },
      { key: 'livret', kind: 'livret', label: 'Livret A + LDDS', institution: 'Banque de Champagne', openedAt: '1995-03-15', cash: 34950, holdings: [] },
      { key: 'av1', kind: 'assurance_vie', label: 'Assurance-vie Transmission', institution: 'Assur Patrimoine', openedAt: '2002-06-10', cash: 58000, holdings: [['AGGH.MI', 18000, 5.24, '2018-01-08'], ['IBTS.AS', 420, 132.4, '2021-09-14']] },
      { key: 'av2', kind: 'assurance_vie', label: 'Assurance-vie Équilibre', institution: 'Mutuelle Prévoyance', openedAt: '2010-09-27', cash: 21000, holdings: [['IWDA.AS', 380, 71.8, '2016-11-03'], ['CAC.PA', 210, 58.6, '2019-02-26']] },
    ],
    properties: [
      { key: 'rp', label: 'Maison de famille', kind: 'residence_principale', city: 'Reims', postalCode: '51100', surfaceM2: 132, purchasePrice: 248000, currentValue: 358000, purchasedAt: '1998-05-20', monthlyRent: 0, monthlyCharges: 180, annualPropertyTax: 1420, ownershipPct: 100, debtKey: null },
      { key: 'loc', label: 'Appartement loué', kind: 'locatif', city: 'Reims', postalCode: '51100', surfaceM2: 58, purchasePrice: 132000, currentValue: 158000, purchasedAt: '2006-10-11', monthlyRent: 640, monthlyCharges: 130, annualPropertyTax: 780, ownershipPct: 100, debtKey: null },
    ],
    debts: [],
    goals: [
      { key: 'transmission', kind: 'transmission', label: 'Transmettre aux petits-enfants', targetAmount: 300000, currentAmount: 268000, monthlyContribution: 200, targetDate: '2030-04-03', priority: 'haute' },
      { key: 'voyage', kind: 'voyage', label: 'Croisière en famille', targetAmount: 25000, currentAmount: 19000, monthlyContribution: 250, targetDate: '2027-06-30', priority: 'basse' },
    ],
  },
  {
    id: 'client-vidal',
    firmId: 'firm-meridien',
    firstName: 'Sandrine',
    lastName: 'Vidal',
    email: 'sandrine.vidal@exemple.demo',
    phone: '06 31 42 53 64',
    birthDate: '1983-05-11',
    city: 'Grenoble',
    postalCode: '38000',
    profession: 'Responsable R&D',
    maritalStatus: 'marie',
    matrimonialRegime: 'communaute_reduite',
    dependents: 2,
    riskProfile: 'equilibre',
    status: 'actif',
    horizonYears: 17,
    annualIncome: 88000,
    annualExpenses: 56000,
    taxBracketRate: 30,
    advisorIds: [N],
    createdAt: '2022-02-11',
    profileAgeMonths: 6,
    lastReviewMonthsAgo: 4,
    avatarColor: '#2f5fd0',
    notes: 'Cliente du cabinet Méridien Conseil — sert à vérifier le cloisonnement des cabinets.',
    envelopes: [
      { key: 'cc', kind: 'compte_courant', label: 'Compte courant', institution: 'Banque des Alpes', openedAt: '2010-04-19', cash: 9600, holdings: [] },
      { key: 'livret', kind: 'livret', label: 'Livret A', institution: 'Banque des Alpes', openedAt: '2010-04-19', cash: 17800, holdings: [] },
      { key: 'pea', kind: 'pea', label: 'PEA', institution: 'Bourse Directe', openedAt: '2018-06-21', cash: 2200, holdings: [['CW8.PA', 88, 388.0, '2019-01-15'], ['SAN.PA', 130, 82.4, '2020-05-07']] },
    ],
    properties: [
      { key: 'rp', label: 'Appartement familial', kind: 'residence_principale', city: 'Grenoble', postalCode: '38000', surfaceM2: 104, purchasePrice: 312000, currentValue: 338000, purchasedAt: '2017-03-24', monthlyRent: 0, monthlyCharges: 195, annualPropertyTax: 1280, ownershipPct: 100, debtKey: 'pret-rp' },
    ],
    debts: [
      { key: 'pret-rp', label: 'Crédit résidence principale', kind: 'credit_immobilier', lender: 'Banque des Alpes', initialAmount: 260000, remainingAmount: 168000, annualRatePct: 1.4, insuranceRatePct: 0.22, monthlyPayment: 1180, startedAt: '2017-03-24', endsAt: '2039-03-24' },
    ],
    goals: [
      { key: 'retraite', kind: 'retraite', label: 'Retraite à 64 ans', targetAmount: 480000, currentAmount: 96000, monthlyContribution: 600, targetDate: '2047-05-11', priority: 'haute' },
    ],
  },
  {
    id: 'client-roux',
    firmId: 'firm-meridien',
    firstName: 'Olivier',
    lastName: 'Roux',
    email: 'olivier.roux@exemple.demo',
    phone: '06 74 85 96 07',
    birthDate: '1976-12-19',
    city: 'Chambéry',
    postalCode: '73000',
    profession: 'Expert-comptable',
    maritalStatus: 'divorce',
    matrimonialRegime: 'non_applicable',
    dependents: 1,
    riskProfile: 'dynamique',
    status: 'actif',
    horizonYears: 14,
    annualIncome: 104000,
    annualExpenses: 62000,
    taxBracketRate: 41,
    advisorIds: [N],
    createdAt: '2023-01-30',
    profileAgeMonths: 9,
    lastReviewMonthsAgo: 6,
    avatarColor: '#7f8edb',
    notes: 'Client du cabinet Méridien Conseil.',
    envelopes: [
      { key: 'cc', kind: 'compte_courant', label: 'Compte courant', institution: 'Banque des Alpes', openedAt: '2008-09-02', cash: 13400, holdings: [] },
      { key: 'livret', kind: 'livret', label: 'Livret A', institution: 'Banque des Alpes', openedAt: '2008-09-02', cash: 22950, holdings: [] },
      { key: 'ct', kind: 'compte_titres', label: 'Compte-titres', institution: 'Interactive Brokers', openedAt: '2019-11-12', cash: 5600, holdings: [['MSFT', 70, 224.8, '2020-10-09'], ['IWDA.AS', 420, 76.4, '2020-01-23']] },
    ],
    properties: [
      { key: 'rp', label: 'Maison de ville', kind: 'residence_principale', city: 'Chambéry', postalCode: '73000', surfaceM2: 126, purchasePrice: 368000, currentValue: 392000, purchasedAt: '2020-08-14', monthlyRent: 0, monthlyCharges: 210, annualPropertyTax: 1560, ownershipPct: 100, debtKey: 'pret-rp' },
    ],
    debts: [
      { key: 'pret-rp', label: 'Crédit résidence principale', kind: 'credit_immobilier', lender: 'Banque des Alpes', initialAmount: 300000, remainingAmount: 242000, annualRatePct: 1.3, insuranceRatePct: 0.24, monthlyPayment: 1290, startedAt: '2020-08-14', endsAt: '2045-08-14' },
    ],
    goals: [
      { key: 'retraite', kind: 'retraite', label: 'Préparer la retraite', targetAmount: 520000, currentAmount: 124000, monthlyContribution: 800, targetDate: '2041-12-19', priority: 'haute' },
    ],
  },
];
