# DR-1343: Every file born into the repo is formatted — Prettier and ruff as a ratchet on new files, never a rewrite of the old

**Date:** 2026-11-05
**Status:** accepted
**Tier:** A (a config, a guard, two pins; no behaviour changes — the 28 files it formatted today are this session's own, each re-proven by its tests)
**Type:** gate (PERPETUAL-IMPROVEMENT) · DR-1330 D10
**Area:** `.prettierrc.json`; `scripts/format-guard.mjs`; `app/src/__tests__/format-guard.test.js`; `app/package.json` (`prettier` 3.9.10, exact); `infra/requirements-ci.txt` (`ruff==0.17.3`); `.github/workflows/ci.yml` (guards leg)
**Grounds:** DR-0075 (a ratchet only goes forward), DR-1262 (a migration is not a bump: a repo-wide reformat is a migration), DR-1330 (the measurement: ESLint at zero warnings, no Prettier, no Python linter)

## Context

The slides' "consistent code style" item. The review measured ESLint enforced with zero warnings and no formatter for JavaScript or Python. Darrell ratified the build.

## What was measured

- **Why not a big-bang reformat:** 400,673 lines of app source, eleven branches in flight, and the shell's own line-count ratchet; one reformat would conflict with every branch and move a guarded count. So the rule is a ratchet: a file ADDED since the base is formatted (Prettier through the repo's one config for `.js/.jsx/.mjs` under app, scripts and backend; `ruff format --check` and `ruff check` for `.py` under infra, scripts and backend); a file that already existed is left as it is until its own turn.
- **The config writes the house's existing shape down:** single quotes, semicolons, ES5 trailing commas, 160 columns.
- **Its first run:** the 28 JavaScript files this session added were not all formatted; `--fix` formatted them (34 files touched with the pins), and every suite over them was run again green, so the reformat changed no behaviour. No Python file was added this session.
- **Proven to catch:** Prettier through the repo config refuses an unformatted fixture and accepts a formatted one; the partition is pinned; both pins are asserted where the guard expects them.
- The guards leg fetches `main` (the checkout is shallow) and runs the guard against it after the Python step installs ruff beside pip-audit.

## Impact

A new file lands formatted or does not merge; the existing files keep their shape and their ratchets. Over time the formatted share rises as files are born and replaced, with no migration day.

## Decision

The guard, the config and the two pins are the Way for formatting. `re-review: 2026-12-05` — widen from "added" to "added or substantially changed" once the first month shows no churn against the shell's ratchet.

## Verification

`format-guard` red before `--fix` and OK after (28 js, 0 py); `format-guard.test.js` 3 cases green; every new suite of this session re-run green after the reformat; lint clean; `ci.yml` parses.
