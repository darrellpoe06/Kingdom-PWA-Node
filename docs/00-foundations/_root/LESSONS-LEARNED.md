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

---

## Incident Log (chronological — newest first)

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

4. **Service Worker versioning.** Every deploy bumps a `SW_VERSION` constant in `sw.js`; old SWs see the bump on next page load and auto-unregister + force a refresh. Code change at `app/public/sw.js` — ship NEXT push.

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
