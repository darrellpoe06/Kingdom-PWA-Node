# DR-0827 — The Poe Properties door looks like PoeTech, the tenants' version: the platform staples on the door

- **Status:** accepted
- **Tier:** A (chrome from the shared libs the PoeTech shell and the TLC door already use; no new data, no new door, no change to what any role may read)
- **Type:** feature
- **Date:** 2026-10-09
- **Scope:** `app/src/components/PropertiesDoor.jsx` (the five themes, text size with its escape hatch, the hideaway top space, sticky auto-hiding header, Install, Share · QR, read-aloud, the post-update toast; `PROPERTIES_SHARE_URL`), tests `properties-door-looks-like-poetech.test.jsx` (5, the real door in jsdom), `properties-door-render.test.jsx` (its client mock answers the chrome's reads).
- **Principles:** THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), DR-0313 (one library, two doors), DR-0258/DR-0261 (disjoint install scopes; the door's own manifest), DR-0276 (big text holds the layout and is always reversible), DR-0075 (perpetual improvement), DR-0076.
- **Grounds:** Darrell, 2026-10-09, two screenshots of the Poe Properties door on his tablet and on a wide screen: *"Poe Properties App for tenants and workers etc... should look like PoeTech App just the tenants version... Lost features that are low hanging fruit for our tenants."*

## Context

The door at `/properties/app/` was built lean on purpose (DR-0313): sign in, then the module, no PoeTech monolith in the bundle. Lean became bare: a static header with the name, the tagline and two sign-out links, then the module. The PoeTech shell and the TLC door (DR-0276, the 2026-09-10 top-space work) had meanwhile grown the platform staples into shared libs, and the Properties door never picked them up. A tenant or a 1099 worker opened an app with no theme, no text size, no install control, no way to share it, no read-aloud.

## What was measured

- `PropertiesDoor.jsx` before: imports of the module, the door session and the applicant intake only; no `theme-css`, `text-size`, `use-auto-hide-header`, `header-hideaway`, `InstallAppButton`, `AppShareQR`, `TTSControl` or `PwaPrompts`. The TLC door imports every one of them (`TlcPublicDoor.jsx:23-34`).
- The door's page already links its own manifest and icons statically (`app/properties/app/index.html`), so Install needed no manifest work.
- The themes, text-size steps and the hideaway key are the same the PoeTech shell writes, so one choice follows a person between the apps on the same phone.
- Left out, with the why: Messages and push notifications ride instance membership (`push_subscriptions.instance_id`, `list_dm_contacts` over `instance_members`) and a tenant is a tenancy, not a member; the module's own per-door thread is the tenant's conversation. Lessons and the Word on this door are a tenant-facing identity choice (RELEASE-TIERS Tier B), not low-hanging chrome. Both `re-review: 2026-10-23`.

## Impact

- Unresolved: a tenant or a 1099 worker gets an app with no theme, no text size, no install control, no way to share it and no read-aloud, while the same person in the PoeTech app or the TLC door has all of them; the door reads as an afterthought, which is the opposite of DR-0313's intent.
- The call obligates: the chrome comes from the shared libs only (no second copy, no monolith import), the door's own manifest and scope stay (DR-0258), and what is left out is said with a why and a date.

## Decision

1. The door wears the platform chrome from the shared libs, as the TLC door does: themes, text size and the escape hatch, the hideaway top space, a sticky auto-hiding header, Install, Share · QR, read-aloud, the post-update toast.
2. The door's two sign-out links keep their semantics (leave this door; everywhere), in the compact bar.
3. Nothing from the PoeTech monolith is imported; the door stays its own bundle.

## Verification

- `properties-door-looks-like-poetech.test.jsx`: the five themes render from the shared palette and a pick sets `data-theme` on the root; the text-size steps are the shell's steps and a pick is pressed; the hideaway tucks the top space away and brings it back with the brand bar staying; Install and Share · QR render and the QR carries `poetech.us/properties/app`; the header is sticky with `ts-safe-sticky` and the wordmark is Poe Properties.
- `properties-door-render.test.jsx` (16) and the other door suites (103) still pass; lint clean; every gate green.
- Darrell's own test on the Fold: open the Poe Properties app, pick the midnight theme and Big text, tuck the top space away, tap Install.
