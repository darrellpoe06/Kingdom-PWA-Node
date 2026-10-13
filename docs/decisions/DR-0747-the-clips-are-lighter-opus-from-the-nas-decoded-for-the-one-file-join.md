# DR-0747 — The clips are lighter: Opus from the NAS, decoded on the device for the one-file join

- **Status:** accepted (built and proven in the suite; the live proof is the NAS's next services-sync cycle listing "opus" in /voice-lite/health, and a download summary on his phone reading a fourteenth of the old size)
- **Tier:** B (a change to the NAS voice service and its installer, additive and self-proving; no table, no policy, no money; the words always come, in one shape or the other)
- **Type:** improvement
- **Date:** 2026-10-02
- **Scope:** `infra/nas-voice-lite/voice_lite_server.py` (`find_ffmpeg`, `OpusEncoder`, `format` in the speak body, `formats` in health, both shapes in one cache, pruning either), `infra/nas-voice-lite/install.sh` (finds or fetches ffmpeg with libopus, proves an Opus encode on the box, restarts once when the server gains it; never a condition of mounting), `app/src/lib/clip-format.js` (new: `preferredClipFormat`, `formatOfType`, `isWavBytes`), `app/src/lib/voice-service.js` (asks for the shape, says which came), `app/src/lib/joined-clip.js` (`pcmToWav`, `decodeToPcm`; the join decodes any non-WAV piece), `app/src/lib/lesson-downloads.js` (`VOICE_BYTES_PER_CHAR_BY_FORMAT`; the plan and the run carry the format), `app/src/__tests__/the-clips-are-lighter.test.js` (new), `docs/decisions/INDEX.md`.
- **Principles:** VERIFICATION-DOCTRINE (DR-0076: the size from the codec's own rate, the join proven on bytes, the NAS selftest gating merge), DR-0627 (the NAS's own real-audio voice), DR-0718 (a saved reading plays as one file), DR-0722 (downloads sized before they start), DR-0100 (the cost said plainly), DR-0075 (lighter is better, measured).
- **Grounds:** Darrell, 2026-10-02, "Download every lesson" on his phone reading "Adult only … with the reading voice 31.3 GB" and "All reading levels … 61.6 GB", over "this device has 10.0 GB free": *"Huge amount of data to download... can we make them lighter?"*

## Context

**SHOULD.** A saved lesson's voice should fit a phone. DR-0718's one-file playback should keep working on the lighter clips. A box without the encoder should keep serving the voice exactly as before.

## What was measured (SHOULD → ARE → GAPS, DR-0219)

**ARE.** A Piper clip is 16-bit 22,050 Hz mono PCM WAV: 44,100 bytes a second, 4,400 bytes a character of speech (DR-0722's measurement). Every lesson with the voice at every level is 61.6 GB because of that, and the adult voice alone 31.3 GB. The NAS voice server (`voice_lite_server.py`) had one shape, WAV, and the app's one-file join (`joined-clip.js`) read PCM WAV only, so a lighter clip would have broken the background playback DR-0718 built.

**The measure of the lighter clip.** Opus at 24 kbit/s mono is 3,000 bytes a second, constant by its bitrate: 4,400 × 3,000 / 44,100 = 299 bytes a character, 310 with the Ogg framing. So the same two choices read about 2.2 GB and 4.4 GB. This is the codec's arithmetic, not a measurement of his phone; the first download summary on his phone after the NAS gains the encoder ("Saved N lessons; X MB of reading voice") is the measurement, and the installer prints the probe sentence's WAV and Opus byte counts side by side on the NAS.

**What is NOT changed by this.** The time to make the voice (DR-0746: about as fast as it is spoken) is the same; Opus changes the bytes, not the synthesis.

**GAPS.** (1) One shape, the heaviest. (2) A join that could not take a lighter piece. (3) No encoder on the NAS road.

## Impact

A phone that plays and decodes Opus (Android Chrome, the Firestick's Silk) asks for it and keeps it, a fourteenth of the size; its saved readings still play as one file off screen because each piece is decoded back to PCM at the NAS voice's rate before the join. A device that cannot (an older Safari) asks for WAV and is unchanged. A NAS without ffmpeg answers WAV to any ask and says so in the clip's type; nothing is refused over the shape. Clips kept before this record and after it mix in one reading.

## Decision

1. **The NAS makes Opus when it can** (`voice_lite_server.py`): `find_ffmpeg` takes the first ffmpeg on the box whose encoders list libopus (`VOICE_LITE_FFMPEG`, the voice-lite home, PATH, the DSM package paths); the speak body takes `format: "wav" | "opus"`; "opus" with an encoder is answered `audio/ogg; codecs=opus`, encoded once from the cached WAV at 24 kbit/s mono and kept under the same key with the `.opus` suffix; "opus" without an encoder, or a failed encode, is the WAV, honestly typed; health lists `formats`; pruning covers both shapes.
2. **The installer finds or fetches ffmpeg** (`install.sh`): an existing ffmpeg with libopus, else one static build (johnvansickle, by CPU) under the one-large-download-per-cycle rule the voices already keep; then it proves an Opus encode of the install probe on the box and prints both sizes; the server is restarted once when health does not yet list "opus". ffmpeg is never a condition of mounting.
3. **The device asks for the shape it can use** (`clip-format.js`, `voice-service.js`): Opus when `<audio>` can play `audio/ogg; codecs=opus` and an `OfflineAudioContext` exists to decode it, WAV otherwise; the clip comes back with `format` read from its type.
4. **The join decodes a lighter piece** (`joined-clip.js`): a non-WAV piece is decoded by the browser's own decoder at 22,050 Hz (an `OfflineAudioContext` at that rate resamples for free) to 16-bit mono PCM and joined like any WAV; the memory ceiling counts decoded bytes; no decoder means no join, and the reading plays piece by piece as before.
5. **The size is said by the shape** (`lesson-downloads.js`): 310 bytes a character for Opus, 4,400 for WAV; the plan carries the format it was sized for and the run asks for that format.

## Verification

- `voice_lite_server.py --selftest` (21 checks, gates merge in `ci.yml`): without an encoder, "opus" is answered in WAV and health lists wav alone; with one, the same words come once as Ogg Opus, the second time from the cache, the WAV shape of the same words is served from the same synthesis, both shapes share one key, a failed encode answers in WAV, and pruning removes the oldest in either shape.
- `the-clips-are-lighter.test.js` (13 tests): the device asks for opus only when it can play and decode it; a Content-Type names its shape; the request carries `format` and the answer's shape is read back, a WAV answer to an opus ask reads wav; an opus piece is sized at a fourteenth of a wav piece, from the codec's rate; **proven to catch:** Opus pieces join into one WAV at 22,050 Hz with the right offsets (null against the old join), WAV and Opus pieces mix, no decoder means null never a throw, the decoded size is held under the ceiling, the WAV-only path is unchanged, `pcmToWav` writes a real 16-bit file.
- `saved-voice-keeps-playing.test.js`, `voice-clips-kept-on-device.test.js`, `lesson-downloads.test.jsx`, `the-download-says-its-pace.test.jsx`: unchanged and green.
- Lint clean.
- **Live proof:** the next services-sync cycle's install log on the NAS ("encodes Opus on this box: N bytes WAV -> M bytes Opus"), `/voice-lite/health` listing `"formats": ["wav", "opus"]` (voice-lite-probe), and a download summary on his phone. `re-review: 2026-10-05`.

## Limits, stated

1. The static ffmpeg download is about 40 MB once; it rides the voices' one-large-file-per-cycle rule, so Opus may begin one cycle after the merge lands on the NAS.
2. The one-file join decodes every piece into memory; a very long reading in Opus stays under the same 160 MB decoded ceiling as before and otherwise plays piece by piece.
3. Clips already on a phone stay WAV until they are cleared by the cap; new pieces come lighter. The download summary measures what was saved, not what was already there.
