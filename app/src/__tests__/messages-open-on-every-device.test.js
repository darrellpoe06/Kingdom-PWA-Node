// @vitest-environment node
// =============================================================================
// Messages open on every device — the sync layer, end to end on a fake database
// =============================================================================
// Darrell 2026-10-01: "The encrypted message is sent however sometimes I can see
// it and others not on the same device... I actually want it to work on
// multiple devices... why not?" Three devices share one fake database: his
// phone, his desktop, and Shay's phone. Each device is its own localStorage
// (its device id and its keypair live there). A message he sends from the
// phone opens on Shay's phone AND on his desktop; one she sends opens on both
// of his; a device that joins later is told it was sealed before it joined;
// a v1 body sealed to a key still opens on the device that holds it.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { webcrypto } from 'node:crypto';

// --- the fake database ------------------------------------------------------
// Hoisted with the mocks: vi.mock factories run before any top-level binding.
const { rows, state, supabase } = vi.hoisted(() => {
  const rows = { dm_public_keys: [], dm_device_keys: [], direct_messages: [] };
  const state = { session: null, nextId: 1 };
  function matches(r, filters) { return filters.every(([k, v]) => r[k] === v); }
  function table(name) {
    const filters = [];
    const q = {
      select() { return q; },
      eq(k, v) { filters.push([k, v]); return q; },
      order() { return Promise.resolve({ data: rows[name].filter((r) => matches(r, filters)).map((r) => ({ ...r })), error: null }); },
      maybeSingle() { const r = rows[name].find((x) => matches(x, filters)); return Promise.resolve({ data: r ? { ...r } : null, error: null }); },
      then(res, rej) { return Promise.resolve({ data: rows[name].filter((r) => matches(r, filters)).map((r) => ({ ...r })), error: null }).then(res, rej); },
      upsert(row, opts) {
        const keys = String((opts && opts.onConflict) || '').split(',');
        const i = rows[name].findIndex((r) => keys.every((k) => r[k] === row[k]));
        if (i >= 0) rows[name][i] = { ...rows[name][i], ...row }; else rows[name].push({ ...row });
        return Promise.resolve({ error: null });
      },
      insert(row) {
        const r = { id: `m${state.nextId}`, created_at: new Date(2026, 9, 1, 8, state.nextId).toISOString(), read_at: null, ...row };
        state.nextId += 1;
        rows[name].push(r);
        return { select() { return { maybeSingle: () => Promise.resolve({ data: { id: r.id }, error: null }) }; } };
      },
      delete() {
        return {
          eq(k, v) {
            filters.push([k, v]);
            return {
              eq(k2, v2) { filters.push([k2, v2]); rows[name] = rows[name].filter((r) => !matches(r, filters)); return Promise.resolve({ error: null }); },
            };
          },
        };
      },
    };
    return q;
  }
  const supabase = {
    auth: { getSession: async () => ({ data: { session: state.session } }) },
    from: (name) => table(name),
    rpc: async () => ({ data: [], error: null }),
    channel() { const c = { on: () => c, subscribe: () => c }; return c; },
    removeChannel() {},
  };
  return { rows, state, supabase };
});
vi.mock('../lib/supabase.js', () => ({ default: supabase, supabase }));
vi.mock('../lib/push-announce.js', () => ({ notifyNewMessage: async () => ({ ok: true }) }));
vi.mock('../lib/church-instance.js', () => ({ churchInstanceId: async () => 'church-inst' }));
vi.mock('../lib/device-trust.js', () => ({ deviceLabel: () => 'Test device' }));

import {
  publishDmPublicKey, sendDirectMessage, resetDmKeyCaches, loadMyDmDevices, forgetDmDevice, openDmShape,
  isSealedV2, LOCKED_BEFORE_THIS_DEVICE, LOCKED_PLACEHOLDER,
} from '../lib/direct-messages-sync.js';
import { toDmShape } from '../lib/direct-messages.js';
import { sealedFor, deviceKeyId, ensureDmKeypair, deriveDmKey, encryptDmBody } from '../lib/dm-encryption.js';

// --- devices: each one is a storage; "being on" a device swaps the globals ---
const memStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear() };
};
const DARRELL = 'c2a6c39a-0000-0000-0000-000000000001';
const SHAY = '737f5d3b-0000-0000-0000-000000000002';
function makeDevice(userId) { return { userId, storage: memStorage() }; }
function on(dev) {
  globalThis.localStorage = dev.storage;
  state.session = { user: { id: dev.userId, email: `${dev.userId.slice(0, 8)}@example.test` } };
  resetDmKeyCaches();
}
function deviceIdOf(dev) { return dev.storage.getItem('poe-device-id'); }

// The surface's own read path: fetch every row and decrypt from MY side.
// subscribeDirectMessages wraps this in streams and timers; the shaping and
// opening are what is proven here, through the module's exported pieces.
async function inbox(dev) {
  on(dev);
  const { data } = await supabase.from('direct_messages').select('*').order();
  return Promise.all(data.map((r) => openDmShape(toDmShape(r, dev.userId), dev.userId)));
}

beforeEach(() => {
  rows.dm_public_keys = []; rows.dm_device_keys = []; rows.direct_messages = [];
  state.nextId = 1;
});

describe('one key per device, every device published', () => {
  it('each device publishes its own row, and the v1 row still carries the latest', async () => {
    const phone = makeDevice(DARRELL); const desk = makeDevice(DARRELL);
    on(phone); const a = await publishDmPublicKey();
    on(desk); const b = await publishDmPublicKey();
    expect(a.devicePublished && b.devicePublished).toBe(true);
    expect(a.deviceId).not.toBe(b.deviceId);
    expect(rows.dm_device_keys.map((r) => r.device_id).sort()).toEqual([a.deviceId, b.deviceId].sort());
    expect(rows.dm_device_keys.every((r) => r.label === 'Test device' && r.last_seen_at)).toBe(true);
    expect(rows.dm_public_keys).toHaveLength(1);
    const mine = await loadMyDmDevices();
    expect(mine).toHaveLength(2);
    expect(mine[0].thisDevice).toBe(true);
    expect(mine[0].deviceId).toBe(b.deviceId);
  });

  it('forgetting a device removes its row; this device cannot be forgotten', async () => {
    const phone = makeDevice(DARRELL); const desk = makeDevice(DARRELL);
    on(phone); await publishDmPublicKey();
    on(desk); await publishDmPublicKey();
    expect(await forgetDmDevice(deviceIdOf(desk))).toEqual({ skipped: 'this-device' });
    expect(await forgetDmDevice(deviceIdOf(phone))).toEqual({ forgotten: true });
    expect(rows.dm_device_keys.map((r) => r.device_id)).toEqual([deviceIdOf(desk)]);
  });
});

describe('a message opens on every device of both people', () => {
  it('sent from his phone: Shay\'s phone opens it, his desktop opens it, his phone opens its own', async () => {
    const phone = makeDevice(DARRELL); const desk = makeDevice(DARRELL); const shay = makeDevice(SHAY);
    for (const d of [phone, desk, shay]) { on(d); await publishDmPublicKey(); }
    on(phone);
    const sent = await sendDirectMessage(SHAY, 'Want to go for a walk?', 'Darrell', 'church-inst');
    expect(sent.sent).toBe(true);
    expect(sent.encrypted).toBe(true);
    expect(sent.sealedFor).toBe(3);
    const wire = rows.direct_messages[0].body;
    expect(isSealedV2(wire)).toBe(true);
    expect(wire).not.toContain('walk');
    expect(sealedFor(wire).sort()).toEqual([
      deviceKeyId(DARRELL, deviceIdOf(phone)), deviceKeyId(DARRELL, deviceIdOf(desk)), deviceKeyId(SHAY, deviceIdOf(shay)),
    ].sort());
    for (const d of [shay, desk, phone]) {
      const [m] = await inbox(d);
      expect(m.encrypted, `${d.userId.slice(0, 8)} encrypted`).toBe(true);
      expect(m.locked, `${d.userId.slice(0, 8)} opens it`).toBe(false);
      expect(m.body).toBe('Want to go for a walk?');
    }
  });

  it('sent from Shay\'s phone: both of his devices open it', async () => {
    const phone = makeDevice(DARRELL); const desk = makeDevice(DARRELL); const shay = makeDevice(SHAY);
    for (const d of [phone, desk, shay]) { on(d); await publishDmPublicKey(); }
    on(shay);
    const sent = await sendDirectMessage(DARRELL, 'Yes sir. Be ready in 10.', 'Shay', 'church-inst');
    expect(sent.sealedFor).toBe(3);
    for (const d of [phone, desk]) {
      const [m] = await inbox(d);
      expect(m.locked).toBe(false);
      expect(m.body).toBe('Yes sir. Be ready in 10.');
    }
  });

  it('a device that joins AFTER the send is told so in words, and opens the next one', async () => {
    const phone = makeDevice(DARRELL); const shay = makeDevice(SHAY);
    for (const d of [phone, shay]) { on(d); await publishDmPublicKey(); }
    on(shay); await sendDirectMessage(DARRELL, 'before the tablet', 'Shay', 'church-inst');
    const tablet = makeDevice(DARRELL);
    on(tablet); await publishDmPublicKey();
    on(shay); await sendDirectMessage(DARRELL, 'after the tablet', 'Shay', 'church-inst');
    const got = await inbox(tablet);
    expect(got.map((m) => [m.locked, m.body])).toEqual([[true, LOCKED_BEFORE_THIS_DEVICE], [false, 'after the tablet']]);
    // The phone, which was there for both, opens both.
    const onPhone = await inbox(phone);
    expect(onPhone.map((m) => m.body)).toEqual(['before the tablet', 'after the tablet']);
  });

  it('a recipient with only a v1 key gets a v1 body, and a v1 body still opens where its key is held', async () => {
    const phone = makeDevice(DARRELL); const shay = makeDevice(SHAY);
    on(shay); await publishDmPublicKey();
    rows.dm_device_keys = []; // Shay's app has not updated: only the v1 row exists
    on(phone); await publishDmPublicKey();
    const sent = await sendDirectMessage(SHAY, 'old road', 'Darrell', 'church-inst');
    expect(sent.encrypted).toBe(true);
    expect(sent.sealedFor).toBe(0);
    expect(rows.direct_messages[0].body.startsWith('e2e:v1:')).toBe(true);
    const [m] = await inbox(shay);
    expect(m.locked).toBe(false);
    expect(m.body).toBe('old road');
  });

  it('a v1 body sealed to a key this device never held stays locked with the v1 words', async () => {
    const shay = makeDevice(SHAY); const phone = makeDevice(DARRELL);
    on(shay); await publishDmPublicKey();
    on(phone); await publishDmPublicKey();
    // Sealed elsewhere, to a key nobody here holds.
    const stray = await ensureDmKeypair('stranger', { cryptoObj: webcrypto, storage: memStorage() });
    const k = await deriveDmKey(stray.privateJwk, rows.dm_public_keys.find((r) => r.user_id === DARRELL).public_jwk, { cryptoObj: webcrypto });
    rows.direct_messages.push({ id: 'x1', instance_id: 'church-inst', sender_user_id: SHAY, recipient_user_id: DARRELL, sender_name: 'Shay', body: await encryptDmBody('lost', k, { cryptoObj: webcrypto }), created_at: new Date().toISOString(), read_at: null });
    const [m] = await inbox(phone);
    expect(m.locked).toBe(true);
    expect(m.body).toBe(LOCKED_PLACEHOLDER);
  });

  it('nobody has a key: the body ships plain and says so', async () => {
    const phone = makeDevice(DARRELL);
    on(phone);
    const sent = await sendDirectMessage(SHAY, 'plain words', 'Darrell', 'church-inst');
    expect(sent.encrypted).toBe(false);
    expect(rows.direct_messages[0].body).toBe('plain words');
  });
});
