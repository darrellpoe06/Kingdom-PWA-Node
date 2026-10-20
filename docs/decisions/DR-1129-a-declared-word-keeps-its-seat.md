# DR-1129: A declared word keeps its seat in the window the product uses — and the guarantee is about the window, not the tier

**Date:** 2026-10-20
**Status:** accepted
**Tier:** B (product search ranking — what every reader sees when they type a word; no schema, no money, no lesson text)
**Type:** way

**Area:** `app/src/lib/learn-organize.js` (modified) and `app/src/__tests__/a-declared-word-keeps-its-seat.test.js` (new).

**Grounds:** Found by a gate, on a real PR. #2166 — the L79 lesson Darrell released today with *"Don't hold it finish it!!!!!!"* — went red on exactly **one** test of 6,310: `course-plain-words.test.js`, *"the ranking debt is COUNTED, not hidden"*, reporting `kingdom-economics: work: expected 1 to be less than or equal to 0`.

**Principles:** DR-1049 (the fix this corrects, and whose claim this record disproves); DR-0076 §4 (measure, don't claim) and §3 (proven-to-catch); DR-0519 (the simple word beside the title — connection, never rename); DR-0075 (a re-review date is a promise, and closing one on an unproven claim is worse than deferring it).

## Context

`course-plain-words.test.js` holds a ratchet at **zero**: every word a course declares in the plain-word registry must reach *that* course inside the 40-row window the product actually passes. The ratchet's own words forbid the easy exit, and DR-1049 quotes them: *"RAISING it is the edit this assertion exists to make impossible to do quietly… the honest move is to fix the finder, never the ceiling."*

**This is the third time that gate has gone red on catalog growth, and the second time a fix was declared growth-proof.**

| when | what died | what was claimed |
|---|---|---|
| before DR-1049 | **`work`** — recorded in the test's own comment with `re-review: 2026-11-09` | *"it needs the plain-word connection to carry weight of its own"* |
| DR-1049, part 1 | `prophetic-voices: government` | a declared word gets its own rank tier — debt 75 → 47 |
| DR-1049, part 2 | `ai-legal-blueprint: privacy` | the tier is dealt round-robin by course, so every declarer is reachable *"within N rows… **whatever the catalog grows to**"* — debt 47 → 0, and the `2026-11-09` re-review declared **"answered rather than deferred"** |
| today, #2166 | **`kingdom-economics: work`** | — |

**The word that broke is the word the re-review was originally recorded for.** DR-1049 closed that date on a claim of catalog-independence, and six days later the original case failed.

## What was measured

Measured 2026-10-20 with `npx vite-node` — bare `node` dies on `ERR_IMPORT_ATTRIBUTE_MISSING` for `lesson-dates.json`, which is how CI invokes it and how I first got it wrong.

**It is not main's defect.** `course-plain-words.test.js` on a tree at main `36943d755`: **23 passed (23)**. On #2166: **1 failed**. So #2166's lessons crossed a threshold rather than creating one.

| | `work` | `money` |
|---|---|---|
| total rows the search returns | 466 | 455 |
| `kingdom-economics` first appears at | **41** | 27 |
| rows before it | 40, from **17 distinct courses** | 26, from **17 distinct courses** |
| courses that *declare* the word | **7** | 18 |

The window is 40. `kingdom-economics` is at **41 — outside by one row.**

**Where DR-1049's claim fails.** `searchLessons` ranks in four tiers: title (4) › anchor-reference (3) › declared plain word (2) › body (1). The round-robin deals *inside tier 2*, so a declarer is reachable within N rows **of the tier's start** — not of the window. Tiers 4 and 3 grow with the catalog like any others. For `work`, N = 7, but ~34 rows of title matches from **10 courses that never declared it** sit above the tier, so the 7th declarer lands at 41. The same 17 courses precede `kingdom-economics` for `money`, which survives only because its declarer happens to fall at 27. **Growth decided which promise held — the very thing the round-robin was built to stop.**

## Decision

**Reserve the seat the registry promises, measured against the window rather than the tier.**

After scoring and the existing round-robin, every course with a plain-tier row for the query is guaranteed **one row inside `limit`**: if absent, its best plain row takes the place of the lowest-ranked row in the window (the last, since `scored` is already in rank order). Three properties, each with a case:

- **Nothing a reader sees is reordered.** Titles still lead, anchor references still outrank the plain tier, body hits still rank last. Only the tail of a *full* window changes.
- **A seat never displaces another declarer's only row** — that would trade one broken promise for another. The walk skips such rows.
- **It is a no-op below the window.** When everything already fits, the result is byte-identical.

**The honest bound, stated rather than overclaimed.** This guarantee holds **iff the number of courses declaring a word is ≤ the window**. Measured today the maximum is **18** (`money`) against a window of 40, so there is headroom for 22 more. It is *not* true "whatever the catalog grows to" — that is the exact phrasing this record exists to correct, and repeating it in a new form would earn the same failure in a month. **`re-review: 2026-11-20`** — re-measure the maximum declarer count against the window, and whether any declared connection has died again.

## Impact

**What this buys.** A plain-word connection becomes a promise the product keeps at any catalog size within the stated bound, instead of one that growth decides. DR-0519's design — *titles untouched, the everyday word rides alongside* — survives lessons being added, which is the one thing this repo does constantly.

**What this does not do.**

- **It changes no lesson, no registry entry and no title.** DR-1049 recorded that no registry entry had to be withdrawn to reach zero; none is withdrawn here either.
- **It does not widen #2166.** That PR is 40 files of lesson work; this is product search ranking and belongs in its own record with its own review. Once this is on main, **#2166 goes green with no change to that branch** — proved below.
- **It does not raise the ceiling**, for the reason the ratchet gives in its own words.
- **It cannot help a word declared by more courses than the window holds.** Named above with its re-review rather than left to be discovered.

## Verification

`app/src/__tests__/a-declared-word-keeps-its-seat.test.js`, **8 cases**, green.

**The fixture is structural, not #2166's content.** A test that needed that branch's lessons to fail would stop meaning anything the moment they merged — the same expiring-evidence defect DR-1025 found when filling L79 disarmed three checks keyed on an open gap. So the cases build the *condition*: flooding courses carrying the word in every lesson title and declaring nothing, against real registry keys that declare it. One case asserts the flood really fills the window, so the others cannot pass vacuously.

**Proven to catch, two ways:**

| what was done | what went red |
| --- | --- |
| the seat removed (`if (false)`) | **2** — naming the condition: *"kingdom-economics declared "work" and must be reachable in 40 rows: expected [ 'flood-0', … ] to include 'kingdom-economics'"*, and all seven declarers missing |
| the rule widened past the ledger index (an earlier draft) | the real-catalog walk stays green on main, which is why the structural fixture exists at all |

**And proved end to end on the PR it unblocks:** the fix copied onto #2166's own tree turns `course-plain-words.test.js` from `1 failed` to **23 passed (23)**. That copy was reverted — the fix ships here, not smuggled into a lesson PR.

**A fixture error of mine, which is a case in its own right.** My first version invented course keys `c1`–`c7` and set `meta.plainWords`. `learn-organize.js` resolves a declared word with `plainWordsFor(c.key)` — the registry keyed by course key — so those courses declared **nothing**, the plain tier was empty, and the seat logic never executed. **Two cases still went green**, because the other keys I used (`kingdom-economics`, `project-management`, `living-lessons`) are real registry entries that really do declare `work`. A fixture that declares nothing proves nothing and looks identical to one that works; the file now says so where the keys are defined.

Also recorded because it recurred three times today: a green reading that meant *"did nothing"* rather than *"passed"* — the curriculum CLI with no flag (exit 0, no output), a `pull_request` CI run parked at `action_required` (reported as a non-success with zero jobs), and this fixture. **An exit code with no work behind it is not a pass.**
