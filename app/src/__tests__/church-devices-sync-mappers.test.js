// @vitest-environment node
//
// church-devices-sync — the pure local<->row mappers behind the register's
// steward editor. The load-bearing claim: deviceFromRow carries the DB row's
// uuid as remoteUuid so an edit UPDATEs the existing row (saveDevice's
// remoteUuid branch) instead of INSERTing a slug-duplicate — and deviceToRow
// never writes that identity field back. supabase is mocked (same pattern as
// device-inventory-render.test.jsx); only the pure mappers are exercised.
import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/supabase.js', () => {
  const supabase = {
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
    from: () => ({}),
    rpc: () => Promise.resolve({ data: null, error: null }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
  };
  return { default: supabase, supabase };
});

import { deviceFromRow, deviceToRow } from '../lib/church-devices-sync.js';

const ROW = {
  id: 'a1b2c3d4-0000-0000-0000-00000000dead',
  slug: 'dev-nas-ds1621xs',
  name: 'PoeTech NAS — DS1621xs',
  device_type: 'nas',
  location: 'Church rack',
  status: 'online',
  steward: 'Darrell',
  make_model: 'Synology DS1621xs',
  serial: null,
  ip_address: '192.168.1.26',
  specs: { cores: 8 },
  capabilities: ['storage', 'transcription'],
  capital_project_slug: null,
  sme_needed: false,
  confirmed: true,
  notes: 'Confirmed on site.',
  active: true,
  author_persona: null,
  sort_order: 10,
};

describe('deviceFromRow — the DB uuid rides along for in-place updates', () => {
  it('maps the row and attaches remoteUuid = row.id (slug stays the local id)', () => {
    const d = deviceFromRow(ROW);
    expect(d.id).toBe('dev-nas-ds1621xs');
    expect(d.remoteUuid).toBe(ROW.id);
    expect(d.name).toBe(ROW.name);
    expect(d.status).toBe('online');
    expect(d.confirmed).toBe(true);
  });
});

describe('deviceToRow — identity fields never round-trip into the row', () => {
  it('does not write remoteUuid (or any id column) back into the insert row', () => {
    const d = deviceFromRow(ROW);
    const row = deviceToRow(d, { tenantId: 'tenant-1', userId: 'user-1' });
    expect(row).not.toHaveProperty('remoteUuid');
    expect(row).not.toHaveProperty('id');
    expect(row.slug).toBe('dev-nas-ds1621xs');
    expect(row.instance_id).toBe('tenant-1');
    expect(row.created_by).toBe('user-1');
  });
});
