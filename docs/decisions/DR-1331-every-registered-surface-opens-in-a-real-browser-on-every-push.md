# DR-1331: Every registered surface opens in a real browser on every push — and the first run found two dead routes

**Date:** 2026-11-05
**Status:** accepted
**Tier:** A (a new CI leg; one shell bug fixed; the shell shrinks by one line)
**Type:** gate (VERIFICATION-DOCTRINE) · DR-1330 D1
**Area:** `scripts/e2e/surface-sweep.mjs`; `app/src/__tests__/surface-sweep.test.js`; `.github/workflows/ci.yml` (leg `surface-sweep`, in the required aggregator); `app/src/lib/nav-history.js`; `app/src/poe-financial-mvp-v28.jsx`; `scripts/monolith-budget.json`
**Grounds:** VERIFICATION-DOCTRINE (DR-0076 §3 proven to catch, §4 measure), HOLD-THE-HAND (a new surface is swept from the commit that registers it), DR-0934 (the one journey this generalises), DR-1330 (the review that proposed it)

## Context

Darrell, 2026-11-05, ratifying DR-1330: *"Build all thirteen, D1 first!!!"* D1: *"various user flows debugging tests so users don't have basic bugs... automated"*; *"Navigating between all playwright automated test site.... to test our sites or pages."* Measured before building: 1,802 vitest files mount components directly; one end-to-end journey in CI (property doors, DR-0934); about twenty single-question browser probes; nothing opened each of the 70 registered surfaces and asked whether it opened.

## What was measured

- **The sweep** reads `app/src/surfaces.js` (parsed, not copied: 70 entries, 68 distinct routes, the parse refused under 60), opens each route in Chromium at 390 and 1440 px on the built dist, and fails a route on an uncaught page error, a rendered error boundary, a fall-through to the Overview, or a hollow main region. Console errors are counted, never failed on (the stub backend refuses every call by design).
- **Its first run, before any fix: 66 of 68 opened.** `?view=study` and `?view=moore` fell through to the Overview. Both surfaces are registered with render branches in the shell; neither was in the shell's inline `VALID` list nor in nav-history's `VALID_VIEWS`, two hand-kept copies that had drifted. Every deep link to the Study circle or Moore Divahs landed on Big Picture silently.
- **Proven to catch, both ways.** `--break=chunk:rentals` answers the Rentals chunk with a module that throws; the first selftest MISSED it twice, and each miss is a fix in the sweep: the service worker served the chunk around the route interception (workers are now blocked per context), and the boundary heading reads "RENTALS HIT AN ERROR" through CSS so the sign is matched case-insensitively. `--break=pageerror` throws after load. Each exits 0 only when its own check tripped and no other route did.
- **The full sweep on the fixed build: 136 of 136 cases opened** (68 routes × 2 widths) in 469 s; 799 console errors counted.

## Impact

A surface that throws on mount, routes nowhere, or renders nothing turns the required check red before it merges, from the commit that registers it. The shell keeps one view list, read from nav-history, and is one line shorter (5,186 → 5,185; the ratchet re-frozen). `nav-history.test.jsx` now compares VALID_VIEWS against the shell's render branches instead of a list the shell no longer holds. Not done here, with a date: the sweep walks signed-out on a trusted host, so a surface that only breaks for a signed-in role is not yet reached (D2's journeys carry sign-in). `re-review: 2026-11-19`.

## Decision

The `surface-sweep` leg is required (in the aggregator's `needs`), with both planted faults run first on two surfaces. `study` and `moore` join VALID_VIEWS; the shell reads that list. `surface-sweep.test.js` pins the parser (≥ 60 entries), the route builder, the judge, and the parity rule: every top-level registry view is routable.

## Verification

Local: both planted faults CAUGHT; the full sweep 136/136; `surface-sweep.test.js` 10 cases, `nav-history.test.jsx`, `monolith-budget-guard.test.js`, `moore-door*.test.*` green (57 tests); lint clean; `workflow-list-order-guard` OK; the parity case was red on main's lists (study, moore missing) and green after the fix.
