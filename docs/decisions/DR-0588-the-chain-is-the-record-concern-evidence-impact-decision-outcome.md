# DR-0588 — The chain is the record: Concern → Evidence → Impact → Decision → Outcome, readable in the app for every decision, required of every new one

- **Status:** accepted
- **Tier:** A (an in-app governance surface reads more of the records it already reads; a convention amendment to the DR template; one shrink-only baseline and one gate)
- **Type:** orchestration
- **Date:** 2026-09-23
- **Scope:** `app/src/lib/decision-chain.js` (new, pure), `app/vite.config.js` (the build-time ledger carries each record's chain), `app/src/components/GovernanceQueue.jsx` (the Decided ledger renders the chain and the coverage read), `app/src/__tests__/decision-chain.test.js`, `app/src/lib/decision-chain-baseline.json`, `docs/decisions/README.md` (template + rule)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 — a missing step is shown missing, never filled), SPEC-CONFORMANCE (DR-0219), PERPETUAL-IMPROVEMENT (DR-0075 — a shrink-only baseline with the rule forward), APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), REALITY-TRACE (DR-0061)
- **Grounds:** Darrell's governance brief, 2026-09-23 (below); the 550 records in `docs/decisions/`; the in-app ledger as shipped (`GovernanceQueue.jsx`, two fields per record)

## Context

Darrell, 2026-09-23, from a performance-review brief he brought into the app on purpose: the next level of maturity is *"making the connection between Concern ↓ Evidence ↓ Impact ↓ Decision ↓ Outcome easier to follow through existing governance tools"* — *"not more meetings, not more documents, not more rigor"* — so that *"any stakeholder can open the project board and immediately see what the issue was, what evidence supported it, what business impact occurred, what decision was required, what outcome resulted."* Then the standing ask: *"Evaluation of the systems and make sure we have these procedures and processes in place inside the PoeTech App."* The same four columns he recommends for a Monday board (Evidence, Business Impact, Decision Required, Outcome / Resolution) are the four this house has been writing into decision records since DR-0011, under many headings, without ever showing them as a chain.

## What was measured

| what | measured |
| --- | --- |
| decision records on disk | 550 (`DR-0001` … `DR-0587`) |
| fields the in-app Decided ledger showed per record | 2 (`decision`, `rationale` = Context or Directive) |
| records whose own headings answer all five steps, by heading family | 15 of 550 |
| most-missing step | Evidence (381 records have no measured-proof section) |
| the 28 newest records (≥ DR-0560), after the `Grounds:` bullet is read as the concern | concern missing 0 · evidence 18 · decision 15 · impact 7 · outcome 4 |
| bundle weight of carrying the chain's words for the newest 40 records at 500 chars a slot, plus each record's step shape | measured in the build (bounded; the older records' words stay in the sections the ledger already carries) |

The headings the corpus actually uses were counted before the families were written: Context 148, Decision 203, Consequences 144, Verification 137, Directive 99, Proof 46, "What was measured" 12, "Measured after merge", "Proven-to-catch", "Re-review", "Honest limits", "Not claimed", and so on. The families map those; nothing is inferred from prose.

## Impact

Unresolved: the ledger inside the app answers "what was decided" and "why", and nothing else — a steward cannot see from the surface whether a decision rested on a measurement, what it cost to leave alone, or whether its outcome was ever proven; that trail exists only for someone who opens the markdown and knows the house's heading habits. The 535 records that miss a step are not rewritten (DR-0011 is append-only); their gaps become visible and measured instead of invisible. Resolved: the chain is on the surface for every record, the gap is a number that can only shrink, and every record from this one on must answer all five before it can merge.

## Decision

1. **A pure mapper reads the five steps from a record's own sections.** `decision-chain.js` recognizes heading families for each step (Context / Why this exists / The trigger · What was measured / Proof / The verified trace · Impact / Consequences / Limits, stated · Decision / Directive · Verification / Measured after merge / Proven-to-catch / Re-review, and the others listed in the file), reads the list-style `Grounds:` bullet as the concern when no concern section exists, and lists any absent step in `missing`. It never fills a step from another step.
2. **The in-app ledger renders the chain.** Each Decided record opens as the five rows, in order, each either the record's own words under its own heading or *not recorded in this decision*; a `re-review:` date is shown when the record made one. The section header carries the live coverage read — how many of the records carry all five and which step is missing most — measured from the same build-time data, never painted. The newest forty carry each step's words in the bundle; older records carry their step shape and keep the decision and why the ledger already showed.
3. **The convention is amended forward, not backward.** The README template becomes Context · What was measured · Impact · Decision · Rationale · Verification · Links, and every record from DR-0588 on must carry all five steps under recognized headings. Older records are held as a shrink-only baseline: a record may gain a step, never lose one.
4. **Not decided:** no rewriting of the 535 older records; no new table (the records stay files parsed at build, per DR-0065's "one source, surfaced where the user is"); no change to the OPEN queue's shape (its items already name what they unblock, the recommendation and who governs — the "decision required" column).

## Verification

`decision-chain.test.js`: the mapper's fixtures (a full record maps to five; a removed step is named missing and nothing is borrowed; the `Grounds:` and `Directive` readings; the text-free shape), the real-ledger baseline (record count pinned, incomplete and per-step counts shrink-only), and the forward rule (every record ≥ DR-0588 complete — this record is its first subject). `governance-queue.test.js` pins the normalizer with and without a chain. After merge: open Projects → Governance → Decided on the live build, expand DR-0588, and read the five rows; the coverage line must state the same counts the test measured. Baseline re-measured deliberately, by running the mapper, whenever a record is added. `re-review: 2026-10-23` — after a month of records under the rule, read the coverage line and decide whether the older records' most-missing step (Evidence) is worth a backfill pass that appends measured sections without rewriting substance.
