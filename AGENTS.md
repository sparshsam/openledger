# OpenLedger — AI Agent Instructions

## Product Identity

OpenLedger is a private, local-first finance tool. Warm ledger aesthetic, editorial UX. Not a fintech platform — a personal budgeting application with no backend, no accounts, and no cloud dependency.

## Current Release

**v0.9.12** (2026-06-25) — Domain migration + import modal + polish
**Live domain:** https://ledger.kovina.org

⚠ **STATUS: Pushed to main. Vercel free-plan rate limit hit (100 deploys/day).**
Latest deployment (`dpl_FjfDurBsUzV4HNecy7iDNaRSLtie`) is at commit `0b66939`.
Commits `c66ccd3` through `cefa1df` are on main but NOT deployed.
Deploy when rate limit resets with: `npx vercel --prod --force && npx vercel alias set <id> ledger.kovina.org`

## v0.9.12 Changes (on main, undeployed)

- **Domain:** `openledgerbysparsh.vercel.app` → `ledger.kovina.org` (CNAME via Cloudflare, Vercel custom domain)
- **Supabase Auth:** SITE_URL = `https://ledger.kovina.org`, redirect URLs updated
- **Google Cloud OAuth:** JavaScript origins + redirect URI updated
- **Import modal:** Sheet overlay with account select + file upload → direct local save (no preview step)
- **Cloud save banner:** Sticky top banner after import: "Save to cloud?" with Save/Dismiss
- **Account types:** Crypto added (purple badge)
- **Import button:** Renamed "Import bank statements" → "Import transactions"
- **SW update flow:** Periodic SW check (60s), banner waits for user click, no auto-reload
- **SW cache:** Bumped to v6
- **Auth redirect:** Post-sign-in goes to `/app`
- **Landing page nav:** Shows "Ledger" when signed in
- **App logo:** Always links to `/` (landing page)
- **CSP:** Added `https://vercel.live` to script-src

## Known Issues (must fix before next release)

1. **Vercel deploy rate limited** — ~24h from last deploy.
2. **PWA cache staleness** — Old SW (v3-v5) may still control the page even after fresh deploy.
   Users need incognito, DevTools unregister, or clear site data. Long-term fix via periodic SW update check.
3. **Import modal input/select styling** — Updated to match app design system on main but not deployed yet.
4. **"some d $0..." garbage text on Ledger** — Likely from corrupt localStorage data from early import sessions.
   May need a data migration or localStorage clear.

## Domain Migration (Completed)

| Provider | Config |
|----------|--------|
| **Cloudflare** | CNAME `ledger` → `cname.vercel-dns.com` (DNS only) |
| **Vercel** | `ledger.kovina.org` added as custom domain, auto-TLS |
| **Supabase Auth** | SITE_URL = `https://ledger.kovina.org` |
| **Google Cloud OAuth** | JS origins = `https://ledger.kovina.org`; redirect URI = `https://qoxmibmbyjmkntzrckyr.supabase.co/auth/v1/callback` |

## Resume Checklist

- [ ] Wait for Vercel rate limit to reset (~24h from last deploy)
- [ ] Deploy latest main: `npx vercel --prod --force && npx vercel alias set <id> ledger.kovina.org`
- [ ] Verify on production: sign in → profile shows name/email, cloud section appears
- [ ] Test import modal: Ledger → Import transactions → select account → upload CSV → Import → cloud save banner
- [ ] Test CSV import with account selection gate
- [ ] Test mobile: bottom nav fit, transaction cards layout
- [ ] Test backup: sign in → Settings → Cloud → back up
- [ ] Verify Sentry DSN env var if crash reporting needed
- [ ] Run `npm run lint && npm run typecheck && npm run build`

## Import Flow (current design)

1. **Ledger tab** → click "Import transactions" → sheet modal opens
2. **Select account** dropdown (existing accounts) or "+ New account" inline creation (name + type)
3. **Upload CSV/TSV file** → file parsed locally via `parseCsv()` + `guessMapping()` auto-detects columns
4. **Import button** → saves transactions locally immediately (no preview/mapping step)
5. **Cloud save banner** (if signed in): "Save to cloud?" [Save] [Dismiss]
   - Save → `uploadBackup()` pushes to Supabase
   - Dismiss → hides banner for session

## Build History (v0.9.x Quick Reference)

| Version | What |
|---------|------|
| v0.9.12 | Domain migration (`ledger.kovina.org`), import modal redesign, crypto types, duplicate delete cleanup, SW update flow, CSP fix, auth redirect, signed-in nav, error boundaries, mobile cards, Account Type column |
| v0.9.11 | Accounts tab management hub, CSV import account gate, kind badges, mobile cards, bottom nav fit, backup error handling, error boundaries, Sentry, account deletion, README rewrite |
| v0.9.10 | Mobile & Identity RC — new accent #7A2F00, bottom tab bar, mobile audit, Profile section, CSV import wired up, auth callback fix, a11y pass |
| v0.9.9 | MCP Server — 30 tools across 7 domains, token auth (SHA-256), Settings UI for create/list/revoke, Vercel-hosted Streamable HTTP endpoint, 76 tests |
| v0.9.8 | Sync hardening, data integrity validation (duplicates, reconciliation, backup verify), security audit, 76 tests |
| v0.9.7 | Conflict detection, device rename/remove, force re-sync, sync diagnostics page |
| v0.9.6 | Receipt capture — Supabase Storage, photo upload, mobile camera, gallery, preview |
| v0.9.5 | Recurring entries — weekly/monthly/custom schedules, skip/pause/resume, upcoming entries |
| v0.9.4 | Search & Ledger Navigation — global search, Quick Jump (Ctrl+K), saved filters |
| v0.9.3 | Cloud Sync Beta — auto-sync, sync indicator, device list, /app/sync page |
| v0.9.2 | Account Gateway — landing page, /app route, account gateway, empty default state |
| v0.9.1 | Google Auth Foundation — Google-only OAuth, device registration, Privacy section redesign, domain cleanup, auth docs |
| v0.9.0 | Supabase Readiness — 3 new tables (devices, sync_events, receipts), RLS WITH CHECK + TO authenticated fixes, database types, migration v4 |

## MCP Server (v0.9.9)

OpenLedger ships with an MCP server (`apps/mcp/`) that exposes 30 tools for AI agents to read/write financial data. See `docs/mcp-server-setup.md` for full setup.

- **Token auth:** SHA-256 hashed tokens stored in `openledger_mcp_tokens` table.
- **Service role client:** Bypasses RLS — user isolation in application code.
- **30 tools** across 7 domains: accounts, transactions, categories, budgets, goals, dashboard, search.
- **Server entry:** `apps/mcp/src/index.ts`

## Rules

1. **Local-first.** Do not add backend services, authentication, or cloud sync.
2. **No tracking.** No analytics, no telemetry, no third-party scripts.
3. **Privacy.** All data stays on the user's device.
4. **Calm UX.** Avoid financial gamification, urgency patterns, or manipulative UI.
5. **Design system.** OpenProof Design Playbook — editorial layout, pill buttons, accent color #7A2F00.
6. **Branch naming:** `feat/*`, `fix/*`, `docs/*`, `refactor/*`, `chore/*`.

## Ecosystem Standards

All ecosystem repos follow: https://github.com/sparshsam/ecosystem-standards
