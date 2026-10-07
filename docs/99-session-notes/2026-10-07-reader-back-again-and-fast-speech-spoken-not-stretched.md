# 2026-10-07 — The reader walks back on a second tap; fast speech is spoken fast, not stretched (DR-0769)

**What Darrell said:** "Can't go back using the back button buffers so it can't be pushed again before it reads the exact same paragraph... fix it... also the voice mumbles at times when on faster speaking especially... fix it..."

**What changed and why** (full record: `docs/decisions/DR-0769-the-reader-walks-back-on-a-second-tap-and-fast-speech-is-spoken-fast-not-stretched.md`):

- `app/src/components/TTSControl.jsx` — `jumpLive` keeps the bar, the pill and the step buttons on screen while a paragraph jump is preparing (they used to fold away for the seconds the NAS voice takes); `lastBackRef` + `paragraphBackTarget` make a second Back within 4 s walk to the paragraph before the one the first Back landed on.
- `app/src/lib/read-follow.js` — `paragraphBackTarget`, `BACK_AGAIN_MS`: pure, clock injected.
- `app/src/lib/voice-service.js` — `voiceSpeedFor` (0.5..2.0), `residualRate`; both NAS bodies carry `speed` when it is not 1.
- `infra/nas-voice-lite/voice_lite_server.py` — `speed` -> piper `--length_scale`; a pace other than 1 is its own cache key; selftest extended (9 new checks).
- `infra/voice-studio/server.py` — `speed` -> XTTS `tts_to_file(speed=)`; contract test extended.
- `app/src/lib/clip-cache.js` — `clipKey` carries the pace when it is not 1; the 1x key is byte-for-byte the old key.
- `app/src/lib/clip-queue.js` — the element stretches only `rate / pieceSpeed`, per piece; a joined reading is the saved 1x pieces.
- `app/src/lib/use-read-aloud.js` — the reading's pace is pinned per read; the saved 1x pieces still join into one file; the studio's long clip remembers its pace for a live speed change.
- `app/src/lib/tts.js` — `utteranceSpan`: from 1.5x, consecutive clause segments ride in one utterance (<= 600 chars, <= 6 segments); the segment index steps from word boundaries and at the end.

**Evidence:** new tests `back-tapped-again-walks-back.test.jsx` (7), `fast-speech-is-spoken-not-stretched.test.js` (8), `the-reading-asks-the-voice-for-its-pace.test.jsx` (2), `tts.test.js` fast-speech block (4); 1,377 voice/reader/speech tests green; eslint clean; `verify:gates`, legibility, monolith budget (5302 unchanged) OK; `voice_lite_server.py --selftest` OK; studio contract test OK.

**Not changed, on purpose:** the paragraph grid, the piece cut, the download/pin keys (1x), the device-voice ladder to 5x.

**re-review:** 2026-10-21 — whether the remainder stretch above 2x on the NAS voice still mumbles; if so, measure a per-voice top of the pace ladder.
