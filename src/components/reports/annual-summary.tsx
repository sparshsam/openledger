"use client";

import { useMemo } from "react";
import type { Transaction } from "@/lib/data/types";
import { computeYearSummary, computeMonthlyBreakdown, computeYearOverYear } from "@/lib/finance/reports";
import { formatCurrency, DEFAULT_BASE_CURRENCY } from "@/lib/finance/currency";

type Props = {
  transactions: Transaction[];
  year: string;
  baseCurrency?: string;
  locale?: string;
};

export function AnnualSummaryReport({ transactions, year, baseCurrency, locale }: Props) {
  const summary = useMemo(() => computeYearSummary(transactions, year), [transactions, year]);
  const breakdown = useMemo(() => computeMonthlyBreakdown(transactions, year), [transactions, year]);
  const previousYear = String(Number(year) - 1);
  const yoy = useMemo(
    () => transactions.some((t) => t.date.startsWith(previousYear))
      ? computeYearOverYear(transactions, year, previousYear)
      : null,
    [transactions, year, previousYear],
  );

  const fmt = (n: number) => formatCurrency(n, baseCurrency ?? DEFAULT_BASE_CURRENCY, locale);

  if (summary.transactionCount === 0) {
    return (
      <div className="chart-empty">
        No transactions found for {year}.
      </div>
    );
  }

  // Find the max values for month bar visualization
  const maxIncome = Math.max(...breakdown.map((m) => m.income), 1);
  const maxExpense = Math.max(...breakdown.map((m) => m.expenses), 1);

  return (
    <div>
      {/* Year summary strip */}
      <div style={{ display: "flex", gap: "var(--space-2xl)", padding: "var(--space-xl) 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        <div>
          <div className="month-summary-value positive">{fmt(summary.income)}</div>
          <div className="month-summary-label">Income</div>
        </div>
        <div>
          <div className="month-summary-value negative">{fmt(summary.expenses)}</div>
          <div className="month-summary-label">Expenses</div>
        </div>
        <div>
          <div className="month-summary-value" style={{ color: summary.net >= 0 ? "var(--positive)" : "var(--negative)" }}>{fmt(summary.net)}</div>
          <div className="month-summary-label">Net</div>
        </div>
        <div>
          <div className="month-summary-value" style={{ fontSize: 28 }}>{summary.transactionCount}</div>
          <div className="month-summary-label">Transactions</div>
        </div>
      </div>

      {/* Year-over-year comparison */}
      {yoy && yoy.previousYear && (
        <div style={{ padding: "var(--space-md) 0", fontSize: 14, color: "var(--text-secondary)", display: "flex", gap: "var(--space-xl)", flexWrap: "wrap" }}>
          <span>vs {previousYear}: Income <strong style={{ color: yoy.incomeChange !== null && yoy.incomeChange > 0 ? "var(--positive)" : "var(--negative)" }}>
            {yoy.incomeChange !== null ? `${yoy.incomeChange > 0 ? "+" : ""}${yoy.incomeChange}%` : "—"}
          </strong></span>
          <span>Expenses <strong style={{ color: yoy.expenseChange !== null && yoy.expenseChange > 0 ? "var(--negative)" : "var(--positive)" }}>
            {yoy.expenseChange !== null ? `${yoy.expenseChange > 0 ? "+" : ""}${yoy.expenseChange}%` : "—"}
          </strong></span>
          <span>Net <strong>{yoy.netChange !== null ? fmt(yoy.netChange) : "—"}</strong></span>
        </div>
      )}

      {/* Best/worst months */}
      <div style={{ display: "flex", gap: "var(--space-xl)", padding: "var(--space-md) 0", fontSize: 14, flexWrap: "wrap" }}>
        {summary.bestMonth && (
          <div>
            <span style={{ color: "var(--text-tertiary)" }}>Best: </span>
            <strong style={{ color: "var(--positive)" }}>{summary.bestMonth.month.slice(5)} — {fmt(summary.bestMonth.net)}</strong>
          </div>
        )}
        {summary.worstMonth && (
          <div>
            <span style={{ color: "var(--text-tertiary)" }}>Worst: </span>
            <strong style={{ color: "var(--negative)" }}>{summary.worstMonth.month.slice(5)} — {fmt(summary.worstMonth.net)}</strong>
          </div>
        )}
        {summary.topCategory && (
          <div>
            <span style={{ color: "var(--text-tertiary)" }}>Top spending: </span>
            <strong>{summary.topCategory.category}</strong> <span style={{ color: "var(--text-tertiary)" }}>{fmt(summary.topCategory.total)}</span>
          </div>
        )}
      </div>

      {/* Monthly breakdown table */}
      <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-tertiary)", margin: "var(--space-xl) 0 var(--space-md)" }}>
        Monthly Breakdown
      </h3>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 1fr", gap: 8, padding: "8px 0", color: "var(--text-tertiary)", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>
          <span>Month</span>
          <span style={{ textAlign: "right" }}>Income</span>
          <span style={{ textAlign: "right" }}>Expenses</span>
          <span style={{ textAlign: "right" }}>Net</span>
          <span></span>
        </div>
        {breakdown.map((m) => (
          <div key={m.month} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 1fr", gap: 8, padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 14, alignItems: "center" }}>
            <strong>{m.label}</strong>
            <span style={{ textAlign: "right", color: "var(--positive)", fontWeight: 600 }}>{m.income > 0 ? fmt(m.income) : "—"}</span>
            <span style={{ textAlign: "right", color: "var(--negative)", fontWeight: 600 }}>{m.expenses > 0 ? fmt(m.expenses) : "—"}</span>
            <span style={{ textAlign: "right", fontWeight: 700, color: m.net >= 0 ? "var(--positive)" : "var(--negative)" }}>{fmt(m.net)}</span>
            {/* Mini bar visualization */}
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <div style={{ flex: 1, height: 6, background: "var(--surface-secondary)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${Math.max(2, (m.income / maxIncome) * 100)}%`, height: "100%", background: "var(--positive)", opacity: 0.7, float: "left" }} />
              </div>
              <div style={{ flex: 1, height: 6, background: "var(--surface-secondary)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${Math.max(2, (m.expenses / maxExpense) * 100)}%`, height: "100%", background: "var(--negative)", opacity: 0.7, float: "left" }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="page-break" />
    </div>
  );
}
