# DR-1548 — Let your yea be yea: sov90 from one word over ByteByteGo's reasoning-model issue

**Date:** 2026-11-18 · **Status:** accepted · **Tier:** A · **Area:** Sovereign A.I. week 90; the lesson lane
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS, DECISION-RECORDS
**Reserved:** `refs/heads/reserve/dr-1548` and `refs/heads/reserve/sov90` on origin (empty-value lease), before a word was written.

## Context

Darrell forwarded ByteByteGo's *Why Thinking More Can Make an LLM Dumb* (sent 2026-11-17) the same day with **one word** above the forwarded header: *Lesson*. Gmail thread `1a1ea6587885ee3f`. `lesson-already-built.mjs` returned MAYBE on the source name only (eight earlier ByteByteGo records, none on reasoning models); a hand grep of the catalogs, `docs/decisions` and the 66 open `claude/lesson-*` branches found nothing on this story (DR-0610). It is a **technology** teaching, so it is a Sovereign A.I. week, not a Living Lesson (the split ll316's header records); `new-lesson.mjs` scaffolds only Living Lessons, so the week was built by the course's own generator route (`scripts/sov90-fill.mjs`, after sov88). Week 89 (Redis and Memcached, DR-1546) was in flight, so this claimed 90; 89 landed before 90 was committed, so 90 was re-spliced on main's catalog at sov89 and holds nothing.

## What was measured

| claim | tier | how |
| --- | --- | --- |
| Piece-by-piece generation; a written middle step helps; $100 → $120 → $96; a less-than loop over three items stops one short | ESTABLISHED; the two examples worked by hand | re-run in the lesson's test |
| R1-Zero trained by RL without SFT first; "endless repetition, poor readability, and language mixing"; R1 adds cold-start data before RL | VERIFIED at the vendor's door | `raw.githubusercontent.com/deepseek-ai/DeepSeek-R1/main/README.md:34-37`, read 2026-11-18 |
| Group-relative scoring, the "aha moment", the 2+3 study with thirteen solutions, the timetable drift | REPORTED as the newsletter's account | `arxiv.org`, `openai.com`, `blog.bytebytego.com` gave HTTP 000 from this sandbox |
| Quotation gate: blob search passed Haggai 1:7 under 1:5; the per-verse gate's first run found 18 of 25,192 spans | MEASURED | `app/src/__tests__/quoted-verse-is-the-verse.test.js:11,19-21` |
| Duplicate finder drifted twice (bare day; a review date thirty-odd lines from the source) and was fixed | MEASURED | `scripts/lesson-already-built.mjs:37-58` |
| The shared gate's own test runs 15 planted-defect cases | MEASURED | `app/src/__tests__/living-lesson-gate.test.js`, the `PROVEN TO CATCH` block |
| The four-band ladder has a share floor and grade ceilings, **no length ceiling** | MEASURED | `app/src/__tests__/fixtures/four-band-ladder.js:49-50, 57-59` |
| Adult lesson by whitespace words: week 1 = 291, week 88 = 3,668, weeks 80–88 = 3,139–4,845; week 90 = 2,691 | MEASURED on this tree | re-counted in the lesson's test |
| Whether the longer weeks catch more than they drift | NOT MEASURED | the newsletter's own caution: harder questions may simply draw longer answers |

Bands written by hand (DR-1306); the first build fell short on child/youth/teen shares and was extended with teaching, not padding. Landed: prose words adult 1,926; shares 0.518 / 0.618 / 0.612 / 0.668; FK 1.69 < 4.42 < 5.19 < 9.17; worst overlap under 0.12. 31 anchor references, every one generator-filled from `app/public/bible/kjv`. One self-correction before shipping: the first draft said the gate test "plants sixteen defects"; the count is fifteen, and the lesson says fifteen.

## Impact

Word first on Acts 17:11 (check against what is written, daily) and Matthew 5:37 (a plain yea needs no stack of words), quoted before any of the article's material in all five teaching places. Then Genesis 2:17 and 3:1-4 (a plain word, a question built to make it look crooked, an answer that added *touch*); Luke 14:28; Proverbs 25:2, 18:17, 2 Corinthians 10:12, Deuteronomy 19:15, Lamentations 3:40, Luke 15:17 (the second look that checks against something new and ends in a return); Matthew 6:7, Ecclesiastes 5:2-3, Proverbs 4:25-27, 10:19 (thirteen answers and the drift); Matthew 4:3-4 (one line from what was written). Closes on 2 Corinthians 1:19-20, John 1:29, John 3:16, Hebrews 1:8, Colossians 1:17 — Jesus, the Lamb of Yahweh and the Eternal Son, in whom is yea. Course-band baseline 314 → 315; `sovereign-ai-class.js` ceiling 14434 → 14623, re-measured on the rebased tree.

## Decision

1. sov90 is placed in **Sovereign A.I.** (week 90): a household running its own models and checkers must know when a second look is worth its time.
2. The vendor figures and training episodes stay **the newsletter's report** where the primary host is shut; the one road that opened (DeepSeek's README) is named beside them.
3. The band ladder's missing length ceiling is **recorded, not changed**: adding one would re-gate every lesson on a premise not yet measured. The fair test is the newsletter's own — vary the length on the same teaching. `re-review: 2026-12-02`: retry the three hosts from a runner; decide whether a length measure belongs beside the floor.
4. The `[89]` hold written while 89 was in flight was deleted when 89 landed first and `HELD_IN_FLIGHT` recomputed on the rebased tree: `[]`, weeks 1..90.

## Verification

`app/src/__tests__/sovereign-ai-sov90-verses.test.js` (23 cases): the shared Living Lesson gate's pure checks (`helpers/living-lesson-gate.js`) run on this week and all empty; anchor exact both ways; frame before the article in every teaching place; the tiers and the dated re-review in every teaching place; every house claim read back from its file; the course lengths re-counted; **proven-to-catch** for an altered quoted word, a bare-quoted newsletter line, the generic name in our voice and a capitalised adversary. Run with the course, verse-sweep and coverage suites on the rebased tree (results in the commit body); while 89 was still held, exactly the ten strict-contiguity gates DR-1376 counted went red and nothing else, which is the hold working.
