// @vitest-environment node
// =============================================================================
// THE DOORS SHOW IN THE FAMILY APP AGAIN (DR-0743)
// =============================================================================
// Darrell 2026-10-01, Real Estate on his Fold reading "PROPERTIES · 0" over
// 13 real doors: "Properties?!!!!!" / "Features checks didn't catch this?"
//
// Measured on the live database (sovereign-read run 36913318713): rentals
// holds 13 rows, nothing deleted. Since 0207 (DR-0365) every door lives in the
// landlord instance poe-properties, and the family app's door sync still asked
// the FAMILY instance, so it read none. Now a table sync takes an `instanceId`
// resolver and the door sync resolves the landlord membership first.
//
// PROVEN-TO-CATCH: the last case gives a sync NO resolver and asserts it still
// reads the family instance; point the default at the landlord resolver and it
// fails, as does the first case if getDoorsInstanceId stops preferring the
// landlord seat.
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// What each RPC answers; staged per test. The family resolver joins/returns
// the family instance id; the landlord resolver returns a membership or null.
let landlord = { data: { instance_id: 'inst-landlord', instance_slug: 'poe-properties', role: 'owner' }, error: null };
let family = { data: 'inst-family', error: null };
const eqCalls = [];
const inserted = [];
const rpc = vi.fn(async (name) => {
  if (name === 'my_properties_instance_role') return landlord;
  if (name === 'join_default_instance') return family;
  return { data: null, error: { message: `no such rpc ${name}` } };
});

vi.mock('../lib/supabase.js', () => ({
  default: {
    rpc: (...a) => rpc(...a),
    from: vi.fn(() => {
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn((col, val) => { eqCalls.push([col, val]); return builder; }),
        order: vi.fn(() => builder),
        range: vi.fn(async () => ({ data: [], error: null })),
        insert: vi.fn((row) => { inserted.push(row); return { select: () => ({ single: async () => ({ data: { id: 'uuid-new', ...row }, error: null }) }) }; }),
      };
      return builder;
    }),
    auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'u-darrell' } } } })) },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}));

import { createTableSync, getDoorsInstanceId, getPropertiesInstanceId } from '../lib/table-sync.js';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(SRC, p), 'utf8');

beforeEach(() => {
  eqCalls.length = 0;
  inserted.length = 0;
  rpc.mockClear();
  landlord = { data: { instance_id: 'inst-landlord', instance_slug: 'poe-properties', role: 'owner' }, error: null };
  family = { data: 'inst-family', error: null };
});

describe('getDoorsInstanceId: the landlord seat wins, the family instance is the fallback', () => {
  it('a landlord member reads the landlord instance', async () => {
    expect(await getPropertiesInstanceId()).toBe('inst-landlord');
    expect(await getDoorsInstanceId()).toBe('inst-landlord');
  });
  it('no landlord seat falls back to the family instance, so a household that never moved its doors is unchanged', async () => {
    landlord = { data: null, error: null };
    expect(await getPropertiesInstanceId()).toBeNull();
    expect(await getDoorsInstanceId()).toBe('inst-family');
  });
  it('a failing landlord lookup falls back and says so, never a wrong read in silence', async () => {
    landlord = { data: null, error: { message: 'function does not exist' } };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await getDoorsInstanceId()).toBe('inst-family');
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/landlord instance lookup failed/), expect.anything());
    warn.mockRestore();
  });
});

describe('a table sync given a resolver reads and writes that instance', () => {
  const toRow = vi.fn((item, { tenantId, userId }) => ({ slug: item.id, instance_id: tenantId, created_by: userId }));
  const doors = createTableSync({ localKey: 'rentals', remoteTable: 'rentals', toRow, fromRow: (x) => x, instanceId: getDoorsInstanceId });

  it('the full read filters by the landlord instance', async () => {
    const rows = await doors.fetchAll();
    expect(rows).toEqual([]);
    expect(eqCalls).toContainEqual(['instance_id', 'inst-landlord']);
    expect(eqCalls.some(([, v]) => v === 'inst-family')).toBe(false);
  });
  it('a write is addressed to the landlord instance', async () => {
    const res = await doors.upload({ id: '240-cedar-ln' });
    expect(res.uploaded).toBe(true);
    expect(toRow).toHaveBeenCalledWith({ id: '240-cedar-ln' }, { tenantId: 'inst-landlord', userId: 'u-darrell' });
    expect(inserted[0].instance_id).toBe('inst-landlord');
  });
  it('PROVEN-TO-CATCH: a sync with no resolver still reads the family instance', async () => {
    const plain = createTableSync({ localKey: 'transactions', remoteTable: 'transactions', toRow: (x) => x, fromRow: (x) => x });
    await plain.fetchAll();
    expect(eqCalls).toContainEqual(['instance_id', 'inst-family']);
    expect(eqCalls.some(([, v]) => v === 'inst-landlord')).toBe(false);
  });
});

describe('the door sync is wired to the landlord resolver (source pins)', () => {
  it('rentals-sync passes instanceId: getDoorsInstanceId and resolves its lease ids the same way', () => {
    const src = read('lib/rentals-sync.js');
    expect(src).toMatch(/instanceId: getDoorsInstanceId,/);
    expect(src).toMatch(/Promise\.all\(\[getDoorsInstanceId\(\), supabase\.auth\.getUser\(\)\]\)/);
    expect(src).not.toMatch(/\bgetInstanceId\b/);
  });
  it('every instance lookup inside createTableSync goes through the resolver, never the family resolver directly', () => {
    const src = read('lib/table-sync.js');
    const body = src.slice(src.indexOf('export function createTableSync(spec)'));
    expect(body).not.toMatch(/await getTenantId\(\)/);
    expect(body).toMatch(/instanceId = getTenantId,/);
  });
  it('the sovereign instances read names the real column, so the question can be asked of the live database', () => {
    const script = readFileSync(join(SRC, '..', '..', 'scripts', 'sovereign-read-over-tailnet.sh'), 'utf8');
    expect(script).toMatch(/i\.display_name,/);
    expect(script).not.toMatch(/\bi\.name,/);
  });
});
