import { describe, it, expect } from "vitest";
import {
  getReportPeriod,
  transactionsInPeriod,
  getPreviousPeriod,
  dailyAverage,
  getReportModeLabel,
} from "../report-modes";
import type { Transaction } from "@/lib/data/types";

describe("getReportModeLabel", () => {
  it("returns labels for all modes", () => {
    expect(getReportModeLabel("week")).toBe("Week");
    expect(getReportModeLabel("month")).toBe("Month");
    expect(getReportModeLabel("quarter")).toBe("Quarter");
    expect(getReportModeLabel("year")).toBe("Year");
  });
});

describe("getReportPeriod", () => {
  it("returns month period", () => {
    const period = getReportPeriod("month", "2024-03-15");
    expect(period.startDate).toBe("2024-03-01");
    expect(period.endDate).toBe("2024-03-31");
    expect(period.mode).toBe("month");
  });

  it("returns quarter period", () => {
    const period = getReportPeriod("quarter", "2024-03-15");
    expect(period.startDate).toBe("2024-01-01");
    expect(period.endDate).toBe("2024-03-31");
    expect(period.label).toContain("Q1");
  });

  it("returns year period", () => {
    const period = getReportPeriod("year", "2024-06-15");
    expect(period.startDate).toBe("2024-01-01");
    expect(period.endDate).toBe("2024-12-31");
  });

  it("returns week period", () => {
    // 2024-01-01 is a Monday
    const period = getReportPeriod("week", "2024-01-03");
    expect(period.startDate).toBe("2024-01-01");
    expect(period.endDate).toBe("2024-01-07");
    expect(period.mode).toBe("week");
  });
});

describe("transactionsInPeriod", () => {
  it("filters transactions within the period", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-03-01", description: "Rent", amount: -1000, accountId: "a", category: "Housing" },
      { id: "2", date: "2024-03-15", description: "Food", amount: -50, accountId: "a", category: "Food" },
      { id: "3", date: "2024-04-01", description: "Rent", amount: -1000, accountId: "a", category: "Housing" },
    ];
    const period = getReportPeriod("month", "2024-03-15");
    const filtered = transactionsInPeriod(txns, period);
    expect(filtered).toHaveLength(2);
  });
});

describe("getPreviousPeriod", () => {
  it("returns previous month", () => {
    const period = getReportPeriod("month", "2024-03-15");
    const prev = getPreviousPeriod(period);
    expect(prev.startDate).toBe("2024-02-01");
    expect(prev.endDate).toBe("2024-02-29");
  });

  it("returns previous year", () => {
    const period = getReportPeriod("year", "2024-06-15");
    const prev = getPreviousPeriod(period);
    expect(prev.startDate).toBe("2023-01-01");
  });
});

describe("dailyAverage", () => {
  it("computes average daily income/expense", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2024-03-01", description: "Salary", amount: 3000, accountId: "a", category: "Income" },
      { id: "2", date: "2024-03-15", description: "Rent", amount: -1500, accountId: "a", category: "Housing" },
    ];
    const period = getReportPeriod("month", "2024-03-15");
    const avg = dailyAverage(txns, period);
    expect(avg.income).toBeCloseTo(96.77, 0);
    expect(avg.expense).toBeCloseTo(48.38, 0);
  });
});
