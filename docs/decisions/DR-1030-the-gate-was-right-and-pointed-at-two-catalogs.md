# DR-1030: The gate was right and pointed at two catalogs — "every quotation is the verse it names" now reads all 42

**Date:** 2026-10-15
**Status:** accepted
**Tier:** A (coverage fix for an existing gate, plus the fifteen mechanical repairs it exposed on reader-facing surfaces)
**Type:** orchestration
**Area:**
- `scripts/quoted-sources.mjs` (new — the derived file list and the catalog list, with `everyCatalogExport()` reading the exports back off disk)
- `scripts/fix-quote-apostrophe.mjs` (new — the narrow repair the case fixer could not see, elided spans judged piece by piece)
- `app/src/__tests__/every-catalog-quotes-the-verse.test.js` (new — all 42 catalogs, each pinned to its measured number in both directions; the apostrophe class committed at zero)
- `app/src/lib/sovereign-ai-class.js` (12 quotations restored to the corpus apostrophe, on the lesson body, the big idea, the teen and senior bands, and a talking point read aloud)
- `app/src/lib/living-lessons-class.js`, `app/src/components/BusMinistry.jsx` (3 more, in authoring comments)
- `app/src/lib/course-quotation-integrity-baseline.json` (one elided span re-measured from undecidable to His words; see Verification)

**Amends:** DR-0545 (the scope of the quoted-verse gate), extending its reach without changing one line of the scanner it extends.
**Grounds:** DR-0076 (no claim without evidence; §3 proven-to-catch; §8 provenance), DR-0621 (a flag is where the work starts), DR-0075 (friction becomes a fix, or a why and a date), DR-0210 (our voice only, never a blind sweep of His text)
**Declared by:** the `re-review: 2026-10-21` set by DR-1027 — *"decide whether the straight-apostrophe class needs a mechanical guard at authoring time, since being forewarned demonstrably did not stop it"*

## Concern

Three lessons running — ll242, ll243, ll244 — shipped a straight ASCII apostrophe inside a quotation of Scripture where the KJV corpus carries `U+2019`. The third happened after I had written in the previous session's own record that this was the class to watch, and had said out loud that it was the risk. Prediction is not prevention, so DR-1027 asked whether a mechanical guard was needed at authoring time.

**The answer is no, and that is the finding.** The guard already existed. It was pointed at two files.

## Evidence

Everything below is measured on `origin/main` at `5ef382f39`, with the scanner this repository already owns and did not change. The shape is DR-0219's: what the instruments were built to do, what they were actually reading, and the gap named in numbers rather than in adjectives.

### SHOULD — what the instruments were built to do

`scripts/quoted-verse-is-the-verse.mjs` resolves a reference and compares the quotation to **that** verse, and its header commits it hard: *"ZERO IS THE COMMITTED NUMBER — no baseline… a baseline would be nothing but a place for the next defect to hide."* `scripts/fix-quote-case.mjs` mechanically repairs the sibling class, a span differing from its verse by the case of its opening letter alone.

### ARE — what they were actually reading

| instrument | scope as written | scope needed |
| --- | --- | --- |
| `quoted-verse-is-the-verse.test.js` | 2 catalogs (Living Lessons, Little Learners) | 42 |
| `scripture-provenance-audit.mjs` `SCANNED` | 2 files | the tree |

Measured on `origin/main` at `5ef382f39`: there are **42** course catalogs exporting `*MODULES` from `app/src/lib`. Pointed at all 42, the **same scanner, unchanged**, reports **403 faults in 13 catalogs** across 54,082 referenced spans:

| class | count | mechanical? |
| --- | --- | --- |
| our span lowercases a capital the verse carries (`"let there be light"`) | 215 | **yes** — `fix-quote-case.mjs` already does it |
| the words are His but the order or punctuation is not | 100 | needs a person |
| a word SHOUTED inside the quotation marks that His text does not shout | 57 | needs a person |
| a paraphrase inside quotation marks | 17 | needs a person |
| the straight apostrophe | 11 | **yes** — this change |
| a reference that does not resolve | 4 | needs a person |

Worst single catalog: `made-in-time-course.js`, **280**. The paraphrase class is the one that should sting — `"write the vision and make it plain, so the one who reads it may run"` stands inside quotation marks for Habakkuk 2:2, which reads *"Write the vision, and make it plain upon tables, that he may run that readeth it."*

**And the gate was never wrong about what it watched.** Living Lessons measured **241 modules, 43,054 spans, zero faults** — including ll243 and ll244, authored yesterday. Little Learners and Who He Is are clean too. The instrument was sound; its reach was a tenth of the surface.

### Why the apostrophe class in particular was invisible to BOTH tools

`fix-quote-case.mjs` normalises with `replace(/[‘’']/g, "'")` before comparing, and `scripture-provenance-audit.mjs` does the same. **They fold the two apostrophe forms together, so the difference disappears from their view by construction** — the same blindness as my own ad-hoc verification walk, which is why my walk could never have caught it either. Only an instrument that normalises everything *except* the apostrophe can see the class at all.

### The corpus settles this class, which is why it can be closed outright

Measured over `app/public/bible/kjv`: **1,997 apostrophes, every one `U+2019`, and zero ASCII `'`.** So inside a span quoted as Scripture a straight apostrophe is never the text — there is no verse to weigh it against and no human judgement to make. `"The earth is the LORD's"` is simply not what Psalm 24:1 says.

**Fifteen restorations applied**, twelve of them in `sovereign-ai-class.js` on surfaces a student reads (`lesson`, `bigIdea`, `levels.teen`, `levels.senior`, `talkingPoints[0]`) and three in authoring comments. Eleven of the twelve were faults the module gate counts, taking `sovereign-ai-class.js` from **36 to 25**.

**Our own voice is untouched, which is the DR-0210 bright line held in code.** On one line of `sov13` the repair changed `Pharaoh's` to `Pharaoh’s` inside the quotation of Genesis 47:20 and left our own `Joseph's` straight, in the same sentence. Verified after the fact: `class's` ×6, `Joseph's` ×21, `week's` ×25 still straight in our prose; `LORD’s` ×36, `Pharaoh’s` ×4, `Lamb’s` ×1 curly in His.

## Decision

1. **`scripts/quoted-sources.mjs` stops the list being hand-written.** `QUOTED_SOURCES` is **derived** by walking `app/src/lib` and `app/src/components`, so a new file is covered the day it lands. `CATALOGS` stays explicit because a module gate must import a named export — but `everyCatalogExport()` reads the export lines back off disk, and **the first test compares the two in both directions.** That test, not the list, is the close: a catalog written tomorrow turns the suite red until it is gated, and nobody has to remember.

2. **Every catalog is pinned to its measured number, in both directions.** 29 at zero; 13 carrying their debt in the open. A pin, not a ceiling: a *fixed* fault is red too, with a message naming the new number to write down — because a ceiling nobody lowers stops describing the building, and this entire record exists because a number nobody re-read ("two catalogs") stopped being true.

3. **The apostrophe class is committed at zero across all 42**, not baselined, justified in place by the corpus census (which is itself asserted, so a future corpus import that introduced a straight apostrophe fails *first* and the rule is revisited rather than silently misapplied).

4. **`fix-quote-apostrophe.mjs` is as narrow as its sibling.** A quotation is rewritten only when swapping its straight apostrophes — and changing nothing else, not a word, not a mark, not a capital — makes it carry the verse it names.

## What I got wrong on the way here, both caught before anything shipped

**I measured the first census against the wrong tree.** The checkout at `/home/user/Kingdom-PWA-Node` was sitting on `claude/a-dead-bell-says-so` at `b30f383a5`, not main, and I ran the 42-catalog census there before noticing. A span count that moved 5,129 → 5,351 under an apostrophe-only edit was the tell; an apostrophe cannot create 222 spans. Re-measured on `origin/main`: the **fault totals were identical** (403, same per-catalog breakdown, same classification), and only the module and span counts differed, because the stale branch simply predated ll242–244 and two sovereign weeks. The numbers in this record are the main-sourced ones, and the instruments were confirmed byte-identical between the two branches first, so the scanner was never the variable. No conclusion changed — but it was luck that none did, and a census is worth nothing if it cannot say which tree it read.

**The fixer's first cut skipped the one site that needed it most.** Its rule required the whole span to become a verbatim substring, so it declined `"And Joseph bought all the land of Egypt for Pharaoh... so the land became Pharaoh's"` (Genesis 47:20) — an **elided** span, where no whole-span test can ever match. The one elided apostrophe in the repository was the one the fixer passed over. **My own zero rule caught it**, failing 1 of 50 on the first run with that exact span quoted in the message; elided spans are now judged piece by piece. A fixer and a gate written in the same change caught each other, which is the only reason this is a footnote instead of a defect in the next lesson.

**And the pin proved itself in the improvement direction on real data, not a fixture.** Repairing the elided site took `sovereign-ai-class.js` to 25 while the pin still read 26, and the suite went red with *"25 faults, pinned at 26 — faults were FIXED; lower the pin to 25 so the ledger stays true."* I had designed that message; I did not plan to need it on the second run.

## Verification

- `every-catalog-quotes-the-verse.test.js`: **50 passing**, covering all 42 pins, the disk-vs-list invariant in both directions, the corpus census, and the zero apostrophe rule.
- **Proven to catch:** a miscited verse bent into a catalog pinned at zero (`banking-course.js`, 234 spans, 0 faults) is reported; one bent into a catalog already carrying debt is reported *on top of* its debt; a straight apostrophe inside a quotation is named by the scanner with no folding. Plus the two unplanned catches above, on live data.
- **Anti-theater:** the suite asserts >600 lessons and >50,000 spans actually scanned, so a broken import cannot make 42 pins pass on nothing.
- `fix-quote-apostrophe.mjs` is idempotent: a second run applies 0.
- Our-voice contractions re-counted after the sweep (above), so the repair is provably not a blind find-replace.
- **Full suite: 1,532 files, 25,528 tests.** The first full run went red on **two** tests, both mine, and both are the reason a full run happens before a push rather than after:
  - `course-quotation-integrity` pins its debt exactly, and restoring the elided Genesis 47:20 apostrophe moved that span out of **undecidable** and into **His words** — the instrument could not previously tell whose words they were, because a straight apostrophe matches no verse. Baseline re-measured through vitest rather than decremented by hand: scripture 793 → 794, undecidable 61 → 60, contiguousAvailable 763 → 764, `spans` unchanged at 889 and `lessonsElided` at 153, because the elision itself is untouched and still owed. **The debt did not shrink; one span got more honest about what it is.**
  - `decision-chain` found this record missing its `evidence` step, which it was — `sectionsOf` ends a section's body at the next heading of ANY level (its own doc comment says "same or higher", but the code does not), so `## Evidence` followed immediately by `### SHOULD` had an empty body and `chainOf` skips empty sections. A lead paragraph under the heading fixes it; all five slots now resolve, verified directly with `chainOf`.
- Re-verified after both repairs: the 10 test files that read the baseline, the chain, the ledger or the watcher — **250 passing** — and then the full suite again.
- The 20 guards PASS, including `business-systems-guard: ledger whole (newest DR-1030, pointer correct)`. `lesson-dates:check` 808 of 808. Lint clean (it covers `app/src`; the two new `scripts/` files are outside its scope, as the repo's config has it).
- **Independent corroboration of the repair count (DR-0076 §7):** the curriculum gate, a separate instrument with its own walk, moved `verbatim` **55,843 → 55,854** — up by exactly the **11** the module gate counted, with `spans` unchanged at 56,295 and `recordedVerseDebt` unchanged at 472.

**Observed but not touched:** `course-quotation-integrity-baseline.json` carries `measuredLessons: 605` while the walk now measures 652. The test does not assert that field, so it has drifted unnoticed; I am naming it rather than editing an unrelated number inside this change.

## What is NOT closed, and why

**392 faults remain, pinned in the open rather than fixed.** Deliberate: each of the four judgement classes needs a person to read the verse and choose the right contiguous span, which is exactly why `quotation-integrity` is a ratchet rather than a gate. Fixing them inside this change would have buried a coverage fix under several hundred prose edits in thirteen courses, and none of them is newly broken — they have been there as long as the gate has been pointed elsewhere.

**The 215 front-case faults are the obvious next change and are genuinely mechanical.** `fix-quote-case.mjs` already repairs that exact class and already applies the right narrow rule; it needs its `SCANNED` list replaced with `QUOTED_SOURCES`, and then its output read before it is applied. That is a change of its own with its own diff to review.

`re-review: 2026-10-22` — point `fix-quote-case.mjs` at `QUOTED_SOURCES`, run it, and work the 215 front-case faults down; lower every pin it moves.

`re-review: 2026-11-05` — the 178 judgement-class faults (100 order/punctuation, 57 shouted, 17 paraphrase, 4 unresolvable), worst catalog first: `made-in-time-course.js` at 280 total. The paraphrases are the ones that matter most, because a paraphrase inside quotation marks is His words replaced with ours.

**Not claimed:** that this is every quotation in the app. The gate reads module catalogs through `quotedTexts`; Scripture quoted in a JSX component's own markup is outside it, and the three comment-site repairs here were found by the source-level fixer rather than the gate. Whether the component tree needs the same treatment is unmeasured, and I am not asserting either way.
