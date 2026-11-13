# DR-1467: A check narrower than its name, three times in one night

**Date:** 2026-11-13
**Status:** Accepted (the three measured instances; one instrument change proposed with its date)
**Tier:** B (names how verification itself is run, and corrects three of my own claims)
**Area:** `.github/workflows/ci.yml` (the `app — lint + guards` chain), `scripts/format-guard.mjs` (invocation path), the session's shallow clone, `scripts/american-spelling.test.js` (the prior instance)
**Sent in by:** Nobody. Three red CI checks and one near-miss on a force-push, all in the hours after sov76 and sov77 landed.
**Pairs with:** DR-0076 (§2 machine checks over claims, §3 proven-to-catch — a gate that always passes is a lie, §4 measure do not claim), DR-1343 (files born into the repo are formatted), DR-1452 (the `american-spelling` corpus gap, the same shape), DR-0621 (a flag is where the work starts)

## Context

sov76 and sov77 both shipped and both deployed. Everything that went wrong around them was a verification instrument reporting on less than its name claims, and in each case the green was not a lie about the code — it was a lie about the coverage.

## What was measured

**One — the guard chain is forty-five, not four.** (My own extraction from `ci.yml` found 41 entries; the sov78 builder, reading the job definition rather than pattern-matching it, counted **45** steps including the three npm steps, gitleaks and pip-audit. Even the corrected count was undercounted by the method I used to correct it, which is the whole point of this record.) The brief I handed the sov77 builder named four guards to run by name. `.github/workflows/ci.yml`'s `app — lint + guards` job runs **about forty** scripts plus `npm run lint`, `npm run verify` and `npm run lesson-dates:check`. The builder ran exactly the four it was given and reported each exit code honestly. CI then failed on `file-budget-guard` — a fifth it was never told about: `app/src/lib/sovereign-ai-class.js` at 11,889 lines over an 11,697 ceiling. **The builder did nothing wrong; the list was recalled from memory instead of read from the file.** I had made the identical mistake on my own PR hours earlier, reporting "all guards green" having run three, when `record-length-guard` — the one my own record failed, at 886 characters against a 700 ceiling — had never been run. That single defect turned three CI checks red (`record-length-guard`, `bloat-ratchets.test.js:36`, and the aggregator) out of 9,114 tests of which 9,113 passed.

**Two — `format-guard` has THREE separate ways to report success while checking nothing.** It lives at the repository root and reads *files added since `origin/main`*.

**(a) Wrong directory:** invoked from `app/` node exits `MODULE_NOT_FOUND`, which a wrapper reading only "did this come back" takes for a pass — how two files sov77 was born with reached CI unformatted against DR-1343 after reporting exit 0; **I repeated the mistake re-checking it.** **(b) Uncommitted files are invisible:** diffing `origin/main` means an untracked file is not yet "added", so the sov78 builder measured `0 added files` and a clean pass, then after committing the same command named both files unformatted — green at exactly the moment you are most likely to ask. **(c) Both collapse to one rule: an exit code is evidence only about the files the guard actually saw.** DR-0076 §3 exactly — "the script was not found" and "there was nothing to check" are the two cheapest ways to make a check unfailable.

**Three — the shallow clone answers questions it cannot answer.** This session's clone was shallow, and git did not say so when asked about history; it simply answered wrong, with confidence:

| Question | Shallow answer | Truth after `--unshallow` |
|---|---|---|
| `git log origin/main` | 2 commits | 2,963 |
| Are these 4 merged commits ancestors of main? | **NO** (all four) | YES (all four) |
| Commits on branch not in main | **2,951** | 0 |
| `lesson-dates:check` | exit 2 | exit 0, 927 of 927 dated, nothing regenerated |

The ancestry reading is the dangerous one. My standing instruction permits `--force-with-lease` when a branch holds only already-merged history, and a shallow view can make merged and unmerged history indistinguishable. **A lease protects against a stale ref, not against a wrong judgment.** I avoided it only because two readings disagreed and I checked a third way. The sov77 builder hit the same truncation twice mid-build.

**AND THE DEEPENING DOES NOT HOLD.** Twice after a successful `--unshallow`, `.git/shallow` was PRESENT again, `git rev-list --count HEAD` read **1**, HEAD was marked `(grafted)`, and `lesson-dates:check` and `npm run verify` failed with the shallow message again — the second time within minutes, not hours.

**The likely cause is concurrency, not restarts, and it is worth naming precisely.** `git worktree list` showed two worktrees on this clone: the session's own, and `wt-sov78` held by a builder agent running in the background. **Worktrees share a single `.git`**, so a shallow fetch inside the builder's worktree re-shallows the repository for every worktree on it, including the one doing the verifying. `.git/shallow` was recreated at 02:20:35, while that builder was working. I did not observe the builder's fetch itself, so this is stated as consistent with the timing and the shared-`.git` mechanism, not as proven causation; a worker restart handing back a fresh shallow clone is a second candidate and the two are not exclusive.

Either way the operational conclusion is the same and stronger than a one-time fix: **the clone's depth is a precondition that expires, so it is checked immediately before each history-reading run and never assumed from an earlier deepening** — and while another agent shares the `.git`, a local history check can be defeated between the deepening and the run. Five instances in one night.

## Impact

Three different instruments, one shape: each reported on a narrower thing than its name implied, and each failure presented as a *content* error rather than as missing coverage. This is the same shape as the gap recorded in DR-1452 the same day — `american-spelling.test.js` reads one corpus, `living-lessons-class.js:68`, so 34 British spellings in a course file passed green.

## Decision

1. **The guard chain is READ, never recalled.** Before any push, extract the chain from `ci.yml` for the job that gates the merge and run every entry, each by name with its own exit code. "Guards green" is not a report; a list of names and codes is. Every builder brief says so, and names the forty rather than a subset.
2. **A guard's exit code is only evidence if the guard RAN.** `MODULE_NOT_FOUND`, a missing script, a skipped step and a pre-existing failure are each distinct from a pass, and a report that collapses them is a false report. Root-level scripts are invoked from the repository root.
3. **A pre-existing failure is named and left alone — and the reason it fails must be the real one.** `one-teaching-one-lesson-guard.mjs` dies under plain `node` with `ERR_IMPORT_ATTRIBUTE_MISSING` (it imports `lesson-dates.json` without `with { type: 'json' }`) and **fails identically on `origin/main`**, so it is not a branch's defect. **CORRECTED: my first reading of this record said CI "runs a Node where it passes." It does not. CI runs that guard under `vite-node`, which resolves the JSON import, and that is why it is green there** — found by the sov78 builder reading the job definition instead of inferring from my wording. The guard is not broken; my invocation was, and attributing it to a Node version was the same sin as the rest of this record, a confident claim about an instrument I had not looked at properly. The honest local number is 39 of 40 with the fortieth named AND the reason it differs named correctly.
4. **Deepen before reasoning about history, and CHECK the depth every time.** Any judgment about what is merged — above all one that could justify a force-push — is made on a non-shallow clone, or not made. A shallow clone's ancestry answer is treated as UNKNOWN, never as NO (DR-0076 §8). `test -f .git/shallow` is checked immediately before the reasoning, never once per session: the precondition expires, and a check whose own precondition expired is the same defect this record is about. **While another agent holds a worktree on this `.git`, a local history check can be re-shallowed out from under it between the deepening and the run — so when it cannot be made to hold, the honest move is to say the local check is UNKNOWN and let CI's own clone be the gate (DR-0076 §2), not to report the shallow failure as a finding or the deepening as a pass.**
5. **NOT BUILT, and why.** The obvious instrument is a wrapper that reads the chain out of `ci.yml` and runs it. It is not built here because I would be adding a verification instrument on the same night I proved three times that I check instruments poorly, and an unproven wrapper over forty guards is a single new place for all forty to silently pass. It wants its own proven-to-catch pass. `re-review: 2026-11-20`.

## Verification

- The forty-script chain extracted from `ci.yml` by pattern and run: **39 exit 0**, the fortieth named above with its measurement on `origin/main`.
- `format-guard` from the root: failed by name on two files, `--fix` applied, re-run exit 0, sov77's suite 46 green after formatting.
- The shallow-clone table above: each cell measured before and after `git fetch --unshallow` on this clone, which now carries 2,963 commits.
- sov76 (`4cfea691afd`) and sov77 (`b17ba4c3a128`) both deployed green on their exact merge SHAs with the served app booting in a real browser, so none of this reached a reader.
- **Not measured, so not claimed:** whether the forty-entry extraction catches every guard CI runs in every job — it was taken from one job, `app — lint + guards`, and other jobs run their own checks. That is part of what the parked wrapper must prove.
