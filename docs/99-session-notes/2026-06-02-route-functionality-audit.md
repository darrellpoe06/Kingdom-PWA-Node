# Route Functionality Audit -- Personas x Tiers x Tabs x Sub-tabs

**Date:** 2026-06-02
**Trigger:** Production white-screen reports from Darrell (incognito, family-of-4 demo, Foundation tier):
- Books -> Debts -> white screen
- Projects -> Inventory - Capital Forecast -> reported white screen
**Standard:** EXECUTION-OUTCOME-OBSERVABILITY -- surfaces that look reachable but crash silently.
**Method:** Live audit driving the dev bundle (vite, localhost:5173) via the preview tool. Each
cell navigated and its rendered state read from the DOM. A full crash unmounts the React root
(rootLen 0) or, after this task, trips the new ErrorBoundary card.

---

## Root cause found (and fixed)

### Books -> Debts white screen -- CONFIRMED + FIXED

- **Crash:** `TypeError: Cannot read properties of undefined (reading 'toFixed')`
  in `app/src/components/Debts.jsx:105` -- `d.rate.toFixed(2)`.
- **Why:** The four demo personas seeded their debts with an `apr` field, but the entire app
  (seed data, snowball engine `projectDebtSnowball`, `debts-sync.js` DB mapping, and the Debts
  component) uses `rate`. So `d.rate` was `undefined` for every demo persona, and
  `undefined.toFixed()` threw on first render of the Debts sub-tab.
- **Blast radius:** ALL four demo personas (family-of-4, separated, professional, landlord), at
  EVERY tier (Debts is a Foundation-tier surface). Because the app had no error boundary, the
  throw unmounted the whole tree -> blank white screen with no recovery.
- **Fixes shipped:**
  1. Data: renamed `apr` -> `rate` on all 5 demo debt seed rows
     (`poe-financial-mvp-v28.jsx:450,451,551,632,708`). Restores correct field AND correct
     snowball math (interest was silently computing as 0 with the missing rate).
  2. Hardening: `Debts.jsx` now routes every rate render through a `pct()` helper that coerces
     to a number and renders `0%` when absent, so a malformed debt record can never white-screen
     the tab again.
  3. Observability: added a top-level `ErrorBoundary` (`app/src/components/ErrorBoundary.jsx`,
     wired in `main.jsx`). Any future throw anywhere in the tree now degrades to a visible,
     recoverable error card instead of a silent white screen.

### Projects -> Inventory - Capital Forecast -- NOT REPRODUCED

Could not reproduce a white screen on this surface in any persona x tier combination, with
inventory EMPTY (all four demo personas ship `capexItems: []`) or POPULATED (added a live item
through the form -- rendered the 12-month forecast and item list cleanly, no crash).
`ProjectInventory` already carries defensive defaults on every prop.

**Most likely explanation:** it was a downstream symptom of the Debts crash. With no error
boundary, once Books -> Debts threw, the entire React root was unmounted and stayed blank; a
subsequent click on Projects -> Inventory would show the same white screen because the app was
already dead. After this task's Debts fix + ErrorBoundary, this path is verified clean and any
residual crash would surface as the visible error card rather than a blank screen.

**Open question for Darrell:** if Inventory still shows blank after the deploy, capture the exact
tier + persona + whether anything was clicked just before -- the ErrorBoundary will now print the
error message in its "Technical detail" panel, which pins the cause immediately.

---

## Matrix -- data-driven crash sweep (all 4 personas at Business tier, everything unlocked)

Business tier inherits every view, so a sweep here exercises each tab against each persona's real
data shape -- the dimension that drives crashes.

| Tab / Sub-tab                  | family-of-4 | separated | professional | landlord |
|--------------------------------|:-----------:|:---------:|:------------:|:--------:|
| Big Picture                    | OK | OK | OK | OK |
| Books                          | OK | OK | OK | OK |
| Books > Entities               | OK | OK | OK | OK |
| Books > Accounts               | OK | OK | OK | OK |
| Books > Debts                  | OK | OK | OK | OK |
| Books > Tx                     | OK | OK | OK | OK |
| Books > Imported               | OK | OK | OK | OK |
| Books > Cart                   | OK | OK | OK | OK |
| Books > 1099s                  | OK | OK | OK | OK |
| Books > Calendar               | OK | OK | OK | OK |
| Books > Legal                  | OK | OK | OK | OK |
| Real Estate                    | OK | OK | OK | OK |
| Projects                       | OK | OK | OK | OK |
| Projects > Projects - Timeline | OK | OK | OK | OK |
| Projects > Scopes - Agreements | OK | OK | OK | OK |
| Projects > Inventory - Capital Forecast | OK | OK | OK | OK |
| Practice                       | OK | OK | OK | OK |
| Dev/Ops                        | OK | OK | OK | OK |
| About                          | OK | OK | OK | OK |
| Church                         | OK | OK | OK | OK |
| Markets                        | OK | OK | OK | OK |
| Inbound                        | OK | OK | OK | OK |

No crashes, no white screens, no console errors on any cell after the fix.

## Matrix -- tier-gating sweep (family-of-4, gating is data-independent)

| Tab          | foundation | poetech-plus | family (Household) | premium | business |
|--------------|:----------:|:------------:|:------------------:|:-------:|:--------:|
| Big Picture  | OK    | OK    | OK | OK | OK |
| Books        | OK    | OK    | OK | OK | OK |
| Books > Debts| OK    | OK    | OK | OK | OK |
| Real Estate  | OK (preview) | OK (full edit) | OK | OK | OK |
| Markets      | OK    | OK    | OK | OK | OK |
| Church       | OK    | OK    | OK | OK | OK |
| Dev/Ops      | OK    | OK    | OK | OK | OK |
| About        | OK    | OK    | OK | OK | OK |
| Inbound      | OK    | OK    | OK | OK | OK |
| Projects     | gated | gated | OK | OK | OK |
| Practice     | gated | gated | gated | OK | OK |

Gating matches `VIEW_TIER_REQUIREMENTS` exactly: Projects unlocks at `family`, Practice at
`premium`, Real Estate flips preview -> full-edit at `poetech-plus`. Every gated cell shows the
upgrade prompt -- none crash.

---

## Tallies

- Personas audited: 4 (family-of-4, separated, professional, landlord)
- Tiers audited: 5 (foundation, poetech-plus, family, premium, business)
- Distinct tabs: 10 main + 12 sub-tabs (9 Books, 3 Projects)
- Business-tier crash sweep: 22 cells x 4 personas = 88 cells -> all OK
- Tier-gating sweep: 11 tabs x 5 tiers = 55 cells -> 4 gated (correct), 51 OK, 0 crash
- White-screen crashes found: 1 root cause (Books > Debts), fixed
- White-screen crashes remaining: 0

---

## Polish issues (NOT crashes -- deferred, not fixed in this task)

- Demo personas ship `capexItems: []`, so Projects -> Inventory - Capital Forecast renders an
  empty 12-month forecast with no inventory items. It does not crash, but a first-time viewer on a
  demo persona sees an empty forecast table. Consider seeding 1-2 sample capex items per demo
  persona so the surface tells a story on first paint (per SEED-DATA-AS-ASPIRATION).
- Same for Real Estate on non-landlord personas (no rentals) and Practice on non-professional
  personas -- they render valid empty states, just sparse. Not bugs; aspirational-seed polish.

These are separate work, intentionally not bundled into the crash-fix task.
