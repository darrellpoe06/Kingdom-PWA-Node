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

---

## Phone media backup (photos + videos) — added 2026-07-05

**Status: built + verified locally (53/53 selftest, live chunked-upload
end-to-end exercise, 4,492 app tests); NAS redeploy pending Darrell.**

Darrell, 2026-07-05: *"Can this app upload and give me the option of moving all
my photos and videos to my server or nas ... so I can get a new phone and all
my images and videos are safe?"* This server now carries that write lane —
videos cannot ride the n8n `photo-upload` webhook (JSON/base64 transport, 8 MB
cap, image-only), so the raw-byte, chunked, resumable path lives here.

### Contract (all bearer-gated with the same chat-bridge token)

```
GET  /media-exists?device=<d>&name=<n>&size=<bytes>&date=YYYY-MM-DD
     -> { ok, exists, bytes }            # dedup check before any bytes move
GET  /media-upload-status?id=<upload-id>
     -> { ok, bytes }                    # resume point for a partial upload
POST /media-upload                       # body = raw chunk (~6 MB from the PWA)
     X-Upload-Id / X-Media-Device / X-Media-Name / X-Media-Total /
     X-Media-Offset / X-Media-Date
     -> { ok, bytes, complete, dedup }   # 409 + real part size on offset
                                         # mismatch; the client adopts it
```

Files land under `MEDIA_BACKUP_ROOT` (default `/volume1/PoeTech/phone-backup`):
`<device>/<YYYY>/<MM>/<name>`. In-flight chunks accumulate in `.parts/`.
Completion is gated on a magic-byte check (JPEG/PNG/WebP/GIF, MP4/MOV/HEIC
family, WebM/MKV, AVI); anything unrecognized is deleted, never stored. A
same-name-same-size file is a dedup hit; a same-name-different-size file gets a
uniquified name — nothing is ever clobbered. Filenames and device labels are
sanitized and realpath-contained inside the backup root (belt and suspenders),
and per-upload locks keep the threaded server's appends serial.

### The app side (already committed)

- `app/src/lib/media-backup.js` — chunk protocol, dedup/resume, the
  verified-bytes-or-no-checkmark rule (DR-0076), and the per-device
  backed-up ledger (`poetech-media-backup-ledger`).
- `app/src/components/PhoneBackup.jsx` — the Big Picture card: pick files or
  a whole folder (Android Chrome), progress, stop/resume, honest service
  states (it detects a pre-media server build and says so).
- `app/functions/nas-photos/[[path]].js` — Cloudflare Pages proxy for the
  `/nas-photos` path (sibling of the `/n8n` Function; the Vercel rewrite
  already covers it there).
- Tests: `app/src/__tests__/media-backup.test.js` (protocol, sanitizers,
  ledger, endpoint pinned to `/nas-photos` never `/n8n`) and
  `phone-backup-render.test.jsx` (honest render states).

### Redeploy on the NAS (same service, new build)

Nothing new to configure: same token file, same port, same Funnel path. Just
replace the script and restart. From PowerShell, anywhere:

```
cd C:\Users\dpoe\Kingdom-PWA-Node
git pull origin main
scp infra\nas-property-photos\photo_server.py dpoe@192.168.1.26:/volume1/PoeTech/scripts/photo_server.py
ssh dpoe@192.168.1.26 "sudo systemctl restart poetech-photo-server"
ssh dpoe@192.168.1.26 "curl -s localhost:8099/healthz"
```

Expected: `{"ok": true}`. Then on the phone: PoeTech app → Family OS → Big
Picture → the "Phone → NAS backup" card should show its buttons enabled (it
probes `/media-upload-status` and reports "needs the update" until the restart
lands). Verify end-to-end by backing up one photo and confirming it appears
under `/volume1/PoeTech/phone-backup/<device>/<year>/<month>/`.

### Honest scope

A PWA cannot background-sync the camera roll (browser sandbox — see
`docs/99-session-notes/2026-06-11-photo-sovereignty-and-phone-backup.md`).
This lane is foreground pick-and-verify (bulk folder backup included); the
Synology Photos app remains the automatic every-new-shot path. The card states
this on-surface instead of faking it.
