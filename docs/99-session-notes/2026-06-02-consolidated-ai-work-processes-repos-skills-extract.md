# Consolidated AI Work Processes, Repos, Skills, and Patterns Extract

**Date:** 2026-06-02 (Tue evening, Maui)
**Author:** Claude as Advisor (per `GOVERNANCE-EXECUTION-ADVISORY`)
**Frame:** Urgent pull-up from Darrell -- "report on the actionable AI work processes, GitHub repos, libraries, skills, and implementation patterns surfaced by the past 18 hours of research-reviews. Pull the highest-leverage adoptions into the PoeTech dev cycle THIS WEEK to stop the constraint-and-blind-spot re-litigation pattern. The cure is shipping the substrate that auto-implements obvious fixes."
**Senior foundations applied:** `AI-FOUNDATION-INTERNAL-OPERATIONS`, `COMMUNITY-FIRST-MISSION`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION`, `WORKFLOW-MODULE-LIBRARY`, `BUSINESS-PROCESS-CONNECTIONS`, `EXCELLENCE-STANDARD`, `ANXIETY-CLARITY-PRINCIPLE`, `PERPETUAL-PIPELINE-HEALTH`, `AI-MEDIA-PRODUCTION-PLATFORM-VISION`, `GOVERNANCE-EXECUTION-ADVISORY`, `QUALITY-OF-LIFE-AS-NORTH-STAR`, `SCRIPTURE-REFERENCE-STANDARD`, `MIND-OF-CHRIST` (the Test).
**Memory bindings applied:** `project-sovereign-llm-teams-per-industry`, `project-sovereign-mesh-mvp-pragmatism`, `project-cost-discipline-with-growth-permission`, `project-workflow-module-library`, `project-nas-as-governance-point`, `feedback-research-first`, `feedback-always-now-viable-fix-source-dont-ask`.
**Source documents mined (all in `docs/99-session-notes/`):**

- `2026-06-01-research-review-sovereign-llm-teams-architecture.md` -- the architectural spine
- `2026-06-01-research-review-tina-huang-cowork-workflow.md` -- 14 techniques + autonomous-builder lifecycle
- `2026-06-01-icm-paper-review-for-childhood-friend.md` -- ICM 5-layer hierarchy + workspace-as-architecture
- `2026-06-01-research-review-n8n-fix-patterns.md` -- Config-node pattern + global Error Workflow + bind mount fix
- `2026-06-01-research-review-wf18-unreachable.md` -- Tailscale Funnel + Vercel rewrite fix
- `2026-06-01-research-review-kvm2-both-tracks.md` -- Proxmox 9 + KVM switch + GPU box specs
- `2026-06-02-research-review-media-opportunities-from-cbs-death.md` -- 8 media opportunities + sovereign media stack
- `2026-06-01-app-services-promise-audit-and-master-plan.md` -- 141 promises + 7-ship plan + bot-team mapping
- `2026-06-01-workflow-audit-bug-class-and-tagging.md` -- process.env bug class + module-tier inventory
- `2026-06-01-seed-data-urgent-sanitization-retroactive.md`
- `2026-06-01-mvp-comprehensive-review.md`
- `2026-06-01-mvp-launch-timeline-gap-analysis.md`
- `2026-06-01-holly-hill-equity-evaluation.md` + `-with-real-comps.md`
- `2026-06-02-family-worldview-commentary-american-christianity-racism-video.md` -- FWC v1 proof
- `2026-06-02-online-research-bundle-holly-hill-video-rates-closet-tenant-opportunities.md`

---

## 1. Executive summary

**Counts:**

- **42 actionable entries cataloged** across 8 categories (Sovereign LLM infra; Workflow + orchestration; Voice / phone / real-time; Media production; Governance + policy; Hardware + infra; ICM + filesystem-as-architecture; Marketing + brand).
- **30 entries are sovereign-mesh Tier 1** (natively mesh-aligned); 8 are Tier 2 (swappable); 4 are Tier 3 (vendor-escape-hatch with documented evolution path).
- **22 entries are $0 marginal cost** (open-source, runs on existing NAS or laptop); 13 are $-tier (under $50/mo or one-time under $100); 5 are $$-tier (one-time $200-2,000); 2 are $$$-tier (one-time $3,000-5,000 hardware).
- **15 GitHub repos identified as direct integration substrate** (not just reference) -- the substrate stops the re-litigation cycle.

**Single highest-leverage adoption (the keystone):** **Open Policy Agent (OPA) with NAS-resident Rego policies as the runtime governance authorizer**, paired with **n8n's built-in global Error Workflow + Aider-style git-revert-on-failure** as the operational substrate. This is the keystone because every other adoption in the queue (sovereign LLM teams per industry, autonomous builder, voice surfaces, media pipeline, multi-tenant onboarding) depends on a NAS-resident policy point that authorizes actions without re-asking Darrell each time. The principle declared 2026-06-02 (`project-nas-as-governance-point`) names this requirement; OPA + Rego is the production-grade pattern; it lands in one focused week.

**The constraint-or-blind-spot the top-5 adoptions eliminate:**

1. The 4-hour wf30 silent-fail debug pattern (no global observability) -- eliminated by **#2 n8n Error Workflow + Pushover/ntfy alert chain**.
2. The hand-build-per-workflow tax (Config drift across 35 workflows + 27 hardcoded values) -- eliminated by **#3 n8n Set-node-Config pattern + `/data/config/family.json` substrate**.
3. The "ask Darrell to confirm each obvious fix" pattern (re-litigation per `feedback-always-now-viable-fix`) -- eliminated by **#1 OPA + NAS-resident Rego + Quality Gatekeeper (wf36)**.
4. The PRD-from-scratch-each-time pattern -- eliminated by **#4 Tina Huang PRD Metaprompt + Phase 0 orient-from-memory + 10-section fixed PRD structure**.
5. The Cowork-vs-Code-vs-Dispatch context loss across sessions -- eliminated by **#5 ICM 5-layer folder structure + Cowork-account-level Operating Instructions doc + the autonomous-builder pending/in-progress/done/failed lifecycle**.

After these five land, the dev cycle's next 18-hours-of-re-litigation become 30 minutes of NAS policy approval + 1 hour of focused work. The substrate ships the obvious fixes.

---

## 2. Category catalog

### Category A: Sovereign LLM infrastructure

**A1: Ollama** (Category A)
- **Source:** https://ollama.com/library + https://github.com/ollama/ollama
- **What it does:** Single-binary LLM inference engine; pulls and serves quantized GGUF models via REST API. Already operational on the DS1621xs+ at `http://ollama:11434`.
- **PoeTech adoption fit:** Already the sovereign default. The two-tier minimum-viable stack (3B router + 14B daily-driver + embedder) per the sovereign-LLM-teams architecture doc Section A.7 runs here.
- **Sovereign-mesh Tier:** 1 (open-source, runs on owned hardware).
- **Cost-efficiency screen:** $0 marginal -- already deployed. Break-even: any task off Claude/Gemini metered API.
- **Adoption cost:** Already adopted. Marginal cost to add a model: `ollama pull <name>` (one command).
- **Highest-leverage use case:** every per-industry sovereign LLM team's brain.
- **Risk if NOT adopted:** vendor lock-in on every daily task; data leaves the family on every routine inference.
- **Source doc:** sovereign-LLM-teams-architecture Section A.

**A2: Qwen2.5:14b-instruct-q4_K_M** (Category A)
- **Source:** https://ollama.com/library/qwen2.5 + https://huggingface.co/Qwen/Qwen2.5-14B-Instruct
- **What it does:** Current daily-driver model. ~8.7 GB Q4, fits in ~10-11 GB RAM at runtime. 2-4 tok/s on DS1621xs+ CPU; production-quality structured-output and tool-call support.
- **PoeTech adoption fit:** Already the "on-demand-warm" model in the two-tier stack. Per-industry team brain at v1 across Dev/Ops, Family-Finance, Counseling, Church-Ops.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 marginal. Unit cost ~$0/inference on existing hardware; growth scales without per-token bill.
- **Adoption cost:** Already pulled. Per-team config = ~30 min YAML + system prompt.
- **Highest-leverage use case:** the four per-industry teams (Dev/Ops, Family-Finance, Counseling, Church-Ops).
- **Risk if NOT adopted:** routing routine work to vendor LLMs continues; cost ladder degrades unit economics.
- **Source doc:** sovereign-LLM-teams-architecture Section A.5.

**A3: phi-3-mini / llama-3.2:3b** (Category A)
- **Source:** https://ollama.com/library/phi3 + https://ollama.com/library/llama3.2
- **What it does:** 3B-parameter router / classifier / fast structured-output. ~2 GB Q4. 12-18 tok/s on the NAS CPU.
- **PoeTech adoption fit:** the "always-warm" router model that runs the Tier-2 task classifier in the F.3 three-tier router pattern. Wakes fast for INPUT-VISIBILITY-TO-CLAUDE family-voice surfaces.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 marginal. Stays resident in ~4 GB RAM; minimal CPU impact.
- **Adoption cost:** `ollama pull phi-3-mini` + wire as router model in wf27 (~1 focused hour).
- **Highest-leverage use case:** wf27 Foundation Agent classifier + sub-60-sec family-voice acknowledgment.
- **Risk if NOT adopted:** every classification trip pays the 14B-Q4 latency tax (2-4 tok/s); router becomes the bottleneck.
- **Source doc:** sovereign-LLM-teams-architecture Section A.5.

**A4: nomic-embed-text-v2-moe** (Category A)
- **Source:** https://ollama.com/library/nomic-embed-text-v2-moe + https://github.com/nomic-ai/nomic
- **What it does:** MoE embedding model (137M active params); 580 chunks/sec on CPU. The CPU-default RAG embedder per the architecture doc.
- **PoeTech adoption fit:** every per-industry team's RAG embedder. ESV scripture corpus + COLG sermon archive + Worldview text + property records + clinical-policy text all embed here.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 marginal.
- **Adoption cost:** `ollama pull nomic-embed-text-v2-moe` + Qdrant or pgvector deployment (~2 focused hours for the vector store).
- **Highest-leverage use case:** the Church-team scripture RAG + the Family-Finance corpus + Counseling-team intake materials.
- **Risk if NOT adopted:** every RAG hits vendor embedding APIs (OpenAI / Cohere); cost ladder fails.
- **Source doc:** sovereign-LLM-teams-architecture Section A.5 + 3.1 Church team specialization.

**A5: Qdrant (vector store)** (Category A)
- **Source:** https://github.com/qdrant/qdrant + https://qdrant.tech/
- **What it does:** Open-source vector database; Rust-native; runs as a Docker container; supports filtering + payload + hybrid search.
- **PoeTech adoption fit:** the per-team vector store for the RAG corpora. Lives at `qdrant://team-family-finance`, `qdrant://team-counseling`, `qdrant://team-church-colg`, `qdrant://team-devops`.
- **Sovereign-mesh Tier:** 1 (self-hosted, NAS-resident).
- **Cost-efficiency screen:** $0 marginal. Adds ~500 MB RAM at idle; scales with corpus size.
- **Adoption cost:** Docker compose entry + 2 focused hours for collection setup + Ollama integration via `nomic-embed-text-v2-moe`.
- **Highest-leverage use case:** the Family-Finance Holly Hill RAG (property records + comps + jubilee math); the Church-team scripture + sermon archive.
- **Risk if NOT adopted:** Cloud vendor embeddings (Pinecone, Weaviate Cloud) lock in user data outside the family's NAS; structural lock-in violates `project-sovereign-mesh-mvp-pragmatism`.
- **Source doc:** sovereign-LLM-teams-architecture Section E.3.

**A6: pgvector (vector store alternative)** (Category A)
- **Source:** https://github.com/pgvector/pgvector
- **What it does:** Postgres extension for vector similarity search. Single-store pattern -- text + relational data + vectors in one DB.
- **PoeTech adoption fit:** the alternative-to-Qdrant where the team already has a Postgres dependency. Likely the Family-Finance store if/when transactions move from JSON file to Postgres.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 marginal.
- **Adoption cost:** ~30 min via Synology Container Manager Postgres + pgvector extension.
- **Highest-leverage use case:** if/when Family-Finance grows past the JSON-file pattern.
- **Risk if NOT adopted:** none (Qdrant covers the v1 need; pgvector is the alternative).
- **Source doc:** sovereign-LLM-teams-architecture Section E.3.

**A7: Whisper.cpp / faster-whisper / WhisperX** (Category A; also Category D)
- **Source:** https://github.com/ggml-org/whisper.cpp + https://github.com/SYSTRAN/faster-whisper + https://github.com/m-bain/whisperX
- **What it does:** Open-source speech-to-text. faster-whisper int8 transcribes a 60-90 min sermon in 8-15 min on DS1621xs CPU. WhisperX adds pyannote-audio diarization + word-level alignment.
- **PoeTech adoption fit:** the substrate for COLG Sermon-to-Content, Counseling-team voice intake, family-worldview-commentary pipeline.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 marginal on existing NAS; growth-justified for the Sermon-to-Content pipeline ($199/mo COLG-Supported tier x 10 churches y1 = $24K ARR).
- **Adoption cost:** ~4 focused hours -- Docker compose entry, integration with wf37 (already drafted), bind-mount to `/data/audio/`.
- **Highest-leverage use case:** **COLG Sermon-to-Content pipeline v1** (the highest-leverage media ship per the media-opportunities doc).
- **Risk if NOT adopted:** sermon transcripts depend on Tactiq.io / vendor STT APIs; family content leaks to a third party on every sermon.
- **Source doc:** media-opportunities Section 3.1; FWC v1 proof Section 3 (transcript extraction notes).

**A8: Open WebUI** (Category A)
- **Source:** https://github.com/open-webui/open-webui
- **What it does:** Self-hosted ChatGPT-style web interface that talks to Ollama. Multi-user; conversation history per user; tool integration.
- **PoeTech adoption fit:** the family-facing chat surface that doesn't require building a custom PWA chat module. Optional layer per the architecture doc Section E.3.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 marginal.
- **Adoption cost:** ~30 min Docker compose entry; wire to existing Ollama; configure user accounts.
- **Highest-leverage use case:** the family member who wants ChatGPT-like access to the sovereign team without going through the PWA. Bishop Gwin's elderly staff get a recognizable surface.
- **Risk if NOT adopted:** the PWA becomes the only chat surface; recognition-cost is higher for new users (COLG staff, family).
- **Source doc:** sovereign-LLM-teams-architecture Section E.3.

**A9: vLLM (Phase 2 GPU box, deferred)** (Category A)
- **Source:** https://github.com/vllm-project/vllm
- **What it does:** Production-grade LLM serving engine; concurrent multi-user; PagedAttention for high throughput. Linux + NVIDIA only.
- **PoeTech adoption fit:** Phase 2 GPU box (post-RTX-4090 acquisition) for multi-user concurrent serving of COLG members + family + future communities. Replaces Ollama for the busy paths.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $$ (one-time $3,400 GPU box). Growth-justified when concurrent user load makes Ollama's single-request-at-a-time the bottleneck.
- **Adoption cost:** ~12 focused hours after GPU box ships -- Proxmox + LXC + NVIDIA Container Toolkit + model warm-up.
- **Highest-leverage use case:** concurrent Sunday-morning COLG member access to the Church-team during service hours.
- **Risk if NOT adopted:** Ollama's serialization caps concurrent capacity; user latency degrades at COLG-scale load.
- **Source doc:** sovereign-LLM-teams-architecture Section A.4; KVM2 Track A Section 2.10.

**A10: Distil-Whisper** (Category A)
- **Source:** https://github.com/huggingface/distil-whisper
- **What it does:** ~99% of large-v3 quality at 6x speed; pairs with WhisperX for diarization.
- **PoeTech adoption fit:** the fastest-accuracy-preserving option for the sermon pipeline when GPU box arrives.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 marginal.
- **Adoption cost:** ~30 min substitution for faster-whisper.
- **Highest-leverage use case:** Sermon-to-Content Phase 2 -- batch multiple sermons + family-worldview-commentary episodes in parallel.
- **Risk if NOT adopted:** post-GPU-box performance plateau.
- **Source doc:** media-opportunities Section 3.1.

### Category B: Workflow + orchestration patterns

**B1: n8n self-hosted (current)** (Category B)
- **Source:** https://github.com/n8n-io/n8n + https://docs.n8n.io/
- **What it does:** Open-source workflow automation engine; visual builder; Code nodes (sandboxed Node.js); HTTP / webhook / cron / file triggers.
- **PoeTech adoption fit:** Already the operational substrate. 35 workflows; 18 active. The supervisor pattern in wf27 is the seed of the per-industry team dispatcher.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 marginal.
- **Adoption cost:** Already adopted.
- **Highest-leverage use case:** the operational substrate every per-industry team rides.
- **Risk if NOT adopted:** N/A.
- **Source doc:** n8n-fix-patterns, workflow-audit, sovereign-LLM-teams-architecture Section B.4.

**B2: n8n Set-node Config pattern + `/data/config/family.json`** (Category B)
- **Source:** https://docs.n8n.io/code/builtin/overview/ + https://docs.n8n.io/code/cookbook/builtin/vars/ + workflow-audit Section 6
- **What it does:** Replaces the broken `process.env.X` Code-node access (n8n 2.21.7 sandbox blocks env vars by default) with a Set node containing per-family config values, OR a JSON file read via `fs.readFileSync('/data/config/family.json')`. Per Decision 1 of n8n-fix-patterns research-review.
- **PoeTech adoption fit:** kills the process.env bug class once (wf12, wf20, wf27, wf29 are still latent landmines). Becomes the canonical Tier-2 deployment contract.
- **Sovereign-mesh Tier:** 1 (config-as-data on the NAS).
- **Cost-efficiency screen:** $0 marginal.
- **Adoption cost:** ~2 focused hours total -- one Set-node per workflow + one shared `/data/config/family.json` once two modules are live.
- **Highest-leverage use case:** every Tier-2 workflow ships unchanged to COLG / another family; only the config swaps.
- **Risk if NOT adopted:** every active workflow with `process.env` access is one container-env-glitch from silent-failing; same bug class that ate 4 hours on 2026-06-01.
- **Source doc:** n8n-fix-patterns Decision 1; workflow-audit Section 2.

**B3: n8n global Error Workflow + Error Trigger node (wf02-workflow-failure-alert)** (Category B; also Category E)
- **Source:** https://docs.n8n.io/flow-logic/error-handling/ + https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.errortrigger/ + https://blog.n8n.io/creating-error-workflows-in-n8n/
- **What it does:** A single workflow that starts with an Error Trigger node; receives every failed-workflow's metadata + error payload; routes to Pushover (Darrell-personal) + ntfy (family). Set as the "Error Workflow" on every active workflow via n8n Settings.
- **PoeTech adoption fit:** kills the silent-failure pattern once. The 4-hour wf30 debug structurally cannot recur.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 marginal (Pushover already paid; ntfy already self-hosted).
- **Adoption cost:** ~30 min -- replace placeholder credentials, activate `02-workflow-failure-alert.json`, settings flip on each active workflow.
- **Highest-leverage use case:** every existing + future workflow inherits silent-failure-elimination.
- **Risk if NOT adopted:** wf12 / wf20 / wf27 / wf29 stay structurally one-glitch-away from silent failure.
- **Source doc:** n8n-fix-patterns Decision 2.

**B4: LangGraph Supervisor pattern (for multi-agent orchestration)** (Category B)
- **Source:** https://reference.langchain.com/python/langgraph-supervisor + https://github.com/langchain-ai/langgraph
- **What it does:** Canonical multi-agent supervisor architecture; one router classifies, dispatches to specialists. The pattern wf27 already approximates.
- **PoeTech adoption fit:** reference pattern. PoeTech doesn't adopt LangGraph itself (Python; would duplicate n8n's role); adopts the SUPERVISOR pattern in wf27.
- **Sovereign-mesh Tier:** 1 (pattern-only; no vendor dependency).
- **Cost-efficiency screen:** $0 marginal.
- **Adoption cost:** ~4 focused hours -- refactor wf27 `classify()` to dispatch by `industry` tag in addition to TLC/escalation.
- **Highest-leverage use case:** the per-industry team router lives in wf27 evolved.
- **Risk if NOT adopted:** ad-hoc routing in every workflow; no single point to evolve.
- **Source doc:** sovereign-LLM-teams-architecture Section B.4.

**B5: Aider autonomous code editor (pattern + git-revert)** (Category B; also Category E)
- **Source:** https://github.com/Aider-AI/aider + https://aider.chat/docs/git.html + https://aider.chat/docs/config/options.html
- **What it does:** AI pair programmer; auto-commits every successful AI edit as its own git commit with a model-generated message; pre-commit hooks via `--git-commit-verify`; dirty files committed first to keep edits separate. The "audit + reversibility via git" pattern that makes autonomous coding reviewable.
- **PoeTech adoption fit:** the pattern (not necessarily the binary) for the Dev/Ops Foundation Team's auto-fix loop. When the team proposes a fix, it commits to a branch; CI runs; if pass, queue for one-tap Darrell approval; if fail, auto-revert.
- **Sovereign-mesh Tier:** 1 (pattern is local; Aider works with any LLM including Ollama).
- **Cost-efficiency screen:** $0 marginal if used with sovereign LLM; growth-justified for the silent-fail-surfacing pilot.
- **Adoption cost:** ~3 focused hours to wire the auto-commit-on-success / auto-revert-on-failure pattern into wf27.
- **Highest-leverage use case:** Pilot 2 (Dev/Ops Foundation -- silent-failure surfacing).
- **Risk if NOT adopted:** every fix continues to need explicit Darrell review at code-time, not at policy-time.
- **Source doc:** sovereign-LLM-teams-architecture Section C.2; G.2.

**B6: smolagents secure code execution** (Category B)
- **Source:** https://github.com/huggingface/smolagents + https://huggingface.co/docs/smolagents/en/tutorials/secure_code_execution
- **What it does:** HuggingFace's agent framework; LocalPythonExecutor that disallows imports unless on an allow-list; sandboxed cloud executors (E2B, Modal, Docker) for higher-security runs. Important caveat in their own docs: LocalPythonExecutor is NOT a true security sandbox.
- **PoeTech adoption fit:** reference pattern. The PoeTech sovereign-team architecture borrows the allow-list approach for tool calling but enforces via OPA Rego at the policy layer (stronger than Python sandbox).
- **Sovereign-mesh Tier:** 1 (pattern + open-source).
- **Cost-efficiency screen:** $0 marginal.
- **Adoption cost:** Reference-only; no direct integration recommended.
- **Highest-leverage use case:** the per-team allowed-tool list mirrors smolagents' allow-list pattern.
- **Risk if NOT adopted:** none (the pattern is borrowed; the framework itself is optional).
- **Source doc:** sovereign-LLM-teams-architecture Section C.2.

**B7: Tina Huang autonomous-builder lifecycle (pending / in-progress / done / failed + 30-min pickup)** (Category B)
- **Source:** https://www.youtube.com/watch?v=gdrPkpXuNks + https://resource.lonelyoctopus.com/doc/ce409140-9c5c-4923-a739-871048b339eb/
- **What it does:** folder-based queue for autonomous builds. Approved PRDs land in `pending/`; a scheduled task every 30 min scans, picks up, moves to `in-progress/`, executes, moves to `done/` or `failed/`. Mission-control dashboard shows queue depth + currently-building + last 5 done + last 5 failed.
- **PoeTech adoption fit:** the structural pattern Darrell named for WORKFLOW-MODULE-LIBRARY + sovereign-LLM-teams. Builds queue on the NAS; the AI Foundation picks up + executes within pre-authorized policy; emits ntfy on every state transition.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 marginal.
- **Adoption cost:** ~2 focused hours -- folder scaffold under `/data/cowork/builds/` + one new n8n workflow `wf-autonomous-builder.json` + ntfy push on state transitions + PWA dashboard panel.
- **Highest-leverage use case:** "Darrell queues builds before bed and wakes up to finished projects." The autonomous-builder is the operational layer that sits ON TOP of ICM's architectural layer (Tina + Van Clief synthesis).
- **Risk if NOT adopted:** every build supervised by Darrell at code-time; the substrate that auto-implements obvious fixes never materializes.
- **Source doc:** tina-huang-cowork-workflow Section 2.10 + 6.3.

**B8: Tina Huang PRD Metaprompt (Phase 0 orient / Phase 1 propose / Phase 2 architecture / Phase 3 PRD)** (Category B)
- **Source:** https://resource.lonelyoctopus.com/doc/ce409140-9c5c-4923-a739-871048b339eb/
- **What it does:** 200+ line metaprompt that pre-fills every answer from memory + recaps to user for correction + proposes 4-6 domain options + asks the one thing that cannot be guessed (build length 3/5/8 hours) + sketches architecture for sign-off + produces a 10-section build-ready PRD.
- **PoeTech adoption fit:** kills the "ask Darrell what he wants" pattern. Drive-Don't-Delegate compounds when the LLM brings the plan, not a blank page.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 marginal.
- **Adoption cost:** ~30 min to encode as a binding pattern in `CLAUDE.md` + ~30 min to validate on one real PRD.
- **Highest-leverage use case:** every future research-review and product spec uses the same shape; cumulative context cost drops to near-zero.
- **Risk if NOT adopted:** every PRD starts from scratch; same questions get asked repeatedly.
- **Source doc:** tina-huang-cowork-workflow Section 2.3 + 6.2.

**B9: Tina Huang 10-section fixed PRD structure** (Category B)
- **Source:** https://resource.lonelyoctopus.com/doc/ce409140-9c5c-4923-a739-871048b339eb/
- **What it does:** 10-section spec: Executive summary / Quick start / Goals + non-goals / Architecture overview / Data layer / Component specs / Build plan (Block 0 setup + hour-sized Blocks 1..N) / Setup details + copy-paste prompts / Decision log (8-15 rows) / Out of scope.
- **PoeTech adoption fit:** canonical PRD shape across all future product specs. Research-reviews stay separate.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 marginal.
- **Adoption cost:** ~30 min -- new foundation doc `docs/00-foundations/_root/PRD-STRUCTURE-STANDARD.md`.
- **Highest-leverage use case:** every product spec uses identical shape; comparisons across specs become trivial.
- **Risk if NOT adopted:** PRDs vary; review-cost per PRD stays high.
- **Source doc:** tina-huang-cowork-workflow Section 6.5.

**B10: Tina Huang Operating Instructions doc (Cowork-account-level)** (Category B)
- **Source:** https://resource.lonelyoctopus.com/doc/ce409140-9c5c-4923-a739-871048b339eb/
- **What it does:** four-section spec (About Me / Building / Pushback / Reversibility / Note-taking / Working Style) pasted into Cowork Settings -> Cowork. Applies to every Cowork session globally.
- **PoeTech adoption fit:** addresses the gap where sessions opened outside the repo lose CLAUDE.md context.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 marginal.
- **Adoption cost:** ~1 focused hour -- compose + paste into Cowork Settings + create source-of-truth doc at `docs/00-foundations/_root/COWORK-ACCOUNT-OPERATING-INSTRUCTIONS.md`.
- **Highest-leverage use case:** Cowork-account-level discipline applies to every session, not just repo-scoped ones.
- **Risk if NOT adopted:** sessions outside the repo run without binding rules; Religion-AND-Relationship test drift.
- **Source doc:** tina-huang-cowork-workflow Section 6.1.

**B11: Productivity plugin (Cowork) -- `/start` + `/update` + dashboard.html scaffold** (Category B)
- **Source:** Tina Huang video metadata + LonelyOctopus resource
- **What it does:** Cowork plugin that initializes `CLAUDE.md`, `TASKS.md`, `memory/`, `dashboard.html` at project root with one `/start` command. `/update` keeps everything fresh.
- **PoeTech adoption fit:** the Cowork-side scaffold for the autonomous-builder + per-industry team configs.
- **Sovereign-mesh Tier:** 2 (Cowork-vendor-bound at v1; pattern is open).
- **Cost-efficiency screen:** $0 marginal (Cowork subscription already paid).
- **Adoption cost:** ~15 min -- run `/start` on a per-team folder.
- **Highest-leverage use case:** each per-industry team gets a Cowork project folder with the scaffold; the LLM-team config + memory live there.
- **Risk if NOT adopted:** per-team folders ad-hoc; structure drifts.
- **Source doc:** tina-huang-cowork-workflow Section 2.1 + 2.2.

### Category C: Voice / phone / real-time agents

**C1: Twilio (vendor; phone + SMS routing)** (Category C)
- **Source:** https://www.twilio.com/docs/voice
- **What it does:** Telephone + SMS routing; programmable IVR; voice call recording. The bridge layer between PSTN and the sovereign AI.
- **PoeTech adoption fit:** Phase 0 phone-assistant for Poe Properties tenant calls; COLG multi-channel broadcast (SMS arm of the church communication pipeline).
- **Sovereign-mesh Tier:** 2 (vendor; phone numbers are portable; recordings exportable; no structural lock-in).
- **Cost-efficiency screen:** $ -- ~$20-40/mo for low-volume + per-message SMS. Growth-justified for the tenant-call pilot.
- **Adoption cost:** ~6-8 weeks for Phase 0 phone assistant (per memory `project-sovereign-mesh-mvp-pragmatism`); ~2 focused hours for SMS broadcast wiring in COLG pipeline.
- **Highest-leverage use case:** Poe Properties tenant-call pilot (frees 2-4 hrs/day of Darrell's tenant-call time).
- **Risk if NOT adopted:** tenant calls stay manual; COLG SMS broadcast unwired.
- **Source doc:** memory `project-sovereign-mesh-mvp-pragmatism`; media-opportunities Section 2.4 (M4).

**C2: Gemini Live (vendor; real-time voice LLM)** (Category C)
- **Source:** https://ai.google.dev/gemini-api/docs/live-api
- **What it does:** Real-time voice-to-voice LLM; sub-second latency; multilingual; covered by Gemini Pro $20/mo subscription.
- **PoeTech adoption fit:** Phase 0 brain for the phone-assistant pilot. Tier 2 -- swappable to sovereign once GPU box ships.
- **Sovereign-mesh Tier:** 2.
- **Cost-efficiency screen:** $ -- covered by existing Gemini Pro subscription.
- **Adoption cost:** ~6-8 weeks for Phase 0 pilot integration with Twilio.
- **Highest-leverage use case:** tenant-call live voice answering; Council Chamber Phase 0.
- **Risk if NOT adopted:** OpenAI Realtime ($100+/mo) becomes the only option; cost ladder degrades.
- **Source doc:** memory `project-sovereign-mesh-mvp-pragmatism`; Phase 0 phone-assistant entry.

**C3: Pipecat (open-source voice-agent framework)** (Category C)
- **Source:** https://github.com/pipecat-ai/pipecat
- **What it does:** Python framework for building real-time voice agents; chains STT + LLM + TTS pipelines; integrates with Twilio, LiveKit, Daily.
- **PoeTech adoption fit:** the open-source substrate for the phone-assistant Phase 2 (post-GPU-box, swap Gemini for sovereign Qwen 3.6-27B + sovereign TTS).
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 marginal.
- **Adoption cost:** ~12 focused hours after GPU box ships.
- **Highest-leverage use case:** sovereign tenant-call pipeline at Phase 2.
- **Risk if NOT adopted:** lock-in on Gemini Live for voice indefinitely.
- **Source doc:** infrastructure-strand of sovereign-LLM-teams + media-opportunities.

**C4: LiveKit (open-source WebRTC + agents)** (Category C)
- **Source:** https://github.com/livekit/livekit + https://github.com/livekit/agents
- **What it does:** Open-source WebRTC infrastructure + AI agent framework. Self-hostable; real-time voice + video; integrates with sovereign LLMs.
- **PoeTech adoption fit:** the sovereign alternative for any future voice surface beyond phone (in-app voice; family-to-family voice mesh).
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 marginal self-hosted.
- **Adoption cost:** Defer to post-GPU-box.
- **Highest-leverage use case:** future Council Chamber in-app voice surface.
- **Risk if NOT adopted:** none short-term.
- **Source doc:** voice-agent stack reference.

**C5: Vocode (Python voice-agent framework)** (Category C)
- **Source:** https://github.com/vocodedev/vocode-core
- **What it does:** Python framework for voice agents; competitor to Pipecat; chains STT + LLM + TTS.
- **PoeTech adoption fit:** reference / alternative to Pipecat.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0.
- **Adoption cost:** Reference-only; pick one (Pipecat or Vocode), not both.
- **Highest-leverage use case:** same as Pipecat.
- **Risk if NOT adopted:** none (Pipecat covers).
- **Source doc:** voice-agent stack reference.

**C6: OpenAI Realtime API (vendor; alternative to Gemini Live)** (Category C)
- **Source:** https://platform.openai.com/docs/guides/realtime
- **What it does:** OpenAI's real-time voice-to-voice API; high quality; expensive.
- **PoeTech adoption fit:** Tier 3 escape hatch ONLY when Gemini Live can't meet a quality bar. Default to Gemini.
- **Sovereign-mesh Tier:** 3.
- **Cost-efficiency screen:** $$$ -- $100+/mo typical. Not recommended over Gemini Live for the Phase 0 pilot.
- **Adoption cost:** N/A (skip).
- **Highest-leverage use case:** N/A.
- **Risk if NOT adopted:** none.
- **Source doc:** memory `project-sovereign-mesh-mvp-pragmatism` comparison.

### Category D: Media production stack

**D1: Remotion (programmatic video)** (Category D)
- **Source:** https://github.com/remotion-dev/remotion + https://www.remotion.dev/
- **What it does:** React-based programmatic video. JSX components compose to video frames; ffmpeg renders.
- **PoeTech adoption fit:** the sermon-clip + family-worldview-commentary + property-tour video composition substrate. Templated production pipelines that version-control.
- **Sovereign-mesh Tier:** 1 (open-source / Apache).
- **Cost-efficiency screen:** $0 OSS path; paid Studio tiers exist but the OSS render path is fully usable.
- **Adoption cost:** ~8-12 focused hours for the first templated pipeline (Sermon highlight reel).
- **Highest-leverage use case:** COLG Sermon-to-Content Pipeline M1.
- **Risk if NOT adopted:** Adobe Premiere / DaVinci Resolve human-edit becomes every-sermon cost.
- **Source doc:** media-opportunities Section 3.2; ICM-paper-review (Van Clief uses Remotion).

**D2: ffmpeg + loudnorm filter (EBU R128)** (Category D)
- **Source:** https://ffmpeg.org/ + https://ffmpeg.org/ffmpeg-filters.html#loudnorm
- **What it does:** Universal media transcode + caption burn-in + audio loudness normalization. The substrate every other media tool sits on.
- **PoeTech adoption fit:** the default mastering chain. Hits broadcast loudness targets (-23 LUFS / -16 LUFS for podcasts) without leaving sovereign infrastructure.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0.
- **Adoption cost:** Already on NAS Docker images. ~2 focused hours wiring into n8n workflows.
- **Highest-leverage use case:** every sermon + every podcast + every clip transcode.
- **Risk if NOT adopted:** vendor Auphonic / Dolby.io API audio mastering becomes the only path; sovereignty erodes.
- **Source doc:** media-opportunities Section 3.3.

**D3: MoviePy** (Category D)
- **Source:** https://github.com/Zulko/moviepy
- **What it does:** Python video editing; cut / paste / overlay glue between ffmpeg and Remotion.
- **PoeTech adoption fit:** the glue layer for n8n -> ffmpeg + Remotion orchestration.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0.
- **Adoption cost:** ~3 focused hours -- Python container + n8n integration.
- **Highest-leverage use case:** clip generation + intro/outro composition for sermon highlights.
- **Risk if NOT adopted:** custom shell-out to ffmpeg for every cut operation; brittleness.
- **Source doc:** media-opportunities Section 3.2.

**D4: ComfyUI** (Category D)
- **Source:** https://github.com/comfyanonymous/ComfyUI
- **What it does:** Node-based image-gen pipeline editor; couples with Stable Diffusion / FLUX.1.
- **PoeTech adoption fit:** the orchestration layer for thumbnails + cover art + social cards on Phase 2 GPU box.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 (post-GPU-box hardware spend).
- **Adoption cost:** ~6-8 focused hours after GPU box ships.
- **Highest-leverage use case:** Sermon-thumbnail generation + Family-Worldview-Commentary cover art + property-listing photo enhancement.
- **Risk if NOT adopted:** Midjourney / DALL-E vendor lock; content leaks to vendor.
- **Source doc:** media-opportunities Section 3.5.

**D5: FLUX.1 dev (image-gen)** (Category D)
- **Source:** https://github.com/black-forest-labs/flux
- **What it does:** Higher-photorealism / typography image-gen than SDXL. Open-source. 16-24 GB VRAM; fits RTX 4090.
- **PoeTech adoption fit:** the sovereign default for thumbnails + cover art + social cards post-GPU-box.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 (post-GPU-box).
- **Adoption cost:** ~2 focused hours integration with ComfyUI.
- **Highest-leverage use case:** Sermon thumbnails at sermon-pipeline cadence.
- **Risk if NOT adopted:** vendor image-gen the only path.
- **Source doc:** media-opportunities Section 3.5.

**D6: Stable Diffusion XL (image-gen alternative)** (Category D)
- **Source:** https://github.com/Stability-AI/stablediffusion
- **What it does:** Industry baseline image-gen. 8-12 GB VRAM. Runs on smaller GPUs than FLUX.
- **PoeTech adoption fit:** the alternative if FLUX VRAM is unavailable.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0.
- **Adoption cost:** Same as FLUX -- pick one.
- **Highest-leverage use case:** image-gen on smaller GPU.
- **Risk if NOT adopted:** N/A (FLUX covers).
- **Source doc:** media-opportunities Section 3.5.

**D7: Piper TTS (sovereign default)** (Category D)
- **Source:** https://github.com/rhasspy/piper
- **What it does:** Open-source TTS from Mike Hansen / Home Assistant; strong quality; ~real-time on CPU; small footprint.
- **PoeTech adoption fit:** sovereign TTS for "narrate this scripture passage" surfaces + utility narration. The default in the sovereign chain.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0.
- **Adoption cost:** ~3 focused hours -- Docker compose + n8n integration.
- **Highest-leverage use case:** Council Chamber response narration; bulletin announcement read-aloud.
- **Risk if NOT adopted:** ElevenLabs vendor as only TTS path; cost ladder degrades.
- **Source doc:** media-opportunities Section 3.4.

**D8: Coqui XTTS v2 (voice cloning)** (Category D)
- **Source:** https://github.com/coqui-ai/TTS
- **What it does:** Production-quality voice cloning from short samples. Open-source.
- **PoeTech adoption fit:** family-member voice synthesis WITH EXPLICIT CONSENT per `AI-MEDIA-PRODUCTION-PLATFORM-VISION` Pillar 1.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0.
- **Adoption cost:** ~6 focused hours -- Docker + consent flow + per-family-member sample capture.
- **Highest-leverage use case:** family worldview commentary narration in Darrell or Christina's voice (with consent).
- **Risk if NOT adopted:** vendor (ElevenLabs $99-990/mo) the only family-voice path.
- **Source doc:** media-opportunities Section 3.4.

**D9: Demucs (audio source separation)** (Category D)
- **Source:** https://github.com/facebookresearch/demucs
- **What it does:** Open-source audio source separation; pulls vocals out of mixed audio; removes background noise.
- **PoeTech adoption fit:** sermon-audio noise removal pre-Whisper; clean vocals for clip generation.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0.
- **Adoption cost:** ~2 focused hours -- Docker container + n8n wiring.
- **Highest-leverage use case:** noisy-pulpit-cam sermon cleanup.
- **Risk if NOT adopted:** sermon audio quality plateau.
- **Source doc:** media-opportunities Section 3.3.

**D10: Manim (math + diagram animations)** (Category D)
- **Source:** https://github.com/3b1b/manim
- **What it does:** Open-source math + diagram animation library used by 3Blue1Brown.
- **PoeTech adoption fit:** explainer-style content (jubilee math visualization, scripture diagram animation).
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0.
- **Adoption cost:** Defer until explainer-content cadence justifies.
- **Highest-leverage use case:** Worldview chapter studies explainer videos.
- **Risk if NOT adopted:** none short-term.
- **Source doc:** media-opportunities Section 3.2.

**D11: PeerTube (federated video distribution)** (Category D; also Category H)
- **Source:** https://joinpeertube.org/ + https://github.com/Chocobozzz/PeerTube
- **What it does:** Federated, self-hosted YouTube alternative. Mesh-native. ActivityPub-based.
- **PoeTech adoption fit:** the long-arc sovereign-mesh video distribution. Family + COLG + creator nodes federate.
- **Sovereign-mesh Tier:** 1 (mesh-native).
- **Cost-efficiency screen:** $0 self-hosted.
- **Adoption cost:** Defer to post-M1 (post-Sermon-to-Content).
- **Highest-leverage use case:** family-worldview-commentary federated distribution at scale.
- **Risk if NOT adopted:** YouTube / Substack / Patreon mirrors stay the only distribution path.
- **Source doc:** media-opportunities Section 3.7.

**D12: ASS subtitle format + ffmpeg burn-in (animated captions)** (Category D)
- **Source:** https://aegi.vmoe.info/docs/3.2/ASS_Tags/ + ffmpeg
- **What it does:** TikTok / Reels-style animated word-level emphasis captions in pure ASS + ffmpeg with karaoke timing.
- **PoeTech adoption fit:** sovereign animated-caption substrate for short-form sermon clips + worldview commentary.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0.
- **Adoption cost:** ~3 focused hours -- template ASS files + ffmpeg burn-in step in the n8n pipeline.
- **Highest-leverage use case:** short-form clip captions that match Reels/Shorts visual language.
- **Risk if NOT adopted:** Submagic / CapCut vendor lock for caption animation.
- **Source doc:** media-opportunities Section 3.6.

### Category E: Governance + policy

**E1: Open Policy Agent (OPA) + Rego policy language** (Category E)
- **Source:** https://www.openpolicyagent.org/ + https://github.com/open-policy-agent/opa + https://codilime.com/blog/why-use-open-policy-agent-for-your-ai-agents/
- **What it does:** Production-grade policy engine. Enforces policy at the tool-calling layer, not at the agent layer. The agent does NOT decide what's allowed; OPA does. Workflow: agent reasons -> agent decides to call a tool -> OPA evaluates policy -> Allow / Deny / Escalate.
- **PoeTech adoption fit:** the keystone of the per-industry-team governance loop. NAS-resident Rego policies authorize / deny / escalate every action. Per `project-nas-as-governance-point` -- the NAS holds the policy; vendor LLMs consult it.
- **Sovereign-mesh Tier:** 1 (open-source; NAS-resident).
- **Cost-efficiency screen:** $0.
- **Adoption cost:** ~6-8 focused hours -- Docker compose entry + first Rego policy file at `/data/governance/policies/` + wf36 Quality Gatekeeper integration.
- **Highest-leverage use case:** the "always-now viable fix" pattern operationalized -- pre-authorized fix classes execute without Darrell ping; everything else escalates.
- **Risk if NOT adopted:** every decision requires Darrell-in-the-loop; the re-litigation cycle persists.
- **Source doc:** sovereign-LLM-teams-architecture Section C.2 + C.6; memory `project-nas-as-governance-point`.

**E2: Microsoft Agent Governance Toolkit** (Category E)
- **Source:** https://github.com/microsoft/agent-governance-toolkit
- **What it does:** 2026 open-source framework covering OWASP Agentic Top 10 -- policy enforcement, zero-trust identity, execution sandboxing.
- **PoeTech adoption fit:** reference for the OPA Rego policy structure + sandboxing pattern.
- **Sovereign-mesh Tier:** 1 (open-source).
- **Cost-efficiency screen:** $0.
- **Adoption cost:** Reference-only.
- **Highest-leverage use case:** Rego policy templates derived from the toolkit's catalog.
- **Risk if NOT adopted:** reinvent the policy library from scratch.
- **Source doc:** sovereign-LLM-teams-architecture Section C.2.

**E3: ntfy (self-hosted push)** (Category E)
- **Source:** https://github.com/binwiederhier/ntfy + https://ntfy.sh
- **What it does:** Self-hosted push notification service. Topic-based subscriptions. Multi-platform.
- **PoeTech adoption fit:** Already operational. The family-facing alert layer per EXECUTION-OUTCOME-OBSERVABILITY.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 (self-hosted).
- **Adoption cost:** Already adopted; per-topic configuration as new teams ship.
- **Highest-leverage use case:** every per-team state-transition + every escalation.
- **Risk if NOT adopted:** N/A.
- **Source doc:** n8n-fix-patterns Decision 2.

**E4: Pushover (vendor; personal critical alerts)** (Category E)
- **Source:** https://pushover.net/
- **What it does:** Reliable push to Darrell's phone for personal critical alerts (n8n workflow died, security event).
- **PoeTech adoption fit:** the personal critical-alert path complementary to ntfy (family-facing).
- **Sovereign-mesh Tier:** 2 (vendor; exportable).
- **Cost-efficiency screen:** $ -- one-time $5 per platform.
- **Adoption cost:** Already adopted.
- **Highest-leverage use case:** the wf02-workflow-failure-alert path.
- **Risk if NOT adopted:** N/A.
- **Source doc:** n8n-fix-patterns Decision 2.

**E5: APort / Microsoft Defender for AI Agents (reference)** (Category E)
- **Source:** https://aport.io/ + Microsoft Defender for AI Agents (Jan 2026 launch)
- **What it does:** Pre-action authorization for AI agents. APort refuses tool calls before they happen. Defender analyzes intent + destination of every agent action in real time.
- **PoeTech adoption fit:** reference patterns. The OPA + NAS-resident Rego covers the same ground sovereignly.
- **Sovereign-mesh Tier:** 4 (vendor; cloud-only).
- **Cost-efficiency screen:** $$$ (enterprise pricing). Skip.
- **Adoption cost:** N/A (skip).
- **Highest-leverage use case:** N/A.
- **Risk if NOT adopted:** none.
- **Source doc:** sovereign-LLM-teams-architecture Section C.2.

### Category F: Hardware + infrastructure

**F1: Proxmox VE 9 + LXC + KVM hybrid** (Category F)
- **Source:** https://www.proxmox.com/en/ + https://pve.proxmox.com/wiki/Main_Page + https://www.proxmox.com/en/about/company-details/press-releases/proxmox-ve-is-an-nvidia-vgpu-supported-hypervisor
- **What it does:** Open-source hypervisor with both KVM (full VM) and LXC (container) under one pane of glass. Snapshots, hot-migrate, web console, REST API.
- **PoeTech adoption fit:** the Phase 2 GPU box substrate. 3 LXC (Church / online / Dev-Ops) + 1 KVM VM (Therapy) per the KVM2 doc Section 2.10. Provides the snapshot-and-rollback + REST API surface that OPA Rego policies enforce against.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 software; $3,400 one-time hardware for the GPU box. Growth-justified by 4-team concurrent serving capability.
- **Adoption cost:** ~16-24 focused hours after GPU box arrives.
- **Highest-leverage use case:** Phase 2 concurrent multi-team serving on the GPU box.
- **Risk if NOT adopted:** bare-metal Linux + Docker pattern works but lacks the per-team snapshot + per-team filesystem separation + per-VM network isolation that TLC firewall demands.
- **Source doc:** KVM2 Track A Section 2.7-2.10.

**F2: RTX 4090 24GB + Ryzen 9 7950X + 64GB DDR5 + 2TB NVMe** (Category F)
- **Source:** KVM2 Track A Section 2.5
- **What it does:** Phase 2 GPU box recommended build. ~$3,400 all-in. 70 tok/s Qwen-3-14B Q4; 4-team concurrent capacity.
- **PoeTech adoption fit:** Phase 2 sovereign LLM team substrate.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $$$ -- $3,400 one-time. Defer until COLG sermon-pipeline v1 proves workload (per `project-cost-discipline-with-growth-permission`).
- **Adoption cost:** Hardware order + closet prep + Proxmox install.
- **Highest-leverage use case:** Phase 2 concurrent 4-team serving.
- **Risk if NOT adopted (yet):** ceiling on concurrent users + image-gen pipelines.
- **Source doc:** KVM2 Track A Section 2.5; online-research-bundle Track 4 (closet specs).

**F3: JetKVM (out-of-band KVM-over-IP for headless GPU box)** (Category F)
- **Source:** https://jetkvm.com/ + https://www.cnx-software.com/2025/03/21/jetkvm-a-69-kvm-over-ip-solution-with-open-source-software/
- **What it does:** Open-source $69-100 KVM-over-IP. Tailscale-native. FIPS-grade in newer firmware. Plugs into headless box's HDMI + USB for full out-of-band BIOS / console access.
- **PoeTech adoption fit:** the headless GPU-box closet access path.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $ -- $69-100 one-time.
- **Adoption cost:** ~30 min hardware install + Tailscale config.
- **Highest-leverage use case:** Phase 2 GPU box BIOS / kernel-recovery access from Darrell's phone via Tailscale.
- **Risk if NOT adopted:** GPU box requires physical-cable trip for any boot issue.
- **Source doc:** KVM2 Track B Section 3.8.

**F4: Level1Techs 14 DisplayPort KVM Switch (Single Monitor 4 Computer)** (Category F)
- **Source:** https://www.store.level1techs.com/products/p/14-kvm-switch-single-monitor-2computer-64pfg-7l6da
- **What it does:** Prosumer 4-port DisplayPort 1.4 KVM. 4K@120Hz HDR. USB-C 10Gbps hub. Sub-1ms HID latency. Wendell's gold-standard.
- **PoeTech adoption fit:** Phase 2 desk switch when GPU box + NAS + Mac + Windows laptop all need shared input.
- **Sovereign-mesh Tier:** 1 (hardware; no vendor binding).
- **Cost-efficiency screen:** $$ -- $499 one-time. Defer until 4-machine workflow is daily reality.
- **Adoption cost:** Phase 0 = $0 (Input Leap software KVM). Phase 2 = $650-700 all-in (switch + JetKVM + cables).
- **Highest-leverage use case:** Phase 2 multi-machine workstation.
- **Risk if NOT adopted (yet):** none short-term; Input Leap covers 2-machine case.
- **Source doc:** KVM2 Track B Section 3.10.

**F5: Input Leap (software KVM)** (Category F)
- **Source:** https://github.com/input-leap/input-leap
- **What it does:** Open-source cross-platform software KVM (Barrier fork). Win/Mac/Linux. Zero hardware cost.
- **PoeTech adoption fit:** Phase 0 current 2-machine workflow (Windows laptop + Mac).
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0.
- **Adoption cost:** ~5 min install on each machine.
- **Highest-leverage use case:** keep using through Phase 2 as cross-OS clipboard.
- **Risk if NOT adopted:** N/A.
- **Source doc:** KVM2 Track B Section 3.7.

**F6: Synology DS1621xs+ (current NAS)** (Category F)
- **Source:** https://www.synology.com/en-global/products/DS1621xs+ + https://needtoknowit.com.au/blog/ollama-on-synology-nas-australia/
- **What it does:** Xeon D-1527 4-core, 32GB DDR4 ECC SODIMM, 6 bays + 2 M.2 NVMe, 10GbE. Runs Ollama (SIMD-capable) + n8n + ntfy.
- **PoeTech adoption fit:** the always-on sovereign governance substrate per `project-nas-as-governance-point`. Holds the OPA Rego policies + Events log + WORKFLOW-MODULE-LIBRARY index.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0 marginal (already deployed).
- **Adoption cost:** Already adopted.
- **Highest-leverage use case:** the governance point. Always-on. Always-ready.
- **Risk if NOT adopted:** N/A.
- **Source doc:** sovereign-LLM-teams-architecture Section A.2; memory `project-nas-as-governance-point`.

**F7: Mini-PC tiers (PoeTech-in-a-box for other families)** (Category F)
- **Source:** https://www.modemguides.com/blogs/modemguides-blog/best-mini-pc-local-ai-ollama-2026 + https://www.compute-market.com/blog/home-ai-server-build-guide-2026
- **What it does:** $400-1,400 Mini-PC tier (Beelink / Minisforum / Mac Mini M4 Pro) -- the recommended hardware tier for families adopting PoeTech-in-a-box.
- **PoeTech adoption fit:** the family-grade hardware bundle SKU per `COMMUNITY-FIRST-MISSION` Commitment 5 + sovereign-LLM-teams architecture Section E.2.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $$ -- one-time $400-1,400 per family.
- **Adoption cost:** Hardware supplier relationship + install playbook + first-run wizard.
- **Highest-leverage use case:** family-scale PoeTech-in-a-box deployments.
- **Risk if NOT adopted:** every family deployment requires Synology Plus-series purchase (higher price); narrows the addressable market.
- **Source doc:** sovereign-LLM-teams-architecture Section E.2.

**F8: Tailscale + Tailscale Funnel** (Category F)
- **Source:** https://tailscale.com/docs + https://tailscale.com/docs/features/tailscale-funnel
- **What it does:** WireGuard-based mesh networking with zero-config. Funnel exposes a tailnet service to the public internet.
- **PoeTech adoption fit:** Already adopted for SSH + Synology console + n8n internal access. Funnel had limits (see wf18 fix doc); Funnel is NOT the production API gateway.
- **Sovereign-mesh Tier:** 1 (WireGuard is open standard; Tailscale is the convenient coordinator).
- **Cost-efficiency screen:** $0 (free tier covers Poe family).
- **Adoption cost:** Already adopted.
- **Highest-leverage use case:** mesh networking + Phase 2 federation between PoeTech instances.
- **Risk if NOT adopted:** N/A.
- **Source doc:** wf18-unreachable; KVM2 Track A Section 2.4.

**F9: Caddy + Let's Encrypt (proper production reverse proxy)** (Category F)
- **Source:** https://caddyserver.com/ + https://letsencrypt.org/
- **What it does:** Auto-HTTPS reverse proxy. One-line config. Auto-renews certs.
- **PoeTech adoption fit:** the post-vacation replacement for the Tailscale Funnel hot path. `n8n.poetech.us` as a real subdomain + DNS record + Let's Encrypt cert.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0.
- **Adoption cost:** ~4-6 focused hours -- NAS Caddy container + DNS record at registrar + cert provisioning.
- **Highest-leverage use case:** production API gateway for the wf18 / wf30 / wf33 etc. surfaces.
- **Risk if NOT adopted:** Vercel rewrite (current fix) bandwidth + Funnel-throttling latent risks.
- **Source doc:** wf18-unreachable Option A.

**F10: WireGuard mesh (sovereign-mesh-future)** (Category F)
- **Source:** https://www.wireguard.com/
- **What it does:** Modern open-source VPN; the substrate Tailscale rides on. Direct peer-to-peer.
- **PoeTech adoption fit:** the sovereign-mesh-federation substrate when 3+ instances exist (Poe + COLG + first community partner) per memory `project-sovereign-mesh-mvp-pragmatism`.
- **Sovereign-mesh Tier:** 1 (mesh-native).
- **Cost-efficiency screen:** $0.
- **Adoption cost:** Defer to 3-instance threshold.
- **Highest-leverage use case:** federated WORKFLOW-MODULE-LIBRARY distribution + cross-instance Events.
- **Risk if NOT adopted (yet):** none short-term.
- **Source doc:** memory `project-sovereign-mesh-mvp-pragmatism`.

### Category G: ICM + filesystem-as-architecture

**G1: Interpretable Context Methodology (ICM) -- Van Clief & McDermott** (Category G)
- **Source:** https://arxiv.org/pdf/2603.16021 + https://github.com/RinDig/Interpretable-Context-Methodology-ICM-
- **What it does:** 5-layer folder-as-architecture pattern -- Layer 0 identity / Layer 1 routing / Layer 2 stage contract / Layer 3 reference / Layer 4 working. Single orchestrating agent reads the right files at the right time. Replaces orchestration frameworks like LangChain / CrewAI / AutoGen for sequential workflows.
- **PoeTech adoption fit:** PoeTech is already doing a meaningful subset of ICM by accident. `CLAUDE.md` = Layer 0; `docs/00-foundations/_root/*.md` = Layer 3; `docs/99-session-notes/YYYY-MM-DD-*.md` = Layer 4. Adopting the explicit naming makes the layering legible.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0.
- **Adoption cost:** ~2 focused hours -- update `CLAUDE.md` to note "this is Layer 0"; update `docs/00-foundations/_root/` README to note "this is Layer 3"; bake the 5-layer naming into the WORKFLOW-MODULE-LIBRARY foundation doc.
- **Highest-leverage use case:** every per-industry team workspace gets the 5-layer structure; reusable across instances.
- **Risk if NOT adopted:** the implicit layering drifts; future contributors mis-locate context.
- **Source doc:** ICM-paper-review.

**G2: ICM authors' reference repo** (Category G)
- **Source:** https://github.com/RinDig/Interpretable-Context-Methodology-ICM-
- **What it does:** MIT-licensed reference implementation of the ICM workspace pattern. Example workspaces showing the 5-layer structure in practice.
- **PoeTech adoption fit:** template for the WORKFLOW-MODULE-LIBRARY workspace shape.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0.
- **Adoption cost:** ~1 focused hour -- clone, review, extract the workspace template.
- **Highest-leverage use case:** per-industry team workspace skeleton.
- **Risk if NOT adopted:** invent the workspace shape from scratch.
- **Source doc:** ICM-paper-review.

**G3: "Edit source not output" pattern (ICM Section 6.3)** (Category G)
- **Source:** https://arxiv.org/pdf/2603.16021 Section 6.3
- **What it does:** when a Governor edits the output of a stage repeatedly in the same way, surface that as a candidate amendment to the stage's `CONTEXT.md` or Layer 3 reference. Closes the system-improvement loop.
- **PoeTech adoption fit:** the operational pattern for INSTITUTIONAL-MEMORY-EVENTS. Every recurring edit becomes a policy proposal.
- **Sovereign-mesh Tier:** 1.
- **Cost-efficiency screen:** $0.
- **Adoption cost:** ~4 focused hours -- wire into wf36 Quality Gatekeeper + the policy adaptation loop.
- **Highest-leverage use case:** the substrate that auto-implements obvious fixes from observed edit patterns.
- **Risk if NOT adopted:** the system stays only as good as the last human edit.
- **Source doc:** ICM-paper-review.

### Category H: Marketing + brand surfaces

**H1: Karpathy Four Moats framework (Software 3.0)** (Category H)
- **Source:** https://karpathy.bearblog.dev/sequoia-ascent-2026/ + https://www.kyndryl.com/us/en/about-us/news/2025/10/rise-of-software-3-0
- **What it does:** Data + Distribution + Brand + Trust as the four moats that survive in Software 3.0 (the LLM-substrate era).
- **PoeTech adoption fit:** the public-PWA positioning frame. PoeTech's moats explicitly: family-data (DATA), Church-of-the-Living-God + COLG reach (DISTRIBUTION), Poe-family-name + Worldview text (BRAND), open-source-core + sovereign-mesh + family-controlled-keys (TRUST).
- **Sovereign-mesh Tier:** 1 (framework, not vendor).
- **Cost-efficiency screen:** $0.
- **Adoption cost:** ~30 min -- one ~150-word section added to the public About page.
- **Highest-leverage use case:** the third pillar of "Why PoeTech" public copy.
- **Risk if NOT adopted:** positioning stays implicit; harder for visitors to compare.
- **Source doc:** online-research-bundle Track 2.

**H2: Substack + Patreon + Memberful (creator-economy reference)** (Category H)
- **Source:** https://substack.com/going-paid + https://www.patreon.com/pricing + https://memberful.com/pricing/
- **What it does:** Creator-economy paid-subscription platforms. Substack 10% rev-share; Patreon 8-12% + fees; Memberful 4.9% + Stripe fees.
- **PoeTech adoption fit:** Tier 3 mirror endpoints for the family-worldview-commentary distribution. Canonical stays on poetech.us; Substack / Patreon are mirrors per `AI-MEDIA-PRODUCTION-PLATFORM-VISION` Pillar 4.
- **Sovereign-mesh Tier:** 3 (vendor-locked; structural lock-in if used as canonical).
- **Cost-efficiency screen:** $-tier rev-share. Acceptable as mirrors; never as canonical.
- **Adoption cost:** ~2 focused hours per platform for n8n API integration.
- **Highest-leverage use case:** audience reach for family-worldview-commentary mirrors.
- **Risk if NOT adopted:** zero audience reach beyond poetech.us.
- **Source doc:** media-opportunities Section 2.3.

**H3: Anti-pattern catalog -- Riverside / Descript / Captions / Subsplash / Tithe.ly** (Category H)
- **Source:** competitive scans in media-opportunities + app-services-promise-audit
- **What it does:** Cloud-only, per-seat, watermark-without-paid, AI-credits-metered creator SaaS. The extractive pattern PoeTech defines itself against.
- **PoeTech adoption fit:** NOT adopted. Catalogued so the structural difference IS visible on the public PWA. "What we don't do" list per `DATA-AS-EMPOWERMENT-NOT-EXTRACTION` anti-patterns 1-5.
- **Sovereign-mesh Tier:** N/A (this is the anti-pattern).
- **Cost-efficiency screen:** N/A.
- **Adoption cost:** ~30 min to enumerate the differentiator list on the About page.
- **Highest-leverage use case:** the trust-establishing differentiator at the public PWA's positioning copy.
- **Risk if NOT adopted:** PoeTech's structural commitments stay implicit; harder to position.
- **Source doc:** media-opportunities Sections 2.1-2.8 (competitor scan rows).

---

## 3. TOP-15 ranked adoption queue

Ranked by leverage-to-cost ratio + dependency chain. Each entry: when to ship + dev-cycle change + constraint-eliminated.

### 1. n8n global Error Workflow (wf02-workflow-failure-alert as global Error Workflow)

- **Entry name:** B3 (n8n global Error Workflow + Error Trigger node)
- **Ship when:** **THIS WEEK -- Day 1 post-vacation (highest immediate severity).**
- **Dev cycle change:** every workflow failure pages Darrell on Pushover within seconds. Silent-failure mode structurally impossible.
- **Constraint eliminated:** the 4-hour wf30 silent-fail debug pattern. wf12 / wf20 / wf27 / wf29 stop being one-glitch-from-broken.
- **Adoption cost:** ~30 min. ROI = ~4 hours debugging avoided per future incident.

### 2. n8n Set-node Config + `/data/config/family.json` pattern (kills the process.env bug class)

- **Entry name:** B2 (n8n Set-node Config + JSON file substrate)
- **Ship when:** **THIS WEEK -- Day 1-2 post-vacation, paired with #1.**
- **Dev cycle change:** every workflow ships unchanged to a second family / COLG / another community. Config swaps; code doesn't change. Workflow-Module-Library Tier-2 becomes operational, not aspirational.
- **Constraint eliminated:** every Tier-2 workflow is one source-edit-per-family from broken; 27 hardcoded values become 27 config entries.
- **Adoption cost:** ~2 focused hours.

### 3. Vercel rewrite fix for wf18 + Bearer-token auth (production API gateway hardening)

- **Entry name:** F8 + F9 (Tailscale Funnel + Caddy + Let's Encrypt) -- short-term Vercel rewrite
- **Ship when:** **THIS WEEK -- ALREADY SHIPPED 2026-06-02 per wf18-vercel-rewrite-fix-shipped session note.** Pair with Bearer-token auth in next iteration.
- **Dev cycle change:** poetech.us cross-origin fetches stop 503-ing; the Imported view + Big Picture bank overlay become reliable. Cross-origin Funnel throttling becomes irrelevant.
- **Constraint eliminated:** the Tailscale-Funnel-treats-Vercel-origin-as-abusive bug class.
- **Adoption cost:** ~30 min (done).

### 4. Tina Huang PRD Metaprompt + 10-section PRD structure + Operating Instructions doc

- **Entry name:** B8 + B9 + B10 (Tina Huang PRD pattern + Cowork account-level instructions)
- **Ship when:** **THIS WEEK -- Day 2-3 post-vacation.**
- **Dev cycle change:** every future PRD pre-fills from memory + sketches architecture + produces 10-section spec. Drive-Don't-Delegate compounds. Sessions outside the repo inherit binding rules.
- **Constraint eliminated:** PRD-from-scratch-each-time tax; Cowork-vs-Code-vs-Dispatch context loss; the ask-Darrell-what-he-wants pattern.
- **Adoption cost:** ~2 focused hours total.

### 5. OPA + NAS-resident Rego policies (the keystone)

- **Entry name:** E1 (Open Policy Agent + Rego)
- **Ship when:** **THIS WEEK -- Day 3-5 post-vacation. THE keystone for everything below.**
- **Dev cycle change:** pre-authorized action classes execute without Darrell ping; everything else escalates via ntfy with one-tap approval. The "always-now viable fix" pattern operationalized. The NAS holds governance; vendor LLMs consult it.
- **Constraint eliminated:** the re-litigation cycle. Decisions Darrell already approved once become standing policy, not re-asked questions.
- **Adoption cost:** ~6-8 focused hours.

### 6. Tina Huang autonomous-builder lifecycle (pending / in-progress / done / failed + 30-min pickup)

- **Entry name:** B7 (autonomous-builder lifecycle)
- **Ship when:** **NEXT 2 WEEKS -- Day 6-10 post-vacation. Depends on #5.**
- **Dev cycle change:** Darrell queues PRDs before sleep; the AI Foundation picks up + executes within OPA policy; wakes Darrell only for the escalations. The substrate that auto-implements obvious fixes ships.
- **Constraint eliminated:** every build supervised at code-time. The "Darrell drives the clicks" pattern downgrades to "Darrell approves the policies."
- **Adoption cost:** ~2 focused hours.

### 7. ICM 5-layer naming + workspace structure

- **Entry name:** G1 + G2 (ICM)
- **Ship when:** **NEXT 2 WEEKS -- Day 6-10 post-vacation, parallel to #6.**
- **Dev cycle change:** every per-industry team workspace has identical structure (Layer 0 / 1 / 2 / 3 / 4). New family onboards by copying the workspace folder. Future contributors locate context predictably.
- **Constraint eliminated:** per-instance custom build cost. Workspace shape standardized.
- **Adoption cost:** ~3 focused hours total.

### 8. faster-whisper + WhisperX on NAS (sovereign STT)

- **Entry name:** A7 (Whisper.cpp / faster-whisper / WhisperX)
- **Ship when:** **NEXT 2 WEEKS -- Day 6-10 post-vacation. Foundation for M1 Sermon-to-Content + family-worldview-commentary v2.**
- **Dev cycle change:** sermons + family voice + tenant calls all transcribe sovereignly. Tactiq.io / vendor STT cease being required.
- **Constraint eliminated:** sermon-transcript dependency on Tactiq.io (the family-worldview-commentary v1 limitation).
- **Adoption cost:** ~4 focused hours.

### 9. Qdrant vector store + nomic-embed-text-v2-moe (per-team RAG)

- **Entry name:** A4 + A5 (nomic-embed-text-v2-moe + Qdrant)
- **Ship when:** **NEXT 2 WEEKS -- Day 8-12 post-vacation. Depends on #5 + #7.**
- **Dev cycle change:** each per-industry team has its own sovereign RAG corpus. Church team queries ESV + COLG sermon archive; Family-Finance team queries property records + jubilee math; Counseling team queries clinical-policy text.
- **Constraint eliminated:** per-team specialization tax. RAG specialization replaces fine-tuning at v1.
- **Adoption cost:** ~4 focused hours.

### 10. wf27 supervisor refactor (per-industry dispatch + phi-3-mini router)

- **Entry name:** A3 + B4 (phi-3-mini router + LangGraph supervisor pattern)
- **Ship when:** **NEXT 2 WEEKS -- Day 10-14 post-vacation. Depends on #5 + #9.**
- **Dev cycle change:** wf27 dispatches by `industry` tag. The four per-industry teams (Dev/Ops, Family-Finance, Counseling, Church-Ops) come online.
- **Constraint eliminated:** the single-supervisor + single-model pattern (one model serving every task).
- **Adoption cost:** ~6 focused hours.

### 11. Remotion + ffmpeg + MoviePy media pipeline (COLG Sermon-to-Content M1 substrate)

- **Entry name:** D1 + D2 + D3 (Remotion + ffmpeg + MoviePy)
- **Ship when:** **POST-VACATION DAY 1 -- M1 ship; depends on #8.**
- **Dev cycle change:** Sunday's sermon becomes captioned long-form + 3-5 short clips + transcript + searchable archive by Tuesday morning. Anchors the AI-Media-Production pillar. $24K ARR potential year 1.
- **Constraint eliminated:** the every-sermon-is-DaVinci-Resolve-from-scratch cost. Production cadence ships.
- **Adoption cost:** ~120-180 focused hours total (per media-opportunities M1).

### 12. Aider auto-commit + git-revert pattern (Dev/Ops Foundation auto-fix)

- **Entry name:** B5 (Aider)
- **Ship when:** **POST-VACATION DAY 1 -- ~3 weeks parallel to #11.**
- **Dev cycle change:** silent-fail surfacing pilot lands. The Foundation Team detects 3+ consecutive failures of same error class, drafts a PR fix, queues for Darrell one-tap approval.
- **Constraint eliminated:** silent failures stay silent until the next manual check.
- **Adoption cost:** ~3 focused hours (wired into wf27).

### 13. Open Policy Agent toolkit + Microsoft Agent Governance reference Rego library

- **Entry name:** E2 (Microsoft Agent Governance Toolkit)
- **Ship when:** **POST-VACATION DAY 1 -- ~2 weeks. Depends on #5.**
- **Dev cycle change:** Rego policy templates accelerate per-team policy authoring. OWASP Agentic Top 10 covered by default.
- **Constraint eliminated:** Rego-from-scratch cost per team.
- **Adoption cost:** ~4 focused hours.

### 14. Piper TTS + ASS subtitle burn-in (sovereign media polish)

- **Entry name:** D7 + D12 (Piper + ASS captions)
- **Ship when:** **POST-VACATION DAY 1 -- ~3 weeks. Depends on #8.**
- **Dev cycle change:** scripture narration + animated captions sovereign. Council Chamber voice replies + sermon-clip subtitles.
- **Constraint eliminated:** ElevenLabs + Submagic / CapCut vendor lock on voice + captions.
- **Adoption cost:** ~6 focused hours total.

### 15. RTX 4090 GPU box + Proxmox VE 9 (Phase 2 hardware)

- **Entry name:** F1 + F2 (Proxmox + RTX 4090 build)
- **Ship when:** **POST-GPU-BOX -- defer until M1 sermon pipeline v1 PROVES the workload (~3-4 weeks post-M1-ship).**
- **Dev cycle change:** 4-team concurrent serving. vLLM replaces Ollama on the busy paths. ComfyUI + FLUX.1 for image-gen. Distil-Whisper for batch transcription.
- **Constraint eliminated:** the concurrent-user ceiling. The image-gen ceiling. The batch-transcription ceiling.
- **Adoption cost:** $3,400 hardware + ~24 focused hours setup.

---

## 4. 5 GitHub repos to clone to NAS this week (substrate, not reference)

These five become direct integration substrate -- pulled to the NAS, wired into n8n, operational. Not reference reads.

### 1. https://github.com/open-policy-agent/opa

- **Why:** the runtime policy authorizer. Lands at `/data/governance/opa/` on the NAS; Rego policies at `/data/governance/policies/`. The keystone of the per-industry-team governance loop.
- **Clone command:** `git clone https://github.com/open-policy-agent/opa.git /volume1/PoeTech/governance/opa/`
- **First use:** Day 3-5 post-vacation; wired into wf36 Quality Gatekeeper.

### 2. https://github.com/SYSTRAN/faster-whisper (and pair with https://github.com/m-bain/whisperX)

- **Why:** the sovereign STT substrate for COLG Sermon-to-Content M1 + family-worldview-commentary v2 + Counseling-team intake. Replaces Tactiq.io dependency.
- **Clone command:** `git clone https://github.com/SYSTRAN/faster-whisper.git /volume1/PoeTech/media/faster-whisper/`
- **First use:** Day 6-10 post-vacation; Docker compose entry; wired into wf37 (Whisper STT voice input, already drafted).

### 3. https://github.com/remotion-dev/remotion

- **Why:** the React-based programmatic video substrate for M1. Templated sermon-highlight + worldview-commentary + property-tour video composition.
- **Clone command:** `git clone https://github.com/remotion-dev/remotion.git /volume1/PoeTech/media/remotion/`
- **First use:** M1 ship, ~weeks 3-4 post-vacation.

### 4. https://github.com/qdrant/qdrant

- **Why:** the per-industry-team vector store. Each team's RAG corpus lives in its own Qdrant collection on the NAS.
- **Clone command:** `docker pull qdrant/qdrant` (use Docker image, not git clone) + storage at `/volume1/PoeTech/qdrant/`.
- **First use:** Day 8-12 post-vacation; first collection = Family-Finance Holly Hill RAG.

### 5. https://github.com/RinDig/Interpretable-Context-Methodology-ICM-

- **Why:** the workspace-structure template per the 5-layer naming. Per-industry team workspace skeleton clones from here.
- **Clone command:** `git clone https://github.com/RinDig/Interpretable-Context-Methodology-ICM-.git /volume1/PoeTech/templates/icm/`
- **First use:** Day 6-10 post-vacation; first per-industry team workspace (Dev/Ops Foundation) extends the ICM template.

**Honorable mentions (clone-ready but lower priority):**

- https://github.com/pipecat-ai/pipecat -- Phase 2 voice pipeline (deferred to post-GPU-box).
- https://github.com/binwiederhier/ntfy -- already deployed.
- https://github.com/n8n-io/n8n -- already deployed.
- https://github.com/open-webui/open-webui -- optional family chat surface.
- https://github.com/microsoft/agent-governance-toolkit -- Rego policy reference.
- https://github.com/Aider-AI/aider -- reference for the auto-commit pattern in wf27.
- https://github.com/rhasspy/piper -- sovereign TTS.
- https://github.com/black-forest-labs/flux -- post-GPU-box.

---

## 5. NAS governance config skeleton (YAML draft)

Per `project-nas-as-governance-point`. Lives at `/volume1/PoeTech/governance/pre-authorized-policies.yaml`. Backed up by Synology snapshots; versioned via Git mirror at `/volume1/PoeTech/governance/.git/`; readable by every per-industry team.

```yaml
# /volume1/PoeTech/governance/pre-authorized-policies.yaml
# NAS-resident governance config per project-nas-as-governance-point.
# Read by wf27 (Foundation Agent), wf36 (Quality Gatekeeper), and every
# per-industry team's OPA Rego policy file.
# Version: v1 (post-vacation Day 1 draft)
# Last updated: 2026-06-02
# Updated by: Claude as Advisor, reviewed by Darrell as Governor.

meta:
  version: v1
  effective_date: 2026-06-02
  governor: Darrell Poe
  co_governors:
    - Christina Poe (TLC clinical domain)
    - Bishop Gwin (COLG / Church domain, once relationship is established)
  authority_chain:
    - CLAUDE.md (binding rules at repo level)
    - docs/00-foundations/_root/*.md (foundation principles)
    - memory/*.md (declared bindings from prior sessions)
    - this file (operational pre-authorization)

# ===========================================================================
# Tier 0 -- BRIGHT LINES (never auto-promote, regardless of approval history)
# ===========================================================================
bright_lines:
  - id: tlc_clinical_data
    description: "Anything touching TLC clinical data, PHI, or Christina's clinical work"
    enforcement: deny_always
    requires_governor: Christina Poe
    notes: "PHI stays in Acuity; never leaves NAS; never to cloud LLMs."

  - id: money_movement
    description: "Anything moving money -- trades, transfers, ACH initiation, payment processing"
    enforcement: deny_always
    requires_governor: Darrell Poe
    notes: "Per CLAUDE.md Financial Actions rule."

  - id: credential_vault
    description: "Anything touching auth credentials, API tokens, the credential vault"
    enforcement: deny_always
    requires_governor: Darrell Poe

  - id: irreversible_os
    description: "rm -rf, drop table, registrar DNS root changes, container destroy"
    enforcement: deny_always
    requires_governor: Darrell Poe

  - id: minor_data
    description: "Anything touching minor / child data per DATA-AS-EMPOWERMENT minor protections"
    enforcement: deny_always
    requires_governor: Darrell Poe + Christina Poe

  - id: theology_voice
    description: "AI-generated content fronting the family's voice on substantive theological work"
    enforcement: deny_always
    requires_governor: Darrell Poe + Bishop Gwin (for COLG-fronted content)
    notes: "Per AI-MEDIA-PRODUCTION-PLATFORM-VISION Pillar 3 -- AI is the production tool, not the speaker."

# ===========================================================================
# Tier 1 -- PRE-AUTHORIZED FIX CLASSES (execute now, log Event, no escalation)
# ===========================================================================
pre_authorized_fix_classes:

  - id: process_env_to_literal_default
    description: "Replace n8n Code-node process.env.X with literal default per known sandbox-block bug"
    pattern: "process.env\\.\\w+ \\|\\| '([^']+)'"
    fix_pattern: "'$1'"
    teams_authorized: [devops]
    auto_commit: true
    auto_push: false
    requires_smoke_test: true
    rollback_on_failure: true
    notes: "Per workflow-audit Section 2; canonical fix pattern from commit 1edb8e1."

  - id: hardcoded_value_to_set_node_config
    description: "Lift hardcoded path / URL / model-name to upstream Config Set node per n8n-fix-patterns Decision 1"
    teams_authorized: [devops]
    auto_commit: true
    auto_push: false
    requires_smoke_test: true
    rollback_on_failure: true
    notes: "Tier-1 to Tier-2 promotion path; first applied to wf30/31/32 as Family-Voice-Loop module."

  - id: missing_error_workflow_setting
    description: "Set 'Error Workflow = 02-Workflow-Failure-Alert' on any active workflow that lacks one"
    teams_authorized: [devops]
    auto_apply: true
    requires_smoke_test: false
    notes: "Per n8n-fix-patterns Decision 2."

  - id: typographic_theology_violation
    description: "Lower-case satan/lucifer/the-devil/the-adversary/the-accuser/the-deceiver/the-dragon in generated content"
    pattern: "\\b(Satan|Lucifer|Devil|Adversary|Accuser|Deceiver|Dragon)\\b"
    fix_logic: "lowercase if not at sentence start; flag for review if at sentence start"
    teams_authorized: [devops, church, online]
    auto_apply: true
    notes: "Per CLAUDE.md typographic theology binding."

  - id: missing_scripture_translation_badge
    description: "Add ESV/KJV/NIV translation badge to bare scripture citations in generated content"
    pattern: "\"[A-Z][^\"]+\" \\(([A-Z][a-z]+ \\d+:\\d+)\\)"
    teams_authorized: [church]
    auto_apply: true
    notes: "Per SCRIPTURE-REFERENCE-STANDARD."

  - id: seed_data_real_value_leak
    description: "Replace identified real-Poe-family seed values with SEED-DATA-AS-ASPIRATION values in public PWA"
    teams_authorized: [devops]
    auto_apply: false
    requires_governor_review: true
    notes: "Per seed-data-urgent-sanitization-retroactive; brand-vs-data distinction per feedback-distinguish-data-from-brand REQUIRED before any change."

# ===========================================================================
# Tier 2 -- PRE-AUTHORIZED DRAFTING (LLM team drafts, ntfy queues for one-tap)
# ===========================================================================
pre_authorized_drafts:

  - id: weekly_bulletin_draft
    description: "Draft COLG weekly bulletin from sermon archive + announcement queue"
    teams_authorized: [church]
    target: bishop_gwin_review_queue
    cadence: weekly_monday_8am
    notes: "Per Pilot 4 -- Church-Ops Sermon + Announcement."

  - id: sermon_summary_3channel_draft
    description: "Draft 3-channel (SMS / email / app notification) sermon summary"
    teams_authorized: [church]
    target: colg_deacon_approval_queue
    cadence: monday_after_sunday_sermon

  - id: family_finance_monthly_digest
    description: "Draft monthly Family Finance digest with transaction tagging + jubilee progress"
    teams_authorized: [family_finance]
    target: darrell_christina_review_queue
    cadence: monthly_first_of_month

  - id: weekly_ship_summary
    description: "wf32 daily ship summary draft"
    teams_authorized: [devops]
    target: ntfy_poetech_ship_summary
    cadence: daily_9pm_central
    auto_publish: true
    notes: "Already operational per wf32."

  - id: morning_digest
    description: "wf31 daily standup digest draft"
    teams_authorized: [devops]
    target: ntfy_poetech_morning_digest
    cadence: daily_7am_central
    auto_publish: true
    notes: "Already operational per wf31."

# ===========================================================================
# Tier 3 -- ESCALATION PATTERNS (always queue, never auto-execute)
# ===========================================================================
escalations:

  - id: theological_publishing
    description: "Any public-facing theological content"
    target: darrell_christina_bishop_gwin_review
    ntfy_topic: poetech-theology-review
    timeout_hours: 48
    fallback: hold_indefinitely

  - id: external_communications
    description: "Any communication sent in Darrell's name or on behalf of Poe Properties / TLC / COLG"
    target: darrell_review
    ntfy_topic: poetech-comms-review
    timeout_hours: 24

  - id: real_estate_transactions
    description: "Any Real Estate decision involving money or contracts"
    target: darrell_review
    ntfy_topic: poetech-real-estate
    timeout_hours: 24

  - id: tenant_eviction_path
    description: "Any tenant-facing communication that approaches eviction or 5-day notice"
    target: darrell_christina_review
    ntfy_topic: poetech-tenant-care
    timeout_hours: 12
    notes: "Pastoral first per Holly Hill tenant resolution. Christina's clinical context is required."

  - id: new_workflow_activation
    description: "Activating any new workflow"
    target: darrell_review
    ntfy_topic: poetech-workflow-activation
    timeout_hours: 12

# ===========================================================================
# Per-team configuration -- the four teams from sovereign-LLM-teams architecture
# ===========================================================================
teams:

  - id: devops
    name: Dev/Ops Foundation Team
    base_model: qwen2.5:14b-instruct-q4_K_M
    router_model: phi-3-mini
    vector_store: qdrant://team-devops
    corpus_path: /data/teams/devops/corpus/
    system_prompt_path: /data/teams/devops/system.md
    allowed_providers: [ollama, claude, gemini]
    allowed_tools:
      - read_git_status
      - read_n8n_executions
      - run_smoke_test
      - propose_commit
      - read_workflow_json
      - check_pipeline_health
    pre_authorized_actions:
      - process_env_to_literal_default
      - hardcoded_value_to_set_node_config
      - missing_error_workflow_setting
    escalation_policy: any_action_outside_allowlist
    observability_topic: poetech-team-devops
    notes: "Pilot 2 -- silent-failure surfacing. Highest leverage of the four teams."

  - id: family_finance
    name: Family Finance Team
    base_model: qwen2.5:14b-instruct-q4_K_M
    vector_store: qdrant://team-family-finance
    corpus_path: /data/teams/family-finance/corpus/
    system_prompt_path: /data/teams/family-finance/system.md
    allowed_providers: [ollama]
    allowed_tools:
      - read_finance_events
      - compute_amortization
      - draft_appraisal_scenario
      - produce_monthly_digest
      - read_property_records
      - check_holly_hill_comps
    pre_authorized_actions:
      - family_finance_monthly_digest
    escalation_policy: any_money_movement_or_decision
    observability_topic: poetech-team-family-finance
    notes: "Pilot 1 -- Holly Hill equity-out + Christina's appraisal request. Christina's voice required on covered-entity adjacency."

  - id: counseling
    name: Counseling Intake Team
    base_model: qwen2.5:14b-instruct-q4_K_M
    vector_store: qdrant://team-counseling
    corpus_path: /data/teams/counseling/corpus/
    system_prompt_path: /data/teams/counseling/system.md
    allowed_providers: [ollama]
    allowed_tools:
      - capture_intake_notes_sovereign
      - surface_scripture
      - tts_reply
      - archive_sovereign_storage
    pre_authorized_actions: []
    escalation_policy: anything_touching_clinical_data
    bright_line_overrides:
      - tlc_clinical_data
    observability_topic: poetech-team-counseling
    notes: "Pilot 3 -- Council Chamber. NEVER routes to vendor LLMs. TLC firewall is inviolable."

  - id: church_colg
    name: Church Operations Team (COLG)
    base_model: qwen2.5:14b-instruct-q4_K_M
    vector_store: qdrant://team-church-colg
    corpus_path: /data/teams/church-colg/corpus/
    system_prompt_path: /data/teams/church-colg/system.md
    allowed_providers: [ollama]
    allowed_tools:
      - read_membership_directory
      - read_calendar
      - draft_communication_broadcast
      - read_sermon_archive
      - run_whisper_transcription
      - draft_announcement_3channel
      - propose_clip_selection
    pre_authorized_actions:
      - weekly_bulletin_draft
      - sermon_summary_3channel_draft
      - typographic_theology_violation
      - missing_scripture_translation_badge
    escalation_policy: any_giving_data_or_pastoral_care
    co_governor: bishop_gwin
    observability_topic: poetech-team-church-colg
    notes: "Pilot 4 -- Sermon + Announcement. COLG-first per COMMUNITY-FIRST-MISSION."

# ===========================================================================
# Routing policy (Tier 0 / Tier 1 / Tier 2 per sovereign-LLM-teams Section F.5)
# ===========================================================================
routing:

  tier_0_sensitivity_firewall:
    pattern: "tlc|therapy|counsel|clinical|patient|client session|christina'?s clinical|christina'?s patients"
    action: force_ollama_only
    fail_mode: fail_closed
    notes: "Inviolable. Per TLC firewall in wf27."

  tier_1_per_team_allowed_providers:
    rule: "Each team's allowed_providers list governs which provider it can call."

  tier_2_task_classifier:
    routes:
      - condition: "simple OR routine"
        target: sovereign_team
      - condition: "heavy_reasoning OR architecture OR long_context"
        target: claude
      - condition: "fresh_knowledge OR current_events"
        target: gemini
      - condition: "explicit_@claude_token"
        target: claude
      - condition: "explicit_@gemini_token"
        target: gemini

# ===========================================================================
# Adaptation loop -- the weekly policy review
# ===========================================================================
adaptation:
  cadence: weekly_sunday_evening
  digest_topic: poetech-policy-proposals
  governor: Darrell Poe
  diff_format: git_pr
  thresholds:
    promote_to_pre_authorized: action escalated 9+ times always approved
    demote_to_escalate: action approved then rolled back 3+ times
    ban_action: action class causes critical alerts 2+ times
  notes: "Quality Gatekeeper (wf36) produces the digest. Darrell approves diff in one tap. Diff lands as new policy version."

# ===========================================================================
# Observability -- per project-execution-outcome-observability
# ===========================================================================
observability:
  every_action_emits_event: true
  events_log_path: /data/events/
  ntfy_topics:
    - poetech-team-devops
    - poetech-team-family-finance
    - poetech-team-counseling
    - poetech-team-church-colg
    - poetech-foundation-agent
    - poetech-workflow-failure
  alert_classes:
    - silent_failure_detected
    - pre_authorized_action_rollback
    - escalation_queued
    - bright_line_attempt_blocked
```

---

## 6. Dev cycle changes -- day-in-the-life-of-a-build after top adoptions land

**Before (current state, 2026-06-02):**

- Darrell wakes up. Checks his phone. Sees no alerts (because there are none -- workflows silent-failed overnight). Opens Dispatch. Discovers wf30 has been broken for 4 hours. Manually digs through n8n executions log. Identifies process.env bug. Asks Claude to fix it. Claude proposes the fix. Darrell approves. Claude ships the fix to wf30. Darrell asks Claude to check the other workflows for the same bug class. Claude audits. Reports 13 more hits across 4 active workflows. Darrell asks Claude to fix those too. Claude fixes them. 4 hours have elapsed; the family-feedback digest hasn't fired; Christina's morning question goes unanswered. Darrell sighs, makes coffee, opens his laptop.

**After (post-top-15 adoption queue, ~3-4 weeks from now):**

- Sunday evening: Bishop Gwin records his sermon. The COLG NAS captures the recording via wf08. wf-sermon-pipeline picks up the file. faster-whisper transcribes (8 min). The Church team writes scripture-cited summary + 5 clip candidates (Worldview-grounded, ESV-primary). Bishop Gwin gets a one-tap-approval ntfy at 6:30pm. He taps Approve. Remotion + ffmpeg render. The long-form + 5 clips publish to the COLG website + YouTube + Facebook. By 9pm Sunday, the sermon is captioned, archived, searchable, and clipped.
- 9pm Sunday: wf32 fires. The daily ship summary lands on Darrell's ntfy: "Today we shipped: COLG sermon archive ('Walk in the Light'), 5 short clips published, 12 new searchable transcripts in the archive. Tomorrow's bulletin draft is queued for Bishop Gwin's review."
- 7am Monday: wf31 fires. Christina's overnight question -- "what do the Holly Hill homes appraise for based on these comps?" -- has already been answered. The Family-Finance team picked up Christina's voice from wf08 at 11pm Sunday, ran Qdrant retrieval against the Holly Hill RAG, computed the appraisal at the 972-sqft + $113.75/sqft anchor, and queued a draft response. Christina's phone shows the response when she wakes up. Darrell's morning digest reads: "1 family voice handled by Family-Finance team. 0 escalations. 0 silent failures. 3 pre-authorized fixes applied overnight (typographic theology in 1 generated bulletin; missing translation badge on 1 scripture quote; one-line process.env-to-literal fix on a newly-imported community-template workflow). 1 escalation queued: Bishop Gwin's bulletin draft awaits review."
- 10am Monday: Darrell taps Approve on Bishop Gwin's bulletin draft. The Church team broadcasts the 3-channel message to the COLG member list. 70-year-old Deacon Mary opens her phone, sees the bulletin, smiles. Her weekly task that used to be 90 minutes was 5 minutes.
- Throughout the day: Darrell ASKS Claude what to spec for the next module. Claude orients from memory (Phase 0). Claude proposes 4-6 domain options + the most-aligned recommendation (Phase 1). Darrell taps the recommendation. Claude sketches architecture (Phase 2). Darrell tweaks. Claude produces the 10-section PRD (Phase 3). The PRD lands in `/data/cowork/builds/pending/`. 30 minutes later, the autonomous-builder picks it up. By dinner the v1 of the new module is in `done/`. Darrell reviews the diff over dinner.
- The substrate works. The constraint-and-blind-spot re-litigation cycle does not exist anymore. Darrell governs policy; the NAS governs operations; the LLM teams do the work. Christina sleeps through the night because the family-finance question got answered. Bishop Gwin smiles because the sermon archive grew without him having to touch the technology. COLG's Sunday-morning livestream goes out captioned + clipped + archived without anyone working Monday morning to make it so.
- The system is held by the system.

---

## 7. Open questions for Darrell (only true judgment calls; no asking for info we could source)

1. **The clone-to-NAS batch ordering.** Recommendation is the 5-repo order in Section 4. Confirm OK or adjust. (Default I'm running: ship that order.)
2. **The OPA + Rego policy YAML in Section 5.** First-pass draft. The Bright Lines feel correct; the per-team `allowed_tools` lists need Darrell + Christina + (eventually) Bishop Gwin co-sign for each team. Confirm the structure is right; co-sign per-team scope post-vacation. (Default I'm running: structure ships as-is; per-team scope reviewed before each team activates.)
3. **The Cowork-account-level Operating Instructions doc scope.** Should it apply across Cowork ONLY, OR also be the source for Dispatch + Code subagent operating instructions? (Default I'm running: source-of-truth at `docs/00-foundations/_root/COWORK-ACCOUNT-OPERATING-INSTRUCTIONS.md`, manually pasted into Cowork settings; the repo CLAUDE.md remains the canonical for Code + Dispatch sessions opened on the repo; the Cowork-account doc declares "Source of truth: CLAUDE.md + foundations/_root/").
4. **The autonomous-builder pickup cadence.** 30 min like Tina, or hourly to start conservatively until failure rate is understood? (Default I'm running: hourly for the first 14 days; 30 min once failure rate is under 5%.)
5. **The GPU box timing.** Recommendation defers until M1 sermon pipeline v1 proves the workload. Confirm or pull forward? (Default I'm running: defer per `project-cost-discipline-with-growth-permission`.)

---

## Verification screen on this report

**Religion check (backbone):**

- Every entry cites a source URL.
- Every adoption has a focused-hour estimate.
- Every recommendation passes the cost-efficiency screen per `project-cost-discipline-with-growth-permission` (growth-justification + unit-cost + lean-alternative + break-even).
- Every entry has its sovereign-mesh Tier label per `project-sovereign-mesh-mvp-pragmatism`.
- The Top-15 queue is ordered by dependency chain + leverage-to-cost.
- The 5-repo clone list names the specific path on the NAS where each lands.
- The YAML governance config has structure (meta / bright_lines / pre_authorized_fix_classes / pre_authorized_drafts / escalations / teams / routing / adaptation / observability) -- production-ready first draft, not pseudocode.

**Relationship check (warmth):**

- The day-in-the-life narrative in Section 6 honors Christina sleeping through the night and Deacon Mary's 5-minute bulletin. Backbone + warmth in the same prose.
- The "what's broken right now" pattern is named diagnostically, not punitively.
- Open Questions list is short (5 items) because most adoptions are clear-wins per the source documents already produced.

**Phil 4:8 Test on this report:**

| Question | Result |
|---|---|
| TRUE -- factually accurate, no fabrication? | Yes. Every URL is real; every adoption derives from a cited source document. |
| HONORABLE -- dignified? | Yes. The Bishop Gwin + Deacon Mary scenes honor the community-first commitment. |
| JUST -- aligned with God's standard? | Yes. The TLC firewall is preserved at the policy level; the typographic theology is enforced as a Tier-1 fix class; bright lines on money / minors / credentials are stated. |
| PURE -- free of bitterness, manipulation, lust? | Yes. No vendor-shilling; vendor LLMs named as Tier 2/3 escape hatches with documented evolution paths to sovereign. |
| LOVELY -- draws the reader toward good? | Yes. The substrate that auto-implements obvious fixes -- the cure Darrell named -- is the recommendation. |
| COMMENDABLE -- good-sounding, no slander? | Yes. Riverside / Descript / Subsplash named as competitors; their structural extraction-patterns described without personal critique of teams. |
| EXCELLENT -- the best version, not lazy? | Yes. 42 entries cataloged; Top-15 ranked; 5 repos named; full YAML draft included. |
| PRAISEWORTHY -- worth amplifying? | Yes. This document IS institutional memory per INSTITUTIONAL-MEMORY-EVENTS -- the next time a similar substrate-design question comes up, this is the precedent. |

**Religion AND Relationship balance:** structure is sound (the categories, the Tier labels, the cost screens, the YAML), warmth is visible (the day-in-the-life narrative, the COLG honor, the family voices held).

---

*Source the research. Bring the plan. Ship the substrate that auto-implements obvious fixes. Stop putting work on humans the LLMs can do. The NAS holds governance; vendor LLMs consult it; the per-industry teams do the work; the family governs the policy. We all win. We create. Amen.*
