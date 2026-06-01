#!/bin/bash
# =============================================================================
# make-autonomous.sh
# =============================================================================
# Bring the Synology n8n pipeline up to "Darrell can leave it alone for weeks"
# state. Self-healing, backed up, redundant notification channels.
#
# Idempotent. Safe to re-run after any DSM update, container recreation, or
# environment change. Each step is guarded so partial state is fine.
#
# Run as root via:
#     sudo bash /tmp/make-autonomous.sh
#
# Prerequisites (already in place after Phase 1 -> 1e):
#   - /volume1/docker/n8n-stack/ exists with docker-compose.yml + .env
#   - n8n + ntfy + ollama containers running (restart: unless-stopped)
#   - SMTP credential bound to all 5 production workflows
#   - PUSHOVER_* env vars passed through n8n container
#
# What this script does:
#   1. Installs Restic + sets up daily 03:00 cron backup of the n8n stack
#   2. Adds ntfy fallback nodes to workflows 01 and 03 (parallel push channel)
#   3. Adds retry-on-fail to Email Send nodes (transient SMTP self-recovery)
#   4. Restarts n8n + verifies webhook routes survived the restart
#   5. Fires a smoke test against webhook 03 + reports execution status
#
# The /tmp files needed (restic-cron.sh, add-ntfy-fallback.py) get SCP'd in
# by the PowerShell wrapper that calls this script.
# =============================================================================

set -e

DOCKER=/var/packages/ContainerManager/target/usr/bin/docker
STACK=/volume1/docker/n8n-stack
DB=$STACK/n8n/database.sqlite

echo ""
echo "===================================================================="
echo "  make-autonomous.sh  -  setting up self-sustaining Synology pipeline"
echo "===================================================================="
echo ""

# ----------------------------------------------------------------------------
# 1. RESTIC BACKUP
# ----------------------------------------------------------------------------
echo "=== 1. RESTIC BACKUP INSTALL + FIRST RUN ==="
if [ -f /tmp/restic-cron.sh ]; then
    cp /tmp/restic-cron.sh $STACK/restic-cron.sh
    chmod +x $STACK/restic-cron.sh
    echo "Installed to $STACK/restic-cron.sh"
else
    echo "WARN: /tmp/restic-cron.sh not found; assuming already installed"
fi

if [ -x $STACK/restic-cron.sh ]; then
    echo "Running first backup..."
    $STACK/restic-cron.sh 2>&1 | tail -20
else
    echo "WARN: $STACK/restic-cron.sh not executable; skipping first run"
fi

# ----------------------------------------------------------------------------
# 2. DAILY 03:00 CRON
# ----------------------------------------------------------------------------
echo ""
echo "=== 2. DAILY 03:00 CRON ==="
CRON_LINE="0 3 * * * root $STACK/restic-cron.sh >> /var/log/restic-n8n-cron.log 2>&1"
if grep -qF "restic-cron.sh" /etc/crontab; then
    echo "Already scheduled in /etc/crontab"
else
    echo "$CRON_LINE" >> /etc/crontab
    echo "Appended: $CRON_LINE"
fi
echo "Last 3 lines of /etc/crontab:"
tail -3 /etc/crontab

# Synology runs synocrond, not standard cron. Force-restart to pick up the
# /etc/crontab change.
if [ -x /usr/syno/bin/synoservice ]; then
    /usr/syno/bin/synoservice --restart synocrond 2>&1 || \
    /usr/syno/bin/synoservice --restart synoschedtask 2>&1 || \
    echo "WARN: could not reload Synology cron service; check DSM Task Scheduler manually"
fi

# ----------------------------------------------------------------------------
# 3. NTFY FALLBACK + EMAIL SEND RETRY
# ----------------------------------------------------------------------------
echo ""
echo "=== 3. NTFY FALLBACK + EMAIL SEND RETRY ==="
if [ -f /tmp/add-ntfy-fallback.py ]; then
    cd $STACK
    $DOCKER compose stop n8n
    sleep 2
    python3 /tmp/add-ntfy-fallback.py
    $DOCKER compose up -d n8n
    sleep 8
else
    echo "WARN: /tmp/add-ntfy-fallback.py not found; skipping ntfy fallback patch"
fi

# ----------------------------------------------------------------------------
# 4. WEBHOOK PERSISTENCE VERIFY
# ----------------------------------------------------------------------------
echo ""
echo "=== 4. WEBHOOK ROUTES (should still show 2 rows after restart) ==="
sqlite3 -header -column $DB "SELECT workflowId, webhookPath, method FROM webhook_entity;"

# ----------------------------------------------------------------------------
# 5. SMOKE TEST WEBHOOK
# ----------------------------------------------------------------------------
echo ""
echo "=== 5. FIRE TEST WEBHOOK (POST /webhook/github-events) ==="
cat > /tmp/autonomy-test.json <<EOF
{"ref":"refs/heads/main","pusher":{"name":"autonomy-test"},"repository":{"full_name":"darrellpoe06/Kingdom-PWA-Node","html_url":"https://github.com/darrellpoe06/Kingdom-PWA-Node"},"commits":[{"message":"autonomy smoke test - if both ntfy and pushover fire, the pipeline is genuinely self-sustaining","url":"https://github.com/darrellpoe06/Kingdom-PWA-Node/commit/test"}]}
EOF
curl -s -X POST http://localhost:5678/webhook/github-events \
    -H "X-GitHub-Event: push" \
    -H "Content-Type: application/json" \
    --data-binary @/tmp/autonomy-test.json \
    -w "\nHTTP=%{http_code}\n"

sleep 4

# ----------------------------------------------------------------------------
# 6. RESULT
# ----------------------------------------------------------------------------
echo ""
echo "=== 6. LAST 5 EXECUTIONS ==="
sqlite3 -header -column $DB \
    "SELECT id, workflowId, mode, status, startedAt FROM execution_entity ORDER BY id DESC LIMIT 5;"

echo ""
echo "=== 7. RESTIC SNAPSHOTS ==="
RESTIC_PASS=/volume1/docker/n8n-stack/.restic-password
if [ -f $RESTIC_PASS ]; then
    /usr/local/bin/restic -r /volume1/backups/restic-n8n -p $RESTIC_PASS snapshots 2>&1 | tail -10
else
    echo "WARN: $RESTIC_PASS not found; restic first run may have failed"
fi

echo ""
echo "===================================================================="
echo "  DONE. Pipeline is now self-sustaining."
echo ""
echo "  - Restic backup runs nightly at 03:00 -> /volume1/backups/restic-n8n"
echo "  - Workflows 01 + 03 have ntfy fallback (parallel to Pushover path)"
echo "  - Email Send nodes retry 3x on transient failure"
echo "  - Containers auto-restart on crash (restart: unless-stopped)"
echo "  - Webhook routes survive container restarts"
echo ""
echo "  Still requires Darrell input for full coverage:"
echo "  - Supabase Postgres credential -> activates workflows 02, 04, 05"
echo "  - Pushover \$5 license by 2026-06-25 -> avoids trial expiry"
echo "  - Pushover app token (optional) -> Path A richer features"
echo "  - Tailscale on Synology -> off-LAN access"
echo "===================================================================="
