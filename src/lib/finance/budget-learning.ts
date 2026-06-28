// ─── Budget Learning Engine ─────────────────────────────────────────────────
// Automatic budget recommendations, rolling averages, adaptive suggestions,
// budget forecasting, health indicators, rollover, history, adjustments.

import type { Budget, Transaction } from "@/lib/data/types";
import { groupByCategory, monthlyTotals } from "./grouping";

// ─── Budget Recommendation ──────────────────────────────────────────────────

export type BudgetRecommendation = {
  category: string;
  /** Recommended monthly budget amount */
  recommended: number;
  /** Current budget (if one exists) */
  current?: number;
  /** Average spending over the lookback period */
  average: number;
  /** Median spending (less sensitive to outliers) */
  median: number;
  /** Highest monthly spend in lookback period */
  maxSpend: number;
  /** Confidence level */
  confidence: "high" | "medium" | "low";
  /** Number of months of data used */
  monthsOfData: number;
  /** Whether spending is trending up or down */
  trend: "growing" | "declining" | "stable";
  /** Suggested adjustment if a budget already exists */
  adjustment?: number;
};

/**
 * Generate budget recommendations from actual spending data.
 * Uses rolling averages over the lookback period.
 */
export function recommendBudgets(
  transactions: Transaction[],
  existingBudgets: Budget[] = [],
  lookbackMonths = 6,
): BudgetRecommendation[] {
  const months = monthlyTotals(transactions);
  const recentMonths = months.slice(-lookbackMonths).filter((m) => m.expense > 0);

  if (recentMonths.length < 1) return [];

  const expenseTxns = transactions.filter((t) => t.amount < 0);
  const byCategory = groupByCategory(expenseTxns);
  const existingMap = new Map(existingBudgets.map((b) => [b.category, b.amount]));

  const recommendations: BudgetRecommendation[] = [];

  for (const [category, txns] of Object.entries(byCategory)) {
    if (category === "Income" || category === "Transfer") continue;

    // Monthly spending for this category over the lookback window
    const monthlySpend: number[] = recentMonths.map((m) => {
      const monthTxns = txns.filter((t) => t.date.startsWith(m.month));
      return Math.abs(monthTxns.reduce((s, t) => s + t.amount, 0));
    });

    const validSpend = monthlySpend.filter((s) => s > 0);
    if (validSpend.length === 0) continue;

    const average = Math.round((validSpend.reduce((s, v) => s + v, 0) / validSpend.length) * 100) / 100;
    const sorted = [...validSpend].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const maxSpend = Math.max(...validSpend);

    // Trend detection
    const trend = detectTrend(validSpend);

    // Recommended amount: median + 10% buffer, capped at max
    const recommended = Math.round(Math.min(maxSpend, median * 1.1) * 100) / 100;

    // Confidence
    const confidence: "high" | "medium" | "low" =
      validSpend.length >= 4 ? "high" : validSpend.length >= 2 ? "medium" : "low";

    const currentBudget = existingMap.get(category);

    recommendations.push({
      category,
      recommended,
      current: currentBudget,
      average,
      median,
      maxSpend,
      confidence,
      monthsOfData: validSpend.length,
      trend,
      adjustment: currentBudget ? Math.round((recommended - currentBudget) * 100) / 100 : undefined,
    });
  }

  return recommendations.sort((a, b) => b.average - a.average);
}

// ─── Rolling Monthly Averages ───────────────────────────────────────────────

export type RollingAverage = {
  month: string;
  /** Simple average (equal weight) */
  simpleAverage: number;
  /** Weighted average (more recent months weighted higher) */
  weightedAverage: number;
  /** 3-month moving average */
  movingAverage3: number;
};

/**
 * Compute rolling averages for a category's spending.
 */
export function rollingCategoryAverages(
  transactions: Transaction[],
  category: string,
  windowMonths = 3,
): RollingAverage[] {
  const months = monthlyTotals(transactions).filter((m) => m.expense > 0);
  if (months.length < 1) return [];

  const categoryTxns = transactions.filter((t) => t.category === category && t.amount < 0);

  return months.map((m, idx) => {
    const monthSpend = Math.abs(categoryTxns.filter((t) => t.date.startsWith(m.month)).reduce((s, t) => s + t.amount, 0));

    // Simple average over all months
    const allMonths = months.slice(0, idx + 1).map((m2) =>
      Math.abs(categoryTxns.filter((t) => t.date.startsWith(m2.month)).reduce((s, t) => s + t.amount, 0))
    ).filter((s) => s > 0);
    const simpleAverage = allMonths.length > 0
      ? Math.round(allMonths.reduce((s, v) => s + v, 0) / allMonths.length * 100) / 100
      : 0;

    // Weighted average (linear weights: recent = highest)
    const weightedAverage = allMonths.length > 0
      ? Math.round(allMonths.reduce((s, v, i) => s + v * (i + 1), 0) / allMonths.reduce((s, _, i) => s + i + 1, 0) * 100) / 100
      : 0;

    // Moving average
    const window = allMonths.slice(-windowMonths);
    const movingAverage3 = window.length > 0
      ? Math.round(window.reduce((s, v) => s + v, 0) / window.length * 100) / 100
      : 0;

    return {
      month: m.month,
      simpleAverage,
      weightedAverage,
      movingAverage3,
    };
  });
}

// ─── Budget Health ──────────────────────────────────────────────────────────

export type BudgetHealth = {
  category: string;
  budget: number;
  actual: number;
  utilization: number; // percentage
  remaining: number;
  status: "on-track" | "warning" | "over" | "under";
  /** Average utilization over last 3 months */
  averageUtilization: number;
  /** Days remaining in month */
  daysRemaining: number;
  /** Projected end-of-month spending */
  projected: number;
};

/**
 * Assess health of all budgets for a given month.
 */
export function assessBudgetHealth(
  budgets: Budget[],
  transactions: Transaction[],
  month: string,
): BudgetHealth[] {
  const monthTxns = transactions.filter((t) => t.date.startsWith(month));
  const daysInMonth = new Date(Number(month.split("-")[0]), Number(month.split("-")[1]), 0).getDate();
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysRemaining = Math.max(0, daysInMonth - dayOfMonth);

  // Historical utilization for each category
  const prevMonths = [1, 2, 3].map((n) => {
    const d = new Date(Number(month.split("-")[0]), Number(month.split("-")[1]) - 1 - n, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  return budgets
    .filter((b) => b.month === month)
    .map((b) => {
      const spent = Math.abs(monthTxns.filter((t) => t.category === b.category && t.amount < 0).reduce((s, t) => s + t.amount, 0));
      const utilization = b.amount > 0 ? Math.round((spent / b.amount) * 100) : spent > 0 ? 100 : 0;
      const remaining = b.amount - spent;

      let status: BudgetHealth["status"];
      if (remaining < 0) status = "over";
      else if (utilization >= 85) status = "warning";
      else if (utilization <= 30) status = "under";
      else status = "on-track";

      // Historical utilization
      const prevUtilizations = prevMonths.map((pm) => {
        const prevTxns = transactions.filter((t) => t.date.startsWith(pm) && t.category === b.category && t.amount < 0);
        const prevSpent = Math.abs(prevTxns.reduce((s, t) => s + t.amount, 0));
        return b.amount > 0 ? Math.round((prevSpent / b.amount) * 100) : 0;
      }).filter((u) => u > 0);

      const averageUtilization = prevUtilizations.length > 0
        ? Math.round(prevUtilizations.reduce((s, u) => s + u, 0) / prevUtilizations.length)
        : utilization;

      // Projected end-of-month spending
      const spentPerDay = dayOfMonth > 0 ? spent / dayOfMonth : 0;
      const projected = Math.round(spentPerDay * daysInMonth * 100) / 100;

      return {
        category: b.category,
        budget: b.amount,
        actual: spent,
        utilization,
        remaining: Math.round(remaining * 100) / 100,
        status,
        averageUtilization,
        daysRemaining,
        projected,
      };
    });
}

// ─── Category Rollover ─────────────────────────────────────────────────────

export type RolloverEntry = {
  category: string;
  /** Remaining budget from previous month (carried forward) */
  rolloverAmount: number;
  /** Whether rollover is positive (underspend) or negative (overspend) */
  type: "surplus" | "deficit";
  /** Applied to current month */
  appliedToCurrent: boolean;
};

/**
 * Calculate category rollover amounts from previous month.
 */
export function calculateRollovers(
  budgets: Budget[],
  transactions: Transaction[],
  month: string,
): RolloverEntry[] {
  const prevMonth = subtractMonth(month);

  return budgets
    .filter((b) => b.month === prevMonth)
    .map((b) => {
      const spent = Math.abs(transactions.filter((t) => t.date.startsWith(prevMonth) && t.category === b.category && t.amount < 0).reduce((s, t) => s + t.amount, 0));
      const remaining = b.amount - spent;
      return {
        category: b.category,
        rolloverAmount: Math.round(Math.abs(remaining) * 100) / 100,
        type: (remaining >= 0 ? "surplus" : "deficit") as "surplus" | "deficit",
        appliedToCurrent: false,
      };
    })
    .filter((r) => r.rolloverAmount > 0);
}

// ─── Budget History ────────────────────────────────────────────────────────

export type BudgetHistoryEntry = {
  month: string;
  category: string;
  budgeted: number;
  actual: number;
  utilization: number;
  rolloverFrom?: number;
};

/**
 * Track budget vs actual over time for each category.
 */
export function budgetHistory(
  budgets: Budget[],
  transactions: Transaction[],
): BudgetHistoryEntry[] {
  const sorted = [...budgets].sort((a, b) => a.month.localeCompare(b.month));

  return sorted.map((b) => {
    const spent = Math.abs(transactions.filter((t) => t.date.startsWith(b.month) && t.category === b.category && t.amount < 0).reduce((s, t) => s + t.amount, 0));
    return {
      month: b.month,
      category: b.category,
      budgeted: b.amount,
      actual: spent,
      utilization: b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0,
    };
  });
}

// ─── Budget Adjustment Recommendations ─────────────────────────────────────

export type BudgetAdjustment = {
  category: string;
  currentBudget: number;
  recommendedBudget: number;
  reason: string;
  urgency: "high" | "medium" | "low";
};

/**
 * Recommend budget adjustments based on actual spending patterns.
 */
export function recommendAdjustments(
  budgets: Budget[],
  transactions: Transaction[],
): BudgetAdjustment[] {
  const adjustments: BudgetAdjustment[] = [];
  const allHistory = budgetHistory(budgets, transactions);

  // Get unique category + budget pairs — use latest budget each
  const latestBudgets = new Map<string, Budget>();
  for (const b of budgets) {
    latestBudgets.set(b.category, b);
  }

  for (const [category, budget] of latestBudgets) {
    const history = allHistory
      .filter((h) => h.category === category && h.month !== budget.month)
      .slice(-3);

    if (history.length === 0) continue;

    const avgActual = history.reduce((s, h) => s + h.actual, 0) / history.length;
    const pctDiff = budget.amount > 0 ? ((avgActual - budget.amount) / budget.amount) * 100 : 0;

    let urgency: BudgetAdjustment["urgency"];
    let reason: string;

    if (pctDiff > 20) {
      urgency = "high";
      reason = `Consistently overspending by ${Math.round(pctDiff)}%. Consider increasing budget.`;
    } else if (pctDiff > 10) {
      urgency = "medium";
      reason = `Slightly overspending by ${Math.round(pctDiff)}%. Monitor closely.`;
    } else if (pctDiff < -20) {
      urgency = "medium";
      reason = `Consistently underspending by ${Math.round(Math.abs(pctDiff))}%. Could reduce budget.`;
    } else {
      continue; // No adjustment needed
    }

    adjustments.push({
      category: budget.category,
      currentBudget: budget.amount,
      recommendedBudget: Math.round(avgActual * 1.05 * 100) / 100,
      reason,
      urgency,
    });
  }

  return adjustments.sort((a, b) => {
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });
}

// ─── Forecast ──────────────────────────────────────────────────────────────

export type BudgetForecast = {
  category: string;
  /** Predicted spending for the current month */
  predictedSpend: number;
  /** Budget target */
  budgeted: number;
  /** Whether the category is on track to stay within budget */
  onTrack: boolean;
  /** Expected remaining at end of month */
  projectedRemaining: number;
};

/**
 * Forecast end-of-month spending based on pace and history.
 */
export function forecastBudgets(
  budgets: Budget[],
  transactions: Transaction[],
  month: string,
): BudgetForecast[] {
  const today = new Date();
  const daysInMonth = new Date(Number(month.split("-")[0]), Number(month.split("-")[1]), 0).getDate();
  const daysElapsed = Math.min(today.getDate(), daysInMonth);
  const daysRemaining = daysInMonth - daysElapsed;

  return budgets
    .filter((b) => b.month === month)
    .map((b) => {
      const spent = Math.abs(transactions.filter((t) => t.date.startsWith(month) && t.category === b.category && t.amount < 0).reduce((s, t) => s + t.amount, 0));
      const dailyPace = daysElapsed > 0 ? spent / daysElapsed : 0;
      const predictedSpend = Math.round(spent + dailyPace * daysRemaining * 100) / 100;
      const projectedRemaining = b.amount - predictedSpend;

      return {
        category: b.category,
        predictedSpend,
        budgeted: b.amount,
        onTrack: projectedRemaining >= 0,
        projectedRemaining,
      };
    });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function detectTrend(values: number[]): "growing" | "declining" | "stable" {
  if (values.length < 3) return "stable";
  const half = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, half).reduce((s, v) => s + v, 0) / half;
  const secondHalf = values.slice(half).reduce((s, v) => s + v, 0) / (values.length - half);
  const diff = secondHalf - firstHalf;
  const pct = firstHalf > 0 ? (diff / firstHalf) * 100 : 0;
  if (pct > 15) return "growing";
  if (pct < -15) return "declining";
  return "stable";
}

function subtractMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + m - 2;
  const ny = Math.floor(total / 12);
  const nm = total % 12 + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}
