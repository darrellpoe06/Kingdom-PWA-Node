# DR-1346: Every surface family and every module has a journey a person walks — six on the built app, one on the real schema, one deferred with a date

**Date:** 2026-11-05
**Status:** accepted
**Tier:** A (a journey registry, a coverage guard in the guards leg, six browser walks in the surface-sweep leg; no app code changed)
**Type:** gate (VERIFICATION-DOCTRINE) · DR-1330 D2
**Area:** `scripts/e2e/journeys.mjs` (the registry); `scripts/e2e/app-journeys.mjs` (the runner); `scripts/journey-coverage-guard.mjs`; `app/src/__tests__/journey-coverage-guard.test.js`; `.github/workflows/ci.yml` (guards leg, surface-sweep leg)
**Grounds:** VERIFICATION-DOCTRINE (DR-0076 §3, §4), HOLD-THE-HAND (a journey joins at birth, the guard makes it so), PERPETUAL-IMPROVEMENT (DR-0075: a deferral carries its date), DR-0934 (the door journeys, now one entry of a registry), DR-1331 (the sweep this builds on)

## Context

DR-1330 D2, ratified by Darrell 2026-11-05. The sweep (DR-1331) proves every surface opens. Nothing proved that a person can do the thing a surface is for, except on property doors (DR-0934), and nothing required a new family or module to bring a walk with it.

## What was measured

- **The registry** names eight journeys: six on the built app with no database (a shared lesson link lands on the lesson and not the Worship tab; Learn opens a lesson by three taps; the dock tabs open their surfaces and mark the current one; the money sections open by taps; Create's one-voice input keeps typed words and arms Send; the dock's Feedback opens a sheet that takes words), the door journeys on the real schema, and one deferred: the TLC Assistant (module `office-assistant`) mounts only for a family or business sign-in, which the dist-only runner does not yet stand in; `reReview: 2026-11-19`.
- **The guard** reads the nav families from `surfaces.js` (parsed: top, church, books, create) and the directories under `app/src/modules/` (properties, office-assistant) and fails when a family or module has no journey, a deferral lacks a why or a date, a date has passed, a runner is unknown, or an app journey is registered that the runner does not define. On the real repo: 4 families and 2 modules covered by 7 active journeys, 1 deferred and dated.
- **What the first runs found, each a fix in the runner, not the app:** 5 of 6 journeys tapped the first-device profile picker's backdrop instead of the app (a returning device now has a household profile set, the way the shell boots one); the Learn sub-tab lives in the header, not `main`; the dock changes shape on Money, so the current mark is required only while the tapped tab is still there; the one-voice input lives on Create's Lesson entry sub, not the canvas; Feedback sits in the dock's More sheet on a phone; the first button in a course's lesson list is a month fold, and a lesson row is `li[data-lesson-id]`.
- **Proven to catch.** `--break=link` rewrites the shared link to a lesson that does not exist: `lesson-link-lands` failed and `create-takes-words` did not. `--break=taps` removes pointer events from every tap target: all four tapping journeys failed and the two others did not. Each run exits 0 only in that exact shape.
- **The run on the fixed runner: 6 of 6 journeys walked.** The guard's unit test proves five findings and the clean case (18 cases with the sweep's suite).

## Impact

A family or a module added without a journey turns the guards leg red from that commit. A journey that stops working (a tab that no longer opens, a link that lands on the wrong tab, an input that drops words) turns the surface-sweep leg red before it merges. The deferral has a date, and the guard is what fires it.

## Decision

The journey registry and its guard are the Way for user flows: one entry per family and per module, active or deferred-with-a-date. The six app journeys and the door journeys are required (both legs in the aggregator). The signed-in stand-in for the app runner is the next increment, dated above.

## Verification

Local: 6 of 6 journeys; both planted faults CAUGHT in the exact shape; `journey-coverage-guard` OK on the real repo; `journey-coverage-guard.test.js` and `surface-sweep.test.js` 18 cases green; lint clean on the test; the workflow parses.
