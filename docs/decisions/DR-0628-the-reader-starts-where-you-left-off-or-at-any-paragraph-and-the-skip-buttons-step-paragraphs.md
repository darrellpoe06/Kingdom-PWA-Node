---
id: DR-0628
title: The reader starts where you left off, or at any paragraph you pick, and the headset's, car's and lock screen's skip buttons step one paragraph
status: accepted
date: 2026-09-24
tier: A
type: feature
declared_by: Darrell
scope:
  - app/src/lib/reader-bookmarks.js (new) — one bookmark per reading, bounded
  - app/src/components/TTSControl.jsx — Resume button, "Start at" and "Go to" pickers, bookmarks written per sentence, skip buttons handed the paragraph step
  - app/src/lib/use-read-aloud.js — the OS next / previous buttons reach the bar's paragraph step
  - app/src/lib/background-audio.js — nexttrack / previoustrack / seek wired, every button released on stop, PoeTech + app icon on the lock screen
principles: [HOLD-THE-HAND (DR-0621), VERIFICATION-DOCTRINE (DR-0076), APP-IS-PRIMARY (DR-0065), DECISION-RECORDS (DR-0011)]
grounds:
  - DR-0627 — the reader keeps playing when you switch apps
  - DR-0552 — the way back to a reading after leaving the page
source: 2026-09-24 — Darrell, relayed by the orchestrator, after the background-player report
---

## Context

Darrell, 2026-09-24, right after the background player (DR-0627): "start where I left off" in the player, and "starting at any chapter or step, not just beginning to end." He also asked that the same steps be reachable from the phone's own buttons.

## What was measured

- **One place for the whole app.** `learn-resume.js` keeps ONE place: the lesson opened last. A listener moving between two lessons and a Bible chapter had one place between them. Whichever was read last overwrote the others.
- **The place was invisible.** "Read this lesson — start to finish" already resumed at the saved sentence of the lesson that place named. Nothing on the panel said a place existed or where it was.
- **No way to start in the middle** other than "Start where I tap", which needs the listener to find the words on screen.
- **The skip buttons did nothing.** `background-audio.js` wired only play, pause and stop. A headset's double or triple tap, a car's steering-wheel skip and the lock screen's next / previous reached no handler.
- **The buttons were kept after the reading ended.** Stop cleared the lock-screen card but left the handlers set, so a page that was no longer reading could keep answering the person's headset.

## Impact

Every listener lost their place when they moved between readings, could not begin at a chosen part, and could not step through a reading with the buttons they already had in their hand or on the wheel.

## Decision

1. **One bookmark per reading.** `lib/reader-bookmarks.js` keeps a bookmark keyed by the read target's owner (a lesson, a chapter, a section).
   - Each bookmark holds the sentence, its fingerprint (so a reworded lesson still finds its place), the paragraph and how many there are, and whether the reading was heard to the end.
   - At most 200 bookmarks are kept, the oldest dropped first. Every storage call is guarded.
   - A bookmark is written only for the reading the follow map was built from. A tap-started or whole-page read never stamps a lesson.
2. **Resume, said in paragraphs.** When a reading has a place that is neither the top nor the end, the panel offers "▶ Resume · Paragraph N of M". Pressing it reads from that sentence.
   - The lesson-wide place (learn-resume) still decides what "start to finish" does for the lesson it names. That behavior is unchanged.
3. **Start at any paragraph.**
   - Before reading: "Start at a paragraph…" lays the piece out without reading anything, then lists each paragraph by its first words. Picking one starts the reading there.
   - While reading: a "Go to" list says "now paragraph N of M" and jumps the voice to the paragraph picked.
4. **The phone's own buttons step paragraphs.** Media Session `nexttrack` / `previoustrack` (and `seekforward` / `seekbackward`, which some cars send) call exactly what the bar's ↪¶ and ↩¶ call.
   - Each action is set on its own, so a browser that does not know one action loses only that one.
   - The lock screen shows the reading's title, "PoeTech" and the app icon.
5. **Nothing held when nothing reads.** Stop releases every media button, so the person's own music or podcast keeps its buttons. The buttons come back when a reading is live again, including after a paragraph jump.

## Verification

- `reader-bookmarks.test.js` (8 tests):
  - two readings keep two places;
  - Resume is offered only for a real, unfinished place;
  - the label reads "Resume · Paragraph 3 of 12";
  - Start over forgets the place;
  - at most 200 bookmarks are kept;
  - a device that cannot store never throws;
  - each sentence maps to its paragraph, and each paragraph is labeled by its first words.
- `reader-resume-and-step-picker.test.jsx` (4 tests), mounting the real reader over a real lesson element:
  - Resume reads from paragraph 2;
  - "Start at" lists three paragraphs, reads nothing while listing, and starts at the one picked;
  - `nexttrack` moves one paragraph forward and `previoustrack` one back.
  - Proven to catch: with the reader's hand-off to the OS buttons removed, the skip test turns red.
- `background-audio.test.js` (3 new tests):
  - the skip actions reach the reader. This fails against the previous play / pause / stop wiring.
  - an unknown action costs only itself;
  - stop leaves no handler on any of the seven actions.
- The reader suites (30 files, 309 tests) pass.
- **Not proven here:** that a given headset or car sends `nexttrack` for its double tap or wheel button. That is the phone's and the car's mapping, and needs a real device.

**His 20-second test:**
1. Open a lesson and play it for a moment.
2. Leave the lesson, then come back and open Read Aloud. The panel says "Resume · Paragraph N of M".
3. Press it. The voice starts at that paragraph.
4. Double-tap the headset (or press the wheel's skip). The voice moves one paragraph forward.

re-review: 2026-10-08 — his headset and car test; whether section headings should label the picker instead of first words.
