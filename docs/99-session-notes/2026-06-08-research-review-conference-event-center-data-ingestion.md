# Research Review + Architecture Spec — Conference Module & Event Center: Ingesting the Church's Existing Data (Don't Start From Scratch)

**Date:** 2026-06-08 (Mon)
**Author:** Claude (research-review + architecture spec on Darrell's commission, per `feedback-research-first`)
**Triggered by:** Darrell — *"Can the conference module and other systems pull in the current conference data the church is collectively gathering from each participant and each speaker, also the weekly schedule and the annual results, and build so we don't need to start from scratch — also the event center schedule and open times, all processed by the PoeTech App."*
**Status:** Research-review + design doc. **No code, no workflow changes, nothing applied to the NAS or Supabase.** Decision support + target architecture only.
**Output gate:** binding filters — the **TLC ISO-1 firewall** (senior everywhere), **"we do not sell data"** (binding — §7 of PR #8), `feedback-autonomous-automation-three-brakes` (the four brakes), RELEASE-TIERS Tier C for anything timer-driven, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION`, `COMMUNITY-FIRST-MISSION`, `WORKFLOW-MODULE-LIBRARY`, `INSTITUTIONAL-MEMORY-EVENTS`, `AI-FOUNDATION-INTERNAL-OPERATIONS` (systems use APIs, not browsers).
**Fits inside (does not contradict):** `docs/99-session-notes/2026-06-08-research-review-church-network-llm-eval-and-app-review.md` (PR #8 — the canonical three-entity system). This module is the **Church entity (ISO-2)** ingestion concretized: it is the data substrate under loops **F/G/H/I/J** and the first real instance of the **WORKFLOW-MODULE-LIBRARY** Church/Event module.
**Builds on (verified in-repo, not from scratch):** `infra/supabase/schema-v2.8-ops.sql` (the `events` table), `infra/supabase/schema-v2.7-church.sql` (parishioners, service_offerings, ministries, ministry_signups), `infra/supabase/schema-v2.1-infra.sql` + `schema-v2.9-portal-rls.sql` (external_users, interactions, invite tokens), `infra/ai-orchestrator/` (the Cage), `service-calendar.json` + loop **(G)**, `docs/00-foundations/_root/WORKFLOW-MODULE-LIBRARY.md`, `docs/00-foundations/_root/INSTITUTIONAL-MEMORY-EVENTS.md`. **Part II additionally builds on:** `docs/00-foundations/_root/CHURCH-TAB-DIRECTORY.md` (the front-door tab + Mars Hill progressive disclosure), `docs/00-foundations/IN-APP-MESSAGING-LAYER-1-DESIGN.md` (**the in-app group chat already designed** — schema-v2.10-messaging, ntfy push, Matrix Layer-4), `docs/00-foundations/_root/IDENTITY-ROLES-AUDIT.md` (5 roles + scope modifiers + the Phase 3→4 SSO path), `docs/00-foundations/_root/MODULAR-EXTENSIBILITY.md` + `MULTI-INSTANCE-STRATEGY.md` (one-codebase-many-instances), PR #8 §7 (the first-party identity layer **I**).

> **Part II (§10–§15)** folds in Darrell's 2026-06-08 follow-up directives: the **two-surface model** (front-door tab + exclusive gated deeper app) generalized to **all entities**; **ministry units + unit leadership + in-app group chat with no phone number**; and **domain-based multi-entity identity** (church staff on `@thechurchofthelivinggod.com`, etc.). Part I (the Conference/Event ingestion) is unchanged; Part II is the surfacing/placement/identity layer on top of the same ingested data model + Cage pipelines.

---

## TL;DR (read this first)

1. **We do NOT start from scratch — ~70% of the substrate already exists.** The `events` table (with `recurrence_rule`, `lifecycle`, `links`), the church domain (`parishioners`, `service_offerings` whose `service_kind` enum **already includes `'conference'` and `'revival'`**, `ministries`, `volunteer_hours`), the **external-participant portal pattern** (`external_users` + `external_invite_tokens` + `interactions`), the Cage, and the `service-calendar.json` + loop **(G)** pipeline are all present. We **extend**, we don't rebuild. (§1)
2. **The four ingestion surfaces map cleanly onto existing patterns** (§2/§4): **participants/speakers** → extend the `external_users`/portal pattern + two new tables; **weekly schedule** → loop **(G)** already owns `service-calendar.json`, surface it in `events`; **annual results** → a computed `report_snapshots` rollup over data we already capture; **event-center availability** → a new bookings pair modeled on the proven `rentals`/`maintenance_requests` shape.
3. **DATA-SOURCE INVENTORY — REAL findings (2026-06-09, §3.0), assumptions replaced with facts:** the church's **live ops do NOT live in the connected account.** **⭐ BIGGEST update: "Church Plus" runs on the CHURCH NAS — a separate on-site device** (name "like TLC something," **UNCONFIRMED**, **not yet located**) that **CONFIRMEDLY hosts member data (system-of-record) + the monthly financial reports.** **NOTE (corrected 2026-06-09 eve): this is NOT Darrell's home `DS1621xs+` @ `192.168.1.26` — that is the separate PoeTech runner/registry substrate.** Two NASes, one sovereign mesh (§3.1.6); the **church NAS is the likely COLG sovereign-node hardware.** **Giving's location is OPEN** (Church Plus? ConvertKit/Givelify? the reports? — don't assume). Web research → likely **PowerChurch Plus** (NAS-hosted `.DBF`), vs the cloud ChurchPlus.co; **package data model UNCONFIRMED until a DSM login (Darrell's).** **This re-ranks the path: church-NAS-local / sovereign is now PRIMARY; the Google Workspace grant drops to SECONDARY** (the genuinely-Google surfaces: the **TCOTLG Form** [Forms API], **ConvertKit**, **Zoom** — `@thechurchofthelivinggod.com`, primary `info@`). **P0a = locate the church NAS + Darrell reads Church Plus via a DSM login; P0b = the now-secondary Google grant.** Production ingestion = **n8n-on-NAS, sovereign, behind the Cage.**
4. **Source-of-truth is explicit per surface (§4), and "mirror first, converge later" is the rule:** the church's *real* collection points (the **TCOTLG Form, ConvertKit, Zoom, the church Workspace**) stay the source of truth at first; the App ingests a **read-only idempotent mirror**; only after that proves clean does a **sovereign registration form / bookings surface** become the new forward source of truth. We never rip out what the church already uses mid-stream.
5. **Everything rides the Cage (§5).** Ingestion is **timer-driven**, so it is **Tier C** and needs all **four brakes** (budget + concurrency lock + kill-switch + human-presence preempt), the **allowlist**, the **append-only hash-chained ledger**, and the **health gate**. Ships **inactive → read-only with someone watching → never unattended/while traveling** (P11/P12).
6. **LLMs do the work; staff reserved for green-lights (§5/§8 of PR #8).** Extraction, normalization, dedup, conflict-flagging, draft summaries = **LLM-executed end-to-end behind the Cage**. The human gate is **only** the ISO-2 doctrinal/publish green-light and the calendar green-light — judgment, not toil.
7. **It ships as a reusable Module-Library module (§6):** "Conference & Event Center Module," **Tier 2 (community-template)**, config-driven (calendar IDs, form/sheet IDs, room list, tier caps), validation-gated before `active`, every ingest/booking/publish emitted as an **Event** (institutional memory).
8. **Timeline is first-pass + living (§7), per the PR #8 data-driven convention** — anchored 2026-06-08, re-baselined against telemetry. Phase 1 (schema + read-only mirror) ~2-3 wk after go-ahead **and** Workspace API credentials; weekly-schedule surfacing rides loop **(G)** (~2026-08–09).

**Part II — surfacing, units, messaging, identity (Darrell directive):**

9. **Two surfaces, generalized (§10):** a **public front-door tab** (lighter, already specced as the Church Tab with Mars Hill progressive disclosure) + an **exclusive, access-gated deeper app/instance** (full management/write). Presented as a **multi-entity pattern** — each business/entity (Church, TLC, PoeTech, future adopters) gets the same shape **at its own isolation tier** — **with trade-offs, Darrell's to ratify** (he explicitly left it open: *"or whatever we decide works best for all businesses"*). **TLC ISO-1 is the stress test**; the pattern's gating must keep PHI walled (§10.4).
10. **Both surfaces read the SAME ingested data model + Cage pipelines (§10).** The exclusive app just exposes **more** of it with write/management capability **behind staff green-lights**. Not two data stores — one substrate, two views.
11. **Ministry units + unit leadership (§11/§12):** model **units within ministries** (ministry → unit → members + unit-leader role) on top of the existing `ministries`/`ministry_signups` tables and the **IDENTITY-ROLES-AUDIT scope-modifier** (a unit leader = an Editor **scoped to their unit**). Per-unit leadership tooling (roster, scheduling, comms) lives in the exclusive app.
12. **In-app group chat, NO phone number (§13) — largely already built.** `IN-APP-MESSAGING-LAYER-1-DESIGN.md` (schema-v2.10-messaging) already defines `conversations`/`messages`/group chats, **ntfy** as the self-hosted push substrate on the DS1621xs, and **Matrix (Synapse) as the Layer-4 sovereignty-max** option. A ministry-unit chat is a `conversations` row `kind='group'` linked to a unit; **identity = the app login (SSO), not a phone number**; SMS is only an opt-in Layer-2 fallback. **Recommendation: reuse the existing Layer-1 design + ntfy; do NOT bolt on a heavy third-party chat SDK; keep Matrix as the deferred Layer-4.**
13. **Domain-based multi-entity identity (§14):** the PR #8 identity layer **I** is **multi-domain** — Church staff/leaders on **`@thechurchofthelivinggod.com`** (e.g. `bg@thechurchofthelivinggod.com`, Bishop Gwin), TLC on `@tlctherapysolutions.com`, PoeTech on `@poetech.us`. **Staff/unit-leader SSO + group-chat identity key off these domain emails** — that is the no-phone anchor. **Open current-state question:** is `thechurchofthelivinggod.com` mail on Google Workspace today or elsewhere (the site is Turbify-hosted)? **Recommend: federate/SSO-bridge during MVP, sovereign multi-domain mail on the NAS as the long-arc** — don't block MVP on full sovereign mail (MVP-pragmatism). Church identities = ISO-2; **TLC-domain identities = ISO-1, PHI-walled.**
14. **All of Part II is reusable per the Module Library** — "ministry-units + unit-chat" and "front-door-tab + gated-deeper-app" are **configurable modules / a per-entity instance shape**, not a COLG one-off; a partner church (or any business) drops into the same shape as its own sovereign node/instance.
15. **Maximum-inclusion comms — no single credential required (§13.5 / §14.5):** the layer must reach a member whether they have **email-only, phone-only, both, or neither** (app-only handle). **Identity is multi-anchor** (email OR phone OR app-handle, any one suffices); **delivery is OTT** — in-app + Web Push + ntfy **over data, no carrier needed** ("text over the internet"). An **optional SMS bridge** is a deferred, opt-in, **budget-capped, explicitly non-sovereign** edge to pull in phone-only people not yet in the app (the one unavoidable external touchpoint — flagged, costed, **TLC-excluded**). **PWA-first** so it runs on any browser + internet.
16. **Tiered identity + progressive-trust (§14.1b/§14.1c):** **staff/leaders** authenticate on the **sovereign church domain** (authority-bearing); **members** use low-friction **consumer-OIDC (Google/Apple/Microsoft)** + phone + app-handle — **federated INTO our sovereign store, which is the system of record** (the provider button is an entry method, never lock-in). **Access is EASY for a known identity** — friction is reserved for unknown identities and sensitive actions; **2+ corroborating identity sources that agree = "verified/known" = the frictionless tier** ("we know who it is"). Cross-referencing is consented, Cage-logged, never sold, non-creepy, and **absolutely excludes TLC clinical identities.**
17. **SSO as consented data-enrichment, governed not bolted-on (§14.6):** SSO login doubles as a first-party data + profile-enrichment vector (capture at login, bootstrap/cross-reference at onboarding, keep current) feeding **D + H** of PR #8 — **under five binding guardrails: consent + transparency (opt-out-able); internal-only, NEVER sold; TLC ISO-1 = NO enrichment ever (PHI-walled); values-aligned + non-creepy; Cage-gated + audit-logged.**
18. **⭐ Poe Properties = a FOURTH entity + the fastest live-user MVP (§16):** Darrell wants **tenants using the App ASAP** for **communication + service requests (upload + text + explain) + work orders + dispatch tickets.** This is **build-on, not from scratch** — the repo already has **`rentals` + `maintenance_requests`** (`schema-v2.2-rentals.sql:283`), whose lifecycle (`submitted_via='renter-portal'`, category, urgency, `assigned_to_user_id`+`scheduled_at`=dispatch, `new→…→resolved`) **IS** the work-order/ticket engine. Tenant identity = the member consumer-OIDC/multi-anchor model; tenants are a **known, bounded set**. **Tier = ISO-3-class** (tenant PII consent-gated, never sold, **NOT PHI; distinct from TLC ISO-1**). **Near-term quick win, independent of the church grant.**
19. **Staff-email reality check — TARGET vs BOOTSTRAP (§14.1a):** domain-anchored sovereign SSO is the **target**, not a precondition — staff/leaders who *"may not have or use the church emails currently"* **start NOW on a verified consumer email** (role granted once §14.1c's 2+ cross-ref clears), with **domain accounts provisioned and identity rebased to the domain anchor over time.** Interim personal-email grants are **tracked + revocable + migration-flagged**; authority ultimately binds to the domain identity. **Don't block access on domain-mail adoption that hasn't happened.**

---

## 1. Inventory — what already exists (so we build on it)

> Verified against the working tree on 2026-06-08. Paths are real.

### 1.1 Strong reusable substrate (BUILT)

| Asset | Path | What it gives the Conference/Event module |
|---|---|---|
| **`events` table** | `infra/supabase/schema-v2.8-ops.sql:215` | The atom of a calendar entry / session. Has `instance_id`, `lifecycle` (jsonb phase+log), `links` (jsonb — cross-entity references), `title`, `event_date`, `event_time`, `category`, `description`, `all_day`, **`recurrence_rule`** (RRule — recurring services), `privileged`. RLS via `user_in_instance(instance_id)`. **A conference *session* IS an `events` row; the conference is its parent.** |
| **`service_offerings`** | `infra/supabase/schema-v2.7-church.sql` | `service_kind` enum **already includes `'conference'`, `'revival'`, `'special-event'`** — annual-results giving rollups for conferences are already capturable. |
| **`parishioners`** | `schema-v2.7-church.sql` | `membership_status`, `household_id` (family graph), **`external_user_id`** (portal link), `display_name`, contact fields, `care_notes`. The "person" a participant resolves to when they are a member. |
| **`ministries` / `ministry_signups` / `volunteer_hours`** | `schema-v2.7-church.sql` | Speakers and conference volunteers map onto ministry roles; volunteer hours roll into annual results. |
| **External-participant portal** | `schema-v2.1-infra.sql` (`external_users`, `interactions`), `schema-v2.9-portal-rls.sql`, `external_invite_tokens` | **This is the registration/RSVP engine, already proven.** `external_users.type` includes `parishioner/volunteer/donor/customer/vendor`; `invite_status` lifecycle; `external_invite_tokens` (hashed, 15-min expiry, device-bound); `interactions` (bidirectional message/status/file/request log, `visible_to_external`). A conference *participant who is not yet a member* is an `external_user`. |
| **`rentals` / `maintenance_requests`** | `schema-v2.2-rentals.sql` | The **booking + request-lifecycle template** for Event-Center room bookings (category enum, urgency, status lifecycle, assignment, incident link). |
| **`report_runs` / `report_snapshots`** | `schema-v2.8-ops.sql` | The **annual-results** materialization + audit/replay layer (don't invent a new one). |
| **The Cage** | `infra/ai-orchestrator/` | Allowlist-only actions (`scripts/actions/` + `ACTIONS_ALLOWLIST`), **append-only hash-chained `001-audit-ledger.sql`**, VLAN guard, **120 s health gate + auto-rollback**, schedule boundary. The safety envelope for all ingestion. |
| **`service-calendar.json` + loop (G)** | PR #8 §4b/§6.2 | The **weekly-schedule source of truth**, maintained live from staff-green-lit decisions. The answer to the static-JPG problem. |
| **n8n on NAS + `/n8n` same-origin rewrite + `poetech-briefing` bind mount + `_reel.jsonl`** | `infra/n8n/`, `project_n8n_same_origin_rewrite`, CLAUDE.md dispatch convention | The sovereign ingestion *runner* (API-not-browser), the PWA read path, and the Events/Reel telemetry sink. |
| **COLG service times (hardcoded seed today)** | `app/src/poe-financial-mvp-v28.jsx` (`COLG_DEFAULT_CHURCH.services`) | Sun 11 AM; Wed 1 PM + 6 PM. To be **replaced** by the ingested `service-calendar.json` so there is one source of truth, not two. |

### 1.2 Spec'd, ready to land

| Asset | Path | Use |
|---|---|---|
| **INSTITUTIONAL-MEMORY-EVENTS** | `docs/00-foundations/_root/INSTITUTIONAL-MEMORY-EVENTS.md` | Event types (`decision/evaluation/church-work/milestone/...`), `evt-YYYYMMDD-HHMMSS-NNNN` ids. Every ingest/booking/publish becomes one of these — Events-as-data. |
| **WORKFLOW-MODULE-LIBRARY** | `docs/00-foundations/_root/WORKFLOW-MODULE-LIBRARY.md` | Tier 1/2/3 + module tags + validation gate. The packaging contract (§6). |
| **COLG per-unit documentation spec** | `docs/99-session-notes/2026-05-31-colg-per-unit-documentation-spec.md` | Proposed wf78/79/80 (meeting docs, historical archive ingest, recording) — adjacent ingestion patterns to reuse. |

### 1.3 Genuine gaps (what does NOT exist yet — to be built)

- **No conference/participant/speaker/session tables.** Only the generic `events` atom. (→ §2)
- **No event-center room/resource/booking tables.** Only the `rentals` template to copy. (→ §2)
- **No attendance records** (who attended which service/session). (→ §2, §4d)
- **No annual-results rollup** (computed; data feeding it partly exists via `service_offerings`/`volunteer_hours`). (→ §4c)
- **No ingestion-source registry / sync-watermark / idempotency ledger.** (→ §2, §3)
- **No live calendar sync** — the schedule lives in **ConvertKit + Zoom** (2026-06-09 inventory), folded into `service-calendar.json` by loop (G), not yet built. (→ §4b)
- **No external (non-Google) ingestion adapters** — **ConvertKit + Zoom** are confirmed real sources and need adapters. (→ §3.1.5)
- **GRANT** to the church's real ops data — the `@thechurchofthelivinggod.com` Workspace + Forms API + ConvertKit/Zoom keys are **not yet granted** (the connected account is Darrell's personal/family, not church ops). (→ §3.0, §9)

---

## 2. Target data model — Conference + Event Center

Design principles, all grounded in existing repo conventions:
- **The `events` table is the atom.** A *session* is an `events` row. A *conference* is a parent container that owns many sessions. We do **not** fork a parallel calendar.
- **Every new table carries `instance_id` + RLS `user_in_instance(instance_id)` + `lifecycle` jsonb + `links` jsonb**, matching `events`/`service_offerings`.
- **Idempotency is first-class:** every ingested row carries `source_system` + `source_record_id` + `source_hash` so re-syncs **upsert**, never duplicate.
- **PII is consent-gated and ISO-2-isolated** (§5.4); never on the TLC ISO-1/PHI path; never sold.

```
conferences ───< event_sessions (FK → events.id) >─── event_speakers
     │                   │                                   │
     │                   └───< session_speakers >────────────┘
     │
     ├───< event_participants >─── (external_users | parishioners)
     │            │
     │            └───< attendance_records (per session check-in)
     │
     └───< event_feedback  (post-event; reuses interactions/cycle_items pattern)

event_center_resources ───< event_center_bookings (conflict-checked availability)

annual_results_snapshots  (computed rollup → report_snapshots)

ingestion_sources ───< ingestion_sync_log   (watermark + idempotency + Cage audit)
```

### 2.1 New tables (column sketch — illustrative, not DDL)

| Table | Key columns | Notes / grounding |
|---|---|---|
| **`conferences`** | `id`, `instance_id`, `lifecycle`, `links`, `title`, `theme`, `start_date`, `end_date`, `status` (`planning/open/in-progress/closed/archived`), `year`, `tier_required`, `source_system`, `source_record_id`, `source_hash` | The parent of sessions. `year` powers year-over-year (§4c). `tier_required` honors subscription caps (`checkout_intents` tiers). |
| **`event_sessions`** | `id`, `conference_id` (nullable — standalone events allowed), `event_id` (**FK → `events.id`**), `room_resource_id`, `capacity`, `session_type` (`keynote/workshop/panel/worship/breakout`), `source_*` | A session reuses `events` for date/time/recurrence; this row adds conference-specific facets. |
| **`event_speakers`** | `id`, `instance_id`, `person_ref` (`parishioner_id` \| `external_user_id`), `display_name`, `bio`, `photo_uri`, `topics` (jsonb), `consent_to_publish` (bool), `source_*` | Speaker bio/photo. **`consent_to_publish` defaults false** — nothing speaker-facing publishes without the ISO-2 green-light (§5). |
| **`session_speakers`** | `session_id`, `speaker_id`, `role` (`speaker/host/moderator`) | Many-to-many. |
| **`event_participants`** | `id`, `instance_id`, `conference_id`, `person_ref` (`parishioner_id` \| `external_user_id`), `registration_status` (`registered/waitlist/confirmed/cancelled/no-show`), `consent_flags` (jsonb), `dietary/accessibility_notes`, `source_system`, `source_record_id`, `source_hash` | **Registration.** A non-member participant is created as an `external_user` (existing portal). `consent_flags` records opt-in per stream (`DATA-AS-EMPOWERMENT`). |
| **`attendance_records`** | `id`, `instance_id`, `session_id` (or `service_date`+`service_kind`), `person_ref`, `check_in_at`, `method` (`manual/qr/portal/vision`), `source_*` | Per-session/per-service attendance. `method='vision'` ties to the visitor-recognition spec under VISION-FAIRNESS-STANDARD. |
| **`event_feedback`** | `id`, `instance_id`, `conference_id`/`session_id`, `person_ref`, `rating`, `comment`, `sentiment` (LLM-derived), `disposition` (`pending/reviewed/promoted` — never "rejected") | Reuses the `cycle_items`/`interactions` disposition vocabulary (POE binding). |
| **`event_center_resources`** | `id`, `instance_id`, `name` (Sanctuary / Fellowship Hall / Classroom A), `capacity`, `features` (jsonb: A/V, kitchen, parking), `bookable` (bool), `open_hours` (jsonb default M–F 11–6 office hours), `source_*` | The rooms/spaces of the 44,000-sqft building. |
| **`event_center_bookings`** | `id`, `instance_id`, `resource_id`, `event_id`/`conference_id`, `requested_by`, `start_ts`, `end_ts`, `status` (`requested/tentative/confirmed/declined/cancelled`), `setup_buffer`, `source_*` | **Availability + open times.** Conflict check = no two `confirmed` bookings overlap on a resource. Models on `rentals`/`maintenance_requests` lifecycle. |
| **`annual_results_snapshots`** | `id`, `instance_id`, `year`, `scope` (`conference/ministry/whole-church`), `metrics` (jsonb: attendance, registrations, giving, volunteer_hours, new-members, sessions-held), `computed_at`, `report_snapshot_id` (**FK → `report_snapshots`**) | **Computed, not hand-entered.** Materialized rollup; auditable/replayable via `report_snapshots`. |
| **`ingestion_sources`** | `id`, `instance_id`, `surface` (`participants/speakers/weekly-schedule/annual-results/event-center`), `source_system` (`google_sheet/google_form/google_calendar/gmail/manual/sovereign-form`), `source_locator` (sheet/calendar id), `auth_ref`, `sync_cadence`, `enabled`, `is_source_of_truth` (bool) | The registry of every place church data lives. **`is_source_of_truth`** flips from the Google source to the sovereign surface at convergence (§4). |
| **`ingestion_sync_log`** | `id`, `source_id`, `run_started`, `run_finished`, `watermark` (modifiedTime/changeToken), `rows_seen/inserted/updated/skipped`, `conflicts` (jsonb), `ledger_event_id`, `status` | Incremental-sync state + idempotency watermark; each run also writes one **hash-chained Cage ledger** entry and one **Event** (Events-as-data). |

> **Why a parent `conferences` + `event_sessions(event_id)` rather than bloating `events`?** It keeps `events` the single calendar atom (so the GPU blackout scheduler, the PWA calendar, and conference sessions all read one table), while conference-specific facets (capacity, speaker links, registration) live in dedicated tables. Reversible, additive, no migration of existing `events` rows.

---

## 3. Ingestion architecture per source

### 3.0 The data-source inventory — REAL findings (Workspace inventory returned 2026-06-09; assumptions replaced with facts)

> **Update 2026-06-09:** a Google Workspace inventory of the connected account **was** run. The earlier "no connector this session" caveat is superseded by **actual findings.** The headline correction: **the church's live operational data does NOT live in the connected account.** The connected account is Darrell's personal/family Workspace; **church operations run on a SEPARATE Workspace domain + external SaaS.** What was inspectable was inspected; what is gated is named precisely below.
>
> *Typography note (surface-the-conflict per CLAUDE.md):* literal account/domain identifiers below are rendered **all-lowercase** (`thechurchofthelivinggod.com`) because that is the real DNS/email identifier (DNS is canonically lowercase); prose **name** references to the church keep the typographic-theology capitalization. The literal string must match reality to function.

**Where church data ACTUALLY lives (the operational map):**

| System | Role | Accounts / identifiers | Connector status |
|---|---|---|---|
| **⭐ "Church Plus" on the CHURCH NAS** (separate on-site device; name ~"TLC…" UNCONFIRMED; **NOT yet located** — NOT the home `192.168.1.26` box) | **PRIMARY AUTHORITATIVE SOURCE (sovereign path).** **CONFIRMED:** member data (system-of-record) + monthly financial reports on the church NAS. **Giving = OPEN.** Likely the COLG sovereign-node hardware (§3.1.6) | Read NAS-local via DSM/Synology APIs / `.DBF`/DB / file access (from a church-side runner or a site-to-site link); hostname/IP + package data model **UNCONFIRMED pending Darrell (locate + DSM login)** | **Sovereign / LAN-local — PRIMARY path; locate + DSM login pending** |
| **Workspace domain `@thechurchofthelivinggod.com`** (separate from the connected account) | Church ops comms, Drive/Sheets/Forms, rosters | **`info@` — the PRIMARY/ADMIN account** (the grant target + the church-domain identity admin anchor for item I); `eldressredding@`, `bg@` (Bishop Gwin) — staff identities on the same domain | **NOT connected — grant needed (provisioned on/by `info@`)** |
| **ConvertKit** | Member email + newsletters + weekly schedule comms + engagement (incl. Bible Trivia points) | **confirmed sender = `info@thechurchofthelivinggod.com`** (the primary account) | **Not connected — external adapter needed** |
| **Zoom** | Monthly National Assembly (2nd Monday 7:30pm CT, Senior Bishop Lloyd E. Gwin); attendance | church Zoom | **Not connected — external adapter needed** |
| **`thelovecornermedia@gmail.com`** | Media account | — | not inventoried for ops data |
| Connected account (Darrell personal/family) | Where the **TCOTLG Registration Form** + the **Gwin Home-going Responses sheet** happen to live | Darrell-owned | **Inspectable — the two seedable assets (below)** |

**Per-surface findings (fact, not assumption):**

1. **Conference data — PARTIAL, FOUND (seedable now).** The real instrument is the **"TCOTLG – Conference Registration" Google Form** (`id 1a3-7OgQcRPN8MkdVNI1dr-5_GoFW22uObJ4a3PwufXQ`, owned by Darrell, last modified 2024-06-18). **But it has no linked Responses sheet** — responses sit *inside the Form*, so the **field schema requires the Google Forms API** (or the service-account grant) to extract. A duplicate `"Copy of…"` form also exists (dedupe at ingest). **Best readable schema seed available right now:** the **"Evangelist Gwin Home-going (Responses)" Sheet** (`id 1qkbpDj0hrFgcKHn6LgMdsiVx2i5PiwBmqQL8-T_wGJs`) — a **real, working Form→Sheet RSVP row shape** to model conference-participant ingestion on. **Speaker/participant rosters + bios are NOT here** → church Workspace, grant needed.
2. **Weekly schedule — EXTERNAL, not in any Google Calendar.** Confirmed cadence: **Sun Worship 11am; Wed Bible Study + Bible Trivia; monthly Zoom National Assembly 2nd Monday 7:30pm CT** (Senior Bishop Lloyd E. Gwin). **Source of truth = ConvertKit (comms) + Zoom (the assembly), NOT a Google calendar/sheet.** → treat **ConvertKit + Zoom as external ingestion sources** (and loop (G)'s `service-calendar.json` reconciles them — §4b).
3. **Annual results / giving — NOT in the connected account; LIKELY in Church Plus on the church NAS.** Authoritative giving + attendance + **monthly financial reports** (2026-06-09: the church produces **monthly financial reports**, likely in Church Plus / on the NAS — §4c) are the church's accounting system-of-record. **If that is Church Plus (PowerChurch Plus) on the NAS, this is reachable sovereign/LAN-local (§3.1.6), not gated on Google.** Annual results are **computed/rolled up from the monthly reports** — never hand-keyed.
4. **Event center — NOT FOUND in the connected account.** Building is **312 E. Bradley Ave, Champaign IL, ~44,000 sqft.** **No booking/availability calendar or sheet** in the connected account (only a single vendor invoice `#6545` to `bg@`). Booking/availability → **possibly Church Plus event-scheduling on the NAS (§3.1.6, UNCONFIRMED), else the church Workspace (grant) or the sovereign `event_center_bookings` table (§4d).**
5. **No church-owned Google Calendars are connected** — only personal/family/school calendars. Reconfirms the weekly schedule is *not* a Google-calendar surface here.
6. **⭐ "Church Plus" on the CHURCH NAS — the authoritative member system-of-record (2026-06-09).** Darrell: *"we have Church Plus on the NAS at church."* **The church NAS is a SEPARATE on-site device** — name "like TLC something" (Darrell's vague recollection, **UNCONFIRMED**), **not yet located** (hostname/IP/model/DSM unknown; it's on the *church* network). **CORRECTION (2026-06-09 eve): it is NOT Darrell's home NAS** (`PoeTech · DS1621xs+ · 192.168.1.26` — that is the separate PoeTech runner/registry substrate; §3.1.6). The church NAS is the **likely COLG sovereign-node hardware.** **Confirmed data locations (Darrell):** (a) **Church Plus on the church NAS hosts MEMBER data** — rosters/profiles, the confirmed member system-of-record; (b) **the monthly financial reports ARE on the church NAS** — confirmed (the §4c source); (c) **GIVING data location is UNKNOWN** — could be Church Plus, ConvertKit/Givelify, or only the financial reports → **leave giving's source an OPEN question, do not assume.** Web research (sources below): a NAS-hosted ChMS named "Church Plus" most likely = **PowerChurch Plus** (Windows-desktop app, data on the NAS share as **Visual FoxPro `.DBF`**, read NAS-local via ODBC/DBF parser/export; no public API), as distinct from the cloud **ChurchPlus.co** — **exact package + data model UNCONFIRMED pending a DSM login (Darrell's, not the agent's).** **Caution:** the "TLC…"-like name must not be confused with **TLC (Christina's ISO-1 practice)** — the church NAS is a **church (ISO-2)** device; confirm the hostname. **Do not fabricate its schema — see §3.1.6.**

**Architecture implications (baked into the design) — NAS-local is now the PRIMARY path:**

> **The data-access dependency is re-ranked (2026-06-09, updated with confirmed facts).** The **church NAS** (a separate on-site device — name ~"TLC…", **not yet located**; **NOT** the home `192.168.1.26` box) **confirmedly hosts Church Plus member data + the monthly financial reports.** So **NAS-local ingestion (DSM/Synology APIs, direct DB/file access on the church NAS) is the PRIMARY recommended path; the Google Workspace grant drops to SECONDARY/supplementary** (for the genuinely-Google surfaces — the TCOTLG Form, ConvertKit, Zoom). **Giving's location stays an open question** (could be Church Plus, ConvertKit/Givelify, or the financial reports) — don't assume.

| Path | What it reaches | Sovereignty | Status |
|---|---|---|---|
| **Path A — church-NAS-local (Church Plus + financial reports), PRIMARY** | **Member rosters (confirmed)** + **monthly financial reports (confirmed)** + events/attendance — read on the **church LAN** via DSM/Synology APIs / direct `.DBF`/DB / file access on the **church NAS** (§3.1.6), reached from a church-side runner or a site-to-site link. **Giving = OPEN (maybe here, maybe ConvertKit/Givelify, maybe the reports).** | **Fully sovereign, LAN-local, no vendor cloud, no Google grant** | **Data partly confirmed; church NAS not yet located; package data-model UNCONFIRMED pending Darrell (locate + DSM login)** |
| **Path B — Google Workspace grant (SECONDARY/supplementary)** | The surfaces that really are in Google: the **TCOTLG Form** (Forms API), Drive/Sheets; + the **ConvertKit** + **Zoom** external adapters | Sovereign-runner (n8n) hitting external APIs | Grant still needed for *these* surfaces (below) |

- **Path B P0 (now SECONDARY, scoped to the Google-resident surfaces) = a read-only service-account / domain-wide-delegation grant on `thechurchofthelivinggod.com` — targeted at the PRIMARY/ADMIN account `info@thechurchofthelivinggod.com` — + the Google Forms API scope.** `info@` is the church's main Workspace account (and the confirmed ConvertKit sender). **Production ingestion = n8n-on-NAS hitting the Workspace + Forms APIs directly** (sovereign, API-not-browser, per `AI-FOUNDATION-INTERNAL-OPERATIONS`) — credentials in the n8n credential store, read-only scopes, behind the Cage.
- **Recommendation:** **prefer Path A (church-NAS-local) as the member + financial system-of-record** — it is confirmed to hold member data + the monthly reports, it is fully sovereign, and it **strengthens "don't start from scratch"** (the church already has a populated ChMS). Use Path B only for the genuinely-Google surfaces (the Form, ConvertKit, Zoom). **Locate the church NAS** (on the church network — it is a separate box from the home `192.168.1.26` substrate), **resolve giving's location**, and read the Church Plus **package + data model** via a DSM login (Darrell's), then design the §3.1.6 adapter; **schema stays UNCONFIRMED until then.**
- **Non-Google external adapters are required (new) — see §3.1.5:** **ConvertKit** (members + schedule comms + engagement/Bible-Trivia points) and **Zoom** (assembly attendance). **Note: members already living in ConvertKit is a real, existing first-party data source for item I** (PR #8 §7) — consented, internal-only, never sold.
- **Seed the schema NOW from the two readable assets** (the TCOTLG form field shape via the Forms API + the Gwin Home-going Responses sheet row shape) — this is the concrete proof of "don't start from scratch": real RSVP/registration shapes already exist to model `event_participants` on.

**Required scopes / grants (precise, replacing the old assumption list):**
1. **Service account on `thechurchofthelivinggod.com`, delegated through the primary/admin account `info@thechurchofthelivinggod.com`**, read-only: `drive.readonly`, `spreadsheets.readonly`, **`forms.body.readonly` + `forms.responses.readonly`** (the Forms API — needed because conference responses are *inside* the Form, not a Sheet), and `calendar.readonly` (in case any room/resource calendars exist there).
2. **ConvertKit API key** (read-only) — subscribers, sequences/broadcasts, tags (engagement). External adapter.
3. **Zoom API / Server-to-Server OAuth** (read-only) — meeting + attendance reports. External adapter.
4. **Gmail** — still out of v1 (noise); revisit only if confirmations arrive only as mail.
5. **⭐ Church NAS / Church Plus access (NEW, may PRECEDE all the above)** — **LAN read access to the Church Plus data on the church NAS** (a read-only file-share account to the `.DBF` data folder, or read-only ODBC, or scheduled built-in exports). **No Google grant, no vendor cloud.** Confirm product/version + data + reach with Darrell first (§3.1.6).

Until the §1 grant lands, Phase 1 still proceeds on **(a) the two readable assets above for the schema seed** + **(b) a manual CSV/Sheet export drop** into the `poetech-briefing` bind mount + **(c) if Church Plus is confirmed, a NAS-local read (§3.1.6) that may supersede the grant for rosters/giving/financials/events** — proving the pipeline before any external API access exists.

### 3.1 The ingestion runner + the shape of every sync

**Runner:** n8n on the NAS (sovereign), reachable from the PWA only via the `/n8n` same-origin rewrite. **Pattern per source** (one Tier-2 workflow, parameterized by `ingestion_sources` row):

```
cron/manual trigger
  → [BRAKE: concurrency lock]  prior run still active? → SKIP
  → [BRAKE: budget]            token/wall-clock ceiling set for the run
  → [Cage allowlist]           only the read-only fetch action for this source may run
  → fetch incremental delta    (Sheets values.get since watermark | Calendar events.list updatedMin
                                | Drive changes API | file drop in bind mount)
  → LLM normalize + resolve     map columns→schema; dedupe; resolve person→parishioner/external_user;
                                flag conflicts; draft (NO publish)
  → idempotent UPSERT           key = (source_system, source_record_id); update only if source_hash changed
  → write Event + ledger entry  hash-chained Cage ledger row + Events-as-data row
  → [health gate 120s]          unhealthy → auto-rollback
  → [BRAKE: kill-switch]        overrun/missed-heartbeat → auto-pause (no auto-continue)
```

**Idempotency:** stable source IDs (Google rowId/eventId/fileId, or a content hash for CSV rows) → `UPSERT ... WHERE source_hash <> excluded.source_hash`. Re-running a sync is a no-op when nothing changed.

**Incremental sync:** persist a per-source **watermark** in `ingestion_sync_log` — Sheets: last `modifiedTime`; Calendar: `syncToken`/`updatedMin`; Drive: `changes` page token. Never full-scan after the first backfill.

**Cadence (first-pass, living):** participants/speakers **every 6 h** during an open conference, **daily** otherwise; weekly schedule **daily** (and on-demand when loop (G) green-lights a change); event-center bookings **hourly** during booking-heavy windows, daily otherwise; annual results **nightly** recompute. All cadences are **timer-driven ⇒ Tier C ⇒ all four brakes**, and all yield to the §4 GPU/human/Sabbath ladder from PR #8.

### 3.1.5 External (non-Google) ingestion adapters — ConvertKit + Zoom + the Forms API (new, per the 2026-06-09 inventory)

The inventory (§3.0) proved that **not all church data is in Google** — three real sources sit outside Drive/Sheets/Calendar and each needs its own **adapter** (per `MODULAR-EXTENSIBILITY` "a new external data source is wrapped in an adapter that owns parse + ingest + provenance"). Each is an `ingestion_sources` row with its own `source_system`, watermark, and Cage-allowlisted read-only fetch action; each upserts into the **same** target model (§2).

| Adapter | `source_system` | Pulls | Feeds | Idempotency key | Notes |
|---|---|---|---|---|---|
| **Google Forms API** | `google_form` | The TCOTLG Registration Form's **field schema + responses** (responses are *inside* the Form — no linked Sheet) | `event_participants` (+ conference) | Form `responseId` | **Requires `forms.responses.readonly`** — the reason a plain Sheets scope is insufficient. Dedupe the `"Copy of…"` duplicate form. |
| **ConvertKit** | `convertkit` | **Subscribers (members)**, broadcasts/sequences (weekly-schedule comms), tags + engagement (**Bible-Trivia points**) | `parishioners`/`external_users` (member roster), `events` (schedule via (G)), **item I first-party signal** | subscriber `id` + broadcast `id` | **The member list already in ConvertKit is an existing, consented first-party data source** (PR #8 §7) — internal-only, never sold. Engagement (trivia points, opens) is QoL/discipleship signal for D + H, under the §14.6 guardrails. |
| **Zoom** | `zoom` | **National Assembly** meetings + **attendance/participant reports** (2nd Mon 7:30pm CT) | `events` (the assembly), `attendance_records` | meeting `uuid` + participant `user_id`/email | Server-to-Server OAuth, read-only. Attendance feeds annual results (§4c). |

- **Reconciliation with loop (G):** ConvertKit + Zoom are the **upstream** weekly-schedule + assembly truth; **loop (G) folds them into `service-calendar.json`** (the one calendar the PWA + GPU scheduler read — §4b). No second calendar mechanism.
- **Same Cage discipline:** read-only, allowlisted fetch action per adapter, hash-chained ledger row per run, four brakes, ships inactive. **TLC firewall unaffected** — these are church (ISO-2) sources; none touch TLC/PHI.
- **Sovereignty screen:** ConvertKit + Zoom are **external SaaS the church already uses** — we **read** them (API-not-browser) rather than rip them out mid-stream (mirror-first, §4); the **converge-later** path moves member comms toward the sovereign email/identity layer (I) over time, but **does not block** on it.

### 3.1.6 ⭐ Church Plus on the church NAS — the (likely) authoritative system-of-record + on-site sovereign node (NEW, 2026-06-09; UNCONFIRMED)

Darrell: *"we have Church Plus on the NAS at church."* This is potentially the **single most important source in this whole inventory** — the church's own ChMS, on the church's own hardware. No schema is fabricated; the **package data model stays UNCONFIRMED until someone reads it via a DSM login (Darrell's, not the agent's).**

**⚠️ CORRECTION (Darrell, 2026-06-09 eve) — there are TWO separate NASes; do NOT conflate them.** An earlier draft assumed the NAS found by the Synology Web-Assistant scan was the church NAS. **It is not.** That scan found Darrell's **HOME** NAS (it was on his home subnet). The church NAS is a **different, on-site device.**

| | **Darrell's HOME / PoeTech NAS** (the runner/substrate) | **The CHURCH NAS** (the data host) |
|---|---|---|
| **Identity** | **`PoeTech` · Synology `DS1621xs+` · `192.168.1.26` · DSM `7.3.2-86009`** (subnet `192.168.1.0/24`); located via Web Assistant | **Separate device, physically at the church.** Name = Darrell's vague recollection, **"like TLC something" — UNCONFIRMED**; model/IP/DSM **UNKNOWN, not yet located** (it's on the *church* network, not the home subnet) |
| **Role** | The **PoeTech registry / sovereign substrate + n8n runner** (Postgres+pgvector, the Cage, batch inference; the `192.168.1.26` already in CLAUDE.md / dispatch-status). **NOT the church data host.** | **Hosts Church Plus (member data) + the monthly financial reports** — the church-entity authoritative source (§3.0 finding #6) |
| **Relation to PR #8** | The existing PoeTech sovereign substrate | **Likely the COLG sovereign node** (on-site church hardware) — see below |

- **Naming caution:** the church NAS name "like TLC something" is an **unconfirmed recollection.** Do **not** confuse it with **TLC (Christina's therapy practice, ISO-1)** — the church NAS is a **church (ISO-2)** device; any name resemblance is coincidental and **must not** pull church data onto the TLC PHI firewall or vice-versa. **Confirm the actual hostname.**
- **Architecture nuance this forces:** the data (Church Plus + financial reports) lives on the **church NAS**, while the **n8n runner / registry lives on the home NAS (`192.168.1.26`).** So NAS-local ingestion is **not same-box** — it is either (a) the home runner reaching the church NAS over a **site-to-site link** (Tailscale/VPN), or (b) **a runner node at the church** reading the church NAS locally (the more sovereign option; aligns with the COLG node). **Both stay LAN/sovereign — no vendor cloud — but the cross-site reach must be designed.**
- **Relation to the PR #8 COLG sovereign node:** the **church NAS is the likely COLG-node hardware** (church-entity data on church hardware — `AI-FOUNDATION-INTERNAL-OPERATIONS` + sovereignty). Locating it (its IP/model on the church network) + reading Church Plus is the concrete next step; it is plausibly the network where the **`infra/ai-orchestrator/` actions still stubbed "pending real UniFi/Netgate/VLAN values"** resolve. **The home NAS is a separate box and is NOT the COLG node.**

**Confirmed data locations on the CHURCH NAS (Darrell, 2026-06-09):**
- ✅ **Member data — CONFIRMED in Church Plus on the church NAS** (member rosters/profiles; the member **system-of-record**).
- ✅ **Monthly financial reports — CONFIRMED on the church NAS** (the §4c source for annual results / financial reporting).
- ❓ **Giving data — LOCATION UNKNOWN.** Darrell does not know whether giving is stored in Church Plus, in **ConvertKit / Givelify**, or only inside the financial reports. **Open question — do NOT assume; resolve before wiring giving ingestion.**
- ❓ **The church NAS itself is NOT yet located** (hostname/IP/model/DSM unknown) — needs an on-site/church-network check (Darrell).

**What the web research found (sources in §Sources):**
- The "NAS at the church" detail most likely matches **PowerChurch Plus** — a **Windows-desktop ChMS whose shared data files are hosted on a NAS share** (PowerChurch KB 487). Data is **Visual FoxPro `.DBF` table files**; readable via the **FoxPro ODBC driver** or a **DBF parser** (reads/appends work; in-place ODBC UPDATE/DELETE is unreliable — irrelevant, we only read). Built-in per-module **Export** exists (Access/CSV), though **giving exports are reportedly format-limited.** **No public REST API** is documented for the desktop product.
- A **separate cloud SaaS, ChurchPlus.co**, also exists (vendor cloud, **not** NAS-hostable) — a different product. **If the church uses that instead, ingestion would be a vendor API/export, not NAS-local.**
- **CONFIRMED capabilities (PowerChurch Plus):** membership/contacts, **contributions/giving, accounting + financial reports**, event scheduling, attendance, communications. **UNCERTAIN:** dedicated **conference *registration*** (vs event scheduling); completeness of giving CSV export.

**Ingestion path if confirmed as a NAS-hosted desktop ChMS (Path A, §3.0):**
- **Read-only, LAN-local, sovereign:** a **read-only file-share account** to the `.DBF` data folder on the NAS → **DBF parser** (or **FoxPro ODBC**), OR **scheduled built-in exports** dropped to a NAS folder the n8n runner reads. **No vendor cloud, no Google grant, no internet egress** — the most sovereign path in the doc.
- Wrapped as an **`ingestion_sources` adapter** (`source_system='church_plus'`) like any other (§3.1.5): idempotent upsert keyed by the ChMS record id, watermark on a modified-timestamp/export-date, Cage-allowlisted read-only action (`fetch_church_plus.sh`) **against the church NAS** (reached either from a runner node at the church or via a site-to-site link from the home runner — above), hash-chained ledger row per run, four brakes, ships inactive. Feeds `parishioners`/`external_users` (**member rosters — confirmed**), `service_offerings`/annual results (**monthly financial reports — confirmed**, §4c; **giving = open**), `events`, `attendance_records`.
- **Sensitivity:** church financials = **ISO-2, staff/leader-gated, never public, NEVER in public seed data** (§4c). TLC firewall irrelevant (church entity, no PHI).

**Relation to the PR #8 COLG sovereign-node architecture:** the **church NAS is on-site church hardware and is the likely COLG-node device** (NOT the home `192.168.1.26` box — that's the separate PoeTech runner/substrate). It is **not yet located** on the church network. Reaching it keeps church-entity data **on church hardware** (`AI-FOUNDATION-INTERNAL-OPERATIONS` + sovereignty) and is plausibly the same network where the **`infra/ai-orchestrator/` actions still stubbed "pending real UniFi/Netgate/VLAN values"** resolve. The home NAS is the runner; the church NAS is the data host + the COLG node — **two boxes, one sovereign mesh.**

**STILL UNCONFIRMED — what only a DSM login can answer (Darrell does the login; the agent will NOT):**
1. **The Church Plus package + version** (PowerChurch Plus desktop w/ `.DBF` on the share vs the cloud ChurchPlus.co vs another product) and **its actual data model / DB / file layout.**
2. **Where giving is stored** (Church Plus? ConvertKit/Givelify? only the financial reports?).
3. **The exact reach** (DSM API? a read-only file-share path to the data folder + credentials? ODBC? scheduled exports?).

> The NAS is located and the **member + financial-report locations are confirmed**, so Church Plus is now the **PRIMARY authoritative source on the sovereign path** — it **supersedes the Google grant** for member rosters + financials. The remaining gate is reading the **package data model** via a DSM login; **schema stays UNCONFIRMED until then** and no schema is fabricated.

### 3.2 The Cage, concretely (this is Tier C, never Tier A)

- **Allowlist:** add read-only fetch actions (`fetch_google_sheet.sh`, `fetch_google_form.sh` (Forms API), `fetch_google_calendar.sh`, **`fetch_convertkit.sh`**, **`fetch_zoom_attendance.sh`**, **`fetch_church_plus.sh`** (NAS-local DBF/ODBC/export read — §3.1.6), `ingest_bind_mount_csv.sh`) to `scripts/actions/` + `ACTIONS_ALLOWLIST`. **No write-back to any external source** in v1.
- **Audit ledger:** one hash-chained `ai_audit_ledger` row per sync run (source, watermark, counts, conflicts).
- **Health gate:** 120 s Uptime-Kuma check; failed ingest rolls back the batch.
- **Four brakes:** budget (per-run ceiling), concurrency lock (single-instance skip), kill-switch (dead-man's-switch auto-pause), human-presence preempt (a human at the keyboard reclaims the GPU). **Ships `inactive` → read-only with someone watching → never unattended or while Darrell travels** (P10/P11/P12; the 2026-06-06 runaway is the reason).

---

## 4. How each surface flows in and gets surfaced in the App

### 4a. Participants + speakers (the "collectively gathered" conference data)
- **Source of truth (now) — confirmed by the 2026-06-09 inventory (§3.0):** the **"TCOTLG – Conference Registration" Google Form** (responses *inside* the Form → **Forms API**, not a Sheet), plus the church Workspace + **ConvertKit** member list for roster reconciliation. **Speaker bios/rosters are not yet located → church Workspace, grant needed.** **Mirror, don't replace.** **Schema seed available now** from the TCOTLG form fields + the **Gwin Home-going Responses sheet** row shape.
- **Flow:** Form-response/Sheet/ConvertKit delta → LLM normalize (map fields, split name/email/phone, classify role) → **resolve identity**: match to a `parishioner` (by email/phone/household, incl. the ConvertKit subscriber list) or create an `external_user` (existing portal) → upsert `event_participants` / `event_speakers` (+ `session_speakers`). The `"Copy of…"` duplicate form is **deduped at ingest.** Conflicts (duplicate person, ambiguous match) are **flagged, not auto-merged** — staged for a human.
- **Consent + PII (§5.4):** `consent_flags` captured per participant; speaker `consent_to_publish` defaults **false**. PII isolated to ISO-2; never on the TLC path; never sold.
- **Surfaced in the App:** a Conference view (roster, session sign-ups, speaker cards). Speaker cards and any public roster publish **only after the ISO-2 green-light**.
- **Converge later:** once the mirror is clean, stand up a **sovereign registration form** (own IDP/identity layer (I)); flip `ingestion_sources.is_source_of_truth` to the sovereign surface; the Google Sheet becomes a legacy read.

### 4b. Weekly schedule (services + events)
- **Source of truth (REDESIGNED — see §17):** **a dead-simple staff-facing calendar in the exclusive church app is the single source of truth.** Staff add/edit events through a friendly form (or approve LLM-extracted events from meeting notes — item G); the **system auto-generates everything downstream** — the public Church-tab calendar, `service-calendar.json` (the GPU blackout scheduler), reminders, **and an iCal/ICS export the system produces** (the church never hand-edits a feed). This **supersedes** the old "ask the church to publish iCal" recommendation (§8/§17) — *no one at the church understands iCal, which is exactly why they fall back to posting calendar images.* The JPG and the hardcoded `COLG_DEFAULT_CHURCH.services` seed are **deprecated.**
- **Upstream sources — confirmed EXTERNAL (2026-06-09 inventory, §3.0):** historically the schedule has lived in **ConvertKit** (comms) + **Zoom** (the monthly National Assembly), **not** a Google Calendar. The §3.1.5 ConvertKit + Zoom adapters **seed** the new staff calendar (so staff don't re-enter what already exists), then the staff calendar (§17) becomes the forward source of truth.
- **Flow:** staff form/approval (or ConvertKit/Zoom seed) → `events` rows (recurring as `recurrence_rule` **generated from the friendly form, never hand-typed**; one-offs as dated rows) → the **same `events` table** auto-publishes to (1) the public Church-tab calendar, (2) the **GPU blackout scheduler** via `service-calendar.json`, (3) reminders/notifications (OTT, §13), (4) **a generated iCal/ICS feed** for anyone who wants one. One source, many generated artifacts — no drift, no hand-edited feed.
- **Confirmed cadence to reconcile against (2026-06-09):** **Sun Worship 11 AM; Wed Bible Study + Bible Trivia; monthly Zoom National Assembly 2nd Monday 7:30 PM CT** (Senior Bishop Lloyd E. Gwin); office hours M–F 11 AM–6 PM. Pre-loaded as the starter recurring events so the calendar is useful on day one.
- **Surfaced:** the Church tab weekly schedule reads `events`, not the hardcoded seed.

### 4c. Annual results + giving + financial reporting (year-over-year outcomes)
- **Upstream source (CONFIRMED 2026-06-09): the church's MONTHLY FINANCIAL REPORTS are stored ON THE CHURCH NAS** (the separate on-site device — NOT the home `192.168.1.26` box; §3.1.6) — confirmed by Darrell. **This fills the earlier "annual results / financials = NOT FOUND" gap and reinforces the church-NAS-local (Path A) ingestion.** **Annual results are COMPUTED / rolled up from the monthly reports — never hand-keyed.** Exact file format is **UNCONFIRMED** (a Church Plus report? a Sheet? PDFs on the share?) — **do not fabricate the schema;** read church-NAS-local via the §3.1.6 adapter once the format is known.
- **GIVING (the transaction-level data) — LOCATION OPEN, do not assume.** Distinct from the monthly *reports*: Darrell does not know whether per-gift giving lives in **Church Plus**, in **ConvertKit / Givelify**, or only inside the financial reports. **Resolve before wiring giving ingestion** (§3.1.6); the financial *reports* (confirmed on the NAS) carry the rolled-up giving totals regardless.
- **In-app source of truth:** the **transactional tables** — `service_offerings` (giving, incl. `service_kind='conference'`), `attendance_records` (new), `volunteer_hours`, `event_participants`, `ministry_signups`, `events` — populated **from the monthly reports (NAS) + Church Plus (members) + whichever source holds giving.** Annual results are **derived.**
- **Flow:** monthly-report ingest → transactional tables → nightly recompute → `annual_results_snapshots` (per `year`, per `scope`) → persisted through `report_snapshots` for audit/replay. LLM drafts a narrative summary; **the numbers are SQL, not LLM** (no fabrication of outcomes).
- **SENSITIVITY (binding):** **church financial data = ISO-2, staff/leader-gated, NEVER public, and NEVER in public seed data.** Honor the **aspirational-families seed-data rule** (`SEED-DATA-AS-ASPIRATION` + the 2026-05-28 sanitization): **real church financials must NOT leak to any public/demo surface** — only a thriving *aspirational* picture is ever shown publicly; the real numbers live only behind the staff/leader gate in the exclusive app (Surface B). Aggregate-internal, **never sold** (`DATA-AS-EMPOWERMENT`).
- **Surfaced:** a **staff/leader-gated** Annual Results / financial dashboard in Surface B (attendance trend, giving trend, monthly-report rollups, registrations, volunteer hours, new members, sessions held). **Not on the public front-door tab.**
- **Backfill:** prior monthly/annual reports the church already has ingest **once** as historical `annual_results_snapshots` rows tagged `source_system='church_plus'` / `'historical-import'`.

### 4d. Event-center schedule + open/available times
- **Source of truth (now) — NOT FOUND in the connected account (2026-06-09 inventory, §3.0):** the **312 E. Bradley Ave (~44,000 sqft)** building has **no booking/availability calendar or sheet** in the connected account (only a single vendor invoice `#6545` to `bg@`). It may live in **Church Plus event-scheduling on the NAS (§3.1.6, UNCONFIRMED)** or the church Workspace. Until confirmed, **`event_center_resources`/`bookings` start as the sovereign source of truth** (staff enter rooms + bookings directly in Surface B), and any Church-Plus / Workspace calendar found later is mirrored in. **Converge** to the sovereign `event_center_bookings` table either way.
- **Flow:** Calendar/Sheet delta → upsert `event_center_resources` (rooms) + `event_center_bookings` → **conflict check** (no overlapping `confirmed` bookings per resource) → open/available times computed as the complement of confirmed bookings within `open_hours` (default M–F 11–6, plus service windows blocked).
- **Surfaced:** an availability view ("Fellowship Hall — open Tue/Thu afternoons"), a booking-request flow (reusing the `maintenance_requests` request→approve lifecycle), and the §4b service blackout overlaid so the building's own services never double-book.
- **Cross-tie:** event-center bookings for a service feed the **same `events`/`service-calendar.json`** truth that gates the GPU — the building's schedule and the compute scheduler stay consistent.

---

## 5. Governance — the Cage, tiers, PII, autonomy

- **5.1 Tier:** Church entity = **ISO-2** (doctrine/content-sensitive). Human green-light before **any** publish of participant rosters, speaker cards, or schedule changes to a public surface.
- **5.2 TLC firewall:** this module is **Church-only**. **Zero TLC/PHI data enters any conference/event table, analytics, or LLM decision path — ever.** Senior to everything here.
- **5.3 Autonomy (J, from PR #8):** ingestion/normalization/dedup/conflict-flagging/draft-summary = **LLM-executed end-to-end behind the Cage**. Staff toil → zero. The **only** human gates are the irreducible-judgment classes: **doctrinal/content publish** and the **calendar/roster green-light**. Autonomy earned **per surface** as the Cage proves clean.
- **5.4 PII + consent + "never sold" (binding):** participant/speaker data is PII → `consent_flags` per stream, opt-in, minor protections, **deletion immediate + verifiable**, **never sold, no ad model, no engagement optimization** (`DATA-AS-EMPOWERMENT-NOT-EXTRACTION`). Isolated to the church `instance_id` under RLS. First-party data feeds **internal** decisions only (loops F/H/I), never an external buyer.
- **5.5 Three brakes / Tier C:** every ingestion workflow is timer-driven ⇒ **Tier C**, all four brakes, ships inactive, never self-activates unattended (the 2026-06-06 lesson). "NAS-only/sovereign/additive" does **not** downgrade it (P12).

---

## 6. Reusability — the Conference & Event Center Module (Module Library)

Packaged per `WORKFLOW-MODULE-LIBRARY.md`:
- **Module tag:** `community` + `spiritual` QoL sectors; sub-tags `conference`, `event-center`, `calendar`, `annual-results`.
- **Reusability tier: Tier 2 (community-template).** Any church/community configures it without code. **Config surface:** the `ingestion_sources` rows (calendar IDs, sheet/form IDs, auth ref), the `event_center_resources` room list, `open_hours`, `tier_required` caps, the per-instance green-light roster. No hardcoded COLG paths.
- **Validation gate:** does not flip to `active` until a **smoke test** proves the full path (fetch → normalize → upsert → ledger → surface) end-to-end on sample data — the wf30 silent-fail lesson.
- **Events-as-data:** module birth, each sync, each booking, each publish = an Event (`church-work`/`milestone`/`decision`) per `INSTITUTIONAL-MEMORY-EVENTS`, so the module's history is queryable and the loops in PR #8 re-baseline on it.
- **BUSINESS-PROCESS-CONNECTIONS:** every surface ships **wired on both ends** — a registration view has a real ingestion pipe behind it; an availability view has a real bookings table; nothing ships "wired on one end."
- **First reuse beyond COLG:** the next church in the network (per the COLG → other-churches generalization in `COMMUNITY-FIRST-MISSION`) gets this module on day one by filling in its own `ingestion_sources`.

---

## 7. Timeline (first-pass + living) + dependencies

> First-pass per the PR #8 §9 data-driven convention — **re-baselined against telemetry; not commitments.** Anchored 2026-06-08. Assumes go-ahead.

| Phase | Scope | Depends on | Window (first-pass) |
|---|---|---|---|
| **⭐ P0a — Locate + read Church Plus on the CHURCH NAS (PRIMARY, §3.1.6)** | The church NAS (separate on-site device, name ~"TLC…", **not yet located** — NOT the home `192.168.1.26` box) hosts member data + monthly reports (confirmed). **Darrell locates it on the church network + does a DSM login** to read the Church Plus package + data model + resolve where giving lives; then design the church-NAS-local adapter. | **Darrell: locate + DSM login** (agent will not); church-LAN/site-to-site access | **immediate — the primary path** |
| **P0b — Google grant + adapters (SECONDARY/supplementary)** | Read-only **service-account grant on `@thechurchofthelivinggod.com` via `info@` + Forms API scope**, + **ConvertKit + Zoom read-only API keys** — for the genuinely-Google surfaces (Form, ConvertKit, Zoom). | **Darrell/church-admin (`info@`) grant**; n8n creds | **~2–4 days** (gated on grant) |
| **P1 — Schema seed + read-only mirror** | **Seed the schema NOW** from the two readable assets (TCOTLG form + Gwin Home-going sheet); land the §2 tables + the §3.1.5 adapters **+ the §3.1.6 Church Plus adapter if confirmed (NAS-local)**; ingest participants/members/**giving** **read-only** behind the Cage; ship **inactive → watched**. | P0a/P0b (schema seed needs neither); the Cage brakes | **~2–3 wk** (schema seed starts immediately) |
| **P2 — Staff-friendly calendar system (§17) + weekly schedule surfacing** | Build the dead-simple staff calendar in Surface B (friendly form w/ plain-language recurrence + approve-LLM-extracted events); single source → auto-publish to public calendar + `service-calendar.json` (GPU scheduler) + reminders + **generated iCal/ICS feed**; deprecate the hardcoded seed + the image workflow. Ship the **church-facing explainer** to staff. | **loop (G)** (PR #8 ~2026-08–09); `events` table | **rides (G), ~2026-08–09** |
| **P3 — Event-center bookings + availability** | `event_center_resources`/`bookings`; conflict check; availability view; request→approve flow. | P1; resource/room list | **~2026-09** |
| **P4 — Annual results + financial reporting** | Ingest the **monthly financial reports** (Church Plus/NAS, §4c) → transactional tables → computed `annual_results_snapshots`; **staff-gated dashboard, never public/seed**; historical backfill. | Church Plus reach (P0a) or report exports; `service_offerings` | **~2026-09–10** |
| **P5 — Sovereign converge + Module packaging** | Sovereign registration form (identity layer **I**); flip source-of-truth; Tier-2 validation gate + library index entry. | identity layer (I) (PR #8 ~2026-09–11) | **~2026-10–11** |
| **P6 — Scoped autonomy per surface (J)** | Graduate stable surfaces from read-only to scoped autonomous execution behind the Cage. | clean soak per surface | **Q4 2026 → 2027, earned** |
| **PII — Front-door tab surfacing (Part II)** | Surface conference info / weekly schedule / event-center open times in the existing Church Tab (read-only, public-safe view); no new surface — extend `CHURCH-TAB-DIRECTORY.md`. | P1/P2/P3 data flowing | **rides P1–P3 (~2026-08–09)** |
| **PIII — Exclusive deeper app (gated)** | Access-gated management surface (full conference mgmt, bookings, annual-results dashboards, staff green-light queues). Gated on identity layer **I** + role model. | identity layer **I** (PR #8 ~2026-09–11); role gating | **~2026-10–11** |
| **PIV — Ministry units + unit leadership** | `ministry_units` + `ministry_unit_members` + unit-leader scope; unit-leader view in the exclusive app. | role/scope model | **~2026-09–10** |
| **PV — In-app group chat (no phone)** | Realize the already-designed Layer-1 messaging (schema-v2.10) for ministry-unit group chat; ntfy push; identity = SSO. | identity layer **I**; messaging Layer-1 (already designed, post-vacation weeks 1–4) | **~2026-09–10 (chat infra largely pre-designed)** |
| **PVI — Multi-domain identity / SSO** | Sovereign self-hosted IDP; **staff** church-domain anchor (federate-bridge MVP → sovereign mail long-arc); **member consumer-OIDC connectors (Google/Apple/Microsoft) federating INTO the sovereign store (§14.1b)**. | PR #8 layer **I**; Workspace answer | **MVP bridge ~2026-09; member consumer-OIDC in MVP; sovereign mail long-arc** |
| **PVII — Multi-anchor identity + progressive-trust (§14.1c)** | Email/consumer-OIDC OR phone OR app-handle, any one suffices; **verification tiers (1 source = basic, 2+ corroborating = verified/known → frictionless)**; cross-reference Cage-logged; **TLC excluded**. | identity layer **I**; the Cage ledger | **~2026-09–10 (rides PVI)** |
| **PVIII — OTT delivery ladder** | In-app store + PWA Web Push + ntfy over data (Tiers 1–2, sovereign); optional email digest (Tier 3). | messaging Layer-1 (designed); ntfy (running) | **~2026-09–10 (largely pre-designed)** |
| **PIX — SMS bridge (deferred edge)** | Opt-in, budget-capped outbound/inbound SMS to pull in phone-only people; prefer self-hosted GSM gateway, else low-cost API; **TLC-excluded**. | A2P/10DLC or GSM gateway; budget cap | **deferred; opt-in, post-MVP** |
| **PX — SSO data-enrichment (governed)** | Consented capture-at-login + onboarding cross-reference + periodic refresh; Cage-gated Tier-C jobs, audit-logged; feeds D + H; **TLC excluded**. | SSO live (PVI); consent UX; the Cage | **~2026-Q4 (after SSO proven; consent UX first)** |
| **⭐ PXI — Poe Properties tenant MVP (ASAP, §16)** | **Fourth entity.** Tenant communication (OTT messaging) + service requests (photo/file upload + free-text) + work orders + dispatch tickets, on the **existing `rentals`/`maintenance_requests`** schema; member consumer-OIDC identity; behind the Cage. | **existing schema (no church grant)**; messaging Layer-1; member identity (PVI/PVII) | **NEAR-TERM QUICK WIN — independent of the church grant; fastest to real live users** |
| **PXII — Staff bootstrap identity (§14.1a)** | Staff/leaders start on **verified consumer email** (role granted on 2+ cross-ref, §14.1c); provision domain accounts + **rebase to domain anchor** over time; interim grants tracked + revocable + migration-flagged. | §14.1c verification; the Cage ledger | **MVP on-ramp (does not block on domain-mail adoption); rebase ongoing** |

**Hard dependencies:** (1) **THE grant — read-only service account on `@thechurchofthelivinggod.com` + Forms API scope + ConvertKit/Zoom keys** (only Darrell/admin can give it; **one grant unblocks both Part-I ingestion and Part-II SSO** per §14.2); (2) **loop (G)** for the weekly-schedule truth (fed by the ConvertKit + Zoom adapters); (3) the **Cage** four brakes proven; (4) the **identity layer (I)** for the sovereign converge; (5) **subscription-tier caps** (`checkout_intents` tiers) for who can host what size event.

---

## 8. Recommendation + rationale (what / not-what / because)

**Recommendation: build the Conference & Event Center module as an *additive, idempotent, read-only-first mirror* of the church's existing Google data, on top of the `events` table and the external-participant portal, behind the Cage, packaged Tier-2 — and DO NOT rebuild anything that already works or invent a parallel calendar.**

1. **DO extend `events` + the portal pattern, not rebuild.** ~70% of the substrate exists (§1); a session is an `events` row, a non-member participant is an `external_user`, bookings copy the `rentals` lifecycle, annual results compute through `report_snapshots`. *Because* the fastest correct path is the one that reuses proven, RLS-protected, audited tables.
2. **DO mirror-first, converge-later.** Keep the church's **real sources — the TCOTLG Form, ConvertKit, Zoom, the church Workspace** — as the source of truth until the mirror is clean; only then flip to a sovereign surface. *Because* ripping out what 44,000-sqft, elderly-tech-novice staff already use mid-stream is exactly the failure `COMMUNITY-FIRST-MISSION` warns against.
3. **DO run ingestion as n8n-on-NAS against the Workspace + Forms + ConvertKit + Zoom APIs, not session connectors.** *Because* `AI-FOUNDATION-INTERNAL-OPERATIONS` says systems use APIs not browsers; and the 2026-06-09 inventory confirmed the real data is on a **separate church Workspace + external SaaS** (§3.0) reachable only by a granted service-account/API key, not the connected session account.
3b. **⭐ DO confirm "Church Plus" on the church NAS FIRST, and prefer the NAS-local path if it holds the data (§3.1.6).** *Because* if Church Plus (likely PowerChurch Plus) is the church's ChMS system-of-record, rosters + **giving + monthly financial reports** + events are reachable **sovereign, LAN-local, no Google grant** — the most sovereign path and the strongest "don't start from scratch." This **re-ranks the dependency**: the Google grant becomes secondary, scoped to the genuinely-Google surfaces (the Form, ConvertKit, Zoom). **One question to Darrell decides it.**
4. **DO treat every sync as Tier C with all four brakes, shipped inactive.** *Because* it is timer-driven; the 2026-06-06 runaway is the binding precedent (P10/P11/P12). Sovereignty of location does not bound blast radius.
5. **DO let LLMs do the extraction/normalization/dedup end-to-end; reserve staff for the ISO-2 green-light only.** *Because* PR #8 §8 — brakes prevent runaway, human gates are for judgment (doctrine/publish), not toil.
6. **DO hold PII consent-gated, ISO-2-isolated, never sold, never on the TLC path.** *Because* binding (`DATA-AS-EMPOWERMENT`, the TLC firewall, "we do not sell data").
7. **DO package Tier-2 with a validation gate and Events-as-data from day one.** *Because* the next church in the network should get this by config, and the wf30 silent-fail lesson says nothing flips `active` un-smoke-tested.
8. **DO build a staff-friendly calendar that the church fills via a form, and have the SYSTEM generate everything downstream — including the iCal feed (§17).** *Because* the church posts calendar **images** precisely because iCal is out of reach; the fix is to remove iCal from their job, not assign it. One friendly input (form or approve-LLM-extracted, item G) → auto-published public calendar + `service-calendar.json` (GPU scheduler) + reminders + a **generated** iCal/ICS feed. **This supersedes "ask them to publish iCal."** Ship the plain-language church-facing explainer ([sibling doc](2026-06-09-church-calendar-explainer-for-staff.md)) alongside it.

**DO NOT:**
- **DO NOT** fabricate church data or assume shapes — **the 2026-06-09 inventory replaced assumptions with facts** (§3.0): seed from the real TCOTLG form + Gwin Home-going sheet; the rest waits on the grant. The schedule is **ConvertKit + Zoom**, not a Google calendar — don't design a Google-calendar sync that doesn't exist.
- **DO NOT** auto-publish any roster, speaker card, or schedule change without the ISO-2 human green-light (§5).
- **DO NOT** grant ingestion autonomy before the Cage is proven on that surface, and never while traveling/unattended.
- **DO NOT** let any TLC/PHI data touch this module.
- **DO NOT** block schema + pipeline work on the grant — **seed the schema now from the real TCOTLG form + Gwin Home-going sheet** (§3.0) + the CSV-drop fallback; the grant unlocks the rest.

---

## 9. What I found vs. what is still unknown (explicit)

**FOUND (verified in-repo, building-on, not from scratch):**
- The `events` table with recurrence/lifecycle/links — `schema-v2.8-ops.sql:215`.
- Church domain — `parishioners`, `service_offerings` (**`service_kind` already has `'conference'`/`'revival'`**), `ministries`, `volunteer_hours` — `schema-v2.7-church.sql`.
- The external-participant portal — `external_users`, `external_invite_tokens`, `interactions` — `schema-v2.1`/`v2.9`. (= the registration/RSVP engine.)
- The `rentals`/`maintenance_requests` booking template — `schema-v2.2-rentals.sql`.
- `report_runs`/`report_snapshots` for annual-results materialization — `schema-v2.8-ops.sql`.
- The Cage primitives (allowlist, hash-chained ledger, health gate, schedule boundary) — `infra/ai-orchestrator/`.
- `service-calendar.json` + loop (G) as the weekly-schedule answer — PR #8 §4b/§6.2.
- The hardcoded `COLG_DEFAULT_CHURCH` service times to be deprecated — `app/src/poe-financial-mvp-v28.jsx`.
- n8n runner + `/n8n` rewrite + `poetech-briefing` bind mount + `_reel.jsonl` telemetry sink.

**FOUND via the 2026-06-09 Workspace inventory (REAL — assumptions replaced with facts; full detail §3.0):**
- **The church's live ops do NOT live in the connected account** — they run on a **separate Workspace domain `@thechurchofthelivinggod.com`**, primary/admin account **`info@thechurchofthelivinggod.com`** (+ staff `eldressredding@`, `bg@`) + **ConvertKit** (sender = `info@`) + **Zoom** + `thelovecornermedia@gmail.com`.
- **Conference registration instrument FOUND:** the **"TCOTLG – Conference Registration" Google Form** (`id 1a3-7OgQcRPN8MkdVNI1dr-5_GoFW22uObJ4a3PwufXQ`, Darrell-owned, mod. 2024-06-18) — responses *inside* the Form (needs **Forms API**); a `"Copy of…"` duplicate exists.
- **A readable schema seed FOUND:** the **"Evangelist Gwin Home-going (Responses)" Sheet** (`id 1qkbpDj0hrFgcKHn6LgMdsiVx2i5PiwBmqQL8-T_wGJs`) — a real Form→Sheet RSVP row shape to model `event_participants` on **now**.
- **Weekly schedule sources FOUND (external):** **ConvertKit + Zoom** — Sun 11 AM; Wed Bible Study + Bible Trivia; monthly Zoom National Assembly 2nd Mon 7:30 PM CT (Senior Bishop Lloyd E. Gwin). **No church Google Calendar.**
- **The member list already in ConvertKit** = an existing, consented **first-party data source for item I.**
- **Building confirmed:** 312 E. Bradley Ave, Champaign IL, ~44,000 sqft.
- **⭐ Church Plus on the CHURCH NAS — partly confirmed (2026-06-09).** The church NAS is a **separate on-site device** (name ~"TLC…", UNCONFIRMED; **not yet located**) — **NOT** Darrell's home `PoeTech · DS1621xs+ · 192.168.1.26` box (that's the PoeTech runner/substrate; §3.1.6). **CONFIRMED on the church NAS:** member data (rosters — the member system-of-record) **and** the monthly financial reports. Web research → most likely **PowerChurch Plus** (NAS-hosted `.DBF`), distinct from cloud ChurchPlus.co. **Now the PRIMARY authoritative source on the sovereign path** — supersedes the Google grant for members + financials. Likely the **COLG sovereign-node hardware.**

**STILL UNKNOWN — what only a DSM login can answer (Darrell logs in; the agent will NOT) + the open giving question:**
- **⭐ The church NAS itself — LOCATE it + read Church Plus (highest leverage; §3.1.6):** its hostname/IP/model on the church network (a separate box from the home `192.168.1.26` substrate), then via a DSM login the exact Church Plus product/version + **its DB/file layout** → design the adapter. **Schema NOT fabricated until then.**
- **❓ GIVING location — OPEN, do not assume:** transaction-level giving may be in **Church Plus**, in **ConvertKit / Givelify**, or only inside the financial reports. Resolve before wiring giving ingestion. (The monthly *reports* — confirmed on the NAS — carry rolled-up giving regardless.)
- **Monthly financial reports — file FORMAT UNCONFIRMED** (a Church Plus report? a Sheet? PDFs on the share?), though **location is CONFIRMED (the NAS)**; source for annual results (§4c), computed not hand-keyed; **ISO-2, staff-gated, never public, never in seed.**
- **Speaker/participant rosters + bios** — **member rosters are on the NAS (Church Plus, confirmed)**; speaker bios specifically may be there, in the `@thechurchofthelivinggod.com` Workspace, or in the TCOTLG Form.
- **The TCOTLG Form field schema** — needs the **Google Forms API scope** (`forms.body.readonly` + `forms.responses.readonly`) to extract; can't be read as a Sheet. (Genuinely Google-resident — Path B.)
- **Event-center booking/availability + room list** — not found (only vendor invoice `#6545`); → **Church Plus event-scheduling (UNCONFIRMED) or Workspace, else the sovereign `event_center_bookings` table (§4d).**
- **THE GOOGLE-PATH UNBLOCK (now SECONDARY, scoped to Google-resident surfaces) — a read-only service-account / domain-wide-delegation grant on `@thechurchofthelivinggod.com`, via `info@`, + the Forms API scope** (admin action — **only Darrell / the church admin who holds `info@`**). Plus **ConvertKit + Zoom read-only API keys** (§3.1.5). **The NAS-local Church Plus path (if confirmed) may not need this at all for rosters/giving/events.**

None of these block schema + pipeline work — **Phase 1 seeds the schema NOW from the two readable assets** (TCOTLG form shape via Forms API + the Gwin Home-going Responses sheet) + the CSV-drop fallback + (if confirmed) a **NAS-local Church Plus read**; the grant unlocks the remaining Google-resident surfaces.

**FOUND for Part II (build-on, not from scratch):**
- **The in-app group chat is already designed** — `IN-APP-MESSAGING-LAYER-1-DESIGN.md` (schema-v2.10-messaging: conversations/messages/group chats, n8n `messaging-fanout`, ntfy push, Matrix Layer-4). Phone-number-free at its core.
- **The front-door Church Tab is already specced** — `CHURCH-TAB-DIRECTORY.md` (COLG/Love Corner default, Mars Hill progressive disclosure, multi-church directory).
- **The role + per-unit scope model already exists** — `IDENTITY-ROLES-AUDIT.md` (5 roles, scope modifiers, Phase 3 cloud-auth → Phase 4 SSO/SAML/OIDC + BAA tier).
- **The one-codebase-many-instances commitment is already binding** — `MODULAR-EXTENSIBILITY.md` + `MULTI-INSTANCE-STRATEGY.md`.

**UNKNOWN for Part II (flag, don't assume):**
- ~~**Is `thechurchofthelivinggod.com` email on Google Workspace or Turbify?**~~ **RESOLVED 2026-06-09:** there is a **real Google Workspace domain `@thechurchofthelivinggod.com`** with live accounts (`info@`, `eldressredding@`, `bg@`). The staff/leader domain-email SSO anchor (§14) is therefore **Google Workspace** — federate via Google OIDC for MVP (§14.3). (The Turbify signal was the *website* host, not the mail.) *Still needs:* the admin grant to provision the service-account/SSO (same grant as Part I's §3.0 P0).
- **The church-staff/leadership roster + their domain-email accounts** (who is staff, who leads which unit) — needed to seed roles/scopes.
- **The ministry → unit breakdown** (which ministries have which units, and current unit leaders) — the church's own org structure; ingest or capture in Surface B.
- **Whether Darrell ratifies the two-surface pattern as the general shape** (§15) — explicitly his decision, left open.
- **The SMS-bridge build choice** (self-hosted GSM gateway vs. low-cost SMS API) + its US A2P/10DLC registration path and budget cap (§13.5) — deferred edge; decide if/when phone-only outreach volume justifies it.
- **The exact OAuth providers** members will use for SSO-enrichment and the **consent-UX copy** disclosing what is captured/enriched (§14.6) — design + legal-tone pass needed before enrichment ships.

---

# PART II — Surfacing, Units, Messaging & Identity (Darrell directive, 2026-06-08 follow-up)

> Part I designed *how the church's existing data flows in*. Part II designs *where it shows up, who can touch it, how people talk inside it, and how they log in*. **Same ingested data model, same Cage pipelines, same Module-Library reusability** — Part II is the surface + identity layer on top. Darrell's framing: *"more for the church, with even more options"* — **and** *"or whatever we decide works best for all businesses."* So the two-surface idea is presented as **one candidate instance of a general multi-entity pattern, with trade-offs, for Darrell to ratify** — not a locked decision.

## 10. The two-surface model — and its generalization to all entities

### 10.1 The two surfaces (church instance — the concrete first realization)

| | **Surface A — the front-door "Church" tab** | **Surface B — the exclusive church app (gated, deeper)** |
|---|---|---|
| **Who** | Anyone in the PoeTech App (members, visitors, the unchurched) | Church staff / leadership / unit leaders / members — **access-gated** |
| **Already exists?** | **Yes** — `CHURCH-TAB-DIRECTORY.md` (COLG / Love Corner default, Father's Business anchor, **Mars Hill Option B progressive disclosure**, multi-church directory). We **extend** it. | **No** — to be built as the deeper instance/app |
| **Capability** | **Read-only, public-safe.** Conference info, weekly schedule, event-center open times, giving link, sermons, directory. | **Full management + write (behind staff green-lights).** Conference mgmt (participants + speakers), event-center scheduling/booking, annual-results dashboards, the staff green-light/decision queues, ministry-unit leadership tooling, group chat. |
| **Disclosure depth** | The bridge / front door. The visitor "opts in by navigating" (Mars Hill). | One **login** deeper — the depth behind the door. |
| **Tier** | ISO-2 public sub-tier (no PII beyond public directory facts) | ISO-2 full (PII, roster, decisions) — **all reads/writes role-gated + audited** |

**Progressive disclosure between them (the key relationship):** the front-door tab is the **bridge**; the exclusive app is **one click / one login deeper**. A staff member browsing the public Church Tab sees a "**Manage** / **Leadership sign-in**" affordance that, on SSO login (§14), drops them into Surface B with exactly the capabilities their role + scope grant (§11/§12). A visitor never sees Surface B exists beyond that sign-in door. This is the **same Mars Hill posture** the Church Tab already takes, extended one level: public bridge → gated depth.

### 10.2 Feature placement map (which feature lives where)

| Feature | Front-door tab (A) | Exclusive app (B) |
|---|---|---|
| Weekly schedule (services) | ✅ read-only view | ✅ edit via loop (G) green-light |
| Conference info (theme, dates, public sessions) | ✅ read-only | ✅ full mgmt |
| Conference **participant roster** (PII) | ❌ | ✅ role-gated |
| **Speaker** bios/sessions | ✅ **only after** ISO-2 publish green-light | ✅ manage + `consent_to_publish` |
| Event-center **open/available times** | ✅ read-only availability | ✅ booking create/approve |
| Event-center **bookings** (who booked what) | ❌ | ✅ role-gated |
| **Annual-results** dashboards | ▲ high-level public stats only (opt-in) | ✅ full year-over-year |
| Staff **green-light / decision** queues | ❌ | ✅ leadership only |
| **Ministry-unit** leadership tooling | ❌ | ✅ unit leaders (scoped) |
| **Group chat** (units, leadership) | ❌ | ✅ members of the conversation |
| Giving link / sermons / directory | ✅ | ✅ |

### 10.3 The generalizable pattern vs. the church-specific instance

**The pattern (candidate, general):** *every business/entity gets a **public-facing front-door surface (a tab)** + an **exclusive, access-gated deeper app/instance** with fuller capability — both reading the same ingested data model + Cage pipelines + first-party identity/SSO, each entity a **configurable instance / sovereign node**, not a bespoke build.* This is exactly what `MODULAR-EXTENSIBILITY.md` ("a trades instance and a therapy-practice instance run the same codebase with different module sets enabled — no per-customer branches") + `MULTI-INSTANCE-STRATEGY.md` (Phase-3 multi-tenant) already commit the platform to. The Conference Module is **the church's first realization** of it.

**How it lands per entity (at each isolation tier):**

| Entity | Front-door tab (A) | Exclusive gated app (B) | Tier note |
|---|---|---|---|
| **Church** (ISO-2) | Church Tab (exists) — schedule, conference info, availability | Conference mgmt, bookings, annual results, unit leadership, green-lights | Doctrine gate on any publish |
| **TLC** (ISO-1) | **public marketing surface ONLY** — services, appointment-**request** | A gated practice surface MAY exist, but **zero PHI in any shared analytics/identity/decision dataset**; the deeper app's clinical content is **walled off from the shared substrate** | **STRESS TEST — see §10.4** |
| **PoeTech App** (ISO-3) | Marketing/free-tier front door (poetech.us) | The dogfood dev/ops + account management depth | Cage; lightest gate |
| **Poe Properties** (ISO-3-class) | Public "for tenants/applicants" front door (listings, apply, contact) | **Tenant portal: communication, service requests (photo+text), work orders, dispatch tickets** (§16) | Tenant PII consent-gated, **never sold, NOT PHI**; distinct from TLC ISO-1 |
| **Partner org / future** | Their public tab (directory entry) | Their gated instance on their sovereign node | Onboarding-in-days via config |

### 10.4 TLC ISO-1 stress test — does the pattern leak PHI? (must be "no")

The two-surface pattern **holds for TLC only if the gating wall is structural, not cosmetic.** Binding constraints (senior to the pattern):
- **Surface A (TLC front door) carries ZERO PHI** — public marketing + an appointment-**request** intake only (no clinical content). This already matches the TLC firewall (PR #8 §2.2).
- **Surface B for TLC, if built, is NOT on the shared ingested-data substrate.** Its clinical data lives in the **TLC-isolated instance** with `is_clinical=true`, the separate encrypted storage bucket (`messaging-attachments-tlc`), client-side AES-GCM at rest, PIN unlock, and **no fan-out to external channels** — exactly the isolation `IN-APP-MESSAGING-LAYER-1-DESIGN.md` §6 already specifies. **No TLC clinical data ever enters the conference/event tables, the shared analytics, the shared identity decision-loop, or any vendor model.**
- **The shared substrate (Part I data model + Cage pipelines + analytics) is Church/PoeTech only.** TLC participates in the *pattern* (tab + gated app) but **not** in the *shared data pool*. The pattern is a UX/architecture shape; it does **not** imply one database across entities. **Per-entity RLS + per-instance isolation is the wall.**

**Conclusion:** the pattern generalizes **safely** because "same shape" ≠ "same data pool." Each entity is its own `instance_id` (often its own sovereign node), isolation enforced by RLS + the `is_clinical` flag + separate keys. TLC stays ISO-1.

## 11. Data-model additions (Part II)

All additive, all `instance_id`-scoped + RLS, all following `MODULAR-EXTENSIBILITY` (one module/file, integrate-by-data-shape, lifecycle+links on every record). **Reuses, does not reinvent:** the existing `ministries`/`ministry_signups` (v2.7), the role model + scope modifiers (`IDENTITY-ROLES-AUDIT`), and the **already-designed** messaging tables (`conversations`/`conversation_members`/`messages`, schema-v2.10).

| Table | Key columns | Grounding / reuse |
|---|---|---|
| **`ministry_units`** | `id`, `instance_id`, `ministry_id` (**FK → `ministries`**), `name`, `purpose`, `lifecycle`, `links`, `source_*` | A sub-group **within** a ministry. Ministry → unit is one-to-many. |
| **`ministry_unit_members`** | `unit_id`, `person_ref` (`parishioner_id` \| `external_user_id`), `unit_role` (`leader/co-leader/member`), `joined_at`, `status` | The unit roster + **unit-leader role**. `unit_role='leader'` ⇒ the Editor-scoped-to-unit capability set (§12). |
| **(reuse) `conversations`** | `kind='group'`, `linked_entity_kind='ministry_unit'`, `linked_entity_id=<unit_id>` | **The unit group chat is an existing `conversations` row** — no new chat table. Members seeded from `ministry_unit_members`. |
| **(reuse) role + scope** | `instance_members.role` + scope modifier `per unit` | A unit leader is an **Editor** whose scope is **their unit** (`IDENTITY-ROLES-AUDIT` "Specialist = Editor with a tight scope"). No new role type. |
| **`identity_domains`** | `id`, `instance_id`, `domain` (`thechurchofthelivinggod.com` \| `tlctherapysolutions.com` \| `poetech.us`), `idp_ref`, `mail_mode` (`bridge/sovereign`), `is_clinical` | The multi-domain identity registry (§14). Maps each entity to its email domain + IDP + mail-hosting mode. |

> **Why no new chat/messaging tables:** the in-app group chat Darrell asked for is **already fully designed** (`IN-APP-MESSAGING-LAYER-1-DESIGN.md`, schema-v2.10). We **realize** it for ministry units by writing one `conversations` row per unit and seeding members — not by building a parallel messaging system. (§13.)

## 12. Ministry units + unit-leadership support tooling

- **Model:** a ministry (e.g., "Music Ministry") has **units** (e.g., "Choir," "Praise Team," "A/V Unit"); each unit has **leadership** (`unit_role='leader'/'co-leader'`) and **members**. Lands as `ministry_units` + `ministry_unit_members` (§11).
- **Leadership support per unit (the unit-leader's view in the exclusive app, Surface B):**
  - **Roster** — the unit's members (read/manage, scoped to the unit only).
  - **Scheduling** — the unit's events/rehearsals/serving rota as `events` rows linked to the unit (reuses the Part I `events` atom + event-center bookings).
  - **Communication** — the **unit group chat** (§13) + invitation-shaped notifications (POE non-punitive).
  - **Annual/seasonal results** — the unit's participation/volunteer-hours rollup (reuses `volunteer_hours`).
- **Permission gates (strict, per-unit):** a **unit leader** sees/manages **only their unit(s)** (Editor scoped per-unit); a **member** sees the units they belong to; **church leadership/Owner** sees across units. This is the existing `IDENTITY-ROLES-AUDIT` matrix + the **per-unit scope modifier** — no new permission engine, just a new scope value. Every action audited (append-only log), per the two non-negotiable rules (every change attributable; framework scales).
- **Church = ISO-2; off the TLC PHI path** (units are a church-domain construct; TLC never appears here).
- **Reusable (Module Library, Tier 2):** "Ministry Units + Unit Group Chat" is a configurable module; generalized, it is the **team/sub-group structure** any business's instance can adopt (a trades crew, a practice's care-team, a department) — consistent with the "works best for all businesses" generalization.

## 13. Messaging architecture — maximum-inclusion comms: OTT-first, multi-anchor, no single credential required

> **THE INCLUSION PRINCIPLE (binding, declared by Darrell 2026-06-08):** *the comms layer must reach a member whether they have **email-only, phone-only, both, or neither** (an app-only handle).* **No single credential is required — nobody is excluded for lacking email OR a phone number OR a carrier SMS plan.** Messaging is **OTT (over-the-top): delivered over the internet/data via the app** — "text over internet connection" — not dependent on a carrier SMS plan. **PWA-first** so it works on any device with a browser + internet. (This generalizes the earlier "group chat without a phone number" to its full form.)

### 13.1 The big finding: this is largely already designed

`docs/00-foundations/IN-APP-MESSAGING-LAYER-1-DESIGN.md` (design **approved 2026-05-26**, schema target `schema-v2.10-messaging.sql`) already specifies app-native messaging: `conversations` (incl. **`kind='group'`**), `conversation_members`, `messages`, reactions, attachments; an **n8n `messaging-fanout`** workflow over **Supabase Realtime**; and push via **ntfy** (self-hosted on the DS1621xs) + Pushover, with PWA web-push reply. **It is already phone-number-free at its core** — identity is `instance_members.user_id`, and **SMS (Twilio) is only an opt-in Layer-2 fallback**, never the channel. So Darrell's "group chat through the app without a phone number" is **mostly a realization of an approved design**, not a new build.

### 13.2 What "no phone number" buys (and why it's already satisfied)

- **Accessibility win:** people without phone service, or unwilling to share a number, still participate fully. The app login is the identity; no number is collected or required.
- **Sovereignty win:** no carrier/phone-number dependency; the channel is owned end-to-end (in-app + ntfy push), per `DATA-AS-EMPOWERMENT` and the messaging doc's "no carrier, no third-party messenger" thesis.
- **Anchor:** identity = the **SSO login** (§14 — for staff/leaders, the **domain email**), not a phone number.

### 13.3 ntfy vs. a self-hosted chat primitive vs. a heavy SDK — trade-off (dependency-skeptical)

| Option | What it is | Pros | Cons | Verdict |
|---|---|---|---|---|
| **ntfy (already running)** as the **push substrate** + Supabase `messages` as the **store** | The approved Layer-1 design: messages persist in Postgres, ntfy delivers push | **Already deployed** on the DS1621xs; lightweight; self-hosted; zero new dependency; phone-number-free; POE notification shaping already specced | ntfy is push-only (not a chat store) — but it was never meant to be the store; Postgres is | ✅ **RECOMMEND — reuse as-is** |
| **Matrix / Synapse + Element** (self-hosted) | Full federated chat protocol on the NAS (the doc's **Layer 4**) | Sovereignty-maximalist; real federation; strong E2E for clinical; third-party clients | Heavy to operate (Synapse + bridge + cert/key rotation); overkill for unit chat in MVP | ⏸ **DEFER to Layer 4** (sovereignty completeness, not an MVP need) — exactly the doc's stance |
| **Heavy third-party chat SDK** (Sendbird / Stream / Twilio Conversations) | Vendor chat-as-a-service | Fast to integrate | **Violates** dependency-skepticism + sovereignty + "no vendor that can change pricing/terms or shut us out"; data leaves the sovereign loop | ❌ **REJECT** |

**Recommendation:** **realize the existing Layer-1 messaging design (Postgres store + ntfy push) for ministry-unit group chat now; keep Matrix as the deferred Layer-4 sovereignty option; never adopt a heavy third-party chat SDK.** This is the lightest sovereign primitive that meets the need, and it is **already approved and partially built** — the fastest correct path. *Rationale:* sustainability beats convenience (the messaging doc's own decision rule), and the substrate already exists.

### 13.4 Per-unit gating for chat

A unit group chat is a `conversations` row (`kind='group'`, `linked_entity_kind='ministry_unit'`). Membership = `ministry_unit_members` → `conversation_members`. **Unit leaders manage their unit's conversation (owner role); members participate; non-members can't see it** — the RLS conversation-membership gate (`IN-APP-MESSAGING` §RLS) + the per-unit scope (§12). **Church ISO-2; TLC clinical conversations stay on the separate `is_clinical` isolation path and never mix in.**

### 13.5 Maximum-inclusion delivery — OTT-first, with an optional SMS bridge at the edge

**The delivery ladder (data/OTT first; carrier SMS only as a last-resort edge):**

| Tier | Channel | Reaches | Carrier dependency? | Sovereign? |
|---|---|---|---|---|
| **1 — OTT in-app (default)** | The PWA message store (Supabase `messages`) read live in-app | Anyone with the app open on **any device with a browser + internet** | **None** | ✅ Yes |
| **2 — OTT push** | **PWA Web Push** (service worker) + **ntfy** (self-hosted on DS1621xs) | Anyone who installed the PWA / subscribed a topic — over data/Wi-Fi | **None** (data only) | ✅ Yes |
| **3 — OTT email digest (optional)** | Self-hostable email (Resend now → sovereign mail long-arc) | People who gave an email and want digests | None (data) | ✅/▲ |
| **4 — SMS bridge (edge fallback ONLY)** | Outbound/inbound SMS gateway | People who have **only a phone**, no app yet, no email | **Yes — a carrier/3rd-party touchpoint** | ❌ **not fully sovereign — flagged** |

**Tiers 1–2 are the product; they need no phone number and no carrier plan** — "text over the internet connection" is exactly Web Push + ntfy + the in-app store over data. A member with **neither email nor phone** uses an **app-only handle/passcode** (§14.5) and is fully reachable on Tiers 1–2. This is the inclusion principle realized: **email-only → Tiers 1–3; phone-only → Tier 4 in, Tiers 1–2 once they install; both → all tiers; neither → Tiers 1–2 via app handle.**

**The SMS bridge — honest trade-off (the one place sovereignty bends):**
- **Why it exists:** to reach someone who has *only* a phone and is *not yet in the app* — an outreach/onboarding edge (invite them, they reply, they get pulled into OTT). Inbound SMS can post into a `conversations` thread; outbound sends a notification + an install link.
- **Sovereignty screen (don't pretend it's sovereign):** SMS **requires** a carrier or an SMS-API vendor — this is **the one unavoidable external touchpoint** in the comms layer. Options, sovereignty-screened:
  - **Self-hosted GSM gateway** (a SIM + a modem/Android-SMS-gateway/`gammu` on the LAN) — *most sovereign*, lowest per-message cost (just the SIM plan), but operational burden (hardware, deliverability, throughput limits, A2P/10DLC registration headaches in the US). Best for **low-volume** church outreach.
  - **Low-cost SMS API** (Twilio / Telnyx / Plivo / Vonage) — fastest, reliable deliverability, but a **3rd-party touchpoint + per-message cost** (~$0.0075–0.01/msg US) and the data transits a vendor. Pick the cheapest with acceptable terms; **never route TLC/PHI through it.**
- **Recommendation:** **build Tiers 1–3 first (fully sovereign, no carrier); treat the SMS bridge as a deferred, opt-in, budget-capped edge** — and when built, prefer the **self-hosted GSM gateway for low-volume church use**, falling back to a low-cost SMS API only if deliverability/scale demands it. **Budget-cap it** (the existing messaging-doc Layer-2 cap: default $5/mo per instance, hard cutoff → digest). **SMS is excluded entirely for TLC** (`is_clinical=true` check constraint already forbids external transports — PR #8 / `IN-APP-MESSAGING` §6).

> Net: the comms layer is **sovereign and carrier-free for the overwhelming majority** (OTT Tiers 1–3) and includes a **clearly-flagged, budget-capped, non-sovereign SMS edge** only to *pull in* phone-only people who aren't in the app yet. No member is excluded; the one external dependency is named, costed, and walled off from TLC.

## 14. Tiered, multi-anchor, domain-based multi-entity identity (the SSO + group-chat anchor)

> **Tiered (§14.1b):** **staff/leaders** = sovereign church-domain SSO (canonical authority); **members** = low-friction consumer-OIDC (Google/Apple/Microsoft) + phone + app-handle, **federated into our sovereign store** (entry method, not system of record). **Progressive-trust (§14.1c):** easy for a known identity, friction reserved for unknown identities + sensitive actions; **2+ corroborating sources = "verified/known" = frictionless tier.** **TLC ISO-1 excluded from all consumer cross-referencing — absolute.**

### 14.1 The model: one substrate, many domains

The PR #8 first-party identity layer **(I)** — a self-hosted IDP/SSO (Authentik / Keycloak / Zitadel candidates) — is **multi-domain**: one identity substrate serving each entity's own email domain.

| Entity | Identity domain | Primary/admin anchor | Staff identities (examples) | Tier |
|---|---|---|---|---|
| **Church** | **`@thechurchofthelivinggod.com`** | **`info@thechurchofthelivinggod.com`** (main Workspace account; the grant + admin anchor for item I; confirmed ConvertKit sender) | `bg@` (Bishop Gwin — primary anchor; `bishoplgwin@gmail.com` = recovery-only, §14.1a), `eldressredding@`, … | **ISO-2** |
| **TLC** | `@tlctherapysolutions.com` | practice admin account | staff practice accounts | **ISO-1 — PHI-walled** |
| **PoeTech** | `@poetech.us` | platform admin account | product/team accounts | ISO-3 |
| **Poe Properties** | `@poetech.us` (or own domain) staff; **tenants = member consumer-OIDC/phone/app-handle (§14.1b/§14.5)** | property-mgmt admin account | property managers (domain/bootstrap §14.1a) | **ISO-3-class** (tenant PII, never sold, NOT PHI) |
| **Partner org** | their own domain | their admin account | per sovereign node | their tier |

**The church's primary identity is `info@thechurchofthelivinggod.com`** — the main Workspace account, the target of the §3.0 service-account grant, and the **admin anchor for the church-domain identity layer (item I)**. **`bg@` (Bishop Gwin), `eldressredding@`, and the other named mailboxes are staff identities on the same domain**, federated through the same SSO substrate.

**Staff / unit-leader SSO login AND in-app group-chat identity key off these domain emails.** That is the concrete "no phone number" anchor for staff/leaders: identity is the **domain email**, federated through the SSO substrate. (Members may hold lighter identities — e.g., a magic-link/passkey account or the app-only handle of §14.5, without a church-domain mailbox — but **staff/leaders are domain-email accounts**, which is also what makes the audit trail and the green-light authority legible.) This is the `IDENTITY-ROLES-AUDIT` **Phase 3 (cloud auth) → Phase 4 (SSO via SAML/OIDC)** path, made concrete and **per-domain** — with `info@` as the church's Owner/Administrator anchor.

### 14.1a Sovereign-domain-primary rule — staff/leaders anchor on the domain, personal email is recovery-only (Darrell decision, 2026-06-09)

**Binding rule (declared by Darrell):** **a staff/leader's PRIMARY SSO identity is their sovereign domain account; a personal email (Gmail, etc.) is at most a LINKED / RECOVERY contact, NEVER the auth anchor.** This is the per-entity domain-based sovereign-SSO pattern (§14.1) applied to the person.

**The named case — Bishop Gwin:**

| | |
|---|---|
| **Primary SSO identity (auth anchor)** | **`bg@thechurchofthelivinggod.com`** — the sovereign domain account; this is what he authenticates with, what carries his Owner/leader role + green-light authority, and what keys his in-app group-chat identity. |
| **Linked / recovery contact only** | **`bishoplgwin@gmail.com`** — a recovery + notification fallback **linked** to the `bg@` identity. **Not an auth anchor; cannot be used to assert his church role.** |

**Generalized (the rule for every staff/leader, every entity):**
- **Domain account = the primary anchor.** Staff/leaders authenticate on their entity's sovereign domain (`@thechurchofthelivinggod.com`, `@tlctherapysolutions.com`, `@poetech.us`). Role, audit attribution, and green-light authority bind to the **domain identity**, never to a personal address.
- **Personal email = optional linked recovery, never the anchor.** A personal Gmail/iCloud/etc. may be **linked** for account recovery and notification fallback, but it **cannot be the login identity** and **cannot carry role/authority**. (This closes the `IDENTITY-ROLES-AUDIT` "permission-revocation lag" + "cross-instance role bleed" risks: revoking the domain account revokes access; a personal address never grants it.)
- **Sovereignty + legibility:** the sovereign domain is the relationship and the record we own (PR #8 §7); anchoring on it — not on a vendor-owned personal mailbox — keeps identity, audit trail, and authority inside the sovereign loop.
- **Reconciles with §14.5 multi-anchor inclusion:** multi-anchor (email **or** phone **or** app-handle) is for **members** (maximum inclusion); **staff/leaders are held to the stricter domain-primary rule** because their identity carries authority and must be revocable + legible. Members include everyone; leaders are anchored sovereign.

**TARGET vs. BOOTSTRAP — domain-anchored SSO is the target state, NOT a precondition for access (Darrell reality-check, 2026-06-09).** Darrell: *"staff leadership may not have or use the church emails currently."* So the domain-primary rule above is the **target**, and there is an explicit **on-ramp** so access is never blocked on domain-email adoption that hasn't happened yet (MVP-pragmatism):

| State | What it is | Role/authority |
|---|---|---|
| **TARGET (§14.1a)** | Staff/leader authenticates on the sovereign **domain account** (`bg@…`, etc.); personal email recovery-only. | Role + green-light authority bind to the **domain identity**. The end state. |
| **BOOTSTRAP (on-ramp, now)** | Staff/leader starts on their **existing verified consumer email** — role granted **only once the §14.1c verification clears (2+ corroborating sources agree → "known")**. In parallel, a **church-domain account is provisioned** and the identity is **rebased to the domain anchor** over time. | Interim role grant rides the **verified personal email**; it is **explicitly tracked + revocable + flagged for migration** to the domain anchor. |

- **Do NOT block staff/leader access** on a domain mailbox they don't yet have/use — the bootstrap verified-personal-email grant is the on-ramp.
- **Audit + revocability hold throughout:** every interim personal-email role grant is written to the append-only ledger, carries a `migration_pending → domain` flag, and is revocable like any grant (`IDENTITY-ROLES-AUDIT`). The `identity_domains`/account record tracks `anchor_state` (`bootstrap-personal | provisioned | rebased`).
- **Ultimate binding is to the domain identity (the §14.1a target):** once the domain account exists and the identity is rebased, role/authority moves to it and the personal email reverts to recovery-only. **The interim is an on-ramp, not the destination.**

### 14.1b Tiered identity — staff sovereign-domain, members consumer-OIDC (federated, not locked-in) (Darrell, 2026-06-09)

**The model is TIERED by who the person is.** Darrell: *"People will probably use Gmail, Apple, or Outlook email addresses."* Members of the general congregation / app users **will NOT** have church-domain mailboxes — they bring consumer email. So:

| Tier | Who | Primary sign-in | Notes |
|---|---|---|---|
| **Staff / leaders** | Bishop Gwin, admin, eldress, unit leaders | **Sovereign church-domain SSO** (`bg@`, `info@`, `eldressredding@` on `@thechurchofthelivinggod.com`) — §14.1/§14.1a | Carries role + green-light authority; personal email recovery-only. **Canonical, already decided.** |
| **Members** | General congregation / app users | **"Sign in with Google / Apple / Microsoft"** (consumer **OIDC**) — first-class onboarding path — **plus** the phone + app-handle anchors of §14.5 | **Low-friction by design.** No church mailbox required; maximum inclusion preserved (email **or** phone **or** app-handle still all valid). |

**"Sign in with Google / Apple / Microsoft" is a first-class member onboarding path** — the fastest, most familiar button for the consumer-email majority. It composes with §14.5: a member may instead use phone or the app-only handle; consumer-OIDC is the *easy default*, not a requirement.

**FEDERATION, NOT VENDOR LOCK-IN (binding — state explicitly):** consumer logins **federate INTO our sovereign identity store, which is the system of record.** The Google/Apple/Microsoft button is **only a convenient ENTRY METHOD** — **our own self-hosted IDP (Authentik/Keycloak/Zitadel) holds the canonical account** (the `instance_members.user_id`, roles, links, consent flags). Because the canonical identity lives in our store, **we stay portable and vendor-independent**: a member can add/swap providers, and dropping a provider never loses the account. This is consistent with the open-source/portable-stack + sovereign-mesh principles and PR #8 §7 ("the relationship and its signals are ours, not a vendor's"). **No consumer provider is ever the system of record; each is a corroborating entry signal (§14.1c).**

- **Item I guardrails still hold:** consent + transparency, **never sold**, internal-only.
- **Per-entity isolation unaffected:** this is the **Church (ISO-2) / PoeTech (ISO-3) member** path; **TLC ISO-1 is clinical and separate** — TLC clinical identity is **not** a consumer-OIDC member account and is never pooled with this (PR #8 §2.2).

### 14.1c Progressive-trust access + verification tiers — "easy if we know who it is" (Darrell, 2026-06-09)

**Binding UX principle.** Darrell: *"Want access to be EASY for them, not restrictive — if we know who it is."* **Access is frictionless for a recognized/known identity; friction is reserved for unknown identities and, separately, for sensitive ACTIONS — not for a known member's normal use.**

**Verification tiers — the concrete definition of "we know who it is."** Darrell: *"cross reference with Google, Facebook, etc. — two or more, they are good."*

| Tier | Definition | Access posture |
|---|---|---|
| **Unverified** | A **single** unconfirmed source (one fresh OIDC login, an unconfirmed phone, a bare app-handle) | Basic access; **light step-up** (e.g., confirm a code, link a second source) **before sensitive actions only** |
| **Verified / Known** | **Two or more corroborating identity sources that AGREE** — e.g. Google + Apple, or Google + phone, or Microsoft + Facebook, or a domain SSO + phone | **Frictionless / "easy" tier** — recognized; **do NOT re-challenge a known member during normal use** |

- **The threshold is concrete: 2+ corroborating sources that agree ⇒ "verified/known" ⇒ the easy-access tier.** A single source stays "unverified" until a second corroborates. This is the operational meaning of progressive-trust "we know who it is."
- **Friction maps to RISK, never to a known member:** the hard **gates stay strictly on the irreducible-judgment ACTIONS** (doctrinal publish, PHI, money, destructive, final green-lights — §5.3 / PR #8 §8) and step-up applies to **unverified** identities. A verified member doing normal things is **not** re-challenged. Brakes/gates protect risky *actions*, not ordinary *use*.

**GUARDRAILS for cross-referencing (binding — this is powerful, governed not bolted-on):**
1. **Consent-based + transparent.** The member is told their sign-in sources are cross-referenced to establish trust; **internal trust + service only; never sold** (item I).
2. **Behind the Cage, fully logged.** Every cross-reference is a **Cage-gated action written to the append-only, hash-chained audit ledger** (who/what/when/which sources) — and visible to the member (`IDENTITY-ROLES-AUDIT` "every change attributable").
3. **Values-aligned, non-creepy.** Corroboration is for **trust + frictionless access**, **not** surveillance profiling or broker-data inference. If it would feel invasive, it does not ship. (Distinct from, and narrower than, the §14.6 enrichment vector — this is identity-confidence only.)
4. **TLC ISO-1 EXCLUDED — absolute.** **No clinical/therapy identity is EVER cross-referenced against Google/Apple/Microsoft/Facebook or any consumer/social provider.** The firewall is total; clinical identity confidence is established sovereign-only, never against external providers.
5. **Federation-not-lock-in still holds.** The providers are **corroborating signals into our sovereign identity store**, never the system of record (§14.1b).

### 14.2 Current-state — RESOLVED by the 2026-06-09 Workspace inventory

**The church-domain mail is on Google Workspace.** The inventory (§3.0) confirmed a **real Google Workspace domain `@thechurchofthelivinggod.com`** — **primary/admin account `info@thechurchofthelivinggod.com`**, plus staff `eldressredding@` and **`bg@`** (Bishop Gwin). The earlier Turbify-vs-Workspace ambiguity is **resolved: Turbify hosts the *website*; the *mail* is Google Workspace.** (Literal lowercase domain per the §3.0 typography note.)

**Implication:** the staff/leader SSO anchor (§14.1) federates via **Google OIDC** for MVP (§14.3) — fast, and it's the same `@thechurchofthelivinggod.com` Workspace whose **service-account grant** also unblocks Part I's ingestion (§3.0). **One grant unlocks both** identity (SSO) and ingestion (Forms/Drive/Sheets). Still gated on the admin granting it (Darrell / church admin only).

### 14.3 Recommended path (with the sovereignty/cost screen)

| Phase | Approach | Trade-off |
|---|---|---|
| **MVP** | **Federate / SSO-bridge** the existing church-domain mail (whatever provider) into the self-hosted IDP via **OIDC/SAML** — login + identity work immediately; mailboxes stay where they are. | Fastest; uses the domain email as the SSO anchor today; **does not block MVP** on standing up sovereign mail. A retained external mail dependency (acceptable, bridged). |
| **Long-arc** | **Sovereign multi-domain mail on the NAS** — migrate the domains' mail to self-hosted (mailcow/Mailu-class) under the same IDP. | Full sovereignty ("the relationship and its signals are ours"); real operational cost (deliverability, spam, uptime) → **screen against the sustainability rule** before committing. |

**Recommendation:** **bridge during MVP (don't block on sovereign mail), converge to sovereign multi-domain mail on the NAS as the long-arc** — the same MVP-pragmatism / sustainability-beats-convenience rule the messaging doc applies. The **domain email is the SSO + group-chat identity anchor in both phases**; only the *hosting* of the mailbox changes.

**Member path (§14.1b), both phases:** stand up the **self-hosted IDP with consumer-OIDC connectors (Google / Apple / Microsoft)** + phone + app-handle, **federating into our sovereign store** — this is independent of the church-mail hosting question and can ship for members in MVP. The verification-tier cross-reference (§14.1c) layers on top: each added provider/phone is a corroborating signal toward the "verified/known" easy-access tier.

### 14.4 Per-entity isolation holds in identity too

- **Church-domain identities = ISO-2** — used internally for discipleship/reach/leadership; doctrine gate on any outbound content.
- **TLC-domain identities = ISO-1, PHI-walled** — login/SSO for the public practice surface may exist, but **its clinical data and PHI never enter the shared analytics/identity decision-loop, never touch a vendor model** (PR #8 §2.2 / §7). The identity substrate is shared *as code*; the **TLC data is isolated by `instance_id` + `is_clinical` + separate keys**, never pooled.
- **No cross-instance role bleed** (`IDENTITY-ROLES-AUDIT` anti-pattern): a leader on the church instance does not auto-inherit rights on TLC or PoeTech, even with a similar email.

### 14.5 Multi-anchor identity — no single credential required (the inclusion principle in the identity layer)

**Binding (Darrell 2026-06-08):** *"want it to work without an email also, just SMS or text over internet connection somehow."* Combined with "group chat without a phone number," the rule is: **identity must work with ANY ONE of several anchors — nobody is excluded for lacking email OR phone OR a carrier plan.**

| Anchor | Who it's for | Auth method | Notes |
|---|---|---|---|
| **(a) Domain email** | **Staff / leaders** (`@thechurchofthelivinggod.com`, etc.) | SSO / OIDC (§14.1–14.3) | The legible audit + green-light anchor; the enrichment vector (§14.6). **Per §14.1a this is the PRIMARY anchor for staff/leaders; a personal email is recovery-only, never the auth anchor** (e.g. Bishop Gwin: primary `bg@thechurchofthelivinggod.com`, recovery `bishoplgwin@gmail.com`). |
| **(b) Phone number** | Members who have a phone | OTP/passkey; SMS OTP only if they have carrier service, else WhatsApp/OTT or the app | A phone is **sufficient but not required**. |
| **(c) App-only handle + passcode** | **Anyone with neither email nor phone** | A chosen handle + PIN/passkey on the device (the `IDENTITY-ROLES-AUDIT` Phase-2 local-profile pattern, promoted to a real account) | **The pure-inclusion path** — works on any browser + internet, no email, no phone, no carrier. |

- **Any one anchor suffices to create a real account.** All three resolve to the same `instance_members.user_id` (the chat + audit identity). A member can **add** anchors later (claim an email, link a phone) — additive, never required.
- **PWA-first** so the app-handle path works on any device with a browser; no app-store gate, no SIM, no inbox needed.
- **Per-entity isolation holds:** **staff/leaders are domain-email accounts — domain-primary, personal email recovery-only (§14.1a)**; **members may use any anchor**; **TLC** identities stay ISO-1 and PHI-walled regardless of anchor.
- This is the `IDENTITY-ROLES-AUDIT` phased model extended: Phase 2 local profiles → Phase 3 cloud auth (passkey / magic-link / OAuth) → Phase 4 SSO — **with the app-handle anchor making Phase 3 reachable for the email-less and phone-less.**

### 14.6 SSO as consented data-enrichment — capability + BINDING guardrails (governed, not bolted on)

**Capability (Darrell 2026-06-08):** *"SSO is a great way to get user data and also create profiles from online information to cross-reference users initially and keep up to date."* Used through anchor (a)/(b) where the user signs in with OAuth (e.g., a Google/social SSO they choose), SSO is a **first-party data + profile-enrichment vector**:
- **(a) Capture consented profile data at login** — the scopes the user grants at the OAuth consent screen (name, email, photo, basic profile) flow into their profile.
- **(b) Bootstrap / cross-reference at onboarding** — reconcile the new account against existing records (dedupe a participant against a parishioner; merge a speaker's known bio) and, where legitimately available and consented, enrich from public/online information to pre-fill a fuller profile.
- **(c) Keep profiles current over time** — periodic, consented refresh so contact info and roles don't go stale; feeds **D (data-driven decisions, PR #8 §9)** and **H (the outcome-driven funnel, PR #8 §6.3)** with accurate first-party signal.

> **This capability is powerful and is therefore GOVERNED, not bolted on. The following guardrails are binding and stated here in the body, not a footnote:**

1. **Consent + transparency (non-negotiable).** The user is told **what is captured and what is enriched**, at the moment it happens; **enrichment is disclosed and opt-out-able**; **PIN-optional / community-default privacy is honored**; **no dark UX, no consent fatigue** (`DATA-AS-EMPOWERMENT`). Enrichment defaults to **off** for a profile until the user consents.
2. **Internal decisions only — NEVER sold (item I binding).** Enrichment serves **better service + opportunity-spotting (D + H) only** — never resale, never an ad model, never engagement-extraction. The structural refusal to sell **is** the moat (PR #8 §7).
3. **Per-entity isolation is SENIOR.** **TLC (ISO-1): NO online-profile enrichment — ever.** Clinical/therapy identities are **never** cross-referenced against online information; PHI-walled, sovereign-only. **Church (ISO-2) / PoeTech (ISO-3) enrichment is allowed under consent**, doctrine/Cage gates intact.
4. **Values-aligned + non-creepy.** Enrichment is scoped to **legitimate ministry/business purposes** (reach a member, serve them, spot a real opportunity) — **no surveillance-grade profiling**, no buying broker data, no inference the user would find invasive. If it would feel creepy to the member, it does not ship.
5. **Behind the Cage, with audit transparency.** Every enrichment / cross-reference action is a **Cage-gated job, Tier C** (all four brakes), and writes to the **append-only, hash-chained ledger** — who enriched what, from where, under which consent. The user can **see and export their own enrichment log** (`IDENTITY-ROLES-AUDIT` "every change attributable") and **request deletion** (immediate + verifiable).

**Connection to the loop:** SSO-enrichment is a **primary fuel for D (§9) and H (§6.3) of PR #8** — accurate, consented first-party profiles are what let the LLMs "make better decisions continuously" and tune the funnel — **and it never leaves the sovereign loop, and it is never sold.**

## 15. Part II recommendation + rationale (what / not-what / because) — Darrell's to ratify

**Recommendation: adopt the two-surface model (public front-door tab + exclusive gated deeper app) as ONE candidate instance of a GENERAL multi-entity pattern that holds for Church, TLC, and PoeTech at their own isolation tiers; realize ministry-units + the already-designed in-app group chat; make identity multi-anchor (email OR phone OR app-handle) and comms OTT-first (carrier-free) with a deferred, capped, TLC-excluded SMS bridge at the edge; anchor staff/leader identity to per-entity domain emails through a multi-domain SSO (bridged MVP → sovereign long-arc) that doubles as a CONSENTED, GUARDRAILED enrichment vector for D + H — never sold, never TLC. Darrell ratifies the pattern; the agent does not lock it.**

1. **DO present the two-surface split as a general pattern, not a church one-off** — *because* Darrell said "or whatever we decide works best for all businesses," and `MODULAR-EXTENSIBILITY` + `MULTI-INSTANCE-STRATEGY` already commit the platform to one-codebase-many-instances. The Church/Conference module is the **first realization**, not the only shape.
2. **DO extend the existing Church Tab as Surface A** (don't build a new front door) and **build Surface B as the gated depth one login deeper** — *because* `CHURCH-TAB-DIRECTORY.md` already establishes the front-door + Mars Hill progressive-disclosure posture; Surface B just continues it one level.
3. **DO read both surfaces from the SAME ingested data model + Cage pipelines** — *because* one substrate / two views is the whole point; two data stores would re-create drift and double the ingestion surface.
4. **DO model ministry units with the existing role + per-unit scope modifier** (a unit leader = an Editor scoped to their unit) — *because* `IDENTITY-ROLES-AUDIT` already supplies this; inventing a new permission engine is waste.
5. **DO realize the already-designed Layer-1 messaging (Postgres + ntfy) for unit group chat; keep Matrix as the deferred Layer-4; reject heavy third-party chat SDKs** — *because* it's approved, partially built, sovereign, phone-number-free, and the lightest primitive that meets the need (dependency-skepticism + sustainability-beats-convenience).
6. **DO make identity multi-domain and anchor staff/leaders to their entity's domain email** (`@thechurchofthelivinggod.com`, `@tlctherapysolutions.com`, `@poetech.us`) — *because* it is the no-phone anchor, makes the audit trail and green-light authority legible, and is the natural Phase-3→4 SSO path.
7. **DO bridge mail for MVP, converge to sovereign NAS mail long-arc** — *because* MVP-pragmatism: don't block login on standing up sovereign mail; the domain email is the anchor either way, only the hosting moves. Screen the sovereign-mail step against the sustainability rule before committing.
8. **DO make identity multi-anchor — email OR phone OR app-only handle, any one suffices (§14.5)** — *because* the inclusion principle is binding: nobody is excluded for lacking email or phone or a carrier plan. The app-handle anchor is the pure-inclusion path on any browser + internet.
9. **DO make comms OTT-first (in-app + Web Push + ntfy over data), with the SMS bridge as a deferred, opt-in, budget-capped, clearly-non-sovereign edge (§13.5)** — *because* "text over the internet" is Web Push/ntfy over data, which needs no carrier; SMS is only to *pull in* phone-only people not yet in the app, and it's the one external touchpoint — named, costed, capped, and TLC-excluded.
10. **DO use SSO as a consented data-enrichment vector for D + H, under the five binding guardrails (§14.6)** — *because* accurate consented first-party profiles fuel better continuous decisions and funnel tuning. **Consent + transparency; internal-only never sold; TLC NO enrichment ever; values-aligned non-creepy; Cage-gated + audit-logged.** The capability is powerful, so it is governed in the body, not bolted on.

**DO NOT:**
- **DO NOT** let the two-surface pattern imply one shared database across entities — **TLC stays its own isolated `instance_id` with `is_clinical` + separate keys; no PHI ever enters the shared substrate** (§10.4). The pattern is a shape, not a data pool.
- **DO NOT** put participant rosters, bookings, unit chat, or annual PII on the **public** front-door tab — those live only in the gated Surface B (§10.2).
- **DO NOT** build a parallel messaging system — **realize the existing schema-v2.10 design**; don't reinvent chat.
- **DO NOT** require a phone number — or an email — for chat/identity; the app-only handle (§14.5) must always work; SMS stays a budget-capped edge fallback only.
- **DO NOT** enrich profiles without consent, sell enriched data, or **ever** enrich/cross-reference TLC clinical identities against online info (§14.6); **DO NOT** route SMS through a vendor for TLC.
- **DO NOT** treat TLC-domain identities as anything but ISO-1; PHI-walled, sovereign-only, never a vendor model, never enriched.
- **DO NOT** lock the pattern — **this is Darrell's decision to ratify** (he explicitly left it open); the agent surfaces the recommendation + trade-offs and stops.

---

## 16. Poe Properties — the FOURTH entity + the tenant MVP (ASAP track, Darrell 2026-06-09)

**Directive:** *"we want our tenants of Poe Properties to be able to use the PoeTech App ASAP for communication and service requests — upload and text and explain issues, put in work orders, and dispatch tickets."* This adds **Poe Properties as a fourth entity** alongside Church / TLC / PoeTech App, and is likely the **fastest path to real live users** because tenants are a **known, bounded set.**

### 16.1 The fourth entity + its isolation tier

**Four entities now:** **(1) Church (ISO-2)** · **(2) TLC (ISO-1, PHI)** · **(3) PoeTech App (ISO-3)** · **(4) Poe Properties (ISO-3-class).**

- **Tier:** **ISO-3-class**, like the App. **Tenant PII is consent-gated and never sold; it is NOT PHI.** Explicitly **distinct from TLC ISO-1** — tenants are a property-management relationship, not a clinical one. The TLC firewall is unaffected and unrelated.
- **Per-entity isolation holds:** own `instance_id`, RLS, never pooled with church/TLC. Behind the Cage like everything else.

### 16.2 Build on what EXISTS — `rentals` + `maintenance_requests` (do NOT start from scratch)

The repo **already has the tenant work-order/dispatch model** — it is the very table the event-center booking model (§2) was derived from. Verified in-repo:

| Existing table | Path | What it already gives the tenant MVP |
|---|---|---|
| **`rentals`** | `infra/supabase/schema-v2.2-rentals.sql:34` | The property/unit a tenant belongs to. |
| **`renters`** | `schema-v2.2-rentals.sql:90` | The tenant person record (+ `renter_household_members:138`). |
| **`leases`** | `schema-v2.2-rentals.sql:187` | The tenancy. |
| **`maintenance_requests`** | `schema-v2.2-rentals.sql:283` | **THE work-order / service-request / dispatch-ticket lifecycle — already built.** Has `submitted_via` (incl. **`renter-portal`**, `sms`, `email`, `phone`), `category` (plumbing/electrical/hvac/…), `urgency` (`emergency/urgent/normal/low`), `description` (free-text "explain the issue"), `renter_id`, **`assigned_to_user_id`** + **`vendor_name`** + **`scheduled_at`** (= **dispatch**), and a `status` lifecycle (`new→triaging→scheduled→in-progress→awaiting-parts→resolved→declined`). RLS already in place; `lifecycle`/`links` already present. |

**The mapping is one-to-one — extend, don't rebuild:**
- **Service request** = a `maintenance_requests` insert with `submitted_via='renter-portal'`.
- **"Upload and text and explain"** = `description` (free-text) + **photo/file attachments via the existing messaging `message_attachments` + storage bucket** (`IN-APP-MESSAGING` §2), with a `conversations` thread **linked** to the request (`links`/`linked_entity_kind='maintenance_request'`).
- **Work order** = the same row progressing through `status`.
- **Dispatch ticket** = `assigned_to_user_id` + `vendor_name` + `scheduled_at` (assignment to a tech/vendor) — already modeled.
- **Communication** = the **OTT/in-app messaging substrate (§13)** — a tenant↔manager thread per request; ntfy/Web-Push delivery; no phone number required (§13.5).

**Minimal additive work (per `MODULAR-EXTENSIBILITY`, optional fields default-safe):** an optional `maintenance_request_attachments` view over `message_attachments` (or reuse directly), and a tenant-facing read/insert RLS scope (a renter sees **their** requests). That's the extent — the spine exists.

### 16.3 Tenant identity = the member model (fast)

Tenants authenticate via the **member multi-anchor + consumer-OIDC** path (§14.1b: Sign in with Google/Apple/Microsoft) + phone + app-handle (§14.5), under **progressive-trust** (§14.1c: 2+ corroborating sources → "known" → frictionless). Because **tenants are a known, bounded set** (we already hold their lease records in `renters`/`leases`), verification is easy and onboarding is fast — the likely **fastest path to real live users.** Federation-into-sovereign-store, consent, never-sold all hold; **TLC firewall irrelevant/excluded** (different entity, no PHI).

### 16.4 Why this is a near-term quick win (independent of the church grant)

The Poe Properties tenant MVP **does NOT depend on the §3.0 church Workspace grant** — it rides **existing repo schema** (`rentals`/`maintenance_requests`), the **existing messaging substrate** (§13), and the **member identity path** (§14.1b/c). It can ship on its own ASAP track (§7, "Poe Properties tenant MVP"), behind the Cage, **ahead of the church ingestion work.**

---

## 17. The calendar system, redesigned (item G) — a staff-friendly single source that auto-publishes everywhere (Darrell 2026-06-09)

> **Directive:** *don't just "ask the church to publish iCal" — no one there understands iCal, which is exactly why they fall back to posting calendar IMAGES. Design a better system they can actually use, and write them a plain-language explainer.* This **supersedes** the earlier "ask them to publish iCal / subscribe to their feed" line (§4b/§8). **The church fills a form; the SYSTEM produces the feed.**

### 17.1 The problem with the old recommendation

"Publish an iCal feed" puts the burden on non-technical, elderly church staff to operate a format they've never heard of. When the tech feels out of reach, they fall back to what works — **posting a picture of the calendar.** A static image can't update everywhere, can't be searched, can't send a reminder, can't be read by a screen reader, and goes stale the moment anything changes. **The fix is not to teach them iCal; it's to remove iCal from their job entirely.**

### 17.2 The design — one friendly input, everything else generated

**Input (the only thing staff touch): a dead-simple calendar in the exclusive church app (Surface B, §10).** Two ways in, both zero-jargon:
1. **A friendly "Add / edit an event" form** — title, date, time, location, "who's it for," optional description. **Recurrence is plain-language, not RRULE:** chips/dropdowns like *"every Sunday,"* *"every Wednesday,"* *"2nd Monday each month,"* *"one time only"* — the system translates these into the `events.recurrence_rule` (RRULE) behind the scenes; **staff never see or type a recurrence string.** Templates pre-load the known services (Sun 11 AM Worship; Wed Bible Study + Bible Trivia; monthly Zoom National Assembly 2nd Mon 7:30 PM CT) so the calendar is correct on day one and staff just tweak.
2. **Approve LLM-extracted events (item G):** the LLM reads meeting notes / announcements and **proposes** calendar entries; a staff member taps **Approve** (the item-G green-light, §6.2 of PR #8). No typing at all in the common case.

Both paths are **mobile-friendly**, show a **plain preview** ("Here's what people will see"), and require **no knowledge of feeds, formats, or sync.**

**The system is the single source of truth and AUTO-PUBLISHES everywhere (all generated, never hand-edited):**

```
   STAFF (friendly form  OR  approve LLM-extracted events — item G green-light)
                              │   the ONLY human touchpoint
                              ▼
                   events table  (single source of truth; recurrence generated, not typed)
                              │
        ┌──────────────┬──────────────┬───────────────┬─────────────────────┐
        ▼              ▼              ▼               ▼                     ▼
  Public Church-tab   service-       Reminders /     Generated iCal/ICS    (future) any
  calendar (Surface   calendar.json  notifications   FEED endpoint —       new surface,
  A) — always         (GPU service-  (OTT in-app +   the system EMITS      free, because
  current             blackout)      ntfy, §13)      .ics; church never    it reads the
                                                     hand-edits a feed     one source
```

- **The iCal/ICS feed is an OUTPUT, not an input.** Anyone who *wants* a subscribable feed (a member who likes Google/Apple Calendar) gets one — the system **generates** `/calendar.ics` from the `events` table (an app endpoint or n8n workflow). **The church never creates, edits, or understands it.** This is the inversion of the old recommendation.
- **One source, many generated artifacts ⇒ no drift.** Change a service time once in the form → the public calendar, the GPU blackout (`service-calendar.json`), the reminders, and the iCal feed all update together. No re-posting a picture; no second calendar to keep in sync.
- **Reconciliation / governance:** unchanged from item G — the **staff green-light is the gate** (§6.2, an §8 irreducible final green-light); everything downstream is a **derived artifact**, so there is nothing to hand-reconcile. Behind the Cage; church = ISO-2; doctrine/публish gate applies to any public copy change.

### 17.3 Builds on what exists
- **`events` table** (`schema-v2.8-ops.sql:215`) with `recurrence_rule` — the form **generates** the RRULE; the table is unchanged.
- **`service-calendar.json` + loop (G)** — now *fed by the staff calendar* instead of waiting on the church to publish anything.
- **OTT messaging (§13)** for reminders; **Surface A/B (§10)** for the public view + the staff editor; **Module-Library Tier 2** so any partner church gets the same friendly calendar.

### 17.4 The church-facing explainer (B) — a shareable one-pager
A plain-language, no-jargon explainer for church staff/leadership — *why this replaces posting calendar images*, in their terms — lives as a **separate, shareable sibling doc** so it can be handed to the church directly:

> **[`docs/99-session-notes/2026-06-09-church-calendar-explainer-for-staff.md`](2026-06-09-church-calendar-explainer-for-staff.md)**

It is written warmly and simply (for people who currently use images because the tech felt out of reach) and is **church-facing content (ISO-2)** — screened against the Religion-AND-Relationship test (backbone + warmth) per `CLAUDE.md`.

---

## Sources / grounding

**Repo (read this session, building-on):**
- `docs/99-session-notes/2026-06-08-research-review-church-network-llm-eval-and-app-review.md` — the canonical PR #8 three-entity system (this module fits inside it).
- `infra/supabase/schema-v2.8-ops.sql` (events, report_snapshots, subscriptions, checkout_intents), `schema-v2.7-church.sql` (church domain), `schema-v2.1-infra.sql` + `schema-v2.9-portal-rls.sql` (external_users/portal), `schema-v2.2-rentals.sql` (booking template).
- `infra/ai-orchestrator/` — the Cage (allowlist, `sql/001-audit-ledger.sql`, health gate, schedule boundary).
- `docs/00-foundations/_root/WORKFLOW-MODULE-LIBRARY.md`, `INSTITUTIONAL-MEMORY-EVENTS.md`, `AI-FOUNDATION-INTERNAL-OPERATIONS.md`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `COMMUNITY-FIRST-MISSION.md`, `VISION-FAIRNESS-STANDARD.md`, `RELEASE-TIERS.md`, `LESSONS-LEARNED.md` (P10/P11/P12).
- `infra/n8n/` + `project_n8n_same_origin_rewrite` + CLAUDE.md dispatch-status convention (the runner + read path + telemetry).
- `app/src/poe-financial-mvp-v28.jsx` — the hardcoded COLG service-times seed to deprecate.

**Part II (read this session, building-on):**
- `docs/00-foundations/_root/CHURCH-TAB-DIRECTORY.md` — the front-door Church Tab + COLG/Love Corner default + Mars Hill Option B progressive disclosure + multi-church directory (Surface A).
- `docs/00-foundations/IN-APP-MESSAGING-LAYER-1-DESIGN.md` — the already-approved in-app messaging design (schema-v2.10: conversations/messages/group chats, n8n `messaging-fanout`, ntfy push, TLC `is_clinical` isolation, Matrix Layer-4). + `infra/supabase/seed-2026-05-26-in-app-messaging.sql`.
- `docs/00-foundations/_root/IDENTITY-ROLES-AUDIT.md` — 5 roles + scope modifiers (unit-leader = Editor scoped to unit) + Phase 3 cloud-auth → Phase 4 SSO/SAML/OIDC + BAA tier.
- `docs/00-foundations/_root/MODULAR-EXTENSIBILITY.md` + `MULTI-INSTANCE-STRATEGY.md` — one-codebase-many-instances; per-entity instance shape, not bespoke builds.
- PR #8 §7 (identity layer **I** — self-hosted IDP/SSO candidates Authentik/Keycloak/Zitadel; sovereign email) + §2.2 (TLC ISO-1 firewall).
- memory: `project-brand-surface-hosting-map` (COLG site = Turbify — the conflicting mail-host signal), `project-non-denominational-word-first-body-undivided`, `feedback-autonomous-automation-three-brakes`.

**Workspace inventory (2026-06-09 — REAL findings, §3.0):** church live ops run on a **separate Workspace `@thechurchofthelivinggod.com`** — primary/admin **`info@`** (grant target + identity anchor + ConvertKit sender), staff `eldressredding@`/`bg@` — + **ConvertKit** + **Zoom** + `thelovecornermedia@gmail.com`. **FOUND/seedable:** TCOTLG Registration Form (`1a3-7OgQcRPN8MkdVNI1dr-5_GoFW22uObJ4a3PwufXQ`, responses inside the Form → Forms API), Gwin Home-going Responses sheet (`1qkbpDj0hrFgcKHn6LgMdsiVx2i5PiwBmqQL8-T_wGJs`). **NOT in connected account → grant:** rosters/bios, annual giving/attendance, event-center bookings. Building: 312 E. Bradley Ave, Champaign IL, ~44,000 sqft. **The mail-host question is RESOLVED: Google Workspace** (Turbify hosts only the website) — §14.2.

**⭐ Church Plus on the church NAS (web research, 2026-06-09 — §3.1.6; UNCONFIRMED which product the church runs):**
- PowerChurch Plus — product page: https://www.powerchurch.com/pcplus/
- **PowerChurch Plus on a NAS (KB 487):** https://www.powerchurch.com/support/487/1/installing-powerchurch-plus-on-a-nas-network-attached-storage-device
- PowerChurch DB / ODBC (Visual FoxPro `.DBF`): https://www.powerchurch.com/forum/viewtopic.php?t=396
- PowerChurch CSV/giving export limitations: https://www.powerchurch.com/forum/viewtopic.php?f=1&t=11530
- PowerChurch system requirements / networking: https://www.powerchurch.com/products/pcplus/systemrequirements/
- ChurchPlus.co (the DIFFERENT cloud SaaS — vendor cloud, not NAS-hostable): https://churchplus.co/ · https://www.capterra.com/p/10015081/ChurchPlus/
- *Caveat: product/version on the church's NAS is UNCONFIRMED; confirm with Darrell before building the §3.1.6 adapter. No schema fabricated.*

---

*Build on what exists; do not start from scratch. Mirror the church's data before replacing it; converge to sovereign on a clean soak. The `events` table is the one calendar; loop (G) keeps it true. Participants and speakers are people, handled with consent, isolated to the church, never sold, never near the TLC firewall. The LLMs do the ingesting; the staff bless the publishing. Four brakes hold, read-only first, inactive until watched, autonomy earned per surface. One module, reusable for the next church, every sync remembered as an Event. A front door for everyone and a deeper room for the called — one substrate, two views — and the same shape ready for every business at its own tier, with the firewall holding so no clinical word ever crosses. Ministry units gather and their leaders shepherd; the people talk inside the app with no phone number between them, identity carried by the name on their own house's door — bg@thechurchofthelivinggod.com. We serve the Father's Business with the church's own data, and we do not start over. The decision is Darrell's to make. Amen.*
