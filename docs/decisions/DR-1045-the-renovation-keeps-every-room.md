# DR-1045: The renovation keeps every room — the Heritage redesign is a theme plus a shell, never a rebuild

**Date:** 2026-10-15
**Status:** proposed (awaiting Darrell's approval of the plan and the first design)
**Tier:** C (front door, brand tagline, default home) for Phases 2-3; B for the theme and section passes
**Type:** orchestration
**Area:**
- `docs/99-session-notes/2026-10-15-visual-redesign-plan-and-inventory.md` (the plan, the inventory contract, the risks and guards)
- `docs/99-session-notes/2026-10-15-visual-redesign-mockup.html` (home and Big Picture at desktop and phone width; the measured palette)
- Phase targets: `app/src/lib/theme-css.js`, `app/src/lib/nav-items.js` (new), `app/src/components/shell/*` (new), `app/src/components/LifeHub.jsx`, `app/src/components/ChromeDock.jsx`, `app/public/fonts/` (new)

**Extends:** DR-0994 (a visual-only front-door redesign ships as presentation in new files, a palette remapped for every theme, self-hosted OFL fonts, behind `hold` until approved) to the whole family app. Amends DR-0464 (the Life Hub becomes the signed-in home rather than an opt-in) once approved.
**Pairs with:** DR-0099 (red is the Blood; overdue wears terracotta), DR-0438 and DR-1011 (the words grow, the frame does not), DR-0716 and DR-0744 (one solid bottom bar; the reader's one row is untouched), DR-0524 (Cream stays in the picker; a chosen theme follows the device), DR-0713 and DR-0873 (every new color is remapped in every theme and policed by the guards), DR-0198 (chrome icons are `UiIcon`), DR-0726 (a restyled control keeps its locator), DR-0061 (no painted numbers; the search box is omitted until a real search exists).
**Grounds:** Darrell 2026-10-15, the brief and the reference image; VERIFICATION-DOCTRINE; APP-IS-PRIMARY; REALITY-TRACE; QUALITY-OF-LIFE; PERPETUAL-IMPROVEMENT; SURFACE-PREMISE.
**Declared by:** Darrell — *"I am changing the presentation, not the substance... Before changing any code, explain your redesign plan, identify anything that could be affected, and show me the first proposed design for approval."*

## Context

Darrell asked for the whole PoeTech app to wear the look of a reference image (forest green navigation, navy selection, ivory rooms, gold and terracotta trim, a sidebar on desktop and a five-tab bar on phones) while every section, record, lesson, calculation and control stays exactly where it is. The request carries its own gate: plan and first design before any code.

## What was measured

- The built app in Chromium at 1440×900 and 390×844: a cream page, rust accents, a sticky header carrying a 34-tab scrolling strip, no sidebar, the Big Picture dashboard as the home. The Life Hub (`components/LifeHub.jsx`, DR-0464) already renders the reference image's six tiles, Today's Focus, goals and eight Quick Actions from real records; it is opt-in.
- Color is ~18,000 literal Tailwind hex classes remapped per `[data-theme]` in `lib/theme-css.js`; the monolith sits at exactly its 5,302-line budget.
- The Google Fonts link at `poe-financial-mvp-v28.jsx:3557` is blocked by the CSP `font-src 'self' data:` (`app/public/_headers`), so Fraunces and DM Sans have never loaded in production.
- The proposed palette, measured with the repository's contrast math: every text pairing used is at or above 4.5:1; antique gold `#C9A227` as text on ivory is 2.07:1 and is therefore a fill and a rule only, with `#8A6510` as its text form (4.72 on ivory).
- Binding rules found on record: VISUAL-IDENTITY (gold leaf, ivory, charcoal and deep sapphire are already core; no stock photography), DR-0099, DR-0438, DR-1011, DR-0716, DR-0744, DR-0198, DR-0726, RELEASE-TIERS (tagline / default-home changes are Tier C).

## Impact

Done as a theme plus new shell files, the whole app changes finish on one merge and nothing it holds moves; done as a rewrite of the class names, the diff would touch 216 files, break the five existing themes' remap keys and the monolith budget, and could not be verified room by room. Reversible: the theme is a block that can be removed; the shell files are mounts the monolith can drop; the stored theme preference is honored throughout.

## Decision

1. **A seventh theme, `heritage`, carries the finish.** It remaps the base literals exactly as the other five do and becomes `THEMES[0]`, the first-run default, once approved. The five existing themes remain choices; Cream stays in the list (DR-0524).
2. **New chrome needs new tokens; each is remapped in every theme, Midnight included.** No inline hex. `contrast-guard` and `legibility-guard` keep policing them.
3. **The shell gains a sidebar at laptop width, a five-tab `ChromeDock` mode outside the reader, and a Settings panel that gathers the comfort controls**, all in new files under `components/shell/`, fed by the tab array moved to `lib/nav-items.js` with its ids, gates and order unchanged. Inside a lesson the dock is the one-row reader bar it is today.
4. **The Life Hub becomes the signed-in home**, restyled, with Recent Messages and Recent Activity added from real records; the Big Picture dashboard stays one tap away and is the first restyled internal page. This amends DR-0464's opt-in and is the Tier C piece that waits on Darrell.
5. **Fraunces and DM Sans are self-hosted** (SIL OFL) and the blocked link is removed.
6. **True red marks nothing** (DR-0099); overdue is terracotta. The search field in the reference image is omitted until a real search exists.
7. **Not decided here:** nothing in any `lib/*.js` calculation, schema, RLS, auth, subscription, payment, messaging or transport changes; if a visual step were to need one, it stops and is brought to Darrell.
8. **Nothing merges to the live app until Darrell approves this plan and the mockup.** Phase PRs that change the front door, the tagline or the default home carry `hold` (DR-0103).

## Rationale

Because the house already has a theme engine, a real-record home view and a measured bottom bar, the renovation is cheapest and safest as a seventh theme plus a shell, and every existing guard stays the brake. Because the brief says the reference image is an example of appearance and not an inventory, the inventory is written down as a contract and tested. Because this is a Tier C front-door change, the governor's word, not the lane, starts it.

## Verification

- Before: Chromium captures of home, Books, Real Estate and Projects at 1440 and 390 (attached to the session).
- After each phase: `npm run verify`; `chrome-layout-probe` at 360 / 768 / 1024 / 1440 and A44; the inventory test (every nav id and second-row id renders); the before/after capture set of all 34 views diffed by view; a real deploy run matching `main` and a `site-health` pass (DR-0107, DR-0125); the live user-review pass (DR-0104).
- `re-review: 2026-10-22` — Phases 1 and 2 merged if approved; otherwise the plan is brought back with the mockup.

## Links

DR-0994, DR-0464, DR-0099, DR-0438, DR-1011, DR-0716, DR-0744, DR-0524, DR-0713, DR-0873, DR-0198, DR-0726, DR-0061, DR-0103, DR-0104, DR-0107, DR-0125; `docs/00-foundations/_root/VISUAL-IDENTITY.md`; `docs/00-foundations/_root/RELEASE-TIERS.md`.
