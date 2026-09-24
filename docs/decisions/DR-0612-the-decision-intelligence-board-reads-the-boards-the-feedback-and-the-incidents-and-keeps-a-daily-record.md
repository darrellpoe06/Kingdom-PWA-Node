# DR-0612 — Phase 1 of the Decision Intelligence Layer: the board reads the boards, the feedback and the incidents, and keeps a daily record of what it saw

- **Status:** accepted
- **Tier:** B (a migration: one new instance-scoped table with RLS, a no-leak smoke in the isolation matrix)
- **Type:** feature
- **Date:** 2026-09-24
- **Scope:** `app/src/lib/decision-intelligence.js` (three more inputs; machine-written feedback excluded; digit tokens out of signatures); `app/src/lib/decision-readouts.js` (new); `app/src/components/DecisionIntelligence.jsx` (reads six kinds, records the day, shows the trend); `app/src/components/Projects.jsx` (reads the boards, passes the three tables); `app/src/poe-financial-mvp-v28.jsx` (passes incidents in); `infra/supabase/migrations-auto/0230-the-board-keeps-a-daily-record-of-what-it-saw.sql`; `infra/supabase/tests/0230-decision-readouts-smoke.sql`; `.github/workflows/rls-isolation.yml` (the leg); `app/src/__tests__/decision-intelligence-phase-1.test.jsx` (new, 23)
- **Principles:** REPEATABLE-GOVERNANCE (DR-0607), REALITY-TRACE (DR-0061), VERIFICATION-DOCTRINE (DR-0076: measured on the live rows before it shipped), SPEAK-ESTABLISHED-FACT (DR-0100), NOTHING-WAITS (DR-0236), DR-0589 (the board this extends), DR-0132 (no n8n)
- **Grounds:** Darrell, 2026-09-24: *"Build phase 1 of the decision intelligence layer... Why Phase 1 and not the whole thing?"*, *"Testing while intuitively building it?"*, *"Make sure to also review what workflows we have already built and see how they can be used or tweaked to be valued"*, *"No n8n!"*, *"Only known robustness from languages that support quality outcomes... no loose connections... Python... html5... Sql... or whatever is best based on capability and experience"*; the review `docs/99-session-notes/2026-09-24-decision-intelligence-layer-review.md` (on `wip/decision-intake-paused`)

## Context — the question

The board (DR-0589) answered the seven questions from concerns, projects and hand-offs. On the live project those held 20 rows (concerns 0, discussions 0), while the rows PoeTech already holds on its own boards, in its feedback and in its incidents were not read at all, and nothing the board showed was kept, so no one could see a trend or check what a leader had been shown.

## What was measured (live project, 2026-09-24, the derivation run on the real rows)

| | before | after |
| --- | --- | --- |
| rows read | 20 (projects) | 133 (20 projects, 57 board tasks, 52 feedback, 4 incidents) |
| escalations | 12 | 31 (12 projects, 15 board tasks past due, 3 incidents past due, one line: 52 feedback items waiting for triage, oldest 120 days) |
| ownership gaps | 14 | 14 (every board task has an owner) |
| patterns | 0 | 3 (boards carrying 3 or more overdue or blocked tasks) |
| timeline threats | 0 | 1 |
| risks | 0 | 0 (no person has stated the same worry twice) |

**What the measurement caught before it shipped.** The first run reported 7 "risks", the largest "stated 75 times". They were `[Learn engagement] band=… signal=started` rows: 99 of the 151 feedback rows are signals the app writes about itself, not words a person wrote. Their repeat signatures also surfaced a phone number and an account name as pattern words. Both are fixed: machine-written feedback stays out of the readouts (it stays in the table), and a token carrying a digit never becomes a pattern word.

## Impact

Unresolved: a leader reading the board would see a fifth of the organization's rows and no history. Resolved: the board answers from every row PoeTech holds for these questions, each item names the rows it came from, the feedback queue that has not been read for four months is one plain line, and each panel says what it was on the last recorded day.

## Decision

1. The derivation reads board tasks (owner, due date, blocked, depends-on, stuck-per-board), incidents (due, idle, blocked, repeated description) and feedback (repeated worries; untriaged 21+ days as one counted escalation), with the thresholds already printed on the surface.
2. Machine-written feedback is excluded by a named pattern (`MACHINE_FEEDBACK`), extended only by measurement.
3. `decision_readouts` (0230): one row per instance per day, written when a signed-in governor opens the board (upsert on instance + day, as themselves), read back for the trend. Members write, viewers read, non-members see nothing, proven by the smoke in the RLS matrix. A day nobody opened the board has no row, and the surface says which day it compares against.
4. **Languages (his word):** the readouts are JavaScript on the page and SQL with row-level security in Postgres; the NAS jobs of this layer are standard-library Python. No n8n anywhere in this layer.

## The workflows already built, and how they feed the next phase (the survey he asked for)

Reuse, not rebuild. From the survey of the repo's sovereign workflows (n8n excluded), in value-for-effort order:

1. **The incident-issue ledger** the health probes already file (site-health every 10 minutes, harvest-health, ops-queue-health, node-availability, level-witness): an open incident issue older than N hours is an escalation; the comment count on a rolling issue is a repeat count.
2. **review-watcher** (daily): each overdue `re-review:` date in a decision record is a timeline threat with its source already named.
3. **The decision-chain check** (`decision-chain.js`): a record missing its decision or outcome slot is a decision required.
4. **loop-health / harvest-stall** (`stagnantLoops`, `detectStall`): a stale loop or a stalled corpus is an escalation.
5. **Hand-offs** (`discussions`): a hand-off still open N days later is an escalation (today only a missing receiver is caught).

These are platform signals (PoeTech's own operations), so they join the board as a separate "PoeTech operations" section for the governor, not mixed into an organization's own readouts. `re-review: 2026-10-01` — Phase 1b, built from the list above in that order.

## Verification

- `decision-intelligence-phase-1.test.jsx` 23: every new readout proven-to-catch and proven-quiet; machine rows out; digit tokens out; the trend picks the last day before today; record upserts on instance + day as the signed-in user; signed-out writes nothing; a refused read says why; the surface reads six kinds, records once, shows the trend, says when today is the first day; the wiring pinned from the app state to the board; the migration, the smoke and the matrix leg pinned.
- `decision-intelligence.test.js` 13, the consistency and legibility guards, the migration guards: green. eslint 0.
- After merge: db-migrate applies 0230; the RLS matrix runs the smoke on a real Postgres; open Projects → Governance as a governor, read "133" in the read line and the 31 escalations against the live rows; `select day, counts from decision_readouts` shows today's row.

## Limits, stated

1. **The record is written when a governor opens the board**, not on a clock. A NAS rider could write it daily, but the derivation lives in JavaScript and a second copy in Python would be a loose connection; if the gaps in the record prove too wide to read a trend, the rider runs the same module under Node on the NAS. `re-review: 2026-10-24`.
2. **Incidents carry no owner field**, so incidents do not produce ownership gaps yet; the incidents table's `dispatch` is where an assignee would be read from. `re-review: 2026-10-01`, with the ticket desk (Phase 3).
