# DR-1098: The house's energy enters the app through its meter. The utility's own file comes first, every device in the house is a witness after it, and nothing is switched from the app yet

**Date:** 2026-10-18
**Status:** accepted
**Tier:** B (a new instance-scoped store and a new owner-only tab; read-only; no actuator, no vendor account, nothing on the Funnel)
**Type:** architecture
**Area:**
- `app/src/modules/properties/energy.js` (new): Green Button ESPI XML and utility CSV parser, the refusals, the reckoning
- `app/src/modules/properties/EnergyTab.jsx` (new): the Energy tab on a door
- `app/src/modules/properties/cloud.js`: `loadEnergyImports`, `loadEnergyHours`, `saveEnergyImport`, `deleteEnergyImport`, each with a timeout
- `app/src/modules/properties/model.js`, `PropertiesApp.jsx`: the tab after Systems on the owner's face
- `infra/supabase/migrations-auto/0302-a-door-keeps-what-its-meter-said.sql` (new), `infra/supabase/tests/0302-door-meter-smoke.sql` (new)
- `.github/workflows/ci.yml` (door-work leg), `.github/workflows/rls-isolation.yml` (poe-properties leg), `scripts/system-flow-registry.mjs` (the `door-meter` node)

**Grounds:** APP-IS-PRIMARY, REALITY-TRACE, VERIFICATION-DOCTRINE, SOVEREIGN-FIRST, THREE-BRAKES, TIER-C, SPEC-CONFORMANCE-REVIEW, PERPETUAL-IMPROVEMENT, HOLD-THE-HAND

## Context

Darrell, 2026-10-18: *"I want my home energy system to be incorporated into the PoeTech App... evaluate the DRs..."*

Before this record the repo held no energy data. A search of `app/`, `infra/`, `backend/` and `scripts/` for enphase, powerwall, emporia, kwh, green button, inverter and smart meter found only lesson prose (L221 in DR-0821, L236 in DR-0860) and test fixtures.

**What the house actually has, measured from the family inbox on 2026-10-18.** Nothing below is assumed from a product category.

| System | What the inbox shows |
|---|---|
| Emporia Energy | An Emporia account with smart plugs named "Garage Heater" and "Garage AC". Whether a Vue panel monitor is installed was not confirmed. |
| ecobee | One thermostat in the great room, with three remote sensors. Emporia ended its ecobee integration on 2026-01-31. |
| Honeywell Home | Monthly reports for two thermostats, "Master Bedroom" and "Basement". |
| Electric vehicle | Public charging only: ChargePoint (MB.CHARGE), Electrify America and SWTCH receipts. |
| The utility | No utility mail was found. The house is in Champaign, which Ameren Illinois serves, and the books' own test fixtures name Ameren as the electric payee. The account and its rate were not seen. |

**What each vendor allows, researched 2026-10-18.**
- **ecobee** stopped issuing new developer API keys in 2024; existing keys still work. The local road is HomeKit pairing on the LAN.
- **Emporia** stock firmware reports only to Emporia's cloud, through an unofficial client library. The local road is reflashing the device with ESPHome, a hardware step at the owner's risk.
- **Resideo (Honeywell Home)** documents an OAuth developer program, and community reports say approvals can sit pending for months.
- **This cloud sandbox cannot reach any of the three.** The egress proxy refused `api.emporiaenergy.com`, `api.ecobee.com` and `api.honeywell.com`. So no vendor adapter could be proven here (DR-0076 §1).

## The records evaluated, and what each one requires of this

| Record | What it requires | How this meets it |
|---|---|---|
| DR-0061 surfaces are live views | A number traces to a real row. | Every figure is counted from stored readings; the empty door says how to get the file. |
| DR-0065 the app is primary | Build it in the app. | The Energy tab lives on the door, beside Systems. |
| DR-0060 tenancy guard | RLS is the wall. | 0302 ships RLS, and the smoke proves who reads what. |
| DR-0076 verification | No claim without evidence; proven to catch. | 30 parser tests, 10 tab tests, the 0302 smoke on a real PostgreSQL, and two deliberate breaks that went red. |
| DR-0100 speak established fact | State plainly; flag only the narrow unknown. | The garage plug finding below is stated as fact; the utility and its rate are flagged as unseen. |
| DR-0132 n8n off the critical path | New pipelines are sovereign Python, never an n8n webhook. | No n8n. The meter road needs no NAS at all; the device witnesses will be NAS Python. |
| DR-0217 and the transport memory | The NAS is reached by a same-origin route. | The device witnesses will ride a neutral `/energy` route; none is opened by this record. |
| DR-0756 and DR-0770 the camera road | Vendor sign-in typed once in the app; secrets stay on the NAS. | The device witnesses will follow that shape. |
| DR-0823 the opener | A physical actuator on the house is Tier C with budget, lock and armed-by-record. | Nothing here switches anything. Control is not built. |
| DR-0821 and DR-0860, L221 and L236 | "Count the cost" needs your own rate from your own bill. | The tab reports the rate per kWh only when the utility's file carries every cost. |
| DR-0247 and DR-0248 started by default | Agreed work starts itself through the lane. | Nothing waits on a start: the tab works the moment 0302 is on the database and a file is chosen. |

## Decision

1. **The meter is the first road.** It is the one instrument that measures the whole building, and the one the bill is figured from. The family downloads Green Button "Download My Data" from the utility account, as ESPI XML or CSV. The file is parsed on the device, shown before anything is saved, and filed on the door. No vendor, no NAS, no new secret.
2. **Energy is a door feature, not a household feature.** The family's home is one of the properties (0156; systems.js: "like all our properties"). The same tab serves every rental with its own meter.
3. **The read is narrower than the equipment record.** Hourly reads show when a house wakes, sleeps and stands empty. Owner, admin and member read them. A viewer, the assistant and a delegated manager read nothing, and the tab tells a manager so plainly instead of showing an empty list.
4. **Nothing is guessed.** A file without a unit, gas by volume and a demand-only file are refused with the reason. A rate appears only when every delivered reading carried its cost. The always-on draw needs seven whole days of hourly reads. Both clock-change days are measured by the house's own midnights.
5. **Re-import replaces and never doubles.** A reading's identity is door, commodity, direction, start and length. A newer download revises an estimated hour into a measured one, and the ledger keeps which file said each hour. The owner or an admin takes back a wrong file, and its readings go with it.
6. **Read-only, on purpose.** Turning a plug or a thermostat from the app is a physical actuator, so it is Tier C under DR-0823's brakes. It is not built by this record. `re-review: 2026-11-18`, after a month of meter data says which loads are worth controlling.
7. **The device witnesses come next, on the NAS, in this order.** Each needs a value only Darrell holds, and none can be proven from the cloud sandbox.
   - **Emporia** first, because it measures circuits and plugs the meter cannot separate. `re-review: 2026-10-25`: confirm from the Emporia app whether a Vue monitor is installed, then build the NAS reader.
   - **ecobee** second, over local HomeKit pairing, since new cloud keys are closed. `re-review: 2026-11-01`.
   - **Honeywell Home** third, through Resideo's OAuth program, or Resideo's local road if approval stalls. `re-review: 2026-11-08`.

## Found while measuring, and stated plainly (DR-0100)

**The garage plugs are being overloaded.** Emporia turned off the "Garage Heater" plug for unsafe consumption at least four times on 2025-12-01 and 2025-12-02. It turned off the "Garage AC" plug at least six times between 2025-07-25 and 2025-08-15. A smart plug that keeps cutting out under a heater or an air conditioner is carrying more than it is rated for. Plug the heater and the AC straight into a wall receptacle, on a circuit that can carry them.

**Public charging is a real, recurring cost.** ChargePoint reloaded the MB.CHARGE balance by at least $740 between January and October 2026, before the Electrify America and SWTCH sessions. Once the meter file is in, home charging, if it begins, will show up in the house's own hours.

## What is NOT claimed

- Not yet seen on poetech.us. 0302 reaches the live database through db-migrate after merge, and the tab says "not on this database yet" until then.
- No real Ameren file has been parsed. The CSV reader finds its header row instead of assuming one, and refuses what it cannot name. The first real file is the test. `re-review: 2026-10-25`.
- Wall-clock times in a CSV are read in the device's time zone, which is the house's for this family. A rental in another zone would need its door's zone.

## Verification

- `app/src/__tests__/properties-energy.test.js`: 30 tests. Proven to catch: a parser that defaulted a missing unit to kWh, or read demand as energy, turned two tests red.
- `app/src/__tests__/properties-energy-tab.test.jsx`: 10 tests on the real component with a fake data layer.
- `infra/supabase/tests/0302-door-meter-smoke.sql`: passes on PostgreSQL 16 after the full door-work chain, with 0302 applied twice. Proven to catch: widening the read to viewers failed it with "a viewer read 5 readings".
- The CI door-work leg, replayed locally from `ci.yml`: 27 smokes pass, this one included. Every migration guard, the tenancy guard, the flow graph and lint pass.
