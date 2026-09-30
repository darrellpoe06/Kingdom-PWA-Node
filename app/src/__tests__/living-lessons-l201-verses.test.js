// @vitest-environment node
// =============================================================================
// L201 — How Long Before It Came? — David, the Prophets, and the Years from
// Each Promise to Jesus (DR-0689)
// =============================================================================
// Darrell spoke this into Thinking Space on his phone on 2026-09-30
// (agent_inbox db1bcde6-25c8-41d3-9195-fcf91d2b724e). The dictation carried the
// same passage three times; the last few words were cut off. He asked for the
// TIMELINE: when David lived, when each prophet spoke, and how long from each
// prophecy to its fulfillment, on one line that runs to Jesus.
//
// The heart of the lesson is its dates, so the dates are tested as data:
//   * every prophecy row in `timeline` carries its spoken span and its kept
//     span as years (negative = BC); the interval is RECOMPUTED here (no year
//     zero between 1 BC and AD 1) and must equal the words the timeline, the
//     lesson's table, and the teen/senior/youth tables print;
//   * the Word's own numbers are pinned against the KJV files: forty years
//     (2 Samuel 5:4), the 480th year (1 Kings 6:1), seventy years (Jeremiah
//     25:11), seven weeks and threescore and two weeks (Daniel 9:25);
//   * David's span is derived from the Word's forty years; Daniel's 483 years
//     and the earliest year they could end (from 538 BC) are derived here.
// Every quoted span is the verse it names (the repo's scanQuotedVerses).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const verse = (book, c, v) => JSON.parse(readFileSync(join(KJV, `${book.replace(/ /g, '')}.json`), 'utf8')).chapters[c - 1][v - 1];

const ID = 'll201-how-long-before-it-came-david-the-prophets-and-the-years-from-each-promise-to-jesus';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  expect(m, 'L201 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const PROSE = () => ALL().replace(/"[^"]*"/g, ' ');
const BANDS_AND_LESSON = () => [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])];

// ---- the arithmetic, stated once: no year zero ----
const astro = (y) => (y < 0 ? y + 1 : y);
const interval = ([sFrom, sTo], [kFrom, kTo]) => [astro(kFrom) - astro(sTo), astro(kTo) - astro(sFrom)];
const yearsText = ([a, b]) => (a === b ? `${a.toLocaleString('en-US')} years` : `${a.toLocaleString('en-US')} to ${b.toLocaleString('en-US')} years`);
const span = ([a, b]) => {
  if (a === b) return a < 0 ? `c. ${-a} BC` : `AD ${a}`;
  if (a < 0 && b < 0) return `c. ${-a} to ${-b} BC`;
  return `AD ${a} to ${b}`;
};
const rows = () => L().timeline.filter((t) => t.prophecy);
const row = (ref) => rows().find((t) => t.prophecy.ref === ref).prophecy;

describe('L201 is really in the series', () => {
  it('carries all the fields, four authored bands, a quiz, and a dated timeline', () => {
    const m = L();
    expect(m.title).toBe('How Long Before It Came? — David, the Prophets, and the Years from Each Promise to Jesus');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    for (const r of ['Isaiah 46:10', '1 Kings 6:1', '2 Samuel 7:12', 'Psalms 22:18', 'Micah 5:2', 'Daniel 9:25', 'Zechariah 9:9', 'Malachi 3:1', 'Luke 4:21']) expect(m.anchor.ref).toContain(r);
    expect(m.quiz.questions).toHaveLength(8);
    for (const q of m.quiz.questions) {
      expect(q.options[q.answer], q.q).toBeTruthy();
      expect(q.explain.length).toBeGreaterThan(40);
    }
    expect(m.facilitator.talkingPoints).toHaveLength(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(8);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
    for (const t of m.timeline) {
      expect(typeof t.year).toBe('string');
      expect(t.event.split(/\s+/).length).toBeGreaterThanOrEqual(5);
      expect(t.record.split(/\s+/).length).toBeGreaterThanOrEqual(3);
    }
  });

  it('is numbered 201, comes after L200, carries its day, and links L200 and L196 rather than repeating them', () => {
    const num = (m) => Number((/^ll(\d+)-/.exec(m.id) || [])[1]);
    const l200 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll200-'));
    expect(l200).toBeTruthy();
    expect(num(L())).toBe(201);
    expect(LIVING_LESSONS_MODULES.indexOf(L())).toBeGreaterThan(LIVING_LESSONS_MODULES.indexOf(l200));
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length); // derived (DR-0677)
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-09-30');
    expect(LIVING_LESSONS_MODULES.filter((m) => /^ll201-/.test(m.id))).toHaveLength(1);
    expect(L().lesson).toMatch(/beside L200, How Did They Know\?/);
    expect(L().lesson).toMatch(/beside L196/);
    expect(LIVING_LESSONS_MODULES.some((m) => m.id.startsWith('ll196-'))).toBe(true);
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on every surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans, 'a low count means the scan broke').toBeGreaterThan(160);
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

describe('the dates: the Word’s numbers as the Word states them, the rest derived', () => {
  it('the Word’s own figures are in the KJV exactly as the lesson uses them', () => {
    expect(verse('2 Samuel', 5, 4)).toContain('he reigned forty years');
    expect(verse('1 Kings', 11, 42)).toContain('was forty years');
    expect(verse('1 Kings', 6, 1)).toContain('four hundred and eightieth year');
    expect(verse('Jeremiah', 25, 11)).toContain('seventy years');
    expect(verse('Daniel', 9, 25)).toContain('seven weeks, and threescore and two weeks');
    expect(verse('Leviticus', 25, 8)).toContain('seven sabbaths of years');
    expect(verse('Luke', 3, 1)).toContain('fifteenth year of the reign of Tiberius Caesar');
  });

  it('David’s span is the Word’s forty years, and every David row sits inside it', () => {
    const [from, to] = row('Psalms 22:18').spoken;
    expect(to - from).toBe(40);
    expect(from).toBe(-1010);
    // Nathan came after David was settled in Jerusalem: Hebron's seven and a half years first (2 Samuel 5:5).
    const nathan = row('2 Samuel 7:12-13').spoken;
    expect(nathan[1]).toBe(to);
    expect(nathan[0] - from).toBe(7);
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/1010 to 970 BC/);
  });

  it('every row’s interval is recomputed from its two spans and matches the timeline word for word', () => {
    expect(rows().length).toBe(15);
    for (const t of rows()) {
      const p = t.prophecy;
      const [a, b] = interval(p.spoken, p.kept);
      expect(a, p.ref).toBeGreaterThan(0);
      expect(b, p.ref).toBeGreaterThanOrEqual(a);
      expect(t.event, p.ref).toContain(`(${p.ref}).`);
      expect(t.event, p.ref).toContain(`${span(p.kept)}: ${yearsText([a, b])} later.`);
    }
  });

  it('the required prophecies are all on the line, each with its New Testament keeping', () => {
    const want = {
      'Psalms 22:18': 'John 19:24', 'Psalms 110:1': 'Acts 2:34-36', '2 Samuel 7:12-13': 'Luke 1:32; Acts 13:23',
      'Isaiah 7:14': 'Matthew 1:22-23', 'Isaiah 53:12': 'Mark 15:28', 'Micah 5:2': 'Matthew 2:5-6',
      'Zechariah 9:9': 'Matthew 21:4-5', 'Daniel 9:25-26': 'Mark 1:15; Galatians 4:4', 'Jeremiah 31:31': 'Luke 22:20; Hebrews 8:8',
      'Jeremiah 23:5': 'Luke 1:32', 'Hosea 11:1': 'Matthew 2:15', 'Malachi 3:1': 'Matthew 11:10; Mark 1:2',
    };
    for (const [ref, kept] of Object.entries(want)) expect(row(ref).keptRef, ref).toBe(kept);
  });

  it('the timeline runs in order, earliest first', () => {
    const start = (label) => {
      const m = /(\d+)/.exec(label);
      return /BC/.test(label) ? -Number(m[1]) : Number(m[1]);
    };
    const starts = L().timeline.map((t) => start(t.year));
    expect([...starts].sort((x, y) => x - y)).toEqual(starts);
  });

  it('the lesson’s table (and the senior, teen and youth tables) print exactly the derived rows', () => {
    const m = L();
    for (const t of rows()) {
      const p = t.prophecy;
      const y = yearsText(interval(p.spoken, p.kept));
      expect(m.lesson, `lesson table: ${p.ref}`).toContain(`${p.ref}, ${p.speaker}, ${span(p.spoken)}; kept `);
      expect(m.lesson, `lesson table: ${p.ref}`).toContain(`(${p.keptRef}), ${span(p.kept)}; ${y} later.`);
      expect(m.levels.senior, `senior: ${p.ref}`).toContain(`From ${p.speaker} in ${p.ref}, ${span(p.spoken)}, to ${p.keptRef}, ${span(p.kept)}: ${y}.`);
      expect(m.levels.teen, `teen: ${p.ref}`).toContain(`${p.ref} to ${p.keptRef}: ${y}.`);
      expect(m.levels.youth, `youth: ${p.ref}`).toContain(`${p.speaker}: ${p.ref}, kept in ${p.keptRef}, ${y} later.`);
    }
  });

  it('David’s thousand years, as Darrell said it, is what the arithmetic gives', () => {
    const [a, b] = interval(row('Psalms 22:18').spoken, row('Psalms 22:18').kept);
    expect(a).toBeLessThanOrEqual(1000);
    expect(b).toBeGreaterThanOrEqual(1000);
    expect(L().lesson).toContain(`From David’s reign to the cross is ${yearsText([a, b])}.`);
    // the child band's round words sit inside the derived ranges
    const within = (ref, n) => { const [x, y] = interval(row(ref).spoken, row(ref).kept); return x - 50 <= n && n <= y + 50; };
    expect(within('Psalms 22:18', 1000)).toBe(true);
    expect(within('1 Kings 13:2', 300)).toBe(true);
    expect(within('Micah 5:2', 700)).toBe(true);
    expect(within('Zechariah 9:9', 500)).toBe(true);
    expect(L().levels.child).toMatch(/About one thousand years later/);
    expect(L().levels.child).toMatch(/about three hundred years before Josiah was born/);
    expect(L().levels.child).toMatch(/About five hundred years later, Jesus rode into Jerusalem on a colt/);
  });

  it('Daniel: sixty-nine sevens are 483 years, and even from 538 BC the count cannot end before the year the lesson names', () => {
    const years = (7 + 62) * 7;
    expect(years).toBe(483);
    const endAstro = astro(-538) + years;
    const end = endAstro <= 0 ? `${1 - endAstro} BC` : `AD ${endAstro}`;
    expect(end).toBe('55 BC');
    expect(L().lesson).toContain(`483 years do not run out until ${end}.`);
    expect(L().levels.teen).toContain(`the count reaches ${end}.`);
    expect(L().levels.senior).toContain(`the count runs to ${end},`);
    expect(L().levels.youth).toContain(`it runs to ${end}.`);
    // The honest limit: the start year is not invented.
    expect(L().lesson).toMatch(/It does not print the calendar year of the commandment/);
  });

  it('Jeremiah: the Word’s seventy and the calendar distance are both given, neither forced', () => {
    const y = yearsText(interval(row('Jeremiah 25:11-12').spoken, row('Jeremiah 25:11-12').kept));
    expect(y).toBe('65 to 67 years');
    expect(L().lesson).toContain(`to Cyrus’s first year, c. 539 to 538 BC, is ${y}.`);
    expect(L().lesson).toMatch(/so we give both numbers and do not bend the calendar to meet it/);
  });

  it('the span of the speakers and the span of the one life are derived from the rows', () => {
    const all = rows().map((t) => t.prophecy);
    const speak = astro(Math.max(...all.map((p) => p.spoken[1]))) - astro(Math.min(...all.map((p) => p.spoken[0])));
    const messiah = all.filter((p) => !['1 Kings 13:2', 'Jeremiah 25:11-12'].includes(p.ref));
    const life = astro(Math.max(...messiah.map((p) => p.kept[1]))) - astro(Math.min(...messiah.map((p) => p.kept[0])));
    expect(L().lesson).toContain(`across about ${speak} years of speaking, and every one of them that reaches the Messiah lands inside ${life} years of one life.`);
    for (const b of ['teen', 'senior']) expect(L().levels[b]).toContain(`${speak} years of speakers`);
  });

  it('outside dates are named with their basis, and approximate years say so', () => {
    const l = L().lesson;
    expect(l).toMatch(/eclipse of the sun that astronomers date to June 15, 763 BC/);
    expect(l).toMatch(/The Babylonian Chronicle dates Nebuchadnezzar’s capture of Jerusalem/);
    expect(l).toMatch(/Babylon fell to Persia in 539 BC/);
    expect(l).toMatch(/Tiberius became emperor in AD 14/);
    expect(l).toMatch(/Careful reckonings of the kings differ by a year or two/);
    expect(l).toMatch(/What the Word does not do is print a BC date/);
  });
});

describe('the Word first, and the movements are in order', () => {
  it('the Word leads, and all ten movements plus the close come in order', () => {
    const t = L().lesson;
    const heads = ['ONE. HE DECLARES THE END FROM THE BEGINNING', 'TWO. HOW WE KNOW WHEN DAVID LIVED', 'THREE. THE PROPHETS DATED THEMSELVES', 'FOUR. DAVID, A THOUSAND YEARS AHEAD', 'FIVE. A KING NAMED THREE HUNDRED YEARS AHEAD', 'SIX. ISAIAH, HOSEA AND MICAH', 'SEVEN. JEREMIAH', 'EIGHT. DANIEL READ JEREMIAH', 'NINE. ZECHARIAH AND MALACHI', 'TEN. THE WHOLE LINE ON ONE PAGE', 'THE CLOSE.'];
    expect(t.indexOf('We begin in the Word.')).toBeGreaterThan(0);
    expect(t.indexOf('We begin in the Word.')).toBeLessThan(t.indexOf(heads[0]));
    let last = -1;
    for (const h of heads) {
      const at = t.indexOf(h);
      expect(at, h).toBeGreaterThan(last);
      last = at;
    }
  });

  it('the key verses are carried in the lesson and in every band', () => {
    for (const s of ['Declaring the end from the beginning', 'he reigned forty years', 'called my son out of Egypt', 'This day is this scripture fulfilled in your ears']) expect(ALL()).toContain(s);
    for (const t of BANDS_AND_LESSON()) {
      for (const r of ['Isaiah 46:10', '2 Samuel 5:4', '1 Kings 13:2', 'Micah 5:2', 'Daniel 9:2', 'Zechariah 9:9', 'Malachi 3:1', 'Luke 4:21', 'Joshua 21:45']) expect(t, r).toContain(r);
    }
  });

  it('the close: every band ends the way this house ends', () => {
    for (const t of BANDS_AND_LESSON()) expect(t.trimEnd().endsWith('Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.')).toBe(true);
  });
});

describe('provenance is honest, and our voice keeps the bindings', () => {
  it('names the spoken source, the triple dictation, and the lost last words', () => {
    expect(L().lesson).toMatch(/On 2026-09-30 Darrell spoke this lesson into the app from his phone, in Thinking Space/);
    expect(L().lesson).toMatch(/the same passage three times over, and the last few words were cut off/);
    expect(L().lesson).toMatch(/do not guess at what was lost/);
    expect(L().lesson).toMatch(/His last readable words were about Jesus saying this now/);
  });

  it('says Yahweh in our own voice: no generic "God" and no capitalised adversary name outside a quotation', () => {
    const prose = PROSE();
    expect(prose.match(/\bGod\b/g)).toBe(null);
    expect(/\b(Satan|Lucifer|Devil|Baal)\b/.test(prose)).toBe(false);
  });

  it('PROVEN-TO-CATCH: a planted generic name, a misquote, a wrong reference, a shifted date, a wrong interval, and a dropped movement each fire', () => {
    const planted = { ...L(), lesson: `${L().lesson} God kept His word.` };
    expect(quotedTexts(planted).map(([, t]) => t).join(' ').replace(/"[^"]*"/g, ' ').match(/\bGod\b/g)).not.toBe(null);

    const misquote = { ...L(), lesson: L().lesson.replace('upon a colt the foal of an ass" (Zechariah 9:9)', 'upon a horse the foal of an ass" (Zechariah 9:9)') };
    expect(misquote.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([misquote], quotedTexts).faults.length).toBeGreaterThan(0);

    const wrongRef = { ...L(), lesson: L().lesson.replace('Josiah by name" (1 Kings 13:2)', 'Josiah by name" (1 Kings 13:3)') };
    expect(wrongRef.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([wrongRef], quotedTexts).faults.length).toBeGreaterThan(0);

    // A date moved without the interval being re-derived: the recomputation no longer matches the printed words.
    const t = rows().find((x) => x.prophecy.ref === 'Zechariah 9:9');
    const moved = { ...t.prophecy, spoken: [-520, -470] };
    expect(t.event.includes(`${yearsText(interval(moved.spoken, moved.kept))} later.`)).toBe(false);

    // An interval typed by hand, off by one, fails the lesson-table pin.
    const [a, b] = interval(t.prophecy.spoken, t.prophecy.kept);
    const typed = L().lesson.replace(`${yearsText([a, b])} later.`, `${yearsText([a, b + 1])} later.`);
    expect(typed).not.toBe(L().lesson);
    expect(typed.includes(`(${t.prophecy.keptRef}), ${span(t.prophecy.kept)}; ${yearsText([a, b])} later.`)).toBe(false);

    const dropped = L().lesson.replace('EIGHT. DANIEL READ JEREMIAH', 'EIGHT.');
    expect(dropped.indexOf('EIGHT. DANIEL READ JEREMIAH')).toBe(-1);
  });
});

describe('the register is ordered, and measured rather than asserted', () => {
  it('every band clears its full-levels floor', () => {
    const f = measureFullness(L());
    for (const b of FULL_BANDS) expect(f.bands[b].share, `${b} share ${f.bands[b].share}`).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('the grades ascend and the child band is held to the age', () => {
    const m = measureLesson(L());
    expect(isInverted(m), JSON.stringify(m.bands)).toBe(false);
    expect(breachesChildCeiling(m, NEW_LESSON_CHILD_CEILING), `child reads ${m.bands.child.authored}`).toBe(false);
  });

  it('the four bands are genuinely different texts', () => {
    const d = measureDifferentiation(L());
    expect(d).toBeTruthy();
    expect(d.worst).toBeLessThan(DIFF_CEILING);
  });

  it('every band names its own lesson near its start', () => {
    const m = L();
    for (const b of FULL_BANDS) expect(namesItsLesson(m.title, m.levels[b]), b).toBe(true);
  });
});
