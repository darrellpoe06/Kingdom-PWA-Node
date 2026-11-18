# FOS Money — database migrations: readiness, apply, verify, roll back

Christina's rule (2026-11-17): no Money migration reaches the live database
until authorized database access is restored, a backup is confirmed, and the
migration is tested — and nothing merges without her approval. This page is
how each of those is met **without a key** (DR-1525) and what to do if a
migration has to be undone.

The two Money migrations it covers:

| PR | What it changes | Rollback |
|---|---|---|
| #2727 | Migration **0334**: two read-only functions (`db_backup_receipt()`, `money_readiness_receipt()`). No table, no row, no grant on data. | `infra/supabase/rollback/0334-…down.sql` — drops the two functions. |
| #2725 | Five nullable columns on `transactions` (`outstanding`, `cleared_on`, `pending`, `source`, `doc_id`), staged in `infra/supabase/proposed/` — **not** in `migrations-auto/`, so merging #2725 applies nothing. | `infra/supabase/proposed/money-1-4-transaction-ledger-fields.down.sql` — drops exactly those five columns. |

## 1. Before applying: every line must hold

| Check | Where it is read | Ready when |
|---|---|---|
| Database access | The NAS applies merged migrations on its own clock (`replay-on-clock.sh`, DR-1269); the proof is read over poetech.us (DR-1398). | Always: no key is involved. |
| A confirmed backup | `money-readiness.yml` (keyless, daily and on demand) or the app's `lib/money-readiness.js`, both reading `money_readiness_receipt()` | A verified dump within **36 h** |
| A restore that works | Same receipt: the weekly restore drill (`db_backup.sh`, DR-1113) restores the dump into a scratch database and compares counts | Drill **passed** within **8 days** |
| The migration is tested | CI: `scripts/money-migration-replay.sh` (#2725) and `scripts/readiness-receipt-replay.sh` (#2727) run on a throwaway PostgreSQL inside the required test job — applied twice, existing values fingerprinted unchanged, rollback applied and proven | Required check green on the PR's head |
| The rollback is ready | The `.down.sql` beside each migration, applied in the same replay | Proven in the replay |
| Approval | Christina | Her explicit word on that PR |

**Order matters for #2727:** 0334 is what *publishes* the backup verdict, so
the first readiness reading exists only after 0334 is applied. 0334 is
read-only and its rollback is two `DROP FUNCTION`s, so it is the safe one to
go first; the `transactions` columns (#2725) wait until the readiness witness
reads green.

## 2. Applying

1. Christina approves the PR.
2. Merge. For #2725 the column migration is moved from `infra/supabase/proposed/`
   into `infra/supabase/migrations-auto/` under the next free number, in its own
   approved PR — merging #2725 itself applies nothing.
3. The NAS pulls `main` and applies the file within one services-sync cycle
   (about 15 minutes). Nobody's hand is involved.

## 3. Verifying

- `db-migrate.yml` / `served-migration-receipt.py` report the file as applied (DR-1398).
- Dispatch `money-readiness.yml`: after 0334 it prints the backup and drill
  verdict; after the column migration it lists the five columns as present.
- Open Money on a phone: balances read exactly as before (every new column is
  NULL on every existing row, which the engine treats as unmarked).

## 4. Rolling back (preferred: the same road, forward)

Migrations here are forward-only, so an undo is a **new migration**:

1. Copy the `.down.sql` into `infra/supabase/migrations-auto/` under the next
   free number, in its own PR.
2. Christina approves; merge; the NAS applies it on its next cycle.
3. Verify as in section 3: the functions or columns are gone.

What is lost: for 0334, nothing (two functions). For the columns, any values
written into them since they were applied — none until a screen writes them.

## 5. Restoring from the backup (last resort)

**What is proven:** every week the nightly dump is restored into a scratch
database (`poetech_restore_drill`) and its counts compared with the live
database; the receipt says when that last passed.

**What is NOT yet proven, stated plainly:** replacing the *live* database with
a restored dump has never been rehearsed on this NAS. It would also discard
every write since the dump. It is not needed for either Money migration — both
have a tested forward rollback — and it is not to be improvised. If it is ever
needed, it is Darrell's decision, on the box (his own SSH, DR-1159 road 2),
after restoring into a scratch database first and comparing it with the live
one, exactly as the weekly drill does.

**Gap, recorded:** a rehearsed in-place restore procedure. re-review: 2026-12-02.
