import { describe, it, expect } from "vitest";
import type { CategorizationRule, Transaction, MerchantAlias } from "@/lib/data/types";
import {
  evaluateCondition,
  evaluateRule,
  findMatchingRule,
  applyRulesToTransaction,
  countRuleMatches,
  autoCategorizeWithRules,
  suggestTags,
  applyAutoTags,
  detectRecurringPatterns,
} from "../rules";

const baseTx: Transaction = {
  id: "1",
  date: "2026-01-15",
  description: "Amazon purchase",
  merchant: "AMZN MKT",
  amount: -45.99,
  category: "Shopping",
  accountId: "a",
};

const rules: CategorizationRule[] = [
  {
    id: "r1",
    name: "Amazon purchases",
    priority: 10,
    conditions: [{ field: "description", operator: "contains", value: "amazon" }],
    setCategory: "Shopping",
    setSubcategory: "Online",
    enabled: true,
    createdAt: "2026-01-01",
  },
  {
    id: "r2",
    name: "Large expenses",
    priority: 20,
    conditions: [{ field: "amount", operator: "lt", value: "-500" }],
    setCategory: "Misc",
    enabled: true,
    createdAt: "2026-01-01",
  },
  {
    id: "r3",
    name: "Disabled rule",
    priority: 5,
    conditions: [{ field: "description", operator: "contains", value: "test" }],
    setCategory: "Misc",
    enabled: false,
    createdAt: "2026-01-01",
  },
];

describe("evaluateCondition", () => {
  it("matches contains on description", () => {
    expect(evaluateCondition(baseTx, { field: "description", operator: "contains", value: "Amazon" })).toBe(true);
  });

  it("matches contains on merchant", () => {
    expect(evaluateCondition(baseTx, { field: "merchant", operator: "contains", value: "AMZN" })).toBe(true);
  });

  it("matches equals", () => {
    expect(evaluateCondition(baseTx, { field: "category", operator: "equals", value: "Shopping" })).toBe(true);
  });

  it("matches amount lt (negative number)", () => {
    const expense = { ...baseTx, amount: -600 };
    expect(evaluateCondition(expense, { field: "amount", operator: "lt", value: "-500" })).toBe(true);
  });

  it("does not match when condition fails", () => {
    expect(evaluateCondition(baseTx, { field: "description", operator: "contains", value: "netflix" })).toBe(false);
  });

  it("handles empty merchant gracefully", () => {
    const noMerchant = { ...baseTx, merchant: undefined };
    expect(evaluateCondition(noMerchant, { field: "merchant", operator: "equals", value: "none" })).toBe(false);
  });
});

describe("evaluateRule", () => {
  it("matches when all conditions pass", () => {
    expect(evaluateRule(baseTx, rules[0])).toBe(true);
  });

  it("does not match when rule is disabled", () => {
    expect(evaluateRule(baseTx, rules[2])).toBe(false);
  });

  it("does not match when conditions fail", () => {
    expect(evaluateRule(baseTx, rules[1])).toBe(false);
  });
});

describe("findMatchingRule", () => {
  it("finds first matching rule by priority", () => {
    const result = findMatchingRule(baseTx, rules);
    expect(result?.id).toBe("r1");
  });

  it("returns null when no rule matches", () => {
    const noMatch = { ...baseTx, description: "Random purchase", amount: -20 };
    expect(findMatchingRule(noMatch, rules)).toBeNull();
  });

  it("skips disabled rules", () => {
    // Rules includes a disabled rule at priority 5 that would match "test"
    const testTx = { ...baseTx, description: "test purchase" };
    const result = findMatchingRule(testTx, rules);
    expect(result?.id).not.toBe("r3");
  });
});

describe("countRuleMatches", () => {
  it("counts transactions matching a rule", () => {
    const transactions = [
      baseTx,
      { ...baseTx, id: "2", description: "Amazon Prime" },
      { ...baseTx, id: "3", description: "Netflix" },
    ];
    expect(countRuleMatches(rules[0], transactions)).toBe(2);
  });
});

describe("applyRulesToTransaction", () => {
  it("applies matching rule to transaction", () => {
    const result = applyRulesToTransaction(baseTx, rules, []);
    expect(result.category).toBe("Shopping");
    expect(result.subcategory).toBe("Online");
  });

  it("applies merchant alias", () => {
    const aliases: MerchantAlias[] = [
      { id: "a1", alias: "AMZN", canonicalName: "Amazon", category: "Shopping", createdAt: "2026-01-01" },
    ];
    const result = applyRulesToTransaction(baseTx, [], aliases);
    expect(result.merchant).toBe("Amazon");
    expect(result.category).toBe("Shopping");
  });

  it("rules take priority over aliases", () => {
    const aliases: MerchantAlias[] = [
      { id: "a1", alias: "AMZN", canonicalName: "Amazon", category: "Food", createdAt: "2026-01-01" },
    ];
    const result = applyRulesToTransaction(baseTx, rules, aliases);
    // Rule says Shopping, which should win over alias's Food
    expect(result.category).toBe("Shopping");
  });
});

describe("autoCategorizeWithRules", () => {
  it("checks rules first", () => {
    const result = autoCategorizeWithRules("Amazon purchase", "AMZN MKT", -45.99, "a", [], rules, []);
    expect(result.source).toBe("rule");
    expect(result.category).toBe("Shopping");
  });

  it("checks aliases second", () => {
    const aliases: MerchantAlias[] = [
      { id: "a1", alias: "AMZN", canonicalName: "Amazon", category: "Shopping", createdAt: "2026-01-01" },
    ];
    const result = autoCategorizeWithRules("Some random purchase", "AMZN MKT", -20, "a", [], [], aliases);
    expect(result.source).toBe("alias");
    expect(result.category).toBe("Shopping");
  });

  it("checks learnings third", () => {
    const learnings = [{ pattern: "netflix", parent: "Subscriptions", child: "Streaming" }];
    const result = autoCategorizeWithRules("Netflix subscription", "", -15.99, "a", learnings, [], []);
    expect(result.source).toBe("learning");
  });

  it("falls back to keyword", () => {
    const result = autoCategorizeWithRules("Random unknown purchase", "", -10, "a", [], [], []);
    expect(result.source).toBe("keyword");
    expect(result.category).toBe("Misc");
  });
});

describe("suggestTags", () => {
  it("tags large transactions", () => {
    const large = { ...baseTx, amount: -600 };
    const tags = suggestTags(large);
    expect(tags.some((t) => t.tag === "large")).toBe(true);
  });

  it("tags essential categories", () => {
    const essential = { ...baseTx, category: "Rent", amount: -1000 };
    const tags = suggestTags(essential);
    expect(tags.some((t) => t.tag === "essential")).toBe(true);
  });

  it("tags discretionary categories", () => {
    const discretionary = { ...baseTx, category: "Restaurants", amount: -50 };
    const tags = suggestTags(discretionary);
    expect(tags.some((t) => t.tag === "discretionary")).toBe(true);
  });

  it("tags income", () => {
    const income = { ...baseTx, amount: 5000, category: "Income" };
    const tags = suggestTags(income);
    expect(tags.some((t) => t.tag === "income")).toBe(true);
  });
});

describe("applyAutoTags", () => {
  it("merges auto tags with existing", () => {
    const result = applyAutoTags({ ...baseTx, tags: ["existing"] });
    expect(result.tags).toContain("existing");
  });
});

describe("detectRecurringPatterns", () => {
  it("detects monthly patterns", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2026-01-15", description: "Netflix", amount: -15.99, category: "Subscriptions", accountId: "a" },
      { id: "2", date: "2026-02-15", description: "Netflix", amount: -15.99, category: "Subscriptions", accountId: "a" },
      { id: "3", date: "2026-03-15", description: "Netflix", amount: -15.99, category: "Subscriptions", accountId: "a" },
    ];
    const patterns = detectRecurringPatterns(txns);
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].description).toBe("Netflix");
    expect(patterns[0].confidence).toBeGreaterThan(50);
  });

  it("returns empty for single occurrences", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2026-01-15", description: "One-time", amount: -100, category: "Misc", accountId: "a" },
    ];
    const patterns = detectRecurringPatterns(txns);
    expect(patterns.length).toBe(0);
  });

  it("detects weekly patterns", () => {
    const txns: Transaction[] = [
      { id: "1", date: "2026-01-05", description: "Coffee shop", amount: -5, category: "Food", accountId: "a" },
      { id: "2", date: "2026-01-12", description: "Coffee shop", amount: -5, category: "Food", accountId: "a" },
      { id: "3", date: "2026-01-19", description: "Coffee shop", amount: -5, category: "Food", accountId: "a" },
      { id: "4", date: "2026-01-26", description: "Coffee shop", amount: -5, category: "Food", accountId: "a" },
    ];
    const patterns = detectRecurringPatterns(txns);
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].frequency).toBe("weekly");
  });
});
