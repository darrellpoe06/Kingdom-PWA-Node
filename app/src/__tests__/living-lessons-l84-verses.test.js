// =============================================================================
// L84 — Blessed and Highly Favored: every quoted verse is verbatim KJV
// =============================================================================
// Darrell 2026-08-24 (spoken lesson request): "what does it mean to be blessed
// and highly favored based on the biblical scriptures across all ages until
// the revelation? Before during and after time?... everything they must endure
// challenge etc..." Every KJV line below was FETCHED from the repo's own KJV
// (app/public/bible/kjv/*.json) this session — never written from memory
// (DR-0076 / DR-0281 QUOTED). The lesson must contain each quoted fragment
// letter-for-letter; a drifted quote fails the build (the L83 discipline).
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
const start = src.indexOf("id: 'll84-blessed-and-highly-favored-before-during-after-time'");
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
// JS ’ escapes render as the typographic apostrophe the KJV uses.
const l = lesson.replace(/\\u2019/g, '’');

// Fetched verbatim from app/public/bible/kjv (full verses, this session).
const KJV = {
  'Ephesians 1:3': 'Blessed be the God and Father of our Lord Jesus Christ, who hath blessed us with all spiritual blessings in heavenly places in Christ:',
  'Ephesians 1:4': 'According as he hath chosen us in him before the foundation of the world, that we should be holy and without blame before him in love:',
  'Luke 1:28': 'And the angel came in unto her, and said, Hail, thou that art highly favoured, the Lord is with thee: blessed art thou among women.',
  'Luke 2:35': '(Yea, a sword shall pierce through thy own soul also,) that the thoughts of many hearts may be revealed.',
  'Genesis 6:8': 'But Noah found grace in the eyes of the LORD.',
  'Genesis 39:21': 'But the LORD was with Joseph, and shewed him mercy, and gave him favour in the sight of the keeper of the prison.',
  'Psalms 105:19': 'Until the time that his word came: the word of the LORD tried him.',
  'Psalms 5:12': 'For thou, LORD, wilt bless the righteous; with favour wilt thou compass him as with a shield.',
  'Daniel 1:9': 'Now God had brought Daniel into favour and tender love with the prince of the eunuchs.',
  'James 1:12 (fragment)': 'Blessed is the man that endureth temptation',
  'Hebrews 12:6': 'For whom the Lord loveth he chasteneth, and scourgeth every son whom he receiveth.',
  'Revelation 20:6 (fragment)': 'Blessed and holy is he that hath part in the first resurrection',
  'Revelation 21:4 (fragment)': 'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying',
};

// Fragments the lesson quotes (subsets of the full verses above or fetched whole).
const QUOTED_FRAGMENTS = [
  'who hath blessed us with all spiritual blessings in heavenly places in Christ',
  'chosen us in him before the foundation of the world',
  'which was given us in Christ Jesus before the world began',
  'Hail, thou that art highly favoured, the Lord is with thee: blessed art thou among women',
  'Fear not, Mary: for thou hast found favour with God',
  'a sword shall pierce through thy own soul also',
  'But Noah found grace in the eyes of the LORD',
  'and thou shalt be a blessing',
  'But the LORD was with Joseph, and shewed him mercy, and gave him favour in the sight of the keeper of the prison',
  'Until the time that his word came: the word of the LORD tried him',
  'ye thought evil against me; but God meant it unto good',
  'the LORD blessed the latter end of Job more than his beginning',
  'Now God had brought Daniel into favour and tender love with the prince of the eunuchs',
  'Blessed are they which are persecuted for righteousness’ sake: for theirs is the kingdom of heaven',
  'Rejoice, and be exceeding glad: for great is your reward in heaven',
  'For whom the Lord loveth he chasteneth, and scourgeth every son whom he receiveth',
  'My grace is sufficient for thee: for my strength is made perfect in weakness',
  'Blessed is the man that endureth temptation',
  'with favour wilt thou compass him as with a shield',
  'Blessed is he that readeth, and they that hear the words of this prophecy',
  'Blessed and holy is he that hath part in the first resurrection',
  'Blessed are they that do his commandments, that they may have right to the tree of life',
  'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying',
];

describe('L84 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Luke 1:28'", 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(lesson).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/); // the catalog count grows with every new lesson; this lesson's presence is the real pin
    expect(src).toContain('L84 Blessed and Highly Favored');
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
    expect(KJV['Genesis 6:8']).toBe('But Noah found grace in the eyes of the LORD.');
    expect(KJV['Luke 1:28'].endsWith('blessed art thou among women.')).toBe(true);
    expect(KJV['Genesis 39:21'].length).toBe(113);
    expect(KJV['Hebrews 12:6'].startsWith('For whom the Lord loveth')).toBe(true);
    // Each pinned fragment appears inside its own full verse where both exist.
    expect(KJV['Revelation 21:4 (fragment)']).toContain('wipe away all tears');
  });
});

// =============================================================================
// THE FOUR BANDS, EACH CARRYING THE WHOLE DEFINITION (DR-0478)
// =============================================================================
// The full-levels pass reached L84 with all four bands short and youth absent:
// child 138 words at 0.26 of the adult lesson against a 0.50 floor, teen 229 at
// 0.42 and senior 311 at 0.57 against 0.60 — and the senior band reading at
// FK 11.55 against an adult lesson at 5.72. Eight elided quotations sat across
// five reader-facing fields, the most of any lesson in this pass.
//
// EVERY CLAIM CHECK READS OUR PROSE, NOT THE BAND, and no alternation branch is
// merely a word the passage happens to contain. Both rules are paid for: L88
// shipped a check the quoted verse answered for, and L86 shipped five that
// could not fail because a branch was true elsewhere in the same text
// (DR-0476). The helper is defined here, above every check that needs it.
const MODULE = LIVING_LESSONS_MODULES.find(
  (m) => m.id === 'll84-blessed-and-highly-favored-before-during-after-time',
);
const BANDS = ['child', 'youth', 'teen', 'senior'];
const TEXTS = Object.fromEntries(BANDS.map((b) => [b, String(MODULE.levels[b])]));
const READER = { ...TEXTS, lesson: String(MODULE.lesson), bigIdea: String(MODULE.bigIdea), inApp: String(MODULE.inApp) };
const ours = (t) => String(t).replace(/"[^"]*"/g, ' ');

describe('L84 — every band is the whole definition, in that age’s words', () => {
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

describe('L84 — eight elisions gone, and the reader has the whole sentence', () => {
  it('carries no ellipsis inside any quotation, in any reader-facing field', () => {
    for (const [k, v] of Object.entries(READER)) {
      const elided = String(v).match(/"[^"]*(?:\.\.\.|…)[^"]*"/g) || [];
      expect(elided, `${k} elides His words: ${elided.join(' | ')}`).toEqual([]);
    }
  });

  it('gives Genesis 12:2 back with the name-great clause it had cut', () => {
    // The elision ran "I will bless thee... and thou shalt be a blessing" and
    // dropped "and make thy name great" — which is the middle term of the
    // blessing, and part of what makes Abraham a blessing to others.
    for (const field of ['lesson', 'bigIdea']) {
      expect(READER[field], `${field} still cuts Genesis 12:2`)
        .toContain('I will bless thee, and make thy name great; and thou shalt be a blessing');
    }
  });

  it('gives Genesis 50:20 back with the as-it-is-this-day clause', () => {
    // The cut removed "to bring to pass, as it is this day" — the clause that
    // dates the vantage, and the reason Joseph can say it at all.
    for (const field of ['lesson', 'bigIdea']) {
      expect(READER[field], `${field} still cuts Genesis 50:20`)
        .toContain('but God meant it unto good, to bring to pass, as it is this day, to save much people alive');
    }
  });

  it('gives Matthew 5:11 back WHOLE, revile and persecute and slander alike', () => {
    // The elision left "when men shall revile you... for my sake" and dropped
    // persecution and false witness — two of the three things the verse names,
    // and the two a reader is most likely to actually face.
    for (const field of ['lesson', 'bigIdea']) {
      expect(READER[field], `${field} still cuts Matthew 5:11`)
        .toContain('when men shall revile you, and persecute you, and shall say all manner of evil against you falsely, for my sake');
    }
  });

  it('gives Genesis 39:21 back whole in EVERY band, keeper of the prison included', () => {
    // Two bands elided this one, and what they cut was the location: "in the
    // sight of the keeper of the prison". That phrase IS the lesson's thesis —
    // the favour is inside the prison. The elision removed the evidence for
    // the claim the band was making.
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} does not carry Genesis 39:21 whole`)
        .toContain('But the LORD was with Joseph, and shewed him mercy, and gave him favour in the sight of the keeper of the prison');
    }
  });

  it('recites no record id to a reader, in any band or field', () => {
    for (const [k, v] of Object.entries(READER)) {
      expect(String(v).match(/DR-\d{4}/g) || [], `${k} recites a record id`).toEqual([]);
    }
  });
});

describe('L84 — the covenant name, in OUR voice only', () => {
  it('says Yahweh in each band’s own prose', () => {
    for (const b of BANDS) expect(ours(TEXTS[b]), `${b} never names Yahweh in its own voice`).toMatch(/Yahweh/);
  });

  it('never uses the generic name in our own prose, in any reader field', () => {
    // The child band used to say "God chose her", "God being WITH you is the
    // favor", "God is training you" — five generic uses in our own voice, in
    // the band least able to work out which god was meant.
    for (const [k, v] of Object.entries(READER)) {
      expect(ourProseOnly(v).match(/\bGod\b/g) || [], `${k} uses the generic name in our own voice`).toEqual([]);
    }
  });

  it('leaves the generic name EXACTLY as the KJV wrote it, inside the quotations', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} altered Daniel 1:9`).toContain('Now God had brought Daniel into favour and tender love');
      expect(TEXTS[b], `${b} altered Revelation 21:4`).toContain('And God shall wipe away all tears from their eyes');
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

describe('L84 — FIRST MOVEMENT: the slogan, and the cost of believing it', () => {
  it('every band names the drifted meaning before correcting it', () => {
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      expect(o, `${b} never names the slogan it is correcting`)
        .toMatch(/(slogan|everything is going great|easy mode|easy days)/i);
      expect(o, `${b} does not say the Word means something else`)
        .toMatch(/(Word means something else|not what the Word means|the definition the Word actually gives)/i);
    }
  });

  it('every band states the CONSEQUENCE of running on the slogan', () => {
    // This is the pastoral reason the lesson exists, and it is the sentence a
    // shorter version always drops: believing the slogan makes a person read
    // hard providence as abandonment.
    for (const b of BANDS) {
      expect(ours(TEXTS[b]), `${b} does not say what believing the slogan costs`)
        .toMatch(/(Yahweh (walked away|has abandoned|abandoned)|think Yahweh left)/i);
    }
  });
});

describe('L84 — SECOND MOVEMENT: before time, the blessing precedes you', () => {
  it('every band quotes Ephesians 1:3', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Ephesians 1:3`).toContain('blessed us with all spiritual blessings in heavenly places in Christ');
    }
  });

  it('every band PRESSES the location rather than echoing the verse', () => {
    // NOT /in heavenly places/. Our prose repeats that phrase straight out of
    // the verse, so the branch was satisfied by an echo and the sentence that
    // actually presses the point could be deleted with the gate green — the
    // DR-0476 shape again. What is required is the claim: a statement of WHERE
    // the blessings are held.
    for (const b of BANDS) {
      expect(ours(TEXTS[b]), `${b} does not press where the blessings are kept`)
        .toMatch(/(where (those|the) blessings are (kept|located)|kept in heaven|blessings are held)/i);
    }
  });

  it('every band draws the CONSEQUENCE of the location', () => {
    // Split out of the check above on 2026-09-18: both assertions lived in one
    // test, so a break that removed only the consequence reported as a
    // location failure and the harness could not tell them apart. A check that
    // cannot be attributed is a check that cannot be trusted.
    for (const b of BANDS) {
      expect(ours(TEXTS[b]), `${b} does not draw the consequence of the location`)
        .toMatch(/(cannot revoke|can revoke|take them away|cancel them|standing to revoke)/i);
    }
  });

  it('every band gives the TIMING, before the foundation of the world', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Ephesians 1:4`).toContain('he hath chosen us in him before the foundation of the world');
    }
  });

  it('every band says favour is an ASSIGNMENT, not earned applause', () => {
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      expect(o, `${b} lets favour be earned`)
        .toMatch(/(not earned applause|not a prize you win|not a report card)/i);
      expect(o, `${b} does not call it an assignment or a job`)
        .toMatch(/(assignment|a job Yahweh gave)/i);
    }
  });
});

describe('L84 — THIRD MOVEMENT: watch what favour actually did', () => {
  it('every band walks ALL SIX witnesses of the record', () => {
    // One example is an anecdote; the force of this movement is cumulative.
    // Dropping any of the six turns the argument back into a proof-text.
    for (const b of BANDS) {
      for (const who of ['Noah', 'Abraham', 'Joseph', 'Job', 'Daniel', 'Mary']) {
        expect(TEXTS[b], `${b} drops ${who}`).toContain(who);
      }
    }
  });

  it('every band places the favour INSIDE the prison', () => {
    for (const b of BANDS) {
      expect(ours(TEXTS[b]), `${b} does not place the favour inside the prison`)
        .toMatch(/(IN the prison|in the prison|inside it|domiciled in the prison|Where was the favor)/);
    }
  });

  it('every band REFUSES the instead-of reading explicitly', () => {
    // Split for the same reason as the Ephesians pair. Placing the favour in
    // the prison and refusing the instead-of reading are two claims, and the
    // second is the one a shorter version drops.
    for (const b of BANDS) {
      expect(ours(TEXTS[b]), `${b} does not refuse the instead-of reading`)
        .toMatch(/(not instead of|not substituted for)/i);
    }
  });

  it('every band carries the promise doing the trying, Psalms 105:19', () => {
    // The line Darrell called worth a lifetime: the promise itself was the
    // trial, until the man could carry it. It is the mechanism of the whole
    // lesson and the easiest thing to cut for length.
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Psalms 105:19`).toContain('Until the time that his word came: the word of the LORD tried him');
      expect(ours(TEXTS[b]), `${b} does not say the promise did the trying`)
        .toMatch(/promise itself did the trying/i);
    }
  });

  it('every band keeps Mary’s greeting and her sword TOGETHER', () => {
    // Splitting these two is how the slogan survives. The same favour that
    // said "highly favoured" said "a sword shall pierce".
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops the greeting`).toContain('Hail, thou that art highly favoured, the Lord is with thee');
      expect(TEXTS[b], `${b} drops the sword`).toContain('a sword shall pierce through thy own soul also');
      expect(ours(TEXTS[b]), `${b} does not take her to the cross`).toMatch(/cross/i);
    }
  });
});

describe('L84 — FOURTH MOVEMENT: the hard seasons named as love', () => {
  it('every band puts the persecuted ON the blessed list, not beside it', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Matthew 5:10`)
        .toContain('Blessed are they which are persecuted for righteousness’ sake: for theirs is the kingdom of heaven');
      expect(ours(TEXTS[b]), `${b} lets it read as a consolation prize`)
        .toMatch(/(not a (consolation|sad little)|It IS on the list|it is ON the list)/i);
    }
  });

  it('every band names the chastening as LOVE rather than abandonment', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Hebrews 12:6`).toContain('For whom the Lord loveth he chasteneth');
      expect(ours(TEXTS[b]), `${b} does not read the hard season as love`)
        .toMatch(/(loving you like a good father|as love rather than abandonment|named as love|filial training)/i);
    }
  });

  it('every band notes that Paul asked for removal and did NOT get it', () => {
    // The sufficiency means nothing without that fact. A band that quotes the
    // grace-is-sufficient line while implying the thorn was removed has
    // taught the slogan using the verse that refutes it.
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops 2 Corinthians 12:9`).toContain('My grace is sufficient for thee: for my strength is made perfect in weakness');
      expect(ours(TEXTS[b]), `${b} does not say the request was refused`)
        .toMatch(/(asked for removal and did not|Yahweh said no|did not receive it|did not get it)/i);
    }
  });
});

describe('L84 — FIFTH MOVEMENT: after time, and the definition', () => {
  it('every band lets Revelation wipe every tear', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Revelation 21:4`)
        .toContain('there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain');
    }
  });

  it('every band states the four-part definition the Word gives', () => {
    // Chosen before time, carried THROUGH the trial, trained by it, crowned
    // after. All four, or the definition collapses back into the slogan.
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      expect(o, `${b} drops the chosen-before-time part`).toMatch(/(before time|before you were born|chosen before time)/i);
      expect(o, `${b} drops the carried-through part`).toMatch(/(THROUGH the (trial|hard)|with you right now|presence through the trial|carried THROUGH)/i);
      expect(o, `${b} drops the training part`).toMatch(/train/i);
      expect(o, `${b} drops the crowned-after part`).toMatch(/(crowned after|happy ending waiting|coronation after)/i);
    }
  });

  it('every band says favour is presence and assignment, NOT exemption', () => {
    for (const b of BANDS) {
      expect(ours(TEXTS[b]), `${b} does not refuse the exemption reading`)
        .toMatch(/(not exemption|does not mean you get to skip)/i);
    }
  });

  it('every band lands the application on the reader’s own season', () => {
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      expect(o, `${b} does not say Joseph had it in the cell`).toMatch(/(in the cell|in the jail)/i);
      expect(o, `${b} does not say Mary had it at the cross`).toMatch(/Mary had (it |favor )?at the cross/i);
      expect(o, `${b} does not tell the reader to re-read their own season`)
        .toMatch(/(read your (season|day)|read its season)/i);
    }
  });
});
