# DR-0899 — Rent is reported the way it is paid, and every change keeps its time

**Date:** 2026-10-10
**Status:** accepted
**Area:** Poe Properties: the Rent tab, part payments, the door's history (migration 0262)
**Principle:** DR-0094 (no money moves in the app), DR-0076 (proven to catch), DR-0060 (RLS is the gate), DR-0124 (real dates only), 0201's refusal of account numbers; builds on DR-0897 (work on the door)

## Context

Darrell, 2026-10-10, three messages in a row:

> "The tenants can say they paying right not take them to cashapp or zelle and other options... even cash... put it in Chase bank... etc... make sense?"
>
> "Full rent or percentage of rent... so its documents it and the notes for the following remaining amount and when it will be paid... keeping the historical events... make sense?"
>
> "Date and timestamps for everything possible... so we can recreate a situation...."

**SHOULD.**
- A tenant taps "I'm paying" and is handed to how they actually pay: Cash App, Zelle, Venmo, cash, a bank deposit (Chase), or a check.
- A full or part payment is recorded. A part payment carries what is still owed, when the rest is promised, and a note.
- Nothing is lost.
- Every event can be replayed in order with its exact time.

**ARE.**
- The Rent tab's "I paid the rent" card took an amount, a month and a method word.
- It recorded nothing about what was due, what remained, or any promise.
- It sent the tenant nowhere.
- Status changes (reported → confirmed) overwrote the row, keeping only `confirmed_at`. A work order's moves kept only `updated_at`. The history could not say when something was scheduled, who assigned it, or what happened in between.

## What was measured

- **`rent_records` (0055, 0150).** It has amount, for_period, method (free text), memo, status, reported_at, confirmed_at and posted_tx_id. It has no due, remaining or promise. `money_moved_in_app` is CHECKed false.
- **No payee anywhere.** There was no record of the landlord's $cashtag, Zelle address, or deposit instruction, so the app could not hand anyone anywhere.
- **No change log.** No table holds a work order's or a rent record's change history.

## Impact

- A part payment and its promise lived only in a text thread.
- A tenant who paid by Cash App had to come back and type it in.
- When a dispute or a question arose ("when was this scheduled? when did they say they'd pay the rest?"), there was no ordered record to recreate it from.

## Decision

1. **`rent_payee`: how this landlord is paid, in his own words.**
   - One row per instance, with six fields: $cashtag, Venmo, Zelle phone or email, a cash line, a bank-deposit line, and who checks are payable to.
   - Only owner/admin write it. Members read it.
   - A tenant or household member reads it only for their own door, through `rent_payee_for_tenancy()`.
   - **Never an account or routing number.** A CHECK refuses seven or more digits in a row in the free-text lines.
2. **The record first, then the hand-off.**
   - "I'm paying" writes the record before anything opens. The record holds the amount, the method, what was due (`due_amount`), what remains (`remaining_after`), when the rest is promised (`rest_promised_on`, required for a part payment and never in the past), a note, and this device's clock (`reported_on_device_at`). The server's `reported_at` sits beside them.
   - Only then does the app open Cash App (`cash.app/$tag/<amount>`) or Venmo with the amount filled in, or show the landlord's words for Zelle, cash, deposit or check.
   - A remainder can never exceed what was due (CHECK).
   - The family confirms when the money lands. No money moves in the app.
3. **`record_events`: every change, to the instant.**
   - Triggers write one append-only row for each:
     - rent report, status move, amount or promise change, and posting to the books;
     - work order filing, status move, assignment, and priority change.
   - Each row carries `clock_timestamp()` and the user who did it.
   - No grant exists to edit or delete a row, so nobody, the family included, can change one.
   - A person reads exactly the events of the records they can already read: the policy asks the parent table under the reader's own RLS.
4. **The app.**
   - The Rent tab shows what is due, recorded and left for the month, then the choice of how to pay.
   - Payment history reads, for example: "$300.00 for 2026-10 by Cash App. Part payment: $380.00 still owed, promised by 2026-10-20." It shows the reported and confirmed times, with each change beneath.
   - The door's History tab interleaves every change, oldest first.
   - The family gets a "How tenants pay you" card on the Rent tab.

`re-review: 2026-10-24` — on the live app: write the payee card, have a tenant seat record a part payment by Cash App, confirm it, and read the history to the second. Confirm `https://cash.app/$tag/<amount>` opens Cash App with the amount on a real phone. The link format is from Cash App's public link convention and was not testable from this sandbox.

## Verification

- **The database.** `infra/supabase/tests/0262-rent-and-clock-smoke.sql` runs in the `door-work` CI leg after 0262 applies twice, and in the live `rls-isolation` poe-properties leg. It proves:
  - a tenant cannot write the payee;
  - an account number in the deposit line is refused;
  - the owner writes the payee;
  - the tenant reads it for their door, while another door's tenant and a stranger read nothing, and a tenant cannot read the table directly;
  - a part payment records due, remaining and promise;
  - a remainder over the amount due is refused;
  - the report and the confirmation each leave an event with the right hand and values;
  - the tenant and owner read the events, and another tenant does not;
  - the owner can neither edit nor delete an event;
  - filing, scheduling and assigning a work order leave three events.
  - Measured locally on PostgreSQL 16.15: `RENT AND CLOCK SMOKE: PASS`.
- **Proven to catch.** Seven breaks each failed by name, and re-applying 0262 restored PASS:
  - dropping the account-number CHECK;
  - granting UPDATE on events;
  - opening the events read policy;
  - dropping the rent trigger;
  - dropping the work trigger;
  - removing the tenancy check from `rent_payee_for_tenancy`;
  - dropping the remainder CHECK.
  - The first break also exposed a replay gap: the account-number CHECK sat inside `CREATE TABLE IF NOT EXISTS` and could not be restored. It now has its own guarded step.
- **The app.** `app/src/__tests__/rent-pay.test.jsx` has 8 tests:
  - the links and instructions;
  - what is due (disputed and void never count);
  - the part-payment rules;
  - the history's change lines, kept to the millisecond;
  - the tenant paying part by Cash App (the record written before Cash App opens, with the promise and the device clock);
  - the tenant paying in full by Zelle (the landlord's own words, nothing opened);
  - no payee written yet;
  - the family's card saving.
  - Proven to catch: opening Cash App before writing the record fails the ordering test.
- **The source gate.** The "no instance filter in this module" gate caught my first payee read. It now reads what RLS allows and picks the door's instance.
- **Existing checks.** The 32 Poe Properties test files pass, the flow graph has 0 findings (`rent-pay` and `record-clock` nodes), and lint is clean.
