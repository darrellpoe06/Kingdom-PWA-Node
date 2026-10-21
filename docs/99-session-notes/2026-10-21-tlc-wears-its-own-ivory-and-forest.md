# 2026-10-21 — TLC Therapy Solutions wears its own ivory & forest (DR-1156)

**What changed and why**, in one page. The record is `docs/decisions/DR-1156-tlc-wears-its-own-ivory-and-forest.md`.

## The ask

A complete visual redesign of the TLC Therapy Solutions app to a reference image (ivory field, forest-green primary buttons, sage tints, charcoal text, rounded cards with soft shadows, round portraits, pill tabs), on every screen and every role, with nothing removed, replaced or disabled.

## The audit (every TLC surface, by role)

| role | screens | file |
| --- | --- | --- |
| visitor (signed out) | Find your therapist (team · services · insurance) · Mental skills · Join the team · Sign in / Create an account | `TlcPublicDoor.jsx`, `PracticeLearn.jsx` (guest), `TlcHiring.jsx` (JoinTheTeam), `PasswordAuth.jsx` |
| client (signed in, no office role) | the same three tabs with their lessons; profile from the bar | `TlcPublicDoor.jsx`, `PracticeLearn.jsx` |
| new colleague (invite link) | the onboarding packet; Training; Team (documents to sign) | `TlcOnboardingForm.jsx`, `TlcFieldInputs.jsx`, `TlcDocumentAcknowledge.jsx`, `TlcAgreementReader.jsx`, `TlcTeamResources.jsx` |
| staff (owner / admin / member / approved colleague) | Inquiries · Client Growth · Revenue · Training · Team (launch board, documents, governance) · Assistant | `Practice.jsx`, `ClientGrowth.jsx`, `PracticeLearn.jsx`, `TlcTeamResources.jsx`, `TlcLaunchBoard.jsx`, `TlcGovernance.jsx`, `TlcAssistant.jsx` → `modules/office-assistant/OfficeAssistant.jsx` |
| owner / admin | Onboarding (invites, packets, readouts, form editor), Team access | `TlcOnboarding.jsx`, `TlcOnboardingReadout.jsx`, `TlcRecordEditor.jsx`, `TlcFormEditor.jsx`, `TlcFormPreview.jsx`, `TlcTeamAccess.jsx` |
| family / business tier, inside PoeTech | the TLC tab: Practice · Inquiries · Revenue · Client Growth · Learn · Intake · Assistant · Onboarding | the shell's TLC view, the same components |
| the sendable link + install | the texted-link entry page, the manifest, the served page | `public/tlc/index.html`, `public/manifest-tlc.webmanifest`, `tlc/app/index.html` |

Not in this app (the reference shows them; the brief says "wherever those features already exist" and "do not introduce new features"): appointments, a progress tracker, in-app messages, billing / insurance screens, an account page. Booking is Acuity; there is no clinical record here by the TLC bright line.

## The design system

- **Theme `tlc`** in `lib/theme-css.js` — the house literals remapped (the Heritage / Love Corner mechanism): charcoal ink `#2A2B27`, ivory field `#F4F2ED`, white cards with 16px radius and one soft shadow, forest `#2E4A3C` for every primary fill and the selected state, forest accent text `#2F5D4A`, sage `#3F6B50`, sage tray `#E6EBE3`, champagne `#C7B27A` as a rule and a fill only (gold text `#7A6230`), 12px buttons, 10px inputs, prose 1.55. Every pairing measured with the contrast guard's own math (lowest 5.07:1).
- **`TLC_DEFAULT_THEME = 'tlc'`** — the door's own fallback; the family app keeps Heritage, the church its red; every palette one tap away.
- **`lib/tlc-ui.js`** — card, strong card, band, primary / secondary / compact / small pills, field, eyebrow, chip, icon well, round portrait. Four house literals only, so every other palette keeps working.
- **Typography** unchanged on purpose: Fraunces display + DM Sans body already ship self-hosted (DR-1046).

## What changed, file by file

- `TlcPublicDoor.jsx` — welcome band; team cards with 64px round portraits, role chip, "View profile"; service cards with a calendar well and a forest Book pill; insurance card with its shield; brand mark in the bar; pill buttons; rounded sign-in card; footer carries the tagline; theme fallback; the fixed `#1A1815` theme-color write removed (the theme paints the bars).
- `TlcHiring`, `TlcOnboarding`, `TlcOnboardingForm`, `TlcRecordEditor`, `TlcFormEditor`, `TlcTeamResources`, `TlcGovernance`, `TlcFieldInputs` — private `INPUT` / `BTN` strings replaced by the design system; copy buttons → small pills; chips rounded.
- Card sweep (`rounded-2xl` on every paper card): `TlcHiring` 4, `TlcOnboarding` 5, `TlcOnboardingForm` 1, `TlcFormEditor` 2, `TlcTeamResources` 4, `TlcGovernance` 4, `TlcFormPreview` 1, `TlcTeamAccess` 2, `Practice` 8, `PracticeLearn` 14.
- Round portraits: `Practice.jsx` provider cards, `TlcOnboarding` member cards, `TlcOnboardingReadout`.
- `manifest-tlc.webmanifest` (ivory background, forest theme color), `public/tlc/index.html` (ivory, a white rounded card, forest link), `tlc/app/index.html` (forest theme color).
- Tests: new `the-tlc-door-wears-its-own-green.test.js` (17 cases); `books-reports-theme.test.jsx` registries learn `tlc`; `the-reader-color-picker-reaches-every-door.test.js` retargeted per door.

## Verification

- lint: 0 warnings. contrast-guard: PASS (11 themes). legibility-guard: PASS. Every other gate green; `business-systems-guard` is red on `main` already (DR-1150 twice in INDEX; #2330 fixes it).
- 18 TLC / theme / door suites: 220 green (+ the one right failure, retargeted). New suite 17 green, two proven to catch.
- Live review on the built door (Chromium, 390px and 1280px, `?tlc=1`): four finds, all fixed — token-radius rules flattening the pills (now scoped with `:not([class*="rounded"])`), the sticky header rounding (now `rounded-none`), the phone bar truncating the wordmark (mark hides below `sm`), and the status bar wearing Heritage because the shell's hook paints last (the shell asks for `TLC_DEFAULT_THEME` by the door, +0 lines), plus the focus ring and the swatch ring still rust on the second pass (remapped). Also observed: the Mental skills tab, the Join the team tab and the sign-in card, all cohesive. After: `data-theme="tlc"`, primary pill `rgb(46,74,60)` at `9999px`, `theme-color` `#F4F2ED`, zero page errors.
- Production build green. Full suite: recorded in the PR.

## Not done, with a why and a date

- The TLC icon still wears ink and rust (a brand asset, not a theme; awaits Christina's logo). `re-review: 2026-11-04`.
- `PracticeLearn.jsx` and `OfficeAssistant.jsx` inherit the theme and the card sweep but were not hand-redrawn surface by surface. `re-review: 2026-11-04` on the live review pass (DR-0104).
- The reference's appointments / messages / progress / billing / account screens: not features of this app; each is its own decision if wanted.

## Addendum, later the same day — "Nothing changed. Why does it still look the same" (DR-1170)

The finish reached main and deployed (run 1838 green for 394ab43e) and Darrell's phone showed the old look. Cause: the door opened in TLC's colors only by a fallback, and the device's one shared preference key already held the family app's palette. Fix: a per-door theme scope (`setThemeScope`); the TLC door enters it at boot (`enterTlcDoorContext`), reads and writes its own key with its own default, and the family key is untouched. Five new cases, the shipped bug proven to catch. The church door carries the same gap by construction; dated 2026-10-28.

## Addendum, the shape — "It's better but it does not look like this at all" (DR-1171)

The palette was right and the layout was the old door's. The first section now carries a home (`TlcHome.jsx`: forest welcome card, greeting when signed in, the Learn space's KJV verse, quick-action tiles from the person's own sections, a schedule row), a phone bottom bar (`TlcDoorDock.jsx`, four sections + More, publishing `--chrome-dock-h` so the read-aloud and text-size floaters stand above it), and the swatches fold behind one Appearance toggle. Every test contract kept: the `find` label, the tablist, the hideaway, every anchor external. Observed at 390px: home, tucked header, More sheet, Mental skills — zero errors.
