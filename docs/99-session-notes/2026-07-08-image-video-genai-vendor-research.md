# AI Image / Video Generation — Verified Vendor Research (2026-07-08)

**Method:** deep-research harness — 5 search angles → parallel web search → 21 sources fetched → 85 claims → 25 adversarially verified (3-vote; 2/3 refutes kills a claim). Every recommendation below survived verification; the video gap is an honest "could not verify," not an omission.

## IMAGE — decision-ready

**Best sovereign / $0 pick that fits the RTX 4070 (12 GB):** a fully-open **Apache-2.0** model — unrestricted commercial use of *both* weights and outputs, no revenue cap:
- **FLUX.1 [schnell]** — Apache-2.0 (confirmed via BFL's own license file). Runs on the 4070 via **Q4 GGUF (~7 GB) in ComfyUI**, ~1.9 s/it. *This is what our register's `local-flux-tlcmedia` provider targets.*
- **Qwen-Image / Qwen-Image-2512** (Alibaba, 7B) — Apache-2.0, #1 fully-open on AI Arena; strong sovereign alternative.
- **Z-Image-Turbo** (Alibaba, 6B) — Apache-2.0, fits comfortably in 16 GB (8 GB with FP8); #1 open-weights on Artificial Analysis Image Arena.
- **FLUX.2 [klein] 4B** — Apache-2.0, step-distilled, ~13 GB, sized for RTX 4070+ (one conflicting licensing signal in the batch — treat schnell/Qwen/Z-Image as the *certain* picks).

**Best quality open model, with a licensing catch — FLUX.2 [dev] (32B):** SOTA-positioned photorealism, unmatched LoRA ecosystem. BUT:
- **Weights are Non-Commercial** — a *business* self-hosting them needs a paid BFL license (~$999/mo self-hosted tier). Verified: the claim "self-hosted commercial use of FLUX.2 [dev]/[klein] is free" was **REFUTED 0-3**.
- **The generated OUTPUTS may be used commercially** (license §2(d)) — so it's legal to *sell/use the images*, just not legal to *run the [dev] weights* as a business for free.
- **Does NOT fit 12 GB natively** — the 32B model needs ~90 GB to load (64 GB even in lowVRAM). Only reachable on a 4070 via aggressive FP8/GGUF (~12–19 GB) or ComfyUI RAM-offload weight-streaming — "tight," 60–80 s/image. NVIDIA's own blog targets RTX 4090/5090.

**Best hosted IMAGE pick if paying:** **FLUX.2 Pro API** (via BFL, or licensed partners Replicate / fal.ai / Together AI) — commercially licensed, with hard monthly caps (Builder 10K/mo, Platform/Professional 100K/mo).

**Also verified:** Stability AI Community License permits free commercial use; users own their outputs; a **$1M annual-revenue** threshold flips it to a paid Enterprise license (not a concern at our scale).

## VIDEO — NO recommendation (honest gap)

**Every video-specific claim in this batch was refuted in verification.** No trustworthy synthesis on Sora / Veo / Runway / Kling / Luma / open video-diffusion survived the 3-vote pass. **We do not have a verified video recommendation.** A focused video-only re-run (narrower angles, video-only sources) is the fix — do NOT act on video vendor claims from memory.
Independent hardware reality (from the image research): serious local video generation does **not** fit a 12 GB 4070 — video stays a vendor/cloud decision regardless.

## What this changes in the app
- `llm-providers.js` `local-flux-tlcmedia` targets **FLUX.1-schnell** — confirmed the correct sovereign, commercial-safe, 4070-fitting choice. Notes updated with the verified Apache-2.0 finding + Qwen/Z-Image alternatives.
- Video-gen stays a capability token with **no provider** — matches the verified reality.

## Re-review
- **2026-08-08:** re-run video-only research; re-check FLUX.2 [klein] licensing (one conflicting signal); the space moves fast.
