# DR-1686: let them speak — the Prophetic Voices teach what they said

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B — curriculum content on a COLG-facing course; additive, no schema, no money, no road
**Type:** content
**Area:** `app/src/lib/prophetic-voices.js`, `app/src/lib/prophetic-voices/*.js`, `app/src/lib/lesson-figures.js`, `app/src/lib/lesson-video.js`, `app/src/components/LessonVideo.jsx`, `app/src/components/learn-studio/LessonExperience.jsx`, the Learn records
**Pairs with:** DR-0076 (verification), DR-0098 (teach the Word, do not debate it), DR-0100 (speak established fact), DR-0210 (say Yahweh), DR-1287 (people in lesson pictures), DR-1468 (the corpus writes the verse)
**Session notes:** `docs/99-session-notes/2026-11-26-prophetic-voices-let-them-speak.md` (the narrative), `docs/99-session-notes/2026-11-26-prophetic-voices-research-leads.md`, `docs/99-session-notes/2026-11-26-leaders-lessons-inventory.md`

## Context

Darrell, 2026-11-26: "They said more than we show", "let them speak and site
them as they are", "grace and mercy... however no lies!!!".

## What was measured

- The six lessons kept their birth length (281-445 words, #540, 2026-07-03):
  written from listings, never from the messages.
- Primary sources now read: UNESCO General History of Africa vol. II and the
  1978 proceedings, African Origin, Destruction of Black Civilization, Munroe's
  books. Darby's dates: born 1972 (his ministry's channel, 2026-11-12), died
  December 2017 (Lawrence-Harper 2023); the lesson said 2021.
- Of 92 catalog lessons built on a named teacher, 11 teach his own words.

## Decision

1. Each voice teaches his own message lesson by lesson (`lib/prophetic-voices/`):
   Munroe (new) 13, Diop 6, Obenga 4, Williams 5. His lines verbatim only from a
   fetched source, page-cited; the Word weighs and, where he goes past it,
   corrects that claim narrowly; grace and mercy, no over- or under-claim.
2. Real photographs where a free license exists (Diop, Obenga); a photograph
   carries `photographOf` + `license`, not DR-1287's drawn-people label. Price,
   Darby, Munroe: pending permission.
3. Price's opener plays his own broadcast ("His own message"); the new-look
   lesson screen now plays lesson videos.
4. Price and Darby (at least ten each) follow in their own PRs, then Malcolm X.

## Impact

The course grows from 6 lessons to 31, each 1,400-1,900 adult words.

## Verification

- 0 verse faults by the repo's own scanners; `every-store-of-his-words` reads
  the new folder (251 green); new proven cases in `lesson-figures` and
  `lesson-video`; allFour 327 -> 352; 1020 of 1020 lessons dated.
- `re-review: 2026-12-03` (Price and Darby landed, the host card cleared).
