# Vendor-LLM Routing Strategy — strength-aware routing + idle-capacity backfill

**Date:** 2026-06-13 · **Layer 4 working strategy** · elaborates DR-0056 (the
tiered-LLM orchestrator). The router's *intelligence* layer: which mind gets
which work, and what to do with paid capacity that would otherwise sit idle.

> Darrell, 2026-06-13: *"Make plans and strategies to engage with vendor LLMs
> based on the type of work they do best, and keep what we can do easiest —
> unless we don't have heavyweight work for the vendor LLMs, [then] they can
> knock out our lightweight."*

## 1. Two principles, in tension, resolved by policy

- **Frugality:** keep the easy/lightweight work LOCAL (free, private, fast).
  Spend vendor budget only where it earns its keep — the heavyweight work.
- **No idle paid capacity:** vendor budget and an open vendor-hours window that
  go unused are waste. When there's no heavyweight queued, let the vendors clear
  the lightweight backlog.

These resolve into a **priority + backfill** policy (§4), not a fixed rule.

## 2. Strength-aware affinity map (STARTING defaults — then tuned, §3)

The router seeds with these affinities and **revises them from real outcomes**;
they are first guesses, not fixed truths.

| Work type | Default primary | Why (starting assumption) |
|---|---|---|
| Code gen / refactor / agentic build + tool-use | **Claude** | careful instruction-following, strong coding + multi-step agentic work |
| Constraint-strict writing (must honor the typographic-theology + worldview rules) | **Claude** | adherence to binding stylistic/doctrinal constraints |
| Very-long-context ingestion (huge docs/transcripts) | **Gemini** | large context windows |
| Multimodal — image / video / audio understanding | **Gemini** | native multimodal (ties to vision-fairness, coaching-vision, visitor-recognition surfaces) |
| Web-grounded / broad-factual research | **Gemini** | search-grounded breadth |
| Document synthesis / summarization / reasoning | **Claude or Gemini** (judge picks) | both strong; let cost + the outcome-judge decide |
| Bulk lightweight classification / tagging | **Local first** (Qwen/4070) | cheap, private, fast; vendors only as backfill (§4) |

**Sovereignty overrides all of the above** (DR-0056): PHI / TLC / family-private
is local-only and never appears in this table's vendor columns.

## 3. The map TUNES itself (data-driven-living, DR-0004 + Flywheel, DR-0034)

Every routed task logs `(work-type × model → judged outcome, tokens, $, latency)`
in the Cage audit ledger. Periodically the router updates each affinity from the
evidence: which model actually clears the acceptance bar most often, cheapest,
fastest, for each work-type. So the defaults in §2 are a starting point the
system improves on — exactly the skills-match learning the Flywheel describes,
applied to models instead of people. A model that stops earning its slot loses
it; a cheaper one that clears the bar wins it.

## 4. The priority + backfill policy (Darrell's "unless idle" rule, made precise)

The orchestrator runs one queue, two lanes:

1. **HEAVYWEIGHT → vendor (primary spend).** Tasks the outcome-judge or the
   router flags as beyond local capability go to the affinity-mapped vendor,
   first, within budget + window.
2. **LIGHTWEIGHT → local (default).** Easy work stays on the 4070 — free,
   private — preserving vendor budget for the heavyweight lane.
3. **BACKFILL — lightweight → vendor (only when ALL hold):**
   - the heavyweight lane is **empty** (no pending vendor-grade work), AND
   - a vendor-hours window is **open**, AND
   - there is **spare prepaid budget** under the per-day sub-budget (DR-0056), AND
   - the work is not sovereignty-walled.
   Then idle paid capacity clears the lightweight backlog — fastest-cheapest
   capable vendor for that work-type. The instant a heavyweight task arrives,
   the heavyweight lane preempts; backfill yields.

This makes "don't waste paid capacity" safe: backfill is the lowest priority,
budget-bounded, window-bounded, and always yields to real heavyweight work.

## 5. Cost-per-accepted-outcome, not cost-per-call

Routing optimizes **$ per judged-good outcome**, not raw token price. A cheap
model that fails the judge and forces a re-escalation is expensive; a pricier
model that nails it once is cheap. The ledger (§3) carries the real number, so
the router learns true cost, not list price.

## 6. How it plugs into DR-0056

This strategy is the body of DR-0056's **router (§2)** and **outcome-judge (§3)**:
the affinity map + backfill policy decide *where* a task goes; the judge decides
*whether the result is good enough* and feeds the tuning loop. All of it stays
inside DR-0056's binding rails — three brakes, sovereignty gate, terminal
condition per run, staged autonomy (v0 advisory → v0.5 bounded → v1 Tier C).

## 7. Build note

Buildable starting at DR-0056 v0: ship the affinity map as static defaults +
the backfill policy as a priority rule; turn on the tuning loop (§3) once the
audit ledger has enough outcomes to learn from. The map is config, not code —
easy for Darrell to override any affinity by hand at any time.
