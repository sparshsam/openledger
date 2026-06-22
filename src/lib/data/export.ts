import type { Account, ImportMetadata, LedgerData, Transaction } from "./types";

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
    forecastItems: data.forecastItems,
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

function escapeCsv(value: string | number | undefined | null): string {
  if (value == null) return "";
  const str = String(value);
  // If the value contains commas, quotes, or newlines, wrap in quotes and escape inner quotes
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
  const bom = "﻿"; // BOM for Excel compatibility
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "openledger-export.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}
