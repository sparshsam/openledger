// ─── Advanced Search Engine ─────────────────────────────────────────────────
// Composable filter chain, saved searches, advanced filters,
// timeline navigation, and search utilities.

import type { SavedSearch, Transaction } from "@/lib/data/types";

export type SearchFilters = {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  categories?: string[];
  accountIds?: string[];
  merchants?: string[];
  currencies?: string[];
  sources?: ("demo" | "csv" | "manual")[];
  isTransfer?: boolean;
  hasNote?: boolean;
  sortBy?: "date" | "amount" | "category" | "merchant";
  sortDir?: "asc" | "desc";
};

export type SearchResult = {
  transaction: Transaction;
  relevanceScore?: number;
  highlightedFields?: string[];
};

const SAVED_SEARCHES_KEY = "openledger.savedSearches";

// ─── Saved Search Persistence ───────────────────────────────────────────────

export function loadSavedSearches(): SavedSearch[] {
  try {
    const raw = localStorage.getItem(SAVED_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSavedSearches(searches: SavedSearch[]): void {
  try {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches));
  } catch {
    // Non-critical
  }
}

export function addSavedSearch(search: SavedSearch): SavedSearch[] {
  const current = loadSavedSearches();
  const updated = [search, ...current];
  saveSavedSearches(updated);
  return updated;
}

export function removeSavedSearch(id: string): SavedSearch[] {
  const current = loadSavedSearches();
  const updated = current.filter((s) => s.id !== id);
  saveSavedSearches(updated);
  return updated;
}

// ─── Filter Chain ───────────────────────────────────────────────────────────

/**
 * Apply filter chain to transactions. Each filter is an independent predicate.
 * Returns results sorted by the specified sort key.
 */
export function searchTransactions(
  transactions: Transaction[],
  filters: SearchFilters,
): SearchResult[] {
  let results = [...transactions];

  // Text search across description, merchant, category, and notes
  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter((t) => {
      const searchable = [
        t.description,
        t.merchant ?? "",
        t.category,
        t.subcategory ?? "",
        t.note ?? "",
        t.originalCurrency ?? "",
      ].join(" ").toLowerCase();
      return searchable.includes(q);
    });
  }

  // Date range
  if (filters.dateFrom) results = results.filter((t) => t.date >= filters.dateFrom!);
  if (filters.dateTo) results = results.filter((t) => t.date <= filters.dateTo!);

  // Amount range
  if (filters.minAmount !== undefined) results = results.filter((t) => t.amount >= filters.minAmount!);
  if (filters.maxAmount !== undefined) results = results.filter((t) => t.amount <= filters.maxAmount!);

  // Categories
  if (filters.categories && filters.categories.length > 0) {
    results = results.filter((t) => filters.categories!.includes(t.category));
  }

  // Account IDs
  if (filters.accountIds && filters.accountIds.length > 0) {
    results = results.filter((t) => filters.accountIds!.includes(t.accountId));
  }

  // Merchants
  if (filters.merchants && filters.merchants.length > 0) {
    results = results.filter((t) => t.merchant && filters.merchants!.includes(t.merchant));
  }

  // Currencies
  if (filters.currencies && filters.currencies.length > 0) {
    results = results.filter((t) => t.originalCurrency && filters.currencies!.includes(t.originalCurrency));
  }

  // Source
  if (filters.sources && filters.sources.length > 0) {
    results = results.filter((t) => t.source && filters.sources!.includes(t.source));
  }

  // Transfer filter
  if (filters.isTransfer !== undefined) {
    results = results.filter((t) => (t.isTransfer ?? false) === filters.isTransfer);
  }

  // Has note
  if (filters.hasNote !== undefined) {
    results = results.filter((t) => filters.hasNote ? !!t.note : !t.note);
  }

  // Sort
  const sortKey = filters.sortBy ?? "date";
  const sortDir = filters.sortDir ?? "desc";

  results.sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "date": cmp = a.date.localeCompare(b.date); break;
      case "amount": cmp = a.amount - b.amount; break;
      case "category": cmp = a.category.localeCompare(b.category); break;
      case "merchant": cmp = (a.merchant ?? a.description).localeCompare(b.merchant ?? b.description); break;
    }
    return sortDir === "desc" ? -cmp : cmp;
  });

  return results.map((t) => ({ transaction: t }));
}

/**
 * Convert a SavedSearch to SearchFilters.
 */
export function savedSearchToFilters(saved: SavedSearch): SearchFilters {
  return {
    query: saved.query,
    dateFrom: saved.dateFrom,
    dateTo: saved.dateTo,
    minAmount: saved.minAmount,
    maxAmount: saved.maxAmount,
    categories: saved.category ? [saved.category] : undefined,
    accountIds: saved.accountId ? [saved.accountId] : undefined,
    merchants: saved.merchant ? [saved.merchant] : undefined,
    currencies: saved.currency ? [saved.currency] : undefined,
    sortBy: saved.sortBy,
    sortDir: saved.sortDir,
  };
}

/**
 * Convert SearchFilters to a SavedSearch.
 */
export function filtersToSavedSearch(
  name: string,
  filters: SearchFilters,
): SavedSearch {
  return {
    id: `search-${crypto.randomUUID()}`,
    name,
    query: filters.query,
    category: filters.categories?.[0],
    accountId: filters.accountIds?.[0],
    merchant: filters.merchants?.[0],
    currency: filters.currencies?.[0],
    minAmount: filters.minAmount,
    maxAmount: filters.maxAmount,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
  };
}

// ─── Timeline Navigation ───────────────────────────────────────────────────

export type TimelinePeriod = {
  label: string;
  month: string;
  isCurrent: boolean;
  transactionCount: number;
  income: number;
  expense: number;
};

/**
 * Build a timeline of months with activity summaries.
 */
export function buildTimeline(
  transactions: Transaction[],
): TimelinePeriod[] {
  const monthMap = new Map<string, { count: number; income: number; expense: number }>();

  for (const t of transactions) {
    const month = t.date.slice(0, 7);
    const existing = monthMap.get(month) ?? { count: 0, income: 0, expense: 0 };
    existing.count += 1;
    if (t.amount > 0) existing.income += t.amount;
    else existing.expense += Math.abs(t.amount);
    monthMap.set(month, existing);
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return [...monthMap.entries()]
    .map(([month, data]) => ({
      label: new Date(`${month}-01T12:00:00`).toLocaleString("default", { month: "long", year: "numeric" }),
      month,
      isCurrent: month === currentMonth,
      transactionCount: data.count,
      income: Math.round(data.income * 100) / 100,
      expense: Math.round(data.expense * 100) / 100,
    }))
    .sort((a, b) => b.month.localeCompare(a.month));
}

/**
 * Find the previous month with activity.
 */
export function previousActiveMonth(
  transactions: Transaction[],
  currentMonth: string,
): string | null {
  const months = [...new Set(transactions.map((t) => t.date.slice(0, 7)))]
    .filter((m) => m < currentMonth)
    .sort();
  return months[months.length - 1] ?? null;
}

/**
 * Find the next month with activity.
 */
export function nextActiveMonth(
  transactions: Transaction[],
  currentMonth: string,
): string | null {
  const months = [...new Set(transactions.map((t) => t.date.slice(0, 7)))]
    .filter((m) => m > currentMonth)
    .sort();
  return months[0] ?? null;
}
