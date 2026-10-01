#!/usr/bin/env bash
# =============================================================================
# lesson-builder-status.sh -- gather what the bell and the status step print
# (DR-0725). Read-only. Never a body.
# =============================================================================
# Darrell 2026-10-01, of a lesson showing "building": "how long?" Nothing
# outside the NAS could see the lesson builder's progress. This gathers, into
# the directory given (default .), through the existing NAS road
# (scripts/live-sql.sh: tailnet -> ssh -> psql) and gh:
#   rows.txt      the lesson rows in flight (scripts/lesson-inbox-progress.sql)
#   versions.txt  each writer's gate result per build (lesson-builder-versions.sql)
#   service.json  lesson_builder_settings.service_status (what the service saw)
#   recent.txt    every lesson row made in the last day, any state
#   prs.json      the lesson PRs (claude/lesson-l*), for "shipped with PR"
# With --nas it also prints the service's systemd state and status.json.
# The runner must already have joined the tailnet; NAS_SSH_KEY and GH_TOKEN set.
# Exit 1 only when the rows cannot be read (the bell must not guess).
# =============================================================================
set -uo pipefail
OUT="${1:-.}"
NAS=""
[ "${2:-}" = "--nas" ] && NAS=1
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$OUT"

bash "$HERE/live-sql.sh" '|' < "$HERE/lesson-inbox-progress.sql" > "$OUT/rows.txt" \
  || { echo "::error::could not read the lesson rows from the live database"; exit 1; }
bash "$HERE/live-sql.sh" '|' < "$HERE/lesson-inbox-recent.sql" > "$OUT/recent.txt" 2>/dev/null \
  || { echo "recent: not read"; : > "$OUT/recent.txt"; }
bash "$HERE/live-sql.sh" '|' < "$HERE/lesson-builder-versions.sql" > "$OUT/versions.txt" 2>/dev/null \
  || { echo "versions: not read (lesson_versions unreachable)"; : > "$OUT/versions.txt"; }
printf '%s' "SELECT coalesce(service_status::text, 'null') FROM public.lesson_builder_settings WHERE id = 1;" \
  | bash "$HERE/live-sql.sh" '|' > "$OUT/service.json" 2>/dev/null \
  || echo null > "$OUT/service.json"
[ -s "$OUT/service.json" ] || echo null > "$OUT/service.json"
if [ -n "${GH_TOKEN:-}" ] && [ -n "${REPO:-}" ]; then
  gh pr list -R "$REPO" --state all --limit 100 --json number,url,headRefName,state \
    --jq '[.[] | select(.headRefName | startswith("claude/lesson-l"))]' > "$OUT/prs.json" 2>/dev/null \
    || echo '[]' > "$OUT/prs.json"
else
  echo '[]' > "$OUT/prs.json"
fi
echo "rows in flight: $(grep -c . "$OUT/rows.txt" || true); versions: $(grep -c . "$OUT/versions.txt" || true); lesson PRs: $(jq length "$OUT/prs.json" 2>/dev/null || echo 0)"

if [ -n "$NAS" ]; then
  echo "== the NAS lesson builder service =="
  K=$(mktemp); printf '%s\n' "$NAS_SSH_KEY" > "$K"; chmod 600 "$K"
  ssh -i "$K" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -o BatchMode=yes -o LogLevel=ERROR \
    "${NAS_HOST:-dpoe@poetech.tail5a2f35.ts.net}" \
    'echo "systemd: $(systemctl is-active poetech-lesson-builder 2>&1)"; echo "code: $(cat /volume1/PoeTech/lesson-builder/.code.sha 2>/dev/null)"; echo "status.json:"; cat /volume1/PoeTech/lesson-builder/status.json 2>/dev/null || echo "(none)"; echo; echo "running builds:"; ls -1 /volume1/PoeTech/lesson-builder/locks 2>/dev/null || echo "(none)"' \
    || echo "the NAS did not answer over ssh"
  rm -f "$K"
fi
exit 0
