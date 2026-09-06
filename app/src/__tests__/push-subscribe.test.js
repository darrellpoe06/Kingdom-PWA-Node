// @vitest-environment node
// =============================================================================
// push-subscribe — the client half, and mostly its REFUSALS
// =============================================================================
// The interesting cases are the ones where nothing happens, because a refusal
// that behaves wrongly is invisible until someone is annoyed — or, worse,
// cannot make the buzzing stop. Two properties are load-bearing and asserted
// hard below:
//   • we NEVER prompt except from an explicit enable, and never re-prompt once
//     denied (a denied origin is denied for good, and a prompt fired on load is
//     how an app earns that);
//   • disabling ALWAYS tears down the browser subscription, even when the
//     database write fails. Stopping notifications must not depend on the
//     network being up.
import { describe, it, expect } from 'vitest';
import {
  pushSupported, permissionState, vapidKeyToBytes, subscriptionToRow,
  enablePush, disablePush, updateTopics, pushStatus, PUSH_TOPICS,
} from '../lib/push-subscribe.js';

const VALID_KEY = (() => {
  const b = new Uint8Array(65);
  b[0] = 0x04;
  for (let i = 1; i < 65; i += 1) b[i] = i;
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
})();

function fakeWin({ permission = 'default', requestResult = 'granted', supported = true } = {}) {
  let asked = 0;
  const win = {
    navigator: supported ? { serviceWorker: {}, userAgent: 'TestBrowser/1.0' } : {},
    Notification: {
      permission,
      requestPermission: async () => { asked += 1; return requestResult; },
    },
    asked: () => asked,
  };
  if (supported) win.PushManager = function PushManager() {};
  return win;
}

function fakeSubscription(endpoint = 'https://fcm.googleapis.com/fcm/send/abc') {
  let unsubscribed = false;
  return {
    endpoint,
    toJSON: () => ({ endpoint, keys: { p256dh: 'BPk_p256dh_value', auth: 'auth_value' } }),
    unsubscribe: async () => { unsubscribed = true; return true; },
    wasUnsubscribed: () => unsubscribed,
  };
}

function fakeRegistration({ existing = null, subscribeThrows = null } = {}) {
  let current = existing;
  const calls = { subscribe: [] };
  return {
    calls,
    pushManager: {
      getSubscription: async () => current,
      subscribe: async (opts) => {
        calls.subscribe.push(opts);
        if (subscribeThrows) throw new Error(subscribeThrows);
        current = fakeSubscription();
        return current;
      },
    },
  };
}

function fakeSupabase({ error = null } = {}) {
  const ops = [];
  const api = {
    ops,
    from(table) {
      const chain = {
        upsert(row, opts) { ops.push({ op: 'upsert', table, row, opts }); return Promise.resolve({ error }); },
        update(patch) { ops.push({ op: 'update', table, patch }); return chain; },
        delete() { ops.push({ op: 'delete', table }); return chain; },
        eq(col, val) {
          const last = ops[ops.length - 1];
          last.eq = { col, val };
          return Promise.resolve({ error });
        },
      };
      return chain;
    },
  };
  return api;
}

describe('feature detection and permission reading never prompt', () => {
  it('reports unsupported when any piece is missing', () => {
    expect(pushSupported(fakeWin({ supported: false }))).toBe(false);
    expect(permissionState(fakeWin({ supported: false }))).toBe('unsupported');
    expect(pushSupported(undefined)).toBe(false);
  });

  it('reads the permission WITHOUT asking for it', () => {
    const win = fakeWin({ permission: 'default' });
    expect(permissionState(win)).toBe('default');
    expect(win.asked(), 'reading the state must never prompt').toBe(0);
  });
});

describe('vapidKeyToBytes — a bad key fails loudly, not at send time', () => {
  it('decodes a valid uncompressed P-256 point', () => {
    const bytes = vapidKeyToBytes(VALID_KEY);
    expect(bytes.length).toBe(65);
    expect(bytes[0]).toBe(0x04);
  });

  it('refuses a key of the wrong length or the wrong form', () => {
    expect(() => vapidKeyToBytes('AAAA')).toThrow(/65-byte/);
    const notUncompressed = VALID_KEY.replace(/^BA/, 'AA');
    expect(() => vapidKeyToBytes(notUncompressed)).toThrow();
  });
});

describe('subscriptionToRow — the row the sender will actually read', () => {
  it('carries the endpoint, both keys, and the requested topics', () => {
    const row = subscriptionToRow(fakeSubscription(), {
      instanceId: 'inst-1', userId: 'user-1', topics: ['live'],
    });
    expect(row.endpoint).toBe('https://fcm.googleapis.com/fcm/send/abc');
    expect(row.p256dh).toBe('BPk_p256dh_value');
    expect(row.auth).toBe('auth_value');
    expect(row.topics).toEqual(['live']);
  });

  it('defaults to every topic when none is named', () => {
    expect(subscriptionToRow(fakeSubscription(), { instanceId: 'i', userId: 'u' }).topics)
      .toEqual(PUSH_TOPICS);
  });

  it('drops a topic nobody defined rather than storing it', () => {
    const row = subscriptionToRow(fakeSubscription(), { instanceId: 'i', userId: 'u', topics: ['live', 'spam'] });
    expect(row.topics).toEqual(['live']);
  });

  it('CLEARS a prior disable — a device coming back must not stay pruned', () => {
    const row = subscriptionToRow(fakeSubscription(), { instanceId: 'i', userId: 'u' });
    expect(row.disabled_at).toBeNull();
    expect(row.failure_count).toBe(0);
  });

  it('refuses a subscription missing its keys', () => {
    expect(() => subscriptionToRow({ toJSON: () => ({ endpoint: 'https://x', keys: {} }) }, {}))
      .toThrow(/missing its keys/);
  });
});

describe('enablePush — every refusal is a RESULT the UI can explain', () => {
  const base = { vapidPublicKey: VALID_KEY, instanceId: 'inst-1', userId: 'user-1' };

  it('subscribes, persists, and upserts ON THE ENDPOINT', async () => {
    const supabase = fakeSupabase();
    const out = await enablePush({
      ...base, registration: fakeRegistration(), supabase, win: fakeWin({ permission: 'granted' }),
    });
    expect(out.ok).toBe(true);
    expect(supabase.ops[0].op).toBe('upsert');
    expect(supabase.ops[0].table).toBe('push_subscriptions');
    // Duplicates would each buzz the same pocket.
    expect(supabase.ops[0].opts).toEqual({ onConflict: 'endpoint' });
  });

  it('asks for permission exactly once when it is still default', async () => {
    const win = fakeWin({ permission: 'default', requestResult: 'granted' });
    const out = await enablePush({ ...base, registration: fakeRegistration(), supabase: fakeSupabase(), win });
    expect(out.ok).toBe(true);
    expect(win.asked()).toBe(1);
  });

  it('does NOT ask again when already granted', async () => {
    const win = fakeWin({ permission: 'granted' });
    await enablePush({ ...base, registration: fakeRegistration(), supabase: fakeSupabase(), win });
    expect(win.asked()).toBe(0);
  });

  it('does NOT re-prompt when already denied — browsers do not re-ask', async () => {
    const win = fakeWin({ permission: 'denied' });
    const out = await enablePush({ ...base, registration: fakeRegistration(), supabase: fakeSupabase(), win });
    expect(out).toEqual({ ok: false, reason: 'denied' });
    expect(win.asked()).toBe(0);
  });

  it('reports a dismissed prompt distinctly from a denial', async () => {
    const win = fakeWin({ permission: 'default', requestResult: 'default' });
    const out = await enablePush({ ...base, registration: fakeRegistration(), supabase: fakeSupabase(), win });
    expect(out.reason).toBe('dismissed');
  });

  it('refuses when push is unconfigured, unsupported, or signed out — never half-subscribes', async () => {
    const reg = fakeRegistration();
    const sb = fakeSupabase();
    expect((await enablePush({ ...base, vapidPublicKey: '', registration: reg, supabase: sb, win: fakeWin({ permission: 'granted' }) })).reason).toBe('not-configured');
    expect((await enablePush({ ...base, registration: reg, supabase: sb, win: fakeWin({ supported: false }) })).reason).toBe('unsupported');
    expect((await enablePush({ ...base, registration: null, supabase: sb, win: fakeWin({ permission: 'granted' }) })).reason).toBe('no-service-worker');
    expect((await enablePush({ ...base, userId: null, registration: reg, supabase: sb, win: fakeWin({ permission: 'granted' }) })).reason).toBe('not-signed-in');
    expect(sb.ops, 'a refusal must write nothing').toHaveLength(0);
  });

  it('reuses an existing subscription instead of creating a second one', async () => {
    const reg = fakeRegistration({ existing: fakeSubscription('https://fcm.googleapis.com/fcm/send/already') });
    const out = await enablePush({ ...base, registration: reg, supabase: fakeSupabase(), win: fakeWin({ permission: 'granted' }) });
    expect(reg.calls.subscribe, 'must not re-subscribe').toHaveLength(0);
    expect(out.row.endpoint).toBe('https://fcm.googleapis.com/fcm/send/already');
  });

  it('always subscribes with userVisibleOnly — a silent push is refused by browsers', async () => {
    const reg = fakeRegistration();
    await enablePush({ ...base, registration: reg, supabase: fakeSupabase(), win: fakeWin({ permission: 'granted' }) });
    expect(reg.calls.subscribe[0].userVisibleOnly).toBe(true);
    expect(reg.calls.subscribe[0].applicationServerKey.length).toBe(65);
  });

  it('surfaces a subscribe failure rather than reporting success', async () => {
    const out = await enablePush({
      ...base, registration: fakeRegistration({ subscribeThrows: 'push service unreachable' }),
      supabase: fakeSupabase(), win: fakeWin({ permission: 'granted' }),
    });
    expect(out.ok).toBe(false);
    expect(out.reason).toBe('subscribe-failed');
  });

  it('surfaces a save failure rather than reporting success', async () => {
    const out = await enablePush({
      ...base, registration: fakeRegistration(), supabase: fakeSupabase({ error: { message: 'rls denied' } }),
      win: fakeWin({ permission: 'granted' }),
    });
    expect(out.ok).toBe(false);
    expect(out.reason).toBe('save-failed');
  });
});

describe('disablePush — stopping the buzzing NEVER depends on the network', () => {
  it('unsubscribes the browser and deletes the row', async () => {
    const sub = fakeSubscription();
    const supabase = fakeSupabase();
    const out = await disablePush({ registration: fakeRegistration({ existing: sub }), supabase });
    expect(out.unsubscribed).toBe(true);
    expect(sub.wasUnsubscribed()).toBe(true);
    expect(out.rowDeleted).toBe(true);
    expect(supabase.ops[0]).toMatchObject({ op: 'delete', table: 'push_subscriptions' });
    expect(supabase.ops[0].eq).toEqual({ col: 'endpoint', val: sub.endpoint });
  });

  it('STILL unsubscribes when the database delete fails, and says so', async () => {
    // The person stops being notified either way; the stale row is pruned by
    // the sender's next 404/410. Holding someone hostage to a failed DELETE
    // would be the real defect.
    const sub = fakeSubscription();
    const out = await disablePush({
      registration: fakeRegistration({ existing: sub }),
      supabase: fakeSupabase({ error: { message: 'network down' } }),
    });
    expect(sub.wasUnsubscribed(), 'the browser subscription must be torn down regardless').toBe(true);
    expect(out.ok).toBe(true);
    expect(out.rowDeleted).toBe(false);
    expect(out.error).toBe('network down');
  });

  it('is a clean no-op when there was no subscription', async () => {
    const supabase = fakeSupabase();
    const out = await disablePush({ registration: fakeRegistration(), supabase });
    expect(out).toMatchObject({ ok: true, reason: 'not-subscribed', rowDeleted: false });
    expect(supabase.ops).toHaveLength(0);
  });
});

describe('updateTopics — changing your mind must not re-prompt', () => {
  it('updates the row for this endpoint only', async () => {
    const sub = fakeSubscription();
    const supabase = fakeSupabase();
    const out = await updateTopics({ registration: fakeRegistration({ existing: sub }), supabase, topics: ['live'] });
    expect(out).toMatchObject({ ok: true, topics: ['live'] });
    expect(supabase.ops[0].patch.topics).toEqual(['live']);
    expect(supabase.ops[0].eq).toEqual({ col: 'endpoint', val: sub.endpoint });
  });

  it('turning every topic off is allowed — it is the soft mute', async () => {
    const out = await updateTopics({
      registration: fakeRegistration({ existing: fakeSubscription() }), supabase: fakeSupabase(), topics: [],
    });
    expect(out).toMatchObject({ ok: true, topics: [] });
  });

  it('refuses when this device never subscribed', async () => {
    expect((await updateTopics({ registration: fakeRegistration(), supabase: fakeSupabase(), topics: ['live'] })).reason)
      .toBe('not-subscribed');
  });
});

describe('pushStatus — the surface renders LIVE state, not a saved preference', () => {
  it('reports the real subscription, not a stored flag', async () => {
    expect(await pushStatus({
      registration: fakeRegistration({ existing: fakeSubscription() }), win: fakeWin({ permission: 'granted' }),
    })).toEqual({ supported: true, permission: 'granted', subscribed: true });

    // Permission granted but no subscription is a REAL and common state (the
    // row was deleted elsewhere, or the browser rotated it). A UI reading a
    // saved "notifications: on" would lie here.
    expect(await pushStatus({
      registration: fakeRegistration(), win: fakeWin({ permission: 'granted' }),
    })).toEqual({ supported: true, permission: 'granted', subscribed: false });
  });

  it('reports unsupported without touching the registration', async () => {
    expect(await pushStatus({ registration: null, win: fakeWin({ supported: false }) }))
      .toEqual({ supported: false, permission: 'unsupported', subscribed: false });
  });
});
