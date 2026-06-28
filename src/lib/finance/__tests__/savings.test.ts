import { describe, it, expect } from "vitest";
import type { Transaction } from "@/lib/data/types";
import {
  savingsRate,
  monthlySavingsRates,
  averageSavingsRate,
  incomeConsistency,
  incomeStabilityLabel,
  incomeGaps,
} from "../savings";

describe("savingsRate", () => {
  it("calculates savings rate as percentage of income", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-01-15", description: "Salary", amount: 5000, accountId: "a", category: "Income" },
      { id: "2", date: "2024-01-15", description: "Rent", amount: -1500, accountId: "a", category: "Housing" },
      { id: "3", date: "2024-01-15", description: "Food", amount: -500, accountId: "a", category: "Food" },
    ];
    // (5000 - 2000) / 5000 = 0.6 → 60%
    expect(savingsRate(txns)).toBeCloseTo(60, 0);
  });

  it("returns null for zero income", () => {
    expect(savingsRate([])).toBeNull();
  });
});

describe("monthlySavingsRates", () => {
  it("computes rate per month", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-01-01", description: "Salary", amount: 5000, accountId: "a", category: "Income" },
      { id: "2", date: "2024-01-15", description: "Rent", amount: -1500, accountId: "a", category: "Housing" },
      { id: "3", date: "2024-02-01", description: "Salary", amount: 5000, accountId: "a", category: "Income" },
      { id: "4", date: "2024-02-15", description: "Rent", amount: -1500, accountId: "a", category: "Housing" },
    ];
    const rates = monthlySavingsRates(txns);
    expect(rates).toHaveLength(2);
    expect(rates[0].rate).toBeCloseTo(70, 0);
  });
});

describe("averageSavingsRate", () => {
  it("computes average over N months", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-01-01", description: "Income", amount: 1000, accountId: "a", category: "Income" },
      { id: "2", date: "2024-01-15", description: "Expense", amount: -200, accountId: "a", category: "Food" },
      { id: "3", date: "2024-02-01", description: "Income", amount: 1000, accountId: "a", category: "Income" },
      { id: "4", date: "2024-02-15", description: "Expense", amount: -200, accountId: "a", category: "Food" },
      { id: "5", date: "2024-03-01", description: "Income", amount: 1000, accountId: "a", category: "Income" },
      { id: "6", date: "2024-03-15", description: "Expense", amount: -200, accountId: "a", category: "Food" },
    ];
    const avg = averageSavingsRate(txns, 3);
    expect(avg).toBeCloseTo(80, 0);
  });

  it("returns null for no data", () => {
    expect(averageSavingsRate([], 3)).toBeNull();
  });
});

describe("incomeConsistency", () => {
  it("scores 100 for identical monthly income", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-01-01", description: "Salary", amount: 5000, accountId: "a", category: "Income" },
      { id: "2", date: "2024-02-01", description: "Salary", amount: 5000, accountId: "a", category: "Income" },
      { id: "3", date: "2024-03-01", description: "Salary", amount: 5000, accountId: "a", category: "Income" },
    ];
    expect(incomeConsistency(txns)).toBeGreaterThanOrEqual(90);
  });

  it("scores lower for variable income", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-01-01", description: "Income", amount: 4000, accountId: "a", category: "Income" },
      { id: "2", date: "2024-02-01", description: "Income", amount: 5000, accountId: "a", category: "Income" },
      { id: "3", date: "2024-03-01", description: "Income", amount: 3500, accountId: "a", category: "Income" },
    ];
    const score = incomeConsistency(txns);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });

  it("returns 0 for no transactions", () => {
    expect(incomeConsistency([])).toBe(0);
  });
});

describe("incomeStabilityLabel", () => {
  it("returns correct labels", () => {
    expect(incomeStabilityLabel(95)).toBe("Very stable");
    expect(incomeStabilityLabel(80)).toBe("Stable");
    expect(incomeStabilityLabel(60)).toBe("Moderate");
    expect(incomeStabilityLabel(40)).toBe("Variable");
    expect(incomeStabilityLabel(10)).toBe("Highly variable");
  });
});

describe("incomeGaps", () => {
  it("detects months with significantly lower income", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-01-01", description: "Salary", amount: 5000, accountId: "a", category: "Income" },
      { id: "2", date: "2024-02-01", description: "Salary", amount: 5000, accountId: "a", category: "Income" },
      { id: "3", date: "2024-03-01", description: "Income", amount: 500, accountId: "a", category: "Income" },
    ];
    const gaps = incomeGaps(txns);
    expect(gaps.some((g) => g.gap)).toBe(true);
  });
});
