// @vitest-environment node
// =============================================================================
// L200 — How Did They Know? — the Record They Read, the Son of David, the Colt,
// and the Books the Word Names (DR-0684)
// =============================================================================
// Darrell spoke this lesson into Thinking Space on his phone on 2026-09-29
// (agent_inbox 8d290c20-1d1c-4901-b8a8-a99b45734e76). The dictation stored
// every partial result (54,115 characters); his 202 words were recovered by a
// fixed rule, recorded with its SQL in
// docs/99-session-notes/2026-09-29-l200-recovered-dictation.md.
//
// Every quoted span was pulled from the in-repo KJV (app/public/bible/kjv) by
// a generator that refused any fragment not in the verse it names. The ten
// movements are pinned so a later edit cannot drop one:
//   1. a waiting people and a public text (Luke 2:25, 38; 3:15; John 4:25;
//      Acts 15:21; Luke 4:16-17, 21);
//   2. the record they had (Luke 24:44; John 5:39; Romans 3:2; 2 Timothy 3:15;
//      Isaiah 53:5);
//   3. the Son of David (2 Samuel 7:12, 16; Psalms 132:11; Isaiah 11:1;
//      Jeremiah 23:5; 1 Chronicles 9:1; Ezra 2:62; Luke 2:3-4; Matthew 1:1;
//      9:27; 22:42);
//   4. Bethlehem (Matthew 2:4-5; Micah 5:2; John 7:42);
//   5. the colt (Zechariah 9:9; Luke 19:30; Matthew 21:4, 9; Psalms 118:26;
//      John 12:16; Genesis 49:11);
//   6. why some knew (Acts 13:27; Luke 24:25, 27, 45; Matthew 11:3, 5;
//      John 5:36; Matthew 3:17; Luke 2:26; Matthew 16:17);
//   7. every place the Gospels say it was fulfilled, by a rule DERIVED here;
//   8. the books the Word names (Numbers 21:14; Joshua 10:13; 2 Samuel 1:18;
//      1 Kings 11:41; 14:19, 29; 1 Chronicles 29:29; 2 Chronicles 9:29;
//      Esther 10:2; Ezra 4:15; Isaiah 40:8);
//   9. what the Word quotes and what only looks the part (Acts 17:28;
//      1 Corinthians 15:33; Titus 1:13; Jude 1:14; Proverbs 30:6; Isaiah 8:20;
//      2 Peter 1:16; 1 Thessalonians 5:21);
//  10. the outside record under the Word (Acts 26:26; Luke 1:2, 4;
//      Isaiah 46:10); and the close (2 Peter 1:19; John 20:31).
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

const ID = 'll200-how-did-they-know-the-record-they-read-the-son-of-david-the-colt-and-the-books-the-word-names';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  expect(m, 'L200 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const PROSE = () => ALL().replace(/"[^"]*"/g, ' ');
const BANDS_AND_LESSON = () => [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])];

// The lesson's stated rule for "every single reference", derived from the KJV
// itself, never typed: every Gospel verse joining "fulfilled" with spoken,
// written, scripture, prophet or prophecy.
const fulfilledByRule = () => {
  const out = [];
  for (const b of ['Matthew', 'Mark', 'Luke', 'John']) {
    const j = JSON.parse(readFileSync(join(KJV, `${b}.json`), 'utf8'));
    j.chapters.forEach((ch, ci) => ch.forEach((t, vi) => {
      if (/fulfilled/.test(t) && /(spoken|written|scripture|prophecy|prophet)/i.test(t)) out.push([b, ci + 1, vi + 1]);
    }));
  }
  return out;
};
const NUMBER_WORDS = { 24: 'twenty-four', 25: 'twenty-five', 26: 'twenty-six', 27: 'twenty-seven', 28: 'twenty-eight' };
const listFor = (rows) => ['Matthew', 'Mark', 'Luke', 'John']
  .map((b) => `${b} ${rows.filter((r) => r[0] === b).map((r) => `${r[1]}:${r[2]}`).join(', ')}`)
  .join('; ');

describe('L200 is really in the series', () => {
  it('carries all the fields, four authored bands, and a quiz', () => {
    const m = L();
    expect(m.title).toBe('How Did They Know? — the Record They Read, the Son of David, the Colt, and the Books the Word Names');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    for (const r of ['Luke 24:44', 'Acts 15:21', '2 Samuel 7:12', '1 Chronicles 9:1', 'Micah 5:2', 'Zechariah 9:9', 'John 12:16', 'Joshua 10:13', 'Proverbs 30:6', 'Isaiah 46:10']) expect(m.anchor.ref).toContain(r);
    expect(m.quiz.questions).toHaveLength(8);
    for (const q of m.quiz.questions) {
      expect(q.options[q.answer], q.q).toBeTruthy();
      expect(q.explain.length).toBeGreaterThan(40);
    }
    expect(m.facilitator.talkingPoints).toHaveLength(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(8);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('is numbered 200, comes after L199, and carries its day', () => {
    const num = (m) => Number((/^ll(\d+)-/.exec(m.id) || [])[1]);
    const l199 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll199-'));
    expect(l199).toBeTruthy();
    expect(num(L())).toBe(200);
    expect(LIVING_LESSONS_MODULES.indexOf(L())).toBeGreaterThan(LIVING_LESSONS_MODULES.indexOf(l199));
    // Counts are derived (DR-0677): the week count is the array, never a literal.
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-09-29');
    expect(LIVING_LESSONS_MODULES.filter((m) => /^ll200-/.test(m.id))).toHaveLength(1);
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on every surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans, 'a low count means the scan broke').toBeGreaterThan(230);
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
      for (const span of String(text).matchAll(/"([^"]+)"/g)) {
        expect(/\.\.\.|…/.test(span[1]), `${where} elides inside a quotation`).toBe(false);
      }
      expect(/DR-\d{4}/.test(text), `${where} recites a record id at the reader`).toBe(false);
      expect(/\d\s*%/.test(text), `${where} states a percentage`).toBe(false);
    }
  });
});

describe('the Word first, and each movement is actually in the lesson', () => {
  const carries = (s) => expect(ALL()).toContain(s);

  it('the Word leads, and all ten movements come in order', () => {
    const t = L().lesson;
    const heads = ['ONE. THEY WERE WAITING', 'TWO. THE RECORD THEY HAD', 'THREE. THE SON OF DAVID', 'FOUR. BETHLEHEM', 'FIVE. THE COLT', 'SIX. NOT EVERYONE KNEW', 'SEVEN. EVERY PLACE THE GOSPELS SAY IT WAS FULFILLED', 'EIGHT. THE OTHER BOOKS THE WORD ITSELF NAMES', 'NINE. WHAT THE WORD QUOTES', 'TEN. THE RECORD OUTSIDE THE WORD, UNDER THE WORD', 'THE CLOSE.'];
    expect(t.indexOf('We begin in the Word.')).toBeGreaterThan(0);
    expect(t.indexOf('We begin in the Word.')).toBeLessThan(t.indexOf(heads[0]));
    let last = -1;
    for (const h of heads) {
      const at = t.indexOf(h);
      expect(at, h).toBeGreaterThan(last);
      last = at;
    }
  });

  it('1. a waiting people and a text read aloud every week', () => {
    carries('waiting for the consolation of Israel');
    carries('being read in the synagogues every sabbath day');
    carries('This day is this scripture fulfilled in your ears');
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/Acts 15:21/);
  });

  it('2. the record they had: the Law, the Prophets and the Psalms, and nothing written after', () => {
    carries('in the law of Moses, and in the prophets, and in the psalms');
    carries('Search the scriptures');
    expect(L().lesson).toMatch(/Were they only using what we call the Old Testament\? Yes\. That is established fact\./);
    expect(L().lesson).toMatch(/Great Isaiah Scroll, found in 1947/);
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/Luke 24:44/);
  });

  it('3. the Son of David: the sworn promise and the kept family record', () => {
    carries('I will set up thy seed after thee');
    carries('So all Israel were reckoned by genealogies');
    carries('because he was of the house and lineage of David');
    expect(L().lesson).toMatch(/Tel Dan in northern Israel in 1993/);
    expect(L().lesson).toMatch(/took it from the public records/);
    for (const t of BANDS_AND_LESSON()) {
      expect(t).toMatch(/2 Samuel 7:1[26]/);
      expect(t).toMatch(/1 Chronicles 9:1/);
    }
  });

  it('4. Bethlehem, answered from the page', () => {
    carries('In Bethlehem of Judaea: for thus it is written by the prophet');
    expect(ALL()).toMatch(/Micah 5:2/);
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/Matthew 2:5/);
  });

  it('5. the colt: written in Zechariah, sent for by the King, understood later', () => {
    carries('riding upon an ass, and upon a colt the foal of an ass');
    carries('ye shall find a colt tied, whereon yet never man sat');
    carries('These things understood not his disciples at the first');
    for (const t of BANDS_AND_LESSON()) {
      expect(t).toMatch(/Zechariah 9:9/);
      expect(t).toMatch(/John 12:16/);
    }
  });

  it('6. the same scrolls, different eyes: the witnesses the Word names', () => {
    carries('This is my beloved Son');
    carries('flesh and blood hath not revealed it unto thee');
    expect(ALL()).toMatch(/Acts 13:27/);
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/Matthew 16:17/);
  });

  it('7. every place the Gospels say it was fulfilled — the count and the list are DERIVED from the KJV', () => {
    const rows = fulfilledByRule();
    const word = NUMBER_WORDS[rows.length];
    expect(word, `the rule now yields ${rows.length}; teach the new count`).toBeTruthy();
    const list = listFor(rows);
    expect(L().lesson).toContain(`By that rule there are ${word} verses: ${list}.`);
    expect(L().levels.teen).toContain(`That gives ${word} verses: ${list}.`);
    expect(L().levels.senior).toContain(`${word} verses, namely ${list}.`);
    for (const b of ['child', 'youth']) expect(L().levels[b]).toContain(`There are ${word}`);
    // L196 is where the wider gathering lives, and it must exist.
    expect(L().lesson).toMatch(/L196, I AM: What the Rest of the Word Tells About Him/);
    expect(LIVING_LESSONS_MODULES.some((m) => m.id.startsWith('ll196-'))).toBe(true);
  });

  it('8. the books the Word itself names, stated plainly as lost', () => {
    carries('the book of the wars of the LORD');
    carries('Is not this written in the book of Jasher?');
    carries('the book of the chronicles of the kings of Judah');
    expect(L().lesson).toMatch(/These named books, as their writers wrote them, are lost; no copy of any of them is known today\. That is established\./);
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/Joshua 10:13/);
  });

  it('9. what the Word quotes is true; what only looks the part is tested and named', () => {
    carries('For we are also his offspring');
    carries('This witness is true');
    carries('Add thou not unto his words');
    expect(L().lesson).toMatch(/The Word does not thereby make the poet a prophet or the whole book Scripture/);
    expect(L().lesson).toMatch(/printed in England in 1751/);
    expect(L().lesson).toMatch(/first printed at Venice in 1625/);
    expect(L().lesson).toMatch(/when it was first written is still not settled/);
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/Proverbs 30:6/);
  });

  it('10. the outside record stands under the Word, not over it', () => {
    carries('this thing was not done in a corner');
    carries('Declaring the end from the beginning');
    expect(L().lesson).toMatch(/They do not stand over the Word to approve it\. They stand under it/);
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/Acts 26:26/);
  });

  it('the close: every band ends the way this house ends', () => {
    carries('that ye might believe that Jesus is the Christ');
    for (const t of BANDS_AND_LESSON()) expect(t.trimEnd().endsWith('Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.')).toBe(true);
  });
});

describe('provenance is honest, and our voice keeps the bindings', () => {
  it('names the spoken source, how the words were recovered, and the one misheard word', () => {
    expect(L().lesson).toMatch(/On 2026-09-29 Darrell spoke this lesson into the app from his phone, in Thinking Space/);
    expect(L().lesson).toMatch(/We recovered his words by a fixed rule, keeping the last and longest form of each sentence/);
    expect(L().lesson).toMatch(/The phone heard one word as coat/);
    expect(L().lesson).toMatch(/Not the Apocrypha, and not the ones that are documented as false/);
    expect(L().inApp).toMatch(/recovered word for word from his phone’s dictation by a fixed rule/);
  });

  it('says Yahweh in our own voice: no generic "God" and no capitalised adversary name outside a quotation', () => {
    const prose = PROSE();
    expect(prose.match(/\bGod\b/g)).toBe(null);
    expect(/\b(Satan|Lucifer|Devil|Baal)\b/.test(prose)).toBe(false);
  });

  it('PROVEN-TO-CATCH: a planted generic name, a one-word misquote, a wrong reference, a wrong count, and a dropped movement each fire', () => {
    const planted = { ...L(), lesson: `${L().lesson} God kept His word.` };
    const prose = quotedTexts(planted).map(([, t]) => t).join(' ').replace(/"[^"]*"/g, ' ');
    expect(prose.match(/\bGod\b/g)).not.toBe(null);

    const misquote = { ...L(), lesson: L().lesson.replace('upon a colt the foal of an ass" (Zechariah 9:9)', 'upon a horse the foal of an ass" (Zechariah 9:9)') };
    expect(misquote.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([misquote], quotedTexts).faults.length).toBeGreaterThan(0);

    const wrongRef = { ...L(), lesson: L().lesson.replace('Is not this written in the book of Jasher?" (Joshua 10:13)', 'Is not this written in the book of Jasher?" (Joshua 10:14)') };
    expect(wrongRef.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([wrongRef], quotedTexts).faults.length).toBeGreaterThan(0);

    const rows = fulfilledByRule();
    const wrongCount = L().lesson.replace(`there are ${NUMBER_WORDS[rows.length]} verses`, `there are ${NUMBER_WORDS[rows.length + 1]} verses`);
    expect(wrongCount).not.toBe(L().lesson);
    expect(wrongCount.includes(`By that rule there are ${NUMBER_WORDS[rows.length]} verses: ${listFor(rows)}.`)).toBe(false);
    const droppedRow = listFor(rows.slice(1));
    expect(L().lesson.includes(`By that rule there are ${NUMBER_WORDS[rows.length]} verses: ${droppedRow}.`)).toBe(false);

    const dropped = L().lesson.replace('They do not stand over the Word to approve it. They stand under it', '');
    expect(dropped).not.toBe(L().lesson);
    expect(/They stand under it/.test(dropped)).toBe(false);
  });
});

describe('the register is ordered, and measured rather than asserted', () => {
  it('every band clears its full-levels floor', () => {
    const f = measureFullness(L());
    for (const b of FULL_BANDS) {
      expect(f.bands[b].share, `${b} share ${f.bands[b].share} under floor ${FULL_FLOOR[b]}`).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
    }
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
