// ─── Report Modes ───────────────────────────────────────────────────────────
// Week / Month / Quarter / Year report modes for scoping financial data.

import type { Transaction } from "@/lib/data/types";

export type ReportMode = "week" | "month" | "quarter" | "year";

export type ReportPeriod = {
  label: string;
  startDate: string; // ISO date
  endDate: string; // ISO date (inclusive)
  mode: ReportMode;
  /** Month key for backward compatibility with existing finance helpers */
  monthKey: string;
};

const MODE_LABELS: Record<ReportMode, string> = {
  week: "Week",
  month: "Month",
  quarter: "Quarter",
  year: "Year",
};

export function getReportModeLabel(mode: ReportMode): string {
  return MODE_LABELS[mode];
}

/**
 * Determine the report period for a given mode and anchor date.
 */
export function getReportPeriod(
  mode: ReportMode,
  anchorDate: string,
): ReportPeriod {
  const date = new Date(`${anchorDate}T12:00:00`);

  switch (mode) {
    case "week": {
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(date);
      monday.setDate(diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const startDate = formatDate(monday);
      const endDate = formatDate(sunday);
      return {
        label: `${formatShort(monday)} – ${formatShort(sunday)}`,
        startDate,
        endDate,
        mode: "week",
        monthKey: startDate.slice(0, 7),
      };
    }

    case "month": {
      const year = date.getFullYear();
      const month = date.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return {
        label: date.toLocaleString("default", { month: "long", year: "numeric" }),
        startDate: formatDate(start),
        endDate: formatDate(end),
        mode: "month",
        monthKey: anchorDate.slice(0, 7),
      };
    }

    case "quarter": {
      const q = Math.floor(date.getMonth() / 3);
      const qStart = new Date(date.getFullYear(), q * 3, 1);
      const qEnd = new Date(date.getFullYear(), q * 3 + 3, 0);
      return {
        label: `Q${q + 1} ${date.getFullYear()}`,
        startDate: formatDate(qStart),
        endDate: formatDate(qEnd),
        mode: "quarter",
        monthKey: anchorDate.slice(0, 7),
      };
    }

    case "year": {
      const start = new Date(date.getFullYear(), 0, 1);
      const end = new Date(date.getFullYear(), 11, 31);
      return {
        label: `${date.getFullYear()}`,
        startDate: formatDate(start),
        endDate: formatDate(end),
        mode: "year",
        monthKey: anchorDate.slice(0, 7),
      };
    }
  }
}

/**
 * Filter transactions to those within a report period.
 */
export function transactionsInPeriod(
  transactions: Transaction[],
  period: ReportPeriod,
): Transaction[] {
  return transactions.filter((t) => {
    return t.date >= period.startDate && t.date <= period.endDate;
  });
}

/**
 * Get previous period for comparison.
 */
export function getPreviousPeriod(period: ReportPeriod): ReportPeriod {
  const anchor = new Date(period.startDate + "T12:00:00");

  switch (period.mode) {
    case "week": {
      const prev = new Date(anchor);
      prev.setDate(prev.getDate() - 7);
      return getReportPeriod("week", formatDate(prev));
    }
    case "month": {
      const prev = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1);
      return getReportPeriod("month", formatDate(prev));
    }
    case "quarter": {
      const prev = new Date(anchor.getFullYear(), anchor.getMonth() - 3, 1);
      return getReportPeriod("quarter", formatDate(prev));
    }
    case "year": {
      return getReportPeriod("year", `${anchor.getFullYear() - 1}-01-01`);
    }
  }
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatShort(date: Date): string {
  return date.toLocaleString("default", { month: "short", day: "numeric" });
}

/**
 * Compute average daily expense/income for a period.
 */
export function dailyAverage(
  transactions: Transaction[],
  period: ReportPeriod,
): { income: number; expense: number; net: number } {
  const txns = transactionsInPeriod(transactions, period);
  const days = Math.max(1, daysBetween(period.startDate, period.endDate));
  const income = txns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0) / days;
  const expense = Math.abs(txns.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)) / days;
  return {
    income: Math.round(income * 100) / 100,
    expense: Math.round(expense * 100) / 100,
    net: Math.round((income - expense) * 100) / 100,
  };
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start + "T12:00:00").getTime();
  const e = new Date(end + "T12:00:00").getTime();
  return Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
}
