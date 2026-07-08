# 2026-07-08 — Uptime observability: what today's "down again" taught, the opportunities, and the constraints

> Layer 4 working artifact. Companion to DR-0125, LESSONS-LEARNED 2026-07-08 (P31), REV-0017.
> Trigger: Darrell, ~02:53Z — *"The PoeTech App is down again!!!! How many times today?"*

## What was actually true (measured, DR-0100 — stated plainly)

- **Every deploy run today was green.** Ten production deploys between 20:56Z and 03:06Z, all success, all `workflow_dispatch` (the heal lanes — no `push`-triggered deploy has fired since auto-merge went live, exactly as P25 predicts).
- **The server was UP when first measured.** The probe's first observation (03:06Z, browser-shaped, from a GitHub runner): `/` → 302 → `/poetech-app/` → 200 with the `#root` mount; the shell's own hashed bundle → 200; `poetech-app.pages.dev` → 200. Both the custom-domain layer and the Pages project healthy.
- **The day still held real user-facing failure windows:** two stale windows where main outran the served build (~37 min after #689 merged 23:51Z; ~14 min after #692 merged 02:17Z), and ten deploys' worth of client-side skew — an installed PWA mid-churn can white-screen or serve a mid-swap state while the ledger reads green. That is the most probable shape of what Darrell hit.
- **What cannot be verified retroactively (honest uncertainty, DR-0076):** the exact failure his device showed at ~02:53Z. No instrument was watching the site before 03:06Z — that absence is the incident, and it is now closed.

## The structural gap (why "how many times today?" had no answer)

Every safeguard shipped across 07-06 → 07-08 — the auto-merge deploy dispatch, `deploy-freshness.yml`, the race fix (#691) — watches the **pipeline**. None ever made an HTTP request to the **product**. CI proves the build; the healers prove a deploy was *dispatched*; DR-0107 proves the deploy *ran*. The chain stopped one link short of the family's actual question: *is the site up right now, and how often wasn't it?*

Doubled blindness, verified: the cloud agent's sandbox has **no route** to poetech.us at all — the egress policy 403s direct fetches AND every relay. The agent could never have seen the site from where it sits. The GitHub runner is the team's vantage point (WAYS-REVIEW / DR-0108: the agent's limits never bound the team).

## What shipped (DR-0125)

1. **`.github/workflows/site-health.yml`** — the outside-in probe, every ~10 min + on demand: up (root redirect + real shell), intact (the shell's own bundle exists — the stale-shell/white-screen class), fresh (served `sw.js` SHA vs main, with a deploy-ledger fallback so *unknown never reads as fresh*), isolated (pages.dev comparison). Three brakes; kill-switch `SITE_HEALTH_ENABLED='false'`.
2. **The downtime ledger** — every failing observation files on the single rolling `incident`-labeled issue with its evidence; recovery closes it. "How many times today" is a query now.
3. **The live in-app record** — `app/src/lib/site-health.js` + the OpsBoard **Uptime strip**: latest verdict, serving-main-or-stale, checks/failures today, the open incident. Reads the real API through the same shared ETag/rate-budget path as github-ops (one 60/hr budget, not two). A failed read says so; nothing paints green.
4. **Ari's record updated where it lives** — the uptime watch joined `ARI_STANDING_DUTIES` (resolves against DR-0125 in the live ledger); his notes pick up DR-0125 by construction (the DR-0122 design doing its job — no hand update).

## Opportunities (ranked, each with a date — DR-0075)

1. **Announce, not only record.** A push alert when the probe files an incident — the 2026-07-06 follow-up, still open. The heal is automatic; the family's awareness shouldn't wait for a screen visit. `re-review: 2026-07-15`.
2. **Shrink the churn.** Ten deploys/day = ten client skew windows. Options: batch quiet-stretch merges into fewer deploys, or fire the probe immediately post-deploy to shorten detection of a bad swap. Pairs with the existing chunk-heal work (PR #597, still open — its visible heal notice would close the white-screen half). `re-review: 2026-07-15`.
3. **The incident ledger as a Perpetual Report stream** (live-fetched beside the build-parsed LESSONS incidents). Deferred deliberately: the report is synchronous over props + build-parsed records, and distilled incidents already reach it via LESSONS-LEARNED. `re-review: 2026-07-22`.
4. **Probe the /n8n seam too.** The probe covers the static app; the same-origin `/n8n` Pages Function (the NAS seam) has its own failure modes. One more `fetch` block when the seam's health endpoint is stable. `re-review: 2026-07-22`.

## Constraints (verified, carried)

- **The sandbox cannot see the site.** Egress policy 403s poetech.us and every relay from the cloud agent's container (verified this session, twice). All observation runs on GitHub runners.
- **GitHub cron throttling.** `schedule:` fires best-effort — the "*/5" freshness healer really fires closer to hourly under load. The probe's cadence is *up to* ~10 min; the record states its own gaps (real run timestamps) and never interpolates.
- **The unauthenticated API budget (60/hr/IP)** governs the in-app read: shared ETag cache, mount + manual refresh, never a poll.
- **A GITHUB_TOKEN merge fires no `push` workflows** (P25) — the probe + healers exist *because* this is permanent GitHub behavior, not a bug to fix.
