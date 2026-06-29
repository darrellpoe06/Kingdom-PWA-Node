# Sovereign Voice Studio — concrete steps to bring the REAL cloned voice online

**Date:** 2026-06-25
**Status:** read-aloud WORKS today (browser System voice + labeled stand-ins). This doc is the path to the real cloned voice — what's buildable now vs gated on the GPU/studio, and the exact swap so it lights up behind the same UI.

## The swap point (already wired)

The app routes a consented personal voice through `app/src/lib/voice-service.js`:
- **Today:** no endpoint configured → `isVoiceServiceReady() === false` → every personal voice plays the labeled browser **stand-in**. Nothing faked.
- **When the studio is live:** set **`VITE_VOICE_SERVICE_URL`** (in `app/.env.local` / Vercel env) to the studio's base URL. `resolveVoiceProvider` then returns the real provider and `VoiceStudio` POSTs to it and plays the returned audio — the **real cloned voice, same UI, same buttons**. On any studio error it falls back to the stand-in (never silent).

The studio contract the endpoint must honor:
```
POST {base}/speak   { text, voice, person_key }  ->  audio/* (wav or mp3)
GET  {base}/health  ->  200
```

## What's buildable NOW (no new hardware)

1. **System voice + stand-ins** — DONE, shipped, works on every device (browser SpeechSynthesis, hardened: cancel-guard, GC-retain, resume-kick).
2. **A synthetic-voice studio on the existing church 2× RTX 4070** — Kokoro or Piper as the `/speak` service. This already beats browser voices in quality and is fully sovereign. Stand this up first; it needs no cloning, no consent beyond what's shipped.
   - Run Kokoro (Apache-2.0, ~82M params, near-realtime on a 4070) behind a tiny FastAPI `/speak`.
   - Expose it on the LAN / Tailscale only (no public surface — sovereign).
   - Set `VITE_VOICE_SERVICE_URL` → the System/preset voices now play studio-grade audio.

## What's GATED on the cloning studio (the real per-person timbre)

3. **Cloned voices (Darrell, then consented others)** — needs the cloning engine + a per-person voice model:
   - **Engine:** XTTS v2 (Coqui) or Voicebox on a CUDA box (a 4070 works for inference; the home GPU box for faster/parallel). MIT/Apache where it matters; sovereign/local.
   - **Reference audio:** 30s–3min of clean speech per person. Darrell's is consented now (building circle). Source from the COLG Wednesday Bible-study YouTube + other recordings → isolate the person's voice (the existing NAS SME/Whisper pipeline already pulls + diarizes audio).
   - **Per-person model:** the studio builds/stores a voice profile keyed by `person_key` (matches `voice_profiles.person_key`). `/speak` with `person_key: 'darrell'` returns Darrell's cloned timbre.
   - **Consent gate stays:** the studio only builds a model for a `person_key` whose `voice_profiles` row is `consent_state = granted`. BG/Christina/others: no model until they enroll in-app.

## Concrete standup sequence

1. **Pick the box** — start on an existing church RTX 4070 (retiring ProPresenter frees one; see the Presenter project). Home GPU box later for scale.
2. **Synthetic studio first** — deploy Kokoro/Piper + FastAPI `/speak` + `/health`; Tailscale-only. Verify `curl {base}/speak` returns audio.
3. **Flip the app** — set `VITE_VOICE_SERVICE_URL`; confirm the System voice plays studio audio in the Voice tab. (This alone is a big quality jump, no cloning.)
4. **Cloning studio** — add XTTS/Voicebox; wire reference-audio intake from the NAS pipeline; build Darrell's model from his consented audio.
5. **Verify the swap** — in the Voice tab, "Darrell Poe" stops saying "stand-in" and reads in his real voice; the AI-generated label stays.
6. **Roll out** — as BG/Christina/others enroll (self-consent), build their models the same way.

## Reality-trace (honest status)

- **Real now:** read-aloud of any text, System voice + labeled stand-ins, on every device. Verified live (engine `speaking: true`, controls + highlight functional).
- **One env var away:** studio-grade synthetic voices (Kokoro on the 4070).
- **Gated:** the real cloned timbre — needs the cloning engine + per-person model from reference audio. Consent + AI-label gates never relax.
