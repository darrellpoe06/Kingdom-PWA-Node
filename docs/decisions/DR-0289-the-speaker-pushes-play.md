---
id: DR-0289
title: The speaker pushes play — any surface can ask for a reading, and the presenter reads the whole message part by part
status: accepted
date: 2026-08-10
tier: A
declared_by: Darrell ("I should be able to also listen to the full message or lesson/s from here... easygoing... easy-to-use" / "speakers are supposed to be able to push play for reading whatever... especially Scriptures")
builds_on: [DR-0285 (the reader serves the listener), DR-0287 (the reader turns the page itself), DR-0264/DR-0265]
principles: [COMMUNITY-FIRST, PERPETUAL-IMPROVEMENT, VERIFICATION-DOCTRINE]
---

## The directive

Darrell, 2026-08-10, from the presenter bar mid-lesson: *"I should be able to
also listen to the full message or lesson/s from here... easygoing...
easy-to-use... processes... opportunities and constraints"*, *"implementation of
the best solution/s"*, and *"speakers are supposed to be able to push play for
reading whatever... especially Scriptures."*

## What was wrong

Starting a reading had exactly one entry point: find the floating reader, open
its panel, choose an action. Three taps and a hunt — from a screen where the
speaker's hands are already busy and a room is watching. And the presenter
registered no reading at all, so even after the hunt the reader had only the
page to fall back on.

## The decisions

### 1. Any surface can ask for a reading

`lib/read-request.js` is the seam: a surface calls `requestRead()`, and the
reader — which owns the voice, the follow-along and the hands-free run — answers
with its full behavior. No surface has to import the reader, and no surface has
to reimplement any of it.

It **reports whether anything answered.** `requestRead()` returns false when no
reader is mounted, so a button can tell the truth instead of sitting dead — the
same law the copy control follows (DR-0286).

### 2. The presenter offers the message, and the reading walks the deck

The presenter registers the CURRENT slide as the screen's reading — title, the
age-pitched lead, and the points, *exactly what the room sees* — and supplies
`next()` that advances to the following part. So one press reads this part, then
the next, then the next, through the whole message, with no hand on the screen
(DR-0287's run, now driven from the presenter).

**The no-leak law holds:** what is read aloud is what is projected. The
speaker's private notes are never handed to the voice — pinned by test.

Two buttons, both one press: **▶ Read it aloud** on the speaker console, and
**▶ Read aloud** on the always-on bar in present-on-this-screen mode, beside
Start and Full screen.

## Opportunities and constraints (asked for by name)

- **Scriptures are spoken properly here for free** — DR-0287's spoken-form rule
  means a slide citing `John 3:16` is said *"John chapter 3 verse 16"*.
- **Constraint, stated:** the presenter speaks the slide's own text. Where a
  slide cites a reference rather than printing the verse, the voice says the
  reference — it does not fetch and read the whole passage. Printing the verse
  on the slide is what makes it spoken; that is the surface's choice, not a
  hidden behavior.
- **Constraint:** the reading follows the deck one part at a time because that
  is what the room is looking at. It does not race ahead of the projector.
- **Constraint:** on a device with no speech support the reader renders nothing
  and `requestRead()` returns false — the button reports rather than pretends.

## Verification (DR-0076)

- `presenter-read-aloud.test.jsx` (9): the registered reading is what the room
  sees; the speaker's private note is never in it; `next()` walks the deck and
  returns false at the last part instead of looping; the console button exists
  and its press reaches the reader; and the seam reports false with no reader,
  true with one, and survives a throwing listener.
- Full suite **7,273 passing (649 files)**; lint clean; build green.
- **Not claimed:** the live pass with a room in front of him is Darrell's
  (DR-0104).

## Pairs with

DR-0287 (the hands-free run this drives), DR-0285 (Close never silences — so the
panel can be put away while the message plays), DR-0286 (a control that reports
its own failure).
