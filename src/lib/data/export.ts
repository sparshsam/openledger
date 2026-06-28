// ─── Data Export ────────────────────────────────────────────────────────────
// Pure functions for JSON, CSV, and enhanced exports.
// Finance engine immutable rule: every value comes from here.

import type {
  Account,
  Budget,
  CurrencySettings,
  Goal,
  ImportMetadata,
  ImportSession,
  LearnedCategory,
  LedgerData,
  MonthlySnapshot,
  FinancialMemory,
  ForecastItem,
  RecurringEntry,
  Transaction,
} from "./types";

// ─── Enhanced Export (v3) ───────────────────────────────────────────────────

export type EnhancedExport = {
  schemaVersion: 3;
  exportedAt: string;
  appVersion: string;
  accounts: Account[];
  transactions: Transaction[];
  monthlySnapshots: MonthlySnapshot[];
  memories: FinancialMemory[];
  forecastItems: ForecastItem[];
  importMetadata: ImportMetadata[];
  importSessions: ImportSession[];
  budgets: Budget[];
  goals: Goal[];
  recurringEntries: RecurringEntry[];
  categoryLearnings: LearnedCategory[];
  currencySettings?: CurrencySettings;
};

export function createEnhancedExport(
  data: {
    accounts: Account[];
    transactions: Transaction[];
    monthlySnapshots: MonthlySnapshot[];
    memories: FinancialMemory[];
    forecastItems?: ForecastItem[];
    importMetadata?: ImportMetadata[];
    importSessions?: ImportSession[];
    budgets?: Budget[];
    goals?: Goal[];
    recurringEntries?: RecurringEntry[];
    categoryLearnings?: LearnedCategory[];
    currencySettings?: CurrencySettings;
  },
): EnhancedExport {
  return {
    schemaVersion: 3,
    exportedAt: new Date().toISOString(),
    appVersion: "0.10.8",
    accounts: data.accounts,
    transactions: data.transactions,
    monthlySnapshots: data.monthlySnapshots,
    memories: data.memories,
    forecastItems: data.forecastItems ?? [],
    importMetadata: data.importMetadata ?? [],
    importSessions: data.importSessions ?? [],
    budgets: data.budgets ?? [],
    goals: data.goals ?? [],
    recurringEntries: data.recurringEntries ?? [],
    categoryLearnings: data.categoryLearnings ?? [],
    currencySettings: data.currencySettings,
  };
}

export function downloadEnhancedExport(
  data: Parameters<typeof createEnhancedExport>[0],
) {
  const payload = JSON.stringify(createEnhancedExport(data), null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `openledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ─── Legacy Export (v1, backward compat) ────────────────────────────────────

export function createLedgerExport(
  data: LedgerData,
  importedTransactions: Transaction[] = data.transactions.filter((transaction) => transaction.source === "csv"),
  importMetadata: ImportMetadata[] = data.importMetadata ?? [],
) {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    accounts: data.accounts,
    transactions: data.transactions,
    importedTransactions,
    importMetadata,
    monthlySnapshots: data.monthlySnapshots,
    memories: data.memories,
    forecastItems: data.forecastItems ?? [],
  };
}

export function downloadLedgerExport(
  data: LedgerData,
  importedTransactions?: Transaction[],
  importMetadata?: ImportMetadata[],
) {
  const payload = JSON.stringify(createLedgerExport(data, importedTransactions, importMetadata), null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "openledger-export.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

// ─── CSV Export ─────────────────────────────────────────────────────────────

export type CsvExportOptions = {
  dateFrom?: string;
  dateTo?: string;
  accountIds?: string[];
  categories?: string[];
  types?: ("income" | "expense")[];
  merchants?: string[];
  includeSubcategory?: boolean;
  includeCurrencyFields?: boolean;
};

function escapeCsv(value: string | number | undefined | null): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function createCsvExport(accounts: Account[], transactions: Transaction[]): string {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const header = "Date,Description,Merchant,Amount,Category,Account,Type,Notes";
  const rows = transactions
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => {
      const accountName = accountMap.get(t.accountId) ?? t.accountId;
      const type = t.amount < 0 ? "expense" : "income";
      return [
        escapeCsv(t.date),
        escapeCsv(t.description),
        escapeCsv(t.merchant),
        Math.abs(t.amount).toFixed(2),
        escapeCsv(t.category),
        escapeCsv(accountName),
        escapeCsv(type),
        escapeCsv(t.note),
      ].join(",");
    });
  return [header, ...rows].join("\n");
}

export function downloadCsvExport(accounts: Account[], transactions: Transaction[]) {
  const csv = createCsvExport(accounts, transactions);
  const bom = "﻿";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "openledger-export.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

// ─── Filtered CSV Export ────────────────────────────────────────────────────

export function createFilteredCsvExport(
  accounts: Account[],
  transactions: Transaction[],
  options: CsvExportOptions = {},
): string {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  let filtered = transactions.slice();

  if (options.dateFrom) filtered = filtered.filter((t) => t.date >= options.dateFrom!);
  if (options.dateTo) filtered = filtered.filter((t) => t.date <= options.dateTo!);
  if (options.accountIds && options.accountIds.length > 0) {
    filtered = filtered.filter((t) => options.accountIds!.includes(t.accountId));
  }
  if (options.categories && options.categories.length > 0) {
    filtered = filtered.filter((t) => options.categories!.includes(t.category));
  }
  if (options.merchants && options.merchants.length > 0) {
    filtered = filtered.filter((t) => {
      const name = t.merchant || t.description;
      return options.merchants!.some((m) => name.toLowerCase().includes(m.toLowerCase()));
    });
  }
  if (options.types && options.types.length > 0) {
    filtered = filtered.filter((t) => {
      if (t.amount < 0) return options.types!.includes("expense");
      return options.types!.includes("income");
    });
  }

  // Build header columns
  const cols = ["Date", "Description", "Merchant", "Amount", "Category"];
  if (options.includeSubcategory) cols.push("Subcategory");
  cols.push("Account", "Type", "Notes");
  if (options.includeCurrencyFields) {
    cols.push("Original Amount", "Original Currency", "Converted Amount", "Exchange Rate");
  }

  const sorted = filtered.sort((a, b) => b.date.localeCompare(a.date));
  const rows = sorted.map((t) => {
    const accountName = accountMap.get(t.accountId) ?? t.accountId;
    const type = t.amount < 0 ? "expense" : "income";
    const row = [
      escapeCsv(t.date),
      escapeCsv(t.description),
      escapeCsv(t.merchant),
      Math.abs(t.amount).toFixed(2),
      escapeCsv(t.category),
    ];
    if (options.includeSubcategory) row.push(escapeCsv(t.subcategory));
    row.push(escapeCsv(accountName), escapeCsv(type), escapeCsv(t.note));
    if (options.includeCurrencyFields) {
      row.push(
        escapeCsv(t.originalAmount?.toFixed(2)),
        escapeCsv(t.originalCurrency),
        escapeCsv(t.convertedAmount?.toFixed(2)),
        escapeCsv(t.exchangeRate?.toFixed(6)),
      );
    }
    return row.join(",");
  });

  return [cols.join(","), ...rows].join("\n");
}

export function downloadFilteredCsvExport(
  accounts: Account[],
  transactions: Transaction[],
  options: CsvExportOptions = {},
  filename = "openledger-export.csv",
) {
  const csv = createFilteredCsvExport(accounts, transactions, options);
  const bom = "﻿";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ─── Report Sharing ─────────────────────────────────────────────────────────

/**
 * Format a report summary as clipboard-friendly text.
 */
export function formatReportSummary(
  title: string,
  rows: Array<{ label: string; value: string }>,
): string {
  const separator = "─".repeat(Math.max(title.length, 40));
  const lines = [
    `OpenLedger — ${title}`,
    separator,
    ...rows.map((r) => `${r.label}: ${r.value}`),
    "",
    `Generated ${new Date().toLocaleDateString()}`,
  ];
  return lines.join("\n");
}

/**
 * Copy text to clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(ta);
    }
  }
}

/**
 * Export report data as a downloadable CSV segment.
 */
export function downloadReportCsv(
  rows: Array<Record<string, string | number | undefined | null>>,
  filename: string,
) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => escapeCsv(row[h]?.toString())).join(","),
    ),
  ].join("\n");
  const bom = "﻿";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
