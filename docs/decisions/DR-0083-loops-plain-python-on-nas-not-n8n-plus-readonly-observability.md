---
id: DR-0083
title: Loops run as plain scheduled Python on the NAS (not n8n), with a read-only in-app observability layer separate from the doing layer
date: 2026-06-30
status: accepted
supersedes: []
superseded-by: null
tier: infra (standing architectural requirement; applies to every loop/ingest/sync, replacing n8n over time)
entities: [all]
grounds: [DETERMINISTIC-FIRST, SOVEREIGN-FIRST, EXECUTION-OUTCOME-OBSERVABILITY, THREE-BRAKES, VERIFICATION-DOCTRINE, COST-DISCIPLINE, GOVERN-EXECUTE-ADVISE, DECISION-RECORDS]
source: 2026-06-30 — Darrell, during the money-loop import incident. wf18 (n8n on the NAS) was unreachable ("Could not reach workflow 18 / Failed to fetch") and that one fragile fetch had gated verify/categorize/derive, leaving VERIFIED=0 and 1,923 UNEXPLAINED. "The loops should run as plain Python on the NAS, scheduled, headless, no login... n8n is the fragility." And: "rebuild the visibility the right way — connect them backwards so what's happening under the hood can be seen," with the watching layer separate so observing can never break the doing.
---

## Context

n8n was the execution engine for the platform's loops (wf18 imported-transactions
ingest, etc.): a heavy server with a UI and a login that crashes, throttles, and
fails-to-fetch. On 2026-06-30 wf18 being unreachable froze the entire imported-
money pipeline — and because verify/categorize/derive had been **gated on that
remote fetch**, the ledger showed VERIFIED=0 / 1,923 UNEXPLAINED and balances sat
on the seed. The fragility was structural: a flaky execution engine sitting in
the critical path of work that is, by nature, repetitive and deterministic.

This refines **DR-0080 (deterministic-first)** with the concrete substrate
decision for loops, and applies **EXECUTION-OUTCOME-OBSERVABILITY**: the reason
n8n was tolerated was its visibility (you could see runs). That visibility must
be kept — but rebuilt so it cannot take the loop down with it.

## Decision

**1. Doing layer — plain scheduled Python on the NAS, not n8n.** Loops
(ingest, sync, backfill, recurring transforms) are built as **plain Python
scripts on the NAS**, scheduled via cron/systemd, headless, **no login, no UI**.
They replace the equivalent n8n workflows over time (wf18 first). Anything whose
output is a pure function of its input runs deterministically with **no LLM and
no n8n** (DR-0080). The money-loop verify + categorize + **derive-balance** runs
deterministically **in-app and/or as a plain NAS job**, and is **NEVER gated on
n8n/wf18** — a clean verified month must complete with the NAS engine down.

**2. Watching layer — read-only, separate from doing.** Each loop **emits**
its run-state/outcome — ran-when, processed-count, success/failure, errors — to a
**read-only** in-app surface (the existing `lib/loop-health.js` + Governor-gated
**🩺 Loops** tab, extended from freshness-timestamp to full run-state). The
emit/observe path is one-way and non-blocking: **the reliability of a loop is
independent of its visibility**, so observing can never break it the way n8n's
execution engine did. Real signals only — never a painted run (DR-0076).

**3. Sequencing.** ONE clean verified month from the **upload** (in-app
deterministic, zero n8n) is proven FIRST; the Python-on-NAS jobs (Gmail backfill
must paginate the full range — wf18 only ever processed a single frozen Jun-18
batch — and recurring ingest) come AFTER, each emitting the run-state contract
the 🩺 Loops surface reads. No bank-connection tier (dropped; only on Darrell's
explicit later say-so). NAS jobs are timer-driven automation → ship behind the
three brakes (DR/LESSONS P10–P12), inactive until armed with someone watching.

## Consequences

- The fragile remote fetch leaves the critical path; loops "just run."
- Visibility is preserved and improved (run-state, not just freshness), and is
  structurally incapable of breaking the loop.
- Migration is incremental: each n8n workflow is replaced by a Python job +
  observability entry, retiring the workflow only once its replacement emits.

## Status

Accepted as the standing direction for all loops. First application: the money
loop (verified-upload tier already in-app/deterministic — PR #437/#439; the wf18
imported overlay is the path being replaced). Spec to follow in a research-review
note; ties `project_loops_python_on_nas_observable`, `project_money_import_pipeline`,
`project_nas_deterministic_loop_runner`.
