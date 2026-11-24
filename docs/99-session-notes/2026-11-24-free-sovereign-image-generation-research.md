# Free, sovereign lesson-thumbnail generation: research and stand-up plan

**Date:** 2026-11-24 · **Layer:** 4 (working note) · **Status:** research only. No code, compose file or workflow was changed, nothing was committed, and no paid API was called.
**Replaces (if the sample check passes):** the paid `bfl` provider (FLUX 1.1 [pro] Ultra, 6¢/image, about $77.58 for 1,293 images per `app/scripts/learn-presentation/README.md`).
**Plugs into:** the existing `local` provider (`comfyImage` in `app/scripts/learn-presentation/providers/image.mjs`). No code change is needed to run it.

> **How this was verified.** In this session `huggingface.co`, `bfl.ai` and `docs.comfy.org` could not be reached directly (blocked by the sandbox's network rules). `raw.githubusercontent.com` could be reached, so the license files and the ComfyUI template were read from GitHub, byte for byte. Anything that comes only from web-search summaries or secondary blogs is marked **(unverified)**. Every speed figure for the RTX 4070 is an estimate until step 6 below measures it.

---

## 1. Recommendation

**Model: Z-Image-Turbo (Tongyi-MAI / Alibaba), int8 diffusion weights with the fp8 Qwen3-4B text encoder. Serving: headless ComfyUI in Docker (`yanwk/comfyui-boot:cu130-slim-v2`) on one church 4070 tower, with the compose service off by default (profile-gated). The batch runs only through the brakes in section 7.**

Why this model:

1. **License.** Apache-2.0, read from the repository's LICENSE file. Commercial use of the weights and of the outputs is allowed, with no revenue threshold, so a paid tier later changes nothing. Every component is Apache-2.0: the DiT; the text encoder, Qwen3-4B (Apache-2.0 per its model card, *unverified directly*); and the VAE, which is the FLUX.1-schnell autoencoder (Apache-2.0 per BFL's repository README).
2. **Fits 12 GB.** ComfyUI publishes an official int8 template (`image_z_image_turbo_int8`, dated 2026-07-04). All its files total **12.13 GB on disk**. The diffusion model and the text encoder load one after the other, so the GPU never holds the whole 12 GB at once. The bf16 template totals 20.8 GB and still runs on 12 GB because ComfyUI offloads to system RAM, but it is slower.
3. **Photoreal people is what it does best.** The upstream README says it "excels in photorealistic image generation". It ranked as the #1 open-weights model on the Artificial Analysis text-to-image leaderboard (2025-12-08, per its own README). Press coverage says it avoids FLUX's "plastic skin" (*unverified, enthusiast press*). **No source tested how it renders Black subjects or a range of skin tones.** That is exactly what the 3-sample check in section 8 must settle before any batch.
4. **Fast.** It takes 8 sampling steps at CFG 1. Estimated time per image on a 4070 is in section 3 (*unverified until measured*).

**Runner-up (keep as plan B): FLUX.2 [klein] 4B.** It is also Apache-2.0 and has an official ComfyUI template (4B distilled, 12.46 GB total). Use it if Z-Image fails the skin-tone or face check. **Do not use** the FLUX.2 [klein] **9B** or FLUX 3 Image Klein (see the table).

---

## 2. Comparison table (open-weight image models, as of 2026-11-24)

| Model | Weights license | Commercial use of OUTPUTS | Fits a 12 GB 4070? | Photoreal people | Verdict |
|---|---|---|---|---|---|
| **Z-Image-Turbo** (6B) | **Apache-2.0** (verified: [LICENSE](https://github.com/Tongyi-MAI/Z-Image/blob/main/LICENSE)) | Yes, no limits | Yes: int8 template, 12.13 GB total ([template index](https://github.com/Comfy-Org/workflow_templates)) | Strongest open model per leaderboard and press | **Recommended** |
| FLUX.2 [klein] 4B | Apache-2.0 ([BFL blog](https://bfl.ai/blog/flux2-klein-towards-interactive-visual-intelligence), via search; *page not reachable here*) | Yes | Yes: 4B distilled template, 12.46 GB total | Good. Compact model, weaker than Z-Image per the cited comparison (*unverified*) | Plan B |
| FLUX.1 [schnell] (12B) | **Apache-2.0** (verified: [flux README](https://github.com/black-forest-labs/flux)) | Yes | Yes, with Q4/fp8 GGUF (about 7 GB per the 2026-07-08 note) | Older (2024). Weaker skin and faces | Fallback only |
| FLUX.1 [dev] / Krea [dev] / Kontext [dev] | FLUX.1-dev **Non-Commercial** (verified: [LICENSE-FLUX1-dev](https://github.com/black-forest-labs/flux/blob/main/model_licenses/LICENSE-FLUX1-dev)) | Outputs allowed (§2d), but **running the weights** for anything that "has impact on end users" is not a Non-Commercial Purpose (§1c) | fp8/GGUF only | Excellent | **Excluded.** Production use needs a paid BFL license |
| FLUX.2 [klein] 9B, FLUX.2 [dev] | FLUX Non-Commercial License | Same as above | 9B is tight; [dev] (32B) does not fit | Excellent | **Excluded** |
| FLUX 3 Image Klein (5.6B, released 2026-10-15) | "FLUX Kommunity License": free commercial use **under $5M annual revenue** ([VentureBeat](https://venturebeat.com/technology/black-forest-labs-opens-flux-3-image-klein-weights-with-free-commercial-use-limited-to-smaller-businesses); *license text not read*) | Probably yes under the threshold (*unverified*) | Template is 21.5 GB total; would need quantizing (*unverified*) | New. Not evaluated | Watch only. A revenue-gated license is a future dependency |
| SD 3.5 Large / Medium | Stability Community License: free under **$1M annual revenue**, outputs owned by user ([stability.ai/license](https://stability.ai/license)) | Yes, under the threshold | Medium yes; Large with fp8 | Behind FLUX and Z-Image on people | Not chosen (revenue-gated, weaker) |
| SDXL base + photoreal finetunes | CreativeML Open RAIL++-M, with use restrictions passed down; finetunes vary: [Juggernaut XL](https://huggingface.co/RunDiffusion/Juggernaut-XL) restricts paid-API deployment, [RealVisXL](https://civitai.com/models/license/297320) is RAIL++-M | Generally yes, with restrictions (*per-checkpoint, unverified*) | Yes (about 8 GB) | Good with finetunes, but 2023-era hands and faces | Not chosen (license patchwork per finetune) |
| HiDream-I1 (17B) | MIT for the transformer; text encoders (Llama, T5) carry their own terms ([GitHub](https://github.com/HiDream-ai/HiDream-I1)) | Yes (*per model card, unverified*) | Templates are 24 GB or more; GGUF only | Good | Too heavy for 12 GB |
| HiDream-O1-Image-Dev (8B, 2026-05) | MIT (*search summary, unverified*) | Yes (*unverified*) | Template 17.1 GB total; tight | Claimed strong (*unverified*) | Watch, re-review below |
| Qwen-Image (20B, original) | Apache-2.0 (per [ComfyUI model page](https://comfy.org/workflows/model/qwen-image/)) | Yes | Only with GGUF Q4–Q8 | Good, strong at text in images (which we do not want) | Too heavy for the gain |
| Qwen-Image 2.1 | Reported as a **research-only** license (*sources conflict*) | Unclear | GGUF only | — | **Excluded** until the license is clear |

Searches behind this table: [Z-Image on ComfyUI Wiki](https://comfyui-wiki.com/models/z-image/z-image-turbo), [Decrypt on Z-Image](https://decrypt.co/350572/chinas-z-image-dethrones-flux-king-of-ai-art), [FLUX.2 klein 4B card](https://huggingface.co/black-forest-labs/FLUX.2-klein-4B), [FLUX dev license discussion](https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev/discussions/6), [Stability license update](https://stability.ai/news/license-update), [city96 Qwen-Image GGUF](https://huggingface.co/city96/Qwen-Image-gguf/blob/main/README.md), [HiDream-O1 card](https://huggingface.co/HiDream-ai/HiDream-O1-Image-Dev), [Qwen-Image 2.1 guide](https://codersera.com/blog/how-to-run-qwen-image-2-1-locally-2026/).

### License quotes (verbatim, read from the files)

- **Z-Image** ([LICENSE](https://raw.githubusercontent.com/Tongyi-MAI/Z-Image/main/LICENSE)): `Apache License / Version 2.0, January 2004`.
- **FLUX.1 [schnell]** ([flux README](https://github.com/black-forest-labs/flux)): "`FLUX.1 [schnell]` … [apache-2.0]" and "The weights of the autoencoder are also released under apache-2.0". Z-Image reuses this autoencoder (`ae.safetensors`).
- **FLUX.1 [dev]**, the reason it is excluded ([LICENSE-FLUX1-dev](https://github.com/black-forest-labs/flux/blob/main/model_licenses/LICENSE-FLUX1-dev)):
  - §1c: "For clarity, use (a) for revenue-generating activity, (b) in direct interactions with or that has impact on end users, or (c) to train, fine tune or distill other models for commercial use, in each case is not a Non-Commercial Purpose."
  - §2d: "You may use Output for any purpose (including for commercial purposes), except as expressly prohibited herein."
  - So the *pictures* would be fine, but *running the model* to make thumbnails that learners see is "impact on end users". The charitable carve-out (§1c(iii)) does not override (b).
- **ComfyUI** is GPL-3.0 (verified: [LICENSE](https://github.com/comfyanonymous/ComfyUI/blob/master/LICENSE)). We run it as a service and do not distribute it, so the GPL places no obligation on our app or on the images. The `yanwk/comfyui-boot` packaging is Mulan PSL v2 ([README](https://github.com/YanWenKun/ComfyUI-Docker)).

---

## 3. Speed and electricity on an RTX 4070

**Speed (unverified, an estimate to be replaced by a measurement).** No source benchmarks Z-Image-Turbo on a 4070 directly. The nearest reported points, all from secondary sources:

- about 2.3 s on a 4090 at 1024²
- about 20 s on a 3060 12 GB at 1024² (7 steps)
- about 15–20 s on a 4060 with fp8
- one developer blog claims "sub-second" on a 4070. That contradicts the others, so it is discarded.

Sources: [dev.to low-VRAM guide](https://dev.to/gary_yan_86eb77d35e0070f5/z-image-turbo-quantized-complete-guide-to-running-professional-ai-image-generation-on-low-vram-gpus-45fb), [dev.to SDXL→Z-Image](https://dev.to/lucylll/building-a-real-time-ai-canvas-why-i-switched-from-sdxl-to-z-image-turbo-55a2), [ASCII.jp](https://weekly.ascii.jp/elem/000/004/358/4358055/3/).

**Working estimate:**
- 1344×768 (about 1 MP): **6–12 s/image**
- 1920×1088 (about 2.1 MP): **15–30 s/image**
- warm model, int8, 8 steps; the first image adds model-load time.

At 1920×1088, the 974 pictures still needed take about **4–8 hours on one 4070: one overnight window.**

**Resolution choice.** The compositor (`app/scripts/learn-thumbs/compose.mjs:53`) makes derivatives up to **1920 px wide**. Z-Image accepts any aspect ratio between 512² and 2048² of total area (upstream README). Generate **1920×1088** natively (both dimensions multiples of 16), and let the compositor crop 8 px to reach 1080. If time per image is too slow, fall back to 1344×768. The compositor then upscales to the 1920 derivative, which costs some sharpness.

**Electricity (estimate; assumptions stated):**
- RTX 4070 Total Graphics Power is **200 W** ([NVIDIA spec](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-4070ti/)).
- Assume **300 W for the whole tower** while generating (200 W GPU plus about 100 W for CPU, board, fans and PSU loss), **25 s per image**, and **$0.13/kWh** (a middle value; Texas commercial quotes ranged from 6.8 to 12.9¢/kWh in [EIA-citing](https://dev.to/mattkundo/average-commercial-electricity-price-per-kwh-in-texas-131l) and [ElectricChoice](https://www.electricchoice.com/business-electricity/texas-business-electricity-rates/) sources, so 13¢ is conservative).
- Per image: 300 W × 25 s = 7,500 J ≈ **0.0021 kWh ≈ $0.0003 (0.03¢)**.
- Whole library with 30% regeneration (1,293 images): about 2.7 kWh ≈ **$0.35**, against **$77.58** on BFL.
- New lessons (a few per week): under a cent a month.
- Measure the real draw with a wall meter or `nvidia-smi --query-gpu=power.draw` during the step 6 samples, and replace these numbers.

---

## 4. Free hosted fallbacks (honest terms)

| Option | What is free | Commercial rights | Catch |
|---|---|---|---|
| **Cloudflare Workers AI**, `@cf/black-forest-labs/flux-1-schnell` | 10,000 neurons per day, reset 00:00 UTC; overage $0.011 per 1,000 neurons ([pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)) | The model is Apache-2.0. Use is under Cloudflare's terms (*not read here*) | Listed at 4.80 neurons per 512² tile + 9.60 per step. A 1024×576 image at 4 steps works out to roughly 40–60 neurons, about **150–250 free images a day**. This is my arithmetic from the table; how tiles and steps combine is *unverified*. It is schnell (the weaker model) and **not sovereign**. The PWA already lives on Cloudflare Pages, so this is the easiest *emergency* fallback, not the main road. |
| Other "free" hosted generators (Pollinations, Hugging Face free inference, and similar) | Varies | **Unverified.** Terms change often and rate limits are undocumented | Not recommended. A fallback whose terms we cannot quote is not a fallback. |

**Free stock, the non-generative fallback.**
- **Pexels:** free for commercial use, no attribution required ([help](https://help.pexels.com/hc/en-us/articles/360042295214-Can-I-use-the-photos-and-videos-for-a-commercial-project)). But its [Terms](https://pexels.com/terms-of-service) say to consider third-party consent for commercial uses (people, brands). It also forbids compiling its content to replicate a similar service ([rules](https://help.pexels.com/hc/en-us/articles/360042332714-What-are-the-rules-for-using-Pexels-photos-or-videos)).
- **Unsplash:** said to have similar terms (*official page not read; unverified*).
- **Trade-offs:**
  - A stock photo is not about *this* lesson.
  - Many lessons would share the same few stock faces, which breaks the "one unique image per lesson" rule.
  - Representation is limited to what exists.
  - Real, identifiable people appear beside faith teaching they never agreed to.
  - Use stock only for a handful of department or topic covers, never as the per-lesson source.

---

## 5. Stand-up steps on the church GPU node

**Prerequisites:**
- The tower that runs `infra/church-gpu-node/docker-compose.yml` (Docker Desktop with WSL2 on Windows, or Docker plus nvidia-container-toolkit on Linux).
- About 13 GB of free disk for the weights.
- A recent NVIDIA driver. `cu130` needs a CUDA 13-capable driver; Ada (the 4070) is supported per the [image README](https://github.com/YanWenKun/ComfyUI-Docker).

**DR-0012 still governs.**
- The two 4070s are the LEFT `tlcmediadpt` and RIGHT `livestream-main-pc` towers (`infra/gpu-scheduler/README.md`). They feed media and the stream.
- ComfyUI **holds VRAM after a job** unless told to free it, which is the same hazard `scripts/gpu-preemption-guard.mjs` closes for Ollama. The service below therefore:
  - is **off by default** (`profiles: ["imagegen"]`, `restart: "no"`);
  - is started only for a batch;
  - frees VRAM (`POST /free`, verified in [ComfyUI server.py](https://github.com/comfyanonymous/ComfyUI/blob/master/server.py)) and stops when the batch ends.

### 5a. Proposed compose service (NOT yet added; a separate, reviewed change)

```yaml
  # --- comfyui -- sovereign image generation (Z-Image-Turbo) -----------------
  # OFF BY DEFAULT: profile-gated, so `docker compose up -d` does NOT start it.
  # Start only for an attended batch:  docker compose --profile imagegen up -d comfyui
  # Stop when the batch ends (frees all VRAM): docker compose stop comfyui
  # DR-0012: never while STREAMING_HOLD is engaged or any creative CUDA app runs.
  comfyui:
    image: yanwk/comfyui-boot:cu130-slim-v2   # pin to the digest after first pull
    container_name: church-comfyui
    profiles: ["imagegen"]
    restart: "no"
    ports:
      - "8188:8188"            # LAN / tailnet only, never public
    environment:
      - CLI_ARGS=              # entrypoint already runs: main.py --listen --port 8188
    volumes:
      - ${DATA_ROOT:-./data}/comfyui/models:/root/ComfyUI/models
      - ${DATA_ROOT:-./data}/comfyui/output:/root/ComfyUI/output
      - ${DATA_ROOT:-./data}/comfyui/user:/root/ComfyUI/user
      - ${DATA_ROOT:-./data}/comfyui/custom_nodes:/root/ComfyUI/custom_nodes
      - ${DATA_ROOT:-./data}/comfyui/cache:/root/.cache
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    healthcheck:
      test: ["CMD-SHELL", "python3 -c \"import urllib.request;urllib.request.urlopen('http://localhost:8188/system_stats')\" || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
```

Notes:
- The entrypoint line `python3.13 ./ComfyUI/main.py --listen --port 8188 … ${CLI_ARGS}` was read from the image's [`runner-scripts/entrypoint.sh`](https://github.com/YanWenKun/ComfyUI-Docker/blob/main/cu130-slim-v2/runner-scripts/entrypoint.sh).
- `/system_stats` is a real route (server.py:774).
- That the healthcheck command works inside this image (that `python3` is on PATH) is *unverified*. Swap in `python3.13` if it is not.

### 5b. Model download (three files, about 12.1 GB; URLs taken from ComfyUI's official int8 template)

| File | Folder under `models/` | URL |
|---|---|---|
| `z_image_turbo_int8_convrot.safetensors` | `diffusion_models/` | `https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/diffusion_models/z_image_turbo_int8_convrot.safetensors` |
| `qwen_3_4b_fp8_mixed.safetensors` | `text_encoders/` | `https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/text_encoders/qwen_3_4b_fp8_mixed.safetensors` |
| `ae.safetensors` | `vae/` | `https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/vae/ae.safetensors` |

PowerShell, run on the tower. It assumes the tower keeps its data at `C:\poetech\gpu-node\data`, the Windows side of the `/mnt/c/poetech/gpu-node/data` path suggested in `.env.example`. Adjust if `DATA_ROOT` differs. `curl.exe` ships with Windows 10 and later.

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
New-Item -ItemType Directory -Force -Path C:\poetech\gpu-node\data\comfyui\models\diffusion_models | Out-Null
New-Item -ItemType Directory -Force -Path C:\poetech\gpu-node\data\comfyui\models\text_encoders | Out-Null
New-Item -ItemType Directory -Force -Path C:\poetech\gpu-node\data\comfyui\models\vae | Out-Null
curl.exe -L -C - -o C:\poetech\gpu-node\data\comfyui\models\diffusion_models\z_image_turbo_int8_convrot.safetensors https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/diffusion_models/z_image_turbo_int8_convrot.safetensors
curl.exe -L -C - -o C:\poetech\gpu-node\data\comfyui\models\text_encoders\qwen_3_4b_fp8_mixed.safetensors https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/text_encoders/qwen_3_4b_fp8_mixed.safetensors
curl.exe -L -C - -o C:\poetech\gpu-node\data\comfyui\models\vae\ae.safetensors https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/vae/ae.safetensors
Get-ChildItem -Recurse C:\poetech\gpu-node\data\comfyui\models | Select-Object FullName, Length
```

If the int8 file does not load (it needs ComfyUI 0.11.0 or later per the template index, and the `cu130-slim-v2` image tracks current ComfyUI), use the bf16 pair instead: `z_image_turbo_bf16.safetensors` with `qwen_3_4b.safetensors`, same repository and folders. ComfyUI offloads part of it to RAM on 12 GB.

### 5c. The API-format workflow (`z-image-turbo.api.json`)

Built node for node from ComfyUI's official template `templates/image_z_image_turbo_int8.json` ([workflow_templates](https://github.com/Comfy-Org/workflow_templates)):

- UNETLoader → ModelSamplingAuraFlow (shift 3) → KSampler
- KSampler settings: 8 steps, CFG 1, `res_multistep`, `simple`, denoise 1
- CLIPLoader (`lumina2`) → CLIPTextEncode → ConditioningZeroOut supplies the negative (Z-Image-Turbo uses no negative prompt)
- EmptySD3LatentImage → VAEDecode → SaveImage

The node graph and values are verified from the template. The API input *key names* below follow ComfyUI's standard node signatures and are *unverified until the first submit*. If a submit returns a validation error, open the template in the ComfyUI UI, set the prompt to `%PROMPT%`, and use **Export (API)** to regenerate the file.

```json
{
  "28": { "class_type": "UNETLoader", "inputs": { "unet_name": "z_image_turbo_int8_convrot.safetensors", "weight_dtype": "default" } },
  "30": { "class_type": "CLIPLoader", "inputs": { "clip_name": "qwen_3_4b_fp8_mixed.safetensors", "type": "lumina2", "device": "default" } },
  "29": { "class_type": "VAELoader", "inputs": { "vae_name": "ae.safetensors" } },
  "11": { "class_type": "ModelSamplingAuraFlow", "inputs": { "model": ["28", 0], "shift": 3 } },
  "27": { "class_type": "CLIPTextEncode", "inputs": { "clip": ["30", 0], "text": "%PROMPT%" } },
  "33": { "class_type": "ConditioningZeroOut", "inputs": { "conditioning": ["27", 0] } },
  "13": { "class_type": "EmptySD3LatentImage", "inputs": { "width": 1920, "height": 1088, "batch_size": 1 } },
  "3":  { "class_type": "KSampler", "inputs": {
          "model": ["11", 0], "positive": ["27", 0], "negative": ["33", 0], "latent_image": ["13", 0],
          "seed": "%SEED%", "steps": 8, "cfg": 1, "sampler_name": "res_multistep", "scheduler": "simple", "denoise": 1 } },
  "8":  { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["29", 0] } },
  "9":  { "class_type": "SaveImage", "inputs": { "images": ["8", 0], "filename_prefix": "learn/zimage" } }
}
```

How this fits `comfyImage` (verified against `providers/image.mjs`):
- It replaces the **first** occurrence of the quoted string `"%PROMPT%"` with `JSON.stringify(prompt)`, and the first quoted `"%SEED%"` with a bare integer. So each placeholder must appear **exactly once**, as a JSON *string*. The file above meets both conditions.
- The provider downloads the first saved image through `/view`. Every image is also kept in `output/learn/`, which the batch runner should clear after a run.

---

## 6. Plugging into the existing `local` provider

No code change. From `app/`, on a machine that can reach the tower over the LAN or tailnet:

```bash
export LEARN_COMFY_URL=http://<tower-lan-or-tailnet-host>:8188
export LEARN_COMFY_WORKFLOW=/abs/path/z-image-turbo.api.json
npx vite-node scripts/learn-presentation/cli.mjs images --provider local --only <3 lesson ids> --concurrency 1 --per-minute 6
```

- `--concurrency 1`: one GPU means one job at a time. More concurrency only queues inside ComfyUI and makes the 240 s per-call timeout fire falsely.
- The provider reports `costCents: 0`, so **`--budget-cents` never binds for `local`**. The run budget has to be a count and a clock (next section).
- The ledger records `model: 'comfyui'`. To tell Z-Image results from any later model in the ledger, a one-line follow-up could read the model name from an env var. That is noted as a gap, not changed here.

---

## 7. The three brakes before it ever runs on a schedule

This is AI-class, timer-capable GPU work: Tier C under CLAUDE.md "Autonomous Automation Requires Three Brakes". The DR-0248 amendment removes the manual kill-switch only for the *deterministic* class; this class keeps all three brakes. Build them, prove each one catches in a test, ship inert, and arm attended (DR-0225). The natural home is the existing `infra/gpu-scheduler`: add an `image-gen` capability, so its brake gate, run lock and event log apply as they already do.

1. **Budget per run (count + wall clock, not cents).**
   - `GPU_SCHED_MAX_JOBS_PER_RUN` caps images. Suggested: 400 per overnight window, which also maps to `--limit 400`.
   - A hard wall-clock ceiling, e.g. a runner timeout of 6 h, after which it calls `POST /free` and stops the container.
   - `GPU_SCHED_MAX_JOBS_PER_DAY` caps daily total.
   - Unset means 0, which means inert. That is the existing scheduler's semantics.
2. **Single-instance lock.** Use the scheduler's `state/run.lock/`: a second fire skips, it never stacks. The pipeline's ledger lease (10 min) prevents *duplicate jobs* but not *two runners*, so the lock is still required.
3. **Auto-pause (kill-switch).** The runner pauses itself and frees VRAM when any of these is true:
   - `state/KILL_SWITCH` or `state/STREAMING_HOLD` is present (checked **before every image**, not only at start);
   - **any non-ComfyUI CUDA process** appears in `nvidia-smi` (DR-0012 §3: Premiere, C4D, OBS);
   - N consecutive failures (suggest 3);
   - median time per image exceeds 3× the measured baseline;
   - the heartbeat in `state/events.jsonl` goes stale.

   It never auto-resumes. Re-arming is attended.

Until all three are built and proven, runs are **manual and attended only** (the CLI command in section 6, with `--limit`).

---

## 8. The 3-sample quality check against the BFL samples (before any batch)

1. **Pick 3 lessons** from `app/scripts/learn-presentation/art-direction-v2.json` that already have BFL Ultra v2 renders. The renders are in the gitignored `.learn-presentation/images/<courseKey>/<lessonId>.*` on the machine that ran the paid pilot; *location assumed from the README defaults*. Pick one each of an **adult Black woman** (`ll341-whoso-removeth-stones`, the airport tower), a **multi-generation family**, and a **child or teen**. Together they cover skin tone, ages and hands.
2. **Generate with the identical prompt** (art-direction prompt plus the `BRAND_LOOK` that the v2 path uses), 2 seeds each, at 1920×1088. Record seconds per image and GPU watts (`nvidia-smi --query-gpu=power.draw --format=csv -l 1`).
3. **Measure, don't eyeball first** (DR-0076 §4). Run the same luma metrics `app/scripts/learn-thumbs/grade.mjs` uses. The dark pilot was mean luma 37.6/255 with more than 65% of pixels near black, so pass means a **bright** frame by those same measures. Also confirm 16:9 and no baked-in edge bars.
4. **Human checklist,** side by side with BFL, judged blind (shuffle the left/right order):
   - faces clearly visible, eyes visible, expressive
   - **natural, true-to-life Black skin tones**: no ashy, gray or orange cast
   - each prompt's ages and representation honored
   - hands and fingers correct
   - **no text, letters or watermarks** (Z-Image is strong at rendering text, so watch for stray signage)
   - bright daylight, nothing from the banned art terms
   - space on the left for the headline
5. **Decision rule.**
   - Z-Image meets or beats BFL on 3 of 3, with no skin-tone failure: proceed to a **20-lesson attended run**, then the library.
   - It fails on skin tone or faces: run the same 3 on FLUX.2 [klein] 4B (plan B).
   - Both fail: keep BFL for portraits of people only and use local for scenery-led lessons. Record that as a decision with a re-review date.

---

## 9. Open items, unverified claims, re-review

- **Unverified:**
  - time per image on a 4070
  - API input key names (check on first submit)
  - the `python3` healthcheck inside the image
  - Qwen3-4B and Cloudflare terms (not read first-hand)
  - FLUX 3 Klein license text
  - HiDream-O1's license
  - Z-Image's rendering of Black skin tones (no independent test exists; section 8 is that test)
- **Gaps noticed, not changed** (research scope):
  - `--budget-cents` is a no-op for the $0 `local` provider, so the local path needs a count or wall-clock budget in the CLI itself.
  - The ledger's `model: 'comfyui'` hides which model made an image.
  - `gpu-preemption-guard.mjs` scopes only Ollama services; a GPU-reserving ComfyUI service should join its scope when 5a lands.
- **re-review: 2027-02-24.** Re-check FLUX 3 Image Klein's license text, Qwen-Image 2.1's license, and HiDream-O1. This space moves monthly. Re-review sooner if section 8 fails.
