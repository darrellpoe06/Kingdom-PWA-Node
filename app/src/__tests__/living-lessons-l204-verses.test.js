// @vitest-environment node
// =============================================================================
// L204 — The Word Checks Every Teller — Many Counsellors, All Under Him
// (DR-0714)
// =============================================================================
// Darrell wrote this teaching into the build on 2026-09-30 while L202 was being
// finished: the Word, sourced and researched outside the teller, corrects us
// all; in the multitude of counsellors there is safety, and our counsellors
// (the teacher, the class, Ari, our own local AI) are corrected by the Word, so
// we all agree with Him first; and the hope of courses our children can use
// without a particular teacher. Every quoted span is the verse it names (the
// repo's scanQuotedVerses); his movements are pinned in his order; the hope is
// pinned as a hope, never as something already live (DR-0076).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { tutorEndpoint, TUTOR_MODEL } from '../lib/class-tutor.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const book = (b) => JSON.parse(readFileSync(join(KJV, `${b.replace(/ /g, '')}.json`), 'utf8')).chapters;
const verse = (b, c, v) => book(b)[c - 1][v - 1];

const ID = 'll204-the-word-checks-every-teller-many-counsellors-all-under-him';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  expect(m, 'L204 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const PROSE = () => ALL().replace(/"[^"]*"/g, ' ');
const BANDS = () => FULL_BANDS.map((b) => L().levels[b]);
// The church's own name, The Church of the Living God, is a proper name and is
// kept as the church writes it; every other "God" in our prose is a fault.
const genericGod = (prose) => /\bGod\b/.test(prose.replace(/The Church of the Living God/g, ''));

const MOVEMENTS = [
  'ONE. TESTING HOW WE MAKE A LESSON.',
  'TWO. THE WORD CHECKS EVERY TELLER.',
  'THREE. L202, THE WORKED EXAMPLE.',
  'FOUR. IN THE MULTITUDE OF COUNSELLORS THERE IS SAFETY.',
  'FIVE. OUR COUNSELLORS ARE CORRECTED BY THE WORD.',
  'SIX. SO WE ALL AGREE WITH HIM FIRST.',
  'SEVEN. THE HOPE: COURSES FOR OUR CHILDREN.',
  'THE CLOSE.',
];

describe('L204 is really in the series', () => {
  it('carries all the fields, four authored bands, a quiz, and facilitator points', () => {
    const m = L();
    expect(m.title).toBe('The Word Checks Every Teller — Many Counsellors, All Under Him');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    for (const r of ['Proverbs 11:14', 'Proverbs 15:22', 'Proverbs 24:6', 'Acts 17:11', '1 Thessalonians 5:21', 'Isaiah 8:20', '2 Timothy 3:16', 'Amos 3:3']) expect(m.anchor.ref).toContain(r);
    expect(m.quiz.questions).toHaveLength(8);
    for (const q of m.quiz.questions) {
      expect(q.options[q.answer], q.q).toBeTruthy();
      expect(q.explain.length).toBeGreaterThan(40);
    }
    expect(m.facilitator.talkingPoints).toHaveLength(8);
    expect(m.benefits.length).toBeGreaterThanOrEqual(8);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('is numbered 204, comes after L202, carries its day, is the only L204, and holds 203 for the parallel lesson', () => {
    const num = (m) => Number((/^ll(\d+)-/.exec(m.id) || [])[1]);
    const l202 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll202-'));
    expect(l202).toBeTruthy();
    expect(num(L())).toBe(204);
    expect(LIVING_LESSONS_MODULES.indexOf(L())).toBeGreaterThan(LIVING_LESSONS_MODULES.indexOf(l202));
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length); // derived (DR-0677)
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-09-30');
    expect(LIVING_LESSONS_MODULES.filter((m) => /^ll204-/.test(m.id))).toHaveLength(1);
  });
});

describe('Darrell’s framing is kept, in his order (DR-0331: render for meaning)', () => {
  it('the lesson names where it came from and his own lines', () => {
    const l = L().lesson;
    expect(l).toContain('On 2026-09-30, while we were finishing L202');
    expect(l).toContain('The Church of the Living God in Champaign, Illinois');
    expect(l).toContain('testing our system for creating a lesson');
    expect(l).toContain('sourced and researched outside of the teller');
    expect(l).toContain('so we all agree with Him first');
    expect(l).toContain('Every verse below is quoted from the King James text, word for word.');
  });

  it('says L202 was recorded inside the PoeTech app, never on a phone and sent in (Darrell, 2026-09-30)', () => {
    expect(ALL()).toContain('inside the PoeTech app');
    expect(ALL()).not.toMatch(/on (his|a) phone|into his phone|sent it into the app|Wednesday Bible study/i);
  });

  it('the movements are all present, in order, in the lesson', () => {
    const l = L().lesson;
    let at = -1;
    for (const mv of MOVEMENTS) {
      const i = l.indexOf(mv);
      expect(i, `missing or out of order: ${mv}`).toBeGreaterThan(at);
      at = i;
    }
  });

  it('every band names all four counsellors or their plain equivalent, and Ari by name', () => {
    for (const [i, b] of BANDS().entries()) {
      expect(b, FULL_BANDS[i]).toContain('Ari');
      expect(/checked|corrected/.test(b), FULL_BANDS[i]).toBe(true);
    }
  });
});

describe('the hope is stated as a hope, and what exists is what the code holds (DR-0076)', () => {
  it('the lesson says the children’s course is not yet the everyday, in every surface that states the hope', () => {
    expect(L().lesson).toContain('is not yet the everyday; it is what we are building toward');
    expect(L().levels.child).toContain('That is not all built yet. It is a hope we are working on.');
    expect(L().levels.youth).toContain('a hope we are still building, not something finished');
    expect(L().levels.teen).toContain('is still a hope and a direction');
    expect(L().levels.senior).toContain('is still a hope and a direction, not something finished');
    expect(L().facilitator.talkingPoints.join(' ')).toContain('a direction we are building, not something finished');
  });

  it('the one thing claimed as built is true: the lesson guide asks our own server, same-origin, local model', () => {
    // The lesson says the guide "is written to ask a model on our own server"
    // and "shows the written lesson" when it does not answer. Pin both halves
    // to the code so the sentence cannot outlive the fact.
    expect(tutorEndpoint()).toBe('/llm/chat');
    expect(TUTOR_MODEL).toBe('qwen2.5');
    const tutor = readFileSync(join(HERE, '..', 'lib', 'class-tutor.js'), 'utf8');
    expect(tutor).toContain('falls back to the');
    expect(tutor).toContain('never fabricates an LLM answer');
    expect(L().lesson).toContain('is written to ask a model on our own server');
  });

  it('Ari is described as the code describes him: a made tool that can be wrong', () => {
    // ari.js wraps the phrase across a comment line; read it as prose.
    const ari = readFileSync(join(HERE, '..', 'lib', 'ari.js'), 'utf8').replace(/\n\s*\/\/\s*/g, ' ');
    expect(ari).toContain('a made tool that can be wrong');
    expect(L().lesson).toContain('a made tool that can be wrong');
  });

  it('never claims the children’s course or the local AI is live', () => {
    for (const bad of [/courses? (?:is|are) (?:now )?live/i, /children can now ask/i, /already ask(?:s)? our own (?:local )?AI/i]) {
      expect(bad.test(ALL()), String(bad)).toBe(false);
    }
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on every surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans, 'a low count means the scan broke').toBeGreaterThan(100);
    expect(scan.faults.map((f) => `${f.where} :: ${f.kind} :: ${f.ref || ''}`)).toEqual([]);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('every double-quoted span carries its reference — a quote means Scripture, and no man is quoted', () => {
    for (const [where, text] of quotedTexts(L())) {
      const quotes = (String(text).match(/"([^"]+)"/g) || []).length;
      const withRef = (String(text).match(/"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g) || []).length;
      expect(withRef, `${where}: ${quotes} quoted spans, ${withRef} with a reference`).toBe(quotes);
    }
  });

  it('straight quotation marks, no ellipsis inside a quotation, no record id, no percentage', () => {
    const all = ALL();
    expect(all.includes('“')).toBe(false);
    expect(all.includes('”')).toBe(false);
    for (const [where, text] of quotedTexts(L())) {
      for (const s of String(text).matchAll(/"([^"]+)"/g)) expect(/\.\.\.|…/.test(s[1]), `${where} elides`).toBe(false);
      expect(/DR-\d{4}/.test(text), `${where} recites a record id`).toBe(false);
      expect(/\d\s*%/.test(text), `${where} states a percentage`).toBe(false);
    }
  });
});

describe('the Word the lesson builds on, pinned to the KJV', () => {
  it('the counsel verses read as the Word states them, three times in Proverbs', () => {
    expect(verse('Proverbs', 11, 14)).toContain('in the multitude of counsellors there is safety');
    expect(verse('Proverbs', 15, 22)).toContain('in the multitude of counsellors they are established');
    expect(verse('Proverbs', 24, 6)).toContain('in multitude of counsellors there is safety');
    expect(verse('Psalms', 119, 24)).toBe('Thy testimonies also are my delight and my counsellors.');
  });

  it('the checks on every teller read as written', () => {
    expect(verse('Acts', 17, 11)).toContain('searched the scriptures daily, whether those things were so');
    expect(verse('Galatians', 1, 8)).toContain('though we, or an angel from heaven');
    expect(verse('Isaiah', 8, 20)).toContain('if they speak not according to this word');
    expect(verse('1 Thessalonians', 5, 21)).toBe('Prove all things; hold fast that which is good.');
    expect(verse('Acts', 15, 15)).toContain('to this agree the words of the prophets');
    expect(verse('2 Timothy', 3, 16)).toContain('for reproof, for correction');
    expect(verse('Amos', 3, 3)).toBe('Can two walk together, except they be agreed?');
  });

  it('every verse the brief asked to verify is quoted in the lesson itself', () => {
    const l = L().lesson;
    for (const r of ['(Proverbs 11:14)', '(Proverbs 15:22)', '(Proverbs 24:6)', '(Acts 17:11)', '(1 Thessalonians 5:21)', '(Isaiah 8:20)', '(2 Timothy 3:16)', '(2 Timothy 3:17)']) expect(l, r).toContain(r);
  });

  it('proven to catch: a misquoted counsel verse and a verse re-pointed to its neighbor both fire', () => {
    const broken = { ...L(), lesson: L().lesson.replace('in the multitude of counsellors there is safety" (Proverbs 11:14)', 'in the multitude of counsellors there is wisdom" (Proverbs 11:14)') };
    expect(broken.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([broken], quotedTexts).faults.length).toBeGreaterThan(0);
    const moved = { ...L(), lesson: L().lesson.replace('"Can two walk together, except they be agreed?" (Amos 3:3)', '"Can two walk together, except they be agreed?" (Amos 3:4)') };
    expect(moved.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([moved], quotedTexts).faults.length).toBeGreaterThan(0);
  });
});

describe('our voice: Yahweh, the Godhead capitalized, quoted God untouched (DR-0210)', () => {
  it('our prose never says the generic God, and says Yahweh', () => {
    expect(genericGod(PROSE()), 'generic "God" in our prose').toBe(false);
    expect(PROSE()).toContain('Yahweh');
  });

  it('quoted Scripture keeps God and the LORD exactly as the KJV writes them', () => {
    expect(L().lesson).toContain('"let God be true, but every man a liar" (Romans 3:4)');
    expect(L().lesson).toContain('"And all thy children shall be taught of the LORD;');
  });

  it('Jesus is confessed as the Lamb of Yahweh and the Eternal Son of Yahweh', () => {
    for (const t of [L().lesson, L().levels.youth, L().levels.teen, L().levels.senior]) {
      expect(t).toContain('Jesus is the Lamb of Yahweh');
      expect(t).toContain('Eternal Son of Yahweh');
    }
    expect(L().levels.child).toContain('Jesus is the Lamb of Yahweh');
  });

  it('proven to catch: a planted generic name fires', () => {
    expect(genericGod(`${PROSE()} God wants us to check.`)).toBe(true);
  });
});

describe('four bands, each for its age', () => {
  it('each band is full against the adult lesson', () => {
    const f = measureFullness(L());
    for (const b of FULL_BANDS) expect(f.bands[b].share, b).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('reading level rises child to senior, and the child band stays under the new-lesson ceiling', () => {
    const r = measureLesson(L());
    expect(isInverted(r)).toBe(false);
    expect(breachesChildCeiling(r, NEW_LESSON_CHILD_CEILING)).toBe(false);
  });

  it('no two bands are the same text', () => {
    expect(measureDifferentiation(L()).worst).toBeLessThan(DIFF_CEILING);
  });

  it('every band names its lesson in its opening', () => {
    for (const b of FULL_BANDS) expect(namesItsLesson(L().title, L().levels[b]), b).toBe(true);
  });
});
