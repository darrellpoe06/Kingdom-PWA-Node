# DR-0092 — Money visibility is the guardian's decision: education before they need it

- **Status:** accepted
- **Tier:** B (a one-line policy change in the capability registry + its tests; the child-facing education view remains a gated future slice)
- **Scope:** the guardian↔child capability policy; the future "How Money Works" child view
- **Date:** 2026-07-03
- **Principles:** GOVERN-EXECUTE-ADVISE, DATA-AS-EMPOWERMENT, QUALITY-OF-LIFE, VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## Directive

Darrell, 2026-07-03: "I do want the guardian to make that decision. I want to make sure my kids can see how money actually works — education before they need it, while there's no stress for them."

## What was there

`finance.view` ("See family finances") existed in the capability registry but was encoded **locked-deny** (`default: deny, maxGrant: deny`) — the system had made the decision FOR the guardian, permanently. That encoding contradicted the Governor's stated intent: the family's real money is the curriculum, and whether a child sees it is a parenting call, not a platform mandate.

## Decision

`finance.view` becomes **guardian-decidable**: `default: deny, maxGrant: allow`.

- **The default stays the child-safe deny** — visibility is a deliberate, per-child opt-in the guardian makes (deny / approval-gated / allow), recorded on the real `child_capabilities` row (guardian-write-only by RLS, 0055).
- **Seeing is not spending**: `purchase.any` stays locked-deny regardless of any visibility grant, as do `content.unrated` and `account.security`. The safety floor the guardian cannot remove now contains exactly the capabilities that ACT — not the one that only sees.
- The existing Relationships surface's per-child toggles pick the change up automatically (the UI reads the policy registry); the Family Roster card points guardians there.
- Tests updated deliberately: the locked-ceiling test no longer claims `finance.view`; a new test pins the governed behavior — default deny, grant holds, approval honored, spending unaffected by a visibility grant.

## The destination this decision aims at (recorded, not yet built)

The grant governs the future **"How Money Works"** child view — Darrell's stated shape: *education before they need it, no stress for them*. Design intent for that slice:
- **Guardian-curated, not raw**: the child's view teaches how money moves (income, giving/tithe, saving, budgeting — the stewardship picture) rather than dumping the raw ledger with its creditors and shortfalls; "no stress" is a construction constraint, not a tone note.
- **Grounded where the family's teaching is grounded**: biblical economics per the Worldview (stewardship, the tithe, provision) and the SEED-DATA-AS-ASPIRATION thriving-picture pattern for what "healthy" looks like.
- **Sequenced behind the existing gates**: it ships after the first child account is linked (DR-0091 re-review) and rides the consent/assent design (DR-0091 deferral) — a child-facing family-data view is exactly the stream that flow exists for.
- Until that view ships, a capability grant changes nothing a child can reach: RLS still walls the `child` role from the financial tables, and the client family surfaces gate on family sign-in. The grant is the guardian's recorded decision and the switch the education view will honor — stated plainly so nobody mistakes the toggle for a live data path today.

## Consequences

- The Governor governs: a platform default no longer overrides a parenting decision (GOVERN-EXECUTE-ADVISE, applied to the registry itself).
- The teaching intent is on the record with its why, so the education view gets built against this DR instead of re-deriving the intent later.
- The precedent is explicit: safety floors are for capabilities that ACT (spend, egress, reconfigure); visibility of the family's own life to the family's own children is the family's call.
