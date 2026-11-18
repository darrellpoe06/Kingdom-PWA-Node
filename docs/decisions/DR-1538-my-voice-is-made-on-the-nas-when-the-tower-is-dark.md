# DR-1538: My voice is made on the NAS when the tower is dark, so it needs no password and no key

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** B (a new NAS service behind an existing door; reader wording; no schema, no money, no new public road)
**Type:** service + reader
**Area:** `infra/nas-voice-clone/`, `infra/voice-studio/voice_forwarder.py` + `install.sh`, `infra/nas-loops/services.json`, `app/src/lib/voice-service.js`, `my-voice.js`, `use-read-aloud.js`, `.github/workflows/voice-health.yml`
**Pairs with:** DR-0721 (my voice reads or the reader says why), DR-1360 (the NAS initiates every road), DR-1119 (a service comes home), DR-0627 (voice-lite), DR-0440 (ready means answering)

## Context

Darrell, 2026-11-18, on his personal reading voice still waiting on two values only he held (the tower's Windows password, DR-0721 Decision 5, and a fresh tailnet key): fix it so we need nothing, for all of these. The XTTS studio clones only on the 4070 tower, and every road to the tower needs that password; the runner road needs the tailnet key, dead since 2026-11-04. DR-1360 already decided the direction: the NAS starts every road, and a system the house does not control is support, never the only way.

## What was measured

- `voice-health` (issue #2280): the NAS forwarder answers, the studio behind it does not (`502 studio-unreachable`); the arm lane never reached the tower (12 runs, DR-0721).
- `lessons-sync` run 44298702775, 2026-11-18 11:57Z: `Tailnet join FAILED using the authkey credential`.
- A fresh cloud session has no Gmail tools (probe session, `GMAIL: no`), recorded for the intake lane that shares this request.
- OpenVoice (myshell-ai/OpenVoice): LICENSE read upstream, MIT; commit `74a1d14` pinned. The converter modules (models, modules, attentions, commons, transforms, mel_processing, utils) import only torch, numpy and librosa; read from the source, not assumed.
- Not measured, said plainly: the converter's speed on this NAS. Its weights live on Hugging Face, which this sandbox cannot reach. The installer measures it on the box and `/health` shows it (`rtf`).

## Impact

When the tower is dark, picking My voice no longer means the stand-in reads. The NAS makes the reading: Piper speaks the piece in the house voice, and the OpenVoice V2 tone-color converter moves it onto the listener's own recording, which already rides every request. It is the sound of his voice with the house voice's pacing, not the XTTS clone, and the reader says so. Nothing outside the house has to be alive; the NAS installs it from main on its own clock.

## Decision

1. **`infra/nas-voice-clone`** (`nas_clone_server.py`, `install.sh`, a systemd unit): loopback only, one synthesis at a time, 600 characters per piece, a bounded clip cache, one embedding per recording kept only on the NAS. `/health` answers with a reason when it is not ready and never claims the voice early. Registered in `services.json` ahead of `voice-transport`; the installer brings the venv, CPU PyTorch 2.4.1, librosa and the OpenVoice modules (`--no-deps`) and the converter weights one large download per cycle, retries a failed step at most daily, restarts onto the repo's code on every path, and measures its own speed once per code version.
2. **The forwarder asks the tower first** and hands a piece to the NAS clone when the tower is dark; a dark tower is re-asked once a minute, never per piece. `/health` passes the clone's own answer through (`engine: nas-clone`, `studio: unreachable`); a clone that is not ready never turns it green. The forwarder's installer mounts `/voice` when the tower answers or the clone does.
3. **The reader names the engine.** The probe keeps the `engine` the answer gave, and forgets it when the road reads down; the My voice line says the NAS made it and that the pacing is the house voice's.
4. **The witness reads the public road** (`/voice/health` needs no key) on every run, and prints the clone's install state beside the forwarder's when the tailnet is up.
5. **The tower stays the better engine.** When it answers, it is asked first, unchanged. DR-0721's license line stands: XTTS non-commercial for the family and church; this engine is MIT.

## Verification

- `nas_clone_server.py --selftest` (CI): strict request reading, a not-ready box refuses with its reason, the engine named, the cache per voice and pace, two pieces run one after the other, the cache bounded.
- `voice_forwarder.py --selftest` section 9: a dark tower hands /speak to the clone, the engine is named, /health says nas-clone and that the tower is unreachable, the same lock applies, and (proven to catch) a clone that is not ready never turns /health green.
- `my-voice-on-the-nas.test.js` (8): the wording, the probe's engine, and the wiring; the engine-forget case fails when the reset is removed.
- `a-service-comes-home`: `voice-clone` walks the Way at birth.
- **Not yet observed:** the first live read in his voice from the NAS. It counts as working when `/voice/health` answers `engine: nas-clone` with a measured `rtf` on the public road, and a reading plays. `re-review: 2026-11-20`.
