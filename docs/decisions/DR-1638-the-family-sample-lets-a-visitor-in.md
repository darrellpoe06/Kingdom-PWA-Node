# DR-1638: The family sample lets a visitor in, and reaches nothing

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** B (who can open the app on the public site changes). Held to what was already decided: the sample is fictional, never saves, and now cannot reach the family's data at all.
**Type:** decision
**Area:** `app/src/lib/preview-isolation.js` (`isPublicSample`, `resolveSupabaseConfig`), `app/src/lib/supabase.js`, `app/src/lib/access-gate.js`, `app/src/poe-financial-mvp-v28.jsx` (the gate and the header sign-in)
**Sent in by:** Darrell, 2026-11-24: *"See family sample does not mean potential users can get into see what PoeTech App has to offer.... why not?"*
**Pairs with:** the 2026-10-28 preview isolation (`preview-isolation.js`), DR-0060, DR-0076, DR-0239

## Context

The front door's "See the family sample" exists so a potential user can see what PoeTech offers before making a profile.

## What was measured

- The link is `/?demo=family-of-4` (`PublicFrontDoor.jsx:64`).
- On poetech.us, `accessState` returns `gate` for every signed-out visitor (`access-gate.js:17-21`), and the shell passed it `isPublicHost() && !isIsolatedPreview()`. Nothing read `?demo=`.
- So the link reloaded the front door it was clicked on. No visitor could get in.

## Decision

1. **A `?demo=` URL on a public host is the family sample, opened with no session.** The gate treats it like a preview (`isPublicSampleVisit()`).
2. **It reaches nothing.** `resolveSupabaseConfig` gives the sample the stub client that previews use. No read, write, sign-in or RPC can touch the family's data, whoever has signed in on that browser.
3. **A family member loses nothing.** Unlike a preview, the sample purges nothing. A stored sign-in stays under its own key, and `readPersistedSession` never reads it into the sample. Leaving the sample ("Start your own →") brings it back.
4. **Sign-in lives at the front door, not inside the sample**, because the sample's client cannot sign in. The header button is hidden there, as on a preview. The sample never saves (`isAnyDemoMode`), as before.

## Impact

Until this ships, every potential user who taps the sample loops back to the front door. The call obligates any new road into the app from the public site to carry the same isolation.

## Verification

- `preview-isolation.test.js` gains 3 cases: which URLs are the sample, that its client is the stub and not a purging preview, and that the shell opens the gate, purges only on a preview and never reads a stored sign-in into the sample.
- The pinned shell lines are updated in `preview-isolation.test.js` and `poetech-door-account-picture.test.jsx`. 149 cases pass across the gate, front door, supabase and demo suites.
- Real browser (Chromium, `poetech.us` mapped to the built app, the real database URL watched): the bare app shows the front door; `/?demo=family-of-4` opens the sample with 0 requests to the real database; with a family sign-in stored, the sample opens the same way and the stored sign-in is still there afterward.
- On the live site after deploy, open `poetech.us/?demo=family-of-4` signed out. `re-review: 2026-11-25`.
