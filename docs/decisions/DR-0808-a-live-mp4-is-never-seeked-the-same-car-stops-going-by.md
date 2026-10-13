# DR-0808 — A live MP4 is never seeked: the same car stops going by

**Date:** 2026-10-07 · **Status:** decided · **Lane:** cameras · **Pairs with:** DR-0799 (a live tile stays live), DR-0782 (the live roads), DR-0788 (the Window view)

## Context

Darrell, 2026-10-07, the Window view on the Firestick: *"the livestream from the cameras keep looping the video the same car keeps going by... on the Window view... make sense? Fix it..."*

DR-0799 gave every live tile a keeper: a frozen picture reconnects, and a picture trailing the live edge is pulled back to it. The pull was a **seek**: when the play position trailed the end of what had arrived by more than `LIVE_LAG_SEEK_S` (3 s), the keeper set `currentTime` to the edge.

## What was measured

| Fact | Where |
|---|---|
| The MP4 live road is one chunked HTTP body with no byte ranges (`Cache-Control: no-store`, no `Accept-Ranges`) | `cams_forwarder.py` `_live_mp4`; go2rtc `/api/stream.mp4` |
| A seek on a resource the engine cannot range-request is left to the engine; Chromium re-reads from what it already holds for that address, so the seconds just shown play again | engine behaviour; the symptom Darrell named is exactly this: a few seconds replaying |
| Frames arrive in keyframe-sized bursts, so "buffered ahead" on MP4 swings by several seconds while the picture is not late at all | the Wyze cameras' GOP; `liveEdge` reads `buffered.end` |
| The keeper's seek fired on that swing, the engine replayed, the stream fell behind again, the keeper seeked again | the loop |
| HLS is seekable by design (a playlist of segments), so a jump there is sound | `liveEdge(video, 'hls')` reads `seekable.end` |

## Decision

1. **A progressive MP4 live stream is never seeked.** `liveEdgeDecision({ mode })` on MP4: a lag over `LIVE_LAG_RATE_S` runs down at `LIVE_CATCHUP_RATE` (1.08x), over `LIVE_LAG_SEEK_S` at `LIVE_CATCHUP_RATE_FAST` (1.25x), and only past `LIVE_LAG_RECONNECT_S` (12 s) is the stream truly behind: `tendLiveVideo` answers `behind` and the tile opens a fresh stream, with the reason on the tile ("the picture fell N s behind live"). HLS keeps the jump.
2. **Every connection is its own address.** `liveUrl(id, mode, ticket, { nonce })` adds `&r=<n>` on each reconnection (the ticket itself lives an hour), so no engine buffer for a previous connection can answer a new one.
3. Both live players (the tile and the Window view's bare tile) act on `behind` exactly as on a freeze.

## Verification after merge

- On the Firestick Window view: a car that passes, passes once. The tile's badge counts reconnects only on a real freeze or a 12 s lag.
- Gate: `cameras.test.js` — on MP4 a 5 s lag leaves `currentTime` untouched and sets the fast rate; a 14 s lag answers `reconnect` with the distance and touches neither position nor rate; the same distance on HLS seeks to the edge; `liveUrl` carries the nonce only from the first reconnection.
- `re-review: 2026-10-14` against the stream health log's drop kinds for the Window view's cameras.

## Impact

The keeper keeps what DR-0799 promised (a live tile stays live) without the one move an unseekable stream cannot take. Catch-up is by rate, which every engine honours; a real lag is a reconnect, which the tile already knows how to do.
