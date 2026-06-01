# Responsiveness + Query Performance Architecture

**Triggered by Darrell, 2026-05-29 from vacation:**

> "We need to make sure that the way this is built it can still be fast. We have a lot of perspectives however can the Ai source files and answer the questions within a short period of time. If a user asks a question it should be answered based on their data however we need to be able to collect process and output data in the highest quality not missing the calculations to give the best possible outcome based on the constraints."

The honest concern: tonight we've drafted 7 foundation docs + 11 session notes + 9 workflow JSONs + the existing 60+ files in the repo. If every query requires loading and reasoning across all of it, the system gets slow + expensive + the user experience degrades. Speed + quality + accuracy are NOT trade-offs — they're three legs of a stool, and the architecture below keeps all three load-bearing.

## The principle

**Every user query gets the smallest amount of context the right answer requires + the cheapest model that produces quality output + the fastest path to a streaming response — while never skipping calculations needed for accuracy.**

Speed is a feature. Quality is a feature. The pattern below makes both achievable simultaneously, NOT either-or.

## The five-layer responsiveness architecture

### Layer 1 — Query router (sub-second)

Every user query first hits a fast classifier (Ollama 3b, sub-200ms typical). The classifier decides:

- **Routine data lookup** (e.g., "what's my buffer fund balance?") → direct workflow call, no LLM needed for the answer itself, just for query understanding
- **Pattern question** (e.g., "how has my tithe consistency changed?") → workflow lookup + small model formatting
- **Cross-document reasoning** (e.g., "given my profile, what services would fit me?") → workflow chain (Layers 1-3 of data-dump) + Ollama 14b
- **Strategic / advisory question** (e.g., "should I increase my mortgage payment by $200?") → cross-doc reasoning + Claude for the substantive answer

Routing happens BEFORE expensive work starts. Fast routing = fast time-to-first-token.

### Layer 2 — RAG retrieval (sub-second)

All foundation docs + session notes + workflow JSONs + project documentation are pre-embedded via nomic-embed-text (already loaded on the NAS per the SYSTEM-SKILLS-INVENTORY, currently unused). Stored in a vector index (pgvector once Phase 2 Postgres ships; in-memory FAISS or similar in the interim).

For any query that needs document context, the router runs a semantic similarity search and returns the TOP K=5-10 most relevant chunks. NOT the entire corpus. NOT every foundation doc loaded into context.

This is the SINGLE biggest leverage point for keeping the system fast as the doc corpus grows. Without RAG: every query pays the cost of loading 100KB+ of foundation content. With RAG: every query loads ~5-10KB of just-the-relevant chunks.

### Layer 3 — Tiered model selection (size-matched to task)

Per existing AI-TEAM-DISTRIBUTION:

- **Ollama 3b** — classification, simple formatting, sub-second responses
- **Ollama 14b** — substantive responses, 3-10s typical
- **Claude API** — frontier capability, 5-15s, used ONLY when 14b is insufficient
- **Gemini API** — bulk reasoning + grounded current-events, similar latency to Claude

Per-query budget cap: routine queries default to Ollama (free, fast). Claude budget is governed (target $X/day; surface when approaching).

### Layer 4 — Streaming responses (perceived speed)

Every long-running response streams to the user as it generates. User sees output starting in <2 seconds even if the full response takes 15. Perceived speed dominates actual speed for user experience.

PWA UI surfaces partial responses with the standard "thinking" indicator until the full response lands. User can read what's already there.

### Layer 5 — Pre-computed answers + caching

Common queries get pre-computed answers refreshed on a schedule:

- "What's my net worth?" → computed nightly, cached, served instantly
- "How did my last month look?" → computed daily, cached, served instantly
- "What's the family's collective wellness trend?" → computed weekly, cached

Query router checks cache first. Cache miss → live computation. Cache hit → sub-100ms response.

## Response-time SLAs (proposed; binding per PERPETUAL-PIPELINE-HEALTH extension)

| Query type | P50 target | P95 target | Hard timeout |
|---|---|---|---|
| Cached/pre-computed lookup | <100ms | <500ms | 2s |
| Direct data query (workflow 18 style) | <500ms | <2s | 10s |
| Pattern question (small-model formatted) | <3s time-to-first-token | <8s full | 30s |
| Cross-doc reasoning (Ollama 14b) | <5s time-to-first-token | <15s full | 60s |
| Strategic / Claude-tier | <8s time-to-first-token | <30s full | 120s |

These are the standard. Quality Gatekeeper (Role 10) checks new queries against the SLA. Workflows that consistently miss SLA get optimized or downgraded.

## The eight rules for staying fast at scale

### Rule 1 — Load only what's needed for THIS query

Never load "all foundation docs" or "all session notes" into context. RAG retrieves the TOP K most relevant chunks per query. The system's growing knowledge base is a strength, not a tax.

### Rule 2 — Right-size the model to the task

Don't use Claude for "what's my buffer fund balance" — Ollama 3b + a workflow call answers in 1s for $0. Don't use Ollama 3b for "given my financial profile, draft a stewardship plan for the next year" — that's a Claude-tier task.

### Rule 3 — Pre-compute the predictable

Net worth, monthly summaries, trend lines, common dashboard metrics — pre-compute via cron, cache, serve instantly. The PWA dashboard should never wait for live calculation.

### Rule 4 — Stream every response longer than 2 seconds

Don't make the user stare at a spinner. Show tokens as they generate. Perceived speed compounds into trust.

### Rule 5 — Skip nothing that affects accuracy

Speed at the cost of accuracy is a failure. If a stewardship calculation requires loading the user's full transaction history + applying the rules engine + checking against foundation principles — do all of it. Optimize HOW it happens (parallelize, cache intermediates, smart prompts), not WHETHER it happens.

### Rule 6 — Measure every query

Log: query text, query class, retrieval time, model used, generation time, total time, token count, satisfaction (when measurable). Foundation Agent + Quality Gatekeeper review weekly: which queries are slow? Which are missing SLA? Tune those.

### Rule 7 — Index update on every commit

When a new foundation doc or session note lands in the repo, the embedding index updates automatically (workflow triggered by GitHub webhook or daily cron). Stale indexes mean stale retrieval. Fresh indexes mean accurate context.

### Rule 8 — Fail fast, recover gracefully

If a model times out or an external service is unreachable, the system returns a clear "I couldn't answer this in time — here's what I have so far" response, NOT a silent hang. Per PERPETUAL-PIPELINE-HEALTH Rule 2 (graceful degradation).

## What this means for tonight's work specifically

The 7 new foundation docs + 11 session notes drafted tonight are STRENGTH, not burden, ONCE the RAG layer is in place. Without RAG, they'd be a burden. The architecture below makes the corpus a strength:

**Phase 0 (immediate, post-vacation Week 1):**

- Stand up nomic-embed-text indexing of all foundation docs + session notes. Workflow that watches `docs/00-foundations/_root/` + `docs/99-session-notes/` and re-embeds on change.
- Add a vector-search endpoint to n8n (workflow 69, new) — query in, top-K chunks out.

**Phase 1 (Week 2-3):**

- Foundation Agent + briefing endpoint upgraded to use RAG: instead of returning the full inbox + full state to every Claude session, return the QUERY-SPECIFIC slice + the top-K relevant foundation chunks.
- Quality Gatekeeper (workflow 36) upgraded similarly — instead of loading every foundation principle to check a PR, retrieve only the relevant ones for the PR's diff.

**Phase 2 (Month 2):**

- Pre-computed answers for common dashboard queries.
- Per-query telemetry surfacing in a Foundation Agent ops dashboard.
- Cache warming for common queries on a schedule.

**Phase 3 (Month 3+):**

- Custom fine-tuned classifier on user-data queries (Ollama 3b fine-tuned on the actual query patterns).
- Migration to Postgres + pgvector (Phase 2 of n8n scaling plan) for proper vector storage.
- Streaming response support end-to-end (PWA + n8n + LLM).

## The decisions, with their rationale

### Decision 1 — Use RAG over "always load all foundations"

**We chose:** retrieval-augmented generation with nomic-embed-text + top-K retrieval per query.

**We did NOT choose:** loading all foundation docs + session notes into every LLM call.

**Because:** Foundation corpus grows over time (we added 7 docs tonight alone; we'll have 30+ within a year). Loading all of it per query would cost more tokens than the actual answer + slow the system to a crawl. RAG is the standard architecture for this exact problem; nomic-embed-text is already loaded on the NAS; the only reason it's unused is the indexing layer hasn't shipped. Building it now keeps the system fast at any corpus size.

### Decision 2 — Tiered models (3b/14b/Claude) rather than always-Claude

**We chose:** classify each query, route to the smallest model that produces quality output.

**We did NOT choose:** route every query to Claude for "best quality."

**Because:** Claude is expensive ($3/MTok in, $15/MTok out for Sonnet) AND slower than Ollama. Routing every query through Claude would cost $X00/mo or more at meaningful family volume + every query would have cloud-network latency. Tiered routing means routine queries cost $0 and respond in <1s while Claude is reserved for queries that genuinely need frontier capability. Per AI-TEAM-DISTRIBUTION — right tool for right job.

### Decision 3 — Pre-compute predictable answers; live-compute exploratory

**We chose:** cache + refresh on schedule for known queries; live-compute for novel queries.

**We did NOT choose:** live-compute everything OR cache everything.

**Because:** Cache-everything stales fast + becomes wrong; live-compute-everything wastes resources on predictable answers. The hybrid serves the dashboard (predictable, must-be-fast) AND the user's novel questions (exploratory, must-be-accurate) appropriately.

### Decision 4 — Streaming responses by default

**We chose:** every response longer than 2 seconds streams tokens to the user as they generate.

**We did NOT choose:** batch responses where the user waits for the full answer.

**Because:** Perceived speed dominates actual speed for user trust. A 15-second streaming response feels faster than a 5-second batch response because the user sees motion + can start reading immediately. PWA UI patterns + n8n's streaming support both make this technically straightforward.

### Decision 5 — Quality is never sacrificed for speed; speed is achieved through architecture

**We chose:** architectural optimization (smaller context, smaller models for small tasks, parallelize, cache) to achieve speed.

**We did NOT choose:** skipping calculations to be fast.

**Because:** Per Darrell's framing explicitly: "highest quality not missing the calculations." The architecture above achieves speed BY routing intelligently, NOT by cutting corners on the actual work. A query about the user's financial situation gets the full computation; the optimization is in HOW the computation happens, not WHETHER it happens.

## Connection to other foundations

- **AI-FOUNDATION-INTERNAL-OPERATIONS** — the system operates itself; the RAG layer is the foundation's memory architecture made operational.
- **PERPETUAL-PIPELINE-HEALTH** — response-time SLAs become Rule 14 of the resilience standard. Slow workflows fail SLA = workflow gets fixed or retired.
- **QUALITY-OF-LIFE-AS-NORTH-STAR** — slow responses degrade QoL; fast accurate responses serve it. The QoL question applies to performance, not just feature scope.
- **DATA-AS-EMPOWERMENT-NOT-EXTRACTION** — query speed must not be achieved by cutting data the user owns out of the loop. Their data is always considered; the architecture decides how efficiently to consider it.
- **BUSINESS-PROCESS-CONNECTIONS** — every user-facing surface promises a response time implicitly. The SLA discipline is the binding promise.
- **EXCELLENCE-STANDARD** — religion AND relationship. Religion = the SLA + measurement + architecture rigor. Relationship = the user experiencing the system as responsive without surrendering accuracy.

## Closing

Speed + quality + accuracy together — achieved by architecture, not by trade-off. The growing foundation corpus is leverage when indexed properly. The right model for the right query keeps cost + latency in check. The user experiences a system that answers their questions promptly + completely.

The next post-vacation Week 1 priority list should include "RAG indexing + vector search workflow" alongside the existing Phase 1 security work. Without it, the doc corpus we've grown tonight becomes a tax on every interaction.

We all win. We create. Amen.
