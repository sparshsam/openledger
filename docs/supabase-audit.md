# OpenLedger — Supabase Table & RLS Audit

> **Date:** June 21, 2026  
> **Project:** Elora (`qoxmibmbyjmkntzrckyr`, us-east-1, Postgres 17)  
> **Schema:** `public`

---

## OpenLedger Tables

All 9 OpenLedger tables use the required `openledger_` prefix. ✅

| Table | RLS | user_id FK | Auth Scope | Notes |
|-------|-----|-----------|------------|-------|
| `openledger_accounts` | ✅ Enabled | uuid (nullable) | Reserved for future auth | No explicit RLS policies yet |
| `openledger_transactions` | ✅ Enabled | uuid (nullable) | Reserved for future auth | FK to `openledger_accounts.id` |
| `openledger_categories` | ✅ Enabled | none | Shared reference data | Seeded with 11 default categories |
| `openledger_budgets` | ✅ Enabled | uuid (nullable) | Reserved for future auth | FK to `openledger_categories.id` |
| `openledger_goals` | ✅ Enabled | uuid (nullable) | Reserved for future auth | No explicit RLS policies yet |
| `openledger_imports` | ✅ Enabled | uuid (nullable) | Reserved for future auth | No explicit RLS policies yet |
| `openledger_audit_events` | ✅ Enabled | uuid (nullable) | Reserved for future auth | No explicit RLS policies yet |
| `openledger_backups` | ✅ Enabled | uuid (required) | `auth.uid()` policies | Full RLS: select/insert/delete with `auth.uid() = user_id` |
| `openledger_profiles` | ✅ Enabled | uuid (unique, required) | `auth.uid()` FK | FK to `auth.users.id` |

### Summary

- **Prefix compliance:** All OpenLedger tables use `openledger_` prefix. ✅
- **RLS enabled on all tables:** ✅
- **Foreign keys to `auth.users`:** `openledger_backups.user_id` and `openledger_profiles.user_id` have proper FK constraints. ✅
- **RLS policies defined:** `openledger_backups` has full policies. Other tables have RLS enabled but no explicit policies yet (acceptable for current local-first architecture since the app reads/writes from localStorage, not directly from these tables).

---

## Non-OpenLedger Tables on the Shared Elora Project

These tables belong to other apps on the shared Supabase project. All use distinct naming conventions and are clearly separable. **No modifications were made to these tables.**

| App | Tables | Prefix |
|-----|--------|--------|
| **Elora Bet** | `User`, `Wallet`, `Bet`, `Transaction`, `Session`, `VaultLock`, `Policy` | PascalCase single nouns |
| **Clubhouse** | `clubhouse_clubhouses`, `clubhouse_profiles`, `clubhouse_members`, `clubhouse_events`, `clubhouse_event_rsvps`, `clubhouse_chat_messages`, `clubhouse_invites`, `clubhouse_media_items`, `clubhouse_tournaments`, `clubhouse_tournament_participants`, `clubhouse_tournament_matches` | `clubhouse_` prefix |
| **Leaderboard** | `players`, `leaderboard_scores` | Descriptive lowercase |

All non-OpenLedger tables have RLS enabled. Ownership boundaries are clear.

---

## Recommendations for v0.6.0

| Priority | Action |
|----------|--------|
| **High** | Add explicit RLS policies to all OpenLedger tables before enabling direct client-side reads/writes. |
| **Medium** | Add `auth.uid()` default value to `user_id` columns (currently nullable/reserved). |
| **Medium** | Add notification triggers for `openledger_backups` — currently no webhook on backup events. |
| **Low** | Consider `updated_at` trigger for `openledger_imports` and `openledger_audit_events` (currently missing). |

---

## Ownership Boundaries

```
Project: Elora (shared Supabase project)
├── openledger_*      → OpenLedger app    (9 tables)
├── clubhouse_*        → Clubhouse app     (11 tables)
├── User, Wallet, ... → Elora Bet app     (7 tables)
├── players, ...       → Leaderboard app   (2 tables)
└── Other tables       → Reserved / future
```

This project is shared. All apps must prefix their tables. Mutating another app's tables is prohibited.
