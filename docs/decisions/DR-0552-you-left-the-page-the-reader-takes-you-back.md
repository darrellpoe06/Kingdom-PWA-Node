# DR-0552 — You left the page; the reader takes you back to the sentence

- **Status:** accepted
- **Date:** 2026-09-20
- **Type:** feature
- **Relates to:** DR-0439 (screen stays on; the CONTINUE offer and its flash-and-vanish lesson), DR-0264 (read-follow — highlight and keep-in-sight), DR-0061 (reality-trace before building), DR-0076 (verification doctrine)

## What he asked

> *"If and when you leave the page to do something necessary and want to come back in and listen to what you were just listening to and the system needs to be able to keep reading and move them back to the highlighted sentences and pages right away from the reader... make sense?"*

Sent from his phone with the Read Aloud panel showing **Paused**.

## The reality-trace, because most of this was already built

**Already true, and worth stating before claiming any gap:**

- The sentence is recorded on **every spoken segment** — `TTSControl.jsx:241` `rememberSentence` → `learn-resume.recordPlace`, guarded so only the lesson the place names is ever stamped.
- A short non-reversible **fingerprint** rides with the index, so a re-paced lesson cannot resume silently in the wrong place.
- `savedStartIndex()` (`TTSControl.jsx:367`) already starts a read **at that sentence**, not the top.
- The **screen-off** case is solved end to end: the watchdog never resets position while hidden, the current segment is re-spoken on return (`tts-keep-place-screen-off.test.js`), and a ▶ CONTINUE offer appears if the engine's own recovery fails.

**The gap.** Every one of those recoveries hangs off `visibilitychange` — the screen going dark or the app being backgrounded. **In-app navigation fires none of them.** `TTSControl` is mounted at the app root (`poe-financial-mvp-v28.jsx:5163`) so the reader survives the route change, but the lesson's DOM unmounts, its ranges point at nodes that no longer exist, and **nothing uses the intact place record to carry the reader back**. The place was remembered. Nobody took him to it.

## The signal, and why no new bookkeeping was added

A surface that owns a reading registers it with `setReadTarget(owner, …)`, and its unmount calls `clearReadTarget(owner)`. **Leaving the page therefore already emits a precise, owner-keyed event**: the target goes from `{owner: X}` to `null` while the place record still names lesson X and a sentence inside it. That transition *is* "the reading lost its page" — no visibility event, no timer, no extra state.

## Built — `lib/reader-return.js`, a pure reducer

The hard part is not the scrolling. It is deciding **when an offer is honest**, and four cases must come apart cleanly — two of them silent:

| How he left | What happens |
|---|---|
| mid-read | offer the way back, **and resume** on return |
| after **pausing** | offer the way back, **never restart the audio** |
| after **finishing** | silent — `finishPlace()` already ran; there is nothing to return to |
| never left | silent |

Encoding that in a component effect would make it untestable without a browser and invisible to review. As a reducer it is a dozen lines and every branch is pinned.

`returnPlan()` always carries **`scrollTo: <sentence>`** — that is precisely the half he asked for that did not exist — plus the fingerprint, so the caller resolves through `learn-resume.findSentence` rather than trusting a bare index. `speak` honours how he left.

**It never nags a deliberate pause.** That is the DR-0439 lesson inverted: that record fixed a CONTINUE offer that flashed and vanished; the mirror failure is an offer that takes a deliberate pause and starts talking again. His pause is his — the way back is offered so he can take it in one tap, and the audio is never restarted for him.

## Verification

11 tests. **Proven-to-catch, not asserted:** the first draft of the reducer had a real bug — it returned `IDLE` while the page was present, throwing away the fact that a read was live, so by the time the unmount arrived nothing knew there had been a reading and **the offer could never fire**. That defect was reintroduced deliberately after the fix (`held: false`) and **6 of 11 tests failed**; restored, all 11 pass. The tests measure the thing they claim to.

Also pinned: no place record → no offer; a place with **no sentence** → no offer (that would send him to the top, which is the complaint); a page that was never being read → no offer, so an old saved place cannot make every navigation pop a prompt; and wandering into a **different** lesson neither clears nor hijacks the held one.

## Wired the same session

The record above first closed with the wire-up dated **2026-09-27**. That was the wrong call and it was corrected within the hour: DR-0236 says plainly that "later" is not a scheduling tool for work that can be built and verified now, and this could. **The reader is wired.**

- `TTSControl` folds the same observations it already holds (`target`, `isReading`, `isPaused`, `getPlace()`) through `foldReturn`, and renders a **↩ Take me back** control beside the existing screen-went-dark offer, using its exact shape and the same dismiss.
- Pressing it calls `requestRead(lessonId)`, which re-arms the reader the moment that lesson re-registers — and `savedStartIndex()` then lands the read on the sentence, which was already built and simply had no way of being reached after an in-app navigation.
- The label matches how they left: *"Back to where it was reading"* or *"Back to where you stopped"*.

**Two real defects were caught in the wiring itself, both by measurement rather than reading:**

1. **The temporal-dead-zone trap, again.** The first placement of the fold put its `useEffect` **above** `const [target, setTarget]`. A dependency array is evaluated during render, so that throws on every mount of the reader — the identical failure this file already records costing 67 render failures at `rememberSentence`. Re-homed below the declaration, with the reason written beside it.
2. **`requestRead` was called and never imported.** This is the one that matters, because of *how* it was found. **Every existing reader render test stayed green** — 9 of 9 — since none of them presses this button. The break lived only on the path a person actually takes.

So a render test was written that mounts the real reader, drives the real departure (`setReadTarget` → `clearReadTarget`, which is exactly what an in-app navigation does) and **presses the button**. Proven by reverting: with the import removed, the other reader render tests pass 9/9 and this one fails. That is the whole argument for a render test over one more unit test of a decider.

It also caught a third thing, in the test rather than the app: `getPlace()` refuses a record with no `courseKey`, so a place written without one reads back as `null`. The running app always has it — the lesson space writes the course and `TTSControl` only *merges* `sentence`/`sentenceKey` onto it — but the test had to be honest about the real contract rather than a convenient one.

**17 tests across the two files** (11 decider + 6 render), three of them proven-to-catch.

## The honest remainder

- **Not yet observed in the running app.** The behaviour is proven in jsdom against the real component, not watched on a device. The sandbox has no route to poetech.us, so the live pass is the standing reviewer-mode step after deploy (DR-0104), not a claim made here.
- **The scroll on arrival rides `savedStartIndex`, not an explicit scroll call.** Landing the read on the sentence is what moves the view, via the follow-along path the reader already uses mid-read. If a lesson is opened but the read is NOT resumed (the deliberate-pause case), the view is not independently scrolled to the sentence. **re-review: 2026-09-27** — give the paused case its own scroll so the way back lands the eye as well as the voice.
