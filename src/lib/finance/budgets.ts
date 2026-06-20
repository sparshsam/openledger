import type { Budget, Transaction } from "@/lib/data/types";

function spentInBudget(budget: Budget, transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.category === budget.category && t.date.startsWith(budget.month) && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function budgetUtilization(budget: Budget, transactions: Transaction[]): number {
  const spent = spentInBudget(budget, transactions);
  if (budget.amount === 0) return spent > 0 ? 100 : 0;
  return Math.min(100, Math.round((spent / budget.amount) * 100));
}

export function remainingBudget(budget: Budget, transactions: Transaction[]): number {
  return budget.amount - spentInBudget(budget, transactions);
}

export function isOverBudget(budget: Budget, transactions: Transaction[]): boolean {
  return remainingBudget(budget, transactions) < 0;
}

export function findOverBudget(
  budgets: Budget[],
  transactions: Transaction[],
): Array<{ budget: Budget; spent: number; overBy: number }> {
  return budgets
    .map((b) => {
      const spent = spentInBudget(b, transactions);
      const overBy = spent - b.amount;
      return { budget: b, spent, overBy };
    })
    .filter((r) => r.overBy > 0);
}
