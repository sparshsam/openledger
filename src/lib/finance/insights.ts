// ─── Financial Insights Engine ──────────────────────────────────────────────
// Spending trends, category growth/decline, merchant summaries,
// largest changes, and low-balance alerts.

import type { Account, Transaction } from "@/lib/data/types";
import { categoryTotals, monthlyTotals, groupByCategory } from "./grouping";
import { accountEffectiveBalance } from "./totals";

const LOW_BALANCE_THRESHOLD = 100;

// ─── Legacy / Existing ──────────────────────────────────────────────────────

export function largestExpenseThisMonth(
  transactions: Transaction[],
): { description: string; amount: number } | null {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTxns = transactions.filter((t) => t.date.startsWith(currentMonth) && t.amount < 0);
  if (monthTxns.length === 0) return null;
  const largest = monthTxns.reduce((a, b) => (a.amount < b.amount ? a : b));
  return { description: largest.description, amount: largest.amount };
}

export function topSpendingCategory(
  transactions: Transaction[],
): { category: string; total: number } | null {
  const totals = categoryTotals(transactions).filter((t) => t.total < 0);
  if (totals.length === 0) return null;
  return totals.reduce((a, b) => (a.total < b.total ? a : b));
}

export function monthOverMonthChange(
  transactions: Transaction[],
): number | null {
  const months = monthlyTotals(transactions).filter((m) => m.expense > 0);
  if (months.length < 2) return null;
  const last = months[months.length - 1];
  const prev = months[months.length - 2];
  if (prev.expense === 0) return null;
  return Math.round(((last.expense - prev.expense) / prev.expense) * 100 * 100) / 100;
}

export function findRecurringTransactions(
  transactions: Transaction[],
): Array<{ description: string; amount: number; count: number }> {
  const seen = new Map<string, { description: string; amount: number; count: number }>();
  for (const t of transactions) {
    const key = `${t.description}|${t.amount}`;
    if (seen.has(key)) {
      seen.get(key)!.count++;
    } else {
      seen.set(key, { description: t.description, amount: t.amount, count: 1 });
    }
  }
  return Array.from(seen.values()).filter((r) => r.count >= 2);
}

export function lowBalanceAlerts(
  accounts: Account[],
  transactions: Transaction[],
): Array<{ accountName: string; balance: number }> {
  return accounts
    .filter((a) => !a.archivedAt)
    .map((a) => ({
      accountName: a.name,
      balance: accountEffectiveBalance(a, transactions),
    }))
    .filter((a) => a.balance >= 0 && a.balance < LOW_BALANCE_THRESHOLD);
}

// ─── Spending Trend Analysis ────────────────────────────────────────────────

export type SpendingTrend = {
  category: string;
  current: number;
  previous: number;
  change: number; // absolute change
  pctChange: number | null; // percentage change
  direction: "up" | "down" | "same";
};

/**
 * Compare category spending between two periods.
 */
export function categorySpendingTrends(
  transactions: Transaction[],
  currentMonth: string,
  previousMonth: string,
): SpendingTrend[] {
  const current = transactions.filter((t) => t.date.startsWith(currentMonth) && t.amount < 0);
  const previous = transactions.filter((t) => t.date.startsWith(previousMonth) && t.amount < 0);

  const currentCategories = groupByCategory(current);
  const previousCategories = groupByCategory(previous);

  const allCategories = new Set([...Object.keys(currentCategories), ...Object.keys(previousCategories)]);

  return [...allCategories]
    .map((category) => {
      const curTotal = Math.abs(currentCategories[category]?.reduce((s, t) => s + t.amount, 0) ?? 0);
      const prevTotal = Math.abs(previousCategories[category]?.reduce((s, t) => s + t.amount, 0) ?? 0);
      const change = curTotal - prevTotal;
      const pctChange = prevTotal > 0 ? Math.round((change / prevTotal) * 100) : null;
      const direction: "up" | "down" | "same" = change > 0 ? "up" : change < 0 ? "down" : "same";

      return { category, current: curTotal, previous: prevTotal, change, pctChange, direction };
    })
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}

/**
 * Largest spending increases (top N).
 */
export function largestSpendingIncreases(
  transactions: Transaction[],
  currentMonth: string,
  previousMonth: string,
  limit = 5,
): SpendingTrend[] {
  return categorySpendingTrends(transactions, currentMonth, previousMonth)
    .filter((t) => t.direction === "up")
    .slice(0, limit);
}

/**
 * Largest spending decreases (top N).
 */
export function largestSpendingDecreases(
  transactions: Transaction[],
  currentMonth: string,
  previousMonth: string,
  limit = 5,
): SpendingTrend[] {
  return categorySpendingTrends(transactions, currentMonth, previousMonth)
    .filter((t) => t.direction === "down")
    .slice(0, limit);
}

/**
 * Category growth rate over multiple months.
 * Positive = growing spend, negative = declining.
 */
export function categoryGrowthRate(
  transactions: Transaction[],
  category: string,
  lookbackMonths = 3,
): { trend: "growing" | "declining" | "stable"; rate: number | null } {
  const months = monthlyTotals(transactions).slice(-lookbackMonths - 1);
  if (months.length < 2) return { trend: "stable", rate: null };

  const catSpending = months.map((m) => {
    const monthTxns = transactions.filter((t) => t.date.startsWith(m.month) && t.category === category && t.amount < 0);
    return Math.abs(monthTxns.reduce((s, t) => s + t.amount, 0));
  });

  // Linear regression to find slope
  const n = catSpending.length;
  const indices = catSpending.map((_, i) => i);
  const sumX = indices.reduce((s, x) => s + x, 0);
  const sumY = catSpending.reduce((s, y) => s + y, 0);
  const sumXY = indices.reduce((s, x) => s + x * catSpending[x], 0);
  const sumX2 = indices.reduce((s, x) => s + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avg = sumY / n;
  const rate = avg > 0 ? Math.round((slope / avg) * 100) : 0;

  const trend = rate > 10 ? "growing" : rate < -10 ? "declining" : "stable";
  return { trend, rate };
}

// ─── Merchant Summaries ────────────────────────────────────────────────────

export type MerchantSummary = {
  merchant: string;
  total: number;
  count: number;
  average: number;
  category: string;
  lastDate: string;
  trend: "new" | "recurring" | "one-off";
};

/**
 * Group spending by merchant name.
 */
export function merchantSummaries(
  transactions: Transaction[],
): MerchantSummary[] {
  const merchants = new Map<string, { total: number; count: number; category: string; lastDate: string }>();

  for (const t of transactions) {
    const name = t.merchant || t.description;
    const existing = merchants.get(name);
    if (existing) {
      existing.total += t.amount;
      existing.count += 1;
      if (t.date > existing.lastDate) existing.lastDate = t.date;
    } else {
      merchants.set(name, {
        total: t.amount,
        count: 1,
        category: t.category,
        lastDate: t.date,
      });
    }
  }

  return [...merchants.entries()]
    .map(([merchant, data]) => ({
      merchant,
      total: Math.round(Math.abs(data.total) * 100) / 100,
      count: data.count,
      average: Math.round(Math.abs(data.total / data.count) * 100) / 100,
      category: data.category,
      lastDate: data.lastDate,
      trend: (data.count >= 3 ? "recurring" : data.count === 1 ? "one-off" : "recurring") as "new" | "recurring" | "one-off",
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Top merchants by spending.
 */
export function topMerchants(
  transactions: Transaction[],
  limit = 10,
): MerchantSummary[] {
  return merchantSummaries(transactions).slice(0, limit);
}

/**
 * Top merchants in a specific category.
 */
export function topMerchantsByCategory(
  transactions: Transaction[],
  category: string,
  limit = 5,
): MerchantSummary[] {
  return merchantSummaries(transactions)
    .filter((m) => m.category === category)
    .slice(0, limit);
}

/**
 * New merchants (first seen in the current month).
 */
export function newMerchants(
  transactions: Transaction[],
  currentMonth: string,
): MerchantSummary[] {
  return merchantSummaries(transactions).filter((m) => {
    const firstAppearance = transactions
      .filter((t) => (t.merchant || t.description) === m.merchant)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    return firstAppearance?.date.startsWith(currentMonth) ?? false;
  });
}
