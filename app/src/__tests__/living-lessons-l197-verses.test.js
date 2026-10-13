// @vitest-environment node
// =============================================================================
// L197 — Think Soberly — Overlooked, Promoted by Him, and the Hands That Build
// the House (DR-0663; revised by DR-0676)
// =============================================================================
// Darrell, spoken 2026-09-25 (1:57, Whisper small on the NAS CPU, inbox row
// 2e5c8f2e) and typed 2026-09-28 with a second part (inbox row 8248376d):
// not thinking more highly of yourself than you ought; being found when needed
// and overlooked when it would benefit you; promotion from Yahweh; content and
// still scaling; and a conversation about who should work in the church.
// On 2026-09-29 Darrell said it had not landed his questions (DR-0676): may
// skilled labor who do not profess faith serve (the sound board), finding
// Yahweh is a journey He leads, how could Judas work with Jesus, a donkey
// spoke, policing versus restoring, and only The Governor, the Holy Spirit.
// DR-0676 amends DR-0663's "does not rule for either side": the lesson now
// TEACHES the Word's answer to each question.
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
//   7. the hands that build the house (1 Kings 5:6, 18; 7:13-14;
//      2 Chronicles 2:13, 17-18; Ezra 3:7; 1 Chronicles 15:16, 22;
//      Acts 6:3-4; 1 John 2:22; Galatians 5:20);
//   8. finding Yahweh is a journey He leads (John 6:44, 65; Ephesians 2:8-9;
//      Philippians 1:6; Acts 16:14; 1 Corinthians 14:24-25);
//   9. Judas at the table (Luke 6:13, 16; Matthew 10:1, 4, 5; John 12:6;
//      13:29; 6:64, 70; 13:28; 13:18);
//  10. a donkey spoke, and a king who had not known Him (Numbers 22:28, 31;
//      Isaiah 44:28; 45:4; Ezra 1:1-2);
//  11. restore, do not police (Galatians 6:1-2; James 5:20; Romans 14:4;
//      Matthew 7:5; 2 Timothy 3:16; Hebrews 4:12; Matthew 23:4; 3 John 9-10;
//      Ezekiel 34:4; 1 Peter 5:3; Matthew 18:15-17; 1 Corinthians 5:1, 5,
//      12-13; 2 Corinthians 2:7-8; James 5:16);
//  12. only The Governor, the Holy Spirit (John 16:8, 13; Romans 8:14;
//      John 14:26; Zechariah 4:6; 1 Samuel 16:7; Romans 12:10; Acts 17:11);
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
    for (const r of ['Romans 12:3', 'Genesis 40:23', 'Psalms 75:6-7', '1 Kings 5:6', '1 Kings 7:14', 'Acts 6:3', 'John 6:44', 'John 6:64', 'Numbers 22:28', 'Galatians 6:1', 'Matthew 18:15', 'John 16:13']) expect(m.anchor.ref).toContain(r);
    expect(m.quiz.questions).toHaveLength(12);
    expect(m.facilitator.talkingPoints).toHaveLength(16);
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
    expect(scan.spans, 'a low count means the scan broke').toBeGreaterThan(350);
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

  it('7. the hands that build the house: the Word answers yes to skilled hands, and keeps its own line', () => {
    carries('there is not among us any that can skill to hew timber like unto the Sidonians');
    carries('And Solomon’s builders and Hiram’s builders did hew them');
    carries('And Solomon numbered all the strangers that were in the land of Israel');
    carries('And king Solomon sent and fetched Hiram out of Tyre');
    carries('filled with wisdom, and understanding, and cunning to work all works in brass');
    carries('because he was skilful');
    carries('full of the Holy Ghost and wisdom');
    carries('He is antichrist, that denieth the Father and the Son');
    // His question and his own line, rendered for meaning, are in the lesson.
    expect(L().lesson).toMatch(/skilled labor help deliver the best sound for the music ministry, the sound boards/);
    expect(L().lesson).toMatch(/Anti-Christ ways, of course not/);
    // It answers; it no longer declines to rule (DR-0676 amends DR-0663).
    expect(L().lesson).toMatch(/So the Word’s answer to Darrell’s first question is yes/);
    expect(L().lesson).toMatch(/That is not two camps; that is how the Word orders the house/);
    // Where the Word is silent (Hiram's faith; a sound board by name), the lesson says so and stops.
    expect(L().lesson).toMatch(/It does not tell us his faith, and we do not add it/);
    expect(L().lesson).toMatch(/The Word names no sound board/);
    // The men Darrell respects are honored and their position is stated, not caricatured.
    expect(L().lesson).toMatch(/men he respects highly/);
    expect(L().lesson).toMatch(/should not work in the church at all, only be in the congregation/);
    for (const t of BANDS_AND_LESSON()) {
      expect(t).toMatch(/1 Kings 5:(6|18)/);
      expect(t).toMatch(/Acts 6:3/);
      expect(t).toMatch(/1 John 2:22/);
    }
  });

  it('8. finding Yahweh is a journey, and He leads it', () => {
    carries('No man can come to me, except the Father which hath sent me draw him');
    carries('no man can come unto me, except it were given unto him of my Father');
    carries('For by grace are ye saved through faith; and that not of yourselves: it is the gift of God');
    carries('he which hath begun a good work in you will perform it until the day of Jesus Christ');
    carries('there come in one that believeth not, or one unlearned, he is convinced of all');
    expect(L().lesson).toMatch(/He leads us to believe, not even us/);
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/John 6:44/);
  });

  it('9. Judas at the table: chosen, sent, the bag, known, not exposed, and no further than the Word', () => {
    carries('of them he chose twelve, whom also he named apostles');
    carries('These twelve Jesus sent forth');
    carries('he was a thief, and had the bag, and bare what was put therein');
    carries('For Jesus knew from the beginning who they were that believed not, and who should betray him');
    carries('Have not I chosen you twelve, and one of you is a devil?');
    carries('Now no man at the table knew for what intent he spake this unto him');
    carries('I know whom I have chosen: but that the scripture may be fulfilled');
    expect(L().lesson).toMatch(/and it does not give us more\. We stay with what it says/);
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/John 6:64/);
  });

  it('10. a donkey spoke, and a king who had not known Him', () => {
    carries('And the LORD opened the mouth of the ass');
    carries('the LORD opened the eyes of Balaam');
    carries('I have surnamed thee, though thou hast not known me');
    carries('the LORD stirred up the spirit of Cyrus king of Persia');
    carries('he hath charged me to build him an house at Jerusalem');
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/Numbers 22:28/);
  });

  it('11. restore the one who falls, do not police; and the whole counsel on sin within is taught, not hidden', () => {
    carries('restore such an one in the spirit of meekness; considering thyself, lest thou also be tempted');
    carries('Bear ye one another’s burdens, and so fulfil the law of Christ');
    carries('Who art thou that judgest another man’s servant?');
    carries('first cast out the beam out of thine own eye');
    carries('profitable for doctrine, for reproof, for correction, for instruction in righteousness');
    carries('is a discerner of the thoughts and intents of the heart');
    carries('For they bind heavy burdens and grievous to be borne');
    carries('loveth to have the preeminence among them');
    carries('with force and with cruelty have ye ruled them');
    carries('Neither as being lords over God’s heritage, but being ensamples to the flock');
    // the whole counsel: Matthew 18 and 1 Corinthians 5, with restoration as the aim
    carries('go and tell him his fault between thee and him alone: if he shall hear thee, thou hast gained thy brother');
    carries('tell it unto the church');
    carries('that the spirit may be saved in the day of the Lord Jesus');
    carries('do not ye judge them that are within?');
    carries('ye ought rather to forgive him, and comfort him');
    carries('Confess your faults one to another, and pray one for another, that ye may be healed');
    expect(L().lesson).toMatch(/That is restoration with a process\. It is not a watch set over every soul/);
    for (const t of BANDS_AND_LESSON()) {
      expect(t).toMatch(/Galatians 6:1/);
      expect(t).toMatch(/Matthew 18:15/);
    }
  });

  it('12. only The Governor, the Holy Spirit, keeping Darrell’s title and its capitals', () => {
    carries('he will reprove the world of sin');
    carries('he will guide you into all truth');
    carries('For as many as are led by the Spirit of God, they are the sons of God');
    carries('Not by might, nor by power, but by my spirit, saith the LORD of hosts');
    carries('in honour preferring one another');
    for (const t of BANDS_AND_LESSON()) {
      expect(t).toMatch(/The Governor, the Holy Spirit/);
      expect(t).toMatch(/Zechariah 4:6|John 16:13/);
    }
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
    expect(L().lesson).toMatch(/On 2026-09-29 he came back and said the lesson had not landed his questions/);
    expect(L().inApp).toMatch(/his questions of 2026-09-29/);
    expect(L().bigIdea).toMatch(/on 2026-09-29 came back and said it had not landed his questions/);
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

  it('PROVEN-TO-CATCH: the new answers are pinned — a misquoted Judas verse, a wrong donkey reference, and a dropped answer each fire', () => {
    const judas = { ...L(), lesson: L().lesson.replace('who should betray him', 'who might betray him') };
    expect(judas.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([judas], quotedTexts).faults.length).toBeGreaterThan(0);
    const donkey = { ...L(), lesson: L().lesson.replace('mouth of the ass, and she said unto Balaam" (Numbers 22:28)', 'mouth of the ass, and she said unto Balaam" (Numbers 23:28)') };
    expect(donkey.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([donkey], quotedTexts).faults.length).toBeGreaterThan(0);
    const unanswered = L().lesson.replace('So the Word’s answer to Darrell’s first question is yes.', '');
    expect(unanswered).not.toBe(L().lesson);
    expect(/So the Word’s answer to Darrell’s first question is yes/.test(unanswered)).toBe(false);
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
