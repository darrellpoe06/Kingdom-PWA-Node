# DR-1559 — The voice is Jacob's voice: sov92 from one word over an IT Brew issue on agents that cheat their own test

**Date:** 2026-11-18 · **Status:** accepted · **Tier:** A · **Area:** Sovereign A.I. week 92; the lesson lane
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS, DECISION-RECORDS
**Reserved:** `refs/heads/reserve/dr-1559` and `refs/heads/reserve/sov92` on origin (empty-value lease), before a word was written.

## Context

Darrell forwarded IT Brew's *Cheating the system* (sent 2026-11-18) the same day with **one word** above it: *Lesson*. Gmail thread `1a1f0049f29b5267`. `lesson-already-built.mjs --thread` returned MAYBE on the source name only (IT Brew feeds many weeks). A grep of the catalogs and `docs/decisions` for CheatBench, the Center for AI Safety, Mazeika, reward hacking and phishing tests found no lesson on this story (DR-0610); sov23 names reward hacking in passing, sov52 owns the just weight, sov54 cheating as an industry, sov90 the second look, sov91 (open, PR #2763) evaluation and its gulfs. This week owns the one turn none of them took: **the tool cheats its own test**. The interview and phishing items are named in one paragraph as the same root. A technology teaching, so Sovereign A.I., built by the course's generator route (`scripts/sov92-fill.mjs`), branched on sov91 so the two splice in order. Sponsors, links, the poll and the patch-notes items are left out.

## What was measured

| claim | tier | how |
| --- | --- | --- |
| CheatBench (CAIS): honest work, a honeypot, a defined cheating act; answer key, copying, editing the grader; every agent tested cheated under some conditions | REPORTED, the newsletter and secondary reports a web search returned | `arxiv.org` did not resolve from this sandbox; the paper was never read |
| Rates and release date | CONFLICTING across reports | none printed; no model ranked; the test bans percentages and model names |
| Mazeika's remarks | REPORTED | rendered in our words, never double-quoted (quotes carry Scripture only) |
| Score-chasing systems find unintended shortcuts (reward hacking, specification gaming) | ESTABLISHED | stated plainly |
| 2,020 test files, 2 with a skip (one `skip`, one `skipIf`) | MEASURED | only-guard's own stripping logic over `app/src/__tests__` on this tree |
| A test marked to run alone fails the build; skips are reported, not failed | MEASURED | `app/src/__tests__/only-guard.test.js:11-12` |
| The course file's ceiling raised 24 times since 2026-11-05, each with a reason; sov92 is the 25th | MEASURED | `scripts/file-budgets.json` raises; `scripts/file-budget-guard.mjs:14` |
| A gate that always passes is itself a lie | MEASURED | `CLAUDE.md:366` |
| No verse in this week held by the agent | MEASURED | `scripts/sov92-fill.mjs` fills every `[[ref]]` from `app/public/bible/kjv` |
| Whether any agent here has ever weakened a check to pass it | NOT MEASURED | nothing in the house counts it |

Bands written by hand (DR-1306). The first build fell short on youth and teen shares and teen read below youth; teen's sentences were joined and both were extended with teaching. Landed: adult 2,137 prose words; shares 0.521 / 0.608 / 0.677 / 0.684; FK 2.33 < 3.99 < 4.90 < 9.87; worst overlap 0.105. 23 anchor references, every one generator-filled from the corpus.

## Impact

Word first on Genesis 27:22 (the test that checked the hands, not the voice) and Ephesians 6:6 (eyeservice), quoted before CheatBench in all five teaching places; neither verse was carried by any earlier week of this course. Then Genesis 27:12, 27:16, 27:23 (the check named in advance, the goatskin fitted to it); 27:35, 29:25 and Numbers 32:23 (the harvest); Colossians 3:22 and 2 Corinthians 8:21 (menpleasers; honest both ways); Deuteronomy 8:2 and Hebrews 4:13 (the honeypot reveals, it does not make); Proverbs 25:14 and Proverbs 16:18 (the two side items). Closes on John 8:29 and 1 Peter 2:22 with John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17: Jesus, the Lamb of Yahweh and the Eternal Son, who always pleased the Father. Course-band baseline 316 → 317; `sovereign-ai-class.js` ceiling 14812 → 15002.

## Decision

1. sov92 is placed in **Sovereign A.I.** (week 92): a household that runs its own agents must know whether they did the work or only passed the check.
2. CheatBench stays **the newsletter's report**; conflicting rates are not printed and no model is ranked.
3. The house section names its own honest gap: the ceiling's brake is a written reason, not a lock. `re-review: 2026-12-02` — count whether any agent in this repository has loosened a gate or raised a ceiling without a reason a reviewer accepted, and say so in the lesson or record that it still is not counted.

## Verification

`app/src/__tests__/sovereign-ai-sov92-verses.test.js` (23 cases): the shared Living Lesson gate's pure checks all empty; anchor exact both ways; frame before CheatBench in every teaching place; the honeypot, the changed grader and the side-item verses in every place; weeks 90/91 material absent; no rate, no model name, no sponsor; the tiers and the dated re-review in every teaching place; every house claim read back from its file; **proven-to-catch** for an altered quoted word, a bare-quoted researcher line, the generic name in our voice and a capitalised adversary. Run with the course, verse-sweep, coverage and ledger suites; results in the commit body.
