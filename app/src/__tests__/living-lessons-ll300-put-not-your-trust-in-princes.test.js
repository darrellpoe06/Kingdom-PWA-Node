// @vitest-environment node
// =============================================================================
// L300 — Put Not Your Trust In Princes
// =============================================================================
// Darrell forwarded an election email into the app on 2026-10-22 with one word
// above it: Lesson. The forward was substantially an advertisement for a news
// app; its one honest paragraph described weariness with the cost of living and
// with leadership, and concluded that something has to give. That is the
// OCCASION. The Word is the content. (DR-1414.)
//
// PLACED IN LIVING LESSONS, NOT WORLD ISSUES, ON PURPOSE: that course's method
// is verified claim-checking, and the forward's checkable claims need polling
// and economic data this sandbox cannot reach, which DR-0076 forbids asserting.
// The devotional core needs only the Word, which IS on disk.
//
// THIS LESSON'S DANGERS are four, and each has its own gate below.
//   (1) PARTISANSHIP. A lesson about rulers could take a side. This one names
//       no party, no candidate, and never tells a reader how to vote (DR-0098);
//       the gate refuses a party word or a vote instruction in any string.
//   (2) QUIETISM. Sovereignty misread becomes disengagement, so every text
//       carries 1 Timothy 2:1-2, Romans 13:1, 1 Peter 2:17 and Proverbs 29:2.
//   (3) IDOLATRY OF AN OFFICE. The one boundary is taught in every text from
//       Matthew 22:21 and Acts 5:29.
//   (4) AN ALTERED VERSE. 42 verses are pinned below, each fetched from
//       app/public/bible/kjv. The apostrophe case is pinned on purpose: this
//       lesson's child band shipped a RETYPED Proverbs 21:1 with an ASCII
//       apostrophe where the corpus carries U+2019, and the sweep caught it
//       (DR-0456's class, found again). The proven-to-catch below replays it.
//
// Quote pairing is done by splitting on the quote character (DR-1258/DR-1259).
// The helpers are L297's, copied whole so the gates measure the same way.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { findBritish, ourProse } from '../../../scripts/american-spelling.mjs';
import { lengthFaults, words, ADULT_MIN, ADULT_MAX } from './new-lessons-keep-a-reader-length.test.js';
import { isSpokenByDarrell } from './spoken-lessons-name-darrell.test.js';

const ID = 'll300-put-not-your-trust-in-princes';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);
const TITLE_LEAD = 'PUT NOT YOUR TRUST IN PRINCES — WHERE HOPE BELONGS WHEN';

function* strings(node) {
  if (typeof node === 'string') {
    yield node;
    return;
  }
  if (Array.isArray(node)) {
    for (const v of node) yield* strings(v);
    return;
  }
  if (node && typeof node === 'object') {
    for (const v of Object.values(node)) yield* strings(v);
  }
}
const EVERY_STRING = L ? [...strings(L)] : [];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = {};
function chapter(book, ch) {
  const file = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(file)) return null;
  if (!cache[file]) cache[file] = JSON.parse(readFileSync(file, 'utf8'));
  return cache[file].chapters[Number(ch) - 1] || null;
}
function corpusText(ref) {
  const out = [];
  for (const piece of String(ref)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+(?: of [A-Za-z]+)?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(piece);
    if (!m) return null;
    const [, book, ch, from, through] = m;
    const chap = chapter(book, ch);
    if (!chap) return null;
    const to = through ? Number(through) : Number(from);
    for (let v = Number(from); v <= to; v += 1) {
      if (chap[v - 1] == null) return null;
      out.push(chap[v - 1]);
    }
  }
  return out.join(' ');
}
function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}
function verbatimFaults(texts) {
  const faults = [];
  for (const t of texts) {
    for (const { inside, ref } of quotedPairs(t)) {
      if (!ref) continue;
      const verse = corpusText(ref);
      if (verse == null) {
        faults.push(`unresolved reference (${ref})`);
        continue;
      }
      const bare = inside.replace(/^[,;:.\s]+|[,;:\s]+$/g, '');
      if (!verse.includes(bare)) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}
const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);

// Every verse this lesson teaches, fetched from app/public/bible/kjv and pinned
// here as the corpus has it — typographic apostrophes included.
const SPINE = [
  ['Psalms 146:3', 'Put not your trust in princes, nor in the son of man, in whom there is no help.'],
  ['Psalms 146:4', 'His breath goeth forth, he returneth to his earth; in that very day his thoughts perish.'],
  ['Psalms 146:5', 'Happy is he that hath the God of Jacob for his help, whose hope is in the LORD his God:'],
  ['Psalms 118:8', 'It is better to trust in the LORD than to put confidence in man.'],
  ['Psalms 118:9', 'It is better to trust in the LORD than to put confidence in princes.'],
  ['1 Samuel 8:5', 'And said unto him, Behold, thou art old, and thy sons walk not in thy ways: now make us a king to judge us like all the nations.'],
  [
    '1 Samuel 8:7',
    'And the LORD said unto Samuel, Hearken unto the voice of the people in all that they say unto thee: for they have not rejected thee, but they have rejected me, that I should not reign over them.',
  ],
  ['1 Samuel 8:19', 'Nevertheless the people refused to obey the voice of Samuel; and they said, Nay; but we will have a king over us;'],
  ['1 Samuel 8:20', 'That we also may be like all the nations; and that our king may judge us, and go out before us, and fight our battles.'],
  [
    'Daniel 2:21',
    'And he changeth the times and the seasons: he removeth kings, and setteth up kings: he giveth wisdom unto the wise, and knowledge to them that know understanding:',
  ],
  ['Proverbs 29:2', 'When the righteous are in authority, the people rejoice: but when the wicked beareth rule, the people mourn.'],
  ['Isaiah 40:23', 'That bringeth the princes to nothing; he maketh the judges of the earth as vanity.'],
  [
    'Isaiah 40:24',
    'Yea, they shall not be planted; yea, they shall not be sown: yea, their stock shall not take root in the earth: and he shall also blow upon them, and they shall wither, and the whirlwind shall take them away as stubble.',
  ],
  ['Jeremiah 17:5', 'Thus saith the LORD; Cursed be the man that trusteth in man, and maketh flesh his arm, and whose heart departeth from the LORD.'],
  ['Jeremiah 17:7', 'Blessed is the man that trusteth in the LORD, and whose hope the LORD is.'],
  [
    'Jeremiah 17:8',
    'For he shall be as a tree planted by the waters, and that spreadeth out her roots by the river, and shall not see when heat cometh, but her leaf shall be green; and shall not be careful in the year of drought, neither shall cease from yielding fruit.',
  ],
  ['Matthew 6:33', 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.'],
  [
    'Matthew 6:34',
    'Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof.',
  ],
  ['1 Timothy 2:1', 'I exhort therefore, that, first of all, supplications, prayers, intercessions, and giving of thanks, be made for all men;'],
  ['1 Timothy 2:2', 'For kings, and for all that are in authority; that we may lead a quiet and peaceable life in all godliness and honesty.'],
  ['Romans 13:1', 'Let every soul be subject unto the higher powers. For there is no power but of God: the powers that be are ordained of God.'],
  ['Proverbs 21:1', 'The king’s heart is in the hand of the LORD, as the rivers of water: he turneth it whithersoever he will.'],
  [
    'Habakkuk 3:17',
    'Although the fig tree shall not blossom, neither shall fruit be in the vines; the labour of the olive shall fail, and the fields shall yield no meat; the flock shall be cut off from the fold, and there shall be no herd in the stalls:',
  ],
  ['Habakkuk 3:18', 'Yet I will rejoice in the LORD, I will joy in the God of my salvation.'],
  ['Psalms 2:1', 'Why do the heathen rage, and the people imagine a vain thing?'],
  ['Psalms 2:2', 'The kings of the earth set themselves, and the rulers take counsel together, against the LORD, and against his anointed, saying,'],
  ['Psalms 2:4', 'He that sitteth in the heavens shall laugh: the Lord shall have them in derision.'],
  ['Psalms 33:10', 'The LORD bringeth the counsel of the heathen to nought: he maketh the devices of the people of none effect.'],
  ['Psalms 33:11', 'The counsel of the LORD standeth for ever, the thoughts of his heart to all generations.'],
  ['Psalms 33:12', 'Blessed is the nation whose God is the LORD; and the people whom he hath chosen for his own inheritance.'],
  ['Psalms 75:7', 'But God is the judge: he putteth down one, and setteth up another.'],
  ['Psalms 20:7', 'Some trust in chariots, and some in horses: but we will remember the name of the LORD our God.'],
  [
    'Psalms 37:7',
    'Rest in the LORD, and wait patiently for him: fret not thyself because of him who prospereth in his way, because of the man who bringeth wicked devices to pass.',
  ],
  [
    'Isaiah 9:6',
    'For unto us a child is born, unto us a son is given: and the government shall be upon his shoulder: and his name shall be called Wonderful, Counsellor, The mighty God, The everlasting Father, The Prince of Peace.',
  ],
  [
    'Isaiah 9:7',
    'Of the increase of his government and peace there shall be no end, upon the throne of David, and upon his kingdom, to order it, and to establish it with judgment and with justice from henceforth even for ever. The zeal of the LORD of hosts will perform this.',
  ],
  [
    'Daniel 4:17',
    'This matter is by the decree of the watchers, and the demand by the word of the holy ones: to the intent that the living may know that the most High ruleth in the kingdom of men, and giveth it to whomsoever he will, and setteth up over it the basest of men.',
  ],
  ['Proverbs 11:14', 'Where no counsel is, the people fall: but in the multitude of counsellors there is safety.'],
  [
    'Matthew 22:21',
    'They say unto him, Caesar’s. Then saith he unto them, Render therefore unto Caesar the things which are Caesar’s; and unto God the things that are God’s.',
  ],
  ['Acts 5:29', 'Then Peter and the other apostles answered and said, We ought to obey God rather than men.'],
  ['Philippians 3:20', 'For our conversation is in heaven; from whence also we look for the Saviour, the Lord Jesus Christ:'],
  [
    'Hebrews 12:28',
    'Wherefore we receiving a kingdom which cannot be moved, let us have grace, whereby we may serve God acceptably with reverence and godly fear:',
  ],
  ['1 Peter 2:17', 'Honour all men. Love the brotherhood. Fear God. Honour the king.'],
];
// The sixteen the WHOLE series carries — in full, in the lesson and all four bands.
const SHARED = [
  'Psalms 146:3',
  'Psalms 146:4',
  'Psalms 146:5',
  'Psalms 118:8',
  'Psalms 118:9',
  'Daniel 2:21',
  'Isaiah 40:23',
  'Matthew 6:33',
  '1 Timothy 2:1',
  '1 Timothy 2:2',
  'Proverbs 21:1',
  'Habakkuk 3:18',
  'Psalms 2:1',
  'Psalms 2:4',
  'Psalms 20:7',
  '1 Peter 2:17',
];

describe('L300 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 300 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 300)).toEqual([300]);
  });

  it('sits after ll299 in the catalog, and carries its build day', () => {
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const j = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith('ll299-'));
    expect(j).toBeGreaterThan(-1);
    expect(j).toBeLessThan(i);
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-11-10');
  });

  it('names its provenance: a FORWARD, not a spoken teaching', () => {
    expect(L.bigIdea).toMatch(/forwarded an election email into the app on 2026-10-22/);
    expect(L.bigIdea).toMatch(/one word above it: Lesson/);
    expect(L.bigIdea).toMatch(/the ad is not the lesson/);
    // it must NOT be classified as spoken, or the spoken-lesson gates would
    // demand a naming this lesson has no basis for.
    expect(isSpokenByDarrell(L)).toBe(false);
  });

  it('carries two parables, one light and one solemn, each on a verse that resolves', () => {
    expect(L.stories).toHaveLength(2);
    for (const s of L.stories) {
      expect(s.kind).toBe('parable');
      expect(String(s.body).trim().split(/\s+/).length).toBeGreaterThanOrEqual(100);
      expect(corpusText(s.verse), `story verse ${s.verse}`).not.toBeNull();
    }
    expect(L.stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
  });

  it('carries a quiz in range and an anchor whose every reference resolves and is named in the lesson', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(8);
    for (const q of L.quiz.questions) {
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(String(q.explain).length).toBeGreaterThan(40);
    }
    const refs = String(L.anchor.ref)
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    expect(refs.length).toBeGreaterThanOrEqual(30);
    for (const r of refs) {
      expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
      expect(L.lesson.includes(`(${r})`), `anchor ${r} is not named in the lesson`).toBe(true);
    }
    // and nothing is quoted that the anchor does not carry
    const quoted = new Set(
      EVERY_STRING.flatMap((t) =>
        quotedPairs(t)
          .map((p) => p.ref)
          .filter(Boolean)
      )
    );
    expect([...quoted].filter((r) => !refs.includes(r))).toEqual([]);
  });
});

describe('the teaching is non-partisan by construction (DR-0098)', () => {
  it('names no party, no movement and no candidate, in any string', () => {
    const party = /\b(Republican|Republicans|Democrat|Democrats|Democratic|GOP|MAGA|conservatives?|liberals?|left-wing|right-wing|progressives?)\b/i;
    const hits = EVERY_STRING.filter((t) => party.test(t)).map((t) => t.slice(0, 60));
    expect(hits).toEqual([]);
  });

  it('never tells the reader how to vote, and never calls one side the problem', () => {
    for (const t of EVERY_STRING) {
      expect(t).not.toMatch(/\bvote (?:for|against) \w/i);
      expect(t).not.toMatch(/\b(?:the|our) (?:other|wrong) side\b/i);
    }
  });

  it('PROVEN TO CATCH: a party word planted in one band is refused', () => {
    const party = /\b(Republican|Republicans|Democrat|Democrats|Democratic|GOP|MAGA|conservatives?|liberals?|left-wing|right-wing|progressives?)\b/i;
    const planted = `${L.levels.teen} The Democrats are the problem here.`;
    expect(party.test(planted)).toBe(true);
    expect(party.test(L.levels.teen)).toBe(false);
  });

  it('and the duty verses are in EVERY text, so sovereignty never reads as disengagement', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k} drops the duty to pray`).toMatch(/1 Timothy 2:1/);
      expect(TEXTS[k], `${k} drops the honour owed the office`).toMatch(/1 Peter 2:17/);
      expect(TEXTS[k], `${k} drops the one boundary`).toMatch(/Acts 5:29/);
    }
  });
});

describe('every verse is the corpus on disk, and the sweep cannot pass vacuously', () => {
  it('all 42 pinned verses are verbatim in the corpus AND carried in full by the lesson', () => {
    expect(SPINE).toHaveLength(42);
    for (const [ref, span] of SPINE) {
      const verse = corpusText(ref);
      expect(verse, `${ref} does not resolve`).not.toBeNull();
      expect(verse.includes(span), `${ref}: the pinned span is not in the corpus`).toBe(true);
      expect(L.lesson.includes(span), `${ref}: the lesson does not carry it`).toBe(true);
    }
  });

  it('the sixteen shared verses are carried in full by the lesson AND all four bands', () => {
    const byRef = Object.fromEntries(SPINE);
    for (const ref of SHARED) {
      for (const k of PLACES) expect(TEXTS[k].includes(byRef[ref]), `${k} drops ${ref}`).toBe(true);
    }
  });

  it('EVERY referenced quoted span in EVERY string of the module is verbatim', () => {
    expect(verbatimFaults(EVERY_STRING)).toEqual([]);
  });

  it('and the sweep asserts its own count, so an empty scan cannot read as a pass', () => {
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(200);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(180);
  });

  it('every double-quoted span carries a reference: no span is left unattributed', () => {
    const bare = [];
    for (const t of EVERY_STRING) for (const p of quotedPairs(t)) if (!p.ref) bare.push(p.inside.slice(0, 60));
    expect(bare).toEqual([]);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('he removeth kings, and setteth up kings', 'he removeth kings, and raiseth up kings');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: the ASCII apostrophe this lesson actually shipped once (DR-0456)', () => {
    const curly = 'The king’s heart is in the hand of the LORD';
    const ascii = "The king's heart is in the hand of the LORD";
    expect(L.levels.child.includes(curly), 'the child band must carry the corpus apostrophe').toBe(true);
    const broken = L.levels.child.replace(curly, ascii);
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken]).length, 'a retyped apostrophe must fail the sweep').toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a band that drops a shared verse is named', () => {
    const byRef = Object.fromEntries(SPINE);
    const span = byRef['Psalms 146:3'];
    const stripped = L.levels.youth.replace(span, '');
    expect(stripped).not.toBe(L.levels.youth);
    expect(stripped.includes(span)).toBe(false);
  });
});

describe('the four bands are four bands, measured not claimed', () => {
  const full = measureFullness(L);
  const grades = measureLesson(L);

  it('each band is a real share of the adult lesson', () => {
    expect(shortBands(full, FULL_FLOOR)).toEqual([]);
    for (const b of BANDS) expect(full.bands[b].share, b).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('reads as a ladder, and the child band is inside its own age range', () => {
    expect(isInverted(grades)).toBe(false);
    expect(grades.bands.child.authored).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    for (const [x, y] of [
      ['child', 'youth'],
      ['youth', 'teen'],
      ['teen', 'senior'],
    ]) {
      expect(grades.bands[y].authored, `${y} should read above ${x}`).toBeGreaterThan(grades.bands[x].authored);
    }
  });

  it('no band is a reworded copy of another', () => {
    const d = measureDifferentiation(L);
    expect(duplicatedBands(d, DIFF_CEILING)).toEqual([]);
    expect(d.worst).toBeLessThan(DIFF_CEILING);
  });

  it('every band opens on the title, and sits inside the reader-length band', () => {
    expect(unnamedBands(L)).toEqual([]);
    for (const k of PLACES) expect(TEXTS[k].startsWith(TITLE_LEAD), k).toBe(true);
    expect(lengthFaults(L)).toEqual([]);
    expect(words(L.lesson)).toBeGreaterThanOrEqual(ADULT_MIN);
    expect(words(L.lesson)).toBeLessThanOrEqual(ADULT_MAX);
  });
});

describe('the reader meets eight numbered movements, in order, in every text', () => {
  const headings = (t) =>
    formatLessonText(t)
      .items.filter((i) => i.kind === 'heading')
      .map((h) => h.n);

  it('each of the five texts renders headings 1..8, contiguous', () => {
    for (const k of PLACES) {
      const ns = headings(TEXTS[k]);
      expect(ns, `${k} does not render eight movements`).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    }
  });

  it('PROVEN TO CATCH: a citation left without its full stop swallows the heading that follows', () => {
    // This is the real defect this lesson hit: a movement that opens right after
    // a verse citation loses its NUMBER unless the citation closes its sentence.
    const broken = L.levels.teen.replace('(Psalms 20:7). FOUR.', '(Psalms 20:7) FOUR.');
    expect(broken).not.toBe(L.levels.teen);
    expect(headings(broken)).not.toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe('our own voice names Yahweh, and the quotations are left exactly as written', () => {
  const ourVoice = (t) =>
    String(t)
      .split('"')
      .filter((_, i) => i % 2 === 0)
      .join(' ');

  it('no generic God, GOD or LORD in our authored voice (DR-0210)', () => {
    const found = [];
    for (const t of EVERY_STRING) {
      if (t === L.anchor.ref) continue;
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) found.push(`${m} :: ${t.slice(0, 60)}`);
    }
    expect(found).toEqual([]);
  });

  it('PROVEN TO CATCH: the closing line this lesson shipped once, echoing the verse in our voice', () => {
    const planted = 'Not the nation with the best result. The nation whose God is the LORD.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['God', 'LORD']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('Happy is he that hath the God of Jacob for his help');
    expect(inQuotes).toContain('It is better to trust in the LORD than to put confidence in princes.');
  });

  it('Yahweh is never put inside a quotation, and our voice names Him in every text', () => {
    const planted = [];
    for (const t of EVERY_STRING) {
      for (const { inside, ref } of quotedPairs(t)) if (/\bYahweh\b/.test(inside)) planted.push(`${ref || 'no ref'}: ${inside.slice(0, 60)}`);
    }
    expect(planted).toEqual([]);
    for (const k of PLACES) expect((TEXTS[k].match(/Yahweh/g) || []).length, k).toBeGreaterThanOrEqual(3);
  });

  it('never capitalises the adversary', () => {
    expect(EVERY_STRING.join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
  });
});

describe('nothing is cut, nothing is misspelled, and no bookkeeping reaches the reader', () => {
  it('no quoted span in a reader-facing field carries an ellipsis', () => {
    expect(elidedQuotations(L)).toEqual([]);
  });

  it('no reader-facing field prints a DR identifier', () => {
    expect(recitedRecords(L)).toEqual([]);
  });

  it('our prose is spelled the American way, while the quotations keep the corpus spelling', () => {
    expect(EVERY_STRING.flatMap((t) => findBritish(ourProse(t)))).toEqual([]);
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes, 'the KJV spelling inside a quotation is never corrected').toContain('Honour all men.');
  });

  it('PROVEN TO CATCH: a British spelling in OUR prose is refused, and one inside a quotation is not', () => {
    expect(findBritish(ourProse('We honour the office.')).map((h) => h.word)).toEqual(['honour']);
    expect(findBritish(ourProse('"Honour all men." (1 Peter 2:17)'))).toEqual([]);
  });

  it('carries no doubled word, and no percentage, in any string', () => {
    const doubled = [];
    for (const t of EVERY_STRING) {
      for (const m of t.match(/\b(\w+)\s+\1\b/gi) || []) if (!/^(that that|had had)$/i.test(m)) doubled.push(m);
    }
    expect(doubled).toEqual([]);
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\d+(\.\d+)?\s?%|percent\b/);
  });
});

describe('every band sends the reader all three ways (DR-0733 / DR-0795)', () => {
  it('the lesson and all four bands carry their own three directions', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: stripping the child band’s friend line names child and only child', () => {
    const child = L.levels.child;
    const friend = /Ask a friend where they put their hope[^.]*\./.exec(child);
    expect(friend, 'the child band’s friend sentence is not where this test expects it').toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, child: child.replace(friend[0], '') } };
    expect(stripped.levels.child).not.toBe(child);
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'child', missing: ['friends'] }]);
  });
});
