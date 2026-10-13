# Sovereign photo write-path (Python — n8n RETIRED 2026-07-19)

What it does: the PoeTech app's **+ Add photos** writes to a folder on **your
NAS** instead of one phone's browser storage, so every family device's gallery
shows the same shared, backed-up pictures (loaded live from the NAS).

**This is Python, not n8n.** Per the Ways (sovereign Python, off n8n), both the
photo READ path and now the photo WRITE path are the one self-contained
`photo_server.py` process — no n8n workflow, no vendor dependency, no LLM. The
old `wf-photo-upload.json` / `wf-family-photos.json` n8n workflows are **retired
and superseded** by this server (kept in the repo only as historical reference).

## The endpoints (all on `photo_server.py`, same bearer token)

- `GET  /nas-photos/property-photos?channel=<name>&limit=N` — read a property's photos.
- `POST /nas-photos/upload`  `{ dest, filename, dataUrl }` → `{ ok, id, dest }` — the WRITE
  path. Bearer-gated; `dest`/`filename` sanitized + path-contained; 8 MB cap;
  magic-byte image check (JPEG/PNG/WebP only, the bytes decide the type). Writes
  to `PHOTO_UPLOAD_ROOT/<dest>/<name>` (default `/volume1/PoeTech/family-photos`),
  the name carrying a content hash so re-uploading the same image is idempotent.
- `GET  /nas-photos/healthz` — liveness (no auth).

The PWA reaches all of these via the same-origin `/nas-photos` rewrite and stores
the bearer token once per device in `localStorage["poetech-chat-bridge-token"]`
(entered in the app: Big Picture → photos → Connect NAS).

## Deploy / update on the NAS (Darrell, via ConnectBot — Python, no docker/n8n)

The server runs as the systemd service `poetech-photo-server.service`. To pick up
this upload endpoint, redeploy the updated `photo_server.py` and restart it:

```
sudo mkdir -p /volume1/PoeTech/family-photos
sudo systemctl restart poetech-photo-server
systemctl status poetech-photo-server --no-pager
```

If the service isn't installed yet, `scripts/nas-deploy-property-photos.sh` copies
`photo_server.py` + the `.service` unit into place and enables it. The bearer
token is read from `/volume1/PoeTech/secrets/chat-bridge-token.txt` (or the
`PHOTO_BRIDGE_TOKEN` env) — the SAME token the read path already uses, so no new
secret. Override the write folder with `PHOTO_UPLOAD_ROOT` if needed.

Verify the upload path offline any time (no NAS needed):

```
python3 infra/nas-property-photos/photo_server.py --selftest
```

## Security notes

- Bearer auth on read AND write; the token stays on the NAS (constant-time
  compare) and on the device — never in the bundle.
- `dest` and `filename` are sanitized to `[A-Za-z0-9._-]`; `..`, `/`, and `\` are
  rejected, and the resolved path is asserted to stay inside the photo root — no
  traversal out of the folder.
- Decoded size capped at 8 MB; bytes must be a real JPEG/PNG/WebP (magic-byte
  check), so the endpoint can't be used to write arbitrary files.
