# DR-1583: L337 — Not Far from the Kingdom

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (one Living Lesson in its own file; content only, no schema, no shared line touched)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll337-not-far-from-the-kingdom.js`, its own file per DR-1468), its gate test
**Sent in by:** Darrell, 2026-11-19, in a build session: a YouTube link to a 1964 interview of Malcolm X by Mike Wallace, written summaries of it (his break with the Nation of Islam, his account of its leader, the threats, policing and government in Harlem, lawful self-defense, his change of mind about race after Mecca), the one word Lesson, and the question whether he moved closer to being a Christian
**Pairs with:** DR-0098 (teach the Word, do not debate it), DR-0100 (state the established plainly; flag the open narrowly), DR-0076, DR-0210, DR-1468 / DR-1477, DR-1580

## Context

The interview carries four things the Word speaks to directly: a follower finding hidden sin in a leader, the cost of telling it, the turn from calling a race evil to judging by deeds, and what rulers owe the people under them. It also carries a question with a plain answer. He drew near to several things the Word teaches and did not come to Christ; he turned to orthodox Islam and was killed in February 1965. The honest shape was Mark 12:34: not far is not in.

## What was measured

| what | measured |
| --- | --- |
| the video | never watched (proxy refuses YouTube from the sandbox); only the summaries were read |
| his claims | his account of Elijah Muhammad, and of police and government in Harlem in 1964, are named as his and were not examined |
| general knowledge | that he was killed in February 1965 and lived and died a Muslim: stated plainly, no source opened in this session, listed in `UNCHECKED` |
| verses | 272 kjv tokens filled by `fill-verses.mjs` from `app/public/bible/kjv`, none typed; 0 verse faults |
| length | adult prose 1,082 words; 7 points read by `lessonPoints` |
| band shares | child 0.66, youth 0.68, teen 0.71, senior 0.76 (floor 0.5 / 0.6) |
| reading ladder | child 1.3, youth 2.9, teen 4.1, senior 5.8 (child ceiling 5.0) |
| band overlap | worst pair 0.15 (ceiling 0.5) |
| gate | first run 8 of 9: a quiz option put the generic name in our voice; reworded, 9 of 9. Title, doubled-word, American spelling, plain-meaning, hollow-surface and format guards green before the first push |

## Impact

A learner hurt by a leader is given Psalms 146:3 and Jeremiah 17:7 and told that a leader's sin is named and does not make the truth false. A learner raised to think less of a people is given Peter's correction in Acts 10. A learner who is right about many things is shown the door. One lesson file and one test; no shared line is edited.

## Decision

`ll337-not-far-from-the-kingdom`, ORDER 337, ADDED 2026-11-19, seven movements:

1. **When a leader falls** (Luke 12:2; Numbers 32:23; James 3:1; Ezekiel 34:2; Matthew 18:6; 2 Samuel 12:7; 1 Timothy 5:20).
2. **Where trust belongs** (Psalms 146:3; 118:8; Jeremiah 17:5, 7; 1 Corinthians 11:1; 1 Thessalonians 5:21; Matthew 23:3).
3. **The truth has a price** (Ephesians 5:11; Proverbs 31:8-9; Ezekiel 33:6; Galatians 4:16; Ephesians 4:15).
4. **One blood** (Acts 17:26; 1 Samuel 16:7; Matthew 7:20; James 2:9; Acts 10:28, 34-35; Revelation 7:9; Galatians 3:28).
5. **Rulers owe justice** (Romans 13:3-4; Isaiah 10:1-2; Psalms 82:3-4; Amos 5:24; Micah 6:8).
6. **Defending life and leaving vengeance** (Nehemiah 4:14, 17; Proverbs 24:11; Romans 12:18-19, 21; Matthew 5:44).
7. **Not far is not in** (Mark 12:33-34; Acts 26:28-29; Romans 3:10; John 14:6; Acts 4:12; 1 John 2:23; Romans 10:2; Acts 10:43).

The lesson says nothing about the state of his soul, which the Word does not tell us. The child band says only that a leader did very wrong things in secret. Two parables use invented people (Vietnam, Scotland). Ten quiz questions. The facilitator notes keep the hour off today's news and say not to ask anyone hurt by a leader to tell it aloud.

## Verification

`living-lessons-ll337-not-far-from-the-kingdom.test.js` runs the shared gate with seven spine spans in the adult lesson and every band. `re-review: 2026-12-19`. On merge: PR, squash SHA, deploy run on that SHA, `site-health.yml`. The branch also carries the DR-1580 lane files; they merge away when #2794 lands.
