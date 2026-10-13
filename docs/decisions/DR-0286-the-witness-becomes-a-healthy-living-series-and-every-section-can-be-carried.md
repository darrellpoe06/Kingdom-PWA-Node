---
id: DR-0286
title: The 3rd-Dimension Witness becomes a Healthy Living series in Learn — derived from the data — and every section can be copied or linked to exactly
status: accepted
date: 2026-08-10
tier: A
declared_by: Darrell ("is this inside the Learn space too? ... make these lessons from our data or a series for Healthy Living... data driven course/s" / "copy paste options for each section... links to the exact lessons")
builds_on: [DR-0121 (derived, never re-typed), DR-0126 (the Eternal Algorithms as processing courses), DR-0127 + DR-0282 (Word-first, enforced), DR-0076, DR-0061]
principles: [COMMUNITY-FIRST, WORD-FIRST, VERIFICATION-DOCTRINE, DATA-AS-EMPOWERMENT, PERPETUAL-IMPROVEMENT]
---

## The directive

Darrell, 2026-08-10, holding the 3rd-Dimension Witness room on his phone:
*"is this inside the Learn space too? if not make these lessons from our data
or a series for Healthy Living... data driven course/s."* And, in the same
sitting: *"copy paste options for each section... etc... links to the exact
lessons... etc? opportunities and constraints..."*

## What was true

The witness room held **twelve cited works** — fasting and meal timing (Huberman,
Jamnadas, Fung, Goldhamer, Malthaner, the Fit Father 24-hour fast), sleep
(Marcu), learning (Huberman), the setback/dopamine loop (Marks), and the
women's-physiology **counter-witness** (Sims, Haver, the roundtable) — each one
already bound to the Scripture that said it first, every expert cited, every
verse verbatim.

**Learn carried none of it.** The room was a reading surface; nothing in it
could be worked at a level, checked off, resumed, or handed to someone else.

## The decisions

### 1. Healthy Living is DERIVED from the witness room, not authored beside it

`lib/healthy-living-course.js` projects one Learn lesson per `WITNESS_SOURCES`
entry at build time. A source added to the witness room joins the series on the
next build; the two can never disagree, and there is no second copy of the
science or the Scripture to drift (DR-0121 — the same law the Eternal Algorithms
processing courses ride). Registered in `LEARN_CATALOG` as a self-paced series,
so the render gate, the lesson census, and the Word-first gate all cover it:
**18 courses · 294 lessons** now, up from 17 · 282.

The room's rules are carried in the projection, not restated as decoration:

- **Word first** — every lesson's big idea BEGINS with its Scripture
  references; inside the lesson, each block is *the Word, then the cited claim*,
  and the course DECLARES its own lead (3 John 1:2; 1 Corinthians 6:19-20)
  rather than borrowing the first lesson's anchor (DR-0127 / DR-0282).
- **Every expert cited** — expert, credential, work, and where in the work, on
  every claim and at every level. No anonymous "studies show" (Romans 13:7).
- **Every verse verbatim** — references resolve through the verified KJV
  corpus; the declared lead quotes both verses exactly, gated so that changing
  one word fails the build.
- **Pastoral, not clinical** — the care note (*does not diagnose or treat · talk
  to your physician · never one-size*) rides EVERY lesson at EVERY level, and
  the data's own counter-witness is carried, never dropped.

### 2. A link opens the EXACT lesson

The URL carried only `?view=church&sub=learn` — the TAB. Handing someone one
lesson meant sending them to a course picker and telling them what to hunt for.
`lib/lesson-links.js` adds `?course=…&lesson=…`; Learn reads it once on mount
and opens that course and that lesson's own space (the same real path a
"Resume →" tap drives). A link to a course or lesson that no longer exists opens
Learn normally — a stale link is never a dead screen.

### 3. Every section can be carried away with its citation attached

`Copy this section` in the witness room copies the whole witness — every verse
**verbatim from the corpus**, the expert cited, the care note, and a link back
to its lesson. `Copy lesson` / `Copy link` on every Learn lesson card do the
same for the lesson, at the reader's own level. A verse the corpus does not hold
is NAMED (*"read it in your Bible"*), never invented and never silently dropped.

`components/CopyButton.jsx` is the one copy control for the app. Six surfaces
had their own inline `clipboard.writeText` with their own timer, and every one
of them did **nothing visible** on a device without the clipboard API — the user
taps, sees no change, and concludes the app is broken. The shared control
reports success AND failure honestly (*"Press and hold to select"*), which is
DR-0076 applied to a button: a surface never claims what it did not do.

## Opportunities and constraints (asked for by name)

**Taken now:** the twelve witnesses became workable lessons; the room gained
share-and-carry; the app gained a real deep-link primitive and one honest copy
control.

**Constraints, stated rather than discovered later:**

- **The series is exactly as deep as the room.** Twelve lessons because twelve
  cited works exist. It grows when the witness room grows — which is the
  correct dependency, and it means "more Healthy Living lessons" is a research
  task (find and cite the work), not a writing task.
- **Levels are depth SELECTION, not new prose.** teen/standard/senior re-cut the
  same cited sentences. A genuinely age-authored child level would be new
  authored content and is not claimed here.
- **The link is a query parameter, not a route.** It survives sharing and
  reload, but the URL does not update as you move between lessons — copying a
  link is an explicit act. Making the URL track the open lesson is a further
  step, deliberately not taken today: it would put a history entry on every
  lesson open and interact with the existing back-button spine.
- **Copy needs the clipboard API.** Where the browser refuses, the control says
  so and tells the reader what to do instead. It cannot copy for them.
- **The care line is a floor, not a review.** This is a church surface reading
  cited health science; it informs and points to a physician. Nothing here is
  medical advice, and no lesson issues a medical directive in the app's own
  voice — pinned by test.

## Verification (DR-0076)

- `healthy-living-course.test.js` (22): derived-not-typed incl. a grown catalog;
  Word-first per lesson and declared for the course; every reference resolves in
  the verified corpus; the lead quoted verbatim **with a proven-to-catch
  single-word tamper**; expert + credential + work + where-in-the-work on every
  lesson; the care note at every level; the counter-witness present; no medical
  directive.
- `lesson-links.test.js` (19): link build/parse round-trip incl. awkward ids;
  copy blocks carry verse-verbatim, citation, care note and the link; an
  unverified verse is named rather than quoted empty; `copyText` returns FALSE
  (never a silent no-op) with no clipboard, on refusal, and on empty text.
- `learn-deep-link.test.jsx` (6): the recipient's journey in a real render — the
  link opens the course AND the lesson's own space; a stale course and a stale
  lesson both land safely; the copy controls are on the card.
- Full suite **7,234 passing (646 files)**; lint clean; production build green.
- **Not claimed:** the ear-and-eye pass on the deployed build is Darrell's
  (DR-0104), as is whether the twelve topics are the right twelve to teach next.

## Pairs with

DR-0121 (no static data), DR-0126 (the study becomes courses — this is the same
move for the witness room), DR-0127 / DR-0282 (Word-first, enforced by gate),
DR-0061 (reality-trace — the lessons read the real witness records), DR-0285
(the reader, same sitting: what is read aloud is what is on screen).
