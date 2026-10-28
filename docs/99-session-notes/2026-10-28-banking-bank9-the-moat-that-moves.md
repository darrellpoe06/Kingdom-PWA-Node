# 2026-10-28 — Banking bank9: the moat that moves

**Module id:** `bank9-the-moat-that-moves`
**Course:** Banking: What the Bank Does With Your Money (`app/src/lib/banking-course.js`) — lesson 9 of 9
**Record:** [DR-1277](../decisions/DR-1277-the-moat-that-moves-bank9.md)
**Source:** Gmail thread `1a1541f1da7acd58` — The Daily Upside of 19 October 2026, "Morgan Stanley's Makeover", forwarded by Darrell to himself with one word at the top of the body: **"Lessons"**.

## Why this lesson, and why it was not already there

Banking's eight lessons are one argument, and every one of them stands on the **customer's** side of the counter: what happens to the deposit, the rule on interest and the borrower it names, the nation at the end of the credit road, the signature, saving against hoarding, who pays the fee, the control that made an audit unnecessary, who actually holds it. Not one of them turns the page over and looks at the **bank's own income statement**.

The forward supplied that case in the bank's own favourite word. Its banking item is headed *Morgan's Moat*, and it reports a firm that spent eighteen years moving its income out of trading and dealmaking — which pay when deals close and pay nothing when they do not — and into a yearly charge on administered assets, collected whether anybody transacts or not.

The lesson says plainly that this is a real improvement **before** it questions anything, and then asks the only question Jesus asks about a house. The sentence the course gains is: **a steady income and a solid income are not the same thing.**

## The ground, chosen by measurement

The first two passages that came to mind — Proverbs 27:23-24 (*riches are not for ever*) and Luke 12 — are **already a sibling course's** in this department. The live sibling-chapter set holds 55 chapters, and it was computed from the mounted catalog before a verse was written rather than after. So bank9 stands on six chapters absent from every other course in Kingdom Life & Stewardship and from Banking's own eight: **Matthew 7:24-27** (the ground is the only variable; both men build and the weather is word for word identical), **Ecclesiastes 11:1, 2, 6** (the shape, with its own reason supplied), **Proverbs 23:4, 5** (insubstantiality, not wickedness), **Deuteronomy 8:17, 18** (the sentence said in the heart, and the correction that never calls the skill imaginary), **Psalms 62:10** (the increase allowed, the heart guarded), **Jeremiah 9:23, 24** (the strategy, the size, the result — and the one destination glorying may have).

Every span was read out of `app/public/bible/kjv/*.json` before it was written, never from memory.

## The two piles

| read back off the publisher's own page | still the newsletter's report |
|---|---|
| net new assets **were $232 billion** | the **$81 billion** a year earlier |
| net revenues of **$9.1 billion** | the **$5.8 billion** from stock trading |
| **compared with $8.2 billion** | **nearly 40 per cent** of the S&P 500 in ten holdings |
| **up 41%** | "more than double what analysts expected" |
| **$10.5 trillion** | the CFO's words in the item |
| **Ted Pick, Chairman and Chief Executive Officer** | |

Left column: Morgan Stanley's own third-quarter 2026 earnings release, read by a GitHub runner, 2026-10-28. Right column: absent from that release, carried as The Daily Upside's report and labelled as such in the adult text and in all four bands.

**And the labels are held apart from the figures.** The release prints `$9.1 billion` and `$10.5 trillion`; it does *not* print "client assets of $10.5 trillion" or "net new assets of $232 billion". So the numbers are the firm's; reading the $9.1 billion as wealth-management revenue and the $10.5 trillion as a pool of client assets is the newsletter's reading, and the lesson says so.

## The Ways finding (DR-0108)

The obvious handling was wm9's, from six hours earlier: *the figures arrived inside an email, and an email is not a page a runner can read a number back off* — add one to the third-pile gap, date a re-review. **That reasoning was wrong here**, for the same reason DR-1275 recorded the same day: it describes one agent's reach, not the team's.

This sandbox cannot reach `morganstanley.com` at all — the agent proxy answers 403 to the CONNECT — but a listed company publishes its own quarterly release, and a GitHub runner reaches it. `lesson-sources-witness.mjs` is keyed by lesson id, so widening it is DATA.

Three probe runs on a throwaway branch, and each found something reasoning would not have:

- **40776657937** — `/press-releases/3q-2026-earnings-results` is a **404**; the release is at `.../shareholder/3q2026.pdf`.
- **40777096354** — which figure strings the PDF really prints, and which it does not.
- **40777425081** — the **context** of each surviving figure, which turned five present strings into five defensible claims. A writer guessing would have shipped "net new assets **of** $232 billion"; the release says "net new assets **were** $232 billion".

`CHECKED_LESSONS` 2 → 3. `GAP` stays **12**: bank9 arrived with its disclosures and its source row in the same change, so it was never in the 12.

## Two pins that would have proved nothing

1. **The disclosure.** `nearly 40 percent` is in the teaching *and* in the disclosure, which is exactly DR-1275's `367,000` trap. The pinned phrase is **"nobody here opened"**, which occurs only inside the disclosure paragraph; the proof asserts the trap pin would still have passed on the stripped text.
2. **The figures — and this one was caught by breaking the real file.** A presence-only check stayed **green** when the child band's `$232 billion` was retyped `$233 billion`, because the correct figure also appears in that band's disclosure. The pin is now the **exact set** of money and percentage tokens each place may contain.

Proven to catch on the live file, four ways, each reverted and re-run green: the figure typo, a deleted disclosure terminator in the senior band, the teen friend line removed (names teen and only teen while the pooled check reads green), and a quotation's opening capital lowercased to fit a sentence.

## Measured

| | child | youth | teen | senior |
|---|---|---|---|---|
| share of adult prose | **0.54** | **0.61** | **0.68** | **0.77** |
| floor | 0.50 | 0.60 | 0.60 | 0.60 |
| reading grade | **2.4** | **6.4** | **7.9** | **10.7** |

Ladder strictly ascending, child under the 5.0 new-lesson ceiling. Worst band-pair overlap **0.14** against a 0.50 ceiling. Headings **1-14, contiguous from one**. Every band opens on the whole title and sends the reader all three ways in the lesson's own words, with the skill and the rhythm.

`allFour` **264 → 265** (total 439, adultOnly 0), regenerated by `scripts/course-band-baseline-write.mjs`. bank9 is the **first Banking lesson to carry all four bands**, so the banking row reads `{lessons: 9, allFour: 1}` and its four-band gap is **8 against a frozen ceiling of 8** — the ceiling now binds exactly, and the next Banking lesson carries all four or fails the build.

## Left open

The S&P 500 top-ten concentration has **no source row**, because no index document was opened for it and a 0-figure row would make the census count a figure nobody read. `re-review: 2026-11-28`, alongside wm9's: read it off S&P Dow Jones Indices' own factsheet from a runner, and either give bank9 a second row or say why in the note rather than widening the claim.
