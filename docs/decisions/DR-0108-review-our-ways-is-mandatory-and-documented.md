---
id: DR-0108
title: Review our ways — mandatory, documented; the agent scopes solutions to the team's capabilities, not only its own
date: 2026-07-06
status: accepted
supersedes: []
superseded-by: null
tier: n/a
entities: [all]
grounds: [WAYS-REVIEW, GOVERN-EXECUTE-ADVISE, VERIFICATION-DOCTRINE, SURFACE-PREMISE, PERPETUAL-IMPROVEMENT, DECISION-RECORDS]
source: 2026-07-06 — Darrell; "review our ways I have connectbot... Make that a documented mandatory thing reviewing our ways..."
---

## Context

Mid-task the agent said a NAS action "needs your hand / I have no SSH" and
stopped — having scoped the solution to its OWN access. Darrell has ConnectBot
(SSH from his phone): the path existed the whole time, on the principal's side.
The agent's verified inability to reach the NAS from the cloud bounds the AGENT,
not the team — and treating "we can't" as a stopping point instead of an
unverified premise is the recurring failure this decision closes.

## Decision

1. **Reviewing our WAYS is mandatory and documented** — a standing recurring
   pass over HOW we work (methods, tools, access paths, assumptions), not only
   the product. Recorded as an `orchestration`-type record in
   `docs/reviews/REVIEWS.md` (the DR-0102 registry, same build-time parse +
   in-app panel) on the standing cadence, and a NEW DR whenever a way changes.
2. **The agent accounts for the whole team's capabilities, not only its own.**
   A solution is scoped to what Darrell + the Foundation + the NAS can do — not
   to what the agent alone can reach. A stated "can't / must be by hand" is an
   unverified premise to challenge (VERIFICATION-DOCTRINE, SURFACE-PREMISE),
   never a place to stop.
3. **Run without being re-asked.** The ways-review is surfaced as a named step
   the way the reality-trace, the tests, and the live-production review are;
   silence is not a skip. Findings become an improvement shipped OR a why +
   `re-review:` date (DR-0075) — never a silent drop.
4. **Recorded capability:** Darrell can SSH into the NAS from his phone via
   ConnectBot; NAS-side runbooks are therefore executable by him, and the agent
   hands the exact paste-ready SSH steps (self-contained, ASCII-only) rather
   than declaring the NAS unreachable. What is NOT decided: no new tool, no
   automation, no autonomy — this is a review discipline, not a mechanism.

## Consequences

- Layer 0: a binding `CLAUDE.md` section ("Review Our Ways — Mandatory") loads
  first every session, so the discipline survives context compaction.
- The five ways-review questions (team capability unused / unverified "can't" /
  repeated friction / scoped-to-my-limits / more-streamlined way) become the
  standing checklist an orchestration REV runs.
- Reversible/low-risk (Tier n/a): a review practice, no runtime surface; it
  makes future scoping wider, not narrower.

## Links

`CLAUDE.md` ("Review Our Ways — Mandatory"), `docs/reviews/REVIEWS.md`
(orchestration records), `docs/decisions/PRINCIPLES.md` (WAYS-REVIEW),
[DR-0102], [DR-0077], [DR-0076], [DR-0075], [DR-0011].
