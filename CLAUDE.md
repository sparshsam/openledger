# OpenLedger — Claude Code Instructions

## Project Overview

OpenLedger is a private, local-first finance tool for everyday budgeting and records.
Built with Next.js + TypeScript. Formerly QuietLedger.

**Current Release:** v0.9.12 (2026-06-25)
**Live domain:** https://ledger.kovina.org (formerly https://openledgerbysparsh.vercel.app)
**Deploy status:** Vercel free-plan rate limit hit (100/day). Latest `main` commits NOT deployed. Deploy will resume when limit resets.

Releases:
           v0.9.12 — Domain migration + import modal + cleanup (CURRENT — deployed to main, NOT on Vercel)
           v0.9.11 — Release Readiness — account management, CSV import gate, mobile cards, error boundaries, Sentry, account deletion (CURRENT — deployed to main, NOT on Vercel)
           v0.9.10 — Mobile & Identity Release Candidate
           v0.9.9 — MCP Server, 30 AI agent tools, token auth, 76 tests
           v0.9.8 — Sync hardening, data integrity, security audit, 76 tests
           v0.9.7 — Conflict detection, device management, force re-sync, diagnostics
           v0.9.6 — Receipt capture, Supabase Storage, photo upload, camera, gallery
           v0.9.5 — Recurring Entries, schedule engine, upcoming entries
           v0.9.4 — Search & Ledger Navigation, global search, Quick Jump
           v0.9.3 — Cloud Sync Beta, auto-sync, device list, sync now
           v0.9.1 — Google Auth Foundation, auth UX overhaul, device registration, domain cleanup
           v0.9.0 — Supabase Readiness, 3 new tables, RLS hardening, database types
           (v0.8.x and earlier — see CHANGELOG.md)

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + custom CSS (~1900 lines in globals.css)
- **Data:** Local-first (`localStorage`), optional Supabase cloud backup
- **Auth:** Supabase Auth (Google OAuth — email OTP removed)
- **Database:** Supabase Postgres (shared Elora project — `openledger_` prefix)
- **Crash reporting:** Sentry (optional, requires `NEXT_PUBLIC_SENTRY_DSN`)
- **Deployment:** Vercel → https://ledger.kovina.org
- **GitHub:** https://github.com/sparshsam/openledger

## Status — v0.9.12 (Domain Migration + Import Modal + Cleanup)

### v0.9.12 Changes (all pushed to main)
- **Domain migration:** Migrated from `openledgerbysparsh.vercel.app` → `ledger.kovina.org`.
  CNAME record → `cname.vercel-dns.com`. Vercel custom domain added.
  Supabase Auth SITE_URL and Google Cloud OAuth origins updated.
- **Import modal redesign:** "Import transactions" button opens a sheet modal with
  account selection (existing or create new with name + type), file upload, and
  direct local save (no preview/mapping step). After import, a sticky banner offers
  "Save to cloud" for signed-in users (dismissible per session).
- **Account types expanded:** Crypto added (purple badge). Full list: Checking,
  Credit, Savings, Loan, Crypto, Misc.
- **Duplicate delete cleanup:** Removed "Delete cloud data" from Data settings
  (only in Privacy section with proper DELETE confirmation).
- **Auth redirect fix:** Post-Google-sign-in now goes straight to `/app` (not landing page).
- **Signed-in nav:** Landing page header shows "Ledger" button instead of "Sign in" when authenticated.
- **App navbar brand:** OpenLedger logo always links to `/` (landing page), not internal tab.
- **Service worker update flow:** New SW detected in background; user clicks "Reload" to activate.
  Periodic update check every 60s prevents stale cache lock-in.
  Update banner with "Reload" button at bottom of screen.
  SW cache bumped to v6 (openledger-shell-v6).
- **CSP fix:** Added `https://vercel.live` to `script-src` in next.config.ts.
- **Error boundaries:** All 5 tabs wrapped with ErrorBoundary + retry button.
- **Account kind badges:** Blue/red/green/orange/purple/gray badges on account types.
- **Account Type column:** Transactions table shows Type column with kind badges.
- **Mobile card layout:** Stacked cards for transactions on mobile (instead of horizontal scroll).
- **Bottom nav fit:** All 5 tabs fit without overflow on narrow viewports.
- **Backup error handling:** Classified errors (auth vs server vs unknown) with contextual messages.
- **Sentry configs:** Added (disabled by default, needs NEXT_PUBLIC_SENTRY_DSN).
- **README rewrite + architecture docs + CHANGELOG:** Updated for v0.9.11/12.

## Issues Faced This Session

1. **Auth callback cookies not persisting** (v0.9.10 known issue).
   Fix: rewrite cookies onto `NextResponse.redirect()` object directly (commit `a50b2c2`).
   Root cause: `next/headers` cookies() discards cookies set during a 302 redirect.
   Status: ON MAIN, was not deployed at time of discovery.

2. **Vercel free-plan rate limit (100 deploys/day).**
   Multiple deploys in one session exhausted the quota. Auto-deploy from GitHub
   integration is also rate-limited. Mitigation: alias the latest production deployment
   manually after each `vercel --prod` (the `--prod` flag doesn't always promote correctly
   — the alias must be set explicitly with `vercel alias set <deploy-id> <domain>`).

3. **PWA service worker keeps serving old app.**
   Old SW (`openledger-shell-v3`) controlled the browser even after new deploys.
   The SW cache-first strategy for static assets meant users saw stale JS bundles.
   Fix: bumped cache to v4/5/6, added SW update detection + user-initiated reload,
   added periodic SW update check every 60s. For users already on the old SW,
   they must open in incognito, unregister the SW in DevTools, or clear site data.

4. **Vercel CDN edge cache not invalidating on alias change.**
   After aliasing a new deployment, the CDN edge nodes continued serving the
   old deployment's cached responses for several minutes. `age` header showed
   cache HIT even with `Cache-Control: no-cache`. Fix: removed and re-added the
   alias to force CDN purge, though propagation was still delayed.

5. **CSP blocking Vercel live feedback script.**
   `script-src 'self' 'unsafe-inline'` blocked `https://vercel.live/_next-live/feedback/feedback.js`.
   Fix: added `https://vercel.live` to CSP in next.config.ts.

6. **Import modal rendering inside tab conditional.**
   The import modal was placed inside the Transactions tab's JSX block, so clicking
   "Import transactions" from the Ledger tab did nothing. Fix: moved modal outside
   tab switch, alongside other overlay components (search, quick jump).

7. **Hidden file input unmounted when switching tabs.**
   The `<input ref={csvFileRef}>` was inside the Ledger tab's conditional render.
   When user navigated to another tab, the ref pointed to nothing. Fix: moved
   the hidden input outside the tab switch, next to the import modal.

8. **Import modal input text invisible.**
   Missing `color: var(--text)` on custom CSS classes made input text invisible.
   Fix: added proper color styling matching the app's form design system.

## What's Still Deploy-Pending

The latest `main` (commit `cefa1df`) has all v0.9.12 fixes but was never deployed due to
Vercel rate limit. To deploy when limit resets:
```bash
npx vercel --prod --force
npx vercel alias set <new-deploy-id> ledger.kovina.org
```

## Domain Migration Checklist (Completed)

1. ✅ Cloudflare DNS: CNAME `ledger` → `cname.vercel-dns.com`
2. ✅ Vercel custom domain: `ledger.kovina.org` added to project
3. ✅ Code: `metadataBase`, `og:url`, `homepage`, README updated
4. ✅ Supabase Auth: SITE_URL set to `https://ledger.kovina.org`
5. ✅ Google Cloud Console: JavaScript origins + redirect URI updated

## Architecture Constraints

1. **Local-first.** Guest mode is default. No account required.
2. **Privacy by design.** All data stays on device in local mode.
3. **No tracking.** No analytics, no telemetry.
4. **Manual backup only.** Sync is never automatic. User triggers every upload and restore.
5. **Supabase shared project (Elora).** All OpenLedger tables use `openledger_` prefix.
   Other apps on same project: Clubhouse (`clubhouse_*` tables), Elora Bet (`Bet`, `Wallet`, etc.).
6. **No service-role exposure to client.** `SUPABASE_SERVICE_ROLE_KEY` is server-only.

## Commands

```bash
npm run dev       # Next.js dev server (localhost:3000)
npm run build     # Production build
npm run lint      # ESLint
npm run typecheck # TypeScript type check
npx vercel deploy --prod  # Deploy to Vercel (rate-limited to 100/day on free plan)
npx vercel alias set <deploy-id> ledger.kovina.org  # Explicit production alias
```

## Key Files

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | Main dashboard (single-page app) |
| `src/app/layout.tsx` | Root layout, metadata, manifest |
| `src/app/app/page.tsx` | App SPA (all tabs, import modal, settings) |
| `src/app/globals.css` | All styles (~1900 lines) |
| `src/middleware.ts` | Supabase SSR session cookie refresh |
| `src/app/auth/callback/route.ts` | OAuth callback handler |
| `src/components/public-header.tsx` | Landing page header (session-aware) |
| `src/components/pwa-register.tsx` | SW registration + update detection |
| `src/components/error-boundary.tsx` | React error boundary component |
| `src/components/transactions-view.tsx` | Transaction table with Account Type column |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server.ts` | Server Supabase client |
| `src/lib/supabase/auth-hook.ts` | React auth hook |
| `src/lib/supabase/backup.ts` | Cloud backup CRUD + error classification |
| `src/components/cloud-backup-panel.tsx` | Cloud backup/restore UI |
| `src/components/data-management-panel.tsx` | Export/import/reset (no cloud delete) |
| `public/sw.js` | Service worker (v6, no auto skipWaiting) |
| `next.config.ts` | CSP headers, Sentry webpack plugin |
| `docs/superpowers/specs/2026-06-25-v0.9.11-release-readiness.md` | Full spec |
| `docs/superpowers/plans/2026-06-25-v0.9.11-release-readiness.md` | Implementation plan |

## Branch Naming

- `feat/*`, `fix/*`, `docs/*`, `refactor/*`, `chore/*`

## Workflow

1. Branch from `main`.
2. Run validation (`npm run lint && npm run typecheck && npm run build`) before every PR.
3. Open a PR for every merge. No direct pushes to `main`.
4. Branch protection: 1 approval required, CI checks must pass, enforce admins enabled.
