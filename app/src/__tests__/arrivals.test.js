// =============================================================================
// arrivals — one count for everything that arrived and was not looked at (DR-0728)
// =============================================================================
// Darrell 2026-10-01, in the installed app: "Why don't the PoeTech App have
// those types of notifications and the number of them if I haven't checked
// them yet?" These pin the pure model: every kind from real rows, newest first,
// a per-account seen mark that a screen sets and the bell never does, and the
// one number the icon and the bell both show.
import { describe, it, expect } from 'vitest';
import {
  ARRIVAL_KINDS, SCREEN_KINDS, ARRIVALS_SEEN_EVENT, SEEN_CAP,
  lessonArrivals, queueArrivals, feedbackArrivals, messageArrival, combineArrivals,
  loadSeen, saveSeen, markSeen, isUnseen, unseenArrivals, arrivalCount, ringableIds, newSince,
  arrivalLanding, arrivalNotification, badgeText, markArrivalsSeen, seenKey,
} from '../lib/arrivals.js';

const item = (over = {}) => ({
  id: 'r1', createdAt: '2026-10-01T10:00:00Z', transcriptAt: '2026-10-01T10:05:00Z', progressTags: [], spoken: true,
  review: { state: 'pending', line: 'Waiting for review.' }, published: null, ...over,
});

describe('every kind, read from the rows each screen already reads', () => {
  it('names the six kinds and which screen marks which seen', () => {
    expect(ARRIVAL_KINDS).toEqual(['message', 'lesson-ready', 'lesson-review', 'lesson-published', 'review-queue', 'feedback']);
    expect(SCREEN_KINDS['your-lessons']).toEqual(['lesson-ready', 'lesson-review', 'lesson-published']);
    expect(SCREEN_KINDS.decide).toEqual(['review-queue']);
    expect(SCREEN_KINDS.feedback).toEqual(['feedback']);
  });

  it('a lesson that moved lesson-building -> awaiting-review is READY, timed by the builder’s own stamp', () => {
    const out = lessonArrivals([item({ progressTags: ['lesson', 'awaiting-review', 'build:awaiting-review@2026-10-01T11:00:00Z'] })], { owner: true });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ kind: 'lesson-ready', id: 'lesson-ready:r1', at: '2026-10-01T11:00:00Z', screen: 'your-lessons', title: 'Your lesson is ready to review' });
  });

  it('a member’s written lesson says it waits for the Governor; the Governor’s says choose', () => {
    const tags = ['lesson', 'awaiting-review'];
    expect(lessonArrivals([item({ progressTags: tags })], { owner: false })[0].title).toBe('Your lesson is written');
    expect(lessonArrivals([item({ progressTags: tags })], { owner: true })[0].detail).toMatch(/your choice/);
  });

  it('still building, or already built and pushed, is NOT a ready arrival', () => {
    expect(lessonArrivals([item({ progressTags: ['lesson', 'lesson-building'] })])).toEqual([]);
    expect(lessonArrivals([item({ progressTags: ['lesson', 'awaiting-review', 'lesson-captured'] })])).toEqual([]);
    expect(lessonArrivals([item({ progressTags: ['lesson', 'awaiting-review', 'build:pushed@2026-10-01T12:00:00Z'] })])).toEqual([]);
  });

  it('a published lesson is its own arrival, with the lesson named', () => {
    const out = lessonArrivals([item({ published: { number: 'L205', title: 'Grace', lessonId: 'll205', href: '?view=church&lesson=ll205' } })]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ kind: 'lesson-published', id: 'lesson-published:r1', detail: 'L205 Grace', href: '?view=church&lesson=ll205' });
  });

  it('the Governor’s decision on a member’s request is an arrival for the member only', () => {
    const approved = item({ review: { state: 'approved', line: 'Approved: a lesson is being written from your situation; your name is not used.' } });
    expect(lessonArrivals([approved], { owner: false })[0]).toMatchObject({ kind: 'lesson-review', title: 'Your lesson request was approved' });
    expect(lessonArrivals([approved], { owner: true })).toEqual([]);
    expect(lessonArrivals([item({ review: { state: 'pending', line: '' } })], { owner: false })).toEqual([]);
  });

  it('the Governor’s queue: one arrival per waiting member row', () => {
    const out = queueArrivals([{ id: 'q1', created_at: '2026-10-01T09:00:00Z', sender_name: 'Christina' }, { id: 'q2', created_at: '2026-10-01T09:30:00Z' }]);
    expect(out.map((o) => o.id)).toEqual(['review-queue:q1', 'review-queue:q2']);
    expect(out[0]).toMatchObject({ kind: 'review-queue', detail: 'Christina', screen: 'decide' });
    expect(out[1].detail).toBe('A member');
  });

  it('feedback counts only once a steward moved it off new, and carries the reply', () => {
    const out = feedbackArrivals([
      { id: 'f1', triageStatus: 'new', submittedAt: '2026-09-30T08:00:00Z' },
      { id: 'f2', triageStatus: 'fixed', triageNotes: 'Shipped in #1900.', submittedAt: '2026-09-30T09:00:00Z' },
      { id: 'f3', triage_status: 'in-progress', submitted_at: '2026-09-30T10:00:00Z' },
    ]);
    expect(out.map((o) => o.id)).toEqual(['feedback:f2', 'feedback:f3']);
    expect(out[0].detail).toBe('Shipped in #1900.');
    expect(out[1].detail).toBe('Now: in progress.');
  });

  it('unread messages are one row carrying the count and the newest sender', () => {
    expect(messageArrival({ count: 0 })).toBeNull();
    const m = messageArrival({ count: 3, newest: { messageId: 'm9', senderName: 'Christina', at: '2026-10-01T12:00:00Z', peerUserId: 'p1' } });
    expect(m).toMatchObject({ kind: 'message', id: 'message:m9', count: 3, peerUserId: 'p1', screen: 'messages' });
    expect(m.title).toContain('3 new messages');
  });

  it('combines every kind newest first; an item with no time sorts last', () => {
    const all = combineArrivals({
      message: messageArrival({ count: 1, newest: { at: '2026-10-01T12:00:00Z' } }),
      lessons: [{ kind: 'lesson-ready', id: 'a', at: '2026-10-01T13:00:00Z' }, { kind: 'lesson-published', id: 'b', at: '' }],
      queue: [{ kind: 'review-queue', id: 'c', at: '2026-10-01T11:00:00Z' }],
      feedback: [{ kind: 'feedback', id: 'd', at: '2026-10-01T12:30:00Z' }],
    });
    expect(all.map((x) => x.id)).toEqual(['a', 'd', 'message:unread', 'c', 'b']);
  });
});

describe('the seen mark: per account, on this device, set by a screen', () => {
  const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), map: m }; };
  const items = [
    { kind: 'lesson-ready', id: 'lesson-ready:r1', at: '2026-10-01T11:00:00Z' },
    { kind: 'review-queue', id: 'review-queue:q1', at: '2026-10-01T09:00:00Z' },
    messageArrival({ count: 2, newest: { at: '2026-10-01T12:00:00Z' } }),
  ];

  it('nothing stored, nothing unreadable: nothing seen', () => {
    expect(loadSeen(store(), 'u1').ids).toEqual([]);
    const s = store(); s.setItem(seenKey('u1'), 'not json');
    expect(loadSeen(s, 'u1').ids).toEqual([]);
    expect(loadSeen(null, 'u1').ids).toEqual([]);
  });

  it('marks ONLY the kinds the opened screen owns; messages keep their database read state', () => {
    const seen = markSeen(loadSeen(store(), 'u1'), items, SCREEN_KINDS['your-lessons']);
    expect(seen.ids).toEqual(['lesson-ready:r1']);
    expect(isUnseen(items[0], seen)).toBe(false);
    expect(isUnseen(items[1], seen)).toBe(true);
    expect(isUnseen(items[2], seen)).toBe(true);
    const all = markSeen(seen, items, ['message', 'review-queue']);
    expect(all.ids).toEqual(['lesson-ready:r1', 'review-queue:q1']);
  });

  it('the count is unread messages plus every other unseen item', () => {
    expect(arrivalCount(items, { ids: [] })).toBe(4);
    expect(arrivalCount(items, { ids: ['lesson-ready:r1'] })).toBe(3);
    expect(arrivalCount(items, { ids: ['lesson-ready:r1', 'review-queue:q1'] })).toBe(2);
    expect(unseenArrivals(items, { ids: ['review-queue:q1'] }).map((x) => x.id)).toEqual(['lesson-ready:r1', 'message:unread']);
  });

  it('round-trips through storage under the account’s own key, and never grows past the cap', () => {
    const s = store();
    expect(saveSeen(s, 'u1', { ids: ['a'] })).toBe(true);
    expect(loadSeen(s, 'u1').ids).toEqual(['a']);
    expect(loadSeen(s, 'u2').ids).toEqual([]);
    const many = Array.from({ length: SEEN_CAP + 10 }, (_, i) => ({ kind: 'feedback', id: `feedback:${i}` }));
    const capped = markSeen({ ids: [] }, many, ['feedback']);
    expect(capped.ids).toHaveLength(SEEN_CAP);
    expect(capped.ids[0]).toBe('feedback:10');
  });

  it('what is new since the last look never includes messages (dm-notify rings those)', () => {
    expect(newSince(items, ['lesson-ready:r1']).map((x) => x.id)).toEqual(['review-queue:q1']);
    expect(ringableIds(items)).toEqual(['lesson-ready:r1', 'review-queue:q1']);
  });

  it('a screen tells the watcher it opened, as one event naming its kinds', () => {
    let got = null;
    const win = { dispatchEvent: (e) => { got = e; return true; }, CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } } };
    expect(markArrivalsSeen(SCREEN_KINDS.decide, win)).toBe(true);
    expect(got.type).toBe(ARRIVALS_SEEN_EVENT);
    expect(got.detail.kinds).toEqual(['review-queue']);
    expect(markArrivalsSeen(['feedback'], null)).toBe(false);
  });
});

describe('where a tap lands, in the door the person is already in', () => {
  it('a message opens its thread; a lesson opens Your lessons; the queue opens Lessons to decide', () => {
    const peer = '11111111-2222-3333-4444-555555555555';
    expect(arrivalLanding({ pathname: '/lovecorner/app/', item: { kind: 'message', peerUserId: peer } })).toBe(`/lovecorner/app/?view=messages&dm=${peer}`);
    expect(arrivalLanding({ pathname: '/lovecorner/app/', item: { kind: 'lesson-ready', screen: 'your-lessons' } })).toBe('/lovecorner/app/?view=create&panel=your-lessons');
    expect(arrivalLanding({ pathname: '/poetech-app/', item: { kind: 'lesson-published', screen: 'your-lessons' } })).toBe('/poetech-app/?view=create&panel=your-lessons');
    expect(arrivalLanding({ pathname: '/poetech-app/', item: { kind: 'review-queue', screen: 'decide' } })).toBe('/poetech-app/?view=create&panel=decide');
  });
  it('feedback has no URL (the footer button opens the sheet), and nothing is nothing', () => {
    expect(arrivalLanding({ pathname: '/poetech-app/', item: { kind: 'feedback', screen: 'feedback' } })).toBeNull();
    expect(arrivalLanding({ item: null })).toBeNull();
  });
  it('the local notification says what arrived and nothing a lock screen should not show', () => {
    const n = arrivalNotification({ id: 'lesson-ready:r1', title: 'Your lesson is ready to review', detail: 'Every version is written and waits for your choice.' });
    expect(n).toEqual({ title: 'Your lesson is ready to review', body: 'Every version is written and waits for your choice.', tag: 'poetech-arrival:lesson-ready:r1' });
    expect(arrivalNotification(null)).toBeNull();
  });
  it('the title badge reads the number, and clears at zero', () => {
    expect(badgeText(7)).toBe('(7) ');
    expect(badgeText(0)).toBe('');
  });
});
