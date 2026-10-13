# 2026-10-13 — The Poe Properties front page, from Darrell's mock-up

**Layer 4 (working).** Session log for the visual redesign of the Poe Properties
welcome page (`/properties/app/`). Branch `ccr-4273a9a1-isivkw`; the PR carries
the `hold` label — Darrell asked that nothing go live without his approval, so
the lane's auto-merge stays OFF until he removes the label.

## What Darrell asked

> "redesign the front welcome page of my existing Poe Properties property
> management application to look as close as possible to the attached image.
> This is a visual redesign only. Do not rebuild my application, delete
> anything, change the database, or interfere with any existing functionality."

And, with the second copy of the picture: *"This is the front page photo."*

## What changed, and why

| File | Change |
|---|---|
| `app/src/components/PoePropertiesWelcome.jsx` (new) | Presentation only: the scoped stylesheet (`.pp-*` custom properties, remapped once for midnight), the roof mark, the six portal icons, `WelcomeHero`, `PortalCards`, `SignedOutNotice`, `DoorFooter`, and `CARD_COPY` (Darrell's exact card wording, keyed by `WHO_OPTIONS` id with the model as fallback). |
| `app/src/components/PropertiesDoor.jsx` | The header lock-up ("Poe" red, "Properties" black, PROPERTY MANAGEMENT between gold rules), the "Who are you?" picker now rendered by the welcome components, the black footer band. **Nothing else**: the session logic, `WHO_OPTIONS`, `setWho`, the two sign-out links, the comfort controls, Install, Share · QR, read-aloud and the applicant / sign-in steps are untouched. |
| `app/public/properties/welcome-entry.jpg` (new) | The entryway photograph, cropped from Darrell's own mock-up (the clean region below the mock-up's notification card). Swap for a full-size photo at any time. |
| `app/public/properties/fonts/` (new) | Playfair Display 700 + 800, latin subset, self-hosted (SIL OFL, license beside the files). The site's CSP allows `font-src 'self'` only, so a Google Fonts link would be blocked at the browser. |
| `app/src/__tests__/poe-properties-front-page.test.jsx` (new) | Pins the wording and the wiring together: lock-up, heading + two lines, six cards in order with his words, the one "No account needed" pill, a card still opens the same portal, the notice only for someone who left (and "Come back in" clears it), the footer wording. |
| `app/src/__tests__/properties-door-render.test.jsx` | One assertion made case-insensitive (the cards are title-case now; the portals are unchanged). |
| `app/src/lib/legibility-health.json` | Regenerated snapshot (one more page in the scan). |

### Design decisions

- **Palette** — red `#C8102E` (brand, icons, arrows), black `#111` (headings,
  footer), white cards on light gray `#F4F4F6`, gold `#C9A24D` only for the
  rules, the window panes on the mark, and the footer hairlines. Midnight
  remaps every token (red lifts to `#F0506A` so "Poe" reads on black).
- **Cards** — one `<button>` each (the whole card is the tap target), auto-fit
  grid: three across on desktop, two on tablets, one on phones, and the same
  fall-back happens at large text sizes without a media query. Red/gray icon
  discs alternate as in the mock-up. Hover lift is disabled under
  `prefers-reduced-motion`.
- **Signed-out notice** — rendered only when the person LEFT this door
  (`left === true`), with the words from the mock-up. Never shown to someone
  who is signed in. "Come back in" calls the same `enterDoor` handler.
- **Footer** — `POE PROPERTIES · POWERED BY POETECH`, white on black, gold top
  border and hairlines. On phones the wording sits above the platform's
  floating controls (text-size escape hatch, read-aloud) so they never cover it.
- **Text-size and themes** — all reading text is in `rem`; the header lock-up
  stays inside the door's existing `.ts-chrome-region` cap (UX-PATTERNS 2b).
  The comfort controls (five themes, A..A44) stay where they were — in the
  header hideaway — rather than moving into the footer as the mock-up shows,
  because that is where the existing tests and the other doors keep them.
  **re-review: 2026-11-01** — decide whether the A- / A / A+ pair belongs in
  the footer on this door too.

### Deliberately NOT changed (Darrell: "do not redesign other pages")

The applicant step (vacancies + application form) and the sign-in step still
use the door's older green accent (`#2F5D50`). They are reached by tapping a
card and now sit under a red brand. **re-review: 2026-10-20** — restyle those
two steps to the same palette once Darrell approves the front page.

## Verification (DR-0076)

- `vitest`: door, witness, guard and the new front-page suites green.
- `eslint --max-warnings 0` on the changed files: clean.
- `vite build` with the CI stub env: green; `/properties/welcome-entry.jpg`
  and the two font files served from `dist/`.
- Screenshots from the built app (headless Chromium over CDP): desktop 1440,
  tablet 834, phone 390 @2x, the signed-out state on desktop and phone, and
  midnight. No horizontal scroll at any width (`scrollWidth === clientWidth`).
  Playfair Display confirmed as the computed heading face.

## Not deployed

The PR is labeled `hold`. Remove the label when the preview is approved and
the lane squash-merges it; merge = deploy.
