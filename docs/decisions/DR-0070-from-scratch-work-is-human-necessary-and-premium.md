---
id: DR-0070
title: When a request can't reuse the 90%-done work it starts from scratch — that's a human-necessary project and may carry a premium for the human need
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
refines: [DR-0069]
tier: B
entities: [all]
grounds: [GOVERN-EXECUTE-ADVISE, COMMUNITY-FIRST, DATA-DRIVEN-LIVING, QUALITY-OF-LIFE]
source: 2026-06-13 — Darrell — "If it needs to start from scratch we will and that will be a more human necessary project and a premium may be needed because of the human need."
---

## Context

DR-0069 runs a request by reusing the ~90%-done work — that reuse is what makes
the 90/10 economics work. But some requests genuinely cannot reuse: nothing in
the composable spine matches, the work is truly novel. This names what happens
then, and ties it to pricing.

## Decision

When a request **cannot reuse** the existing work and must **start from scratch**:

1. **It is a human-necessary project.** From-scratch work needs materially more
   human involvement — design, judgment, building net-new that no module or
   workflow can compose. The 90/10 does not apply; the human share is high by
   nature. This is expected and fine — "if it needs to start from scratch, we
   will."
2. **A premium may be needed, because of the human need.** The higher human labor
   is real, so the work may carry a premium — priced to reflect genuine human
   effort, not the near-automated cost of a reuse-composed request. The premium
   is honest cost for human work.
3. **The system should DETECT and FLAG it, not silently attempt it cheap.** When
   the local AI finds no reuse path (no composable match), it surfaces the
   request as from-scratch / human-necessary / possibly-premium — a governance
   call, not a quiet best-effort at the automated price. Mis-pricing a
   from-scratch job as a reuse job is the failure to avoid.

**Fairness floor (binding):** a premium reflects genuine human need and labor —
never extraction. The COMMUNITY-FIRST and serve-not-extract commitments still
hold: COLG-first, accessibility default, no premium that prices the named first
community out of what they actually need. Premium is honest pay for human work,
consistent with serve-don't-extract.

## Consequences

- The reuse-vs-scratch axis becomes a pricing axis: reuse-composed = near-
  automated cost (the 90/10); from-scratch = human-necessary = premium-eligible.
- The local AI's plan step (DR-0069) gains a branch: "can this reuse? " — yes ->
  the automated pipeline; no -> flag as human-necessary, route to governance for
  the premium/scope call.
- Honest expectation-setting for users: most requests ride the cheap reuse path;
  the genuinely novel ones cost more because a human builds them.
- Ties to RELEASE-TIERS (a from-scratch project is also more likely Tier B/C —
  more human review) and to the SKOS pricing posture (serve, don't extract).

## Links

[DR-0069] (the reuse pipeline this branches from), [DR-0045] (the composable
engine that determines whether reuse is possible), `RELEASE-TIERS.md`,
`_root/COMMUNITY-FIRST-MISSION.md` + the serve-not-extract pricing commitment,
`_root/QUALITY-OF-LIFE-AS-NORTH-STAR.md`.
