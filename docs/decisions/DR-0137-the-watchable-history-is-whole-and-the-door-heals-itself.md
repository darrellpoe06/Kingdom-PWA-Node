# DR-0137 — The watchable history is whole, and the front door heals itself

- **Status:** accepted
- **Tier:** A — a documented bug-class fix on two existing surfaces (the Choir history filter, the boot-fallback screen); no schema, no money, no new external face. The DR-0104 live reviewer pass confirms both on production.
- **Scope:** `lib/choir-sync.js` (buildPastServices keeps watchable services), `components/Choir.jsx` (derived history paging), `lib/boot-fallback.js` (the reload → cache-clear → manual self-heal ladder), the pinned tests for both, Ari's `watchable-history` standing duty
- **Date:** 2026-07-10
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), NO-STATIC-DATA (DR-0121), APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT (DR-0075), THREE-BRAKES (the loop guard), COMMUNITY-FIRST

## Directive

Darrell, 2026-07-10, with two screenshots: *"The church app should never go down. Also the Choir tab still only has 7 videos in the history dropdown."* And the standing frame restated: *"when we add features we need to update our Ways and documentation and find the opportunities and constraints; Ari's responsibility and reports should all update to reflect as well, all inside the PoeTech App. No static data."*

## The verified trace

1. **The "down" sighting is the boot gate asking for a tap.** The screenshot shows `boot-fallback.js`'s "Almost there — one more tap" screen at `poetech.us/?view=church`. The site was serving; the device held a stale shell during a deploy window (the DR-0128 class) and the fallback — by design at the time — asked the family to tap Reload. To the family, a screen that blocks the app and asks for a tap IS downtime, and both recoveries the screen offers (reload; clear cache + reload) are actions a machine can run itself.
2. **The 7-video history is a deliberate filter the corpus outgrew.** `buildPastServices` kept a past service only if it had a planned schedule row OR at least one song — recorded-but-songless services were excluded as "empty cards" (the test even pinned it: *"avoids 130 empty cards"*). But the corpus is the church's recorded services (DR-0135 made its wholeness measured); to the choir, a service with a recording IS history. Seven services happened to have plans/setlists; the other 300+ recordings were invisible. This is the same built-but-never-surfaced class DR-0135 names — the data was in the app and a display filter hid it.

## Decision

1. **A recorded past service IS history.** `buildPastServices` keeps a past service if it was planned, has a setlist, **or carries the service recording**. Only a row with none of the three stays hidden as noise. The history count on the toggle derives from the whole corpus, always.
2. **The history pages, never caps.** The Choir history renders in derived batches with a "Show more (N more)" that always states the remainder — every service reachable, a phone never mounts hundreds of cards at once. No fixed cap anywhere.
3. **The front door heals itself before it asks.** On a boot failure the fallback runs a self-heal ladder: auto-reload (fixes ordinary deploy skew) → auto cache-clear + reload (fixes a stale service worker) → only then the manual retry screen. Attempts are stamped in sessionStorage inside a 90-second window (the chunk-heal pattern); with no storage to count attempts (private mode), it goes straight to the manual screen rather than risk an unbounded reload loop — the brake holds.
4. **The record updates with the feature, derived (DR-0133 §4 applied).** Ari carries the `watchable-history` standing duty; his notes pick this DR up from the ledger on this very build; REV-0029 files the ways + O&C pass. None of it is hand-maintained state.

## Opportunities and constraints

- **Opportunity:** the boot-heal ladder's attempts should be visible to the stewards — stamp heal events into the device error journal (DR-0092) so the OpsBoard can show how often the door had to heal itself (an uptime-adjacent KPI, DR-0125's "how many times today?" answered for the shell plane). `re-review: 2026-07-24`.
- **Opportunity:** the history cards could carry the sermon title/speaker from the corpus row on video-only services (today they show date + title where present); fold once the family confirms the whole-history view reads well. `re-review: 2026-07-24`.
- **Constraint (held):** the ladder never exceeds two automatic attempts per window — a genuinely broken deploy must land on the manual screen, not spin a phone's battery (THREE-BRAKES posture in the shell plane).
- **Constraint (verified):** the sandbox has no route to poetech.us; both fixes are proven by the pinned unit suites locally and confirmed live by the family's DR-0104 reviewer pass.

## Supersedes / pairs

Supersedes the planned-or-setlist-only history filter (and its "avoids 130 empty cards" pin). Pairs with DR-0135 (this is the corpus-wholeness program reaching the display layer), DR-0128 (the deploy-window class the boot gate absorbs), DR-0125 (a down-feeling door outranks velocity), DR-0133 §4 (feature + Ways + Ari land together, derived).
