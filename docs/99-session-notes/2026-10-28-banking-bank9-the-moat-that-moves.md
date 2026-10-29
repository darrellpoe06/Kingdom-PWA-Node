# 2026-10-28 — Banking bank9: the moat that moves

**Module id:** `bank9-the-moat-that-moves`
**Course:** Banking: What the Bank Does With Your Money (`app/src/lib/banking-course.js`) — lesson 9 of 9
**Record:** [DR-1279](../decisions/DR-1279-the-moat-that-moves-bank9.md)
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

`allFour` **267 → 268** (total 442, adultOnly 0), read from a fresh `scripts/course-band-baseline-write.mjs` run on the MERGED catalog and never computed. FOUR lessons landed across 2026-10-28/29 and all four raise the figure — sov55 (DR-1273), dsi15 (DR-1278), sov56 (DR-1274) and bank9 — so each measured 264 → 265 on its own base, and the figure went 265 → 266 → 267 → 268 as each landed. bank9 is last in the queue, so 268 is the catalog that holds all four. Three of those four numbers were true of some real tree at some real moment, which is precisely why this is read from a script rather than reasoned about. bank9 is the **first Banking lesson to carry all four bands**, so the banking row reads `{lessons: 9, allFour: 1}` and its four-band gap is **8 against a frozen ceiling of 8** — the ceiling now binds exactly, and the next Banking lesson carries all four or fails the build.

## The fault this lesson shipped in draft, and it was the worst kind

The second story, **Two of Every Five Dollars**, went in as `kind: 'testimony'` and in the **first person** — *"I am sixty-one. For about eleven years I had been telling anybody who would sit still that I was diversified"* — about a man who **does not exist**. He was invented to illustrate a newsletter item.

`story-truth.js` renders a testimony with a footnote in words: *"A true story: this happened, told with the person's consent."* With no `source` it still says it, substituting "the person's" for a name. So the page would have told a reader that a real person lived that account and consented to its telling, while the data recorded neither who nor that they had. **The label was the lie, not the story.** That is fabrication under DR-0076, and `PARABLE-AND-TESTIMONY-METHOD.md` is explicit: a testimony requires that it actually happened, with explicit consent, or it stays out.

`a-true-story-names-whose-life-it-was` caught it. Its pin is the **88** shipped testimony blocks that name no source, measured on 2026-10-20 and allowed only to fall; this lesson would have made it **89**, and of the 52 already in the first person it would have been the 53rd. **The pin was not touched.** The fix was the label AND the prose:

1. `kind` is now `parable`, which claims nothing about a real life — that alone returns the count to 88 of 93.
2. The body is recast in the **third person** about a named, plainly illustrative figure, the way the first story already handles Marcus and his machining shop. Every sentence asserting biography is gone.
3. **It was not attributed to anybody to make it pass.** The five attributed testimonies in this repo are Darrell's own and are his to give; inventing a source would have been worse than the original fault.

Measured after the fix: **93 testimony blocks, 88 unattributed, 5 attributed** — exactly the recorded baseline, with none of them bank9's. Both of this lesson's stories are parables.

And the rule is now machinery rather than memory for this lesson: its own gate asserts both blocks are parables, that any testimony would need a non-empty `source`, and that neither body opens a sentence in the first person or asserts biography — with a proven-to-catch case showing the label alone is the whole difference.

**The eight testimony blocks in bank1 to bank8 are among the 88 and are pre-existing debt, not touched here.** Whether any of them is somebody's real account is not a machine's call and is Darrell's to answer (DR-0550); the list that reaches him is `docs/99-session-notes/2026-10-20-whose-life-is-this.md`.

## What CI caught that the author did not

`app/src/__tests__/arrivals-new-lessons.test.js` went red on the first full CI run, and it was a real finding rather than a nuisance. That file pinned **two lesson ids by name** — `sov46` and `pm13` — as its proof that the arrivals bell reads the real catalog rather than a fixture. `catalogArrivals` caps the list at `CATALOG_MAX = 20`, newest first, which is a deliberate bound: a bell that lists everything ever written is not a bell.

**Measured the day bank9 landed: 21 lessons now carry a day on or after 2026-10-19, so the cap drops exactly one — pm13, the oldest of the 21.** bank9 was the twenty-first, and the assertion failed for a lesson that had simply fallen out of the far end of a window doing its job. `sov46` sat at position 15 and was next.

A pin that must age out is a pin that will eventually block correct work, so the ids are now **derived from the same catalog**: the whole ordered head of the list is pinned against the real data, which catches a dropped lesson or a reordering that the two `toContain` checks could never see. The anti-fixture guarantee is kept and widened — the catalog must be genuinely large and the window genuinely full.

**And the derived form has one blind spot, measured rather than assumed.** The expected list slices at `CATALOG_MAX`, so it moves with the constant: changing the cap from 20 to 19 in `arrivals.js` left all four checks **green** (measured on the real file, then restored). A derivation cannot witness the number it derives from. So the cap's value is pinned as a literal beside it, re-broken, and confirmed red. That one figure stays hand-written on purpose.

## Left open

The S&P 500 top-ten concentration has **no source row**, because no index document was opened for it and a 0-figure row would make the census count a figure nobody read. `re-review: 2026-11-28`, alongside wm9's: read it off S&P Dow Jones Indices' own factsheet from a runner, and either give bank9 a second row or say why in the note rather than widening the claim.
