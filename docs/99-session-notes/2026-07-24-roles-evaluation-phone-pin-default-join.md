# Roles evaluation — phone+PIN sign-in, second account, and the default-join exposure

Directed by Darrell 2026-07-24 (screenshot: signed in as (563) 650-2416,
persona ADAM, non-admin, seeing the family Action Queue with real incidents/
crew names). "Evaluate the roles comprehensively."

## Findings (measured, file:line)
1. **Two accounts is CORRECT, not a bug.** Phone+PIN creates a distinct
   identity (synthetic <digits>@phone.poetech.us, lib/supabase.js). The phone
   number is COLLECTED, not SMS-verified (DR-0172, Darrell's governed cost
   choice) — so "my number = me" cannot be auto-trusted: anyone typing that
   number with a new PIN would BECOME "him." Linking identities must stay an
   explicit verified act (promoteEmailToLogin path) or an owner-approved
   merge — never inferred from a claimed number.
2. **THE MATERIAL EXPOSURE — default-join:** join_default_instance
   (infra/supabase/schema-v2.1-infra.sql:145) adds EVERY new account with no
   instance to 'poe-family' as role 'member'. His new phone account therefore
   legitimately sees family operational data via RLS — and so would ANY
   stranger signing up on the public site. Historic single-family default,
   now an exposure at platform scale.
3. **Admin/owner gates HELD:** the non-admin account shows no Center owner
   cards, no admin tabs — the role system did its job above 'member'.

## Recommendation (default attached; Tier C — tenancy/front-door)
Flip the default: a NEW account gets its OWN fresh instance (self-serve
world, SEED-DATA-AS-ASPIRATION starter) — membership in poe-family or any
church instance comes ONLY through the existing invite rails
(instance_invites / ClaimInviteBanner). Family/COLG memberships audited once
at cutover. Companion: an owner-approved "link my accounts" flow so
Darrell's phone identity can be joined to his owner identity deliberately.
Owner: next session, first item after the store-key close; Tier C soak +
Governor pass per RELEASE-TIERS; tenancy gate proven-to-catch before ship
(DR-0060/DR-0076).
