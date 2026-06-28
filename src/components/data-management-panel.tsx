"use client";

import { useRef } from "react";
import { FileUp, FileText, Trash2, Archive, Download } from "lucide-react";
import {
  downloadLedgerExport,
  downloadCsvExport,
  downloadEnhancedExport,
} from "@/lib/data/export";
import type { Account, ImportMetadata, Budget, Goal, ImportSession, RecurringEntry, LearnedCategory, CurrencySettings, Transaction, MonthlySnapshot, FinancialMemory, ForecastItem } from "@/lib/data/types";

type FullLedgerData = {
  accounts: Account[];
  transactions: Transaction[];
  monthlySnapshots: MonthlySnapshot[];
  memories: FinancialMemory[];
  forecastItems?: ForecastItem[];
  importMetadata: ImportMetadata[];
  importSessions?: ImportSession[];
  budgets: Budget[];
  goals: Goal[];
  recurringEntries?: RecurringEntry[];
  categoryLearnings?: LearnedCategory[];
  currencySettings?: CurrencySettings;
};

type Props = {
  user: import("@supabase/supabase-js").User | null;
  ledgerData: { accounts: Account[]; transactions: Transaction[]; importMetadata: ImportMetadata[]; budgets: Budget[]; goals: Goal[] };
  fullLedgerData?: FullLedgerData;
  onResetToDemo: () => void;
  onClearLocal: () => void;
};

export function DataManagementPanel({ user, ledgerData, fullLedgerData, onResetToDemo, onClearLocal }: Props) {
  const jsonImportRef = useRef<HTMLInputElement | null>(null);

  const handleExportJson = () => {
    downloadLedgerExport(
      ledgerData as unknown as Parameters<typeof downloadLedgerExport>[0],
      undefined,
      ledgerData.importMetadata,
    );
  };

  const handleExportEnhanced = () => {
    if (fullLedgerData) {
      downloadEnhancedExport(fullLedgerData);
    }
  };

  const handleExportCsv = () => {
    downloadCsvExport(ledgerData.accounts, ledgerData.transactions);
  };

  return (
    <div>
      <div className="settings-panel-section">
        <h4 className="settings-panel-heading">Export</h4>
        <p className="gentle-help" style={{ marginBottom: 12 }}>
          Download your full ledger. All data is exported from your browser — nothing is sent to a server.
        </p>
        <div className="settings-panel-actions">
          <button onClick={handleExportJson} className="settings-panel-btn" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <FileText size={14} aria-hidden />
            Export JSON (v1)
          </button>
          <button onClick={handleExportCsv} className="settings-panel-btn" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <FileText size={14} aria-hidden />
            Export CSV
          </button>
          {fullLedgerData && (
            <button onClick={handleExportEnhanced} className="settings-panel-btn" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Download size={14} aria-hidden />
              Full backup (v3)
            </button>
          )}
        </div>
      </div>

      <div className="settings-panel-divider" />

      <div className="settings-panel-section">
        <h4 className="settings-panel-heading">Restore &amp; Reset</h4>
        <p className="gentle-help" style={{ marginBottom: 12 }}>
          Import a previous JSON backup or reset to the demo ledger.
        </p>
        <div className="settings-panel-actions">
          <button onClick={() => jsonImportRef.current?.click()} className="settings-panel-btn" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <FileUp size={14} aria-hidden />
            Import JSON
          </button>
          <button onClick={onResetToDemo} className="settings-panel-btn" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Archive size={14} aria-hidden />
            Reset to demo
          </button>
          <input ref={jsonImportRef} type="file" accept=".json,application/json" style={{ display: "none" }} />
        </div>
      </div>

      <div className="settings-panel-divider" />

      <div className="settings-panel-section">
        <h4 className="settings-panel-heading">Clear Local Data</h4>
        <p className="gentle-help" style={{ marginBottom: 12 }}>
          Reset your local ledger to the demo state. Cloud data is not affected.
        </p>
        <div className="settings-panel-actions">
          <button className="settings-panel-btn settings-panel-btn-danger" onClick={onClearLocal} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Trash2 size={14} aria-hidden />
            Clear local data
          </button>
        </div>
      </div>
    </div>
  );
}
