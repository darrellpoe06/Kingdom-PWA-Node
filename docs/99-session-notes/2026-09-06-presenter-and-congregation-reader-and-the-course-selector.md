# 2026-09-06 — The reader on the presenter and congregation slides; the course picker reads as a selector

**Lane:** `claude/yahweh-actions-by-century-exjvvv` → PR → auto-merge.

## 1. "The scroll and word highlighted as the TTS reads is not working on the presentations or congregation slides"

Reported by Darrell 2026-09-06 with screenshots; traced in an earlier pass but never reproduced because the presenter's own tests pass. Reading the real path instead of the tests found three defects, two of them verifiable without a device:

### 1a. Presenter — the scroll moved the wrong thing (`app/src/lib/read-follow.js`)
`followRange` computes where the spoken sentence sits in the viewport and calls **`window.scrollBy`**. The presenter's full-screen mode is a `position: fixed; inset: 0` overlay whose inner panel is the scroller; the console's slide mirror is an `overflow-y: auto` box. The window moves neither. The `scrollIntoView` fallback that *would* reach a nested scroller runs only when the range has no layout box — which is jsdom — so every test exercised the fallback and the browser path was never checked.

**Fix:** `scrollContainerFor(el)` finds the nearest ancestor whose computed `overflow-y` is `auto`/`scroll` (never `body`/`html`); when one exists, the container's own box is the viewport, the app's sticky chrome does not apply, and the container is what scrolls, by the same `readingScrollDelta` rule. The window path is unchanged for ordinary pages.

### 1b. Presenter — the overlay was counted as top chrome
`stickyTopInset` probes the top edge for fixed/sticky elements and took the overlay itself as a bar: inset = min(overlay bottom, 45% of the viewport) = 45% of the screen, pushing every followed sentence into the lower half. **Fix:** a fixed element covering ≥90% of the viewport is a surface, not a bar, and contributes no inset. A real 56px bar still counts.

### 1c. Congregation — there was no reader at all (`app/src/components/FollowAlong.jsx`)
The congregant's view boots standalone from `main.jsx` on `?follow=CODE` and mounted **no TTSControl** and registered **no reading**. Highlight and scroll could not fail; they did not exist. **Fix:** the live slide registers a read target — the same contract Presenter uses (`elementId` + `text`, `read-target.js`) — on a `<main id="follow-along-slide">` wrapper (so "Read this page" is the slide, not the "Following · CODE" label), with the spoken text built by a new `slideReadingText(slide)` in `presentable.js` (title, lead, revealed points — a follower's device holds only the built slide). The reader is mounted. A new slide replaces the target; the hold state registers nothing.

### Gates (proven-to-catch)
- `read-follow.test.js`: +7 — inside a scrolling container the container moves and `window.scrollBy` is **not** called; a sentence already in band does not twitch; no container → window path unchanged; a full-viewport overlay contributes no inset while a 56px bar still does, and the old value (360 at 800px) is asserted absent.
- `follow-along-reader.test.jsx`: 6 — hold registers nothing; a slide becomes a read target whose element exists and carries the words; the reader's play button exists; the next slide replaces it. Against the pre-fix FollowAlong the target is null and there is no `.tts-controls`.

### Honest limit (DR-0076 §8)
The **word** highlight depends on the speech engine firing boundary events, which some phone engines do not; the **sentence** highlight and the scroll are what these fixes reach. The CSS Custom Highlight API (Chrome 105+, Safari 17.2+, Firefox 140+) is required for any highlight to paint; a device without it hears the reading and follows by scroll only. Not reproduced on Darrell's device from here — the live review pass (DR-0104) is the proof of the screen.

## 2. "Even more obvious that this is a selection of courses… have the default say Select a Course of 23? Then leave it on the last one?"

Darrell 2026-09-06, from the live tab after the picker was moved to the top: the select showed "Learning A.I. The Way · 8 lessons" and read like a section title over that course's lessons.

**Now (`ChurchLearn.jsx`, `learn-organize.js`):**
- The label says what the control does: **Courses · select one of 23** (accent, bold), and the select is a visibly heavier control (48px, bold, accent border until chosen).
- **Default on a device that has never chosen:** the select's value is the prompt **"Select a course · 23 to choose from"** (a disabled option, not a course).
- **"Leave it on the last one":** a choice — through the picker, a deep link, Resume, or opening a lesson — is remembered per device (`poetech.learn.course`); a fresh visit reopens on it. The saved place is the fallback memory, so a learner mid-course lands on their course.
- The lesson index under the picker now **names its course** in its heading ("Living Lessons from the Word · pick a lesson by title · 127"), so the list is never "those lessons" under a title-like control.
- The content under the picker still falls back to the A.I. course when nothing is chosen, so nothing is ever empty; only the select tells the truth about whether a choice was made.

Gate: `learn-course-picker-is-a-selector.test.jsx` (8) — the prompt is the value on a fresh device and is not a course; the label; the course-named index; a choice shows and is remembered across a remount; the saved-place fallback; a blocked store never breaks the picker; and the pre-fix display is asserted absent. Two existing pins updated (48px ≥ 44px; the heading's case).

## Measured
- `eslint --max-warnings 0` clean; Learn suites (8 files) green; follow suites green; full suite run before push.
