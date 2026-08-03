---
id: DR-0265
title: The voice follow-along constraints are FIXED — tap-to-start follows, the lesson read follows, cloned-voice audio follows at sentence level
status: accepted
date: 2026-08-03
tier: A
declared_by: Darrell ("fix the voices issues constraints")
supersedes: the three carried items in DR-0264's constraints section (two closed, one narrowed)
builds_on: [DR-0264 (follow-along + secure space), DR-0144 (start where I tap), the 2026-07-30 read-target, DR-0076, DR-0100]
principles: [COMMUNITY-FIRST, VERIFICATION-DOCTRINE, NOTHING-WAITS (DR-0236)]
---

## Directive

Darrell, 2026-08-03: **"fix the voices issues constraints."** DR-0264 carried
three; this closes what code can close, same session:

## Fixed

1. **"Start where I tap" now follows.** The tap resolves to its exact
   character (caretRangeFromPoint / caretPositionFromPoint), the character to
   its sentence in the page map (`segmentIndexAtDomPoint`), and reading
   starts AT that sentence with the highlight tracking from there — slicing
   the mapped text at a sentence boundary keeps engine-segment ↔ screen-range
   alignment exact. Unresolvable taps fall back to the legacy unmapped read
   (speech always works).
2. **"Read this lesson start-to-finish" now follows.** The open lesson's own
   card is mapped and the registered FULL text aligned to it
   sentence-by-sentence (`alignSegments`, moving-cursor — never a guess). A
   spoken passage that is not rendered (a paced tutor step) carries NO
   highlight rather than a wrong one; everything on screen highlights and
   scrolls. Word-level stays off in this mode by design (alignment is
   per-sentence).
3. **Cloned-voice (cloud) audio now follows at sentence level.** The clip has
   no word timings, but its playback fraction maps through character weight
   (`segmentIndexAtFraction`) to the sentence being spoken — the audio
   element reports progress and the highlight walks the page with it.
   Estimation, honestly named: uniform speech rate approximates position;
   sentence granularity absorbs the error.

4. **The panel gets out of the reader's way** (same-sitting screenshot: "the
   read along blocks the readers page with the data being read"). While the
   voice is reading, the full Read Aloud card collapses to a slim pill —
   Reading…/Paused, ⏸/▶, ⏹, and an expand ⌃ — so the page and its moving
   highlight stay visible; stopping (or expanding) brings the full card back.

## The honest remainder (narrowed, not hidden)

- **Word-level timing on cloud audio** needs the voice service to return
  per-word timestamps — a sovereign voice-studio upgrade, not a client fix.
  re-review: 2026-08-24 (unchanged date, now the ONLY cloud gap).
- **Word boundaries on device voices** remain engine-dependent (many Android
  voices never fire them) — a platform fact; the sentence floor is universal.

## Verification

`read-follow.test.js` (+3, 10 green): tap→sentence resolution incl. the
honest -1; alignment highlighting rendered text and returning null for
unrendered passages; fraction→sentence weighting incl. empty-input -1. Full
suite + lint green before merge; the ear-and-eye pass on real hardware is the
live witness.
