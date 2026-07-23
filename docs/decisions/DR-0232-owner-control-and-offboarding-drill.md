---
id: DR-0232
title: Owner control of the apps — owner-gated key custody + the offboarding drill (a platform capability, not a family hardcode)
status: accepted
date: 2026-07-23
tier: A
declared_by: Darrell
supersedes: []
amends: [DR-0152 (signing custody)]
principles: [GOVERN-EXECUTE-ADVISE, VERIFICATION-DOCTRINE (DR-0076), DATA-AS-EMPOWERMENT]
---

## The word (Darrell 2026-07-23, verbatim)

> "I only want us to have control over the apps if a dev/ops member leaves or
> something else more sinister etc... opportunities and constraints" — and:
> "I'm sure I'm not the only user who will find this value necessary..."

## Decision — the honest control model

1. **Access is revocable; knowledge is not.** GitHub roles, app roles, and
   tokens die on removal. But anyone who ever SAW the signing key could hold a
   copy — so (a) **generation is owner-gated** (the Store signing key card
   requires an owner/admin instance role via list_my_admin_instances — the
   PLATFORM's role system, so every future instance owner inherits the same
   control), and (b) **rotation IS the revocation** for the key itself: new
   identity, new secrets, one uninstall/reinstall across the fleet (the
   sideload cost; Play App Signing later removes it — DR-0152).
2. **The offboarding drill is a surface, not a memory** — lib/owner-control.js
   OFFBOARDING_DRILL enumerates every control an exiting member could hold
   (GitHub role, app roles, key exposure, dashboards, tokens) with its
   revocation and where, rendered on the signing card for every steward.
3. **Dashboards stay owner accounts** (Cloudflare/Stripe/Supabase/GitHub org)
   — members never hold platform logins; standing rule restated.

Constraint stated plainly: sideload rotation costs the fleet one
uninstall/reinstall; that is the price of true revocation until the Play
custody step lands.
