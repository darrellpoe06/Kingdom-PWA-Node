# DR-1553 — Know the state of thy flocks: sov91 from one word over an evals book excerpt

**Date:** 2026-11-18 · **Status:** accepted · **Tier:** A · **Area:** Sovereign A.I. week 91; the lesson lane
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS, DECISION-RECORDS
**Reserved:** `refs/heads/reserve/dr-1553` and `refs/heads/reserve/sov91` on origin (empty-value lease), before a word was written.

## Context

Darrell forwarded ByteByteGo's *Evals for AI Engineers* (sent 2026-11-18), an excerpt the newsletter says it ran with permission from the O'Reilly book by Shreya Shankar and Hamel Husain, the same day with **one word** above it: *Lesson*. Gmail thread `1a1ef8ba7f9e2432`. `lesson-already-built.mjs --thread` returned MAYBE on the source name only; a grep of the catalogs and `docs/decisions` for the gulfs, the cycle and both authors, and a read of the 69 open `claude/lesson-*` branches, found nothing (DR-0610). Week 90 (DR-1548) owns the second look; this week owns **evaluation** and does not re-teach it, which the test pins. A technology teaching, so a Sovereign A.I. week built by the course's generator route (`scripts/sov91-fill.mjs`, after sov90). The two sponsor blocks are left out.

## What was measured

| claim | tier | how |
| --- | --- | --- |
| The three gulfs, analyze-measure-improve, the email agent, the eight-in-a-hundred signature check | REPORTED, the book through the newsletter | `oreilly.com`, `arxiv.org`, `blog.bytebytego.com` gave HTTP 000 from this sandbox; named in our words, never double-quoted (quotes carry Scripture only) |
| A model can answer one request two ways; any model errs on some inputs at some rate | ESTABLISHED | stated plainly |
| Six days of `other: 6`; then quotation 4 of 7, verse 3, voice 1, three crashed | MEASURED | `docs/decisions/DR-1551-which-problem-not-only-which-gate.md:13-15` |
| The reader of the builder's records never prints a body or a prompt | MEASURED | `infra/nas-lesson-builder/why_the_builds_failed.py:5,19` |
| Four of seven died on `span-without-reference` | MEASURED | `DR-1552-name-the-span-do-not-only-count-it.md:14`; `infra/nas-loops/lesson-queue-census.py:313` |
| The rule was already in the prompt; earlier failures are fed back | MEASURED | `infra/nas-lesson-builder/lesson_writer.py:85-87`; `lesson_builder.py:814` |
| The feedback was a count; the gate now names up to five spans | MEASURED | `infra/nas-lesson-builder/lesson_gates.py:271-274` |
| The checker checked: the `findall` tuple bug and the `PROBLEM_KINDS` drift case | MEASURED | `test_lesson_builder.py:2161`; `infra/nas-loops/test_lesson_queue_census.py:1646` |
| No verse in this week asked of a model | MEASURED | `scripts/sov91-fill.mjs` fills every `[[ref]]` from `app/public/bible/kjv` |
| Whether naming the span lowers the builder's failure rate | NOT MEASURED | the seven rows were past their attempt budget; only later teachings can show it |

Bands written by hand (DR-1306). The first build fell short on youth and teen shares and teen read above its ceiling (6.97); teen was rewritten in shorter sentences and both were extended with teaching, then teen was weighted back above youth. Landed: adult 2,125 prose words; shares 0.556 / 0.613 / 0.636 / 0.697; FK 2.14 < 4.52 < 4.88 < 9.80; worst overlap under 0.09. 20 anchor references, every one generator-filled from the corpus.

## Impact

Word first on Proverbs 27:23 (know the state of thy flocks: go and look) and Lamentations 3:40 (search, try, turn: the cycle in three verbs), quoted before the book's material in all five teaching places. Then Nehemiah 2:15, 2:17 and Proverbs 18:13 (inspect before you build; comprehension); Habakkuk 2:2 and 1 Corinthians 14:8 (specification); James 3:2 (generalization); Luke 12:48 (heavier checking where users cannot catch mistakes); Proverbs 11:1 and Daniel 5:27 (the honest count). Closes on Hebrews 4:15 and 13:8 with John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17: Jesus, the Lamb of Yahweh and the Eternal Son, in whom intent and act never parted. The house section turns the book on the one LLM application this house runs daily, the NAS lesson builder, from its own records. Course-band baseline 315 → 316; `sovereign-ai-class.js` ceiling 14623 → 14812.

## Decision

1. sov91 is placed in **Sovereign A.I.** (week 91): a household that runs its own models must be able to tell whether they do what it meant.
2. The book's terms and examples stay **the newsletter's report**, attributed and paraphrased; no line of the excerpt is quoted, because double quotes on these pages carry Scripture only.
3. The house section diagnoses the builder's four-of-seven as **leaning generalization** (the rule was given, with feedback) plus **our own feedback gap** (a count, not a place). Whether the quotation rule itself is right stays Darrell's, as DR-1552 left it. `re-review: 2026-11-25`, matching DR-1551/1552: read the census for teachings built after the named-span change and say whether `span-without-reference` fell.

## Verification

`app/src/__tests__/sovereign-ai-sov91-verses.test.js` (25 cases): the shared Living Lesson gate's pure checks (`helpers/living-lesson-gate.js`) all empty on this week; anchor exact both ways; frame before the gulfs in every teaching place; all three gulfs and the cycle in every place; week 90's material absent; the tiers and the dated re-review in every teaching place; every house claim read back from its file; **proven-to-catch** for an altered quoted word, a bare-quoted book line, the generic name in our voice and a capitalised adversary. Run with the course, verse-sweep, coverage and ledger suites; results in the commit body.
