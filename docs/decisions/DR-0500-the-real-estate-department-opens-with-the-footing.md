# DR-0500 — The Real Estate department opens with the footing

- **Status:** accepted
- **Tier:** B (a new department of the school, content the whole house reads)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/property-principle-course.js` (new, 8 lessons × 3 texts), `app/src/lib/learn-catalog.js` (the row that opens the department), `app/src/lib/course-band-coverage-baseline.json` (total 211 → 219), `app/src/__tests__/property-principle-course.test.js` (new, 36 checks), `app/src/__tests__/learn-crosslist.test.js` + `course-band-coverage.test.js` (pins moved to the measured values)
- **Principles:** WORD-FIRST (DR-0098), EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418 / DR-0498), VERIFICATION-DOCTRINE (DR-0076 §1 §3 §4), YAHWEH-IN-OUR-VOICE (DR-0210), NOTHING-WAITS (DR-0236)
- **Grounds:** DR-0149 (a course's `category` IS its department), DR-0497/DR-0498 (why a new course ships band-complete), DR-0459 (no elision inside a quotation)

## What he asked, and what was actually there

Darrell asked twice in the same minute: *"What happened to the Property Management Courses?"* and *"Real-Estate courses?"* — and then the wider question: *"Do we have all relevant courses where they make sense?"*

Measured before answering, across the whole catalog:

| | |
|---|---|
| courses | 23 |
| departments | 8 (A.I. The Way · Serve the House · The Word & The Way · Mathematics · Business · Development · Project Management · Kingdom Life & Stewardship) |
| real-estate courses | **0** |
| catalog text mentioning property, landlord, tenant, rental, lease, appraisal, mortgage, title, zoning, construction or maintenance | **none of the eleven terms appear at all** |

So the honest answer is not "it moved" or "it is partly there". **The department was never built.** It was a traced plan and a standing task, and every session since spent its hours on lessons and gates. This record is the start of the build rather than another trace of it.

## Why the first course is the footing and not a technique

A 22-course department that opened on cash-flow arithmetic would teach the trade without the frame, and the frame is the only reason this house teaches the trade. So course one is **Why Owned Property Is a Principle**, and it is one argument in eight moves:

1. **The land is His, and it was given by name** — *"The land shall not be sold for ever: for the land is mine; for ye are strangers and sojourners with me"* (Leviticus 25:23). He kept the title and handed out the use. Holding is real (divided by lot, by family name, Numbers 26:55; promised to Caleb by name, Joshua 14:9) and derivative. The frame cuts against absolute dominion AND against the piety that calls owning worldly.
2. **The landmark is a moral object** — boundary theft has its own commandment (Deuteronomy 19:14) because it is the theft that leaves no evidence of a theft. Proverbs 23:10 names the fields of the fatherless and verse 11 names who takes that case.
3. **Naboth's vineyard: the process was lawful, the act was murder** — the procedural centre of the whole department. A proclaimed fast, a public assembly, the high place, and the **two witnesses the law requires to protect an accused man**. Every step wore a form. Then: *"Hast thou killed, and also taken possession?"* (1 Kings 21:19) — He names the substance and ignores the wrapper.
4. **A sale was a lease of years** — the jubilee returns every family (Leviticus 25:10), so what changed hands was the harvests, priced by remaining term: *"According to the multitude of years thou shalt increase the price thereof"* (Leviticus 25:16). A cap rate, in older words, binding **both** sides.
5. **The deed, the witnesses, and the earthen vessel** — Jeremiah bought a field during a siege and Scripture spends its words on the closing: signed, sealed, witnessed, the money weighed (Jeremiah 32:10), two copies in clay *"that they may continue many days"*. The paperwork was the faith.
6. **The field before the house** — Proverbs 24:27's order, Luke 14:28's word *finish*, and Proverbs 27:23's duty to know the **state** of the flocks.
7. **The tenant is a neighbour, and the wage cannot wait** — same-day payment (Leviticus 19:13) because *"he is poor, and setteth his heart upon it"*, and James 5:4 files the withheld wage with the Lord of sabaoth. This is where the department's ceiling on profit is set: a deposit is a held trust, and a late fee that becomes income is feeding on the person least able to feed it.
8. **Handed forward, or handed to a fool** — the aim is the grandchildren (Proverbs 13:22), successor risk is named by Solomon himself (Ecclesiastes 2:18-19), and David's answer had two halves: materials made ready for a work he would never see, and a spoken charge carrying *"even my God"*.

Given → bounded → protected from power → time-limited → documented → costed → just → handed forward. The **Naboth test** is what a graduate carries: not *is this legal?* but *is a lawful step here doing the work a threat would otherwise do?*

## Measured, not asserted

**105 quoted spans**, every one fetched verbatim from the repo's own KJV and walked across the WHOLE module — not the reader texts only, because a misquotation hides in a quiz explanation as easily as in a band (the L178 lesson, DR-0496).

Two bands on every lesson from the first commit, so this course arrives with **zero** course-band debt:

| lesson | teen | senior | adult | teen share | senior share | teen~senior overlap |
|---|---|---|---|---|---|---|
| `prop1` | 2.2 | 8.5 | 6.9 | 0.75 | 0.88 | 0.00 |
| `prop2` | 2.2 | 8.6 | 6.5 | 0.67 | 0.80 | 0.00 |
| `prop3` | 2.5 | 8.1 | 6.8 | 0.61 | 0.67 | 0.00 |
| `prop4` | 2.9 | 8.9 | 7.5 | 0.87 | 0.71 | 0.00 |
| `prop5` | 2.3 | 9.3 | 7.9 | 0.65 | 0.73 | 0.00 |
| `prop6` | 1.7 | 8.6 | 7.5 | 0.81 | 0.75 | 0.00 |
| `prop7` | 3.2 | 8.4 | 8.7 | 0.83 | 0.77 | 0.00 |
| `prop8` | 3.6 | 7.9 | 7.7 | 0.70 | 0.81 | 0.00 |

**Two defects the measurement caught in this pass, before anyone read it.** Four teen bands came in at 0.45–0.56 of the adult text — under the 0.6 fullness floor — and `prop6`'s senior band measured 10.09, over the ceiling. The short bands were re-authored with the real application in the teen register (a deposit is not yours while you hold it; count the empty weeks in the renovation) rather than padded, and the senior band's long sentences were broken. Re-measured: every share now 0.61–0.88 and every senior band under 9.3.

**The department opened with no new machinery.** `learn-organize.js` derives departments from each course's `meta.category`, so `category: 'Real Estate'` is the whole shelf. That is checked live rather than assumed.

## Proven to catch

36 checks. The breaks: a quotation drifted by one word, a quotation hung on the wrong reference (21:18 for 21:19), *"the LORD"* drifting into our own prose while a real quotation carrying it is correctly NOT a fault, an inverted ladder, a summary against the fullness floor, a band identical to its sibling, and a lesson that lost a band or a quiz question. And the walk asserts it found more than 90 quotations, so a regex that silently stopped matching fails rather than passing empty.

**One check was wrong, not the lesson** — `/two witnesses/` missed the text's own capital at the start of its sentence. Corrected in the check, and named here rather than quietly fixed.

## What is still open, with its date

**This is one of twenty-two.** The department now exists with its footing in place; twenty-one courses remain, through management as stewardship. The next two are Property Management as Stewardship and Buying: Price, Terms and the Count to Finish, and they will ship the same way — band-complete, every quotation walked, one course per record. **re-review: 2026-09-25.**

**And the wider question is answered separately.** *"Do we have all relevant courses where they make sense?"* is a catalog-coverage question, not a Real Estate question; the measured census above is its starting data, and the gaps it shows are named in the reply rather than invented here.
