import { describe, it, expect } from "vitest";
import type { Transaction } from "@/lib/data/types";
import {
  computeYearSummary,
  computeMonthlyBreakdown,
  computeYearOverYear,
  computeCategoryReport,
  computeMerchantReport,
  computeCashflowReport,
} from "../reports";

const baseTxns: Transaction[] = [
  { id: "1", date: "2026-01-15", description: "Salary", amount: 5000, category: "Income", accountId: "a" },
  { id: "2", date: "2026-01-20", description: "Groceries", amount: -200, category: "Food", accountId: "a" },
  { id: "3", date: "2026-02-10", description: "Rent", amount: -1500, category: "Housing", accountId: "a" },
  { id: "4", date: "2026-02-15", description: "Salary", amount: 5000, category: "Income", accountId: "a" },
  { id: "5", date: "2026-03-05", description: "Restaurant", amount: -80, category: "Food", accountId: "a", merchant: "Pizza Place" },
  { id: "6", date: "2026-03-20", description: "Groceries", amount: -150, category: "Food", accountId: "a" },
  { id: "7", date: "2025-12-01", description: "Holiday bonus", amount: 1000, category: "Income", accountId: "a" },
];

describe("computeYearSummary", () => {
  it("computes income, expenses, net for a year", () => {
    const result = computeYearSummary(baseTxns, "2026");
    expect(result.income).toBe(10000);
    expect(result.expenses).toBe(1930);
    expect(result.net).toBe(8070);
    expect(result.transactionCount).toBe(6);
  });

  it("identifies top category", () => {
    const result = computeYearSummary(baseTxns, "2026");
    // Housing (1500 rent) > Food (200+80+150=430)
    expect(result.topCategory?.category).toBe("Housing");
  });

  it("returns zeroes for empty year", () => {
    const result = computeYearSummary(baseTxns, "2020");
    expect(result.income).toBe(0);
    expect(result.expenses).toBe(0);
    expect(result.net).toBe(0);
    expect(result.transactionCount).toBe(0);
    expect(result.topCategory).toBeNull();
  });

  it("identifies best and worst months", () => {
    const result = computeYearSummary(baseTxns, "2026");
    // Jan: 5000-200=4800 net, Feb: 5000-1500=3500 net, Mar: 0-230=-230 net
    expect(result.bestMonth?.month).toBe("2026-01");
    expect(result.worstMonth?.month).toBe("2026-03");
  });
});

describe("computeMonthlyBreakdown", () => {
  it("returns 12 months", () => {
    const breakdown = computeMonthlyBreakdown(baseTxns, "2026");
    expect(breakdown).toHaveLength(12);
  });

  it("computes correct values for month with data", () => {
    const breakdown = computeMonthlyBreakdown(baseTxns, "2026");
    const jan = breakdown[0];
    expect(jan.month).toBe("2026-01");
    expect(jan.income).toBe(5000);
    expect(jan.expenses).toBe(200);
    expect(jan.net).toBe(4800);
  });

  it("computes zeroes for months without data", () => {
    const breakdown = computeMonthlyBreakdown(baseTxns, "2026");
    const apr = breakdown[3];
    expect(apr.income).toBe(0);
    expect(apr.expenses).toBe(0);
    expect(apr.net).toBe(0);
  });
});

describe("computeYearOverYear", () => {
  it("compares with previous year", () => {
    const result = computeYearOverYear(baseTxns, "2026", "2025");
    expect(result.currentYear.year).toBe("2026");
    expect(result.previousYear).not.toBeNull();
    expect(result.previousYear?.year).toBe("2025");
  });

  it("returns comparison when previous year exists", () => {
    const result = computeYearOverYear(baseTxns, "2026", "2025");
    // 2025 has 1000 income, 2026 has 10000 income = 900% increase
    expect(result.incomeChange).toBe(900);
    expect(result.previousYear).not.toBeNull();
    expect(result.previousYear?.income).toBe(1000);
  });

  it("calculates changes correctly", () => {
    const result = computeYearOverYear(baseTxns, "2026", "2025");
    expect(result.currentYear.income).toBe(10000);
  });
});

describe("computeCategoryReport", () => {
  it("returns category report with totals", () => {
    const result = computeCategoryReport(baseTxns, "Food");
    expect(result.category).toBe("Food");
    expect(result.totalSpent).toBe(430);
    expect(result.transactionCount).toBe(3);
    expect(result.averagePerTransaction).toBeCloseTo(143.33, 1);
  });

  it("identifies top merchants", () => {
    const result = computeCategoryReport(baseTxns, "Food");
    expect(result.topMerchants.length).toBeGreaterThan(0);
  });

  it("returns empty report for unknown category", () => {
    const result = computeCategoryReport(baseTxns, "Unknown");
    expect(result.totalSpent).toBe(0);
    expect(result.transactionCount).toBe(0);
  });
});

describe("computeMerchantReport", () => {
  it("returns merchant report with totals", () => {
    const result = computeMerchantReport(baseTxns, "Pizza Place");
    expect(result.merchant).toBe("Pizza Place");
    expect(result.totalSpent).toBe(80);
    expect(result.transactionCount).toBe(1);
    expect(result.firstSeen).toBe("2026-03-05");
    expect(result.lastSeen).toBe("2026-03-05");
  });

  it("returns empty for unknown merchant", () => {
    const result = computeMerchantReport(baseTxns, "Nonexistent");
    expect(result.totalSpent).toBe(0);
    expect(result.transactionCount).toBe(0);
  });
});

describe("computeCashflowReport", () => {
  it("returns cashflow data points", () => {
    const result = computeCashflowReport(baseTxns, 6);
    expect(result.dataPoints.length).toBeGreaterThan(0);
    expect(result.totalIncome).toBeGreaterThan(0);
  });

  it("calculates running balance correctly", () => {
    const result = computeCashflowReport(baseTxns, 6);
    for (const dp of result.dataPoints) {
      expect(dp.runningBalance).toBeDefined();
    }
  });

  it("identifies best and worst months", () => {
    const result = computeCashflowReport(baseTxns, 12);
    expect(result.bestMonth).not.toBeNull();
    expect(result.worstMonth).not.toBeNull();
  });
});
