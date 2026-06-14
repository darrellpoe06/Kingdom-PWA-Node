# wf-property-photos — Synology Chat photos → PWA room galleries

**Status: LIVE on the NAS (2026-06-11).** Sibling of the property-history
bridge. Serves a property chat channel's photos as Synology's own thumbnails
so the family can file each to the right room in the app.

## Why

The Poe Properties photo history lives in the Synology Chat channels (e.g.
`805NProspect` holds ~1,582 image posts). This bridge surfaces them in the
PWA — Real Estate → property records → "📷 Property Photos from Chat →
Browse & file to rooms" — where the family assigns each photo to a room. The
room gallery then shows the transformation over the years. Nothing files
itself: the user picks the room and taps Add.

## How it maps photos without copying anything

Each chat image post carries the original camera filename (e.g.
`20241206_081632.jpg`). Synology already keeps a ~20KB thumbnail beside every
backed-up photo at `.../<Y>/<M>/@eaDir/<name>/SYNOFILE_THUMB_M.jpg`. The
resolver parses the capture date out of the filename (`20241206` → 2024/12),
finds that thumbnail in PhotoBackup, and base64-encodes it. **The originals
are never read or moved** — only Synology's existing small preview. Photos
with non-standard names (screenshots, other devices not backed up here) come
back `thumb=null` and show "not in backup" — listed honestly, not broken.
Resolution rate in testing: 24/24 of standard-named photos resolved.

## Contract

- **Endpoint:** `GET /webhook/property-photos?channel=<short-addr>&limit=<n>&offset=<n>`
  (reached via the same-origin `/n8n` rewrite; bearer-token header auth, the
  same family token as the history bridge).
- **Response:** `{ count, photos: [{ id, date, name, text, thumb }] }`, newest
  first. `thumb` is a data URL or null. `text` is the original chat message.

## NAS pieces

- `property-photos.py` — `/volume1/PoeTech/scripts/property-photos.py`. Runs
  as dpoe (reads the PhotoBackup thumbnails directly); psql elevated via
  `sudo -n -u postgres`. Forced-command target for the `n8n-property-photos`
  key (the only command that key can run; whitelist-validates channel,
  int-bounds limit/offset, locates the `photos` verb even when n8n prefixes
  `cd /tmp ;`).
- `wf-property-photos.json` — n8n workflow `wfPropPhotos001`: Webhook (header
  auth) → Build-args Code node (sanitizes query → one `photos <ch> <lim>
  <off>` command) → SSH (photos key) → Parse → Respond.

## Gotchas learned (2026-06-11)

- **n8n's SSH node with `cwd` set prepends `cd <cwd> ;` to the command.** That
  shifted the verb position and made the resolver read `cd` as the verb.
  Fix: removed `cwd` from the SSH node AND made the resolver locate the
  `photos` token rather than assume argv[0]. (The history bridge survived this
  only by luck — it reads the *last* token.)
- **sudo strips `SSH_ORIGINAL_COMMAND`.** The first design wrapped the script
  in `sudo python`; it lost the command. Final design runs python as dpoe
  directly (dpoe can read the thumbnails) and only elevates the psql call.
- Dev: `app/vite.config.js` now proxies `/n8n` → the NAS so the bridges work
  in `vite dev` exactly as the production Vercel rewrite serves them.
