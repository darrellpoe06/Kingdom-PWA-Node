# DR-0147 — Big Print 44, and reading starts where the reader taps

- **Status:** accepted
- **Tier:** A (additive accessibility steps + a new control on the existing floating reader; no schema, no money, no front-door change)
- **Scope:** `lib/text-size.js` (the giant + bigprint steps), `components/TextSizeControl.jsx` (six-step stepper), `lib/read-from-here.js` (new — tap → word → reading start), `components/TTSControl.jsx` (the "Start where I tap" control), tests (`text-size.test.js`, `read-from-here.test.js`)
- **Date:** 2026-07-10
- **Principles:** COMMUNITY-FIRST-MISSION (elders and children), ANXIETY-CLARITY (the surface answers "how do I make it read from HERE"), VERIFICATION-DOCTRINE (DR-0076 — exact mapping, honest fallback, gates held), PERPETUAL-IMPROVEMENT (DR-0075), APP-IS-PRIMARY (DR-0065)

## Directive

Darrell, 2026-07-10, after the Learn large-print fix landed: *"Can we increase even more for our readers and if Ari could start right at wherever users want it to start it or whatever word on the page then it would be a intuitive experience. I've asked multiple times can we implement the solution after researching?"* And sharpening the size: *"Can we get up to 44 big print for our users if needed and still make it look good and not overcrowded the device its on however we want it to read the screen and also have big print for our community and children who will use this for learning how to work inside the church and home and learn how to learn."*

## House-first (what already existed, reused not replaced)

- The **root-scale text-size primitive** (2026-06-17) already carries any multiplier to every rem-authored surface, and its **chrome cap** already answers "not overcrowded": nav and page titles follow only a quarter of the content's growth, so the WORDS grow, not the frame. Reaching 44 needed two new steps, not a new mechanism.
- The **floating read-aloud control** (TTSControl) is already on every page in the user's one chosen voice — but it could only read from the TOP of the page. "Start where my eyes are" was the missing half of intuitive; that is the piece that had been asked for and not yet built.

## Decision

1. **Two big-print steps join the stepper: Giant (2×) and Big Print 44 (2.75×).** At Big Print 44, 16px body text renders at **exactly 44px** — true large-print territory for elders and for children learning to learn — and the chrome cap keeps the frame usable (a pinned test proves the 44). The stepper reads A / A+ / A++ / A+++ / A++++ / **A44**.
2. **Reading starts where the reader taps.** The floating reader gains **"Start where I tap"**: arm it, touch any word on the page, and Ari begins reading from that word. The tap is mapped to the exact word by rebuilding the same normalized text the reader speaks and locating the tapped DOM position inside it (`lib/read-from-here.js`, pure and unit-tested); mid-word taps snap to the word's start; taps on floating chrome are refused rather than misread; a device whose engine can't resolve the tap falls back to reading from the top — never silence, never a wrong start presented as right. Esc or Cancel stands the mode down.
3. **The consistency gate held its line during the build** — it rejected a new emoji-as-icon on the control and the button ships with the design system's `UiIcon` instead. The gate catching its class mid-feature is the system working (DR-0076 proven-to-catch, live).

## Opportunities and constraints

- **Constraint (held):** word-level tap mapping needs `caretRangeFromPoint`/`caretPositionFromPoint`; engines without either get the honest top-of-page fallback. No painted capability.
- **Constraint (held):** very dense boards at Big Print 44 will wrap long — the step is opt-in, one tap back down, and reading surfaces (Learn, The Word, Presenter) are its purpose. Verified in the built bundle; the family's DR-0104 reviewer pass on the live site is the layout eye. `re-review: 2026-07-17` with the px-sweep item.
- **Opportunity:** highlight the word being spoken as Ari reads (the visual follow-along for children learning to read). `re-review: 2026-07-31`.
- **Opportunity:** resume-where-you-left-off reading — pair read-from-here with the existing reading-position anchors. `re-review: 2026-07-31`.

## Supersedes / pairs

Pairs with the 2026-06-17 text-size decisions (root scale + chrome cap — this rides them), DR-0138 (the reading voices this starts), the Learn/Presenter rem conversion (same day — the surfaces Big Print 44 serves), and COMMUNITY-FIRST-MISSION (the named readers: elders, community, children learning how to learn).
