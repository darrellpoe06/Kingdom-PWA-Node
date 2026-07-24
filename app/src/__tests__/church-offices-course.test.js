// =============================================================================
// church-offices-course tests — counted, never remembered (DR-0076/DR-0100):
// every occurrence figure the course teaches is RE-MEASURED here from the
// complete KJV corpus the app hosts; a drift between course and text FAILS CI.
// =============================================================================
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  OFFICE_COUNTS, CHURCH_OFFICES_META, CHURCH_OFFICES_MODULES,
  buildChurchOfficesSchedule, exportChurchOfficesCurriculumMarkdown,
} from '../lib/church-offices-course.js';
import BIBLE_INDEX from '../lib/bible-kjv-index.json';

const KJV_DIR = path.resolve(__dirname, '../../public/bible/kjv');

function measure(pattern) {
  const re = new RegExp(`\\b(?:${pattern})\\b`, 'g');
  let total = 0;
  let nt = 0;
  BIBLE_INDEX.forEach((book, i) => {
    const data = JSON.parse(fs.readFileSync(path.join(KJV_DIR, `${book.file}.json`), 'utf8'));
    for (const ch of data.chapters) {
      for (const v of ch) {
        const text = (typeof v === 'string' ? v : (v.text || v.t || '')).toLowerCase();
        const n = (text.match(re) || []).length;
        total += n;
        if (i >= 39) nt += n;
      }
    }
  });
  return { total, nt };
}

describe('OFFICE_COUNTS — re-measured from the whole hosted KJV', () => {
  for (const [term, c] of Object.entries(OFFICE_COUNTS)) {
    it(`"${term}" (${c.pattern}) really occurs ${c.total}x total / ${c.nt}x NT`, () => {
      expect(measure(c.pattern)).toEqual({ total: c.total, nt: c.nt });
    });
  }
});

describe('course integrity', () => {
  it('weeks matches the module count and every module is whole', () => {
    expect(CHURCH_OFFICES_META.weeks).toBe(CHURCH_OFFICES_MODULES.length);
    for (const m of CHURCH_OFFICES_MODULES) {
      expect(m.id).toMatch(/^co\d/);
      expect(m.bigIdea.length).toBeGreaterThan(100);
      expect(m.anchor.ref.length).toBeGreaterThan(5);
      expect(m.levels.teen.length).toBeGreaterThan(100);
      expect(m.levels.senior.length).toBeGreaterThan(100);
      expect(m.quiz.questions.length).toBeGreaterThan(0);
      for (const q of m.quiz.questions) expect(q.options[q.answer]).toBeTruthy();
    }
  });
  it('schedule rows number every lesson; the markdown export carries the measured-counts promise', () => {
    const rows = buildChurchOfficesSchedule();
    expect(rows.map((r) => r.week)).toEqual(rows.map((_, i) => i + 1));
    const md = exportChurchOfficesCurriculumMarkdown();
    expect(md).toContain('MEASURED');
    expect(md.length).toBeGreaterThan(4000);
  });
  it('the deacon and evangelist teaching states the exact measured footprints', () => {
    const deacon = CHURCH_OFFICES_MODULES.find((m) => m.id === 'co2-deacon');
    expect(deacon.bigIdea).toContain('5 times');
    const five = CHURCH_OFFICES_MODULES.find((m) => m.id === 'co6-fivefold-and-body');
    expect(five.bigIdea).toContain('3 times');
    expect(five.bigIdea).toContain('490 times');
  });
});
