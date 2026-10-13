// @vitest-environment node
// L82 — every quoted fragment VERBATIM against the repo's own KJV
// (DR-0076; the DR-0288 discipline; same rail as the l68/l78/l80-l81 pins).
// Capture note: the spoken teaching's verbatim wording was lost to a session
// compaction, so the LESSON stands on Romans 13:8-14 itself plus Darrell's
// named cross-texts — which makes these pins the lesson's whole spine, and
// this file the proof the spine is Scripture and not memory.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

function kjv(book, ch, vs) {
  const d = JSON.parse(readFileSync(new URL(`../../public/bible/kjv/${book}.json`, import.meta.url), 'utf8'));
  const chapters = d.chapters || d;
  const verses = Array.isArray(chapters) ? chapters[ch - 1] : chapters[String(ch)];
  const v = Array.isArray(verses) ? verses[vs - 1] : verses[String(vs)];
  return typeof v === 'string' ? v : (v.text || v.t);
}

const norm = (x) => x.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');

const PINS = [
  ['Romans', 13, 8, 'Owe no man any thing, but to love one another'],
  ['Romans', 13, 8, 'he that loveth another hath fulfilled the law'],
  ['Romans', 13, 9, 'briefly comprehended'],
  ['Romans', 13, 10, 'Love worketh no ill to his neighbour'],
  ['Romans', 13, 10, 'love is the fulfilling of the law'],
  ['Romans', 13, 11, 'now it is high time to awake out of sleep'],
  ['Romans', 13, 11, 'now is our salvation nearer than when we believed'],
  ['Romans', 13, 12, 'The night is far spent, the day is at hand'],
  ['Romans', 13, 12, 'cast off the works of darkness'],
  ['Romans', 13, 12, 'put on the armour of light'],
  ['Romans', 13, 13, 'Let us walk honestly, as in the day'],
  ['Romans', 13, 14, 'put ye on the Lord Jesus Christ'],
  ['Romans', 13, 14, 'make not provision for the flesh'],
  ['Deuteronomy', 6, 5, 'love the LORD thy God with all thine heart, and with all thy soul, and with all thy might'],
  ['Leviticus', 19, 18, 'thou shalt love thy neighbour as thyself: I am the LORD'],
  ['Matthew', 22, 40, 'On these two commandments hang all the law and the prophets'],
  ['Isaiah', 59, 17, 'righteousness as a breastplate, and an helmet of salvation upon his head'],
  ['Isaiah', 60, 1, 'Arise, shine; for thy light is come'],
  ['Isaiah', 60, 2, 'darkness shall cover the earth, and gross darkness the people'],
  ['Isaiah', 61, 10, 'he hath clothed me with the garments of salvation'],
  ['Isaiah', 61, 10, 'covered me with the robe of righteousness'],
  ['Matthew', 23, 23, 'weightier matters'],
  ['Matthew', 23, 23, 'judgment, mercy, and faith'],
  ['Colossians', 4, 5, 'Walk in wisdom toward them that are without, redeeming the time'],
  ['Colossians', 4, 6, 'Let your speech be alway with grace, seasoned with salt'],
  ['1Thessalonians', 5, 5, 'Ye are all the children of light'],
];

describe('L82 — love fulfils the law, wake up and get dressed: verses verbatim', () => {
  const lesson = LIVING_LESSONS_MODULES.find((l) => l.id === 'll82-love-fulfils-the-law-wake-up-and-get-dressed');

  it('the lesson is published', () => {
    expect(lesson).toBeTruthy();
  });

  it('every pinned fragment is an exact substring of the cited KJV verse', () => {
    const failures = [];
    for (const [book, ch, vs, frag] of PINS) {
      if (!norm(kjv(book, ch, vs)).includes(norm(frag))) failures.push(`${book} ${ch}:${vs} — "${frag}"`);
    }
    expect(failures).toEqual([]);
  });

  it('every fragment actually appears in the lesson (no stale pin list)', () => {
    const blob = JSON.stringify(lesson).replace(/[’‘]/g, "'");
    const missing = PINS.filter(([, , , frag]) => !blob.includes(frag)).map(([b, c, v]) => `${b} ${c}:${v}`);
    expect(missing).toEqual([]);
  });

  // REPLACED 2026-09-18. This searched the whole serialised module for three
  // reference STRINGS, so any one field answered for all three — and it checked
  // only that the references were mentioned, never that the arc ran in its
  // order. The order IS the teaching: He wore the armour first, He is the light
  // that rises, He does the clothing. Checked per band, as an ordering, below
  // (DR-0480).
});

describe('PROVEN-TO-CATCH: a one-word tamper fails', () => {
  it('catches a tampered fragment', () => {
    expect(norm(kjv('Romans', 13, 12)).includes('put on the armour of night')).toBe(false);
    expect(norm(kjv('Romans', 13, 12)).includes('put on the armour of light')).toBe(true);
  });
});

// =============================================================================
// THE FOUR BANDS, EACH CARRYING ALL FIVE MOVEMENTS (DR-0480)
// =============================================================================
// The pass reached L82 with all four bands short and youth absent — child 178
// words at 0.35 of the adult lesson against a 0.50 floor, teen 233 at 0.45 and
// senior 301 at 0.59 against 0.60 — and the senior band reading at FK 11.15
// against an adult lesson at 5.31. The child band also used the generic name
// four times in our own authored voice.
//
// FOUR RULES, ALL PAID FOR, GOVERN EVERY CLAIM CHECK BELOW: read OUR prose with
// the quotations stripped (DR-0474); no alternation branch may be merely a word
// the passage contains (DR-0476), a phrase our prose echoes out of the
// quotation beside it (DR-0478), or A TITLE KEYWORD, since the title is in
// every band by construction (DR-0479); and never two claims in one test,
// because a break that trips the second reports as a failure of the first
// (DR-0478). A test name containing "and" is the tell.
import { formatLessonText } from '../lib/lesson-format.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const MODULE = LIVING_LESSONS_MODULES.find((m) => m.id === 'll82-love-fulfils-the-law-wake-up-and-get-dressed');
const BANDS = ['child', 'youth', 'teen', 'senior'];
const TEXTS = Object.fromEntries(BANDS.map((b) => [b, String(MODULE.levels[b])]));
const READER = { ...TEXTS, lesson: String(MODULE.lesson), bigIdea: String(MODULE.bigIdea), inApp: String(MODULE.inApp) };
const ourWords = (t) => String(t).replace(/"[^"]*"/g, ' ');

describe('L82 — every band is the whole passage, in that age’s words', () => {
  it('all four bands are present and none is short of its floor', () => {
    expect(shortBands(measureFullness(MODULE)), 'a band is missing or below its floor').toEqual([]);
  });

  it('reads in a rising ladder', () => {
    const ladder = BANDS.map((b) => fleschKincaidGrade(ourProseOnly(TEXTS[b])));
    for (let i = 1; i < ladder.length; i += 1) {
      expect(ladder[i], `${BANDS[i]} (${ladder[i].toFixed(2)}) reads below ${BANDS[i - 1]} (${ladder[i - 1].toFixed(2)})`)
        .toBeGreaterThanOrEqual(ladder[i - 1]);
    }
  });

  it('keeps the child band under the ceiling', () => {
    expect(fleschKincaidGrade(ourProseOnly(TEXTS.child))).toBeLessThanOrEqual(CHILD_CEILING);
  });

  it('EVERY band renders all FIVE movements as numbered sections', () => {
    for (const b of BANDS) {
      const { items, sectionCount } = formatLessonText(TEXTS[b]);
      expect(sectionCount, `${b} does not render five movements`).toBe(5);
      expect(items.filter((i) => i.n).map((i) => i.n)).toEqual([1, 2, 3, 4, 5]);
      for (const i of items) {
        expect(i.text.length, `${b} has a chunk over the house wall limit`).toBeLessThanOrEqual(420);
      }
    }
  });

  it('names its own lesson in the opening of every band', () => {
    for (const b of BANDS) {
      expect(namesItsLesson(MODULE.title, TEXTS[b]), `${b} does not open by naming its lesson`).toBe(true);
    }
  });
});

describe('L82 — His words whole', () => {
  it('carries no ellipsis inside any quotation, in any reader-facing field', () => {
    for (const [k, v] of Object.entries(READER)) {
      const elided = String(v).match(/"[^"]*(?:\.\.\.|…)[^"]*"/g) || [];
      expect(elided, `${k} elides His words: ${elided.join(' | ')}`).toEqual([]);
    }
  });

  it('gives Romans 13:11-12 its whole nearer-than-when-we-believed clause', () => {
    // The teen band's elision had cut "for now is our salvation nearer than
    // when we believed" — which is the entire basis of the arithmetic the
    // second movement runs on. Without it the wake-up call is just urgency.
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} cuts the arithmetic out of the clock`)
        .toContain('for now is our salvation nearer than when we believed');
    }
  });

  it('gives Romans 13:12 its whole cast-off-and-put-on pair', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} cuts Romans 13:12`)
        .toContain('cast off the works of darkness, and let us put on the armour of light');
    }
  });

  it('gives Matthew 23:23 back the words "of the law"', () => {
    // The elision read "the weightier matters... judgment, mercy, and faith"
    // and dropped "of the law" — which is what makes them weightier THAN the
    // tithing being rebuked, rather than just important in general.
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} cuts Matthew 23:23`)
        .toContain('the weightier matters of the law, judgment, mercy, and faith');
    }
  });

  it('recites no record id to a reader, in any band or field', () => {
    for (const [k, v] of Object.entries(READER)) {
      expect(String(v).match(/DR-\d{4}/g) || [], `${k} recites a record id`).toEqual([]);
    }
  });
});

describe('L82 — the covenant name, in OUR voice only', () => {
  it('says Yahweh in each band’s own prose', () => {
    for (const b of BANDS) expect(ourWords(TEXTS[b]), `${b} never names Yahweh in its own voice`).toMatch(/Yahweh/);
  });

  it('never uses the generic name in our own prose, in any reader field', () => {
    // The old child band said "God's rules", "God says to do that with your
    // heart too", "love God with all your heart" and "the one thing God says
    // we always owe" — four generic uses in our own voice, in the band least
    // able to work out which god was meant.
    for (const [k, v] of Object.entries(READER)) {
      expect(ourProseOnly(v).match(/\bGod\b/g) || [], `${k} uses the generic name in our own voice`).toEqual([]);
    }
  });

  it('leaves the generic name EXACTLY as the KJV wrote it, inside the quotations', () => {
    // Two bands reach the great commandment through Matthew 22:37 and two
    // through Deuteronomy 6:5. Both carry the KJV's generic name and both are
    // correct, so either exact span satisfies this — but ONLY those two exact
    // spans, letter-for-letter, because that is the whole property.
    const MATTHEW = 'Thou shalt love the Lord thy God with all thy heart';
    const DEUTERONOMY = 'thou shalt love the LORD thy God with all thine heart';
    for (const b of BANDS) {
      const carries = TEXTS[b].includes(MATTHEW) || TEXTS[b].includes(DEUTERONOMY);
      expect(carries, `${b} does not carry the great commandment with the KJV's own name intact`).toBe(true);
    }
  });

  it('never capitalises an adversary name anywhere in the lesson', () => {
    for (const [k, v] of Object.entries(READER)) {
      for (const bad of ['Satan', 'Lucifer', 'The Devil', 'The Adversary', 'The Accuser', 'The Deceiver']) {
        expect(String(v).includes(bad), `${k} capitalises ${bad}`).toBe(false);
      }
    }
  });
});

describe('L82 — FIRST MOVEMENT: the debt that never closes', () => {
  it('every band says this debt is designed to STAY OPEN, unlike every other', () => {
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} does not contrast it with a debt that closes`)
        .toMatch(/(never closes|stay open|designed never to close|That debt closes)/i);
    }
  });

  it('every band shows Paul standing on Moses', () => {
    for (const b of BANDS) {
      // Capitalisation differs because Matthew starts the clause and Leviticus
      // does not; the words are what matter here.
      expect(TEXTS[b], `${b} drops the neighbour commandment`).toMatch(/[Tt]hou shalt love thy neighbour as thyself/);
      expect(ourWords(TEXTS[b]), `${b} does not credit the source`)
        .toMatch(/(Moses|Jesus said the two biggest rules)/);
    }
  });

  it('every band makes love CONDUCT rather than feeling, by the verse’s own measure', () => {
    // "worketh no ill" is the measure, and it is the whole reason the lesson
    // is testable rather than sentimental.
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops the measure`).toContain('Love worketh no ill to his neighbour');
      expect(ourWords(TEXTS[b]), `${b} does not say conduct rather than feeling`)
        .toMatch(/(not how you feel|conduct rather than feeling|not just a warm feeling|what your conduct)/i);
    }
  });
});

describe('L82 — SECOND MOVEMENT: the clock', () => {
  it('every band says the argument is ARITHMETIC, not fear', () => {
    // Paul's case is that time moved one way. A band that makes it a scare
    // has changed what the passage argues.
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} turns the clock into fear`)
        .toMatch(/(not fear|is just counting|arithmetic)/i);
    }
  });

  it('every band says urgency is MORE true now than at first belief', () => {
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} does not draw the one-direction conclusion`)
        .toMatch(/(MORE true now|more reason for wakefulness|matters more today|one day closer)/i);
    }
  });
});

describe('L82 — THIRD MOVEMENT: Isaiah’s wardrobe, and the ORDER inside it', () => {
  it('every band carries all three stations of the arc', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Isaiah 59:17`).toContain('he put on righteousness as a breastplate, and an helmet of salvation upon his head');
      expect(TEXTS[b], `${b} drops Isaiah 60:1`).toContain('Arise, shine; for thy light is come');
      expect(TEXTS[b], `${b} drops Isaiah 61:10`).toContain('he hath clothed me with the garments of salvation, he hath covered me with the robe of righteousness');
    }
  });

  it('every band runs the arc in ORDER: He wore it, He rises, He clothes', () => {
    // The order is the teaching, and the old pooled check never looked at it.
    // Checked as positions in the raw text so the sequence itself is the
    // assertion, not the presence of three references.
    for (const b of BANDS) {
      const raw = TEXTS[b];
      const armour = raw.indexOf('righteousness as a breastplate');
      const dawn = raw.indexOf('Arise, shine');
      const clothed = raw.indexOf('clothed me with the garments of salvation');
      expect(armour, `${b} is missing the armour station`).toBeGreaterThan(-1);
      expect(dawn, `${b} puts the dawn before He wore the armour`).toBeGreaterThan(armour);
      expect(clothed, `${b} puts the clothing before the dawn`).toBeGreaterThan(dawn);
    }
  });

  it('every band says the armour is ISSUED, not a character you build', () => {
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} lets the armour be self-made`)
        .toMatch(/(issued equipment|not a character you build|already been purchased|do not have to make that armour)/i);
    }
  });

  it('every band names the gospel-versus-self-improvement difference', () => {
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} drops the self-improvement contrast`)
        .toMatch(/self-improvement|He does the dressing/i);
    }
  });
});

describe('L82 — FOURTH MOVEMENT: cut the supply line', () => {
  it('every band carries the make-not-provision command', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops the negative half of Romans 13:14`).toContain('make not provision for the flesh');
    }
  });

  it('every band reads PROVISION as supply and forethought', () => {
    // The word is the whole point of the movement. A band that quotes the
    // command without unpacking it has left the reader with nothing to do.
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} does not unpack provision`)
        .toMatch(/(means supplies|forethought, supply|supply line)/i);
    }
  });

  it('every band says the flesh need not be STRONG if it is well supplied', () => {
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} drops the realism about strength`)
        .toMatch(/(does not need to be strong|has no need to be strong|does not have to be strong)/i);
    }
  });

  it('every band says the work is done EARLY, before the moment', () => {
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} does not move the work earlier`)
        .toMatch(/(provisioned days in advance|before the moment|defund it tonight|done early)/i);
    }
  });
});

describe('L82 — FIFTH MOVEMENT: how to walk in the meantime', () => {
  it('every band reads walk-honestly as living VISIBLY', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Romans 13:13`).toContain('Let us walk honestly, as in the day');
      expect(ourWords(TEXTS[b]), `${b} does not make it visible living`)
        .toMatch(/(everyone can see|everybody can see|public square)/i);
    }
  });

  it('every band puts CHARACTER over correctness', () => {
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} does not weigh character over being right`)
        .toMatch(/(character over correctness|correctness without character|Being RIGHT is not the same|win an argument and still be unkind|outweigh winning)/i);
    }
  });

  it('every band gives the grace-before-salt order', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Colossians 4:6`).toContain('Let your speech be alway with grace, seasoned with salt');
      expect(ourWords(TEXTS[b]), `${b} does not order grace before salt`)
        .toMatch(/Grace first/i);
    }
  });

  it('every band closes on the IDENTITY rather than the effort', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops 1 Thessalonians 5:5`).toContain('children of light, and the children of the day');
      expect(ourWords(TEXTS[b]), `${b} does not turn the identity into the instruction`)
        .toMatch(/(Dress like it|dress like it|get dressed like it|Finish the watch dressed)/);
    }
  });
});
