# DR-1236: The shelf shows its pictures to a stranger — three doors read one row, the branded door advertises under its portals, and a failed read says what failed

**Date:** 2026-10-27
**Status:** accepted
**Tier:** A (additive on the signed-out surfaces: one shared row-to-card mapping, a picture strip on the existing card, the advertised cards under the branded door's portals, a plain failure line; no schema, no grant, no route, no money)
**Type:** surface + witness
**Area:**
- `app/src/modules/properties/vacancy-unit.js` (NEW — `vacancyUnit` / `vacancyUnits`, the one reading of a `public_vacancies()` row; `readFailureLine`)
- `app/src/components/PublicFrontDoor.jsx` (the PoeTech front door: the shared mapping, a `<ul>` shelf, the failure line and Try again)
- `app/src/components/PropertiesDoor.jsx` (the branded Poe Properties door: the shelf read when the door opens, `AdvertisedNow` under the portals, three states on the applicant step, the shared mapping)
- `app/src/modules/properties/PropertiesApp.jsx` (the first tab: the shared mapping replaces its own copy)
- `app/src/modules/properties/Storefront.jsx` (`VacancyCard`: the swipeable, lazy picture strip)
- `.github/workflows/public-shelf-anon-probe.yml` + `scripts/public-shelf-anon-probe.mjs` (NEW — the stranger's read, measured from a runner; statuses, counts and ms only)
- `app/src/__tests__/the-shelf-shows-its-pictures-to-a-stranger.test.jsx` (11 cases, proven to catch)

**Amends:** nothing. **Grounds:** DR-0958 (the front door shows the homes, not a PIN pad), DR-0946 (a read that failed is not a door that is empty), DR-1016 (a listing loads one picture at a time; the list never carries the bytes), DR-0984 (each door shows the apartment in its own order), DR-0933 (the public shelf shows where, never the street), DR-1176 (the hero may be the porch), DR-1054 (the witness asks the way the app asks), DR-1159 (the runner reaches the NAS), DR-0076 (measured, not claimed; proven to catch), DR-0061 (reality-trace before building).
**Principles:** APP-IS-PRIMARY, REALITY-TRACE, VERIFICATION-DOCTRINE, RUNNER-REACHES-THE-NAS.
**Declared by:** Darrell, 2026-10-27, signed out on poetech.us: *"the images don't populate when we are advertising the apartment... it does when you go into the first tab however... if you don't have an account you should be able to just see the images"* — and on the branded Poe Properties door: *"Images below for the advertised apartments?"*

## Context

Two things were on his screen. The PoeTech front door, signed out, read "The list of homes could not be loaded just now. This is us, not you." — the failed state DR-0946 insisted on, which says only that the read failed, never what failed. And whenever the shelf did load, its cards said "Photographs coming" over doors whose pictures the first tab shows to a signed-in person. The branded Poe Properties door (the entryway photograph, "Who are you?", the six portals) showed no apartment at all until "Looking for a Place" was tapped, and then showed the same picture-less cards.

The public picture road already existed and was already open to a stranger: `public_vacancy_photo_list` and `public_vacancy_picture` (0290, DR-1016) over `public_vacancy_photos` (0282, DR-0984), all `SECURITY DEFINER`, all granted to `anon`, returning only `kind='listing'` pictures of a listed, untenanted door in the door's own order, and never a street (0268). Nothing on the database side was missing. The reality trace (DR-0061) had to say why the browser was not using it.

## What was measured

**The road, from outside** (`public-shelf-anon-probe.yml`, run 40440696519 on branch `probe/shelf-anon-read`, 2026-10-27 02:49Z; statuses, counts and ms only):

| reading | result |
|---|---|
| `OPTIONS rest/v1/rpc/public_vacancies` from Origin poetech.us (the browser's preflight) | **200**, `access-control-allow-origin: *` |
| `POST rest/v1/rpc/public_vacancies` as anon, cross-origin, every header supabase-js sends | **200** in **160 ms**, **2** rows, JSON, no error |
| `POST rpc/public_vacancy_photo_list` (first door) | **200**, **16** pictures |
| `POST rpc/public_vacancy_picture` (first picture, thumb) | **200**, a `data:image/` URL, **54,813** bytes |
| the database's own clock, `SET LOCAL ROLE anon`, READ ONLY (DR-1159, over the tailnet) | 2 doors in **13 ms**; 16 pictures in **23 ms**; `anon` carries **no** `statement_timeout`; all three functions `has_function_privilege('anon', …, 'EXECUTE') = t` |
| Chromium, signed out, `https://poetech.us/` | state **ok**, cards **2**, pictures **0**; `rpc/public_vacancies -> 200`; **no request** to `public_vacancy_photo_list` at all |

**The cause of the missing pictures, in the code.** `PublicFrontDoor.jsx` rendered `<VacancyCard unit={v} />` with the RAW RPC row. The card asks for a unit's pictures by `unit.rentalId` (`Storefront.jsx`: `if (!unit.rentalId) return` before `loadVacancyPhotos`), and the row carries `id`, not `rentalId`. So the card never asked, and said "Photographs coming" over sixteen pictures the road answered in 23 ms. The first tab (`PropertiesApp.jsx`) and the branded door (`PropertiesDoor.jsx`) each carried their OWN copy of the row-to-card mapping, each naming `rentalId` — the front door was the third copy that did not exist. Three mappings of one row is how the third door drifted.

**The failed state Darrell saw did not reproduce** at measurement time: all three RPCs answered 200 to the exact request shape a signed-out browser sends. What could be established is that the screen, the probe fleet and the ledger had NO WAY to say what had failed when it did: the front door collapsed every failure into one sentence, and the branded door stored a failed read as `[]` and printed "Nothing is listed right now" — the one sentence DR-0946 forbids a failed read to become.

**On the branded door, the probe also found** that `page.goto(..., networkidle)` never settles (a resource answers 502 and something keeps the network busy), which is why the daily `public-shelf-witness` has read "could not be read at all" since 2026-10-22; the probe now waits for `load` and then for the shelf's own states. The witness's own fix is its own re-review (`re-review: 2026-11-03`).

## Impact

- **One reading of the row, three doors.** `vacancyUnit(row)` is the only mapping; the front door, the first tab and the branded door all render `VacancyCard` from it. A field the row does not carry stays `null` — never 0, never an invented answer.
- **The stranger sees the pictures** on the PoeTech front door and on the branded door, from the same public road the signed-in tab uses for a listing: `public_vacancy_photo_list` once per card, `public_vacancy_picture` one picture at a time (DR-1016), the thumbnail first.
- **A swipeable row** of up to eight thumbnails under the card's main picture: scroll-snapped, each a 44 px tap with `aria-label` and alt text, lazy, asked for only once the row is on screen (IntersectionObserver; at once where the browser cannot say), and "+N" opening the whole set in the Lightbox the card already had.
- **The branded door advertises under its portals**: "Available now — N places to live — no account needed to look", the same cards, Apply opening the applicant step with that door chosen. The hero stays Darrell's own entryway photograph / the porch stream (DR-1176): the real pictures of each door are the cards' own, right below, and a stock-looking hero replaced by one door's picture would advertise one door over the rest.
- **A failed read says what failed**, in one plain line under the visitor's words, on both doors: `Read failed: public_vacancies · <reason> · <code or first words>` (`data-testid="front-door-unreadable-why"`), with anything JWT-shaped removed, plus a 44 px **Try again**. The probe reads that line, so the next time the state Darrell saw appears, its cause is on the screen and in the run.
- **DR-1016's budget holds.** Without an IntersectionObserver (a test, an old WebView) the strip asks for nothing extra: the card still asks for the first picture and the next only (`a-listing-loads-one-picture-at-a-time` stays green as pinned); a blank tile tapped selects that picture and the main frame asks for it. With an observer, the strip's up-to-eight thumbnails are asked only once the row is on screen — a card below the fold costs nothing until it is reached.
- **The un-migrated-database rule moved with the mapping.** `address_shown === undefined ? true` (an older RPC reads as SHOWN, never as protected) now lives once in `vacancy-unit.js`; `properties-address-visibility.test.js` pins it there and pins that the tab reads `vacancyUnits(`, rather than keeping a dead literal in `PropertiesApp.jsx` for a pin's sake.
- **The privacy line is unchanged and restated:** a stranger gets ONLY the pictures `public_vacancy_photos` already offers — `kind='listing'`, un-archived, of a door that is listed and has no active tenancy, in the door's own order (DR-0984), borrowed from a sibling only for a room or bed in the same apartment; never a condition picture, never a tenancy's wall, never a private door, never the street (0268). No grant, policy or function changed. The probe and the DR print statuses, counts, ms and codes — never a street, a name, a caption or a key.

## Decision

1. `vacancyUnit` / `vacancyUnits` in `modules/properties/vacancy-unit.js` is the one reading of a `public_vacancies()` row; no door keeps its own.
2. Both signed-out doors render the same `VacancyCard`, with pictures, from that reading; the branded door shows the advertised apartments under its portals without a tap.
3. A read that failed, on any door, renders the failed state with its reason line and Try again; it is never rendered as an empty shelf.
4. The stranger's read is measurable on demand from a runner (`public-shelf-anon-probe.yml`), the way a signed-out browser asks, printing statuses, counts and ms only.

## Verification

- `the-shelf-shows-its-pictures-to-a-stranger.test.jsx`: **11 cases** — the mapping (rentalId, nulls, the older column names, the failure line strips a JWT); the PoeTech front door asks `loadVacancyPhotos(DOOR)` and renders a `data:image/` picture with alt and `loading="lazy"`; the strip's taps are 44 px, labelled, lazy, and a tap shows that picture large; a held door prints no street; a failed read prints the reason line and Try again re-asks; the branded door's shelf follows the portals in DOM order with pictures; a failed read on the branded door is never "Nothing is listed" on the chooser or the applicant step; an empty shelf shows nothing on the chooser and says so on the applicant step. **Proven to catch:** with the four source files at `origin/main`, 6 of 11 fail (the asks never happen; the failure line is absent; the shelf is not under the portals).
- The nine suites that already pinned these surfaces (heritage front door, the front door shows the homes, Poe Properties front page, door render, a shared listing opens its pictures, the rest of the apartment, properties work on any door, the Properties tab front door, the area on a map): **119 passed**.
- Guards green: lint (`--max-warnings 0`), monolith budget, consistency, contrast, legibility, surface-hollow, measurement-carries-no-identity, unknown-is-not-a-no, module-boundary, no-prompt, decision-citation.
- Live after merge: the deploy on the merge SHA, `site-health.yml`, and `public-shelf-anon-probe.yml` on main — expected: both doors `state=ok`, `cards=N`, `pictures>=1`, `strip>=1`, and `rpc/public_vacancy_photo_list -> 200` in the browser's own request log (run ids in the PR).
