# DR-0722 — A lesson, a course, or every lesson downloads at the reading levels chosen, and says what it costs first

- **Status:** accepted
- **Tier:** A (surface + device storage only: no schema, no money, no timer, no new external publication; downloading stays behind the DR-0698 account check)
- **Type:** surface
- **Date:** 2026-10-01
- **Scope:** `app/src/lib/lesson-downloads.js` (new: the levels, the plan, the run, remove); `app/src/components/LessonDownloads.jsx` (new: the panel and its three doors, the Saved mark, the offline level note); `app/src/lib/clip-cache.js` (clips held by a download are never cleared; limits up to 50 GB); `app/src/lib/read-target.js` (`preferText`); `app/src/lib/use-read-aloud.js` (publishes the reading voice to downloads); `app/src/components/TTSControl.jsx` (one line: a `preferText` target speaks its text); `app/src/components/ChurchLearn.jsx` (the doors, the marks, the offline reading); `app/src/__tests__/lesson-downloads.test.jsx` (new); `app/src/lib/legibility-health.json` (regenerated).
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), APP-IS-PRIMARY (DR-0065), SPEC-CONFORMANCE (DR-0219), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0698 (downloading needs an account; reading and ▶ Play never do), DR-0659 (the reading voice kept on the device), DR-0718 / #1917 (a saved reading plays as one file with no network), DR-0426 / DR-0717 (the reading level, chosen before the lesson starts).

## Context

Darrell, 2026-10-01:

> "Also the ability to download all lessons at once or individually... of course.... make sense?"

And the same day:

> "Make sure the options for just adult or all reading levels as an option for those with and without children..."

Three doors (one lesson, one course, every lesson), two kinds of reader (no children: the adult version; a family: every age version), and an honest size before anything is fetched.

## What was measured

**SHOULD.** DR-0698: a download needs a signed-in account. DR-0659: a lesson's reading voice can be kept on the device and played without the NAS. Nothing documented downloading more than one lesson, or downloading by reading level: undocumented intent, itself a finding (DR-0219).

**ARE (on `origin/main` at 35b3ffcc).**

- *What "download" meant.* The lesson text: "Copy lesson" (`ChurchLearn.jsx` actions row) and per course Paper & print → Copy markdown / Download .md / Print, both behind the DR-0698 account check. The reading voice: one lesson at a time, from inside the reader panel ("Save … for listening offline", `TTSControl.jsx` `reader-offline-save`), into the IndexedDB clip store (`lib/clip-cache.js`), cleared least-recently-played first past a 100 MB to 1 GB limit. Nothing saved a course or more, nothing chose a level, and a lesson saved on purpose could be cleared to make room for any replay.
- *Where the words live.* Every course is in the app's own files (eagerly imported, modulepreloaded, `vite.config.js` `manualChunks`), and the service worker keeps every hashed file of the running build cache-first (`public/sw.js`). So the words of the build last opened online are on the device already; a download also writes each saved level's words and reading text to IndexedDB `poe-lesson-words`.
- *The catalog,* counted from the mounted courses (`LEARN_CATALOG` + `buildEternalProcessingCourses()`): **50 courses, 750 lessons.** Living Lessons: 201.
- *How big.* Words are the UTF-8 bytes of each saved level's lesson text plus its reading text. The voice is estimated before fetching from the measured cost of Piper speech: L191 saved whole was 276 pieces and 101 MB (DR-0659), 383,700 bytes a piece; its spoken pieces average 87.4 characters (21,496 over 246), so **4,400 bytes a character** (`VOICE_BYTES_PER_CHAR`). Pieces two levels share are counted once.

| Scope | Adult only: words | Adult only: words + voice | All reading levels: words | All reading levels: words + voice |
|---|---|---|---|---|
| Every lesson (750) | **12 MB** | **30.9 GB** (77,374 pieces) | **35 MB** | **58.6 GB** (160,167 pieces; 2,641 level versions) |
| Living Lessons (201) | 6.4 MB | 16.9 GB | 22 MB | 37.5 GB |

  Sizing every lesson takes 2.0 s (adult) and 6.1 s (all) in the test runner; the panel sizes in steps and yields to the page every 25 lessons.

**GAPS.** (1) No course or whole-catalog download. (2) No choice of reading level, so a family had to open every level of every lesson. (3) No size before a save. (4) A saved lesson could be cleared silently. (5) No mark in the lists saying what is on the device, and no way to remove downloads in bulk. (6) Offline, the reader spoke the page's mapped text, which is not the text whose pieces were saved, so a saved lesson could still reach for the network.

## Impact

Without this, a reader going somewhere with no signal had to open and save each lesson one by one from inside the reader, at whatever level was showing, with no idea whether it would fit, and a lesson they saved could be gone by the time they needed it. A family with children could not keep the children's versions at all without opening each one.

## Decision

1. **Three doors, one panel.** On every lesson's actions row: **⤓ Download** (✓ Saved once kept). On a course, beside Share this course: **⤓ Download this course (N lessons)**. On Learn, under the catalog line: **⤓ Download every lesson (750)**. N is counted from the live schedules. Each opens the same panel under its row; the lesson row gains one control, not five.
2. **The levels are the lesson's own.** **Adult only** (the smallest; for readers without children) or **All reading levels** (every age version the lesson really has, from the real bands: Child 6–10, Youth 11–14, Teen 15–17, Adult 18–64, Senior / founding 65+), or **Pick levels**. A band that reads another band's words (Youth reading the Teen text while its own is unwritten) is that version, saved once. A lesson written once for everybody has one version. The choice is remembered as this person's default. Every choice shows its size, words alone and with the reading voice, before Download.
3. **Top-up, not re-download.** Each voice piece is keyed by its words and held by name (`<lesson>|<level>`). Adding the children's levels later fetches only what the adult version does not already hold.
4. **Honest about room.** The plan is checked against the reading-voice limit (now 100 MB to 50 GB) and the free space `navigator.storage.estimate()` reports, less 50 MB kept for the rest of the app. Short of either, the panel says so in numbers and offers **Save the words only** and, when a limit fits the space, **Raise the limit to …**. The download asks `navigator.storage.persist()` so the browser keeps it. **A piece a download holds is never cleared to make room**; only a piece nobody holds is.
5. **The run.** Progress counts lessons: "124 of 750 saved". Pause, Resume, Stop. The screen is held on while it runs (the shared wake lock, DR-0439); where the phone still stops it in the background, pressing Download again skips everything already here. The NAS voice is asked two pieces at a time (it answers a third with 503 busy). A lesson whose voice fails keeps its words, and the summary lists it with its reason in plain words. Out of room partway, the rest are saved as words only and the summary says why.
6. **Reading offline.** With no connection, an open lesson whose level was saved with its voice hands the reader the very text that was saved (`preferText` on the read target), so every piece plays from the device (#1917 plays them as one file). A level that was not saved says so ("The Child reading voice for this lesson is not saved on this device; saved here: Adult") rather than failing; the words are always there.
7. **Saved and Remove.** A small **Saved** mark on each kept lesson in the lists, naming its levels on hover. **Remove downloads** per lesson, per course, or all; a piece another kept lesson still holds stays.
8. **The account rule is DR-0698's.** Signed out, every door is the same `DownloadNeedsAccount` sign-in prompt.

## Verification

- `app/src/__tests__/lesson-downloads.test.jsx`, 16 tests: the real bands and the adult first; All is Adult on a single-version lesson; All costs more than Adult; the choice remembered; one lesson saved with every piece held; **offline, the open lesson's read target is `preferText` with the saved text, every piece on the device**, and the Saved mark shows; an unsaved level says so offline; progress counts "1 of 3" to "3 of 3" and skips the saved lesson without fetching its pieces; pause holds every fetch until resumed; **the top-up fetches none of the adult pieces again**; a failed voice keeps the words and its reason; the room check (limit → raise to 600 MB; space → words only); a held piece survives the clearing; **the panel, short on space, offers words only and that saves no voice**; remove per lesson / course / all, with a shared piece kept; signed out, every door is the sign-in prompt.
- **Proven to catch** (each mutation run, each made the named tests fail, then reverted): held pieces cleared like any other (1 fail); skip-existing removed (2); no saved text offline (1); the account check removed (2); the room never short (1); remove keeps the pieces (1); All = every band regardless of what is written (2); top-up re-fetches held pieces (1); the unsaved-level note silenced (1).
- Neighbours run locally and green: the Learn, reader, share, clip-cache and screen-awake suites (17 files, 166 tests) and the scanning guards (ui-standards, contrast, fab-overlap, legibility, spelling; 17 files). `legibility-health.json` regenerated (289 pages, 0 regressions). CI is the full proof, including the chrome-layout probe at 360 px.
- **Not done here, named:** a download that keeps running with the app closed (Background Fetch) is not built; the screen is held on instead and a re-run skips what is saved. Re-review 2026-11-01. Smaller voice files (Opus on the NAS) would cut the 30.9 GB to about 1.5 GB; that is DR-0659's open item, re-review 2026-10-15.
