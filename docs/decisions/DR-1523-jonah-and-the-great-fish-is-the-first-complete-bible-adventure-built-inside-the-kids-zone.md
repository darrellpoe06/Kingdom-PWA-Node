# DR-1523: Jonah and the Great Fish is the first complete Bible Adventure, built inside the Kids Zone

**Date:** 2026-11-17
**Status:** Accepted (J1 building now; J2–J4 wait only on the named assets)
**Tier:** B (child-facing; adds inside existing tabs; records ride the existing learner rows and RLS; no money, no auth, no schema)
**Type:** decision
**Area:** `docs/design/love-corner-kids/2026-11-17-jonah-and-the-great-fish-plan.md` (the plan); `app/src/components/kids/{Storybook,Theater,KidsZone}.jsx`; `app/src/lib/kids/{storybooks,theater,who-am-i,guides}.js`; `app/src/lib/youth-zone.js` (badges)
**Sent in by:** Darrell, 2026-11-17, after approving the Kids & Youth Zone and the characters (PR #2716 merged): *"Immediately begin the next phase: building the actual interactive Bible Adventures experience. Our first complete adventure will be Jonah and the Great Fish. I want Bible Adventure Theater, interactive storybooks with narration and page turning, Bible games, memory verses, an adventure map, and achievement badges. Keep all existing features. Do not create a separate app. Start by reviewing what already exists so we don't rebuild anything unnecessarily... Do not begin a major redesign."*
**Pairs with:** DR-1508 (the Kids Zone), DR-1520 (the v1 launch), DR-1521 (Reading Stars), DR-0065 (the app is the primary artifact), DR-0219 (SHOULD/ARE/GAPS/CLOSE), DR-0076 (verification), DR-0098 (teach the Word)

## Context

The Kids Zone is live with the approved characters. Six pieces Darrell named already exist in some form: a Theater that plays only YouTube, a Jonah storybook of eight KJV pages with device-voice read-aloud, four games, a weekly memory verse, a map lit from lessons, six badges. The review before this record found what each lacks rather than rebuilding any.

## What was measured

- `AdventureMap` (KidsZone.jsx) filters rows by the lesson course, so a `storybook-jonah` row under `kids-storybooks` lights nothing, while Storybook.jsx's finish line says "That stop is lit on your map." A surface saying something untrue (P15).
- `badgesFor` (youth-zone.js) already counts a finished storybook toward First Step and Quiz Star; no badge names an adventure.
- `theater.js` accepts only a YouTube source for `published`; the app is served from Cloudflare Pages, whose documented per-file limit is 25 MiB, so a finished episode cannot live in the repository.
- `who-am-i.js` carries five people; Jonah is not one. `MemoryVerseGame` plays the week's verse only. The reader (`lib/tts.js`) already segments and highlights, so read-to-me needs no new engine.

## Decision

1. **Build inside the Kids Zone that exists**: no new app, route, or redesign; the work adds inside the Adventure, Theater, Games and Badges tabs.
2. **J1 ships first and needs no asset**: the map lights from storybook and theater rows; page turning with a reduced-motion fallback; read-to-me on the existing reader; Jonah in Who am I? and Word Builder; Put the story in order; the storybook's own memory verse (Jonah 2:9) through the existing game; three adventure badges derived from rows (`great-fish`, `three-stories`, `front-row`); a same-origin video path with a WebVTT track beside YouTube; file drops that the registry picks up without a code change.
3. **J2–J4 wait only on assets, each named with its spec and hand-over**: eight 16:9 scenes `jonah-1..8` at 1600 × 900 or larger per the artwork brief §3d; eight narration recordings `jonah-p1..p8` (AAC or MP3, under 1 MB each) reading the verse then the caption exactly as printed; one 1080p H.264/AAC episode with a poster frame, served from the NAS through the same-origin transport or unlisted YouTube, never from the repository.
4. **Nothing is painted**: a recording plays only when its file exists, else the device reader; a scene shows only when landed, else the interim art; the episode reads WATCH only when `published` with a real source. Every line of our own voice passes the voice gate; every verse is the KJV verbatim (DR-0076, DR-0210).
5. **Every existing feature stays**: games, lessons, quizzes, Grown-Ups, Teens, the church home, the records and their RLS, the asset ratchet.

## Verification

- Each J1 piece ships with the proven-to-catch tests the plan §3 names (a storybook row lights exactly its stop; none signed out; order grading; every clue verse names Jonah; a same-origin source is watchable and `ended` writes the row; a page with a recording never speaks synthetically).
- After each deploy: `site-health.yml` UP and fresh; `live-kids-zone-walk.yml` ten stops ok.
- `re-review: 2026-11-24` — J1 built and green, or a why.
