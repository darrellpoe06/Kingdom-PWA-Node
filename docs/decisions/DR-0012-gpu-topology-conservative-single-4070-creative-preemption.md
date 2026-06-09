---
id: DR-0012
title: GPU topology — conservative single-4070 envelope; creative-app CUDA is absolute-priority preemption
date: 2026-06-09
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [poetech, all]
grounds: [THREE-BRAKES, CAGE, GOVERN-EXECUTE-ADVISE, EARN-AUTONOMY, COST-DISCIPLINE, DATA-DRIVEN-LIVING]
source: 2026-06-09 conversation — Darrell delegated the GPU topology decision to Claude with the hard constraint "decide based on how we use it currently; do NOT undermine work on days the CUDA is being used."
---

## Context
The RTX 4070 (CUDA) lives in **Darrell's creative workstation**, which runs heavy CUDA apps — Adobe Premiere / After Effects, Cinema 4D, Photoshop, OBS. The GPU is therefore **shared with creative production**, and creative work must never be undermined by LLM jobs. Refines [DR-0001] (GPU scheduling) and the §1 hardware envelope with the now-known real usage.

## Decision (ratified by Darrell, delegated to Claude)
1. **Design for the conservative single-4070 envelope (~12 GB, 1 card assumed).** 2× 4070 and 4070 Ti SUPER (16 GB) are documented as **upgrade paths only**, never assumed.
2. **Daily reasoner is locked to a 14B-class model that fits ~12 GB quantized and unloads instantly** — `qwen2.5-coder:14b` (Q5_K_M) or `qwen3:14b` (Q4) (S1). 30B-A3B and above stay strictly on the upgrade paths.
3. **Creative apps / ANY non-Ollama CUDA process are a first-class, absolute-priority preemption trigger.** Extends [DR-0001] layer (a): the reasoner yields GPU the moment creative apps are active — not only on session/PWA activity — frees VRAM (`OLLAMA_KEEP_ALIVE=0`) within ~1 s, and resumes only after a quiet cooldown. **Creative work has absolute priority over LLM jobs.**
4. **Heavy eval/review jobs are batched to OFF-HOURS** within the 24/6.5 + preemption windows, so they never collide with creative-production days.
5. **Exact card (1 vs 2, base vs Ti SUPER) can be auto-detected later via `nvidia-smi`** from a session on that box to refine model choice — this does **not** block; eval proceeds now on the conservative assumption.

## Rationale
Because the constraint is "do not undermine work on days the CUDA is being used." The conservative envelope guarantees the daily reasoner always fits the worst case (1× 12 GB) and is instantly evictable; making creative-app CUDA an absolute-priority trigger guarantees a person editing video never contends with a background LLM; off-hours batching keeps heavy runs off creative-production hours. The design holds regardless of what `nvidia-smi` later finds, so it is safe to proceed now (DATA-DRIVEN-LIVING: refine when telemetry arrives, don't block on it).

## Consequences
- Eval (timeline track a) proceeds now on the conservative envelope; no wait on topology confirmation.
- 30B-A3B / GLM-5.1 / DeepSeek-V4 remain upgrade-path-only until a dedicated GPU box exists (they are NOT for the shared creative 4070).
- Implements as an extension of the §4 `may_run()` gate and priority ladder (creative/human CUDA > service > Sabbath > LLM job).

## Links
[DR-0001] (GPU scheduling, refined here), [DR-0010] (bounded autonomy), research-review §1 + §4 + §10; `AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md` (upgrade paths).
