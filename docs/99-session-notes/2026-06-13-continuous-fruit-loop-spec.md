# Continuous Fruit Loop — discover → do → gate → governed-merge — Spec

**Date:** 2026-06-13 · **Layer 4 working spec** · proposed under DR-0057.
**Posture:** propose → govern → build. This authorizes nothing autonomous to
run (DR-0041). Stage A's deterministic discovery primitive (`fruit-scout`) is
built + safe ($0, read-only); Stages B/C are separate greenlights and Tier C.

> Darrell, 2026-06-13: *"Will the n8n and you continue to work the low hanging
> fruit continuously? Can you?"* — Yes, can; here's the wiring that makes
> "continuous" safe instead of a runaway.

## The loop

1. **DISCOVER** — keep the fruit queue full, never guessed.
   - `scripts/fruit-scout.mjs` (built): deterministic, $0, no LLM — scans for
     exported functions with no test reference and ranks them. The provably-safe
     discovery half.
   - The Synthesizer (DR-0055, LLM): adds judgment-based fruit (audit items,
     lint/debt, "next-best"). LLM discovery is timer-driven → carries the three
     brakes (token budget, concurrency lock, kill-switch) and ships inactive.
2. **ROUTE + DO** — the orchestrator (DR-0056): local model attempts a fruit
   item, escalates to a vendor if the judge says so, falls back to local.
3. **GATE** — the work opens a PR; **CI (lint + tests + wf36) is the mechanical
   judge.** The outcome-judge + CI together decide accept/reject.
4. **MERGE — GOVERNED** — `docs/governance/pre-authorized-policies.yaml` decides
   what auto-merges vs. queues for Darrell. **v1 auto-merge class = ADDITIVE
   TESTS ONLY** (CI-green, no source changes) — the one class where "verifiable"
   is genuinely true. Everything else (source edits, new deps, anything touching
   money / auth / PHI / church-facing surfaces) opens a PR and **waits for
   Darrell.** Bright lines never auto-promote.
5. **AUDIT + REPEAT** — every action logged to the Cage ledger; pull next fruit.

## The staged ladder (earn it)

- **Stage A — continuous DISCOVERY (now, cheap-safe).** `fruit-scout` on demand
  / as an informational CI report; the Synthesizer on a schedule (ships inactive,
  brakes, Darrell enables when watching). Output: an always-current queue. **No
  autonomous code-shipping.** This is what's buildable + safe today.
- **Stage B — continuous EXECUTION on the additive-test class (Tier C).** The
  orchestrator works the fruit queue and **auto-merges only additive, CI-green
  test PRs**; everything else queues for Darrell. Needs R4 (the local runner) +
  the three brakes + the governance policy + Darrell's greenlight. Ships
  inactive; never first-runs unattended; never while traveling.
- **Stage C — widen the auto-merge class as trust compounds.** Each new
  pre-authorized class (e.g., doc-only fixes, dependency bumps with passing CI)
  is a **separate governance decision**, added to the policy file deliberately.

## Binding rails

- **Three brakes on anything timer-driven** — even read-only LLM discovery
  spends tokens, so it is not exempt. (`fruit-scout` is exempt only because it
  is deterministic + $0 + read-only.)
- **The auto-merge class is a HARD allowlist** in `pre-authorized-policies.yaml`
  — provably-safe classes only; everything else escalates to Darrell.
- **Low-hanging fruit runs out.** As the queue's fruit gets higher, "is this
  good enough" gets fuzzier; the loop must only auto-ship where verifiable is
  genuinely true and **queue the rest** rather than risk a subtly-wrong
  autonomous merge. This restriction IS the safety model.
- **Tier C, ships inactive, never self-activates unattended, never while
  Darrell is traveling** (the 2026-06-06 runaway governs).

## Built now vs. next

- **Built (Stage A, this PR):** `fruit-scout.mjs` — run `node scripts/fruit-scout.mjs`;
  it currently surfaces ~44 untested utility functions (the synology-chat
  formatters, the sync-lib helpers, etc.) as the live queue.
- **Next:** wire the Synthesizer onto a schedule (with brakes, inactive) for
  LLM discovery; then Stage B execution behind R4 + the governance policy.

## Acceptance test

Stage B passes when: the loop pulls a fruit item, the orchestrator writes
additive tests, CI goes green, the policy auto-merges it (because it's the
pre-authorized additive-test class), the next fruit is pulled — and a non-test
item the loop attempts is **opened as a PR and left for Darrell**, never
auto-merged. Continuous on the safe class; gated everywhere else.
