// DR-1677: a lesson's own numbered section leads become its paragraphs and chapters.
import { describe, it, expect } from 'vitest';
import { withSectionBreaks, sectionLeadOf } from '../components/learn-studio/lesson-sections.js';
import { readingTextFor } from '../components/learn-studio/LessonExperience.jsx';
import { lessonSectionPlan } from '../lib/lesson-format.js';
import { learnInventory } from '../lib/learn-presentation/integrity.js';

const LESSONS = learnInventory().flatMap((c) => c.lessons || []);
const chaptersOf = (text) =>
  text
    .split(/\n\n+/)
    .filter(Boolean)
    .map((p) => sectionLeadOf(p).lead)
    .filter(Boolean);
const HEB = LESSONS.find((l) => l.id && l.id.startsWith('ll136-touched-with-the-feeling'));

describe("the lesson's own sections are its chapters (DR-1677)", () => {
  it('the 55-minute High Priest lesson has its question and all twelve numbered sections as chapters, not one', () => {
    expect(HEB).toBeTruthy();
    const leads = chaptersOf(readingTextFor(HEB, 'adult'));
    for (const n of ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE']) {
      expect(leads.some((l) => l.startsWith(`${n}. `))).toBe(true);
    }
    expect(leads.find((l) => l.startsWith('FOUR. '))).toBe('FOUR. THEN HOW WAS HE TEMPTED AT ALL, IF THE WORD SAYS YAHWEH CANNOT BE?');
  });

  it('only whitespace is added: every lesson, every level, reads and speaks the same words', () => {
    let changed = 0;
    for (const l of LESSONS) {
      for (const t of [l.lesson, ...Object.values(l.levels || {})]) {
        if (typeof t !== 'string') continue;
        const out = withSectionBreaks(t);
        if (out !== t) changed += 1;
        expect(out.replace(/\s+/g, '')).toBe(t.replace(/\s+/g, ''));
      }
    }
    expect(changed).toBeGreaterThan(0);
  });

  it('lesson 140 has exactly the sections as the classic page counts', () => {
    const l140 = LESSONS.find((l) => l.id && l.id.startsWith('ll140-the-people-of-judah'));
    expect(l140).toBeTruthy();
    const leads = chaptersOf(withSectionBreaks(l140.lesson));
    expect(leads.length).toBe(lessonSectionPlan(l140.lesson).total); // the classic page's count
    expect(leads.length).toBeGreaterThan(5);
    expect(leads).toContain('KNOWN BY LOVE.');
    expect(leads[0]).toBe('THE QUESTION, WRITTEN OUT BEFORE IT IS ANSWERED.');
  });

  it('measured: how many lessons the change gives chapters to', () => {
    let gained = 0;
    let before1 = 0;
    for (const l of LESSONS) {
      const t = readingTextFor(l, 'adult');
      // Before: only a capitalised lead at the start of an author's paragraph was a chapter.
      const old = (x) => x.split(/\n\n+/).filter((p) => /^[A-Z][A-Z ,':-]{2,90}?\. /.test(p)).length;
      const a = old([l.lesson || ''].join(''));
      const b = chaptersOf(t).length;
      if (a <= 1) before1 += 1;
      if (b > a) gained += 1;
    }
    console.log(`lessons: ${LESSONS.length}; with at most one chapter before: ${before1}; gained chapters: ${gained}`);
    expect(gained).toBeGreaterThan(0);
  });
});
