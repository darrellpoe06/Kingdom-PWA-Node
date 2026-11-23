# DR-1614: Java builds take the newest patched JDK

**Date:** 2026-11-23
**Status:** Accepted
**Tier:** A (two build-only workflows; no deploy, data or app change)
**Type:** fix
**Area:** `.github/workflows/android-package.yml`, `.github/workflows/native-shell.yml`, `scripts/workflow-budget.json`
**Pairs with:** DR-0571 (the JDK 21 lane), DR-0076

## Context

Darrell, 2026-11-23, forwarding a university security notice on the Java4Shell flaw (unpatched Java 17 and 21 builds among those named) with the word Lessons and a second line, rendered for meaning: also fix our own systems so our stacks are protected. The lesson is built separately (Gmail thread `1a208f5960ac285d`); this record is the fix.

## What was measured

- Every `image:` in `infra/**/docker-compose*.yml` on main was read. None runs a Java runtime (Node, .NET, Go, Python and Postgres apps).
- Java exists only on short-lived GitHub runners that package the Android app: `android-package.yml` (two `setup-java` steps, Temurin 17) and `native-shell.yml` (Temurin 21). Both pin only the major version.
- `actions/setup-java` resolves a major version against the runner's tool cache first, so a run can use whatever patch level the runner image was built with, not the newest.

## Decision

Each of the three `setup-java` steps gains `check-latest: true`, so every run downloads the newest Temurin build of its major version instead of reusing a cached one. When the vendor ships the patched 17 and 21 builds, the next run uses them with no further edit. The workflow line ceiling is raised by the three lines this costs, with the reason in `workflow-budget.json`.

## Verification

Both files parse (`workflows-parse.py`, 104 files). `workflow-conformance` and `workflow-list-order-guard` pass. The six test files that read these workflows pass (110 tests), including the DR-0571 pin that the native lane stays on 21. Not verified: that a patched Temurin build is already published; the next run of either lane will show which build it fetched in its setup-java log.

## Not done

Both lanes are `workflow_dispatch` only, so nothing runs until someone dispatches one. The notice's temporary mitigation flag is not added: these runners build our own code and process no outside input. `re-review: 2026-12-07`, read the first run's fetched JDK version.
