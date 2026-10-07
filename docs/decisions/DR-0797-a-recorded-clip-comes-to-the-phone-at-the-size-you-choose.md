# DR-0797 — A recorded clip comes to the phone at the size you choose: small, medium, large or original, each the best picture that fits

- **Status:** accepted
- **Tier:** A (a read road for clips already on the NAS, behind the same ticket; one bounded ffmpeg at a time; its own budget; no new service, no schema)
- **Type:** feature
- **Date:** 2026-10-07
- **Scope:** `infra/nas-cameras/cams_forwarder.py` (`CLIP_SIZES`, `estimate_sizes`, `clip_seconds`, `transcode_argv`, `DerivedStore` — one worker, a line, a budget, orphan pruning; `GET /rec/<id>/<clip>.mp4?size=&dl=&retry=&sizes=1`; `_serve_mp4` with `Content-Disposition`; `/rec/<id>` carries each clip's seconds and estimates; `/recording` and `/health` carry the store's snapshot), `app/src/lib/cameras.js` (`CLIP_SIZE_TIERS`, `recClipSizesUrl`, `recClipDownloadUrl`, `clipDownloadName`, `clipTierLine`, `fetchClipSizes`, `waitForClipSize`), `app/src/components/Cameras.jsx` (the ↓ beside every clip opens the Download menu: every tier with its size, Download, the NAS's progress, Try again), `app/src/lib/help-content.js`, `infra/nas-cameras/README.md`, selftest 8k, `cameras.test.js`, `cameras-render.test.jsx`.
- **Principles:** DR-0775 (recorded loops on the NAS), DR-0778 (the ticket opens one camera's clips), DR-0774 (the honest answer, never a painted state), DR-0076, DR-0225 / DR-0248 (budget + lock, deterministic class)
- **Grounds:** Darrell 2026-10-07: *"Pushing record only records to the nas... not to the cellphone correct... options to download based on size and the ability to give smaller to large size files with their best resolutions etc... make sense?"*

## Context

SHOULD: Record keeps clips on the NAS (DR-0775) and nothing on the phone; a person who wants a clip on their phone chooses how big a file to take, and each size is the best picture that size can carry. ARE, before this: `GET /rec/<id>/<clip>.mp4?t=` served the original only, as a stream for the in-app player (`Content-Type: video/mp4`, Range, no `Content-Disposition`); a ten-minute 1080p clip at the recorder's copy rate is tens of megabytes, and there was no smaller shape and no Download at all. The answer to the first half of his question is yes: the recorder writes to `/volume1/PoeTech/cameras/recordings/<id>/` and nowhere else.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| where Record writes | the NAS recordings folder only (`cams_recorder.py` `ffmpeg … -c copy -f segment /recordings/<cam>/…`) | the recorder's own argv, selftest 2 |
| the tiers | small 480p CRF 30 (est. 600 kb/s), medium 720p CRF 26 (1.5 Mb/s), large 1080p CRF 23 (3 Mb/s), extra large 1440p / 2.5K CRF 21 (6 Mb/s), ultra 2160p / 4K CRF 20 (12 Mb/s); never upscaled (`scale=-2:'min(H,ih)'`) — Darrell, same day: *"4k for those types if possible so 2k or 3k... larger size options too"* | `transcode_argv`, selftest 8k |
| an estimate | the tier's rate × the clip's seconds, never above the original: 600 s → small 45 MB; medium/large capped at a 100 MB original | `estimate_sizes`, selftest 8k |
| a clip's seconds | to the next clip's start (600), the newest to now (120) | `clip_seconds`, selftest 8k |
| the first ask | 202 `{status: queued, position: 1, retry_in: 3}`; then 200 `video/mp4` with `Content-Disposition: attachment; filename="front_yard-2026-10-07T06-40-00-small.mp4"`; the `.part` renamed away | selftest 8k |
| made once | the second ask serves the kept file with Range; ffmpeg is not run again | selftest 8k |
| a failure | 500 `transcode-failed` with ffmpeg's words, credentials scrubbed; it stays failed until `retry=1` | selftest 8k |
| the budget and orphans | over budget the oldest derived file goes first; a derived file whose source clip is gone is removed | selftest 8k |
| the worker | one at a time; a job appended as the worker leaves is never stranded (the hand-off happens under one lock; the race was caught by the selftest and fixed) | selftest 8k |
| the app | `waitForClipSize` asks once with `retry` and polls without it, reporting the place in line; tier lines say measured bytes when ready and "about" before | `cameras.test.js` |
| suites | forwarder selftest green (every check); `cameras.test.js` + `cameras-render.test.jsx` green | runs below |

## Decision

1. **Record stays NAS-only.** Nothing changes in the recorder; a clip reaches a phone only when a person asks for it from the Recordings panel.
2. **Six sizes, each the best picture that fits.** Original as recorded; Ultra 2160p / 4K; Extra large 1440p / 2.5K; Large 1080p; Medium 720p; Small 480p — the tier's height is a ceiling, never a stretch, so a 1080p camera's Large, Extra large and Ultra are all its full picture (at three quality settings) and a 2.5K camera's Ultra is 2.5K.
3. **Made once, on the NAS, by the container's own ffmpeg** (the recorder's, DR-0775), one at a time, into `<recordings>/.derived/<camera>/<time>.<size>.mp4` through a `.part`; served with Range like the original; `dl=1` adds the file name so the phone saves it.
4. **Honest while it works.** A size not yet made answers 202 with its place in the line; the app shows "in line (n)" / "being made on the NAS…" and downloads when the NAS says 200. A failure is ffmpeg's own words, scrubbed, and stays until Try again.
5. **Its own brakes.** `CAMS_DERIVED_BUDGET_GB` (2) prunes the oldest derived file first; a derived file whose source was pruned is an orphan and goes; stale `.part` files go; `CAMS_TRANSCODE_TIMEOUT` (900 s) bounds a run. The single worker is the lock.

## Verification after merge

- Forwarder selftest in CI (`ci.yml`); the two camera suites.
- `re-review: 2026-10-14` on Darrell's phone: open Recordings → Clips → ↓ on a clip → Small → the file saves as `<camera>-<time>-small.mp4` and plays; the NAS log shows one ffmpeg per tier.
- Deploy proof per DR-0107, and the NAS picks up the forwarder on its services-sync cycle (install.sh `CODE_SHA`); `/health` → `derived` present.

## Impact

- **Family:** a clip on the phone at the size that suits the moment, with the size known before pressing Download.
- **NAS:** one bounded ffmpeg at a time, a 2 GB derived cache that prunes itself; nothing runs until someone asks.
