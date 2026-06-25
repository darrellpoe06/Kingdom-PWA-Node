# Research Review — Go-To-Market Strategy for the PoeTech App (Post-Modular-Rebuild)

**Date:** 2026-06-24 (Wed)
**Author:** Claude (research-review on Darrell's commission, per `feedback-research-first` + the discuss-then-document pattern)
**Triggered by:** Darrell — a full GTM strategy (marketing, branding, selling, gaining subscribers) for the PoeTech app, seen through five executive lenses (CEO, CMO, CFO, CTO, CIO). Timed for **after the app is ready** (post-modular-rebuild).
**Status:** Research-review. **No code, no workflow changes, nothing applied.** Plan-now / execute-after-ready. Decision support only.
**Output gate (binding filters this doc is screened against):** `project-community-free-funded-by-aligned-brand-sponsorship`, `project-what-is-actually-free`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION`, `COMMUNITY-FIRST-MISSION`, `QUALITY-OF-LIFE-AS-NORTH-STAR`, `GOVERNANCE-EXECUTION-ADVISORY`, the **Father's-Business test** (souls first), the **TLC firewall** (HIPAA/PHI, sovereign-only, senior everywhere), `project-cost-discipline-with-growth-permission`, `feedback-verification-doctrine` (DR-0076), RELEASE-TIERS (front-door identity = Tier C).
**Pairs with:** `2026-06-08-research-review-sovereign-llm-teams-architecture` / `...church-network-llm-eval-and-app-review`, `project-colg-stream-to-marketing-pipeline`, `project-engagement-trivia-source-pipeline`, `project-sovereign-llm-teams-per-industry`, `BUSINESS-PROCESS-CONNECTIONS`, `AI-MEDIA-PRODUCTION-PLATFORM-VISION`, `project-brand-surface-hosting-map`, `project-loved-ones-cohort-includes-chosen-family`, the in-app revenue-team workflow (lane `local_3a58c309`, built for TLC, reusable).

> **Scope discipline.** This review does **not** re-open the funding model, the free-tier definition, or the no-data-sale / no-extractive-ads / no-engagement-optimization bright lines. Those are **already decided** (see the binding filters above) and are treated here as **fixed inputs**, not options. The GTM job is to *execute* the decided model excellently — to sell sovereignty as the moat, fund the free tier as designed, and grow without violating a single bright line. Where this doc presents "options + trade-offs + recommendation," the options live **inside** the decided rails, never outside them.

---

## TL;DR (read this first)

- **The one-line position (CEO):** *"Technology that serves you instead of surveilling you — the sovereign operating system for a family's and a community's whole life: money, faith, work, and the people they steward."* Sovereignty is not the ethics footnote; **it is the product and the moat.** Served-not-surveilled is the wedge into a market where every incumbent monetizes attention or data.
- **The growth engine (CMO):** the **Content Engine is the top of the funnel** — sermons, courses, music, testimony flowing out as marketing, pulling an audience that converts to app users. The **in-app revenue-team workflow** (built first for TLC) is the **reusable acquisition machine** we re-point at each segment. Distribution is **owned, not rented**: COLG → partner-church directory → word-of-mouth/testimony, with YouTube/short-form as the public mouth. **Mars Hill progressive disclosure**: lead with universal stewardship-clarity value; faith is one click deeper, never the gate.
- **The money (CFO):** the **decided rails, modeled** — community-free funded by **(1) aligned-brand sponsorship + (2) opt-in subscriptions + (3) a fixed % of every subscription routed to the free pool + (4) every-N-paid-funds-1-free**. Two free products only (Financial System for Families; Spiritual Module for the Body); **everything else paid.** B2B per-industry (TLC first) is the **high-margin engine that subsidizes the mission.** Target an LTV:CAC ≥ **3:1** (4:1+ on B2B); content-engine acquisition aims the **freemium CAC band (~$141 vs ~$205 paid)** [First Page Sage; amraandelma] down further because the channel is owned.
- **What "ready" requires (CTO):** modular rebuild **out of the monolith** (`poe-financial-mvp-v28.jsx` is the hot-conflict #1 file), **true multi-tenant** with the tenancy guard (DR-0060) proven-to-catch, **signup-volume capacity** (the conference funnel + interest-capture rails exist; load-test them), and **reliability to the "unbreakable" standard** (PERPETUAL-PIPELINE-HEALTH). **No GTM dollar spent before these clear** — a launch that white-screens under load burns the testimony that is our cheapest channel.
- **Trust as the pitch (CIO):** **sovereignty-as-product** is sold with **receipts** — exportable data, no advertising model, no engagement optimization, audit-log-on-access, immediate verifiable deletion (the eight DATA-AS-EMPOWERMENT behaviors become **marketing claims backed by gates**, per DR-0076). **Per-vertical compliance is a feature, not overhead**: HIPAA/PHI isolation for TLC is the **proof-of-seriousness** that sells the whole platform.
- **Sequence:** **Pre-launch** (app-ready gates + COLG design-partner proof + content-engine warm-up) → **Launch** (COLG-first, families-free, testimony harvest) → **Growth** (partner-church directory + B2B verticals + sponsorship flywheel). KPIs per phase below. **Everything is gated behind app-ready** — this is plan-now / execute-after-ready.
- **Headline recommendation per lens** is in §0 directly below.

---

## 0. Headline recommendation per executive lens

| Lens | The one decision that matters most | Recommendation |
|---|---|---|
| **CEO / positioning** | What are we, in one sentence, and why can't an incumbent copy it? | **"Sovereign technology that serves the person."** Lead the brand with *served-not-surveilled*; the moat is **structural** (sovereign infra + no-extraction architecture), which a Pushpay/YouVersion/Monarch cannot copy without dismantling its own revenue model. Segment-and-product map in §1. |
| **CMO / marketing + subscribers** | Where do paying users actually come from, cheaply, on-brand? | **Owned content engine → owned audience → app.** Don't rent attention. Sermons/courses/music/testimony are the ads; the **in-app revenue-team** is the reusable conversion machine; **COLG and the partner-church directory** are the distribution graph. Progressive disclosure keeps the top of funnel universal. |
| **CFO / monetization** | Does the decided free model actually pencil? | **Yes — if B2B carries it.** Free families/Body are funded by sponsorship + a fixed % of every subscription + N-paid-funds-1-free; the **per-industry B2B verticals (TLC first) are the margin engine.** Model, break-evens, and the sponsorship sales motion in §3. |
| **CTO / scale** | What must be true before we spend a marketing dollar? | **Modular rebuild + multi-tenant + capacity + unbreakable reliability — all four, verified.** No soft launch on the monolith. The app-ready gate **is** the GTM start line (§4). |
| **CIO / data + trust** | What do we say about data, and can we prove it? | **Sell the receipts.** Sovereignty, export, no-ads, no-engagement-optimization, audit log, instant deletion — each is a **gate-backed claim** (DR-0076), and **per-vertical compliance (HIPAA for TLC) is the trust proof** that de-risks the whole platform (§5). |

---

## 1. CEO / Positioning — brand, segment-product map, and the moat

### 1.1 The market we are entering (so the position is grounded, not asserted)

Three adjacent markets converge on this app, and **all three are growing while every incumbent monetizes in a way we have ruled out:**

- **Spiritual-wellness / faith apps** — ~**$2.89B in 2026**, ~14.66% CAGR to ~$9.91B by 2035; faith-based apps ≈10% of that [towardshealthcare]. YouVersion crossed **1 billion installs** (2025 installs +12%, daily usage +18%) and **deliberately never monetized** [The Lion; Fox News; Premier Christianity] — proof the audience exists and that a *non-extractive* posture is credible at scale, but also that the incumbent leaves the **economic-empowerment** job undone.
- **Church management / giving software** — **$1.2B (2024) → ~$2.5B (2033)**, ~9.5% CAGR [verifiedmarketreports]. Incumbents (Pushpay, Subsplash, Tithe.ly, Planning Center, Ministry Brands) compete on **giving throughput and admin** — and largely **extract via transaction fees** (e.g. 2.9% + $0.30; a church doing $200k/yr in online giving pays ~$6k/yr in processing alone [tap.giving]). That fee drag on the offering plate is a **moral opening** for a sovereign, serve-not-extract alternative — especially for the **Black Church economic-powerhouse** thesis.
- **Personal / family finance** — weekly PFA usage reached **~38% of US adults** (highest on record), post-Mint consolidation around Monarch/YNAB/Copilot/Rocket Money, subscriptions **$99–$199/yr** [NerdWallet; thepennyhoarder; techbullion]. The category proves families **pay for clarity** — but every leader is venture-funded and **insight-via-aggregation**; none offers **sovereign, own-your-data** family finance.

**The white space is the intersection:** nobody serves **money + faith + work + the people you steward** in **one sovereign, non-extractive** place. That intersection *is* PoeTech.

### 1.2 Positioning statement (the durable line)

> **For** families, churches, and mission-driven organizations the mainstream tech industry overlooks or extracts from, **PoeTech is** the sovereign operating system for a whole life — money, faith, work, and the people you steward — **that** serves you instead of surveilling you. **Unlike** the faith app that never empowers you economically, the church platform that skims your offering, and the finance app that mines your data, **PoeTech** keeps your data yours, your infrastructure sovereign, and its incentives aligned with your flourishing — because the architecture, not just the promise, makes extraction impossible.

**Three-word brand spine:** **Sovereign. Serving. Whole.** (Sovereign = you own it; Serving = it lifts, never extracts; Whole = the whole life, not a silo.)

### 1.3 The moat — why this is defensible, not just nice

| Moat layer | What it is | Why an incumbent can't copy it |
|---|---|---|
| **Structural (the deep moat)** | Sovereign-by-default infra + no-ad, no-data-sale, no-engagement-optimization **architecture** (DATA-AS-EMPOWERMENT's 5 architectural commitments) | To match it, Pushpay/YouVersion/Monarch would have to **dismantle the revenue model that funds them** (transaction skim, ad/aggregation, VC-growth). The constraint *is* the moat — `project-generous-collective-anthropology`. |
| **Trust / relationship (the warm moat)** | COLG-first, community-defined-what-matters, family-and-community voices on design, served-not-surveilled lived out | Trust is **earned slowly and locally**; it can't be bought with ad spend. Our cheapest channel (testimony) is the thing money can't manufacture. |
| **Content / corpus (the compounding moat)** | The Content Engine + sovereign per-industry LLM corpora (Word-first Church LLM, TLC clinical, future verticals) | Each vertical's corpus is **proprietary, consented, and deepening**; competitors start from zero and can't ethically aggregate ours. |
| **Mission-fit (the values moat)** | Father's Business (souls) + Black Church economic powerhouse + tithing posture | A values position that is **authentic** (the founder's actual conviction) reads as authentic; an imitator's reads as marketing. |

> **The moat test (apply to any GTM tactic):** *does this tactic deepen one of the four moats, or does it spend down trust for a short-term number?* If it spends trust, it fails the gate — even if the CAC math "works."

### 1.4 Segment × product map

PoeTech is **multi-segment and multi-product.** The map (rows = who; columns = what):

| Segment | Free entry product | Paid expansion | Acquisition motion | Margin role |
|---|---|---|---|---|
| **Families** | **Financial System for Families** (free, decided) | Premium family modules, multi-household, advanced stewardship/coaching | Content engine + testimony + word-of-mouth; church-member spillover | Mission core; funded by the pool |
| **The Body / individuals** | **Spiritual Module** (free, decided) | Deeper Learn courses, study tooling, presenter/creation pro | Content engine (sermons/Learn/music) + Mars Hill disclosure | Mission core; funded by the pool |
| **Churches (COLG-first)** | Pilot / design-partner tier | Church OS: presenter, choir/songbook, conference/venues, giving-sovereign, streaming-to-marketing, church LLM | **COLG proof → partner-church directory** → church-network referral | **B2B margin engine** (subsidizes free) |
| **Community orgs** | Community-free tier (sponsor-funded) | Org tooling, events, directory | Church/family spillover; aligned-brand co-marketing | Mission; sponsor-funded |
| **Per-industry B2B** (TLC first; future verticals) | — (B2B is paid) | **Sovereign per-industry LLM team + ops** (TLC Therapy Solutions; HIPAA-isolated) | The **in-app revenue-team workflow** (built for TLC, reusable per vertical) | **Highest margin; the engine that funds the mission** |

> **Read the map as a flywheel, not a list:** B2B margin (TLC + churches) funds the family/Body free tier → free tier + content engine grows the trusted audience → that audience and its testimony lowers B2B/church CAC → repeat. **The free tier is not charity overhead; it is the top of the trust funnel that makes the paid tiers cheap to sell.**

---

## 2. CMO / Marketing + Subscribers — channels, funnel, the reusable engine, launch

### 2.1 The channel doctrine: own the audience, don't rent it

The bright lines (no extractive ads, no engagement optimization, no data sale) **rule out the default growth-hacking playbook** — and that's a feature. Our channels are **owned or earned**, never rented attention:

| Channel | What it is here | Why it fits the bright lines | Benchmark anchor |
|---|---|---|---|
| **Content Engine (primary)** | Sermons, Learn courses, music, testimony produced by the existing media pipeline (AI-MEDIA-PRODUCTION-PLATFORM-VISION), published out as the "ads" | **Owned distribution**; the content *is* the value, the app is the deeper room | Owned content is the most cost-efficient top-of-funnel; email-nurtured leads convert MQL→SQL ~46% [HubSpot via digitalapplied] |
| **YouTube / short-form (the public mouth)** | BG's Wednesday message + clips → landing page → app; the `project-engagement-trivia-source-pipeline` already mines BG's own questions | Move watchers to an **owned landing page** capturing only first-name+email [Eightify] | Personalized short-form clips convert ~66% vs ~56% generic [ScoreApp via amraandelma] — favors our per-person Content Engine |
| **Church networks (the graph)** | COLG → partner-church directory → denominationally-neutral, Word-first referral | Relationship-based, on-mission; `project-non-denominational-word-first-body-undivided` | Referral/community = lowest CAC; trust pre-built |
| **Testimony / word-of-mouth (the moat channel)** | Real family + community outcomes (QoL improvements) shared with consent | The **served-not-surveilled** story is the differentiator; can't be bought | Highest-trust, lowest-cost; compounds |
| **Aligned-brand co-marketing** | Vetted sponsor partners co-promote the community-free tier | On-brand by definition (partners are pre-vetted for alignment) | Funds the free tier *and* extends reach |

> **Deliberately NOT used:** paid social retargeting, engagement-loop notifications, data-broker lookalike audiences, dark-UX growth tricks. These are the five anti-patterns DATA-AS-EMPOWERMENT bars; using them would forfeit the moat to buy a number.

### 2.2 The funnel (free tier → subscriber), with progressive disclosure

```
  PUBLIC CONTENT (universal value)        ← Content Engine: clarity on money/stewardship/life
        │  Mars Hill disclosure: lead universal, faith one click deeper (never the gate)
        ▼
  OWNED LANDING + LEAD MAGNET             ← first-name + email only (short form converts better)
        │
        ▼
  FREE APP (Family Finance OR Spiritual)  ← the two decided free products; real value, no card
        │  in-app revenue-team workflow: surfaces the right next step by segment, consented
        ▼
  PAID EXPANSION / CHURCH / B2B           ← opt-in subscription; % routes to the free pool
        │
        ▼
  TESTIMONY HARVEST (consented)           ← feeds back to the top as the moat channel
```

**Why this shape (grounded):**
- **Freemium converts ~2–8% median** (AI-assisted tools 15–20%) [First Page Sage; daydream]. Our free tier is **genuinely valuable** (not a crippled demo), which protects conversion quality, and the AI-assisted, segment-aware in-app revenue-team pushes toward the upper band.
- **No-credit-card free** doubles trial volume and lands freemium CAC near **~$141 vs ~$205** for paid acquisition [amraandelma] — and our owned content channel aims to undercut even that.
- **Lead magnets:** checklists/templates and AI-adaptive quizzes convert best (quizzes averaged **47.3%** across 22k funnels) [ScoreApp; digitalapplied]. **On-mission lead magnets:** a "Family Stewardship Clarity" checklist, a "Is your church's giving sovereign?" quiz, a Scripture-library sampler — each universal at the top, faith deeper in.

### 2.3 The reusable in-app revenue-team workflow (the acquisition machine)

The in-app revenue-team being built for **TLC** (lane `local_3a58c309`) is **not a one-off** — it is the **reusable per-segment acquisition + conversion engine.** Its pattern:

1. **Listen** (consented signals only) → 2. **Classify** the visitor's segment/need → 3. **Surface** the right next step (free product, church pilot, B2B intro) → 4. **Hand off** to a human for any irreducible judgment (the Cage/`GOVERNANCE-EXECUTION-ADVISORY` line: LLMs execute, humans govern bright lines) → 5. **Record** the outcome for the institutional-memory loop.

**GTM implication:** we **re-point** this one engine at each segment (TLC → churches → families → next vertical) instead of building five funnels. That is the cost-discipline thesis applied to growth — one engine, many doors.

### 2.4 Launch plan (the marketing sequence — executes only after app-ready, §4)

- **Design-partner proof (COLG-first):** COLG is the **named first community** (COMMUNITY-FIRST-MISSION). Land it as the lighthouse reference: presenter replacing ProPresenter, choir/songbook, conference/venues, streaming-to-marketing, church LLM — **real surfaces on real data** (Reality-Trace doctrine). COLG's success **is** the case study.
- **Content-engine warm-up:** start publishing the owned content **before** the app opens, so an audience and an email list exist at launch (build the list against the lead magnets above).
- **Families-free soft launch:** open the free Family Finance + Spiritual modules to the COLG congregation and chosen-family cohort (`project-loved-ones-cohort-includes-chosen-family` — gated COLG rail public; chosen-family rail private, never enumerated).
- **Testimony harvest → partner-church directory:** consented QoL outcomes become the proof that opens the next churches; the partner-church directory is the growth graph.
- **B2B in parallel:** TLC vertical proves the per-industry sovereign-LLM motion and **starts carrying margin early** (it doesn't wait for consumer scale).

---

## 3. CFO / Monetization — the decided rails, modeled

> **Reminder:** the funding model is **decided**, not chosen here. This section **models** it — pricing, unit economics, break-evens, the sponsorship motion, and the free-funding mechanism — so the plan is verifiable (DR-0076), not asserted.

### 3.1 The four decided revenue rails

1. **Aligned-brand sponsorship** — vetted, mission-aligned partners fund the community-free tier (`project-community-free-funded-by-aligned-brand-sponsorship`). **Never** data sale, **never** subscriber skim.
2. **Opt-in subscriptions** — paid expansion (family premium, church OS, B2B verticals). Only the two decided products are free; **everything else is paid** (`project-what-is-actually-free`).
3. **A fixed % of every subscription → the free pool** — each paid dollar self-funds the mission (the tithing-posture structural analog; pairs with the 10% position).
4. **Every-N-paid-funds-1-free** — an explicit cross-subsidy ratio: N paying seats underwrite one free seat. The pool's solvency is the merge gate on growth (you can't grow free faster than the rails fund it).

### 3.2 Pricing tiers (proposed, inside the decided rails — options + recommendation)

Anchored to category benchmarks so the numbers are defensible, not invented:

| Tier | Who | Price (proposed) | Benchmark anchor |
|---|---|---|---|
| **Family Free** | Families | **$0** (decided) | YouVersion's never-monetize credibility; free Family Finance is the trust wedge |
| **Spiritual Free** | The Body | **$0** (decided) | Same; the Spiritual Module is free by decision |
| **Family Premium** | Families wanting more | **~$8–10/mo or ~$79–99/yr** | Below Monarch/YNAB ($99–$199/yr); "build kings not slaves" pricing (`project-freddie-taylor-beta-user` — $89 surfaced as a real reference) |
| **Community Free** | Community orgs | **$0**, sponsor-funded | Rail #1 |
| **Church OS** | Churches | **Tiered by congregation size**, e.g. small / mid / large bands | Matches category norm ($9 → $29 → $89 → $159 → $299/mo by size [tap.giving]); **but sovereign — no transaction skim on the offering** (the differentiator vs the ~$6k/yr fee drag) |
| **B2B vertical (TLC, future)** | Industry orgs | **Custom / enterprise** (sovereign LLM team + ops) | Enterprise church/vertical software runs **$10k–$25k+/yr** [tap.giving]; our ~99% build-cost advantage means high margin at fair price |

> **Pricing recommendation:** **lead free where decided, price paid *below* category leaders (we have the cost structure to), and make the church tier's pitch the *absence of the transaction skim*** — "keep 100% of the offering; pay a fair flat subscription" is a concrete, CFO-legible reason to switch off Pushpay/Tithe.ly. B2B is where we price to value (enterprise), and B2B margin is what makes the free tier solvent.

### 3.3 Unit economics — the targets that keep growth honest

| Metric | Target | Source/benchmark | Why this number |
|---|---|---|---|
| **LTV:CAC (consumer)** | **≥ 3:1** | 3:1 is the SaaS profitability floor; elite 4:1+ [saashero; Eagle Rock CFO] | Below 3:1, growth burns the pool |
| **LTV:CAC (B2B vertical)** | **≥ 4:1** | Growth/scale-stage SaaS hits 3.8–5:1 [Eagle Rock] | B2B must over-earn to fund free |
| **CAC (consumer)** | **< ~$141, trending down** | Freemium CAC ~$141 vs ~$205 paid [amraandelma] | Owned content channel should beat the freemium median |
| **Freemium → paid** | **4%+ (target the 8%+ / AI-assisted 15–20% band)** | 4%+ healthy; <2% broken [daydream; First Page Sage] | The in-app revenue-team + genuine free value push the upper band |
| **CAC payback** | **< 12 months (consumer), < 90 days (B2B)** | Growth-stage SaaS 90-day payback [Eagle Rock] | Protects pool cash flow |
| **Pool solvency** | **inflow (sponsorship + % + N:1) ≥ free-tier cost, always** | The decided merge gate | Free can't outrun its funding |

### 3.4 Break-even logic (illustrative structure, not a forecast)

The model breaks even when **(sponsorship $ + Σ subscription% + N-paid-subsidy) ≥ (free-tier serving cost + content-engine cost + platform opex)**. Two structural advantages make this reachable early:

- **~99% build-cost reduction vs a Fortune-500 build** (`project-cost-discipline-with-growth-permission`) → the cost side of the equation is **a fraction** of what a VC-funded competitor carries.
- **Sovereign infra (NAS-first, owned)** → marginal serving cost per free user is **near-zero** for the sovereign-hosted surfaces; the free tier's cost is bounded, not runaway.

> **CFO recommendation:** **B2B (TLC + churches) reaches break-even first and independently** — sell it early and let its margin underwrite the consumer free tier, rather than waiting on consumer scale. Instrument the **pool solvency ratio as a live dashboard** (CIO §5) so growth is never allowed to outrun funding — that ratio is the financial kill-switch.

### 3.5 The sponsorship sales motion (rail #1, operationalized)

Sponsorship is **sold, not waited for.** The motion, on-mission:

1. **Vet for alignment first** (the partner must pass the served-not-extract test; a misaligned sponsor is declined even if it pays — the bright line is senior to the dollar).
2. **Sell the audience's trust, not its data** — sponsors get **brand association with a trusted, mission-driven community**, co-marketing, and category exclusivity — **never** targeting data, never subscriber lists.
3. **Price to the free-tier cost it underwrites** — a sponsor funds a defined slice of community-free seats; the math is transparent to both sides.
4. **Cap and disclose** — sponsorship is disclosed in-app (no dark patterns); a sponsor never gains product influence over a family's experience.

---

## 4. CTO / Scale — what "ready" requires before GTM

> **Hard dependency.** Everything in §1–§3 and §6 is **gated behind this section.** The GTM start line **is** the app-ready line. Spending marketing on an app that fails under signup load **burns the testimony channel** — our cheapest, highest-trust, irreplaceable asset. This is the single most important sequencing call in the doc.

### 4.1 The four readiness gates (all must be green, each verified per DR-0076)

| Gate | What it means | Current state (per memory/repo) | Why it blocks GTM |
|---|---|---|---|
| **1. Modular rebuild** | New surfaces out of the monolith; `poe-financial-mvp-v28.jsx` decomposed (it's hot-conflict file #1) | `project-new-surface-new-module` in force; decomposition is the post-queue-drain plan; bundle lazy-load already cut first-load −33% | A monolith can't be safely scaled, load-tested, or hot-fixed during a launch spike |
| **2. True multi-tenant** | Per-tenant isolation; `user_in_instance()`; the **tenancy guard (DR-0060) proven-to-catch** | Cloud Supabase `mjjlevhdufpaplypnqrv`, `instance_id` + `user_in_instance()` pattern live; tenancy guard exists | A data-leak across tenants at launch is an **extinction-level trust event** for a sovereignty brand |
| **3. Signup-volume capacity** | Onboarding rails handle a surge; rate-limited public forms; load-tested | Conference signup funnel + interest-capture rails shipped & live-verified; per-IP rate-limit deferred (NAT'd congregation) — **revisit before public launch** | A funnel that throttles or 500s at launch wastes the content-engine spend that drove the surge |
| **4. Unbreakable reliability** | PERPETUAL-PIPELINE-HEALTH 13 rules; SectionErrorBoundary; fetch timeouts; daily backups; health-checks | Break-it ship gate + SectionErrorBoundary + `lib/net.js` timeout shipped; CI build gate closed (PR #283) | "Unbreakable" is the **standard**; a white-screen on a first-time COLG visitor is unrecoverable first-impression damage |

### 4.2 CTO recommendation

- **Decompose-then-launch, not launch-then-decompose.** Drain the in-flight PR queue, decompose the monolith's launch-critical surfaces, **then** open the doors. The decomposition is already the stated plan; GTM gives it a **hard deadline and a reason**.
- **Load-test the signup path against a realistic COLG + content-engine surge** before any public push — and **turn the deferred per-IP rate limit back on** for the public-launch posture (the NAT'd-congregation rationale that deferred it doesn't hold once the audience is public).
- **Stage capacity to the GTM phases (§6):** pre-launch needs design-partner-scale; growth needs directory-scale. Don't over-build capacity before the phase needs it (cost discipline) — but **prove headroom** before each phase opens.
- **The sovereign-mesh tier (see Standard Screens §7):** sovereign NAS-hosted surfaces carry near-zero marginal cost and are the right home for internal/community surfaces; cloud (Supabase/Vercel→Cloudflare Pages) carries the public signup surge. Match each surface to the right tier; the off-Vercel→Cloudflare Pages pipeline (`project-off-vercel-cloudflare-pages`, gated) **removes the 100/day Vercel deploy cap** — light it before a launch that needs frequent deploys.

---

## 5. CIO / Data, Trust & Compliance — sovereignty as the pitch

### 5.1 Sovereignty-as-product (sell the receipts, not the promise)

The DATA-AS-EMPOWERMENT commitments are **not compliance overhead — they are the marketing claims**, and per DR-0076 each ships **backed by a gate** so the claim is verifiable, not asserted:

| Marketing claim (CMO uses it) | The structural backing (CIO proves it) | Gate / receipt |
|---|---|---|
| "Your data is yours — export it any time" | Exportable by design (architectural commitment #3) | Export feature + test |
| "We don't sell data. Ever." | No advertising model, no aggregation without explicit per-study opt-in | Architecture + the no-sale binding principle |
| "We don't optimize to keep you hooked" | No engagement-optimization (anti-pattern #2 barred) | Absence-of-dark-UX gate |
| "Delete it and it's gone — verifiably" | Immediate + verifiable deletion (behavior #7) | Deletion test + audit log |
| "Every access is logged" | Audit-log-on-every-access (behavior #6) | Audit-log surface |
| "Sovereign — runs on infrastructure you can hold" | NAS-first sovereign hosting (commitment #1) | The live sovereign deployment |

> **CIO recommendation:** **make the trust posture *legible inside the app*** — a "Your Data, Your Terms" surface that shows the audit log, the export button, and the deletion control **to the user**, not buried in a policy PDF. Sovereignty you can *see and operate* is the pitch; a privacy policy nobody reads is not. This is the in-app surface of the bright lines (the App-Is-Primary-Artifact doctrine).

### 5.2 Per-vertical compliance is a feature, not a cost

- **TLC = HIPAA/PHI, sovereign-only, hard firewall — senior to everything** (the TLC firewall is binding and structural). **No PHI ever on Hostinger** (`project-brand-surface-hosting-map`; no BAA). The TLC vertical's **rigor is the proof-of-seriousness** that de-risks the entire platform in a B2B buyer's eyes: "if they hold the line on clinical PHI, they'll hold it on my church's giving data."
- **Per-vertical sovereign LLM teams** (`project-sovereign-llm-teams-per-industry`) keep each vertical's corpus isolated and consented — the church corpus is Word-first and non-denominational; the clinical corpus never mixes with anything. **Isolation is a sellable property**, not just a safeguard.

### 5.3 Institutional memory + observability for ops (so growth is governable)

- **Execution-outcome observability + institutional-memory-events** turn every GTM action into **data** — which channel converted, which sponsor underwrote what, which church referred which. This is the **first-party, consented, internal-only** decision fuel (never sold) that lets the revenue-team workflow improve perpetually (DR-0075).
- **The live dashboards CIO owns for GTM:** (1) **pool solvency ratio** (CFO §3.4 — the financial kill-switch), (2) **per-channel CAC + conversion**, (3) **per-tenant health** (reliability), (4) **trust-claim gate status** (are all the §5.1 gates green?). Each is a **real-data surface** (Reality-Trace), not a painted number.

---

## 6. Phased GTM Roadmap — sequenced AFTER app-ready

> **The whole roadmap is downstream of §4.** Phase 0 is the gate; nothing in Phase 1+ spends GTM effort until Phase 0 is verified green. Timelines are **relative to app-ready**, not calendar dates, because the modular rebuild + capacity work sets the start (flagged dependency, per the commission).

| Phase | Goal | Key moves | Exit KPIs (the gate to the next phase) |
|---|---|---|---|
| **Phase 0 — App-Ready Gate** (pre-condition) | Earn the right to launch | §4's four gates green + verified; content-engine warm-up begins; email list building against lead magnets | All four CTO gates green (verified, not claimed); load-test passes at projected launch surge; trust-claim gates (§5.1) green |
| **Phase 1 — Pre-Launch / Lighthouse** | Prove it on a real community | COLG design-partner go-live (real surfaces, real data); families-free + Spiritual-free to congregation + chosen-family; **first testimony harvest**; TLC B2B vertical live (early margin) | COLG live & retained; N consented testimonies; free-tier QoL outcomes measurable; TLC contract live; pool solvency ratio ≥ 1.0 |
| **Phase 2 — Launch** | Open the doors on the proof | Public content-engine push; owned landing + lead magnets live; families-free public; church OS sold into first directory churches off the COLG reference | Freemium→paid ≥ 4%; consumer CAC < ~$141 trending down; LTV:CAC ≥ 3:1; ≥ X churches signed; reliability SLO held through the surge |
| **Phase 3 — Growth** | Compound the flywheel | Partner-church directory scales; next B2B vertical opens (reuse the revenue-team engine); sponsorship flywheel funds expanding free tier; testimony → referral loop | LTV:CAC ≥ 3:1 (4:1 B2B); pool solvency ≥ target with growing free base; sponsorship covers community-free cost; net-revenue-retention positive; new vertical at break-even |

### 6.1 KPI dashboard (what CIO instruments, what each lens watches)

| KPI | Owner lens | Healthy target | Why it's the right metric (not a vanity number) |
|---|---|---|---|
| Pool solvency ratio | CFO | ≥ 1.0, rising | The free tier's survival; the financial kill-switch |
| Freemium → paid | CMO/CFO | ≥ 4% (→8%+) | Funnel health [daydream] |
| Consumer CAC | CMO | < ~$141, ↓ | Channel efficiency [amraandelma] |
| LTV:CAC | CFO | ≥ 3:1 (4:1 B2B) | Profitable growth [Eagle Rock] |
| Consented testimonies | CMO | rising | The moat channel's fuel |
| **QoL outcome delta** | **CEO/all** | **measurably positive** | **The Father's-Business + QUALITY-OF-LIFE north star — the senior metric all others serve** |
| Per-tenant reliability SLO | CTO | "unbreakable" held | First-impression protection |
| Trust-claim gate status | CIO | all green | The brand promise, verified |

> **The senior KPI is QoL outcome delta**, not revenue. Revenue is the **means** (it funds the mission); measurable improvement in a family's or community's quality of life is the **end** (QUALITY-OF-LIFE-AS-NORTH-STAR is the merge gate). A GTM tactic that grows revenue while flat-lining QoL **fails the north star** even if the dashboard is green elsewhere.

---

## 7. Standard Screens (applied to the GTM as a whole)

### 7.1 Options + trade-offs + recommendation (the top-level GTM shape)

| Option | Trade-off | Verdict |
|---|---|---|
| **A. Consumer-first blitz** (families free, scale consumers, monetize later) | Fast top-of-funnel, but the free tier has **no funding** until B2B exists → pool insolvent; burns cash a sovereign/no-VC posture can't sustain | **Rejected** — violates pool solvency; wrong sequence |
| **B. B2B-first, mission-funded** (TLC + churches carry margin early; free tier rides the pool they fund) | Slower consumer logo count early; requires B2B sales motion to mature first | **RECOMMENDED** — matches the decided funding model, reaches break-even first, funds the mission honestly |
| **C. Paid-ads growth-hack** (buy the funnel) | Fastest raw growth; **forfeits the moat** (extractive channels) and the trust that is our only durable advantage | **Rejected at the gate** — fails the moat test and the bright lines |

**Recommendation: Option B.** B2B margin (TLC-first, churches next) is the engine; the content engine is the owned top-of-funnel; the free family/Body tiers are the trust wedge the pool funds. This is the only option that **executes the decided model** rather than fighting it.

### 7.2 Sovereign-mesh tier

- **Sovereign (NAS-first):** internal ops, community surfaces, per-vertical LLM corpora, the trust/audit surfaces — near-zero marginal cost, full data control, the embodiment of the pitch.
- **Cloud (Cloudflare Pages / Supabase):** the public signup surge, the marketing landing pages, the public app shell — elastic capacity for launch spikes.
- **Match each GTM surface to its tier**; the sovereign tier is both cheaper *and* on-message (sovereignty you operate). The off-Vercel→Cloudflare pipeline removes the deploy cap for launch-cadence deploys.

### 7.3 Cost-efficiency

- **~99% build-cost reduction vs a Fortune-500 build** + sovereign near-zero marginal serving cost = the structural reason the free tier can exist and the paid tiers can price below category leaders while staying high-margin. **The cost structure is itself a GTM weapon** — we can under-price Monarch/Pushpay and still fund a free tier they can't match.
- **One reusable acquisition engine** (the in-app revenue-team, re-pointed per segment) instead of five funnels = the cost-discipline thesis applied to growth.

### 7.4 Father's-Business test (the senior screen)

> *Does this GTM lift the family AND the community AND advance the Kingdom (souls), while creating rather than extracting?*

- **Souls first:** the funnel's top is universal stewardship-clarity (serves everyone); faith is one click deeper (Mars Hill), never bait-and-switched. The Spiritual Module is **free by decision** because the Body is not a market to be skimmed.
- **Economic powerhouse:** the church tier's pitch — *keep 100% of the offering, no transaction skim* — is **economic empowerment of the Black Church**, not extraction from it.
- **Create, don't extract:** every rail (sponsorship-not-data-sale, %-to-the-pool, N-funds-1) **creates** capacity for the under-served rather than extracting from subscribers. **This GTM passes the test** — and any future tactic that fails it is rejected at this screen regardless of its CAC math.

---

## 8. Dependencies, risks, and the explicit flags

- **Hard dependency (flagged per commission):** **the entire roadmap is gated on the modular rebuild + multi-tenant + capacity + reliability (§4).** This is plan-now / execute-after-ready. **No GTM spend before Phase 0 is verified green.**
- **Sequencing risk:** launching consumer-free before B2B margin exists makes the pool insolvent (Option A's failure mode). **Mitigation:** B2B-first (Option B).
- **Trust risk:** a single tenant-data leak or launch white-screen on a first COLG visitor is an extinction-level event for a sovereignty brand. **Mitigation:** §4 gates 2 & 4, verified not claimed (DR-0076); load-test + rate-limit before public.
- **Brand-dilution risk:** any drift into extractive tactics to hit a number forfeits the moat. **Mitigation:** the moat test (§1.3) + Father's-Business screen (§7.4) gate every tactic.
- **Capacity-cost risk:** over-building capacity before a phase needs it burns the cost-discipline advantage. **Mitigation:** stage capacity to phases (§4.2).
- **Open items for Darrell's governance (advisory → he decides):** (1) the exact subscription **%-to-pool** and **N** in N-funds-1; (2) Family Premium price point (proposed ~$8–10/mo); (3) church-tier band thresholds; (4) which B2B vertical follows TLC; (5) the sponsorship vetting rubric (who qualifies as "aligned"). These are **decisions only Darrell makes** (GOVERNANCE-EXECUTION-ADVISORY); this doc advises with the benchmarks, he governs the lines.

---

## 9. Sources (market/positioning grounding)

- Spiritual-wellness apps market sizing — [towardshealthcare.com](https://www.towardshealthcare.com/insights/spiritual-wellness-apps-market-sizing)
- YouVersion 1B installs / growth — [The Lion](https://readlion.com/bible-app-tops-1-billion-installs-as-founder-points-to-a-global-move-of-god/), [Fox News](https://www.foxnews.com/media/bible-app-shatters-milestone-one-billion-downloads-faith-revival-surges-worldwide)
- YouVersion never-monetize posture — [Premier Christianity](https://www.premierchristianity.com/opinion/we-would-make-billions-if-we-monetised-the-bible-app-heres-why-we-never-will/20447.article)
- Church software market size — [Verified Market Reports](https://www.verifiedmarketreports.com/product/church-software-market/)
- Church giving software pricing + transaction-fee drag — [tap.giving](https://tap.giving/blog/best-church-donation-technology-2026.html), [The Lead Pastor](https://theleadpastor.com/tools/best-church-giving-software/)
- Freemium conversion benchmarks — [First Page Sage](https://firstpagesage.com/seo-blog/saas-freemium-conversion-rates/), [daydream](https://www.withdaydream.com/library/insights/freemium-conversion-rate)
- LTV:CAC + freemium CAC benchmarks — [SaaSHero](https://www.saashero.net/strategy/b2b-saas-ltv-cac-benchmarks/), [Eagle Rock CFO](https://www.eaglerockcfo.com/blog/research/saas-finance-metrics-benchmarks), [amraandelma](https://www.amraandelma.com/saas-customer-acquisition-statistics/)
- Lead magnet / YouTube funnel + quiz/video conversion — [digitalapplied](https://www.digitalapplied.com/blog/lead-magnet-conversion-benchmarks-2026-b2b-data-reference), [amraandelma](https://www.amraandelma.com/lead-magnet-conversion-statistics/), [Eightify](https://eightify.app/summary/online-business-and-entrepreneurship/create-a-high-converting-lead-magnet-funnel-on-youtube)
- Personal-finance app market + pricing/retention — [NerdWallet](https://www.nerdwallet.com/finance/learn/best-budget-apps), [The Penny Hoarder (Monarch](https://www.thepennyhoarder.com/budgeting/monarch-money-review/) / [YNAB)](https://www.thepennyhoarder.com/budgeting/ynab-review/), [TechBullion](https://techbullion.com/personal-finance-apps-in-the-us-in-2026-how-budgeting-saving-and-credit-building-tools-are-actually-used/)

> **Freshness caveat (DR-0076 / honest uncertainty):** market sizes, conversion rates, and competitor pricing above are **June-2026 web sources, cited inline**; they move fast and the agent's training cutoff is January 2026. **Re-verify at execution time.** Benchmarks are **planning anchors, not guarantees** — the real numbers come from our own instrumented funnel (§5.3) once live.

---

*Religion-and-relationship check: backbone (decided rails, gated, benchmarked) AND warmth (souls-first, served-not-surveilled, QoL as the end). The Test run on this output: true (cited, uncertainty flagged), honorable, just (bright lines senior to every dollar), pure (no manipulation in the funnel), excellent (the best version, not lazy). Where uncertain — exact %/N, future verticals — surfaced as open items for Darrell's governance, not fabricated.*
