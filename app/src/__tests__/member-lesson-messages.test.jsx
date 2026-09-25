// @vitest-environment jsdom
// =============================================================================
// The member hears the outcome in Messages (DR-0639)
// =============================================================================
// Darrell 2026-09-24: "Connects to the users and messages systems?" These pin
// the Messages edge: the decision and the published lesson are sent from the
// Governor's own client as an encrypted Message, never as plaintext; a member
// with no Messages key or no shared space is said so and the decision stands;
// what is owed is sent on his next visit; a reply is an ordinary Message back.
import { createElement, act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';

const DB = vi.hoisted(() => {
  const state = { me: { id: 'gov', email: 'darrellpoe06@gmail.com' }, rows: [], outbox: [], inserts: [], publicKeys: {} };
  const decided = (r) => r.tags.includes('lesson-approved') || r.tags.includes('lesson-declined');
  const chain = (table) => {
    const q = { table, filters: {} };
    const api = {
      select: () => api, order: () => api, contains: () => api,
      eq: (c, v) => { q.filters[c] = v; return api; },
      limit: async () => ({ data: state.rows.filter((r) => r.created_by === state.me.id), error: null }),
      maybeSingle: async () => {
        if (table === 'dm_public_keys') return { data: state.publicKeys[q.filters.user_id] ? { public_jwk: state.publicKeys[q.filters.user_id] } : null, error: null };
        if (table === 'direct_messages') return { data: { id: `dm-${state.inserts.length}` }, error: null };
        return { data: null, error: null };
      },
      insert: (row) => { if (table === 'direct_messages') state.inserts.push(row); return api; },
      upsert: async () => ({ error: null }),
    };
    return api;
  };
  const supabase = {
    auth: { getSession: async () => ({ data: { session: { user: state.me } } }) },
    from: chain,
    rpc: async (fn, args) => {
      if (fn === 'member_lesson_queue') return { data: state.rows.filter((r) => !decided(r)), error: null };
      if (fn === 'member_lesson_outbox') return { data: state.outbox, error: null };
      if (fn === 'review_member_lesson') {
        const r = state.rows.find((x) => x.id === args.p_row);
        const tag = args.p_decision === 'decline' ? 'lesson-declined' : 'lesson-approved';
        r.tags = [...r.tags, tag];
        return { data: { id: r.id, tag }, error: null };
      }
      return { data: null, error: { message: `unknown ${fn}` } };
    },
  };
  return { state, supabase };
});
vi.mock('../lib/supabase.js', () => ({ default: DB.supabase }));
vi.mock('../lib/push-announce.js', () => ({ notifyNewMessage: async () => ({ ok: true }) }));
vi.mock('../lib/church-instance.js', () => ({ churchInstanceId: async () => 'church-inst' }));

import { decisionMessage, publishedMessage, deliverLessonMessage, owedMessage, publishedLessonOf, DELIVERY_LINES } from '../lib/lesson-review-messages.js';
import { sendDirectMessage, toDmShape, groupDmThreads, unreadDmCount } from '../lib/direct-messages-sync.js';
import MemberLessonQueue from '../components/MemberLessonQueue.jsx';
import LessonInbox from '../components/LessonInbox.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const url = ({ courseKey, lessonId }) => `https://poetech.us/?course=${courseKey}&lesson=${lessonId}`;
const L162 = 'll162-do-not-take-a-death-so-personal-that-you-undermine-your-way-home-let-him-be-him';

let host;
const tick = async () => { await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
async function mount(el) {
  host = document.createElement('div');
  document.body.appendChild(host);
  await act(async () => { createRoot(host).render(el); });
  await tick(); await tick();
  return host;
}
const $ = (s) => host.querySelector(s);

const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await tick(); await tick(); };

function fakeMessaging({ contacts = [{ userId: 'mae', instanceId: 'church-inst' }], result = { sent: true, encrypted: true } } = {}) {
  const calls = { sent: [], marked: [] };
  return {
    calls,
    loadDmContacts: async () => contacts,
    sendDirectMessage: async (...a) => { calls.sent.push(a); return typeof result === 'function' ? result(...a) : result; },
    markMessaged: async (id, kind) => { calls.marked.push([id, kind]); },
  };
}

describe('the Message says what was decided', () => {
  it('approved, named or anonymous; declined with the reason and the lessons as links', () => {
    const named = decisionMessage({ tags: ['lesson', 'lesson-name-ok', 'lesson-name:Sister Mae', 'lesson-approved'] });
    expect(named).toMatch(/approved\. A lesson is being written from your situation, with your name as you gave it: Sister Mae\./);
    const kept = decisionMessage({ tags: ['lesson', 'lesson-name-ok', 'lesson-name:Sister Mae', 'lesson-approved', 'lesson-anonymous'] });
    expect(kept).toMatch(/your name is not used/);
    expect(kept).not.toMatch(/Sister Mae/);
    const declined = decisionMessage({ body: 'My mother passed away last week', tags: ['lesson', 'lesson-declined'], review_reason: 'L162 already teaches this' }, { url });
    expect(declined).toMatch(/^Your lesson request was not written as a new lesson: L162 already teaches this\./);
    expect(declined).toContain(`1. Do Not Take a Death So Personal`);
    expect(declined).toContain(`lesson=${L162}`);
    expect(declined.split('\n').filter((l) => /^\d\. /.test(l)).length).toBe(3);
  });

  it('published: the lesson number, title and link', () => {
    const row = { tags: ['lesson', 'lesson-approved', 'lesson-published', `lesson-id:${L162}`] };
    expect(publishedLessonOf(row.tags)).toMatchObject({ lessonId: L162, number: 'L162' });
    expect(publishedMessage(row, { url })).toBe(`Your lesson is published: L162 Do Not Take a Death So Personal That You Undermine Your Way Home — Let Him Be Him. Open it: ${url({ courseKey: 'living-lessons', lessonId: L162 })}`);
    expect(owedMessage(row)).toBe('published');
    expect(owedMessage({ tags: [...row.tags, 'messaged:published'] })).toBe('');
  });
});

describe('delivery: encrypted or not at all, and the decision always stands', () => {
  const row = { id: 'r1', created_by: 'mae', body: 'a job ran over', tags: ['lesson', 'lesson-approved'] };

  it('sends to the shared space, requiring encryption, and marks it sent', async () => {
    const m = fakeMessaging();
    const d = await deliverLessonMessage(row, m, { kind: 'decision' });
    expect(d.status).toBe('sent');
    expect(m.calls.sent[0][0]).toBe('mae');
    expect(m.calls.sent[0][3]).toBe('church-inst');
    expect(m.calls.sent[0][4]).toEqual({ requireEncryption: true });
    expect(m.calls.marked).toEqual([['r1', 'decision']]);
  });

  it('no Messages key: said so, nothing marked', async () => {
    const m = fakeMessaging({ result: { skipped: 'no-key' } });
    const d = await deliverLessonMessage(row, m, { kind: 'decision' });
    expect(d.line).toBe('They’ll see it in Your lessons; no Messages key yet.');
    expect(m.calls.marked).toEqual([]);
  });

  it('no shared space, or a throw: said so, never raised', async () => {
    expect((await deliverLessonMessage(row, fakeMessaging({ contacts: [] }), { kind: 'decision' })).status).toBe('no-shared-space');
    const boom = { ...fakeMessaging(), loadDmContacts: async () => { throw new Error('down'); } };
    expect((await deliverLessonMessage(row, boom, { kind: 'decision' })).line).toBe(DELIVERY_LINES.failed.replace('{reason}', 'down'));
  });

  it('the Messages system itself refuses plaintext when asked: no key, no insert', async () => {
    DB.state.inserts = [];
    DB.state.publicKeys = {};
    const res = await sendDirectMessage('mae', 'private words', 'Darrell', 'church-inst', { requireEncryption: true });
    expect(res).toEqual({ skipped: 'no-key' });
    expect(DB.state.inserts).toEqual([]);
    // Every other sender keeps the old honest plaintext fallback.
    const plain = await sendDirectMessage('mae', 'hello', 'Darrell', 'church-inst');
    expect(plain.sent).toBe(true);
    expect(DB.state.inserts.length).toBe(1);
  });
});

describe('the queue sends the Messages', () => {
  beforeEach(() => {
    DB.state.me = { id: 'gov', email: 'darrellpoe06@gmail.com' };
    DB.state.rows = [{ id: 'r1', created_by: 'mae', sender_name: 'Mae Johnson', body: 'a job ran over', tags: ['lesson'] }];
    DB.state.outbox = [];
  });

  it('a decision sends the Message and says so on the row', async () => {
    const m = fakeMessaging();
    await mount(createElement(MemberLessonQueue, { signedIn: true, messaging: m }));
    await click($('[data-testid="member-lesson-row"][data-row-id="r1"] [data-testid="member-lesson-approve"]'));
    expect(m.calls.sent.length).toBe(1);
    expect(m.calls.sent[0][1]).toMatch(/^Your lesson request was approved\./);
    const line = $('[data-testid="member-lesson-delivery"][data-row-id="r1"]');
    expect(line.getAttribute('data-status')).toBe('sent');
    expect(line.textContent).toMatch(/Mae Johnson: Sent to them in Messages, encrypted\./);
  });

  it('no key: the decision stands and the row says where they will see it', async () => {
    const m = fakeMessaging({ result: { skipped: 'no-key' } });
    await mount(createElement(MemberLessonQueue, { signedIn: true, messaging: m }));
    await click($('[data-testid="member-lesson-row"][data-row-id="r1"] [data-testid="member-lesson-approve"]'));
    expect(DB.state.rows[0].tags).toContain('lesson-approved');
    expect($('[data-testid="member-lesson-delivery"][data-row-id="r1"]').textContent).toMatch(/no Messages key yet/);
  });

  it('on his next visit, a published lesson’s Message is sent and marked', async () => {
    DB.state.rows = [];
    DB.state.outbox = [{ id: 'p1', created_by: 'mae', sender_name: 'Mae Johnson', body: 'x', tags: ['lesson', 'lesson-approved', 'messaged:decision', 'lesson-published', `lesson-id:${L162}`] }];
    const m = fakeMessaging();
    await mount(createElement(MemberLessonQueue, { signedIn: true, messaging: m }));
    expect(m.calls.sent[0][1]).toMatch(/^Your lesson is published: L162 /);
    expect(m.calls.marked).toEqual([['p1', 'published']]);
    expect($('[data-testid="member-lesson-owed-row"][data-row-id="p1"]').getAttribute('data-kind')).toBe('published');
  });
});

describe('the member’s side', () => {
  it('Your lessons shows "Published: L### <title> → open it"', async () => {
    DB.state.me = { id: 'mae', email: 'mae@example.com' };
    DB.state.rows = [{ id: 'p1', created_by: 'mae', body: 'x', created_at: '2026-09-24T10:00:00Z', tags: ['lesson', 'lesson-approved', 'lesson-published', `lesson-id:${L162}`] }];
    await mount(createElement(LessonInbox, { deps: { supabase: DB.supabase } }));
    expect($('[data-testid="lesson-published"]').textContent).toMatch(/^Published: L162 Do Not Take a Death So Personal/);
    expect($('[data-testid="lesson-published-link"]').getAttribute('href')).toBe(`?view=church&sub=learn&course=living-lessons&lesson=${L162}`);
  });

  it('a reply in that thread is an ordinary Message back to Darrell', async () => {
    DB.state.me = { id: 'mae', email: 'mae@example.com' };
    DB.state.inserts = [];
    const res = await sendDirectMessage('gov', 'Thank you, Brother Darrell', 'Mae', 'church-inst');
    expect(res.sent).toBe(true);
    expect(DB.state.inserts[0]).toMatchObject({ sender_user_id: 'mae', recipient_user_id: 'gov', instance_id: 'church-inst' });
    // From Darrell's side it is one thread with Mae: his Message and her reply.
    const rows = [
      { id: 'a', sender_user_id: 'gov', recipient_user_id: 'mae', body: 'Your lesson request was approved.', created_at: '1' },
      { id: 'b', sender_user_id: 'mae', recipient_user_id: 'gov', body: 'Thank you', created_at: '2', read_at: null },
    ].map((r) => toDmShape(r, 'gov'));
    const threads = groupDmThreads(rows, 'gov');
    expect(threads.length).toBe(1);
    expect(threads[0].otherUserId).toBe('mae');
    expect(threads[0].messages.length).toBe(2);
    expect(unreadDmCount(rows)).toBe(1);
  });
});
