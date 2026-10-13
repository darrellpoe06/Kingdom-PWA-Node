# DR-0182 — Sovereign OBS-based meetings: scheduling + load rules now, the engine as the Tier-C target

- **Status:** accepted
- **Date:** 2026-07-12
- **Tier:** B for the scheduling shell (new table + load rules); the real-time OBS video engine is **Tier C** (new architecture + real-time infra)
- **Governs:** how PoeTech does video meetings — our own, on our broadcast stack, with rules that keep a meeting from overloading the environment
- **Grounds:** DATA-AS-EMPOWERMENT (sovereign infra), VERIFICATION-DOCTRINE, APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT, AI-MEDIA-PRODUCTION-PLATFORM-VISION
- **Pairs with:** DR-0068 (Autonomous Automation Requires Three Brakes), RELEASE-TIERS (Tier C), SOVEREIGN-COMMS-AND-MEETINGS.md, 0097-ministry-meetings.sql

## Declared by Darrell, 2026-07-12

> "…or in a Zoom or Teams meeting with rules for not overloading the environment however we want good content and context from Yahweh's perspectives." — and, choosing the approach: **"We want our own OBS-based Zoom/Teams version for PoeTech."**

Not an external Zoom/Teams integration — **our own** meeting engine, sovereign, on the broadcast stack.

## The decision

Split honestly by what can be built-and-verified now vs. what is real-time infrastructure:

**Built now (real, tested):** the meeting **scheduling record** (`ministry_meetings`) and the **load rules** (`lib/ministry-meetings.js`). A leader schedules a meeting; the load rules gate it *before* it can be created. The rules are the **three brakes** (DR-0068) applied to meetings so the environment can't be overloaded:
- **Budget** — participant cap (≤ 25), duration cap (≤ 180 min), max concurrent per instance (≤ 3).
- **Concurrency lock** — one live/overlapping meeting per ministry at a time.
- **Guardrail** — a real future start time required (no unbounded ad-hoc).

`poetech-obs` is the first-class provider; `zoom`/`teams`/`other` are a pasted-link fallback until the engine lands. Raising any cap is a decision (DR-0075), not a silent tweak.

**The Tier-C target (NOT built — not painted):** the real-time **OBS-based video engine** — self-hosted media routing on the broadcast stack (OBS + the existing NDI/video-wall infrastructure + the GPU rig), producing a PoeTech join surface instead of a Zoom/Teams link. This is real-time infra that cannot be stood up and verified in the cloud sandbox; a painted "join call" button would violate reality-trace (DR-0061). The scheduling shell is deliberately the front door the engine plugs into, and the same load rules already bound it.

## What makes it trustworthy (DR-0076)

- **The load rules are proven-to-catch.** `ministry-meetings.test.js` (14 tests) fires each overload class — no start time, past start, over-duration, over-cap, missing cap, ministry lock, max-concurrent — and confirms a sound meeting passes and an ended conflict frees its slot.
- **Honest about the engine.** The doc and this DR state plainly that the video engine is the target, not shipped. No surface claims a working call.
- **Word-first, verified:** Luke 14:28 (count the cost) and 1 Corinthians 14:40 (decently and in order), KJV-verbatim, ground the load rules on the surface.

## Re-review

**2026-09-01** — revisit the OBS engine once the GPU rig + broadcast routing can host a first internal meeting *with someone watching* (never self-activated unattended — DR-0068).

## Encoded / verified

Migration 0097; libs `ministry-meetings.js` (+ 14 tests) and `ministry-meetings-sync.js`; scheduling surfaced in the bus ministry's Meetings tab. Full suite green, lint + build clean, all guards pass.
