# DR-1407: One person sees one house from either sign-in, and the work order card says who it is reading for

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** B (which seats a person's own second sign-in holds; one migration, no new table, no money)
**Type:** bug fix
**Area:** migration 0319, `lib/one-person-sign-ins.js`, `lib/reader-reach.js`, the Work order triage card on Big Picture
**Sent in by:** Darrell, 2026-11-10, with screenshots of Big Picture → Work order triage: "Why don't Christina see the same page on the Big Picture!!!"
**Pairs with:** DR-1213 (the triage card), DR-0076 (unknown is never shown as complete), DR-0464 / DR-1046 (the home view is per device)

## Context

His Big Picture shows 4 open and 9 closed work orders. Three came from the Projects board (#5, #6, #12) and one from Poe Properties (#13, with 33 pictures). Christina's did not show the same page.

## What was measured

- **Two sign-ins.** Migration 0140 names both of her addresses as family: her Gmail and her TLC address.
- **The household is chosen per sign-in.** `join_default_instance` picks family first, then the sign-in's oldest seat. Each sign-in uses only its own seats.
- **The copy that could be read.** On the cloud copy (last activity 2026-10-28), the Gmail sign-in is admin of Poe Family, Poe Properties and COLG, and owner of TLC. The TLC address had no account there yet. The live house is on the NAS, which this sandbox cannot read, so which address she signs in with now was not observed.
- **An empty read looks like no work.** Poe Properties' work orders are read under the reader's own seat (`user_role_in_instance`). A sign-in without a seat gets an empty list, not an error. The card still said "every work order in the system".
- **Not the cause.** The section tabs are not remembered. The Life Hub and the Current View both mount the same card.

## Impact

Christina opens on the same house, with the same work orders, from either address. If a sign-in still cannot read Poe Properties, the card says so by name instead of looking like a smaller system.

## Decision

- **0319.** `share_my_households_across_my_sign_ins()` gives each declared sign-in of one person the seats the other holds, at the same role.
  - It only adds a missing seat, or raises member to admin or admin to owner.
  - It never lowers, never removes, and carries only owner, admin and member.
  - It is applied once at migration time. Both household resolvers (`table-sync`, and `snapshot-sync`, which feeds Big Picture) also ask for it once per account before choosing the house, so an account made later is levelled on its first sign-in.
  - Only the signed-in may call it. The pairs and the mirror are callable by nobody.
- **The card.** It now names the reader and their Poe Properties seat. With no seat, or with an unknown one, it says "every work order this sign-in can read" and states what is missing.

## Verification

- `0319-one-person-one-house-smoke.sql` runs on a real Postgres twice over: in CI's withdraw-walls job, and as the `one-person-one-house` leg of `rls-isolation.yml`.
  - It runs in one rolled-back transaction, with `@test.local` sign-ins swapped in as the pair, so no real account is touched.
  - The bug is asserted present first.
  - One call levels the second sign-in: 2 seats added and 1 raised. A renter seat is neither carried nor touched, and a stranger is untouched.
  - The repeat, the other sign-in, a stranger and nobody each change 0, and anon cannot call.
  - **Proven to catch:** with the role raise disabled, it fails naming `family-0319=member`.
- `either-sign-in-sees-the-same-house.test.jsx` has 15 cases: the reach states, the card on screen for a seat, no seat and a failed check, the old card's false claim, ask-once, never blocking sign-in, and both resolvers asking before the house is chosen.
- The 40 test files touching triage and sync pass (483 tests).

`re-review: 2026-11-17`. Once she next signs in, confirm on her screen that the reach line names a seat. If it does not, the line names the account to fix.
