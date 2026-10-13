// @vitest-environment node
// EVERY PART OF A PRESENTED LESSON CARRIES THE LESSON'S OWN WORDS.
// =============================================================================
// Darrell, 2026-09-13, standing behind the pulpit on Part 3 of 9 of L142:
// "How can there be no presenters notes with all this content?!!! Why is the
// play button showing no actual meaning in that view of the lesson?!!! Context
// and competence is needed!!! Fix it!"
//
// He was reading a real failure, and it was measurable rather than a matter of
// taste. lessonPresentable attached notes to a scene ONLY when the run-of-show
// segment NAME matched one of four regexes. On L142 that left six of nine parts
// rendering the "No presenter notes for this one" card while the lesson held
// ~14,000 characters of authored teaching — and `module.lesson`, the single
// largest asset a lesson has, was never read by the adapter at all.
//
// WHY THIS FILE IS STRICT. A blank panel mid-sermon is not a cosmetic defect;
// it is the speaker's script missing at the moment he needs it. So the floor is
// pinned at ZERO blank scenes across the WHOLE corpus, not just the lesson that
// exposed it, and the routing is pinned as TOTAL (no section may be dropped on
// the way to a part) and ORDER-PRESERVING (a later part may not teach an
// earlier section).
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { lessonPresentable, allocateSections, nameAffinity } from '../lib/presentable.js';
import { lessonSections, lessonPoints, formatLessonText } from '../lib/lesson-format.js';

const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const L142 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll142-'));
const noteText = (n) => [n.heading || '', n.body || '', ...(Array.isArray(n.items) ? n.items : [])].join(' ');

describe('lessonSections — the lesson split into points WITH their prose', () => {
  it('reconstructs the lesson exactly, losing no character', () => {
    for (const m of LIVING_LESSONS_MODULES) {
      if (!m.lesson) continue;
      const rebuilt = norm(lessonSections(m.lesson)
        .map((s) => [s.heading, s.body].filter(Boolean).join(' ')).join(' '));
      expect(rebuilt, m.id).toBe(norm(m.lesson));
    }
  });
  it('gives each section the prose UNDER its heading, not just the heading', () => {
    const secs = lessonSections(L142.lesson);
    const method = secs.find((s) => /THE METHOD/.test(s.label));
    expect(method, 'L142 teaches a section called THE METHOD').toBeTruthy();
    expect(method.body.length).toBeGreaterThan(500);
    expect(norm(L142.lesson)).toContain(norm(method.body));
  });
  it('prose before the first heading is kept, not dropped', () => {
    const secs = lessonSections('Plain opening words with no heading. THE POINT. And then the teaching under it.');
    expect(secs[0].heading).toBe('');
    expect(secs[0].body).toContain('Plain opening words');
  });
});

describe('the ALL-CAPS heading that stands as its own sentence', () => {
  // The bug under "1 point for the whole lesson?! Very unlikely!!!" — the house's
  // commonest heading form closes with a full stop, sentences() cuts exactly
  // there, and the old detector needed punctuation followed by a space, so the
  // one form that could never be seen was the one most used.
  it('counts a standalone caps clause as a point', () => {
    const pts = lessonPoints('THE OCCASION. A friend set out his position plainly and it deserves an answer.');
    expect(pts.map((p) => p.label)).toContain('THE OCCASION');
  });
  it('does NOT count a caps line that heads nothing', () => {
    expect(lessonPoints('THEY LIE; HE DOES NOT.')).toEqual([]);
    expect(lessonPoints('A verse and then a shout. HE IS RISEN.')).toEqual([]);
  });
  it('does NOT count a caps run too long to be a heading', () => {
    const long = `${'WORD '.repeat(14)}ENDS.`;
    expect(lessonPoints(`${long} and then some ordinary prose follows here.`)).toEqual([]);
  });
  it('L142 makes its real points instead of one', () => {
    const labels = lessonPoints(L142.lesson).map((p) => p.label);
    expect(labels.length).toBeGreaterThanOrEqual(8);
    expect(labels).toContain('THE OCCASION');
    expect(labels.some((l) => /THE METHOD/.test(l))).toBe(true);
  });
  it('the corpus is no longer mostly point-less', () => {
    const counts = LIVING_LESSONS_MODULES.map((m) => lessonPoints(m.lesson || '').length);
    // Measured at the fix: 44 of 145 carry no authored point structure at all,
    // which is an honest zero (flowing narrative), not a detector failure. The
    // ceiling is what guards against the regression that produced 60.
    expect(counts.filter((c) => c === 0).length).toBeLessThanOrEqual(50);
    expect(counts.filter((c) => c <= 1).length).toBeLessThanOrEqual(55);
  });
  it('formatLessonText still rebuilds its input exactly', () => {
    for (const m of LIVING_LESSONS_MODULES) {
      if (!m.lesson) continue;
      const { items } = formatLessonText(m.lesson);
      expect(norm(items.map((i) => i.text).join(' ')), m.id).toBe(norm(m.lesson));
    }
  });
});

describe('allocateSections — total, ordered, and it fills the parts', () => {
  const secs = () => [
    { label: 'THE OCCASION', heading: 'THE OCCASION.', body: 'a' },
    { label: 'THE METHOD', heading: 'THE METHOD.', body: 'b' },
    { label: 'THE MIDDLE', heading: 'THE MIDDLE.', body: 'c' },
    { label: 'THE VERDICT', heading: 'THE VERDICT.', body: 'd' },
    { label: 'THE CLOSE', heading: 'THE CLOSE.', body: 'e' },
  ];
  it('every section lands on exactly one part', () => {
    const out = allocateSections(secs(), ['Open', 'The method', 'Middle bit', 'The verdict', 'Send-off']);
    expect(out.flat().length).toBe(5);
    expect(new Set(out.flat().map((s) => s.label)).size).toBe(5);
  });
  it('a later part never teaches an earlier section', () => {
    const list = secs();
    const out = allocateSections(list, ['Open', 'The method', 'Middle bit', 'The verdict', 'Send-off']);
    let high = -1;
    for (const group of out) {
      for (const sec of group) {
        const at = list.indexOf(sec);
        expect(at, 'sections must move forward through the deck').toBeGreaterThan(high);
        high = at;
      }
    }
  });
  it('spreads the unmatched sections instead of clumping them on one part', () => {
    // The first fix flowed every unmatched section to the nearest earlier
    // anchor, which put nine of eleven on two parts and left five blank — the
    // same defect in a new costume. This pins the spread.
    const out = allocateSections(secs(), ['One', 'Two', 'Three', 'Four', 'Five']);
    expect(out.filter((g) => g.length === 0).length).toBeLessThanOrEqual(1);
  });
  it('handles the degenerate inputs without throwing', () => {
    expect(allocateSections([], ['a', 'b'])).toEqual([[], []]);
    expect(allocateSections(secs(), [])).toEqual([]);
  });
  it('nameAffinity scores the author\'s own words, not stopwords', () => {
    expect(nameAffinity('The method', 'THE METHOD, BEFORE IT IS AIMED AT ANYBODY')).toBeGreaterThan(0.5);
    expect(nameAffinity('The method', 'THE FOUR PLANKS')).toBe(0);
    expect(nameAffinity('', 'anything')).toBe(0);
  });
});

describe('THE FLOOR — no presented part is ever blank', () => {
  it('not one scene in the whole corpus has zero presenter notes', () => {
    const blank = [];
    for (const m of LIVING_LESSONS_MODULES) {
      for (const sc of lessonPresentable(m, { level: 'senior' }).scenes) {
        if (!Array.isArray(sc.notes) || sc.notes.length === 0) blank.push(`${m.id} · ${sc.indexLabel}`);
      }
    }
    expect(blank, `blank presenter panels:\n  ${blank.slice(0, 12).join('\n  ')}`).toEqual([]);
  });
  it('holds at every age band, because a band switch must not empty the panel', () => {
    for (const level of ['child', 'teen', 'senior']) {
      for (const sc of lessonPresentable(L142, { level }).scenes) {
        expect(sc.notes.length, `${level} · ${sc.indexLabel}`).toBeGreaterThan(0);
      }
    }
  });
  it('the part named "The method" carries the lesson\'s own words on the method', () => {
    const sc = lessonPresentable(L142, { level: 'senior' }).scenes
      .find((x) => /the method/i.test(x.audience?.title || ''));
    expect(sc).toBeTruthy();
    const body = sc.notes.map(noteText).join(' ');
    expect(body.length).toBeGreaterThan(400);
    // and they are the LESSON's words, verbatim — not a summary of them
    const longest = sc.notes.map((n) => n.body || '').sort((a, b) => b.length - a.length)[0];
    expect(norm(L142.lesson)).toContain(norm(longest));
  });
  it('the lesson prose reaches the deck at all — it used to be dropped entirely', () => {
    const all = lessonPresentable(L142, { level: 'senior' }).scenes
      .flatMap((sc) => sc.notes.map((n) => n.body || '')).join(' ');
    const secs = lessonSections(L142.lesson).filter((s) => s.body.length > 200);
    expect(secs.length).toBeGreaterThan(3);
    for (const s of secs) expect(norm(all), s.label).toContain(norm(s.body));
  });
  it('notes never leak into what the room sees', () => {
    for (const sc of lessonPresentable(L142, { level: 'senior' }).scenes) {
      const audience = JSON.stringify(sc.audience || {});
      for (const n of sc.notes) {
        const body = String(n.body || '');
        if (body.length > 200) expect(audience.includes(body.slice(0, 120))).toBe(false);
      }
    }
  });
});
