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

## The honest remainder

**This is the decider, not yet the wiring.** The reducer is pure, tested and correct about *when* and *where*; nothing in `TTSControl` calls it yet, so the behaviour is not live for a reader. That is deliberate — the decision logic is the part that is hard to get right and easy to get wrong invisibly, and it is now fixed and proven. **re-review: 2026-09-27** — subscribe `TTSControl` to `subscribeReadTarget` through this fold, render the way-back control in the panel, and scroll to the sentence on arrival via the `read-follow.js:614` mechanism the reader already uses mid-read.

Stated plainly because a tested primitive can look like a shipped feature and is not one: **if he leaves a lesson today and comes back, the app still does not carry him to the sentence.** The reason it will is now built and proven; the wire is not yet in.
