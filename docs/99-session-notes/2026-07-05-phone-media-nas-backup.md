# 2026-07-05 — Phone → NAS media backup (photos + videos)

**Trigger.** Darrell, with two screenshots (the Big Picture tab and his phone's
file manager full of camera photos): *"Can this app upload and give me the
option of moving all my photos and videos to my server or nas etc and or sync
so I can get a new phone and all my images and videos are safe on the nas
using the PoeTech App? If not we want that functionality."*

**Honest answer at the start of the session: no.** The Big Picture fine print
said it itself — photos lived on the one device; NAS backup was "coming next."
And there was **no video path anywhere**: the R15 write lane
(`wf-photo-upload`) is JSON/base64 through n8n, capped at 8 MB, image-only.

## What shipped

1. **Server** (`infra/nas-property-photos/photo_server.py`, the sovereign
   Python server that already serves property photos): three new bearer-gated
   endpoints — `GET /media-exists` (dedup), `GET /media-upload-status`
   (resume), `POST /media-upload` (raw ~6 MB chunks, offset-checked appends,
   409-carries-the-real-offset resume). Completion magic-byte-checks the file
   (photo + video families), then moves it to
   `/volume1/PoeTech/phone-backup/<device>/<YYYY>/<MM>/<name>`. Same-name-
   same-size = dedup; same-name-different-size = uniquified — never clobbered.
   Followed the 2026-07-01 precedent: raw bytes belong on the deterministic
   Python lane, not an n8n JSON hop.
2. **Client lib** (`app/src/lib/media-backup.js`): the chunk protocol, a
   per-device ledger of what the NAS **verified** (byte count confirmed —
   DR-0076: no byte match, no checkmark), deterministic upload ids so an
   interrupted upload resumes across app restarts, and client-side mirrors of
   the server sanitizers.
3. **Surface** (`app/src/components/PhoneBackup.jsx`, on Big Picture above the
   Life Gallery): pick photos+videos or a whole folder (Android Chrome
   directory picker, recursive), watch verified progress, stop any time,
   re-run cheaply (ledger + NAS dedup skip everything already safe). Honest
   states: renders nothing without the bridge token; detects a NAS still on
   the pre-media server build and says the one-line redeploy is needed.
4. **Proxy parity**: `app/functions/nas-photos/[[path]].js` — the Cloudflare
   Pages Function for `/nas-photos` (only `/n8n` had one; the CF migration
   would have stranded property photos AND this lane).
5. **UiIcon additions**: `shield`, `upload`, `folder` (the consistency gate
   correctly refused new device-font emoji).

## Verified (measure, don't claim)

- `photo_server.py --selftest`: 53/53 (31 new checks: sanitizers, magic
  bytes, containment, locks).
- Live local end-to-end: chunked upload assembled **byte-identical** (`cmp`),
  replayed chunk 409→resume worked, junk (exe magic) rejected with nothing
  stored, dedup check flipped false→true after completion.
- App suite: 4,492 tests green (30 new: protocol, resume, 409-adopt,
  size-mismatch-refuses-checkmark, honest render states).
- NOT yet verified: the production chain (poetech.us → Funnel → NAS) — that
  needs the NAS redeploy (steps + PowerShell block in
  `infra/nas-property-photos/README.md`). The card reports "needs the update"
  honestly until then.

## The honest limit (unchanged from 2026-06-11)

A PWA cannot background-sync the camera roll. This is the foreground
pick-and-verify lane (bulk folder included); the Synology Photos app remains
the automatic every-new-shot path — the card says so on-surface. The
"new phone" flow this enables: run the card until it shows 0 left, read the
verified count, switch phones.

## Release tier

Tier B (new user-facing feature): soak on the branch preview before merge.
