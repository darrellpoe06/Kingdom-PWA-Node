# DR-1152: TLC Therapy Solutions wears its own ivory & forest — a theme and a shape, never a rebuild

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (a real business's public identity on every surface of its own door; held to the same content gate as the door itself — Christina Poe, LCSW reviews the live preview)
**Type:** word
**Area:**
- `app/src/lib/theme-css.js` (the `tlc` theme; `TLC_DEFAULT_THEME`)
- `app/src/lib/tlc-ui.js` (new — the TLC design system as class strings)
- `app/src/components/TlcPublicDoor.jsx` (the client door: welcome band, round portraits, rounded cards, forest pills, the theme fallback; the door no longer writes a fixed ink over the phone's bars)
- `app/src/components/Tlc*.jsx`, `Practice.jsx`, `PracticeLearn.jsx` (the office screens draw their field, button, cards and portraits from the design system)
- `app/public/manifest-tlc.webmanifest`, `app/public/tlc/index.html`, `app/tlc/app/index.html` (the install identity and the sendable entry page wear the palette)
- `app/src/__tests__/the-tlc-door-wears-its-own-green.test.js` (new); `books-reports-theme.test.jsx` and `the-reader-color-picker-reaches-every-door.test.js` (retargeted, not relaxed)

**Grounds:** Darrell, 2026-10-21, with a reference image on screen: **"transform the application's appearance into a beautiful, modern, professional, welcoming, and user-friendly therapy platform... warm ivory and cream backgrounds, deep forest green for primary buttons and navigation, soft sage green accents, warm beige and taupe, subtle champagne and muted gold accents, dark charcoal for primary text... rounded cards, soft shadows, elegant typography... DO NOT DELETE, REMOVE, REPLACE, OR DISABLE ANY EXISTING FEATURES, INFORMATION, OR FUNCTIONALITY."**
**Principles:** DR-0076 §4 (measure, do not claim); DR-0099 (true red marks nothing); DR-1046 (Heritage is the family app's first-run theme); DR-1060 (a door opens in its own colors by a door fallback); DR-0524 (a device that chose keeps its choice); DR-0061 / DR-0065 (the app is the primary artifact; surfaces are live views of real data)

## Context

The TLC Therapy Solutions app is the TLC door of the PoeTech PWA (`/tlc/app/?tlc=1`), not a separate codebase: one client door (Find your therapist · Mental skills · Join the team · sign in / create an account), the signed-in client's door (their lessons), the new colleague's packet, and the staff office (Inquiries · Client Growth · Revenue · Training · Team · Assistant · Onboarding) — plus the same office inside the family app's TLC tab. Every one of those screens drew itself in the house vocabulary (ink `#1A1815`, rust `#B85838`, line `#E8E4DC`, muted `#5A5751`) with square corners and hairline borders, and the door opened in the house cream.

The reference is a therapy platform: an ivory field, white cards with one soft shadow and rounded corners, a forest-green primary button, sage tints, charcoal text, serif display headings, round portraits, pill tabs.

## What was measured

**The audit (the inventory the brief asked for).** 16 `Tlc*` components, `Practice.jsx` (725 lines), `PracticeLearn.jsx` (1,804), the office module's `OfficeAssistant.jsx` (679), the door (504). Their color vocabulary, counted: `#5A5751` ×391, `#B85838` ×284, `#1A1815` ×274, `#E8E4DC` ×196, `#5A6E3D` ×112, `#FAF8F4` ×71 — six house literals carry 95% of every color on every TLC screen, and all six are literals the themes already remap. One inline color in the lot (the theme swatch, by design). Seven files each carried their own copy of the same `INPUT` / `BTN` string.

**What the reference shows that this app does not have:** appointments, a progress tracker, in-app messaging, billing and insurance screens, an account page. Booking lives in Acuity (`TLC_BRAND.bookingUrl`); there is no clinical record here by the TLC bright line (no PHI). The brief says *"wherever those features already exist"* and *"do not introduce new features unless I specifically approve them."* So none were built; the reference's **finish** was applied to the screens that exist.

**The palette, measured with `scripts/contrast-guard.mjs`'s own math before a line of CSS was written:**

| pairing | ratio |
| --- | --- |
| ink `#2A2B27` on ivory `#F4F2ED` / card `#FFFFFF` / tray `#E6EBE3` | 12.74 / 14.25 / 11.78 |
| muted `#5F635B` on ivory / card / tray | 5.48 / 6.14 / 5.07 |
| white on forest `#2E4A3C` (the primary button) | 9.72 |
| forest accent text `#2F5D4A` on ivory / card | 6.74 / 7.54 |
| sage text `#3F6B50` on ivory / card | 5.47 / 6.12 |
| gold text `#7A6230` on ivory / card | 5.19 / 5.81 |
| champagne `#C7B27A` as text on ivory | **2.1 — fails**, so it is a rule and a fill only |
| ink on the champagne fill | 6.84 |
| the hint grey the brief would have kept, `#777B72` on ivory | **3.86 — fails**, remapped to `#6B6F67` (4.58) |

True red marks nothing: the palette has no red, and the Scripture crimson `#B01E1E` is not a themed token (DR-1060's own test still holds).

## Decision

1. **A theme, `tlc` — "TLC · ivory & forest."** The same mechanism as Heritage and the Love Corner: the base literals are remapped, so every TLC screen inherits the finish and nothing it keys on changes. Ink → charcoal, cream → ivory, the dark fill and the rust → forest (12px radius), the olive → sage, the tray → a sage tint, white cards → 16px radius with one soft shadow, champagne on the heading rule and the dock's active tab, buttons 12px, inputs 10px, prose 1.55. The strong ink line becomes a sage-forest outline so an input, an outlined button and a strong card all keep their edge and none shouts.
2. **The TLC door opens in it by its own fallback (`TLC_DEFAULT_THEME`)**, exactly as the church door does (DR-1060). DR-1046 is not overturned: the family app keeps Heritage; the church keeps its red; every palette stays one tap away on the door; a device that chose keeps its choice. The theme rides third in the picker, beside the church's. **The door stops writing a fixed `#1A1815` over the phone's bars** — the theme paints them (DR-0744), so the status bar is ivory on the TLC palette and black on Midnight instead of ink over both.
3. **A design system as class strings, `lib/tlc-ui.js`** — card, strong card, band, primary pill, secondary pill, the compact office button, the small pill, the field, the eyebrow, the chip, the icon well, the round portrait. Only the four house literals the themes remap, so Midnight, Big Print and every other palette keep working, and nothing new reaches the guards unmeasured. The seven private `INPUT` / `BTN` copies are gone; the office screens import the one shape.
4. **The client door, drawn the reference's way:** a welcome band naming the three things a visitor can already do; the clinical team as rounded cards with a 64px round portrait, a role chip and "View profile"; the services as cards with a calendar well and a forest **Book** pill; insurance as one card with its shield; the bar's brand mark (a heart in the forest well), pill buttons, a rounded sign-in card, a footer that carries the tagline. Every fact still comes from `tlc-practice.js` and the roster; the texted-link entry page and the install manifest wear the palette.
5. **Preserved, deliberately:** every tab, gate, link, form, field, signature, validation, role and route. The audit's bright lines (`tlc-door.test.js`, `tlc-governance.test.js`, the operator-leak checks) are untouched and green.

## Verification

- `contrast-guard`: PASS, 11 themes parsed, `tlc` included; `legibility-guard --check`: PASS (no new violation); every `verify:gates` guard green except `business-systems-guard`, which is **red on `main`** (INDEX.md holds DR-1150 twice; #2330 is the fix) and not this change's.
- 18 TLC / theme / door suites: 220 cases green on the first run with one right failure — `the-reader-color-picker-reaches-every-door` pinned the literal `useThemePref('cream')` for every door; **retargeted per door, not relaxed**, the same move DR-1060 made for the shell.
- **The new suite, 17 cases:** the palette's ratios; champagne-as-text refused (**proven to catch:** feeding `#C7B27A` as the accent text to `checkContrastDetailed` returns a `rust accent text` violation; the real palette returns `[]`); the door's fallback and the shell's two fallbacks unchanged; the design system carries no literal outside the four house tokens (**proven to catch:** any new hex fails by name); no `Tlc*` file redeclares `INPUT` or `BTN`.
- **The live review (DR-0104, DR-0076 §6), on the built door in a real browser at 390px and 1280px**, found four things the code alone did not — all fixed before the record closed: (1) a theme rule on a token outranks a utility (0,2,0 over 0,1,0), so `border-radius:12px` on the fill tokens flattened every `rounded-full` pill to 12px — the radius rules now carry `:not([class*="rounded"])` and hand the shape back to any element that chose its own; (2) the same rule on `.bg-white` rounded the sticky header's corners — it is `rounded-none` now; (3) at 390px the brand mark plus three bar pills truncated the wordmark to "TLC Therapy…" — the mark hides below `sm`; (4) the phone's status bar wore **Heritage's** ivory, not TLC's, because the shell's own `useThemePref` paints the bars after the door's — the shell now asks for the TLC fallback by the door (`tlcDoorOnly ? TLC_DEFAULT_THEME`), one line, at +0 to the frozen shell. Measured after: `data-theme="tlc"`, field `rgb(244,242,237)`, the primary pill `rgb(46,74,60)` at `9999px`, `theme-color` `#F4F2ED`, zero page errors.
- Lint 0 warnings across `src`; production build green; the full suite: see the PR.

## What this does not do

- **No new features.** Appointments, messages, progress, billing, an account page — none exist here; the brief forbids inventing them unasked. They are the next decision if Christina wants them, each its own DR.
- **The TLC icon (`tlc-icon.svg`, the PNGs) still wears ink and rust.** An installed app's icon is a brand asset, not a theme; the SVG comment already says crisp PNGs await Christina's official logo. **`re-review: 2026-11-04`** — with the palette on the door, ask for the logo asset and re-cut the icons in one pass.
- **`PracticeLearn.jsx` and `OfficeAssistant.jsx` were not hand-redrawn.** They inherit the theme (every card, chip, button and field remaps) and the card sweep; a per-surface pass of their 2,500 lines is a second session with the live screens in front of it. **`re-review: 2026-11-04`**, on the live review pass (DR-0104).
- **The family app's TLC tab chrome** (the sub-nav row inside the PoeTech shell) is the family shell's and stays Heritage; the office panels inside it carry the shared shape.
