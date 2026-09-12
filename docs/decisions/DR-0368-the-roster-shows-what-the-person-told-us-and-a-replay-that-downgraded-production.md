# DR-0368 — The roster shows what the person told us, and a replay that downgraded production

**Date:** 2026-09-12 · **Status:** accepted · **Tier:** B · **Area:** platform · **Principles:** VERIFICATION-DOCTRINE, REALITY-TRACE, SURFACE-PREMISE-CONFLICTS, DETERMINISTIC-FIRST, SAY-WHAT-IS-NOT-BUILT, DECISION-RECORDS

## Directive, in Darrell's words (2026-09-11)

> *"also see the email and try to get email and cellphone together if they have them... however just not allowing it to be a constraint."*

DR-0366 answered the account half. This closes the half that was still open, and — while closing it — found that the feature had been silently switched off in production.

---

## Part 1 — The dated item rested on a premise that was wrong

DR-0366's "What is NOT built" carried:

> *No phone for an ordinary account. ... The honest fill path is the person's own record (`contactPhone`), which exists for church members and for nobody else yet. re-review: 2026-10-11 — whether the household and TLC intakes should carry the same cell.*

**They already carry it.** Verified before doing anything with it:

- `app/src/lib/household-intake.js:75` — `{ key: 'contactPhone', type: 'tel', label: 'Best phone' }`, not required.
- `app/src/lib/tlc-office-forms.js:54` — `phone` is in `FLOOR_REQUIRED`.

So the dated question is answered and was never the gap. The gap is that **`list_instance_members` never read any of them**: 0210's phone chain is `auth.users.phone` → `raw_user_meta_data->>'phone'` → the digits inside a phone-door address, and stops. Meanwhile `lib/member-contact.js` has read `declaredEmail` / `declaredPhone` since the day it was written and labels them *"they told us"* — the best-labelled branch in that module was unreachable from the real surface. Right code, no supply.

## Part 2 — Which tables may honestly speak for a person

A roster row is a claim about **one person**, so the only question that matters is which records are **per-person**. Measured live, 2026-09-12:

| table | shape | read? |
| --- | --- | --- |
| `church_member_records` | `(instance_id, user_id, record)` | **per person → READ** |
| `tlc_onboarding_packets` | `(instance_id, applicant_user_id, packet)` | **per person → READ** |
| `household_records` | `(instance_id, record, started_by)` — **no `user_id`** | per instance → **NOT read** |
| `office_records` | `(instance_id, created_by, payload)` | not a contact → **NOT read** |

**The household record is one row for the whole household.** Its *"Best phone"* is the household's number. Joining it would have printed that number beside every member's name as though each had given it — the same false statement 0210 already refused when it stopped printing a phone-door address in an Email column (DR-0076 rule 8). The smoke proves it does not leak: a household row carrying `(563) 555-9999` appears on zero member rows.

A colleague's onboarding packet is a different case and passes: `phone` is in the office's own required floor, and the packet belongs to one applicant.

### Decisions

1. **0213 returns `declared_email` and `declared_phone`** — only from a record belonging to **that person** in **that instance**, and only the two contact cells. The other 27 answers in a church member record stay where they were. The audience is unchanged: owner/admin of that instance, enforced inside the function body, exactly as 0111/0143/0144/0210 wrote it.
2. **The account columns are untouched.** A declared email does not overwrite the sign-in address and a declared phone does not invent an account phone — they are different facts, and the client decides which to show. The smoke asserts both.
3. **`household_records` is never read for a person's contact**, by design, and a test pins that the migration does not name it.
4. **Still not a constraint.** Two more nullable columns. Nothing becomes required, no row is hidden, and a deployment that has not replayed 0213 simply gets `undefined` (the client maps by name).

## Part 3 — And the roster had been switched off in production

While wiring this, `pg_get_function_result` on the live `public.list_instance_members` returned **0144's six columns**. Everything 0210 added — `joined_at`, `last_sign_in_at`, `created_at`, `phone`, `email_is_phone_door` — was **absent from poetech.us**, one night after it shipped. No error, no red check: `lib/member-roles.js` maps by column name, so the columns came back `undefined` and the surface rendered without them.

**Cause.** `rls-isolation.yml`'s legs APPLY their migrations to the live database (only the smokes roll back). Five legs replay 0111 / 0143 / 0144, each of which re-creates that function; none replayed 0210. Every dispatch of the matrix downgraded production.

**Why the guard built for exactly this missed it.** `migration-replay-order-guard` (2026-08-27, after `claim_property_access`) matched only `CREATE OR REPLACE FUNCTION`. A migration that changes a function's RETURN TYPE **cannot** use `CREATE OR REPLACE` — Postgres refuses — so it must write `DROP FUNCTION` + plain `CREATE FUNCTION`. The one shape a replacement is *forced* to take was the one shape the guard could not see, and a widening migration is precisely the kind you least want reverted. Recorded as **P55**.

**The three fixes, in order.**

1. The live function was restored to 0210's definition immediately, and the restore verified by re-reading `pg_get_function_result` — not assumed.
2. The guard's pattern was widened (`OR REPLACE` optional) rather than a second guard added. It then named **17 stale replays across 7 legs** in its own words. That is the proven-to-catch, against the real repository rather than a fixture.
3. Every leg was closed over its later redefiners, in ascending order, so a replay converges on the current truth instead of restoring the past.

## What is NOT built (DR-0329: say it)

- **Nobody has filled a record anywhere yet.** Counted, not assumed: `church_member_records` 0 rows, `household_records` 0 rows, `tlc_onboarding_packets` 0 rows. So 0213 ships a door that is correct and today returns NULL for all 23 accounts. The reason 21 of 23 show no phone is **not a missing form cell** — it is that no record has been filled. Chasing that is exactly what the directive forbade, so nothing chases it.
- **No verification of a number.** A declared phone is a number somebody typed.
- **No notification.** Seeing a phone is still not permission to text it.
- **No account merge** — unchanged from DR-0366 decision 4.
- **The legs still run against the LIVE database.** Closing them over their redefiners makes a replay converge, but the underlying posture — a proof lane that writes to production — is unchanged by this record. *re-review: 2026-10-12 — whether the isolation matrix should run against a throwaway branch database instead.*

## Proof

- `0213-roster-declared-contact-smoke.sql` — on the product-forms leg; asserts the person's own answer comes back, the account columns are untouched, a prayer request does not leak, a packet answer comes back, a member with no record stays on the roster with NULLs, the household's number lands on zero rows, and an ordinary member still reads zero rows.
- `migration-replay-order.test.js` — 10 tests, including the role-control leg exactly as it stood while production was broken.
- `member-contact.test.js` — 33 tests, including the household-wall pin.
- The live restore, verified by reading the function's result type back.


---

## CORRECTION, same session (2026-09-12) — three things this record got wrong

Recorded here rather than quietly edited, because the original text is what a
reader may already have acted on.

**1. "Absent from poetech.us" was NOT established, and I should not have written
it.** What was measured — repeatedly and correctly — is the **hosted** Supabase
project (`SUPABASE_DB_URL`). Since 2026-08-19 the app is built against the
**sovereign** backend: `infra/nas-supabase/REPOINT-ARMED` makes
`deploy-cloudflare-pages.yml` build with `VITE_SUPABASE_URL=https://poetech.us/sb`
and an anon key read off the NAS at build time (DR-0310, read in full for this
correction). `rls-isolation.yml` writes only to `SUPABASE_DB_URL`. So the drift
was on a database **the app does not read**.

The right severity is therefore: **a regression in the PROOF plane, not a
demonstrated product outage.** That is still serious — the hosted database is
what every smoke and `live-definition-witness` judge, so a drifting judge
undermines every proof built on it — but it is a different claim than the one
this record made, and the stronger claim was the unverified one.

**2. The trigger was never my manual dispatches.** `db-migrate.yml`'s final
step is a literal `curl` to `rls-isolation.yml/dispatches` ("Dispatch the
isolation proofs (all features, one matrix)"). **Every db-migrate run
re-triggers the whole matrix.** That is why the function reverted twice *after*
it was restored by hand with no dispatch of mine in between — and it means the
revert was automatic on every merge touching a migration, which is worse than
the original account, not better.

**3. The 02:20 matrix legs had all finished by 02:25**, before the 02:26
restore. The second and third reverts came from the db-migrate-triggered runs at
02:39 and 03:01. The original text attributed them to leftover legs.

### What the fix actually proved

Migration 0213 applied to hosted through the lane with no hand restore
(13 columns ending `declared_email, declared_phone`). The widened witness passed
against the real database. `0213-roster-declared-contact-smoke.sql` executed for
the first time and printed **ROSTER DECLARED CONTACT SMOKE: PASS** at line 139 —
the whole file, household-leak wall included. And the legs that had been
reverting it — `role-control`, `choir-claim`, `support-door`, `viewer-readonly` —
all ran green and **left the function at 13 columns**. The closure holds.

### Still not verified (DR-0329: say it)

**Whether the sovereign database carries 0210/0213 correctly is UNKNOWN.** This
sandbox has no route to poetech.us (LESSONS P31), and the sovereign replay step
reported `applied 0 this run, ledger 219/215, frontier: none` with figures
(`ledger rows BEFORE: 151`, `AFTER: unknown`) that do not reconcile in a way this
record can explain. Its closing line — "The sovereign database now carries every
migration this checkout holds" — is the script's CLAIM, not an observation of
the function. DR-0310 decision 5 names the instrument that can observe it:
`site-health.yml`'s keyless probe of `poetech.us/sb`, run from a runner that can
reach the site. *re-review: 2026-09-13 — read the sovereign
`pg_get_function_result` from a runner and record which of the two databases each
proof in this repo is actually judging.*
