// ─── Merchant Profiles ──────────────────────────────────────────────────────
// Spending history per merchant — monthly totals, category distribution,
// frequency, first/last seen, and trends.

import type { Transaction } from "@/lib/data/types";

export type MerchantProfile = {
  name: string;
  totalSpent: number;
  totalTransactions: number;
  averageTransaction: number;
  category: string;
  firstSeen: string;
  lastSeen: string;
  monthsActive: number;
  monthlyAverage: number;
  spendingByMonth: MerchantMonth[];
  trend: "growing" | "declining" | "stable" | "new";
};

export type MerchantMonth = {
  month: string;
  total: number;
  count: number;
  average: number;
};

export type MerchantSearchResult = {
  merchant: string;
  total: number;
  count: number;
  category: string;
};

/**
 * Build a full merchant profile from transaction history.
 */
export function buildMerchantProfile(
  merchantName: string,
  transactions: Transaction[],
): MerchantProfile | null {
  const txns = transactions.filter(
    (t) => (t.merchant?.toLowerCase() === merchantName.toLowerCase() ||
            t.description.toLowerCase() === merchantName.toLowerCase()) &&
           t.amount < 0,
  );

  if (txns.length === 0) return null;

  const totalSpent = Math.abs(txns.reduce((s, t) => s + t.amount, 0));
  const dates = txns.map((t) => t.date).sort();
  const firstSeen = dates[0];
  const lastSeen = dates[dates.length - 1];
  const category = getMostCommonCategory(txns);

  // Group by month
  const monthMap = new Map<string, { total: number; count: number }>();
  for (const t of txns) {
    const month = t.date.slice(0, 7);
    const existing = monthMap.get(month) ?? { total: 0, count: 0 };
    existing.total += Math.abs(t.amount);
    existing.count += 1;
    monthMap.set(month, existing);
  }

  const spendingByMonth: MerchantMonth[] = [...monthMap.entries()]
    .map(([month, data]) => ({
      month,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
      average: Math.round((data.total / data.count) * 100) / 100,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const monthsActive = spendingByMonth.length;
  const monthlyAverage = monthsActive > 0
    ? Math.round((totalSpent / monthsActive) * 100) / 100
    : 0;
  const averageTransaction = txns.length > 0
    ? Math.round((totalSpent / txns.length) * 100) / 100
    : 0;

  // Trend detection
  const trend = detectMerchantTrend(spendingByMonth);

  return {
    name: merchantName,
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalTransactions: txns.length,
    averageTransaction,
    category,
    firstSeen,
    lastSeen,
    monthsActive,
    monthlyAverage,
    spendingByMonth,
    trend,
  };
}

/**
 * Search merchants by name prefix.
 */
export function searchMerchants(
  transactions: Transaction[],
  query: string,
  limit = 20,
): MerchantSearchResult[] {
  const q = query.toLowerCase().trim();
  const merchantMap = new Map<string, { total: number; count: number; category: string }>();

  for (const t of transactions) {
    const name = t.merchant || t.description;
    if (!name || !name.toLowerCase().includes(q)) continue;
    if (t.amount >= 0) continue; // Only expenses

    const existing = merchantMap.get(name) ?? { total: 0, count: 0, category: t.category };
    existing.total += Math.abs(t.amount);
    existing.count += 1;
    merchantMap.set(name, existing);
  }

  return [...merchantMap.entries()]
    .map(([merchant, data]) => ({
      merchant,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
      category: data.category,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/**
 * Get the most common category for a set of transactions.
 */
function getMostCommonCategory(txns: Transaction[]): string {
  const counts = new Map<string, number>();
  for (const t of txns) {
    counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Uncategorized";
}

/**
 * Detect spending trend from monthly data.
 */
function detectMerchantTrend(months: MerchantMonth[]): MerchantProfile["trend"] {
  if (months.length <= 1) return "new";
  if (months.length < 3) return "stable";

  const half = Math.floor(months.length / 2);
  const firstHalf = months.slice(0, half).reduce((s, m) => s + m.total, 0) / half;
  const secondHalf = months.slice(half).reduce((s, m) => s + m.total, 0) / (months.length - half);

  const pctChange = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

  if (pctChange > 20) return "growing";
  if (pctChange < -20) return "declining";
  return "stable";
}
