// =============================================================================
// FROM THE NAS: a family picture joins a door, picked, never twice (DR-1000)
// =============================================================================
// Darrell, 2026-10-13: "Most of the properties have pictures already on the
// nas... why don't they show up", "The nas has all pictures period!!!... why
// not just pull from there?" The shelf is pinned here with the NAS stubbed
// (the real server is walked in scripts/e2e/door-journeys.mjs G2).
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({
  reachable: true,
  archivePhotos: [{ id: '9001', name: '20240123_144917.jpg', date: '2024-01-22', text: 'the porch, winter', thumb: 'data:image/jpeg;base64,THUMB' }],
  libraryPhotos: [{ id: '20240123_144917.jpg', name: '20240123_144917.jpg', date: '2024-01-23', text: '', thumb: null }],
  calls: [],
}));
vi.mock('../lib/nas-photos.js', async (orig) => {
  const real = await orig();
  return {
    ...real,
    hasBridgeToken: () => true,
    nasRoad: () => 'same-origin',
    fetchChannelPhotos: async (channel, opts) => { H.calls.push(['archive', channel, opts]); return H.reachable ? { photos: H.archivePhotos, total: H.archivePhotos.length } : null; },
    fetchLibrary: async (opts) => { H.calls.push(['library', opts]); return H.reachable ? { photos: H.libraryPhotos, total: H.libraryPhotos.length, month: opts.month } : null; },
    fetchListingPhoto: async (channel, id) => { H.calls.push(['listing', channel, id]); return { ok: true, id, name: '20240123_144917.jpg', date: '2024-01-22', width: 1920, height: 1280, bytes: 10, image: 'data:image/jpeg;base64,FULL' }; },
    fetchLibraryPhoto: async (name, opts) => { H.calls.push(['library-photo', name, opts]); return { ok: true, id: name, name, date: '2024-01-23', width: opts?.max === 480 ? 480 : 1920, image: `data:image/jpeg;base64,${opts?.max === 480 ? 'SMALL' : 'FULL'}` }; },
  };
});

import { NasShelf } from '../modules/properties/DoorTabs.jsx';
import { nasSource, nasLibrarySource, thisMonth, SOURCE_RE } from '../lib/nas-photos.js';

let container, root;
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; H.calls = []; H.reachable = true; });

async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(NasShelf, props)); });
  for (let i = 0; i < 8; i++) await act(async () => { await Promise.resolve(); });
}
async function tap(el) { await act(async () => { el.click(); }); for (let i = 0; i < 8; i += 1) await act(async () => { await Promise.resolve(); }); }
const door = { id: 'door-1', instance_id: 'inst-1' };

describe('the source of a NAS picture', () => {
  it('is a NAS shape or nothing', () => {
    expect(nasSource('805NProspect', '9001')).toBe('nas:805NProspect:9001');
    expect(nasSource('bad name', '9001')).toBe('');
    expect(nasLibrarySource('20240123_144917.jpg')).toBe('nas:library:20240123_144917.jpg');
    expect(nasLibrarySource('../etc/passwd')).toBe('');
    expect(SOURCE_RE.test('http://elsewhere/x.jpg')).toBe(false);
    expect(thisMonth(new Date(2026, 9, 13))).toBe('2026-10');
  });
});

describe('the From the NAS shelf', () => {
  it('lists the door\'s archive with the read timed, and USE ON THE LISTING files it as advertising with its source', async () => {
    const adds = [];
    let done = 0;
    await mount({ door, archive: '805NProspect', nasFiled: {}, recordKind: 'move-in-condition', onAdd: async (row) => { adds.push(row); return { ok: true }; }, onDone: () => { done += 1; } });
    expect(container.querySelector('[data-testid="nas-shelf-timing"]').textContent).toMatch(/1 picture · read in \d+\.\d s over the same-origin road/);
    expect(H.calls[0]).toEqual(['archive', '805NProspect', { limit: 24 }]);
    await tap(container.querySelector('[data-testid="nas-use-9001"]'));
    expect(adds).toHaveLength(1);
    expect(adds[0]).toMatchObject({ instance_id: 'inst-1', rental_ref: 'door-1', kind: 'listing', caption: 'the porch, winter', storage_path: 'data:image/jpeg;base64,FULL', thumb_path: 'data:image/jpeg;base64,THUMB', source: 'nas:805NProspect:9001', taken_at: '2024-01-22T12:00:00Z' });
    expect(container.querySelector('[data-testid="nas-shelf-note"]').textContent).toBe('On the listing.');
    expect(done).toBe(1);
  });

  it('KEEP AS A RECORD files it under the record kind the form holds, never as advertising', async () => {
    const adds = [];
    await mount({ door, archive: '805NProspect', nasFiled: {}, recordKind: 'move-out-condition', onAdd: async (row) => { adds.push(row); return { ok: true }; } });
    expect(container.querySelector('[data-testid="nas-keep-9001"]').textContent).toContain('Keep as a record (move out condition)');
    await tap(container.querySelector('[data-testid="nas-keep-9001"]'));
    expect(adds[0].kind).toBe('move-out-condition');
    expect(container.querySelector('[data-testid="nas-shelf-note"]').textContent).toBe('Kept as move out condition.');
  });

  it('a picture already on this door says so and offers no second copy', async () => {
    await mount({ door, archive: '805NProspect', nasFiled: { 'nas:805NProspect:9001': 'ph-1' }, recordKind: 'turn', onAdd: async () => ({ ok: true }) });
    expect(container.querySelector('[data-testid="nas-tile-9001-filed"]').textContent).toBe('On this door already.');
    expect(container.querySelector('[data-testid="nas-use-9001"]')).toBeNull();
  });

  it('the whole library by month is read as folders, and a picture with no thumbnail is given a small one', async () => {
    const adds = [];
    await mount({ door, archive: '', nasFiled: null, recordKind: 'turn', onAdd: async (row) => { adds.push(row); return { ok: true }; } });
    expect(container.querySelector('[data-testid="nas-shelf-pick"]').value).toBe('library');
    expect(H.calls[0][0]).toBe('library');
    expect(H.calls[0][1].month).toMatch(/^20\d{2}-\d{2}$/);
    const monthInput = container.querySelector('[data-testid="nas-month"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    await act(async () => { setter.call(monthInput, '2024-01'); monthInput.dispatchEvent(new Event('input', { bubbles: true })); });
    for (let i = 0; i < 6; i++) await act(async () => { await Promise.resolve(); });
    expect(H.calls.some((c) => c[0] === 'library' && c[1].month === '2024-01')).toBe(true);
    await tap(container.querySelector('[data-testid="nas-use-20240123_144917.jpg"]'));
    expect(adds[0]).toMatchObject({ kind: 'listing', source: 'nas:library:20240123_144917.jpg', storage_path: 'data:image/jpeg;base64,FULL', thumb_path: 'data:image/jpeg;base64,SMALL', taken_at: '2024-01-23T12:00:00Z' });
  });

  it('PROVEN-TO-CATCH: an unreachable NAS is said, never "none"; a refused copy is said with its reason', async () => {
    H.reachable = false;
    await mount({ door, archive: '805NProspect', nasFiled: {}, recordKind: 'turn', onAdd: async () => ({ ok: true }) });
    expect(container.querySelector('[data-testid="nas-shelf-unreachable"]').textContent).toContain('could not be reached');
    expect(container.querySelectorAll('[data-testid^="nas-tile-"]')).toHaveLength(0);
    await act(async () => root.unmount()); root = null; container.remove();
    H.reachable = true;
    await mount({ door, archive: '805NProspect', nasFiled: {}, recordKind: 'turn', onAdd: async () => ({ ok: false, reason: 'insert-failed', error: 'column "source" of relation "property_photos" does not exist' }) });
    await tap(container.querySelector('[data-testid="nas-use-9001"]'));
    expect(container.querySelector('[data-testid="nas-shelf-note"]').textContent).toContain('the database is still being updated');
  });
});
