# DR-0591 — The noise is measured, not guessed: three red gates nobody read, CI run twice per commit, a Funnel root that answers 200 for every unmounted path — and what closed today

- **Status:** accepted
- **Tier:** A for what shipped (a guard extension, a leg pre-drop, one permission, a probe that names its evidence, a health check that trusts only the studio's own answer); the lane-touching proposals are held for Darrell's word (DR-0107)
- **Type:** orchestration (REV — a review of our Ways, DR-0108)
- **Date:** 2026-09-23
- **Scope:** `docs/99-session-notes/2026-09-23-workflow-redundancy-audit.md` (the full inventory, 46 workflows × triggers × measured runs); `scripts/migration-replay-order-guard.mjs` (+ `checkReplayShapes`, `functionShapes`, `droppedFunctions`, `pre` on legs); `app/src/__tests__/migration-replay-order.test.js`; `.github/workflows/rls-isolation.yml` (role-control pre); `.github/workflows/harvest-health.yml` (`actions: write`); `scripts/live-link-probe.mjs` (in-flight naming); `app/src/lib/voice-service.js` + `app/src/__tests__/voice-service-hardening.test.js`
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §3 proven-to-catch, §8 provenance), REVIEW-OUR-WAYS (DR-0108), SPEAK-ESTABLISHED-FACT (DR-0100), PERPETUAL-IMPROVEMENT (DR-0075), PROVE-THE-DEPLOY (DR-0107), NOTHING-WAITS (DR-0236)
- **Grounds:** Darrell 2026-09-23: *"Let's see what redundant workflows exist in the app so we can get rid of the noise and keep all rigorous control and process and productivity is the measure of the development."* And his standing checklist: never guessed, always data driven, what is enforced, is synchronization of each component occurring.

## Context

Forty-six GitHub workflows, a six-loop NAS fleet, and a legacy n8n transport all fire or wait on their own clocks, and nothing had counted what each one actually did lately. "Redundant" cannot be decided from file names; it needs each workflow's triggers, its measured runs and results, and what each red run was red ABOUT. The audit read the YAML triggers of every workflow, the 829 most recent runs the API returned (window 2026-09-06 → 2026-09-23; 745 of them on the last two days), the NAS's own cron.d and event log through nas-health run 35923417492, and three runner-side probes of the live site, because the sandbox has no route to poetech.us.

## What was measured

| what | measured |
| --- | --- |
| workflows / runs read | 46 files; 829 runs (pages 1–8 of 100), 19,584 total on the repo |
| rls-isolation | 8 of 9 runs red; one leg (`role-control`) of 12; error `cannot change return type of existing function` on 0112 after 0221 (run 35926047728) |
| harvest-health | 8 of 8 scheduled runs red; rider SILENT 216 h, 122 of 874 transcripts owed; heal dispatch `HTTP 403: Resource not accessible by integration` on every fire (run 35922936285) |
| live-link-probe / level-witness | green 09-13 → 09-19, red 09-20 → 09-23; every case `page.goto: Timeout 60000ms` with no named cause; local build idle in 2,239 ms; runner curl of the same pages < 1 s |
| `/voice/health` from a runner | HTTP 200, title "n8n.io - workflow automation" (run 35931262022); forwarder on the box answers `studio-unreachable`; last arm run 35873293207 failed "no dialect was detected" |
| CI per commit | 95 `push` + 79 `pull_request` runs of ci.yml; the same SHA checked twice (35930517032 / 35930520363 on 5c772cd) |
| deploy-freshness | 156 runs: 143 `workflow_run` (after every auto-merge run incl. 115 cancelled ones), 41 self-cancelled, 13 scheduled |
| the `*/5` and `*/10` crons | 12–13 scheduled fires each in the window, all on 09-22/09-23, gaps 2–6 h; corpus-reconcile's Mon/Thu cron 0 fires |
| NAS fleet | cron.d: services-sync every 15 min (86 of 96 calls by 21:31Z), health-check hourly (4/4); surface-audit, scribe-transcribe, funnel-watchdog enabled but unclocked; every cycle DEGRADED on choir-dates (yt-dlp) and transcript-trickle |
| sovereign parity | `go:false` — 3 viewer policies short (0227 on #1756), storage short by 1 bucket (the hosted key), live side ahead |
| n8n | transport off (`N8N_BASE` empty); 11 non-test importers, 2 with zero uses; Funnel root still → n8n, which is what made an unmounted `/voice` answer 200 |

## Impact

Three witnesses were red for days and taught nothing: a failing isolation leg meant the matrix never re-proved eleven features' isolation on hosted after an apply; the transcript rider stalled nine days while its heal could not fire; two daily browser witnesses said "timeout" without saying what waited. Meanwhile the app read a dark voice studio as UP because a legacy root answers every unmounted path, so each read-aloud tried a studio that was not there before falling back. On the cost side, every commit paid for two CI runs and every auto-merge run, cancelled or not, woke a healer. None of this is "noise" in the sense of files to delete; it is signal that was not being read, and a few real duplicates.

## Decision

1. **Red gates are fixed, not muted.** The role-control leg drops `list_my_admin_instances()` in its pre-step, and `checkReplayShapes` makes "a leg that replays a function under two RETURNS shapes must drop it first" a rule the guard enforces (proven-to-catch against the live pair). harvest-health gets `actions: write` so a SILENT pipeline's heal actually dispatches. The live-link witness names the requests still in flight when its wait gives up.
2. **The voice probe trusts only the studio's own answer** (`{ok:true}`); n8n's page, a foreign JSON body and the forwarder's 502 all read as down, pinned.
3. **Lane-touching de-duplication is proposed, not shipped here** (DR-0107): CI concurrency keyed on head SHA (recommended default, fail-closed) or dropping `push` for lane branches; deploy-freshness gated on the auto-merge run's `conclusion == 'success'`. Both ride the next lane PR with a watched merge and a proven deploy.
4. **Zero-run dispatch-only workflows stay** — they are remote-hands controls, not noise (DR-0108). `transcript-backfill.yml` is a retirement candidate once the NAS rider writes again. corpus-reconcile's dead cron and the throttled `*/5` safeguards are recorded as under-delivery, with the NAS cron.d clock named as the reliable timer this project owns.
5. **The Funnel root → n8n is the finding behind §3.2**: a legacy root turns every missing mount into a false 200. DR-0218's removal order stands; the funnel-watchdog loop should report a mount that answers with n8n's page as DOWN (tracked here, re-review below).
6. **n8n dead imports** (BooksTaxes.jsx, ReviewFeed.jsx) are removed on the next touch of each file; the 9 `n8nAuthHeaders` importers retire with their wires (DR-0218).

## Verification

- `node scripts/migration-replay-order-guard.mjs` OK with the pre-drop; with the pre-drop removed it names the role-control leg and the 0112/0221 pair (proven-to-catch, 7 new pins in migration-replay-order.test.js; rls-isolation-matrix-guard 9/9; return-type 13/13; harvest-health 41 across three files).
- voice-service-hardening 10/10 incl. the n8n-page 200 → down pin; the six other voice suites 112/112; lint clean on the touched files.
- `node --check scripts/live-link-probe.mjs` clean; the-level-witness-can-be-read pins hold. **Live measurement, run 35931484959 on this branch: all four cases name the same one request — `/voice/health`, in flight since ~650–800 ms, still open when the 60 s wait gave up.** Mechanism: `fetch` resolves on n8n's 200 headers; the old probe never read the body and disarmed its abort in `finally`, so the stream stayed open. The fix reads the body inside the armed window (`res.json()`), so a body that never ends is aborted at 4 s and a foreign body reads down; pinned (voice-service-hardening 11/11).
- After merge: dispatch `rls-isolation.yml` and read the role-control leg green; the next scheduled harvest-health fire either heals (nas-bootstrap dispatched) or names the NAS-side install it needs; the next daily live-link-probe / level-witness runs carry named evidence.
- re-review: 2026-10-07 — the CI-twice and deploy-freshness proposals (§3 of the note) shipped or a why; transcript-backfill retirement; funnel-watchdog reporting a false-200 mount; corpus-reconcile's cron measured again.
