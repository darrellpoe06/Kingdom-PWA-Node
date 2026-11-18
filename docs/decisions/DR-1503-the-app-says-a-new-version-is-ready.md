# DR-1503 — The app says a newer version is ready while a reading plays

**Date:** 2026-11-13 · **Status:** accepted · **Tier:** A · **Area:** the update lifecycle; the reader
**Principles:** VERIFICATION-DOCTRINE, SPEC-CONFORMANCE, PERPETUAL-IMPROVEMENT
**Reserved:** `refs/heads/reserve/dr-1503` on origin, before a word was written.

## Context

DR-1498 (PR #2688, 2026-11-13) found why Darrell kept hearing reader faults that were already fixed and deployed: his long-open tab was still running the old bundle. `app/src/lib/sw-update.js` finds a new build every ten minutes and whenever the tab comes back into view, then holds the reload while a reading plays (DR-0748, `lib/intake-guard.js`). The hold is right; a reload never cuts a sentence in two. But nothing told him. A long reading session stayed on the old build in silence. His standing direction: the app tells the truth about its own state.

## What was measured

On `origin/main` fd36c00167b:

- `sw-update.js:297-310`: the controllerchange reload goes through `whenIntakeFree`; when deferred it records a journal line and dispatches nothing the screen reads.
- `components/PwaPrompts.jsx` `UpdatePrompt` returns null while any hold is held, so even the "Updated" toast stays away during a reading.
- `sw-update.js:425-434` (`watchLiveBuild`): when the server is ahead and no worker is waiting, the timer reloads with no hold consulted. After the worker path has swapped and deferred, no worker is waiting, so this path could reload mid-reading.
- `use-read-aloud.js` is 1499 lines against the 1500 new-file ceiling; its hold is one line, `useIntakeHold('reading', ...)`, at :570.

## Decision

1. `lib/update-while-reading.js` (new, 155 lines): when a reload is deferred and a reading is the reason (now, or later in the same wait), it shows one line, once per build. A tap drops the deferred reload, stops every playing reader with its own `stop()`, and loads the new build at once.
2. `sw-update.js` offers the line at both seams: the controllerchange deferral (key `sw`) and the live-build timer. The live-build timer now waits for a reading as the worker path does (key = the live sha). With no reading held, both paths behave exactly as before.
3. `UpdatePrompt` (the existing update toast) draws the line at the top: `role="status"`, a 44px tap target, and the words "A newer version of the app is ready. It will load when this reading ends — or tap to load it now."
4. `use-read-aloud.js` stays net zero. Two lines change: the import, and `useReadingHold(!!(tts.isReading || cloudPlaying), stop)`, which takes the same hold and keeps the reader's stop for the tap.
5. A paused reading still holds, as before. A paused reader keeps its place, and a reload would lose it. The update loads when the reading ends or is stopped, and the line offers the tap the whole time. `re-review: 2026-11-27`: if a paused reading should release the hold, decide that against whether the reading position survives a reload.

## Impact

A reading never hides that a newer version is waiting. The person chooses: finish the reading, or tap and load it now. The reader files that open PRs #2688 and #2682 edit (speech-shape, read-follow, clip-queue, reading-voice-hold, keep-voice-on-wifi) are untouched.

## Verification

`app/src/__tests__/update-while-reading.test.jsx` has 9 cases: update + reading shows the line once and its tap stops the reading and reloads once; reading ends loads as before; no update shows no line; update with nothing reading reloads at once; a typing hold waits as before, with no line; one line per build; the live-build timer never reloads mid-reading, and reloads as before with nothing reading; the use-read-aloud seam and its line budget. Proven to catch: against `origin/main`'s sw-update, PwaPrompts and use-read-aloud, 5 of the 9 fail; the 4 unchanged-behaviour cases pass on both. `nothing-interrupts-your-words` pins the new seam. The 86 suites touching sw-update, intake-guard, use-read-aloud, TTSControl and PwaPrompts pass (949 tests), along with eslint (full src), file-budget-guard and format-guard.
