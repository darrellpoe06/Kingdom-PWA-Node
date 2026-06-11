# 2026-06-11 — Room memory, tenant turnover, and the NAS image-ingest plan

Source: Darrell, 2026-06-11. Verbatim intent, organized into the data-model
decision + a project spec. Nothing invented.

## The decision Darrell made: property memory vs. tenant memory

> "Tenants should be able to move in without having to deal with the last
> tenants issues because they are not remembered. all text about a room or
> bathroom are remembered. Landlords should have records of their own to
> pull up for any necessary situation."

This draws a permanent line in the rental data model:

- **PROPERTY MEMORY — remembered for every tenant, forever.** Rooms, room
  notes, room photos (the transformation timeline), equipment, and the
  maintenance log. These describe the physical asset, not the occupant.
- **TENANT MEMORY — does NOT carry to the next tenant.** Tenant name +
  contacts, the lease, the tenant/vendor conversation log, and open issues.
  On turnover these ARCHIVE under Past Tenancies (the landlord keeps every
  record for clarification) and open issues close out of the active queue —
  the new tenant starts clean.

**Shipped this session (verified in preview):**
- Per-room **photo gallery** (date-stamped, captioned, oldest-first so the
  transformation reads as a timeline) + a persistent **room note**, both on
  the room record in Real Estate → property → Rooms.
- **Tenant turnover** button: archives the tenant record + closes their open
  issues into Past Tenancies, clears tenant/lease/conversation, sets status
  unrented — and KEEPS rooms, photos, notes, equipment, maintenance.
  Verified: after turnover, room + note + photo survived; tenant data
  cleared; 2 open issues closed + archived.
- Photo compression extracted to `app/src/lib/image.js`, shared by room
  galleries and the maintenance log (one helper, no duplication).

Photos are device-local data URLs (compressed ~1280px) today, so they ride
the existing rental record. Bulk history (below) is the next project.

## Project: NAS image ingest — 805 N Prospect transformation photos

**Goal (Darrell):** the images on the NAS for 805 N Prospect (apt 1/2/3/4,
bathroom / living room, etc.) land in the app under the matching property +
room so the family and future users see the transformations over the years
and learn from them.

**Raw material located on the NAS this session (read-only recon):**
- The **805NProspect Synology Chat channel holds 1,582 image posts**
  (`synochat` DB, `posts.file_props` JSON: `is_image`, `name`,
  `image.{width,height}`, `mtime`). Filenames carry capture dates
  (`20241206_080905.jpg`).
- The image bytes live in SynologyDrive PhotoBackup, organized by
  date, e.g.
  `/volume1/homes/cpoe/Drive/PhotoBackup/Christina's Note20 Ultra/DCIM/Camera/2024/12/20241206_080905.jpg`
  (also mirrored under `/volume1/@appdata/ContainerManager/all_shares/homes/...`).
  Synology Chat's own store is under `/volume1/chat` + `/volume1/@apphome/Chat`.

**Why it's its own project, not a same-session ship:** 1,582 images need
(a) a per-image bridge that serves a thumbnail + metadata (date, channel,
original message text) — extending the property-history bridge already live
on the NAS; (b) apartment + room attribution (a chat channel maps to a
building, not to apt 4's bathroom — the message text and image content carry
that, so attribution needs the family in the loop, exactly like the text
import); (c) dedup + size management (1,582 full photos cannot all become
data URLs in localStorage — this needs a thumbnail-on-NAS + lazy-load
approach, or the move off data URLs to a sovereign object store). Rushing it
unverified would violate the QC standard the founder set.

**Build plan (next session, with NAS access):**
1. Extend the bridge: `GET /webhook/property-photos?channel=<short-addr>` →
   JSON list of `{ id, ts, date, originalText, thumbUrl }`, thumbnails
   served from a resized cache the workflow builds under
   `/volume1/PoeTech/property-photos/<channel>/` (read-only toward
   PhotoBackup; never mutates the originals). Token-gated like the text
   bridge.
2. PWA: a "📥 Import room photos from NAS" action per property that stages
   the channel's photos in a grid; the family taps each one to assign
   apartment + room (or skip), with the original message text shown as the
   caption hint. Only accepted photos file to that room's gallery. Dedup by
   source id; re-import safe.
3. Decision needed before step 2 scales: photos stay as compressed data
   URLs (simple, syncs, but localStorage-bounded) vs. move to a sovereign
   object store the app references by URL (scales to thousands, needs the
   storage decision in `project_supabase_cloud_is_live_backend` context).
   Recommend: thumbnails as data URLs in-app, full-res stays on the NAS,
   opened via the token-gated bridge on tap.

**Privacy (Darrell: "protection and data access for the users good"):**
binds to DATA-AS-EMPOWERMENT — the photo bridge is token-gated and
landlord-scoped; tenant-facing views (when they exist) never see prior
tenants' archived records or another unit's photos; PhotoBackup originals
are never modified, only read into a resized cache.

## Captured, not yet built: Wyze surveillance (project #7 from 2026-06-10)

> "I also have live stream wyze cameras at 805 apartments and at my home."

Wyze export footage already lands on the NAS
(`/volume1/docker/SSCamExport_Wyze Cam V2`, observed 2026-06-10) — a
sovereign recorded-clip path exists before any live-stream work. Live
streaming is the hard part: Wyze has no clean public API; the realistic
sovereign routes are (a) Wyze RTSP firmware → restream through the NAS, or
(b) Synology Surveillance Station as the camera hub the app embeds. Tab
structure (family / landlord / business each see only their own cameras)
and VISION-FAIRNESS-STANDARD (anything recognizing people) bind. Stays a
Tier C research-first project; not rushed.
