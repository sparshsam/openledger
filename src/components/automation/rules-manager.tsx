"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, ArrowUp, ArrowDown } from "lucide-react";
import type { CategorizationRule, RuleCondition, RuleConditionField, RuleConditionOperator } from "@/lib/data/types";
import { countRuleMatches } from "@/lib/data/rules";
import type { Transaction } from "@/lib/data/types";

type Props = {
  rules: CategorizationRule[];
  transactions: Transaction[];
  onSave: (rule: CategorizationRule) => void;
  onDelete: (id: string) => void;
  onReorder: (rules: CategorizationRule[]) => void;
};

const CATEGORIES = ["Groceries", "Rent", "Food delivery", "Transport", "Subscriptions", "Income", "Debt", "Utilities", "Shopping", "Health", "Misc"];

const FIELD_OPTIONS: { value: RuleConditionField; label: string }[] = [
  { value: "description", label: "Description" },
  { value: "merchant", label: "Merchant" },
  { value: "amount", label: "Amount" },
  { value: "accountId", label: "Account" },
  { value: "category", label: "Category" },
];

const OPERATOR_OPTIONS: { value: RuleConditionOperator; label: string }[] = [
  { value: "contains", label: "Contains" },
  { value: "equals", label: "Equals" },
  { value: "gt", label: "Greater than" },
  { value: "lt", label: "Less than" },
  { value: "gte", label: "≥" },
  { value: "lte", label: "≤" },
];

const defaultCondition: RuleCondition = { field: "description", operator: "contains", value: "" };

export function RulesManager({ rules, transactions, onSave, onDelete, onReorder }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<CategorizationRule | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Misc");
  const [formSubcategory, setFormSubcategory] = useState("");
  const [formConditions, setFormConditions] = useState<RuleCondition[]>([{ ...defaultCondition }]);

  const sorted = useMemo(() => [...rules].sort((a, b) => a.priority - b.priority), [rules]);

  function resetForm() {
    setFormName("");
    setFormCategory("Misc");
    setFormSubcategory("");
    setFormConditions([{ ...defaultCondition }]);
    setEditingRule(null);
    setShowForm(false);
  }

  function openNewForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(rule: CategorizationRule) {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormCategory(rule.setCategory);
    setFormSubcategory(rule.setSubcategory ?? "");
    setFormConditions(rule.conditions.length > 0 ? rule.conditions.map((c) => ({ ...c })) : [{ ...defaultCondition }]);
    setShowForm(true);
  }

  function handleSave() {
    if (!formName.trim()) return;
    const rule: CategorizationRule = {
      id: editingRule?.id ?? `rule-${crypto.randomUUID()}`,
      name: formName.trim(),
      priority: editingRule?.priority ?? (rules.length > 0 ? Math.max(...rules.map((r) => r.priority)) + 10 : 10),
      conditions: formConditions.filter((c) => c.value.trim()),
      setCategory: formCategory,
      setSubcategory: formSubcategory.trim() || undefined,
      enabled: editingRule?.enabled ?? true,
      createdAt: editingRule?.createdAt ?? new Date().toISOString(),
    };
    onSave(rule);
    resetForm();
  }

  function handleToggle(rule: CategorizationRule) {
    onSave({ ...rule, enabled: !rule.enabled });
  }

  function movePriority(index: number, direction: "up" | "down") {
    const newRules = [...sorted];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newRules.length) return;

    // Swap priorities
    const temp = newRules[index].priority;
    newRules[index] = { ...newRules[index], priority: newRules[target].priority };
    newRules[target] = { ...newRules[target], priority: temp };

    onReorder(newRules);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {rules.length} rule{rules.length !== 1 ? "s" : ""} defined
        </span>
        <button onClick={openNewForm} className="settings-panel-btn" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Add rule
        </button>
      </div>

      {/* Rule list */}
      {sorted.length === 0 && !showForm && (
        <p className="gentle-help" style={{ marginBottom: 8 }}>No rules yet. Rules let you automatically categorize transactions based on their description, amount, or merchant.</p>
      )}

      {sorted.map((rule, i) => (
        <div key={rule.id} className="suggestion-row" style={{ opacity: rule.enabled ? 1 : 0.5 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 14 }}>{rule.name}</strong>
              <span className="account-kind-badge badge-chq" style={{ fontSize: 10 }}>Priority {rule.priority}</span>
              <span className="account-kind-badge badge-misc">{rule.conditions.length} condition{rule.conditions.length !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
              {rule.conditions.map((c) => `"${c.field}" ${c.operator} "${c.value}"`).join(" AND ")}
              {" → "}
              <strong>{rule.setCategory}</strong>
              {rule.setSubcategory ? ` > ${rule.setSubcategory}` : ""}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
              Matches: {countRuleMatches(rule, transactions)} transactions
            </div>
          </div>
          <div className="editorial-row-actions" style={{ display: "flex", gap: 4 }}>
            <button onClick={() => movePriority(i, "up")} disabled={i === 0} aria-label="Move up" title="Move up"><ArrowUp size={13} /></button>
            <button onClick={() => movePriority(i, "down")} disabled={i === sorted.length - 1} aria-label="Move down" title="Move down"><ArrowDown size={13} /></button>
            <button onClick={() => handleToggle(rule)} aria-label={rule.enabled ? "Disable" : "Enable"} title={rule.enabled ? "Disable" : "Enable"}>
              {rule.enabled ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
            </button>
            <button onClick={() => openEditForm(rule)} aria-label="Edit" title="Edit"><span style={{ fontSize: 13 }}>✎</span></button>
            <button onClick={() => { if (confirm(`Delete rule "${rule.name}"?`)) onDelete(rule.id); }} className="danger" aria-label="Delete" title="Delete"><Trash2 size={13} /></button>
          </div>
        </div>
      ))}

      {/* Rule form */}
      {showForm && (
        <div style={{ marginTop: 12, padding: 16, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>{editingRule ? "Edit rule" : "New rule"}</h4>
          <div className="form-grid" style={{ gap: 10 }}>
            <label>
              <span>Rule name</span>
              <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Amazon purchases" />
            </label>

            {/* Conditions */}
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Conditions (all must match)</span>
              {formConditions.map((cond, ci) => (
                <div key={ci} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                  <select
                    value={cond.field}
                    onChange={(e) => {
                      const updated = [...formConditions];
                      updated[ci] = { ...updated[ci], field: e.target.value as RuleConditionField };
                      setFormConditions(updated);
                    }}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, background: "var(--surface-secondary)", color: "var(--text)" }}
                  >
                    {FIELD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <select
                    value={cond.operator}
                    onChange={(e) => {
                      const updated = [...formConditions];
                      updated[ci] = { ...updated[ci], operator: e.target.value as RuleConditionOperator };
                      setFormConditions(updated);
                    }}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, background: "var(--surface-secondary)", color: "var(--text)" }}
                  >
                    {OPERATOR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <input
                    value={cond.value}
                    onChange={(e) => {
                      const updated = [...formConditions];
                      updated[ci] = { ...updated[ci], value: e.target.value };
                      setFormConditions(updated);
                    }}
                    placeholder="value"
                    style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, background: "var(--surface-secondary)", color: "var(--text)", minWidth: 80 }}
                  />
                  {formConditions.length > 1 && (
                    <button
                      onClick={() => setFormConditions(formConditions.filter((_, idx) => idx !== ci))}
                      style={{ padding: "4px 8px", border: "none", background: "transparent", color: "var(--negative)", cursor: "pointer", fontSize: 16 }}
                      aria-label="Remove condition"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setFormConditions([...formConditions, { ...defaultCondition }])}
                style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontWeight: 600 }}
              >
                + Add condition
              </button>
            </div>

            {/* Action */}
            <label>
              <span>Set category</span>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, background: "var(--surface-secondary)", color: "var(--text)", width: "100%" }}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              <span>Subcategory (optional)</span>
              <input value={formSubcategory} onChange={(e) => setFormSubcategory(e.target.value)} placeholder="e.g. Online" style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, background: "var(--surface-secondary)", color: "var(--text)" }} />
            </label>
          </div>

          <div className="form-actions" style={{ marginTop: 12 }}>
            <button onClick={handleSave} disabled={!formName.trim() || formConditions.every((c) => !c.value.trim())}>
              {editingRule ? "Save changes" : "Create rule"}
            </button>
            <button onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
