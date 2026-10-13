# DR-0119 — The validation lane: Current State → Future State → Gap → Decision, with honest outcomes

- **Status:** accepted
- **Tier:** B (a working-boards capability + one real seed application)
- **Scope:** the Projects work boards; every capability-validation / client-discovery / adoption effort
- **Date:** 2026-07-07
- **Principles:** VERIFICATION-DOCTRINE, GOVERN-EXECUTE-ADVISE, APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## Directive

Darrell, 2026-07-07, sharing his own validation board from the IL Union WinPrism→Mosaic
implementation (photo of the live Monday.com board): *"These are the workflows I came up
with for the physical stores and virtual stores for that project — use these workflows to
help our project workflows to look and flow better based on the project."*

## The pattern, adopted faithfully from his board

1. **Every UNIT under validation** (a store there; a module or client business area here)
   **walks the same four steps, sideways:** Current State → Future State (what the system
   is expected to do) → Gap → Decision.
2. **Every step carries a VALIDATION OUTCOME** — Fit ✓ / Partial Fit ◐ / Gap ✕ /
   Unknown ? — a separate axis from work status: status says whether the examination is
   done; the outcome says what the examination FOUND. Absent outcome = Unknown, never a
   painted Fit (DR-0076). A Gap wears rust, never true red (DR-0099).
3. **Cross-cutting rows ("All units impacted") pin above the per-unit lanes.**
4. **A lane is DECIDED only when its decision row exists and is done** — examined-but-open
   lanes say so plainly.

This is the board-shaped form of the reality-trace: current reality named first, the
expectation stated, the gap explicit, the decision recorded — never a build straight from
assumption. It is also the discovery step of the client-business factory (DR-0114) given
its working surface.

## Decision

- The capability ships in the working boards (`lib/board-validation.js` pure + tested;
  `ProjectBoards` renders the sideways lane when a board carries flow-tagged rows; rows
  ride the synced `links` jsonb — no migration; plain boards untouched).
- **First real application:** the Moore Divahs discovery validation on
  `board-client-factory` — All units / Orders / Storefront & sharing / Classes — every
  outcome grounded in a shipped PR or a recorded decision (the unbuilt registry decision
  reads Unknown, honestly).
- **Standing use:** capability-validation, client-discovery, and adoption efforts express
  themselves in this lane form on their board — current state first, from the person who
  lives it (the client's words, DR-0114), before the future state is asserted.

## Consequences

- Validation stops being prose in session notes and becomes live, tappable board state
  (DR-0113: visible in-app from day one). Outcome chips cycle one-tap like status chips.
- The lane view and the group list are one data model, two views — every existing edit
  affordance (title, notes, owner, handoff, delete) is preserved in the group list.
