# DR-1465: L305 — Search Me, and Know My Heart: pondering the heart with Yahweh

**Date:** 2026-11-13
**Status:** Accepted (renumbered from DR-1464 the same day, after main took DR-1461 for the 0319 smoke record)
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons-class.js`, `living-lessons-dates.js`)
**Spoken by:** Darrell, 2026-11-13, the fourth of a thread
**Pairs with:** DR-1464 (L304, whose Proverbs 21:2 this takes up), DR-0100 (established data stated plainly, named narrowly), DR-0076, DR-0331, DR-1126 (the third pile)

## Context

Darrell said: if Yahweh ponders the heart, I must ponder mine too, and consider it and protect it. The only safe way to look into the soul (mind, will, emotion) and spirit is with Him, in the Word. We hold much information with little direction, and Yahweh is direct and purposeful. His voice leads all the others. He said to bring the gaps to the Prince of Peace, who wrote the code of the soul.

He testified that studying Yahweh's will has been worth more than money, and that Yahweh taught him to create wealth; he said this is gratitude, not pride, and that it came through suffering. He often took the least pay while the best on the team, and worked fifty hours for what others made in forty. He named this among the stresses of African American men in America: real barriers, not Jim Crow. He said Yahweh calls them bread for us, and we still win.

## Impact

A learner is taught to search the heart with Yahweh rather than alone, and meets a measured barrier stated plainly beside Darrell's testimony. Content only; no data or behavior changes.

## Decision

`ll305-search-me-and-know-my-heart` is dated 2026-11-13, after L304. Word first:

- **Yahweh searches the heart** (Proverbs 21:2; Proverbs 16:2; 1 Samuel 16:7; Jeremiah 17:10; Hebrews 4:12).
- **So I consider mine and keep it** (Haggai 1:5; Lamentations 3:40; 2 Corinthians 13:5; Proverbs 4:23).
- **I search it with Him, not alone,** because the heart is deceitful (Jeremiah 17:9). The key verse is Psalms 139:23-24, and Proverbs 20:27 stands beside it.
- **The whole person** (1 Thessalonians 5:23; Psalms 139:14; 1 Corinthians 2:11; Isaiah 55:8; Psalms 32:8). Darrell's description of the soul as mind, will and emotions is given as his description.
- **His voice leads** (John 10:27; John 16:13; Psalms 119:105).
- **The Prince of Peace for the gaps** (Isaiah 9:6; John 14:27; Philippians 4:7; Isaiah 26:3; Psalms 51:10), and **a mind renewed to His perfect will** (Romans 12:2).
- **Worth more than money, and the power to get wealth is His** (Psalms 119:72; Proverbs 16:16; Deuteronomy 8:18).
- **The barrier, told truthfully,** then bread for us. Numbers 14:9 is taught in its context, after the grasshoppers of Numbers 13:33 (Psalms 119:71; Romans 5:3-4; Numbers 14:6-9; Genesis 50:20; Romans 8:28; Proverbs 22:29).

His hours and pay are his testimony and stand as testimony, never as the statistic. The ending belongs to the Word's "bread for us" and to his "still winning", not to woe.

It has two parables with invented people and a ten-question quiz.

## Research (DR-0100, tier 1: stated plainly)

The source is the Bureau of Labor Statistics, Usual Weekly Earnings, third quarter 2026, released 2026-10-21. It gives the median weekly earnings of full-time wage and salary workers: **Black men $1,040, White men $1,394**, about seventy-five cents on the dollar. The house gates bar "percent" in reader text, so the lesson says it in cents.

The search on 2026-11-13 found the White men's $1,394 on the BLS archive page for the 2026-10-21 release, the Black men's $1,040 and the ratio in a news report of the same release, and the Q3 2025 release, also from BLS, at $1,032 against $1,362.

The lesson names the figure precisely as a comparison of national medians and a fact. It does not claim to apportion causes; that narrow point is not this lesson's to settle.

**Not read:** `www.bls.gov` was refused from this sandbox (getaddrinfo ENOTFOUND), so the release page itself was not read. Every reader text says so.

No `lesson-sources.json` row was added, because no runner has been shown to read bls.gov back. A row the witness cannot read would make `checked()` count a figure nobody read back (DR-0076 §3). So the third-pile GAP pin rises by one, with a dated note.

## What was measured

Verses: 38 anchor references and 168 quoted spans, every one fetched from `app/public/bible/kjv`. There are 0 verse faults and 0 quotes lacking a reference. Length: The adult text is 2,315 words, with 1,565 words of prose. Band shares are child 0.64, youth 0.69, teen 0.70 and senior 0.74. Reading ladder: Child 1.9, youth 3.6, teen 4.2, senior 5.4. Band overlap: The worst pair is 0.11. Voice: three faults were caught by scan before the gate, "so is the LORD" in a parable and two unquoted renderings of Psalms 139:23; each now reads Yahweh or carries its quotation and reference.

## Verification

`living-lessons-ll305-search-me-and-know-my-heart.test.js` runs 50 cases (vitest's count) and pins 14 spine spans in every text. It also checks four things in every text: the BLS figure with its source; the fifty hours named as Darrell's; the not-read disclosure; the end on bread for us and still winning. It is proven to catch: a band dropping a spine verse; an altered verse word; a capitalized mid-verse span; a stripped teen friend line; a generic "God" in our voice; a band losing its source.

re-review: 2026-11-27. From a runner, read the 2026-10-21 BLS release directly. If it reads back, give the two medians a `lesson-sources.json` row, replace the not-read clause, and lower the GAP pin.
