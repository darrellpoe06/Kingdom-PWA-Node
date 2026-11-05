# DR-1341: No runtime past its end of life — every pin has a date, read from the source, and a guard that fires on it

**Date:** 2026-11-05
**Status:** accepted
**Tier:** A (a register and a guard; no runtime changed)
**Type:** register + gate (VERIFICATION-DOCTRINE) · DR-1330 D12
**Area:** `scripts/eol-register.json`; `scripts/eol-register.mjs`; `app/src/__tests__/eol-register.test.js`; `.github/workflows/ci.yml` (guards leg)
**Grounds:** VERIFICATION-DOCTRINE (DR-0076 §4 measure, §8 provenance), DR-1218 (the Node-only gate this generalises), PERPETUAL-IMPROVEMENT (DR-0075), DR-1330 (the review that asked for the register)

## Context

DR-1218 gated Node alone. The review asked for a register with dates for every runtime we pin and a guard that reads it. Darrell ratified the build.

## What was measured

- **The dates are read, not recalled.** The endoflife.date feed is unreachable from this sandbox (the proxy refuses the host), so its source repository was cloned and the product front matter parsed at commit `e1fbd1c` (2026-11-05): Node 22 to 2027-04-30; Python 3.11 to 2027-10-31 and 3.12 to 2028-10-31; PostgreSQL 16 to 2028-11-09 and 15 (the sovereign database, 15.8) to 2027-11-11; React 18 and ESLint 10 publish no end date, and the register says so.
- **One date that matters today:** ESLint 9 reached end of life on 2026-08-06, and `npm audit` offered `eslint@9.39.5` as a "fix" for the ESLint 10 moderate finding. The register records why that fix is not taken.
- **The NAS's system Python 3.8 and OpenSSL 1.1.1** are past their dates and carry `retired-from-use` with DR-1218's why and `reReview: 2026-12-05`.
- **The guard** reads every `node-version`, `python-version` and postgres image pin in the workflows and compose files (57 pins in 107 files), fails a pinned cycle past its date or a pin with no line, warns within 120 days, and refuses a retired line without a why and a future date. Proven in 7 cases.

## Impact

A runtime reaching its date turns the guards leg red that day, with its successor named; a new pin arrives with its date or does not merge.

## Decision

The register and its guard are the Way for runtime life; the Node test stays as the narrower pin it always was. `re-review: 2026-12-05` — refresh the dates from a newer source commit, and decide the Node 22 → 24 move before the 2027-04-30 date enters the horizon.

## Verification

`eol-register.mjs` OK (7 pinned runtimes); `eol-register.test.js` 7 cases and `no-node-past-its-end-of-life` green; lint clean; `ci.yml` parses.
