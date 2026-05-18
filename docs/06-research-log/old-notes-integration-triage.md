# Old Notes → MVP Integration Triage

**Date:** 2026-05-17
**Scope:** Three priority buckets from `drive-download-20260517T042203Z-3-001/` and root-level docs:
1. `Copy of The Real Estate App.docx` (root)
2. `Poe_Family_Financial_Control_System_v1(4).xlsx` (latest of 5 copies)
3. `Darrell_Tech_Tools_Priority_List.xlsx`

**Target:** `app/src/poe-financial-mvp-v28.jsx` (current MVP) — labeled `PoeTech Family OS — Financial Control System`.

**Quality bar applied to every integration:** WCAG 2.1 AA (DOJ ADA Title II final rule cites this standard; deadlines roll through April 2027). The MVP already uses `<label>` patterns and visible focus rings on most fields; new additions inherit the same pattern.

**Cost discipline:** Zero new paid services. All adds use libraries and patterns already in the bundle (React state, Nominatim, Leaflet, local IndexedDB). No vendor lock-in introduced.

---

## A. Real Estate App (root .docx, 2019-era idea)

### Already present in v28 — no work needed

| Old-note feature | Where it already lives in MVP |
|---|---|
| Property profile (address, city, state, zip, type) | Rentals form, `data.inflows.rentals[*]` |
| Map of properties (Zillow-style) | Leaflet + OpenStreetMap tile layer (free) in Rentals |
| Address autocomplete | Nominatim debounce in Rentals form |
| Maintenance / repair log | `r.maintenanceLog[]` with photos + cost |
| Tenant & vendor conversation log | `r.conversationLog[]` |
| Photos / receipts upload | `compressImageFile` → JPEG data URLs, ~80–200 KB each |
| Date & timestamp on every entry | Built into every log entry |
| Mortgage / cap rate / cash-on-cash / DSCR / 1% rule / GRM | Live "Auto-Evaluator" panel in Rentals |
| Property type incl. primary-home / vacation / land | Existing `propertyType` enum |
| Status (paying, late, vacant, rehab, for-sale, etc.) | Existing `status` enum |

### Integrate now — high value, low cost, fits the family Financial OS

1. **Lease record per property** (`r.lease`): `start`, `end`, `monthlySent`, `deposit`, `lateFeePolicy`, `signedDocURL`. Replaces "Digitally Signed Lease" — instead of in-app e-signature (which would require DocuSign/HelloSign $$$), we record the lease metadata and let the user attach a scanned PDF/photo. Zero ongoing cost.
2. **Tenant contact block** (`r.tenant`): `name`, `phone`, `email`, `moveIn`, `emergencyContactName`, `emergencyContactPhone`. Replaces the multi-role Tenant profile from the old doc — we don't need separate user accounts for a family-internal tool.
3. **Mechanical / equipment inventory per property** (`r.equipment[]`): `category` (HVAC, water heater, appliance, panel, roof, etc.), `make`, `model`, `serial`, `installDate`, `warrantyEnd`, `notes`. Drives warranty reminders later via the existing events array.
4. **Room-by-room "Needed Work" tracker** (`r.rooms[]`): `name` (Living Room / Kitchen / Master Bedroom / custom), `items[]` (Cabinets / Windows / Furnace / Plumbing / Flooring / custom), each item has `status` (good / needs-work / quoted / scheduled / done) and `notes`. This is the spine of the old Real Estate App and the cheapest version of "house condition tracking."
5. **Contractor bid breakdown on maintenance entries** (`maintEntry.quote` + `maintEntry.actual`): `{labor, materials, tax, serviceCall, warranty, other}`. Lets the family compare quotes apples-to-apples; "Bid accepted" simply means promote a `quote` to `actual`. No payment processing — record-keeping only.

### Discuss before building — the SaaS / marketplace pieces

These were written for a *public platform* with thousands of landlords and tenants. The current MVP is a *family Financial OS*. Worth doing one day, not now:

| Old-note feature | Why park it |
|---|---|
| Multi-role user profiles (Tenant / Landlord / Contractor / Realtor / Home Owner) | Requires auth, RBAC, multi-tenancy DB. Real spend: $0 with Supabase free tier but the *complexity* spend is large. Belongs in a separate module (`02-modules/real-estate-platform/`) when we're ready to serve outside families. |
| Digital lease signing (one-click agreement) | Legally binding e-sig means DocuSign API ($10–25/mo per seat) or HelloSign ($15/mo) or rolling our own with notarization risk. Workaround: upload a scanned signed PDF — covered above in Lease record. |
| AR room measurement ("walk in each room, take a picture, get dimensions") | Requires WebXR + LiDAR or paid CV API. Cool, costly, not in critical path. |
| In-app payment processing (Cash App / PayPal / Credit Card to pay contractors or collect rent) | Stripe Connect onboarding is real engineering + KYC compliance + 2.9% + $0.30. Tenants already pay you via Zelle (zero fee). Don't add a fee surface where there isn't one. |
| 5-star ranking of tenants/contractors visible to "website owner" | Fair-housing / FCRA liability magnet on a SaaS. Personal notes already covered by conversationLog. |
| AI in the app | Vague. Defer until a concrete job-to-be-done shows up (e.g., "auto-extract receipt totals from a photo" — solvable with Tesseract.js client-side, free, when needed). |

### Drop / supersede

| Old item | Reason |
|---|---|
| "Like myfitnesspal for real estate" framing | The MVP is a private operations system, not a habit tracker. The metaphor confuses scope. |
| Google Forms rental application link | The MVP already has `Practice` and inquiry forms; rental application can be a simple structured form *inside* the app later — keeps data sovereign rather than sitting in a third-party Google account. |

---

## B. Poe Family Financial Control System v1 (xlsx)

The spreadsheet is the *spec* for the current MVP; almost every concept is already in the React app. What remains:

### Already present
- Dashboard live snapshot (totals, weighted interest, rent collection rate) → `totals` memo
- Inflows (salary + 11 doors of rent) → `data.inflows.salaries`, `data.inflows.rentals`
- Outflows category buckets → `data.outflows`
- Debt avalanche/snowball/cash-flow strategies side-by-side → `Debts` view with three sort options
- Pressure slider 1–10 with stress descriptors → `data.pressureMappings`, slider in Big Picture
- Mortgage payoff scenarios (5-yr / 10-yr) → `projectRentalSnowball` + strategy comparison
- Buffer Fund / mortgage-protection float → `data.meta.bufferTarget` + reserves math
- Opportunities matrix by family skill → `data.opportunities`

### Integrate now — bring the spreadsheet's remaining data into the app

6. **Buffer Fund progress widget** on the Big Picture dashboard. The spreadsheet has `bufferTarget=5000, bufferCurrent=0`, target ROI = "single highest move you can make right now." The number lives in `data.meta.bufferTarget` already but isn't displayed. One small card + editable current-balance input.
7. **Daily Cash-Flow projection** — already partially served by `BooksTransactions`, but the spreadsheet's strength is the *running balance* column. Add a "Running balance" column to the transactions list when sorted by date, single account. (Optional — flag for v29 if scope tight.)

### Discuss
- Pulling actual Chase transaction history from the spreadsheet's DailyCashflow sheet into seed transactions. Mechanically easy; do you want every May 2026 transaction seeded, or keep the seed minimal? **Recommendation:** keep seed minimal; the spreadsheet stays as the import source and you paste in via CSV later.

### Drop / supersede
- Multiple `Copy of Poe_Family_Financial_Control_System_v1(1..4).xlsx` duplicates — pick v(4) as canonical, archive the rest. Already done effectively by reading the latest.

---

## C. Darrell Tech Tools Priority List (xlsx)

Small sheet: 4 items (UniFi Cloud Gateway Max, Adjustable Bed, Klein Cable Tester, NVMe SSD) plus a Purchase Tracker tab.

### Integrate now

8. **Capex / Tools list as a typed array** (`data.capexItems[]`): `category`, `name`, `description`, `link`, `priority` (1–5), `cost`, `neededBy`, `status` (planned / researching / wishlist / on-hold / purchased), `notes`. Surfaced as a small section under the **About / Capital Spend** area (or a Books sub-tab if you prefer). Purpose: stop maintaining the spreadsheet separately. Already 4 items pre-loaded from the sheet.

### Drop / supersede
- The standalone Purchase Tracker tab — once items move to `status='purchased'`, they roll up automatically; no separate tab needed.

---

## Summary — what gets built in this pass

| # | Item | Where | Risk | A11y impact |
|---|---|---|---|---|
| 1 | Lease record per property | Rentals form + per-property block | Low | New labels, no color-only meaning |
| 2 | Tenant contact block | Rentals form | Low | tel:/mailto: links, keyboard reachable |
| 3 | Mechanical equipment inventory | Per-property records drawer | Low | Table semantics, header row |
| 4 | Room-by-room Needed Work tracker | Per-property records drawer | Med | Status uses text + icon, not color alone |
| 5 | Contractor bid breakdown on maint entries | Maintenance form | Low | Numeric `<label for=>` pairs |
| 6 | Buffer Fund widget on Dashboard | `BigPictureDashboard` | Low | Live region for updates |
| 7 | (Optional) running balance in BooksTransactions | `BooksTransactions` | Low | — |
| 8 | Capex / Tech tools list | About > Capital Spend section | Low | Existing patterns |

**Total estimated lines changed:** ~400–500 net additions, no deletions of working code.
**New paid dependencies:** none.
**Defer-with-reason:** marketplace features (multi-role auth, e-sig, payments, ratings, AR). See section A.

---

## Addendum (2026-05-17) — Round 2 additions actually shipped

### What landed in this session beyond the original triage

1. **Markets tab** with a free, no-API-key stock-ticker watchlist (Stooq CSV). Anyone adds the tickers they care about; auto-refreshes every 60s. Day change is shown with text + symbol + color (not color-only) so screen readers and color-blind users get the same signal. Pre-seeded with SPY · QQQ · DIA · BTCUSD.
2. **Dashboard cross-reference strip** — pulls live counts from Real Estate (room items needing work, equipment tracked, leases ending in 60 days), Capex (open spend + P1 count), and the Markets watchlist into one glanceable row on the dashboard. Every cell is a button that jumps to the source view. No duplicated state — every number is computed from the existing single source of truth.
3. **Two new theme presets** styled to feel familiar on the two phone ecosystems most users come from, *without naming the brands*. "Snow" is a clean off-white surface with near-black text + soft gray dividers (≥15.5:1 contrast, well past WCAG 2.1 AA). "Glacier" is a cool blue-tinted surface with a blue accent (≥13:1 contrast). The default Midnight (OLED black) is untouched per request.
4. **Tap-target + accidental-tap hardening pass** across all destructive buttons (Maintenance log, Conversation log, Calendar recurring/incidents/events, Equipment, Rooms, Capex, Markets, ProjectConversationLog, Practice notes). Minimum 36×36 px hit area, `aria-label`, hover-state border, focus outline, and a vertical divider separating destructive from primary in every shared row.

### Future-module hooks intentionally left in the data shape

To avoid migration pain when later modules ship, items added this session carry optional fields keyed to future modules:

| Item | Hook field | Future module that will consume it |
|---|---|---|
| `capexItems[*].entityId` | string | All — same entity filter pattern the books use |
| `capexItems[*].module` | slug | `home-command` · `practice-ops` · `elder-care-coord` etc. — each module filters its own roadmap |
| `rentals[*].lease` | object | `marketplace` · `elder-care-coord` |
| `rentals[*].equipment` | array | `home-command` (sensor pairing, warranty alarms) |
| `rentals[*].rooms[*].items` | array | `home-command` (per-room sensor map, maintenance scheduling) |
| `rentals[*].tenant` | object | `marketplace` (lead → tenant lifecycle) |
| `watchlist` | string[] | A future `investing` module (advanced charts, alerts) |

All fields are optional. Existing data without them keeps working. New modules just `.filter(x => x.module === 'their-slug')` and own the slice without us migrating anything.

---

## C2. Audience-feature scan — what adjacent / community apps do that fits SKOS users

Drawn from the project goals + audiences encoded in the **Dev/Ops** view and the **Markets We Serve** list in About. Each row names what an audience uses today, what existing PoeTech surface area already covers it, and the cheapest sensible add. Free / low-cost first; nothing here adds a paid dependency unless flagged.

| Audience (from About) | Already covered today | Worth adding (sustainable / low-cost) | Defer / discuss |
|---|---|---|---|
| Adult children caring for aging parents | Calendar, scope-of-work, multi-entity books, conversation logs | **Shared-care timeline view** across siblings (read from existing events). **Power-of-Attorney / advance directive document URL** on the Entity record (one field). | Full sibling auth + permissions = the `elder-care-coord` future module |
| Kinship / foster caregivers (grandparents raising grandkids) | Practice Operations, calendar, scope | **Court date event category** with reminder, **agency contact card** under Entity, **document URL list** per child entity | Case-management database integration |
| Reentry / formerly incarcerated families | Foundation tier + debt snowball | **Fresh-start debt page** (already implicit in debt snowball) — add a "starting over" preset (pressure=5, snowball=0) so the page feels designed for them | Resource directory needing curation |
| Single-parent small business owners | Books, debts, Practice, scope tool | **Quarterly-tax estimator** on Books (compute from YTD income at current bracket — uses data already there) | Full tax filing integration |
| Small Black-owned contractors | Scope tool, books, 1099 tracking | **Contractor "send to client" share link** that exports a scope-of-work as a printable HTML page — uses existing scope object, no new storage. **Per-job profitability view** computed from existing scopes + transactions | Insurance / bond marketplace |
| Independent farmers / homesteaders | Real Estate (property + equipment + rooms), calendar | **Seasonal recurring obligations preset** ("spring fertilizer," "fall mortgage check-in") — just extends `recurringObligations` with a `season` field | USDA / Farm Service Agency integration |
| Small churches / ministries | Calendar, Practice Operations workflow, conversation logs | **Donation log** as a new transactions category (already supported, just surface a filter) — replaces lightweight church-bookkeeping SaaS | Full donor management = separate module |
| IEP / disability-advocate families | Calendar + Practice Ops + scope | **IEP meeting event category + document URL** field — both ride existing event / lease-style hooks | Full IEP authoring tool |
| Direct-care workers / gig economy | Foundation tier + Premium | **Mileage tracker** as a transactions sub-type (just a category) — start as manual; later, optional geolocation | GPS-based auto-tracking (privacy + battery cost) |
| Markets / investing-curious | New Markets tab (this session) | **Watchlist alert chip** ("AAPL down 5% today") — computed in-browser, no push service needed. **Portfolio cost-basis** as an optional field per ticker. | Brokerage account integration ($$, KYC, regulatory) |

### Features I'd add to *every* family-OS app in this category, sustainability-first

These are cross-cutting wins suggested by what other community apps offer — none cost ongoing money:

1. **Receipt OCR** with Tesseract.js (browser-side, free) — auto-fills the maintenance / transaction amount from a photo. Already have photo upload; this just adds parsing.
2. **CSV import** from bank exports (one button on Books → Transactions). Most users have a CSV from their bank monthly. Saves manual entry.
3. **PWA install prompt** — already present (`InstallPrompt`), but could be more aggressive after 2 visits for users who'd benefit.
4. **Print stylesheet** for the Dashboard, Books, and Rentals — already partially there (`print:hidden` on header). Useful for monthly money-date packets and tax-time printouts. Zero cost.
5. **Export-to-spreadsheet** button on every list — users can hand a CSV to their accountant. Pure browser code, no server.
6. **Watchlist alerts** without push — render an in-app red dot on the nav tab when a watchlist ticker breaks a threshold. No service worker push, no fees.
7. **Multi-entity dashboard switcher** — already supported via `entityRollups`; one keyboard shortcut to cycle would help power users.
8. **Spanish copy fallback** — the markets audience overlaps with many bilingual households. Single JSON of strings, swap based on `navigator.language`. Open to community translation contributors.
9. **Apprenticeship / kid-budget view** (already in Opportunities for the Twins) — a stripped-down view of "your money" for a child or apprentice user. Promotes the literacy / education-justice module without waiting for that module to ship.
10. **Sponsorship-progress widget** on About — when sponsorship revenue funds Community-tier families, show the running count and impact. Already in scope per the Community Partnership section; this just surfaces it as a number.

### Sustainability check on this addendum

Net new paid dependencies if everything above ships: **zero**. Stooq is free. Tesseract.js is open source. CSV/print/export are native browser primitives. The only watch-out is rate-limiting on free public APIs — caching the watchlist response for 60s (which we already do) keeps us inside Stooq's polite-use envelope.
