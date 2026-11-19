// =============================================================================
// Which app each person opened, and when (DR-1591)
// =============================================================================
// Darrell 2026-11-19: "Coreyon is supposed to be using the Poe Properties
// App... he may also want the Love Corner App... as well as the PoeTech App...
// how do I know?" And: "Not wanting to lose functions just gain an
// easy-to-use one." So every existing chip and button is pinned here too.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const D = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString();

describe('the door on every usage row (usage-events)', () => {
  it('reads the door the page booted as', async () => {
    const { doorKeyHere } = await import('../lib/usage-events.js');
    expect(doorKeyHere({ pathname: '/properties/app/', search: '' })).toBe('properties');
    expect(doorKeyHere({ pathname: '/lovecorner/app/', search: '' })).toBe('lovecorner');
    expect(doorKeyHere({ pathname: '/poetech-app/', search: '?view=books' })).toBe('poetech');
    expect(doorKeyHere({ pathname: '/', search: '?lovecorner=1' })).toBe('lovecorner');
  });

  function fakeClient({ failDoorColumn = false, session = null } = {}) {
    const inserted = [];
    const listeners = [];
    const client = {
      inserted,
      listeners,
      from: () => ({
        insert: (row) => {
          inserted.push(row);
          if (failDoorColumn && 'door' in row)
            return Promise.resolve({ error: { code: 'PGRST204', message: "Could not find the 'door' column of 'usage_events' in the schema cache" } });
          return Promise.resolve({ error: null });
        },
      }),
      auth: {
        getSession: async () => ({ data: { session } }),
        onAuthStateChange: (fn) => {
          listeners.push(fn);
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
      },
    };
    return client;
  }

  it('writes the door with the row, and keeps the row when the column has not landed yet', async () => {
    const m = await import('../lib/usage-events.js');
    m.resetDoorColumnForTests();
    const ok = fakeClient();
    expect(await m.insertUsageRow({ kind: 'view', name: 'books' }, ok)).toBe(true);
    expect(ok.inserted[0]).toMatchObject({ kind: 'view', name: 'books' });
    expect(typeof ok.inserted[0].door).toBe('string');

    // PROVEN TO CATCH: before 0337 applies, a row with a door is refused; the
    // usage must still be written, without the door, and not lost.
    const old = fakeClient({ failDoorColumn: true });
    expect(await m.insertUsageRow({ kind: 'view', name: 'books' }, old)).toBe(true);
    expect(old.inserted.length).toBe(2);
    expect('door' in old.inserted[1]).toBe(false);
    // ...and this page stops sending a door it cannot store.
    expect(await m.insertUsageRow({ kind: 'use', name: 'x' }, old)).toBe(true);
    expect(old.inserted.length).toBe(3);
    expect('door' in old.inserted[2]).toBe(false);
    m.resetDoorColumnForTests();
  });

  it('notes the door once per person per page load, and when someone signs in inside it', async () => {
    const m = await import('../lib/usage-events.js');
    m.resetDoorColumnForTests();
    const loc = { pathname: '/properties/app/', search: '' };
    const c = fakeClient({ session: { user: { id: 'p-1' } } });
    m.noteDoorOpen({ client: c, loc });
    for (let i = 0; i < 4; i += 1) await Promise.resolve();
    // INITIAL_SESSION for the same person must not write a second row.
    c.listeners[0]('INITIAL_SESSION', { user: { id: 'p-1' } });
    for (let i = 0; i < 4; i += 1) await Promise.resolve();
    expect(c.inserted.filter((r) => r.kind === 'door')).toEqual([{ kind: 'door', name: 'properties', door: 'properties' }]);

    const signedOut = fakeClient({ session: null });
    m.noteDoorOpen({ client: signedOut, loc });
    for (let i = 0; i < 4; i += 1) await Promise.resolve();
    expect(signedOut.inserted).toEqual([]);
    signedOut.listeners[0]('SIGNED_IN', { user: { id: 'p-2' } });
    for (let i = 0; i < 4; i += 1) await Promise.resolve();
    expect(signedOut.inserted).toEqual([{ kind: 'door', name: 'properties', door: 'properties' }]);
    // A token refresh is not a new arrival.
    signedOut.listeners[0]('TOKEN_REFRESHED', { user: { id: 'p-3' } });
    for (let i = 0; i < 4; i += 1) await Promise.resolve();
    expect(signedOut.inserted.length).toBe(1);
  });

  it('the calendar never counts a door row as a tab open', async () => {
    const { perPerson } = await import('../lib/usage-calendar.js');
    const p = perPerson([
      { user_id: 'u', day: '2026-11-19', kind: 'view', n: 3 },
      { user_id: 'u', day: '2026-11-19', kind: 'door', n: 2 },
    ]).get('u');
    expect(p.opens).toBe(3);
    expect(p.total).toBe(3);
  });
});

describe('what a row says about the apps (pure)', () => {
  it('opened doors with first and last, the rest "never", and old visits never given a door', async () => {
    const { indexDoors, doorsView } = await import('../lib/person-onboarding.js');
    const idx = indexDoors({
      door_tracking_since: D(5),
      people: [
        { user_id: 'a', doors: [{ door: 'properties', first_at: D(4), last_at: D(1), n: 6 }], before_tracking: { n: 3, last_at: D(9) } },
        // PROVEN TO CATCH: a person whose only rows predate the door must still
        // be found, with no door invented for them.
        { user_id: 'old', doors: [], before_tracking: { n: 2, last_at: D(20) } },
      ],
    });
    const now = Date.now() + 60000; // a minute of margin, so day floors never straddle
    const a = doorsView(idx.get('a'), D(5), now);
    expect(a.doors.map((d) => d.text)).toEqual(['PoeTech: never', 'The Love Corner: never', 'Poe Properties: first 4d ago, last yesterday']);
    expect(a.beforeText).toBe('3 earlier visits, app not recorded (last 1w ago)');
    expect(a.note).toContain('not since door tracking began on');

    const old = doorsView(idx.get('old'), D(5), now);
    expect(old.doors.every((d) => !d.opened)).toBe(true);
    expect(old.beforeText).toContain('2 earlier visits');

    const none = doorsView(undefined, null, now);
    expect(none.doors.map((d) => d.text)).toEqual(['PoeTech: never', 'The Love Corner: never', 'Poe Properties: never']);
    expect(none.note).toContain('nothing has been recorded with its app yet');
    expect(none.beforeText).toBe('');

    // Another door they opened is named too.
    const tlc = doorsView(indexDoors({ people: [{ user_id: 't', doors: [{ door: 'tlc', first_at: D(2), last_at: D(2), n: 1 }] }] }).get('t'), D(5), now);
    expect(tlc.doors.map((d) => d.key)).toEqual(['poetech', 'lovecorner', 'properties', 'tlc']);
    expect(tlc.doors[3].text).toBe('TLC Therapy Solutions: 2d ago');
  });
});

// ── the screen ───────────────────────────────────────────────────────────────
const H = vi.hoisted(() => ({ signups: [], doors: null }));
vi.mock('../lib/access-metrics-sync.js', () => ({
  fetchAccessSnapshot: async () => ({ signedIn: true, instances: [], members: [], presence: [], invites: [], subscriptions: [], domains: [], errors: {} }),
  currentBuild: () => ({ sha: 'test', time: null }),
  restRpc: async (fn) =>
    fn === 'admin_person_doors'
      ? { data: H.doors, error: H.doors ? null : { message: 'function admin_person_doors() does not exist', code: '42883' } }
      : { data: null, error: null },
  readSnapshotToken: () => 'tok',
}));
vi.mock('../lib/signup-metrics.js', async (orig) => ({
  ...(await orig()),
  fetchSignupMetrics: async () => ({ status: 'ready', data: { summary: { total_accounts: H.signups.length }, signups: H.signups } }),
}));
vi.mock('../lib/contacts-store.js', () => ({ cachedContacts: () => [], loadMyContacts: async () => ({ ok: true, rows: [], reason: '' }) }));
vi.mock('../lib/member-roles.js', async (orig) => ({
  ...(await orig()),
  listMyAdminInstances: async () => [{ instanceId: 'i-1', slug: 'poe-properties', displayName: 'Poe Properties', instanceType: 'business' }],
  addUserToSpace: async () => ({ ok: true, status: 'added', role: 'member' }),
}));
vi.mock('../modules/properties/cloud.js', () => ({ inviteToProperties: async () => ({ ok: true }) }));
vi.mock('../lib/supabase.js', () => ({
  default: { auth: { getSession: async () => ({ data: { session: null } }) } },
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
  phoneLoginEmail: () => '',
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
}));

import AccessUsageMetrics from '../components/AccessUsageMetrics.jsx';

const ROWS = [
  { user_id: 'u-c', display_name: 'Tenant One', email: 'tenant1@example.org', category: 'unprovisioned', created_at: D(8), last_sign_in_at: D(2) },
  { user_id: 'u-f', display_name: 'Fam', email: 'fam@example.org', category: 'family', created_at: D(40), last_sign_in_at: D(1) },
];

describe('the Signups list says which apps each person opened, and loses nothing', () => {
  let container;
  let root;
  afterEach(() => {
    if (root) act(() => root.unmount());
    if (container) container.remove();
    root = container = null;
    H.signups = [];
    H.doors = null;
  });
  async function mount() {
    container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(AccessUsageMetrics));
    });
    for (let i = 0; i < 8; i += 1)
      await act(async () => {
        await Promise.resolve();
      });
  }

  it('each row names the apps, with "never" where never, and the reading rule once', async () => {
    H.signups = ROWS;
    H.doors = {
      door_tracking_since: D(6),
      people: [{ user_id: 'u-c', doors: [{ door: 'properties', first_at: D(3), last_at: D(2), n: 4 }], before_tracking: null }],
    };
    await mount();
    const lines = Array.from(container.querySelectorAll('[data-testid="signup-doors"]')).map((n) => n.textContent);
    expect(lines).toHaveLength(2);
    expect(lines.find((l) => l.includes('Poe Properties: first 3d ago'))).toContain('PoeTech: never');
    expect(lines.some((l) => l.includes('Poe Properties: never'))).toBe(true);
    expect(container.querySelector('[data-testid="signup-doors-note"]').textContent).toContain('not since door tracking began on');
  });

  it('an unreadable record says so once and never reads as "never"', async () => {
    H.signups = ROWS;
    H.doors = null;
    await mount();
    expect(container.querySelectorAll('[data-testid="signup-doors"]').length).toBe(0);
    expect(container.querySelector('[data-testid="signup-doors-note"]').textContent).toContain(
      'could not be read: function admin_person_doors() does not exist'
    );
  });

  it('every existing chip and button is still there', async () => {
    H.signups = ROWS;
    await mount();
    const text = container.textContent;
    for (const chip of [
      'Signups',
      'At the doors',
      'Bots & blocks',
      'People you know',
      "What's used",
      'When & by whom',
      'Who has access',
      'Counts & activity',
      'Update signals',
      'Invites & access',
    ]) {
      expect(text).toContain(chip);
    }
    expect(container.querySelectorAll('[data-testid="signup-add-to-space"]').length).toBe(2);
    expect(container.querySelectorAll('[data-testid="signup-usage-toggle"]').length).toBe(2);
    expect(container.querySelector('[data-testid="signup-sort"]')).not.toBeNull();
    const buttons = Array.from(container.querySelectorAll('button')).map((b) => b.textContent);
    expect(buttons).toContain('Mask emails');
    expect(buttons).toContain('Refresh');
  });
});
