// @vitest-environment jsdom
// =============================================================================
// PushNotifications — the control renders REAL state and refuses honestly
// =============================================================================
// The cases that matter are the ones where the control must NOT appear, must
// NOT prompt, or must NOT claim to be on. A notification toggle that lies about
// its own state is worse than no toggle: it tells someone they will be told
// about the service, and then they miss it — which is exactly the experience
// that started this work on 2026-09-06.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../lib/supabase.js', () => ({ supabase: { auth: { getUser: async () => ({ data: { user: null } }) } } }));
vi.mock('../lib/table-sync.js', () => ({ getInstanceId: async () => 'inst-1' }));

import PushNotifications, { REFUSAL_TEXT } from '../components/PushNotifications.jsx';

const VALID_KEY = (() => {
  const b = new Uint8Array(65);
  b[0] = 0x04;
  for (let i = 1; i < 65; i += 1) b[i] = i;
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
})();

function fakeWin({ permission = 'default', requestResult = 'granted' } = {}) {
  let asked = 0;
  return {
    navigator: { serviceWorker: { addEventListener() {}, removeEventListener() {} }, userAgent: 'Test' },
    PushManager: function PushManager() {},
    Notification: {
      permission,
      requestPermission: async () => { asked += 1; return requestResult; },
    },
    asked: () => asked,
  };
}

function fakeSubscription(endpoint = 'https://fcm.googleapis.com/fcm/send/abc', onUnsubscribe) {
  return {
    endpoint,
    toJSON: () => ({ endpoint, keys: { p256dh: 'p256dh', auth: 'auth' } }),
    // A real unsubscribe() makes the browser forget it, so getSubscription()
    // returns null afterwards. The fake models that, or the control would be
    // tested against a browser that does not exist.
    unsubscribe: async () => { if (onUnsubscribe) onUnsubscribe(); return true; },
  };
}

function fakeRegistration({ existing = null } = {}) {
  let current = existing;
  const clear = () => { current = null; };
  if (current && !current.__wired) {
    current = fakeSubscription(current.endpoint, clear);
    current.__wired = true;
  }
  return {
    pushManager: {
      getSubscription: async () => current,
      subscribe: async () => {
        current = fakeSubscription('https://fcm.googleapis.com/fcm/send/abc', clear);
        return current;
      },
    },
  };
}

function fakeSupabase({ error = null, userId = 'user-1' } = {}) {
  const ops = [];
  return {
    ops,
    auth: { getUser: async () => ({ data: { user: userId ? { id: userId } : null } }) },
    from() {
      const chain = {
        upsert(row, opts) { ops.push({ op: 'upsert', row, opts }); return Promise.resolve({ error }); },
        delete() { ops.push({ op: 'delete' }); return chain; },
        eq() { return Promise.resolve({ error }); },
      };
      return chain;
    },
  };
}

let container;
let root;
afterEach(() => {
  try { act(() => root.unmount()); } catch { /* noop */ }
  container?.remove();
  vi.clearAllMocks();
});

async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(createElement(PushNotifications, {
      vapidPublicKey: VALID_KEY,
      resolveInstanceId: async () => 'inst-1',
      ...props,
    }));
  });
  return container;
}

const btn = () => container.querySelector('button');
const click = async () => { await act(async () => { btn().click(); }); };

describe('the control only appears when it can actually work', () => {
  it('renders NOTHING when push is not configured (no VAPID key)', async () => {
    await mount({
      vapidPublicKey: '', registration: fakeRegistration(), supabase: fakeSupabase(), win: fakeWin(),
    });
    expect(container.textContent).toBe('');
  });

  it('renders NOTHING in a browser that cannot show notifications', async () => {
    await mount({
      registration: fakeRegistration(), supabase: fakeSupabase(), win: { navigator: {} },
    });
    expect(container.textContent).toBe('');
  });

  it('explains a DENIED browser instead of offering a dead button', async () => {
    await mount({
      registration: fakeRegistration(), supabase: fakeSupabase(), win: fakeWin({ permission: 'denied' }),
    });
    expect(container.textContent).toContain('blocking notifications');
    expect(btn(), 'a button that cannot work must not be shown').toBeNull();
  });
});

describe('it renders LIVE subscription state, never a saved preference', () => {
  it('offers to turn on when there is no subscription', async () => {
    await mount({
      topic: 'live', registration: fakeRegistration(), supabase: fakeSupabase(), win: fakeWin(),
    });
    expect(btn().textContent).toMatch(/tell me when a service goes live/i);
  });

  it('shows ON only when a real subscription exists', async () => {
    await mount({
      registration: fakeRegistration({ existing: fakeSubscription() }),
      supabase: fakeSupabase(), win: fakeWin({ permission: 'granted' }),
    });
    expect(btn().textContent).toMatch(/notifications on/i);
  });

  it('permission GRANTED but no subscription still offers to turn on', async () => {
    // The real and common lapsed state. A saved "on" flag would lie here.
    await mount({
      registration: fakeRegistration(), supabase: fakeSupabase(), win: fakeWin({ permission: 'granted' }),
    });
    expect(btn().textContent).toMatch(/tell me when someone messages me/i);
  });
});

describe('it never prompts on its own', () => {
  it('mounting does NOT ask for permission', async () => {
    const win = fakeWin({ permission: 'default' });
    await mount({ registration: fakeRegistration(), supabase: fakeSupabase(), win });
    // A prompt on load is how an origin gets permanently denied.
    expect(win.asked()).toBe(0);
  });

  it('asks only when the button is pressed', async () => {
    const win = fakeWin({ permission: 'default', requestResult: 'granted' });
    const supabase = fakeSupabase();
    await mount({ registration: fakeRegistration(), supabase, win });
    await click();
    expect(win.asked()).toBe(1);
    expect(supabase.ops.some((o) => o.op === 'upsert')).toBe(true);
  });
});

describe('turning it on and off', () => {
  it('subscribes, saves with the endpoint conflict target, and flips to ON', async () => {
    const supabase = fakeSupabase();
    const onChange = vi.fn();
    await mount({
      registration: fakeRegistration(), supabase, win: fakeWin({ permission: 'granted' }), onChange,
    });
    await click();
    expect(btn().textContent).toMatch(/notifications on/i);
    expect(onChange).toHaveBeenCalled();
    // Duplicates would each buzz the same pocket.
    expect(supabase.ops[0].opts).toEqual({ onConflict: 'endpoint' });
  });

  it('turning OFF returns to the offer, and deletes the row', async () => {
    const supabase = fakeSupabase();
    await mount({
      registration: fakeRegistration({ existing: fakeSubscription() }),
      supabase, win: fakeWin({ permission: 'granted' }),
    });
    await click();
    expect(btn().textContent).toMatch(/tell me when/i);
    expect(supabase.ops.some((o) => o.op === 'delete')).toBe(true);
  });

  it('a dismissed prompt says so kindly and stays off', async () => {
    await mount({
      registration: fakeRegistration(), supabase: fakeSupabase(),
      win: fakeWin({ permission: 'default', requestResult: 'default' }),
    });
    await click();
    expect(container.textContent).toContain(REFUSAL_TEXT.dismissed);
    expect(btn().textContent).toMatch(/tell me when/i);
  });

  it('a save failure reports honestly instead of showing ON', async () => {
    await mount({
      registration: fakeRegistration(), supabase: fakeSupabase({ error: { message: 'rls denied' } }),
      win: fakeWin({ permission: 'granted' }),
    });
    await click();
    expect(container.textContent).toContain(REFUSAL_TEXT['save-failed']);
    expect(btn().textContent).not.toMatch(/notifications on/i);
  });

  it('a signed-out person is told to sign in, and nothing is written', async () => {
    const supabase = fakeSupabase({ userId: null });
    await mount({ registration: fakeRegistration(), supabase, win: fakeWin({ permission: 'granted' }) });
    await click();
    expect(container.textContent).toContain(REFUSAL_TEXT['not-signed-in']);
    expect(supabase.ops, 'a refusal must write nothing').toHaveLength(0);
  });
});

describe('UX-PATTERNS conformance (2g.1, 2g.2, 2g.3)', () => {
  it('the button carries a focus ring and the 36px house floor', async () => {
    await mount({ registration: fakeRegistration(), supabase: fakeSupabase(), win: fakeWin() });
    expect(btn().className).toMatch(/focus:outline/);   // 2g.1
    expect(btn().className).toMatch(/min-h-\[36px\]/);  // 2g.2
  });

  it('the control carries words, never a bare glyph', async () => {
    await mount({ registration: fakeRegistration(), supabase: fakeSupabase(), win: fakeWin() });
    expect(btn().textContent.replace(/\s/g, '').length).toBeGreaterThan(5); // 2g.3
  });
});
