# 2026-10-18 — The home's energy enters the app through its meter (DR-1098)

**Asked:** "I want my home energy system to be incorporated into the PoeTech App... evaluate the DRs..."

**Decision:** DR-1098. This note is the working log: what changed, why, and what the owner does next.

## What changed

| File | Change | Why |
|---|---|---|
| `app/src/modules/properties/energy.js` | New. Parses Green Button ESPI XML and utility CSV, refuses what it cannot name, counts the reckoning. | The meter is the one measure of the whole house and the one the bill uses. |
| `app/src/modules/properties/EnergyTab.jsx` | New. The Energy tab: figures, months, the file picker with a preview, the file ledger. | DR-0065: build it in the app. |
| `app/src/modules/properties/cloud.js` | Four meter functions, each with a 15-second timeout and a reason on failure. | Every async call ends in an answer, never a spinner. |
| `app/src/modules/properties/model.js`, `PropertiesApp.jsx` | Energy after Systems on the owner's face. A delegated manager is told the record is the owner's. | RLS would hand a manager an empty list that reads like "no readings". |
| `infra/supabase/migrations-auto/0302-…sql` | Imports ledger, readings, the hourly fold, RLS, the overlays. | Owner, admin, member only: hourly reads show when a house is empty. |
| `infra/supabase/tests/0302-door-meter-smoke.sql` | New smoke. | Proves every wall on a real database. |
| `.github/workflows/ci.yml`, `rls-isolation.yml` | 0302 and its smoke join the door-work and poe-properties legs. | CI and the live leg both prove it. |
| `scripts/system-flow-registry.mjs` | The `door-meter` node. | Every table has a place in the flow graph. |
| `every-poe-properties-page-is-reportable.test.jsx` | The page count tripwire moves from 24 to 25. | A new page, added knowingly. |

## Evidence

- 30 parser tests and 10 tab tests pass. Two deliberate breaks of the parser turned two refusal tests red.
- The CI door-work leg, replayed from `ci.yml` on PostgreSQL 16: 27 smokes pass, 0302's included. Widening the read to viewers failed it.
- Lint, the tenancy guard, every migration guard, the flow graph and the ledger guards pass.

## The owner's next step (a browser, about two minutes)

1. Sign in to the Ameren Illinois account for the house.
2. Find **Green Button** or **Download My Data**.
3. Choose the longest range offered, at hourly or 15-minute detail, and download the XML or CSV.
4. In the app: Properties, the home's door, **Energy**, then choose the file. Check the preview and press **File on this door**.

## Safety finding to act on

Emporia shut off the garage heater plug and the garage AC plug for unsafe consumption at least ten times in 2025. Plug both straight into a wall receptacle on a circuit that can carry them.

## Dated follow-through

- `2026-10-25` — read the first real Ameren file; confirm whether an Emporia Vue monitor is installed; build the NAS Emporia reader.
- `2026-11-01` — the ecobee over local HomeKit.
- `2026-11-08` — Honeywell Home through Resideo.
- `2026-11-18` — decide which loads, if any, the app should control (Tier C, DR-0823 brakes).
