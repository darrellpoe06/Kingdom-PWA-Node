# DR-1478 — What hast thou that thou didst not receive: sov81 from one word over IT Brew

**Date:** 2026-11-13 · **Status:** accepted · **Tier:** A · **Area:** Sovereign A.I. week 81; the lesson lane
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS, DECISION-RECORDS
**Reserved:** `refs/heads/reserve/dr-1478` on origin, before a word was written.

## Context

Darrell forwarded IT Brew's issue *Copyright, copyleft* (2026-11-12) from his university mailbox at **17:31 UTC** with **one word** above the header: *Lesson*. Gmail thread `1a1d0d054cd67ed2`. The scheduled intake missed it; it was built the next day. `lesson-already-built.mjs --thread 1a1d0d054cd67ed2` returned MAYBE on the source name only (other IT Brew lessons) and nothing on the thread. Two stories carry the hour: who owns software written with an AI tool (a law firm's head of tech transactions: copyright needs human contribution, so document authorship and protect outputs and inputs), and a PHP flaw patched quickly yet slow to be applied. PoeTech is itself written with an AI coding tool, so the lesson is applied to our own house. The sponsor's advertisement and the other items (jobs figure, small IT teams, poll, linked reads, job board) are left out on purpose.

## What was measured

| claim | tier | how |
| --- | --- | --- |
| Copyright needs a human author (US) | ESTABLISHED, stated plainly (DR-0100) | the Copyright Office's standing position; `app/src/lib/ip-register.js` was built on it 2026-09-06 |
| The lawyer's counsel | REPORTED | newsletter text only; `www.itbrew.com` 403 CONNECT, the firm's newsroom ENOTFOUND |
| PHP finder, "since 2014", ~70% share, slow federal offices | the newsletter's account | `www.php.net` 403; a web search's news summaries agree a critical fix shipped in October and the federal cyber agency urged patching, but credit other finders and did not confirm 2014: checking made these LESS certain |
| Our own record | MEASURED | IP register (Books, Legal): 24 rows, 11 human, 13 human-directed AI-expressed, 0 generated; 1,895 of 2,980 commits on `origin/main` a5975d92ed0 carry a co-author line naming the tool; INDEX 1,367 records |

The lesson teaches no outside figure. The four-band ladder failed the first draft (child 0.390, youth 0.474, teen 0.475, senior 0.534); about 1,100 words were authored by hand in each band's own register (DR-1306), never by a script on prose. Landed: child 0.98 < youth 3.45 < teen 3.91 < senior 7.02 (adult 7.00); shares 0.511 / 0.610 / 0.610 / 0.622; worst overlap 0.074.

## Impact

Word first on 1 Corinthians 4:7 and James 4:17, quoted ahead of any article in every teaching place, then eight movements: Psalm 24:1 and Deuteronomy 8:17-18 (received); Bezaleel called by name and filled with skill (Exodus 31:2-6; 36:1); Habakkuk 2:2 (write it plain); Baruch and Tertius (Jeremiah 36:4, 32; Romans 16:22; 2 Thessalonians 3:17) as honest shared authorship; Proverbs 11:1 against overstating one's share; the landmark verses for copyleft and inputs; James 4:17 with Proverbs 24:30-32, Nehemiah 3:28 and Proverbs 27:23 for the unapplied fix; Jesus the Lamb, the Eternal Son of Yahweh, Author and Finisher (Hebrews 12:2). 162 quoted spans, 20 books, 45 anchor references, every verse filled from `app/public/bible/kjv` by `scripts/sov81-fill.mjs`, none typed.

The third-pile GAP rises 34 -> 35 by the second remedy (the unread sources are named, no row: a row nobody can read back would count a figure nobody read). The course-band baseline rises 303 -> 304 with the debt unmoved.

## Decision

1. sov81 is placed in Sovereign A.I. (week 81), as prior IT Brew technology forwards were (INTAKE-AND-FIT: it teaches a household that builds with its own machines what it may honestly call its own).
2. The three tiers are held apart in every reader place and gated: reported, established, not checked. `re-review: 2026-11-27`: try `www.itbrew.com`, `www.copyright.gov` and `www.php.net` from a runner; if they read back, replace the not-checked clauses and lower the GAP pin.
3. FOUND, NOT CHANGED: the IP register row `Decision-record ledger — 298 records` carries a painted count (the ledger now holds 1,367). The register is the schedule an IP assignment attaches to, so its wording is left for the register's own amendment rather than edited from a lesson branch. `re-review: 2026-11-27`.

## Verification

`app/src/__tests__/sovereign-ai-sov81-verses.test.js` (31 cases: every quotation verbatim, every double-quoted span Scripture, anchor exact, frame before the article, the three tiers, no model identifier, no generic name in our voice, TALK close per band, the ladder; proven-to-catch cases for a drifted verse, a wrong verse, the lawyer put in quotation marks, a hedged requirement, a stripped date and a stripped friend line). Catalog suites, `course-band-coverage`, `the-third-pile-is-a-worklist`, `decision-chain`, `unfilled-verse-token-guard`, `the-author-never-types-a-verse`, eslint and format-guard run green on this tree.
