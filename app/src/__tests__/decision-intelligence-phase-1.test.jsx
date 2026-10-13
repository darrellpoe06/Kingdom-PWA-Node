// =============================================================================
// Phase 1 of the Decision Intelligence Layer (DR-0612): the board reads board
// tasks, feedback and incidents; every new readout is proven-to-catch and
// proven-quiet; machine-written feedback and digit tokens stay out; the daily
// record writes once, reads back, and shows the trend; the wiring is pinned.
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveDecisionIntelligence, signatureOf, MACHINE_FEEDBACK, STALL_DAYS } from '../lib/decision-intelligence.js';
import { trendFor, todayIso, recordReadout, fetchReadouts } from '../lib/decision-readouts.js';
import DecisionIntelligence from '../components/DecisionIntelligence.jsx';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const NOW = Date.parse('2026-09-24T15:30:00Z');
const di = (x) => deriveDecisionIntelligence({ nowMs: NOW, ...x });
const T = (o) => ({ id: 't1', title: 'Pour the footings', status: 'not-started', owner: 'Sam', boardTitle: 'Building fund', dueDate: '', updatedAt: '2026-09-20', links: {}, ...o });
const I = (o) => ({ id: 'i1', description: 'Roof leak over the nursery', category: 'maintenance', status: 'open', dueDate: '', updatedAt: '2026-09-20', ...o });
const F = (o) => ({ id: 'f1', text: 'The giving page will not load on my phone', currentView: 'giving', triageStatus: 'new', createdAt: '2026-07-01', ...o });

describe('board tasks feed the readouts', () => {
  it('an open task with no owner is an ownership gap; an owned one is not', () => {
    expect(di({ boardTasks: [T({ owner: '' })] }).ownershipGaps.map((g) => g.id)).toEqual(['t1']);
    expect(di({ boardTasks: [T()] }).ownershipGaps).toHaveLength(0);
    expect(di({ boardTasks: [T({ owner: '', status: 'done' })] }).ownershipGaps).toHaveLength(0);
  });
  it('a passed due date is an escalation; a done task is quiet', () => {
    const r = di({ boardTasks: [T({ dueDate: '2026-09-10', status: 'in-progress' })] });
    expect(r.escalations[0]).toMatchObject({ id: 't1', kind: 'slipped', days: 14 });
    expect(di({ boardTasks: [T({ dueDate: '2026-09-10', status: 'done' })] }).escalations).toHaveLength(0);
  });
  it('blocked names a dependency; a named link to an open task waits on it', () => {
    expect(di({ boardTasks: [T({ status: 'blocked' })] }).dependencies[0].why).toMatch(/marked blocked/);
    const r = di({ boardTasks: [T({ links: { depends_on: ['t2'] } }), T({ id: 't2', title: 'Permit' })] });
    expect(r.dependencies[0]).toMatchObject({ id: 't1', waitsOn: 't2', waitsOnTitle: 'Permit' });
    const done = di({ boardTasks: [T({ links: { depends_on: ['t2'] } }), T({ id: 't2', status: 'done' })] });
    expect(done.dependencies).toHaveLength(0);
  });
  it('a not-started task due inside the window is a timeline threat', () => {
    expect(di({ boardTasks: [T({ dueDate: '2026-09-30' })] }).timelineThreats[0]).toMatchObject({ id: 't1', daysLeft: 6 });
    expect(di({ boardTasks: [T({ dueDate: '2026-09-30', status: 'in-progress' })] }).timelineThreats).toHaveLength(0);
    expect(di({ boardTasks: [T({ dueDate: '2026-12-30' })] }).timelineThreats).toHaveLength(0);
  });
  it('three stuck tasks on one board are a pattern; two are not', () => {
    const late = (id) => T({ id, dueDate: '2026-09-01' });
    expect(di({ boardTasks: [late('a'), late('b'), late('c')] }).patterns[0].title).toMatch(/3 tasks overdue or blocked on Building fund/);
    expect(di({ boardTasks: [late('a'), late('b')] }).patterns).toHaveLength(0);
  });
});

describe('incidents feed the readouts', () => {
  it('a passed due date escalates; a resolved incident is quiet', () => {
    expect(di({ incidents: [I({ dueDate: '2026-09-01' })] }).escalations[0]).toMatchObject({ id: 'i1', kind: 'slipped', days: 23 });
    expect(di({ incidents: [I({ dueDate: '2026-09-01', status: 'resolved' })] }).escalations).toHaveLength(0);
  });
  it('an open incident idle past the threshold escalates', () => {
    expect(di({ incidents: [I({ updatedAt: '2026-08-01' })] }).escalations[0].kind).toBe('idle');
    expect(di({ incidents: [I({ updatedAt: '2026-09-20' })] }).escalations).toHaveLength(0);
  });
  it('the same incident described twice is a repeated risk', () => {
    const r = di({ incidents: [I(), I({ id: 'i2' })] });
    expect(r.risks[0]).toMatchObject({ count: 2 });
  });
});

describe('feedback feeds the readouts, and only words people wrote', () => {
  it('untriaged feedback past the threshold is ONE escalation with its count', () => {
    const r = di({ feedback: [F(), F({ id: 'f2', text: 'Another thing' }), F({ id: 'f3', text: 'Fresh', createdAt: '2026-09-23' })] });
    const q = r.escalations.find((e) => e.id === 'feedback-triage');
    expect(q).toMatchObject({ count: 2, kind: 'queue' });
    expect(q.why).toMatch(new RegExp(`${STALL_DAYS}\\+ days`));
  });
  it('triaged feedback is not a queue', () => {
    expect(di({ feedback: [F({ triageStatus: 'reviewed' })] }).escalations).toHaveLength(0);
  });
  it('machine-written rows stay out (measured: 99 of 151 live rows)', () => {
    expect(MACHINE_FEEDBACK.test('[Learn engagement] band=adult signal=started course=x')).toBe(true);
    const r = di({ feedback: [F({ text: '[Learn engagement] band=adult signal=started' }), F({ id: 'f2', text: '[Learn engagement] band=child' })] });
    expect(r.ok).toBe(false);
    // A person's bracketed words still count.
    expect(MACHINE_FEEDBACK.test('[bug] the button is gone')).toBe(false);
  });
  it('a digit-bearing token never becomes a pattern word (ids, phone numbers, account names)', () => {
    expect(signatureOf('call 15636502416 about darrellpoe06 roofing roofing')).toBe('call+roofing');
    expect(signatureOf('call 15636502416 about darrellpoe06 roofing')).not.toMatch(/\d/);
  });
  it('the read line counts every kind', () => {
    const r = di({ boardTasks: [T()], feedback: [F()], incidents: [I()] });
    expect(r.read).toMatchObject({ boardTasks: 1, feedback: 1, incidents: 1 });
  });
});

describe('the daily record', () => {
  const rows = [
    { day: '2026-09-24', counts: { escalations: 31 } },
    { day: '2026-09-20', counts: { escalations: 28 } },
    { day: '2026-09-10', counts: { escalations: 40 } },
  ];
  it('compares with the most recent day BEFORE today', () => {
    expect(trendFor('escalations', rows, '2026-09-24', 31)).toEqual({ prev: 28, prevDay: '2026-09-20', delta: 3 });
    expect(trendFor('escalations', [rows[0]], '2026-09-24', 31)).toBeNull();
    expect(todayIso(NOW)).toBe('2026-09-24');
  });

  function fakeSb({ uid = 'u1', error = null, data = [] } = {}) {
    const calls = { upsert: [], select: [] };
    const q = { select: () => q, eq: () => q, order: () => q, limit: async () => ({ data, error }) };
    return {
      calls,
      auth: { getSession: async () => ({ data: { session: uid ? { user: { id: uid } } : null } }) },
      from: (t) => ({
        upsert: async (row, opts) => { calls.upsert.push({ t, row, opts }); return { error }; },
        select: (...a) => { calls.select.push({ t, a }); return q; },
      }),
    };
  }
  it('records today for the instance, as the signed-in user, upserting on instance + day', async () => {
    const sb = fakeSb();
    const res = await recordReadout({ supabase: sb, getInstanceId: async () => 'inst-1', counts: { escalations: 31, risks: 'x' }, read: { feedback: 52 }, nowMs: NOW });
    expect(res.ok).toBe(true);
    expect(sb.calls.upsert[0]).toMatchObject({ t: 'decision_readouts', opts: { onConflict: 'instance_id,day' } });
    expect(sb.calls.upsert[0].row).toMatchObject({ instance_id: 'inst-1', day: '2026-09-24', created_by: 'u1', read: { feedback: 52 } });
    expect(sb.calls.upsert[0].row.counts).toMatchObject({ escalations: 31, risks: 0, decisionsRequired: 0 });
  });
  it('signed out records nothing and says so', async () => {
    const sb = fakeSb({ uid: null });
    expect(await recordReadout({ supabase: sb, getInstanceId: async () => 'i', counts: {}, nowMs: NOW })).toEqual({ ok: false, reason: 'signed-out' });
    expect(sb.calls.upsert).toHaveLength(0);
  });
  it('a refused read says why, never an empty success', async () => {
    const res = await fetchReadouts({ supabase: fakeSb({ error: { message: 'denied' } }), getInstanceId: async () => 'i' });
    expect(res).toEqual({ ok: false, rows: [], reason: 'denied' });
  });
});

describe('the board on screen', () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  let container = null;
  let root = null;
  afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = null; container = null; });
  const mount = async (el) => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(el); });
  };
  const deps = (rows = []) => {
    const upsert = vi.fn(async () => ({ error: null }));
    const q = { select: () => q, eq: () => q, order: () => q, limit: async () => ({ data: rows, error: null }) };
    return {
      upsert,
      value: {
        supabase: { auth: { getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }) }, from: () => ({ upsert, select: () => q }) },
        getInstanceId: async () => 'inst-1',
      },
    };
  };

  it('reads all six kinds, records the day once, and shows the trend', async () => {
    const d = deps([{ day: '2026-09-20', counts: { escalations: 0 } }]);
    await mount(<DecisionIntelligence boardTasks={[T({ dueDate: '2026-09-10' })]} feedback={[F()]} incidents={[I()]} nowMs={NOW} deps={d.value} />);
    const text = container.textContent;
    expect(text).toMatch(/1 board tasks · 1 feedback · 1 incidents/);
    expect(d.upsert).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="di-trend-escalations"]').textContent).toMatch(/was 0 on 2026-09-20 \(\+2\)/);
  });
  it('says plainly when today is the first recorded day', async () => {
    const d = deps([]);
    await mount(<DecisionIntelligence boardTasks={[T()]} nowMs={NOW} deps={d.value} />);
    expect(container.querySelector('[data-testid="di-history"]').textContent).toMatch(/first day kept/);
  });
  it('a signed-out view writes nothing', async () => {
    const d = deps([]);
    await mount(<DecisionIntelligence boardTasks={[T()]} nowMs={NOW} deps={d.value} record={false} />);
    expect(d.upsert).not.toHaveBeenCalled();
  });
});

describe('the wiring is real (no loose connections)', () => {
  const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');
  it('Projects reads the boards and passes all three tables to the board', () => {
    const src = read('app', 'src', 'components', 'Projects.jsx');
    expect(src).toMatch(/const boardTasks = useBoardTasks\(\);/);
    expect(src).toMatch(/<DecisionIntelligence concerns=\{concerns\} projects=\{projects\} discussions=\{discussions\} boardTasks=\{boardTasks\} feedback=\{feedback\} incidents=\{incidents\} record=\{!!currentUserId\} \/>/);
  });
  it('the app passes its incidents into Projects', () => {
    expect(read('app', 'src', 'poe-financial-mvp-v28.jsx')).toMatch(/<ProjectsWrapper incidents=\{data\.incidents \|\| \[\]\}/);
  });
  it('the table is instance-scoped, one row per day, with a no-leak proof in the matrix', () => {
    const sql = read('infra', 'supabase', 'migrations-auto', '0230-the-board-keeps-a-daily-record-of-what-it-saw.sql');
    expect(sql).toMatch(/UNIQUE \(instance_id, day\)/);
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/created_by = auth\.uid\(\)/);
    expect(sql).toMatch(/GRANT SELECT, INSERT, UPDATE ON public\.decision_readouts TO authenticated/);
    expect(read('infra', 'supabase', 'tests', '0230-decision-readouts-smoke.sql')).toMatch(/LEAK: a non-member read another instance/);
    expect(read('.github', 'workflows', 'rls-isolation.yml')).toMatch(/smokes: "0230-decision-readouts-smoke\.sql"/);
  });
});
