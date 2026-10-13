# DR-0319 — A health log is hers alone, and no number in it is invented

- **Status:** accepted
- **Tier:** C — a new module, a new top-level surface, and three new tables that auto-apply on merge (DR-0084). Shipped behind `hold` until the Governor cleared it; the label was removed at his word, not by the lane.
- **Scope:** `app/src/lib/health-program.js`, `lib/road-to-150-program.js`, `lib/health-actions.js`, `lib/health-sync.js`, `lib/food-parse.js`, `lib/food-lookup.js`, `lib/juice-recipes.js`, `components/RoadTo150.jsx`, migrations `0164` (programs/weight/water), `0165` (food_entries), `0166` (food_library), tests `health-program.test.js`, `food-parse.test.js`, `food-lookup.test.js`, `juice-recipes.test.js`, `road-to-150-render.test.jsx`
- **Date:** 2026-08-31
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), NO-STATIC-DATA (DR-0121), REALITY-TRACE (DR-0061), PERPETUAL-IMPROVEMENT (DR-0075), RELEASE-TIERS, DRIVE-DONT-DELEGATE

## Directive

Darrell, across 2026-08-30/31, building his wife's weight-loss program into the app:

> *"PLANNED DATA and ACTUAL DATA must remain separate... Do not overwrite planned
> information when actual information is entered."*

> *"I can't put my food in here and I need to."*

> *"when I put a food in, I want it to find it from some data base online and give
> me the calories and protein in each food source I write and keep it stored so I
> dont have to keep looking for it."*

> *"Is this a real data driven health app documents my wife's daily life so she has
> metrics to use when she wants to adjust her behavior based on data?"*

## The decision, in four parts

### 1. Her rows are hers — the door AND the data

Every other instance-scoped table in this repo pools to the family: recipes,
projects and discussions are readable by any member. **A person's body weight is
not.** `0164`/`0165`/`0166` scope every row to `created_by = auth.uid()` for read,
write and delete. There is no member policy, no admin policy, no anon grant — an
instance owner cannot read these rows, and that is deliberate, not an oversight.

The first cut gated the ROWS and left the TAB ungated, so every signed-in user —
church members, COLG, self-serve — would have found a weight-loss tab in their nav
that was not theirs. `canSeeHealthTab()` scopes the door to the same enrollment the
surface renders, and generalises unchanged to the admin-creates-programs-for-others
future. RLS was never the hole; the nav was.

### 2. Planned and actual cannot merge, structurally

Planned figures live in frozen repo content (`road-to-150-program.js`) and are never
passed to a setter. **There is no setter for a planned value anywhere in
`health-actions.js`**, so no code path exists by which recording an actual overwrites
a plan. This is held by construction rather than by convention — the rule he stated
three times cannot be broken by a future edit that forgets it.

### 3. No number is invented — the bright line

Health data is the one place fabrication actually hurts: a wrong meal split is a
visible annoyance fixed in a tap; an invented calorie count silently corrupts a
weight-loss log for weeks. So:

- **No seeded nutrition table.** The sandbox cannot reach any external host (agent
  proxy refuses CONNECT, verified 403), so no calorie values were seeded from
  memory. Absent data stays absent.
- **A blank is ABSENT, never zero.** `calories`/`protein_g` are nullable end to end;
  totals carry `recorded`/`missing` counts, render `—` when nothing was recorded, and
  mark an incomplete sum. A blank read as 0 would under-count the day and present the
  result as complete.
- **The lookup returns a number only when a database returned one.** Offline, HTTP
  error, timeout, malformed body and no-nutrition all resolve to a blank row reading
  "not found — type it". No fallback estimate, no model guess.
- **Her own confirmed values win.** `fillUnknowns()` never asks the API about a food
  the remembered library already answers.
- **The food-name vocabulary carries no nutrition and never will.** Knowing the word
  "olives" is a fact about language; knowing its calories is a claim.
- **Derived, not typed.** His juice serving table was verified against his own
  18.3 cal/oz rate before writing (every row matches), so the options hold only the
  OUNCES and nutrition is computed. A typed list can drift from the formula it claims
  to follow; a derived one cannot.
- **Estimates are labelled.** Fresh juice varies with pulp removed — his own
  reasoning rides the card rather than presenting a planning value as a measurement.

### 4. History is immutable

A serving's nutrition is computed at log time and stored ON the `food_entries` row,
so editing a recipe later cannot reach backwards. His requirement — "Changing the
saved recipe must NOT change historical food logs" — needed no enforcement code; the
schema already held it.

## What the gates caught, recorded rather than quietly fixed

- The `remembered` badge used `#2F5D50`, a **fill** colour, as **text** — 2.46:1
  dark-on-dark in the midnight theme, effectively invisible. Fixed to the muted token,
  not re-baselined.
- `Number(null)` is `0`, so a blank weight passed an `isFinite` guard and would have
  charted a 0 lb reading — the exact planned-for-actual substitution this DR exists to
  prevent.
- `servingsPerBatch(recipe, 0)` used `oz || default`, so an explicit 0 quietly became
  18 and reported the default's answer to a question nobody asked.
- The water remove button destroyed a record with no confirmation.

## The shell budget

Main sat at 5330 of the frozen 5331 when this landed, so the mount was cut **+11 → +5**
(one import, one `healthRails()` spread, one write-paths line, one nav entry, one
render switch) and the budget raised 5331 → 5335 by hand with that itemisation, per the
file's own convention. Every later extension — food entries, the library, the lookup,
the juice — cost the shell **zero additional lines**, which is the +5 mount paying for
itself. A further cut to the documented +2 remains available via the `goals-sync.js`
self-contained-subscription precedent; that is a refactor, not a line trim.

## Honest state — what this is NOT yet

Answering his question directly: **weight is data-driven; food and water are capture-only.**
`health-program.js` carries real week math (`weekForDay`, `weekRange`, `targetWeightFor`,
`targetRunningLoss`, `weighInForWeek`) driving a 26-week target-vs-actual line. But
`dayFoodTotals` is per-day, there is **no weekly aggregation for food or water**, and
there is **no calendar or history view**. She can see today's calories; she cannot see
"I averaged 1,850 this week versus 1,600 last week" — the comparison that would actually
change behaviour.

~~**re-review: 2026-09-07**~~ — the weekly/trend view is the next build and is **not**
blocked by the missing plan PDF: average daily calories, protein and water are all
computable from real rows today. Roughly 8 of the 11 weekly-review fields he specified
are buildable now; only walking count, strength count and meal-plan completion % need
the source PDF.

## Still open

- The **"Road to 150 - Complete Tracking Plan" PDF** has never been supplied — two
  uploads were both the BRIEF. Meals, walking and strength stay absent rather than
  invented; the Plan tab says so plainly.
- **The lookup is unverified against its live endpoint.** Response handling is fully
  tested against recorded shapes; the first real call is the first live proof. The
  better home is a sovereign Python service on the NAS holding a cached USDA table —
  no key in a browser bundle, no CORS, better generic-food coverage — deployable
  through the existing `infra/nas-loops/loops/services-sync.sh` lane without SSH.
- **Recipe editing** is not built. Logging works and history is already immutable.
