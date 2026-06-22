"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ArrowUp } from "lucide-react";
import type { Goal } from "@/lib/data/types";
import { goalProgress } from "@/lib/finance/goals";

const currency = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

const today = new Date().toISOString().slice(0, 10);

type GoalFormValues = {
  id?: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
};

export function GoalsPanel({
  goals,
  onSave,
  onDelete,
  onContribute,
}: {
  goals: Goal[];
  onSave: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onContribute: (id: string, amount: number) => void;
}) {
  const [form, setForm] = useState<GoalFormValues>({
    name: "",
    targetAmount: "",
    currentAmount: "0",
    targetDate: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [contributeId, setContributeId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");

  function handleSave() {
    const target = Number(form.targetAmount);
    const current = Number(form.currentAmount);
    if (!form.name.trim() || !Number.isFinite(target) || target <= 0) {
      setError("Enter a goal name and a positive target amount.");
      return;
    }
    onSave({
      id: form.id ?? `goal-${crypto.randomUUID()}`,
      name: form.name.trim(),
      targetAmount: target,
      currentAmount: Number.isFinite(current) ? current : 0,
      targetDate: form.targetDate || undefined,
      createdAt: form.id ? (goals.find((g) => g.id === form.id)?.createdAt ?? today) : today,
    });
    setForm({ name: "", targetAmount: "", currentAmount: "0", targetDate: "" });
    setEditingId(null);
    setError("");
  }

  function handleEdit(g: Goal) {
    setForm({
      id: g.id,
      name: g.name,
      targetAmount: String(g.targetAmount),
      currentAmount: String(g.currentAmount),
      targetDate: g.targetDate ?? "",
    });
    setEditingId(g.id);
    setError("");
  }

  function handleCancel() {
    setForm({ name: "", targetAmount: "", currentAmount: "0", targetDate: "" });
    setEditingId(null);
    setError("");
  }

  function handleContribute(goalId: string) {
    const amount = Number(contributeAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    onContribute(goalId, amount);
    setContributeId(null);
    setContributeAmount("");
  }

  const now = new Date();

  return (
    <div className="goals-panel">
      <div className="goal-form">
        <h3 className="section-title">{editingId ? "Edit goal" : "New goal"}</h3>
        <div className="goal-form-grid">
          <label>
            <span>Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Emergency fund" maxLength={100} />
          </label>
          <label>
            <span>Target amount</span>
            <input type="number" min="0" step="0.01" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} placeholder="10000" />
          </label>
          <label>
            <span>Current amount</span>
            <input type="number" min="0" step="0.01" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} placeholder="0" />
          </label>
          <label>
            <span>Target date (optional)</span>
            <input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
          </label>
        </div>
        {error ? <p className="gentle-error" role="status" aria-live="polite">{error}</p> : null}
        <div className="form-actions">
          <button onClick={handleSave}>
            <Plus size={16} />
            {editingId ? "Save changes" : "Add goal"}
          </button>
          {editingId ? <button onClick={handleCancel}>Cancel</button> : null}
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="empty-state" role="status">
          <strong>No goals yet</strong>
          <p>Set a savings goal to track your progress over time.</p>
        </div>
      ) : (
        <div className="goal-list" aria-live="polite" aria-atomic="false">
          {goals.map((g) => {
            const progress = goalProgress(g);
            const remaining = g.targetAmount - g.currentAmount;
            const daysLeft = g.targetDate ? Math.ceil((new Date(g.targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

            return (
              <div key={g.id} className="goal-row">
                <div className="goal-header">
                  <strong>{g.name}</strong>
                  <span className="goal-target">{currency.format(g.targetAmount)} goal</span>
                </div>

                <div className="goal-progress-section">
                  <div className="budget-bar-track">
                    <div
                      className={`budget-bar-fill ${progress >= 100 ? "budget-bar-ok" : "budget-bar-warn"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="goal-stats">
                    <span className="positive">{currency.format(g.currentAmount)} saved</span>
                    <span className="budget-pct">{progress}%</span>
                  </div>
                </div>

                <div className="goal-meta">
                  <span>{currency.format(remaining)} remaining</span>
                  {daysLeft !== null ? (
                    <span className={daysLeft < 30 ? "negative" : ""}>
                      {daysLeft > 0 ? `${daysLeft} days left` : "Past due"}
                    </span>
                  ) : null}
                </div>

                <div className="goal-actions">
                  {contributeId === g.id ? (
                    <div className="contribute-form">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={contributeAmount}
                        onChange={(e) => setContributeAmount(e.target.value)}
                        placeholder="Amount"
                        autoFocus
                      />
                      <button onClick={() => handleContribute(g.id)}>
                        <ArrowUp size={14} />
                        Add
                      </button>
                      <button onClick={() => { setContributeId(null); setContributeAmount(""); }}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => { setContributeId(g.id); setContributeAmount(""); }} aria-label={`Contribute to ${g.name}`}>
                        <ArrowUp size={14} />
                        Contribute
                      </button>
                      <button onClick={() => handleEdit(g)} aria-label={`Edit ${g.name}`}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => onDelete(g.id)} aria-label={`Delete ${g.name}`}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
