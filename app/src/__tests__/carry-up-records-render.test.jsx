// =============================================================================
// CarryUpRecords — the strip appears only when something is actually stranded
// =============================================================================
// The board-not-the-model lesson from the showcase controls: I shipped an
// ordering model with no button once already. These assert the SURFACE — that
// the landlord can see the count and press the thing — not just that the
// mapper computes correctly.
// =============================================================================
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

const { loadPropertyNotes, getSessionUser, carryUpRecords, loadCarriedLegacyIds } = vi.hoisted(() => ({
  loadPropertyNotes: vi.fn(),
  getSessionUser: vi.fn(),
  carryUpRecords: vi.fn(),
  loadCarriedLegacyIds: vi.fn(),
}));

vi.mock('../lib/relationships-sync.js', () => ({ loadPropertyNotes, getSessionUser }));
vi.mock('../lib/rescue-upload.js', async () => {
  const real = await vi.importActual('../lib/rescue-upload.js');
  return { ...real, carryUpRecords, loadCarriedLegacyIds };
});

import CarryUpRecords from '../components/CarryUpRecords.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const UUID = '22222222-2222-2222-2222-222222222222';
let host; let root;

const render = async (rental) => {
  await act(async () => { root.render(<CarryUpRecords rental={rental} />); });
};
const text = () => host.textContent || '';
const button = () => Array.from(host.querySelectorAll('button'))
  .find((b) => /carry up/i.test(b.textContent || ''));

beforeEach(() => {
  vi.clearAllMocks();
  loadPropertyNotes.mockResolvedValue({ ok: true, data: [] });
  loadCarriedLegacyIds.mockResolvedValue({});
  getSessionUser.mockResolvedValue({ id: 'user-1' });
  carryUpRecords.mockResolvedValue({
    ok: true, reason: 'carried', carried: 3, written: {}, failed: [],
    plan: { deferred: [], skipped: [] },
  });
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  host.remove();
});

describe('the strip stays out of the way when there is nothing to carry', () => {
  it('renders nothing for a door whose record is already whole', async () => {
    await render({ id: 'r-x', name: '1508 Williamsburg', remoteUuid: UUID });
    expect(text()).toBe('');
  });

  it('renders nothing for a door with no id at all', async () => {
    await render({ name: 'nameless' });
    expect(text()).toBe('');
  });
});

describe('the strip names the count before anything is pressed', () => {
  const stranded = {
    id: 'r-1508williamsburg', name: '1508 Williamsburg', remoteUuid: UUID,
    conversationLog: [{ id: 'cv-1', date: '2026-07-06', person: 'Adrianna', summary: 'Porch smoking' }],
    rooms: [{ id: 'rm-1', name: 'Kitchen' }],
    maintenanceLog: [{ id: 'mt-1', date: '2026-05-02', category: 'lawn', description: 'Mowed' }],
  };

  it('says how many of each kind are on this device only', async () => {
    await render(stranded);
    expect(text()).toContain('On this device only');
    expect(text()).toContain('1 note');
    expect(text()).toContain('1 room');
    expect(text()).toContain('1 maintenance entry');
  });

  it('offers a button that is actually pressable when signed in', async () => {
    await render(stranded);
    expect(button()).toBeTruthy();
    expect(button().disabled).toBe(false);
  });

  it('carries up on the press and reports what landed', async () => {
    await render(stranded);
    await act(async () => { button().dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(carryUpRecords).toHaveBeenCalledTimes(1);
    expect(text()).toContain('Carried 3 records');
  });

  it('reports a partial carry honestly rather than as a success', async () => {
    carryUpRecords.mockResolvedValue({
      ok: false, reason: 'partly-carried', carried: 2,
      failed: ['property_systems: insert refused'], plan: { deferred: [], skipped: [] },
    });
    await render(stranded);
    await act(async () => { button().dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(text()).toContain('Carried 2 records');
    expect(text()).toContain('property_systems: insert refused');
  });

  it('tells a signed-out landlord why the button will not move, and does not fire', async () => {
    getSessionUser.mockResolvedValue(null);
    await render(stranded);
    expect(text()).toContain('Sign in to carry these up');
    expect(button().disabled).toBe(true);
  });

  it('does not offer a note the server already holds', async () => {
    loadPropertyNotes.mockResolvedValue({
      ok: true,
      data: [{ body: 'Adrianna: Porch smoking', note_date: '2026-07-06' }],
    });
    await render(stranded);
    expect(text()).not.toContain('1 note');
    expect(text()).toContain('1 room');
  });
});

describe('the strip stops claiming a carried record is still local', () => {
  const stranded = {
    id: 'r-1508williamsburg', name: '1508 Williamsburg', remoteUuid: UUID,
    rooms: [{ id: 'rm-1', name: 'Kitchen' }],
    maintenanceLog: [{ id: 'mt-1', date: '2026-05-02', description: 'Mowed' }],
  };

  it('disappears entirely once the server holds everything under its device id', async () => {
    loadCarriedLegacyIds.mockResolvedValue({
      rooms: new Set(['rm-1']), events: new Set(['mt-1']),
    });
    await render(stranded);
    expect(text()).toBe('');
  });

  it('re-reads after the press, so the count reflects what just landed', async () => {
    let call = 0;
    loadCarriedLegacyIds.mockImplementation(async () => (
      ++call > 1 ? { rooms: new Set(['rm-1']), events: new Set(['mt-1']) } : {}
    ));
    await render(stranded);
    expect(text()).toContain('1 room');
    await act(async () => { button().dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(text()).not.toContain('1 room');
    expect(text()).toContain('Carried 3 records');
  });
});

describe('what cannot be carried is said out loud', () => {
  it('names the photos staying behind even when nothing else moves', async () => {
    await render({
      id: 'r-x', name: 'A door', remoteUuid: UUID,
      rooms: [{ id: 'rm-1', name: 'Kitchen', photos: [{ src: 'data:x' }, { src: 'data:y' }] }],
    });
    expect(text()).toContain('2 photos');
  });

  it('says uuid-keyed records are waiting on the door itself to sync', async () => {
    await render({
      id: 'r-x', name: 'A door', remoteUuid: null,
      rooms: [{ id: 'rm-1', name: 'Kitchen' }],
      equipment: [{ id: 'eq-1', category: 'Furnace' }],
    });
    expect(text()).toContain('has synced');
  });
});
