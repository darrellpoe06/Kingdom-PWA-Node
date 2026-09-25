// @vitest-environment node
// =============================================================================
// L194 — I AM: Who He Said He Was — Every Hearer, All of Them
// =============================================================================
// Darrell, 2026-09-24, after reading L191 (sixteen hearers):
//
//   "Lesson with all of them not just 16... keep that but I wante all of them
//    in a lesson!!!!"
//
// and, as spoken teaching the same day (rendered for meaning, DR-0331): not of
// this world, yet He framed the worlds; we see a sliver; matter is nearly all
// empty; eyes can't see and can, and the soul is the same; who Jesus said He
// was, is and is to come; Worthy, His blood has the Code.
//
// What is pinned here, so no later edit can soften it (DR-0604 pattern, DR-0646):
//   1. L191 is kept as it was, carrying only one added line that points here;
//   2. the COUNT is a count of the record under a STATED rule: fifty-four
//      numbered occasions in order, the rule and the six exclusions written
//      out, the tallies by kind derived from the numbered list, and the L191
//      reconciliation (eighteen matched, thirty-six new);
//   3. every quoted span is the verse it names, on every surface;
//   4. the science is stated to DR-0100 (established, with its basis; the
//      approximate public figure labeled approximate; Darrell's numbers gently
//      corrected) and labeled an illustration, never a proof;
//   5. I AM sits John 8:58 beside Exodus 3:14; was, is and is to come each carry
//      His own words; Worthy carries Revelation 5:9-12, 1 Peter 1:18-19 and
//      Hebrews 9:22, and "His blood has the Code" is attributed to Darrell;
//   6. the register gates, measured.
// Each structural check is PROVEN TO CATCH on a deliberately broken copy.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id.startsWith('ll194-'));
  expect(m, 'L194 must be in the series').toBeTruthy();
  return m;
};
const L191 = () => LIVING_LESSONS_MODULES.find((x) => x.id.startsWith('ll191-'));
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');

// The numbered occasions, as written in the adult lesson: OCCASION n: HEAD. ...
function occasions(lesson) {
  return [...String(lesson).matchAll(/OCCASION (\d+): /g)].map((m) => Number(m[1]));
}
function inOrderOneTo(ns, n) {
  return ns.length === n && ns.every((x, i) => x === i + 1);
}
// The L191 tag each occasion carries: "In L191: ..." or "New here."
function tags(lesson) {
  const parts = String(lesson).split(/OCCASION \d+: /).slice(1);
  return parts.map((p) => {
    const m = p.match(/In L191: ([^.]+)\.|New here\./);
    return m ? (m[1] || 'new') : null;
  });
}

describe('L194 is really in the series, and L191 is kept', () => {
  it('carries all nine fields and four authored bands, with I AM in the title', () => {
    const m = L();
    expect(m.title).toBe('I AM: Who He Said He Was — Every Hearer, All of Them');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    for (const r of ['John 8:58', 'Exodus 3:14', 'Hebrews 11:3', 'Revelation 5:9-12', '1 Peter 1:18-19', 'Hebrews 9:22']) {
      expect(m.anchor.ref).toContain(r);
    }
    expect(m.benefits).toHaveLength(14);
    expect(m.quiz.questions).toHaveLength(6);
    expect(m.facilitator.talkingPoints).toHaveLength(10);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('the week count still equals the module count', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('L191 is kept as it was: its sixteen and its opening stand, and it carries ONE line pointing here', () => {
    const l = L191().lesson;
    expect(l).toMatch(/This lesson walks sixteen of them\. The Gospels hold more; sixteen is enough to see the pattern and to count\./);
    expect(l.split('All of them: L194').length - 1).toBe(1);
    expect(l).toContain('All of them: L194, I AM: Who He Said He Was — Every Hearer, All of Them, walks every occasion the four Gospels record, fifty-four by a stated rule.');
    expect(L191().title).toBe('Who He Said He Was — Every Hearer, Every Situation, and the Keys of Hell and of Death');
  });

  it('carries no color field: nothing here can put red on anything but the Blood (DR-0099)', () => {
    for (const k of Object.keys(L())) expect(/color|colour|highlight/i.test(k), `field ${k}`).toBe(false);
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on EVERY surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans, 'a low count means the scan broke').toBeGreaterThan(400);
    expect(scan.faults.map((f) => `${f.where} :: ${f.kind} :: ${f.ref || ''}`)).toEqual([]);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('PROVEN TO CATCH: one changed word in one quotation is a fault', () => {
    const broken = { ...L(), lesson: L().lesson.replace('"Before Abraham was, I am" (John 8:58)', '"Before Abraham was, I was" (John 8:58)') };
    expect(broken.lesson).not.toBe(L().lesson);
    const scan = scanQuotedVerses([broken], quotedTexts);
    expect(scan.faults.some((f) => f.ref === 'John 8:58' && f.kind === 'not-the-verse')).toBe(true);
  });

  it('every double-quoted span carries its reference — a quote means Scripture and nothing else', () => {
    for (const [where, text] of quotedTexts(L())) {
      const quotes = (String(text).match(/"([^"]+)"/g) || []).length;
      const withRef = (String(text).match(/"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g) || []).length;
      expect(withRef, `${where}: ${quotes} quoted spans, ${withRef} with a reference`).toBe(quotes);
    }
  });

  it('uses straight quotation marks, no ellipsis inside a quotation, and recites no record id', () => {
    const all = ALL();
    expect(all.includes('“')).toBe(false);
    expect(all.includes('”')).toBe(false);
    for (const [where, text] of quotedTexts(L())) {
      for (const span of String(text).matchAll(/"([^"]+)"/g)) {
        expect(/\.\.\.|…/.test(span[1]), `${where} elides inside a quotation`).toBe(false);
      }
      expect(/DR-\d{4}/.test(text), `${where} recites a record id at the reader`).toBe(false);
    }
  });
});

describe('the count is a count of the record, under a stated rule', () => {
  it('fifty-four numbered occasions, in order, one to fifty-four', () => {
    expect(inOrderOneTo(occasions(L().lesson), 54)).toBe(true);
    expect(L().lesson).toMatch(/By that rule the four Gospels record fifty-four occasions\./);
  });

  it('PROVEN TO CATCH: an occasion dropped or two swapped breaks the sequence', () => {
    const dropped = L().lesson.replace('OCCASION 27: ', 'THE TEMPLE: ');
    expect(inOrderOneTo(occasions(dropped), 54)).toBe(false);
    const swapped = L().lesson.replace('OCCASION 3: ', 'OCCASION X: ').replace('OCCASION 4: ', 'OCCASION 3: ').replace('OCCASION X: ', 'OCCASION 4: ');
    expect(inOrderOneTo(occasions(swapped), 54)).toBe(false);
  });

  it('the rule and the six exclusions are written out in words', () => {
    const l = L().lesson;
    expect(l).toMatch(/THE COUNTING RULE, STATED FIRST\./);
    expect(l).toMatch(/An occasion is one scene, meaning one time, one place and one set of hearers/);
    expect(l).toMatch(/the parallels are joined into one occasion and every reference is given/);
    expect(l).toMatch(/still counted once/);
    expect(l).toMatch(/Six kinds of passages are not in the count/);
    for (const x of ['First, words others spoke about Him', 'Second, challenges', 'Third, claims made by an act', 'Fourth, His predictions', 'Fifth, the claims woven through His teaching', 'Sixth, everything outside the four Gospels']) {
      expect(l).toContain(x);
    }
    expect(l).toMatch(/A reader who counts them in will reach a larger number, never a different Christ\./);
  });

  it('the stated tallies are derived from the list, not asserted beside it', () => {
    const l = L().lesson;
    const m = l.match(/He named who He was in (\d+) of them: ([\d, and]+)\. He received or corrected a confession in (\d+): ([\d, and]+)\. He answered a direct question about who He is in (\d+): ([\d, and]+)\. Unclean spirits cried out who He is in (\d+): ([\d, and]+)\./);
    expect(m, 'the tally sentence must be present').toBeTruthy();
    const nums = (s) => s.split(/,\s*|\s+and\s+/).map(Number);
    for (const [count, list] of [[1, 2], [3, 4], [5, 6], [7, 8]]) {
      const ns = nums(m[list]);
      expect(ns.length).toBe(Number(m[count]));
      for (const n of ns) expect(n >= 1 && n <= 54).toBe(true);
    }
    expect(nums(m[8])).toEqual([8, 9, 14, 18]); // the four spirit occasions
    const union = new Set([2, 4, 6, 8].flatMap((i) => nums(m[i])));
    expect(union.size, 'every occasion carries at least one kind').toBe(54);
  });

  it('the L191 reconciliation: eighteen matched, one quoted-not-walked, thirty-six new — read from the tags', () => {
    const t = tags(L().lesson);
    expect(t).toHaveLength(54);
    expect(t.every(Boolean)).toBe(true);
    const matched = t.filter((x) => x !== 'new' && !x.startsWith('quoted'));
    expect(matched).toHaveLength(18);
    expect(t.filter((x) => x === 'new')).toHaveLength(35);
    expect(t.filter((x) => x.startsWith('quoted'))).toHaveLength(1);
    expect(L().lesson).toMatch(/eighteen of the fifty-four are the scenes L191 walks/);
    expect(L().lesson).toMatch(/Thirty-six occasions are new in this lesson\./);
    // L191's fifteen Gospel hearers all appear; its sixteenth is named as outside.
    for (const ord of ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth']) {
      expect(matched.some((x) => x === `the ${ord} hearer`), `L191's ${ord} hearer`).toBe(true);
    }
    expect(L().lesson).toMatch(/its sixteenth, John on Patmos, stands outside the four Gospels/);
  });

  it('the confessions, questions and spirits the brief named are all walked', () => {
    for (const s of [
      'Rabbi, thou art the Son of God; thou art the King of Israel',
      'Thou art the Christ, the Son of the living God',
      'I believe that thou art the Christ, the Son of God, which should come into the world',
      'My Lord and my God',
      'I that speak unto thee am he',
      'And he worshipped him',
      'Art thou he that should come, or do we look for another?',
      'Art thou the Christ, the Son of the Blessed?',
      'Thou sayest that I am a king',
      'I know thee who thou art, the Holy One of God',
      'suffered not the devils to speak, because they knew him',
      'he straitly charged them that they should not make him known',
      'What have I to do with thee, Jesus, thou Son of the most high God?',
    ]) expect(L().lesson).toContain(s);
  });
});

describe('the movements are the Word’s, and the science is labeled', () => {
  const carries = (s) => expect(ALL()).toContain(s);

  it('not of this world, and the worlds He framed', () => {
    carries('My kingdom is not of this world');
    carries('I am from above: ye are of this world; I am not of this world');
    carries('the worlds were framed by the word of God, so that things which are seen were not made of things which do appear');
    carries('For by him were all things created, that are in heaven, and that are in earth, visible and invisible');
    carries('And he is before all things, and by him all things consist');
  });

  it('the science is established fact with its basis, the approximate figure is labeled, and nothing is claimed as proof', () => {
    const l = L().lesson;
    expect(l).toContain('about 380 to about 750 nanometres');
    expect(l).toContain('Darrell said .009 percent. The figure most often given in public is about 0.0035 percent. That is an approximate figure, not a fixed constant');
    expect(l).toContain('the fraction depends on the range you choose to count');
    expect(l).toContain('more than 99.9 percent of the atom\'s mass');
    expect(l).toContain('It is not air, because air is itself made of atoms');
    expect(l).toContain('It is an illustration, not a proof.');
    for (const b of FULL_BANDS) {
      expect(L().levels[b], `${b} must label the science`).toMatch(/illustrat|not prove|picture to help/i);
      expect(L().levels[b], `${b} must carry the corrected figure`).toContain('0.0035 percent');
    }
    // The quiz's WRONG options are allowed to state the error the quiz corrects;
    // every teaching surface is not.
    for (const [where, text] of quotedTexts(L()).filter(([w]) => !/^quiz\[\d+\]\.options/.test(w))) {
      expect(/(quantum|physics|science)\s+(proves|has proven|confirms)/i.test(text), `${where} claims proof`).toBe(false);
    }
    const q = L().quiz.questions[4];
    expect(q.options[q.answer]).toMatch(/illustration only/);
  });

  it('the eyes of the body and the eyes of the soul (Darrell\'s second word)', () => {
    carries('open his eyes, that he may see');
    carries('that they which see not might see; and that they which see might be made blind');
    carries('blessed are your eyes, for they see');
    carries('The eyes of your understanding being enlightened');
    carries('we look not at the things which are seen, but at the things which are not seen');
    carries('as seeing him who is invisible');
    expect(L().lesson).toMatch(/Darrell added a second word the same day, rendered for meaning: eyes cannot see, and eyes can, and the soul is the same\./);
  });

  it('I AM: John 8:58 stands beside Exodus 3:14, and was, is and is to come each carry His words', () => {
    const l = L().lesson;
    expect(l).toContain('I AM: WHO JESUS SAID HE WAS, IS, AND IS TO COME.');
    const a = l.indexOf('"Before Abraham was, I am" (John 8:58). Set it beside the name at the bush: "I AM THAT I AM" (Exodus 3:14)');
    expect(a, 'John 8:58 pinned beside Exodus 3:14').toBeGreaterThan(-1);
    // The movement follows the not-of-this-world movement.
    expect(l.indexOf('NOT OF THIS WORLD, AND THE WORLDS HE FRAMED.')).toBeLessThan(l.indexOf('I AM: WHO JESUS SAID HE WAS, IS, AND IS TO COME.'));
    for (const s of ['I am the bread of life', 'I am the light of the world', 'I am the door', 'I am the good shepherd', 'I am the resurrection, and the life', 'I am the way, the truth, and the life', 'I am the true vine', 'I and my Father are one', 'All power is given unto me in heaven and in earth', 'I will come again, and receive you unto myself', 'behold, I come quickly; and my reward is with me', 'I am Alpha and Omega, the beginning and the end, the first and the last', 'which is, and which was, and which is to come, the Almighty', 'Jesus Christ the same yesterday, and to day, and for ever', 'the glory which I had with thee before the world was', 'In the beginning was the Word, and the Word was with God, and the Word was God']) {
      carries(s);
    }
  });

  it('Worthy: the Word\'s own words, and "His blood has the Code" kept as Darrell\'s', () => {
    carries('for thou wast slain, and hast redeemed us to God by thy blood out of every kindred, and tongue, and people, and nation');
    carries('Worthy is the Lamb that was slain to receive power, and riches, and wisdom, and strength, and honour, and glory, and blessing');
    carries('ye were not redeemed with corruptible things, as silver and gold');
    carries('But with the precious blood of Christ, as of a lamb without blemish and without spot');
    carries('without shedding of blood is no remission');
    expect(L().lesson).toMatch(/His blood has the Code is Darrell's own way of saying it, and we keep it as his/);
    expect(L().lesson).toMatch(/We do not build a new doctrine from the phrase\./);
  });

  it('the close turns the question around, and every surface ends the way this house ends', () => {
    expect(L().lesson).toMatch(/WHICH HEARER ARE YOU TODAY\?/);
    const end = 'Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.';
    expect(L().lesson.trimEnd().endsWith(end)).toBe(true);
    for (const b of FULL_BANDS) {
      expect(L().levels[b].trimEnd().endsWith(end), `${b} ends the way this house ends`).toBe(true);
      expect(L().levels[b], `${b} gives the count`).toMatch(/fifty-four/i);
    }
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
    expect(isInverted(m)).toBe(false);
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
