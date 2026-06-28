"use client";

import { useState } from "react";
import { Plus, Trash2, Lightbulb } from "lucide-react";
import type { MerchantAlias } from "@/lib/data/types";
import type { AliasSuggestion } from "@/lib/data/cleanup";

type Props = {
  aliases: MerchantAlias[];
  suggestions: AliasSuggestion[];
  onSave: (alias: MerchantAlias) => void;
  onDelete: (id: string) => void;
};

export function AliasManager({ aliases, suggestions, onSave, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [formAlias, setFormAlias] = useState("");
  const [formCanonical, setFormCanonical] = useState("");
  const [formCategory, setFormCategory] = useState("");

  function resetForm() {
    setFormAlias("");
    setFormCanonical("");
    setFormCategory("");
    setShowForm(false);
  }

  function handleSave() {
    if (!formAlias.trim() || !formCanonical.trim()) return;
    const alias: MerchantAlias = {
      id: `alias-${crypto.randomUUID()}`,
      alias: formAlias.trim(),
      canonicalName: formCanonical.trim(),
      category: formCategory.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    onSave(alias);
    resetForm();
  }

  function acceptSuggestion(suggestion: AliasSuggestion) {
    // Create aliases for all descriptions that differ from the canonical name
    for (const desc of suggestion.descriptions) {
      if (desc.toLowerCase() !== suggestion.suggestedName.toLowerCase()) {
        onSave({
          id: `alias-${crypto.randomUUID()}`,
          alias: desc,
          canonicalName: suggestion.suggestedName,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {aliases.length} alias{aliases.length !== 1 ? "es" : ""} defined
        </span>
        <button onClick={() => setShowForm(true)} className="settings-panel-btn" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Add alias
        </button>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: 16, padding: 12, background: "var(--accent-bg)", borderRadius: "var(--radius-sm)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Lightbulb size={14} />
            <strong style={{ fontSize: 13 }}>{suggestions.length} merge suggestion{suggestions.length !== 1 ? "s" : ""}</strong>
          </div>
          {suggestions.slice(0, 5).map((s, i) => (
            <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{"\""}{s.descriptions.slice(0, 3).join(", ")}{"\""} {s.descriptions.length > 3 ? `+${s.descriptions.length - 3} more` : ""} → <strong>{s.suggestedName}</strong> ({s.count} txns)</span>
              <button
                onClick={() => acceptSuggestion(s)}
                className="pill pill-ghost"
                style={{ fontSize: 11, padding: "4px 10px" }}
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Alias list */}
      {aliases.length === 0 && !showForm && (
        <p className="gentle-help" style={{ marginBottom: 8 }}>No aliases yet. Aliases let you normalize merchant names — e.g. {"\""}AMZN MKT{"\""} → {"\""}Amazon{"\""}.</p>
      )}

      {aliases.map((a) => (
        <div key={a.id} className="suggestion-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13 }}>{"\""}{a.alias}{"\""} → <strong>{a.canonicalName}</strong></span>
            {a.category && <span className="account-kind-badge badge-chq" style={{ marginLeft: 8, fontSize: 10 }}>{a.category}</span>}
          </div>
          <div className="editorial-row-actions">
            <button onClick={() => { if (confirm(`Delete alias "${a.alias}"?`)) onDelete(a.id); }} className="danger" aria-label="Delete"><Trash2 size={13} /></button>
          </div>
        </div>
      ))}

      {/* Add alias form */}
      {showForm && (
        <div style={{ marginTop: 12, padding: 16, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>New alias</h4>
          <div className="form-grid" style={{ gap: 10 }}>
            <label>
              <span>Appears as (in your transactions)</span>
              <input value={formAlias} onChange={(e) => setFormAlias(e.target.value)} placeholder="e.g. AMZN MKT" />
            </label>
            <label>
              <span>Normalize to</span>
              <input value={formCanonical} onChange={(e) => setFormCanonical(e.target.value)} placeholder="e.g. Amazon" />
            </label>
            <label>
              <span>Category (optional)</span>
              <input value={formCategory} onChange={(e) => setFormCategory(e.target.value)} placeholder="e.g. Shopping" />
            </label>
          </div>
          <div className="form-actions" style={{ marginTop: 12 }}>
            <button onClick={handleSave} disabled={!formAlias.trim() || !formCanonical.trim()}>Add alias</button>
            <button onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
