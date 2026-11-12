// @vitest-environment node
// DR-1440: every crown verse is KJV, verbatim from the repository's own corpus (DR-0076). PROVEN TO CATCH below.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CROWN_VERSES } from '../lib/course-crowns.js';

const corpus = (book, chapter, verses) => {
  const d = JSON.parse(readFileSync(join(process.cwd(), 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const ch = d.chapters ? d.chapters[chapter - 1] : d[String(chapter)] || d[chapter - 1];
  const vs = ch && ch.verses ? ch.verses : ch;
  return verses.map((n) => { const x = Array.isArray(vs) ? vs[n - 1] : vs[String(n)]; return typeof x === 'object' ? x.text : x; }).join(' ');
};

describe('the crowns rest on the Word, quoted exactly (DR-1440)', () => {
  for (const [name, v] of Object.entries(CROWN_VERSES)) {
    it(`${name}: ${v.ref} matches the KJV corpus word for word`, () => {
      expect(v.text).toBe(corpus(v.book, v.chapter, v.verses));
    });
  }
  it('PROVEN TO CATCH: one changed word in a quotation fails', () => {
    const v = CROWN_VERSES.crown;
    expect(v.text.replace('crowned', 'blessed')).not.toBe(corpus(v.book, v.chapter, v.verses));
  });
  it('no quotation carries a substituted name (our voice says Yahweh; a quote never does, DR-0210)', () => {
    for (const v of Object.values(CROWN_VERSES)) expect(v.text).not.toMatch(/Yahweh/);
  });
});
