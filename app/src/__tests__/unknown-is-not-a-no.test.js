// @vitest-environment node
// =============================================================================
// A read that could not be made is NOT a no (DR-1053)
// =============================================================================
// Darrell, 2026-10-15, from his phone at The Love Corner. Two screenshots, an
// hour apart. The Choir tab: "This is the choir's space. Ask the choir director
// to add you to the roster." My Record: "Your record could not be opened.
// opening your record timed out after 15000 ms."
//
// The second one explains the first. A church read that never came back was
// printed on one surface as an honest dead end, and on the other as a sentence
// about whether he belongs.
//
// These cases pin three things:
//   1. the primitive — three-valued answers, and WHO SPOKE deciding what gets
//      asked again;
//   2. the combinator — that it cannot change who may see what, which is the
//      whole safety argument for touching eight access paths at once;
//   3. the guard — fed the ORIGINAL broken getChoirAccess body, it must find
//      it; fed the replacement, it must find nothing. A guard that cannot be
//      shown to catch its own defect is theater (DR-0076 §3).
import { describe, it, expect, vi } from 'vitest';
import {
  ask, askOnce, isTransient, knownOrUnavailable, reasonOf, sentenceFor,
  NO_ANSWER, REFUSED, ASK_TRIES, ASK_ATTEMPT_MS, ASK_BACKOFF_MS,
} from '../lib/church-access.js';
import { findDiscardedErrors, stripComments, ACCESS_RPCS } from '../../../scripts/unknown-is-not-a-no-guard.mjs';

const noSleep = () => Promise.resolve();

describe('the three-valued answer — a missing answer is its own thing', () => {
  it('an answer that arrived is ok, and carries the value', async () => {
    const a = await askOnce(() => Promise.resolve({ data: 'owner', error: null }));
    expect(a).toEqual({ ok: true, value: 'owner' });
  });

  it('data null with no error is a REAL answer of null, not a failure', async () => {
    // This matters: join_church_instance legitimately answers null for a person
    // with no church. That is an answer. It must not read as "we could not ask".
    const a = await askOnce(() => Promise.resolve({ data: null, error: null }));
    expect(a.ok).toBe(true);
    expect(a.value).toBe(null);
  });

  it('a server error is REFUSED — the server spoke', async () => {
    const a = await askOnce(() => Promise.resolve({ data: null, error: { message: 'no church to read' } }));
    expect(a.ok).toBe(false);
    expect(a.reason).toBe(REFUSED);
    expect(a.message).toBe('no church to read');
  });

  it('a throw is NO-ANSWER — nothing came back', async () => {
    const a = await askOnce(() => Promise.reject(new Error('Failed to fetch')));
    expect(a).toMatchObject({ ok: false, reason: NO_ANSWER });
  });

  it('a stall past the per-attempt ceiling is NO-ANSWER, not a hang', async () => {
    const a = await askOnce(() => new Promise(() => {}), { attemptMs: 10 });
    expect(a).toMatchObject({ ok: false, reason: NO_ANSWER });
    expect(a.message).toMatch(/no answer in 10 ms/);
  });
});

describe('what gets asked again, and what does not', () => {
  it('only a no-answer is transient', () => {
    expect(isTransient({ ok: false, reason: NO_ANSWER })).toBe(true);
    expect(isTransient({ ok: false, reason: REFUSED })).toBe(false);
    expect(isTransient({ ok: true, value: 'owner' })).toBe(false);
    expect(isTransient(null)).toBe(false);
  });

  it('THE DEFECT ITSELF: a first attempt that stalls no longer ends it', async () => {
    // This is Darrell's 15000 ms screenshot in one case. The old code asked
    // once; a stalled fetch on a phone was the whole answer.
    let n = 0;
    const call = vi.fn(() => {
      n += 1;
      return n === 1 ? Promise.reject(new Error('Failed to fetch')) : Promise.resolve({ data: 'owner', error: null });
    });
    const a = await ask(call, { sleep: noSleep });
    expect(a).toMatchObject({ ok: true, value: 'owner', attempts: 2 });
    expect(call).toHaveBeenCalledTimes(2);
  });

  it('a server that answered is NOT asked again — that only doubles the wait', async () => {
    const call = vi.fn(async () => ({ data: null, error: { message: 'that is not your church' } }));
    const a = await ask(call, { sleep: noSleep });
    expect(a).toMatchObject({ ok: false, reason: REFUSED, attempts: 1 });
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('three stalls admit we do not know, rather than claiming a no', async () => {
    const call = vi.fn(async () => { throw new Error('Load failed'); });
    const a = await ask(call, { sleep: noSleep });
    expect(call).toHaveBeenCalledTimes(ASK_TRIES);
    expect(a).toMatchObject({ ok: false, reason: NO_ANSWER, attempts: ASK_TRIES });
    expect(a.value, 'there is no value to read — the surface must branch on ok').toBeUndefined();
  });

  it('the patience it spends is not more than the one person already waited', () => {
    // The old My Record read was a single 15 s shot. Three attempts plus the
    // backoff must stay in the same neighbourhood, or the cure is a new
    // complaint.
    const budget = ASK_ATTEMPT_MS * ASK_TRIES + ASK_BACKOFF_MS.reduce((a, b) => a + b, 0);
    expect(budget).toBeLessThanOrEqual(17000);
    expect(ASK_TRIES).toBeGreaterThan(1);
  });
});

describe('knownOrUnavailable — it cannot change who may see what', () => {
  // THE SAFETY ARGUMENT for touching eight access paths in one merge: every
  // surface keeps its own deriveAccess, called with exactly the values it has
  // always been called with. This only decides whether we KNOW.
  const choirDerive = (role, inChoir) => {
    const canEdit = role === 'owner' || role === 'admin';
    return { canEdit, canSee: canEdit || !!inChoir };
  };

  it('when every answer arrived, the surface’s own verdict is returned verbatim', () => {
    const cases = [
      ['owner', false, { canSee: true, canEdit: true }],
      ['admin', false, { canSee: true, canEdit: true }],
      ['member', true, { canSee: true, canEdit: false }],
      ['member', false, { canSee: false, canEdit: false }],
      [null, false, { canSee: false, canEdit: false }],
      [null, true, { canSee: true, canEdit: false }],
    ];
    for (const [role, inChoir, want] of cases) {
      const got = knownOrUnavailable(
        [{ ok: true, value: role }, { ok: true, value: inChoir }], choirDerive);
      expect(got, `role=${role} inChoir=${inChoir}`).toMatchObject({ ...want, unavailable: false });
    }
  });

  it('derive is handed the SAME arguments it always got — no re-shaping', () => {
    const spy = vi.fn(() => ({ canSee: true, canEdit: true }));
    knownOrUnavailable([{ ok: true, value: 'owner' }, { ok: true, value: true }], spy);
    expect(spy).toHaveBeenCalledWith('owner', true);
  });

  it('PROVEN-TO-CATCH: one missing answer is unavailable, NOT a denial', () => {
    // The old code called deriveAccess(undefined, undefined) here and got
    // canSee:false — the screenshot.
    const got = knownOrUnavailable(
      [{ ok: false, reason: NO_ANSWER, message: 'Failed to fetch' }, { ok: true, value: true }], choirDerive);
    expect(got.unavailable).toBe(true);
    expect(got.canSee).toBe(false);
    expect(got.reason).toBe('unreachable');
    // And the surface must be able to tell the two apart, which is the point.
    expect(got.unavailable === true && got.canSee === false).toBe(true);
  });

  it('derive is never even called when an answer is missing', () => {
    const spy = vi.fn(() => ({ canSee: true, canEdit: true }));
    knownOrUnavailable([{ ok: false, reason: NO_ANSWER }], spy);
    expect(spy).not.toHaveBeenCalled();
  });

  it('a refusal and an unreachable read are distinguishable', () => {
    expect(reasonOf({ ok: false, reason: REFUSED })).toBe('refused');
    expect(reasonOf({ ok: false, reason: NO_ANSWER })).toBe('unreachable');
    expect(reasonOf({ ok: true, value: 1 })).toBe('answered');
  });
});

describe('what the person is told', () => {
  it('the unavailable sentence SAYS it is not a verdict about them', () => {
    const s = sentenceFor({ unavailable: true, reason: 'unreachable' });
    expect(s).toMatch(/not a statement about whether you are on this team/i);
    expect(s, 'never a stack trace on a church surface').not.toMatch(/fetch|undefined|null/i);
  });

  it('a known verdict gets no apology sentence at all', () => {
    expect(sentenceFor({ unavailable: false, canSee: false })).toBe('');
    expect(sentenceFor(null)).toBe('');
  });
});

describe('the guard is proven to catch the real defect', () => {
  // The ACTUAL body that shipped and produced Darrell's screenshot.
  const BROKEN = `
export async function getChoirAccess(displayName) {
  const tenantId = await churchInstanceId(displayName);
  const [{ data: role }, { data: inChoir }] = await Promise.all([
    supabase.rpc('user_role_in_instance', { tenant_uuid: tenantId }),
    supabase.rpc('user_in_choir', { instance_uuid: tenantId }),
  ]);
  const { canEdit, canSee } = deriveAccess(role, inChoir);
  return { signedIn: true, canSee, canEdit, tenantId, role: role ?? null };
}`;

  it('finds the shipped defect', () => {
    const hits = findDiscardedErrors(BROKEN, 'choir-sync.js');
    expect(hits.length).toBe(1);
    expect(hits[0].rpc).toBe('user_role_in_instance');
    expect(hits[0].line, 'a real line number, not a stripped index').toBe(4);
  });

  it('finds the single-call form too', () => {
    const one = "const { data: role } = await supabase.rpc('user_role_in_instance', { tenant_uuid: t });";
    expect(findDiscardedErrors(one, 'x.js').length).toBe(1);
  });

  it('passes the replacement', () => {
    const FIXED = `
  const [roleAnswer, choirAnswer] = await Promise.all([
    askRole(tenantId),
    askPredicate('user_in_choir', { instance_uuid: tenantId }),
  ]);
  const verdict = knownOrUnavailable([roleAnswer, choirAnswer], deriveAccess);`;
    expect(findDiscardedErrors(FIXED, 'choir-sync.js')).toEqual([]);
  });

  it('passes a read that KEEPS its error', () => {
    const ok = "const { data, error } = await supabase.rpc('user_in_choir', { instance_uuid: t });";
    expect(findDiscardedErrors(ok, 'x.js')).toEqual([]);
  });

  it('does not fire on an RPC outside the access vocabulary', () => {
    const other = "const { data: songs } = await supabase.rpc('choir_songs_read', { instance_uuid: t });";
    expect(findDiscardedErrors(other, 'x.js')).toEqual([]);
  });

  it('does not fire on its own documentation of the defect', () => {
    // church-access.js quotes the broken body in its header on purpose. A guard
    // that flagged the record of what went wrong could never be kept green.
    const commented = BROKEN.split('\n').map((l) => `// ${l}`).join('\n');
    expect(findDiscardedErrors(commented, 'church-access.js')).toEqual([]);
    const blocked = `/*\n${BROKEN}\n*/`;
    expect(findDiscardedErrors(blocked, 'church-access.js')).toEqual([]);
  });

  it('stripComments keeps every line number intact', () => {
    const src = 'a\n// comment\n/* b\n c */\nd';
    expect(stripComments(src).split('\n').length).toBe(src.split('\n').length);
    expect(stripComments(src).split('\n')[4]).toBe('d');
  });

  it('the watched vocabulary covers the predicates that decide belonging', () => {
    for (const n of ['user_role_in_instance', 'user_in_choir', 'user_in_ministry', 'join_church_instance']) {
      expect(ACCESS_RPCS, `${n} decides whether a person is told they belong`).toContain(n);
    }
  });
});
