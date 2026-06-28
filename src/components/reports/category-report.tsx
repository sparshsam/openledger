"use client";

import { useMemo } from "react";
import type { Transaction } from "@/lib/data/types";
import { computeCategoryReport } from "@/lib/finance/reports";
import { formatCurrency, DEFAULT_BASE_CURRENCY } from "@/lib/finance/currency";

type Props = {
  transactions: Transaction[];
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  baseCurrency?: string;
  locale?: string;
};

export function CategoryReportView({ transactions, categories, selectedCategory, onCategoryChange, baseCurrency, locale }: Props) {
  const cat = selectedCategory || categories[0] || "";
  const data = useMemo(() => computeCategoryReport(transactions, cat), [transactions, cat]);
  const fmt = (n: number) => formatCurrency(n, baseCurrency ?? DEFAULT_BASE_CURRENCY, locale);

  if (categories.length === 0) {
    return <div className="chart-empty">No categories found. Add transactions to see category reports.</div>;
  }

  if (data.transactionCount === 0) {
    return (
      <div>
        <div style={{ marginBottom: "var(--space-lg)" }}>
          <select
            value={cat}
            onChange={(e) => onCategoryChange(e.target.value)}
            style={{ padding: "8px 18px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 14, fontWeight: 600, color: "var(--text)", minWidth: 200 }}
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="chart-empty">No transactions in category {"\""}{cat}{"\""}.</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "var(--space-lg)" }}>
        <select
          value={cat}
          onChange={(e) => onCategoryChange(e.target.value)}
          style={{ padding: "8px 18px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 14, fontWeight: 600, color: "var(--text)", minWidth: 200 }}
        >
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", gap: "var(--space-2xl)", padding: "var(--space-xl) 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        <div>
          <div className="month-summary-value negative">{fmt(data.totalSpent)}</div>
          <div className="month-summary-label">Total spent</div>
        </div>
        <div>
          <div className="month-summary-value" style={{ fontSize: 28 }}>{data.transactionCount}</div>
          <div className="month-summary-label">Transactions</div>
        </div>
        <div>
          <div className="month-summary-value" style={{ fontSize: 28 }}>{fmt(data.averagePerTransaction)}</div>
          <div className="month-summary-label">Average</div>
        </div>
      </div>

      {data.monthOverMonthChange !== null && (
        <div style={{ display: "flex", gap: "var(--space-xl)", padding: "var(--space-md) 0", fontSize: 14, flexWrap: "wrap" }}>
          <div>
            <span style={{ color: "var(--text-tertiary)" }}>vs last month: </span>
            <strong style={{ color: data.monthOverMonthChange > 0 ? "var(--negative)" : "var(--positive)" }}>
              {data.monthOverMonthChange > 0 ? "+" : ""}{data.monthOverMonthChange}%
            </strong>
          </div>
          <div>
            <span style={{ color: "var(--text-tertiary)" }}>Trend: </span>
            <strong style={{
              color: data.growthRate.trend === "growing" ? "var(--negative)" :
                     data.growthRate.trend === "declining" ? "var(--positive)" :
                     "var(--text-secondary)"
            }}>
              {data.growthRate.trend === "growing" ? "Growing" :
               data.growthRate.trend === "declining" ? "Declining" : "Stable"}
            </strong>
          </div>
        </div>
      )}

      <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-tertiary)", margin: "var(--space-xl) 0 var(--space-md)" }}>
        Monthly Trend
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.monthlyTrend.filter((m) => m.total > 0).slice(-12).map((m) => {
          const maxTotal = Math.max(...data.monthlyTrend.map((d) => d.total), 1);
          const pct = Math.max(2, (m.total / maxTotal) * 100);
          return (
            <div key={m.month} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span style={{ minWidth: 36, color: "var(--text-tertiary)", fontWeight: 600 }}>{m.month.slice(5)}</span>
              <div style={{ flex: 1, height: 20, background: "var(--surface-secondary)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "var(--negative)", opacity: 0.6, borderRadius: 4 }} />
              </div>
              <span style={{ minWidth: 80, textAlign: "right", fontWeight: 600 }}>{fmt(m.total)}</span>
            </div>
          );
        })}
      </div>

      {data.topMerchants.length > 0 && (
        <>
          <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-tertiary)", margin: "var(--space-xl) 0 var(--space-md)" }}>
            Top Merchants
          </h3>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px", gap: 8, padding: "8px 0", color: "var(--text-tertiary)", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>
              <span>Merchant</span>
              <span style={{ textAlign: "right" }}>Total</span>
              <span style={{ textAlign: "right" }}>Count</span>
            </div>
            {data.topMerchants.map((m) => (
              <div key={m.merchant} style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px", gap: 8, padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 14, alignItems: "center" }}>
                <strong>{m.merchant}</strong>
                <span style={{ textAlign: "right", fontWeight: 600 }}>{fmt(m.total)}</span>
                <span style={{ textAlign: "right", color: "var(--text-secondary)" }}>{m.count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
