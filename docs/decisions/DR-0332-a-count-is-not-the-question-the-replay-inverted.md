---
id: DR-0332
title: A count is not the question — the sovereign replay called an up-to-date database "BEHIND", and my own renumber is what tripped it
date: 2026-09-06
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0330]
tier: A
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, EXECUTION-OUTCOME-OBSERVABILITY, SOVEREIGN-FIRST, LESSONS-LEARNED, PERPETUAL-IMPROVEMENT, SURFACE-PREMISE]
source: 2026-09-06 session — db-migrate run 34034581033 on main tip da05b22, red at "Replay onto the sovereign database" with `ledger 183/182`
---

## What I got wrong first

DR-0330's follow-up (#1454) renamed `0168-legal-document-shelves.sql` to
`0169-…` because the db-migrate lane went red with an ordinal collision. That
PR said renumbering was "the whole fix — no schema change, no data change."

**That was overstated, and the renumber caused a second, worse failure.**

Two databases are in play and I collapsed them into one. The `0168` ordinal
collision came from the **hosted** database's ordinal guard. The **sovereign**
database has no such guard — its ledger (`public._sovereign_replay`) is keyed by
FILENAME. It had already applied and ledgered `0168-legal-document-shelves.sql`
cleanly, and runs 445 and 446 were **green at `ledger 182/182`**.

Renaming the file made the next sovereign replay see an unknown filename, apply
it (idempotently — no harm to the schema), and ledger the new name. The old row
stayed. `183` rows against `182` files, and the lane failed with:

```
sovereign replay exited 1 - the app's database is BEHIND the repo
```

The database was not behind. It was completely up to date, carrying the
migration twice under two names.

## The real defect, which predates me

```sh
TOTAL=$(( $(ls "$MIG_DIR"/*.sql | wc -l) + 1 ))
DONE_NOW=$(PSQL -c "SELECT count(*) FROM public._sovereign_replay;")
[ "$DONE_NOW" = "$TOTAL" ] && exit 0
exit 1
```

The question this lane exists to answer is **"is every migration file applied?"**
The code asks **"do two counts match?"** — a proxy that is only accidentally
equivalent, and that **inverts** on an ordinary event: renaming an applied
migration. A count can be wrong in both directions; the question cannot.

Worse, the failure message asserts the *opposite* of the truth with total
confidence. "BEHIND the repo" sent me looking for an unapplied migration that
never existed. That is the DR-0076 §8 failure in a diagnostic: an unverified
claim stated as fact, in the one place someone turns to when something is wrong.

## Decision

**Ask the question directly.** `replay_migrations.sh` now iterates the migration
files and checks each for ledger membership. Success is "no file is missing."

This is **stricter, not looser**: an unapplied file is still caught (and
`FRONTIER` already names it), and the `MAX_PER_RUN` budget case is still caught.
What changes is that a ledger row naming a file this checkout no longer has is
**reported, not fatal** — it is bookkeeping to clean, not a database to migrate.
The script now names each orphan and prints the exact single-row `DELETE` that
clears it, so cleanup is a copy-paste rather than an investigation.

**The witness:** `scripts/replay-completeness-guard.mjs`, wired into `ci.yml`
beside `migration-replay-order-guard`. It refuses a count-equality success
condition AND requires a per-file membership check, so a rewrite cannot drop the
count and still fail to answer the question. Observed catching the real pre-fix
line before the fix went in.

## The orphan row still on the sovereign database

One row — `0168-legal-document-shelves.sql` — names a file that no longer
exists. With this fix the lane goes green regardless, because every real file is
applied. The row is harmless bookkeeping and the script will keep naming it
until it is removed:

```sql
DELETE FROM public._sovereign_replay WHERE fname='0168-legal-document-shelves.sql';
```

That is Darrell's hand (this sandbox has no route to the NAS), and it is
deliberately **not urgent**: nothing is broken while it sits there.

## What this session keeps teaching

Third time in one day, now a fourth shape:

- the `/taxes` installer was in **no manifest**
- the Funnel mount was in **no record**
- the migration ordinal registry lives **only in the database**
- and here, the success condition asked a **question adjacent to the real one**

Every one of them was green, or confidently wrong, at the layer anyone would
look at first. The pattern is not carelessness — it is that a *proxy* for truth
keeps getting installed where the truth itself was available, and proxies fail
silently and confidently.

## Honest limits

- The orphan-row cleanup is unverified from here; no database credentials, no
  route to the NAS. The next db-migrate run's own output is the confirmation.
- The `_sovereign_replay` table's own history is not otherwise audited by this
  change. If other renames happened before today, the script will name those
  orphans too on the next run — which is the point.
