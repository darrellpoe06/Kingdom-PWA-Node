# Pricing-Tier Comprehensive Review — Family + Community + Business + Opportunities

**Date / context:** 2026-06-02. Requested by Darrell from Maui (on his phone):
> "I want to review our prices and options for making sure they make sense based on each other and the community family and business needs and opportunities."

**Scope.** This is the pricing-tier *design* review: do the tiers make sense as a system, against each other and against community / family / business needs and the named opportunities. It is **distinct** from the Freddie-Taylor discoverability work (`2026-06-02-freddie-taylor-user-feedback.md`, About-page reorder so Foundation FREE leads). That task fixes *where the price shows up*; this one asks *whether the prices themselves are right*.

**Method.** Research-first per `feedback-research-first`. Every tier price is anchored to a verified 2026 SaaS-replacement stack (competitor prices fetched live from official pages, June 2026 — see Sources). Every gating claim is cited to `file:line`. This is brand / UX / pricing strategy, not data sanitization (`feedback-distinguish-data-from-brand`). Typographic theology per `CLAUDE.md` holds throughout.

---

## 1. Executive summary — the 5 highest-leverage decisions

These are the decisions that move the most, ranked. Detail and math for each is below.

### Decision 1 (HIGHEST LEVERAGE) — Stop charging full price for value that has not shipped yet.

The single biggest finding: the headline differentiator of every paid tier is **gated behind backend work that is not live**. "Tenant portals," "contractor portals," "client portals," "cross-device sync," "encrypted cloud backup" all carry the qualifier **"when external auth ships" / "when backend ships"** in the live pricing cards (`About.jsx:112-115`). A customer who pays $89 today for the Family tier does **not** get the unlimited-tenant-portals line that *is the reason the card exists* — they get unlimited properties + Legal + Projects, which is real, but it is a fraction of the advertised promise.

This is the actual root of Freddie's "$89 seems kinda high" — not the number, the **value-delivered-today-vs-value-promised gap**. The price is anchored correctly to the *finished* product; it is high relative to the *shipped* product.

**Recommendation (ship TODAY, copy-only):** On every paid card, visually split features into **"Available now"** and **"Ships [target]"**. Until the portal layer is live, present paid tiers as **founding-member pricing** (a locked-in rate that is honest about what is and is not live yet). This is the same honesty the landing page already uses for data import ("real-data view ships late June"). Do not raise or lower the headline numbers; make the card tell the truth about timing.

### Decision 2 — Rename "Family" (and give every paid tier a "best for" line).

"Family" at $89 is the exact tier Freddie — a **single adult** — saw and bounced off. The name signals "for a household of several people," which is wrong for the solo landlord and the solo professional who are squarely in that tier's value zone (unlimited properties, Legal Matters, Projects). The four paid names (PoeTech+, Family, Premium, PoeTech Business) signal *price ladder position*, not *who each is for*.

**Recommendation (ship TODAY, copy-only):** Add a one-line "Best for:" under each tier name, and rename `family` -> a capability name. Strongest candidate: **"Household"** keeps the warmth while dropping the "multiple-people" misread; a more literal option is **"Landlord"** (since unlimited properties + tenant portals is the tier's spine). Keep the internal key `family` to avoid touching `TIER_ORDER`. See Recommendation Matrix for the full naming pass.

### Decision 3 — Do NOT ship the proposed "Small Landlord $99" tier. It is incoherent against the existing ladder.

The `DevOps.jsx:420-425` proposal adds a $99/mo "Small Landlord" tier "between Family and Premium" for "1-5 rentals... PoeTech's Rentals + Books + Projects without Practice." But **Family at $89 already gives unlimited properties + Projects + Legal** (`About.jsx:113`). A $99 tier that sits *above* $89 while offering *less* (no Legal, fewer modules) is a price-value inversion — no rational buyer pays $99 for less than the $89 tier delivers. The landlord journey is already covered: **PoeTech+ ($39, up to 3 properties)** then **Family ($89, unlimited)**. The real seam is the $39->$89 jump for the 4-10-property landlord who does not want Legal/Projects — addressable with a **per-property add-on on PoeTech+**, not a new tier that overshoots. **File the proposal as "do not ship as drafted; fold into PoeTech+ add-on instead."**

### Decision 4 — Wire the Community-free funding mechanic, or stop advertising "sponsored by paying subscribers."

The Community tier card promises "Free access for families... **sponsored by paying subscribers**... Paying subscribers fund this tier transparently" (`About.jsx:117`). There is **no mechanic behind this** — no sponsor checkbox at checkout, no fund accounting, no per-subscriber contribution math, no "transparency" surface. This is a `BUSINESS-PROCESS-CONNECTIONS` violation: a visible promise with no wired pipeline. And because `DATA-AS-EMPOWERMENT-NOT-EXTRACTION` forbids ads / data sales / advertiser access, **subscription cross-subsidy is the ONLY honest funding path** — so the math has to be real. **File the gap; the cross-subsidy ratio (how many paying subs fund one free family) must be computed and a sponsor mechanic speced before this card's promise is true.**

### Decision 5 — Fix two honesty gaps in the replacement-value claims, and give Foundation users data durability.

(a) **Foundation over-claims:** the card says Foundation replaces "$50-100/mo equivalent" (`About.jsx:111`) but its honest replacement is ~$15/mo (YNAB-class budgeting). Tighten the claim. (b) **Premium over-claims:** "replaces Practice Better / SimplePractice ($75-150)" (`About.jsx:114`) — but PoeTech's Practice tab is explicitly **non-PHI** (intake / conversion tracking; "HIPAA stays in Acuity"). It replaces the *CRM/intake* layer, **not** the clinical EHR. TLC still needs its EHR. Reframe the claim. (c) **Durability:** Foundation is "device-only storage" — an elderly COLG member who loses their phone loses everything. Give Foundation **free manual export + a backup reminder** (cloud backup can stay a paid unlock), because device-loss hurts the most vulnerable users most (`QUALITY-OF-LIFE-AS-NORTH-STAR`, `DATA-AS-EMPOWERMENT` exportability).

---

## 2. Current state — what each tier actually is

### 2.1 The tier engine (verified)

The ladder and its enforcement live in `app/src/poe-financial-mvp-v28.jsx`:

- `TIER_ORDER` (`:757`): `['foundation', 'poetech-plus', 'family', 'premium', 'business']`
- `TIER_LABEL` (`:758-764`): Foundation (free) / PoeTech+ ($39/mo) / Family ($89/mo) / Premium ($149/mo) / PoeTech Business ($249/mo)
- `TIER_ALIASES` (`:766-770`): `loved-ones` -> `poetech-plus`; `community` -> `poetech-plus`; `community-partner` -> `business`
- `tierMeets(userTier, requiredTier)` (`:773-777`): the one decision function; compares index positions in `TIER_ORDER`.
- Annual pricing (`About.jsx:111-115`): $0 / $390 / $890 / $1490 / $2490 (~17%, "2 months free").

**Material caution: enforcement is 100% client-side.** `userTier` is plain local state; `tierMeets` trusts it; the header `TierSwitcher` (`:1178-1234`) and the `UpgradePrompt` dev switcher (`:833-841`) let anyone set any tier with no payment. "Real billing happens through About" (`:1229`) and the About cart only records `checkoutIntent` — **no billing is wired yet**. This means *every price in this review is currently aspirational*; nothing is actually collected. That is the right context for "should we change prices" — we are setting the number before the first dollar, not repricing a paying base.

### 2.2 Feature-by-tier matrix (every gate, file:line cited)

| Feature | Foundation | PoeTech+ | Family | Premium | Business | Gate (file:line) |
|---|:--:|:--:|:--:|:--:|:--:|---|
| Big Picture / Overview | YES | YES | YES | YES | YES | `v28:783` |
| Books (entities/accounts/txns/1099) | YES | YES | YES | YES | YES | `v28:784` |
| Debts (avalanche + snowball) | YES | YES | YES | YES | YES | `v28:785` |
| Church tab | YES | YES | YES | YES | YES | `v28:788` |
| Spiritual Life / Godhead Study | YES | YES | YES | YES | YES | `About.jsx:114` (free every tier) |
| Markets watchlist | 5 tickers | unlimited | unlimited | unlimited | unlimited | `v28:3073`, `Markets.jsx:24,100` |
| Real Estate | 1 preview (read-only) | up to 3 (full edit) | unlimited | unlimited | unlimited | `RENTALS_FULL_EDIT_TIER v28:803`; gate `v28:3037`; About `:112-113` |
| Dev/Ops matched options | 1 | 3 | 6 (full) | 6 (full) | 6 (full) | `DevOps.jsx:14-18` |
| Projects tab | NO | NO | YES | YES | YES | `v28:789`, gate `:3075` |
| Legal Matters (PIN + AES-GCM encryption) | NO | NO | YES | YES | YES | `Legal.jsx:16-17,131-138` |
| Practice Operations (non-PHI intake) | NO | NO | NO | YES | YES | `v28:790`, gate `:3081` |
| "Wrap me with the tech" handoff | NO | NO | NO | YES | YES | `DevOps.jsx:19,43,182` |
| Scope-of-work agreements | NO | NO | NO | YES | YES | `About.jsx:114` |
| Tenant portals (when auth ships) | NO | up to 3 | unlimited | unlimited | unlimited | `About.jsx:112-113` |
| Contractor / Client portals (when auth ships) | NO | NO | NO | YES | YES | `About.jsx:114` |
| Audit-grade interaction log | NO | NO | NO | NO | YES | `About.jsx:115` |
| Entities tracked | "2" (advertised) | "unlimited" (advertised) | unlimited | unlimited | up to 10 | `FOUNDATION_CAPS v28:806` (see note) |
| Team / staff users (when backend ships) | NO | NO | household | solo | up to 5 | `About.jsx:113-115` |

**Two correctness findings carried from the repo map (both worth fixing, neither blocking this pricing review):**

1. **`FOUNDATION_CAPS.maxEntities: 2` is dead config** (`v28:806`). It is advertised to users ("cap: 2 entities", `About.jsx:111`) but **no code reads it** — entity creation is not actually gated, and the PoeTech+ "unlimited entities" unlock is therefore also unenforced. This matters for the *family lens* below: a family with a side business is not actually pushed up a tier by entity count today.
2. **`Legal.jsx:16` hardcodes its own unlock set** (`{family, premium, business, loved-ones}`) instead of calling `tierMeets`. It works only because `loved-ones` happens to be listed; the `community` alias (also PoeTech+-equivalent) and any future alias will silently NOT propagate. Consistency bug; flag for the gating cleanup, not for pricing.

### 2.3 SaaS-replacement math, per tier (the unit-value anchor)

The Business tier already names its replacement stack (`DevOps.jsx:295`, verbatim): *"Business tier ($249) replaces: QuickBooks ($30-90) + CRM ($30-50) + project management ($20-30) + practice management ($75-150) + property tracking ($50-100) + scheduling ($14-29) + accounting consult ($50-200)..."* Below, the **same math is run for every tier**, anchored to **verified June-2026 competitor prices** (Sources section). "Today" = value of the *shipped* features; "At full build" = value once portals/sync ship.

| Tier | Price | Honest replacement stack (2026 verified) | Stack $ / mo | Verdict |
|---|---|---|---|---|
| **Foundation** | $0 | YNAB-class budgeting ($14.99) + free debt-payoff tool ($0) + free property preview | **~$15** | Card claims "$50-100"; **over-stated 3-6x**. Real value ~$15/mo but it is a genuine free QoL win (budget + debt strategy + faith tools). Fix the claim, keep the tier. |
| **PoeTech+** | $39 | YNAB ($14.99) + Stessa Manage->Pro ($12-28) for up to 3 doors + encrypted backup | **~$27-43** | **Well-anchored.** $39 sits inside the stack it replaces; *under* it at Stessa Pro. Honest today even before portals (budget + 3-property mgmt are live). |
| **Family** | $89 | Budgeting ($15) + unlimited-property mgmt w/ tenant portals (DoorLoop Starter $99 *or* RentRedi $29 + Stessa Pro $28) + Notion-class ops ($10-12) + encrypted doc vault | **~$80-150** | **Anchored at full build.** TODAY (portals not live) delivered value is ~$53 (budget + unlimited Stessa-class + Notion + Legal vault). The $89-vs-delivered gap IS Freddie's complaint. |
| **Premium** | $149 | Family stack + practice *intake/CRM* (HoneyBook $36-59, **not** the EHR) + QB Solopreneur ($20) + contractor/client portals + Scope tool | **~$125-180 at full build** | **Anchored at full build.** Note: does NOT replace SimplePractice/TherapyNotes (those are the EHR; PoeTech Practice is non-PHI). Reframe the claim; the number is fine. |
| **Business** | $249 | QBO Plus ($115) + HoneyBook Essentials ($59) + ClickUp Business ($12) + Stessa Pro ($28) + scheduling ($15-29) + audit/export + multi-entity | **~$240-400** | **Strong.** $249 sits at/below the replacement stack even on 2026 prices. The original `DevOps.jsx:295` claim ($400-1000) is generous but directionally right. |

**The pattern that holds across the ladder:** prices are anchored correctly to the **finished** product. The defect is **timing, not magnitude** — the differentiators that justify $89/$149/$249 (portals, sync) are not yet live, so today's delivered value trails the price on the three upper tiers. Foundation has the opposite defect (claim inflated above delivered value). Both are fixed with copy, not price changes.

---

## 3. The three lenses Darrell named

### 3.1 Family lens

**Test case:** 2 working adults + 2 kids + 1 rental property + 1 small side business.

What they actually touch: Big Picture, Books (their household + the side-business as a second entity), Debts, 1 rental (full edit), maybe Markets. Map to the ladder:

- **The whole case fits in PoeTech+ ($39).** Up to 3 properties full-edit covers the 1 rental (`RENTALS_FULL_EDIT_TIER`, `v28:803`); Books handles multiple entities at *any* tier (the "2-entity cap" is advertised but unenforced, `v28:806`); the side business is just a second entity. They reach for **Family ($89) only if** they want Legal Matters (encrypted document vault), Projects (multi-domain timeline), or unlimited tenant portals.
- **The hypothesized mismatch does NOT occur.** The task asked whether this family is forced to Business $249 to add side-business books. They are not — Books is multi-entity at every tier; Business $249 is only needed at 10+ entities or for audit-grade portals/5 staff users. **Good: the family case lands at $39-89, never $249.**
- **One real risk:** *if* `maxEntities: 2` is ever enforced (it is dead config today, `v28:806`), this family's side-business second entity would push them from Foundation to PoeTech+. **Recommendation:** raise the Foundation entity cap to a generous number (4-5) or keep it unenforced, so a normal family with one side hustle is never paywalled out of basic books. The free tier should comfortably hold "a household and its small side thing."

**Verdict:** the family ladder is *priced well* for the family lens. The fix is naming (a "family of 4" should not feel like the $89 tier is "the family tier" when $39 or even $0 serves them) and not enforcing a punitive entity cap.

### 3.2 Community lens (COLG specifically)

**Constraints (from `COMMUNITY-FIRST-MISSION.md`):** largest African American congregation in Champaign-Urbana, elderly tech-novice full-time staff, congregation overlapping the working-poor demographic, 44,000 sqft built by the community because outside help did not come. Commitment 5: **pricing that serves rather than extracts.**

- **Does Foundation FREE actually deliver for this community? Yes — and it is the right entry.** Big Picture + Books + Debts (avalanche **and** snowball) + Church tab + Spiritual Life / Godhead Study (free at every tier, `About.jsx:114`). For an elderly low-income member, a free, simple "what do I do with my money today + my debt payoff path + my faith rhythm" is a real `QUALITY-OF-LIFE` win on its own, not a teaser. **Keep Foundation as the COLG front door.**
- **Is "Loved Ones" (free PoeTech+ for life, first 100) wide enough?** The meaningful PoeTech+ unlocks for *this* demographic are **cross-device sync + encrypted cloud backup** — i.e., "if I lose my phone I don't lose my money picture." That is exactly the durability a vulnerable user needs most. So Loved Ones is generous and well-aimed. The scarcity ("first 100, tier closes when filled", `About.jsx:116`) is a deliberate warm-market constraint, not a barrier to the free Foundation door.
- **What PoeTech+ has that COLG members might need but Foundation lacks:** only **data durability** (sync + backup) really. Tenant portals / unlimited properties / unlimited watchlist matter only to the landlord subset. **Recommendation (carried from Decision 5):** give *Foundation* users free **manual export + a "back up your data" nudge** so a non-Loved-Ones COLG member who loses a phone is not wiped out. Cloud backup can stay the paid unlock; one-tap export should not be paywalled (`DATA-AS-EMPOWERMENT` exportability is a *commitment*, not a tier feature).
- **Important distinction — two different pricing surfaces:** `COMMUNITY-FIRST-MISSION.md` Commitment 5 describes the **Church Module** pricing (self-host free / supported flat-per-month / partnership), which is a **per-church** product, *not* the family-app tiers reviewed here. The current PWA Community-Partners card ($0 for verified 501(c)(3), gates as `business` via the alias, `About.jsx:118`) partially implements the "org itself is free" half. **Do not conflate the family-app ladder with the Church-Module pricing** — they are different products for different buyers. The Church Module's flat-no-per-seat model is documented there and is sound; it is out of scope for this family-tier review but noted so the two are not accidentally merged.

**Verdict:** the community lens is well-served at the *free* layer. The one gap is **Foundation data durability** for the lose-your-phone case, which hits this demographic hardest.

### 3.3 Business lens

**The Poe businesses (dogfooding):**

- **Poe Properties (rentals)** -> Family ($89, unlimited properties + tenant portals at full build) or Business ($249) if run as a separate audited entity with contractor portals.
- **TLC Therapy Solutions** -> Premium ($149) for Practice Operations (intake/conversion, **non-PHI**) + client portals. **Critical:** TLC still needs an actual EHR (SimplePractice/TherapyNotes) for clinical records — PoeTech does not replace it. The TLC firewall pattern (HIPAA stays in Acuity/EHR) is intentional.
- **Family as multi-LLC operator** -> **Business ($249)** is the dogfooding tier: 10 entities, 5 staff users, audit-grade log, 1099-NEC e-file, quarterly strategy review. The Poe family operating its own businesses on PoeTech is the proof the $249 stack is real. Good.

**External small-business customers — and where PoeTech's flat pricing is the moat:**

The decisive competitive fact: **PoeTech is flat-per-tier; the incumbents tax per-unit or per-seat.** This is `project_cost_discipline_with_growth_permission` made visible to the customer — unit cost gets *better* as you scale, the opposite of a per-user tax.

- **Landlord, 5-25 units:** PoeTech Family **$89 flat** vs Avail Unlimited Plus **$9/unit** (25 units = $225/mo) or DoorLoop ($99-239 + $3/unit). At 25 units PoeTech is ~60-70% cheaper. Strong.
- **Solo therapist:** PoeTech Premium **$149 flat** covers intake + portals + rentals + scope, but **not** the EHR. A therapist still pays for SimplePractice ($49-99) / TherapyNotes ($69) on top. So PoeTech is an *adjacent* tool for a therapist, not a replacement of their core. Position honestly: "runs the business *around* your practice," not "replaces your EHR."
- **Practice, 3 clinicians:** PoeTech (no per-clinician charge) vs SimplePractice Plus $99 + $39 + $39 = **$177/clinician-stack**. PoeTech's flat model wins on the CRM/ops layer; again, EHR is separate.
- **Single-shingle contractor:** PoeTech Premium **$149** (contractor portals + Scope-of-work templates + Capex forecast) vs HoneyBook ($36-129) + QuickBooks Solopreneur ($20) + project tool. Competitive bundle.

**Verdict:** the business ladder is priced right and the flat-vs-per-unit story is the strongest single selling point. The one honesty fix is the **therapy/EHR boundary** — Premium runs the practice's *business*, not its *clinical record*.

---

## 4. Competitor comparison (verified June 2026)

All prices verified live from official pages June 2026 unless flagged (Sources). Where a competitor charges per-seat/per-unit, that is the moat line for PoeTech's flat model.

| Competitor | 2026 price | What it does | Closest PoeTech tier | PoeTech does better | They do better |
|---|---|---|---|---|---|
| **YNAB** | $14.99/mo ($109/yr) | Zero-based budgeting only | Foundation ($0) | Free; adds debt strategies, property, faith tools | Deeper budgeting workflow, bank sync mature |
| **Monarch Money** | $14.99/mo ($99.99/yr); Plus $199/yr | Budgeting + net worth + rental/biz income | Foundation -> PoeTech+ | Bundles property *management* not just tracking; flat | Mature aggregation, investment analysis |
| **Rocket Money** | ~$7-14/mo (pay-what's-fair) | Subscription cancel + budgeting | Foundation | Not engagement-extractive; no upsell-to-negotiation | Bill negotiation service |
| **Empower** | Free (AUM advisory paid) | Net worth + planning dashboard | Foundation | Faith + stewardship frame; no AUM funnel | Investment depth |
| **Stessa** | Free; Manage $12; Pro $28 (annual) | Rental accounting/tracking, unlimited units | PoeTech+ / Family | Adds tenant *portals* + Legal + Books + budget in one | Dedicated rental bookkeeping depth |
| **Avail** | Free; Plus **$9/unit/mo** | DIY landlord (listings, screening, leases) | Family ($89 flat) | **Flat vs per-unit** — wins above ~10 units | Listing syndication, tenant screening |
| **DoorLoop** | $99/$189/$239 + **$3/unit** (annual) | Full property management | Family / Business | Flat; bundles non-property modules | Dedicated PM accounting, owner statements |
| **Buildium** | $62 / $192 / $400 | Property mgmt for pros | Business | Cheaper at portfolio scale; bundled | Pro-grade PM, eSign, banking |
| **RentRedi** | $5 / $12-29.95 | Landlord rent collection + screening | PoeTech+ | Bundles books + budget + faith | Tenant screening, rent reporting |
| **QuickBooks Online** | $38 / $75 / $115 / $275; Solopreneur $20 | Cloud accounting | Premium / Business | Bundles CRM + property + practice; no add-on creep | Accountant ecosystem, payroll, tax depth |
| **HoneyBook** | $29 / $49 / $109 (annual) | Service-business CRM + invoicing | Premium | Bundles property + practice + scope | Payments UX, templates library |
| **FreshBooks** | $23 / $43 / $70 | Invoicing + accounting | Premium | Bundled ecosystem | Invoicing/expense depth |
| **Wave** | Free; Pro $19 | Free invoicing + bookkeeping | PoeTech+ | Adds property/practice/portals | Free accounting baseline |
| **SimplePractice** | $49 / $79 / $99 **per clinician** (+$39 extra) | Behavioral-health EHR + practice mgmt | Premium (adjacent) | Flat; runs the *business around* the practice | **Is the EHR** — PoeTech is not |
| **TherapyNotes** | $69 solo; +$50/clinician | Behavioral-health EHR | Premium (adjacent) | Flat ops layer | **Is the EHR** — PoeTech is not |
| **Jane App** | $54 / $79 / $99 **per practitioner** | Multi-discipline EHR | Premium (adjacent) | Flat | Is the EHR + booking |
| **Notion** | $10 / $20 **per seat** (annual) | Docs / wiki / projects | Family (Projects) | Flat; finance-native, not generic | General-purpose flexibility |
| **ClickUp** | $7 / $12 **per member** (annual) | Project management | Family / Business | Flat; finance + property context | Dedicated PM features |
| **Airtable** | $20 / $45 **per seat** (annual) | Database/spreadsheet hybrid | Business | Flat; purpose-built | Generic data flexibility |

**Per-dollar read:** PoeTech is never the *deepest* tool in any single niche — YNAB budgets better, SimplePractice is the EHR, DoorLoop does owner statements. PoeTech wins on **(a) bundling** (one bill replaces 4-7 subscriptions) and **(b) flat pricing** (no per-unit/per-seat/per-clinician tax). Both are direct expressions of the binding principles: bundling serves the family/community over the vendor (`DATA-AS-EMPOWERMENT`), and flat pricing means unit cost *improves* with scale (`cost-discipline`). The marketing should lead with these two facts, not with feature-count.

---

## 5. Opportunity-to-tier mapping

The named opportunities live in `DevOps.jsx` in two arrays: `LowHangingFruit` ("Revenue Not Yet On The Radar", `:361-460`) and `PoeTechServicesPortfolio` ("Four Ways to Work Together", `:462-641`). **Key finding: these are revenue streams FOR the Poe family / consulting offers, NOT subscription-tier features.** Accessing them does not require a tier. Only ONE opportunity is tier-gated.

| Opportunity (file:line) | Price | Standalone or tier-gated? | Tier it *requires* | Tier it *feeds* |
|---|---|---|---|---|
| TLC Group Therapy Cohorts (`:364`) | $10-18K/yr | Standalone (TLC service) | none | — |
| COLG Faith + Finance Workshop (`:372`) | $5-15K/yr | Standalone (love offering) | none | drives Foundation/Loved-Ones signups |
| Affiliate revenue from recommended tools (`:380`) | $100-500/mo | Standalone (passive) | none | — |
| PoeTech Stewardship Newsletter (`:388`) | $500-2K/mo | Standalone ($5-10/mo micro-sub) | none | top-of-funnel for Foundation |
| Pre-Marital Bundle / "COLG Couples Counseling" (`:396`) | **$499-999 one-time** (6 sessions) | **Standalone** (Christina + Darrell service) | none | — |
| MSW Supervision Hours (`:404`) | $1-5K/mo ($75-150/hr) | Standalone (TLC service) | none | — |
| Scope Template Downloads (`:412`) | $200-2K/mo ($19-49 each) | **Standalone — sold to NON-subscribers** | none | sampler -> Premium (full Scope tool) |
| Small Landlord Tier (`:420`) | $99/mo | **Proposed tier (see Decision 3 — do not ship)** | n/a | n/a |
| **"Wrap me with the tech" handoff** (`DevOps.jsx:19,43`) | included | **TIER-GATED** | **Premium ($149)** | Premium/Business retention |
| Services Portfolio: Hourly/Retainer/Rev-share/Enterprise (`:465-499`) | $150-800/hr; $2-5K/mo; 20-49%; $50K-5M | Standalone consulting (view-only at Foundation) | none to view | Business tier (rev-share partnership eligibility, `About.jsx:115`) |

**Implications:**
1. The opportunity library is mostly **tier-independent revenue** — the Couples Bundle, supervision hours, workshops, and template sales generate cash without anyone subscribing. Good: they de-risk the subscription ramp.
2. The **one** tier-gated opportunity, "Wrap me with the tech," correctly sits at **Premium $149** (it auto-creates Project + Scope + Capex, which are Premium-and-up constructs). Coherent.
3. **Scope Template Downloads ($19-49)** are the smartest funnel: sold to *non-subscribers* as a sampler of the Premium Scope tool. Keep and promote — it is a paid lead magnet.
4. **Business-tier rev-share eligibility** (`About.jsx:115`) is the one place a *subscription tier* unlocks an *opportunity* (consulting partnership). Coherent ladder-top.

---

## 6. Recommendation matrix

For each existing tier: keep/adjust/rename/drop, price call (with the math), naming, and what to add. **Default action timing is TODAY** per no-kick-the-can; copy-only changes have no blocker, price/billing changes are gated on the billing system that is not yet wired (`v28:1229`).

| Tier | Decision | Price call | Naming | Add / change |
|---|---|---|---|---|
| **Foundation $0** | **KEEP** | Keep $0 forever. Fix the **"$50-100/mo equivalent"** claim down to **"~$15/mo (YNAB-class)"** — honest and still compelling because it is *free*. | Keep "Foundation". | **ADD free manual export + backup nudge** (Decision 5c). Raise/unenforce the entity cap so a family + side hustle never paywalls (3.1). Ship TODAY (copy + 1 export button). |
| **PoeTech+ $39** | **KEEP** | **Keep $39.** Best-anchored tier on the ladder ($39 vs ~$27-43 stack). No change. | Add "Best for: a landlord with 1-3 doors, or a saver who wants cloud backup." | **ADD a per-property add-on** (e.g., +$8/door above 3) to serve the 4-10-door landlord *here* instead of inventing Small Landlord (Decision 3). Ship the add-on when billing ships; add the "best for" line TODAY. |
| **Family $89** | **KEEP, RENAME** | **Keep $89** (anchored at full build, ~$80-150 stack). But present **founding-member framing** until portals ship (Decision 1) so today's $89-vs-delivered gap is honest. | **RENAME -> "Household"** (preferred) or "Landlord". Internal key stays `family`. Add "Best for: unlimited rentals, or a solo pro who needs Legal + Projects." | Split card into **Available now** (unlimited properties, Legal vault, Projects) vs **Ships [date]** (unlimited tenant portals). Ship TODAY (copy + rename). |
| **Premium $149** | **KEEP** | **Keep $149** (anchored ~$125-180 at full build). | Add "Best for: a solo professional or contractor running a client-facing business." | **FIX the SimplePractice claim** — Practice is non-PHI intake/CRM, NOT the EHR (3.3, Decision 5b). Reframe "replaces" line. Ship TODAY. |
| **PoeTech Business $249** | **KEEP** | **Keep $249** — strongest value on the ladder ($249 vs $240-400 stack). | Keep "PoeTech Business". Add "Best for: a multi-entity operator or a small org with staff." | None beyond founding-member timing note on the portal lines. Ship TODAY (copy). |
| **Loved Ones (free PoeTech+, first 100)** | **KEEP** | Free. | Keep. | Decision pending: extend "by direct invitation" to non-COLG warm-market friends like Freddie? (Open Question 1 — Darrell's call). |
| **Community (free, sponsored)** | **KEEP, but WIRE IT** | Free. | Keep. | **FILE GAP (Decision 4):** no sponsor mechanic exists. Spec the cross-subsidy math + a sponsor checkbox + a transparency surface before the "sponsored by paying subscribers" promise is true. Blocked on billing; spec TODAY. |
| **Community Partners (free 501c3)** | **KEEP** | Free. | Keep. | Verify the `community-partner -> business` alias actually grants full features in practice once billing/auth ships (`TIER_ALIASES v28:768`). |
| **Small Landlord $99 (proposed)** | **DO NOT SHIP as drafted** | n/a | n/a | Price-value inversion vs Family $89 (Decision 3). Fold the need into a **PoeTech+ per-property add-on**. File the proposal closed with rationale. |

### Cross-tier coherence (do the prices make sense against *each other*?)

The gaps: $0 -> $39 -> $89 -> $149 -> $249. Increments of $39 / $50 / $60 / $100. This is a clean, slightly-accelerating ladder — reasonable: each step adds a *category* of capability (sync -> multi-property+Legal -> practice+portals -> multi-entity+audit). The only "gap" anyone proposed filling ($89-$149) is better served by a PoeTech+ add-on than a new tier. **The ladder is internally coherent. Do not add a sixth tier.**

---

## 7. Open questions for Darrell (true judgment calls only)

**1. Loved Ones cohort — extend "by direct invitation" to non-COLG warm-market friends (e.g., Freddie)?**
The card already says "First 100 families through Church of the Living God **or by direct invitation**" (`About.jsx:116`). Freddie is a childhood friend giving real beta feedback but is not COLG. Honoring him may be *within* the existing language at your discretion — or you may want to keep Loved Ones strictly COLG and create a separate "Founding Friends" lane, or give him Foundation-free + a personal thank-you. Relational + strategic; yours to call. (Carried from the Freddie note; unchanged.)

**2. Rename "Family" to "Household" or "Landlord" — which reads right to you?**
"Household" keeps warmth and fixes the "this is the multi-person tier" misread that bounced Freddie (a single adult). "Landlord" is more literal to the tier's spine (unlimited properties + tenant portals) but narrows the perceived audience. This is a brand-voice call. (I recommend "Household.")

**3. Community-free funding — what is the cross-subsidy ratio you want to commit to publicly?**
Since ads/data-sales are forbidden (`DATA-AS-EMPOWERMENT`), the only honest funder is paying subscribers. Before the "sponsored by paying subscribers, transparently" promise (`About.jsx:117`) can ship truthfully, you need to decide the mechanic: opt-in sponsor add-on at checkout (e.g., "+$5/mo sponsors one family"), a fixed % of every subscription, or a flat "every N paid subs funds 1 free family." Which model fits the mission framing you want to make publicly? (I can spec whichever you pick.)

---

## 8. Sources

### Repo (file:line)
- Tier engine: `app/src/poe-financial-mvp-v28.jsx:757-810` (`TIER_ORDER`, `TIER_LABEL`, `TIER_ALIASES`, `tierMeets`, `VIEW_TIER_REQUIREMENTS`, `RENTALS_FULL_EDIT_TIER`, `FOUNDATION_CAPS`)
- Gates: `v28:3037` (rentals), `:3073` (watchlist), `:3075` (projects), `:3081` (practice); `components/Legal.jsx:16-17,131-138`; `components/Markets.jsx:24,100`; `components/DevOps.jsx:14-19,43,182`
- Billing not wired: `v28:1229`; cart records intent only: `components/About.jsx:13-62`
- Pricing cards (prices, features, "replaces" strings): `components/About.jsx:104-122`
- Business replacement stack: `components/DevOps.jsx:294-295`; competitive table `:307-312`
- Small Landlord proposal: `components/DevOps.jsx:420-425`
- Opportunity arrays: `components/DevOps.jsx:361-460` (LowHangingFruit), `:462-641` (ServicesPortfolio), pre-marital bundle `:396-401`
- Foundations: `docs/00-foundations/_root/COMMUNITY-FIRST-MISSION.md` (Commitment 5), `QUALITY-OF-LIFE-AS-NORTH-STAR.md`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`
- Companion: `docs/99-session-notes/2026-06-02-freddie-taylor-user-feedback.md`

### Competitor pricing (verified live, June 2026)
- [YNAB](https://www.ynab.com/pricing) - $14.99/mo, $109/yr
- [Monarch Money](https://www.monarch.com/pricing) - $14.99/mo or $99.99/yr; Plus $199/yr
- [Rocket Money](https://help.rocketmoney.com/en/articles/2217739-how-much-does-rocket-money-cost) - pay-what's-fair ~$7-14/mo
- [Quicken Simplifi](https://www.quicken.com/products/pricing-comparison-products/) - $5.99/mo reg ($2.99 intro annual)
- [Empower](https://www.nerdwallet.com/financial-advisors/reviews/empower) - free dashboard
- [Stessa](https://www.stessa.com/pricing/) - free / $12 / $28 (annual)
- [DoorLoop](https://www.doorloop.com/pricing) - $99 / $189 / $239 + $3/unit
- [Buildium](https://www.buildium.com/pricing/) - $62 / $192 / $400
- [Avail](https://www.avail.com/pricing) - free / $9 per unit/mo
- [RentRedi](https://rentredi.com/pricing/) - $5 / $12-29.95
- [TurboTenant](https://www.turbotenant.com/pricing/) - free + paid (official page 403; paid figures third-party)
- [QuickBooks Online](https://www.nerdwallet.com/business/software/learn/quickbooks-pricing) (NerdWallet, Mar 2026) - $38 / $75 / $115 / $275; Solopreneur $20
- [HoneyBook](https://www.honeybook.com/pricing) - $29 / $49 / $109 (annual)
- [FreshBooks](https://www.freshbooks.com/pricing) - $23 / $43 / $70
- [Wave](https://www.waveapps.com/pricing) - free / Pro $19
- [SimplePractice](https://www.simplepractice.com/pricing/compare-plans/) - $49 / $79 / $99 per clinician (JS-rendered; cross-confirmed)
- [TherapyNotes](https://www.therapynotes.com/pricing/) - $69 solo, +$50/clinician (403; cross-confirmed)
- [Jane App](https://jane.app/pricing) - $54 / $79 / $99 per practitioner (USD)
- [Notion](https://www.notion.com/pricing) - $10 / $20 per seat (annual)
- [ClickUp](https://clickup.com/pricing) - $7 / $12 per member (annual)
- [Airtable](https://airtable.com/pricing) - $20 / $45 per seat (annual)

---

## Phil 4:8 + Religion AND Relationship check (run before commit)

- **True:** every tier claim is anchored to `file:line`; every competitor price is from a verified June-2026 source (flagged where the official page was unreachable). The "not shipped yet" findings are quoted from the cards' own "when X ships" language. No fabricated numbers.
- **Honorable / Just:** the review credits the platform's existing serve-not-extract philosophy and Freddie's instinct rather than defending the price; it names where claims over-state and fixes them honestly.
- **Pure / Lovely / Commendable:** recommendations protect the most vulnerable user (Foundation data durability for the elderly COLG member) and the relationship (Loved-Ones invitation left to Darrell).
- **Excellent / Praiseworthy:** named gaps, math shown, no hand-waving; "do not ship Small Landlord" and "wire the Community funder" choose correctness over adding surface.
- **Religion (backbone):** file-cited, math-anchored, principle-tested. **Relationship (warmth):** the framing serves the family, the church community, and the friend who gave feedback, by tier and by name.

*Foundation free forever. No one priced out of stewardship. Kings, not slaves. We all win. We create.*
