# DR-1181: Your words are kept while you write them — a hold is not a save

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (a person's own writing on a surface they trust; device-local only, nothing egresses)
**Type:** fix

**Area:** `app/src/lib/draft-autosave.js`, `app/src/components/LessonStories.jsx`, `app/src/__tests__/your-words-are-kept-while-you-write.test.jsx` (new).

**Principles:** DR-0748 (nothing interrupts your words — the app holds still); DR-0131 (one input primitive); DR-0611 / Layer 0 *Spoken Teachings Are Build Input* (what a person writes here is the primary source the app grows from); DATA-AS-EMPOWERMENT (a draft is the writer's own words on their own device); DR-0076 (a promise on the screen must be one the system keeps).

## Context

**Darrell, 2026-10-21:** *"Where did my text and typing go?!!!!!!!!!!!!!!!!"*

## What was measured

**The app already has a draft keeper, and it protects exactly one box.** `draft-autosave.js` was built on 2026-07-10 for Christina — *"Can you see if you can automatically save your notes like a google doc without hitting save. So when you stall out with time or forget and come back, your information is still there."* It is wired to `OneVoiceInput` (the Thinking Space) and to nothing else.

**The app also already holds still while you type.** DR-0748 built `intake-guard.js`: a `typing` hold taken while a field has focus and words in it, which makes the update reload, the chunk heal, the install nudge, the "Updated" toast and the arrivals bell all wait. Seven takers of the screen, each proven to wait.

**A hold is not a save, and the gap is everything the hold does not cover:**

| | |
|---|---|
| the hold releases after | **`TYPING_IDLE_MS` = 2 minutes** of not typing — a pause to think, and the reload may land |
| a browser refresh, a phone discarding the tab, a crash | **never held at all** |
| a component remount from a nav change | **not a page reload, so not held** |

**And the worst-exposed box is a lesson's perspective form** (`LessonStories.jsx`): a title, a verse, *"Who lived it"*, and a **six-row story body**, seeded by `perspectiveDraftFor`, whose own docstring says what it is — *"The empty form for a new perspective."* It persists nothing.

**The form's own copy promised otherwise.** *"Saved on this device. It could not reach the shared queue just now; it is kept here and nothing is lost."* True — but only **after** a submit that failed to reach the queue. Before the Share tap there was nothing on the device at all, and a person reading that line had every reason to believe their words were safe.

## Decision

**The same keeper, widened to a form — in the same file, not a second road beside it.** `writeFormDraft` / `readFormDraft` / `hasWords` / `draftWrittenAt` join `readDraft` / `writeDraft` / `clearDraft`, sharing one discipline: injectable storage, a private window that throws is survived, a corrupt draft reads as the blank form, and an emptied form **clears** rather than lingering.

**Words means what the PERSON wrote, measured against the seed.** `hasWords(form, blank)` compares each word field to the blank the form started from. Found by this record's own suite: `perspectiveDraftFor` pre-fills `verse` with the lesson's first anchor as a courtesy, so a plain non-empty test called an **untouched form** a draft — it would have persisted something nobody wrote and shown *"Kept on this device"* over an empty form. **A promise to keep nothing is worse than no promise.** A verse the person *changes* is theirs and is kept; the one the app offered is not.

**The attestation is never restored, only the words.** `NEVER_RESTORED` holds `consent` — *"I lived this, or the person who did has agreed to share it, and it may be shown to my space with this name."* Restoring a ticked box from storage would re-make that promise days later without the person looking at it. The story comes back; the promise is made again, by them.

**A stale draft cannot smuggle in a field.** Only keys the blank form declares are restored, so a draft written against an older shape degrades to the blank form rather than half-filling a new one.

**The draft clears on a share that actually reached the queue, and on nothing else.** A signed-out save or a failed reach leaves it exactly where it is.

**And the screen says so.** A person who has just watched a page eat six rows of their own writing is not reassured by an invisible save, so the form says, once there is something to keep: *"Kept on this device as you write — close this, reload, come back tomorrow, and your words are still here. They reach your space only when you tap Share."* Shown only when words exist, so an untouched form makes no promise.

## Impact

**The story survives a reload, a discarded tab, and tomorrow.** Per lesson, on the person's own device, nothing egressing until they choose to share.

**What this does NOT do.** It fixes the perspective form. **Every other multi-field box in the app is still unprotected** — the mechanism is now general, and wiring each remaining surface is the follow-on, not this change. **`re-review: 2026-10-28`** to name and wire them.

**And it does not tell me which box ate Darrell's words.** This sandbox cannot see his screen or his storage. The perspective form is the one that provably could not keep them, so it is the one fixed; if what he lost was somewhere else, the loss is still real and still mine to find.

## Verification

**11 new cases** plus the existing keeper's own 7: **18 passed**, and the lesson-story suite unchanged at **27 passed** across all three.

**Two proven to catch by breaking the code:**

| what was broken | what went red |
| --- | --- |
| the keeper stops writing — the bug exactly as it was | **4** — *"expected '' to be 'He had been counting his Christmases.'"* |
| `consent` restored from the draft — the attestation re-made for them | **1** — *"expected true to be false"* |

Restored each time: **11 passed**.

**The suite caught a real design error before it shipped** — the seeded verse counted as writing. The fix is in the model, not in the test.

`npm run lint` exit **0** · `npm run verify:gates` exit **0** (24 gates), read without a pipe.
