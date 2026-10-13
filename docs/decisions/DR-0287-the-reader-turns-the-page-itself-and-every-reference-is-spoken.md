---
id: DR-0287
title: The reader turns the page itself — a series plays start to finish with no finger — and every Scripture reference is SPOKEN, not punctuated
status: accepted
date: 2026-08-10
tier: A
declared_by: Darrell ("can't read the whole lesson... without a human turning the page!!!!!!????? fix it!!!! users should be able to listen to the whole thing without needing to intervene" / "not only 2 Timothy all scriptures?")
builds_on: [DR-0285 (the reader serves the listener), DR-0264 / DR-0265 (follow-along), DR-0076]
principles: [COMMUNITY-FIRST, WORD-FIRST, VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT]
---

## The directive

Darrell, 2026-08-10, inside a 36-pattern course: *"can't read the whole
lesson... without a human turning the page!!!!!!????? fix it!!!! users should be
able to listen to the whole thing without needing to intervene."* And, on the
spoken-form fix shipped hours earlier: *"not only 2 Timothy all scriptures?"*

## 1. The reader turns the page itself

**The defect, stated plainly:** "Read this pattern — start to finish" read ONE
pattern of thirty-six and went silent. Continuing required a human tap on Next
— which is exactly what the listener this whole feature exists for cannot do.
Someone driving. Someone cooking. Someone resting their eyes. Someone who
cannot read the screen at all, which is the founding case
(COMMUNITY-FIRST-MISSION). **A read-aloud that needs a finger every few minutes
is not read-aloud.**

**The fix is a contract, not a special case.** `read-target` gains `next()`: a
surface that has a following piece supplies a function that advances to it —
opening it, registering ITS target — and returns true. The reader treats a
target read as a **run**: when a piece finishes on its own it asks the surface
for the next one, waits for it to register (bounded — a surface that advances
without registering ends the run quietly rather than hanging), and keeps
reading. Learn supplies `next()` for every lesson in every course, so the run
walks the whole series and stops at its end.

**"It ended" and "you ended it" are now different events.** Stop clears the run;
finishing does not. Pause does not end it, and Close does not either (DR-0285) —
so the panel can be put away and the series plays on, in the background, with
the phone's own transport controls. The pill and the panel say *"keeps going"*
so the listener is never guessing whether they need to come back.

## 2. Every reference is spoken, not punctuated

The 2 Timothy fix was too narrow, and Darrell caught it in one line. A colon
between two numbers is read by every engine as a clock time or a ratio — *"John
three sixteen"* at best, worse elsewhere — and that is not how anyone in the
Body says a reference out loud. So **every** book of the canon is now recognized
and every reference is spoken the way it is said:

- `John 3:16` → *John chapter 3 verse 16*
- `Colossians 1:16-17` → *Colossians chapter 1 verses 16 through 17*
- `Psalm 119:105` → *Psalm 119 verse 105* — a psalm is numbered, not chaptered
- `2 Timothy 1:7` → *2nd Timothy chapter 1 verse 7* (the ordinal rule, kept)

**The guard is the book name.** A reference is only a reference when a book
sits in front of it, which is what keeps the rule off a video timestamp
(`1:12-2:04` — the witness room is full of them) and off a meeting time.

**The bright line holds:** this is SPOKEN FORM ONLY. The written reference on
the page is untouched, and no quotation is ever edited (CLAUDE.md Typographic
Theology; DR-0076).

## Verification (DR-0076)

- `reader-hands-free.test.jsx` (6): the run advances by itself; it keeps
  advancing piece after piece; it stops at the end of the series without
  looping or hanging; **Stop ends it** and no page is turned; a surface with no
  next piece reads once and stops; the panel says it keeps going.
- `speech-text.test.js` (16, +7): every reference form above, several in one
  sentence, multi-word book names matched whole, a chapter with no verse left
  alone, and the timestamp guard.
- Full suite **7,247 passing (647 files)**; lint clean; build green.
- **Honest limit:** the run advances one piece at a time by asking the surface.
  A surface that has no `next()` — a single page, a study room — reads once and
  stops, which is correct, not a gap.

## Pairs with

DR-0285 (same day: closing never silences, the reading survives leaving the app
— this is the third leg of the same posture: it also does not stop until the
series does), DR-0264/DR-0265 (the follow-along the run carries with it),
COMMUNITY-FIRST-MISSION (the listener who cannot read the screen is the reason
this is a defect and not a nicety).
