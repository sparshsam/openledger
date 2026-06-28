import { describe, it, expect } from "vitest";
import type { Transaction } from "@/lib/data/types";
import {
  generateMonthHighlights,
  generateAllMonthHighlights,
  bestAndWorstMonths,
  generateYearSummary,
} from "../highlights";

const txns: Transaction[] = [
  { id: "1", date: "2024-01-01", description: "Salary", amount: 5000, accountId: "a1", category: "Income" },
  { id: "2", date: "2024-01-05", description: "Rent", amount: -1500, accountId: "a1", category: "Housing", merchant: "Landlord" },
  { id: "3", date: "2024-01-10", description: "Groceries", amount: -200, accountId: "a1", category: "Food", merchant: "Loblaws" },
  { id: "4", date: "2024-01-15", description: "Coffee", amount: -5.5, accountId: "a1", category: "Food", merchant: "Starbucks" },
  { id: "5", date: "2024-02-01", description: "Salary", amount: 5000, accountId: "a1", category: "Income" },
  { id: "6", date: "2024-02-05", description: "Rent", amount: -1500, accountId: "a1", category: "Housing", merchant: "Landlord" },
];

describe("generateMonthHighlights", () => {
  it("generates highlights for a month", () => {
    const hl = generateMonthHighlights(txns, "2024-01");
    expect(hl.month).toBe("2024-01");
    expect(hl.transactionCount).toBe(4);
    expect(hl.income).toBe(5000);
    expect(hl.expense).toBe(1705.5);
    expect(hl.savingsRate).not.toBeNull();
    expect(hl.topCategory?.name).toBe("Housing");
    expect(hl.topMerchant?.merchant).toBe("Landlord");
    expect(hl.highlights.length).toBeGreaterThan(0);
  });

  it("handles empty month", () => {
    const hl = generateMonthHighlights([], "2024-03");
    expect(hl.transactionCount).toBe(0);
    expect(hl.topCategory).toBeNull();
    expect(hl.topMerchant).toBeNull();
    expect(hl.largestTransaction).toBeNull();
  });
});

describe("generateAllMonthHighlights", () => {
  it("generates highlights for all months", () => {
    const highlights = generateAllMonthHighlights(txns);
    expect(highlights.length).toBe(2);
    expect(highlights[0].month).toBe("2024-01");
    expect(highlights[1].month).toBe("2024-02");
  });
});

describe("bestAndWorstMonths", () => {
  it("finds best and worst savings months", () => {
    const result = bestAndWorstMonths(txns);
    expect(result.best).not.toBeNull();
    expect(result.worst).not.toBeNull();
    // Both months have same income/expense pattern so rates should be similar
    expect(result.best!.savingsRate).toBeDefined();
  });
});

describe("generateYearSummary", () => {
  it("generates year-level summary", () => {
    const summary = generateYearSummary(txns, "2024");
    expect(summary.totalIncome).toBe(10000);
    expect(summary.totalExpense).toBe(3205.5);
    expect(summary.monthsWithData).toBe(2);
    expect(summary.totalTransactions).toBe(6);
  });
});
