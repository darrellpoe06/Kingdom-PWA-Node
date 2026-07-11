# DR-0172 — A phone + PIN can begin: not everyone has an email

- **Status:** accepted (held for Governor review + the live reviewer pass — front-door identity, Tier C)
- **Tier:** C (front-door / mission identity / new-user onboarding — RELEASE-TIERS). Shipped on `feat/phone-pin-onboarding`, PR labeled `hold`; NOT auto-merged.
- **Scope:** `app/src/lib/supabase.js` (the phone+PIN credential layer), `app/src/components/PasswordAuth.jsx` (the third door), `app/src/__tests__/phone-pin-credentials.test.js` (proven-to-catch)
- **Date:** 2026-07-11
- **Principles:** COMMUNITY-FIRST (the elderly, tech-novice COLG member is the first user), ANXIETY-CLARITY (fewer barriers to start), SPEAK-ESTABLISHED-FACT (DR-0100 — the security trade stated plainly), DATA-AS-EMPOWERMENT (no SMS vendor in the loop), VERIFICATION-DOCTRINE (DR-0076)

## Directive

Darrell, 2026-07-11: *"can we allow a pin to begin instead of an email and then get the email later everyone doesn't have an email so cellphone and pin and etc."*

## The reality (traced, not assumed)

The front door is Supabase Auth. The default door asks name + email and emails a Royalty Link; a password path and Google/Apple exist. **There was no phone path, and Supabase Auth requires *some* identifier — a PIN alone cannot create an account.** So "phone + PIN to begin" means the phone becomes the identity and the PIN the credential.

## The governed choice

Two ways to honor "phone + PIN, email later" were put to Darrell (the one call that touches money + front-door security):
- **Verified by SMS** — stronger, but needs an SMS provider (Twilio) in the dashboard = real per-text cost + one-time setup, and it won't work until configured.
- **Collected, no text** — instant, $0, nothing to set up. **Darrell chose this (2026-07-11).**

## Decision

1. **Phone + a 6-digit PIN creates the account instantly, no SMS, $0.** The mechanism REUSES the existing email+password path via a synthetic, never-delivered identifier `<digits>@phone.poetech.us` (`phoneLoginEmail`); the PIN is the password. The real phone + name + `login_method: 'phone-pin'` ride in `user_metadata` so the app can greet and recover the number. Pure validators (`normalizePhone`, `validatePhonePin`) gate every call before the network.
2. **Email is collected LATER and never blocks starting.** `saveContactEmail` writes a real contact email into `user_metadata` with no secure-email-change round-trip (the synthetic login email never receives mail, so a change-confirmation could never be clicked). Promoting that contact email to a real *login* identity is a separate, explicit step — routed as a follow-up, `re-review: 2026-07-25`.
3. **The door is a third choice, never a lockout.** `PasswordAuth.jsx` gains a phone+PIN door reachable from both the email-link and email-password doors ("No email? Use a phone number + PIN"), with links back. Same accessibility contract (44px targets, labelled inputs, aria-live errors, focus ring).
4. **The security trade is stated plainly (DR-0100), not hidden.** The phone is NOT proven-owned (no SMS), so this is a family/church-TRUST identity, not a bank's. The PIN is the guard; Supabase Auth rate-limits sign-in attempts server-side (a 6-digit PIN is 1e6 combinations behind that limit). The synthetic domain never receives mail, so it can never be a reset/takeover vector. Stronger later = SMS verify (costs) or a longer PIN.

## The one dashboard prerequisite (Darrell)

Supabase → Authentication → Providers → Email → **"Minimum password length" must be ≤ 6** (6 is the default) or a 6-digit PIN is rejected at signup. Nothing else: no SMS provider, no new secrets, no migration.

## Opportunities and constraints (routed)

- **Opportunity:** promote a later-added contact email to a real login identity (so they can *also* sign in by email). `re-review: 2026-07-25`.
- **Opportunity:** offer a longer PIN option for members who want it; surface the rate-limit assurance in the help copy. `re-review: 2026-07-25`.
- **Constraint (held, Governor-gated):** this is the live church front door — it merges only after Darrell's review + the DR-0104 reviewer pass on the deployed door, never on the auto-merge lane.
- **Constraint (verified):** the cloud sandbox cannot exercise the real Supabase signup end-to-end; the pure validators + synthetic-identifier mapping are unit-proven, and the network calls are exercised live (same posture as the email path), confirmed on the reviewer pass.

## Supersedes / pairs

Extends PasswordAuth's multi-door model (Royalty Link + password + Google/Apple) with a fourth entry that needs no email. Pairs with COMMUNITY-FIRST (commitment 2 — no required password-typing / meet people where they are), DR-0104 (the reviewer pass that clears it to production), DR-0100 (the trade stated, not buried). No supersession.
