# DR-1444: A parked promise is checked against its own date

**Date:** 2026-11-12
**Status:** Accepted
**Tier:** B (a new required gate on the lane; no product surface changes)
**Type:** decision
**Area:** `scripts/re-review-ratchet-guard.mjs` (new), `scripts/re-review-baseline.json` (new), `.github/workflows/ci.yml` + `app/package.json` (the step), `app/src/__tests__/re-review-ratchet-guard.test.js` (new)
**Sent in by:** Nobody. Pulled forward between prompts (DR-0103 §4) after #2627 landed, starting from the NAS inventory's two disabled services — and the thing found was not those services.
**Pairs with:** DR-0075 (perpetual improvement — this is its missing teeth), DR-0076 §2/§3 (a machine check, proven to catch), DR-1342/DR-1343 (the down-only ratchet shape), DR-0823 (openers: Tier C by definition)

## Context
DR-0075 ends with the clause that gives it force: *"Nothing parked is parked forever; the date is the promise it is revisited."* Nothing enforced it.

## What was measured
- **The only gate reading these dates checks their SHAPE, not whether they passed** — `system-flow-graph.mjs:205`: `/^\d{4}-\d{2}-\d{2}$/.test(String(o.reReview || ''))`. A format check is not a date check, so a parked item keeps its promise forever and the lane stays green.
- **54 of 73 machine-readable re-review dates were already past due**, across 9 files. Oldest: **103 days**.
- **The oldest is real debt a reader pays**, not bookkeeping: brand rust `#B85838` on the cream base measures **~4.2-4.4:1 in every light theme — sub-AA** — passing only on the white card (4.68:1). Parked because darkening a shared brand token is cross-cutting, which is a real reason and not a reason to stop measuring.
- **It had already been found once, and written down instead of built.** `app/src/lib/sovereignty-gaps.js` line 45, in its own comment: *"OVERDUE BY 52 DAYS when this was found (2026-09-14) — nothing surfaced it, which is the DR-0075 failure the date exists to prevent."*
- **`openers` and `fill-versions` are OFF correctly**, which corrected my own first framing: `openers` is the only service driving a physical actuator on the family's house, Tier C by definition, armed by hand and never by a merge (DR-0823), with its three brakes already built and proven in CI. The defect was never the flags; it was that their dates had passed with nothing saying so.

## Impact
Drift stops today rather than at a clean slate. A promise that goes past its date now fails the build, by name, with what would clear it — including an accessibility debt that had been invisible for 103 days.

## Decision
- **A gate holds every machine-readable parked date** against today: a new past-due date, or a new file carrying one, fails.
- **A baseline records the 54 as the honest starting line**, per file, with where each item's blockers live. Both ceilings are **down-only**; `--generate` re-freezes lower and drops a file that cleared.
- **A cleared promise must come off the list** — the baseline cannot outlive the work it tracked.
- **Prose is out of scope, said rather than silently omitted.** `docs/` carries 2,356 `re-review:` dates, 1,892 past due — but that is **not** 1,892 open promises: most are history (a record whose review happened and was written down in a later record; 314 are INDEX rows quoting those dates back). An open promise is one where the thing is still parked, and that state lives in code and config. Holding prose needs a way to tell a live promise from a finished one. `re-review: 2026-12-10`.

## Verification
- **10 green, each breaking one rule on a real copy of the tree.** A date aged past today fails (`now has 9 past-due, up from 8`); a new file carrying one fails; a padded count fails; `--generate` re-freezes **down only** (999 → 54) and never up; a re-reviewed date fails until removed, then `--generate` drops the file and the ceiling falls to 53; a file that stops naming where its blockers live fails; an emptied baseline reports every real file rather than passing vacuously; a missing baseline fails rather than reading as nothing-parked.
- **The suite caught my own fixture, twice over.** One case aged a date by pattern `/2026-1[1-9]-\d\d/`, which matched `2026-11-08` — already past due — so it swapped one overdue date for another, the count never moved, and the case failed while the guard was right. Now it picks a future date by comparing, not by pattern.
- **An earlier draft reported ITSELF**, because its header spelled a real date in an example. The header describes the two spellings instead, and the guard skips its own file and the baseline by name.
- **My first hand-count was wrong and the tool corrected it:** 8 overdue, because I had scanned only `scripts/` and `infra/`. The real figure is 54 across 9 files, `app/src/lib` included.
