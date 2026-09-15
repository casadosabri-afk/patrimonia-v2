/**
 * Barèmes fiscaux français — SUPPORT PÉDAGOGIQUE.
 *
 * ⚠️ Ces barèmes sont indicatifs et regroupés ici pour une seule raison : rendre
 * les simulations lisibles et vérifiables. Ils évoluent chaque année et
 * comportent de nombreuses exceptions non modélisées (quotient familial plafonné,
 * décote, abattements spécifiques, prélèvements sociaux différenciés…).
 *
 * PATRIMONIA ne produit jamais de calcul fiscal officiel. Toute sortie de ce
 * module est affichée avec la mention « Simulation pédagogique » et doit être
 * confrontée aux textes en vigueur avant tout usage.
 */

export const TAX_REFERENCE_YEAR = 2024;

export const TAX_SOURCE_NOTICE =
  `Barèmes indicatifs de référence ${TAX_REFERENCE_YEAR}, saisis à des fins pédagogiques. ` +
  'Ils doivent être vérifiés auprès des sources officielles avant toute exploitation.';

export interface Bracket {
  /** Borne basse incluse. */
  from: number;
  /** Borne haute exclue ; `null` pour la dernière tranche. */
  to: number | null;
  rate: number;
}

/** Barème progressif de l'impôt sur le revenu, par part de quotient familial. */
export const INCOME_TAX_BRACKETS: Bracket[] = [
  { from: 0, to: 11294, rate: 0 },
  { from: 11294, to: 28797, rate: 11 },
  { from: 28797, to: 82341, rate: 30 },
  { from: 82341, to: 177106, rate: 41 },
  { from: 177106, to: null, rate: 45 },
];

/** Barème de l'impôt sur la fortune immobilière. */
export const IFI_BRACKETS: Bracket[] = [
  { from: 0, to: 800000, rate: 0 },
  { from: 800000, to: 1300000, rate: 0.5 },
  { from: 1300000, to: 2570000, rate: 0.7 },
  { from: 2570000, to: 5000000, rate: 1 },
  { from: 5000000, to: 10000000, rate: 1.25 },
  { from: 10000000, to: null, rate: 1.5 },
];

/** Seuil d'assujettissement à l'IFI sur le patrimoine immobilier net taxable. */
export const IFI_THRESHOLD = 1300000;

/** Barème des droits de succession et de donation en ligne directe. */
export const DIRECT_LINE_BRACKETS: Bracket[] = [
  { from: 0, to: 8072, rate: 5 },
  { from: 8072, to: 12109, rate: 10 },
  { from: 12109, to: 15932, rate: 15 },
  { from: 15932, to: 552324, rate: 20 },
  { from: 552324, to: 902838, rate: 30 },
  { from: 902838, to: 1805677, rate: 40 },
  { from: 1805677, to: null, rate: 45 },
];

/** Abattement par parent et par enfant, renouvelable tous les quinze ans. */
export const DIRECT_LINE_ALLOWANCE = 100000;

/** Prélèvement forfaitaire unique et prélèvements sociaux. */
export const FLAT_TAX_RATE = 30;
export const SOCIAL_CHARGES_RATE = 17.2;
export const FLAT_TAX_INCOME_PART = FLAT_TAX_RATE - SOCIAL_CHARGES_RATE;

/** Abattement annuel sur les gains d'assurance-vie après huit ans. */
export const LIFE_INSURANCE_ALLOWANCE_SINGLE = 4600;
export const LIFE_INSURANCE_ALLOWANCE_COUPLE = 9200;

export interface BracketDetail {
  bracket: Bracket;
  taxableInBracket: number;
  tax: number;
}

/** Applique un barème progressif à une base taxable. */
export function applyBrackets(base: number, brackets: Bracket[]): {
  total: number;
  details: BracketDetail[];
  marginalRate: number;
} {
  let total = 0;
  let marginalRate = 0;
  const details: BracketDetail[] = [];

  for (const bracket of brackets) {
    const upper = bracket.to ?? Number.POSITIVE_INFINITY;
    const taxableInBracket = Math.max(0, Math.min(base, upper) - bracket.from);
    if (taxableInBracket <= 0) continue;

    const tax = (taxableInBracket * bracket.rate) / 100;
    total += tax;
    marginalRate = bracket.rate;
    details.push({ bracket, taxableInBracket, tax });
  }

  return { total, details, marginalRate };
}

export interface IncomeTaxResult {
  taxableIncome: number;
  parts: number;
  perPartIncome: number;
  taxPerPart: number;
  totalTax: number;
  marginalRate: number;
  averageRate: number;
  details: BracketDetail[];
}

/**
 * Impôt sur le revenu simplifié.
 *
 * Modélise l'abattement de 10 % sur les salaires et le quotient familial de
 * base. Ne modélise ni le plafonnement du quotient, ni la décote, ni les
 * réductions et crédits d'impôt.
 */
export function simulateIncomeTax(options: {
  annualIncome: number;
  parts: number;
  applyStandardDeduction?: boolean;
}): IncomeTaxResult {
  const deduction = options.applyStandardDeduction === false ? 0 : Math.min(options.annualIncome * 0.1, 14171);
  const taxableIncome = Math.max(0, options.annualIncome - deduction);
  const parts = Math.max(1, options.parts);
  const perPartIncome = taxableIncome / parts;

  const { total: taxPerPart, details, marginalRate } = applyBrackets(perPartIncome, INCOME_TAX_BRACKETS);
  const totalTax = taxPerPart * parts;

  return {
    taxableIncome,
    parts,
    perPartIncome,
    taxPerPart,
    totalTax,
    marginalRate,
    averageRate: options.annualIncome > 0 ? (totalTax / options.annualIncome) * 100 : 0,
    details,
  };
}

export interface IfiResult {
  taxableBase: number;
  liable: boolean;
  totalTax: number;
  details: BracketDetail[];
}

/**
 * Impôt sur la fortune immobilière simplifié.
 *
 * La base retenue est la valeur des biens immobiliers diminuée des dettes
 * afférentes, avec l'abattement de 30 % sur la résidence principale.
 */
export function simulateIfi(options: {
  realEstateValue: number;
  primaryResidenceValue: number;
  realEstateDebt: number;
}): IfiResult {
  const abatement = options.primaryResidenceValue * 0.3;
  const taxableBase = Math.max(0, options.realEstateValue - abatement - options.realEstateDebt);
  const liable = taxableBase >= IFI_THRESHOLD;

  if (!liable) return { taxableBase, liable, totalTax: 0, details: [] };

  const { total, details } = applyBrackets(taxableBase, IFI_BRACKETS);
  return { taxableBase, liable, totalTax: total, details };
}

export interface TransmissionResult {
  grossPerChild: number;
  allowance: number;
  taxableBase: number;
  taxPerChild: number;
  totalTax: number;
  netPerChild: number;
  effectiveRate: number;
  details: BracketDetail[];
}

/** Transmission en ligne directe, répartie à parts égales entre les enfants. */
export function simulateTransmission(options: {
  estateValue: number;
  children: number;
}): TransmissionResult {
  const children = Math.max(1, options.children);
  const grossPerChild = options.estateValue / children;
  const taxableBase = Math.max(0, grossPerChild - DIRECT_LINE_ALLOWANCE);
  const { total, details } = applyBrackets(taxableBase, DIRECT_LINE_BRACKETS);

  return {
    grossPerChild,
    allowance: DIRECT_LINE_ALLOWANCE,
    taxableBase,
    taxPerChild: total,
    totalTax: total * children,
    netPerChild: grossPerChild - total,
    effectiveRate: grossPerChild > 0 ? (total / grossPerChild) * 100 : 0,
    details,
  };
}

export interface InvestmentTaxRow {
  envelope: string;
  taxation: string;
  socialCharges: string;
  note: string;
}

/** Repères de fiscalité des enveloppes, à visée pédagogique. */
export const INVESTMENT_TAX_TABLE: InvestmentTaxRow[] = [
  {
    envelope: 'Compte-titres ordinaire',
    taxation: `Prélèvement forfaitaire unique de ${FLAT_TAX_RATE} % sur les gains, ou option pour le barème progressif`,
    socialCharges: `${SOCIAL_CHARGES_RATE} % inclus dans le prélèvement forfaitaire`,
    note: 'Imposition au moment de la cession ou de la perception du revenu.',
  },
  {
    envelope: 'PEA',
    taxation: `Exonération d'impôt sur le revenu après cinq ans de détention`,
    socialCharges: `${SOCIAL_CHARGES_RATE} % dus sur les gains lors du retrait`,
    note: 'Un retrait avant cinq ans entraîne en principe la clôture du plan.',
  },
  {
    envelope: 'Assurance-vie (contrat de plus de huit ans)',
    taxation: `Abattement annuel de ${LIFE_INSURANCE_ALLOWANCE_SINGLE} € sur les gains (${LIFE_INSURANCE_ALLOWANCE_COUPLE} € pour un couple), puis taux réduit`,
    socialCharges: `${SOCIAL_CHARGES_RATE} %`,
    note: 'Seule la part de gains comprise dans le rachat est imposée.',
  },
  {
    envelope: 'PER individuel',
    taxation: 'Versements déductibles du revenu imposable dans la limite du plafond disponible',
    socialCharges: `${SOCIAL_CHARGES_RATE} % sur les gains à la sortie`,
    note: 'Le capital est imposé à la sortie : l’intérêt dépend de l’écart de taux entre entrée et sortie.',
  },
  {
    envelope: 'Immobilier locatif nu',
    taxation: 'Revenus fonciers imposés au barème progressif',
    socialCharges: `${SOCIAL_CHARGES_RATE} %`,
    note: 'Régime micro-foncier ou réel selon le montant des loyers et des charges.',
  },
  {
    envelope: 'Crypto-actifs',
    taxation: `Prélèvement forfaitaire unique de ${FLAT_TAX_RATE} % sur les plus-values de cession`,
    socialCharges: `${SOCIAL_CHARGES_RATE} % inclus`,
    note: 'Les échanges entre crypto-actifs ne déclenchent pas d’imposition immédiate.',
  },
];
