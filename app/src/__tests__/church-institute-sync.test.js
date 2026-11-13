// =============================================================================
// church-institute-sync — every door names the right table or RPC, refuses
// bad input before touching the network, and hands a surface the three-valued
// answer with the payload under its own name (DR-1460; ask() keeps `value`).
// =============================================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';

const calls = [];
let nextResult = { data: null, error: null };
function chain(table) {
  const c = { table, ops: [] };
  const self = new Proxy(
    {},
    {
      get(_, op) {
        if (op === 'then') return (res, rej) => Promise.resolve(nextResult).then(res, rej);
        return (...args) => {
          c.ops.push([op, ...args]);
          return self;
        };
      },
    }
  );
  calls.push(c);
  return self;
}
vi.mock('../lib/supabase.js', () => ({
  default: {
    from: (t) => chain(t),
    rpc: (name, args) => {
      calls.push({ rpc: name, args });
      return Promise.resolve(nextResult);
    },
  },
}));

const sync = await import('../lib/church-institute-sync.js');
const I = '00000000-0000-4000-b000-000000010325';
const U = '00000000-0000-4000-a000-0000000b0325';
const E = '00000000-0000-4000-c000-000000000001';
const fast = { sleep: async () => {} };

beforeEach(() => {
  calls.length = 0;
  nextResult = { data: null, error: null };
});

describe('refusals happen before the network', () => {
  it('each reader and writer refuses a missing key without a call and names its empty payload', async () => {
    expect(await sync.readInstituteSettings(null)).toMatchObject({ ok: false, reason: 'no-instance', settings: null });
    expect(await sync.readMyEnrollments(I, null)).toMatchObject({ ok: false, reason: 'signed-out', enrollments: [] });
    expect(await sync.applyToProgram(I, {})).toMatchObject({ ok: false, reason: 'bad-input', enrollment: null });
    expect(await sync.withdrawMyEnrollment('')).toMatchObject({ ok: false, reason: 'bad-input' });
    expect(await sync.readInstituteRoll(undefined)).toMatchObject({ ok: false, roll: [] });
    expect(await sync.setEnrollmentStatus(E, {})).toMatchObject({ ok: false, reason: 'bad-input' });
    expect(await sync.readAttendance(null)).toMatchObject({ ok: false, attendance: [] });
    expect(await sync.markAttendance(I, E, '')).toMatchObject({ ok: false, reason: 'bad-input' });
    expect(await sync.readCompletion(null)).toMatchObject({ ok: false, completion: null });
    expect(await sync.issueCredential(E, '   ')).toMatchObject({ ok: false, reason: 'bad-input', credential: null });
    expect(await sync.readMyCredentials(null)).toMatchObject({ ok: false, credentials: [] });
    expect(await sync.verifyCredential('')).toMatchObject({ ok: false, reason: 'bad-input', found: null });
    expect(calls).toHaveLength(0);
  });
});

describe('each door names its table or RPC and keeps the payload under its own name', () => {
  it('settings read from institute_settings by instance and arrive as `settings`', async () => {
    nextResult = { data: { instance_id: I, exemption_status: 'confirmed', enrollment_open: true }, error: null };
    const a = await sync.readInstituteSettings(I);
    expect(a.ok).toBe(true);
    expect(a.settings.enrollment_open).toBe(true);
    expect(calls[0].table).toBe('institute_settings');
    expect(calls[0].ops).toEqual(expect.arrayContaining([['eq', 'instance_id', I], ['maybeSingle']]));
  });
  it('saving settings upserts ONLY the office fields on the instance row', async () => {
    nextResult = { data: { instance_id: I }, error: null };
    await sync.saveInstituteSettings(I, { enrollment_open: true, attendance_floor: 2, instance_id: 'spoof', updated_by: 'spoof' });
    const up = calls[0].ops.find((o) => o[0] === 'upsert');
    expect(up[1]).toEqual({ instance_id: I, enrollment_open: true, attendance_floor: 2 });
    expect(up[2]).toEqual({ onConflict: 'instance_id' });
  });
  it('my enrollments read institute_enrollments for my user only; the office roll reads the instance', async () => {
    nextResult = { data: [{ id: E, status: 'applied' }], error: null };
    const m = await sync.readMyEnrollments(I, U);
    expect(m.enrollments).toHaveLength(1);
    expect(calls[0].table).toBe('institute_enrollments');
    expect(calls[0].ops).toEqual(
      expect.arrayContaining([
        ['eq', 'instance_id', I],
        ['eq', 'user_id', U],
      ])
    );
    const r = await sync.readInstituteRoll(I);
    expect(r.roll).toHaveLength(1);
    expect(calls[1].ops.some((o) => o[0] === 'eq' && o[1] === 'user_id')).toBe(false);
  });
  it('applying inserts my own row with the program and its course keys and never names a user_id', async () => {
    nextResult = { data: { id: E, status: 'applied' }, error: null };
    const a = await sync.applyToProgram(I, { programKey: 'ministry-leadership', programTitle: 'Ministry Leadership', courseKeys: ['church-offices'] });
    expect(a.ok).toBe(true);
    expect(a.enrollment.id).toBe(E);
    const ins = calls[0].ops.find((o) => o[0] === 'insert');
    expect(ins[1]).toEqual({
      instance_id: I,
      program_key: 'ministry-leadership',
      program_title: 'Ministry Leadership',
      course_keys: ['church-offices'],
      note: null,
    });
    expect('user_id' in ins[1]).toBe(false);
  });
  it('a refused application (the policy wall) comes back ok:false with the reason, not a throw', async () => {
    nextResult = { data: null, error: { message: 'new row violates row-level security policy' } };
    const a = await sync.applyToProgram(I, { programKey: 'x', programTitle: 'X' }, fast);
    expect(a.ok).toBe(false);
    expect(a.reason).toBe('refused');
    expect(sync.instituteSentence(a)).toContain('refused');
  });
  it('withdraw and the office status change update by enrollment id', async () => {
    nextResult = { data: { id: E, status: 'withdrawn' }, error: null };
    await sync.withdrawMyEnrollment(E);
    expect(calls[0].ops).toEqual(
      expect.arrayContaining([
        ['update', { status: 'withdrawn' }],
        ['eq', 'id', E],
      ])
    );
    await sync.setEnrollmentStatus(E, { status: 'accepted', cohortStart: '2027-01-10' });
    expect(calls[1].ops).toEqual(expect.arrayContaining([['update', { status: 'accepted', cohort_start: '2027-01-10' }]]));
  });
  it('attendance is read by enrollment and marked by upsert on (enrollment, date)', async () => {
    nextResult = { data: [{ session_date: '2026-11-17', present: true }], error: null };
    const r = await sync.readAttendance(E);
    expect(r.attendance).toHaveLength(1);
    expect(calls[0].table).toBe('institute_attendance');
    nextResult = { data: { id: 'x' }, error: null };
    await sync.markAttendance(I, E, '2026-11-17', true);
    const up = calls[1].ops.find((o) => o[0] === 'upsert');
    expect(up[1]).toEqual({ instance_id: I, enrollment_id: E, session_date: '2026-11-17', present: true });
    expect(up[2]).toEqual({ onConflict: 'enrollment_id,session_date' });
  });
  it('completion, issue and verify go through the three RPCs; verify upper-cases the code', async () => {
    nextResult = { data: { complete: false, present: 1, floor: 2, coursesMissing: ['church-offices'] }, error: null };
    const c = await sync.readCompletion(E);
    expect(c.completion.floor).toBe(2);
    expect(calls[0]).toEqual({ rpc: 'institute_completion', args: { p_enrollment: E } });
    nextResult = { data: { credentialNo: '2026-0001', verifyCode: 'ABCDEF0123' }, error: null };
    const k = await sync.issueCredential(E, '  Applicant A ');
    expect(k.credential.credentialNo).toBe('2026-0001');
    expect(calls[1]).toEqual({ rpc: 'institute_issue_credential', args: { p_enrollment: E, p_holder_name: 'Applicant A' } });
    nextResult = { data: null, error: null };
    const v = await sync.verifyCredential(' abcdef0123 ');
    expect(v).toMatchObject({ ok: true, found: null });
    expect(calls[2]).toEqual({ rpc: 'institute_verify_credential', args: { p_code: 'ABCDEF0123' } });
  });
  it('my credentials read institute_credentials for the instance (RLS keeps them mine)', async () => {
    nextResult = { data: [{ id: 'k', credential_no: '2026-0001' }], error: null };
    const a = await sync.readMyCredentials(I);
    expect(a.credentials[0].credential_no).toBe('2026-0001');
    expect(calls[0].table).toBe('institute_credentials');
  });
});

describe('instituteSentence says one plain sentence', () => {
  it('is empty for ok, and names the reason otherwise', () => {
    expect(sync.instituteSentence({ ok: true })).toBe('');
    expect(sync.instituteSentence({ ok: false, reason: 'signed-out' })).toBe('Sign in to see your applications.');
    expect(sync.instituteSentence({ ok: false, reason: 'no-answer', attempts: 3 })).toContain('after 3 tries');
    expect(sync.instituteSentence({ ok: false, reason: 'refused', message: 'nope' })).toBe("The office's wall refused it: nope.");
  });
});
