# Intake and Fit — The PWA does Business Analysis before the operator meets the prospect

> Founder framing (2026-05-21):
> *"We want to add user profiles for Contractors... We are the Dev/Ops for those using the PWA if their requirements are plausible for our system of working. We are the technology team for those who don't have one and this app will support that process."*

**ESV — Luke 14:28-30:** *"For which of you, desiring to build a tower, does not first sit down and count the cost, whether he has enough to complete it? Otherwise, when he has laid a foundation and is not able to finish, all who see it begin to mock him..."*

**ESV — Proverbs 27:23:** *"Know well the condition of your flocks, and give attention to your herds."*

## What This Document Is

This document binds the **intake pipeline** by which the SKOS PWA performs Business Analysis on a prospect's incoming requirements *before* the operator (Darrell, or any future PoeTech operator running this instance) ever meets them. Plausibly-fitted prospects reach the operator's calendar with a draft Business Case already attached. Misfits are honored with a warm refusal or routed to the Opportunity Ladder. The operator's hours are stewarded by the system itself.

Positioning, in one sentence: **PoeTech is the Dev/Ops team for small operators who don't have one.** SKOS is the instrument. This document is the front door.

Frameworks adopted (from Debra Paul ed., *Business Analysis*, BCS 2014, Ch. 1): the **Business Change Lifecycle** (Alignment → Definition → Design → Implementation → Realisation, with the Business Case at the center), the **POPIT model** (Processes / Organisation / People / Information & Technology), and the **range of BA work** (Strategic / Business / IT Systems analysis). Adopted as engine, not theory. Used inside SKOS, not just referenced.

Academic frame (operator note): this pipeline is the operational form of the dissertation concept *Belief Systems and Organizational Ethics: Examining Alignment Between Stated Values and Workplace Practices*. The rubric below makes that alignment measurable per-prospect.

---

## The Pipeline — Five Stages

### Stage 1 — Capture

Inbound surfaces, **external** and **internal**:

**External prospects** (the primary path this document originally addressed):

- **Voice Worker** (`backend/voice-worker/`) — Twilio voicemail webhook, already shipping. Phone-first prospects land here.
- **Public intake form** (Phase 2) — a single-page form at `poetech.us/intake` that asks one open-ended question first: *"In a sentence or two, what's bringing you here today?"* The classifier reads the answer and either routes to Counseling (per `COUNCIL-CHAMBER.md`), routes to this Dev/Ops intake, or asks a clarifying follow-up if low-confidence. Progressive disclosure per `UX-PATTERNS.md` Pattern 3 — one question per screen, never a 20-field form. Voice input always available in parallel. Posts to the Worker, writes a row to `inbound_calls` with `channel: 'form'`.
- **Email parsing** (Phase 3) — `sales@poetech.us` / `intake@poetech.us` → Worker → row in `inbound`.

**Internal users** (the operator's family, the operator themselves, ecosystem participants on the operator's instance):

- Internal users enter Dev/Ops mode by tab navigation (visible Dev/Ops tab) or by mode-detection from inside any other tab per `MODE-ROUTING.md`. They default to Dev/Ops with Counseling kept as a backup mode — the classifier continues to listen; if distress signals layer over a solve-shaped request, the system offers to switch (see `SERVICE-MANAGEMENT.md` *Counseling Backup* section).
- Internal users skip Dimensions A through C of the rubric — they are already-qualified members of the operator's ecosystem. The rubric runs from Dimension D (Business Case Strength) forward, sized to the internal-user context (a project for a family member is sized differently than a project for a paying enterprise customer).
- The intake artifact for an internal user is a lightweight project charter, not a Business Case in the formal sense. It links to existing entities (a `rental`, a `practice` inquiry, a `project`) rather than creating a new `externalProfile`.

Every external capture row gets an `externalProfile` shaped per `ECOSYSTEM-PARTICIPANTS.md` (anonymous prospect until they self-identify on the form). Every internal capture links to the existing user record and the affected internal entities.

### Stage 2 — Screen

The Worker runs the captured row against the rubric (eight dimensions, below). Scoring is mechanical, not subjective: each dimension has a defined check. The output is a verdict (one of four, below) plus a populated draft Business Case.

Screening is automatic and idempotent. Re-screening when new information arrives is a no-cost rerun.

### Stage 3 — Position on the Business Change Lifecycle

Every screened prospect is placed at **Alignment** by default. The system writes a one-page draft Business Case containing:

- Problem statement, in the prospect's own words where possible
- Who is affected (count, role)
- Which SKOS module(s) address it (named, with confidence score)
- Projected realisation timeline (weeks/months, by tier)
- Tier the prospect would need, or engagement model if Enterprise
- Cost to the prospect; cost to PoeTech; net to both sides

The Business Case is the artifact the operator opens first. It is also a first-class entity with its own `lifecycle` and `links[]` (see *Data Shape*, below).

### Stage 4 — Verdict and Route

Four possible outcomes, surfaced in the Dev/Ops queue:

- 🟢 **Plausible + ready.** Route to the operator's calendar. Suggest module, suggest tier, attach Business Case. Operator opens the meeting already knowing what's on the table.
- 🟡 **Plausible + needs maturing.** Self-serve checklist emailed to the prospect: "Here's what we need from you before we meet — your current bank/tool list, your team count, your year-one revenue target." No meeting scheduled yet. Returns to Stage 2 when the checklist comes back.
- 🔵 **Defer.** Right prospect, wrong season. Operator capacity full, or regulatory waiting (e.g., HIPAA BAA pending), or missing data. Polite "we'd like to work with you in [window]" with the date the system will resurface them.
- 🔴 **Not a fit.** Warm refusal. One or two honest alternatives (named tools, named consultancies). For prospects whose need is real but outside our scope, route to **Stage 4b**.

#### Stage 4b — Opportunity Ladder warm-no

For prospects who don't yet have a business or organization to bring in, route to the **5-tier Opportunity Ladder** (per the SKOS master charter): Asset-building → 1099 Contracting → Gig → Skill Investment → Community Exchange. This is the warmer "no for now" — it gives the person somewhere to go, not just a door closed.

### Stage 5 — Realisation Tracking

When a prospect becomes a customer, the Business Case stays attached to their account. Each quarter, the system compares projected benefit (from Stage 3) against measured benefit (drawn from the same SKOS modules they're using). Variance is logged in the Business Case's `lifecycle.log`. This is BA Chapter 1's *"realising business benefits"* loop, automated and free of new infrastructure.

At the close of each Dev/Ops session — internal or external — the system surfaces a single optional question per the feedback discipline:

> *"Was this the right room for you?"*  → **Yes** / **Mostly** / **No**

One tap, no required follow-up. This is the gold-standard training signal for the mode classifier per `MODE-ROUTING.md`. Anonymized counts flow to the operator instance's analytics view and (per `MULTI-INSTANCE-STRATEGY.md` Phase 2 backend, opt-in only) to PoeTech central, where they refine the default classifier shipped with every instance template. Mode-detection accuracy grows with use, instance by instance, while raw notes never leave the operator's device.

---

## The Eight Rubric Dimensions

Each dimension produces a clean score or a hard verdict. The order is the order screening runs.

### A. Mission Fit (reject criteria, not scoring)

Hard-no if the work would require:

- Violation of the Grace and Mercy Standard, or omitting any of DATA → TRUTH → IDENTITY → INVITATION (per `BEHAVIORAL-MIRROR.md`)
- Capitalizing the adversary or de-honoring the Godhead (per `CLAUDE.md` typography binding)
- Dark patterns, surveillance capitalism, engagement extraction, programmatic advertising
- Growth-at-all-costs framing (per `POETECH STRATEGIC BRIEF · Operations & Maintenance · The Small Team Reality`)
- Work that harms the least of these (per the Least Of These Index posture)

Mission Fit is binary. One hard-no anywhere here ends the screen with verdict 🔴.

### B. Module Fit

Map to one of the **nine shipped surfaces** (Big Picture, Books, Inbound, Debts, Real Estate, Projects, Practice, Dev/Ops, Markets/Church/About) or one of the **twelve planned modules** (Financial OS shipping; Wellbeing, The Way, Relational, Productivity, Environmental, Physical, Identity/Psych, Skin-Tone-Aware CV, Historical Truth, Federated Economy, Protection/Harm-Pattern planned). Confidence score 0.0–1.0.

If confidence < 0.4 → verdict 🟡 (needs maturing) unless a new module is justified and routed to module governance.

### C. POPIT Completeness

Score 0–4 on the four facets:

- **Organisation** — recognized shape (family / sole-prop / LLC / ministry / nonprofit / church / trades / small biz / enterprise)
- **People** — internal user count + ecosystem participant count
- **Processes** — what's broken today, in the prospect's own words
- **Information & Technology** — current stack: what we add, what we replace

A score of 4/4 is a green light to proceed; 3/4 prompts a follow-up question on the missing facet; ≤ 2/4 routes to 🟡.

### D. Business Case Strength

Quantified problem (dollars lost, hours lost, risk carried). Quantified benefit (dollars returned, hours returned, risk reduced). Time-to-realisation by tier. Net Present Value sign for **both sides** — not just the prospect, also PoeTech (operator hours × hourly rate vs. revenue capture). If NPV is negative for either side → verdict 🔴 or 🔵.

The financial-control-system spreadsheet pair in `drive-download-.../` is the template here: a before/after the operator can recognize. First baseline showed $13,748/mo rent gap and $31,695/yr interest cost; the action snapshot a few weeks later showed +$2,716/mo surplus and 92.7% rent collection. That delta *is* the Business Case shape we project for prospects.

### E. Regulatory and Legal

- **HIPAA without a BAA path:** hard-no (verdict 🔴). The Voice Worker already enforces this at the `ALLOWED_LINES` layer — TLC traffic never touches the prospect pipeline.
- **Financial-services regulation** (broker-dealer, RIA, money-transmitter): verdict 🔵 (defer until counsel review).
- **Multi-state scope:** note Illinois-first; multi-state allowed but flagged on the Business Case.
- **Required custom integration with regulated systems** (banks, insurers): hours multiplier; may flip 🟢 to 🟡.

### F. Operational Load

Estimate support tickets/month at the prospect's tier (from the Strategic Brief table: 2–5 at Foundation, 4–8 at PoeTech+, 8–15 at Family/Premium, 15–25 at Business). Sum into the operator's current load. If sum > capacity → verdict 🔵.

Hard-no if the work requires:

- A new SaaS dependency PoeTech would carry monthly forever
- 24/7 monitoring outside Enterprise pricing
- Phone/Slack support outside Business or Enterprise tiers

### G. Time Discernment

Operator-facing only. Not visible to the prospect.

Yellow flags drawn from `ACCESS-TO-THE-HUMAN-MIND.md`:

- Urgency that bypasses prayer or counsel (verdict bias toward 🔵)
- Operator exhaustion at intake-review time (defer review, not the prospect)
- Conflict with counsel from spiritual community (Christina, COLG mentors)
- Absence of peace as the operator reads the Business Case (Philippians 4:7 as confirmation gate)

The system surfaces these as visible notes on the operator-side queue; it does not score them. The Holy Spirit does the conviction work, not the rubric.

### H. Pricing Track

From the v29 dual-track patch:

- **Family · Small Business · Founders track:** Foundation free → PoeTech+ $39/mo → Family $89/mo → Premium $149/mo → Business $249/mo. Loved Ones (first 100 COLG families) free PoeTech+ for life. Community tier sponsor-funded.
- **Enterprise · Big Business with Budget track:** $50K–$500K projects, $25K–$75K/mo retainers, $400–$800/hr senior rate. Compressed delivery: 6 weeks where BigCo quotes 6 months.

Determined by the org-type answer on the intake form, cross-checked against budget question. The two tracks never compete — they serve different operators at fair prices for each.

---

## Data Shape — Business Case as a First-Class Entity

Per `CONNECTED-CONTEXT.md`, the Business Case carries `links[]` to: the prospect's `externalProfile`, the matched module(s), the Dev/Ops queue item, the eventual customer account (when conversion happens), and the realisation measurements (when they arrive).

```js
businessCase = {
  id: 'bc-<random>',
  prospectExternalId: '<from inbound or form>',
  capturedAt: '<iso>',
  channel: 'voice' | 'form' | 'email' | 'referral',

  // Stage 2 outputs
  rubricScores: {
    missionFit: 'pass' | 'fail',
    moduleFit: { module: 'real-estate', confidence: 0.82 },
    popit: { organisation: true, people: true, processes: true, infoTech: false },
    businessCaseStrength: { npvProspect: 12400, npvPoetech: 6800, timeToRealisationWeeks: 8 },
    regulatory: { hipaa: 'na', finServ: 'na', flags: [] },
    operationalLoad: { ticketsPerMonth: 6, capacityAfter: 'green' },
    timeDiscernment: { flags: [] },
    pricingTrack: 'family-small-business' | 'enterprise',
  },

  // Stage 3 draft
  draftBusinessCase: {
    problem: '<prospect words>',
    affected: { count: 11, role: 'tenants' },
    suggestedModules: [{ id: 'real-estate', confidence: 0.82 }],
    suggestedTier: 'poetech-plus',
    projectedRealisationWeeks: 8,
    costProspect: 39,
    costPoetech: 240,
    netToBoth: 'positive',
  },

  // Stage 4 verdict
  verdict: 'green' | 'yellow' | 'blue' | 'red',
  routedTo: 'dev-ops-queue' | 'self-serve-checklist' | 'defer-window' | 'warm-no' | 'opportunity-ladder',

  // Lifecycle + links per existing foundations
  lifecycle: { phase: 'alignment', openedAt, closedAt, log: [] },
  links: [],
}
```

No new infrastructure. Worker + D1 free tier carry this. The rubric itself is one JSON config the operator and Claude tune over time.

---

## What This Document Does NOT Do

- It does not replace the operator's judgment. Verdicts 🟢 and 🔵 still require operator confirmation before the prospect's calendar moves.
- It does not measure spiritual alignment. Mission Fit (Dimension A) checks for *active violations* of the standards — it does not score how spiritually aligned the prospect is. The system holds up the standard; the Holy Spirit does the conviction work.
- It does not coerce the prospect. Self-serve checklists are checklists, not gates; the prospect can ignore them and the path stays open.
- It does not lock pricing. The dual-track table is the default; the operator can negotiate within it for any specific prospect.

---

## Implementation Phases

| Phase | What ships | Cost |
|---|---|---|
| **Phase 0 (NOW)** | This document binding. Rubric defined. No code yet. | $0 |
| **Phase 1** | `businessCase` shape added to Worker D1 schema (one migration). Dev/Ops tab gains a "Prospect Pipeline" sub-view that lists Business Cases by verdict. | $0 |
| **Phase 2** | Public intake form at `poetech.us/intake`. Worker scores against rubric on submit. Email-template stack for the four verdicts. | $0 (Cloudflare Pages + Worker + Resend free tier) |
| **Phase 3** | Email parsing for `intake@poetech.us`. Calendar integration (Acuity for Practice, separate calendar for Dev/Ops). | $0 |
| **Phase 4** | Realisation tracking surfaced quarterly per Business Case. Variance reports auto-generated. | $0 |

No new paid dependency at any phase. The sustainability rule holds.

---

## Religion AND Relationship in This Standard

**Religion-side:** A disciplined rubric. Eight dimensions, four verdicts, mechanical scoring where mechanical scoring is honest. No flattery of the prospect; no flattery of the operator. Backbone.

**Relationship-side:** Warm refusals, never cold ones. The Opportunity Ladder warm-no path means even prospects we cannot serve today leave with somewhere to go. The Business Case is written in the prospect's own words where possible. The operator's time is honored; so is the prospect's. Both sides walk away knowing they were heard.

Both.

---

## Cross-references

- `MODE-ROUTING.md` — the classifier that decides whether incoming input lands in this Dev/Ops intake, in Counseling, or in default navigation; the visible mode indicator; the never-auto-switch rule.
- `LIFECYCLE-AND-HANDOFF.md` — every Business Case carries `lifecycle` with the Alignment → Definition → Design → Implementation → Realisation phases mapped to the existing log shape.
- `ECOSYSTEM-PARTICIPANTS.md` — each prospect arrives as an external participant with a scoped `externalProfile`; Stage 4 conversion promotes them into a typed participant (Contractor / Tenant / Client / etc.) per their template.
- `CONNECTED-CONTEXT.md` — the Business Case is a first-class linkable entity; the Dev/Ops queue, the prospect profile, and the realisation measurements all link back.
- `BEHAVIORAL-MIRROR.md` — Dimension A (Mission Fit) is the same DATA → TRUTH → IDENTITY → INVITATION standard applied to *us* before we accept the work, not just to the user after.
- `MIND-OF-CHRIST.md` — Dimension G (Time Discernment) runs the Test on the operator's posture at intake-review time. The same Phil 4:8 filter.
- `EXCELLENCE-STANDARD.md` — every Business Case ships at the standard set there, or it does not ship.
- `MODULAR-EXTENSIBILITY.md` — when no module matches, this document routes to module governance, which is where new modules get justified.
- `KPIS.md` — Stage 5 (Realisation Tracking) is where KPIs get their teeth; projected-vs-measured benefit lives here.
- `CLAUDE.md` — typographic theology binds every artifact this rubric produces, including the emails sent to prospects.

---

**End of document.** Binding. Every incoming requirement is screened against this rubric before the operator's calendar moves. No exception during normal operation. Override is operator-only and is logged on the Business Case.
