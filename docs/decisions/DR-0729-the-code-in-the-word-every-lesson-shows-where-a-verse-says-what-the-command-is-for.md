# DR-0729 — The code in the Word: every lesson shows where a verse says what the command is for

- **Status:** accepted
- **Tier:** A (a derived, read-only section on the lesson card; no data, no money, no new door)
- **Type:** feature
- **Date:** 2026-10-01
- **Scope:** `app/src/lib/word-codes.js` (new: finds the purpose clauses inside a lesson's quoted spans); `app/src/components/ChurchLearn.jsx` (the lesson card shows "The code in this lesson"; the printable curriculum carries it); `app/src/lib/feature-registry.json` (`card-codes`, DR-0726); `app/src/__tests__/word-codes.test.js` (new).
- **Principles:** WORD-FIRST, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, VERIFICATION-DOCTRINE (DR-0076), THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), DR-0098 (teach the Word), DR-0726 (registered controls).
- **Grounds:** Darrell, 2026-10-01, on Numbers 27:20 in L202: *"Yahweh wanted it public, before the priest and the whole congregation, so that everyone would know Joshua was the next leader. More importantly... so the children of Israel may be obedient... it's a code... find all these types of codes in all lessons including this one... make sense?"* and *"Leaders need to follow the code of conduct inside the Word..."*

## Context

L202 quotes Numbers 27:20 verbatim: *"And thou shalt put some of thine honour upon him, that all the congregation of the children of Israel may be obedient."* The command is the first half; the second half is the clause where Yahweh says what the command is for. Darrell named that clause a code and asked that every such code be found in every lesson. The lessons already carry their verses in one shape, `"quote" (Book c:v)`, which the verse gate checks word for word against the King James corpus (`scripts/quoted-verse-is-the-verse.mjs`). The code lives inside those spans.

## What was measured

- The shapes of a purpose clause in the King James text, read from the corpus: *that ... may / might / mayest / should* (Numbers 27:20; Matthew 5:16 *"that they may see your good works"*; Numbers 15:39; Habakkuk 2:2), *so that* (1 Kings 6:7), *to the end that / to the intent that*, and the warning form *lest* (Deuteronomy 4:9 *"lest thou forget"*; Proverbs 30:6).
- `codesAcross` over every lesson of every registered course (`buildCatalogCourseDescriptors()`), 2026-10-01: **593 lessons, 44,256 quoted spans, 1,026 distinct codes in 271 lessons.** A verse quoted in the full lesson and again in its four bands counts once (de-duplicated by reference and clause). Living Lessons carries most of them; Healthy Living and Sovereign A.I. carry the next most; nine courses carry none in their quoted verses.
- L202 yields Numbers 27:20's code exactly once across its full lesson and four bands.
- The finder is pure over strings (no DOM, no fetch, no corpus read), so the reader renders it and a test pins it; it reads only inside quoted spans with a reference, so a code is never lifted from our prose.

## Impact

Before, the purpose clause sat inside the quotation like any other words. Now every lesson card carries **The code in this lesson** under the frame *Leaders follow the code of conduct inside the Word: where a verse says what a command is for*, with each clause and its reference, or the plain line that none of the lesson's quoted verses carries one, so a reader learns to look for the clause. The printable curriculum carries the same list. The section is registered (`card-codes`), so it cannot vanish by accident.

## Decision

- `word-codes.js`: `codesInQuote`, `findCodes`, `codesForLesson` (full text, big idea, hands-on line and the four bands, de-duplicated), `codesAcross`, `codesSummary`, `CODE_FRAME`.
- The lesson card shows the section after *What this frees in you*, on every lesson, with the honest count; the share control carries the list where there is one.
- Nothing is paraphrased: each line is the clause as the lesson quotes it, with its reference; the verse gate already proves the span verbatim.

## Verification

- `word-codes.test.js` 8/8: Numbers 27:20 from the corpus yields its code; the four shapes are named; a verse with no clause yields none and "lest" alone is not a clause; only quoted spans with a reference are read; the summary for none, one, many; L202 carries Numbers 27:20 once; the catalog floors (≥ 590 lessons, ≥ 250 with codes, ≥ 900 codes); **proven to catch**: a lesson whose quote loses the clause loses the code.
- `feature-presence.test.jsx` finds `card-codes` on the lesson card; `ui-standards-set` unchanged (no new button).
- Not measured here: the section at Big Print on a 360 px phone. **re-review: 2026-10-08** against the chrome-layout probe and Darrell's own screen.
