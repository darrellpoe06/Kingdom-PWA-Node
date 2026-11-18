# DR-1492: L314 — Will My Work Live On

**Date:** 2026-11-13
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll314-will-my-work-live-on.js`, its own file per DR-1468)
**Forwarded by:** Darrell, one Big Think essay, with one word above it: Lessons
**Pairs with:** DR-0610 (one teaching, one lesson), DR-1468 / DR-1477 (the parallel pipeline), DR-0098, DR-0100, DR-0076, DR-0331, DR-1352 (ll283, the earlier Big Think lesson, not repeated)

## Context

Darrell forwarded Big Think's essay by Anna Gát, George Lucas spent 17 years building his latest world (2026-11-10), into the app on 2026-11-10 at 17:30:05 UTC, 11:30 AM Central (Gmail thread `1a1c68295f781bbb`), with one word above it, Lessons; rendered, never quoted. The essay was in the email whole, not a teaser. It walks the new Lucas Museum of Narrative Art and opens on three questions it says no faith can answer conclusively: will my work live on, will my children pass on good values, have I done my duty. That claim is the landing: the Word answers all three. His plural was weighed: the essay carries a second, separate thread, the crowd voting with its money as the judge of greatness (Luke 16:15; 1 Samuel 16:7), reported as a candidate, not taught here. `lesson-already-built --thread` found no prior build; ll283 (DR-1352) lands elsewhere (the image turned backwards). L311 and L312 were reserved by other sessions; new-lesson.mjs reserved L314.

## What was measured

| what | measured |
| --- | --- |
| verses | 56 anchor references; 127 quoted spans over 60 references, every one filled by `fill-verses.mjs` from `app/public/bible/kjv`; 0 verse faults; 0 double-quoted spans without a reference |
| length | adult 2,135 words; child 918 |
| band shares | child 0.59, youth 0.63, teen 0.65, senior 0.69 |
| reading ladder | child 2.1, youth 5.4, teen 5.6, senior 6.5 |
| band overlap | worst pair 0.05 (ceiling 0.5) |
| essay, tiered | reported by Big Think: nearly 17 years, eight building the LA site, five stories, about 100,000 sq ft, a founder of 82, earlier designs failed in San Francisco and Chicago; the writer's own reading: the pharaoh's pyramid and the case to be remembered among the greats; no verdict on any heart |
| not read | bigthink.com refused this session (proxy 403 on CONNECT), so no figure was read back from the publisher; `re-review: 2026-11-27` |
| PoeTech, measured | decision records append-only (`docs/decisions/README.md:22`), 1,371 on disk 2026-11-13; the Succession course, Handed Forward (`app/src/lib/succession-class.js:44`) |

## Impact

A learner meets the oldest question about a life's work answered Word first rather than left open (DR-0098): Solomon, who built for twenty years and collected the treasure of kings, and still wrote that he must leave it to a man who might be a fool (Ecclesiastes 2:18-19), with Rehoboam as the answer (1 Kings 11:43; 12:13); and the city whose Builder is Yahweh (Hebrews 11:10). Applied to a household, a church and PoeTech. Content only; one new lesson file and one new test.

## Decision

`ll314-will-my-work-live-on`, ORDER 314, ADDED 2026-11-13, Word first:

- **The three questions**: the asking is from Yahweh (Ecclesiastes 3:11), and the Word answers.
- **The king who built a museum** (Ecclesiastes 2:4, 8, 11, 18-19; 1 Kings 6:38; 7:1; 9:10; 11:43; 12:13).
- **A house called by a name** (Psalms 49:11, 17; 2 Samuel 18:18; Genesis 11:4; Ecclesiastes 1:11; 9:15).
- **Two graves in Egypt and a man in tents** (Genesis 50:25; Exodus 13:19; Hebrews 11:9-10, 22, 26).
- **The Builder of all things, the giver of every gift** (Hebrews 3:4; Exodus 31:3; 1 Corinthians 4:7; James 1:17; Psalms 127:1; Colossians 1:16-17; Mark 6:3); **the story's Author** (Isaiah 46:10; Psalms 139:16; Hebrews 12:2).
- **Three answers**: what abides (1 Corinthians 3:11-14; Ecclesiastes 3:14; John 15:16; Revelation 14:13; Psalms 90:10, 17); what the children keep (Deuteronomy 6:7; Psalms 78:4; Judges 2:10; 2 Kings 20:19; 3 John 1:4; Proverbs 13:22); the whole duty (Ecclesiastes 12:13; Luke 17:10; Matthew 25:21); and after, the Lamb (Hebrews 9:27; 2 Corinthians 5:1; John 14:2; John 1:29; Malachi 3:16; Proverbs 10:7; Hebrews 11:4).

Two parables with invented people (Kumasi, Brno); a ten-question quiz.

## Verification

`living-lessons-ll314-will-my-work-live-on.test.js`: 14 cases on the shared gate (DR-1477) with 8 spine spans in every text, plus four dangers, each proven to catch with a planted defect: the museum's figures stated without the essay or reported; the pyramid or the case to be remembered given as our verdict; a band that leaves any of the three answers' anchors out; the thread id dropped from the file. `export const UNCHECKED` names what was not read back. `re-review: 2026-11-27`: try bigthink.com again and correct any figure the publisher's page overturns.
