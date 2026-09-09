# The live player opens in the size the viewer chose — on its automatic first open

**Date:** 2026-09-09 · **Branch:** `claude/property-photos-project-docs-cdsexr` · **Record:** REV-0253 (Ways review under DR-0108) · DR-0076 · DR-0100

**Darrell:** *"the player doesn't open in full view when we choose for it to when it first opens... fix it after testing... only when it first opens"* — *"review our Ways and what we have done historically first"* — *"the player automation is live... before any amount of interaction from users."*

**Ways review first.** REV-0097 (2026-07-18): two rounds of padding tweaks on this player missed the complaint until it was reality-traced; the fix gave the Church home player Small / Medium / Large, Pop out / Dock and drag. REV-0146 and the 2026-07-28 sweep fixed the embed endpoint twice. None persisted the choice: `useState('m')` in ChurchHome, and the shell-level LiveWorshipBar (which opens by itself inside the service window) had its own fixed shape and never knew a choice existed. The failed Way: per-component, per-mount state. The Way that worked this morning: one remembered store read by every surface (show-the-word.js).

**Fix.** `lib/live-player-prefs.js` — scale on the device (localStorage), hide-video for the session; `useLivePlayerPrefs()` read by ChurchHome and LiveWorshipBar; `barFrameStyle(scale)` sizes the bar's frame (Large = full width, 16:9 up to 60vh). No iframe remounts anywhere.

**Proof.**
- `live-worship-bar.test.jsx` +5 and `live-player-prefs.test.js` (4): the bar's RENDERED frame reads width 100% / 60vh with Large remembered and no interaction; a choice on the home player re-sizes the bar on the same iframe; hide holds across remount; source pins refuse a return of private size state (`useState('m')`, `max-w-4xl`).
- Real Chromium, real bundle, choice pre-set on the device before load: phone 412×915 Medium 283 px → Large 354 px of a 388 px card; foldable 1088×906 792 px → 990 px of 1024; "Large" pressed at first paint; zero page errors. Screenshots `30-player-*.png`.
- Guards to run before push: ui-standards, consistency, contrast; eslint clean.

**Honest limit.** The Wednesday service window closed before the headless run, so the pinned bar's pixels were not measured live; its honouring is proven from the rendered DOM. YouTube's fullscreen button inside the frame is gated by a user gesture and is YouTube's to honour.
