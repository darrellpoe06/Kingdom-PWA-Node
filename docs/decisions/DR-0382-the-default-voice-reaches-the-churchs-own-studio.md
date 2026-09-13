# DR-0382 — The default voice reaches the church's own studio

- **Date:** 2026-09-13
- **Status:** accepted
- **Tier:** B
- **Type:** orchestration
- **Shipped in:** #1562 (which named this record in its title before the record existed — see the note at the end)

## What was asked

Darrell, 2026-09-13: *"Also the text to speak aspect needs to be better at the words sounds... can we get close to humans when talking or do we still have to sound like a computer no offense?"* Then, twice: *"do the voice fix."*

## The two halves, and why they are separate

Naturalness is two independent problems and fixing one does not touch the other:

1. **RHYTHM — what we hand the engine.** A reader sounds mechanical largely because of where it breathes and what it is forced to shout. `lib/speech-shape.js` (new) softens ALL-CAPS emphasis to ordinary words before the engine ever sees it, normalises typographic punctuation, un-shouts book names, and cuts breath segments at real clause boundaries — after `; : ,` and *before* `and but or so` — instead of at arbitrary lengths. `tts.js` `segmentText` now delegates to it while preserving the exact-substring property `read-follow.js` needs for follow-along highlighting, so the fix costs nothing in the reading highlight. Shipped in #1561.
2. **TIMBRE — which engine.** Shipped in #1562, and the blocker was one hardcoded word: `voice-service.js` refused the built-in voice id outright, so the System voice never reached the church's own sovereign studio and always fell back to the browser's robot. It now takes an `allowBuiltIn` flag with a runtime probe (`'unknown' | 'yes' | 'no'`) that remembers what the studio actually answered, and `use-read-aloud.js` routes the System voice to the studio when it is ready and has not already refused.

## The honest limit

**The sovereign built-in voice probe is unanswered until a real read happens on a real device.** The routing is proven in tests; whether the studio returns a better-sounding voice than the browser's is a measurement nobody has taken yet. Claiming "it sounds more human" without that measurement would be exactly the class of claim DR-0076 forbids. **re-review: 2026-09-20**, with the live poetech.us pass already carried from the door-feedback chain.

## Note on this record

#1562 named `DR-0382` in its commit title and shipped no decision file — the record was written after the fact, on 2026-09-13, when the gap was found while committing the next change. Its number is kept as published so the merged commit's reference resolves. **#1558, #1559, #1560 and #1561 shipped with no decision record at all**; that gap is logged in `INDEX.md` with a date rather than quietly backfilled here, because inventing the reasoning after the fact is worse than recording that it is missing.
