// =============================================================================
// A SYSTEM KEEPS ITS PICTURES (DR-0909, migration 0267)
// =============================================================================
// Darrell, 2026-10-10: "Should be able to add images etc of systems... all
// places that make sense... make sense?" The data plate, the flue, the new
// unit, the before and after of a service visit — filed on the system.
// The database half is infra/supabase/tests/0267-system-pictures-smoke.sql.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../lib/image.js', () => ({
  compressImageFile: async (f, w) => (w ? `data:image/jpeg;base64,THUMB-${f.name}` : `data:image/jpeg;base64,FULL-${f.name}`),
  isLikelyImageFile: (f) => /^image\//.test((f && f.type) || ''),
}));

import SystemPictures, { picturesOf, systemPictureRows } from '../modules/properties/SystemPictures.jsx';

const DOOR = { id: 'r-apt2', instance_id: 'i1' };
const FURNACE = { id: 's-furn', name: 'Furnace' };
const VISIT = { id: 'e-1', event_date: '2026-10-01', summary: 'Annual service' };
const PHOTOS = [
  { id: 'p1', system_id: 's-furn', thumb_path: 'data:image/jpeg;base64,T1', caption: 'Data plate', uploaded_at: '2026-09-01' },
  { id: 'p2', system_id: 's-furn', system_event_id: 'e-1', thumb_path: 'data:image/jpeg;base64,T2', caption: 'After', uploaded_at: '2026-10-01' },
  { id: 'p3', system_id: 's-wh', thumb_path: 'data:image/jpeg;base64,T3', caption: 'Water heater' },
  { id: 'p4', system_id: 's-furn', thumb_path: 'data:image/jpeg;base64,T4', archived_at: '2026-10-02' },
];

let container; let root;
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; });
async function mount(props) {
  container = document.createElement('div'); document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(SystemPictures, props)); });
  for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
}

describe('the pictures of a system (pure)', () => {
  it('only this system\'s, not archived, newest first; a visit narrows them', () => {
    expect(picturesOf(PHOTOS, 's-furn').map((p) => p.id)).toEqual(['p2', 'p1']);
    expect(picturesOf(PHOTOS, 's-furn', 'e-1').map((p) => p.id)).toEqual(['p2']);
  });
  it('files each picture on the system and the visit, full image and thumbnail', () => {
    expect(systemPictureRows({ door: DOOR, system: FURNACE, eventId: 'e-1', caption: 'Flue after', pics: [{ dataUrl: 'F', thumbUrl: 'T' }] }))
      .toEqual([{ instance_id: 'i1', rental_ref: 'r-apt2', kind: 'system', caption: 'Flue after', storage_path: 'F', thumb_path: 'T', system_id: 's-furn', system_event_id: 'e-1', taken_at: null }]);
    expect(systemPictureRows({ door: DOOR, system: FURNACE, pics: [{ dataUrl: 'F', thumbUrl: 'T' }] })[0]).toMatchObject({ caption: 'Furnace', system_event_id: null });
  });
});

describe('on the system, in the Systems tab', () => {
  it('shows its pictures, and names the visit a picture is from', async () => {
    await mount({ door: DOOR, system: FURNACE, events: [VISIT], photos: PHOTOS });
    expect(container.textContent).toContain('Pictures of Furnace (2)');
    expect(container.querySelectorAll('[data-testid="sharp-picture"]')).toHaveLength(2);
    expect(container.textContent).toContain('2026-10-01 Annual service');
  });

  it('several pictures at once, filed on the visit chosen', async () => {
    const filed = [];
    await mount({ door: DOOR, system: FURNACE, events: [VISIT], photos: [], canAdd: true, onAdd: async (rows) => { filed.push(...rows); return { ok: true }; } });
    expect(container.textContent).toContain('No pictures yet');
    const sel = container.querySelector('select');
    await act(async () => { sel.value = 'e-1'; sel.dispatchEvent(new Event('change', { bubbles: true })); });
    const input = container.querySelector('input[type="file"]');
    expect(input.hasAttribute('multiple')).toBe(true);
    const files = [new File(['a'], 'plate.jpg', { type: 'image/jpeg' }), new File(['b'], 'flue.jpg', { type: 'image/jpeg' }), new File(['c'], 'notes.txt', { type: 'text/plain' })];
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); });
    for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
    expect(filed.map((r) => [r.system_id, r.system_event_id, r.storage_path, r.thumb_path])).toEqual([
      ['s-furn', 'e-1', 'data:image/jpeg;base64,FULL-plate.jpg', 'data:image/jpeg;base64,THUMB-plate.jpg'],
      ['s-furn', 'e-1', 'data:image/jpeg;base64,FULL-flue.jpg', 'data:image/jpeg;base64,THUMB-flue.jpg'],
    ]);
    expect(container.textContent).toContain('Added 2 to Furnace (2026-10-01 Annual service). Not pictures: notes.txt.');
  });

  it('someone who cannot manage the door sees the pictures and no way to add', async () => {
    await mount({ door: DOOR, system: FURNACE, events: [], photos: PHOTOS, canAdd: false });
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });
});
