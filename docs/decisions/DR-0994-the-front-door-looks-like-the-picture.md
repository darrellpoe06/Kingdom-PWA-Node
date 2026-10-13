---
id: DR-0994
title: The front door looks like the picture — the Poe Properties welcome page, from Darrell's mock-up, with nothing behind it changed
date: 2026-10-13
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0827]
tier: B
entities: [poetech]
grounds: [APP-IS-PRIMARY, VERIFICATION-DOCTRINE, REALITY-TRACE, PERPETUAL-IMPROVEMENT]
source: 2026-10-13 — Darrell, with the mock-up attached: "redesign the front welcome page of my existing Poe Properties property management application to look as close as possible to the attached image... This is a visual redesign only."
---

## Context

The Poe Properties door (`/properties/app/`, DR-0313) greeted a stranger with
a bare "Who are you?" box: six plain bordered buttons in the door's green,
a one-line banner for someone who had signed out, and a ten-pixel grey
footer. DR-0827 gave the door the platform staples (themes, text size, the
hideaway, Install, Share · QR, read-aloud); it did not give it a face.

Darrell drew the face and handed it over as a picture, with the brief
written out: the roof mark and the lock-up ("Poe" red, "Properties" black,
PROPERTY MANAGEMENT), "Welcome to Poe Properties" with two lines under it, a
residential photograph on the right, six white cards with red circular arrow
buttons in his exact wording, the signed-out notice as a white card, and a
black footer reading POE PROPERTIES · POWERED BY POETECH. And the fence,
stated three times in the brief: visual only; keep every portal, permission,
route and session as it is; do not deploy without his approval; show a
working preview on phone and desktop first.

## What was measured

- **The surface the user actually uses** (REALITY-TRACE §3): the picker is
  `SignedOutDoor` in `PropertiesDoor.jsx`; its six options are `WHO_OPTIONS`
  in `modules/properties/model.js` (one needs no account; the rest go to the
  same sign-in step). The notice renders only when `left` is true, i.e. the
  person left THIS door (`door-session.js`); a signed-in person never sees it.
- **What pins the words today:** `properties-door-render.test.jsx` asserted
  the five labels case-sensitively; `the-public-shelf-has-a-witness.test.js`
  pins the model label "Looking for a place" and the live witness clicks it
  by a case-insensitive regex. So the cards can read in title case without
  the model or the witness moving.
- **What the browser can load:** `app/public/_headers` sets
  `font-src 'self' data:` — a Google Fonts `<link>` would be blocked at the
  browser, so the headline face must be self-hosted. The photograph could
  not be fetched from any stock source through the session's proxy; the
  mock-up Darrell sent *is* the photograph ("This is the front page photo"),
  and its right half below the mock-up's notification card is clean.
- **What the guards refuse:** the legibility guard fails an inline dark text
  colour with no themeable class (it goes 1.04:1 on midnight); the
  ui-standards guard requires a focus class on every styled button and a
  36px floor. Both shaped the implementation below.

## Impact

A tenant, a family member, a 1099 worker, a manager, an owner or a stranger
looking for a place now meets the page in the picture, on a phone first:
the lock-up, the welcome, the photograph, six tappable cards (the whole card
is the button), and the footer wording. Someone who signed out of this door
sees the white notice with "Come back in"; nobody else does. Everything
behind the page is as it was.

## Decision

1. **Presentation lives in one new file,** `PoePropertiesWelcome.jsx`: the
   scoped stylesheet, the roof mark, the six line icons, `WelcomeHero`,
   `PortalCards`, `SignedOutNotice`, `DoorFooter`, and `CARD_COPY` — Darrell's
   wording keyed by `WHO_OPTIONS` id, with the model's own label and blurb as
   the fallback so a portal added later is never left off the page.
   `PropertiesDoor.jsx` keeps the session logic, `WHO_OPTIONS`, `setWho`, the
   two sign-out links, the comfort controls, Install, Share · QR, read-aloud,
   and the applicant and sign-in steps untouched; it renders the new header
   lock-up, the new picker and the new footer.
2. **The palette is custom properties on `.pp-door`,** remapped once for
   midnight (red lifts to `#F0506A` so "Poe" reads on black). Red `#C8102E`
   for brand, icons and arrows; black `#111` for headings and the footer;
   white cards on light grey; gold `#C9A24D` only on the rules, the mark's
   window and the footer hairlines. No inline hex, so every theme and the
   legibility guard are honoured.
3. **Playfair Display 700 and 800, latin subset, self-hosted** under
   `/properties/fonts/` (SIL OFL; licence beside the files), loaded by this
   page only. Body text is the system sans.
4. **The photograph is the entryway cropped from the mock-up,** served from
   `/properties/welcome-entry.jpg`; a full-size photo can replace the file
   with no other change.
5. **The cards are an auto-fit grid** (`minmax(21rem, 1fr)`): three across on
   desktop, two on tablets, one on phones — and the same fall-back happens at
   Big Print because the measure is in rem, with no media query. Hover lift
   is off under `prefers-reduced-motion`. Each card carries the platform
   focus ring and a 44px floor.
6. **The footer wording is a constant** (`FOOTER_WORDING`) and a test; on
   phones and tablets the band pads above the platform's floating controls
   so the words are never covered.
7. **Kept where it was, with a why:** the comfort controls (themes, A..A44)
   stay in the header hideaway rather than moving into the footer as the
   mock-up draws them — that is where every door and the DR-0827 tests keep
   them, and the hideaway collapses. `re-review: 2026-11-01` — decide whether
   the A- / A / A+ pair belongs in this door's footer as well.
8. **Not restyled, by the brief:** the applicant step and the sign-in step
   still wear the door's older green accent behind a red brand.
   `re-review: 2026-10-20` — bring both to this palette once the front page is
   approved.
9. **Not deployed.** The PR carries the `hold` label (DR-0103's brake); the
   lane merges it the moment Darrell removes the label.

## Verification

- `poe-properties-front-page.test.jsx` (9 green) pins words and wiring
  together (DR-0691): the lock-up, the heading and its two lines, six cards
  in `WHO_OPTIONS` order with the exact titles and blurbs, exactly one "No
  account needed" pill and on the applicant card, a card still opening the
  portal the model names, every card a `<button>` with a focus ring, the
  notice absent for someone who never left and present with the exact words
  for someone who did (and cleared by "Come back in"), and the footer saying
  POE PROPERTIES · POWERED BY POETECH and nothing else.
- Door, witness, guard and the DR-0827 staples suites green; one
  case-sensitive label assertion relaxed to case-insensitive with its why.
- `eslint --max-warnings 0`, `verify:gates`, the legibility guard (no new
  violations; health regenerated), and the ui-standards guard (0 regressions)
  green. `vite build` with the CI stub env green.
- **Observed on the built page** over CDP in the pre-installed Chromium:
  desktop 1440, tablet 834, phone 390 at 2x, the signed-out state on desktop
  and phone, and midnight — `scrollWidth === clientWidth` at every width, the
  six titles read back in order, the computed heading face is Playfair
  Display, and the notice flag is false until the door's left-key is set.
- **Not verified:** the page on a real phone in Darrell's hand (DR-0104's
  live-review pass is after the merge he has not yet approved), and the
  rendered font on iOS Safari specifically.

## Links

[DR-0827] (the staples this page keeps), [DR-0313] (the door's own scope),
[DR-0954] (signing in comes back through this door — unchanged),
[DR-0902] (the card's Apply — unchanged, one tap past this page),
[DR-0103] (the `hold` label is the brake), [DR-0691] (copy and behaviour
tested together), [DR-0076] (nothing claimed without the screenshot).
Session log: `docs/99-session-notes/2026-10-13-poe-properties-front-page.md`.
