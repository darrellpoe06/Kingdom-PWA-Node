# SKOS AI Infrastructure — Hardware Options (FUTURE / UNRATIFIED)

### Decision support for `AI-INFRASTRUCTURE-SYNOLOGY.md` Open Question #3 (GPU plan)

> **STATUS: PARKING LOT.** This document is decision support — specific hardware configurations with dollar figures — feeding the parent workup's Open Question #3 (GPU plan). It is NOT a parallel framework. It is NOT a committed purchase plan. The canonical AI infrastructure initiative lives in `AI-INFRASTRUCTURE-SYNOLOGY.md`; this doc exists to make the GPU choice there actionable. Revisit when Darrell is ready to answer Open Question #3.

> *"The plans of the diligent lead surely to abundance, but everyone who is hasty comes only to poverty."* — Proverbs 21:5 (ESV)

> *"Prepare your work outside; get everything ready for yourself in the field, and after that build your house."* — Proverbs 24:27 (ESV)

---

## What This Document Is

This is **input to `AI-INFRASTRUCTURE-SYNOLOGY.md` Open Question #3**, not a parallel framework. The parent workup remains canonical: it carries the vision, the binding principle (open-source + portable + vendor-independent), the phased delivery sketch (Phase 0 → Phase 4), and the seven open questions for Darrell. Open Question #3 reads:

> *"GPU plan. Stay CPU-only and design the UX for slower turn times; add a PCIe-slot GPU directly into the Synology (with the airflow / official-support caveats); or run a separate small workstation alongside the Synology that holds the GPU?"*

This document fleshes out the **"separate workstation alongside the Synology"** branch with four concrete configurations, plus the **"stay CPU-only"** branch as the baseline. Each option carries a build manifest, dollar figure, capability summary, tradeoffs, and an explicit mapping back to the parent workup's phases and "models in parallel" interpretations.

The binding principle from the parent workup governs every option below:

> *"All open-source. Portable across storage devices. Vendor-independent at runtime."*

Any option that conflicts with that principle is flagged honestly, not buried.

---

## The Four Real Options (plus baseline)

### Option 0 — Stay CPU-only on the Synology indefinitely

**Cost:** $0.

**Hardware:** the existing DS1621xs — Intel Xeon D-1527 (4c/8t @ 2.2 GHz base, 2.7 GHz turbo), 32 GB ECC (max-supported configuration; confirmed 2026-05-23), dual NVMe cache slots for model weight residency, dual 10 GbE.

**Capability ceiling** (realistic, not aspirational):

- **Small models (≤3B parameters):** Phi-3 Mini (3.8B), Qwen 2.5 3B, Llama 3.2 3B run at **~10–15 tokens/sec** on Q4_K_M. Comfortable for background classification, audit, and short responses.
- **7B-class models (Llama 3.1 8B, Qwen 2.5 7B, Mistral-7B):** **~3–8 tokens/sec** on Q4_K_M. Usable for non-real-time work; a 250-token four-section response takes 30–80 seconds to complete.
- **13B-class models:** **~1–3 tokens/sec** on Q4. At the edge of usable. A multi-paragraph response is a minute or more.
- **30B-class quantized models:** **sub-1 token/sec.** Effectively batch-only. The user submits and walks away.
- **70B-class models:** not realistic on this hardware. Won't fit comfortably even at Q4.

**Use cases this serves well:**

- The Phase 2 specialization router's *cheap* tasks: banned-clinical-language audit, drift-test classifier, scripture-version lookup helper. These are small-model jobs that don't need fluency, just discrimination.
- Background batch work: nightly summarization, weekly content audits, scheduled drift checks on logged conversations.
- Journal-style "submit and come back to it" UX where the user is reflecting rather than chatting.

**Use cases this does NOT serve:**

- The primary four-section Counseling response loop at any latency the user will accept as conversational.
- Real-time engagement-draft generation for the Marketing pipeline.
- Anything resembling Phase 3 "local primary, hosted opt-in fallback" — the local response IS the response, and on CPU-only it's too slow to be the default.

**Phase mapping:**

- Phases 0–1 of the parent workup (gateway plus Anthropic backend) ship cleanly on this hardware. No purchase required.
- Phase 2 (hybrid: small models local, hosted for main response) is **viable** on this hardware for the small-model side. It is the natural ceiling for a $0-spend path.
- Phase 3 (local primary, hosted opt-in fallback — vendor-independence achieved) is **not viable** here. Local primary at CPU-only speeds is not the same experience as Phase 3 promises.
- Phase 4 (specialization router across multiple parallel models) is **not viable** here at any acceptable latency.

**Principle alignment:** Full. Nothing to add, nothing to compromise. The principle is satisfied trivially because nothing changes.

---

### Option 1 — Entry: Single used RTX 3090 24 GB workstation

**Estimated build cost:** **$1,200 – $1,500.**

**Build manifest:**

| Part | Spec | Price range |
|---|---|---|
| GPU | Used NVIDIA RTX 3090 24 GB (Founders Edition or AIB) | $600 – $800 |
| Base workstation | Used Dell Precision T5820 or T7820 (Xeon W-series, 1x PCIe x16 confirmed) | $300 – $500 |
| RAM | 32 GB DDR4 ECC (often included with the workstation; +$80 if not) | $0 – $80 |
| Storage | 2 TB NVMe (model weights + swap) | $130 |
| PSU upgrade | 850W if the workstation's stock PSU is undersized for a 3090 (350W TDP) | $0 – $120 |

**Capability:**

- **13B-class models fully resident in VRAM** at FP16 or Q8. Llama 3.1 13B, Qwen 2.5 14B comfortable.
- **30–32B-class models fully resident** at Q4_K_M. Qwen 2.5 32B, Mixtral 8x7B (with router-aware loading) usable at conversational latency (~15–40 tokens/sec).
- **70B-class models with CPU offload** at Q4. Llama 3.1 70B runs, slower (offload tax), but it runs. Useful as the "ask the better model" local fallback.
- **Real-time conversational latency** for the four-section response on 13B/32B models. The user types and the answer streams back in single-digit seconds.

**Tradeoffs honestly:**

- **Noise:** a 3090 under load is audible. Not server-room loud, but not the silent NAS posture either. Plan for placement.
- **Power:** 3090 TDP is 350W. Sustained inference draws meaningful wattage; budget ~$5–15/month on electricity depending on duty cycle and local rates.
- **Setup time:** estimated 4–8 hours from delivery to first inference (Linux install, NVIDIA drivers, Ollama or vLLM containers, model downloads, wiring into the Synology gateway over the LAN).
- **Used-hardware risk:** verify the 3090 with stress tests before committing. Cards from crypto-mining usage exist on the secondary market. A reputable used-workstation vendor (Dell Refurbished, ServerMonkey, etc.) for the base reduces risk on that side.
- **Upgrade path:** the T5820/T7820 chassis supports dual GPUs with a PSU upgrade — this is intentionally the on-ramp to Option 2.

**Phase mapping:**

- **Phase 3 becomes viable.** A 13B or 32B Q4 model on a 3090 at conversational latency clears the bar for "local primary, hosted opt-in fallback."
- **Phase 4 (single-GPU specialization)** is workable but constrained — switching models means switching VRAM residency, which has load-time cost. Two GPUs are materially better for parallel specialization (see Option 2).
- The parent workup's "models in parallel" interpretation #2 (router-based specialization) runs in **serial-with-fast-switch** mode here rather than true parallel.

**Principle alignment:** Full. Open-source stack (Linux + Docker + Ollama/vLLM + open-weights models), portable (the box is generic x86, the stack lifts to any Docker host), vendor-independent (no required external account).

**The honest tagline:** *solid foundation, with an upgrade path baked in.*

---

### Option 2 — **Recommended: Dual used RTX 3090 24 GB build**

**Estimated build cost:** **~$2,000.**

**Build manifest:**

| Part | Spec | Price range |
|---|---|---|
| GPU x2 | 2x used NVIDIA RTX 3090 24 GB | $1,200 – $1,600 |
| Base | Used dual-PCIe-slot workstation (T7820, ThinkStation P920) OR new AM5 build (Ryzen 7 7700 + B650E motherboard with two x8/x8 slots) | $400 – $600 |
| RAM | 64 GB DDR5 (new build) or 64 GB DDR4 ECC (used workstation) | $200 |
| PSU | 1300W 80+ Platinum (two 3090s = 700W GPU TDP alone; add CPU and headroom) | $200 |
| Storage | 2 TB NVMe Gen4 | $130 |

**Capability:**

- **48 GB combined VRAM.** This is the threshold that meaningfully changes what's possible.
- **70B-class models fully resident in VRAM** at Q4_K_M with tensor parallelism (vLLM) or sequential layer offload (Ollama). Llama 3.1 70B, Qwen 2.5 72B run at real-time conversational latency.
- **True parallel model serving** — two models loaded simultaneously, each on its own GPU. The Counseling main-response model can run on GPU 0 while the audit classifier and scripture-lookup helper share GPU 1.
- **This is the build that literally enables "models in parallel"** as interpreted by the parent workup's recommended Interpretation #2 (router-based specialization).

**Tradeoffs honestly:**

- **Power and heat:** two 3090s under sustained load draw 700W at the cards alone. Plan for case airflow, adequate cooling, and a dedicated 15A or 20A circuit if the rest of the office is on the same breaker.
- **Noise:** louder than Option 1. Server-grade or workstation-grade case fans, not silent-PC fans, are appropriate.
- **Setup time:** ~6–12 hours including dual-GPU driver configuration, NVLink consideration (NVLink between 3090s gives modest inference benefit; not strictly required for tensor parallelism in modern vLLM), and validating tensor parallelism on a 70B model.
- **Physical size and placement:** this is a real workstation tower, not a NAS. Garage, utility room, or dedicated office corner — not next to a sleeping space.
- **Used-hardware risk:** as Option 1, doubled. Stress-test each card.

**Phase mapping (this is where the recommendation comes from):**

- **Phase 3** clears with significant headroom — 13B/32B at conversational latency uses a fraction of available VRAM, leaving room for the opt-in hosted fallback to genuinely be opt-in (and rare).
- **Phase 4 specialization router** is the natural shape of this hardware. Two GPUs = two simultaneous specialist models. The audit classifier and scripture-lookup helper live on GPU 1; the main four-section response model lives on GPU 0; the router decides per request. The parent workup's recommended "Interpretation #2" runs natively, not in serial-emulation.
- **Phase 4 throughput parallelism (Interpretation #3)** is also reachable here — vLLM continuous batching on a single 70B model serves multiple concurrent requests gracefully.

**Principle alignment:** Full. All-open-source stack, portable across Docker hosts, vendor-independent. No vendor lock-in anywhere.

**Why this is the recommendation:**

1. **Open hardware, sovereign.** Generic x86 + consumer/prosumer NVIDIA GPUs. No vendor's cloud, no vendor's account.
2. **Linux + Docker + Ollama/vLLM matches the portability principle exactly.** Same `docker-compose` lifts to any other Docker host the family ever moves to.
3. **Two GPUs literally enable parallel specialization** — not a clever single-GPU emulation, the actual hardware shape of Interpretation #2.
4. **Half the cost of Mac Studio M4 Max 64 GB** for materially more usable VRAM (48 GB across two cards beats 64 GB unified for inference-on-CUDA, where the open-source ecosystem is most mature). Faster GPU compute than Apple silicon on CUDA workloads. The principle test favors this option.
5. **Upgradeable.** A future 4th-generation card (next-gen 5090-class refresh, or a Blackwell datacenter card on the second-hand market in two years) drops into the same chassis with a PSU swap.

---

### Option 3 — Future-proof: Single RTX 5090 32 GB DIY build

**Estimated build cost:** **$2,800 – $3,300.**

**Build manifest:**

| Part | Spec | Price range |
|---|---|---|
| GPU | NVIDIA RTX 5090 32 GB (new; supply has stabilized in 2026) | $2,000 |
| Base | AM5 build: Ryzen 7 7800X3D or Ryzen 9 7900, B650E motherboard | $500 – $700 |
| RAM | 64 GB DDR5-6000 | $200 |
| PSU | 1000W 80+ Platinum (5090 TDP ~575W) | $170 |
| Case + NVMe | mid-tower with airflow + 2 TB NVMe Gen4 | $200 |

**Capability:**

- **32 GB VRAM single-GPU.** 70B Q4 fits with room. 13B/32B models at FP16. Larger context windows than 24 GB GPUs allow.
- **Highest single-GPU compute currently available.** Materially faster tokens/sec than the 3090 for the same model.
- **Headroom for fine-tuning small models** if Phase N+ ever requires it (the parent workup's non-goals currently exclude this, but the hardware doesn't preclude reconsidering).
- **New-hardware reliability** — full manufacturer warranty, no used-market risk.

**Tradeoffs honestly:**

- **Single GPU.** True parallel model serving requires either swapping in VRAM (slow) or a second GPU later (additional cost). This option is faster *per model* than Option 2, but cannot run two specialist models simultaneously on a single card.
- **Power:** 575W card TDP. Same circuit-and-cooling caveats as Option 2.
- **Cost premium over Option 2** for less aggregate VRAM and no parallel-model-serving capability. The capability profile is "single fast model" not "two specialist models."

**Phase mapping:**

- **Phase 3** clears beautifully.
- **Phase 4 Interpretation #2 (specialization)** runs in serial-with-fast-switch mode (similar to Option 1, but with much more headroom). Adequate, not optimal.
- **Phase 4 Interpretation #3 (throughput parallelism)** on a single fast 5090 is actually quite strong — vLLM continuous batching on this card serves many concurrent users.

**Principle alignment:** Full. Same open-source stack, same portability, same vendor-independence as Options 1 and 2.

**When to choose this over Option 2:** if Darrell's read is that *one really fast model* serves the SKOS use cases better than *two simultaneous specialist models*, and the future-fine-tuning headroom is valuable. Otherwise, Option 2 wins on both capability shape and cost.

---

### Option 4 — Alternative path: Mac Studio M4 Max

**Cost:** **$2,799 (64 GB unified memory)** or **$4,999 (128 GB unified memory).**

**Build manifest:** turnkey. Apple Mac Studio M4 Max. No assembly required.

**Capability:**

- **Unified memory architecture.** All 64 GB (or 128 GB) is addressable as both CPU RAM and GPU memory. 70B Q4 fits in 64 GB with room; 128 GB enables much larger models (or larger context windows on a 70B).
- **Low power, very quiet.** Sustained inference is in the 60–120W range. Apartment-compatible noise floor.
- **Fastest unified-memory inference platform currently available** for the price. Apple silicon Metal Performance Shaders + MLX framework deliver meaningfully strong inference on large models.

**Tradeoffs — including a principle tension that needs an explicit decision:**

- **macOS, not Linux.** This is a mild but real tension with the parent workup's binding principle. The principle (open-source, portable, vendor-independent) operates at the runtime-stack layer: Ollama, llama.cpp, MLX, and the orchestration gateway are all open-source on Mac as on Linux, and the open-weights models are identical. The application stack lifts off this hardware cleanly to any Linux host — nothing in the SKOS gateway depends on macOS APIs. **But the reference deployment host is not interchangeable in the same way the parent workup names** ("the same `docker-compose` stack must run unchanged on any generic Docker host"). Docker on Mac runs in a Linux VM; that's a meaningful asterisk on the portability story.
- **The honest framing:** the AI stack itself remains open-source and the *application* is portable to any other host. Whether the principle is satisfied depends on whether *"the family's chosen reference deployment can be a Mac"* is acceptable to Darrell, OR whether the principle requires the reference host to be a generic Linux box. **This is a decision Darrell needs to make explicitly, not one this doc resolves.**
- **Less GPU compute per dollar than NVIDIA on CUDA workloads.** Apple silicon excels at memory-bandwidth-bound workloads (long-context generation on large models); NVIDIA wins on raw FLOPS.
- **Single-vendor hardware.** The DIY options route around any single vendor; the Mac Studio is Apple top to bottom. Not a deal-breaker — it's still general-purpose hardware running open-source software — but it's a different posture than the DIY paths.
- **No future GPU upgrade.** Memory and compute are soldered. Two years from now, the path forward is "buy a new Mac Studio," not "drop in a new GPU."

**Phase mapping:**

- **Phase 3** clears strongly, especially at 128 GB.
- **Phase 4 Interpretation #2** runs as serial-with-fast-switch (single GPU/SoC). Adequate.
- **Phase 4 Interpretation #3** on Mac runs reasonably with appropriate continuous-batching frameworks.

**Principle alignment:** **Asterisked.** AI stack is open-source and portable; reference host is single-vendor. Acceptable only if Darrell rules that the principle's "portable across storage devices" component is satisfied by application-layer portability without requiring host-layer interchangeability.

**When to choose this:** noise floor matters (the workstation lives in a shared living space), Darrell is comfortable with the host-vendor asterisk, and the unified-memory inference profile fits the SKOS workload better than dual-GPU CUDA does.

---

## Recommendation

**Option 2 — Dual used RTX 3090 build at ~$2,000.**

The rationale, condensed:

1. **Principle alignment is full, not asterisked.** Open hardware, open-source stack, portable to any Docker host, vendor-independent at runtime. The parent workup's binding principle reads cleanly across this option without any "but…"
2. **Linux + Docker + Ollama matches the portable-stack principle exactly** as written in the parent workup.
3. **Two GPUs map directly to the parent workup's recommended Interpretation #2 (router-based specialization).** Not in serial-with-fast-switch emulation — in actual parallel hardware. The "models in parallel" founder framing meets its hardware home here.
4. **Half the cost of Mac Studio M4 Max 64 GB** for equivalent VRAM headroom (48 GB across two cards vs. 64 GB unified), with faster GPU compute on CUDA workloads where the open-source inference ecosystem is most mature.
5. **Upgrade path is real.** Chassis takes a future-generation GPU drop-in. Mac Studio is sealed at purchase.
6. **Best $/capability under the binding principle.** Option 1 is cheaper but constrained; Option 3 is more per-model speed but no parallelism; Option 4 trades principle alignment for noise and turnkey ease.

If noise or placement constraints make Option 2 untenable, the principle-respecting fallback is **Option 1 (single 3090) with the explicit plan to add the second card later** — the chassis is already chosen with that path in mind.

---

## Realistic Timeline

Mapping these options onto the parent workup's phases:

- **Phases 1 and 2** (gateway on the Synology, then hybrid: small models local + Anthropic for main response) **ship NOW with zero hardware spend.** Option 0 (CPU-only) carries these phases cleanly. This is the lowest-risk, highest-immediate-leverage work.
- **Phase 3** (local primary, hosted opt-in fallback — **the phase where vendor-independence is actually achieved**) **needs the hardware purchase.** Any of Options 1–4 unlock this. Option 2 is the recommended buy.
- **Phase 4** (specialization router across parallel models) **is where Option 2 specifically shines** — the dual-GPU build is the hardware shape of router-based specialization. Other options run Phase 4 in degraded forms.

The honest read: the parent workup's first two phases retire migration debt without spending a dollar. The third phase — the one that delivers on the binding principle — is where the hardware decision matters. Stay CPU-only and Phase 3 is permanently aspirational. Buy the hardware and the principle is satisfied.

There is no rush. The parent workup's revisit triggers still apply: PR #3 merged, MVP-1 stable, Phase 1 gateway running for 30+ days, the drift tests proven in practice. The hardware decision is the gate on Phase 3, not on the work that comes before it.

---

## Cross-References

| This Document | Connects To |
|---|---|
| The canonical AI infrastructure initiative this doc serves | `AI-INFRASTRUCTURE-SYNOLOGY.md` |
| The specific open question this doc addresses | `AI-INFRASTRUCTURE-SYNOLOGY.md` §"Open Questions for Darrell" — Question #3 |
| The binding principle every option is measured against | `AI-INFRASTRUCTURE-SYNOLOGY.md` §"Binding architectural principle: open-source, portable, vendor-independent" |
| The "models in parallel" interpretation menu options map to | `AI-INFRASTRUCTURE-SYNOLOGY.md` §"'Models in Parallel' — Interpretation Menu" |
| The phased delivery sketch options unlock | `AI-INFRASTRUCTURE-SYNOLOGY.md` §"Phased Delivery Sketch" |
| The living spine that holds the active workstream | `../../PROJECT-FRAMEWORK.md` |
| The older pipeline doc with the polarity note pointing here | `../_root/INFRASTRUCTURE-PIPELINE.md` |
| The sibling future / unratified initiative doc | `MARKETING-PIPELINE-NOTES.md` |
| The local-first sovereignty thesis this purchase deepens | `../_root/IN-PLACE-FIRST.md` |
| The meta-frame everything serves | `../_root/THE-WAY.md` |

---

## Religion AND Relationship in This Decision

**Religion-side:** Diligent planning, not haste (Proverbs 21:5). Build manifests with real dollar figures. Tradeoffs named honestly, including the principle tension on Option 4. Recommendation grounded in the binding principle, not in novelty or excitement about hardware. The Test (Philippians 4:8) applied to this document itself: is the recommendation TRUE (yes, the math holds), HONORABLE (yes, no spin), JUST (yes, every option is named fairly), PURE (yes, no hidden agenda), LOVELY (less applicable to a spec sheet), COMMENDABLE (yes, the family can defend it), EXCELLENT (yes, the recommended option is the best fit), PRAISEWORTHY (the stewardship of resources is praiseworthy when it serves the King's purposes).

**Relationship-side:** The recommendation honors Darrell's stated framing — "open-source stack inside of Synology so it can be used with any storage devices as a model so the app doesn't have to be associated with any other systems or devices or organizations." The dual-3090 build is the hardware shape of that sentence. The cost is real but bounded; the upgrade path is real and not a trap. The household considerations (noise, heat, placement) are named in plain language rather than dismissed.

Both.

---

*See also:* `AI-INFRASTRUCTURE-SYNOLOGY.md` (the canonical workup — read first), `../../PROJECT-FRAMEWORK.md` (the living spine), `MARKETING-PIPELINE-NOTES.md` (sibling future doc), `../_root/IN-PLACE-FIRST.md` (sovereignty thesis), `../_root/EXCELLENCE-STANDARD.md` (the quality bar — religion AND relationship).

**This document is UNRATIFIED and FUTURE. It is decision support for `AI-INFRASTRUCTURE-SYNOLOGY.md` Open Question #3. Do not act on it without deliberate evaluation at the revisit triggers in the parent workup.**
