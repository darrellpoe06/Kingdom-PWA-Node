# The system, inside and out — 2026-10-19

Darrell, 2026-10-19: "Comprehensive understanding of the system...", "What is outside of the 10 dimensions... give me the full understanding of the system", "Inside and out...".

**How this was built.** Three read-only traces of the repository were made, one each for transport, data and delivery, and every claim is cited to `file:line` in those traces. Live readings came from GitHub Actions runs and issue #2057. The four defects marked *verified* below were re-read in the code before anything was changed. Anything not measured is labelled. Repo state: `main` at `fc23337` plus the day's merges.

---

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
| Wyze (cameras), Kinesis/WebRTC | cameras | 9 of 33 cameras working at the last camera-health read (DR-1097) |
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
| 11 | Cameras 9 of 33 | **CARRIED** by DR-1097's live reads (another session, seven reads so far) |
| 12 | Documents copy-down (task #3) | Blocked on Darrell placing the hosted key from ConnectBot |
| 13 | roads Worker token | Blocked on Darrell's Cloudflare token permission edit |
