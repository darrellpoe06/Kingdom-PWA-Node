# DR-1535: The J2 phone review, what it measured, and the gates it left

**Date:** 2026-11-18
**Status:** Accepted (every finding closed on the held J2 branch, PR #2729)
**Tier:** B (child-facing surfaces; three new deterministic gates; no schema, no auth, no money)
**Type:** review (REV)
**Area:** `app/src/lib/youth-zone.js` (normalizeRecord); `app/src/components/kids/kids-zone.css` (`.kz-book .kz-scene`, `--kz-orange-ink`, `.tz .kz-pn`); `scripts/kids-make-episode.mjs` (`--burn`); the three gates named under Verification
**Sent in by:** Darrell, 2026-11-18: *"show me the actual Jonah Bible Adventure experience from the held PR"* and, after approval, *"Test on an actual phone viewport... Check text readability, buttons, image placement, navigation, badge unlocking, mobile layout, audio and video controls."*
**Pairs with:** DR-1527 (the folder publishes), DR-1531 (the Theater plays today), DR-0076 (verification), DR-0108 (review our Ways), DR-0219 (SHOULD / ARE / GAPS / CLOSE)

## Context

The J2 build had green tests but had never been driven as a signed-in child on a phone, with the trail and the badges lighting from real rows, the Theater playing a file, and a recording under a page. The review was a Playwright walk of the real YouthZone on a Pixel 7 viewport with an in-memory record store, twice: once with dev-only stand-ins (a tone recording, a draft cut) to exercise the media roads, once clean, after the first two scenes arrived.

## What was measured

- A Jonah finish with every answer right: the Great Fish badge stayed dark. The storybook writes `quiz: { passed }`; the normalizer read only `quizPassed` / `quiz_passed`.
- A draft cut with words burned into the picture under the Theater's own caption track: every line shown twice; two WebVTT cues overlapping at each crossfade.
- The storybook scene frame at 34:15 against a 16:9 scene: the top and bottom of scene 1 cut (the Joppa sign gone).
- "PAGE 4 OF 8" and "READ-ALONG" at 2.61:1 on the white card, 10.9 px; the verse at 14:1; the caption bubble at 14.4:1; every storybook button 48 px tall; no horizontal overflow at 412 px.
- Trail states from rows: fresh = one next, four locked; after each activity its stop lit; five lit = done. Front Row from an episode `ended`; Great Fish after the fix.

## Impact

A child who finishes Jonah sees the badge the rules promise, the whole illustration, and a page label they can read; the film carries its words in the caption track where the Theater shows them once. Each miss is now a machine check, so it cannot return quietly.

## Decision

1. `normalizeRecord` reads three shapes: the database row, the flattened row, and the record the app itself writes.
2. A storybook scene is drawn 16:9 and its frame matches it; a 34:15 crop is never applied to a landed scene.
3. Small words on the book card use `--kz-orange-ink` (5.42:1 on white) and the night card repaints them; bright orange stays for buttons.
4. The movie-maker burns words only with `--burn`; the WebVTT carries them, each caption cue ending before the crossfade.
5. Dev-only stand-ins (a tone, a draft cut, a signed-in harness) are never committed; the manifest test proves the folder.

## Verification

- `kids-badges-read-what-the-app-writes.test.js` (2), `kids-storybook-page-label-contrast.test.js` (3), the folder-driven case in `kids-landed-manifest.test.js`: proven to catch (the old shape, the old token, a stale manifest each fail).
- CI on head bab77bb311: 27 checks green (run 44243746753). Stills: `docs/design/love-corner-kids/phone/j2-review/`.
- `re-review: 2026-11-25` — walk again with scenes 3–8 and the first recording landed.
