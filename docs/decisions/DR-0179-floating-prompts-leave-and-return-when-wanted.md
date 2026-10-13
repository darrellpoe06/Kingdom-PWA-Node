---
id: DR-0179
title: Floating corner prompts leave when you read and return when wanted
status: accepted
date: 2026-07-12
tier: A
declared_by: Darrell
supersedes: none
principles: [DO-THE-WORK-DONT-RE-ASK (DR-0111), QUALITY-OF-LIFE, EXCELLENCE-STANDARD, DR-0076]
---

## Context

Darrell, 2026-07-12 (with a screenshot of the Church surface): *"The lower prompts like
feedback etc BLOCK when they should leave after a certain amount of time and come back
when we believe they will want it — like during giving time and during the livestreams."*

The corner floaters — the 💬 Feedback launcher (bottom-left), the Give pill and the
network status pill, the TTS control — were `fixed` and permanent. They sat on top of
content and never left, covering the very page the person was trying to read.

## Decision

A floater **shows, then leaves, then returns when the person wants it** — it is not a
permanent overlay.

- **Leave:** it tucks off its nearest edge on scroll-down (they're reading past it) or
  after an idle period, so it stops covering content. It never unmounts — an open panel
  is preserved and the return is smooth — and while hidden it drops `pointer-events` so it
  can never intercept a tap it isn't showing for.
- **Return when wanted:** it slides back on scroll-up (they're reaching for it), when near
  the top of the page, or when a **context cue pins it** (`forceVisible`). Today that cue
  is "its own panel is open"; the giving-time / live-service pin layers on top of the same
  hook next (the Give pill up during a live service is the named example).

The behavior is one shared, unit-tested primitive (`app/src/lib/floating-visibility.js`:
`scrollAction` reducer + `useAutoHideOnScroll` hook + `hiddenFloaterClass`), so every
floater behaves identically and a new one opts in with one hook call. The TTS **playback**
control is deliberately excluded — hiding a control mid-read is bad UX.

## Consequences

- Wired into the Feedback launcher (extracted from the 5k-line monolith into
  `FeedbackCenter`'s `FloatingFeedbackButton` so the hook lives cleanly outside it), the
  Network status pill, and the Church Give floater.
- Proven-to-catch (`floating-visibility.test.js`, 8 green): scroll-down hides, scroll-up
  reveals, top-zone always reveals, sub-threshold jitter is ignored, and the hidden class
  tucks off the correct edge + drops pointer-events. Verified live (mobile viewport):
  visible at top → hides on scroll-down → returns on scroll-up.
- Follow-up (tracked, not blocking): the explicit **giving-time / live-service** pin for
  the Give pill (wire `church-live` liveStatus into `forceVisible`), so it is present
  exactly when the congregation wants it, per Darrell's example.
