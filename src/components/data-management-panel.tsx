"use client";

import { useRef } from "react";
import { FileUp, FileText, Trash2, Archive } from "lucide-react";
import {
  downloadLedgerExport,
  downloadCsvExport,
} from "@/lib/data/export";
import type { Account, Transaction, ImportMetadata, Budget, Goal } from "@/lib/data/types";

type LedgerData = {
  accounts: Account[];
  transactions: Transaction[];
  importMetadata: ImportMetadata[];
  budgets: Budget[];
  goals: Goal[];
};

type Props = {
  user: import("@supabase/supabase-js").User | null;
  ledgerData: LedgerData;
  onResetToDemo: () => void;
  onClearLocal: () => void;
};

export function DataManagementPanel({ user, ledgerData, onResetToDemo, onClearLocal }: Props) {
  const jsonImportRef = useRef<HTMLInputElement | null>(null);

  const handleExportJson = () => {
    downloadLedgerExport(
      ledgerData as unknown as Parameters<typeof downloadLedgerExport>[0],
      undefined,
      ledgerData.importMetadata,
    );
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
          <button onClick={handleExportJson} className="settings-panel-btn">
            <FileText size={14} aria-hidden />
            Export JSON
          </button>
          <button onClick={handleExportCsv} className="settings-panel-btn">
            <FileText size={14} aria-hidden />
            Export CSV
          </button>
        </div>
      </div>

      <div className="settings-panel-divider" />

      <div className="settings-panel-section">
        <h4 className="settings-panel-heading">Restore &amp; Reset</h4>
        <p className="gentle-help" style={{ marginBottom: 12 }}>
          Import a previous JSON backup or reset to the demo ledger.
        </p>
        <div className="settings-panel-actions">
          <button onClick={() => jsonImportRef.current?.click()} className="settings-panel-btn">
            <FileUp size={14} aria-hidden />
            Import JSON
          </button>
          <button onClick={onResetToDemo} className="settings-panel-btn">
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
          <button className="settings-panel-btn settings-panel-btn-danger" onClick={onClearLocal}>
            <Trash2 size={14} aria-hidden />
            Clear local data
          </button>
        </div>
      </div>
    </div>
  );
}
