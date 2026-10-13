---
id: DR-0995
title: The steps past the cards wear the same red — the vacancies and sign-in steps restyled to the front page, and the red made a true red
date: 2026-10-13
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0994]
tier: B
entities: [poetech]
grounds: [APP-IS-PRIMARY, VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT]
source: 2026-10-13 — Darrell, minutes after the front page went live: "Now restyle the sign-in and vacancies pages to match. Make the color a true red though. It looks pink now."
---

## Context

DR-0994 shipped the front page from Darrell's mock-up and recorded, with a
re-review date, that the two screens one tap past the cards still wore the
door's older green. He saw the live page and closed that gap himself, with one
correction to the palette: the red read as pink to him.

## What was measured

- The front page's red was `#C8102E`, a crimson, and the red icon discs were a
  pale pink tint (`#FBE7EA`) with the crimson icon on top — which is what a
  person sees first on three of the six cards. On midnight the red lifted to
  `#F0506A`, a coral. Each of the three reads as pink against white or black.
- The vacancies step and the sign-in step were plain bordered boxes in Fraunces
  with the green `#2F5D50` on their buttons, legends and focus rings; the
  shared vacancy card (`Storefront.jsx`) and the shared sign-in form
  (`PasswordAuth.jsx`) carry their own green and rust constants, and both are
  also rendered inside the PoeTech shell, so their files are not this door's to
  recolor.
- The ui-standards guard resolves a button's focus constant only within the
  file that uses it: an imported `FOCUS_RING` reads as "no focus ring" and
  fails the baseline.

## Decision

1. **A true red.** `--pp-red:#E00000` (hover `#B30000`), `#FF3B3B` on
   midnight. The red discs are solid red with a white icon; no pink tint
   remains on the page. The gold and black are unchanged.
2. **The two steps wear the front page.** A red "← Back", a white panel with
   the portal's own card title as the red kicker (vacancies) or as the serif
   title (sign-in), the body in the system sans, and the red pill button for
   "Sign in / create a profile", "Apply — no account needed" and "Send my
   application". "Before you apply" is a panel of folds; the application is a
   panel form with red legends and rounded fields.
3. **The shared pieces are recolored by token remap, in this door only.**
   `.pp-door .text-[#2F5D50]`, `.bg-`, `.border-`, `.text-[#B85838]` and the
   two vacancy-card actions are mapped to `var(--pp-red)` inside
   `WELCOME_CSS` — the same remap-by-token pattern `lib/theme-css.js` uses for
   midnight, scoped to `.pp-door` so the PoeTech shell's copy of the same
   components keeps its colors. `Storefront.jsx` and `PasswordAuth.jsx` are
   untouched.
4. **The sign-in form is told whose door it is.** `PasswordAuth` receives
   `brand={{ name: 'Poe Properties' }}`, so the screen after a sign-in says
   "Welcome to Poe Properties" instead of "Welcome to PoeTech". Nothing about
   the sign-in itself changes; the DR-0954 handler is byte-identical.
5. **Not changed:** what the shelf lists, Apply, the application's fields and
   validation, the sign-in doors, sessions. The signed-in app behind the door
   (the module) keeps its green; that is a different surface.

## Verification

- `poe-properties-front-page.test.jsx` grew three tests: the vacancies step
  (panel, kicker, title, Back, the apply button opening the form, the form's
  legends, a disabled Send on an empty form, Back returning to the cards), the
  sign-in step (card title, blurb, the pill, the form appearing in its panel
  only when asked), and the token pins (`#E00000` light, `#FF3B3B` midnight,
  solid red discs, the green-to-red remap present).
- Door, witness, spelling, legibility, contrast and ui-standards suites green;
  the ui-standards guard first caught the imported focus constant (recorded in
  "What was measured") and passed once the constant was local.
- `eslint --max-warnings 0` on the changed files; `vite build` green; the
  three steps observed on the built page at desktop and phone widths.

## Links

[DR-0994] (the front page; this closes its 2026-10-20 re-review early),
[DR-0954] (the sign-in handler, unchanged), [DR-0902] (Apply opens the
application, unchanged), [DR-0314] (the focus-ring guard that caught the
import).
