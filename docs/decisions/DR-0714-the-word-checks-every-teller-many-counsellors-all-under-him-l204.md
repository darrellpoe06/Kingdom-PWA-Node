# DR-0714 — L204: The Word Checks Every Teller — Many Counsellors, All Under Him

- **Status:** accepted
- **Tier:** B
- **Type:** word
- **Date:** 2026-09-30
- **Scope:** `app/src/lib/living-lessons-class.js` (new lesson `ll204-the-word-checks-every-teller-many-counsellors-all-under-him`); `app/src/lib/living-lessons-dates.js` (its day); `app/src/lib/lesson-dates.json` (derived); `app/src/__tests__/living-lessons-l204-verses.test.js` (new, proven-to-catch); `app/src/__tests__/living-lessons-id-collision.test.js` (203 held).
- **Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, DR-NUMBER-ALLOCATION, DECISION-RECORDS (and, by record: teach the Word, do not debate it, DR-0098; render his words for meaning, DR-0331; Yahweh in our voice, quoted KJV untouched, DR-0210)
- **Grounds:** CLAUDE.md, Spoken Teachings Are Build Input (2026-07-03); DR-0331; DR-0098; DR-0076; DR-0210; DR-0677 (counts are derived); DR-0690 (L202, the worked example and model lesson).

## Context

On 2026-09-30, while L202 (a Bible study from the weekly 1 p.m. class at The Church of the Living God in Champaign, Illinois, named for Bishop Gwin) was being fixed, Darrell wrote a short teaching into the build session. His words, as sent:

> "Also testing our system for creating a lesson... To make sure it works to our specifications etc... Word sourced and researched outside of the teller... so it corrects using what we all should use... Hopefully we create Ai courses for our children in our communities to use without needing a specific teacher... anyone can use Ari and our kids could ask questions to our local LLM Hopefully in the near future... Multitude of counsellors there is safety... Our counselors also being corrected by the Word... so we all agree with Him first! Lesson"

He ended it "Lesson", so it is build input and becomes a lesson the same session.

**Placement and number.** Devotional, so Living Lessons. `origin/main` (9faac105, then d5e15304) ends at L202. The brief said another session is adding L203, a promise-line lesson, in the same file. No branch, open PR or `claude/*` ref carried an `ll203-` id when checked (`git grep` over the 40 most recent `claude/*` refs; open PR list). So this lesson takes **L204**, and 203 is held in `KNOWN_MISSING` in the collision gate, exactly as 193 was held for L193 (DR-0646). The merge that brings L203 in deletes the entry. It first took DR-0698, which the lesson-share PR (#1906) also claimed, so it was renumbered to DR-0714 on 2026-09-30 (DR-0708 to DR-0713 are claimed by other open PRs).

**What exists, checked before any claim (P58, P59).** `app/src/lib/ari.js` defines Ari as the app's AI and describes him as "a made tool that can be wrong". `app/src/lib/class-tutor.js` is the lesson guide: `tutorEndpoint()` is the same-origin `/llm/chat`, `TUTOR_MODEL` is `qwen2.5` on the NAS's own Ollama, and when the route does not answer the UI falls back to the authored lesson and "never fabricates an LLM answer". The file itself says the path degrades until "that server + its /llm/* Caddy route are stood up". So the lesson says only that the guide *is written to ask* a model on our own server and shows the written lesson when it does not answer. The children's course and asking our own AI anything are stated as a hope and a direction, in every band.

## What was measured

- Every quoted span checked by the repo's `scanQuotedVerses` against `app/public/bible/kjv`: **126 quoted spans, 126 verbatim, 0 faults**; every double-quoted span carries its reference.
- Each verse was fetched from the KJV JSON before it was written (never from memory), including every one the brief named: Proverbs 11:14, 15:22, 24:6; Acts 17:11; 1 Thessalonians 5:21; Isaiah 8:20; 2 Timothy 3:16-17.
- Bands, measured by the repo's gate functions on the lesson in place: full-levels shares child 0.54, youth 0.67, teen 0.67, senior 0.81 (adult 1,339 prose words; floors 0.5 / 0.6); reading grade child 2.0, youth 3.5, teen 4.4, senior 5.2, adult 5.6 (ascending; child under the 5.0 new-lesson ceiling); worst band overlap 0.07 (ceiling 0.5); every band names its lesson in its opening; no plain-meaning faults.
- Our prose says Yahweh; the only "God" outside a quotation is the church's own name, The Church of the Living God.

## Impact

Darrell's short lines name the rule every lesson in this app already runs on, and until now that rule lived only in gates and decision records. With L204 it is taught where the family and the church read: the teller is honored and checked; many counsellors are safe only under the Word; Ari and our own AI are counsellors that are corrected like everyone else; and agreement starts with Yahweh. L202 is walked as the proof the process runs. The hope for our children's courses is recorded in the app as a hope, so no reader is told something is live that is not.

## Decision

L204, **The Word Checks Every Teller — Many Counsellors, All Under Him**, joins Living Lessons with seven movements and a close, four authored bands, an eight-question quiz, eight facilitator talking points and ten benefits:

1. **Testing how we make a lesson.** His framing: the Word sourced and researched outside the teller.
2. **The Word checks every teller.** Acts 17:11-12; Galatians 1:8; Isaiah 8:20; 1 Thessalonians 5:21; Proverbs 30:5-6; Matthew 4:4.
3. **L202, the worked example.** Recorded on a phone, transcribed on our own server by Whisper, every verse checked in the KJV, each mishearing corrected by the verse the class had open.
4. **In the multitude of counsellors there is safety.** Proverbs 11:14; 15:22; 24:6; 12:15; 2 Corinthians 13:1; Psalms 119:24.
5. **Our counsellors are corrected by the Word.** Acts 15:6, 15, 28; Acts 18:24, 26; 2 Timothy 3:16-17; Hebrews 4:12.
6. **So we all agree with Him first.** Amos 3:3; Romans 3:4; John 17:17; Proverbs 3:5.
7. **The hope: courses for our children.** Deuteronomy 6:6-7; Isaiah 54:13; 2 Timothy 3:15; Psalms 119:99; Luke 2:46; James 1:5; John 14:26. Stated as a hope, never as live.

And the close: Isaiah 40:8. Jesus is confessed as the Lamb of Yahweh and the Eternal Son of Yahweh. The Word is taught, not debated (DR-0098): no schools are staged. Counts are derived (DR-0677).

## Verification

- `living-lessons-l204-verses.test.js`: fields; number 204 after L202, date, one lesson; his framing and the movements in order; Ari named and "checked/corrected" in every band; the hope pinned as a hope in the lesson, every band and the facilitator notes; the one built claim pinned to the code (`tutorEndpoint() === '/llm/chat'`, `TUTOR_MODEL === 'qwen2.5'`, the fallback and no-fabrication lines in `class-tutor.js`, "a made tool that can be wrong" in `ari.js`); every span verbatim; every quotation carries its reference; straight quotes, no elision, no record id, no percentage; the counsel and checking verses pinned to the KJV; Yahweh in our voice with quoted God untouched; the Lamb confession; the four band gates.
- **Proven to catch**, in the suite: Proverbs 11:14 misquoted ("wisdom" for "safety") fires the verbatim scan; Amos 3:3 re-pointed to 3:4 fires it; a planted generic "God" fires the voice check.
- The collision gate holds 203 for the parallel L203, with the deletion instruction written beside it.
