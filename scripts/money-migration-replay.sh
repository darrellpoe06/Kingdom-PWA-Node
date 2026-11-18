#!/usr/bin/env bash
# money-migration-replay.sh — prove the proposed FOS Money Phase 1.4 migration
# on a THROWAWAY PostgreSQL before anyone applies it to the live database.
#
#   1. starts a private PostgreSQL in a temp directory (no network port; a
#      unix socket only) and stops and deletes it on exit;
#   2. creates a stand-in `transactions` table with schema-v1's columns and
#      the later additive ones the app already reads, and fills it with rows;
#   3. fingerprints every existing column of every row;
#   4. applies the proposed migration TWICE (it must be idempotent);
#   5. proves the fingerprint is unchanged and the five new columns exist,
#      nullable, and read NULL on every existing row;
#   6. applies the down file and proves the five columns are gone and the
#      fingerprint is still unchanged.
# Touches nothing outside its temp directory. Never connects to any other
# database. Exit 0 only when every step holds.
#
# Usage: bash scripts/money-migration-replay.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UP="$ROOT/infra/supabase/proposed/money-1-4-transaction-ledger-fields.sql"
DOWN="$ROOT/infra/supabase/proposed/money-1-4-transaction-ledger-fields.down.sql"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
[ -x "$PGBIN/initdb" ] || { echo "replay: no PostgreSQL server binaries found (set PGBIN)"; exit 2; }

WORK="$(mktemp -d)"
RUN=()
if [ "$(id -u)" = "0" ]; then
  chown postgres "$WORK"
  cp "$UP" "$DOWN" "$WORK/" && chown postgres "$WORK"/*.sql
  RUN=(runuser -u postgres --)
else
  cp "$UP" "$DOWN" "$WORK/"
fi
UPF="$WORK/$(basename "$UP")"
DOWNF="$WORK/$(basename "$DOWN")"
cleanup() { "${RUN[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

"${RUN[@]}" "$PGBIN/initdb" -D "$WORK/data" -A trust -U replay >/dev/null
"${RUN[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -o "-c listen_addresses='' -k $WORK" -l "$WORK/log" -w start >/dev/null
q() { "${RUN[@]}" psql -h "$WORK" -U replay -d postgres -v ON_ERROR_STOP=1 -qAt "$@"; }

q <<'SQL'
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL, created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz,
  account_id uuid, txn_date date NOT NULL, amount numeric(12,2) NOT NULL,
  description text, category text, is_transfer boolean NOT NULL DEFAULT false,
  entity_override uuid, linked_to_kind text, linked_to_id uuid,
  slug text, account_slug text, entity_override_slug text,
  reconciliation jsonb, receipt jsonb
);
INSERT INTO transactions (tenant_id, created_by, account_id, txn_date, amount, description, category, reconciliation)
SELECT gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), DATE '2026-01-01' + (g % 300), round((random() * 4000 - 2000)::numeric, 2),
       'row ' || g, (ARRAY['groceries','charitable','transfer','other','balance-checkpoint'])[1 + g % 5],
       CASE WHEN g % 50 = 0 THEN jsonb_build_object('balance', g * 10.5) END
FROM generate_series(1, 2000) g;
SQL

FP="SELECT md5(string_agg(t::text, '|' ORDER BY id)) FROM (SELECT id, tenant_id, created_by, created_at, updated_at, account_id, txn_date, amount, description, category, is_transfer, entity_override, linked_to_kind, linked_to_id, slug, account_slug, entity_override_slug, reconciliation, receipt FROM transactions) t"
before="$(q -c "$FP")"
count_before="$(q -c 'SELECT count(*) FROM transactions')"

q -f "$UPF"
q -f "$UPF"   # idempotent: a second apply is a no-op
echo "replay: applied twice"

after="$(q -c "$FP")"
[ "$before" = "$after" ] || { echo "replay: FAIL existing values changed"; exit 1; }
[ "$count_before" = "$(q -c 'SELECT count(*) FROM transactions')" ] || { echo "replay: FAIL row count changed"; exit 1; }

cols="$(q -c "SELECT string_agg(column_name || ':' || data_type || ':' || is_nullable, ',' ORDER BY column_name) FROM information_schema.columns WHERE table_name='transactions' AND column_name IN ('outstanding','cleared_on','pending','source','doc_id')")"
want="cleared_on:date:YES,doc_id:text:YES,outstanding:boolean:YES,pending:boolean:YES,source:text:YES"
[ "$cols" = "$want" ] || { echo "replay: FAIL columns are '$cols', want '$want'"; exit 1; }
nonnull="$(q -c 'SELECT count(*) FROM transactions WHERE outstanding IS NOT NULL OR cleared_on IS NOT NULL OR pending IS NOT NULL OR source IS NOT NULL OR doc_id IS NOT NULL')"
[ "$nonnull" = "0" ] || { echo "replay: FAIL $nonnull existing rows got a value"; exit 1; }
echo "replay: $count_before rows unchanged; five nullable columns added, NULL on every existing row"

q -f "$DOWNF"
left="$(q -c "SELECT count(*) FROM information_schema.columns WHERE table_name='transactions' AND column_name IN ('outstanding','cleared_on','pending','source','doc_id')")"
[ "$left" = "0" ] || { echo "replay: FAIL down left $left columns"; exit 1; }
[ "$before" = "$(q -c "$FP")" ] || { echo "replay: FAIL down changed existing values"; exit 1; }
echo "replay: down file removes exactly the five columns; existing values unchanged"
echo "replay: OK"
