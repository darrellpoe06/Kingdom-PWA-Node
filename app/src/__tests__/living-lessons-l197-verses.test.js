// @vitest-environment node
// =============================================================================
// L197 — Think Soberly — Overlooked, Promoted by Him, and the Hands That Build
// the House (DR-0663)
// =============================================================================
// Darrell, spoken 2026-09-25 (1:57, Whisper small on the NAS CPU, inbox row
// 2e5c8f2e) and typed 2026-09-28 with a second part (inbox row 8248376d):
// not thinking more highly of yourself than you ought; being found when needed
// and overlooked when it would benefit you; promotion from Yahweh; content and
// still scaling; and a conversation about who should work in the church.
//
// Every quoted span was fetched from the in-repo KJV (app/public/bible/kjv)
// before a word was written. The seven movements are pinned so a later edit
// cannot drop one:
//   1. the measure is sober, not small (Romans 12:3-6; 1 Corinthians 4:7;
//      2 Corinthians 10:12; Galatians 6:4);
//   2. found when needed, forgotten when it would benefit you (Genesis 40:14,
//      23; 41:1);
//   3. promotion is His (Genesis 41:9, 14, 38, 40; Psalms 75:6-7; 1 Samuel
//      2:7; Luke 1:52; Proverbs 21:1; Proverbs 18:16; Proverbs 22:29);
//   4. His reasons, as far as the Word goes (Genesis 45:5; 50:20; Deuteronomy
//      29:29; 1 Peter 5:6; Luke 14:10-11; Proverbs 27:2);
//   5. reading the data set of your own life (Haggai 1:5; Lamentations 3:40;
//      Psalms 139:23);
//   6. content and enlarging (Philippians 4:11-13; 1 Timothy 6:6; Isaiah
//      54:2; Matthew 25:21; Deuteronomy 8:18; James 4:15; Psalms 127:1;
//      1 Timothy 5:8; Ecclesiastes 9:10; Colossians 3:23);
//   7. the hands that build the house (1 Kings 5:6, 18; 7:14; Acts 6:3;
//      1 John 2:22; Galatians 5:20; John 16:8, 13; 1 Corinthians 5:13;
//      Romans 14:4; Galatians 6:7; James 5:16; Galatians 6:1;
//      1 Thessalonians 4:11; 1 Samuel 16:7; Romans 12:10; Acts 17:11);
//   and the close (Philippians 2:5, 7, 9).
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const ID = 'll197-think-soberly-overlooked-promoted-by-him-and-the-hands-that-build-the-house';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  expect(m, 'L197 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const PROSE = () => ALL().replace(/"[^"]*"/g, ' ');
const BANDS_AND_LESSON = () => [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])];

describe('L197 is really in the series', () => {
  it('carries all the fields and four authored bands', () => {
    const m = L();
    expect(m.title).toBe('Think Soberly — Overlooked, Promoted by Him, and the Hands That Build the House');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    for (const r of ['Romans 12:3', 'Genesis 40:23', 'Psalms 75:6-7', '1 Kings 5:6', 'Acts 6:3']) expect(m.anchor.ref).toContain(r);
    expect(m.quiz.questions).toHaveLength(6);
    expect(m.facilitator.talkingPoints).toHaveLength(10);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('is the newest lesson, after L195, and carries its day', () => {
    const num = (m) => Number((/^ll(\d+)-/.exec(m.id) || [])[1]);
    const l195 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll195-'));
    expect(l195).toBeTruthy();
    expect(num(L())).toBe(197);
    expect(LIVING_LESSONS_MODULES.indexOf(L())).toBeGreaterThan(LIVING_LESSONS_MODULES.indexOf(l195));
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-09-29');
    expect(LIVING_LESSONS_ADDED[l195.id] <= LIVING_LESSONS_ADDED[ID]).toBe(true);
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on every surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans, 'a low count means the scan broke').toBeGreaterThan(150);
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

  it('1. the measure is sober, not small', () => {
    carries('not to think of himself more highly than he ought to think; but to think soberly, according as God hath dealt to every man the measure of faith');
    carries('Having then gifts differing according to the grace that is given to us');
    carries('what hast thou that thou didst not receive?');
    carries('comparing themselves among themselves, are not wise');
    expect(L().lesson).toMatch(/It does not command a man to think of himself as nothing/);
  });

  it('2. found when needed, forgotten when it would benefit you: the butler’s two years', () => {
    carries('make mention of me unto Pharaoh');
    carries('Yet did not the chief butler remember Joseph, but forgat him');
    carries('And it came to pass at the end of two full years');
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/Genesis 40:23/);
  });

  it('3. promotion is His', () => {
    carries('they brought him hastily out of the dungeon');
    carries('For promotion cometh neither from the east, nor from the west, nor from the south');
    carries('But God is the judge: he putteth down one, and setteth up another');
    carries('He hath put down the mighty from their seats, and exalted them of low degree');
    carries('The king’s heart is in the hand of the LORD');
    // Darrell's own self-correction, from if to since, is kept.
    expect(L().lesson).toMatch(/changed it to since He does/);
  });

  it('4. His reasons, as far as the Word goes, and no further', () => {
    carries('God did send me before you to preserve life');
    carries('The secret things belong unto the LORD our God');
    carries('Humble yourselves therefore under the mighty hand of God, that he may exalt you in due time');
    carries('Friend, go up higher');
    expect(L().lesson).toMatch(/we do not invent one/);
  });

  it('5. reading the data set of your own life', () => {
    carries('Consider your ways');
    carries('Let us search and try our ways, and turn again to the LORD');
    expect(L().lesson).toMatch(/data set of his own life/);
  });

  it('6. content and enlarging, both in the Word, with the household first', () => {
    carries('I have learned, in whatsoever state I am, therewith to be content');
    carries('I can do all things through Christ which strengtheneth me');
    carries('Enlarge the place of thy tent');
    carries('If the Lord will, we shall live, and do this, or that');
    carries('specially for those of his own house');
  });

  it('7. the hands that build the house: hired skill, the Spirit’s office, and the line the Word draws', () => {
    carries('there is not among us any that can skill to hew timber like unto the Sidonians');
    carries('And Solomon’s builders and Hiram’s builders did hew them');
    carries('full of the Holy Ghost and wisdom');
    carries('He is antichrist, that denieth the Father and the Son');
    carries('he will reprove the world of sin');
    carries('he will guide you into all truth');
    carries('Confess your faults one to another, and pray one for another, that ye may be healed');
    carries('study to be quiet, and to do your own business');
    carries('in honour preferring one another');
    // The men Darrell respects are honored and their position is stated, not caricatured.
    expect(L().lesson).toMatch(/men he respects highly/);
    expect(L().lesson).toMatch(/should not work in the church at all, only be in the congregation/);
  });

  it('the close: the Son made Himself of no reputation, and every band ends the way this house ends', () => {
    carries('made himself of no reputation, and took upon him the form of a servant');
    carries('Wherefore God also hath highly exalted him, and given him a name which is above every name');
    for (const t of BANDS_AND_LESSON()) expect(t.trimEnd().endsWith('Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.')).toBe(true);
  });
});

describe('provenance is honest, and our voice keeps the bindings', () => {
  it('names the Whisper rung and model, the typed twin, and renders for meaning', () => {
    expect(L().lesson).toMatch(/Whisper, the small model running on the CPU of our own NAS/);
    expect(L().lesson).toMatch(/On 2026-09-28 he typed the same words again and added a second part/);
    expect(L().lesson).toMatch(/We render his words for their meaning/);
    expect(L().inApp).toMatch(/Whisper, the small model on the NAS CPU/);
  });

  it('points to L160 for the longer study of pride, so the two lessons are not duplicates', () => {
    expect(L().lesson).toMatch(/L160, Pride Is Not Worth Him/);
    expect(LIVING_LESSONS_MODULES.some((m) => m.id.startsWith('ll160-'))).toBe(true);
  });

  it('says Yahweh in our own voice: no generic "God" and no capitalised adversary name outside a quotation', () => {
    const prose = PROSE();
    expect(prose.match(/\bGod\b/g)).toBe(null);
    expect(/\b(Satan|Lucifer|Devil|Baal)\b/.test(prose)).toBe(false);
  });

  it('PROVEN-TO-CATCH: a planted generic name fires the voice check, and a one-word misquote fails the verse gate', () => {
    const planted = { ...L(), lesson: `${L().lesson} God promotes.` };
    const prose = quotedTexts(planted).map(([, t]) => t).join(' ').replace(/"[^"]*"/g, ' ');
    expect(prose.match(/\bGod\b/g)).not.toBe(null);
    const broken = { ...L(), lesson: L().lesson.replace('but forgat him', 'but ignored him') };
    expect(broken.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([broken], quotedTexts).faults.length).toBeGreaterThan(0);
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
