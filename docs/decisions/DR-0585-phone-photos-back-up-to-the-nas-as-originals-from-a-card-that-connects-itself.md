# DR-0585 — Phone photos back up to the NAS as originals, from a card that connects itself; what a full phone backup still needs

- **Status:** accepted
- **Tier:** B (a family-facing surface; the NAS write path)
- **Type:** product
- **Date:** 2026-09-23
- **Scope:** `app/src/components/LifeGallery.jsx`, `app/src/lib/nas-photos.js` (`uploadPlan`, `NAS_UPLOAD_MAX_BYTES`), test `phone-photos-back-up-to-the-nas.test.js`
- **Principles:** REALITY-TRACE (DR-0061), THE-KEY-PROVISIONS-ITSELF (DR-0574), VERIFICATION-DOCTRINE (DR-0076), NOTHING-WAITS (DR-0236), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** Darrell 2026-09-23: *"There's no path to upload photos from my cellphone to the nas!!!!! Why not?!!! I should be able to back up my phone and pick the nas or whatever I have for storages connections inside the PoeTech App or whatever makes sense...."*

## What was measured (the map, with file:line)

| what | where | finding |
| --- | --- | --- |
| the in-app road to the NAS | Big Picture › Life Gallery: `LifeGallery.jsx:316` (`+ Add photos`, multiple) → `onFiles` → `uploadPhoto` (`nas-photos.js`) → `POST /nas-photos/upload` → `photo_server.py:503-544` → `/volume1/PoeTech/family-photos` | **exists** — and Darrell could not find it as "a path", for two reasons below |
| the gate in front of it | `LifeGallery.jsx` card: "Photos are staying on this phone. Connect your NAS" → paste a bridge token | on a phone that never opened Voice or Real Estate, the token was never provisioned: `provisionBridgeToken` (DR-0574, 2026-08-03) was wired into VoiceStudio, Rentals and use-read-aloud, **not** into this card. The first surface a person would call "back up my photos" still carried the v1 paste gate |
| what it sent | `compressImageFile(file, 1600, 0.75)` then `uploadPhoto(s.src)` | a 1600px re-encode of every photo — a preview, not a backup |
| the server's limits | `photo_server.py:129` `MAX_UPLOAD_BYTES = 8 MiB`; `sniff_image` keeps jpg / png / webp by magic number | an original phone JPEG (2–6 MB) fits; HEIC does not |
| camera-folder pull | `LifeGallery.jsx:285-298` — File System Access API (Android Chrome), newest **30** by name | exists; the button said only "From camera folder" |
| destination choice | searched `storage connection/provider/destination` | **none** — one destination exists for photos (the NAS family folder); Supabase buckets (`family-documents`, `church-documents`, …) are document shelves with document semantics |
| unattended phone backup | `nas-photos.js:164` (comment, 2026-06-24): "His phone photos already back up to the NAS (DS file: /home/Photos/MobileBackup)" | outside the app, via Synology's own app; recorded then, not re-measured today |
| Your Data | `DataLiberation.jsx` / `data-liberation.js:60-98` | Google Takeout walk-through (Photos, Gmail) into `/volume1/PoeTech/photos-archive`; a way OUT of Google, not a phone backup |

## Decisions (built now)

1. **The card connects itself (DR-0574).** On mount, a signed-in family device calls `provisionBridgeToken(supabase)`; `provisioned` flips the card to connected. The paste remains only for a device the RPC answers null to (signed out, not family). The copy says so instead of demanding a paste.
2. **The original is what gets backed up.** `uploadPlan(file)` (pure, tested): the original bytes when `size ≤ NAS_UPLOAD_MAX_BYTES` (pinned equal to the server's constant by the test) and the type is one the server keeps; the reduced copy otherwise, with the reason. The note names the outcome: "N backed up to your NAS … M sent as a reduced copy (over 8 MB or a type the NAS does not keep)". The phone keeps its 1600px preview as before.
3. **The words are true to the code.** "Backing up to your NAS · the family-photos folder — originals up to 8 MB"; the camera-folder button says "Newest 30", which is what it pulls.

## Not built, said plainly, each with a date (DR-0075)

- **A destination picker ("pick the NAS or whatever I have").** Today there is exactly one photo destination inside the app. A picker with one entry is a painted control (P15). It becomes real the day a second destination exists — a per-instance NAS folder (`dest` is already a validated parameter of the upload route), or a second box. `re-review: 2026-10-07`, tied to the Storage Connections readout below.
- **A "Storage connections" readout on Your Data** — the NAS photo server (`/nas-photos/healthz` answers), the bridge token state on this device, the Synology Photos mobile backup (folder present on the box), the Takeout archive folder — each a measured fact, not a claim. Buildable; not in this change because Your Data's own layout is under DR-0291's shrink-only baselines and needs its own probe. `re-review: 2026-10-07`.
- **Unattended full-camera-roll backup from inside the app.** A web page cannot read the camera roll without a gesture; the "newest 30" folder pull is the PWA's ceiling on Android and nothing on iOS. The real road is the native shell (DR-0570 lane, a background media-store reader), or Synology Photos' own backup, which the 2026-06-24 note says is already running on his phone — to be **re-measured** (does `/home/Photos/MobileBackup` on the box carry files dated this week?) by the next nas-health cycle: a read-only `ls` is a one-line addition. `re-review: 2026-10-14`.
- **HEIC and files over 8 MB as originals.** The server sniffs jpg/png/webp and caps at 8 MiB (matching the old bridge). Raising the cap and adding HEIC (a `ftyp` box sniff) is a `photo_server.py` change that self-deploys through `services-sync` (`services.json` `property-photos`) and carries its own `--selftest`; not done here because the selftest must first prove the sniff against real HEIC bytes. `re-review: 2026-10-07`.

## Verification after deploy (DR-0104, his phone)

Big Picture › Life Gallery must show "✓ Backing up to your NAS…" **without a paste** on his signed-in phone; "+ Add photos" with one camera JPEG must produce "1 photo backed up to your NAS"; the file must appear in `/volume1/PoeTech/family-photos` at its original size (nas-health's family-photos listing, or `ls -la` over ConnectBot).
