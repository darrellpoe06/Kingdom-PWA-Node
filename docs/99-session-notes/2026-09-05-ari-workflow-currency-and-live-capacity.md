# Ari was not watching the workflows or the live system — now he is

**Date:** 2026-09-05
**Branch:** `claude/spiritual-warfare-principalities-fs5op0`
**Asked by Darrell:** *"Is Ari updating the surface of the apps to ensure alignment
with the current state of the workflows and capacity of its live systems? If not,
why and fix... comprehensively."*

Run as a DR-0219 spec-conformance pass: SHOULD → ARE → GAPS → CLOSE.

## SHOULD

- `app/src/lib/ari-app-review.js:1-27` — Ari's review exists to give a
  **comprehensive** dimensional health read of the whole app, from real records,
  with evidence per finding (DR-0076).
- `CLAUDE.md` "Verification Doctrine" — *unmeasured is reported, never papered
  over*; a gate that always passes is itself a lie.
- **DR-0107** — a down or stale site is the worst outcome; CI-green ≠ deployed.
- **DR-0125** — the site has its own outside-in witness, and **unknown freshness
  never reads as fresh**.
- **DR-0075** — a loop that stops is a decision with a re-review date, not a
  silent drift.

## ARE (before this change)

`REVIEW_DIMENSIONS` carried **nine** dimensions: delivery, plan, reviews,
backlog, inputs, data, rentals, recurrence, oversight.

Traced end-to-end:

- `buildAppReview(input)` accepted `tasks, concerns, feedback, reviews,
  decisions, transactions, rentals, debts, demoRowIds, fleet` — **and nothing
  else**.
- `AriReview.jsx:82` read `storedWorkflowRegistry()` — but **only** to compute
  `fleetOversight(...)`, i.e. brake coverage. Nothing asked whether the app's
  picture of its workflows was still *current*.
- `loop-health.js` (`assessLoops` / `stagnantLoops`) was rendered on its own
  `LoopHealth` surface and **never reached the review**.
- `site-health.js` (`fetchSiteHealth` → up / incidents / served-build freshness)
  was read by `OpsBoard` and **never reached the review**.

## GAPS — stated plainly

**No. Ari was not doing this.** Two named gaps:

1. **Workflow currency was never reviewed.** The registry was consulted for
   brakes only. Loop stagnation had a surface but no place in the comprehensive
   read.
2. **Live-system capacity was never reviewed at all.** "How is the app really
   doing" could answer *in full* without once consulting the running product —
   the exact shape of the 2026-07-06 incident (P25/P26), where every pipeline
   check was green while poetech.us served a stale build for ~9 hours.

**Why it happened:** the review was built from the app's *stored records*
(board, ledger, concerns) and grew by adding record-shaped dimensions. The live
signals lived in their own surfaces and nobody wired them across. Each piece was
individually honest; the *composition* was silently incomplete — which is worse
than a missing panel, because the headline read "clean" while two questions had
never been asked.

## CLOSE

Two new dimensions, composing the **existing, already-tested** signal producers
(the same pattern the file uses for `board.js` / `completion.js` / `re-reviews.js`):

- **`workflows` — Workflow currency.** Registry present and non-empty; loops
  assessed; stale / never / awaiting each reported with measured evidence
  (`"Transaction ledger (60d, stale past 45d)"`). Deliberately does **not**
  restate the brake/P10/DR-0132 findings `reviewOversight` already owns — a test
  pins that non-duplication.
- **`capacity` — Live-system capacity.** Served build vs main (a build behind
  main is a **bug**, quoting DR-0107's "CI-green is not deployed"), observed
  downtime today, unobserved days, and open incidents on the rolling ledger.

Wired to real data: `AriReview.jsx` now assesses loops exactly as `LoopHealth`
does (`assessLoops` + `readLoopRuns` + the snapshot marker) and reads
`fetchSiteHealth()` exactly as `OpsBoard` does; `Projects.jsx` hands down the
`loopData` and `financialDocAt` it already held.

### The rule that governs both

**Unmeasured never reads as ok.** If the registry was not injected, or the loops
were not assessed, or the live read failed, *that is the finding* — with the real
notice text when there is one. A silent "clear" over a signal nobody read is the
precise lie DR-0076 and DR-0125 exist to stop.

One hazard caught while wiring: `Projects.jsx` defaults `loopData` to `{}`, which
is truthy. Assessing `{}` would have manufactured *"N loops have never updated"*
findings that were artifacts of missing input rather than real stagnation — the
NO-STATIC-DATA class inverted. An empty object is now treated as unmeasured.

## Verification

- **19 new assertions** in `ari-review-workflows-capacity.test.js`, including a
  **proven-to-catch** block that pins the exact defect: with nothing handed in,
  both dimensions must report *unmeasured* and must **not** report `ok`.
- Findings reach the summary — a stale deploy raises the whole review to `bug`
  and lands in the top actions. Every new finding carries evidence and an action.
- **178 tests pass** across the Ari, loop-health, site-health and workflow suites.

### Two existing tests changed, and why

Both asserted that **empty input reads clean**. That assertion is now false by
design, and weakening the new gate to preserve it would have been the wrong fix.

- `ari-app-review.test.js` — the all-clear case now supplies the read-and-healthy
  signals, and a **new** test pins that empty input is *not* clean.
- `ari-review-render.test.jsx` — renamed to what it now proves: in a test
  environment with no build-injected registry and no network, the surface says
  **unmeasured** rather than painting "clean".

`npm run lint` and the `.jsx` component tests cannot run in this sandbox
(`@eslint/js` and `react` are not installed); the JSX was re-checked through
esbuild and CI covers the rest.

## Still open

`re-review: 2026-10-05` — capacity here means the **cloud-facing** live system
(served build, uptime, incidents). NAS-side headroom — disk, container health,
the sovereign Python pipelines — is not yet in this dimension; those signals live
behind the Funnel transport and need their own honest read before Ari can claim
them. Named rather than quietly folded in.
