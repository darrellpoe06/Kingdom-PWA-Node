// @vitest-environment jsdom
// =============================================================================
// A member may choose to be named (DR-0639)
// =============================================================================
// Darrell 2026-09-24: "Name is used if they want to though... make sense?"
// Off by default; ticked, the notice names the exact name that will be used;
// the row carries the choice as tags; the Governor's queue shows it and can
// still approve but keep it anonymous; the member's outcome says which.
import { createElement, act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';

const DB = vi.hoisted(() => {
  const GOV = new Set(['darrellpoe06@gmail.com']);
  const state = {
    me: { id: 'mae', email: 'mae@example.com', user_metadata: { display_name: 'Mae Johnson' } },
    rows: [], relayed: [],
  };
  const decided = (r) => r.tags.includes('lesson-approved') || r.tags.includes('lesson-declined');
  const supabase = {
    auth: { getSession: async () => ({ data: { session: { user: state.me } } }) },
    rpc: async (fn, args) => {
      if (!GOV.has(state.me.email)) return { data: null, error: { message: 'only the Governor reviews member lessons' } };
      if (fn === 'member_lesson_queue') return { data: state.rows.filter((r) => !decided(r)), error: null };
      if (fn === 'review_member_lesson') {
        const r = state.rows.find((x) => x.id === args.p_row);
        if (!r || decided(r)) return { data: null, error: { message: 'already decided' } };
        if (args.p_decision === 'approve-anonymous') r.tags = [...r.tags, 'lesson-approved', 'lesson-anonymous'];
        else if (args.p_decision === 'approve') r.tags = [...r.tags, 'lesson-approved'];
        else r.tags = [...r.tags, 'lesson-declined'];
        return { data: { id: r.id, tag: args.p_decision === 'decline' ? 'lesson-declined' : 'lesson-approved' }, error: null };
      }
      return { data: null, error: { message: 'unknown rpc' } };
    },
    from: () => {
      const api = { select: () => api, contains: () => api, order: () => api, eq: () => api, limit: async () => ({ data: [], error: null }), insert: () => api, single: async () => ({ data: null, error: null }) };
      return api;
    },
  };
  const relay = async ({ body, tags, source }) => { state.relayed.push({ body, tags, source }); return { ok: true, reason: '', id: 'x' }; };
  return { state, supabase, relay };
});
vi.mock('../lib/supabase.js', () => ({ default: DB.supabase }));
vi.mock('../lib/agent-inbox-sync.js', () => ({ relayThought: (...a) => DB.relay(...a) }));
vi.mock('../lib/saved-prompts.js', async (orig) => ({ ...(await orig()), rememberPrompt: async () => ({ ok: true }) }));

import { LESSON_NOTICE, lessonNotice, lessonNameTags, lessonNameOf, cleanLessonName } from '../lib/one-voice-surfaces.js';
import { memberOutcome, nameForLesson, nameChoiceLabel, OUTCOME_LINES, READER_PROTOCOL_FOR_MEMBER_ROWS } from '../lib/member-lesson-review.js';
import OneVoiceInput from '../components/OneVoiceInput.jsx';
import MemberLessonQueue from '../components/MemberLessonQueue.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host;
const tick = async () => { await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
async function mount(el) {
  host = document.createElement('div');
  document.body.appendChild(host);
  await act(async () => { createRoot(host).render(el); });
  await tick();
  return host;
}
const $ = (s) => host.querySelector(s);
const button = (label) => [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === label);
const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await tick(); };
const setValue = async (el, v) => {
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  await act(async () => { Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); });
};
const NAMED = 'What you share here may be used to write a lesson from the Word that others read. Your name will be used as you wrote it: Sister Mae. Other personal details are still changed.';

describe('the notice tells the truth either way', () => {
  it('unticked: the name is never used; ticked: the exact name', () => {
    expect(lessonNotice(false, 'Sister Mae')).toBe(LESSON_NOTICE);
    expect(LESSON_NOTICE).toMatch(/Your name is never used, and personal details are changed so no one can tell it was you\.$/);
    expect(lessonNotice(true, '  Sister   Mae ')).toBe(NAMED);
    // Ticked with no name is anonymous, and says so.
    expect(lessonNotice(true, '   ')).toBe(LESSON_NOTICE);
  });
  it('the row carries the choice as tags, and nothing when anonymous', () => {
    expect(lessonNameTags(true, 'Sister Mae')).toEqual(['lesson-name-ok', 'lesson-name:Sister Mae']);
    expect(lessonNameTags(false, 'Sister Mae')).toEqual([]);
    expect(lessonNameTags(true, '')).toEqual([]);
    expect(lessonNameOf(['lesson', 'lesson-name-ok', 'lesson-name:Sister Mae'])).toBe('Sister Mae');
    expect(lessonNameOf(['lesson', 'lesson-name:Sister Mae'])).toBe('');
    expect(cleanLessonName('x'.repeat(90)).length).toBe(60);
  });
});

describe('the Speak box: off by default, prefilled, editable, remembered', () => {
  beforeEach(() => { localStorage.clear(); DB.state.relayed = []; DB.state.me = { id: 'mae', email: 'mae@example.com', user_metadata: { display_name: 'Mae Johnson' } }; });

  it('ticked and named, the notice and the sent row say so; unticked, anonymous', async () => {
    await mount(createElement(OneVoiceInput, { surface: 'church' }));
    await click(button('📖 Lesson'));
    const box = $('[data-testid="lesson-name-ok"]');
    expect(box.checked).toBe(false);
    expect($('[data-testid="lesson-name"]')).toBeNull();
    expect($('[data-testid="lesson-notice"]').textContent).toBe(LESSON_NOTICE);

    await click(box);
    expect($('[data-testid="lesson-name"]').value).toBe('Mae Johnson'); // prefilled from the account
    await setValue($('[data-testid="lesson-name"]'), 'Sister Mae');
    expect($('[data-testid="lesson-notice"]').textContent).toBe(NAMED);

    await setValue($('textarea'), 'A job ran over by four hours');
    await click(button('Send'));
    expect(DB.state.relayed[0].tags).toEqual(['lesson', 'lesson-name-ok', 'lesson-name:Sister Mae']);

    await click(button('📖 Lesson'));
    expect($('[data-testid="lesson-name-ok"]').checked).toBe(true); // the choice held through the send
    await click($('[data-testid="lesson-name-ok"]'));
    expect($('[data-testid="lesson-notice"]').textContent).toBe(LESSON_NOTICE);
    await setValue($('textarea'), 'A second one');
    await click(button('Send'));
    expect(DB.state.relayed[1].tags).toEqual(['lesson']);
  });

  it('the choice is remembered for the person', async () => {
    await mount(createElement(OneVoiceInput, { surface: 'notes', addNote: () => {} }));
    await click(button('📖 Lesson'));
    await click($('[data-testid="lesson-name-ok"]'));
    await setValue($('[data-testid="lesson-name"]'), 'Sister Mae');
    await mount(createElement(OneVoiceInput, { surface: 'notes', addNote: () => {} }));
    await click(button('📖 Lesson'));
    expect($('[data-testid="lesson-name-ok"]').checked).toBe(true);
    expect($('[data-testid="lesson-name"]').value).toBe('Sister Mae');
    expect($('[data-testid="lesson-notice"]').textContent).toBe(NAMED);
  });
});

describe('the Governor’s queue shows the choice and may keep it anonymous', () => {
  beforeEach(() => {
    DB.state.me = { id: 'gov', email: 'darrellpoe06@gmail.com' };
    DB.state.rows = [
      { id: 'n1', body: 'a job ran over', tags: ['lesson', 'lesson-name-ok', 'lesson-name:Sister Mae'], sender_name: 'Mae Johnson' },
      { id: 'a1', body: 'a promise broken', tags: ['lesson'], sender_name: 'Ben' },
    ];
  });

  it('Named: <name> or Anonymous; the anonymous approval only where a name was offered', async () => {
    await mount(createElement(MemberLessonQueue, { signedIn: true }));
    expect($('[data-row-id="n1"] [data-testid="member-lesson-name-choice"]').textContent).toBe('Named: Sister Mae');
    expect($('[data-row-id="a1"] [data-testid="member-lesson-name-choice"]').textContent).toBe('Anonymous');
    expect($('[data-row-id="a1"] [data-testid="member-lesson-approve-anonymous"]')).toBeNull();
    await click($('[data-row-id="n1"] [data-testid="member-lesson-approve-anonymous"]'));
    expect(DB.state.rows.find((r) => r.id === 'n1').tags).toEqual(expect.arrayContaining(['lesson-approved', 'lesson-anonymous']));
  });

  it('plain Approve keeps the offered name', async () => {
    await mount(createElement(MemberLessonQueue, { signedIn: true }));
    await click($('[data-row-id="n1"] [data-testid="member-lesson-approve"]'));
    const t = DB.state.rows.find((r) => r.id === 'n1').tags;
    expect(t).toContain('lesson-approved');
    expect(t).not.toContain('lesson-anonymous');
  });
});

describe('the member’s outcome and the reader follow the choice', () => {
  it('approved and named / approved and kept anonymous', () => {
    const named = { tags: ['lesson', 'lesson-name-ok', 'lesson-name:Sister Mae', 'lesson-approved'] };
    const keptAnon = { tags: [...named.tags, 'lesson-anonymous'] };
    expect(memberOutcome(named).line).toBe('Approved: a lesson is being written from your situation, with your name as you gave it.');
    expect(memberOutcome(keptAnon).line).toBe(OUTCOME_LINES.approved);
    expect(memberOutcome({ tags: ['lesson', 'lesson-approved'] }).line).toBe(OUTCOME_LINES.approved);
    expect(nameForLesson(named)).toBe('Sister Mae');
    expect(nameForLesson(keptAnon)).toBe('');
    expect(nameChoiceLabel({ tags: ['lesson'] })).toBe('Anonymous');
  });
  it('the protocol: only the name they gave, as they gave it; every other detail still changed', () => {
    const p = READER_PROTOCOL_FOR_MEMBER_ROWS.join(' ');
    expect(p).toMatch(/With "lesson-name-ok" and no "lesson-anonymous": use ONLY the name the member gave/);
    expect(p).toMatch(/exactly as they gave it/);
    expect(p).toMatch(/every other identifying detail is still changed/);
    expect(p).toMatch(/tag the row "lesson-published" and "lesson-id:/);
    expect(p).toMatch(/Without "lesson-name-ok" \(or with "lesson-anonymous"\): never use the member’s name/);
  });
});
