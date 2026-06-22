"use client";

import type { Account } from "@/lib/data/types";

const currencyFormat = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  notation: "compact",
});

const currencyFormatFull = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

export function AccountBalancesChart({ accounts }: { accounts: Account[] }) {
  const active = accounts.filter((a) => !a.archivedAt);
  if (active.length === 0) {
    return (
      <div className="chart-empty" aria-label="No account balance data">
        <p>No accounts yet.</p>
      </div>
    );
  }

  const maxAbs = Math.max(...active.map((a) => Math.abs(a.balance)), 1);
  const summary = active
    .map((a) => `${a.name}: ${currencyFormatFull.format(a.balance)}`)
    .join(", ");

  return (
    <div className="chart" role="img" aria-label={`Account balances: ${summary}`}>
      {active.map((a) => {
        const pct = (Math.abs(a.balance) / maxAbs) * 100;
        return (
          <div className="chart-bar-row" key={a.id}>
            <span className="chart-label">{a.name}</span>
            <div className="chart-bar-track">
              <div
                className={`chart-bar-fill ${a.balance >= 0 ? "chart-bar-income" : "chart-bar-expense"}`}
                style={{ width: `${pct}%` }}
                title={`${a.name}: ${currencyFormatFull.format(a.balance)}`}
              />
            </div>
            <span className={`chart-value ${a.balance < 0 ? "negative" : "positive"}`}>
              {currencyFormat.format(a.balance)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
