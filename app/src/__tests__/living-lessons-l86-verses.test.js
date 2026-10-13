// =============================================================================
// L86 — The Gospel of Luke: every quoted verse is verbatim KJV
// =============================================================================
// Darrell 2026-08-24: the Luke survey lesson he is teaching through (framework
// credit: Tommy C. Higle, "Journey of a Lifetime", 1992 — cited as the study
// source; the lesson prose is the house's own). Every KJV line below was
// FETCHED from the repo's own KJV (app/public/bible/kjv/*.json) this session —
// never written from memory (DR-0076 / DR-0281 QUOTED). The lesson must
// contain each quoted fragment letter-for-letter; a drifted quote fails the
// build (the L83-L85 discipline).
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
const start = src.indexOf("id: 'll86-luke-research-meets-inspiration-son-of-man-for-all'");
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
const l = lesson.replace(/\\u2019/g, '’');

// Fetched verbatim from app/public/bible/kjv (full verses, this session).
const KJV = {
  'Luke 1:4': 'That thou mightest know the certainty of those things, wherein thou hast been instructed.',
  'Luke 1:13': 'But the angel said unto him, Fear not, Zacharias: for thy prayer is heard; and thy wife Elisabeth shall bear thee a son, and thou shalt call his name John.',
  'Luke 1:19': 'And the angel answering said unto him, I am Gabriel, that stand in the presence of God; and am sent to speak unto thee, and to shew thee these glad tidings.',
  'Luke 2:1': 'And it came to pass in those days, that there went out a decree from Caesar Augustus, that all the world should be taxed.',
  'Luke 2:25': 'And, behold, there was a man in Jerusalem, whose name was Simeon; and the same man was just and devout, waiting for the consolation of Israel: and the Holy Ghost was upon him.',
  'Luke 2:32': 'A light to lighten the Gentiles, and the glory of thy people Israel.',
  'Luke 4:26': 'But unto none of them was Elias sent, save unto Sarepta, a city of Sidon, unto a woman that was a widow.',
  'Luke 4:27': 'And many lepers were in Israel in the time of Eliseus the prophet; and none of them was cleansed, saving Naaman the Syrian.',
  'Luke 19:10': 'For the Son of man is come to seek and to save that which was lost.',
};

const QUOTED_FRAGMENTS = [
  'Forasmuch as many have taken in hand to set forth in order a declaration of those things which are most surely believed among us',
  'which from the beginning were eyewitnesses, and ministers of the word',
  'having had perfect understanding of all things from the very first',
  'That thou mightest know the certainty of those things, wherein thou hast been instructed',
  'thy wife Elisabeth shall bear thee a son, and thou shalt call his name John',
  'I am Gabriel, that stand in the presence of God',
  'there went out a decree from Caesar Augustus, that all the world should be taxed',
  'just and devout, waiting for the consolation of Israel: and the Holy Ghost was upon him',
  'For mine eyes have seen thy salvation',
  'A light to lighten the Gentiles, and the glory of thy people Israel',
  'The Spirit of the Lord is upon me, because he hath anointed me to preach the gospel to the poor',
  'No prophet is accepted in his own country',
  'many widows were in Israel in the days of Elias',
  'But unto none of them was Elias sent, save unto Sarepta, a city of Sidon, unto a woman that was a widow',
  'many lepers were in Israel in the time of Eliseus the prophet; and none of them was cleansed, saving Naaman the Syrian',
  'filled with wrath',
  'that they might cast him down headlong',
  'For the Son of man is come to seek and to save that which was lost',
];

describe('L86 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Luke 1:4'", 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(lesson).toContain(key);
    }
    expect(src).toContain('L86 The Gospel of Luke');
  });
  it('cites the study framework honestly', () => {
    expect(l).toContain('Journey of a Lifetime');
    expect(l).toContain('Higle');
  });
  // The survey answers moved out of this pooled check on 2026-09-18. It read
  // the whole lesson block for three fragments, so any one field could answer
  // for all of them — and one fragment it pinned was a CAPS emphasis inside
  // the old teen band ('Naaman the SYRIAN') rather than a survey answer at all.
  // The answers are checked per band below, in the band that owes them.
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
    expect(KJV['Luke 1:4'].length).toBe(89);
    expect(KJV['Luke 2:32']).toBe('A light to lighten the Gentiles, and the glory of thy people Israel.');
    expect(KJV['Luke 4:26'].endsWith('unto a woman that was a widow.')).toBe(true);
    expect(KJV['Luke 4:27']).toContain('Naaman the Syrian');
    expect(KJV['Luke 19:10'].length).toBe(67);
    expect(KJV['Luke 1:13']).toContain('Elisabeth shall bear thee a son');
    expect(KJV['Luke 1:19'].startsWith('And the angel answering said')).toBe(true);
    expect(KJV['Luke 2:1']).toContain('Caesar Augustus');
    expect(KJV['Luke 2:25']).toContain('Simeon');
  });
});

// =============================================================================
// THE FOUR BANDS, EACH CARRYING THE WHOLE SURVEY (DR-0476)
// =============================================================================
// The full-levels pass reached L86 with all four bands short — child at 0.24 of
// the adult lesson against a 0.50 floor, teen 0.31 and senior 0.51 against 0.60,
// and youth absent entirely — and with the two upper bands unreadable at their
// own register: child FK 11.15, teen 12.64. So the bands were rewritten, and
// these are the checks that hold the rewrite.
//
// EVERY CLAIM CHECK BELOW READS OUR PROSE, NOT THE BAND. That is not a
// formality. L88 shipped a check for the good ground that read the whole band,
// and Luke 8:15's own wording carries honest, keep and patience — so HIS
// sentence answered for ours and the check could not fail. The helper is
// defined here, above every check that needs it, for exactly that reason.
const MODULE = LIVING_LESSONS_MODULES.find(
  (m) => m.id === 'll86-luke-research-meets-inspiration-son-of-man-for-all',
);
const BANDS = ['child', 'youth', 'teen', 'senior'];
const TEXTS = Object.fromEntries(BANDS.map((b) => [b, String(MODULE.levels[b])]));
const READER = { ...TEXTS, lesson: String(MODULE.lesson), bigIdea: String(MODULE.bigIdea), inApp: String(MODULE.inApp) };
const ours = (t) => String(t).replace(/"[^"]*"/g, ' ');

describe('L86 — every band is the whole survey, in that age’s words', () => {
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
    // The DR-0475 finding, checked where it bit: formatLessonText numbers a
    // marker only when it is in a form the formatter knows AND the text before
    // it ends in a sentence period. L87 shipped for months rendering [1,2,3] of
    // six written movements, so a reader never saw half of them. A band that
    // writes five and renders fewer fails here.
    for (const b of BANDS) {
      const { items, sectionCount } = formatLessonText(TEXTS[b]);
      expect(sectionCount, `${b} does not render five movements`).toBe(5);
      expect(items.filter((i) => i.n).map((i) => i.n)).toEqual([1, 2, 3, 4, 5]);
      for (const i of items) {
        expect(i.text.length, `${b} has a chunk over the house wall limit`).toBeLessThanOrEqual(420);
      }
    }
  });

  it('the senior band still hands a facilitator the two study answers by name', () => {
    // This band is the one a teacher reads standing up, so the two identify-the-
    // people answers have to be in it explicitly, not inferable from the
    // narrative. Checked in THIS band because this band is the one that owes it.
    const o = ours(TEXTS.senior);
    expect(o, 'the senior band does not name the two study answers as the answers').toMatch(/two study answers/i);
    expect(o, 'the senior band drops the Elias answer').toMatch(/Elias and the widow of Sarepta/);
    expect(o, 'the senior band drops the Eliseus answer').toMatch(/Eliseus and Naaman/);
  });

  it('names its own lesson in the opening of every band', () => {
    for (const b of BANDS) {
      expect(namesItsLesson(MODULE.title, TEXTS[b]), `${b} does not open by naming its lesson`).toBe(true);
    }
  });
});

describe('L86 — the elisions are gone, and the reader has the whole sentence', () => {
  it('carries no ellipsis inside any quotation, in any reader-facing field', () => {
    for (const [k, v] of Object.entries(READER)) {
      const elided = String(v).match(/"[^"]*(?:\.\.\.|…)[^"]*"/g) || [];
      expect(elided, `${k} elides His words: ${elided.join(' | ')}`).toEqual([]);
    }
  });

  it('gives the three spans back CONTIGUOUS, in the lesson and the bigIdea alike', () => {
    // Each of these three was shipped with an ellipsis through the middle while
    // a contiguous KJV span was sitting right there. The fix is never a shorter
    // elision; it is the sentence.
    const HEALED = [
      'a virgin espoused to a man whose name was Joseph, of the house of David; and the virgin’s name was Mary',
      'many widows were in Israel in the days of Elias, when the heaven was shut up three years and six months, when great famine was throughout all the land; But unto none of them was Elias sent',
      'filled with wrath, And rose up, and thrust him out of the city, and led him unto the brow of the hill whereon their city was built, that they might cast him down headlong',
    ];
    for (const span of HEALED) {
      for (const field of ['lesson', 'bigIdea']) {
        expect(READER[field], `${field} lost: ${span.slice(0, 50)}`).toContain(span);
      }
    }
  });

  it('recites no record id to a reader, in any band or field', () => {
    // The senior band used to close its prologue note with a DR number. A
    // reader in a pew has no way to open one; it belongs in the repo.
    for (const [k, v] of Object.entries(READER)) {
      expect(String(v).match(/DR-\d{4}/g) || [], `${k} recites a record id`).toEqual([]);
    }
  });
});

describe('L86 — the covenant name, in OUR voice only', () => {
  it('says Yahweh in each band’s own prose', () => {
    for (const b of BANDS) expect(ours(TEXTS[b]), `${b} never names Yahweh in its own voice`).toMatch(/Yahweh/);
  });

  it('never uses the generic name in our own prose, in any reader field', () => {
    // The bigIdea said "Religion that owns God for its own circle" while the
    // adult lesson said Yahweh in the same sentence — our voice, two names for
    // Him, and the reader left guessing which god was meant.
    for (const [k, v] of Object.entries(READER)) {
      const prose = ourProseOnly(v);
      const hits = prose.match(/\bGod\b/g) || [];
      expect(hits, `${k} uses the generic name in our own voice`).toEqual([]);
    }
  });

  it('leaves the generic name EXACTLY as the KJV wrote it, inside the quotations', () => {
    // The bright line runs the other way too. Gabriel says he stands in the
    // presence of God, and that is His Word, fetched verbatim. A sweep that
    // "fixed" it would corrupt the text.
    expect(READER.lesson).toContain('"I am Gabriel, that stand in the presence of God"');
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} altered the quoted verse`).toContain('I am Gabriel, that stand in the presence of God');
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

describe('L86 — FIRST MOVEMENT: he showed his work', () => {
  it('every band teaches the method as STEPS, not as a mood', () => {
    // The point of Luke 1:1-4 is that it is a list. A band that says "Luke was
    // careful" and stops has dropped the movement.
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      const steps = [
        /(read|weigh|accounts|written)/i,           // prior accounts
        /(eyewitness|saw Jesus|who were actually there|people who saw)/i,
        /(very first|very start|back to the)/i,     // comprehensive tracing
        /(in order|ordered)/i,                      // ordered composition
        /(certain|certainty|sure)/i,                // the stated purpose
      ];
      const carried = steps.filter((re) => re.test(o)).length;
      expect(carried, `${b} carries only ${carried} of the five declared steps`).toBe(5);
    }
  });

  it('every band says research and inspiration sit in the SAME document', () => {
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      expect(o, `${b} does not put research and inspiration together`)
        .toMatch(/(research|check|doctor)/i);
      // NOT /inspiration/. That word sits in the naming line of every band, so
      // the tagline answered for the claim and the check could not fail — the
      // DR-0471 finding again. Each band must SAY the two belong together.
      expect(o, `${b} does not say the two belong together`)
        .toMatch(/(both at once|book Yahweh inspired|same document|same man, in the same book|occupy the same)/i);
    }
  });

  it('every band refuses the leap-past-evidence reading of faith', () => {
    // Stated as a refusal on purpose. This is the claim a reader carries out of
    // the prologue, and the one most often softened into "just believe".
    for (const b of BANDS) {
      expect(ours(TEXTS[b]), `${b} lets faith be a leap past the evidence`)
        .toMatch(/(switch your (brain|mind) off|not a leap|not enemies|tested testimony)/i);
    }
  });
});

describe('L86 — SECOND MOVEMENT: who Luke is showing you', () => {
  it('every band ties the birth detail to the PORTRAIT, not to sentiment', () => {
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      expect(o, `${b} does not name the Son of man portrait`).toMatch(/Son of man/);
      // NOT /a son of man has/ — that clause is the humanity check's evidence
      // one line below, and while it was in this alternation the sentence that
      // gives the REASON could be deleted with the gate still green.
      expect(o, `${b} does not give the reason for the birth detail`)
        .toMatch(/(portrait|reason|rather than sentiment)/i);
      expect(o, `${b} does not carry the humanity itself`).toMatch(/(cradle|mother|childhood|little bed|grows up)/i);
    }
  });

  it('every band separates the three emphases by name', () => {
    // Matthew SAID, Mark DID, Luke IS. Dropping one of the three leaves the
    // comparison making no point at all.
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      expect(o, `${b} drops Matthew`).toMatch(/Matthew[^.]*\b(said|say)\b/i);
      expect(o, `${b} drops Mark`).toMatch(/Mark[^.]*\bdid\b/i);
      expect(o, `${b} drops the Luke half of the comparison`).toMatch(/Luke[^.]*\bis\b/i);
    }
  });

  it('every band quotes the mission of that same figure', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops Luke 19:10`)
        .toContain('For the Son of man is come to seek and to save that which was lost');
    }
  });
});

describe('L86 — THIRD MOVEMENT: the cast tells the story', () => {
  it('every band carries all four of the named cast', () => {
    for (const b of BANDS) {
      for (const who of ['Zacharias', 'Elisabeth', 'Gabriel', 'Caesar Augustus', 'Simeon']) {
        expect(TEXTS[b], `${b} drops ${who}`).toContain(who);
      }
      expect(ours(TEXTS[b]), `${b} does not say whose parents they are`).toMatch(/John the Baptist/);
    }
  });

  it('every band reads the tax decree as providence’s logistics, in OUR words', () => {
    // The teaching is not that a census happened. It is that Yahweh kept His
    // own schedule through an empire's paperwork — which is our claim about
    // Him, so it is checked in our prose.
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      expect(o, `${b} does not name Bethlehem as the appointed place`).toMatch(/Bethlehem/);
      expect(o, `${b} does not credit the schedule to Yahweh`)
        .toMatch(/Yahweh (used|kept)/i);
      expect(o, `${b} does not name the paperwork as the instrument`)
        .toMatch(/(tax (form|office)|paperwork|administration|paper order)/i);
    }
  });

  it('every band lets Simeon say ALL people, with the Gentiles named', () => {
    for (const b of BANDS) {
      expect(TEXTS[b], `${b} drops the Gentile half of Simeon’s song`)
        .toContain('A light to lighten the Gentiles, and the glory of thy people Israel');
      expect(ours(TEXTS[b]), `${b} does not make the reader hold the line`)
        .toMatch(/(all people|hold (on to|that))/i);
    }
  });
});

describe('L86 — FOURTH MOVEMENT: Nazareth, and the cliff', () => {
  it('every band produces BOTH receipts, and says both are outsiders', () => {
    // One receipt is an anecdote. Two is a pattern, and the pattern is the
    // point: His mercy never stopped at the border. A band with one has lost
    // the argument the scene is making.
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      const widow = /(widow|Sarepta|Sidonian)/i.test(o);
      const naaman = /(Naaman|Syrian|army captain|soldier)/i.test(o);
      expect(widow, `${b} drops the widow`).toBe(true);
      expect(naaman, `${b} drops Naaman`).toBe(true);
      // NOT a bare /outsider/. The mirror sentence later in the same movement
      // uses that word, so the band could drop the claim about THESE TWO and
      // this check stayed green — the marker true elsewhere in the window
      // again. The claim is specifically that BOTH of them were outsiders, so
      // that is what is required.
      expect(o, `${b} does not say BOTH of them were outsiders`)
        .toMatch(/both (of them )?(were|are) (outsiders|Gentiles)/i);
    }
  });

  it('every band says the room turned on Him FOR that Word', () => {
    // Not "they got angry". The causation is the lesson: the wrath answered
    // the mercy. A band that reports the anger without its cause has taught
    // nothing a reader can use on themselves.
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      // NOT /stopped smiling/. That is the room's reaction, and the claim here
      // is CAUSATION: the wrath answered the mercy He had just preached. With
      // the reaction in the alternation the causal sentence could be deleted
      // and this check stayed green.
      expect(o, `${b} does not connect the wrath to the Word He spoke`)
        .toMatch(/(answer(ed)? that Word|Because He said|Here is how the room answered)/i);
      expect(TEXTS[b], `${b} softens the cliff`).toMatch(/cast him down headlong/);
    }
  });

  it('every band states the mirror: religion off-cliffs Him before it loves an outsider', () => {
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      // NOT /loves outsiders/ — that phrase appears in the Nazareth narration
      // of every band, so deleting the mirror sentence left this green. The
      // mirror is specifically the cliff: religion will throw Him off one
      // before it will let Him love an outsider.
      expect(o, `${b} drops the mirror sentence`)
        .toMatch(/(owns Yahweh for its own circle|off a cliff|push Jesus off)/i);
    }
  });
});

describe('L86 — FIFTH MOVEMENT: catch your own reflex', () => {
  it('every band sorts the benefit-crowd from the company who wanted HIM', () => {
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      expect(o, `${b} drops the crowds who came for the benefits`)
        .toMatch(/(loaves|bread|healing|benefit)/i);
      expect(o, `${b} does not say where His depth went`)
        .toMatch(/(depth|deep teaching)/i);
      expect(o, `${b} does not say the smaller company wanted Him`)
        .toMatch(/(smaller (group|company)|wanted HIM|wanted Him)/);
    }
  });

  it('every band hands the reader all THREE carry-outs', () => {
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      expect(o, `${b} drops the tested-testimony carry-out`).toMatch(/(stand on|be sure about)/i);
      expect(o, `${b} drops the human Saviour carry-out`).toMatch(/(human enough|real Man)/i);
      expect(o, `${b} drops the all-people carry-out`).toMatch(/(all people|every place)/i);
    }
  });

  it('every band puts the test at grace for THEM, and aims it at the reader', () => {
    // The lesson is useless pointed outward. Every band has to turn it around.
    for (const b of BANDS) {
      const o = ours(TEXTS[b]);
      expect(o, `${b} does not name the point where grace gets tested`).toMatch(/\bTHEM\b/);
      expect(o, `${b} does not turn the lesson on the reader`)
        .toMatch(/(catching your own|finding yours|catch its own|thing to catch|its own rather than)/i);
    }
  });
});
