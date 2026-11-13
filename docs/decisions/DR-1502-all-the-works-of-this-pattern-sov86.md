# DR-1502 — All the works of this pattern: sov86 from one word over a TLDR digest

**Date:** 2026-11-13 · **Status:** accepted · **Tier:** A · **Area:** Sovereign A.I. week 86; the lesson lane
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS, DECISION-RECORDS
**Reserved:** `refs/heads/reserve/dr-1502` and `refs/heads/reserve/sov86` on origin (empty lease), before a word was written.

## Context

Darrell forwarded the TLDR daily digest of 2026-11-06 (subject: Anthropic IPO doubts, datacenter bans, GitHub's new storage) from his university mailbox at **20:46:35 UTC, 2:46 PM CST**, with **one word** above the header: *Lesson*. Gmail thread `1a1b29d09bf45870`. The intake lane fell behind; built from the backlog on 2026-11-13. `lesson-already-built.mjs --thread 1a1b29d09bf45870`: NOTHING FOUND.

A digest: fourteen editorial items, four sponsor blocks (left out). **One teaching taken, and why.** The lead (the planned IPO; investors expecting the $1.5T valuation to come down) is the price-of-a-promise and value-as-forecast already taught in sov78 and sov79 (DR-1317: overlap is how lessons connect, so it is named, not retaught). The item that offers a teaching the course has not given is the three-sentence summary of a profile reporting that rationalism and effective altruism form Anthropic's foundation: every tool has a maker, every maker has a mind; whose pattern is the house built on?

**Disclosure.** This app is built with an A.I. tool Anthropic makes, and this lesson was drafted with it. Every teaching place says so, after the Word and before the digest. Held to a stricter rule: no verdict, no person named, the Word's commendation of reasoning and doing good (Isaiah 1:18; Proverbs 14:15; Galatians 6:10) quoted before its warning (Colossians 2:8; 1 Corinthians 13:2-3), applied to every maker including the local open models.

## What was measured

| claim | tier | how |
| --- | --- | --- |
| Profile: two philosophies form the company's foundation | REPORTED (TLDR's summary) | profile NOT read; search listings name The New York Times, 2026-11-05; `dnyuz.com` did not resolve (ENOTFOUND); no further hosts tried |
| Chief executive said in 2023 he is not an effective altruist | REPORTED second-hand | same listings; unverified; told so a report about a person is not hardened into a verdict |
| IPO figures | REPORTED, not taught | TLDR's account of investor expectations |
| Our own house | MEASURED on `origin/main` 152cfb3b302 | below, each read back in the lesson's test |

- `ai-usage-ledger.json`: 149 entries before this one, every one naming a tool from the same maker.
- `CLAUDE.md:106, :114` (no improvised theology, training not canonical, surface uncertainty); `:372` (the human governs).
- `the-author-never-types-a-verse.test.js`; `scripts/sov86-fill.mjs` fills from `app/public/bible/kjv`.
- `llm-providers.js:280-292` the maker's model `sovereign: false`, `costTier: 'high'`, reserved for what local cannot do; `:296, :312` two other makers; `:12, :200-258` local engines on church GPU nodes.

Ladder landed first try after one hand pass (teen read easier than youth at 3.25): child 1.85 < youth 3.59 < teen 4.22 < senior 9.30 (adult 6.93, 2,098 words); shares 0.587 / 0.630 / 0.636 / 0.839; worst overlap 0.128.

## Impact

Word first on 1 Chronicles 28:11-12, 19 (the pattern in writing by Yahweh's hand), Colossians 2:8, 1 Corinthians 3:10-11; then the craftsmen of Tyre (1 Kings 5:6; 7:13-14; 2 Chronicles 2:14; Exodus 25:9, 40; Hebrews 8:5), Daniel's table (Daniel 1:4, 8, 17, 20), what the Word commends and refuses (Proverbs 3:5-6), trying the spirits (1 John 4:1; 1 Thessalonians 5:21; Acts 17:11), our house measured, and the truth who is a Person (John 14:6; 16:13; 1:29; 3:16; Hebrews 1:8; Colossians 1:16-17). 153 quoted spans, 16 books, 37 anchor references, all filled by `scripts/sov86-fill.mjs` (`--rebuild` byte-identical).

Third-pile GAP +1 by the second remedy (unread profile named; no row). Course-band baseline +1, debt unmoved. `HELD_IN_FLIGHT = [84, 85]`: sov83 (#2677) merged while this was built and the branch was rebuilt on it; sov84 (another session, DR-1497) and sov85 (a sibling builder) are unmerged, so this PR waits for both.

## Decision

1. sov86 is placed in Sovereign A.I. (week 86): a household that builds with other people's tools must know whose pattern it builds on.
2. The reported claim stays reported in every place, gated. `re-review: 2026-11-27`: read the profile from a runner; if it reads back, compare it with the three sentences taught and lower the GAP pin.
3. Each held week is DELETED from `HELD_IN_FLIGHT` in the merge that brings it in, recomputed from the merged tree.

## Verification

`app/src/__tests__/sovereign-ai-sov86-verses.test.js` (38 cases: quotations verbatim, only Scripture in double quotes, anchor exact, frame before the disclosure and digest, disclosure in every teaching place, no verdict and no name anywhere, commendation before warning, every house fact read back from its file, TALK close per band, the ladder; proven-to-catch for a drifted verse, a wrong verse, a quoted profile, a planted verdict, a planted name, a band with its disclosure stripped, a foreign-maker ledger entry, a drifted figure and a stripped friend line). Catalog suites, `course-band-coverage`, `the-third-pile-is-a-worklist`, `decision-chain`, `unfilled-verse-token-guard`, `the-author-never-types-a-verse`, eslint and format-guard run on this tree.
