# The system, inside and out — 2026-10-19

Darrell, 2026-10-19: "Comprehensive understanding of the system...", "What is outside of the 10 dimensions... give me the full understanding of the system", "Inside and out...", then: "Comprehensive meaning whatever we have currently... what changed and when exactly like logs... and also the ability to reverse any undermining processes because every system is interdependent... and our overall system goals so the vision is clear and we alignment is very effective and deliberate and intuitive", and: "Standard code and sequences and jobs and workflows and critical paths wrapped with a systemic incentive structure and foundation placeholders for allowing flexibility in the development process for all necessary factors."

So this ledger has eleven parts: goals (§0), inventory (§1–3), what the review dimensions miss (§4), the live work queue (§5), standards (§6), sequences and critical paths (§7), jobs and workflows (§8), the incentive structure (§9), placeholders (§10), the change log (§11), and reversal with interdependency (§12). The standard that names these parts is `docs/00-foundations/_root/SYSTEM-UNDERSTANDING-STANDARD.md` (DR-1111).

**How this was built.** Three read-only traces of the repository were made, one each for transport, data and delivery, and every claim is cited to `file:line` in those traces. Live readings came from GitHub Actions runs and issue #2057. The four defects marked *verified* below were re-read in the code before anything was changed. Anything not measured is labelled. Repo state: `main` at `fc23337` plus the day's merges.

---

## 0. The goals — what every part exists to serve

These are the repository's own words, each quoted from its source, so alignment is measured against what was written rather than against memory.

**The root.** *"When any product feature is built, the question is: does this help a person walk The Way?"* (`THE-WAY.md:128`). Systems *"exist to make the person more able to follow The Way, not to extract from them"* (`CLAUDE.md`, The Source of Answers).

| Goal | Its own words | How it is measured today |
|---|---|---|
| G1 Quality of life is the senior test | *"does this measurably improve quality of life for the family or community using it?"* (`QUALITY-OF-LIFE-AS-NORTH-STAR.md:7`) | **No measure is built.** The named `qol-impact` feedback tag appears nowhere in `app/src`. |
| G2 Community first, COLG first | *"exists to serve communities the mainstream tech industry has overlooked"* (`COMMUNITY-FIRST-MISSION.md:11`) | WCAG-AA contrast gate (`scripts/contrast-guard.mjs`); install-health on four doors |
| G3 Serve, never extract | *"The platform is a TOOL, not a casino."* (`DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md:47`) | Tenancy guard and RLS matrix (246 instance-scoped tables, all under RLS); `rls-isolation.yml` |
| G4 Sovereign, never locked in | *"We are never locked in"* (`DR-0013:24`) | DR-0013's phases. **None is marked done**, and the GPU tower that Phase 4 needs is not answering today |
| G5 Verifiably right | *"The AI's job is not to sound right — it is to be verifiably right"* (`CLAUDE.md`, Verification Doctrine) | Gates that are proven to catch; verbatim-Scripture gates; the runner witnesses |
| G6 The app is the primary artifact, showing live real data | *"a surface is a live view of — and a control for — real system state"* (`CLAUDE.md`, Reality-Trace) | Reality-trace rule; OpsBoard and SystemFlowProof read live data |
| G7 One engine, clarity at rest | *"One system manages and organizes ALL types of work"* (`ARCHITECTURE-PRINCIPLES-COMPOSABLE-SPINE.md:26`) | `module-boundary-guard`, `monolith-budget-guard` |
| G8 Motion by default, but uptime first | *"Uptime outranks delivery velocity, always."* (`CLAUDE.md`, Streamlined Delivery Loop) | site-health every 10 minutes; the `incident` ledger; deploy proof |

**Where the goals pull against each other, in the docs' own words:**
- **Sovereignty vs. a hosted database.** *"There is no central database of family data anywhere except the family's own infrastructure"* (`DATA-AS-EMPOWERMENT:21`), yet hosted Supabase still holds tables.
- **"Every action reversible"** (`COMMUNITY-FIRST:31`) vs. *"PIN loss = data loss. This is intentional"* (`LEGAL-PRIVACY-BOUNDARY:188`).
- **Three different "senior" tests:**
  - quality of life (`QUALITY-OF-LIFE:67`);
  - the Want-To-Use Bar (DR-0033);
  - the two architecture anchors (`ARCHITECTURE:22`).
- **Stale roadmaps.** `BUILD-ROADMAP.md` (June) still plans n8n timers that DR-0218 retired. DR-0013's dated phases have passed with none marked done. A goal with no live measure (G1) or a passed date (G4) cannot steer alignment.

## 1. What the system is, in one paragraph

PoeTech is a single installable web app (a PWA) that a family and a church use for money, property, documents, church life, learning, cameras, voice and messaging. The app is served from **Cloudflare Pages** at poetech.us. Everything private lives on the family's own **Synology NAS** at home. The NAS is reached through a **Tailscale Funnel**, a public HTTPS door to named paths on the NAS. Between the two sit **Pages Functions**: small same-origin proxies so the browser only ever talks to poetech.us. **GitHub** is the factory and the night watch. Every change arrives as a pull request, passes about 17 gates and a four-shard test suite, merges itself, deploys itself, and is then re-checked from the outside by scheduled witnesses. **The Word** governs the content, by verbatim KJV quotations under machine gates, and **the decision ledger** (1,000+ records) is the memory.

## 2. Inside — the layers

### 2.1 The app (what people touch)
- **One shell, no router.** `app/src/poe-financial-mvp-v28.jsx` (5,193 lines) switches on `view`. The sidebar has six groups: family, Soul, Create, Life, Business and System, with about 40 views in all (`lib/nav-items.jsx:183-188`). `surfaces.js` gates each surface by role, hiding or locking it.
- **Learn.** 45 courses in 12 departments (`learn-catalog.js:73`). This includes History, now three courses with the car course at six lessons.
- **On the device.** IndexedDB holds the main store, the curriculum, voice references and book intake. 93 `*-sync.js` modules push to and pull from the database, scoped to the tenant. Nothing syncs while signed out (`table-sync.js:1-35`).
- **Updates.** The service worker is network-first for pages and cache-first for hashed assets. It checks for an update every 10 minutes and reloads once when the served build moves ahead (`sw.js`, `sw-update.js`).
- **Surfaces that show the system itself:**
  - **OpsBoard** and its Uptime strip, which read GitHub live;
  - **SystemFlowProof**, which shows the flow graph plus live row counts;
  - **AccessUsageMetrics**, **DbHealth**, **LoopHealth** and **GovernanceQueue**;
  - the **Infra Plan's "Try Vane"** panel.

### 2.2 The transport (how the app reaches home)
- **Twenty Pages Functions** proxy to the Funnel through one helper, `app/functions/_lib/funnel-proxy.js`. The roads include:
  - `/sb` (sign-in and data), `/cams`, `/taxes`, `/scribe`, `/voice`, `/voice-lite`, `/nas-photos`;
  - `/ways`, `/reviews`, `/llm`, `/openers` and `/n8n` (legacy).
- **Twelve more Functions talk elsewhere:** Stripe checkout and webhook, push, device-link, geocode, YouTube, market quotes, Replicate voice, APK downloads.
- `_routes.json` lists 25 includes and matches the Functions one for one.
- **Ten Funnel mounts are recorded**, though `/voice` was likely never actually mounted (§5, item 4): `/`→n8n:5678 (legacy), `/sb`→Kong:8800, `/cams`→8773, `/taxes`→8790, `/scribe`→8791, `/voice`→8771, `/voice-lite`→8772, `/nas-photos`→8099, `/mcp`→8795 and `/announce`→8796 (`infra/nas-transport/RECORDED-STATE.md:21-30`). Eleven Function roads have no mount yet, and the record says so (`:52-62`).
- **Sign-in today skips the same-origin road.** Since the 2026-10-09 "temporary unlock", the build points supabase-js straight at the Funnel's `/sb`. `/cams` and `/nas-photos` do the same (`deploy-cloudflare-pages.yml:147,164,176`). The unlock rested on "every Function is dark". That premise was disproven on 2026-10-17 (#2057). The unlock is now a choice, not a necessity, and it is the cross-origin hazard CLAUDE.md warns about.

### 2.3 The home server (what runs on the NAS)
Services deploy themselves: `infra/nas-loops/services.json` is applied every 15 minutes by `services-sync.sh`, so a merge to main is the deploy.

| Service | What it does | Port |
|---|---|---|
| Supabase stack | Kong and GoTrue, sign-in and data | 8800 |
| Tax ingest | the family tax archive | 8790 |
| Cameras forwarder | in front of go2rtc 1.9.14 (33 cameras; 22 online by Wyze's own count on 2026-10-18) | 8773 |
| Voice studio | the XTTS forwarder | 8771 |
| Voice-lite | Piper | 8772 |
| Scribe | | 8791 |
| Property photos | | 8099 |
| MCP | | 8795 |
| Announce | the phone-alarm relay | 8796 |
| Research | Vane and SearxNG behind a forwarder | — |
| n8n and ntfy | legacy, still running; ntfy carries the phone pushes | n8n 5678, ntfy 8081 |

Also:
- **AI towers:** two GPU machines on the tailnet. The left tower is the AI worker; the right one feeds the church stream (DR-0012).
- **Funnel watchdog:** re-heals only `/mcp`, `/nas-photos` and `/taxes`. The other six sovereign mounts are not healed if they drop.

### 2.4 The data
- **Migrations:** 299 files in `infra/supabase/migrations-auto/`, with 284 distinct numbers (12 duplicated, some gaps). The newest is `0300`.
- **Tables:** 316 parsed in all, 246 of them instance-scoped and 306 under row-level security.
- **Tenancy guard:** `scripts/tenancy-guard.mjs` refuses any table with an `instance_id` that lacks RLS, and has five checks in all. `rls-isolation.yml` runs 26 feature smokes against production inside rolled-back transactions.
- **Table families:** finance, church (about 46 tables), legal and documents, property (about 30), cameras and TV sharing, lessons and progress (about 26), and messaging (about 19).

### 2.5 The factory (how change is made safely)
- **Seventy-three workflows**, 23 of them on a live schedule.
- **The merge lane:** auto-open-pr, then auto-merge (squash on green, unless the PR has `hold`), then keep-prs-current, which merges main into open agent PRs every 30 minutes and resolves the ledger.
- **CI:** 15 required legs plus an aggregator. The `guards` leg runs 17 gate commands: lint, lesson dates, and 15 guard scripts covering modules, monoliths, interconnect, citations, transport, RLS matrix, migrations, prompts and more.
- **The deploy:** deploy-cloudflare-pages builds, checks asset sizes, deploys, and then boot-checks four URLs in a real browser. A merge made with `GITHUB_TOKEN` cannot trigger it, so three healers dispatch it: auto-merge's heal-deploy, deploy-freshness every 5 minutes, and site-health.
- **The flow graph:** `system-flow-registry.mjs` holds 183 nodes and 462 connections, with 0 dead ends and 0 orphans. 79 of the 316 tables have a place in the graph and **237 still await one**, which the guard prints but does not yet fail on.

### 2.6 The night watch (who checks that it really works)
- **site-health**, every 10 minutes from a GitHub runner:
  - checks the shell, the served build against main, sign-in, `/automation-status`, `/cams` and the bell;
  - writes to the rolling run log, to the `incident` issue (#2057), to the OpsBoard, and to the phone alarm.
- **camera-health**, **harvest-health**, **ops-queue-health**, **node-availability**, **public-shelf-witness**, **level-witness**, **live-link-probe** and **research-health** cover their own roads.
- **history-voices-witness** checks that every quoted historical voice is on its source page.
- **system-flow-proof** writes live row counts into `system_flow_proof` every 6 hours for the in-app graph.

## 3. Outside — what the system stands on but does not own

| Dependency | What breaks without it | Measured today |
|---|---|---|
| Cloudflare Pages (static site and Functions) | the whole front door | the served build equals main at the last site-health run (2026-10-18 21:05, `fc23337`); Functions run (#2057, 2026-10-17) |
| Tailscale and its Funnel | every road home | `/sb` answers; six mounts are not watchdog-healed |
| GitHub (Actions, API, issues) | merges, deploys, every witness, and the OpsBoard's data | working; the API returned a 502 once today |
| The home internet and power at the NAS | everything private | not measured from here |
| The Synology NAS hardware | everything private | services answer through the Funnel |
| Two GPU towers | Vane, local AI | **no tower answering** (research-health, 04:04 UTC) |
| Wyze (cameras), Kinesis/WebRTC | cameras | 18 of 33 cameras at the latest read (DR-1097 eleventh read, 2026-10-19 07:39 UTC), up from 9 |
| Search engines behind SearxNG | Vane's sources | DuckDuckGo returning a CAPTCHA; Brave rate-limiting us for 180 s (429) |
| Stripe, Replicate, YouTube, Stooq, Census and Nominatim | checkout, cloud voice, church feed, quotes, geocoding | not measured here |
| A hosted Supabase project (the "hosted key") | the documents copy-down (task #3) | waiting on Darrell's ConnectBot step |
| ntfy on the NAS | the phone alarm | see §5, fixed today |
| Phones and browsers (Android TWA, iOS Safari PWA) | how the family actually uses it | install-health covers four doors |
| People | the Governor (Darrell), the family, the church office, members | the `hold` label is the human brake |

## 4. What the ten dimensions do not cover

The ten dimensions (`COMPREHENSIVE-REVIEW-STANDARD.md`) review **a surface and its flow**: what it should do, the journeys, honest copy, layout, delivery context, findings as work, a gate per class, the Word's accuracy, no hollow screens, and continuity. They do not ask about the system *around* the surfaces. Today's trace found real gaps in eight places they leave out:

1. **Are the instruments themselves true?** The ten trust the witnesses. #2057 carried a false "no Pages Function is running" headline for eight days, because site-health judges by content type and a proxy returns somebody else's content type. The bell read "rang" on a 200 that said `delivered: false` (§5).
2. **Recovery.** Six of the nine sovereign Funnel mounts are not healed by the watchdog. The backups and the restore path were not traced here.
3. **The attack surface.** There are ten public Funnel paths. The Function proxy copies every header through. Vane has no login and sits behind the forwarder only. No threat model ties these together.
4. **Time budgets.** The proxy has no fetch timeout, so a hung road holds the user until their browser gives up.
5. **Capacity and cost.** Cloudflare's free daily allowance for Function calls fails *open*, quietly serving the static site. Nothing measures our daily count against it. GPU time, search-engine rate limits and the 33 cameras' sessions are all finite.
6. **External dependencies as a set.** There is no single list of what we lean on with its live state; §3 is the first one.
7. **Configuration drift between repo and box.** The relay's unit could never receive a corrected line (§5). The port collisions noted in code (`review_server.py` default 8790 and `llm_server.py` 8791 both clash with live services) have not been run, but would collide if they were.
8. **Structural debt.** These are counted, but nothing yet makes them fail:
   - 237 tables have no place in the flow graph;
   - the shell is 5,193 lines;
   - there are 12 duplicate migration numbers.

## 5. Live state and the work queue, 2026-10-19

| # | Finding | State |
|---|---|---|
| 1 | The bell counted any 2xx as rung, though the relay returns 200 with `delivered: false` (*verified*) | **DONE**, DR-1110: classifier fixed, proven to catch |
| 2 | The relay posted to `ntfy:80`, a Docker-only name, from the host (*verified*) | **DONE**, DR-1110: host port 8081 |
| 3 | The relay's installer would never rewrite a changed unit (*verified* by simulation) | **DONE**, DR-1110 |
| 4 | `/voice` was never mounted, because `/voice-lite` matched its check (*verified*) | **DONE**, DR-1110 |
| 5 | site-health still writes "NO PAGES FUNCTION IS RUNNING", judged by content type | **CARRIED** by PR #2166 (the road signs its answer). It is under `hold` for L79's content, and splitting it out was refused by permissions; Darrell decides |
| 6 | The relay answers HTTP 400 to real alarms; the cause is unknown | **CARRIED**: the next site-health run after the NAS syncs DR-1110 will read it; if it is still 400, the body is needed |
| 7 | The sign-in "temporary unlock" still points the bundle at the Funnel origin | Open: its premise was disproven on 10-17. Reverting it touches every family browser, so it is its own change with a live read-back (`re-review: 2026-10-20`, per #2057) |
| 8 | Vane: no GPU tower answering; search engines throttled | Blocked on a physical step: power on and wake the left tower |
| 9 | Proxy without a timeout | Open: needs per-road budgets, from 6 s to 180 s, not one number |
| 10 | Watchdog heals 3 of 9 sovereign mounts | Open: next in the queue |
| 11 | Cameras 18 of 33 | **CARRIED** by DR-1097's live reads (another session, eleven reads so far, rising) |
| 12 | Documents copy-down (task #3) | Blocked on Darrell placing the hosted key from ConnectBot |
| 13 | roads Worker token | Blocked on Darrell's Cloudflare token permission edit |
| 14 | **No backup of the sovereign database** | **DONE in code** (DR-1113): nightly verified dump, weekly restore drill, judged by nas-health. **Live proof**: the first night's nas-health line. Storage file bytes still need Hyper Backup (carried, `re-review: 2026-10-21`) |
| 17 | The PoeTech app's header shared the Love Corner (Darrell's screenshot) | **DONE** (DR-1112): each app shares itself by `currentDoor`, never by the tab |
| 15 | No Cloudflare rollback; revert-button branches ignored by the lane | Open: a dispatch-a-past-deployment rollback workflow, and the lane accepting `revert-` branches |
| 16 | No outcome measure for G1 (quality of life) | Open: the incentive gap in §9 |

## 6. Standards — what all code is written to

| Standard | Where it is written | What enforces it |
|---|---|---|
| Typographic and Color Theology; Yahweh in our voice; verbatim KJV | `CLAUDE.md`; `SCRIPTURE-REFERENCE-STANDARD.md` | every-catalog quotation gate, per-course gates, `scripture-inference-guard` (with a must-fail selftest) |
| No claim without evidence; proven to catch | `CLAUDE.md` Verification Doctrine (DR-0076) | the ari-guard stop hook; each gate's selftest |
| Module boundaries and monolith budgets | `ARCHITECTURE-PRINCIPLES-COMPOSABLE-SPINE.md` | `module-boundary-guard`, `monolith-budget-guard` (ci.yml guards) |
| Tenancy: every instance table under RLS | DR-0060 | `tenancy-guard.mjs`, `rls-isolation-matrix-guard`, `rls-isolation.yml` |
| Migrations replay in order and return what they claim | DR-0309, DR-1075 | `migration-replay-order-guard`, `replay-completeness-guard`, `migration-return-type-guard`, `smoke-sql-language-guard` |
| One decision per record; numbers never reused | DR-0011, DR-0644 | `business-systems-guard`, `decision-citation-guard`, `resolve-ledger-conflicts`, `claim-decision-number` |
| No `window.confirm`/`prompt` dialogs | (house rule) | `no-prompt-guard` |
| Same-origin roads, never the absolute Funnel URL | `CLAUDE.md` memory, `project_app_to_nas_transport` | `infra-transport-guard`; **currently overridden** by the 2026-10-09 unlock (§5 item 7) |
| Commits: plain subjects, Darrell as author | `feedback_no_coauthor_trailer` | the stop hook checks the committer |

## 7. Sequences and critical paths — the chains that must hold end to end

Each chain is listed hop by hop, and a chain is only as strong as its weakest hop. "Witness" is what watches it from outside.

1. **Sign-in:**
   - Hops: browser → (today) `poetech.tail5a2f35.ts.net/sb` → Funnel → Kong 127.0.0.1:8800 → GoTrue.
   - Witness: site-health's real POST.
   - Weakest hop: the cross-origin Funnel origin the bundle uses since 10-09, which CLAUDE.md records as throttled under load.
2. **A change reaching the family:**
   - Hops: branch push → auto-open-pr → 15 CI legs (about 17 min, measured) → auto-merge squash → heal-deploy dispatches the deploy → build, asset guard, wrangler → boot-check in a browser → site-health served = main.
   - Weakest hop: merges made by the GitHub token do not trigger the deploy. Ten missed-deploy incidents are recorded in `auto-merge.yml`, and deploy-freshness's schedule fires only 7.7% of the time.
3. **A NAS change reaching the box:**
   - Hops: merge → `services-sync` every 15 minutes (`git pull --ff-only`) → each enabled `install.sh` → restart on code checksum → Funnel mount.
   - Weakest hops:
     - a 120-run daily cap, which once left the cameras on 13-hour-old code;
     - three services (nas-agent, bridge-publish, ytzero) that do not restart on changed code;
     - six mounts the watchdog does not heal.
4. **An alarm reaching Darrell:**
   - Hops: witness fails → `ops-announce.mjs` → Funnel `/announce` → relay :8796 → ntfy :8081 → phone.
   - Weakest hop: fixed in part today (DR-1110). The relay's HTTP 400 is still unexplained.
5. **A lesson reaching a reader:**
   - Hops: course file → quotation, band, voice and witness gates → merge → deploy → `lessons-sync` → curriculum tables (written only while `REPOINT-ARMED`) → device. The device is bundle-first, with an IndexedDB copy.
   - Weakest hop: preview rows are never withdrawn automatically, and a failed fetch keeps the stale copy.
6. **A schema change reaching both databases:**
   - Hops: migration file → replay and RLS guards → `db-migrate` (hosted, then sovereign, single-flight) → `migrate-freshness`.
   - Weakest hops:
     - forward-only migrations;
     - **no backup of the sovereign database** (§12);
     - a `BASELINE-REFRESH` nonce that runs `DROP SCHEMA public CASCADE` and restores from a hosted dump that has been stale since 2026-08-19.
7. **A research question (new):**
   - Hops: app → `/research` Function → Funnel → forwarder → Vane → tower Ollama and SearxNG.
   - Weakest hops: no tower answering today, and search engines throttling us.

## 8. Jobs and workflows

- **Counts:** 73 workflow files, 23 live schedules and 17 CI gate commands.
- **Brakes:**
  - Schedules without a timeout: `deploy-freshness`, `daily-review` and `corpus-reconcile`.
  - Without a concurrency lock: `nas-health` (**given one in DR-1113**).
  - With no kill-switch variable:
    - `keep-prs-current` (it has a PR budget and honours `hold`);
    - `camera-health`, `lesson-mail-watch` and `nas-health`;
    - `sovereign-content-sync` and `corpus-reconcile`.
- **Kill-switch variables in use:**
  - **Opt-in:** `CF_PAGES_ENABLED`, `PUSH_OUTBOX_DRAIN_ENABLED`.
  - **Opt-out:** `DEPLOY_FRESHNESS`, `FEEDBACK_FIXED`, `HARVEST_HEALTH`, `LEVEL_WITNESS`, `LIVE_LINK_PROBE`, `MIGRATE_FRESHNESS`, `NODE_AVAILABILITY`, `OPS_QUEUE_HEALTH`, `PLACE_DOORS`, `PUBLIC_SHELF_WITNESS`, `SITE_HEALTH`, `SYSTEM_FLOW_PROOF` and `VIDEO_STATS` (each `*_ENABLED`), plus `LESSON_BELL`.
- **NAS fleet:**
  - It is armed by `ARMED-BY-RECORD` **or** by `LOOPS_ARMED` in the NAS `.env`, so deleting the record alone may not stop it.
  - `run.sh` still tells you to touch a `KILL_SWITCH` that no longer does anything.
  - The fleet-wide stop DR-0248 promised was never rebuilt.

## 9. The incentive structure — what makes the right way the easy way

The house's incentives reward correct process:
- **A green gate ships at once.** Auto-merge on green makes passing the gates the fastest path to the family.
- **A red gate stops everything.** It cannot be talked past, and a gate must prove it catches before it counts.
- **Ratchets only move one way:**
  - band coverage (`allFour`, "a course may only add to this number");
  - the talk-together baseline;
  - the monolith budget;
  - the `KNOWN_GAPS` lists.
- **Not improving costs something.** It needs a written why and a `re-review:` date (DR-0075), swept by the review-watcher.
- **Asking costs something.** The ari-guard hook blocks a re-ask of settled work (DR-0111) and a hollow claim of "comprehensive" (DR-0239).
- **Failure is visible.** Every witness writes to an `incident` ledger and the OpsBoard.

**What the incentives do not reward yet: outcomes.**
- Nothing pays out for higher sign-in success, more lessons read, or better family quality of life. G1 has no measure at all.
- Nothing penalises a witness that cries wolf. #2057 ran for eight days on a false headline.
- So the system is strongly aligned to *process correctness* and only weakly aligned to *the goals in §0*. The next incentive to build is a measured outcome per goal, shown where the gates are.

## 10. Placeholders — slots declared so development can flex without losing the plan

| Placeholder | Where | State |
|---|---|---|
| Five flow loops marked "building (declared)" | `interconnect-guard` output | declared; not yet wired |
| Four open resources | `db:agent_inbox#poetech`, `nas:wf18-bearer`, `db:push_outbox#sent`, `http:openers` | open by declaration |
| 237 tables with no place in the flow graph | `system-flow-graph.mjs` | printed as a number, deliberately never green |
| Eleven Function roads with no Funnel mount | `RECORDED-STATE.md:52-62` | declared gaps |
| `enabled:false` services | `services.json` (openers) | skipped, **not stopped or uninstalled** |
| `ARMED-BY-RECORD` files (nas-loops, intake-autofix, openclaw-tower) | `infra/*` | arm on merge |
| `re-review:` dates on decision records | the ledger | the slot to revisit; review-watcher sweeps them |
| `KNOWN_OUTAGES` carve-outs in site-health | `scripts/site-health-verdict.mjs:77-94` | one entry, **expires 2026-10-26**, and it is the false one |

Placeholders work only while each one has an owner and a date. The 237-table count and the stale roadmaps (§0) are where flexibility is turning into drift.

## 11. The change log — what changed, and when, exactly

`node scripts/system-change-log.mjs --since=YYYY-MM-DD` (DR-1111) prints every merged change from main's own history. Each entry carries:
- the time to the second;
- the PR number and the decision records;
- the layers it touched, derived from its paths;
- how to reverse it in each of those layers.

For 2026-10-12 to 2026-10-19 it reads **127 merged changes**. They touched the ledger 108 times, tests 86, the factory 69, the app 63, the NAS 25, data 23, docs 22, content 21 and transport 2. **22 of them carry a schema migration**, and the log marks each one as forward-only.

The newest entries are the camera road's eleventh read (`32cfea2bf`, 07:39:04 UTC) and its tenth (`42799ab6b`, 06:40:14 UTC). Run the command for any window; nothing is stored, so the log cannot go stale.

## 12. Reversal and interdependency — how to undo what undermines

| Layer | How it is undone today | The limit |
|---|---|---|
| App, content, Functions | `git revert` on a `claude/` or `ccr-` branch → the lane → deploy | GitHub's Revert button makes `revert-NNNN`, which the lane ignores. There is **no Cloudflare rollback** in the repo (`INFRASTRUCTURE-PIPELINE.md:77` says "one command"; no such command exists), so a revert waits on CI (about 17 minutes). `CF_PAGES_ENABLED=false` blocks the revert's deploy too. |
| NAS services | Revert; services-sync fast-forwards within 15 minutes and restarts on changed code | Three services do not restart on changed code; `enabled:false` skips a service but does not stop it; there is no uninstall path. |
| Database | A **new** migration that undoes the change | Migrations are forward-only. **No backup of the sovereign database exists** (`infra/nas-supabase/README.md:105`: *"it is not optional for the family's data"*), and there is no point-in-time restore. The `BASELINE-REFRESH` path drops the schema and restores from a dump that has been stale since 2026-08-19. |
| Workflows | The kill-switch variables (§8), the `hold` label, the PAUSED files | Six schedules have no variable. |
| NAS loop fleet | `enabled:false` in the registry, or delete `ARMED-BY-RECORD`, or the DSM toggle | `.env` can still arm the fleet; the documented `KILL_SWITCH` is dead. |
| Secrets | `nas-rotate-bearer`, VAPID rotation (signs every device out), `mint_keys --force` | There is **no rotation or leak runbook** for `CLOUDFLARE_API_TOKEN`, `NAS_SSH_KEY`, `TS_AUTHKEY` or `SUPABASE_DB_URL`. |
| Lessons | Revert → deploy → `lessons-sync` deletes the rows no longer carried | Preview rows are not withdrawn, and the device keeps a stale IndexedDB copy if a fetch fails. |

**Interdependency.** The flow graph has every edge as `{from, to, res}`, with `writers` and `readers` maps (`system-flow-graph.mjs:149-166`). **No "what depends on X" query exists yet.** The blast radius of any change is a breadth-first walk from its node over those edges, and building it into the change log is the next step for reversal. Then every entry would name not only its layers but everything downstream of what it touched.

**The single largest risk to reversibility is the missing backup of the sovereign database.** Every other layer can be rebuilt from git; the family's data cannot. It is carried as the next build (§5, item 14).
