#!/usr/bin/env bash
# ci-psql.sh — psql for the CI PostgreSQL legs: the apt road first, then the
# postgres:16 image the job already pulled for its service (DR-1435).
#
# 2026-11-11: three runs in a row, every PostgreSQL leg died in
# "Install postgresql-client" on "Temporary failure resolving
# security.ubuntu.com" before any test ran. The SQL under test never needed the
# mirror; only the client binary did. When apt cannot be reached, a psql shim
# is installed that runs the same client from the postgres:16 image through
# host networking (the service publishes 5432 on localhost), with the
# workspace and the runner temp mounted so -f paths resolve exactly as they
# do on the runner, PG* carried through, stdin passed, exit codes kept.
set -euo pipefail
# Each apt call is bounded: an unreachable mirror hangs apt for minutes, and a
# job's own timeout (2026-11-11, 10 min on the walls legs) cancelled the step
# before the fallback below ever ran. 90 s each leaves the fallback its turn.
if timeout 90 sudo apt-get update -qq && timeout 90 sudo apt-get install -y -qq postgresql-client > /dev/null; then
  exit 0
fi
echo "apt mirror unreachable; using psql from the postgres:16 image already pulled for the service"
sudo tee /usr/local/bin/psql > /dev/null <<'SH'
#!/usr/bin/env bash
# The client's output is buffered and its exit status kept apart from the
# write: a step like `psql ... 2>&1 | grep -q PASS` closes the pipe on the
# first match, and under pipefail a client still writing would report a broken
# pipe where the native client had long finished. stderr is replayed first,
# then stdout; the status is psql's own.
# docker is resolved before it is run, never assumed on the PATH (DR-0314).
DOCKER=$(command -v docker 2>/dev/null || true)
if [ -z "$DOCKER" ]; then for c in /usr/local/bin/docker /usr/bin/docker; do [ -x "$c" ] && DOCKER="$c" && break; done; fi
[ -n "$DOCKER" ] || { echo "docker binary not found (PATH, /usr/local/bin, /usr/bin)" >&2; exit 4; }
o=$(mktemp); e=$(mktemp)
"$DOCKER" run --rm -i --network host -e PGHOST -e PGUSER -e PGPASSWORD -e PGDATABASE -e PGPORT -v "$GITHUB_WORKSPACE:$GITHUB_WORKSPACE" -v "$RUNNER_TEMP:$RUNNER_TEMP" -w "$PWD" postgres:16 psql "$@" > "$o" 2> "$e"
status=$?
cat "$e" >&2 || true
cat "$o" || true
rm -f "$o" "$e"
exit $status
SH
sudo chmod +x /usr/local/bin/psql
psql -Atc 'select 1' > /dev/null
