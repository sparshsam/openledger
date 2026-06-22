# OpenLedger — Store Metadata

> Prepared June 21, 2026 for v0.5.x store submissions.
> Last reviewed: June 21, 2026 (v0.5.3) — all items verified accurate.

---

## Short Description (max 80 chars)

**A private, local-first personal finance tracker. No account needed. No data leaves your device.**

### Variants

| Store | Text |
|-------|------|
| Apple App Store | Privacy-first finance tracker. No account, no tracking, no cloud by default. |
| Google Play | Track money without the noise. Local-first, private, no sign-up required. |
| Microsoft Store | OpenLedger – private local-first budgeting and expense tracking. |
| Progressive Web App (PWA) | Money without noise. A private, local-first finance tracker for real life. |

---

## Full Description (700–4000 chars)

OpenLedger is a calm, private personal finance tool built for people who want to track their money without giving up control of their data.

**No account. No tracking. No noise.**

Most finance apps demand your bank login, sell your data, or lock you into a subscription. OpenLedger does none of that. It runs entirely in your browser, stores everything on your device, and asks for nothing but a CSV export from your bank.

### Features

- **Local-first by default.** All data — accounts, transactions, budgets, goals — stays in your browser until you choose to back it up.
- **Guest mode.** Start tracking immediately. No sign-up, no email, no phone number.
- **CSV import.** Export your transactions from any bank. OpenLedger parses the file in your browser — nothing is uploaded.
- **Manual entry.** Add transactions one at a time with date, description, amount, merchant, category, and notes.
- **Budgets.** Set monthly category budgets with real-time progress bars and overspending warnings.
- **Savings goals.** Define goals with target amounts and dates. Track progress and log contributions.
- **Dashboard.** Financial summary cards, spending-by-category charts, income-vs-expenses trends, account balance distributions, and monthly trend charts.
- **Transactions view.** Search, filter by date range, account, category, or type. Sortable columns.
- **Insights.** Largest expense, top spending category, month-over-month changes, recurring transaction detection, and low-balance alerts.
- **Cloud backup (optional).** Sign in with email or Google to enable manual cloud backup. You control every upload and restore — nothing is automatic.
- **PWA-ready.** Install on your phone, tablet, or desktop. Works offline for previously visited sessions.
- **Open source.** Licensed under AGPL-3.0. The full source is on GitHub.

### Privacy

OpenLedger collects nothing. No analytics, no telemetry, no crash reports, no tracking pixels. In guest mode, zero data leaves your device. Cloud backup only sends data when you explicitly tap "Back up now."

### Data Portability

Export your full ledger as JSON at any time. Import it on another device. You own your data — always.

---

## Keywords (max 100)

personal finance,budget tracker,expense tracker,money manager,local first,privacy first,offline budgeting,CSV import,envelope budgeting,savings goals,expense tracking,open source,no account required,no tracking,finance app,spending tracker,budget planner,cash flow

---

## Screenshot Checklist

> Use `?screenshots=true` URL parameter to load enriched demo data for screenshots.
> Screenshot demo is clearly labeled and never persists to localStorage.

### Desktop (wide, 1440×1000 recommended)

| # | Screen | Nav / State | Purpose |
|---|--------|------------|---------|
| 1 | **Dashboard overview** | Dashboard tab | Summary cards (income, expenses, net cash flow, net worth), 4 charts, budget overview, goal progress, recent transactions — the main landing view |
| 2 | **Budgets view** | Budgets tab | Full budget list with progress bars, at least one over-budget (Shopping at 125%), one near-limit (Utilities at 98%) |
| 3 | **Goals view** | Goals tab | Goal cards with progress bars, target amounts, target dates, contribution progress |
| 4 | **Transactions view** | Transactions tab | Filtered transaction table with search bar, account/category/type filters, sortable columns |
| 5 | **CSV import** | Overview tab → CSV import panel | CSV mapping screen showing field-to-column assignment before import |
| 6 | **Data management** | Settings tab | Export JSON/CSV buttons, Restore & Reset section, Delete data options |
| 7 | **Privacy policy** | Standalone page | Navigate to `/privacy` for screenshot |
| 8 | **Support page** | Standalone page | Navigate to `/support` for screenshot |

### Mobile (narrow, 390×900 recommended)

| # | Screen | Nav / State | Purpose |
|---|--------|------------|---------|
| 1 | **Dashboard** | Dashboard tab | Mobile view showing summary cards and first 1-2 charts |
| 2 | **Transactions** | Transactions tab | Mobile transaction list with search input visible |
| 3 | **Add transaction** | Open form | Manual transaction entry form with fields filled in |
| 4 | **Budgets** | Budgets tab | Budget overview on mobile with progress bars |
| 5 | **Goals** | Goals tab | Goal cards on mobile with progress |
| 6 | **Data management** | Settings tab | Export and delete options on mobile |
| 7 | **CSV import** | Settings tab → CSV panel | CSV mapping screen on mobile |

### Labels for screenshots

| Label | Used For |
|-------|----------|
| "Dashboard — financial summary with charts and budget overview" | Desktop + mobile dashboard |
| "Budgets — set monthly category limits and track spending" | Desktop + mobile budgets |
| "Goals — define savings targets and track contributions" | Desktop + mobile goals |
| "Transactions — search, filter, and review your spending history" | Desktop + mobile transactions |
| "CSV import — map your bank's columns to OpenLedger fields" | Desktop CSV import |
| "Data management — export, restore, and delete your data" | Desktop + mobile settings |
| "Privacy-first finance — OpenLedger privacy policy" | Privacy page |
| "Support — documentation, FAQ, and contact information" | Support page |

---

## Promotional Text (max 170 chars)

A private, local-first finance tracker. No account, no tracking, no cloud by default. Your money, your device, your rules.
