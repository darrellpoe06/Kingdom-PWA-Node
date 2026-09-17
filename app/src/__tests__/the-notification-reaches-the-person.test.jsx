// =============================================================================
// The notification reaches the person — the door, the offer, and the in-app
// arrival the OS doorbell declines to give
// =============================================================================
// Darrell, 2026-09-17, with a photo of his own home screen: "Why doesn't it
// show notifications on the apps?" Google carried a badge; PoeTech and The
// Love Corner carried nothing. Then: "Christina text me and I didn't realize
// it was a new one... I was even inside the Love Corner App... I believe it
// should be able to give a better response."
//
// MEASURED FIRST, against the live database (DR-0076 — no claim without
// evidence):
//     select count(*) from push_subscriptions  ->  0
//     select count(*) from push_sends          ->  0
// Zero subscribers, ever, and therefore zero send attempts, ever. The entire
// Web Push stack of DR-0334/DR-0336 was live and unreachable, because the one
// control that can subscribe a device rendered in exactly ONE place: part-way
// down the Messages tab. Nothing anywhere else in the app said notifications
// were off.
//
// This gate holds the fix down in three parts:
//   1. THE WIRING — the alert layer is actually mounted, app-wide, in the
//      normal boot and no standalone one; the watcher is actually started.
//   2. THE STATE MACHINE — 'off' is the only state that earns an offer;
//      unsupported, unconfigured and blocked are three different truths and
//      none of them gets a button that cannot work.
//   3. THE COMPLEMENT — for every growth in the unread count, exactly one of
//      { OS doorbell, in-app pill } is eligible. No overlap (two alerts for
//      one message) and, the defect Darrell actually hit, NO GAP.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

import {
  readinessFrom, shouldOfferNotifications, snoozeActive, inAppSignal, arrivalText,
  newestUnreadFrom, DM_UNREAD_EVENT, NOTIFY_SNOOZE_DAYS,
} from '../lib/notify-readiness.js';
import { notifyDecision } from '../lib/dm-notify.js';
import { messageLandingHere } from '../lib/app-doors.js';

let authSession = { user: { id: 'u1' } };
vi.mock('../lib/supabase.js', () => ({
  default: {
    from: vi.fn(),
    auth: { getSession: vi.fn(async () => ({ data: { session: null } })), getUser: vi.fn(async () => ({ data: { user: null } })) },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
  supabase: {
    from: vi.fn(),
    auth: { getSession: vi.fn(async () => ({ data: { session: null } })), getUser: vi.fn(async () => ({ data: { user: null } })) },
  },
  onAuthChange: (cb) => { cb(authSession); return () => {}; },
}));

let statusNow = { supported: true, permission: 'default', subscribed: false };
vi.mock('../lib/push-subscribe.js', () => ({
  pushStatus: async () => statusNow,
  enablePush: async () => ({ ok: true }),
  disablePush: async () => ({ ok: true }),
  updateTopics: async () => ({ ok: true }),
  PUSH_TOPICS: ['live', 'message'],
  TOPIC_LABELS: { live: 'live', message: 'message' },
  vapidKeyToBytes: () => new Uint8Array(65),
  pushSupported: () => true,
  permissionState: () => statusNow.permission,
}));
vi.mock('../lib/table-sync.js', () => ({ getInstanceId: async () => 'inst-1' }));

import AppAlerts, { ARRIVAL_VISIBLE_MS, SNOOZE_KEY } from '../components/AppAlerts.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/** Source with its comments removed, for checks about what the code DOES. */
const codeOnly = (src) => String(src)
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
// EVERY wiring check below reads the COMMENT-STRIPPED source, and that is not
// tidiness — it is a hole this gate had and a break found. Commenting out
// `startDmNotifications(window)` left the raw-source regex perfectly green:
// the text still existed, it simply no longer ran. A check that proves a line
// is PRESENT proves nothing about whether it EXECUTES. Stripped source is the
// closest a source-level check gets to the real question.
const SRC_MAIN = codeOnly(readFileSync(join(SRC, 'main.jsx'), 'utf8'));
const SRC_ALERTS_RAW = readFileSync(join(SRC, 'components', 'AppAlerts.jsx'), 'utf8');
const SRC_ALERTS = codeOnly(SRC_ALERTS_RAW);
const SRC_DMN = codeOnly(readFileSync(join(SRC, 'lib', 'dm-notify.js'), 'utf8'));

// ── 1. THE WIRING ───────────────────────────────────────────────────────────
// A layer nobody mounts is the exact failure this whole slice is about: the
// push stack was built twice and reachable never. These read the real entry
// module, because "it is implemented" and "it runs" are different facts.
describe('the alert layer is actually wired into the app', () => {
  it('main.jsx mounts AppAlerts into its own root', () => {
    expect(SRC_MAIN).toMatch(/import\(['"]\.\/components\/AppAlerts\.jsx['"]\)/);
    expect(SRC_MAIN).toMatch(/pt-alerts/);
    // Its OWN root — not a hoped-for slot inside the frozen shell.
    const mount = SRC_MAIN.slice(SRC_MAIN.indexOf('AppAlerts.jsx'));
    expect(mount.slice(0, 600)).toMatch(/createRoot\(host\)/);
    expect(mount.slice(0, 600)).toMatch(/<AppAlerts\s*\/>/);
  });

  it('main.jsx starts the app-wide unread watcher', () => {
    expect(SRC_MAIN).toMatch(/startDmNotifications\(window\)/);
  });

  it('the alert layer mounts only in the NORMAL boot, after every standalone branch', () => {
    const alerts = SRC_MAIN.indexOf("import('./components/AppAlerts.jsx')");
    const monolith = SRC_MAIN.indexOf("import('./poe-financial-mvp-v28.jsx')");
    const lastStandalone = SRC_MAIN.lastIndexOf("__params.get('room')");
    expect(alerts).toBeGreaterThan(0);
    expect(monolith).toBeGreaterThan(0);
    // After the standalone branches are decided, and beside the real app: a
    // registrant filling in a conference form is not a person to offer a
    // message subscription to.
    expect(alerts).toBeGreaterThan(lastStandalone);
    expect(alerts).toBeLessThan(monolith);
  });

  it('the watcher tells the APP, not only the OS, on every unread change', () => {
    // The event is what makes one DM subscription serve every listener. Scoped
    // to the dispatch site, so the import line alone cannot hold this green.
    const at = SRC_DMN.indexOf('dispatchEvent');
    expect(at).toBeGreaterThan(0);
    const site = SRC_DMN.slice(at, at + 400);
    expect(site).toMatch(/DM_UNREAD_EVENT/);
    expect(site).toMatch(/visible/);
    expect(site).toMatch(/newest/);
  });

  it('the alert layer hosts the ONE real push control and never prompts by itself', () => {
    expect(SRC_ALERTS).toMatch(/import PushNotifications from '\.\/PushNotifications\.jsx'/);
    expect(SRC_ALERTS).toMatch(/<PushNotifications/);
    // A second implementation of "ask for permission" is how an origin gets
    // permanently denied on page load. There must not be one here. Checked
    // against the CODE, not the comments — a file that explains why it does
    // not ask must not fail for saying so (SRC_ALERTS is already stripped;
    // SRC_ALERTS_RAW proves the explanation is genuinely there to strip).
    expect(SRC_ALERTS).not.toMatch(/requestPermission/);
    expect(SRC_ALERTS_RAW).toMatch(/requestPermission/);
  });
});

// ── 2. THE STATE MACHINE ────────────────────────────────────────────────────
describe('three different truths, told apart', () => {
  it('an unsupported browser is named as such, and offered nothing', () => {
    const r = readinessFrom({ supported: false });
    expect(r.state).toBe('unsupported');
    expect(r.canAct).toBe(false);
  });

  it('an unconfigured deployment says the SERVER has no key, not that the phone is broken', () => {
    const r = readinessFrom({ configured: false });
    expect(r.state).toBe('unconfigured');
    expect(r.headline.toLowerCase()).toContain('not set up');
    expect(r.detail.toLowerCase()).toContain('nothing is wrong with your phone');
  });

  it('a blocked browser is pointed at its settings, never at a button', () => {
    const r = readinessFrom({ permission: 'denied' });
    expect(r.state).toBe('blocked');
    expect(r.canAct).toBe(false);
    expect(r.detail.toLowerCase()).toContain('settings');
  });

  it('a subscribed device reads ON', () => {
    expect(readinessFrom({ permission: 'granted', subscribed: true }).state).toBe('on');
  });

  it('available-and-not-on is the OFF state, and the only one that can act', () => {
    const off = readinessFrom({ permission: 'default', subscribed: false });
    expect(off.state).toBe('off');
    expect(off.canAct).toBe(true);
    for (const facts of [
      { supported: false }, { configured: false },
      { permission: 'denied' }, { permission: 'granted', subscribed: true },
    ]) expect(readinessFrom(facts).canAct).toBe(false);
  });

  it('a granted-but-unsubscribed device is still OFF — permission is not a subscription', () => {
    // The distinction the zero-row measurement turns on: Darrell could have
    // granted permission in 2026-08 and still have no subscription row.
    expect(readinessFrom({ permission: 'granted', subscribed: false }).state).toBe('off');
  });

  it('unsupported outranks unconfigured outranks blocked', () => {
    expect(readinessFrom({ supported: false, configured: false, permission: 'denied' }).state).toBe('unsupported');
    expect(readinessFrom({ configured: false, permission: 'denied' }).state).toBe('unconfigured');
  });
});

describe('who gets offered, and who is left alone', () => {
  const OFF = readinessFrom({});
  const NOW = Date.UTC(2026, 8, 17);

  it('offers a signed-in person whose device is off', () => {
    expect(shouldOfferNotifications(OFF, { signedIn: true, now: NOW })).toBe(true);
  });

  it('never offers a signed-out visitor — a subscription is bound to a person', () => {
    expect(shouldOfferNotifications(OFF, { signedIn: false, now: NOW })).toBe(false);
  });

  it('never offers any state but off', () => {
    for (const facts of [
      { supported: false }, { configured: false },
      { permission: 'denied' }, { permission: 'granted', subscribed: true },
    ]) {
      expect(shouldOfferNotifications(readinessFrom(facts), { signedIn: true, now: NOW })).toBe(false);
    }
  });

  it('honours a dismissal, and lets it expire so "not now" never becomes "never"', () => {
    const justNow = new Date(NOW - 1000).toISOString();
    expect(shouldOfferNotifications(OFF, { signedIn: true, dismissedAt: justNow, now: NOW })).toBe(false);
    const old = new Date(NOW - (NOTIFY_SNOOZE_DAYS + 1) * 86400000).toISOString();
    expect(shouldOfferNotifications(OFF, { signedIn: true, dismissedAt: old, now: NOW })).toBe(true);
  });

  it('an absent or unreadable stamp is NOT a dismissal', () => {
    // A storage read that returns null or junk must never silence the offer —
    // that is how someone ends up unreachable without ever choosing it.
    expect(snoozeActive(null, NOW)).toBe(false);
    expect(snoozeActive('', NOW)).toBe(false);
    expect(snoozeActive('not-a-date', NOW)).toBe(false);
  });
});

// ── 3. THE COMPLEMENT ───────────────────────────────────────────────────────
describe('every arriving message reaches the person exactly once', () => {
  it('visible: the app signals and the OS stays quiet', () => {
    expect(inAppSignal(0, 1, { visible: true }).show).toBe(true);
    expect(notifyDecision(0, 1, { hidden: false, permission: 'granted' }).notify).toBe(false);
  });

  it('hidden: the OS rings and the app does not double up', () => {
    expect(notifyDecision(0, 1, { hidden: true, permission: 'granted' }).notify).toBe(true);
    expect(inAppSignal(0, 1, { visible: false }).show).toBe(false);
  });

  it('NO GAP: a growth while visible is never silent — the defect Darrell hit', () => {
    // "I was even inside the Love Corner App and I didn't realize it was a new
    // one." Before the in-app signal existed, this case produced nothing: the
    // "(N)" title badge has no title bar inside an installed PWA, and the
    // launcher badge is behind the app you are looking at.
    for (const permission of ['default', 'denied', 'granted']) {
      const os = notifyDecision(3, 5, { hidden: false, permission }).notify;
      const app = inAppSignal(3, 5, { visible: true }).show;
      expect(os || app).toBe(true);
    }
  });

  it('NO OVERLAP: the two are never both eligible for the same growth', () => {
    for (const visible of [true, false]) {
      const os = notifyDecision(0, 2, { hidden: !visible, permission: 'granted' }).notify;
      const app = inAppSignal(0, 2, { visible }).show;
      expect(os && app).toBe(false);
    }
  });

  it('reading a message never announces it', () => {
    expect(inAppSignal(4, 1, { visible: true }).show).toBe(false);
    expect(inAppSignal(1, 0, { visible: true }).show).toBe(false);
    expect(inAppSignal(0, 0, { visible: true }).show).toBe(false);
  });

  it('the pill says who and how many, from the real rows', () => {
    expect(arrivalText({ count: 1, senderName: 'Christina' })).toBe('New message from Christina');
    expect(arrivalText({ count: 3, senderName: 'Christina' })).toContain('3 new messages');
    expect(arrivalText({ count: 1 })).toBe('New message');
  });

  it('the newest UNREAD INCOMING row is the one named', () => {
    const rows = [
      { id: 'a', mine: false, readAt: null, createdAt: '2026-09-01T00:00:00Z', senderName: 'Old', otherUserId: 'p1' },
      { id: 'b', mine: true, readAt: null, createdAt: '2026-09-09T00:00:00Z', senderName: 'Me', otherUserId: 'p2' },
      { id: 'c', mine: false, readAt: '2026-09-05T00:00:00Z', createdAt: '2026-09-08T00:00:00Z', senderName: 'Read', otherUserId: 'p3' },
      { id: 'd', mine: false, readAt: null, createdAt: '2026-09-07T00:00:00Z', senderName: 'Christina', otherUserId: 'p4' },
    ];
    expect(newestUnreadFrom(rows)).toMatchObject({ senderName: 'Christina', peerUserId: 'p4' });
    expect(newestUnreadFrom([])).toBeNull();
    expect(newestUnreadFrom([{ mine: false, readAt: 'x' }])).toBeNull();
  });
});

describe('the tap stays in the door the person is already standing in', () => {
  const PEER = '11111111-2222-3333-4444-555555555555';

  it('lands on the church door when the church door is open', () => {
    expect(messageLandingHere({ pathname: '/lovecorner/app/', search: '', peerUserId: PEER }))
      .toBe(`/lovecorner/app/?view=messages&dm=${PEER}`);
  });

  it('lands on the personal door from the personal door', () => {
    expect(messageLandingHere({ pathname: '/poetech-app/', search: '', peerUserId: PEER }))
      .toBe(`/poetech-app/?view=messages&dm=${PEER}`);
  });

  it('drops a peer that is not a real id rather than writing a dead link', () => {
    expect(messageLandingHere({ pathname: '/lovecorner/app/', search: '', peerUserId: 'nope' }))
      .toBe('/lovecorner/app/?view=messages');
  });
});

// ── the rendered layer ──────────────────────────────────────────────────────
const makeWin = ({ pathname = '/poetech-app/', search = '', stored = null } = {}) => {
  const bus = new EventTarget();
  const store = new Map();
  if (stored) store.set(SNOOZE_KEY, stored);
  return {
    addEventListener: (t, h) => bus.addEventListener(t, h),
    removeEventListener: (t, h) => bus.removeEventListener(t, h),
    fire: (detail) => bus.dispatchEvent(new CustomEvent(DM_UNREAD_EVENT, { detail })),
    location: { pathname, search, assign: vi.fn(), href: '' },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, v),
    },
    navigator: {},
    document: { visibilityState: 'visible' },
    stored: () => store.get(SNOOZE_KEY) || null,
  };
};

let container, root;
beforeEach(() => {
  authSession = { user: { id: 'u1' } };
  statusNow = { supported: true, permission: 'default', subscribed: false };
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

const mount = async (props) => {
  await act(async () => root.render(createElement(AppAlerts, { vapidPublicKey: 'B'.repeat(87), ...props })));
};
const q = (id) => container.querySelector(`[data-testid="${id}"]`);

describe('the alert layer, rendered', () => {
  it('shows nothing at all when there is nothing to say', async () => {
    statusNow = { supported: true, permission: 'granted', subscribed: true };
    const win = makeWin();
    await mount({ win });
    expect(q('dm-arrival-layer')).toBeNull();
    expect(q('notify-offer-layer')).toBeNull();
  });

  it('a message arriving while the app is open is VISIBLE, and named', async () => {
    statusNow = { supported: true, permission: 'granted', subscribed: true };
    const win = makeWin();
    await mount({ win });
    await act(async () => {
      win.fire({ prev: 0, next: 1, visible: true, newest: { peerUserId: '11111111-2222-3333-4444-555555555555', senderName: 'Christina' } });
    });
    expect(q('dm-arrival-layer')).not.toBeNull();
    expect(q('dm-arrival-open').textContent).toContain('Christina');
  });

  it('a message arriving while the app is HIDDEN raises no pill — the OS has it', async () => {
    statusNow = { supported: true, permission: 'granted', subscribed: true };
    const win = makeWin();
    await mount({ win });
    await act(async () => { win.fire({ prev: 0, next: 1, visible: false, newest: { senderName: 'Christina' } }); });
    expect(q('dm-arrival-layer')).toBeNull();
  });

  it('tapping the pill opens that thread, in this door', async () => {
    statusNow = { supported: true, permission: 'granted', subscribed: true };
    const win = makeWin({ pathname: '/lovecorner/app/' });
    await mount({ win });
    await act(async () => {
      win.fire({ prev: 0, next: 1, visible: true, newest: { peerUserId: '11111111-2222-3333-4444-555555555555', senderName: 'Christina' } });
    });
    await act(async () => { q('dm-arrival-open').click(); });
    expect(win.location.assign).toHaveBeenCalledWith('/lovecorner/app/?view=messages&dm=11111111-2222-3333-4444-555555555555');
  });

  it('the pill steps out of the way on its own', async () => {
    vi.useFakeTimers();
    try {
      statusNow = { supported: true, permission: 'granted', subscribed: true };
      const win = makeWin();
      await mount({ win });
      await act(async () => { win.fire({ prev: 0, next: 1, visible: true, newest: { senderName: 'Christina' } }); });
      expect(q('dm-arrival-layer')).not.toBeNull();
      await act(async () => { vi.advanceTimersByTime(ARRIVAL_VISIBLE_MS + 50); });
      expect(q('dm-arrival-layer')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('offers the subscription OUTSIDE the Messages tab — the door that was missing', async () => {
    const win = makeWin();
    await mount({ win });
    expect(q('notify-offer-layer')).not.toBeNull();
    expect(q('notify-offer-headline').textContent.toLowerCase()).toContain('turn on notifications');
  });

  it('offers nothing when this deployment has no key', async () => {
    const win = makeWin();
    await mount({ win, vapidPublicKey: '' });
    expect(q('notify-offer-layer')).toBeNull();
  });

  it('offers nothing to a browser that already refused', async () => {
    statusNow = { supported: true, permission: 'denied', subscribed: false };
    await mount({ win: makeWin() });
    expect(q('notify-offer-layer')).toBeNull();
  });

  it('offers nothing to a signed-out visitor', async () => {
    authSession = null;
    await mount({ win: makeWin() });
    expect(q('notify-offer-layer')).toBeNull();
  });

  it('"Not now" is remembered, and the offer goes', async () => {
    const win = makeWin();
    await mount({ win });
    await act(async () => { q('notify-offer-dismiss').click(); });
    expect(q('notify-offer-layer')).toBeNull();
    expect(win.stored()).toBeTruthy();
  });

  it('a remembered "not now" is quiet on the next boot', async () => {
    const win = makeWin({ stored: new Date().toISOString() });
    await mount({ win });
    expect(q('notify-offer-layer')).toBeNull();
  });
});
