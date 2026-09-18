// =============================================================================
// L85 — The King's Code: every quoted verse is verbatim KJV
// =============================================================================
// Darrell 2026-08-24 (spoken lesson): "Yahweh... has given us the word, which
// is the exact blueprint and code he wants us to run... his identities wrapped
// in... he's testing us to identify who can agree with him... an if then
// statement, which is a deterministic algorithm... he separates the goat from
// the sheep. Goat in the world means greatest of all times... those are the
// ones that he says will be lost. The sheep are the ones that are his. He
// won't listen to anybody else... It's been written on their hearts from
// before time." Every KJV line below was FETCHED from the repo's own KJV
// (app/public/bible/kjv/*.json) this session — never written from memory
// (DR-0076 / DR-0281 QUOTED). The lesson must contain each quoted fragment
// letter-for-letter; a drifted quote fails the build (the L83/L84 discipline).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
// The lesson's own slice of the file, so pins can't match a different lesson.
const start = src.indexOf("id: 'll85-the-kings-code-sheep-hear-goats-of-the-world-lost'");
// Bound the slice to THIS lesson rather than to a fixed character window. A
// fixed window is fragile in BOTH directions: too small and it misses the end of
// the lesson (which is how adding adult-depth prose pushed `quiz:` out of view),
// too large and it sweeps into the NEXT lesson and judges someone else's prose.
const lesson = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();
// JS ’ escapes render as the typographic apostrophe where used.
const l = lesson.replace(/\\u2019/g, '’');

// Fetched verbatim from app/public/bible/kjv (full verses, this session).
const KJV = {
  'Matthew 25:32': 'And before him shall be gathered all nations: and he shall separate them one from another, as a shepherd divideth his sheep from the goats:',
  'Matthew 25:33': 'And he shall set the sheep on his right hand, but the goats on the left.',
  'Matthew 25:34': 'Then shall the King say unto them on his right hand, Come, ye blessed of my Father, inherit the kingdom prepared for you from the foundation of the world:',
  'Matthew 7:23': 'And then will I profess unto them, I never knew you: depart from me, ye that work iniquity.',
  'Matthew 16:26': 'For what is a man profited, if he shall gain the whole world, and lose his own soul? or what shall a man give in exchange for his soul?',
  'John 10:27': 'My sheep hear my voice, and I know them, and they follow me:',
  'John 10:5': 'And a stranger will they not follow, but will flee from him: for they know not the voice of strangers.',
  'Amos 3:3': 'Can two walk together, except they be agreed?',
  '1 John 2:3': 'And hereby we do know that we know him, if we keep his commandments.',
  'Isaiah 1:19': 'If ye be willing and obedient, ye shall eat the good of the land:',
  'Luke 6:46': 'And why call ye me, Lord, Lord, and do not the things which I say?',
  'Colossians 3:3': 'For ye are dead, and your life is hid with Christ in God.',
  'Psalms 40:8': 'I delight to do thy will, O my God: yea, thy law is within my heart.',
  'James 1:22': 'But be ye doers of the word, and not hearers only, deceiving your own selves.',
  'Hebrews 11:3': 'Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear.',
};

// Fragments the lesson quotes (subsets of the full verses above or fetched whole).
const QUOTED_FRAGMENTS = [
  'Through faith we understand that the worlds were framed by the word of God',
  'For ye are dead, and your life is hid with Christ in God',
  'I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me',
  'Can two walk together, except they be agreed?',
  'And hereby we do know that we know him, if we keep his commandments',
  'He that saith, I know him, and keepeth not his commandments, is a liar',
  'If ye be willing and obedient, ye shall eat the good of the land',
  'But if ye refuse and rebel, ye shall be devoured with the sword',
  'And why call ye me, Lord, Lord, and do not the things which I say?',
  'as a shepherd divideth his sheep from the goats',
  'And he shall set the sheep on his right hand, but the goats on the left',
  'and in thy name done many wonderful works',
  'I never knew you: depart from me, ye that work iniquity',
  'For what is a man profited, if he shall gain the whole world, and lose his own soul?',
  'My sheep hear my voice, and I know them, and they follow me',
  'And a stranger will they not follow, but will flee from him: for they know not the voice of strangers',
  'I will put my law in their inward parts, and write it in their hearts',
  'before the foundation of the world',
  'Come, ye blessed of my Father, inherit the kingdom prepared for you from the foundation of the world',
  'I delight to do thy will, O my God: yea, thy law is within my heart',
  'But be ye doers of the word, and not hearers only, deceiving your own selves',
  'I have set before you life and death, blessing and cursing: therefore choose life',
];

describe('L85 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Matthew 25:32-33'", 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(lesson).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/); // the catalog count grows with every new lesson; this lesson's presence is the real pin
    expect(src).toContain('L85 The King’s Code');
  });
  it("keeps the Governor's own framing, each phrase where it is owed", () => {
    // SPLIT 2026-09-18. This read the whole lesson block for four phrases, so
    // any one field could answer for all four — the pooled-scope defect
    // DR-0471 recorded and DR-0476 met again. Each phrase is now checked in
    // the field that owes it, and the two reader-facing ones are checked in
    // EVERY band rather than wherever they happen to survive.
    expect(l, 'the blueprint framing is gone from the lesson').toContain('exact blueprint and CODE');
    expect(l, 'the deterministic framing is gone from the lesson').toContain('deterministic algorithm');
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 60)}${frag.length > 60 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
    });
  }
});

describe('tamper-catch — the pinned KJV ground truth is itself exact', () => {
  it('full-verse pins match their known lengths and endings', () => {
    expect(KJV['Amos 3:3']).toBe('Can two walk together, except they be agreed?');
    expect(KJV['Matthew 25:33'].length).toBe(72);
    expect(KJV['John 10:27'].length).toBe(60);
    expect(KJV['Matthew 25:34'].endsWith('from the foundation of the world:')).toBe(true);
    expect(KJV['1 John 2:3'].startsWith('And hereby we do know')).toBe(true);
    // Each pinned fragment appears inside its own full verse where both exist.
    expect(KJV['Matthew 7:23']).toContain('I never knew you');
    expect(KJV['Hebrews 11:3']).toContain('framed by the word of God');
  });
});

// =============================================================================
// THE FOUR BANDS, EACH CARRYING THE WHOLE CODE (DR-0477)
// =============================================================================
// The full-levels pass reached L85 with all four bands short and youth absent:
// child 114 words at 0.23 of the adult lesson against a 0.50 floor, teen 145 at
// 0.29 and senior 221 at 0.44 against 0.60. The bands were rewritten, and these
// hold the rewrite.
//
// EVERY CLAIM CHECK READS OUR PROSE, NOT THE BAND, and no alternation branch is
// merely a word the passage happens to contain. Both rules are paid for: L88
// shipped a check the quoted verse answered for, and L86 shipped five checks
// that could not fail because a branch was true somewhere else in the same text
// (DR-0476). The helper is defined here, above every check that needs it.
const MODULE = LIVING_LESSONS_MODULES.find(
  (m) => m.id === 'll85-the-kings-code-sheep-hear-goats-of-the-world-lost',
);
const BANDS = ['child', 'youth', 'teen', 'senior'];
const TEXTS = Object.fromEntries(BANDS.map((b) => [b, String(MODULE.levels[b])]));
const READER = { ...TEXTS, lesson: String(MODULE.lesson), bigIdea: String(MODULE.bigIdea), inApp: String(MODULE.inApp) };
const ours = (t) => String(t).replace(/"[^"]*"/g, ' ');

describe('L85 — every band is the whole code, in that age’s words', () => {
  it('all four bands are present and none is short of its floor', () => {
    const measured = measureFullness(MODULE);
    expect(shortBands(measured), 'a band is missing or below its floor').toEqual([]);
    for (const b of BANDS) expect(measured.bands[b].present, `${b} is absent`).toBe(true);
  });

  it('reads in a rising ladder, with the child band under the ceiling', () => {
    const grade = (b) => fleschKincaidGrade(ourProseOnly(TEXTS[b]));
    const ladder = BANDS.map(grade);
    for (let i = 1; i < ladder.length; i += 1) {
      expect(ladder[i], `${BANDS[i]} (${ladder[i].toFixed(2)}) reads below ${BANDS[i - 1]} (${ladder[i - 1].toFixed(2)})`)
        .toBeGreaterThanOrEqual(ladder[i - 1]);
    }
    expect(grade('child'), 'the child band is over the 7.0 ceiling').toBeLessThanOrEqual(CHILD_CEILING);
  });

  it('EVERY band renders all FIVE movements as numbered sections', () => {
    // DR-0475: formatLessonText numbers a marker only when it is in a form it
    // knows AND the text before it ends in a sentence period. A band that
    // writes five movements and renders fewer has lost them on screen.
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

describe('L85 — His words whole, and our bookkeeping out of the reader’s way', () => {
  it('carries no ellipsis inside any quotation, in any reader-facing field', () => {
    for (const [k, v] of Object.entries(READER)) {
      const elided = String(v).match(/"[^"]*(?:\.\.\.|…)[^"]*"/g) || [];
      expect(elided, `${k} elides His words: ${elided.join(' | ')}`).toEqual([]);
    }
  });

  it('gives Matthew 7:22-23 back WHOLE, in the lesson and the bigIdea alike', () => {
    // This one elision cut "and in thy name have cast out devils?" out of the
    // most alarming sentence in the Sermon on the Mount — and cast-out devils
    // is the strongest item on the resume He declines to dispute. Removing it
    // weakened the very point the lesson is making.
    const whole = 'have we not prophesied in thy name? and in thy name have cast out devils? and in thy name done many wonderful works?';
    for (const field of ['lesson', 'bigIdea']) {
      expect(READER[field], `${field} no longer carries the whole resume`).toContain(whole);
    }
  });

  it('recites no record id to a reader, in any band or field', () => {
    for (const [k, v] of Object.entries(READER)) {
      expect(String(v).match(/DR-\d{4}/g) || [], `${k} recites a record id`).toEqual([]);
    }
  });
});

describe('L85 — the covenant name, in OUR voice only', () => {
  it('says Yahweh in each band’s own prose', () => {
    for (const b of BANDS) expect(ours(TEXTS[b]), `${b} never names Yahweh in its own voice`).toMatch(/Yahweh/);
  });

  it('never uses the generic name in our own prose, in any reader field', () => {
    for (const [k, v] of Object.entries(READER)) {
      expect(ourProseOnly(v).match(/\bGod\b/g) || [], `${k} uses the generic name in our own voice`).toEqual([]);
    }
  });

  it('leaves the generic name EXACTLY as the KJV wrote it, inside the quotations', () => {
    // The bright line runs both ways. Hebrews 11:3 says "the word of God" and
    // Psalms 40:8 says "O my God"; both are His Word, fetched verbatim. A sweep
    // that "fixed" them would corrupt the text, so it fails the build instead.
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} altered Hebrews 11:3`).toContain('the worlds were framed by the word of God');
      expect(TEXTS[b], `${b} altered Psalms 40:8`).toContain('I delight to do thy will, O my God');
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

describe('L85 — FIRST MOVEMENT: the code', () => {
  it('every band quotes Hebrews 11:3 and reads the seen out of the unseen', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Hebrews 11:3`).toContain('so that things which are seen were not made of things which do appear');
      const o = ours(TEXTS[b]);
      expect(o, `${b} does not read the verse as the seen coming out of the unseen`)
        .toMatch(/(came out of|proceeded out of|out of His own voice|out of something you cannot see|out of His voice)/i);
    }
  });

  it('every band says the same Word is the code He wants RUN in us', () => {
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      expect(o, `${b} does not turn the creating word into the code for us`)
        .toMatch(/(same Word|same words|blueprint|code He (wants|intends))/i);
    }
  });

  it('every band says it is an IDENTITY and not an external rulebook', () => {
    // The distinction is the teaching. "Rules" alone is not it, and neither is
    // a bare mention of Christ in me — the band has to set the two against
    // each other, which is why both halves are required.
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      expect(o, `${b} never names the rulebook it is refusing`)
        .toMatch(/(rulebook|list of rules|rules taped)/i);
      expect(o, `${b} never puts the identity in its place`)
        .toMatch(/(identity|who you (actually )?are|who you are|life hid with Christ)/i);
      expect(TEXTS[b], `${b} drops Galatians 2:20`).toContain('not I, but Christ liveth in me');
    }
  });
});

describe('L85 — SECOND MOVEMENT: the test is an if/then', () => {
  it('every band says He is NOT scouting talent', () => {
    // Stated as a refusal on purpose. It is the assumption every gifted reader
    // walks in with, and the whole fourth movement depends on it being denied
    // here first.
    for (const b of BANDS) {
      expect(ours(TEXTS[b]), `${b} lets the test be a talent search`)
        .toMatch(/(not (looking for the most talented|scouting)|is not scouting)/i);
    }
  });

  it('every band quotes Amos 3:3 and says what walking together requires', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Amos 3:3`).toContain('Can two walk together, except they be agreed?');
      expect(ours(TEXTS[b]), `${b} does not name agreement as the thing being tested`)
        .toMatch(/agree/i);
    }
  });

  it('every band carries BOTH branches of 1 John 2:3-4, and says there is no third', () => {
    // Half of this conditional is the comfortable half. A band that quotes
    // know-if-keep and stops has removed the branch that makes it a test.
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops the know-if-keep branch`)
        .toContain('we do know that we know him, if we keep his commandments');
      expect(TEXTS[b], `${b} drops the counter-branch`)
        .toContain('keepeth not his commandments, is a liar, and the truth is not in him');
      expect(ours(TEXTS[b]), `${b} does not say the two branches are the only two`)
        .toMatch(/(no third|only two answers)/i);
    }
  });

  it('every band aims the conditional at the say/do gap with Luke 6:46', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Luke 6:46`).toContain('And why call ye me, Lord, Lord, and do not the things which I say?');
      expect(ours(TEXTS[b]), `${b} does not name the gap the verse is aimed at`)
        .toMatch(/(what we actually DO|what (a|that) person (actually )?does|between the confession and the conduct)/);
    }
  });
});

describe('L85 — THIRD MOVEMENT: the separation', () => {
  it('every band quotes the sorting and keeps the right/left hand', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops the shepherd dividing`)
        .toContain('as a shepherd divideth his sheep from the goats');
      expect(TEXTS[b], `${b} drops the right and left hand`)
        .toContain('set the sheep on his right hand, but the goats on the left');
    }
  });

  it('every band reads the image as an ORDINARY shepherd’s work', () => {
    // The scene is not exotic, and saying so is the point: He is not staging a
    // spectacle, He is doing what a shepherd does at the end of a day.
    for (const b of BANDS) {
      expect(ours(TEXTS[b]), `${b} makes the sorting exotic instead of ordinary`)
        .toMatch(/(every single day|every day|ordinary (shepherd|workday)|unremarkable)/i);
    }
  });
});

describe('L85 — FOURTH MOVEMENT: the warning to the gifted', () => {
  it('every band expands GOAT and says the greatest can be lost', () => {
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      expect(o, `${b} drops the GOAT wordplay`).toMatch(/GOAT/);
      expect(o, `${b} does not expand it`).toMatch(/[Gg]reatest [Oo]f [Aa]ll [Tt]ime/);
      expect(o, `${b} does not say the greatest can be lost`).toMatch(/\blost\b/);
    }
  });

  it('every band says He does NOT dispute the works — He disputes the relationship', () => {
    // The whole force of Matthew 7 is in what He declines to argue about. A
    // band that lets the reader assume the works were fraudulent has taught
    // the opposite of the text.
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      expect(o, `${b} lets the works be disputed`)
        .toMatch(/(does not (say|argue|dispute)|never (argues|disputes))/i);
      expect(o, `${b} does not name the relationship as the thing in dispute`)
        .toMatch(/relationship|I never knew you/i);
    }
  });

  it('every band quotes Matthew 16:26 and states that giftedness is not agreement', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Matthew 16:26`)
        .toContain('For what is a man profited, if he shall gain the whole world, and lose his own soul?');
      expect(ours(TEXTS[b]), `${b} does not close the gifted warning`)
        .toMatch(/(not the same (thing )?as agreeing|is not agreement)/i);
    }
  });
});

describe('L85 — FIFTH MOVEMENT: the sheep’s mark, and why', () => {
  it('every band carries BOTH halves of the voice — they follow Him, and flee a stranger', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops John 10:27`).toContain('My sheep hear my voice, and I know them, and they follow me');
      expect(TEXTS[b], `${b} drops the negative half, John 10:5`)
        .toContain('And a stranger will they not follow, but will flee from him: for they know not the voice of strangers');
    }
  });

  it('every band denies that the sheep are cleverer, and says it is a voice walked with', () => {
    // The mark is not aptitude. Getting this wrong turns the lesson back into
    // the talent search the second movement denied.
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      expect(o, `${b} makes the sheep smarter instead of familiar`)
        .toMatch(/not (because they are |more )?(smarter|cleverer|discerning)/i);
      expect(o, `${b} does not say they know a voice they have walked with`)
        .toMatch(/(walking (with|beside)|walked beside)/i);
    }
  });

  it('every band gives the REASON: Yahweh wrote it inward, before the foundation', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Jeremiah 31:33`).toContain('I will put my law in their inward parts, and write it in their hearts');
      expect(TEXTS[b], `${b} drops the election before the world`).toContain('before the foundation of the world');
    }
  });

  it('every band lands on BEST WRITTEN rather than best-ranked', () => {
    // This is the relief the lesson is offering, and the sentence Darrell
    // himself put at the centre of it.
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      expect(o, `${b} drops the best-written conclusion`).toMatch(/best WRITTEN/i);
      expect(o, `${b} does not say the sheep may not win what the world measures`)
        .toMatch(/(never win a trophy|best at (anything|nothing) the world|full trophy case)/i);
    }
  });

  it('every band makes DOING the proof of the hearing, and sends the reader to do one thing', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops James 1:22`).toContain('But be ye doers of the word, and not hearers only, deceiving your own selves');
      const o = ours(TEXTS[b]);
      expect(o, `${b} does not send the reader to do one known thing`)
        .toMatch(/(one (thing|command)|a single command)/i);
      expect(o, `${b} does not refuse the earning reading`)
        .toMatch(/(not to earn|not doing it to earn|not to earn standing)/i);
    }
  });

  it('every band quotes Psalms 40:8 and says the law is INSIDE, not merely agreed with', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Psalms 40:8`).toContain('yea, thy law is within my heart');
      expect(ours(TEXTS[b]), `${b} does not draw the inside/agreed-with distinction`)
        .toMatch(/(not merely (something he )?agree|rather than merely assented|and not merely agreed)/i);
    }
  });
});
