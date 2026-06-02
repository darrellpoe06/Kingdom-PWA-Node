# Research Review — Sovereign LLM Teams Per Industry (Architecture)

**Date:** 2026-06-01
**Author:** Claude (research-review on Darrell's commission, per `feedback-research-first`)
**Status:** Foundation-level reference. This document is the architectural spine for every future LLM-stack decision. It will be ingested as an Event (type: `decision`, tag: `architecture`) per INSTITUTIONAL-MEMORY-EVENTS when that module ships.
**Pairs with:** `project-sovereign-llm-teams-per-industry` (memory), AI-FOUNDATION-INTERNAL-OPERATIONS, COMMUNITY-FIRST-MISSION, DATA-AS-EMPOWERMENT-NOT-EXTRACTION, WORKFLOW-MODULE-LIBRARY, EXECUTION-OUTCOME-OBSERVABILITY, INPUT-VISIBILITY-TO-CLAUDE, INSTITUTIONAL-MEMORY-EVENTS, COUNCIL-CHAMBER, MODE-ROUTING, GOVERNANCE-EXECUTION-ADVISORY.

---

## Framing

Per Darrell's four-message articulation on 2026-06-01 evening: PoeTech runs **lean, secure, sovereign LLM teams specialized per industry.** Not competing with vendor-LLM infrastructure scale. Winning on focused specialization and family/community control of their own data, work, and outcomes. Existing vendor LLMs (Claude, Gemini) are reserved for strategic, heavy-reasoning, one-off tasks; sovereign teams handle the daily work.

This document answers the seven open architectural questions from that memory entry, with sources cited. Where the answer is contingent on hardware acquisition (the future GPU box), the contingency is named so the decision lands intact when that hardware arrives.

The Test (Phil 4:8) was run against this document before delivery: TRUE (claims sourced), HONORABLE (no flippant framing of the work), JUST (aligned with stewardship), PURE (no manipulation), LOVELY (oriented to family and community good), COMMENDABLE (no slander of vendors or competitors), EXCELLENT (substantive, not lazy), PRAISEWORTHY (worth amplifying). Religion AND Relationship checks both pass: structure is sound, warmth shows in the use cases.

---

## A. Minimum-viable sovereign LLM stack on the DS1621xs (CPU-only)

### A.1 The question

What Ollama models fit reasonably on the DS1621xs+ (Xeon D-1527 quad-core 2.2 GHz, max 32 GB DDR4 ECC SODIMM, CPU-only, no GPU) for code execution, text processing, summarization, generation, structured output / function calling, and embeddings? What is the realistic tok/s on CPU-only at Q4 quantization? Where does CPU-only top out vs. needing a GPU box? What is best-in-class today for the 7B, 14B, and 30B parameter ranges?

### A.2 Hardware envelope (confirmed)

- DS1621xs+ uses Intel Xeon D-1527, quad-core 2.2 GHz (turbo 2.7), supports up to **32 GB DDR4 ECC SODIMM**, 6 bays + 2 M.2 NVMe, onboard 10GbE. Confirmed via StorageReview launch coverage and the NAS Compares third-party 32GB/64GB memory guide. URLs: https://www.storagereview.com/news/synology-ds1621xs-launched and https://nascompares.com/32gb-64gb-unofficial-memory-guide-for-the-synology-ds1621xs-nas/
- Synology Plus/Value series with Intel or AMD CPUs supports Ollama (SIMD extensions present). ARM-based Synology units (RTD1296, RTD1619B) do NOT — they lack the SIMD path Ollama assumes. URL: https://needtoknowit.com.au/blog/ollama-on-synology-nas-australia/
- Synology DSM 7.2 supports Docker / Container Manager natively; Ollama runs in a container on the existing stack.

### A.3 Realistic throughput, CPU-only, Q4

Cross-source synthesis (CloudNinjas 2026 benchmark, Need-to-Know-IT NAS guide, Local AI Master Synology guide, SitePoint DeepSeek deployment guide):

| Model | Q4 size | RAM at runtime | CPU tok/s (NAS-class) | Use case |
|---|---|---|---|---|
| `phi-3-mini` (3.8B) | ~2.3 GB | 4 GB | 12-14 | Fast classifier, router, light QA |
| `llama-3.2:3b` | ~2 GB | 4 GB | 14-18 | Tiny tasks, summaries, tags |
| `nomic-embed-text-v2` (137M MoE) | ~280 MB | 1 GB | 580 chunks/s embeddings | Default embedder, RAG |
| `mistral:7b-instruct` Q4_K_M | ~4.4 GB | 6 GB | 5-8 | Mid-tier general-purpose |
| `qwen2.5:7b-instruct` Q4 | ~4.4 GB | 6 GB | 5-8 | Multilingual, tool-call capable |
| `qwen2.5:14b-instruct` Q4_K_M (current daily-driver) | ~8.7 GB | ~10-11 GB | 2-4 | Heavy daily work, escalations |
| `phi-4:14b-reasoning` Q4_K_M | ~8.7 GB | ~10-11 GB | 2-4 | Math / reasoning / structured |
| `deepseek-r1-distill-qwen-14b` Q4 | ~7-8 GB | ~10 GB | 2-4 | Reasoning specialist |
| `qwen2.5:32b` Q4 | ~19 GB | ~22 GB | <1 (impractical on this NAS) | Needs GPU box |
| `llama3.3:70b` Q4 | ~40 GB | does not fit | n/a | GPU box only |

Sources for the rates: CloudNinjas 2026 local LLM benchmark (https://cloudninjas.ca/ai/local-llm-benchmark-2026-comparing-open-source-models-for-ai-inference-on-consumer-hardware/), Need-to-Know-IT NAS Ollama guide (https://needtoknowit.com.au/blog/ollama-on-synology-nas-australia/), Groundy DeepSeek throughput notes ("14B variant runs at approximately 10-15 tokens/second on CPU" on faster consumer CPUs; expect the lower 2-4 tok/s range on the Xeon D-1527 with DDR4-2133 memory bandwidth — https://groundy.com/articles/running-deepseek-r1-locally-hardware-requirements-quantization-and-real-throughput/), SitePoint local DeepSeek deployment (https://www.sitepoint.com/deepseek-r1-local-deployment-guide-2026/).

The Xeon D-1527 specifically: 4 cores at 2.2 GHz, DDR4-2133 ECC. Memory bandwidth (~17 GB/s effective) is the dominant constraint, not raw flops. A 14B Q4 model is bound by reading ~8.7 GB of weights per token at the lower-numbered layers and a sizable fraction repeatedly through the inference loop. The 2-4 tok/s estimate is conservative-realistic for a NAS that is also serving SMB, Docker, n8n, ntfy, and Photos.

### A.4 Capability tier CPU-only achieves vs. where GPU is required

**Achievable on the current DS1621xs+ (CPU-only, 32 GB RAM):**

- Single-user, single-task inference at conversational latency for **routing, classification, summarization, structured-output extraction, tagging, embedding generation, short generative responses, tool-call decision making.** Phi-3 Mini and 3B Llama run interactive. 7B models run usable. 14B models run "good for one-at-a-time, async, batch-mode" — perfect for n8n cron workflows but NOT for live multi-user chat.
- Concurrent multi-user serving: poor. Ollama serves one concurrent request at a time by default; vLLM is the production-grade alternative but needs Linux + NVIDIA/AMD GPU (Spheron, Red Hat, Glukhov sources, all 2026). URLs: https://www.spheron.network/blog/ollama-vs-vllm/, https://developers.redhat.com/articles/2025/09/30/vllm-or-llamacpp-choosing-right-llm-inference-engine-your-use-case, https://www.glukhov.org/llm-hosting/comparisons/hosting-llms-ollama-localai-jan-lmstudio-vllm-comparison/

**Requires GPU box (future):**

- Multi-user real-time serving (church staff + family members + COLG congregation potentially in parallel)
- 30B-and-up models, including the tool-calling sweet spot the InsiderLLM 2026 review names (Qwen 3.6-27B, Gemma 4 27B, GLM-5.1 32B, Qwen3-Coder 30B). URL: https://insiderllm.com/guides/function-calling-local-llms/
- Anything resembling a streaming voice-first surface for the Council Chamber pattern at conversational latency

### A.5 Best-in-class (mid-2026) by parameter range

Cross-referenced across HuggingFace blog (https://huggingface.co/blog/daya-shankar/open-source-llms), Ollama library (https://ollama.com/library), Sitepoint local LLM rankings (https://www.sitepoint.com/best-local-llm-models-2026/), Onyx self-hosted leaderboard (https://onyx.app/self-hosted-llm-leaderboard), Acecloud comparison (https://acecloud.ai/blog/best-open-source-llms/), Till Freitag comparison (https://till-freitag.com/en/blog/open-source-llm-comparison):

- **3B tier:** `llama-3.2:3b-instruct` for general; `phi-3-mini` for speed; `gemma-3:3b` for accessibility-tuned text.
- **7B tier:** `qwen2.5:7b-instruct` (strong general + tool-call), `mistral:7b-instruct-v0.3` (long-context, well-supported), `llama-3.2:7b` (Meta-canonical baseline).
- **14B tier:** `qwen2.5:14b-instruct` (current daily driver — confirmed strong choice), `phi-4:14b` for reasoning/math, `qwen2.5-coder:14b` for code (~85% HumanEval per local model rankings), `deepseek-r1-distill-qwen-14b` for explicit reasoning chains.
- **27-32B tier (GPU box future):** Qwen 3.6-27B / 35B-A3B for tool-calling, Gemma 4 27B for general, Qwen3-Coder 30B for code, GLM-5.1 32B for reasoning, DeepSeek-R1-Distill-Qwen-32B for reasoning chains.
- **Embedding:** `nomic-embed-text-v2-moe` is the CPU default (580 chunks/sec MoE-accelerated, 137M active params). `mxbai-embed-large` for higher-quality long-context retrieval when batch throughput is less critical (Morph LLM benchmarks: https://www.morphllm.com/ollama-embedding-models, Cheney Zhang 2026 benchmark: https://zc277584121.github.io/rag/2026/03/20/embedding-models-benchmark-2026.html).

### A.6 Trade-off comparison

| Approach | Pros | Cons |
|---|---|---|
| Single 14B daily-driver (current: qwen2.5:14b) | Simple. One model warm. Covers most tasks. | 2-4 tok/s on this hardware. Can't multi-user serve. Slow for some tasks where 3B would suffice. |
| Two-tier: 3B router + 14B worker | Fast routing; 14B only loaded for substantive work. Concurrent reads of small model don't block. | Model swap overhead if RAM-constrained. Adds complexity. |
| Multi-model warm: phi-3-mini + 7B + 14B + embedder | Right-size per task. Maximum capability. | 32 GB RAM ceiling: all four warm fits if 14B is on-demand-only. Cold-start latency for 14B. |
| Wait for GPU box | Defers all hard choices. | Loses 1-3 months of compounding learning. Strategic direction needs proof now. |

### A.7 Recommendation

**Two-tier minimum-viable stack, ship now on existing DS1621xs+:**

1. **Always-warm:** `nomic-embed-text-v2` (embeddings, RAG, classification features), `phi-3-mini` or `llama-3.2:3b` (router + classifier + fast structured-output).
2. **On-demand-warm:** `qwen2.5:14b-instruct-q4_K_M` (current daily driver — keep it; it is the right pick for the tool-calling + structured-output workload at 14B). Load when a substantive task comes in; unload after N minutes idle.
3. **Specialist on-demand:** `phi-4:14b` for explicit reasoning / math, `qwen2.5-coder:14b` for code, loaded only when those workflows fire.

This fits inside 32 GB with margin. It honors PERPETUAL-PIPELINE-HEALTH (no single-model failure mode), it gives the AI Foundation a router that can wake fast for INPUT-VISIBILITY-TO-CLAUDE family-voice surfaces, and it preserves the 14B daily-driver for the work that needs it.

**The GPU box upgrade unlocks (not yet required):** Qwen 3.6-27B or Gemma 4 27B as the new daily driver with native JSON-Schema tool calling, real concurrent multi-user serving via vLLM, and the AI-MEDIA-PRODUCTION pipeline (Whisper at scale + image gen).

---

## B. Per-industry LLM team architecture pattern

### B.1 The question

A "team" = model + system prompt + tool list + memory store + pre-authorized action policy. What is the right architectural shape? Compare: (a) one specialized fine-tune per industry, (b) one general base model + per-industry RAG over industry corpora, (c) one base model + per-industry system prompt + tool list, (d) hybrid. Which n8n pattern naturally expresses an "LLM team"?

### B.2 Options surveyed

**(a) Specialized fine-tune per industry.** Train a per-industry LoRA or QLoRA adapter on top of a strong base. Best where the *behavior* needs to differ deeply (formatting, style, refusal patterns, structured-output schema fluency). Industry adoption: Allganize Finance 13B is a published specialized-finance SLM (https://www.allganize.ai/en/blog/embracing-the-future-of-finance-with-allganize-finance-13b-a-specialized-small-language-model). Trade-off: training cost, maintenance per base-model upgrade, harder for a non-technical family to spin up.

**(b) Base model + per-industry RAG.** Keep one base model. Put the industry-specific knowledge in retrieval. Pull relevant passages into context per query. RAG dominates for factual recall and dynamic knowledge that changes weekly. Per the 2026 strategy guides: "RAG consistently outperforms fine-tuning for factual recall" and can reduce hallucination by up to 85% (https://orq.ai/blog/finetuning-vs-rag, https://bigdataboutique.com/blog/fine-tuning-llms-when-rag-isnt-enough). Lower setup cost, portable across base-model upgrades.

**(c) Base model + per-industry system prompt + tool list.** The lightest option. Industry specialization lives in the prompt and the allowed-tools list. Maintenance cost: near zero per industry. Quality ceiling: bounded by what the base model already knows. Per the 2026 RAG-vs-FT-vs-Prompt strategic guide: "Prompt -> RAG -> Fine-tune -> Distill" is the right sequence; start with the lightest tier (https://dev.to/muzammil_endevsols/rag-vs-fine-tuning-vs-prompting-2026-strategic-guide-169l).

**(d) Hybrid.** "The 2026 approach is to put volatile knowledge in retrieval, put stable behavior in fine-tuning, and stop trying to force one tool to do both jobs. The most resilient architectures today are hybrid systems that utilize multi-agent workflows for routing, RAG for factual grounding, and fine-tuning exclusively for deep stylistic or logical specialization." (https://dev.to/umesh_malik/rag-vs-fine-tuning-for-llms-2026-what-actually-works-in-production-10if and https://umesh-malik.com/blog/rag-vs-fine-tuning-llms-2026)

### B.3 Trade-off comparison

| Axis | Fine-tune per industry | RAG per industry | Prompt+tools per industry | Hybrid (Prompt+RAG, FT later) |
|---|---|---|---|---|
| Setup cost | High (data, training, eval) | Medium (corpus curation, vector store, eval) | Low (prompt + tool config) | Medium |
| Ongoing maintenance | High (re-tune per base upgrade) | Low-medium (refresh corpus) | Very low | Low-medium |
| Quality ceiling | Very high (deep behavior) | High (current knowledge + base reasoning) | Bounded (base only) | Highest (compounds) |
| Portability across base-model upgrades | Poor (must re-tune) | Excellent (corpus is portable) | Excellent | Good |
| Onboardability for a new family/community | Poor | Medium | Excellent | Medium |
| Family-data sovereignty | OK (training on-prem possible but expensive) | Excellent (vector store sovereign) | Excellent | Excellent |
| Fits CPU-only DS1621xs+ | Inference yes; training no | Yes (vector store on NAS, e.g., Qdrant or pgvector) | Yes | Yes |

### B.4 Which n8n pattern expresses an LLM team

Per the 2026 multi-agent n8n guides (https://medium.com/@angelosorte1/multi-agent-orchestration-with-n8n-in-2026-from-concept-to-real-world-ai-systems-bae68fa7ba03, https://hatchworks.com/blog/ai-agents/multi-agent-solutions-in-n8n/, https://strapi.io/blog/build-ai-agents-n8n, https://www.alexanderharte.com/n8n-ai-agents-workflows-guide/), n8n supports four agent architecture patterns:

1. **Chained requests** — sequential LLM calls with intermediate processing. Cost-reducing (30-50% per the Strapi 2026 guide).
2. **Single agent with state** — one agent, memory nodes hold context.
3. **Multi-agent with gatekeeper** — supervisor + specialists.
4. **Multi-agent teams** — parallel specialists.

Pattern #3 (Supervisor / Gatekeeper) is the canonical match for "an LLM team per industry": one router classifies, then dispatches to the right industry specialist. Per the LangGraph multi-agent supervisor guides (https://reference.langchain.com/python/langgraph-supervisor, https://callsphere.ai/blog/langgraph-supervisor-multi-agent-orchestration-2026): "the supervisor pattern is the canonical multi-agent architecture. Start with the supervisor. It's simpler to build, simpler to debug, and the routing accuracy advantage matters more than the latency penalty in most early deployments."

**wf27 Foundation Agent is already the supervisor.** Its classifier (`classify()` function in the Code node) is the seed of the supervisor pattern. It routes by TLC firewall + token detection. Extending it to dispatch by *industry* (instead of just by "ollama vs claude") is a small refactor, not a rewrite.

### B.5 Recommendation

**Per-industry team = base model + per-industry system prompt + per-industry tool list + per-industry RAG corpus + per-industry pre-authorized policy. NO fine-tuning at first.**

Concretely, an industry team is a **workflow module** (per WORKFLOW-MODULE-LIBRARY) that exposes:

```
industry_team:
  industry: "family-finance"           # tag
  base_model: "qwen2.5:14b-instruct"   # shared across teams initially
  system_prompt: "/data/teams/family-finance/system.md"
  tools:
    - read_account_balances
    - read_transaction_history
    - compute_amortization
    - draft_budget_proposal
  rag_corpus: "/data/teams/family-finance/corpus/"   # docs, policies, statements
  vector_store: "qdrant://team-family-finance"
  pre_authorized_actions:
    - tag_transaction
    - draft_quarterly_report
    - alert_on_overdraft_risk
  escalation_policy: "any-action-outside-allowlist => queue-for-Darrell-approval"
  observability: ntfy_topic: "poetech-team-family-finance"
```

**Why this shape:**

- Each team ships as a Tier 2 (community-template) module per WORKFLOW-MODULE-LIBRARY. New family configures `industry`, `corpus path`, `tools`, `senders`, done.
- Sovereignty: corpus, vector store, tools, policy all live on the NAS. No data leaves.
- Onboardability: a non-technical family can clone a team module from the library and adjust a YAML.
- Upgradability: replace `base_model` from `qwen2.5:14b` to `qwen-3.6:27b` when the GPU box ships. Zero team-by-team rework.
- Fine-tuning becomes a later compounding investment for the teams that prove out: per the 2026 strategy guides, "the highest-ROI fine-tuning is a thin LoRA or QLoRA adapter on top of a strong base model, paired with retrieval rather than replacing it."

**Sequence the implementation:**

1. Refactor wf27 to dispatch by `industry` tag in addition to TLC/escalation.
2. Build the first team config (Family Finance — see Section G).
3. Add a `teams/` directory under `/data/` with the YAML + corpus layout above.
4. Add team-tag and team-observability to the WORKFLOW-MODULE-LIBRARY index.

---

## C. Pre-authorized governance loop

### C.1 The question

Certain change classes are pre-approved so the LLM team acts in real-time without human gate. Adjusts with feedback. Always improving. What patterns exist in the autonomous-agent space? What is the right policy language? How does the policy adapt from per-action approve/deny logs? Where does Quality Gatekeeper (wf36) fit — at workflow-ship time or as the runtime authorizer?

### C.2 Options surveyed

**Aider auto-commit + dirty-file protection.** Aider's pattern is the closest production-grade autonomous-coding-agent precedent: every successful AI edit becomes its own git commit with a model-generated message, dirty files are committed first to keep edits separate, pre-commit hooks can be enforced via `--git-commit-verify`. The "audit + reversibility via git" pattern means every action is reviewable and revertable. URL: https://aider.chat/docs/git.html, https://aider.chat/docs/config/options.html

**smolagents secure code execution.** Hugging Face's smolagents framework runs LLM-generated code through a `LocalPythonExecutor` that disallows imports unless they are on an authorization list, or in sandboxed cloud executors (E2B, Modal, Docker). Important caveat from the docs: "The built-in LocalPythonExecutor is not a security sandbox — it applies some restrictions but can be bypassed and must not be used as a security boundary." URL: https://huggingface.co/docs/smolagents/en/tutorials/secure_code_execution

**Open Policy Agent (OPA) for LLM tool-calls.** OPA is the production-grade pattern named in 2026: "enforce policy at the tool-calling layer, not at the agent layer. The agent does not decide what is allowed; the policy engine does." Workflow: User request -> Agent reasons -> Agent decides to call a tool -> OPA evaluates policy -> Allow or Deny -> Tool executes or request is rejected. URLs: https://www.openpolicyagent.org/, https://codilime.com/blog/why-use-open-policy-agent-for-your-ai-agents/, https://gokhan-gokalp.com/runtime-governance-for-ai-agents-policy-as-code-with-opa/

**Microsoft Agent Governance Toolkit.** Open-source 2026 framework covering OWASP Agentic Top 10 — policy enforcement, zero-trust identity, execution sandboxing. URL: https://github.com/microsoft/agent-governance-toolkit

**APort + Microsoft Defender for AI Agents.** APort refuses tool calls before they happen; Microsoft Defender for AI Agents (Jan 2026) analyzes intent and destination of every agent action in real time. URLs: https://aport.io/blog/best-ai-agent-guardrails-2026-pre-action-authorization-compared/, plus the Atlan 2026 enterprise security guide: https://atlan.com/know/ai-agent-risks-guardrails/

**OWASP / NIST 2026 standards.** OWASP Top 10 for Agentic Applications (2026) names "Agent Goal Hijacking" as the leading risk and emphasizes minimizing unnecessary agent capability. NIST AI Agent Standards Initiative (Feb 2026) names enforceable security and identity standards.

### C.3 Policy language

Three real options:

1. **JSON allow-list** in the team's YAML (`pre_authorized_actions: [...]`). Simple, human-editable. Works for small teams; gets unwieldy past ~20 actions.
2. **OPA Rego policy file** per team. Powerful, declarative, supports conditional logic ("allow if amount < $X AND sender is family AND time-of-day in 8am-10pm"). Industry standard. Auditable. URL: https://github.com/open-policy-agent/opa
3. **Inline code-level guard** in the n8n Code node (current pattern). Lowest setup; hardest to evolve.

### C.4 Adaptation loop

Per the 2026 IGA / agent-governance guides: "define policy before the agent runs, not at runtime. The agent then operates within a pre-authorized policy envelope rather than generating individual approval requests."

Per EXECUTION-OUTCOME-OBSERVABILITY (the existing PoeTech principle): every action is observable. Combined with INSTITUTIONAL-MEMORY-EVENTS, every approve/deny/escalate is an Event record. The natural adaptation loop:

```
1. Action attempted -> OPA policy evaluates -> allow/deny/escalate
2. Event logged (action, decision, outcome) -> INSTITUTIONAL-MEMORY
3. Periodic review (weekly?) of escalated actions:
   - Pattern: "this action is escalated 9 times, always approved" -> promote to pre-authorized
   - Pattern: "this action was approved then rolled back 3 times" -> demote to escalate
   - Pattern: "this action class causes alerts" -> ban entirely
4. Policy revision committed to git -> the team's Rego file (or YAML) updates
5. Next action runs against the new policy
```

Trigger for a policy update: any of the above patterns crossing a threshold count. Quality Gatekeeper (wf36) is the natural place to enforce the trigger.

### C.5 Where Quality Gatekeeper (wf36) fits

**Both. The principle is "religion AND relationship," and Quality Gatekeeper enforces both gates.**

- **At workflow-ship time:** wf36 enforces the validation gate from WORKFLOW-MODULE-LIBRARY. No new workflow flips active until smoke-tested. This is the "religion" gate — structural quality.
- **At runtime, as the policy authorizer:** wf36 evaluates pre-authorized-action requests in real-time via an embedded OPA evaluator (Rego policy per team). Allowed actions pass through; escalated actions queue for Darrell via ntfy. This is the "relationship" gate — respect the family's trust by surfacing what genuinely needs them.

Both are the same role (Role 10 per AI-TEAM-DISTRIBUTION) operating at two layers: build-time and run-time. The 2026 enterprise patterns (per Atlan and Microsoft Agent Governance Toolkit) explicitly recommend this dual-layer model.

### C.6 Recommendation

**Build the governance loop as follows:**

1. **Policy language: start with YAML allow-list per team; migrate to OPA Rego when team count exceeds 3 or any team's action count exceeds 10.** The YAML is paste-readable for Darrell from his phone, which matters for the on-the-go review cadence; OPA adds the conditional logic needed for serious finance / clinical / community actions.
2. **Every action is an Event.** Pre-write the INSTITUTIONAL-MEMORY-EVENTS adapter so wf27 + wf36 emit Event records of type `action-attempt` with full provenance.
3. **Auto-rollback is required** for any pre-authorized action class. If a pre-authorized commit fails CI, the rollback fires automatically. (Aider's git-based pattern is the template.) Per PERPETUAL-PIPELINE-HEALTH rule "idempotent design" — the rollback has to be safe to re-run.
4. **Adaptation cadence: weekly.** Quality Gatekeeper produces a "policy proposals" digest every Sunday: actions promoted, demoted, banned. Darrell approves the diff in one tap from ntfy (this is the smallest possible piece of his time per Drive-Don't-Delegate). The diff lands in git as the new policy version.
5. **Bright lines that NEVER auto-promote, regardless of approval pattern:**
   - Anything touching TLC clinical data
   - Anything moving money (per Financial actions rule: never execute trades or transfers)
   - Anything affecting authentication, credentials, or the credential vault
   - Anything irreversible at the OS level (rm -rf, drop table, registrar DNS root changes)
   - Anything touching minor / child data per DATA-AS-EMPOWERMENT minor protections

These bright lines are coded as deny-always in the base Rego policy and require an explicit Governor (Darrell) signed override per occurrence.

---

## D. Per-industry team count and starting set

### D.1 The question

What is the lean team count? Per industry (5-7), per QoL sector (9), per pipeline-role (4), or something else? Which 3-5 industries ship pilots FIRST given existing work, lowest barrier to demo, highest stress-relief impact?

### D.2 Options surveyed

- **Per QoL sector (9):** financial, physical, relational, spiritual, mental, community, education, vocational, environmental. Matches QUALITY-OF-LIFE-AS-NORTH-STAR. Each team aligns with a sector that the family already self-organizes around.
- **Per industry as Darrell named (5-7):** financial, family-counseling, real-estate, church-ops, education. Matches business reality: these are the modules with active workflows or named adjacent work (Christina's TLC, Holly Hill, COLG, Christiana UIUC).
- **Per pipeline role (4):** review, fix, generate, summarize. Cross-cutting. Each team supports any sector.
- **Hybrid (recommended):** start with 3-4 industry teams (the substantive deliverables) and ship the 4 pipeline-role agents as a *cross-cutting team* that any industry team can call. The pipeline-role agents are smaller and lighter (3-7B); the industry teams are 14B.

### D.3 Which 3-5 to ship FIRST

Decision criteria, each scored 1-5 (5 = best):

| Industry | Existing PoeTech work | Demo barrier | Stress-relief impact | Score |
|---|---|---|---|---|
| Family Finance (incl. real-estate appraisal, jubilee, budget) | wf30/31/32 + Holly Hill evaluation drafted today | Low — Christina's request was a perfect natural demo | High — Christina's anxiety reduction is real | 15 |
| Church Ops (COLG-first) | COMMUNITY-FIRST-MISSION foundation done, no code yet | Medium — needs first surface | Very High (community-level) | 13 |
| Family Counseling (TLC firewall) | Council Chamber + MODE-ROUTING + INTAKE-AND-FIT all written | Low — Council Chamber spec is ready | High but TLC firewall must hold | 14 |
| Dev/Ops Infrastructure (the meta-team) | wf27 is already this; AI-FOUNDATION-INTERNAL-OPERATIONS doc done | Very Low — already partially live | Very High (every other team depends on it) | 17 |
| Education (Christiana UIUC fall 2026 + Christian apprenticeship) | Christian-apprenticeship session note exists | High — least named so far | High but later | 9 |
| Real-estate ops (rentals, comp appraisal) | Holly Hill is the canonical first case | Low | Medium | 12 |

### D.4 Recommendation

**Ship FIRST these four, in this order, over the post-vacation 8-12 weeks:**

1. **Dev/Ops Foundation Team** (highest leverage — this is wf27 evolved into a real industry team, and every other team rides it). Industry tag: `infrastructure`. System prompt: "You operate the AI Foundation per AI-FOUNDATION-INTERNAL-OPERATIONS." Tools: read git status, run smoke tests, propose commits (NOT push them — escalate to Darrell), monitor pipeline health per EXECUTION-OUTCOME-OBSERVABILITY.
2. **Family Finance Team** (Christina's request is the validating demo). Industry tag: `family-finance`. System prompt: stewardship-grounded per THE-WAY + jubilee-direction. Tools: read finance-events bind mount, compute amortization, draft appraisal scenarios (per Holly Hill model), produce monthly digest. Pre-authorized: tagging transactions, drafting reports. NEVER auto-authorized: moving money.
3. **Counseling Intake Team** (TLC firewall-aware; sovereign-only; pairs with Council Chamber). Industry tag: `counseling`. System prompt: pastoral, Council Chamber four-section response. Tools: capture intake notes (sovereign storage only), surface scripture per SCRIPTURE-REFERENCE-STANDARD, NEVER route to vendor LLMs. Pre-authorized: nothing that touches clinical data; everything escalates to Christina-as-Governor for clinical surfaces.
4. **Church Ops Team (COLG-first)** (community-level showcase per COMMUNITY-FIRST-MISSION). Industry tag: `church-colg`. System prompt: serves COLG's elderly tech-novice staff with extreme accessibility. Tools: membership directory ops, calendar, communication broadcast, sermon archive query. Pre-authorized: drafting announcements, tagging recordings. Always escalate: anything touching giving / pastoral care notes.

**Defer:** Education team (until Christiana is in residence and the apprenticeship has a year of pattern data), Real-Estate-Ops as a separate team (subsume into Family Finance for now; split when a third property is acquired), Health team (until biosensor work is further along).

**The pipeline-role agents (review / fix / generate / summarize) are SHARED utilities, not separate "teams."** They live as small 3-7B models that the industry teams call as tools. This keeps the team count low while preserving the right-size principle.

---

## E. Cost-effective onboarding path for a family / community / small business

### E.1 The question

What hardware envelope? Software stack? Install time for a non-technical family? Ongoing maintenance burden? What does PoeTech-in-a-box look like?

### E.2 Hardware envelope options

| Tier | Hardware | Approximate cost (2026 USD) | Capacity | Who it serves |
|---|---|---|---|---|
| Free / Reclaimed | Used office PC + 16-32 GB RAM | $150-200 (per XDA $200 mini-PC story: https://www.xda-developers.com/ran-ollama-open-webui-on-200-mini-pc-local-ai-stack-actually-works/) | One small team, single user | A family on a tight budget; experimentation |
| Mini-PC | Beelink / Minisforum / Mac Mini M4 Pro | $400-1,400 (https://www.modemguides.com/blogs/modemguides-blog/best-mini-pc-local-ai-ollama-2026, https://www.compute-market.com/blog/home-ai-server-build-guide-2026) | 1-3 teams, low concurrent users | Most families; small church staff |
| NAS-class (current) | Synology DS1621xs+ 32 GB or DS923+ 32 GB with Intel CPU | $1,200-2,500 | 1-3 teams + storage + the entire family OS | Households needing storage + AI in one box |
| NAS + GPU box | Above + a small NVIDIA box (RTX 4060 16GB or similar) | $2,000-3,500 total | 3-7 teams, multi-user concurrent, AI-MEDIA pipeline | Communities, small businesses, COLG |

Per Compute Market 2026 home-AI build guide and Own-Your-AI budget AI server build under $1,000 (https://ownyourai.dev/hardware/budget-ai-server-build/): the sweet spot for a family is $400-1,400; for a community institution it is $2,000-3,500 including a basic GPU.

### E.3 Software stack

**Current stack is the recommended stack with one addition:**

- Ollama (current) — easiest to operate, single-user serving acceptable
- n8n (current) — workflow engine, multi-agent supervisor pattern
- ntfy (current) — alerting
- nomic-embed-text-v2 + a vector store (NEW: Qdrant or pgvector) — for RAG
- Open WebUI (NEW, optional) — gives family members a chat surface they recognize (https://ai-coding-flow.com/blog/home-assistant-local-ai-integration-2026/)
- Optional later: vLLM when the GPU box arrives (https://developers.redhat.com/articles/2025/09/30/vllm-or-llamacpp-choosing-right-llm-inference-engine-your-use-case)
- Optional later: LiteLLM as a gateway when team count makes multi-provider routing valuable (https://thushan.github.io/olla/compare/litellm/)

**Not recommended at start:** llama.cpp directly (too low-level for an elderly church operator), vLLM (needs GPU + Linux + complex setup), Modal/E2B/Blaxel cloud sandboxes (violates sovereignty).

### E.4 Install / setup time for a non-technical family

Per the SecureIoT.house 2026 family guide (https://secureiot.house/local-ai-home-setup-privacy-family-safety-2026/), Home AI Server build guide (https://www.compute-market.com/blog/home-ai-server-build-guide-2026), and the existing PoeTech-side experience: setup takes a few days WITH a knowledgeable operator. For a non-technical family the goal must be **PoeTech-in-a-box: a preconfigured image plus a one-evening guided onboarding.**

**PoeTech-in-a-box recommended deliverable:**

1. **Hardware:** family buys a recommended Mini PC (we list 3 SKUs with current pricing) OR uses a compatible Synology Plus-series NAS they already own.
2. **Image:** PoeTech publishes a Docker Compose file in the open-source repo. One paste: `curl -sSL get.poetech.us/install | bash` (this becomes the canonical install path per the AI-FOUNDATION-INTERNAL-OPERATIONS principle "anything that is a click today should be an API call tomorrow"). The script pulls Ollama, n8n, ntfy, the vector store, the team configs, and the default workflows.
3. **First-run wizard:** the PWA's onboarding flow walks the family through naming family members, picking which teams to activate (Family Finance, Counseling, Church Ops checkboxes), and connecting their first data source (one bank import, one calendar, one chat channel). Optional skip-everything-and-start-with-defaults button.
4. **Default models pre-pulled:** `phi-3-mini`, `nomic-embed-text-v2`, `qwen2.5:14b-instruct-q4_K_M` — the two-tier minimum stack from Section A.
5. **AI Foundation runs the rest.** Per AI-FOUNDATION-INTERNAL-OPERATIONS, the family does not click through forty config screens. The Foundation handles ongoing operations.

**Target install time:** 30 minutes for hardware-plus-image-paste, plus 60-90 minutes of first-run onboarding. Total: under 2 hours, no terminal commands required after the install paste.

### E.5 Ongoing maintenance

Per PERPETUAL-PIPELINE-HEALTH the system handles its own:

- Model updates: Foundation Agent checks Ollama library weekly, pulls patches, smoke-tests the team, swaps if pass.
- Security patches: weekly Docker image refresh, automated reboots in vacation-conservative posture.
- Monitoring: per EXECUTION-OUTCOME-OBSERVABILITY, every team's actions are observed; alert fires on consecutive failures or input-without-output.
- Backups: nightly per AI-FOUNDATION-INTERNAL-OPERATIONS to USB + B2 + off-site. Verified weekly.

For elderly church staff: maintenance is invisible. Foundation handles it; ntfy escalates only what requires a human judgment. This is exactly the principle Darrell stated: "Browsers are for humans deciding things, not for systems doing things."

### E.6 Recommendation

- **Ship "PoeTech-in-a-box" as the onboarding artifact for COMMUNITY-FIRST-MISSION.** A Docker Compose + first-run-wizard PWA + a 3-SKU hardware recommendation list.
- **Three pricing tiers per COMMUNITY-FIRST-MISSION Commitment 5:** Self-host free, Supported flat-monthly, Partnership.
- **Onboarding service for non-technical institutions** (COLG-class): PoeTech sets up the box, runs the first-week training, hands over. Per Commitment 6 "train the community to operate, don't make them dependent."

---

## F. Routing logic between sovereign and vendor LLMs

### F.1 The question

What tasks justify routing to a vendor LLM over the sovereign team? What policy enforces routing? How does the TLC firewall constrain this?

### F.2 Options surveyed

Per 2026 LLM-router survey (Anyscale https://www.anyscale.com/blog/building-an-llm-router-for-high-quality-and-cost-effective-responses, Clawrouters 2026 https://www.clawrouters.com/blog/best-llm-routers-2026, Eden AI router roundup https://www.edenai.co/post/best-llm-routers, Cost-Ladder essay https://atalupadhyay.wordpress.com/2026/05/06/the-llm-cost-ladder-when-to-use-local-models-vs-paying-for-gpt-5-5/), routers commonly classify on:

- **Task complexity** (a basic task goes to the cheap/local model; complex reasoning/coding/high-risk goes to the strong one). Empirically 70-83% cost reduction (https://arxiv.org/pdf/2502.16696, https://arxiv.org/pdf/2507.15553).
- **Sensitivity** — PRISM (https://arxiv.org/pdf/2511.22788), Privacy Guard (https://arxiv.org/pdf/2508.16765), and the practical PII-aware-routing pattern (https://dev.to/micelclaw/pii-aware-routing-how-to-use-cloud-ai-and-keep-your-sensitive-data-local-1m40) all use deterministic regex-plus-rules classification (no LLM in the privacy-classification loop, to avoid the circular problem) plus a sensitivity-tier routing table.
- **Latency budget** — for INPUT-VISIBILITY-TO-CLAUDE sub-60-second wakes, the router has to make the call without round-tripping to a remote model.

### F.3 Policy enforcement

Three layers:

1. **Hard rule (deterministic, not LLM-decided):** TLC firewall. Per existing wf27 code, regex match on `tlc|therapy|counsel|clinical|patient|client session|christina'?s clinical|christina'?s patients` forces `ollama-only`. This is the bright line, non-overridable, fail-closed (per Tian Pan 2026 privacy-preserving guide: "Sensitive requests must fail closed if local inference is unavailable rather than falling back to cloud providers." https://tianpan.co/blog/2026-04-20-privacy-preserving-inference-production-llm).
2. **Per-team declaration:** each team's YAML declares its allowed-providers list. The Counseling Team's list is `[ollama]` only. The Dev/Ops Foundation Team's list is `[ollama, claude, gemini]` because architectural reasoning legitimately needs the heavy reasoner.
3. **Per-task escalation:** when a sovereign team's output ends with the existing `ESCALATE_TO_CLAUDE` token (already in wf27), the supervisor queues the task for Dispatch / Claude. Pre-authorized model selection per the task's metadata + the team's allowed-providers list.

### F.4 Tasks that justify vendor-LLM routing

- **Heavy reasoning / architecture** — research-review reports like this one. Today's strategic-direction-articulation through to written architecture would have taken a sovereign 14B 12 hours and produced lower quality.
- **Codebase-scale refactors** — multi-file refactors that exceed a single team's context window or reasoning depth.
- **Long-context one-offs** — vacation-arc retrospectives, foundation-doc consolidation, multi-month pattern detection across the Events log.
- **Fresh-knowledge queries** — events the sovereign model's training cutoff doesn't cover. Per the existing memory `research_gemini_pro_vs_claude_2026_05_27.md`, Gemini handles grounded current-events; Claude handles code; Ollama handles clinical and narrow tagging.
- **Tasks that explicitly request a vendor** — `@claude` or `@gemini` token in the input.

**Tasks that do NOT justify vendor routing:**

- Daily standup digest (wf31) — sovereign team, qwen2.5:14b is plenty.
- Family-voice acknowledgment per INPUT-VISIBILITY-TO-CLAUDE — sovereign team, latency budget under 60s rules out cloud.
- Counseling intake / Council Chamber surfaces — TLC firewall, sovereign-only forever.
- Church-ops daily operations — sovereign team, per data-sovereignty Commitment 4 the church's data does not leave the church.
- Tagging, classification, summarization of routine artifacts — sovereign team, this is the lean-team's job.

### F.5 Recommendation

**Three-tier router, with TLC firewall as the inviolable Tier 0:**

```
Tier 0: Sensitivity firewall (deterministic, regex + rules)
  - If TLC / clinical / minor-private => sovereign team, fail-closed
  - If credentials / vault touch => sovereign team only, escalate Darrell
  - If anything in DATA-AS-EMPOWERMENT minor-protected stream => sovereign team

Tier 1: Per-team allowed-providers (declarative, in team YAML)
  - Counseling Team: [ollama-sovereign]
  - Family-Finance Team: [ollama-sovereign]
  - Church-Ops Team: [ollama-sovereign]
  - Dev/Ops Foundation Team: [ollama-sovereign, claude, gemini]

Tier 2: Per-task classifier (lightweight, runs the 3B router)
  - simple/routine => sovereign team
  - heavy reasoning / architecture / long-context => Claude
  - fresh-knowledge / current-events => Gemini
  - explicit @claude or @gemini token => named vendor
```

Implementation: extend wf27's `classify()` to emit a `provider` field; add an OPA Rego policy that gate-keeps Tier 0 inviolably; let each team's YAML drive Tier 1; let the 3B router model run Tier 2.

---

## G. Low-hanging fruit — the 3-5 most-leveraged pilot demonstrations

### G.1 Pilot 1 — Family Finance Team: Comp-Based Appraisal

- **Industry:** family-finance
- **Use case:** Christina drops two comp prices in Synology Chat. Within 60 seconds, the Family Finance Team produces a per-home appraisal estimate, cap-rate projection, equity-out scenario, and a Council-Chamber-toned reply.
- **LLM team setup:** `qwen2.5:14b-instruct` base; system prompt grounded in jubilee-direction + Holly Hill data path; tools = read /data/finance-events/, compute amortization, read property records, draft a four-section reply (Hear / Mirror / Anchor / Invite per COUNCIL-CHAMBER).
- **Demo outcome:** A real reply to a real ask, with provenance, ntfy-pushed to Christina within a minute, archived as an Event.
- **Stress relief per hour:** Christina's "what do my homes appraise for based on these?" question gets a substantive answer within minutes instead of waiting hours for Darrell to be available. Material reduction in the anxiety-of-not-knowing per ANXIETY-CLARITY-PRINCIPLE.
- **Cost to build:** 1-2 weeks. wf27 routing already exists. Foundation Agent bind-mount fix + per-team config + Holly Hill corpus + tool wiring.

### G.2 Pilot 2 — Dev/Ops Foundation Team: Silent-Failure Surfacing

- **Industry:** infrastructure
- **Use case:** Per the wf30 silent-fail experience that cost 4 hours on 2026-06-01. Foundation Team continuously polls workflow executions per EXECUTION-OUTCOME-OBSERVABILITY. When 3+ consecutive failures of the same workflow with the same error string land, it drafts a Pull Request fix per Aider-style auto-commit-with-revert.
- **LLM team setup:** `qwen2.5:14b-instruct` base; system prompt grounded in PERPETUAL-PIPELINE-HEALTH; tools = read n8n executions, read git diff, propose a fix commit (NOT auto-push; queue for Darrell one-tap approval), run smoke test on a branch.
- **Demo outcome:** A previously silent failure surfaces within 5 minutes, a draft fix appears in a PR within 30 minutes, Darrell approves from ntfy with one tap.
- **Stress relief per hour:** the 4-hour wf30 debug becomes 5 minutes of awareness plus 1 tap. Compounds across every future pipeline issue.
- **Cost to build:** 2-3 weeks. The hardest piece is the Aider-style commit / revert loop wired into n8n.

### G.3 Pilot 3 — Counseling Intake Team: Council Chamber Voice Capture

- **Industry:** counseling
- **Use case:** Family member or future TLC visitor speaks a Council Chamber input. The Counseling Team transcribes (Whisper, sovereign), routes to MODE-ROUTING classifier, mirrors back the Hear / Mirror / Anchor / Invite four-section reply with Scripture per SCRIPTURE-REFERENCE-STANDARD, never leaves the NAS.
- **LLM team setup:** `qwen2.5:14b-instruct` base; system prompt = MIND-OF-CHRIST + Council Chamber four-section template; tools = Whisper transcription, scripture lookup (sovereign Bible API or local data), TTS reply, archive to sovereign storage. Pre-authorized actions: NONE that touch external systems.
- **Demo outcome:** A spoken concern gets a pastoral, scripture-grounded, faith-rooted reply in under 30 seconds. Stays sovereign. Demonstrates the TLC firewall in production.
- **Stress relief per hour:** the family gets a Council Chamber response when Christina is unavailable or when the moment is too small for a clinical session. Demonstrates the "lift the family" half of GOVERNANCE-EXECUTION-ADVISORY.
- **Cost to build:** 3-4 weeks. Whisper integration + Council Chamber prompt + TTS wiring + extensive tone evaluation.

### G.4 Pilot 4 — Church-Ops Team: Sermon Archive + Announcement Drafter

- **Industry:** church-colg
- **Use case:** Bishop Gwin records a sermon. The Church-Ops Team auto-transcribes (Whisper), captions, archives, drafts a one-paragraph member-facing summary, drafts a social media post (subject to staff approval), and updates the public sermon archive. Separately, a deacon types "we need a Wednesday-night announcement about the move-in week meal train"; the team drafts the announcement in three channel formats (SMS, email, app notification) for one-tap approval.
- **LLM team setup:** `qwen2.5:14b-instruct` base; system prompt grounded in COMMUNITY-FIRST-MISSION (extreme accessibility, generation-aware tone); tools = Whisper, sermon archive write, announcement draft, multi-channel format. Pre-authorized: tagging recordings, drafting (NOT sending). Always escalate: sending broadcasts, anything touching giving records.
- **Demo outcome:** The 70-year-old deacon types a half-sentence; the team produces a polished three-channel draft; the deacon taps Approve; the announcement goes out. Demonstrates COMMUNITY-FIRST-MISSION live.
- **Stress relief per hour:** the church's elderly staff stop dreading the technology side of communication. A weekly task that used to be 90 minutes becomes 5 minutes.
- **Cost to build:** 4-6 weeks. Whisper at scale + multi-channel broadcast wiring + extensive accessibility testing per Commitment 2.

### G.5 Pilot 5 — (Stretch) AI-Foundation Daily Health Digest with Pattern Detection

- **Industry:** infrastructure (meta)
- **Use case:** Foundation Team runs nightly. Reads the day's Events (per INSTITUTIONAL-MEMORY-EVENTS). Detects patterns ("3 failures of this class this week," "5 family-voice requests with the same shape this month," "this team has not been called in 14 days — candidate for retirement"). Drafts a Sunday "Foundation Reflection" — a one-pager Darrell can read on Sunday morning.
- **LLM team setup:** `phi-4:14b` or `qwen2.5:14b` base (reasoning emphasis); tools = read Events log, read git log, read team usage stats, draft a one-page Markdown reflection.
- **Demo outcome:** The system tells the family what it has been doing and what it has noticed. Compounds across years. Shows the "self-documenting, self-processing, self-improving" pattern from INSTITUTIONAL-MEMORY-EVENTS.
- **Stress relief per hour:** Darrell stops doing the institutional-memory work in his head. The system holds it.
- **Cost to build:** depends on Events module landing first. Approximately 2-3 weeks after Events ships.

### G.6 Recommended pilot order

1. **Pilot 1 — Family Finance (Comp-Based Appraisal)** — fastest to ship, most immediate family-stress-relief, leverages Christina's already-asked question as the validating demo. Ships in ~2 weeks post-vacation.
2. **Pilot 2 — Dev/Ops Foundation (Silent-Failure Surfacing)** — every other team depends on it. Self-funding (the team prevents the next 4-hour debug). Ships in ~3 weeks parallel to Pilot 1.
3. **Pilot 3 — Counseling Intake (Council Chamber)** — proves the TLC firewall publicly. Required before the Church-Ops team handles any pastoral surface. Ships in ~4 weeks.
4. **Pilot 4 — Church-Ops (Sermon + Announcement)** — community showcase. Anchors the COMMUNITY-FIRST-MISSION. Ships in ~6-8 weeks.
5. **Pilot 5 — Foundation Daily Health Digest** — stretch, contingent on the Events module landing.

---

## The Showcase Recommendation — what poetech.us should SHOW

### One-screen demo of an LLM team doing real work

The poetech.us landing should pivot from "a PWA for a family OS" to "a sovereign LLM team operating a family OS, and a sovereign LLM team for any community that wants one."

**Above-the-fold:** a live tile titled "PoeTech Family Finance Team — running now on the Poe family NAS." Below it: a live count of actions taken in the last 7 days, the team's tools listed, and a fresh-looking redacted excerpt from this week's family-finance digest (with the family's actual private numbers omitted; per DATA-AS-EMPOWERMENT, only the SEED-DATA-AS-ASPIRATION-style aspirational pattern is shown).

**Below the fold (three columns, one per persona):**

- **For families:** "Your AI team. Your data. Your hardware. Three teams, $400 in hardware, ships ready to your door." Link to the PoeTech-in-a-box order form.
- **For churches / communities:** "COLG runs theirs. Your church can run yours." Link to the COMMUNITY-FIRST-MISSION Church Module page. Sermon-archive demo embedded.
- **For small businesses:** "Sovereign AI teams for your work, your customers, your data. No vendor lock-in. No data leaving your office." Link to the pricing tiers.

**Landing copy approach (per the Religion AND Relationship test):**

- The religion (backbone): the seven foundation principles named in one paragraph each. Open-source code linked. The "what we do not do" list (extracted from DATA-AS-EMPOWERMENT anti-patterns 1-5) listed prominently — this is the trust-establishing differentiator.
- The relationship (warmth): the named first community (COLG), Christina's voice as the named first family-voice, Bishop Gwin honored as a person not a logo. The deacon-with-a-flip-phone target user is on the page.

**Demo personas:**

1. **The COLG deacon.** Types one sentence on their phone. Gets a polished three-channel announcement draft in 5 seconds. Taps Approve. The announcement goes out. The page shows the deacon's average weekly time saved.
2. **The Poe-family-style household.** A parent drops a Synology Chat message. The Family Finance Team replies in under a minute with a Council-Chamber-toned answer + a calendar invite to "talk about this together." The page shows the family's average decision-time reduction.
3. **The small-business owner.** Asks the Dev/Ops Foundation Team to detect a silent failure in their accounting workflow. The team finds it, drafts a fix, queues it for the owner's one-tap approval. The page shows the average debug-time reduction.

**The technical-credibility tile:** "Built on Ollama + n8n + your own NAS. Open source. Your data never leaves your hardware. Audit any line of code on GitHub." Three logos linked.

**The trust-credentials tile:** the foundation docs as the third-party audit. Anyone can read them. The transparency IS the credential.

---

## Open Questions for Darrell

These are the genuine forks where the agent should not pre-decide:

1. **Default team count for the first ship.** Recommendation is 4 teams (Dev/Ops Foundation, Family Finance, Counseling Intake, Church-Ops COLG). Confirm or adjust?
2. **YAML allow-list now, OPA Rego when team count > 3.** Confirm acceptable, or do you want to go straight to OPA?
3. **GPU box timing.** Recommendation defers a buy until 3 teams are live and concurrent-user demand can be measured. Comfortable with that or want to spec the box now (likely $1,500-2,500 for a 16-GB-VRAM-class NVIDIA box like an RTX 4060 Ti or used 3090)?
4. **The COLG-first pilot order.** Church-Ops is pilot #4 (~6-8 weeks out). If you want to bump that to pilot #2 to demonstrate COMMUNITY-FIRST-MISSION sooner, the trade-off is slower internal velocity for the first two months. Your call.
5. **The poetech.us pivot.** Recommendation is to rewrite the landing around sovereign-LLM-teams-as-product. Confirm that is the right framing for the public-facing site now, vs. holding for the first team to be live and demonstrable.

---

## Closing

The architecture answer that survives all seven questions:

**Lean two-tier model stack on the current NAS (router + 14B daily-driver + embedder) + supervisor-pattern multi-agent in n8n (wf27 evolved into per-industry dispatch) + per-team YAML config in the WORKFLOW-MODULE-LIBRARY pattern + OPA Rego policy enforcement at workflow-ship time AND runtime via Quality Gatekeeper (wf36) + TLC-firewall-inviolable router for sovereign vs vendor routing + four first-ship teams (Dev/Ops, Family Finance, Counseling, Church-Ops) + PoeTech-in-a-box as the community deliverable + the poetech.us pivot to sovereign-LLM-teams-as-product.**

Every architectural primitive named here already has a foundation-doc anchor. Nothing in this report introduces an unmoored principle. Everything compounds with the work already done.

We all win. We create.

Amen.

---

## Cited Sources (deduplicated)

**Hardware and Ollama on NAS:**
- https://www.storagereview.com/news/synology-ds1621xs-launched
- https://nascompares.com/32gb-64gb-unofficial-memory-guide-for-the-synology-ds1621xs-nas/
- https://needtoknowit.com.au/blog/ollama-on-synology-nas-australia/
- https://needtoknowit.com.au/blog/how-to-run-ollama-on-a-synology-nas-australia-setup-guide/
- https://needtoknowit.com.au/blog/best-nas-for-local-llm/
- https://localaimaster.com/blog/ai-synology-nas-setup
- https://localaimaster.com/blog/ollama-system-requirements
- https://localaimaster.com/blog/small-language-models-guide-2026
- https://www.modemguides.com/blogs/modemguides-blog/best-mini-pc-local-ai-ollama-2026
- https://www.xda-developers.com/ran-ollama-open-webui-on-200-mini-pc-local-ai-stack-actually-works/
- https://www.compute-market.com/blog/home-ai-server-build-guide-2026
- https://ownyourai.dev/hardware/budget-ai-server-build/
- https://toolhalla.ai/blog/home-ai-server-build-guide-2026
- https://secureiot.house/local-ai-home-setup-privacy-family-safety-2026/
- https://ai-coding-flow.com/blog/home-assistant-local-ai-integration-2026
- https://llmhardware.io/guides/home-assistant-ollama-guide

**Models and benchmarks:**
- https://cloudninjas.ca/ai/local-llm-benchmark-2026-comparing-open-source-models-for-ai-inference-on-consumer-hardware/
- https://dev.to/pooyagolchian/local-ai-in-2026-running-production-llms-on-your-own-hardware-with-ollama-54d0
- https://www.sitepoint.com/best-local-llm-models-2026/
- https://www.aitooldiscovery.com/how-to/best-local-llm-models
- https://huggingface.co/blog/daya-shankar/open-source-llms
- https://acecloud.ai/blog/best-open-source-llms/
- https://till-freitag.com/en/blog/open-source-llm-comparison
- https://ollama.com/library
- https://www.morphllm.com/best-ollama-models
- https://insiderllm.com/guides/function-calling-local-llms/
- https://insiderllm.com/guides/structured-output-local-llms/
- https://lmstudio.ai/models
- https://ollama.com/library/phi4-reasoning
- https://ollama.com/library/phi4-reasoning:14b
- https://ollama.com/library/phi4-reasoning:14b-q4_K_M
- https://localaimaster.com/blog/phi-4-local-setup
- https://www.serverman.co.uk/ai/ollama/phi4-on-ollama/
- https://arxiv.org/pdf/2504.21318
- https://huggingface.co/Qwen/Qwen2.5-14B-Instruct
- https://huggingface.co/Qwen/Qwen2.5-14B-Instruct-1M
- https://qwen.readthedocs.io/en/v2.5/benchmark/speed_benchmark.html
- https://qwen.readthedocs.io/en/latest/getting_started/speed_benchmark.html
- https://willitrunai.com/blog/qwen-2-5-coder-14b-vram-requirements
- https://www.hardware-corner.net/llm-database/Qwen/
- https://unsloth.ai/docs/models/qwen3.5
- https://unsloth.ai/docs/models/qwen3.6
- https://www.sitepoint.com/deepseek-r1-local-deployment-guide-2026/
- https://www.aitooldiscovery.com/how-to/run-deepseek-r1-locally
- https://www.sitepoint.com/1500-local-ai-setup-deepseek-r1-consumer-gpu/
- https://groundy.com/articles/running-deepseek-r1-locally-hardware-requirements-quantization-and-real-throughput/
- https://digitalspaceport.com/running-deepseek-r1-locally-not-a-distilled-qwen-or-llama/
- https://deepseekai.guide/guides/deepseek-system-requirements/
- https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-14B
- https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B
- https://huggingface.co/Mungert/DeepSeek-R1-Distill-Qwen-14B-GGUF
- https://artificialanalysis.ai/models/comparisons/gemma-3-27b-vs-llama-3-3-instruct-70b
- https://onyx.app/self-hosted-llm-leaderboard
- https://www.promptquorum.com/power-local-llm/best-local-models-tool-calling-2026
- https://dubesor.de/benchtable
- https://computingforgeeks.com/ollama-models-cheat-sheet/
- https://github.com/ggml-org/llama.cpp/discussions/4167
- https://github.com/ggml-org/llama.cpp/discussions/16578
- https://openbenchmarking.org/test/pts/ollama

**Embedding models:**
- https://ollama.com/library/nomic-embed-text
- https://ollama.com/library/nomic-embed-text-v2-moe
- https://ollama.com/library/mxbai-embed-large
- https://www.morphllm.com/ollama-embedding-models
- https://collabnix.com/ollama-embedded-models-the-complete-technical-guide-for-2025-enterprise-deployment/
- https://zc277584121.github.io/rag/2026/03/20/embedding-models-benchmark-2026.html
- https://mixpeek.com/curated-lists/best-embedding-models
- https://pecollective.com/tools/best-embedding-models/
- https://milvus.io/blog/choose-embedding-model-rag-2026.md
- https://elephas.app/blog/best-embedding-models
- https://www.promptquorum.com/power-local-llm/best-embedding-models-local-rag-2026
- https://knowledgesdk.com/blog/open-source-embedding-models-rag-2026
- https://www.tigerdata.com/blog/finding-the-best-open-source-embedding-model-for-rag

**RAG / fine-tuning / prompt strategy:**
- https://orq.ai/blog/finetuning-vs-rag
- https://dev.to/umesh_malik/rag-vs-fine-tuning-for-llms-2026-what-actually-works-in-production-10if
- https://umesh-malik.com/blog/rag-vs-fine-tuning-llms-2026
- https://dev.to/muzammil_endevsols/rag-vs-fine-tuning-vs-prompting-2026-strategic-guide-169l
- https://bigdataboutique.com/blog/fine-tuning-llms-when-rag-isnt-enough
- https://b-eye.com/blog/rag-vs-fine-tuning/

**n8n / LangGraph / multi-agent patterns:**
- https://strapi.io/blog/build-ai-agents-n8n
- https://www.alexanderharte.com/n8n-ai-agents-workflows-guide/
- https://medium.com/@angelosorte1/multi-agent-orchestration-with-n8n-in-2026-from-concept-to-real-world-ai-systems-bae68fa7ba03
- https://www.ai.cc/blogs/what-is-n8n-automation-guide-2026/
- https://ideaforgestudios.com/2026/04/01/the-power-of-agentic-ai-orchestrating-multi-agent-ai-workflows-with-n8n-for-unrivaled-automation/
- https://hatchworks.com/blog/ai-agents/multi-agent-solutions-in-n8n/
- https://ai-agent-ops.com/build-ai-agents/ai-agent-with-n8n
- https://reference.langchain.com/python/langgraph-supervisor
- https://callsphere.ai/blog/langgraph-supervisor-multi-agent-orchestration-2026
- https://shafiqulai.github.io/blogs/blog_15.html
- https://www.lifetideshub.com/docs/langgraph-multi-agent-orchestration/
- https://eastondev.com/blog/en/posts/ai/20260512-langgraph-multi-agent-supervisor/
- https://dev.to/focused_dot_io/multi-agent-orchestration-in-langgraph-supervisor-vs-swarm-tradeoffs-and-architecture-1b7e
- https://focused.io/lab/multi-agent-orchestration-in-langgraph-supervisor-vs-swarm-tradeoffs-and-architecture
- https://medium.com/@michael.hannecke/the-model-router-running-a-team-of-local-llms-instead-of-one-big-one-fd75eeec9d39

**Inference engines:**
- https://codersera.com/blog/ollama-vs-lm-studio-vs-vllm-vs-llama-cpp-vs-mlx-2026/
- https://developers.redhat.com/articles/2025/09/30/vllm-or-llamacpp-choosing-right-llm-inference-engine-your-use-case
- https://www.glukhov.org/llm-hosting/comparisons/hosting-llms-ollama-localai-jan-lmstudio-vllm-comparison/
- https://www.aimadetools.com/blog/ollama-vs-llama-cpp-vs-vllm/
- https://thushan.github.io/olla/compare/litellm/
- https://winder.ai/llmops-tools-comparison-open-source-llm-production-frameworks/
- https://www.decodesfuture.com/articles/llama-cpp-vs-ollama-vs-vllm-local-llm-stack-guide
- https://www.spheron.network/blog/ollama-vs-vllm/
- https://dev.to/thurmon_demich/ollama-vs-llamacpp-vs-vllm-which-should-you-use-in-2026-10gp

**Routing / cost / privacy-aware routing:**
- https://atalupadhyay.wordpress.com/2026/05/06/the-llm-cost-ladder-when-to-use-local-models-vs-paying-for-gpt-5-5/
- https://www.anyscale.com/blog/building-an-llm-router-for-high-quality-and-cost-effective-responses
- https://www.clawrouters.com/blog/best-llm-routers-2026
- https://www.edenai.co/post/best-llm-routers
- https://dev.to/lightningdev123/best-ai-gateway-tools-in-2026-for-scalable-llm-applications-4dg
- https://arxiv.org/pdf/2502.16696
- https://arxiv.org/pdf/2507.15553
- https://dev.to/micelclaw/pii-aware-routing-how-to-use-cloud-ai-and-keep-your-sensitive-data-local-1m40
- https://www.sitepoint.com/hybrid-cloudlocal-llm-the-complete-architecture-guide-2026/
- https://arxiv.org/pdf/2603.28972
- https://arxiv.org/pdf/2511.22788
- https://arxiv.org/pdf/2508.16765
- https://tianpan.co/blog/2026-04-20-privacy-preserving-inference-production-llm

**Agent governance / guardrails / pre-authorized actions:**
- https://arxiv.org/html/2603.20953v1
- https://aport.io/blog/best-ai-agent-guardrails-2026-pre-action-authorization-compared/
- https://blog.gitguardian.com/ai-agents-authentication-how-autonomous-systems-prove-identity/
- https://atlan.com/know/ai-agent-risks-guardrails/
- https://wandb.ai/site/articles/guardrails-for-ai-agents/
- https://www.reco.ai/hub/guardrails-for-ai-agents
- https://github.com/microsoft/agent-governance-toolkit
- https://www.strata.io/glossary/agent-authentication/
- https://github.com/caramaschiHG/awesome-ai-agents-2026
- https://www.openpolicyagent.org/
- https://www.openpolicyagent.org/docs
- https://github.com/open-policy-agent/opa
- https://codilime.com/blog/why-use-open-policy-agent-for-your-ai-agents/
- https://gokhan-gokalp.com/runtime-governance-for-ai-agents-policy-as-code-with-opa/
- https://www.firefly.ai/blog/building-with-open-policy-agent-opa-for-better-policy-as-code
- https://www.wiz.io/academy/application-security/open-policy-agent-opa
- https://oneuptime.com/blog/post/2026-01-26-open-policy-agent-guide/view
- https://devops.com/what-is-opa-open-policy-agent/
- https://devsecopsschool.com/blog/open-policy-agent/

**Coding agents / Aider / smolagents:**
- https://aider.chat/
- https://aider.chat/docs/git.html
- https://aider.chat/docs/config/options.html
- https://aider.chat/HISTORY.html
- https://computingforgeeks.com/aider-cheat-sheet/
- https://devstarsj.github.io/ai-tools/2026-04-11-Aider-AI-Coding-Assistant-Complete-Guide-2026/
- https://www.nxcode.io/resources/news/aider-complete-tutorial-guide-install-setup-2026
- https://www.aitoolcurator.com/ai-tools/development-coding/aider/
- https://github.com/Aider-AI/aider
- https://www.deployhq.com/guides/aider
- https://huggingface.co/docs/smolagents/en/tutorials/secure_code_execution
- https://huggingface.co/docs/smolagents/en/index
- https://huggingface.co/docs/smolagents/v1.23.0/en/tutorials/secure_code_execution
- https://huggingface.co/docs/smolagents/v1.13.0/en/tutorials/secure_code_execution
- https://huggingface.co/docs/smolagents/v1.1.0/en/guided_tour
- https://huggingface.co/blog/smolagents
- https://github.com/huggingface/smolagents
- https://smolagents.org/
- https://medium.com/@danushidk507/exploring-smolagents-building-intelligent-agents-with-hugging-face-983969ec99a9
- https://www.deeplearning.ai/courses/building-code-agents-with-hugging-face-smolagents

**Vertical AI / specialized industries / church + community tech:**
- https://www.intelegain.com/slms-vs-llms-in-2026-why-businesses-are-choosing-smaller-specialized-ai-models/
- https://therecursive.com/vertical-ai-investment-why-specialized-ai-is-winning-in-2026/
- https://www.splunk.com/en_us/blog/learn/small-language-models-slms.html
- https://www.cbinsights.com/research/report/small-language-model-gain-momentum/
- https://www.turing.com/resources/vertical-ai-agents
- https://qubit.capital/blog/rise-vertical-saas-sector-specific-opportunities
- https://www.allganize.ai/en/blog/embracing-the-future-of-finance-with-allganize-finance-13b-a-specialized-small-language-model
- https://churchtechtoday.com/church-technology-trends-2026-how-ai-is-transforming-ministry/
- https://tech.churchofjesuschrist.org/wiki/Using_Accessibility_Technology
- https://dl.acm.org/doi/10.1145/3700794.3700803
- https://community.openhab.org/t/revisiting-local-llm-powered-voice-assistants-in-2026/168251

**SMB / family AI automation / cost references:**
- https://noimosai.com/en/blog/6-best-ai-agents-for-business-automation-in-2026-the-ultimate-guide-to-scaling-your-business
- https://adevs.com/blog/ai-agent-integration-cost-small-business/
- https://arahi.ai/blog/best-ai-agents-for-business-2026
- https://wearepresta.com/profitable-ai-business-ideas-2026-strategies-for-sustainable-growth/
- https://www.lindy.ai/blog/best-ai-agents-small-business
- https://www.nice.com/agentic-ai/agentic-ai-tools
- https://neuwark.com/blog/ai-for-small-business-2026-complete-guide
- https://www.siit.io/blog/best-ai-agent-platforms-small-business
- https://capsulecrm.com/blog/ai-small-business-ideas/
- https://blog.coupler.io/ai-tools-for-small-businesses-and-startups/
- https://www.home-assistant.io/integrations/ollama/
- https://ghost.codersera.com/blog/openclaw-with-ollama-run-personal-ai-assistant-local-models/

**Other LLM news:**
- https://www.turing.com/resources/top-llm-trends
- https://www.assemblyai.com/blog/llm-use-cases
- https://llm-explorer.com/static/llm-news/
- https://llm-stats.com/ai-news
- https://fazm.ai/blog/new-llm-releases-april-2026
