---
id: DR-0657
title: The reader keeps up with the sentence, says when it is following, and keeps the voice on the device
status: accepted
date: 2026-09-25
tier: A
type: defect
declared_by: Darrell
scope:
  - app/src/lib/reader-follow-prefs.js, app/src/lib/read-follow.js — follow on/off, highlight on/off, where the sentence lands
  - app/src/components/TTSControl.jsx — the Following button, the Follow along and On this device groups, the pill kept on the screen, the focus ring shown at once
  - app/src/lib/clip-cache.js, app/src/lib/clip-queue.js, app/src/lib/use-read-aloud.js, app/src/lib/voice-service.js — the NAS voice's clips kept on the device, fetched ahead
  - scripts/chrome-layout-probe.mjs — the reader pass (412x915 A+++, 390x844, 1920x1080), with a selftest that trips
principles: [HOLD-THE-HAND (DR-0621), VERIFICATION-DOCTRINE (DR-0076), PERPETUAL-IMPROVEMENT (DR-0075)]
grounds:
  - DR-0653 — one piece per reading segment; the lit sentence is the piece playing (this builds on it)
  - DR-0633 — the mini-player and "Back to the voice"
  - DR-0654 — the Firestick reads aloud; one reading keeps one voice
source: 2026-09-24/25 — Darrell, from his phone (~412 px, A+++, dark theme, L191 in the NAS voice), and about the Fire TV
---

## Context

The reader played in the background once the NAS voice was in ("The reader plays in the background now!!!!!!!! Nice!!!!!!!"). Darrell then raised four things:

- "Still need the reader to keep up with the sentence when users want to... do we have all options?"
- "The reader should keep the reading at the top of the page as much as possible... currently it's almost at the bottom of the page... fix it."
- From a phone screenshot: "text orange means follow!!!!!" He had read the orange ring on the mini-bar's Text button as the follow state.
- Whether this still works on the Firestick.
- "So we need a direct connection to the nas for a good reading?!!! Can't we give everything it needs for quality without needing to reconnect with the nas?"

The same screenshot showed the Feedback pill, the back-to-top arrow, Give and the network dot overlapping the reader at 412 px A+++. These were measured on the built app: Feedback × mini-bar, network × mini-bar, Give × "Back to the voice", and the minimized pill 82 px off the left edge. Darrell then asked for every floating button to move into the header, and that is its own lane (`claude/header-carries-the-indicators`). So this record leaves the app's floaters where they are. It keeps only the reader's own part of that screen: the pill now wraps inside the screen.

## What was measured

- **Why the sentence sat near the bottom.** `readingScrollDelta` moved the page only once the sentence had left the reading band. It then moved only far enough to bring the sentence's bottom edge back inside the band. So as the reading advanced, each sentence sat lower than the last until it rode the bottom edge. On a 915 px phone with 180 px pinned at the top, the sentences walked 250, 330, 410 … 713 px down and stayed there, 533 px below the pinned top. The floating reader's word box had the same rule: it moved only when the sentence left the box.
- **After the fix, in Chromium with the real reader and L191 in the NAS voice** (`scratchpad/follow/prove-top.mjs`), measured as the reading advanced, from the spoken sentence's top to the bottom of whatever is pinned at the top:

  | Where | 412×915, A+++ | 390×844, A |
  |---|---|---|
  | The page | 50, 54, 95, 54, 54, 54 px | 31, 34, 34, 34, 34, 34 px |
  | The float's own box (from its top) | 14 to 40 px | 40 px |

  Every look is within 120 px.
- **The orange ring.** It was the focus ring the Text button keeps after a tap. The button had no follow state. That is a premise conflict, and it is the reason the button now says its state in words.
- **The Fire TV, at 1920×1080 over the NAS voice:**
  - Focus walks the mini-bar in order: Follow, back a paragraph, pause, forward a paragraph, panel.
  - Four of the five buttons showed a 2 px ring. The round panel button showed **0 px**, because `transition-all` faded its focus ring in over half a second. Only opacity and position ease now, and the ring shows at once.
  - Enter on Follow goes following → not following → following.
- **The device cache, on the built app at 390×844, NAS answered locally** (`scratchpad/follow/prove.mjs`):
  - L191 is 276 pieces (273 unique clips; three repeated headings share one).
  - The first play fetched each unique piece exactly once (273).
  - The panel then said "The whole lesson is on this device (276 of 276 pieces · 101 MB) — it plays without the NAS."
  - With the NAS cut off, playing again from the top made **0** requests and kept playing.
- **Size:** a Piper clip is 16-bit, 22,050 Hz WAV, about 44 KB a second. A long lesson is about 100 MB, so 300 MB holds about three.

## Impact

- The page could not be told to hold still, or to keep the voice in one place on the screen.
- The only sign of "following" was a colour that meant something else.
- A remote's user landed on the panel button with no ring.
- Every replay, resume or jump asked the NAS again, and a dropped connection stopped the voice.

## Decision

1. **Follow along, the listener's choices, kept on this device** (`reader-follow-prefs.js`):
   - **Follow the voice.** On: the spoken sentence is scrolled into view. Off: the page never moves, and the sentence is still lit.
   - **Highlight.** The sentence, or off.
   - **Sentence sits.** At the top (the default) or centre.
     - Top places each new sentence 14 px under whatever is pinned at the top, measured on the live page every time (the header, the brand row, the lesson's sticky title block). One line of what came before stays visible above it, when the sentence still fits.
     - Centre puts the sentence's middle on the reading band's middle.
     - Either way, a 12 px slack means the page never nudges.
     - The floating reader's word box follows the same choice.
   - Scrolling by hand still pauses following, and "Back to the voice" resumes it.
2. **The state says itself.** The mini-bar button reads **Following** (filled, `aria-pressed=true`), **Follow** (outlined), or **Text** when the words are on another page. It and the panel's "Follow the voice" are one stored choice. The orange ring is only the focus ring, and on a remote it now shows at once.
3. **The voice is kept on the device** (`clip-cache.js`):
   - Each clip is kept in **IndexedDB**, keyed by voice + model + exact words. It is not in Cache Storage, because the service worker deletes every other cache on each deploy.
   - The player asks the device first, and each piece is fetched from the NAS at most once. The player and the fetch-ahead share the request.
   - With the first piece playing, the rest of the reading comes down three at a time.
   - "Save this lesson for listening offline" does the same without playing (with the family key first, as a read does), and shows "N of M pieces · size".
   - The least recently played clips are cleared past the cap: 300 MB, with a choice of 100 MB, 300 MB, 600 MB or 1 GB.
   - The panel's line is read from the device each time it opens, never remembered as a claim.
4. **A reader pass in the layout probe** at 412×915 A+++, 390×844 and 1920×1080, while a real reading plays. It checks:
   - The pill and mini-bar are on screen.
   - The lit sentence is in view while following.
   - At 1920, the D-pad walks the mini-bar with a ring, and Enter works.

   Its selftest takes the ring away and must trip.

**Not done here, with a date:**

- **The app's floaters (Feedback, Give, the network dot, back-to-top).** They move into the header in the header lane; the overlaps measured above are that lane's evidence.
- **Save a whole course.** A course's pieces must be the words each lesson's rendered page speaks. Those come from the lesson component, not from a library the reader can call. Re-review 2026-10-02: have the lesson landing (`lib/learn-open.js`, DR-0642) hand the reader each lesson's spoken text.
- **Smaller clips.** Opus at about 24 kbps on the NAS would make a lesson about 5 MB instead of 100 MB. It needs an encoder on the NAS (unverified) and a services-sync install. Re-review 2026-10-02.
- **The on-device voice (DR-0656, #1819).** It downloads Piper once and makes the voice on the phone itself. Today it is set up from the Voice Studio card and is not on the reader's path. When the reader takes it, its pieces can use the same keys (voice + model + words) and the same cap. Re-review 2026-10-02.

## Verification

- `reader-follow-options.test.jsx`. Each break was made and each was caught:
  - Follow off still scrolling.
  - Highlight off still lighting.
  - The place not passed on.
  - The button always saying "Text".
  - The button acting as a separate choice from the panel toggle.
  - The choices not stored.
  - Top third behaving like the old rule.
  - Centre landing at the top.
  - The panel trusting its list instead of the device.
  - The save using the registered text instead of the mapped lesson.
- `reader-follow-options.test.jsx` also walks a reading on a 915 px phone. The new rule holds every sentence at 230 px, 180 px of pinned chrome plus 14 px plus one 36 px line. The old rule's walk down to the bottom edge is asserted as measured.
- `float-reader-keeps-the-sentence-at-the-top.test.jsx`: a sentence near the bottom of the float's box is brought to the top (or centred). It fails on main's `FloatingReader.jsx`, which did not move it (0 px where 226 and 110 were due).
- `chrome-layout-probe.mjs`, the reader pass R3: at 412 A+++, 390 and 1920, the lit sentence's top stays within 120 px under the pinned top across three looks while the voice moves on.
- `voice-clips-kept-on-device.test.js` (9 tests). Each break was made and each was caught:
  - The source skipping the cache (replay then made fetches).
  - No fetch-ahead (a drop then stopped the reading).
  - Eviction doing nothing, or clearing the newest first.
  - A played clip not marked as played.
  - The player and the fetch-ahead fetching separately.
- `voice-lite-one-sentence-per-clip.test.jsx` and `the-lit-sentence-is-the-one-heard.test.jsx` (DR-0653): the lit sentence is the piece playing at 1.5×.
- `firestick-reads-aloud.test.jsx` (DR-0654) now starts each case with nothing kept on the device. Before that line, a clip kept by one case was played from the device in the next, and the NAS was never asked. That is the cache working; the tests measure the road.
- `chrome-layout-probe.mjs --selftest-break`: the reader pass trips with the mini-bar's focus ring removed.
- Screenshots: `scratchpad/follow/proof-390x844-*.png`, `proof-1920x1080-*.png`.

**His test:**

- **On the phone:** start L191 and put the panel away. The sentence being read sits just under the lesson's title block, not at the bottom. The button says **Following**. Tap it: it says **Follow**, and the page holds still.
- **Offline:** open the panel, choose "Save this lesson for listening offline", wait for "The whole lesson is on this device", turn on airplane mode, and play it.
- **On the Firestick:** the remote's arrows move through the mini-bar with a ring, and the centre button presses.

re-review: 2026-10-02 — the course save, smaller clips and the on-device voice (above); his phone and Firestick listen.
