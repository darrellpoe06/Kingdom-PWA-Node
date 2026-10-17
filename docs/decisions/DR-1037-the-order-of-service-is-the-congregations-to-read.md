# DR-1037: The Order of Service is the congregation's to read — Christina was locked out by the choir roster

**Date:** 2026-10-15
**Status:** accepted
**Tier:** A (defect fix: a read gate that excluded the people the feature names)
**Type:** orchestration
**Area:**
- `infra/supabase/migrations-auto/0293-the-order-of-service-is-the-congregations-to-read.sql` (three READ policies widened to instance membership; no write policy)
- `app/src/lib/service-program.js` (`deriveAccess`: `canSee` admits any member of the church space)
- `app/src/__tests__/service-program.test.js` (the plain-member case this suite never had, plus the policies read off disk)

**Amends:** DR-1029 / 0292 (which named the auxiliaries but could not show them the order), and the read half of 0042 and 0045.
**Grounds:** Darrell 2026-10-15 — *"Christina does not see the order of service!!!!!!!!! Either!!!!!!!!!"*; DR-0060 (the tenancy wall is the real gate and does not move); DR-0076 (measure before claiming); DR-0621 (a flag is where the work starts)
**Declared by:** Darrell, reporting that a named member of the house could not open a page the house runs on

## Concern

A member of The Church of the Living God opened the Order of Service and saw nothing. Not a refusal she could act on — nothing.

## Context

The order of service is what the whole house walks into on Sunday and Wednesday. Since 0292 (DR-1029) each line also names **who serves**: its key personnel and the auxiliary carrying it — the Choir, the **Ushers**, the **Deacons**. Darrell's own words commissioning that work: *"so any church can total their time and add key personnel to each task... or add a auxiliary."*

## What was measured

**Reading the order required CHOIR membership, and had since 0042.** Three tables, all three gated the same way:

| table | migration | read policy |
| --- | --- | --- |
| `church_service_programs` | 0042:72 | `USING (user_in_choir(instance_id))` |
| `church_service_segments` | 0042:86 | `USING (user_in_choir(instance_id))` |
| `church_service_segment_actuals` | 0045:79 | `USING (user_in_choir(instance_id))` |

And the predicate itself:

```sql
user_in_choir(instance_uuid) = user_role_in_instance(instance_uuid) IN ('owner','admin')
                            OR EXISTS (SELECT 1 FROM choir_members
                                        WHERE instance_id = instance_uuid AND user_id = auth.uid())
```

So the whole set of people who could read it was: **owner, admin, or someone on the choir roster** — plus the worship finalizer in the UI layer. A plain member was never in it.

**The UI gated it a second time.** `deriveAccess` read `canSee = canEdit || inChoir`, so even with the policies fixed the tab would stay hidden; and with only the UI fixed the page would render and the database would return zero rows. **Neither half works alone** — which is the trap in this fix and the reason both are in this change.

**It is NOT a regression from yesterday.** 0292 contains no policy statement at all; the gate is from 0042/0045. What 0292 did was make the gap absurd: a deacon could be printed **on** the order and unable to open the page he was printed on.

**And the first attempt at this did not fix it.** #2182 (DR-1032) shipped four hours earlier and touched **no** `infra/` file; `deriveAccess` came through it byte-identical. What it built was a refusal that explains itself — the screen now prints the account, whether a church space answered, the role, and `Choir roster: not on it.` That is a real improvement and it is how the cause became legible. It is not access. Christina went from a blank page to a page that told her she wasn't in the choir.

**The suite never tested a member.** Every pre-existing `deriveAccess` assertion passes a role of `'owner'`, `'admin'` or `null`. Not one passed `'member'`. The case that was broken was the case nobody had written.

## Impact

Any member of the church space can now **read** the order of service, its lines, and what actually took place. Ushers and deacons named on a line can open it.

**Writing did not widen, deliberately.** INSERT/UPDATE/DELETE on the programs and segments stay owner/admin; the actuals stay with the worship finalizer. 0293 carries no write policy, and a test asserts it never grows one.

**The tenancy wall did not move.** The predicate is `user_role_in_instance(instance_id) IS NOT NULL`, which reads `instance_members` and returns NULL outside the space. This is "a member of THIS church space", never "anyone signed in" (DR-0060). Three assertions pin that, including that the policies never become `USING (true)` or keyed on `auth.role() = 'authenticated'`.

## Decision

1. **0293 widens the three READ policies** to instance membership — all three, including the actuals that shipped yesterday, because fixing the first two leaves the "Actual times" and "Track record" tabs blank.
2. **`deriveAccess` admits any member**: `canSee = canEdit || inChoir || isMember`, where `isMember` is a non-empty `role` string.
3. **Writes are untouched.**
4. **The policies are pinned from the test suite**, read off disk, so the UI half can never drift from the SQL half.

## Verification

- `service-program.test.js`, `service-actuals.test.js`, `service-program-sections.test.jsx`: **91 passing**. All six pre-existing `deriveAccess` assertions still pass unchanged — the widening is additive.
- **Proven to catch, each half independently.** Reverting `deriveAccess` to the choir rule fails **4** tests including the Christina case. Reverting **only** `church_service_segment_actuals` back to `user_in_choir` fails the "all THREE read policies move" test — the exact trap this record names. Restored: 51/51.
- **Two defects in my own tests, caught by the tests themselves.** First I counted the predicate across the whole file and got 4 for 3 policies, because the header explains the predicate in prose. Then the "no choir predicate left behind" assertion fired on the header, which deliberately *quotes* the three old policies so a reader can see what changed. Both are fixed the same way: the negative assertions read the executable statements with comment lines stripped, and each policy is pinned as a whole statement rather than by counting.
- Full suite, lint and the 20 guards before the push; results in the commit message.

**Not claimed:** that anyone has watched Christina's own screen come back. This is verified at the policy and the predicate, by test and by revert — not by her account on the live site. The deploy proof and a live check are the next step, and the refusal screen DR-1032 added is what will show the state plainly if anything is still wrong.

**Not addressed here:** whether the *editing* of the order should widen beyond owner/admin and the worship finalizer. Nothing reported that, so nothing moved. `re-review: 2026-11-15` — ask whether a deacon or usher head should maintain their own lines.
