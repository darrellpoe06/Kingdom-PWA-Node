# DR-0177 — The Love Corner projector poster: one big QR for the conference hall

- **Status:** accepted (Tier A/B — a projector view of the already-approved, already-live church door; no doctrine surface, no schema, no money)
- **Scope:** `app/src/components/SharePoster.jsx` (parameterized to poster any door), `app/src/main.jsx` (`?share=church` route), `app/src/__tests__/share-poster-render.test.jsx` (proven-to-catch on the church poster)
- **Date:** 2026-07-12
- **Principles:** COMMUNITY-FIRST (a whole room installs at once, no typing), ANXIETY-CLARITY, NO-STATIC-DATA (DR-0121 — one source), APP-IS-PRIMARY, VERIFICATION-DOCTRINE (DR-0076)

## Directive

The before-Assembly follow-up to DR-0176 (the in-home share card): a steward needs to **project one big code on the sanctuary / conference-hall screen** so the whole room scans and installs the church app at once — the fastest congregation-scale onboarding.

## Decision

1. **`SharePoster` now posters ANY door.** The full-screen projector poster (already routed at `?share=1` for the platform, `qrcode.react`) gains optional `url` / `shown` / `brandLine` / `heading` / `ariaLabel` props defaulting to the platform values — so the existing `?share=1` mount is byte-for-byte unchanged — and accepts an override for a specific door.
2. **`?share=church` is the church poster.** It renders `SharePoster` with the church door: `SHARE_DOOR_URL` (`poetech.us/lovecorner` → installs "The Love Corner"), brand line "The Church of the Living God · The Love Corner", heading "Scan to get our church app". Lean-boots like the other public entries (no account, no data, no auth — it only displays the code). `SHARE_DOOR_URL` is the one source it shares with the door page, the manifest, and the in-home card (DR-0174/DR-0176).
3. **Proven-to-catch (DR-0076).** The render test mounts the poster with the church props and pins that it encodes the church URL (not `?join=1`), shows the church heading, and labels the code for the church app; the default `?share=1` path stays green, proving the override is additive. The legibility/contrast guard stays green (no color change — the dark poster's inline colors are untouched).

## Opportunities and constraints (routed)

- **Opportunity (church-held):** the church's own icon + brand color so the poster and the installed app carry COLG's art, not the platform placeholder (DR-0174 routed) — an asset only the church holds.
- **Constraint (held):** showing the code shares the way in; it never grants access (the poster's existing steward posture is unchanged).

## Supersedes / pairs

Completes the before-Assembly share set: DR-0174 (the door), DR-0176 (the in-home card), DR-0177 (the projector poster) — one door, three ways to hand it out, all off `SHARE_DOOR_URL`. Pairs with the platform `SharePoster` (the pattern reused), DR-0121 (one source, no duplication). No supersession.
