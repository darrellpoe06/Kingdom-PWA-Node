# DR-0136 — The church's real giving channels ride the Give floater, decoded from its own slide

- **Status:** accepted
- **Tier:** B — the app links OUT to the church's already-published destinations (same class as the existing Give link-out); the family's live reviewer pass (DR-0104) confirms each channel on production before the office publicizes the app as a giving path
- **Scope:** `lib/giving.js` (GIVING_CHANNELS — the four decoded destinations with provenance), `components/ChurchGiving.jsx` (the channel grid: one-tap buttons + scannable QRs; the website link becomes secondary), `__tests__/giving-channels.test.js`
- **Date:** 2026-07-10
- **Principles:** COMMUNITY-FIRST (accessibility default), VERIFICATION-DOCTRINE (DR-0076), DATA-AS-EMPOWERMENT (no payment data in the app), APP-IS-PRIMARY, ANXIETY-CLARITY

## Directive

Darrell, 2026-07-10, uploading the church's GIVE ONLINE slide: *"Make sure people can give to the church in our give links hovering bottom right — and also easy to use."*

## The verified trace

The slide is the church's own published giving artifact — "GIVE ONLINE · EASY · FAST · SECURE" with four QR channels. All four QR codes were decoded verbatim (zxing-cpp) from the uploaded slide:

- **Zelle** → the enroll link whose base64 payload names *"THE CHURCH OF THE LIVING GOD, THE"* with token **info@thechurchofthelivinggod.com** (the church's own domain identity — the same domain DR-0133 gives a door)
- **Cash App** → `https://cash.app/$TheLoveCorner`
- **Givelify** → the church's own Champaign IL donate page (the church-purpose platform the 2026-06-02 audit recommended — the church already had it)
- **PayPal** → the church's donate-token link

Until now the Give panel linked only to the church website root (`confirmed:false` — honest, but two hops from an actual gift). The never-invent-a-URL doctrine is satisfied at the source: nothing is guessed; every URL is the church's own publication, provenance carried in code.

## Decision

1. **The Give panel presents the church's four published channels, slide order kept** (Zelle, Cash App, Givelify, PayPal): big one-tap buttons (64px+ targets), each with the plain-words "how" line an elderly member can trust, its display identity (the email / cashtag / church name), and a scannable QR for a second device — the wall/desktop-to-phone path the slide itself uses. The website link stays as the secondary "more ways to give."
2. **No payment data ever touches the app.** The app opens the church's own secure channels and nothing else; the doctrine section (tithe, cheerful giver, the anti-prosperity-gospel bright line) rides unchanged.
3. **Provenance is code, not memory:** each channel carries its decode provenance; the test suite pins the Zelle payload to the church's domain token, the cashtag, and the Givelify page so a drifted/replaced URL fails the build.
4. **Pairs with the Call to Give** (DR-0134): the archive of the church's own giving appeals renders in the same panel — the Word's invitation, the church's channels, and the church's own voice, one surface.

## Opportunities and constraints

- **Opportunity:** the church office confirms each channel once on the live build (DR-0104 pass) and sets the site's dedicated giving page as `links.give`. `re-review: 2026-07-24`.
- **Constraint (carried):** the PayPal donate token is as-published; if the church rotates it, the pinned test fails and the update is a one-line, provenance-carried change.
- **Constraint (held):** Zelle's deep link opens its enroll flow; many members will simply use their bank app with the church's email — the "how" line says so in plain words.

## Supersedes / pairs

Pairs with DR-0133 (the door this becomes a face of), DR-0134 (the Call to Give in the same panel), COMMUNITY-FIRST (accessibility), DR-0104 (the live confirmation pass). Supersedes the website-root-only Give destination as the panel's primary path.
