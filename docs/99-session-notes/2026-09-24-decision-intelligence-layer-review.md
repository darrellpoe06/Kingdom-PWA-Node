# Decision Intelligence Layer — comprehensive review before build (2026-09-24)

**Status:** for agreement. Nothing below is built beyond what already ships; the paste-in intake draft is parked on `wip/decision-intake-paused` and does not enter the lane until this is agreed.

**Agreed so far (Darrell, 2026-09-24):** "No we dont want TDX or Monday... we want our own version of those systems inside of PoeTech App." "Mix fits": PoeTech builds boards, the ticket desk and workflows on its own tables; open-source engines are borrowed only where they do one job with no data model of their own (Whisper for transcription; a media engine for meetings if chosen).

**Purpose it serves (DR-0607):** repeatable governance systems that help organizations recognize patterns, surface risks, and make better decisions without depending on one person's institutional knowledge.

---

## 1. What exists — measured on the live project today

| Monday / TDX / Teams function | PoeTech today | Table | Live rows | Read by the Decision Intelligence board? |
| --- | --- | --- | --- | --- |
| Boards (Monday) | `ProjectBoards.jsx`: boards, groups, status, owner, start/due, hand-off push; list views, no drag kanban | `board_tasks` (0059) | **57** | **No** |
| Projects | Projects timeline | `projects` | **20** (19 open, 6 with an assignee, 0 with a blocker) | Yes |
| Tickets (TDX) | `incidents`: ITSM-shaped (category, urgency incl. incident/change/request/problem, status, lifecycle log, due, resolved_by); UI in Rentals work orders and the Big Picture | `incidents` | **4** | **No** |
| Intake / requests | Feedback with triage status | `feedback` | **151** | **No** |
| Concerns | Concerns board with the five-field chain (0228) | `concerns` | **0** | Yes |
| Decisions / hand-offs | Discussions (directive, decision, handoff) | `discussions` | **0** | Yes |
| Meetings (Teams) | Meeting scheduling with load rules (DR-0182); the OBS engine is the Tier-C target, not built | `ministry_meetings` | **0** | No |
| Recordings / transcripts | `WorkflowScribe.jsx` records with consent and uploads to the NAS scribe; **no code writes `scribe_sessions`** | `scribe_sessions` (0121) | **0** | No |
| Transcripts (sermons) | Whisper/YouTube sermon transcripts | `video_transcripts` | **872** | No (not governance data) |
| Workflow automation | Hand-offs staged only; no rules/trigger table; n8n being retired (DR-0132) | — | — | — |
| Readouts | Decision Intelligence board (DR-0589): the six questions + decisions required, derived live in the browser, not stored | — | — | — |

**The finding that matters most:** the board answers the six questions from **20 rows** today (projects only, since concerns and discussions are empty). The richest rows PoeTech already holds — **57 board tasks, 151 feedback items, 4 incidents** — are not read at all. Connecting them needs no new input from anyone.

## 2. Missing information (only Darrell or the organization can supply)

1. **Which organization first.** Family, COLG, a ministry, or a client (TLC offices, the build-billing clients)? It decides whose rows the layer reads and who can see it.
2. **The people directory.** Owners today are free text (`board_tasks.owner`, `concerns.owner`) or personas (`projects.assignee_personas`). "Who should own this" needs a real list of people per organization.
3. **Ticket rules.** What SLA means (response time? resolution time? by urgency?), which queues exist, who is in each.
4. **Meeting volume and kind.** How many meetings a week would be recorded; whether all parties consent (the scribe requires it).
5. **Retention.** How long a transcript is kept.

## 3. Assumptions (stated so a wrong one is caught now)

1. The first user is Darrell as governor; the readouts stay governor-only (as DR-0589 mounted them) until an organization is chosen.
2. Employer data (his job's Teams, Monday, TDX) is **not** brought into PoeTech; the layer is built for organizations that run on PoeTech.
3. `incidents` is the right base for PoeTech's ticket desk (it already carries the ITSM shape and a status history).
4. `board_tasks` stays the Monday-equivalent; a separate `boards` table is added only if boards need their own fields.
5. The derivation can stay in the browser at today's volume (under 300 rows); it moves server-side when volume demands, measured, not guessed.

## 4. Risks

| Risk | Control |
| --- | --- |
| AI reading invents items that were never said | Every AI proposal must quote its exact line; the quote is checked against the text by code before it is shown; a human ticks before a row exists |
| Feature-parity chase (rebuilding all of Monday/TDX) | Build only what the six readouts and a named organization need; each feature names which of DR-0607's three verbs it serves |
| The layer depends on Darrell ticking every item (the single-person dependence it exists to remove) | Approval can be delegated to named stewards per organization once the people directory exists |
| Stored transcripts leak | Private storage under the instance with RLS; retention date; consent recorded per recording (the scribe already requires consent) |
| Notification fatigue | Readouts are pulled, not pushed, until a threshold is agreed |
| Automation runaway (workflow rules) | Rules engine is Tier C: budget + lock + kill-switch, ships inactive (Layer 0 three brakes) |

## 5. Dependencies

1. **Transcription** of recordings depends on the tower's Whisper, which waits on the `TOWER_CREED_PASSWORD` repository secret (measured absent, run 36005924144). Browser dictation works today without it.
2. **Scribe → transcript → intake** depends on a writer for `scribe_sessions` (missing).
3. **Owner readouts** depend on the people directory (missing information 2).
4. **The ticket desk's SLA readout** depends on the ticket rules (missing information 3).
5. **The purpose line** on the OpsBoard depends on PR #1765 (held).

## 6. Decisions requiring human approval

1. **The four intake locks** (from the earlier message): recommendation — keep tick-to-approve; add AI reading on top of the word rules with quote-checking; store full transcripts privately with a retention date.
2. **The first organization** the layer serves.
3. **Ticket desk base:** extend `incidents` (recommended) or a new table.
4. **Meetings engine:** DR-0182 chose PoeTech's own OBS-based engine. An open-source media server (for example Jitsi) could be the engine under it; that is a new decision against DR-0182, not assumed.
5. **The tower secret** (a value only he holds).
6. **Lifting the hold on #1765** (the purpose line).

## 7. Opportunities

1. **Quickest win, no new input:** feed `board_tasks` (57), `feedback` (151) and `incidents` (4) into the readouts. The board goes from 20 rows read to about 232.
2. **Blocked and owner fields already exist** on `board_tasks` (status `blocked`, `owner`, `due_date`): dependencies, ownership gaps and timeline threats light up from real boards.
3. **Readout history:** storing each day's readout counts makes trends visible ("risks up three weeks running"), which is the pattern-across-time senior leaders need.
4. **One governance home:** Projects → Governance already holds the readouts and the decision ledger; intake and the desk join it rather than scattering.
5. **The lesson and the product are the same teaching** (pm11): the organization's learning, prioritizing and deciding, inspected in quantity and quality.

## 8. Constraints

1. `concerns.source` accepts only `manual` or `feedback` on the live database; intake rows carry their origin in `links`.
2. The cloud sandbox cannot reach the NAS or the tower; anything that runs there is proven by the runner, not by this session.
3. n8n is being retired (DR-0132); new pipelines are Python on the NAS or Supabase-direct, never a new n8n webhook.
4. Tier C for automation rules and a real-time meetings engine; Tier B for new tables (migration + RLS + grants, proven with a live insert/read).
5. Licenses: AGPL tools (for example some ticketing and board products) require sharing modifications when offered as a service; the mix avoids adopting whole products.

## 9. Decision records reviewed

Read in full this session: DR-0589 (the board), DR-0607 (purpose), DR-0608 (the lesson door and the rigorous transition), DR-0609 (pm11), DR-0182 (sovereign meetings). Read through its decision and phase table: DR-0132 (n8n off the critical path). Governing from Layer 0: DR-0065 (app is primary), DR-0068 (three brakes), DR-0076 (verification), DR-0219 (should/are/gaps/close). Not yet read, named so it is not assumed: DR-0088 (app-first operations queue), DR-0131 (one input surface), DR-0071 (self-activation from project logs), DR-0081 (one shared CRM backbone) — each touches this layer and is read before its phase is built.

## 10. Timeline (estimates in working sessions, not measured)

| Phase | What | Size | Waits on |
| --- | --- | --- | --- |
| 1 | Readouts read `board_tasks`, `feedback`, `incidents`; daily readout snapshot stored | 1 session | nothing |
| 2 | Paste-in intake with the agreed locks; transcripts stored privately if agreed | 1 session | decision 1 |
| 3 | PoeTech ticket desk on `incidents`: queues, assignment, SLA clock, status history view, its own sub-view | 2–3 sessions | decisions 2–3, ticket rules |
| 4 | Scribe writes `scribe_sessions`; recording → transcript → intake | 1–2 sessions | tower secret |
| 5 | Workflow rules (when X, do Y) with the three brakes, inactive until armed | 2 sessions | Tier C arming |
| 6 | Meetings engine | separate decision | decision 4 |

## 11. Intuitive design — what, where, when, how, why

- **What:** one place that tells a leader what repeats, what waits, who owns it, what stalled, what spans projects, which dates are at risk, and what must be decided.
- **Where:** Projects → Governance (intake at the top, readouts, then the decision ledger). Boards stay in Boards; the ticket desk gets its own sub-view; every readout item links to the row it came from.
- **When:** readouts recompute on every change; a daily snapshot records the trend; intake runs when someone pastes or a recording finishes.
- **How:** rows in, readouts out; every item says why in one sentence and names its source rows; a human approves what becomes a row.
- **Why:** DR-0607: so the pattern is visible without one person carrying it in their head.

## 12. What is enforced, and is each component synchronized through the database

| Component | Database-driven? | Enforced by |
| --- | --- | --- |
| Boards | Yes: `board_tasks`, browser-first then synced, realtime | RLS, no anon access, table-sync tests |
| Projects, concerns, discussions, feedback, incidents | Yes: each through its table sync | RLS; `concerns_source_check`, status checks |
| Readouts | **No:** computed in the browser on render, never stored; no history | `decision-intelligence.test.js` (each readout proven-to-catch and proven-quiet) |
| Scribe | **No:** recordings go to the NAS; `scribe_sessions` has no writer | consent gate in the component |
| Hand-offs / workflow | Partly: hand-off history in `board_tasks.links.history`; dispatch always staged | `orchestrator-handoff` staged-only rule |
| Intake (parked) | Would write through `concerns`; the paste itself not stored | deterministic rules + tick-to-approve, tests in the parked draft |

**Gaps:** readouts are not stored (no trend, no audit of what a leader saw); three tables with real rows are not read; the scribe does not reach the database; no rules engine. Phase 1 closes the first two.
