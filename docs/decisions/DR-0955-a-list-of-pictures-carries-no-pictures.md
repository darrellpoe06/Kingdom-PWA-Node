# DR-0955 — A list of pictures carries no pictures

**Date:** 2026-10-11 · **Status:** Accepted · **Declared by:** Darrell
**Code:** `app/src/modules/properties/cloud.js`, `app/src/modules/properties/SharpPicture.jsx`, `app/src/modules/properties/PropertiesApp.jsx`, `app/src/components/Rentals.jsx`
**Gates:** `app/src/__tests__/a-list-of-pictures-carries-no-pictures.test.jsx`, `app/src/__tests__/property-photos-list-carries-no-bytes.test.js`

## Context

Darrell, 2026-10-11: **"Are images stored on/in the nas?"**

They are — but inside the Postgres row as a base64 data URL in
`property_photos.storage_path`, not as files on disk. I said so, and recommended
moving the bytes to the NAS file server at `/nas-photos`. He answered:

> **"Can we fix it?!!!!!"**

**My recommendation was wrong on timing, and I said so before building.**
`/nas-photos` is itself a Cloudflare Pages Function
(`app/functions/nas-photos/[[path]].js`), and site-health names it in the dark
list verbatim — every NAS-backed road is out together while #2057 lasts. Moving
the photographs there today would move them from a slow road to a dead one.

So this record is the fix on the road that **does** work, and the file-server
move stays queued rather than abandoned (below).

This also answers two earlier reports that were the same defect seen from
different sides: *"Properties tab in PoeTech App is frozen!!!!!!!"* and *"The
flow of uploading pictures is not working well... it keeps flashing... and
pausing the coming back with new images about 20 seconds later."*

## What was measured

**`thumb_path` is an image.** It holds the same base64 data URL as
`storage_path`, written at upload 640 px wide at 75% JPEG (`THUMB_MAX_WIDTH` /
`THUMB_QUALITY`, DoorTabs.jsx:1281). Encoding photographic content at exactly
those settings, measured locally:

| content | JPEG | as base64 |
|---|---|---|
| smooth interior | 36 KB | **47 KB** |
| ordinary detailed interior | 46 KB | **60 KB** |

Call it **~55 KB a row**. Against that:

- `loadAllPhotos` reads **every unarchived picture across every door on every
  boot** of the Properties tab, to choose one cover per door. His board holds
  **67 rows** today → **~3.6 MB in one response**, growing ~55 KB with every
  photograph he takes.
- One door's gallery is the same shape smaller: **Room 1 - Bed A carries 39
  pictures** → **~2.1 MB**.
- `boundedRead` gives up at **6 s** (`READ_TIMEOUT_MS`), and with Pages
  Functions dark the client is on the **absolute Funnel URL**, which CLAUDE.md's
  own standing note says throttles cross-origin.

**A gate was holding half a fix in place.** 0185 / DR-0303 took `storage_path`
out of every list and put `thumb_path` in, and
`property-photos-list-carries-no-bytes.test.js:57` **pinned that trade**:
`expect(cols).toContain('thumb_path')`. It was green the whole evening the tab
froze. A test that requires the defect is worse than no test, because it
defends it (DR-0076 §3).

## Impact

The freeze and the flashing are the same read. 3.6 MB arrives after the UI has
stopped waiting for it, the screen draws what it has — nothing — and then the
late answer lands and repaints: *"pausing the coming back with new images about
20 seconds later"* is that response, described exactly.

And when it does not arrive at all, the surface says the door is empty. That is
DR-0946's invented absence, with the weight of the read as its cause rather
than a dropped `.ok`.

## Decision

1. **The list is metadata, full stop.** No `storage_path`, **and no
   `thumb_path`** — no image column of any size. 67 rows of ids, kinds,
   captions and timestamps is tens of kilobytes and the board opens at once.
2. **Thumbnails ride the road that already works.** `loadPhotoThumbs(ids)` is
   the only read of `thumb_path`, by id, bounded at `PHOTO_THUMB_BATCH = 12`
   (~660 KB) — smaller than the full-image batch of 24, because the point is an
   answer that arrives.
3. **A tile fetches its own thumbnail when it comes into view**, through the
   IntersectionObserver, cache and 3-at-a-time queue `SharpPicture` already had
   for full images. One queue, two caches.
4. **A tile with nothing yet holds its place.** It used to `return null`, which
   was harmless only while the list carried a thumbnail. Now it would be two
   defects: the observed element would never exist, so nothing would ever be
   asked for; and the grid would reflow under his thumb as pictures landed.
5. **A row from before 0185 falls through to its full image.** `loadPhotoThumbs`
   leaves such a row **out** rather than recording it as empty, so "no
   thumbnail exists" stays tellable apart from "I did not ask" (DR-0946).
6. **No picture is fetched at boot — not one.** Both boot-time hydrates are
   gone, including a second bounded read that cost 2.5 s before the board could
   draw.
7. **`hydrateLegacyImages` is removed, and that is part of the fix.** It found
   pre-thumbnail rows by asking `!p.thumb_path`; with that column out of the
   list every row answers yes, so it would have fetched twenty-four **full**
   images (~300 KB each, ~7 MB) every boot — the same defect, eight times
   heavier.
8. **The Real Estate strip fetches thumbnails too.** It drops any item with no
   `src`, so the column change alone would have made every Poe Properties
   picture **silently disappear** from that view. It now batches through them,
   painting as each batch lands.
9. **"No photo" on the Doors board is a fact about the door, not about the
   read.** All three cover tiles asked `listImage(x.cover)` — do the bytes
   happen to be in hand — so the column change alone would have made **every
   door on the board** read "No photo" permanently. They now ask `x.cover`:
   does this door have a cover at all. This was already wrong before today — a
   door whose only pictures predate 0185 read as having none.

## Verification

**16 new behavioural cases green** (10 in a new mounted suite, 6 added to the
pinning one), with a controllable `IntersectionObserver` so "off screen" is a
real state rather than an assumption. 136 green across the Properties suites
that touch these surfaces. Lint clean; legibility, interconnect,
monolith-budget, business-systems and decision-record guards pass.

**Proven to catch — six breaks, each at the source of a distinct defect:**

| break | caught by |
|---|---|
| restore `if (!src) return null` | 3 cases, incl. *"asks for NOTHING while it is off screen"* — with no element the observer's no-observer branch fires and **every** tile fetches at once |
| drop the no-thumbnail fall-through | *"a row from BEFORE 0185 ... falls through to its full image"* — `['thumb:old']` vs `['thumb:old', 'full:old']` |
| fetch without waiting for visibility | 2 cases — `['p1']` vs `[]` |
| put `thumb_path` back in the list | *"names NO image column at all"* |
| strip stops reading the fetched thumbs | *"the Real Estate strip FETCHES the thumbnails it no longer gets in the list"* |
| cover tiles gated on `listImage` again | *""No photo" on the board is a fact about the DOOR"* |

**One assertion of my own was wrong and is named here** rather than quietly
fixed: the board test first asserted `TABS` contained no `listImage` anywhere,
which the comment explaining the change trips by naming the old call. It checks
the import instead, which is the property that matters.

**Not proven from this sandbox:** the live tab on his phone after deploy. The
measurement that matters is whether the Properties tab opens without freezing
and Bed A's 39 pictures fill in; that is a live-build check.
**re-review: 2026-10-18.**

## Still queued, not abandoned

**The photographs belong in files on the NAS, not in database rows.** That is
the structural answer and this record does not reach it: it is blocked behind
the Cloudflare Pages Functions outage (#2057), which needs Darrell's hands in
the dashboard, because `/nas-photos` is dark with every other NAS road. When
that road is back, the bytes move and `storage_path` becomes a path again
rather than a payload. **re-review: 2026-10-18**, with #2057.

**A micro-batcher for the visible set** would turn a screenful of tiles into one
`loadPhotoThumbs` call instead of several. Not built: each small request now
succeeds or fails on its own, which on a throttling road is the behaviour that
got the page back. Worth measuring once the tab is proven unfrozen —
**re-review: 2026-10-25**.
