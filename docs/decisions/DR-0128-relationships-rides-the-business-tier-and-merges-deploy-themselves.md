# DR-0128 — Relationships rides the Business tier; a merge deploys itself (the cron was never a 5-minute net)

- **Status:** accepted
- **Tier:** B (a tier-gate widening + a merge-lane trigger; rides the lane — the lane change carries the DR-0107 prove-the-deploy duty)
- **Scope:** the Relationships surface's audience; the auto-merge → deploy hand-off
- **Date:** 2026-07-08
- **Principles:** APP-IS-PRIMARY, VERIFICATION-DOCTRINE, DATA-AS-EMPOWERMENT, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## Directives

Darrell, 2026-07-08: *"We need to add the Relationships tab to the Business Tab too"* — and, same sitting, *"the PoeTech App looks down again on incognito and chrome"* (screenshot: the boot-heal screen "Almost there — one more tap").

## Decision

1. **Relationships shows on the Business tier.** The relationship-permission matrix (guardian↔child, family circle, landlord↔tenant, landlord↔manager 1099 delegation) is exactly what a business running on PoeTech stewards — the nav entry and the surface now open for `family/governor OR tier ≥ business`. A business account stewards its OWN instance; RLS keeps the tenancy boundary (DR-0060) and the matrix itself derives live from the permission model (REV-0011's proven no-painted-permissions design).
2. **The "down" sightings were the heal screen during our rapid deploy cadence, not an outage** — devices holding the old build across four same-night deploys. Root cause of the WINDOW: after a native auto-merge, NO event fires the deploy sweep (a GITHUB_TOKEN merge emits no push; main-CI doesn't run), leaving only the deploy-freshness cron — and GitHub schedule delivery was MEASURED firing ~hourly (22:19 → 23:25 → 00:58), not every 5 minutes as written. **Fix: the auto-merge sweep now also runs on `pull_request: closed`, so the merge itself runs the deploy-if-undeployed step** — the site advances the moment a PR lands. The cron stays as the outer net. Cache headers verified correct (HTML no-store, hashed assets immutable); the heal screen with its one-tap Reload is the designed recovery, and the shorter stale window shrinks how often anyone meets it.

## Constraint (carried)

Per DR-0107, this lane change is not "done" until a real merge is WATCHED producing a real deploy run — the next PR through the lane is the proof, and it must be checked, not assumed.
