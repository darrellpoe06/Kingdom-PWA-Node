# DR-0656 — The voice can live on the device: the NAS's Piper voice, downloaded once and made on the phone with no connection

- **Status:** accepted
- **Tier:** B (a new user-facing card, a new third-party download, and a GPL component conveyed to devices; the reader is NOT switched over by this record)
- **Type:** capability
- **Date:** 2026-09-25
- **Scope:** `app/src/lib/device-voice.js`, `app/src/lib/device-voice-engine.js`, `app/src/lib/device-voice.worker.js`, `app/src/lib/device-voice-phonemes.js`, `app/src/components/DeviceVoiceCard.jsx`, the "On this device" tab in `app/src/components/VoiceStudio.jsx`, `app/public/sw.js` (the kept-cache prefix), `app/vite.config.js` (`worker.format: 'es'`), `app/package.json` (`onnxruntime-web` 1.30.0, `phonemizer` 1.2.1, exact), `NOTICE`
- **Principles:** SOVEREIGNTY (the voice stops depending on a live road to the NAS), VERIFICATION-DOCTRINE (DR-0076: measure, proven-to-catch), FORM-FACTOR-MEASURED (DR-0239), SPEAK-ESTABLISHED-FACT (DR-0100), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** Darrell, 2026-09-25 00:55 UTC: *"So we need a direct connection to the nas for a good reading?!!! Can't we give everything it needs for quality without needing to reconnect with the nas?"*

## Context

The reader's good voice is Piper on the NAS (`infra/nas-voice-lite/voice_lite_server.py`, route `/voice-lite`, `en_US-ryan-medium` / `en_US-amy-medium`). Every clip crosses the network. Cache-ahead (`clip-queue.js`, another lane) fetches a lesson's clips once, but a lesson that was never fetched still needs the NAS. Darrell asked whether the device can be given everything it needs.

It can. Piper is two pieces: the espeak-ng phonemizer and a ~63 MB ONNX model. Neither needs a server. This record builds the on-device engine, measures it honestly, and puts a card in the Voice surface where it is downloaded and tried.

## What was measured

All numbers come from this sandbox: an Intel Xeon @ 2.10 GHz VM with 4 vCPUs, headless Chromium 1194 through Playwright 1.56. The harness imports the shipped `device-voice.js` and worker, and nothing else.

**1. Parity with the NAS voice.** Ten test passages were run through the piper binary the NAS installs (`2023.11.14-2`, `--debug` prints its phoneme ids) and through our recipe (`device-voice-phonemes.js` + `phonemizer`). The passages include Scripture references, money, dates, quotes, a colon and a semicolon.

| Phonemizer | Identical id sequences |
|---|---|
| **phonemizer.js 1.2.1 + our clause rule (chosen)** | **10/10, sentence by sentence** |
| `@diffusionstudio/piper-wasm` 1.0.0 (inside `@mintplex-labs/piper-tts-web`) | 9/10, and only when flattened across sentences |
| piper-tts 1.8.0 (the newer Python Piper, for contrast) | 7/10 (its newer espeak-ng adds a linking `ʲ` and says "fɔːɹ" where the NAS says "foːɹ") |

Same ids + same model + same scales (`noise_scale 0.667`, `length_scale 1`, `noise_w 0.8`) is the same voice. The WAV assembly also matches the binary, read from its `--help` and its own output: each sentence is peak-normalized to 32767, then 0.2 s of silence (4410 samples) follows every sentence. The ids are pinned in `app/src/__tests__/fixtures/device-voice-nas-parity.json`.

**2. Speed, on the real worker path.** Chromium's CDP CPU throttling was tried first and **rejected as an instrument**. It does not reach a dedicated worker. Even on the main thread it barely slowed WASM: the warm one-sentence time went 1.5 s → 1.8 s → 1.9 s at 1x/4x/6x. So the voice's worker thread was moved into a cgroup capped at 1/N of a core (CFS quota, by thread id), and nothing else was capped. That is a genuinely N× slower core for the voice while the rest of the browser keeps its own cores, as on a multi-core phone. Calibration: a pure single-thread loop runs 3.6× slower under the 1/4 cap.

| Worker core | First audio, 1 sentence, voice not yet loaded | …after an app reload | 1 sentence, loaded | 180 characters, loaded (whole piece) | Real-time factor |
|---|---|---|---|---|---|
| **1× (this core)** | 4.3–5.8 s | 3.5–3.6 s | 0.7–0.9 s | 2.8 s | **0.30–0.45** |
| **1/4 core ("4×")** | 9.9–10.5 s | 11.3–11.6 s | 2.2–2.4 s | 9.7–10.2 s | **1.05–1.11** |
| **1/6 core ("6×")** | 17.2 s | 17.5 s | 3.2 s | 15.1 s | **1.54–1.61** |

The real-time factor is seconds of work per second of speech. Below 1 keeps up with playback; above 1 falls behind. Loading the model is 2.8–3.8 s at 1×, 6.7–7.2 s at 1/4 core and 12.8 s at 1/6 core.

**3. Threads (would COOP/COEP be worth it?).** On a cross-origin-isolated page, 180 characters: 1 thread RTF 0.282, **2 threads 0.213 (1.32× faster)**, 4 threads 0.364 (slower on this 4-vCPU host). COEP `require-corp` would reach, by count in `app/src`: 3 YouTube-embed components, 6 unpkg references, 9 `window.open` calls and 4 `signInWithOAuth` paths (COOP severs the opener). A 1.3× gain does not justify that. **No COOP/COEP; one thread.**

**4. Memory, the renderer process, on the worker path.** Idle 132–133 MB. **Peak 625–657 MB while loading the model and speaking.** Loaded and idle, 365–366 MB. After `releaseDeviceVoice()`, back to 133 MB.

**5. Download size.** 84,852,177 bytes were received and cached in the measured run: model 70,606,504 + runtime 14,239,897 + config 5,776. The model measured here is `voice-en-us-ryan-medium` from the rhasspy/piper `v0.0.2` GitHub release, because Hugging Face is denied by this sandbox's egress policy. The v1.0.0 file the app actually fetches is the one the NAS installer pulls, "~63 MB" by `install.sh`'s own note, **not measured from here**. On the wire, the runtime is 3.66 MB gzipped (Cloudflare compresses it). The model is 58.4 MB even gzipped (float weights barely compress). The worker chunk is 1.40 MB raw / 0.71 MB gzipped.

**6. The second load makes zero network requests.** In every measured run, after the download a reload plus a Sample made **0** requests for `/models/`, `.onnx` or `.wasm`, and `fetch` was called 0 times while speaking.

**7. The card, walked in Chromium** at 360×780, 390×844 and 1920×1080, with the real component and the app's own Tailwind and CSS. No horizontal overflow in any state (`scrollWidth` equal to `innerWidth` before, during and after). The Sample line read, for example, "Made on this device in 2.5 s for 3.9 s of speech (the first time also loads the voice: 4.8 s)." The walk **caught a defect**: progress read "0.0 MB of 0.0 MB (100%)", because the 5 KB config arrives first and the total counted only sizes declared so far. It was fixed: the total is the host-measured size (HEAD), and without it the card shows bytes received and no percentage. It is pinned by a test.

**8. Hosts.** Hugging Face `rhasspy/piper-voices@v1.0.0` is the same files the NAS installer uses. Its CORS answer to a browser was **not verifiable from this sandbox** (egress denied). GitHub release assets were measured: they send **no `Access-Control-Allow-Origin`**, so a browser cannot read them, and that host is rejected. Cloudflare Pages refuses any file over 25 MiB (DR-0595), so our own origin cannot serve the model; the 14.2 MB runtime fits and passes `asset-size-guard`.

**9. Candidates and licenses (read from the packages).**
- `onnxruntime-web` 1.30.0: MIT. Its dependencies are Apache-2.0 / MIT / BSD-3 / ISC.
- `phonemizer` 1.2.1 (xenova): declared Apache-2.0, but it **embeds espeak-ng, which is GPL-3.0-or-later**. Every Piper-in-the-browser option phonemizes with espeak-ng, because the voices were trained on its phonemes.
- `@mintplex-labs/piper-tts-web` 1.0.5: MIT, updated 2026-08. Rejected: an 18 MB extra phonemizer data file, ORT 1.18 from cdnjs, the phonemizer module re-instantiated on every chunk, and 9/10 parity.
- `piper-tts-web` (Poket-Jony) 1.1.2: rejected, pulling in `@huggingface/transformers` for a 160 MB unpacked package.
- `sherpa-onnx` (Apache-2.0): its npm package targets Node, and its browser TTS builds bake one model into the WASM data file. That is not a library that can drive our two voices, so it is rejected; it was not run.
- The Ryan voice's dataset licence, read from `MODEL_CARD` in the release tarball: **CC BY-NC-SA 4.0**. The Amy card was not reachable from here.

## Impact

- **Which devices it suits.** A laptop, a desktop, or a current phone whose core is at least as fast as this Xeon core: **good**, about 3× faster than speech. At a quarter of that core it runs **at about real time** (1.05–1.11), with no margin to stream sentence by sentence. It can still make a lesson ahead of time. At a sixth of that core (Fire TV Stick class), it is **too slow** (1.5–1.6× slower than speech, 17 s to first audio). Its **~650 MB peak** is also too much for a 1–2 GB stick, so **NAS cache-ahead stays that device's path**.
- **The 1/4 and 1/6 rows are this host slowed, not a phone measured.** Where a given phone falls, the card measures on the phone itself. Sample reports the real factor, and `speedVerdict` says plainly "too slow on this device" above 1.0.
- **Nothing the person uses changes yet.** The reader still reads the way it did. The card is additive, and the ~85 MB download happens only when the person presses Download.
- **Licensing is now a Governor item.** The worker chunk carries espeak-ng (GPL-3.0-or-later) to every device that downloads the voice. NOTICE now names it and where its source lives. The Ryan voice's NC-SA dataset licence applies to the NAS path today as well; the NAS never conveyed a file, but this does.

## Decision

1. **The engine** is `phonemizer` (espeak-ng in WASM) + Piper's own id recipe (`device-voice-phonemes.js`) + `onnxruntime-web` on WASM, one thread, no COOP/COEP. It runs in a module worker (`device-voice.worker.js`, calling `device-voice-engine.js`). All of it is bundled through npm into the app build, and espeak-ng exists only in the worker chunk (verified: `grep espeak dist/assets/*.js` hits one file). Nothing is preloaded by `index.html` (0 matches).
2. **The files** are the voice's `.onnx` + `.onnx.json` from Hugging Face `rhasspy/piper-voices` pinned at `v1.0.0` (`DEFAULT_VOICE_BASE`), plus the runtime `.wasm` from our own build. `VITE_DEVICE_VOICE_BASE` moves the model to a mirror without a code change; **a Cloudflare R2 bucket is the proposed sovereign mirror**. All three are kept in Cache Storage `poetech-keep-device-voice-v1`, under stable logical keys. `sw.js`'s activate handler now spares any cache named `poetech-keep-*`, so a deploy never re-downloads the voice. Each file is checked before it is kept: WASM magic, a Piper config, and a model that is not an HTML page.
3. **The API** is `synthesizeOnDevice({ text, voice }) -> { url, ms, audioSeconds, initMs } | { error }`, the same shape as `synthesizeLite`, with the same `'male' | 'female'` words. It reads only Cache Storage. Before the download it answers `{ error: 'device-voice-not-downloaded' }` and touches no network. `checkDeviceVoice` answers ready / downloadable / unsupported, each with a reason: no WebAssembly, no SIMD, no worker, no storage, or too little free space. `downloadDeviceVoice` streams with honest progress. `releaseDeviceVoice` frees the ~230 MB a loaded voice holds.
4. **Wiring into the reader waits** on the clip-queue / read-aloud lanes landing (those files are owned elsewhere), and then:
   - (a) in the reader's engine choice, prefer `synthesizeOnDevice` when `checkDeviceVoice` is `ready` **and** the measured factor on this device is ≤ 1.0, otherwise voice-lite;
   - (b) let cache-ahead pre-render a lesson on the device when the NAS is unreachable;
   - (c) keep one sentence per clip, as voice-lite does;
   - (d) call `releaseDeviceVoice` when the reader closes;
   - (e) honour DR-0654 §6, one reading and one voice. The device voice takes the reading's pinned gender (`'female'` for the System voice, whose NAS voice is Amy), and a hand-over between the NAS and the device never changes who is speaking.

   The Firestick path DR-0654 fixed (NAS voice-lite with the family key) stays that device's path. That agrees with the measurement above.
5. **Licences go to the Governor** with a recommendation. Keep the card as an explicit opt-in, and carry the espeak-ng source offer in NOTICE (done). Decide whether PoeTech's use sits inside the Ryan dataset's non-commercial terms, or move the default voice to one whose dataset licence is permissive. re-review: 2026-10-02.

## Verification

- `app/src/__tests__/device-voice.test.js`, **26 tests**:
  - parity with the NAS binary, 10 cases;
  - the clause rule, the WAV assembly and the capability check;
  - the speed verdict;
  - download-once, where a second download fetches 0 files and speaking makes 0 `fetch` calls with a real `blob:` URL back, and the model is loaded once for two speaks;
  - honest progress, refusal of an HTML "model", and sw.js sparing the kept cache.
- **Proven to catch: 9 deliberate breaks, each turned the suite red, and the suite was green again after each restore.**
  1. The clause rule breaking at every colon (4 red).
  2. No pad after phonemes (10 red).
  3. The download ignoring the cache (1).
  4. SIMD unchecked (1).
  5. The worker not kept (1).
  6. No sentence silence (1).
  7. sw.js deleting the kept cache (1).
  8. An HTML model accepted (1).
  9. The progress total counted from sizes declared so far (1).
- The related suites (voice, sw, VoiceStudio, ui-standards and neighbours): **39 files, 557 tests, green.** `npm run lint` is clean. The real `vite build` passes, and `asset-size-guard` passes (the largest file is the living-lessons chunk at 10.77 MiB; the runtime is 13.6 MiB, under the cap).
- **Not verified here, with dates:**
  - Hugging Face's CORS answer and the exact v1.0.0 file size are shown by the first real download on a device, where the card reports a refusal plainly; otherwise the R2 mirror is set. re-review: 2026-10-02.
  - The speed on real phones is read from the card's Sample on Darrell's Android and the Fire TV. re-review: 2026-10-02.
  - Reader wiring: when the clip-queue lane merges. re-review: 2026-10-01.
