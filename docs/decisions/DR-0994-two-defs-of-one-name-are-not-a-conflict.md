---
id: DR-0994
title: Two defs of one name are not a conflict — the phone-backup lane drained, and the silent-shadow class gated
date: 2026-10-13
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0990]
tier: B
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, HOLD-THE-HAND-OF-THE-PROCESS, APP-IS-THE-PRIMARY-ARTIFACT]
source: 2026-07-05 — Darrell, asking for the thing this lane does; drained 2026-10-13 under DR-0990
---

## Context

Darrell, 2026-07-05:

> *"Can this app upload and give me the option of moving all my photos and
> videos to my server or nas ... so I can get a new phone and all my images and
> videos are safe?"*

PR #593 answered that the same day, green, Tier B, "soak on this branch's
preview before merge" — and then sat open for **100 days**. It was the oldest
`DRAIN` verdict in the triage DR-0990 built, so it is the one drained here.

Before it, the honest answer to his question was no: the Big Picture fine print
said photos live on this device only, and there was no video path anywhere.

## What the drain actually cost

Four files conflicted, five hunks — far less than 100 days suggested, and the
real hazards were in the files that merged **clean**.

| file | resolution |
|---|---|
| `functions/nas-photos/[[path]].js` | **main's**, outright — the shared `makeFunnelProxy` factory (2026-07-30) superseded the PR's hand-rolled copy and buffers bodies identically |
| `LifeGallery.jsx` | main's rem-based `text-[0.625rem]` class + the PR's copy, which is now true |
| `legibility-health.json` | `resolve-ledger-conflicts.mjs` (DR-0644), regenerated — 320/333 |
| `photo_server.py` | both sides kept; both hunks were independent blocks added at one seam |

## The finding: a clean merge that would have shipped a silent 404

**The phone-media lane was authored as a second `do_POST` on the handler.**
main grew its own `do_POST` in the meantime (`/upload`,
`/property-photo-remove`). Git merged the two **without a conflict** — two
defs of one name are not overlapping text — and Python keeps only the later
def. One entire half of the write path would have answered 404 on a live NAS
while the 85-check selftest, every app test, and every gate stayed **green**.

Two more of the same class, both in files with no conflict marker:

- `album-photos` lost its `return` to the seam and fell through to the 404
  branch — a **double send** on an already-answered request.
- `UiIcon.jsx` carried **two `upload` keys**: DR-0709's Books arrow and the
  PR's, the same arrow-rising-from-a-tray. The PR's is dropped; the card
  shares DR-0709's.

Nothing routes through n8n: the two flagged references were prose naming the
retired lane, and `business-systems-guard` was right to stop them. They are
reworded rather than allowlisted — the allowlist's own comment forbids growing
it for a drive-by, and these files are sovereign from birth. It stays at **3**.

## What is now gated

The JS half of this class **was already caught**: eslint `no-dupe-keys` failed
`UiIcon.jsx` at 215:3. The Python half had no equivalent, so `--selftest` gains
one, and it is the general class, not this instance: **no method or function is
defined twice in one scope**, read from the file's own AST, no NAS and no
network. It runs at `ci.yml:285` and in `nas-deploy-property-photos.sh`, so it
fails the build and blocks a deploy.

**Proven-to-catch (DR-0076 §3):** 86/86 on the merged tree; restoring the exact
shape the merge produced fails with `FAIL no method or function is defined twice
in one scope (shadowed: Handler.do_POST)`, exit 1, 85/86.

## What ships

`GET /media-exists` (dedup before a byte moves), `GET /media-upload-status`
(resume point), `POST /media-upload` (raw ~6 MB chunks, offset-checked appends,
a 409 carrying the part's real size so a replay is a no-op). Completion is
magic-byte gated; junk is deleted, never stored. Files land at
`/volume1/PoeTech/phone-backup/<device>/<YYYY>/<MM>/<name>`; same-name-same-size
dedups, same-name-different-size uniquifies — never clobbered. A file is marked
safe only when the NAS confirms the exact byte count (DR-0076).

## The leak the lane shipped with, closed in the same change

A `.part` is removed on completion, on a magic-byte rejection and on a bad
destination — but **not when an upload is simply abandoned**: the tab closes,
the phone sleeps, the network goes for good, or the file is deleted off the
phone before the backup is re-run. Nothing ever swept them, and each is up to
`MAX_MEDIA_BYTES` (4 GB), so the lane built to protect the family's media would
slowly fill the volume holding it.

Eager deletion is the wrong fix — resume across sessions is the whole design,
and it is what makes "safe to switch phones" cheap to re-run. So:
`sweep_stale_parts()` takes only regular `*.part` files directly inside
`.parts/` whose mtime is past a 14-day window; a symlink, a directory and any
other name are left alone. It never raises — a sweep that cannot run must not
take the upload path down with it. It runs once at service start (so a restart
reclaims the volume, and says how much) and once per new upload, not per chunk.

**Proven-to-catch in both directions, on a real temp tree** — a mocked
`os.remove` would prove nothing about files on disk. Too eager (age check
removed) fails *"sweep LEAVES a part still inside the resume window"*; too timid
(`os.remove` → `pass`) fails *"sweep takes the abandoned part"*. 92/92 green.

## The honest limit, stated on the card

A PWA cannot background-sync the camera roll. This is the foreground
pick-and-verify lane, bulk folder included; Synology Photos remains the
automatic every-new-shot path.

**Not verified from here:** the production chain (poetech.us → Funnel → NAS)
needs the NAS redeploy — steps and a paste-from-anywhere PowerShell block are in
`infra/nas-property-photos/README.md`, and the card reports "needs the update"
honestly until then rather than pretending. `re-review: 2026-10-20` — whether
the redeploy has run and a real photo and a real video have made the trip.
