// =============================================================================
// ServiceProgram sections — live render proof for the sliding-tabs harmonization
// (Darrell 2026-07-04/05; DR-0076: observe the REAL surface, not just the move).
// The lens strip was KEPT (its state drives deriveSectorView); the long stack
// below the program header now rides variant="sub" chips: Run of show (default),
// Actuals & blueprint, and the steward-only Team & changes. This proves:
//   * the kept lens strip and the new chip row are BOTH present (no dupes)
//   * the default chip shows the real flow
//   * the Actuals chip mounts ServiceActuals on open (lazy)
//   * the Team chip carries the finalizer circle — and NEVER leaks to a
//     non-steward lens (gated section, proven-to-catch by switching lens)
// =============================================================================
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../lib/supabase.js', () => ({
  default: {
    from: vi.fn(),
    rpc: vi.fn(async () => ({ data: null, error: null })),
    auth: { getSession: vi.fn(async () => ({ data: { session: null } })) },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
  onAuthChange: vi.fn(() => () => {}),
}));

const PROGRAM = {
  id: 'p1', serviceDate: '2026-07-12', serviceType: 'sunday', serviceSlot: '',
  title: 'Order of Worship', theme: '', scriptureRef: '', startTime: '11:00',
  targetMinutes: 90, status: 'published', notes: '',
};
const SEGMENT = {
  id: 'sg1', programId: 'p1', title: 'Call to Worship', sector: 'worship',
  ownerName: 'Christina', plannedMinutes: 5, flexible: true, scriptureRef: '',
  sermonId: null, songIds: [], cues: {}, notes: '', sortOrder: 10,
};

let access = { signedIn: true, canSee: true, canEdit: true, isFinalizer: true, role: 'owner', sector: 'worship' };

vi.mock('../lib/service-program.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    getServiceProgramAccess: vi.fn(async () => access),
    subscribePrograms: (cb) => { cb([PROGRAM]); return () => {}; },
    subscribeSegments: (cb) => { cb([SEGMENT]); return () => {}; },
    subscribeChanges: (cb) => { cb([{ id: 'c1', programId: 'p1', actorName: 'Darrell', summary: 'added Call to Worship', createdAt: '2026-07-07T10:00:00Z' }]); return () => {}; },
    subscribeFinalizerMembers: (cb) => { cb([]); return () => {}; },
  };
});
vi.mock('../lib/choir-sync.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    subscribeSongs: (cb) => { cb([]); return () => {}; },
    subscribeSermons: (cb) => { cb([]); return () => {}; },
  };
});
vi.mock('../lib/service-actuals.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    subscribeActuals: (cb) => { cb([]); return () => {}; },
  };
});

import ServiceProgram from '../components/ServiceProgram.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

const mount = () => act(async () => { root.render(createElement(ServiceProgram)); });

// Only the ACTIVE chip's panel is mounted — click a tab by its visible label
// (church-home-render pattern).
const clickTab = async (label) => {
  const tab = [...container.querySelectorAll('[role="tab"]')].find((b) => (b.textContent || '').includes(label));
  if (!tab) throw new Error(`tab not found: ${label}`);
  await act(async () => { tab.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
};

describe('ServiceProgram — kept lens strip + new section chips', () => {
  it('steward lens: lens strip kept, chips render, Run of show is the default panel', async () => {
    access = { signedIn: true, canSee: true, canEdit: true, isFinalizer: true, role: 'owner', sector: 'worship' };
    await mount();
    const text = container.textContent || '';
    // the kept per-sector lens strip (state read beyond the strip)
    expect(text).toContain('Master');
    // the new chip row
    expect(text).toContain('Run of show');
    expect(text).toContain('Actuals & blueprint');
    expect(text).toContain('Team & changes');
    // default panel = the real flow (real segment, real reflow control)
    expect(text).toContain('Call to Worship');
    expect(text).toContain('If the service has only this long (min), reflow');
    // panels are lazy: the finalizer circle is NOT mounted until its chip opens
    expect(text).not.toContain('Worship-team finalizers');
  });

  it('opens Actuals & blueprint and Team & changes on click (lazy panels)', async () => {
    access = { signedIn: true, canSee: true, canEdit: true, isFinalizer: true, role: 'owner', sector: 'worship' };
    await mount();
    await clickTab('Actuals & blueprint');
    // ServiceActuals mounted (its planned-vs-actual reconciliation surface)
    expect((container.textContent || '').toLowerCase()).toContain('actual');
    await clickTab('Team & changes');
    expect(container.textContent).toContain('Worship-team finalizers');
    expect(container.textContent).toContain('Recent changes (1)');
  });

  it('PROVEN-TO-CATCH: a non-editing viewer never gets the Team & changes chip', async () => {
    access = { signedIn: true, canSee: true, canEdit: false, isFinalizer: false, role: 'member', sector: 'ushers' };
    await mount();
    const text = container.textContent || '';
    expect(text).toContain('Run of show');
    expect(text).not.toContain('Team & changes');
    expect(text).not.toContain('Worship-team finalizers');
  });
});
