# DR-1192: The purse opens after the wall falls — sov47, and a lesson's spine chosen by measurement rather than by theme

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (one lesson added to an existing course, all four age bands from its first commit; one verse test; one baseline regenerated in its permitted direction)
**Type:** curriculum
**Area:**
- `app/src/lib/sovereign-ai-class.js` (sov47, the forty-seventh week of Sovereign A.I.)
- `app/src/__tests__/sovereign-ai-sov47-verses.test.js` (8 cases, 3 proven to catch)
- `app/src/lib/course-band-coverage-baseline.json` and `app/src/__tests__/course-band-coverage.test.js` (the debt pin moves 252 → 253)

**Grounds:** Darrell forwarded IT Brew's "Downtime is money" into the app on 2026-10-21 at 16:52 UTC with one word above it: "Lesson" (Gmail thread `1a15f615725825be`). The standing Way for a forwarded newsletter (DR-0312) is to build it, Word-first, or to report a comparison if the teaching already exists. The thread id is recorded here so this record is a second witness to the capture if the `Lesson-Captured` label is ever missed — the search is a hint, the label is the lock, and the ledger is the witness to both.
**Principles:** DR-0610 / DR-1185 (one teaching, one lesson — checked before writing, not after); DR-0076 §4 (measure, never claim); DR-0100 (three tiers — state established fact plainly, flag only what is genuinely open); DR-0210 and DR-0076 (Yahweh in our voice, quoted Scripture untouched); DR-0331 (a third party's words rendered as they stand)

## Context

The article offers, in its own subtitle, to teach "How IT pros can turn an outage into a request for more funding and resources." Then it quotes a named practitioner saying something more honest than its own advice — that the money for prevention arrives only after the thing you were preventing has happened, and that he wishes it were not so.

That is a statement about the human will, and it is the kind of sentence this course exists to put under the Word. But the course is forty-six weeks old, and the obvious lesson from that article had already been taught. **So the question that had to be answered before a word was written was not "what does the Word say about this" but "has this house already said it".**

## What was measured

**The overlap, first, in `sovereign-ai-class.js`.** Two of the article's three seams were already held:

- *fund prevention only after the crash* → **sov38** ("AI Lowered the Cost of Building, Not the Cost of Owning", anchored on Luke 14:28-30 and Matthew 7:24-27) and **sov34** ("count the cost before you build").
- *the alarm that cries wolf* → **sov33** ("Peace, peace; when there is no peace … what Yahweh says a faithful witness is for").

Both of those were themselves built from a newsletter Darrell forwarded with one word on it, so the pattern that produced them would have produced a near-duplicate here. Written the obvious way, this lesson would have landed on Luke 14:28 and Matthew 7:24 in the same course — which is precisely the pair that **DR-1185**'s rule flags (same course, same title opening, ten or more shared verses), shipped the same morning.

**Then the free ground, counted rather than guessed.** Occurrences in that file before this lesson: `alert fatigue` **0**, `piggy bank` **0**, `after a crisis` **0**, `slothfulness` **0**, `droppeth` **0**, `Proverbs 24:30` **0**, `Proverbs 24:31` **0**, `Proverbs 24:34` **0**, `Nehemiah 2:17` **0** — while `Isaiah 58:12` (2), `Proverbs 26:11` (12), `Proverbs 22:3`, `Proverbs 27:12`, `Luke 14:28` and `Matthew 7:24` were all already worked. `outage` appeared 20 times and `downtime` 10, but in other framings.

So the untaught ground is **deferred maintenance** and **the will that only pays after the loss**, and the spine is **Ecclesiastes 10:18 + Proverbs 24:30-34 + Nehemiah 2:17** — which is also, not coincidentally, the precise mechanism the article describes: a wall nobody broke, down from "a little sleep, a little slumber", until want arrives "as an armed man", and only then the purse opens.

**A number collision, caught by importing rather than grepping.** The first splice created a **second sov43**. A grep had reported the highest week as sov42 because it matched only the `id: 'sovNN` style and this file uses **both** that and `id: "sovNN` — so sov43 through sov46 were invisible to it. Importing the module and enumerating every number found the duplicate immediately. The lesson is sov47, and the splice script now refuses a duplicate **number** rather than only a duplicate slug. This is the same defect class as the DR-1184 and DR-1185 ledger collisions earlier the same day: a pattern that did not cover the whole file.

## Impact

- The forty-seventh week of Sovereign A.I. teaches deferred maintenance and the false alarm from the Word, on ground no other week in the course holds.
- It refuses the article's trade explicitly: an outage that keeps paying for itself is a toll, not a thing anyone is preventing.
- It teaches the half the industry gets backwards. When alerts outnumber the people who can read them the instinct is a quieter alarm, and **Ezekiel 33:6 charges the watchman who goes silent** — so the remedy available to us is a truer trumpet, never a quieter one.
- Two worked examples come from inside this repository rather than borrowed: the nine stale hours of 2026-07-06 (DR-0107), and an incident ledger that carried "no Pages Function is running" from a verdict written on 2026-10-15 until the same workflow, on the twenty-first, found all ten roads answering on a body byte-identical to the one it had condemned (DR-1188).
- The band debt moves in the only direction it may: total 426 → 427, `allFour` 252 → 253, `adultOnly` unchanged at 0.

## Decision

**sov47 ships on the measured-free spine, and its verse test pins the three things that nearly went wrong.**

- Fifteen verses, every one fetched from `app/public/bible/kjv` and pinned against it; **78 quoted spans verified verbatim** across the lesson, the four bands, `bigIdea`, `inApp`, the anchor theme, the `rpe` block, the benefits, the facilitator notes and every quiz explanation — not only the prose a reader scrolls.
- **The curly apostrophe is pinned.** Drafting put `watchman's hand` where the corpus has `watchman’s hand` — three times, in three different files. A straight apostrophe inside a quoted verse is not a typo; it is an un-verbatim Scripture quote.
- **The DR-0210 bright line is pinned per field:** `God` and `the LORD` appear **zero** times in our own prose and only inside quotations, where the KJV's wording is left exactly as written; `Yahweh` is what our voice says.
- Every straight apostrophe that remains is inside a **practitioner's** quote (Bernstein, McCray), rendered as the article has them (DR-0331).
- The article's claims are sorted in three tiers per DR-0100 and taught that way: the Google Threat Intelligence Group's measured doubling of disclosures stated plainly; Pennsylvania's figures given as reported specifics; the two practitioners named rather than paraphrased into consensus; the PwC and JumpCloud segments named as advertising and used for nothing.

## Verification

- **8 cases green**, and **3 proven to catch** by mutation (DR-0076 §3): the curly apostrophe turned straight inside sov47's Ezekiel 33:6 reddened both the span case and the dedicated apostrophe case; `Yahweh` changed to `God` in our own prose reddened the bright-line case and named the field; adding Luke 14:28 and Matthew 7:24 to the anchor reddened both the declared-verses case and "does not re-teach the ground sov34 and sov38 already hold". Restored to 8 green after each.
- **The first mutation attempt did not count and was redone.** Replacing the apostrophe file-wide hit 14 occurrences including single-quoted strings in other lessons, which broke the parse — a file that stops compiling is not a caught mutation, so it was scoped to the sov47 block and re-run.
- **107 cases green** across the seven band and quotation-integrity gates: band-differentiation, quotation-integrity, bands-reach-the-reader, band-coverage, four-bands-hold, four-bands-group-a, four-band-group-c.
- All 25 guards green; lint clean; the module imports and the catalog reads 47 weeks numbered 1 to 47 with no duplicate.

## What this does not do

- **It does not touch sov33, sov34 or sov38.** Their ground is theirs; this record names the overlap rather than merging or rewriting anything, because a theme taught twice from different Scripture is the curriculum working and only the same ground under a similar name is the defect.
- **It does not build the second forward.** Darrell sent two on 2026-10-21; the ByteByteGo issue on LLM prompt caching versus semantic caching is not built here and its Gmail thread stays unlabelled, so the lock holds and the next firing retries it. **`re-review: 2026-10-22`.**
- **It does not generalise the number check.** The splice script now refuses a duplicate week number, but that guard lives in a throwaway script rather than in the suite. Whether the course itself should assert "every week number is unique" — the way the ledger asserts it for decision records — is **`re-review: 2026-10-28`**; sov47's own test asserts only its own number, deliberately, because a newest-forever pin is what broke sov38's equivalent on arrival.
