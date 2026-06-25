"use client";

import type { Transaction } from "@/lib/data/types";
import { computeMonthIncome, computeMonthExpenses, computeMonthCashflow } from "@/lib/finance/totals";

const currency = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

export function DashboardSummary({ transactions, month }: { transactions: Transaction[]; month: string }) {
  const income = computeMonthIncome(transactions, month);
  const expenses = computeMonthExpenses(transactions, month);
  const cashflow = computeMonthCashflow(transactions, month);

  return (
    <div className="month-summary">
      <div className="month-summary-item">
        <span className="month-summary-value positive">{currency.format(income)}</span>
        <span className="month-summary-label">Income</span>
      </div>
      <div className="month-summary-item">
        <span className="month-summary-value negative">{currency.format(expenses)}</span>
        <span className="month-summary-label">Spent</span>
      </div>
      <div className="month-summary-item">
        <span className={"month-summary-value " + (cashflow >= 0 ? "positive" : "negative")}>{currency.format(cashflow)}</span>
        <span className="month-summary-label">Remaining</span>
      </div>
    </div>
  );
}
