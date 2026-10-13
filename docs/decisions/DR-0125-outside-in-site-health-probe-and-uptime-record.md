# DR-0125 — The site is proven UP from outside, on a clock; downtime is a measured, in-app record, and Ari owns the watch

- **Status:** accepted
- **Tier:** A/B (a new scheduled probe workflow + a read-only live strip on the Ops surface; touches no serving path)
- **Scope:** `.github/workflows/site-health.yml` (the probe), `app/src/lib/site-health.js` + the OpsBoard Uptime strip (the in-app record), `ARI_STANDING_DUTIES` (the responsibility)
- **Date:** 2026-07-08
- **Principles:** VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, APP-IS-PRIMARY, NO-STATIC-DATA, WAYS-REVIEW

## Directive

Darrell, 2026-07-08: *"The PoeTech App is down again!!!! How many times today? Again when we add features we need to update our Ways and documentation and find the opportunities and constraints, Ari's responsibility and reports should all update to reflect as well all inside the PoeTech App. No static data combine what makes sense and keep cleaning until we like it."*

Both halves of that landed as this decision: the downtime itself, and the fact that **"how many times today?" had no measured answer** — the record surfaces had been outrun again (the DR-0120 failure class, now on the ops axis).

## The gap (verified before building — reality-trace)

Every safeguard in the delivery lane watched the **pipeline**, none watched the **site**: CI proves the build; the auto-merge heal + `deploy-freshness.yml` prove a deploy was *dispatched* for main's tip; DR-0107 binds "prove the deploy." But on 2026-07-08 the app was reported down while **every deploy run in the ledger was green** — and the agent's cloud sandbox verified it had *no route at all* to observe poetech.us (network-policy 403 on direct fetch AND on every relay). Deploy-success is not site-up, and nothing that could see the site was looking at it. Today's measurable record before the probe existed: two stale windows (~37 min after #689, ~14 min after #692), ten deploy-churn skew windows, and **zero instruments** that could have seen a true outage.

## Decision

1. **The probe** (`site-health.yml`): every ~10 minutes, a GitHub runner — a vantage point *outside* both the sandbox and Cloudflare — measures the served product with browser-shaped requests: root redirect answers into `/poetech-app/`, the shell is real HTML with the `#root` mount, the shell's **own hashed bundle exists** (the stale-shell/white-screen class), and the served `sw.js` build SHA equals main's tip. It carries the three brakes (bounded budget; single-instance concurrency; `SITE_HEALTH_ENABLED='false'` kill-switch — the DR-0109/DR-0110 healer class, ships active).
2. **The record**: a failing observation files on the single rolling **`incident`-labeled issue** (evidence, run link, served-vs-main SHAs); recovery closes it. A stale-but-up observation dispatches the deploy heal (idempotent; the deploy's own `cf-pages-deploy` group prevents stacking). "How many times today" is now a query, not a memory.
3. **In the app, live (DR-0121 — no static data):** `lib/site-health.js` reads the probe runs, the incident ledger, and deploy freshness straight from the public repo's API (through the same shared ETag/rate-budget path as `github-ops.js` — one budget, not two), and the OpsBoard **Uptime strip** renders the site's own line above the lane state: up/failing, serving-main-or-stale, checks and failures today, the open incident if any. A failed read says so; nothing paints green.
4. **Ari owns the watch** (`ARI_STANDING_DUTIES` key `uptime`, this DR): the uptime record is part of Ari's derived responsibilities and reports — it updates with the live sources by construction, never by hand.

## Opportunities and constraints

- **Opportunity:** a push alert (not just a record) when the probe files an incident — announce, not only heal; the 2026-07-06 follow-up, still open. `re-review: 2026-07-15`.
- **Opportunity:** fold deploy-churn into the probe's view — ten deploys/day each open a client-side skew window; batching quiet merges or probing immediately post-deploy would shrink it. `re-review: 2026-07-15`.
- **Opportunity:** the incident ledger as a Perpetual Report stream (live-fetched, beside the build-parsed LESSONS incidents). Deferred: the report is deliberately synchronous over props + build-parsed records; distilled incidents already reach it via LESSONS-LEARNED. `re-review: 2026-07-22`.
- **Constraint (verified):** GitHub throttles `schedule` crons under load — the "*/5" freshness healer really fires closer to hourly at times; the probe's cadence is therefore *up to* ~10 min, not guaranteed. The measured record states its own gaps (run timestamps), never interpolates.
- **Constraint (verified):** the cloud agent's sandbox cannot reach poetech.us at all (egress policy) — the runner is the team's eye, per WAYS-REVIEW: the agent's own limits never bound the team's.
- **Constraint (held):** the unauthenticated 60/hr API budget governs the in-app read — one shared ETag'd fetch path, mount + manual refresh only, never a poll.
