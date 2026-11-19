# DR-1584: L338 — Not with Eyeservice

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (one Living Lesson in its own file; content only, no schema, no shared line touched)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll338-not-with-eyeservice.js`, its own file per DR-1468), its gate test
**Sent in by:** Darrell, 2026-11-18, in a build session: one picture, a chart titled Reality of Remote Work, Assumptions vs. Reality, marked George Stern, and the one word Lesson
**Pairs with:** DR-0098, DR-0100 (flag the open narrowly: the chart has no numbers), DR-0076, DR-0210, DR-1468 / DR-1477, DR-1580

## Context

The chart sets twelve suspicions about people who work from home beside twelve replies. It shows no figures and names no study, and whether remote work raises or lowers output is not something this lesson can state from a picture. Under the chart is a question the Word answers at length: what a person does when no one is watching. The Word speaks to the worker (Colossians 3:22-23), to the one who suspects him (Proverbs 18:13; Matthew 7:20), and to the one who pays him (Colossians 4:1), and it will not excuse sloth in any room (Proverbs 24:30-34).

## What was measured

| what | measured |
| --- | --- |
| the source | one image, read in full (twelve rows); no numbers, no study, no source on it; nothing else of the author's was read |
| verses | 259 kjv tokens filled by `fill-verses.mjs` from `app/public/bible/kjv`, none typed; 0 verse faults |
| length | adult prose 919 words; 7 points read by `lessonPoints` |
| band shares | child 0.77, youth 0.70, teen 0.73, senior 0.71 (floor 0.5 / 0.6) |
| reading ladder | child 1.1, youth 3.4, teen 4.4, senior 6.9 (child ceiling 5.0) |
| band overlap | worst pair 0.14 (ceiling 0.5) |
| gate | first run 8 of 9: a quiz question used the generic title in our voice; reworded, 9 of 9. Title, doubled-word, American spelling, plain-meaning, hollow-surface and format guards green before the first push |

## Impact

A child alone with chores, a worker at a kitchen table, and a retired person with unsupervised days are each given the same audience: the Master who went to a far country and is coming to reckon. Someone who has suspected another is told to look at fruit. One lesson file and one test; no shared line is edited.

## Decision

`ll338-not-with-eyeservice`, ORDER 338, ADDED 2026-11-19, seven movements:

1. **The master who went away** (Matthew 25:14-15, 19, 21; Luke 12:43).
2. **Not with eyeservice** (Colossians 3:22-24; Ephesians 6:6; Proverbs 15:3; Hebrews 4:13; Matthew 6:4).
3. **The ant has no overseer** (Proverbs 6:6-8; Genesis 39:22-23; 2 Kings 12:15; Luke 16:10).
4. **Known by the fruit** (Proverbs 18:13; John 7:24; Matthew 7:20; Proverbs 20:11; 14:23).
5. **The sluggard is real too** (Proverbs 24:30-31, 33-34; 26:14; 10:4; 13:4; 1 Corinthians 4:2).
6. **Order, rest, and the house** (Ecclesiastes 9:10; Proverbs 21:5; Exodus 20:9-10; Mark 6:31; Psalms 127:2; Deuteronomy 6:7; Proverbs 31:27; 1 Timothy 5:8).
7. **Do not work alone** (Ecclesiastes 4:9-10; Hebrews 10:24-25; Matthew 5:37; Proverbs 25:13; Colossians 4:1).

The chart's replies are carried as its author's general statements and are not affirmed of every worker. Two parables use invented people (Morocco, Chile). Ten quiz questions.

## Verification

`living-lessons-ll338-not-with-eyeservice.test.js` runs the shared gate with seven spine spans in the adult lesson and every band. `re-review: 2026-12-19`. On merge: PR, squash SHA, deploy run on that SHA, `site-health.yml`. The branch also carries the DR-1580 lane files; they merge away when #2794 lands.
