#!/usr/bin/env bash
# money-census.sh -- TEMPORARY, READ-ONLY. One line for Darrell's phone: fetches
# scripts/money-records-read.sql from this branch and runs it inside the NAS's
# own supabase-db with psql. The SQL opens with BEGIN READ ONLY, so Postgres
# itself refuses any write; this wrapper also refuses to run a body that does
# not start with the census header or that carries a write verb. Output goes to
# the terminal only (balances rounded to $100, payments to $10). Approved by
# Darrell 2026-11-05; deleted with the SQL after the pass.
set -u
BR="ccr-055dea31-qi5vfm"
SQL_URL="https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/$BR/scripts/money-records-read.sql"
ENV_FILE="/volume1/docker/supabase/.env"
D=$(command -v docker 2>/dev/null || true)
[ -n "$D" ] || for c in /usr/local/bin/docker /usr/bin/docker; do [ -x "$c" ] && D="$c" && break; done
[ -n "$D" ] || { echo "money-census: docker not found"; exit 4; }
SQL=$(curl -fsSL "$SQL_URL") || { echo "money-census: could not fetch the SQL"; exit 5; }
case "$SQL" in "-- money-records-read.sql"*) ;; *) echo "money-census: unexpected SQL body, refusing"; exit 6 ;; esac
printf '%s\n' "$SQL" | grep -Eiq '^[[:space:]]*(insert|update|delete|alter|drop|create|truncate|grant|copy)[[:space:]]' && { echo "money-census: SQL carries a write verb, refusing"; exit 7; }
printf '%s\n' "$SQL" | grep -q '^BEGIN READ ONLY;' || { echo "money-census: SQL is not read-only, refusing"; exit 8; }
PW=$(sudo sed -n 's/^POSTGRES_PASSWORD=//p' "$ENV_FILE" | tr -d '[:space:]')
[ -n "$PW" ] || { echo "money-census: could not read the database password (sudo refused?)"; exit 3; }
printf '%s\n' "$SQL" | sudo "$D" exec -i -e PGPASSWORD="$PW" supabase-db \
  psql -h 127.0.0.1 -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -At -F '|' -f -
rc=$?
unset PW
[ "$rc" -eq 0 ] && echo "money-census: done (read-only)"
exit "$rc"
