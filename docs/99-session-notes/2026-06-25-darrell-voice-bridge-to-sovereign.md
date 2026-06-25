# Darrell hears Darrell — record-your-voice + bridge-to-sovereign

**Date:** 2026-06-25
**Decision (orchestrator):** BRIDGE-TO-SOVEREIGN. Record his sample in-app now; run XTTS-v2 (few-shot) on a GPU endpoint so he hears himself ASAP; migrate the same voice to the church 2× RTX 4070 studio later. Same UI/voice slot — only the backend swaps.

## What ships now (in the app, working)

- **🎙 Record your voice** in the Voice tab (`VoiceStudio`): read a ~30s script, **preview** the playback, **re-record**, **Save**. Recording IS the consent gesture. Capture = `getUserMedia` + `MediaRecorder` (`lib/voice-recording.js`); the sample is stored on-device in IndexedDB (`lib/voice-reference.js`) — sovereign, nothing leaves the device until *he* chooses to synthesize.
- The saved sample is the **clone reference**. XTTS-v2 is few-shot: it conditions on the reference at inference (no per-user training), so the moment the endpoint is live, the sample → him reading any text.
- **Honest gate (shown in-app):** browser TTS can't clone. Recording works now; *generating his voice from the sample* needs the XTTS-v2 endpoint live. Until then, the labeled stand-in plays (never silent).

## Model pick (verified June 2026)

**XTTS-v2** (the decided model): ~3–4GB VRAM at inference (fits a 4070's 12GB easily), few-shot from **~6s** of reference, ~3.5s latency, 17 languages. License: **CPML (non-commercial)** — fine for family/church sovereign use. The app's endpoint contract is **model-agnostic**, so an MIT model (F5-TTS, OpenVoice v2 — both ~2–3GB, MIT) can swap in with **zero app changes** if commercial productization ever needs it.

## The fastest path to "Darrell hears Darrell" — exact steps

### Step 1 — record (Darrell, in-app, tonight)
Open **Voice → 🎙 Record your voice**, read the script, **Save**. Done. (Works on his phone — Chrome/Safari, HTTPS.)

### Step 2 — turn on the BRIDGE (his hand: ~5 min, the only gate to hearing himself)
The app calls a same-origin Vercel function (`app/api/voice-speak.js`) that runs XTTS-v2 on a hosted GPU (Replicate). It's **inert until two env vars are set**:

1. **[HIS HAND]** Create a Replicate account → get an API token: https://replicate.com/account/api-tokens
2. **[HIS HAND]** In Vercel (project → Settings → Environment Variables), add:
   - `REPLICATE_API_TOKEN` = the token (server-side; the browser never sees it)
   - `VITE_VOICE_BRIDGE` = `1` (client; routes the Voice tab to the bridge)
   - *(optional)* `VOICE_REPLICATE_MODEL` = `lucataco/xtts-v2` (default; pin a model if desired)
3. **[HIS HAND]** Redeploy (push to `main` or hit Redeploy).

Then: in the Voice tab, select **Darrell Poe**, press **Read** → he hears **himself** read the text. Cost is pay-per-second on Replicate, only when a clip is generated; the function caps each request (~60s) so cost stays bounded.

### Step 3 — migrate to SOVEREIGN (his hand: when ready, zero cost per call)
Stand up the local studio on a church RTX 4070 (`infra/voice-studio/server.py` — FastAPI + Coqui XTTS-v2, same contract):
1. **[HIS HAND]** On the 4070 box: `pip install fastapi uvicorn TTS torch` (CUDA torch), `python server.py` (serves `:8770`).
2. **[HIS HAND]** Expose it on Tailscale/LAN only (no public net).
3. **[HIS HAND]** In Vercel, set `VITE_VOICE_SERVICE_URL` = the studio URL (e.g. `https://poetech.tail5a2f35.ts.net:8770`) and **remove** `VITE_VOICE_BRIDGE`. Redeploy.

The UI/voice slot is unchanged; the backend swaps bridge → sovereign. Nothing leaves the network. The recorded sample (his hand: re-record once on the studio device, or sync) feeds the local model.

## Honest sovereignty note

The **bridge** sends his text + voice sample to Replicate (a third party) to get the **first result fast** — the MVP rung. The **destination** is the local 4070 studio where nothing leaves the network (DATA-AS-EMPOWERMENT). This is the sovereign-mesh dual-track: MVP now, sovereign home next. The consent + "AI-generated voice" label hold throughout; the voice is only ever used to read text he chooses — never to put words in his mouth.

## Files

- `app/src/lib/voice-recording.js` — mic capture + script + helpers
- `app/src/lib/voice-reference.js` — on-device sample store (the clone reference)
- `app/src/lib/voice-service.js` — bridge/sovereign endpoint selection + reference-passing synth
- `app/src/components/VoiceStudio.jsx` — the 🎙 Record panel + real-voice playback
- `app/api/voice-speak.js` — the XTTS-v2 bridge (Replicate), inert until configured
- `infra/voice-studio/server.py` — the sovereign 4070 studio (same contract)
- `app/vercel.json` — CSP `media-src` added so recorded/cloned audio can play
