import { describe, it, expect } from "vitest";
import type { Budget, Transaction } from "@/lib/data/types";
import {
  recommendBudgets,
  assessBudgetHealth,
  calculateRollovers,
  budgetHistory,
  recommendAdjustments,
  forecastBudgets,
  rollingCategoryAverages,
} from "../budget-learning";

function tx(overrides: Partial<Transaction>): Transaction {
  return { id: "1", date: "2024-01-15", description: "T", amount: -10, accountId: "a", category: "Food", ...overrides };
}

function budget(overrides: Partial<Budget>): Budget {
  return { id: "b1", category: "Food", month: "2024-01", amount: 500, ...overrides };
}

describe("recommendBudgets", () => {
  it("generates recommendations from spending data", () => {
    const txns: Transaction[] = [
      tx({ date: "2024-01-01", amount: -100, category: "Food" }),
      tx({ date: "2024-01-15", amount: -50, category: "Food" }),
      tx({ date: "2024-02-01", amount: -120, category: "Food" }),
      tx({ date: "2024-03-01", amount: -110, category: "Food" }),
    ];

    const recs = recommendBudgets(txns, [], 6);
    expect(recs.length).toBeGreaterThan(0);
    const food = recs.find((r) => r.category === "Food");
    expect(food).toBeDefined();
    expect(food!.average).toBeGreaterThan(0);
    expect(food!.monthsOfData).toBeGreaterThanOrEqual(3);
  });

  it("returns empty for no spending data", () => {
    expect(recommendBudgets([])).toEqual([]);
  });
});

describe("rollingCategoryAverages", () => {
  it("computes rolling averages for a category", () => {
    const txns: Transaction[] = [
      tx({ date: "2024-01-01", amount: -100, category: "Food" }),
      tx({ date: "2024-02-01", amount: -150, category: "Food" }),
      tx({ date: "2024-03-01", amount: -200, category: "Food" }),
    ];

    const avgs = rollingCategoryAverages(txns, "Food", 3);
    expect(avgs.length).toBeGreaterThanOrEqual(3);
    expect(avgs[avgs.length - 1].simpleAverage).toBeGreaterThan(0);
  });
});

describe("assessBudgetHealth", () => {
  it("assesses on-track budget", () => {
    // 200 spent on 500 budget = 40% utilization → on-track
    const budgets = [budget({ amount: 500 })];
    const txns: Transaction[] = [tx({ amount: -200 })];
    const health = assessBudgetHealth(budgets, txns, "2024-01");
    expect(health).toHaveLength(1);
    expect(health[0].status).toBe("on-track");
  });

  it("flags over-budget", () => {
    const budgets = [budget({ amount: 100 })];
    const txns: Transaction[] = [
      tx({ amount: -60 }),
      tx({ amount: -60 }),
    ];
    const health = assessBudgetHealth(budgets, txns, "2024-01");
    expect(health[0].status).toBe("over");
  });
});

describe("calculateRollovers", () => {
  it("calculates surplus rollover from previous month", () => {
    const budgets = [budget({ month: "2023-12", amount: 500 })];
    const txns: Transaction[] = [tx({ date: "2023-12-01", amount: -300 })];
    const rollovers = calculateRollovers(budgets, txns, "2024-01");
    expect(rollovers).toHaveLength(1);
    expect(rollovers[0].type).toBe("surplus");
  });
});

describe("budgetHistory", () => {
  it("tracks budget vs actual over time", () => {
    const budgets = [
      budget({ month: "2024-01", amount: 500 }),
      budget({ month: "2024-02", amount: 500 }),
    ];
    const txns: Transaction[] = [
      tx({ date: "2024-01-01", amount: -300 }),
      tx({ date: "2024-02-01", amount: -400 }),
    ];
    const history = budgetHistory(budgets, txns);
    expect(history).toHaveLength(2);
    expect(history[0].utilization).toBe(60);
    expect(history[1].utilization).toBe(80);
  });
});

describe("recommendAdjustments", () => {
  it("recommends increasing over-spent budgets", () => {
    // Provide budgets for 3 months so budgetHistory has data to compare
    const budgets = [
      budget({ month: "2024-01", amount: 100, category: "Food" }),
      budget({ month: "2024-02", amount: 100, category: "Food" }),
      budget({ month: "2024-03", amount: 100, category: "Food" }),
      budget({ month: "2024-04", amount: 100, category: "Food" }),
    ];
    const txns: Transaction[] = [
      tx({ date: "2024-01-01", amount: -200, category: "Food" }),
      tx({ date: "2024-02-01", amount: -200, category: "Food" }),
      tx({ date: "2024-03-01", amount: -200, category: "Food" }),
    ];
    const adj = recommendAdjustments(budgets, txns);
    expect(adj.length).toBeGreaterThan(0);
    expect(adj[0].urgency).toBe("high");
  });

  it("returns empty when budgets are well-calibrated", () => {
    const budgets = [budget({ month: "2024-04", amount: 200 })];
    const txns: Transaction[] = [
      tx({ date: "2024-01-01", amount: -190, category: "Food" }),
      tx({ date: "2024-02-01", amount: -195, category: "Food" }),
    ];
    const adj = recommendAdjustments(budgets, txns);
    expect(adj).toHaveLength(0);
  });
});

describe("forecastBudgets", () => {
  it("forecasts end-of-month spending", () => {
    const budgets = [budget({ month: "2024-01", amount: 500 })];
    const txns: Transaction[] = [tx({ amount: -100 })];
    const forecasts = forecastBudgets(budgets, txns, "2024-01");
    expect(forecasts).toHaveLength(1);
    expect(forecasts[0].budgeted).toBe(500);
  });
});
