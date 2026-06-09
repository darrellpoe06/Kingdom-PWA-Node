#!/bin/sh
# nas-update-wf18-bearer-guard.sh   (NAS bash -- ConnectBot)
# 2026-06-03 L16: add a Bearer-token guard to wf18 (Imported transactions API).
# Defense-in-depth behind the D17 client gate. wf18 serves real bank + Gmail
# PII (~2,020 Chase rows incl. Cash App / Zelle). D17 hid the Imported tab and
# skipped the fetch on demo / profileless loads CLIENT-side. L16 adds the
# SERVER-side gate: the new "Bearer check" node returns 401 unless the request
# carries the shared bearer token. Either gate alone fails closed.
#
# The expected secret lives on the confirmed wf18 bind mount at:
#   host:      /volume1/PoeTech/finance-events/_secrets/n8n-webhook-bearer.txt
#   container: /data/finance-events/_secrets/n8n-webhook-bearer.txt
# The _-prefixed path is skipped by every directory walker in the repo, so it
# never leaks into any aggregate response.
#
# IDEMPOTENT: re-running REUSES an existing bearer (it does NOT rotate). To
# rotate on purpose, delete the file first, re-run this, then paste the new
# value into Vercel. See N8N-WEBHOOK-AUTH-PATTERN.md for the rotation path.
#
# Run on the NAS host (not inside the n8n container):
#   wget -qO- https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/scripts/nas-update-wf18-bearer-guard.sh | sudo sh
#
# What it does, in order:
#   1. Ensures the secret dir exists; generates the bearer ONCE if absent
#   2. Fetches the updated wf18 JSON from the GitHub repo
#   3. Discovers wf18's existing n8n workflow id at runtime (by name) so the
#      import upserts instead of creating a duplicate
#   4. Injects that id into the JSON
#   5. Hands ownership to uid 1000 (the n8n container user)
#   6. Imports into n8n (overwrites the existing wf18 record)
#   7. Activates wf18 (this endpoint should be live)
#   8. Restarts n8n so the Code node body re-registers
#   9. Waits 25 seconds for n8n to boot
#  10. Confirms wf18 is active and PRINTS the bearer to paste into Vercel

set -e

SECRET_DIR=/volume1/PoeTech/finance-events/_secrets
SECRET_FILE=$SECRET_DIR/n8n-webhook-bearer.txt

cd /volume1/PoeTech/finance-events

echo "==> 1. Ensuring the bearer secret exists (generate once, reuse thereafter)..."
mkdir -p "$SECRET_DIR"
if [ ! -s "$SECRET_FILE" ]; then
  # Portable 64-hex-char (256-bit) token. Prefer openssl; fall back to urandom.
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32 | tr -d '\r\n' > "$SECRET_FILE"
  else
    head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \r\n' > "$SECRET_FILE"
  fi
  echo "    Generated a new bearer."
else
  echo "    Reusing the existing bearer (not rotating)."
fi
chown 1000:1000 "$SECRET_FILE"
chmod 600 "$SECRET_FILE"
BEARER=$(cat "$SECRET_FILE")

echo "==> 2. Fetching updated wf18 JSON from GitHub (L16 Bearer guard)..."
wget -qO _c18.json https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/docs/00-foundations/n8n-workflows/18-imported-transactions-api.json

echo "==> 3. Discovering wf18's existing n8n workflow id (by name)..."
WF_ID=$(/usr/local/bin/docker exec n8n n8n list:workflow | grep -i "Imported transactions API" | head -n1 | cut -d'|' -f1 | tr -d ' \r\n')
if [ -z "$WF_ID" ]; then
  echo "ERROR: could not find an existing workflow named like 'Imported transactions API'."
  echo "       Aborting so we do not create a duplicate. Run this to see the list:"
  echo "         /usr/local/bin/docker exec n8n n8n list:workflow"
  exit 1
fi
echo "    Found wf18 id: $WF_ID"

echo "==> 4. Injecting existing n8n workflow id ($WF_ID) so the import upserts..."
sed -i "s|^{|{\"id\": \"$WF_ID\", |" _c18.json

echo "==> 5. Setting ownership for n8n container user..."
chown 1000:1000 _c18.json
chmod 644 _c18.json

echo "==> 6. Importing into n8n (upsert on existing id)..."
/usr/local/bin/docker exec n8n n8n import:workflow --input=/data/finance-events/_c18.json

echo "==> 7. Activating wf18 (this endpoint should be live)..."
/usr/local/bin/docker exec n8n n8n update:workflow --id=$WF_ID --active=true

echo "==> 8. Restarting n8n..."
/usr/local/bin/docker restart n8n

echo "==> 9. Waiting 25 seconds for n8n to boot..."
sleep 25

echo ""
echo "=========================================="
echo "=== Active workflow list (looking for wf18): ==="
echo "=========================================="
/usr/local/bin/docker exec n8n n8n list:workflow --active=true | grep -i "Imported transactions API" || echo "WARNING: wf18 not in active list!"

echo ""
echo "=================================================================="
echo "=== PASTE THIS INTO VERCEL (Project Settings -> Environment Variables): ==="
echo "=================================================================="
echo "  Name:  VITE_N8N_BEARER"
echo "  Value: $BEARER"
echo "  Scope: Production (and Preview if you test there)"
echo ""
echo "After saving the env var, REDEPLOY the PWA so the build inlines it."
echo ""
echo "==> VERIFY the guard (run from the NAS or any LAN box):"
echo "  # No bearer -> expect HTTP 401:"
echo "    curl -s -o /dev/null -w '%{http_code}\\n' http://192.168.1.26:5678/webhook/imported-transactions"
echo "  # Correct bearer -> expect HTTP 200 + real JSON:"
echo "    curl -s -o /dev/null -w '%{http_code}\\n' -H \"Authorization: Bearer $BEARER\" http://192.168.1.26:5678/webhook/imported-transactions"
echo ""
echo "Then on poetech.us: the public demo never sends the bearer (D17 gate), so"
echo "the Imported fetch is never even attempted there; on your own device with a"
echo "saved profile the tab loads with the bearer attached. Defense in depth:"
echo "client gate (D17) + server gate (L16), either alone fails closed."
echo ""
echo "==> DONE."
