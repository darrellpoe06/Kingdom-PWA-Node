# Lesson Experience: four modes restyled to the approved reference (2026-11-25)

Builds on PR #2872 (the one-lesson private prototype, `ll338-not-with-eyeservice`).
Darrell supplied a four-phone reference image (Watch, Read, Listen, Study). This
pass restyles the prototype to match it. It uses the same lesson, the same
owner-device gate, the same approved image and the same speech engine.

## What changed

| Mode | Reference element | Filled from |
| --- | --- | --- |
| Watch | Title and lesson badge over the image, red progress bar, player bar (speed, CC, full screen), mode pills under the player, Transcript / Key Points / Scriptures tabs, timestamped transcript with the active line in crimson | lesson text via `segmentText`; `bigIdea` and `benefits`; `anchor` and verse quotations taken verbatim from the text |
| Read | Cream book page, serif title, LESSON badge between gold rules, hero image, WORD-FIRST and the anchor reference, drop cap, ornament dividers, KEY TEACHING callout, A-/A+/bookmark/"n of N"/prev-next bar | lesson paragraphs at the chosen level; `anchor.ref`; `bigIdea` |
| Listen | Square art card with title, badge and waveform; Full Audio Lesson; elapsed/total times; big play button; Speed and Chapters | the engine's own `RATE_STEPS` and `setRate`; chapters are the lesson's own section leads |
| Study | Study Guide header; accordions for Scripture Focus, Key Takeaways, Reflection Questions (open, numbered), Practice / Exercise, Check Your Understanding (the real quiz), My Notes | `anchor`, `bigIdea`, `benefits`, `facilitator.discussionPrompts`, `inApp`, `quiz`; notes stay on this device in localStorage |

## Left out on purpose

- **Download, Downloads & Resources:** DR-1652 gates a lesson download to PoeTech+ or the Download Pass, so a free button here would contradict a decided rule.
- **Add to Playlist, Shuffle, Repeat:** nothing real backs them for a single lesson, and a control that does nothing would be a fake (Reality-Trace, P15).
- **Exact clock times:** the browser speech engine reports no clock. Every time is an estimate from lib/tts.js's documented ~15 characters per second at the live speed, and each one is printed with a leading "~".
- **Lesson number:** this is the number in the lesson's own id (`ll338` shows as "Lesson 338"). Nothing is invented.
- **Color:** the crimson in the UI chrome is the brand. Scripture callouts are gold, never true red (DR-0099).

## Verified

- 26/26 prototype tests pass. That is the 21 from before plus 5 new ones covering Key Points, Scriptures, estimate-marked times, the Read pager and Key Teaching, and the Study accordion order with Download absent. still-screen-motion and ui-standards-set also pass (58/58 combined).
- eslint, prettier, file-budget-guard, format-guard and legibility-guard all pass.
- All four modes were rendered at 390x844 in Chromium: no runtime errors and no horizontal page scroll. Every player-bar control sits inside the viewport.

## Read Aloud inside Read (same day, second pass)

Darrell asked to listen while reading, without leaving Read mode.

- **Read Aloud button:** a prominent crimson-and-gold button on the book page, plus a speaker button in the reading bar. Both start at the page you are on.
- **Narration bar:** black and gold, docked above the cream reading bar. It has rewind and forward (one sentence each), pause and resume, ~elapsed/~total, a speed chip (the engine's real `setRate`) and an Auto-turn toggle. Every reading control that was there before is still there: A-, A+, bookmark, go to bookmark, "n of N", prev/next.
- **Highlight:** the sentence being spoken is painted with the house `::highlight(poe-read-seg)` through `lib/read-follow.js`. That is the CSS Highlight API: no DOM change, so not one character of the lesson is touched. The paragraph being read gets a gold rule. Measured in Chromium: 126/126 segments aligned, and the painted range is exactly the spoken sentence.
- **Automatic page turning:** while the voice plays, the page follows it into each new paragraph. While paused, the reader can browse freely. Turning the page during playback moves the voice to that page.
- **One place across modes:** Watch, Read and Listen drive one narrator, so the narration position is shared. The Read page is kept per reading level in the parent and saved on the device. Arriving in Read mid-narration opens on the paragraph being read.
- **Bug fixed along the way:** `playFrom` reloads the rest of the text and the engine counts it from 0. Every skip, jump or resume was therefore putting the highlight, the progress bar and the saved place back near the start. An offset added back to each reported index fixes it, using only the engine's public API.
- **Future recorded voice:** `createNarrator` (default `createBrowserTTS`) is the seam. The contract is documented above `LessonExperience`. Tests drive Read Aloud through a fake narrator on that same seam. No paid voice is generated.

Verified: 38/38 prototype tests (8 new for Read Aloud); 82/82 including the learn-studio, motion and ui-standards suites; eslint, file-budget, format and legibility guards all pass.

## Read as one scrolling article (same day, third pass)

Darrell: "No turning pages just scrolling down" and "Still should look like an article that you want to read."

- **No page turning:** the "n of N" counter and the prev/next buttons are removed. Read is one continuous scroll. The reading place is the paragraph at the reading line (120px from the top), tracked on scroll. It is saved per level and restored when you come back from Watch, Listen or Study. A−/A+, bookmark and Go to bookmark stay.
- **Auto-scroll replaces auto-turn:** while the voice plays, the spoken sentence is kept about a third of the way down the screen. Measured in Chromium over 4 paragraphs, its top stayed at 278–279px. Read Aloud starts at the paragraph you have scrolled to.
- **Article typography:** the opening all-capitals line and each section lead ("FIRST, THE MASTER WHO WENT AWAY.") render as headings, there is a drop cap on the first letter of the opening paragraph, the reading column is about 36em wide, and Scripture shows as gold-rule pull-quotes. Every character is the lesson's own; only how it is displayed changed.

Verified: 39/39 prototype tests; 83/83 together with the learn-studio, motion and ui-standards suites; eslint, file-budget, format and legibility guards all pass; no errors and no horizontal scroll at 390px.
