# DR-0748 — Nothing interrupts your words: the app holds still while a message comes in

- **Status:** accepted (built and proven in the suite; the live proof is the next update that lands while a recording, a dictation or a typed note is in progress on his phone, and the note arriving whole)
- **Tier:** A (a deferral of the app's own reload and banners while a person is speaking, typing, listening or downloading; no table, no policy, no money; nothing is dropped, only moved to after the intake)
- **Type:** improvement
- **Date:** 2026-10-02
- **Scope:** `app/src/lib/intake-guard.js` (new: `holdIntake`, `intakeHeld`, `intakeKinds`, `intakeWords`, `subscribeIntake`, `whenIntakeFree`, `isTypingTarget`, `watchTypedIntake`, `useIntakeHeld`, `useIntakeHold`, `QUIET_MS`, `RESULT_HOLD_MS`, `TYPING_IDLE_MS`), `app/src/lib/sw-update.js` (the controller-swap reload waits for the words; `state.deferred`, `state.deferredFor`), `app/src/lib/chunk-reload-heal.js` (the heal reload waits; the error is left to the boundary meanwhile), `app/src/components/PwaPrompts.jsx` (no toast, no install nudge while held), `app/src/components/ArrivalsBell.jsx` (no self-open on launch while held; it opens once free), `app/src/lib/workflow-scribe.js` (holds `recording` for the take and `recording-kept` for the unsent result, ten minutes at most), `app/src/lib/voice-dictation.js` (holds `dictation` while the mic is on), `app/src/lib/use-read-aloud.js` (holds `reading` while a reading plays), `app/src/lib/lesson-downloads.js` (holds `download` for the run), `app/src/main.jsx` (`watchTypedIntake(document)` from boot), `app/src/__tests__/nothing-interrupts-your-words.test.jsx` (new), `docs/decisions/INDEX.md`.
- **Principles:** VERIFICATION-DOCTRINE (DR-0076: every taker of the screen is proven to wait, and the gate is shown to fail against the old handlers), DR-0100 (the deferral is said in plain words in the journal: "update reload waited: you are recording"), DR-0075 (the zero-click update stays zero-click; only its moment moves), DR-0107 (the update still lands; a down site is not traded for this), HOLD-THE-HAND (DR-0621), DR-0611 (a lesson spoken into the app is the primary source; losing it is the worst outcome of the intake).
- **Grounds:** Darrell, 2026-10-02, after a spoken message of several minutes was lost when something arrived on the screen while he was still speaking: *"Input is coming into the app and it prompts you to do something.... undermining your voice input.... multiminute!"* and then: *"let's build a safety into the PoeTech App.... so it can't interfere with the message intake from a voice message nor a texts as they are occurring... possible?"*

## Context

**SHOULD.** While a person is speaking, typing, listening or downloading in PoeTech, nothing the app does on its own may take the screen or the page from under them. A spoken lesson, a dictated note, a typed message: these are the primary source the app grows from (DR-0611, "Spoken Teachings Are Build Input"), and the app that loses one undermines its own purpose. The zero-click update (DR-0054 lineage, `sw-update.js`) and the stale-chunk heal (DR-0139) are right to reload the page; they are wrong to do it at that moment.

## What was measured (SHOULD → ARE → GAPS, DR-0219)

**ARE, on main `8b471cf4` before a line was written.**

1. `sw-update.js` `controllerchange` handler: on a real controller swap it set the sentinel and called `location.reload()` at once. A new build deploys several times a day on this lane (DR-0103); the installed app on a phone re-checks on every focus (`startUpdateChecks`), so a build landing during a recording reloaded the page during the recording.
2. `workflow-scribe.js`: the take's chunks live in memory (`chunksRef`) until the person sends them; the result after Stop is a Blob in memory too. A reload at any point from Start to Send loses the whole take, and nothing said so.
3. `voice-dictation.js`: the mic session is in memory; a reload mid-dictation loses the words not yet committed and the live interim words.
4. `chunk-reload-heal.js`: a lazy chunk failing after a deploy reloaded the page on the spot, whatever was in progress.
5. `PwaPrompts.jsx`: the install nudge rendered the moment `beforeinstallprompt` fired; the "Updated" toast the moment `poetech:updated` fired, over whatever box was in use.
6. `ArrivalsBell.jsx`: the dock instance opened the arrivals list by itself on launch when something was new (DR-0741), and would do so over a box being typed in if the launch happened to land there.
7. A reading in progress (`use-read-aloud.js`) and a download in progress (`lesson-downloads.js`) were likewise reloadable from under the person.

**The incident that grounded this was in another app.** The spoken message Darrell lost on 2026-10-02 was being dictated into the Claude app, and what interrupted it were messages arriving there; nothing in PoeTech was lost that day. The ask is to make sure PoeTech can never do the same, and the measurement above shows it could.

**GAPS.** (1) No notion anywhere in the app of "words are coming in now". (2) Seven takers of the screen or the page, none of which asked. (3) A finished recording unsent is as exposed as one mid-take.

## Impact

While a person records, dictates, types in any box, listens to a reading or has a download running, the app holds still: the update reload and the heal reload wait and run once they have been free for three seconds; the install nudge and the "Updated" toast stay away and show once they are free; the arrivals list does not open itself and opens once they are free. A finished recording not yet sent holds the app still for ten minutes. Nothing is dropped: the update is still applied, the install event is kept, the launch open still owes itself. The journal records each wait in plain words so a steward can see how often an update had to wait and for what.

## Decision

1. **One hold, named by what it protects** (`intake-guard.js`): `holdIntake(kind)` returns a release; `intakeHeld()` and `intakeKinds()` say the state; `intakeWords()` says it in plain words ("you are recording", "you are typing and you are speaking"); `subscribeIntake` and the `poetech:intake` window event carry each change. Kinds: `recording`, `recording-kept`, `dictation`, `typing`, `reading`, `download`.
2. **Deferral is a wait, not a drop** (`whenIntakeFree`): runs at once when free; otherwise after the intake has been free for `QUIET_MS` (3 s), so a Stop followed at once by typing into the box does not get cut in two; a hold taken again inside the quiet time starts the wait over; the deferred action runs once.
3. **Typing is watched from boot** (`watchTypedIntake(document)` in `main.jsx`): a hold is taken while a text field, textarea or editable element has focus AND words in it; released when the field is left (a Send blurs it), emptied, or idle for `TYPING_IDLE_MS` (2 min). An empty focused box is not intake.
4. **Every taker of the screen or the page asks first**: the controller-swap reload (`sw-update.js`; the sentinel is set only with the reload that runs, so a waited swap is never misread as a loop; `state.deferred` counts the waits and the journal records each as a heal entry naming the words); the chunk heal (`chunk-reload-heal.js`; while held the error is NOT swallowed, so the boundary says the screen did not load, and the reload comes when free); the toast and the install nudge (`PwaPrompts.jsx`, `useIntakeHeld`); the bell's launch open (`ArrivalsBell.jsx`; the launch key is not spent while held, so the open is owed and paid once free).
5. **The sources of words take the hold themselves**: the recorder holds `recording` from `MediaRecorder.start` to `onstop` and `recording-kept` from `onstop` for `RESULT_HOLD_MS` (10 min) or until the next Start or unmount; the mic holds `dictation` from engine start to session end (stop, cap, or error); the reader holds `reading` while `tts.isReading || cloudPlaying`; a download holds `download` for the whole run, released in `finally`.
6. **A manual tap is the person's own**: `applyUpdate` (the "Reload to update" tap) and every "Reload" button in a boundary are not deferred; the person asked.

## Verification

- `nothing-interrupts-your-words.test.jsx` (20 tests, jsdom): the hold is taken, said, released and heard; `whenIntakeFree` runs at once when free, waits through a hold of any length and the quiet time, starts over when a hold returns inside the quiet time, runs once, and can be cancelled; **proven to catch:** a controller swap while recording does not reload, a half-hour later still has not, and reloads once after the take plus the quiet time with the sentinel set only then (3 of 20 fail against the old `sw-update.js` and `chunk-reload-heal.js`, measured by stashing them: reloads were 1 where 0 is required); the heal while typing does not reload and does not swallow the error, then reloads when free; the toast and the install nudge wait and then show; the dock bell does not open on launch while held and opens once free with the launch key spent only then; a new arrival while held opens nothing; the typing watcher takes the hold on words, holds through thinking pauses under the idle time, releases on idle, on blur and on an emptied box, and stops watching when stopped; the wiring is pinned in source for every taker and every source.
- `sw-update.test.js` (20), `chunk-reload-heal.test.js` (9), `pwa-prompts-render.test.jsx` (11), `every-arrival-counted.test.jsx` (32), `the-local-app-carries-the-house-address.test.js` (31): unchanged and green; the healthy path (nothing coming in) reloads and shows exactly as before.
- Lint clean on every touched file.
- **Live proof:** a deploy landing while a note is being dictated into Thinking Space on his phone, with the journal (Quality board) carrying "update reload waited: you are speaking" and the note arriving whole. `re-review: 2026-10-09`.

## Limits, stated

1. The hold is in-page state. A reload the browser itself does (memory pressure, a tab discarded in the background) is outside the app's reach; the recorder's one-chunk-a-minute and one-slice-a-second handovers (DR-0611) bound that loss, and a chunk upload during the take is the structural answer, tracked there.
2. `TYPING_IDLE_MS` is two minutes: a box left with words in it overnight does not hold an update forever. A person who thinks longer than two minutes between keystrokes and then has the update land is a case this record accepts; the next keystroke takes the hold again.
3. A reading in progress holds the update too. A listener who plays lessons for an hour delays the update an hour; the update lands at the end. This is by design: the reading is also the person's.
4. Push notifications from the OS (DR-0728) are the system's, not the page's, and are not held; they do not take the page.
