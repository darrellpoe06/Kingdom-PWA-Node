# DR-1567: L330 — He Healeth the Broken in Heart

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** A (one Living Lesson in its own file; content only, no schema, no shared line touched)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll330-he-healeth-the-broken-in-heart.js`, its own file per DR-1468), its gate test
**Sent in by:** Darrell, 2026-11-18, in a build session: a YouTube link to a conversation between Taylor Welch and Dan Duval, with written summaries of it (three at first, three more the same evening on the government-program, epigenetics and genetic-code claims), as the lesson to try in the fastest lane
**Pairs with:** DR-1512 (L318, the earlier video lesson and its method), DR-0098 (teach the Word, do not debate it), DR-0100 (established fact stated plainly), DR-0076 (verify; name what was not read), DR-0210, DR-0331, DR-1468 / DR-1477 (per-file pipeline and shared gate)

## Context

The conversation covers consciousness, trauma and seeing through the mind of Christ. Some of what the speakers say the Word also says: a person is spirit and soul and body, the wound is real, the body feels it, Jesus heals, Yahweh opens eyes, waiting is active. Some of it the Word does not say: a soul breaking into parts that each hold their own awareness, a body with a separate awareness, consciousness beginning in a quantum realm, a heart that selects which timeline a person lives in, prayer that cuts events out of a timeline, and their account of DNA. The obvious builds were an endorsement or a rebuttal. DR-0098 forbids both shapes. The lesson takes each question to the Word, teaches what is written, and stops where it stops (Deuteronomy 29:29).

## What was measured

| what | measured |
| --- | --- |
| the video | never watched: `youtube.com/oembed` for the link returned a proxy 403 from the sandbox. What was read is the six summaries Darrell pasted. |
| already built? | no. `_CkuygjcL8s` and the speakers' names appear nowhere in `app/src/lib`; Psalms 147:3 is quoted elsewhere in `living-lessons-class.js` and `sovereign-ai-class.js`, which a verse may be (DR-1317); the nearest subject by title is L52, on how a lie is wired in, a different teaching. |
| verses | 278 quoted spans filled by `fill-verses.mjs` from `app/public/bible/kjv`, none typed; 0 verse faults; 0 double-quoted spans without a reference |
| length | adult prose 1,720 words |
| band shares | child 0.54, youth 0.64, teen 0.78, senior 0.84 (floor 0.5 / 0.6) |
| reading ladder | child 0.3, youth 3.0, teen 3.9, senior 6.6 (child ceiling 5.0) |
| band overlap | worst pair 0.06 (ceiling 0.5) |
| gate | 9 of 9 cases green on the first run, and again after each addition |
| lane time | not claimed: the sandbox clock read 23:45Z at the reservation and 23:51Z well after the gate ran, so it is not a trustworthy stopwatch; the PR open and merge times are the measure |

## Impact

A learner who has heard this conversation, or one like it, meets the Word on each of its questions instead of two camps. A learner carrying an old wound is told plainly that it is real, that Yahweh is near it, and that telling a pastor, a doctor or a counselor is not unbelief. One lesson file and one test; no shared catalog, dates or budget line is edited.

## Decision

`ll330-he-healeth-the-broken-in-heart`, ORDER 330, ADDED 2026-11-18, in nine movements:

1. **The whole person** (1 Thessalonians 5:23; Genesis 2:7; Hebrews 4:12-13). The quantum claim is named once as the speakers' and not taught.
2. **The wound is real** (Proverbs 18:14; Psalms 34:18; Psalms 147:3).
3. **The body carries what the heart carries** (Psalms 32:3; Proverbs 17:22; 14:30; Psalms 103:14): one person, not a body with a second mind.
4. **The divided heart and the One who unites it** (Psalms 86:11; 42:11; 23:3; Luke 4:18, 21). Soul fragments are named as the speakers' claim; the Word's own language is a prayer, and the uniting is asked for, not done to oneself. Seeking a physician is not unbelief (Matthew 9:12).
5. **The heart Yahweh searches** (Proverbs 4:23; Jeremiah 17:9-10; Psalms 139:23-24; Ezekiel 36:26). Timelines are not the Word's language; Psalms 31:15 is.
6. **The past is redeemed, not cut out** (Genesis 50:20; 41:51-52; John 20:27; Hebrews 13:8; Joel 2:25; Revelation 21:4). Joseph names the evil and the good in one sentence; the risen Jesus keeps His wounds.
7. **The eyes Yahweh opens** (2 Kings 6:17; 2 Corinthians 4:18; Ephesians 1:18; 1 Corinthians 2:14, 16; Romans 12:2).
8. **Waiting and faith** (Isaiah 40:31; Psalms 27:14; Matthew 6:8; Philippians 4:6-7; Hebrews 11:1; Mark 9:24): faith trusts a Person; it does not select a reality.
9. **Prove all things, and who owns a soul** (1 Thessalonians 5:21; Isaiah 8:20): what to hold fast and what to lay down, by name. Added from his later summaries: epigenetics is stated as real science; soldiers switched through parts of a soul, and a genetic code rewritten by prayer that releases abilities, are named as the speakers' claims and not taught. The Word's answer is ownership and gift: all souls are His (Ezekiel 18:4), men cannot reach past the body (Matthew 10:28), no one plucks His own from His hand (John 10:28), fear is not what was given (2 Timothy 1:7), iniquity is forgiven and cleansed (1 John 1:9), the body is changed at His coming (Philippians 3:21), and gifts are divided as the Spirit wills (1 Corinthians 12:11). The child and youth bands carry only the ownership and gift half, with nothing frightening described.

Four statements are made as established fact per DR-0100 and carried in `UNCHECKED` because no source was opened this session: that MK-Ultra and Operation Paperclip existed, that childhood harm shows up in adult health, that losing memory after severe harm is a condition physicians recognise, and that epigenetics is real science. No figure is attached to any of them. The speakers' words are rendered for meaning and never quoted. Two parables use invented people (Japan, Ghana). The quiz has ten questions. The facilitator notes tell the leader not to ask anyone to describe a painful memory before the group.

## Verification

`living-lessons-ll330-he-healeth-the-broken-in-heart.test.js` runs the shared gate (9 cases) with six spine spans present in the adult lesson and every band: Psalms 147:3, 1 Thessalonians 5:23, Psalms 86:11, Genesis 50:20, 2 Kings 6:17, Isaiah 40:31. `export const UNCHECKED` names what was not read back. `re-review: 2026-12-18` (watch the video through the research door when a runner can reach it, and read the three fact statements back from a primary source). On merge: PR, squash SHA, deploy run on that SHA, `site-health.yml`.
