// ─── Categorization Rules Engine ────────────────────────────────────────────
// Pure functions for evaluating rules, applying auto-tagging,
// and determining the auto-categorization priority pipeline.

import type {
  CategorizationRule,
  LearnedCategory,
  MerchantAlias,
  RuleCondition,
  Transaction,
} from "./types";



// ─── Rule Evaluation ────────────────────────────────────────────────────────

/**
 * Evaluate a single condition against a transaction.
 */
export function evaluateCondition(tx: Transaction, condition: RuleCondition): boolean {
  const fieldValue = getFieldValue(tx, condition.field);
  if (fieldValue === undefined || fieldValue === null) return false;

  const strVal = String(fieldValue).toLowerCase();
  const condVal = condition.value.toLowerCase();

  switch (condition.operator) {
    case "contains":
      return strVal.includes(condVal);
    case "equals":
      return strVal === condVal;
    case "gt": {
      const num = Number(fieldValue);
      const cmp = Number(condVal);
      return !isNaN(num) && !isNaN(cmp) && num > cmp;
    }
    case "lt": {
      const num = Number(fieldValue);
      const cmp = Number(condVal);
      return !isNaN(num) && !isNaN(cmp) && num < cmp;
    }
    case "gte": {
      const num = Number(fieldValue);
      const cmp = Number(condVal);
      return !isNaN(num) && !isNaN(cmp) && num >= cmp;
    }
    case "lte": {
      const num = Number(fieldValue);
      const cmp = Number(condVal);
      return !isNaN(num) && !isNaN(cmp) && num <= cmp;
    }
    default:
      return false;
  }
}

function getFieldValue(tx: Transaction, field: string): string | number | undefined {
  switch (field) {
    case "description": return tx.description;
    case "merchant": return tx.merchant ?? "";
    case "amount": return tx.amount;
    case "accountId": return tx.accountId;
    case "category": return tx.category;
    default: return undefined;
  }
}

/**
 * Evaluate all conditions of a rule (AND logic — all must match).
 */
export function evaluateRule(tx: Transaction, rule: CategorizationRule): boolean {
  if (!rule.enabled) return false;
  if (rule.conditions.length === 0) return false;
  return rule.conditions.every((c) => evaluateCondition(tx, c));
}

/**
 * Find the first matching rule for a transaction, ordered by priority.
 */
export function findMatchingRule(
  tx: Transaction,
  rules: CategorizationRule[],
): CategorizationRule | null {
  const sorted = [...rules]
    .filter((r) => r.enabled)
    .sort((a, b) => a.priority - b.priority);

  for (const rule of sorted) {
    if (evaluateRule(tx, rule)) return rule;
  }
  return null;
}

/**
 * Apply rules to categorize a transaction.
 */
export function applyRulesToTransaction(
  tx: Transaction,
  rules: CategorizationRule[],
  aliases: MerchantAlias[],
): Transaction {
  const updated = { ...tx };

  // 1. Check merchant aliases for canonical name + category
  const merchantName = tx.merchant || tx.description;
  const matchingAlias = aliases.find(
    (a) => merchantName.toLowerCase().includes(a.alias.toLowerCase()),
  );
  if (matchingAlias) {
    updated.merchant = matchingAlias.canonicalName;
    if (matchingAlias.category) {
      updated.category = matchingAlias.category;
    }
  }

  // 2. Check rules (highest priority)
  const matchingRule = findMatchingRule(tx, rules);
  if (matchingRule) {
    updated.category = matchingRule.setCategory;
    if (matchingRule.setSubcategory) {
      updated.subcategory = matchingRule.setSubcategory;
    }
  }

  return updated;
}

/**
 * Count how many existing transactions a rule would match.
 */
export function countRuleMatches(
  rule: CategorizationRule,
  transactions: Transaction[],
): number {
  return transactions.filter((tx) => evaluateRule(tx, rule)).length;
}

/**
 * Auto-categorize a description using the full priority pipeline.
 */
export function autoCategorizeWithRules(
  description: string,
  merchant: string | undefined,
  amount: number,
  accountId: string,
  learnings: LearnedCategory[],
  rules: CategorizationRule[],
  aliases: MerchantAlias[],
): { category: string; subcategory?: string; source: "rule" | "alias" | "learning" | "keyword" } {
  const desc = description.toLowerCase();
  const merch = (merchant || description).toLowerCase();

  // 1. Check rules
  const mockTx: Transaction = {
    id: "",
    date: "",
    description,
    merchant,
    amount,
    accountId,
    category: "Misc",
  };
  const matchingRule = findMatchingRule(mockTx, rules);
  if (matchingRule) {
    return { category: matchingRule.setCategory, subcategory: matchingRule.setSubcategory, source: "rule" };
  }

  // 2. Check merchant aliases
  const matchingAlias = aliases.find((a) => merch.includes(a.alias.toLowerCase()));
  if (matchingAlias?.category) {
    return { category: matchingAlias.category, source: "alias" };
  }

  // 3. Check learned patterns
  for (const l of learnings) {
    if (desc.includes(l.pattern)) {
      return { category: l.parent === l.child ? l.parent : `${l.parent} > ${l.child}`, source: "learning" };
    }
  }

  // 4. Fallback to keyword mapping (imported from categories)
  // This is handled by the caller — return keyword as source
  return { category: "Misc", source: "keyword" };
}

// ─── Auto-Tagging ───────────────────────────────────────────────────────────

export type TagSuggestion = {
  tag: string;
  reason: string;
};

/**
 * Suggest tags for a transaction based on its properties.
 */
export function suggestTags(tx: Transaction): TagSuggestion[] {
  const tags: TagSuggestion[] = [];

  // Large transactions (above 500)
  if (Math.abs(tx.amount) >= 500) {
    tags.push({ tag: "large", reason: `$${Math.abs(tx.amount).toFixed(0)} transaction` });
  }

  // Essential categories
  const essentialCats = ["Rent", "Utilities", "Internet", "Phone", "Insurance", "Groceries"];
  if (essentialCats.includes(tx.category)) {
    tags.push({ tag: "essential", reason: `${tx.category} is an essential category` });
  }

  // Discretionary categories
  const discretionaryCats = ["Shopping", "Restaurants", "Coffee", "Delivery", "Streaming", "Clothing"];
  if (discretionaryCats.includes(tx.category)) {
    tags.push({ tag: "discretionary", reason: `${tx.category} is discretionary` });
  }

  // Income
  if (tx.amount > 0) {
    tags.push({ tag: "income", reason: "Incoming funds" });
  }

  return tags;
}

/**
 * Apply auto-tags to a transaction (merge with existing).
 */
export function applyAutoTags(tx: Transaction): Transaction {
  const suggested = suggestTags(tx);
  const existingTags = new Set(tx.tags ?? []);
  for (const s of suggested) {
    existingTags.add(s.tag);
  }
  return { ...tx, tags: [...existingTags] };
}

// ─── Recurring Detection (improved) ─────────────────────────────────────────

export type RecurringPattern = {
  description: string;
  merchant?: string;
  amount: number;
  frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly" | "irregular";
  confidence: number;
  category: string;
  count: number;
  dates: string[];
  averageInterval: number;
};

/**
 * Detect recurring transaction patterns using date interval analysis.
 * Groups transactions by description similarity, then analyzes date patterns
 * to determine frequency and confidence.
 */
export function detectRecurringPatterns(
  transactions: Transaction[],
  minOccurrences = 2,
): RecurringPattern[] {
  // Group by normalized description
  const groups = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    const key = normalizeDescription(tx.description);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  const patterns: RecurringPattern[] = [];

  for (const [normalized, txns] of groups) {
    if (txns.length < minOccurrences) continue;

    // Sort by date
    txns.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate intervals between consecutive dates
    const intervals: number[] = [];
    for (let i = 1; i < txns.length; i++) {
      const diff = daysBetween(txns[i - 1].date, txns[i].date);
      intervals.push(diff);
    }

    if (intervals.length === 0) continue;

    const avgInterval = Math.round(intervals.reduce((s, i) => s + i, 0) / intervals.length);
    const { frequency, confidence } = classifyFrequency(intervals, avgInterval);

    // Group by amount similarity (within 10% tolerance for varying amounts)
    const amount = Math.round(Math.abs(txns[0].amount) * 100) / 100;
    const category = getMostCommonCategory(txns);

    patterns.push({
      description: txns[0].description,
      merchant: txns[0].merchant,
      amount,
      frequency,
      confidence,
      category,
      count: txns.length,
      dates: txns.map((t) => t.date),
      averageInterval: avgInterval,
    });
  }

  return patterns.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Suggest a RecurringEntry from a detected pattern.
 */
export function suggestRecurringEntry(
  pattern: RecurringPattern,
  accountId: string,
): {
  description: string;
  amount: number;
  category: string;
  accountId: string;
  frequency: "weekly" | "monthly" | "custom";
  intervalDays?: number;
  nextDate: string;
  note?: string;
} {
  const freq = pattern.frequency === "weekly" ? "weekly"
    : pattern.frequency === "biweekly" ? "custom"
    : pattern.frequency === "monthly" ? "monthly"
    : pattern.frequency === "quarterly" ? "custom"
    : pattern.frequency === "yearly" ? "custom"
    : "custom";

  const intervalDays = freq === "custom" ? pattern.averageInterval : undefined;

  // Next date = last date + average interval
  const lastDate = pattern.dates[pattern.dates.length - 1];
  const nextDate = addDays(lastDate, pattern.averageInterval);

  return {
    description: pattern.description,
    amount: pattern.amount,
    category: pattern.category,
    accountId,
    frequency: freq,
    intervalDays,
    nextDate,
    note: `Auto-detected recurring pattern (${pattern.confidence}% confidence)`,
  };
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1 + "T12:00:00");
  const d2 = new Date(date2 + "T12:00:00");
  return Math.round(Math.abs(d2.getTime() - d1.getTime()) / 86_400_000);
}

function addDays(date: string, days: number): string {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function classifyFrequency(
  intervals: number[],
  avgInterval: number,
): { frequency: RecurringPattern["frequency"]; confidence: number } {
  // Calculate variance to gauge regularity
  const variance = intervals.reduce((s, i) => s + Math.pow(i - avgInterval, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);
  const regularity = avgInterval > 0 ? 1 - Math.min(1, stdDev / avgInterval) : 0;

  // Classify by average interval
  const absAvg = Math.abs(avgInterval);

  if (absAvg >= 360 && absAvg <= 370 && regularity > 0.7) {
    return { frequency: "yearly", confidence: Math.round(regularity * 100) };
  }
  if (absAvg >= 85 && absAvg <= 95 && regularity > 0.7) {
    return { frequency: "quarterly", confidence: Math.round(regularity * 100) };
  }
  if (absAvg >= 28 && absAvg <= 33 && regularity > 0.6) {
    return { frequency: "monthly", confidence: Math.round(regularity * 100) };
  }
  if (absAvg >= 13 && absAvg <= 16 && regularity > 0.7) {
    return { frequency: "biweekly", confidence: Math.round(regularity * 100) };
  }
  if (absAvg >= 6 && absAvg <= 8 && regularity > 0.7) {
    return { frequency: "weekly", confidence: Math.round(regularity * 100) };
  }

  // Irregular but recurring
  const confidence = Math.round(Math.max(30, Math.min(70, regularity * 60 + 20)));
  return { frequency: "irregular", confidence };
}

function getMostCommonCategory(txns: Transaction[]): string {
  const counts = new Map<string, number>();
  for (const tx of txns) {
    counts.set(tx.category, (counts.get(tx.category) ?? 0) + 1);
  }
  let best = "Misc";
  let bestCount = 0;
  for (const [cat, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      best = cat;
    }
  }
  return best;
}
