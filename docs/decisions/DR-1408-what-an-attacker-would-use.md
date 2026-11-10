# DR-1408: Exposure is ranked by the four elements and reported before any fix, inside the app

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** B (a new scheduled workflow that only reads and reports; a new strip on the board; one lesson)
**Type:** capability + lesson
**Area:** `scripts/exposure-report.mjs`, `.github/workflows/exposure-report.yml`, `lib/exposure-report.js`, `ExposureStrip.jsx` on OpsBoard, Data Systems dsi17
**Sent in by:** Darrell, 2026-11-10, forwarding a sponsor's email about Gartner's "Prioritize What Attackers Will Exploit: 4 Elements of Strong Exposure Prioritization" (Jonathan Nunez, March 5, 2026): research it, a lesson, and workflows that keep us secure without undermining our processes, reporting the conditions before any fix, located inside the PoeTech app.
**Pairs with:** DR-1330 D3 (the dependency-audit guard and its dated allowlist), DR-0076 (unknown is never safe), DR-0065 (the app is the primary artifact)

## Context

The research's claim: rank weaknesses by four elements together, not by severity score alone. The elements are threat intelligence, asset context, exploitability and security control validation. Prioritize and validate before mobilizing a fix, the order of continuous threat exposure management (CTEM). Its forecast is that by 2028 this cuts breach likelihood by at least 70% against peers ranking mainly by CVSS. That forecast comes through a vendor that sells validation tools, so it is held as a forecast.

## What was measured

- **What we had.** `dependency-audit-guard` fails the build on a high or critical finding unless a dated decision holds it. It ranked by severity only, and it lived only in CI.
- **The audit run of 2026-11-10.** `npm audit` found 10 packages with known vulnerabilities: 1 in what ships (xlsx, held until 2026-12-05) and 9 in build and test tools.
- **Severity alone would mislead.** By severity, vitest and tinypool, both critical, lead. By the four elements, the shipped xlsx leads.
- **What this sandbox cannot reach.** CISA, FIRST and GitHub's global advisory API are all out of reach here, so the threat feeds are read on the runner.

## Impact

What ships, what is being exploited and what holds each finding are now visible in Admin, Systems, every week. The weekly run changes nothing. Severity alone no longer ranks, and an unreadable feed never reads as safe.

## Decision

- **`exposure-report.mjs`** ranks each vulnerable package by the four elements:
  - KEV and EPSS, with the CVE taken from GitHub's advisory database;
  - shipped or build-only, and direct or transitive;
  - CVSS reach: AV:N with no privileges and no user action;
  - the allowlist's dated decision.
  - Tiers: Act now = shipped and exploited or likely (EPSS of at least 0.1). Plan = shipped and serious, reachable or unknown. Watch = everything else. Unknown is never Watch.
- **The workflow** runs every Wednesday and on dispatch.
  - It is report only: no fix, no PR, no push, no install.
  - It runs one at a time with a ten-minute ceiling.
  - On a pull request it only reports, to prove the runner's reach.
  - It rewrites the rolling `exposure-report` issue. Every input is already public (the lockfile, the allowlist, the feeds).
- **The Exposure strip** on OpsBoard reads that issue live and says each state as itself.
- **dsi17** teaches it, with the forecast labelled and the seller named.

## Verification

- `exposure-is-ranked-before-any-fix.test.jsx`, 17 cases, covers:
  - all four elements;
  - **proven to catch:** a severity-only sort puts the build-tool critical first;
  - unknown is held at Plan;
  - the workflow cannot fix, push or publish from a PR;
  - each app state, and the strip on screen.
- The script's own `--selftest` runs in the workflow.
- The dsi17 gate has 38 cases. It ties Wednesday, ten minutes, December 5, 2026 and the strip's title to the real files, and it is proven to catch "every Thursday".
- The forecast row in `lesson-sources.json` is read back by the source witness on the runner.

`re-review: 2026-11-18`: read the first scheduled report and confirm KEV and EPSS were read.
