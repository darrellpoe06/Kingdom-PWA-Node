// =============================================================================
// group-messages tests — DR-0231 P1 foundation proven: shapes, threading,
// honest sends, and the roster registry the UI will mount on.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { GROUP_ROSTERS, toGroupMessageShape, threadsByRoster, loadGroupMessages, sendGroupMessage } from '../lib/group-messages.js';

describe('GROUP_ROSTERS — the groups mirror the real rosters', () => {
  it('carries members + the three ministry rosters, each labeled', () => {
    expect(GROUP_ROSTERS.map((g) => g.key)).toEqual(['members', 'choir', 'bus', 'security']);
    for (const g of GROUP_ROSTERS) expect(g.label.length).toBeGreaterThan(2);
  });
});

describe('threading — remembered as written, oldest-first per roster', () => {
  const rows = [
    { id: 'm2', roster: 'choir', sender_user_id: 'u2', sender_name: 'Christyn', body: 'Rehearsal at 6', created_at: '2026-07-23T02:00:00Z' },
    { id: 'm1', roster: 'choir', sender_user_id: 'u1', sender_name: 'Darrell', body: 'Sound check?', created_at: '2026-07-23T01:00:00Z' },
    { id: 'm3', roster: 'members', sender_user_id: 'u1', sender_name: 'Darrell', body: 'Family: dinner Sunday', created_at: '2026-07-23T03:00:00Z' },
  ];
  it('splits per roster and orders within each', () => {
    const t = threadsByRoster(rows, 'u1');
    expect(t.choir.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(t.members).toHaveLength(1);
    expect(t.choir[0].mine).toBe(true);
    expect(t.choir[1].mine).toBe(false);
  });
  it('shapes degrade honestly on missing fields', () => {
    const s = toGroupMessageShape({ id: 'x' }, null);
    expect(s.roster).toBe('members');
    expect(s.senderName).toBe('Someone');
    expect(s.mine).toBe(false);
    expect(s.atIso).toBeNull();
  });
});

const clientWith = (result) => ({
  from: () => ({
    select: () => ({ eq: () => ({ order: () => ({ limit: async () => result }) }) }),
    insert: async () => result,
  }),
});

describe('I/O — the server gate answers, this client never invents access', () => {
  it('loads newest-limited then returns oldest-first', async () => {
    const r = await loadGroupMessages(clientWith({ data: [{ id: 'b', created_at: '2' }, { id: 'a', created_at: '1' }] }), 'i1');
    expect(r.ok).toBe(true);
    expect(r.rows.map((x) => x.id)).toEqual(['a', 'b']);
  });
  it('send: empty is refused locally; an RLS denial reads not-in-group; other errors read network', async () => {
    expect((await sendGroupMessage(clientWith({}), { body: '   ' })).reason).toBe('empty');
    const denied = await sendGroupMessage(clientWith({ error: { code: '42501' } }), { instanceId: 'i1', roster: 'choir', body: 'hi', senderUserId: 'u1' });
    expect(denied).toEqual({ ok: false, reason: 'not-in-group' });
    const net = await sendGroupMessage(clientWith({ error: { code: '500' } }), { instanceId: 'i1', roster: 'choir', body: 'hi', senderUserId: 'u1' });
    expect(net.reason).toBe('network');
    const ok = await sendGroupMessage(clientWith({ error: null }), { instanceId: 'i1', roster: 'members', body: 'hi', senderUserId: 'u1' });
    expect(ok.ok).toBe(true);
  });
});
