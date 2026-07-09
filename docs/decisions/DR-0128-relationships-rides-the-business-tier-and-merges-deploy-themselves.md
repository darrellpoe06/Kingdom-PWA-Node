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

## Correction (2026-07-08, same night — the watch did its job)

The DR-0107 watch on the next two merges corrected the mechanism claim in Decision 2:

- **PR #695 (dcb2d37) deployed hands-off — but via the armed-PR wait loop, not the `closed` trigger.** The dispatching run (28916916404) was a `check_suite` sweep whose poll caught main advancing; no `pull_request: closed` run ever fired for the merge.
- **PR #697 (901f42b) proved why: the auto-merge close is itself a GITHUB_TOKEN action, so its `closed` event is suppressed** — the same anti-recursion rule that already suppressed the merge push (P25). And the arming sweep fires at PR-OPEN, so its 2-minute poll expired before the ~3-minute CI went green; the deploy was dispatched by the watching agent (run 28917841247, success on 901f42b, ~5 minutes stale, family never met it).
- **Fix shipped:** the wait loop now polls 6 minutes (a full CI run plus margin from the earliest arming moment), and the `closed` comment states the truth: it catches human-clicked merges/closes only. The corrected chain: armed-PR wait loop (primary, for auto-merges) → `closed` sweep (human merges) → deploy-freshness cron (outer net, ~hourly).

The lesson for the ledger: **an event emitted BY a GITHUB_TOKEN action never triggers a workflow — `push`, `pull_request: closed`, all of it.** Any future lane trigger must be checked against that suppression rule before it is trusted, and DR-0107's watch is what caught this one.
