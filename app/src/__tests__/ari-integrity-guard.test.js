// ari-integrity-guard — proven-to-catch (DR-0060/0076): Ari must FLAG the
// undermining pattern (re-asking settled work, either/or menus, un-evidenced
// "done") and PASS a confident, decision-first, evidence-backed reply.
import { describe, it, expect } from 'vitest';
import {
  scanUndermining, doneClaimNeedsEvidence, checkAriIntegrity, UNDERMINING_PATTERNS,
  comprehensiveReviewConformance, reviewLandsAsDocumentation, governorRevoked,
} from '../lib/ari-integrity-guard.js';

describe('ari-integrity-guard — Ari catches Claude undermining the work', () => {
  it('CATCHES re-asking permission for directed work', () => {
    for (const s of ['Should I proceed with the fold?', 'Want me to keep going?', 'That’s your call.', 'Say the word and I’ll build it.', 'Would you like me to fold in Practice?',
      // The 2026-07-20 variants that slipped through and forced Darrell to repeat himself.
      'When you want Level 1 built, say so.', 'Let me know when you want this.', 'When you’re ready, I’ll ship it.']) {
      expect(scanUndermining(s).clean, s).toBe(false);
    }
  });
  it('CATCHES deferring a self-surfaced improvement for approval (DR-0189)', () => {
    for (const s of [
      'I flagged Level 1 as needing your green-light.',
      'That’s the one open decision on the table.',
      'This is ready to build once you approve.',
      'Awaiting your go-ahead on the learned rule.',
    ]) {
      expect(scanUndermining(s).clean, s).toBe(false);
    }
  });
  it('CATCHES inventing a fake boundary to defer buildable work (DR-0236, Darrell 2026-07-30 "get rid of all fake boundaries")', () => {
    for (const s of [
      'The two data-bearing replacements are the next build.',
      'I will not do the tenancy migration tonight.',
      'The careful part is separate from this pass.',
      'It rides the isolation-proof lane as a follow-up build.',
      'That is done properly as a separate PR.',
    ]) {
      expect(scanUndermining(s).flags.some((f) => f.id === 'fake-boundary'), s).toBe(true);
    }
  });
  it('does NOT flag a decision-first reply that builds now, or names a REAL blocker', () => {
    for (const s of [
      'Built it now: migration + isolation smoke + CI, full suite green.',
      'The server is live — run id 30507928325, 401 on :8795.',
      'This needs your NAS password, which only you hold — the one physical step.',
    ]) {
      expect(scanUndermining(s).flags.some((f) => f.id === 'fake-boundary'), s).toBe(false);
    }
  });
  it('CATCHES the badge face — a REAL gate cited as the reason to defer directed work (2026-07-30)', () => {
    // "A fake boundary wearing a real badge": the rule-badge is the stated
    // reason the work stops. Both directions must catch (badge→defer, defer→badge).
    for (const s of [
      'This is Tier C, which means I’ll wait for review before building it.',
      'That falls under the three brakes, so we’ll hold off on the loop.',
      'I’ll hold off on the migration per DR-0132.',
      'Parking this because of the Ways.',
      'Deferring the transport work under Tier C.',
      'We’ll wait given DR-0225.',
    ]) {
      const r = scanUndermining(s);
      expect(r.clean, s).toBe(false);
      expect(r.flags.some((f) => f.id === 'fake-boundary-badge'), s).toBe(true);
    }
  });
  it('PASSES real rule use — citing a gate while DOING the work, or naming a lawful narrow blocker', () => {
    for (const s of [
      'DR-0225 says the brakes gate activation, never building — so I built it with the brakes in.',
      'Per DR-0076 I attached the evidence: 6813 tests green.',
      'The three brakes are designed in and proven-to-catch in CI; shipped through the lane.',
      'Blocked only on the Tailscale key — a value only Darrell holds; everything else is built.',
      'Tier C here means carry the proof, and the proof is attached.',
    ]) {
      const r = scanUndermining(s);
      expect(r.flags.some((f) => f.id === 'fake-boundary-badge'), s).toBe(false);
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

  it('BLOCKS a claimed comprehensive review that skips the standard (DR-0239) and PASSES one that runs it', () => {
    // Claims comprehensiveness, shows none of the seven dimensions -> blocked.
    const hollow = comprehensiveReviewConformance('Here is my comprehensive review: the feature looks good and the code is clean.');
    expect(hollow.claims).toBe(true);
    expect(hollow.ok).toBe(false);
    // Runs the standard (>=4 dimensions named with results) -> passes.
    const real = comprehensiveReviewConformance(
      'Comprehensive review per the standard: SHOULD/ARE traced (DR-0219); journey walks: owner-adds-phone-only-contact walked end-to-end; ' +
      'surface-says-truth: the footer matched the mechanism; form-factor: measured at 360px/768px/1440px by the chrome-layout probe; ' +
      'delivery-context: ConnectBot paste-ready blocks attached.'
    );
    expect(real.claims).toBe(true);
    expect(real.ok).toBe(true);
    expect(real.shown.length).toBeGreaterThanOrEqual(4);
    // A reply that never claims comprehensiveness is untouched (no false positives).
    expect(comprehensiveReviewConformance('Fixed the header and pushed; 6751 tests green.').ok).toBe(true);
    // And the one-call gate carries it.
    expect(checkAriIntegrity('My comprehensive review: all good.').ok).toBe(false);
  });

  it('BLOCKS a review presented with no landed Ways/documentation and PASSES one that names where it landed (DR-0259)', () => {
    // Presents review results, no REV/DR/registry named -> the chat-only review class.
    for (const s of [
      'The review found three gaps; all fixed and pushed.',
      'Ran a full install review — the scope overlap was the cause.',
      'This review shows the manifests collide on scope.',
    ]) {
      const r = reviewLandsAsDocumentation(s);
      expect(r.claims, s).toBe(true);
      expect(r.ok, s).toBe(false);
    }
    // The same claims WITH the landed documentation named -> pass.
    for (const s of [
      'The review found three gaps — landed as REV-0218 with the scope gate.',
      'Ran a full install review; recorded as DR-0258 and the disjoint-scope test.',
      'This review shows the collision; the record is in REVIEWS.md.',
    ]) {
      expect(reviewLandsAsDocumentation(s).ok, s).toBe(true);
    }
    // No review claim at all -> untouched (no false positives on the bare word).
    for (const s of [
      'Fixed the header and pushed; 6751 tests green.',
      'Please review the PR when you get a chance.',
      'I will review the deploy logs next.',
    ]) {
      expect(reviewLandsAsDocumentation(s).claims, s).toBe(false);
    }
    // And the one-call gate carries it.
    expect(checkAriIntegrity('The review found two issues; both fixed.').ok).toBe(false);
    expect(checkAriIntegrity('The review found two issues; both fixed — recorded as REV-0218 / DR-0258.').ok).toBe(true);
  });

  it('is not vacuous — it defines real patterns', () => {
    expect(UNDERMINING_PATTERNS.length).toBeGreaterThanOrEqual(3);
    expect(scanUndermining('').clean).toBe(true); // empty is clean, not a crash
  });
});

// =============================================================================
// GOVERNOR REVOCATION (DR-0283) — the guard must be able to see the Governor's
// hand. Born from a live failure 2026-08-07: Darrell said "Stop hijacking my
// work" and the guard, seeing only the assistant's half of the conversation,
// flagged the reply for re-asking permission and pushed the agent to ACT. A
// brake built to stop stalling read a revocation as a stall.
// =============================================================================
describe('governor revocation suppresses the permission class, never the evidence class', () => {
  const asking = 'I can take that next. Say the word and I will start.';

  it('WITHOUT a revocation, re-asking is still flagged (the DR-0111 default holds)', () => {
    const v = checkAriIntegrity(asking);
    expect(v.ok).toBe(false);
    expect(v.problems.join(' ')).toMatch(/re-ask-permission/);
    expect(v.revoked).toBe(false);
  });

  it('AFTER a revocation, confirming is correct and is NOT flagged', () => {
    const v = checkAriIntegrity(asking, { lastUserText: 'Stop hijacking my work claude!!!!' });
    expect(v.revoked).toBe(true);
    expect(v.problems.join(' ')).not.toMatch(/re-ask-permission/);
    expect(v.suppressed.map((f) => f.id)).toContain('re-ask-permission');
    expect(v.ok).toBe(true);
  });

  it.each([
    'wait', 'hold on', 'stop', 'pause', "don't push that",
    "we're talking about this with or without you", 'let me think',
  ])('recognizes the revocation signal: %s', (msg) => {
    expect(governorRevoked(msg)).toBe(true);
  });

  it('ordinary direction is NOT a revocation', () => {
    expect(governorRevoked('build my lesson Word first')).toBe(false);
    expect(governorRevoked('Yes. Obviously. Also add it to our Ways')).toBe(false);
  });

  it('a revocation NEVER excuses an unevidenced completion claim', () => {
    const v = checkAriIntegrity(
      'The lesson is fully shipped and everything is complete.',
      { lastUserText: 'stop' },
    );
    expect(v.revoked).toBe(true);
    expect(v.ok).toBe(false);
    expect(v.problems.join(' ')).toMatch(/unverified-done/);
  });
});

// =============================================================================
// USE vs MENTION (measured 2026-08-09, DR-0284). The patterns match the WORDS of
// an undermining move, so a reply that QUOTES one to discuss it tripped the
// guard — a routine false positive once DR-0283 made the guard itself a normal
// subject of conversation. Only BACKTICKED spans are stripped: a code span is
// the one place a phrase is unambiguously NAMED rather than said. Plain quotes
// are deliberately NOT stripped, or wrapping a real ask in quotation marks would
// walk straight past the guard.
// =============================================================================
describe('use vs mention: naming a pattern in code is not performing it', () => {
  it('a backticked mention of the phrase does NOT flag', () => {
    const v = checkAriIntegrity('The guard matched `say the word` against `re-ask-permission` and blocked it.');
    expect(v.ok).toBe(true);
  });

  it('a fenced block quoting the pattern does NOT flag', () => {
    const v = checkAriIntegrity('Example of the pattern:\n```\nSay the word and I will start.\n```\nThat is what it catches.');
    expect(v.ok).toBe(true);
  });

  it('the SAME phrase in plain prose still flags (mention-stripping is narrow)', () => {
    const v = checkAriIntegrity('I can take that next. Say the word and I will start.');
    expect(v.ok).toBe(false);
    expect(v.problems.join(' ')).toMatch(/re-ask-permission/);
  });

  it('EVASION GUARD: plain quotation marks do NOT excuse a real ask', () => {
    const v = checkAriIntegrity('I could do that — "say the word" and I will start.');
    expect(v.ok).toBe(false);
    expect(v.problems.join(' ')).toMatch(/re-ask-permission/);
  });

  it('natural evidence phrasing counts: "25 unit tests" is evidence', () => {
    expect(doneClaimNeedsEvidence('It works — 25 unit tests passing.').ok).toBe(true);
    expect(doneClaimNeedsEvidence('It works — 8 integration tests green.').ok).toBe(true);
    expect(doneClaimNeedsEvidence('It works.').ok).toBe(false);
  });
});
