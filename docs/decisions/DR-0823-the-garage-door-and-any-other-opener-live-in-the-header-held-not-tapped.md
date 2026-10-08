# DR-0823 — The garage door, and any other opener, lives in the header: held, not tapped

**Date:** 2026-10-08
**Status:** accepted
**Area:** The PoeTech header, the house openers, a new sovereign NAS service
**Principle:** DR-0065 (the app is the primary artifact), DR-0061 (reality-trace before building any surface), DR-0076 (measure, do not claim; proven-to-catch), DR-0060 (RLS is the real gate), DR-0132 (new pipelines are sovereign Python, never a new n8n webhook), DR-0083 (the same-origin transport, never the Funnel URL), DR-0816 (chrome never grows with the body text), the three-brakes rule as amended by DR-0247 / DR-0248

## Context

Darrell, 2026-10-08:

> Let's add the garage door opener and any system opener to the header in
> PoeTech App... so if your listening to you lesson as you drive when you get
> home the garage door opener button is there for easy access... make sense?

It makes sense, and the header is the right place: it is where his thumb already
is when a lesson is playing in the car.

**Reality-trace, run before a line of code (DR-0061).**

1. **Real data.** There was no opener integration anywhere. A search of `app/`,
   `infra/` and `scripts/` for garage, myq, homekit, home-assistant, shelly,
   tasmota and smartthings returned only lesson prose and the properties room
   list. So the device layer is new, and the header had to draw from a real row
   or draw nothing. The row is `household_openers` (migration 0254); every
   press is a row in `opener_presses`. No seed, no demo opener, no default.
2. **End to end.** A press leaves the browser on the same-origin sovereign
   route `/openers/press` (`app/functions/openers/[[path]].js`, three lines over
   the one `funnel-proxy` factory), and lands on the NAS, which owns the only
   code that touches a relay. The cloud never learns a device address, a GPIO
   pin, an MQTT topic or a vendor URL.
3. **The surface he uses.** `components/TopNavRow.jsx`, in BOTH of its shapes —
   the many-tab row and the one-tab brand row — pinned beside the chevron so it
   never scrolls away with the tabs.
4. **Stated assumption, so a wrong one is cheap.** Which opener hardware the
   house actually has is a value only Darrell holds. So the device layer is an
   adapter named by the row's `kind` (HTTP relay, GPIO relay, MQTT, vendor
   webhook), the NAS service ships **disabled**, and the header renders nothing
   at all until a real row exists and is turned on. **One value is still open,
   and it is his:** which opener he has. Everything else is built.

**Why a hold and not a tap.** A one-tap garage button living in a global
header, on a phone in a pocket, will open his house by accident. That is not a
hypothetical; it is what a header button is for. So a press is a HOLD of 800 ms,
the button shows the hold filling, and letting go early sends nothing.

## What was measured

**The library is pure, so it is measured rather than clicked.** Everything that
decides whether a press may happen lives in `app/src/lib/openers.js` as
functions of their arguments and a clock: `holdProgress`, `holdComplete`,
`pressAllowed`, `pressBody`, `readPressResult`, `openersFrom`, `describeOpener`,
`stillInFlight`.

**27 cases green** in `the-opener-is-in-the-header.test.js`, across four
groups: nothing is painted; the header offers the one he used last; it will not
open by accident; and it never claims a door moved when nobody checked.

**Proven-to-catch (DR-0076 §3).** Four wrong implementations were written on
purpose and each was caught:

| the break | what failed |
|---|---|
| `HOLD_MS = 0` (a tap instead of a hold) | 2 cases, including "a tap sends nothing" |
| `readPressResult(null)` returns confirmed | "silence reads UNKNOWN, never opened" |
| drop the `knownKind` filter from `openersFrom` | "a row the NAS adapter cannot drive is dropped, not drawn" |
| remove `{openers}` from one header shape | "the header row carries it in both of its shapes" |

The suite went green again after each revert. A gate that always passes is
itself a lie; these four were shown to catch.

**AND THEN THE GATES CAUGHT NINE MORE, WHICH IS THE REAL LESSON OF THIS RECORD.** The
first push of this work ran only the tests I had written plus lint and a build.
That is the DR-0076 failure in its most ordinary form: I verified what I had
thought of. The full gate set found nine defects I had not thought of, and
every one of them was real.

1. **`monolith-budget-guard`: the frozen shell grew by 21 lines.** DR-0078
   freezes `poe-financial-mvp-v28.jsx` to bug fixes, and I had put a new
   feature's state, effect, imports and panel mount straight into it. The fix
   is not a raised budget. The control now owns its own read and the header row
   mounts it, and the panel lives in the `DevOps.jsx` feature module, so **the
   shell changed by zero lines** (5302, holding). This also made the design
   better: the component asking the household record itself means RLS is the
   only gate, with no client-side family check standing in for a server one
   (DR-0060).
2. **`system-flow-graph`: `db:opener_presses` was an ORPHAN.** This is the one
   that mattered most. I had written the press ledger, given it RLS, forbidden
   update and delete on it, and described it in this record as "every press,
   kept" — and nothing in the code ever inserted a row. The gate called it read
   by the panel and written by no one, which was exactly true. `recordPress`
   now writes every press with the result `readPressResult` actually read, so an
   unanswered press is kept as unanswered. A table nobody writes is a painted
   number with a schema (DR-0061), and I had shipped one.
3. **`system-flow-graph`: `service:openers` and both tables had no place in the
   flow graph.** Now registered as three nodes, because the flow genuinely has
   three parts: who asks, who acts, and who records.
4. **`system-flow-graph`: the no-route gate caught `http:openers` as a
   connection over a route the Funnel does not mount.** Also exactly true, and
   on purpose. It is now declared with `open: { blocker, reReview }` and
   recorded in the **UNACTUATED** section of
   `infra/nas-transport/RECORDED-STATE.md`, which is the honest state of a
   service that ships disabled. The row says plainly why this is unlike the
   `/nas-photos` and `/taxes` defects it sits beside: the app is not quietly
   calling a dark backend, because the header renders no button at all until an
   opener is registered and armed, so there is nothing to fall through.
5. **`tenancy-guard`: an instance-scoped table without the overlays.** A
   migration that creates one must re-run `apply_assistant_scope_overlay()` and
   `apply_viewer_readonly_overlay()`, or a viewer can write it. On THIS table
   that means a viewer could arm an opener on somebody's house. Both overlays
   now run in 0232's order.
6. **`the-local-app-carries-the-house-address`: `/openers/` was missing from
   `REHOMED_ROUTES`.** The native shell would not have carried the house
   address for the new route. Listed.

Plus `legibility-guard`, which needed its health artifact regenerated for the
new panel. And then the full suite, run properly this time, found **three
more**:

7. **`american-spelling`: I had written "colour" in our own voice.** One word,
   in a comment, and the gate is right to refuse it.
8. **`funnel-actuation-guard`: `/openers` was not declared in the form the
   guard reads.** I had added a table row inside the UNACTUATED section; the
   guard looks for that section's own bullet form, `` - `/openers` ... re-review:
   <date> ``. Writing a declaration in a shape the machine does not read is the
   same defect as not declaring it, which is the whole point of having a guard
   rather than a convention.
9. **`started-by-record`: a disabled service with no recorded why.** DR-0247's
   waiting-by-default check. A service shipping `enabled: false` has to carry
   `disabledWhy` and a `reReview` date, and mine carried neither, so it read as
   agreed work parked on a human start. It now says what is true: the whole
   road is shipped and verified, the brakes are proven, and what waits is one
   value only Darrell holds. Two further gates were added to the test in the same pass, so the
first two findings cannot come back: one asserts the frozen shell contains no
opener code at all, and one asserts the press is recorded with the honest
result.

**Also measured:** lint clean at `--max-warnings 0`; `table-a11y-guard` OK with
all 195 `<th>` carrying scope after the panel's two new tables; the real Vite
build succeeds with the control in the header.

**Honesty by construction, three places:**

- a press with no clear answer reads **unknown** and tells the driver to look
  before driving away; only a device that actually reported movement reads
  **confirmed**;
- an opener that cannot report its position says so **in its own label**, and is
  never shown as closed because nothing said otherwise;
- `fetchOpeners` returns `null` when the question failed and `[]` when the house
  genuinely has none, because "we could not ask" must not be reported as
  "nothing exists".

## Impact

- **`app/src/lib/openers.js`** — the hold, the single-flight cooldown, the
  honest result reading, the four adapter kinds, the remembered opener.
- **`app/src/components/OpenerButton.jsx`** — the header control: hold to press,
  the fill showing progress, a picker when the house has more than one opener
  ("any system opener"), an `aria-live` line saying what actually happened, and
  `return null` when there is no real opener. Chrome, so it does not grow with
  the body text (DR-0816), with 44 px minimums so it is still a thumb target in
  a car.
- **`app/src/components/TopNavRow.jsx`** — takes an `openers` node and renders
  it in both row shapes.
- **`poe-financial-mvp-v28.jsx`** — subscribes to the real table for a family
  member only and passes the control to the header; renders the registration
  panel under Dev/Ops.
- **`app/src/components/OpenersPanel.jsx`** — register an opener, see whether
  the header will offer it, turn it on or off, and read the last twenty presses.
  A new row lands **disabled**, so registering an opener does not put a button
  in the header until somebody arms it.
- **`app/functions/openers/[[path]].js`** — the same-origin transport.
- **`infra/nas-openers/`** — the only code that drives a relay: four adapters,
  a budget, a single-flight lock, and armed-by-record from a NAS-local
  `devices.json` that ships only as an example.
- **`infra/supabase/migrations-auto/0254-...sql`** — both tables, RLS on the
  `poe-family` instance, and no UPDATE or DELETE policy on the press ledger, so
  the record of who opened the house and when cannot be tidied away.
- **`infra/nas-loops/services.json`** — the service registered with
  `enabled: false`.

## Decision

Ship the whole road now, and leave the door closed. This is the one service in
the fleet that drives a physical actuator on the family's house, which makes it
Tier C by definition — so it carries its three brakes **proven in the build**
(budget, lock, armed-by-record) and is armed by hand rather than by a merge,
exactly as the amended rule requires: build it now, activate on proof.

The one thing still outstanding is a value only Darrell holds: which opener
hardware the house has. Nothing waits on it — the adapters cover the four
realistic shapes, and he arms the right one by naming it in the panel and
filling in `devices.json` on the NAS.

`re-review: 2026-11-08` — once an opener is armed, press it from the car and
confirm three things on the live build: the hold cannot be triggered by a
pocket, the ledger recorded the press with an honest result, and a door that
cannot report its position never reads as opened.

## Verification

- `app/src/__tests__/the-opener-is-in-the-header.test.js` — 27 cases green,
  with the four proven-to-catch breaks in the table above.
- `the-title-stays-in-view.test.jsx` and the other header tests — 19 cases
  green with the new control in both row shapes.
- `scripts/table-a11y-guard.mjs` — OK, 195 `<th>` with scope, after the panel's
  two captioned tables.
- `npx eslint src --max-warnings 0` — clean.
- A real `vite build` — succeeds.
- The FULL Vitest suite, every guard, and lint — run before the second push,
  which is the discipline the first push skipped.
- Migration 0254 is idempotent by construction (guarded `CREATE TABLE IF NOT
  EXISTS`, `DROP POLICY IF EXISTS` before each `CREATE POLICY`), and applies on
  merge through `db-migrate`, which was observed applying 0253 earlier the same
  day.
- `infra/nas-openers/openers.py` parses, and `services.json` reports the
  service `enabled = false`.
