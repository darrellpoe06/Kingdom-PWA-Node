---
id: DR-0302
title: The words being read are visible — the sentence clears the sticky chrome, and the gap is one line of the reader's own font size
date: 2026-08-13
status: accepted
supersedes: []
superseded-by: null
amends: []
tier: A
entities: [church, poetech]
grounds: [COMMUNITY-FIRST, EXCELLENCE-STANDARD, VERIFICATION-DOCTRINE, NO-STATIC-DATA, PERPETUAL-IMPROVEMENT]
source: 2026-08-13 session — Darrell, reading a lesson on his phone with the reader running: "Better... the words are blocked at the top of the highlighted text while reading possibly because of the banner or whatever... what about the rest?" and, mid-fix, "Account for different font sizes as well..."
---

## Context

With the reader finally reading the whole core (DR-0301), the next thing a real
listen exposed was that **you could not see the words being spoken**. The
follow-along highlight was landing under the app's sticky chrome.

## Two defects in one line

The follow-scroll was `el.scrollIntoView({ block: 'center' })`.

1. **It scrolled the ELEMENT, not the RANGE.** The element is the whole
   paragraph; the range is the sentence actually being spoken. Centring a TALL
   paragraph puts its opening lines above the viewport — so on exactly the long
   teaching paragraphs this app is built from, the words being read sat
   off-screen while the paragraph looked correctly "centred".
2. **It knew nothing about the fixed/sticky chrome.** This app stacks a session
   bar, the church banner and a sub-tab strip at the top, so the top of the
   viewport is not where content becomes readable.

## Decision

1. **Scroll the RANGE, not its paragraph** — the sentence being spoken is what
   must be visible.
2. **The chrome height is MEASURED, never typed.** `stickyTopInset` probes
   `elementsFromPoint` at three x positions, counts only fixed/sticky boxes
   whose top is at the viewport top, and clamps at 45% of the viewport. A
   constant would have been wrong for most readers: the chrome's height changes
   with large print, with which banners are dismissed, and between the church
   door and the PoeTech shell (NO-STATIC-DATA).
   - Three probe points so a narrow floating control is not mistaken for a bar.
   - Top-anchored only, so a fixed FOOTER or the GIVE button never pushes the
     reading down.
   - Clamped, because a chrome claiming more than 45% is an overlay or a
     mis-measure, and honouring it would scroll the reading OUT of view.
3. **The gap is ONE LINE of the reader's chosen size.** Five reading sizes ship
   (A → A44). A fixed 24px gap that looks generous at A is thinner than a single
   line at A44 — jamming the sentence against the chrome for precisely the
   readers who most need room. `readingMargin` takes the computed `line-height`,
   falling back to 1.4× `font-size` when line-height is `normal` (the default in
   most of this app's prose, which does not resolve to px), with 24px only as a
   floor.
4. **A well-placed sentence is LEFT ALONE.** Re-centring on every sentence makes
   the page twitch under the reader; movement happens only when the sentence is
   actually hidden or below the fold.
5. **A sentence taller than the reading band lands top-first**, never centred —
   centring a long one would put its opening back under the chrome, which is the
   original bug in miniature.

## Proven-to-catch (DR-0076 §3)

**jsdom has no layout**, so a render test here could only ever assert zeros —
which would have been the very "passes while proving nothing" failure DR-0301
just recorded. The arithmetic is therefore split into pure functions —
`readingScrollDelta`, `readingMargin`, `stickyTopInset` — and tested with the
rects a real browser produces. That is the only way this rule is checkable at
all, and the split exists for that reason rather than for tidiness.

Cases pinned include: the exact case Darrell hit (a sentence behind a 180px
banner is pulled clear); a well-placed sentence not moving; a sentence taller
than the band landing top-first; **large print clearing the banner by a full
line (72px) where small print clears it by 24px**; a fixed footer never counted
as top chrome; a static element at the top not counted at all; a full-screen
overlay unable to claim the viewport; and a throwing measurement degrading to 0
rather than breaking the read.

15 pins; suite 7,776 green; lint clean; build clean.

## Consequences

- The spoken sentence is visible while it is spoken, at any text size.
- The rule adapts to whatever chrome is actually on screen, including chrome
  that does not exist yet.

## Honest remainder

- **This is verified by arithmetic, not by eye.** No screenshot of the fixed
  scroll on a real phone exists — the live-link probe renders pages but does not
  drive the reader. Proving THIS the way DR-0298 proves the lesson link would
  mean a probe case that starts a read and screenshots mid-sentence.
  **re-review: 2026-08-20.**
- `followRange` scrolls the WINDOW. A reading inside its own scrollable
  container would not be moved by that, and no surface does this today — but
  nothing prevents one. Named rather than guessed at.
- The 45% clamp is a judgement, not a measurement. It is defensible (an overlay
  taller than that is not chrome) but it is a number chosen rather than derived,
  and it is the one value in this fix that could be wrong on a device nobody has
  tried.
