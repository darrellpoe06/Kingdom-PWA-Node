# DR-0396 — The signed-in strip becomes two status icons, and the raw number/email leaves the always-visible chrome

- **Date:** 2026-09-14
- **Status:** accepted
- **Tier:** B (front-door identity display; no data model change, no money, no new reach — a chrome relocation + a reveal-on-tap dialog)
- **Type:** system
- **Amends:** DR-0253 §2 (which chose to SHOW the phone number on the signed-in strip) — the number is preserved, moved off the chrome into a dialog
- **Scope:** `app/src/components/AuthBanner.jsx`, `app/src/poe-financial-mvp-v28.jsx` (mount relocation, net-zero to the frozen shell), `app/src/__tests__/auth-banner-icons.test.jsx`
- **Principles:** APP-IS-PRIMARY, VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), SPEAK-ESTABLISHED-FACT (DR-0100), PERPETUAL-IMPROVEMENT (DR-0075), DECISION-RECORDS

## Directive

Darrell, 2026-09-14, with a screenshot of the signed-in strip at the largest text size — his phone number **(563) 650-2416** and **darrellpoe06@gmail.com** printed in plain sight, the strip consuming most of the screen:

> "The Signed in as cellphone number and email address can be represented by the picture and maybe a green phone or a not green phone and same with email... washed out look or a email looking icon that's full color... so the users information isn't exposed... then all the real-estate that bar is taking up can be incorporated into the header somewhere?"

He approved the four decisions put to him (design, reveal-on-tap, placement, scope). On placement — *"One extra tap to get rid of all of it?"* — confirmed: the icons ride the header's top-right cluster, and the existing header-hideaway chevron (`poe-financial-mvp-v28.jsx:4407`) is that one tap; it already collapses the whole top block, icons included, leaving only the tab nav.

## The reality traced (DR-0061), before the change

- `AuthBanner.jsx` rendered `● Signed in as {label}` as a **full-width text strip** mounted above the title (`poe-financial-mvp-v28.jsx:3567`), printing the real phone number (`identityLabel`, DR-0253 §2) and, for a linked door, the primary email (DR-0311 §6).
- It carried `data-read-skip` but **not** `ts-chrome-region`, so unlike the header its `text-[0.625rem]` **scaled with the large-print text-size multiplier** — which is exactly why it ballooned to dominate the screen at A44/A+++. That is the "real-estate" complaint: a zoom artifact plus PII exposure, not the base strip.
- The header cluster (`4152`) and `HeaderAuthButton` (`4156`) **are** `ts-chrome-region` (zoom-capped) and already carry the person (avatar + name + Log out + the My-profile Modal, DR-0342). The strip was a second, redundant identity readout.

## Decision

1. **The strip becomes two compact status icons in the zoom-capped header cluster.** A phone glyph and an envelope glyph (`UiIcon` `phone`/`mail`), rendered next to `HeaderAuthButton` — so they no longer scale the page and the strip's whole row is reclaimed:
   - **phone icon** — green (`#5A6E3D`, the signed-in accent) when the session is a phone-login identity; washed-out (`#B0AAA2`) otherwise.
   - **envelope icon** — full ink (`#1A1815`) when an email is attached (an email account, or a phone door LINKED to its primary email, DR-0311); washed-out when a phone-only account has no email yet.
2. **The raw number/email leaves the always-visible chrome; one tap reveals it.** The icons are a button that opens the same quiet `Modal` `HeaderAuthButton` uses; the actual `{label}`, the DR-0311 *"one library, both doors"* reassurance (linked door), and the DR-0253 *"Add email"* promotion (phone-only) live inside that dialog. The screen-reader `aria-label` names the **state** (by phone / email attached / no email yet) but **not the digits**.
3. **Nothing is removed — it is relocated.** Every function of the old strip survives: the number/email (in the dialog), the "one library" reassurance (DR-0311 §6 — a linked door still never gets Add-email), and the Add-email flow (DR-0253). This **amends DR-0253 §2's display choice** (show the number on the strip) for a privacy reason; the security posture of DR-0253 is untouched.
4. **The frozen shell nets zero.** The mount moved from the strip location into the cluster — one line out, one line in (`monolith-budget-guard`: 5359, holding).

## The privacy claim, stated plainly (DR-0100)

What this fixes is **incidental visual exposure** — the screenshot Darrell sent, screen-sharing, shoulder-surfing — not a security boundary. It is the user's own authenticated screen; the account is fully theirs behind it. Under-claiming ("this secures the account") would be as dishonest as the exposure. The digits are one tap away for the owner, and off the glass for everyone glancing.

## Proven-to-catch (DR-0076 §3)

`app/src/__tests__/auth-banner-icons.test.jsx` (6): signed-out renders nothing; a phone user's raw number is **absent from the always-visible chrome** and the `aria-label` does not leak the digits; tapping opens the dialog where the number appears; a linked door shows *"one library, both doors"* in the dialog and **never** Add-email (DR-0311); a phone-only account offers Add-email in the dialog (DR-0253); an email account keeps its address off the chrome. **Verified to catch:** leaking `{label}` back onto the chrome fails tests 2 and 6 (the number/address reappear in the chrome's `textContent`) — run and confirmed, then reverted. The DR-0311 source-gate (`dr0311-account-unification.test.js`) still passes — the four branch patterns and the literal reassurance string are preserved.

## Consequences

- The strip's vertical row is gone; at large text sizes the account readout no longer scales, because it now lives in the `ts-chrome-region` cluster.
- The change is a component + a one-for-one mount swap; the frozen monolith did not grow.
- **Not verified live** (DR-0104): the sandbox cannot sign in to the real app; the icon states and the dialog are proven in jsdom against the real component. The live look is the next signed-in session — the reviewer pass on the deployed header.
