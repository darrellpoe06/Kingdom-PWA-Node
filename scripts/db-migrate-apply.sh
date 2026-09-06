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

FAILED=0; applied=0; skipped=0; failedn=0
for f in $(printf '%s\n' "${files[@]}" | sort); do
  base=$(basename "$f")
  sum=$(sha256sum "$f" | cut -d' ' -f1)
  prev=$(psql "$DBURL" -Atc "SELECT checksum FROM public._schema_migrations WHERE filename='$base' AND status='applied'" 2>/dev/null || echo "")
  if [ "$prev" = "$sum" ]; then
    echo "skip (unchanged) $base"; skipped=$((skipped+1)); continue
  fi
  echo "=== applying $base ==="
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
