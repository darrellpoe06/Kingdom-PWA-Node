# DR-0120 — Finishing work ripples into the record: boards ride the timelines, phase completion writes timeline context, and the app's record surfaces are TENDED — staleness always legible

- **Status:** accepted
- **Tier:** B (new timeline surface + a write-path change on the boards; rides the lane with the full suite + guards)
- **Scope:** the Projects hub (Timeline, ▦ Boards, Feedback promote queue, Discussions, Concerns & Solutions) and every future record surface; the division of tending responsibility between the cloud build agent and the Local LLMs
- **Date:** 2026-07-07
- **Principles:** APP-IS-PRIMARY, VERIFICATION-DOCTRINE, WAYS-REVIEW, PERPETUAL-IMPROVEMENT, AI-FOUNDATION-INTERNAL-OPERATIONS, GOVERN-EXECUTE-ADVISE, DECISION-RECORDS

## Directive

Darrell, 2026-07-07, four screenshots in one sitting — each a record surface the work had outrun:

1. *"Why don't the boards show up on the timelines and why aren't we adding the context to the Timelines and updating the boards after we finish each faze or swim? We need to add this to the Way and update documentation."* (The Timeline showed projects only; the boards' one presence was a dated-item count chip, and almost no board item carries a date.)
2. *"Tester notes are stale... these tabs are all stale, why... all these tabs have been UIUX checked and checked for stale or static data how is this still possible?"* (The Feedback promote queue held empty tester notes from mid-June plus two real church asks — untouched.)
3. *"This should be full of Ari notes and Ari has stopped updating as we add features."* (Discussions: zero records, while dozens of decisions shipped to the repo ledger.)
4. On Concerns & Solutions showing 4 items past target: *"Again when we add features we need to update our Ways and documentation and find the opportunities and constraints."*

And the responsibility assignment, same sitting: *"Updates to the surface of the PoeTech App is the responsibility of our Local LLMs when we add features — we need to update our Ways and documentation and find the opportunities and constraints."*

## The root cause (one failure family, four faces)

Every reviewed surface passed the standing checks because the checks verify the **surface** — that it renders real rows, no painted numbers (P15/P16, DR-0076). None of the checks verified the **data is being tended**: that finishing work ripples into the record, that queues drain, that commitments past target get re-decided. A live view of an untended queue is still stale. This is LESSONS **P30**.

## Decision

1. **Boards ride the timelines — as lanes, not a count chip.** The Projects Timeline renders every live board as a lane: its phase walk (each group / swim lane, in board order, ✓ complete / ◐ current / ○ ahead), the honest done/total roll-up, and the nearest REAL due date. Derived entirely from the real `board_tasks` rows (`boardTimelineLanes`, `boardPhases` in `app/src/lib/board.js`); an empty state says so instead of painting lanes. The dated-item chip (`boardDueByMonth`) stays as the forecast tie-in.

2. **Finishing a phase/swim writes the timeline context BY STRUCTURE — the finish ripple.** The moment a status change completes the last open item of a board group, the write itself gains an append-only `kind='phase-complete'` entry on the item's synced `links.history` (`withPhaseCompletion`, composed inside `patchTask` so every status path — chip tap, select, lane cell, seed-sync — carries it). The Timeline's "Timeline context · phases completed" feed derives from those recorded moments (`phaseCompletions`); the board's group header shows "✓ Phase complete — on the Timeline." Real recorded moments, never an invented date (DR-0076). No migration: it rides the same jsonb the handoff record already uses. **The best tending is derived, not remembered** — where a ripple can be structural, it is, and no LLM or human has to remember it.

3. **Record surfaces are TENDED as features land — and tending the app's surfaces is the Local LLMs' responsibility.** Per Darrell's assignment (and AI-FOUNDATION-INTERNAL-OPERATIONS), keeping the in-app record surfaces current as features ship — Ari notes into Discussions, feedback promoted or closed, concerns re-decided when a target passes, board items flipped — belongs to the Local LLM lane (the Ari residents on the NAS/towers), which holds real credentials inside the sovereign boundary. That lane is automation that spawns work on real data: it ships behind the **three brakes** (budget, concurrency lock, kill-switch) and is Tier C to activate. **Until it is live**, the interim responsibility is explicit: the cloud build agent ships the structural/derived ripples and honest seeds in the same PR as the feature, and the steward's one-tap affordances (load seed, sync-from-build-record) close the rest — never silence.

4. **Staleness must be LEGIBLE in-surface (P30's structural close).** Every queue-shaped surface states, on itself, how long its items have waited: the Feedback promote queue now banners items past `QUEUE_STALE_DAYS` (14) with the oldest age ("a queue is worked, not stored") via the pure `lib/queue-freshness.js`. Concerns already shows PAST DUE — that is the pattern, now binding: a new queue surface ships with its freshness read-out, or it is a review finding. An unworked queue must never look fine.

5. **The ways-review (DR-0108) gains the standing question:** "which record surfaces did this stretch of work outrun — boards, timeline context, discussions, feedback, concerns?" A yes is a finding: tend it, or carry a why + `re-review:` date (DR-0075).

## Opportunities and constraints (found, as directed)

**Constraints (honest, verified):**
- The cloud build agent **cannot write family-instance rows** — RLS + no family credentials, by design (DATA-AS-EMPOWERMENT, DR-0060). So "Ari fills Discussions" cannot be done from the build lane directly; it needs either the Local LLM lane (credentialed, inside the boundary) or code-side seeds a steward loads by a tap (the proven `SEED_BOARDS` pattern).
- The Local LLM tending lane **is not yet running** — the orchestrator brain is off (the Priority-mode copy says so honestly). Activating it is Tier C with the three brakes (DR-0106 class); it must not be rushed live unattended.
- Board items mostly carry **no dates** — so any timeline placement that needs a date would be invention. The lanes therefore lean on phase state + recorded completion moments (real), and only show `nextDue` where a real due date exists.

**Opportunities:**
- The `links.history` jsonb is a general in-app event spine: phase completions ride it today; the same pattern can carry "feature shipped" and "concern re-decided" events with zero migrations.
- The finish ripple generalizes: promote-queue drains and concern target-passes can write derived context the same structural way, shrinking what the Local LLM lane must remember.
- The first standing assignment for the Local LLM lane, when it activates, is already written: Ari notes into Discussions per shipped feature (kind = reflection/decision, `links.dr_ref` to the ledger), feedback triage, and concern re-decisions.

## Consequences

- Shipped with this DR: the Timeline board lanes + context feed, the finish ripple in `patchTask`, the phase-complete group header, `lib/queue-freshness.js` + the promote-queue banner, and the pinned tests (`board-phases.test.js`, `queue-freshness.test.js`).
- The stale INDEX conflict markers and `Next ID` in `docs/decisions/INDEX.md` are repaired in the same PR (a record surface of the repo that had itself gone untended).
- LESSONS-LEARNED gains the 2026-07-07 incident entry and **P30**.
