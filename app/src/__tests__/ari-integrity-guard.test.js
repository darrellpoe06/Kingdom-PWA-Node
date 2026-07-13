// ari-integrity-guard — proven-to-catch (DR-0060/0076): Ari must FLAG the
// undermining pattern (re-asking settled work, either/or menus, un-evidenced
// "done") and PASS a confident, decision-first, evidence-backed reply.
import { describe, it, expect } from 'vitest';
import {
  scanUndermining, doneClaimNeedsEvidence, checkAriIntegrity, UNDERMINING_PATTERNS,
} from '../lib/ari-integrity-guard.js';

describe('ari-integrity-guard — Ari catches Claude undermining the work', () => {
  it('CATCHES re-asking permission for directed work', () => {
    for (const s of ['Should I proceed with the fold?', 'Want me to keep going?', 'That’s your call.', 'Say the word and I’ll build it.', 'Would you like me to fold in Practice?']) {
      expect(scanUndermining(s).clean, s).toBe(false);
    }
  });
  it('CATCHES scope-questioning what was already decided', () => {
    expect(scanUndermining('If "the TLC App" means all of those, that’s more scope — your call.').clean).toBe(false);
    expect(scanUndermining('That’s additional scope.').clean).toBe(false);
  });
  it('CATCHES an either/or menu on authorized work', () => {
    expect(scanUndermining('Which would you prefer?').clean).toBe(false);
    expect(scanUndermining('I can do A or B — tell me.').clean).toBe(false);
  });
  it('PASSES a confident, decision-first reply (no hedging)', () => {
    for (const s of [
      'The whole TLC app is accepted. Folding Practice in now.',
      'Built the module and verified it. Continuing with Inbound next.',
      'TLC Therapy Solutions is the real office; I’m packaging all three surfaces.',
    ]) {
      expect(scanUndermining(s).clean, s).toBe(true);
    }
  });

  it('DEMOTES an un-evidenced "done" claim; ACCEPTS one with evidence', () => {
    expect(doneClaimNeedsEvidence('Everything’s shipped, nothing pending.').ok).toBe(false);
    expect(doneClaimNeedsEvidence('It works and we’re done here.').ok).toBe(false);
    // With real evidence attached, the claim stands.
    expect(doneClaimNeedsEvidence('Done — full suite 5665 tests green, failed=0.').ok).toBe(true);
    expect(doneClaimNeedsEvidence('Shipped and verified: the run log shows applied=1 failed=0.').ok).toBe(true);
    // No completion claim at all => nothing to evidence.
    expect(doneClaimNeedsEvidence('Working on the fold.').ok).toBe(true);
  });

  it('checkAriIntegrity returns the concrete problems for Ari to block/rewrite', () => {
    const bad = checkAriIntegrity('Should I proceed? Everything is complete otherwise.');
    expect(bad.ok).toBe(false);
    expect(bad.problems.length).toBeGreaterThanOrEqual(1);
    const good = checkAriIntegrity('The whole TLC app is accepted. Folding Practice in now; suite is 5665 green.');
    expect(good.ok).toBe(true);
    expect(good.problems).toEqual([]);
  });

  it('is not vacuous — it defines real patterns', () => {
    expect(UNDERMINING_PATTERNS.length).toBeGreaterThanOrEqual(3);
    expect(scanUndermining('').clean).toBe(true); // empty is clean, not a crash
  });
});
