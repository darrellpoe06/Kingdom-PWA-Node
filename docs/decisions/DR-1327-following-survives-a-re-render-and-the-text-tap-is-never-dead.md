# DR-1327: Following survives a re-render, and the TEXT tap is never dead

**Date:** 2026-11-05
**Status:** Accepted
**Tier:** A (the reader's own following behaviour; no data, no schema, no money, no identity surface)
**Type:** fix
**Area:** `app/src/components/TTSControl.jsx`, `app/src/components/ChurchLearn.jsx`, `app/src/__tests__/the-reader-follows-a-re-render.test.jsx`
**Grounds:** VERIFICATION-DOCTRINE (DR-0076 §3 proven-to-catch, §4 measure don't claim, §5 characterize before you change), REALITY-TRACE (DR-0061), PERPETUAL-IMPROVEMENT (DR-0075), DR-0633 (follow along, never yank), DR-0659 (the listener's own follow choices), DR-0722 (the read that speaks its own text and is located by span), DR-0734 (Search it out)

## Context

Darrell, 2026-11-05, from his phone, two messages:

> "After finding the reader the voice is overreacting... won't follow because of something... it shows this after it finds the text and can't keep going because of this!!!!!! Fix it... the reader !!!!!!"

> "Also this happens after choosing to go to the text... it wont"

The screenshot he sent: a paced CHILD-pace lesson at **STEP 45 OF 52 · ~5 MIN · CHILD PACE**, steps 46 through 49 below it, the words plainly on the screen — and the docked reader bar reading **MORE · TEXT · BACK¶ · PAUSE · NEXT¶ · WINDOW · READ**, with TEXT lit. TEXT is the reader's own word for *"those words are on another page."* It was saying that about words he was looking at.

## What was measured

**THE SOURCE WAS CHARACTERIZED BEFORE ANYTHING CHANGED (DR-0076 §5).**

1. **The button has three states and TEXT is the third** (`TTSControl.jsx`, the mini-bar): `{!textHere ? 'Text' : following ? 'Following' : 'Follow'}`. TEXT on his screen means `textHere === false`.
2. **`textHere` was `!!(r && !r.collapsed && node && node.isConnected)`** over the stored DOM Range for the sentence being spoken. It is false exactly when that Range has detached.
3. **Nothing in the app ever rebuilt a Range.** `grep -nE "MutationObserver|remap|rebuildFollow|refreshRanges" app/src/components/TTSControl.jsx app/src/lib/read-follow.js` returned **nothing**, exit 1. The ranges are built once per run, in `pageFollowState`, from `start()`, the tap path and the two target paths. The only two `isConnected` reads in the whole file were **the two that gave up**.
4. **MEASURED IN THE REAL APP, NOT IN A TEST.** Chromium at 412×915, deviceScaleFactor 2, against the dev server, on Living Lessons **L1 at CHILD pace in read-along** — the surface in his screenshot. A Range was built over a real prose sentence with the app's own `buildFollowMap`, then the paced core re-rendered with every word still on the screen:

   | | | |
   |---|---|---|
   | held, before | `collapsed: false`, `connected: true` | "You will still mess up sometimes, and that is okay — God is…" |
   | after the re-render | **`collapsed: true`**, covering **`""`** | the words are still on the screen |
   | re-found by fingerprint | `how: "exact"`, range alive, **same words** | this is the fix |

   So: the reader was not confused about where the words were. It was holding a dead pointer, concluding the words had left, and relabelling itself TEXT while they sat there — and following simply stopped.
5. **AND THE TAP WAS DEAD.** `showTheText()` fell through to `openReadingSource(owner, sentence)`, which **returns `false` when no opener claims the owner** (`app/src/lib/reading-source.js:32`) — and `showTheText` **ignored the return value entirely**. No scroll, no highlight, no navigation, no word. That is his "it wont", exactly.
6. **THE CHIPS WERE MEASURED, NOT GUESSED (DR-0076 §4).** The green verse chips under the lesson prose add **nothing** to the spoken text: each chip is a `<button>` and the lead dash is `aria-hidden`, both already in `SKIP_SELECTOR`, and nothing near them carries `data-read-keep`. Measured text over the real `VerseChips` render is the prose alone. **They were left exactly as they are.** What *did* repeat was **"Search it out"'s row of next-lesson links**: the lesson TITLE sits inside a button (skipped), so the only thing reaching the voice was the trailing `— same ground: Galatians 5:22` — the same reference the prose above had just named, with no lesson attached to it.

## Impact

The reader stopped following partway through every paced lesson, silently, and told the listener the opposite of the truth about where the words were — on the one surface built for a listener who is not reading the screen. Then the one control offered to fix it did nothing at all.

## Decision

1. **A detached range is a reason to look again, not to stop.** `reanchorFollow()` rebuilds the follow map from the live DOM — from the **same container this run was mapped from**, re-resolved by id, never the whole page (re-mapping `readingRoot()` is what put a highlight on another lesson card's identical sentence, DR-0722) — and finds the sentence being spoken **by its own text**, with `findSentence` + `sentenceKeyOf`, the primitives `savedStartIndex` already uses and with the same policy (`exact` / `moved` / `index-only`). `moved` *is* this case. A run that speaks its own registered text is re-found by `alignSegmentSpans`, the same walk that found it the first time. **`base` is re-seated, never `local`** — `local` belongs to the engine, so `base + local` stays the true global sentence and the bookmark `placeLessonIfMine` writes stays the sentence actually being heard.
2. **Three places look again:** the two live sentence effects (so following *resumes on its own*, without a tap), an effect that runs after every commit (so the button relabels itself from TEXT back to Following), and `showTheText` (so his tap re-anchors before concluding anything).
3. **A tap never does nothing.** `showTheText` now reads `openReadingSource`'s boolean. When no surface claims the reading and the re-anchor also failed, the listener is told — in the reader, in plain words, with the panel carrying the line coming open where he tapped, rather than a mark he has to go and find.
4. **The next-lesson link row is not read aloud.** `data-read-skip` on `search-it-out-next` — the mechanism this app already has. The three questions above it and the aim + verse below it are prose and are still read.

## Verification

- **PROVEN TO CATCH (DR-0076 §3).** `the-reader-follows-a-re-render.test.jsx`, 7 cases, drives the **real** `TTSControl` against a real follow map and replaces the read element's nodes the way a re-render does. Against the unchanged component **3 of 4 reader cases fail with his exact symptoms** — `expected 'elsewhere' to be 'following'` twice (the TEXT label with the words on screen) and `the tap said nothing at all: expected '' not to be ''`. The fourth, where a surface *does* claim the reading, passes both ways: it is the control. The ChurchLearn case fails on the unchanged component too.
- **The real app, observed (DR-0061).** The table above. Screenshot of the surface: `reader-child-pace-step.png` ("STEP 1 OF 10 · ~5 MIN · CHILD PACE"). **Honest limit:** headless Chromium has no speech voices, so the reading could not be *started* there — the end-to-end button behaviour is proven in the component test, and the detach-and-recover mechanism is proven in the live browser on the live lesson.
- **Suites:** 13 of the 14 named reader suites plus 8 adjacent reader/learn suites, **201 cases green** locally, plus the 7 new. A two-slot vitest memory gate made a full local suite run unobtainable; **CI's four shards are the authoritative run.** `eslint src/components/TTSControl.jsx src/components/ChurchLearn.jsx` clean at `--max-warnings 0`.

### Found and NOT changed, with dates

- **A range can stay *connected* and slide onto different words.** Measured live: a held range over the step counter read `Step 1 of 10 · ~5 min · Child pace` before and `Step 2 of 10 · ~5 min · Child pace` after, because React rewrote that text node in place. `collapsed` is false, so nothing re-anchors and the highlight is silently on the wrong words. A text comparison would catch it, but the map's normalization (collapsed whitespace, synthetic sentence separators) makes a naive comparison a churn risk, and that is not something to guess at. `re-review: 2026-11-19` — measure how often a lesson's *prose* node is rewritten in place before adding a guard.
- **The reader speaks the step marker.** "Step 1 of 10 · ~5 min · Child pace" is in the spoken text, once per step — 52 times on his lesson. That is **deliberate**: `ChurchLearn.jsx` says so in writing at the read-along branch — *"its step markers kept so the listener still hears where they are."* It is a decision, not a defect, so it stands. But it is a plausible part of what he means by "overreacting," and it is his call. `re-review: 2026-11-12`.
