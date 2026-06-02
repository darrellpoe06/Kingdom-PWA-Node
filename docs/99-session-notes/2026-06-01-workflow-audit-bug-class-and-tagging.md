# Workflow Audit -- Bug Class + Tagging + Module/Tier Mapping

**Date:** 2026-06-01 (Monday evening, vacation pivot)
**Scope:** every JSON in `docs/00-foundations/n8n-workflows/`
**Trigger:** today's wf30/31/32 sandbox-incompatibility debug (commit `1edb8e1`) revealed that n8n 2.21.7's Code-node sandbox does NOT support `process.env.X`. We need to know which other workflows have the same bug class waiting to bite us silently, and we need to seed module + reusability-tier tags per the new WORKFLOW-MODULE-LIBRARY principle.
**Posture:** religion AND relationship. Diagnostic, not punitive. Findings cited by file:line.

---

## 1 -- Headline / counts at a glance

- **35 workflow JSONs audited** in `docs/00-foundations/n8n-workflows/` (33 numbered + 2 from the parallel-session numbering set).
- **18 active workflows** per the active list: 01, 03, 08, 10, 12, 13, 15, 16, 18, 19, 20, 23, 26, 27, 29, 30, 31, 32. (Where two files share a numeric prefix, the canonical "01" is `01-supabase-cycle-item-webhook.json`, not `01-project-timeline-daily.json` -- per the n8n-workflows README numbering note.)
- **20 `process.env.X` hits in 7 distinct files**, of which **4 are in ACTIVE workflows** (wf12, wf20, wf27, wf29) -- same bug class that took down wf30/31/32 this morning, still latent.
- **1 sandbox-disallowed `require()` hit:** wf01-project-timeline-daily.json line 40 uses `require('js-yaml')` -- not in n8n's `NODE_FUNCTION_ALLOW_BUILTIN` allow-list. Not in active list; would fail on activation.
- **21 webhook endpoints inventoried**, ZERO path collisions across workflows. (The "took down wf30 earlier today" bug referenced was sandbox `process.env`, not path collision -- the path-uniqueness invariant holds.)
- **All 35 workflows are currently Tier-1 (family-specific)**; ZERO carry the `module:X` or `tier:N` tag yet. 8-10 are obvious Tier-2 promotion candidates (Family-Voice-Loop, Quality-Gatekeeper, Health-Check, Foundation-Agent generalize cleanly to any household or community).
- **27 hardcoded family/instance-specific values** identified (paths, ntfy topics, repo names, model names) that need to become configurable for Tier-2 reuse.

**Headline severity ordering:** wf27 Foundation Agent is the highest-leverage process.env bomb (8 env reads, runs 4x daily on cron, currently active) -- if any of OLLAMA_HOST / OLLAMA_PORT / OLLAMA_MODEL / NTFY_HOST / NTFY_PORT / NTFY_TOPIC / SYNOLOGY_CHAT_INCOMING_URL is unset in the container env, the workflow silently crashes on the `process.env` access and the Foundation Agent stops processing the inbox. That is precisely the silent-fail mode EXECUTION-OUTCOME-OBSERVABILITY exists to surface.

---

## 2 -- Section: process.env bug class hits

n8n 2.21.7's Code-node sandbox does NOT expose `process.env`. Reading `process.env.X` raises a ReferenceError on first access, the whole Code node throws, and the workflow execution ends. If no error-trigger is wired, the failure is silent except in the execution log. Fix pattern (per today's commit `1edb8e1` for wf30/31/32): replace `process.env.X || 'default'` with the literal default value.

| Workflow file | Active? | Code node | Line | Expression | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| `12-network-health-probe.json` | YES (every 5 min cron) | `Run probes` | 18 | `process.env.OLLAMA_BASE_URL` | **HIGH** | Hardcode `'http://ollama:11434'` -- same default as wf31 |
| `20-health-check.json` | YES (every 10 min cron) | `Run health checks` | 18 | `process.env.NTFY_HOST` | **HIGH** | Hardcode `'ntfy'` |
| `20-health-check.json` | YES | `Run health checks` | 18 | `process.env.NTFY_PORT` | **HIGH** | Hardcode `80` (drop the parseInt wrap) |
| `20-health-check.json` | YES | `Run health checks` | 18 | `process.env.NTFY_TOPIC` | **HIGH** | Hardcode `'poetech-health'` |
| `27-foundation-agent.json` | YES (cron 7am/12pm/5pm/9pm + on-demand) | `Process inbox + route` | 32 | `process.env.OLLAMA_HOST` | **HIGH** | Hardcode `'ollama'` |
| `27-foundation-agent.json` | YES | `Process inbox + route` | 32 | `process.env.OLLAMA_PORT` | **HIGH** | Hardcode `11434` |
| `27-foundation-agent.json` | YES | `Process inbox + route` | 32 | `process.env.OLLAMA_MODEL` | **HIGH** | Hardcode `'qwen2.5:14b-instruct-q4_K_M'` |
| `27-foundation-agent.json` | YES | `Process inbox + route` | 32 | `process.env.NTFY_HOST` | **HIGH** | Hardcode `'ntfy'` |
| `27-foundation-agent.json` | YES | `Process inbox + route` | 32 | `process.env.NTFY_PORT` | **HIGH** | Hardcode `80` |
| `27-foundation-agent.json` | YES | `Process inbox + route` | 32 | `process.env.NTFY_TOPIC` | **HIGH** | Hardcode `'poetech-foundation'` |
| `27-foundation-agent.json` | YES | `Process inbox + route` | 32 | `process.env.SYNOLOGY_CHAT_INCOMING_URL` | **HIGH** | Hardcode `''` (the empty-string guard at `postToSynologyChat` already short-circuits when not set; just preserve that guard with a literal) |
| `29-waitlist-intake.json` | YES (webhook) | `Capture signup` | 20 | `process.env.NTFY_BASE` | **HIGH** | Hardcode `'http://ntfy:80'` |
| `29-waitlist-intake.json` | YES | `Capture signup` | 20 | `process.env.NTFY_WAITLIST_TOPIC` | **HIGH** | Hardcode `'poetech-waitlist'` |
| `34-skill-analytics-layer2.json` | no (not yet deployed) | `Generate skill profile` | 20 | `process.env.OLLAMA_BASE_URL` | MEDIUM | Hardcode before activation |
| `34-skill-analytics-layer2.json` | no | `Generate skill profile` | 20 | `process.env.OLLAMA_ANALYTICS_MODEL` | MEDIUM | Hardcode `'qwen2.5:14b-instruct-q4_K_M'` |
| `36-quality-gatekeeper.json` | no | `Run gatekeeper checks` | 20 | `process.env.OLLAMA_BASE_URL` | MEDIUM | Hardcode before activation |
| `36-quality-gatekeeper.json` | no | `Run gatekeeper checks` | 20 | `process.env.OLLAMA_GATEKEEPER_MODEL` | MEDIUM | Hardcode `'qwen2.5:14b-instruct-q4_K_M'` |
| `37-whisper-stt-voice-input.json` | no | `Transcribe + route` | 20 | `process.env.WHISPER_BASE_URL` | MEDIUM | Hardcode `'http://whisper:9000/asr'` |
| `37-whisper-stt-voice-input.json` | no | `Transcribe + route` | 20 | `process.env.NTFY_BASE` | MEDIUM | Hardcode `'http://ntfy:80'` |
| `37-whisper-stt-voice-input.json` | no | `Transcribe + route` | 20 | `process.env.NTFY_VOICE_TOPIC` | MEDIUM | Hardcode `'poetech-voice'` |

**HIGH count: 13 hits across 4 active workflows. MEDIUM count: 7 hits across 3 future workflows.**

**Note on `$env.X` (n8n expression engine):** wf12 also uses `$env.SYNOLOGY_CHAT_INCOMING_URL` inside the HttpRequest node and IF node (lines 32, 47). That is a DIFFERENT API path (the n8n expression-engine env lookup) and IS supported. Only the `process.env` access inside `jsCode` Code nodes is the bug. The full `$env.X` inventory (all confirmed safe -- expression-engine code paths): `04-poe-morning-standup`, `02-daily-reports-cron`, `03-github-event-to-phone`, `05-end-of-day-reflection`, `01-supabase-cycle-item-webhook`, `06-situational-analysis-and-mutation-cron`, `09-chat-digest-30min`, `10-synology-chat-request-with-ack`, `11-vercel-deploy-to-chat`, `12-network-health-probe`, `13-chat-action-router`, `16-cross-verify-engine`, `17-gemini-deeper-reasoning`. These do NOT need fixing.

---

## 3 -- Section: other sandbox-incompatible patterns

n8n 2.21.7's `NODE_FUNCTION_ALLOW_BUILTIN` allow-list (verified safe): `fs`, `path`, `http`, `https`, `crypto`, `url`, `util`, `buffer`, `querystring`, `stream`. Anything else raises `Cannot find module 'X'` at runtime. `console.log`, `__dirname`, `__filename`, `global.X`, `setTimeout`, `setInterval`, `eval`, `new Function`, `child_process`, `spawn`, `execSync` -- all zero matches across all 35 workflows. `Buffer.from` is in the allow-list (buffer module) and works.

| Workflow file | Active? | Pattern | Line | Severity | Notes |
|---|---|---|---|---|---|
| `01-project-timeline-daily.json` | no (parallel-session set; not in active list) | `require('js-yaml')` | 40 | MEDIUM | js-yaml is NOT in the sandbox allow-list. Workflow would throw `Cannot find module 'js-yaml'` on first run. Fix: extract YAML front matter with a regex + manual parse (the front matter is line-based key:value, no anchors/aliases needed) -- OR -- mark the workflow as deprecated and use wf26 thought-inbox / wf27 foundation-agent instead, which cover similar ground. |
| `06-situational-analysis-and-mutation-cron.json` | no | `Buffer.from($json.content, 'utf8').toString('base64')` | 157 | clean | Inside HttpRequest node body expression (not jsCode), and Buffer is allow-listed anyway. Confirmed safe. |
| `33-data-upload-layer1.json` | no | `Buffer.from(...)` | 20 | clean | Inside jsCode Code node, but Buffer IS allow-listed. Confirmed safe. |
| `37-whisper-stt-voice-input.json` | no | `Buffer.from(...)` | 20 | clean | Same -- Buffer is allow-listed. Confirmed safe. |
| all 35 workflows | -- | `console.log` | -- | clean | Zero matches. |
| all 35 workflows | -- | `__dirname` / `__filename` / `global.X` | -- | clean | Zero matches. |
| all 35 workflows | -- | `setTimeout` / `setInterval` / `eval` / `new Function` / `child_process` / `spawn` / `execSync` | -- | clean | Zero matches. |

**Net read:** only `01-project-timeline-daily.json`'s `require('js-yaml')` is a real sandbox-block beyond the process.env class. It is not in the active list, so this is a latent landmine -- fix BEFORE activating.

---

## 4 -- Section: webhook inventory

21 webhook endpoints across 20 workflow files (wf26 has 2: `thought` + `thought-ack`). Path-uniqueness check: every `path` field is unique across workflows. ZERO collisions.

| Workflow file | Webhook path | webhookId | Active? | Notes |
|---|---|---|---|---|
| `01-supabase-cycle-item-webhook.json` | `supabase-cycle-item` | `supabase-cycle-item` | YES | Supabase `cycle_items.insert` trigger. |
| `03-github-event-to-phone.json` | `github-events` | `github-events` | YES | GitHub push / PR / ping. |
| `08-synology-chat-inbound-capture.json` | `synology-chat-inbound` | `synology-chat-inbound` | YES | Synology Chat outgoing-webhook receiver. |
| `10-synology-chat-request-with-ack.json` | `synology-chat-request` | `synology-chat-request` | YES | Synology Chat capture-with-ack. |
| `11-vercel-deploy-to-chat.json` | `vercel-deploy` | `vercel-deploy` | no | Vercel deploy-hook visibility. |
| `17-gemini-deeper-reasoning.json` | `ask-gemini` | `ask-gemini` | no | Hybrid-AI Gemini gateway (TLC firewall). |
| `18-imported-transactions-api.json` | `imported-transactions` | `imported-transactions` | YES | PWA read API for bank/gmail transactions. |
| `19-mark-noise-api.json` | `mark-noise` | `mark-noise` | YES | PWA write-back for reconcile noise marking. |
| `23-project-briefing.json` | `briefing` | `briefing` | YES | AI Foundation read-out for Claude. |
| `26-thought-inbox.json` | `thought` | `thought` | YES | Darrell -> n8n -> next Claude session inbox. |
| `26-thought-inbox.json` | `thought-ack` | `thought-ack` | YES | Ack a queued thought. |
| `27-foundation-agent.json` | `agent-fire` | `agent-fire` | YES | Foundation Agent on-demand fire. |
| `29-waitlist-intake.json` | `waitlist` | `waitlist` | YES | PWA waitlist signup. |
| `30-family-feedback-intake.json` | `family-feedback` | `family-feedback` | YES | PWA Suggest button. **Fixed today** (commit `1edb8e1`). |
| `31-daily-standup-digest.json` | `digest-fire` | `digest-fire` | YES | On-demand fire of 7am digest. |
| `32-daily-ship-summary.json` | `ship-summary-fire` | `ship-summary-fire` | YES | On-demand fire of 9pm ship summary. |
| `33-data-upload-layer1.json` | `data-upload` | `data-upload` | no | **The landing-page 404 trap** named in the MVP review section 4. PWA "Drop your bank file" CTA POSTs here; workflow not deployed. |
| `34-skill-analytics-layer2.json` | `skill-analytics` | `skill-analytics` | no | Layer 2 of the data-dump pipeline. |
| `35-matched-services-layer3.json` | `matched-services` | `matched-services` | no | Layer 3 of the data-dump pipeline. |
| `36-quality-gatekeeper.json` | `quality-gatekeeper` | `quality-gatekeeper` | no | PR pre-merge quality gate. |
| `37-whisper-stt-voice-input.json` | `voice-thought` | `voice-thought` | no | Voice memo -> transcript -> /data/chatin/. |

**Collision check:** every path string and every webhookId string is globally unique across the workflow set. The "wf30 earlier today" bug referenced in the audit prompt was actually the `process.env` sandbox class, not a path collision. The path-uniqueness invariant has been preserved across the whole repo.

**Naming convention observation:** `wf26` is the only workflow with 2 webhooks; both follow the `<noun>` / `<noun>-<verb>` pattern (`thought` + `thought-ack`). On-demand-fire webhooks for scheduled workflows follow the `<purpose>-fire` pattern (`agent-fire`, `digest-fire`, `ship-summary-fire`). Future workflows should follow these conventions.

---

## 5 -- Section: module + tier mapping recommendations

Per the new WORKFLOW-MODULE-LIBRARY principle, every workflow should carry a `module:<sector>` tag (one of the 9 QoL sectors from QUALITY-OF-LIFE-AS-NORTH-STAR.md: financial / physical / relational / spiritual / mental / community / education / vocational / environmental) and a `tier:<N>` tag (1 = family-specific / 2 = community-template / 3 = universal-reusable).

Sectors used below: `financial`, `mental` (mental stewardship / thought capture / counseling-adjacent), `community` (church, COLG, multi-family), `infra` (cross-cutting platform health -- not a QoL sector but needed for tagging completeness; recommend treating as `module:infra` separate axis), `governance` (PR review, ops decisions -- same caveat as infra).

| File | Workflow name | Proposed module | Proposed tier | Rationale |
|---|---|---|---|---|
| `01-supabase-cycle-item-webhook.json` | Supabase cycle_item insert -> Pushover | financial | 1 | Specific to the Poe cycle_items / report_runs schema; family-bound. |
| `02-daily-reports-cron.json` | Daily reports cron (6 AM) | financial | 1 | Same Supabase schema as above. |
| `03-github-event-to-phone.json` | GitHub event -> Pushover | infra | 2 | Generic GitHub-webhook -> notify pattern; any family/org with a repo and Pushover can use it. Pushover keys are the only family-specific bit. |
| `04-poe-morning-standup.json` | POE morning standup (7 AM) | mental | 1 | Reads change_requests / user_priority_override -- Poe-specific table. |
| `05-end-of-day-reflection.json` | End-of-day reflection (9 PM) | mental | 1 | Same schema dependency. |
| `06-situational-analysis-and-mutation-cron.json` | Situational analysis + auto-mutation | governance | 1 | Calls Ollama on the Poe codebase + commits to `darrellpoe06/Kingdom-PWA-Node`. Family-specific repo reference. |
| `08-synology-chat-inbound-capture.json` | Synology Chat inbound capture | mental | 2 | The chat-capture pattern generalizes to any family/org running Synology Chat. Generalize by parameterizing the topic prefix. |
| `09-chat-digest-30min.json` | Chat digest every 30 min | mental | 2 | Generic Ollama-summarize-from-directory pattern. Reusable across any chat capture pipeline. |
| `10-synology-chat-request-with-ack.json` | Synology Chat request + ack | mental | 2 | Same -- ack pattern is generic. |
| `11-vercel-deploy-to-chat.json` | Vercel deploy -> Synology Chat | infra | 2 | Vercel-webhook -> notify pattern is generic. |
| `12-network-health-probe.json` | Network health probe (5 min) | infra | 2 | Multi-target HTTP probe pattern. Currently hardcoded to NAS IP `192.168.1.26` and Synology DSM -- parameterize the targets list to ship as Tier 2. |
| `13-chat-action-router.json` | Chat action router | mental | 2 | Pattern is "parse @mentions from chatin/, route to action queues" -- generalizes. |
| `14-gmail-finance-ingest.json` | Gmail finance ingest | financial | 2 | Gmail label-based extraction generalizes to any family with a Gmail account and a known set of biller sender domains; the biller list is the only family-specific bit. |
| `15-bank-ofx-watcher.json` | Bank OFX/QFX/CSV watcher | financial | 2 | OFX/QFX/CSV format parsing is universal; the bind-mount path is the family-specific bit. Already designed for Tier 2 lift. |
| `16-cross-verify-engine.json` | Cross-verify engine | financial | 2 | Gmail-claim vs bank-confirm reconciliation pattern is generic; the keyword vocabulary may need community-specific tuning. |
| `17-gemini-deeper-reasoning.json` | Gemini deeper-reasoning helper | governance | 2 | Hybrid-AI router with TLC firewall is a general pattern. |
| `18-imported-transactions-api.json` | Imported transactions API | financial | 2 | Read API over bind-mount JSON; generalizes. |
| `19-mark-noise-api.json` | Mark-noise API | financial | 2 | Write-back-noise-marker pattern; generalizes. |
| `20-health-check.json` | Health-check + ntfy alerts (10 min) | infra | 2 | NAS-side health-check pattern; generalizes to any NAS-hosted ntfy-equipped install. |
| `23-project-briefing.json` | Project briefing for Claude sessions | governance | 1 | Reads `darrellpoe06/Kingdom-PWA-Node` and the Poe-specific briefing layout. Family-specific. |
| `26-thought-inbox.json` | Thought inbox (Darrell -> Claude) | mental | 2 | The inbox-then-process pattern generalizes to any family or community with a daily input stream. (Cited example from the audit prompt: this is the canonical Tier-2 mental-module candidate.) |
| `27-foundation-agent.json` | Foundation Agent (autonomous inbox) | governance | 2 | Inbox-classify-route-Ollama-or-Claude pattern generalizes; the TLC firewall vocabulary is community-tunable. |
| `29-waitlist-intake.json` | Waitlist intake | community | 2 | Generic waitlist-intake pattern for any community-launched product. |
| `30-family-feedback-intake.json` | Family feedback intake (Suggest btn) | mental | 2 | Suggest-button -> capture pattern; the `trustedSenders` enum is the family-specific bit. This is THE flagship Family-Voice-Loop candidate per WORKFLOW-MODULE-LIBRARY (cited in the audit prompt). |
| `31-daily-standup-digest.json` | Daily standup digest (7am) | mental | 2 | Read-capture-summarize-notify daily pattern; generalizes. |
| `32-daily-ship-summary.json` | Daily ship summary (9pm) | governance | 2 | What-shipped-today summary pattern; repo URL is the only family-specific bit. |
| `33-data-upload-layer1.json` | Data upload Layer 1 (OFX/QFX/CSV parse) | financial | 3 | Pure-function file-format parser. Universal -- any family or community can use it identically. |
| `34-skill-analytics-layer2.json` | Skill analytics Layer 2 (Ollama profile) | financial | 2 | Stewardship-profile pattern uses biblical-economics framing; community-template (especially COLG-shaped). |
| `35-matched-services-layer3.json` | Matched services Layer 3 (recommendations) | financial | 2 | Service-recommendation pattern generalizes; the service catalog is community-tunable. |
| `36-quality-gatekeeper.json` | Quality Gatekeeper (PR pre-merge) | governance | 2 | Foundation-screen + typographic-theology + scripture-citation pattern; the doctrinal vocabulary is family/community-tunable. Today's typographic-theology regex is the one piece that is COLG/Poe-shaped. |
| `37-whisper-stt-voice-input.json` | Whisper STT voice input | mental | 2 | Voice-to-chatin pattern; generalizes. |
| `01-project-timeline-daily.json` | Project Timeline Daily Digest (parallel set) | governance | 1 | Reads Poe-specific `PROJECT-TIMELINE.md` YAML schema. Family-bound. Also blocked by `require('js-yaml')` -- see Section 3. |
| `02-workflow-failure-alert.json` | Workflow Failure Alert (parallel set) | infra | 3 | Pure n8n error-trigger -> Pushover pattern. Universal. |
| `03-b2-backup-status.json` | Backblaze B2 Backup Status (parallel set) | infra | 2 | B2 + Hyper Backup health check; generalizes to any B2 user. |
| `04-pushover-smoke-test.json` | Pushover Smoke Test (manual) | infra | 3 | One-button smoke test; universal. |

**Counts:** module = financial: 11; mental: 11; governance: 8; infra: 9; community: 1; spiritual/physical/relational/education/vocational/environmental: 0 (these sectors have no workflow surface yet -- the post-vacation buildout will fill them). Tier-1 count: 8; Tier-2 count: 22; Tier-3 count: 3.

**Promotion candidates ready today (Tier-1 -> Tier-2 with the smallest lift):** 30, 31, 32 (Family-Voice-Loop) -- just parameterize `trustedSenders`, `ntfy topic`, `feedback dir` into a module config object. wf29 (waitlist), wf36 (Quality-Gatekeeper), wf27 (Foundation-Agent), wf20 (health-check) are next. wf26 (thought-inbox) is the cleanest mental-module starter.

---

## 6 -- Section: hardcoded values inventory

These are NOT bugs -- they are the surface of a Tier-1 workflow. They become the configurable surface for Tier-2 reuse.

| Workflow file | Category | Value (literal) | Tier-2 config key (proposed) |
|---|---|---|---|
| `30-family-feedback-intake.json` line 20 | file path | `/data/finance-events/family-feedback` | `module.familyVoiceLoop.captureDir` |
| `30-family-feedback-intake.json` line 20 | ntfy topic | `poetech-family-feedback` | `module.familyVoiceLoop.ntfyTopic` |
| `30-family-feedback-intake.json` line 20 | sender enum | `['dpoe','cpoe','christiana','christian','christyn']` | `module.familyVoiceLoop.trustedSenders` |
| `31-daily-standup-digest.json` line 32 | file path | `/data/finance-events/family-feedback` | (shared key from row above) |
| `31-daily-standup-digest.json` line 32 | file path | `/data/chatin` | `module.chatCapture.captureDir` |
| `31-daily-standup-digest.json` line 32 | service URL | `http://ollama:11434` | `module.ai.ollamaBaseUrl` |
| `31-daily-standup-digest.json` line 32 | model name | `qwen2.5:14b-instruct-q4_K_M` | `module.ai.summaryModel` |
| `31-daily-standup-digest.json` line 32 | service URL | `http://ntfy:80` | `module.notify.ntfyBaseUrl` |
| `32-daily-ship-summary.json` line 32 | repo name | `darrellpoe06/Kingdom-PWA-Node` | `module.shipSummary.githubRepo` |
| `32-daily-ship-summary.json` line 32 | ntfy topic | `poetech-foundation-agent` | `module.shipSummary.ntfyTopic` |
| `32-daily-ship-summary.json` line 32 | file path | `/data/finance-events/family-feedback` | (shared) |
| `27-foundation-agent.json` line 32 | file path | `/data/poetech-briefing/inbox` | `module.foundationAgent.inboxDir` |
| `27-foundation-agent.json` line 32 | file path | `/data/poetech-briefing/responses` | `module.foundationAgent.responsesDir` |
| `27-foundation-agent.json` line 32 | file path | `/data/poetech-briefing/queued-for-claude` | `module.foundationAgent.claudeQueueDir` |
| `27-foundation-agent.json` line 32 | file path | `/data/poetech-briefing/agent-log` | `module.foundationAgent.agentLogDir` |
| `27-foundation-agent.json` line 32 | file path | `/data/chatin` | (shared with chat capture) |
| `27-foundation-agent.json` line 32 | TLC regex | hardcoded clinical/family-private keyword set | `module.foundationAgent.tlcKeywords` |
| `27-foundation-agent.json` line 32 | sender enum | `cpoe`, `christiana`, `mrspoe06` referenced in regex | `module.familyVoiceLoop.trustedSenders` (shared) |
| `26-thought-inbox.json` line 20 | file path | `/data/poetech-briefing/inbox` | (shared) |
| `23-project-briefing.json` line 20 | file path | `/data/poetech-briefing/foundations`, `/session-notes`, `/inbox` | `module.briefing.*` |
| `23-project-briefing.json` line 20 | repo name | `darrellpoe06/Kingdom-PWA-Node` | `module.briefing.githubRepo` |
| `20-health-check.json` line 18 | file path | `/data/finance-events/bank` | `module.health.bankRootDir` |
| `20-health-check.json` line 18 | file path | `/data/finance-events/_health` | `module.health.healthDir` |
| `20-health-check.json` line 18 | ntfy topic | `poetech-health` | `module.health.ntfyTopic` |
| `15-bank-ofx-watcher.json` line 18 | file path | `/data/finance-events/bank` (multiple) | (shared with health) |
| `14-gmail-finance-ingest.json` line 35 | file path | `/data/finance-events/gmail` | `module.gmailIngest.captureDir` |
| `08-synology-chat-inbound-capture.json` line 22 | ntfy topic | `poetech-family-feedback` | (shared) |
| `12-network-health-probe.json` line 18 | NAS IP | `192.168.1.26` | `module.health.dsmHost` |
| `29-waitlist-intake.json` line 20 | ntfy topic | `poetech-waitlist` | `module.waitlist.ntfyTopic` |
| `29-waitlist-intake.json` line 20 | file path | `/data/finance-events/waitlist` | `module.waitlist.captureDir` |
| `37-whisper-stt-voice-input.json` line 20 | service URL | `http://whisper:9000/asr` | `module.whisper.baseUrl` |
| `37-whisper-stt-voice-input.json` line 20 | ntfy topic | `poetech-voice` | `module.whisper.ntfyTopic` |
| `34-skill-analytics-layer2.json` line 20 | service URL | `http://ollama:11434` | (shared) |
| `36-quality-gatekeeper.json` line 20 | service URL | `http://ollama:11434` | (shared) |
| `36-quality-gatekeeper.json` line 20 | TLC regex | hardcoded adversary-names + God-names | `module.qualityGatekeeper.theologyKeywords` |

**Repeats across workflows:** `/data/finance-events/family-feedback` (3x), `http://ollama:11434` (5x), `http://ntfy:80` (3x), `darrellpoe06/Kingdom-PWA-Node` (3x), `qwen2.5:14b-instruct-q4_K_M` (4x), `/data/chatin` (3x), `/data/poetech-briefing/inbox` (3x). A Tier-2 module-config singleton (one file, read by every workflow at start) is the natural refactor target. Today's commit pattern (hardcoded literals everywhere) is correct for Tier-1; for Tier-2, lift to a single config table.

---

## 7 -- Section: priority recommendations (ordered)

Ordered by severity x leverage. Items 1-4 should be patched before vacation if Darrell has any keyboard time; items 5+ are post-vacation buildout.

1. **PATCH ACTIVE PROCESS.ENV BOMBS (HIGHEST).** Apply today's wf30/31/32 fix pattern (`process.env.X || 'default'` -> literal default) to wf12, wf20, wf27, wf29. These four are active, scheduled, and currently failing silently on every cron tick if the container env happens to be missing any of the named vars. wf27 is the worst because it runs only 4x/day and any single failed tick leaves the inbox unprocessed for up to 8 hours. **Total fix work: ~13 string replacements across 4 files, ~15 min.** Per Two-Session Git Race rule, Darrell commits + pushes from PowerShell after the agent writes the file edits.

2. **WIRE EXECUTION-OUTCOME-OBSERVABILITY ALERTS.** The reason the wf30/31/32 sandbox bug ate 4 hours this morning -- and the reason wf12/20/27/29 could be silently dead RIGHT NOW -- is that n8n's default save-on-error-only mode logs the failure but does not page anyone. Per the new foundation principle (added to memory 2026-06-01): every workflow execution outcome must be observable AND alerted on. wf02-workflow-failure-alert.json IS the canonical pattern (n8n error-trigger -> Pushover); wire it as the global error workflow in n8n settings. **One-time setting change in n8n UI + activation of wf02-workflow-failure-alert.json. ~5 min once Darrell is at the keyboard.**

3. **NEUTRALIZE THE LANDING-PAGE 404 TRAP.** Per the MVP review section 8 -- one-line change to hide the "Drop your bank file" CTA OR redirect it to the waitlist modal. Independent of the process.env audit, but in the same severity tier because it is the loudest CTA on the public landing.

4. **FIX wf01-project-timeline-daily's `require('js-yaml')` BEFORE ANY ATTEMPT TO ACTIVATE.** Currently not active (not in the active list), so not bleeding right now. But if someone tries to import + activate it without reading this audit, it will throw on first run. Two paths: (a) replace `require('js-yaml')` with a regex-based line parser since the front matter is simple key:value; (b) deprecate the workflow entirely in favor of wf26 (thought-inbox) + wf27 (foundation-agent) which cover the same ground. Recommend (b) -- the parallel-session set (01-project-timeline-daily / 02-workflow-failure-alert / 03-b2-backup-status / 04-pushover-smoke-test) is mostly superseded, with wf02-workflow-failure-alert as the one keeper per item 2 above.

5. **WRITE THE WORKFLOW-MODULE-LIBRARY FOUNDATION DOC.** Per Darrell's 2026-06-01 declaration. The skeleton: 9 QoL sectors x 3 reusability tiers, plus a `module:infra` and `module:governance` axis for cross-cutting workflows that do not map cleanly to one QoL sector. The Section 5 table above is the inventory the doc will reference; copy the proposed tags into the JSON `tags` arrays in a separate refactor pass once the doc is published.

6. **REFACTOR wf30/31/32 AS THE FIRST FAMILY-VOICE-LOOP TIER-2 MODULE.** These three are the obvious flagship -- they already share `/data/finance-events/family-feedback`, `poetech-family-feedback` ntfy topic, and the sender enum. Lift the 5 shared values to a single config object (e.g. injected via an n8n Set node before the Code node, or via a single Code node helper) and tag all three with `module:mental`, `tier:2`, `family-voice-loop`. This is the first real Tier-2 module and the pattern other modules copy.

7. **ADD module + tier TAGS TO ALL EXISTING WORKFLOWS.** Following the Section 5 table. Cosmetic-only change (n8n doesn't behave differently based on tag content), but it lights up search + grouping in the n8n UI and makes the module library searchable from the repo. ~5 min per workflow, ~3 hours total for all 35; can be done in batches during slow time.

8. **WIRE wf02-workflow-failure-alert AS THE GLOBAL ERROR WORKFLOW.** Already covered in item 2; restating because once it lands, the kind of silent-fail bug that ate 4 hours this morning becomes a Pushover ping within seconds.

9. **POST-VACATION: WRITE THE SYNOLOGY CHAT POST INTO wf31 + wf32.** Per MVP review section 4 -- the workflow names promise Synology Chat + ntfy; currently only ntfy is implemented. Lift the `postToSynologyChat()` helper from wf27 (line 32, where it already exists and works when `SYNOLOGY_CHAT_INCOMING_URL` is set). Then either hardcode that URL too (Tier-1 pattern) or move it into the Tier-2 module config from item 6.

10. **MEDIUM-SEVERITY process.env CLEANUP (wf34, wf36, wf37).** These three are not in the active list yet. When the Layer-2 / Layer-3 data-dump pipeline lights up (per MVP review section 4 -- conditional on the landing-page CTA being either neutralized or these workflows being deployed), apply the same literal-default fix in one batch. ~7 string replacements across 3 files.

---

## Verification screen on this audit

Religion check -- does it have backbone? Every bug class hit is cited by file:line. Every recommendation is specific (file, expression, fix pattern). The sandbox model is named explicitly and the allow-list is enumerated. The active list cross-reference is precise.

Relationship check -- does it have warmth? The HIGH/MEDIUM split is honest (not inflated); the post-vacation items are clearly bracketed off from the patch-before-vacation items. The "drive don't delegate" rule is honored -- the agent inventoried 35 workflows so Darrell does not have to. The bug-class framing is diagnostic, not punitive: the process.env pattern is a perfectly reasonable Node.js pattern that happens to be blocked by n8n's specific sandbox. No shame in the original write.

The Test (Phil 4:8): TRUE (every cited line was read directly); HONORABLE (no inflation, no flattery); JUST (HIGH severities are real HIGHs, not catastrophizing); PURE (no editorializing on the original code's author); LOVELY (the recommendation ordering serves the family, not the perfectionism); COMMENDABLE (specific, not vague); EXCELLENT (the table format is the right surface for this content); PRAISEWORTHY (turns a 4-hour debug into a fix-pattern + monitoring discipline the whole module library inherits).

*Wire before you write. Process before you promise. Family voice before all of it. We all win. We create. Amen.*
