# Church compute towers (next to the NovaStar) -- on-site setup runbook (Darrell's hand)

**Date:** 2026-06-29
**Context:** The church compute node is **two tower computers** physically sitting next to the **NovaStar** LED-wall processor. Standing up serving endpoints on them is the unlock for three gated capabilities. This runbook is paste-ready: do the physical + logical install, inventory the real specs, stand the endpoints up headless, and wire the app -- in order, while the machines are open.

> **HARDWARE IS SME / UNKNOWN.** The exact **GPU / CPU / RAM / PSU** in each tower is **TBD -- Darrell will provide them.** This runbook does NOT assume any specific card (it is NOT 2x RTX 4070; the 3090s are not purchased). Section 2 (inventory) is how you DISCOVER the real specs; section 3 (model pick) is **conditional on what section 2 finds.** Anywhere a spec is needed and unknown, it is marked **[NEEDS SPEC]**. (Supersedes the spec-specific framing in the 2026-06-29 "church-4070-gpu-node" runbook.)

## What this unlocks

| Endpoint | Port | Unlocks |
|---|---|---|
| **Ollama** (local LLMs) | `11434` | **Sovereign AI** -- deterministic-first / AI-needed tiers run on our hardware. In-app `Talk about this`, tutors, finalizer get a fast local model. Model size is chosen to fit the tower's real VRAM (section 3). |
| **voice-studio** (XTTS-v2) | `8770` | **Voice clone** -- "Darrell hears Darrell." A recorded sample becomes spoken text in his real voice, same Voice-tab UI. Needs a CUDA GPU; CPU is impractical for this. |
| **whisper-gpu** (faster-whisper) | `8771` | **Harvest transcription** -- the rare caption-less service video transcribed locally. Fast on a GPU; batch-only on CPU. |

**Most of the software is already built and merged** (PR #405): the one-compose stack, the containerized XTTS studio, the GPU whisper endpoint. The app's voice/LLM/harvest seams already honor these contracts. What this revision adds is the **two-tower physical/logical install** and the **spec-agnostic, role-separated** standup.

---

## 1. PHYSICAL + LOGICAL INSTALL -- the two towers next to the NovaStar

Do this first, with the towers powered OFF. It protects the live wall feed and the towers themselves.

### 1a. Placement (airflow is the whole game)

- **Do not block the NovaStar or either tower's airflow.** Towers pull intake (usually front/bottom) and push exhaust (rear/top). Leave **>= 4 in (10 cm) clearance** on the intake and exhaust faces of each tower AND around the NovaStar's vents.
- **Off the floor, on a vented shelf or rack.** Floor dust and foot traffic kill intake fans. A vented rack shelf or a sturdy AV shelf beside the NovaStar is right; a sealed cabinet is wrong (heat soak).
- **Towers upright, not stacked directly on each other** (top tower exhaust feeding bottom tower intake = thermal loop). Side by side with a gap, or separate shelves.
- **Keep them out of the cable run / service path** so a cable pull on show day cannot drag a tower or yank its power.

### 1b. Power (own circuit, never shared with the wall)

- **Each tower draws ~500-850 W under load** (real PSU rating is **[NEEDS SPEC]** -- read the PSU label, e.g. 750 W / 850 W, and confirm). At 120 V, 850 W = ~7.1 A.
- **Put the towers on their OWN circuit / PDU -- NOT the NovaStar power strip and NOT the LED-wall circuits.** The wall is ~4,800 W peak on its own dedicated circuits (see the video-wall runbook); an AI tower spiking load must never share with the wall or the processor.
  - **One dedicated 20 A circuit** carries both towers safely: 2 x 850 W = 1,700 W = 14.2 A, under the 1,920 W (80% of 20 A) cap.
  - **Or one dedicated 15 A circuit per tower** (850 W = 7.1 A each, well under the 1,440 W / 80% cap). Do NOT put both towers on a single 15 A circuit (1,700 W > 1,440 W -- over the limit).
- **UPS on the NovaStar AND the towers.** A power blip mid-service drops the wall; mid-job it corrupts a transcription/model write. Size the UPS to the summed load + headroom (a tower at 850 W wants ~1500 VA / ~1000 W of UPS to itself, or a larger rack UPS covering NovaStar + both towers). The wall itself is usually too large for UPS -- protect the **processor and the compute**, which is what carries state.
- **Stagger power-on.** Bring the towers up one at a time, not with the wall's inrush.

### 1c. Network (wired, fixed, meshed)

- **Cat6 to the switch, not WiFi.** Each tower gets a wired run to the church switch. WiFi is not acceptable for a serving node (latency, drops).
- **Static / reserved IPs.** Give each tower a fixed address -- either a static config on the tower or a **DHCP reservation by MAC** on the church router. Write down both IPs; the app/NAS wiring (section 4) points at them. Suggested, confirm the church subnet: `tower-1 = 192.168.x.20`, `tower-2 = 192.168.x.21` **[NEEDS SPEC: church subnet + free addresses]**.
- **Tailscale on each tower** for the home<->church mesh (ties the sovereign-mesh two-NAS lane). Install Tailscale, sign in to the tailnet, record each tower's `100.x.y.z` tailnet IP. Cross-site calls use the tailnet IP; same-LAN calls use the static LAN IP.
- **Switch port / VLAN:** plug into the same managed switch as the rest of the church network; if the wall control net is on its own VLAN, keep the compute towers on the data VLAN (they talk to the NAS + the internet for model pulls), not the wall-control VLAN.

### 1d. ROLE SEPARATION (binding -- do not let AI grind hit a live service)

- **The live-media box that feeds the NovaStar -> wall stays SEPARATE from the AI-compute work.** The machine rendering the wall during a service must not be running model inference at the same time -- they contend for GPU/CPU and a stutter on the wall is unacceptable.
- **Default mapping (confirm with Darrell once roles are assigned):** one tower = the **live-media source** into the VX1000; the other tower = the **headless AI worker** for heavy jobs (transcription backfill, batch voice synth, LLM). If both towers can render the wall, dedicate one to live and one to AI.
- **Towers run heavy AI jobs OFF service hours.** Sunday / Wednesday service windows are a hard no for AI grind on any tower that touches the wall.
- **If a tower MUST dual-purpose** (live-media AND AI worker), its AI work is **scheduled to never overlap service times** -- the idle-GPU / off-hours scheduler enforces the window (creative/live has absolute priority; AI yields). This is DR-0012's principle generalized from one shared card to the two-tower node.

### 1e. Capture each tower's real specs into the church device inventory

Once the towers are placed and powered, run section 2 and **record each tower** (CPU, GPU + VRAM, RAM, disk, PSU watts, LAN IP, tailnet IP, assigned role) into the **church device inventory**. Until those rows exist, the spec-dependent choices below stay **[NEEDS SPEC]**. Section 6 has the capture step.

---

## 2. INVENTORY -- discover the real specs (this is where the unknowns get filled)

Run these ON each tower. **First detect the OS**, then follow the matching column. The output of this section IS the spec sheet for section 1e + the model pick in section 3.

### 2a. Windows tower

Open **PowerShell** on the tower and paste. Each line is self-contained.

```
systeminfo | Select-String "OS Name","OS Version","System Type","Total Physical Memory"
nvidia-smi
nvidia-smi --query-gpu=name,memory.total,memory.free,driver_version --format=csv
Get-CimInstance Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors
ipconfig | Select-String "IPv4"
docker version
docker info | Select-String "Default Runtime","Operating System"
```
If Tailscale is installed: `tailscale ip -4`. If `nvidia-smi` is "not recognized", the tower has **no NVIDIA GPU** (or no driver) -- note that; it changes section 3 (CPU-only path).

### 2b. Linux tower

```
cat /etc/os-release | grep -E "^NAME=|^VERSION="
uname -m
nvidia-smi
nvidia-smi --query-gpu=name,memory.total,memory.free,driver_version --format=csv
lscpu | grep -E "^Model name|^CPU\(s\)|^Socket"
free -h
ip -4 addr show | grep inet
docker version
docker info | grep -iE "runtime|operating system"
tailscale ip -4
```

### 2c. Write down, per tower

GPU model + **total VRAM** (the number section 3 depends on), driver/CUDA version, CPU model + cores, total RAM, the LAN IPv4, the tailnet IP, and whether Docker sees the GPU. **If the GPU is not visible to Docker**, fix it before section 3: Windows -> Docker Desktop (WSL2 backend) + current NVIDIA driver + reboot; Linux -> install `nvidia-container-toolkit`, `sudo nvidia-ctk runtime configure --runtime=docker`, restart Docker.

**Gate:** do not stand up the GPU endpoints on a tower until `nvidia-smi` works and `docker` runs there (CPU-only path noted in 3d).

---

## 3. STAND UP the endpoints (headless, restart-on-boot) -- on the AI-worker tower

Same one-compose stack as PR #405. `restart: always` (survives reboot, no login), a healthcheck per service, a GPU reservation. **[HIS HAND]** throughout. Run on the tower assigned the AI-worker role (1d).

### 3a. Get the files onto the tower

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
Edit `.env`: `DATA_ROOT` to a real persistent path and `MEDIA_ROOT` to where service recordings live.

### 3b. Bring the stack up

```
docker compose up -d --build
docker compose ps
```

### 3c. Pull the LLM that FITS the tower's VRAM (conditional on section 2)

Pick the model AFTER you read VRAM from `nvidia-smi`. Rough fit guide (defaults; the user can choose otherwise -- LOCAL-LLM-MODEL-PICKS):

| Tower VRAM (from section 2) | Pull this | Note |
|---|---|---|
| **~8 GB** | `qwen3:8b` (or `qwen2.5:7b`) | Strong small daily driver. |
| **~12 GB** | `qwen2.5:14b-instruct-q4_K_M` (or `qwen3:14b`) | One 14B at Q4 fits 12 GB. |
| **16-24 GB** | up to `qwen2.5-coder:32b` Q4, or a `qwen3:30b-a3b` MoE | Bigger/faster; coder tier becomes real. |
| **No GPU (CPU-only)** | `qwen3:8b` / `gemma3:4b`, OR keep LLM on the NAS | See 3d. |

```
docker exec church-ollama ollama pull <MODEL_FROM_TABLE>
docker exec church-ollama ollama run <MODEL_FROM_TABLE> --verbose "Say hello in one sentence."
```
Watch the `eval rate` (tok/s) -- **measure, do not assume** (DR-0076).

### 3d. If a tower has NO GPU (CPU-only)

- **Ollama** runs CPU-only fine for small models (the compose's GPU reservation is ignored without a GPU); pull an 8B and measure -- or leave the LLM on the NAS.
- **voice-studio (XTTS)** is impractical on CPU (very slow). If neither tower has a CUDA GPU, the voice-clone unlock waits -- keep the labeled stand-in / the cloud bridge until a GPU lands. **[NEEDS SPEC: does either tower have a CUDA GPU?]**
- **whisper-gpu** falls back to batch CPU (the existing NAS pipeline already does this); set `WHISPER_DEVICE` accordingly or just use the NAS CPU pipeline.

### 3e. Verify each endpoint

```
curl http://localhost:11434/
curl http://localhost:8770/health
curl http://localhost:8771/health
```
Expect `Ollama is running`; `{"ok":true}`; `{"ok":true,"device":"cuda",...}` (or `cpu` on the CPU path).

---

## 4. WIRE the app / NAS to the towers

Three independent wires, each **[HIS HAND]**. Use the tower's **static LAN IP** for same-LAN, or its **tailnet IP** for cross-site / the cloud-served app. Never expose these ports to the public internet.

- **Voice -> app:** in Vercel set `VITE_VOICE_SERVICE_URL` = `http://<tower-ip>:8770` (or the tailnet host), **remove** `VITE_VOICE_BRIDGE`, redeploy. Voice tab -> Darrell Poe -> Read = his real voice; falls back to the labeled stand-in on any error.
- **LLM -> app (via n8n):** point the NAS n8n env `OLLAMA_BASE_URL` = `http://<tower-tailnet-ip>:11434`, restart n8n. The `talk-about` / `class-tutor` / finalizer workflows now run on the tower. (Or run the full `infra/ai-orchestrator/node1` stack on the tower if you want n8n resident there.)
- **Harvest -> whisper:** point the no-caption harvest step at `http://<tower-ip>:8771/transcribe`. The CPU pipeline stays the fallback.

---

## 5. Brakes + sovereignty (binding)

- **Sovereign / private / on our hardware.** All endpoints bind LAN / Tailscale only. **Do NOT publish ports 11434 / 8770 / 8771 publicly.** Access control is the network. Nothing leaves the church network.
- **The endpoints are PASSIVE** (serve-then-stop) -- not timers, not loops -- so they need no brakes themselves.
- **Any AUTONOMOUS caller keeps all three brakes:** a harvest backfill / continuous-ingestion queue ships with a **budget** (item / wall-clock ceiling), a **single-flight lock** (skip if a prior run is mid-flight), and a **kill-switch** (auto-pause on overrun / repeated failure). That class ships **inactive**, turned on only with someone watching (Tier C, 2026-06-06 lesson). Speed never buys removing a brake.
- **Role separation + off-service scheduling (section 1d, DR-0012 generalized).** Never let AI inference on a wall-feeding tower overlap a live service. On a dual-purpose tower the AI work is windowed to off-service hours by the idle-GPU / off-hours scheduler; live/creative has absolute priority.

---

## 6. Record the towers in the church device inventory + infra project

- **Device inventory [HIS HAND]:** once Darrell provides each tower's real CPU / GPU+VRAM / RAM / disk / PSU watts (and section 2 confirms the IPs), record one row per tower in the **church device inventory** (placement = "beside NovaStar", role = live-media or AI-worker, the LAN + tailnet IPs, the endpoints it serves). The section-2 commands produce exactly these values.
- **Infra project [HIS HAND]:** apply `infra/seed-data/2026-06-29-colg-compute-towers-endpoints.sql` once in Supabase Studio against the **COLG** instance (idempotent; resolves by `slug='colg'`). It records the two-tower node + endpoints + the install + role-separation decisions as discussions on the existing **Church Local Infrastructure** project. Source prose: the matching `.json`. Not yet applied to cloud as of this commit.

---

## Reality-trace -- what is real vs what needs his exact tower specs (DR-0076)

**Real, built, merged (PR #405) + this revision:** the compose stack, the containerized XTTS studio, the GPU whisper endpoint, the spec-agnostic standup, the two-tower physical/logical install, the device-inventory + infra-project records. The app's voice/LLM/harvest seams already honor these contracts (verified by reading `voice-service.js` / `talk-about.js` / `n8n-base.js` / `server.py`).

**Needs Darrell's exact tower specs before it is final:**
1. **Per-tower GPU + VRAM** -- decides which Ollama model fits (section 3 table) and whether voice-clone (CUDA) is feasible on that tower.
2. **Does either tower have a CUDA GPU at all** -- if not, voice-clone waits and whisper is batch-CPU (section 3d).
3. **Per-tower PSU watts** -- refines the circuit sizing (section 1b uses 500-850 W as the safe default).
4. **Church subnet + free addresses** -- to assign the static / reserved LAN IPs (section 1c).
5. **Role assignment** -- which tower is the live-media source and which is the AI worker (section 1d).
6. **CPU / RAM / disk per tower** -- to complete the device-inventory rows (section 6).

Until those land, the runbook is executable through the physical install + inventory; the spec-dependent model pull + wiring finalize the moment the numbers arrive.

## His-hand quick checklist

1. [ ] Place both towers beside the NovaStar -- vented, off floor, airflow clearance (1a).
2. [ ] Power: own dedicated circuit/PDU (not the wall's); UPS on NovaStar + towers; stagger power-on (1b).
3. [ ] Network: Cat6 to switch, static/reserved IPs, Tailscale on each; record LAN + tailnet IPs (1c).
4. [ ] Assign roles: live-media tower vs AI-worker tower; AI grind off service hours (1d).
5. [ ] Run section 2 inventory on each tower; capture real specs.
6. [ ] On the AI-worker tower: `docker compose up -d --build`; pull the model that fits its VRAM; measure tok/s.
7. [ ] `curl` all three `/health` (+ voice + whisper smoke tests).
8. [ ] Wire: `VITE_VOICE_SERVICE_URL` (Vercel), NAS n8n `OLLAMA_BASE_URL`, harvest -> `:8771` (4).
9. [ ] Record both towers in the church device inventory; apply the infra-project seed (6).
10. [ ] Send Darrell's the six **[NEEDS SPEC]** values back so the spec-dependent picks finalize.
