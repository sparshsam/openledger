// ─── Cashflow Timeline ──────────────────────────────────────────────────────
// Daily/weekly/monthly cashflow for timeline visualization.

import type { Transaction } from "@/lib/data/types";
import { monthlyTotals } from "./grouping";

export type CashflowPoint = {
  date: string;
  income: number;
  expense: number;
  net: number;
  runningBalance: number;
};

/**
 * Daily cashflow timeline.
 */
export function dailyCashflow(
  transactions: Transaction[],
  startDate: string,
  endDate: string,
  startingBalance = 0,
): CashflowPoint[] {
  const days: CashflowPoint[] = [];
  const txnsByDate = groupByDate(transactions);
  let balance = startingBalance;

  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = formatDate(d);
    const dayTxns = txnsByDate.get(dateKey) ?? [];
    const income = dayTxns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expense = Math.abs(dayTxns.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));
    balance += income - expense;

    days.push({
      date: dateKey,
      income,
      expense,
      net: income - expense,
      runningBalance: Math.round(balance * 100) / 100,
    });
  }

  return days;
}

/**
 * Weekly cashflow aggregation.
 */
export function weeklyCashflow(
  transactions: Transaction[],
  startDate: string,
  endDate: string,
): CashflowPoint[] {
  const daily = dailyCashflow(transactions, startDate, endDate);
  const weeks: CashflowPoint[] = [];
  let balance = 0;

  for (let i = 0; i < daily.length; i += 7) {
    const weekDays = daily.slice(i, i + 7);
    const income = weekDays.reduce((s, d) => s + d.income, 0);
    const expense = weekDays.reduce((s, d) => s + d.expense, 0);
    const last = weekDays[weekDays.length - 1];
    balance = last?.runningBalance ?? balance + income - expense;

    weeks.push({
      date: weekDays[0]?.date ?? "",
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      net: Math.round((income - expense) * 100) / 100,
      runningBalance: Math.round(balance * 100) / 100,
    });
  }

  return weeks;
}

/**
 * Monthly cashflow timeline (uses existing monthlyTotals internally).
 */
export function monthlyCashflowTimeline(
  transactions: Transaction[],
): CashflowPoint[] {
  const totals = monthlyTotals(transactions);
  let balance = 0;

  return totals.map((m) => {
    balance += m.income - m.expense;
    return {
      date: m.month + "-01",
      income: m.income,
      expense: m.expense,
      net: m.income - m.expense,
      runningBalance: Math.round(balance * 100) / 100,
    };
  });
}

/**
 * Net cashflow — total income minus total expenses.
 */
export function netCashflow(
  transactions: Transaction[],
): number {
  const income = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = Math.abs(transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));
  return Math.round((income - expenses) * 100) / 100;
}

/**
 * Cashflow volatility — standard deviation of monthly net cashflow.
 */
export function cashflowVolatility(
  transactions: Transaction[],
): number | null {
  const totals = monthlyTotals(transactions).filter((m) => m.income > 0 || m.expense > 0);
  if (totals.length < 2) return null;

  const nets = totals.map((m) => m.income - m.expense);
  const avg = nets.reduce((s, n) => s + n, 0) / nets.length;
  const variance = nets.reduce((s, n) => s + Math.pow(n - avg, 2), 0) / nets.length;
  return Math.round(Math.sqrt(variance) * 100) / 100;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function groupByDate(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const date = t.date;
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date)!.push(t);
  }
  return groups;
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
