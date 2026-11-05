# DR-1342: Clean workflows — one harness for the probes, a register read from the YAML, and a ceiling that only goes down

**Date:** 2026-11-05
**Status:** accepted
**Tier:** A (a reusable workflow, two callers rewritten, a generated register, a guard; no lane behaviour changes)
**Type:** register + gate (PERPETUAL-IMPROVEMENT, VERIFICATION-DOCTRINE) · DR-1330 D13
**Area:** `.github/workflows/_browser-probe.yml`; `nearby-witness.yml`, `install-health.yml` (callers); `scripts/workflow-register.mjs`; `scripts/workflow-budget.json`; `app/src/lib/workflow-register.json` (generated); `app/src/components/EndpointRegister.jsx` (the Workflows section); `app/src/__tests__/workflow-register.test.js`; `.github/workflows/ci.yml` (guards leg)
**Grounds:** DR-0075 (a ratchet only goes down), the three-brakes rule (CLAUDE.md), DR-0076 §4 (measure), DR-1337 (the register this joins), DR-1330 (the measurement)

## Context

Darrell, 2026-11-05: *"Clean functions and workflows..."* Measured: 95 workflows, 21,896 lines of YAML, 35 named health / witness / probe each carrying its own checkout, Node, playwright-core, tee and artifact steps as prose; nothing recorded which carried its brakes.

## What was measured

- **The harness** (`_browser-probe.yml`, `workflow_call`): checkout, Node, optional playwright-core, run one script with its arguments, tee to the step summary with the exit code kept (REV-0019), optional artifact. The caller keeps the trigger, the brakes and the arguments. `nearby-witness.yml` (50 → 35 lines) and `install-health.yml` (57 → 50, four doors as a matrix of one harness call each) are the first callers.
- **The register**, read from the YAML by a small reader with no YAML library: name, purpose (first comment line), triggers, crons, the three brakes (a concurrency group, a timeout, a permissions block), the reusable workflow it calls, lines. Today: 96 workflows, 22,267 lines; 42 dispatch-only, 39 scheduled; **9 without a concurrency group, 16 without a timeout, 12 without a permissions block** — listed first on Admin → Endpoints & stores, which is the page's purpose.
- **The ceiling:** the YAML total, frozen at its measured size and re-frozen down only. It fired on its first hour: the five comment lines of its own CI step put the total over, and two older step comments were trimmed to pay for it. The honest half: the harness itself added lines today (21,896 → 22,267 across the session's thirteen builds); the saving comes as callers move onto it.
- Not done here, with a date: last-run dates and the retirement of dispatch-only workflows with no run in 90 days need the Actions API from a runner with a token; `re-review: 2026-11-19`.

## Impact

A probe is its script plus twenty lines. A workflow born without a brake is visible the same day on the page; the YAML cannot grow silently.

## Decision

The harness, the register and the ceiling are the Way for workflows; the 16 without a timeout and the 9 without a lock are the next cleaning, by the page's order.

## Verification

`workflow-register.mjs` OK (ceiling held); `workflow-register.test.js` 6 cases and `endpoint-register-surface.test.jsx` 4 cases green; the three new or rewritten workflows and `ci.yml` parse; `workflow-list-order-guard` OK; lint clean.
