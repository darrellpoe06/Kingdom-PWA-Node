// @vitest-environment node
// =============================================================================
// A proof restores what it breaks (DR-1207)
// =============================================================================
// MEASURED ON MY OWN FAILURE, 2026-10-22, while proving DR-1206's gate. Four
// breaks were run by hand; the first attempt restored each one with
// `git checkout <file>`, which reverted the uncommitted IMPLEMENTATION along
// with the break. Breaks 2, 3 and 4 then ran against a file with no feature in
// it, all three reported the same 13 failures, and I read three "catches" that
// were one unimplemented baseline. The only tell was the identical counts.
//
// Three proofs that proved nothing, and they looked exactly like proofs. So the
// restore step stops being hand-written. The cases below are weighted at what
// the tool REFUSES, because a prover that is lenient is worse than none: it
// launders a bad proof into a decision record, and the record is what the next
// session trusts.
import { describe, it, expect } from 'vitest';
import {
  occurrences, applyBreak, verdictOf, proveBreaks, sha256,
} from '../../../scripts/prove-it-catches.mjs';

// A fake tree + suite. `broken` decides whether the suite is red: it reads the
// file the same way a real check does, so a patch really does change the
// outcome rather than a flag being flipped by the test.
function fakeWorld({ files, isGreen }) {
  const tree = { ...files };
  const log = [];
  return {
    tree,
    log,
    read: (f) => tree[f],
    write: (f, t) => { tree[f] = t; },
    run: ({ phase }) => {
      const green = isGreen(tree);
      log.push(`${phase}:${green ? 'green' : 'red'}`);
      return green;
    },
  };
}

// The shape of a real pair: an implementation holding a feature, and a check
// that is green only while the feature is there.
const IMPL = 'export const road = (t) => research(t) || email(t);\n';
const GREEN_IF_FEATURE = (tree) => tree['impl.mjs'].includes('research(t)');

describe('occurrences / applyBreak — it never guesses which line to break', () => {
  it('finds every occurrence, and none for an empty needle', () => {
    expect(occurrences('a b a b a', 'a')).toEqual([0, 4, 8]);
    expect(occurrences('abc', '')).toEqual([]);
    expect(occurrences(null, 'a')).toEqual([]);
  });

  it('patches the one occurrence', () => {
    const out = applyBreak('keep A keep', { name: 'x', find: 'A', replace: 'B' });
    expect(out).toEqual({ ok: true, text: 'keep B keep' });
  });

  it('PROVEN-TO-CATCH: refuses a find string that is not there', () => {
    // A break that does not apply runs the suite twice and reports a catch it
    // never caused. This is the vacuous proof, and it must be refused loudly.
    const out = applyBreak(IMPL, { name: 'absent', find: 'no such code', replace: 'x' });
    expect(out.ok).toBe(false);
    expect(out.why).toMatch(/not in the file.*prove nothing/);
  });

  it('PROVEN-TO-CATCH: refuses a find string that appears twice', () => {
    const out = applyBreak('x = 1; y = 1;', { name: 'ambiguous', find: '= 1', replace: '= 2' });
    expect(out.ok).toBe(false);
    expect(out.why).toMatch(/appears 2 times/);
  });

  it('refuses a no-op break and a malformed one', () => {
    expect(applyBreak(IMPL, { find: 'road', replace: 'road' }).why).toMatch(/no-op/);
    expect(applyBreak(IMPL, { replace: 'x' }).why).toMatch(/no "find"/);
    expect(applyBreak(IMPL, { find: 'road' }).why).toMatch(/no "replace"/);
  });
});

describe('verdictOf — the three ways a proof fails, kept apart', () => {
  it('a proof is green before, red with the break, and restored', () => {
    expect(verdictOf({ baselineGreen: true, brokenRed: true, restored: true }).proved).toBe(true);
  });

  it('PROVEN-TO-CATCH: an already-red baseline proves nothing — THE failure this tool exists for', () => {
    const v = verdictOf({ baselineGreen: false, brokenRed: true, restored: true });
    expect(v.proved).toBe(false);
    expect(v.fatal, 'this is not a soft finding; the run is invalid').toBe(true);
    expect(v.reason).toMatch(/already RED before the break/);
  });

  it('a break that leaves the suite green is unproven, and that is a FINDING not an error', () => {
    const v = verdictOf({ baselineGreen: true, brokenRed: false, restored: true });
    expect(v.proved).toBe(false);
    expect(v.fatal, 'the check under test is at fault, not the run').toBe(false);
    expect(v.reason).toMatch(/does not catch it/);
  });

  it('a failed restore outranks everything else it could say', () => {
    const v = verdictOf({ baselineGreen: true, brokenRed: true, restored: false });
    expect(v.proved).toBe(false);
    expect(v.fatal).toBe(true);
    expect(v.reason).toMatch(/byte-identical/);
  });
});

describe('proveBreaks end to end on a fake tree', () => {
  const BREAK = { name: 'the road is never classified', file: 'impl.mjs', find: 'research(t) || ', replace: '' };

  it('proves a real break and leaves the file byte-identical', () => {
    const w = fakeWorld({ files: { 'impl.mjs': IMPL }, isGreen: GREEN_IF_FEATURE });
    const hashBefore = sha256(IMPL);
    const { ok, results } = proveBreaks({ breaks: [BREAK], ...w });
    expect(ok).toBe(true);
    expect(results[0].proved).toBe(true);
    expect(w.log, 'green first, then red with the break').toEqual(['baseline:green', 'broken:red']);
    expect(sha256(w.tree['impl.mjs']), 'the file came back exactly').toBe(hashBefore);
  });

  it('PROVEN-TO-CATCH: it replays my 2026-10-22 failure and refuses to call it a catch', () => {
    // The exact shape of the bad run: the restore reverts to a version with no
    // feature in it (what `git checkout` does to uncommitted work), so the next
    // break's baseline is red. By hand that read as a third catch. Here it is a
    // fatal, named refusal.
    const NO_FEATURE = 'export const road = (t) => email(t);\n';
    const w = fakeWorld({ files: { 'impl.mjs': NO_FEATURE }, isGreen: GREEN_IF_FEATURE });
    const { ok, results } = proveBreaks({ breaks: [{ ...BREAK, find: 'email(t)', replace: 'nothing()' }], ...w });
    expect(ok).toBe(false);
    expect(results[0].proved, 'the suite WAS red with the break in place — and it was red without it too').toBe(false);
    expect(results[0].reason).toMatch(/already RED before the break/);
  });

  it('PROVEN-TO-CATCH: a break the check does not catch is reported unproven, not quietly passed', () => {
    const w = fakeWorld({ files: { 'impl.mjs': IMPL }, isGreen: () => true });
    const { ok, results } = proveBreaks({ breaks: [BREAK], ...w });
    expect(ok).toBe(false);
    expect(results[0].reason).toMatch(/stayed GREEN/);
  });

  it('a restore that does not take is fatal and stops the run before the next break', () => {
    // A writer that silently drops the restore — a read-only file, a racing
    // process, a mount that lies. The run must not keep patching a tree it
    // cannot put back.
    const w = fakeWorld({ files: { 'impl.mjs': IMPL }, isGreen: GREEN_IF_FEATURE });
    let writes = 0;
    const write = (f, t) => { writes += 1; if (writes === 2) return; w.tree[f] = t; };
    const second = { name: 'second break, must not run', file: 'impl.mjs', find: 'road', replace: 'ROAD' };
    const { ok, results } = proveBreaks({ breaks: [BREAK, second], read: w.read, write, run: w.run });
    expect(ok).toBe(false);
    expect(results, 'the second break never ran').toHaveLength(1);
    expect(results[0].reason).toMatch(/did NOT come back byte-identical/);
  });

  it('a refused break does not stop the ones after it, because nothing was written', () => {
    const w = fakeWorld({ files: { 'impl.mjs': IMPL }, isGreen: GREEN_IF_FEATURE });
    const bad = { name: 'absent', file: 'impl.mjs', find: 'not here', replace: 'x' };
    const { ok, results } = proveBreaks({ breaks: [bad, BREAK], ...w });
    expect(ok, 'one refusal fails the run').toBe(false);
    expect(results).toHaveLength(2);
    expect(results[0].proved).toBe(false);
    expect(results[1].proved, 'the valid break still ran and still proved').toBe(true);
    expect(sha256(w.tree['impl.mjs'])).toBe(sha256(IMPL));
  });

  it('the baseline is measured for EVERY break, not once at the top', () => {
    // Two breaks, so four suite runs. If the baseline were hoisted, a tree that
    // went bad after break 1 would be read as a catch on break 2 — which is
    // precisely what happened by hand.
    const w = fakeWorld({ files: { 'impl.mjs': IMPL }, isGreen: GREEN_IF_FEATURE });
    const b2 = { name: 'second', file: 'impl.mjs', find: 'export const', replace: 'const' };
    proveBreaks({ breaks: [BREAK, b2], ...w });
    expect(w.log.filter((l) => l.startsWith('baseline')), 'one baseline per break').toHaveLength(2);
  });
});
