# DR-0351 — TLC Therapy Solutions runs in its own instance

**Date:** 2026-09-10 · **Status:** accepted · **Tier:** B · **Area:** tlc · **Principles:** VERIFICATION-DOCTRINE, APP-IS-PRIMARY, REALITY-TRACE, TLC-FIREWALL, DATA-AS-EMPOWERMENT, DECISION-RECORDS

## Directive, in Darrell's words (2026-09-10)

- *"yes TLC gets it's own database!?!!!!"* — answering the assessment's open decision ("Decide whether TLC gets its own database instance separate from the family").

## What was true before

The TLC office and the Poe family shared the `poe-family` instance (Darrell owner, Christina admin, migration 0130 §8). Every office row — tasks, lesson assignments, invites, packets, banking, roster, jobs, applications — carried the family instance id; family members appeared in the office's Governance list; a family child seat could be mistaken for an office seat; and the office resolver `tlc_onboarding_my_office()` (0187) was the shell's family-first resolution wearing an office name. Measured live on 2026-09-10 before the change: poe-family held three memberships (Darrell's gmail and phone identities as owner, mrspoe06 as admin); every `tlc_*` table was empty, so the move carries no rows yet.

## Decisions

1. **One instance is the office.** Migration 0193 creates the instance `tlc-therapy-solutions` (display name "TLC Therapy Solutions", `instance_type` `therapy-practice`, an existing allow-listed type), idempotent by slug.
2. **Christina owns it; Darrell administers it; nobody else is seeded.** Both of Christina's sign-ins (`christina@tlctherapysolutions.com`, `mrspoe06@gmail.com`) become owner, never downgraded; Darrell's gmail and phone identities (0140: the same person) become admin, never downgraded from owner should the office ever make him one. A sign-in that does not exist yet seeds nothing and is picked up by a later run. Every other seat is granted from Governance or minted by a hire.
3. **The office rows move.** Every `tlc_*` table with an instance foreign key is re-homed from `poe-family` to the office in one block; the application guard trigger (0191, which pins `instance_id`) is stepped around for the move and re-armed in the same statement.
4. **The office resolvers answer only from a therapy-practice membership.** `tlc_onboarding_my_office()` loses its family-first fallback; a new `my_office_instance_role()` (the jsonb shape of 0130's `my_default_instance_role()`) serves the app. A family member who is not office staff is a client at the TLC door. The shell's `my_default_instance_role()` is untouched — the family app keeps working for the same people.
5. **The app reads the office through its own hook and resolver.** `lib/instance-role.js` becomes one store factory serving two resolvers: `useInstanceRole` (the shell) and `useOfficeInstanceRole` (the TLC door, Onboarding, Governance, the Assistant workspace). `getOfficeInstanceId()` in `lib/table-sync.js` gives the TLC seams (assignments, the launch board) the office instance and never joins or creates a space.
6. **Not moved, dated.** `office_records` (`office_id = 'tlc'`, the Assistant workspace) and `practice_leads` are read by the PoeTech shell's Practice tab from the family instance as well; re-homing them changes what that tab shows and is its own increment. `re-review: 2026-09-17`.

## Proof

- `0193-tlc-own-instance-smoke.sql` in the rls-isolation `tlc-office` leg (after 0192; 0189 and 0191's smokes now stand up a therapy-practice office): a person in a family (joined long ago) and a practice (joined now) gets the practice from both office resolvers and the family from the shell's; a family-only owner gets no office and cannot mint an office invite; a practice-only member gets the practice; a stranger nothing; live, the office instance exists with an owner and an admin and no office row remains on the family.
- `tlc-onboarding.test.js` (+4): the seed, the move, the resolvers, the hooks and seams, the leg. `instance-role-office.test.js` (2): the two stores ask two resolvers; the office id never joins.
- Live proof: db-migrate applies 0193 on merge; the rls-isolation run it dispatches runs the smoke against the real database.

## Related

DR-0130 (the family resolver), DR-0344 / DR-0346 / DR-0350 (the office surfaces that now read the office), DR-0271 (the assistant standing), DR-0060 (the database is the wall).
