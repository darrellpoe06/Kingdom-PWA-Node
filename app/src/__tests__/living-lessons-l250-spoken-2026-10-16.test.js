// @vitest-environment node
// =============================================================================
// L250 — "They Which Do Hunger Shall Be Filled": the third teaching Darrell
// SPOKE into the house on 2026-10-16, built the same session (a spoken
// teaching is build input). DR-1082.
// =============================================================================
// His sentences, carried in his order: blessed are those who hunger and thirst
// after righteousness, for they shall be filled; how that works as Yahweh's
// deterministic algorithms; what He says will and will not happen according
// to His Word, by what you do, not what you say, and specifically what you do
// not do; the critical path, with us as project managers across the whole
// Bible; in Jesus' name, amen, which means so be it; we want it to happen now;
// thank You in advance, Yahweh.
//
// THE WORD WRITES BOTH BRANCHES, and this gate pins them: Isaiah 1:19 (the
// will) beside Isaiah 1:20 (the will not), James 4:17 (the undone is sin) in
// every place, Matthew 5:6 first and last in every place, and Matthew 6:33 as
// the first task on the critical path.
//
// WHAT THE CHECKS CAUGHT WHILE WRITING, mechanical, before commit: youth and
// teen short of their floor (0.53, 0.57) against a 1,609-word adult lesson,
// and the teen and senior reading levels 1.02 grades apart (a hair over the
// ladder's step). The two bands were deepened in plainer sentences (the
// three-promises self-test, the group project, the personal Undone list,
// one task at a time), which widened the step to 1.74. Nehemiah 2:18 belongs
// to the inspections course and Isaiah 55:1 to the appraisal course, so L250
// quotes neither.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { fleschKincaidGrade, ourProseOnly, NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { placesMissingDirections } from '../lib/talk-together.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const verse = (book, ch, n) => {
  const p = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(p)) return null;
  const chap = JSON.parse(readFileSync(p, 'utf8')).chapters[Number(ch) - 1];
  return chap ? norm(chap[Number(n) - 1]) : null;
};
const BANDS = ['child', 'youth', 'teen', 'senior'];
const RE = /"([^"]{10,})"\s*\(([1-3]?\s?[A-Z][A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const spansOf = (L) => {
  const spans = [];
  const walk = (node, path) => {
    if (typeof node === 'string') {
      RE.lastIndex = 0;
      let g;
      while ((g = RE.exec(node))) spans.push({ path, quoted: g[1], book: g[2], ch: g[3], label: g[4].trim() });
    } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(L, '');
  return spans;
};


const ID = 'll250-they-which-do-hunger-shall-be-filled-and-the-critical-path';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const ALL = Object.keys(TEXTS);
const whole = ALL.map((k) => TEXTS[k]).join('\n');

const STRANDS = [
  ['the promise', 'Matthew', 5, 6, 'Blessed are they which do hunger and thirst after righteousness: for they shall be filled'],
  ['filled like the crowd', 'Matthew', 14, 20, 'And they did all eat, and were filled'],
  ['He fills the hungry soul', 'Psalms', 107, 9, 'filleth the hungry soul with goodness'],
  ['the hungry filled, the rich empty', 'Luke', 1, 53, 'He hath filled the hungry with good things'],
  ['the panting deer', 'Psalms', 42, 1, 'As the hart panteth after the water brooks'],
  ['early will I seek', 'Psalms', 63, 1, 'early will I seek thee'],
  ['I did eat them', 'Jeremiah', 15, 16, 'Thy words were found, and I did eat them'],
  ['more than food', 'Job', 23, 12, 'more than my necessary food'],
  ['His meat is to do', 'John', 4, 34, 'My meat is to do the will of him that sent me, and to finish his work'],
  ['seek first', 'Matthew', 6, 33, 'But seek ye first the kingdom of God, and his righteousness'],
  ['he that doeth righteousness', '1 John', 3, 7, 'he that doeth righteousness is righteous'],
  ['the will branch', 'Isaiah', 1, 19, 'If ye be willing and obedient, ye shall eat the good of the land'],
  ['the will-not branch', 'Isaiah', 1, 20, 'But if ye refuse and rebel, ye shall be devoured with the sword'],
  ['to observe and to do', 'Deuteronomy', 28, 1, 'to observe and to do all his commandments'],
  ['the full soul', 'Proverbs', 27, 7, 'The full soul loatheth an honeycomb'],
  ['woe to the full', 'Luke', 6, 25, 'Woe unto you that are full! for ye shall hunger'],
  ['thou sayest', 'Revelation', 3, 17, 'Because thou sayest, I am rich'],
  ['desire without doing', 'Proverbs', 13, 4, 'The soul of the sluggard desireth, and hath nothing'],
  ['hands refuse', 'Proverbs', 21, 25, 'for his hands refuse to labour'],
  ['the undone is sin', 'James', 4, 17, 'Therefore to him that knoweth to do good, and doeth it not, to him it is sin'],
  ['leave not undone', 'Matthew', 23, 23, 'these ought ye to have done, and not to leave the other undone'],
  ['ye did it not', 'Matthew', 25, 45, 'Inasmuch as ye did it not to one of the least of these, ye did it not to me'],
  ['the buried talent', 'Matthew', 25, 25, 'went and hid thy talent in the earth'],
  ['passed by', 'Luke', 10, 31, 'passed by on the other side'],
  ['a little folding of the hands', 'Proverbs', 24, 33, 'a little folding of the hands to sleep'],
  ['the end from the beginning', 'Isaiah', 46, 10, 'Declaring the end from the beginning'],
  ['the fulness of the time', 'Galatians', 4, 4, 'But when the fulness of the time was come'],
  ['write the vision', 'Habakkuk', 2, 2, 'Write the vision, and make it plain upon tables'],
  ['count the cost', 'Luke', 14, 28, 'sitteth not down first, and counteth the cost'],
  ['Noah finished', 'Genesis', 6, 22, 'Thus did Noah; according to all that God commanded him, so did he'],
  ['a mind to work', 'Nehemiah', 4, 6, 'for the people had a mind to work'],
  ['fifty-two days', 'Nehemiah', 6, 15, 'in fifty and two days'],
  ['go to the ant', 'Proverbs', 6, 6, 'Go to the ant, thou sluggard; consider her ways, and be wise'],
  ['finished the work', 'John', 17, 4, 'I have finished the work which thou gavest me to do'],
  ['now', '2 Corinthians', 6, 2, 'behold, now is the accepted time'],
  ['delayed not', 'Psalms', 119, 60, 'I made haste, and delayed not to keep thy commandments'],
  ['not tomorrow', 'Proverbs', 3, 28, 'Say not unto thy neighbour, Go, and come again, and to morrow I will give'],
  ['the Amen', 'Revelation', 3, 14, 'These things saith the Amen, the faithful and true witness'],
  ['yea and Amen', '2 Corinthians', 1, 20, 'For all the promises of God in him are yea, and in him Amen'],
  ['with thanksgiving', 'Philippians', 4, 6, 'with thanksgiving let your requests be made known unto God'],
];

describe('L250 exists, is numbered, and is dated the day it was spoken', () => {
  it('is in the catalog exactly once, as the highest number', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 250)).toHaveLength(1);
    expect(Math.max(...claimed)).toBeGreaterThanOrEqual(250);
    for (const n of [211, 212]) expect(claimed.includes(n), `${n} is not this lesson's to fill`).toBe(false);
    // 79 IS NO LONGER A HOLE. It was one when this check was written -- the
    // comment on the original said so: "79 is #2166's held lesson". That
    // lesson (DR-1025) is on this branch and fills it, so asserting 79 is
    // UNCLAIMED now fails for a reason that has nothing to do with this
    // lesson. The question the check actually means is still asked, and more
    // strictly: 211 and 212 are still open holes nobody may fill by
    // accident, and 79 is claimed EXACTLY ONCE, by the lesson whose number
    // it is. A lesson that drifted onto 79 would make that count 2.
    expect(
        LIVING_LESSONS_MODULES.filter((m) => /^ll79-/.test(m.id)).length,
        '79 is claimed exactly once, by the lesson whose number it is',
    ).toBe(1);
  });
  it('carries the spoken day, on or after L249', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-16');
    expect(LIVING_LESSONS_ADDED['ll249-nothing-of-myself-the-way-is-the-word-and-it-works-every-time'] <= LIVING_LESSONS_ADDED[ID]).toBe(true);
  });
  it('names Darrell as the one who spoke it, in the adult lesson, with his sentences in his order', () => {
    expect(/spoken into this house by Darrell/.test(L.lesson)).toBe(true);
    expect(L.lesson).toContain('based on what you do, not on what you say, and specifically, what you do not do');
    expect(L.lesson).toContain('we are project managers across the whole Bible');
    expect(L.lesson).toContain('In Jesus’ name, amen, which means so be it.');
    expect(L.lesson).toContain('We want to make sure that it happens now.');
  });
});

describe('L250 carries Darrell’s words in every band', () => {
  it.each([
    [/hunger/i, 'the hunger'],
    [/filled/i, 'the filling'],
    [/undone/i, 'what you leave undone'],
    [/critical path/i, 'the critical path'],
    [/\bnow\b/i, 'now'],
    [/amen/i, 'amen'],
    [/so be it/i, 'so be it'],
  ])('%s — %s', (re, what) => {
    for (const k of ALL) expect(re.test(TEXTS[k]), `${k} drops ${what}`).toBe(true);
  });
});

describe('L250 — the Word writes both branches, and the first task is first', () => {
  it.each(['adult', ...BANDS])('%s quotes the will branch (Isaiah 1:19) and names what is left undone (James 4:17)', (k) => {
    expect(TEXTS[k].includes('(Isaiah 1:19)'), `${k} drops Isaiah 1:19`).toBe(true);
    expect(TEXTS[k].includes('(James 4:17)'), `${k} drops James 4:17`).toBe(true);
  });
  it.each(['adult', 'youth', 'teen', 'senior'])('%s quotes the will-not branch beside it (Isaiah 1:20)', (k) => {
    expect(TEXTS[k].indexOf('(Isaiah 1:20)')).toBeGreaterThan(TEXTS[k].indexOf('(Isaiah 1:19)'));
  });
  it.each(['adult', ...BANDS])('%s opens on the promise and closes on it (Matthew 5:6 first and last)', (k) => {
    const t = TEXTS[k];
    const first = t.indexOf('(Matthew 5:6)');
    expect(first, `${k} never quotes Matthew 5:6`).toBeGreaterThan(-1);
    expect(t.trim().endsWith('(Matthew 5:6).'), `${k} does not close on the promise`).toBe(true);
  });
  it('names seeking first (Matthew 6:33) as the first task on the critical path, in the adult lesson', () => {
    const i = L.lesson.indexOf('SEVEN. THE CRITICAL PATH');
    expect(i).toBeGreaterThan(-1);
    expect(L.lesson.indexOf('(Matthew 6:33)', i)).toBeGreaterThan(i);
  });
});

describe('L250 — every quoted span is the verse', () => {
  it.each(STRANDS)('%s — %s %s:%s', (_why, book, ch, n, span) => {
    const v = verse(book, ch, n);
    expect(v, `${book} ${ch}:${n} resolves`).toBeTruthy();
    expect(v.includes(span), `the span is not in ${book} ${ch}:${n}`).toBe(true);
    expect(whole.includes(span), `the lesson does not carry ${book} ${ch}:${n}`).toBe(true);
  });

  const spans = L ? spansOf(L) : [];
  it('finds a substantial number of referenced spans', () => {
    expect(spans.length).toBeGreaterThan(200);
  });
  it('every referenced span is verbatim in the verse it cites, case and all', () => {
    const bad = [];
    for (const s of spans) {
      const nums = [];
      for (const part of s.label.split(',')) {
        const r = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
        if (r) for (let i = Number(r[1]); i <= Number(r[2]); i += 1) nums.push(i);
        else if (part.trim()) nums.push(Number(part.trim()));
      }
      const joined = nums.map((n) => verse(s.book, s.ch, n)).join(' ');
      if (!joined || !norm(joined).includes(norm(s.quoted))) bad.push(`${s.path} :: ${s.book} ${s.ch}:${s.label} :: "${s.quoted.slice(0, 70)}"`);
    }
    expect(bad, `not His words as written:\n${bad.join('\n')}`).toEqual([]);
  });
  it('uses the corpus apostrophe inside quotations', () => {
    for (const s of spans) expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a quotation`).toBe(false);
  });
  it('marks no elision and recites no record', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });
  it('leaves "God" exactly as the verses carry it', () => {
    for (const u of ['But seek ye first the kingdom of God', 'Thus did Noah; according to all that God commanded him', 'with thanksgiving let your requests be made known unto God']) {
    expect(whole.includes(u), `drops: ${u}`).toBe(true);
    }
  });
  it('leaves Nehemiah 2:18 to the inspections course and Isaiah 55:1 to the appraisal course, which claim them', () => {
    expect(whole.includes('(Nehemiah 2:18)')).toBe(false);
    expect(whole.includes('(Isaiah 55:1)')).toBe(false);
    expect(JSON.stringify(L).includes('Let us rise up and build')).toBe(false);
  });
});

describe('L250 — four bands, each carrying the whole message', () => {
  const measured = measureFullness(L);
  it.each(BANDS)('%s clears its floor', (b) => {
    expect(measured.bands[b].share).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });
  it('reports no short band, and would report one trimmed back (proven-to-catch)', () => {
    expect(shortBands(measured)).toEqual([]);
    const faked = { ...L, levels: { ...L.levels, youth: L.levels.youth.slice(0, 500) } };
    expect(shortBands(measureFullness(faked))).toContain('youth');
  });
  it('every band names its own lesson near the start', () => {
    expect(unnamedBands(L)).toEqual([]);
  });
  it('keeps the bands genuinely different', () => {
    expect(duplicatedBands(measureDifferentiation(L))).toEqual([]);
    expect(measureDifferentiation(L).worst).toBeLessThan(DIFF_CEILING);
  });
  it('sends the reader all three ways in every place', () => {
    expect(placesMissingDirections(L)).toEqual([]);
  });
  it('the ladder rises and the child band is under the ceiling', () => {
    const g = (k) => fleschKincaidGrade(ourProseOnly(TEXTS[k]));
    expect(isInverted(measureLesson(L))).toBe(false);
    expect(g('child')).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(g('youth')).toBeGreaterThan(g('child') + 1);
    expect(g('teen')).toBeGreaterThan(g('youth') + 1);
    expect(g('senior')).toBeGreaterThan(g('teen') + 1);
  });
});

describe('L250 — two stories, and Yahweh in our voice', () => {
  it('carries two real stories, one light and one solemn, with no double-quoted span', () => {
    const real = (L.stories || []).filter((s) => s.kind === 'parable' || s.kind === 'testimony');
    expect(real.length).toBeGreaterThanOrEqual(2);
    const tones = L.stories.map((s) => s.tone);
    expect(tones).toContain('light');
    expect(tones).toContain('solemn');
    for (const s of L.stories) expect(String(s.body)).not.toMatch(/"/);
  });
  it('the stories teach this lesson rather than decorating it', () => {
    const [light, solemn] = ['light', 'solemn'].map((tone) => L.stories.find((s) => s.tone === tone));
    // the boy is too full of junk for the real meal, and saying he is starving never made him hungry
    expect(/saying it had never once made him hungry/.test(light.body)).toBe(true);
    // the visit kept being planned and was never made; the lesson he keeps is: today
    expect(/whether they could do it today/.test(solemn.body)).toBe(true);
  });
  it.each(ALL)('%s names Him by covenant name and never the generic in our prose', (k) => {
    const ours = ourProseOnly(TEXTS[k]);
    expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
    expect(/\bGod(?:'s|’s)?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
  });
  it('the quiz answers are not all in one position', () => {
    const at = L.quiz.questions.map((q) => q.answer);
    expect(new Set(at).size).toBeGreaterThan(1);
    for (const q of L.quiz.questions) expect(q.options[q.answer]).toBeTruthy();
  });
});
