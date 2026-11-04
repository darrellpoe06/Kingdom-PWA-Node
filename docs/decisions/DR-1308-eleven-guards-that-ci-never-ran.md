# DR-1308: Eleven guards that CI never ran — the coverage test checked one direction, and the instrument that caught yesterday's lost sends was on the wrong side of it

**Date:** 2026-11-04
**Status:** Accepted
**Tier:** B (the CI lane's guard job and the test that governs it; no product code, no schema, no money — but it changes which checks can stop a push, so it carries its proof)
**Type:** verification
**Area:** `.github/workflows/ci.yml` (the `app — lint + guards` job, eleven steps added) · `app/src/__tests__/verify-covers-ci-guards.test.js` (the reverse direction, the vite-node runner, and the npm-script walk on the CI side)
**Found by:** the agent, on an idle turn, following up a note the sov61 builder recorded rather than acted on — that CI does not run `one-thread-one-record-guard`. The note was right; the number was eleven times larger than the note said.
**Considered, not built:** none — this record builds no lesson and names no source thread.
**Pairs with:** DR-0361 (the false green this test was written for), DR-0077 §2 ("the real gate"), DR-1305 (the citation bug the unrun guard caught), DR-1307 (the build that recorded the note), DR-0610 / DR-1250 (what `one-teaching-one-lesson-guard` protects), DR-0076 (§3 proven-to-catch and *a gate that always passes is itself a lie*, §4 measure don't claim), DR-0975 / P46 (a gate that cries wolf is deleted within a day), DR-0621 (a flag is where the work starts)

## Context

`verify-covers-ci-guards.test.js` exists because of a false green. Building DR-0361 a local run of 13,388 tests passed, and CI went red in 45 seconds on `lessons-gate-coverage` — a guard that had never been in the local run at all. Its own header states the principle: *"A local green that does not predict CI is worse than no local check, because it is trusted."*

So the test asserts **CI ⊆ verify**: every guard CI runs must be reachable from `npm run verify`.

That is half a contract. The half nobody wrote is **verify ⊆ CI**, and it is the half that lets a guard exist, pass locally, and never once decide whether a push is allowed to land.

## What was measured

On `main` at `729b40f18`, comparing the guards named in `app/package.json`'s `verify:gates` against the guards named in `.github/workflows/ci.yml`:

| | |
|---|---|
| guards reachable from `verify:gates` | **26** |
| also named in `ci.yml` | **15** |
| **never run by CI** | **11** |

`workflow-list-order` · `unknown-is-not-a-no` · `stamp-carries-its-year` · `surface-hollow` · `constraint-allow-list` · `inline-constraint-replay` · `newest-definition-replay` · `measurement-carries-no-identity` · `migration-prose` · `one-thread-one-record` · `one-teaching-one-lesson`

**`one-thread-one-record-guard` is on that list, and it is the instrument that caught DR-1305.** Yesterday it found that DR-1300's comparison table was being read as a second claim on a thread, and that same class of fault had two of Darrell's 2026-10-08 sends invisible to the Gmail lane for twenty-seven days. It found that because a build ran it **by hand**. CI has never run it. `one-teaching-one-lesson-guard`, the duplicate-lesson check DR-0610 and DR-1250 rest on, is on the list too.

**Why the test could not see one of them at all.** Its scanner matched `- run: node ../scripts/x.mjs`. `one-teaching-one-lesson-guard` runs under `npx vite-node`, because it imports the course modules. So that guard was invisible to the scanner **in both directions** — it could not have been reported missing even if the reverse assertion had existed.

**Measured cost before adding them**, each run on this machine against `main` at `729b40f18`, all exit 0: the ten `node` guards total **~19 s** (slowest `unknown-is-not-a-no` at 11.1 s, rest under 2 s each), and `one-teaching-one-lesson-guard` **~37 s** under vite-node. Nothing here is slow enough to argue about.

## Impact

**Eleven checks have been decorative in CI for as long as they have existed.** Each one passes or fails only when a person types `npm run verify` — and the sanctioned lane (DR-0103) is explicitly designed so that nobody has to: work lands on green by itself, with no human in the merge path. So for every PR that merged through the lane, these eleven had no vote. A gate that always passes is itself a lie (DR-0076 §3); a gate that is never asked is quieter than that, and just as empty.

**The two that matter most guard Darrell's own words.** `one-thread-one-record` is what stands between the ledger and a second lesson built from a source already built, and it is what surfaced the fault that hid two of his sends. Had it been in CI, DR-1300's citation would have gone red on the PR that introduced it — on 2026-11-03 — instead of being found by hand a day later and after the damage.

**And the test that should have caught this is the shape of the bug.** It was written against a real incident, it is careful, it has its own proven-to-catch cases, and it checks one direction because the incident that produced it only had one direction. That is worth naming plainly: a gate built from one failure tends to cover exactly that failure. Adding the eleven lines fixes today; adding the reverse assertion is the part that matters.

## Decision

**1. The eleven run in CI**, in the `app — lint + guards` job, after `no-prompt-guard`, with a comment block stating the measurement and why these two in particular belong. `one-teaching-one-lesson-guard` is added with its own runner (`npx vite-node`) and a line saying the runner differs and the obligation does not.

**2. The coverage test asserts both directions.** `EVERY guard reachable from verify is also run by CI` fails with the names of any guard in `verify:gates` that `ci.yml` never calls, and tells the reader the two honest ways out: add it to the job, or remove it from `verify:gates` and say why.

**3. The scanner sees both runners.** `ciGuardSteps` matches `node` and `npx vite-node`, with a case pinning that `one-teaching-one-lesson-guard` is now visible — the guard that a node-only matcher could never have reported.

**4. The scanner follows an npm script on the CI side too, because the first draft cried wolf.** The reverse assertion's first run reported `derive-lesson-dates` as a guard CI never runs. That was **false**: `ci.yml` runs `npm run lesson-dates:check`, which is `vite-node ../scripts/derive-lesson-dates.mjs --check`. The verify side already walked npm scripts and the CI side did not, so the two halves were asking different questions and the asymmetry read as a finding. Fixed at the scanner rather than suppressed with an exception: a gate that cries wolf is deleted within a day (P46), and an allow-list entry here would have hidden the real defect.

## Verification

`app/src/__tests__/verify-covers-ci-guards.test.js`, **9 cases green** from inside `app/` — the only correct invocation, since vitest from the repo root with `--root app` mis-resolves paths and manufactures failures. `npm run lint` clean. `ci.yml` parses as YAML, 18 jobs.

**Proven to catch (DR-0076 §3), measured not asserted:**

- Stripping all eleven lines back out of `ci.yml`: **3 of 9 red** — the reverse assertion, its forged-guard case, and the vite-node visibility case.
- A guard appended to `verify:gates` and absent from CI: caught by name, as its own case.
- A guard added to CI and absent from verify: the original direction, still caught, unchanged.
- The eleven-strip case reconstructs the pre-fix `ci.yml` from today's file rather than from memory, and asserts the missing set is **exactly** those eleven.

**The test caught my own undercount, and that is the honest headline of this section.** I measured "eleven" with a one-off script over `verify:gates` alone. The reverse assertion, which walks `npm run` chains, immediately reported a **twelfth** name — `derive-lesson-dates` — and I had to go and establish whether it was a real gap or a scanner artefact. It was an artefact, and finding that out is the only reason the scanner is now symmetric. A gate wrote the better version of my own measurement within a minute of existing.

**Not verified:** that all eleven pass *on a GitHub runner*. They pass here, and this environment is not that one — CI on this PR is the first run that proves it. If any of them is red on the runner for a reason local execution cannot reproduce, that failure is this change's to fix, not a reason to drop the guard.

## What this does not close

**Whether any of the eleven should instead be retired.** Each is now enforced because it was already claimed as a gate; none was reviewed for whether it still earns its place. A guard that is wrong is worse once CI runs it. `re-review: 2026-12-04`.

**Guards that exist in `scripts/` and are in neither list.** This record compares `verify:gates` against `ci.yml`; a guard in neither is invisible to both and to this test. Not measured here. `re-review: 2026-11-17`.

---
_Generated by [Claude Code](https://claude.ai/code)_
