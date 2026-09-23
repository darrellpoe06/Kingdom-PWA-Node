# DR-0589 — The board does the intelligence work: what repeats, what waits, who owns it, what has stalled, what spans areas, what threatens a date, and who must decide — derived from the rows the app already writes

- **Status:** accepted
- **Tier:** B (a migration adding five nullable columns to `concerns`; a new governor surface; the concerns board edits five more fields)
- **Type:** feature
- **Date:** 2026-09-23
- **Scope:** `infra/supabase/migrations-auto/0228-a-concern-carries-its-own-chain.sql`; `app/src/lib/decision-intelligence.js` (new, pure); `app/src/components/DecisionIntelligence.jsx` (new); `app/src/lib/concerns-sync.js` (five columns both ways); `app/src/components/ConcernsBoard.jsx` (the chain shown and edited on every card); `app/src/lib/decisions.js` (a resolution carries its chain and owner); `app/src/components/GovernanceQueue.jsx` (the app-recorded decisions render the chain); `app/src/components/Projects.jsx` (mount, Governance sub-view); `app/src/__tests__/decision-intelligence.test.js`
- **Principles:** REALITY-TRACE (DR-0061), VERIFICATION-DOCTRINE (DR-0076), SPEAK-ESTABLISHED-FACT (DR-0100), APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), NOTHING-WAITS (DR-0236)
- **Grounds:** Darrell 2026-09-23: *"How can PoeTech App do these functions for me?!!!!"* and *"Make sure the workflows are database fields connected to the systems... processes are rigorous and maintained"*; his brief's Decision Intelligence Layer (inputs: recordings, transcripts, notes, boards, tickets, reports; outputs: risks, dependencies, ownership gaps, escalation needs, patterns, timeline threats); DR-0588 (the chain on the decided ledger)

## Context

The brief asks for a layer that turns what an organization already collects into decision-ready readouts: *Risks — what appears repeatedly? Dependencies — what cannot move until another item is completed? Ownership gaps — who should own this but doesn't? Escalation needs — what has stalled? Patterns — what concerns are appearing across multiple projects? Timeline threats — what evidence suggests delivery dates are at risk?* And the board columns beside them: Evidence, Business Impact, Decision Required, Outcome. Darrell then asked the app to do that work for him, on database fields, rigorously.

## What was measured

| what | measured |
| --- | --- |
| the concerns table (0039) | `concern`, `solution`, `target_date`, `when_note`, `status`, `area`, `source`, `sort_rank`, `links`, `updated_at`: no column for evidence, impact, the decision waited on, the outcome, or an owner |
| projects rows | carry `end_date`, `status`, `blocker`, `assignee_personas` (read by the sync mapper) |
| discussions rows | a `handoff` carries `meta.handoff.to` |
| the concerns board as shipped | edits status, target date and solution; everything else is prose inside the solution |
| in-app decisions (`deriveAppDecisions`) | a resolved concern became a decision with the solution as its why, no evidence, impact, outcome or owner |

Every readout below is derived from those rows only. Thresholds are constants printed on the surface: stalled = no update for 21 days or a passed target; due-soon = 14 days with no work started; project horizon = 30 days; repeated = the same content signature twice.

## Impact

Unresolved: the six questions in the brief have no answer inside the app; a steward reads the board row by row and carries the pattern in their head, which is the single-person institutional-knowledge dependence the brief names as the thing to remove. The four columns exist only as habits of prose. Resolved: every open row can say what proves it, what it costs, who must decide, and who carries it; and the Governance view answers the six questions from those fields with the source rows named, so a reader can check each one. The migration is additive and nullable; an empty field reads as "not recorded" on every surface. Nothing is inferred from prose.

## Decision

1. **Five columns on `concerns` (0228):** `evidence`, `impact`, `decision_required`, `outcome`, `owner`, nullable, with a partial index on open rows by `updated_at`. No policy change; the row's instance policies and overlays cover new columns.
2. **The board edits them.** Every concern card shows Owner / Evidence / Impact / Decision required / Outcome, each saved on blur to its own column through the existing update path; each empty field is shown as *not recorded*. The sync mapper carries them both ways and sends a column only when the local item carries it, so a box that has not yet replayed 0228 is not refused a row.
3. **A pure derivation answers the six questions plus the seventh column.** `deriveDecisionIntelligence({ concerns, projects, discussions, nowMs })` returns risks (repeated content signature), dependencies (`links.depends_on` / `blocked_by` to an open row, or a project's own `blocker`), ownership gaps (open concern with no owner; project with no assignee; hand-off with no receiver), escalations (passed target, or idle past the threshold), patterns (a repeat across two or more areas; an area with three or more open), timeline threats (open target inside the window with no work started; a project ending inside the horizon with a blocker or a linked open concern), and decisions required (an open row naming who must decide what). Each item carries `sources` and a one-sentence `why`. No rows → `ok:false`.
4. **The surface lives where the governor already looks:** Projects → Governance, above the decision queue and ledger; the resolved concerns that reach the ledger carry their chain and owner.
5. **Not decided:** no ingestion of recordings, transcripts, tickets or emails — the brief's other inputs; the app's own scribe and feedback paths are where those already land, and joining them to this derivation is `re-review: 2026-10-07`. No automatic decision-making; the layer surfaces, a human decides.

## Verification

`decision-intelligence.test.js`: unavailable on no rows; each of the seven readouts proven-to-catch with the row that trips it and proven-quiet with the row that must not; determinism under a fixed clock; the mapper sends and reads the five columns, the column map names them, `concernChain` reports what a row lacks, and a resolved concern reaches the ledger with its chain. Guards on the push: tenancy, replay-order, matrix, replay-completeness, smoke-language, return-type. After merge: db-migrate applies 0228 on hosted and the box; open Projects → Governance on the live build as a governor and read the seven panels against the family instance's real rows; set an owner and a decision on one open concern and watch it move from Ownership gaps into Decisions required. `re-review: 2026-10-07` for the remaining inputs.
