#!/usr/bin/env bash
# db-migrate-apply.sh — resilient, idempotent forward migration runner.
#
# WHY THIS EXISTS (incident 2026-07-01): the old lane ran every .sql in one
# psql loop under `set -e` + ON_ERROR_STOP. ONE bad file (a table-name collision
# in 0055-relationship-permissions) aborted the ENTIRE step, so every migration
# BEHIND it silently never applied — 0056/0057/0058 + board_tasks all "waited"
# for a human. That is the exact class Darrell said must never wait again.
#
# WHAT CHANGED:
#   * Each migration applies in its OWN --single-transaction (atomic: a mid-file
#     error rolls that file back cleanly — no half-applied state, the thing that
#     made the incident confusing).
#   * A failing migration is RECORDED and the run CONTINUES to the next file, so
#     one poison file can never block unrelated migrations again.
#   * A `_schema_migrations` ledger records every apply (filename, checksum,
#     status, applied_at) — the receipt, and the data source for the in-app DB
#     Health panel. Unchanged files (checksum match) are skipped (fast).
#   * The run STILL exits non-zero if any file failed, so the lane goes visibly
#     RED — resilience, not silence (DR-0076: a green check must mean something).
#
# This is a DEPLOY-PATH runner (GitHub Actions on push to main / manual
# dispatch). It is NOT self-arming automation: it only runs when a human merges
# a migration or dispatches the lane — it respects the Cage.
#
# Requires: SUPABASE_DB_URL (Session pooler URI) in the environment; psql on PATH.
set -uo pipefail   # deliberately NOT -e: we handle per-file failure ourselves.

DIR="infra/supabase/migrations-auto"

DBURL=$(printf '%s' "${SUPABASE_DB_URL:-}" | tr -d '[:space:]')
if [ -z "$DBURL" ]; then
  echo "::error::SUPABASE_DB_URL secret is not set. One-time setup: Supabase Dashboard -> Connect -> Session pooler URI -> GitHub Settings -> Secrets -> Actions -> SUPABASE_DB_URL"
  exit 1
fi

# 1. Ledger table (idempotent). RLS ON with no policy = no direct client access;
#    the in-app DB Health RPC (SECURITY DEFINER, family-gated) is the only reader.
psql "$DBURL" -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS public._schema_migrations (
  filename    text PRIMARY KEY,
  checksum    text NOT NULL,
  status      text NOT NULL DEFAULT 'applied',   -- 'applied' | 'failed'
  last_error  text,
  applied_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public._schema_migrations ENABLE ROW LEVEL SECURITY;
SQL

shopt -s nullglob
files=("$DIR"/*.sql)
if [ ${#files[@]} -eq 0 ]; then echo "no migrations"; exit 0; fi

# THE LEDGER IS READ BEFORE IT IS GUESSED (2026-10-20, DR-1143).
#
# db-migrate run 39501068881 re-applied 0203 -- a file that had not changed and
# whose ledger row was fine -- because the checksum SELECT below FAILED once
# (its stderr went to /dev/null and `|| echo ""` turned the failure into an
# empty answer), and an empty answer had always meant "never applied". 0203
# defines obligation_set_lines in its 2026-07 shape; 0205 had replaced it with
# the sum rule. Re-applying 0203 alone put the OLDER body back on the live
# database, and the live-definition witness in the same job caught it:
# "obligation_set_lines -- live definition is older than 0205". Two faults, both
# closed here:
#   1. A failed read is not an empty read. ledger_checksum() retries a failed
#      SELECT (three tries, growing pause) and, if the ledger still cannot be
#      read, the run STOPS before applying anything on a guess. "no row" is
#      psql exit 0 with no output; "could not read" is a non-zero exit.
#   2. The newest definition wins. When a file applies (new, changed, or
#      re-applied) and a LATER file defines one of the same functions, that later
#      file is applied again too, in order, so a chain re-entered in the middle
#      ends on the definition the repo ships -- the same rule the isolation
#      matrix follows (newest-definition-replay-guard), now inside the runner.
# Both are proven by app/src/__tests__/the-ledger-is-read-before-it-is-guessed.test.js
# against the real script with a stub psql.
ledger_checksum() {  # $1 = filename; prints the applied checksum or nothing; returns 1 when the ledger could not be read
  local base="$1" out rc attempt
  for attempt in 1 2 3; do
    out=$(psql "$DBURL" -Atc "SELECT checksum FROM public._schema_migrations WHERE filename='$base' AND status='applied'" 2>&1); rc=$?
    if [ "$rc" -eq 0 ]; then printf '%s' "$out"; return 0; fi
    echo "::warning::ledger read failed for $base (try $attempt of 3): $(printf '%s' "$out" | tr -d '\r' | tail -c 200)" >&2
    [ "$attempt" -lt 3 ] && sleep $((attempt * 2))
  done
  return 1
}
functions_defined_by() {  # $1 = path; one function name per line
  grep -oiE 'CREATE (OR REPLACE )?FUNCTION public\.[a-z_0-9]+' "$1" | sed -E 's/.*public\.//' | tr 'A-Z' 'a-z' | sort -u
}
declare -A REDEFINED=()   # function name -> the file applied this run that defined it

FAILED=0; applied=0; skipped=0; failedn=0
for f in $(printf '%s\n' "${files[@]}" | sort); do
  base=$(basename "$f")
  sum=$(sha256sum "$f" | cut -d' ' -f1)
  if ! prev=$(ledger_checksum "$base"); then
    echo "::error::the migration ledger could not be read for $base after three tries. A file whose receipt cannot be read is NOT re-applied on a guess (re-applying an old file puts an older function body back; run 39501068881). Nothing further was applied this run; fix the connection and dispatch db-migrate again."
    echo "--- summary: applied=$applied  skipped=$skipped  failed=$failedn  stopped-at=$base ---"
    exit 1
  fi
  replay_reason=""
  if [ "$prev" = "$sum" ]; then
    for n in $(functions_defined_by "$f"); do
      if [ -n "${REDEFINED[$n]:-}" ]; then replay_reason="$n, redefined by ${REDEFINED[$n]} earlier this run"; break; fi
    done
    if [ -z "$replay_reason" ]; then
      echo "skip (unchanged) $base"; skipped=$((skipped+1)); continue
    fi
    echo "=== re-applying $base: it holds the newer definition of $replay_reason ==="
  else
    echo "=== applying $base ==="
  fi
  if out=$(psql "$DBURL" --single-transaction -v ON_ERROR_STOP=1 -f "$f" 2>&1); then
    echo "$out"
    # THE LEDGER WRITE IS PART OF THE MIGRATION, NOT A FORMALITY (2026-09-06).
    #
    # This exit status used to be unchecked, and that let the lane report GREEN
    # over an UNRECORDED migration. Real instance, twice in one day: an ordinal
    # guard in the database rejected the ledger row for 0168 and again for 0170
    # ("ordinal 0170 already used by 0170-courses-a-lesson-belongs-to-a-course.sql",
    # a file that exists in no branch of this repo). The DDL had already RUN AND
    # COMMITTED, so the schema changed; only the receipt was refused. The run
    # then printed "applied=2 skipped=180 failed=0" and exited 0.
    #
    # The consequence is not cosmetic. Without its ledger row the file has no
    # checksum to match, so it is re-applied on EVERY subsequent run forever,
    # the in-app DB Health panel is wrong about what is deployed, and the one
    # signal anybody watches says the opposite of the truth — in the exact
    # place someone looks when something is wrong. That is the shape DR-0332
    # names: a proxy for truth standing where the truth was available.
    #
    # This file's own header promises "the lane goes visibly RED — resilience,
    # not silence (DR-0076: a green check must mean something)." A rejected
    # ledger row simply was not counted as a failure. Now it is.
    if ledger_out=$(psql "$DBURL" -v ON_ERROR_STOP=1 -c \
      "INSERT INTO public._schema_migrations(filename,checksum,status,last_error,applied_at) VALUES ('$base','$sum','applied',NULL,now()) ON CONFLICT (filename) DO UPDATE SET checksum=EXCLUDED.checksum, status='applied', last_error=NULL, applied_at=now();" 2>&1); then
      applied=$((applied+1))
      for n in $(functions_defined_by "$f"); do REDEFINED[$n]="$base"; done
    else
      echo "$ledger_out"
      echo "::error::migration $base APPLIED but its LEDGER ROW WAS REJECTED. The schema changed and nothing recorded it, so this file will re-apply on every run and DB Health will misreport. Almost always a duplicate ordinal: rename the file to the next free number (see 0169's and 0171's headers for the two worked examples)."
      FAILED=1; failedn=$((failedn+1))
    fi
  else
    echo "$out"
    safe=$(printf '%s' "$out" | tr -d '\r' | tail -c 400 | sed "s/'/''/g")
    psql "$DBURL" -c \
      "INSERT INTO public._schema_migrations(filename,checksum,status,last_error,applied_at) VALUES ('$base','$sum','failed','$safe',now()) ON CONFLICT (filename) DO UPDATE SET checksum=EXCLUDED.checksum, status='failed', last_error='$safe', applied_at=now();" >/dev/null || true
    echo "::warning::migration FAILED (other migrations still applied): $base"
    FAILED=1; failedn=$((failedn+1))
  fi
done

echo "--- summary: applied=$applied  skipped=$skipped  failed=$failedn ---"
if [ "$FAILED" -ne 0 ]; then
  echo "::error::$failedn migration(s) failed; the rest still applied. See the ::warning:: lines and the _schema_migrations ledger."
  exit 1
fi
echo "all migrations applied or already up-to-date"
