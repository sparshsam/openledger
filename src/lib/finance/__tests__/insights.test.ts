import { describe, it, expect } from "vitest";
import {
  largestExpenseThisMonth,
  topSpendingCategory,
  monthOverMonthChange,
  findRecurringTransactions,
  lowBalanceAlerts,
  categorySpendingTrends,
  largestSpendingIncreases,
  largestSpendingDecreases,
  categoryGrowthRate,
  merchantSummaries,
  topMerchants,
  newMerchants,
} from "../insights";
import type { Account, Transaction } from "@/lib/data/types";

const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

describe("largestExpenseThisMonth", () => {
  it("returns the single largest expense for the current month", () => {
    const txns: Transaction[] = [
      { id: "1", date: `${currentMonth}-01`, description: "Rent", category: "Rent", accountId: "a", amount: -1500 },
      { id: "2", date: `${currentMonth}-10`, description: "Groceries", category: "Groceries", accountId: "a", amount: -300 },
      { id: "3", date: `${currentMonth}-15`, description: "Salary", category: "Income", accountId: "a", amount: 5000 },
    ];
    expect(largestExpenseThisMonth(txns)).toEqual({ description: "Rent", amount: -1500 });
  });

  it("returns null when no expenses this month", () => {
    expect(largestExpenseThisMonth([])).toBeNull();
  });
});

describe("topSpendingCategory", () => {
  it("returns category with highest absolute expense total", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2026-05-01", description: "Rent", category: "Rent", accountId: "a", amount: -1500 },
      { id: "2", date: "2026-05-10", description: "Groceries", category: "Groceries", accountId: "a", amount: -200 },
      { id: "3", date: "2026-05-15", description: "More Groceries", category: "Groceries", accountId: "a", amount: -100 },
    ];
    expect(topSpendingCategory(txns)).toEqual({ category: "Rent", total: -1500 });
  });

  it("returns null for empty input", () => {
    expect(topSpendingCategory([])).toBeNull();
  });
});

describe("monthOverMonthChange", () => {
  it("calculates percentage change in total expenses between last two months", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2026-05-01", description: "Rent", category: "Rent", accountId: "a", amount: -1500 },
      { id: "2", date: "2026-05-10", description: "Groceries", category: "Groceries", accountId: "a", amount: -200 },
      { id: "3", date: "2026-04-01", description: "Rent", category: "Rent", accountId: "a", amount: -1500 },
    ];
    const change = monthOverMonthChange(txns);
    expect(change).not.toBeNull();
    expect(change).toBeCloseTo(13.33, 1);
  });

  it("returns null when fewer than 2 months of data", () => {
    expect(monthOverMonthChange([])).toBeNull();
  });
});

describe("findRecurringTransactions", () => {
  it("finds transactions with same description and amount appearing 2+ times", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2026-05-01", description: "Netflix", category: "Subscriptions", accountId: "a", amount: -15.99 },
      { id: "2", date: "2026-04-01", description: "Netflix", category: "Subscriptions", accountId: "a", amount: -15.99 },
      { id: "3", date: "2026-05-10", description: "Coffee", category: "Food & Drink", accountId: "a", amount: -4.5 },
    ];
    const recurring = findRecurringTransactions(txns);
    expect(recurring).toHaveLength(1);
    expect(recurring[0].description).toBe("Netflix");
    expect(recurring[0].count).toBe(2);
  });

  it("returns empty array when no recurring transactions", () => {
    expect(findRecurringTransactions([])).toEqual([]);
  });
});

describe("lowBalanceAlerts", () => {
  it("flags accounts with balance below 100", () => {
    const accounts: Account[] = [
      { id: "a", name: "Chequing", kind: "chequing" as const, subtitle: "", balance: 50, currency: "CAD" },
      { id: "b", name: "Savings", kind: "savings" as const, subtitle: "", balance: 5000, currency: "CAD" },
    ];
    const alerts = lowBalanceAlerts(accounts, []);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].accountName).toBe("Chequing");
  });

  it("returns empty array when all balances are healthy", () => {
    const accounts: Account[] = [
      { id: "a", name: "Chequing", kind: "chequing" as const, subtitle: "", balance: 500, currency: "CAD" },
    ];
    expect(lowBalanceAlerts(accounts, [])).toEqual([]);
  });
});

// ─── Spending Trends ──────────────────────────────────────────────────────

describe("categorySpendingTrends", () => {
  it("compares spending between two months", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-02-01", description: "Rent", category: "Housing", accountId: "a", amount: -100 },
      { id: "2", date: "2024-02-05", description: "Transit", category: "Transport", accountId: "a", amount: -50 },
      { id: "3", date: "2024-01-01", description: "Rent", category: "Housing", accountId: "a", amount: -80 },
    ];
    const trends = categorySpendingTrends(txns, "2024-02", "2024-01");
    const housing = trends.find((t) => t.category === "Housing");
    expect(housing).toBeDefined();
    expect(housing!.current).toBe(100);
    expect(housing!.previous).toBe(80);
    expect(housing!.direction).toBe("up");
  });

  it("returns empty for empty input", () => {
    expect(categorySpendingTrends([], "2024-02", "2024-01")).toEqual([]);
  });
});

describe("largestSpendingIncreases", () => {
  it("returns top increases only", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-02-01", description: "Food", category: "Food", accountId: "a", amount: -200 },
      { id: "2", date: "2024-01-01", description: "Food", category: "Food", accountId: "a", amount: -50 },
    ];
    const inc = largestSpendingIncreases(txns, "2024-02", "2024-01");
    expect(inc.length).toBeGreaterThan(0);
    expect(inc.every((i) => i.direction === "up")).toBe(true);
  });
});

describe("largestSpendingDecreases", () => {
  it("returns top decreases only", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-02-01", description: "Food", category: "Food", accountId: "a", amount: -50 },
      { id: "2", date: "2024-01-01", description: "Food", category: "Food", accountId: "a", amount: -200 },
    ];
    const dec = largestSpendingDecreases(txns, "2024-02", "2024-01");
    expect(dec.length).toBeGreaterThan(0);
    expect(dec.every((d) => d.direction === "down")).toBe(true);
  });
});

describe("categoryGrowthRate", () => {
  it("detects growing category", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-01-01", description: "Food", category: "Food", accountId: "a", amount: -50 },
      { id: "2", date: "2024-02-01", description: "Food", category: "Food", accountId: "a", amount: -100 },
      { id: "3", date: "2024-03-01", description: "Food", category: "Food", accountId: "a", amount: -150 },
    ];
    expect(categoryGrowthRate(txns, "Food", 3).trend).toBe("growing");
  });

  it("detects declining category", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-01-01", description: "Food", category: "Food", accountId: "a", amount: -150 },
      { id: "2", date: "2024-02-01", description: "Food", category: "Food", accountId: "a", amount: -100 },
      { id: "3", date: "2024-03-01", description: "Food", category: "Food", accountId: "a", amount: -50 },
    ];
    expect(categoryGrowthRate(txns, "Food", 3).trend).toBe("declining");
  });
});

// ─── Merchant Summaries ───────────────────────────────────────────────────

describe("merchantSummaries", () => {
  it("groups transactions by merchant", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-01-01", description: "Coffee", merchant: "Starbucks", category: "Food", accountId: "a", amount: -5.5 },
      { id: "2", date: "2024-01-02", description: "Coffee", merchant: "Starbucks", category: "Food", accountId: "a", amount: -5.5 },
      { id: "3", date: "2024-01-03", description: "Book", merchant: "Amazon", category: "Shopping", accountId: "a", amount: -50 },
    ];
    const summaries = merchantSummaries(txns);
    expect(summaries).toHaveLength(2);
    const sbux = summaries.find((s) => s.merchant === "Starbucks");
    expect(sbux).toBeDefined();
    expect(sbux!.count).toBe(2);
    expect(sbux!.total).toBe(11);
  });

  it("uses description when merchant is missing", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-01-01", description: "Netflix", category: "Subscriptions", accountId: "a", amount: -15.99 },
      { id: "2", date: "2024-02-01", description: "Netflix", category: "Subscriptions", accountId: "a", amount: -15.99 },
    ];
    const summaries = merchantSummaries(txns);
    expect(summaries[0].merchant).toBe("Netflix");
  });
});

describe("topMerchants", () => {
  it("limits results", () => {
    const txns: Transaction[] = Array.from({ length: 20 }, (_, i) => ({
      id: String(i), date: "2024-01-01", description: `M${i}`, merchant: `M${i}`, category: "Shopping", accountId: "a", amount: -(i + 1) * 10,
    }));
    expect(topMerchants(txns, 5)).toHaveLength(5);
  });
});

describe("newMerchants", () => {
  it("finds merchants first seen in the given month", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-01-01", description: "Old", merchant: "Old Shop", category: "Shopping", accountId: "a", amount: -10 },
      { id: "2", date: "2024-02-15", description: "New", merchant: "New Shop", category: "Shopping", accountId: "a", amount: -20 },
    ];
    const newM = newMerchants(txns, "2024-02");
    expect(newM).toHaveLength(1);
    expect(newM[0].merchant).toBe("New Shop");
  });
});
