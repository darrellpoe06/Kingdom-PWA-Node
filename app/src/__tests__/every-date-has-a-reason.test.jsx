// @vitest-environment jsdom
// =============================================================================
// every-date-has-a-reason — each book's date on the chart says why (DR-1410)
// =============================================================================
// Darrell 2026-11-10: "Also review them against knowledge of dates... research
// their standards so we have a reason to have the ones we have... make sense?"
// The chart's dates stay the photographed chart's; each now carries its reason:
// the Word's own marker (fixed or bounded), a reading of the book (inferred),
// or the plain fact that the Word gives none (silent). Every phrase a reason
// quotes is read back from the KJV on disk here.
// =============================================================================
import React, { act } from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PROGRESS_BASIS, BASIS_GRADES, DATING_STANDARD, basisLine } from '../lib/progress-of-revelation-basis.js';
import { PROGRESS_OF_REVELATION } from '../lib/progress-of-revelation.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { figuresFor } from '../lib/lesson-figures.js';
import LessonFigures from '../components/LessonFigures.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = {};
function verse(ref) {
  const m = /^(.+?) (\d+):(\d+)$/.exec(ref);
  if (!m) return null;
  const f = join(KJV, `${m[1].replace(/\s+/g, '')}.json`);
  if (!existsSync(f)) return null;
  cache[f] = cache[f] || JSON.parse(readFileSync(f, 'utf8'));
  const ch = cache[f].chapters[Number(m[2]) - 1];
  return ch ? ch[Number(m[3]) - 1] || null : null;
}
const faults = (basis) =>
  Object.entries(basis).flatMap(([book, b]) =>
    b.anchors.filter((x) => !(verse(x.ref) || '').includes(x.says)).map((x) => `${book}: ${x.ref} does not say "${x.says}"`)
  );

describe('every date on the chart has a reason', () => {
  it('all sixty-six books carry a reason, and no reason names a book the chart does not hold', () => {
    const books = PROGRESS_OF_REVELATION.map((r) => r.book);
    expect(books).toHaveLength(66);
    expect(books.filter((b) => !PROGRESS_BASIS[b])).toEqual([]);
    expect(Object.keys(PROGRESS_BASIS).filter((b) => !books.includes(b))).toEqual([]);
  });
  it('every reason is graded, and only a silent one may stand with no verse', () => {
    for (const [book, b] of Object.entries(PROGRESS_BASIS)) {
      expect(BASIS_GRADES, book).toContain(b.grade);
      expect(b.why.length, book).toBeGreaterThan(30);
      if (b.grade === 'fixed' || b.grade === 'bounded') expect(b.anchors.length, book).toBeGreaterThan(0);
    }
  });
  it('every phrase a reason quotes is the KJV on disk, word for word', () => {
    const n = Object.values(PROGRESS_BASIS).reduce((t, b) => t + b.anchors.length, 0);
    expect(n).toBeGreaterThanOrEqual(70);
    expect(faults(PROGRESS_BASIS)).toEqual([]);
  });
  it('PROVEN TO CATCH: one word changed in a reason’s phrase is named', () => {
    const broken = { Daniel: { ...PROGRESS_BASIS.Daniel, anchors: [{ ref: 'Daniel 10:1', says: 'In the fourth year of Cyrus king of Persia' }] } };
    expect(faults(broken)).toEqual(['Daniel: Daniel 10:1 does not say "In the fourth year of Cyrus king of Persia"']);
  });
  it('the books the Word gives no date are said to be silent, not dressed as dated', () => {
    const silent = Object.entries(PROGRESS_BASIS)
      .filter(([, b]) => b.grade === 'silent')
      .map(([k]) => k);
    expect(silent.sort()).toEqual(['Job', 'Joel', 'Obadiah']);
  });
  it('where the Word refines the chart, the reason says so', () => {
    expect(PROGRESS_BASIS.Jeremiah.note).toMatch(/561 BC/);
    expect(PROGRESS_BASIS.Zechariah.note).toMatch(/520 to 518 BC/);
    expect(DATING_STANDARD).toMatch(/1 Kings 6:1/);
  });
});

let root;
let host;
afterEach(() => {
  if (root) act(() => root.unmount());
  host?.remove();
  root = null;
});

describe('the reason is on screen under each book', () => {
  it('the Progress of Revelation chart shows each book’s reason beneath its bar', () => {
    const l270 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll270-'));
    expect(figuresFor(l270).map((f) => f.id)).toContain('progress-of-revelation');
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => root.render(React.createElement(LessonFigures, { module: l270 })));
    const lines = [...host.querySelectorAll('[data-testid="lesson-figure-basis"]')];
    expect(lines).toHaveLength(66);
    const daniel = host.querySelector('[data-row="Daniel"] [data-testid="lesson-figure-basis"]');
    expect(daniel.textContent).toBe(basisLine('Daniel'));
    expect(daniel.textContent).toMatch(/^The Word dates it: /);
    expect(host.querySelector('[data-row="Job"] [data-testid="lesson-figure-basis"]').textContent).toMatch(/^The Word gives no date: /);
  });
});
