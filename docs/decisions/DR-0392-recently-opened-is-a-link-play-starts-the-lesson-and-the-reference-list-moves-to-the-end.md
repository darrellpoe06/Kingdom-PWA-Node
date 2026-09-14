# DR-0392 — Recently Opened is a link, Play starts the lesson, and the reference list moves to the end

- **Date:** 2026-09-14
- **Status:** accepted
- **Tier:** B (the lesson picker and the projected slide — the two surfaces a congregation meets)
- **Type:** orchestration

## The report

Darrell, 2026-09-13, in two messages from the Learn tab and one real slide:

> "Recently Opened should be links like the others so users can click where they were!!!!!!! Also the last lessons dont click when you click them... fix it... please..."

> "Let the Play buttons just start the lessons and the PowerPoints have too many references so we need to fix that somehow..."

> "Put the list of links at the end of lessons for reference purposes... so it doesn't take away from the lessons.... keep referring to the Word and even keep the Word in the lessons like we do just the long list of links that are together without reading the Word after the cited locations as lists... make sense?"

## Five findings, and the one that was nastiest

1. **"THE LAST LESSONS DONT CLICK WHEN YOU CLICK THEM" — a real dead button, with an invisible cause.** The arrival effect in `ChurchLearn.jsx` was keyed on `resumeLessonId`. Setting that state to the **same** id is a React no-op: the render is skipped, so the effect never re-runs, so the tap does nothing. No error, no console warning, no half-open state — nothing to see. On the main list it is nearly invisible, because you rarely re-tap the lesson you just left. On **"Recently opened"** it is the NORMAL case, since that row is by definition the lessons you already opened — **the most likely tap on that row was the one guaranteed to do nothing.** The fix makes the arrival an **event** rather than a value: a rising `resumeNonce`, bumped in `open()` and carried in the effect's dependencies.
2. **"RECENTLY OPENED SHOULD BE LINKS LIKE THE OTHERS."** It rendered as a bordered chip, which reads as a **tag** — a filter, a category — rather than a way back. A row whose whole purpose is *return to where you were* has to look like the thing you return with. Now the same underline, the same serif, and the same 44px touch floor as the list beneath it.
3. **"LET THE PLAY BUTTONS JUST START THE LESSONS."** Play landed on the presenter **console** — a setup screen carrying its own START button — so the control named Play played nothing until a second tap. `Presenter` now takes `startOnScreen`, and Play arrives already presenting.
4. **"THE POWERPOINTS HAVE TOO MANY REFERENCES."** Ours to fix, and the same defect as DR-0391 in a different medium: a lesson's anchor carries every reference the **whole lesson** stands on — L149's is eighty — and the slide printed the entire string. On a projector that is a wall of green semicolons with no teaching visible. **A list rendered as content**, exactly as the reader was performing a list as prose.
5. **"PUT THE LIST OF LINKS AT THE END... SO IT DOESN'T TAKE AWAY FROM THE LESSONS."** So the cap is **not a deletion, it is a move** — and that distinction is the whole decision. Teaching slides name only the few the session actually opens on (`SLIDE_REF_MAX = 6`, `OPENER_REF_MAX = 3`) with an honest **"+77 more"**; the closing **"The Word we stood on"** slide carries the whole list, because it is last and competes with nothing. And **in-line references throughout the lesson are untouched** — those are the Word doing work in a sentence, which he asked explicitly to keep.

## The cap needed somewhere to land

Six lessons author no timed run-of-show and so never had a closing reference slide at all. Capping their one teaching slide would have **dropped the list out of the deck altogether** rather than moving it to the end — turning his "put it at the end" into a deletion, which is the opposite of what he asked. They get the same ending now. **Caught by the corpus-wide test, not by reading it.**

## A test was re-pointed on purpose, not weakened

`church-learn-play-and-courses.test.jsx` asserted that Play landed on the console and showed "Present on this screen". That assertion **was not wrong when it was written** — the behaviour it described is precisely what he asked to change. It now pins the **new** contract: Play lands on screen, and the way back out ("Speaker view ✕" / "Full screen") is still there. A deleted test would have left the new contract unpinned; a re-pointed one keeps the guard and moves it.

## Proof

- **Proven-to-catch:** drop `resumeNonce` from the effect's dependencies, **or** stop bumping it in `open()`, and the re-tap test fails. Remove the slide cap and the bibliography test fails; remove the closing slide from the no-run-of-show path and the corpus-wide test fails on all six lessons.
- 24 new tests across `recently-opened-retap-works.test.jsx` and `slide-is-not-a-bibliography.test.js`.
- `npm run verify`: **971 files, 14,595 tests, green.**

## Limits stated

- **No live pass on poetech.us** for any of this — it is verified by test and by source, not by a hand on the real projector. Carried on the standing `re-review: 2026-09-20` opened in DR-0391.
- `SLIDE_REF_MAX = 6` / `OPENER_REF_MAX = 3` are **judgement numbers**, not measured ones: they are what fits a projected slide without crowding the teaching. If a real room says otherwise they move. `re-review: 2026-10-11`.

## Ledger note

This record is written **the morning after** the commit it describes (`60f627a7`, 2026-09-14 00:00 UTC), and from that commit's own contemporaneous message — the same transcription discipline DR-0383–DR-0386 record, and the same structural cause: a run of fast merges with no gate requiring a DR for a Tier-B change. The commit was **stranded twice** by PRs merging between verify and push (#1565, then #1566); it is replayed onto the post-#1566 `main` rather than stacked on merged history.
