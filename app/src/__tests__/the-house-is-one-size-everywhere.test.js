// =============================================================================
// The house is one size everywhere (DR-1185)
// =============================================================================
// Darrell, 2026-10-21, reading his own Economics lesson on his phone and
// selecting the words: "Sorry it is 33,000 square feet... not 44,000 fix it..."
//
// COLG's building size was wrong in ELEVEN places — four reading bands, a big
// idea, a takeaway, a lesson body and a study note in infrastructure-class.js,
// two in economics-class.js, and the rate blurb in venue-rental.js that tells a
// renter how big the main church is. One wrong figure, repeated eleven times,
// and nothing was checking it: the number is prose in every one of them, so
// there is no constant to import and nothing ever compared them.
//
// He found it by reading. This is what would have found it instead.
//
// WHY A GATE AND NOT A CONSTANT. The honest fix would be one exported figure
// that every surface reads — but these are static lesson bodies, sentences a
// reader meets, and a lesson body cannot interpolate. So the check is the next
// best thing and it is exact: whatever figure the house is given, it is given
// the SAME figure everywhere, and the superseded one never comes back.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Every square-footage figure applied to the church, with where it was found. */
function houseSizes() {
  const hits = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== '__tests__') walk(p); continue; }
      if (!/\.(js|jsx|json)$/.test(e.name)) continue;
      const src = readFileSync(p, 'utf8');
      // "33,000 sq ft" / "33,000-square-foot" / "33,000 square feet" / "33,000 sqft"
      const re = /(\d{2},\d{3})[\s-]*(?:sq\s?ft|sqft|square[\s-]foot|square[\s-]feet)/gi;
      let m;
      while ((m = re.exec(src)) !== null) hits.push({ figure: m[1], file: p.slice(SRC.length + 1) });
    }
  };
  walk(SRC);
  return hits;
}

describe('COLG’s building has one size, in every place a reader meets it', () => {
  it('is 33,000 square feet, as Darrell corrected it on 2026-10-21', () => {
    const hits = houseSizes();
    expect(hits.length).toBeGreaterThan(0);
    const figures = [...new Set(hits.map((h) => h.figure))];
    const where = hits.map((h) => `${h.figure} in ${h.file}`).join('\n');
    expect(figures, `the house is given more than one size:\n${where}`).toEqual(['33,000']);
  });

  it('never says 44,000 again — the figure he corrected', () => {
    // Eleven places carried it. Naming the superseded figure is what stops a
    // later copy-paste from an old lesson quietly restoring it.
    const hits = houseSizes().filter((h) => h.figure === '44,000');
    expect(hits.map((h) => h.file)).toEqual([]);
  });

  it('covers the places it was actually wrong, so this is not watching an empty room', () => {
    // A gate that matches nothing passes forever (DR-0076 §3). These three
    // files each carried the wrong figure; if a refactor moves the sentences
    // out of them, this case fails and someone re-points the gate rather than
    // leaving it green over nothing.
    const files = new Set(houseSizes().map((h) => h.file));
    expect([...files].some((f) => f.endsWith('infrastructure-class.js'))).toBe(true);
    expect([...files].some((f) => f.endsWith('economics-class.js'))).toBe(true);
    expect([...files].some((f) => f.endsWith('venue-rental.js'))).toBe(true);
  });
});
