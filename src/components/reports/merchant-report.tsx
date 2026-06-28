"use client";

import { useMemo } from "react";
import type { Transaction } from "@/lib/data/types";
import { computeMerchantReport } from "@/lib/finance/reports";
import { formatCurrency, DEFAULT_BASE_CURRENCY } from "@/lib/finance/currency";

type Props = {
  transactions: Transaction[];
  merchants: string[];
  selectedMerchant: string;
  onMerchantChange: (merchant: string) => void;
  baseCurrency?: string;
  locale?: string;
};

export function MerchantReportView({ transactions, merchants, selectedMerchant, onMerchantChange, baseCurrency, locale }: Props) {
  const merch = selectedMerchant || merchants[0] || "";
  const data = useMemo(() => computeMerchantReport(transactions, merch), [transactions, merch]);
  const fmt = (n: number) => formatCurrency(n, baseCurrency ?? DEFAULT_BASE_CURRENCY, locale);

  if (merchants.length === 0) {
    return <div className="chart-empty">No merchants found. Add transactions with merchants to see reports.</div>;
  }

  if (data.transactionCount === 0) {
    return (
      <div>
        <div style={{ marginBottom: "var(--space-lg)" }}>
          <select
            value={merch}
            onChange={(e) => onMerchantChange(e.target.value)}
            style={{ padding: "8px 18px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 14, fontWeight: 600, color: "var(--text)", minWidth: 250 }}
          >
            {merchants.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="chart-empty">No transactions found.</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "var(--space-lg)" }}>
        <select
          value={merch}
          onChange={(e) => onMerchantChange(e.target.value)}
          style={{ padding: "8px 18px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 14, fontWeight: 600, color: "var(--text)", minWidth: 250 }}
        >
          {merchants.map((m) => <option key={m} value={m}>{m}</option>)}
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

      <div style={{ display: "flex", gap: "var(--space-xl)", padding: "var(--space-md) 0", fontSize: 14, flexWrap: "wrap" }}>
        {data.firstSeen && (
          <div><span style={{ color: "var(--text-tertiary)" }}>First seen: </span><strong>{data.firstSeen}</strong></div>
        )}
        {data.lastSeen && (
          <div><span style={{ color: "var(--text-tertiary)" }}>Last seen: </span><strong>{data.lastSeen}</strong></div>
        )}
      </div>

      {data.monthlyTrend.length > 0 && (
        <>
          <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-tertiary)", margin: "var(--space-xl) 0 var(--space-md)" }}>
            Monthly Trend
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.monthlyTrend.map((m) => {
              const maxTotal = Math.max(...data.monthlyTrend.map((d) => d.total), 1);
              const pct = Math.max(2, (m.total / maxTotal) * 100);
              return (
                <div key={m.month} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ minWidth: 80, color: "var(--text-tertiary)", fontWeight: 600 }}>{m.label}</span>
                  <div style={{ flex: 1, height: 16, background: "var(--surface-secondary)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "var(--negative)", opacity: 0.6, borderRadius: 4 }} />
                  </div>
                  <span style={{ minWidth: 80, textAlign: "right", fontWeight: 600 }}>{fmt(m.total)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {data.categoryDistribution.length > 1 && (
        <>
          <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-tertiary)", margin: "var(--space-xl) 0 var(--space-md)" }}>
            Category Distribution
          </h3>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px", gap: 8, padding: "8px 0", color: "var(--text-tertiary)", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>
              <span>Category</span>
              <span style={{ textAlign: "right" }}>Total</span>
              <span style={{ textAlign: "right" }}>%</span>
            </div>
            {data.categoryDistribution.map((c) => (
              <div key={c.category} style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px", gap: 8, padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 14, alignItems: "center" }}>
                <strong>{c.category}</strong>
                <span style={{ textAlign: "right", fontWeight: 600 }}>{fmt(c.total)}</span>
                <span style={{ textAlign: "right", color: "var(--text-secondary)" }}>{c.percentage}%</span>
              </div>
            ))}
          </div>
        </>
      )}

      {data.recentTransactions.length > 0 && (
        <>
          <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-tertiary)", margin: "var(--space-xl) 0 var(--space-md)" }}>
            Recent Transactions
          </h3>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {data.recentTransactions.slice(0, 10).map((t) => (
              <div key={t.id} className="editorial-row no-break">
                <div>
                  <div className="editorial-row-title">{t.description}</div>
                  <div className="editorial-row-meta">{t.date} &middot; {t.category}</div>
                </div>
                <span className={"editorial-row-value " + (t.amount < 0 ? "negative" : "positive")}>{fmt(Math.abs(t.amount))}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
