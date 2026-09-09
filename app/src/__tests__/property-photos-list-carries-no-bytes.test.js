// =============================================================================
// A picture list never carries the bytes — and a worker can file to a vacant door
// =============================================================================
// Darrell, 2026-09-08, on his way to photograph 805 North Prospect Apt 2 while
// Corion (1099) installs a microwave and ductwork: pictures in the property
// section AND the rentals section, workers able to add them, and "we don't want
// them to be so big that it overruns and undermines our process."
//
// The overrun he remembers is DR-0303: on 2026-08-14 every account was locked
// out because one list (`feedback`, `.select('*')`, no limit) carried 6.2 MB of
// base64 once per sign-in. property_photos keeps its image IN THE ROW on
// purpose (RLS for free), so the same shape was one boot away: the Doors board
// read every picture's full bytes on every open just to choose a cover per
// door, and would have grown with every picture taken today.
//
// PROVEN-TO-CATCH (DR-0076 §3), each deliberately at the SOURCE where the
// defect lives, because a test double returns the same objects for a wide and
// a narrow select — what broke was what went over the wire:
//   • putting 'storage_path' into PHOTO_LIST_COLUMNS fails "names no image column";
//   • restoring `.select('*')` in either list loader fails "both lists read the named columns";
//   • raising the batch or dropping the refusal in loadPhotoImages fails the bound cases;
//   • dropping thumb_path from the migration, or granting UPDATE on it, fails the migration pins;
//   • removing the door-level docs.add arm, or its uploaded_by check, fails the policy pins;
//   • the grid drawing storage_path again fails "the gallery draws thumbnails".
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PHOTO_LIST_COLUMNS, PHOTO_IMAGE_BATCH, loadPhotoImages, hydrateLegacyImages,
} from '../modules/properties/cloud.js';
import { pickCovers, listImage } from '../modules/properties/photo-order.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(HERE, rel), 'utf8');
const CLOUD = read('../modules/properties/cloud.js');
const TABS = read('../modules/properties/DoorTabs.jsx');
const RENTALS = read('../components/Rentals.jsx');
const MIGRATION = read('../../../infra/supabase/migrations-auto/0185-a-picture-list-never-carries-the-bytes-and-a-worker-can-file-to-a-vacant-door.sql');
/** SQL with `--` comments removed, so prose is never measured as code. */
const SQL = MIGRATION.split('\n').map((l) => l.replace(/--.*$/, '')).join('\n');

/** A fake PostgREST client that records what was asked and answers from `rows`. */
function fakeClient(rows) {
  const asked = [];
  const chain = {
    select(cols) { asked.push({ select: cols }); return chain; },
    in(col, ids) { asked.push({ in: [col, ids] }); return Promise.resolve({ data: rows.filter((r) => ids.includes(r.id)), error: null }); },
  };
  return { asked, from: () => chain };
}

describe('the list columns', () => {
  it('names no image column — the list never carries the bytes (DR-0303)', () => {
    const cols = PHOTO_LIST_COLUMNS.split(',').map((c) => c.trim());
    expect(cols).not.toContain('storage_path');
    expect(cols).toContain('thumb_path');
    // Everything the board, the gallery, the timeline and the room board read.
    for (const c of ['id', 'rental_ref', 'tenancy_id', 'room_id', 'kind', 'caption', 'taken_at', 'uploaded_at', 'archived_at', 'sort_order']) {
      expect(cols).toContain(c);
    }
  });

  it('both list loaders read the named columns, never *', () => {
    const doorAt = CLOUD.indexOf('export async function loadDoorPhotos');
    const loadDoor = CLOUD.slice(doorAt, CLOUD.indexOf('export async function', doorAt + 1));
    const loadAll = CLOUD.slice(CLOUD.indexOf('export async function loadAllPhotos'), CLOUD.indexOf('export async function loadAllPhotos') + 700);
    expect(loadDoor).toMatch(/select\(PHOTO_LIST_COLUMNS\)/);
    expect(loadDoor).not.toMatch(/select\('\*'\)/);
    expect(loadAll).toMatch(/select\(PHOTO_LIST_COLUMNS\)/);
    expect(loadAll).not.toMatch(/storage_path/);
  });

  it('storage_path is read in exactly one place in the module: the by-id image fetch', () => {
    const reads = CLOUD.match(/select\('[^']*storage_path[^']*'\)/g) || [];
    expect(reads).toEqual(["select('id, storage_path')"]);
  });
});

describe('the full image, by id, bounded', () => {
  const rows = [
    { id: 'a', storage_path: 'data:image/jpeg;base64,AAAA' },
    { id: 'b', storage_path: 'data:image/jpeg;base64,BBBB' },
  ];

  it('returns the bytes keyed by id, and only for the ids asked', async () => {
    const c = fakeClient(rows);
    const r = await loadPhotoImages(['a', 'a', null], c);
    expect(r.ok).toBe(true);
    expect(r.images).toEqual({ a: 'data:image/jpeg;base64,AAAA' });
    expect(c.asked.find((x) => x.in)).toEqual({ in: ['id', ['a']] });
  });

  it('asks for nothing when given nothing', async () => {
    const c = fakeClient(rows);
    const r = await loadPhotoImages([], c);
    expect(r).toEqual({ ok: true, images: {} });
    expect(c.asked).toEqual([]);
  });

  it('REFUSES more than one batch rather than silently rebuilding the unbounded list', async () => {
    const c = fakeClient(rows);
    const many = Array.from({ length: PHOTO_IMAGE_BATCH + 1 }, (_, i) => `id-${i}`);
    const r = await loadPhotoImages(many, c);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('too-many-at-once');
    expect(c.asked).toEqual([]);
    expect(PHOTO_IMAGE_BATCH).toBeLessThanOrEqual(24);
  });

  it('hydrates only the rows from before thumbnails existed, and never mutates its input', async () => {
    const c = fakeClient(rows);
    const list = [
      { id: 'a', thumb_path: null },                               // pre-0185: needs its image
      { id: 'b', thumb_path: 'data:image/jpeg;base64,tttt' },     // has a thumbnail: costs nothing
    ];
    const out = await hydrateLegacyImages(list, c);
    expect(c.asked.find((x) => x.in)).toEqual({ in: ['id', ['a']] });
    expect(out[0].storage_path).toBe('data:image/jpeg;base64,AAAA');
    expect(out[1]).not.toHaveProperty('storage_path');
    expect(list[0]).not.toHaveProperty('storage_path');
  });

  it('with nothing legacy in the list, makes no request at all', async () => {
    const c = fakeClient(rows);
    await hydrateLegacyImages([{ id: 'b', thumb_path: 'data:image/jpeg;base64,tttt' }], c);
    expect(c.asked).toEqual([]);
  });
});

describe('covers from metadata alone', () => {
  const P = (id, rental_ref, over = {}) => ({ id, rental_ref, kind: 'damage', taken_at: '2026-09-01T00:00:00Z', ...over });

  it('picks one per door without needing a single image byte', () => {
    const m = pickCovers([P('a', 'u1'), P('b', 'u1', { kind: 'listing' }), P('c', 'u2')]);
    expect([...m.keys()].sort()).toEqual(['u1', 'u2']);
    expect(m.get('u1').id).toBe('b');   // a listing shot beats a condition shot
    expect(m.get('u2').id).toBe('c');
  });

  it('a placed picture is the cover over any unplaced one, lowest first', () => {
    const m = pickCovers([P('a', 'u1', { kind: 'listing' }), P('b', 'u1', { sort_order: 20 }), P('c', 'u1', { sort_order: 10 })]);
    expect(m.get('u1').id).toBe('c');
  });

  it('never picks an archived picture or one with no door', () => {
    const m = pickCovers([P('a', 'u1', { archived_at: '2026-09-02' }), P('b', null)]);
    expect(m.size).toBe(0);
  });

  it('a list image is the thumbnail, else hydrated bytes, else nothing — never invented', () => {
    expect(listImage({ thumb_path: 't', storage_path: 's' })).toBe('t');
    expect(listImage({ storage_path: 's' })).toBe('s');
    expect(listImage({})).toBe('');
    expect(listImage(null)).toBe('');
  });
});

describe('the surfaces', () => {
  it('the gallery draws thumbnails and writes one beside every new picture', () => {
    const gallery = TABS.slice(TABS.indexOf('export function GalleryTab'), TABS.indexOf('function PhotoEditor'));
    expect(gallery).toMatch(/<img src=\{listImage\(p\)\}/);
    expect(gallery).toMatch(/thumb_path: pic\.thumbUrl/);
    expect(gallery).not.toMatch(/<img src=\{p\.storage_path\}/);
  });

  it('the board reads covers through the pure picker and the list image', () => {
    const board = TABS.slice(TABS.indexOf('export function DoorsBoard'), TABS.indexOf('export function GalleryTab'));
    expect(board).toMatch(/pickCovers\(photos\)/);
    expect(board).not.toMatch(/cover\?\.storage_path/);
  });

  it('the camera opens directly, and a picture taken here is stamped when the shutter fired', () => {
    expect(TABS).toMatch(/capture="environment"/);
    expect(TABS).toMatch(/pick\(e\.target\.files, \{ captured: true \}\)/);
    expect(TABS).toMatch(/takenAt: captured \? new Date\(\)\.toISOString\(\) : null/);
  });

  it('the Real Estate strip reads the same pictures by the door\'s cloud id, thumbnails first', () => {
    const strip = RENTALS.slice(RENTALS.indexOf('function PropertyGallery'), RENTALS.indexOf('function PropertyGallery') + 6000);
    expect(strip).toMatch(/rental\.remoteUuid/);
    expect(strip).toMatch(/loadCloudDoorPhotos\(cloudRef\)/);
    expect(strip).toMatch(/cloudListImage\(p\)/);
    expect(strip).toMatch(/loadCloudPhotoImages\(\[p\.cloudId\]\)/);
  });
});

describe('migration 0185', () => {
  it('adds the thumbnail column beside the image', () => {
    expect(SQL).toMatch(/ALTER TABLE public\.property_photos ADD COLUMN IF NOT EXISTS thumb_path text/);
  });

  it('never lets the thumbnail be rewritten — it is not in any UPDATE grant', () => {
    expect(SQL).not.toMatch(/GRANT UPDATE[^;]*thumb_path/);
    // And the earlier column-level grants stay exactly as narrow as they were.
    const g0154 = read('../../../infra/supabase/migrations-auto/0154-photo-captions-editable-and-archivable.sql');
    expect(g0154).toMatch(/GRANT UPDATE \(caption, room_id, kind, archived_at, archived_by\) ON public\.property_photos/);
  });

  it('reaches a DOOR through a delegated capability, in 0075\'s own vocabulary', () => {
    expect(SQL).toMatch(/CREATE OR REPLACE FUNCTION public\.user_delegated_can_rental\(p_rental uuid, p_capability text\)/);
    expect(SQL).toMatch(/SECURITY DEFINER/);
    expect(SQL).toMatch(/SET search_path = public/);
    expect(SQL).toMatch(/dc\.setting\s*=\s*'allow'/);
    expect(SQL).toMatch(/dc\.scope_ref = r\.slug OR dc\.scope_ref = '\*'/);
    expect(SQL).toMatch(/REVOKE ALL ON FUNCTION public\.user_delegated_can_rental\(uuid, text\) FROM PUBLIC/);
  });

  it('lets a docs.add delegate FILE a picture to the door, as himself, and nothing more', () => {
    const ins = SQL.slice(SQL.indexOf('CREATE POLICY property_photos_delegate_insert'), SQL.indexOf('property_rooms_delegate_read'));
    expect(ins).toMatch(/FOR INSERT TO authenticated/);
    expect(ins).toMatch(/rental_ref IS NOT NULL/);
    expect(ins).toMatch(/uploaded_by = auth\.uid\(\)/);
    expect(ins).toMatch(/user_delegated_can_rental\(rental_ref, 'docs\.add'\)/);
    // No door-level UPDATE or DELETE for a delegate: he files evidence, he
    // does not re-caption or archive the landlord's record.
    expect(SQL).not.toMatch(/property_photos_delegate_update/);
    expect(SQL).not.toMatch(/FOR DELETE/);
  });

  it('is ADDITIVE — the 0153/0154 policies are not rewritten, so nothing is loosened', () => {
    expect(SQL).not.toMatch(/DROP POLICY IF EXISTS property_photos_read\b/);
    expect(SQL).not.toMatch(/DROP POLICY IF EXISTS property_photos_insert\b/);
    expect(SQL).not.toMatch(/DROP POLICY IF EXISTS property_photos_update\b/);
    expect(SQL).not.toMatch(/DROP POLICY IF EXISTS rentals_member_read\b/);
  });

  it('makes the door itself visible to the person delegated to it, read only', () => {
    const pol = SQL.slice(SQL.indexOf('CREATE POLICY rentals_delegate_read'), SQL.indexOf('property_photos_delegate_read'));
    expect(pol).toMatch(/ON public\.rentals FOR SELECT TO authenticated/);
    expect(pol).toMatch(/user_delegated_can_rental\(id, 'docs\.add'\)/);
    expect(SQL).not.toMatch(/rentals_delegate_(insert|update|delete)/);
  });

  it('re-applies the viewer and assistant overlays after touching policies (0153 precedent)', () => {
    expect(SQL).toMatch(/SELECT public\.apply_viewer_readonly_overlay\(\);/);
    expect(SQL).toMatch(/SELECT public\.apply_assistant_scope_overlay\(\);/);
  });
});
