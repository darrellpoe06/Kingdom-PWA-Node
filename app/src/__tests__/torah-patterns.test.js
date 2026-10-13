// @vitest-environment node
// =============================================================================
// torah-patterns — the map is rigorous, or it does not ship.
// =============================================================================
// Darrell, 2026-09-08: "we want ALL of the visible patterns of these
// relationships so we can See!!!!" and then, setting the bar, "Rigorous
// analysis."
//
// A pattern map is exactly the kind of artifact that can look authoritative
// while quietly being someone's impressions with verse numbers attached. This
// gate makes each claim in the module header MECHANICAL:
//
//   1. Every ref resolves to real, non-empty KJV text in the in-repo corpus.
//   2. Every ref is inside the first five books — the span Darrell set.
//   3. The two tiers are never blurred: 'shown' patterns MUST carry a
//      confession marked as ours; 'named' patterns must NOT smuggle one in.
//   4. Books are DERIVED from refs, never typed (DR-0121).
//   5. Every derived count equals a real recount of the patterns.
//   6. Ids are unique; families and persons are declared, not invented.
//   7. No debate staged (DR-0098); adversary names stay lowercase (CLAUDE.md).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TORAH_PATTERNS, FAMILIES, PERSONS, TORAH_BOOKS,
  bookOfRef, booksOf, allRefs, patternsInFamily, familyCoverage,
  bookCoverage, personCoverage, enemyRoll, jointPatterns, allThreePatterns,
  confessedPatterns, reticentPatterns, mapSummary,
} from '../lib/torah-patterns.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');

// The corpus, addressable by book/chapter/verse — so a ref is checked against
// the ACTUAL verse it names, not merely found somewhere in the Bible.
const CORPUS = (() => {
  const byBook = new Map();
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json') && x !== 'index.json')) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (j && Array.isArray(j.chapters)) byBook.set(j.name, j.chapters);
  }
  return byBook;
})();

const verseText = (ref) => {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(String(ref).trim());
  if (!m) return null;
  const chapters = CORPUS.get(m[1].trim());
  if (!chapters) return null;
  return chapters[Number(m[2]) - 1]?.[Number(m[3]) - 1] ?? null;
};

describe('the corpus this gate measures against is really loaded', () => {
  it('all five books are present, with real text', () => {
    for (const b of TORAH_BOOKS) expect(CORPUS.has(b), `${b} missing from the in-repo corpus`).toBe(true);
    expect(verseText('Genesis 1:1')).toBe('In the beginning God created the heaven and the earth.');
  });
});

describe('every reference is real, and inside the span Darrell set', () => {
  it('every ref resolves to non-empty KJV text at exactly that address', () => {
    const bad = allRefs().filter((r) => {
      const t = verseText(r);
      return !t || !t.trim();
    });
    expect(bad, `refs that do not resolve:\n${bad.join('\n')}`).toEqual([]);
  });

  it('every ref is in Genesis through Deuteronomy — nothing imported', () => {
    const outside = [...new Set(allRefs().map(bookOfRef))].filter((b) => !TORAH_BOOKS.includes(b));
    expect(outside, `outside the first five books: ${outside.join(', ')}`).toEqual([]);
  });

  it('PROVEN-TO-CATCH — a ref outside the Torah, and one that does not resolve, are both detectable', () => {
    expect(TORAH_BOOKS.includes(bookOfRef('Isaiah 53:5'))).toBe(false);
    expect(verseText('Genesis 999:1')).toBeNull();
    expect(verseText('Genesis 1:999')).toBeNull();
  });

  it('the map is substantial — this is a map, not a sample', () => {
    expect(TORAH_PATTERNS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(allRefs()).size).toBeGreaterThanOrEqual(100);
  });
});

describe('the two tiers are never blurred — what the text NAMES vs what we READ', () => {
  it('every pattern declares a basis of exactly named or shown', () => {
    for (const p of TORAH_PATTERNS) {
      expect(['named', 'shown'], `${p.id} has basis ${p.basis}`).toContain(p.basis);
    }
  });

  it("a 'shown' pattern MUST carry our confession, marked as ours", () => {
    const missing = confessedPatterns().filter((p) => !p.confession || p.confession.length < 40);
    expect(missing.map((p) => p.id), 'shown patterns with no confession line').toEqual([]);
  });

  it("a 'named' pattern must NOT smuggle a confession in", () => {
    const smuggled = TORAH_PATTERNS.filter((p) => p.basis === 'named' && p.confession);
    expect(smuggled.map((p) => p.id), 'named patterns carrying a confession').toEqual([]);
  });

  it('each confession says plainly that the identification is ours', () => {
    for (const p of confessedPatterns()) {
      expect(p.confession, `${p.id} must mark the reading as ours`).toMatch(/\bour(s| reading| confession)\b|we read/i);
    }
  });

  it('both tiers are actually represented — the map is neither all-assertion nor all-hedge', () => {
    expect(TORAH_PATTERNS.filter((p) => p.basis === 'named').length).toBeGreaterThan(20);
    expect(confessedPatterns().length).toBeGreaterThan(3);
  });
});

describe('books are DERIVED from refs, never typed (DR-0121)', () => {
  it('no pattern carries a hand-typed books field', () => {
    const typed = TORAH_PATTERNS.filter((p) => 'books' in p);
    expect(typed.map((p) => p.id), 'patterns with a hand-typed books list').toEqual([]);
  });

  it('booksOf reads the refs, and keeps Torah order', () => {
    const p = { refs: ['Deuteronomy 6:4', 'Genesis 1:1', 'Numbers 24:17'] };
    expect(booksOf(p)).toEqual(['Genesis', 'Numbers', 'Deuteronomy']);
    expect(booksOf({ refs: [] })).toEqual([]);
  });

  it('every pattern derives at least one book from its own refs', () => {
    for (const p of TORAH_PATTERNS) {
      expect(booksOf(p).length, `${p.id} derives no book`).toBeGreaterThan(0);
    }
  });
});

describe('every number the surface shows is a real recount', () => {
  const s = mapSummary();

  it('the headline counts match a fresh count of the patterns', () => {
    expect(s.patterns).toBe(TORAH_PATTERNS.length);
    expect(s.refs).toBe(new Set(allRefs()).size);
    expect(s.named + s.shown).toBe(TORAH_PATTERNS.length);
    expect(s.enemies).toBe(new Set(TORAH_PATTERNS.filter((p) => p.enemy).map((p) => p.enemy)).size);
  });

  it('family counts sum to the whole map, with no pattern in an undeclared family', () => {
    const declared = new Set(FAMILIES.map((f) => f.id));
    for (const p of TORAH_PATTERNS) expect(declared, `${p.id} is in undeclared family ${p.family}`).toContain(p.family);
    expect(familyCoverage().reduce((n, f) => n + f.count, 0)).toBe(TORAH_PATTERNS.length);
  });

  it('book coverage counts patterns that really cite that book', () => {
    for (const row of bookCoverage()) {
      const recount = TORAH_PATTERNS.filter((p) => p.refs.some((r) => bookOfRef(r) === row.book)).length;
      expect(row.count, `${row.book} coverage`).toBe(recount);
    }
  });

  it('person coverage counts patterns that really list that Person', () => {
    const declared = new Set(PERSONS.map((x) => x.id));
    for (const p of TORAH_PATTERNS) {
      for (const id of p.persons || []) expect(declared, `${p.id} lists unknown person ${id}`).toContain(id);
    }
    for (const row of personCoverage()) {
      expect(row.count).toBe(TORAH_PATTERNS.filter((p) => (p.persons || []).includes(row.id)).length);
    }
  });

  it('the relationship views are real — two-or-more and all-three both populated', () => {
    expect(jointPatterns().every((p) => p.persons.length >= 2)).toBe(true);
    expect(allThreePatterns().every((p) => p.persons.length >= 3)).toBe(true);
    expect(allThreePatterns().length).toBeGreaterThan(3);
    expect(s.joint).toBe(jointPatterns().length);
    expect(s.allThree).toBe(allThreePatterns().length);
  });

  it('the enemy roll cannot list an enemy with no pattern behind it', () => {
    for (const row of enemyRoll()) {
      const behind = TORAH_PATTERNS.filter((p) => p.enemy === row.enemy);
      expect(behind.length, `${row.enemy} has no pattern`).toBe(row.count);
      expect(row.refs.length).toBeGreaterThan(0);
    }
  });
});

describe('structure holds', () => {
  it('ids are unique', () => {
    const ids = TORAH_PATTERNS.map((p) => p.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it('every pattern says what the text shows, substantially', () => {
    for (const p of TORAH_PATTERNS) {
      expect(p.name.length, `${p.id} name`).toBeGreaterThan(8);
      expect(p.shows.length, `${p.id} shows`).toBeGreaterThan(80);
      expect(Array.isArray(p.refs) && p.refs.length > 0, `${p.id} refs`).toBe(true);
    }
  });

  it('every pattern is anchored to a Person, an enemy, or both — nothing floats', () => {
    for (const p of TORAH_PATTERNS) {
      expect((p.persons || []).length > 0 || !!p.enemy, `${p.id} names neither a Person nor an enemy`).toBe(true);
    }
  });

  it('the families Darrell asked for are all present', () => {
    const ids = new Set(FAMILIES.map((f) => f.id));
    for (const need of ['plural', 'spirit', 'visible-one', 'seed', 'substitution', 'enemy-roll', 'enemy-method', 'joint', 'likeness', 'knowing']) {
      expect(ids, `family ${need} is missing`).toContain(need);
    }
    // The two families his mid-build questions created must carry real weight.
    expect(patternsInFamily('likeness').length).toBeGreaterThanOrEqual(5);
    expect(patternsInFamily('knowing').length).toBeGreaterThanOrEqual(5);
  });

  it('where the text is silent the map says so, rather than filling it (DR-0098)', () => {
    expect(reticentPatterns().length).toBeGreaterThan(0);
    for (const p of reticentPatterns()) expect(p.reticence.length).toBeGreaterThan(40);
    // Genesis 6 is the test case: named, not explained.
    const sons = TORAH_PATTERNS.find((p) => p.id === 'tp-enemy-sons-of-god');
    expect(sons.reticence).toBeTruthy();
  });
});

describe('the house rules this map is bound by', () => {
  const src = readFileSync(join(HERE, '..', 'lib', 'torah-patterns.js'), 'utf8');
  // Our authored prose = the module minus the KJV phrases it echoes in caps.
  const prose = TORAH_PATTERNS.flatMap((p) => [p.name, p.shows, p.confession || '', p.reticence || '']).join(' ');

  it('DR-0098 — the Word is taught, not a debate staged', () => {
    expect(/scholars (?:disagree|debate)|some (?:say|argue)|two views|you decide/i.test(prose)).toBe(false);
  });

  it('adversary and false-god names are never capitalized in our voice', () => {
    for (const bad of ['Satan', 'Lucifer', 'Baal', 'Baalpeor', 'Molech', 'Devil', 'Dragon']) {
      expect((prose.match(new RegExp(`\\b${bad}\\b`, 'g')) || []).length, bad).toBe(0);
    }
  });

  it('the module states its own rigour rules in its header, where a maintainer will read them', () => {
    expect(src).toMatch(/TWO TIERS, NEVER BLURRED/);
    expect(src).toMatch(/NOTHING OUTSIDE THE FIRST FIVE BOOKS/);
    expect(src).toMatch(/BOOKS ARE DERIVED, NEVER TYPED/);
    expect(src).toMatch(/WHERE THE TEXT IS RETICENT, WE STOP/);
  });
});
