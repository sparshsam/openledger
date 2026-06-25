import { describe, it, expect } from "vitest";
import {
  computeExpenseComparison,
  computeIncomeComparison,
  computeCashflowComparison,
} from "../comparisons";
import type { Transaction } from "@/lib/data/types";

const txns: Transaction[] = [
  // 2026-06 (current): expenses=2000, income=5000
  { id: "1", date: "2026-06-15", description: "Salary", category: "Income", accountId: "a1", amount: 5000 },
  { id: "2", date: "2026-06-10", description: "Rent", category: "Housing", accountId: "a1", amount: -1500 },
  { id: "3", date: "2026-06-05", description: "Groceries", category: "Food", accountId: "a1", amount: -500 },

  // 2026-05: expenses=400, income=2000
  { id: "4", date: "2026-05-15", description: "Freelance", category: "Income", accountId: "a1", amount: 2000 },
  { id: "5", date: "2026-05-10", description: "Groceries", category: "Food", accountId: "a1", amount: -400 },

  // 2026-04: expenses=300
  { id: "6", date: "2026-04-10", description: "Utilities", category: "Housing", accountId: "a1", amount: -300 },

  // 2026-03: expenses=350
  { id: "7", date: "2026-03-10", description: "Utilities", category: "Housing", accountId: "a1", amount: -350 },

  // 2026-02: expenses=200
  { id: "8", date: "2026-02-10", description: "Utilities", category: "Housing", accountId: "a1", amount: -200 },

  // 2026-01: expenses=250
  { id: "9", date: "2026-01-10", description: "Utilities", category: "Housing", accountId: "a1", amount: -250 },

  // 2025-12: expenses=300
  { id: "10", date: "2025-12-10", description: "Utilities", category: "Housing", accountId: "a1", amount: -300 },

  // 2025-06 (same month last year): expenses=1800, income=4500
  { id: "11", date: "2025-06-15", description: "Salary", category: "Income", accountId: "a1", amount: 4500 },
  { id: "12", date: "2025-06-10", description: "Rent", category: "Housing", accountId: "a1", amount: -1800 },
];

describe("computeExpenseComparison", () => {
  it("last_month returns correct delta", () => {
    const result = computeExpenseComparison(txns, "2026-06", "last_month");
    expect(result).not.toBeNull();
    expect(result!.current).toBe(2000);
    expect(result!.previous).toBe(400);
    expect(result!.pctChange).toBe(400); // (2000-400)/400*100
    expect(result!.absChange).toBe(1600);
    expect(result!.direction).toBe("up");
    expect(result!.label).toBe("vs last month");
  });

  it("last_3_months returns correct average comparison", () => {
    const result = computeExpenseComparison(txns, "2026-06", "last_3_months");
    expect(result).not.toBeNull();
    expect(result!.current).toBe(2000);
    // Average of May(400), Apr(300), Mar(350) = 350
    expect(result!.previous).toBe(350);
    expect(result!.pctChange).toBe(471); // (2000-350)/350*100 ≈ 471.4 → rounded 471
    expect(result!.absChange).toBe(1650);
    expect(result!.direction).toBe("up");
    expect(result!.label).toBe("vs 3-month average");
  });

  it("last_6_months returns correct average comparison", () => {
    const result = computeExpenseComparison(txns, "2026-06", "last_6_months");
    expect(result).not.toBeNull();
    expect(result!.current).toBe(2000);
    // Average of May(400), Apr(300), Mar(350), Feb(200), Jan(250), Dec(300) = 1800/6 = 300
    expect(result!.previous).toBe(300);
    expect(result!.pctChange).toBe(567); // (2000-300)/300*100 ≈ 566.7 → rounded 567
    expect(result!.absChange).toBe(1700);
    expect(result!.direction).toBe("up");
    expect(result!.label).toBe("vs 6-month average");
  });

  it("last_year returns correct year-over-year", () => {
    const result = computeExpenseComparison(txns, "2026-06", "last_year");
    expect(result).not.toBeNull();
    expect(result!.current).toBe(2000);
    expect(result!.previous).toBe(1800);
    expect(result!.pctChange).toBe(11); // (2000-1800)/1800*100 ≈ 11.1 → rounded 11
    expect(result!.absChange).toBe(200);
    expect(result!.direction).toBe("up");
    expect(result!.label).toBe("vs last year");
  });

  it("this_week returns daily average comparison", () => {
    const result = computeExpenseComparison(txns, "2026-06", "this_week");
    expect(result).not.toBeNull();
    // June has 30 days, May has 31
    // current daily avg = 2000/30 ≈ 66.67
    // previous daily avg = 400/31 ≈ 12.90
    expect(result!.current).toBeCloseTo(66.67, 0);
    expect(result!.previous).toBeCloseTo(12.90, 0);
    expect(result!.pctChange).toBeGreaterThan(400);
    expect(result!.direction).toBe("up");
    expect(result!.label).toBe("vs last week");
  });

  it("last_week returns daily average comparison", () => {
    const result = computeExpenseComparison(txns, "2026-06", "last_week");
    expect(result).not.toBeNull();
    expect(result!.label).toBe("week over week");
    expect(result!.direction).toBe("up");
  });

  it("returns null when insufficient data", () => {
    expect(computeExpenseComparison([], "2026-06", "last_month")).toBeNull();
  });

  it("returns null when both periods have zero expenses", () => {
    const incomeOnly: Transaction[] = [
      { id: "1", date: "2026-06-15", description: "Salary", category: "Income", accountId: "a1", amount: 5000 },
    ];
    expect(computeExpenseComparison(incomeOnly, "2026-06", "last_month")).toBeNull();
  });
});

describe("computeIncomeComparison", () => {
  it("last_month returns correct delta", () => {
    const result = computeIncomeComparison(txns, "2026-06", "last_month");
    expect(result).not.toBeNull();
    expect(result!.current).toBe(5000);
    expect(result!.previous).toBe(2000);
    expect(result!.pctChange).toBe(150); // (5000-2000)/2000*100
    expect(result!.absChange).toBe(3000);
    expect(result!.direction).toBe("up");
    expect(result!.label).toBe("vs last month");
  });

  it("last_year returns correct year-over-year", () => {
    const result = computeIncomeComparison(txns, "2026-06", "last_year");
    expect(result).not.toBeNull();
    expect(result!.current).toBe(5000);
    expect(result!.previous).toBe(4500);
    expect(result!.pctChange).toBe(11); // (5000-4500)/4500*100 ≈ 11.1 → rounded 11
    expect(result!.absChange).toBe(500);
    expect(result!.direction).toBe("up");
  });
});

describe("computeCashflowComparison", () => {
  it("last_month returns correct delta", () => {
    const result = computeCashflowComparison(txns, "2026-06", "last_month");
    expect(result).not.toBeNull();
    // current cashflow = 5000 - 2000 = 3000
    expect(result!.current).toBe(3000);
    // previous cashflow = 2000 - 400 = 1600
    expect(result!.previous).toBe(1600);
    expect(result!.pctChange).toBe(88); // (3000-1600)/1600*100 = 87.5 → rounded 88
    expect(result!.absChange).toBe(1400);
    expect(result!.direction).toBe("up");
  });

  it("returns same direction for positive cashflow growth", () => {
    const result = computeCashflowComparison(txns, "2026-06", "last_month");
    expect(result).not.toBeNull();
    expect(result!.direction).toBe("up");
  });
});
