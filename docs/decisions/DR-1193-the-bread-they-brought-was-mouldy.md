# DR-1193: The bread they brought was mouldy — sov48, and the one seam left when the measurement says the article is already taught

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (one lesson added to an existing course, all four age bands from its first commit; one verse test; one baseline regenerated in its permitted direction)
**Type:** curriculum
**Area:**
- `app/src/lib/sovereign-ai-class.js` (sov48, the forty-eighth week of Sovereign A.I.)
- `app/src/__tests__/sovereign-ai-sov48-verses.test.js` (10 cases, 4 proven to catch)
- `app/src/lib/course-band-coverage-baseline.json` and `app/src/__tests__/course-band-coverage.test.js` (the debt pin moves 253 → 254)
- `app/src/lib/lesson-dates.json` (one derived row)

**Grounds:** Darrell forwarded ByteByteGo's "LLM Prompt Caching Versus Semantic Caching" into the app on 2026-10-21 at 17:12 UTC with one word above it: "Lesson" (Gmail thread `1a15f24a9e2291c3`). It was the SECOND of two forwards that day; the first, an IT Brew issue, became sov47 (DR-1192), which recorded this one as unbuilt with `re-review: 2026-10-22`. It is built here instead, the same day it was sent, because the tools to build and verify it were available now (DR-0236).
**Principles:** DR-0312 (a forwarded newsletter is built Word-first, or a comparison is reported); DR-0610 / DR-1185 (one teaching, one lesson — checked before writing, not after); DR-0076 §4 (measure, never claim) and §3 (proven to catch); DR-0100 (three tiers — state established fact plainly, flag only what is genuinely open); DR-0210 (Yahweh in our voice, quoted Scripture untouched); DR-0331 (a third party's words rendered as they stand)

## Context

The article is good. It explains prompt caching and semantic caching carefully, carries its own honesty note — that it is assembled from publicly shared details and that readers should flag inaccuracies — and states several things most trade writing gets wrong, including that a similarity score is not a probability of correctness. There is no ideological over-reach in it to correct, and saying so plainly is the DR-0100 posture; manufacturing a disagreement in order to have something to teach against would be its own dishonesty.

Which created the actual problem. **The measurement said the house had already said almost all of it.** The question that had to be answered before a word was written was not "what does the Word say about caching" but "is there anything here this course has not already taught four times."

## What was measured

**The overlap, first, in `sovereign-ai-class.js`.** Every major seam of the article was already held:

- *prompt caching, and reusing stored work* → **sov20** ("the book of remembrance and the tool that forgets").
- *embeddings, similarity, retrieval* → **sov22** ("the needle in the haystack and the chunk that drops its condition").
- *the one critical word that flips a meaning* — the article's own example of cancelling before shipping against after shipping — → **sov32**, on Judges 12's Shibboleth. The article's closing line, that a cached "the subscription has been cancelled" cannot substitute for an actual cancellation, is **James 2:15-16**, also sov32's.
- *the order of the prompt changing what it means* → **sov39** ("order carries meaning").

**Then the course's common vocabulary, counted, so a new spine could not be built on worn ground.** Occurrences before this lesson: `1 Thessalonians 5:21` **186**, `Acts 17:11` **81**, `Proverbs 27:23` **72**, `Psalms 119:89` **40**, `Isaiah 40:8` **33**, `Matthew 24:35` **31**. Those are the course's standing register, not available as an anchor.

**Then the free ground.** Occurrences before this lesson: `invalidat` **0**, `Joshua 9` **0**, `Gibeon` **0**, `mouldy` **0**, `asked not counsel` **0**, `Exodus 16` **0**, `manna` **0**, `Lamentations 3:22` **0**, `Lamentations 3:23` **0**, `Matthew 6:11` **0**, `daily bread` **0**, `John 6:49` **0**, `John 6:51` **0**, `Haggai 1:5` **0**, `Numbers 11:6` **0**.

So the untaught seam is **INVALIDATION** — not how to store an answer but how to decide it has stopped being true — and the spine is **Joshua 9 + Exodus 16:19-21 + Lamentations 3:22-23 + Matthew 6:11 + John 6:49-51 + Haggai 1:5**. That is not a theme chosen to be novel. It is the one thing the article treats as a footnote, and the two passages that settle it are the two places Scripture handles stored provision directly.

**The fit is exact, which is why it is worth a week.** Gibeon is the oldest recorded cache poisoning: every artifact genuine, the inference plausible, the confidence high, and the failure named not as a clever disguise but as a skipped check at the Source — "And the men took of their victuals, and asked not counsel at the mouth of the LORD." (Joshua 9:14) The article arrives at the same instruction in engineering language: if you must retrieve a current source version to validate an answer, that check belongs *before* the lookup. And Joshua 9:16 supplies the sharpest part, which no engineering text says out loud: the truth arrived on day three and the league was sworn on day one. **An expiry that fires after the commitment has not protected anybody; it has only dated the damage.**

The wilderness is the other half. A one-day life imposed deliberately on provision that was not scarce — "Let no man leave of it till the morning." (Exodus 16:19) — and the One who imposed it keeps the same rhythm Himself: "They are new every morning: great is thy faithfulness." (Lamentations 3:23) That turns a short expiry from a defect into a pattern, which is the pastoral payload: a household that re-reads the policy and phones the office is imitating Yahweh rather than distrusting its own memory. For a senior reader who has begun to doubt their recall, that is the whole lesson.

## Impact

- The forty-eighth week of Sovereign A.I. teaches cache invalidation from the Word, on ground no other week in the course holds, and **names** the four weeks that hold the rest instead of teaching any of it a fifth time.
- The article's claims are sorted in three tiers per DR-0100 and taught that way: the mechanics stated plainly as established; the reported prompt-cache rates given as reported *with their own expiry marked*; the absence of a universal similarity threshold stated as a design fact rather than hedged as uncertainty; the two sponsored segments named as advertising and used for nothing.
- **The pricing paragraph demonstrates the lesson on itself.** The rates it quotes were current as that issue reported them on 2026-10-21; provider pricing, minimum cacheable lengths and expiry windows move, and the lesson says so and tells the reader to re-fetch before spending money. A number you store is a cache entry too.
- The band debt moves in the only direction it may: total 427 → 428, `allFour` 253 → 254, `adultOnly` unchanged at 0, and the sovereign-ai row reads `{lessons: 48, allFour: 27}`.

## Decision

**sov48 ships on the measured-free spine, and its verse test pins the four things that went wrong while writing it.**

- Seventeen verses, every one fetched from `app/public/bible/kjv` and pinned against it; **84 quoted spans verified verbatim** across the lesson, the four bands, `bigIdea`, `inApp`, the anchor theme, the `rpe` block, the benefits, both stories, the facilitator notes and every quiz explanation — not only the prose a reader scrolls.
- **The DR-0210 bright line is pinned per field:** `God` and `the LORD` appear **zero** times in our own prose and only inside quotations, where the KJV's wording is left exactly as written. Joshua 9:14, Lamentations 3:22 and Haggai 1:5 all carry "the LORD" inside the quotation, which is exactly where it stays.
- **Both stories are parables, deliberately.** Neither is a named person's consented account, so neither may claim to be one — the correction sov47 had to make the same day, caught by `a-true-story-names-whose-life-it-was`.
- The two practitioners' register question does not arise here: the article quotes no named practitioner, so nothing is paraphrased into consensus and nobody is named who did not speak.

## Verification

- **10 cases green**, and **4 proven to catch** by mutation (DR-0076 §3), restored to 10 green after each:
  1. Re-introducing the splice's double comma reddened "the modules array has no hole in it".
  2. Changing `Yahweh` to `God` in our own prose reddened the bright-line case and named the field (`child: "God" in our own prose`).
  3. Replacing the lesson body with the teen band reddened "the lesson body is not a band wearing a second label" at 1.000 overlap, and also reddened the provenance case.
  4. Turning the curly apostrophe straight inside a quoted Lamentations 3:22 reddened both the span case and the dedicated apostrophe case, naming the field (`senior: Lamentations 3:22`).
- **159 cases green** across the nine band and quotation gates: band-coverage, bands-reach-the-reader, four-bands-group-a, four-bands-hold, four-band-group-c, four-band-ladder, course-quotation-integrity, quotation-integrity-gate, talk-together. **72 more** across band-differentiation, lesson-completeness, doubled-word, parables-never-wear-a-real-name, the true-story gate and both sov47 and sov48 verse tests.
- **Band differentiation measured, not assumed:** worst pair 0.012 against a 0.50 ceiling and a 0.15 house median (child~youth 0.005, youth~teen 0.012, teen~senior 0.007, child~senior 0.000).
- **Talk-together measured per band:** `placesMissingDirections` returns empty — all three directions present in the lesson and in every one of the four bands, in the lesson's own words.
- The catalog reads 48 weeks numbered 1 to 48, no duplicate and no gap, verified by importing the module rather than by grep.
- `derive-lesson-dates --check ok`: 839 of 839 lessons dated, 0 undated. The clarity corpus was regenerated and is byte-identical, so no fixture moved.

## What this does not do

- **It does not re-teach sov20, sov22, sov32 or sov39.** Their ground is theirs; this lesson points a reader at them by name. A theme taught twice from different Scripture is the curriculum working; the same ground under a similar name is the defect, and that is what the measurement was for.
- **It does not fix the splice script's blind spot in the suite.** The throwaway splice refused a duplicate week NUMBER — the defect that bit sov47 — and then left a trailing comma that put an `undefined` in the catalog, because a check written for one failure class could not see the next one. sov48's own test now catches the hole permanently, but whether the course should assert its own well-formedness centrally is still the open question DR-1192 parked. **`re-review: 2026-10-28`**, unchanged.
- **It does not verify the quoted cache rates against the provider.** They are reported as the article reported them, dated, and marked as carrying their own expiry — which is honest, and is the weaker of the two available options. Fetching them from the provider's own pricing page and pinning them with a date would be stronger. **`re-review: 2026-11-04`.**
- **It does not re-review on 2026-10-22.** DR-1192 set that date for this forward being unbuilt; it is built, so that item is closed rather than carried.
