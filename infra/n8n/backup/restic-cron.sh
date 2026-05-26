#!/bin/bash
# =============================================================================
# restic-cron.sh — daily Restic backup of the n8n stack
# =============================================================================
# Locked decision (PARALLEL-FRAMEWORKS-EVAL.md, 2026-05-25):
#   Storage: /volume1/backups (local) + monthly USB rotate. $0/mo perpetual.
#   No cloud backup target — keeps cost at zero and data on Darrell's hardware.
#
# WHAT THIS BACKS UP:
#   /volume1/docker/n8n-stack/   — n8n SQLite, workflows, credentials, ntfy
#                                  cache, Ollama model store
#
# DESTINATION:
#   /volume1/backups/restic-n8n  — Restic repo (init on first run)
#
# WHAT IT DOES NOT BACK UP:
#   - The Ollama model files (Ollama can re-pull from upstream; only the model
#     list is worth preserving, and that lives inside the n8n stack volume
#     anyway). Excluding the actual model weights cuts backup size 90%+.
#   - Anything outside /volume1/docker/n8n-stack/.
#
# SCHEDULE (configure in DSM Control Panel -> Task Scheduler):
#   Run daily at 03:00 America/Chicago
#   User: root (needs read of /volume1/docker/n8n-stack)
#   Command: /volume1/docker/n8n-stack/restic-cron.sh
#
# MONTHLY USB ROTATE (manual, takes 2 minutes):
#   1. Plug external USB drive into the Synology.
#   2. SSH in: ssh admin@<tailscale-ip>
#   3. Sync the Restic repo to the USB:
#        sudo rsync -avP --delete /volume1/backups/restic-n8n/ /volumeUSB1/usbshare/restic-n8n/
#   4. Eject the USB. Store offsite.
#
# RESTORE:
#   sudo restic -r /volume1/backups/restic-n8n restore latest --target /tmp/restore
#   Then sudo docker compose down, sudo rsync -av /tmp/restore/volume1/docker/n8n-stack/ /volume1/docker/n8n-stack/, sudo docker compose up -d
#
# Self-installs restic if not present (binary is ~25 MB, single static file).
# =============================================================================

set -euo pipefail

# Configuration ---------------------------------------------------------------
REPO="/volume1/backups/restic-n8n"
SOURCE="/volume1/docker/n8n-stack"
PASSWORD_FILE="/volume1/docker/n8n-stack/.restic-password"
RETENTION_DAILY=14
RETENTION_WEEKLY=8
RETENTION_MONTHLY=12
LOG="/var/log/restic-n8n-cron.log"

# Logging helper --------------------------------------------------------------
log() {
  echo "$(date -Iseconds) $*" | tee -a "$LOG"
}

log "=== restic-cron starting ==="

# Ensure restic is installed --------------------------------------------------
if ! command -v restic >/dev/null 2>&1; then
  log "restic not found — installing to /usr/local/bin/restic"
  TMP=$(mktemp -d)
  cd "$TMP"
  # Latest stable release as of 2026-05; pin a version once a release process exists.
  RESTIC_URL="https://github.com/restic/restic/releases/latest/download/restic_linux_amd64.bz2"
  curl -fsSL "$RESTIC_URL" -o restic.bz2
  bunzip2 restic.bz2
  chmod +x restic
  mv restic /usr/local/bin/restic
  cd - >/dev/null
  rm -rf "$TMP"
  log "restic installed: $(restic version)"
fi

# Ensure the password file exists (auto-generate on first run) ----------------
if [ ! -f "$PASSWORD_FILE" ]; then
  log "generating restic repo password at $PASSWORD_FILE"
  mkdir -p "$(dirname "$PASSWORD_FILE")"
  head -c 32 /dev/urandom | base64 > "$PASSWORD_FILE"
  chmod 600 "$PASSWORD_FILE"
  log "*** WRITE THIS PASSWORD DOWN — losing it loses every backup ***"
  log "*** $(cat "$PASSWORD_FILE") ***"
fi

# Ensure the repo exists ------------------------------------------------------
if [ ! -d "$REPO" ] || [ ! -f "$REPO/config" ]; then
  log "initializing restic repo at $REPO"
  mkdir -p "$REPO"
  restic -r "$REPO" -p "$PASSWORD_FILE" init
fi

# Backup ----------------------------------------------------------------------
log "starting backup of $SOURCE"
restic -r "$REPO" -p "$PASSWORD_FILE" backup "$SOURCE" \
  --exclude "$SOURCE/ollama/models/blobs/*" \
  --tag daily \
  --tag n8n-stack \
  | tee -a "$LOG"

# Prune old snapshots ---------------------------------------------------------
log "pruning per retention policy ($RETENTION_DAILY/$RETENTION_WEEKLY/$RETENTION_MONTHLY)"
restic -r "$REPO" -p "$PASSWORD_FILE" forget \
  --keep-daily "$RETENTION_DAILY" \
  --keep-weekly "$RETENTION_WEEKLY" \
  --keep-monthly "$RETENTION_MONTHLY" \
  --prune \
  | tee -a "$LOG"

# Integrity check (cheap subset; full check monthly via a separate task) ------
log "running quick integrity check"
restic -r "$REPO" -p "$PASSWORD_FILE" check --read-data-subset=1% \
  | tee -a "$LOG" \
  || log "*** integrity check FAILED — investigate ***"

log "=== restic-cron complete ==="
