# DR-1056: The way in belongs in the header — the share code was on five surfaces, none of them the one always on screen

**Date:** 2026-10-15
**Status:** accepted
**Tier:** B (the header, on every tab, on every door)
**Type:** word
**Area:**
- `app/src/components/AppDoorControls.jsx` (new — the two app doors, paired)
- `app/src/poe-financial-mvp-v28.jsx` (one line out, one line in; the shell did not grow)
- `app/src/__tests__/app-door-controls.test.jsx` (new), `app/src/__tests__/install-app-button.test.jsx` (the pin follows the indirection)

**Grounds:** Darrell, 2026-10-15, with a screenshot of the Love Corner app's QR card on an admin tab: **"This needs to be in the header...not just there... make sense?"**
**Principles:** DR-0065 (the app is the primary artifact); DR-0076 §5 (characterize before you change); DR-0330 (a control that is not where the hand is, is not a control); COMMUNITY-FIRST-MISSION

## Context

He photographed the "THE LOVE CORNER APP" card — QR code, `poetech.us/lovecorner`,
COPY LINK — sitting on an admin tab, and said it needs to be in the header.

## What was measured

**There are TWO app doors, and only one of them was in the header.**

| | what it does | where it was |
|---|---|---|
| `InstallAppButton` | get the app onto **this** phone | the header, every tab, since 2026-07-10 |
| `AppShareQR` | hand the way in to **someone else** | `ChurchHome`, `AccessUsageMetrics`, `AppInterestAdmin`, `PropertiesDoor`, `TlcPublicDoor` — **five surfaces, none of them the header** |

And the sharper half: **`InstallAppButton` hides itself once the app is
installed.** That is correct for what it does — and it means the one header
affordance for "the app" **disappears for exactly the people who hand it out.**
A steward standing in front of the congregation has the app, so they have no
button at all, and the code they want to show is several taps deep on an admin
tab. That is the friction he met, and it is not a missing feature so much as a
control that was not where the hand is.

## Impact

**What it buys.** The way in is one tap from every tab, on every door, whether
or not the person holding the phone already has the app.

**What it costs.** One button in a crowded header row. It carries an icon alone
below the `sm` breakpoint, so the row does not grow on a phone.

**What it does NOT do.** It grants nothing. The card carries the same sentence
it has always carried: *showing this code doesn't grant access — it only shares
the way in.*

## Decision

1. **The card is REUSED, never copied.** The header opens the same `AppShareQR`
   the five surfaces already use. A second QR card with its own copy is the
   second-vocabulary failure that goes stale the first time a door URL changes.
2. **On a church surface it is the CHURCH's door** — `SHARE_DOOR_URL` and the
   church's own words, so the header's code and ChurchHome's code are the same
   code. Elsewhere it falls back to the platform join URL exactly as every
   caller that passes nothing already does.
3. **The two controls become one component**, `AppDoorControls`. They are
   siblings — one gets you in, one lets you bring someone — and the shell is
   **frozen at its line budget and may only shrink** (`monolith-budget-guard`),
   so a new header line would have failed the gate. One line out, one line in.

## Verification

- **The shell did not grow: 5193 lines before, 5193 after**, holding the frozen
  budget. The guard confirms it, and a case in the new suite asserts it against
  `scripts/monolith-budget.json` rather than a number typed into a test.
- **10 new cases**, weighted at the one thing that could go quietly wrong: the
  header handing out the PoeTech join link to someone plainly standing in the
  church. **A code that installs the wrong app is worse than no code.** The
  church door is asserted to be `SHARE_DOOR_URL` itself, *and* the module is
  asserted **not** to contain the literal URL — so a hardcoded copy fails.
- **A second QR renderer is forbidden by name**: the module must not import
  `qrcode.react`, which belongs to `AppShareQR` alone.
- **The existing install pin was RETARGETED, not deleted.** `install-app-button.test.jsx`
  pinned `<InstallAppButton />` in the shell by source. Its real guarantee —
  *there is an install control in the header on every tab* — still holds, one
  level down, so the check now follows the indirection: the shell renders it
  directly, **or** it renders the component that does, and that component is
  read and checked. Deleting it would have left the header free to lose the
  install button with nothing failing.
- **One defect of my own, caught by running it rather than reading it.** The
  retargeted assertion was written through a shell heredoc where `\b` became a
  literal backspace, so the committed regex was `/<AppDoorControls␈/` and could
  never match. The test failed against a shell that plainly contained the tag;
  the regex was the thing that was wrong. Replaced with `toContain`.
- Lint clean, 21 gates, `legibility-health.json` regenerated for the new page
  (327/340), consistency and contrast suites green.
