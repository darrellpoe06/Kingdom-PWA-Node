# DR-0622 — End to end means continuous: every workflow's output seeds the next, and the live data is the proof

- **Status:** accepted
- **Tier:** B (a new instance-less, governor-read table; a new scheduled read-only witness; a build gate over the whole repository)
- **Type:** rule + gate + feature
- **Date:** 2026-09-24
- **Scope:** `scripts/system-flow-registry.mjs` (the declared graph, new); `scripts/system-flow-graph.mjs` (the gates, new); `scripts/system-flow-proof.mjs` + `.github/workflows/system-flow-proof.yml` (the live measurement, new); `scripts/live-sql.sh` (carried byte-for-byte from DR-0618's branch); `infra/supabase/migrations-auto/0234-every-connection-leaves-its-live-numbers.sql` + `infra/supabase/tests/0234-system-flow-proof-smoke.sql` + a leg in `.github/workflows/rls-isolation.yml`; `scripts/interconnect-manifest.mjs` + `scripts/interconnect-guard.mjs` (the graph joins the existing manifest and guard); `app/src/lib/system-flow.js`, `app/src/components/SystemFlowProof.jsx` (inside Quality / Proof → Interconnect); `app/src/lib/operations-intelligence.js` + `app/src/components/OperationsIntelligence.jsx` (the proof as escalations); `app/src/lib/lesson-inbox.js` + `app/src/components/LessonInbox.jsx` (the speaker's receipt); `app/src/__tests__/system-flow-graph.test.jsx`; `docs/00-foundations/_root/COMPREHENSIVE-REVIEW-STANDARD.md` (dimension 10); `app/src/lib/ari-integrity-guard.js` (its row)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076: the data is the evidence; unknown is never green; every gate proven to catch), REALITY-TRACE (DR-0061), SPEC-CONFORMANCE (DR-0219), DR-0057 (the fruit loop), DR-0618 (the monitors read the live database), DR-0616 (the operations board), **DR-0621 (hold the hand of the process until it is done — the sibling Way this rule serves)**, DR-0132 (no n8n: the backend is Python and SQL on the NAS)
- **Grounds:** Darrell, 2026-09-24: *"We should have no reason why their interconnectivity of the application is not sound and solid. We should have rigorous connection points between the database and fields within the app that go through workflows that are in the end continuous loops that produce data. The data should be the proof of the end, whole end to end process. So we can actually see, and that data should seed the next process. And so that's what I mean when I say end to end, it is not to end with one workflow. All workflows will work, will flow into another workflow and all those will have a comprehensive overall solid sound workflow."* And, the same afternoon: *"It's more than just flagged when it doesn't work. It's actually analyzed and iteratively fixed ... There's a purpose for every workflow."*

## The rule

**End to end means continuous.** Every workflow, NAS job and screen declares what it reads, what it writes, and which one its output seeds next. The build fails when an output is read by no one (a dead end), an input is written by no one (an orphan), a declared table does not exist, a declared consumer does not really read it, or a new workflow, NAS job or table appears with no place in the graph. **The live data is the proof**: every connection shows its real latest numbers — how many rows were written, the newest one, how many were picked up downstream — and a connection with no live number is never shown as flowing.

## Context — SHOULD → ARE → GAPS (DR-0219)

**SHOULD.** The interconnect manifest said it proves "the loops of interconnected modules are actually moving LIVE data" (`scripts/interconnect-manifest.mjs:2-3`).

## What was measured (ARE, before this record)

| what | measured |
| --- | --- |
| what the manifest proved | a token present in a file (`scripts/interconnect-manifest.mjs:243-249`): wiring, never a row |
| what it covered | 18 pairs; 0 of 46 GitHub workflows; 0 of 20 NAS services and loops |
| the tables the app touches | 169 distinct names across `.from('…')`, `remoteTable:` and realtime channels in `app/src`; 271 tables created by the migrations |
| a workflow's result reaching the app | 6 of 46: the incident issues that deploy, harvest-health, level-witness, node-availability, ops-queue-health and site-health file, and the runs of three of them, are read by the OpsBoard (`app/src/lib/site-health.js:132-135`); the other 40 wrote their verdict where no screen or job read it |
| a spoken lesson's words reaching the speaker | none: `agent_inbox` is written by the app (`lib/agent-inbox-sync.js:23`) and read by no screen; the transcript Whisper writes (`infra/nas-lesson-voice/lesson_voice_transcribe.py:203`) reached only the cloud reader, through the mirror (DR-0614) |

**GAPS.** Proof was wiring, not data; the pairs were isolated; no gate saw a new workflow join nothing; the monitors' own output fed no next step; the speaker never saw the words of their own lesson.

## Decision

1. **The graph** (`scripts/system-flow-registry.mjs`) declares 106 nodes — every workflow file, every NAS service and loop in `infra/nas-loops/services.json` and `registry.json`, and the screens and libraries of the named flows — built from the real code: `.from('<table>')`, `remoteTable`, `rpc(…)`, the NAS jobs' `/rest/v1/` paths, each workflow's own steps. Every read and write names the file and the token the gate greps for. 219 connections are derived from it; the cycles the data runs in are found (Tarjan), and seven continuous loops are declared.
2. **The gates** (`scripts/system-flow-graph.mjs`, run by `interconnect-guard.mjs` in CI and in `verify:gates`): `dead-end`, `orphan`, `no-table` (the table and its proof column exist in the migrations), `no-wiring` (the declared consumer's file really carries the read), `unseeded`, `uncovered` (a workflow file, a NAS rider, or a table born after migration 0233 with no place), `open-loop` and `open-gap` (a gap passes only with a named blocker AND a re-review date). Each is proven to catch a planted break in `app/src/__tests__/system-flow-graph.test.jsx`, including against the real registry (remove the app's read of the NAS runner's outcome → `dead-end` on `db:ops_commands#finished`; add a workflow file with no node → `uncovered`).
3. **The live numbers.** `system-flow-proof.yml` runs every 6 hours (budget: one API call per workflow, one SQL batch, 10 minutes; lock: its own concurrency group; stop-path: `SYSTEM_FLOW_PROOF_ENABLED='false'`). It reads the database the app reads through `scripts/live-sql.sh` (never the retired hosted project), each measurement in its own sub-transaction so one failure records its error instead of blanking the rest, and each workflow's latest run through the GitHub API. It writes one row per resource into `system_flow_proof` (0234): not instance-scoped, written only by the service and migration roles, read only by owners, admins and members of poe-family. The smoke proves a viewer and another instance's owner read nothing and no signed-in user can write; it was proven to catch a planted open policy on a local Postgres 16.
4. **The data seeds the next step.** The operations board (DR-0616) reads every broken, stale, empty, unconsumed or open connection as an escalation, and says when the proof was not read. The Interconnect proof shows the whole graph as a phone-first list of chains: each step, what it writes, who picks it up, the numbers, their age, and the state in plain words.
5. **The speaker's receipt.** "Your lessons" under the Thinking Space reads the person's own `agent_inbox` lesson rows back: received, waiting for Whisper, written down (with the words), could not be written down (with why), and carried to the lesson reader.
6. **Comprehensive now has ten dimensions**: dimension 10, CONTINUITY, is added to `COMPREHENSIVE-REVIEW-STANDARD.md` and to the integrity guard's dimension list.

## Impact — what this push fixed, and what is named with its blocker

Fixed: proof by data instead of by file; the 40 workflows whose verdict reached nothing now reach the operations board through the proof; the speaker sees their lessons; every workflow and NAS job has a declared place and a new one cannot join without one.

Named (each one on the surface in red, with its blocker and date; the gate refuses any without both):

| gap | blocker | re-review |
| --- | --- | --- |
| a shipped fix does not mark the note it fixes | closed in the second push (below) | done |
| `sermon_video_stats` has no live producer (`scripts/load-video-engagement.mjs` runs nowhere) | closed in the second push (below) | done |
| Scribe transcripts and minutes are written on the NAS and read back by nothing | closed in the second push (below) | done |
| office pushes wait in `push_outbox` | the drain ships off until a real phone is proven to receive (DR-0400 / DR-0334): a phone in a person's hand | 2026-10-01 |
| the n8n wf18 bearer's only reader is n8n | n8n leaves by Darrell's decision (DR-0617); this workflow leaves with it once wf18's replacement is proven | 2026-10-01 |
| the monitors' escalations return to the data through a person | by design: the Governor decides the fix; the next proof run shows it flowing again | 2026-10-24 |

## Impact, continued — the second push closed three of them

1. **The fix loop closes.** `.github/workflows/feedback-fixed.yml` (hourly; budget + lock; stop-path `FEEDBACK_FIXED_ENABLED='false'`) reads the commits on the DEPLOYED build (the head of the latest successful deploy run, never merely merged) and marks every open note a commit names — by the reference the board shows (`fixes feedback 7KQ-M4X`) or its id (`feedback 1a2b3c4d`) — as `fixed`, writing which change fixed it where the sender reads it (`scripts/feedback-fixed.mjs`). A declined note is never reopened; an unnamed note is never touched. Proven on a local Postgres 16: two named notes marked, a declined one left, a second run marked none.
2. **The orphan has a producer.** `.github/workflows/video-stats.yml` (every 6 hours) reads each recent service video's public views and likes from the channel's own feed — no key, no quota, the feed the Church tab already reads — and upserts them onto the videos the service record holds (`scripts/video-stats-feed.mjs`). Proven on a local Postgres 16: the join wrote the one held video and skipped the other; a second run updated in place.
3. **The Scribe chain reaches the NAS and comes back.** Measured: the app sent no credential while the server required its own token, and `/scribe` was listed UNACTUATED in `infra/nas-transport/RECORDED-STATE.md` since 2026-09-06 — no recording from the app could have landed. Now the server accepts the family key every device already provisions (DR-0613), `infra/nas-scribe/install.sh` mounts `/scribe` on the Funnel (funnel, never serve) and restarts the server when its code changes, and `GET /scribe/sessions` + `/scribe/session/{id}` give back each recording's state, transcript and minutes, shown under "Your recordings" on the Scribe screen (`app/src/components/ScribeRecordings.jsx`). A new gate, `no-route`, fails the build when a connection rides a route the Funnel does not mount; proven by removing `/scribe` from the mounted table.

## What the first live measurement found (run 36059041587, 2026-09-24 21:04 UTC)

The BEFORE state, on the database the app reads: 77 resources measured — **38 flowing, 18 empty, 9 stale, 10 broken, 1 unconsumed, 1 unknown**. What each finding became:

| finding | root cause | state now |
| --- | --- | --- |
| `ci.yml`, `auto-merge.yml` read "broken" | the measurement took the newest run on any branch, a PR's `action_required` | **fixed**: runs on main first, only success/failure/timeout decide (`pickRun`) |
| `push-outbox-drain.yml` read "broken" | every fire is `skipped` by its stop-path (DR-0400) | **fixed**: reads "switched off", never broken |
| migration ledger 36 days stale (151 rows, newest 2026-08-19) | the live replay records in `_sovereign_replay`; `_schema_migrations` there is the repoint's frozen copy, and the app's migration panel (0060) and `sovereign-drift.yml` both read the frozen copy | **fixed**: 0235 reads the live ledger; sovereign-drift reads it first |
| `choir_songs` "unknown" (7 rows, no date) | the rows carry no `updated_at` | **fixed**: measured on `created_at` |
| `sermon_video_stats` empty | no producer | **fixed** in the second push (video-stats.yml); fills on its first run |
| feedback: 60 notes, 0 answered | triage shipped today (DR-0616) | **carried** by the operations board: the escalation is on the steward's screen now |
| empty: concerns, discussions, decision_readouts, video_harvests, saved_prompts, door_feedback, church_service_segments, push_outbox, agent_inbox lessons/transcripts | nothing yet written on the live database (several shipped this week) | **carried**: each reads "nothing written yet" and turns flowing on its first row; none is painted |
| stale: ops_commands (80 days), projects (91), incidents (92), board_tasks (34), agent_tasks (33) | no one has used these doors since; the queue drains (ops-queue-health green) | **carried** as escalations on the operations board |
| `mcp-health` red since 2026-08-04 | re-dispatched (run 36062034869): `HTTP 404 {"detail":"Not Found"}` — the Funnel's `--set-path /mcp` strips the mount, the call arrives as `POST /`, and the server routed only `/mcp`; its installer also never restarted a running server, so a code fix would not have been served | **fixed**: the server answers `/` and `/mcp`; the installer restarts on a code change (hash stamp), as the Scribe installer now does |
| `nas-agent-arm`, `nas-storage-sync`, `source-transcript`, `transcript-backfill` last runs failed | dispatch-only tools whose last hand-run failed (Aug–Sep); `source-transcript` is superseded by `source-transcript-nas` (YouTube challenges runner IPs), `transcript-backfill` by the NAS trickle (874 transcripts live) | **named**: re-dispatch each when used; combining the superseded pairs is the next leanness step, `re-review: 2026-10-01` |
| `nas-email-door` failed | needs the Google App Password only Darrell mints (DR-0111 §2) | **named**: his value, `re-review: 2026-10-01` |
| `harvest-health` failed on schedule | the transcript stall incident it exists to raise; its live-read rewrite is DR-0618's (PR #1772) | **carried** by DR-0618 |
| `ari-comprehensive-review` schedule stopped (59 days) | its weekly schedule has not fired since July | **named**, `re-review: 2026-10-01` |

## Verification

- `node scripts/interconnect-guard.mjs`: 0 findings over 106 nodes, 219 connections, 48 workflows, 20 NAS riders.
- `app/src/__tests__/system-flow-graph.test.jsx`: every gate caught its planted break; the verdict never reads unknown as flowing; the proof SQL writes only its own table; the surfaces render the live numbers and say plainly when there are none.
- The 0234 smoke passed on a local Postgres 16 and raised `LEAK: a poe-family VIEWER read 1 proof rows` when an open policy was planted.
- After merge: the first dispatched `system-flow-proof.yml` run records the before-state of every connection; the fixes that follow are measured against it.
