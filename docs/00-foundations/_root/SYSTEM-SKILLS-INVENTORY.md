# System Skills Inventory

**Living document.** Updated whenever a new AI tool, workflow, or capability lands. Read by every Claude session at start so the agent knows what the system can do today, what each tool does best, and what's queued.

Per the AI-FOUNDATION-INTERNAL-OPERATIONS principle: the right tool for the right job, every time. This is the routing reference.

## Section A — AI tools available

### A.1 Ollama (local, sovereign, on the NAS)

**What it is:** Local LLM runtime on DS1621xs. Models currently loaded per existing memory:
- `deepseek-r1:8b` — reasoning tasks
- `qwen2.5:14b-instruct-q4_K_M` — general default
- `qwen2.5:3b-instruct-q4_K_M` — fast, light tasks
- `nomic-embed-text` — embeddings

**Strengths:**
- Sovereign — data never leaves the NAS. Required for TLC firewall content and any family-private material.
- Free per call after the one-time setup cost.
- Always available — no rate limits, no quota.
- Fast for short prompts on the 3b model.

**Weaknesses:**
- Capability ceiling lower than frontier cloud models. Don't ask it to refactor a 5000-line React component.
- Latency on the 14b model is noticeable (~5-15 seconds for typical responses).
- Context window is real but bounded. Long-document reasoning is shakier.

**Send work here when:**
- Content includes anything TLC, clinical, family-private, or otherwise needs to stay on the NAS.
- The task is summarization, classification, simple Q&A, draft generation, routine routing decisions.
- Frequency is high (multiple times per hour) and cloud-cost matters.
- The Foundation Agent (workflow 27) is processing an inbox of @nas thoughts on cron.

### A.2 Claude (cloud, via Anthropic API)

**What it is:** Claude Sonnet (default) or Claude Opus (for harder work) called via the API from n8n. Plus Claude in Dispatch and Claude Code when Darrell opens a session himself.

**Strengths:**
- Frontier capability on code, reasoning, long-context analysis, careful instruction following.
- Strong at the binding-foundation work this repo requires (typographic theology, ESV-citation discipline, anxiety-clarity framing).
- Can be wired through workflow 17's TLC-firewall-style gate to ensure no sensitive content leaves the NAS.

**Weaknesses:**
- Costs money per token. For frequent low-value tasks, this matters.
- Has rate limits at the API level.
- Stateless across calls — Foundation has to load context every time.

**Send work here when:**
- Substantive code generation or refactoring (the welcome-modal rewrite, new workflow drafting, multi-file edits).
- Cross-document reasoning where multiple foundation docs must be held simultaneously.
- The output will be reviewed by Darrell — Claude's careful drafting earns the review time.
- A workflow explicitly escalates with `ESCALATE_TO_CLAUDE` (workflow 27's pattern).

### A.3 Gemini (cloud, via Google AI API)

**What it is:** Gemini 2.5 Pro called via workflow 17's existing gateway. Has the TLC firewall gate built in.

**Strengths:**
- Strong on doc summarization, technical research, workflow design where bulk reasoning is needed.
- Large context window — can hold long documents.
- Cost-competitive for high-volume non-sensitive bulk reasoning.

**Weaknesses:**
- Capability profile differs from Claude. Stronger at some research tasks, weaker at others.
- TLC firewall enforced — anything family-private cannot route here (the firewall classifier blocks it).

**Send work here when:**
- High-volume non-sensitive reasoning (architecture research, public-doc summarization, planning).
- Workflow 17's allow-list categories: code-help, doc-summarize, planning-research, public-research, workflow-design, sermon-research.
- Cost matters and the task fits Gemini's profile better than Claude.

### A.4 MCP servers (via Claude Desktop / Code sessions)

**What's connected today (per existing memory):** chrome-in-chrome, computer-use, MCP registry, scheduled-tasks, sessions, cowork file tools, plugins, skills, visualize, workspace.

**Strengths:**
- Direct device control — Chrome, file system, shell, screen capture.
- Native to the Claude session — no API hop.
- Powerful for "drive the browser through clicks" tasks (e.g., today's poetech.us DNS work).

**Weaknesses:**
- Only available when Darrell has a Claude session open (Dispatch or Code).
- Not autonomous — can't be triggered by cron or workflow.
- The browsing path is slower than an API call when an API exists (AI-FOUNDATION-INTERNAL-OPERATIONS principle: prefer API).

**Send work here when:**
- A genuine UI-only operation (admin panel without API, captcha solving by user, OAuth grant).
- Prototyping an integration before building the workflow for it.
- The system genuinely cannot decide alone (per Governance-Execution-Advisory).

## Section B — Workflows in play (the Foundation's hands)

### B.1 Capture surfaces (data flowing in)

| Workflow | What it captures | Where it lands |
|---|---|---|
| 08 | Synology Chat #PoeTech-PWA (@nas messages) | `/data/chatin/<timestamp>__<sender>.json` |
| 14 | Gmail finance events (OAuth) | `/data/finance-events/gmail/` |
| 15 | Bank QFX/OFX/CSV every 2 min + LEDGERBAL extraction | `/data/finance-events/bank/<institution>/` |
| 26 | Direct `POST /webhook/thought` | `/data/poetech-briefing/inbox/<id>.json` |

### B.2 Processing surfaces (state being computed)

| Workflow | What it does | Cadence |
|---|---|---|
| 16 | Cross-verify Gmail claims vs bank confirmations; classify each row | Hourly |
| 06 | (Legacy, Supabase-era) Situational analysis + auto-mutation Loop 1 + recommendation Loop 2 | 4 hours (when active) |
| 20 | Health-check + ntfy alerts | Every 10 min |
| 27 | Foundation Agent — inbox processor + Ollama router + Claude-queue | 7am · 12pm · 5pm · 9pm + on-demand |

### B.3 Output surfaces (data flowing out)

| Workflow | What it serves | Consumer |
|---|---|---|
| 17 | TLC-firewalled Gemini gateway | Internal workflows that need cloud bulk reasoning |
| 18 | Imported transactions API + `bank_balances` overlay | PWA (Tx, Accounts, Big Picture) |
| 19 | Mark-noise API | PWA Tx tab (🗑 Noise button) |
| 23 | Project briefing (inbox + state + principles) | Any Claude session on boot |

### B.4 Queued workflows (not yet built)

| Workflow | What it will do | Priority |
|---|---|---|
| 21 | Login + session token (Multi-user Layer B sovereign auth) | High |
| 22 | TLC data API (Multi-user Layer C; only if Christina opts in) | Conditional |
| 24 | Specialist access router (anonymous read/listen/message) | Post-Layer-C |
| 25 | Briefing sync (pulls foundation docs from GitHub → `/data/poetech-briefing/`) | High |
| 28 | Auto-importer (watches a folder, imports JSON via n8n API, activates) | Medium (kills a manual click) |
| 29 | Self-examination digest (weekly meta-analysis of agent runs) | Medium |
| 30-33 | IoT integrations: SolarEdge, Wyze, Ring, Sense | Conditional on Governor approval |

## Section C — PWA surfaces (what the family sees)

### C.1 Shipped surfaces

| Surface | What it answers |
|---|---|
| Big Picture | Net cash flow · debt-free date · rentals-clear date + bank reconciliation strip |
| Books → Tx | Manual + ingested transactions merged with provenance badges, status filter, Accept/Review/Noise actions |
| Books → Accounts | Per-account bank ledger balance + Δ vs manual + bank-linked badges |
| Books → Debts | Snowball payoff plan |
| Books → Imported | Raw browse of ingested data (alt view of Phase 2A) |
| Demo personas | Family-of-4 / Separated / Solo professional / Landlord (value-led copy) |
| Profile picker (Layer A) | Darrell / Christina / Family — entity visibility gating |

### C.2 Queued surfaces (Governor decision pending)

| Surface | What it answers | Status |
|---|---|---|
| `/roadmap` | Public-facing roadmap with ITIL service catalog + PMP phases + stakeholder lens | Awaiting Governor approval |
| Home tab | SolarEdge per-panel performance + (later) Wyze + Ring presence | Awaiting Governor approval |
| Specialist directory | Anonymous read of vetted specialists in family / business / legal / financial | Post-Layer-C |

## Section D — Routing rules ("send this kind of work to X")

| Request shape | Route to |
|---|---|
| @nas thought, < 200 chars, conversational | Ollama 3b via workflow 27 (immediate response) |
| @nas thought, substantive question without code | Ollama 14b via workflow 27 (response in 10-15s) |
| @nas thought, TLC/clinical/family-private | Ollama 14b ONLY; never escalate; per TLC firewall |
| @nas thought, needs code change | Workflow 27 queues for Claude (next Dispatch session picks up via briefing) |
| Inbox thought tagged `@claude` | Workflow 27 queues for Claude directly |
| Cron task — health check, reconcile, briefing | Dedicated workflow, no LLM |
| Browser-only operation (DNS console without API, OAuth grant) | Claude in Dispatch via Chrome MCP |
| Cross-doc reasoning (foundations + session notes + code) | Claude in Dispatch with file access |
| Public-research / planning / non-sensitive bulk | Gemini via workflow 17 |
| Single specific fact lookup | WebSearch or direct fetch, no LLM call |

## Section E — How this doc stays alive

Per AI-FOUNDATION-INTERNAL-OPERATIONS, this document is itself subject to the principle. Maintenance options:

1. **Manual** (current) — Claude updates it during sessions when capabilities change.
2. **Workflow 29** (queued) — weekly self-examination flags stale sections.
3. **Workflow 25** (queued) — briefing sync pulls latest from GitHub so the agent reads the freshest version.

When you read this and something is wrong, drop a thought: `@nas SKILLS-INVENTORY needs update: X is no longer Y`. Workflow 27 routes it to Claude on the next cycle.

## Section F — Named skills (the cognitive moves the system practices)

This is the list of distinct *thinking skills* the AI team applies, separate from the tools (Section A) and workflows (Section B) that execute them. A skill is a habit of mind that any tool in the stack can be asked to apply. The skill names below are canonical — when an Inbox Sorter or workflow tags work with one of these labels, every downstream agent knows what move is being requested.

### F.1 Foundation-screen

**The move:** before generating or shipping anything substantive, screen the proposed output against the foundation docs in `docs/00-foundations/_root/`. THE-WAY, MIND-OF-CHRIST, EXCELLENCE-STANDARD, SCRIPTURE-REFERENCE-STANDARD, ANXIETY-CLARITY-PRINCIPLE, plus the typographic-theology binding from CLAUDE.md.

**Who practices it:** Claude in any session (default). Ollama 14b as backstop when it's already reasoning about content.

### F.2 Anxiety-Clarity surface-design

**The move:** for any user-facing surface, answer the four questions visibly — what / when / why / how. Err toward more guidance, not less. Optimize for the scared parent reading at midnight.

**Who practices it:** Claude (drafting). Foundation Agent (validating that shipped surfaces still answer all four).

### F.3 Seed-Data aspirational design

**The move:** any seed, demo, sample, or sanitization output passes the four-question test in SEED-DATA-AS-ASPIRATION — privacy / aspiration / relatability / active-guidance. No real Poe family info; show thriving stewardship; relatable income; one moment of system-helping-now.

**Who practices it:** Claude as Advisor drafts; Darrell as Governor approves the final shape.

### F.4 Mental-Stewardship audit (NOTICE → TEST → CAPTURE → REDIRECT)

**The move:** for any flagged thought or anxious surface, run the four-step mental-stewardship loop from MIND-OF-CHRIST. Used by Foundation Agent when categorizing inbox thoughts that look anxiety-driven.

**Who practices it:** Ollama 14b in workflow 27 (first pass); Claude as escalation when the thought requires cross-doc reasoning.

### F.5 TLC-Firewall classification

**The move:** before any LLM call, classify whether content contains clinical / family-private material. If yes → Ollama only, never cloud, never archived in cloud-reachable logs.

**Who practices it:** Workflow 17's classifier (first line); Foundation Agent as backstop.

### F.6 Workflow-First operational thinking

**The move:** before proposing a "go click X" instruction, ask: is there an API for this? Could this be a workflow? Per AI-FOUNDATION-INTERNAL-OPERATIONS, the system prefers a workflow that runs on cron over a click that needs a human. Browsers are for humans deciding things, not for systems doing things.

**Who practices it:** Claude as Advisor when proposing automation; Foundation as Executor when implementing.

### F.7 Business-Process Connections (added 2026-05-28)

**The move:** for any visible surface (demo, screenshot, button, link, public page, marketing copy), ask the five questions from BUSINESS-PROCESS-CONNECTIONS:

1. What does this surface invite?
2. What pipeline carries that action?
3. Who is the Governor for the incoming volume?
4. What's the visible promise we're making?
5. What's the timeline commitment? (How long do we estimate setup, how confident are we, and is that commitment visible on the surface?)

If any answer is missing or "we'll figure it out", surface it as a blocker before writing code. Marketing surfaces follow pipeline readiness AND credible timeline commitments, not the other way around. Every visible surface is one end of a connection; the other end must be wired before the surface ships. The mature pattern: identify the service → estimate setup time honestly → commit publicly to a date → market to the specific audience for that date → build against the timeline → open on time (or update the waitlist honestly when the date slips).

**Who practices it:** Claude as Advisor (the named Connection-Thinking role — see AI-TEAM-DISTRIBUTION Role 7). Foundation as Executor (audits shipped surfaces against this skill on a cron). Darrell as Governor (final approval for any surface to go public).

**Why it's separate from F.6 Workflow-First:** Workflow-First is about *internal* automation — replacing clicks with crons. Connection-Thinking is about *external* obligation — auditing what the visible surface promises and confirming the obligation can be honored. Workflow-First serves the system; Connection-Thinking serves the strangers who trust the surface.

### F.8 Testing Discipline (added 2026-05-29)

**The move:** every code change ships with tests. Every visible-surface change passes the Quality Gatekeeper check before merge. Every PR triggers automated test runs across all six baseline personas (Family of 4, Separated, Solo Practice, Landlord, Church-Connected, Region-Anchored). Visual regression catches UI drift; load tests catch performance regressions; synthetic fixtures keep tests deterministic.

The sequence:

1. Code Generator (Role 3) writes implementation + Test Author (Role 8) writes the tests in the same PR. Failing tests committed first; passing tests after implementation lands.
2. CI runs the test suite on every PR (unit, integration, end-to-end, visual regression, load).
3. Test Runner (Role 9) triages any failures — classifies (real bug / flaky / environmental) and either proposes a fix patch or escalates to Code Generator.
4. Quality Gatekeeper (Role 10) runs Foundation-screen + EXCELLENCE-STANDARD + BUSINESS-PROCESS-CONNECTIONS five-question test on any visible-surface change. Refuses merge if any check fails.
5. Governor (Darrell) reviews the PR with the Gatekeeper's pass + test results already attached.

**Who practices it:** Test Author, Test Runner, Quality Gatekeeper roles per AI-TEAM-DISTRIBUTION. Code Generator collaborates with Test Author on every substantive PR.

**Why it's separate from F.6 Workflow-First and F.7 Connection-Thinking:** Workflow-First is about replacing clicks with crons. Connection-Thinking is about auditing external obligations of visible surfaces. Testing-Discipline is about internal correctness — does the code do what it claims, across the personas we serve, under realistic load. All three serve different sides of "ship something we'd stake the family on."

### F.9 Governance-Execution-Advisory role discipline

**The move:** before taking any action, identify which of the three roles applies — Governor (Darrell decides), Executor (Foundation acts within standing authority), Advisor (Claude drafts + recommends). Do not collapse roles.

**Who practices it:** Every session, every workflow, every commit. Foundation as default Executor; Claude as default Advisor; Darrell as sole Governor.

## Section G — Connection to other foundations

- **AI-FOUNDATION-INTERNAL-OPERATIONS** — names the "API > browser" preference that this routing matrix encodes.
- **GOVERNANCE-EXECUTION-ADVISORY** — names which routes are Foundation standing authority vs Governor-required.
- **ANXIETY-CLARITY-PRINCIPLE** — every routing choice should serve "answer what/when/why/how" for the user.
- **BUSINESS-PROCESS-CONNECTIONS** — names the Connection-Thinking skill (F.7) as binding for every surface decision.
- **SEED-DATA-AS-ASPIRATION** — names the Seed-Data skill (F.3) as binding for every demo/sample.
- **THE-WAY** + **MIND-OF-CHRIST** — even routing decisions are stewardship. Choose the option that lifts the family and creates rather than extracts.

Amen.
