// =============================================================================
// The World English Bible is really here, really the WEB, and really verbatim
// =============================================================================
// Darrell 2026-08-13: "yes ingest the WEB translation."
//
// He asked for the ESV. The ESV cannot be reproduced — `bible-editions.js` lists
// it EXCLUDED, "Copyrighted (Crossway)… never reproduce or base our text on it."
// The WEB is what the repo's own registry already pointed at: a PUBLIC DOMAIN
// modern-English revision of the ASV, licence-verified 2026-06-25 against primary
// sources. This gate exists because a Scripture corpus is the one asset where
// "looks about right" is worthless — a wrong or truncated text would be the Word
// mis-stated to a reader who trusts it.
//
// It checks four things a bad ingest would fail:
//   1. COMPLETE   — 66 books, every chapter, no book silently short.
//   2. REALLY WEB — the readings that DISTINGUISH the WEB from the KJV. Text that
//                   passed a generic "is it Bible" check but read like the KJV
//                   would mean the wrong corpus shipped under the WEB's name,
//                   which the trademark rule makes a real problem, not a typo.
//   3. VERBATIM   — no HTML, no footnote markers, no editorial headings folded
//                   into a verse, no double-spacing artifacts from the source.
//   4. HONEST     — the five references with no WEB text are recorded, not blank
//                   holes, and the count cannot quietly grow.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EDITIONS, editionById } from '../lib/bible-editions.js';

const WEB_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'bible', 'web');
const KJV_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'bible', 'kjv');
const idx = JSON.parse(readFileSync(join(WEB_DIR, 'index.json'), 'utf8'));
const book = (file) => JSON.parse(readFileSync(join(WEB_DIR, `${file}.json`), 'utf8'));
const verse = (file, c, v) => (book(file).chapters[c - 1] || [])[v - 1] || '';

describe('the corpus is complete', () => {
  it('66 books are on disk with a navigation index', () => {
    expect(Array.isArray(idx.books)).toBe(true);
    expect(idx.books).toHaveLength(66);
    for (const b of idx.books) {
      expect(existsSync(join(WEB_DIR, `${b.file}.json`)), `${b.name} missing`).toBe(true);
    }
  });

  it('book names and order match the KJV corpus exactly, so refs cannot drift', () => {
    const kjv = JSON.parse(readFileSync(join(KJV_DIR, 'index.json'), 'utf8'));
    expect(idx.books.map((b) => b.name)).toEqual(kjv.map((b) => b.name));
  });

  it('every chapter carries verses', () => {
    for (const b of idx.books) {
      expect(b.chapters.length, `${b.name} has no chapters`).toBeGreaterThan(0);
      for (const [i, n] of b.chapters.entries()) {
        expect(n, `${b.name} ${i + 1} has 0 verses`).toBeGreaterThan(0);
      }
    }
  });

  it('the whole Bible is present, not a sample', () => {
    const total = idx.books.reduce((n, b) => n + b.chapters.reduce((a, c) => a + c, 0), 0);
    expect(total).toBeGreaterThan(31000);
  });
});

describe('it is really the WEB, not the KJV under another name', () => {
  // Each of these is a place the two editions demonstrably differ. A corpus that
  // passed "is it Bible text" while failing these would be the wrong text
  // labelled WEB — and the trademark rule makes mislabelling a real problem.
  it('John 3:16 reads "one and only", not "only begotten"', () => {
    const t = verse('John', 3, 16);
    expect(t).toMatch(/one and only/i);
    expect(t).not.toMatch(/only begotten/i);
  });

  it('1 John 5:7 does NOT carry the Comma Johanneum (the KJV does)', () => {
    const t = verse('1John', 5, 7);
    expect(t).toMatch(/three who testify/i);
    expect(t).not.toMatch(/Father, the Word, and the Holy/i);
  });

  it('the divine name is rendered "Yahweh" where the KJV prints "the LORD"', () => {
    // The WEB's most visible distinctive, and the one this platform cares about
    // most (CLAUDE.md's covenant-name rule) — though inside a QUOTATION the text
    // is whatever the translation says, untouched either way.
    expect(verse('Psalms', 23, 1)).toMatch(/Yahweh/);
  });

  it('it is modern English — no thee/thou/saith in a sampled sweep', () => {
    for (const ref of [['John', 1, 1], ['Genesis', 1, 1], ['Romans', 8, 28], ['Matthew', 5, 3]]) {
      expect(verse(ref[0], ref[1], ref[2])).not.toMatch(/\b(thee|thou|thy|saith|hath)\b/i);
    }
  });
});

describe('the text is verbatim — nothing folded in, nothing marked up', () => {
  const sample = ['Genesis', 'Psalms', 'Isaiah', 'John', 'Romans', 'Revelation'];

  it('no HTML, footnote markers, or bracketed editorial insertions', () => {
    for (const f of sample) {
      for (const ch of book(f).chapters) {
        for (const t of ch) {
          expect(t, `${f}: markup leaked in`).not.toMatch(/<[^>]+>|\{[^}]*\}/);
        }
      }
    }
  });

  it('whitespace is normalized — the source ships trailing double spaces', () => {
    for (const f of sample) {
      for (const ch of book(f).chapters) {
        for (const t of ch) {
          if (!t) continue;
          expect(t).toBe(t.trim());
          expect(t, 'double spacing survived the ingest').not.toMatch(/ {2}/);
        }
      }
    }
  });

  it('poetry verses are WHOLE — split source lines are rejoined, not truncated', () => {
    // Psalms is the case that would break silently: one verse arrives as several
    // 'line text' entries, and assigning instead of appending would keep only the
    // last fragment. A short Psalm 119 is the signature of that bug.
    const ps = book('Psalms');
    const long = ps.chapters[118].filter((t) => t.length > 40).length;
    expect(long, 'Psalm 119 looks truncated — line fragments were not rejoined').toBeGreaterThan(150);
    expect(verse('Psalms', 23, 4)).toMatch(/valley of the shadow of death|darkest valley/i);
  });

  it('editorial section headings are not inside verses', () => {
    // The source carries 'header' entries; folding one in would put a heading
    // mid-verse. A verse starting with a bare title-case fragment then a capital
    // sentence is the tell — sampled on books that carry many headings.
    for (const f of ['Psalms', 'Isaiah']) {
      for (const ch of book(f).chapters) {
        for (const t of ch) {
          expect(t).not.toMatch(/^(BOOK|PSALM|Chapter)\s+[IVX0-9]+\s+[A-Z]/);
        }
      }
    }
  });
});

describe('the references with no WEB text are recorded, not holes', () => {
  it('the omissions are listed in the index', () => {
    expect(Array.isArray(idx.omissions)).toBe(true);
    expect(idx.omissions).toEqual([
      'Luke 17:36', 'Acts 8:37', 'Acts 15:34', 'Acts 24:7', 'Romans 16:25',
    ]);
  });

  it('four are Textus-Receptus-only verses the critical text omits', () => {
    for (const [f, c, v] of [['Luke', 17, 36], ['Acts', 8, 37], ['Acts', 15, 34], ['Acts', 24, 7]]) {
      expect(verse(f, c, v)).toBe('');
    }
  });

  it('Romans 16:25 is a VERSIFICATION difference — the doxology is at 14:24', () => {
    expect(verse('Romans', 16, 25)).toBe('');
    expect(verse('Romans', 14, 24), 'the doxology should be here in the WEB')
      .toMatch(/able to establish you/i);
  });

  it('the omission count cannot quietly grow into a broken parse', () => {
    expect(idx.omissions.length).toBeLessThanOrEqual(5);
  });
});

describe('the licence gate still holds for what we reproduce', () => {
  it('WEB is registered, public domain, and cleared to reproduce', () => {
    const web = editionById('WEB');
    expect(web).toBeTruthy();
    expect(web.reproduce).toBe(true);
    expect(web.license.free).toBe(true);
    expect(web.license.redistribute).toBe(true);
    expect(web.modernEnglish).toBe(true);
  });

  it('the trademark condition is recorded with the edition, not left to memory', () => {
    expect(editionById('WEB').note).toMatch(/trademark/i);
    expect(editionById('WEB').note).toMatch(/VERBATIM/);
  });

  it('nothing copyrighted became reproducible alongside it', () => {
    for (const e of EDITIONS) {
      if (e.reproduce) expect(e.license.free, `${e.id} reproduced without a free licence`).toBe(true);
    }
  });
});
