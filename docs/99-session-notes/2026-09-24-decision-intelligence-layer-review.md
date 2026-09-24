# Decision Intelligence Layer: the comprehensive review, updated after Phase 1 (2026-09-24, afternoon)

**Purpose it serves (DR-0607):** repeatable governance systems that help organizations recognize patterns, surface risks, and make better decisions without depending on one person's institutional knowledge. PoeTech's value is the governance, prioritization, stakeholder alignment and decision-support processes that turn an organization's information into decision-ready intelligence. Leaders are drowning in information, not tasks; the value is seeing the pattern across meetings, emails, tickets, boards, documents and recordings, and asking always how the organization learns, prioritizes and decides.

**Agreed (Darrell, 2026-09-24):** PoeTech builds its own boards, ticket desk and workflows on its own tables, not integrations with TDX or Monday. Open-source engines are borrowed only for single jobs with no data model of their own (Whisper). No n8n anywhere. Languages with proven robustness: SQL (Postgres with row-level security), HTML5 and JavaScript on the page, standard-library Python on the NAS. No loose connections: every link is wired to real rows and proven by a test.

## 1. State of the build (measured on the live project)

| Piece | State | Record |
| --- | --- | --- |
| The seven readouts (risks, dependencies, ownership gaps, escalations, patterns, timeline threats, decisions required) | live on Projects → Governance | DR-0589 |
| The purpose line on About and the OpsBoard | live (deploy verified) | DR-0607 |
| The in-app 📖 Lesson door and the lesson reader (parallel run with this chat and email) | live (deploy verified); reader enabled every 4 hours; 0 rows sent from the app so far | DR-0608, DR-0610 |
| Spoken lessons transcribed by Whisper on a ladder of places | merged; bucket applied on the live project; the tower rung measured dark from the NAS (HTTP 000), so the NAS CPU rung carries lessons | DR-0611 |
| **Phase 1:** the readouts read board tasks, feedback and incidents, and keep a daily record | PR #1768, in CI | DR-0612 |
| Paste-in intake (transcripts, notes, status reports) | built, parked on `wip/decision-intake-paused` for the locks decision | this review |

**What Phase 1 changes, measured on the live rows before shipping:** rows read go from 20 to 133; escalations from 12 to 31; patterns from 0 to 3; timeline threats from 0 to 1. The biggest single finding is 52 human feedback items never triaged, the oldest waiting 120 days. The measurement also caught two defects before they shipped: 99 of 151 feedback rows are signals the app writes about itself, and a phone number and an account name were surfacing as "pattern words". Both are fixed and pinned by tests.

## 2. Missing information (only the organization can supply)

1. **Which organization is served first** beyond the family instance the governor views today (COLG, a ministry, a client).
2. **The people directory.** Owners are free text on boards and concerns and personas on projects; "who should own this" needs a real list per organization.
3. **Ticket rules** for PoeTech's own desk: what SLA means (response or resolution, by urgency), which queues exist, who is in each.
4. **Meeting volume and consent practice**, and **retention** for recordings and transcripts.

## 3. Assumptions (stated so a wrong one is caught now)

1. The readouts stay governor-only until an organization is chosen.
2. Employer data (Teams, Monday, TDX at his job) is not brought into PoeTech.
3. The `incidents` table is the base for PoeTech's ticket desk (it already has the ITSM shape and a status history).
4. The daily record is written when a governor opens the board, not on a clock; that is enough for a weekly trend and is revisited by date.
5. The browser can carry the derivation at today's volume (133 rows); it moves to the server when measured volume requires it.

## 4. Risks and their controls

| Risk | Control |
| --- | --- |
| Machine-written rows read as human worries | Named exclusion (`MACHINE_FEEDBACK`), extended only by measurement; pinned |
| Personal data surfacing in a pattern | Digit-bearing tokens never become pattern words; pinned |
| AI reading invents items (if the intake adds AI) | Every AI proposal must quote its exact line, checked by code; a person ticks before a row exists |
| The layer depends on one person approving | Approval delegable to named stewards once the people directory exists |
| Feature-parity chase with Monday or TDX | Every feature names which of the three DR-0607 verbs it serves |
| Automation runaway | Workflow rules are Tier C: budget, lock and kill-switch, inactive until armed |
| Tower dark, transcription slow | The Whisper ladder falls to the NAS CPU; each transcript names its rung |

## 5. Dependencies

1. Tower Whisper: the tower must run the Whisper service (measured not answering); the NAS CPU rung covers it meanwhile.
2. Meeting recordings reaching the database: the recorder's loop has no clock and `/scribe` has no public mount (DR-0611 limits, dated).
3. Owner readouts: the people directory.
4. Ticket SLA readouts: the ticket rules.

## 6. Decisions requiring human approval

1. **The intake locks.** You said the first design was locked down too tightly. The recommendation that remains: keep tick-to-approve; add AI reading on top of the word rules with quote-checking; store full transcripts privately with a retention date.
2. **The first organization** the layer serves.
3. **The meetings engine:** DR-0182 chose PoeTech's own OBS-based engine; an open-source media server under it would be a new decision.

## 7. Opportunities (reuse, not rebuild; from the survey of existing sovereign workflows)

1. The **incident issues** the health probes already file (site-health every 10 minutes, harvest-health, ops-queue-health, node-availability, level-witness): open incident older than N hours is an escalation; the repeat count on a rolling issue is a risk.
2. **review-watcher:** each overdue `re-review:` date in a decision record is a timeline threat with its source named.
3. **decision-chain:** a record missing its decision or outcome part is a decision required.
4. **loop-health / harvest-stall:** a stale loop or a stalled corpus is an escalation.
5. **Hand-offs** still open N days later are escalations.
These are PoeTech's own operations and join the board as their own section (Phase 1b, `re-review: 2026-10-01`).

## 8. Constraints

1. `concerns.source` accepts only `manual` or `feedback` on the live database.
2. The cloud sandbox cannot reach the NAS or the tower; the GitHub runner is the eye (NAS health reads the Whisper rung on every run).
3. No n8n; new pipelines are Python on the NAS or Supabase-direct.
4. Tier B for new tables (migration, RLS, a no-leak smoke in the isolation matrix); Tier C for automation rules and a real-time meetings engine.

## 9. Decision records reviewed

Read in full: DR-0182, DR-0589, DR-0607, DR-0608, DR-0609, DR-0610, DR-0611, DR-0612, DR-0219. Read through its decision and phase table: DR-0132. Governing from Layer 0: DR-0065, DR-0068 (as amended by DR-0247 and DR-0248), DR-0076, DR-0111, DR-0236. Named so they are not assumed read, and read before their phase is built: DR-0088 (ops queue), DR-0131 (one input surface), DR-0071 (self-activation from project logs), DR-0081 (one CRM backbone).

## 10. Timeline (estimates in working sessions, not measurements)

| Phase | What | Size | State or wait |
| --- | --- | --- | --- |
| 1 | Readouts read boards, feedback, incidents; daily record | done | PR #1768 in CI |
| 1b | PoeTech-operations section from existing workflows (§7) | 1 session | nothing |
| 2 | Paste-in intake with the agreed locks | 1 session | decision 1 |
| 3 | PoeTech ticket desk on `incidents`: queues, assignment, SLA clock, history view | 2 to 3 sessions | ticket rules (defaults can ship first) |
| 4 | Meeting recordings to transcripts to intake | 1 to 2 sessions | recorder clock + mount; tower |
| 5 | Workflow rules (when X, do Y), inactive until armed | 2 sessions | Tier C |
| 6 | Meetings engine | separate decision | decision 3 |

## 11. Intuitive design: what, where, when, how, why

- **What:** one place that tells a leader what repeats, what waits, who owns it, what stalled, what spans projects, which dates are at risk, and what must be decided, with the trend beside each.
- **Where:** Projects → Governance: intake at the top, the readouts, then the decision ledger. Boards stay in Boards; the ticket desk gets its own sub-view; lessons enter from the Speak box's 📖 Lesson chip.
- **When:** readouts recompute on every change; the daily record keeps the trend; the lesson reader every four hours; the Whisper rider every 15 minutes.
- **How:** rows in, readouts out; every item names its source rows and its reason in one sentence; a person approves what becomes a row.
- **Why:** DR-0607: so the pattern is visible without one person carrying it in their head.

## 12. What is enforced, and is each component synchronized through the database

| Component | Database-driven | Enforced by |
| --- | --- | --- |
| Boards | yes: `board_tasks`, realtime | RLS, table-sync tests |
| Projects, concerns, discussions, feedback, incidents | yes: each through its table sync | RLS; source and status checks |
| Readouts | computed on the page from those rows; **after Phase 1, each day kept in `decision_readouts`** | 13 + 23 proven-to-catch tests; the no-leak smoke in the RLS matrix |
| Lesson door | yes: `agent_inbox` (append-only from the app) | RLS; door pins |
| Spoken lessons | yes: `lesson-audio` bucket (owner folder) → `agent_inbox` transcript row | storage policies; 16 NAS proofs + 15 app tests in CI |
| Lesson reader | reads and tags `agent_inbox` | budget 3 rows, `lesson-captured` lock, disable-to-kill |
| Meeting recorder | **not yet**: its loop has no clock and `/scribe` has no mount | dated in DR-0611 |
| Workflow rules | **not built** | Tier C when built |
