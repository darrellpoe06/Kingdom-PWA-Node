// @vitest-environment node
// =============================================================================
// L198 — The Goldilocks Zone of Curiosity — What He Hides, the Gap He Shows,
// and the Question That Matters (DR-0680)
// =============================================================================
// Darrell forwarded Big Think's "How to find the Goldilocks zone of curiosity"
// (Anne-Laure Le Cunff) on 2026-09-29 with "Lesson" on top, his own summary,
// and a project manager's note (the Gmail lesson door, DR-0312). The article
// is material; the Word teaches (DR-0098). What the article claims is
// attributed to it; what we checked is named as checked (DR-0100).
//
// Every quoted span was fetched from the in-repo KJV (app/public/bible/kjv)
// before a word was written. The eleven movements are pinned so a later edit
// cannot drop one:
//   1. He hides a thing so that kings will search (Proverbs 25:2;
//      Deuteronomy 29:29; the KJV "curious": Exodus 28:8; Psalms 139:15;
//      Acts 19:19);
//   2. He shows it in part, line upon line (Isaiah 28:10; Mark 4:33;
//      John 16:12; 1 Corinthians 3:2; Hebrews 5:14; 1 Corinthians 13:12);
//   3. the man who says we see (John 9:41; 1 Corinthians 8:2; Proverbs 26:12;
//      Revelation 3:17; Job 26:14);
//   4. how Jesus opened a gap (Luke 2:46-47; John 1:38-39; Matthew 16:15;
//      Matthew 13:34, 11; Mark 4:34; Luke 24:17, 27, 32);
//   5. He built the question into the house (Exodus 12:26-27; Joshua 4:6-7;
//      Deuteronomy 6:7; Proverbs 25:11);
//   6. one plain question (Acts 8:30-31, 34-35; John 3:9; Acts 17:11;
//      James 1:5; Proverbs 16:9);
//   7. when it matters, you seek with little (Acts 16:30-31; Luke 19:3-4;
//      Mark 5:28; Jeremiah 29:13; Proverbs 2:4-5; Matthew 13:44; Hebrews 11:6);
//   8. the gaps in the pattern (Mendeleev, stated as history; Psalms 111:2;
//      1 Peter 1:10-12; Luke 24:44-45);
//   9. curiosity with no destination (Acts 17:21, 27; 2 Timothy 3:7;
//      Ecclesiastes 1:8; 3:11; Romans 11:33);
//  10. Nehemiah showed them the gap and the why (Nehemiah 2:13, 17-18; 4:6;
//      Luke 14:28; Habakkuk 2:2);
//  11. the treasure has a name (Colossians 2:3; Matthew 7:7; Jeremiah 33:3;
//      Psalms 119:18; 2 Peter 3:18).
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const ID = 'll198-the-goldilocks-zone-of-curiosity-what-he-hides-the-gap-he-shows-and-the-question-that-matters';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  expect(m, 'L198 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const PROSE = () => ALL().replace(/"[^"]*"/g, ' ');
const BANDS_AND_LESSON = () => [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])];

describe('L198 is really in the series', () => {
  it('carries all the fields and four authored bands', () => {
    const m = L();
    expect(m.title).toBe('The Goldilocks Zone of Curiosity — What He Hides, the Gap He Shows, and the Question That Matters');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    for (const r of ['Proverbs 25:2', 'Deuteronomy 29:29', 'Isaiah 28:10', 'John 9:41', 'John 1:38', 'Luke 24:32', 'Joshua 4:6', 'Acts 8:34', 'Acts 16:30', 'Jeremiah 29:13', '1 Peter 1:10', 'Acts 17:27', 'Nehemiah 2:17', 'Colossians 2:3']) expect(m.anchor.ref).toContain(r);
    expect(m.quiz.questions).toHaveLength(12);
    for (const q of m.quiz.questions) expect(q.options[q.answer], q.q).toBeTruthy();
    expect(m.facilitator.talkingPoints).toHaveLength(15);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('comes after L197, carries its day, and the count is derived (never re-typed)', () => {
    const num = (m) => Number((/^ll(\d+)-/.exec(m.id) || [])[1]);
    const l197 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll197-'));
    expect(l197).toBeTruthy();
    expect(num(L())).toBe(198);
    expect(LIVING_LESSONS_MODULES.indexOf(L())).toBeGreaterThan(LIVING_LESSONS_MODULES.indexOf(l197));
    expect(LIVING_LESSONS_MODULES.filter((m) => num(m) === 198)).toHaveLength(1);
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-09-29');
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on every surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans, 'a low count means the scan broke').toBeGreaterThan(240);
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

  it('1. He hides a thing so that kings will search, and the KJV "curious" is read as the KJV uses it', () => {
    carries('It is the glory of God to conceal a thing: but the honour of kings is to search out a matter');
    carries('The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever');
    carries('And the curious girdle of the ephod, which is upon it, shall be of the same');
    carries('curiously wrought in the lowest parts of the earth');
    carries('Many of them also which used curious arts brought their books together, and burned them before all men');
    expect(L().lesson).toMatch(/The King James Bible does not use curious for the hunger to know/);
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/Proverbs 25:2/);
  });

  it('2. He shows it in part, line upon line', () => {
    carries('line upon line, line upon line; here a little, and there a little');
    carries('as they were able to hear it');
    carries('I have yet many things to say unto you, but ye cannot bear them now');
    carries('I have fed you with milk, and not with meat');
    carries('now I know in part; but then shall I know even as also I am known');
    expect(L().lesson).toMatch(/Milk is not a lesser truth; it is the right size of truth/);
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/Isaiah 28:10/);
  });

  it('3. the man who says we see', () => {
    carries('but now ye say, We see; therefore your sin remaineth');
    carries('he knoweth nothing yet as he ought to know');
    carries('there is more hope of a fool than of him');
    carries('I am rich, and increased with goods, and have need of nothing');
    carries('Lo, these are parts of his ways: but how little a portion is heard of him?');
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/1 Corinthians 8:2/);
  });

  it('4. how Jesus opened a gap: questions, parables, and the Emmaus road', () => {
    carries('both hearing them, and asking them questions');
    carries('What seek ye?');
    carries('Come and see');
    carries('But whom say ye that I am?');
    carries('when they were alone, he expounded all things to his disciples');
    carries('What manner of communications are these that ye have one to another, as ye walk, and are sad?');
    carries('beginning at Moses and all the prophets, he expounded unto them in all the scriptures the things concerning himself');
    carries('Did not our heart burn within us, while he talked with us by the way');
    for (const t of BANDS_AND_LESSON()) {
      expect(t).toMatch(/John 1:38/);
      expect(t).toMatch(/Luke 24:32/);
    }
  });

  it('5. He built the question into the house', () => {
    carries('What mean ye by this service?');
    carries('What mean ye by these stones?');
    carries('the waters of Jordan were cut off before the ark of the covenant of the LORD');
    carries('A word fitly spoken is like apples of gold in pictures of silver');
    expect(L().lesson).toMatch(/set the sign, wait for the question, and have the answer ready/);
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/Joshua 4:6/);
  });

  it('6. one plain question', () => {
    carries('Understandest thou what thou readest?');
    carries('How can I, except some man should guide me?');
    carries('of whom speaketh the prophet this?');
    carries('Then Philip opened his mouth, and began at the same scripture, and preached unto him Jesus');
    carries('searched the scriptures daily, whether those things were so');
    carries('If any of you lack wisdom, let him ask of God');
    carries('A man’s heart deviseth his way: but the LORD directeth his steps');
    for (const t of BANDS_AND_LESSON()) {
      expect(t).toMatch(/Acts 8:34/);
      expect(t).toMatch(/James 1:5/);
    }
  });

  it('7. when it matters, you seek with little', () => {
    carries('Sirs, what must I do to be saved?');
    carries('he ran before, and climbed up into a sycomore tree to see him');
    carries('If I may touch but his clothes, I shall be whole');
    carries('ye shall seek me, and find me, when ye shall search for me with all your heart');
    carries('If thou seekest her as silver, and searchest for her as for hid treasures');
    carries('he is a rewarder of them that diligently seek him');
    for (const t of BANDS_AND_LESSON()) {
      expect(t).toMatch(/Acts 16:30/);
      expect(t).toMatch(/Jeremiah 29:13/);
    }
  });

  it('8. the gaps in the pattern: Mendeleev stated as history, and the prophets searching for a Person', () => {
    carries('The works of the LORD are great');
    carries('Of which salvation the prophets have enquired and searched diligently');
    carries('the sufferings of Christ, and the glory that should follow');
    carries('all things must be fulfilled, which were written in the law of Moses, and in the prophets, and in the psalms, concerning me');
    carries('which things the angels desire to look into');
    // Established history, stated plainly (DR-0100), with its dates.
    expect(L().lesson).toMatch(/In 1871 the Russian chemist Dmitri Mendeleev/);
    expect(L().lesson).toMatch(/Gallium was found in 1875, scandium in 1879 and germanium in 1886/);
    expect(L().lesson).toMatch(/the missing piece was a Person/);
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/Mendeleev/);
  });

  it('9. curiosity with no destination, and where the search stops in this life', () => {
    carries('either to tell, or to hear some new thing');
    carries('Ever learning, and never able to come to the knowledge of the truth');
    carries('the eye is not satisfied with seeing, nor the ear filled with hearing');
    carries('That they should seek the Lord, if haply they might feel after him, and find him, though he be not far from every one of us');
    carries('no man can find out the work that God maketh from the beginning to the end');
    carries('how unsearchable are his judgments, and his ways past finding out!');
    expect(L().lesson).toMatch(/we do not fill them with guesses/);
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/Acts 17:27/);
  });

  it('10. Nehemiah showed them the gap and the why: Darrell’s project manager note answered from the Word', () => {
    carries('viewed the walls of Jerusalem, which were broken down');
    carries('Ye see the distress that we are in, how Jerusalem lieth waste');
    carries('Then I told them of the hand of my God which was good upon me');
    carries('Let us rise up and build');
    carries('for the people had a mind to work');
    carries('sitteth not down first, and counteth the cost');
    carries('Write the vision, and make it plain upon tables, that he may run that readeth it');
    expect(L().lesson).toMatch(/Darrell’s note is a project manager’s/);
    for (const t of BANDS_AND_LESSON()) expect(t).toMatch(/Nehemiah 4:6/);
  });

  it('11. the treasure has a name, and every band ends the way this house ends', () => {
    carries('In whom are hid all the treasures of wisdom and knowledge');
    carries('seek, and ye shall find');
    carries('Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not');
    carries('Open thou mine eyes');
    carries('grow in grace, and in the knowledge of our Lord and Saviour Jesus Christ');
    expect(L().lesson).toMatch(/It is not a fact\. It is a Person\./);
    for (const t of BANDS_AND_LESSON()) {
      expect(t).toMatch(/Colossians 2:3/);
      expect(t.trimEnd().endsWith('Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.')).toBe(true);
    }
  });
});

describe('provenance is honest (DR-0100), and our voice keeps the bindings', () => {
  it('names the article, its author and publisher, the day, and Darrell’s own summary and note', () => {
    expect(L().lesson).toMatch(/On 2026-09-29 Darrell forwarded an article into the app with the word Lesson written above it/);
    expect(L().lesson).toMatch(/How to find the Goldilocks zone of curiosity, by Anne-Laure Le Cunff, sent out by Big Think/);
    expect(L().lesson).toMatch(/We study the article as material; the Word teaches/);
    expect(L().inApp).toMatch(/Anne-Laure Le Cunff, Big Think/);
  });

  it('keeps what the article claims apart from what we checked, and says how far we checked', () => {
    const t = L().lesson;
    expect(t).toMatch(/WHAT THE ARTICLE CLAIMS, AND WHAT WE CHECKED/);
    expect(t).toMatch(/2009 study by Min Jeong Kang and colleagues in the journal Psychological Science/);
    expect(t).toMatch(/2023 study by Markus Spitzer, Janina Janz, Maohua Nie and Andrea Kiesel in Psychological Research/);
    expect(t).toMatch(/we did not re-read either paper in full/);
    expect(t).toMatch(/the curve is a pattern, not a law for every heart/);
    expect(t).toMatch(/The history of Mendeleev’s table is established fact/);
    expect(t).toMatch(/The coffee-shop puzzle is the author’s own story/);
    // The unchecked is never promoted to fact in a band either.
    expect(L().levels.teen).toMatch(/did not read the full papers/);
    expect(L().levels.senior).toMatch(/not read in full/);
  });

  it('says Yahweh in our own voice: no generic "God" and no capitalised adversary name outside a quotation', () => {
    const prose = PROSE();
    expect(prose.match(/\bGod\b/g)).toBe(null);
    expect(/\b(Satan|Lucifer|Devil|Baal)\b/.test(prose)).toBe(false);
  });

  it('PROVEN-TO-CATCH: one changed word in a quotation fails the verse gate, and restored it passes again', () => {
    const original = L().lesson;
    const broken = { ...L(), lesson: original.replace('but the honour of kings is to search out a matter', 'but the honour of kings is to seek out a matter') };
    expect(broken.lesson).not.toBe(original);
    const faults = scanQuotedVerses([broken], quotedTexts).faults;
    expect(faults.length).toBeGreaterThan(0);
    expect(faults.some((f) => f.ref === 'Proverbs 25:2')).toBe(true);
    const restored = { ...broken, lesson: broken.lesson.replace('to seek out a matter', 'to search out a matter') };
    expect(restored.lesson).toBe(original);
    expect(scanQuotedVerses([restored], quotedTexts).faults).toEqual([]);
  });

  it('PROVEN-TO-CATCH: a wrong reference, a planted generic name, and a dropped movement each fire', () => {
    const wrongRef = { ...L(), lesson: L().lesson.replace('What mean ye by these stones?" (Joshua 4:6)', 'What mean ye by these stones?" (Joshua 4:7)') };
    expect(wrongRef.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([wrongRef], quotedTexts).faults.length).toBeGreaterThan(0);
    const planted = { ...L(), lesson: `${L().lesson} God hides things.` };
    const prose = quotedTexts(planted).map(([, t]) => t).join(' ').replace(/"[^"]*"/g, ' ');
    expect(prose.match(/\bGod\b/g)).not.toBe(null);
    const dropped = L().lesson.replace(/TEN\. NEHEMIAH SHOWED THEM THE GAP AND THE WHY\.[\s\S]*?ELEVEN\./, 'ELEVEN.');
    expect(dropped).not.toBe(L().lesson);
    expect(dropped.includes('for the people had a mind to work')).toBe(false);
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
