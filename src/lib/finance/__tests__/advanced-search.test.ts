import { describe, it, expect } from "vitest";
import type { Transaction } from "@/lib/data/types";
import {
  searchTransactions,
  savedSearchToFilters,
  filtersToSavedSearch,
  buildTimeline,
  previousActiveMonth,
  nextActiveMonth,
} from "../advanced-search";

const txns: Transaction[] = [
  { id: "1", date: "2024-01-01", description: "Salary January", amount: 5000, accountId: "a1", category: "Income" },
  { id: "2", date: "2024-01-05", description: "Rent", amount: -1500, accountId: "a1", category: "Housing", merchant: "Landlord" },
  { id: "3", date: "2024-01-10", description: "Groceries", amount: -200, accountId: "a1", category: "Food", merchant: "Loblaws" },
  { id: "4", date: "2024-02-01", description: "Salary February", amount: 5000, accountId: "a1", category: "Income" },
  { id: "5", date: "2024-02-05", description: "Rent", amount: -1500, accountId: "a1", category: "Housing", merchant: "Landlord" },
  { id: "6", date: "2024-02-15", description: "Amazon order", amount: -85, accountId: "a1", category: "Shopping", merchant: "Amazon", note: "books" },
];

describe("searchTransactions", () => {
  it("finds by text query", () => {
    const results = searchTransactions(txns, { query: "Salary" });
    expect(results).toHaveLength(2);
  });

  it("filters by date range", () => {
    const results = searchTransactions(txns, { dateFrom: "2024-02-01", dateTo: "2024-02-29" });
    expect(results).toHaveLength(3);
  });

  it("filters by category", () => {
    const results = searchTransactions(txns, { categories: ["Food"] });
    expect(results).toHaveLength(1);
  });

  it("filters by account", () => {
    const results = searchTransactions(txns, { accountIds: ["a1"] });
    expect(results).toHaveLength(6);
  });

  it("filters by merchant", () => {
    const results = searchTransactions(txns, { merchants: ["Landlord"] });
    expect(results).toHaveLength(2);
  });

  it("filters by amount range", () => {
    // Only expenses ≤ -200: -1500 (Rent ×2) and -200 (Groceries) → 3
    const results = searchTransactions(txns, { maxAmount: -200 });
    expect(results).toHaveLength(3);
  });

  it("filters by source", () => {
    const results = searchTransactions(txns, { sources: ["manual"] });
    expect(results).toHaveLength(0);
  });

  it("searches notes", () => {
    const results = searchTransactions(txns, { query: "books" });
    expect(results).toHaveLength(1);
  });

  it("sorts by amount ascending", () => {
    const results = searchTransactions(txns, { sortBy: "amount", sortDir: "asc" });
    expect(results[0].transaction.amount).toBe(-1500);
  });

  it("sorts by amount descending", () => {
    const results = searchTransactions(txns, { sortBy: "amount", sortDir: "desc" });
    expect(results[0].transaction.amount).toBe(5000);
  });
});

describe("savedSearchToFilters", () => {
  it("converts saved search to filters", () => {
    const saved = {
      id: "s1", name: "Food", query: "food", category: "Food", sortBy: "amount" as const, sortDir: "desc" as const,
    };
    const filters = savedSearchToFilters(saved);
    expect(filters.query).toBe("food");
    expect(filters.categories).toEqual(["Food"]);
  });
});

describe("filtersToSavedSearch", () => {
  it("converts filters to saved search", () => {
    const saved = filtersToSavedSearch("Test", { query: "test", categories: ["Food"] });
    expect(saved.name).toBe("Test");
    expect(saved.query).toBe("test");
    expect(saved.category).toBe("Food");
  });
});

describe("buildTimeline", () => {
  it("builds month timeline from transactions", () => {
    const timeline = buildTimeline(txns);
    expect(timeline.length).toBeGreaterThanOrEqual(2);
    expect(timeline[0].month).toBe("2024-02");
    expect(timeline[0].transactionCount).toBe(3);
  });
});

describe("previousActiveMonth / nextActiveMonth", () => {
  it("finds previous and next months", () => {
    expect(previousActiveMonth(txns, "2024-02")).toBe("2024-01");
    expect(nextActiveMonth(txns, "2024-01")).toBe("2024-02");
  });

  it("returns null at boundaries", () => {
    expect(previousActiveMonth(txns, "2024-01")).toBeNull();
    expect(nextActiveMonth(txns, "2024-02")).toBeNull();
  });
});
