# One Infrastructure · One Input · Calm UX · Help — Grounded Plan

**Date:** 2026-06-30
**Status:** PLAN ONLY — for Darrell's approval. **No surfaces rebuilt.** Nothing in this doc has been applied.
**Author:** Ari (Claude), grounded in a real audit of the running app (`app/src`), not from memory.
**Governs / pairs with:** DR-0076 (Verification Doctrine — every claim below cites `file:line`), DR-0079 (one primitive per axis), DR-0061/0065 (surfaces are live views of real data; the app is the primary artifact), Anxiety-Clarity Principle (Help section), `feedback-research-first`.

---

## 0. How to read this

Darrell asked for **thoughts before work**: a grounded design doc covering five things — (1) unify all tabs onto **one infrastructure** (live data everywhere), (2) **one comprehensive input per tab** where it makes sense (a superset, no feature loss), (3) a **zero-feature-loss checklist** proving each merge drops nothing, (4) **declutter / calm UX** via progressive disclosure, and (5) a **Help "?" spec** per tab.

Everything here is traced to the real code. Where an earlier assumption proved wrong on inspection, this doc states the corrected truth (per DR-0076). **The single most important correction:** the app already has a beautiful "one input" primitive (`OneVoiceInput` + `one-voice-routing.js`) — but it routes several destinations to **localStorage-only** slices that never sync across devices. So the "one input" and the "one infrastructure" problems are the *same* problem wearing two hats.

**Decisions that need your sign-off are collected in §7.** Nothing gets built until you approve.

---

## 1. The real app today — tabs and their input surfaces (ground truth)

### 1.1 The nav as it actually renders

**Top nav** is a *single flat horizontal scroll strip* of **22 destinations** ([poe-financial-mvp-v28.jsx:5257–5327](app/src/poe-financial-mvp-v28.jsx:5257)), with one visual separator after "About":

`Big Picture · Books · Inbound · Real Estate · Projects · Practice · Dev/Ops · About` ⎜ `Notes · Create · Voice · Library · Chef's Corner · Study* · Church · Markets · Center* · CRM* · Inventory* · Forecast* · Succession* · Admin`

(`*` = family/Governor only; spread out of the DOM entirely for everyone else — good no-leak pattern.)

**Books sub-nav** (9): `Entities · Accounts · Debts · Tx · Imported · Cart · 1099s · Calendar · Legal` ([:5337](app/src/poe-financial-mvp-v28.jsx:5337)).

**Church sub-nav** (up to 12): `Church(home) · Engagement · Choir · Order of Service · Learn · Conference · Venues · The Word · Scripture` + staff-only `Harvest · Video Wall · Observation` ([:5349](app/src/poe-financial-mvp-v28.jsx:5349)).

> **Clutter finding #0 (structural):** 22 top-level tabs in one undifferentiated scroll strip is the single biggest calm-UX problem. The app *already* has a natural 5-section grouping — `start / money / business / create / church` — defined in the Help ROADMAP ([help-content.js:595](app/src/lib/help-content.js:595)) but **not reflected in the nav**. §5 proposes surfacing that grouping.

### 1.2 Input-surface census

A full per-tab inventory of every form/modal/add-button and its fields was produced by audit and is summarized inline throughout §3–§4. High-level counts: ~40 distinct input surfaces across the app, writing to ~35 data slices.

---

## 2. ONE INFRASTRUCTURE — the shared-loop backbone

### 2.1 What the backbone is

The proven spine is `createTableSync(spec)` ([table-sync.js:98](app/src/lib/table-sync.js:98)): a generic, tenant-scoped Supabase controller giving any table `upload / updateRow / deleteRow / subscribe / initialSync`, with realtime, debounced refetch, reconnect-resync, instance-scoped reads, and a union-preserving merge that never loses a locally-created row ([table-sync.js:282](app/src/lib/table-sync.js:282)). Health is self-reported by `loop-health.js` ([loop-health.js:42](app/src/lib/loop-health.js:42)) and the interconnect manifest proves loops move **live** data at build time ([interconnect-manifest.mjs:45](scripts/interconnect-manifest.mjs:45)).

**This is the target for everything.** "One infrastructure" = every user-facing surface reads and writes through this backbone (or the church custom-subscribe controllers, which are the same sovereign Supabase pattern), so behavior is identical everywhere: add on one device, it appears on another; delete once, it's gone everywhere; a value on screen traces to a real row.

### 2.2 The three plumbing tiers that exist right now

**Tier 1 — On the generic `createTableSync` backbone (23 controllers).** These are wired into the monolith's central sync loop ([poe-financial-mvp-v28.jsx:2971–3048](app/src/poe-financial-mvp-v28.jsx:2971)) or their own components:
`accounts · debts · transactions · entities · rentals · projects · discussions · concerns · workspaces · recipes · inquiries · practice_leads · incidents · contractors1099 · inventory_items · inventory_movements · record_events · inventory_counts · inventory_count_lines · forecast · crm · ceu`.

**Tier 2 — Custom-but-sovereign Supabase subscribe (~15).** Same Supabase, same realtime, hand-written controllers (predate the generic helper): `choir_songs / choir_sermons` (choir-sync), `choir_songbook`, `choir_renditions`, `song_workshop`, `service_programs/segments` (service-program), `service_actuals`, `engagement` (trivia + messages), `harvest`, `video_wall`, `conferences / registrations` (conference + register), `conference_variance`, `venue_bookings` (venue-rental), `feedback`. **These are fine** — live and cross-device — but they duplicate boilerplate the generic helper already solves (candidate to *converge onto* `createTableSync` later, not urgent).

**Tier 3 — Off the backbone (the gap).** These persist to **localStorage only** (a `setData(...)` with a local `Date.now()` id and **no** sync controller — verified, no matching `*-sync.js` exists), or via **n8n webhook**, or are **static/seed**:

| Slice / surface | How it persists today | Evidence | Cross-device? |
|---|---|---|---|
| **Prayer requests** | localStorage only | `addPrayerRequest` [:4139](app/src/poe-financial-mvp-v28.jsx:4139) | ❌ trapped on one device |
| **Church voice** (pastor/serve notes) | localStorage only | `addChurchVoice` [:4170](app/src/poe-financial-mvp-v28.jsx:4170) | ❌ |
| **Notes** (Thinking Space) | localStorage only | `addNote` [:4226](app/src/poe-financial-mvp-v28.jsx:4226) | ❌ |
| **PoeTech directives** (`sendToPoeTech`) | localStorage only (appDirectives) | no `directives-sync` exists | ❌ |
| **Subscriptions** (Cart) | localStorage only | `addSubscription` [:3751](app/src/poe-financial-mvp-v28.jsx:3751) | ❌ |
| **Markets watchlist** | localStorage only | `addWatchlistSymbol` [:4142](app/src/poe-financial-mvp-v28.jsx:4142) | ❌ |
| **Recurring obligations** (Calendar) | localStorage only | `addRecurring` [:3152](app/src/poe-financial-mvp-v28.jsx:3152) | ❌ |
| **Events** (Calendar) | localStorage only | `addEvent` [:3289](app/src/poe-financial-mvp-v28.jsx:3289) | ❌ |
| **CapEx items** | localStorage only | `addCapexItem` [:4113](app/src/poe-financial-mvp-v28.jsx:4113) | ❌ |
| **Ministry interest** (church) | `mailto:` only | Church composer ~[:8376](app/src/poe-financial-mvp-v28.jsx:8376) | ❌ never lands in a system |
| **Invite-your-church** | localStorage flag only | Church composer ~[:8893](app/src/poe-financial-mvp-v28.jsx:8893) | ❌ |
| **Testimony diary** | device-local (PIN) | Church composer ~[:8520](app/src/poe-financial-mvp-v28.jsx:8520) | ❌ (may be intentional) |
| **Church observation photos** | device-local ("NAS later") | ChurchObservation.jsx:14 | ❌ (declared) |
| **Bank ingest / noise / imported** | n8n webhooks | Imported.jsx, BooksTransactions.jsx | source of truth is n8n, read-only in app |
| **Review feed actions** | n8n webhook (`/review-action`) | ReviewFeed.jsx | intentional (NAS loop) |
| **Inbound voicemail** | n8n + CF worker → converts to synced records | Inbound.jsx | intentional (external) |

> **Headline finding.** The unified church/notes input (`OneVoiceInput` + `one-voice-routing.js`) is a genuinely excellent consolidation at the **UI/routing** layer — one box, 8 smart-routed destinations ([one-voice-routing.js](app/src/lib/one-voice-routing.js), [one-voice-surfaces.js](app/src/lib/one-voice-surfaces.js)). **But its destinations are split-plumbing:** `counseling → inquiries-sync` (✅ syncs) and `work → incidents-sync` (✅ syncs), while `prayer`, `pastor`, `serve`, `private-note`, and `poetech` all land in **Tier-3 localStorage-only** slices. So a prayer request spoken into the church's own "one voice" box **never reaches the church** — it dies on the speaker's phone. This is the clearest example of why "one input" and "one infrastructure" are the same job.

> **In-tab inconsistency finding.** Inside the **single Calendar tab**, `addIncident` syncs (Tier 1) but `addEvent` and `addRecurring` do not (Tier 3). Same tab, same-looking three "add" forms, three different fates for the data. This is exactly the "behavior isn't consistent" symptom Darrell named.

### 2.3 Per-tab: current plumbing → target plumbing

Target for **all** rows: Tier 1 (`createTableSync`) or the equivalent church Tier-2 controller. New tables need a Supabase migration (`00xx`) + a controller; the pattern is proven and mechanical.

| Tab / surface | Current | Target | Work |
|---|---|---|---|
| Big Picture (Action Queue) | writes incidents/projects (T1) | keep T1 | none |
| Books · Entities/Accounts/Debts/Tx/1099 | **T1** | keep | none |
| Books · Imported | n8n read-only | keep (n8n is source) | none |
| Books · **Cart (Subscriptions)** | **T3 local** | **T1** — new `subscriptions` table + `subscriptions-sync` | migration + controller |
| Books · **Calendar → Events** | **T3 local** | **T1** — new `calendar_events` + sync | migration + controller |
| Books · **Calendar → Recurring** | **T3 local** | **T1** — new `recurring_obligations` + sync | migration + controller |
| Books · Calendar → Incidents | T1 | keep | none |
| Forecast | derives from T1 + `forecast-sync` | keep | none |
| **Markets (watchlist)** | **T3 local** | **T1** — new `watchlist` + sync (or fold into meta-sync) | migration + controller |
| Inventory / Kitchen / Chef | **T1** | keep | none |
| CRM / Practice / Client Growth | T1 (`crm`,`practice_leads`,`inquiries`) | keep | none |
| Rentals / Succession / Projects | T1 | keep | none |
| **Notes (Thinking Space)** | **T3 local** | **T1** — new `notes` + sync (respect per-device privacy toggle) | migration + controller |
| **`sendToPoeTech` directives** | **T3 local** | **T1** — fold into `feedback`/`concerns` (they already sync) | route change, no new table |
| Create (Workspaces) | T1 | keep | none |
| Voice | local + `voice_profiles` (T-custom) | keep | none |
| Library / Bookstore | local-first | later migration | defer (flag) |
| Study | device-local **by design** (Darrell-only) | **keep local** (sovereign) | none — intentional |
| Church · **Prayer requests** | **T3 local** | **T2** — new `prayer_requests` + controller | migration + controller |
| Church · **Church voice** | **T3 local** | **T2** — new `church_voice` + controller | migration + controller |
| Church · **Ministry interest** | **mailto** | **T1** — route to `inquiries`/CRM | route change |
| Church · **Invite-a-church** | **T3 local** | **T1** — route to `app_interest`/CRM | route change |
| Church · Choir / Service / Pulpit / Scripture-to-study | T2 (custom) / study-space local | keep (converge later) | optional |
| Church · Engagement / Harvest / Conference / Venues / Video Wall | T2 (custom) | keep | none |
| Church · Observation photos | device-local ("NAS later") | decide: sync now or hold | **flag** |
| Concerns / Discussions / Governance / Review | T1 / n8n (review) | keep | none |

**Net new backbone work to reach "live data everywhere":** ~7 small tables + controllers (`subscriptions`, `calendar_events`, `recurring_obligations`, `watchlist`, `notes`, `prayer_requests`, `church_voice`) + 2 route changes (`sendToPoeTech`, ministry/invite). Each is the proven mechanical `createTableSync` pattern — low risk, high consistency payoff.

---

## 3. ONE INPUT PER TAB — consolidation proposals

**The model already exists.** `OneVoiceInput` + `one-voice-routing.js` + `one-voice-surfaces.js` is the reference pattern: one box, a superset of destinations, per-surface config via `resolveSurface()` ([one-voice-surfaces.js:66](app/src/lib/one-voice-surfaces.js:66)), extensible without touching the component. **Consolidation = generalize this pattern to the tabs where duplicate inputs exist, and fix its plumbing (§2).** Below, each candidate is marked **MERGE** or **KEEP SEPARATE (why)**.

### 3.1 Record-type duplication map (the raw signal)

| Record type | Distinct entry points today | Verdict |
|---|---|---|
| **Incident / work order** | Action Queue (Big Picture) · Calendar Incident form · OneVoiceInput `work` · Inbound convert | MERGE the *form*, keep the *contexts* |
| **Project** | Action Queue · Projects tab · Inbound convert | MERGE the *form* |
| **Inquiry** | OneVoiceInput `counseling` · Practice rich form · Inbound convert | KEEP (layered intake; all → `inquiries-sync`) |
| **Transaction** | Manual add · inline edit · CSV import · bank-ingest accept · transfer | MERGE onto one editor + prefill |
| **Calendar item** | Recurring form · Event form · Incident form (all in Calendar) | MERGE into one "Add to calendar" composer |
| **Prayer / church-voice** | Church "Yahweh Hears You" box · Prayer form · OneVoiceInput | MERGE onto OneVoiceInput |
| **Subscription status** | 4 quick-buttons per row + full-edit form | KEEP (quick-set is good UX) |
| **Song** | Choir add · Songbook reuse · Workshop propose | KEEP (different roles/actions) |
| **Conference registration** | Public form · Account on-ramp | KEEP (intentional 2-step funnel) |
| **Venue request** | In-app + public link | Already ONE form, two entry points ✅ |
| **Feedback** | Floating 💬 modal only | KEEP (intentionally isolated — it's about the app) |

### 3.2 Church home — **MERGE** (highest impact)

**Current:** the church home renders *both* `ChurchOneVoice` (the unified box, ~[:8496](app/src/poe-financial-mvp-v28.jsx:8496)) **and**, directly below it, a redundant "Yahweh Hears You" speak/type/link box (~[:8554](app/src/poe-financial-mvp-v28.jsx:8554), localStorage+mailto) **and** a separate Prayer Requests form (~[:8812](app/src/poe-financial-mvp-v28.jsx:8812)) **and** Ministry Interest (mailto, ~[:8788](app/src/poe-financial-mvp-v28.jsx:8788)) **and** Invite-a-church (~[:8893](app/src/poe-financial-mvp-v28.jsx:8893)) **and** a testimony diary.

**Proposal:** `OneVoiceInput` becomes the **single** church input. The prayer route already carries the prayer form's extra fields `{requester, request, shareWithChurch}` in dispatch ([one-voice-routing.js](app/src/lib/one-voice-routing.js)) — so the standalone prayer form folds in with **zero field loss** by exposing those as an optional detail row on the prayer route. "Yahweh Hears You" is deleted (pure duplicate). **Ministry interest** and **Invite-a-church** collect genuinely different structured fields (email, skills / churchName, city) → they **KEEP SEPARATE as small forms but move off `mailto` onto the backbone** (inquiries/CRM/app_interest). Testimony diary → **KEEP SEPARATE** (distinct private journal; decide sync in §7).

### 3.3 Calendar (Books) — **MERGE the three add-forms**

**Current:** three stacked add-forms — Recurring ([:7816](app/src/poe-financial-mvp-v28.jsx:7816)), Incident ([:7881](app/src/poe-financial-mvp-v28.jsx:7881)), Event ([:7961](app/src/poe-financial-mvp-v28.jsx:7961)) — sharing date/amount/entity/category/notes.

**Proposal:** ONE "Add to calendar" composer with a 3-way type toggle (**Recurring bill · One-time event · Incident**) that reveals type-specific fields — mirroring the existing Action Queue toggle pattern ([:7116](app/src/poe-financial-mvp-v28.jsx:7116)). All three record types preserved; all three moved to Tier 1 (§2) so the tab is internally consistent.

### 3.4 Transactions (Books) — **MERGE onto one editor**

**Current:** manual add, inline edit, CSV import, bank-ingest "accept → review", transfer — several forms writing transactions.

**Proposal:** ONE transaction editor (full field set) that manual-add opens blank, inline-edit opens populated, CSV-accept and ingest-accept **prefill**, and a "type: transfer" toggle reveals source/target. The distinct *modes* stay (fast quick-add path preserved); the *field definition* lives once.

### 3.5 Cross-app quick-capture — **MERGE the router, keep the surfaces**

**Current:** three overlapping "turn input into a routed record" surfaces — Action Queue (Change/Incident/Project), Inbound (→incident/inquiry/project), OneVoiceInput (8 routes) — each with its own routing logic.

**Proposal:** make `one-voice-routing.js` **the** dispatcher; Action Queue and Inbound reuse it (they already call the same `addIncident/addProject/addInquiry` handlers). One routing table, one place to add a destination ([routing extensibility](app/src/lib/one-voice-routing.js)). Surfaces stay where users expect them.

### 3.6 KEEP SEPARATE — and why

- **Choir add / songbook reuse / workshop propose** — different actor and action (director creates; director re-schedules existing; member proposes). Merging would conflate roles.
- **Conference public-register + account on-ramp** — a deliberate two-step funnel (register without login, then optionally claim an account). Merging breaks the no-login promise.
- **Practice rich inquiry vs OneVoiceInput counseling** — layered intake by design; both already write `inquiries-sync`, and the bright line (clinical words stay private on-device) depends on them staying distinct.
- **Feedback modal** — intentionally isolated from routing; it's about *the app*, not the business systems.
- **Study vs Notes** — different domains and privacy postures; Study is sovereign device-local by design.
- **Create (documents), Voice (enrollment)** — orthogonal; not text-routed records.

---

## 4. ZERO FEATURE LOSS — superset checklists (the proof gate)

For every **MERGE** in §3, the unified input must contain **every** field/function of the surfaces it replaces. These checklists are the acceptance gate: the build isn't done until each box is present in the unified surface.

### 4.1 Church home → single `OneVoiceInput`
Superset must preserve:
- [ ] Free text (textarea) + **voice dictation** (mic) — from OneVoiceInput ([:116](app/src/components/OneVoiceInput.jsx))
- [ ] Optional **name / "who is speaking"** field
- [ ] All 8 **routes** (prayer, pastor, serve, conference, work, counseling, poetech, private) with per-route confirmations
- [ ] Prayer route detail: **requester name**, **anonymous** toggle, **shareWithChurch** toggle (from the standalone prayer form)
- [ ] Topic + **link** capture (from "Yahweh Hears You" InputCenter box) — add as optional fields
- [ ] Ministry Interest (kept separate): name, email, interest, **skills** — now → inquiries/CRM (not mailto)
- [ ] Invite-a-church (kept separate): churchName, city, contactName, email, note — now → app_interest/CRM
- [ ] Testimony diary (kept separate): PIN-gated private entry

### 4.2 Calendar → single "Add to calendar" composer
Shared: date, amount, entity, category, notes. Type-specific must all survive:
- [ ] **Recurring:** name, amount, **frequency** (monthly/quarterly/semi-annual/annual/biennial), category, next-due, enabled ([:7816](app/src/poe-financial-mvp-v28.jsx:7816))
- [ ] **Event:** title, date, **time**, **all-day** toggle, description, category, **reminders** (multi), **repeat** (none/daily/weekly/monthly/yearly) ([:7961](app/src/poe-financial-mvp-v28.jsx:7961))
- [ ] **Incident:** description, date, amount, entity, category (vehicle/medical/property/travel/legal/other), **contractor multi-select**, urgency ([:7881](app/src/poe-financial-mvp-v28.jsx:7881))
- [ ] Row actions preserved: edit-inline, delete, event ✓done, notification-enable

### 4.3 Transactions → single editor
- [ ] date, account, amount, description, category, **entity override** (manual add [:138](app/src/components/BooksTransactions.jsx))
- [ ] **CSV import:** raw textarea, target account, **flip-sign** toggle
- [ ] **Transfer:** amount, **source** account, **target** account
- [ ] **Bank-ingest accept:** prefilled review + quick-add-immediate + mark-as-noise (n8n)
- [ ] Inline edit + versioned history + reconciliation-status filter preserved

### 4.4 Quick-capture router
- [ ] Union of destinations: Change, Incident, Project, Inquiry, Prayer, Pastor, Serve, Conference, PoeTech, Private
- [ ] Action Queue extra fields preserved: linkType (property/project/entity), due date, estimated cost ([:7116](app/src/poe-financial-mvp-v28.jsx:7116))
- [ ] Inbound extra fields preserved: convert-as radio, entity, note, discard, mark-handled-first-then-create ([Inbound.jsx](app/src/components/Inbound.jsx))

*(Any checkbox that can't be ticked in the unified surface = the merge is not shippable. This is the DR-0076 proof gate.)*

---

## 5. DECLUTTER / CALM UX — progressive disclosure

**Principle:** common path up front, advanced one tap deeper (Anxiety-Clarity: answer what/when/why/how without a wall).

### 5.1 Nav grouping (biggest win)
- **Before:** 22 top-level tabs in one flat scroll strip.
- **After:** the existing 5 ROADMAP sections become the nav shape — **Money · Business · Create · Church · (Steward)** — either as grouped labels or a two-tier "section → tabs" nav. The grouping is *already authored* ([help-content.js:595](app/src/lib/help-content.js:595)); we're just showing it. Family-only steward tools (Center, CRM, Inventory, Forecast, Succession, Admin) collapse under one "Steward" group instead of trailing the strip.
- Reduction: perceived choices at any moment drop from 22 → ~5 groups.

### 5.2 Per-tab clutter reductions
| Tab | Before | After |
|---|---|---|
| **Church home** | 5–6 stacked input boxes (OneVoice + Yahweh-box + prayer + ministry + invite + diary) | **1** primary box (OneVoice) + 2 secondary forms behind a "More ways to reach us" disclosure |
| **Calendar** | 3 always-open add-forms | **1** "Add" button → composer with type toggle |
| **Transactions** | multiple visible add/import/transfer affordances | **1** "Add" + a "⋯ import / transfer" menu |
| **Debts** | slider + 4 scenario buttons + max-editor all visible | slider up front; scenario presets behind "Strategies"; keep (it's what-if by nature — note, not a forced change) |
| **Big Picture** | dense; fine | keep, but Action Queue form collapses until "＋ Add" tapped |

### 5.3 Standard disclosure pattern (apply app-wide)
Every "add" surface: a single primary **＋ Add** button reveals the common fields; an **Advanced ▾** row reveals the rest. Inline-edit stays (the app's proven IN-PLACE-FIRST pattern). No modals-over-modals.

---

## 6. HELP "?" SPEC — per tab

**What already exists (strong foundation):** `help-content.js` is the ONE registry ([help-content.js:55](app/src/lib/help-content.js:55)) — every top-level view and church/books sub-view has `title / tag / what / how / why / when / more`, plus a 5-section user ROADMAP and a first-run tour, machine-checked so no nav id ships without help. `HelpButton.jsx` renders the header "?" and resolves the current view via `helpKeyFor()`.

**Gaps to close (the spec):**

1. **Decision-making workflow depth.** Current entries answer *what/how/why/when* well but are light on **"what do I do, when, and why *in what order*"** — the decision workflow Darrell asked for. Add an optional `workflow:` array to each entry: an ordered "if X → do Y" decision path. Example (Debts): *"1. Add every debt. 2. If cash-flow is tight → sort snowball (smallest first) for momentum. 3. If minimizing interest matters more → sort avalanche. 4. Set extra-payment to your real surplus from Big Picture. 5. Re-check monthly."*

2. **Missing keys for deeper surfaces.** Add help for surfaces not yet keyed: `books:cart` exists but `inventory` sub-modes (Kitchen count, Chef's Corner recipe scaler), `choir` sub-tabs (Songbook / Renditions / Workshop), `conference` sub-modes (Register / Variance / Event Center), `voice`, `create`, `crm`, `center`, `succession` deeper flows. Gate: extend `help-content.test.js` to require help for every registered *sub*-surface, not just nav ids.

3. **Contextual "?" on every input.** Beyond the tab-level "?", each consolidated input (§3) gets a one-line inline hint on its Advanced disclosure ("Frequency = how often this bill repeats"). Sourced from the same registry (no one-off blurbs — DR-0079).

4. **Per-tab Help content to author** (what/when/why/how + workflow) — one row per tab, all reading from `help-content.js`. The top-level entries are done; the work is (a) `workflow:` arrays, (b) the missing sub-surface keys, (c) inline field hints. **Faith-area help holds Typographic Theology** (God capitalized; adversary never), in Ari's plain, non-preachy voice ([help-content.js:38](app/src/lib/help-content.js:38)).

**Spec shape (per tab):**
```
title · tag(one-line) · what(2–3 sentences) · how(ordered steps) ·
why(the payoff) · when(reach-for-it) · workflow(ordered decisions) · more(optional depth)
```

---

## 7. Decisions that need Darrell (flags)

1. **Nav re-grouping (§5.1)** — surface the 5 ROADMAP sections as the nav shape? This is the biggest calm-UX change and touches every user's muscle memory → **Tier B/C soak.** *Recommend: yes, as a grouped nav.* Approve direction?
2. **Prayer / church-voice sync (§2, §4.1)** — moving prayer requests + church voice to the shared backbone means they become **cross-device and visible to church stewards** (RLS-scoped). That's the point (a prayer should reach the church) but it changes them from private-on-device to shared. **Confirm the visibility/RLS intent** before building the tables.
3. **Notes sync (§2)** — Notes are currently private-on-device. Sync them to the family instance (cross-device) while honoring the existing per-note privacy toggle? Or keep device-local like Study? *Recommend: sync, with the privacy toggle respected.*
4. **Testimony diary & Observation photos** — sync now or keep device-local ("NAS later" as declared)? *Recommend: hold both as-is; not blocking.*
5. **Scope / sequencing of the build** — do you want all of §2 (7 tables) + all §3 merges, or a first slice? *Recommend the order in §8.*

*No merge in §3 ships if any §4 checkbox can't be ticked. No timer/automation is introduced by any of this (no three-brakes surface here).*

---

## 8. Suggested sequencing (when approved — not started)

1. **Backbone parity first (invisible win):** add the ~7 Tier-3 → Tier-1 tables + controllers (subscriptions, calendar_events, recurring_obligations, watchlist, notes, prayer_requests, church_voice) + fix `sendToPoeTech`. Pure plumbing; no UI change; "live data everywhere" achieved. Each is one migration + one `createTableSync` spec + one wire-in. (Gate #2/#3 first.)
2. **Church home merge (§3.2):** delete the duplicate box, fold prayer fields into OneVoiceInput, move ministry/invite off mailto. Highest user-visible payoff.
3. **Calendar composer (§3.3)** + **Transactions editor (§3.4).**
4. **Quick-capture router unification (§3.5).**
5. **Help pass (§6):** `workflow:` arrays + missing sub-keys + inline hints, with the test extended to enforce them.
6. **Nav re-grouping (§5.1):** last, behind a Tier B/C soak (muscle-memory change).

Each step is independently shippable, verifiable in the live app (DR-0061), and leaves the app better than found (DR-0075). Nothing here is a monolith rewrite — new tables and merged inputs are new/edited modules, per the "new surface = new module" rule.

---

*Prepared for approval. On your word, I'll start at §8 step 1 (or wherever you point) and land each slice with live verification before moving to the next.*
