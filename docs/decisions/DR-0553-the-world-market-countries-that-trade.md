# DR-0553 — The World Market: countries that trade

- **Status:** accepted
- **Date:** 2026-09-20
- **Type:** course
- **Relates to:** DR-0548 (the Stock Market department and its first course), DR-0549 (Bonds, course two, and the `re-review: 2026-10-04` this discharges early), DR-0098 (teach the Word, do not debate it), DR-0100 (state established fact plainly; under-claiming fails truth too), DR-0459 (no ellipsis inside a quotation), DR-0076 (verification doctrine), DR-0521 (the plain meaning comes first), DR-0509 (teen and senior from the first commit)

## Why this is course three

Darrell named the whole department in one sentence: *"Stock Market courses to explore and explain the world of stock and bonds and countries that trade and how investment works world wide."* Course one answered **stock**, course two answered **bonds**, and both were about an instrument held by a person. This one is about the **system those instruments sit inside**, and it answers the half of his sentence neither of the others touched: **countries that trade.**

| # | Lesson | Anchor |
|---|---|---|
| 1 | Why anybody trades across a border at all — corn in Egypt, none in Canaan | Genesis 42:2 |
| 2 | Currency — why one country's money has a price in another's | 1 Kings 10:22 |
| 3 | A trade deficit is not a debt | Ezekiel 27:33 |
| 4 | What still has to be dug, grown and shipped | Proverbs 31:14 |
| 5 | Who issues the money — what a central bank can and cannot do | Deuteronomy 8:17 |
| 6 | Reserves — why it reaches a person who never leaves their state | Isaiah 23:8 |
| 7 | When the pipes get closed | Revelation 18:11 |
| 8 | The just weight across a border | Leviticus 19:36 |

## The lesson this course exists for

**Lesson three.** "Trade deficit" is among the most confidently misused phrases in public life, and the confusion is not partisan — it is arithmetic. A trade deficit means a country bought more goods from abroad than it sold. Nobody is owed anything at the end of a year of one; no bill arrives; there is no lender. The word does the damage, because it is borrowed from budgeting, where a deficit really does mean somebody has lent and will require repayment, and the meaning travels with the word into a place it does not apply.

The money did not vanish either. It came back — as somebody abroad buying property, shares, government obligations, or simply holding the currency — **necessarily, in the same way that what leaves a room is somewhere.** And then the lesson hands the reader the question the word prevented them from asking: **what did the returning capital come back to DO?** Capital that builds productive capacity, capital that bids up existing housing for the people already living there, and capital lent to fund current spending are three different things that deserve a serious argument and almost never get one.

Stating that plainly is not taking a side on trade policy, and this course takes none. It is refusing to let a reader be moved by a word nobody ever taught them.

## The four other lines, each held by a test rather than a memory

1. **The theorem AND the town.** The reason two countries both gain by trading is real, is not controversial among people who have examined it, and is stated without hedging. **And** the losses are stated just as plainly: a gain spread thinly across a country and a loss concentrated in one town are not the same experience, the aggregate being positive is no comfort at all to the town, and a course that gives the theorem without the town has told half the truth. DR-0100 cuts both ways and the test refuses both halves of the omission.
2. **No side on any live case.** Lesson seven teaches sanctions and capital controls and names no country as a villain and none as a model. What it insists on is the element the coverage omits: **closing a pipe is never precise**, and the ordinary household sits on the same pipe as whoever was aimed at. The sentence that keeps this from being a both-sides shrug is pinned in the test — **a measure can be justified AND land where it was not aimed; both halves are true simultaneously** (DR-0098: name the question, teach past it, do not stage a fight for the reader to pick a side in).
3. **The central bank stays narrow, and both over-readings are refused.** It can set the rate it lends at, create money to buy government debt, and be the lender nobody else will be in a panic. **It cannot make anything** — it cannot grow a field of wheat, build a house, train a nurse or invent a machine. The lesson says in the same breath that both sides of the customary dispute overstate the case, and carries the honest qualification that keeps the narrowness from becoming a dismissal: the decisions are not neutral in their incidence.
4. **No live figure anywhere** — no exchange rate, no balance, no reserve total, no tariff schedule. Balances, reserves and rates move daily and a number printed in a lesson is wrong by the time it is read.

And it closes where the department's instruments all point: **Leviticus 19:35-36**, where Yahweh legislates the measure before anything built on it, names the measure and the *judgment* in one breath, and signs the rule with His name and His act. There is no clause limiting it to your own people. The course lands not on a lament about world trade but on the two things a reader can actually do — know where the weight is unchecked, and be a just weight in every measure they personally hold.

## Verification

- **57 quoted spans, 57 verbatim** against this repository's own KJV, re-fetched by the course's own test. **0 ellipsis inside any quotation.** 26 tests in the file.
- Baselines re-measured **through vitest against the real catalog**, not estimated: band coverage **333 → 341 across 38 courses** (world-market adds `adultOnly: 0`, `adultRegister: 0`); quotation integrity **521 → 529** with every total unchanged and zero elided, zero recited; stage-reaches-reader **521 → 529**, total still 0 and `courses` still the empty map; cross-list **44 → 45 courses, 670 → 678 lessons**.
- Cross-listed onto **Business** (the exchange-rate and shipping exposure every importer and exporter carries) and **Kingdom Life & Stewardship** (the just weight across a border, and the headline word).

## What the pre-flight and the gates caught

- **The assembly script renamed identifiers and left the prose behind.** This course was assembled from the Bonds script by string replacement, which changed `BONDS_*` to `WORLD_MARKET_*` everywhere and changed **nothing inside the strings**. The result carried `WORLD_MARKET_INTEREST_TAG = '[Bonds]'` — every request for help with a trade headline would have been routed silently into the bond course's inbox — and a `WORLD_MARKET_TUTOR_META.posture` consisting **entirely of the Bonds limits**: Deuteronomy 23:19-20, the yield curve, 2 Kings 4. A tutor holding those would have answered a question about a trade deficit with the law of usury. Caught by reading the assembled tail before running it. **Both are now guards** (`the interest tag is its OWN` and `the tutor posture is this course's own`), and both were shown to fail against the copied values before being accepted — proven-to-catch, not asserted (DR-0076 §3).
- **A quiz explanation that answered in four words.** Lesson three q4 explained "Necessarily" with *"It is arithmetic, not a tendency."* — 33 characters, which is the verdict repeated rather than the reason given. It now carries the reason: the goods were paid for in currency, that currency is a claim on the buying country and nothing else, and a claim nobody abroad wants for its own sake comes back. The sibling courses' 60-character floor found it.
- **The plain sentence the title carries was never actually said.** Lesson three had the whole substance — no creditor, no maturity date, nothing that can be called in — spread across a paragraph, and never once wrote *a trade deficit is not a debt*. A reader cannot repeat a paragraph. **A fact stated only by implication is stated weakly, and under-claiming a verified fact fails truth exactly as over-claiming an unverified one does (DR-0100).** The sentence is now in all four fields a reader can land on: big idea, adult lesson, teen band, senior band.
- **Two of my own test assertions were wrong about the content, and the content was right.** The lesson says *grow a field of wheat*, not *grow wheat*; it says *there is no "within your own borders"* rather than the phrasing I had reached for. Both regexes were corrected to what the text actually holds rather than the text bent to the test.

## The honest remainder

- **One course of this department remains unbuilt**: *How Investing Actually Works: Risk, Time, and the Steward's Question* — the fourth half of Darrell's sentence ("how investment works world wide"), and the one that has to hold the hardest line of all, since a course about investing is the easiest place in the catalog to drift into advice. **re-review: 2026-10-04** — build course four.
- **Teen and senior, not four bands** — the DR-0509 contract every catalog course ships under, recorded in the measured baseline rather than left invisible, and tracked in the standing band-authoring pass.
