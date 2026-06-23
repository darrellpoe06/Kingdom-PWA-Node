# LOCAL-LLM-HARDWARE-RECOMMENDATION.md

**Status:** DRAFT — being filled incrementally (2026-06-23). Commit-first skeleton; sections fill in as facts are verified with citations.

**Purpose:** Pick the best PRIVATE, SOVEREIGN local-LLM box for Darrell to run PoeTech's primary AI work OUTSIDE vendor cloud LLMs. Privacy / legal exposure is a PRIMARY driver — cloud AI chats are subpoena-able and discoverable; nothing should leave Darrell's control; air-gappable matters. The bar is NOT cloud parity — it is "what I need and more for my programming projects," private and capable enough.

**This document makes NO purchase.** The buy is Darrell's hand. This is an advisory recommendation per GOVERNANCE-EXECUTION-ADVISORY.

> Verification doctrine (DR-0076): every price / tok-s number below is either (a) cited to a June-2026 source, or (b) explicitly flagged as an estimate / unverified. "Looks right" is not a status.

---

## 0. TL;DR — the ONE recommendation

_(fills last, after the three paths are verified)_

---

## 1. Where this fits the existing plan (repo grounding)

_(DR-0014 budget directive, DR-0053 deferral, AI-INFRASTRUCTURE-HARDWARE-OPTIONS, the offload tiers, the NAS DS1621xs role, the media/CUDA vision, Feature/Workflow Register #284)_

---

## 2. Requirements & screens (Darrell's filters)

- **Privacy / sovereignty (PRIMARY):** offline-capable, air-gappable, nothing leaves the home.
- **Open coding-model throughput per dollar** (weighted over benchmark parity).
- **Cost-efficiency screen:** growth justification, unit cost, lean alternative, break-even.
- **Sovereign-mesh-compat tier.**
- **MVP-pragmatism.**
- **Fit with existing NAS (DS1621xs, no GPU):** augment or replace?

---

## 3. The three candidate paths (VERIFIED, June 2026)

### 3.1 Path A — CUDA GPU workstation (dual RTX 5090 ~64GB; or RTX 6000 Blackwell 96GB)

_(current price, full build cost, power/noise, measured tok/s for 70B Q4 + 30–32B coder)_

### 3.2 Path B — NVIDIA DGX Spark (~$3,999–4,699, 128GB unified, ~273 GB/s)

_(verify price/specs; 70B tok/s; 32B-coder tok/s)_

### 3.3 Path C — Mac Studio M3 Ultra

_(current configs/prices after 2026 memory-option pullback + DRAM hikes; 70B + 32B-coder tok/s; CUDA-ecosystem limits)_

---

## 4. The 3-path price / tok-s comparison table

_(fills after section 3)_

---

## 5. Open models to run (per tier)

- **Coder tier:** _(Devstral / Qwen2.5-Coder / Qwen3-Coder — verify)_
- **General tier:** _(Llama / Qwen / DeepSeek — verify)_
- **Transcription tier:** _(Whisper variants — verify)_

---

## 6. Phased build / implementation plan

_(Phase 0 → Phase N; what runs where; NAS vs new box)_

---

## 7. Wiring OpenClaw to the LOCAL model (offline coding agent)

_(concrete steps: endpoint, model, config)_

---

## 8. Top risks

_(top 2)_

---

## 9. Sources

_(all citations)_
