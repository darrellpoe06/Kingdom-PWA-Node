---
id: DR-0625
title: Every intake is carried to an outcome the ecosystem communicates — each note is categorized by rule (low-hanging fruit, already decided, real work, needs one thing), the sender reads the outcome with its reason, record or measured window, and small fixes go through the gated lane by themselves
status: accepted
date: 2026-09-24
tier: C carried with its proof (an AI-class auto-fix path; the deterministic gate suite is the review, DR-0225)
type: build
declared_by: Darrell
scope:
  - app/src/lib/intake-outcome.js (the categorizer, the sender's outcome, the measured window)
  - scripts/lib/intake-ledger.mjs, scripts/intake-census.mjs (the same categorizer over the live rows, on the runner)
  - scripts/sovereign-read-over-tailnet.sh + .github/workflows/sovereign-read.yml (the `intake` census mode)
  - app/src/lib/feedback-sync.js, app/src/lib/feedback-loop.js, app/src/lib/github-ops.js (the sender's own notes read back; one id per note; "fixed" carries what changed; the delivery record)
  - app/src/components/IntakeOutcomeList.jsx, app/src/components/FeedbackCenter.jsx (what the sender sees, the reply; the steward's categorized queue with each basis)
  - app/src/lib/operations-intelligence.js, app/src/components/OperationsIntelligence.jsx, app/src/components/Projects.jsx (the loop into Decision Intelligence)
  - app/src/poe-financial-mvp-v28.jsx (one line in place: the id is minted on the device; the frozen budget holds at 5356)
  - infra/supabase/migrations-auto/0236-every-intake-is-carried-to-an-outcome.sql + infra/supabase/tests/0236-intake-outcome-smoke.sql + the rls-isolation leg
  - app/src/lib/intake-autofix.js, scripts/intake-autofix.mjs, scripts/intake-autofix-over-tailnet.sh, .github/workflows/intake-autofix.yml, scripts/intake-autofix-scope-guard.mjs (+ its CI step), infra/intake-autofix/ARMED-BY-RECORD (the fix lane and its brakes)
principles: [HOLD-THE-HAND (DR-0621), VERIFICATION-DOCTRINE (DR-0076), THREE-BRAKES, STARTED-BY-DEFAULT (DR-0247), BRAKES-ARE-BUILD-REQUIREMENTS (DR-0225), APP-IS-PRIMARY (DR-0065), DECISION-RECORDS (DR-0011)]
grounds:
  - DR-0621 item 3a and its Limits item 3 — "every intake is carried to an outcome the ecosystem communicates", built next, same day
  - DR-0616 — the triage states and the receipt this builds on
source: 2026-09-24 — Darrell, spoken (quoted in Context)
---

## Context

Darrell, 2026-09-24: "when we have failures from feedbacks that come from users or from me directly or from anything, any direction you get it from intake, however it comes, it should go through our workflow system and be categorized in a way where if it's low hanging fruit, then we fix it. The system fixes it automatically ... but if it's something that we already we've already done we've already looked at we've already ascertained and said we're not doing then there's an explanation and then there's a reason why that is there ... i don't need to communicate and i don't want humans to have to communicate that i want the PoeTech whole ecosystem to do the work ... actions speak louder than words."

## What was measured

Traced in the code and read from the live system before building, 2026-09-24:
- **The sender never heard back.** The board's read excluded the sender's own notes (`subscribeFeedback` `fetchOthers`, `.neq('user_id', myUserId)` in lib/feedback-sync.js), and realtime listened to INSERT only. The sender's list read the local copy, which never changes after it is written. So no steward's triage (DR-0616) had ever reached the person who sent the note.
- **Two codes for one note.** The local row's id was `fb-<time>` (the shell's addFeedback) while the database minted its own uuid, so the reference the sender was handed was not the one a steward saw. The sender's "Your feedback" list also filtered on a `mine` flag or a user id that no local row carried, so it was always empty.
- **The live table.** sovereign-read run 36042714313 read 992 rows in the database the app reads, newest minutes old, none confidential. All 200 newest were Learn telemetry (`[Learn engagement] ...`), not notes from people, which is why the census counts telemetry as its own category.
- **The delivery record.** Over the last 99 merged pull requests, the median open-to-merge time was 26 minutes, and 9 in 10 merged within 1.2 hours.
- **The first live census** (sovereign-read `intake`, run 36058113426, on this branch) read all 1,000 non-confidential rows. 940 were Learn telemetry. Of the 60 from people:
  - 0 were low-hanging fruit;
  - 1 was already decided;
  - 42 were real work (22 of them no rule matched, 11 feature requests, 3 bugs, 2 questions, 2 privacy, 1 sign-in, 1 data loss);
  - 8 were asked for one thing (7 a picture or rating with no words, 1 too short);
  - 9 were praise.

  The one "already decided" was WRONG. A note asking to add the church's giving link was matched to DR-0133 (the church's own door) on "com" and the domain name. Three corrections ship with the finding, each proven to catch on that exact case:
  - web addresses are cut out before matching;
  - a note the sender tagged as a bug is serious, so it is never answered "already decided";
  - money and security subjects are never answered automatically.
- **The census after the three corrections** (sovereign-read `intake`, run 36058471162): of the same 60 notes from people,
  - 0 were low-hanging fruit;
  - 0 were already decided (the wrong match is gone);
  - 43 were real work (22 of them no rule matched, 12 feature requests, 3 bugs, 2 questions, 2 privacy, 1 sign-in, 1 data loss);
  - 8 were asked for one thing;
  - 9 were praise.
- **The categorizer on real text.** Evaluated raw, the composed body's own "Not working:" label made every note read as a bug; the complaint words are now judged on their own.

## Decision

1. **Every intake is categorized by rule, with its basis kept.** `app/src/lib/intake-outcome.js` `categorizeIntake` puts each note in one of four categories: low-hanging fruit, already decided, real work, or needs one thing. Two more are said plainly rather than forced into those four: praise, and machine telemetry. The categorizer is deterministic: no model, no clock, and the same answer on the sender's phone, the steward's board and the runner. Each category carries a `basis` naming the rule, the record or the earlier note it stands on. A note no rule recognizes is real work with the basis "No rule matched; a person reads it." It is never guessed.
2. **"Already decided" cites the record and its reason.** Two sources are checked. The first is a steward's earlier decline of the same thing, with the steward's own reason. The second is the decision ledger: only accepted records are used, matched on rare shared words including at least two from the title. The first sentence of the record's Decision is given as the reason. Where records are close, the newer one wins, because the ledger is append-only and a newer record governs the one it amends (the real ledger: DR-0248 over DR-0110). A bug report, data loss, sign-in or privacy note is never answered this way.
3. **Low-hanging fruit is an allowlist, not a feeling.** It covers wording and spelling, a label that says the wrong thing, and text too small or hard to read, each with a scope (copy or style). Some subjects are never auto-fixed, however small the change looks: money and giving, sign-in, accounts, privacy and security, data, schema, the Word's own text, and the names of the Godhead.
4. **The window is measured, never invented.** The first choice is intake-to-outcome time from notes that reached an outcome. If there are too few of those, the lane's own open-to-merge time is used, measured from merged pull requests and named as lane time. With fewer than five samples, no window is given, and the receipt says so.
5. **The live rows are counted by the same module.** `sovereign-read` gains an `intake` mode. On the runner it categorizes every non-confidential row of the database the app reads. It prints counts per category and per basis. The only text it prints is a short masked snippet for each low-hanging and already-decided row, so their precision can be audited. The raw rows never reach the log.

6. **The sender reads their outcome, and it updates.** Measured before this record:
   - The board's read left the sender's own notes out (`neq user_id`).
   - Realtime listened to INSERT only.
   - The sender's local copy never changed after it was written.
   - The local id was `fb-<time>`, while the database minted its own uuid. The code the sender was handed was therefore not the code the steward saw, and could not be looked up.
   So no steward's triage and no fix had ever reached the person who sent the note (the DR-0616 loop was closed only on the steward's side). Now:
   - the id is minted on the device, so there is one code per note;
   - `fetchMyFeedback` reads the sender's own notes, with their outcomes, every time the form opens;
   - realtime hears UPDATEs too;
   - the form shows "Your earlier feedback: where each one stands".
   Each outcome is derived, never written by a person:
   - **fixed**, with what changed and the change's reference;
   - **already decided**, with the reason and the record cited;
   - **on the board**, with the owner role and the measured window (**known issue** when others reported the same thing);
   - **being fixed by the system**, or **fix in review**;
   - **we need one thing from you**, naming the one thing.
7. **A reply re-enters intake.** "Reply to this" carries the note's id into the next note as `reply_to`. A reply is always real work, for a person; the system never gives the same automatic answer twice. An untouched reply is a *decision required* on the Decision Intelligence board.
8. **The steward sees every intake by category, with its basis.** The Feedback queue (Projects → Feedback) has a filter for each category, with counts. Telemetry is kept apart from people's notes. The focused note shows:
   - its category and what that category does;
   - the basis line (the rule, the record and its shared words, or the steward's earlier word);
   - exactly what the sender reads.
   "Fixed" now asks what changed, and writes it with `outcome_at`, so the sender reads the change and the window has its end point.
9. **The loop closes into Decision Intelligence.** The operations readouts gain intake:
   - the counts per category;
   - an escalation for real work untouched past the stall threshold (counted as one);
   - a risk when system fixes keep failing;
   - a decision required for each untouched reply.
10. **Low-hanging fruit is fixed by the system, through the lane, with the full brake set.** The flow:
   - `intake-autofix.yml` categorizes every live note with the same module and backfills `intake_category` and `intake_basis` onto every row.
   - It enqueues the low-hanging ones in `intake_fix_queue` (migration 0236: stewards read it; nobody signed in inserts).
   - It reconciles each claimed fix with its pull request, writing "fixed, with what changed" onto the sender's note when the fix merged.
   - It hands out at most one item.
   - The fixer is a Claude Code Routine. It dispatches `handout` and makes the one small change on the branch it is given (`claude/intake-fix-<queue id>`). It pushes into the ordinary lane: lint, the full suite, every guard, and auto-merge on green.
   - A CI step, `intake-autofix-scope-guard.mjs`, judges that branch class only. A fix may touch components, stylesheets and tests; 30 lines at most; no link, email or phone number; no bright-line subject.
   - This is the AI class, so it keeps the full brake set (CLAUDE.md as amended by DR-0247/0248):
     - **budget**: one item a run, three a day, two tries a note;
     - **lock**: one open fix at a time, and a claim under two hours blocks the next;
     - **kill**: `infra/intake-autofix/PAUSED` on record, and the lane pauses itself after three failures in a row until a committed RESUME-AFTER date.
   - Under DR-0247 it is armed by record: `infra/intake-autofix/ARMED-BY-RECORD` is committed, so merge = started. The brakes are proven in CI (DR-0225).
   - The hourly `reconcile` is the deterministic class: it spawns no AI and no work, and it carries a budget (timeout) and a lock (the concurrency group).
   - A fix that fails or goes stale goes back to a person, and the sender reads "on the board".

## Verification

- `app/src/__tests__/intake-outcome.test.js`: every categorizer rule and every receipt state, proven to catch and proven quiet. It includes the real ledger case (DR-0248 over DR-0110) and the defect it caught: the form's own "Not working:" label made every note read as a bug.
- `app/src/__tests__/intake-autofix.test.js`: each brake proven to catch and the lane proven to go when all are clear:
  - arm by record;
  - kill on record, and the self-pause after three failures (resumed by a later committed date);
  - the lock (an open fix, and a fresh claim);
  - the budget (daily ceiling, attempts per note, scope);
  - reconcile (merged, closed, stale, a claim that opened nothing);
  - the scope guard (a lib, the monolith, a migration, a workflow, a link, an email, a phone number, a bright-line word, over 30 lines, an empty change);
  - the runner's plan (one transaction; a note or title cannot close its literal; a non-uuid row is never written).
- `app/src/__tests__/intake-sync.test.js`: one id per note; the category written at birth; a reply carries reply_to; the sender's own notes read back with outcomes; "fixed" writes what changed and when. The rest still holds on a database without 0236: a different missing column is not mistaken for these.
- `app/src/__tests__/intake-outcome-render.test.jsx`: rendered, not read. It covers the sender's outcomes per state; Reply carrying reply_to into the next note; and the steward's category counts, basis and "the sender reads".
- `app/src/__tests__/intake-loop.test.jsx`: intake in the operations readouts. A reply is a decision required, stale real work is an escalation, and failing fixes are a risk.
- `app/src/__tests__/sovereign-reader-intake-mode.test.js`: the census rows are cut from the log before anything prints (run, not read).
- `infra/supabase/tests/0236-intake-outcome-smoke.sql` in the rls-isolation matrix (leg `intake-outcome`):
  - a sender cannot write an outcome onto their own note;
  - the owner writes it and the sender reads it;
  - the fix queue is read and moved only by the owner/admin, and nobody signed in inserts into it.
- `scripts/intake-autofix-scope-guard.mjs --selftest-break` runs in the required CI job before the guard itself.
- The delivery record measured 2026-09-24: over the last 99 merged pull requests, the median open-to-merge time was 26 minutes and 9 in 10 merged within 1.2 hours. That is the lane window a sender is given until enough notes reach an outcome to measure intake-to-outcome directly.

## Limits, stated

1. **The Routine that makes the fixes needs one grant only Darrell can give.** Routine `trig_011FhkURbUT5VH1VpS6WFHup` ("Intake auto-fix (DR-0625)", every four hours) was created with its full prompt. The platform stored it with no repository source and no connectors, because none can be passed from an agent session. Its sessions could not dispatch the workflow or push the branch, so it is PAUSED rather than firing sessions that must fail. The fix: open it in the claude.ai Routines page, attach the repository `darrellpoe06/Kingdom-PWA-Node` and the GitHub connector (https://claude.ai/customize/connectors), and turn it on. Everything else in the lane works without it: every note is categorized and enqueued, reconciled, and answered. `re-review: 2026-10-01`.
2. **The live census runs once this branch merges and 0236 is applied.** `sovereign-read` mode `intake` is dispatchable on this branch. `intake-autofix.yml` reads the 0236 columns, so it answers after db-migrate applies 0236 on merge; until then it fails with the reason, never a painted zero.
3. **Other doors.** `door_feedback` (the church door's own intake) is counted by the census with the same categorizer. Its office already answers it in place (DR-0216); its outcome on the sender's side stays its own until that door is folded into this loop. `re-review: 2026-10-07`. Site-health incidents already flow to the operations readouts (DR-0616) and are carried by the monitors (DR-0618). The Gmail routine and lesson intake are not feedback and keep their own outcomes.
4. **Where a model would help.** The categorizer calls none: the rules and the ledger match are deterministic. If the census shows real notes that the rules leave as unknown in numbers worth a model, that model runs on the sovereign NAS path (CLAUDE-TOOL-ROUTING) and records its basis as kind `model`. That is a measured decision for later, not a default now.
