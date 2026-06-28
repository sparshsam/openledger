"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { BarChart3, FileText, Printer, Copy, Download } from "lucide-react";
import type { Account, Transaction, Budget, CategorizationRule, MerchantAlias } from "@/lib/data/types";
import { AnnualSummaryReport } from "./reports/annual-summary";
import { CategoryReportView } from "./reports/category-report";
import { MerchantReportView } from "./reports/merchant-report";
import { CashflowReportView } from "./reports/cashflow-report";
import { copyToClipboard, formatReportSummary, downloadReportCsv } from "@/lib/data/export";
import { computeYearSummary, computeMonthlyBreakdown, computeCategoryReport, computeMerchantReport, computeCashflowReport } from "@/lib/finance/reports";

type ReportType = "annual" | "category" | "merchant" | "cashflow";

type Props = {
  transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  baseCurrency: string;
  locale: string;
  onMonthChange?: (month: string) => void;
  activeCategory?: string | null;
  activeAccountId?: string | null;
  rules?: CategorizationRule[];
  aliases?: MerchantAlias[];
};

const ALL_REPORTS: { value: ReportType; label: string; icon: React.ReactNode }[] = [
  { value: "annual", label: "Annual", icon: <BarChart3 size={14} /> },
  { value: "category", label: "Category", icon: <FileText size={14} /> },
  { value: "merchant", label: "Merchant", icon: <FileText size={14} /> },
  { value: "cashflow", label: "Cashflow", icon: <BarChart3 size={14} /> },
];

export function ReportsView({
  transactions,
  accounts,
  budgets,
  baseCurrency,
  locale,
  onMonthChange,
  activeCategory,
  activeAccountId,
}: Props) {
  const [activeReport, setActiveReport] = useState<ReportType>("annual");
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState("");
  const [monthsLookback, setMonthsLookback] = useState(12);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) {
      set.add(t.date.slice(0, 4));
    }
    return [...set].sort().reverse();
  }, [transactions]);

  const allCategories = useMemo(() => {
    return [...new Set(transactions.map((t) => t.category))].sort();
  }, [transactions]);

  const allMerchants = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) {
      const name = t.merchant || t.description;
      if (name) set.add(name);
    }
    return [...set].sort();
  }, [transactions]);

  // Derive valid selections — avoids useEffect setState cascading
  const effectiveCategory = selectedCategory && allCategories.includes(selectedCategory) ? selectedCategory : (allCategories[0] ?? "");
  const effectiveMerchant = selectedMerchant && allMerchants.includes(selectedMerchant) ? selectedMerchant : (allMerchants[0] ?? "");

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const currentCategory = effectiveCategory || selectedCategory;
  const currentMerchant = effectiveMerchant || selectedMerchant;

  const handleCopySummary = useCallback(async () => {
    let text = "";
    switch (activeReport) {
      case "annual": {
        const summary = computeYearSummary(transactions, selectedYear);
        const breakdown = computeMonthlyBreakdown(transactions, selectedYear);
        text = formatReportSummary(
          `Annual Report &mdash; ${selectedYear}`,
          [
            { label: "Income", value: summary.income.toFixed(2) },
            { label: "Expenses", value: summary.expenses.toFixed(2) },
            { label: "Net", value: summary.net.toFixed(2) },
            { label: "Transactions", value: String(summary.transactionCount) },
            { label: "Top Category", value: summary.topCategory?.category ?? "&mdash;" },
            { label: "Best Month", value: summary.bestMonth?.month ?? "&mdash;" },
            { label: "Worst Month", value: summary.worstMonth?.month ?? "&mdash;" },
          ],
        );
        break;
      }
      case "category": {
        if (!selectedCategory) return;
        const reportData = computeCategoryReport(transactions, selectedCategory);
        text = formatReportSummary(
          `Category Report &mdash; ${selectedCategory}`,
          [
            { label: "Total Spent", value: reportData.totalSpent.toFixed(2) },
            { label: "Transactions", value: String(reportData.transactionCount) },
            { label: "Average", value: reportData.averagePerTransaction.toFixed(2) },
            { label: "Change", value: reportData.monthOverMonthChange !== null ? `${reportData.monthOverMonthChange > 0 ? "+" : ""}${reportData.monthOverMonthChange}%` : "&mdash;" },
            { label: "Trend", value: reportData.growthRate.trend },
          ],
        );
        break;
      }
      case "merchant": {
        if (!selectedMerchant) return;
        const reportData = computeMerchantReport(transactions, selectedMerchant);
        text = formatReportSummary(
          `Merchant Report &mdash; ${selectedMerchant}`,
          [
            { label: "Total Spent", value: reportData.totalSpent.toFixed(2) },
            { label: "Transactions", value: String(reportData.transactionCount) },
            { label: "Average", value: reportData.averagePerTransaction.toFixed(2) },
            { label: "First Seen", value: reportData.firstSeen ?? "&mdash;" },
            { label: "Last Seen", value: reportData.lastSeen ?? "&mdash;" },
          ],
        );
        break;
      }
      case "cashflow": {
        const reportData = computeCashflowReport(transactions, monthsLookback);
        text = formatReportSummary(
          `Cashflow Report (${monthsLookback} months)`,
          [
            { label: "Total Income", value: reportData.totalIncome.toFixed(2) },
            { label: "Total Expenses", value: reportData.totalExpenses.toFixed(2) },
            { label: "Net", value: reportData.totalNet.toFixed(2) },
            { label: "Avg Savings Rate", value: reportData.averageSavingsRate !== null ? `${reportData.averageSavingsRate}%` : "&mdash;" },
          ],
        );
        break;
      }
    }

    if (text) {
      const ok = await copyToClipboard(text);
      setCopyNotice(ok ? "Copied!" : "Copy failed");
      setTimeout(() => setCopyNotice(null), 2000);
    }
  }, [activeReport, transactions, selectedYear, selectedCategory, selectedMerchant, monthsLookback]);

  const handleExportCsv = useCallback(() => {
    switch (activeReport) {
      case "annual": {
        const breakdown = computeMonthlyBreakdown(transactions, selectedYear);
        downloadReportCsv(
          breakdown.map((m) => ({ Month: m.label, Income: m.income, Expenses: m.expenses, Net: m.net, "Top Category": m.topCategory })),
          `annual-${selectedYear}.csv`,
        );
        break;
      }
      case "category": {
        if (!selectedCategory) return;
        const reportData = computeCategoryReport(transactions, selectedCategory);
        downloadReportCsv(
          reportData.monthlyTrend.map((m) => ({ Month: m.label, Spent: m.total })),
          `category-${selectedCategory}.csv`,
        );
        break;
      }
      case "merchant": {
        if (!selectedMerchant) return;
        const reportData = computeMerchantReport(transactions, selectedMerchant);
        downloadReportCsv(
          reportData.categoryDistribution.map((c) => ({ Category: c.category, Total: c.total, Percentage: c.percentage })),
          `merchant-${selectedMerchant}.csv`,
        );
        break;
      }
      case "cashflow": {
        const reportData = computeCashflowReport(transactions, monthsLookback);
        downloadReportCsv(
          reportData.dataPoints.map((d) => ({ Month: d.label, Income: d.income, Expenses: d.expenses, Net: d.net, "Running Balance": d.runningBalance, "Savings Rate": d.savingsRate ?? "" })),
          "cashflow.csv",
        );
        break;
      }
    }
  }, [activeReport, transactions, selectedYear, selectedCategory, selectedMerchant, monthsLookback]);

  return (
    <div className="reports-view">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)", flexWrap: "wrap", gap: 8 }}>
        <h2 className="section-title" style={{ margin: 0 }}>Reports</h2>
        <div style={{ display: "flex", gap: 6 }}>
          {activeReport === "annual" && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13, fontWeight: 600, color: "var(--text)" }}
            >
              {years.length > 0 ? years.map((y) => <option key={y} value={y}>{y}</option>) : <option value={selectedYear}>{selectedYear}</option>}
            </select>
          )}
          {activeReport === "cashflow" && (
            <select
              value={monthsLookback}
              onChange={(e) => setMonthsLookback(Number(e.target.value))}
              style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13, fontWeight: 600, color: "var(--text)" }}
            >
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
              <option value={24}>24 months</option>
              <option value={36}>36 months</option>
            </select>
          )}
          <button onClick={handlePrint} className="pill pill-secondary no-print" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Printer size={14} /> Print
          </button>
          <button onClick={handleCopySummary} className="pill pill-secondary no-print" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Copy size={14} /> {copyNotice ?? "Copy"}
          </button>
          <button onClick={handleExportCsv} className="pill pill-secondary no-print" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: "var(--space-xl)", flexWrap: "wrap" }}>
        {ALL_REPORTS.map((r) => (
          <button
            key={r.value}
            onClick={() => setActiveReport(r.value)}
            className={`quick-filter-chip ${activeReport === r.value ? "active" : ""}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {r.icon}
            {r.label}
          </button>
        ))}
      </div>

      <div className="report-content no-break">
        {activeReport === "annual" && (
          <AnnualSummaryReport
            transactions={transactions}
            year={selectedYear}
            baseCurrency={baseCurrency}
            locale={locale}
          />
        )}
        {activeReport === "category" && (
          <CategoryReportView
            transactions={transactions}
            categories={allCategories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            baseCurrency={baseCurrency}
            locale={locale}
          />
        )}
        {activeReport === "merchant" && (
          <MerchantReportView
            transactions={transactions}
            merchants={allMerchants}
            selectedMerchant={selectedMerchant}
            onMerchantChange={setSelectedMerchant}
            baseCurrency={baseCurrency}
            locale={locale}
          />
        )}
        {activeReport === "cashflow" && (
          <CashflowReportView
            transactions={transactions}
            months={monthsLookback}
            baseCurrency={baseCurrency}
            locale={locale}
          />
        )}
      </div>
    </div>
  );
}
