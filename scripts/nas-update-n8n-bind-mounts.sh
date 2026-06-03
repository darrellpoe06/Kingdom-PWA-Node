#!/bin/sh
# nas-update-n8n-bind-mounts.sh   (NAS bash -- ConnectBot, from anywhere)
#
# 2026-06-03  L2 + L3: add the two missing Docker bind mounts to the n8n
# container so wf08/wf09/wf27 can actually read and write the family's data.
#
#   L2  /volume1/PoeTech/ChatIn          -> /data/chatin
#         wf08 writes captured Synology Chat messages here; wf09 + wf27 read them.
#         Missing today => wf08 returns 200 OK but the file lands in the
#         container's ephemeral layer and is invisible to the host and to Claude.
#         This is the silent input-visibility gap.
#   L3  /volume1/PoeTech/poetech-briefing -> /data/poetech-briefing
#         wf27 (Foundation Agent) reads its inbox here and writes responses,
#         queued-for-claude tasks, and run logs. Missing => the heartbeat beats
#         into the void.
#
# THE LOAD-BEARING FACT: a Docker bind mount is fixed at container CREATION.
# You cannot add one by `docker stop` + `docker start` -- the container must be
# RECREATED. For a Container Manager Project that means editing the
# docker-compose.yml and `docker-compose up -d`. For a standalone container
# there is no YAML; this script does NOT auto-recreate that case (reconstructing
# every original `docker run` flag by hand risks dropping one) -- it backs up the
# full spec and prints the Synology Duplicate-settings UI steps instead.
#
# SAFETY INVARIANT: the edited compose file is validated with
# `docker-compose config -q` on a COPY *before* the live container is touched.
# An invalid edit aborts with n8n still running. n8n is never left down by a bad
# edit. (If n8n were down, its UI at 192.168.1.26:5678 is unreachable and all 23
# workflows stop firing.)
#
# Run on the NAS host (NOT inside the container), from ConnectBot or any shell:
#   wget -qO- https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/scripts/nas-update-n8n-bind-mounts.sh | sudo sh
#
# Idempotent: if both mounts already exist, it reports "already present" and
# exits without stopping, editing, or recreating anything. Safe to re-run.

set -e

CONTAINER="n8n"
CHATIN_HOST="/volume1/PoeTech/ChatIn"
CHATIN_CTR="/data/chatin"
BRIEF_HOST="/volume1/PoeTech/poetech-briefing"
BRIEF_CTR="/data/poetech-briefing"
BACKUP_ROOT="/volume1/PoeTech/nas-backups/n8n-bind-mounts"
TS=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$TS"

echo "============================================================"
echo "n8n bind-mount add (L2 ChatIn + L3 poetech-briefing) -- $TS"
echo "============================================================"

# ---- 1. Resolve docker + docker-compose binaries -----------------------------
echo ""
echo "==> 1. Resolving docker / docker-compose binaries..."
if [ -x /var/packages/ContainerManager/target/usr/bin/docker ]; then
  DOCKER="/var/packages/ContainerManager/target/usr/bin/docker"
elif [ -x /usr/local/bin/docker ]; then
  DOCKER="/usr/local/bin/docker"
else
  DOCKER="docker"
fi
if [ -x /var/packages/ContainerManager/target/usr/bin/docker-compose ]; then
  COMPOSE="/var/packages/ContainerManager/target/usr/bin/docker-compose"
elif [ -x /usr/local/bin/docker-compose ]; then
  COMPOSE="/usr/local/bin/docker-compose"
else
  COMPOSE="docker-compose"
fi
echo "    docker         = $DOCKER"
echo "    docker-compose = $COMPOSE"

# Confirm the container exists at all.
if ! "$DOCKER" inspect "$CONTAINER" >/dev/null 2>&1; then
  echo "ERROR: no container named '$CONTAINER' found. Aborting."
  echo "       List containers:  $DOCKER ps -a"
  exit 1
fi

# ---- 2. Idempotency check: are both mounts already present? ------------------
echo ""
echo "==> 2. Checking current mounts (idempotency)..."
MOUNTS_JSON=$("$DOCKER" inspect "$CONTAINER" --format '{{json .Mounts}}' 2>/dev/null || echo "[]")
HAS_CHATIN=0
HAS_BRIEF=0
echo "$MOUNTS_JSON" | grep -q "\"Destination\":\"$CHATIN_CTR\"" && HAS_CHATIN=1
echo "$MOUNTS_JSON" | grep -q "\"Destination\":\"$BRIEF_CTR\"" && HAS_BRIEF=1
echo "    $CHATIN_CTR present: $HAS_CHATIN"
echo "    $BRIEF_CTR present: $HAS_BRIEF"
if [ "$HAS_CHATIN" = "1" ] && [ "$HAS_BRIEF" = "1" ]; then
  echo ""
  echo "==> Both mounts already present. Nothing to do. (idempotent no-op)"
  echo "    Verify L3 readability:  $DOCKER exec $CONTAINER ls -la $BRIEF_CTR/"
  exit 0
fi

# ---- 3. Pre-create host directories as uid 1000 (the n8n container user) -----
# If a bind source does not exist when the container starts, Docker creates it
# owned by root and the uid-1000 n8n process cannot write -- reproducing the
# "succeeds but nothing lands" symptom for a different reason. Pre-create as 1000.
echo ""
echo "==> 3. Pre-creating host directories (owned 1000:1000)..."
mkdir -p \
  "$CHATIN_HOST" \
  "$BRIEF_HOST/inbox" \
  "$BRIEF_HOST/responses" \
  "$BRIEF_HOST/queued-for-claude" \
  "$BRIEF_HOST/agent-log"
chown -R 1000:1000 "$CHATIN_HOST" "$BRIEF_HOST"
echo "    Created + chowned: $CHATIN_HOST  and  $BRIEF_HOST/{inbox,responses,queued-for-claude,agent-log}"

# ---- 4. Back up the container spec BEFORE any mutation -----------------------
echo ""
echo "==> 4. Backing up container spec to $BACKUP_DIR ..."
mkdir -p "$BACKUP_DIR"
"$DOCKER" inspect "$CONTAINER" > "$BACKUP_DIR/n8n-inspect.json"
echo "    Wrote $BACKUP_DIR/n8n-inspect.json   (full pre-change spec)"

# ---- 5. Detect topology: compose Project vs standalone Container -------------
echo ""
echo "==> 5. Detecting deployment topology (compose Project vs standalone)..."
COMPOSE_FILE=$("$DOCKER" inspect "$CONTAINER" \
  --format '{{ index .Config.Labels "com.docker.compose.project.config_files" }}' 2>/dev/null || echo "")
COMPOSE_PROJECT=$("$DOCKER" inspect "$CONTAINER" \
  --format '{{ index .Config.Labels "com.docker.compose.project" }}' 2>/dev/null || echo "")
COMPOSE_WORKDIR=$("$DOCKER" inspect "$CONTAINER" \
  --format '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}' 2>/dev/null || echo "")

if [ -z "$COMPOSE_FILE" ] || [ ! -f "$COMPOSE_FILE" ]; then
  # -------------------- STANDALONE CONTAINER PATH --------------------
  echo "    No compose config file found via labels."
  echo "    => n8n appears to be a STANDALONE container, not a Container Manager Project."
  echo ""
  echo "============================================================"
  echo "MANUAL STEP REQUIRED (standalone container)"
  echo "============================================================"
  echo "A bind mount cannot be added to a standalone container without recreating"
  echo "it, and this script will NOT auto-reconstruct your docker run flags (too"
  echo "easy to drop one). Add the two mounts via Synology Container Manager UI:"
  echo ""
  echo "  1. Container Manager -> Container -> select '$CONTAINER' -> Stop."
  echo "  2. Action -> 'Duplicate settings' (this preserves env, ports, network)."
  echo "  3. In the wizard, Storage / Volume settings, Add Folder twice:"
  echo "       $CHATIN_HOST   ->  $CHATIN_CTR"
  echo "       $BRIEF_HOST   ->  $BRIEF_CTR"
  echo "  4. Finish the wizard to create the new container, start it, confirm"
  echo "     5678 + workflows are healthy, then delete the old stopped container."
  echo ""
  echo "  The full pre-change spec (for reference) is backed up at:"
  echo "       $BACKUP_DIR/n8n-inspect.json"
  echo "  Host dirs are already created + chowned, so the mounts will work the"
  echo "  moment the recreated container starts."
  echo "============================================================"
  exit 0
fi

# -------------------- COMPOSE PROJECT PATH --------------------
echo "    Compose project : $COMPOSE_PROJECT"
echo "    Compose file    : $COMPOSE_FILE"
echo "    Working dir     : $COMPOSE_WORKDIR"
cp "$COMPOSE_FILE" "$BACKUP_DIR/docker-compose.yml"
echo "    Backed up compose file -> $BACKUP_DIR/docker-compose.yml"

# Build the two mapping lines we need to ensure are present.
CHATIN_MAP="$CHATIN_HOST:$CHATIN_CTR"
BRIEF_MAP="$BRIEF_HOST:$BRIEF_CTR"

NEED_CHATIN=1
NEED_BRIEF=1
grep -q "$CHATIN_MAP" "$COMPOSE_FILE" && NEED_CHATIN=0
grep -q "$BRIEF_MAP" "$COMPOSE_FILE" && NEED_BRIEF=0
echo ""
echo "==> 6. Editing compose file (on a copy first)..."
echo "    needs $CHATIN_MAP : $NEED_CHATIN"
echo "    needs $BRIEF_MAP : $NEED_BRIEF"

if [ "$NEED_CHATIN" = "0" ] && [ "$NEED_BRIEF" = "0" ]; then
  echo "    Both mappings already in the compose file but not yet live on the"
  echo "    container. Skipping edit; will just recreate to apply them."
  WORK_FILE="$COMPOSE_FILE"
else
  WORK_FILE="$BACKUP_DIR/docker-compose.edited.yml"
  cp "$COMPOSE_FILE" "$WORK_FILE"

  # Anchor on the existing finance-events mount line and copy its exact leading
  # whitespace, so the inserted lines sit in the same service's volumes: list
  # with correct YAML indentation. This avoids parsing the service tree.
  ANCHOR=$(grep -n ":/data/finance-events" "$WORK_FILE" | head -n1 | cut -d: -f1)
  if [ -z "$ANCHOR" ]; then
    echo ""
    echo "WARNING: could not find the existing ':/data/finance-events' anchor line"
    echo "         in $COMPOSE_FILE. Not guessing where to insert."
    echo "         A proposed edit was NOT applied. Add these two lines by hand to"
    echo "         the n8n service's volumes: list, matching its indentation:"
    echo "             - $CHATIN_MAP"
    echo "             - $BRIEF_MAP"
    echo "         Then:  $COMPOSE -f \"$COMPOSE_FILE\" up -d"
    echo "         Original compose file is unchanged. Backup: $BACKUP_DIR/docker-compose.yml"
    exit 1
  fi

  # Capture the leading whitespace of the anchor line (everything before the dash).
  ANCHOR_LINE=$(sed -n "${ANCHOR}p" "$WORK_FILE")
  INDENT=$(printf '%s\n' "$ANCHOR_LINE" | sed 's/[^ ].*$//')

  # Build the insertion (only the entries we still need), newest after the anchor.
  INSERT=""
  if [ "$NEED_CHATIN" = "1" ]; then INSERT="$INSERT${INDENT}- $CHATIN_MAP\n"; fi
  if [ "$NEED_BRIEF" = "1" ]; then INSERT="$INSERT${INDENT}- $BRIEF_MAP\n"; fi

  # Insert after the anchor line using awk (portable; no GNU-sed 'a\' quirks).
  awk -v ln="$ANCHOR" -v ins="$INSERT" '
    { print }
    NR==ln { printf "%s", ins }
  ' "$WORK_FILE" > "$WORK_FILE.tmp" && mv "$WORK_FILE.tmp" "$WORK_FILE"

  echo "    Inserted after line $ANCHOR (indent matched to finance-events mount):"
  [ "$NEED_CHATIN" = "1" ] && echo "        - $CHATIN_MAP"
  [ "$NEED_BRIEF" = "1" ] && echo "        - $BRIEF_MAP"
fi

# ---- 7. VALIDATE the edited compose BEFORE touching the live container -------
echo ""
echo "==> 7. Validating edited compose ($COMPOSE config -q) BEFORE cutover..."
if ! "$COMPOSE" -f "$WORK_FILE" config -q; then
  echo ""
  echo "ERROR: the edited compose file failed validation. NOT applying."
  echo "       The live n8n container was NOT touched and is still running."
  echo "       Inspect the proposed edit:  $WORK_FILE"
  echo "       Original (unchanged):       $COMPOSE_FILE"
  exit 1
fi
echo "    Validation passed."

# Swap the validated edit in over the live project file (only if we edited a copy).
if [ "$WORK_FILE" != "$COMPOSE_FILE" ]; then
  cp "$WORK_FILE" "$COMPOSE_FILE"
  echo "    Swapped validated edit into $COMPOSE_FILE"
fi

# ---- 8. Recreate the n8n service via compose --------------------------------
echo ""
echo "==> 8. Recreating n8n service ($COMPOSE up -d) to apply the new mounts..."
if [ -n "$COMPOSE_WORKDIR" ] && [ -d "$COMPOSE_WORKDIR" ]; then
  "$COMPOSE" -f "$COMPOSE_FILE" --project-directory "$COMPOSE_WORKDIR" up -d
else
  "$COMPOSE" -f "$COMPOSE_FILE" up -d
fi

echo ""
echo "==> 9. Waiting 30 seconds for n8n to boot..."
sleep 30

# ---- 10. Verify the mounts are now active -----------------------------------
echo ""
echo "============================================================"
echo "VERIFY -- mounts now on the container:"
echo "============================================================"
"$DOCKER" inspect "$CONTAINER" --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}' \
  | grep -E "chatin|poetech-briefing|finance-events" || echo "WARNING: expected mounts not found in inspect output!"

echo ""
echo "==> Confirm L3 briefing path is readable inside the container:"
"$DOCKER" exec "$CONTAINER" ls -la "$BRIEF_CTR/" || echo "WARNING: could not ls $BRIEF_CTR inside container."

echo ""
echo "==> DONE."
echo ""
echo "Backup of the pre-change spec + compose file: $BACKUP_DIR"
echo ""
echo "To VERIFY L2 (the silent gap is closed):"
echo "  1. Post a message in Synology Chat #PoeTech-PWA, e.g.:  @nas mount test"
echo "  2. Wait ~30s, then on the NAS run:"
echo "        ls -la $CHATIN_HOST/"
echo "     A new <ts>__<sender>.json with your message content => wf08 is now"
echo "     writing host-visible. Family voice is visible again."
echo ""
echo "ROLLBACK (only if n8n is unhealthy after this):"
echo "  cp $BACKUP_DIR/docker-compose.yml \"$COMPOSE_FILE\""
echo "  $COMPOSE -f \"$COMPOSE_FILE\" up -d"
echo ""
echo "Per EXECUTION-OUTCOME-OBSERVABILITY: wf08's silent-failure pattern is"
echo "replaced by actual on-disk capture + the existing family-voice ntfy push."
