// @vitest-environment jsdom
// =============================================================================
// Members' lessons, reviewed by the Governor first (DR-0635)
// =============================================================================
// Darrell 2026-09-24: "Que for me to review..." and "Make sure they know this
// could be used in a lesson... so they know..." These pin the queue on the real
// components over a fake database that behaves like migration 0237: the queue
// opens only for the Governor; approve writes `lesson-approved`; decline needs a
// reason and writes `lesson-declined` + the reason; the member reads the outcome
// on their own row; an undecided member row is never captured.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const read = (p) => readFileSync(join(REPO, p), 'utf8');

// --- a database that answers like 0237 ---------------------------------------
const DB = vi.hoisted(() => {
  const GOV = new Set(['darrellpoe06@gmail.com', '15636502416@phone.poetech.us']);
  const state = { me: { id: 'gov', email: 'darrellpoe06@gmail.com' }, rows: [], rpcCalls: [] };
  const isGov = () => GOV.has(state.me.email);
  const decided = (r) => r.tags.includes('lesson-approved') || r.tags.includes('lesson-declined');
  const supabase = {
    auth: { getSession: async () => ({ data: { session: { user: { id: state.me.id, email: state.me.email } } } }) },
    rpc: async (fn, args) => {
      state.rpcCalls.push([fn, args]);
      const deny = { data: null, error: { message: `${fn}: only the Governor reviews member lessons`, code: '42501' } };
      if (fn === 'member_lesson_queue') {
        if (!isGov()) return deny;
        return { data: state.rows.filter((r) => r.tags.includes('lesson') && !decided(r) && !r.governor), error: null };
      }
      if (fn === 'review_member_lesson') {
        if (!isGov()) return deny;
        const r = state.rows.find((x) => x.id === args.p_row);
        if (!r || decided(r)) return { data: null, error: { message: 'already decided' } };
        if (args.p_decision === 'decline' && !String(args.p_reason || '').trim()) return { data: null, error: { message: 'a decline needs a reason' } };
        const tag = args.p_decision === 'approve' ? 'lesson-approved' : 'lesson-declined';
        r.tags = [...r.tags, tag];
        r.review_reason = args.p_decision === 'decline' ? args.p_reason : null;
        return { data: { id: r.id, tag }, error: null };
      }
      return { data: null, error: { message: 'unknown rpc' } };
    },
    // A member's own rows only (the tightened read policy).
    from: () => {
      const f = { created_by: null };
      const api = {
        select: () => api, contains: () => api, order: () => api,
        eq: (col, v) => { if (col === 'created_by') f.created_by = v; return api; },
        limit: async () => ({ data: state.rows.filter((r) => r.created_by === f.created_by && r.created_by === state.me.id), error: null }),
      };
      return api;
    },
  };
  return { state, supabase };
});
vi.mock('../lib/supabase.js', () => ({ default: DB.supabase }));

import {
  memberOutcome, validateDecision, reviewMemberLesson, readerMayCapture, OUTCOME_LINES,
  READER_PROTOCOL_FOR_MEMBER_ROWS, APPROVED_TAG, DECLINED_TAG,
} from '../lib/member-lesson-review.js';
import { LESSON_NOTICE } from '../lib/one-voice-surfaces.js';
import MemberLessonQueue from '../components/MemberLessonQueue.jsx';
import LessonInbox from '../components/LessonInbox.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const MIG = read('infra/supabase/migrations-auto/0237-a-members-lesson-is-reviewed-by-the-governor-before-it-is-written.sql');

function seed() {
  DB.state.rows = [
    { id: 'r1', body: 'The contractor said two hours and it ran over to six', tags: ['lesson', 'mirrored'], created_by: 'ann', created_at: '2026-09-24T10:00:00Z', sender_name: 'Ann', source: 'church-one-voice' },
    { id: 'r2', body: 'My mother passed away last week', tags: ['lesson'], created_by: 'ben', created_at: '2026-09-24T11:00:00Z', sender_name: 'Ben', source: 'church-one-voice' },
  ];
  DB.state.rpcCalls = [];
}

let host;
async function mount(el) {
  host = document.createElement('div');
  document.body.appendChild(host);
  await act(async () => { createRoot(host).render(el); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  return host;
}
const $ = (sel) => host.querySelector(sel);
const $$ = (sel) => [...host.querySelectorAll(sel)];
const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
const typeInto = async (el, v) => {
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

// -----------------------------------------------------------------------------
describe('the Governor’s queue', () => {
  beforeEach(() => { seed(); DB.state.me = { id: 'gov', email: 'darrellpoe06@gmail.com' }; });

  it('lists each undecided member lesson: the words, the name, and what they were shown', async () => {
    await mount(<MemberLessonQueue signedIn />);
    const rows = $$('[data-testid="member-lesson-row"]');
    expect(rows.map((r) => r.getAttribute('data-row-id'))).toEqual(['r1', 'r2']);
    expect(rows[0].querySelector('[data-testid="member-lesson-sender"]').textContent).toBe('Ann');
    expect(rows[0].querySelector('[data-testid="member-lesson-words"]').textContent).toMatch(/two hours/);
    expect(rows[0].querySelector('[data-testid="member-lesson-shown"]').textContent).toMatch(/^Two Hours Became Six/);
  });

  it('Approve writes lesson-approved and the row leaves the queue', async () => {
    await mount(<MemberLessonQueue signedIn />);
    await click($('[data-row-id="r1"] [data-testid="member-lesson-approve"]'));
    expect(DB.state.rows.find((r) => r.id === 'r1').tags).toContain(APPROVED_TAG);
    expect(DB.state.rpcCalls).toContainEqual(['review_member_lesson', { p_row: 'r1', p_decision: 'approve', p_reason: null }]);
    expect($('[data-row-id="r1"]')).toBeNull();
  });

  it('Decline without a reason never leaves the page; with one it writes lesson-declined and the reason', async () => {
    await mount(<MemberLessonQueue signedIn />);
    await click($('[data-row-id="r2"] [data-testid="member-lesson-decline"]'));
    expect($('[data-row-id="r2"] [data-testid="member-lesson-error"]').textContent).toMatch(/needs a reason/);
    expect(DB.state.rpcCalls.filter(([fn]) => fn === 'review_member_lesson')).toEqual([]);
    await typeInto($('[data-row-id="r2"] [data-testid="member-lesson-reason"]'), 'Do Not Take a Death So Personal already teaches this');
    await click($('[data-row-id="r2"] [data-testid="member-lesson-decline"]'));
    const r2 = DB.state.rows.find((r) => r.id === 'r2');
    expect(r2.tags).toContain(DECLINED_TAG);
    expect(r2.review_reason).toBe('Do Not Take a Death So Personal already teaches this');
  });

  it('a member cannot open the queue: the database refuses and the surface says so', async () => {
    DB.state.me = { id: 'ann', email: 'ann@example.com' };
    await mount(<MemberLessonQueue signedIn />);
    expect($$('[data-testid="member-lesson-row"]').length).toBe(0);
    expect($('[data-testid="member-lesson-queue-closed"]').textContent).toMatch(/Only the Governor/);
    const res = await reviewMemberLesson({ supabase: DB.supabase, id: 'r1', decision: 'approve' });
    expect(res.ok).toBe(false);
    expect(DB.state.rows.find((r) => r.id === 'r1').tags).not.toContain(APPROVED_TAG);
  });

  it('the queue sits behind the Governor gate, and the database is the real gate (source pins)', () => {
    const projects = read('app/src/components/Projects.jsx');
    expect(projects).toMatch(/subView === 'governance' && isGovernor && \([\s\S]*?<MemberLessonQueue signedIn=\{!!currentUserId\} \/>[\s\S]*?<GovernanceQueue/);
    // Only the Governor opens the queue or decides.
    expect(MIG).toMatch(/member_lesson_queue\(\)[\s\S]*?IF NOT public\.is_lesson_governor\(\) THEN\s+RAISE EXCEPTION/);
    expect(MIG).toMatch(/review_member_lesson\(p_row uuid[\s\S]*?IF NOT public\.is_lesson_governor\(\) THEN\s+RAISE EXCEPTION/);
    // A decline needs a reason; a decided row is never decided again.
    expect(MIG).toMatch(/p_decision = 'decline' AND length\(btrim\(coalesce\(p_reason, ''\)\)\) = 0/);
    expect(MIG).toMatch(/v_tags \?\| array\['lesson-approved', 'lesson-declined'\][\s\S]*?already decided/);
    // A member reads only their own inbox rows.
    expect(MIG).toMatch(/CREATE POLICY agent_inbox_read ON agent_inbox FOR SELECT\s+USING \(created_by = auth\.uid\(\) AND/);
    // The smoke runs in the RLS matrix.
    expect(read(".github/workflows/rls-isolation.yml")).toMatch(/0127-sovereign-noise-and-thought\.sql 0237-a-members-lesson/);
  });
});

describe('the member sees the outcome on their own row', () => {
  beforeEach(() => { seed(); });

  it('approved: "being written, your name is not used"', async () => {
    DB.state.me = { id: 'ann', email: 'ann@example.com' };
    DB.state.rows[0].tags.push(APPROVED_TAG);
    await mount(<LessonInbox deps={{ supabase: DB.supabase }} />);
    expect($('[data-testid="lesson-review"]').textContent).toBe('Approved: a lesson is being written from your situation; your name is not used.');
  });

  it('declined: the reason, beside the lessons from the Word that already speak to it', async () => {
    DB.state.me = { id: 'ben', email: 'ben@example.com' };
    DB.state.rows[1].tags.push(DECLINED_TAG);
    DB.state.rows[1].review_reason = 'Do Not Take a Death So Personal already teaches this';
    await mount(<LessonInbox deps={{ supabase: DB.supabase }} />);
    expect($('[data-testid="lesson-review"]').textContent)
      .toBe('Not written as a new lesson: Do Not Take a Death So Personal already teaches this. These lessons from the Word already speak to it.');
    expect($$('[data-testid="situation-lesson"]')[0].getAttribute('data-lesson-id'))
      .toBe('ll162-do-not-take-a-death-so-personal-that-you-undermine-your-way-home-let-him-be-him');
  });

  it('undecided: waiting for review; and the Governor’s own lessons carry no review line', async () => {
    DB.state.me = { id: 'ann', email: 'ann@example.com' };
    await mount(<LessonInbox deps={{ supabase: DB.supabase }} />);
    expect($('[data-testid="lesson-review"]').textContent).toBe(OUTCOME_LINES.pending);
    DB.state.rows.push({ id: 'g1', body: 'Lesson. the yea', tags: ['lesson'], created_by: 'gov', created_at: '2026-09-24T12:00:00Z' });
    DB.state.me = { id: 'gov', email: 'darrellpoe06@gmail.com' };
    await mount(<LessonInbox deps={{ supabase: DB.supabase }} />);
    expect($('[data-testid="lesson-review"]')).toBeNull();
  });
});

describe('an undecided member row is never captured', () => {
  const GOV_IDS = ['gov'];
  it('the reader may capture a member row only when it is approved', () => {
    expect(readerMayCapture({ tags: ['lesson'], created_by: 'ann' }, { governorIds: GOV_IDS })).toBe(false);
    expect(readerMayCapture({ tags: ['lesson', DECLINED_TAG], created_by: 'ann' }, { governorIds: GOV_IDS })).toBe(false);
    expect(readerMayCapture({ tags: ['lesson', APPROVED_TAG], created_by: 'ann' }, { governorIds: GOV_IDS })).toBe(true);
    expect(readerMayCapture({ tags: ['lesson', APPROVED_TAG, 'lesson-captured'], created_by: 'ann' }, { governorIds: GOV_IDS })).toBe(false);
    expect(readerMayCapture({ tags: ['lesson'], created_by: 'gov' }, { governorIds: GOV_IDS })).toBe(true);
  });

  it('the protocol matches the notice the member read before sending', () => {
    const p = READER_PROTOCOL_FOR_MEMBER_ROWS.join(' ');
    expect(p).toMatch(/ONLY when its tags include "lesson-approved"/);
    expect(p).toMatch(/Never use the member’s name/);
    expect(p).toMatch(/Change every identifying detail/);
    expect(p).toMatch(/Keep the situation general/);
    expect(LESSON_NOTICE).toMatch(/Your name is never used, and personal details are changed/);
  });

  it('the decision reaches the reader: the NAS rider carries it to the hosted copy (source pin)', () => {
    const rider = read('infra/nas-lesson-voice/lesson_voice_transcribe.py');
    expect(rider).toMatch(/out\["review"\] = sync_reviews_once\(live\.list_reviewed_rows, hosted\.merge_tags, live\.add_tags\)/);
  });
});

describe('the pure pieces', () => {
  it('outcome lines, word for word', () => {
    expect(memberOutcome({ tags: ['lesson', APPROVED_TAG] }).line).toBe('Approved: a lesson is being written from your situation; your name is not used.');
    expect(memberOutcome({ tags: ['lesson', DECLINED_TAG], review_reason: 'x' }).state).toBe('declined');
    expect(memberOutcome({ tags: ['lesson'] }).state).toBe('pending');
  });
  it('a decline needs a reason', () => {
    expect(validateDecision('decline', ' ').ok).toBe(false);
    expect(validateDecision('decline', 'why').ok).toBe(true);
    expect(validateDecision('approve', '').ok).toBe(true);
    expect(validateDecision('maybe', 'x').ok).toBe(false);
  });
});
