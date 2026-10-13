# DR-0738 — The reader says why it stopped, and tries again in the dark

- **Status:** accepted (built and proven in unit tests; the first live trip comes from Darrell's phone)
- **Tier:** A (reader playback and panel copy; a log kept on the device, never sent by itself; no data table, no money, no new door)
- **Type:** defect
- **Date:** 2026-10-01
- **Scope:** `app/src/lib/reader-trip.js` (new: the trip log and its one-line summary), `app/src/lib/use-read-aloud.js` (the trip is kept through a reading; a piece that cannot be had in the dark is tried again, `DARK_RETRY_MS` apart, before the reading is held; `lastTrip`), `app/src/components/TTSControl.jsx` (the last trip, said under the panel's background line), test `reader-trip.test.js`.
- **Principles:** VERIFICATION-DOCTRINE (DR-0076: measure, don't claim), HOLD-THE-HAND (DR-0621: a flag is where the work starts), THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065); DR-0627 (the stand-in is real audio), DR-0654 (one reading, one voice; a held reading resumes when seen), DR-0718 (a started lesson keeps playing with the screen off).
- **Grounds:** Darrell, 2026-10-01, after DR-0718 deployed at 07:03 UTC: *"It still stops when in the background... when should we expect that feature?"*

## Context

DR-0627 made the stand-in a real audio clip from the NAS so the phone keeps it as media, and DR-0718 removed the gap between sentences, played a saved reading as one file, and lengthened the keep-alive past Chromium's five-second transient line. Both were proven in unit tests and neither was heard on his phone before he reported it still stops.

## What was measured

- **The feature is on his build.** #1917 (DR-0718) merged at 07:03 UTC and its deploy succeeded (run on 5bd81b48). His report came after.
- **The NAS voice road was up.** nas-health at 13:32 UTC: `poetech-voice-lite.service` active, the GPU studio unreachable (so the reader's stand-in is the NAS Piper voice, real audio), `poetech-voice-forwarder` answering 502 for the studio.
- **What the phone has never said.** When a reading stops in the background, the panel shows nothing about it afterwards: not which voice was speaking, not whether the screen went dark first, not which sentence it was on, not what the voice said when it gave up. Every answer so far was reasoned from the code (`use-read-aloud.js`, `clip-queue.js`, `tts.js`) and from Chromium's source, never from the phone. The sandbox cannot reach the phone or poetech.us.
- **One path that stops a reading in the dark, by construction.** In `playLiteVoice`'s `onFallback`, a piece that cannot be fetched while the page is hidden holds the reading at once (paused, with the place kept) until the app is seen again (DR-0654). A phone whose network drops for a few seconds while the screen is off, before the cache-ahead has the whole lesson on the device, meets exactly that: the reading stops, and nothing tries again until he looks at the phone. Not proven to be his case; it is the one such path in the code.

## Impact

Without a record from the device, each report is answered by a guess and a build, and the next report says "still". With the trip log, the next stop is a measurement in his own screenshot, and the retry closes the one known gap without waiting for that measurement.

## Decision

1. **The reading keeps a trip log** (`reader-trip.js`): which voice (`audio` / `saved` / `device`), the sentence it is on (one number, not a row per sentence), every `hidden` / `visible`, every `fallback` with its reason and whether the page was hidden, every `handoff` to the phone's voice, every `retry`, `resumed`, `resumed-in-the-dark`, and how it ended (`ended`, `stopped`, `held`, `left`). The last ten trips are kept in `localStorage` on the device; nothing is sent anywhere by itself.
2. **The panel says the last trip in one line** when nothing is reading, under *Only Stop stops the voice*: for example *Last reading at 8:05 AM (Kings Who Search It Out): the NAS voice · stopped at sentence 14 of 60 while the screen was off: the next piece could not be fetched (tried again 2 times in the dark) — it resumes when the app is seen again · screen went dark 1 min 15 s in.* A screenshot of that line is a report.
3. **A piece that cannot be had in the dark is tried again** before the reading is held: 5 s, 10 s, 20 s, 40 s, 60 s, then 120 s (`DARK_RETRY_MS`), with the keep-alive still playing so the phone keeps the page. A piece that comes continues the reading in the dark and the trip says so; when every try has failed the reading is held, as before, for the moment the app is seen. A refusal to play without a tap is never retried (no fetch fixes a gesture). Seen again, the visible path resumes it and the retry is cleared; Stop clears it.

## Verification

- `reader-trip.test.js` (14): the log opens, notes, ends and keeps the last ten; a device that cannot keep the log still works; the one-line summary for played-to-the-end, stopped-by-you, held-in-the-dark with the reason and the retry count and when the screen went dark, picked-up-again-in-the-dark, the phone's voice taking over with its reason, still-reading; reasons are words; and source pins on `use-read-aloud.js` and `TTSControl.jsx` for the trip's start, voice marks, hand-off, fallback, stop, end, the retry schedule and its refusal rule, and the panel line.
- The 59 reader, voice, offline and panel test files pass; ESLint clean with `--max-warnings 0`.
- Not verified here: a reading on Darrell's phone. The proof is his next screenshot of the panel after a reading stops: the last-trip line names the voice, the sentence, the dark and the reason. **re-review: 2026-10-08**, against that line.
