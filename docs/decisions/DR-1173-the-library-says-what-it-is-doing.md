# DR-1173: The library says what it is doing — a wait with no words and no ceiling is the same lie as a green that means nothing

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (a user-facing surface Darrell was looking at; bounds a wait and adds words, changes no data path)
**Type:** way

**Area:** `app/src/components/FamilyStories.jsx`, `app/src/__tests__/the-big-picture-is-the-familys-years.test.jsx`.

**Principles:** DR-0076 (unknown must never look like work in progress); DR-0061 (reality-trace — name the real read before touching the surface); DR-0065 (the app is the primary artifact); DR-1153 (the surface this repairs).

## Context

**Darrell opened "Our years in pictures" on his phone at 01:34 and it sat on "Opening the library…".** He sent the screenshot with two words: *"Fix it..."*

Reading the surface, the screen could not tell him anything either. Every other outcome `FamilyStories` can reach draws a card that **says what happened**:

- `no-key` — explains how a signed-in family device connects itself, no password typed;
- `unreachable` — *"The library did not answer"*, plus a **Retry**;
- `empty` — *"The first picture starts the first chapter."*

Only the slow path said nothing: one line, no elapsed time, no ceiling, no way on. **A dead library and a slow one looked identical.**

And the wait is not short. `fetchLibraryYears` carries a **45-second** timeout. If the server answers 404 on `/library/years`, the component falls back to probing **36 months at `AT_ONCE = 3`** with the same 45s timeout each — a worst case of **(36 ÷ 3) × 45s ≈ nine minutes** on that one silent line.

## What was measured

Read from the code on `origin/main`, not inferred:

| | |
|---|---|
| `fetchLibraryYears` timeout | **45,000 ms** (`nas-photos.js`) |
| legacy probe | **36 months**, `AT_ONCE = 3`, 45s each → **~540 s** worst case |
| what the screen showed for all of it | `Opening the library…` — **no elapsed time, no bound, no retry** |
| states that DO explain themselves | `no-key`, `unreachable`, `empty` — all three draw a card |

**The server is not the defect here.** `infra/nas-property-photos/photo_server.py:1287` does serve `/library/years`, so the nine-minute legacy path should not normally fire. **What I could not do is observe the live failure** — this sandbox has no route to poetech.us or to the NAS (the egress proxy refuses both; measured tonight at 403 on CONNECT). So the precise live cause of his hang is **not established**, and this record does not claim it. What is established is that whatever the cause, **the screen was unable to say so**, and that is the defect fixed here.

## Decision

**The first load is bounded.** `FIRST_LOAD_BUDGET_MS = 25000` — comfortably longer than a healthy years round trip, far shorter than the probe worst case. When it expires with the screen still loading, the status becomes `unreachable`, which is the card that **already exists** with its Retry. No new state, no new copy to maintain: the honest outcome was already built, and the slow path simply never reached it. In-flight reads stop themselves through the load effect's own `cancelled` flag.

**The wait speaks.** Under 3 seconds it still reads *"Opening the library…"* — a brief wait needs no explanation. After that it names the real read and counts: *"Reading the years from our own library on the NAS… 7s"*, and past 8 seconds adds *"it is taking longer than usual"*. A slow library is now distinguishable from a dead one **by looking at it**.

**Why a ceiling rather than a faster read:** making the read faster is a different change on the NAS side, and it would still leave a silent screen whenever the road is bad. The screen's job is to tell the truth about what it knows, and it can always do that.

## Impact

**The worst case Darrell can see drops from about nine minutes of silence to 25 seconds ending in a sentence and a button.**

**What this does not do:** it does not make the library load, and it does not diagnose why his did not. If the NAS is genuinely unreachable from his phone's road, he will now get *"The library did not answer"* in 25 seconds instead of an indefinite spinner — which is the honest answer, not a fix for the road. **`re-review: 2026-10-22`** — ask him whether it now answers or reports, because those are different problems and only he can see which one he has.

**The gap I could not close:** nobody has seen this rendered. The sandbox cannot reach the site, and the repo's real-browser sweep does not sign in, so no witness renders this panel. Stated here rather than left for a reader to assume.

## Verification

**20 cases** in the suite (4 new), and **two are proven to catch by breaking the component**:

| what was broken | what went red |
| --- | --- |
| the watchdog removed — the live hang, exactly | **1** — *"expected \<p …\>\</p\> to be null"* (it sits on `stories-loading` for ever) |
| the silent one-line loader restored | **1** — *"expected 'Our years in pictures…' to match /\d+s/"* |

Restored both times: **20 passed**. A third case pins that the budget sits **below** the probe worst case and **above** a healthy read, and a fourth pins that a library which answers normally is **never** cut off by the budget — the regression that a careless ceiling would cause.

Timers are faked per-case, because this suite does not fake them globally and one earlier case already owns its own.

`npm run lint` exit **0** · `npm run verify:gates` exit **0**, read without a pipe.
