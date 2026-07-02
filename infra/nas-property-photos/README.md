# nas-property-photos — sovereign property-photo image server (no n8n)

**Status: built + verified locally 2026-07-01; NAS deploy pending Darrell.**
Fixes the 2026-07-01 regression where property photos stopped RENDERING on Real
Estate while the photo COUNT stayed correct (e.g. 1003 Koehn Dr "233 PHOTOS").

## Root cause (measured, not assumed)

The count is fetched **live** from the same bridge (`fetchChannelPhotos(…,{limit:1})`
→ psql `COUNT(*)`), so the count being right proves the **transport was up**. What
broke is **thumbnail resolution**: every `photo.thumb` came back `null`, so the
gallery `<img src={thumb}>` rendered nothing. The old resolver
(`infra/n8n/property-photos.py`) predicted ONE exact PhotoBackup `@eaDir` path per
photo and hard-failed to `null` the moment that assumption drifted (a DSM /
Synology Photos relocation, a `homes/` permissions change, or an oversized base64
gallery response failing a hop the tiny count response survives).

Run the **probe** on the NAS to localize it exactly:

```
python3 /volume1/PoeTech/scripts/photo_server.py --probe 1003Koehn
```

It reports `resolved / via_premade_thumb / via_downscale_fallback / unresolved`,
which candidate `root` actually hit, and a sample of unresolved names — the real
path drift, in numbers.

## The fix

One deterministic Python process (`photo_server.py`) owns the whole path — **no
n8n hop**. Same DR-0083 lane as `nas-finance-ingest` ("plain Python on the NAS
that just runs"). Two hardenings over the old resolver:

1. **Multiple candidate roots** (`DEFAULT_ROOTS`, overridable via `PHOTO_ROOTS`)
   so a relocated library still resolves.
2. **On-the-fly downscale fallback** — when Synology's pre-made thumbnail is
   gone, it makes a 480px JPEG from the original in memory (Pillow, else
   ImageMagick `convert`, else honest `null`). The original is never rewritten.

The wire contract is **identical** to the old bridge, so the PWA changed only its
base path:

```
GET /property-photos?channel=<name>&limit=<n>&offset=<n>
Authorization: Bearer <poetech-chat-bridge-token>
-> { count, total, photos: [{ id, date, name, text, thumb }] }   # thumb = data URL | null
GET /healthz -> { ok: true }   # no auth; liveness only
```

Path is matched by **suffix**, so it works whether the fronting proxy strips its
mount prefix or not.

## Security / sovereignty

- **Bearer token** expected value is read from the **existing** NAS-resident
  token file `/volume1/PoeTech/secrets/chat-bridge-token.txt` (the one the old
  n8n bridge already used) or `PHOTO_BRIDGE_TOKEN` env — it **stays on the NAS**,
  never printed, never logged, never in the repo. Compared in constant time
  (`hmac.compare_digest`). This is the **same value** the PWA already stores in
  `localStorage["poetech-chat-bridge-token"]`, so **no re-seeding and no device
  re-provisioning** — every device that could see photos before still can.
- `channel` is whitelist-validated; SQL interpolates only the sanitized channel.
  `limit`/`offset` int-bounded (≤48).
- Binds to **127.0.0.1** by default — reachable only via the local reverse proxy
  that fronts the sovereign path. No public attack surface of its own.
- Reads only Synology's small thumbnails (or an in-memory downscale) — never
  moves or rewrites an original.
- Not timer-driven / not self-triggering (on-demand request/response), so the
  three-brakes autonomous-automation rule does not apply.

## The app side (already committed)

- `app/src/lib/nas-photos.js` — `NAS_PHOTO_BASE = '/nas-photos'` +
  `propertyPhotosUrl()`; `fetchChannelPhotos` uses it.
- `app/src/components/Rentals.jsx` — both gallery fetches use `propertyPhotosUrl()`.
- `app/vercel.json` — rewrite `/nas-photos/:path*` →
  `https://poetech.tail5a2f35.ts.net/nas-photos/:path*`.
- `app/vite.config.js` — dev proxy `/nas-photos` → `http://192.168.1.26:8099`
  (override with `NAS_PHOTOS_DEV_TARGET`).
- Test `app/src/__tests__/nas-photos.test.js` pins the path so property photos
  can't silently route back through `/n8n/webhook`.

## Deploy on the NAS (SSH `dpoe@192.168.1.26`)

`scripts/nas-deploy-property-photos.sh` does all of this; the steps, for reference:

1. **Copy the server** to `/volume1/PoeTech/scripts/photo_server.py`.
2. **Token** — none to seed: the server reuses the existing
   `/volume1/PoeTech/secrets/chat-bridge-token.txt`.
3. **sudoers** — the process runs as `dpoe` and elevates only the psql read.
   The n8n SSH path already runs this exact `sudo -n -u postgres psql synochat …`
   as `dpoe`, so the sudoers grant already exists; nothing new is needed.
4. **Run it** (foreground, to prove it):
   `PHOTO_BRIDGE_TOKEN=… python3 /volume1/PoeTech/scripts/photo_server.py --serve`
   then from the NAS: `curl -s localhost:8099/healthz` → `{"ok":true}`.
5. **Front it on the sovereign path.** The Funnel host
   `poetech.tail5a2f35.ts.net` already serves n8n; add a path handler for the
   image server (prefix stripped → server sees `/property-photos`):

   ```
   tailscale serve --bg --set-path /nas-photos http://127.0.0.1:8099
   tailscale serve status      # confirm /nas-photos -> 127.0.0.1:8099
   ```

   (DSM's Application Portal → Reverse Proxy is the GUI alternative if the
   Tailscale CLI path handler isn't available on this tailscaled version.)
6. **Persist it.** DSM → Control Panel → Task Scheduler → Triggered Task →
   *Boot-up*, run-as `dpoe`, command:
   `/usr/bin/python3 /volume1/PoeTech/scripts/photo_server.py --serve`
   (reads the default token file; or a `systemd` unit if this DSM has one.)

## Verify (served)

- On the NAS: `python3 …/photo_server.py --probe 1003Koehn` → non-zero `resolved`.
- In the app (poetech.us → Real Estate → 1003 Koehn → Records → 📷 Browse):
  thumbnails render and the click-to-enlarge lightbox opens.

## Retiring the old n8n bridge

Once served-verified, the n8n `wf-property-photos` workflow can be **deactivated**
(leave `infra/n8n/property-photos.py` + `wf-property-photos.json` in the repo as
history). Family/album galleries still ride `/n8n` and are unaffected.
