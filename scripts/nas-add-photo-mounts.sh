#!/bin/sh
# nas-add-photo-mounts.sh   (NAS bash -- ConnectBot, from anywhere)
#
# 2026-06-13  R15 sovereign photo write-path: add the two photo bind mounts to
# the n8n container so wf-photo-upload + wf-family-photos can read/write the
# family's photos on the NAS.
#
#   /volume1/PoeTech/family-photos    -> /data/family-photos
#   /volume1/PoeTech/property-photos  -> /data/property-photos
#
# Mirrors the proven nas-update-n8n-bind-mounts.sh exactly: pre-create dirs as
# uid 1000, back up the spec + compose, edit a COPY, validate with
# `docker-compose config -q` BEFORE touching the live container, abort safely
# (n8n left running) on any problem. Idempotent: re-running is a no-op once the
# mounts are live.
#
# Run on the NAS host (NOT inside the container):
#   wget -qO- https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/scripts/nas-add-photo-mounts.sh | sudo sh
#
# After it succeeds: in the n8n UI (192.168.1.26:5678) import wf-photo-upload.json
# and wf-family-photos.json, bind each webhook's Header Auth credential to the
# existing "property-history bridge token", and Activate both.

set -e

CONTAINER="n8n"
FAM_HOST="/volume1/PoeTech/family-photos"
FAM_CTR="/data/family-photos"
PROP_HOST="/volume1/PoeTech/property-photos"
PROP_CTR="/data/property-photos"
BACKUP_ROOT="/volume1/PoeTech/nas-backups/photo-mounts"
TS=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$TS"

echo "============================================================"
echo "n8n photo bind-mount add (family-photos + property-photos) -- $TS"
echo "============================================================"

# ---- 1. Resolve docker / docker-compose binaries -----------------------------
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

if ! "$DOCKER" inspect "$CONTAINER" >/dev/null 2>&1; then
  echo "ERROR: no container named '$CONTAINER' found. Aborting."
  exit 1
fi

# ---- 2. Idempotency: are both mounts already live? ---------------------------
MOUNTS_JSON=$("$DOCKER" inspect "$CONTAINER" --format '{{json .Mounts}}' 2>/dev/null || echo "[]")
HAS_FAM=0; HAS_PROP=0
echo "$MOUNTS_JSON" | grep -q "\"Destination\":\"$FAM_CTR\"" && HAS_FAM=1
echo "$MOUNTS_JSON" | grep -q "\"Destination\":\"$PROP_CTR\"" && HAS_PROP=1
if [ "$HAS_FAM" = "1" ] && [ "$HAS_PROP" = "1" ]; then
  echo "==> Both photo mounts already present. Nothing to do. (idempotent no-op)"
  exit 0
fi

# ---- 3. Pre-create host dirs as uid 1000 (the n8n container user) ------------
echo "==> Pre-creating host directories (owned 1000:1000)..."
mkdir -p "$FAM_HOST" "$PROP_HOST"
chown -R 1000:1000 "$FAM_HOST" "$PROP_HOST"
echo "    Created + chowned: $FAM_HOST  and  $PROP_HOST"

# ---- 4. Back up the spec BEFORE any mutation ---------------------------------
mkdir -p "$BACKUP_DIR"
"$DOCKER" inspect "$CONTAINER" > "$BACKUP_DIR/n8n-inspect.json"
echo "    Backed up spec -> $BACKUP_DIR/n8n-inspect.json"

# ---- 5. Locate the compose file ----------------------------------------------
COMPOSE_FILE=$("$DOCKER" inspect "$CONTAINER" \
  --format '{{ index .Config.Labels "com.docker.compose.project.config_files" }}' 2>/dev/null || echo "")
if [ -z "$COMPOSE_FILE" ] || [ ! -f "$COMPOSE_FILE" ]; then
  echo "    No compose file found via labels => STANDALONE container."
  echo "    Add the two mounts via Container Manager UI (Stop -> Duplicate settings"
  echo "    -> add folders below -> recreate -> start -> delete old):"
  echo "        $FAM_HOST   ->  $FAM_CTR"
  echo "        $PROP_HOST  ->  $PROP_CTR"
  echo "    Host dirs are already created + chowned. Backup: $BACKUP_DIR/n8n-inspect.json"
  exit 0
fi
cp "$COMPOSE_FILE" "$BACKUP_DIR/docker-compose.yml"
echo "    Compose file: $COMPOSE_FILE  (backed up)"

FAM_MAP="$FAM_HOST:$FAM_CTR"
PROP_MAP="$PROP_HOST:$PROP_CTR"
NEED_FAM=1; NEED_PROP=1
grep -q "$FAM_MAP" "$COMPOSE_FILE" && NEED_FAM=0
grep -q "$PROP_MAP" "$COMPOSE_FILE" && NEED_PROP=0

if [ "$NEED_FAM" = "0" ] && [ "$NEED_PROP" = "0" ]; then
  echo "    Both mappings already in compose but not live. Recreating to apply."
  WORK_FILE="$COMPOSE_FILE"
else
  WORK_FILE="$BACKUP_DIR/docker-compose.edited.yml"
  cp "$COMPOSE_FILE" "$WORK_FILE"
  # Anchor on the existing finance-events mount; copy its indentation so the
  # inserted lines land in the same service's volumes: list. (Same proven
  # technique as nas-update-n8n-bind-mounts.sh.)
  ANCHOR=$(grep -n ":/data/finance-events" "$WORK_FILE" | head -n1 | cut -d: -f1)
  if [ -z "$ANCHOR" ]; then
    echo "WARNING: no ':/data/finance-events' anchor in $COMPOSE_FILE. Not guessing."
    echo "         Add by hand to the n8n service's volumes: (match indentation):"
    echo "             - $FAM_MAP"
    echo "             - $PROP_MAP"
    echo "         Then: $COMPOSE -f \"$COMPOSE_FILE\" up -d   (compose unchanged; backup kept)"
    exit 1
  fi
  ANCHOR_LINE=$(sed -n "${ANCHOR}p" "$WORK_FILE")
  INDENT=$(printf '%s\n' "$ANCHOR_LINE" | sed 's/[^ ].*$//')
  INSERT=""
  [ "$NEED_FAM" = "1" ]  && INSERT="$INSERT${INDENT}- $FAM_MAP\n"
  [ "$NEED_PROP" = "1" ] && INSERT="$INSERT${INDENT}- $PROP_MAP\n"
  awk -v ln="$ANCHOR" -v ins="$INSERT" '{ print } NR==ln { printf "%s", ins }' \
    "$WORK_FILE" > "$WORK_FILE.tmp" && mv "$WORK_FILE.tmp" "$WORK_FILE"
  echo "    Inserted after line $ANCHOR:"
  [ "$NEED_FAM" = "1" ]  && echo "        - $FAM_MAP"
  [ "$NEED_PROP" = "1" ] && echo "        - $PROP_MAP"
fi

# ---- 6. VALIDATE on the copy BEFORE touching the live container --------------
echo "==> Validating edited compose BEFORE cutover..."
if ! "$COMPOSE" -f "$WORK_FILE" config -q; then
  echo "ERROR: edited compose failed validation. NOT applying. n8n still running."
  echo "       Proposed edit: $WORK_FILE   Original (unchanged): $COMPOSE_FILE"
  exit 1
fi

# ---- 7. Apply: copy the validated file into place + recreate -----------------
if [ "$WORK_FILE" != "$COMPOSE_FILE" ]; then
  cp "$WORK_FILE" "$COMPOSE_FILE"
fi
echo "==> Recreating n8n with the new mounts..."
"$COMPOSE" -f "$COMPOSE_FILE" up -d
echo ""
echo "==> Done. Verify:"
echo "    $DOCKER exec $CONTAINER ls -la $FAM_CTR/ $PROP_CTR/"
echo ""
echo "Next (n8n UI at 192.168.1.26:5678): import wf-photo-upload.json +"
echo "wf-family-photos.json, bind each webhook Header Auth to the existing"
echo "'property-history bridge token', and Activate both."
