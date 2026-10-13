// @vitest-environment node
// =============================================================================
// person-record — everything on record for one person, and what is not (DR-0828)
// =============================================================================
// Pure: the record is built from rows the viewer already read. The doors come
// from member-contact's rules (a phone-door address is a phone), the name from
// the viewer's contacts (DR-0825), the devices from both tables newest first,
// the reach links only where a fact supports them, and the not-held list says
// plainly what the cloud never carries. Fixtures are made up.
import { describe, it, expect, vi } from 'vitest';
import { buildPersonRecord, dmDeviceView, presenceView, lanDeviceView, sortDevices, reachLinks, summaryLine, NOT_HELD } from '../lib/person-record.js';
import { buildContactIndex } from '../lib/contact-names.js';

const store = { dm: { ok: true, rows: [], reason: '' }, presence: { ok: true, rows: [], reason: '' } };
vi.mock('../lib/supabase.js', () => ({ default: {} }));

describe('the views', () => {
  it('a message device: label, when, what it can do', () => {
    expect(dmDeviceView({ device_id: 'dev-1', label: 'Android device', last_seen_at: '2026-10-08T00:00:00Z' }))
      .toEqual({ kind: 'messages', id: 'dev-1', label: 'Android device', lastSeenAt: '2026-10-08T00:00:00Z', note: 'can open their sealed messages' });
    expect(dmDeviceView({ device_id: 'dev-2' }).label).toBe('Unnamed device');
  });
  it('a presence row: coarse platform and the build, never more (0055)', () => {
    expect(presenceView({ platform: 'web', build_sha: 'abcdef1234', last_seen_at: '2026-10-09T00:00:00Z' }))
      .toEqual({ kind: 'presence', id: 'web:abcdef1234', label: 'web', lastSeenAt: '2026-10-09T00:00:00Z', note: 'build abcdef1' });
    expect(presenceView({}).note).toBe('build not recorded');
  });
  it('a LAN device from the register: name, type, where, and the MAC the scan recorded (DR-0830)', () => {
    expect(lanDeviceView({ id: 'r1', name: 'Booth laptop', device_type: 'media-rig', location: 'AV booth', specs: { mac: 'DC-ED-84-A0-B4-CA (scan-confirmed)' }, updated_at: '2026-10-01T00:00:00Z' }))
      .toEqual({ kind: 'lan', id: 'r1', label: 'Booth laptop', lastSeenAt: '2026-10-01T00:00:00Z', note: 'media-rig at AV booth · MAC DC-ED-84-A0-B4-CA (scan-confirmed)' });
    expect(lanDeviceView({ name: 'Phone', device_type: 'iot', specs: {} }).note).toBe('iot · MAC not recorded');
  });
  it('newest first; an undated row last', () => {
    const out = sortDevices([{ lastSeenAt: null }, { lastSeenAt: '2026-10-01T00:00:00Z' }, { lastSeenAt: '2026-10-09T00:00:00Z' }]);
    expect(out.map((d) => d.lastSeenAt)).toEqual(['2026-10-09T00:00:00Z', '2026-10-01T00:00:00Z', null]);
  });
});

describe('reachLinks: only where a fact supports a link', () => {
  it('phone gives text and call; email gives mail; nothing gives nothing', () => {
    expect(reachLinks({ phoneDigits: '15550100498', email: 'lamb@example.org' }).map((r) => [r.kind, r.href]))
      .toEqual([['text', 'sms:15550100498'], ['call', 'tel:15550100498'], ['email', 'mailto:lamb@example.org']]);
    expect(reachLinks({ phoneDigits: '', email: '' })).toEqual([]);
  });
});

describe('buildPersonRecord', () => {
  const idx = buildContactIndex([{ name: 'Sister Lamb', phones: ['(555) 010-0498'], emails: [] }]);
  const door = { userId: 'u-door', displayName: '', email: '15550100498@phone.poetech.us', role: 'member' };

  it('a phone-door member: named from the viewer\'s contacts, the phone as the door, text and call to reach', () => {
    const rec = buildPersonRecord({ member: door, contactIndex: idx, dmDevices: [{ device_id: 'd1', label: 'Android device', last_seen_at: '2026-10-08T00:00:00Z' }], presence: [{ platform: 'web', build_sha: 'abc1234567', last_seen_at: '2026-10-09T00:00:00Z' }] });
    expect(rec.name).toBe('Sister Lamb');
    expect(rec.nameNote).toBe('from your contacts');
    expect(rec.doors).toEqual([{ kind: 'phone', value: '(555) 010-0498', source: 'the phone they sign in with' }]);
    expect(rec.reach.map((r) => r.kind)).toEqual(['text', 'call']);
    expect(rec.devices.map((d) => d.label)).toEqual(['web', 'Android device']);   // newest first
    const withLan = buildPersonRecord({ member: door, contactIndex: idx, lanDevices: [{ id: 'r1', name: 'Her tablet', device_type: 'iot', specs: { mac: 'AA-BB-CC-DD-EE-FF' }, updated_at: '2026-10-09T00:00:00Z' }] });
    expect(withLan.devices[0]).toMatchObject({ kind: 'lan', label: 'Her tablet', note: 'iot · MAC AA-BB-CC-DD-EE-FF' });
    expect(rec.missing).toEqual(['email']);
    expect(rec.summary).toBe('1 sign-in door · 2 devices seen · 2 ways to reach them');
    expect(rec.notHeld).toBe(NOT_HELD);
  });

  it('a member with nothing: every absence is stated, nothing painted', () => {
    const rec = buildPersonRecord({ member: { userId: 'u-bare', displayName: 'Bare', email: null } });
    expect(rec.name).toBe('Bare');
    expect(rec.doors).toEqual([]);
    expect(rec.reach).toEqual([]);
    expect(rec.devices).toEqual([]);
    expect(rec.summary).toBe('no sign-in door on record · no device seen yet · no way to reach them on record');
  });

  it('the person\'s own answer outranks the derived door, and both doors show', () => {
    const rec = buildPersonRecord({ member: { userId: 'u', displayName: 'Reed', email: 'reed@example.org', declaredPhone: '555-010-0317' } });
    expect(rec.doors).toEqual([
      { kind: 'email', value: 'reed@example.org', source: 'how they sign in' },
      { kind: 'phone', value: '(555) 010-0317', source: 'they told us' },
    ]);
    expect(rec.reach.map((r) => r.kind)).toEqual(['text', 'call', 'email']);
  });

  it('the not-held list names the EIN, the MAC, notification devices and fingerprints, each with its why', () => {
    const whats = NOT_HELD.map((n) => n.what);
    expect(whats).toEqual(['Full SSN or EIN', 'MAC address, from a sign-in', 'Notification devices', 'A device fingerprint']);
    for (const n of NOT_HELD) expect(n.why.length).toBeGreaterThan(30);
    expect(NOT_HELD.find((n) => n.what.startsWith('MAC address')).why).toMatch(/browser cannot read/);
  });

  it('summaryLine counts only what is there, singular and plural', () => {
    expect(summaryLine({ doors: [1], devices: [1], reach: [1] })).toBe('1 sign-in door · 1 device seen · 1 way to reach them');
  });
});

describe('the loader answers with a reason, never a throw', () => {
  it('reads both tables and carries each answer', async () => {
    const { loadPersonRows } = await import('../lib/person-record-sync.js');
    const client = { from: (t) => ({ select: () => ({ eq: () => (t === 'dm_device_keys'
      ? Promise.resolve({ data: store.dm.rows, error: null })
      : t === 'church_devices'
        ? { eq: () => Promise.resolve({ data: [{ id: 'r1', name: 'Her tablet', device_type: 'iot', specs: { mac: 'AA-BB-CC-DD-EE-FF' } }], error: null }) }
        : { eq: () => Promise.resolve({ data: null, error: { message: 'permission denied for table member_presence' } }) }) }) }) };
    store.dm.rows = [{ device_id: 'd1', label: 'iPhone', last_seen_at: '2026-10-08T00:00:00Z' }];
    const r = await loadPersonRows('i-fam', 'u-door', { client });
    expect(r.dm).toEqual({ ok: true, rows: store.dm.rows, reason: '' });
    expect(r.presence.ok).toBe(false);
    expect(r.presence.reason).toMatch(/permission denied/);
    expect(r.lan.ok).toBe(true);
    expect(r.lan.rows[0].name).toBe('Her tablet');
  });
  it('no user: a reason, no read', async () => {
    const { loadPersonRows } = await import('../lib/person-record-sync.js');
    const r = await loadPersonRows('i-fam', '', { client: { from: () => { throw new Error('should not be called'); } } });
    expect(r.dm.ok).toBe(false);
    expect(r.presence.ok).toBe(false);
    expect(r.lan.ok).toBe(false);
  });
});
