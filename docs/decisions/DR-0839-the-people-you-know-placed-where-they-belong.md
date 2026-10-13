# DR-0839 — The people you know, placed where they belong

- **Status:** accepted
- **Tier:** A (a read of the contacts and the signups the steward already sees, and the three writes the app already trusts; no table, no policy, no new grant)
- **Type:** feature
- **Date:** 2026-10-09
- **Scope:** `app/src/lib/people-placement.js` (new, pure: `peopleFromContacts`, `accountFor`, `matchAccounts`, `isPropertiesSpace`, `PROPERTY_PLACEMENTS`, `placementsFor`, `inviteIdentityFor`, `placePerson`, `placeMany`, `placementSummary`), `app/src/components/PeopleYouKnow.jsx` (new), `app/src/components/AccessUsageMetrics.jsx` (the *People you know* section after Signups), `app/src/__tests__/people-you-know.test.jsx` (8).
- **Principles:** DR-0736 and DR-0826 (the contacts are the steward's own, kept on their server and this device), DR-0825 (a known number reads as the person), DR-0829 (an account that exists is added by the governor's hand), DR-0187 (a person without an account is invited and claims), 0150 (tenants, household, workers and managers are invites on the Poe Properties instance), DR-0076 (every result is said per person; nothing is painted), DR-0065 (built in the app).
- **Grounds:** Darrell, 2026-10-09: *"Also my daughter Christiana!!!!! In my contacts... how do I add all my contacts at once?!!!!!!! Then choosing who are tenants... church members... etc... all who we want in whatever space... make sense?"*

## Context

The contacts come in all at once already: Messages > Add a contact offers *Pick from my phone* (one, some or all; the picker runs with `multiple: true`) and *Upload my contacts file (.vcf)* (every contact a phone or Google Contacts exports), and the keeper holds them (0247). What did not exist was the next step he described: look at the people you know and say what each one is to the family's spaces. The signups list could add an account that exists (DR-0829); the People tab on a Poe door could invite one person to one door; the family invite could send one claim link. Nothing read the contacts as the roster they are.

## What was measured

- `ContactsImport.jsx` 60: `nav.contacts.select(props, { multiple: true })`; 115: *Pick one, some or all from your phone, or share all your contacts as a .vcf file*. The road in is built; this record is the road out.
- The writes that exist: `add_user_to_instance` (0255), `invite_to_instance` and `invite_to_church` (0081, DR-0187), `property_access_invites` (0150) with `role_label`, `invited_phone`, `scope_ref '*'`, `capabilities` intersected with the role's ceiling at claim time.
- An account is matched to a contact by a real email or by the ten national digits of the phone a phone-door account signs in with (`<digits>@phone.poetech.us`).

## Impact

- Unresolved: a steward with a hundred contacts places them one at a time through three different doors, and a daughter in the phone stays a stranger to the app until someone types her number again.
- The call obligates: one list, one choice of space and placement, applied to one person or everyone ticked; each write is the one the app already trusts for that case; each result is said per person with what was written and what the person must do (sign in, or follow a claim link).

## Decision

1. **The list is the contacts**, keeper and device merged by identifier, named rows only, each matched to an account where one exists.
2. **A space and a placement are chosen once.** On the Poe Properties space the placements are tenant, household member, 1099 worker and property manager (the invite table's own roles, with the worker's and manager's capabilities at their ceilings; scope every door, a door set later under Properties > People). Everywhere else: member, viewer, and admin for an owner.
3. **The write follows the person:** an account that exists is added to the space now (DR-0829); a person without one is invited, by their real email first, else by the phone they will sign in with (the phone-door address), and the result says *claim link* when the road returns one and *theirs on their next sign-in* when the church road takes it; a Poe Properties placement writes the invite the door claims from.
4. **One or many:** a per-row Add or Invite, or tick everyone shown and place them together; never stopping on one failure; a summary line counts added, already there, invited, links to send, not placed.

## Verification

- `people-you-know.test.jsx`: the merge (keeper and device, by identifier, names only, national digits); the account match by email and by phone-door digits; the placements per space; the invite identity (email first, else phone); an account added, a person invited with a claim link, a church invite, a tenant and a 1099 worker written to the Poe Properties invites with the right capabilities, a person with no reach refused, a missing space refused, many placed with a summary; the section rendered over a keeper with two people and one account (names, account badges, the count, one person invited to the family by her phone-door address with the claim link shown), and everyone ticked placed as tenants on Poe Properties with each write seen.
- The signups suite still green (6); eslint clean at zero warnings.
- `re-review: 2026-10-16`: the first real placements read back from `property_access_invites` and `instance_members`, and whether a placed tenant should be put on a door from this list (today the door is set under Properties > People).
