# Church RTX 4070 GPU node -- on-site setup runbook (Darrell's hand)

**Date:** 2026-06-29
**Context:** Darrell is on-site at the church (Church of the Living God) with physical access to the 2x RTX 4070 machines (~12 GB VRAM each). Standing up GPU serving endpoints on them is THE unlock for three gated capabilities. This runbook is paste-ready: run it on the 4070 box, in order, while the machines are open.

## What this unlocks

| Endpoint | Port | Unlocks |
|---|---|---|
| **Ollama** (local LLMs) | `11434` | **Sovereign AI** -- the deterministic-first / AI-needed tiers run on our hardware. The in-app `Talk about this` (`talk-about.js`), class tutors, and finalizer get a fast local model instead of honest-offline / slow CPU. |
| **voice-studio** (XTTS-v2) | `8770` | **Voice clone** -- "Darrell hears Darrell." A recorded sample becomes spoken text in his real voice, behind the same Voice-tab UI. The destination of the bridge-to-sovereign plan. |
| **whisper-gpu** (faster-whisper) | `8771` | **Harvest transcription** -- the rare service video with NO usable captions gets transcribed locally on the GPU instead of the slow CPU batch (>10 min -> under a minute). |

**The work is mostly already built.** The app's voice slot already targets a sovereign `/speak` endpoint (`app/src/lib/voice-service.js` -> `VITE_VOICE_SERVICE_URL`); the XTTS server already exists (`infra/voice-studio/server.py`); the LLM path already routes through n8n. This runbook **containerizes them, stands them up headless on the 4070, and flips the env vars** that point the live app at the church GPU.

---

## 0. Orientation -- the swap points (read once)

Nothing here invents a new contract. Each endpoint is the GPU home for a seam the app already honors:

- **Voice:** `activeVoiceEndpoint()` returns the sovereign studio when `VITE_VOICE_SERVICE_URL` is set; it POSTs `{ text, reference_audio, language }` to `{base}/speak` and plays the returned `audio/wav`. On any error it falls back to the labeled browser stand-in (never silent). Set one env var -> the real cloned voice lights up, same UI.
- **LLM:** the browser does NOT call Ollama directly. It calls the family n8n (`talk-about` / `class-tutor` webhooks) over the same-origin path; n8n calls Ollama via its `OLLAMA_BASE_URL`. So wiring the LLM = pointing n8n's `OLLAMA_BASE_URL` at the church box (one n8n env change), OR running the full node stack on the box.
- **Harvest:** the no-caption fallback is the only part that needs the GPU. Most videos carry captions and cost nothing.

Files this runbook adds (already written in this repo):
`infra/church-gpu-node/docker-compose.yml` (the 3-endpoint stack), `infra/voice-studio/Dockerfile` (containerizes the existing XTTS server), `infra/church-gpu-node/whisper-gpu/` (the GPU transcription endpoint), `infra/church-gpu-node/.env.example`.

---

## 1. INVENTORY first -- confirm the box before standing anything up

Run these ON the 4070 machine. **First detect the OS**, then follow the matching column. (Two boxes -> run section 1 + 2 on each; the second box can be a hot spare or run a second model.)

### 1a. Windows box (most likely -- these boxes run OBS / ProPresenter)

Open **PowerShell** on the church box and paste. Each line is self-contained.

```
systeminfo | Select-String "OS Name","OS Version","System Type"
nvidia-smi
nvidia-smi --query-gpu=name,memory.total,memory.free,driver_version --format=csv
ipconfig | Select-String "IPv4"
docker version
docker info | Select-String "Default Runtime","Operating System","GPU"
```

What you are confirming:
- **OS / type** -- Windows build + x64.
- **`nvidia-smi`** -- the GPU is visible, the **driver version**, and **CUDA version** (top-right of the table). Free VRAM should be most of ~12 GB when idle.
- **IPv4** -- the box's address on the church LAN (e.g. `192.168.x.x`). Write it down -- the app/NAS wiring needs it.
- **`docker version` / `docker info`** -- Docker Desktop is installed and running. If "GPU" / nvidia runtime is absent, see 1c.

If Tailscale is on the box (for cross-site reach to the home/NAS tailnet):
```
tailscale ip -4
```

### 1b. Linux box

Open a terminal and paste:

```
cat /etc/os-release | grep -E "^NAME=|^VERSION="
uname -m
nvidia-smi
nvidia-smi --query-gpu=name,memory.total,memory.free,driver_version --format=csv
ip -4 addr show | grep inet
docker version
docker info | grep -iE "runtime|operating system"
tailscale ip -4
```

### 1c. If the GPU is NOT visible to Docker

- **Windows:** install/repair **Docker Desktop** with the **WSL2 backend**, update the **NVIDIA driver**, reboot. WSL2 exposes the 4070 to containers automatically -- no NVIDIA Container Toolkit step needed. Re-run `docker info`.
- **Linux:** install the **nvidia-container-toolkit** (`sudo apt-get install -y nvidia-container-toolkit`), then `sudo nvidia-ctk runtime configure --runtime=docker` and `sudo systemctl restart docker`. Re-run `docker info`.

**Do not proceed to section 2 until `nvidia-smi` works and `docker` runs.** That is the gate.

---

## 2. STAND UP the three endpoints (headless, restart-on-boot)

The whole stack is one `docker compose`. It is configured `restart: always` (survives reboot, no login), each service has a healthcheck, and each reserves the GPU. **[HIS HAND]** throughout -- these run on the church box.

### 2a. Get the files onto the box

Easiest is to clone the repo (read-only is fine) so `infra/church-gpu-node/` is present. On the box:

**Windows (PowerShell):**
```
New-Item -ItemType Directory -Force C:\poetech | Out-Null
cd C:\poetech
git clone https://github.com/darrellpoe06/Kingdom-PWA-Node.git
cd C:\poetech\Kingdom-PWA-Node\infra\church-gpu-node
Copy-Item .env.example .env
```

**Linux:**
```
sudo mkdir -p /srv/poetech
cd /srv/poetech
git clone https://github.com/darrellpoe06/Kingdom-PWA-Node.git
cd /srv/poetech/Kingdom-PWA-Node/infra/church-gpu-node
cp .env.example .env
```

Edit `.env`: set `DATA_ROOT` to a real persistent path (Windows/WSL2 e.g. `/mnt/c/poetech/gpu-node/data`; Linux e.g. `/srv/poetech/gpu-node/data`) and `MEDIA_ROOT` to where service recordings live (for the whisper path calls).

> If git is not on the box, copy the `infra/` folder over with a USB stick / share -- only `infra/church-gpu-node/` and `infra/voice-studio/` are needed.

### 2b. Bring the stack up (builds the voice + whisper images)

From `infra/church-gpu-node/`:
```
docker compose up -d --build
```

First build pulls CUDA base images and Python deps -- give it time on first run. Then watch them go healthy:
```
docker compose ps
docker compose logs -f voice-studio
```

### 2c. Pull a 4070-appropriate LLM (one time)

A 4070's 12 GB fits ONE 14B-class model at Q4 (DR-0012). `qwen2.5:14b` is the daily reasoner the n8n workflows call:
```
docker exec church-ollama ollama pull qwen2.5:14b-instruct-q4_K_M
docker exec church-ollama ollama ls
```

Measure real decode speed once (turn estimates into fact, DR-0076):
```
docker exec church-ollama ollama run qwen2.5:14b-instruct-q4_K_M --verbose "Say hello in one sentence."
```
Watch the `eval rate` line (tok/s). If you want a lighter/faster option, `ollama pull qwen3:8b` is a strong small alternative (the model is the user's choice per LOCAL-LLM-MODEL-PICKS).

### 2d. Verify each endpoint (proof, not assumption)

```
curl http://localhost:11434/
curl http://localhost:8770/health
curl http://localhost:8771/health
```
Expect: `Ollama is running`; `{"ok":true}`; `{"ok":true,"device":"cuda","model":"large-v3-turbo",...}`.

**Voice smoke test** (proves the real clone path end-to-end). This needs a base64 reference sample -- the same one the app records. Quickest proof from the box, with a short wav at `sample.wav`:
```
curl -X POST http://localhost:8770/speak -H "Content-Type: application/json" -d "{\"text\":\"This is a sovereign voice test.\",\"reference_audio\":\"REPLACE_WITH_DATA_URI\",\"language\":\"en\"}" --output voice-test.wav
```
Play `voice-test.wav`. (The app sends the recorded sample as a `data:audio/...;base64,...` URI automatically; the curl is only a box-side smoke test.)

**Whisper smoke test** (a clip already under `MEDIA_ROOT`, mounted read-only at `/work`):
```
curl -X POST http://localhost:8771/transcribe -H "Content-Type: application/json" -d "{\"path\":\"/work/<clip>.mp4\"}"
```

---

## 3. WIRE the app / NAS to the church GPU

Three independent wires. Each is **[HIS HAND]** (an env / config change the agent cannot make for him -- they touch Vercel, the NAS n8n, or DNS).

### 3a. Voice -> the app (the big "Darrell hears Darrell" flip)

The studio must be reachable from where the app runs. On the same LAN, that is the box IP. Cross-site / from the cloud-served app, expose it over **Tailscale Funnel** or a tailnet hostname -- **never** the public internet.

**[HIS HAND]** In Vercel (Project -> Settings -> Environment Variables):
- Set `VITE_VOICE_SERVICE_URL` = the studio base URL, e.g. `https://<box-tailnet-host>:8770` (or `http://192.168.x.x:8770` for a LAN-only app instance).
- **Remove** `VITE_VOICE_BRIDGE` if it was set (that was the Replicate stopgap; the sovereign studio replaces it).
- Redeploy.

Verify: Voice tab -> select **Darrell Poe** -> **Read**. He hears himself; "stand-in" disappears; the "AI-generated voice" label stays. On any studio error it falls back to the stand-in -- never silent.

### 3b. LLM -> the app (via n8n)

The browser reaches the model through the family n8n, not directly. Two options:

- **Option A (fastest -- one env on the NAS n8n):** point the existing NAS n8n at the church Ollama over Tailscale. **[HIS HAND]** on the NAS, set the n8n container env `OLLAMA_BASE_URL=http://<box-tailnet-ip>:11434` and restart n8n. The `talk-about` / `class-tutor` / finalizer workflows now run on the 4070 instead of the CPU NAS. Nothing in the app bundle changes.
- **Option B (full local stack on the box):** run `infra/ai-orchestrator/node1/docker-compose.yml` on the church box -- that brings up Ollama + its own n8n + Uptime Kuma together. Use this if you want the orchestration resident on the GPU box (the "app-on-CUDA cockpit" decision). Point `VITE_N8N_WEBHOOK_BASE` at that n8n if it should serve the app's webhooks.

For most cases **Option A** is the move: one env var, the slow CPU model becomes a fast GPU model, every AI surface benefits at once.

### 3c. Harvest -> whisper-gpu (the no-caption fallback)

The harvest pipeline reads captions first and only needs the GPU for the rare caption-less video. **[HIS HAND]** point the harvest/SME step at `http://<box-ip>:8771/transcribe` (JSON `{ "path": "/work/<file>" }` for files under `MEDIA_ROOT`, or multipart upload for a one-off). The existing CPU pipeline (`infra/nas-sme-pipeline/`) is unchanged and still works as the no-GPU fallback; `transcribe.py` now honors `WHISPER_DEVICE=cuda` if you prefer to run that same script on the box instead of the HTTP endpoint.

---

## 4. Brakes + sovereignty (binding -- do not skip)

- **Sovereign / private / on our hardware.** All three endpoints bind LAN / Tailscale only. **Do NOT publish ports 11434 / 8770 / 8771 to the public internet.** Access control is the network being reachable only on the church LAN + tailnet. Nothing -- no text, no audio, no model traffic -- leaves the church network (DATA-AS-EMPOWERMENT).
- **The endpoints are PASSIVE.** They serve exactly what they are asked and then stop. They are not timers, not loops, and they pull no work on their own. So the endpoints themselves do not need the three brakes.
- **Any AUTONOMOUS use behind them still keeps all three brakes.** The moment something *calls* these on a clock or in a loop -- a harvest backfill, a continuous ingestion queue, a scheduled batch -- that caller ships with **(1) a budget** (token / wall-clock / item ceiling per run), **(2) a single-flight lock** (a new fire skips if the prior run is mid-flight), and **(3) a kill-switch** (auto-pause on overrun / repeated failure). Per the 2026-06-06 runaway lesson, that class ships **inactive** and is turned on only with someone watching (Tier C). CUDA buys speed, **not** permission to remove brakes.
- **Service-time preemption (DR-0012).** A 4070 is 12 GB; LLM inference and OBS NVENC contend for it. On a box that also encodes the live stream, **stop Ollama during Sunday / Wednesday services**: `docker compose -f infra/church-gpu-node/docker-compose.yml stop ollama` (restart after). Creative / live production has absolute priority over LLM jobs.

---

## 5. Record the GPU node in the church-infrastructure project

The 4070 machines + endpoints are documented in-app under the **Church Local Infrastructure** project (the LED-wall / infra lane), so the GPU node shows up where the work is governed -- not just in this repo.

**[HIS HAND]** Apply once in Supabase Studio (SQL editor) against the **COLG** cloud instance:
- Run `infra/seed-data/2026-06-29-colg-gpu-node-endpoints.sql` (idempotent; resolves the instance by `slug='colg'`; `ON CONFLICT DO NOTHING`). It adds the endpoint inventory + the standup decision as discussion entries on the existing `colg-local-infra-2026-06` project. Source-of-truth prose: `infra/seed-data/2026-06-29-colg-gpu-node-endpoints.json`.

Renders at: Projects -> (Church) -> **Church Local Infrastructure** -> Discussions. Not yet applied to cloud as of this commit (this session cannot reach the cloud Studio).

---

## Reality-trace -- honest status (DR-0076)

- **Real, built, in this repo:** the 3-endpoint compose, the containerized XTTS studio, the GPU whisper endpoint, the env-driven `transcribe.py`, the church-infra seed. The app's voice/LLM/harvest seams already exist and already honor these endpoints' contracts -- verified by reading `voice-service.js`, `talk-about.js`, `n8n-base.js`, and `server.py` (not from memory).
- **His hand, on-site, to light it up:** run sections 1-2 on the box; flip the env vars in section 3; apply the seed in section 5.
- **Verify, do not claim:** the only honest "it works" is `curl` returning audio + a transcript + the Voice tab speaking in his voice. The tok/s and first-build times are box-dependent -- **measure on the box** (`ollama run --verbose`), do not trust the estimate.
- **Version pins to confirm at build:** the CUDA base-image tags and the `TTS==0.22.0` / `faster-whisper` versions in the Dockerfiles were the working pairing at authoring; CUDA / cuDNN / TTS tags move -- confirm current tags before relying (noted in each Dockerfile).

## His-hand quick checklist

1. [ ] On the 4070 box: run section 1 inventory; confirm `nvidia-smi` + `docker` + note the LAN IP.
2. [ ] `docker compose up -d --build` in `infra/church-gpu-node/`; wait for healthy.
3. [ ] `ollama pull qwen2.5:14b-instruct-q4_K_M`; `--verbose` to measure tok/s.
4. [ ] `curl` all three `/health` (+ voice + whisper smoke tests).
5. [ ] Vercel: set `VITE_VOICE_SERVICE_URL`, remove `VITE_VOICE_BRIDGE`, redeploy -> Voice tab speaks in his voice.
6. [ ] NAS n8n: set `OLLAMA_BASE_URL` to the box -> AI surfaces run on the GPU.
7. [ ] Point the harvest no-caption step at `:8771/transcribe`.
8. [ ] Apply `infra/seed-data/2026-06-29-colg-gpu-node-endpoints.sql` to the COLG instance.
9. [ ] If the box also encodes services: `docker compose stop ollama` before Sunday / Wednesday live.
