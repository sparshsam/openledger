// ─── Financial Highlights & Monthly Snapshots ───────────────────────────────
// Key events, patterns, and observations per month.

import type { Transaction } from "@/lib/data/types";
import { monthlyTotals } from "./grouping";
import { savingsRate } from "./savings";
import { merchantSummaries } from "./insights";

export type MonthlyHighlight = {
  month: string;
  summary: string;
  income: number;
  expense: number;
  net: number;
  savingsRate: number | null;
  topCategory: { name: string; amount: number } | null;
  topMerchant: { merchant: string; total: number; count: number } | null;
  largestTransaction: Transaction | null;
  transactionCount: number;
  uniqueCategories: number;
  uniqueMerchants: number;
  avgTransaction: number;
  highlights: string[];
};

/**
 * Generate financial highlights for a specific month.
 */
export function generateMonthHighlights(
  transactions: Transaction[],
  month: string,
): MonthlyHighlight {
  const monthTxns = transactions.filter((t) => t.date.startsWith(month));
  const income = monthTxns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenseTxns = monthTxns.filter((t) => t.amount < 0);
  const expense = Math.abs(expenseTxns.reduce((s, t) => s + t.amount, 0));
  const net = income - expense;
  const rate = savingsRate(monthTxns);
  const highlights: string[] = [];

  // Top category
  const catMap = new Map<string, number>();
  for (const t of expenseTxns) {
    catMap.set(t.category, (catMap.get(t.category) ?? 0) + Math.abs(t.amount));
  }
  const topCategory = catMap.size > 0
    ? [...catMap.entries()].sort((a, b) => b[1] - a[1])[0]
    : null;

  // Top merchant
  const merchants = merchantSummaries(expenseTxns);
  const topMerchant = merchants[0] ?? null;

  // Largest transaction
  const largestTransaction = expenseTxns.length > 0
    ? expenseTxns.reduce((a, b) => (Math.abs(a.amount) > Math.abs(b.amount) ? a : b))
    : null;

  // Unique counts
  const uniqueCategories = new Set(monthTxns.map((t) => t.category)).size;
  const uniqueMerchants = new Set(monthTxns.map((t) => t.merchant).filter(Boolean)).size;
  const avgTransaction = monthTxns.length > 0
    ? Math.round(Math.abs(monthTxns.reduce((s, t) => s + t.amount, 0)) / monthTxns.length * 100) / 100
    : 0;

  // Generate narrative highlights
  if (rate !== null && rate >= 30) highlights.push(`Saved ${Math.round(rate)}% of income this month`);
  else if (rate !== null && rate <= 0) highlights.push(`Spent more than earned this month (savings rate: ${Math.round(rate)}%)`);

  if (topCategory) {
    const pct = expense > 0 ? Math.round((topCategory[1] / expense) * 100) : 0;
    highlights.push(`${topCategory[0]} was the biggest category at ${pct}% of spending`);
  }

  if (topMerchant) {
    highlights.push(`Most frequent merchant: ${topMerchant.merchant} (${topMerchant.count} visits)`);
  }

  if (largestTransaction) {
    highlights.push(`Largest expense: ${largestTransaction.description} (${Math.abs(largestTransaction.amount).toFixed(2)})`);
  }

  if (uniqueMerchants > 10) highlights.push(`Visited ${uniqueMerchants} different merchants`);
  if (uniqueCategories > 5) highlights.push(`Spread across ${uniqueCategories} categories`);

  return {
    month,
    summary: `${monthTxns.length} transactions, ${Math.round(expense)} spent, ${Math.round(income)} earned`,
    income: Math.round(income * 100) / 100,
    expense: Math.round(expense * 100) / 100,
    net: Math.round(net * 100) / 100,
    savingsRate: rate,
    topCategory: topCategory ? { name: topCategory[0], amount: Math.round(topCategory[1] * 100) / 100 } : null,
    topMerchant,
    largestTransaction,
    transactionCount: monthTxns.length,
    uniqueCategories,
    uniqueMerchants,
    avgTransaction,
    highlights,
  };
}

/**
 * Generate highlights for all months with activity.
 */
export function generateAllMonthHighlights(
  transactions: Transaction[],
): MonthlyHighlight[] {
  const months = [...new Set(transactions.map((t) => t.date.slice(0, 7)))].sort();
  return months.map((month) => generateMonthHighlights(transactions, month));
}

/**
 * Get best and worst months by savings rate.
 */
export function bestAndWorstMonths(
  transactions: Transaction[],
): { best: MonthlyHighlight | null; worst: MonthlyHighlight | null } {
  const highlights = generateAllMonthHighlights(transactions).filter((h) => h.savingsRate !== null);
  if (highlights.length === 0) return { best: null, worst: null };

  const sorted = [...highlights].sort((a, b) => (b.savingsRate ?? 0) - (a.savingsRate ?? 0));
  return {
    best: sorted[0],
    worst: sorted[sorted.length - 1],
  };
}

/**
 * Financial year summary.
 */
export type YearSummary = {
  year: string;
  totalIncome: number;
  totalExpense: number;
  totalNet: number;
  avgMonthlySavingsRate: number | null;
  busiestMonth: string | null;
  quietestMonth: string | null;
  monthsWithData: number;
  totalTransactions: number;
};

/**
 * Generate a year-level financial summary.
 */
export function generateYearSummary(
  transactions: Transaction[],
  year: string,
): YearSummary {
  const yearTxns = transactions.filter((t) => t.date.startsWith(year));
  const income = yearTxns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = Math.abs(yearTxns.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));

  const months = monthlyTotals(yearTxns);
  const monthsWithData = months.filter((m) => m.income > 0 || m.expense > 0).length;
  const avgRate = months.length > 0
    ? Math.round(months.reduce((s, m) => s + (m.income > 0 ? ((m.income - m.expense) / m.income) * 100 : 0), 0) / months.length * 100) / 100
    : null;

  const busiest = months.length > 0
    ? months.reduce((a, b) => (a.expense + a.income > b.expense + b.income ? a : b))
    : null;
  const quietest = months.length > 0
    ? months.reduce((a, b) => (a.expense + a.income < b.expense + b.income ? a : b))
    : null;

  return {
    year,
    totalIncome: Math.round(income * 100) / 100,
    totalExpense: Math.round(expense * 100) / 100,
    totalNet: Math.round((income - expense) * 100) / 100,
    avgMonthlySavingsRate: avgRate,
    busiestMonth: busiest?.month ?? null,
    quietestMonth: quietest?.month ?? null,
    monthsWithData,
    totalTransactions: yearTxns.length,
  };
}
