// @vitest-environment node
// Every lesson sends you deeper into the Word (DR-0734): the lessons on the
// same ground are derived from the verses each lesson stands on, never typed.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { anchorRefs, refKey, chapterKey, sharedGround, searchItOutFor, searchQuestions, searchItOutCoverage, SEARCH_IT_OUT_VERSE, SEARCH_IT_OUT_REVEALED, SEARCH_IT_OUT_AIM } from '../lib/search-it-out.js';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const verse = (b, c, v) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${b.replace(/ /g, '')}.json`), 'utf8')).chapters[c - 1][v - 1];

const A = { id: 'll1-a', title: 'A — First', anchor: { ref: 'Psalm 1:2; Joshua 1:8; Romans 12:2' } };
const B = { id: 'll2-b', title: 'B — Second', anchor: { ref: 'Joshua 1:8; Psalms 1:2' } };
const C = { id: 'll3-c', title: 'C — Third', anchor: { ref: 'Romans 12:1' } }; // same chapter only
const D = { id: 'll4-d', title: 'D — Fourth', anchor: { ref: 'Genesis 1:1' } };

describe('the ground a lesson stands on', () => {
  it('reads the anchor, normalizes Psalm to Psalms, and de-duplicates', () => {
    expect(refKey('Psalm 1:2')).toBe('Psalms 1:2');
    expect(anchorRefs(A)).toEqual(['Psalms 1:2', 'Joshua 1:8', 'Romans 12:2']);
    expect(anchorRefs({ anchor: { ref: 'John 3:16; John 3:16' } })).toEqual(['John 3:16']);
    expect(anchorRefs({})).toEqual([]);
    expect(chapterKey('Romans 12:2')).toBe('Romans 12');
  });
  it('finds the lessons on the same verses first, then the same chapter, never itself, never an unrelated lesson', () => {
    const next = sharedGround(A, [A, B, C, D]);
    expect(next.map((n) => n.id)).toEqual(['ll2-b', 'll3-c']);
    expect(next[0].shared).toEqual(['Joshua 1:8', 'Psalms 1:2']);
    expect(next[0].byVerse).toBe(true);
    expect(next[0].number).toBe(2);
    expect(next[1].shared).toEqual(['Romans 12']);
    expect(next[1].byVerse).toBe(false);
    expect(sharedGround(D, [A, B, C, D])).toEqual([]);
  });
  it('PROVEN TO CATCH: a lesson with no anchor links nowhere, and the limit holds', () => {
    expect(sharedGround({ id: 'x', title: 'x' }, [A, B])).toEqual([]);
    expect(sharedGround(A, [A, B, C, D], { limit: 1 })).toHaveLength(1);
  });
});

describe('what the part shows', () => {
  it('three questions built from the title, the next lessons, the aim, and the verses', () => {
    const s = searchItOutFor(A, [A, B, C, D]);
    expect(s.questions).toHaveLength(3);
    expect(s.questions[0]).toBe('What does A show you about Yahweh that you did not see before?');
    expect(s.questions[2]).toMatch(/which lesson below will you open next/);
    expect(s.next.map((n) => n.id)).toEqual(['ll2-b', 'll3-c']);
    expect(s.ground).toBe(3);
    expect(s.aim).toBe(SEARCH_IT_OUT_AIM);
    expect(s.verse).toBe(SEARCH_IT_OUT_VERSE);
    expect(s.revealed).toBe(SEARCH_IT_OUT_REVEALED);
    expect(searchQuestions('')[0]).toContain('this lesson');
  });
  it('every verse the surface quotes is the King James text, verbatim', () => {
    for (const v of [SEARCH_IT_OUT_VERSE, SEARCH_IT_OUT_REVEALED]) {
      const [, book, c, n] = /^(.+) (\d+):(\d+)$/.exec(v.ref);
      expect(v.text, v.ref).toBe(verse(book, Number(c), Number(n)));
    }
    expect(SEARCH_IT_OUT_AIM).not.toMatch(/\bGod\b/);
  });
});

describe('the catalog, measured (DR-0076): the number of linked lessons may only rise', () => {
  const courses = () => buildCatalogCourseDescriptors();
  const mods = (c) => (c.schedule || []).map((s) => s.module || s).filter((m) => m && (m.lesson || m.levels));
  it('every lesson stands on named verses, and at least 356 of them have another lesson in their course on the same ground (measured 2026-10-01: 356 of 595)', () => {
    let lessons = 0; let withAnchor = 0; let linked = 0;
    for (const c of courses()) { const r = searchItOutCoverage(mods(c)); lessons += r.lessons; withAnchor += r.withAnchor; linked += r.linked; }
    expect(lessons).toBeGreaterThanOrEqual(595);
    expect(withAnchor).toBe(lessons);
    expect(linked).toBeGreaterThanOrEqual(356);
  });
  it('in Living Lessons at least 200 of the lessons link onward (measured 2026-10-01: 200 of 203 before L206)', () => {
    const r = searchItOutCoverage(LIVING_LESSONS_MODULES);
    expect(r.lessons).toBeGreaterThanOrEqual(204);
    expect(r.linked).toBeGreaterThanOrEqual(201);
  });
});
