---
id: DR-0285
title: The reader serves the listener — closing never silences, the reading survives leaving the app, and the follow map is built from what is actually on screen
status: accepted
date: 2026-08-10
tier: A
declared_by: Darrell (seven reports from the phone in one sitting)
builds_on: [DR-0264 (follow-along), DR-0265 (follow constraints fixed), DR-0278 (the highlight never painted), DR-0076, DR-0100, DR-0239]
principles: [COMMUNITY-FIRST, VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, WORD-FIRST, SURFACE-SAYS-TRUTH]
---

## The directive

Darrell, 2026-08-10, from the phone, mid-reading, in one sitting:

1. *"The reader can't be closed after opening to change speed of the reader... we need that"*
2. *"let the reader continue after leaving the app... let it run in the background while I work on other apps etc... so I can hear the Word"*
3. *"The highlighted Words work inside Eternal Algorithms not the Learn space... why? ... after research find a sustainable solution... and implement it"*
4. *"deeper doesn't get read at all"*
5. *"dropdown information need to be understood.... too"*
6. *"also the pause and continue doesn't work"*
7. *"the reader should say 2nd Timothy not two Timothy"*

Seven reports, one subject: **a person trying to hear the Word while living their life.** Every one is fixed here; none is dated.

## The decisions

### 1. Only Stop stops the voice

`close()` called `stop()`. So a listener who opened the panel to change the
speed — the one thing the panel is for while reading — could not put it away
without killing the reading. Now: **Close puts the panel away and the reading
continues**, the pill can be dismissed the same way, and the collapsed button
wears the reading state (an aria-label that says *Reading aloud* / *Reading
paused*, a live badge, never dimmed) so Stop is always one tap away. One rule,
teachable to anyone: **the only control that stops the Word is Stop.**

### 2. The reading survives leaving the app

A backgrounded page is frozen unless it is playing media, and Web Speech is not
media — it holds no audio element, so switching apps froze the page and the
voice died mid-sentence. Two mechanisms, both in this change:

- `lib/background-audio.js` holds ONE real, silent, looping audio element for
  exactly as long as the reader is reading. The page then counts as an audio
  session and stays alive in the background, and the OS gives it lock-screen /
  notification transport — wired to the same pause / continue / stop the panel
  drives (`navigator.mediaSession`), titled with what is being read.
- The engine keeps a background watchdog: while the document is hidden and the
  user has NOT paused, a synth the browser parked is put back to playing, and a
  read the OS dropped outright (two consecutive silent ticks) re-speaks its
  current sentence.

**Honest limits, stated rather than discovered later (DR-0076 §8):** Android /
Chromium is the proven path. iOS Safari suspends Web Speech when the tab leaves
the foreground even with an element playing — a cloned-voice reading (a real
audio clip) continues there, a device-voice reading may not. Nothing survives
the tab being closed. Neither the silent element nor the media session is
claimed to work where the browser exposes neither; both degrade to exactly
today's behavior.

### 3. Pause / continue is ours, not the platform's

Android does not honor `speechSynthesis.pause()` — the voice talks straight
through it, and `resume()` on a synth that was never really paused does
nothing. **Trusting the platform was the bug.** Pause now CANCELS (the one
command every engine honors) and holds the current SENTENCE; continue re-speaks
from that sentence. The cost is honest and small — continuing restarts the
sentence you were in, and segments are one sentence each — and in exchange
pause/continue behaves identically on every device, a speed change made while
paused is simply heard when you continue, and Chrome's stuck-paused state
(*"it paused and never spoke again"*) is unreachable.

### 4. The follow map is built from what is actually on screen

This is the answer to *"why Eternal Algorithms and not Learn,"* and it is two
separate defects stacked, both measured (`reader-learn-follow.test.jsx`):

**(a) A rule about PAPER was deciding what a person could hear.** The follow
map's skip list carried `.print\:hidden` as a proxy for "floating chrome". It
is not one: `print:hidden` means *not on the printed sheet*, and that is exactly
how this app marks the whole SCREEN half of a screen-vs-print split — ChurchLearn
wraps its entire view in `<div className="print:hidden">`
(`ChurchLearn.jsx:1619`, `:1864`). So on Learn the map skipped **every word on
the page**, `buildFollowMap` returned null, the reader fell back to unmapped
speech, and the highlight had nothing to paint on. Eternal Algorithms has no
such wrapper, so it highlighted perfectly. Same reader, same code, opposite
outcome — decided entirely by a print utility class. `.print\:hidden` is gone
from the skip list; chrome now says so itself with `[data-read-skip]` (applied
to the app shell's nav, footer, banners, modals, the lesson's stage rail,
counter and tutor chat), alongside the app's existing `.ts-chrome-region` and
`[role="dialog"]`.

**(b) Alignment by SEARCH cannot hold, so the piece read is now the piece
rendered.** The "read this piece start to finish" path spoke a surface's
COMPOSED text and then searched the DOM for each spoken sentence. On a real
Learn lesson, measured: **329 characters on screen, 19 spoken sentences, 3
locatable — 15.8%.** The composed text carries connective sentences that are
not on screen (*"Anchor scripture — …"*, *"Questions to think about:"*), and
the lesson renders ONE stage at a time. So even with (a) fixed, five sixths of
the reading could never be highlighted — and the four unrendered stages were
never read at all, which is report #4 exactly.

The sustainable fix is structural, not a better search: **a surface that owns a
reading names the ELEMENT that renders it and, through `prepare`, guarantees
the whole piece is on screen before reading starts.** The reader then maps that
element and speaks that map's own text — alignment by construction, the law the
page read has always obeyed. Measured after: **1,873 characters, 24 segments,
24 located — 100%**, word-level follow available again, and the whole lesson
actually read. The composed text remains the honest fallback for a surface that
registers no element.

### 5. What is collapsed is opened before it is read

Report #5, traced: this app's disclosures are conditionally rendered — while an
"About this" panel is collapsed there is **no text node in the document**. The
reader was not skipping those words; they did not exist. (`<details>` is the
mirror image: its children stay in the DOM when closed, so the voice read them
while the screen showed nothing.) `lib/read-reveal.js` opens the collapsed parts
of a reading before the map is built — `<details>` directly, real disclosure
buttons (`[aria-expanded="false"]`) by click, never the reader's own controls,
menus, dialogs, tabs, or anything marked `[data-read-no-expand]`, and bounded.
They are left open afterward on purpose: the screen then shows exactly what was
read.

### 6. The Word is pronounced the way the Body says it

*"2 Timothy"* was read aloud as *"two Timothy"* — every numbered book of the
canon, mispronounced every time, to a listener who may not be able to read
along and check. `lib/speech-text.js` converts **spoken form only**: the written
reference on the page is never touched (the Typographic Theology bright line —
we do not edit the text, and never inside a quotation), while the string handed
to the voice carries the ordinal, so the ear hears *"Second Timothy."* Roman
forms (I / II / III) and abbreviated citations are covered.

## Verification (DR-0076)

- **New pins, all proven-to-catch:** `tts-pause-and-background.test.js` (12 —
  against a synth that behaves like Android, i.e. ignores `pause()`),
  `background-audio.test.js` (12), `read-reveal.test.js` (13),
  `reader-learn-follow.test.jsx` (7 — the coverage MEASUREMENT above, against
  the real Learn lesson), `tts-control-close-keeps-reading.test.jsx` (5),
  `speech-text.test.js` (9).
- **Full suite:** 7,187 passing (643 files) with these 58 new pins included; lint clean at
  `--max-warnings 0`; production build green.
- **Not claimed:** whether it sounds right in the ear, and whether the reading
  really survives Darrell's phone going to another app, are the DR-0104 live
  pass on real hardware. The mechanism is proven; the device is his to witness.

## Pairs with

DR-0264 / DR-0265 (the follow-along this repairs), DR-0278 (the previous
highlight defect — the same lesson: a visible promise needs a rendered check),
DR-0076 (measure, don't claim — the 15.8% → 100% numbers are the argument),
DR-0100 (state the defect plainly), DR-0239 (the review standard this ran under),
COMMUNITY-FIRST-MISSION (a listener who cannot read the screen is the person
this whole feature exists for).
