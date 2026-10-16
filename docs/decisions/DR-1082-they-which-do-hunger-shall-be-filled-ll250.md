# DR-1082: They which do hunger shall be filled — what you leave undone, and the critical path (ll250)

**Date:** 2026-10-16
**Status:** accepted
**Tier:** A (additive curriculum: one new Living Lessons module, dated, with its gate)
**Type:** curriculum
**Area:**
- `app/src/lib/living-lessons-class.js` (`ll250-they-which-do-hunger-shall-be-filled-and-the-critical-path`, appended after ll249)
- `app/src/lib/living-lessons-dates.js` (ll250's line; the day it was spoken)
- `app/src/__tests__/living-lessons-l250-spoken-2026-10-16.test.js` (its gate)

**Amends:** nothing. Grounds: DR-0076 (every verse fetched verbatim from the repository's own KJV), DR-0098 (teach the Word, do not debate it), DR-0210 (Yahweh in our voice, quotations untouched), the standing rule that a spoken teaching is build input.
**Declared by:** Darrell, 2026-10-16, spoken into the house as a lesson: "The Bible says, blessed are those who hunger and thirst after righteousness, for they shall be filled. I want to give a lesson on that and give details on how that works when it comes down to the deterministic algorithms and what he says will and will not happen according to his word, based on what you do, not on what you say, but what don't you do specifically. And the critical path for that is that we're project managers across the whole Bible, all the algorithms associated with that. In Jesus' name, amen, which means so be it. We want to make sure that it happens now. Thank you. In advance. Yahweh."

---

## Context

The verse is quoted as the KJV gives it, "Blessed are they which do hunger and thirst after righteousness: for they shall be filled" (Matthew 5:6), and the lesson keeps his order in ten parts:

1. The promise, Word first: Matthew 5:6, with the KJV's own "do", the present participle (Strong's G3983, those who keep on hungering), and the word for filled shared with the feeding of the five thousand (Matthew 14:20; Strong's G5526); Psalms 107:9; Luke 1:53.
2. What hunger looks like: Psalms 42:1-2, 63:1, Jeremiah 15:16, Job 23:12, John 4:34 (His meat is to do the will), John 7:37.
3. What righteousness is: Matthew 6:33 (His righteousness), 1 John 3:7, Matthew 5:20.
4. What will and will not happen: Isaiah 1:19-20, Deuteronomy 28:1-2 and 28:15 (to observe to do).
5. The full soul and the empty desire: Proverbs 27:7, Luke 6:25, Revelation 3:17 ("thou sayest"), Amos 8:11, Proverbs 13:4, Proverbs 21:25.
6. What you do not do, specifically: James 4:17, Matthew 23:23, Matthew 25:25, 25:42, 25:45, Luke 10:31, Proverbs 24:30-34, Hebrews 2:3, James 2:17.
7. The critical path: Isaiah 46:10, Galatians 4:4, Revelation 22:13, Habakkuk 2:2-3, Luke 14:28-30; finished projects (Genesis 6:22, Exodus 39:43, Nehemiah 4:6 and 6:15, Proverbs 6:6-8); the first task, Matthew 6:33; Proverbs 16:3; John 17:4, 19:30, 2 Timothy 4:7, Philippians 1:6.
8. Now: 2 Corinthians 6:2, Hebrews 3:15, Psalms 119:60, Proverbs 3:28, Ecclesiastes 9:10, Colossians 3:23.
9. In Jesus' name, amen, so be it, thank You in advance: Strong's H543; Revelation 3:14 (the Amen is His name), 2 Corinthians 1:20, John 14:13, Nehemiah 8:6, Philippians 4:6, Mark 11:24.
10. The practice, with the three directions.

One place needed care: the righteousness hungered for is His, received (Matthew 6:33), and the doing is its evidence and its meal (1 John 3:7; John 4:34), so the lesson never teaches that obedience earns it.

## What was measured

- Every verse fetched from `app/public/bible/kjv` before a sentence was written. 268 referenced quotations, every one word for word in the verse it cites, case included.
- Checked against the three exclusive courses before writing: Nehemiah 2:18 belongs to inspections and Isaiah 55:1 to appraisal, so neither is quoted, and the gate pins the absence.
- Bands against a 1,609-word adult lesson (our prose only): first draft youth 0.53 and teen 0.57, short, and the teen-to-senior reading step a hair over one grade. Deepened in plainer sentences: child 0.56, youth 0.64, teen 0.65, senior 0.71.
- Reading level (Flesch-Kincaid, our prose only): child 1.6, youth 3.6, teen 6.8, senior 8.6; child under the 5.0 ceiling.
- Band overlap worst 0.02 (ceiling 0.5); every band names the lesson in its opening; all three directions in every place; no elision; no recited record; no generic "God" in our voice in any band.

## Impact

A reader holds Matthew 5:6 as a promise that does not fail and asks whether they are hungry rather than whether He will feed them. They protect their appetite, read both branches of His rules, write an Undone list and do its first item today, and manage their walk as a critical path whose first task is seeking first. Two stories carry it: the boy who was too full of junk for dinner and learned that saying he was starving never made him hungry, and the man who kept planning the visit to his father until there was no one to visit.

## Decision

The gate pins the structure in every band: Matthew 5:6 first and last, Isaiah 1:19 with Isaiah 1:20 beside it (the youth, teen, senior and adult places), James 4:17 everywhere, and Matthew 6:33 as the first task on the critical path in the adult lesson. His closing words ("In Jesus' name, amen, which means so be it", "We want to make sure that it happens now") are kept in the adult lesson word for word.

## Verification

- `living-lessons-l250-spoken-2026-10-16.test.js`: in the catalog once, dated 2026-10-16 on or after L249, names Darrell, and carries his sentences word for word; his words in every band (hunger, filled, undone, critical path, now, amen, so be it); the two branches and the undone in every band; the promise first and last; seek first on the critical path; 40 named strands verbatim; every referenced span verbatim with case; corpus apostrophes; no elision; "God" untouched inside quotations; the exclusive courses' verses absent; fullness (proven to catch a trimmed band), title, differentiation, directions and the reading ladder; two stories that teach this lesson; Yahweh in our voice in every band; quiz answers not all in one position.
- The catalog-wide lesson and course suites run green with L250 in the catalog; lint and the gates run before the push.
- `re-review: 2026-10-23` — read L250 on the live app in each band, and capture the first Undone item a reader reports finished the same day.
