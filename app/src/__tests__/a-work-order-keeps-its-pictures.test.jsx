// @vitest-environment jsdom
// =============================================================================
// A work order keeps its pictures, a note carries them, and a name typed once
// is offered after (DR-1235, migration 0310)
// =============================================================================
// Darrell, 2026-10-27, from his phone on Big Picture → Work order triage
// (#13 "Exhaust Fan and microwave installation inside apartment 2", CHECK IT):
// "Need to be able to upload pictures to the workorders and notes for images"
// and "when adding a new name for an image it should be automatically one of
// the options moving forward".
//
// The pure halves, the data wall pinned at the text with its CI proof, and
// the screens MOUNTED and tapped (react-dom/client + act): the triage detail
// with its 44px camera control, the pictures under a note, a new name
// remembered once a picture carrying it is saved, a refused save that says so
// (proven to catch), an incident's picture, and the gallery's caption box
// offering the names already given.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
vi.mock('../lib/image.js', () => ({
  compressImageFile: async () => 'data:image/jpeg;base64,AAAA',
  isLikelyImageFile: () => true,
  fileToDataUrl: async () => 'data:image/jpeg;base64,AAAA',
}));

const {
  mergePictureNames, isNewPictureName, kindForPictureName, buildWorkOrderPhotoRow, canCarryPictures,
  picturesOf, picturesOnNote, loosePictures, savedLine, pictureNameKey, newNoteId, PICTURE_NAME_DEFAULTS,
} = await import('../lib/work-order-pictures.js');
const { fromRequest } = await import('../lib/work-order-triage.js');
const { default: WorkOrderTriage } = await import('../components/WorkOrderTriage.jsx');
const { GalleryTab } = await import('../modules/properties/DoorTabs.jsx');
const { WORK_ORDER_PHOTO_COLUMNS, PHOTO_LIST_COLUMNS } = await import('../modules/properties/cloud.js');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');
const MIG = '0310-a-work-order-keeps-its-pictures-and-a-name-typed-once-is-offered-after.sql';
const SMOKE = '0310-work-order-pictures-smoke.sql';

// ---------------------------------------------------------------------------
// The pure halves
// ---------------------------------------------------------------------------
describe('the names on offer', () => {
  it('defaults first in their own order, then the remembered A→Z without case; two spellings fold into the first seen', () => {
    const out = mergePictureNames(['Before', 'After'], [{ name: 'wiring' }, { name: 'Fan bracket' }, 'before', 'WIRING', 'Fan Bracket ']);
    expect(out).toEqual(['Before', 'After', 'Fan bracket', 'wiring']);
    expect(mergePictureNames(['Before', 'After'], [{ name: 'wiring' }, { name: 'Fan bracket' }])).toEqual(out.slice(0, 4));
  });
  it('is deterministic and empty-safe', () => {
    expect(mergePictureNames([], [])).toEqual([]);
    expect(mergePictureNames(undefined, null)).toEqual([...PICTURE_NAME_DEFAULTS]);
    expect(mergePictureNames(['B', 'a'], ['c'])).toEqual(mergePictureNames(['B', 'a'], ['c']));
  });
  it('a new name is one the picker does not offer yet, matched without case or stray spaces', () => {
    expect(isNewPictureName('Microwave bracket', ['Before'])).toBe(true);
    expect(isNewPictureName('  before ', ['Before'])).toBe(false);
    expect(isNewPictureName('', ['Before'])).toBe(false);
    expect(pictureNameKey(' Fan   Wiring ')).toBe('fan wiring');
  });
  it('the kind a named picture files under is derived, never asked', () => {
    expect(kindForPictureName('Before')).toBe('work-order-before');
    expect(kindForPictureName('As found')).toBe('work-order-before');
    expect(kindForPictureName('After')).toBe('work-order-after');
    expect(kindForPictureName('Finished work')).toBe('work-order-after');
    expect(kindForPictureName('Receipt')).toBe('document-scan');
    expect(kindForPictureName('Damage')).toBe('damage');
    expect(kindForPictureName('Fan wiring')).toBe('inspection');
    expect(kindForPictureName('')).toBe('inspection');
  });
});

describe('the row a picture becomes', () => {
  const req = { kind: 'request', id: 'r1', instanceId: 'inst-1', tenancyId: 't1', rentalId: 'd1' };
  it('a Poe Properties work order: on the door, on the tenancy, on the request, riding the note', () => {
    const row = buildWorkOrderPhotoRow({ record: req, noteId: 'n-9', name: 'After', dataUrl: 'data:x', thumbUrl: 'data:t', authorLabel: 'Darrell' });
    expect(row).toEqual({
      instance_id: 'inst-1', rental_ref: 'd1', tenancy_id: 't1', request_id: 'r1', incident_ref: null, note_id: 'n-9',
      kind: 'work-order-after', caption: 'After', storage_path: 'data:x', thumb_path: 'data:t', taken_at: null, author_label: 'Darrell',
    });
  });
  it('a Real Estate incident: the family instance, the incident by its text id, no door', () => {
    const row = buildWorkOrderPhotoRow({ record: { kind: 'incident', id: 'in-1761500000000' }, instanceId: 'fam-1', name: 'Before', dataUrl: 'data:x' });
    expect(row).toMatchObject({ instance_id: 'fam-1', incident_ref: 'in-1761500000000', request_id: null, rental_ref: null, note_id: null, kind: 'work-order-before' });
  });
  it('refuses to build a row it could not file: no instance, no bytes, a board item', () => {
    expect(buildWorkOrderPhotoRow({ record: { kind: 'incident', id: 'in-1' }, name: 'x', dataUrl: 'data:x' })).toBeNull();
    expect(buildWorkOrderPhotoRow({ record: req, name: 'x', dataUrl: '' })).toBeNull();
    expect(buildWorkOrderPhotoRow({ record: { kind: 'task', id: 't' }, instanceId: 'i', name: 'x', dataUrl: 'data:x' })).toBeNull();
    expect(canCarryPictures({ record: { kind: 'task' } })).toBe(false);
    expect(canCarryPictures({ record: { kind: 'request' } })).toBe(true);
  });
  it('the pictures of an entry, on a note, and loose; archived never drawn; oldest first', () => {
    const photos = [
      { id: 'p2', request_id: 'r1', note_id: 'n1', uploaded_at: '2026-10-27T02:00:00Z' },
      { id: 'p1', request_id: 'r1', note_id: null, uploaded_at: '2026-10-27T01:00:00Z' },
      { id: 'px', request_id: 'r1', uploaded_at: '2026-10-27T03:00:00Z', archived_at: '2026-10-27T04:00:00Z' },
      { id: 'pi', incident_ref: 'in-1', uploaded_at: '2026-10-27T01:00:00Z' },
    ];
    const w = { record: { kind: 'request', id: 'r1' } };
    expect(picturesOf(photos, w).map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(picturesOnNote(photos, 'n1').map((p) => p.id)).toEqual(['p2']);
    expect(loosePictures(photos, w).map((p) => p.id)).toEqual(['p1']);
    expect(picturesOf(photos, { record: { kind: 'incident', id: 'in-1' } }).map((p) => p.id)).toEqual(['pi']);
    expect(picturesOf(photos, null)).toEqual([]);
  });
  it('the saved line counts what landed and never says saved for what was refused', () => {
    expect(savedLine({ saved: 2, lost: 0, noted: true })).toBe('2 pictures saved with the note.');
    expect(savedLine({ saved: 1, lost: 1 })).toBe('1 picture saved. 1 picture did not reach the store.');
    expect(savedLine({ saved: 0, lost: 2 })).toBe('Not saved: 2 pictures did not reach the store.');
    expect(savedLine({})).toBe('');
  });
  it('a note id is made on the device, v4-shaped, so the pictures can name the note they ride', () => {
    const a = newNoteId(); const b = newNoteId();
    expect(a).toMatch(/^[0-9a-f-]{36}$/);
    expect(a).not.toBe(b);
  });
  it('fromRequest keeps the note id so the pictures on a note can be drawn under it', () => {
    const w = fromRequest({ id: 'r1', title: 'Fan', created_at: '2026-10-01T00:00:00Z' }, { notes: [{ id: 'n1', request_id: 'r1', body: 'Checked', created_at: '2026-10-02T00:00:00Z' }] });
    expect(w.notes.find((n) => n.text === 'Checked').id).toBe('n1');
  });
  it('the work-order list reads the two new columns beside the metadata list, never the bytes', () => {
    expect(WORK_ORDER_PHOTO_COLUMNS).toBe(`${PHOTO_LIST_COLUMNS}, note_id, incident_ref`);
    expect(WORK_ORDER_PHOTO_COLUMNS).not.toMatch(/storage_path|thumb_path/);
  });
});

// ---------------------------------------------------------------------------
// The data wall, pinned at the text, with its CI proof
// ---------------------------------------------------------------------------
describe('the data wall (0310)', () => {
  const sql = read('infra', 'supabase', 'migrations-auto', MIG);
  it('a picture may hang on a note, on an incident, on a work order', () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS note_id\s+uuid/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS incident_ref text/);
    expect(sql).toMatch(/ADD CONSTRAINT property_photos_has_an_anchor\s+CHECK \(rental_ref IS NOT NULL OR tenancy_id IS NOT NULL OR request_id IS NOT NULL OR incident_ref IS NOT NULL\)/);
  });
  it('the worker the job was GIVEN TO reads its pictures and files his own, as himself, on that job only', () => {
    const fn = sql.slice(sql.indexOf('FUNCTION public.user_is_assigned_to_request'), sql.indexOf('REVOKE ALL ON FUNCTION public.user_is_assigned_to_request'));
    expect(fn).toMatch(/SECURITY DEFINER/);
    expect(fn).toMatch(/r\.assigned_to = auth\.uid\(\)/);
    const ins = sql.slice(sql.indexOf('CREATE POLICY property_photos_work_order_insert'), sql.indexOf('-- 3. The names'));
    expect(ins).toMatch(/uploaded_by = auth\.uid\(\)/);
    expect(ins).toMatch(/user_is_assigned_to_request\(request_id\)/);
    const rd = sql.slice(sql.indexOf('CREATE POLICY property_photos_work_order_read'), sql.indexOf('DROP POLICY IF EXISTS property_photos_work_order_insert'));
    expect(rd).toMatch(/EXISTS \(SELECT 1 FROM public\.tenant_maintenance_requests r WHERE r\.id = property_photos\.request_id\)/);
  });
  it('picture_names: one row per name per instance without case; the RPC is the one writer; a stranger\'s NULL role reads as no (the hole the smoke caught)', () => {
    expect(sql).toMatch(/name_key\s+text GENERATED ALWAYS AS \(lower\(btrim\(regexp_replace\(name, '\\s\+', ' ', 'g'\)\)\)\) STORED/);
    expect(sql).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS picture_names_one_per_instance_idx ON public\.picture_names\(instance_id, name_key\)/);
    expect(sql).toMatch(/GRANT SELECT ON public\.picture_names TO authenticated;/);
    expect(sql).not.toMatch(/GRANT (SELECT, )?INSERT[^\n]*picture_names/);
    expect(sql).toMatch(/coalesce\(public\.user_role_in_instance\(p_instance\) IN \('owner','admin','member'\), false\)/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.remember_picture_name\(uuid, text\) TO authenticated/);
    expect(sql).toMatch(/apply_viewer_readonly_overlay\(\)/);
  });
  it('the smoke exists and both CI legs run it; the e2e database replays 0310', () => {
    const smoke = read('infra', 'supabase', 'tests', SMOKE);
    expect(smoke).toMatch(/W \(assigned, nothing else\) files P2 on Q', true/);
    expect(smoke).toMatch(/a stranger names nothing', false/);
    expect(smoke).toMatch(/RAISE NOTICE 'WORK ORDER PICTURES SMOKE: PASS'/);
    const ci = read('.github', 'workflows', 'ci.yml');
    expect(ci).toMatch(new RegExp(`for i in 1 2; do psql[^\\n]*${MIG}; done\\n\\s+psql[^\\n]*tests/${SMOKE}`));
    expect(ci).toMatch(/grep -q 'WORK ORDER PICTURES SMOKE: PASS'/);
    const rls = read('.github', 'workflows', 'rls-isolation.yml');
    expect(rls).toMatch(new RegExp(`0309-a-door-shows-its-pictures-to-its-people\\.sql ${MIG}"`));
    expect(rls).toMatch(new RegExp(`0309-door-pictures-smoke\\.sql ${SMOKE}"`));
    expect(read('scripts', 'e2e', 'build-door-db.sh')).toMatch(new RegExp(`\\n  ${MIG}; do`));
  });
});

// ---------------------------------------------------------------------------
// The screens, mounted
// ---------------------------------------------------------------------------
let container; let root;
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; });
const settle = async (n = 6) => { for (let i = 0; i < n; i += 1) await act(async () => { await Promise.resolve(); }); };
async function mount(el, props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(el, props)); });
  await settle(8);
}
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const qa = (id) => [...container.querySelectorAll(`[data-testid="${id}"]`)];
const click = async (el) => { await act(async () => { el.click(); }); await settle(6); };
const type = async (el, value) => {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await settle(2);
};
const feed = async (input, names) => {
  const files = names.map((n) => new File(['x'], n, { type: 'image/jpeg' }));
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); });
  await settle(10);
};
const compress = async () => 'data:image/jpeg;base64,AAAA';
const noTasks = () => [];

const REQ = { id: 'r1', instance_id: 'inst-1', tenancy_id: 't1', rental_id: 'd1', status: 'in-progress', title: 'Exhaust fan and microwave installation inside apartment 2', created_at: '2026-10-20T00:00:00Z', assigned_to_label: 'Coreyon Mallory' };
const NOTES = [{ id: 'n1', request_id: 'r1', author_role: 'landlord', author_label: '', body: 'Coreyon is working on this', created_at: '2026-10-21T00:00:00Z' }];
const PHOTOS = [
  { id: 'p-note', instance_id: 'inst-1', request_id: 'r1', note_id: 'n1', caption: 'After', kind: 'work-order-after', uploaded_at: '2026-10-21T00:00:01Z', thumb_path: 'data:image/jpeg;base64,THUMB' },
  { id: 'p-loose', instance_id: 'inst-1', request_id: 'r1', note_id: null, caption: 'Before', kind: 'work-order-before', uploaded_at: '2026-10-20T00:00:01Z', thumb_path: 'data:image/jpeg;base64,THUMB' },
];
const loadReq = async () => ({ ok: true, requests: [REQ], docs: [], events: [], notes: NOTES, unreadable: [] });
function ops({ photos = PHOTOS, names = [{ name: 'Fan wiring' }], addOk = true, loadOk = true, instance = 'fam-1' } = {}) {
  const calls = { add: [], remember: [], note: [] };
  const photoOps = {
    load: async () => (loadOk ? { ok: true, photos } : { ok: false, reason: 'the road was down' }),
    names: async () => ({ ok: true, names }),
    remember: async (inst, name) => { calls.remember.push([inst, name]); return { ok: true, name: { name } }; },
    add: async (row) => { calls.add.push(row); return addOk ? { ok: true, photo: { ...row, id: `new-${calls.add.length}` } } : { ok: false, reason: 'row-level security refused it' }; },
    thumb: async (id) => `data:image/jpeg;base64,T${id}`,
    image: async (id) => `data:image/jpeg;base64,FULL-${id}`,
    instanceId: async () => instance,
  };
  const requestOps = {
    setStatus: async () => ({ ok: true }),
    assign: async () => ({ ok: true }),
    note: async (record, body, extra) => { calls.note.push([record.id, body, extra]); return { ok: true }; },
  };
  return { photoOps, requestOps, calls };
}

describe('the triage detail of a work order, with its pictures', () => {
  it('draws the picture under its note and the loose one on the work order, counts them on the row, and the camera control is 44px with capture=environment', async () => {
    const { photoOps, requestOps } = ops();
    await mount(WorkOrderTriage, { incidents: [], rentals: [], load: loadReq, useTasks: noTasks, photoOps, requestOps, compress });
    expect(q('work-order-tone').textContent).toBe('Worker on it');
    expect(container.textContent).toMatch(/2 pictures/);
    await click(q('work-order-title').closest('button'));
    const note = qa('work-order-note').find((li) => /Coreyon is working on this/.test(li.textContent));
    expect(note, 'the note is listed').toBeTruthy();
    expect(note.querySelectorAll('[data-testid="work-order-picture"]').length).toBe(1);
    expect(note.querySelector('[data-testid="work-order-picture"]').getAttribute('aria-label')).toBe('Open After');
    expect(q('work-order-loose-pictures').querySelectorAll('[data-testid="work-order-picture"]').length).toBe(1);
    const cam = q('work-order-picture-camera');
    expect(cam.getAttribute('capture')).toBe('environment');
    expect(cam.getAttribute('accept')).toBe('image/*');
    expect(cam.hasAttribute('multiple')).toBe(true);
    expect(cam.closest('label').className).toMatch(/min-h-\[44px\]/);
    expect(q('work-order-picture-choose').hasAttribute('capture')).toBe(false);
  });

  it('a new name typed once is saved on the picture, remembered for the instance, and the note the pictures ride carries the id they name', async () => {
    const { photoOps, requestOps, calls } = ops();
    await mount(WorkOrderTriage, { incidents: [], rentals: [], load: loadReq, useTasks: noTasks, photoOps, requestOps, compress });
    await click(q('work-order-title').closest('button'));
    await feed(q('work-order-picture-camera'), ['fan.jpg', 'bracket.jpg']);
    expect(q('work-order-picture-queue').querySelectorAll('img').length).toBe(2);
    // The remembered name is already a chip, beside the defaults.
    const chips = qa('picture-name-option').map((b) => b.textContent);
    expect(chips.slice(0, 2)).toEqual(['Before', 'After']);
    expect(chips).toContain('Fan wiring');
    expect(q('picture-name-typed')).toBeNull();
    await click(q('picture-name-new'));
    await type(q('picture-name-typed'), 'Microwave bracket');
    await type(q('work-order-picture-words'), 'Both mounted; tested');
    expect(q('work-order-picture-save').textContent).toBe('Save 2 pictures with the note');
    await click(q('work-order-picture-save'));
    expect(calls.note.length).toBe(1);
    const [, body, extra] = calls.note[0];
    expect(body).toBe('Both mounted; tested');
    expect(extra.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(calls.add.length).toBe(2);
    expect(calls.add[0]).toMatchObject({ instance_id: 'inst-1', rental_ref: 'd1', tenancy_id: 't1', request_id: 'r1', note_id: extra.id, caption: 'Microwave bracket', kind: 'inspection', storage_path: 'data:image/jpeg;base64,AAAA' });
    expect(calls.remember).toEqual([['inst-1', 'Microwave bracket']]);
    expect(q('work-order-picture-result').textContent).toBe('2 pictures saved with the note.');
    expect(q('work-order-picture-queue')).toBeNull();
  });

  it('an offered name is not re-remembered; without words the pictures go straight on the work order with no note', async () => {
    const { photoOps, requestOps, calls } = ops();
    await mount(WorkOrderTriage, { incidents: [], rentals: [], load: loadReq, useTasks: noTasks, photoOps, requestOps, compress });
    await click(q('work-order-title').closest('button'));
    await feed(q('work-order-picture-choose'), ['done.jpg']);
    await click(qa('picture-name-option').find((b) => b.textContent === 'After'));
    await click(q('work-order-picture-save'));
    expect(calls.note.length).toBe(0);
    expect(calls.add.length).toBe(1);
    expect(calls.add[0]).toMatchObject({ note_id: null, caption: 'After', kind: 'work-order-after' });
    expect(calls.remember).toEqual([]);
    expect(q('work-order-picture-result').textContent).toBe('1 picture saved.');
  });

  it('PROVEN TO CATCH: a store that refuses the picture is reported as not saved, the name is not remembered, and the picture stays queued', async () => {
    const { photoOps, requestOps, calls } = ops({ addOk: false });
    await mount(WorkOrderTriage, { incidents: [], rentals: [], load: loadReq, useTasks: noTasks, photoOps, requestOps, compress });
    await click(q('work-order-title').closest('button'));
    await feed(q('work-order-picture-camera'), ['fan.jpg']);
    await click(q('picture-name-new'));
    await type(q('picture-name-typed'), 'Fan wiring close-up');
    await click(q('work-order-picture-save'));
    expect(calls.add.length).toBe(1);
    expect(calls.remember).toEqual([]);
    expect(q('work-order-picture-result').textContent).toBe('Not saved: row-level security refused it.');
    expect(q('work-order-picture-queue').querySelectorAll('img').length).toBe(1);
  });

  it('a Real Estate incident files its picture on the family instance by its text id, and the log note counts the pictures', async () => {
    const { photoOps, requestOps, calls } = ops({ photos: [] });
    const noCloud = async () => ({ ok: true, requests: [], docs: [], events: [], notes: [], unreadable: [] });
    const updates = [];
    const inc = { id: 'in-1761500000000', description: 'Foyer light out', category: 'maintenance', status: 'open', createdAt: '2026-10-25T00:00:00Z', lifecycle: { log: [] }, linkedTo: { type: 'building', id: '805 Fixture Ave' } };
    await mount(WorkOrderTriage, { incidents: [inc], rentals: [], load: noCloud, useTasks: noTasks, photoOps, requestOps, compress, updateIncident: (id, u) => updates.push([id, u]) });
    await click(q('work-order-title').closest('button'));
    await feed(q('work-order-picture-camera'), ['foyer.jpg']);
    await type(q('work-order-picture-words'), 'As found this morning');
    await click(q('work-order-picture-save'));
    expect(calls.add.length).toBe(1);
    expect(calls.add[0]).toMatchObject({ instance_id: 'fam-1', incident_ref: 'in-1761500000000', request_id: null, rental_ref: null, note_id: null, caption: 'Before', kind: 'work-order-before' });
    expect(updates).toEqual([['in-1761500000000', { _logNote: 'As found this morning (1 picture)' }]]);
    expect(q('work-order-picture-result').textContent).toBe('1 picture saved with the note.');
  });

  it('a pictures read that fails says so and never shows the work order as having none; a tap opens the full picture and Close shuts it', async () => {
    const { photoOps, requestOps } = ops({ loadOk: false });
    await mount(WorkOrderTriage, { incidents: [], rentals: [], load: loadReq, useTasks: noTasks, photoOps, requestOps, compress });
    expect(q('work-order-pictures-unread').textContent).toMatch(/could not be read \(the road was down\); none are shown, which is not saying there are none/);
    expect(container.textContent).not.toMatch(/\d pictures/);
    if (root) act(() => root.unmount()); container.remove();
    const good = ops();
    await mount(WorkOrderTriage, { incidents: [], rentals: [], load: loadReq, useTasks: noTasks, photoOps: good.photoOps, requestOps: good.requestOps, compress });
    await click(q('work-order-title').closest('button'));
    await click(q('work-order-loose-pictures').querySelector('[data-testid="work-order-picture"]'));
    const dlg = q('work-order-picture-open');
    expect(dlg).toBeTruthy();
    expect(dlg.getAttribute('aria-label')).toBe('Before');
    expect(dlg.querySelector('img').getAttribute('src')).toBe('data:image/jpeg;base64,FULL-p-loose');
    await click(q('work-order-picture-close'));
    expect(q('work-order-picture-open')).toBeNull();
  });
});

describe("the door's gallery offers the names already given", () => {
  const SHOTS = [{ id: 'p0', kind: 'move-out-condition', caption: 'shot', thumb_path: 'data:image/jpeg;base64,AAAA', taken_at: null, uploaded_at: '2026-10-10T18:45:00Z', sort_order: 0, archived_at: null, room_id: null }];
  function namesOps(names) {
    const remembered = [];
    return { remembered, ops: { load: async () => ({ ok: true, names }), remember: async (inst, name) => { remembered.push([inst, name]); return { ok: true }; } } };
  }
  it('the caption boxes list the remembered names; a saved caption not yet among them is remembered once, a known one is not', async () => {
    const { ops: nOps, remembered } = namesOps([{ name: 'Fan wiring' }, { name: 'Before' }]);
    const added = [];
    await mount(GalleryTab, {
      door: { id: 'door-1', instance_id: 'inst-1' }, doorLabel: '805 Apt 2', rooms: [], photos: SHOTS, canManage: true, canAdd: true,
      namesOps: nOps, onAdd: async (row) => { added.push(row); return { ok: true }; }, onDone: async () => {},
    });
    const box = container.querySelector('input[aria-label="the caption for the set"]');
    expect(box.getAttribute('list')).toBeTruthy();
    const list = container.querySelector(`datalist#${box.getAttribute('list')}`);
    expect([...list.querySelectorAll('option')].map((o) => o.value)).toEqual(['Before', 'Fan wiring']);
    const input = container.querySelector('input[aria-label="Choose pictures already on this device"]');
    await feed(input, ['a.jpg']);
    await type(box, 'Fan wiring');
    await click(q('add-to-gallery'));
    expect(added.length).toBe(1);
    expect(remembered).toEqual([]);
    await feed(input, ['b.jpg']);
    await type(box, 'Microwave bracket');
    await click(q('add-to-gallery'));
    expect(added.length).toBe(2);
    expect(remembered).toEqual([['inst-1', 'Microwave bracket']]);
    expect([...container.querySelector(`datalist#${box.getAttribute('list')}`).querySelectorAll('option')].map((o) => o.value)).toEqual(['Before', 'Fan wiring', 'Microwave bracket']);
  });
});
