// @vitest-environment node
// =============================================================================
// L207: THE FIGURES ARE RESEARCHED, NEVER WRITTEN OFF (DR-0100 / DR-0750)
// =============================================================================
// Darrell, 2026-10-02, reading L207 on his phone over "Not verified: the
// figures and claims about profits, productivity, pay and policy were spoken,
// not checked": "We are supposed to independently research those American
// policies...!!!!!" and "Why not!!!!!!!" The NAS writer runs with no web, so it
// could only flag the speaker's numbers; the research pass on the lane owes
// the sourced figures. This pins that every band carries them, that no band
// writes the speaker's numbers off, and that each figure names a source the
// witness workflow (lesson-sources-witness.yml) can fetch and read.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const ID = 'll207-the-worker-is-worthy-the-broken-deal-the-cry-yahweh-hears';
const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
const sources = JSON.parse(readFileSync(fileURLToPath(new URL('../lib/lesson-sources.json', import.meta.url)), 'utf8'));

describe('L207 states the researched figures in every band', () => {
  it('is in the series', () => { expect(m).toBeTruthy(); });
  it('youth, teen, senior and the lesson carry the three measured figures', () => {
    for (const text of [m.levels.youth, m.levels.teen, m.levels.senior, m.lesson]) {
      expect(text).toContain('86.5 percent');
      expect(text).toContain('31.7 percent');
      expect(text).toContain('38 percent');
      expect(text).toContain('11 percent');
      expect(text).toContain('290 times');
      expect(text).toContain('21 times');
    }
    expect(m.levels.child).toContain('290 times');
    expect(m.levels.child).toContain('one in ten');
    expect(m.inApp).toContain('86.5 percent');
    expect(m.facilitator.talkingPoints.join(' ')).toContain('290 times');
  });
  it('PROVEN-TO-CATCH: no band writes the speaker’s numbers off as unverified', () => {
    const all = [m.bigIdea, m.inApp, m.lesson, ...Object.values(m.levels), ...m.facilitator.talkingPoints].join('\n');
    expect(all).not.toMatch(/not (?:independently )?(?:verified|checked|examined)/i);
  });
  it('every figure names a source the witness can fetch', () => {
    const list = sources[ID];
    expect(Array.isArray(list) && list.length >= 4).toBe(true);
    for (const s of list) {
      expect(s.url).toMatch(/^https:\/\/(www\.)?(epi\.org|bls\.gov)\//);
      // Either the page says the figure in text the witness reads back, or the
      // entry says plainly that a person reads it (a chart the text layer
      // does not spell out) — never an unexplained empty check.
      if (!s.says.length) expect(s.note || '').toMatch(/read .*by a person/i);
      expect(s.read).toBe('2026-10-02');
      expect(s.claim.length).toBeGreaterThan(20);
    }
    expect(list.filter((s) => s.says.length).length).toBeGreaterThanOrEqual(3);
  });
});
