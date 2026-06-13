---
id: DR-0063
title: Local LLM authors the plan, reviewed head-to-head against vendor LLMs; a bounded historical decision framework accumulates which wins (competence collection)
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
refines: [DR-0062, DR-0056]
tier: C
entities: [all]
grounds: [SOVEREIGN-FIRST, GOVERN-EXECUTE-ADVISE, DATA-DRIVEN-LIVING, DATA-AS-EMPOWERMENT, THREE-BRAKES, LESSONS-LEARNED]
source: 2026-06-13 — Darrell, refining the AI layer — "The local LLMs should come up with a plan to and the review that against the vendor LLMs to see if they are better for our systems once they get the results and a historical decision Framework if not to much competence collection."
---

## Context

DR-0062 set the trust direction: local LLM is the source of truth, vendor output
is evaluated against it, the app stays vendor-independent. Darrell's follow-on
sharpens *how* the evaluation runs and adds a learning loop: the local model
doesn't just gate vendor output — it AUTHORS the plan first, then the plan is put
head-to-head against the vendors, and the results accumulate into a track record
the system uses to decide when a vendor is even worth calling. With a cost
caveat: keep the record-keeping lightweight.

## Decision

The local↔vendor evaluation (DR-0062) runs as a four-step loop:

1. **Local authors the plan.** The local LLM produces the plan / decision /
   answer first. It is the author, not merely the gate — the originating source
   of truth (extends DR-0062).

2. **Head-to-head review against the vendor LLMs.** The local plan is then
   reviewed *against* the vendor models: given their results, is a vendor's
   proposal **better for OUR systems**? The bar is "better for our systems" —
   judged against local truth and our own context and constraints — not generic
   benchmark quality. The local model (DR-0062) adjudicates the comparison.

3. **Historical decision framework (competence collection).** Every comparison
   records the task, both proposals, which was chosen, why, and — where
   observable — the outcome. Over time this becomes a **track record of which
   source wins for which kind of task**: the system's accumulated competence
   about its own tools. It feeds the forward decision of **whether to call a
   vendor at all** — if local reliably wins a task class, stop spending vendor
   budget on it; if a vendor reliably wins another, route there knowingly.

4. **Bounded — only if it's not too much to collect.** Per Darrell's caveat
   ("if not too much competence collection"): the framework stays LIGHTWEIGHT —
   capture the decision + outcome, not heavy instrumentation. The collection
   must earn its keep; if the overhead of recording outgrows the value of the
   record, trim it. Cost/overhead is bounded (ties the three-brakes /
   cost-discipline ethos).

This REFINES DR-0062 and DR-0056 (does not supersede): the sovereignty egress
gate, three brakes, terminal conditions, and Tier-C/ships-inactive staging all
still hold.

## Consequences

- DR-0062's "evaluation layer" becomes a **compare-and-record loop**: author
  local → compare vs vendor → record the verdict.
- The historical decision framework is an **append-only decision ledger** (pairs
  with the Cage ledger + institutional-memory-events; it is the AI-routing slice
  of the same "decisions are data" discipline).
- **Vendor spend becomes data-justified, not reflexive** — the track record
  tells us where vendors actually add value, directly serving vendor-independence
  (DR-0013): we pay only where local provably loses.
- The "competence collection" is **explicitly bounded** — a binding constraint,
  not just a nicety: no instrumentation that costs more than it returns.
- Ships nothing by itself. The orchestrator (DR-0056) stays Tier C, staged,
  inactive until greenlit; this sets the loop's shape and the ledger requirement
  the build must follow.

## Links

[DR-0062] (local = source of truth; the layer this loop runs inside), [DR-0056]
(the orchestrator), [DR-0013] (vendor-optional sovereignty roadmap — the spend
decision this informs), `_root/LESSONS-LEARNED.md` + the Cage append-only ledger
(the historical-decision-framework's home discipline), the three-brakes rule in
`CLAUDE.md`, `RELEASE-TIERS.md` (Tier C).
