# Church Module Spec — The Love Corner Nation Instance, then the Reusable Template

**Date:** 2026-06-10 (Wed)
**Author:** Claude (module spec on Darrell's commission — recording architecture already discussed and agreed, grounded on COLG's real practices used as FORMAT references only, never as stored data).
**Status:** PLAN / spec doc. **No code, no purchases, no money movement, no NAS actions, no autonomous execution.** Target module architecture only.
**Decision records:** DR-0050 (Church Module exists; instance-first then template; COLG is instance #1; airtight per-tenant isolation; onboard-in-days sovereign nodes), DR-0051 (north-star = ORGANIZE → MONITOR → LEARN the collective's OUTCOMES, not people-surveillance), DR-0052 (giving / financial-transparency model), DR-0053 (minutes-synthesis → decision ledger + institutional memory), DR-0054 (vendor-payment verification gate / BEC protection + procurement workflow), DR-0055 (BINDING no-leak / data-isolation — church-ISO-2, pattern-not-data on templatization) — see `docs/decisions/INDEX.md`.
**Anchors up to:** DR-0045 (Universal Work Management — the church is this one engine instantiated on the church-operations domain) and DR-0046 (Clarification Is the Default — every church surface answers what·when·why·how by default), in `_root/ARCHITECTURE-PRINCIPLES-COMPOSABLE-SPINE.md` §0.
**Pattern parent:** `2026-06-09-industry-role-module-template-spec.md` — the Church Module is another concrete **instance** of the reusable Industry/Role Module pattern (instance #1 = PMO, #2 = Legal, this = church-operations). Onboards by configuration (DR-0030).
**Federates, does not rebuild:** the Cage (`infra/ai-orchestrator/`), sovereign identity + app-handle (DR-0009, DR-0038), events-as-data / observability (`EXECUTION-OUTCOME-OBSERVABILITY.md`, `INSTITUTIONAL-MEMORY-EVENTS.md`), the PMO Method Engine (DR-0047..DR-0049), the Want-To-Use Bar (DR-0033), the situational auto-tagging engine (DR-0040), the isolation tiers (DR-0003 — Church = ISO-2), the payment-rail vendor dependency (DR-0019), and the ministry-units spec (`2026-05-31-colg-per-unit-documentation-spec.md`). The only net-new component is the thin LLM synthesis/orchestration layer (DR-0028 pattern).

---

## TL;DR (read this first)

1. **One module, built instance-first.** We **perfect THIS church's instance** — The Love Corner Nation (COLG) — then **abstract a reusable, configurable church-AND-business module** other communities adopt by configuration. Instance proves the template; template is never speculative. (DR-0050)
2. **North-star: the church uses the OS to ORGANIZE → MONITOR → LEARN → ensure the COLLECTIVE's OUTCOMES.** This serves the Father's Business / Black-church-economic-powerhouse mission (`BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md`, `COMMUNITY-FIRST-MISSION.md`). **Monitoring means OUTCOMES, never people-surveillance** — dignity, and inform-don't-condemn throughout. (DR-0051)
3. **Giving / financial transparency** digitizes the church's existing transparent monthly statement (multi-account consolidation), shows truthful totals to the body, and gives every giver control of their visibility — **anonymity hides the NAME, never the MONEY.** (DR-0052)
4. **Minutes-synthesis** turns staff minutes/agendas into a decision ledger + institutional memory, monthly. (DR-0053)
5. **A vendor-payment verification gate** stops business-email-compromise (BEC) wire fraud before it starts, and a procurement workflow tracks PO → artifacts → payment/shipment → delivery inspection. (DR-0054)
6. **BINDING no-leak:** COLG's sensitive data is **church-ISO-2**, contained, encrypted, per-tenant isolated, never sold, never exposed. When templatized, **ONLY the pattern travels — never COLG's data.** (DR-0055)
7. **This is a PLAN.** No code, no purchases, no money movement. Any autonomous piece is Tier C and needs all three brakes (`RELEASE-TIERS.md`, three-brakes memory).

---

## 1. What this is — and the instance-first approach

The Church Module is the **church-operations instance** of the Universal Work Management engine (DR-0045): the same engine that runs a vendor transition or a law firm, configured for how a church actually operates. Per Darrell's directive, we build it **instance-first**:

> **Perfect the instance, then abstract the template.** Get THE Love Corner Nation's instance genuinely excellent — wired to their real practices, solving their real pains — and only then lift the *shape* of it into a reusable, configurable module other churches (and church-adjacent businesses) adopt by configuration, each on their own isolated sovereign node.

This is the opposite of building a generic "church app" and hoping a real church fits it. We fit the real church first; the generality is *earned* from a working instance (Architecture Principles §3: "generality in primitives, specific modules instantiated on real demand — no speculative over-build"). The template, when it ships, carries the **pattern**, never the instance's data (DR-0055, §8).

---

## 2. North-star — ORGANIZE → MONITOR → LEARN the collective's OUTCOMES

The church does not adopt the OS to add software. It adopts the OS to **run the Father's Business well** — to organize the body's work, monitor whether the body's *outcomes* are improving, and learn so the next season is better. Four verbs:

- **ORGANIZE** — ministry units, meetings, decisions, events, giving, vendors, and members all carried on one coherent surface instead of scattered across paper, tribal memory, and chat threads.
- **MONITOR — outcomes, not people.** The thing watched is whether the **collective's outcomes** advance: is giving healthy and transparent, are decisions getting executed, are ministry units thriving, is the church's economic mission moving. **This is explicitly NOT surveillance of individuals.** No scoring people, no behavioral dossiers, no engagement manipulation (`DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `QUALITY-OF-LIFE-AS-NORTH-STAR.md` "system-as-mirror-never-judge").
- **LEARN** — institutional memory compounds across decades and leadership transitions (the ministry-units gap, §6), so the church gets *wiser* over time rather than re-learning each handoff.
- **ENSURE OUTCOMES** — the senior question for every surface: does this measurably help the collective's mission? The mission is the Black-church economic powerhouse — soul-prosperity into all-prosperity, done collectively (`BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md`).

**Dignity + inform-don't-condemn (binding).** Wherever the module surfaces a gap — a blocked decision, a lapsed action item, a unit that has gone quiet — it **informs neutrally** and points at the *next step*, never blames a person. This is the same posture as the PMO blocker-attribution surface (DR-0049: constraint attribution, *who can unblock*, not who is at fault) and the Behavioral Mirror's DATA → TRUTH → IDENTITY → INVITATION arc (`BEHAVIORAL-MIRROR.md`). The church is the Body; the tool serves it, it does not police it.

This north-star is recorded as **DR-0051.**

---

## 3. The COLG instance — grounded on real practices (FORMAT references ONLY)

**The Love Corner Nation** — The Church of the Living God, 312 E. Bradley, Champaign IL — is instance #1. The module is wired to the *shape* of how they already operate. Everything below is a **FORMAT / STRUCTURE reference** — the kinds of records and tools the church already uses — and the module digitizes that shape. **No financial figures, balances, account numbers, member records, or staff-discussion specifics are stored, reproduced, or quoted in this spec or anywhere in the module's documentation** (the binding data rule; DR-0055).

The existing real practices the instance models (structure only):

- **Existing transparent monthly financial reporting** — the church already publishes a monthly statement to the body. The module digitizes *that format*, it does not invent a new transparency the church doesn't already practice.
- **Multi-account banking** — operations span more than one institution (Bank of Champaign + Chase). The module's giving/finance surface is therefore **multi-account-consolidating by design** (§4): the truthful total is the *sum across accounts*, not one account's slice.
- **Members system: PowerChurch Plus 11.1** — the church's existing membership/records system. The module **federates / imports from** this format; it does not replace it on day one.
- **Financials system: QuickBooks Premier 2021** — the church's existing books. The module **reads structured exports** from this format for the consolidated statement; QuickBooks stays the system of record for the books themselves.
- **Staff meeting minutes + agendas** — the church already produces these. The module ingests *that format* for minutes-synthesis (§5).

The point of naming these is **interoperability of format** — the module meets the church where it already is (the Want-To-Use Bar, DR-0033: "meets the user where they are"). The point is *not* to capture the contents: structure in, the church's actual numbers and names stay in the church's own isolated tenant (§8).

---

## 4. Giving + financial-transparency model

The church already practices transparent monthly reporting. The module **digitizes and strengthens** that — it does not impose a new doctrine of money. Recorded as **DR-0052.**

### 4.1 Digitized, multi-account, truthful monthly statement
The module produces the **consolidated monthly statement** the body already expects — but as a living digital surface that **sums across every account** (Bank of Champaign + Chase + any others) into one truthful total. The body sees real totals, on time, every month, without a treasurer hand-assembling them. (Structure only; the module holds the *consolidation logic*, the church's tenant holds the *numbers*.)

### 4.2 Giver-controlled visibility — three modes
Every giver controls how their own giving appears. Three modes, the giver's choice, per gift or as a default:

1. **Show** — name + gift visible in the giver-facing record (e.g. the giver sees their own giving history; church records see the attributed gift).
2. **Private-to-church-records** — counted and attributed in the church's official records (so a tax receipt can issue), but **not surfaced to the wider body**.
3. **Fully anonymous** — no name attached anywhere the body can see.

### 4.3 Anonymity hides the NAME, never the MONEY (binding)
This is the load-bearing rule of the transparency model: **an anonymous gift is still counted in the truthful total.** Anonymity removes the *attribution*, never the *amount*. The monthly total the body sees always reflects **every** gift, named or not. Transparency of the collective total is non-negotiable; privacy of the individual giver is honored *within* that truthful total. (This is the giving-surface expression of DATA-AS-EMPOWERMENT: the body owns the truth of its own finances; the giver owns the visibility of their own name.)

### 4.4 Tax-receipt nuance
A **tax-deductible** gift requires a **church record of the gift** (the IRS substantiation rule). So:
- "Show" and "private-to-church-records" gifts **can** produce a deductible receipt (the church has the record).
- "Fully anonymous" gifts, by design, have **no attributable record** — so they **cannot** produce a personal deductible receipt. The module states this trade-off plainly to the giver at the moment they choose anonymity (Clarification Is the Default — the *what/why* of the choice is surfaced before they make it, not discovered at tax time).

### 4.5 Member-to-member giving is DISTINCT from church giving
The module supports **member-to-member (peer) giving** — one member blessing another — and keeps it **categorically separate** from giving *to the church*:
- It rides the **payment rail** as a P2P transfer (the established, swappable payments-platform vendor dependency, DR-0019 — PoeTech does **not** build a money rail).
- It is **not a charitable contribution to the church** and is **not tax-deductible**; it never appears in the church's deductible-giving records.
- The separation is structural, not cosmetic: church-giving and member-to-member money are different ledgers with different tax and visibility rules, and the module never commingles them.

---

## 5. Minutes-synthesis → decision ledger + institutional memory

The church already produces staff minutes and agendas. The module **ingests that format** and synthesizes it into durable structure, **monthly** (matching the existing cadence). Recorded as **DR-0053.**

Ingest minutes/agendas → extract:
- **Decisions** — what was decided, when, by whom → into a **decision ledger** (the same DR-style append-only discipline the project uses, `docs/decisions/`, applied to the church's own governance record).
- **Action items** — what is to be done, **who owns it**, by when → tracked to closure (federating the PMO Method Engine's comms→structured-state and per-item RACI, DR-0047, and the timestamped item ledger, DR-0048, so an action item can't be lost or resurface as "new" months later).
- **Institutional memory** — the *why* behind decisions, preserved across leadership transitions (the ministry-units gap of §6 — knowledge compounds instead of evaporating at each handoff).

This is "Clarification Is the Default" (DR-0046) applied to governance: after every staff meeting, *what was decided / who owns what / what's still open* is plainly present, not buried in a minutes document nobody re-reads. The synthesis layer is the thin net-new LLM component (DR-0028); the storage federates events-as-data + the Cage's append-only ledger.

---

## 6. Ministry units + group chat + identity (reference existing specs)

The church operates through many ministry units (Deacons, Choir, Trustees, Sunday School, Youth, AV/Media, Hospitality, Outreach — exact list defined by Bishop Gwin + Christina). This is **already specified** in `2026-05-31-colg-per-unit-documentation-spec.md` (per-unit documentation + historical-knowledge access on the church's sovereign infrastructure). The Church Module **composes** that spec — it does not re-author it. Key inherited capabilities:

- **Per-unit repository + history** — each unit's meetings, decisions, events, resources, and historical record, searchable by its members, with oversight able to see across the units they govern. Institutional memory survives leadership transitions.
- **Group chat** — each unit's coordination surface. Critically, the unit chat is an **ingest source for comms→structured-state** (PMO §5A.3): chat is where coordination happens, but the *decisions and action items* are lifted into the unit's durable record rather than lost in scrollback (the recurring "status lost in chat" pain the PMO engine systematically kills, DR-0048 §5A.15).
- **Identity** — members are carried on the **sovereign identity layer** (DR-0009 first-party data + sovereign identity; DR-0038 zero-barrier app-handle identity — no email/phone required to belong). Identity is per-tenant and never a third-party lock-in.

These are referenced, not duplicated. The Church Module's contribution is to **wire** units + chat + identity into the same ORGANIZE → MONITOR → LEARN spine as giving, minutes, and vendors — one coherent church surface.

---

## 7. Vendor-payment verification gate (BEC protection) + procurement workflow

Churches are a frequent target of **business-email-compromise (BEC)** wire fraud — an attacker emails "our bank details have changed, please send the payment here." The module makes that attack structurally hard. Recorded as **DR-0054.**

### 7.1 The verification gate (the BEC brake)
- **Out-of-band confirmation of bank details is REQUIRED before any ACH or wire** — the module will not let a payment proceed to new or changed banking details without a confirmation through a *different* channel than the one that requested the change (e.g. a known phone number on file, not the number in the email).
- **An emailed bank-detail CHANGE is flagged HIGH-RISK by default** — a request to change where money goes is the single highest-signal BEC indicator, and the module treats it as such: it halts, flags, and routes to a human with the out-of-band step spelled out (Clarification Is the Default — *what to verify, who to call, why* surfaced at the moment of risk). This is the inform-don't-condemn posture applied to safety: it protects the church without accusing the vendor.
- This is a **payment safety gate**, not money movement: the module **orchestrates the verification logic**; the actual payment rides the established payments vendor (DR-0019). PoeTech never moves the money.

### 7.2 The procurement workflow
Beyond the fraud gate, the module carries the ordinary procurement lifecycle as structured, tracked work (federating the PMO artifact-tracking capability, DR-0047 §5A.5):
- **PO / order** — what was ordered, from whom, for which unit, against which budget line.
- **Vendor contacts** — the verified contacts (the out-of-band channel of record).
- **Artifact tracking** — shipping form / BOL / invoice ingested, validated, and statused (the supplier-CSV pattern of the PMO engine, generalized).
- **Payment + shipment status** — where the money is, where the goods are.
- **Delivery-inspection checklist** — confirm what arrived matches what was ordered before the loop closes.

Every step is timestamped on the item ledger (DR-0048), so a procurement item can't be lost or disputed later.

---

## 8. BINDING no-leak / data-isolation — church-ISO-2

This section is the load-bearing safety boundary of the entire module. Recorded as **DR-0055.**

**COLG's sensitive data — financials, minutes, member records, vendor bank details — is church-ISO-2** (DR-0003: Church tier, doctrine-gated; one tenant's data segregated from every other). Binding rules:

1. **Contained + encrypted + per-tenant isolated.** The church's data lives in the church's own isolated tenant, encrypted, on sovereign infrastructure (the church's own NAS / node where applicable). It does not commingle with any other tenant's data, ever (Architecture Principles §4: isolation as enabler — strict per-sensitivity, per-entity segregation is exactly what lets one platform safely serve a church *and* a clinic *and* a business without cross-contamination).
2. **Never sold, never exposed.** No data sale, no advertising model, no third-party access — structurally, not as a policy that could change (`DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`; DR-0009 no-data-sale).
3. **On templatization, ONLY the pattern is reusable — NEVER COLG's data.** When the module is abstracted for other churches (§9), what travels is the **structure**: the giving-transparency logic, the minutes-synthesis pipeline, the BEC gate, the unit/chat/identity wiring. **COLG's actual figures, names, minutes, and bank details travel NOWHERE.** This is the same method-not-data boundary the PMO engine holds (DR-0047): own the pattern, never host another entity's data outside its own governed tenant.
4. **Strict multi-tenant isolation — no cross-tenant bleed.** Every adopting church is its own isolated, sovereign instance (§9). The situational auto-tagging engine (DR-0040) auto-enforces the tier — data tagged church-sensitive routes behind the ISO-2 boundary automatically; classifying correctly *is* enforcing the boundary; mis-tagging is the leak risk, so sensitive tags are confidence-gated + human-checked + Cage-audited.
5. **Owner / giver-controlled visibility.** Within the church's own truthful records, the **giver** controls name visibility (§4.2) and the **church governance** controls what the wider body sees. Visibility is always a governed, consented choice — never a default exposure.

The structural difference from extractive mainstream church software **is the moat** (DATA-AS-EMPOWERMENT): a church that has been burned by data-harvesting SaaS can verify, structurally, that this one cannot harvest them.

---

## 9. Templatize for reuse — configurable church-AND-business module

Once the COLG instance is genuinely excellent, abstract the **pattern** into a reusable, configurable module (the Industry/Role Module Template, DR-0030). Binding properties:

- **Adopt by CONFIGURATION, not custom build.** Discipline rules (which units, which accounts, which giving modes, which approval gates), system mappings (which members system, which books), role taxonomy, and isolation tier are **config the spine reads** — not code a developer forks (Architecture Principles §3; MODULAR-EXTENSIBILITY anti-pattern). "New church in days," not months.
- **Church AND business.** The same pattern serves a church *and* a church-adjacent business (a ministry that runs an enterprise, a nonprofit, an SMB) — because giving/transparency, minutes/decisions, procurement/BEC-protection, and units/identity are general structures, configured per adopter.
- **Each adopter = its own ISOLATED, sovereign instance.** Per-community sovereign node; per-tenant isolation (§8); no shared data plane. One church's adoption never gives it a window into another's.
- **Onboard-in-days.** Config + the small set of written-once church extensions, not a fresh application per church (DR-0030 "new industry in days," realized for the church domain).

The instance proves it; the template scales it; the isolation keeps every adopter sovereign and safe.

---

## 10. Decision records (this doc)

| DR | One line |
|---|---|
| **DR-0050** | Church Module exists as the church-operations instance of Universal Work Management; **instance-first then template** (perfect COLG, then abstract a configurable church-AND-business module); each adopter = own isolated sovereign node; onboard-in-days. |
| **DR-0051** | North-star = **ORGANIZE → MONITOR → LEARN the collective's OUTCOMES** (Father's-Business / Black-church economic-powerhouse mission); monitoring = outcomes **not people-surveillance**; dignity + inform-don't-condemn. |
| **DR-0052** | **Giving / financial-transparency model** — digitized multi-account consolidated monthly statement; giver-controlled visibility (show / private-to-church-records / fully anonymous); **anonymity hides the NAME never the MONEY**; tax-receipt nuance; member-to-member giving DISTINCT from church giving (P2P, not deductible, via the payment rail). |
| **DR-0053** | **Minutes-synthesis** — ingest staff minutes/agendas → decisions / action items / who-owns-what → decision ledger + institutional memory; monthly cadence. |
| **DR-0054** | **Vendor-payment verification gate (BEC protection)** — out-of-band confirmation before any ACH/wire; emailed bank-detail CHANGES flagged high-risk; plus the procurement workflow (PO → vendor contacts → artifact tracking → payment/shipment status → delivery-inspection checklist). |
| **DR-0055** | **BINDING no-leak / data-isolation** — COLG sensitive data = **church-ISO-2**, contained/encrypted/per-tenant isolated, never sold/exposed; on templatization **only the pattern travels, never COLG's data**; strict multi-tenant isolation; owner/giver-controlled visibility. |

---

## 11. Guardrails on this document

- **This is a PLAN.** No code was written, nothing was purchased, no money moved, no NAS or workflow action was taken, no autonomous execution was started.
- **FORMAT references only.** COLG's real practices (transparent monthly reporting, Bank of Champaign + Chase multi-account, PowerChurch Plus 11.1, QuickBooks Premier 2021, staff minutes/agendas, 312 E. Bradley) are named **as structure to interoperate with** — **no financial figures, balances, account numbers, member records, or staff-discussion specifics are stored, reproduced, or quoted anywhere** in this spec or the module's documentation (DR-0055).
- **Any autonomous piece is Tier C** and needs all three brakes — budget, concurrency lock, kill-switch (`RELEASE-TIERS.md`; the three-brakes binding rule).
- **The method-not-data boundary holds.** The module owns the church-operations *pattern*; every church's actual data stays in that church's own governed, isolated tenant.
