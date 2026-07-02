# nas-property-photos — sovereign property-photo image server (no n8n)

**Status: built + verified locally 2026-07-01; NAS deploy pending Darrell.**
Fixes the 2026-07-01 regression where property photos stopped RENDERING on Real
Estate while the photo COUNT stayed correct (e.g. 1003 Koehn Dr "233 PHOTOS").

## Root cause (measured, not assumed)

The count is fetched **live** from the same bridge (`fetchChannelPhotos(…,{limit:1})`
→ psql `COUNT(*)`), so the count being right proves the **transport was up**. What
broke is **thumbnail resolution**: `photo.thumb` came back `null`, so the gallery
`<img src={thumb}>` rendered nothing. **Measured** with `--probe` on the NAS, the
old resolver (`infra/n8n/property-photos.py`) was too narrow on THREE axes and
silently `null`ed anything outside them:

1. **Backup folder name.** It only globbed `Drive/PhotoBackup/<device>/…`, but the
   real photos for 1003 Koehn live under `Drive/Backup/"DP Note 20 backup"/…`.
   → generic `Drive/*/*/DCIM/…` matches any device-backup folder.
2. **DCIM subfolder.** It only globbed `DCIM/Camera`, but screenshots live under
   `DCIM/Screenshots`. → `DCIM/*`.
3. **Filename shape.** It required a strict `YYYYMMDD_` *prefix*, missing
   `Screenshot_20240109_…`. → pull the date from **anywhere** in the name, with
   an undated fallback for date-less iPhone `IMG_####.jpg`.

(On top of that, the heavy `limit=48` base64 gallery response likely also failed
at a hop the tiny `limit=1` count response survived — dropping the n8n hop removes
that failure mode too.)

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
4. **Install the systemd service** (boot-persistent, auto-restart):
   `sudo cp .../poetech-photo-server.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable poetech-photo-server && sudo systemctl start poetech-photo-server`
   then `curl -s localhost:8099/healthz` → `{"ok":true}`.
5. **Front it on the sovereign path** (public Funnel host
   `poetech.tail5a2f35.ts.net`, which already serves n8n at `/`). Add a path
   handler for the image server (prefix stripped → server sees `/property-photos`):

   ```
   sudo tailscale funnel --bg --set-path=/nas-photos http://127.0.0.1:8099
   sudo tailscale serve status      # confirm /nas-photos -> localhost:8099
   ```

   This is **additive** — the root `/` → n8n handler is untouched. (DSM's
   Application Portal → Reverse Proxy is the GUI alternative.)

`scripts/nas-deploy-property-photos.sh` performs steps 1–4 and prints step 5.

## Verify (served) — done 2026-07-01/02

Measured through the full production chain
`poetech.us → Vercel /nas-photos rewrite → Funnel → localhost:8099`:

- `curl https://poetech.us/nas-photos/healthz` → `{"ok":true}`.
- `…/nas-photos/property-photos?channel=1003Koehn&limit=4` (bearer) → the
  1003 Koehn regression channel: **total=233**, real thumbnail data URLs.
- Per-channel thumbnail resolution after the broadened resolver (first page):
  1003Koehn 24/24 · 805NProspect 24/24 · 709CommercialSt 24/24 ·
  1508Williamsburg 2/2 · 2111TalansDr 16/24 · 1513HH 13/24 · 440SS 33/48.
- In-app: poetech.us → Real Estate → 1003 Koehn → Records → 📷 Browse —
  thumbnails render; the click-to-enlarge lightbox (unchanged `Lightbox.jsx`,
  fed the same `thumb` data URLs) opens.

### Known remaining gap (documented, not silent) — `re-review: 2026-08-15`

Some photos still come back `thumb=null` and are hidden by the app (as they
always were). These are files that were **never backed up to the NAS Drive
PhotoBackup trees** — verified: `find /volume1/homes -iname IMG_3832.jpg`
returns nothing. They are:

- **iPhone `IMG_####.jpg`** (no date in the name; not present in any Drive
  backup on this NAS), and
- **messaging-app `1000######.jpg`** saved images (likewise not in a backup).

They exist only inside Synology Chat's own upload store, which this resolver
does **not** read: the `synochat` DB `posts.file_props` carries no path to the
stored bytes, and there is no `fileinfo` table — mapping a post to its stored
file would mean reverse-engineering Synology Chat's undocumented hashed file
storage. **Why deferred:** disproportionate risk/effort vs. a partial gap on a
few properties, and the regression target (1003 Koehn) is fully resolved.
**Re-review 2026-08-15** — if the gap matters, the path is a `posts →
fileinfo/hashed-store` fallback that serves/downscales the chat original
directly (would push resolution to ~100% regardless of backup). (DR-0075.)

## Retiring the old n8n bridge

Now served-verified, the n8n `wf-property-photos` workflow can be **deactivated**
(leave `infra/n8n/property-photos.py` + `wf-property-photos.json` in the repo as
history). Family/album galleries still ride `/n8n` and are unaffected.
