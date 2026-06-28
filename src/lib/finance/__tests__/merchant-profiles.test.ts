import { describe, it, expect } from "vitest";
import type { Transaction } from "@/lib/data/types";
import { buildMerchantProfile, searchMerchants } from "../merchant-profiles";

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: "1", date: "2024-01-15", description: "T", amount: -10, accountId: "a1", category: "Food", ...overrides,
  };
}

describe("buildMerchantProfile", () => {
  it("builds a complete profile from transaction history", () => {
    const txns: Transaction[] = [
      tx({ merchant: "Starbucks", amount: -5.5, date: "2024-01-01" }),
      tx({ merchant: "Starbucks", amount: -6.0, date: "2024-01-15" }),
      tx({ merchant: "Starbucks", amount: -5.5, date: "2024-02-01" }),
    ];

    const profile = buildMerchantProfile("Starbucks", txns);
    expect(profile).not.toBeNull();
    expect(profile!.totalTransactions).toBe(3);
    expect(profile!.totalSpent).toBeCloseTo(17, 0);
    expect(profile!.monthsActive).toBe(2);
    expect(profile!.firstSeen).toBe("2024-01-01");
    expect(profile!.lastSeen).toBe("2024-02-01");
    expect(profile!.spendingByMonth).toHaveLength(2);
  });

  it("uses description when merchant is missing", () => {
    const txns: Transaction[] = [
      tx({ description: "Netflix", amount: -15.99, date: "2024-01-01" }),
    ];
    const profile = buildMerchantProfile("Netflix", txns);
    expect(profile).not.toBeNull();
    expect(profile!.totalTransactions).toBe(1);
  });

  it("returns null for no matching transactions", () => {
    expect(buildMerchantProfile("Unknown", [])).toBeNull();
  });

  it("only includes expense transactions", () => {
    const txns: Transaction[] = [
      tx({ merchant: "Starbucks", amount: -5.5 }),
      tx({ merchant: "Starbucks", amount: 100 }), // income — excluded
    ];
    const profile = buildMerchantProfile("Starbucks", txns);
    expect(profile!.totalTransactions).toBe(1);
  });
});

describe("searchMerchants", () => {
  it("finds merchants matching query", () => {
    const txns: Transaction[] = [
      tx({ merchant: "Starbucks", amount: -5.5 }),
      tx({ merchant: "Amazon", amount: -50 }),
      tx({ merchant: "Starbucks", amount: -4.5 }),
    ];

    const results = searchMerchants(txns, "star");
    expect(results).toHaveLength(1);
    expect(results[0].merchant).toBe("Starbucks");
    expect(results[0].count).toBe(2);
  });

  it("returns empty for no matches", () => {
    expect(searchMerchants([], "xyz")).toEqual([]);
  });

  it("limits results", () => {
    const txns: Transaction[] = Array.from({ length: 30 }, (_, i) =>
      tx({ merchant: `M${i}`, amount: -(i + 1) }),
    );
    expect(searchMerchants(txns, "M", 5)).toHaveLength(5);
  });
});
