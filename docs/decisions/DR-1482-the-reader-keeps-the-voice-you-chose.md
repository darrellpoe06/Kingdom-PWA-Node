# DR-1482: The reader keeps the voice you chose, and the list of the books is seen, not read

**Date:** 2026-11-13 · **Status:** Accepted · **Tier:** B (reader behaviour) · **Area:** `app/src/lib/tts.js`, `app/src/lib/use-read-aloud.js`, `app/src/components/LessonFigures.jsx`, `app/src/components/WhoHeIsRegister.jsx`
**Follows:** DR-0654 (one reading, one voice), DR-1254 (the hand-off offered the man's voice, did not keep it), DR-1251 (a hold keeps the place), DR-0721 (my voice), DR-1372 (figures fold at the end)

## Context

Darrell, 2026-11-13, rendered for meaning (DR-0331): the reader reads the list of scriptures at the end of a lesson, which is a list to pause on (the books, when they were written, what we hold about each), not to hear; the man's voice he chose keeps turning into a woman's part-way through, and only a rewind or a skip brings his back; and his own recorded voice still does not read.

## What was measured

- **SHOULD.** One reading, one voice, from its first word to its last (`reading-voice-pin.js:1-17`, DR-0654). Chrome is not content and `data-read-skip` is a surface's word for it (`read-follow.js:41-46`).
- **ARE, the list.** The end of the teach stage mounts `LessonFigures` (the "When the N books this lesson quotes were written" chart, every book with its date and its basis line) and, in the Who He Is course, `WhoHeIsRegister` (`ChurchLearn.jsx:1529-1533`). Both fold closed, and the reader opens folds before it reads (`read-reveal.js:86-117`), so both were spoken whole. Neither carried a skip mark.
- **ARE, the voice.** Two seams. (1) `use-read-aloud.js` `onFallback` → `deviceRestRef`: when a NAS piece fails, the rest goes to the phone's engine in `deviceVoiceForPin`'s pick; when the phone has no voice of the reading's gender the pick is `matched: false` and it spoke anyway, in a woman's voice, with a notice (DR-1254). A rewind or skip calls `read()`, which asks the NAS man's voice afresh: exactly the reported pattern. (2) `tts.js` `useTextToSpeech().speak` looked the pick up by URI at speak time; a list Android was rebuilding returned nothing, `setVoice(null)` followed, and the piece read in the phone's default. `setVoiceURI` also saved `''` over the pick on the same miss. The engine then reused one voice object for every sentence.
- **ARE, my voice.** The read tries the XTTS studio on the tower first (`use-read-aloud.js` person branch, DR-0721). voice-health issue #2280 records `/health` 502 `studio-unreachable` (`upstream http://tlcmediadpt:8770`) every day 2026-10-20 to 10-27, then the NAS unreachable from CI 11-02 to 11-09; run 43310501087 (2026-11-12) could not join the tailnet at all (`backend error: invalid key: API key does not exist`). The last arm run, 36796584904 (2026-10-01), printed `secrets.TOWER_CREED_PASSWORD set: false`, `the tower refuses the CI key for creed`, `dialect=none`, nothing armed. The studio has never served one clone.

## Impact

- The books chart and the Who He Is register stay on the page, folded, one tap away, and are no longer read aloud; verses quoted in the teaching are read as before. A sequence or quadrant figure is still read.
- A reading keeps the voice it started in. A phone with a voice of the reading's gender carries on in it, as before. A phone without one holds the reading at the sentence that failed (shown as paused) and says why, with the door to keep the man's voice on the phone; play asks the NAS voice again, and only if that still fails does the phone's voice read on, as the notice said it would. Coming back to the screen never resumes a voice hold by itself.
- The engine resolves the chosen voice by URI (then name and language) against the CURRENT list for every sentence; a list without it is waited on up to 1.5 s, then the reading holds (`voice-missing`) rather than switch.
- The narrator voice is the chosen one; no per-speaker voice is assigned inside a lesson reading (the Scripture cast is its own surface).

## Decision

1. `data-read-skip` plus `data-read-no-expand` on the books-list figures and the Who He Is register: an explicit mark, never word matching.
2. No hand-off switches a reading's voice unasked: same gender, or hold and say so; the listener's press is the only way past.
3. The engine holds the pick as `{ uri, name, lang }`, re-resolved per sentence; `wantVoice(uri)` for a pick the list does not hold yet; a pick not on this device reads in the phone default on purpose, said.
4. **My voice is blocked on two values only Darrell holds, not on code here:** the tower studio was never armed (`TOWER_CREED_PASSWORD`, DR-0721 Decision 5), and the CI tailnet credential is invalid, so no witness or arm run can reach the NAS (run 43310501087). It is not claimed to work. `re-review: 2026-11-20`, or the first arm run that prints `CLONE SPOKE`.
5. Still open: Chrome's online voices can fall back to a local voice inside the engine without any event; not measurable from here. Keeping the Piper man's voice on first use (DR-1254's re-review condition is met) waits on the data-plan call; same re-review date.

## Verification

- `the-reader-keeps-the-voice-you-chose.test.jsx`, 13 cases: the list absent from the spoken map and its fold left closed while the body verse is spoken (with a control that removes the mark and hears the list); a rebuilt list keeps the chosen voice as the list holds it now; an empty list waits instead of speaking in the default; a vanished voice holds with `voice-missing`; a NAS failure on a phone without a man's voice holds, play retries the man's voice, the screen returning does not resume it, a press-through reads on, and a phone with a man's voice carries on as before.
- **Proven to catch:** run against origin/main's four source files, 9 of 13 fail (every new-behaviour case); the 4 that pass are the control and the as-before cases.
- Reader and voice suites green; lint clean on the changed files.
