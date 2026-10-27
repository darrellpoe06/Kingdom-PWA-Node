# DR-1251: A lesson played to the end is read, the reader never ends a lesson on a fault, and the Latest list says what the course list says

**Date:** 2026-10-27
**Status:** Accepted
**Area:** `app/src/components/Presenter.jsx`, `app/src/components/ChurchLearn.jsx`, `app/src/components/LatestLessons.jsx`, `app/src/components/TTSControl.jsx`, `app/src/lib/learn-organize.js`, `app/src/lib/lesson-order.js`, `app/src/lib/learn-resume.js`, `app/src/lib/tts.js`, `app/src/lib/clip-queue.js`, `app/src/lib/clip-cache.js`, `app/src/lib/use-read-aloud.js`
**Follows:** DR-0754 (the class record), DR-0631 (one place record), DR-0686 / DR-0687 (the Latest list and its days), DR-0715 (both numbers), DR-0732 (the month heading), DR-0076 (verification), DR-0219 (SHOULD / ARE / GAPS / CLOSE)

## Context

Darrell, 2026-10-27, three screenshots of the live Learn tab: the Class
record ("50 lessons read, average 100%"), a course's own lesson list
(October 2026 · 56 · 56 for every age, a ▶ Play and a Continue on every row),
and the Latest list (October 2026 · 89 lessons · 444 readings, a bare title
per row). His words, in order:

> *"Lessons tab is not giving the count or the play buttons etc... are we
> counting the reading of students accurately and effectively?"*
> *"Also we have a couple of duplicates lessons now?"*
> *"Even the count is different for lessons and latest with the same courses?"*

## SHOULD

- A read is a read however the lesson was read (DR-0754: "the two facts that
  answer him are already written as a lesson is marked read"). ▶ Play is the
  door he asked for by name — *"Play Button reads the lesson!!!!!"*
  (ChurchLearn.jsx, 2026-09-14) — so a lesson played whole must count.
- The Latest list is "every lesson in the mounted catalog ... each naming its
  HOME course" (learn-organize.js latestLessons), one row per lesson.
- Two lists of the same lessons say the same things about them (DR-0732 gave
  the course list its "for every age" number; DR-0715 gave the Latest list its
  readings number; nothing said they should differ).

## What was measured (ARE, before any change)

1. **Play recorded nothing.** The record has two writers: the tap on "Mark
   this lesson done", and a finished *place* filed by the course view when it
   mounts (ChurchLearn.jsx, the DR-0754 follow-up). The in-space reader
   finishes a place when its read-aloud speaks the last sentence
   (TTSControl.jsx:545). The Presenter deck that ▶ Play opens never called
   `recordPlace` or `finishPlace` at all (grep of the component: zero), and
   its read target is owned per slide (`presenter-<id>-<idx>`), so TTSControl's
   rule `t.owner === place.lessonId` never matched. A lesson read whole
   through Play — walked part by part, or read aloud to its end — was not a
   read. The record's "lessons read" undercounted exactly those.
2. **Two pairs shared a title in the Latest list** (849 rows, mounted and
   read from the DOM): L153 "Precept upon precept" beside Sovereign A.I.'s
   sov18, which is L153 carried whole under `sharedWith` (one source, two
   doors); and L17 "Taste and See" beside the Eternal Wisdom algorithm of the
   same name — two different lessons from the one question he spoke on
   2026-07-10.
3. **The two headings counted different things.** The course list's month
   heading: lessons and "for every age". The Latest list's: lessons and
   readings. Same lessons, two different second numbers, no third.
4. **A Latest row had no ▶ Play and no Continue / FINISHED mark.** Both were
   on every row of the course list.
5. Not a gap: "23 of 260" for Living Lessons is the real mounted count (260
   ids up to ll263 with three excused holes), and the four numbers in the
   Class record add up from the rows (2+6+23+3+7+1+8 = 50).

## Decision

- **The deck says once when it was read to the end** (`onFinished` on
  Presenter): every point of the last part shown after the reader moved
  through the deck, Next pressed on the last point, or the read-aloud asking
  for the part after the last one. Never on opening — a one-part deck is not
  read by being looked at; only the reader's own Next counts as moving, so a
  reading that *arrives* at the last part still has to hear it.
- **The course view finishes the place and files the read at once**
  (`finishPlace` + the existing filer, now a function called on finish and on
  close), not on the next sign-in.
- **A lesson carried whole into a second course is listed once, at home**;
  the home row says "also taught whole in <course>"; the count line says
  "One lesson carried whole into a second course is listed once, at home."
  A copy whose home is not mounted is listed itself — a real lesson never
  vanishes. Two different lessons with one title stay two rows and each
  names the other ("same title, another lesson: ...").
- **Both month headings say the same three numbers**: lessons · readings ·
  for every age, measured from the age versions each lesson really carries
  (DR-0715), by one shared rule (`forEveryAge`, learn-organize.js).
- **A Latest row carries the same ▶ Play and the same Continue / FINISHED
  mark** as the course list's row, from the device's own record.

## Verification

- `the-deck-says-when-it-was-read-to-the-end.test.jsx` — silent on opening,
  once at the end, once only; one-part deck; read-aloud past the last part;
  proven-to-catch (a deck nobody moves through never says so).
- `a-lesson-played-to-the-end-is-read.test.jsx` — the real catalog, driven
  his way: Latest → ▶ Play → walked to the last point → the place is done and
  `toggleModule(id, 'living-lessons')` is called once; opened-and-closed files
  nothing.
- `the-latest-list-carries-what-the-course-list-carries.test.jsx` — once at
  home, the pair naming each other, every age flagged, ▶ Play on every row
  (none without a handler), Continue / FINISHED from the record, the three
  numbers on the heading.
- `learn-sort-every-option.test.jsx` and `lesson-age-versions-count.test.jsx`
  re-pinned on the real catalog: 848 rows listed of 849 mounted, sov18 named
  as the one carried, the month numbers summing to the list's.

## The reader: "Not one stone will not play all the way through"

Darrell, the same hour: *"Not one stone lesson will not play all the way
through the lesson!!!!!!!!!!!!! Fix it.... the tts or reader is worse than
ever!!!!!!!!!!!!!! Fix it so it actually works great!!!!!!!!!"*

**Measured first.** L263 cut by the reader's own pipeline: 266 pieces in the
adult reading (277 / 261 / 286 / 305 for child / youth / teen / senior), the
longest 181 characters, no empty piece, nothing the spoken form drops, the
longest sentence 21 words. The text is not the fault. The NAS voice's own
witness (`voice-lite-health.yml`) was green every day this week. The faults
were in how the two playback roads answered a hiccup:

1. **The device voice ended the lesson on any error.** `lib/tts.js` answered
   every utterance error except interrupted/canceled with `_finish()`: status
   idle, position reset to the top — the same state change a reading to the
   end makes. `TTSControl` took "the piece ended on its own" at its word and
   moved to the next piece. One `synthesis-failed` or `audio-busy` at
   sentence 80 of 266, the kind a phone throws when a notification sounds,
   and the rest of the lesson was never heard.
2. **The NAS voice hung on a bad piece.** `lib/clip-queue.js` listened for
   the element's `ended` and nothing else. A piece the element could not
   play fired `error`, never `ended`; the queue waited forever with the
   panel still saying it was playing. And `lib/clip-cache.js` kept any blob
   with a size — an error page or a cut-off body that arrived with a 200
   went under the piece's key and was served on every later reading, so the
   same lesson stopped at the same sentence every time.

**Closed.**

- A faulted sentence is spoken again once (`ERROR_RETRY_MS`); a second fault
  HOLDS the reading on that sentence — position kept, `heldAt` / `heldWhy`
  reported — and the control neither moves on nor calls the lesson finished.
  The notice says the sentence it stopped at; the next play goes on from the
  bookmark, which is that sentence. A clean end gives the next fault its own
  retry.
- An element error, or a piece that has not begun `STALL_MS` after play()
  was accepted, asks for the piece again once, fresh from the voice with the
  kept copy forgotten (`createClipSource.fresh`, `cache.del`); a second fault
  hands the rest on as a fetch failure always did (the device voice, with
  the notice saying so). A fault inside the joined file drops the join and
  carries on piece by piece from the sentence it was at.
- Only audio is ever kept or served: a blob whose own type names something
  that is not audio (an error page as text/html, a JSON refusal) is never
  kept, and a kept one is dropped and the piece fetched again
  (`voice-lite-not-audio`). A blob with no type is trusted; whether it
  decodes is the player's call, and one that does not is fetched fresh.

**Proof.** `the-engine-holds-its-place-on-a-fault.test.js` (retry once, hold
with the position kept — proven-to-catch against `_finish()` resetting to 0 —
interrupted still ignored, a clean end re-arms the retry);
`the-queue-never-hangs-on-a-bad-piece.test.js` (error → fresh → second error
hands on; no refetch road → hands on at once; joined fault → pieces from the
same sentence; stall watch; the audio check and the cache's forget);
`the-reader-does-not-move-on-after-a-fault.test.jsx` (the run stays on the
piece while the engine holds; proven-to-catch: a plain end still turns the
page).

**What this cannot prove from here.** The sandbox cannot hear his phone. If
L263 still stops after this lands, the trip that rides with his feedback
(DR-0744) names the piece and the reason; that is the next measurement.

## Not done, and why

- The in-space reader still finishes a place only when the read-aloud speaks
  the last sentence or the guide's last unit is reached; a lesson *scrolled*
  silently to its end in its own space records the place but not a finish.
  `re-review: 2026-11-10` — measure how many finished places come from Play
  versus the space before deciding whether a scrolled-to-the-end read should
  count.
