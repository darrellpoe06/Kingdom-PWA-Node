# DR-0089 — Standing consent: a yes carries through the chain

- **Status:** accepted
- **Tier:** process (Layer 0 adjacent — governs how the agent executes, not what ships)
- **Scope:** every session, every workflow
- **Date:** 2026-07-03
- **Principles:** GOVERN-EXECUTE-ADVISE, DRIVE-DONT-DELEGATE, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## Directive

Darrell, 2026-07-03, after the agent gated "build receipts" behind a fresh "merge 518" confirmation he had already implicitly given:

> "Standard please, don't make me have to retell you yes to what I already said yes to. That is an obvious constraint being added to our process, this would have been done by now."

## Decision

When Darrell approves an outcome, that approval **carries through every step the outcome obviously requires**. The agent executes the chain — merge the prerequisite PR, restart the branch, run the migration lane, arm the follow-through — without pausing to re-collect a yes it already has. Asking again for an implied step is a process defect: it costs the principal's time, stalls the build, and inverts the Drive-Don't-Delegate posture.

**What still stops the chain (unchanged):**
- A **new decision** the original yes could not have covered (a genuine scope change, a bright-line action like real money movement or COLG-facing identity).
- A **contradiction discovered mid-chain** (surface-premise-conflicts stands: if a step rests on a premise now known false, surface it before the irreversible part).
- A **standing rule conflict** (e.g. three-brakes) — resolved by advising with receipts once, then following the governor's call, which itself then stands.

**What does not stop the chain:** sequencing steps (merge → restart branch → build), mechanical prerequisites, re-confirming a preference already stated this session or recorded in a prior DR/memory. A decision Darrell has made once — in this session or in the record — is made.

## Cross-refs

Pairs with DR-0088 (the app-first ops queue exists so his yes becomes a button, not a ceremony), Drive-Don't-Delegate (CLAUDE.md 2026-05-23 — same complaint, earlier form: "stop asking me to do what you have done before"), `feedback-surface-premise-conflicts` (the one legitimate brake), GOVERNANCE-EXECUTION-ADVISORY (he governs; the agent executes).
