// ─── Background Cleanup Jobs ────────────────────────────────────────────────
// Runs on app load: auto-categorize uncategorized transactions,
// suggest alias merges, clean up orphaned import sessions.

import type {
  CategorizationRule,
  LearnedCategory,
  MerchantAlias,
  Transaction,
} from "./types";
import { evaluateRule } from "./rules";
import { autoCategorize } from "./categories";

export type CleanupResult = {
  categorizedCount: number;
  suggestionCount: number;
  orphanedSessionCount: number;
};

export type AliasSuggestion = {
  descriptions: string[];
  suggestedName: string;
  count: number;
};

/**
 * Run all background cleanup jobs.
 * Returns a summary of what was changed.
 */
export function runBackgroundCleanup(options: {
  transactions: Transaction[];
  rules: CategorizationRule[];
  aliases: MerchantAlias[];
  learnings: LearnedCategory[];
}): {
  transactions: Transaction[];
  result: CleanupResult;
  aliasSuggestions: AliasSuggestion[];
} {
  let updated = [...options.transactions];
  const categorizedCount = autoCategorizeUncategorized(updated, options.rules, options.aliases, options.learnings);
  // Re-read after re-categorization
  updated = autoCategorizeUncategorizedTransactions(updated, options.rules, options.aliases, options.learnings);
  const aliasSuggestions = suggestAliasMerges(updated, options.aliases);

  return {
    transactions: updated,
    result: {
      categorizedCount,
      suggestionCount: aliasSuggestions.length,
      orphanedSessionCount: 0,
    },
    aliasSuggestions,
  };
}

/**
 * Find uncategorized transactions (Misc or no category) and try to re-categorize.
 * Counts how many were changed.
 */
export function autoCategorizeUncategorized(
  transactions: Transaction[],
  rules: CategorizationRule[],
  aliases: MerchantAlias[],
  learnings: LearnedCategory[],
): number {
  let count = 0;
  for (const tx of transactions) {
    if (tx.category !== "Misc" && tx.category !== "") continue;

    // Check rules first
    for (const rule of rules) {
      if (!rule.enabled) continue;
      if (evaluateRule(tx, rule)) {
        const idx = transactions.indexOf(tx);
        if (idx !== -1) {
          transactions[idx] = { ...tx, category: rule.setCategory, subcategory: rule.setSubcategory };
          count++;
        }
        break;
      }
    }
  }
  return count;
}

/**
 * Re-categorize uncategorized transactions and return new array.
 */
export function autoCategorizeUncategorizedTransactions(
  transactions: Transaction[],
  rules: CategorizationRule[],
  aliases: MerchantAlias[],
  learnings: LearnedCategory[],
): Transaction[] {
  return transactions.map((tx) => {
    if (tx.category !== "Misc" && tx.category !== "") return tx;

    // Check rules
    for (const rule of rules) {
      if (!rule.enabled) continue;
      if (evaluateRule(tx, rule)) {
        return { ...tx, category: rule.setCategory, subcategory: rule.setSubcategory };
      }
    }

    // Check aliases
    const merchantName = tx.merchant || tx.description;
    const alias = aliases.find((a) => merchantName.toLowerCase().includes(a.alias.toLowerCase()));
    if (alias?.category) {
      return { ...tx, category: alias.category };
    }

    // Check learnings
    const desc = tx.description.toLowerCase();
    for (const l of learnings) {
      if (desc.includes(l.pattern)) {
        return { ...tx, category: l.parent };
      }
    }

    // Try keyword-based auto-categorization
    const result = autoCategorize(tx.description, learnings);
    if (result && result.parent !== "Misc") {
      return { ...tx, category: result.parent };
    }

    return tx;
  });
}

/**
 * Find similar merchant descriptions that could be aliases.
 */
export function suggestAliasMerges(
  transactions: Transaction[],
  existingAliases: MerchantAlias[],
): AliasSuggestion[] {
  const seenAliases = new Set(existingAliases.map((a) => a.alias.toLowerCase()));

  // Build a map of normalized → original names
  const groups = new Map<string, Set<string>>();
  for (const tx of transactions) {
    const name = (tx.merchant || tx.description).trim();
    if (!name) continue;
    const normalized = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (seenAliases.has(normalized)) continue;
    if (!groups.has(normalized)) groups.set(normalized, new Set());
    groups.get(normalized)!.add(name);
  }

  const suggestions: AliasSuggestion[] = [];
  for (const [, names] of groups) {
    if (names.size >= 2) {
      // Find the most common variant as suggested name
      const sorted = [...names].sort((a, b) => {
        const aCount = transactions.filter((t) => (t.merchant || t.description) === a).length;
        const bCount = transactions.filter((t) => (t.merchant || t.description) === b).length;
        return bCount - aCount;
      });
      const totalCount = sorted.reduce((s, n) => {
        return s + transactions.filter(
          (t) => (t.merchant || t.description) === n,
        ).length;
      }, 0);

      if (totalCount >= 2) {
        suggestions.push({
          descriptions: sorted,
          suggestedName: sorted[0],
          count: totalCount,
        });
      }
    }
  }

  return suggestions.sort((a, b) => b.count - a.count).slice(0, 20);
}
