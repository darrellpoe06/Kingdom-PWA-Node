# DR-0750 — L207: The Worker Is Worthy — The Broken Deal, the Cry Yahweh Hears, and the Master in Heaven

- **Status:** accepted
- **Tier:** B
- **Type:** word
- **Date:** 2026-10-02
- **Scope:** `app/src/lib/living-lessons-class.js` (L207, `ll207-the-worker-is-worthy-the-broken-deal-the-cry-yahweh-hears`); `app/src/lib/living-lessons-dates.js`; `app/src/__tests__/living-lessons-l207-verses.test.js` (new); the counts a new lesson moves (`learn-crosslist.test.js` and the six baselines).
- **Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, DECISION-RECORDS
- **Grounds:** DR-0669 (the NAS lesson builder), DR-0610 (one teaching, one lesson), DR-0611 (spoken lessons), DR-0076 (every verse verbatim, proven-to-catch).

## Context

On the day it was sent, the teaching reached the NAS lesson builder the moment its words were written. Row `7c26592b-b596-48ab-824e-6c0c7ee0dba9` (a speaker Darrell was listening to, recorded and sent into the app from his account, transcribed by Whisper on our own machines on nas-cpu, 2026-10-02 15:01:51). Darrell, 2026-10-02, on reading the first cut: *"I didn't speak the last lesson... I agree of course... qualitative and quantitative analysis says the same thing... no arguments with the speaker."* The lesson therefore names the speaker as a speaker Darrell heard and affirms, never as Darrell; the speaker is not named, because the recording does not name him and Darrell has not yet. The rows are one teaching (DR-0610).

## What was measured

The same prompt (sha256 `bed9251195cdd318497359193e42910bf37266d8115e3668f9080d0e63c09b66`) went to 1 writer(s). Every version was gated the same way; the verse gate is a hard stop.

| Writer | Family | Verse spans verbatim | Gates | Elapsed |
| --- | --- | --- | --- | --- |
| cli-local | claude | 253 / 253 | passed | 603287 ms |

## Impact

The teaching reaches the reader as L207 without waiting for the hourly check; the other versions stay stored in `lesson_versions` for comparison.

## Decision

**Placement: Living Lessons, L207.** Shipped version: **cli-local** (primary writer cli-local passed every gate). Darrell sent a spoken recording of a speaker he was listening to, transcribed by Whisper (small) on the NAS CPU with the speakers not marked; the speaker said that corporate America broke its deal with workers, and Darrell affirms the teaching. The lesson tests that complaint against the Word: the wage Yahweh commands, Laban’s ten changed wages, Pharaoh’s bricks without straw, the servant not sent away empty, the cry Yahweh hears, and the Master over every master. It stops where the Word is silent on pensions and policy. It is placed in Living Lessons.

Movements, Word first:

1. The Deal Yahweh Wrote Into the Work
2. Laban Changed the Wages Ten Times
3. Bricks Without Straw
4. Not Sent Away Empty
5. These Were Choices: The Cry That Reaches Heaven
6. Masters Have a Master; Workers Serve Christ
7. Where the Hope Stands, and Where the Word Stops

## Verification

- Every quoted span re-verified against `app/public/bible/kjv` before the push: 253 of 253 verbatim.
- Pinned in `living-lessons-l207-verses.test.js`, with a proven-to-catch one-word change.
- Rows: `7c26592b-b596-48ab-824e-6c0c7ee0dba9`.
- **Corrections after the build (2026-10-02, this PR, by hand):** the builder numbered the lesson L199 because its id scan read only single-quoted `id: 'll…'` entries while L199–L206 are written with double-quoted keys, so it collided with the real L199 and overwrote `living-lessons-l199-verses.test.js`; renumbered to L207 (the next free number), the real L199 test restored from main, the builder's scan widened to both quote styles with a proof. The attribution was corrected from "Darrell spoke" to a speaker Darrell heard and affirms, on his word.
- re-review: 2026-11-01
