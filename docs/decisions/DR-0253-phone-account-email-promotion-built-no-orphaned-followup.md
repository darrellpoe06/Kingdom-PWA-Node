---
id: DR-0253
title: A phone account can add a verified login email — built now, no orphaned "follow-up later"
status: accepted
date: 2026-07-13
tier: C
declared_by: Darrell
supersedes: none
amends: DR-0172 (closes its routed follow-up + the re-review:2026-07-25 opportunity — built, not deferred)
principles: [DO-THE-WORK-DONT-RE-ASK (DR-0111), VERIFICATION-DOCTRINE (DR-0076), COMMUNITY-FIRST, PERPETUAL-IMPROVEMENT (DR-0075)]
---

## Context

Darrell, 2026-07-13 (high intensity):

> "We should have NO FOLLOWUP LATER… WHO WILL FOLLOWUP AND WHAT TIMELINE ARI?!
> COMMON SENSE OBVIOUS… CLAUDE UNDERMINES HIS USERS… OVER AND OVER."

DR-0172 shipped phone+PIN sign-in and **deferred** the "promote a later-added
contact email to a real login identity" step with `re-review: 2026-07-25` — a
date with **no named owner**. A re-review date nobody owns is not a plan; it
reads like accountability and delivers none. That is the defect. The correction:
**build it now.** Who + when = the agent, this session — not a shelved date.

## The reality that made "merge" sound hard (traced)

The concern was "merging accounts is an issue." It isn't a merge at all. A phone
user adding their email has only ever had **one** account. `updateUser({ email })`
attaches the email to the **same `auth.users.id`** — the id never changes, so the
deterministic phone-number → unique-ID mapping (`normalizePhone` →
`<digits>@phone.poetech.us` → one row) is preserved exactly. There is no second
account to reconcile.

## Decision

1. **Build the promotion.** `promoteEmailToLogin(email)` calls
   `supabase.auth.updateUser({ email })`; Supabase emails a confirmation link to
   the new address, and clicking it makes that email the account's **verified**
   login identifier. This is a security **upgrade** (collected-not-verified phone
   identity → proven-owned email), with no SMS and no second account. The phone
   stays in `user_metadata` for greeting + recovery; after confirmation the person
   signs in with email + PIN.
2. **Show the number, never the placeholder.** `identityLabel` / `formatPhoneDisplay`
   render a phone user's real number as `(xxx) xxx-xxxx` — the raw
   `<digits>@phone.poetech.us` no longer shows in the signed-in strip or the
   Access & Usage list.
3. **Surface it where identity lives.** `AuthBanner` gains an "Add email" action
   for phone users → an inline, accessible form (labelled input, aria-live status,
   focus ring) → confirmation-sent feedback.
4. **No orphaned follow-up.** DR-0172's routed opportunity + its `re-review:
   2026-07-25` are **closed by build**, not carried. Deferrals, going forward,
   carry a named owner or they are done now.

## Implementation

- `app/src/lib/supabase.js` — `promoteEmailToLogin`, `isSyntheticPhoneEmail`,
  `isPhoneLoginSession`, `formatPhoneDisplay`, `identityLabel`.
- `app/src/components/AuthBanner.jsx` — friendly label + the "Add email" flow.
- `app/src/__tests__/phone-email-promotion.test.js` — proven-to-catch: the
  synthetic placeholder is rejected, the label never leaks the raw synthetic
  address, phone detection works by `login_method` and by synthetic email.

Full suite 5630/5630, lint + legibility + consistency gates green.

## Consequences / scope

- **Tier C (front-door identity):** rides behind the Governor reviewer pass
  (DR-0104), same as DR-0172 — the WORK is done now; the only remaining step is
  Darrell's review, which is an owned, immediate gate (him, next review), not an
  orphaned date. The live network call is exercised on the reviewer pass (the
  cloud sandbox cannot run the real Supabase email-change end-to-end).
- **The keeping-both-logins limit, stated plainly (DR-0100):** Supabase has one
  email column per user, so after promotion the primary login identifier is the
  verified email; the phone remains identity/recovery metadata on the same id.
  One account throughout — the unique-ID mapping is never broken.
