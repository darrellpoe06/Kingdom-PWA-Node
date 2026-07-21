# The Parable & Testimony Method — how we build stories that fit the Word

Added 2026-07-21 (declared by Darrell; DR-0215). Jesus taught in short, vivid
stories — "without a parable spake he not unto them" (Matthew 13:34) — and used
unforgettable, sometimes wry images (a camel through a needle's eye; a plank in
the eye; a man who built bigger barns). This document is the **teachable process
(the "algorithm")** for building such stories, so the AI can seed the curriculum
now AND so every user can learn the method and create their own — the two tracks
Darrell named ("the AI parables now for training, and the opportunity to create
after understanding the process").

## Two kinds — never blurred (the label is a truth commitment)

- **Parable** (`kind: 'parable'`) — an illustrative, true-to-life story that
  teaches WITHOUT claiming to be a real event ("a certain man…"). Rendered
  **"Picture this…"**. No consent needed; be freely, gently funny.
- **Testimony** (`kind: 'testimony'`) — a REAL, lived, attributed account ("this
  actually happened"). Rendered **"A true story — [source]"**. Carries a power
  fiction cannot — "the word of their testimony" (Revelation 12:11). Requires:
  it actually happened (no embellishment), explicit **consent**, privacy / minor
  protection, and pastoral care.

Never present a parable as a real event, and never present a testimony that did
not happen. The label is a promise about truth (DR-0076).

## The algorithm — six steps

1. **NAME the one truth.** Pick ONE verse / one point the story will land. One
   story, one truth — do not cram. (It should be a verse the lesson already
   teaches, so the story reinforces it — repetition in context, the neuroplastic
   way the mind is renewed, Romans 12:2.)
2. **FIND the everyday mirror.** A concrete, relatable human scene that mirrors
   that truth — kitchen, traffic, money, work, family. The more ordinary, the
   more it sticks.
3. **BUILD the tension the wrong way.** Show the folly or the problem vividly —
   this is where honorable humor lives (we laugh at our own foolishness, never at
   God or holy things).
4. **TURN on the truth.** Let the verse's wisdom flip the scene — the moment it
   all changes.
5. **LAND it in one line.** A single closing line that ties the scene to the
   verse so no one can miss it.
6. **CHECK the guardrail** (below). If it fails any check, fix it or drop it.

**Tone:** `light` (gentle humor at folly) where it disarms; `solemn` (weight,
reverence) where the truth demands it. Both are needed; match the moment.

## The guardrail — every story must pass

- **True-to-life** — it rings true to real human experience.
- **Serves THE verse** — it lands the intended truth, not a tangent or a
  different point.
- **Honorable, not flippant** (the Test) — dignified; humor aimed at human folly,
  never at God, Scripture, or a real person's dignity.
- **Distorts no doctrine** (DR-0098) — teaches the Word rightly; never platforms
  error for a laugh.
- **Scripture is verbatim** (DR-0076) — the cited verse is KJV-exact; story
  bodies carry NO quoted Scripture unless it is copied verbatim (prefer bodies
  that are pure original narrative + a verified `verse` citation).
- **Provenance is clean** (DR-0190) — original, or a consented testimony;
  never uncredited third-party material (a book, film, or another's sermon).
- **Consent + privacy for testimonies** (DATA-AS-EMPOWERMENT) — real people and
  events only with permission; protect minors; deletion honored.

## Shape (data)

`stories: [{ kind, tone, title, body, verse, source? }]` on a lesson module —
rendered on the AUDIENCE side of the TEACH stage (`lesson-flow.js` /
`ChurchLearn.jsx`). The Story Library (forthcoming) captures candidate
stories/testimonies, runs this guardrail as a review gate, and promotes approved
ones into a lesson's `stories`. Content is preserved, never lost (DR-0215).
