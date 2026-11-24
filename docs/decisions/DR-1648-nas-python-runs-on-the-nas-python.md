# DR-1648: NAS-side Python runs on the NAS's Python

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** A (a fix to a loop that was already armed; a new CI leg; a lint target. No new automation, no activation)
**Type:** decision
**Area:** `infra/nas-loops/bg-message-lessons.py`; `infra/nas-openers/openers.py`; `scripts/nas-python38-guard.py`; `.github/workflows/ci.yml` (leg `nas-python38`); `ruff.toml`
**Pairs with:** DR-1543 (bg-message-lessons), DR-0306 (the NAS runs Python 3.8.15), DR-0823 (openers), DR-0076 (proven to catch)

## What was measured

- `bg-message-lessons.py` did `from datetime import UTC`. `datetime.UTC` exists only from Python 3.11. Under 3.8 the import raises `ImportError: cannot import name 'UTC' from 'datetime'` before the loop does anything.
- The live ledger agrees. Rolling incident issue #2645 opened 2026-11-12T21:36Z with one line, `bg-message-lessons: last run failed`, and loops-health repeated that line on every daily run through 2026-11-22. No message became a lesson in that window. The 2026-11-24 run could not read the box at all: SSH did not answer and poetech.us returned 525. That is a separate outage, so it says nothing about this loop.
- **Why CI passed it.** Every CI leg runs Python 3.11 or newer. The loop's own tests imported the module and passed there.
- **Why it was written that way.** The repository has no ruff config, so ruff targets 3.11. Its UP017 rule rewrites `timezone.utc` to `datetime.UTC`, so the linter itself suggested the break.
- **The same sweep found `nas-openers/openers.py`** (`set[str]`, `dict[...]`, `tuple[...]`, and `str | None` in a pydantic model). It fails on import under 3.8 too. It ships disabled (DR-0823), so nobody has felt it yet. Arming it would have failed.

## Decision

1. **Fix both files with 3.8 forms.** `timezone.utc` in bg-message-lessons; `typing.Set/Dict/List/Tuple/Optional` in openers. Behaviour is unchanged: 208 nas-loops tests pass under 3.8.20 and under 3.11.
2. **A required CI leg, `nas-python38`, runs in a `python:3.8.15-slim` container**, the NAS's exact interpreter. First it runs `scripts/nas-python38-guard.py --selftest`, which plants seven defects and needs every one caught and one clean file passed. Then the guard runs over every `.py` under `infra/nas-*/`. Each file is compiled on 3.8 and statically checked for 3.9+ forms that only fail when a line runs (`datetime.UTC`, `zoneinfo`, `graphlib`, `tomllib`, `removeprefix`, `removesuffix`, builtin generic subscripts, `X | Y` in annotations). Each module is then imported in a fresh 3.8 process. Last, the nas-loops unit tests run on 3.8. The guard refuses any interpreter but 3.8, so a green run on 3.11 cannot count as a pass. The aggregator `app` needs the leg.
3. **`ruff.toml` sets `per-file-target-version` to py38 for `infra/nas-*/**`, and sets nothing else.** Measured across all 2,391 repository diagnostics: only NAS-file diagnostics changed (54 fewer, all upgrade suggestions to 3.9+ forms), and the rule set stayed at 409 rules. The linter no longer suggests the break.

## Proven to catch

On the pre-fix tree the guard reports 10 findings across the two files and exits 1. On the fixed tree it reads 139 files on 3.8 with 0 findings. Four FastAPI services stop at their third-party import and are reported as such; steps 1 and 2 still judged them.

## Not verified

- That bg-message-lessons runs clean on the box. loops-health is the witness: #2645 closes on the first passing run once the NAS answers again.
- That the box's services-sync checkout has pulled main after this merge.
- One test, `test_lesson_queue_census...test_the_SQL_refuses_the_same_two_vocabularies_independently`, fails under Python 3.13 in a sandbox and passes on 3.8 and 3.11. It is untouched here. re-review: 2026-12-08.
