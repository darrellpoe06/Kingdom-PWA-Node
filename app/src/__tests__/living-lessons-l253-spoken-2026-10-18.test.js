// @vitest-environment node
// =============================================================================
// L253 — "Benefiters or Underminers of the Eternal Kingdom": what Darrell sent
// into the house on 2026-10-18, built the same session (a spoken teaching is
// build input). DR-1102.
// =============================================================================
// One message, opened with "Lesson" and closed as a prayer in Jesus' name:
// inside time we have to see ourselves as either benefiters or underminers of
// the eternal kingdom; if we abuse or undermine each other we are literally
// abusing and undermining Yahweh's Way, will and desire; we are to create ways
// for each other to develop and grow, with outcomes guaranteed not to undermine
// it. Rendered for meaning (DR-0331). His closing words to the builder were
// personal, not teaching, and are not in the lesson.
//
// THE WORD EXPLAINS THE WORD (DR-0098), and this gate pins the spine in every
// place a reader reads: Matthew 12:30 (no neutral ground), Matthew 25:40 (what
// we do to the least, we do to Him), Acts 9:4 (Saul, why persecutest thou me),
// Galatians 6:7 (the harvest He guarantees), and every band closing on Matthew
// 25:40. Abuse is stated as real and getting help as obedience (Psalms 82:4;
// DR-0100), in every band, the child band included.
//
// WHAT THE CHECKS CAUGHT WHILE WRITING, mechanical, before commit: the first
// draft's bands were all under their floors (0.48 / 0.47 / 0.52 / 0.53), the
// reading ladder was inverted (senior 8.23 under teen 8.66), and the youth and
// teen bands never spoke to children. Each band was deepened before its
// practice; the teen in short plain sentences, the senior in long ones. That
// brought them to 0.57 / 0.62 / 0.66 / 0.73 and the ladder to 3.22 / 5.59 /
// 7.08 / 9.76.
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
const verbatimFaults = (L) => {
  const bad = [];
  for (const s of spansOf(L)) {
    const nums = [];
    for (const part of s.label.split(',')) {
      const r = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
      if (r) for (let i = Number(r[1]); i <= Number(r[2]); i += 1) nums.push(i);
      else if (part.trim()) nums.push(Number(part.trim()));
    }
    const joined = nums.map((n) => verse(s.book, s.ch, n)).join(' ');
    if (!joined || !norm(joined).includes(norm(s.quoted))) bad.push(`${s.path} :: ${s.book} ${s.ch}:${s.label} :: "${s.quoted.slice(0, 70)}"`);
  }
  return bad;
};

const ID = 'll253-benefiters-or-underminers-of-the-eternal-kingdom';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const ALL = Object.keys(TEXTS);
const whole = ALL.map((k) => TEXTS[k]).join('\n');
const CLOSING = '"Inasmuch as ye have done it unto one of the least of these my brethren, ye have done it unto me" (Matthew 25:40).';

// Quoted in every band.
const IN_EVERY_BAND = [
  ['no neutral ground', 'Matthew', 12, 30, 'He that is not with me is against me'],
  ['labourers together', '1 Corinthians', 3, 9, 'For we are labourers together with God'],
  ['bite and devour', 'Galatians', 5, 15, 'take heed that ye be not consumed one of another'],
  ['done it unto Me', 'Matthew', 25, 40, 'ye have done it unto me'],
  ['why persecutest thou Me', 'Acts', 9, 4, 'Saul, Saul, why persecutest thou me?'],
  ['rescue is commanded', 'Psalms', 82, 4, 'Deliver the poor and needy: rid them out of the hand of the wicked'],
  ['a new commandment', 'John', 13, 34, 'A new commandment I give unto you, That ye love one another'],
  ['by this shall all men know', 'John', 13, 35, 'By this shall all men know that ye are my disciples'],
  ['all men to be saved', '1 Timothy', 2, 4, 'will have all men to be saved'],
  ['edify one another', '1 Thessalonians', 5, 11, 'edify one another'],
  ['minister the gift', '1 Peter', 4, 10, 'As every man hath received the gift, even so minister the same one to another'],
  ['whatsoever a man soweth', 'Galatians', 6, 7, 'whatsoever a man soweth, that shall he also reap'],
  ['in due season', 'Galatians', 6, 9, 'in due season we shall reap, if we faint not'],
  ['an everlasting kingdom', 'Daniel', 7, 14, 'his kingdom that which shall not be destroyed'],
  ['Thy kingdom come', 'Matthew', 6, 10, 'Thy kingdom come. Thy will be done in earth, as it is in heaven'],
];
const ELSEWHERE = [
  ['number our days', 'Psalms', 90, 12, 'So teach us to number our days'],
  ['a kingdom which cannot be moved', 'Hebrews', 12, 28, 'receiving a kingdom which cannot be moved'],
  ['redeeming the time', 'Ephesians', 5, 16, 'Redeeming the time, because the days are evil'],
  ['translated into His kingdom', 'Colossians', 1, 13, 'hath translated us into the kingdom of his dear Son'],
  ['take heed how he buildeth', '1 Corinthians', 3, 10, 'But let every man take heed how he buildeth thereupon'],
  ['by love serve', 'Galatians', 5, 13, 'by love serve one another'],
  ['did it not to Me', 'Matthew', 25, 45, 'ye did it not to me'],
  ['I am Jesus whom thou persecutest', 'Acts', 9, 5, 'I am Jesus whom thou persecutest'],
  ['ye sin against Christ', '1 Corinthians', 8, 12, 'wound their weak conscience, ye sin against Christ'],
  ['he is a liar', '1 John', 4, 20, 'If a man say, I love God, and hateth his brother, he is a liar'],
  ['a millstone', 'Matthew', 18, 6, 'it were better for him that a millstone were hanged about his neck'],
  ['walk humbly', 'Micah', 6, 8, 'to do justly, and to love mercy, and to walk humbly with thy God'],
  ['things which make for peace', 'Romans', 14, 19, 'follow after the things which make for peace'],
  ['good to the use of edifying', 'Ephesians', 4, 29, 'Let no corrupt communication proceed out of your mouth'],
  ['provoke unto love', 'Hebrews', 10, 24, 'consider one another to provoke unto love and to good works'],
  ['teach others also', '2 Timothy', 2, 2, 'who shall be able to teach others also'],
  ['he that watereth', 'Proverbs', 11, 25, 'he that watereth shall be watered also himself'],
  ['not in vain', '1 Corinthians', 15, 58, 'your labour is not in vain in the Lord'],
  ['not return void', 'Isaiah', 55, 11, 'it shall not return unto me void'],
  ['do good unto all', 'Galatians', 6, 10, 'let us do good unto all men'],
  ['ask in My name', 'John', 14, 13, 'And whatsoever ye shall ask in my name, that will I do'],
];

describe('L253 exists, is numbered, and is dated the day it was sent', () => {
  it('is in the catalog exactly once, after L252', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 253)).toHaveLength(1);
    expect(claimed.indexOf(253)).toBeGreaterThan(claimed.indexOf(252));
  });
  it('carries the day it was sent, on or after L252', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-18');
    expect(LIVING_LESSONS_ADDED['ll252-this-life-is-the-curriculum-made-to-be-his-temple'] <= LIVING_LESSONS_ADDED[ID]).toBe(true);
  });
  it('names Darrell as the one who brought it, with his message and his prayer', () => {
    expect(L.lesson).toContain('This lesson was brought into this house by Darrell on the eighteenth of October');
    expect(L.lesson).toContain('closed as a prayer, in Jesus’ name');
  });
  it('the adult lesson walks seven sections, in his order', () => {
    const order = ['ONE. INSIDE TIME', 'TWO. BENEFITERS OR UNDERMINERS', 'THREE. WHAT WE DO TO EACH OTHER, WE DO TO HIM', 'FOUR. HIS WAY, HIS WILL, HIS DESIRE', 'FIVE. CREATING WAYS FOR EACH OTHER TO GROW', 'SIX. OUTCOMES HE GUARANTEES', 'SEVEN. THE PRACTICE'];
    let at = -1;
    for (const h of order) {
      const i = L.lesson.indexOf(h);
      expect(i, `${h} is missing or out of order`).toBeGreaterThan(at);
      at = i;
    }
  });
});

describe('L253 carries his message in every band', () => {
  it.each([
    [/Darrell/, 'Darrell by name'],
    [/benefiter/i, 'benefiters'],
    [/underminer/i, 'underminers'],
    [/eternal kingdom/i, 'the eternal kingdom'],
    [/inside time/i, 'inside time'],
    [/Jesus’ name/, 'his prayer in Jesus’ name'],
    [/grow/i, 'ways for each other to grow'],
    [/trust/i, 'telling a trusted person'],
  ])('%s — %s', (re, what) => {
    for (const k of ALL) expect(re.test(TEXTS[k]), `${k} drops ${what}`).toBe(true);
  });
  it.each(['adult', 'youth', 'teen', 'senior'])('%s says abuse and undermining wound Yahweh’s Way, will and desire', (k) => {
    expect(/abus/i.test(TEXTS[k]), `${k} drops abuse`).toBe(true);
    expect(/Way, (His )?will and (His )?desire/.test(TEXTS[k]), `${k} drops His Way, will and desire`).toBe(true);
  });
  it.each(ALL)('%s closes on Matthew 25:40', (k) => {
    expect(TEXTS[k].trim().endsWith(CLOSING), `${k} does not close on Matthew 25:40`).toBe(true);
  });
  it.each(ALL)('%s quotes every strand every band carries', (k) => {
    for (const [why, book, ch, n] of IN_EVERY_BAND) {
      expect(TEXTS[k].includes(`(${book} ${ch}:${n}`), `${k} drops ${why} (${book} ${ch}:${n})`).toBe(true);
    }
  });
  it('leaves his personal closing words out of the lesson', () => {
    expect(JSON.stringify(L)).not.toMatch(/Love you too/i);
  });
});

describe('L253 — every quoted span is the verse', () => {
  it.each([...IN_EVERY_BAND, ...ELSEWHERE])('%s — %s %s:%s', (_why, book, ch, n, span) => {
    const v = verse(book, ch, n);
    expect(v, `${book} ${ch}:${n} resolves`).toBeTruthy();
    expect(v.includes(span), `the span is not in ${book} ${ch}:${n}`).toBe(true);
    expect(whole.includes(span), `the lesson does not carry ${book} ${ch}:${n}`).toBe(true);
  });
  const spans = L ? spansOf(L) : [];
  it('finds a substantial number of referenced spans', () => {
    expect(spans.length).toBeGreaterThan(150);
  });
  it('every referenced span is verbatim in the verse it cites, case and all', () => {
    const bad = verbatimFaults(L);
    expect(bad, `not His words as written:\n${bad.join('\n')}`).toEqual([]);
  });
  it('would catch an altered quotation (proven-to-catch)', () => {
    const altered = { ...L, levels: { ...L.levels, child: L.levels.child.replace('why persecutest thou me?"', 'why do you hurt them?"') } };
    expect(altered.levels.child).not.toBe(L.levels.child);
    expect(verbatimFaults(altered).some((f) => f.includes('Acts 9:4'))).toBe(true);
    const yahwehed = { ...L, lesson: L.lesson.replace('For we are labourers together with God:', 'For we are labourers together with Yahweh:') };
    expect(yahwehed.lesson).not.toBe(L.lesson);
    expect(verbatimFaults(yahwehed).some((f) => f.includes('1 Corinthians 3:9'))).toBe(true);
  });
  it('uses the corpus apostrophe inside quotations', () => {
    for (const s of spans) expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a quotation`).toBe(false);
  });
  it('marks no elision and recites no record', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });
  it('every anchor reference is named in the lesson', () => {
    for (const ref of L.anchor.ref.split(';').map((r) => r.trim())) {
      const head = ref.replace(/-\d+$/, '');
      expect(L.lesson.includes(`(${head})`) || L.lesson.includes(`(${head}`) , `${ref} is anchored but never named`).toBe(true);
    }
  });
});

describe('L253 — four bands, each carrying the whole message', () => {
  const measured = measureFullness(L);
  it.each(BANDS)('%s clears its floor', (b) => {
    expect(measured.bands[b].share).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });
  it('reports no short band, and would report one trimmed back (proven-to-catch)', () => {
    expect(shortBands(measured)).toEqual([]);
    const faked = { ...L, levels: { ...L.levels, teen: L.levels.teen.slice(0, 600) } };
    expect(shortBands(measureFullness(faked))).toContain('teen');
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

describe('L253 — two stories, and Yahweh in our voice', () => {
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
    expect(light.title).toBe('The Two Shovels');
    expect(/the kind that digs the bed and the kind that fills it back in/.test(light.body)).toBe(true);
    expect(solemn.title).toBe('The Volunteer Schedule');
    expect(/started training two new volunteers a month/.test(solemn.body)).toBe(true);
  });
  it.each(ALL)('%s names Him by covenant name and never the generic in our prose', (k) => {
    const ours = ourProseOnly(TEXTS[k]);
    expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
    expect(/\bGod(?:'s|’s)?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
  });
  it('the generic-name check would catch "God" in our voice (proven-to-catch)', () => {
    expect(/\bGod(?:'s|’s)?\b/.test(ourProseOnly(`${TEXTS.child} Then God was glad.`))).toBe(true);
  });
  it('the quiz answers are not all in one position', () => {
    const at = L.quiz.questions.map((q) => q.answer);
    expect(new Set(at).size).toBeGreaterThan(1);
    for (const q of L.quiz.questions) expect(q.options[q.answer]).toBeTruthy();
  });
});
