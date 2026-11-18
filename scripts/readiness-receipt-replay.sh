#!/usr/bin/env bash
# readiness-receipt-replay.sh — prove migration 0334 on a THROWAWAY PostgreSQL:
# db_backup_receipt() and money_readiness_receipt() give anon only whitelisted
# facts, and anon still cannot read a single row of any table.
#
# A private PostgreSQL in a temp directory (unix socket only, deleted on exit);
# stand-in tables with the columns 0334 reads; a hostile backup row planted
# (a file name, a host path, error words, an extra key, a forged drill verdict)
# and a NEWER row a member could write (wrong source) that must be ignored.
# Exit 0 only when every check holds.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIG="$ROOT/infra/supabase/migrations-auto/0334-the-house-says-its-backup-and-the-books-readiness.sql"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
[ -x "$PGBIN/initdb" ] || { echo "replay: no PostgreSQL server binaries found (set PGBIN)"; exit 2; }
WORK="$(mktemp -d)"
RUN=()
if [ "$(id -u)" = "0" ]; then chown postgres "$WORK"; RUN=(runuser -u postgres --); fi
cp "$MIG" "$WORK/m.sql"; [ "${#RUN[@]}" -gt 0 ] && chown postgres "$WORK/m.sql"
cleanup() { "${RUN[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT
"${RUN[@]}" "$PGBIN/initdb" -D "$WORK/data" -A trust -U replay >/dev/null
"${RUN[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -o "-c listen_addresses='' -k $WORK" -l "$WORK/log" -w start >/dev/null
q() { "${RUN[@]}" psql -h "$WORK" -U replay -d postgres -v ON_ERROR_STOP=1 -qAt "$@"; }

q <<'SQL'
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
CREATE TABLE agent_inbox (id serial PRIMARY KEY, body text, tags jsonb, source text, created_at timestamptz DEFAULT now());
CREATE TABLE transactions (id serial PRIMARY KEY, amount numeric, description text, category text, linked_to_kind text, linked_to_id uuid, entity_override uuid);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
INSERT INTO transactions (amount, description, category) VALUES (-2200.88, 'CHECK 9879', 'other');
INSERT INTO agent_inbox (body, tags, source, created_at) VALUES
 ('{"seen":true,"readable":true,"ok":true,"at":"2026-11-17T08:00:00+00:00","bytes":123456789,"toc_entries":4321,"kept":14,
   "file":"poetech-2026-11-17.dump","path":"/volume1/PoeTech/backups/db","host":"poetech",
   "drill":{"verdict":"passed","users":7,"users_live":7,"tables":210,"tables_live":210,"note":"Jane Doe"},
   "last_drill_at":"2026-11-16T08:05:00+00:00","error":"psql: could not connect to server at 192.168.1.26","secret":"sk-live-123"}',
  '["db-backup-receipt","lesson-captured"]', 'nas-loops', now() - interval '2 hours'),
 ('{"ok":true,"drill":{"verdict":"passed"},"at":"2099-01-01T00:00:00Z"}', '["db-backup-receipt"]', 'member', now());
SQL
q -f "$WORK/m.sql"
q -f "$WORK/m.sql"   # idempotent
echo "replay: 0334 applied twice"

RECEIPT="$(q -c "SET ROLE anon; SELECT public.money_readiness_receipt()::text;")"
echo "$RECEIPT" | python3 -c '
import json, sys
r = json.loads(sys.stdin.read())
b = r["backup"]
assert b["seen"] and b["ok"] is True, b
assert b["at"].startswith("2026-11-17"), "the member row (wrong source) must be ignored: %s" % b["at"]
assert b["drill"] == {"verdict": "passed", "users": 7, "users_live": 7, "tables": 210, "tables_live": 210}, b["drill"]
assert "error" not in b and b["kept"] == 14 and b["toc_entries"] == 4321 and b["bytes"] == 123456789, b
allowed = {"seen", "readable", "written_at", "ok", "at", "bytes", "toc_entries", "kept", "last_drill_at", "drill", "error"}
assert set(b) <= allowed, set(b) - allowed
text = json.dumps(r)
for leak in ("dump", "volume1", "poetech", "Jane", "192.168", "sk-live", "could not connect", "2200", "CHECK 9879"):
    assert leak not in text, "LEAK: " + leak
cols = r["transactions_columns"]
assert cols["category"] and cols["linked_to_kind"] and not cols["outstanding"] and not cols["cleared_on"], cols
assert r["category_check"] is False and r["transactions_rls"] is True, r
assert r["obligations_table"] is False and r["obligation_settlements_table"] is False, r
print("replay: anon receives only whitelisted facts; no file, path, host, name, error words or money leaked")
'
if q -c "SET ROLE anon; SELECT count(*) FROM agent_inbox;" >/dev/null 2>&1; then echo "replay: FAIL anon read agent_inbox"; exit 1; fi
if q -c "SET ROLE anon; SELECT count(*) FROM transactions;" >/dev/null 2>&1; then echo "replay: FAIL anon read transactions"; exit 1; fi
echo "replay: anon still refused agent_inbox and transactions"

# The Phase 1.4 columns and a category CHECK, once present, are reported.
q -c "ALTER TABLE transactions ADD COLUMN outstanding boolean, ADD COLUMN cleared_on date; ALTER TABLE transactions ADD CONSTRAINT cat_ck CHECK (category IN ('other','tithes'));"
R2="$(q -c "SET ROLE anon; SELECT public.money_readiness_receipt()::text;")"
echo "$R2" | python3 -c '
import json, sys
r = json.loads(sys.stdin.read())
assert r["transactions_columns"]["outstanding"] and r["transactions_columns"]["cleared_on"] and r["category_check"] is True, r
print("replay: new columns and a category CHECK are reported once present")
'
q -c "DELETE FROM agent_inbox;"
R3="$(q -c "SET ROLE anon; SELECT public.db_backup_receipt()::text;")"
[ "$R3" = '{"seen": false}' ] || { echo "replay: FAIL no row must read seen:false, got $R3"; exit 1; }
echo "replay: no receipt row reads seen:false, never ok"
echo "replay: OK"
