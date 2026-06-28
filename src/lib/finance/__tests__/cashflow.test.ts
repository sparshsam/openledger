import { describe, it, expect } from "vitest";
import type { Transaction } from "@/lib/data/types";
import { dailyCashflow, weeklyCashflow, netCashflow, cashflowVolatility } from "../cashflow";

describe("netCashflow", () => {
  it("computes total net flow", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-01-01", description: "Salary", amount: 5000, accountId: "a", category: "Income" },
      { id: "2", date: "2024-01-02", description: "Rent", amount: -1500, accountId: "a", category: "Housing" },
    ];
    expect(netCashflow(txns)).toBe(3500);
  });

  it("returns 0 for empty", () => {
    expect(netCashflow([])).toBe(0);
  });
});

describe("dailyCashflow", () => {
  it("produces daily timeline", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-01-01", description: "Salary", amount: 1000, accountId: "a", category: "Income" },
      { id: "2", date: "2024-01-02", description: "Rent", amount: -500, accountId: "a", category: "Housing" },
    ];
    const timeline = dailyCashflow(txns, "2024-01-01", "2024-01-03");
    // 3 days: Jan 1, Jan 2, Jan 3
    expect(timeline).toHaveLength(3);
    expect(timeline[0].runningBalance).toBe(1000);
    expect(timeline[1].runningBalance).toBe(500);
    expect(timeline[2].runningBalance).toBe(500); // no transactions on Jan 3
  });

  it("accepts starting balance", () => {
    const timeline = dailyCashflow([], "2024-01-01", "2024-01-01", 1000);
    expect(timeline[0].runningBalance).toBe(1000);
  });
});

describe("weeklyCashflow", () => {
  it("aggregates daily into weeks", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-01-01", description: "Income", amount: 1000, accountId: "a", category: "Income" },
    ];
    const weeks = weeklyCashflow(txns, "2024-01-01", "2024-01-14");
    expect(weeks.length).toBeGreaterThan(0);
    expect(weeks[0].income).toBeGreaterThan(0);
  });
});

describe("cashflowVolatility", () => {
  it("computes standard deviation of monthly net", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-01-01", description: "Income", amount: 5000, accountId: "a", category: "Income" },
      { id: "2", date: "2024-01-15", description: "Rent", amount: -1500, accountId: "a", category: "Housing" },
      { id: "3", date: "2024-02-01", description: "Income", amount: 5000, accountId: "a", category: "Income" },
      { id: "4", date: "2024-02-15", description: "Rent", amount: -1500, accountId: "a", category: "Housing" },
    ];
    const vol = cashflowVolatility(txns);
    expect(vol).not.toBeNull();
    expect(vol).toBe(0); // Identical months = zero volatility
  });

  it("returns null for insufficient data", () => {
    expect(cashflowVolatility([])).toBeNull();
  });
});
