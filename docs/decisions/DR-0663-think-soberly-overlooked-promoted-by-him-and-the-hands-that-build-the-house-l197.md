# DR-0663 — L197: Think Soberly — Overlooked, Promoted by Him, and the Hands That Build the House

- **Status:** accepted
- **Tier:** B
- **Type:** word
- **Date:** 2026-09-29
- **Scope:** `app/src/lib/living-lessons-class.js` (L197, `ll197-think-soberly-overlooked-promoted-by-him-and-the-hands-that-build-the-house`; `LIVING_LESSONS_META.weeks` 194 → 195); `app/src/lib/living-lessons-dates.js` (its day, 2026-09-29); `app/src/__tests__/living-lessons-l197-verses.test.js` (new); `living-lessons-order.test.jsx` (the "newest" day pin moves to L197); `living-lessons-l196-verses.test.js` (its "last lesson" pin becomes its place after L195, since L197 follows); the count pins every new lesson moves (`learn-crosslist.test.js` total +1; `measuredLessons` / `lessons` +1 in `band-differentiation`, `course-quotation-integrity`, `full-levels`, `reading-level`, `stage-reaches-reader` and `title-in-narrative` baselines; counts only, no debt entry). Shipped on its own branch, `claude/darrell-queued-lessons-a`, one of four queued lessons (DR-0664, DR-0665, DR-0666 are the others).
- **Principles:** WORD-FIRST, TEACH-DONT-DEBATE, VERIFICATION-DOCTRINE, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, ONE-TEACHING-ONE-LESSON, DECISION-RECORDS
- **Grounds:** CLAUDE.md "Spoken Teachings Are Build Input"; DR-0076 (every verse fetched, pinned, proven to catch); DR-0098 (teach the Word's own distinction, never stage camps); DR-0210 (Yahweh in our voice, quoted KJV untouched); DR-0331 (render for meaning, no one quoted but Scripture); DR-0052 (numbering beside a lane in flight).

## The report

Darrell spoke a lesson on 2026-09-25 (1:57; `agent_inbox` row `2e5c8f2e-3a43-46ac-ab76-c6d5d7398d1f`, the Whisper transcript of voice row `80d73a73-4304-42ec-bb99-4ecdc4dbbbeb`, rung `nas-cpu`, model `small`, name tag "Darrell") and typed it again on 2026-09-28 (row `8248376d-876c-4225-a419-2d5065f15618`, name tag "Darrell Poe") with a second part. First part: the Lord says not to think more highly of yourself than you ought; what then is the right measure, when you have shown real capability and the people around you, with no ill will, find you when they need you and cannot see you when an opportunity would benefit you too? Promotion is from the Lord; He turns the hearts of kings, raises some and brings others low; how and why? Reading the data set of his own life: be content, appreciate Him, look to family, and still scale while we exist. Second part: a conversation with Word-first men he respects, who hold that someone who does not believe in Yahweh should not work in the church; Darrell holds that the work is governed by the Holy Spirit, that the church may hire for skill and availability short of what the Word explicitly names (anti-Christ, witchcraft), that souls are the Spirit's, that consequences carry accountability, and that confession needs psychological safety.

## One teaching, one lesson

Searched `app/src/lib` and `docs/decisions` for the same words. No lesson was built from these rows. The nearest is **L160, Pride Is Not Worth Him** (Romans 12:3 at length, a different teaching about pride and ego); L197 carries a different case (being overlooked, promotion from Yahweh, contentment and scale, church staffing) and points to L160 by name for the longer study of pride.

## Impact

A spoken teaching left uncaptured breaks the standing covenant that what Darrell speaks into the app is built. Captured, it gives every reader who has been used and overlooked the Word's own case (Joseph and the butler) and the Word's answer (promotion is His; content and still enlarging). It obligates one thing: the church-staffing section carries a doctrinally sensitive point, so it teaches only the distinction the Word itself draws and leaves any further ruling to Darrell.

## The decision

**Placement: Living Lessons, L197** (devotional). L196 (DR-0661) landed on main first (#1831), so this lesson takes the next number, 197, with no gap.

Seven Word-first movements: (1) the measure is sober, not small (Romans 12:3-6; 1 Corinthians 4:7; 2 Corinthians 10:12; Galatians 6:4); (2) the chief butler used Joseph's gift and "forgat him" for two full years (Genesis 40:14, 23; 41:1); (3) promotion is His (Genesis 41:9, 14, 38, 40; Psalms 75:6-7; 1 Samuel 2:7; Luke 1:52; Proverbs 21:1, 18:16, 22:29), keeping Darrell's own self-correction from *if* to *since*; (4) His reasons as far as the Word goes and no further (Genesis 45:5; 50:20; Deuteronomy 29:29; 1 Peter 5:6; Luke 14:10-11); (5) reading the record of a life (Haggai 1:5; Lamentations 3:40; Psalms 139:23); (6) content and enlarging together (Philippians 4:11-13; 1 Timothy 6:6; Isaiah 54:2; Matthew 25:21; Deuteronomy 8:18; James 4:15; Psalms 127:1; 1 Timothy 5:8); (7) the hands that build the house: the first temple built with hired Sidonian skill (1 Kings 5:6, 18; 7:14), the believers' daily ministration given to men "full of the Holy Ghost and wisdom" (Acts 6:3), the Word's own boundary (1 John 2:22; Galatians 5:20), souls with the Spirit (John 16:8, 13; 1 Corinthians 5:13; Romans 14:4), confession made safe (James 5:16; Galatians 6:1), and honor for the brothers who see it differently (Romans 12:10). Close: Philippians 2:5-9.

**The doctrinally sensitive point, surfaced (CLAUDE.md "Spoken Teachings"):** the lesson carries Darrell's position as his testimony and teaches the distinction the Word itself draws between the work of the hands (1 Kings 5) and the oversight of the believers' care (Acts 6:3). It does not rule that his position or the other men's is the Word's; it shows where the Word speaks on both. If Darrell wants the lesson to go further in either direction, that is his call.

## Verification

- 201 quoted spans, all verbatim against the verse they name (`scanQuotedVerses`); every double-quoted span carries its reference.
- Bands measured: child grade 1.4 (share 0.55), youth 2.9 (0.61), teen 5.4 (0.67), senior 7.2 (0.85), adult 5.3; ascending; worst band overlap 0.03; every band names its lesson.
- Proven to catch: the test plants `God promotes.` and changes "but forgat him" to "but ignored him"; both fire. Separately, mutating "forgat him" to "forgot him" in `living-lessons-class.js` failed the L197 suite, and restoring it turned it green (see the PR).

Every name in our voice is Yahweh; the adversary is lowercase; no percentage, no record id at the reader.
