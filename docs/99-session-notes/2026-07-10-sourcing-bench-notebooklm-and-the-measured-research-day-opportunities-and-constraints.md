# The sourcing bench — NotebookLM, multi-model skills, and the measured Research Day: opportunities and constraints

> Layer 4 working artifact. Companion to **DR-0141** and REV-0033. Trigger, Darrell 2026-07-10, across one session: a NotebookLM 2.0 walkthrough and an AI-orchestration briefing brought as build input (both carried by his Gemini Pro — the screenshots show Gemini ingesting the YouTube links natively); *"Ari should be able to source my gemini and chatgpt $20 accounts for certain skills claude doesnt have"*; *"Keep researching certain day/s to keep researching upgrades and features from GitHub"*; the standing frame (*"when we add features we need to update our Ways and documentation and find the opportunities and constraints, Ari's responsibility and reports should all update to reflect as well all inside the PoeTech App. No static data... keep cleaning until we like it"*); the evidence sharpening (*"test and see not agree without testing... adoption of what actually works not change just because"*); and the n8n correction (*"I don't like n8n... from experience... Ari should already know and not let anything like that happen unless Ari thinks we should and Ari should bring that to me and make the case to get governance however only when it is justifiable based on the tests and outcome"*).

## What was brought

1. **A NotebookLM 2.0 (2026) walkthrough** — source curation that populates itself, studio outputs (slide decks, videos, infographics, roadmaps), live code execution in a sandbox over the sources, Gemini-app integration.
2. **An AI-orchestration briefing** (produced by an outside model wearing another project's framing) — the director-not-doer paradigm, reusable "skills"/playbooks, agentic loops + passive connectors (calendar/email telemetry).
3. **A GitHub/ecosystem scan** (web research, this session) — the Agent Skills standard (~160k stars on anthropics/skills, verified 2026-07-10), Open Notebook (35.4k stars verified, MIT — the sovereign NotebookLM), YouTube-transcript MCP servers, Google Workspace MCP, multi-model routers, gpt-researcher, on-device browser AI (whisper-web, Prompt API), Claude agents in CI, and the n8n AI Agent node.

## The two catches that proved the intake inside its own first pass

- **Premise-verify (the foreign-briefing catch).** The orchestration briefing asserted an "existing `llm-worker.js`," a Next.js architecture, WebLLM/Edge-AI, and "Project SHALOM." Verified against the repo: `llm-worker.js` exists only in the dead vanilla scaffold the hardening plan lists for archive; the app is Vite + React; the rest is another project entirely. Nothing was built on it. Hand-carried output from ANY outside model now passes a structural premise-verify step — not a session's alertness.
- **House-first / recorded experience is senior (the n8n catch).** The ecosystem scan staged the n8n AI Agent node as its "highest-leverage" finding on adoption signal — and the house's own record had already judged the tool: DR-0132 took n8n off every reliability-critical path (the HTTP 530 night; silent Code-node failures; "Succeeded" ≠ correct; LESSONS P17–P19; DR-0083 before it), and Darrell confirmed from experience the same day. The finding is **declined**; it reopens only if Ari brings a justified case to governance on real tests and outcomes (`re-review: 2026-10-08`); a pinned test holds that nothing recommends n8n back onto the critical path. **Popularity elsewhere is not evidence here.**

## What shipped (one source — DR-0121)

- **`app/src/lib/research-intake.js`** — the ONE source: `SOURCING_BENCH` (the whole team's instruments — Darrell, Claude Code, Gemini Pro + NotebookLM, ChatGPT, the DR-0132 sovereign lane, the runners — each with skills, honest limits, and how its output enters), `INTAKE_STEPS` (capture → premise-verify → house-first → tier → evidence-based verdict → one source → record → reflect → schedule), `RESEARCH_FINDINGS` (11 evidence-based verdicts, all dated), `VERDICT_MEANING` (adopted = proven in real use here; staged = named trial; watch = no change just because; declined = why held + dated), and `researchCadence` (the weekly Research Day derived from the live review registry — no pass on file reads OVERDUE, never fresh).
- **The surface** — the bench, findings, and cadence render in Ari's record on Discussions, beside his duties, workload, and derived notes.
- **Ari + reports** — the `sourcing` standing duty resolves against DR-0141 live; the derived notes pick the DR up this build; every `re-review:` date in the DR/REV lands in the sortable in-app backlog automatically (the existing extractor — nothing new needed).
- **Tests** — `research-intake.test.js`: no instrument without a named constraint; the consumer-tier no-API truth pinned; premise-verify and house-first ordered before the verdict; adoption-requires-evidence language pinned; the n8n seniority rule pinned; the cadence measured (no record = overdue, never fresh).
- **The staged timer** — a weekly Routine (fresh session per fire) configured with its three brakes and left INACTIVE; the Governor arms it with a word.

## Opportunities (all routed in DR-0141 with dates)

- **Google AI Studio free-tier Gemini key** — the honest programmatic-Gemini unlock (the $20 subscription carries no API); a value only Darrell can issue; verify quotas first. `re-review: 2026-07-24`.
- **YouTube-transcript ingestion** — a published teaching becomes build input without the hand-carry; pairs with the NAS Whisper lane. `re-review: 2026-07-24`.
- **Portable Agent Skills** — package the house's proven playbooks (this intake, verse verification, the O&C pass) as skills any session runs without re-teaching. `re-review: 2026-08-07`.
- **Open Notebook on the NAS** — NotebookLM's value without sending foundation material to Google. `re-review: 2026-08-07`.
- **Calendar/email connectors as opt-in telemetry** on the DR-0132 lane (never always-on without Tier C). `re-review: 2026-08-07`.
- **On-device browser AI** (whisper-web / Prompt API) — DATA-AS-EMPOWERMENT made literal, pending a named target surface (Council Chamber voice). `re-review: 2026-08-07`.

## Constraints (held, with whys)

- **No API on either consumer subscription** (Gemini Pro, ChatGPT $20) — their skills are real and on the bench, but output enters ONLY hand-carried through the intake; no painted integration.
- **Recorded experience is senior** — n8n stays off the critical path (DR-0132 + Darrell's word); the reopen path is a governance case on tests and outcomes, never a trend.
- **The weekly timer never self-activates** — staged inactive with budget + single-instance skip + stop-on-failure (the 2026-06-06 rule); the cadence readout keeps overdue honest meanwhile.
- **Adoption takes evidence from real use here** — staged findings are trials to run, not adoptions; "the ecosystem likes it" is not a reason to change.
- **Star counts stated at verified confidence only** — anthropics/skills and Open Notebook read from their pages 2026-07-10; the rest carried as secondhand and said so (DR-0100).

## Ways-review (DR-0108 questions, answered)

1. *Capability not used?* The team's bench itself was the gap — the agent had no recorded routing knowledge of Darrell's Gemini/NotebookLM/ChatGPT skills; now it is data every session loads.
2. *Unverified "can't"?* "Consumer accounts can't integrate" was verified precisely: no API on either $20 tier; the AI Studio free key is the honest unlock, quotas unverified and dated.
3. *Repeated friction absorbed?* Hand-carried briefings now pass a structural premise-verify; re-proposing what the house already judged is structurally declined.
4. *Scoped to my limits instead of the team's?* The bench names the principal (ConnectBot, the consumer tools he fires) and the runners as instruments alongside the agent.
5. *More streamlined way?* Research now has a measured weekly cadence with a staged automation path — and the intake it feeds is the same one every outside input runs.
