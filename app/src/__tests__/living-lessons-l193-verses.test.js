// @vitest-environment node
// =============================================================================
// L193 — What It Costs to Keep Your Soul — the Morsel, the Son, the Snare, and
// the Finished Work
// =============================================================================
// Darrell, 2026-09-24, sent as "Lesson": a timestamped SUMMARY of a video
// conversation between the host Bryce Crawford and the actor David Henrie
// (child stardom, the emptiness of the career, depression and anxiety, the
// way back, Kevin James's encouragement, a monastery, confession, believers
// for accountability, roles refused at a cost, "selling your soul" as a
// symbolic choice, suffering, and ten pregnancy losses walked with his wife).
// The video was not watched and no transcript was read (DR-0642).
//
// Answered FROM THE WORD ONLY (DR-0098). Every double-quoted span was fetched
// from the in-repo KJV before a word was written; the movements are pinned so
// no later edit can soften them:
//
//   1. the question Jesus asked first (Mark 8:36-37; Matthew 16:26; Luke 4:6-8);
//   2. one morsel: how a birthright is sold (Hebrews 12:16-17; the Genesis 25
//      account is told in prose and never cited, because the Appraisal course
//      owns those verses and pins that no other course shares one);
//   3. the son before the role (Romans 8:14-16; Galatians 4:7; 1 John 3:1;
//      Matthew 3:17);
//   4. the snare of approval (Proverbs 29:25; John 12:43; John 5:44;
//      Galatians 1:10);
//   5. train up a child (Proverbs 22:6; Luke 2:51-52);
//   6. when success feels empty (Ecclesiastes 2:11; 1 Kings 19:4-5;
//      1 Peter 5:7);
//   7. the way back: home, prayer apart, confession, brothers (Luke 15:17-20;
//      Mark 1:35; Luke 5:16; 1 John 1:9; James 5:16; Proverbs 27:17);
//   8. saying no at a price (Hebrews 11:24-26; Daniel 1:8; Matthew 6:24);
//   9. suffering and the finished work (Romans 5:3-5; Romans 8:18, 28;
//      John 19:30; Hebrews 10:10-18; John 1:29);
//  10. ten losses, walked together (John 11:35; Psalm 34:18; Psalm 139:16;
//      2 Samuel 12:23; 1 Thessalonians 4:13; Romans 12:15).
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id.startsWith('ll193-'));
  expect(m, 'L193 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const SURFACES = () => {
  const m = L();
  return [m.bigIdea, m.inApp, m.lesson, ...Object.values(m.levels), ...m.benefits,
    ...m.facilitator.talkingPoints, ...m.quiz.questions.flatMap((q) => [q.q, ...q.options, q.explain])];
};

// The only phrases of a living man's that may stand in quotation marks are the
// ones the SUMMARY itself put in quotation marks, and they stand in single
// quotes so no reader mistakes them for Scripture.
const SUMMARY_PHRASES = ['selling your soul', 'desperation in the air', 'give up a lot', 'make it', 'meritorious redemptive'];
const adversaryFaults = (texts) => texts.filter((text) => {
  const outside = String(text).replace(/"[^"]*"/g, '');
  return /\b(Satan|Devil|Lucifer)\b/.test(outside) || /\bThe devil\b/.test(outside);
});
const strayPhrases = (texts) => {
  const out = [];
  for (const text of texts) {
    for (const span of String(text).matchAll(/(^|[\s(])'([^']{3,60})'(?=[\s.,;:)]|$)/g)) {
      if (!SUMMARY_PHRASES.includes(span[2])) out.push(span[2]);
    }
  }
  return out;
};

describe('L193 is really in the series', () => {
  it('carries all nine fields and four authored bands', () => {
    const m = L();
    expect(m.title).toBe('What It Costs to Keep Your Soul — the Morsel, the Son, the Snare, and the Finished Work');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    expect(m.anchor.ref.startsWith('Mark 8:36-37'), 'the Gospels shelf, from its first anchor').toBe(true);
    expect(m.anchor.ref).toContain('Hebrews 12:16');
    expect(m.anchor.ref).toContain('Hebrews 10:14');
    expect(m.benefits).toHaveLength(14);
    expect(m.quiz.questions).toHaveLength(6);
    expect(m.facilitator.talkingPoints).toHaveLength(12);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('is lesson 193, sits right after L192 in the course, and joins the date ledger at birth', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    // L194 landed on main before L193 (DR-0646), so L193 is not the last
    // module; it is the one immediately after L192, in number order.
    const i = LIVING_LESSONS_MODULES.findIndex((x) => x.id === L().id);
    expect(LIVING_LESSONS_MODULES[i - 1].id.startsWith('ll192-')).toBe(true);
    const next = LIVING_LESSONS_MODULES[i + 1];
    if (next) expect(Number(/^ll(\d+)-/.exec(next.id)[1])).toBeGreaterThan(193);
    expect(LIVING_LESSONS_ADDED[L().id]).toBe('2026-09-24');
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on EVERY surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans, 'a low count means the scan broke').toBeGreaterThan(300);
    expect(scan.faults.map((f) => `${f.where} :: ${f.kind} :: ${f.ref || ''}`)).toEqual([]);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('every double-quoted span carries its reference — a quote means Scripture and nothing else', () => {
    for (const [where, text] of quotedTexts(L())) {
      const quotes = (String(text).match(/"([^"]+)"/g) || []).length;
      const withRef = (String(text).match(/"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g) || []).length;
      expect(withRef, `${where}: ${quotes} quoted spans, ${withRef} with a reference`).toBe(quotes);
    }
  });

  it('uses STRAIGHT quotation marks, no elision, no record id, no percentage, no timestamp at the reader', () => {
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

  it('the summary\'s minute marks live in the DR, never in the reader\'s text, where "58:52" could read as a verse', () => {
    const MARKS = ['3:20', '4:30', '6:22', '15:35', '16:20', '20:00', '22:39', '23:00', '39:00', '33:47', '38:00',
      '48:38', '52:28', '56:57', '58:52', '59:53', '42:13', '43:43', '1:02:16', '1:07:52', '1:10:15'];
    for (const text of SURFACES()) {
      for (const mark of MARKS) {
        // A bare mark (not "Book 3:20") is a timestamp.
        const bare = new RegExp(`(^|[^A-Za-z0-9:]\\s?)(?<![A-Za-z]\\s)${mark.replace(/:/g, ':')}(?![\\d:])`);
        expect(bare.test(String(text)), `a timestamp ${mark} reaches the reader`).toBe(false);
      }
    }
  });
});

describe('provenance is honest (DR-0076 §8)', () => {
  it('the adult lesson and every band say it came from a summary, not the video or a transcript', () => {
    const m = L();
    expect(m.lesson).toMatch(/summary/);
    expect(m.lesson).toMatch(/did not watch the video/);
    expect(m.lesson).toMatch(/did not read a transcript/);
    for (const b of FULL_BANDS) {
      expect(m.levels[b], `${b} must name its source as a summary or write-up`).toMatch(/summary|write-up/);
      expect(m.levels[b], `${b} must say the video was not watched`).toMatch(/not watch|did not watch|was not watched/);
    }
    expect(m.inApp).toMatch(/video was not watched and no transcript was read/);
  });

  it('a living man is quoted ONLY in the summary\'s own phrases, in single quotes', () => {
    expect(strayPhrases(SURFACES()), 'a phrase put in his mouth that the summary did not quote').toEqual([]);
    // And the central phrase is attributed where it stands.
    expect(L().lesson).toMatch(/in the summary's words: there is 'desperation in the air'/);
  });
});

describe('PROVEN-TO-CATCH (DR-0076 §3): the gates fail on the breaks they exist for', () => {
  it('one altered word inside a quotation fails the verbatim scan', () => {
    const m = L();
    const broken = { ...m, lesson: m.lesson.replace('if he shall gain the whole world, and lose his own soul?" (Mark 8:36)', 'if he shall win the whole world, and lose his own soul?" (Mark 8:36)') };
    expect(broken.lesson).not.toBe(m.lesson);
    const scan = scanQuotedVerses([broken], quotedTexts);
    expect(scan.faults.length).toBeGreaterThan(0);
  });

  it('a phrase put in his mouth that the summary did not quote is caught', () => {
    expect(strayPhrases(["He said it was 'the worst place on earth' to grow up."])).toEqual(['the worst place on earth']);
    expect(strayPhrases(["In the summary's words, 'desperation in the air'."])).toEqual([]);
  });

  it('a capitalized adversary outside a verse is caught', () => {
    expect(adversaryFaults(['The devil offered Him the world.', 'Then Satan left.'])).toHaveLength(2);
    // Inside a verse the corpus is left exactly as written.
    expect(adversaryFaults(['"Get thee hence, satan" (Matthew 4:10)', 'In the wilderness the devil spoke.'])).toHaveLength(0);
  });
});

describe('the answer is the Word\'s, and each movement is actually in the lesson', () => {
  const carries = (s) => expect(ALL()).toContain(s);

  it('1. the question Jesus asked first, and the offer made to Him', () => {
    carries('For what shall it profit a man, if he shall gain the whole world, and lose his own soul?');
    carries('Or what shall a man give in exchange for his soul?');
    carries('For what is a man profited, if he shall gain the whole world, and lose his own soul?');
    carries('If thou therefore wilt worship me, all shall be thine.');
    carries('it is written, Thou shalt worship the Lord thy God, and him only shalt thou serve.');
  });

  it('2. one morsel: desperation talked Esau out of his birthright', () => {
    carries('who for one morsel of meat sold his birthright');
    carries('he found no place of repentance, though he sought it carefully with tears');
    expect(L().lesson).toMatch(/He was not about to die\. He was hungry\./);
    // The Appraisal course owns Genesis 25:29-34 and pins that no other
    // course cites one of its verses; this lesson tells the story in prose.
    for (const text of SURFACES()) expect(String(text)).not.toMatch(/Genesis 25/);
  });

  it('3. the son before the role — approval before the work', () => {
    carries('For as many as are led by the Spirit of God, they are the sons of God.');
    carries('Wherefore thou art no more a servant, but a son; and if a son, then an heir of God through Christ.');
    carries('Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God');
    carries('This is my beloved Son, in whom I am well pleased.');
    carries('ye shall be my sons and daughters, saith the Lord Almighty.');
  });

  it('4. the snare of approval', () => {
    carries('The fear of man bringeth a snare: but whoso putteth his trust in the LORD shall be safe.');
    carries('For they loved the praise of men more than the praise of God.');
    carries('for if I yet pleased men, I should not be the servant of Christ.');
  });

  it('5. train up a child', () => {
    carries('Train up a child in the way he should go: and when he is old, he will not depart from it.');
    carries('and was subject unto them');
  });

  it('6. emptiness and depression are named plainly, and help is named in every band (DR-0100)', () => {
    carries('all was vanity and vexation of spirit, and there was no profit under the sun.');
    carries('Arise and eat.');
    carries('Casting all your care upon him; for he careth for you.');
    expect(L().lesson).toMatch(/a pastor, a believing friend, a doctor/);
    for (const b of FULL_BANDS) expect(L().levels[b], `${b} must say to tell someone`).toMatch(/tell|named aloud|Tell/);
  });

  it('7. the way back: home, prayer apart, confession to Yahweh and to one another, and brothers', () => {
    carries('I will arise and go to my father');
    carries('rising up a great while before day, he went out, and departed into a solitary place, and there prayed.');
    carries('And he withdrew himself into the wilderness, and prayed.');
    carries('If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.');
    carries('Confess your faults one to another, and pray one for another, that ye may be healed.');
    carries('Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.');
    // His account is reported as his, and then the Word is taught: no camps.
    expect(L().lesson).toMatch(/He speaks of confession, from his Catholic faith\. Here we teach what the Word itself says about confession/);
  });

  it('8. saying no at a price, honoured', () => {
    carries('By faith Moses, when he was come to years, refused to be called the son of Pharaoh’s daughter');
    carries('Esteeming the reproach of Christ greater riches than the treasures in Egypt');
    carries('purposed in his heart that he would not defile himself');
    expect(L().lesson).toMatch(/That is commendable/);
  });

  it('9. suffering is fruitful, and the offering for sin is finished — stated plainly in every text', () => {
    carries('tribulation worketh patience');
    carries('all things work together for good to them that love God');
    carries('It is finished');
    carries('For by one offering he hath perfected for ever them that are sanctified.');
    carries('Now where remission of these is, there is no more offering for sin.');
    carries('Behold the Lamb of God, which taketh away the sin of the world.');
    expect(L().lesson).toMatch(/We suffer as the redeemed, not in order to be redeemed\./);
    for (const b of FULL_BANDS) expect(L().levels[b], `${b} must state the finished work`).toContain('"It is finished" (John 19:30)');
  });

  it('10. ten losses: tenderness, the Word\'s hope, and no map beyond what David said', () => {
    carries('Jesus wept.');
    carries('The LORD is nigh unto them that are of a broken heart');
    carries('Thine eyes did see my substance, yet being unperfect');
    carries('weep with them that weep.');
    expect(ALL()).toContain('I shall go to him, but he shall not return to me.');
    expect(L().lesson).toMatch(/does not add a map beyond it, and neither will we/);
  });

  it('the close turns to the reader, and the lesson ends the way this house ends', () => {
    carries('whosoever will lose his life for my sake shall find it.');
    expect(L().lesson.trimEnd().endsWith('Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.')).toBe(true);
    for (const b of FULL_BANDS) expect(L().levels[b].trimEnd().endsWith('Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.')).toBe(true);
  });
});

describe('the typographic rules hold on every surface', () => {
  it('the adversary is never capitalized outside a verse, and never opens a sentence', () => {
    expect(adversaryFaults(SURFACES())).toEqual([]);
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

  it('the grades ascend and the child band is held to the AGE, not the corpus', () => {
    const m = measureLesson(L());
    expect(isInverted(m)).toBe(false);
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
