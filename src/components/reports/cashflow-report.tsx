"use client";

import { useMemo } from "react";
import type { Transaction } from "@/lib/data/types";
import { computeCashflowReport } from "@/lib/finance/reports";
import { formatCurrency, DEFAULT_BASE_CURRENCY } from "@/lib/finance/currency";

type Props = {
  transactions: Transaction[];
  months: number;
  baseCurrency?: string;
  locale?: string;
};

export function CashflowReportView({ transactions, months, baseCurrency, locale }: Props) {
  const data = useMemo(() => computeCashflowReport(transactions, months), [transactions, months]);
  const fmt = (n: number) => formatCurrency(n, baseCurrency ?? DEFAULT_BASE_CURRENCY, locale);

  if (data.dataPoints.length === 0) {
    return <div className="chart-empty">No transaction data available for the selected period.</div>;
  }

  const maxVal = Math.max(
    ...data.dataPoints.map((d) => Math.max(d.income, d.expenses, Math.abs(d.net))),
    1,
  );

  return (
    <div>
      {/* Summary strip */}
      <div style={{ display: "flex", gap: "var(--space-2xl)", padding: "var(--space-xl) 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        <div>
          <div className="month-summary-value positive">{fmt(data.totalIncome)}</div>
          <div className="month-summary-label">Total income</div>
        </div>
        <div>
          <div className="month-summary-value negative">{fmt(data.totalExpenses)}</div>
          <div className="month-summary-label">Total expenses</div>
        </div>
        <div>
          <div className="month-summary-value" style={{ color: data.totalNet >= 0 ? "var(--positive)" : "var(--negative)" }}>{fmt(data.totalNet)}</div>
          <div className="month-summary-label">Net result</div>
        </div>
        <div>
          <div className="month-summary-value" style={{ fontSize: 24 }}>{data.averageSavingsRate !== null ? `${data.averageSavingsRate}%` : "—"}</div>
          <div className="month-summary-label">Avg savings rate</div>
        </div>
      </div>

      {/* Best/worst */}
      <div style={{ display: "flex", gap: "var(--space-xl)", padding: "var(--space-md) 0", fontSize: 14, flexWrap: "wrap" }}>
        {data.bestMonth && (
          <div><span style={{ color: "var(--text-tertiary)" }}>Best month: </span><strong style={{ color: "var(--positive)" }}>{data.bestMonth.month}</strong> <span style={{ color: "var(--text-secondary)" }}>{fmt(data.bestMonth.net)}</span></div>
        )}
        {data.worstMonth && (
          <div><span style={{ color: "var(--text-tertiary)" }}>Worst month: </span><strong style={{ color: "var(--negative)" }}>{data.worstMonth.month}</strong> <span style={{ color: "var(--text-secondary)" }}>{fmt(data.worstMonth.net)}</span></div>
        )}
      </div>

      {/* Cashflow bar chart */}
      <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-tertiary)", margin: "var(--space-xl) 0 var(--space-md)" }}>
        Income vs Expenses
      </h3>

      {/* Bar chart */}
      <div style={{ padding: "var(--space-lg) 0" }}>
        <svg viewBox={`0 0 ${data.dataPoints.length * 80 + 60} 240`} style={{ width: "100%", height: "auto", display: "block" }}>
          {/* Y axis */}
          <line x1={40} y1={20} x2={40} y2={220} stroke="var(--border)" />
          <text x={40} y={18} fontSize={10} fill="var(--text-tertiary)">{fmt(maxVal)}</text>

          {data.dataPoints.map((d, i) => {
            const x = 50 + i * 80;
            const incomeH = (d.income / maxVal) * 180;
            const expenseH = (d.expenses / maxVal) * 180;
            return (
              <g key={d.month}>
                {/* Income bar */}
                <rect
                  x={x}
                  y={210 - incomeH}
                  width={28}
                  height={incomeH}
                  fill="var(--positive)"
                  opacity={0.7}
                  rx={3}
                />
                {/* Expense bar */}
                <rect
                  x={x + 32}
                  y={210 - expenseH}
                  width={28}
                  height={expenseH}
                  fill="var(--negative)"
                  opacity={0.7}
                  rx={3}
                />
                {/* Month label */}
                <text x={x + 30} y={230} fontSize={10} textAnchor="middle" fill="var(--text-tertiary)">
                  {d.month.slice(5)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Running balance line */}
      <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-tertiary)", margin: "var(--space-xl) 0 var(--space-md)" }}>
        Running Balance
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {data.dataPoints.map((d) => {
          const maxBal = Math.max(...data.dataPoints.map((p) => Math.abs(p.runningBalance)), 1);
          const pct = Math.min(100, Math.max(2, Math.abs(d.runningBalance / maxBal) * 100));
          return (
            <div key={d.month} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span style={{ minWidth: 80, color: "var(--text-tertiary)", fontWeight: 600 }}>{d.label}</span>
              <div style={{ flex: 1, height: 16, background: "var(--surface-secondary)", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: d.runningBalance >= 0 ? "var(--positive)" : "var(--negative)",
                    opacity: 0.6,
                    borderRadius: 4,
                    float: d.runningBalance >= 0 ? "left" : "right",
                  }}
                />
              </div>
              <span style={{ minWidth: 100, textAlign: "right", fontWeight: 700, color: d.runningBalance >= 0 ? "var(--positive)" : "var(--negative)" }}>
                {fmt(d.runningBalance)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Savings rate */}
      <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-tertiary)", margin: "var(--space-xl) 0 var(--space-md)" }}>
        Savings Rate
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 60px", gap: 8, padding: "8px 0", color: "var(--text-tertiary)", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>
          <span>Month</span>
          <span style={{ textAlign: "right" }}>Savings Rate</span>
          <span style={{ textAlign: "right" }}>Net</span>
          <span></span>
        </div>
        {data.dataPoints.map((d) => (
          <div key={d.month} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 60px", gap: 8, padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 14, alignItems: "center" }}>
            <strong>{d.label}</strong>
            <span style={{ textAlign: "right", fontWeight: 600, color: d.savingsRate !== null && d.savingsRate >= 0 ? "var(--positive)" : "var(--negative)" }}>
              {d.savingsRate !== null ? `${d.savingsRate}%` : "—"}
            </span>
            <span style={{ textAlign: "right", fontWeight: 700, color: d.net >= 0 ? "var(--positive)" : "var(--negative)" }}>
              {fmt(d.net)}
            </span>
            <span style={{ color: d.savingsRate !== null && d.savingsRate > 0 ? "var(--positive)" : d.savingsRate !== null && d.savingsRate < 0 ? "var(--negative)" : "var(--text-tertiary)", fontSize: 12 }}>
              {d.savingsRate !== null ? (d.savingsRate > 0 ? "↑" : d.savingsRate < 0 ? "↓" : "—") : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
