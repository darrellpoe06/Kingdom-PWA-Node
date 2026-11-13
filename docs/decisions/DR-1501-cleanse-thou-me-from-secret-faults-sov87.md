# DR-1501 — Cleanse thou me from secret faults: sov87 from one word over IT Brew

**Date:** 2026-11-13 · **Status:** accepted · **Tier:** A · **Area:** Sovereign A.I. week 87; the lesson lane
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS, DECISION-RECORDS
**Reserved:** `refs/heads/reserve/dr-1501` and `refs/heads/reserve/sov87` on origin, before a word was written.

## Context

Darrell forwarded IT Brew's *Site unseen* (sent 2026-11-09 15:01 UTC) from his university mailbox, from his phone, at **21:50 UTC, 3:50 PM CST**, with **one word** above the header: *Lesson*. Gmail thread `1a1c24a55626cb1c`. The intake lane fell behind; built from the backlog on 2026-11-13. `lesson-already-built.mjs --thread 1a1c24a55626cb1c`: NOTHING FOUND. **One teaching, one lesson (DR-0610):** sov81 (DR-1478) already taught the 12 November issue's PHP item from its far end, a fix known and not applied (James 4:17, Proverbs 27:23). The 9 November lead story carries a teaching sov81 does not: the fault nobody saw, in ground nearly everybody stands on whether they know it or not, kept by very few hands. sov87 teaches that, names week 81 in every teaching place, and is gated against re-quoting its frame. Weeks 84-86 were claimed on origin first; this branch took sov87. Sponsor, film piece, procurement story, word of the week and linked reads are left out on purpose.

## What was measured

| claim | tier | how |
| --- | --- | --- |
| Finder, "since 2014", the one-volunteer picture, the Tenable CTO's view | the newsletter's account | `www.itbrew.com`, `www.php.net`: `curl: (56) CONNECT tunnel failed, response 403` (control `registry.npmjs.org` 200); a web search's news summaries agree PHP shipped October 2026 fixes for two critical A.I.-assisted finds but credit several finders and do not confirm 2014 |
| What a zero-day is; open source as a common building block | ESTABLISHED, stated plainly (DR-0100) | definition; and our own lock file below |
| Our own ground | MEASURED on `origin/main` 152cfb3b302 | below, each pinned in the lesson's test against its source |

- `app/package.json`: 11 dependencies, 17 devDependencies; `app/package-lock.json`: 578 installed, 161 with `funding`; `git ls-files '*.php'`: 0.
- `registry.npmjs.org`, 2026-11-13: 5 of the 11 list one maintainer (libheif-js, libsodium-wrappers, phonemizer, qrcode.react, xlsx); xlsx latest 2022-03-24. Not re-checkable offline, so the test requires the date beside it.
- `scripts/dependency-audit-allowlist.json`: xlsx prod, no fixed release, moved off npm, reReview 2026-12-05. `.github/dependabot.yml:1-5`; `scripts/dependency-audit-guard.mjs:6-10` (95 workflows, first run 21 known, 2 critical, 6 high, 8 cleared); `ci.yml:158`; `exposure-report.yml:18`; `OpsBoard.jsx:427`.

The ladder passed on the first draft, every band authored by hand (DR-1306): child 1.31 < youth 3.37 < teen 4.78 < senior 8.35 (adult 7.37); shares 0.555 / 0.681 / 0.734 / 0.757; worst overlap 0.130.

## Impact

Word first on Psalm 19:12 and 2 Kings 12:5-6, quoted ahead of the newsletter in every teaching place; then Psalm 139:23-24; Mark 4:22, Proverbs 25:2; John 4:38, Isaiah 51:1, Psalm 11:3; 2 Kings 12:4, 7, Ecclesiastes 4:9-10; Lamentations 3:40; 2 Kings 12:9-15, 1 Timothy 5:18, Proverbs 3:27; 1 Corinthians 3:11, 13, Isaiah 28:16, 1 Peter 1:19, Hebrews 4:13, Jesus the Lamb and the Eternal Son of Yahweh. 128 quoted spans, 14 books, 31 anchor references, all filled from `app/public/bible/kjv` by `scripts/sov87-fill.mjs` (rebuild byte-identical). Third-pile GAP 36 -> 37 by the second remedy (the shut road named; no row, every figure is our own). Course-band baseline 306 -> 307, debt unmoved. `HELD_IN_FLIGHT = [84, 85, 86]`: week 87 waits for its predecessors.

## Decision

1. sov87 is placed in Sovereign A.I. (week 87), as prior IT Brew forwards were (INTAKE-AND-FIT: a household that runs on its own machines must know what they stand on, and who keeps it).
2. The newsletter's account stays its account: every sentence carrying 2014 names whose account it is, gated. `re-review: 2026-11-27`: try both hosts from a runner; if they read back, replace the not-checked clauses.
3. FOUND, NOT CHANGED: nothing in the repository records support given to any of the 161 packages that ask for it. Giving is real money, a bright line, so it is set before Darrell as a question with a recommendation (a small yearly chest for the five single-keeper packages we ship), not decided here. `re-review: 2026-12-05`, beside the xlsx deferral.

## Verification

`app/src/__tests__/sovereign-ai-sov87-verses.test.js` (44 cases: quotations verbatim, only Scripture in double quotes, anchor exact, frame before the newsletter, week 81 named and its frame not re-quoted, the 2014 date always attributed, every house figure read back from its file, no PHP file, the registry figure dated, no person named, TALK close per band, the ladder; proven-to-catch for a drifted verse, a wrong verse, a quoted person, a re-quoted week-81 frame, a bare 2014 claim, a stripped date, a PHP file, a drifted figure and a stripped friend line). Catalog suites (the ten sov52-54/57-63 contiguity gates red by design until 84-86 land), `course-band-coverage`, `the-third-pile-is-a-worklist`, `decision-chain`, `unfilled-verse-token-guard`, `the-author-never-types-a-verse`, file-budget-guard, eslint and format-guard run on this tree.
