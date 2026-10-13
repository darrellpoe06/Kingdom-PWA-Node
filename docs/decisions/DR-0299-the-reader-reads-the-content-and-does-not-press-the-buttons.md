---
id: DR-0299
title: The reader reads the content and does not press the buttons — chrome is not reading material, a popup is not a disclosure, and one press of play carries a section to the end at every depth
date: 2026-08-13
status: accepted
supersedes: []
superseded-by: null
amends: []
tier: A
entities: [church]
grounds: [WORD-FIRST, VERIFICATION-DOCTRINE, MACHINERY-OVER-MEMORY, COMMUNITY-FIRST, REALITY-TRACE, PERPETUAL-IMPROVEMENT]
source: 2026-08-13 session — Darrell, from the Scripture tab with the reader running: "The reader reads the Highlight Up Arrow... etc... I want the content and then if context is needed that can be further applied... however I want users to be able to get the whole lesson from pushing play once... beginning to end... opportunities and constraints..." / "also the color tab pops up on its own after a while... fix bugs.. and make better..." / "Verses plus the 'Whosoever — the…' commentary... not the other translations, only KJV and ESV if possible..." / "Also each version all the way to deep for each section... understand..." / "cloud voice path... so it keeps playing with the screen off — no other options for continuing to work on the local phone for users? really?"
---

## Context

Two bug reports and one feature request, all from the Scripture tab, all in one
sitting. Tracing them found that the two bugs were **one root cause**: the reader
was treating interactive chrome as reading material — it SPOKE the control
labels, and it CLICKED the controls.

## What was wrong

**1. The reader spoke the buttons.** `readablePageText()` in `TTSControl.jsx` is
the FALLBACK reading, used by any surface that has not registered its own
(`read-target.js`). Only `ChurchLearn` and `Presenter` ever registered one —
**Scripture registered nothing** — so its reading was the whole of
`<main>.innerText`, and `innerText` carries every control label. It stripped
exactly three things (`.tts-controls`, `.feedback-modal`, `[aria-hidden]`).
Everything else went to the voice: *"↑ HIDE OTHER TRANSLATIONS · ESV · NIV ·
NKJV · AMP · CLEAR HIGHLIGHT · GIVE · FEEDBACK · × HIDE"*, threaded through the
Word. On a platform whose point is hearing Scripture, that is the reading itself
corrupted by furniture.

**2. The reader pressed the colour palette open.** Before reading,
`revealForReading()` opens collapsed content by clicking every
`[aria-expanded="false"]` inside the reading root — the only way a
conditionally-rendered panel can come into existence. `VerseHighlighter`'s swatch
is exactly that shape, and it opens a `role="menu"`. So the reader popped a
palette open on **every verse on screen** — the two-at-once state in Darrell's
screenshot is the loop walking down the page. "After a while" is when the reader
runs.

`read-reveal.js`'s own header already said it must NEVER touch "menus/dialogs
(`[aria-haspopup]`)". **The guard was right; the component never carried the
attribute the guard looks for.**

## Decision

1. **Chrome is silent by default in the page-read fallback.** Nav, buttons,
   menus, tab strips, dialogs and form controls are stripped, with
   `data-read-keep` to opt a node back in and `data-read-skip` to opt out. The
   default is silence because the default was the bug. This is a fallback, not
   the destination — the real fix for a surface is to register its own reading.

2. **A popup is not a disclosure, even when its author forgot to say so.** Fixed
   at BOTH layers: `VerseHighlighter` now declares `aria-haspopup="menu"` (simply
   correct ARIA, which is why it belongs in the component rather than as a
   special case in the reader), AND `revealForReading` refuses any button that
   OWNS a popup — `aria-controls` pointing at one, or a menu/listbox/dialog as
   its sibling — attribute or not. Fixing only the component would have left the
   rule as "works if every future author remembers one attribute."

3. **Scripture registers a real reading** — its first ever. That closes bug 1 at
   the source and buys the two things a page-scrape can never have: follow-along
   highlighting (the reader maps the named element) and hands-free continuation.

4. **One press of play reads the whole section, at EVERY depth, then walks on.**
   `lib/scripture-reading.js` composes: title → blurb → the lens (His
   perspective / His heart / His love) → the soul aim → **every authored depth,
   light to deep** → the level framing → the views → each verse as reference +
   KJV + its gloss. `next()` advances section after section to the end.

5. **The depth ladder is composed from DATA, never from the rendered DOM.** The
   page shows one tier at a time because a reader chooses how far to go; a
   listener cannot tap between tiers mid-sentence. Anything scraping what is
   rendered would sound perfectly fine while **silently withholding the Deep
   treatment** — which is why "all the way to deep" is only verifiable as a unit
   test over the data. `depthLadder()` deliberately does NOT use `resolveDepth()`:
   that helper falls back DOWN the ladder to guarantee a reader always sees
   something, so asking it for three tiers on a standard-only theme returns the
   same paragraph three times — a machine stuttering. Only authored text is
   spoken, and an exact repeat is dropped.

6. **ESV is refused on COPYRIGHT, not capability.** `scriptures.js` is explicit:
   *"Other translations — REFERENCE only (copyright)… the text is never copied
   here."* The corpus on disk is `public/bible/kjv` and nothing else, and
   `OtherTranslations` renders outbound BibleGateway LINKS. Reading ESV aloud
   would mean reproducing a copyrighted translation this platform has
   deliberately refused to reproduce. Darrell's "if possible" is answered — not
   without a licence — and he confirmed it can stay as-is. A test pins the stated
   reason so a future session cannot quietly paste ESV text in and call it a
   feature.

## Proven-to-catch (DR-0076 §3)

Executed, each fix reverted independently against the same suite:

| reverted | result |
| --- | --- |
| the palette fix (both layers) | **4 of 10 fail**, including the every-verse case from the screenshot |
| the chrome strip | **2 of 10 fail** |
| nothing (fixed) | 10 / 10 pass |

The "a real disclosure is still clicked open" and "`<details>` is still opened"
cases pass **throughout**, so neither fix disarmed the feature it guards, and a
human tap still opens the palette. 29 new pins; suite 7,733 green; lint clean;
build clean.

## A correction this record exists to carry

Asked for "opportunities and constraints," the agent told Darrell that hands-free
listening through a long section "needs the cloud voice path, not the device
voice — a real boundary." **Both halves of that were wrong**, and he pushed back
correctly (DR-0108: a stated *can't* is an unverified premise). Measured:

- **Background / screen-off playback is already built and wired.**
  `lib/background-audio.js` holds ONE silent looping `<audio>` element for as long
  as the reader reads — a mobile browser freezes a backgrounded page unless it is
  playing media, and `speechSynthesis` is not media — plus MediaSession
  lock-screen controls. It is created in `use-read-aloud.js:123`, the hook every
  reader uses, so the Scripture reading added here inherits it. It was built
  2026-08-10 from Darrell's own request.
- **On Android/Chromium it works with the DEVICE voice, no cloud involved** —
  that module's own limits section names it as the proven path, and Darrell's
  device is Android.
- **The axis was wrong.** It is `speechSynthesis` vs. an `<audio>` element, not
  local vs. cloud. The app's clip path is `SOVEREIGN FIRST, vendor RECORDED`
  (`VITE_VOICE_SERVICE_URL` → self-hosted; `infra/voice-studio` on the NAS), so
  calling it "cloud" mislabelled Darrell's own box as a vendor.

The lesson is the day's lesson in a new place: **an honest-limits paragraph in a
module header is a source to READ, not a summary to repeat.** The claim was made
from memory of the shape of the problem rather than from the file that already
had the answer — the same failure the `cited-but-unread` hook caught earlier the
same day on DR-0107.

## Consequences

- The reading is the Word and its teaching; the furniture is silent.
- The colour palette opens only when a person taps it.
- Scripture gains follow-along highlighting and hands-free continuation.
- Screen-off listening on Android already works and is now correctly documented
  rather than wrongly disclaimed.

## Honest remainder

- **The iOS gap is real but is quoted, not measured here.** `background-audio.js`
  states that iOS Safari suspends Web Speech in the background even with an audio
  element playing, while a real audio clip continues. No iOS device is available
  in this session, so that is repeated as its source's claim and not as an
  independent finding. Closing it locally is available and unbuilt: NAS-rendered
  clips over the existing same-origin transport, or on-device WASM TTS.
  **re-review: 2026-08-27.**
- **This DR was itself a dangling citation for ~20 minutes.** The commit merged as
  PR #1243 cites `DR-0299` in its subject and this file did not exist until after
  the merge — the exact defect found and closed earlier the same day for the
  dangling `DR-0292` citation (see DR-0294's renumber note). Recorded rather than
  quietly fixed, because a rule broken by the person who just fixed it is
  evidence the rule needs machinery: **a gate that fails a commit citing a DR
  with no file is the real close, and it does not exist.** re-review: 2026-08-20.
- Search results on the Scripture tab register no reading (only theme sections
  do), so a searched set still falls back to the page read — now chrome-free, but
  without follow-along or continuation.
