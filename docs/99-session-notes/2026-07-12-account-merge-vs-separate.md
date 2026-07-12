# Phone+PIN vs email identity — merge or keep separate?

**Recorded:** 2026-07-12 · **Source:** DP — "I can't get into PoeTech as myself, and I
have a different account under my cellphone — should that merge or stay separate?
Opportunities and constraints." **Status:** decision + plan; account-linking is Tier C
(auth; lockout risk). Advisory — Darrell governs.

## What is actually happening (diagnosis)

The phone+PIN way in (DR-0172) creates a **separate Supabase auth user** with a synthetic
identifier `<digits>@phone.poetech.us`. Darrell's "self" is a **different** user —
`darrellpoe06@gmail.com` (email/Google). So there are **two accounts for one person**:

- `darrellpoe06@gmail.com` — his real identity, holds his data + his owner/admin role.
- `<phone>@phone.poetech.us` — the phone+PIN account he made, empty of his history.

"Can't get in as myself" = he landed on (or is trying to reach his data from) the phone
account, but his data lives under the email identity. They don't see each other.

## Get in as yourself right now (no build)

Sign in with **email / Google** (Royalty Link or password) — that is `darrellpoe06`, the
identity with your data and your church roles. The phone+PIN login is a *different* account.

## Merge or separate? The rule

**One PERSON = one identity** (the governance Way, 2026-07-12; standard IAM). For Darrell,
the two should be **ONE account with phone+PIN added as a second way to sign in** — not two
accounts. **Separate is correct only when it's a genuinely different person or role** (a
kiosk identity, a family member, a low-privilege congregant who is not also an admin).

## Opportunities & constraints

**Merge into one identity (recommended for a person who has both):**
- **Opportunity:** all data/roles/history in one place; no "which account am I in?"; his
  admin role attaches to one self; matches best practice; ends the sprawl.
- **Constraint:** Supabase does not auto-merge two EXISTING users. You either (a) **link**
  phone+PIN as an added factor onto the primary (email) account — clean when the phone
  account has no data yet — or (b) **migrate** data off the second account and retire it —
  a real migration if both hold data. Auth changes carry **lockout risk** → Tier C, careful.

**Keep separate:**
- **Opportunity:** true separation of duties — a casual/kiosk login is NOT the same identity
  as the owner/admin (smaller blast radius); right for a genuinely different person/role.
- **Constraint:** for the SAME person it **fragments** data and confuses ("can't get in as
  myself") — exactly the failure here.

## The fix (recommend + build, carefully)

**Account-linking, not second-account-minting.** The phone+PIN flow should:
1. When someone enters a phone that (or a person who) **already has an email/Google
   identity**, OFFER to **link** phone+PIN onto that existing account (add it as a sign-in
   method) instead of creating a new user.
2. For a congregant with **no** email (the DR-0172 case), keep minting the phone identity —
   that path is correct and stays.
3. For Darrell's current two accounts: **consolidate to `darrellpoe06`** — add phone+PIN to
   it; if the phone account has any data, migrate then retire it.

Guardrails (Tier C): never orphan an identity; a linked account keeps BOTH ways in (no
lockout — the DR-0172 no-lockout rule extends here); verify phone ownership before linking a
phone to an email identity (so a phone can't hijack an email account).

## Pairs with

DR-0172 (phone+PIN), the governance/identity Way (one-person-one-identity, adaptive auth),
DR-0060 (roles), DATA-EMPOWERMENT. A DR to follow once the linking design is confirmed.
