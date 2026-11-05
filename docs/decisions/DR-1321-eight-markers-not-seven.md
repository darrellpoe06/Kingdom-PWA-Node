# DR-1321: Eight markers, not seven — the conflict-marker guard was blind to a renumber, and DR-1185 has carried a broken title since #2372

**Date:** 2026-11-05
**Status:** Accepted
**Tier:** A (one regex in a ledger tool, one broken record repaired, five test cases; no product code, no schema, no money)
**Type:** defect
**Area:** `scripts/resolve-ledger-conflicts.mjs` (`MARKER_RE` widened to seven-or-more) · `docs/decisions/DR-1185-one-teaching-is-one-lesson.md` (conflict hunk resolved) · `app/src/__tests__/resolve-ledger-conflicts.test.js` (+5 cases, 26 total)
**Found by:** the ll278 builder (DR-1319), which reported in its own closing section that DR-1185 carried an unresolved conflict marker on `main`, said plainly it was not its own and did not touch it. The blindness underneath was measured here.
**Considered, not built:** none — this record builds no lesson and names no source thread.
**Pairs with:** DR-0644 (the resolver must refuse rather than fold), DR-1021 (the renumber tool, and nineteen renumbers in one week), DR-1185 (the record repaired), DR-1317 (whose rule DR-1185 defines), DR-0076 (§3 proven-to-catch, §4 measure don't claim)

## Context

`resolve-ledger-conflicts.mjs` exists so a conflict marker can never reach the ledger. Its own header says *"no merge-touched file may carry a conflict marker"*, and it has end-to-end cases proving it fails loudly on one.

It has been reporting `zero conflict markers` while one sat on `main`.

## What was measured

`MARKER_RE` was:

```js
const MARKER_RE = /^(<{7}|>{7}|\|{7})(?: |$)/;
```

Seven brackets **followed by a space or end of line**. git writes **eight** when it has to disambiguate a path, which is exactly what a rename produces (the example below is INDENTED by two spaces on purpose — the ledger-wide case added by this record reads every decision file, and it caught THIS record quoting the hunk unindented, which is the gate working):

```
  <<<<<<<< HEAD:docs/decisions/DR-1191-one-teaching-is-one-lesson.md
# DR-1191: One teaching is one lesson …
  ========
# DR-1185: One teaching is one lesson …
  >>>>>>>> origin/main:docs/decisions/DR-1185-one-teaching-is-one-lesson.md
```

Eight brackets parse as `<{7}` followed by `<`, which is neither a space nor end-of-line. **No match.** The guard was blind to the one conflict shape **this** ledger produces most often, because a DR renumber *is* a rename — DR-1021 recorded four in one incident and nineteen in a single week.

**The damage, measured on `main` at `c6e86c52f`:** exactly one file in the whole repository carried eight-character markers, and it is **`DR-1185-one-teaching-is-one-lesson.md`** — the record that defines *one teaching is one lesson*, the rule at the centre of DR-1317 and of every duplicate question asked tonight. Its **title line** has been a conflict hunk since #2372, showing both the DR-1191 and DR-1185 headings with markers around them.

Two things made it invisible: the guard could not see the markers, and the hunk is in the first five lines, so nothing downstream broke.

## Impact

**A gate that always passes is itself a lie (DR-0076 §3), and this one passed for the sweep-blind case while reporting success by name.** Every resolver run since #2372 printed `zero conflict markers` about a ledger that had one.

**The broken record is the worst possible one to have broken**, because it is cited as the authority whenever the lane asks whether two lessons are one teaching — which it was, repeatedly, in the hours before this was found.

**It was found by a builder reading carefully and reporting something that was not its own work**, rather than by any instrument. That is worth recording as the reason the finding exists at all.

## Decision

**1. `MARKER_RE` matches seven OR MORE** (`<{7,}|>{7,}|\|{7,}`), with the renumber case and the measurement written beside it so the reason survives.

**2. DR-1185's hunk is resolved** by keeping the heading that matches the file's own name — `# DR-1185:` — and discarding the DR-1191 variant and the three marker lines. Nothing else in the record is touched.

**3. A bare `========` is still legal Markdown** and is still not treated as a marker; the widened pattern does not change that.

## Verification

`app/src/__tests__/resolve-ledger-conflicts.test.js`, **26 cases green** (five new), run from inside `app/`.

**Proven to catch, by showing the old pattern blind:** one case holds the eight-character hunk and asserts the *previous* regex matched **nothing** in it, so the fix rests on a measurement rather than on my reading. Another asserts the new pattern finds lines 1 and 5 of that hunk, another that the ordinary seven-character hunk is still caught, and another that a bare `========` is still not a marker.

**A case reads the real ledger** — every `docs/decisions/*.md` — and fails naming any file that carries a marker at either width. It is green now and would have been red at any point in the last two weeks.

**Honest limit:** this fixes the detector and the one file that tripped it. It does not audit the rest of the repository for other markers git writes in shapes neither pattern anticipates (a diff3 `||||||||` of eight, for instance, is now covered; something else may not be). The ledger-wide case above is the standing check for `docs/decisions/`; nothing equivalent runs over `app/` or `scripts/`.

---
_Generated by [Claude Code](https://claude.ai/code)_
