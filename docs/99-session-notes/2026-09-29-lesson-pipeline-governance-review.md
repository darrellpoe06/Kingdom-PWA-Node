# The lesson pipeline, end to end: a governance review (2026-09-29)

**Asked by Darrell:** a governance review of the lesson pipeline being built today, with *"Flexibility with rigorous control of the system and processes."*
**Measured:** 2026-09-29, 04:30 to 05:00 UTC. Every number below cites where it was read: `file:line`, a run id, a SQL result, a `get_trigger` read, or a timestamp.
**In the app:** the findings are rows under Projects → ⚖ Decisions → "Governance · Review findings". The three decisions are OPEN-11, OPEN-12 and OPEN-13 in the queue above them. Source of truth: `docs/governance/decision-queue.md`.
**Registry:** REV-0255 (`docs/reviews/REVIEWS.md`).

## The lens: how the organization learns, prioritizes and decides (PM11, DR-0609)

Darrell's teaching of 2026-09-24, now Project Management lesson 11 (`app/src/lib/project-management-course.js:625`), is the lens for this review. *"Always think about how the organization learns, prioritizes, and decides, not just how an individual project gets delivered."* Organizations drown in information, and *"no one can see the pattern across them."*

The lesson's first case is Jethro's diagnosis of a governance system that lives in one head:

**KJV — Exodus 18:18:** *"Thou wilt surely wear away, both thou, and this people that is with thee: for this thing is too heavy for thee; thou art not able to perform it thyself alone"*

(The KJV is quoted because it is the corpus the lesson is pinned against; the ESV is not in the repo.) The remedy the lesson teaches is a taught standard, a tiered structure, and an escalation rule. It is also the question this review asks of the lesson pipeline:

- **How does the pipeline learn?** It learns from rows and tags in `agent_inbox`, labels in Gmail, and one chat session's memory.
- **How does it prioritize?** Through two Routine clocks and a sentence in a prompt ("PRIORITY lane").
- **How does it decide?** CI gates decide on quality. A prompt decides on capture. Darrell's word decides on widening the doors.

The pattern across the pipeline is Exodus 18:18 again. Too much of the pipeline's state lives in one place that no one else can see: one chat session, woken by both Routines. When that session did not build, nothing in the system said so for four days (LP-01).

## The ten dimensions (COMPREHENSIVE-REVIEW-STANDARD, DR-0239): what each showed

| # | dimension | result |
| --- | --- | --- |
| 1 | SHOULD/ARE (DR-0219) | Run, and traced below. SHOULD comes from DR-0312, 0608, 0610, 0611, 0614, 0635, 0639 and 0667; ARE comes from the Routines, the rows, the runs and the code. Gaps LP-01 to LP-14. |
| 2 | Journey walks | Walked in code, not on a device. (1) Darrell speaks a lesson on his phone, and the lesson later appears in Learn. (2) A member sends a situation, the Governor approves or declines, and the member reads the outcome. (3) Darrell forwards an email marked "Lesson". Journey 1 took 85 h 26 min on its slowest row (LP-01). No live device walk was possible: the sandbox has no route to poetech.us (DR-0125). |
| 3 | Surface-says-truth | Two defects. "Published: open it" can point to a lesson that is not live yet (LP-03). The Governor's queue labelled a credentials item Tier A (LP-15, fixed). |
| 4 | Form-factor | The new findings section is one column. Every cell is its own line with `break-words`/`break-all` on long evidence, and there is no table on the phone. It is not measured in a browser here: the chrome-layout probe runs in CI on the PR. |
| 5 | Delivery context | No step here needs his hands except the three decisions. OPEN-13 (the Gmail secret) is a value only he holds, and the recommendation is to retire the watcher, not to set the secret. |
| 6 | Findings are a work queue | Every finding ends as fixed in this PR, fix now by a named system, or carried by a named lane with a date and the reason it waits (table below). |
| 7 | Gate the class | Two new gates, both proven to catch: `governance-queue-parse.test.jsx` (5 of 5 breaks caught across both gates) and `ari-guard-dimensions.test.js`. |
| 8 | The Word's accuracy | The only Scripture here is Exodus 18:18, quoted from PM11 as the lesson carries it. PM11's verses are pinned by `lesson-door-and-pm11.test.js`. No claim is made across verses. |
| 9 | The surface is not hollow | The authored asset of the new section is the findings table. `governance-queue-parse.test.jsx` asserts that the real file's lesson-pipeline group arrives with 16 findings, each with evidence, an owner and a close, and that the empty state renders only when there are no reviews. |
| 10 | Continuity | The flow's live numbers: 10 lesson rows written; the newest `2026-09-29 00:01:13Z`; 10 of 10 tagged captured; 7 tagged published, but only 2 of those are live (LP-03); 0 carried back (`published-returned` 0 of 7 at 04:42Z). The reader's output does not yet seed the app's own row (LP-02). |

## Measurements

**Database** (hosted project `mjjlevhdufpaplypnqrv`, read-only selects, 2026-09-29 04:42:39Z). This is the *mirror* the reader reads, not the NAS database the app writes (DR-0614:19; LP-14).

| what | count |
| --- | --- |
| rows in `agent_inbox` | 10, all tagged `lesson`, all `created_by` c2a6c39a (Darrell's phone login) |
| captured / uncaptured | 10 / 0 |
| voice / voice-transcript / voice-failed | 1 / 4 / 2 (both failures concern the first recording, b1a79408) |
| lesson-published | 7 (5 name lessons not on main at 04:48Z) |
| canary / parallel-compared / lesson-approved / lesson-declined | 0 / 0 / 0 / 0 |
| a time of capture | **not recorded anywhere**: 12 columns, no `captured_at`; the tags carry no time |

**From a row to its lesson.** A capture time does not exist, so the proxy is the PR opening, or the deploy that made the lesson live:

| row | kind | created | to | elapsed |
| --- | --- | --- | --- | --- |
| 2e5c8f2e | voice transcript (L197) | 09-25 15:16Z | live, deploy 36522713427 ended 09-29 04:43:11Z | 85 h 26 min |
| a0309835 | typed (pm12) | 09-25 15:10Z | PR #1833 opened 09-29 04:37Z | 85 h 26 min |
| 4a1a43b3 | voice transcript (World Issues APA) | 09-27 02:15Z | PR #1834 opened | 50 h 22 min |
| 83dc69fc / f217103d / 8248376d | typed, second copies | 09-28 14:10 to 14:47Z | PR opened / live | 13 h 56 min to 14 h 28 min |
| 7eabab32 | voice transcript (higher-ed aid) | 09-29 00:01Z | PR #1835 opened | 4 h 39 min |

**Voice to transcript.** Derivable only for b1a79408: 1 h 08 min to the failure row, then 5 h 28 min to the transcript (rung `nas-cpu`). The other three recordings' raw rows stay on the NAS by design (DR-0614 decision 2), so their start times cannot be read from here.

**The lane.** All from the GitHub Actions API.

- **Push CI, after the shards** (DR-0645, from 2026-09-25 00:34Z): n=33 successful runs on lesson branches; median 8.02 min, minimum 4.2, maximum 20.3. Queue time cannot be measured from the run object, because `run_started_at` equals `created_at` on every run.
- **Push to live, today:**

  | lesson | CI | merge | deploy | push to live |
  | --- | --- | --- | --- | --- |
  | sov29 | 5:03 (run 36518683659) | 03:52:43Z | 1:46 (run 36519108587) | 7:35 |
  | L196 | 5:08 | — | 1:58 | 8:32 |
  | L197 | 4:48 | — | 2:06 | 7:14 |
  | DR-0667 | from its final push | — | — | 8:03 |

  Merge to deploy start: 17 to 23 s.
- **Open to merge, 11 lesson PRs:** median 32.8 min, range 4.6 to 290.4 min. The three slow ones (L193, L194, L195: 218 to 290 min) were parallel builds colliding (LP-04).
- **Red runs on 15 lesson branches:** 49 were red or waiting for approval. 32 of those had **zero jobs** (LP-05). The 17 real failures were count and numbering collisions and early suite failures. Example: `living-lessons-id-collision.test.js:96`, "unrecorded gap(s) … 79, 193, 194", job 107933621304.
- **Build time:** sov29 took 49 min 21 s from agent start to push. That figure comes from the brief; it is not re-measured here, because a session's start time is not in the repo or the Actions API.
- **Main was idle** from 2026-09-25 04:22:29Z to 2026-09-29 03:52:43Z: 95 h 30 min with no merges while lesson rows waited.

**The Routines** (`get_trigger`, 2026-09-29 ~04:45Z):

| lane | trigger | cron | fires into | last run |
| --- | --- | --- | --- | --- |
| voice / in-app | `trig_01KnByrzx8yYCURwfRKUrvTq` | `4 * * * *` | session_01BZ8phCUT3wxZNWfT4GCrB6 | 00:18:30.720Z, finished .730Z |
| email | `trig_01DAcB2dKRE5vuKAtT2NWbLw` | `CRON_TZ=America/Chicago 0 11,13,15 * * *` | the same session | 00:48:27.344Z, finished .351Z |

A 10-millisecond "run" is the wake being delivered, not a lesson being built.

## Findings

Ranked. The same rows appear in the app (Projects → ⚖ Decisions → Review findings), read from `docs/governance/decision-queue.md`.

| id | finding | evidence | severity | owner | close-by |
| --- | --- | --- | --- | --- | --- |
| LP-01 | Both Routines wake one chat session; "SUCCEEDED" is delivery only; nothing alerts when rows wait. | get_trigger (above); row 2e5c8f2e waited 85 h 26 min; main idle 95 h 30 min | high | coordinator + DR-0669 lane (instant trigger) | carried by DR-0669; re-review: 2026-10-01 |
| LP-02 | Capture state is jsonb tags on the mirror only, with no time; the lock never returns to the app's row. | no `captured_at` (information_schema); `infra/nas-lesson-voice/lesson_voice_transcribe.py:518` carries only published tags back | high | DR-0669 lane (lesson_decisions) | carried by DR-0669; re-review: 2026-10-01 |
| LP-03 | `lesson-published` is written before the lesson is live (5 of 7). | rows a0309835, f217103d, 4a1a43b3, 83dc69fc, 7eabab32; PRs #1833 to #1835 not merged | high | coordinator (prompt) + DR-0668 lane (Your lessons) | fix now: tag published only after the deploy SHA matches main; carried by DR-0668 |
| LP-04 | Parallel lesson PRs serialize on shared literal count pins; DR-0667's up-front numbering has no mechanism. | `learn-crosslist.test.js:319` (19 edits since 09-20); keep-prs-current 36522715781 refused #1833 and #1834; L195's 12 red runs; L193 to L195 took 218 to 290 min | high | lane infrastructure | re-review: 2026-10-01, after #1833 to #1835 land |
| LP-05 | 32 of 49 red or approval-waiting runs had zero jobs: phantom red on every lesson PR. | CI 36518708890 and Auto-merge 36518708884 (0 jobs) beside green push CI 36518683659 | medium | lane infrastructure | re-review: 2026-10-01 (DR-0107 proof obligation) |
| LP-06 | Scheduled witnesses do not keep their schedules: site-health `*/10` fired 8 times in 32 h; the mail watcher's `*/5` ran 2.9 to 7.0 h apart. | site-health runs 09-27 17:14Z to 09-29 01:13Z | medium | lane infrastructure | re-review: 2026-10-07 |
| LP-07 | The email lane searches `newer_than:7d`, so an unlabeled Lesson email older than a week is never seen again. | email Routine prompt; DR-0312:30 | medium | coordinator | fix now: remove the window; the label is the ledger |
| LP-08 | Rules that live only in a prompt: skip rows a running build owns; Darrell's two account ids; placement; the member-row rules; test rows. | the voice Routine's prompt; the app keeps identity in the database (0237 `lesson_governor_emails`) | medium | DR-0669 lane (identical prompts in the repo) | carried by DR-0669; re-review: 2026-10-01 |
| LP-09 | DR-0608's canary and comparison have never run. | canary 0, parallel-compared 0 | medium | coordinator | re-review: 2026-10-07; OPEN-11 |
| LP-10 | The L194 recount to 58 is not in PR #1831. | L194 still pins 54 (`living-lessons-l194-verses.test.js:131-133`); DR-0661 §5 | medium | Living Lessons lane | re-review: 2026-10-13 (DR-0661's date) |
| LP-11 | PR #1814, a spoken teaching, has conflicted with main since 09-25 and claims week 29, which sov29 now holds. | `mergeable_state` dirty; keep-prs-current "idle > 72h"; DR-0662 Impact | medium | Sovereign A.I. lane | re-review: 2026-09-30 |
| LP-12 | Voice latency has been measured once (1 h 08 min to the failure, 5 h 28 min to the transcript on the CPU rung); the tower rung is dark. | b1a79408; DR-0611 limit 1 | medium | tower lane (DR-0671) | re-review: 2026-10-01 |
| LP-13 | The DR-0668 to DR-0671 branches were not on origin, so they could not be reviewed. | `git ls-remote` returned no heads at 04:3xZ | low | those lanes | re-review: 2026-09-30 |
| LP-14 | This review's database numbers are the mirror's; the NAS database is unreachable from here. | DR-0614:19, :42 | low | coordinator | re-review: 2026-10-07 |
| LP-15 | The Governor queue showed OPEN-5 (credentials) as Tier A. | parser read "(Tier A)" from the LANE COORDINATION notes | medium | this review | fixed in this PR |
| LP-16 | "Comprehensive" had three counts: the standard 10, the guard 9, CLAUDE.md 8. | the standard; `ari-integrity-guard.js` REVIEW_DIMENSIONS; `CLAUDE.md:451` | low | this review | fixed in this PR |

## Missing information

1. **The time a lesson was captured.** It exists nowhere: not as a column, not in a tag, not in the Routine's history, which keeps only `last_run` (LP-02).
2. **The Routine's run history.** `get_trigger` returns the last run only, and that run is a wake receipt. What each firing found and built is not recorded outside chat.
3. **The NAS database's rows.** The raw voice rows, the `mirrored` tags, and the live state of Your lessons all live on the NAS database the sandbox cannot reach (DR-0614). The runner-side witness `voice-intake-health.yml` runs only on push or dispatch; its last run was 2026-09-28 08:26Z.
4. **The four in-flight branches** (DR-0668 to DR-0671) were not pushed at review time.
5. **Why the voice lane built nothing from 09-25 to 09-29.** The Routine was enabled and firing (DR-0610). The session it woke left no record of why it did not build. This review states the gap and does not guess the cause.
6. **Why `pull_request` runs conclude with zero jobs.** No logs exist for a run with no jobs; diagnosing it needs a lane change carrying DR-0107's proof.

## Assumptions (stated so a wrong one is caught)

1. The hosted mirror holds every lesson row the app wrote. This holds if DR-0614's mirror is running. Its evidence is the transcript row at 09-29 00:01Z.
2. All 10 rows are Darrell's (c2a6c39a, confirmed his in DR-0667 §4), so no member row has yet exercised DR-0635 or DR-0639 live.
3. The sov29 figure of 49 min 21 s (from the brief) is taken as given. It is the only build-duration figure, and it is not re-derived.
4. Severity ranks harm to the outcome Darrell named: lessons from his words, live, trustworthy. It is not a formal risk score.

## Risks

| risk | where it bites | control today | gap |
| --- | --- | --- | --- |
| One session is the pipeline's single point of failure | a busy, compacted or ended session stalls both lanes silently | none that alerts | LP-01, LP-08 |
| A "Published" link to a lesson not yet live | a member opens a missing lesson | none | LP-03 |
| The runaway class (DR-0667 removed the count cap) | 1000 rows means 1000 parallel agents in one session | the lock tag, the kill (disable the Routine), CI gates; **no wall-clock ceiling per firing** | a decided owner direction (DR-0667), recorded, not re-asked; the DR-0669 instant trigger should carry a per-firing time ceiling as a build requirement (DR-0225) |
| Parallel builds colliding | rebuild churn; hours of delay | the gates catch it after the fact (`ledger-uniqueness.test.js:59`, `living-lessons-id-collision.test.js:96`, `business-systems-guard`) | nothing allocates numbers up front (LP-04) |
| Phantom red | real red gets ignored (P46) | none | LP-05 |
| Stale witnesses | an outage goes unseen for hours | the Routines (hourly) and the deploys prove motion | LP-06 |
| Email silently aged out | a lesson is lost | the label ledger | the 7-day window (LP-07) |
| A member's identity in a lesson | exposure | the notice (DR-0630); the Governor-only decision functions (0237/0238); RLS on own rows; the smoke tests in the RLS matrix | the reader's obedience to the name rule is prompt-only (LP-08) |

## Dependencies

- **Voice lesson → words:** the NAS services-sync clock (every 15 min, DR-0611 decision 2) → a Whisper rung (the tower is dark per DR-0611 limit 1; the NAS CPU rung carries it) → the mirror to hosted (DR-0614).
- **Row → lesson:** the voice Routine (hourly at :04) → the one persistent session → a background agent per row → the lane.
- **Lane:** push CI (~8 min median) → auto-merge → deploy (~2 min) → site-health (throttled, LP-06).
- **Published → the member sees it:** the reader's tag on hosted → `return_published_once` on the NAS (`lesson_voice_transcribe.py:531`) → Your lessons. Messages go out only on the Governor's next queue visit (DR-0639 limit 1).
- **Parallel lessons → main:** each merge conflicts the rest on the count pins → a session must merge main and re-reconcile (keep-prs-current refuses non-ledger conflicts by design, DR-0644).

## Decisions requiring human approval (DR-0111 carve-outs only)

Each is in the app as an OPEN item, with a recommendation and a default.

1. **OPEN-11: end the parallel run or keep it** (DR-0610 §4 reserves this to his word). *Recommendation:* not yet; run the canary three times first. *Default:* the run continues.
2. **OPEN-12: a monthly spend cap before any paid lesson writer runs** (a new bright line: real money, and keys only he holds; DR-0248 §4). *Recommendation:* the CLI and Ollama writers only; paid modes off until he names a cap, enforced in code and proven to catch. *Default:* paid off.
3. **OPEN-13: the Gmail watcher secret** (a value only he holds). *Recommendation:* retire the watcher; his three daily clocks are the cadence, and the `*/5` schedule is not honored (LP-06). *Default:* dormant; nothing changes.

**A premise conflict, stated per DR-0111 §3 and not asked:** the brief said PR #1831 carried "the L194 recount to 58". It did not (LP-10). Nothing irreversible rests on it. The recount stays on DR-0661's dated re-review unless Darrell directs it sooner.

## Opportunities

1. **One ledger for capture.** A `lesson_decisions` row per capture, carrying its time, row, lesson id, PR, deploy SHA and published time, closes LP-01, 02, 03 and 09 together, and gives the OpsBoard a "Ways" strip (DR-0608 limit 2). It belongs to the DR-0669 lane, which names `lesson_decisions` in its scope.
2. **An alert on age, not on runs.** "Oldest uncaptured lesson row older than 2 hours" is a one-line query and the true signal. The instant trigger (DR-0667's next step) plus this alert removes the dependence on one session.
3. **Counts that merge themselves.** Replace the literal totals (`learn-crosslist.test.js:319` and the six baselines) with a derived count, or a per-lesson manifest under a union merge driver, so parallel lessons stop conflicting (LP-04).
4. **The prompts in the repo** (DR-0669's "identical prompts"), with a test pinning the rules the database cannot enforce (LP-08).
5. **Reuse:** the DR-0612 readouts already surface escalations. An old uncaptured lesson row is an escalation, and could appear there with no new surface.

## Constraints

1. A Routine can fire at most hourly (DR-0667, measured refusal).
2. GitHub throttles scheduled workflows by hours, not minutes (LP-06; DR-0125).
3. The sandbox cannot reach the NAS database, the tower, or poetech.us (DR-0614, DR-0125). The runner and the NAS are the eyes.
4. `agent_inbox` is append-only from the app (0127): a decision is a Governor-only function, never a client write (DR-0635).
5. keep-prs-current resolves only the ledger files and refuses every other conflict (DR-0644), and it cannot push without `LANE_PUSH_TOKEN`.
6. ESV is not in the repo, so every quotation is KJV (DR-0661 limit 3).

## DRs reviewed in full

Every file below was read from start to end in this session:

- `docs/decisions/DR-0312-the-inbox-is-a-lesson-door-and-the-way-reviews-itself.md`
- `docs/decisions/DR-0608-the-lesson-door-inside-the-app-built-and-pinned-its-reader-staged-and-the-transition-written-before-it-is-taken.md`
- `docs/decisions/DR-0609-how-the-organization-learns-prioritizes-and-decides-pm11-from-information-to-decision-ready-intelligence-with-our-ways-inspected.md`
- `docs/decisions/DR-0610-both-lesson-doors-run-in-parallel-until-the-governor-is-confident-the-in-app-reader-is-armed-for-the-parallel-run.md`
- `docs/decisions/DR-0611-a-spoken-lesson-is-transcribed-by-whisper-on-our-own-machines-on-a-ladder-of-places-and-reaches-the-lesson-intake-as-words.md`
- `docs/decisions/DR-0614-the-nas-jobs-follow-the-database-the-app-reads-and-lesson-rows-are-mirrored-to-where-the-reader-can-see-them.md` (cited; governs the mirror)
- `docs/decisions/DR-0630-the-lesson-chip-answers-with-the-lessons-already-written-from-the-word-for-your-situation.md` (cited; governs the notice)
- `docs/decisions/DR-0635-a-members-own-situation-becomes-a-lesson-only-through-the-governors-review-queue.md`
- `docs/decisions/DR-0639-a-member-may-choose-to-be-named-and-hears-the-outcome-in-messages.md`
- `docs/decisions/DR-0661-i-am-what-the-rest-of-the-word-tells-about-him-every-occasion-the-rule-left-out-l196.md`
- `docs/decisions/DR-0662-the-agent-that-went-past-the-bound-agents-chase-the-goal-not-your-rules.md`
- `docs/decisions/DR-0667-lesson-intake-has-no-count-cap-each-lane-picks-up-on-its-own-clock-and-builds-every-lesson-waiting.md`
- `docs/decisions/DR-0247-started-by-default-the-hand-is-a-brake-never-a-starter.md`
- `docs/decisions/DR-0248-kill-switch-removed-from-the-deterministic-class.md`
- `docs/decisions/DR-0236-nothing-waits-build-it-all-today.md`
- `docs/decisions/DR-0225-brakes-are-build-requirements-never-a-stall.md`
- `docs/decisions/DR-0111-do-the-work-dont-re-ask-what-is-already-decided.md`
- `docs/decisions/DR-0076-verification-doctrine-trust-nothing-unverified.md`
- `docs/decisions/DR-0060-tenancy-guard-data-isolation-gate.md`
- `docs/decisions/DR-0103-streamlined-delivery-loop-agent-prs-auto-merge-on-green.md`
- `docs/decisions/DR-0107-a-down-site-is-the-worst-outcome-prove-the-deploy.md`
- `docs/decisions/DR-0125-outside-in-site-health-probe-and-uptime-record.md`
- `docs/decisions/DR-0219-spec-conformance-review-should-then-prove.md` (cited; the SHOULD/ARE spine)
- `docs/decisions/DR-0255-every-lane-watched-event-driven-no-reflexive-timers.md` (cited; the lane-watch rule)
- `docs/99-session-notes/2026-09-24-decision-intelligence-layer-review.md`
- `docs/00-foundations/_root/COMPREHENSIVE-REVIEW-STANDARD.md`
- `CLAUDE.md` (Layer 0)

Read in part:

- `docs/decisions/DR-0663-*.md` (header and "One teaching, one lesson").
- `docs/00-foundations/_root/RELEASE-TIERS.md`, the three-tier definitions. Tier C covers any autonomous, timer-driven automation, so both Routines are Tier C carried with their proof (DR-0225, DR-0247).
- `docs/00-foundations/_root/LESSONS-LEARNED.md`, the principles index. P10/P11/P12 are the brakes; P25/P26 prove the deploy; P31 says deploy-green is not site-up; P39 says the lane is watched by events; **P41 "a rule that lives only in prose is a suggestion" is LP-08**; P45 "a ledger is a receipt" is the `SUCCEEDED` wake of LP-01; P46 is a gate that cries wolf (LP-05).

**Not DRs:** DR-0668 to DR-0671 do not exist on main or on origin (LP-13). DR-0655 and DR-0657 are held by open PRs #1817 and #1821 (the INDEX "Next ID" notes).

## Never guessed

- Every elapsed time above is the difference between two recorded timestamps.
- Where no timestamp exists (capture, a Routine's work, voice rows on the NAS), this review says so and does not interpolate.
- The one outside figure (sov29's 49 min 21 s) is marked as from the brief.
- The cause of the 09-25 to 09-29 stall is **not stated**, because nothing recorded it (Missing information 5).

## Always data driven

The data behind every finding is in "Measurements" above. The queries were read-only selects. The run data came from the Actions API and two job logs (107933621304, 109258911387) read through the GitHub MCP.

## Timeline: each in-flight component, its state now and its path to live

No date is given that the record cannot ground. Durations come from the measured lane: CI median 8.0 min, deploy about 2 min, merge to deploy about 20 s.

| component | measured state (04:48Z) | path to live, each step's dependency |
| --- | --- | --- |
| L196 (PR #1831) | merged 04:30:23Z; deployed by run 36521953627 (ended 04:32:43Z) | live. site-health confirmation waits on a throttled schedule (LP-06). |
| L197 (#1832, queued lesson a) | merged 04:40:48Z; deployed by 36522713427 (04:43:11Z) | live |
| pm12 (#1833, b) | push CI green 04:41:48Z; a new push's CI running at 04:43Z; mergeable state still computing | the next green CI, then auto-merge, then about 2 min to deploy. It then conflicts #1834 and #1835 again on the count pins (LP-04). |
| World Issues APA (#1834, c) and higher-ed (#1835, d) | `dirty` at 04:41Z (`learn-crosslist.test.js`) | a session merges main and re-reconciles the counts, then about 8 min CI, auto-merge, about 2 min deploy. Each is serial behind the one before it. |
| L194 recount to 58 | not built (LP-10) | DR-0661 re-review 2026-10-13, or sooner on Darrell's word. After that, one lane run (about 8 to 10 min). |
| #1814 (the song lesson) | dirty since 09-25 | renumber to sov30, rebase and re-reconcile, then one lane run |
| DR-0668 your-lessons-live | not on origin | push, then CI, merge, deploy (about 10 min from push); depends on the author session finishing |
| DR-0669 nas-lesson-builder | not on origin | push, then the lane; then the NAS installs it on its next services-sync (every 15 min, DR-0611); paid writer modes wait on OPEN-12 |
| DR-0670 openclaw-on-the-towers, DR-0671 tower-parity-loop | not on origin | push, then the lane; the tower rung is dark (DR-0611 limit 1), so its first live proof depends on the tower being up |
| this review's PR | this branch | one lane run |

## Intuitive design: what, where, when, how and why, from the user's side

**Darrell sending a lesson.**
- **What:** his teaching becomes a lesson from the Word.
- **Where:**
  - Church → Speak, or Notes → Thinking Space. Type or speak, and start with "Lesson" or tap the 📖 Lesson chip (`one-voice-routing.js`).
  - Record under the chip (`VoiceLessonRecorder`, mounted at `OneVoiceInput.jsx:426`).
  - "From the Word for this" shows up to three lessons already written (`OneVoiceInput.jsx:436`).
  - "Your lessons" lists what he sent (`OneVoiceInput.jsx:435`; `ThinkingSpace.jsx:144`).
- **When:**
  - The words arrive on the next NAS pass (about 15 min, longer on the CPU rung: 5 h 28 min measured once).
  - A lesson starts at the next :04 hour.
  - It goes live about 8 to 10 min after its PR opens.
- **How:** Your lessons shows Received, Written down by Whisper, Could not be written down, and Published (`lesson-inbox.js:29`).
- **Why it falls short today:**
  - There is **no "being built" state and no wait time.** The row cannot say "captured, building, PR #N", because that state never comes back to it (LP-02).
  - "Published" can arrive before the lesson is live (LP-03). The DR-0668 lane owns this surface.

**A member.** They see the same box and the notice before sending (DR-0630). "Your lessons" then shows "Waiting for review", approved or declined with the reason, and later Published. A Message goes out on the Governor's next queue visit (DR-0639).

**Darrell as Governor.** Projects → ⚖ Decisions shows:
1. the member lesson queue (`Projects.jsx:388`),
2. then the decision queue (`Projects.jsx:389`), now followed by **Review findings**: this review's 16 rows, each with its evidence, its owner and its close.

Why there: it is where he already decides (DR-0635). Findings stay visually and textually apart from decisions, so the count "these are the N that do" stays true.

**Reading.** Learn → the course → the lesson, which is where the finished lesson lives.

## What is enforced, and is each component synchronized through the database

| component | enforced by machinery | by prompt or instruction only | source of truth |
| --- | --- | --- | --- |
| Lesson chip and relay | door pins (`lesson-door-and-pm11.test.js`); RLS: own rows only (0237) | — | `agent_inbox` row (NAS DB) |
| Recording → bucket | owner-folder storage policies (0229); `lesson-voice.test.jsx` | — | `lesson-audio` bucket, then the row |
| Whisper rider | 38 Python proofs; single-flight lockfile; 3 rows and 400 s per pass (DR-0611, DR-0614, DR-0639) | — | rows and tags; the rung in the tag |
| Mirror to hosted | `test_lesson_voice.py` mirror proofs; at most 20 per run | — | `mirrored` tag (NAS), same id on hosted |
| Member review | Governor-only SECURITY DEFINER functions (0237, 0238); smoke tests in the RLS matrix; 13 + 19 app tests | — | `lesson-approved` / `lesson-declined` tags, `review_reason` |
| **Reader capture** | the lesson's quality: verse pins, full suite, CI | which rows to take; skip rows a build owns; one teaching, one lesson; placement; the name rules; the capture tag written after the push; numbers "up front" | the `lesson-captured` tag **on the hosted copy only**; **session memory** for rows in flight |
| Email lane | — | the search, the parallelism, the label written after the push | the Gmail label `Label_22` |
| Lesson and DR numbers | caught after the fact: `ledger-uniqueness.test.js:59`, `living-lessons-id-collision.test.js:96`, `business-systems-guard.mjs:54` | "assign up front" (prompt) | the files on main; prose "held" notes in INDEX |
| Lane | required checks, auto-merge, the deploy dispatch, keep-prs-current (ledger files only) | — | GitHub |
| Governor queue and findings | `governance-queue-parse.test.jsx` (new) | — | `docs/governance/decision-queue.md` |

**Where state lives only in a prompt or a session, and can drift:**

1. **Rows a running build owns:** session memory only.
2. **Darrell's two account ids:** hard-coded in the voice Routine's prompt. The app's identity lives in `lesson_governor_emails()`. The two can disagree.
3. **Placement, the one-teaching search, the test-row judgment, and the member name rules:** prompt text. The member rule is also `READER_PROTOCOL_FOR_MEMBER_ROWS` in `member-lesson-review.js`, but nothing checks that the live prompt still matches it.
4. **Lesson and DR number allocation:** prompt text. It has collided before (DR-0642/0652, 0655/0656, 0657/0659, and the 0337 double mint recorded in REV-0252). Today it produced #1834 and #1835 `dirty`.
5. **What each firing did:** chat only; the trigger keeps `last_run` alone.
6. **The capture lock:** hosted only; never returned to the row the app shows.

**Conclusion.** The components before the reader are synchronized through the database with machinery. The reader and the email lane are synchronized through tags they write, but their *rules* and their *in-flight state* live in prompts and one session. That is the Exodus 18:18 shape PM11 teaches. The DR-0669 lane (instant trigger, `lesson_decisions`, identical prompts in the repo) is where it closes, and LP-01, 02 and 08 are carried there with dates.

## What this PR fixed

1. **The Governor's queue told a false tier.** `app/src/lib/governance-queue-parse.js` (new) is now the one parser for the vite build and the tests. Each section ends at the next `## ` heading. OPEN-5 no longer reads Tier A (LP-15).
2. **Findings in the app.** A `## REVIEW FINDINGS` section in the queue file renders under the queue as "Governance · Review findings", apart from the decisions (`GovernanceQueue.jsx`, `normalizeReviewFindings`).
3. **The review standard, the guard and Layer 0 agree on ten.** The ari-guard gains dimension 9 (the hollow surface, DR-0381); CLAUDE.md says ten; `ari-guard-dimensions.test.js` holds all three together (LP-16).
4. **Proven to catch,** each break injected and restored:
   - the section running on to DECIDED (2 tests fail);
   - findings leaking into the queue (3);
   - findings not rendered (1);
   - the guard losing dimension 9 (2);
   - CLAUDE.md back to "eight" (1).
5. **No new DR.** No Way changed: the gates extend existing Ways (DR-0239, DR-0061/0065), and the queue file stays the one source. So no number was taken while DR-0661 to DR-0671 are held.

**Not fixed here, with the why:**
- LP-04 would touch the count files of four lessons in flight.
- LP-05 is a lane change that carries DR-0107's proof obligation.
- LP-01, 02, 03 and 08 sit in files the unpushed DR-0668 and DR-0669 lanes own.
- LP-03's and LP-07's prompt fixes are Routine edits for the coordinator session. They are not repo changes.
