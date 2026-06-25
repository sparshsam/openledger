import type { Transaction } from "@/lib/data/types";
import {
  computeMonthExpenses,
  computeMonthIncome,
  computeMonthCashflow,
} from "./totals";

export type ComparisonRange =
  | "this_week"
  | "last_week"
  | "last_month"
  | "last_3_months"
  | "last_6_months"
  | "last_year";

export type ComparisonResult = {
  current: number;
  previous: number;
  pctChange: number | null;
  absChange: number;
  direction: "up" | "down" | "same";
  label: string;
};

const LABELS: Record<ComparisonRange, string> = {
  last_month: "vs last month",
  last_3_months: "vs 3-month average",
  last_6_months: "vs 6-month average",
  last_year: "vs last year",
  this_week: "vs last week",
  last_week: "week over week",
};

function subtractMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const totalMonths = y * 12 + (m - 1) - n;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  return `${newYear}-${String(newMonth).padStart(2, "0")}`;
}

function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

type MetricFn = (transactions: Transaction[], month: string) => number;

function computeComparison(
  transactions: Transaction[],
  month: string,
  range: ComparisonRange,
  metricFn: MetricFn,
): ComparisonResult | null {
  let current: number;
  let previous: number;

  switch (range) {
    case "last_month": {
      current = metricFn(transactions, month);
      previous = metricFn(transactions, subtractMonths(month, 1));
      if (current === 0 && previous === 0) return null;
      break;
    }
    case "last_3_months": {
      current = metricFn(transactions, month);
      const m3 = [1, 2, 3].map((n) => metricFn(transactions, subtractMonths(month, n)));
      previous = m3.reduce((a, b) => a + b, 0) / 3;
      if (current === 0 && previous === 0) return null;
      break;
    }
    case "last_6_months": {
      current = metricFn(transactions, month);
      const m6 = [1, 2, 3, 4, 5, 6].map((n) => metricFn(transactions, subtractMonths(month, n)));
      previous = m6.reduce((a, b) => a + b, 0) / 6;
      if (current === 0 && previous === 0) return null;
      break;
    }
    case "last_year": {
      current = metricFn(transactions, month);
      previous = metricFn(transactions, subtractMonths(month, 12));
      if (current === 0 && previous === 0) return null;
      break;
    }
    case "this_week":
    case "last_week": {
      const currentTotal = metricFn(transactions, month);
      const prevTotal = metricFn(transactions, subtractMonths(month, 1));
      current = currentTotal / daysInMonth(month);
      previous = prevTotal / daysInMonth(subtractMonths(month, 1));
      if (current === 0 && previous === 0) return null;
      break;
    }
    default:
      return null;
  }

  const absChange = Math.round((current - previous) * 100) / 100;
  const pctChange =
    previous === 0
      ? null
      : Math.round(((current - previous) / previous) * 100);

  let direction: "up" | "down" | "same";
  if (pctChange === null) {
    direction = current > previous ? "up" : current < previous ? "down" : "same";
  } else if (pctChange > 0) {
    direction = "up";
  } else if (pctChange < 0) {
    direction = "down";
  } else {
    direction = "same";
  }

  return {
    current: Math.round(current * 100) / 100,
    previous: Math.round(previous * 100) / 100,
    pctChange,
    absChange,
    direction,
    label: LABELS[range],
  };
}

export function computeExpenseComparison(
  transactions: Transaction[],
  month: string,
  range: ComparisonRange,
): ComparisonResult | null {
  return computeComparison(transactions, month, range, computeMonthExpenses);
}

export function computeIncomeComparison(
  transactions: Transaction[],
  month: string,
  range: ComparisonRange,
): ComparisonResult | null {
  return computeComparison(transactions, month, range, computeMonthIncome);
}

export function computeCashflowComparison(
  transactions: Transaction[],
  month: string,
  range: ComparisonRange,
): ComparisonResult | null {
  return computeComparison(transactions, month, range, computeMonthCashflow);
}
