# DR-0616 — Phase 1b: PoeTech operations read from the workflows already running, and the feedback loop closes

- **Status:** accepted
- **Tier:** B (a migration widening one CHECK; a new governor surface)
- **Type:** feature + fix
- **Date:** 2026-09-24
- **Scope:** `app/src/lib/operations-intelligence.js` (new); `app/src/components/OperationsIntelligence.jsx` (new); `app/src/components/Projects.jsx` (mount on Governance); `app/src/lib/feedback-loop.js` (new); `infra/supabase/migrations-auto/0233-a-feedback-note-can-be-in-progress-and-fixed.sql`; `app/src/components/FeedbackCenter.jsx` (triage moves, promoting marks the note, the sender reads the reason); `app/src/lib/feedback-receipt.js` (every status mapped; declined and needs-info with the reason); `app/src/lib/feedback-sync.js` (carries `triage_notes`); `app/src/lib/concerns.js` (fixed and declined notes leave the open concerns); `app/src/__tests__/operations-and-feedback-loop.test.jsx` (new, 18); `app/src/lib/legibility-health.json`
- **Principles:** REPEATABLE-GOVERNANCE (DR-0607), DR-0612 (Phase 1; its §"workflows already built"), VERIFICATION-DOCTRINE (DR-0076: measured before shipping; a false signal removed), SPEC-CONFORMANCE-REVIEW (DR-0219), DR-0132 (no n8n)
- **Grounds:** Darrell, 2026-09-24: *"Build Phase 1b now"* and *"Also make sure our feedback loop is correct inside this workflow... make sense?"*

## Context — the question (SHOULD → ARE → GAPS for the feedback loop)

**SHOULD.** A note sent through Feedback moves from received to triaged to fixed or declined, each move is kept on the note, and the sender reads where it stands (`app/src/lib/feedback-receipt.js`, "The four honest states a sender's note can be in").

**ARE (measured).** Only `app/src/lib/feedback-sync.js:219` ever wrote `triage_status`, and only `'new'` on insert. The database allowed `new / reviewed / promoted / declined / needs-info` (`infra/supabase/schema-v1.sql:212-214`), while the receipt looked for `in-progress / working / reviewing / resolved / done / fixed`: no note could ever read "being worked on" or "fixed". Promoting a note to a project, incident, change or requirement left it `'new'`. On the hosted copy, 52 human notes sat untriaged up to 120 days (DR-0612; the live count is re-measured by the board, DR-0614).

**GAPS.** No control moved a note; the receipt's states were unreachable; promotion was invisible to the sender.

## What was measured for Phase 1b (the 578 decision records on disk)

| signal | measured |
| --- | --- |
| re-review dates passed | 133 |
| re-review dates due within 7 days | 46 |
| records with no "Decision" heading | 134, **rejected as a signal**: sampled records (DR-0159, DR-0192, DR-0201) state their decision under "The Way" / "What was done"; calling them undecided would be false |
| records still "proposed" | 2 (DR-0082, DR-0105): the truthful "decision required" |

## Decision

1. **PoeTech operations** is its own section on Projects → Governance, beside the organization's readouts and never mixed into them. It reads, from workflows that already run: the health probes' `incident` issues through `lib/site-health.js` (the OpsBoard's reader): open 24 hours = escalation, observed 3+ times = repeated risk; each record's latest `re-review:` date from the build-time ledger: passed or due within 7 days = timeline threat; a record still "proposed" = decision required; the family's data loops with a real last update past their limit = escalation; a hand-off open 21 days = escalation. A failed incident read is said and the rest still shows.
2. **The feedback loop closes.** The steward's queue gains four moves beside the promote buttons: Working on it, Fixed, Need more info (reason required), Decline (reason required). Promoting a note marks it promoted. Each move is written to the note (`setFeedbackTriage`, which reports "no row changed" instead of pretending). 0233 lets the database hold `in-progress` and `fixed`. The sender's receipt maps every status truthfully and shows the reason word for word. A fixed or declined note leaves the open concerns.

## Verification

- `operations-and-feedback-loop.test.jsx` 18: each operations signal proven-to-catch and proven-quiet; an unread ledger is left out, not zeroed; superseded records never flagged; only "proposed" is a decision required; the surface reads incidents through the reader and says a failed read; the mount pinned; every status the loop writes is allowed by 0233; the reason is written and required where owed; an unchanged row is said; each status read truthfully by the sender; fixed and declined leave the concerns; the queue's moves and the four promote markings pinned.
- The feedback, concerns, receipt, queue, consistency, legibility, show-the-word and governance suites: 383 green; eslint 0.
- After merge: open Projects → Feedback as a governor, choose Working on it on one note; the sender's "Your feedback" list reads "Being worked on".

## Limits, stated

1. **133 overdue re-reviews is a real backlog, not noise.** The section shows the eight most overdue and the count; working the backlog down is the review-watcher's cadence, not this surface's.
2. **Triaging requires the owner or admin role** (the existing `feedback_admin_update` policy). A steward without it is told "no row changed" rather than a false save.
