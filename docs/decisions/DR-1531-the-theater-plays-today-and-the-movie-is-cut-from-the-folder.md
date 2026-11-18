# DR-1531: The Theater plays today, and the movie is cut from the folder

**Date:** 2026-11-18
**Status:** Accepted (built; the finished films wait only on the scenes and the voice)
**Tier:** B (child-facing; adds inside the existing Theater tab; a build script that writes files into a folder of the operator's choosing; no schema, no auth, no money)
**Type:** decision
**Area:** `app/src/components/kids/Theater.jsx` (PLAY, the show); `app/src/components/kids/Storybook.jsx` (`autoStart`); `scripts/kids-make-episode.mjs`; `app/src/__tests__/kids-theater-show.test.jsx`; `scripts/live-kids-zone-walk.mjs`
**Sent in by:** Darrell, 2026-11-18, on the live Theater showing three COMING SOON rows: *"Where are the lessons?!!!!! Bible adventures?!!!!!!!!"*, *"Theater?!!!!!"*, *"Let's make the movies!!!!!!!! Why wait,!!!!!!?!!!"*
**Pairs with:** DR-1523 (Jonah J1), DR-1527 (the folder publishes), DR-0076 (verification), DR-0236 (nothing waits), DR-0274 (the still screen)

## Context

The Theater listed only videos. With no episode published, a child saw three COMING SOON pills and the church channel: an honest surface that read as an empty feature, while the adventures themselves sat under Games and the Adventure trail. The films waited on an outside studio for every step, including the steps that are ours.

## What was measured

- `Theater.jsx` shelf rows carried a status pill and no action unless `watchable`; the storybooks were reachable only through "After you watch".
- This machine has ffmpeg 6.1 with zoompan, drawtext, xfade and subtitles, DejaVu fonts, and no voice engine; the KJV and every caption are in the repository; the scenes and the voice are not.
- A draft Jonah cut from the interim art, silent, 6 s a page: 42.4 s, 1920×1080 H.264/AAC, 17.6 MiB, captions and poster written beside it, the sidecar naming every page as interim and silent.

## Impact

A child tapping the Theater today hears Jonah read to them with the pages turning, instead of reading COMING SOON three times. The day the eight scenes and eight recordings land, one command cuts the episode, its poster and its timed captions from them, and the folder publishes it; no studio step stands between the assets and the film. What stays outside our hands is named: the children's likeness in the scenes, and a human voice.

## Decision

1. **Every unpublished adventure row reads PLAY.** It opens the storybook inside the Theater as a show that starts reading on its own (`autoStart`), turns its own pages, writes the storybook's record and lights its stop. The episode's state is a line under the title. A published episode keeps WATCH.
2. **The movie is cut from the folder.** `scripts/kids-make-episode.mjs <book>` builds `<book>.mp4` (1080p, H.264 + AAC) from the landed scenes (interim art where a scene is missing) with a slow move and crossfades, the narration under each page where it exists (silence where not, the page held to the recording's length), the verse and caption burned in from the registry, the poster from page 3, the WebVTT timed to the cut, and a sidecar that says plainly whether the cut is finished or a draft. Nothing is published by the script.
3. **A draft is never the episode.** A cut whose sidecar says draft is for review only; the published file is the one whose every page is its landed scene and its recording.
4. **The voice and the likeness stay Darrell's.** No generated child stands in for the approved pair; no synthetic voice is published as the narration without his word.

## Verification

- `kids-theater-show.test.jsx` (3): PLAY on every unpublished row; the show starts reading by itself; a published row keeps WATCH; a show finished signed in writes `storybook-jonah` and lights the trail. Earlier kids suites green; lint clean.
- The live walk's Theater stop now presses PLAY on production and expects the show to open.
- `re-review: 2026-11-25` — the first real cut from landed scenes, or a why.
