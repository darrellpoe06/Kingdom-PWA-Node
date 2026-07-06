# UI/UX & Accessibility Review Registry

**What this is.** The append-only, repo-side record of UI/UX, accessibility (WCAG), code-review, and orchestration (how-we-worked) findings on PoeTech surfaces — surfaced INSIDE the app (Projects › Build › Quality / Proof, Governor-gated) so the reviews close their own loop where the work lives, not only in session notes. Since DR-0102 the panel also MEASURES this registry's freshness (days since the newest record) and flips to attention past 7 days — consistency is the schema, freshness is measured, not promised.

**Why it exists.** Darrell, 2026-06-16: *"our app UI/UX reviews — are they in there?"* They lived in CI, review docs, and the local-LLM output, not in the app. This is the structured, real feed the in-app panel reads (parsed at build time into `__UIUX_REVIEWS__`, the same pattern as the governance queue and the DR ledger). The live local-LLM diff review and the live WCAG contrast measurement render alongside these records from their own real sources.

**Binding rule — no fabricated reviews.** Every record below points at a real artifact in this repo (a source doc, a gate script, or a DR). `Status: addressed` is used ONLY where the resolution is independently verifiable (a passing gate, an injected build marker). Otherwise the status is `logged` (recorded, resolution not verified here) or `open` (known, unresolved). Add a record when a review happens; never invent one to make the panel look green.

**Format (parsed):** one record per `###` block. Fields: `Date`, `Surface`, `Type` (`accessibility` | `ui-ux` | `security` | `code-review` | `orchestration`), `Status` (`addressed` | `open` | `logged`), `Findings`, `Source`. An `orchestration` record reviews how the work itself ran (lanes, verification, integration, handoffs) per DR-0102 — one per reviewed working day, frictions carried as actions with re-review dates.

---

## Records

### REV-0001 · Per-theme WCAG 2.1 AA contrast
- **Date:** 2026-06-15
- **Surface:** All themes (white, slate, sapphire, rose, midnight)
- **Type:** accessibility
- **Status:** addressed
- **Findings:** A code comment falsely claimed "all combinations exceed WCAG 2.1 AA" while light-theme body text measured 2.92:1 against 4.5:1 required. Replaced the claim with a deterministic per-theme contrast gate that fails the build below AA. The live measurement is shown in this panel from the same scanner (`scanContrast`).
- **Source:** scripts/contrast-guard.mjs

### REV-0002 · Machine-readable build-freshness marker
- **Date:** 2026-06-01
- **Surface:** App shell / Build board header
- **Type:** ui-ux
- **Status:** addressed
- **Findings:** Daily review could not confirm which build the phone was running — no machine-readable build-SHA was exposed in the DOM, so "is the phone on the new build?" recurred. Resolved by injecting `__BUILD_SHA__` / `__BUILD_TIME__` at build and surfacing them with a freshness dot (green = latest, red = a newer build is waiting).
- **Source:** app/vite.config.js

### REV-0003 · Public landing CTA pointed at an undeployed workflow
- **Date:** 2026-06-01
- **Surface:** Public landing — primary "Drop your bank file" CTA
- **Type:** ui-ux
- **Status:** logged
- **Findings:** The loudest CTA on the public landing POSTed to a webhook (wf33) that was not in the active/deployed set, so a first-time visitor doing the most-encouraged action would hit HTTP 404 and the error modal. Flagged against BUSINESS-PROCESS-CONNECTIONS (don't make an unwired surface the loudest button). The signed-in real-data ingest path is tracked on the Build board.
- **Source:** docs/99-session-notes/2026-06-01-mvp-comprehensive-review.md

### REV-0004 · Client-rendered surface not visually verified (no-browser run)
- **Date:** 2026-05-31
- **Surface:** Persona picker / demo data / leak check
- **Type:** ui-ux
- **Status:** logged
- **Findings:** First daily review ran without a browser; the meta/shell leak check was clean but the client-rendered surface (persona picker, sample data, build marker) could not be visually verified. Recorded as a coverage gap; later runs with Chrome verified the rendered surface.
- **Source:** docs/99-session-notes/2026-05-31-daily-app-review.md

### REV-0005 · Tenant data-isolation review (no cross-family leak)
- **Date:** 2026-06-14
- **Surface:** Multi-tenant data access (RLS / instance scoping)
- **Type:** security
- **Status:** addressed
- **Findings:** Reviewed whether one family could see another's records after the "Darrell at top" parishioner incident. Confirmed cosmetic-only (RLS held under a service-vs-anon test); encoded the judgment as the tenancy guard + conference no-leak gate so a cross-instance read fails the build.
- **Source:** scripts/tenancy-guard.mjs

### REV-0006 · Orchestration review — the 2026-07-05 working day
- **Date:** 2026-07-05
- **Surface:** How the work itself ran (PRs #585–#587) — lanes, verification, integration order, handoffs
- **Type:** orchestration
- **Status:** logged
- **Findings:** Kept: six parallel audit lanes over all 39 surfaces with adversarial file:line classification (DR-0076); proven-to-catch tests on all four financial-math fixes; every non-live item carries its why + re-review date (DR-0075); small follow-up lanes (#586/#587) integrated cleanly. Frictions → actions: (1) one 59-file PR carried five workstreams — discovery may batch, but its fixes integrate as separate small lanes per DR-0077 (practice, effective now, re-review 2026-07-12); (2) the 0077 migration unlock is still a hand-paste for Darrell while the db-migrate lane exists — name the cause (NAS family instance vs cloud secret) and close it (re-review 2026-07-12); (3) this registry sat 20 days without a record across ~200 merges — freshness is now measured in-app and orchestration reviews append per working day (DR-0102). **(4) THE STALL — "we don't move when I'm not pushing" (Darrell, remedy asap):** verified root cause — the auto-open-PR + auto-merge lane filtered eligible branches to `^(feat|fix|merge|docs)/`, so every `claude/*` agent PR (all remote-session work, incl. this one) was invisible to the hands-off merge lane and could only be landed by Darrell's hand. Fixed this session: `claude/**` added to the CI push trigger, auto-open-PR trigger, and auto-merge eligibility, so agent PRs ride the existing default (auto-merge on green gates; `hold` label = the per-PR soak/Governor brake). Behavioral half: idle turns now pull the next dated backlog item forward instead of parking on passive poll-timers (recorded to memory). Re-review 2026-07-12.
- **Source:** docs/99-session-notes/2026-07-05-orchestration-review.md

### REV-0007 · Inbound (Voice Ops) — opportunities & constraints
- **Date:** 2026-07-05
- **Surface:** Inbound tab (app/src/components/Inbound.jsx) + backend/voice-worker + the sibling infra/nas-property-inbound pipeline
- **Type:** ui-ux
- **Status:** logged
- **Findings:** Reality-traced evaluation of our inbound capability. WHAT IT IS: Twilio-transcribed voicemails on two business lines (Steward Real Estate, Cornerstone Tech) → a Cloudflare Worker (free tier) + D1 → in-app manual triage into Incident / Inquiry / Project; the TLC clinical line is deliberately NOT routed (HIPAA, Phase 3). A second, separate inbound pipeline (infra/nas-property-inbound) ingests tenant TEXTS as classified DATA. OPPORTUNITIES (ranked): (1) auto-suggest triage — the worker has zero intent logic; port the NAS deterministic classifier (and later a DR-0105 sovereign-model summary) to pre-fill intent/priority/unit/target [ADDRESSED THIS SESSION, deterministic half — lib/inbound-triage.js]; (2) unify the two inbound pipelines onto the one CRM backbone (crm_leads, migration 0046, crm_capture_lead seam) — one governed front door (re-review 2026-08-15); (3) the missing outbound half — a human-approve-to-send reply path in-app (both systems are capture-only by design) (re-review 2026-08-15); (4) more channels (SMS/web/email) onto the same queue (re-review 2026-09-01); (5) COLG/church inbound reuse of the same front door (re-review 2026-09-01). CONSTRAINTS: HIPAA firewall is a hard line (established); per-device localStorage config (no synced steward config); test-coverage gap — pure convert logic is tested but the React fetch/mark-handled path + worker endpoints are not (this surface already shipped a real double-convert bug, A2); free-tier Twilio/Cloudflare ceilings (tracked via /usage/this-month); any added automation/model is Tier-C three-brakes (ships inert). All capability surfaces IN the app; only the webhook receiver, ingest loops, and model host live outside (they can't run in a browser) and each surfaces + is governed in-app (DR-0061/0065).
- **Source:** app/src/lib/inbound-triage.js

### REV-0008 · YouTube transcription / Harvest Ledger — opportunities & constraints
- **Date:** 2026-07-06
- **Surface:** Harvest Ledger (Church -> Harvest; app/src/components/HarvestLedger.jsx) + the transcript pipeline (infra/nas-sme-pipeline/load-transcripts.py, ops-runner.py, transcript-backfill-ci.py, .github/workflows/transcript-backfill.yml) + the pure harvest core (app/src/lib/video-harvest.js, transcript-harvest.js)
- **Type:** ui-ux
- **Status:** logged
- **Findings:** Reality-traced review of how we turn a service video into content. HOW IT WORKS: one-source-many-harvests (DR from 2026-06-25 note) -- an ingested @thelovecorner recording (choir_sermons row) fans into 9 harvest types; "now" types (Message/Scripture-from-title/Songs/Events) light the instant a row lands from real fields, "caption" types (Transcript + Lessons/Discernment/Testimony/Trivia, and the full Scripture sweep) mine from the video's YouTube AUTO-CAPTIONS (no GPU) via youtube-transcript-api, upserted into video_transcripts (0058) and recomputed live by video-harvest.js; Whisper-on-NAS (large-v3-turbo, port 8771) is the RARE no-caption fallback. THREE FETCH PATHS, one queue: the steward taps "Fetch next transcripts"/"Resume after YouTube block" in-app -> a row in ops_commands (0068, owner/admin RLS) -> the NAS ops-runner.py (outbound poll, service key, whitelist, three brakes, SHIPS INACTIVE per P10-12) runs load-transcripts.py; plus a workflow_dispatch CI backfill and a local standalone script -- the cloud app can't reach the LAN NAS (P18), so they meet in the DB (DR-0088). Coverage is DERIVED, never painted (DR-0076): the header today reads 135 ingested, 0 fully mined, 135 partly (avg ~41%), Transcript 57/135 captioned. OPPORTUNITIES (ranked): (1) VERIFY-THE-CLIMB -- no synthetic asserts the Harvest % actually moved after a "successful" run; add a proven-to-catch gate so a green run that advanced 0 while gaps remain fails (closes the exact P22 false-green; re-review 2026-07-13); (2) ARM THE NAS RUNNER + a residential proxy (Webshare/YT_PROXY_URL) as the one reliable no-block route, then finish the last 78 captions -- this is the single unblock that climbs the % (re-review 2026-07-13); (3) AUTO-DETECT new uploads -- the hourly schedule ships commented-out in transcript-backfill.yml; arm it (idempotent, cheap) so today's Sunday/Wednesday self-ingests within the hour (re-review 2026-07-20); (4) DEEPEN partial->complete -- the caption extractors are honest heuristics (partial); a later sovereign-LLM pass over the SAME transcript deepens Lessons/Discernment/Testimony to complete without re-fetch (Tier-C, three-brakes; re-review 2026-08-15); (5) WIRE the last-mile consumers -- Trivia (already text, sequenced first), Lessons->Learn, Discernment track, Sermon Stories; each caption harvest should light its destination surface, not just the ledger (re-review 2026-08-15); (6) coverage display beyond YouTube -- buildLedger joins choir_sermons (YouTube-only), so the RSS/other adapters (SOURCE-ADAPTER-INTERFACE) won't show until the join reads content_sources per-platform (re-review 2026-09-01). CONSTRAINTS: YouTube IP-blocks datacenter ranges (GitHub runners always; the NAS residential IP after ~180 req/day) -- the hard ceiling on throughput (LESSONS P22/P23, 2026-07-02 incident); classify-before-persist is load-bearing (a RUNNER failure writes NOTHING, only an ITEM verdict is stored, or a transient block becomes permanent false state); the NAS runner + hourly schedule ship INACTIVE and are Tier-C three-brakes; NAS-side multi-harvest extraction is a Darrell's-hand deploy, not yet verified live; no YouTube cookies used (proxy + jittered sleeps + kill-switch/resume is the whole anti-block strategy). All controls surface IN the app; only the caption fetcher, ops-runner, and Whisper host live outside (they can't run in a browser) and each is queued + reported live in-app (DR-0088/0061).
- **Source:** app/src/components/HarvestLedger.jsx

### REV-0009 · Ways-review — the ConnectBot miss (scope to the team's tools, not the agent's)
- **Date:** 2026-07-06
- **Surface:** How the work ran this session — the agent's scoping of a NAS action; the SSH-access assumption
- **Type:** orchestration
- **Status:** logged
- **Findings:** First ways-review under DR-0108 (Darrell: "review our ways I have connectbot... Make that a documented mandatory thing"). THE MISS: on opportunity #1 (finish the captions) the agent said the NAS route "needs your hand / I have no SSH" and stopped -- scoping the fix to its OWN access -- while Darrell has ConnectBot (SSH from his phone), so the NAS runbook was executable by the principal the whole time. Root cause: the agent treated its own verified limit (no ssh client; LAN + Tailscale Funnel blocked from the cloud -- that part WAS measured, a DR-0076 win) as the TEAM's limit, and treated "must be by hand" as a stopping point instead of an unverified premise. KEPT (evidence): the SSH claim was verified before repeating, not asserted from memory (no ssh binary, LAN:22 unreachable, Funnel 403); opportunity #1 was driven as far as the cloud allowed (dispatched transcript-backfill.yml, read the real log: 0 fetched / 14 blocked / exit 3, classify-before-persist held -- no corpus poisoning); the DR-0107 deploy gap was caught and the deploy dispatched + verified on the merge SHA. FRICTIONS -> actions: (1) the agent must inventory the whole team's capabilities (Darrell's tools, the Foundation's, the NAS's) before declaring a path blocked -- encoded as WAYS-REVIEW + the Layer-0 "Review Our Ways" rule; ConnectBot recorded as a known capability so NAS runbooks ship as paste-ready SSH steps, not "unreachable" (effective now); (2) a stated "can't / must be by hand" is challenged as a premise, not accepted (SURFACE-PREMISE); (3) ways-reviews now append here per DR-0102 cadence so the practice is perpetual, not remembered. Honest limit (DR-0076): this is conversational scoping behavior -- no build gate can catch it; the always-loaded Layer-0 rule IS the control.
- **Source:** CLAUDE.md

### REV-0010 · Ways-review — the continuous-efficiency pass (3 copied scripts → 1 registry)
- **Date:** 2026-07-06
- **Surface:** How the work ran this session — the verse-append workflow across three new teachings
- **Type:** orchestration
- **Status:** addressed
- **Findings:** Continuous-efficiency pass under the new DR-0109 (Darrell: "add a new fix after just watching the process... keep that as the model or our Way of working — one extra step to make sure we are increasing efficiencies always"). THE SIGNAL: building three self-paced Learn courses + Generations decks in one session, the agent created three near-identical ~100-line verse-append scripts (append-way-up-verses / append-stewardship-verses / append-pride-verses), each sed-copied from the last — duplication invisible inside any single task, visible only when watching the workflow repeat. THE FIX (shipped, same lane): consolidated into ONE registry-driven scripts/append-verses.mjs with a BATCHES map; adding a teaching's verses is now one entry, not a copied file. Proven a no-op against the existing store (idempotent — behavior unchanged, only future friction drops; DR-0076 evidence, not a claim). WIN STATED: 3 scripts (~14 KB) → 1 script + N-line registry entries. FRICTIONS -> actions: the module-growth direction (DR-0103) applies to tooling too — dedupe copied scripts on sight; the efficiency pass is now a named closing step on every task (Layer-0 rule), not a remembered one. Honest limit (DR-0076): this is a workflow/tooling improvement with no product-behavior change; the games' content-integrity gates (every ref resolves) remain the proof the verses are intact.
- **Source:** scripts/append-verses.mjs
