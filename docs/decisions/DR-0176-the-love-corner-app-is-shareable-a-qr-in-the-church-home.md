# DR-0176 — The Love Corner app is shareable: a scannable QR in the church home

- **Status:** accepted (Tier A/B — an enhancement to the already-approved, already-live church door; no doctrine surface, no schema, no money)
- **Scope:** `app/src/components/AppShareQR.jsx` (parameterized to encode any door's URL), `app/src/components/ChurchHome.jsx` (the "Get our app · Share it" card), `app/src/__tests__/app-share-qr-render.test.jsx` (proven-to-catch on the override)
- **Date:** 2026-07-12
- **Principles:** COMMUNITY-FIRST (hand the congregation a scannable code, no typing), ANXIETY-CLARITY, NO-STATIC-DATA (DR-0121 — one source), APP-IS-PRIMARY, VERIFICATION-DOCTRINE (DR-0076)

## Directive

Follows DR-0174 (the church's own door, approved + live 2026-07-11) and Darrell's push to have the app usable and shareable **ahead of the National Assembly.** The concrete before-conference need: something a steward can project, print for the bulletin, or show on a phone so people install the church app without typing a URL.

## Decision

1. **`AppShareQR` now serves ANY door, not just the platform.** The proven share-QR card (already used on the admin surfaces, `qrcode.react`) gains optional `url` / `shown` / `title` / `blurb` / `ariaLabel` props that default to the platform join URL — so every existing caller is unchanged — and accept an override so a specific door can hand out its OWN code. DRY over a near-duplicate component (DR-0121: combine what makes sense).
2. **The church home carries "Get our app · Share it."** A card in `ChurchHome` renders the QR for `SHARE_DOOR_URL` (`poetech.us/lovecorner` → installs "The Love Corner"), the same one source the door page + manifest encode (DR-0174). Project it in the sanctuary, print it for the bulletin, or show a phone — the congregation scans and installs.
3. **Proven-to-catch (DR-0076).** The render test mounts the card with the church override and pins that the QR encodes the church URL (not the platform `?join=1`), the shown link and aria-label speak the church's voice, and the copy button writes the church URL. The default-props path stays green, proving the override is additive.

## Opportunities and constraints (routed)

- **Opportunity:** a dedicated full-screen / printable poster for the church door (the `SharePoster` sibling, projector-ready), if the in-home card isn't enough for the conference hall. `re-review: 2026-07-19`.
- **Opportunity (church-held):** the church's own icon + brand color so the installed app and this card carry COLG's art, not the platform placeholder (DR-0174 routed) — an asset only the church holds.
- **Constraint (held):** showing the code shares the way in; it never grants access (the card's existing steward posture is unchanged).

## Supersedes / pairs

Builds on DR-0174 (the door this shares). Pairs with the platform `AppShareQR` / `SharePoster` (the pattern reused), DR-0153 (install-door-is-first-class), DR-0121 (one source, no duplication). No supersession.
