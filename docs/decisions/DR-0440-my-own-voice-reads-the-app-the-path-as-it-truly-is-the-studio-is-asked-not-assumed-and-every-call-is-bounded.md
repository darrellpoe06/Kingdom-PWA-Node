# DR-0440 — My own voice reads the app: the path as it truly is, the studio is asked not assumed, and every call is bounded

- **Status:** accepted
- **Tier:** A for what ships here (a timeout, a health probe, an honest state line); the arming steps are Tier C by DR-0430 and stay in Darrell's hand
- **Date:** 2026-09-16
- **Type:** product + orchestration
- **Scope:** `app/src/lib/voice-service.js` (`SPEAK_TIMEOUT_MS`, `HEALTH_TIMEOUT_MS`, `probeVoiceService`, `voiceServiceHealth`, `isVoiceServiceAnswering`; `synthesizeSpeech` bounded and abortable), `app/src/lib/use-read-aloud.js` (ready means answering), `app/src/components/VoiceStudio.jsx` (the studio's real state, said plainly), `app/src/__tests__/voice-service-hardening.test.js`
- **Principles:** SOVEREIGN-FIRST (DR-0138), VERIFICATION-DOCTRINE (DR-0076 — asked, not assumed; training-data claims flagged), THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), DoD (every async has a timeout and a fallback), CONSENT (intake-voice-clone-CONSENT.md)
- **Grounds:** DR-0138, DR-0382, DR-0386, DR-0401 (the decisive finding that nothing was configured), DR-0430 (AI teacher, sovereign only, shipped inactive)

## The word, as spoken

Darrell, 2026-09-16: *"I want to be able to add my voice, my personal voice to this app and be able to choose my personal voice. And... I want everyone else to be able to do the same thing when they decide they want to do that. Now, I would like for you to use what I'm doing now, I guess, as my voice, or you can use another method... I would like to make sure that that works. How can we get that done?"* And: *"The app could recognize voice through our chat correctly?"*

## The path as it truly is (repo-verified, file:line in the session record)

**Exists and is honest.** The whole client chain is built: a recorder (8 s minimum, 30 s good, WebM/Opus; `voice-recording.js`), the sample stored **on the device** in IndexedDB keyed per person (`voice-reference.js`), consent recorded as a `voice_profiles` row on save (`voice-sync.js`; recording IS consent), the per-person voice id and the global reading-voice preference (`voice-registry.js`, `reading-voice.js`), the clone branch of the reader (`use-read-aloud.js`), the header picker and the Voice tab with Record / Voices / Likeness, every personal voice labelled *AI-generated*, and the sovereign studio itself (`infra/voice-studio/server.py`: FastAPI, XTTS-v2 on CUDA, `GET /health`, `POST /speak`, compose service on the church GPU node at :8770).

**Missing, and why his voice is a stand-in today.**
1. **No endpoint is configured in production.** `VITE_VOICE_SERVICE_URL` is set nowhere (no `.env`, not in the Cloudflare deploy workflow), so `activeVoiceEndpoint()` is null and every "Darrell Poe" read is the labelled browser stand-in.
2. **The studio has never been armed or probed.** It is in no services manifest, has no installer, and the church devices file records ":8770 not probed". The GPU on the towers is itself unverified in the repo (one seed file says "NOT 2x RTX 4070").
3. **Nothing in the repo holds his sample.** The recorded bytes live only in the browser that recorded them; nothing uploads them. There is no file under `infra/` or `docs/`.
4. **Only family personas can record.** The Record tab renders for `darrell` and `christina` only; a subscriber has no persona key and no Record tab. "Everyone else" is not yet possible.
5. Two real defects in the client: `synthesizeSpeech` had **no timeout**, and readiness was a **config check**, so a mistyped URL would read as armed and fail every read.

**The direct answer to "through our chat":** no. What reaches this channel is text — the phone transcribes his speech before it arrives — so no audio exists here to clone from. His voice must be recorded as audio: the app's Voice tab → Record (the recorder that already exists), on his own phone, reading the script for 30 seconds.

## What ships here

1. **Every call is bounded.** `synthesizeSpeech` carries an explicit `timeoutMs` (default 45 s, sized for XTTS-class generation of a paragraph on a consumer GPU) through one `AbortController` that also honours the caller's own signal; a studio that neither answers nor refuses returns `voice-service-timeout` and the reader falls back to the stand-in.
2. **The studio is asked whether it answers.** `probeVoiceService()` GETs `{base}/health` (4 s bound, cached a minute, `force` re-asks); `voiceServiceHealth()` is an honest third state (`unknown` is never reported as up); `isVoiceServiceAnswering()` is the readiness a reader should trust. The reader hook now treats "configured but down" as not ready. The vendor bridge has no health route and stays `unknown`.
3. **The Voice tab says the real state:** not configured (and which variable) · configured but not answering (stand-in until it does) · armed and answering.

## Identify (his list, answered from evidence)

- **Missing information:** which tower has a CUDA GPU and what card (`nvidia-smi` has never been recorded); whether an https front for :8770 exists on the tailnet; whether he ever saved a sample in-app (it would be in one browser's IndexedDB only).
- **Assumptions:** XTTS-v2 needs a CUDA GPU with roughly 4 GB free VRAM (from the Dockerfile's own note); the browser-support of the Wake Lock and Media APIs is as documented — both are platform claims not re-verified from this sandbox.
- **Risks:** a `http://192.168…` URL will be upgraded to https by the site's CSP and fail — the studio must be reached over an https origin (tailnet). XTTS-v2 weights are CPML non-commercial — fine for family and church, not for a paid subscriber product without the planned MIT-model swap. The vendor bridge sends his voice off-network and is a recorded gap, never the destination.
- **Dependencies:** the church GPU node up with Docker and the NVIDIA runtime; a CI secret for `VITE_VOICE_SERVICE_URL` and a redeploy (VITE values are baked at build); his own 30-second recording on his phone.
- **Decisions requiring his approval:** (a) arming the studio on church hardware (Tier C, DR-0430 — his hand is the starter); (b) opening Record to every signed-in person, with self-consent by recording and the AI-generated label on every use (consent doc: outside the building circle needs explicit consent — recording is that consent); (c) the model for a paid-subscriber voice product (licence), when subscriptions exist.
- **Opportunities:** once the studio answers, the `(stand-in)` suffix disappears on its own and the System voice also reaches the studio (DR-0382) — every lesson gets a human timbre, not only his; cross-device sample sync is a small follow-on.
- **Constraints:** no new n8n; the same-origin transport rule; the reading engine's follow-along segmentation must stay intact (it does — this touches only the endpoint seam).
- **Never guessed / always data driven:** every claim above is a file the session read; the two things I could not verify are named as such.
- **Timeline:** this hardening merges on green today. Arming is one sitting at the GPU node (build ≈ 10–20 min for the image and weights, then a 30-second recording). The "everyone can record" slice is a same-week build once he says yes to (b).

## His hand (paste from anywhere; the values he already holds)

Plain words: SSH to the GPU node from the desktop, confirm the card, start the studio, prove it answers, then give it an https name on the tailnet and put that name in the deploy secret.

```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv"
ssh dpoe@192.168.1.26 "cd ~/Kingdom-PWA-Node && docker compose -f infra/church-gpu-node/docker-compose.yml build voice-studio && docker compose -f infra/church-gpu-node/docker-compose.yml up -d voice-studio"
ssh dpoe@192.168.1.26 "curl -s http://localhost:8770/health"
ssh dpoe@192.168.1.26 "tailscale serve --bg --https=8770 http://localhost:8770 ; tailscale serve status"
```

If `nvidia-smi` shows no CUDA card, stop there and say so — that is the one genuine hardware unknown. If `curl` prints `{"ok": true}`, the studio is alive; the `tailscale serve status` line is the https origin to place in the repository secret `VITE_VOICE_SERVICE_URL` (Settings → Secrets → Actions), after which the next merge redeploys with the studio wired. Then on his phone: Voice → Record → read the script 30 s → Save → pick "Darrell Poe" in the reading voice → Read.

## Re-review

- **re-review: 2026-09-23** — his `nvidia-smi` and `/health` results recorded here; on a live studio, one lesson read in his voice on his phone with the label visible.
- **re-review: 2026-09-23** — his word on opening Record to every signed-in person (decision b) and the subscriber-licence question (c).
