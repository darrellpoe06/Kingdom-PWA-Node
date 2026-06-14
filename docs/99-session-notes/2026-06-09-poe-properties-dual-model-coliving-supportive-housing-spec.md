# Poe Properties — Dual Operating Model (Co-Living) + Supportive-Housing Extension (Property Module Spec)

**Date:** 2026-06-09 (Tue)
**Author:** Claude (module-spec on Darrell's commission — recording decisions already discussed and agreed in chat).
**Status:** PLAN / spec doc. **No code, no purchases, no money movement, no autonomous execution, no mode actually switched on any property.** Target module architecture only.
**This is a record, not legal advice.** Anything touching zoning, licensing, occupancy law, fair-housing, or worker classification routes to counsel (see the Compliance Gate, §5, and the routing in §7).
**Decision records:** DR-026 .. DR-030 (recorded in §8 of this doc). **DR-numbering note (binding to read):** this doc continues the **three-digit DR-0NN lineage** of the 2026-06-09 strategy chain (the parent strategy/legal branch + PRs #15/#16/#17, DR-001 .. DR-025), because the Poe Properties content is a direct continuation of that thread (DR-001 Workforce Layer, DR-005 worker-classification routing, DR-010 Trevor real-estate scope). **That chain is NOT yet merged to `main`, and `main` carries a *separate* four-digit DR-00NN decision-record lineage (DR-0001 .. DR-0016).** Reconciling the two numbering systems in the canonical `docs/decisions/INDEX.md` is an **OPEN item for Darrell** — so this doc deliberately keeps its DRs local (it does **not** edit `docs/decisions/INDEX.md`) to avoid forcing a contested merge. See "Open items," §9.

**Builds on (verified in-repo, do NOT rebuild):**
- The **rentals domain schema** — `infra/supabase/schema-v2.2-rentals.sql` (locked 2026-05-25; test instance **Poe Properties, 11 doors**): `rentals`, `leases`, `renters`, `renter_household_members` (Q5 lock-in), `rent_payments`, `maintenance_requests`. Portal RLS in `schema-v2.9-portal-rls.sql`; ops/incident FK backfill in `schema-v2.8-ops.sql`.
- The **renter / household-member portal pattern** (`external_users` representation; each household member gets a portal row with explicit `permissions` and `can_submit_requests`).
- The **service-request -> work-order -> dispatch** lifecycle already modeled by `maintenance_requests` (`submitted_via`, `category`, `urgency`, `status` new -> triaging -> scheduled -> in-progress -> awaiting-parts -> resolved/declined; `assigned_to_user_id`; `incident_id` link).
- The **group-chat / units** layer (the "unit" abstraction reused for housemates).
- The **Industry / Role Module Template** (`docs/99-session-notes/2026-06-09-industry-role-module-template-spec.md`, DR-009) — the Property-Manager role module is an **instance** of that template.

**Reads through (Layer 3 foundations):** `MODULAR-EXTENSIBILITY.md` / multi-instance (one codebase, many instances), `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `QUALITY-OF-LIFE-AS-NORTH-STAR.md`, `COMMUNITY-FIRST-MISSION.md`, `GOVERNANCE-EXECUTION-ADVISORY.md`, and `CLAUDE.md` Layer 0. TLC **ISO-1 / HIPAA** firewall is the wall behind which any clinical scope sits (§6).

---

## TL;DR (read this first)

1. **Each Poe Properties property runs in one of two operating modes** (DR-026): **(a) whole-unit lease** (the current model) or **(b) rent-by-the-room / co-living**. The switch is **per-property**, not global — different doors can run different models at the same time.
2. **Co-living turns each room into a rentable sub-unit** (DR-027): single bed, small fridge, smart lock; **occupancy configurable 1-2 per room plus a candidate waitlist**; **$1,000 / room / month, utilities included**; living room + bathrooms shared under explicit house rules.
3. **Smart-lock access is the access layer** (DR-028): issue room access on move-in, revoke on move-out, keep access logs. **Privacy line (binding): locks and logs live at the door. NO surveillance inside rooms — ever.**
4. **Housemates are modeled as a "unit"** — reusing the existing group-chat / units layer and the existing `maintenance_requests` service-request -> work-order -> dispatch flow. We **extend**, we do not rebuild.
5. **Management runs in layered modes**: self-managed (Darrell + Christina) driven by the **Property-Manager role module (PM-as-automation)**, with an optional part-time human manager augmenting, and turnover / maintenance tasked to the **workforce layer** (DR-001).
6. **A per-property COMPLIANCE GATE is binding** (DR-029): rent-by-the-room frequently triggers different law than single-family (zoning, boarding/rooming-house licensing, occupancy caps, building/fire code, insurance, per-room tenancy law). **The module MUST NOT let a property switch to room-rental until a per-property legal/zoning/licensing checklist is cleared.** Not legal advice.
7. **A Supportive-Housing / Government-Programs extension** (DR-030) layers a convergence pipeline (housing -> assessment / case-management -> skill-upgrade -> cohort team -> 1099 work -> outcome reporting) on a grant/voucher funding rail. **Clinical line is drawn conservatively: supportive HOUSING with wraparound services is IN scope; actual clinical / SUD TREATMENT is OUT of scope and walled behind the TLC ISO-1 / HIPAA boundary.** Default = housing-only / clinical-walled, **PENDING Darrell's explicit confirmation** (§9, open item).

---

## 1. What this is

Poe Properties already exists in the platform as the landlord instance the rentals schema was built for (locked 2026-05-25, **11 doors**). This spec adds a **business-model dimension** on top of that existing domain: the ability for a property to operate either as a conventional **whole-unit lease** or as **rent-by-the-room co-living**, chosen per property, plus an optional **supportive-housing** posture for properties funded through government programs.

Nothing here rebuilds the rentals domain. Co-living and supportive housing are **configurations and extensions** of `rentals` / `leases` / `renters` / `renter_household_members` / `rent_payments` / `maintenance_requests`, plus a small set of new fields and one new access-layer integration (smart locks). This is the **modular-extensibility / multi-instance** posture: one codebase, more configuration.

---

## 2. Dual operating model (DR-026)

**Each property carries an operating mode.** Conceptually this is a `rental_mode` on the `rentals` row (proposed enum: `whole-unit` | `by-room`), defaulting to `whole-unit` so every existing door is unchanged.

| Mode | Tenancy unit | Lease shape | Rent collection | Current 11 doors |
|---|---|---|---|---|
| **(a) Whole-unit lease** | the property (or its `unit`) | one `leases` row per household | `rent_payments` per lease | unchanged default |
| **(b) Rent-by-the-room / co-living** | the **room** (a sub-unit of the property) | one `leases` row **per room** | `rent_payments` per room-lease | opt-in per property, **gated** (§5) |

**Per-property switch, never global.** Mode is set on the individual `rentals` row. Different properties run different models simultaneously; flipping one property's mode never touches another. **A switch *into* `by-room` is blocked by the Compliance Gate (§5).** A switch *out of* `by-room` (back to whole-unit) is allowed only when no active room-leases remain.

---

## 3. Co-living model (DR-027)

**Each room is a rentable sub-unit.** Proposed: a `rooms` table (child of `rentals`), and room-scoped `leases` (a `room_id` on `leases`, nullable; populated only in `by-room` mode). A room is the smallest tenancy unit and carries:

- **Furnishing baseline:** single bed, small fridge, **smart lock** (the access layer, §4).
- **Occupancy: configurable 1-2 per room** (a `max_occupancy` field, 1 or 2), **plus a candidate waitlist** per room/property (a `room_waitlist` of prospective housemates, ordered, with status `inquiring` | `screening` | `offered` | `declined` | `placed`). The 1-2 range lets a room hold a single occupant or a couple/pair where appropriate and lawful (subject to the occupancy caps surfaced by the Compliance Gate, §5).
- **Price: $1,000 / room / month, utilities included.** Modeled as the room-lease `monthly_rent` with a flag that utilities are bundled (no separate utility pass-through to the housemate). Per-property the owner can override price, but $1,000 utilities-included is the stated default.
- **Shared common areas:** living room and bathrooms are shared across the house, governed by explicit **house rules** (a per-property `house_rules` document surfaced to every housemate at move-in and acknowledged via the existing `disclaimers_acknowledgments` pattern).

**Housemates as a "unit."** The set of housemates in one property is modeled as a **unit** in the existing group-chat / units layer — the same abstraction families already use — so housemates get a shared channel for house coordination, and each housemate independently submits service requests through the existing renter portal. **Service requests reuse `maintenance_requests` unchanged** (`submitted_via='renter-portal'`, the existing `category` / `urgency` / `status` lifecycle, `assigned_to_user_id` for dispatch). No new request pipeline is built; co-living simply attaches requests to a room-scoped lease within the shared property.

---

## 4. Smart-lock access layer (DR-028)

The smart lock is the **access layer** for room-rental, replacing physical key handoff and making move-in / move-out auditable.

- **Issue on move-in:** when a room-lease goes `active`, the module issues room access to the housemate (and revokes any prior holder's access for that room).
- **Revoke on move-out:** when a room-lease ends (`expired` / `terminated-early`), access is revoked automatically. No lingering access after tenancy ends.
- **Access logs:** the module keeps a per-room access log (who entered, when) for security and dispute resolution — proposed `room_access_events` (room_id, principal, event `granted` | `revoked` | `entry`, timestamp), consistent with the platform's audit-log posture.

**Privacy line (BINDING).** **Locks and logs live at the door. There is NO surveillance inside rooms — ever.** No cameras, no microphones, no in-room sensing of any kind in a housemate's private room. This is a hard line, consistent with `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md` (surveillance disguised as service never ships) and the dignity standard. Door-level access logging is operational security; in-room monitoring is surveillance and is out of bounds. The distinction is the binding rule.

---

## 5. Per-property COMPLIANCE GATE (DR-029, BINDING)

**Rent-by-the-room is not single-family-with-more-leases.** It frequently triggers a different legal regime, which varies by jurisdiction and even by parcel. The module treats the legal regime as a **gate**, not a footnote.

**The gate (binding behavior):** a property **MUST NOT** switch to `by-room` mode until a **per-property legal / zoning / licensing checklist is cleared and recorded** against that `rentals` row. The mode-switch control is disabled until the checklist passes; clearing it is a human/counsel action, not an automated one.

**The per-property checklist covers at minimum:**

- **Zoning** — is rooming-house / co-living / boarding use permitted at this parcel?
- **Boarding / rooming-house licensing** — does the municipality require a license or registration for renting rooms separately?
- **Occupancy caps** — local limits on unrelated occupants per dwelling; this constrains the room count and the 1-2 per-room setting.
- **Building / fire code** — egress requirements, **smoke / CO detectors per room**, hallway and exit standards for converted rooming use.
- **Insurance** — does the existing landlord policy cover room-rental / multiple unrelated tenancies, or is a different policy required?
- **Per-room lease / tenant law** — per-room tenancy, deposits, notice, and eviction rules can differ from a single whole-unit lease.

**Routing:** real-estate / property questions route to **Trevor (real-estate counsel)** consistent with DR-010; matters outside real-estate (e.g., employment/worker-classification for any staff, or program-specific compliance under §6) route to the appropriate local / employment counsel, consistent with DR-005. **This is not legal advice.** The module records *that* counsel cleared each item and *when*; it does not generate the legal determination.

---

## 6. Supportive-Housing / Government-Programs extension (DR-030)

A heavier extension for properties operated under government / grant programs: a **convergence pipeline** that turns housing into a launch-point.

**The pipeline:** housing -> **assessment / case-management** -> **skill-upgrade** -> **cohort team** -> **1099 work** -> **outcome reporting.** This reuses the existing thread directly: skill-upgrade and cohort/team formation are the Workforce-Layer / cohort mechanisms (DR-001 and the team-formation layer), 1099 work is the workforce payout rail, and outcome reporting is a new reporting layer on top of `report_runs` / `report_snapshots`.

**Funding rail:** grant / voucher funding (e.g., program subsidies, housing vouchers) modeled alongside `rent_payments` so a room-lease can be funded by a program rather than solely by the occupant. The money rail itself remains a vendor dependency (consistent with DR-003 — we do not build a money rail).

**Outcomes-reporting layer:** programs require outcome reporting (placements, retention, employment, milestones). This is a structured reporting surface feeding grant compliance, built on the existing reporting tables.

**GUARDRAILS (binding):**

- **Heavy regulation.** Supportive housing carries supportive-housing licensing, **fair-housing** obligations, **vulnerable-population dignity** requirements, and **grant-compliance** obligations. These route to counsel / program experts per the Compliance Gate posture (§5) and do not auto-execute.
- **THE CLINICAL LINE — drawn conservatively (binding).** **Supportive HOUSING with wraparound services (case management, skills, employment connection, housing stability) is IN scope.** **Actual clinical / SUD (substance-use-disorder) TREATMENT is OUT of scope** and is **walled behind the TLC ISO-1 / HIPAA boundary.** PoeTech's property/housing module does not deliver, store, or touch clinical treatment data; anything clinical lives on the TLC side of the firewall (the senior PHI tier), never in the rentals/housing domain.
- **Default posture = housing-only / clinical-walled, PENDING Darrell's explicit confirmation.** Until Darrell explicitly confirms the housing-vs-clinical scope, the module defaults to **housing-only**, with clinical fully walled. This is flagged as an explicit open decision (§9).

---

## 7. Management modes

Layered, not either/or:

- **Self-managed (Darrell + Christina)** as the baseline, driven by the **Property-Manager role module** — "PM-as-automation." The PM module is an **instance of the Industry/Role Module Template** (DR-009): it encodes the property-management discipline so the owners operate at professional-PM quality without a full-time PM. It drives intake/screening, lease lifecycle, rent tracking (`rent_payments`), the `maintenance_requests` dispatch loop, turnover checklists, and the Compliance-Gate record-keeping.
- **Part-time human manager augments** — an optional human PM plugs in to handle the pieces that want a person (showings, in-person turnovers), working *through* the same module rather than around it.
- **Turnover / maintenance tasked to the workforce layer** (DR-001) — cleaning, repairs, and room-turn work flow to the workforce as guided tasks with the Quality-Gatekeeper QA gate (DR-004) and 1099 payout, the same engine the supportive-housing pipeline (§6) feeds into.

---

## 8. Decision records (local to this doc; see DR-numbering note in the header)

| # | Decision (one line) | Owner | Status | Grounds / links |
|---|---|---|---|---|
| **DR-026** | **Dual operating model per property:** each Poe Properties property runs either (a) whole-unit lease or (b) rent-by-the-room / co-living; the mode is a **per-property switch**, never global; default `whole-unit`. | Darrell (governs) | Accepted | Builds on `schema-v2.2-rentals.sql`; MODULAR-EXTENSIBILITY |
| **DR-027** | **Co-living model:** each room is a rentable sub-unit (bed, small fridge, smart lock); **occupancy configurable 1-2 per room + candidate waitlist**; **$1,000/room/month, utilities included**; living room + bathrooms shared under explicit house rules; housemates modeled as a **unit** reusing group-chat/units + the `maintenance_requests` service-request -> work-order -> dispatch flow. | Darrell (governs) | Accepted | Extends `rentals`/`leases`; reuses units + `maintenance_requests` |
| **DR-028** | **Smart-lock access layer:** issue room access on move-in, revoke on move-out, keep access logs. **Privacy line (binding): locks/logs at the door, NO surveillance inside rooms — ever.** | Darrell (governs) | Accepted | DATA-AS-EMPOWERMENT-NOT-EXTRACTION (no surveillance-as-service) |
| **DR-029** | **Per-property COMPLIANCE GATE (binding):** a property may NOT switch to room-rental until a per-property legal/zoning/licensing checklist (zoning, boarding/rooming-house licensing, occupancy caps, building/fire code incl. egress + smoke/CO per room, insurance, per-room tenancy law) is cleared and recorded. Real-estate -> Trevor (DR-010); non-real-estate -> local/employment counsel (DR-005). **Not legal advice.** | Darrell (governs) + counsel (clears) | Accepted | DR-010, DR-005; gate disables the mode-switch control |
| **DR-030** | **Supportive-Housing / Government-Programs extension:** convergence pipeline (housing -> assessment/case-mgmt -> skill-upgrade -> cohort team -> 1099 work -> outcome reporting) on a grant/voucher funding rail with an outcomes-reporting layer. GUARDRAILS: heavy regulation (supportive-housing licensing, fair-housing, vulnerable-population dignity, grant compliance). **CLINICAL LINE drawn conservatively: supportive HOUSING with wraparound services is IN scope; clinical/SUD TREATMENT is OUT, walled behind the TLC ISO-1/HIPAA boundary. Default housing-only/clinical-walled, PENDING Darrell's explicit confirmation (see §9).** | Darrell (governs) + counsel/program experts | **Accepted, with the clinical-scope decision OPEN** | DR-001, DR-003, DR-004; TLC ISO-1 firewall; COMMUNITY-FIRST, QUALITY-OF-LIFE |

---

## 9. Open items (explicit, for Darrell)

1. **CLINICAL-SCOPE DECISION (DR-030) — needs Darrell's explicit confirmation.** Default and current assumption: **housing-only, clinical fully walled behind TLC ISO-1 / HIPAA.** Confirm whether supportive-housing remains housing-only (wraparound services without clinical treatment), or whether any clinical scope is ever contemplated — in which case it lives on the TLC side of the firewall under that boundary's full controls, never in the housing/rentals domain. **Until confirmed, the module stays housing-only / clinical-walled.**
2. **DR-numbering reconciliation.** This doc uses three-digit `DR-0NN` continuing the 2026-06-09 strategy chain (DR-026 .. DR-030). `main` carries a separate four-digit `DR-00NN` lineage (DR-0001 .. DR-0016). The canonical `docs/decisions/INDEX.md` has an add/add divergence between the two systems that must be reconciled (which scheme is canonical; whether the two indexes merge or stay separate) before any of these DRs land in the canonical index. This doc intentionally does **not** edit `docs/decisions/INDEX.md`.
3. **Co-living price override policy.** $1,000/room/month utilities-included is the stated default; confirm whether per-property overrides are owner-discretion or need a recorded rationale.

---

*This is a plan/record artifact. Recording a decision here authorizes nothing to be built, bought, executed, or switched on. No property mode is changed by this document; no money moves; no automation is enabled. Execution is separately governed (GOVERNANCE-EXECUTION-ADVISORY.md), and every legal item routes to counsel — this document is not legal advice.*
