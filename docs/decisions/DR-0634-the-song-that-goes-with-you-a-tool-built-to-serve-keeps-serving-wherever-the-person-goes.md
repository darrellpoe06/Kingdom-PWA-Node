---
id: DR-0634
title: Sovereign A.I. week 29 — the song that goes with you; a tool built to serve keeps serving wherever the person goes, like a radio in the background, pointing to the Keeper who never slumbers (from Darrell's spoken teaching, "Lesson.")
status: accepted
date: 2026-09-24
tier: B
type: word
declared_by: Darrell
scope:
  - app/src/lib/sovereign-ai-class.js (the sov29 module; SOVEREIGN_AI_META.weeks 28 -> 29)
  - app/src/__tests__/sovereign-ai-verse-integrity.test.js (SOV29_FRAGMENTS + SOV29_CORPUS + SOV29_ALLOWED + describe block)
  - app/src/__tests__/sovereign-ai-class.test.js, learn-crosslist.test.js, course-band-coverage.test.js + baseline, course-quotation-integrity and stage-reaches-reader baselines (each count +1)
principles: [WORD-FIRST, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, HOLD-THE-HAND (DR-0621), SPEAK-ESTABLISHED-FACT (DR-0100), TEACH-DONT-DEBATE (DR-0098), VERIFICATION-DOCTRINE (DR-0076)]
grounds:
  - Darrell's spoken teaching, 2026-09-24 4:57pm (below), rendered for meaning per DR-0331
  - DR-0627 — the reader keeps playing when you switch apps; the stand-in voice is real audio from the NAS (merged #1786)
  - DR-0633 — the reader plays like a radio; leaving a tab never stops it (merged #1796, #1797; the code answer to the same spoken word)
  - DR-0637 / DR-0638 — Sovereign A.I. weeks 27 and 28, the same day
---

## Context

On **2026-09-24 at 4:57pm** Darrell spoke this and marked it **"Lesson."**:

> "Leaving a tab should not make the player stop playing. Like the player should be able to play no matter what's going on, whether I move, leave the tab, whether I do whatever, it should still be able to play. It is like a radio in the background. It's like I'm able to use it anytime I want. Stop trying to constrain it, give it the ability to support and do what I'm asking. Praise the Lord. Thanks. In Jesus' name, amen."

**Rendered for meaning (DR-0331):** "Like the player should be able to play" → "The player should be able to play"; everything else is kept as spoken. Earlier the same day he had met the defect on his own phone ("Why doesn't the player remain playing in the background when I switch between apps?!!? Fix it.", DR-0627).

**Placement: Sovereign A.I. week 29**, not Living Lessons. The teaching is about what a technology is for and whom it serves (the philosophy-of-technology spine of this course), its occasion is a defect in this app's own reader, and it continues the same day's weeks 27 and 28.

## What was measured

- **The corpus, not memory.** 52 KJV references were chosen by searching `app/public/bible/kjv` for the Word's own usage on the Word going with a person (Deuteronomy 6:6-9; Proverbs 6:22; Joshua 1:8), the Keeper (Psalms 121), presence that moves (Exodus 13:21-22; 33:14; Matthew 28:20; Hebrews 13:5; John 14:16-17), the lamp that burns always and the ready servants (Exodus 27:20; Leviticus 6:13; Luke 12:35-37), the song in the night (Psalms 42:8; 63:6; 34:1; Acts 16:25; Colossians 3:16), service and faithfulness (Mark 10:45; Galatians 5:13; 1 Peter 4:10; 1 Corinthians 4:2; Proverbs 25:13), and the Word unbound (2 Timothy 2:9; Acts 28:31; Numbers 11:23; Isaiah 59:1; Proverbs 3:27). Psalms 139:8 is not quoted; 139:7, 9-10 carry the point.
- **This house's record (DR-0627), quoted verbatim:** the panel's promise, "the reading carries on when you leave the app"; "On his phone that promise was false. Switching apps stopped the reading."; the per-voice lines now shown; and "Until that run is green, the NAS voice is built and not yet proven live."
- **This house's record (DR-0633), quoted verbatim:** "no surface may silence speech it is not itself speaking". The lesson teaches its measured result: an idle quiz engine's stop had cancelled the one shared synthesizer; after the fix, Chromium measured the same audio advancing about five seconds after the lesson tab was left, at 390, 320 and 1812 px.
- **Not measured:** his own phone test for leaving a tab (re-review 2026-10-01), other devices, and opening a lesson's page from another tab (waits on DR-0642). The lesson names these as open and pins that it does not claim them.

## Impact

Sovereign A.I. grows from 28 to 29 weeks; program lessons, band coverage and the two lesson walks each move by one. The same spoken word was answered in code the same evening (DR-0633) and in teaching here: the lesson tells the reader what was fixed and measured, and names what is still owed so the measuring is tracked work, not an assumption.

## Decision — what his word became

**Sovereign A.I. week 29 — `sov29-the-song-that-goes-with-you-and-the-servant-who-keeps-serving`**. Ten movements, Word first, his framing leading:

1. **The Word goes with you** — Deuteronomy 6:6-9; Proverbs 6:22; Joshua 1:8; Psalms 1:2; Psalms 119:97.
2. **His words** — a radio in the background; the occasion on his phone the same day.
3. **The Keeper never slumbers** — Psalms 121:3-5, 8; Isaiah 40:28; Lamentations 3:22-23; Psalms 139:7, 9-10. **Bright line pinned:** no tool is the Presence of Yahweh, and no player is a Keeper.
4. **The pillar was not taken away** — Exodus 13:21-22; Exodus 33:14; Joshua 1:9; Matthew 28:20; Hebrews 13:5; John 14:16-17. The Holy Spirit abides; nothing we build shares that (pinned).
5. **The lamp to burn always** — Exodus 27:20; Leviticus 6:13; Luke 12:35-37.
6. **The song in the night** — Psalms 42:8; 63:6; 34:1; 1 Thessalonians 5:17; Acts 16:25; Colossians 3:16.
7. **The servant serves** — Mark 10:45; Galatians 5:13; 1 Peter 4:10; 1 Corinthians 4:2; Proverbs 25:13.
8. **Stop constraining it** — 2 Timothy 2:9; Acts 28:31; Numbers 11:23; Isaiah 59:1; Proverbs 3:27. The platform's limits are named plainly; our own constraints are removed.
9. **Our own house the same day** — DR-0627 (switching apps: the real-audio voice) and DR-0633 (leaving a tab: no surface silences speech it is not speaking; mini-player on every tab; Chromium-measured), quoted from their records, with his phone tests owed (re-review 2026-10-01).
10. **The Keeper** — DR-0100 tiers; Philippians 4:19; Isaiah 40:31; Psalms 16:8; closing Psalms 121:8.

In-app: the Read Aloud panel on any lesson (read the per-voice line, switch apps, listen), then his other paths (leave the tab, lock the screen, move), with each person recording what actually kept playing on which device.

## Verification

- **52 KJV references pinned**, every quoted verse filled from `app/public/bible/kjv` by the authoring generator, present in the lesson as `"text" (Ref)`, and re-read from the corpus at test time; 70 quotes in the other fields nest with pinned fragments.
- **Proven-to-catch:** drifting one word of Proverbs 6:22 in the lesson ("it shall keep thee" -> "it shall guard thee") failed 2 tests; restored, the file passed whole.
- **Non-Scripture quotes allow-listed** to his rendered words and the DR-0627 and DR-0633 records.
- **Reader fields carry no record ids**; record ids appear only in the facilitator's talking points.
- **Reading level (authored prose, quotes removed):** child 1.9, teen 4.2, senior 6.0, ascending, with the child band under the 5.0 new-lesson ceiling.

## Re-review

- **2026-10-01** — with DR-0627: the live clip from `voice-lite-probe.yml` and Darrell's phone test; and, with DR-0633, his tap-to-another-tab test on his phone; then bring the lesson's ninth movement up to the measured truth (and teach "Show the text" from another tab once DR-0642 lands).
