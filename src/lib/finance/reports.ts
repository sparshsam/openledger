// ─── Report Computation Helpers ─────────────────────────────────────────────
// Pure functions for annual, category, merchant, and cashflow reports.
// Finance engine immutable rule: every displayed value must come from here.

import type { Transaction } from "@/lib/data/types";
import { monthlyTotals } from "./grouping";

// ─── Year / Annual Reports ──────────────────────────────────────────────────

export type YearSummaryReport = {
  year: string;
  income: number;
  expenses: number;
  net: number;
  transactionCount: number;
  topCategory: { category: string; total: number } | null;
  bestMonth: { month: string; net: number } | null;
  worstMonth: { month: string; net: number } | null;
};

export type MonthlyBreakdownRow = {
  month: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
  topCategory: string;
};

export type YearOverYearComparison = {
  currentYear: YearSummaryReport;
  previousYear: YearSummaryReport | null;
  incomeChange: number | null;
  expenseChange: number | null;
  netChange: number | null;
};

/**
 * Compute a summary for an entire year.
 */
export function computeYearSummary(
  transactions: Transaction[],
  year: string,
): YearSummaryReport {
  const yearTxns = transactions.filter((t) => t.date.startsWith(year));
  if (yearTxns.length === 0) {
    return { year, income: 0, expenses: 0, net: 0, transactionCount: 0, topCategory: null, bestMonth: null, worstMonth: null };
  }

  const income = yearTxns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = Math.abs(yearTxns.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));
  const net = income - expenses;

  // Top category by total spending
  const catTotals = new Map<string, number>();
  for (const t of yearTxns) {
    if (t.amount < 0) {
      catTotals.set(t.category, (catTotals.get(t.category) ?? 0) + Math.abs(t.amount));
    }
  }
  let topCategory: { category: string; total: number } | null = null;
  for (const [cat, total] of catTotals) {
    if (!topCategory || total > topCategory.total) {
      topCategory = { category: cat, total: Math.round(total * 100) / 100 };
    }
  }

  // Best/worst months
  const monthly = computeMonthlyBreakdown(transactions, year);
  let bestMonth: { month: string; net: number } | null = null;
  let worstMonth: { month: string; net: number } | null = null;
  for (const m of monthly) {
    if (!bestMonth || m.net > bestMonth.net) bestMonth = { month: m.month, net: m.net };
    if (!worstMonth || m.net < worstMonth.net) worstMonth = { month: m.month, net: m.net };
  }

  return {
    year,
    income: Math.round(income * 100) / 100,
    expenses: Math.round(expenses * 100) / 100,
    net: Math.round(net * 100) / 100,
    transactionCount: yearTxns.length,
    topCategory,
    bestMonth: bestMonth?.net ? bestMonth : null,
    worstMonth: worstMonth?.net ? worstMonth : null,
  };
}

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthLabel(month: string): string {
  const parts = month.split("-");
  if (parts.length !== 2) return month;
  const idx = parseInt(parts[1], 10) - 1;
  return MONTH_LABELS[idx] ?? month;
}

/**
 * Break a year into 12 monthly summaries.
 */
export function computeMonthlyBreakdown(
  transactions: Transaction[],
  year: string,
): MonthlyBreakdownRow[] {
  const months: MonthlyBreakdownRow[] = [];

  for (let i = 1; i <= 12; i++) {
    const m = `${year}-${String(i).padStart(2, "0")}`;
    const monthTxns = transactions.filter((t) => t.date.startsWith(m));

    const income = monthTxns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = Math.abs(monthTxns.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));

    // Top category for this month
    const catTotals = new Map<string, number>();
    for (const t of monthTxns) {
      if (t.amount < 0) {
        catTotals.set(t.category, (catTotals.get(t.category) ?? 0) + Math.abs(t.amount));
      }
    }
    let topCat = "—";
    let topTotal = 0;
    for (const [cat, total] of catTotals) {
      if (total > topTotal) {
        topTotal = total;
        topCat = cat;
      }
    }

    months.push({
      month: m,
      label: monthLabel(m),
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      net: Math.round((income - expenses) * 100) / 100,
      topCategory: topCat,
    });
  }

  return months;
}

/**
 * Compare two years side by side.
 */
export function computeYearOverYear(
  transactions: Transaction[],
  currentYear: string,
  previousYear: string,
): YearOverYearComparison {
  const current = computeYearSummary(transactions, currentYear);
  const previousTxns = transactions.filter((t) => t.date.startsWith(previousYear));
  const previous = previousTxns.length > 0 ? computeYearSummary(transactions, previousYear) : null;

  const incomeChange = previous && previous.income > 0
    ? Math.round(((current.income - previous.income) / previous.income) * 100)
    : null;
  const expenseChange = previous && previous.expenses > 0
    ? Math.round(((current.expenses - previous.expenses) / previous.expenses) * 100)
    : null;
  const netChange = previous
    ? Math.round((current.net - previous.net) * 100) / 100
    : null;

  return { currentYear: current, previousYear: previous, incomeChange, expenseChange, netChange };
}

// ─── Category Report ────────────────────────────────────────────────────────

export type CategoryReportData = {
  category: string;
  totalSpent: number;
  transactionCount: number;
  averagePerTransaction: number;
  monthlyTrend: Array<{ month: string; label: string; total: number }>;
  topMerchants: Array<{ merchant: string; total: number; count: number }>;
  monthOverMonthChange: number | null;
  growthRate: { trend: "growing" | "declining" | "stable"; rate: number | null };
};

/**
 * Compute a detailed report for a single category.
 */
export function computeCategoryReport(
  transactions: Transaction[],
  category: string,
  lookbackMonths = 12,
): CategoryReportData {
  const catTxns = transactions.filter((t) => t.category === category && t.amount < 0);
  const totalSpent = Math.abs(catTxns.reduce((s, t) => s + t.amount, 0));

  // Monthly trend
  const months = monthlyTotals(transactions).slice(-lookbackMonths);
  const monthlyTrend = months.map((m) => {
    const mTxns = transactions.filter((t) => t.date.startsWith(m.month) && t.category === category && t.amount < 0);
    const total = Math.round(Math.abs(mTxns.reduce((s, t) => s + t.amount, 0)) * 100) / 100;
    return { month: m.month, label: monthLabel(m.month), total };
  });

  // Top merchants
  const merchantMap = new Map<string, { total: number; count: number }>();
  for (const t of catTxns) {
    const name = t.merchant || t.description;
    const existing = merchantMap.get(name) ?? { total: 0, count: 0 };
    merchantMap.set(name, { total: existing.total + Math.abs(t.amount), count: existing.count + 1 });
  }
  const topMerchants = [...merchantMap.entries()]
    .map(([merchant, data]) => ({ merchant, total: Math.round(data.total * 100) / 100, count: data.count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Month-over-month change
  const withData = monthlyTrend.filter((m) => m.total > 0);
  let monthOverMonthChange: number | null = null;
  if (withData.length >= 2) {
    const last = withData[withData.length - 1];
    const prev = withData[withData.length - 2];
    if (prev.total > 0) {
      monthOverMonthChange = Math.round(((last.total - prev.total) / prev.total) * 100);
    }
  }

  // Growth rate (simple linear regression)
  const dataPoints = monthlyTrend.map((m) => m.total);
  const n = dataPoints.length;
  const indices = dataPoints.map((_, i) => i);
  const sumX = indices.reduce((s, x) => s + x, 0);
  const sumY = dataPoints.reduce((s, y) => s + y, 0);
  const sumXY = indices.reduce((s, x) => s + x * dataPoints[x], 0);
  const sumX2 = indices.reduce((s, x) => s + x * x, 0);
  const slope = n * sumXY - sumX * sumY;
  const denom = n * sumX2 - sumX * sumX;
  const avg = sumY / n;
  let rate = 0;
  if (denom !== 0 && avg > 0) {
    rate = Math.round((slope / denom) / avg * 100);
  }
  const trend = rate > 10 ? "growing" : rate < -10 ? "declining" : "stable";

  return {
    category,
    totalSpent: Math.round(totalSpent * 100) / 100,
    transactionCount: catTxns.length,
    averagePerTransaction: catTxns.length > 0 ? Math.round((totalSpent / catTxns.length) * 100) / 100 : 0,
    monthlyTrend,
    topMerchants,
    monthOverMonthChange,
    growthRate: { trend, rate },
  };
}

// ─── Merchant Report ────────────────────────────────────────────────────────

export type MerchantReportData = {
  merchant: string;
  totalSpent: number;
  transactionCount: number;
  averagePerTransaction: number;
  firstSeen: string | null;
  lastSeen: string | null;
  monthlyTrend: Array<{ month: string; label: string; total: number }>;
  categoryDistribution: Array<{ category: string; total: number; percentage: number }>;
  recentTransactions: Transaction[];
};

/**
 * Compute a detailed report for a single merchant.
 */
export function computeMerchantReport(
  transactions: Transaction[],
  merchant: string,
): MerchantReportData {
  const merchantTxns = transactions
    .filter((t) => (t.merchant || t.description).toLowerCase() === merchant.toLowerCase())
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalSpent = Math.abs(merchantTxns.reduce((s, t) => s + t.amount, 0));
  const firstSeen = merchantTxns.length > 0 ? merchantTxns[merchantTxns.length - 1].date : null;
  const lastSeen = merchantTxns.length > 0 ? merchantTxns[0].date : null;

  // Monthly trend
  const monthMap = new Map<string, number>();
  for (const t of merchantTxns) {
    const m = t.date.slice(0, 7);
    monthMap.set(m, (monthMap.get(m) ?? 0) + Math.abs(t.amount));
  }
  const monthlyTrend = [...monthMap.entries()]
    .map(([month, total]) => ({ month, label: monthLabel(month), total: Math.round(total * 100) / 100 }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Category distribution
  const catMap = new Map<string, number>();
  for (const t of merchantTxns) {
    catMap.set(t.category, (catMap.get(t.category) ?? 0) + Math.abs(t.amount));
  }
  const categoryDistribution = [...catMap.entries()]
    .map(([category, total]) => ({
      category,
      total: Math.round(total * 100) / 100,
      percentage: totalSpent > 0 ? Math.round((total / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    merchant,
    totalSpent: Math.round(totalSpent * 100) / 100,
    transactionCount: merchantTxns.length,
    averagePerTransaction: merchantTxns.length > 0 ? Math.round((totalSpent / merchantTxns.length) * 100) / 100 : 0,
    firstSeen,
    lastSeen,
    monthlyTrend,
    categoryDistribution,
    recentTransactions: merchantTxns.slice(0, 20),
  };
}

// ─── Cashflow Report ────────────────────────────────────────────────────────

export type CashflowDataPoint = {
  month: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
  runningBalance: number;
  savingsRate: number | null;
};

export type CashflowReportData = {
  dataPoints: CashflowDataPoint[];
  totalIncome: number;
  totalExpenses: number;
  totalNet: number;
  averageSavingsRate: number | null;
  bestMonth: { month: string; net: number } | null;
  worstMonth: { month: string; net: number } | null;
};

/**
 * Compute cashflow data over a range of months.
 */
export function computeCashflowReport(
  transactions: Transaction[],
  months: number,
): CashflowReportData {
  const totals = monthlyTotals(transactions).slice(-months);
  let runningBalance = 0;
  const dataPoints: CashflowDataPoint[] = totals.map((m) => {
    runningBalance += m.income - m.expense;
    const savingsRate = m.income > 0 ? Math.round(((m.income - m.expense) / m.income) * 100) : null;
    return {
      month: m.month,
      label: monthLabel(m.month),
      income: Math.round(m.income * 100) / 100,
      expenses: Math.round(m.expense * 100) / 100,
      net: Math.round(m.income - m.expense * 100) / 100,
      runningBalance: Math.round(runningBalance * 100) / 100,
      savingsRate,
    };
  });

  const totalIncome = dataPoints.reduce((s, d) => s + d.income, 0);
  const totalExpenses = dataPoints.reduce((s, d) => s + d.expenses, 0);
  const totalNet = totalIncome - totalExpenses;
  const rates = dataPoints.filter((d) => d.savingsRate !== null);
  const averageSavingsRate = rates.length > 0
    ? Math.round(rates.reduce((s, r) => s + (r.savingsRate ?? 0), 0) / rates.length)
    : null;

  let bestMonth: { month: string; net: number } | null = null;
  let worstMonth: { month: string; net: number } | null = null;
  for (const d of dataPoints) {
    if (!bestMonth || d.net > bestMonth.net) bestMonth = { month: d.month, net: d.net };
    if (!worstMonth || d.net < worstMonth.net) worstMonth = { month: d.month, net: d.net };
  }

  return {
    dataPoints,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    totalNet: Math.round(totalNet * 100) / 100,
    averageSavingsRate,
    bestMonth,
    worstMonth,
  };
}
