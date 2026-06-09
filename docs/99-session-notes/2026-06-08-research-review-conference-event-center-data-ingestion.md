# Research Review + Architecture Spec — Conference Module & Event Center: Ingesting the Church's Existing Data (Don't Start From Scratch)

**Date:** 2026-06-08 (Mon)
**Author:** Claude (research-review + architecture spec on Darrell's commission, per `feedback-research-first`)
**Triggered by:** Darrell — *"Can the conference module and other systems pull in the current conference data the church is collectively gathering from each participant and each speaker, also the weekly schedule and the annual results, and build so we don't need to start from scratch — also the event center schedule and open times, all processed by the PoeTech App."*
**Status:** Research-review + design doc. **No code, no workflow changes, nothing applied to the NAS or Supabase.** Decision support + target architecture only.
**Output gate:** binding filters — the **TLC ISO-1 firewall** (senior everywhere), **"we do not sell data"** (binding — §7 of PR #8), `feedback-autonomous-automation-three-brakes` (the four brakes), RELEASE-TIERS Tier C for anything timer-driven, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION`, `COMMUNITY-FIRST-MISSION`, `WORKFLOW-MODULE-LIBRARY`, `INSTITUTIONAL-MEMORY-EVENTS`, `AI-FOUNDATION-INTERNAL-OPERATIONS` (systems use APIs, not browsers).
**Fits inside (does not contradict):** `docs/99-session-notes/2026-06-08-research-review-church-network-llm-eval-and-app-review.md` (PR #8 — the canonical three-entity system). This module is the **Church entity (ISO-2)** ingestion concretized: it is the data substrate under loops **F/G/H/I/J** and the first real instance of the **WORKFLOW-MODULE-LIBRARY** Church/Event module.
**Builds on (verified in-repo, not from scratch):** `infra/supabase/schema-v2.8-ops.sql` (the `events` table), `infra/supabase/schema-v2.7-church.sql` (parishioners, service_offerings, ministries, ministry_signups), `infra/supabase/schema-v2.1-infra.sql` + `schema-v2.9-portal-rls.sql` (external_users, interactions, invite tokens), `infra/ai-orchestrator/` (the Cage), `service-calendar.json` + loop **(G)**, `docs/00-foundations/_root/WORKFLOW-MODULE-LIBRARY.md`, `docs/00-foundations/_root/INSTITUTIONAL-MEMORY-EVENTS.md`. **Part II additionally builds on:** `docs/00-foundations/_root/CHURCH-TAB-DIRECTORY.md` (the front-door tab + Mars Hill progressive disclosure), `docs/00-foundations/IN-APP-MESSAGING-LAYER-1-DESIGN.md` (**the in-app group chat already designed** — schema-v2.10-messaging, ntfy push, Matrix Layer-4), `docs/00-foundations/_root/IDENTITY-ROLES-AUDIT.md` (5 roles + scope modifiers + the Phase 3→4 SSO path), `docs/00-foundations/_root/MODULAR-EXTENSIBILITY.md` + `MULTI-INSTANCE-STRATEGY.md` (one-codebase-many-instances), PR #8 §7 (the first-party identity layer **I**).

> **Part II (§10–§15)** folds in Darrell's 2026-06-08 follow-up directives: the **two-surface model** (front-door tab + exclusive gated deeper app) generalized to **all entities**; **ministry units + unit leadership + in-app group chat with no phone number**; and **domain-based multi-entity identity** (church staff on `@thechurchofthelivingGod.com`, etc.). Part I (the Conference/Event ingestion) is unchanged; Part II is the surfacing/placement/identity layer on top of the same ingested data model + Cage pipelines.

---

## TL;DR (read this first)

1. **We do NOT start from scratch — ~70% of the substrate already exists.** The `events` table (with `recurrence_rule`, `lifecycle`, `links`), the church domain (`parishioners`, `service_offerings` whose `service_kind` enum **already includes `'conference'` and `'revival'`**, `ministries`, `volunteer_hours`), the **external-participant portal pattern** (`external_users` + `external_invite_tokens` + `interactions`), the Cage, and the `service-calendar.json` + loop **(G)** pipeline are all present. We **extend**, we don't rebuild. (§1)
2. **The four ingestion surfaces map cleanly onto existing patterns** (§2/§4): **participants/speakers** → extend the `external_users`/portal pattern + two new tables; **weekly schedule** → loop **(G)** already owns `service-calendar.json`, surface it in `events`; **annual results** → a computed `report_snapshots` rollup over data we already capture; **event-center availability** → a new bookings pair modeled on the proven `rentals`/`maintenance_requests` shape.
3. **CONNECTOR GAP — flagged precisely, not papered over (§3.0):** **no Google Drive / Calendar / Gmail / Sheets / Forms connector is currently connected in this session** (`list_connectors` returned empty; registry search returned empty; no Google tools are present). **I therefore could NOT inspect the church's live Workspace data** and did not fabricate any. This is *not a design blocker* — per `AI-FOUNDATION-INTERNAL-OPERATIONS` the **production** ingestion path is **n8n on the NAS calling the Google Workspace API directly** (service account / OAuth), **not** a Claude-session connector. The connector is only needed for one-time human-driven *discovery/scouting*. See §3.0 for exactly what to connect and what is still unknown.
4. **Source-of-truth is explicit per surface (§4), and "mirror first, converge later" is the rule:** the church's *existing* collection points (Forms/Sheets/Calendar) stay the source of truth at first; the App ingests a **read-only idempotent mirror**; only after that proves clean does a **sovereign registration form / bookings surface** become the new forward source of truth. We never rip out what the church already uses mid-stream.
5. **Everything rides the Cage (§5).** Ingestion is **timer-driven**, so it is **Tier C** and needs all **four brakes** (budget + concurrency lock + kill-switch + human-presence preempt), the **allowlist**, the **append-only hash-chained ledger**, and the **health gate**. Ships **inactive → read-only with someone watching → never unattended/while traveling** (P11/P12).
6. **LLMs do the work; staff reserved for green-lights (§5/§8 of PR #8).** Extraction, normalization, dedup, conflict-flagging, draft summaries = **LLM-executed end-to-end behind the Cage**. The human gate is **only** the ISO-2 doctrinal/publish green-light and the calendar green-light — judgment, not toil.
7. **It ships as a reusable Module-Library module (§6):** "Conference & Event Center Module," **Tier 2 (community-template)**, config-driven (calendar IDs, form/sheet IDs, room list, tier caps), validation-gated before `active`, every ingest/booking/publish emitted as an **Event** (institutional memory).
8. **Timeline is first-pass + living (§7), per the PR #8 data-driven convention** — anchored 2026-06-08, re-baselined against telemetry. Phase 1 (schema + read-only mirror) ~2-3 wk after go-ahead **and** Workspace API credentials; weekly-schedule surfacing rides loop **(G)** (~2026-08–09).

**Part II — surfacing, units, messaging, identity (Darrell directive):**

9. **Two surfaces, generalized (§10):** a **public front-door tab** (lighter, already specced as the Church Tab with Mars Hill progressive disclosure) + an **exclusive, access-gated deeper app/instance** (full management/write). Presented as a **multi-entity pattern** — each business/entity (Church, TLC, PoeTech, future adopters) gets the same shape **at its own isolation tier** — **with trade-offs, Darrell's to ratify** (he explicitly left it open: *"or whatever we decide works best for all businesses"*). **TLC ISO-1 is the stress test**; the pattern's gating must keep PHI walled (§10.4).
10. **Both surfaces read the SAME ingested data model + Cage pipelines (§10).** The exclusive app just exposes **more** of it with write/management capability **behind staff green-lights**. Not two data stores — one substrate, two views.
11. **Ministry units + unit leadership (§11/§12):** model **units within ministries** (ministry → unit → members + unit-leader role) on top of the existing `ministries`/`ministry_signups` tables and the **IDENTITY-ROLES-AUDIT scope-modifier** (a unit leader = an Editor **scoped to their unit**). Per-unit leadership tooling (roster, scheduling, comms) lives in the exclusive app.
12. **In-app group chat, NO phone number (§13) — largely already built.** `IN-APP-MESSAGING-LAYER-1-DESIGN.md` (schema-v2.10-messaging) already defines `conversations`/`messages`/group chats, **ntfy** as the self-hosted push substrate on the DS1621xs, and **Matrix (Synapse) as the Layer-4 sovereignty-max** option. A ministry-unit chat is a `conversations` row `kind='group'` linked to a unit; **identity = the app login (SSO), not a phone number**; SMS is only an opt-in Layer-2 fallback. **Recommendation: reuse the existing Layer-1 design + ntfy; do NOT bolt on a heavy third-party chat SDK; keep Matrix as the deferred Layer-4.**
13. **Domain-based multi-entity identity (§14):** the PR #8 identity layer **I** is **multi-domain** — Church staff/leaders on **`@thechurchofthelivingGod.com`** (e.g. `bg@thechurchofthelivingGod.com`, Bishop Gwin), TLC on `@tlctherapysolutions.com`, PoeTech on `@poetech.us`. **Staff/unit-leader SSO + group-chat identity key off these domain emails** — that is the no-phone anchor. **Open current-state question:** is `thechurchofthelivingGod.com` mail on Google Workspace today or elsewhere (the site is Turbify-hosted)? **Recommend: federate/SSO-bridge during MVP, sovereign multi-domain mail on the NAS as the long-arc** — don't block MVP on full sovereign mail (MVP-pragmatism). Church identities = ISO-2; **TLC-domain identities = ISO-1, PHI-walled.**
14. **All of Part II is reusable per the Module Library** — "ministry-units + unit-chat" and "front-door-tab + gated-deeper-app" are **configurable modules / a per-entity instance shape**, not a COLG one-off; a partner church (or any business) drops into the same shape as its own sovereign node/instance.

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
- **No live calendar sync** — the JPG→`service-calendar.json` link is loop (G), not yet built. (→ §4b)
- **CONNECTORS** to the church's actual Google Workspace data — **not connected in this session** (→ §3.0).

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

### 3.0 The connector situation — exact truth, no fabrication

**What I checked this session:** `list_connectors` → `{"connectors":[]}` (none installed). Registry search for Google Drive/Calendar/Gmail/Sheets/Forms → `{"results":[]}`. No Google tools appear in the available tool set. **Conclusion: I have no read path to the church's live Google Workspace data from this session, so I inspected none and invented none.**

**Why this is not a blocker (and points to the *right* architecture):** per `AI-FOUNDATION-INTERNAL-OPERATIONS` — *"anything that is a click today should be an API call tomorrow; browsers are for humans deciding things, not for systems doing things."* The **production** ingestion path must NOT be an interactive Claude-session connector (those are absent in headless/cron runs anyway — a known caveat). It must be **n8n on the NAS authenticating to the Google Workspace API directly** with a **service account (domain-wide delegation) or OAuth**, read-only scopes, credentials in the n8n credential store. The session connector is useful **only** for one-time human-driven discovery ("which Sheet/Calendar/Form actually holds the conference data?").

**Precise connector/credential gaps to close (action items, not assumptions):**
1. **Google Calendar (read-only)** — for the weekly schedule + any existing resource/room calendars (event-center availability). Scope `calendar.readonly`. *Unknown until connected:* whether COLG keeps service times and room bookings in Google Calendar at all, and the calendar IDs.
2. **Google Sheets (read-only)** — the most likely home of "collectively gathered" participant + speaker data. Scope `spreadsheets.readonly` + `drive.readonly` (to locate the files). *Unknown:* file IDs, tab/column shapes, whether one sheet or many.
3. **Google Forms / Drive** — if registration is via Forms (responses land in a linked Sheet → ingest the Sheet). *Unknown:* whether Forms is used.
4. **Gmail (read-only, optional, later)** — only if registrations/speaker confirmations arrive as email; lowest priority, highest noise. Keep out of v1.
5. **Sovereign service-account provisioning** in Google Workspace admin — a **decision/access only Darrell or the church admin can grant** (per Drive-Don't-Delegate exception: a credential only they hold).

Until #5 is granted, Phase 1 can still proceed on **schema + a manual CSV/Sheet export drop** into the `poetech-briefing` bind mount (the church exports once; n8n ingests the file idempotently) — proving the whole pipeline before live API access exists.

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

### 3.2 The Cage, concretely (this is Tier C, never Tier A)

- **Allowlist:** add read-only fetch actions (e.g. `fetch_google_sheet.sh`, `fetch_google_calendar.sh`, `ingest_bind_mount_csv.sh`) to `scripts/actions/` + `ACTIONS_ALLOWLIST`. **No write-back-to-Google action** in v1.
- **Audit ledger:** one hash-chained `ai_audit_ledger` row per sync run (source, watermark, counts, conflicts).
- **Health gate:** 120 s Uptime-Kuma check; failed ingest rolls back the batch.
- **Four brakes:** budget (per-run ceiling), concurrency lock (single-instance skip), kill-switch (dead-man's-switch auto-pause), human-presence preempt (a human at the keyboard reclaims the GPU). **Ships `inactive` → read-only with someone watching → never unattended or while Darrell travels** (P10/P11/P12; the 2026-06-06 runaway is the reason).

---

## 4. How each surface flows in and gets surfaced in the App

### 4a. Participants + speakers (the "collectively gathered" conference data)
- **Source of truth (now):** the church's existing Google Sheet(s)/Form(s) where registrations and speaker bios are gathered. **Mirror, don't replace.**
- **Flow:** Sheets/Form-response delta → LLM normalize (map columns, split name/email/phone, classify role) → **resolve identity**: match to a `parishioner` (by email/phone/household) or create an `external_user` (existing portal) → upsert `event_participants` / `event_speakers` (+ `session_speakers`). Conflicts (duplicate person, ambiguous match) are **flagged, not auto-merged** — staged for a human.
- **Consent + PII (§5.4):** `consent_flags` captured per participant; speaker `consent_to_publish` defaults **false**. PII isolated to ISO-2; never on the TLC path; never sold.
- **Surfaced in the App:** a Conference view (roster, session sign-ups, speaker cards). Speaker cards and any public roster publish **only after the ISO-2 green-light**.
- **Converge later:** once the mirror is clean, stand up a **sovereign registration form** (own IDP/identity layer (I)); flip `ingestion_sources.is_source_of_truth` to the sovereign surface; the Google Sheet becomes a legacy read.

### 4b. Weekly schedule (services + events)
- **Source of truth:** **`service-calendar.json`, maintained by loop (G)** (PR #8 §6.2) — this is the already-decided answer to the static-JPG problem; we do **not** invent a second mechanism. Reconciliation order: loop (G)'s staff-green-lit decisions **win**; the JPG and the hardcoded `COLG_DEFAULT_CHURCH.services` seed are **deprecated** in favor of it.
- **Flow:** (G) emits `service-calendar.json` → ingest into `events` rows (recurring services as `recurrence_rule`; one-offs as dated rows) → the **same `events` table** feeds (1) the PWA weekly-schedule surface and (2) the **GPU blackout scheduler** (one source of truth for both). If COLG ever publishes a real iCal, the source flips to a subscribed feed (the `ingestion_sources` row just changes `source_system`).
- **Confirmed cadence to reconcile against:** Sun Worship 11 AM; Wed Bible Study 1 PM + 6 PM; office hours M–F 11 AM–6 PM. **No iCal feed exists** (confirmed 2026-06-08).
- **Surfaced:** the Church tab weekly schedule reads `events`, not the hardcoded seed.

### 4c. Annual results (year-over-year outcomes)
- **Source of truth:** the **transactional tables we already capture** — `service_offerings` (giving, incl. `service_kind='conference'`), `attendance_records` (new), `volunteer_hours`, `event_participants`, `ministry_signups`, `events`. Annual results are **derived, never hand-keyed.**
- **Flow:** nightly recompute → `annual_results_snapshots` (per `year`, per `scope`) → persisted through `report_snapshots` for audit/replay. LLM drafts a narrative summary; the numbers are SQL, not LLM (no fabrication of outcomes).
- **Surfaced:** an Annual Results / year-over-year dashboard (attendance trend, giving trend, registrations, volunteer hours, new members, sessions held). Honors `DATA-AS-EMPOWERMENT`: aggregate, internal, never sold.
- **Backfill:** prior-year results the church already has (in Sheets/PDFs) ingest **once** as historical `annual_results_snapshots` rows tagged `source_system='historical-import'`.

### 4d. Event-center schedule + open/available times
- **Source of truth (now):** whichever the church uses — a Google (resource) Calendar or a booking Sheet. Mirror it. **Converge** to the sovereign `event_center_bookings` table as the forward source of truth.
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
| **P0 — Discovery + creds** | Human-driven: locate the actual Sheets/Calendars/Forms; provision the read-only **Google Workspace service account** (or CSV-drop fallback). | **Darrell/church-admin grant** (§3.0 #5); connector OR n8n API creds | **~3–5 days** (gated on the grant) |
| **P1 — Schema + read-only mirror** | Land the §2 tables; build the Tier-2 ingestion workflow; ingest participants + speakers **read-only** behind the Cage; ship **inactive → watched**. | P0; the Cage brakes | **~2–3 wk** after P0 |
| **P2 — Weekly schedule surfacing** | Wire `service-calendar.json` → `events` → PWA + GPU scheduler; deprecate the hardcoded seed. | **loop (G)** (PR #8 ~2026-08–09) | **rides (G), ~2026-08–09** |
| **P3 — Event-center bookings + availability** | `event_center_resources`/`bookings`; conflict check; availability view; request→approve flow. | P1; resource/room list | **~2026-09** |
| **P4 — Annual results** | Computed `annual_results_snapshots`; historical backfill; dashboard. | `attendance_records` populated; `service_offerings` | **~2026-09–10** |
| **P5 — Sovereign converge + Module packaging** | Sovereign registration form (identity layer **I**); flip source-of-truth; Tier-2 validation gate + library index entry. | identity layer (I) (PR #8 ~2026-09–11) | **~2026-10–11** |
| **P6 — Scoped autonomy per surface (J)** | Graduate stable surfaces from read-only to scoped autonomous execution behind the Cage. | clean soak per surface | **Q4 2026 → 2027, earned** |
| **PII — Front-door tab surfacing (Part II)** | Surface conference info / weekly schedule / event-center open times in the existing Church Tab (read-only, public-safe view); no new surface — extend `CHURCH-TAB-DIRECTORY.md`. | P1/P2/P3 data flowing | **rides P1–P3 (~2026-08–09)** |
| **PIII — Exclusive deeper app (gated)** | Access-gated management surface (full conference mgmt, bookings, annual-results dashboards, staff green-light queues). Gated on identity layer **I** + role model. | identity layer **I** (PR #8 ~2026-09–11); role gating | **~2026-10–11** |
| **PIV — Ministry units + unit leadership** | `ministry_units` + `ministry_unit_members` + unit-leader scope; unit-leader view in the exclusive app. | role/scope model | **~2026-09–10** |
| **PV — In-app group chat (no phone)** | Realize the already-designed Layer-1 messaging (schema-v2.10) for ministry-unit group chat; ntfy push; identity = SSO. | identity layer **I**; messaging Layer-1 (already designed, post-vacation weeks 1–4) | **~2026-09–10 (chat infra largely pre-designed)** |
| **PVI — Multi-domain identity / SSO** | Multi-domain sovereign IDP/SSO (church/TLC/PoeTech domains); staff domain-email anchor; federate-bridge MVP → sovereign mail long-arc. | PR #8 layer **I**; Workspace current-state answer | **MVP bridge ~2026-09; sovereign mail long-arc** |

**Hard dependencies:** (1) the **Google Workspace read access grant** (only Darrell/admin can give it); (2) **loop (G)** for the weekly-schedule truth; (3) the **Cage** four brakes proven; (4) the **identity layer (I)** for the sovereign converge; (5) **subscription-tier caps** (`checkout_intents` tiers) for who can host what size event.

---

## 8. Recommendation + rationale (what / not-what / because)

**Recommendation: build the Conference & Event Center module as an *additive, idempotent, read-only-first mirror* of the church's existing Google data, on top of the `events` table and the external-participant portal, behind the Cage, packaged Tier-2 — and DO NOT rebuild anything that already works or invent a parallel calendar.**

1. **DO extend `events` + the portal pattern, not rebuild.** ~70% of the substrate exists (§1); a session is an `events` row, a non-member participant is an `external_user`, bookings copy the `rentals` lifecycle, annual results compute through `report_snapshots`. *Because* the fastest correct path is the one that reuses proven, RLS-protected, audited tables.
2. **DO mirror-first, converge-later.** Keep the church's Sheets/Forms/Calendar as the source of truth until the mirror is clean; only then flip to a sovereign surface. *Because* ripping out what 44,000-sqft, elderly-tech-novice staff already use mid-stream is exactly the failure `COMMUNITY-FIRST-MISSION` warns against.
3. **DO run ingestion as n8n-on-NAS against the Google API, not session connectors.** *Because* `AI-FOUNDATION-INTERNAL-OPERATIONS` says systems use APIs not browsers, and session connectors are absent in headless/cron runs (and are absent right now — §3.0).
4. **DO treat every sync as Tier C with all four brakes, shipped inactive.** *Because* it is timer-driven; the 2026-06-06 runaway is the binding precedent (P10/P11/P12). Sovereignty of location does not bound blast radius.
5. **DO let LLMs do the extraction/normalization/dedup end-to-end; reserve staff for the ISO-2 green-light only.** *Because* PR #8 §8 — brakes prevent runaway, human gates are for judgment (doctrine/publish), not toil.
6. **DO hold PII consent-gated, ISO-2-isolated, never sold, never on the TLC path.** *Because* binding (`DATA-AS-EMPOWERMENT`, the TLC firewall, "we do not sell data").
7. **DO package Tier-2 with a validation gate and Events-as-data from day one.** *Because* the next church in the network should get this by config, and the wf30 silent-fail lesson says nothing flips `active` un-smoke-tested.
8. **DO surface the weekly schedule through loop (G)'s `service-calendar.json`, one source of truth for both the PWA and the GPU scheduler.** *Because* a second calendar mechanism would re-create the static-JPG divergence PR #8 already solved.

**DO NOT:**
- **DO NOT** fabricate church data or assume sheet/calendar shapes — **the live Google data was not inspectable this session** (§3.0); P0 discovery resolves it.
- **DO NOT** auto-publish any roster, speaker card, or schedule change without the ISO-2 human green-light (§5).
- **DO NOT** grant ingestion autonomy before the Cage is proven on that surface, and never while traveling/unattended.
- **DO NOT** let any TLC/PHI data touch this module.
- **DO NOT** block schema + pipeline work on the connector grant — the CSV-drop fallback (§3.0) proves the pipeline before live API access exists.

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
- Confirmed service cadence + "no iCal feed" fact (2026-06-08).

**UNKNOWN / NEEDS A CONNECTOR OR A HUMAN GRANT (not invented):**
- **Whether the church's conference/participant/speaker data lives in Google Sheets, Forms, Calendar, or elsewhere — and the specific file/calendar IDs.** No Google connector is connected this session; live data was not inspectable.
- **The actual column/tab shape** of the registration + speaker sheets (needed for the normalize step).
- **Whether COLG uses a Google resource Calendar for the event center**, or a booking sheet, or paper.
- **Whether prior-year annual results exist as Sheets/PDFs** for historical backfill, and in what form.
- **The room/resource list** of the 44,000-sqft building and each room's `open_hours`/features.
- **The Google Workspace read-only service-account grant** (admin action — Darrell/church only).

These unknowns are resolved by **P0 discovery** (§7) the moment a read-only Workspace connector/credential is granted; none of them block schema + pipeline work, which proceeds on the CSV-drop fallback.

**FOUND for Part II (build-on, not from scratch):**
- **The in-app group chat is already designed** — `IN-APP-MESSAGING-LAYER-1-DESIGN.md` (schema-v2.10-messaging: conversations/messages/group chats, n8n `messaging-fanout`, ntfy push, Matrix Layer-4). Phone-number-free at its core.
- **The front-door Church Tab is already specced** — `CHURCH-TAB-DIRECTORY.md` (COLG/Love Corner default, Mars Hill progressive disclosure, multi-church directory).
- **The role + per-unit scope model already exists** — `IDENTITY-ROLES-AUDIT.md` (5 roles, scope modifiers, Phase 3 cloud-auth → Phase 4 SSO/SAML/OIDC + BAA tier).
- **The one-codebase-many-instances commitment is already binding** — `MODULAR-EXTENSIBILITY.md` + `MULTI-INSTANCE-STRATEGY.md`.

**UNKNOWN for Part II (flag, don't assume):**
- **Is `thechurchofthelivingGod.com` email on Google Workspace today, or on Turbify (where the site is hosted), or elsewhere?** Conflicting signals (§14.2); confirm via MX/admin check or the church office. Gates both the SSO bridge and Part I's ingestion auth.
- **The church-staff/leadership roster + their domain-email accounts** (who is staff, who leads which unit) — needed to seed roles/scopes.
- **The ministry → unit breakdown** (which ministries have which units, and current unit leaders) — the church's own org structure; ingest or capture in Surface B.
- **Whether Darrell ratifies the two-surface pattern as the general shape** (§15) — explicitly his decision, left open.

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
| **`identity_domains`** | `id`, `instance_id`, `domain` (`thechurchofthelivingGod.com` \| `tlctherapysolutions.com` \| `poetech.us`), `idp_ref`, `mail_mode` (`bridge/sovereign`), `is_clinical` | The multi-domain identity registry (§14). Maps each entity to its email domain + IDP + mail-hosting mode. |

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

## 13. Messaging architecture — in-app group chat with NO phone number

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

## 14. Domain-based multi-entity identity (the SSO + group-chat anchor)

### 14.1 The model: one substrate, many domains

The PR #8 first-party identity layer **(I)** — a self-hosted IDP/SSO (Authentik / Keycloak / Zitadel candidates) — is **multi-domain**: one identity substrate serving each entity's own email domain.

| Entity | Identity domain | Example | Tier |
|---|---|---|---|
| **Church** | **`@thechurchofthelivingGod.com`** | `bg@thechurchofthelivingGod.com` (Bishop Gwin) | **ISO-2** |
| **TLC** | `@tlctherapysolutions.com` | staff practice accounts | **ISO-1 — PHI-walled** |
| **PoeTech** | `@poetech.us` | product/team accounts | ISO-3 |
| **Partner org** | their own domain | per sovereign node | their tier |

**Staff / unit-leader SSO login AND in-app group-chat identity key off these domain emails.** That is the concrete "no phone number" anchor for staff/leaders: identity is the **domain email**, federated through the SSO substrate. (Members may hold lighter identities — e.g., a magic-link/passkey account without a church-domain mailbox — but **staff/leaders are domain-email accounts**, which is also what makes the audit trail and the green-light authority legible.) This is the `IDENTITY-ROLES-AUDIT` **Phase 3 (cloud auth) → Phase 4 (SSO via SAML/OIDC)** path, made concrete and **per-domain**.

### 14.2 Open current-state question (flag, don't assume)

**Is `thechurchofthelivingGod.com` email on Google Workspace today, or elsewhere?** Two signals conflict and must be reconciled before MVP wiring:
- The **directive's signal**: the church uses Google Workspace (Drive/Calendar/Gmail) — which would put the domain mail on Workspace.
- The **repo's signal** (`project-brand-surface-hosting-map`): the **COLG website is Turbify-hosted** — Turbify also sells domain email, so the mailboxes **could** be on Turbify, not Workspace.

**This is unknown and must be confirmed** (a quick MX-record/admin check, or ask the church office). It also gates Part I's ingestion auth (§3.0) — same Workspace question.

### 14.3 Recommended path (with the sovereignty/cost screen)

| Phase | Approach | Trade-off |
|---|---|---|
| **MVP** | **Federate / SSO-bridge** the existing church-domain mail (whatever provider) into the self-hosted IDP via **OIDC/SAML** — login + identity work immediately; mailboxes stay where they are. | Fastest; uses the domain email as the SSO anchor today; **does not block MVP** on standing up sovereign mail. A retained external mail dependency (acceptable, bridged). |
| **Long-arc** | **Sovereign multi-domain mail on the NAS** — migrate the domains' mail to self-hosted (mailcow/Mailu-class) under the same IDP. | Full sovereignty ("the relationship and its signals are ours"); real operational cost (deliverability, spam, uptime) → **screen against the sustainability rule** before committing. |

**Recommendation:** **bridge during MVP (don't block on sovereign mail), converge to sovereign multi-domain mail on the NAS as the long-arc** — the same MVP-pragmatism / sustainability-beats-convenience rule the messaging doc applies. The **domain email is the SSO + group-chat identity anchor in both phases**; only the *hosting* of the mailbox changes.

### 14.4 Per-entity isolation holds in identity too

- **Church-domain identities = ISO-2** — used internally for discipleship/reach/leadership; doctrine gate on any outbound content.
- **TLC-domain identities = ISO-1, PHI-walled** — login/SSO for the public practice surface may exist, but **its clinical data and PHI never enter the shared analytics/identity decision-loop, never touch a vendor model** (PR #8 §2.2 / §7). The identity substrate is shared *as code*; the **TLC data is isolated by `instance_id` + `is_clinical` + separate keys**, never pooled.
- **No cross-instance role bleed** (`IDENTITY-ROLES-AUDIT` anti-pattern): a leader on the church instance does not auto-inherit rights on TLC or PoeTech, even with a similar email.

## 15. Part II recommendation + rationale (what / not-what / because) — Darrell's to ratify

**Recommendation: adopt the two-surface model (public front-door tab + exclusive gated deeper app) as ONE candidate instance of a GENERAL multi-entity pattern that holds for Church, TLC, and PoeTech at their own isolation tiers; realize ministry-units + the already-designed in-app group chat (ntfy, no phone number); and anchor staff/leader identity to per-entity domain emails through a multi-domain SSO, bridged for MVP and sovereign long-arc. Darrell ratifies the pattern; the agent does not lock it.**

1. **DO present the two-surface split as a general pattern, not a church one-off** — *because* Darrell said "or whatever we decide works best for all businesses," and `MODULAR-EXTENSIBILITY` + `MULTI-INSTANCE-STRATEGY` already commit the platform to one-codebase-many-instances. The Church/Conference module is the **first realization**, not the only shape.
2. **DO extend the existing Church Tab as Surface A** (don't build a new front door) and **build Surface B as the gated depth one login deeper** — *because* `CHURCH-TAB-DIRECTORY.md` already establishes the front-door + Mars Hill progressive-disclosure posture; Surface B just continues it one level.
3. **DO read both surfaces from the SAME ingested data model + Cage pipelines** — *because* one substrate / two views is the whole point; two data stores would re-create drift and double the ingestion surface.
4. **DO model ministry units with the existing role + per-unit scope modifier** (a unit leader = an Editor scoped to their unit) — *because* `IDENTITY-ROLES-AUDIT` already supplies this; inventing a new permission engine is waste.
5. **DO realize the already-designed Layer-1 messaging (Postgres + ntfy) for unit group chat; keep Matrix as the deferred Layer-4; reject heavy third-party chat SDKs** — *because* it's approved, partially built, sovereign, phone-number-free, and the lightest primitive that meets the need (dependency-skepticism + sustainability-beats-convenience).
6. **DO make identity multi-domain and anchor staff/leaders to their entity's domain email** (`@thechurchofthelivingGod.com`, `@tlctherapysolutions.com`, `@poetech.us`) — *because* it is the no-phone anchor, makes the audit trail and green-light authority legible, and is the natural Phase-3→4 SSO path.
7. **DO bridge mail for MVP, converge to sovereign NAS mail long-arc** — *because* MVP-pragmatism: don't block login on standing up sovereign mail; the domain email is the anchor either way, only the hosting moves. Screen the sovereign-mail step against the sustainability rule before committing.

**DO NOT:**
- **DO NOT** let the two-surface pattern imply one shared database across entities — **TLC stays its own isolated `instance_id` with `is_clinical` + separate keys; no PHI ever enters the shared substrate** (§10.4). The pattern is a shape, not a data pool.
- **DO NOT** put participant rosters, bookings, unit chat, or annual PII on the **public** front-door tab — those live only in the gated Surface B (§10.2).
- **DO NOT** build a parallel messaging system — **realize the existing schema-v2.10 design**; don't reinvent chat.
- **DO NOT** require a phone number for chat/identity; SMS stays an opt-in Layer-2 fallback only.
- **DO NOT** treat TLC-domain identities as anything but ISO-1; PHI-walled, sovereign-only, never a vendor model.
- **DO NOT** lock the pattern — **this is Darrell's decision to ratify** (he explicitly left it open); the agent surfaces the recommendation + trade-offs and stops.

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

**Connector check (this session):** `list_connectors` → empty; registry search (Drive/Calendar/Gmail/Sheets/Forms) → empty. **No live Google data inspected; none fabricated.** The `@thechurchofthelivingGod.com` mail-host question (Workspace vs. Turbify vs. other) is therefore **unconfirmed** — §14.2.

---

*Build on what exists; do not start from scratch. Mirror the church's data before replacing it; converge to sovereign on a clean soak. The `events` table is the one calendar; loop (G) keeps it true. Participants and speakers are people, handled with consent, isolated to the church, never sold, never near the TLC firewall. The LLMs do the ingesting; the staff bless the publishing. Four brakes hold, read-only first, inactive until watched, autonomy earned per surface. One module, reusable for the next church, every sync remembered as an Event. A front door for everyone and a deeper room for the called — one substrate, two views — and the same shape ready for every business at its own tier, with the firewall holding so no clinical word ever crosses. Ministry units gather and their leaders shepherd; the people talk inside the app with no phone number between them, identity carried by the name on their own house's door — bg@thechurchofthelivingGod.com. We serve the Father's Business with the church's own data, and we do not start over. The decision is Darrell's to make. Amen.*
