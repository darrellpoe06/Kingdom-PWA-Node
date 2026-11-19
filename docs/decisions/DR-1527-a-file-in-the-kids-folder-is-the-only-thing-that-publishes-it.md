# DR-1527: A file in the kids folder is the only thing that publishes it

**Date:** 2026-11-18
**Status:** Accepted (built; every Jonah asset still to be produced)
**Tier:** B (child-facing; adds inside the existing Kids Zone; no schema, no auth, no money; the deploy lane gains a prebuild step that writes one JSON file)
**Type:** decision
**Area:** `scripts/kids-landed-manifest.mjs` → `app/src/lib/kids/landed.json`; `app/src/lib/kids/{guides,theater,narration}.js`; `app/src/components/kids/{Storybook,Theater,GuideArt}.jsx`; `docs/design/love-corner-kids/2026-11-18-jonah-production-brief.md`
**Sent in by:** Darrell, 2026-11-18, opening J2: *"Prepare the existing storybook to receive eight high-quality illustrations... Prepare the narration system for eight professionally recorded audio files, including synchronized text highlighting... Prepare Bible Adventure Theater for one complete animated Jonah episode with narration, sound, captions, and a beautiful poster image... Tell me exactly which illustrations, audio recordings, and video files you need me to provide. Give me the correct filenames and specifications."*
**Pairs with:** DR-1523 (the Jonah adventure, J1), DR-1520 (the v1 launch), DR-0076 (verification), DR-0061 (reality-trace), DR-0219 (SHOULD/ARE)

## Context

J1 is live. Every Jonah asset is still to be produced: eight scenes, eight recordings, one episode with a poster and captions. Until now a render became "landed" by editing a status string in the registry, an episode became "published" by editing its status and source, and the storybook had no road for a recording at all. Each drop would have needed a code change, and a status string is a claim, not a measurement.

## What was measured

- `SHOT_LIST` carried a hand-kept `status`; `landedShots().length` was pinned to 0 in its test. `EPISODES` carried hand-kept `status`/`source`. The storybook read only through the device reader.
- The folder itself is the measurement: a scene file, a recording, a video, a poster either is there or is not.

## Impact

With this record a drop is the whole act: the file lands, the build writes the manifest, the registry derives what is landed, narrated, published or in production, the tests prove every named file is real, and the phone shows it. Nothing is published by a status string and nothing by a tap; nothing waits on a code change. The brief hands Darrell exact names, so what arrives is what the app expects.

## Decision

1. **The manifest is the folder.** `scripts/kids-landed-manifest.mjs` scans `app/public/lovecorner/kids/` (images, audio, video, captions; names and byte sizes only) into `app/src/lib/kids/landed.json`; `npm run build` writes it first (`prebuild`); `kids-landed-manifest.test.js` refuses a stale commit.
2. **Derived, never declared.** A shot is `landed` iff `<id>.png|jpg|jpeg|webp` is on disk; a page is narrated iff `narration/<book>-p<n>.m4a|mp3|ogg|wav` is; an episode is `published` iff `episodes/<id>.mp4|webm` is, with `episodes/<id>-poster.*` and `episodes/<id>.en.vtt` riding when present; a poster with no video reads `in-production`. `SERIES` stays all `planned`.
3. **The recording is the narration where it exists.** Hear this page and Read to me play it, pause and resume hold it, its end turns the page; the lit sentence follows timed cues from `narration-cues.json` or an estimate over the recording's length until the file is timed. The device reader remains for every page without one.
4. **The episode plays inside the Theater.** A file episode's WATCH plays in the Theater's own player with its poster and captions; YouTube stays an alternative road.
5. **The names are the contract.** The production brief gives every file name, size and format, the KJV verse and caption per page (generated from the in-repo text, never typed), the narration script, the video spec, and the hand-over.

## Verification

- `kids-landed-manifest.test.js` (7): the committed manifest equals a fresh scan; every named file exists; each derivation shown to catch with a fake manifest.
- `kids-jonah-narration.test.jsx` (4): a recorded page plays, pauses, lights by estimate and by cue, turns at the end and falls back to the device reader; a landed scene shows by its real file; the shelf plays a file episode and reads in production from a poster alone.
- Every earlier kids, youth and Jonah suite green on the derived registry; lint clean.
- `re-review: 2026-11-25` — the first real file landed and seen on the phone, or a why.
