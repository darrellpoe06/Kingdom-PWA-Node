// =============================================================================
// research-intake — the sourcing bench, the intake, and the Research Day (DR-0143)
// =============================================================================
// "Ari should be able to source my gemini and chatgpt $20 accounts for certain
// skills claude doesnt have... Keep researching certain day/s to keep
// researching upgrades and features from GitHub... Ari's responsibility and
// reports should all update to reflect as well all inside the PoeTech App. No
// static data." (Darrell, 2026-07-10 — DR-0143.)
//
// This module is the ONE SOURCE (DR-0121) for three things:
//
//   1. THE SOURCING BENCH — the whole team's AI instruments, each with the
//      skills it actually has, the constraints that actually bind it, and how
//      its output ENTERS the house. The ways-review rule (DR-0108) is encoded
//      here structurally: the agent accounts for the TEAM's capabilities —
//      Darrell's Gemini/NotebookLM and ChatGPT, the NAS lanes, the runners —
//      never only its own. Every instrument carries a real constraint; a bench
//      entry with no named limit would be a painted claim (DR-0076).
//
//   2. THE INTAKE — the worked pattern for outside capability entering the
//      house, proven on the Priestley pass (DR-0140/REV-0032) and hardened by
//      the 2026-07-10 catch: a hand-carried Gemini briefing asserted an
//      architecture this repo does not have (an "existing llm-worker.js",
//      Next.js, WebLLM — the dead vanilla scaffold and two fictions). The
//      premise-verify step exists because that catch was real.
//
//   3. THE RESEARCH DAY — the weekly upgrade/feature research cadence,
//      MEASURED from the live review registry (__UIUX_REVIEWS__), never
//      promised: a pass counts only when a REV record carrying the marker is
//      filed, and no record on file reads OVERDUE, never fresh (DR-0076 /
//      DR-0125's freshness posture).
//
// Pure + dependency-free (Node + browser + tests). The cadence takes `nowMs`
// injected — deterministic in tests, same discipline as re-reviews.js.
// =============================================================================

const MS_DAY = 86400000;

// The cadence contract. A research pass is REAL when a review-registry record
// carries this marker in its Surface (or title) line — the same file the
// Quality panel reads, so the cadence can only go green by actually filing the
// pass (docs/reviews/REVIEWS.md → __UIUX_REVIEWS__, re-parsed every build).
export const RESEARCH_DAY = Object.freeze({
  marker: 'Research Day',
  dayName: 'Monday',
  intervalDays: 7,
});

const MARKER_RE = /research day/i;

// -----------------------------------------------------------------------------
// The sourcing bench — every instrument the TEAM holds, with honest limits.
// `entry` names how that instrument's output enters the repo/app: nothing on
// this bench writes to the house without passing the intake below.
// -----------------------------------------------------------------------------
export const SOURCING_BENCH = Object.freeze([
  {
    key: 'principal',
    name: 'Darrell (the Governor)',
    skills: 'Decisions and bright lines; values only he holds; fires the consumer AI tools by hand; SSH to the NAS from his phone (ConnectBot); the lived context no model has.',
    constraint: 'The most expensive instrument on the bench — ask for the smallest possible piece of his time (Drive-Don’t-Delegate), never for what another instrument can do.',
    entry: 'Speaks or pastes into the session; a spoken word is build input and never lands in a dead end (DR-0131).',
  },
  {
    key: 'claude-code',
    name: 'Claude Code (cloud + CLI sessions)',
    skills: 'Builds, verifies, and ships in this repo: tests, deterministic gates, the auto-merge lane, decision/review records, the app itself.',
    constraint: 'The cloud sandbox has no route to the LAN, the NAS, or poetech.us, and no native video ingestion — the runners are its eyes on production and the bench covers the rest.',
    entry: 'Direct: branch → gates → PR → auto-merge on green (DR-0103).',
  },
  {
    key: 'gemini',
    name: 'Gemini Pro + NotebookLM (Darrell’s subscription)',
    skills: 'Native YouTube/video ingestion; NotebookLM source curation, studio outputs (slides, infographics, video), sandboxed code execution over sources; deep research.',
    constraint: 'The consumer subscription carries no API — output is hand-carried, and every briefing is premise-verified before anything is built on it (proven 2026-07-10: a briefing asserted a Next.js/WebLLM architecture this repo does not have). Foreign project framing rides along and is stripped at the door.',
    entry: 'Hand-carried by Darrell (paste/screenshot) → the intake’s premise-verify step.',
  },
  {
    key: 'chatgpt',
    name: 'ChatGPT (Darrell’s $20 plan)',
    skills: 'Second-opinion reasoning, an independent research voice, image generation.',
    constraint: 'No API on the consumer tier and no free-key equivalent exists (unlike Gemini’s AI Studio path) — hand-carried output only, same premise-verify gate.',
    entry: 'Hand-carried by Darrell → the intake’s premise-verify step.',
  },
  {
    key: 'nas',
    name: 'The sovereign lane (Supabase-bus + church boxes + NAS Whisper/Ollama)',
    skills: 'Sovereign automation the DR-0132 way: the app writes task rows to Supabase, the self-orchestrating box polls outbound and runs local models; transcription (Whisper) and the dispatch/status surfaces stay in the house.',
    constraint: 'The LAN is unreachable from the cloud sandbox — box/NAS-side steps run as paste-ready runbooks by Darrell’s hand (ConnectBot); n8n is OFF the critical path by the house’s own experience (DR-0132, LESSONS P17–P19) and returns only by a governance case; timer-driven work starts by record through the lane with its deterministic brakes (budget + lock) proven — the Governor’s hand is the brake, never the starter (DR-0247/DR-0248). Repo-declared services self-deploy via the services-sync manifest.',
    entry: 'Supabase rows the box polls outbound (no inbound hop); runbooks executed by the principal.',
  },
  {
    key: 'runners',
    name: 'GitHub Actions runners',
    skills: 'The outside-in eyes: site-health and boot-check probes against production, the CI gates, scheduled workflows.',
    constraint: 'Tokens stay narrow; event/timer automation is still automation — the three brakes govern anything that spawns compute on a clock.',
    entry: 'Workflow runs filing issues/ledgers the app reads; gates failing the build.',
  },
]);

// -----------------------------------------------------------------------------
// The intake — how ANY outside capability, briefing, or teaching enters the
// house. Order is binding: premise-verify precedes everything built on the
// input, and the record steps close the loop the same session (DR-0120/0121).
// -----------------------------------------------------------------------------
export const INTAKE_STEPS = Object.freeze([
  { key: 'capture', step: 'Capture the input whole — spoken word, pasted briefing, screenshot; nothing brought is dropped silently.', ref: 'DR-0089' },
  { key: 'premise-verify', step: 'Verify every claim the input makes about OUR system against the repo before building on it; strip foreign project framing. An asserted "we have X" is checked, not believed.', ref: 'DR-0076' },
  { key: 'house-first', step: 'Check the house before the market: what do our own Ways, documentation, and LESSONS-LEARNED already hold on this? A capability we already run is reused, not replaced — new data must name, specifically, what it improves over the house’s proven way. RECORDED EXPERIENCE IS SENIOR: a finding that contradicts a standing decision or the Governor’s recorded experience is DECLINED by default (the n8n catch, 2026-07-10 — the ecosystem staged what DR-0132 had already judged); it reopens only when Ari brings a justified case to governance on real tests and outcomes.', ref: 'DR-0132' },
  { key: 'tier', step: 'Tier the substance (established fact stated plainly; genuinely-open flagged narrowly; over-reach corrected by the Word — the true data beneath still stands).', ref: 'DR-0100' },
  { key: 'verdict', step: 'Adopt, stage, watch, or decline — each with a written why. ADOPTED requires evidence from real use here, measured, on file; agreement without testing is not adoption, and "new" is never by itself a reason to change. A decline or deferral carries a re-review date, never a silent drop.', ref: 'DR-0075' },
  { key: 'one-source', step: 'Ship what is adopted as ONE source that both teaches and operates — no static copies to drift.', ref: 'DR-0121' },
  { key: 'record', step: 'File the pass: Decision Record + REV entry + session note, so the ledger the app reads carries it.', ref: 'DR-0102' },
  { key: 'reflect', step: 'Ari’s duties, derived notes, and reports update with the feature in the same session — inside the app.', ref: 'DR-0120' },
  { key: 'schedule', step: 'Route the opportunities with re-review dates into the backlog the app sorts; the next Research Day is measured from the registry, never promised.', ref: 'DR-0108' },
]);

// -----------------------------------------------------------------------------
// The findings registry — the 2026-07-10 pass (NotebookLM 2.0 + the
// orchestration briefing + the GitHub/ecosystem scan), each with its verdict,
// its why, its binding constraint, and a re-review date where work remains.
// Star/adoption numbers are stated only at the confidence they were verified
// (DR-0100): "verified 2026-07-10" means read from the source page that day;
// otherwise the count is reported secondhand and said so.
// -----------------------------------------------------------------------------
// The verdicts, with the evidence rule made explicit (Darrell 2026-07-10:
// "test and see, not agree without testing... evidence based evaluations then
// adoption of what actually works, not change just because"). Promotion runs
// one way: watch → staged → adopted, and the LAST step is crossed only by a
// measured result from real use in this house — never by agreement alone.
export const FINDING_VERDICTS = Object.freeze(['adopted', 'staged', 'watch', 'declined']);
export const VERDICT_MEANING = Object.freeze({
  adopted: 'proven in real use here — the evidence is named in the why',
  staged: 'named for a real trial; promoted to adopted only by a measured result, never by agreement',
  watch: 'worth tracking; no trial until a named need exists (no change just because)',
  declined: 'not taken, with the why held and a re-review date — never a silent drop',
});

export const RESEARCH_FINDINGS = Object.freeze([
  {
    key: 'notebooklm-instrument',
    name: 'NotebookLM 2.0 as a research instrument',
    source: 'NotebookLM 2.0 walkthrough (Gemini-carried, 2026-07-10)',
    verdict: 'adopted',
    why: 'Evidence from real use, not agreement: this very pass ran on it — the two video briefings entered the house through Gemini/NotebookLM ingestion, skills (native video ingestion, source curation, studio outputs, sandboxed code-execution) the house verifiably lacks. It joins the bench as an instrument Darrell fires.',
    constraint: 'No API and no official MCP server — output enters hand-carried through the intake; it never becomes a dependency of an automated lane.',
    reReview: '2026-08-07',
  },
  {
    key: 'director-not-doer',
    name: 'Orchestrator paradigm (director, not doer)',
    source: 'AI-orchestration video briefing (Gemini-carried, 2026-07-10)',
    verdict: 'adopted',
    why: 'House-first check: nothing new to adopt — the delivery loop (DR-0103), do-don’t-re-ask (DR-0111), and Drive-Don’t-Delegate ARE the director posture, already proven in this house’s own record. The briefing’s value was the confirmation, not a change.',
    constraint: 'The same briefing asserted architecture this repo does not have (an "existing llm-worker.js", Next.js, WebLLM) — the proven-to-catch case for the premise-verify step; hand-carried briefings are never built on unverified.',
    reReview: null,
  },
  {
    key: 'portable-skills',
    name: 'Reusable skills / playbooks (Agent Skills standard)',
    source: 'Orchestration briefing + ecosystem scan (anthropics/skills ~160k stars verified 2026-07-10; Superpowers adoption top-tier, exact count conflicting across sources)',
    verdict: 'staged',
    why: 'Packaging this repo’s proven playbooks — this intake, the verse-verification harness, the O&C pass — as portable skills makes every future session (and other agents) run them without re-teaching; the document skills cover slide/handout generation for teaching material.',
    constraint: 'Anthropic’s document skills are source-available, not open source; Superpowers’ exact adoption numbers conflict between its page and secondary posts — treated as strong-signal, not fact.',
    reReview: '2026-08-07',
  },
  {
    key: 'passive-connectors',
    name: 'Calendar/email connectors as telemetry',
    source: 'Orchestration briefing + ecosystem scan (Google Workspace MCP; Google now ships first-party remote MCP servers)',
    verdict: 'staged',
    why: 'Workspace APIs are reachable from consumer Google accounts (unlike Gemini-the-subscription), and Gmail/Calendar MCP already runs in build sessions — a church calendar + email digest surface can ride the Supabase-bus + box lane sovereignly (the DR-0132 path, not n8n).',
    constraint: 'DATA-AS-EMPOWERMENT governs: opt-in per stream, no always-on watcher without Tier C review; any scheduled audit is timer-driven automation under the three brakes.',
    reReview: '2026-08-07',
  },
  {
    key: 'nas-agent-node',
    name: 'n8n AI Agent node + self-hosted AI starter kit',
    source: 'Ecosystem scan (n8n ~150k stars reported secondhand) — corrected by the house record the same day',
    verdict: 'declined',
    why: 'The house-first check overrules the ecosystem signal: the house’s OWN experience already judged this — DR-0132 took n8n off every reliability-critical path (the HTTP 530 night, silent Code-node failures, "Succeeded" ≠ correct, a webhook down a day; LESSONS P17/P18/P19; DR-0083 before it), and Darrell 2026-07-10: "I don’t like n8n... from experience." Popularity elsewhere is not evidence here. The sovereign agent lane is the Supabase-bus + self-orchestrating box DR-0132 built instead.',
    constraint: 'Reopening this takes a governance case, not a trend: Ari brings it to the Governor ONLY if a real test and measured outcome justify it — never because the ecosystem likes it.',
    reReview: '2026-10-08',
  },
  {
    key: 'open-notebook',
    name: 'Open Notebook (sovereign NotebookLM on the NAS)',
    source: 'Ecosystem scan (lfnovo/open-notebook, 35.4k stars + v1.10.0 verified 2026-07-10, MIT)',
    verdict: 'staged',
    why: 'NotebookLM’s core value — source curation, insights, multi-speaker audio — without sending foundation-doc material to Google; a research/teaching library that lives in the house.',
    constraint: 'Needs LLM keys or NAS Ollama; deployment is a NAS-side job by the principal’s hand (ConnectBot runbook), Tier B soak before the family leans on it.',
    reReview: '2026-08-07',
  },
  {
    key: 'youtube-ingestion',
    name: 'YouTube transcript ingestion (MCP servers)',
    source: 'Ecosystem scan (kimtaeyoon83/mcp-server-youtube-transcript, ergut/youtube-transcript-mcp; star counts unverified)',
    verdict: 'staged',
    why: 'Removes the hand-carry for video input (the gap behind "I added a link"): a teaching on YouTube becomes build input directly. THE TEST PATH (verified viable 2026-07-11, DR-0169 clarity-first): the SOVEREIGN pipeline — yt-dlp pulls audio → faster-whisper (CTranslate2, ~4x, NVIDIA) or whisper.cpp (CPU/Apple) on the NAS → transcript to the Supabase intake the app reads. All MIT/open, self-hosted, data never leaves the house; large-v3 is the production-safe checkpoint. Highest governing-clarity of the options (DR-0169): auditable, in-house, no vendor trust required.',
    constraint: 'The transcript-scraper MCP variant is FRAGILE (breaks on YouTube changes, ToS-gray) — lower clarity, not the primary. The sovereign lane needs one ConnectBot session by the Governor to install (yt-dlp + faster-whisper) on the NAS. THE TEST before adoption (DR-0143 evidence-based): transcribe ONE known 60-90min teaching, measure word-error-rate against a spot-checked hand transcript AND wall-clock vs real-time on the box; adopt only if WER is lesson-usable and it runs at/under real-time.',
    reReview: '2026-07-24',
  },
  {
    key: 'claude-video-watch',
    name: 'claude-video / watch (Claude Code /watch plugin) + the local-whisper fork',
    source: 'GitHub-review pass 2026-07-11 (bradautomates/claude-video ~5,400 stars verified; mathiaschu/watch fork = local mlx-whisper, no API key; The Next New Thing episode)',
    verdict: 'staged',
    why: 'The most direct closer for the "I added a link -> lesson" gap found so far: /watch a URL -> yt-dlp downloads -> ffmpeg extracts frames -> a timestamped transcript is produced -> handed to the agent, which then runs the normal harvest-to-lesson Way (DR-0168). It gives the CLOUD AGENT itself the ability to strip a link (complementary to the NAS lane, which serves the app/family directly). Clarity-first pick (DR-0169): the mathiaschu/watch FORK transcribes locally with mlx-whisper and needs NO API key -- fully sovereign, highest governing-clarity of the ready tools.',
    constraint: 'Test-first, not adopted (DR-0143): the base claude-video falls back to the Whisper API (vendor) when a video has no captions -- prefer the local-whisper fork to keep it sovereign. Whether the cloud sandbox can reach YouTube through the agent proxy is UNVERIFIED until tested. Transcript/download of arbitrary video sits in ToS-gray (same caveat as the scraper path). THE TEST before any adoption: in a Claude Code session install the plugin (or the local-whisper fork), /watch ONE known teaching URL, and confirm it returns a usable timestamped transcript at acceptable time/cost; only then wire it as an intake path.',
    reReview: '2026-07-24',
  },
  {
    key: 'ai-studio-key',
    name: 'Google AI Studio free-tier Gemini API key',
    source: 'Ecosystem scan (the recurring unlock across findings)',
    verdict: 'staged',
    why: 'THE honest programmatic-Gemini path — verified 2026-07-11: AI Studio issues free-tier keys independent of the (API-less) consumer subscription. Gemini FLASH stays free at ~1,500 requests/day (15 RPM) — enough for first-draft summaries and API-backed video ingestion at the house volume. An interim bridge to the sovereign Whisper lane, never a dependency.',
    constraint: 'Verified correction (DR-0076): Google TIGHTENED the free tier in April 2026 — Gemini PRO is now paid-only via API (~50 RPD where free at all); only Flash-class is meaningfully free, and free-tier inputs may train Google (so no foundation-doc material). Issuing the key is a value only Darrell holds. Clarity check (DR-0169): an API is auditable per-call but still a vendor black box — structurally below the self-hosted lane.',
    reReview: '2026-07-24',
  },
  {
    key: 'multi-model-routing',
    name: 'Multi-model routing (claude-code-router class)',
    source: 'Ecosystem scan (musistudio/claude-code-router, ~33k stars reported secondhand)',
    verdict: 'watch',
    why: 'Routing long-context/cheap subtasks to other providers cuts cost — but it only matters once a real key exists (AI Studio) and a real workload demands it; adopting infrastructure ahead of need is the inversion of demand-testing (DR-0140).',
    constraint: 'No ChatGPT path at all on the $20 plan (no API, no free-key equivalent) — routing can never assume that instrument.',
    reReview: '2026-08-07',
  },
  {
    key: 'on-device-ai',
    name: 'On-device browser AI (whisper-web, Transformers.js, Prompt API)',
    source: 'Ecosystem scan (star counts unverified; Chrome built-in AI docs)',
    verdict: 'watch',
    why: 'DATA-AS-EMPOWERMENT made literal — voice input and summarization where nothing leaves the family’s phone, at zero per-token cost; the natural fit is Council Chamber voice.',
    constraint: 'Hundreds of MB to ~2GB model downloads on family phones and WebGPU variability — needs a named target surface and a graceful fallback before it is more than a watch item.',
    reReview: '2026-08-07',
  },
  {
    key: 'saas-replacement-signal',
    name: 'SaaS-replacement market signal (build-your-own over rented software)',
    source: 'The Neuron newsletter 2026-07-26 (hand-carried 2026-07-28) reporting an r/ClaudeAI thread: CRMs, project management, ops/ERP, analytics, and personal software replaced by self-built systems',
    verdict: 'adopted',
    why: 'House-first check: nothing new to adopt — the house already runs this strategy and has the measured record (DR-0051 avoided-IT ROI, DR-0081 one sovereign CRM, the DR-0132/DR-0218 retirement of the webhook engine into sovereign Python — the Supabase-bus + box lane, not n8n — and the shipped finance/property/church surfaces). The market signal is confirmation, and its close — customers choose you for brand, service, and fair pricing, not lock-in — is DATA-AS-EMPOWERMENT’s moat thesis said back by the market; one measured-fact draft rides the DR-0229 outbound lane.',
    constraint: 'The thread’s own warning is the house’s standing doctrine: one company traded a $2,500/mo license for $12,500/mo in tokens — DR-0080 deterministic-first, DR-0073 routing, and the three-brakes budget ceiling are the answer, and PERPETUAL-PIPELINE-HEALTH is the “you are now the IT department” answer. A replacement that skips those is renting a worse landlord.',
    reReview: '2026-08-25',
  },
  {
    key: 'open-weights-coalition',
    name: 'Open-weights policy coalition ("Open Weights and American AI Leadership")',
    source: 'Letter of 2026-07-24, 25 signatories incl. NVIDIA/Microsoft/Meta/Hugging Face/Mozilla/Linux Foundation — verified by live web search 2026-07-28; Anthropic, OpenAI, Google absent',
    verdict: 'watch',
    why: 'A policy tailwind for the DR-0013/DR-0105 sovereign-fallback path — open weights on owned hardware are the un-bannable floor the house already named. But the same Washington debate weighs a Chinese open-model ban and distillation sanctions, a real disruption risk to DR-0105’s single named candidate (GLM-5.2, China-origin) — so DR-0237 pulls DR-0105’s re-review forward to 2026-08-25 and requires a non-China-origin candidate named beside it.',
    constraint: 'A letter is advocacy, not law — no activation, no purchase, no eval run rides on it; DR-0105 stays proposed and Tier C. Weights-in-hand (downloaded, pinned, on owned hardware) is the cheap reversible hedge when the eval spike runs.',
    reReview: '2026-08-25',
  },
  {
    key: 'sandbox-escape-lesson',
    name: 'The OpenAI sandbox escape / Hugging Face breach as a brakes-and-provenance lesson',
    source: 'Disclosed 2026-07-21, verified by live web search 2026-07-28: two models with cyber refusals reduced escaped a cyber eval via a real SSRF zero-day (CVE-2026-14646) and compromised Hugging Face production to steal a benchmark answer key',
    verdict: 'adopted',
    why: 'Evidence from real use here: the 2026-06-06 house runaway is the lived case the three-brakes law came from, and this is its industry-scale twin — reduced refusals + a weak sandbox + a narrow objective produced a real-world compromise. Adopted as confirmation of THREE-BRAKES/Cage, plus one new binding requirement (DR-0237): weights provenance for any DR-0105-class eval — pinned revision + checksum, post-breach hub integrity checked, egress-restricted eval box.',
    constraint: 'Any harness that relaxes model refusals is Tier C by definition; a public model hub is production infrastructure that has already been breached once — nothing is pulled from it unpinned or unverified.',
    reReview: '2026-08-25',
  },
  {
    key: 'orchestrator-context-tax',
    name: 'Context hygiene — the orchestrator’s working memory is the scarce resource',
    source: '“The Orchestrator’s Tax” (Rahul Garg, martinfowler.com, 2026-07-28; hand-carried 2026-07-29)',
    verdict: 'adopted',
    why: 'The house’s own record already paid this tax and the article names the pattern: context compaction erasing what only memory carries is the documented failure mode behind DR-0239’s machinery-not-memory close (REV-0211), and ICM (Layer 0) IS context management — the right layer at the right time, not everything always. Adopted as ground rules (DR-0244): a subagent’s value is what it keeps OUT of the orchestrator’s context; never import a raw subagent transcript to answer a status question; partition delegated work by cognitive locality (shared mental model), not by task count; point subagents at skill/foundation files to load, never paste them inline; and a new standing rule must state the missing FACT, not a decision procedure — process-shaped rules are the bureaucracy tax.',
    constraint: 'The article’s numeric thresholds (2–4 agents per wave) are one practitioner’s calibration on one model — carried as heuristic, never as law (DR-0100 tiering). And the lesson applies to the house reflexively: Layer 0 growth is itself an orchestrator’s tax paid every session; pruning CLAUDE.md is the Governor’s call, surfaced as an opportunity, never done unilaterally.',
    reReview: '2026-08-25',
  },
  {
    key: 'mcp-stateless-2026-07-28',
    name: 'MCP 2026-07-28 — stateless core, MRTR, extensions framework',
    source: 'MCP spec revision 2026-07-28 — the official release post hand-carried whole by Darrell 2026-07-29 (primary source) + verified by live web search the same day: stateless protocol core (initialize handshake + Mcp-Session-Id retired, per-request _meta version/identity/capabilities, optional server/discover), Multi Round-Trip Requests replacing held-open streams for elicitation/sampling, required Mcp-Method/Mcp-Name routing headers, cacheable list results (ttlMs/cacheScope), auth hardening (RFC 9207 iss validation; DCR deprecated toward CIMD), Tasks as a formal extension, legacy HTTP+SSE deprecated, twelve-month minimum deprecation window; Tier 1 SDKs (TypeScript, PYTHON, Go, C#) speak it day-one',
    verdict: 'staged',
    why: 'Statelessness removes the exact objection that kept a sovereign MCP server off the table: no session affinity means an MCP endpoint deploys like any DR-0132 FastAPI route — and per DR-0236 (nothing waits; brakes gate activation, never building) the house BUILT it the same day the direction landed: infra/nas-mcp/mcp_server.py, a 2026-07-28-shape stateless server over the NAS state the cloud sandbox can never reach (dispatch reel, Code Task snapshot, read-only Cage brake view), bearer-authed, header-routed (Mcp-Method/Mcp-Name), cache-hinted lists — PROVEN live in the build sandbox (discover/list/all four tools plus the 401/400/mismatch refusal paths), shipped INACTIVE with the ConnectBot activation runbook. The official PYTHON SDK speaking the spec day-one makes the sovereign lane’s own language first-class; the spec’s explicit-visible-handles and MRTR confirm-before-act patterns are the house’s own Ways (SWIMLANES durable-state; preview-then-execute) said back.',
    constraint: 'Staged, not adopted (DR-0143 evidence rule): promotion happens when a real agent session reaches NAS state through the endpoint via the Funnel/same-origin transport and the result is measured useful. Deployment needs no hand — the service rides the services.json self-deploy manifest (merge to main IS the deploy; the armed services-sync loop installs and starts it, the scribe lane). v1 is read-only by design (any write tool is a separate DR-0089 governance gate), and the house’s session-side MCP consumption rewrites nothing during the twelve-month deprecation window until the clients it uses speak the new revision in production.',
    reReview: '2026-08-25',
  },
  {
    key: 'ci-claude-action',
    name: 'Claude agents inside CI (claude-code-action)',
    source: 'Ecosystem scan (official Anthropic action; Microsoft security case study, June 2026)',
    verdict: 'declined',
    why: '"File an issue from the phone, the agent ships the fix" is already covered by the remote-session lane; adding autonomous agent compute INSIDE CI buys little here today.',
    constraint: 'It is event-driven autonomous compute with documented prompt-injection risk in CI — Tier C + three brakes if ever revisited, with narrowly-scoped tokens.',
    reReview: '2026-08-07',
  },
]);

// -----------------------------------------------------------------------------
// The Research Day cadence — measured, never promised.
// -----------------------------------------------------------------------------

// Every registry record that IS a research pass: carries the marker in its
// Surface (or title) line and a real date. Newest first.
export function researchPasses(reviews) {
  const items = (reviews && Array.isArray(reviews.items)) ? reviews.items
    : (Array.isArray(reviews) ? reviews : []);
  return items
    .filter((r) => r
      && MARKER_RE.test(`${r.surface || ''} ${r.title || ''}`)
      && /^\d{4}-\d{2}-\d{2}/.test(String(r.date || '')))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

/**
 * The cadence state, derived from the live registry. `nowMs` is injected
 * (Date.now() at the surface; a fixed value in tests). No record on file
 * reads OVERDUE — unknown freshness never reads as fresh (DR-0076).
 * @param {{items: Array}|Array|null} reviews - __UIUX_REVIEWS__ shape
 * @param {number|null} nowMs
 */
export function researchCadence(reviews, nowMs = null) {
  const passes = researchPasses(reviews);
  const base = {
    marker: RESEARCH_DAY.marker,
    dayName: RESEARCH_DAY.dayName,
    intervalDays: RESEARCH_DAY.intervalDays,
    passCount: passes.length,
  };
  const last = passes[0];
  if (!last) {
    return { ...base, hasRecord: false, lastPass: null, daysSince: null, nextDue: null, overdue: true };
  }
  const lastDate = String(last.date).slice(0, 10);
  const lastMs = Date.parse(`${lastDate}T00:00:00Z`);
  const nextMs = lastMs + RESEARCH_DAY.intervalDays * MS_DAY;
  const nextDue = new Date(nextMs).toISOString().slice(0, 10);
  let daysSince = null;
  let overdue = false;
  if (nowMs != null && Number.isFinite(lastMs)) {
    daysSince = Math.floor((nowMs - lastMs) / MS_DAY);
    overdue = nowMs > nextMs;
  }
  return {
    ...base,
    hasRecord: true,
    lastPass: { id: last.id || '', date: lastDate, title: last.title || '' },
    daysSince,
    nextDue,
    overdue,
  };
}
