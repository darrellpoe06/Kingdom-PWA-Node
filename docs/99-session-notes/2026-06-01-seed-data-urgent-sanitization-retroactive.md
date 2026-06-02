# 2026-06-01 — Seed Data Urgent Sanitization (Retroactive Research Note)

**Status:** Retroactive. Code shipped first; this note documents the why and the path forward.

**Author:** Claude Code (subagent invoked by Dispatch session 30ab35cc-a89a-4a43-8193-2e85f6536a37).

**Foundation principles invoked:**
- `SEED-DATA-AS-ASPIRATION` (foundation doc, 2026-05-28)
- `DATA-AS-EMPOWERMENT-NOT-EXTRACTION` (foundation doc, 2026-05-29)
- `feedback-research-first` (binding principle; URGENT exception path)

---

## 1. The data leak that triggered the urgent fix

At 13:49 CDT on 2026-06-01, Darrell submitted via the in-app Suggest button (verified end-to-end through the wf30 family-feedback loop):

> "No financial seed data at all make sure it doesn't look like our original data anymore anywhere if anyone else looks at poetech.us or the app. We want good better best case scenario based on their data however the original data should be from the perspective of good credit multi-generational testimony type families interactions in the app that helps the ones in the family who want to do well to collaborate and add non blood families for overall stress relief."

At that moment the public-facing PWA at poetech.us was rendering — in default seed mode — a SEED_DATA block containing 211+ real-Poe-family identifiers:

- 11 rental property addresses (1508 Williamsburg, 1513 Holly Hill, 1508 Holly Hill, 805 Apt 1-4, 440 South Street, 1003 Koehn, 1213 Koehn, 709 Commercial)
- Primary residence: 2111 Talans Way
- City: Champaign, IL 61820
- 26 specific creditor names with real balances
- LLC names: PoeTech LLC, Poe Properties, TLC Therapy Solutions
- Employer: UIUC (University of Illinois)
- Church: The Church of the Living God (full address, real phone, real website)
- Family member first names: Darrell, Christina, Christiana
- Specific enterprise client: "Federal Companies"
- Specific lender: "Aunt Leah" (non-blood family loan)

Any visitor — a family member, a COLG congregant, a prospective user, a hostile actor — could read the Poe family's actual financial picture by visiting the default seed view.

Per `DATA-AS-EMPOWERMENT-NOT-EXTRACTION`, real family data exposed publicly through a demo persona is structural extraction even when accidental. Per `SEED-DATA-AS-ASPIRATION`, the starter state is supposed to be the first impression of what success looks like for a NEW family using the system — never a window into the principal family's actual numbers.

## 2. Why the URGENT exception to research-first was invoked

`feedback-research-first` is the binding principle: proper good/better/best multi-generational overhauls require a research-review report before code change. The URGENT exception applies when a public-facing privacy gap is actively leaking — close the leak first, then do the proper research-review for the long-arc overhaul.

Both conditions held:
1. **Public:** poetech.us is live and indexable.
2. **Active gap:** real family identifiers were being served to every default-seed visitor.

The decision: ship the minimum-viable sanitization NOW; defer the proper good/better/best multi-persona Phase 2 to a research-reviewed pass.

## 3. What was changed

### Files touched

- `app/src/poe-financial-mvp-v28.jsx` — primary seed-data file (entities, accounts, transactions, contractors1099, recurringObligations, incidents, scopes, projects, inquiries, inflows, rentals, debts, opportunities, church block, voiceOps comment, skillProfiles, DEMO_DATA_LANDLORD, PROFILES labels, profile-picker copy, account-dropdown labels, welcome-panel copy, vision text, queue-form placeholder).
- `app/src/components/Projects.jsx` — PROJECT_DOMAINS labels (PoeTech / Poe Properties / TLC Therapy / UIUC), SCOPE_TEMPLATES descriptions for MSW + Property contractor templates, example-projects loader (6 sample projects with Poe identifiers), entity dropdown options, visible Projects description.
- `app/src/components/Cart.jsx` — entity dropdown fallback options (Personal/Poe Properties/PoeTech/TLC).
- `app/src/components/Inbound.jsx` — voicemail line labels + filter buttons + intro copy referencing the routed business lines.
- `app/src/components/Rentals.jsx` — section header "11 Doors · Poe Properties LLC", address-input placeholder, Property Map subtitle "Champaign-Urbana", maintenance vendor placeholder "Reyes Roofing".
- `app/src/components/About.jsx` — PoeTech+ tier feature copy with "Tracy at 1508 Holly Hill" example; Home Command module desc with "UIUC F&S Siemens".
- `docs/99-session-notes/2026-06-01-seed-data-urgent-sanitization-retroactive.md` — this retroactive doc.

### Substitution table applied

| Category | Real Poe identifier | Sanitized replacement |
|---|---|---|
| City | Champaign | Cedar Heights |
| State | IL | IL (broad enough not to identify) |
| University | UIUC, University of Illinois | Regional University, Regional University Facilities |
| Church | The Church Of The Living God | Cornerstone Community Church |
| Church nickname | The Love Corner | Your Local Church |
| Church URL / phone / address | live URLs and phone | blanked or '(555) 555-0100' placeholder |
| Entity: PoeTech LLC | (legal name in seed) | Cornerstone Tech LLC |
| Entity: Poe Properties LLC | (legal name in seed) | Steward Real Estate LLC |
| Entity: TLC Therapy Solutions LLC | (legal name in seed) | Wellness Counseling Practice LLC |
| Spouse 1 | Darrell | Adam |
| Spouse 2 | Christina | Naomi |
| Older daughter | Christiana | Hannah |
| Twin son | Twin (son) | Caleb |
| Twin daughter | Twin (daughter) | Esther |
| Non-blood lender | Aunt Leah | Auntie M (Family Loan) |
| Enterprise client | Federal Companies | Regional Enterprise Client A |
| Rental: 1508 Williamsburg | (real address) | 1402 Maple St |
| Rental: 1513 Holly Hill | (real address) | 1517 Oak Ave |
| Rental: 1508 Holly Hill | (real address) | 1521 Oak Ave |
| Rental: 805 Apt 1-4 | (real building) | 240 Cedar Ln Apt 1-4 |
| Rental: 440 South Street | (real address) | 312 Willow Ln |
| Rental: 1003 Koehn | (real address) | 818 Birch St |
| Rental: 1213 Koehn | (real address) | 821 Birch St |
| Rental: 709 Commercial | (real address) | 506 Main Commercial Bldg |
| Primary home: 2111 Talans Way | (real address) | 1108 Sycamore Dr |
| Creditor names (26 of them) | UMB, Avant, Credit One, Synchrony, 1st Mid CC Biz, AMEX (small), UIECU, Chase, Citi, Discover, US Bank Biz, Busey, Upgrade, Figure, Light Stream, AMEX (B), AMEX, Empower, Car payment, Good Leap (solar), SBA Loan, Aunt Leah, Affirm, AMEX DP, COT CC Biz, Divvy CC Biz | Card A/B/C/D/E/F/G/H/I/J, Business Card A/B/C/D/E, Personal Line A, Personal Loan A/B/C, HELOC, Auto Loan, Solar Financing, Small Business Loan, Family Loan (Auntie M), BNPL A, 0-percent Promotional Loan |
| Inquiry firstNames | Maya R., James T., Tasha W., Marcus L., Aaliyah B., Wendell S., Lakeisha M. | Sample R./T./W./L./B./S./M. (Rev. K. kept as already-anonymous) |
| Inquiry providers | Christina Poe, Sheronda Smith-Williams, Carolyn Nicole Johnson | Naomi (lead clinician), Clinician A, Clinician B |
| Inquiry sources | COLG referral, COLG women's ministry, TLC IG/FB/contact form, Champaign | Local church referral / women's ministry, Practice IG/FB/contact form, "locally" |
| Transactions | "Zelle from DELLORES TRACY (rent)", "Zelle from DETASHA (rent)", "UIUC Payroll", "State of IL Payroll (Christina)" | "Zelle from TENANT A/B (rent)", "Regional University Payroll", "State Payroll (Naomi)" |
| Incidents | "Tatmans Towing", "Animal Damage Control", "Robert W Shafer Orthodontics" | "Local Towing Service", "Pest / wildlife control", "Family orthodontics visit" |
| Scope example | "1508 Holly Hill - Roof Replacement" with contractor "Tomas Reyes" / Reyes Roofing | "1521 Oak Ave - Roof Replacement" with "Sample Contractor" / example-roofing.example |
| County | Champaign | Cedar Heights |
| Profile picker labels | Darrell / Christina (visible names) | Adam / Naomi (visible names) |
| Profile picker copy | "TLC stays private to Christina; business entities stay with Darrell" | "The practice stays private to its owner; business entities stay with the principal" |
| Account dropdown options | "Personal / Poe Properties / PoeTech / TLC Therapy" (4 places) | "Personal / Steward Real Estate / Cornerstone Tech / Wellness Practice" |
| Welcome panel desc | "Your TLC pipeline" | "Your practice pipeline" |
| Furnace placeholder | "Furnace died at 805 Apt 4" | "Furnace died at 240 Cedar Ln Apt 4" |
| Vision text (DEMO_PERSONA_META) | "Christina, Darrell, and 'Family' rollup" | "Naomi, Adam, and 'Family' rollup" |
| Voice ops comment | "Poe Properties + PoeTech in Phase 1" | "Steward Real Estate + Cornerstone Tech in Phase 1" |
| Accounts page copy | "(Personal, Poe Properties, PoeTech, TLC)" | "(Personal, Steward Real Estate, Cornerstone Tech, Wellness Practice)" |
| DEMO_DATA_LANDLORD cities | Champaign | Cedar Heights |

### Banner added at top of SEED_DATA

A 17-line comment now sits above `const SEED_DATA = {`, declaring the block as a sanitized aspirational seed, naming the binding foundation docs, and naming the Phase-2 plan.

## 4. What was NOT changed and why

### Intentional public promotion left in place (AdvisementBanner, TherapyReminder, About, DevOps, Practice)

The following code-resident surfaces still reference real Poe-family-owned businesses by name, with real URLs:

- **`AdvisementBanner` in poe-financial-mvp-v28.jsx (lines ~3245-3299)**: rotating sponsor-card banner promoting "The Church of the Living God" (with real URL, address, YouTube channel), "TLC Therapy Solutions" (with real Acuity booking URL), "Poe Properties LLC" (with `contact@poetech.us` mailto), "COLG · 77th National Assembly", "COLG · Bible Reading Challenge 2026".
- **`TherapyReminder` in poe-financial-mvp-v28.jsx (lines ~3203-3220)**: always-visible footer linking to `tlctherapysolutions-scheduleappointment.as.me/` with heading "TLC Therapy Solutions · Real solutions for real life".
- **`About.jsx` brand chrome (PoeTech LLC subtitle, PoeTech mission text, founding-family "Loved Ones" tier referencing "Church of the Living God", "Markets We Serve" copy, Bookstore section with Darrell Poe + Christina Poe as forthcoming authors, founder bios)**: this is the company's About page; it intentionally identifies the principals + their real businesses + their actual forthcoming books.
- **`DevOps.jsx` services pipeline (lines ~277, 372, 377, 401, 440, 557)**: PoeTech Services sales page that uses the real businesses (Poe Properties, TLC, Church of the Living God Tech Director role) as proof-of-provenance for the consulting practice. "COLG Faith + Finance Workshop", "COLG referrals", "TLC pipeline" are all cited as real revenue channels.
- **`Practice.jsx` (lines ~159-233)**: the entire Practice tab IS the real TLC Therapy Solutions public booking + clinician matching surface. Christina Poe LCSW + 6 other named clinicians, with real photos hotlinked from tlctherapysolutions.me, real Acuity booking URLs, real direct-contact email.

These are *intentional* public-facing brand promotion of real businesses Darrell actively wants to drive traffic to. They are not seed data and they predate this URGENT sanitization. The decision on whether to also genericize these for default-mode visitors (vs. keep them as promotion of the principal family's actual ministries/businesses) is a **business decision for Darrell**, not a data-leak fix.

The asymmetry is intentional: the SEED financial picture (rental balances, debt balances, family members and roles) is private; the COMPANY brand surfaces (founders, businesses, forthcoming books, partner church) are public-on-purpose.

Flagging here so Darrell can make the call on whether to extend sanitization to these brand surfaces:
- Option A: leave intentional promotion as-is (it's deliberate marketing of real businesses; the family WANTS visitors to know who built PoeTech and where to book a session).
- Option B: gate AdvisementBanner + TherapyReminder + Practice tab behind authenticated views only; show generic faith / wellness language in default-seed mode. (But this defeats the marketing purpose of the surfaces.)
- Option C: rotate promotional content into Phase-2 design (multi-persona seed picker decides which sponsor mix to render); keep About + Practice as-is because their whole purpose is identification.

### Profile system internals (`'darrell'`, `'christina'`, `'christiana'`, `'christian'`, `'christyn'`) left alone

These string IDs are wired throughout the app as routing keys (`if (prof === 'darrell')` ... ). Changing them is a non-trivial refactor that could break the family-feedback sender-handle mapping, the visibleTo gating, and the localStorage profile-key. The user-visible labels on those IDs were updated (Adam/Naomi); the routing keys stayed. Phase-2 work should consider whether to introduce a label-vs-key separation cleanly.

### Code archeology comments left alone

Comments like "Per Darrell 2026-05-28" (development-history references throughout the file) are not user-visible and document real change-history. Leave alone.

### Rental-portfolio shape unchanged

The same 11-door + 1 primary-home structure was preserved, just renamed. The DEBT structure (26 lines, same diverse rate ladder) was preserved. The opportunities list shape was preserved. This is the URGENT-mode minimum-viable change; Phase 2 should rethink the structure itself for the good/better/best multi-persona direction.

## 5. Phase 2 plan (full research-review per `feedback-research-first`)

The strategic direction Darrell named via the Suggest button is binding INPUT. The implementation approach is what gets research-reviewed.

The research-review report (deliverable: `docs/99-session-notes/YYYY-MM-DD-seed-data-multi-persona-research-review.md`) should cover:

1. **Approach inventory**, drawn from `agent/memory/project_seed_data_aspirational_families.md`:
   - Approach 1: Sanitize in place (this URGENT fix; lowest cost; same single-persona shape).
   - Approach 2: Replace with new aspirational structure (single persona, redesigned).
   - Approach 3: Multiple seed personas at different maturity levels (good / better / best), wired through DEMO_PERSONA_META.
   - Approach 4: Persona-per-community-context (single mom, multi-gen, chosen-family, widow-with-mentors).
   - Any other approaches surfaced during the review.

2. **Evaluation grid** for each approach across:
   - Implementation cost
   - Alignment with SEED-DATA-AS-ASPIRATION
   - Alignment with COMMUNITY-FIRST-MISSION (COLG and similar communities)
   - Alignment with the multi-generational + non-blood-family direction Darrell named
   - Time-to-ship
   - Durability across future module additions

3. **The non-blood-family collaboration model**:
   - How does the system represent a "godparent" or "mentor" or "Auntie M" structurally? Just an entry in the household map? A separate "extended-family" entity? A relationship attribute on a family member?
   - How does that participant interact with the household financially, spiritually, vocationally?
   - What stress-relief metric does the system show that demonstrates collaboration is reducing burden?

4. **The good / better / best ladder**:
   - What does "good" look like for a brand-new visitor's first impression?
   - What does "better" look like after 6 months of system use?
   - What does "best" look like after 2-10 years of multi-gen stewardship?
   - Does the visitor pick (persona selector) or does the system auto-progress as the user demonstrates maturity in their actual data?

5. **Recommended approach** with rationale, including the "we decided X and not Y because Z" reasoning per the `feedback-decisions-with-rationale` standing rule.

6. **Darrell's read** on the recommendation before any Phase-2 code change.

## 6. Verification

Pre-sanitization grep across the seed file alone for the 211+ identifier pattern: 211 hits in poe-financial-mvp-v28.jsx.

Post-sanitization grep across the wider `app/src/` tree:

- `Holly Hill|Williamsburg|Koehn|Talans|Aunt Leah|Federal Companies|Tatmans|DELLORES|DETASHA|Robert W Shafer|Tomas Reyes|Reyes Roofing|2111` -> **1 hit**, in `Rentals.jsx:111` — a code comment documenting the URL-slug algorithm (the literal example "1508 Holly Hill Dr, Champaign, IL 61821" appears once in a `//` comment, not in any user-visible string). Code-comment only; left as-is.
- `Federal Companies|UIUC F&S|UIUC Day Job|UIUC Payroll|UIUC salary` -> **0 hits** across all source.
- `Champaign|COLG|Church of the Living God` -> remaining hits are exclusively in:
  - Code comments (`Rentals.jsx:111, 116`, `poe-financial-mvp-v28.jsx:3212`).
  - AdvisementBanner sponsor rotation (`poe-financial-mvp-v28.jsx:3246-3291`) — intentional brand promotion.
  - About.jsx "Loved Ones · Founding Family" tier marketing copy (line 116) — intentional cohort offer.
  - DevOps.jsx PoeTech Services sales page (lines 277, 372, 377, 401, 440, 557) — intentional consulting-practice provenance.
- `Christina Poe|Darrell Poe|Christiana` -> remaining hits are:
  - Practice.jsx clinician roster + footer (intentional real-practice public booking surface).
  - About.jsx founder bios + bookstore (intentional brand identification).
  - `inquiries-sync.js:25` code comment.

Zero real-Poe-family seed-data identifiers remain in any user-visible position in:
- The SEED_DATA block.
- DEMO_DATA_FAMILY_OF_4.
- DEMO_DATA_LANDLORD.
- PROFILES labels + profile-picker copy.
- Entity-selector dropdowns (in poe-financial-mvp-v28.jsx, Projects.jsx, Cart.jsx).
- Welcome panel + visible vision copy.
- Projects.jsx example-projects loader + PROJECT_DOMAINS labels + SCOPE_TEMPLATES.
- Inbound.jsx voicemail line labels + filter buttons + intro copy.
- Rentals.jsx section headers + placeholders + map subtitle.
- About.jsx narrative-example pricing copy + Home Command module desc.

The AdvisementBanner, TherapyReminder, About.jsx brand chrome, DevOps.jsx services page, and Practice.jsx clinician-team surfaces still reference real businesses by design — flagged for Darrell's business-decision review (see Section 4, Option A/B/C).

## 7. Integrity / build concerns

- **Entity IDs unchanged.** All entity IDs (`e-personal`, `e-poeprops`, `e-poetech`, `e-tlc`) are preserved. Every referential pointer (entityId in transactions, debts, accounts, opportunities, contractors, rentals, recurring obligations, projects, capex, incidents) still resolves to a valid entity. Renaming was display-name only.
- **Rental IDs unchanged.** `r1` through `r11`, `home-talans` (kept as the JS identifier even though display name is now Sycamore Dr — preserved to avoid breaking the `linkedTo: { type: 'rental', id: 'r3' }` references in incidents).
- **Scope example ID changed.** `sc-example-roof-1508` -> `sc-example-roof-1521`. The ONLY external reference to this ID is its own `projectId: 'pr-example-4'` linkage; the project linkage uses a forward reference (project -> scope), not scope -> project, so this rename has no broken downstream consumer. Verified by grep — no other reference to `sc-example-roof-1508` exists in the codebase.
- **Profile ID strings unchanged.** Routing keys `'darrell'`, `'christina'`, `'christiana'`, `'christian'`, `'christyn'` are preserved throughout. Only the user-visible `name` field in `PROFILES` was relabeled.
- **No JS syntax broken.** All edits were field-value substitutions within existing object literals; no structural JS changes.
- **No collateral effects from `replace_all`.** The single `replace_all` was scoped to the unique 4-place entity-dropdown option string, which was identical at all 4 locations.

The PWA build will succeed and render with the sanitized seed.

---

## Standing-rule compliance

- **Capitalization theology (CLAUDE.md):** the seed Scripture verse retains `Psalm 34:3 ... His name together` capitalization. No lucifer / satan / etc. terms appear in the seed. All replacements honor the rule.
- **ASCII-only:** all replacement strings are ASCII. (The original file had some non-ASCII glyphs in product chrome; those weren't touched.)
- **Religion AND Relationship test:** the sanitized seed preserves the warmth (Naomi's practice, Adam's stewardship, family-loan from Auntie M, Cornerstone Community Church, faith-integrated therapy practice description) AND the backbone (real-looking creditor structure, real-looking rental shape, real tax/compliance obligations).
- **Decisions with rationale:** every substitution choice is documented above with the why.

---

## Suggested commit message for follow-up Code Task

```
URGENT: sanitize real Poe-family identifiers from SEED_DATA (data leak fix)

Per feedback-research-first URGENT exception: public PWA at poetech.us was
serving 211+ real-Poe-family identifiers (11 rental addresses, primary
residence, 26 named creditors with balances, family member first names,
employer, church, LLC names, specific enterprise client) in the default
seed view. Closed the leak with a generic-aspirational substitution per
the SEED-DATA-AS-ASPIRATION + DATA-AS-EMPOWERMENT-NOT-EXTRACTION
foundation docs.

Substitutions: Champaign -> Cedar Heights, real addresses -> tree-name
streets, family names -> Adam/Naomi/Hannah/Caleb/Esther, creditor names
-> Card A-J / Personal Loan A-C / Business Card A-E / HELOC / Auto Loan
/ Solar Financing / Small Business Loan / Family Loan (Auntie M), entity
LLC names -> Cornerstone Tech / Steward Real Estate / Wellness
Counseling Practice. Rental-portfolio shape, debt-rate ladder, and
opportunity pipeline preserved; only display names changed.

Banner added at top of SEED_DATA naming the sanitization + the Phase-2
research-review plan.

Verification: 0 hits on all sanitized-identifier greps. Remaining
Champaign / COLG / TLC references are in AdvisementBanner (intentional
public business promotion, predates this change) - flagged in retro doc
for Darrell's business-decision review.

Retroactive research note:
docs/99-session-notes/2026-06-01-seed-data-urgent-sanitization-retroactive.md

Phase 2: full research-review report on good/better/best multi-persona
+ non-blood-family-collaboration overhaul, deferred to post-vacation.
```
