# QuietLedger

**Money without noise.**

[![Live app](https://img.shields.io/badge/live-quietledger.vercel.app-88a874?style=flat-square)](https://quietledger.vercel.app)
[![CI](https://img.shields.io/github/actions/workflow/status/sparshsam/quietledger/ci.yml?branch=main&style=flat-square&label=ci)](https://github.com/sparshsam/quietledger/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0--or--later-6f7d61?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square)](https://www.typescriptlang.org)

QuietLedger is a calm, local-first personal finance ledger for people who want to understand their money without connecting bank accounts, feeding a brokerage funnel, or being shamed by a dashboard.

It runs in the browser, stores the active ledger locally, supports CSV import and JSON backups, and keeps the product surface quiet: accounts, monthly snapshots, manual entries, transaction history, financial memory, and upcoming obligations.

**Live app:** [https://quietledger.vercel.app](https://quietledger.vercel.app)

![QuietLedger dashboard](assets/screenshot-main.png)

## Quick Links

| Link | Description |
| --- | --- |
| [Live app](https://quietledger.vercel.app) | Production deployment on Vercel |
| [Architecture notes](docs/architecture.md) | Current data model, storage, and privacy notes |
| [Security policy](SECURITY.md) | Reporting guidance and current security limitations |
| [Contributing](CONTRIBUTING.md) | Local setup, checks, and contribution expectations |
| [Changelog](CHANGELOG.md) | Notable project changes |
| [License](LICENSE) | AGPL-3.0-or-later |

## Current Status

QuietLedger is an early public MVP. It is useful today as a browser-local ledger, but it is not a bank-connected finance platform and should not be treated as secure long-term storage for sensitive records.

What exists now:

- Manual transaction entry with edit, duplicate, and delete actions.
- Local account management with create, edit, and archive flows.
- Client-side CSV import with flexible column mapping, preview warnings, duplicate detection, and basic categorization.
- Local persistence through `localStorage`.
- JSON export/import for backups and recovery.
- PWA manifest and service worker shell.
- Public Vercel deployment.

What does not exist yet:

- No hosted user accounts or auth.
- No backend database.
- No encryption-at-rest for local browser storage.
- No bank login, Plaid, Flinks, brokerage, or aggregation connection.
- No multi-device sync or conflict resolution.
- No native desktop/mobile builds.

## Screenshots

| Overview | Filtered insight/search state |
| --- | --- |
| ![QuietLedger overview](assets/screenshot-main.png) | ![QuietLedger filtered insight state](assets/screenshot-search.png) |

## Features

| Area | Current support |
| --- | --- |
| Accounts | Create, edit, archive, starting balance, account type |
| Transactions | Manual add/edit/delete/duplicate, notes, merchant, category |
| CSV import | Client-side parsing, flexible header mapping, preview warnings |
| Categorization | Basic keyword inference for common spending groups |
| Dashboard | Accounts, monthly snapshot, insights, memory, forecast, life-cost map |
| Persistence | Schema-versioned browser `localStorage` |
| Backups | JSON export/import |
| PWA | Manifest, icon, service worker registration |
| Hosting | Vercel production deployment |

## Privacy Model

QuietLedger is intentionally local-first in its current form:

- Ledger data is stored in the browser using `localStorage`.
- CSV parsing happens locally in the browser.
- JSON backup import/export happens locally in the browser.
- No bank credentials are requested.
- No Plaid, Flinks, brokerage, or bank aggregation service is connected.
- No backend, database, analytics pipeline, or server sync is connected.

Important limitation: `localStorage` is convenient, but it is not encrypted secure storage. Browser data can be cleared by site-data settings, private browsing, cleanup tools, profile changes, or device migration. Export JSON backups regularly and store them somewhere you control.

## Install Or Use

### Use The Hosted App

Open [https://quietledger.vercel.app](https://quietledger.vercel.app).

The app can be installed as a PWA from supported browsers. Browser installation prompts and labels vary by platform.

### Run Locally

Requirements:

- Node.js 20.11 or newer
- npm

```bash
git clone https://github.com/sparshsam/quietledger.git
cd quietledger
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Build From Source

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

The production server uses Next.js. For Vercel deployment, the default Next.js preset is sufficient.

## CSV Import

QuietLedger starts with CSV instead of bank aggregation because CSV keeps the user in control. Export from your bank, inspect the file, import locally, and back up the ledger as JSON.

Supported mapping targets:

- date
- description
- merchant
- amount
- account
- category
- type / debit / credit

Example with signed amounts:

```csv
Date,Description,Merchant,Amount,Account,Category
2026-05-03,Internet bill,Northline Internet,-69.99,Chequing,Utilities
2026-05-04,Payroll deposit,Acme Studio,2715.00,Chequing,Income
2026-05-06,Uber Eats,Uber Eats,-31.40,Credit cards,
```

Example with debit/credit type:

```csv
Posted Date,Transaction Description,Debit/Credit,Transaction Amount,Account Name
05/07/2026,Grocery Store,Debit,84.12,Chequing
05/08/2026,Salary,Credit,2715.00,Chequing
05/09/2026,Streaming Bundle,Debit,18.99,Credit cards
```

## Backups

Use **Export JSON** after meaningful edits or imports. Use **Import JSON backup** to restore a previously exported QuietLedger ledger.

The backup format currently includes:

- `schemaVersion`
- `exportedAt`
- `accounts`
- `transactions`
- `importedTransactions`
- `importMetadata`
- `monthlySnapshots`
- `memories`
- `forecastItems`

## Deployment

QuietLedger is deployed on Vercel:

[https://quietledger.vercel.app](https://quietledger.vercel.app)

No custom `vercel.json` is required for the current Next.js app.

Recommended deployment flow:

```bash
npm install
npm run lint
npm run typecheck
npm run build
npx vercel --prod
```

## Roadmap

- Broader CSV format coverage and import test fixtures.
- Transaction search and richer filtering.
- Editable categories and category rules.
- Subscription radar.
- Calm forecast improvements.
- Optional encrypted local storage strategy.
- Optional self-hosted Supabase/Postgres sync.
- Import/export schema migration tests.

## Contributing

Contributions are welcome if they preserve the project's privacy-first and calm-UX direction.

Start with:

```bash
npm install
npm run lint
npm run typecheck
npm run build
```

Before opening a pull request, please read [CONTRIBUTING.md](CONTRIBUTING.md). For vulnerability reports, use [SECURITY.md](SECURITY.md).

## License

QuietLedger is licensed under **AGPL-3.0-or-later**. See [LICENSE](LICENSE).

This matters for hosted or network-accessible modifications: the AGPL is intentionally stronger than a permissive license. If you run a modified version for others over a network, you need to provide the corresponding source under the AGPL terms.
