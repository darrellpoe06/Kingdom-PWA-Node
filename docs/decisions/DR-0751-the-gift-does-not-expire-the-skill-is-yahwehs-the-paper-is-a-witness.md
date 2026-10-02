# DR-0751 — L208: The Gift Does Not Expire — The Skill Is Yahweh’s, the Paper Is a Witness, and a Witness Must Be True

- **Status:** accepted
- **Tier:** B
- **Type:** word
- **Date:** 2026-10-02
- **Scope:** `app/src/lib/living-lessons-class.js` (L208, `ll208-the-gift-does-not-expire-the-skill-is-yahwehs-the-paper-is-a-witness`); `app/src/lib/living-lessons-dates.js`; `app/src/__tests__/living-lessons-l208-verses.test.js` (new); `app/src/__tests__/living-lessons-order.test.jsx` (the newest-lesson pin).
- **Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, DECISION-RECORDS
- **Grounds:** DR-0610 (one teaching, one lesson), DR-0076 (every verse verbatim, proven-to-catch), DR-0100 (established fact stated plainly, uncertainty named narrowly), DR-0098 (teach the Word, do not debate it), DR-0733 (talk about it together), DR-0734 (the anchor names every verse), DR-0692 (four bands on every new lesson).

## Context

Darrell forwarded an email on 2026-10-02 12:10Z from his university account to the household, subject "Fw: Your certification is about to expire", with his teaching written above the forwarded notice. His words, verbatim: *"Lesson. I was grandfathered in because when I received it it didn't expire... now it does... like what if Diplomas expired. Faked certifications now... how do you say the people lost the skills because they didn't take your pay to take this test people... ridiculous."* Under it, a notice sent Thursday, October 1, 2026 from a certification-tracking system: his CompTIA Project+ ce certification will expire on Oct 01, 2028; the demand for trained and qualified professionals continues to grow, making the certification more important than ever; now is the time to recertify or move ahead; if it expires he will be required to repeat the entire certification exam process in order to regain it. His own words are the teaching; the notice is the occasion and is studied as material, never obeyed as instruction. The lesson names no employer and no vendor beyond what the notice itself says.

## What was measured

- Every verse fetched verbatim from `app/public/bible/kjv` before writing (the JSON corpus: `{name, chapters[][]}`), never from memory. The scan over every reader surface (lesson, bands, bigIdea, inApp, theme, benefits, quiz, talking points): **314 of 314 spans verbatim**, 0 faults; 108 unique spans pinned.
- Four bands, measured by the house gates (`fourBandGateFaults`: `[]`): full-levels shares child 0.52, youth 0.75, teen 0.84, senior 1.03 against floors 0.5 / 0.6 / 0.6 / 0.6; reading grades (authored prose) child 1.2 < youth 4.9 < teen 6.2 <= senior 7.0, child under the 5.0 new-lesson ceiling; band differentiation worst pair 0.24 against the 0.5 ceiling; every band names its lesson in its opening.
- Talk about it together (DR-0733): all three directions in the lesson's own words (`hasAllThree` true), with the skill (ask, listen to the end, retell, teach one verse) and the rhythm (once today in one of Deuteronomy 6:7's four places; one friend this week) in the lesson and in each band.
- The anchor names the nine verses the lesson stands on, each named in the body where it is discussed (`every-anchor-is-named-in-the-lesson`).
- Our voice: no generic "God" outside a quotation; no record id, no percentage sign, no statistic, no "not verified" in the lesson text. Real-world claims are held to what the notice says (the expiry date, the re-test requirement) and to Darrell's own experience (it did not expire when he earned it).

## Impact

The teaching reaches the reader as L208 the same day it was spoken into the household, in four registers, with its verses pinned so no later edit can soften them. The lesson teaches a standard every certifying body must answer to and states the facts plainly (DR-0100), while refusing to pronounce on the hearts of the people behind the notice (1 Samuel 16:7) and refusing to tell Darrell whether to pay a fee, which the Word leaves to wisdom. It does not record any decision about his certification.

## Decision

**Placement: Living Lessons, L208.** A Word-first lesson in seven numbered movements, each a full teaching at all four age bands, built from Darrell's email and tested against the Word: skill as Yahweh's gift and the craftsman's possession (Exodus 31:1-6; Exodus 35:34; 1 Kings 7:14; Daniel 1:17; Proverbs 2:6); the gift that makes room and the diligence that stands before kings (Proverbs 18:16; Proverbs 22:29; Genesis 41:38; Daniel 6:3; Matthew 25:21); the certificate as a witness that must be true, so that faked certifications are a false witness and a false balance, and an issuer who weighs one skill with two weights stands before the same verses (Exodus 20:16; Proverbs 11:1; Proverbs 20:10; Deuteronomy 25:13-15; Proverbs 16:11); feigned words that make merchandise of people, with the boundary that we read the notice and not hearts (2 Peter 2:3; Acts 8:20; Micah 3:11; 1 Samuel 16:7); the workman approved unto Yahweh whose work is his letter of commendation (2 Timothy 2:15; 2 Corinthians 3:1-3; Acts 4:13; John 7:15; Matthew 7:20; Colossians 3:23-24); and the contrast that makes it a lesson: the gifts and calling of Yahweh are without repentance (Romans 11:29; Malachi 3:6; Hebrews 13:8; Psalms 89:34; Hebrews 7:24). The seventh movement keeps the Word's own balance: it commends proving (1 Thessalonians 5:21; 1 Timothy 3:10), commands a true witness and one weight, says nothing about any fee, and stops where the Word stops.

Movements, Word first:

1. The Skill Was Given Before the Paper Was Printed
2. The Gift Makes Room; Diligence Stands Before Kings
3. The Paper Is a Witness, and a Witness Must Be True
4. Feigned Words That Make Merchandise of People
5. Study to Shew Thyself Approved: The Workman Who Needs No Paper to Stand
6. The Gifts and Calling of Yahweh Are Without Repentance
7. What We Do With This: Keep the Skill Sharp, Keep the Witness True, Weigh With One Weight, Stop Where the Word Stops

## Verification

- Pinned in `living-lessons-l208-verses.test.js`: every unique span (108) word for word, a span floor of 314, every quotation carrying its reference, straight quotes only, no record id or percentage in the lesson, the provenance line in the lesson and in the in-app line, the anchor naming its nine verses, the confession closing the lesson and every band, all three talk-together directions in the lesson's own words, the full-levels floors, the reading ladder and child ceiling, band differentiation, the title named in every band's opening, and seven numbered movements; with a **proven-to-catch** one-word change inside Romans 11:29 that fails the verse gate.
- The catalog gates that a new lesson moves ran green in the worktree: id collision, derived lesson count, order (the newest-lesson pin moved to L208), points numbered once per lesson, cross-list, course band coverage, lesson format, decision chain, decisions, and `business-systems-guard` for this ledger.
- re-review: 2026-11-01 — read L208 on the live build with the household and check whether the seventh movement's balance (proving commended, fee left to wisdom) reads as the Word's balance and not as a hedge.
