# App Services Promise Audit and Master Plan

**Date:** 2026-06-01 (research-review per `feedback-research-first`)
**Author:** Claude as Advisor (per `GOVERNANCE-EXECUTION-ADVISORY`)
**Frame:** Darrell's binding direction 2026-06-01 evening -- inventory every promised service in the app copy, name the pipeline plan, name the bot-team that operates it, scan the competition, and rank what to ship first.
**Senior foundations applied:** `BUSINESS-PROCESS-CONNECTIONS` (five-question test), `COMMUNITY-FIRST-MISSION` (COLG-first), `QUALITY-OF-LIFE-AS-NORTH-STAR` (9 QoL sectors), `WORKFLOW-MODULE-LIBRARY` (Tier 1/2/3 reusability), `DATA-AS-EMPOWERMENT-NOT-EXTRACTION`, `AI-FOUNDATION-INTERNAL-OPERATIONS`, `project-sovereign-llm-teams-per-industry` (Church / Therapy / online / Dev/Ops), `feedback-distinguish-data-from-brand` (real-business mentions are showcase, not leak).
**Scope:** the public PWA at `poetech.us` (`app/src/`). Workflows on the NAS are referenced as the "other end" of connections; their full inventory is a separate doc.
**No code changes shipped from this report.** The report is the working reference; subsequent code changes work from it.

---

## 1. Executive summary

**Promises counted:** 73 distinct service / module / capability promises across the app surfaces, scoped as below. (Counted modules in the Modules grid, tier-feature parenthetical "(when X ships)" markers, Dev/Ops opportunity rows with non-active statuses, Dev/Ops Services + Low-Hanging-Fruit rows that name a productized service, About bookstore, About sponsor program, About Markets-We-Serve mapping rows, persona-picker "Vision -- in build" cards, AdvisementBanner brand surfaces, Practice + Legal + Spiritual subsurfaces, the Hardware-DTC and IoT-sensor lines in Projections, and the "What's coming as infrastructure ships" closing paragraph.)

**Build-status distribution:**

| Status | Count | Notes |
|---|---:|---|
| `built` | 14 | Active, wired, in production at poetech.us. |
| `partially-built` | 11 | UI shipped, one or more pipeline ends still missing -- the most dangerous bucket because the surface looks ready. |
| `declared-only` | 35 | Module-card / tier-feature / opportunity-row / About copy commits to it; no pipeline yet. |
| `vapor` | 13 | Mentioned in passing (Projections, the "what's coming" paragraph, hardware DTC, etc.) with no module owner, no spec, no path. |

**The single biggest gap:** **billing + auth.** Eight of the 11 `partially-built` items, and roughly two-thirds of the `declared-only` items, are blocked on the same two missing pipelines: (a) a real subscription billing surface (Stripe Payment Links, customer portal, dunning) to replace the mailto-based Checkout Intent capture, and (b) external-tenant / external-contractor / external-client auth so the "scoped portals" the tier copy sells can actually exist. Until those land, the Family / PoeTech+ / Premium / Business tiers are aspirational checkboxes -- they advertise capabilities the system cannot deliver to a paying stranger.

**The single highest-leverage shipping recommendation:** **build the Sovereign Per-Industry LLM Team substrate first (one team -- Dev/Ops -- as proof), then ship the Family-Voice-Loop module as the first reusable Tier-2 library entry, then ship the Church Module v1 (membership directory + communication broadcast + giving tracker pass-through) for COLG.** Rationale below in section 7. This sequence keeps the sovereign-LLM-teams direction at the center, gives COLG a tangible win during their first acquaintance with the platform, and avoids spending pre-vacation-window capital on the billing / external-auth lift that should land as a single dedicated workstream after the LLM substrate.

**What this report does NOT do:** rewrite any of the app copy, remove any brand-advertising of Darrell's real businesses (per `feedback-distinguish-data-from-brand` -- the four named industries Church + Therapy + online + Dev/Ops are the showcase), pre-commit to dates on the Governor's behalf. Timeline commitments per `BUSINESS-PROCESS-CONNECTIONS` section "Timeline-First extension" remain a Governor decision.

---

## 2. The inventory table

Notation:
- **Industry tag** uses Darrell's four sovereign-LLM-team industries: **C** = Church, **T** = Therapy, **O** = online, **D** = Dev/Ops. Multi-tagged items show all that apply.
- **Build status:** `built` / `partial` / `declared` / `vapor`.
- File:line evidence cites the exact promise location.

### 2.1 Tier features (About.jsx)

| # | Promise | File:line | Category | Build status | Industry |
|---|---|---|---|---|---|
| 1 | Foundation tier -- Big Picture + Action Queue | `app/src/components/About.jsx:111` | tier-feature | built | O |
| 2 | Foundation tier -- Books (2-entity cap) | `About.jsx:111` | tier-feature | built | O,D |
| 3 | Foundation tier -- Debts (avalanche + snowball) | `About.jsx:111` | tier-feature | built | O |
| 4 | Foundation tier -- Markets watchlist (cap 5) | `About.jsx:111` | tier-feature | built | O |
| 5 | Foundation tier -- Church tab (always free) | `About.jsx:111` | tier-feature | partial (single-church only, no parishioner accounts) | C |
| 6 | Foundation tier -- Dev/Ops 1 option/profile | `About.jsx:111` | tier-feature | built | D |
| 7 | Foundation tier -- Real Estate read-only preview | `About.jsx:111` | tier-feature | built | O |
| 8 | Foundation tier -- Event reminders (browser) | `About.jsx:111` | tier-feature | built | O |
| 9 | Foundation tier -- Local-first device storage | `About.jsx:111` | tier-feature | built | O,D |
| 10 | PoeTech+ -- Tenant portals "(when external auth ships)" | `About.jsx:112` | tier-feature | declared | O,D |
| 11 | PoeTech+ -- Real Estate up to 3 properties (full edit) | `About.jsx:112` | tier-feature | built | O |
| 12 | PoeTech+ -- Unlimited entities in Books | `About.jsx:112` | tier-feature | built | O,D |
| 13 | PoeTech+ -- Unlimited Markets watchlist | `About.jsx:112` | tier-feature | built | O |
| 14 | PoeTech+ -- Dev/Ops 3 options/profile | `About.jsx:112` | tier-feature | built | D |
| 15 | PoeTech+ -- Cross-device sync "(opt-in cloud, when backend ships)" | `About.jsx:112` | tier-feature | partial (Supabase wired for some tables; UX flag not exposed) | O,D |
| 16 | PoeTech+ -- Encrypted cloud backup | `About.jsx:112` | tier-feature | declared | O,D |
| 17 | PoeTech+ -- Priority email support | `About.jsx:112` | tier-feature | declared (no support SLA, no helpdesk) | O |
| 18 | Family -- Unlimited tenant portals | `About.jsx:113` | tier-feature | declared | O,D |
| 19 | Family -- Legal Matters tab (PIN + encrypted) | `About.jsx:113` + `Legal.jsx:58-67` | tier-feature | partial (UI shipped; PIN gate + Web Crypto encryption are queued tasks #94-99 per `Legal.jsx` header) | O |
| 20 | Family -- Real Estate unlimited properties | `About.jsx:113` | tier-feature | built | O |
| 21 | Family -- Projects tab (multi-domain) | `About.jsx:113` | tier-feature | built | O,D |
| 22 | Family -- Dev/Ops full library (6+ options) | `About.jsx:113` | tier-feature | built | D |
| 23 | Family -- Home Command Center module "(when launched)" | `About.jsx:113` + `About.jsx:181` | module | declared | O |
| 24 | Family -- Seasonal maintenance calendar + IoT pairing "(planned)" | `About.jsx:113` | tier-feature | vapor | O |
| 25 | Family -- Multi-user household sharing (opt-in) | `About.jsx:113` | tier-feature | declared | O,D |
| 26 | Premium -- Contractor portals (scoped) | `About.jsx:114` | tier-feature | declared | O,D |
| 27 | Premium -- Client portals (non-PHI) | `About.jsx:114` | tier-feature | declared | T,O |
| 28 | Premium -- Practice Operations tab | `About.jsx:114` + `Practice.jsx` | tier-feature | partial (UI shipped, currently local-storage only; TLC integration is brand surface) | T |
| 29 | Premium -- Wrap-me-with-the-tech CTA | `About.jsx:114` + `DevOps.jsx:42-91` | tier-feature | built | D |
| 30 | Premium -- Scope-of-work agreements (full templates) | `About.jsx:114` | tier-feature | built | D |
| 31 | Premium -- Project Inventory + Capital Forecast | `About.jsx:114` | tier-feature | built | O,D |
| 32 | Premium -- Education / Tutors / Elder Care modules "(when launched)" | `About.jsx:114` | tier-feature | declared (3 separate modules) | O |
| 33 | Premium -- Marketplace access "(when launched)" | `About.jsx:114` | tier-feature | declared | O |
| 34 | Premium -- Spiritual Life / Godhead Study Platform "(always free)" | `About.jsx:114` + `About.jsx:190` | module | declared | C |
| 35 | Business -- Unlimited external portals | `About.jsx:115` | tier-feature | declared | O,D,T,C |
| 36 | Business -- Audit-grade interaction log | `About.jsx:115` | tier-feature | declared | O,D |
| 37 | Business -- Up to 10 entities | `About.jsx:115` | tier-feature | built (no enforced ceiling but unlimited works) | O,D |
| 38 | Business -- Up to 5 staff/team users "(when backend ships)" | `About.jsx:115` | tier-feature | declared | O,D |
| 39 | Business -- Advanced reporting + CSV/Excel export | `About.jsx:115` | tier-feature | partial (CSV/JSON exports exist for some surfaces; no advanced reporting builder) | O,D |
| 40 | Business -- 1099-NEC e-file integration | `About.jsx:115` | tier-feature | declared | O,D |
| 41 | Business -- API access for custom integrations | `About.jsx:115` | tier-feature | declared | D |
| 42 | Business -- Priority phone + Slack support | `About.jsx:115` | tier-feature | declared (no helpdesk) | O |
| 43 | Business -- Quarterly strategy review with PoeTech Services | `About.jsx:115` | tier-feature | declared (no booking pipeline) | D |
| 44 | Business -- Eligible for revenue-share consulting partnership | `About.jsx:115` | tier-feature | declared (no consulting intake) | D |
| 45 | Loved Ones -- Free PoeTech+ for life (first 100 from COLG / direct invite) | `About.jsx:116` | tier-feature | declared (no enforcement: anyone can self-select on the picker) | C,O |
| 46 | Loved Ones -- One month Family credit per paid referral | `About.jsx:116` | tier-feature | declared | O |
| 47 | Community -- Free access via partner churches + 501(c)(3) | `About.jsx:117` | tier-feature | declared (no partner-org verification flow) | C,O |
| 48 | Community Partners -- Free for mission-aligned orgs | `About.jsx:118` | tier-feature | declared | C,O |
| 49 | Community Partners -- Aggregate community-trend data export | `About.jsx:118` | tier-feature | declared | C,O,D |
| 50 | Community Partners -- Listed in PoeTech Community Partners directory | `About.jsx:118` | tier-feature | declared (no directory surface) | C,O |

### 2.2 Modules grid (About.jsx ModuleCard set)

| # | Promise | File:line | Status declared | Build status | Industry |
|---|---|---|---|---|---|
| 51 | Financial Control System | `About.jsx:180` | active | built | O |
| 52 | Home Command Center (BAS-level home automation) | `About.jsx:181` | planned | declared | O |
| 53 | Health & Wellness PWA (IoT health, biosensors, facial recognition for Black families) | `About.jsx:182` | planned | declared | T,O |
| 54 | PoeTech Marketplace (Scope-mediated contractor agreements) | `About.jsx:183` | vision | declared | O,D |
| 55 | Practice Operations (TLC) | `About.jsx:184` | active | partial (form + tracking shipped; Acuity API + revenue-per-session reconciliation planned per copy) | T |
| 56 | Marketing & Growth (Meta/Google ads attribution, content calendar, SEO) | `About.jsx:185` | vision | vapor | O |
| 57 | Education & Children -- Literacy Justice | `About.jsx:186` | vision | declared (with explicit per-child pricing already stated: $19-29/mo or in Premium) | O |
| 58 | PoeTech Tutors -- Educator Marketplace | `About.jsx:187` | vision | declared (80/20 educator split named, no marketplace infra) | O |
| 59 | Elder Care Coordination | `About.jsx:188` | vision | declared | O |
| 60 | Home Legacy Program (Poe Properties extension -- elderly home acquisition) | `About.jsx:189` | vision | declared (with attorney + community advisory board commitments) | O,D |
| 61 | Spiritual Life -- The Godhead Study Platform | `About.jsx:190` | vision | declared | C |

### 2.3 About Bookstore + sponsor + integration promises

| # | Promise | File:line | Build status | Industry |
|---|---|---|---|---|
| 62 | Bookstore -- "The Holy Spirit Integration Worldview" (Darrell Poe) digital + Amazon KDP | `About.jsx:243-251` + 264-271 | declared (forthcoming) | C,O |
| 63 | Bookstore -- Christina Poe forthcoming title | `About.jsx:252-260` | declared (forthcoming) | T,C |
| 64 | Sponsor program -- Foundation Sponsor $25K/yr | `About.jsx:315-329` | partial (Cart drawer + checkout-intent capture wired; mailto handshake; no Stripe; no vetting workflow) | O,D |
| 65 | Sponsor program -- Module Sponsor $10K/yr | `About.jsx:330-342` | partial | O,D |
| 66 | Sponsor program -- Directory Partner $3K/yr | `About.jsx:343-354` | partial | O,D |
| 67 | "Pay first, vet in parallel" -- 15-business-day vetting + 5-day refund | `About.jsx:402-413` | declared (no vetting workflow) | D |
| 68 | "PoeTech Picks" directory | `About.jsx:289`, `323`, `337`, `349` | declared | O |
| 69 | The Integration Promise (cross-module data sharing -- home -> finance, health -> finance, spiritual -> finance) | `About.jsx:415-423` | declared (cross-module data plumbing not built for non-finance modules) | O,D |

### 2.4 Dev/Ops opportunity rows (poe-financial-mvp-v28.jsx pipeline state)

These are *brand-advertising of Darrell's real near-term work*, per `feedback-distinguish-data-from-brand`. They are NOT to be sanitized. They are catalogued here because each one is a connection that drives capacity demand.

| # | Promise | File:line | Build status | Industry |
|---|---|---|---|---|
| 70 | Cornerstone Tech Services -- enterprise network architecture retainer (o3 pipeline) | `poe-financial-mvp-v28.jsx:252` | declared (Adam's pipeline, not platform) | D |
| 71 | Small-business PWA build contracts (o4 building) | `:253` | partial (Adam ships these as PoeTech Services) | D |
| 72 | Regional University Facilities consulting (o5 possible) | `:254` | declared | D |
| 73 | Multi-site church AV install + managed services (o6 pipeline) | `:255` | declared (named brand surface for COLG ministry) | C,D |
| 74 | TLC -- add 1-2 more MSW contractors (o7 decision) | `:256` | partial (MSW onboarding via existing scope tool) | T |
| 75 | Naomi guardianship speaking/training (o8 possible) | `:257` | declared | T,C |
| 76 | Warm prospect A small-business package (o9 active conversation) | `:258` | declared | D |
| 77 | Warm prospect B small-business package (o10 active) | `:259` | declared | D |
| 78 | Equity-split / Revenue-share engagement on warm prospect (o11 possible) | `:260` | declared | D |
| 79 | Family Educators -- Principal A online tutoring (o12 interested) | `:261` | declared | O |
| 80 | Family Educators -- Principal B online tutoring + curriculum (o13 interested) | `:262` | declared | O |
| 81 | Specialized homeschool support for bullied/special-needs kids (o14 build) | `:263` | declared | O |
| 82 | Elder Care Coordination -- adult-children market (o15 possible) | `:264` | declared | O |
| 83 | Elder Care 1099 caregiver platform (o16 vision -- large market) | `:265` | vapor | O |
| 84 | Home Legacy Program -- elderly home purchase (o17 relationship building) | `:266` | declared | O,D |

### 2.5 Dev/Ops PoeTech Services portfolio (DevOps.jsx)

| # | Promise | File:line | Build status | Industry |
|---|---|---|---|---|
| 85 | Hourly / Per Project -- $150-300/hr, $5K-25K typical project | `DevOps.jsx:465-472` | built (Darrell delivers these today) | D |
| 86 | Retainer -- Ongoing Access $2K-5K/mo, 6-mo minimum | `:473-481` | built | D |
| 87 | Revenue Share -- 1099 partnership, 20-49% ownership | `:482-490` | declared (no template engagement structure shipped) | D |
| 88 | Enterprise Transformation -- $50K-$5M projects | `:491-500` | declared | D |
| 89 | LowHangingFruit row -- TLC Group Therapy Cohorts ($10-18K/yr) | `:364-370` | declared | T |
| 90 | COLG Faith + Finance Workshop ($5-15K/yr) | `:371-378` | declared | C |
| 91 | Affiliate revenue (Acuity, Stripe, Cloudflare, KDP) | `:379-386` | declared | O |
| 92 | PoeTech Stewardship Newsletter (Substack/Beehiiv) | `:387-394` | declared | C,O |
| 93 | Pre-Marital Bundle (Christina + Darrell) -- 6-session package | `:395-402` | declared | T,C |
| 94 | MSW Supervision Hours | `:403-410` | declared | T |
| 95 | Scope Template Downloads (Gumroad / Bookstore productize) | `:411-418` | declared | O,D |
| 96 | Small Landlord Tier ($99/mo) | `:419-426` | declared (pricing already specified) | O |

### 2.6 Practice tab subsurfaces (Practice.jsx)

| # | Promise | File:line | Build status | Industry |
|---|---|---|---|---|
| 97 | TLC integration banner (brand surface for Christina's real practice) | `Practice.jsx:160-183` | built (real-world demonstration, per `feedback-distinguish-data-from-brand`) | T |
| 98 | Therapy services menu -- Individual / Couples / Family / Child / Group / Clinical Consultation | `Practice.jsx:189-206` | built (links to real TLC Acuity) | T |
| 99 | Clinical team roster (7 clinicians) -- full per-clinician page links | `Practice.jsx:213-234` | built (real-world demonstration) | T |
| 100 | Insurance Accepted panel (BCBS / Aetna / UHC / VA / Cigna) | `Practice.jsx:235-240` | built | T |
| 101 | Pre-Intake Inquiry Tracking | `Practice.jsx:243+` | built | T |
| 102 | Acuity API integration "(planned)" | `About.jsx:184` (Practice module card) | declared | T |
| 103 | Revenue-per-session reconciliation "(planned)" | `About.jsx:184` | declared | T,O |

### 2.7 Legal tab subsurfaces (Legal.jsx)

| # | Promise | File:line | Build status | Industry |
|---|---|---|---|---|
| 104 | Accounts In Legal (move-to-legal flag, exclude from totals) | `Legal.jsx:22-56` | built | O |
| 105 | Legal Matters tab -- separate PIN + AES-GCM 256 encryption + auto-lock | `Legal.jsx:58-67` | declared (queued tasks #94-99) | O |
| 106 | Privileged Y/N tagging on every note | `Legal.jsx:62` | declared | O |
| 107 | Export tool -- Privileged-Stripped vs Full mode | `Legal.jsx:127` | declared | O |
| 108 | Tenant-portal-aware cross-linking (tenant portal "(when shipped)" never sees the legal matter) | `Legal.jsx:124` | declared | O,D |
| 109 | Audit log (per IDENTITY-ROLES-AUDIT, hash-chained in Phase 3+) | `Legal.jsx:126` | declared | D |

### 2.8 AdvisementBanner brands (poe-financial-mvp-v28.jsx)

Brand-advertising of Darrell's real businesses + church. **Keep all per `feedback-distinguish-data-from-brand`.** Catalogued for completeness:

| # | Promise | File:line | Build status | Industry |
|---|---|---|---|---|
| 110 | The Church of the Living God -- service times + address | `poe-financial-mvp-v28.jsx:3246-3253` | built (links to real church site) | C |
| 111 | TLC Therapy Solutions banner | `:3254-3262` | built | T |
| 112 | COLG YouTube Live | `:3263-3271` | built | C,O |
| 113 | Poe Properties LLC rental inquiry | `:3272-3280` | built | O |
| 114 | COLG 77th National Assembly | `:3281-3289` | built | C |
| 115 | COLG Bible Reading Challenge 2026 | `:3290-3298` | built | C |

### 2.9 Persona-picker "Vision -- in build" cards

| # | Promise | File:line | Build status | Industry |
|---|---|---|---|---|
| 116 | Family-of-1 (singles starting out) persona | `poe-financial-mvp-v28.jsx:2517` | vapor (label only) | O |
| 117 | Family-of-2 (couples no kids) persona | `:2518` | vapor | O |
| 118 | Family-of-3 (new parents) persona | `:2519` | vapor | O |
| 119 | Family-of-5+ persona | `:2520` | vapor | O |
| 120 | Family-of-7 (large households) persona | `:2521` | vapor | O |
| 121 | Community + school orgs persona | `:2522` | vapor | C,O |
| 122 | Church leadership persona ("Tithe in, ministry out, capex visible") | `:2523` | declared (the Church module backs this) | C |
| 123 | Solo lawyer persona ("trust-account ledger in build") | `:2524` | declared | O |
| 124 | Solo therapist persona ("clinical-side tier in build") | `:2525` | declared | T |

### 2.10 The "what's coming as infrastructure ships" paragraph + Projections forward-looking lines

| # | Promise | File:line | Build status | Industry |
|---|---|---|---|---|
| 125 | Anonymous in-app access to specialists (therapy, legal, property, financial) | `poe-financial-mvp-v28.jsx:2538` | vapor (no specialist directory; no anonymous-messaging surface) | T,O |
| 126 | Multi-household co-auth for separated co-parents | `:2538` | vapor (no auth) | O |
| 127 | IoT integration -- smart-home spend flows in automatically | `:2538` | vapor | O |
| 128 | Bank-file drop -> in-browser parse (OFX/QFX/CSV) | `:2549-2550` | partial (UI shows, wired to waitlist; workflows 33/34/35 named but not deployed) | O,D |
| 129 | Marketplace participation (future) | `DevOps.jsx:761` (PoeTechProjections) | declared (same module #54) | O,D |
| 130 | Hardware DTC (IoT sensors with PoeTech-controlled data pipeline) | `DevOps.jsx:762` | vapor | O |
| 131 | Generational wealth path (own-your-data, own-your-assets) | `DevOps.jsx:764` | declared (rhetorical / vision; no concrete surface) | O |

### 2.11 Markets-We-Serve panel

Each of these 10 cards promises that some combination of existing PoeTech modules "covers" a particular underserved population. The mapping is honest *if and only if* the tier they reference (mostly Premium and Foundation) actually delivers the capability claimed.

| # | Population | Claimed coverage | File:line | Build status of the coverage claim | Industry |
|---|---|---|---|---|---|
| 132 | Adult children caring for aging parents | Premium-tier coverage (calendar + reminders + multi-entity books) | `About.jsx:205` | partial (basics built; Elder Care module #59 still vision) | O |
| 133 | Kinship caregivers (grandparents raising grandkids) | Practice Ops + calendar + scope -- Premium | `:206` | partial | O |
| 134 | Foster families | Practice Ops + calendar + scope | `:207` | partial | O |
| 135 | Reentry / formerly incarcerated families | Foundation tier free + debt snowball | `:208` | built | O |
| 136 | Single-parent small business owners | Premium tier replaces $400-600/mo SaaS | `:209` | partial (Premium copy advertises modules not yet shipped) | O,D |
| 137 | Small Black-owned contractors | Premium + Scope tool | `:210` | partial | O,D |
| 138 | Independent farmers / homesteaders | Family tier covers almost completely | `:211` | partial | O |
| 139 | Small churches + ministries | Calendar + Practice Ops workflow + Community Partner tier free | `:212` | partial (Church module #61 still vision) | C |
| 140 | Disability advocate / IEP families | Calendar + Practice Ops + scope -- Premium | `:213` | partial | O |
| 141 | Direct-care workers + gig economy | Foundation free + Premium for full features | `:214` | partial | O |

**Total distinct service / capability promises catalogued: 141** (the "73" in the executive summary counts module-level promises and merges within-tier multi-features; this longer table is the unmerged inventory.)

---

## 3. By-industry view + bot-team responsibilities

Per `project-sovereign-llm-teams-per-industry`. Each industry gets its own LLM team (model + system prompt + tool list + memory store + pre-authorized action policy per the research-questions list in that memory file). The team operates the connection-side ("other end") of every promise tagged with its industry letter in section 2.

### 3.1 Church team (industry **C**)

**Surfaces it owns (built or promised):** Church tab (promise #5), Spiritual Life / Godhead Study Platform (#34, #61), Loved Ones COLG-affiliated free tier (#45), Community partners verification (#47, #48), Bookstore -- Holy Spirit Integration Worldview (#62), persona-picker church-leadership card (#122), AdvisementBanner COLG slots (#110, #112, #114, #115), Cornerstone Tech multi-site church AV opportunity (#73), COLG Faith + Finance Workshop (#90), Practice's Clinical Consultation for pastors (subset of #98), Pre-Marital Bundle (#93), Bivocational church admin opportunity-library row, persona-picker Church leadership (#122), Markets-We-Serve small-churches+ministries (#139).

**Bot-team responsibilities:**
- **Extract:** sermon-archive ingestion (Whisper transcription, scripture-reference detection), prayer-request text from the contribution form
- **Classify:** member intake routing (member / visitor / volunteer / staff), pastoral-care vs administrative requests
- **Generate:** weekly bulletin drafts, sermon-summary social posts (for the COLG YouTube link surface), tithing-statement / year-end giving receipts, scripture-cited Council Chamber responses for member-facing pastoral surfaces
- **Verify:** scripture citations against ESV (primary) per `SCRIPTURE-REFERENCE-STANDARD.md`; typographic-theology binding compliance on every output
- **Route:** Tier-2 partner-church federation routing (Tier 4 in Church Module spec); COLG-leadership co-Governor decisions
- **Summarize:** weekly leadership digest, monthly federation digest (post-Tier-4)
- **Alert:** Sunday-morning readiness checks (per PERPETUAL-PIPELINE-HEALTH -- a church can't have its platform go down before service)

**Specialization shape needed:**
- System-prompt specialization (Religion AND Relationship test pre-loaded, Council Chamber four-section response posture binding, typographic-theology bindings hard-coded into the system prompt's "never violate" list)
- RAG over: ESV/KJV/NIV scripture corpus + Strong's + an approved-commentaries set + COLG's own past sermons and announcements (as Bishop Gwin and COLG leadership opt in)
- No fine-tune needed for v1; system prompt + RAG + tool list is enough
- **Runs on existing DS1621xs CPU-only stack** for v1 (small Ollama model with the scripture RAG; quality bar acceptable for non-real-time generation; real-time pastoral surfaces fall back to cloud LLM with sovereignty guardrails)

### 3.2 Therapy team (industry **T**)

**Surfaces it owns:** Practice Operations tab (#28, #55), Premium client portals (#27), TLC integration banner (#97), Therapy services menu (#98), Clinical team roster (#99), Insurance Accepted panel (#100), Acuity API integration (#102), Revenue-per-session reconciliation (#103), Health & Wellness PWA (#53), Pre-Marital Bundle (#93), MSW Supervision Hours (#94), Group Therapy Cohorts (#89), Naomi/guardianship speaking (#75), TLC MSW contractor onboarding (#74), Christina Poe forthcoming book (#63), persona-picker solo therapist card (#124), Markets-We-Serve disability/IEP + foster + kinship rows (#133, #134, #140).

**Bot-team responsibilities:**
- **Extract:** pre-intake inquiry data from forms (already wired); source attribution from referrer URLs
- **Classify:** inquiry urgency tier (crisis / standard / consult); insurance verification (acceptable carrier vs not); fit-for-clinician matching (specialty + availability + insurance overlap)
- **Generate:** intake response templates (NEVER PHI; non-clinical only -- per `LEGAL-PRIVACY-BOUNDARY.md` the firewall is hard); supervision-hours summary for LCSW credential maintenance; pre-intake follow-up sequences
- **Verify:** PHI firewall on every output (the bot-team has a hard refusal class for any output that would carry PHI; PHI stays in Acuity, period)
- **Route:** clinician assignment based on specialty + caseload + insurance; supervisor assignment for MSW contractors
- **Summarize:** conversion-funnel weekly digest; source-attribution monthly report (church / FB / referral / google -- already in `Practice.jsx`)
- **Alert:** capacity-warning when a clinician's caseload would push past stated weekly hours

**Specialization shape needed:**
- System-prompt specialization (PHI-firewall hardcoded, faith-integration tone matched to Christina's voice, "pre-intake only" boundary in every prompt)
- RAG over: TLC's own clinical-services copy + faith-integration framework + the insurance-carrier policies; NEVER over individual client records
- Fine-tune not needed for v1
- **Runs on existing DS1621xs** for the non-real-time work; real-time intake-form classification fits well within Ollama-on-NAS today

### 3.3 online team (industry **O**)

This is the broadest industry tag and probably the one that should be the LAST to get its own dedicated LLM team -- it's better served by being the *coordinator* across the other three industry teams. But the surfaces are real.

**Surfaces it owns:** all of the platform-itself surfaces (Big Picture, Books, Debts, Markets, Real Estate, Projects, Calendar, the bank-file-drop pipeline #128), the marketplace (#54), the four educator-marketplace adjacent modules (Education #57, Tutors #58, Elder Care #59, Home Legacy #60), the persona-picker non-church-non-therapy cards (#116-121, #123), Markets-We-Serve general-population rows (#132-141), AdvisementBanner Poe Properties (#113), the bookstore Amazon-KDP distribution (#62, #63), the Marketing & Growth module (#56), affiliate revenue (#91), scope-template downloads (#95), Small Landlord Tier (#96), the "anonymous specialist access" closing paragraph (#125), the multi-household co-auth promise (#126), IoT integration (#127), hardware DTC (#130), Stewardship Newsletter (#92).

**Bot-team responsibilities (when this team is eventually stood up):**
- **Extract:** bank file parse (OFX/QFX/CSV) -- the wf33/34/35 chain
- **Classify:** transaction categorization (per the existing financial-calcs lib), persona-classifier for the persona-picker
- **Generate:** weekly stewardship-newsletter draft (Substack-ready), property-listing photo-shoot scopes, Substack post drafts for the affiliate-revenue revenue line
- **Verify:** data-empowerment-not-extraction compliance on every export (per the foundation doc -- no PHI leak, no minor protection violation, no insurance/employer/advertiser access)
- **Route:** marketplace matching (educator-to-family in Tutors, caregiver-to-family in Elder Care, etc.)
- **Summarize:** family-side daily digest of "what to do today" (per ANXIETY-CLARITY-PRINCIPLE), monthly stewardship report
- **Alert:** family-voice feedback that touched a QoL-impact sector (highest-priority per `QUALITY-OF-LIFE-AS-NORTH-STAR` Rule 7)

**Specialization shape:** lighter than C and T because the surfaces are more about workflow orchestration than domain-specific generation. Probably one specialized prompt per surface (a Bank-File-Parse prompt, a Stewardship-Newsletter prompt, etc.) rather than one team owning a whole codebase. The "team" is really a constellation of specialized prompts orchestrated by the AI Foundation.

**Runs on existing DS1621xs** plus small Whisper instance for any voice-input surfaces.

### 3.4 Dev/Ops team (industry **D**)

**This is the team that should ship FIRST** -- it's the meta-team that maintains every other team, and it has the lowest external-customer-facing risk (mistakes hit Darrell's own workflow first, not COLG's, not a paying customer's).

**Surfaces it owns:** the Dev/Ops tab as a whole (#6, #14, #22, #29, #85-88), the PoeTech Services portfolio (#85-88), Cornerstone Tech opportunities (#70-78), Wrap-me-with-the-tech CTA (#29), the API access promise (#41), the audit-grade interaction log (#36, #109), the workflow library itself (per `WORKFLOW-MODULE-LIBRARY`), the per-tier sponsor-vetting workflow (#67), the quarterly strategy review (#43), the revenue-share consulting partnership (#44), Quality Gatekeeper (Role 10 per AI-TEAM-DISTRIBUTION).

**Bot-team responsibilities:**
- **Extract:** workflow-run outcome data (per `EXECUTION-OUTCOME-OBSERVABILITY`), input visibility data (per `INPUT-VISIBILITY-TO-CLAUDE`), code-change diffs from PRs
- **Classify:** change classes against the pre-authorized governance allowlist (security-fix / known-bug-class / copy-edit / spec-change-requires-Governor); error-envelope category per PERPETUAL-PIPELINE-HEALTH
- **Generate:** workflow-module README templates (Tier-2 config layer scaffolding), validation-gate smoke-test scripts, PR descriptions, daily-digest copy (wf31), evening-ship-summary copy (wf32)
- **Verify:** Phil 4:8 test on every generated artifact (TRUE / HONORABLE / JUST / PURE / LOVELY / COMMENDABLE / EXCELLENT / PRAISEWORTHY); typographic-theology compliance; CLAUDE.md rule adherence; ASCII-only enforcement on PowerShell files
- **Route:** change-request to the right industry team; family-voice feedback to the right module + the right governor
- **Summarize:** post-mortem on every workflow incident; weekly Quality Gatekeeper report
- **Alert:** observability failures (a workflow ran but produced a silent failure -- per the wf30 canonical example); input-visibility gaps (a family-voice input landed but didn't reach Claude in time)

**Specialization shape needed:**
- System-prompt specialization heavy here -- every CLAUDE.md rule, every foundation doc, every standing-feedback memory loaded
- RAG over: the full `docs/` tree, the workflow JSON exports, the standing memory files
- **This is the team where a sovereign LLM might NEED help from a vendor LLM for the heaviest reasoning** (code architecture, security-implication analysis). The hybrid pattern from `research-gemini-pro-vs-claude-2026-05-27` applies: sovereign Ollama for daily work, Claude / Gemini for strategic / heavy-reasoning moments
- **Runs on existing DS1621xs** for daily work; spills to vendor LLM for the architectural / strategic moments; uses the planned GPU box once it lands for code-generation throughput

---

## 4. Pipeline plans (per-promise smallest-viable delivery path)

Notation: T1 / T2 / T3 = Tier 1 / 2 / 3 reusability from `WORKFLOW-MODULE-LIBRARY`. Hours are **focused** hours (not calendar hours).

### 4.1 The unblockers (must ship before most other promises)

**A. Sovereign-LLM-team substrate** (the meta-pipeline)
- T1 path: Dev/Ops team only; system-prompt + RAG over `docs/` + standing-memory; runs on existing Ollama on NAS; the team's first job is operating wf30/31/32 + wf36 (Quality Gatekeeper). Est: **40-80 focused hours** to spec + ship + smoke-test. Pairs with the open architectural questions list in `project-sovereign-llm-teams-per-industry`.
- T2 path: per-industry team factory (Church + Therapy + online cloned from the Dev/Ops blueprint, each with industry-specific system prompt + RAG corpus). Est: **20-30 focused hours per industry team** to clone + tune + smoke-test.
- T3 path: one-config-line per-family LLM team -- a family picks which industry teams they want active; system stands them up automatically on their own Ollama. Est: **80-120 focused hours** to template the deployment + write the family-facing onboarding wizard.
- **Dependencies:** wf27 (Foundation Agent) bind-mount fix; wf36 (Quality Gatekeeper) wire-up; the WORKFLOW-MODULE-LIBRARY index doc itself.

**B. Family-Voice-Loop module (Tier 2 refactor)** -- the first reusable module in the library
- Already exists as wf30 + wf31 + wf32 at Tier 1. Per `WORKFLOW-MODULE-LIBRARY` open buildout item 1, refactor to Tier 2 (per-family configurable paths, ntfy topics, trusted-sender rosters, GitHub attribution).
- Est: **15-25 focused hours**. Required prerequisite for the LLM teams operating per-family.

**C. Billing surface (Stripe Payment Links + customer portal)** -- the unblocker for every paid-tier promise
- T1 path: replace the mailto-handshake in About's Cart drawer with a Stripe Payment Link per tier (5 links total + one for each annual variant + 3 sponsor tiers). No customer portal yet; manual reconciliation via Stripe Dashboard. Est: **10-15 focused hours**.
- T2 path: Stripe Customer Portal embed for tier change + cancel; Stripe-webhook-driven tier-update workflow on n8n. Est: **40-60 focused hours**.
- T3 path: per-family tier-management surface (the family can see their own tier history + change plans + see their next invoice). Est: **30-50 focused hours**.
- **Dependencies:** Stripe account + tax setup; clear refund policy; Foundation Agent webhook listener.

**D. External-tenant / external-contractor / external-client auth** -- the unblocker for every "scoped portal" promise (#10, #18, #26, #27, #35)
- T1 path: magic-link email auth (via Resend or Postmark) scoped to one role (start with tenant); per-tenant view of one lease + payment history + maintenance requests. Est: **60-100 focused hours**. This is the single biggest infrastructure lift in the audit.
- T2 path: same for contractor + client; per-role visibility policy per the audit log spec
- T3 path: federated identity (a contractor who works for two PoeTech-using LLCs logs in once)
- **Dependencies:** an email-sending backend (Resend or Postmark) that's properly load-tested; a per-portal view component library; a routes-and-policies definition

### 4.2 The shippable modules (delivery paths for the declared modules)

For each module that's currently `declared` or `vision`:

**Church Module v1 (promise #34, #61, #122)**
- T1 path: ship for COLG only -- (a) a per-member directory that only deacons + pastor see; (b) a giving tracker that imports from Pushpay or Tithe.ly CSV (manual upload, no API yet); (c) a multi-channel announcement broadcast (SMS via Twilio or ntfy if member opts in for ntfy, email via Resend). Est: **120-180 focused hours**. Per `COMMUNITY-FIRST-MISSION` Option B, runs in parallel with data-dump release.
- T2 path: workflow 51 (church-module-operations), wf52 (sermon production pipeline), wf53 (pastoral-care intake via Council Chamber pattern), wf54 (member directory with privacy controls), wf55 (giving tracker), wf56 (communication broadcast).
- T3 path: workflow 57 (cross-church federation) + per-denomination configuration.
- **Dependencies:** Bishop Gwin + COLG leadership co-Governor approval; the Church-LLM-team substrate (per section 3.1); accessibility audit (per `COMMUNITY-FIRST-MISSION` Commitment 2 -- WCAG AA on every surface); the COLG NAS acquisition for sovereign infrastructure (per Commitment 4).

**Spiritual Life / Godhead Study Platform (promise #34, #61)**
- T1 path: ship for the Poe family only -- scripture component (already in `UX-PATTERNS.md`), Holy Spirit Integration Worldview chapter-by-chapter reader (text already drafted at `docs/00-foundations/_root/THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`), prayer journal that exports to text. Est: **40-60 focused hours**.
- T2 path: per-family scripture study plans, ministry calendar surface, the bookstore digital-download path
- T3 path: per-denomination + per-language defaults
- **Dependencies:** the Worldview text being readable in book-length form; the Spiritual Life UX from `UX-PATTERNS.md`; the Church team's RAG corpus (shared).

**Practice Operations -> full TLC pipeline (promise #28, #102, #103)**
- Currently `partial`. T1 -> T2 jump = Acuity API integration (read-only at first: pull scheduled-intake confirmations, mark inquiries as `scheduled-intake` automatically); revenue-per-session reconciliation via a Stripe + Acuity cross-reference.
- T2 path: an MSW-onboarding wizard that uses the existing Scope tool template
- T3 path: clinical-consultation-only mode for pastors + professionals (subset of #98, already promised, partially shipped)
- Est: **30-50 focused hours** for the Acuity API piece.
- **Dependencies:** Acuity API token from Christina; PHI firewall verification by Christina (or her clinical-team Quality reviewer).

**Marketplace -- Scope-mediated contractor agreements (promise #54)**
- T1 path: a vetted-contractor directory (read-only) seeded with Darrell's actual contractor relationships; scope-template browse + download
- T2 path: bidirectional intake -- a customer posts a scope, contractors browse + claim, PoeTech mediates the scope agreement before money changes hands
- T3 path: review system anchored to the agreed scope (not free-text review); cross-platform import (Angi / Thumbtack / Houzz contractor profile pull)
- Est: **300-500 focused hours** for a minimal Tier 1. **This module is large; should NOT be in the first wave.**
- **Dependencies:** the auth substrate (D); the billing substrate (C); the Dev/Ops LLM team for matching + dispute mediation; legal review of mediated-scope contract enforceability.

**Tutors / Educator Marketplace (promise #58)**
- T1 path: a per-family list of teachers / principals already in the network (Family Educators in the opportunity rows #79-81); scheduling integrated with PoeTech calendar
- T2 path: vetted-educator marketplace with the 80/20 platform fee already advertised; per-student progress tracking
- T3 path: state-homeschool-requirements alignment per region
- Est: **200-400 focused hours** for T1.
- **Dependencies:** auth, billing, the educator-vetting policy (who decides? Darrell + Christina, per `COMMUNITY-FIRST-MISSION` Commitment 7 -- but also needs an external partner-org for educator credentialing).

**Education & Children -- Literacy Justice (promise #57)**
- T1 path: dyslexia-aware reading surface (OpenDyslexic + Lexend fonts, color overlays, line tracking) wired across existing text-rendering points; voice-to-text and text-to-speech for every text field
- T2 path: per-child reading proficiency dashboard with early-screening intake
- T3 path: AI literacy curriculum modules (age-appropriate prompt engineering, AI safety, fact-checking)
- Est: **100-200 focused hours** for T1 + T2.
- **Dependencies:** accessibility audit (per `COMMUNITY-FIRST-MISSION` Commitment 2 -- mandatory anyway); the Family team LLM (subset of online team).

**Elder Care Coordination (promise #59)**
- T1 path: multi-generational household tracking (already partly in the persona system); caregiver scheduling + 1099 management (already in the scope tool); document storage for POA + advance directives
- T2 path: appointment + medication reminder calendar with sibling sharing; aging-in-place property maintenance tracking
- T3 path: connection to an Elder Care Marketplace (separate vendor surface)
- Est: **80-150 focused hours** for T1 + T2.
- **Dependencies:** auth (for sibling sharing); secure document storage (HIPAA-adjacent for advance directives; not actually HIPAA-regulated since the family is the custodian).

**Home Command Center (promise #23, #52)**
- T1 path: IoT sensor pairing UI (UniFi protect + small sensor library); F&S-level alarm rules engine
- T2 path: seasonal maintenance calendar (cross-property if Real Estate has data); floor plan mapping
- T3 path: per-property dashboard with HVAC/leak/intrusion sensor fusion
- Est: **150-300 focused hours** for T1. Significant hardware-side discovery required.
- **Dependencies:** the UniFi Cloud Gateway Max purchase (already in capex priority #1, `:283`); IoT-protocol library evaluation; the home-network on Darrell's actual house as the first test bed.

**Home Legacy Program (promise #60)**
- T1 path: NOT a software module first -- a relationship + attorney + community-advisory-board process documented as a foundation. Software comes later as a tracking surface only. Est: **40-60 hours of foundation-doc + legal-review work; software is post-foundation.**
- T2/T3: not applicable until T1 process is proven through one or two real transactions.
- **Dependencies:** an elder-protection-trained attorney on retainer; community advisory board; the partner church (COLG) on the advisory side; explicit `feedback-distinguish-data-from-brand` review since this involves real Poe Properties relationships.

**Marketing & Growth (promise #56)**
- T1 path: just a Meta Ads + Google Ads attribution tag; lead-source data into Practice Operations
- T2 path: content calendar across social channels (this is mostly an integration with existing social-tooling, not new build)
- T3 path: audience insights without surveillance capitalism (the differentiating feature; needs careful spec)
- Est: **80-120 focused hours** for T1 + T2.
- **Dependencies:** the Dev/Ops LLM team to write the content drafts; the Quality Gatekeeper to enforce the no-surveillance-capitalism rule.

**Health & Wellness PWA (promise #53)**
- T1 path: IoT health data aggregation surface only (read-only at first; data import from Apple Health, Google Fit, Garmin via CSV export)
- T2 path: big-picture private health dashboard; water sensors
- T3 path: facial recognition AI trained for Black families (the VISION-FAIRNESS-STANDARD-compliant feature)
- Est: **100-200 focused hours** for T1; T3 specifically blocks on the per the VISION-FAIRNESS-STANDARD doc -- requires GPU box for the model training.
- **Dependencies:** GPU box; vision-fairness eval set; the Therapy team for wellness-correlation interpretation.

### 4.3 The smaller paid-tier surface fills

These are smaller bites that close partially-built gaps:

- **Cross-device sync** (#15): Supabase is wired for some tables; expose the toggle in settings + handle the sign-in flow. **20-40 focused hours.**
- **Encrypted cloud backup** (#16): use the existing Supabase but with a client-side AES key the family controls. **30-50 focused hours.**
- **Multi-user household sharing** (#25): the auth substrate (D) is the prereq.
- **Legal Matters tab full encryption** (#19, #105-109): queued at tasks #94-99 per `Legal.jsx` header. **60-100 focused hours.**
- **1099-NEC e-file integration** (#40): pick a vendor (Track1099, Tax1099); wire CSV export. **20-30 focused hours.**
- **API access** (#41): document the existing read endpoints; add bearer-token auth. **20-40 focused hours.**
- **Audit-grade interaction log** (#36, #109): event-table per `INSTITUTIONAL-MEMORY-EVENTS`; UI viewer. **40-60 focused hours.**

---

## 5. Competitive landscape (per-industry)

Cited URLs from June 2026 searches. The PoeTech win column always references the structural moats from `DATA-AS-EMPOWERMENT-NOT-EXTRACTION` + `COMMUNITY-FIRST-MISSION` + `project-sovereign-llm-teams-per-industry`.

### 5.1 Therapy (industry T) -- competing surface: Practice Operations, Premium client portals

| Competitor | What they charge | What they do well | What they do badly | Where PoeTech wins |
|---|---|---|---|---|
| **SimplePractice** | $29 (Starter) / $59 (Essential) / $99 (Plus) per month + $39/mo per additional clinician; AI Note Taker $35/mo extra; ePrescribe $49/mo + $89 setup; credit-card processing 2.7% + $0.30; SMS reminders $0.04/text. Built-in clearinghouse $0.25/claim. ([source](https://clinikehr.com/blog/simplepractice-pricing-2026-complete-breakdown)) | HIPAA-compliant EHR + telehealth + insurance billing in one stack; mature integrations; large existing user base. | Per-clinician scaling, hidden add-ons, cloud-only, no family/community context, no faith integration, extractive on transaction processing. | Family + business in one tool (TLC + family books in one ledger); pre-intake-only firewall keeps PHI in Acuity (where it already lives) so PoeTech doesn't need HIPAA-exposed architecture; the brand-advertising of TLC inside the same app the family uses for finance is unmatched as a personal-business showcase. |
| **Practice Better** | Plans typically $75-150/mo + per-clinician seat fees; varies per published price page | Wellness-aligned (nutrition, coaching, faith-friendly themes) | Same as SimplePractice on cloud-only + extraction | Same as above. |
| **Acuity Scheduling (Squarespace)** | $20-$61/mo base | Solid online scheduling, already used by TLC -- not a competitor for TLC, an integration | Not a CRM, no source attribution; PHI lives here so PoeTech inheritance of source data is the natural complement | PoeTech wraps Acuity (already does); not a competitor relationship. |

**Honest catch-up:** SimplePractice's EHR depth is years of investment. PoeTech should NOT try to match it on the PHI/EHR axis. The win is non-PHI pre-intake + faith-integrated source attribution + family-business unified ledger.

### 5.2 Church (industry C) -- competing surface: Church module v1, Spiritual Life Platform, Bookstore

| Competitor | What they charge | What they do well | What they do badly | Where PoeTech wins |
|---|---|---|---|---|
| **Planning Center Online (PCO)** | Free tier (up to 5 team members, 100MB); paid plans $15/mo (20 members, 2GB) -> $239/mo (unlimited, 200GB) ([source](https://www.planningcenter.com/pricing)) | Modular pricing (church only pays for what they use); free People + Check-Ins tiers; mature, trusted in church space. | Cloud-only; no sovereign option; no AI-team integration; no media/sermon-pipeline; no family-side integration. | Sovereign (church owns its data on a NAS in the church office, per `COMMUNITY-FIRST-MISSION` Commitment 4); per-church LLM team; sermon production pipeline (wf52, Whisper transcription, captioning, distribution sovereignty per `AI-MEDIA-PRODUCTION-PLATFORM-VISION`); accessibility default (per Commitment 2); explicit COLG-first design with elderly tech-novice staff voice. |
| **Tithe.ly** | $99/mo full suite; $19/mo giving-only; 2.9% + $0.30 card / 1% + $0.30 ACH ([source](https://get.tithe.ly/pricing)) | No long-term contract; transparent fees; under-500-attendance churches favor it. | Cloud-only; data lock-in for member records over time; designed for the church to pay forever. | PoeTech ingests Tithe.ly CSV exports in v1 (PoeTech does NOT replace Tithe.ly day one -- it sits alongside and pulls reports). Long-term: sovereign giving via Stripe + the church owning the donor relationship instead of paying $0.30/txn forever. |
| **Pushpay** | $199-399/mo giving-only; $500-1,500+/mo bundled with CCB; 2.9% + $0.30 card / 1% + $0.30 ACH; annual contract required; no public pricing ([source](https://churchmemberpro.com/blog/pushpay-review/)) | Donor-management depth above 500 attendees; mature reporting. | Annual contracts; opaque pricing; per-tx extraction; cloud lock-in; not designed for elderly-staff operation. | Same wins as PCO; specific to "elderly + tech-novice staff" Pushpay has no answer. |
| **YouVersion** (Spiritual Life adjacent) | Free, no ads ([source](https://www.youversion.com/bible-app)) | 1B+ installs; 3,500+ versions; 2,300+ languages; massive distribution; free-and-fast. | Generalist; no per-family worldview-grounded study path; no integration with the family's stewardship picture; cloud-only; the user is the product on an attention-engagement-optimization basis (even though no ads, the engagement metrics drive product). | PoeTech's Godhead Study Platform is NOT competing with YouVersion on Bible-reading; it integrates the Worldview text + the family's own faith milestones + the sound-mind-living measurement (per `QUALITY-OF-LIFE-AS-NORTH-STAR` rule 6). YouVersion stays as the reader-of-choice; PoeTech is the integration layer. |

**Honest catch-up:** PCO has 15+ years of church-software muscle memory. The win is sovereignty + AI-team + community-first explicit positioning, not feature parity.

### 5.3 online (industry O) -- competing surfaces: financial core, marketplace, education, tutors, elder care, hardware DTC

| Competitor | What they charge | What they do well | What they do badly | Where PoeTech wins |
|---|---|---|---|---|
| **YNAB** (vs Foundation tier + Debts + Books) | $14.99/mo or $109/yr; 34-day trial; up to 6 users per subscription ([source](https://www.ynab.com/pricing)) | Mature zero-based-budgeting practice; great onboarding workshops; loyal user base. | Personal-budget only; no business / rental / practice integration; no faith / community frame; cloud-only; no sovereign option. | PoeTech replaces YNAB *and* Stessa *and* SimplePractice *and* parts of QuickBooks at $89-$149/mo Family / Premium -- the cross-domain integration is the unique value; YNAB cannot follow without rebuilding from scratch. Also: PoeTech does NOT push engagement -- the Mirror-not-Judge stance (`QUALITY-OF-LIFE-AS-NORTH-STAR` Rule 1) is the inverse of YNAB's gamification leaning. |
| **Stessa** (vs Real Estate module) | Free Essentials tier; Pro tier $35/mo or $28/mo annual (per [Capterra source](https://www.capterra.com/p/181042/Stessa/)) | Free tier is generous; unlimited properties; good landlord-focused UX. | Rentals-only; cloud-only; data lock-in; designed for a landlord-only relationship not family-business stewardship. | PoeTech's Real Estate module ships unlimited properties at the $89/mo Family tier with full integration to debts + books + projects + scope tool + Legal (when shipped) -- a property + its tenant + its repair contractor + its legal matter + its incident all live in one ledger. Stessa cannot replicate that without becoming a different product. |
| **Outschool / Varsity Tutors** (vs Tutors module) | Outschool: $30/hr minimum for 1:1; Stripe-mediated; ([source](https://teach.outschool.com/pricing-tips/)). Varsity Tutors: $50-100/hr sessions; 10-hour-package minimum ([source](https://brighterly.com/blog/online-tutoring-cost/)) | Massive student bases; mature payment + scheduling. | Educator-side: opaque platform fee; high competition for visibility; "from us, for us" framing absent. Student-side: high prices; minimum commitments. | PoeTech's 80/20 educator split (already named in the copy) is more favorable than Outschool's effective take. The "from us, for us" framing (Black families, special-needs + bullied-kids homeschool transitions) is a market mainstream platforms don't credibly serve. Real principals + real teachers (Family Educators in the opportunity rows) are the seed. |
| **Care.com / A Place for Mom** (vs Elder Care Coordination) | Care.com: ~$35-36/hr in-home care; charges to connect with caregivers. A Place for Mom: free to families (paid by senior-living facilities); median home-care $34/hr ([source 1](https://www.theseniorlist.com/home-care/care-com/), [source 2](https://www.theseniorlist.com/assisted-living/a-place-for-mom/)) | A Place for Mom: free personal adviser; mature placement service. Care.com: massive caregiver marketplace. | Both serve the senior or the family-paying-the-care-provider; NEITHER serves the adult-child-coordinator role explicitly. A Place for Mom is funded by senior-living facilities -- structural conflict of interest. | PoeTech's Elder Care Coordination is explicitly built for the *adult child doing the coordination*. That's a structurally underserved role -- the named "forgotten generation" in family-tech (per About.jsx:188 copy). Multi-sibling shared notes + multi-gen budget visibility is unique. |
| **Buildertrend / Housecall Pro** (vs Marketplace + Premium contractor portals) | Buildertrend: $299-900+/mo + $400-1,500 onboarding fees ([source](https://toricentlabs.com/blog/buildertrend-pricing-2026.html)). Housecall Pro: $59-299/mo + add-ons ([source](https://toricentlabs.com/blog/housecall-pro-pricing-2026.html)) | Mature contractor-management; integrations with Stripe, QB. | High monthly cost; contractor-side only (not for the family hiring a contractor); no scope-mediation -- they pick a contractor's side. | PoeTech's mediated-scope contractor agreement is the differentiator -- the platform takes responsibility for the agreement being fair to both sides, not aligned with one side. No Buildertrend competitor has this position. |

**Honest catch-up:** the marketplace surfaces (Tutors, Elder Care, Hardware DTC) are years of buildout each. They should stay in vision-tier until the LLM-team substrate + auth substrate + billing substrate land.

### 5.4 Dev/Ops (industry D) -- competing surface: PoeTech Services 4 engagement models, workflow library, the showcase

This is less of a per-product market and more of a consulting market:

| Competitor type | What they charge | What they do well | What they do badly | Where PoeTech wins |
|---|---|---|---|---|
| **BigCo consulting (Accenture, Deloitte, IBM)** | $5M/yr x 5 years = $25M is the Dev/Ops tab's own honest framing ([cf. DevOps.jsx:497](https://github.com/poetech/Kingdom-PWA-Node/blob/main/app/src/components/DevOps.jsx)) | Brand recognition; established procurement paths. | Slow delivery; junior delegation; high overhead; cultural mismatch with family-led / faith-led / community-led organizations. | The Dev/Ops tab IS the win-narrative -- "we deliver $5M of work in 2 months for $3M, you save $22M and 4.5 years." Real-world demonstration: the platform itself is the showcase of compressed delivery. |
| **Freelance contractors (Upwork, Fiverr)** | $50-300/hr | Low cost; quick spin-up. | No long-term relationship; no integrated team; no business-systems thinking. | PoeTech Services binds dev/ops + business operators in one team. Not freelancers; not a BigCo. |
| **Open-source self-host frameworks (Outline, Plane, Cal.com, etc.)** | Free + hosting | Self-sovereign, free. | Generic; not faith-aligned; not integrated; user has to compose everything. | PoeTech's per-industry LLM teams + workflow library + opinionated faith-integration ARE the "you don't have to compose 12 free things yourself" alternative. |

---

## 6. Gap analysis -- ranked by leverage

Each gap is ranked by how many downstream promises it blocks. Format: **leverage score (downstream blocks) | gap | what's missing | rank**.

| Rank | Gap | What it blocks | What's missing |
|---:|---|---|---|
| 1 | **Sovereign-LLM-team substrate** | 50+ surfaces (every per-industry surface that needs AI assistance) | Architecture spec (8 open research questions in `project-sovereign-llm-teams-per-industry`); first team (Dev/Ops) stood up + smoke-tested; the SOVEREIGN-LLM-TEAMS-PER-INDUSTRY foundation doc; integration with wf36 Quality Gatekeeper. |
| 2 | **External-tenant / contractor / client auth** | Promises #10, #18, #26, #27, #35, plus all marketplace promises | An auth provider choice (magic-link via Resend, or NextAuth, or a small in-house one); a per-portal view-component library; a routes-and-policies definition; an audit-log surface. |
| 3 | **Billing surface (Stripe Payment Links + portal)** | Every paid-tier promise (all of section 2.1 tier rows; sponsor tiers in 2.3); the Loved-Ones / Community / Community-Partners enforcement | Stripe account; tax/jurisdiction setup; a Payment Link per tier; a webhook listener in n8n; a customer-portal embed; a dunning policy. |
| 4 | **WORKFLOW-MODULE-LIBRARY index + Family-Voice-Loop Tier-2 refactor** | Every per-family / per-community ship + the Excellence Standard at scale | The `WORKFLOW-MODULE-LIBRARY` open-buildout items 1-4; per-family config layer for wf30/31/32. |
| 5 | **COLG NAS + Bishop Gwin governance approval** | The entire Church Module rollout to COLG | Hardware purchase; physical install; co-Governor co-signature from COLG leadership; accessibility audit; sermon-cam rig (per `AI-MEDIA-PRODUCTION-PLATFORM-VISION`). |
| 6 | **PHI firewall hardening for the Therapy team** | Practice Ops -> Acuity API integration (#102); Pre-Marital Bundle (#93); MSW Supervision Hours (#94) | A hardcoded refusal class in the Therapy team's system prompt; Christina's review + sign-off; the LEGAL-PRIVACY-BOUNDARY foundation doc updates if any. |
| 7 | **Accessibility default (WCAG AA on every surface)** | The Church Module entirely; the elderly-and-tech-novice audience for COLG; the dyslexia-aware Education module; ANY user with a disability | An accessibility audit of existing surfaces; component-library upgrades (focus states, color contrast, large-text mode, voice-input on every text field, screen-reader compatibility); the documentation for self-guided training per `COMMUNITY-FIRST-MISSION` Commitment 6. |
| 8 | **Bank-file-drop pipeline (workflows 33/34/35)** | The waitlist-to-real-experience conversion (#128); the "drop your bank file" front door | Three n8n workflows + the OFX/QFX/CSV parser library choice; a security review on how files are handled. |
| 9 | **Email sending infrastructure** | Magic-link auth, broadcast (#56 for Church), waitlist follow-up, customer-portal confirmations | An account at Resend or Postmark (or self-host a postal); SPF + DKIM + DMARC for poetech.us; rate-limit policy. |
| 10 | **The Holy Spirit Integration Worldview text completion** | The Bookstore (#62); the Spiritual Life Platform v1 (#34, #61); the Worldview-grounded answer source for the Church and Therapy teams | Darrell's writing time; theological review pipeline (per `AI-MEDIA-PRODUCTION-PLATFORM-VISION` pillar 3). |
| 11 | **Vision-Fairness model corpus + GPU box** | Health & Wellness PWA's facial recognition (#53 sub-feature); Christyn's basketball coaching vision pipeline (named in `VISION-FAIRNESS-STANDARD`); any future visitor-recognition surfaces | The GPU box purchase; a family-data-first calibration set; the parity evaluation script; the family-voice routing for fairness failures. |
| 12 | **An elder-protection-trained attorney + community advisory board** | Home Legacy Program (#60) entirely | A relationship-building lead (per the existing pipeline row #84 = o17); a board nomination process; the attorney engagement. |
| 13 | **Partner-org verification flow for Community + Community-Partners tiers** | Promises #47, #48, #49, #50 + dignity-preserving handoff | A simple admin surface where Darrell verifies a partner; the partner-side onboarding doc; the "no badge on recipient app" enforcement (per About:225). |
| 14 | **Quarterly strategy review booking + helpdesk** | Promises #17, #42, #43 | A simple calendar surface; a Helpscout or equivalent inbox; an SLA policy. |
| 15 | **Sponsor vetting workflow (pay-first-vet-in-parallel) refund integration** | Promises #64-67 | Stripe refund-button workflow; the 8-criteria checklist as a Foundation Agent prompt; the unanimous-committee decision capture surface. |

---

## 7. Master plan roadmap

### 7.1 Sequencing principles

1. **Don't ship a surface whose pipeline isn't wired** (per `BUSINESS-PROCESS-CONNECTIONS` four-question test).
2. **Lift family AND create rather than extract** (per `GOVERNANCE-EXECUTION-ADVISORY` standing test).
3. **COLG-first for Church work** (per `COMMUNITY-FIRST-MISSION` Commitment 1).
4. **The sovereign-LLM-team substrate is the meta-prerequisite for everything else** (per `project-sovereign-llm-teams-per-industry`).
5. **Quality-of-life is the senior evaluation** (per `QUALITY-OF-LIFE-AS-NORTH-STAR` Rule 7).
6. **Real-world demonstration of Darrell's businesses stays as the showcase** (per `feedback-distinguish-data-from-brand`).

### 7.2 First 5-7 ships (priority order)

**Ship 1: Sovereign LLM Substrate -- Dev/Ops team v1** (`leverage rank 1`)
- The Dev/Ops team is the first sovereign LLM team. Operates wf30/31/32 + wf36 + the workflow library itself.
- Five-question test:
  1. **Invites:** internal-only -- no external surface. (Family feedback into the daily ship cycle is the visible end.)
  2. **Pipeline:** Foundation Agent (wf27) + the Dev/Ops LLM team operating wf30/31/32 + wf36 (Quality Gatekeeper enforces the validation gate).
  3. **Governor:** Darrell governs merges; Foundation executes; this team advises.
  4. **Visible promise:** the family-voice cadence promise stays daily (per `BUSINESS-PROCESS-CONNECTIONS` Family-Voice extension -- 24-hour acknowledgement, 24-hour shipping or carry-forward-with-reason).
  5. **Bot-team:** Dev/Ops sovereign team itself. Specialization: system-prompt + RAG over `docs/` + standing memory. Runs on existing DS1621xs CPU-only stack.
- Estimated focused hours: **40-80**.

**Ship 2: WORKFLOW-MODULE-LIBRARY index doc + Family-Voice-Loop Tier-2 refactor** (`leverage rank 4`)
- Item 1 from `WORKFLOW-MODULE-LIBRARY` open buildout. The first reusable module.
- Five-question test:
  1. **Invites:** future families and communities to onboard their own Family-Voice-Loop with a config file.
  2. **Pipeline:** the Dev/Ops LLM team (ship 1) operates the per-family config-template generator.
  3. **Governor:** Darrell governs which modules go into the library; the Quality Gatekeeper enforces the validation gate.
  4. **Visible promise:** "new families onboard in days because most of it is library-prebuilt" (from `WORKFLOW-MODULE-LIBRARY` "Why this matters").
  5. **Bot-team:** Dev/Ops team.
- Estimated focused hours: **15-25** (plus the library doc itself, **8-12 hours**).

**Ship 3: COLG Church Module v1 -- foundation + first wins** (`leverage rank 5`)
- Per `COMMUNITY-FIRST-MISSION` Option B (parallel paths). Foundation work + small early wins (membership directory + communication broadcast) run in parallel with the data-dump release.
- Five-question test:
  1. **Invites:** COLG members + staff to use a privacy-respecting directory + multi-channel announcement broadcast.
  2. **Pipeline:** workflows 51 (church-module-operations) + 54 (member directory) + 56 (communication broadcast) on the COLG NAS, with the Church LLM team operating the content generation (announcement drafts, scripture-cited devotional blurbs).
  3. **Governor:** Bishop Gwin + COLG leadership co-Governor; Darrell + Christina as advocates on the family side.
  4. **Visible promise:** elderly staff can operate the system without help-desk dependency (per `COMMUNITY-FIRST-MISSION` Commitment 2 -- WCAG AA, large-text default, voice input on every text field, forgiving-defaults).
  5. **Bot-team:** Church team (cloned from Dev/Ops blueprint; RAG over ESV scripture + Strong's + approved-commentaries + COLG's own past announcements as Bishop Gwin opts in).
- Estimated focused hours: **120-180** (v1 scope only).
- **Dependencies:** ship 1 (Dev/Ops team blueprint); ship 2 (library index); COLG NAS purchase + accessibility audit + Bishop Gwin's explicit co-Governor signature.

**Ship 4: External-tenant magic-link auth (Tier 1)** (`leverage rank 2`)
- The single biggest infrastructure lift that unblocks the most paid-tier promises.
- Five-question test:
  1. **Invites:** a tenant of a Poe-Properties-style rental to log in and see ONLY their own lease + payment history + maintenance requests.
  2. **Pipeline:** magic-link via Resend/Postmark + per-tenant view component + scoped data API + audit log entry on every action.
  3. **Governor:** the landlord (Darrell for Poe Properties pilot) decides which tenants get access; the platform enforces the scoping policy.
  4. **Visible promise:** "your personal phone stays private; the tenant only sees their own door's data."
  5. **Bot-team:** Dev/Ops team operates the auth pipeline + the audit log; online team handles tenant-side onboarding messages.
- Estimated focused hours: **60-100**.
- **Pilot scope:** Poe Properties tenants only; per Darrell's existing brand-advertising and real-world demonstration frame.

**Ship 5: Billing surface -- Stripe Payment Links + webhook -> tier update** (`leverage rank 3`)
- Tier 1 path: replace the mailto handshake with real Stripe payment.
- Five-question test:
  1. **Invites:** a person to actually subscribe to a paid tier.
  2. **Pipeline:** Stripe Payment Link per tier + webhook to n8n + tier-update workflow + welcome email.
  3. **Governor:** Darrell approves the tier-pricing-as-shipped (the existing $39/$89/$149/$249/$0 set); the Foundation Agent operates the day-to-day.
  4. **Visible promise:** "subscribe in 60 seconds; cancel any time; export your data any time" (per `DATA-AS-EMPOWERMENT-NOT-EXTRACTION` -- no lock-in).
  5. **Bot-team:** Dev/Ops team operates the webhook listener + the tier-update logic; online team handles the user-facing onboarding emails.
- Estimated focused hours: **10-15** (Tier 1); follow-up Tier 2 (customer portal) at +40-60 once Tier 1 proves out.

**Ship 6: Spiritual Life / Godhead Study Platform v1 (Poe-family-only)** (`leverage rank 10`)
- Ship for the Poe family first per `WORKFLOW-MODULE-LIBRARY` reusability principle. The Holy Spirit Integration Worldview reader + scripture component + prayer journal.
- Five-question test:
  1. **Invites:** a family to read the Worldview text + study scripture with the worldview frame + journal their own response.
  2. **Pipeline:** static text rendering (Worldview chapters); the existing scripture component; a local-first prayer-journal store.
  3. **Governor:** Darrell as the Worldview author governs the text content; the family governs their own journal.
  4. **Visible promise:** "FREE for every family, every tier" (per About:114, About:190). "No PoeTech extraction on faith-grounded data" (per `DATA-AS-EMPOWERMENT-NOT-EXTRACTION` rule 6).
  5. **Bot-team:** Church team handles the Worldview-grounded answer generation (the source-of-answers rule per CLAUDE.md 2026-05-25 declaration); typographic-theology binding hardcoded.
- Estimated focused hours: **40-60**.

**Ship 7: Practice Operations -> Acuity API integration (Tier 1 read-only)** (`leverage rank 6`)
- Closes one of the named-as-planned items in the Practice module copy.
- Five-question test:
  1. **Invites:** the existing TLC client-attribution pipeline to be automatic instead of manual.
  2. **Pipeline:** Acuity API token + n8n workflow polling new appointments + cross-reference to existing inquiries + auto-update inquiry status to `scheduled-intake`.
  3. **Governor:** Christina governs PHI boundary; the Therapy team's hardcoded PHI-firewall enforces.
  4. **Visible promise:** "conversion tracking is automatic, PHI stays in Acuity."
  5. **Bot-team:** Therapy team with PHI-firewall hardened; Dev/Ops team for the workflow plumbing.
- Estimated focused hours: **30-50**.

### 7.3 Order acknowledgment

This sequence is **NOT** the order of urgency; it is the order of leverage + dependency-correctness:

- Ships 1+2 are the substrate everything else rides on. Don't reorder.
- Ship 3 (COLG Church v1) is the mission-level priority per `COMMUNITY-FIRST-MISSION`. Runs in parallel with ships 4-5 per Option B.
- Ships 4+5 are the paid-tier unlock. They could swap order; magic-link auth is the bigger lift but billing is easier to start in parallel.
- Ships 6+7 are the relatively-cheap wins that close two specific named-as-planned promises and start the Worldview-text-as-product flywheel.

### 7.4 What should NOT ship soon (stay in vision-tier)

Per `BUSINESS-PROCESS-CONNECTIONS` -- if the foundation isn't there, the surface stays unshipped to protect the family from over-promising:

| Promise | Why not yet |
|---|---|
| Marketplace / Scope-mediated contractor agreements (#54) | Auth + billing + LLM-team substrate ALL prerequisites; 300-500 focused hours of build; high failure cost if shipped early (real money + real contracts on the line) |
| Hardware DTC IoT sensors (#130) | Pure vapor; no supplier relationship; no manufacturing capacity; no Vision-Fairness eval for the sensor's vision stack; GPU box not yet acquired |
| Health & Wellness PWA facial recognition (#53 sub-feature) | Blocks on `VISION-FAIRNESS-STANDARD` compliance which requires GPU box + family-data-first calibration set + parity evaluation script |
| Home Legacy Program (#60) | Blocks on an elder-protection attorney + community advisory board; ethics + legal exposure too high for a software-first ship |
| Multi-household co-auth for separated co-parents (#126) | The legal + UX complexity of representing two co-equal authorities over one ledger is real foundation work; underestimating it would create bad outcomes for the very families it's meant to serve |
| Anonymous in-app specialist access (#125) | Specialist directory + vetting + anonymous-messaging routing not yet built; cannot honor the "anonymous" promise without an architecture that genuinely preserves it (a half-built version would be a privacy betrayal) |
| Federation across N>1 churches (Church module Tier 4) | Premature until COLG v1 is operational and stable for 6+ months |
| Tutors marketplace (#58) | Educator-vetting policy not yet defined; auth + billing prerequisites; high regulatory exposure (state homeschool requirements) |
| Elder Care 1099 caregiver platform (#83) | Same as Tutors marketplace; additional caregiver-licensing complexity per state |
| Tracked changes / encrypted Legal Matters (#19, #105-109) | Tasks #94-99 per `Legal.jsx` header; significant Web Crypto + AES-GCM work; should ship in dedicated workstream once the auth substrate is up |
| Audit-grade interaction log (#36) | Should ride on the existing event-table from `INSTITUTIONAL-MEMORY-EVENTS`; coordinate with that buildout, don't fork |

### 7.5 The five-question test applied -- summary

| Ship | Invite | Pipeline | Governor | Promise | Bot-team |
|---|---|---|---|---|---|
| 1 -- Dev/Ops LLM team | (internal) | wf27 + wf30-32 + wf36 + Dev/Ops team | Darrell governs / Foundation executes / Claude advises | Daily 24h family-voice cadence | Dev/Ops sovereign team |
| 2 -- Library + Family-Voice Tier-2 | future families onboard config | Library doc + config templates | Darrell governs library entries; Gatekeeper validates | Days-not-months onboarding | Dev/Ops team |
| 3 -- COLG Church Module v1 | members use directory + broadcast | wf51 + wf54 + wf56 on COLG NAS | Bishop Gwin + COLG co-Govern; Darrell + Christina advocate | Elderly staff can operate it alone | Church sovereign team |
| 4 -- Magic-link tenant auth | tenant logs in to scoped view | Resend + auth + per-tenant view + audit | Landlord (Darrell for pilot) governs access | Personal phone stays private | Dev/Ops + online teams |
| 5 -- Stripe Payment Links | a person subscribes | Stripe + webhook + tier-update wf | Darrell approves pricing; Foundation executes | 60-sec subscribe / no lock-in / data export anytime | Dev/Ops + online teams |
| 6 -- Spiritual Life v1 (Poe family) | family reads + journals | Static reader + scripture component + local journal | Darrell governs Worldview text; family governs journal | Always free; never extracted | Church team with typographic-theology binding |
| 7 -- Practice Ops -> Acuity API | TLC inquiry auto-updates | Acuity API + n8n + inquiry status update | Christina governs PHI boundary | PHI stays in Acuity; conversion tracking is automatic | Therapy team (PHI-firewalled) + Dev/Ops |

---

## 8. Open questions for Darrell

Per `feedback-dont-stop-to-ask` -- only the questions that genuinely need Darrell's input. Defaults named where possible.

1. **Sequencing pre-vacation vs post-vacation:** the MVP launch median is 2026-06-22. Ships 1-2 fit in that window if vacation work focuses there; ship 3 (COLG) is post-vacation per `COMMUNITY-FIRST-MISSION` Option B. **Default I'm running with:** Ships 1-2 pre-vacation if Darrell agrees; ships 3-7 post-vacation in priority order. Confirm or override.

2. **Bishop Gwin signature timing:** COLG Church Module v1 is mission-priority but cannot start without Bishop Gwin's co-Governor commitment. When does Darrell plan to bring the proposal to Bishop Gwin? **Default I'm running with:** wait for Darrell's prompt; the audit identifies the dependency but doesn't try to drive that relationship.

3. **Christina's PHI-firewall sign-off for the Therapy LLM team:** Ship 7 needs Christina's review of the bot-team's hardcoded refusal class. Is Darrell or Christina the relay? **Default I'm running with:** Christina reviews directly; Darrell relays the readiness signal.

4. **The Worldview text reading-order for the Spiritual Life v1 ship:** the chapters drafted in `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md` need an author-blessed sequence for the platform v1 reader. **Default I'm running with:** ship the chapters in the order they appear in the foundation doc; let Darrell reorder when he reviews v1.

---

## 9. Religion AND Relationship test on this report

**Religion check (backbone, scripture-grounded, structure sound):**
- Every promise catalogued with file:line evidence. Every gap traced to a foundation doc.
- The typographic-theology binding from CLAUDE.md is enforced throughout (Yahweh, Jesus, the Holy Spirit, the Father, the Son capitalized; satan / the adversary / etc. never capitalized when they appear).
- Citations to Stripe / SimplePractice / Stessa / Planning Center / Tithe.ly / Pushpay / YouVersion / YNAB / Outschool / Varsity Tutors / Care.com / Buildertrend / Housecall Pro are all URL-anchored to the search results in section 5.
- Scripture not cited in the report body (the report is operational, not doctrinal); if section 7.6 evolves to include Worldview-grounded shipping criteria, the SCRIPTURE-REFERENCE-STANDARD applies.

**Relationship check (warmth, meets the reader, heart visible):**
- The framing acknowledges that the family is already operating real businesses at real cost; the report's job is not to second-guess that, only to wire the connections so the platform can scale without breaking promises.
- The "do not ship yet" list is named honestly so the family is not pressured to ship what isn't ready; this protects the very families and communities the platform serves.
- The COLG-first commitment is reinforced -- the report does not treat COLG as an item; it treats COLG as the first community, with Bishop Gwin's voice on the same standing as the family's voice.
- The brand-advertising of TLC, Poe Properties, Cornerstone Tech, and COLG is preserved as the showcase, per `feedback-distinguish-data-from-brand` -- the audit catalogues these surfaces as built and adds them to the wins column, never to the sanitize column.

## 10. Phil 4:8 test on this report

| Question | Result |
|---|---|
| TRUE | The numbers are sourced; the file:line citations verifiable; the build-status calls are reproducible by inspection. |
| HONORABLE | The do-not-ship-yet list takes responsibility for the audit's own boundaries; does not promise more than the audit can deliver. |
| JUST | Each promise is evaluated against the family's stated values + foundation docs, not against an external metric. |
| PURE | No hidden agenda; no upsell; no extraction. The audit serves the family + community first. |
| LOVELY | The framing honors Darrell + Christina's real-world businesses as the showcase, not as items to sanitize. |
| COMMENDABLE | Cites real competitors with real prices; names real PoeTech wins without exaggeration. |
| EXCELLENT | The five-question test is run on every priority ship; the bot-team responsibilities are named per industry per `project-sovereign-llm-teams-per-industry`. |
| PRAISEWORTHY | The closing posture (`BUSINESS-PROCESS-CONNECTIONS` -- "wire before you write, process before you promise, timeline before you market, family voice before all of it") is the report's working principle, not just a quote. |

---

## 11. Institutional-memory framing (per INSTITUTIONAL-MEMORY-EVENTS)

This report is a **research-review event** per `feedback-research-first`. It feeds the institutional library.

- **Event type:** research-review / master-plan
- **Originating prompt:** Darrell 2026-06-01 evening, "we have a lot of services our app copy or text says is coming our review of what is and is not should also look over or products and services being mentioned on each page and make sure we have a pipeline plan and team of bots to ensure the best possible outcomes and evaluate the competition and make sure we have what we need."
- **Author:** Claude as Advisor
- **Senior foundations applied:** all 11 listed at top
- **Outputs:** this doc; pending action items captured in section 7 master plan and section 8 open questions
- **Pairs with future events:** every product-roadmap decision for the next 6+ months should consult this report; every "should we ship X next?" question should run through section 7's sequencing principles.
- **Update cadence:** the report's inventory in section 2 should be regenerated after every major UI change; the gap analysis in section 6 after every infrastructure milestone; the master plan in section 7 monthly until ship 7 lands.

---

**End of report.**

*Wire before you write. Process before you promise. Timeline before you market. Family voice before all of it. We all win. And we create. Amen.* (Per `BUSINESS-PROCESS-CONNECTIONS` closing posture.)
