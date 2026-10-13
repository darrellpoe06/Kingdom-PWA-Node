// @vitest-environment node
// =============================================================================
// WHO HE IS — THE WHOLE WORD: the lessons by era (DR-0675, PR 2 of 3)
// =============================================================================
// Darrell, 2026-09-29: "We needed a lesson wide curriculum with all!!! ...
// Clarity clarification of where when what how timeless timelines and Who He
// Is!!!" The course walks the line one era per lesson. This file proves:
//   - every passage in the data sits in exactly ONE lesson's register, so the
//     curriculum holds all of them and none twice;
//   - every count a lesson states is the count the data gives (the prose is
//     built from the data, and the number words are pinned here);
//   - every quoted span is the KJV verse it names, and every quote carries its
//     reference;
//   - the four bands clear the house's band gates (full-levels, reading-level,
//     band-differentiation, title-in-narrative);
//   - our voice keeps the bindings, and each lesson ends the way this house ends.
import { describe, it, expect } from 'vitest';
import {
  WHO_HE_IS_MODULES, WHO_HE_IS_META, WHO_HE_IS_LESSON_SPECS, whoHeIsLessonFor, whoHeIsRegisterText,
  exportWhoHeIsCurriculumMarkdown, buildWhoHeIsSchedule,
} from '../lib/who-he-is-course.js';
import {
  WHO_HE_IS_ENTRIES, WHO_HE_IS_EDGE, registerFor, whoHeIsTotals, numberWords, readableRefs,
} from '../lib/who-he-is.js';
import { scanQuotedVerses, describeFault } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const M = WHO_HE_IS_MODULES;
const CLOSE = 'Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.';
const reg = (m) => registerFor(m.whoHeIs);

describe('the course is whole, and every passage is in exactly one lesson', () => {
  it('carries its lessons in order, each with every field and four authored bands', () => {
    expect(M.length).toBe(Object.keys(WHO_HE_IS_LESSON_SPECS).length);
    expect(WHO_HE_IS_META.weeks).toBe(M.length);
    expect(WHO_HE_IS_META.format).toContain(`${numberWords(M.length)} lessons`);
    M.forEach((m, k) => {
      expect(m.id.startsWith(`whohe${k + 1}-`), m.id).toBe(true);
      expect(typeof m.title === 'string' && m.title.length > 5, `${m.id} title`).toBe(true);
      for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f] === 'string' && m[f].length > 50, `${m.id} ${f}`).toBe(true);
      for (const b of FULL_BANDS) expect(typeof m.levels[b] === 'string' && m.levels[b].length > 200, `${m.id} ${b}`).toBe(true);
      expect(m.quiz.questions.length).toBeGreaterThanOrEqual(3);
      for (const q of m.quiz.questions) expect(q.answer >= 0 && q.answer < q.options.length, `${m.id} quiz`).toBe(true);
      expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(4);
      expect(m.benefits.length).toBeGreaterThanOrEqual(3);
      expect(m.whoHeIs, `${m.id} carries its register`).toBe(WHO_HE_IS_LESSON_SPECS[m.id]);
    });
    expect(buildWhoHeIsSchedule(null)).toHaveLength(M.length);
  });

  it('every passage sits in exactly one lesson’s own register: all of them, none twice', () => {
    const seen = new Map();
    for (const m of M) for (const e of reg(m).primary) seen.set(e.id, [...(seen.get(e.id) || []), m.id]);
    const missing = WHO_HE_IS_ENTRIES.filter((e) => !seen.has(e.id)).map((e) => e.ref);
    const twice = [...seen].filter(([, ids]) => ids.length > 1).map(([id]) => id);
    expect(missing, 'passages in no lesson').toEqual([]);
    expect(twice, 'passages in two lessons').toEqual([]);
    for (const e of WHO_HE_IS_ENTRIES) expect(whoHeIsLessonFor(e), e.ref).toBe(seen.get(e.id)[0]);
  });

  it('the first lesson carries the edge; the last two carry the ends of the line by what points there', () => {
    expect(M[0].whoHeIs.edge).toBe(true);
    expect(whoHeIsRegisterText(M[0]).split('\n').filter((l) => l.startsWith('- ')).length).toBe(WHO_HE_IS_EDGE.length);
    expect(reg(M[12]).primary).toHaveLength(0);
    expect(reg(M[12]).pointing.length).toBe(whoHeIsTotals().byPointsTo['the-end']);
    expect(reg(M[13]).pointing.length).toBe(whoHeIsTotals().byPointsTo.forever);
  });

  it('the printed curriculum carries every register, so the export holds all of them too', () => {
    const md = exportWhoHeIsCurriculumMarkdown(null);
    for (const e of WHO_HE_IS_ENTRIES) expect(md.includes(`**${e.ref}**`), e.ref).toBe(true);
  });

  it('a passage that crosses a chapter opens as one range per chapter', () => {
    expect(readableRefs('Mark 8:27-9:1', () => 38)).toEqual(['Mark 8:27-38', 'Mark 9:1']);
    expect(readableRefs('John 3:16', () => 36)).toEqual(['John 3:16']);
  });
});

describe('every count is the data’s count', () => {
  const T = whoHeIsTotals();
  it('lesson 1 states the totals as the data gives them', () => {
    const t = M[0].lesson;
    expect(t).toContain(`${numberWords(T.entries)} passages holding ${numberWords(T.verses)} verses`);
    expect(t).toContain(`He was there in person in ${numberWords(T.byPresent.yes)}`);
    expect(M[0].levels.youth.toLowerCase()).toContain(`${numberWords(T.edge)} passages`);
  });

  it('each era lesson states its own register sizes', () => {
    for (const m of M.slice(1)) {
      const r = reg(m);
      const all = [m.lesson, m.bigIdea, ...Object.values(m.levels)].join(' ').toLowerCase();
      if (r.primary.length) expect(all, `${m.id} primary`).toContain(numberWords(r.primary.length));
      if (r.pointing.length) expect(all, `${m.id} pointing`).toContain(numberWords(r.pointing.length));
    }
  });

  it('the comparisons the prose makes still hold in the data', () => {
    const p = T.byPointsTo;
    const others = Object.entries(p).filter(([k]) => k !== 'cross').map(([, v]) => v);
    expect(p.cross, 'the cross is pointed to more than any other era').toBeGreaterThan(Math.max(...others));
    const notCross = Object.entries(p).filter(([k]) => k !== 'cross' && k !== 'forever').map(([, v]) => v);
    expect(p.forever, 'for ever is second only to the cross').toBeGreaterThan(Math.max(...notCross));
    expect(T.byEra['the-land'] || 0, 'lesson 3 says the land and the judges hold none').toBe(0);
    expect(T.byEra['the-end'] || 0).toBe(0);
    expect(T.byEra.forever || 0).toBe(0);
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole course resolves verbatim, on every surface', () => {
    const scan = scanQuotedVerses(M, quotedTexts);
    expect(scan.spans, 'a low count means the scan broke').toBeGreaterThan(300);
    expect(scan.faults.map(describeFault)).toEqual([]);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('every double-quoted span in the teaching carries its reference', () => {
    for (const m of M) {
      for (const [where, text] of [['lesson', m.lesson], ['bigIdea', m.bigIdea], ...FULL_BANDS.map((b) => [b, m.levels[b]]), ...m.benefits.map((b, k) => [`benefit ${k}`, b])]) {
        const quotes = (String(text).match(/"([^"]+)"/g) || []).length;
        const withRef = (String(text).match(/"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g) || []).length;
        expect(withRef, `${m.id} ${where}: ${quotes} quoted, ${withRef} with a reference`).toBe(quotes);
      }
    }
  });

  it('straight quotation marks, no ellipsis inside a quotation, no record id, no percentage', () => {
    for (const m of M) {
      for (const [where, text] of quotedTexts(m)) {
        expect(/[“”]/.test(text), `${m.id} ${where} curly quotes`).toBe(false);
        for (const span of String(text).matchAll(/"([^"]+)"/g)) expect(/\.\.\.|…/.test(span[1]), `${m.id} ${where} elides`).toBe(false);
        expect(/DR-\d{4}/.test(text), `${m.id} ${where} recites a record id`).toBe(false);
        expect(/\d\s*%/.test(text), `${m.id} ${where} states a percentage`).toBe(false);
      }
    }
  });
});

describe('our voice keeps the bindings', () => {
  it('says Yahweh, never the generic name, and never capitalizes the adversary, outside quotations', () => {
    for (const m of M) {
      const prose = quotedTexts(m).map(([, t]) => t).join(' ').replace(/"[^"]*"/g, ' ');
      expect(prose.match(/\bGod\b/g), `${m.id} says the generic name in our voice`).toBe(null);
      expect(/\b(Satan|Lucifer|Devil|Baal)\b/.test(prose), m.id).toBe(false);
    }
  });

  it('every band and every lesson ends the way this house ends', () => {
    for (const m of M) for (const t of [m.lesson, ...FULL_BANDS.map((b) => m.levels[b])]) expect(t.trimEnd().endsWith(CLOSE), m.id).toBe(true);
  });
});

describe('the four bands, measured by the house’s band gates', () => {
  it('every band clears its full-levels floor', () => {
    for (const m of M) {
      const f = measureFullness(m);
      for (const b of FULL_BANDS) expect(f.bands[b].share, `${m.id} ${b} share ${f.bands[b].share} under ${FULL_FLOOR[b]}`).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
    }
  });

  it('the grades ascend, and the child band is held to the age', () => {
    for (const m of M) {
      const r = measureLesson(m);
      expect(isInverted(r), `${m.id} ${JSON.stringify(r.bands)}`).toBe(false);
      expect(breachesChildCeiling(r, NEW_LESSON_CHILD_CEILING), `${m.id} child reads ${r.bands.child.authored}`).toBe(false);
    }
  });

  it('the four bands are genuinely different texts', () => {
    for (const m of M) {
      const d = measureDifferentiation(m);
      expect(d.worst, m.id).toBeLessThan(DIFF_CEILING);
    }
  });

  it('every band names its own lesson near its start', () => {
    for (const m of M) for (const b of FULL_BANDS) expect(namesItsLesson(m.title, m.levels[b]), `${m.id} ${b}`).toBe(true);
  });
});

describe('proven-to-catch (DR-0076 §3)', () => {
  it('a misquoted verse fails the verse gate', () => {
    const broken = { ...M[7], lesson: M[7].lesson.replace('It is finished', 'It is complete') };
    expect(scanQuotedVerses([broken], quotedTexts).faults.length).toBeGreaterThan(0);
  });

  it('a generic name planted in our voice is seen', () => {
    const prose = `${M[0].lesson} God is good.`.replace(/"[^"]*"/g, ' ');
    expect(prose.match(/\bGod\b/g)).not.toBe(null);
  });

  it('a lesson that loses its register breaks the one-lesson-per-passage check', () => {
    const without = M.filter((m) => m.id !== M[6].id);
    const seen = new Set(without.flatMap((m) => reg(m).primary.map((e) => e.id)));
    expect(WHO_HE_IS_ENTRIES.filter((e) => !seen.has(e.id)).length).toBeGreaterThan(0);
  });

  it('a typed count that drifts from the data is seen', () => {
    const word = numberWords(reg(M[6]).primary.length);
    const drifted = M[6].lesson.toLowerCase().split(word).join('two hundred');
    expect(drifted).not.toContain(word);
    expect(M[6].lesson.toLowerCase()).toContain(word);
  });
});
