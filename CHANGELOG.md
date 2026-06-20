# Changelog

All notable changes to OpenLedger will be documented here.

## 0.1.1 — 2026-06-19

- Renamed product from QuietLedger to OpenLedger.
- Added Supabase backend foundation on shared Elora project.
- Created initial schema: `openledger_accounts`, `openledger_transactions`, `openledger_categories`, `openledger_budgets`, `openledger_goals`, `openledger_imports`, `openledger_audit_events`.
- Added Supabase browser, server, and admin client stubs.
- Updated `next.config.ts` CSP to allow Supabase connections.
- Added environment variable examples for Supabase connection.
- Extended architecture docs to describe local-first + future sync modes.
- The app remains fully local-first. No sync, no auth, no migration of user data.

## 0.1.0

- Initial public MVP.
- Calm local-first dashboard.
- Manual transaction entry and account management.
- Client-side CSV import with preview, validation, duplicate detection, and basic categorization.
- Local persistence through browser `localStorage`.
- JSON backup export/import.
- PWA manifest and Vercel deployment.
