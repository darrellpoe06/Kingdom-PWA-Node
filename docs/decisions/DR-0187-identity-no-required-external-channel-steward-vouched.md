---
id: DR-0187
title: Identity requires NO external channel — steward/guardian-vouched is the universal path; email/phone are optional; DMs-not-SMS
status: accepted
date: 2026-07-18
tier: C
declared_by: Darrell
supersedes: none
amends: none
principles: [DATA-AS-EMPOWERMENT-NOT-EXTRACTION, COMMUNITY-FIRST-MISSION, TENANCY-GUARD (DR-0060), VERIFICATION-DOCTRINE (DR-0076), GOVERNANCE-EXECUTION-ADVISORY]
---

## Context

Darrell, 2026-07-18, refining how people are added and how they get INTO the
system (Relationships → Guardian & Child / 1099 / tenant; the Family Roster).
A code trace (research pass, this session) found the real state: server-truth
identity is a Supabase Auth session; the binding of an *added* member to a
*login* is a **bare email-string match**, self-claimed on next sign-in
(`join_default_instance`, migration 0081:147-163), and the default email+password
path has **email-confirmation OFF by design** (`supabase.js:119-123`) while
phone+PIN is explicitly unverified (`supabase.js:168-173`). So today "the same
person" = "whoever authenticates with a matching email string" — a self-claim
gap: anyone who knows an invited email can register it and claim the role.

Darrell then set the model and surfaced the constraint that governs it:

> "I want people to use a cellphone and/or an email — one or the other, and
> together is best — however they should also need either for reset."
> "DMs not sms unless paying extra… but do we want that headache?"
> "sometimes required email is locked on android because of Images and the cloud
> costs and incentives etc so my uncle can't get in with it."

The uncle case is decisive: his Gmail is locked because Google filled his storage
with photos and gates recovery behind payment — **big-tech extraction locked him
out of his own identity.** Requiring email (or paid SMS) rebuilds the exact trap
this platform exists to escape (DATA-AS-EMPOWERMENT) and excludes the COLG
elderly/underserved community it serves first (COMMUNITY-FIRST-MISSION).

## Decision

**No external channel is ever REQUIRED to get in or to recover.** Identity is a
three-legged stool; no leg is mandatory:

1. **Steward/guardian-vouched code + device PIN — the UNIVERSAL path (primary).**
   A trusted family member or church steward provisions a member and can
   **re-issue** a one-time claim/reset code, delivered human-to-human (in person
   or read over the phone). The member enters it, sets a PIN, and is in — no email,
   no SMS, ever. This is the human web-of-trust (households/elders), the right and
   biblical trust model for family/church — not a bank's KYC. It is the path built
   FOR the uncle. Extends the existing guardian model (`provision_child_member`,
   guardian roles) to cover any member and to cover RESET.
2. **Email OTP — optional, for those whose email works.** Free, already present
   (Supabase magic-link / "Royalty Link"). It is the only leg that self-serves a
   reset without a human, so it is offered, never required.
3. **Phone + PIN — optional convenience.** Not verified without paid SMS, so its
   reset falls back to email or a steward re-provision — never phone-only.

**DMs-not-SMS.** No paid SMS at v1 (cost, US 10DLC, deliverability, upkeep — not
worth it for a family/community-trust app). Invites are an **app-generated
one-time TOKEN link the guardian/steward DELIVERS** by whatever channel they
already use (their text, WhatsApp, Messenger, email, in person) — the app sends
nothing paid; the human is the delivery. Claiming requires the token (closing the
bare-email self-claim gap), plus a **guardian re-confirmation** ("X claimed the
invite — approve?") as the two-party binding. In-app DMs are for confirmation of
already-signed-in users, NOT for cold reset (locked-out users can't read them —
the chicken-and-egg). SMS is added ONLY if Darrell later decides it is worth
paying for (a real-money carve-out).

Device fast-unlock uses the existing WebAuthn layer (`webauthn.js`) — on-device
PIN/biometric after a session exists, so the uncle rarely re-authenticates.

RLS/tenancy (DR-0060) is unchanged and remains the isolation gate — it sits
DOWNSTREAM of this binding and trusts `auth.uid()`; making the binding
trustworthy (token + re-confirm + steward-vouch) is what this DR secures.

## Consequence

Build order (Tier C — ships behind the gates + Darrell's live review, DR-0104):
(1) **token invite + verified claim + guardian re-confirm** (the self-claim-gap
fix and the primary path — no new cost, no new dependency); (2) **steward
provision-and-RESET** with an audit trail (who may reset whom); (3) email OTP as
the optional self-serve reset; (4) phone+PIN kept as-is; SMS deferred to a
future money-decision. Re-review: revisit the SMS/phone-verify leg only if a
concrete need (a phone-only member with no email and no steward) arises.
