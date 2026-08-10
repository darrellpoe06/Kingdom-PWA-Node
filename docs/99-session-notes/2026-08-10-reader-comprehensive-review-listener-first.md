# 2026-08-10 — The reader, reviewed from the listener's chair

**What was asked.** Seven reports from Darrell's phone in one sitting, plus:
*"Review the Ways and documentation and history of the app building inside the
app and where it helps to connect context to understand what our intentions are
for each build cycle... Comprehensive review of our Ways and documentation and
procedures."*

**Decision record:** `docs/decisions/DR-0285`. **Review record:** `REV-0244`.

## The seven reports and what each one actually was

| # | Report | What it actually was |
|---|---|---|
| 1 | "The reader can't be closed after opening to change speed" | `close()` called `stop()` — the panel and the reading were the same switch |
| 2 | "let it run in the background... so I can hear the Word" | Web Speech is not media, so a backgrounded page freezes and the voice dies |
| 3 | "highlighted Words work inside Eternal Algorithms not the Learn space... why?" | The follow map skipped `.print\:hidden` — the class that wraps ChurchLearn's ENTIRE screen view |
| 4 | "deeper doesn't get read at all" | The lesson renders one stage at a time; the other four were never in the DOM |
| 5 | "dropdown information need to be understood.... too" | Collapsed panels are conditionally rendered — the words did not exist to read |
| 6 | "the pause and continue doesn't work" | Android does not honor `speechSynthesis.pause()`; we trusted it anyway |
| 7 | "should say 2nd Timothy not two Timothy" | Every numbered book of the canon, mispronounced aloud, every time |

## The one to remember

**A rule about paper was deciding what a person could hear.** `print:hidden`
means *not on the printed sheet*. It had been sitting in the follow map's skip
list as a proxy for "floating chrome" — a reasonable-sounding guess that was
wrong the moment any surface used the class the way Tailwind intends it, which
ChurchLearn does for its whole view. Same reader, same code, opposite behavior
on two tabs, decided by a print utility class.

The lesson for the next build cycle, and why it is in the DR rather than only
here: **infer nothing about meaning from a styling class.** Chrome now says it
is chrome (`[data-read-skip]`). A surface that owns a reading now names the
element that renders it. Both are declarations, not inferences.

## The measurement that made it arguable

Against the real week-1 Learn lesson, not a fixture:

| | on screen | spoken sentences | located | coverage |
|---|---|---|---|---|
| before | 329 chars | 19 | 3 | **15.8%** |
| after | 1,873 chars | 24 | 24 | **100%** |

That is the whole of "why doesn't it highlight" and "why doesn't it read the
deeper parts" in one table, and it is now a test
(`reader-learn-follow.test.jsx`) rather than a paragraph.

## What is NOT claimed

- **Background reading is proven on Android / Chromium.** iOS Safari suspends
  device speech when the tab backgrounds even with an audio element playing; a
  cloned-voice reading (a real clip) continues there, a device-voice one may
  not. Nothing survives closing the tab.
- **Pause now restarts the sentence you were in.** That is the honest price of
  not trusting a platform pause that does not work.
- **The ear is still Darrell's** — whether it sounds right at a six-year-old's
  pace, and whether the reading really rides along while he works in another
  app, is the DR-0104 live pass on his own hardware.

## Ways / documentation corrections made in this pass

- `CLAUDE.md` said DR-0239 has **seven** dimensions; the standard has carried
  **eight** since 2026-08-07 (the Word's own accuracy, quoted AND reasoned).
  Layer 0 was under-counting the standard it points at. Corrected.
- The Read Aloud panel's own explainer said nothing about what Close does while
  Close was ending the reading — a surface silent exactly where it had to
  speak. It now states the law it obeys.
