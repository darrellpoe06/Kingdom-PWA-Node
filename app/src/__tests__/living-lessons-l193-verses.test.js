// @vitest-environment node
// =============================================================================
// L193 — How Yahweh Keeps His Word — the Promise, the Test, and the Open Record
// =============================================================================
// Darrell, 2026-09-24, sent as "Lesson": the SUMMARY of a video debate
// (0:00-29:35) on the textual preservation of the Quran compared with the
// Bible. No transcript, no video id, and the summary's last paragraph is cut
// off mid-sentence. The lesson is Word-first and teaches how to weigh
// evidence, not who won (DR-0098), states the manuscript facts at the
// strength their basis allows (DR-0100 / DR-0076), and names the debaters
// only as the summary does.
//
// Every quoted span was fetched from the in-repo KJV (app/public/bible/kjv)
// before a word was written. The movements are pinned so a later edit cannot
// soften them:
//   1. the promise is His (Isaiah 40:8; 1 Peter 1:23-25; Matthew 24:35;
//      Psalms 12:6-7; Psalms 119:89);
//   2. the Word shows how He keeps it (Jeremiah 36:23, 28, 32; Deuteronomy
//      4:2; Proverbs 30:6);
//   3. how to test a claim (1 Thessalonians 5:21; 1 John 4:1-2; Acts 17:11;
//      Proverbs 18:17; Deuteronomy 19:15);
//   4. one scale (Proverbs 20:10; Matthew 7:2);
//   5. two kinds of evidence (Luke 1:2, 4);
//   6. the Bible's open record (Isaiah 53:5; Luke 4:17, 21);
//   7. Matthew 23 in context (23:2, 3, 23; John 10:35; Luke 24:27);
//   8. Galatians 1 in context (1:6, 8, 11);
//   9. love the neighbor (Matthew 22:39; 1 Peter 3:15; Colossians 4:6;
//      Romans 10:1; 2 Corinthians 4:2) and the close (John 20:31).
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const ID = 'll193-how-yahweh-keeps-his-word-the-promise-the-test-and-the-open-record';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  expect(m, 'L193 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const PROSE = () => ALL().replace(/"[^"]*"/g, ' ');
const BANDS_AND_LESSON = () => [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])];

describe('L193 is really in the series', () => {
  it('carries all the fields and four authored bands', () => {
    const m = L();
    expect(m.title).toBe('How Yahweh Keeps His Word — the Promise, the Test, and the Open Record');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    expect(m.anchor.ref).toContain('Isaiah 40:8');
    expect(m.anchor.ref).toContain('Jeremiah 36:28');
    expect(m.anchor.ref).toContain('1 Thessalonians 5:21');
    expect(m.quiz.questions).toHaveLength(6);
    expect(m.facilitator.talkingPoints).toHaveLength(10);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('the week count equals the module count, and the lesson carries its day', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-09-24');
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on every surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans, 'a low count means the scan broke').toBeGreaterThan(100);
    expect(scan.faults.map((f) => `${f.where} :: ${f.kind} :: ${f.ref || ''}`)).toEqual([]);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('every double-quoted span carries its reference — a quote means Scripture, and no debater is quoted', () => {
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

  it('1. the promise is His: the Word stands, and Yahweh is the Keeper', () => {
    carries('The grass withereth, the flower fadeth: but the word of our God shall stand for ever');
    carries('But the word of the Lord endureth for ever. And this is the word which by the gospel is preached unto you');
    carries('by the word of God, which liveth and abideth for ever');
    carries('Heaven and earth shall pass away, but my words shall not pass away');
    carries('The words of the LORD are pure words: as silver tried in a furnace of earth, purified seven times');
    carries('Thou shalt keep them, O LORD, thou shalt preserve them from this generation for ever');
    carries('For ever, O LORD, thy word is settled in heaven');
  });

  it('2. the Word shows how He keeps it: the scroll burned, the words written again', () => {
    carries('he cut it with the penknife, and cast it into the fire that was on the hearth');
    carries('Take thee again another roll, and write in it all the former words that were in the first roll');
    carries('and there were added besides unto them many like words');
    carries('Add thou not unto his words, lest he reprove thee, and thou be found a liar');
    carries('Ye shall not add unto the word which I command you, neither shall ye diminish ought from it');
  });

  it('3. how to test a claim', () => {
    carries('Prove all things; hold fast that which is good');
    carries('believe not every spirit, but try the spirits whether they are of God');
    carries('Every spirit that confesseth that Jesus Christ is come in the flesh is of God');
    carries('searched the scriptures daily, whether those things were so');
    carries('He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him');
    carries('at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established');
  });

  it('4. one scale for every book, and the Bible goes on it first', () => {
    carries('Divers weights, and divers measures, both of them are alike abomination to the LORD');
    carries('with what measure ye mete, it shall be measured to you again');
    expect(L().lesson).toMatch(/Whatever test we apply to the Quran’s preservation, we apply to the Bible’s/);
    for (const b of FULL_BANDS) expect(L().levels[b], `${b} must teach the one scale`).toMatch(/one scale|one fair scale|one honest scale|single scale|same requirement|one scale\./i);
  });

  it('5. two kinds of evidence, and the earliest witnesses weigh most', () => {
    carries('which from the beginning were eyewitnesses, and ministers of the word');
    carries('That thou mightest know the certainty of those things, wherein thou hast been instructed');
    expect(L().lesson).toMatch(/Agreement today shows that readers agree today/);
  });

  it('6. the Bible’s record is open, and the lesson never claims it has no variants', () => {
    carries('But he was wounded for our transgressions, he was bruised for our iniquities');
    carries('there was delivered unto him the book of the prophet Esaias');
    carries('This day is this scripture fulfilled in your ears');
    for (const t of BANDS_AND_LESSON()) {
      expect(t).toMatch(/Great Isaiah Scroll|scroll of Isaiah/);
      expect(t).toMatch(/1947/);
      // The honest admission is in every band: the Bible's copies differ too.
      expect(t).toMatch(/variants|small differences|small changes|not all the same/);
    }
    // The false claim is absent from everything taught (the quiz offers it
    // only as a wrong option, and its explanation corrects it).
    const taught = [...BANDS_AND_LESSON(), L().bigIdea, L().inApp, ...L().benefits, ...L().facilitator.talkingPoints].join(' ');
    expect(/no variants|without a single variant|never been changed|perfectly copied/i.test(taught)).toBe(false);
    const wrong = L().quiz.questions.find((q) => q.options.includes('Because the Bible has no variants'));
    expect(wrong.answer, 'the no-variants option must never be the right answer').not.toBe(wrong.options.indexOf('Because the Bible has no variants'));
  });

  it('7. Matthew 23 in context: the Word read from the seat, not the conduct of the men in it', () => {
    carries('The scribes and the Pharisees sit in Moses’ seat');
    carries('All therefore whatsoever they bid you observe, that observe and do; but do not ye after their works: for they say, and do not');
    carries('have omitted the weightier matters of the law, judgment, mercy, and faith');
    carries('the scripture cannot be broken');
  });

  it('8. Galatians 1 in context: Paul puts himself under the test first', () => {
    carries('so soon removed from him that called you into the grace of Christ unto another gospel');
    carries('But though we, or an angel from heaven, preach any other gospel unto you than that which we have preached unto you, let him be accursed');
    carries('is not after man');
  });

  it('9. the neighbor is loved, never mocked, and the lesson ends the way this house ends', () => {
    carries('Thou shalt love thy neighbour as thyself');
    carries('with meekness and fear');
    carries('my heart’s desire and prayer to God for Israel is, that they might be saved');
    carries('But these are written, that ye might believe that Jesus is the Christ, the Son of God');
    for (const t of BANDS_AND_LESSON()) {
      expect(t).toMatch(/never mock|never make fun|never derided|never to mock/);
      expect(t.trimEnd().endsWith('Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.')).toBe(true);
    }
  });
});

describe('provenance is honest, and our voice keeps the bindings', () => {
  it('says it came from a summary, with no transcript, and that the summary is cut off', () => {
    expect(L().lesson).toMatch(/We did not watch the video and we did not read a transcript/);
    expect(L().lesson).toMatch(/where it stops mid-sentence at the end, we stop too/);
    expect(L().inApp).toMatch(/SUMMARY of a video debate, not from a transcript/);
  });

  it('names the debaters only as the summary does', () => {
    expect(PROSE()).toMatch(/one participant/i);
    expect(PROSE()).toMatch(/the challenger/);
  });

  it('flags what was not read: the Sanaa study located but not opened, and NLR Marcel 2 not examined', () => {
    for (const t of [L().lesson, L().levels.youth, L().levels.teen, L().levels.senior]) {
      expect(t).toMatch(/Sadeghi and Mohsen Goudarzi/);
      expect(t).toMatch(/could not open|unable to consult|could not open it/);
      expect(t).toMatch(/NLR Marcel 2/);
    }
    // The child band carries the same honesty in a child's words.
    expect(L().levels.child).toMatch(/We did not read the big study on it/);
  });

  it('attributes the Sanaa particulars to the summary, not to our own reading', () => {
    for (const t of [L().lesson, L().levels.youth, L().levels.teen, L().levels.senior]) {
      expect(t).toMatch(/as the summary (describes|reports)|the summary says|according to the summary/i);
    }
  });

  it('says Yahweh in our own voice: no generic "God" and no capitalised adversary name outside a quotation', () => {
    const prose = PROSE();
    expect(prose.match(/\bGod\b/g)).toBe(null);
    expect(/\b(Satan|Lucifer|Devil|Baal)\b/.test(prose)).toBe(false);
  });

  it('PROVEN-TO-CATCH: the voice check fires on a planted generic name and a misquoted verse fails the verse gate', () => {
    const planted = { ...L(), lesson: `${L().lesson} God keeps it.` };
    const prose = quotedTexts(planted).map(([, t]) => t).join(' ').replace(/"[^"]*"/g, ' ');
    expect(prose.match(/\bGod\b/g)).not.toBe(null);
    const broken = { ...L(), lesson: L().lesson.replace('shall stand for ever', 'shall stand for all time') };
    expect(scanQuotedVerses([broken], quotedTexts).faults.length).toBeGreaterThan(0);
  });
});

describe('the register is ordered, and measured rather than asserted', () => {
  it('every band clears its full-levels floor', () => {
    const f = measureFullness(L());
    for (const b of FULL_BANDS) {
      expect(f.bands[b].share, `${b} share ${f.bands[b].share} under floor ${FULL_FLOOR[b]}`)
        .toBeGreaterThanOrEqual(FULL_FLOOR[b]);
    }
  });

  it('the grades ascend and the child band is held to the age', () => {
    const m = measureLesson(L());
    expect(isInverted(m), JSON.stringify(m.bands)).toBe(false);
    expect(breachesChildCeiling(m, NEW_LESSON_CHILD_CEILING),
      `child reads ${m.bands.child.authored}; held to ${NEW_LESSON_CHILD_CEILING}`).toBe(false);
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
