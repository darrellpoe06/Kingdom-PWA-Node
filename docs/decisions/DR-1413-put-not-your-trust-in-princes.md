# DR-1413: L300 — Put Not Your Trust In Princes: where hope belongs when the rulers disappoint

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (app/src/lib/living-lessons-class.js, living-lessons-dates.js)
**Sent in by:** Darrell — a FORWARD, not a spoken teaching: an election email, 2026-10-22, with one word above it: Lesson
**Pairs with:** DR-0312 (the Gmail lesson-intake Way), DR-0098, DR-0076, DR-0210, DR-0456, DR-0712

## Context

Darrell forwarded an NPR email into the app on 2026-10-22 and wrote one word over
it: **Lesson.** The email is substantially an advertisement for a news app built
around an election tab, and his standing rule is to ignore the ads unless they
relate to the lesson. One paragraph did: weariness with the cost of living and
with leadership in the capital, bickering that settles nothing, and the
conclusion that *something has to give.* That sentence is the occasion; the Word
is the content. **Placed in Living Lessons, NOT World Issues, deliberately:** that
course's method is verified claim-checking, and the forward's checkable claims
need polling and economic data this sandbox cannot reach, which DR-0076 forbids
asserting. So the claims are never repeated as fact, and the teaching rests only
on the Word, which IS on disk.

## What was measured

Adult prose 1,558 words (reader band 1,500-3,500). Shares 0.51 / 0.75 / 0.85 /
1.07 against floors 0.50 / 0.60 / 0.60 / 0.60. Ladder 2.22 / 4.58 / 5.84 / 11.60,
monotone, child under the 5.0 new-lesson ceiling. Differentiation worst 0.03
against a 0.50 ceiling. 42 verses from `app/public/bible/kjv`; **212 referenced
quoted spans, every one verbatim**; 0 unreferenced spans, 0 ellipses, 0 British
spellings in our prose. All five texts render movements 1..8 contiguous. 46 checks.
**PROVEN TO CATCH on the LIVE module, not a fixture:** planting the ASCII
apostrophe back into the child band's Proverbs 21:1 fired three independent gates
and named it — `(Proverbs 21:1) is not the verse`. Reverted; 46 green.

## Impact

One lesson, four bands, two invented parables, ten quiz questions, a 42-verse
gate. `living-lessons-class.js` 31,897 → the measured size, raised to the measured size
on the existing ratchet (DR-1339's lesson-content-out-of-JS re-review, 2026-11-19,
remains the answer to why lesson prose still lives in JavaScript).

## Decision

The teaching is **non-partisan by construction** (DR-0098), enforced by a gate
rather than a promise: no party, movement or candidate word in any string, no
`vote for/against`, no "other side". It teaches who seats and unseats rulers
(Daniel 2:21; Daniel 4:17; Psalms 75:7), why the warning measures breath rather
than blaming politicians (Psalms 146:3-4), what Israel actually did wrong
(1 Samuel 8:7), that prayer and honor are owed the office regardless
(1 Timothy 2:1-2; Romans 13:1; 1 Peter 2:17) — a second gate requires those duty
verses in EVERY text, so sovereignty can never read as disengagement — the single
boundary on obedience (Matthew 22:21; Acts 5:29), and where hope belongs instead
(Psalms 146:5; Jeremiah 17:7-8; Psalms 33:12).

**Five findings, each now machinery.** (1) **DR-0456 recurred:** the child band
shipped a RETYPED Proverbs 21:1 with an ASCII apostrophe where the corpus carries
U+2019, because that band predates the substitution helper; every span is now
filled FROM the corpus file, so a typed verse is impossible rather than
discouraged. (2) **A vacuous check:** the first verbatim sweep read
`quotedTexts()` pairs as if they were strings, checked NOTHING, and printed
"0 mismatches" — caught only because 5 spans for ~200 quotations is implausible.
A check that cannot fail is a lie (DR-0076 §3). (3) **Lost movement numbers
(DR-0712):** the adult lesson used `1.`-`8.`, which the formatter has no marker
for, and the bands lost numbers wherever a movement opened straight after a
citation with no full stop — both fixed, gated, proven-to-catch. (4) The spelling
scan's scope was too narrow; walking EVERY string found two more in `howToRun`
and the prompts. (5) My own repair script truncated heading TWO via an `A `
lookahead, caught by re-measurement — which is why headings are asserted as
exactly `[1..8]`.

## Verification after merge

46 checks green; the 10 catalog-wide band and quotation gates green (173 checks)
with no baseline debt added; file-budget guard green. Limits, stated: the
forward's own claims are NOT verified and are asserted nowhere; the parables are
invented people, not members; `derive-lesson-dates.mjs` cannot run in a shallow
clone, so the date was entered by hand as this day's other lessons were.
`re-review: 2026-11-24` — the teen→senior step is 5.8 grades against 1.3 and 1.3
below it; the ladder passes but is lumpy, and the fix belongs with the band-count
mechanism already dated.
