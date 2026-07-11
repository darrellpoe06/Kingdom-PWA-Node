# DR-0173 — Explore Your Story: the L27 Question Made Interactive, in the App and the Games

- **Status:** accepted
- **Date:** 2026-07-11
- **Tier:** A (additive reflection surface; no money, no external identity, no schema; deterministic gates cover it)
- **Governs:** how the L27 "read your life by His Word" method is offered as a DOING surface, not only reading
- **Grounds:** APP-IS-PRIMARY, WORD-FIRST, VERIFICATION-DOCTRINE, DATA-AS-EMPOWERMENT, TLC-FIREWALL, SPOKEN-TEACHINGS-ARE-BUILD-INPUT
- **Pairs with:** L27 (the Living Lesson this is the companion to), DR-0166 (believe-first), the 2026-07-03 spoken-teachings-are-build-input rule, DR-0061 (reality-trace / real data), DR-0111 (do the work)

## Declared by Darrell, 2026-07-11

> "Let's ask that exact question in the app and games so people explore like Yahweh wants us to..."

The "exact question" is the one L27 teaches: bring one real memory to the Word the way Joseph did — *"ye thought evil against me; but God meant it unto good"* (Genesis 50:20) — and ask where God was (Isaiah 63:9), what He was preserving or preparing (Genesis 45:5; Deuteronomy 8:2), and what comfort it now lets you give (2 Corinthians 1:3-4).

## The decision

Ship **"Explore Your Story"** — an interactive, NON-competitive reflection that makes the L27 method a thing people DO, surfaced in **two** places people actually reach:

1. **In the app** — inside the Living Lesson itself. L27 carries `explore: 'story'`; its Apply stage offers an opt-in "Explore your story — read your life by His Word →" reveal that mounts the exploration right where the learner meets the teaching (the app is the primary artifact; a capability that can live in the app should — APP-IS-PRIMARY).
2. **In the games** — a new gentle experience in the Games hub (the proven `mini`-experience pattern beside The Steward's Challenge). No score, no winner; the "exploration" IS the point.

Both mounts render ONE component (`StoryExplorer`) over ONE source of truth (`lib/story-exploration.js`).

## What makes it honest (the gates, not the claim — DR-0076)

- **Verse-verbatim, single-sourced.** Every anchor verse (Psalm 56:8, Isaiah 63:9, Genesis 45:5, Deuteronomy 8:2, 2 Corinthians 1:3-4, Genesis 50:20, Revelation 21:4) is KJV fetched verbatim the same session as L27; the exploration and the lesson share the SAME verses on purpose. A unit test pins each string — change a verse and the build fails.
- **Real data, never painted (DR-0061).** A kept reflection is REAL device-local state, read back from storage into "Your reflections." A component test drives the surface: type → keep → assert it persisted to the injected storage AND is shown back. An empty reflection never saves (no painted rows).
- **Private by design (DATA-AS-EMPOWERMENT).** Reflections persist DEVICE-LOCAL only (`localStorage`), never leave the device, never feed a stream or server. The persistence helpers are pure over an injected storage so the whole trace is machine-checked.
- **TLC bright line (WORD-FIRST / TLC-FIREWALL).** The surface itself shows the guardrail: this is reflection WITH the Godhead through His Word, pastoral and NOT clinical therapy; deep wounds welcome a trusted person or pastor alongside.
- **Two depths.** Child level reads the child framing; every other level reads the seasoned framing — a plain adult is never handed the child's words.

## What it does NOT do

It does not fabricate anyone's story (DR-0076) — the person brings the real memory; the Word reads it. It does not send, aggregate, or analyze the reflection. It adds no autonomous timer (three-brakes N/A).

## Encoded

`app/src/lib/story-exploration.js` (source + private persistence), `app/src/components/games/StoryExplorer.jsx` (the surface), mounted in `Games.jsx` (games) and `ChurchLearn.jsx` Apply stage (app, gated by `module.explore === 'story'` on L27). Tests: `story-exploration.test.js` (data + persistence, proven-to-catch) and `story-explorer-render.test.jsx` (the surface renders the exact question and keeps real state). REV-0065.
