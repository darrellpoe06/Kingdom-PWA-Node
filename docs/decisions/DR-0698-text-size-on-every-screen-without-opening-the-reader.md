# DR-0698 — Text size on every screen, without opening the reader

- **Status:** accepted
- **Tier:** A (a comfort control in existing chrome; no schema, no money, no identity change)
- **Type:** surface / accessibility
- **Date:** 2026-09-30
- **Scope:** `app/src/lib/text-size.js` (`stepTextSizeKey`, new, pure); `app/src/components/TextSizeControl.jsx` (`TextSizeQuick`, new); `app/src/components/TTSControl.jsx` (renders the pair beside the read-aloud button when the reader is closed, and on a device that cannot speak); `scripts/chrome-layout-probe.mjs` (mid-lesson size control counted with the reader CLOSED; the selftest break hides the pair too); `app/src/__tests__/text-size-on-every-screen.test.jsx` (new)
- **Principles:** REALITY-TRACE (DR-0061), VERIFICATION-DOCTRINE (DR-0076), SPEC-CONFORMANCE (DR-0219), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0524 (the reader can change how it looks; the one-store rule), DR-0652 (one bar owns the top of an open lesson; the header flows away), DR-0438 (the controls never get bigger), DR-0276 (big text is always reversible), DR-0640 (the collapsed row's dropdown, kept as Darrell chose it)

## Context

Darrell, 2026-09-30: *"Text sizes are the main reason why I keep opening the reader... give an option for that on each screen even without the other controls... make sense?"*

The premise handed to this work was that text size lived only inside the Read Aloud panel. The code says otherwise, and the difference is the finding. The setting is one per-device key, `poe-text-size` (`app/src/lib/text-size.js:52`), applied by `applyTextSize` as the root font-size and published to every control through `subscribeTextSize` / `useTextSize` (`text-size.js`, the "ONE SIZE, EVERY CONTROL" store). Three faces already drive it: the header's five buttons (`poe-financial-mvp-v28.jsx`, `<TextSizeControl variant="header" />`), the collapsed row (`TextSizeEscapeHatch`, a dropdown on a phone per DR-0640), and the reader panel's row (`TTSControl.jsx`, `data-testid="reader-text-size"`, DR-0524).

## What was measured

- **Where he reads, none of the first two are on screen.** Inside an open lesson the header is `position: static` (`index.css`, `html[data-lesson-space='open'] header.ts-safe-sticky`, DR-0652), so once he scrolls into the words the header row and the collapsed row both scroll away. The lesson bar carries no size control. The only size control left on screen was the reader panel's.
- **The instrument encoded the workaround.** The layout probe's mid-lesson comfort check (`scripts/chrome-layout-probe.mjs`, the DR-0524 block) tapped the read-aloud button open and then counted size controls. It could not see that a reader had to open the reader to change the size; it required it.
- **The read-aloud button is the one control on every screen.** `<TTSControl>` is rendered by the app shell directly after `</main>`, outside every view branch, so it is on every route; the Love Corner door, Practice and Follow Along mount it too.

## Impact

Unresolved: text size mid-lesson costs a trip through the reader panel (speed, voice, theme, cache) every time, which is exactly the friction he named. Resolved: A- / A+ is one tap on every screen that carries the reader, in the corner the floaters already own, with the reader closed.

## Decision

1. **`TextSizeQuick`**: A- and A+ (and an "A" back-to-Normal between them, shown only above Normal and from 360 px up, since at 320 px a third button would reach the Feedback button) in one small pill. It walks the same five steps through the same store (`useTextSize` -> `setTextSize`), so the header row, the collapsed dropdown, the reader panel and the pair are one switch: change one, all reflect it. The ends are disabled, never hidden, so the pair never jumps under a thumb.
2. **It rides beside the read-aloud button**, in the reader's idle row (`TTSControl.jsx`, `data-testid="reader-idle-row"`), so it is on every route with no new floating region over the words. It dims and settles with the button's idle-reveal. While the reader is open or reading, the panel and the mini-player own that corner and the panel's own size row is there.
3. **A device that cannot speak still gets it.** `TTSControl` no longer returns null when speech is unsupported; it renders the pair alone.
4. **Chrome, not reading text.** `.ts-chrome-region` with labels in `calc(px / var(--ts-chrome-scale, 1))`, so it is its Normal size at every step (DR-0438), and its buttons are 2.75rem inside the cap, 44 px on screen.
5. **The probe now counts mid-lesson size controls with the reader closed**, and fails if there are none (DR-0698 message). The selftest break hides the pair as well as the panel row, so the break still proves the pass can fail.
6. **Kept as decided:** the collapsed row's dropdown on a phone (DR-0640) and the header's five buttons are unchanged.

## Verification

- **Tests:** `text-size-on-every-screen.test.jsx` (8): the ladder clamps; the pair renders with the reader closed, with a group label and button labels; A+ writes the shared key, sets `data-text-size` on the root, and the reader panel's row then shows Large as current; a change in the reader panel shows in the pair; the pair renders on a device with no speech; reset only above Normal and disabled ends; chrome class, 44 px targets and non-compounding labels; the app shell renders `<TTSControl>` right after `</main>`, outside every view branch.
- **Proven-to-catch:** with the two `<TextSizeQuick>` lines removed from `TTSControl.jsx`, 4 of the 8 fail (render, shared-setting sync, reader-to-pair sync, no-speech). Restored, all pass.
- **Measured in Chromium, 375x812, the production build, lesson L1 open with the header tucked away and the page scrolled into the words (y 1194), reader CLOSED:** before this change the probe's own count with the reader closed would be zero (the header is static in a lesson and the lesson bar carries none); after, 1 size control group on screen, the pair at x 211 / y 748, 92x48, each button 44x44, no horizontal overflow. Tapping A+ moved `data-text-size` from normal to large, and opening the reader then showed "Large text size (current)" in its own row. Same on Midnight (the pair recolored to the theme: text rgb(229,229,229) on rgb(20,20,20)). At Big Print 44 the pair stays 44x44 with the reset showing, A+ disabled at the top step, and the reader row agreeing.
- **Lint and build** clean; the related reader, text-size, hideaway and one-tab suites pass (listed on the PR); the full suite and the layout probe run in CI.

## Honest remainder

- The standalone doors that do not mount the reader (Business, Properties, Venue request, the projector outputs) carry no size control; the projector outputs must not (DR-0453). **re-review: 2026-10-14.**
- While the voice is reading, the mini-player owns the corner and the pair steps aside; size is one tap into the panel there. If he wants the pair beside the mini-player too, it needs a 320 px fit measurement first. **re-review: 2026-10-14.**
