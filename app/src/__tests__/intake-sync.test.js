// =============================================================================
// The outcome reaches the sender (DR-0625). Measured before this record: the
// board's read left the sender's own notes out (neq user_id) and listened to
// INSERT only, and the sender's local copy never changed after it was written,
// so no steward's triage and no fix ever reached the person who sent the note.
// The local id was `fb-<time>` while the database minted its own uuid, so the
// code the sender was handed was not the code the steward saw.
// supabase + synology-chat are mocked: a pure unit test, no network.
// =============================================================================
import { vi, describe, it, expect, beforeEach } from 'vitest';

let insertRows = [];
let resultQueue = [];
let selects = [];
let eqs = [];
function nextResult() {
  return resultQueue.length ? resultQueue.shift() : { error: null, data: [] };
}
function makeQuery() {
  const q = {
    insert: vi.fn((row) => { insertRows.push(row); return q; }),
    select: vi.fn((cols) => { selects.push(cols); return q; }),
    eq: vi.fn((k, v) => { eqs.push([k, v]); return q; }),
    neq: vi.fn(() => q),
    order: vi.fn(() => q),
    limit: vi.fn(() => q),
    then: (onF, onR) => Promise.resolve(nextResult()).then(onF, onR),
  };
  return q;
}

vi.mock('../lib/supabase.js', () => ({
  default: {
    from: vi.fn(() => makeQuery()),
    auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'u1', email: 'mom@example.com' } } } })) },
    rpc: vi.fn(async () => ({ data: 'instance-1', error: null })),
  },
}));
vi.mock('../lib/synology-chat.js', () => ({ postToChat: vi.fn(), formatFeedbackMessage: vi.fn((x) => x) }));

import supabase from '../lib/supabase.js';
import { uploadFeedback, fetchMyFeedback, newFeedbackId, isMissingColumn } from '../lib/feedback-sync.js';
import { setFeedbackTriage } from '../lib/feedback-loop.js';
import { normalizeMerges, fetchDeliveryRecord } from '../lib/github-ops.js';

beforeEach(() => { insertRows = []; resultQueue = []; selects = []; eqs = []; });

const UUID = '11111111-1111-4111-8111-111111111111';
const MISSING = { code: 'PGRST204', message: "Could not find the 'intake_category' column of 'feedback' in the schema cache" };

describe('one note, one reference code', () => {
  it('the device mints a real uuid', () => {
    expect(newFeedbackId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
  it('the upload writes that id, so the sender’s code is the steward’s code', async () => {
    await uploadFeedback({ id: UUID, whatsNot: 'typo on the bus page title' }, {});
    expect(insertRows[0].id).toBe(UUID);
  });
  it('a legacy local id is never sent as the row id', async () => {
    await uploadFeedback({ id: 'fb-123', whatsNot: 'typo on the bus page title' }, {});
    expect(insertRows[0].id).toBeUndefined();
  });
});

describe('the category is decided at birth, with its basis', () => {
  it('writes intake_category and intake_basis from the same rules', async () => {
    await uploadFeedback({ id: UUID, whatsNot: 'typo on the bus page title' }, {});
    expect(insertRows[0]).toMatchObject({ intake_category: 'fix', intake_basis: { kind: 'fix-rule', rule: 'wording' } });
  });
  it('a reply carries reply_to and goes to a person', async () => {
    await uploadFeedback({ id: UUID, replyTo: '22222222-2222-4222-8222-222222222222', whatsNot: 'it is still wrong for me' }, {});
    expect(insertRows[0]).toMatchObject({ reply_to: '22222222-2222-4222-8222-222222222222', intake_category: 'work', intake_basis: { kind: 'reply' } });
  });
  it('PROVEN TO CATCH: a database without 0235 still receives the note, without the new columns', async () => {
    resultQueue = [{ error: MISSING }, { error: null }];
    const res = await uploadFeedback({ id: UUID, whatsNot: 'typo on the bus page title' }, {});
    expect(res).toEqual({ uploaded: true });
    expect(insertRows).toHaveLength(2);
    expect(insertRows[1].intake_category).toBeUndefined();
    expect(insertRows[1].intake_basis).toBeUndefined();
    expect(insertRows[1].feedback_text).toMatch(/typo/);
  });
  it('a different missing column is NOT mistaken for ours', () => {
    expect(isMissingColumn(MISSING)).toBe(true);
    expect(isMissingColumn({ code: 'PGRST204', message: "Could not find the 'screenshots' column" })).toBe(false);
    expect(isMissingColumn({ code: '42501', message: 'permission denied' })).toBe(false);
    expect(isMissingColumn(null)).toBe(false);
  });
});

describe('the sender reads their own notes back, with outcomes', () => {
  it('reads by the signed-in person’s id, newest first, with the outcome columns', async () => {
    resultQueue = [{ error: null, data: [{ id: UUID, feedback_text: 'x', triage_status: 'fixed', outcome_note: 'Spelled right.', outcome_ref: '#9', user_id: 'u1', intake_category: 'fix' }] }];
    const r = await fetchMyFeedback();
    expect(r.ok).toBe(true);
    expect(eqs).toContainEqual(['user_id', 'u1']);
    expect(selects[0]).toMatch(/outcome_note/);
    expect(r.items[0]).toMatchObject({ id: UUID, mine: true, triageStatus: 'fixed', outcomeNote: 'Spelled right.', outcomeRef: '#9', userId: 'u1', intakeCategory: 'fix' });
  });
  it('falls back to the base columns on a database without 0235', async () => {
    resultQueue = [{ error: MISSING }, { error: null, data: [{ id: UUID, feedback_text: 'x', triage_status: 'new' }] }];
    const r = await fetchMyFeedback();
    expect(r.ok).toBe(true);
    expect(selects[1]).not.toMatch(/outcome_note/);
  });
  it('signed out or unreadable is said, never an empty answer pretending', async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });
    expect(await fetchMyFeedback()).toMatchObject({ ok: false, reason: 'signed-out' });
    resultQueue = [{ error: { message: 'boom' } }];
    expect(await fetchMyFeedback()).toMatchObject({ ok: false, reason: 'boom' });
  });
});

describe('a steward’s "Fixed" carries what changed and when', () => {
  const client = (results) => {
    const patches = [];
    const q = { eq: () => q, select: async () => results.shift() };
    return { patches, supabase: { from: () => ({ update: (p) => { patches.push(p); return q; } }) } };
  };
  it('writes outcome_note and outcome_at with the status', async () => {
    const c = client([{ data: [{ id: 'f1' }], error: null }]);
    const r = await setFeedbackTriage({ supabase: c.supabase, id: 'f1', status: 'fixed', notes: 'The bus title is spelled right.', nowMs: Date.parse('2026-09-24T20:00:00Z') });
    expect(r.ok).toBe(true);
    expect(c.patches[0]).toEqual({ triage_status: 'fixed', triage_notes: 'The bus title is spelled right.', outcome_note: 'The bus title is spelled right.', outcome_at: '2026-09-24T20:00:00.000Z' });
  });
  it('PROVEN TO CATCH: on a database without 0235 the status still lands', async () => {
    const c = client([{ data: null, error: { code: '42703', message: 'column feedback.outcome_at does not exist' } }, { data: [{ id: 'f1' }], error: null }]);
    const r = await setFeedbackTriage({ supabase: c.supabase, id: 'f1', status: 'fixed', notes: 'x' });
    expect(r.ok).toBe(true);
    expect(c.patches[1]).toEqual({ triage_status: 'fixed', triage_notes: 'x' });
  });
});

describe('the delivery record is read from real merged pull requests', () => {
  it('keeps only merged ones, five fields each', () => {
    const m = normalizeMerges([
      { number: 1, title: 'a', head: { ref: 'claude/x' }, created_at: '2026-09-24T00:00:00Z', merged_at: '2026-09-24T00:30:00Z', body: 'long' },
      { number: 2, title: 'b', head: { ref: 'claude/y' }, created_at: '2026-09-24T00:00:00Z', merged_at: null },
    ]);
    expect(m).toEqual([{ number: 1, title: 'a', branch: 'claude/x', createdAt: '2026-09-24T00:00:00Z', mergedAt: '2026-09-24T00:30:00Z' }]);
    expect(normalizeMerges(null)).toEqual([]);
  });
  it('a failed read is ok:false, never a painted window', async () => {
    expect(await fetchDeliveryRecord({ fetch: async () => ({ ok: false, status: 403 }) })).toMatchObject({ ok: false, notice: 'rate-limited' });
    expect(await fetchDeliveryRecord({ fetch: async () => { throw new Error('offline'); } })).toMatchObject({ ok: false, notice: 'offline' });
    const good = await fetchDeliveryRecord({ fetch: async () => ({ ok: true, json: async () => [{ number: 3, head: { ref: 'b' }, created_at: '2026-09-24T00:00:00Z', merged_at: '2026-09-24T01:00:00Z' }] }) });
    expect(good).toMatchObject({ ok: true, merges: [{ number: 3 }] });
  });
});
