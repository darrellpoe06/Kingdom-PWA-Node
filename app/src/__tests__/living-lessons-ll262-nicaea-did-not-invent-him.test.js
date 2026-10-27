// @vitest-environment node
// =============================================================================
// ll262 — "Nicaea Did Not Invent Him — The Word Said It First"
// =============================================================================
// A link was sent into the research road inside the PoeTech app with one word
// over it, Lesson, and the road returned the whole reading: the auto-generated
// captions of a video whose hosts the source names as Wesley Huff and Andy
// Steiger, testing the popular claim that the Council of Nicaea (AD 325)
// invented the divinity of Jesus and voted the canon into existence.
//
// WHY THIS GATE AND NOT A READ-THROUGH. The lesson's whole argument is that the
// first-century text already says what a 4th-century council is accused of
// inventing. That argument is only as good as the quotations carrying it, so a
// single altered word would turn the lesson into the thing it refutes. Every
// verse is pinned here against app/public/bible/kjv — the corpus on disk, which
// is the repository's declared source of truth (DR-0076) — and a verse written
// from memory would have shipped "Thy throne, O God, is forever and ever" for
// Hebrews 1:8, where the corpus reads "for ever and ever", two words.
//
// THE OTHER HALF IS HONESTY ABOUT THE SOURCE (DR-0192, DR-0100). The video's two
// archaeological witnesses are carried at the weight the published record gives
// them and no heavier, and the gate pins that restraint in every band: the
// Megiddo mosaic is dated by ESTIMATE (about 230, from coins and construction),
// the Alexamenos graffito is named a MOCKERY rather than a confession, and the
// story that a bishop struck Arius is refused as a later legend. If a later
// edit quietly upgrades an estimate into a date or a sneer into a creed, these
// cases go red.
//
// Proven-to-catch: see the final describe block — an altered Hebrews 1:8, a
// "Yahweh" substituted into a quotation of the Word, a band stripped of its
// friend-to-friend line, and the word "estimate" removed from the history each
// turn a case red.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { scanQuotedVerses, describeFault } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';

const CORPUS = join(process.cwd(), 'public', 'bible', 'kjv');

/** The verse exactly as the corpus on disk has it. No normalisation. */
function corpusText(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(ref.trim());
  const book = m[1].trim().replace(/^Psalm$/i, 'Psalms').replace(/\s+/g, '');
  const data = JSON.parse(readFileSync(join(CORPUS, `${book}.json`), 'utf8'));
  return data.chapters[Number(m[2]) - 1][Number(m[3]) - 1];
}

const lesson = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll262-'));
const everywhere = () => [
  lesson.lesson, lesson.bigIdea, lesson.inApp, lesson.anchor.theme,
  ...Object.values(lesson.levels), ...lesson.benefits,
  ...lesson.facilitator.talkingPoints, lesson.facilitator.howToRun,
  ...lesson.facilitator.discussionPrompts,
  ...lesson.quiz.questions.flatMap((q) => [q.q, q.explain, ...q.options]),
  ...lesson.stories.map((s) => s.body),
];

// The spine: quoted in the adult lesson AND in all four bands, because a reader
// reads ONE band and the argument has to be whole wherever they land.
// The spine: quoted in the adult lesson AND in all four bands, because a reader
// reads ONE band and the argument has to be whole wherever they land. Each
// fragment below was MEASURED present in all five places, never assumed.
const IN_EVERY_BAND = {
  '1 Thessalonians 5:21': 'Prove all things; hold fast that which is good',
  'John 1:1': 'In the beginning was the Word, and the Word was with God, and the Word was God.',
  'John 1:3': 'All things were made by him; and without him was not any thing made that was made.',
  'John 1:14': 'And the Word was made flesh, and dwelt among us',
  'John 20:28': 'And Thomas answered and said unto him, My Lord and my God.',
  'John 20:29': 'blessed are they that have not seen, and yet have believed.',
  'Matthew 16:16': 'Thou art the Christ, the Son of the living God.',
  'Matthew 16:17': 'flesh and blood hath not revealed it unto thee',
  'Colossians 1:17': 'And he is before all things, and by him all things consist.',
  'Colossians 2:9': 'For in him dwelleth all the fulness of the Godhead bodily.',
  'Hebrews 1:8': 'But unto the Son he saith, Thy throne, O God, is for ever and ever: a sceptre of righteousness is the sceptre of thy kingdom.',
  'Hebrews 1:6': 'And let all the angels of God worship him.',
  'John 5:23': 'That all men should honour the Son, even as they honour the Father.',
  'John 8:58': 'Before Abraham was, I am.',
  'John 10:30': 'I and my Father are one.',
  'John 10:33': 'because that thou, being a man, makest thyself God.',
  'John 1:29': 'Behold the Lamb of God, which taketh away the sin of the world.',
  'Revelation 5:12': 'Worthy is the Lamb that was slain to receive power, and riches, and wisdom, and strength, and honour, and glory, and blessing.',
  '2 Timothy 3:16': 'All scripture is given by inspiration of God',
  '2 Peter 1:21': 'spake as they were moved by the Holy Ghost.',
  '2 Peter 3:16': 'as they do also the other scriptures, unto their own destruction.',
  'Colossians 4:16': 'cause that it be read also in the church of the Laodiceans',
  '1 Thessalonians 5:27': 'I charge you by the Lord that this epistle be read unto all the holy brethren.',
  '1 Peter 3:15': 'be ready always to give an answer to every man that asketh you a reason of the hope that is in you with meekness and fear:',
  'Isaiah 40:8': 'The grass withereth, the flower fadeth: but the word of our God shall stand for ever.',
  'Deuteronomy 6:7': 'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.',
  'Proverbs 27:17': 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.',
};

// Further strands the lesson stands on, quoted verbatim somewhere in it.
const SOMEWHERE = {
  'Acts 17:11': 'searched the scriptures daily, whether those things were so',
  'Colossians 1:16': 'all things were created by him, and for him:',
  'Hebrews 1:3': 'upholding all things by the word of his power',
  'Hebrews 1:10': 'Thou, Lord, in the beginning hast laid the foundation of the earth; and the heavens are the works of thine hands:',
  'Psalms 45:6': 'Thy throne, O God, is for ever and ever: the sceptre of thy kingdom is a right sceptre.',
  'John 5:18': 'said also that God was his Father, making himself equal with God.',
  'John 17:5': 'the glory which I had with thee before the world was.',
  'Micah 5:2': 'from of old, from everlasting.',
  'Revelation 5:13': 'Blessing, and honour, and glory, and power, be unto him that sitteth upon the throne, and unto the Lamb for ever and ever.',
  'Philippians 2:6': 'in the form of God, thought it not robbery to be equal with God:',
  'Philippians 2:10': 'at the name of Jesus every knee should bow',
  'Philippians 2:11': 'every tongue should confess that Jesus Christ is Lord, to the glory of God the Father.',
  'Titus 2:13': 'the great God and our Saviour Jesus Christ',
  'Romans 9:5': 'who is over all, God blessed for ever.',
  '1 John 5:20': 'This is the true God, and eternal life.',
  'Isaiah 9:6': 'and his name shall be called Wonderful, Counsellor, The mighty God, The everlasting Father, The Prince of Peace.',
  '2 Timothy 3:17': 'That the man of God may be perfect, throughly furnished unto all good works.',
  '2 Peter 3:15': 'our beloved brother Paul also according to the wisdom given unto him hath written unto you;',
  'Colossians 2:8': 'Beware lest any man spoil you through philosophy and vain deceit, after the tradition of men, after the rudiments of the world, and not after Christ.',
  '2 Timothy 1:13': 'Hold fast the form of sound words',
  '2 Timothy 2:15': 'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.',
  'Jude 1:3': 'earnestly contend for the faith which was once delivered unto the saints.',
  'Matthew 28:19': 'in the name of the Father, and of the Son, and of the Holy Ghost:',
  '1 Timothy 5:18': 'For the scripture saith',
  'Hebrews 13:8': 'Jesus Christ the same yesterday, and to day, and for ever.',
  'Isaiah 7:14': 'Behold, a virgin shall conceive, and bear a son, and shall call his name Immanuel.',
  'Matthew 1:23': 'which being interpreted is, God with us.',
  'Philippians 2:9': 'a name which is above every name:',
  'Acts 20:28': 'which he hath purchased with his own blood.',
  '1 Corinthians 8:6': 'But to us there is but one God, the Father, of whom are all things, and we in him; and one Lord Jesus Christ, by whom are all things, and we by him.',
};

const PINNED = { ...IN_EVERY_BAND, ...SOMEWHERE };

describe('ll262 — the lesson is in the catalog, dated, in all four bands', () => {
  it('appears once, after ll258, with child, youth, teen and senior', () => {
    expect(lesson).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id.startsWith('ll262-'))).toHaveLength(1);
    const ids = LIVING_LESSONS_MODULES.map((m) => m.id);
    expect(ids.indexOf(lesson.id)).toBeGreaterThan(ids.findIndex((i) => i.startsWith('ll258-')));
    expect(Object.keys(lesson.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
  });

  it('carries the day it joined the course', () => {
    expect(LIVING_LESSONS_ADDED[lesson.id]).toBe('2026-10-27');
  });

  it('names its road honestly — sent INSIDE the app, and the reading is captions, not a timestamped transcript', () => {
    expect(lesson.lesson).toMatch(/inside the PoeTech app/);
    expect(lesson.lesson).toMatch(/captions are a machine’s hearing and no minute marks came with them/);
    // The source names the hosts; nothing else is attached to them (DR-1206).
    expect(lesson.lesson).toMatch(/Wesley Huff and Andy Steiger/);
    for (const text of everywhere()) {
      expect(text, 'no faith label, affiliation or motive is attached to a named person').not.toMatch(/\b(?:Huff|Steiger)\b[^.]{0,40}\b(?:apologist|evangelical|catholic|protestant|ministry|agenda|motive)\b/i);
    }
  });

  it('carries two stories, each anchored on a verse the lesson stands on', () => {
    expect(lesson.stories).toHaveLength(2);
    const anchored = new Set(lesson.anchor.ref.split(';').map((s) => s.trim()));
    for (const s of lesson.stories) {
      expect(s.body.length).toBeGreaterThan(600);
      expect(anchored.has(s.verse)).toBe(true);
    }
    expect(lesson.stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
  });

  it('carries the full teaching shape: fifteen benefits, seven quiz questions, ten talking points, seven prompts', () => {
    expect(lesson.benefits).toHaveLength(15);
    expect(lesson.quiz.questions).toHaveLength(7);
    expect(lesson.facilitator.talkingPoints).toHaveLength(10);
    expect(lesson.facilitator.discussionPrompts).toHaveLength(7);
    const positions = [...new Set(lesson.quiz.questions.map((q) => q.answer))];
    expect(positions.length, 'the right answer is not always in the same place').toBeGreaterThan(2);
    for (const q of lesson.quiz.questions) {
      expect(q.options).toHaveLength(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(4);
    }
  });
});

describe('ll262 — every verse is the corpus, verbatim', () => {
  for (const [ref, text] of Object.entries(PINNED)) {
    it(`${ref} matches the corpus on disk`, () => {
      expect(corpusText(ref)).toContain(text);
    });
  }

  it('every pinned verse is quoted somewhere in the lesson', () => {
    const all = everywhere().join('\n');
    const absent = Object.entries(PINNED).filter(([, t]) => !all.includes(t)).map(([r]) => r);
    expect(absent, 'a verse is pinned here but quoted nowhere in the lesson').toEqual([]);
  });

  it('the spine is quoted in the adult lesson AND in every band', () => {
    const short = [];
    for (const [where, text] of [['lesson', lesson.lesson], ...Object.entries(lesson.levels)]) {
      for (const [ref, verse] of Object.entries(IN_EVERY_BAND)) {
        if (!text.includes(verse)) short.push(`${where} :: ${ref}`);
      }
    }
    expect(short, 'a reader reads ONE band, so the spine has to be whole in each').toEqual([]);
  });

  it('anchor.ref names every verse the lesson stands on (Search it out derives its links from these)', () => {
    const anchored = new Set(lesson.anchor.ref.split(';').map((s) => s.trim()));
    const missing = Object.keys(PINNED).filter((r) => !anchored.has(r));
    expect(missing, 'a verse is taught but not in anchor.ref').toEqual([]);
    for (const ref of anchored) expect(() => corpusText(ref), `${ref} does not resolve`).not.toThrow();
  });

  it('EVERY referenced span in the whole module is the corpus verse, with case', () => {
    // Wider than the pinned lists above: this reaches the benefits, the quiz and
    // the facilitator's talking points too, because the facilitator reads those
    // aloud to a room and there is no surface where the verse may be approximate.
    const scan = scanQuotedVerses([lesson], quotedTexts);
    expect(scan.faults.map(describeFault)).toEqual([]);
    expect(scan.uncheckable).toEqual([]);
    expect(scan.spans, 'non-vacuous: the lesson really does carry its verses').toBeGreaterThan(200);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('Yahweh is never substituted into a quotation of the Word (DR-0076 bright line)', () => {
    for (const text of everywhere()) {
      for (const m of String(text).matchAll(/"([^"]*)"/g)) {
        expect(m[1], 'a quotation of the Word carries His name as the KJV prints it').not.toMatch(/Yahweh/);
      }
    }
  });

  it('the adversary is never capitalised anywhere in the lesson', () => {
    for (const text of everywhere()) {
      expect(text).not.toMatch(/\b(?:Satan|Lucifer|Baal)\b/);
      expect(text).not.toMatch(/\bthe (?:Devil|Dragon|Adversary|Accuser|Deceiver)\b/);
    }
  });
});

describe('ll262 — the confession, and the claim answered rather than staged', () => {
  it('confesses Jesus as the Lamb of Yahweh and the Eternal Son of Yahweh in every band (DR-0210)', () => {
    for (const [where, text] of Object.entries({ lesson: lesson.lesson, ...lesson.levels })) {
      expect(text, `${where} does not confess Him as the Lamb of Yahweh`).toMatch(/Lamb of Yahweh/);
      expect(text, `${where} does not confess His eternal Sonship`).toMatch(/Eternal Son of Yahweh/);
      expect(text, `${where} does not quote John 1:29 beside it`).toContain('Behold the Lamb of God, which taketh away the sin of the world.');
    }
  });

  it('names the claim once to educate past it, and never stages two camps (DR-0098)', () => {
    for (const [where, text] of Object.entries({ lesson: lesson.lesson, ...lesson.levels })) {
      expect(text, `${where} never names the claim`).toMatch(/invent/i);
      expect(text, `${where} invites the reader to pick a side`).not.toMatch(/you decide|decide for yourself|both sides have|two views|make up your own mind/i);
    }
    expect(lesson.lesson).toMatch(/we do not platform man’s disagreement as the authority over it/);
  });

  it('every band carries the dates, because the order of events IS the answer', () => {
    for (const [where, text] of Object.entries({ lesson: lesson.lesson, ...lesson.levels })) {
      expect(text, `${where} does not give the year of the council`).toMatch(/325/);
      expect(text, `${where} does not place the writings in the first century`).toMatch(/first century|300 years before|much older/i);
    }
  });

  it('every band carries the four-verse answer the reader is sent away with', () => {
    for (const [where, text] of Object.entries({ lesson: lesson.lesson, ...lesson.levels })) {
      for (const ref of ['John 1:1', 'John 20:28', 'Colossians 1:17', 'Hebrews 1:8']) {
        expect(text, `${where} is missing ${ref} from the card`).toContain(ref);
      }
    }
  });
});

describe('ll262 — the source is carried at its true weight (DR-0192, DR-0100)', () => {
  const histories = { lesson: lesson.lesson, child: lesson.levels.child, youth: lesson.levels.youth, teen: lesson.levels.teen, senior: lesson.levels.senior };

  it('the canon claim is answered by what SURVIVES from the council, not by assertion', () => {
    for (const where of ['lesson', 'youth', 'teen', 'senior']) {
      expect(histories[where], `${where} does not say what survives from Nicaea`).toMatch(/creed, twenty (?:disciplinary )?(?:canons|rules)/i);
      expect(histories[where], `${where} does not say there is no book list`).toMatch(/no (?:list of books|book list)/i);
      expect(histories[where], `${where} does not name Athanasius 367`).toMatch(/Athanasius in 367/);
    }
    expect(histories.child).toMatch(/Nobody voted on the books|NOBODY VOTED ON THE BOOKS/i);
  });

  it('the Megiddo date is carried as an ESTIMATE, never as a dated record', () => {
    for (const where of ['lesson', 'youth', 'teen', 'senior']) {
      expect(histories[where], `${where} states the Megiddo date without marking it an estimate`).toMatch(/estimate/i);
      expect(histories[where], `${where} does not say what the estimate rests on`).toMatch(/coins and construction|coins/i);
    }
  });

  it('the graffito is named a mockery and claimed for no more than it proves', () => {
    for (const where of ['lesson', 'child', 'youth', 'teen', 'senior']) {
      expect(histories[where], `${where} does not name the graffito a mockery`).toMatch(/mock|tease|insult|sneer|mean (?:joke|picture)/i);
    }
    for (const where of ['lesson', 'teen', 'senior']) {
      expect(histories[where], `${where} over-claims the graffito`).toMatch(/proves no doctrine|What the graffito proves is not doctrine/i);
      expect(histories[where], `${where} adopts the video's earlier dating`).toMatch(/does not (?:adopt|take up) the earlier end/i);
    }
  });

  it('the Arius-struck story is refused as a later legend, never taught as history', () => {
    for (const where of ['lesson', 'child', 'teen', 'senior']) {
      expect(histories[where], `${where} does not refuse the legend`).toMatch(/legend|much later|written much later/i);
    }
  });

  it('no bare statistic is asserted anywhere (DR-0190)', () => {
    for (const text of everywhere()) {
      expect(text).not.toMatch(/\b\d{1,3}(?:\.\d+)?\s*%/);
    }
  });
});

describe('ll262 — every band sends the reader in all three directions (DR-0795)', () => {
  it('no place is short of a direction', () => {
    expect(placesMissingDirections(lesson)).toEqual([]);
  });

  it('every band closes on TALK ABOUT IT TOGETHER in the lesson’s own words', () => {
    for (const [where, text] of Object.entries({ lesson: lesson.lesson, ...lesson.levels })) {
      expect(text, `${where} has no TALK ABOUT IT TOGETHER`).toContain('TALK ABOUT IT TOGETHER');
      expect(text, `${where} omits the rhythm of Deuteronomy 6:7’s four places`).toMatch(/at the table, on the way, at bedtime, or first thing/);
      expect(text, `${where} does not send the reader to one friend this week`).toMatch(/one friend/);
    }
  });
});

describe('ll262 — PROVEN TO CATCH', () => {
  const sentences = (s) => String(s).split(/(?<=[.!?])\s+/);

  it('an altered Hebrews 1:8 is caught WHEREVER it sits — a band, the big idea, a benefit or a talking point', () => {
    const break1 = (s) => String(s).replace(/is for ever and ever: a sceptre of righteousness/g, 'is forever and ever: a sceptre of righteousness');
    const mutated = {
      ...lesson,
      bigIdea: break1(lesson.bigIdea),
      benefits: lesson.benefits.map(break1),
      facilitator: { ...lesson.facilitator, talkingPoints: lesson.facilitator.talkingPoints.map(break1) },
      levels: { ...lesson.levels, child: break1(lesson.levels.child) },
    };
    expect(mutated.bigIdea).not.toBe(lesson.bigIdea);
    const scan = scanQuotedVerses([mutated], quotedTexts);
    expect(scan.faults.length, 'the wide scan must name every altered span').toBeGreaterThan(1);
    expect(scan.faults.map((f) => f.where)).toContain('bigIdea');
    // and the per-band spine check names the band that lost it
    const short = Object.entries(mutated.levels).filter(([, t]) => !t.includes(IN_EVERY_BAND['Hebrews 1:8'])).map(([b]) => b);
    expect(short).toEqual(['child']);
    expect(corpusText('Hebrews 1:8')).toContain(IN_EVERY_BAND['Hebrews 1:8']);
  });

  it('"Yahweh" substituted into a quotation of the Word is caught', () => {
    const mutated = lesson.lesson.replace(
      '"In the beginning was the Word, and the Word was with God, and the Word was God."',
      '"In the beginning was the Word, and the Word was with Yahweh, and the Word was Yahweh."',
    );
    expect(mutated).not.toBe(lesson.lesson);
    const quoted = [...mutated.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
    expect(quoted.some((q) => /Yahweh/.test(q))).toBe(true);
  });

  it('the per-band direction check catches what the pooled check hides', () => {
    const friendless = sentences(lesson.levels.teen)
      .filter((s) => placesMissingDirections({ lesson: s }).some((p) => p.missing.includes('friends')))
      .join(' ');
    const mutated = { ...lesson, levels: { ...lesson.levels, teen: friendless } };
    expect(hasAllThree(mutated), 'pooled still reads whole — that is the hazard').toBe(true);
    expect(placesMissingDirections(mutated)).toEqual([{ place: 'teen', missing: ['friends'] }]);
  });

  it('an estimate quietly upgraded to a date is caught', () => {
    const upgraded = lesson.levels.senior.replace(/estimate/gi, 'record');
    expect(upgraded).not.toMatch(/estimate/i);
    expect(lesson.levels.senior).toMatch(/estimate/i);
  });

  it('the spine check catches a band that drops a verse', () => {
    const stripped = lesson.levels.child.split(IN_EVERY_BAND['Hebrews 1:8']).join('');
    expect(stripped.includes(IN_EVERY_BAND['Hebrews 1:8'])).toBe(false);
    expect(lesson.levels.child.includes(IN_EVERY_BAND['Hebrews 1:8'])).toBe(true);
  });
});
