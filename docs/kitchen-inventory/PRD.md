# Kitchen Inventory — Product Requirements (PRD), DB Schema & UX

**Product:** PoeTech Kitchen Inventory — a chef/restaurant/kitchen inventory app
**Sponsors:** Darrell Poe (governs) + Chef Mario (domain owner)
**Status:** Increment 1 shipped (this PR); roadmap below
**Date:** 2026-06-26
**Built on:** the PoeTech PWA's shared primitives — this is a *vertical on the inventory-control system of record*, not a greenfield app.

---

## 1. Overview

Chef Mario asked for a mobile-first app that **simplifies inventory for a busy
kitchen**: organize items by category, count weekly/monthly by **weight or
unit**, compare current vs previous counts, see **value / food cost / usage /
variance**, get **alerted when something runs low**, and export reports — with
**barcode scan, fast search, multi-location, multi-user permissions, and cloud
sync**, behind a clean, simple interface.

The senior design decision: **do not rebuild what PoeTech already has.** The
platform already runs a real inventory *system of record* where **on-hand is
derived from an append-only movement ledger** (never a typed number), with
versioned items, cross-device sync, role/tenant scoping, unit-conversion math,
on-device OCR, and a voice layer. Kitchen Inventory is the **chef-domain vertical
on that base**. That is why increment 1 is small, real, and trustworthy rather
than a thin mock of a big surface.

### Placement & modularity (Darrell, 2026-06-26)

Kitchen Inventory is **homed inside Chef's Corner** — recipes and inventory
together — as Chef's Corner's stewardship sections (**Recipes · Kitchen
Inventory · Recipe Costing**), gated to inventory stewards. It is built as a
**clean, configurable module** (`components/KitchenInventory.jsx`) that takes a
`config` of taxonomy + copy (default `KITCHEN_CONFIG`) and renders the same
Stock + Counts workflow for **any** context, so the *same* module can surface
elsewhere later — e.g. church AV gear or business assets — with a different
config (categories/areas/units/copy), same derived-on-hand + variance engine.
It is mounted by a **dynamic import** (a runtime mount, not a static
feature-to-feature coupling — `module-boundary-guard`), so its chunk stays split
and loads only when the Kitchen tab opens. **Recipe Costing** ties the Chef's
Corner recipes *directly* to the kitchen's real item costs (see §3.2).

### Design principles (inherited, binding)

- **Derived, never painted.** Every on-hand and dollar figure is computed from
  the ledger. A count *reconciles* the ledger; it is never a parallel truth.
  (Reality-Trace, DR-0061; Verification Doctrine, DR-0076.)
- **Money stays the owner's hand.** This tracks **cost and value**; it never
  processes a payment or moves money.
- **Honest uncertainty.** Unknown conversions, missing sales for food-cost % →
  return *null* and say so, never fabricate a number.
- **Reuse one primitive per axis** (icons, theme tokens, text-size, sync, roles)
  — consistency-guard + contrast-guard enforce it.
- **Unbreakable basics.** Section error boundary, optimistic-local-then-cloud,
  offline-first, keyboard-operable, large-print scalable, WCAG 2.1 AA per theme.

---

## 2. Users & personas

| Persona | Need | Primary surfaces |
|---|---|---|
| **Executive Chef / Owner (Mario)** | The whole picture: value, food cost %, variance trend, what to order. Governs the catalog + costs. | Dashboard, Stock, Counts, Reports |
| **Sous / Kitchen Manager** | Run counts, manage par levels, receive deliveries, reconcile. | Stock, Counts, Receiving |
| **Line cook / Prep / Counter** | Fast hands-free counting on a phone in the walk-in; daily prep list. | Counts (count sheet), Prep list |
| **Multi-unit operator** | Same catalog/standards across locations; compare units. | Locations switch, Reports |

**Roles map to the platform's unified role model** (instance-scoped:
owner / admin / member). Increment 1 gates the surface to **family/governor**
(owner/admin/member of the instance); finer kitchen roles (manager / staff /
counter) are a roadmap refinement of the same role primitive, not a new system.

---

## 3. Feature list with acceptance criteria

Legend: **[1]** = in increment 1 (this PR) · **[R]** = roadmap.

### 3.1 Core inventory

- **[1] Categories.** Items organize by standard kitchen categories (proteins,
  produce, dairy & eggs, dry goods, frozen, beverages, bakery & baking,
  condiments & sauces, spices & seasonings, paper & disposables, cleaning &
  chemicals, smallwares & equipment).
  *AC:* category is selectable on add/edit, filters the Stock list, and rolls up
  in reports.
- **[1] Storage areas.** Items live in an area (walk-in cooler, freezer, dry
  storage, the line, prep, bar). A count can be **scoped to one area**.
  *AC:* area is selectable; Stock filters by area; a count narrowed to "Walk-in"
  shows only walk-in items.
- **[1] Items / custom products.** Name, SKU/PLU, category, area, **stock unit**,
  **par level**, **unit cost**, optional opening count.
  *AC:* adding an item with an opening count posts a "Received" movement and
  on-hand reflects it immediately; duplicate SKUs are surfaced.
- **[1] On-hand + value (derived).** On-hand = sum of ledger movements; value =
  on-hand × unit cost.
  *AC:* on-hand is never directly editable; it changes only by posting a movement
  or closing a count.
- **[1] Counts by weight or unit.** Start a count, walk the shelf, enter what's
  physically there per item; the system shows **expected** (derived), **variance**
  (counted − expected), and **variance value** live.
  *AC:* a real count computes counted value, expected value, net variance, shrink,
  and overage; closing posts one `adjust` movement per off line so derived
  on-hand equals the counted reality. (Unit-tested end-to-end.)
- **[1] Compare current vs previous.** Closed counts list with each session's
  variance value; the newest count of a scope shows whether it **tightened** vs
  the prior count of the same scope.
  *AC:* two closed walk-in counts show a "tighter/wider than last time" delta.
- **[1] Low-stock (par) alerts.** Items at/below par are flagged on the
  dashboard and Stock list (OK / LOW / OUT).
  *AC:* an item whose on-hand ≤ par shows LOW; on-hand ≤ 0 shows OUT; the
  dashboard "Below par" count and reorder callout list them.
- **[1] Fast search + filters.** Free-text over name/SKU + category + area + a
  "below par only" toggle.
  *AC:* typing filters the list; filters compose.
- **[R] Barcode / PLU scan** via the device camera (no special hardware) — reuse
  the on-device OCR/scan pattern (`recipe-photo-import.js`, Tesseract + the
  `wasm-unsafe-eval` CSP already in place); map scanned code → item.
- **[R] Voice input for hands-free counting** — reuse the Voice layer
  (`voice-registry.js`): "twelve pounds chicken" → fills the count line.
- **[R] Export to PDF / Excel** — reuse the document/export capability; export a
  count sheet, a variance report, and an order list.

### 3.2 Chef-specific (Mario's standout list)

- **[1] Par levels + reorder flagging** (par = the item's reorder point).
  **[R] Automatic shopping list** from par gaps (order qty = par − on-hand).
- **[1] Recipe costing + menu profitability** — `lib/recipe-costing.js` joins a
  Chef's Corner recipe's ingredients to inventory item unit costs (reusing the
  dimension-aware `recipe-units` engine): per-batch + per-serving plate cost,
  **honest coverage** (an unmatched ingredient is flagged, never priced at $0),
  and an optional ephemeral menu price → **food-cost % + margin**. Surfaced as
  Chef's Corner's **Recipe Costing** section. Money stays the owner's hand (the
  menu price is a what-if, never stored). *AC:* a recipe with matched, costed
  ingredients shows a per-serving cost and coverage; an unmatched ingredient is
  listed as such; entering a menu price shows food-cost % + margin. (Unit-tested.)
- **[R] Vendor management + price tracking** — `vendors`, `vendor_prices`
  (history); show price trend per item; cheapest-vendor hint.
- **[R] Invoice scanning auto-updates inventory** — OCR a delivery invoice →
  proposed "Received" movements for review (never auto-posted).
- **[R] Expiration tracking + waste logging** — lot/expiry per receipt; a `waste`
  movement reason; waste $ in reports.
- **[R] Yield calculations** — trim loss / cooked yield / edible-portion %, built
  on the dimension-aware unit math (`recipe-units.js`).
- **[1] Inventory by storage area** (above). **[R]** richer per-area par + dual
  location stock split (already supported by the ledger's by-location derivation).
- **[R] AI suggestions** to reduce waste + improve ordering — from variance and
  usage history; advisory only (GOVERNANCE-EXECUTION-ADVISORY).
- **[R] Daily prep list** from on-hand vs par vs forecasted covers.
- **[1] Dashboard** — inventory value, below-par count, counts run / count in
  progress. **[R]** food cost %, top-used items, usage velocity.

### 3.3 Non-negotiables (Mario's platform asks)

- **[1] Multi-user with permission levels** — instance role model (owner/admin/
  member); RLS on every table. **[R]** kitchen-specific role tiers.
- **[1] Cloud sync** — every table syncs cross-device via the proven table-sync +
  realtime path; offline-first with optimistic local writes.
- **[R] Multi-location** — the instance/tenant model already scopes data per
  unit; the explicit location switcher + cross-unit compare is the roadmap step.

---

## 4. UX flows & screens

**Surface:** top-nav **Kitchen** tab (chef-hat icon), family/governor gated.
**Sub-tabs:** **Stock** · **Counts** (the `<TabScroll>` primitive).

### 4.1 Dashboard (always on top)
Four metric cells, all derived: **Items tracked · Inventory value · Below par
(+N out) · Counts run / Count in progress**. A reorder callout names the items
at/below par. A status banner reports the result of the last action.

### 4.2 Stock tab
- Toolbar: search · category select · storage-area select · "below par only" ·
  **+ Add item**.
- Add-item form: name, SKU/PLU, category, area, stock unit, par level, unit cost,
  opening count.
- Items table: Item (+ unit cost/unit) · Category · Storage · On hand · Par ·
  Status badge · Value. On-hand/value derived; footnote tells the user to run a
  count rather than edit a quantity.

### 4.3 Counts tab
- **No open count →** "Start a count" (scope = whole kitchen or one area, optional
  label) + **Past counts** list (variance value, line count, counted value;
  tighter/wider-than-last-time for same scope).
- **Open count → the Count Sheet:**
  - Header: label · scope · started · *N/total counted* · **Close & reconcile**.
  - Running totals: Counted value · Net variance · Shrink · Overage (live).
  - Row per in-scope item: Expected (derived) · **Counted input** (numeric,
    `inputmode=decimal`, weigh/count hint) · Variance · Variance value · ± badge
    (MATCH/OVER/SHORT). Entering a count snapshots expected on-hand + unit cost.
  - **Close** posts one `adjust` movement per off line into the append-only
    ledger and flips the count to *closed*; a banner reports adjustments posted +
    net variance.

### 4.4 Mobile-first
Single-column metric grid, horizontally scrollable sub-tabs, large tap targets,
numeric keypad for counts, rem-based chrome that scales with the global
large-print control.

---

## 5. Database schema

### 5.1 Reused from the inventory base (migration 0052)
The kitchen vertical **reuses these as-is** — no new item columns in increment 1:

- **`inventory_items`** — catalog. Kitchen meaning of existing columns:
  `category` = kitchen category id · `location` = storage-area id ·
  `unit` = stock unit · `reorder_point` = **par level** · `unit_cost` =
  valuation · `allow_negative` = consignment opt-in. (`slug`, `instance_id`,
  `created_by`, `active`, audit cols.)
- **`inventory_movements`** — append-only stock ledger (`in` / `out` / `adjust` /
  `transfer-out` / `transfer-in`). On-hand is derived from this. **Immutable** by
  DB policy (SELECT+INSERT only). A count's reconciliation posts `adjust` rows
  here; future receiving/waste/yield are new reasons on the same ledger.
- **`record_events`** — append-only edit history for item versioning.

### 5.2 New for kitchen counts (migration 0053)

**`inventory_counts`** — the physical-count session header.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| instance_id | uuid → instances | tenant scope (RLS) |
| created_by | uuid → auth.users | |
| slug | text | stable local id `count-…` (unique per instance) |
| label | text | e.g. "Weekly count" |
| storage_area | text | scope; null = whole kitchen |
| status | text `open`/`closed` | CHECK-constrained |
| counted_by | text | persona |
| note | text | |
| started_at / closed_at | timestamptz | closed_at set on reconcile |
| created_at / updated_at / updated_by | | updated_at trigger |

**`inventory_count_lines`** — one counted item within a session.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| instance_id | uuid → instances | RLS |
| created_by | uuid | |
| slug | text | `cl-…` (unique per instance) |
| count_slug | text | → inventory_counts.slug |
| item_slug | text | → inventory_items.slug |
| counted_qty | numeric | physically on the shelf, in count_unit |
| count_unit | text | the unit counted in |
| count_mode | text `unit`/`weight` | CHECK-constrained |
| expected_qty | numeric | **snapshot** of derived on-hand at count time |
| unit_cost | numeric | **snapshot** for valuation |
| counted_at / created_at | timestamptz | |

Indexes: per-instance, per `count_slug`, unique `(instance, slug)` and unique
`(instance, count_slug, item_slug)` so re-counting an item updates one row.

**RLS:** instance-scoped via `user_role_in_instance(instance_id) IN
('owner','admin','member')` for read/insert/update; counts DELETE = owner/admin;
count-lines DELETE = member (working data — the permanent record is the adjust
movements in the immutable 0052 ledger). No anon policy. Both tables added to the
`supabase_realtime` publication. Idempotent; applied by hand per the db-migrate gap.

### 5.3 Schema roadmap (not in increment 1)
`storage_areas` (per-area par), `vendors`, `vendor_prices` (history), `invoices`
+ `invoice_lines`, `item_lots` (expiry), `recipe_costs` (recipe↔item join),
`prep_lists`. Each follows the same instance-scoped RLS + realtime pattern.

---

## 6. Non-functional requirements

- **Offline-first / sync:** optimistic local writes; cloud insert/update best-effort;
  realtime refetch debounced; a failed upload never drops the local row.
- **Performance:** all math is pure and O(n) over movements/lines; the surface is
  lazy-loaded (own chunk) via the surface-mount registry.
- **Security / privacy:** RLS on every table; family/governor gate with a
  defense-in-depth locked fallback for deep-links; no anon access; no PHI; no
  payment flow. CSP already covers the OCR/voice roadmap.
- **Accessibility:** WCAG 2.1 AA on every theme (incl. midnight) — verified by
  contrast-guard; large-print via the text-size primitive; real
  button/select/input; labeled count inputs.
- **Consistency:** UiIcon (no emoji chrome), theme tokens, `<TabScroll>`,
  `<MetricCell>`, `<SectionTitle>` — verified by consistency-guard.
- **Resilience:** mounted in a `<SectionBoundary>`; defensive empty + unwired
  states; every feedback surface covered (feedback-area-guard).

---

## 7. What shipped in increment 1

Files: `lib/kitchen-taxonomy.js` (incl. `KITCHEN_CONFIG`, the module config),
`lib/kitchen-count.js`, `lib/kitchen-counts-sync.js`,
`lib/kitchen-count-lines-sync.js`, `lib/recipe-costing.js` (recipe ↔ item-cost
join), `components/KitchenInventory.jsx` (the config-driven reusable module),
`components/ChefCorner.jsx` (homes the module + the Recipe Costing section),
migration `0053-kitchen-inventory-counts.sql`, tests
`__tests__/kitchen-count.test.js` (incl. the end-to-end value/variance/reconcile
proof), `kitchen-taxonomy.test.js`, and `recipe-costing.test.js`.

**Placement:** mounted **inside Chef's Corner** (Recipes · Kitchen Inventory ·
Recipe Costing), steward-gated, via a dynamic import. The standalone top-level
Kitchen tab from the first increment was **retired** in favor of this home; the
shell still owns the inventory data + dispatchers and passes them down to Chef's
Corner. Reuses `inventory.js`, `inventory_items` / `inventory_movements`, the
table-sync layer, the role/tenant model, and the shared UI primitives.

**Apply on merge:** run `0053-kitchen-inventory-counts.sql` against the cloud
instance (Supabase Studio / db-migrate). The app runs device-local until applied;
once applied, count sessions sync cross-device.

---

## 8. Verification (Verification Doctrine, DR-0076)

- **Math:** 19 unit tests pin value, variance, shrink/overage, reconciliation,
  food-cost %, and an **end-to-end** test proving a real count computes
  value/variance *and* reconciles derived on-hand to the counted shelf.
- **Taxonomy:** 7 tests on category/area/unit mapping + count mode.
- **Gates:** lint, full vitest suite, `vite build`, consistency-guard,
  contrast-guard (per-theme incl. midnight), feedback-area-guard,
  module-boundary-guard, tab-overflow-guard — all green.
