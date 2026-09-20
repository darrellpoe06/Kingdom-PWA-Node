# DR-0549 — Bonds: lending to companies and to countries

- **Status:** accepted
- **Date:** 2026-09-20
- **Type:** course
- **Relates to:** DR-0548 (the Stock Market department and its first course), DR-0522 (Banking, which holds the same usury line on Exodus 22:25), DR-0098 (teach the Word, do not debate it), DR-0100 (state established fact plainly), DR-0459 (no ellipsis inside a quotation), DR-0076 (verification doctrine), DR-0521 (the plain meaning comes first)

## Why this is course two

Course one closed with a shareholder at the back of a queue — owed nothing, entitled to the residue, paid last — and deliberately left the other half of the question open. This course is that half. **A bondholder is paid FIRST and is owed a specific sum on a specific date.** Everything else about the two instruments follows from that single difference in position, and a great many people hold both without ever having had the difference put to them in one sentence.

| # | Lesson | Anchor |
|---|---|---|
| 1 | A bond is a loan with a receipt — a sum, a rate, a date | Psalms 37:21 |
| 2 | The promise is fixed, so the PRICE moves | Ecclesiastes 5:4 |
| 3 | Can they actually pay? — credit, and who decides | Proverbs 22:7 |
| 4 | How a country borrows — and why the currency is the whole question | Deuteronomy 28:12 |
| 5 | When a country cannot pay | 2 Kings 4:1 |
| 6 | The yield curve is a sentence about the future | Proverbs 27:12 |
| 7 | Inflation is the quiet default | Isaiah 1:22 |
| 8 | Usury, the brother and the stranger | Deuteronomy 23:19 |

**Lesson 2 cannot be skipped.** "If I am promised a fixed payment, why does the price change?" is the question that separates people who understand bonds from people who merely own them, and the answer is one mechanism: the promise cannot move, so the price is the only thing left that can. The lesson makes the reader do the arithmetic rather than accept the rule, and it lands on the distinction worth more than any figure in the department — **safety from default and stability of price are two different properties and they do not travel together.** One word, "safe", is routinely used for both, by people who are not lying and are not being clear either.

## The hardest line in the department

**Deuteronomy 23:19-20 is taught whole, both clauses, every time.** Verse 19 forbids lending upon usury to thy brother. Verse 20, in the very next breath, permits it to a stranger, restates the prohibition, and fastens a blessing to keeping it.

Quote only verse 19 and you have a general prohibition on interest the text does not give. Quote only verse 20 and you have an unbounded licence the same verse immediately limits. **Both are the same error — stopping where the stopping is convenient — and it is committed on every side of this argument, sincerely, usually without the person noticing.** The lesson names the error rather than committing it, says what the passage settles (a category defined by **relationship**: your brother is not a customer) and what it does not (no rate, no fund, no mortgage — pressing it into those services stretches a true thing until it no longer bears weight), and refuses the opposite failure too: explaining the rule away because it is awkward in a credit economy is the same abandonment in more respectable clothes.

## The other four lines, each held by a test rather than a memory

1. **The yield curve gets a STRONG pattern and a WEAK mechanism in the same hand.** An inversion has preceded most US recessions of the last half century — stated without hedging. It causes nothing, its timing varies enormously, and it has been wrong — stated too. The lesson says in capitals that *under-claiming a verified pattern is as much a failure of truth as over-claiming an unverified one*, and the test refuses both errors.
2. **Inflation is not turned into a conspiracy.** The lesson anticipates "so they are doing it on purpose" and refuses it in the text — not because intent never exists, but because it ends the reader's thinking, and the arithmetic works identically whether intended or not. Who gains is named plainly: **the borrower**, including the household with a long fixed mortgage.
3. **2 Kings 4 is never a cautionary tale about a spendthrift.** The text says the husband *feared the LORD*. And it is never a grievance either: Elisha neither denounces the creditor nor voids the debt, and the instruction has two halves in one sentence — *"Go, sell the oil, and pay thy debt, and live thou and thy children of the rest."* (2 Kings 4:7) A reader carrying only the first half has a hard doctrine; only the second, a sentimental one.
4. **No live figure anywhere** — no yield, no debt total, no rate, for the reason course one gives.

## Verification

- **63 quoted spans, 63 verbatim** against this repository's own KJV, re-fetched by the course's own test. **0 ellipsis inside any quotation.** 24 tests in the file.
- Baselines re-measured through vitest: band coverage **325 → 333** (bonds adds `adultOnly: 0`, `adultRegister: 0`); quotation integrity **513 → 521** with **every total unchanged** and zero elided, zero recited; stage-reaches-reader **513 → 521**, total still 0 and `courses` still the empty map; cross-list **43 → 44 courses, 662 → 670 lessons**.
- The test pins that the department now has **more than one course in it** — a department of one is a shelf with a grand name.

## What the gates caught

- **An ellipsis inside a quotation of Deuteronomy 23:20**, in lesson eight's quiz: `"...that the LORD thy God may bless thee..."` — clipped, in the one lesson whose entire subject is that people quote this passage in halves. Caught in the scratchpad pre-flight before a line reached the repository. It is now quoted whole, and the lesson says why it is quoted whole. **My own checker had also missed it**: I wrote the curly-ellipsis branch inside a Python raw string, so `…` matched the literal characters rather than the ellipsis. The repository's own gate uses a JavaScript regex literal and was never affected — but an instrument that reports zero because it is looking for the wrong thing is exactly the failure DR-0076 §3 names, and it happened to the instrument rather than the content this time.
- **`usury` used before its plain meaning** in lesson eight's big idea. The lesson body glossed it; the big idea, which is read first, did not. Fixed where the reader meets the word.
- **Three decision-record ids leaked onto reader-facing pages** — `(DR-0100)` twice and one more in prose. House machinery must never appear on a lesson page, and the quotation-integrity gate's "recites a decision record" check caught all three. The sentences now carry the reasoning in the reader's own language instead, which is better prose anyway.

## The honest remainder

- **Two courses of this department remain unbuilt**: *The World Market: Countries That Trade, Currencies, and Why It Moves*, and *How Investing Actually Works: Risk, Time, and the Steward's Question*. **re-review: 2026-10-04** — build course three.
- **Teen and senior, not four bands** — the DR-0509 contract every catalog course ships under, recorded in the measured baseline rather than left invisible, and tracked in the standing band-authoring pass.
