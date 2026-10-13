// Ask for a tab, and the office decides (0211).
//
// Darrell 2026-09-11: "...for the office staff and tech team to give access
// based on BG and have an request and approval process for changing or giving
// access to the tabs that are staff and work related"
//
// THE FAILURE THIS WHOLE CHAIN EXISTS TO PREVENT is an approval queue that
// approves nothing — a row marked granted while the person still meets a
// locked tile. Before this, the staff tabs were gated by an EMAIL ALLOWLIST in
// the shell, so "approve" could not have granted anything without a code edit
// and a deploy, per person. Most of what is asserted below is about that.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  STAFF_CAPABILITY, GRANT_IS_ALL_STAFF_TABS, REQUEST_STATES, queueSummary,
} from '../lib/access-requests.js';
import {
  surfaceAccess, canBeRequested, REQUIREMENTS, ACCESS_REQUEST_IS_NOT_BUILT,
} from '../lib/surface-access.js';
import { SURFACES } from '../surfaces.js';
import LockedSurface from '../components/LockedSurface.jsx';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(SRC, rel), 'utf8');
const SQL = read('../../infra/supabase/migrations-auto/0211-ask-for-a-tab-and-the-office-decides.sql');

const MEMBER = { signedIn: true, instanceRole: 'member' };
const GRANTED = { signedIn: true, instanceRole: 'member', capabilities: [STAFF_CAPABILITY] };
const byId = (id) => SURFACES.find((s) => s.id === id);

describe('a grant OPENS something — the whole point', () => {
  it('a member with the granted key passes the church-staff gate', () => {
    for (const id of ['devices', 'infra-plan', 'videowall', 'harvest', 'observe', 'church-projects']) {
      expect(surfaceAccess(byId(id), MEMBER).allowed, `${id} before the grant`).toBe(false);
      expect(surfaceAccess(byId(id), GRANTED).allowed, `${id} after the grant`).toBe(true);
    }
  });

  it('the shell honours the SAME key, so nav, tile and render cannot disagree', () => {
    // isChurchStaff is computed in one place. If the nav read one predicate and
    // the render another, a person could be offered a tab that refuses them.
    const shell = read('poe-financial-mvp-v28.jsx');
    expect(shell).toMatch(/const isChurchStaff = .*churchAccess\.capabilities\.includes\('see:church-staff'\)/);
    expect(shell).toMatch(/const churchAccess = useChurchAccess\(\)/);
  });

  it('the key the surface names is the key the request asks for', () => {
    expect(REQUIREMENTS['church-staff'].grantedBy).toBe(STAFF_CAPABILITY);
    expect(surfaceAccess(byId('devices'), MEMBER).grantedBy).toBe(STAFF_CAPABILITY);
    expect(STAFF_CAPABILITY).toBe('see:church-staff');
  });

  it('and the DATABASE knows that key — otherwise a grant would raise', () => {
    // 0126 carries a CLOSED allowlist; a capability not in it is refused.
    expect(SQL).toMatch(/'see:church-staff'/);
    expect(SQL).toMatch(/set_member_capability: unknown capability/);
  });
});

describe('deciding IS granting — there is no second step to forget', () => {
  it('the decision calls the guarded grant, and before it writes the row', () => {
    const decide = SQL.slice(SQL.indexOf('FUNCTION public.access_request_decide'));
    const grantAt = decide.indexOf('PERFORM public.set_member_capability');
    const updateAt = decide.indexOf('UPDATE public.access_requests');
    expect(grantAt, 'the decision must grant through the guarded door').toBeGreaterThan(-1);
    expect(grantAt, 'the grant must come BEFORE the row is marked granted').toBeLessThan(updateAt);
  });

  it('there is NO update policy — a decision cannot be written around the RPC', () => {
    // An UPDATE policy would let a client mark a request granted without the
    // grant ever happening, which is precisely the lie this prevents.
    expect(SQL).toMatch(/DROP POLICY IF EXISTS access_requests_update/);
    expect(SQL).not.toMatch(/CREATE POLICY access_requests_update/);
  });

  it('the office cannot decide its own request, and a member cannot decide at all', () => {
    expect(SQL).toMatch(/only the church office may decide an access request/);
    expect(SQL).toMatch(/you cannot decide your own request/);
  });

  it('a decided row must carry WHO decided it and WHEN', () => {
    expect(SQL).toMatch(/access_requests_decided_chk/);
    expect(SQL).toMatch(/status IN \('granted','refused'\) AND decided_by IS NOT NULL AND decided_at IS NOT NULL/);
  });

  it('asking twice is still one ask', () => {
    expect(SQL).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS access_requests_one_open_idx/);
    expect(SQL).toMatch(/WHERE status = 'open'/);
  });
});

describe('the see: key is a SEE key', () => {
  it('says so, and unlocks no write path', () => {
    expect(SQL).toMatch(/unlocks no table and no write path/);
    // capability_area() maps TABLES to write:<area>, and the viewer read-only
    // overlay is built from it. 0211 does not redefine either, so the see: key
    // is not in the write map and cannot be — which is what keeps it from
    // unlocking a single row. (Asserted as "does not touch them", which is
    // stronger and simpler than hunting for the key inside them.)
    expect(SQL).not.toMatch(/CREATE OR REPLACE FUNCTION public\.capability_area/);
    expect(SQL).not.toMatch(/CREATE OR REPLACE FUNCTION public\.apply_viewer_readonly_overlay/);
    expect(SQL).not.toMatch(/CREATE OR REPLACE FUNCTION public\.never_unlockable_tables/);
    // It only CALLS the overlay, the way every migration that adds an
    // instance-scoped table must.
    expect(SQL).toMatch(/SELECT public\.apply_viewer_readonly_overlay\(\);/);
  });
  it('0126 guards are re-declared, not relaxed', () => {
    for (const guard of [
      'only an owner/admin of the space may change the checklist',
      'you cannot change your own checklist',
      'that person is not in this space',
      'owners/admins already hold these powers',
    ]) expect(SQL, guard).toContain(guard);
  });
});

describe('one yes opens every staff tab — said, not discovered', () => {
  it('the sentence exists and is shown on both sides', () => {
    expect(GRANT_IS_ALL_STAFF_TABS).toMatch(/every staff tab, not only the one asked for/);
    expect(read('components/AccessRequests.jsx')).toContain('GRANT_IS_ALL_STAFF_TABS');
    expect(read('components/LockedSurface.jsx')).toContain('GRANT_IS_ALL_STAFF_TABS');
  });
  it('the migration explains why it is one key and not one per tab', () => {
    expect(SQL).toMatch(/WHY ONE KEY AND NOT ONE PER TAB/);
  });
});

describe('the locked tile now carries the ask', () => {
  let container, root;
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const mount = (props) => act(() => { root.render(createElement(LockedSurface, props)); });

  it('offers the button where a key exists and the person belongs somewhere', () => {
    mount({ surface: byId('devices'), viewer: MEMBER, instanceId: 'inst-1' });
    const labels = Array.from(container.querySelectorAll('button')).map((b) => b.textContent);
    expect(labels.join(' ')).toMatch(/Ask for access/);
  });

  it('does NOT offer it where no key exists — it says so instead', () => {
    // A hidden surface has no lock tile at all; a surface whose requirement has
    // no grantedBy would draw a button that filed into nowhere.
    const noKey = { id: 'x', label: 'X', requires: 'study-circle', whenDenied: 'lock' };
    expect(canBeRequested(noKey, { ...MEMBER })).toBe(false);
    mount({ surface: noKey, viewer: MEMBER, instanceId: 'inst-1' });
    expect(container.textContent).toContain(ACCESS_REQUEST_IS_NOT_BUILT.noKey);
    expect(Array.from(container.querySelectorAll('button')).map((b) => b.textContent).join(' ')).not.toMatch(/Ask for access/);
  });

  it('does not offer it to somebody with no church to ask', () => {
    mount({ surface: byId('devices'), viewer: MEMBER, instanceId: null });
    expect(Array.from(container.querySelectorAll('button')).map((b) => b.textContent).join(' ')).not.toMatch(/Ask for access/);
  });

  it('opens a reason box that says what a yes actually does', () => {
    mount({ surface: byId('devices'), viewer: MEMBER, instanceId: 'inst-1' });
    const ask = Array.from(container.querySelectorAll('button')).find((b) => /Ask for access/.test(b.textContent));
    act(() => ask.click());
    expect(container.querySelector('textarea')).toBeTruthy();
    expect(container.textContent).toContain(GRANT_IS_ALL_STAFF_TABS);
  });

  it('a person who already holds the key sees no tile at all', () => {
    expect(surfaceAccess(byId('devices'), GRANTED).locked).toBe(false);
  });
});

describe('the chain no longer claims to be unbuilt', () => {
  it('ACCESS_REQUEST_IS_NOT_BUILT tells the truth about itself', () => {
    expect(ACCESS_REQUEST_IS_NOT_BUILT.built).toBe(true);
    expect(ACCESS_REQUEST_IS_NOT_BUILT.today).toMatch(/reaches the church office/);
    expect(ACCESS_REQUEST_IS_NOT_BUILT.noKey).toMatch(/file into nowhere/);
  });
});

describe('the queue reads honestly', () => {
  const rows = [
    { id: '1', status: 'open', surfaceId: 'devices', surfaceLabel: 'Devices' },
    { id: '2', status: 'open', surfaceId: 'devices', surfaceLabel: 'Devices' },
    { id: '3', status: 'granted', surfaceId: 'harvest', surfaceLabel: 'Harvest' },
    { id: '4', status: 'refused', surfaceId: 'observe', surfaceLabel: 'Observation' },
  ];
  it('counts what is waiting and what the house keeps reaching for', () => {
    const s = queueSummary(rows);
    expect(s).toMatchObject({ total: 4, open: 2, granted: 1, refused: 1 });
    expect(s.bySurface[0]).toEqual({ label: 'Devices', n: 2 });
  });
  it('is zero, not broken, with nothing asked', () => {
    expect(queueSummary([]).total).toBe(0);
    expect(queueSummary(null).bySurface).toEqual([]);
  });
  it('every state a person can be in has words for it', () => {
    for (const k of ['open', 'granted', 'refused', 'withdrawn']) {
      expect(REQUEST_STATES[k].label, k).toBeTruthy();
    }
    expect(REQUEST_STATES.open.label).toMatch(/Waiting on the office/);
  });
});

describe('reviewer mode is still not a key', () => {
  it('a reviewer does not inherit somebody’s granted capability', () => {
    const reviewer = { ...GRANTED, reviewerMode: true };
    expect(surfaceAccess(byId('devices'), reviewer).allowed).toBe(false);
  });
});

describe('proven-to-catch (anti-theater)', () => {
  it('CATCHES an approval that grants nothing', () => {
    const decide = SQL.slice(SQL.indexOf('FUNCTION public.access_request_decide'));
    expect(decide).toContain('PERFORM public.set_member_capability');
  });
  it('CATCHES a capability the database would refuse', () => {
    expect(SQL).toContain("'see:church-staff'");
    expect(SQL).not.toContain("'see:everything'");
  });
  it('CATCHES the gate reading a key the shell does not', () => {
    const shell = read('poe-financial-mvp-v28.jsx');
    const lib = read('lib/surface-access.js');
    expect(shell).toContain("'see:church-staff'");
    expect(lib).toContain("'see:church-staff'");
  });
  it('CATCHES a replay that would revert the redefined function', () => {
    // migration-replay-order-guard caught exactly this on the first draft: the
    // viewer-readonly leg replays 0126, which would have restored the closed
    // allowlist and silently removed the key.
    const wf = readFileSync(join(SRC, '../../.github/workflows/rls-isolation.yml'), 'utf8');
    const leg = wf.slice(wf.indexOf('feature: viewer-readonly'));
    const line = leg.slice(0, leg.indexOf('\n', leg.indexOf('migrations:')));
    expect(line).toContain('0211-ask-for-a-tab-and-the-office-decides.sql');
    expect(line.indexOf('0126-member-capability-checklist.sql'))
      .toBeLessThan(line.indexOf('0211-ask-for-a-tab-and-the-office-decides.sql'));
  });
});
