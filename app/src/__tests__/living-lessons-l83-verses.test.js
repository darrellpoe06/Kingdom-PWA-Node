// @vitest-environment node
// L83 — every quoted fragment VERBATIM against the repo's own KJV
// (DR-0076; the DR-0288 discipline; same rail as the l78/l80-l82 pins).
// Capture note: Darrell spoke the lesson REQUEST 2026-08-21 — "how do we guard
// our hearts and minds according to the Word and what specific requirements
// and conditions are we being prepared to meet and discuss before and after
// studying for growth" — and the lesson stands on the texts his two questions
// name: the guard (Proverbs 4:23's wellspring, Philippians 4:6-8's garrison
// and Test, the gates, 2 Corinthians 10:5's patrol) and the if/then conditions
// of growth on both sides of study. These pins prove the spine is Scripture,
// not memory; every verse was fetched from public/bible/kjv before writing.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

function kjv(book, ch, vs) {
  const d = JSON.parse(readFileSync(new URL(`../../public/bible/kjv/${book}.json`, import.meta.url), 'utf8'));
  const chapters = d.chapters || d;
  const verses = Array.isArray(chapters) ? chapters[ch - 1] : chapters[String(ch)];
  const v = Array.isArray(verses) ? verses[vs - 1] : verses[String(vs)];
  return typeof v === 'string' ? v : (v.text || v.t);
}

const norm = (x) => x.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');

const PINS = [
  ['Proverbs', 4, 23, 'Keep thy heart with all diligence; for out of it are the issues of life'],
  ['Proverbs', 23, 7, 'as he thinketh in his heart, so is he'],
  ['Philippians', 4, 6, 'by prayer and supplication with thanksgiving'],
  ['Philippians', 4, 7, 'the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus'],
  ['Philippians', 4, 8, 'whatsoever things are true'],
  ['Philippians', 4, 8, 'think on these things'],
  ['Psalms', 101, 3, 'I will set no wicked thing before mine eyes'],
  ['Mark', 4, 24, 'Take heed what ye hear'],
  ['Luke', 8, 18, 'Take heed therefore how ye hear'],
  ['2Corinthians', 10, 5, 'Casting down imaginations'],
  ['2Corinthians', 10, 5, 'bringing into captivity every thought to the obedience of Christ'],
  ['Ephesians', 6, 16, 'the shield of faith, wherewith ye shall be able to quench all the fiery darts of the wicked'],
  ['Ephesians', 6, 17, 'the helmet of salvation, and the sword of the Spirit, which is the word of God'],
  ['2Timothy', 2, 15, 'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth'],
  ['James', 1, 21, 'receive with meekness the engrafted word'],
  ['James', 1, 21, 'lay apart all filthiness'],
  ['1Peter', 2, 2, 'desire the sincere milk of the word, that ye may grow thereby'],
  ['Psalms', 119, 18, 'Open thou mine eyes, that I may behold wondrous things out of thy law'],
  ['Proverbs', 2, 4, 'If thou seekest her as silver, and searchest for her as for hid treasures'],
  ['Proverbs', 2, 5, 'Then shalt thou understand the fear of the LORD'],
  ['Matthew', 5, 6, 'hunger and thirst after righteousness'],
  ['James', 1, 22, 'be ye doers of the word, and not hearers only, deceiving your own selves'],
  ['James', 1, 25, 'blessed in his deed'],
  ['Joshua', 1, 8, 'thou shalt meditate therein day and night, that thou mayest observe to do'],
  ['Psalms', 1, 2, 'in his law doth he meditate day and night'],
  ['Psalms', 1, 3, 'like a tree planted by the rivers of water'],
  ['Hebrews', 5, 14, 'by reason of use have their senses exercised'],
  ['Romans', 12, 2, 'prove what is that good, and acceptable, and perfect, will of God'],
  ['Colossians', 3, 16, 'Let the word of Christ dwell in you richly in all wisdom'],
  ['Colossians', 3, 16, 'teaching and admonishing one another'],
  ['1Peter', 3, 15, 'a reason of the hope that is in you with meekness and fear'],
  ['2Peter', 3, 18, 'grow in grace, and in the knowledge of our Lord and Saviour Jesus Christ'],
];

describe('L83 — keep thy heart, the conditions of growth: verses verbatim', () => {
  const lesson = LIVING_LESSONS_MODULES.find((l) => l.id === 'll83-keep-thy-heart-the-conditions-of-growth');

  it('the lesson is published and the catalog counts it', () => {
    expect(lesson).toBeTruthy();
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('every pinned fragment is an exact substring of the cited KJV verse', () => {
    const failures = [];
    for (const [book, ch, vs, frag] of PINS) {
      const text = norm(kjv(book, ch, vs));
      if (!text.includes(norm(frag))) failures.push(`${book} ${ch}:${vs} does not contain "${frag}" — verse reads: ${text}`);
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('every pinned fragment actually appears in the lesson body (the pins are not decorative)', () => {
    const body = norm(JSON.stringify(lesson));
    const missing = PINS.map(([, , , f]) => f).filter((f) => !body.includes(norm(f)));
    expect(missing, missing.join('\n')).toEqual([]);
  });

  // REPLACED 2026-09-18. This check searched the WHOLE serialised module,
  // lowercased, for single words: guard, gate, before, after, condition, grow.
  // Every one of those is a word this lesson's prose could not avoid using —
  // "grow" is inside "growth", "before" and "after" are ordinary English — and
  // the scope was the whole module, so any one field answered for all eight.
  // It could not have failed on a lesson that mentioned its own subject once.
  // The two halves are now checked per band, as claims, below (DR-0479).

  it('PROVEN-TO-CATCH: a tampered fragment fails the verbatim gate', () => {
    const text = norm(kjv('Proverbs', 4, 23));
    expect(text.includes(norm('Keep thy heart with SOME diligence'))).toBe(false);
  });
});

// =============================================================================
// THE FOUR BANDS, EACH CARRYING BOTH HALVES (DR-0479)
// =============================================================================
// The full-levels pass reached L83 with child at 0.32 of the adult lesson
// against a 0.50 floor, teen at 0.55 against 0.60, youth absent — and the
// senior band reading at FK 16.97, post-graduate, against an adult lesson at
// 5.14. Seven elided quotations sat across four reader-facing fields, one of
// them running an ellipsis chain straight through Philippians 4:8.
//
// EVERY CLAIM CHECK READS OUR PROSE, NOT THE BAND; no alternation branch is
// merely a word the passage contains or a phrase our prose echoes out of the
// quotation beside it; and no test carries two claims, because a break that
// trips the second would report as a failure of the first. All three rules
// were paid for — DR-0476, DR-0478.
import { formatLessonText } from '../lib/lesson-format.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const MODULE = LIVING_LESSONS_MODULES.find((m) => m.id === 'll83-keep-thy-heart-the-conditions-of-growth');
const BANDS = ['child', 'youth', 'teen', 'senior'];
const TEXTS = Object.fromEntries(BANDS.map((b) => [b, String(MODULE.levels[b])]));
const READER = { ...TEXTS, lesson: String(MODULE.lesson), bigIdea: String(MODULE.bigIdea), inApp: String(MODULE.inApp) };
const ourWords = (t) => String(t).replace(/"[^"]*"/g, ' ');

describe('L83 — every band is both halves, in that age’s words', () => {
  it('all four bands are present and none is short of its floor', () => {
    const measured = measureFullness(MODULE);
    expect(shortBands(measured), 'a band is missing or below its floor').toEqual([]);
  });

  it('reads in a rising ladder', () => {
    const grade = (b) => fleschKincaidGrade(ourProseOnly(TEXTS[b]));
    const ladder = BANDS.map(grade);
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

describe('L83 — THE TEST is quoted whole, all eight questions', () => {
  it('carries no ellipsis inside any quotation, in any reader-facing field', () => {
    for (const [k, v] of Object.entries(READER)) {
      const elided = String(v).match(/"[^"]*(?:\.\.\.|…)[^"]*"/g) || [];
      expect(elided, `${k} elides His words: ${elided.join(' | ')}`).toEqual([]);
    }
  });

  it('gives Philippians 4:8 WHOLE in every band and in the lesson', () => {
    // The elision ran "true... honest... just... pure... lovely... of good
    // report... think on these things" — an ellipsis chain through the eight
    // questions of the Test itself. This house calls that sequence the Test
    // (MIND-OF-CHRIST), and an elision through it does not shorten the verse,
    // it DESTROYS THE SEQUENCE the lesson exists to teach. Both the virtue and
    // the praise clauses had gone missing entirely.
    const whole = 'whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things';
    for (const k of [...BANDS, 'lesson', 'bigIdea']) {
      expect(READER[k], `${k} does not carry the whole Test`).toContain(whole);
    }
  });

  it('gives James 1:21 back with the lay-apart clause it had cut', () => {
    for (const field of ['lesson', 'bigIdea']) {
      expect(READER[field], `${field} still cuts James 1:21`)
        .toContain('lay apart all filthiness and superfluity of naughtiness, and receive with meekness the engrafted word');
    }
  });

  it('gives Proverbs 2:4-5 its whole if/then in every band', () => {
    // Two bands had elided the middle of the conditional, which is the one
    // thing the verse is being cited FOR: the if and the then.
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} cuts the search terms`)
        .toContain('If thou seekest her as silver, and searchest for her as for hid treasures; Then shalt thou understand the fear of the LORD');
    }
  });

  it('recites no record id to a reader, in any band or field', () => {
    for (const [k, v] of Object.entries(READER)) {
      expect(String(v).match(/DR-\d{4}/g) || [], `${k} recites a record id`).toEqual([]);
    }
  });
});

describe('L83 — the covenant name, in OUR voice only', () => {
  it('says Yahweh in each band’s own prose', () => {
    for (const b of BANDS) expect(ourWords(TEXTS[b]), `${b} never names Yahweh in its own voice`).toMatch(/Yahweh/);
  });

  it('never uses the generic name in our own prose, in any reader field', () => {
    for (const [k, v] of Object.entries(READER)) {
      expect(ourProseOnly(v).match(/\bGod\b/g) || [], `${k} uses the generic name in our own voice`).toEqual([]);
    }
  });

  it('leaves the generic name EXACTLY as the KJV wrote it, inside the quotations', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} altered 2 Timothy 2:15`).toContain('Study to shew thyself approved unto God');
      expect(TEXTS[b], `${b} altered Ephesians 6:17`).toContain('the sword of the Spirit, which is the word of God');
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

describe('L83 — FIRST MOVEMENT: the source, not a preference', () => {
  it('every band reads the spring as a MECHANISM, in our own words', () => {
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} does not say what goes in comes out`)
        .toMatch(/(gets into the spring|gets INTO the spring|heart stores becomes|comes out in the life|come out later)/i);
    }
  });

  it('every band says it is the SOURCE being guarded', () => {
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} lets it read as guarding a preference`)
        .toMatch(/(guarding the source|not guarding a preference|not the guarding of a preference|the place everything else comes from)/i);
    }
  });
});

describe('L83 — SECOND MOVEMENT: you are not the garrison', () => {
  it('every band says the self-powered guard FAILS', () => {
    // The whole reason the second movement exists. A band that goes straight
    // to the peace of God without naming the willpower attempt has skipped
    // the problem the verse is answering.
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} never names the willpower attempt that fails`)
        .toMatch(/(willpower|gritted teeth|all by themselves|white-knuckled)/i);
    }
  });

  it('every band names KEEP as a soldier’s word', () => {
    for (const b of BANDS) {
      const o = ourWords(TEXTS[b]);
      expect(o, `${b} does not name KEEP as a garrison word`).toMatch(/(soldier|garrison)/i);
    }
  });

  it('every band divides the labour: He posts the guard, we keep the gates', () => {
    // Split for the DR-0478 reason. A test name with an "and" in it is the
    // tell: it is carrying two claims, and a break can only be attributed to
    // one of them.
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} does not divide the labour`)
        .toMatch(/(He stations the sentry|Yahweh posts the guard|He posts the watch)/i);
    }
  });

  it('every band quotes the peace that does the keeping', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Philippians 4:7`)
        .toContain('the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus');
    }
  });
});

describe('L83 — THIRD MOVEMENT: the gates, and the patrol inside', () => {
  it('every band names the eye-gate as a PRE-commitment', () => {
    // David decided in advance. That is the transferable part, and it is what
    // a band drops when it only quotes the verse.
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Psalms 101:3`).toContain('I will set no wicked thing before mine eyes');
      expect(ourWords(TEXTS[b]), `${b} does not say the decision came first`)
        .toMatch(/(pre-commitment|decided (about his eyes )?ahead of time|decided BEFORE|Deciding (early|in advance))/i);
    }
  });

  it('every band carries BOTH ear-gate warnings', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Mark 4:24`).toContain('Take heed what ye hear');
      expect(TEXTS[b], `${b} drops Luke 8:18`).toContain('Take heed therefore how ye hear');
    }
  });

  it('every band says WHY there are two ear warnings, not one', () => {
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} does not distinguish content from posture`)
        .toMatch(/content (AND|and) posture|between content and posture|what you listen to, and it also matters how/i);
    }
  });

  it('every band keeps the patrol INSIDE the walls', () => {
    // Guarding entry is not enough, because thoughts are generated in there.
    // A band that stops at the gates has taught half the discipline.
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops 2 Corinthians 10:5`).toContain('bringing into captivity every thought to the obedience of Christ');
      expect(ourWords(TEXTS[b]), `${b} does not say thoughts start inside`)
        .toMatch(/(start up inside|generated in there|interior patrol|patrol inside the walls|thought-life is not exempt)/i);
    }
  });

  it('every band says the armour is ISSUED rather than improvised', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops the armour`).toContain('And take the helmet of salvation, and the sword of the Spirit, which is the word of God');
      expect(ourWords(TEXTS[b]), `${b} does not say it is issued`)
        .toMatch(/(issue|hands it to you|do not have to make your own)/i);
    }
  });
});

describe('L83 — FOURTH MOVEMENT: before the Book opens', () => {
  it('every band says growth is CONDITIONED', () => {
    // This is the sentence Darrell said most readers have never been told.
    //
    // NOT /conditions of growth/. That phrase is in the TITLE, and every band
    // opens by naming its own lesson, so the naming line answered for the
    // claim and the sentence that makes it could be deleted with the gate
    // green. Second time a title keyword has done this — DR-0476 was the word
    // "inspiration" in L86's opening.
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} does not say growth has conditions`)
        .toMatch(/(has conditions|are conditioned|Growing does not just happen)/i);
    }
  });

  it('every band names the IF/THEN shape of the promises', () => {
    // Split from the check above: two claims in one test meant a break that
    // removed only the second reported as a failure of the first. That is the
    // DR-0478 finding, and this is the third place tonight it applied.
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} does not name the if/then shape`)
        .toMatch(/(IF\/THEN|if and the then|if\/then|the IF and the THEN)/i);
    }
  });

  it('every band keeps James 1:21 in its stated ORDER', () => {
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} does not keep laid-apart-first`)
        .toMatch(/(Laid apart first|laid apart first|junk down first|laid-aside posture|its own order|its stated order)/i);
    }
  });

  it('every band asks the seeing-prayer BEFORE the reading', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Psalms 119:18`).toContain('Open thou mine eyes, that I may behold wondrous things out of thy law');
      expect(ourWords(TEXTS[b]), `${b} does not place the prayer before the reading`)
        .toMatch(/(BEFORE you start reading|before reading rather than after|of the still-expectant|asked before reading)/i);
    }
  });
});

describe('L83 — FIFTH MOVEMENT: after the Book closes, and said out loud', () => {
  it('every band lands the blessing on the DOER, in his deed', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops James 1:22`).toContain('be ye doers of the word, and not hearers only, deceiving your own selves');
      expect(TEXTS[b], `${b} drops where the blessing lands`).toContain('this man shall be blessed in his deed');
    }
  });

  it('every band EXCLUDES the merely-moved hearer in our own words', () => {
    // Split for the DR-0478 reason. Quoting where the blessing lands and
    // saying who it does NOT land on are two claims, and the second is the
    // one a shorter version drops.
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} does not exclude the merely-moved hearer`)
        .toMatch(/(felt moved|felt something and then forgot|merely moved by the reading|who was merely moved)/i);
    }
  });

  it('every band keeps Joshua’s ORDER: meditate, in order to do, then prosper', () => {
    for (const b of BANDS) {
      expect(ourWords(TEXTS[b]), `${b} does not chain the sequence in order`)
        .toMatch(/(in that order|and then your way goes well|and THEN the way prospers|to observance to prosperity)/i);
    }
  });

  it('every band grounds discernment in USE rather than information', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Hebrews 5:14`).toContain('who by reason of use have their senses exercised to discern both good and evil');
      expect(ourWords(TEXTS[b]), `${b} does not say practice outruns information`)
        .toMatch(/(comes from PRACTICE|practice outruns|practice consistently outruns)/i);
    }
  });

  it('every band makes the discussion a DUTY, not an option', () => {
    // Darrell's own second half: the treasure gets said out loud. A band that
    // ends on private growth has dropped the command.
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Colossians 3:16`).toContain('teaching and admonishing one another');
      expect(ourWords(TEXTS[b]), `${b} lets the growth stay private`)
        .toMatch(/(not private property|not meant to be kept secret|not optional|a duty rather than a pleasantry)/i);
    }
  });

  it('every band closes on a command with no expiry', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops 2 Peter 3:18`).toContain('But grow in grace, and in the knowledge of our Lord and Saviour Jesus Christ');
      expect(ourWords(TEXTS[b]), `${b} does not say the command never runs out`)
        .toMatch(/(never runs out|has no expiry|no retirement clause)/i);
    }
  });
});
