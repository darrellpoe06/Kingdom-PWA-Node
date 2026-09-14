#!/usr/bin/env bash
# =============================================================================
# push-outbox-drain-over-tailnet — deliver queued office fault pushes (DR-0400)
# =============================================================================
# SHIPPED INACTIVE. The workflow that calls this (push-outbox-drain.yml) runs
# only when PUSH_OUTBOX_DRAIN_ENABLED == 'true'; this script is the body that
# runs once armed. It reads pending push_outbox rows on the SOVEREIGN database
# (the one the app uses, DR-0310), resolves each instance's owner/admin user
# ids, calls the existing push-send `fault` path (an explicit office audience,
# never broadcast — push-send-policy.js), and stamps sent_at on a 2xx.
#
# Transport is the one sovereign-read/sovereign-replay already use: tailnet ->
# ssh -> docker exec psql. Nothing new is trusted. Best-effort per row: one
# failed send never blocks the rest and never loses the row (sent_at stays null,
# the next run retries; attempts is bumped so a poison row is visible).
# =============================================================================
set -uo pipefail

MAX_DRAIN="${MAX_DRAIN:-25}"
PUSH_SEND_URL="${PUSH_SEND_URL:-https://poetech.us/api/push-send}"
NAS_HOST="${NAS_HOST:-dpoe@poetech.tail5a2f35.ts.net}"
NAS_ENV="${NAS_ENV:-/volume1/docker/supabase/.env}"

say() { echo "$1"; [ -n "${GITHUB_STEP_SUMMARY:-}" ] && echo "$1" >> "$GITHUB_STEP_SUMMARY"; }

if [ -z "${NAS_SSH_KEY:-}" ]; then
  say "## push-outbox drain — NOT RUN (NAS_SSH_KEY unset)"; echo "::error::NAS_SSH_KEY missing"; exit 2
fi
case "$MAX_DRAIN" in ''|*[!0-9]*) echo "::error::MAX_DRAIN must be a whole number"; exit 2 ;; esac

umask 077
KEYFILE="$(mktemp)"; printf '%s\n' "$NAS_SSH_KEY" > "$KEYFILE"; trap 'rm -f "$KEYFILE"' EXIT
SSH="ssh -i $KEYFILE -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -o BatchMode=yes -o LogLevel=ERROR $NAS_HOST"
if ! $SSH 'echo ok' 2>/dev/null | grep -q ok; then
  say "## push-outbox drain — NAS UNREACHABLE"; echo "::error::NAS unreachable"; exit 3
fi

# One psql helper on the NAS, the same shape sovereign-read uses.
remote_psql() {
  local sql="$1"
  $SSH "NAS_ENV='$NAS_ENV' bash -s" <<REMOTE 2>/dev/null
set -u
PW=\$(sed -n 's/^POSTGRES_PASSWORD=//p' "$NAS_ENV" 2>/dev/null | tr -d '[:space:]')
[ -n "\$PW" ] || PW=\$(sudo -n sed -n 's/^POSTGRES_PASSWORD=//p' "$NAS_ENV" 2>/dev/null | tr -d '[:space:]')
DOCKER=\$(command -v docker 2>/dev/null || echo /usr/local/bin/docker)
"\$DOCKER" exec -e PGPASSWORD="\$PW" supabase-db psql -h 127.0.0.1 -U supabase_admin -d postgres -t -A -c "$sql" 2>/dev/null \
  || sudo -n "\$DOCKER" exec -e PGPASSWORD="\$PW" supabase-db psql -h 127.0.0.1 -U supabase_admin -d postgres -t -A -c "$sql" 2>/dev/null
REMOTE
}

# Pending rows + each instance's office (owner/admin) user ids, as one JSON blob.
PENDING="$(remote_psql "SELECT coalesce(json_agg(row_to_json(r)), '[]')::text FROM (
  SELECT o.id, o.instance_id, o.fault_id, o.title, o.body,
         (SELECT coalesce(json_agg(m.user_id), '[]'::json) FROM instance_members m
           WHERE m.instance_id = o.instance_id AND m.role IN ('owner','admin')) AS user_ids
    FROM public.push_outbox o
   WHERE o.sent_at IS NULL
   ORDER BY o.created_at
   LIMIT ${MAX_DRAIN}) r")"

COUNT="$(printf '%s' "$PENDING" | jq 'length' 2>/dev/null || echo 0)"
say "## push-outbox drain — ${COUNT:-0} pending (cap ${MAX_DRAIN})"
[ "${COUNT:-0}" = "0" ] && exit 0

sent=0; failed=0
for i in $(seq 0 $((COUNT-1))); do
  row="$(printf '%s' "$PENDING" | jq -c ".[$i]")"
  id="$(printf '%s' "$row" | jq -r '.id')"
  inst="$(printf '%s' "$row" | jq -r '.instance_id')"
  fault="$(printf '%s' "$row" | jq -r '.fault_id')"
  noffice="$(printf '%s' "$row" | jq '.user_ids | length')"
  # No office to tell = not a delivery failure; mark sent so it does not retry forever.
  if [ "${noffice:-0}" = "0" ]; then
    remote_psql "UPDATE public.push_outbox SET sent_at=now(), attempts=attempts+1 WHERE id='${id}'" >/dev/null
    continue
  fi
  payload="$(printf '%s' "$row" | jq -c '{topic:"fault", instanceId:.instance_id, faultId:.fault_id, userIds:.user_ids, title:.title, body:.body}')"
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 -X POST "$PUSH_SEND_URL" \
    -H 'content-type: application/json' \
    ${PUSH_SEND_TOKEN:+-H "authorization: Bearer ${PUSH_SEND_TOKEN}"} \
    -d "$payload" 2>/dev/null || echo 000)"
  case "$code" in
    2*) remote_psql "UPDATE public.push_outbox SET sent_at=now(), attempts=attempts+1 WHERE id='${id}'" >/dev/null; sent=$((sent+1)) ;;
    *)  remote_psql "UPDATE public.push_outbox SET attempts=attempts+1 WHERE id='${id}'" >/dev/null; failed=$((failed+1));
        echo "::warning::push-send returned $code for fault ${fault} (instance ${inst}); left pending for retry" ;;
  esac
done
say "- sent ${sent}, failed ${failed}"
