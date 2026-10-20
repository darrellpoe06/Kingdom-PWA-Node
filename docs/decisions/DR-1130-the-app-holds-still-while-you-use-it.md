# DR-1130: Nothing interrupts you USING the app either — the guard protected his words, not his session

**Date:** 2026-10-20
**Status:** accepted
**Tier:** B (how the app behaves for every reader when a new build lands; no schema, no money, no lesson text)
**Type:** way

**Area:** `app/src/lib/intake-guard.js` (new `use` kind, `USE_IDLE_MS`, `watchUse`), `app/src/main.jsx` (wired at boot), `app/src/__tests__/the-app-holds-still-while-you-use-it.test.js` (new), `app/src/__tests__/nothing-interrupts-your-words.test.jsx` (its wiring case asserts a property instead of a line, and gains the new wiring).

**Grounds:** Darrell, 2026-10-20, while using the app as it was being rebuilt under him:

> *"When using the app at times, the app flashes and undermines me using the app while building the app. So production environment and a testing environment may be necessary. Thoughts?"*

**Principles:** DR-0748 (nothing interrupts words coming in — the guard this extends); DR-0054 (merge = deploy); DR-0103 (the lane lands work on green by itself, which is what makes deploys frequent); DR-0076 §3 (proven-to-catch); DR-0061 / P15 (trace the real mechanism before building).

## Context

He proposed two environments. The trace found that the symptom does not need them, and naming the real cause mattered more than the remedy.

**The cause, in the module's own words.** `app/src/lib/sw-update.js`: *"SEAMLESS BY DEFAULT: on detecting a pending worker we auto skip-wait it, so the controllerchange → single reload happens with **NO user action**"* and *"never a decision the user must make."*

That is **right for a reader** — the family opens the app and it quietly updates, with no banner to dismiss. It is **wrong for the builder**, who is the one person using the app while it is rebuilt several times an hour. Merge = deploy (DR-0054) and the lane lands work on green by itself (DR-0103); **three merges deployed on the day he said this.** Seamless-for-a-reader is interrupting-for-him, from the same line of policy.

**And the guard that should have caught it already existed.** `sw-update.js:54` imports `whenIntakeFree` and defers the reload — DR-0748, built after a multi-minute spoken message was lost to the app putting something on the screen while he was still speaking. It waits for six kinds: `recording`, `recording-kept`, `dictation`, `typing`, `reading`, `download`.

**Every one of those protects words coming IN.** None protects a person reading a board, tapping between tabs or scrolling a lesson. **The guard protected his words; it did not protect his session** — which is exactly what he described.

## What was measured

Read on main `36943d755`, from the files named.

| what | reading |
|---|---|
| the reload's trigger | `sw-update.js` — `controllerchange` → one reload, auto skip-waited, *"with NO user action"* |
| the deferral already in place | `sw-update.js:54` imports `whenIntakeFree`; the `controllerchange` listener calls it |
| kinds the guard knew | **6**, all words-coming-in (`INTAKE_KINDS`) |
| kinds covering ordinary use | **0** |
| the quiet window | `QUIET_MS = 3000` |
| prior narrowings of the same problem | DR-0748 (holds while a message comes in); #2079 (a reload waits until the lesson is sent) |

**The window matters as much as the kind, and either alone leaves the flash.** Three seconds is right for words — a Stop followed at once by a Send must not be cut in two. It is wrong for reading, where pauses longer than three seconds happen constantly. A `use` hold on a 3 s window would release mid-read and the reload would land exactly where it lands today.

## Decision

**Add `use` as a kind, with a window sized for reading, and wire it at boot.**

- `watchUse(doc)` — the sibling of `watchTypedIntake`, taking the `use` hold on `pointerdown`, `keydown`, `scroll`, `wheel` or `touchstart`, re-arming an idle timer on each. Passive listeners, so the thing watching scrolling never slows it. Injectable timers and document, so the suite drives the whole lifecycle in plain Node.
- **`USE_IDLE_MS = 45 s`**, stated with both bounds because both are the decision:
  - **not `QUIET_MS`** (3 s) — that releases while someone reads, which is the bug.
  - **not longer / not indefinite** — a hold that never releases is the *opposite* failure: the person runs stale code for as long as the tab is open, so a fix they are waiting for never arrives. The reload must still happen, just **between** sessions of use rather than during one.
- **A hidden tab releases at once.** Nobody is using a tab they cannot see, and that is the best possible moment for the swap.
- **Seamlessness is kept for everyone else.** The auto-reload is not removed and no banner is introduced. A reader who opens the app, reads and puts it down still gets the silent update — now at a moment they are not mid-anything.

**And his two-environment question, answered honestly rather than built.** A second front end pointed at the same database is not a test environment; it is production wearing a different hostname (`VITE_SUPABASE_URL` is baked into the bundle at build time from the deploy secrets). A genuinely separate stack means using the app on data that is not his, which defeats the reason he uses it. If he still wants a safe place for a risky feature, the cheap honest version is a **test instance** — real app, real deploy, its own rows behind RLS (DR-0060) — not a parallel environment. His week/month release cadence is a separate, heavier decision: DR-0103 scopes `hold` to Tier B/C content review, not release batching, and names reverting the three workflow files as the whole-policy off-switch. Recorded here so the cheap fix is not mistaken for having settled that.

## Impact

**What this buys.** The one person who uses the app while it is being built stops being interrupted by it. Nothing else about the delivery loop changes — work still lands on green by itself, deploys still happen whenever they happen.

**What this does not do.**

- **It does not stop deploys, batch them, or add an environment.** Only the *moment* of the reload moves.
- **It cannot help a page that never goes quiet.** 45 s of continuous interaction holds indefinitely by design; the swap waits for a gap. If a surface somehow generates synthetic interaction events on a timer, it would starve the update — none does today, and the hold is only taken on real input events. **`re-review: 2026-11-20`** — whether any deferral has been observed lasting unreasonably long (`state.deferred` and `state.deferredFor` already count and name them, and `recordError` journals each wait).
- **It does not measure the flash from the outside.** The cases prove the hold defers the reload; nobody has observed a live session before and after. The first real datum is Darrell using the app after this deploys — and he is the one who reported it, so he is the witness.

## Verification

`app/src/__tests__/the-app-holds-still-while-you-use-it.test.js`, **15 cases**. **73 passed across the four suites that own this path** — the new file, DR-0748's own `nothing-interrupts-your-words.test.jsx`, `sw-update.test.js` and `chunk-reload-heal.test.js`. `npm run lint` exit 0; `npm run verify:gates` exit 0.

**Proven to catch, in two separable places, because either alone leaves the flash:**

| what was done | what went red |
| --- | --- |
| the `use` hold removed (watch, but never hold) | **7** |
| `USE_IDLE_MS` shrunk to `QUIET_MS` — sized for typing, not reading | **2**, including *"still reading: expected false to be true"* |

One case **reproduces the flash itself**: with nothing watching, the same `whenIntakeFree` call fires immediately rather than deferring. Without it the other cases could pass on a guard that never did anything.

**I changed another gate's assertion, and say plainly why.** DR-0748's wiring case read `expect(main).toContain("import { watchTypedIntake } from './lib/intake-guard.js';")` — an exact line. Co-importing a sibling watcher from the same module turned it red **with the wiring it protects fully intact**. It now asserts the *property* (that `main.jsx` imports the watcher from the guard) and keeps its ordering checks untouched, and the same gate gained a case pinning the new wiring — one place still says what `main.jsx` must do at boot, for words and for use.

**Two errors of mine on the way, both the same species.** My first break attempt put a Python `#` comment into JavaScript, so the file did not parse and the run reported **"no tests"** — neither a catch nor a pass. That is the fifth reading today that looked like a result and was not: the curriculum CLI with no flag (exit 0, no output), a `pull_request` CI run parked at `action_required` (a non-success with zero jobs), a fixture whose courses declared nothing yet went green, two vitest worker crashes read as a test failure, and this. **A reading with no work behind it is not a result** — stated once here because it recurred all day.
