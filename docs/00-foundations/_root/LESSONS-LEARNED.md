# LESSONS-LEARNED

**Foundation doc, Layer 3 (reference).** Comprehensive historical record of every incident, near-miss, surprise, and discovery that taught the PoeTech build something it didn't know before. Companion to `EXECUTION-OUTCOME-OBSERVABILITY` (which catches the failures) and `INSTITUTIONAL-MEMORY-EVENTS` (which structures them as data). This doc holds the human-readable narrative + the extracted principle.

Per Darrell 2026-06-03 evening: "Lessons learned area for comprehensive historical records." Established as a Layer 3 foundation so every future session inherits the institutional learning without having to rediscover it. The four binding-principle memories that produced this doc (in order of relevance):

- `project-institutional-memory-events` — every fix / pipeline issue / decision / principle becomes first-class structured data
- `project-execution-outcome-observability` — every workflow execution outcome must be observable AND alerted on
- `feedback-research-first` — research before shipping, not after
- `feedback-known-savings-must-ship-same-session` — when a lesson IS the saving, it ships immediately

## Purpose

A lesson is not the same as a fix. A fix solves the specific case. A lesson distills WHY the case happened, WHAT FAILED, and WHAT MUST CHANGE STRUCTURALLY so the class of failure can't recur. The fix lives in the master fix list + the commit; the lesson lives here so future sessions, future engineers, future stewards inherit understanding rather than re-discover the failure.

Three uses of this doc going forward:
1. **Onboarding artifact** — any new collaborator (Christiana, future contractors, future Foundation Agent) reads this to understand the lived history.
2. **Architectural reference** — when a new feature is being designed, the relevant lessons here are consulted FIRST so the design accounts for what's already been learned.
3. **Quality-Gatekeeper input** — wf36 reads new lessons and updates its pre-merge checks accordingly.

## Schema (every entry)

```
### YYYY-MM-DD — Incident Title

**Trigger:** what the user / system / monitor was doing when it surfaced.
**Detection path:** who/what noticed, and when in the timeline.
**Detection delay:** time between problem starting and human awareness — flag if > 0 min.
**Investigation steps:** chronological list of what was tried, in order.
**Root cause(s):** the actual mechanism(s) — can be multiple; name each.
**What worked:** the move(s) that produced the fix.
**What didn't work:** attempted moves that LOOKED like they should fix but didn't, and why.
**Principle(s) extracted:** the distilled rule(s) for future similar cases. Each is a single sentence.
**Forward architectural fix:** the structural change that closes this class of failure, not just this instance.
**Observability gap (if any):** what n8n / monitoring / the AI Foundation should have caught but didn't.
**Cross-refs:** related memories, commits, foundation docs.
```

Lessons accumulate top-down (newest first). Older entries are not removed; they are sometimes amended with "→ revised understanding YYYY-MM-DD" lines when later evidence sharpens the principle.

---

## Principles Extracted (running index — populated from incidents below)

These are the distilled, binding lessons. Each links back to the dated incident(s) it was extracted from. Future Claude sessions read THIS section first when designing new surfaces:

- **P1 — Defense layers must cover ALL data paths, not just the most-visible one.** A gate on one webhook doesn't help when localStorage / sessionStorage / IndexedDB / SW cache hydrate the rest of the app independently. (Extracted: 2026-06-03 localStorage leak.)
- **P2 — Service Workers are silent staleness multipliers.** Any "ship a fix" pipeline must include explicit SW version-bump + cache invalidation, or the fix never reaches users behind a cached SW. (Extracted: 2026-06-03 localStorage leak.)
- **P3 — Production outcome verification, not just deploy verification.** "Vercel says ready" + "n8n says workflows active" ≠ "fix actually fixed it." Every fix needs a synthetic probe that LOADS the live surface from a CLEAN context and asserts the new behavior. (Extracted: 2026-06-03 localStorage leak; 2026-06-03 wf13 noise persistence.)
- **P4 — Marking a fix "verified" requires testing in the FAILURE MODE, not the clean state.** A demo-mode test pass tells you the demo path works; it does NOT tell you the localStorage-already-populated path works. Test in the conditions the bug appeared in. (Extracted: 2026-06-03 D17 "verified" status that masked the larger leak.)
- **P5 — Outcome observability is the missing layer between system observability and product correctness.** n8n knows the system is up; it does NOT know what the live product is RENDERING. Every binding mission test (the four ethical tests + the Father's Business test) needs a SYNTHETIC that asserts the product still passes from a fresh visitor's perspective. (Extracted: 2026-06-03 localStorage leak.)
- **P6 — Repeated "NOT FIXED" without root-cause escalation wastes attention.** When a fix lands but the symptom persists, the NEXT investigation must escalate depth (DOM inspection → JS state → localStorage → SW → CDN → DNS), not iterate at the same surface layer. Each failed retry is signal that the model of the system is incomplete. (Extracted: 2026-06-03 localStorage leak — multiple "shipped" commits before root-cause was actually identified.)
- **P7 — Research before shipping; don't interpret-and-ship.** When a user message is short, the temptation to interpret quickly and ship a code change is the failure mode `feedback-research-first` was written to prevent. Confirm the interpretation, surface the alternatives, then ship. (Extracted: 2026-06-03 wf27 evening-only misinterpretation; reinforces existing feedback memory.)
- **P8 — `default-now-asap` for outbound communication; research-first for code changes.** These two binding principles don't conflict — send the user what's ready immediately, BUT before generating new code changes, research the actual user intent + the existing system state. The asymmetry: communication latency hurts the user's 5-minute windows; code-change latency saves the user from interpret-and-ship regressions. (Extracted: 2026-06-03 same-day pairing of `feedback-default-now-asap` + `feedback-research-first` reinforcement.)
- **P9 — Distinguish data leaks from brand presence.** Real-ops-data (real entity names, addresses, project titles in app state) is a leak. Real-business-brand advertising (Poe Properties / TLC Therapy Solutions in the family-ministries carousel) is intentional. Sanitization passes must NOT touch brand surfaces; only data surfaces. (Extracted: 2026-06-03 localStorage leak; reinforces `feedback-distinguish-data-from-brand`.)
- **P10 — Autonomous timer-driven automation needs three brakes before it ships active: a budget, a concurrency lock, and a kill-switch.** A token/turn/wall-clock ceiling per run, single-instance locking so a new fire skips rather than stacks on a hung one, and a dead-man's-switch that auto-pauses on overrun instead of auto-continuing. Without all three, a hung or looping run burns compute until a human kills it by hand. (Extracted: 2026-06-06 autonomous-automation runaway.)
- **P11 — Nothing self-activates unattended, least of all while the principal is away.** Automation that spawns more automation — or more Claude/compute — on a clock is shipped inactive and turned on only with someone watching. "Ship it live" during a vacation window is the exact condition that converts a small loop into an unrecoverable runaway. (Extracted: 2026-06-06 autonomous-automation runaway.)
- **P12 — Automation that consumes compute on a timer is Tier C, never Tier A.** The "NAS-only sovereign surface = Tier A" and "additive = Tier A" shortcuts do not apply to anything that runs on a schedule; sovereignty of location and additiveness of code do not bound cost or blast radius. (Extracted: 2026-06-06 autonomous-automation runaway.)
- **P14 — Auth changes the trust boundary; a leak gate for anonymous visitors must not lock out authenticated owners.** The 2026-06-03 public-host gate (rightly) forced demo data for ANYONE on poetech.us — but it kept doing so after sign-in, so the family used their own app staring at fake "Reeves/Maya/Jordan" data, feedback evaporated on refresh (persistence blocked), and the sync path could even upload demo rows into their real cloud instance. Reported by Christina + Darrell 2026-06-11 ("can't tell when I'm logged in… fake data mixed with ours"). Fix: anonymous = demo + no hydration + no persistence (gate stands); authenticated owner = own data hydrates, persists after hydration completes, and demo-only record ids are provenance-filtered out of every upload and every cloud-loaded list. Corollary: **any auto-upload path must filter by data provenance** — sample/demo rows never sync. (Extracted: 2026-06-11 signed-in-but-fake-data incident; pairs with P1/P9.)
- **P13 — Schema files are not applied state; verify the live catalog before mapping code to columns.** A migration file in the repo proves intent, not application. `CREATE TABLE IF NOT EXISTS` silently no-ops against a same-named table from an earlier generation, leaving a hybrid: the old shape with the new triggers. Before writing any sync/mapping code, query `information_schema.columns` (and pg_constraint / pg_trigger) on the LIVE database and map to what is actually there. (Extracted: 2026-06-10 phantom-v2.2-rentals discovery.)

---

## Incident Log (chronological — newest first)

### 2026-06-10 — The cloud rentals table was never the v2.2 shape; two days of sync code targeted phantom columns

**Trigger:** Applying the v2.2.2 rentals-sync migration in cloud Studio (the first signed-in database session since the rentals-sync wedge began) failed with its transaction rolled back; a catalog probe showed exactly one of four "new" columns already existed.

**Detection:** Post-failure catalog queries (`information_schema.columns`) revealed the live `rentals` table is the v1.2-numeric-sync shape evolved (instance_id, slug, entity_slug, address, monthly_rent, mortgage_payment, status free-text, tenant_name) — not v2.2's shape (display_name, property_type, links, lifecycle, purchase columns). Same for `incidents` (v1.2-evolved, with native linked_to_kind/linked_to_slug). `contractors_1099` (v2.4) did not exist at all. `rentals_tier_notify` (v2.2.1) was never created.

**Root cause(s):**
1. **`CREATE TABLE IF NOT EXISTS` no-opped silently.** v1.2 created `rentals`/`incidents`; when v2.2/v2.8 were later applied, their CREATEs skipped, while their OTHER statements (renters, leases, the tier trigger) landed — producing hybrid state: old table shapes carrying new-generation triggers.
2. **"Applied-but-unused" was asserted from the repo's schema files, never verified against the live catalog.** Two days of client mapping code (PR #24 v0 + the v2.2.2 review hardening) inherited the premise.
3. **The soak never ran signed-in**, so no insert ever hit the real table to expose the mismatch (pairs with P3/P4 — the failure mode was never exercised).

**What worked:** The signed-in Studio session made verification cheap; catalog probes identified the live shapes in minutes; the corrective migration (schema-v2.13-family-data-sync.sql, live-aligned, additive-only) applied and verified the same session; client mappings rewritten same-day. The live shapes turned out SIMPLER for the app (native slug/entity_slug, no CHECKs, purpose-built linked_to_slug).

**Principle(s) extracted:** P13 (also reinforces P3/P4).

**Forward architectural fix:** Every future sync wrapper starts with a live-catalog probe, not a schema-file read; migration files that were applied get an "APPLIED <date> + verified" header, and superseded/never-applied files get a DO-NOT-RUN header (done for v2.2.2 / v2.13).

### 2026-06-06 — Autonomous timer-driven automation ran away and required a manual shutdown

**Trigger:** A fleet of always-on, timer-driven automation shipped `active` on 2026-06-02/03 right before Darrell left for Maui — the wf27+wf31 continuous-feedback reel (5-minute cron, commit `e969693` / fix-list D23), the wf-autonomous-builder (`active: true`, 30-minute cron, whose purpose is to start Cowork/Claude build sessions), the Ollama `keep_alive` model-pin, the wf42 batch queue, plus five scheduled Cowork tasks (hourly snapshot + four check-ins, each spawning a Claude session). All left running with no one watching.

**Detection path:** Darrell, after the fact ("Claude had to be manually shut down"). No automated monitor, budget cap, or kill-switch caught it; the runaway was stopped by hand by deleting the scheduled Cowork task fleet.

**Detection delay:** ~hours-to-days. The `poetech-hourly-snapshot` task wrote a file every hour through 2026-06-06 13:10 Central, then stopped cold — no 06-07 or 06-08 snapshot exists. That gap is the failure window; awareness came only once the runaway was already bad enough to require a manual kill.

**Investigation steps (this session, 2026-06-08):**
1. Repo + snapshot review showed the hourly-snapshot heartbeat stopping at 06-06 13:10 Central with a ~2.3-day gap.
2. Identified the suspect surface from the working tree: the 5-min reel, the autonomous builder (active), the keepalive model-pin, the batch queue, and the five scheduled tasks — all designed to run unattended on timers.
3. Confirmed the failure mode from Darrell: runaway compute + looping/repeating + hung — NOT rogue infra actions (no unwanted changes to the NAS/n8n).
4. `list_scheduled_tasks` returned zero tasks → the fleet had already been torn down by hand. That deletion WAS the "manual shutdown."

**Root cause(s):**
1. **Primary: autonomous timer-driven automation shipped with none of the three brakes** — no token/turn/wall-clock budget (a hung run burned indefinitely), no single-instance concurrency lock (a new timer fire could stack on top of a hung one), no kill-switch / dead-man's-switch (the fleet auto-continued when it should have auto-paused).
2. **Secondary: the automation was a compute multiplier** — it spawned more Claude work on a clock (the builder starts build sessions; the snapshot + check-ins each start a session) with no aggregate ceiling.
3. **Tertiary: shipped active during a vacation window** — the one person who would notice was traveling. The 2026-06-02 "ship it live" directive removed the human supervisor at exactly the wrong moment.
4. **Quaternary: treated as low-risk / Tier A** — "NAS-only sovereign" + "additive" reasoning routed compute-on-a-timer changes straight to active with no soak and no budget.

**What worked:** Manual deletion of the scheduled-task fleet stopped the runaway. Read-only forensics (snapshot gap + working-tree artifacts + scheduler state) reconstructed the mechanism after the fact.

**What didn't work:** Nothing automated stopped it — there was no budget cap, no lock, no auto-pause. The every-5-min wf27 cron had ALREADY been reverted once on 06-03 (commit `d3657d6`) for being too aggressive; the pressure returned via the keepalive model-pin and the still-active builder. A one-off revert did not generalize into a standing rule, so the class of failure recurred.

**Principle(s) extracted:** P10, P11, P12 (see Principles index above).

**Forward architectural fix:**
1. **Binding guardrail (shipped with this entry):** no autonomous timer-driven automation ships without a budget + concurrency lock + kill-switch; that class is Tier C, never Tier A. Added to `CLAUDE.md` ("Autonomous Automation Requires Three Brakes") and `RELEASE-TIERS.md` (Tier C list + flowchart Q1).
2. **Quarantine (shipped with this entry):** the uncommitted re-arm artifacts (`wf-autonomous-builder.json`, `42-batch-research-queue.json`, and the builder/keepalive/batch apply scripts) moved to `docs/00-foundations/_quarantine/` with a README; NOT to be applied until the Cage (PR #5) is merged AND each carries the three brakes.
3. **The Cage (PR #5, 2026-06-09 blueprint)** already encodes the right enforcement primitives — allowlist, append-only audit ledger, health-gate + 120s auto-rollback. Extend that same budget / health-gate / auto-stop discipline to the Claude-orchestration layer (scheduled tasks + the autonomous builder), not only to network/VLAN actions.
4. **Single-instance lock + max-runtime on every scheduled task** before any of them is recreated: a new fire that finds a prior run still going skips rather than stacks, and a run that overruns its window terminates.

**Observability gap:** No budget/cost monitor and no "task overran its window" alert existed. The snapshot heartbeat stopping was the only signal, and it was passive (an absent file), not an alert. A dead-man's-switch that fires when the heartbeat stops, plus an aggregate compute/cost ceiling that auto-pauses the fleet, are the missing pieces.

**Cross-refs:**
- Memory: `project-continuous-feedback-reel`, `feedback-risk-clarify-before-change`, `project-execution-outcome-observability`, `feedback-research-first`
- Foundation: `RELEASE-TIERS.md` (Tier C clause added with this entry), `AUTONOMOUS-BUILDER-LIFECYCLE.md` (the shipped-active design), `CLAUDE.md` (guardrail clause)
- Commits: `e969693` (D23 5-min reel), `d3657d6` (first wf27 cron revert), `e5abb83` / PR #5 (the Cage blueprint)
- Quarantine: `docs/00-foundations/_quarantine/README.md`
- Master fix list: `docs/99-session-notes/2026-06-02-fix-master-list.md` (D23 reel; L-series autonomous-builder)

---

### 2026-06-03 — Real ops data leaked to poetech.us via localStorage hydration

**Trigger:** Darrell, on vacation in Maui, opened poetech.us and saw the Books → Imported tab showing real Chase transactions; the Big Picture dashboard rendering real ops data (1508 Holly Hill, Christiana college transition, 805 Apt 2 furnace, Holy Spirit Integration Worldview · finish + KDP, Poe Properties, TLC Therapy Solutions). Posted: "This still has our data showing incognito on the Books Tab Imported is showing our money still."

**Detection path:** Manual visual inspection by Darrell. No automated monitor caught it.

**Detection delay:** UNKNOWN — likely hours-to-days. D17 had been marked ✅ verified earlier in the day based on demo-mode bench tests; the localStorage path was never tested with populated data.

**Investigation steps:**
1. Reviewed `importedAllowed` gate in `poe-financial-mvp-v28.jsx` — found it correctly required `!isAnyDemoMode && !!currentProfile`, which would be false in true incognito.
2. Hypothesized: Darrell's "incognito" test was actually on a non-incognito tab on his own device, where localStorage carried his profile forward → `currentProfile=darrell` → gate passed → tab unlocked.
3. Shipped commit `cc3c069`: added hostname gate. `importedAllowed = !isPublicHost() && !isAnyDemoMode && !!currentProfile`. Public-host browsers now blocked regardless of localStorage. PII webhook fetch blocked.
4. Pushed. Darrell tested. Reply: "NOT FIXED."
5. Used Chrome MCP to navigate poetech.us directly + inspect rendering. **Found**: page rendering REAL ops data still, despite the hostname gate. The Imported tab was hidden BUT the Big Picture / Action Queue / Projects list still rendered real data.
6. Realized: the `importedAllowed` gate covers ONLY the Imported tab + wf18 webhook fetch. The rest of the app loads `data` state from `window.storage.get('poe-financial-v28')` in a separate `useEffect`. localStorage hydration runs INDEPENDENT of the gate, and overwrites the initial `SEED_DATA` with whatever the device has saved.
7. Shipped commit `3a8ca16`: three new public-host gates — initial `useState` for `data` returns `DEMO_DATA_FAMILY_OF_4` on public host, the localStorage-load `useEffect` short-circuits, the persist effect short-circuits, and `currentProfile` initializes to null. ALL data paths now blocked on public host.
8. Pushed. Vercel had NOT yet deployed — bundle still served as `index-C3isuweN.js` (pre-fix hash). Page still showed real ops data.
9. Inspected via Chrome MCP `javascript_exec`: confirmed `hostname=poetech.us`, `bundleSrc=index-C3isuweN.js`, `swControllers=https://poetech.us/sw.js`, localStorage contains `poe-financial-v28` (32540 bytes of real data) + `poe-current-profile=darrell`.
10. Cleared localStorage + sessionStorage + all Cache Storage + unregistered Service Worker via Chrome MCP `javascript_exec`.
11. Hard-reloaded poetech.us. Re-inspected: page rendered SEED data only — "Hannah college transition" (anonymized), "Steward Real Estate LLC", "Cornerstone Tech LLC", "Wellness Counseling Practice", "Wellness Practice — add 1-2 MSW contractors". NO Holly Hill, NO Christiana, NO 805 Apt, NO Holy Spirit Integration Worldview. ✅ Leak stopped on this device.

**Root cause(s):**

1. **Primary: localStorage hydration ran AFTER and INDEPENDENT of the `importedAllowed` gate.** D17 closed one webhook; left the in-memory state-hydration path open.
2. **Secondary: Service Worker `https://poetech.us/sw.js` cached the OLD bundle**, so even if the fix had deployed, the SW would have served the pre-fix code to repeat visitors.
3. **Tertiary: Vercel-deploy lag was invisible.** Commit pushed → expected ~60-90 sec → bundle hash never changed during the visible window. No monitor flagged the lag.
4. **Quaternary: D17 was marked "verified" based on demo-mode + clean-state tests.** The actual failure mode (localStorage already populated with real data) was never benchmarked.
5. **Quinary: No outcome observability.** n8n probes monitored DSM up / ollama up / n8n_self up — none of them loaded poetech.us and asserted "no forbidden tokens render."

**What worked:**
- Direct Chrome MCP rendering of the live site (the only way to actually see what real users see)
- `javascript_exec` to introspect localStorage + SW + caches
- `localStorage.clear()` + `sessionStorage.clear()` + `caches.delete()` + `serviceWorker.unregister()` all in sequence
- Repo-side `isPublicHost()` gate added to ALL data hydration paths (not just the webhook)

**What didn't work:**
- Initial `importedAllowed` gate only — didn't account for other data paths
- The cc3c069 hostname gate alone — didn't block the localStorage hydration useEffect
- Waiting for Vercel deploy and assuming the bundle hash would update without verifying
- Marking D17 "verified" without simulating the failure-mode environment (populated localStorage)

**Principle(s) extracted:** P1, P2, P3, P4, P5, P6 (see Principles index above).

**Forward architectural fix:**

1. **wf12b — Synthetic DOM canary.** Every 5 minutes: fetch poetech.us in a headless browser (Puppeteer / Playwright in an n8n container), wait for the React tree to render, run a JS expression that returns the rendered text content of `<main>`, scan for forbidden token list (`Holly Hill`, `Christiana`, `805 Apt`, `Holy Spirit Integration Worldview`, `Poe Properties` if outside the carousel hero, etc.). If any found, fire ntfy alert + Synology Chat post + agent-log entry. Ships post-vacation (post 6/5).

2. **wf12c — Vercel-deploy-lag monitor.** Every 5 minutes: compare GitHub main HEAD short-SHA against a SHA embedded in the live bundle (build-time injected). If lag > 5 minutes after a known push, fire alert. Ships post-vacation.

3. **wf13b — Chat-channel-noise probe.** After any wf13 import or restart, count empty-payload posts in `#PoeTech-PWA` over the next 90 seconds via Synology Chat scrape. If > 0, fire alert + Synology Chat post saying "wf13 apply did NOT close noise — re-investigate." Ships post-vacation.

4. **Service Worker versioning.** Every deploy bumps a `SW_VERSION` constant in `sw.js`; old SWs see the bump on next page load and auto-unregister + force a refresh. Code change at `app/public/sw.js` — ship NEXT push. *Shipped 2026-06-10:* the `sw-version-stamp` plugin in `app/vite.config.js` rewrites a `__SW_VERSION__` placeholder in `dist/sw.js` at build time with the deploy's `VERCEL_GIT_COMMIT_SHA` (timestamp fallback locally); the cache name derives from it, so each deploy's byte-different `sw.js` installs fresh, the existing SKIP_WAITING + controllerchange-reload flow in `main.jsx` takes over without a tap, and the activate handler deletes all prior-deploy caches. (Mechanism differs slightly from the sketch above — install-new-and-takeover instead of unregister — same outcome: no stale cached bundle survives a deploy.)

5. **"Fix verified" must include a failure-mode simulation.** No fix can move from ⏳ → ✅ in the master fix list without a probe that simulates the bug's original conditions and shows the new behavior. The probe is added to the fix itself, not to a separate workstream.

6. **Foundation doc cross-referenced from CLAUDE.md.** This LESSONS-LEARNED.md is now in the SKOS Foundations list per the binding-doc convention.

**Observability gap:** All four NAS-side probes (wf12, wf08, wf13, wf27) monitor system health and execution presence. None monitor product outcome (what the live site shows). The synthetic DOM canary (wf12b) is the missing piece.

**Cross-refs:**
- Memory: `project-execution-outcome-observability`, `project-institutional-memory-events`, `feedback-research-first`, `feedback-default-now-asap`, `feedback-known-savings-must-ship-same-session`, `feedback-distinguish-data-from-brand`
- Foundation: `EXECUTION-OUTCOME-OBSERVABILITY.md` (when written), `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `COMMUNITY-FIRST-MISSION.md`
- Commits: `fd7c7e6` (D17 original), `cc3c069` (hostname gate), `3a8ca16` (full hydration gate)
- Master fix list: `docs/99-session-notes/2026-06-02-fix-master-list.md` rows D17 + new D24 (this leak's complete close)

---

### Earlier incidents — to be backfilled from session notes + commit history

(Per `project-institutional-memory-events`: prior incidents — wf30 silent-fail 4-hour debug, wf18 cross-origin throttle, two-session git race, ASCII-only PowerShell, the four-question test discovery, the PIN-optional community-default reversal — all get incident entries here over the next vacation-day sweep. Each pulls trigger / detection / root-cause / principle from the session note that captured it the day of, structured per the schema above. This is the doc that holds the historical narrative; the master fix list holds the live work queue.)
