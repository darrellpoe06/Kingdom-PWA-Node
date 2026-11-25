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
