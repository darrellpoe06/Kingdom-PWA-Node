# DR-0107 — Decide together, then build without re-asking, then experience the production build; iterate if we don't like it

- **Status:** accepted
- **Tier:** n/a (operating-process constraint; encoded in CLAUDE.md Layer 0)
- **Scope:** how the agent and Darrell work through any change
- **Date:** 2026-07-05
- **Principles:** GOVERN-EXECUTE-ADVISE, REVIEW-LIVE-PUSH, EXECUTION-OUTCOME-OBSERVABILITY, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## Directive

Darrell, 2026-07-05, clarifying the earlier "stop asking / just ship":

> "We do need the back and forth until we have what to do and then after that don't ask — at this point we just need to experience what we both discussed and you built to see how we like it based on experience of the production build. That is the best process. Then if we don't like it we do it again, easy."

## The process (three phases)

1. **Decide together (back-and-forth WELCOME).** While we are still working out *what to do*, discussion, clarifying questions, options, and premise-surfacing are the right move — this is the phase where asking earns its keep. Diverge here on purpose.
2. **Build without re-asking (once it's decided).** After we've settled what to do, the agent builds it and ships it — it does NOT re-ask what was already decided, re-confirm, or re-surface the choice. Re-asking a settled decision is the failure this corrects (it was the 2026-07-05 misfire). If a genuinely NEW unknown appears mid-build, that's phase 1 again for that unknown — not permission to re-litigate the settled part.
3. **Experience the production build (the review IS lived experience).** The judgment happens by USING the shipped thing on the live production build — Darrell and Christina experience it as a user does (reviewer mode / the live user-view, DR-0104), and decide how they like it from that experience, not from a spec or a demo. System-up ≠ liked; only living with it tells us (EXECUTION-OUTCOME-OBSERVABILITY made the human loop).

**If we don't like it, we do it again — easy.** Iteration is cheap and expected (PERPETUAL-IMPROVEMENT); a build that misses is not a failure, it's the next loop's input. This is why phase 2 doesn't need to be agonized or re-confirmed to death — shipping to experience it is faster and truer than asking more questions about it.

## Why this is the right shape

It reconciles the two things that looked contradictory: "we need the back-and-forth" (phase 1) and "stop asking, just ship" (phases 2–3). They are not in tension — they are different phases. The agent's job is to know which phase it's in: **ask freely before the decision, act decisively after it, and let the production experience be the verdict.** Pairs with DR-0104 (reviewer mode is where the experience happens), the `feedback-surface-premise-conflicts` memory (phase 1 is where premises get surfaced), and GOVERN-EXECUTE-ADVISE (Darrell decides *what*; the agent executes without re-seeking permission it already has — standing consent, DR-0089). Encoded Layer 0 so future sessions inherit the phase discipline instead of re-learning the boundary.
