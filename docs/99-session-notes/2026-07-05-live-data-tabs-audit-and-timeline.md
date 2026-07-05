# Live-data tabs audit + timeline — 2026-07-05

**Mandate (Darrell):** "Review each of the PoeTech App tabs for static data, review
loops and ensure that the current state of them are working live data driven
information flowing throughout the PoeTech App … and a timeline for all of the data
being live … work until it is comprehensively complete." Follow-up the same session:
"we want this app unbreakable and usable today" — and the live TV Time screenshot
showing the stale "live group sync is coming next" copy still on screen.

**Method.** Six parallel audit passes covered ALL 39 registry surfaces
(`app/src/surfaces.js`) plus every shell-mounted view outside the registry (Big
Picture, Inbound, Projects sub-views incl. Build board / Concerns / Loop Health /
Quality Proof, the non-registry Books sub-views, and the shell chrome). Every
rendered collection was traced to its source (file:line) and classified
adversarially per DR-0076: LIVE / LOCAL-ONLY / STATIC (painted) / STATIC-BY-DESIGN /
BUILDING. Builds on the 2026-06-29 interconnection-loops audit and extends it from
6 flagship loops to the whole tab surface.

## The verdict map (all tabs)

**LIVE — verified wired, no action needed (26):** Study, CRM, Inventory, Forecast,
Create, Practice (all three collections), Rentals (core), Chef's Corner, TV Time
(owner sync 0072 + circle sharing 0074), Books→Transactions (ledger), Books→1099,
Choir (8 realtime streams), Service Program, Pulpit, Harvest (reference-quality,
incl. the ops-command seam), Conference, Conference Variance, Event Center, Events,
Scripture appearances, Admin (load-based reads + real RPCs), Concerns board, Loop
Health, Quality Proof, Big Picture (derived + number-traced), Feedback.

**Painted signals found (3) — ALL FIXED THIS SESSION:**
1. Command & Serve faculty readiness chips — hardcoded 'live'/'partial' rendered as
   if computed → now carry explicit **declared** provenance ('Wired · declared' +
   tooltip; `declaredReadiness()` + `READINESS_PROVENANCE`), pinned by test.
2. About "aggregate of family priority votes shapes the roadmap" — the aggregate
   was one device's localStorage → **made TRUE**: votes now pool per
   (instance, user, module) on the `module_interest` rail (0077) and About renders
   the real cross-member Family Priority Votes count; copy states the signed-out
   fallback honestly.
3. AppFirmUp persistent-share % / module ledger / trend — a committed snapshot that
   read as a live gauge → now stamped **"measured {date}"** from the artifact's own
   `generatedAt` (falls back to "snapshot — regenerate" wording, never invents).

**Static-with-a-live-seam (3) — ALL WIRED THIS SESSION:**
4. Engagement trivia — the UI rendered the fixed anchor set while
   `getActiveQuestion`/`getRecentQuestions` over `trivia_questions` sat unused →
   the surface now reads the live table first and falls back to the authored
   anchor set honestly (producer still pending, see timeline).
5. Library — mounted with `sermons={[]}`, permanently starving sermon-based book
   recipes → Library now self-subscribes the live `choir_sermons` stream (the
   proven ScriptureLibrary pattern); field contract verified before wiring.
6. Device register — live-subscribed but nothing could WRITE `church_devices` (no
   editor existed) → steward add/edit controls now call the existing `saveDevice`,
   so the register can hold real state instead of only the bundled seed.

**Bugs / staleness fixed (4):**
7. ChurchHome contribution mailto builder referenced its record before definition.
8. TV Time / TVCircle stale "gated off / live group sync is coming next" copy —
   scrubbed everywhere (component copy, lib comments, monolith mount comment,
   pinned test flipped); the trending label now says truthfully that it ranks YOUR
   list and points to the live circle surface.
9. Relationships landlord/tenant was load-once — Refresh button + focus/visibility
   refetch added (load-based remains the pattern; staleness is now user-recoverable).
10. `SEED_CIRCLE` painted roster removed from TV Time intro copy.

**LOCAL-ONLY promoted to the family instance — migration 0077 (7 rails, shipped
fail-soft this session):** Games saves (`game_saves`), Books→Subscriptions
(`family_subscriptions`), Dev/Ops skill profiles (`skill_profiles`), prayer
requests (`prayer_requests`), One Voice notes (`church_voice`), Markets watchlist
(`market_watchlist`), About module votes (`module_interest`). Five ride the new
jsonb-doc rail (`lib/doc-sync.js` — the doc IS the record; column drift is
structurally impossible, P13), two are hand-shaped (string set / keyed vote). All
reducers push, the tables loop / dedicated effects subscribe realtime, and until
0077 is applied every call fails soft and the device keeps working — sync
self-heals the moment the tables exist.

**STATIC-BY-DESIGN — correct as-is, no change (named so the why is recorded,
DR-0075):** Learn/class curricula, Scripture themes + Study Edition + KJV text,
Eternal Algorithms study content, Games catalog, Dev/Ops business-plan content
(library/models/moats/projections), Video Wall engineering runbook + specs, Events
campus catalog, Chef Mario canonical recipes, Listening picks, Help content,
BuildBoard roadmap (labeled hand-maintained), admin steward allowlist, Notes
(sovereign device-local diary by declared design).

## Timeline — everything not yet live, each with its why + re-review date

| # | Item | Why it isn't live yet (awaiting) | Owner / lane | Re-review |
|---|------|----------------------------------|--------------|-----------|
| 1 | **Apply migration 0077** (unlocks all seven new rails) | Applied by Darrell's hand in Supabase Studio (db-migrate gap); code already shipped fail-soft | Darrell (5 min, PowerShell + SQL below) | **2026-07-06** |
| 2 | Trivia producer (Wednesday message → `trivia_questions`) | Extraction of Bishop Gwin's end-of-message questions blocked on the church-inbox / Whisper pipeline (Christina's Gmail OAuth) | NAS pipeline | 2026-07-19 |
| 3 | Trivia answers read-back (leaderboard/aggregate) | `trivia_answers` writes land but nothing reads them; needs a consumer surface decision | app | 2026-07-19 |
| 4 | Observation photos off-device | Photos are deliberately stripped from snapshot-sync; need the NAS write-path (or family Supabase storage bucket) + a `church_observation` table — LAN-side work (P18: local agent) | NAS + app | 2026-07-26 |
| 5 | Books→Transactions retired ingest/reconcile UI | wf18 overlay retired 2026-07-01; the reconcile pills + mark-noise seam are invisible when empty but dead weight — either re-point at a live producer or remove the UI | decision: Darrell | 2026-07-26 |
| 6 | Bookstore checkout seam | `CHECKOUT_CONFIG.enabled=false` — no payment processor wired; honestly labeled | business decision | 2026-08-15 |
| 7 | Opportunities "My Active Pipeline" CRUD | Seed pipeline is honestly labeled "sample" but no add/edit path exists for real deals; needs reducers + a rail (candidate for the doc rail) | app | 2026-07-26 |
| 8 | Purchasing → Forecast | `buildProjection` ingests cash/salaries/rentals only; purchasing spend never reaches it (Chef Mario P4; tracked in manifest) | app | 2026-08-15 |
| 9 | Presenter worship set list | Built + tested, mounted by no component (tracked in manifest) | app | 2026-08-15 |
| 10 | Learn cohort publish | Publishing a cohort date to ALL learners still requires a code edit to the lib constant; needs a DB-backed published-cohort row | app | 2026-08-15 |
| 11 | Learn per-learner progress | `classProgress`/`classQuiz` ride snapshot-sync (account-scoped LWW) — fine single-account; a per-learner synced table is the multi-user upgrade | app | 2026-08-15 |
| 12 | Library shelf + Bookstore catalog sync | Device-local; candidate for the owner-only doc rail (0070/0072 pattern) | app | 2026-08-15 |
| 13 | Checkout intents + voiceOps config sync | Low-traffic config/capture lists; voiceOps carries a bearer token — syncing credentials needs a deliberate decision, not a default | decision: Darrell | 2026-08-15 |
| 14 | WakeOrchestrator / RentCast / property-photo n8n seams | Real seams, inert until the NAS bundle / API keys are configured; all degrade honestly | NAS | 2026-07-26 |
| 15 | Trivia loop-health row + the new rails in Loop Health | The interconnect manifest now guards the wiring; adding freshness rows for the new rails is deliberately deferred until real usage exists to measure (a freshness row over an empty table reads 'never' and shouts falsely) | app | 2026-07-26 |

Rows 2–15 stay honest in-app today: every one renders as *building*/inert/labeled,
never green (DR-0076).

## Step 1 for Darrell — apply 0077 (from anywhere)

Plain steps: open Supabase Studio on the NAS → SQL editor → paste the contents of
`infra/supabase/migrations-auto/0077-live-data-rails.sql` → Run. Idempotent; safe
to re-run. Then sign into the app on one device, add a watchlist ticker or a prayer
request, and watch it appear on a second signed-in device.

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
git pull origin main
notepad infra\supabase\migrations-auto\0077-live-data-rails.sql
Start-Process "http://192.168.1.26:8000"
```

(Notepad opens the SQL to copy; the browser opens the NAS Supabase Studio. Paste
into the SQL editor and Run. Verify: the editor reports success and
`select tablename from pg_tables where tablename in ('game_saves','family_subscriptions','skill_profiles','prayer_requests','church_voice','market_watchlist','module_interest');`
returns 7 rows.)

## How this is guarded (never silently static again)

- Every new rail is registered in `scripts/interconnect-manifest.mjs` — the seven
  0077 rails as **building** (honest until the migration is applied and verified
  live; the wiring tokens are already declared so flipping to `live` enforces them),
  and the session's re-wired loops (Library sermons, Engagement trivia read,
  device-register writer) with their real tokens. `interconnect-guard` + vitest
  fail the build if any declared wiring is ripped out.
- Gates run this session: eslint 0-warnings, full vitest, interconnect-guard,
  production build (results in the PR).

## Standards check (the "mistakes of the past" review requested mid-session)

- **P13** — no new sync code maps hand-picked columns; the doc rail makes column
  drift impossible, and nothing was marked live against an unverified cloud shape.
- **P15/P16** — every fix names its real table/feed; the three painted signals were
  fixed by making them true or dated, never by re-painting.
- **P22/P23** — "live" in the manifest stays `building` until rows are verified on
  the applied database; a pending migration is a runner-state, not a data-fact.
- **DR-0075** — everything not improved carries its why + re-review date (table
  above). **DR-0076** — no green without evidence. **Release tier:** code-only
  wiring + fail-soft rails through the established lane (Tier B soak on the PR
  preview); no timer-driven automation shipped (the three-brakes rule untouched).
