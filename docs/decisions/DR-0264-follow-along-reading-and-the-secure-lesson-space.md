---
id: DR-0264
title: Read-aloud follows along (highlight + keep-in-sight) and the lesson space becomes SECURE — only the lesson on screen
status: accepted
date: 2026-08-03
tier: A
declared_by: Darrell
supersedes: none
builds_on: [DR-0262 (the lesson's own space), DR-0144 (start where I tap), the 2026-07-30 read-one-full-piece target, DR-0099 (red is reserved), DR-0076 (verification)]
principles: [COMMUNITY-FIRST (readers age 6 to 60), EXCELLENCE-STANDARD, VERIFICATION-DOCTRINE]
---

## Directives (Darrell, 2026-08-03)

> "the words that are being read to the users could be 6 or 60 years old...
> they should be able highlighted as it reads so users can see their place and
> the screen should move with the location of the words staying in sight while
> the words scroll automatically based on what is being read."

> "the Learn tab can use better functionality or intuitive Learn space that
> seems like a secure learning space one you pick your lesson that should be
> for only that lesson... so the user can focus on the current lesson."

## Built (this PR)

**1. Follow-along reading (`lib/read-follow.js` + tts/TTSControl wiring).**
The engine already spoke sentence-sized segments and reported `segmentIndex`
— the half that was never built is the map BACK to the screen. Now, when Play
starts, the visible page's text nodes are walked into a normalized string
with a per-character map to live DOM positions, segmented **with the engine's
own `segmentText`**, and that exact string is what gets spoken — so the
engine's sentence N and the on-screen range N are the same sentence *by
construction*, never by guess. As each sentence starts: a soft house-rust
highlight (CSS Custom Highlight API — no DOM mutation, no reflow) and a
centered smooth scroll keep the words in sight. Where the device's speech
engine fires word boundaries, the exact word gets the emphatic highlight
(karaoke); where it doesn't, the sentence highlight + auto-scroll are the
guaranteed floor. Chrome (panel, aria-hidden, print-hidden) never enters the
read. True red is untouched (DR-0099) — the wash is house rust.

**2. The SECURE lesson space (ChurchLearn).** DR-0262 gave a lesson its own
space; this seals it: while a lesson is open, the course tagline, progress
strip, graduation banner, section chips, catalog line, course picker/sort,
and resume banner ALL leave the screen. The space holds the focus bar
(← All lessons · N of M · Prev/Next) and the one lesson — nothing else to
wander into. Exiting restores the full course exactly as it was.

## Verification

`read-follow.test.js` pins the alignment law (segment lists identical to the
engine's, ranges match the on-screen sentences across nested elements, word
mapping, chrome exclusion, no-crash without the Highlight API, boundary
routing through the engine). `learn-lesson-space.test.jsx` pins the secure
space both ways (everything gone while focused; everything back on exit).
Full suite + lint green before merge. On-device feel — the moving highlight
at 6-year-old reading pace — is the live pass on the next build.

## Honest constraints (DR-0100)

- **Cloned-voice audio can't follow yet**: the sovereign voice returns one
  audio clip with no timing events; follow-along rides the System/browser
  voices. Timestamped cloned audio is a voice-service upgrade —
  re-review: 2026-08-24.
- **Word-level boundaries vary by device engine** (many Android voices never
  fire them); the sentence floor is universal wherever speech works.
- **"Start where I tap" and "Read this lesson start-to-finish" read unmapped
  text today** — they speak correctly but without the highlight; mapping
  those two paths is the next slice of this feature — re-review: 2026-08-24.
- The CSS Custom Highlight API needs a current browser; older ones keep the
  auto-scroll floor with no highlight (graceful, not broken).

## Course & lesson PRESENTATIONS — opportunities and constraints (reviewed)

The two-screen Presenter already exists for every course and single lesson
(`▶ Present this lesson` / series overview; scenes timed to the lesson, age
pacing rides in). **Opportunities:** (1) follow-along highlight in PRESENT
mode — the projected screen highlighting as the presenter reads is the same
read-follow map applied to the presenter window; (2) presenting straight FROM
the secure lesson space (the button is already on the lesson card, and now
the room around it is quiet); (3) the class screen following the presenter's
scroll. **Constraints:** the popped projector window is a separate document —
the follow map must be built in THAT window, not copied; presenter mode is
Governor-gated by design; and two-screen use needs the browser's popup
permission (a room-setup fact, not a bug). Routed as the presentation slice —
re-review: 2026-08-24 with the other carried items above.
