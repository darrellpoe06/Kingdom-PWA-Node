# DR-1488: L311 — Every Man Presseth Into It

**Date:** 2026-11-13
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll311-every-man-presseth-into-it.js`, its own file per DR-1468)
**Source:** Darrell's message in the Claude conversation, 2026-11-13 about 8:55 AM Central, headed Lesson: a YouTube video on Matthew 11:12 (https://youtu.be/_CzUp_gZltk) and his own pasted summary of it. Came by chat, so there is no Gmail thread.
**Pairs with:** DR-1468 / DR-1477 (the per-file pipeline and the shared gate), DR-0098, DR-0100, DR-0076, DR-0210, DR-0331

## Context

Darrell sent a teaching video and his summary: Matthew 11:12 (the violent take it by force) is not a call to aggressive spiritual warfare or prosperity tactics but a picture of desperate faith that will not let go of Yahweh in doubt and suffering, shown in Jacob, Elijah, the woman with the issue of blood, and John the Baptist's question from prison. His summary is the direction; his one word is rendered, never quoted. The video itself could not be opened: `www.youtube.com` does not resolve from this session (getaddrinfo ENOTFOUND), so the lesson is taught from his summary and the Word, and says so in its provenance. Devotional, so Living Lessons; L311 reserved atomically by `new-lesson.mjs` (`reserve/ll-311`), DR-1488 by `claim-decision-number --reserve`.

## What was measured

| what | measured |
| --- | --- |
| verses | 35 anchor references; 183 quoted spans over 72 references, every one filled by `fill-verses.mjs` from `app/public/bible/kjv`; 0 verse faults; 0 double-quoted spans without a reference |
| band shares | child 0.54, youth 0.63, teen 0.64, senior 0.64 (floors 0.5 / 0.6) |
| reading ladder | child 1.2, youth 3.8, teen 6.7, senior 8.4 (child ceiling 5.0) |
| band overlap | worst pair 0.02 (ceiling 0.5) |
| not read back | the video (host does not resolve); Strong's G971 and that biazo stands behind both suffereth violence and presseth (`www.blueletterbible.org` does not resolve); Josephus, Antiquities 18.5.2, for Machaerus. All named in `UNCHECKED`; `re-review: 2026-11-27` |

## Impact

A learner meets a much-misused verse taught Word first, with no both-sides debate: the verse in its own scene, its own parallel, the chapter's own ending in rest, and four people who pressed in. Honest doubt brought to Jesus is shown as faith, not disqualification. Content only; one new lesson file and one new test; no shared catalog, dates, budget or order line was edited.

## Decision

`ll311-every-man-presseth-into-it`, ORDER 311, ADDED 2026-11-13, Word first:

- **The scene**: John in prison asks (Matthew 11:2-3); Jesus answers with Isaiah's signs and a blessing (11:4-6; Isaiah 35:5; 61:1), then honors him (11:7-11; Malachi 3:1; Luke 7:19-28). Matthew 11:11 is quoted whole, notwithstanding included, every time.
- **The Word explains the Word**: Luke 16:16, every man presseth into it; the kingdom suffered violence in John's chains and death (Luke 3:19-20; Matthew 14:10); the spectators of 11:16-19 against the pressers; the chapter ends in rest (11:25-30).
- **The misuse corrected**: weapons not carnal (2 Corinthians 10:4); the armour is truth, righteousness, peace, faith, salvation, the Word and prayer, and it is for standing (Ephesians 6:10-18); the reward is Him (Hebrews 11:6).
- **The models**, each from its chapter: Jacob held on wounded and prevailed by weeping and supplication (Genesis 32:24-31; Hosea 12:4); Elijah under the juniper tree, fed, let sleep, the still small voice, not alone (1 Kings 19:4-18); the woman who came in the press, under Leviticus 15:25-27, called Daughter (Mark 5:25-34; Luke 8:48).
- **Takeaways**: doubt brought to Jesus (Mark 9:22-27; Hebrews 4:15-16); faith is a grip, not a performance, and our grip is held (Philippians 3:12-14; Psalms 73:23-26; John 10:28; Job 13:15).
- Machaerus is named only as Josephus's account outside Scripture, with the Gospels' silence said. The video's superlative for John is not carried into our voice.

Two parables with invented people (Albuquerque, light; Busan, solemn); a ten-question quiz; the three talk-together directions in the lesson and every band.

## Verification

`living-lessons-ll311-every-man-presseth-into-it.test.js`: 16 cases, the shared gate (DR-1477) on 11 spine spans in every text, plus five particular checks, each proven to catch a planted defect: Matthew 11:11 cut in half; our voice calling John the greatest human ever born; Matthew 11:12 quoted without Luke 16:16; another tree put for juniper; Machaerus named without Josephus and the Gospels' silence. Catalog gates run green locally (listed in the PR). `re-review: 2026-11-27`: if `www.youtube.com` and a lexicon host become reachable, read the video and G971 back, and correct any line they overturn.
