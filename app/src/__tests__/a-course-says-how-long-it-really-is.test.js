import { describe, it, expect } from 'vitest';
import { ECON_META, ECON_MODULES } from '../lib/economics-class.js';
import { INFRA_META, INFRA_MODULES } from '../lib/infrastructure-class.js';
import { SOVEREIGN_AI_META, SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { BROADCAST_META, BROADCAST_MODULES } from '../lib/broadcast-class.js';
import { SUCCESSION_META, SUCCESSION_MODULES } from '../lib/succession-class.js';
import { AI_LEGAL_BLUEPRINT_META, AI_LEGAL_BLUEPRINT_MODULES } from '../lib/ai-legal-blueprint-class.js';

// ===========================================================================
// A COURSE SAYS HOW LONG IT REALLY IS.
//
// `church-classes.js` renders a course's `meta.format` and then, two lines
// later, a `**Length:**` line counted from the modules themselves. So a
// hardcoded count in `format` does not merely go stale — it makes the SAME
// exported document contradict itself in adjacent lines.
//
// Measured 2026-10-27 across all six courses whose format states a count:
// five agreed with their module count; `sovereign-ai` said **9** while the
// course held **48**. Its own neighbouring comment (DR-0677) already said the
// count must never be "a literal a new lesson must edit" — and the literal sat
// two lines above that note, which is why nothing caught it.
//
// This asserts the property for every such course rather than for the one that
// was wrong, because the next course added is the one that will drift.
// ===========================================================================

const COURSES = [
  ['economics', ECON_META, ECON_MODULES],
  ['infrastructure', INFRA_META, INFRA_MODULES],
  ['sovereign-ai', SOVEREIGN_AI_META, SOVEREIGN_AI_MODULES],
  ['broadcast', BROADCAST_META, BROADCAST_MODULES],
  ['succession', SUCCESSION_META, SUCCESSION_MODULES],
  ['ai-legal-blueprint', AI_LEGAL_BLUEPRINT_META, AI_LEGAL_BLUEPRINT_MODULES],
];

/** The count a course's own format line claims, or null when it states none. */
export function statedSessions(format) {
  const m = /(\d+)\s+(?:weekly\s+)?sessions?/i.exec(String(format || ''));
  return m ? Number(m[1]) : null;
}

describe('a course says how long it really is', () => {
  it.each(COURSES)('%s: the format line matches the modules it has', (name, meta, modules) => {
    const said = statedSessions(meta.format);
    if (said === null) return; // A course may state no count at all; that is honest.
    expect(said, `${name} says ${said} sessions but holds ${modules.length}`).toBe(modules.length);
  });

  it('at least one course states a count, so this gate cannot pass vacuously', () => {
    // Without this, deleting every number from every format line would leave a
    // suite of silent early-returns reading green (DR-0076 §3).
    const stating = COURSES.filter(([, meta]) => statedSessions(meta.format) !== null);
    expect(stating.length).toBeGreaterThanOrEqual(5);
  });

  it('sovereign-ai derives the count rather than stating a literal', () => {
    // The specific regression: it read 9 against 48 real. Pin that it now
    // follows the array, by checking it reports the array's own length.
    expect(statedSessions(SOVEREIGN_AI_META.format)).toBe(SOVEREIGN_AI_MODULES.length);
    expect(SOVEREIGN_AI_META.weeks).toBe(SOVEREIGN_AI_MODULES.length);
  });

  it('reads a count out of each of the real phrasings in use', () => {
    // The courses do not word it alike, and a parser that silently matched none
    // of them would make every case above a no-op.
    expect(statedSessions('9 weekly sessions · ~75 min each')).toBe(9);
    expect(statedSessions('Self-paced or 8 sessions · ~75 min each')).toBe(8);
    expect(statedSessions('6 sessions · ~60 min each')).toBe(6);
    expect(statedSessions('no number here at all')).toBe(null);
  });
});
