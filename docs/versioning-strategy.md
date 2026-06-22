# OpenLedger — Versioning Strategy

> **Document status:** Current for v0.5.x series  
> **Last updated:** June 21, 2026

---

## Version Schema

OpenLedger follows **Semantic Versioning 2.0.0** with a `vMAJOR.MINOR.PATCH` scheme:

```
v0.5.1
│││
││└── Patch: bug fixes, asset updates, docs, store metadata, non-breaking infrastructure
│└─── Minor: new features, UI additions, optional auth/backup improvements
└──── Major: architectural changes, breaking data schema, mandatory auth, backend shifts
```

While the app is in **pre-release (v0.x)**, the MAJOR version stays at 0 to signal that the API surface and data schema are still stabilizing.

---

## Current Series: v0.5.x

**Theme:** Budgets, goals, dashboard polish, and store readiness.

| Version | Date | Scope |
|---------|------|-------|
| v0.5.0 | June 19, 2026 | Budgets & Goals feature release |
| **v0.5.1** | **June 21, 2026** | **Store readiness: icons, legal pages, a11y, docs, crash reporting** |
| v0.5.2 | TBD | Follow-up polish based on store feedback |
| v0.5.3 | TBD | Translation / i18n groundwork |

### v0.5.x branch strategy

- Feature branches branch from `main`.
- Each v0.5.x release is tagged from `main`.
- Hotfixes (critical bugs) branch from the tag, PR back to `main`.

---

## Next Series: v0.6.0

**Theme:** Multi-device sync, enhanced export, and improved PWA capabilities.

| Area | Planned |
|------|---------|
| **Sync** | Optional passphrase-encrypted sync layer |
| **Export** | CSV export (currently JSON only) |
| **PWA** | Background sync API, improved offline support |
| **Categories** | Custom category creation |
| **Reports** | Annual summary, tax prep view |

v0.6.0 will remain **local-first** and keep guest mode as default.

---

## Future: v1.0.0

The 1.0 milestone marks a stable data schema (v2) and a commitment to backward compatibility within the 1.x series. Requirements for v1.0.0:

- Data schema v2 finalized and frozen.
- No breaking change without a major version bump.
- Full test coverage of the persistence layer.
- Formal accessibility audit.
- Published privacy policy and terms of service (added in v0.5.1).

---

## Schema Versioning

The `PersistedLedgerState` has a `schemaVersion` field (currently `1`). The `normalizeLedgerBackup` function handles upgrades and gracefully rejects future schemas. Rules:

1. **Backward-compatible changes** (adding optional fields) increment the schema version by a minor bump.
2. **Breaking changes** (removing or renaming fields) increment the major schema version.
3. The app always reads the current schema version and all prior versions.
4. When saving, the app writes the latest schema version.

---

## Release Checklist

For each release:

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds
- [ ] Unit tests pass (`npm test` or equivalent)
- [ ] Tagged with `vX.Y.Z` on `main`
- [ ] Release notes written
- [ ] Deployed to Vercel production
- [ ] Store screenshots updated (if UI changed)
- [ ] Store metadata updated (if applicable)
