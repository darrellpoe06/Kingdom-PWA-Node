# DR-1031: The fixer restores capitals and never removes them — 186 of His capitals back, and the one question it will not answer for us

**Date:** 2026-10-15
**Status:** accepted
**Tier:** A (mechanical restoration of quoted Scripture, with the tool defect that would have made it a silent rewrite)
**Type:** orchestration
**Area:**
- `scripts/fix-quote-case.mjs` (pointed at the derived `QUOTED_SOURCES`; restricted to RAISING; every fix validated against the exactly-cited verse; a main-module guard)
- `app/src/__tests__/every-catalog-quotes-the-verse.test.js` (12 pins lowered, `succession-class.js` reaches zero and leaves the list)
- 11 catalog and library files: `made-in-time-course.js`, `scriptures.js`, `economics-class.js`, `world-issues-class.js`, `prophetic-voices.js`, `sovereign-ai-class.js`, `buying-terms-course.js`, `succession-class.js`, `broadcast-class.js`, `godhead-study.js`, `biblical-timeline.js`

**Amends:** DR-1030 (lowering twelve of the pins it set), and the scope of `fix-quote-case.mjs`.
**Grounds:** DR-0076 (measure, and never ship a claim the measurement does not carry), DR-0621 (a flag is where the work starts; work it until it works), DR-0075 (the dated re-review is a promise, and pulling it forward is allowed), DR-0210 (our voice only, never a blind sweep of His text), `feedback_surface_premise_conflicts`
**Declared by:** DR-1030's own `re-review: 2026-10-22`, run seven days early — and then corrected by what the dry run showed

## Concern

DR-1030 measured 403 quotation faults across 13 course catalogs and called 215 of them "front-case-only — mechanically repairable, `fix-quote-case.mjs` already exists". It set `re-review: 2026-10-22` to point that fixer at the derived file list and work them down.

That plan rested on a premise the dry run disproved: **that all 215 are one class, and that the existing fixer repairs it.** Neither half held.

## Evidence

Measured on `origin/main` at `e335894a9`, with `fix-quote-case.mjs` repointed from its own two-file `SCANNED` list to the `QUOTED_SOURCES` walk DR-1030 added.

### The fixer proposed 219 edits, and 33 of them went the wrong way

`fix-quote-case.mjs` flips the first character in **whichever direction makes the span match**:

```js
const flipped = (first === first.toUpperCase() ? first.toLowerCase() : first.toUpperCase()) + quoted.slice(1);
```

Split by direction:

| direction | count | in the 42 gated catalogs |
| --- | --- | --- |
| RAISE — restore a capital the writer lowered | **186** | 151 |
| LOWER — lowercase OUR opening capital | **33** | 22 |

The RAISE half is exactly the defect the file's own header describes: *"prose that quotes the cited verse EXACTLY except for the case of its opening letter, because the writer lowercased the verse's first word to fit it mid-sentence."* `"let there be light"` → `"Let there be light"`; `"the fear of man bringeth a snare"` → `"The fear of man bringeth a snare"`.

The LOWER half is a different thing wearing the same shape. It rewrites **our** opening capital to match a word sitting mid-verse:

- `"Ye shall know the truth, and the truth shall make you free"` → `"ye shall know the truth…"` (John 8:32 reads *"And ye shall know the truth"*)
- `"Rightly dividing the word of truth"` → `"rightly dividing…"` (2 Timothy 2:15)
- `"The field give I thee, and the cave that is therein"` → `"the field give I thee…"` (Genesis 23:11)

**That is a decision about how His words are presented where one of our sentences begins. It is not a verbatim correction, and it is not mine.** A tool whose header says it restores the verse's capitalisation should not be the thing that quietly removes 33 capitals across nine files.

### And the gate's code contradicts the gate's own header on exactly this point

`quoted-verse-is-the-verse.mjs` states: *"Case at the FRONT of a span is deliberately allowed: quoting 'consider your ways' inside our own sentence, or **capitalising a span that opens one**, changes no word of His."*

Its code does an exact substring test, so it reports both directions. Measured:

| span | verdict |
| --- | --- |
| `"pray without ceasing"` cited to 1 Thess 5:17 (His capital lowered) | `not-the-verse` |
| `"Pray without ceasing"` — as the verse writes it | ALLOWED |
| `"Rightly dividing the word of truth"` cited to 2 Tim 2:15 (our capital, mid-verse word) | `not-the-verse` |
| `"rightly dividing the word of truth"` — as the verse writes it | ALLOWED |

The second row is the behaviour the header says is allowed. **The documented intent and the implementation disagree**, and 70 faults now sit on that disagreement. Its test pins only the first row, so nothing was ever asserted about the second.

### The resolver reads two verses past the citation

`fix-quote-case.mjs` resolves `v1 … (v2 || v1) + 2`, so on its own it could make a span verbatim against the verse **next door** — the precise defect `quoted-verse-is-the-verse` exists to catch (L104's four spans of Haggai 1:7 cited to 1:5). Measured before trusting it: **218 of the 219** proposals were verbatim in their exactly-cited verse, and the 219th was a span my re-read could not parse. So the window was doing no harm in fact — but nothing was checking, and the window's purpose is not documented anywhere, so it is left alone and the exact check is what makes relying on it safe.

### What the restoration closed

| | before | after |
| --- | --- | --- |
| total gated faults | 392 | **247** |
| front-case | 215 | **70** (all now the LOWER direction) |
| order or punctuation | 100 | 99 |
| shouted | 57 | 57 |
| paraphrase or missing words | 17 | 17 |
| unresolvable | 4 | 4 |

145 gated faults closed, and 41 more restored in files the module gate does not read (`scriptures.js` 24, `world-issues-class.js` 9, `godhead-study.js`, `biblical-timeline.js`). `succession-class.js` reached **zero** and leaves the pin list.

`historical-research-course.js` is the clean illustration of what is left: it had 36 and still has 36, because **every one of its faults is the open question** — `"Searched the scriptures daily, whether those things were so"` against Acts 17:11's *"and searched the scriptures daily"*, and `"In order"` against Luke 1:3's *"in order"*. It was never in the mechanically-repairable set; DR-1030 counted it there, and that was the error.

## Decision

1. **`fix-quote-case.mjs` RAISES only.** It restores a capital the verse carries and never removes one. This makes the implementation match the paragraph that has always been at the top of the file.
2. **Every fix is validated against the exactly-cited verse** through `quoted-verse-is-the-verse`'s own resolver, so the `+2` window can never make a span verbatim against a neighbour.
3. **It reads `QUOTED_SOURCES`**, the derived walk, not a hand-kept list of two files.
4. **A main-module guard**, because importing the file used to run its whole walk and print a line per file — which is how this change's first validation run buried its own result under 1,132 lines of the fixer's output.
5. **Twelve pins lowered to what was measured**; `succession-class.js` removed at zero.

## What this deliberately did not do — and why that call is the Governor's

**Whether a quotation that opens one of our sentences may carry a capital the verse does not.** 70 faults turn on it, `historical-research-course.js`'s entire debt is it, and the two sides are a reasonable disagreement: the strict reading says the span should be the verse's own characters, so `"ye shall know the truth"`; ordinary English says a sentence starts with a capital.

**My recommendation, for the Governor:** teach the gate what its header already claims — allow the FIRST character of a span to be raised, and keep reporting a lowered capital. That closes 70 faults by correcting an instrument rather than by rewriting 70 quotations, it leaves our prose readable, and `shouted` already catches added capitals anywhere else in a span. I am not making that change here, because it loosens a gate on Scripture and the reasoning above is a doctrinal-presentation argument, not a measurement.

`re-review: 2026-10-22` — the open-capital question, with the recommendation above. Until it is settled the 70 stay pinned and visible.

`re-review: 2026-11-05` — unchanged from DR-1030: the 99 order-or-punctuation, 57 shouted, 17 paraphrase and 4 unresolvable faults, worst catalog first (`made-in-time-course.js` at 152). The paraphrases still matter most, because a paraphrase inside quotation marks is His words replaced with ours.

**Not claimed:** that the 186 restorations were each read by a person. They were validated mechanically — case-only difference, verbatim in the exactly-cited verse, raise direction only — and the gate re-measured after. That is the basis for trusting them, and it is a narrower basis than a human reading each one.

## Verification

- `every-catalog-quotes-the-verse.test.js`: **50 passing** on the lowered pins. The pins are exact in both directions, so a number set too low or too high is red — they were measured, then asserted.
- `fix-quote-case.mjs` is idempotent: a second run applies 0.
- Direction restriction proven by measurement, not assertion: the same tree proposed 219 before and 186 after, and the 33 excluded are listed above by verse.
- **Full suite: 1,532 files, 25,528 tests, zero failures.** Lint clean; the 20 guards PASS; `lesson-dates:check` 808 of 808.
- **A second instrument moved with it:** the curriculum gate's `verbatim` count went **55,854 → 56,012**, up 158, with `spans` unchanged at 56,295 and `recordedVerseDebt` unchanged at 472. That is not the module gate's 145 and should not be — the two walk different scopes (the curriculum gate reads 50 courses and 808 lessons; the module gate reads the 42 `*MODULES` catalogs, and 41 of these restorations landed in files it does not read at all). Both moved in the right direction by the right order of magnitude, which is what a second witness is for.
- **Re-run on the final tree after the record was written:** `decision-chain`, `every-catalog-quotes-the-verse`, `course-quotation-integrity`, `legibility-guard`, `resolve-ledger-conflicts`, `renumber-decision-record`, `review-watcher` and `quoted-verse-is-the-verse` — 8 files, **167 passing**. The full suite had been launched before this record existed, so its verdict on the ledger could have read either state; this is the run that actually covers it.
- `course-quotation-integrity`'s baseline needed no change this time: these are capitals inside spans, and the elided/recited buckets it pins did not move.
