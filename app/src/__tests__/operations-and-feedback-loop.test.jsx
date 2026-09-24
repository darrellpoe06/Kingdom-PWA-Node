// =============================================================================
// Phase 1b (PoeTech operations from existing workflows) and the feedback loop
// that now closes (DR-0616). Every signal proven-to-catch and proven-quiet;
// the loop's statuses are ones the database can hold, and the sender reads
// each one truthfully, the reason included.
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveOperations, INCIDENT_HOURS, REPEAT_OBSERVATIONS } from '../lib/operations-intelligence.js';
import { setFeedbackTriage, TRIAGE_STATES, reasonRequired } from '../lib/feedback-loop.js';
import { receiptStatus } from '../lib/feedback-receipt.js';
import { feedbackToConcernCards } from '../lib/concerns.js';
import OperationsIntelligence from '../components/OperationsIntelligence.jsx';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');
const NOW = Date.parse('2026-09-24T16:30:00Z');
const ops = (x) => deriveOperations({ nowMs: NOW, ...x });
const rec = (o) => ({ id: 'DR-0001', title: 't', status: 'accepted', chain: { reReview: '', missing: [] }, ...o });

describe('incident issues from the health probes', () => {
  const inc = (o) => ({ number: 7, title: 'site down', state: 'open', openedAt: '2026-09-23T10:00:00Z', observations: 1, ...o });
  it(`open ${INCIDENT_HOURS}h+ is an escalation; a fresh or closed one is quiet`, () => {
    expect(ops({ incidents: [inc()] }).escalations[0]).toMatchObject({ id: 'incident-7', kind: 'incident' });
    expect(ops({ incidents: [inc({ openedAt: '2026-09-24T15:00:00Z' })] }).escalations).toHaveLength(0);
    expect(ops({ incidents: [inc({ state: 'closed' })] }).escalations).toHaveLength(0);
  });
  it(`observed ${REPEAT_OBSERVATIONS}+ times is a repeated risk`, () => {
    expect(ops({ incidents: [inc({ observations: 5 })] }).risks[0]).toMatchObject({ count: 5 });
    expect(ops({ incidents: [inc({ observations: 2 })] }).risks).toHaveLength(0);
  });
  it('an unread incident ledger is not a zero: it is left out and the rest still reads', () => {
    const r = ops({ incidents: null, ledger: { ok: true, items: [rec()] } });
    expect(r.ok).toBe(true);
    expect(r.read.incidents).toBeUndefined();
    expect(r.sources.join()).not.toMatch(/incident/);
  });
});

describe('decision records', () => {
  it('a passed re-review is overdue; one due this week is due soon; a far one is quiet', () => {
    const r = ops({ ledger: { ok: true, items: [rec({ id: 'DR-1', chain: { reReview: '2026-09-01' } }), rec({ id: 'DR-2', chain: { reReview: '2026-09-28' } }), rec({ id: 'DR-3', chain: { reReview: '2026-12-01' } })] } });
    expect(r.timelineThreats.map((t) => t.id)).toEqual(['rr-DR-1', 'rr-DR-2']);
    expect(r.timelineThreats[0].why).toMatch(/passed 23 day/);
    expect(r.timelineThreats[1].why).toMatch(/in 4 day/);
  });
  it('a superseded record is never flagged', () => {
    expect(ops({ ledger: { ok: true, items: [rec({ status: 'superseded by DR-2', chain: { reReview: '2026-01-01' } })] } }).timelineThreats).toHaveLength(0);
  });
  it('only a record still "proposed" is a decision required (measured: heading-based flagging was false for 134 records)', () => {
    const r = ops({ ledger: { ok: true, items: [rec({ id: 'DR-9', status: 'proposed' }), rec({ id: 'DR-8', status: 'accepted (held for review)', chain: { missing: ['decision'] } })] } });
    expect(r.decisionsRequired.map((d) => d.id)).toEqual(['dc-DR-9']);
  });
});

describe('loops and hand-offs', () => {
  it('a hand-off open past the threshold escalates; a resolved one is quiet', () => {
    const h = (o) => ({ id: 'h1', kind: 'handoff', title: 'Send the deed', status: 'open', createdAt: '2026-08-01', ...o });
    expect(ops({ discussions: [h()] }).escalations[0]).toMatchObject({ id: 'handoff-h1', kind: 'handoff' });
    expect(ops({ discussions: [h({ status: 'resolved' })] }).escalations).toHaveLength(0);
    expect(ops({ discussions: [h({ createdAt: '2026-09-20' })] }).escalations).toHaveLength(0);
  });
  it('a loop is flagged only with a REAL last update past its limit', () => {
    const stale = ops({ loopData: { transactions: [{ date: '2026-06-01' }] } });
    expect(stale.escalations.some((e) => e.id === 'loop-ledger')).toBe(true);
    // Never-ran loops are not guessed at here.
    expect(ops({ loopData: {} }).escalations.filter((e) => e.kind === 'loop')).toHaveLength(0);
  });
  it('nothing readable says so, never a painted zero', () => {
    expect(ops({})).toMatchObject({ ok: false, reason: 'no operations signal could be read' });
  });
});

describe('the operations section on screen', () => {
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
  it('reads incidents through the OpsBoard reader and shows the sections', async () => {
    const deps = { fetchSiteHealth: vi.fn(async () => ({ ok: true, incidents: [{ number: 3, title: 'deploy stale', state: 'open', openedAt: '2026-09-22T00:00:00Z', observations: 4 }] })) };
    await mount(<OperationsIntelligence ledger={{ ok: true, items: [rec({ id: 'DR-5', status: 'proposed' })] }} deps={deps} nowMs={NOW} />);
    expect(container.querySelector('[data-testid="ops-escalations"]').textContent).toMatch(/deploy stale/);
    expect(container.querySelector('[data-testid="ops-risks"]').textContent).toMatch(/4 times/);
    expect(container.querySelector('[data-testid="ops-decisionsRequired"]').textContent).toMatch(/DR-5/);
  });
  it('a failed incident read is said, and the other signals still show', async () => {
    const deps = { fetchSiteHealth: async () => ({ ok: false, incidents: [], notice: 'GitHub API rate limit reached' }) };
    await mount(<OperationsIntelligence ledger={{ ok: true, items: [rec({ id: 'DR-5', status: 'proposed' })] }} deps={deps} nowMs={NOW} />);
    expect(container.querySelector('[data-testid="ops-incidents-unread"]').textContent).toMatch(/rate limit/);
    expect(container.querySelector('[data-testid="ops-decisionsRequired"]').textContent).toMatch(/DR-5/);
  });
  it('is mounted on Governance, beside and separate from the organization\'s readouts', () => {
    expect(read('app', 'src', 'components', 'Projects.jsx')).toMatch(/<OperationsIntelligence loopData=\{loopData\} loopEnv=\{\{ financialDocAt \}\} discussions=\{discussions\} feedback=\{feedback\} \/>/);
  });
});

describe('the feedback loop closes', () => {
  it('every status the loop writes is one the database allows (0233)', () => {
    const sql = read('infra', 'supabase', 'migrations-auto', '0233-a-feedback-note-can-be-in-progress-and-fixed.sql');
    for (const s of TRIAGE_STATES) expect(sql).toContain(`'${s.key}'`);
  });
  it('writes the status, and the reason where the sender is owed one', async () => {
    const calls = [];
    const q = { eq: () => q, select: async () => ({ data: [{ id: 'f1' }], error: null }) };
    const supabase = { from: () => ({ update: (patch) => { calls.push(patch); return q; } }) };
    expect(await setFeedbackTriage({ supabase, id: 'f1', status: 'declined', notes: 'Works as designed' })).toEqual({ ok: true, reason: '' });
    expect(calls[0]).toEqual({ triage_status: 'declined', triage_notes: 'Works as designed' });
    expect(reasonRequired('needs-info')).toBe(true);
    expect((await setFeedbackTriage({ supabase, id: 'f1', status: 'declined' })).reason).toMatch(/reason is required/);
    expect((await setFeedbackTriage({ supabase, id: 'f1', status: 'resolved' })).reason).toMatch(/unknown status/);
  });
  it('a write that changed no row is said, never reported as saved', async () => {
    const q = { eq: () => q, select: async () => ({ data: [], error: null }) };
    const supabase = { from: () => ({ update: () => q }) };
    expect((await setFeedbackTriage({ supabase, id: 'x', status: 'fixed' })).reason).toMatch(/no row changed/);
  });
  it('the sender reads each status truthfully, the reason word for word', () => {
    expect(receiptStatus({ id: 1, triageStatus: 'new' }).key).toBe('received');
    expect(receiptStatus({ id: 1, triageStatus: 'promoted' }).key).toBe('working');
    expect(receiptStatus({ id: 1, triageStatus: 'in-progress' }).key).toBe('working');
    expect(receiptStatus({ id: 1, triageStatus: 'fixed' }).key).toBe('fixed');
    const d = receiptStatus({ id: 1, triageStatus: 'declined', triageNotes: 'Works as designed' });
    expect(d).toMatchObject({ key: 'declined', reason: 'Works as designed' });
    expect(receiptStatus({ id: 1, triageStatus: 'needs-info', triageNotes: 'Which phone?' })).toMatchObject({ key: 'needs-info', reason: 'Which phone?' });
  });
  it('a fixed or declined note leaves the open concerns', () => {
    const cards = feedbackToConcernCards([{ id: 1, text: 'The giving page will not load', triageStatus: 'fixed' }, { id: 2, text: 'Add a dark mode please', triageStatus: 'declined' }, { id: 3, text: 'The roster is empty', triageStatus: 'new' }]);
    expect(cards.map((c) => c.status)).toEqual(['done', 'done', 'open']);
  });
  it('the steward\'s queue carries the moves, and promoting marks the note', () => {
    const src = read('app', 'src', 'components', 'FeedbackCenter.jsx');
    for (const label of ['Working on it', 'Fixed', 'Need more info', 'Decline']) expect(src).toContain(`label: '${label}'`);
    expect((src.match(/triage\(f, 'promoted'\);/g) || []).length).toBe(4);
    // The sender's reason now renders in the outcome list (DR-0622).
    expect(read('app', 'src', 'components', 'IntakeOutcomeList.jsx')).toMatch(/data-testid="receipt-reason"/);
    expect(read('app', 'src', 'lib', 'feedback-sync.js')).toMatch(/triageNotes: row\.triage_notes \|\| ''/);
  });
});
