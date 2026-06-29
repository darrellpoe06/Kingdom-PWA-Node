import { describe, it, expect } from 'vitest';
import {
  parseRef, refsOverlap, mergeCrossRefs, appearancesFor, connectionsFor, relatedWeb,
} from '../lib/scripture-connections.js';

describe('scripture-connections — reference overlap', () => {
  it('parses book / chapter / verse range', () => {
    expect(parseRef('1 John 4:9-10')).toMatchObject({ book: '1 john', chapter: 4, v1: 9, v2: 10 });
    expect(parseRef('John 3:16')).toMatchObject({ book: 'john', chapter: 3, v1: 16, v2: 16 });
    expect(parseRef('John 3')).toMatchObject({ book: 'john', chapter: 3, v1: null });
  });

  it('overlaps same book+chapter when verse ranges intersect', () => {
    expect(refsOverlap('John 3:16', 'John 3:16-21')).toBe(true);
    expect(refsOverlap('John 3:16', 'John 3')).toBe(true); // chapter-level
    expect(refsOverlap('John 3:16', 'John 3:17')).toBe(false);
    expect(refsOverlap('John 3:16', 'John 4:24')).toBe(false);
    expect(refsOverlap('John 3:16', 'Romans 3:16')).toBe(false); // different book, same numbers
  });
});

describe('scripture-connections — cross-reference merge', () => {
  it('merges TSK (classic) + theme-overlap (curated), excludes self, dedupes', () => {
    const refs = mergeCrossRefs('John 3:16', { limit: 20 });
    const keys = refs.map((r) => r.ref);
    expect(keys).not.toContain('John 3:16');          // never itself
    expect(new Set(keys).size).toBe(keys.length);     // no dupes
    expect(keys).toContain('Romans 5:8');             // from TSK
    // a ref found by BOTH sources is labeled with both
    const both = refs.filter((r) => r.sources.length > 1);
    expect(Array.isArray(both)).toBe(true);
  });

  it('marks in-library cross-refs navigable with real KJV text, link-outs not', () => {
    const refs = mergeCrossRefs('John 3:16', { limit: 20 });
    const romans58 = refs.find((r) => r.ref === 'Romans 5:8');
    expect(romans58.navigable).toBe(true);
    expect(romans58.kjv).toBeTruthy();                // real verbatim text, not painted
    const range = refs.find((r) => r.ref === '1 John 4:9-10');
    if (range) { expect(range.navigable).toBe(false); expect(range.kjv).toBe(null); }
  });
});

describe('scripture-connections — appearances (injected real rows)', () => {
  const ctx = {
    sermons: [
      { id: 's1', title: 'For God So Loved', scriptureRef: 'John 3:16-17', speaker: 'Bishop Gwin', serviceDate: '2026-01-04' },
      { id: 's2', title: 'Unrelated', scriptureRef: 'Psalm 23:1' },
    ],
    lessons: [{ id: 'l1', title: 'The Perfect', anchor: { ref: 'Matthew 5:48; John 3:16' } }],
    songs: [{ id: 'g1', title: 'So Loved', scriptureRefs: ['John 3:16'] }],
  };

  it('finds where a passage appears across sermons / lessons / songs', () => {
    const a = appearancesFor('John 3:16', ctx);
    expect(a.sermons.map((s) => s.id)).toEqual(['s1']);
    expect(a.lessons.map((l) => l.id)).toEqual(['l1']);
    expect(a.songs.map((g) => g.id)).toEqual(['g1']);
    expect(a.total).toBe(3);
  });

  it('PROVEN-TO-CATCH: no injected rows -> empty, never fabricated', () => {
    const a = appearancesFor('John 3:16', {});
    expect(a.total).toBe(0);
  });
});

describe('scripture-connections — connectionsFor (the whole web)', () => {
  it('assembles text, themes, cross-refs, word study, study edition, appearances', () => {
    const c = connectionsFor('John 3:16', { sermons: [{ id: 's1', title: 'M', scriptureRef: 'John 3:16' }] });
    expect(c.ref).toBe('John 3:16');
    expect(c.text.kjv).toBeTruthy();
    expect(c.text.hasText).toBe(true);
    expect(c.themes.length).toBeGreaterThan(0);
    expect(c.counts.crossRefs).toBeGreaterThan(0);
    expect(c.wordStudy.some((w) => w.strongs === 'G25')).toBe(true); // from study-edition seed
    expect(c.studyEdition).toBeTruthy();
    expect(c.appearances.total).toBe(1);
    expect(c.sources.tsk.license).toBe('Public Domain');
  });

  it('relatedWeb returns navigable neighbours for graph walking', () => {
    const web = relatedWeb('John 3:16');
    expect(web.center).toBe('John 3:16');
    expect(web.nodes.every((n) => n.kjv)).toBe(true); // navigable => has text
  });
});
