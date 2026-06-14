# R15 — Sovereign photo write-path (deploy)

What it does: the PoeTech app's **+ Add photos** writes to a folder on **your
NAS** instead of one phone's browser storage, so every family device's gallery
shows the same shared, backed-up pictures (loaded live from the NAS). Two
workflows:

- `wf-photo-upload.json` — POST `/webhook/photo-upload` `{dest, filename, dataUrl}`
  → validates + writes one image to the NAS. Bearer-gated; path-sanitized;
  8 MB cap; magic-byte image check (JPEG/PNG/WebP only).
- `wf-family-photos.json` — GET `/webhook/family-photos?limit=N` → returns the
  recent shared-gallery images. Bearer-gated; read-only.

Both ship **inactive** (`lifecycle_state: inactive-pending-nas-deploy`). The
app degrades gracefully until they're live: with no NAS reachable, uploads fall
back to device-local exactly as before.

## One-time NAS setup (Darrell)

1. **Create the photo roots** on the NAS:
   ```
   mkdir -p /volume1/PoeTech/family-photos /volume1/PoeTech/property-photos
   ```
2. **Bind-mount them into the n8n container** (same pattern as the existing
   finance-events / chatin mounts — see `scripts/nas-update-n8n-bind-mounts.sh`).
   Add to the n8n service in `/volume1/docker/n8n-stack/docker-compose.yml`:
   ```
   - /volume1/PoeTech/family-photos:/data/family-photos
   - /volume1/PoeTech/property-photos:/data/property-photos
   ```
   then `docker compose up -d` in that folder.
3. **Import both workflows** in n8n; bind each webhook's **Header Auth**
   credential to the same bearer token the read-bridges use (`property-history
   bridge token`), so the device token already in the app works unchanged.
4. **Activate** both. Test from the app: Big Picture → + Add photos → the
   "saved to your NAS — shared with the family" note appears and the shared
   gallery shows it on a second signed-in device.

## Security notes

- Bearer auth on both webhooks (headerAuth credential) — the token never ships
  in the bundle; it's entered once per device, same as the read-bridges.
- `dest` and `filename` are sanitized to `[A-Za-z0-9._-]`, `..` and `/`
  rejected, and the resolved path is asserted to stay inside its root — no
  traversal out of the photo folders.
- Decoded size capped at 8 MB; bytes must be a real JPEG/PNG/WebP (magic-byte
  check), so the endpoint can't be used to write arbitrary files.

## Follow-up (not blocking)

- v1 returns stored images directly on read; a dedicated thumbnail pass
  (Synology-generated or a sharp step) would cut the gallery payload. Track as
  a photo-pipeline optimization.
- Per-person staging (a photo confirmed before it joins the shared gallery) is
  a later refinement; v1 shares immediately, matching the family-account model.
