# DR-0522 — Banking: What the Bank Does With Your Money

- **Status:** accepted
- **Date:** 2026-09-19
- **Type:** content
- **Relates to:** DR-0519 (the plain word beside the title — named in the same breath), DR-0521 (the plain meaning comes first — this course was the first thing that gate was pointed at)

## The ask

Darrell, 2026-09-19, four words:

> "Banking courses etc..."

He said it in the same breath as the plain-words work, and the two belong together: **a person looking for this course is thinking the word BANK, not the word stewardship.** Kingdom Economics existed and was unreachable by the word `money`. Banking did not exist at all.

## The arc, one argument in eight moves

1. **A deposit is not storage** — Genesis 41:35, 36, 48, 49, 56, 57
2. **Interest, and the borrower it names** — Exodus 22:25, 26, 27; Ezekiel 18:8, 13, 17; Psalms 15:5
3. **Nehemiah 5** — a whole nation at the end of the credit road
4. **Surety** — Proverbs 6:1, 2, 3, 4, 5; Proverbs 17:18
5. **Saving that is not hoarding** — Proverbs 21:20; Proverbs 30:24, 25; Proverbs 6:6, 7, 8
6. **Fees, and who actually pays** — Amos 8:4, 5, 6; Proverbs 28:8; Jeremiah 22:13
7. **The chest with a hole in the lid** — 2 Kings 12:9, 10, 11, 12, 15
8. **Who actually holds it** — 1 Timothy 6:17, 18, 19; Jeremiah 17:5, 7, 8

Find out what the institution does with the money → get the one rule Yahweh states first → watch a nation reach the end of that road → learn the single signature that ruins households → separate saving from hoarding → see who actually pays the fees → get a control system so sound nobody had to be audited → and end on the only question the statement never asks.

**Why lesson 3 is in the middle.** Lessons 1 and 2 are mechanism and rule, which a reader can hold at arm's length. Nehemiah 5 is what the rule exists to prevent, told by the people it happened to, in a chapter that opens with a **cry** — and against their **brethren**, during a building project, under a governor who was himself lending. The rest of the course reads differently afterwards.

## The four limits this course holds, and why each one is load-bearing

**Lesson 2 — Exodus 22:25 is not a theory of finance.** It names its borrower: *my people*, and *poor by thee*. Stretching it into a general doctrine of capital markets is how a true thing loses its authority; explaining it away is the opposite failure. The lesson names **both** out loud (DR-0098). And it teaches **Ezekiel 18 to verse 17, never stopping at 13** — the chapter has a door in it, and a man who inherited a book of this needs the door the same night.

**Lesson 5 — these texts commend preparation and do not define hoarding.** Inventing a doctrine to fill that silence is the failure this house refuses. So the course says only what all three stores show — the ant's is eaten, Joseph's was opened, the wise dwelling's oil is burned; **every commended store has a release in view** — and stops.

**Lesson 6 — the three tiers, run in the open (DR-0100).** Documented harm **stated plainly and not hedged**: the accounts holding the least pay the most in fees, and the products costing most per dollar are sold where there are fewest alternatives. The **specific national percentage refused**, because those figures circulate detached from the studies that produced them — the same discipline L179 applied to the subconscious figure. The **over-reach corrected**: this is not a teaching that all fees are theft, because a charge for real service is not the subject — and correcting it leaves every bit of the data underneath standing.

**Lesson 6 also turns the blade inward**, because a session that only accuses institutions does nothing in a room of employers, landlords and church officers: *a late fee that is a larger share of a small rent than a large one is the ephah made small*, and nobody had to lie to build it.

## Verification

**52 passages fetched verbatim** from the repo's own KJV before a word was written, zero missing. **236 quoted spans** walked across the whole course, not only the reader fields.

**No book-and-chapter is shared with any other course in its department** — checked against the **live mounted catalog** rather than a helper, so a sibling that gains a passage tomorrow is still caught.

## What this course's own gates caught while it was being written

Recorded because it is the more useful half of the record:

- **Lesson 1** lowercased the opening "And" of Genesis 41:49 in five places to make it fit a sentence. A quotation that changes a capital is not verbatim.
- **Lesson 4's big idea** carried Proverbs 6:1 and 6:2 as **one** quotation with both references trailing it — the **identical defect L179 shipped in draft the same evening**. I made the same mistake twice within the hour, which is the argument for the gate rather than against it.
- **Lesson 7 and lesson 8** each failed the our-voice check: lesson 7 never named Yahweh in the adult band, and lesson 8 rendered a clause of 1 Timothy 6:17 in our own prose in capitals instead of quoting it.
- **The DR-0521 plain-meaning gate failed this course eleven times** — `collateral` five, `surety` two, `ephah` four. Every one was fixed by **leading with the meaning, never by widening the rule**. Where a cue did prove too narrow, the broadening was checked against the corpus afterwards: it held at exactly 65 with `ephah` still at 3, so no existing debt slipped through.
- **Two assertions in this course's own test were written from intent rather than from the emitted text** and failed on correct content. Both were rewritten by reading the real wording. A check that fails on correct content is a check that will pass on wrong content.

## Gate

`app/src/__tests__/banking-course.test.js` — **23 checks.** Four break the gate on purpose, including on the two defects this course actually shipped in draft. The rest hold the four doctrinal limits by name, the DR-0509 shape, the sibling-chapter rule against the live catalog, registration in `LEARN_CATALOG`, reachability by the plain word `bank`, and conformance to DR-0521.

## Pins moved

`learn-crosslist` 37 → **38 courses**, 604 → **612 lessons** — a new course, so both numbers move.

## Follow-on

- The draft lived in `docs/drafts` while it was part-authored, because `learn-catalog-render.test.jsx` requires every course lib in `app/src/lib` to be registered — *built means surfaced* (DR-0065). It moved into the source tree in the commit that registered it, which is how that directory is meant to be used.
- **The care note routes a reader in trouble to lessons six and three first**, rather than to lesson five, because those two deal with what is happening to them rather than with what they should have done.
