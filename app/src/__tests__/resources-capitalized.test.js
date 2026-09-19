// resources-capitalized — DR-0530: Knowledge, Understanding, Wisdom, Love and
// Business Systems are Resources Yahweh supplies for the build, and our voice
// capitalizes them. Quoted Scripture never changes.
//
// WHY A GATE AND NOT A NOTE. The rule has two halves and they pull opposite
// ways: capitalize in OUR prose, never inside a QUOTE. A rule like that decays
// into a find-replace the first time someone is in a hurry, and a find-replace
// would corrupt the Word to decorate our own point — the inverse of WORD-FIRST.
// So the half that can be automated wrongly is the half that is machine-held.
//
// THE LOAD-BEARING FINDING (measured 2026-09-19): the bright line was ALREADY
// enforced, by machinery built for another purpose. scripture-provenance's
// `kjv-case` verdict fires on any quotation differing from the cited verse by
// case alone. Its ceiling is 9 and the measured actual is 9 — ZERO SLACK. A
// capital swept into a quoted verse raises the count to 10 and fails the build
// immediately. This test pins that zero-slack relationship, because the
// protection is worthless the moment someone raises the ceiling "to make room."

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');
const flat = (s) => s.replace(/\s+/g, ' ');

const CLAUDE_MD = flat(read('CLAUDE.md'));
const DR_PATH = 'docs/decisions/DR-0530-the-resources-are-capitalized-knowledge-understanding-wisdom-love.md';

const RESOURCES = ['Knowledge', 'Understanding', 'Wisdom', 'Love', 'Business Systems'];

describe('DR-0530 — the Resources rule is Layer 0, not a preference', () => {
  it('CLAUDE.md names every Resource, so a compacted session reloads them all', () => {
    // Layer 0 is what survives context compaction. A rule that lives only in a
    // DR is a rule the next session never reads before it writes.
    for (const r of RESOURCES) {
      expect(CLAUDE_MD, `Resource missing from CLAUDE.md: ${r}`).toContain(r);
    }
    expect(CLAUDE_MD).toMatch(/DR-0530/);
  });

  it('carries the build order, because the three are not synonyms', () => {
    // Proverbs 24:3-4 — Wisdom BUILDS, Understanding ESTABLISHES, Knowledge
    // FILLS. Losing the order collapses three Resources into one vague virtue.
    // Layer 0 carries the build order as a DECLARED PARAPHRASE ("cf."), not a
    // bare citation — CLAUDE.md forbids paraphrasing Scripture without saying
    // so, and the byte budget (DR-0245) will not carry the full quotation. The
    // verbatim text lives in DR-0530, asserted below.
    expect(CLAUDE_MD).toMatch(/Wisdom\*\* builds the house/);
    expect(CLAUDE_MD).toMatch(/Understanding\*\* establishes it/);
    expect(CLAUDE_MD).toMatch(/Knowledge\*\* fills the chambers with riches/);
    expect(CLAUDE_MD, 'a paraphrase in Layer 0 must declare itself').toMatch(/cf\. Proverbs 24:3-4/);
  });

  it('states the bright line: our voice only, never a quotation', () => {
    // Break: delete the bright-line sentence -> this fails. Without it the rule
    // reads as licence to sweep capitals through quoted Scripture.
    expect(CLAUDE_MD).toMatch(/never quoted Scripture/i);
    expect(CLAUDE_MD).toMatch(/never find-replace/i);
  });

  it('the decision record exists and is accepted', () => {
    expect(existsSync(join(repoRoot, DR_PATH))).toBe(true);
    const dr = read(DR_PATH);
    expect(dr).toMatch(/^id: DR-0530$/m);
    expect(dr).toMatch(/^status: accepted$/m);
    // The DR carries the VERBATIM verses the byte budget keeps out of Layer 0.
    expect(dr).toMatch(/Through wisdom is an house builded/);
    expect(dr).toMatch(/And I have filled him with the spirit of God/);
    expect(dr).toMatch(/My people are destroyed for lack of knowledge/);
  });
});

describe('the bright line is machine-held, with no room to hide a swept capital', () => {
  // scripture-provenance is the enforcing instrument. These assertions are
  // about ITS configuration, so that DR-0530's bright line cannot be quietly
  // defeated by loosening a number in another file.
  const provenance = read('app/src/__tests__/scripture-provenance.test.js');

  it('a case-only difference inside a quotation is still a failure class', () => {
    expect(provenance).toMatch(/'kjv-case'/);
    expect(provenance).toMatch(/case only/i);
  });

  it('the case ceiling has ZERO slack — measured actual equals the ceiling', () => {
    // Measured 2026-09-19 via scripts/scripture-provenance-audit.mjs:
    //   kjv-case 9, ceiling 9.
    // The 9 are the corpus's own recorded question (DR-0300), not lesson
    // defects. What matters here is the SLACK: at zero, the next case drift
    // fails. Raising this ceiling to absorb a sweep is the attack this pins.
    const m = provenance.match(/'kjv-case':\s*(\d+)/);
    expect(m, 'kjv-case ceiling not found in scripture-provenance').toBeTruthy();
    expect(
      Number(m[1]),
      'the kjv-case ceiling was raised; DR-0530 bright line loses its enforcement',
    ).toBeLessThanOrEqual(9);
  });
});
