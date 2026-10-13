# DR-0563 — A man was a stranger to his own consent record

- **Status:** accepted
- **Tier:** B
- **Type:** fix
- **Date:** 2026-09-22
- **Scope:** `infra/supabase/migrations-auto/0224-one-person-two-doors-may-enrol-one-voice.sql` (new); `app/src/__tests__/one-person-two-doors-one-voice.test.js` (13 checks, new)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), ACCOUNT-UNIFICATION (DR-0311), SPEAK-ESTABLISHED-FACT (DR-0100)
- **Grounds:** Darrell 2026-09-22, screenshot of the Voice tab with the raw Postgres error on it; migration 0141 (`same_person`); the live policy read of the same evening (DR-0562)

---

## The report, which named its own cause

> "I also couldn't record and hear my voice... it didn't work..."

On screen, above the Record tab, with a sample already saved on the device and the studio answering:

```
new row violates row-level security policy (USING expression) for table "voice_profiles"
```

**"(USING expression)" on what the app calls an insert is the tell.** `enrollMyVoice` UPSERTs on `(instance_id, person_key)`. When a row already exists for that person, Postgres takes the **UPDATE** path — and the UPDATE path evaluates `voice_profiles_update`'s `USING`, which read:

```sql
USING (created_by = auth.uid())
```

The one row in that table — `ever_inserted = 1`, stats never reset — was created by **one** of his doors. Signed in on the **other** door, the same man is a different uuid, so his own row refused him, and every re-record hit the same wall.

That closes the loop on the whole evening. The table has exactly one row not because nobody cared, but because after the first enrolment the door locked behind him.

## The fix was already built in this house

DR-0311 / migration 0141 created `same_person(uuid)` for precisely this class — a `STABLE SECURITY DEFINER` predicate that is true when a row belongs to you **or to your own other door**, resolved through `person_links`. It was substituted into `study_entries`, `study_spaces`, `eternal_algorithms` and `tv_watch` so one library serves both doors.

**`voice_profiles` was never included.** 0224 includes it, on the three write policies only.

## Why this does not widen the bright line

`person_links` joins **a person's own two doors and nothing else**. So `same_person(created_by)` still means *"this is my row"*. Nobody gains the ability to create, move or revoke consent on another human being's voice — the rule 0047 exists to enforce, and the reason it exists.

Three things are deliberately kept exactly as 0047 wrote them: the instance-membership test on INSERT (widening *who is me* must not widen *where I may enrol*), the governor clause on DELETE, and **SELECT untouched** — reading who is enrolled was never the problem, and a migration that widens more than it was asked to is how a fix becomes an incident.

The `assistant_scope_*` and `viewer_readonly_*` overlays are **restrictive** and intersect with these, so an assistant still touches nothing and a viewer still cannot write. That was read live by name before this migration was written rather than assumed from source (DR-0562).

## Verification

- 13 new checks, green. The defect is pinned from **both** sides: 0047's own `USING (created_by = auth.uid())` is asserted to still exist as the thing being replaced, and asserted absent from the new policy bodies.
- A guard block raises rather than half-applying if `same_person` or `voice_profiles` is missing.
- One of my own pins was written too wide and failed on the migration's own explanatory header, which quotes the old rule on purpose. Scoped to the policy statements. That is the third time today a gate has caught my prose rather than my code, and each time the gate was right.

## Limits, stated

1. **Not yet proven on the live database.** This is the structural fix and it claims only that. The proof is Darrell recording successfully after the migration applies, and until that happens this record does not say it works. `re-review: 2026-09-23`.
2. **It assumes his two doors are actually linked in `person_links`.** `same_person` resolves through that table; if the row's `created_by` belongs to an account that was never linked, this changes nothing for that row. nas-health reports `person_links rows=` on every run, so the answer is observable — but it has not been read for this specific row, and this record does not pretend otherwise.
3. **Every other table carrying `created_by` has the same latent shape.** 0141 substituted four tables, 0224 makes five, and nothing sweeps for the rest. The durable answer is a gate that lists owner-scoped tables NOT using `same_person`, not another migration per table discovered by a bug report. `re-review: 2026-10-22`.
