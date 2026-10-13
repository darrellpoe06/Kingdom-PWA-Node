# DR-0851 — The voice is handed short, closed sentences, and says dates and record ids as words

**Date:** 2026-10-09
**Status:** accepted
**Area:** read-aloud (the NAS Piper voice, the on-device Piper voice, the studio voice), spoken form
**Principle:** DR-0076 (measure the defect, prove the fix catches it), DR-0653 (one short piece at a time; the L191 gibberish measurement), DR-0381 (cut where a person breathes), DR-0794 (the voice stays clear), DR-0075 (nothing parked without a date)

## Context

Darrell, 2026-10-09, reading L227 aloud in the NAS voice on the Fold, three photographs of the highlighted piece: *"Fix the voice in all locations where it babbles... make sure it's not possible... it undermines understanding for those who can't read"*; *"Everytime it reads this section!!!"*; *"Gibberish!!!!!!! Fix all these issues"*; and the clarification that settles what is measured: *"Not get skipped... just slurred sounds.... not clear anymore... nothing is skipped."*

**What the three pieces have in common, measured.** Each is the piece the reader cut at its breath cap (`clip-queue.js` PIECE_CUT, about 180 characters), and each is ONE clause run with no full stop inside it:

| piece | words | sentence ends inside |
|---|---|---|
| "Rendered for meaning: reading the Word for the Spirit; doing the Word for competent conversations and learning skills; and never reading just to say I got you," | 27 | none |
| "(Matthew 7:21) A reading done to win produces a person who can quote and cannot follow, and that is not a small defect; by the Lord's words it can be the whole defect." | 30 | one, at the end |
| "Change why you open the Book, and say the reason out loud before each reading: not to say I got you, but to become a better person His Way, and then to do His Way." | 33 | one, at the end |

Piper ends a sentence only at `. ! ?` and runs each sentence as one inference (the NAS binary and the on-device recipe alike, `device-voice-phonemes.js`), so each of these reached the model as a single 27-to-33-word utterance. That is the shape DR-0653 measured on L191 at 570 characters, *"degrades into undetectable gibberish... after initially sounding like a man"*, at a smaller size; the 180-character cap removed the worst of it and left the clause runs. The text is the same every time, so the slur is the same every time.

**And the date line before the first piece.** The lessons carry the day they were spoken as an ISO date; espeak phonemizes "2026-10-09" as *"two thousand twenty-six dash ten dash zero nine"* (measured with the same phonemizer the on-device voice uses). A record id ("DR-0848") is spelled letter by letter, and "L227" is said *"ell two hundred twenty-seven"*.

## What was measured

Across the live catalog, every piece of every Living Lesson, in spoken form, before and after the shaping:

| | pieces | pieces with a sentence over 18 words | longest sentence |
|---|---|---|---|
| before | 33,878 | 14,299 | 50 words |
| after | 33,878 | 894 | 37 words |

The 894 that remain carry no comma or joiner past a four-word head to cut at, and are handed whole; the catalog gate requires exactly that and nothing more. 65 pieces carried an ISO date; 321 lesson fields across 108 lessons do.

## Impact

- `app/src/lib/synthesis-text.js` (new, pure): `synthesisSentences` and `forSynthesis`. A clause mark that ends a thought (`;` or `:` followed by a word) becomes a full stop; a sentence over `MAX_SENTENCE_WORDS` (18) is cut at its last comma inside the window, else before `and / but / so / because / which / while / then`, else at the first safe point after the window; every piece ends with a stop. Numbers keep their shape ("2,450", "3:16 pm"); a spoken reference has no colon by then.
- `app/src/lib/use-read-aloud.js`: every piece handed to the NAS lite voice and the studio voice, and every clip-cache key, now uses the shaped text, so a piece spoken the old way is never served from the device cache for the new. `lesson-downloads.js` saves and keys the same way. `device-voice.js` shapes before the on-device engine.
- `app/src/lib/speech-text.js`: `sayDatesAndRecords`: "2026-10-09" is said "October 9, 2026"; "DR-0848" is "decision record 848"; "REV-0256" is "review 256"; "L227" is "lesson 227". `speech-shape.js`: the typed double hyphen is a breath, as the em-dash already was.
- The written page, the highlight and the follow map are unchanged: the shaping is spoken form only.

## Decision

Hand every VITS voice short, closed sentences, always, as a property of the reader and not of any lesson's prose; say dates and record ids as words. The three photographed pieces are pinned in the gate, and the catalog gate holds the structural claim for every piece.

**What is not claimed (DR-0076 §8):** the slur was heard, not recorded, and this machine cannot play the voice. What is measured is the shape of the pieces that slurred and the shape they are handed in now. `re-review: 2026-10-16` — read L227 and L224 aloud in the NAS voice on the Fold and confirm the three pieces are clear; if any still slurs, lower `MAX_SENTENCE_WORDS` and measure again, and consider capping the pace asked of Piper below 2x.

## Verification

- `app/src/__tests__/synthesis-text.test.js`: the three pieces are long single sentences today (the defect, measured); each is handed as short closed sentences, no word lost; a short sentence is unchanged; a trailing comma is closed; numbers and references keep their shape; a sentence with no safe cut is handed whole; the comma cut respects the minimum head; and the catalog gate across all 33,878 pieces.
- `speech-text.test.js` and `speech-shape.test.js` green with the date and record forms and the double hyphen; the voice, clip, download, reader and trip suites green (370 cases) with the shaping wired in.
- Lint clean; every gate green before the push.
