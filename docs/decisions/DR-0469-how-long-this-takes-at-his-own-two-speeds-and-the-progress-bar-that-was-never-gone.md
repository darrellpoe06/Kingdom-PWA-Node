# DR-0469 — How long this takes, at his own two speeds, and the progress bar that was never gone

- **Status:** accepted
- **Tier:** B (a learner-facing surface on the front door of every course; it makes a quantitative claim to a reader deciding whether to commit)
- **Date:** 2026-09-18
- **Type:** app
- **Scope:** `app/src/lib/course-duration.js` (new), `app/src/components/ChurchLearn.jsx` (the time panel on every course door; the signed-out progress note), `app/src/__tests__/course-duration.test.jsx` (new, 23 checks)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §4 — measure, don't claim), REALITY-TRACE (DR-0061 / P15), SPEAK-ESTABLISHED-FACT (DR-0100), PERPETUAL-IMPROVEMENT (DR-0075), DO-THE-WORK (DR-0111)
- **Grounds:** DR-0381 (a hollow surface renders its empty state over real content — gated), DR-0215 (the SPOKEN_WPM measure), DR-0418 (each band is authored in full, which is why the level changes the length)

## Why this exists

Darrell, 2026-09-18:

> "Can you put the time it takes to go through the course at 1 and 1.5 speeds? Users can see the actual time they can expect to spend also what happened to the progress bar?"

Two asks in one message, and the second is a regression report, so it was traced first.

## The decision

### a. THE PROGRESS BAR WAS NEVER GONE — and this was established by OBSERVING the running component, not by reading the code and reasoning

The reality-trace rule exists because inference keeps standing in for observation in this repo (DR-0061; and the PayPal token of DR-0361, where a URL *shape* was reasoned about instead of opened). So the component was mounted in a real DOM and inspected.

**Measured:** signed in, the `Class progress` bar renders on **all nine** department tabs and counts correctly — with two real lesson ids marked done it reads `2 of 171 · 1%`. Nothing had removed it.

**The one state that reproduces a missing bar** is the shell's own line:

```
toggleModule={authSession ? toggleClassModule : null}
```

The panel renders on `toggleModule && !focusModule && prog`, so **signed out the entire panel vanished** — no bar, no percentage, not even the heading. An unexplained absence on a surface that had something there yesterday reads exactly like a break, which is what was reported.

**The fix is an explanation, not a bar.** Progress is genuinely per-person and cannot be shown without a person. The tempting fix — render the bar at 0% — would assert that a reader the app cannot identify has completed none of it, which is a painted number about a nonexistent record. So the absence now states its own reason and makes clear nothing is locked. **A check holds that no percentage appears in that note**, because 0% is the regression a future "improvement" would introduce.

**One correction of my own, recorded because it nearly became a false report.** My first probe showed `0 of 171 · 0%` with two lessons marked done and I was one step from reporting a counting defect. The lesson ids I had invented were wrong (`ll1-perfect` for the real `ll1-the-perfect-yahweh-expects`). The counter was fine. Checking the fixture before believing the finding is the whole of what saved that.

### b. THE APP ALREADY KNEW HOW LONG EVERYTHING TAKES, AND SHOWED NONE OF IT

Two facts found by looking rather than guessing:

- **`RATE_STEPS` in `lib/tts.js` already offers 0.7×, 1×, 1.5×, 2× and 2.5×** — the two speeds he named are real, named steps (`Normal` and `Faster`) that a reader can already tap.
- **`lessonPlanForAge` has computed `estimatedMinutes` per lesson per age band since the framework was written, and it had ZERO consumers anywhere in the app** — computed on every lesson open and never once rendered. The same class as Today's Focus shipping as a tested lib with no caller (DR-0464).

So nothing here invents a number. It aggregates numbers the reader is already being served, and shows them where the decision is actually made — the course door, before entry.

### c. THE MEASUREMENT CORRECTED THE DESIGN BEFORE IT SHIPPED, AND THIS IS THE DECISION THAT MATTERS MOST

The first draft reported a **read time** from that `estimatedMinutes`. Measured across the 171-lesson series it came out at **736 hours for the adult band against 55 hours of listening — a factor of thirteen.**

The cause: `estimatedMinutes` is `segments × the band's segmentMinutes`, and **`segmentMinutes` is a FACILITATED SLOT BUDGET** — 25 minutes for adults, 5 for children, how long a teacher spends on a chunk in a room. It is not how long the prose takes to read. Handing it to a learner as "time to read", or dividing it by a playback rate, would have produced an entirely plausible-looking number that means nothing. **That is the painted-number failure DR-0076 §4 names, and it would have shipped on the one surface whose whole value is letting a person trust a commitment.**

So the decision:

- **The learner-facing number is LISTEN time only** — spoken words ÷ `SPOKEN_WPM` ÷ rate — which is exactly what a speed multiplier applies to, and exactly what he asked for.
- **The slot figure is still returned, renamed `slotMinutes` for what it actually is**, because a facilitator planning sessions genuinely needs it. It is simply never presented to a learner, and **a check asserts it does not leak onto the panel in any rounding**.
- **No silent-reading pace was invented.** The app does not have one, and making one up is the same failure wearing a friendlier face. That omission is stated in the module header rather than left as a gap someone later "fixes" with a guess.

### d. Every number is derived from the functions the lesson player itself uses

`resolveForAge` picks the text, `lessonPlanForAge` chunks it, `planSessions` counts the spoken words, `SPOKEN_WPM` sets the cadence, `RATE_STEPS` supplies the speeds. A course door that computed its own pace would eventually disagree with the strip inside the lesson, **in front of the same reader**, and the reader would be right to stop trusting both.

The speeds are **filtered from** `RATE_STEPS` rather than listed independently, so a speed can never be advertised that the player cannot do — remove 1.5× from the control and this stops claiming it instead of lying. A break proves it: asking for 1.75×, which the control does not offer, yields nothing rather than a fabricated step.

### e. The time responds to the reader's level, and says which level it describes

Each band is authored in full (DR-0418), so the bands genuinely differ in length. Measured: **child 30.5 hours at 1× / 20.3 at 1.5×; adult 55.3 / 36.9**; about 11 minutes per lesson for a child and 19 for an adult. A panel that showed one band's time to every reader would tell a parent something false about their own child's time, so the level is named as part of the claim and a check holds it.

### f. Shown to a signed-out reader, on purpose

The time is what someone needs *before* deciding, whether or not they have an account, so this panel is deliberately not gated on sign-in — unlike progress, which cannot exist without a person. A break that gates it behind `toggleModule` fails.

## Verification (DR-0076)

- **The progress-bar answer is an OBSERVATION, not a reading**: the component mounted in a real DOM, every department tab clicked, the bar found on all nine, and the counter confirmed against real lesson ids.
- **The 736-hour read time was caught by measuring the lib against the real 171-lesson series before it was wired to anything.**
- **`formatDuration` returns null for zero rather than "0 min"**, because zero is a claim that the course is empty; the caller renders nothing. Whole hours carry no decimal, since "4.0 hours" is the tell of a number that came out of a machine.
- **A real bug in my own lib, caught by my own gate**: `const r = Number(rate) || 1` silently turned an explicit `0` into 1× and returned 0.71 minutes for an impossible request — so the guard clause that claimed to refuse a zero rate did not. It now falls back to 1 only for a NON-numeric rate and lets a numeric-but-invalid one reach the guard. The check was right and the code was wrong, which is the correct order.
- **23 checks; 17 breaks applied for real across BOTH files, each required to fail the named check. 17 of 17 caught on the first pass, 0 bad breaks** — including the two that matter most: the slot budget leaking onto the learner panel, and the signed-out note painting a percentage.
- The monolith was not touched (0 lines changed), so the DR-0246 freeze is unaffected.

## What is still NOT proven

- **Not yet seen on his own phone.** This is measured in a real DOM and in the lib against the real corpus, but the on-device look is his. The layout follows the existing panel idiom next to it rather than introducing a new one, which is the cheapest way to be wrong about spacing only.
- **Whether `SPOKEN_WPM = 140` matches the voice he actually uses.** It is the app's own documented cadence (DR-0215) and the same number every other estimate in the app runs on, so this is consistent rather than independently validated. If a measurement of the real reader comes in different, one constant changes and every surface follows it.
- **The listening total assumes a reader hears the whole thing.** It is a ceiling, not a prediction of any individual's path, and the panel says "for the whole thing" rather than implying otherwise.

## Files

- `app/src/lib/course-duration.js` — new
- `app/src/components/ChurchLearn.jsx` — the time panel; the signed-out progress note
- `app/src/__tests__/course-duration.test.jsx` — new, 23 checks
- `docs/decisions/INDEX.md` — row + pointer
