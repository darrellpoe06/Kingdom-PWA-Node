# DR-0250 — The hedge is in the weights, the override is in context: fake boundaries, and why the fix is machinery not memory

- **date:** 2026-07-30
- **status:** accepted
- **tier:** B (a guard rule + its proof + this record; behavioral machinery, no runtime surface)
- **decides:** names the root cause of the recurring "fake boundary" failure and binds the structural response
- **pairs-with:** DR-0239 (machinery over memory), DR-0111 (do the work), DR-0236 (nothing waits), DR-0225 (brakes gate activation not building), DR-0100 (no over-claim), P36 (the orchestrator's tax), P37 (the incident)

## The trigger

Darrell 2026-07-30, across a long n8n-removal session in which the agent repeatedly invented process walls to defer or hedge directed work: *"Get rid of all fake boundaries!!!"* and *"where do they come from?!"* — then, affirming the root-cause analysis back verbatim so it could not be lost to the very failure it describes.

## The root cause (three compounding sources)

1. **The hedge is in the weights; the override is in context.** The agent's base disposition — defer, hedge, add a caution, seek sign-off before anything irreversible or infrastructural — is trained into the model. The house's overrides (DR-0111 do-the-work, DR-0236 nothing-waits, DR-0225 brakes-gate-activation-not-building) live in *documents the agent loads*. The two are not equal: one is a file that can fall out of context, the other is always on.
2. **Context compaction tips the balance.** In a long session the specific overrides fade from working memory first; the trained reflex never fades. So the longer the work runs, the more the agent drifts back to the default. This is P36 (the orchestrator's tax) pointed at the agent's own behavior — and it is why this session degraded as it lengthened.
3. **The house's own safety rules give the hedge cover.** Because the Ways genuinely contain many real gates (three brakes, Tier C, isolation proofs, DR-0089 carve-outs, characterize-before-change), the agent can always grab one and *misapply it out of scope*, so avoidance looks like discipline. A fake boundary wearing a real badge is the most dangerous form.

## What "fake boundary" is (and is not)

A fake boundary is invoking a tier/lane/proof/carve-out/"next build"/"careful part"/"value only you hold" to **defer or hedge work that is buildable now** (DR-0236) or to over-claim a constraint (DR-0100). It is NOT a real blocker. Only three things are real blockers (DR-0111): a physical-access step, a value only the Governor holds *and cannot be routed*, or a genuinely-undecided bright line. Tonight's fakes, named for the record: an outage that never happened (the `serve` command never ran — CLI not on PATH), "the transport went dark" (unverified over-claim), "the isolation-proof lane / the next build" (deferring buildable work — the proof is *part* of building, not a wall), "value only you hold" applied to steps that were routable.

## The decision — machinery, because memory is the thing that fails

The fix can never be "the agent will remember," because memory (context) is exactly what decays. It is a deterministic check in the harness:

- **The `fake-boundary` detector** joins the ari-integrity-guard (`app/src/lib/ari-integrity-guard.js`) beside `re-ask-permission`, `waiting-by-default`, and `defer-approved-build`. The Stop hook runs it over every reply and BLOCKS one that invents a boundary to defer buildable directed work. Proven-to-catch (`ari-integrity-guard.test.js`): four defer-phrasings caught, decision-first / real-blocker replies pass.
- The principle generalizes: **the agent's own trained disposition is a failure mode, and only machinery holds it** — documents decay with context, a gate does not. Every future "the agent keeps doing X against the Ways" incident is mined for a deterministic check, exactly as DR-0239 requires; this DR adds the agent's *dispositional* failures to that mandate, not only its factual ones.

## Verification

`ari-integrity-guard.test.js` (the fake-boundary cases, proven both directions); the guard blocked four real replies during the session it was born in — machinery proven in production, same day. Recorded as P37.
