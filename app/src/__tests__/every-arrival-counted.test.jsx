// @vitest-environment jsdom
// =============================================================================
// Every arrival is counted: on the icon, in the app, and with a ring (DR-0728)
// =============================================================================
// Darrell 2026-10-01, in the installed app on his phone, beside another app's
// badge reading "19": "Why don't the PoeTech App have those types of
// notifications and the number of them if I haven't checked them yet?"
//
// MEASURED on origin/main fe14096a before a line was written: lib/dm-notify.js
// set the launcher badge and the "(N)" title to the unread-MESSAGE count and
// nothing else (applyAppBadge(win.navigator, next), next = unreadDmCount). A
// lesson that finished building (awaiting-review), one that went live
// (lesson-published), a member's lesson waiting for the Governor and a
// steward's answer on a note each had a screen and no number, no ring, and
// nothing reached a closed app for any of them.
//
// This gate holds the fix down in five parts:
//   1. THE WIRING — the watcher starts at boot; the bell is mounted in the
//      header; each screen marks its kind seen; the badge has ONE writer.
//   2. THE WATCHER, DRIVEN — one combined count on the icon and the title; a
//      screen opening drops its kind; a new arrival while hidden rings through
//      the registration, and never while the person is watching.
//   3. THE BELL — the number, the list newest first, the tap landing.
//   4. THE CLOSED APP — the sender takes a one-person `lesson` topic, the
//      drain sends it with the machine token, and migration 0246 enqueues on
//      the tag flip (the PostgreSQL job proves the enqueue itself).
//   5. THE RECORD — the registry entries, the CI leg, the decision on file.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

import { DM_UNREAD_EVENT } from '../lib/notify-readiness.js';
import { ARRIVALS_EVENT, ARRIVALS_SEEN_EVENT, SCREEN_KINDS, seenKey } from '../lib/arrivals.js';
import { startArrivalsWatch, ringDecision, showArrivalNotification, currentArrivals } from '../lib/arrivals-watch.js';
import { validateSendRequest, audienceQuery, lessonAnnouncement, SENDABLE_TOPICS } from '../lib/push-send-policy.js';
import ArrivalsBell, { bellLabel, breakdownText, dockLabel, LAUNCH_OPENED_KEY } from '../components/ArrivalsBell.jsx';
import REGISTRY from '../lib/feature-registry.json';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(SRC, '..', '..');
const read = (...p) => readFileSync(join(...p), 'utf8');
/** Source with its comments removed, for checks about what the code DOES. */
const codeOnly = (src) => String(src).replace(/\/\*[\s\S]*?\*\//g, ' ').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
const MIG = '0246-every-arrival-is-counted-a-lesson-ready-or-published-enqueues-a-push.sql';

// ── 1. THE WIRING ───────────────────────────────────────────────────────────
describe('the wiring: started at boot, mounted in the header, one badge writer', () => {
  it('main.jsx starts the arrivals watcher right after the DM watcher it listens to', () => {
    const main = codeOnly(read(SRC, 'main.jsx'));
    const dm = main.indexOf('startDmNotifications(window)');
    const ar = main.indexOf('startArrivalsWatch(window)');
    expect(dm).toBeGreaterThan(0);
    expect(ar).toBeGreaterThan(dm);
  });

  it('the shell mounts the bell in the header cluster, beside Help', () => {
    const shell = codeOnly(read(SRC, 'poe-financial-mvp-v28.jsx'));
    expect(shell).toMatch(/import ArrivalsBell from '\.\/components\/ArrivalsBell\.jsx'/);
    const help = shell.indexOf('<HelpButton');
    const bell = shell.indexOf('<ArrivalsBell />');
    expect(bell).toBeGreaterThan(help);
    expect(bell - help).toBeLessThan(600);
  });

  it('dm-notify no longer writes the badge; arrivals-watch writes the COMBINED count and clears on sign-out', () => {
    const dm = codeOnly(read(SRC, 'lib', 'dm-notify.js'));
    const watch = codeOnly(read(SRC, 'lib', 'arrivals-watch.js'));
    expect(dm).not.toMatch(/applyAppBadge\(win\.navigator/);
    expect(dm).toMatch(/DM_UNREAD_EVENT/);
    expect(watch).toContain('applyAppBadge(win.navigator, count)');
    expect(watch).toContain('applyAppBadge(win.navigator, 0)');
  });

  it('each screen marks its own kind seen when it has read its rows', () => {
    expect(codeOnly(read(SRC, 'components', 'LessonInbox.jsx'))).toMatch(/markArrivalsSeen\(SCREEN_KINDS\['your-lessons'\]\)/);
    expect(codeOnly(read(SRC, 'components', 'MemberLessonQueue.jsx'))).toMatch(/markArrivalsSeen\(SCREEN_KINDS\.decide\)/);
    expect(codeOnly(read(SRC, 'components', 'FeedbackCenter.jsx'))).toMatch(/markArrivalsSeen\(SCREEN_KINDS\.feedback\)/);
  });

  it('the bell never marks anything seen itself', () => {
    expect(codeOnly(read(SRC, 'components', 'ArrivalsBell.jsx'))).not.toMatch(/markArrivalsSeen/);
  });

  it('the bell is registered as a feature, control and mount (DR-0726)', () => {
    const bell = REGISTRY.features.find((f) => f.id === 'hdr-arrivals');
    const mount = REGISTRY.features.find((f) => f.id === 'hdr-mount-arrivals');
    expect(bell).toMatchObject({ surface: 'app-header', find: { testid: 'arrivals-bell' } });
    expect(mount).toMatchObject({ surface: 'app-header', find: { source: '<ArrivalsBell />' } });
  });

  it('the watcher imports the lesson modules lazily, so the boot chunk stays light', () => {
    const watch = read(SRC, 'lib', 'arrivals-watch.js');
    expect(watch).toMatch(/import\('\.\/lesson-inbox\.js'\)/);
    expect(watch).not.toMatch(/^import .* from '\.\/lesson-inbox\.js'/m);
  });
});

// ── 2. THE WATCHER, DRIVEN ──────────────────────────────────────────────────
const makeWin = () => {
  const bus = new EventTarget();
  const store = new Map();
  const navCalls = [];
  const reg = { showNotification: vi.fn(async () => {}) };
  return {
    addEventListener: (t, h) => bus.addEventListener(t, h),
    removeEventListener: (t, h) => bus.removeEventListener(t, h),
    dispatchEvent: (e) => bus.dispatchEvent(e),
    CustomEvent: globalThis.CustomEvent,
    document: { title: 'PoeTech', visibilityState: 'visible', addEventListener() {}, removeEventListener() {} },
    navigator: { setAppBadge(n) { navCalls.push(n); return Promise.resolve(); }, clearAppBadge() { navCalls.push(0); return Promise.resolve(); } },
    navCalls,
    localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) },
    store,
    location: { pathname: '/lovecorner/app/', search: '', assign: vi.fn() },
    Notification: { permission: 'granted' },
    __pwaReg: reg,
    reg,
    focus() {},
  };
};
const client = { channel: () => ({ on() { return this; }, subscribe() { return this; } }), removeChannel() {} };
const flush = async () => { for (let i = 0; i < 6; i++) await new Promise((r) => setTimeout(r, 5)); };
const fire = (win, type, detail) => win.dispatchEvent(new CustomEvent(type, { detail }));

describe('the watcher: one combined count, dropped by the screen, rung while hidden', () => {
  let stop = null;
  afterEach(() => { if (stop) stop(); stop = null; });

  const setUp = async ({ owner = true } = {}) => {
    const win = makeWin();
    const data = {
      lessons: { ok: true, owner, items: [{ id: 'r1', createdAt: '2026-10-01T10:00:00Z', progressTags: ['lesson', 'awaiting-review', 'build:awaiting-review@2026-10-01T11:00:00Z'], spoken: false, review: { state: 'pending', line: '' }, published: null }] },
      queue: { ok: true, rows: [{ id: 'q1', created_at: '2026-10-01T09:00:00Z', sender_name: 'Christina' }] },
      feedback: { ok: true, items: [{ id: 'f1', triageStatus: 'fixed', triageNotes: 'Done.', submittedAt: '2026-09-30T09:00:00Z' }, { id: 'f2', triageStatus: 'new' }] },
    };
    const events = [];
    win.addEventListener(ARRIVALS_EVENT, (e) => events.push(e.detail));
    let authCb = null;
    stop = startArrivalsWatch(win, {
      supabase: client,
      onAuthChange: (cb) => { authCb = cb; cb({ user: { id: 'u1', email: 'speaker@example.test' } }); return () => {}; },
      loaders: {
        lessons: async () => async () => data.lessons,
        queue: async () => async () => data.queue,
        feedback: async () => async () => data.feedback,
      },
    });
    await flush();
    return { win, data, events, signOut: () => authCb(null) };
  };

  it('the icon and the title carry unread messages PLUS every other unseen arrival', async () => {
    const { win, events } = await setUp();
    // lesson-ready + review-queue + feedback(fixed) = 3, before any message.
    expect(win.navCalls.at(-1)).toBe(3);
    expect(win.document.title).toBe('(3) PoeTech');
    fire(win, DM_UNREAD_EVENT, { prev: 0, next: 2, visible: true, newest: { messageId: 'm1', senderName: 'Christina', at: '2026-10-01T12:00:00Z', peerUserId: '11111111-2222-3333-4444-555555555555' } });
    expect(win.navCalls.at(-1)).toBe(5);
    expect(win.document.title).toBe('(5) PoeTech');
    const last = events.at(-1);
    expect(last.count).toBe(5);
    expect(last.items.map((i) => i.kind)).toEqual(['message', 'lesson-ready', 'review-queue', 'feedback']);
    expect(currentArrivals(win).count).toBe(5);
  });

  it('opening Your lessons drops its kinds, remembers it for this account on this device, and leaves the rest', async () => {
    const { win } = await setUp();
    fire(win, DM_UNREAD_EVENT, { prev: 0, next: 2, visible: true, newest: { messageId: 'm1', at: '2026-10-01T12:00:00Z' } });
    expect(win.navCalls.at(-1)).toBe(5);
    fire(win, ARRIVALS_SEEN_EVENT, { kinds: SCREEN_KINDS['your-lessons'] });
    expect(win.navCalls.at(-1)).toBe(4);
    expect(JSON.parse(win.store.get(seenKey('u1'))).ids).toEqual(['lesson-ready:r1']);
    fire(win, ARRIVALS_SEEN_EVENT, { kinds: SCREEN_KINDS.decide });
    fire(win, ARRIVALS_SEEN_EVENT, { kinds: SCREEN_KINDS.feedback });
    expect(win.navCalls.at(-1)).toBe(2); // the two unread messages: the database holds their read state
    fire(win, DM_UNREAD_EVENT, { prev: 2, next: 0, visible: true, newest: null });
    expect(win.navCalls.at(-1)).toBe(0);
    expect(win.document.title).toBe('PoeTech');
  });

  it('a member is never shown the Governor’s queue', async () => {
    const { win } = await setUp({ owner: false });
    // lesson-ready (written, waiting for the Governor) + feedback = 2; no queue read.
    expect(win.navCalls.at(-1)).toBe(2);
  });

  it('a NEW arrival while the app is hidden rings through the registration and lands on Your lessons in this door; a cold boot does not', async () => {
    vi.useFakeTimers();
    try {
      const { win, data } = await (async () => {
        const w = makeWin();
        const d = { lessons: { ok: true, owner: true, items: [] }, queue: { ok: true, rows: [] }, feedback: { ok: true, items: [{ id: 'f1', triageStatus: 'fixed', submittedAt: '2026-09-30T09:00:00Z' }] } };
        stop = startArrivalsWatch(w, {
          supabase: client,
          onAuthChange: (cb) => { cb({ user: { id: 'u1' } }); return () => {}; },
          loaders: { lessons: async () => async () => d.lessons, queue: async () => async () => d.queue, feedback: async () => async () => d.feedback },
        });
        await vi.advanceTimersByTimeAsync(50);
        return { win: w, data: d };
      })();
      // The first read found one answered note: counted, never rung (nothing is "new" at boot).
      expect(win.navCalls.at(-1)).toBe(1);
      expect(win.reg.showNotification).not.toHaveBeenCalled();
      // The person puts the app away; the builder publishes; the heartbeat reads it.
      win.document.visibilityState = 'hidden';
      data.lessons.items = [{ id: 'r1', createdAt: '2026-10-01T10:00:00Z', progressTags: ['lesson', 'lesson-published', 'lesson-id:ll205', 'build:published@2026-10-01T13:00:00Z'], spoken: false, review: { state: 'pending', line: '' }, published: { number: 'L205', title: 'Grace', lessonId: 'll205', href: '?x' } }];
      await vi.advanceTimersByTimeAsync(60000 + 50);
      expect(win.navCalls.at(-1)).toBe(2);
      expect(win.reg.showNotification).toHaveBeenCalledTimes(1);
      const [title, opts] = win.reg.showNotification.mock.calls[0];
      expect(title).toBe('Your lesson is published');
      expect(opts.data.url).toBe('/lovecorner/app/?view=create&panel=your-lessons');
      expect(opts.tag).toBe('poetech-arrival:lesson-published:r1');
      // Watching the app: a new arrival is counted, and the OS stays quiet.
      win.document.visibilityState = 'visible';
      data.queue.rows = [{ id: 'q1', created_at: '2026-10-01T14:00:00Z' }];
      await vi.advanceTimersByTimeAsync(60000 + 50);
      expect(win.navCalls.at(-1)).toBe(3);
      expect(win.reg.showNotification).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('signing out clears the icon, the title and the list', async () => {
    const { win, signOut, events } = await setUp();
    expect(win.navCalls.at(-1)).toBe(3);
    signOut();
    expect(win.navCalls.at(-1)).toBe(0);
    expect(win.document.title).toBe('PoeTech');
    expect(events.at(-1).count).toBe(0);
  });

  it('the ring decision: only hidden, only granted, only after the first read, only for something new', () => {
    const added = [{ id: 'x' }];
    expect(ringDecision(added, { hidden: true, permission: 'granted', primed: true })).toBe(true);
    expect(ringDecision(added, { hidden: false, permission: 'granted', primed: true })).toBe(false);
    expect(ringDecision(added, { hidden: true, permission: 'default', primed: true })).toBe(false);
    expect(ringDecision(added, { hidden: true, permission: 'granted', primed: false })).toBe(false);
    expect(ringDecision([], { hidden: true, permission: 'granted', primed: true })).toBe(false);
  });

  it('the notification goes through the registration when there is one, else the bare Notification, never a throw', async () => {
    const win = makeWin();
    const item = { id: 'lesson-ready:r1', kind: 'lesson-ready', screen: 'your-lessons', title: 'Your lesson is ready to review', detail: 'Choose.' };
    expect(await showArrivalNotification(win, item)).toBe('registration');
    const bare = { ...makeWin(), __pwaReg: null, Notification: class { constructor(t, o) { bare.made = [t, o]; } } };
    expect(await showArrivalNotification(bare, item)).toBe('window');
    expect(bare.made[0]).toBe('Your lesson is ready to review');
    const none = { ...makeWin(), __pwaReg: null, Notification: undefined };
    expect(await showArrivalNotification(none, item)).toBe('none');
    const throwing = { ...makeWin(), __pwaReg: { showNotification() { throw new Error('nope'); } }, Notification: undefined };
    expect(await showArrivalNotification(throwing, item)).toBe('none');
  });
});

// ── 3. THE BELL ─────────────────────────────────────────────────────────────
describe('the bell: the number, the list newest first, the tap', () => {
  let container; let root;
  const mount = async (win) => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(createElement(ArrivalsBell, { win })));
  };
  afterEach(async () => { if (root) await act(async () => root.unmount()); if (container) container.remove(); root = null; container = null; });
  const q = (sel) => document.querySelector(sel);

  const items = [
    { kind: 'lesson-ready', id: 'lesson-ready:r1', at: '2026-10-01T13:00:00Z', title: 'Your lesson is ready to review', detail: 'Every version is written.', screen: 'your-lessons' },
    { kind: 'message', id: 'message:m1', at: '2026-10-01T12:00:00Z', title: 'New message from Christina', count: 1, peerUserId: '11111111-2222-3333-4444-555555555555', screen: 'messages' },
    { kind: 'feedback', id: 'feedback:f1', at: '2026-09-30T09:00:00Z', title: 'Your feedback was answered', detail: 'Done.', screen: 'feedback' },
  ];

  it('shows no number when nothing is new, and the number the icon shows when something is', async () => {
    const win = makeWin();
    await mount(win);
    expect(q('[data-testid="arrivals-bell"]').getAttribute('aria-label')).toBe(bellLabel(0));
    expect(q('[data-testid="arrivals-count"]')).toBeNull();
    await act(async () => { fire(win, ARRIVALS_EVENT, { count: 3, items, all: items }); });
    expect(q('[data-testid="arrivals-count"]').textContent).toBe('3');
    expect(q('[data-testid="arrivals-bell"]').getAttribute('aria-label')).toBe('3 new arrivals. Open the list');
  });

  it('a bell that mounts after the first event reads the latest picture', async () => {
    const win = makeWin();
    win.__ptArrivals = { count: 2, items: items.slice(0, 2), all: items };
    await mount(win);
    expect(q('[data-testid="arrivals-count"]').textContent).toBe('2');
  });

  it('tapping lists every arrival newest first; a row opens its screen in this door', async () => {
    const win = makeWin();
    win.__ptArrivals = { count: 3, items, all: items };
    await mount(win);
    await act(async () => { q('[data-testid="arrivals-bell"]').click(); });
    const rows = [...document.querySelectorAll('[data-testid="arrivals-row"]')];
    expect(rows.map((r) => r.getAttribute('data-kind'))).toEqual(['lesson-ready', 'message', 'feedback']);
    expect(q('[data-testid="arrivals-heading"]').textContent).toBe('3 new');
    await act(async () => { rows[0].click(); });
    expect(win.location.assign).toHaveBeenCalledWith('/lovecorner/app/?view=create&panel=your-lessons');
  });

  it('a message row opens that thread; a feedback row presses the footer Feedback button', async () => {
    const win = makeWin();
    const feedbackBtn = { click: vi.fn() };
    win.document.querySelector = (sel) => (sel === '[aria-label="Open feedback"]' ? feedbackBtn : null);
    win.__ptArrivals = { count: 3, items, all: items };
    await mount(win);
    await act(async () => { q('[data-testid="arrivals-bell"]').click(); });
    const rows = [...document.querySelectorAll('[data-testid="arrivals-row"]')];
    await act(async () => { rows[1].click(); });
    expect(win.location.assign).toHaveBeenCalledWith('/lovecorner/app/?view=messages&dm=11111111-2222-3333-4444-555555555555');
    await act(async () => { q('[data-testid="arrivals-bell"]').click(); });
    await act(async () => { [...document.querySelectorAll('[data-testid="arrivals-row"]')][2].click(); });
    expect(feedbackBtn.click).toHaveBeenCalledTimes(1);
  });

  it('says "caught up" when the list is empty', async () => {
    const win = makeWin();
    await mount(win);
    await act(async () => { q('[data-testid="arrivals-bell"]').click(); });
    expect(q('[data-testid="arrivals-empty"]').textContent).toBe('You are caught up.');
  });

  it('every control carries a focus ring and a 36px target; no per-surface width cap', () => {
    const src = codeOnly(read(SRC, 'components', 'ArrivalsBell.jsx'));
    expect(src).toMatch(/focus:outline focus:outline-2/);
    expect(src).toMatch(/min-h-\[36px\]/);
    expect(src).not.toMatch(/max-w-/);
  });
});

// ── 3b. THE BOTTOM BAR: seen whatever the header is doing (DR-0741) ───────────
// Darrell 2026-10-01, his icon reading 3 and the app open on Messages:
// "Notifications 3... don't see anything... also didn't open to wherever they
// are... why?" / "I like the indicators though... just want them to be clear
// and show what's what".
describe('the bottom bar: N new, what it is made of, and the list opens itself once per launch', () => {
  let container; let root;
  const mount = async (win, props = {}) => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(createElement(ArrivalsBell, { win, variant: 'dock', ...props })));
  };
  afterEach(async () => { if (root) await act(async () => root.unmount()); if (container) container.remove(); root = null; container = null; });
  const q = (sel) => document.querySelector(sel);
  const items = [
    { kind: 'lesson-published', id: 'lesson-published:r1', at: '2026-10-01T13:00:00Z', title: 'Your lesson is published', detail: 'L202', screen: 'your-lessons' },
    { kind: 'message', id: 'message:m1', at: '2026-10-01T12:00:00Z', title: 'New messages from Christina', count: 2, peerUserId: '11111111-2222-3333-4444-555555555555', screen: 'messages' },
  ];
  const storage = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };

  it('the header block leaves with the collapsed header, so the bar carries the count too', () => {
    const shell = codeOnly(read(SRC, 'poe-financial-mvp-v28.jsx'));
    expect(shell).toMatch(/\{!headerCollapsed && \(/);
    const dock = codeOnly(read(SRC, 'components', 'ChromeDock.jsx'));
    expect(dock).toMatch(/<ArrivalsBell variant="dock" \/>/);
    expect(REGISTRY.features.some((f) => f.id === 'ftr-dock-arrivals' && f.surface === 'app-footer' && f.find.testid === 'dock-arrivals')).toBe(true);
  });

  it('says what the number is made of, in words, most first', () => {
    expect(breakdownText(items)).toBe('2 messages · 1 lesson');
    expect(breakdownText([items[0]])).toBe('1 lesson');
    expect(breakdownText([])).toBe('');
    expect(dockLabel(3, items)).toBe('3 new: 2 messages · 1 lesson. Open the list');
  });

  it('draws nothing at zero; "3 new" with the breakdown in its name once something is new; the tap opens the list with the breakdown', async () => {
    const win = makeWin(); win.sessionStorage = storage(); win.sessionStorage.setItem(LAUNCH_OPENED_KEY, '1');
    await mount(win);
    expect(q('[data-testid="dock-arrivals"]')).toBeNull();
    await act(async () => { fire(win, ARRIVALS_EVENT, { count: 3, items, all: items }); });
    const btn = q('[data-testid="dock-arrivals"]');
    expect(btn.textContent).toContain('3 new');
    expect(btn.getAttribute('aria-label')).toBe('3 new: 2 messages · 1 lesson. Open the list');
    expect(q('[data-testid="dock-arrivals-count"]').textContent).toBe('3');
    await act(async () => { btn.click(); });
    expect(q('[data-testid="arrivals-heading"]').textContent).toBe('3 new');
    expect(q('[data-testid="arrivals-breakdown"]').textContent).toBe('2 messages · 1 lesson');
    expect([...document.querySelectorAll('[data-testid="arrivals-row"]')].map((r) => r.getAttribute('data-kind'))).toEqual(['lesson-published', 'message']);
  });

  it('on a launch with something new, the bar opens the list by itself, once; the header instance never does', async () => {
    const win = makeWin(); win.sessionStorage = storage();
    win.__ptArrivals = { count: 3, items, all: items };
    await mount(win);
    expect(q('[data-testid="arrivals-heading"]').textContent).toBe('3 new');
    expect(win.sessionStorage.getItem(LAUNCH_OPENED_KEY)).toBe('1');
    await act(async () => root.unmount()); root = null; container.remove();
    // The same launch, mounted again (a route change): it stays closed.
    await mount(win);
    expect(q('[data-testid="arrivals-heading"]')).toBeNull();
    await act(async () => root.unmount()); root = null; container.remove();
    // A header instance on a fresh launch: closed.
    const win2 = makeWin(); win2.sessionStorage = storage(); win2.__ptArrivals = { count: 3, items, all: items };
    await mount(win2, { variant: 'header' });
    expect(q('[data-testid="arrivals-heading"]')).toBeNull();
    expect(win2.sessionStorage.getItem(LAUNCH_OPENED_KEY)).toBeNull();
  });

  it('PROVEN-TO-CATCH: nothing new on launch opens nothing and marks nothing', async () => {
    const win = makeWin(); win.sessionStorage = storage();
    await mount(win);
    expect(q('[data-testid="arrivals-heading"]')).toBeNull();
    expect(win.sessionStorage.getItem(LAUNCH_OPENED_KEY)).toBeNull();
  });
});

// ── 4. THE CLOSED APP ───────────────────────────────────────────────────────
describe('the closed app: a one-person lesson topic, the drain, the enqueue', () => {
  const lesson = { topic: 'lesson', instanceId: 'inst-1', userIds: ['u1'], title: 'Your lesson is ready to review', body: 'Open Your lessons.', url: '/poetech-app/?view=create&panel=your-lessons', dedupeKey: 'lesson:r1:ready' };

  it('the sender accepts a lesson notice for ONE named person with its outbox key, and refuses a broadcast', () => {
    expect(SENDABLE_TOPICS).toContain('lesson');
    const ok = validateSendRequest(lesson);
    expect(ok.ok).toBe(true);
    expect(ok.value.dedupeKey).toBe('lesson:r1:ready');
    expect(ok.value.userIds).toEqual(['u1']);
    expect(ok.value.url).toBe('/poetech-app/?view=create&panel=your-lessons');
    expect(validateSendRequest({ ...lesson, userIds: [] }).ok).toBe(false);
    expect(validateSendRequest({ ...lesson, userIds: undefined }).ok).toBe(false);
    expect(validateSendRequest({ ...lesson, dedupeKey: '' }).ok).toBe(false);
  });

  it('a lesson notice reaches the person’s own devices through their message opt-in, by person and never by instance', () => {
    const p = audienceQuery({ topic: 'lesson', instanceId: 'inst-1', userIds: ['u1'] });
    expect(p.get('topics')).toBe('cs.{message}');
    expect(p.get('user_id')).toBe('in.(u1)');
    expect(p.get('instance_id')).toBeNull();
    expect(audienceQuery({ topic: 'fault', instanceId: 'i', userIds: ['o'] }).get('topics')).toBe('cs.{fault}');
  });

  it('the words name the event and nothing a lock screen should not show', () => {
    expect(lessonAnnouncement({ event: 'ready' })).toEqual({ title: 'Your lesson is ready to review', body: 'Every version is written. Open Your lessons to choose.' });
    expect(lessonAnnouncement({ event: 'published' }).title).toBe('Your lesson is published');
  });

  it('the drain sends a lesson row to its one person as topic lesson, and carries the machine token the sender reads', () => {
    const drain = read(ROOT, 'scripts', 'push-outbox-drain-over-tailnet.sh');
    expect(drain).toMatch(/topic:"lesson"/);
    expect(drain).toMatch(/o\.kind = 'lesson'/);
    expect(drain).toMatch(/o\.target_user/);
    expect(drain).toMatch(/dedupeKey:\.dedupe_key/);
    // functions/api/push-send.js reads the machine token from x-push-token; a
    // bearer alone is taken for a person's JWT and refused with 401.
    expect(drain).toMatch(/x-push-token: \$\{PUSH_SEND_TOKEN\}/);
    expect(read(ROOT, 'app', 'functions', 'api', 'push-send.js')).toMatch(/headers\.get\('x-push-token'\)/);
    // The fault path of DR-0400 is untouched.
    expect(drain).toMatch(/topic:"fault"/);
  });

  it('migration 0246 enqueues on the tag FLIP only, one per teaching per event, to the row’s own person', () => {
    const mig = read(ROOT, 'infra', 'supabase', 'migrations-auto', MIG);
    expect(mig).toMatch(/AFTER UPDATE OF tags ON public\.agent_inbox/);
    expect(mig).toMatch(/IF TG_OP <> 'UPDATE' THEN RETURN NEW; END IF;/);
    expect(mig).toMatch(/NOT \(coalesce\(OLD\.tags, '\[\]'::jsonb\) @> '\["awaiting-review"\]'::jsonb\)/);
    expect(mig).toMatch(/NOT \(coalesce\(OLD\.tags, '\[\]'::jsonb\) @> '\["lesson-published"\]'::jsonb\)/);
    expect(mig).toMatch(/t LIKE 'of:%'/);
    expect(mig).toMatch(/'lesson:' \|\| v_root \|\| ':ready'/);
    expect(mig).toMatch(/'lesson:' \|\| v_root \|\| ':published'/);
    expect(mig).toMatch(/ON CONFLICT \(dedupe_key\) WHERE dedupe_key IS NOT NULL DO NOTHING/);
    expect(mig).toMatch(/target_user uuid/);
    expect(mig).toMatch(/NEW\.created_by/);
    expect(mig).toMatch(/EXCEPTION WHEN OTHERS THEN\s*\n\s*NULL/);
    // The open app hears the flip: the table joins the realtime publication.
    expect(mig).toMatch(/ALTER PUBLICATION supabase_realtime ADD TABLE public\.agent_inbox/);
    // The person reads their own rows; the office policy of 0220 stands.
    expect(mig).toMatch(/target_user = auth\.uid\(\)/);
  });

  it('the enqueue is proven on a real PostgreSQL in CI, and the required check waits on it', () => {
    const ci = read(ROOT, '.github', 'workflows', 'ci.yml');
    expect(ci).toMatch(/^\s{2}arrivals-push:\n/m);
    expect(ci).toMatch(new RegExp(`migrations-auto/${MIG.replace(/\./g, '\\.')}`));
    expect(ci).toMatch(/scripts\/arrivals-ci-smoke\.sql/);
    // The required check WAITS ON THIS LEG. Asserted by membership, not by
    // pinning the whole list: this test's job is that arrivals-push is wired
    // into the aggregator, and a pinned list went red every time an unrelated
    // leg was added (DR-0754 added learner-records and broke it). Still
    // proven-to-catch — dropping arrivals-push from `needs:` fails here.
    const needs = (ci.match(/^\s*needs: \[([^\]]+)\]/m) || [])[1] || '';
    expect(needs.split(',').map((x) => x.trim())).toContain('arrivals-push');
    const smoke = read(ROOT, 'scripts', 'arrivals-ci-smoke.sql');
    expect(smoke).toMatch(/every wall held/);
    expect(smoke).toMatch(/did not enqueue exactly one row/);
    expect(smoke).toMatch(/a repeat or an unrelated change enqueued again/);
    expect(smoke).toMatch(/another person read the speaker/);
    expect(existsSync(join(ROOT, 'scripts', 'arrivals-ci-bootstrap.sql'))).toBe(true);
  });
});

// ── 5. THE RECORD ───────────────────────────────────────────────────────────
describe('the record', () => {
  it('DR-0728 is on file with its five headings and an INDEX row', () => {
    const dir = join(ROOT, 'docs', 'decisions');
    const file = readdirSync(dir).find((n) => n.startsWith('DR-0728-'));
    expect(file).toBeTruthy();
    const dr = read(dir, file);
    for (const h of ['## Context', '## What was measured', '## Impact', '## Decision', '## Verification']) expect(dr).toContain(h);
    expect(dr).toMatch(/per device/i);
    expect(read(dir, 'INDEX.md')).toMatch(/\| \[DR-0728\]\(/);
  });
});
