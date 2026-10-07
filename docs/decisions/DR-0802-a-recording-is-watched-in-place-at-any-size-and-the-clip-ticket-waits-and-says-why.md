# DR-0802 — A recording is watched in place, at any size; the clip ticket waits longer and says why when it fails

- **Status:** accepted
- **Tier:** A (the Recordings panel's play path and the sizes menu; no new road on the NAS)
- **Type:** fix
- **Date:** 2026-10-07
- **Scope:** `app/src/lib/cameras.js` (`recClipPlayUrl`, `waitForClipSize({dl})`, `clipTicket` with `CLIP_TICKET_TIMEOUT_MS` 15 s, one retry on a timeout, plain messages; `humanizeFetchError`), `app/src/components/Cameras.jsx` (`RecordingPanel`: Watch and Download per tier, one kept ticket per camera, the player names the size and that nothing is saved), `app/src/lib/help-content.js`, `cameras.test.js`, `cameras-render.test.jsx`.
- **Principles:** DR-0775 (recorded loops on the NAS), DR-0797 (the size tiers), DR-0774 (the honest reason, never a painted state), DR-0076
- **Grounds:** Darrell 2026-10-07, a tablet screenshot of the Recordings panel reading *"Could not open the clip: signal is aborted without reason"*: *"Users should be able to just watch a stream from a recording... no need to download... all options..."*

## Context

SHOULD: a person taps a clip and watches it from the NAS, at the original size or at any of the sizes DR-0797 makes, without saving anything; a tap that fails says what happened in words. ARE: the sizes menu offered only Download; the play path minted its own ticket with the 12 s bound every small call has, and on a link carrying 16 live streams (2.03 MB/s through the Funnel, measured by cams-diag at 22:49 UTC) that POST timed out and the panel printed the browser's `AbortError` text verbatim.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| the message (before) | "signal is aborted without reason" — the DOMException of `AbortController.abort()` with no reason, i.e. the 12 s timeout | the screenshot; `fetchWithTimeout` |
| the link at that moment | 16 live streams open, 2.03 MB/s leaving the house | cams-diag run 37698554749 |
| Watch at a size (after) | the sizes menu's Watch asks the NAS without `dl=1`, waits through 202 while the file is made, then plays `…?t=&size=small` in place; no anchor click, no new ticket | `cameras-render.test.jsx` (DR-0802 case) |
| the ticket (after) | 15 s bound, one retry after a timeout, the same ticket reused for play, sizes and download for an hour less a margin | `cameras.test.js` (`clipTicket`) |
| the failure (after) | "Could not open the clip: Could not get a playback ticket: the NAS did not answer in 15 s (the link is busy or the camera service is down)." | both suites |

## Decision

1. **Watch is the primary act; Download is beside it.** Every tier row has Watch and Download. A tap on a clip plays the original at once; Watch on a tier plays that size in place the moment the NAS has it, with its place in line shown meanwhile.
2. **The player says what it plays:** the time, the size, and "from the NAS, nothing saved here".
3. **One ticket per camera, kept** for the hour it lives; the play, the sizes and a download share it.
4. **A slow NAS is said in words:** the ticket waits 15 s, tries once more after a timeout, and names the seconds and the likely cause. The browser's own exception text never reaches the panel.

## Verification after merge

- CI: both camera suites.
- `re-review: 2026-10-10` on the tablet: tap a clip, then Watch on Small — the panel plays it and says the size; with the window open on the Firestick at the same time, a tap still answers within 15 s or says why.

## Impact

- **Family:** recordings are watched, at the size the moment calls for; a download is a choice, not the only road.
- **NAS:** nothing new; the derived files already exist for the tiers.
