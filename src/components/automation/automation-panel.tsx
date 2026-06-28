"use client";

import { useState } from "react";
import { Settings2, Tags } from "lucide-react";
import type { CategorizationRule, MerchantAlias, Transaction } from "@/lib/data/types";
import type { AliasSuggestion } from "@/lib/data/cleanup";
import { RulesManager } from "./rules-manager";
import { AliasManager } from "./alias-manager";

type Props = {
  rules: CategorizationRule[];
  aliases: MerchantAlias[];
  transactions: Transaction[];
  aliasSuggestions: AliasSuggestion[];
  onSaveRule: (rule: CategorizationRule) => void;
  onDeleteRule: (id: string) => void;
  onReorderRules: (rules: CategorizationRule[]) => void;
  onSaveAlias: (alias: MerchantAlias) => void;
  onDeleteAlias: (id: string) => void;
};

export function AutomationPanel({
  rules,
  aliases,
  transactions,
  aliasSuggestions,
  onSaveRule,
  onDeleteRule,
  onReorderRules,
  onSaveAlias,
  onDeleteAlias,
}: Props) {
  const [showRules, setShowRules] = useState(true);
  const [showAliases, setShowAliases] = useState(false);

  return (
    <div className="settings-panel-content">
      {/* Categorization Rules */}
      <div className="settings-panel-section">
        <div
          onClick={() => setShowRules(!showRules)}
          style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginBottom: showRules ? 12 : 0 }}
        >
          <Settings2 size={14} />
          <span className="settings-panel-heading" style={{ margin: 0 }}>Categorization Rules</span>
        </div>
        {showRules && (
          <RulesManager
            rules={rules}
            transactions={transactions}
            onSave={onSaveRule}
            onDelete={onDeleteRule}
            onReorder={onReorderRules}
          />
        )}
      </div>

      <div className="settings-panel-divider" />

      {/* Merchant Aliases */}
      <div className="settings-panel-section">
        <div
          onClick={() => setShowAliases(!showAliases)}
          style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginBottom: showAliases ? 12 : 0 }}
        >
          <Tags size={14} />
          <span className="settings-panel-heading" style={{ margin: 0 }}>Merchant Aliases</span>
        </div>
        {showAliases && (
          <AliasManager
            aliases={aliases}
            suggestions={aliasSuggestions}
            onSave={onSaveAlias}
            onDelete={onDeleteAlias}
          />
        )}
      </div>
    </div>
  );
}
