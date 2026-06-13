---
id: DR-0073
title: Orchestrator routing is capability-aware — vendor-first while local is small, local-first when local is strong; private always local-only
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [all]
grounds: [SOVEREIGN-FIRST, COST-DISCIPLINE, TLC-FIREWALL, DATA-DRIVEN-LIVING, EARN-AUTONOMY, GOVERN-EXECUTE-ADVISE]
source: 2026-06-13 — Darrell: "If our local source is too small why do we use it for that work? We can already tell it won't be fast — only when the vendor is offline or not available, right?"
---

## Context

DR-0056 routes **local-first** (local tries, escalates to a vendor only when it
falls short). That's correct for a *capable* local model — but the only local
model available now is a **3B running on the NAS CPU** (no GPU). It's too small
and too slow to be the primary worker: for normal tasks it usually falls below
the bar and escalates anyway, so local-first just adds 1-2 minutes of CPU
latency before reaching the vendor that was always going to answer. Darrell
named this directly.

## Decision

Make routing **capability-aware** via `ORCH_MODE`, with one invariant:

- **Private/sovereign work → local-only, ALWAYS** (every mode). Privacy outranks
  both speed and quality; it must never reach a vendor (TLC firewall / DR-0056).
- **Non-private, `ORCH_MODE=vendor-first` (the default NOW):** the capable vendor
  is primary; **local is the fallback** when the vendor is offline / unavailable
  / over-budget.
- **Non-private, `ORCH_MODE=local-first` (the GPU-era end state):** the original
  DR-0056 ladder — local tries, self-rates, escalates only the hard ones.

We did **NOT** abandon sovereignty or local-first — we **sequenced** it: vendor-
first is the waypoint while local is weak; the routing flips back to local-first
the moment a GPU box (DR-0053) makes local good *and* free *and* private.

## Rationale

Local-first earns its keep only when (a) the work is private (local is the only
allowed option), or (b) local is actually capable. On a 3B-CPU, neither holds
for normal work, so vendor-first is both faster and more honest. This is the
same arc as DR-0068's 90/10 → 1% autonomy trajectory read from the other end:
**as local gets strong, more work stays local**; until then, lean on the vendor
for non-private work and keep the floor (local) for privacy and outages. It is
also the GOVERN-EXECUTE-ADVISE pattern — the human named the real-world
constraint the model was ignoring, and the system adapts to it.

## Consequences

- `ORCH_MODE` knob (default `vendor-first`); `--private` is local-only in all
  modes; local is always the outage fallback. Implemented in `orchestrator-v0`;
  `orchestrator-v05` to follow.
- Normal runs are now fast (straight to the vendor) instead of waiting on the
  CPU 3B — fixes the "it isn't working / it's stuck" experience.
- Reversible + governable: flip `ORCH_MODE=local-first` (and raise the local
  model to 14B+ via `OLLAMA_MODEL`) once the GPU box lands.
- Refines DR-0056; pairs with DR-0053 (GPU box), DR-0062/0063 (local-as-record /
  head-to-head), DR-0068 (autonomy trajectory).

## Links

`scripts/orchestrator-v0.mjs`, `scripts/orchestrator-v05.mjs`, [DR-0056]
(tiered-LLM orchestrator), [DR-0053] (GPU box), [DR-0062]/[DR-0063] (local
source-of-truth / head-to-head), [DR-0068] (autonomy trajectory), TLC firewall
(`CLAUDE.md`).
