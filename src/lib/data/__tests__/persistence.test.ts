import { describe, it, expect } from "vitest";
import { normalizeLedgerBackup, createDemoLedgerState } from "../persistence";

describe("normalizeLedgerBackup — v0.4.0 backup (no budgets/goals)", () => {
  const v040backup = {
    schemaVersion: 1,
    savedAt: "2026-06-19T12:00:00.000Z",
    accounts: [{ id: "a1", name: "Chequing", kind: "chequing", subtitle: "", balance: 5000, currency: "CAD" }],
    transactions: [{ id: "t1", date: "2026-05-01", description: "Rent", category: "Rent", accountId: "a1", amount: -1500 }],
    monthlySnapshots: [],
    memories: [],
    forecastItems: [],
    importMetadata: [],
  };

  it("initializes budgets as empty array when missing", () => {
    const result = normalizeLedgerBackup(v040backup, "saved");
    expect(result.ok).toBe(true);
    expect(result.state.budgets).toEqual([]);
  });

  it("initializes goals as empty array when missing", () => {
    const result = normalizeLedgerBackup(v040backup, "saved");
    expect(result.ok).toBe(true);
    expect(result.state.goals).toEqual([]);
  });

  it("preserves accounts and transactions from old backup", () => {
    const result = normalizeLedgerBackup(v040backup, "saved");
    expect(result.state.accounts).toHaveLength(1);
    expect(result.state.transactions).toHaveLength(1);
    expect(result.state.accounts[0].name).toBe("Chequing");
  });
});

describe("normalizeLedgerBackup — v0.5.0 backup (with budgets/goals)", () => {
  const v050backup = {
    schemaVersion: 1,
    savedAt: "2026-06-20T12:00:00.000Z",
    accounts: [{ id: "a1", name: "Chequing", kind: "chequing", subtitle: "", balance: 5000, currency: "CAD" }],
    transactions: [{ id: "t1", date: "2026-05-01", description: "Rent", category: "Rent", accountId: "a1", amount: -1500 }],
    monthlySnapshots: [],
    memories: [],
    forecastItems: [],
    importMetadata: [],
    budgets: [
      { id: "b1", category: "Groceries", month: "2026-06", amount: 500 },
      { id: "b2", category: "Rent", month: "2026-06", amount: 1600 },
    ],
    goals: [
      { id: "g1", name: "Emergency fund", targetAmount: 10000, currentAmount: 2500, createdAt: "2026-01-01" },
    ],
  };

  it("restores budgets when present", () => {
    const result = normalizeLedgerBackup(v050backup, "saved");
    expect(result.ok).toBe(true);
    expect(result.state.budgets).toHaveLength(2);
    expect(result.state.budgets[0].category).toBe("Groceries");
  });

  it("restores goals when present", () => {
    const result = normalizeLedgerBackup(v050backup, "saved");
    expect(result.ok).toBe(true);
    expect(result.state.goals).toHaveLength(1);
    expect(result.state.goals[0].name).toBe("Emergency fund");
  });

  it("filters invalid budgets", () => {
    const bad = {
      ...v050backup,
      budgets: [
        { id: "b1", category: "Groceries", month: "2026-06", amount: 500 },
        { id: "b2" }, // missing category, month, amount
      ],
    };
    const result = normalizeLedgerBackup(bad, "saved");
    expect(result.state.budgets).toHaveLength(1);
  });

  it("filters invalid goals", () => {
    const bad = {
      ...v050backup,
      goals: [
        { id: "g1", name: "Emergency fund", targetAmount: 10000, currentAmount: 2500 },
        { id: "g2", name: "Bad" }, // missing targetAmount, currentAmount
      ],
    };
    const result = normalizeLedgerBackup(bad, "saved");
    expect(result.state.goals).toHaveLength(1);
  });
});

describe("createDemoLedgerState", () => {
  it("creates a state with empty budgets array", () => {
    const state = createDemoLedgerState();
    expect(Array.isArray(state.budgets)).toBe(true);
  });

  it("creates a state with empty goals array", () => {
    const state = createDemoLedgerState();
    expect(Array.isArray(state.goals)).toBe(true);
  });
});
