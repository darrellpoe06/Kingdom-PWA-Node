# Surface Data-Driven Audit — working vs. dead space (2026-07-18)

**Why.** Darrell 2026-07-18: *"Make sure all components of the PoeTech app follow their path to a data-driven completion. Give a list of working vs not working so we see what to do with loose ends... comprehensive process of fixing dead spaces before we get a lot of users and for our current users."*

**Method.** Reality-Trace (P15 / DR-0076) applied to all **45 user-facing surfaces** in the surface registry (`app/src/surfaces.js`), fanned out across 5 parallel readers. Each surface graded: **WORKING** (reads/writes a real source end-to-end — a `*-sync` lib backed by Supabase, live shell props, or a real computation, with persisting actions), **PARTIAL** (real but with a specific dead spot), **DEAD** (painted/stub).

**Headline.** The app is overwhelmingly data-driven. Of 45 surfaces, **~30 are fully end-to-end**, most of the rest are *honestly-labeled* deferrals (NAS-pending media, GPU-pending voice/vision, curated content by design) — **not** painted fakes. There is essentially **one truly misleading painted confirmation** (ChurchHome invite form). The fix list below is short and concrete.

---

## The fix list (by priority)

### Tier 1 — painted/misleading (fix first; erodes trust)
1. **ChurchHome — "Invite your church" form** (`ChurchHome.jsx:729`): flips `inviteSent=true` and shows success but **persists nothing / sends nothing** — a painted confirmation. FIX: wire to a real interest write (or `mailto:`, like the ministry-interest control on the same surface).

### Tier 2 — real wiring gaps (small, high-value)
2. **ChurchInfraPlan** (`ChurchInfraPlan.jsx:16,99`): reads the static `SEED_DEVICES` constant while framing it as "verified hardware from the device register" — so devices actually registered/edited in **DeviceInventory** (live `church_devices` sub) never appear. FIX: subscribe to `church-devices-sync` like DeviceInventory does.
3. **Contractors1099 — open work orders** (`Contractors1099.jsx:365`, shell `poe-financial-mvp-v28.jsx` k1099 mount): the manager view degrades to an honest note because the shell **doesn't pass the `incidents` prop**. FIX: pass `incidents` at the mount — one wiring line promotes it to WORKING.

### Tier 3 — real but device-local only (no cross-device / staff visibility)
4. **CohortPrograms** (`use-cohort-programs.js`): localStorage only, no Supabase — enrollments/payments don't survive a device change or reach staff. FIX: add a `*-sync` lib (Moore surfaces are the pattern).
5. **ChurchProjects** (`use-church-projects.js`): localStorage only; Supabase RLS sync is a stated TODO. FIX: same — add cross-device sync.

### Tier 4 — automation gaps (works in-app, no external effect)
6. **BusMinistry reminders** (`BusMinistry.jsx:467`): a manual "Mark sent" queue, no automated SMS — this is exactly Deacon Anderson's "text reminders, not just in-app" intake request. FIX: wire the send path (ties to the SMS money-decision, DR-0187 leg).
7. **VoiceStudio — personal-voice cloning** (`VoiceStudio.jsx:152`): gated on `isVoiceServiceReady()`; plays a disclosed stand-in until the GPU studio is enabled. Honest today; the marquee "hear your own voice read new text" path is not live. FIX: enable when the GPU box lands.

### Tier 5 — hardcoded content presented near real data (label or wire)
8. **DevOps / Opportunities** (`DevOps.jsx:411,698`): `LowHangingFruit`, `PoeTechDifferentiation`, `ServicesPortfolio`, and the `Projections` milestones/tier-prices are hardcoded marketing/what-if arrays bolted onto a real opportunity pipeline. FIX: drive from real config/source, or clearly mark "illustrative," never "your data."
9. **About** (`About.jsx:261`): checkout is a `mailto:` handshake (no Stripe yet); the "Live/Planned/Vision (2/2/8)" module counts + pricing are hardcoded marketing. FIX: derive the counts from the surface registry; wire Stripe when ready.
10. **Practice — "Pipeline Revenue · Estimates"** (`Practice.jsx:29`): hardcoded `RATE_PER_SESSION=150 × 48wks` "until Acuity sync is built." Honestly labeled. FIX: Acuity sync, or keep the explicit "estimate" badge.
11. **Relationships — Matrix / Guardian tabs** (`Relationships.jsx:358,447`): Matrix renders the frozen `RELATIONSHIPS` defaults preview; Guardian&Child is a "moved to its one home" pointer. FIX: label Matrix as a defaults preview (it says so) and confirm the guardian/child config has its live home.
12. **Cart — Plaid section** (`Cart.jsx:150`): explicit "Vision" placeholder. Low priority (honest).

---

## Fully WORKING (end-to-end real data) — for the record
Rentals, Markets, CRM, Inventory, Forecast, AdminConsole, ThinkingSpace, CreationWorkspace, Library, Study, ChefCorner, Games, TVTime, MooreDivahs, TlcAssistant, CommandServeCenter, Choir, ServiceProgram, Engagement, Pulpit, ScriptureLibrary, ChurchVideoWall, DeviceInventory, HarvestLedger, ChurchObservation, ChurchLearn, EternalAlgorithmsStudy, ConferenceModule, ConferenceVariance, EventCenterModule, EventManagement, BooksTransactions. (Content-library surfaces are curated-static **by design** and fully wired for their interactive/persistence layers.)

---

## The standing process for fixing dead spaces (the Way)
For every surface, before it is trusted:
1. **Reality-trace** — name the real record/table/feed it reads and writes (P15). If a value can't be traced to real state, it does not ship as "data."
2. **Wire or label — never fake.** Either connect it to the real source, or render an honest deferred/illustrative state ("not captured yet," "estimate," "Vision"). A painted confirmation (Tier 1) is the only unacceptable state.
3. **Add the error-correcting gate in the same change** — a test asserting the surface reads its real source (so a future edit can't silently re-paint it). This is how the check-suite grows (feedback_gates_are_governance…).
4. **Ship it through the fast lane** — no-human auto-merge on green; the gates are the governance.

This punch-list is the live loose-ends tracker; close items top-down (Tier 1 first) and delete them from here as each ships with its gate.
