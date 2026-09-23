# 2026-09-23 — Workflow redundancy audit: what fires, what it proves, what is noise

Darrell 2026-09-23: *"Let's see what redundant workflows exist in the app so we can get rid of the noise and keep all rigorous control and process and productivity is the measure of the development."* Layer 4 working artifact (ICM). Every number below is measured, not remembered; the source is named beside it. Record: DR-0591.

## 1. What was measured

- **GitHub Actions:** 46 workflow files under `.github/workflows/` (triggers read from the YAML) against the 829 most recent workflow runs the API returned (pages 1–8 of 100, window 2026-09-06T14:38Z → 2026-09-23T22:50Z; total runs on the repo 19,584). The run history in that window is not evenly spread: 2026-09-22 and 2026-09-23 carry 745 of the 829 runs; between 09-07 and 09-18 the API returned no runs at all, so per-workflow counts are dominated by the last two days.
- **NAS loop fleet:** `infra/nas-loops/registry.json` (6 loops), `services.json` (the services-sync manifest), and the box's own words from nas-health run 35923417492 (2026-09-23T21:35Z): the cron.d clock, the last 12 events, the cutover status file.
- **n8n:** `app/src/lib/n8n-base.js` (transport resolves EMPTY by default — no app code calls n8n), the 11 non-test importers, `app/functions/n8n/[[path]].js`, and the Funnel's root row in `infra/nas-transport/RECORDED-STATE.md`.
- **Live probes from a runner** (the sandbox has no route to poetech.us): history-voices-witness probe runs 35931262022 and 35931335878; live-link-probe run 35931484959 on this branch with in-flight request naming.

## 2. The inventory (every workflow, its trigger, its measured runs, what it says it proves)

| workflow | triggers | runs in window (results); last | header line |
| --- | --- | --- | --- |
| `android-package.yml` | workflow_dispatch | 0 in window | Android package — build the sovereign PoeTech app package (DR-0152, door 1). |
| `ari-comprehensive-review.yml` | workflow_dispatch | 0 in window | Ari comprehensive review — EVENT-ACTIVATED, braked, report-only (DR-0234 lane). |
| `arm-voice-studio.yml` | workflow_dispatch | 9 (failure 3, success 6); last 09-23T14:19Z | ============================================================================= |
| `auto-merge.yml` | pull_request(main) · check_suite · workflow_dispatch | 178 (pending 2, cancelled 115, action_required 1, in_progress 3, success 27, failure 30); last 09-23T22:50Z | Auto-merge bootstrap — hands-off promotion to main, gated by branch protection. |
| `auto-open-pr.yml` | push(feat/**,fix/**,merge/**,docs/**,claude/**) | 95 (success 91, cancelled 2, failure 2); last 09-23T22:50Z | Auto-open PR — push a release-lane branch, get a PR to main with zero local gh. |
| `ci.yml` | pull_request · push(main,feat/**,fix/**,merge/**,docs/**,claude/**) · merge_group | 174 (in_progress 2, failure 64, action_required 1, success 107); last 09-23T22:50Z | CI — the mechanical floor under RELEASE-TIERS.md. |
| `corpus-reconcile.yml` | cron 0 16 * * 1,4 · workflow_dispatch | 0 in window | corpus-reconcile — make the service-video corpus WHOLE (DR-0135) |
| `daily-review.yml` | workflow_dispatch · cron 0 12 * * * | 2 (success 2); last 09-23T15:39Z | Daily system review — the recurring health/leverage scan (DR-0058). |
| `db-migrate.yml` | push(main; 5 paths) · workflow_dispatch | 7 (success 7); last 09-23T21:59Z | db-migrate — the migration lane (2026-06-12; made resilient 2026-07-01) |
| `deploy-cloudflare-pages.yml` | push(main) · workflow_dispatch | 35 (success 34, in_progress 1); last 09-23T19:39Z | Deploy to Cloudflare Pages — the off-Vercel production pipeline. |
| `deploy-freshness.yml` | cron */5 * * * * · after Auto-merge · workflow_dispatch | 156 (pending 1, in_progress 1, success 113, cancelled 41); last 09-23T22:50Z | Deploy freshness — the SAFEGUARD that heals a missed production deploy. |
| `enable-auth-hook.yml` | workflow_dispatch | 0 in window | enable-auth-hook — turn ON the renter-portal custom access token hook via the |
| `harvest-health.yml` | cron 17 */6 * * * · workflow_dispatch | 8 (failure 8); last 09-23T21:31Z | Harvest health — proves the transcript pipeline is ADVANCING, from outside the NAS. |
| `history-voices-witness.yml` | workflow_dispatch · push(*; 4 paths) | 16 (in_progress 1, success 9, failure 4, cancelled 2); last 09-23T22:50Z | History voices witness — THEIR words, fetched not remembered (DR-0580). |
| `install-health.yml` | workflow_dispatch | 0 in window | Install health — prove poetech.us is INSTALLABLE as a PWA, from outside. |
| `lesson-mail-watch.yml` | cron */5 * * * * · workflow_dispatch | 13 (success 13); last 09-23T22:28Z | ============================================================================= |
| `level-witness.yml` | workflow_dispatch · cron 41 12 * * * | 2 (failure 2); last 09-23T17:25Z | Level witness — the reader's LEVEL SWITCH gets an instrument on the live site. |
| `live-link-probe.yml` | workflow_dispatch · cron 17 13 * * * | 2 (failure 2); last 09-23T17:51Z | Live link probe — a REAL BROWSER opens a shared lesson link on poetech.us and |
| `mcp-health.yml` | workflow_dispatch | 0 in window | mcp-health — the outside-in liveness probe for the sovereign MCP server |
| `migrate-freshness.yml` | cron */5 * * * * · workflow_dispatch | 13 (success 13); last 09-23T20:39Z | Migration freshness — the SAFEGUARD that heals a migration main merged and |
| `nas-agent-arm.yml` | workflow_dispatch | 0 in window | nas-agent-arm -- place the consumer's DB credential on the NAS (remote-hands). |
| `nas-bootstrap.yml` | workflow_dispatch | 0 in window | nas-bootstrap — the governed remote-hands channel (DR-0249 answer to |
| `nas-clock.yml` | workflow_dispatch | 0 in window | nas-clock — give the NAS loop fleet a clock, over the remote-hands channel. |
| `nas-email-door.yml` | workflow_dispatch | 0 in window | nas-email-door — wire the sovereign stack's email sender from a repo secret, |
| `nas-health.yml` | workflow_dispatch · cron 23 */6 * * * | 7 (success 7); last 09-23T21:35Z | nas-health — READ-ONLY observation over the remote-hands channel (DR-0249, |
| `nas-rotate-bearer.yml` | workflow_dispatch | 0 in window | nas-rotate-bearer — rotate the wf18 PII-webhook bearer through the SAME |
| `nas-storage-sync.yml` | workflow_dispatch | 12 (failure 10, success 2); last 09-23T19:01Z | nas-storage-sync — copy the Storage blobs hosted -> sovereign, over the |
| `nas-user-rescue.yml` | workflow_dispatch | 0 in window | nas-user-rescue — get a locked-out family member back IN, over the |
| `native-shell.yml` | workflow_dispatch | 3 (success 1, failure 2); last 09-23T01:19Z | Native shell — the family's LOCAL Android app (DR-0570), built beside the TWA. |
| `node-availability.yml` | cron 0 */6 * * * · workflow_dispatch | 8 (success 8); last 09-23T20:47Z | Pipeline device availability — is every always-on node actually up? |
| `ops-queue-health.yml` | cron 23 */2 * * * · workflow_dispatch | 9 (success 9); last 09-23T18:25Z | Ops-queue health — proves the app's operations queue still DRAINS, from outside the NAS. |
| `pm-synth.yml` | workflow_dispatch | 0 in window | PM-AI v0.1 — the Synthesizer (read-only portfolio brief). DR-0055. |
| `pr-janitor.yml` | workflow_dispatch | 0 in window | pr-janitor — the lane cleans up after itself (DR-0146) |
| `push-outbox-drain.yml` | cron */15 * * * * · workflow_dispatch | 13 (skipped 13); last 09-23T21:40Z | push-outbox-drain — deliver queued office pushes (DR-0400), SHIPPED INACTIVE |
| `push-sender-credentials.yml` | workflow_dispatch | 0 in window | ============================================================================= |
| `push-vapid-keys.yml` | workflow_dispatch | 0 in window | ============================================================================= |
| `review-watcher.yml` | workflow_dispatch · cron 23 11 * * * | 2 (success 2); last 09-23T15:28Z | Review watcher — drives the staged review/freshness loop (seed-review-sequences). |
| `rls-isolation.yml` | workflow_dispatch | 9 (failure 8, success 1); last 09-23T22:02Z | rls-isolation — ONE matrix workflow proves every feature's RLS isolation |
| `site-health.yml` | cron */10 * * * * · workflow_dispatch | 12 (success 12); last 09-23T21:44Z | Site health — proves poetech.us is UP and FRESH, from outside the building. |
| `source-transcript-nas.yml` | workflow_dispatch | 2 (success 1, failure 1); last 09-22T04:48Z | source-transcript-nas — fetch a video transcript from the NAS's residential IP |
| `source-transcript.yml` | workflow_dispatch | 1 (failure 1); last 09-22T00:50Z | source-transcript — turn a video link Darrell sends into TEXT this session can read |
| `sovereign-content-sync.yml` | workflow_dispatch · cron 20 6 * * * | 2 (success 2); last 09-23T11:38Z | Sovereign content sync — the rows the NAS pipelines filed on the retired |
| `sovereign-drift.yml` | workflow_dispatch | 0 in window | Sovereign migration drift — READ-ONLY witness (DR-0317) |
| `sovereign-read.yml` | workflow_dispatch | 4 (success 4); last 09-22T23:31Z | sovereign-read — ask the database the app actually reads (2026-09-12) |
| `sovereign-replay.yml` | workflow_dispatch | 0 in window | Sovereign migration replay — hand-dispatched backfill for the database the app READS |
| `transcript-backfill.yml` | workflow_dispatch | 0 in window | transcript-backfill — YouTube auto-caption harvest for @thelovecorner |

## 3. What the measurement says — findings, most costly first

### 3.1 Red gates nobody was reading (DR-0076 §3: a gate that always fails is theatre in the other direction)

| witness | measured | root cause | closed by |
| --- | --- | --- | --- |
| `rls-isolation` | 8 of 9 runs red; only the `role-control` leg fails (run 35926047728, 11 other legs green) | 0221 widened `list_my_admin_instances()` RETURNS with DROP+CREATE; the leg re-applies 0112's narrow CREATE OR REPLACE on a database already at 0221 — Postgres refuses ("cannot change return type"). Listed in order, refused anyway: the replay-order guard's third blind spot. | the leg's `pre` drops the function first; `checkReplayShapes` in migration-replay-order-guard.mjs names the class; proven-to-catch (the live pair without the pre-drop fails the guard). Commit 6ab4752. |
| `harvest-health` | 8 of 8 scheduled runs red | the transcript rider is SILENT (nothing written for 216 h; 122 transcripts owed of 874) AND the heal step's `gh workflow run nas-bootstrap.yml` answered HTTP 403 "Resource not accessible by integration" on every fire — the workflow had no `actions: write`. The stall record on issue #1617 grew a comment per fire; the heal never ran. On the box (nas-health 21:35Z): `youtube_transcript_api` importable as dpoe, `ModuleNotFoundError` as root — who services-sync runs as. | `actions: write` granted (commit 6ab4752) so the SILENT heal actually dispatches. The root-side module install is the NAS-side fix the heal exists to run. |
| `live-link-probe` + `level-witness` | green daily 09-13 → 09-19; red every day 09-20 → 09-23 (4 cases, all "page.goto: Timeout 60000ms exceeded" waiting for networkidle) | the failure line carried no evidence of WHAT stayed in flight; the runner's own curl of the same pages answers in <1 s; the local build reaches network-idle in 2.2 s. The date matches the `/voice` route's intended-state row (added 2026-09-20). | the witness now names the requests still in flight when the wait gives up (commit ba480c7); measured live on this branch in run 35931484959 — see §3.2. |

### 3.2 A 200 that was not the studio's — the same-origin `/voice` road today

Runner measurement (run 35931262022, 22:59Z): `GET https://poetech.us/voice/health` → **HTTP 200, title "n8n.io - workflow automation"**. The Funnel has no `/voice` mount (install.sh mounts it only once the forwarder passes a 200 through; the forwarder on the box answers `{"ok": false, "error": "studio-unreachable", "upstream": "http://tlcmediadpt:8770"}` — the studio is dark and the last `arm-voice-studio` run, 35873293207, failed with "no dialect was detected by the probe — nothing was armed"). So the same-origin call falls through the Funnel root to n8n — the exact class RECORDED-STATE records for `/taxes` and `/nas-photos`. `probeVoiceService()` read any 200 as "up"; every read-aloud first posted to a studio that was not there. Closed: the probe trusts only the studio's own `{ok:true}` (commit 1a95711; an HTML 200, a foreign JSON 200 and the forwarder's 502 all read as down, pinned). The Funnel-side fix is the studio being armed; until then the app now falls back honestly.

### 3.3 Real redundancy — where the same proof runs twice

| what | measured | proposal (keeps every gate) |
| --- | --- | --- |
| **CI runs twice per commit.** `ci.yml` fires on `push` to `claude/**` AND on `pull_request`; auto-open-pr uses `GITHUB_TOKEN` and its comment says token-opened PRs don't fire `pull_request` — but they do now: 95 push runs + 79 pull_request runs in the window, the same SHA checked twice (e.g. runs 35930517032 and 35930520363 on 5c772cd). | Add a `concurrency` group keyed on the head SHA so the second run cancels the first, OR drop `push` for the lane branches and keep `pull_request` + `merge_group`. This touches the merge lane, so it ships under DR-0107 (prove a merge still deploys) — decision requiring Darrell's word; recommended default: concurrency by SHA, fail-closed. |
| **deploy-freshness fires after every auto-merge run**, including the 115 cancelled ones: 143 `workflow_run` fires, 41 of them cancelled themselves. | `if: github.event.workflow_run.conclusion == 'success'` on the workflow_run path. Same DR-0107 lane rule. |
| **auto-merge: 178 runs, 115 cancelled** (its own concurrency group) — cost is near zero; the noise is in the Actions list only. | leave; it is the lane working as designed. |
| **push-outbox-drain:** 13 scheduled fires, 13 skipped (`vars.PUSH_OUTBOX_DRAIN_ENABLED` is not 'true'). | keep the clock (a skipped job costs seconds) — but this is a DR-0247 question: the drain is a deterministic, budgeted, single-flight job shipped behind a human variable. Darrell decides whether it starts by record. |
| **The "every 5/10/15 minutes" safeguards fire ~4–6 times a day.** site-health (`*/10`) 12 scheduled runs in the window, deploy-freshness (`*/5`) 13, migrate-freshness 13, lesson-mail-watch 13, push-outbox-drain 13 — all on 09-22/09-23 only, gaps of 2–6 h, none overnight 09-07 → 09-18. deploy-freshness's own header measured 7.7 % of the requested cadence on 2026-08-28; it is worse now. | Not redundancy — under-delivery. The event-driven hooks (auto-merge → deploy-freshness; push → migrate) are the real safety; the crons are an hours-scale net. The NAS clock (cron.d, every 15 min, 82+ cycles/day measured) is the reliable timer this project owns; the OpsBoard should show the measured cadence beside the requested one. |
| **nas-health's six-hourly cron fired once** (09-23T21:35Z scheduled) in the window; 6 of 7 runs were hand dispatches. | same GitHub throttling; leave the cron, keep dispatching after applies (rls-isolation already runs after db-migrate). |

### 3.4 Zero-run workflows (17 days): are they noise?

`android-package`, `ari-comprehensive-review`, `enable-auth-hook`, `install-health`, `mcp-health`, `nas-agent-arm`, `nas-bootstrap`, `nas-clock`, `nas-email-door`, `nas-rotate-bearer`, `nas-user-rescue`, `pm-synth`, `pr-janitor`, `push-sender-credentials`, `push-vapid-keys`, `sovereign-drift`, `sovereign-replay`, `transcript-backfill`, `corpus-reconcile`. All but one are `workflow_dispatch`-only remote-hands tools (a paste-free channel to the NAS is a control, not noise — DR-0108); they cost nothing idle. Two are findings: **`corpus-reconcile` has a cron (Mon/Thu 16:00Z) and did not fire in 17 days** (throttling again, or the schedule is dead — re-review); **`transcript-backfill`** is superseded by the NAS-side `transcript-trickle` rider and `source-transcript-nas` (CI is YouTube-IP-blocked) — a candidate to retire once the rider is proven advancing (it is SILENT today, §3.1).

### 3.5 NAS loop fleet — clocked, budgeted, and what each cycle actually says

Measured from the box (nas-health 21:35Z): cron.d fires `services-sync` every 15 min (82–86 calls of 96/day used by 21:31Z) and `health-check` hourly (4/4 healthy: n8n, ollama, photo-local, funnel). `surface-audit` and `scribe-transcribe` are `enabled:true` in the registry but have **no cron.d line** — enabled-but-unclocked, the registry's own comment names this as a check that means nothing (DR-0277). `funnel-watchdog` likewise. `transcript-backfill` is disabled with a why. Every services-sync cycle today ends DEGRADED on `choir-dates` (yt-dlp not available) and, once per cycle, on `transcript-trickle` (754/874, 120 owed) — degraded is green by design (exit 3), which is why harvest-health is the only thing that turned red. The cutover status file reads `go:false`: three viewer policies short on the sovereign side (0227 on #1756 closes that), storage short by one bucket (the hosted key, DR-0582), live side ahead (expected).

### 3.6 n8n — the transport is off; the code is not gone

`N8N_BASE` resolves empty by default, so no app code reaches n8n; the same-origin `/n8n/*` Pages Function still exists (legacy name, DR-0075 rename item), the Funnel root still maps to n8n (RECORDED-STATE row 1, "being removed to ZERO", DR-0218), and 11 non-test files still import `n8n-base.js` — 9 for `n8nAuthHeaders`, 1 for `N8N_BASE` in prose, 2 with zero uses (BooksTaxes.jsx, ReviewFeed.jsx: dead imports). The Funnel root is exactly what turned a missing `/voice` mount into a 200 (§3.2): the legacy root is not neutral, it answers for every unmounted path.

## 4. Decisions requiring Darrell's word (recommendation with a default, DR-0111)

1. **CI twice per commit** — recommended: concurrency by head SHA (fail-closed), shipped with a watched merge per DR-0107. Default if silent: ship it on the next lane-touching PR with the deploy proof.
2. **deploy-freshness on cancelled auto-merge runs** — recommended: gate on `conclusion == 'success'`; same PR.
3. **push-outbox-drain behind a human variable** — recommended: start by record (DR-0247) once PUSH_SEND_TOKEN is placed; otherwise it stays a skipped clock.
4. **Retire `transcript-backfill.yml`** once the trickle rider writes again — re-review 2026-10-07.
5. **The Funnel root → n8n** — DR-0218's order stands; the finding here is that the root makes every unmounted path a false 200. Recommended: the funnel-watchdog loop probes each RECORDED-STATE mount and reports a path that answers with n8n's page as DOWN.

## 5. Not done, said plainly

- The never-idle cause on the live site is named by run 35931484959 (this branch's witness with in-flight naming); the section above records the runner's timings, and the run's own lines are the evidence. If that run reached idle, the four-day red was the `/voice` fall-through's side effect and is closed by 1a95711 after deploy; if it did not, the named requests are the next fix.
- The 09-07 → 09-18 gap in the runs API is stated, not explained.
- NAS-side: the root-user `youtube_transcript_api` install and the yt-dlp install are the rider's real blockers; nas-bootstrap (services-sync) is the channel, and harvest-health can now dispatch it.
