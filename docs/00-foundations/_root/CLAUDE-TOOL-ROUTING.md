# Claude Tool / Model Routing

**Layer 3 (reference) per the ICM hierarchy declared in `CLAUDE.md`.** A foundation document the agent loads before generating routing decisions. Added 2026-06-02 (Maui), at Darrell's go-ahead, so future sessions and the governance review have one canonical source for "which Claude tool do I use when, and how do I burn tokens efficiently."

This document does NOT improvise its rules. It synthesizes from five existing sources (named in Section 8) and extends them; where it restates a source it cites the source rather than duplicating it. The model names below (Claude Opus 4.7 / Sonnet 4.6 / Haiku 4.5; Gemini 3.x / 2.5; Ollama Qwen 2.5) reflect the 2026-05-27 research snapshot in the primary source. Model tiers advance — Opus 4.8 already exists as of this writing — but the routing *logic* is model-agnostic: it routes by task class and sensitivity, not by version number. When a newer model ships, slot it into the same tier; the rules do not change.

---

## 1. Purpose

This document governs two related but distinct decisions every PoeTech agent session makes constantly: (axis A) **which model** to call to do a piece of reasoning, and (axis B) **which agent tool** to call it with. It also states the **token-efficiency posture** that sits on top of both — the standing defaults that keep a session lean, fast, and cheap without sacrificing correctness. It exists because these decisions were previously scattered across a research-review, a consolidated extract, a Cowork workflow review, an internal-operations foundation doc, and seven memory files. Future sessions should not re-derive them; they should read this and act.

This document does NOT cover **workflow content design** — what a counseling reply says, how an intake classifier routes a user, what a sermon-pipeline stage produces. That lives in `COUNCIL-CHAMBER.md`, `MODE-ROUTING.md`, `INTAKE-AND-FIT.md`, and the per-module specs. It does NOT cover the *governance* policy itself (who may authorize what) — that lives in `GOVERNANCE-EXECUTION-ADVISORY.md` and, once materialized, the NAS-resident Open Policy Agent Rego files per `project-nas-as-governance-point`. This document is the operational layer beneath those: given that the work is approved and the content is designed, *how does the agent actually pick the model and the tool, and how does it avoid wasting tokens doing so.*

---

## 2. The two-axis decision

Two questions get conflated and must not be. They are different decisions, governed by different rules, and both are always required for any non-trivial unit of work.

**Axis A — WHICH MODEL.** Should this reasoning run on a sovereign Ollama model on the NAS, on Claude (vendor), or on Gemini (vendor)? This is a *sensitivity-and-task-class* decision. It is governed by the Tier 0 / Tier 1 / Tier 2 routing policy (Section 3), and its hard override is the TLC firewall. The model is the brain doing the thinking.

**Axis B — WHICH AGENT TOOL.** Through what mechanism does the agent act — a Dispatch orchestration, a Code Task, a Cowork sub-task, Chrome MCP, computer-use, a dedicated MCP server, the Bash sandbox, a PowerShell paste to Darrell? This is a *capability-and-isolation* decision. It is governed by the agent-tool hierarchy (Section 4). The tool is the hands doing the acting.

The two are orthogonal. A Code Task (axis B) might call Claude *or* a sovereign model (axis A) to generate the diff. A Cowork sub-task (axis B) doing current-events research might prefer Gemini grounding (axis A). The TLC firewall on axis A constrains axis B — clinical content forces an Ollama-only model AND forbids any cloud round-trip, which in turn forbids tools that would egress the content. But within those constraints, pick each axis on its own merits. Naming the layer you are deciding ("this is an axis-A model choice" / "this is an axis-B tool choice") prevents the common error of reaching for a tool because of a model preference, or a model because of a tool habit.

---

## 3. Axis A: Model routing

The model-routing policy is a three-tier escalation ladder. The default is sovereign; vendor LLMs are *explicit escalation only*. This is the operational form of `project-sovereign-llm-teams-per-industry` ("LLMs do the work; humans govern") and `project-nas-as-governance-point` ("the NAS holds the governance state; vendor LLMs consult it"). The tier structure is from the consolidated extract's routing block (`docs/99-session-notes/2026-06-02-consolidated-ai-work-processes-repos-skills-extract.md`, the `routing:` YAML); the per-task assignments are from the Gemini-vs-Claude research §5–§6.

### Tier 0 — Sovereign by default (Ollama on the NAS)

Tier 0 is the default destination for everything. Routine code execution, text generation, classification, tagging, summarization, RAG retrieval, the day-to-day pipeline work — all of it runs on the sovereign stack on the DS1621xs: Qwen 2.5 14B as the daily-driver, a 3B router/classifier (phi-3-mini / llama-3.2:3b) as the always-warm front door, nomic-embed-text for embeddings. This is not a fallback; it is the home base. Per `project-cost-discipline-with-growth-permission`, the sovereign path is $0 marginal cost and keeps the family's data on the family's hardware. An agent does not escalate off Tier 0 simply because a vendor model would be marginally better — it escalates only when the task class genuinely demands it (Tier 2) or a human explicitly invokes a vendor (Tier 1 token).

### Tier 1 — Explicit escalation (the `@claude` / `@gemini` tokens, and per-team allow-lists)

Vendor LLMs are reached two ways, both explicit. First, a user or upstream workflow includes an explicit escalation token — `@claude` routes to Claude, `@gemini` routes to Gemini. Second, each per-industry team carries an `allowed_providers` list (the per-team config in the consolidated extract); a team may only call providers on its list. The Counseling team's list is `[ollama]` and nothing else — it structurally cannot escalate. The Dev/Ops and Family-Finance teams may carry Claude or Gemini on their lists for the heavy moments, but still default to sovereign for routine work.

### Tier 2 — The task-class classifier (strategic-reasoning escape hatch)

When no explicit token is present, the Tier 2 classifier decides whether the task class itself justifies a vendor call. The routes (from the consolidated extract):

- `simple OR routine` → sovereign team (stay on Tier 0)
- `heavy_reasoning OR architecture OR long_context` → Claude
- `fresh_knowledge OR current_events` → Gemini (Google Search grounding is first-class)
- `explicit_@claude_token` → Claude
- `explicit_@gemini_token` → Gemini

Tier 2 is the escape hatch, not the highway. Most tasks resolve to "simple OR routine" and never leave the NAS.

### The routing table (task type → reasoner → why)

This maps the Gemini-vs-Claude research §5 + the hybrid router proposal in §6 onto the tier ladder. It is the concrete answer to "what runs where."

| Task type | Reasoner | Tier | Why |
|---|---|---|---|
| Narrow tagging / classification | Ollama (Qwen 2.5) on NAS | 0 | Free, fast, on-LAN; good enough; no egress |
| High-volume low-stakes transforms (CSV cleanup, batch summarization of public data) | Ollama | 0 | API cost would compound; sovereign is $0 marginal |
| Routine code execution / text generation in the pipeline | Ollama | 0 | The day-to-day; the whole point of the sovereign teams |
| RAG retrieval + embedding | Ollama (nomic-embed) + Qdrant | 0 | Corpus stays NAS-resident; vendor embedding APIs are lock-in |
| **TLC clinical content (PHI, member sessions, intake notes)** | **Ollama ONLY** | **0 (firewalled)** | **Sovereignty non-negotiable; see the firewall override below** |
| Code that must compile / pass tests | Claude (Sonnet 4.6; Opus tier for the hardest) | 2 | Anthropic benchmarks ahead on sustained agentic coding |
| Multi-turn design dialogue, constraint-tracking | Claude (Sonnet 4.6) | 2 | Tone, follow-through, no context-hallucination |
| Architecture / heavy reasoning / strategic one-offs | Claude (Opus tier) | 2 | The strategic escape hatch; e.g. this very document |
| Long-context burst (1M-token reads) | Gemini (3.x / 2.5 Pro) | 2 | 1M+ window cheaper per token than equivalent Claude |
| Current-events / fresh-web / grounded research | Gemini (2.5 Pro / 3.x Flash + Google Search grounding) | 2 | Grounding is a first-class API tool; genuinely fresher |
| Batch / overnight async generation | Either vendor's Batch API | 2 | 50% off, async; route by which reasoner suits the content |
| Air-gapped scenarios (ISP down, power event) | Ollama | 0 | The only thing that still works; sovereignty pays off |

The honest read from the research §1 carries forward: the "Claude doesn't know about X" intuition is usually an *absence-of-live-search* problem, not a knowledge-cutoff problem. Base-model cutoffs across Claude and Gemini are within a few months of each other. So "route to Gemini for freshness" means "route to Gemini *with Google Search grounding on*" — the grounding is the win, not the base model.

### The cost guardrail

Per the research §8 and `project-cost-discipline-with-growth-permission`: combined vendor LLM spend (Claude + Gemini metered) carries a **$25/month soft cap with an email/ntfy alert** and a **$50/month hard stop that triggers manual review**. The soft cap is a signal to check whether routine work is wrongly escalating off Tier 0; the hard stop is a circuit breaker. The sovereign-first default is what keeps spend under these numbers in the normal case — every task correctly held on Tier 0 is a task that costs nothing. There is no live cost dashboard yet (see Section 7); until there is, the caps are enforced by routing discipline plus the per-team `allowed_providers` lists, and grounded-query counts must be logged in the n8n layer so the bill cannot surprise (research §8.6). One sovereignty footgun to never trip: the **Gemini free tier trains on your content**. Vendor Gemini is paid-tier-only for any PoeTech content, even "harmless" logistics (research §3).

### The TLC firewall — absolute override

This overrides everything above. **Clinical / therapy / counseling content NEVER routes to any cloud reasoner — not Claude, not Gemini — regardless of any `@claude` or `@gemini` token, regardless of task class, regardless of who asked.** The Tier 0 sensitivity firewall is `fail_closed`: a regex on the NAS (`tlc|therapy|counsel|clinical|patient|client session|christina'?s clinical|...`) pre-filters before any vendor API call, and if the content matches, the call never leaves the NAS. The Counseling team's `allowed_providers` is `[ollama]` and its `bright_line_overrides` names `tlc_clinical_data`. An explicit escalation token does not lift this; the firewall is senior to the token. This is the inviolable line from the research §3 ("Neither cloud is acceptable for TLC clinical content on default terms; Ollama is the only acceptable option") and the per-team config in the consolidated extract ("Pilot 3 — Council Chamber. NEVER routes to vendor LLMs. TLC firewall is inviolable."). If an agent is ever uncertain whether content is clinical, it treats the content as clinical and stays sovereign. Fail closed.

---

## 4. Axis B: Agent-tool routing

This is the in-session decision: through which tool does the agent act. The rules below are drawn from the Tina-Huang Cowork review (§2.10, §6.3), the AI-Foundation-Internal-Operations binding rule, the system-reminder tool hierarchy, and hard-won session experience (the examples in Section 6).

### Dispatch as orchestrator — never the worker

**Binding: the main Dispatch session never does substantive work itself. Every build, every multi-step task, every thing that ends in a commit lands in a Code Task or a Cowork sub-task.** Dispatch is the conductor; it decides what work exists, spawns the right sub-task to do it, and synthesizes the results. It does not write the code in its own context, does not do the long research in its own context, does not hold the large file reads in its own context. Why: the orchestrator's context is the most expensive and most-reused context in the session — every token it holds is re-read on every subsequent turn. Pushing the actual work into a sub-task keeps the orchestrator lean and lets sub-tasks run in parallel and in isolation. This is the ICM "single orchestrating agent reading the right files at the right time" pattern (consolidated extract G1) applied to the session itself, and it mirrors Tina Huang's "Cowork-as-orchestrator is fine; Cowork-as-the-only-executor is not" (Tina review §5.7).

### Code Task vs Cowork sub-task

The split is about whether the work ends in a commit and needs repo + git isolation.

- **Code Task** = repo-rooted work with git and worktree isolation. Use it for anything that ends in a commit: editing workflow JSON, writing a foundation doc, fixing a bug, scaffolding a module, applying a patch. The Code Task gets its own worktree so parallel tasks do not collide on the index (this also sidesteps the Two-Session Git Race; see `CLAUDE.md`). **Default to Code Task for anything that ends in a commit.**
- **Cowork sub-task** = research, web fetching, and non-repo writing. Use it for current-events research, reading external sources, drafting a research-review that *will* land in the repo but whose work is mostly web + synthesis, browser-driven information gathering. A Cowork sub-task can still produce a file that gets committed — but if the *dominant* activity is repo+git, prefer a Code Task; if the dominant activity is web+research+synthesis, prefer Cowork.

When a build is "complex" enough that Cowork bumps a scope ceiling, hand it to a Code Task instead — Tina Huang explicitly does this ("for more complex builds, Tina hands the PRD to Claude Code instead of Cowork"; Tina review §2.10), and it is a tell that the work needs the repo-and-git substrate.

### The web/desktop tool hierarchy: dedicated > Chrome > computer-use

From the system-reminder tool tiers, this ordering is binding:

1. **Dedicated MCP for the app** — if the target app has its own connected MCP (Slack, Gmail, Calendar, Linear, a registrar API, the n8n REST API, the Synology API), use it. API-backed tools are fast, precise, and do not break when a UI changes. This is also the `AI-FOUNDATION-INTERNAL-OPERATIONS` rule restated: "anything that is a click today should be an API call tomorrow. Browsers are for humans deciding things, not for systems doing things." The first question before driving any browser is always "is there an API for this?"
2. **Chrome MCP** — for any web target that has no dedicated MCP. DOM-aware, far faster than clicking pixels. Use it for inspecting a running config, scraping a web UI, navigating a dashboard that has no API.
3. **computer-use** — only for native desktop apps and cross-app workflows that no web or dedicated tool can reach. It is the right tool for a native app; it is the wrong tool for anything a dedicated MCP or Chrome MCP could do faster.

Do not fall *down* the hierarchy because a higher tool erred — debug or report the error. Fall down only when the higher tier genuinely does not cover the target.

### ToolSearch — batch the schema loads

Deferred MCP tools load their schemas via ToolSearch. **Bulk-load whole servers with a keyword query** — `{query: "computer-use", max_results: 30}` returns the entire computer-use toolkit in one round-trip because the keyword matches the server-name substring in every tool name. Use `select:Name1,Name2` *only* for a known, small list of specific tools. **Never load one tool per call** — that is one round-trip per tool, the exact waste this rule exists to prevent.

### browser_batch over single Chrome calls

When driving Chrome MCP, **batch the steps**. The system reminder enforces this, and it is mandatory the moment you can predict two or more steps ahead. If you know you will navigate, then find, then screenshot, that is one `browser_batch`, not three separate calls. Single Chrome calls are for the case where the next step genuinely depends on reading the result of this one. Predictable sequences batch.

### Bash sandbox vs PowerShell on Darrell's host

The Bash sandbox is isolated from Darrell's host network and credentials. Concretely it has **no Tailscale**, **no GitHub push credentials**, and **long-running ssh into the NAS hangs** (it cannot reach the tailnet, so it stalls until timeout). Therefore:

- **NAS work does not go through sandbox ssh.** It goes through one of two paths: (a) Chrome MCP driving the Synology / n8n web UI, or (b) a shell script committed to the repo that Darrell runs via a `wget -qO- <raw-github-url> | sudo sh` one-liner from his phone (the `feedback-one-productive-paste` pattern — one short paste, large payload, idempotent script). 
- **Pushes that the sandbox cannot complete fall back to a paste-ready PowerShell line for Darrell** (see the auto-push handling in Section 5 and the Two-Session Git Race rule in `CLAUDE.md`).
- The sandbox *can* still write files into the working tree and run local, non-networked commands. Use it for that; route anything needing the tailnet or Darrell's credentials to the UI-scrape or script-paste path.

Every PowerShell command handed to Darrell follows the `CLAUDE.md` "self-contained from anywhere" law: prefixed with `cd C:\Users\dpoe\Kingdom-PWA-Node`, one command per line, no `&&`/`||`, no PS7+ features, ASCII only, real literal values (his NAS IP `192.168.1.26`, SSH user `dpoe`) never placeholders.

### When to kill a task

**Abort the moment a parallel path returns the answer.** If two routes are racing to the same result — say an ssh retrieval and a Chrome MCP scrape both trying to read a config — and one returns, kill the other immediately rather than letting it run to timeout. The canonical example is the SSH retrieval task that hung on Tailscale earlier today: once the Chrome MCP path returned the value, the hung ssh task was dead weight and should have been (and was) killed. A task that has been superseded is not "almost done," it is waste; stop it. This pairs with `feedback-no-kick-the-can` applied to tool selection — do not let a slow path keep burning while a fast path has already succeeded.

### Read sources before composing

**Read the source files first; do not synthesize from training memory when the file is on disk.** This is cheaper *and* more accurate. Cheaper because a targeted file read costs far less than the round-trips and rework caused by composing from a half-remembered version. More accurate because the file is ground truth and memory drifts — the `feedback-research-first` and the Anti-Premise discipline (`feedback-surface-premise-conflicts`) both require it. This very document was written by reading all five sources off disk first; that is the standard. When a recalled memory names a file, function, or flag, verify it still exists before relying on it (the `CLAUDE.md` memory caveat).

### Find + scroll_to + screenshot vs raw read_page + javascript_tool

On authenticated Synology / n8n web UIs, the Chrome MCP `read_page` and `javascript_tool` paths hit a **"BLOCKED: Cookie/query string data" filter** when JavaScript runs against `document.body` — the auth'd-page content is filtered out, so JS-against-the-DOM comes back empty or blocked. The viable pattern on these surfaces is **`find` → `scroll_to` → `screenshot`**: locate the element, scroll it into view, and read it visually from the screenshot. Prefer this on any authenticated Synology UI. Raw `read_page` + `javascript_tool` is fine on ordinary public pages; it is unreliable on the auth'd Synology surfaces specifically, so default to find-and-screenshot there.

---

## 5. Token-efficiency posture

These are the standing defaults. They are not aspirations; they are how a session runs unless a named reason overrides. Each has a matching "never."

- **Default: spawn a sub-task. Never do substantive work in main Dispatch.** The orchestrator stays lean; the work happens in Code Tasks and Cowork sub-tasks (Section 4).
- **Default: batch tool calls. Never single-call when two or more can ship at once.** Independent reads, independent searches, independent edits go in one message with multiple tool blocks. `browser_batch` for predictable Chrome sequences. Bulk ToolSearch for whole servers.
- **Default: read sources before composing. Never synthesize from memory when the file is on disk.** Cheaper and more accurate (Section 4, "Read sources before composing").
- **Default: acknowledge and work in the same response. Never ack-then-wait.** When Darrell sets a direction, the same turn that acknowledges it also begins the work. "On it — here's the result" beats "On it." then a second turn with the result. This is `feedback-dont-stop-to-ask` and `feedback-always-now-viable-fix` in token terms: a wasted turn is wasted context.
- **Default: kill redundant work the moment a parallel path succeeds.** A superseded task is waste, not progress (Section 4, "When to kill a task").
- **Default: one productive paste over many small ones.** When Darrell runs commands, pack diagnose + fix + verify into one paste (or one `wget|sh` of an idempotent repo script). `feedback-one-productive-paste`: "if you have me doing 50 inputs instead of 5 I don't like you."
- **The "is there a concrete blocker to TODAY" test applies to tool selection too.** Per `feedback-no-kick-the-can`: if a task can ship in ONE round-trip, do not queue five. Do not spread a 30-minute build across a sequence of small confirmations when one well-formed sub-task closes it. The hedge toward many small steps is the same residual self-protection the no-kick-the-can memory names — eliminate it. One round-trip when one round-trip suffices.

The through-line: every token the orchestrator holds is re-read every turn, so the cheapest session is the one where the orchestrator delegates, batches, reads ground truth once, and never repeats a step a parallel path already completed.

---

## 6. Concrete examples from real session work

These are from actual session work, with commit hashes where they landed, so the rules above are not abstract.

**The SSH retrieval that hung on Tailscale → killed once Chrome returned (kill-redundant).** Earlier today a sandbox ssh task tried to read NAS state over Tailscale and hung — the sandbox has no tailnet, so it stalled. A Chrome MCP path to the same information returned the answer. The right move, taken, was to kill the hung ssh task the instant the Chrome path returned, rather than wait for the ssh timeout. This is both the Bash-sandbox-vs-PowerShell rule (NAS work does not go through sandbox ssh) and the kill-redundant rule in one incident.

**The wf18 Vercel-rewrite fix → Code Task with auto-commit + auto-push (Code-Task-for-repo).** The wf18 fix (eliminating cross-origin Tailscale Funnel throttling by proxying n8n webhooks through a same-origin Vercel rewrite) was repo work ending in a commit, so it ran as a Code Task and landed at `818bfa1`, with the session note at `b589edd`. Repo + git + ends-in-a-commit → Code Task. (The fix itself encodes `project_n8n_same_origin_rewrite`: the PWA reaches n8n via the `/n8n` same-origin rewrite, never the absolute Funnel URL.)

**The Quo research review → Cowork sub-task with web research + commit (Cowork-sub-task-for-research).** The just-completed research-review on Quo as an Incoming-Tab phone-call intake model (Dispatch task `4f36e4b1`, landed at `0ae89b3`) was dominantly web research + synthesis, so it ran as a Cowork sub-task even though it produced a committed file. Dominant activity is research → Cowork; the commit is incidental to the research, not the reverse.

**The Synology Chat browser scrape → Chrome MCP find + screenshot beat raw read_page + JS (find-+-screenshot).** Reading the authenticated Synology Chat UI tripped the "BLOCKED: Cookie/query string data" filter on `javascript_tool`-against-`document.body`. The find → scroll_to → screenshot path read the channel content reliably where raw `read_page` + JS did not. This is why that pattern is the default on auth'd Synology surfaces. The scrape was added to the checkin flow at `ff7bfc2`.

**The PoeTech afternoon checkin → missed Darrell's 01:36pm post → gap found + gap closed.** The afternoon checkin did NOT scrape the Synology Chat UI and so missed Darrell's 01:36pm post (the Quo direction). That is the gap. The fix — adding the Synology Chat UI scrape as step 0.5 of the checkin, a bind-mount workaround for wf08 — closes it (dispatched as task `66609a9e`, landed at `ff7bfc2`). The lesson is the BUSINESS-PROCESS-CONNECTIONS one applied to tooling: a checkin that reads only some of the family-voice surfaces will silently miss inputs; the tool path has to cover every surface a human might post to. Gap-found becomes gap-closed becomes a permanent step in the flow.

---

## 7. Open questions / known gaps

These need decisions but are out of scope for this document. Named here so they are tracked, not forgotten.

- **Per-industry team Cowork-project scaffolds.** Adopting Tina Huang's per-domain Cowork-project pattern (each per-industry team gets a project folder with the Productivity-plugin scaffold — `CLAUDE.md` / `TASKS.md` / `memory/` / `dashboard.html`) is pending the Productivity plugin install. Tracked in the Tina review §6.3–§6.4 and the consolidated extract B11. Decision needed: scaffold per-team folders now, or wait for the plugin.
- **The autonomous-builder lifecycle dispatch.** The pending/in-progress/done/failed folder queue with a 30-min (or hourly-to-start) scheduled pickup, routing each build to the right per-industry sovereign team — pending a PRD. Tracked in the Tina review §2.10 + §6.3 and consolidated extract B7. Open question from the extract §7.4: pickup cadence (default running: hourly for the first 14 days, 30 min once failure rate is under 5%).
- **Vendor-LLM cost monitoring.** There is no live cost dashboard yet. The $25 soft / $50 hard caps in Section 3 are enforced by routing discipline, per-team `allowed_providers`, and grounded-query logging in n8n — not by an automated meter. Tracked in `docs/99-session-notes/2026-06-01-research-review-sovereign-llm-teams-architecture.md`. Until the dashboard exists, the caps depend on the sovereign-first default actually holding.

---

## 8. Sources

This document synthesizes and extends the following. It does not duplicate them; it cites and routes back to them.

1. **`agent/memory/research_gemini_pro_vs_claude_2026_05_27.md`** — the model-routing research: Claude Opus 4.7 / Sonnet 4.6 / Haiku 4.5 vs Gemini 3.x / 2.5 vs Ollama; pricing math; the free-tier-trains-on-you sovereignty footgun; n8n integration; the hybrid router proposal (§6); the cost-cap and open questions (§8). Source of the Section 3 routing table and cost guardrail. (Lives in the Cowork agent-mode session memory dir, not the repo tree.)
2. **`docs/99-session-notes/2026-06-02-consolidated-ai-work-processes-repos-skills-extract.md`** — the Tier 0 / Tier 1 / Tier 2 routing YAML, the per-industry team configs with `allowed_providers` and `bright_line_overrides`, and the day-in-the-life of the post-adoption dev cycle. Source of the Section 3 tier ladder and the TLC firewall config.
3. **`docs/99-session-notes/2026-06-01-research-review-tina-huang-cowork-workflow.md`** — the in-session tool-selection patterns (§2.10, §6.3): Cowork vs Code Task vs Dispatch, the autonomous-builder pending/in-progress/done/failed lifecycle, Cowork-as-orchestrator-not-sole-executor. Source of the Section 4 Dispatch/Code-Task/Cowork rules.
4. **`docs/00-foundations/_root/AI-FOUNDATION-INTERNAL-OPERATIONS.md`** — "anything that is a click today should be an API call tomorrow; browsers are for humans deciding things, not for systems doing things." Source of the dedicated-MCP-first rule in Section 4.
5. **`agent/memory/` entries** — `project_sovereign_llm_teams_per_industry` (LLMs do the work, humans govern); `project_nas_as_governance_point` (the NAS holds governance; vendors consult it); `project_cost_discipline_with_growth_permission` (the cost screen and caps); `feedback_research_first` (research before code); `feedback_always_now_viable_fix_source_dont_ask` (fix now, source don't ask); `feedback_no_kick_the_can_today_not_next_week` (TODAY is the default verb); `feedback_one_productive_paste` (one paste, not fifty). Source of the Section 5 posture defaults.

---

*The default is sovereign. Vendor LLMs are explicit escalation. The clinical firewall is absolute. The orchestrator delegates; sub-tasks do the work; the agent reads ground truth before it composes and kills the slow path the moment the fast one returns. The NAS holds the policy; the vendors consult it; the family governs. We all win. We create. Amen.*
