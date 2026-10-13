# DR-1004: A listing travels — one link opens the unit with its pictures, and the post shows its picture and name

**Date:** 2026-10-13
**Status:** accepted
**Area:**
- `scripts/listing-share-pages.mjs` (the deploy-time preview pages: `renderListingPage`, `describeListing`, `decodeDataUrl`, `writeListingPages`), `.github/workflows/deploy-cloudflare-pages.yml` (the step after the build)
- `app/src/modules/properties/apply-link.js` (`shareListingUrl`, `listingAppUrl`, `readListingTarget`, `listingShareText`, `LISTING_PARAM`)
- `app/src/modules/properties/Storefront.jsx` (`openPictures`, the Share control, `vacancy-card-<id>`), `app/src/components/PropertiesDoor.jsx` (the listing deep link, `listing-gone`)
- `scripts/e2e/door-journeys.mjs` (G3, `--break=share`), `ci.yml`

**Amends:** DR-0313 (the properties door's static share page: the same road, now one page per listed unit), DR-0902 (the query survives the hop: the id is baked into each page's refresh), DR-0958 (the path is the door: a gone page's path still boots the door and names the unit)
**Declared by:** Darrell (the task as spoken: "Share a listing to social media: link opens the app with that unit's pictures open, with a rich preview (photo, title) on the social post")

## Context

A listing on the public shelf could be applied for and booked, but it could not be handed to anyone. The one address the app gave out for a unit was the apply link (`/properties/?apply=<id>`), which opens the application form — the wrong door for someone a renter is merely telling about the place — and whatever address was pasted into a text or a post previewed as "Poe Properties" with the icon, never as the unit. A social post is read before it is tapped: without the picture and the name in the preview, the listing does not travel.

## What was measured

- The card (`Storefront.jsx`) had Apply and Book a stay and no Share; the only link it built was `applyUrl()`.
- `/properties/index.html` carries fixed Open Graph tags (name "Poe Properties", the icon) and `redirect.js` forwards the query into the door (DR-0902); a crawler fetching any `/properties/...` address saw those tags and nothing of the unit.
- Pages Functions were dark (#2057, day 4 on 2026-10-13, "the failure is on Cloudflare's side of the line"), so a Function rendering per-unit tags could not be relied on. `/moore` and `/lovecorner` already solve the same problem statically: a page with its own tags that meta-refreshes into the door.
- The deploy builds with `VITE_SUPABASE_URL` and the anon key in its environment and the runner on the tailnet, so the public shelf is readable at build time as anon — the same two RPCs the shelf itself reads (`public_vacancies()`, `public_vacancy_photos()`), nothing a visitor could not already see.
- A listing picture is held as a data URL in `property_photos.storage_path`; a social crawler needs an absolute image URL, so the bytes have to be written beside the page.
- `main.jsx` boots the properties door for any `/properties...` path (DR-0958), and the Cloudflare SPA fallback serves the shell for a path with no asset, so a stale per-unit path still reaches the door.

## Impact

- **A renter, a friend, a family member** posts or texts one link; the post shows the unit's own picture and its name, with where it is, the price and the true month beside any other cadence (DR-1003); tapping it opens the door on that unit with its pictures open — no account, no form.
- **The family** gets a Share control on every card, into whatever the phone already uses (the same `ShareButton` as the lessons, DR-0290), with the link copied where there is no share sheet and said so.
- **A unit that is gone** does not become a dead end: the page disappears at the next deploy, the path still boots the door, and the door says "That unit is not available right now. Here is everything that is."
- **Nothing held is let go:** the page prints only what the public shelf gives (no held street, no unit when held, no exact point), and the journeys assert the held street is not on it.

## Decision

1. **One static preview page per listed unit, written at deploy time.** After the build, `scripts/listing-share-pages.mjs` reads the public shelf as anon and writes `<dist>/properties/l/<id>/index.html` with the unit's name, a description (where, the rent, the cadence line, a shared home said plainly, what the building offers), `og:image` pointing at `photo.<ext>` decoded from the unit's first listing picture and written beside it, and a meta refresh into `/properties/app/?properties=1&listing=<id>`. No inline script (CSP `script-src 'self'`). The set is cleared and rewritten each deploy, so a unit no longer listed loses its page.
2. **Honest by count, and never a reason not to deploy.** A unit with no public picture gets the Poe Properties icon and a summary card. A picture read that fails is counted as a failure in the log and the page stands with the icon; a shelf that cannot be read writes nothing and says so. The step never fails the deploy (DR-0107: a stale preview is a smaller harm than a site that did not deploy); its last line counts the pages written out of the units listed.
3. **The app honours `?listing=<id>` and the page's own path.** `readListingTarget` reads the query, or `/properties/l/<id>` when the shell booted on a gone page's path. The door opens on the applicant step, scrolls that card into view and opens its pictures (`openPictures`); the application form is not opened. A unit not on the shelf is answered by `resolveScan` as the apply link is, with everything that is listed below.
4. **Share on every card.** `Share this listing` hands the share sheet the unit's name, the words (name, where, the rent, the link) and the preview page's address, `https://poetech.us/properties/l/<id>/`.
5. **Not in this decision:** a live per-unit preview rendered on request (a Pages Function), which would make a new picture show in the preview before the next deploy — `re-review: 2026-10-20`, when #2057's state is read again. Posting to a network from inside the app (the share sheet is the device's; the app holds no social credentials).

## Verification

- **Unit (`the-listing-travels`, 10):** the posted address and the app's; the id read from the query or the path, junk refused; the words that travel; the page carries the name, the description with the true month, the picture and the refresh, with no script; a unit without a picture gets the icon and a summary card; what the family typed is escaped; a bed says the bedroom is shared; a data URL decodes to bytes and anything else is refused; the writer writes one page per unit with its picture beside it and counts; **proven to catch:** a picture read that fails is a failure in the count and the page stands with the icon; a shelf that cannot be read writes nothing and says so.
- **Door (`a-shared-listing-opens-its-pictures`, 4):** `?listing=<id>` lands on the applicant step, scrolls the card into view and opens its pictures while the form stays closed (proven to catch); the page's own path does the same; a gone unit is said so from the path with everything listed; every card offers Share this listing.
- **Door journeys (Chrome, PostgREST, the real chain), G3 — measured 13 of 13:** the generator run against the journeys' own stack writes the listed door's page with the shelf's public name ("multi-family in Champaign, Illinois" — the held street and "Apt 2" are NOT on it, DR-0977), the true month and its own picture beside it; opening `/properties/l/<id>/` lands on the door with the pictures open and no held street on it; a gone unit's path says so. **`--break=share`** (the public pictures refused to anon) fails G3 — CAUGHT, measured locally ("the preview does not carry the unit's own picture") — in CI's proven-to-catch loop; `--check-faults`: every fault's undo converges (9 faults). Unit + door: 15 of 15; the 55 test files touching these surfaces: 1090 of 1090.
- **Deploy:** the step runs after the build on every deploy; its count line is read on the first deploy after this merges. `re-review: 2026-10-20` for the live preview on a real post (a crawler's fetch of a real unit's page).
