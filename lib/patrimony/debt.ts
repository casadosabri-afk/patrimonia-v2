import type { Debt, RealEstateAsset } from '@/types';
import { monthsBetween } from '@/lib/utils/dates';

export interface DebtMetrics {
  debt: Debt;
  /** Part du capital déjà remboursée, en pourcentage. */
  repaidPct: number;
  monthsRemaining: number;
  /** Coût total des intérêts restants, hypothèse de taux constant. */
  remainingInterest: number;
  totalMonthlyCost: number;
}

export function computeDebtMetrics(debt: Debt, now = new Date()): DebtMetrics {
  const repaid = debt.initialAmount - debt.remainingAmount;
  const repaidPct = debt.initialAmount > 0 ? (repaid / debt.initialAmount) * 100 : 0;
  const monthsRemaining = Math.max(0, monthsBetween(now, new Date(debt.endsAt)));
  const insuranceMonthly = (debt.initialAmount * (debt.insuranceRatePct / 100)) / 12;
  const totalMonthlyCost = debt.monthlyPayment + insuranceMonthly;
  const remainingInterest = Math.max(
    0,
    debt.monthlyPayment * monthsRemaining - debt.remainingAmount,
  );

  return { debt, repaidPct, monthsRemaining, remainingInterest, totalMonthlyCost };
}

/** Taux d'endettement au sens usuel : charges de crédit / revenus. */
export function debtServiceRatio(debts: Debt[], annualIncome: number): number {
  if (annualIncome <= 0) return 0;
  const monthlyIncome = annualIncome / 12;
  const monthlyCharges = debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);
  return (monthlyCharges / monthlyIncome) * 100;
}

export interface PropertyMetrics {
  property: RealEstateAsset;
  annualGrossRent: number;
  annualNetRent: number;
  /** Rendement brut : loyers annuels / valeur actuelle. */
  grossYieldPct: number;
  /** Rendement net de charges et de taxe foncière, hors fiscalité. */
  netYieldPct: number;
  /** Trésorerie mensuelle après charges et mensualité de crédit. */
  monthlyCashflow: number;
  capitalGain: number;
  capitalGainPct: number;
  remainingDebt: number;
}

export function computePropertyMetrics(
  property: RealEstateAsset,
  debts: Debt[],
): PropertyMetrics {
  const linkedDebt = property.linkedDebtId
    ? debts.find((debt) => debt.id === property.linkedDebtId)
    : undefined;

  const annualGrossRent = property.monthlyRent * 12;
  const annualNetRent =
    annualGrossRent - property.monthlyCharges * 12 - property.annualPropertyTax;
  const value = property.currentValue;

  const capitalGain = property.currentValue - property.purchasePrice;

  return {
    property,
    annualGrossRent,
    annualNetRent,
    grossYieldPct: value > 0 ? (annualGrossRent / value) * 100 : 0,
    netYieldPct: value > 0 ? (annualNetRent / value) * 100 : 0,
    monthlyCashflow:
      property.monthlyRent -
      property.monthlyCharges -
      property.annualPropertyTax / 12 -
      (linkedDebt?.monthlyPayment ?? 0),
    capitalGain,
    capitalGainPct: property.purchasePrice > 0 ? (capitalGain / property.purchasePrice) * 100 : 0,
    remainingDebt: linkedDebt?.remainingAmount ?? 0,
  };
}

/** Projection du capital restant dû, mois par mois, à taux constant. */
export function amortizationSeries(debt: Debt, points = 24, now = new Date()): {
  date: string;
  remaining: number;
}[] {
  const monthlyRate = debt.annualRatePct / 100 / 12;
  const series: { date: string; remaining: number }[] = [];
  let remaining = debt.remainingAmount;
  const cursor = new Date(now);

  for (let index = 0; index < points; index += 1) {
    series.push({
      date: `${cursor.getFullYear()}-${`${cursor.getMonth() + 1}`.padStart(2, '0')}-01`,
      remaining: Math.max(0, Math.round(remaining)),
    });
    const interest = remaining * monthlyRate;
    remaining = Math.max(0, remaining + interest - debt.monthlyPayment);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return series;
}
