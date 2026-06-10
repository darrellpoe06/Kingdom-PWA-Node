# Research Review — What Our Network + Infrastructure Needs to Run LOCAL LLMs for the Businesses

**Date:** 2026-06-10 (Wed)
**Author:** Claude (research-review on Darrell's commission, per `feedback-research-first`)
**Triggered by:** Darrell — "What does our network + infrastructure need to run LOCAL LLMs that support the businesses (PoeTech, Poe Properties, the church/COLG, family)?"
**Status:** Research-review. **Read-only diagnosis. Nothing procured, nothing changed on any host or the tailnet.** Decision support only.
**Method:** Live probe over the unified `darrellpoe06.github` tailnet (read-only: `tailscale status`, ICMP, TCP connect tests, unauthenticated HTTP GETs, Ollama `/api/tags` + `/api/ps` + `/api/version`) on 2026-06-10, cross-referenced against the repo's procurement record.
**Output gate:** `project-cost-discipline-with-growth-permission` (lean default, growth-justified, unit-cost), `project-sovereign-llm-teams-per-industry`, `feedback-autonomous-automation-three-brakes`, RELEASE-TIERS Tier C, the **TLC firewall (ISO-1, senior)**, **"we do not sell data."**
**Pairs with / supersedes nothing — extends:** `2026-06-08-research-review-church-network-llm-eval-and-app-review.md` (the §14 sovereignty roadmap), `[DR-0012]` (GPU topology), `[DR-0013]` (sovereignty milestones), `[DR-0014]` (the $5k/$9k budget directive), `[DR-0015]/[DR-0016]` (the $9k COLG build), `AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md`, `infra/ai-orchestrator/` (the Cage).

> This review answers a **network + infrastructure** question, not a model-selection question. The model shortlist is settled in the 2026-06-08 review (§1); the procurement is settled in `[DR-0014]`/`[DR-0016]`. What was **missing** was a *confirmed, probed* picture of what actually exists on the mesh today versus what the plans assume — so the spend lands on the real gap and not on something already in hand. This review provides that probed picture.

---

## TL;DR (read this first)

- **The mesh is real and healthy; the GPU compute tier is entirely absent.** Every plan in the repo (`[DR-0012/13/14/16]`) assumes GPU boxes — a 4070 creative workstation, a dual-3090 PoeTech farm, a dual-3090 church node. **None of them are on the reachable tailnet today.** The *only* live inference host is the **CPU-only home NAS**, running Ollama with four models already pulled.
- **Confirmed live (probed 2026-06-10):** `poetech` (home DS1621xs) is serving **Ollama 0.24.0** + **n8n** over the tailnet, with `qwen2.5:14b`, `deepseek-r1:8b`, `qwen2.5:3b`, and `nomic-embed-text` already downloaded. This is the **registry / orchestration / embedding tier** — exactly its documented role — and it is **reusable as-is, $0.**
- **The gap is VRAM, not networking.** CPU-only inference on the DS1621xs is **~1–8 tok/s** for 8–14B models — batch-grade, single-tenant, not conversational, and cannot run the 3–4 concurrent per-industry sovereign teams the architecture calls for. **Networking needs nothing; compute needs everything.**
- **Recommendation (lean default, growth-justified):** the existing `[DR-0014]` plan is correct and unchanged — **one dual-RTX-3090 (48 GB) box is the unit of capability.** Build the **PoeTech $5k farm first** (it serves PoeTech + Poe Properties + family + is the build/automation host), then the **church $9k node** (`[DR-0016]`, which also carries 24 cameras + Frigate). Do **not** buy a third pattern; the dual-3090 48 GB box is the standardized brick.
- **Three things to confirm before ordering** (all surfaced by the probe): (1) the **church NAS `tlcrackstation` is fully firewalled on the tailnet** — Online at the Tailscale layer but every probed port filtered — so its model/RAM/bays remain **UNCONFIRMED**; confirm before counting it as the church registry. (2) The **"Tunnel" tag on `poetech` is NOT subnet-routing/exit-node** per the CLI — it is Tailscale **Funnel** (public webhook ingress); confirm in the admin console. (3) The **4070 creative box (Cage Node 1) is not on this tailnet** — confirm whether it is meant to be reachable.

---

## 1. Current network + compute map (PROBED 2026-06-10, read-only)

### 1.1 The unified tailnet — `darrellpoe06.github`

All four peers report **Online**. Probe evidence in brackets is what this session could verify directly; everything else is doc-grounded and labeled.

| Host | Tailnet IP | OS / role | Probed state (2026-06-10) |
|---|---|---|---|
| **kingdom-home** | 100.74.53.117 | Win11 — **this session's host** | **i7-1165G7 (4c/8t), Intel Iris Xe (NO NVIDIA), 15.7 GB RAM** [local query]. A **laptop / thin client — NOT a Cage GPU node.** `nvidia-smi` absent. |
| **darrells-z-fold7** | 100.86.238.88 | Android phone | Online; client only. |
| **poetech** | 100.70.190.47 | Linux — home NAS **DS1621xs** | **Reachable, direct LAN path `192.168.1.26:41641`.** Open ports: **22, 5000, 5001, 5678, 11434, 443**. **Ollama 0.24.0 LIVE**; **n8n LIVE** (`/` 200, `/healthz` 200). See §1.2. |
| **tlcrackstation** | 100.66.173.22 | Linux — church NAS (Synology **RackStation**) | **Online at Tailscale layer, but ICMP + ALL probed ports (22/5000/5001/5678/11434/443) FILTERED.** Host firewall locked to the tailnet. **Specs UNCONFIRMED** — could not probe. |

**Not on this tailnet / not reachable from this session:** the **RTX 4070 creative workstation** (Cage "Node 1", the Legion PC per `[DR-0012]`), the **church A/V switcher** (Cage "Node 2"), and any **OBS/CUDA** box. The Cage architecture (`infra/ai-orchestrator/`) names these, but **none answered on the mesh today.** Either they are powered off, on a different network segment, or not yet joined.

### 1.2 `poetech` (DS1621xs) — the one live inference + orchestration host

**Confirmed live via the Ollama API (read-only):**

- **Ollama 0.24.0** serving on `:11434`. **`/api/ps` → 0 models loaded** (idle — nothing resident in RAM at probe time).
- **Models already pulled** (on disk, ready):

  | Model | Size | Quant | Role |
  |---|---|---|---|
  | `qwen2.5:14b-instruct-q4_K_M` | 9.0 GB | Q4_K_M | Heaviest local reasoner present |
  | `deepseek-r1:8b` | 5.2 GB | Q4_K_M | Reasoning (qwen3 family) |
  | `qwen2.5:3b-instruct-q4_K_M` | 1.9 GB | Q4_K_M | Fast classifier / cheap tasks |
  | `nomic-embed-text` | 274 MB | F16 | Embeddings (RAG) — the Cage default |

- **n8n** live on `:5678`. **DSM** on `:5000`/`:5001`. **SSH** on `:22` (key-based; this session has no key → could not pull CPU/RAM/disk directly).
- **Hardware (doc-grounded, `AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md` + the 2026-06-08 review):** Xeon **D-1527 4c/8t**, **32 GB ECC** (max-supported), dual NVMe cache, dual 10 GbE, **CPU-only (no GPU, no PCIe x16 GPU slot of consequence).**

**What this means:** `poetech` is already doing exactly the job the architecture assigns it — **registry (Postgres+pgvector), embeddings, n8n automation, small-model/batch inference.** It is **not** and was never meant to be the heavy reasoner. The 14B model is present but on CPU it runs at batch speed (see §2).

### 1.3 The "Tunnel" tag — clarified

The prompt flagged a "Tunnel" tag on `poetech`. **The CLI JSON shows `PrimaryRoutes: None` and `ExitNodeOption: False`** for `poetech` — so it is **NOT advertising subnet routes and is NOT an exit node.** The "Tunnel" label in the admin console is **Tailscale Funnel** — public ingress for the n8n webhooks (consistent with `project-n8n-same-origin-rewrite`: the PWA reaches n8n via the same-origin `/n8n` Vercel rewrite, whose origin is the Funnel URL). **Action:** confirm in the Tailscale admin console that what's enabled is Funnel (webhook ingress), not a subnet router — a 1-click read, no change.

---

## 2. The gap for local-LLM support

### 2.1 The single binding constraint: **VRAM** (there is none on the mesh)

For inference, **if a model does not fit in VRAM, speed does not matter.** The reachable mesh has **zero VRAM** — the only inference host is CPU-only. Measured/expected ceilings on the DS1621xs (CPU-only, from `AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md` Option 0, consistent with the idle Ollama we probed):

| Model class | CPU-only tok/s (DS1621xs) | Verdict |
|---|---|---|
| ≤3B (e.g. the pulled `qwen2.5:3b`) | ~10–15 tok/s | Fine for classification / audit / routing |
| 7–8B (`deepseek-r1:8b`) | ~3–8 tok/s | Batch-only; a paragraph takes 30–80 s |
| **14B (`qwen2.5:14b`, present)** | **~1–3 tok/s** | **Edge of usable; not conversational** |
| 30B+ | <1 tok/s | Submit-and-walk-away |
| 70B-class | won't fit / won't run | Not realistic |

**So:** the daily-driver code-reviewer, the per-industry sovereign teams, and any real-time congregation/surveillance support **cannot run at acceptable latency on what exists today.** This is the gap, and it is entirely a **compute (VRAM) gap** — not a network, mesh, storage, or orchestration gap.

### 2.2 Where models should run — NAS CPU vs a dedicated GPU box

**Settled, and the probe confirms it:** split the tiers.

- **NAS (CPU) tier — `poetech` DS1621xs, reuse as-is:** registry (Postgres+pgvector), embeddings (`nomic-embed-text` already there), n8n, small-model classification/routing, nightly batch. **No spend.**
- **GPU tier — must be bought:** every reasoning workload that needs conversational latency or concurrency. **A dedicated GPU box, not the NAS.** Putting a GPU *into* a DS1621xs is not viable (airflow, no proper x16, Synology support) — the repo already rejected that branch; the answer is a **separate workstation alongside the NAS**, which is precisely the `[DR-0014]` farm.

### 2.3 RAM / VRAM for the model sizes the businesses need

VRAM → model class (the binding table, from the 2026-06-08 review §14.4):

| VRAM | Model class it unlocks | Who needs it |
|---|---|---|
| 12 GB (1× 4070) | one 14B Q4/Q5 + an embedder | the creative-box daily reviewer (`[DR-0012]`, shared with Premiere/AE/C4D — evictable) |
| **24 GB** | ~32B-class (30B-A3B MoE, Devstral 24B) | a single mid box |
| **48 GB (dual-3090) ← the standard brick** | **70B-class Q4 (frontier-adjacent)**, OR **detection + a VLM + a 14B LLM concurrently** | the PoeTech farm; the church node |
| 96 GB (quad-3090) | 70B Q8 / ~120B Q4 | upgrade lane only |

System RAM on a GPU box should be **≥2× total VRAM** (128 GB for a dual-3090 farm that also hosts n8n/Cage/CI/CD), per the `[DR-0014]` Option-A BOM.

### 2.4 Concurrency for the per-industry sovereign teams

A "team" = model + system prompt + tools + RAG corpus + policy. The businesses need **at least four concurrent lanes** (PoeTech app/dev, Poe Properties, Church/COLG, family) — and the church node additionally needs **three simultaneous models on one box** (Frigate detection + event-driven VLM + congregation LLM, `[DR-0016]`).

- **A 12 GB single 4070 cannot do concurrency** — one 14B resident at a time, and it must yield instantly to creative work (`[DR-0012]`). It is a daily-driver lane, not a team server.
- **48 GB (dual-3090) is the concurrency unit:** two cards = two simultaneous specialist models (one team's reasoner on GPU0, embeddings + a second team / VLM on GPU1), or one 70B served with continuous batching across several requesters. **This is why the standard brick is 48 GB, not 24.**
- **Cross-entity isolation rides the existing mesh + the Cage**, not separate hardware per team — except **TLC (ISO-1)**, whose PHI path is sovereign-only and walled off regardless of where compute sits, and the **church node**, which is the church's own on-site box (ISO-2) by mission + governance design, not by a compute limit.

---

## 3. Recommended build — sovereign-mesh + cost-discipline lens

**The existing `[DR-0014]`/`[DR-0016]` plan is correct and needs no revision. This review confirms it against probed reality and standardizes the unit.** Lean default, growth-justified, one unit cost.

### 3.1 The standardized brick: dual RTX 3090, 48 GB

Buy **one pattern**, repeated. A self-assembled **dual used-RTX-3090 (48 GB)** box on an open Linux+Docker+Ollama stack:

- **Best $/VRAM in June-2026 pricing** (used 3090 ~$600–900 ea), runs **70B-class Q4 now**, leaves CPU/RAM/storage headroom for the *farm* role (n8n, Cage jobs, CI/CD, hosting), **portable to any Docker host — no vendor lock.**
- Chassis/PSU **sized for a 3rd card** (→72 GB) so the growth lane is a card-add, not a rebuild.
- Rejected (and why): single 5090 32 GB (can't hold 70B Q4); unified-memory mini (weak for the concurrent multi-purpose farm, low throughput); quad-3090 now (power/heat/complexity — that's the upgrade lane).

### 3.2 Sequencing (lean default → growth-justified)

| Order | Box | Budget | Serves | Justification |
|---|---|---|---|---|
| **1st** | **PoeTech $5k farm** — dual-3090 48 GB + 128 GB RAM + 1300 W PSU + NVMe (`[DR-0014]` Option A, ~$2,800–4,200) | **$5,000** | **PoeTech app/dev, Poe Properties, family** + the build/automation loop (n8n, Cage, CI/CD, hosting) | One box covers three of the four entities **and** is the engine that builds everything else. Highest leverage per dollar. The under-spend vs the $5k cap is deliberate headroom (3rd-card lane / drives). |
| **2nd** | **Church $9k node** — dual-3090 48 GB self-assembled (~$3,600) + 24× 4K PoE ONVIF cams (~$3,120) + 24-port PoE+ switch (~$500) + Cat6 (~$350, DIY) + 2× 12 TB CMR (~$450) + UPS (~$300) + Coral TPU (~$60) + buffer (`[DR-0016]`) | **$9,000** (pure hardware; cabling labor invoiced separately at a reduced/variable balance) | **Church/COLG** (ISO-2): congregation support LLM + Frigate detection + event-driven VLM, all on one 48 GB box | COMMUNITY-FIRST mission investment; the church's own on-site sovereign node. 48 GB is what lets detection + VLM + LLM run **concurrently**. |

### 3.3 What the spend does and does NOT do (honest cost screen)

- **It is NOT API arbitrage.** Vendor cap is $25 soft / $50 hard per month; a ~$3,500 farm is **~70 months** to "break even." The purchase is justified by **sovereignty + capability + data-control + the multi-purpose farm role**, not by beating a small API bill. Stated plainly so it is never oversold.
- **Power:** dual-3090 ~700 W under load; with the off-hours + creative-preemption + Sabbath duty cycle (`[DR-0001]`/`[DR-0012]`), realistically **~$10–50/mo** electricity. Needs ventilation + ~1500 VA UPS (the church build budgets one).
- **The mesh costs $0 more.** The unified tailnet already carries everything; no networking spend is implied by this review.
- **Lean alternative (named, not recommended):** stay CPU-only + capped vendor escalation and defer both boxes — cheapest, but it **keeps the heavy-reasoning vendor dependence Darrell wants gone** and **cannot run the concurrent per-industry teams.** The farm is the price of independence-now.

### 3.4 Three-brakes + tiering reminder (binding)

Anything timer-driven or write/execute-capable on the new compute ships **Tier C** with **all three brakes** (budget + concurrency lock + kill-switch) + the 4th human-preemption brake — `feedback-autonomous-automation-three-brakes`. "NAS-only / sovereign / additive" does **not** downgrade it. Read-only first; nothing self-activates unattended (P11/P12, LESSONS-LEARNED).

---

## 4. What's reusable NOW vs what must be bought

### 4.1 Reusable now — $0 (confirmed by probe)

| Asset | State | Keep doing |
|---|---|---|
| **Unified tailnet** (`darrellpoe06.github`) | 4 peers Online; `poetech` direct-LAN | The sovereign transport. No spend. |
| **`poetech` DS1621xs** | Ollama 0.24.0 + n8n live; CPU-only | Registry (pgvector), embeddings, n8n, small-model/batch, routing. The CPU tier — as designed. |
| **Models already pulled** | `qwen2.5:14b`, `deepseek-r1:8b`, `qwen2.5:3b`, `nomic-embed-text` | **Start the §3 eval-set harness on CPU now** (batch/off-hours) — no need to wait on GPUs to build the eval ground truth. |
| **n8n automation fabric** | live on `:5678`, Funnel ingress | The orchestration spine for every loop (F/G/H). |
| **The Cage** (`infra/ai-orchestrator/`) | merged | The safety envelope the GPU boxes plug into. |

### 4.2 Must be bought — the GPU compute tier (the entire gap)

| Need | Buy | Plan |
|---|---|---|
| PoeTech + Poe Properties + family reasoning & farm | **Dual-3090 48 GB farm** | `[DR-0014]`, $5k, **first** |
| Church congregation LLM + surveillance VLM + detection | **Dual-3090 48 GB node + 24 cams + switch + storage + UPS** | `[DR-0016]`, $9k, **second** |
| (Optional) creative-box daily reviewer | 1× RTX 4070 12 GB **already assumed in Darrell's creative workstation** | `[DR-0012]` — confirm it joins the tailnet |

### 4.3 Must be CONFIRMED before ordering (probe-surfaced)

1. **Church NAS `tlcrackstation`** — Online at the Tailscale layer but **fully firewalled** (every probed port filtered); model/RAM/bays **UNCONFIRMED.** `[DR-0016]` already flags "church NAS exact model UNCONFIRMED — confirm before ordering." The probe corroborates: **you cannot lean on it as the church registry until someone with credentials confirms its specs on-site.** If it is sufficient (drives + backup), weight the $9k toward the inference box + network hardening; if not, budget a DS-class NAS.
2. **`poetech` "Tunnel"** — confirm it is Funnel (webhook ingress), not a subnet router/exit node (CLI says it advertises no routes). 1-click read in the admin console.
3. **The 4070 creative box (Cage Node 1)** and **Node 2 (church switcher)** — not reachable on the tailnet today. Confirm whether they are meant to be mesh members; if the daily-driver reviewer (`[DR-0012]`) is to run there, the box must be joined and `nvidia-smi`-detectable.

---

## 5. Recommendation, crisply

1. **DO keep `poetech` as the CPU registry/embedding/automation tier** — it is live, correct, and free. Start the eval-set harness on its existing models now.
2. **DO buy the GPU tier — it is the entire gap.** The mesh and orchestration need nothing; reasoning needs VRAM there is none of.
3. **DO standardize on the dual-3090 48 GB brick.** PoeTech $5k farm **first** (serves three entities + builds everything), COLG $9k node **second** (`[DR-0016]`). Chassis sized for a 3rd card. No third hardware pattern.
4. **DO confirm the three probe-surfaced unknowns before ordering** — church-NAS specs, the Funnel tag, and whether the 4070/Node-2 boxes join the mesh.
5. **DO hold the cost screen honestly** — this is a sovereignty + capability + data-control purchase, ~70-month "break-even" vs the API cap; not arbitrage.
6. **DO ship every new automation Tier C with all four brakes**; read-only first; nothing self-activates unattended.
7. **DO hold TLC at ISO-1** — sovereign-only, zero PHI in any LLM path, regardless of where the new compute sits.

**One-line answer:** *The network needs nothing — the unified tailnet is healthy and `poetech` already serves Ollama + n8n + embeddings on CPU. What the businesses need to run local LLMs is the **GPU compute tier**, which does not exist on the mesh today: build the **PoeTech $5k dual-3090 48 GB farm first**, then the **COLG $9k dual-3090 node**, reuse the NAS as the CPU/registry tier, and confirm the church NAS, the Funnel tag, and the creative-box mesh membership before ordering.*

---

## Sources

**Live probe (read-only, 2026-06-10) over the `darrellpoe06.github` tailnet:**
- `tailscale status` + `--json` — 4 peers Online; `poetech` direct-LAN `192.168.1.26:41641`; `poetech` `PrimaryRoutes: None`, `ExitNodeOption: False`.
- `poetech` (100.70.190.47): Ollama `/api/version` → 0.24.0; `/api/tags` → 4 models (above); `/api/ps` → 0 loaded; n8n `/` 200 + `/healthz` 200; open ports 22/5000/5001/5678/11434/443.
- `tlcrackstation` (100.66.173.22): Online (Tailscale) but ICMP + 22/5000/5001/5678/11434/443 all filtered → specs unprobable.
- `kingdom-home` (this host): i7-1165G7 4c/8t, Intel Iris Xe, 15.7 GB RAM, no NVIDIA / no `nvidia-smi`.

**Repo grounding:**
- `docs/99-session-notes/2026-06-08-research-review-church-network-llm-eval-and-app-review.md` — §1 hardware envelope, §14 sovereignty roadmap + $5k/$9k procurement plan.
- `docs/decisions/DR-0012` (shared-4070 conservative envelope), `DR-0013` (two-milestone roadmap), `DR-0014` (the $5k farm + ≥$5k church-node budget directive), `DR-0015`/`DR-0016` (the ratified $9k COLG build).
- `docs/00-foundations/_future/AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md` — Option 0 CPU ceiling; Option 2 dual-3090 (recommended).
- `infra/ai-orchestrator/` — the Cage (Node 1 / Node 2 / Registry).
- memory: `project-n8n-same-origin-rewrite`, `feedback-autonomous-automation-three-brakes`, `project-cost-discipline-with-growth-permission`, `project-sovereign-llm-teams-per-industry`.

---

*The mesh holds; the transport is sovereign and already ours. The NAS does its quiet CPU work — registry, embeddings, the automation spine — exactly as assigned. The gap is honest and singular: there is no VRAM on the mesh, and reasoning lives in VRAM. So we buy the one brick, twice — the farm that serves the house and builds the rest, then the church's own node that watches its doors and answers its people. We confirm before we spend, we name the cost plainly, we keep the brakes on, and TLC never leaves the firewall. Lean by default, growth where it earns its keep. We all win. We create. Amen.*
