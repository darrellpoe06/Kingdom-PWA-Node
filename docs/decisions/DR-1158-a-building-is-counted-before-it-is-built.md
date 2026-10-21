# DR-1158: A building is counted before it is built — Poe Properties develops from the ground up, from the developer's own published method

**Date:** 2026-10-21
**Status:** accepted
**Tier:** C (schema: migration 0305 with its walls, carried with its proof on a real PostgreSQL in CI, DR-0225)
**Type:** product (capability) + way
**Area:**
- `app/src/modules/properties/development.js` (new, pure): the budget, the TI allowance, the phases and their checks by project kind, the contingency and change orders, valuation, build-to-rent, the investor deal
- `infra/supabase/migrations-auto/0305-a-building-is-counted-before-it-is-built.sql` (new): `dev_projects`, `dev_budget_lines`, `dev_change_orders`, `dev_bays`, `dev_checks`, `dev_capital`
- `infra/supabase/tests/0305-development-smoke.sql` (new), run twice-applied in `ci.yml`'s door-work leg and on the live database in `rls-isolation.yml`'s poe-properties leg
- `app/src/__tests__/properties-development.test.js` (new, 27 cases); `properties-rehab-valuator-methods.test.js` (12 cases, Kleyman's and Lindsay's figures)
- Sources: `docs/99-session-notes/sources/clayman-40-unit-mixed-use-richmond-development/` (video 608WXaTG8Js) and `docs/99-session-notes/sources/real-estate-workflows-adpdzjtsttq/` (video adpDZJtstTQ), fetched on the NAS by `source-transcript.yml`

**Grounds:** Darrell, 2026-10-21, sending Daniil Kleyman's walk-through of a 40-unit mixed-use build in Richmond: **"Find and create processes for these types of real-estate solutions... make sense?"** Then the building's systems phase by phase, and the commercial shell: *"It is crucial to include this as a line item in the construction budget early on to ensure the project remains funded for lease-up."* Then: **"Can you now source the YouTube link using our research system?"**; **"Use this page as a resource for building the system's we want... we build then use it and see if we need to tweak it"**; **"Create lessons and systems at the same time... correct?"**; **"Pull and or create a system from their maps... build evaluation for real estate... features to be inside our Poe Properties Apps for building businesses and apartment deals with investors"**; **"Poe Properties can build from scratch like we did our home"**; **"We do have a projects tab inside PoeTech App.... how should we do this?"**; **"Rehab valuations from his content should be more than enough... review as many videos as you need"**; **"We will finalize any systems so verify their methods and metrics... testing to ensure that they work properly."**
**Principles:** DR-0076 (nothing guessed; proven-to-catch; provenance); DR-0313 / DR-0365 (Poe Properties is a door on one library, in its own instance); DR-0359 / 0203 (integer cents, a blank is not zero); DR-0202 (the books' wall); DR-0061 (a surface is a live view of real records); DR-1135 (the hire rule's 1099 start); DR-0504 / DR-0528 (the property course already teaches counting the cost and appraisal)

## Context

Nothing in the app modeled building from the ground up: no table, no calculation and no record held a project with budget lines, phases, change orders or an as-built value (the Explore trace of 2026-10-21; `Rentals.jsx`'s cap-rate evaluator is UI-only and assumes its expenses). Darrell sent the developer's own videos as the source, asked for the processes to be pulled from them, built into Poe Properties, verified by their methods and metrics, and taught as lessons alongside.

**On the name.** The auto-captions hear "Daniel Clayman"; the presenter is **Daniil Kleyman**, founder of Rehab Valuator (the channel page). The first transcript's folder keeps the slug the fetch wrote.

**The source road.** The cloud sandbox has no route to YouTube; `source-transcript.yml` fetched each transcript, the runner was challenged as a bot, and the run handed the link to the NAS (residential IP), which wrote the text. Auto-generated captions, no timestamps on that route: quotations are attributed to the speaker, not to a minute mark, and a figure is taken only where the transcript states it.

## What was measured

From the transcripts, in the speaker's own figures:

| | |
|---|---|
| Richmond build | 40 apartments over 8,000 sq ft of retail; 45,000 sq ft; 14 months |
| Cost categories | land $1.27M; soft costs "just over $2 million" (owner-carried $1.2M, the contractor's general conditions $535K, other; demolition carried as a soft cost); hard costs "just over $8 million"; cost of money $725K; total **$12,148,000**, $269 a foot |
| TI allowance | **$520,000** for the 8,000 sq ft, carried on the budget: the commercial bays are shells, "gravel floor and four walls" |
| Contingency | **$500,000** on top of the contractor's own; **$340,000** of change orders drawn on it (performance bond, drawing revisions, site work $66K, appliance and finish upgrades) — "we actually came in under budget" |
| Retail value | gross less a 27% expense ratio = **$157,680** NOI; ÷ 6% = **$2,628,000** (apartments at "a five or five and a half cap") |
| As built | "almost $15 million" against $12.15M all in — about $3M created |
| Cost per unit | over $300,000 on 40 apartments; with the retail counted as "eight apartments", 48 units, **about $253,000** |
| Build to rent | infill lot $60K: a 2,400 ft house at $145/ft renting $2,700 yields "just under 8%"; two 1,200 ft units at $160/ft renting $2,000 each "almost 11%"; a 1,600 ft house at $145/ft and $2,500 is better than the big one |

Each figure above is a fixture in `properties-development.test.js`, and the engine reproduces it: $157,680 → $2,628,000; 7.94%; 10.81%; 10.27% (the speaker's "almost 11%" on the smaller house rounds 10.27 up, and the record says so).

## Decision

1. **Poe Properties builds from the ground up, by kind.** A project is a home, a duplex, apartments, mixed use or commercial (Darrell: "like we did our home"). The phases follow the kind: no commercial shell for a home or duplex; the elevator inspection only where there is an elevator; low-voltage, data and sprinkler sign-offs optional for a home.
2. **The budget carries six categories:** land, soft, hard, the TI allowance, the cost of money and the contingency. **A building with commercial space and no TI line is flagged underfunded**, before construction, because the tenants' buildout is paid at lease-up when the money is most likely gone; a TI promise larger than the line is short, by how much; each bay's allowance draws down on its own.
3. **Every change order names its money:** the contingency, a tenant's allowance, its own line, or the owner outside the budget. Only an approved order drawn on the contingency spends it; a proposed one is counted apart; an overdrawn contingency is named.
4. **The phases are the order the building goes up, each with the checks that prove it:** site, foundation (footer inspection, third-party concrete strength), underground (utilities before backfill, the stormwater system), structure, envelope, the MEP rough-in (a sign-off for each of the seven trades, then the rough-in inspection), interior (elevator, certificate of occupancy), commercial shell. A check is passed or failed **with a date and who signed it**; a phase is complete only when every required check has passed, and a failure holds it.
5. **Value is income over a cap rate, each part at its own:** the as-built value, the equity created, cost per square foot, and cost per unit two ways — plainly, and Kleyman's way with the retail counted as the apartments it is worth.
6. **Build to rent compares designs for one lot** by land and build cost per unit, rent per foot and gross yield, best first.
7. **The deal for investors:** who funds it (loan, investors, our own equity), the loan paid first, then the investors' preferred return, then their share of what is left; cash-on-cash, DSCR, loan-to-value and the equity multiple, interest-only and stated so it can be checked by hand. A short year says how far short the preferred return fell.
8. **One record, two places (Darrell's Projects-tab question).** The building's numbers live in Poe Properties (its own instance, beside the doors and the investors); the work and its hours live in PoeTech's Projects tab, which already feeds capacity and each business's road to full time (DR-1138). `dev_projects.project_ref` names the Projects-tab project; nothing is entered twice.
9. **The walls are the books' own:** owners, admins and members read; only the owner or an admin writes; a viewer, a child, an assistant and any other instance read nothing; a record cannot be filed under another instance's project.
10. **Every video becomes a system and a lesson, then is used and tuned.** The way: fetch the transcript on the NAS, pull the process from the speaker's own words, build it into the app with the speaker's figures as its tests, teach it as a lesson Word first, use it on a real project, and record what changed.

## Folded in from the further Rehab Valuator videos (2026-10-21)

11. **Budget against actual** (Brandon Lindsay, Rehab Valuator's Playbook, video ZmkZjUzeT6E). Each budget line shows its budget, its budget a square foot, what it has cost, its variance, and whether it is done (`dev_budget_lines.done`, 0305). A done line is final at what it cost; an open line is forecast at its budget, or at what it has already cost if that is more, because spent money is never forecast back down. A line with no budget is named and left out of the forecast, never counted as zero. Two uses he names: pricing a pre-sale before the last dollar is spent, and carrying a finished line's real cost a square foot into the next build ("framing material has cost me about $25 per square foot and framing labor... about $7"). `trackBudget`.
12. **Buy, rehab, rent, refinance, repeat** (Kleyman, video uVH8Xs5Y-wc). His worked deal reproduces figure for figure: $73,950 all in ("just under seventy four thousand"), NOI $670, payment $550, $4,450 pocketed, cash flow $120; with 8% management, $46 and coverage 1.08; rent $1,200, coverage 1.39 and over $200; a $5,000 rehab refinanced at 65%, coverage 1.33, $149, $5,050 pocketed; all cash at 65%, $8,800 left in earning 43%. His five rules are named checks: all-in below 80% of the after-repair value, coverage 1.3, cash flow $200 a month, rent at least 1.5% of the all-in cost, money left in earning 10%. The lender's stress test (a management fee and at least 8% vacancy even when you manage it yourself) is always shown, and so is the largest loan the rent carries at 1.3, because the bank sizes the loan by coverage. `brrrr`; the card on the Development tab.
- **Transactions linked to lines** (his "once you upload a transaction, it automatically links to a line item") are not built yet: a line's cost is typed as one figure. Why: one source of truth per line, and the bank-import road for the books already exists to be reused rather than a second ledger. re-review: 2026-11-04.
- Video 608WXaTG8Js and adpDZJtstTQ are Kleyman; ZmkZjUzeT6E is Brandon Lindsay of Rehab Valuator's Playbook, the same method on the same software. Further videos (duplex financing, ARV, rehab estimating, the 70% rule) are fetching in pairs on the NAS and fold in as they land.

## Impact

- New tables in the landlord instance; nothing existing changes. No price, gate or public copy changes.
- **The Development tab is mounted** (owner only; `DevelopmentTab.jsx` over `development-cloud.js`, registered in `system-flow-registry.mjs`): the project, the budget with its TI verdict, the bays, the change orders against the contingency, the phases with signed checks, the value and the investor deal, and the build-to-rent comparison. `properties-development-tab.test.jsx`, 8 cases on the screen with Kleyman's figures; proven to catch a project reference saved on every key. Deleting a budget line asks first. 0305 now re-runs the assistant and viewer overlays (as 0302), which the tenancy guard caught.
- The lesson is the next delivery on this record; further Rehab Valuator videos (flip and ARV, rehab estimating, budget against actual, BRRRR, duplex financing) are being fetched through the same road and fold in as they land.
- **Not ours to build without a decision:** Rehab Valuator's nationwide property, owner and comparable-sales lookups come from a paid data provider. That is a money decision (a vendor and a subscription) and is put to Darrell separately.

## Verification

- `properties-development.test.js`: **27 pass.** Proven to catch:
  - counting a proposed change order as spent;
  - ignoring a missing TI line;
  - not counting the retail as units;
  - a failed check counting as done;
  - land not split across a duplex's units;
  - the loan not paid before the investors;
  - a home given a commercial shell.
- `0305-development-smoke.sql` on a real PostgreSQL 16 (bootstrap, schema-v1/v1.1/v2.1, 0305 applied **twice**): **PASS.** Proven to catch, each by loosening the live function and re-running:
  - a viewer allowed to read → FAIL "a viewer read 1 projects";
  - any project accepted → FAIL "a line was filed under another instance";
  - a member allowed to write → FAIL "a member wrote a budget line".
- Migration guards: rls-isolation-matrix, replay-order, replay-completeness, smoke-sql-language, return-type — all OK.
- **re-review:** 2026-11-21, after one real project (a home or a duplex) has been kept in it end to end: record which figures it needed that the engine lacked, and fold in the further videos' methods.
