# DR-0548 — The Stock Market department opens with what a share actually is

- **Status:** accepted
- **Date:** 2026-09-19
- **Type:** course
- **Relates to:** DR-0522 (Banking — the sibling course and the pattern this one follows), DR-0519 (the plain word beside the title), DR-0509 (teen + senior from the first commit), DR-0516 / DR-0540 (a course has one home and many shelves), DR-0098 (teach the Word, do not debate it), DR-0100 (state established fact plainly), DR-0076 (verification doctrine), DR-0459 (no ellipsis inside a quotation)

## What Darrell asked

> *"Stock Market courses to explore and explain the world of stock and bonds and countries that trade and how investment works world wide."*

Courses, plural, and a department this school did not have. Four were planned:

1. **Stocks: What You Actually Own When You Buy a Share** — shipped here.
2. **Bonds: Lending to Companies and to Countries.**
3. **The World Market: Countries That Trade, Currencies, and Why It Moves.**
4. **How Investing Actually Works: Risk, Time, and the Steward's Question.**

## Why this one is first, and why it replaces a picture

The Banking course opens by replacing the drawer — the belief that a deposit sits somewhere with your name on it. This one opens by replacing the chart. Ask almost anyone to imagine a stock and they imagine a line. A share is a piece of a company, and every confusion downstream grows out of forgetting that.

The arc, one argument in eight moves:

| # | Lesson | Anchor |
|---|---|---|
| 1 | A share is a piece of a company, not a number on a screen | Matthew 25:14 |
| 2 | When you buy a share, the company gets nothing | Luke 14:28 |
| 3 | Between "buy" and "owned" — what actually happens | Deuteronomy 25:13 |
| 4 | Price is not value | Proverbs 20:14 |
| 5 | How a share actually pays you — one visible way and one invisible | Matthew 25:16 |
| 6 | The index is a weighting CHOICE | Proverbs 11:1 |
| 7 | Who is on the other side of your trade | Proverbs 11:14 |
| 8 | The question the screen never asks | Matthew 25:19 |

**Lesson 2 is deliberately early.** "When I buy a share, the company gets my money" is the most widely held false belief on this subject, held confidently by people who have owned shares for thirty years. A reader who has it backwards cannot reason about what a share price is, or why a board watches it. So it is taught second, before anything is built on top — and the lesson then gives the four real reasons a board watches the price, none of which is the assumption.

**Lesson 6 is not a footnote.** "The market was up" is a sentence about an average, and an average is built by a weighting choice. Size-weighting lets a handful of giants carry the number on a day most constituents fell. Price-weighting — still used by one of the most quoted averages in the world — means a share split changes a company's influence while changing nothing about the business. That is a just-weight question in the plainest sense (Proverbs 11:1), and it is left untaught almost everywhere.

## The lines this course holds, and the gates that hold them

1. **Matthew 25 is NOT an endorsement of equity investing.** It is the spine of the course — three lessons return to it — and it is the single most abusable thing in the department. The course says so **out loud** in lessons 1 and 8 and in the tutor posture, and `stocks-course.test.js` REQUIRES the denial to be present, so a future edit that quietly drops it fails the build rather than leaving the strongest-looking claim unqualified. What the parable supplies is a frame: it was never yours, there is a reckoning, and burial was the condemned option.
2. **No live figure is quoted anywhere.** Prices, index levels and market sizes move daily; a number printed in a lesson is wrong by the time it is read, and a reader who catches one wrong number rightly distrusts the rest. The one dated rule the course states carries its date — **T+1 settlement, SEC Rule 15c6-1, effective 28 May 2024**, verified against sec.gov rather than recalled — and everything else is arithmetic labelled as an example.
3. **The frequent-trading finding is stated straight** (DR-0100): investors who trade frequently tend to do worse than investors who do not. Not hedged into "some research suggests", not inflated into "the market is rigged", and the mechanism is given — spreads and fees on every trade, acting on the crowd's feeling one beat late, and no cost at all for doing nothing — so nobody has to take it on authority. The test refuses both the hedge and the inflation.
4. **Both halves, in the same breath,** on buybacks and on share-based pay. Good at a low price, destructive at an inflated one; real alignment, real temptation. A course that gives one half has handed the reader a brochure or a grievance rather than a subject, and the lesson says that in those words.
5. **The third servant is never allowed to be remembered as having lost the money.** He preserved it perfectly — *"lo, there thou hast that is thine"* (Matthew 25:25) — and that was the failure. The course turns on it twice and quotes it rather than asserting it.
6. **No company, fund or product is named anywhere a reader can see.** A course that names one has become a recommendation whatever its disclaimer says.

## Verification

- **78 quoted spans, 78 verbatim, 0 faults**, re-fetched from this repository's own KJV by the course's own test rather than trusted from the author.
- **0 ellipsis inside any quotation** (DR-0459).
- Baselines re-measured through vitest, never estimated: course band coverage **317 → 325** (stocks contributes `adultOnly: 0` and `adultRegister: 0` — it carries teen and senior on every lesson from the first commit, so it adds no reader who cannot reach the words); course quotation integrity **505 → 513** with **every total unchanged**, because it contributes zero elided and zero recited spans; cross-list **42 → 43 courses, 654 → 662 lessons**.

## What the gates caught while it was being written

Recorded because it is the more useful half.

- **An ellipsis inside quotation marks in lesson 1's exercise prompt.** It was the author's own trailing-off prose, not Scripture — but DR-0459's check cannot tell the difference and should not have to. Rewritten without the quotation marks.
- **A guard that was measuring the wrong thing.** The first version of the no-shared-passage check used BOOK-AND-CHAPTER, copied from the Banking course, and it failed on Proverbs 11:1 and Proverbs 11:14. Book-and-chapter is the right proxy for a narrative chapter — Nehemiah 5 and Matthew 25 are each one continuous argument — and the wrong proxy for Proverbs, which is a collection of independent sayings sharing nothing but a chapter number. **The guard was corrected and the reasoning written into the test; the content was not bent to fit a guard that was measuring the wrong thing.** A second test then shows the judgement is sound rather than convenient: different verse, different subject, and neither lesson quotes the other's anchor.
- **A hard term used before its plain meaning** — `collateral`, in lesson 3, caught by the DR-0521 gate exactly as it caught the Banking course five times. The interesting part is what the fix could NOT be. Every cue on that term's list glosses collateral as security a **lender** may take from a borrower, which is the right gloss for the six lessons that already carry it and the WRONG gloss here, where the word names margin a **clearing house** holds against a member failing to settle — nobody's property, no lender, no borrower. Writing the lending gloss into the lesson to satisfy the matcher would have taught the reader something false, which is a worse outcome than the fault. So the lesson was rewritten to lead with the plain meaning (*"money has to be set aside against that possibility — money held by somebody in the middle, not usable for anything else"*), and the cue list was **broadened for a second sense of the word rather than a second phrasing of the first**. Measured before the edit across the whole live corpus: the two added cues silence exactly ONE fault, the new one, and leave the other six standing (105 → 104). That is the broadening the file permits, not the hollowing-out it forbids — each added cue is itself a plain explanation, and *held by somebody in the middle* is already the accepted gloss for `escrow` one line below. The reasoning is written into `plain-before-the-term.js` beside the change, not left in a commit nobody re-reads.
- **A harness that reported 78 faults that did not exist.** The span checker resolved the KJV path from `process.cwd()`, and running it from a different directory made every reference "not resolve". The content was unchanged. Worth recording as the mirror image of the usual failure: an instrument can lie in either direction, and a red result deserves the same scepticism as a green one.

## The honest remainder

- **Three courses of this department are not built.** Bonds, the world market, and how investing works are named above with their subjects; the department currently has one course in it. This is a first slice shipped whole, not a department completed. **re-review: 2026-10-03** — build course two (Bonds).
- **The course carries teen and senior, not four bands.** That is the DR-0509 contract every catalog course ships under, and it is the same label gap the whole catalog carries, tracked in the standing band-authoring pass. It is recorded in the measured baseline rather than left invisible.
