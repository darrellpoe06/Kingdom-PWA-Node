# DR-0697 — The failures of 2026-09-30 are recorded, and the Ways hand them over before the next build

- **Status:** accepted
- **Tier:** A (documentation, gates and a tag on new rows; the workflow edits change how five watchers ask a question, not what they decide)
- **Type:** ways + gates
- **Date:** 2026-09-30
- **Scope:** `docs/00-foundations/_root/LESSONS-LEARNED.md` (P60 to P69 and the 2026-09-30 entry); `HOLD-THE-HAND-OF-THE-PROCESS.md`; `ORCHESTRATION-AND-VERIFICATION-OPERATING-MODEL.md` §7; `docs/templates/builder-brief.md` (new); `app/src/lib/required-reading.js` + `scripts/required-reading-pretool-hook.mjs` (don't-repeat pointers, edits of high-risk files); `scripts/course-band-coverage.mjs` (`fourBandGapFindings`); `scripts/workflow-list-order-guard.mjs` (new, in `verify:gates`); `.github/workflows/{auto-merge,deploy-freshness,feedback-fixed,migrate-freshness,site-health,push-sender-credentials,inbox-lesson-body}.yml`; `app/src/lib/agent-inbox-sync.js` (`build:<sha>` tag); tests `course-band-coverage`, `required-reading`, `workflow-list-order-guard`, `big-picture-no-blank-subtab`, `builder-brief-template`, `inbox-row-carries-build`.
- **Principles:** HOLD-THE-HAND (DR-0621), VERIFICATION-DOCTRINE (DR-0076), WAYS-REVIEW (DR-0108), COMPREHENSIVE-REVIEW (DR-0239), NOTHING-WAITS (DR-0236), DECISION-RECORDS
- **Grounds:** Darrell, 2026-09-30, verbatim: *"Review the DRs... make sure our previous failures are accounted and you understand what not to do... add to our Ways and documentation too"* and *"Add reviewing the DRs... so we don't repeat obvious failures... unless we have another way..."*; earlier the same day: *"why not when that has been requested and required?!"*, *"Do we need to wait for some reason?"*, *"it is confusing."*

## Context

On 2026-09-30 the work failed in thirteen distinct ways (twelve named in the morning's review, one more by evening). Most of them broke a Way that was already written. The Ways were in documents read at the start of a session and were not in front of the agent at the moment the mistake was made. Darrell asked for the DRs to be reviewed so the failures are accounted for, and for the review to reach the Ways, "unless we have another way". There is another way: the required-reading hook (DR-0080 class) already hands governing documents to the agent at the moment it writes a file. This DR extends that hook instead of adding a second mechanism.

## What was measured

- **Age bands:** the coverage baseline recorded 398 lessons, 22 with all four bands (376 without). The live scan read 400 lessons: sovereign-ai carried two lessons more without all four than its baseline recorded. The ratchet (`ratchetCourseBands`) compares only adult-only and four-band counts, so a lesson with two bands was invisible to it.
- **List order:** #1868 and #1870 show `?status=success&per_page=1` and `?branch=main&per_page=30` both answering ef3a87f1 (2026-09-06) after a651130e deployed. The new guard, run against `main` before this change, found the same read in 8 more places across 6 workflows, plus the incident's own line from before #1868.
- **Concurrency:** `inbox-lesson-tag` runs 36667407720, 36667409528 and 36667412431 were dispatched two seconds apart; 36667409528 ended `cancelled`.
- **Masking:** #1871 and #1872: masked runs inside base64, the second a 3-character run.
- **Capacity:** #1874 / DR-0691. With Capacity's panel reverted to render nothing without hours, `big-picture-no-blank-subtab` fails naming "Capacity".
- **Session measurements (not repo artifacts):** 12 GB of 15 GB free when builders were held "for memory"; 44 leftover `/tmp` build folders (~6 GB). The steward routine's first firing, session cse_01TPoZsh6U2sPKqQxNnhpB3U, 20:47:45 to 20:48:26 UTC, had no repository and no GitHub tools and did nothing.
- **Updates:** the app already applies a new build by itself (`sw-update.js`), and no `agent_inbox` row recorded which build wrote it.

## Impact

Lapses against written Ways: the backlog half of the bands (P29), the blank Capacity tab (COMPREHENSIVE-REVIEW dimensions 3 and 9, DR-0381, P15), asking Darrell to sign in before checking (Drive-Don't-Delegate, P18), throttling without measuring (DR-0076 §4, P58), citing DR-0686 and DR-0687 before they existed (P41; the stop hook caught it), and calling a routine running before its first run (P53). Real gaps: new work was allowed below the band standard, list position was trusted in 9 workflow reads, logs could alter data, burst dispatches dropped a run, cleanup missed `/tmp`, session-bound work had no durable driver, spawned sessions had no brief template, a control sat far from its scope, and rows carried no build.

## Decision

1. **Record it.** LESSONS-LEARNED gains P60 to P69 and a dated 2026-09-30 entry naming each failure, its evidence, what a human would have known, and whether it was a lapse or a gap.
2. **The Ways carry it.** HOLD-THE-HAND gains "holding the hand includes the backlog and the driver". The orchestration model gains §7: *Before you build: review the DRs*, and a Don't list read before orchestrating. Every builder brief and routine prompt names the DRs and LESSONS principles to read first, starting from `docs/templates/builder-brief.md`.
3. **The other way, extended.** The required-reading hook now also hands **don't-repeat pointers** (one line each, with the P number) for workflows, components, lesson catalogs and orchestration docs. For workflows, lesson catalogs and orchestration docs it also fires on an **edit** of an existing file, because that is where the day's failures landed. Each area blocks once per session, then stays quiet; the hook still fails open on any error.
4. **Gates where the class is machine-checkable:** `fourBandGapFindings` (a new course, or a new lesson in an existing course, without all four bands fails the build; the frozen ceilings only go down, and a course that closes its gap in the baseline is held there); `workflow-list-order-guard` (in `verify:gates`), and the 9 live reads rewritten to ask by `head_sha` or take the highest run id; the md5 round-trip in `inbox-lesson-body.yml`; `big-picture-no-blank-subtab`; `builder-brief-template`; `build:<sha>` on every relayed inbox row.
5. **Named without a gate, with a date:** burst dispatch into one concurrency group (P64), cleanup of every artifact (P65) and the first-run observation of a durable driver (P66) are discipline carried by the pointers and the brief template; no repo gate can see them. The one residual hole in the band gate (a course at 0 in the baseline can be re-opened by a builder who regenerates the baseline, up to its frozen line) is carried by lowering the frozen line when a course completes. *re-review: 2026-10-14*, carried by the band backfill's own PRs and the next duplicated dictation row (its `build:` tag answers item 12).

## Verification

- `node scripts/workflow-list-order-guard.mjs --selftest`: 3 breaks caught, 4 lawful forms pass; run on `main`'s workflows before this change it reports 9 findings (plus the pre-#1868 line), after it reports none.
- `course-band-coverage.test.js`: a two-band lesson added to banking passes the old ratchet and fails `fourBandGapFindings`; a new two-band course fails; a four-band one passes.
- `big-picture-no-blank-subtab.test.jsx`: green on the real dashboard; with Capacity's panel returning null it fails naming "Capacity"; a probe tab rendering null is reported.
- `required-reading.test.js`: workflow and component paths get their pointers; with the workflow mapping removed the workflow gets nothing; every cited P and DR exists; the hook blocks once and is quiet the second time, never blocks an edit of a component, and fails open on garbage.
- `builder-brief-template.test.js`, `inbox-row-carries-build.test.js`: each required line removed is reported; the relayed row carries `build:`.
- The workflow changes touch the deploy watcher (`auto-merge.yml`), so this change is done only when its own merge produces a successful Deploy (Cloudflare Pages) run whose `head_sha` is the merge SHA (DR-0107).
