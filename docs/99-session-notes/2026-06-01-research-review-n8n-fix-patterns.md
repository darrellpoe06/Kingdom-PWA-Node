# Research Review -- n8n Fix Patterns (Three Open Decisions)

**Date:** 2026-06-01 (Monday evening, vacation pivot)
**Author:** Claude, acting under the "research-first" binding principle (Darrell, 2026-06-01 evening) and the INSTITUTIONAL-MEMORY-EVENTS foundation.
**Scope:** three open decisions surfaced by today's wf30/31/32 silent-failure debug; quick-fix already shipped in commit `1edb8e1`; four more active workflows (wf12, wf20, wf27, wf29) carry the same bug class but should NOT be patched until the right pattern is chosen.
**Posture:** religion AND relationship. Cite every claim. Pick the smallest viable validation step before rolling out broadly.

---

## How to read this report

For each of the three decisions:

1. The question, restated tightly.
2. Options surveyed (a / b / c / ...): mechanism + sources.
3. Trade-off table -- works-in-2.21.7 / configurability / future-proof / observability / Tier-2 alignment / operational complexity / risk-if-wrong.
4. Recommendation with rationale.
5. Smallest viable validation step before broad rollout.

At the end: a cross-cutting observation tying the three decisions together.

---

## Decision 1 -- How should Code nodes read configurable values in n8n 2.21.7?

### The question

Today's quick fix (hardcode the defaults in every Code node) defeats the Tier-2 reusability goal from WORKFLOW-MODULE-LIBRARY.md -- a workflow that hardcodes `'http://ollama:11434'` cannot be shipped to a second family or to COLG without source-edits. n8n 2.x's Code-node sandbox refuses `process.env.X` by default. We need a config-read pattern that (a) actually runs in the 2.21.7 sandbox, (b) survives n8n upgrades, (c) keeps Tier-2 workflows configurable per family without source-edits, and (d) does not require an Enterprise license.

### Options surveyed

**(a) `$env['VAR_NAME']` from inside the Code node JavaScript body.**
Mechanism: n8n's expression-engine exposes a global `$env` object to Code nodes when `N8N_BLOCK_ENV_ACCESS_IN_NODE` is set to `false`. The expression `{{ $env.OLLAMA_HOST }}` works from parameter fields; inside `jsCode`, the same `$env.OLLAMA_HOST` is available as a JS reference.
Sources:
- n8n docs, Nodes environment variables: <https://docs.n8n.io/hosting/configuration/environment-variables/nodes/>
- n8n docs, Environment variables overview: <https://docs.n8n.io/hosting/configuration/environment-variables/>
- Community thread confirming the unblock pattern: <https://community.n8n.io/t/environment-variables-not-accessible-in-self-hosted-setup-env-returns-empty-object/172498>
- n8n 2.0 breaking changes (env access blocked by default in 2.x): <https://docs.n8n.io/2-0-breaking-changes/>
- Known GitHub issue where the unblock does not always take effect: <https://github.com/n8n-io/n8n/issues/29603>

**(b) `$vars.VAR_NAME` (n8n Custom Variables).**
Mechanism: instance-wide read-only variables, defined via the n8n UI, accessible to expressions and Code nodes via the `$vars` global.
Sources:
- n8n docs, Custom variables: <https://docs.n8n.io/code/variables/>
- n8n docs, vars cookbook: <https://docs.n8n.io/code/cookbook/builtin/vars/>
- n8n Community edition features (paid-tier gate): <https://docs.n8n.io/hosting/community-edition-features/>
**Hard blocker:** Custom Variables are NOT available in the free Community Edition. They require a paid Business or Enterprise license (the free-registration unlock does not include them).

**(c) Upstream "Config" node feeding a Code node via `$('Config').first().json.X`.**
Mechanism: drop a `Set` (or `Edit Fields`) node before the Code node, populate it with literal config values (paths, URLs, topics, model names), then read them inside the Code node via the standard `$('Config').first().json.X` expression.
Sources:
- n8n docs, Built-in methods and variables: <https://docs.n8n.io/code/builtin/overview/>
- DeepWiki on the Code node and built-in methods: <https://deepwiki.com/n8n-io/n8n-docs/3.4-code-node-and-built-in-methods>
- n8n docs on accessing linked items in the Code node: <https://docs.n8n.io/data/data-mapping/itemmatching/>

**(d) Hardcode literal defaults (today's quick-fix pattern).**
Mechanism: drop the `process.env.X || 'default'` guard, keep the default string only. Same shape as commit `1edb8e1`.
Source: today's repo commit `1edb8e1`. No external doc -- it is the trivially-safe baseline.

**(e) Read a JSON config file at a known bind-mounted path via `fs.readFileSync('/data/config/family.json')`.**
Mechanism: the `fs` module IS on n8n's `NODE_FUNCTION_ALLOW_BUILTIN` allow-list (per today's workflow audit Section 3, verified across 35 JSONs). A Code node can `require('fs')` and read a JSON file from a bind-mounted host path; the JSON holds the per-family config table.
Sources:
- n8n Code node built-in modules (fs is allow-listed): <https://docs.n8n.io/code/builtin/overview/>
- 2026-06-01 workflow audit, Section 3 (allow-list enumerated and verified): `docs/99-session-notes/2026-06-01-workflow-audit-bug-class-and-tagging.md`
- n8n Docker volume + bind-mount guidance: <https://docs.n8n.io/hosting/installation/server-setups/docker-compose/>
- Marius hosting guide for n8n on Synology (bind-mount pattern proven): <https://mariushosting.com/how-to-install-n8n-on-your-synology-nas/>

**(f) `$getWorkflowStaticData('global')` as a per-workflow config store.**
Mechanism: writable global key/value store, persisted across executions (only for production runs triggered by Webhook or Schedule, not manual). Initialised by the workflow itself.
Sources:
- n8n docs, getWorkflowStaticData: <https://docs.n8n.io/code/cookbook/builtin/get-workflow-static-data/>
- Community on global vs node-scoped static data: <https://community.n8n.io/t/difference-between-getworkflowstaticdata-type-global-and-node/25619>
**Not suited to this problem:** static data is for state accumulated by the workflow (counters, cursors, lists), not for config injected from outside. It is also opaque to ops (no flat-file to read on the host).

### Trade-off table -- Decision 1

| Option | Works in 2.21.7 sandbox | Configurability per family | Future-proof | Observability of config | Tier-2 alignment | Op complexity | Risk if wrong |
|---|---|---|---|---|---|---|---|
| (a) `$env.X` after `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` | YES (with unblock) | High -- 1 env var per setting | Medium -- 2.x default is blocked; future versions may tighten further; GitHub issue #29603 shows the unblock has historically had bugs | Low -- env is hidden inside the container | High -- env varies per deployment | Medium -- requires editing docker-compose + container restart | Medium -- if unblock regresses, every Tier-2 workflow breaks at once |
| (b) `$vars.X` (Custom Variables) | YES (when licensed) | High -- defined per project | High | High -- visible in n8n UI | Highest -- the feature was designed for this | High -- requires paid license | High -- license cost is a recurring spend and Community-edition is the binding posture |
| (c) Upstream Config node | YES (built-in expression API) | Medium -- config is per-workflow, but lifts cleanly to (e) later | High -- pure n8n built-ins, no env or license dependency | High -- the Config node IS the visible source in the editor | High -- the Config node IS the Tier-2 boundary | Low -- one Set node per workflow, no infra change | Low -- if it breaks, only that workflow breaks, and the broken value is visible in the node UI |
| (d) Hardcoded literal | YES | None | High (no API surface) | Medium -- the value is in the JSON commit history | Low -- defeats Tier-2 | Lowest | Zero (already shipped for wf30/31/32) |
| (e) `fs.readFileSync('/data/config/family.json')` | YES (`fs` is allow-listed; verified in audit Section 3) | Highest -- one JSON file controls the whole instance | High -- `fs` is core Node and has never been removed from the allow-list | Highest -- ops can `cat` the file from the host | Highest -- one shared module-config table, families differ by swapping the JSON | Medium -- requires the file to exist on bind-mount before first run; needs an error-guard for missing file | Medium -- a corrupt or missing JSON takes down every workflow at once (single point of failure) |
| (f) `$getWorkflowStaticData('global')` | YES | Low -- writes happen inside the workflow itself | High | Low -- opaque blob | Low -- not the intended use | Low | Medium -- accidentally treating it as config when it is really state has confused other shops (community thread) |

### Recommendation -- Decision 1

**Primary: option (c) -- "Config" Set node upstream of the Code node. Promote to option (e) -- shared `/data/config/family.json` -- once two Tier-2 modules are live and want to share the same config table.**

Rationale:

Option (c) is the smallest change that uses ONLY built-in n8n APIs that have been stable since 1.x and that work in the Community Edition with zero infra change. The Set node IS the visible config surface in the workflow editor; future stewards (Christina, Christiana, or a COLG operator) open the workflow and see the config table at the top, no env hunting, no JSON-file hunting. It satisfies the "every visible surface is one end of a connection" foundation -- the Set node IS that surface for config. And it does not bet on `$env` unblock semantics that have a live GitHub bug (#29603) and that are explicitly NOT a Community-Edition-stable contract.

Promoting to (e) later is a single refactor: the Set node's properties become a `fs.readFileSync('/data/config/family.json')` call inside the same upstream node. Same shape, same downstream Code-node read pattern. The migration is one Code node per workflow, zero downstream changes. The reason to defer (e) until two modules are live: a single config JSON for a single workflow is overhead without payoff. Once two workflows share five values (wf30/31/32 already share three per the audit's Section 6 "Repeats across workflows" row), the JSON pays for itself.

Option (a) `$env` is the "obvious" Node.js answer and it works after the unblock, but: (1) the unblock is a security regression away from n8n's 2.x default; (2) GitHub issue #29603 documents the unblock failing in real installs; (3) `$env` values are invisible to anyone reading the workflow in the n8n UI -- the failure mode is "wait, what is this expression resolving to?" and the answer is in docker-compose; (4) per-family configurability via env vars means editing the container -- the SAME problem n8n's Tier-2 customers (and your COLG operator) want to avoid.

Option (b) `$vars` is the feature n8n DESIGNED for this. We do not get to use it without paying. The "open-source + portable stack" binding (`project_skos_open_source_stack.md`) and the "Community-First Mission" foundation are senior to the convenience here.

Option (d) hardcode is what shipped today. It is fine for Tier-1 (current state of every workflow per audit Section 5). It does not extend to Tier-2.

### Smallest viable validation step -- Decision 1

**Refactor wf30 ONLY (the smallest of today's three patched workflows) to read its 3 shared config values from an upstream `Config` Set node.** Concretely:

1. Add a Set node named `Config` at the top of wf30, set fields: `captureDir = "/data/finance-events/family-feedback"`, `ntfyTopic = "poetech-family-feedback"`, `trustedSenders = ["dpoe","cpoe","christiana","christian","christyn"]`.
2. Update the Code node `jsCode` to read `const cfg = $('Config').first().json;` and use `cfg.captureDir` etc.
3. Activate and fire the webhook once.
4. Verify the captured file lands at the same path as before.
5. If green, the same refactor goes to wf31 + wf32 in the same batch, then they are tagged `module:familyVoiceLoop, tier:2` per the audit recommendation 6.

If the validation succeeds, the four remaining bug-class workflows (wf12, wf20, wf27, wf29) skip the hardcode-defaults step entirely and go straight to the Config-node pattern. That avoids a two-step migration -- hardcode-now, refactor-later -- across four more files.

---

## Decision 2 -- What is the best observability pattern for EXECUTION-OUTCOME-OBSERVABILITY?

### The question

Today's wf30/31/32 silent-failure ate four hours of debugging because n8n stored the error in its executions DB but did not alert anyone. EXECUTION-OUTCOME-OBSERVABILITY says every workflow execution outcome must be observable AND alerted on, not just stored. What is the right pattern, and is `02-workflow-failure-alert.json` (already in the repo) the right shape for the alert?

### Options surveyed

**(a) Set a global "error workflow" in n8n settings + an n8n Error Trigger node workflow that routes to ntfy/Pushover.**
Mechanism: n8n's settings allow a per-workflow "Error Workflow" pointer. The pointed-to workflow starts with an Error Trigger node and receives the failed-workflow's metadata + error payload as input. The same error workflow can serve every other workflow. Setting the same error workflow on every workflow is a one-line settings change per workflow.
Sources:
- n8n docs, Error handling: <https://docs.n8n.io/flow-logic/error-handling/>
- n8n docs, Error Trigger node: <https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.errortrigger/>
- n8n blog, Creating error workflows: <https://blog.n8n.io/creating-error-workflows-in-n8n/>
- n8n docs, course chapter on errors: <https://docs.n8n.io/courses/level-two/chapter-4/>
- Community pattern walk-through ("never let your automations silently fail"): <https://community.n8n.io/t/never-let-your-automations-silently-fail-the-error-handling-pattern-i-use-for-every-deployed-workflow/292351>

**(b) Per-workflow Catch / On-Error branch inside every workflow.**
Mechanism: every Code node configured with `continueOnFail`, an IF node downstream catches the error item, the branch posts to ntfy + writes to an events log.
Sources:
- n8n docs, Error handling (continueOnFail section): <https://docs.n8n.io/flow-logic/error-handling/>
- n8n production reliability framework discussion: <https://qawerk.com/blog/n8n-workflow-testing/>

**(c) Watcher cron workflow that queries the n8n executions DB.**
Mechanism: a separate scheduled workflow polls `/rest/executions` (n8n's internal REST) or the underlying SQLite directly on `/home/node/.n8n/database.sqlite`, looking for unhealthy patterns (zero executions in the last N minutes for an active cron, or any execution with `status="error"`). Alerts via ntfy.
Sources:
- n8n production monitoring article: <https://www.wednesday.is/writing-articles/n8n-monitoring-and-alerting-setup-for-production-environments>
- NG.ai n8n error handling 2026 guide ("three-layer" architecture): <https://nextgrowth.ai/n8n-workflow-error-alerts-guide/>

**(d) External monitoring -- Synology log monitor, Prometheus + Grafana, OpenTelemetry exporter, Sentry, PagerDuty.**
Mechanism: ship n8n container logs (or its Prometheus endpoint) to a separate observability stack. Alert via that stack's rules engine.
Sources:
- n8n monitoring + alerting article: <https://www.wednesday.is/writing-articles/n8n-monitoring-and-alerting-setup-for-production-environments>
- NG.ai 2026 guide (mentions Prometheus + Grafana + PagerDuty for fleets > 50 workflows): <https://nextgrowth.ai/n8n-workflow-error-alerts-guide/>

**(e) Hybrid -- (a) for fast-path "did this execution fail?" alerting, (c) for slow-path "is this cron still firing at all?" detection, optionally (d) layered when the fleet outgrows the watcher.**

### Trade-off table -- Decision 2

| Option | Works in 2.21.7 | Catches silent failures | Catches cron-stopped-firing | Op complexity | Tier-2 alignment | Risk if wrong |
|---|---|---|---|---|---|---|
| (a) Global Error Trigger workflow | YES (n8n core feature) | YES (every failed execution -> Error Trigger -> alert) | NO (no execution means no trigger means no alert) | Low -- one workflow + a settings flip per workflow | High -- the error workflow itself is a Tier-3 universal module | Low -- the only failure mode is "the alert workflow itself fails" which is auditable in the executions list |
| (b) Per-workflow Catch branches | YES | YES (per Code node) | NO | Medium -- a branch per workflow, hand-written | Low -- duplicates effort across workflows; bad shape for a module library | Medium -- easy to forget to wire on a new workflow |
| (c) Watcher cron | YES | Partial (depends on DB / API access) | YES (the watcher fires on schedule regardless of other workflows' health) | Medium -- a new workflow that needs DB/API creds | High -- the watcher itself is reusable | Medium -- watcher silently failing is the same class of bug it is supposed to catch |
| (d) External monitoring | YES (n8n exposes Prometheus + log streaming) | YES (Prometheus rules) | YES (Prometheus rules on `n8n_executions_total`) | High -- new stack to operate | Low/Medium -- payoff scales with fleet size; overkill for ~35 workflows | High -- another long-running service to maintain |
| (e) (a) + (c) hybrid | YES | YES (both layers) | YES (the watcher) | Medium | Highest -- both layers are reusable Tier-3 modules | Lowest -- the two layers cover each other's blind spots |

### Recommendation -- Decision 2

**Primary: option (e) hybrid: (a) global Error Trigger workflow now, (c) watcher cron added second.**

Rationale:

The four-hour debug today proved that n8n's executions-list-only default is insufficient. Option (a) closes the loudest gap with the smallest change: activate `02-workflow-failure-alert.json` (already drafted, already in the repo, already follows the documented n8n Error Trigger -> notify pattern), then go into each active workflow's Settings panel and set "Error Workflow" to it. Per the n8n docs and the community thread, this is the canonical pattern; every active workflow gets covered with one settings change per workflow and zero per-workflow code edits.

But option (a) ALONE has a blind spot: it only fires when an execution starts and fails. If a cron workflow stops being scheduled at all (n8n process dies, container restart loses the schedule, deactivated by accident, schedule timezone mis-set), no execution starts, no error fires, the workflow is silent again. Option (c) -- a watcher cron -- closes that gap by alerting on "expected execution X did not occur in the last N minutes" or "executions list shows no run since Y." That is the same class of silent-fail that ate today's four hours, just shifted up one level (from "Code node threw" to "no Code node ran"). The watcher is also reusable as a Tier-3 module per WORKFLOW-MODULE-LIBRARY (`module:infra, tier:3`).

Option (b) per-workflow Catch branches duplicate effort across every workflow and create a maintenance tax that pushes against the module library posture. Skip.

Option (d) external monitoring (Prometheus + Grafana) is the right answer for a fleet > 50 workflows per the NG.ai 2026 guide; PoeTech is at 35 with most Tier-2 still ahead. Revisit when the fleet doubles.

The existing `02-workflow-failure-alert.json` is the right shape (Error Trigger -> Code node formatter -> HTTP POST notification) but currently posts to Pushover. Given the existing PoeTech standard is ntfy for the family-facing alerts and Pushover for the Darrell-personal critical alerts (per wf01, wf03 patterns), recommend keeping it on Pushover at priority 1 -- the audience for "an n8n workflow died" is Darrell, not the family. The two Pushover placeholder strings (`PASTE_PUSHOVER_APP_TOKEN_HERE` and `PASTE_PUSHOVER_USER_KEY_HERE`) need to be replaced with the real values before activation. Per Decision 1's recommendation, those go in an upstream Config Set node, not as literals in the HttpRequest node, so the same workflow ships unchanged to COLG (they swap the Config and they get their own alerts).

### Smallest viable validation step -- Decision 2

1. Replace the two `PASTE_..._HERE` placeholders in `02-workflow-failure-alert.json` with values read from an upstream `Config` Set node (matches Decision 1's pattern).
2. Activate `02-workflow-failure-alert.json`.
3. In the n8n UI, set "Error Workflow" = "02 - Workflow Failure Alert" on ONE workflow (recommend wf30, since we just refactored it for Decision 1 validation).
4. Deliberately break wf30 once (e.g. temporarily set the trustedSenders field to an invalid type) and fire the webhook.
5. Confirm Pushover ping arrives on Darrell's phone within seconds.
6. If green, do the settings flip on the other 17 active workflows in one pass.

The watcher-cron (option (c)) is the second wave -- write it as `wf42-execution-watcher.json` after the global error workflow is live, schedule it every 10 min, alert on "active workflow X has had no execution in 2x its expected cadence." That is its own audit + design pass, not blocking on this report.

---

## Decision 3 -- What is the cleanest fix for the wf27 Foundation Agent bind-mount issue?

### The question

wf27 writes its queued-for-Claude artifacts to `/data/poetech-briefing/foundations/` (and three sibling paths under `/data/poetech-briefing/`). Per the 2026-06-01 daily-app-review session note, that path is inside ephemeral container storage, NOT bind-mounted to the host. Container restart -> artifacts lost. The n8n DB at `/home/node/.n8n/database.sqlite` IS bind-mounted (per Marius's standard Synology install pattern). What is the cleanest fix?

### Options surveyed

**(a) Add a NEW bind mount `/volume1/PoeTech/poetech-briefing/` -> `/data/poetech-briefing/`.**
Mechanism: edit the n8n container's volumes in Container Manager (Project compose.yaml preferred, or Container settings UI), add the new bind mount, restart the container. The existing `/home/node/.n8n` bind mount is untouched -- DB preserved.
Sources:
- n8n Docker compose docs: <https://docs.n8n.io/hosting/installation/server-setups/docker-compose/>
- Synology Container Manager docs: <https://kb.synology.com/en-global/DSM/help/ContainerManager/docker_container?version=7>
- SynoForum thread on moving from volume to bind mount safely: <https://www.synoforum.com/threads/move-from-docker-volume-to-bind-mount.12990/>
- Marius hosting (Synology n8n install, bind-mount pattern): <https://mariushosting.com/how-to-install-n8n-on-your-synology-nas/>
- SynoForum thread on Container Manager compose.yaml migration: <https://www.synoforum.com/threads/container-manager-migrating-redoing-containers-with-compose.15218/>

**(b) Move wf27's write target to an already-bind-mounted path (e.g. `/data/finance-events/poetech-briefing/`) and update the workflow JSON.**
Mechanism: no infra change; wf27 (and any other workflow writing under `/data/poetech-briefing/`) gets its path constant edited. Already-bind-mounted root `/volume1/PoeTech/finance-events/` (host) -> `/data/finance-events/` (container) per the env description.
Source: today's audit Section 6 confirms `/data/finance-events/` is already the working bind-mount root; current wf workflows already write there (wf15, wf18, wf20, wf30).

**(c) Synology Drive-synced folder.**
Mechanism: bind-mount a path that is also a Synology Drive sync target, so the artifacts are durable AND visible to LAN clients via Drive.
Sources:
- Synology Container Manager docs: <https://kb.synology.com/en-global/DSM/help/ContainerManager/docker_container?version=7>
- Synology Drive overview: <https://www.synology.com/en-global/dsm/feature/drive>

### Trade-off table -- Decision 3

| Option | Survives container restart | Op complexity | Risk to n8n DB | Tier-2 alignment | Side benefits | Risk if wrong |
|---|---|---|---|---|---|---|
| (a) New bind mount `/volume1/PoeTech/poetech-briefing/` -> `/data/poetech-briefing/` | YES | Medium -- one Container Manager edit + restart; need to confirm the new host folder exists with the right UID/GID first | Low -- existing `/home/node/.n8n` mount untouched; if Project compose.yaml is used, edits are atomic | High -- the mount is its own namespace and is portable to other deployments | The directory is independently inspectable from DSM file station, independently backed up via Hyper Backup if configured | Low -- worst case the container fails to start, easy revert |
| (b) Move write target to `/data/finance-events/poetech-briefing/` | YES (existing mount works) | Lowest -- workflow JSON edit only; no infra change | Zero -- no container touched | Medium -- conflates two distinct concerns (financial events vs Foundation Agent artifacts) under one mount root | None | Low -- the namespace conflation is mostly cosmetic, but it makes future per-module backup rules messier (e.g. Foundation Agent inbox shouldn't be in a "finance-events" snapshot) |
| (c) Synology Drive-synced folder | YES | High -- Container Manager edit + Drive sync setup + permission tuning | Low (separate from DB mount) | High | Artifacts visible on phone, laptop, family iPad through Drive | Medium -- Drive sync churn can confuse n8n if the agent is mid-write when Drive scans |

### Recommendation -- Decision 3

**Primary: option (a) -- add `/volume1/PoeTech/poetech-briefing/` -> `/data/poetech-briefing/` bind mount.**

Rationale:

Option (b) is the lowest-effort fix and it works. But it bakes a namespace mistake into the JSON: Foundation Agent artifacts are NOT finance events, and pretending they are makes the future per-module backup / archive / retention policy harder. The whole module-library posture says modules have their own namespaces; the bind mount should follow the module. The cost of (a) over (b) is one Container Manager edit + one container restart -- ~10 min of supervised work -- in exchange for a clean module namespace that ships unchanged with the Foundation-Agent Tier-2 module.

The bind-mount edit is safe per the Synology Knowledge Center docs and the SynoForum migration thread: as long as the `/home/node/.n8n` volume mapping is preserved verbatim in the new compose.yaml (or unchanged in the Container Settings UI), the n8n SQLite DB survives the recreate. The pre-flight is: (1) confirm `/volume1/PoeTech/poetech-briefing/` exists on the host with the same UID:GID the n8n container uses (typically `1000:1000` for Marius's pattern or the `node` user inside the n8n image), (2) `mkdir -p` the four subfolders (`inbox`, `responses`, `queued-for-claude`, `agent-log`, `foundations`) BEFORE the restart so the mount is not empty on first read.

Option (c) Synology Drive is a nice-to-have that can be layered later. It is not needed for the wf27 fix and it adds operational complexity (Drive sync timing vs n8n write timing) that is not worth taking on today.

There is a subtle interaction with Decision 1: if all four file paths (`inbox`, `responses`, `queued-for-claude`, `agent-log`) move into a Config Set node per Decision 1's recommendation, then the bind-mount path becomes a single config value (`module.foundationAgent.briefingRoot = '/data/poetech-briefing'`). A second family deploying the Foundation Agent module changes the Config value once, mounts their own `/volume1/<theirOrg>/poetech-briefing/` to the same container path, and they are done. Decisions 1 and 3 align cleanly.

### Smallest viable validation step -- Decision 3

1. From PowerShell (per the self-contained-commands rule, prefixed with `cd C:\Users\dpoe\Kingdom-PWA-Node`), SSH to the NAS and `mkdir -p /volume1/PoeTech/poetech-briefing/{inbox,responses,queued-for-claude,agent-log,foundations}` with the right ownership (`chown` to match the n8n container UID, typically `1000:1000`).
2. In Container Manager, open the n8n container, Settings -> Volume, add the bind mount `/volume1/PoeTech/poetech-briefing/` -> `/data/poetech-briefing/`. (If the install is Project-based, edit `compose.yaml` and `docker compose up -d --force-recreate`.)
3. Restart the n8n container.
4. From inside the container, `ls /data/poetech-briefing/` should show the five subfolders -- if yes, the mount took.
5. From the n8n UI, verify the n8n version + workflow list are intact (proves the DB mount survived).
6. Fire wf27 once via its `agent-fire` webhook with a test inbox item.
7. Confirm the resulting artifact appears at `/volume1/PoeTech/poetech-briefing/queued-for-claude/<filename>` on the host (visible in DSM File Station). If yes, the bind mount is durable across restarts.

---

## Cross-cutting observation

**The three decisions interlock. Decision 1's Config Set node IS the surface where Decision 3's bind-mount path AND Decision 2's Pushover credentials live.** All three answers should ship together as one pattern, not three separate patches.

Concretely: the wf30 validation step for Decision 1 establishes the Config-node pattern. The wf02-workflow-failure-alert change for Decision 2 uses the same pattern for its Pushover token + user key. The wf27 fix for Decision 3 uses the same pattern to lift the four `/data/poetech-briefing/...` paths into the Config node, where the bind-mount path becomes a single config value. One pattern, three workflows touched as the proof, then the four remaining bug-class workflows (wf12, wf20, wf27, wf29) inherit the pattern in one batch.

This satisfies the BUSINESS-PROCESS-CONNECTIONS foundation: every visible surface is one end of a connection, the other end must be wired. The Config Set node is the visible end; the wired-other-end is (1) the Code node downstream, (2) the bind-mounted host path, (3) the global error workflow notification. Same shape across all three decisions.

This also satisfies the EXECUTION-OUTCOME-OBSERVABILITY foundation in a deeper way than "add an alert": if Decision 2's global error workflow is the THIRD thing wired (after Decision 1 establishes Config-node and Decision 3 fixes the bind-mount that wf27 needs), then by the time the four bug-class workflows are touched, EVERY failure they raise will alert Darrell within seconds. The four-hour debug today becomes structurally impossible going forward.

Finally, this satisfies the WORKFLOW-MODULE-LIBRARY foundation's Tier-2 goal: the Config-node-plus-bind-mount-plus-error-workflow trio IS the Tier-2 deployment contract. A second family or COLG deploys a module by (a) creating their own bind-mount paths on their own host, (b) swapping the Config Set node values, (c) optionally pointing the global error workflow at their own notification channel. No source-edits, no env-hunting, no license dependency.

---

## Open questions surfaced by this review (not blocking the recommendations)

1. **Whether the `02-workflow-failure-alert.json` workflow itself should have an Error Workflow set on IT.** n8n's docs are silent on the recursion question. Recommendation: leave it unset; if the alert workflow itself dies, the n8n process logs will surface it on next manual check, and the watcher cron from Decision 2's wave 2 will catch it on a schedule.
2. **Whether to capture the wf02 + watcher + Config-node trio in a foundation doc** (e.g. `docs/00-foundations/_root/WORKFLOW-OBSERVABILITY-PATTERN.md`) so future modules inherit the discipline. Recommendation: yes, post-vacation; this report can be the source material.
3. **Whether the Pushover credentials should be in Synology Secrets Manager / a secrets backend** rather than the Config Set node. n8n's External Secrets feature is Enterprise-only. The pragmatic free-tier answer is: Config-node for non-secret config, n8n's built-in Credentials store (which IS Community-Edition) for secrets like Pushover tokens. Wire the HttpRequest node to a Credential, not a Config Set node, for the actual token. (Adjust Decision 2's validation step accordingly: Pushover token goes in n8n Credentials, "which credential to use" stays as a Set-node parameter if anything.)

---

## Verification screen on this report

**Religion check** -- does it have backbone? Every option is sourced. The trade-off tables are honest about each pattern's blind spot. The recommendations are not "ship everything"; they name the smallest validation step. The community-edition vs paid-tier facts are not hidden.

**Relationship check** -- does it have warmth? The report is diagnostic, not punitive about today's quick-fix; the cross-cutting observation explicitly says the three decisions ship together so Darrell does not pay a per-decision context-switch tax. The smallest-viable-validation steps are sized for ~30 min each, not a weekend's work.

**Phil 4:8 Test:**
- TRUE: every URL was fetched or searched; every cited n8n behavior is from the n8n docs or community confirmation.
- HONORABLE: no inflation of the urgency, no flattery, no hidden caveats.
- JUST: the Custom Variables ($vars) option is named as the design-intent answer AND ruled out for license reasons; no pretending the gap does not exist.
- PURE: no editorializing on n8n's choice to block `process.env` by default; the security reasoning is acknowledged on its own terms.
- LOVELY: the recommendation ordering serves the family and the future steward, not the elegance of the architecture for its own sake.
- COMMENDABLE: each recommendation has a concrete validation step Darrell can execute.
- EXCELLENT: the three decisions are tied together so the work compounds.
- PRAISEWORTHY: this report becomes institutional memory per INSTITUTIONAL-MEMORY-EVENTS; the next time a similar decision shape comes up, this is the precedent.

*Wire before you write. Research before you patch. Pattern before you scale. We all win. We create. Amen.*
