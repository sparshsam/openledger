// ─── Savings & Income Metrics ───────────────────────────────────────────────

import type { Transaction } from "@/lib/data/types";
import { monthlyTotals } from "./grouping";

/**
 * Savings rate for a given set of transactions.
 * savings_rate = (income - expenses) / income * 100
 * Returns null if income is 0.
 */
export function savingsRate(
  transactions: Transaction[],
): number | null {
  const income = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = Math.abs(transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));

  if (income === 0) return null;
  return Math.round(((income - expenses) / income) * 100 * 100) / 100;
}

/**
 * Monthly savings rate over time.
 */
export function monthlySavingsRates(
  transactions: Transaction[],
): Array<{ month: string; rate: number | null; saved: number }> {
  return monthlyTotals(transactions).map((m) => {
    const saved = m.income - m.expense;
    const rate = m.income > 0 ? Math.round(((m.income - m.expense) / m.income) * 100 * 100) / 100 : null;
    return { month: m.month, rate, saved };
  });
}

/**
 * Average savings rate over the last N months.
 */
export function averageSavingsRate(
  transactions: Transaction[],
  months = 3,
): number | null {
  const rates = monthlySavingsRates(transactions).slice(-months).filter((r) => r.rate !== null);
  if (rates.length === 0) return null;
  return Math.round((rates.reduce((s, r) => s + r.rate!, 0) / rates.length) * 100) / 100;
}

/**
 * Income consistency score (0–100).
 * Measures how consistent monthly income is.
 * 100 = identical income every month, 0 = extreme variation.
 */
export function incomeConsistency(
  transactions: Transaction[],
): number {
  const months = monthlyTotals(transactions).filter((m) => m.income > 0);
  if (months.length < 2) return months.length === 1 ? 100 : 0;

  const incomes = months.map((m) => m.income);
  const avg = incomes.reduce((s, i) => s + i, 0) / incomes.length;
  const variance = incomes.reduce((s, i) => s + Math.pow(i - avg, 2), 0) / incomes.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / avg; // Coefficient of variation

  // Lower CV = more consistent. Map to 0–100 score.
  // CV < 0.05 → 100, CV > 0.5 → 0
  const score = Math.max(0, Math.min(100, Math.round(100 - cv * 200)));
  return score;
}

/**
 * Income stability label.
 */
export function incomeStabilityLabel(score: number): string {
  if (score >= 90) return "Very stable";
  if (score >= 70) return "Stable";
  if (score >= 50) return "Moderate";
  if (score >= 30) return "Variable";
  return "Highly variable";
}

/**
 * Months with income (to detect irregular income).
 */
export function monthsWithIncome(
  transactions: Transaction[],
): Array<{ month: string; income: number; hasIncome: boolean }> {
  return monthlyTotals(transactions).map((m) => ({
    month: m.month,
    income: m.income,
    hasIncome: m.income > 0,
  }));
}

/**
 * Income gap detection — months with zero or significantly lower income.
 */
export function incomeGaps(
  transactions: Transaction[],
): Array<{ month: string; income: number; gap: boolean }> {
  const months = monthlyTotals(transactions);
  if (months.length < 2) return [];

  const avgIncome = months.reduce((s, m) => s + m.income, 0) / months.length;
  const threshold = avgIncome * 0.5; // Less than 50% of average = gap

  return months.map((m) => ({
    month: m.month,
    income: m.income,
    gap: m.income > 0 && m.income < threshold,
  }));
}
