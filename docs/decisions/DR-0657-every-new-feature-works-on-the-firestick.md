---
id: DR-0657
title: Every new feature works on the Firestick
status: accepted
date: 2026-09-25
tier: B
type: defect
declared_by: Darrell
scope:
  - app/src/lib/tv-device.js (new), app/src/main.jsx, app/src/index.css — a TV is known by its user agent; the TV focus ring (4px, no fade-in) switches on at the 960px a Fire TV lays out at
  - app/src/lib/remote-navigation.js — on a TV a text field is not a dead end, a list does not change itself under a passing D-pad and OK opens it; from a control in the page a move stays in the page before the floaters
  - app/src/components/SectionTabs.jsx — Up and Down leave a tab strip instead of cycling it
  - app/src/lib/focus-keeper.js (new), app/src/components/TTSControl.jsx — focus is never dropped to the page when the reader folds
  - app/src/components/FloatingReader.jsx — Move and Reset buttons, so the window moves without a pointer drag
  - app/src/lib/mic-presence.js (new), app/src/components/OneVoiceInput.jsx, app/src/components/VoiceLessonRecorder.jsx — no microphone, no Record button, and the reason said
  - scripts/chrome-layout-probe.mjs — the Firestick pass, with a self-test that must trip
  - app/src/__tests__/firestick-every-new-feature.test.jsx (new, 17 checks), reader-focus-is-kept.test.jsx (new, 3 checks)
principles: [FORM-FACTOR-MEASURED (DR-0239), VERIFICATION-DOCTRINE (DR-0076), HOLD-THE-HAND (DR-0621), REALITY-TRACE, DO-NOT-RE-ASK (DR-0111)]
grounds:
  - DR-0654 — the Firestick reads aloud, and one reading keeps one voice (the voice half of this sweep, shipped first)
  - remote-navigation.js (2026-09-20) and the focus ring in index.css — the D-pad work this measures and extends
source: 2026-09-25 00:40 UTC — Darrell, "Will this work with the Firestick still?" and "All new features too?"
---

## Context

Darrell reads the app on an Amazon Fire TV Stick, in Silk, with a D-pad remote. At 00:40 UTC he asked: "Will this work with the Firestick still?" and then "All new features too?" The features shipped that day were:

- the reader keeps playing when you leave a tab (#1796);
- the mini-player on every tab (#1797): Text, ↩¶, pause, ↪¶ and the panel;
- Resume, and Start at a paragraph;
- the media-session skip buttons;
- the spoken-lesson recorder, Your lessons, and Record a conversation (#1795);
- the floating, dockable reader (#1801);
- the Love Corner one-tab brand row (#1808, open at the time of writing);
- Continue a lesson (#1793, #1802).

His follow-up, "We want the voice on too... can it read?!", was answered first and on its own: DR-0654 (#1816, #1818).

## What was measured

**The instrument.** Chromium through Playwright, shaped like the stick:

- a Silk user agent (`AFTKA … Silk/118`);
- **960×540 at DPR 2**, Amazon's Fire TV web-app display, scaled to the set, plus 1920×1080 at DPR 1;
- `speechSynthesis.getVoices()` returning `[]`;
- `getUserMedia` refused with `NotFoundError` and no devices listed;
- a local `/voice-lite` locked by the family bearer that answers a WAV;
- the family RPC answering the key.

Every control was driven with only ArrowUp/Down/Left/Right, Enter and Escape. A control counts as reachable if it can be reached from the first focus by D-pad: a greedy walk, then a breadth-first search over real key presses. The focus ring was measured after it settled, as width and contrast against what is behind it. The branch features were measured on builds of this branch merged with each feature branch.

**What failed, before this record (960×540):**

| # | Defect | Measurement |
|---|---|---|
| 1 | The TV ring never switched on | index.css keyed it to `min-width: 1600px`, and a Fire TV lays out at 960. Every control showed its own 2px ring. The 🔊 button faded its ring in over 0.5 s from 1px near-white (1.03:1 at the moment of focus). |
| 2 | A text box was a cage | On Notes the D-pad went into the one-voice box and stayed there for 25 presses of 25. "Record a conversation" was 200px below. |
| 3 | A list changed itself | One Down on the reader's "Start at" list chose paragraph 1 and started reading (2 synthesis requests), and the arrows could never leave the list. |
| 4 | Tab strips were cages | `SectionTabs` stepped the strip on Up/Down and wrapped. 30 presses of Down on Learn cycled the department row (Courses … Development, Courses …) and changed the department on every press. The Love Corner's Worship/Speak/Prayer row did the same. Continue a lesson sat below it, unreachable. |
| 5 | The floaters caught every step | From content, each Down went "Church" (sticky), then "4G" (fixed), then "Open feedback" (fixed), then the next content: four presses a step. |
| 6 | Focus was dropped | "Read this lesson" folds the panel. The focused button unmounts, focus falls to `<body>`, and the next press jumps to Give at the top of the page. |
| 7 | The floating reader could not move | The title bar is not focusable. Moving was pointer-drag only and Reset was double-tap only. |
| 8 | Record was offered with no microphone | "Record a conversation" and 🎤 Speak showed, and the first press ended on "No microphone was found on this device." |

**The walk after this record**, TV profile, 960×540 at DPR 2 (reachable = presses from the previous control or first focus; ring = width and contrast):

| Feature | Control | Reachable | Visible focus | Activates |
|---|---|---|---|---|
| Read aloud with sound | 🔊, then ▶ Read this lesson | yes (10, 2) | 4px, 4.41:1 / 4.68:1 | yes: NAS audio playing, 6 keyed requests, the highlight through 4 sentences in 5 s (also with `CSS.highlights` removed: the fallback boxes move) |
| Reader panel | × Hide (keeps reading) | yes (1) | 4px, 4.68:1 | yes: the mini-player shows |
| Mini-player | Text · ↩¶ · ❚❚/▶ · ↪¶ · 🔊 | yes (2 · 1 · 0 · 1 · 5) | 4px, 4.68:1 each | yes: scrolls to the text; the paragraph moves back / forward; pause pauses and play resumes the clip |
| Leave a tab | header tab "About" | yes (3) | 4px, 4.41:1 | yes: still playing on About, the mini-player on screen, its ❚❚ reachable (3) |
| Media-session skip | ⏭ / ⏮ | n/a | n/a | handlers wired for play, pause, stop, next, previous, seek; `nexttrack` moves the paragraph |
| Resume / Start at | ▶ Resume · Start at a paragraph… · the list | yes (2 · 3 · 3) | 4px, 4.68:1 | Resume plays from the bookmark. The list opens; a passing Down no longer starts a read. |
| Recorder | Record a conversation / Record the lesson / 🎤 Speak | not offered | — | the line: "This device has no microphone, so nothing can be recorded here…" |
| Floating reader | ⧉ Pop out · ▶ · ↪¶ · speed · ✥ Move · ⟲ · ⤓ Dock | yes (6 · 6 · 1 · 1 · 3 · 3 · 3) | 4px; 4.68:1 in the window, 3.79:1 on the dark title bar | yes. Move with OK, arrows, OK: 584,180 → 520,184. Reset puts it back. Dock docks. |
| Continue a lesson | Continue (latest) | yes (7) | 4px, 4.41:1 | yes: the lesson opens |
| Love Corner brand row (#1808 merged locally) | collapsed: Show header | yes (0) | 4px, 4.41:1 | yes: the header comes back; the brand shows in the top row; no lone tab strip; no overflow |

At **1920×1080** the same walk passes. The first Read in that run was reached in 2 presses by search. The floating window opens at 1544,620 and moves to 1480,624. Continue is reached in 4 presses. There is no page overflow at either size.

## Impact

On a Fire TV, the day's reader features worked, but most of the app around them could not be walked with a remote:

- a text box, a list or a tab row could hold the D-pad for good;
- the ring was thin;
- the reader's own fold threw the place away;
- the floating window could not be moved;
- a Record button that could not work was offered.

## Decision

1. **A TV is known by what it says it is.** `tv-device.js` marks `<html data-device="tv">` from the user agent: Fire TV `AFT…` codes, Android TV, Google TV, Tizen, webOS, BRAVIA, CrKey, Roku and AppleTV. A Fire tablet running Silk is not a TV. On a TV, every focus ring is 4px from the first frame.
2. **On a TV a field is not a dead end.** An arrow leaves a text field when the caret can go no further that way. A list takes no arrows: the D-pad moves on past it, and OK opens it (`showPicker`). Off a TV, the keyboard keeps its arrows.
3. **A tab strip is a row.** Left and Right step it. Up and Down leave it.
4. **The page before the floaters.** From a control in the page, a move stays in the page when the page has anything that way. Fixed and sticky controls are still reached at the end of the page, from each other, or sideways.
5. **Focus is kept when the reader folds.** When the focused control disappears and focus falls to nothing, it goes to the reader's most useful control: the mini-player's pause, or the small bar.
6. **The floating reader moves without a drag.** ✥ Move, then OK, the arrows (32px a press) and OK again. ⟲ Reset is a button.
7. **No microphone, no Record.** `enumerateDevices` with no `audioinput` hides Record and Speak and says why. An unreadable list is unknown, and unknown never hides a button.
8. **A standing gate.** `chrome-layout-probe.mjs` runs a Firestick pass on every CI run: 960×540 at DPR 2, a Silk user agent, no device voices and no microphone. It checks that the document is marked as a TV and the page does not overflow. It checks that the D-pad reaches 🔊 from the top of a lesson, that "Read this lesson" sends the family key and a real clip plays, and that the D-pad reaches every mini-player control, each with a ring at least 3px wide at 3:1 or better. Enter on pause must pause. The pass takes about 12 s.

## Verification

- `firestick-every-new-feature.test.jsx`, 17 checks. On the code before, 10 fail, each on its own assertion:
  - no `markTvDevice` in boot;
  - the box keeps the D-pad (`null` instead of the Record button);
  - `caretAtEdge` missing;
  - Down on the list is not prevented, and OK does not open it;
  - Record is offered with no microphone;
  - Down steps the tab strip;
  - Down lands on the fixed Feedback button;
  - there is no Move control, and `stepRect` is missing.

  The other 7 are counter-examples that must pass on both, for example: off a TV the box keeps its arrows; a device with a microphone keeps Record; an unknown device list keeps Record.
- `reader-focus-is-kept.test.jsx`, 3 checks. Two fail on the code before, where focus stays on `<body>`.
- **The gate proves it can fail.** `--selftest-break` runs two TV cases:
  - with the family key withheld, there is no sound;
  - with the TV mark removed and every arrow swallowed in the mini-player, the page is not marked as a TV, the ring falls to 2px, and the D-pad cannot reach the mini-player.

  The run showed 7 TV trips, and `SELFTEST-BREAK OK`. The real `--sweep` passed: 44/44 chrome, 7/7 lesson and 16 text-scale cases, plus the TV pass.
- The related suites pass: 91 files and 1,133 tests (the reader, TTS, voice service, clip queue, remote, one-voice, recorders, tab strips, floating reader and the firestick suites). Lint is clean. `verify:gates` is green.

**What only a real Fire TV can confirm.** These are not claimed:

1. **Silk's D-pad arrives as arrow keys in a web page.** remote-navigation.js was written on that premise (2026-09-20), and Darrell's reports since fit it: "it does click and do what it should". But Silk can also drive a pointer with the D-pad. Chromium cannot show which mode his stick uses.
2. **The remote's ⏯ ⏪ ⏩ keys reach `navigator.mediaSession`.** The handlers are wired and proven in Chromium. Whether Silk routes the remote's media keys to them is a device fact.
3. **The user-agent mark.** It rests on the `AFT…` model code Amazon documents for Fire TV user agents. His Silk's exact string was not read.
4. **A `<select>` on OK.** `showPicker` exists in Chromium 121+. On an older Silk, OK falls back to the browser's own behaviour.
5. **The on-device voice (DR-0656)** on a Fire TV's CPU. It was not in this sweep's list, and a stick's real-time factor is unmeasured.

**His test on the Firestick:**
1. Open The Love Corner → Learn. Press Down: it leaves the department row and reaches the lessons, and Continue if you have one.
2. Open a lesson, then press Down until 🔊 is ringed (a thick ring). Press OK, then **Read this lesson — start to finish**. The church's voice reads and the lit sentence follows.
3. Press × to hide the panel. The ring sits on ❚❚. Left and Right move across Text, ↩¶, ❚❚, ↪¶ and 🔊. OK on ❚❚ pauses.
4. Press ⏯ on the remote. If the reading pauses, item 2 above is confirmed.

re-review: 2026-10-02. That covers his walk on the stick (the four items above) and the church key for Love Corner members with no family space (DR-0566, DR-0654).
