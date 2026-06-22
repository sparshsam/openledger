# OpenLedger — Update Mechanism & Offline-First Notes

> **Last updated:** June 21, 2026

---

## How Updates Work

### PWA (hosted on Vercel)

OpenLedger is a standard Next.js app deployed on Vercel. Updates follow this flow:

1. A new version is deployed to Vercel (`npx vercel deploy --prod`).
2. When a user visits the app, the browser fetches the latest HTML from Vercel.
3. The service worker (`/sw.js`) caches shell assets on install and updates on navigation.
4. The `PwaRegister` component registers the service worker in production builds only.

### Update Latency

| Scenario | User Experience |
|----------|----------------|
| **First visit** | Fresh HTML, JS, CSS from Vercel. SW installs in background. |
| **Return visit (updated)** | Browser fetches new HTML (network-first for navigation). SW update is detected and installed on next load. |
| **Return visit (no update)** | Instant load from SW cache for shell assets; fresh data from Vercel for content. |
| **Offline** | SW serves cached shell. The app is usable for previously visited pages but cannot load new JS/CSS chunks. |

### Service Worker Strategy (current)

The SW implements a **network-first for navigation, cache-first for static assets** strategy:

```
Navigation (HTML)       → Network-first, fallback to cache
Static assets (JS/CSS)  → Cache-first, network update in background
Manifest / icons        → Pre-cached on install
```

This is described in detail in `/public/sw.js`.

---

## Preserving Offline-First Behavior

### What works offline

- Viewing the app shell and last-loaded page (cached HTML, JS, CSS).
- All interactions that depend on localStorage (guest mode CRUD — transactions, accounts, budgets, goals).
- CSV parsing (browser-only).
- JSON export/import.

### What requires network

- Initial load of new JS/CSS chunks (if not yet cached).
- Supabase authentication (sign-in flows).
- Cloud backup upload and restore.
- Any new route or component not previously visited.

### Constraints to maintain

1. **Do not add auto-update prompts.** The PWA should not nag users to refresh. The `skipWaiting()` call in the SW handles this silently.
2. **Do not add background sync without user consent.** Future use of the Background Sync API must be opt-in.
3. **Keep service worker scope at root (`/`).** Changing scope can invalidate existing caches unexpectedly.
4. **Version the cache name** (`openledger-shell-v2`). Bump on breaking SW changes so old caches are cleaned up by the `activate` event handler.
5. **Do not cache API responses.** The app has no server API for local mode. Cloud backup data should never be cached in the SW.

---

## v0.5.x → v0.6.0 Update Considerations

| Concern | Approach |
|---------|----------|
| Data schema changes | `normalizeLedgerBackup` handles forward/backward compatibility. Schema upgrades are applied on read. |
| New service worker | Bump `CACHE_NAME` in `sw.js`. Old caches are cleaned by the activate handler. |
| New icons / manifest | These are fetched fresh on navigation. Manifest changes are picked up by the browser automatically. |
| Breaking UI changes | Users get the latest JS on their next navigation. Old chunks are evicted from cache by the activate handler. |
| New required env vars | Document in release notes. App should degrade gracefully if optional vars are missing. |

---

## Manual Update Check (Future)

If a future version adds a manual update check (e.g., a "Check for updates" button in Settings), it should:

1. Fetch the latest version from a lightweight endpoint (e.g., Vercel deployment meta-tag or a version.json).
2. Compare with the current version (injected at build time via `process.env.NEXT_PUBLIC_APP_VERSION`).
3. If a newer version exists, show a non-blocking banner: "A new version is available. Refresh to update."
4. Never force-update or block usage of an older version.
