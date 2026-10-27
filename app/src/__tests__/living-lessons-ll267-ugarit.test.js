// @vitest-environment node
// =============================================================================
// L267 — "Ugarit and the Words We Read — Yahweh Is Not of That Pantheon; He Is
// Its Judge": built from a research-road item Darrell sent into the PoeTech app
// as a link, which had waited roughly ninety-one hours in the lesson queue.
// =============================================================================
// WHAT THE ROAD RETURNED, AND ITS TWO MEASURED LIMITS (DR-0076 section 8). The
// reading was never made -- the tower had not answered -- so the whole of the
// research is the machine-made captions of a video conversation, fetched on the
// NAS from its residential IP because the CI path is YouTube-IP-blocked. Limit
// one: at about 1,773 words it is the SHORTEST transcript in the whole intake,
// and it ENDS MID-SENTENCE, so the reading is truncated and this lesson teaches
// only what is actually on the page. Limit two: the source CAPITALISES the false
// god's name and the other members of that pantheon; this house writes them in
// lower case and the rule is senior to the source, so the conflict is surfaced
// rather than copied through. The captions name no speaker, so no speaker is
// named here and nothing is placed in anyone's mouth as a quotation.
//
// THE MATERIAL HAS TWO HALVES AND ONLY THE FIRST IS THE LESSON. Half one -- the
// 1929 excavation of Ugarit, the thirty-sign alphabet, the decipherment, and the
// lotan/leviathan parallel -- is new ground, MEASURED: "Ugarit", "Ugaritic",
// "lotan", "cuneiform" and "Ras Shamra" appeared nowhere in app/src/lib before
// this lesson. "leviathan" did appear, in exactly one place -- ll77's teaching
// on pride, which stands on Job 41:34 -- and Isaiah 27:1 with it, so this lesson
// cites ll77 rather than re-teaching its seam (the DR-1105 lesson about paying
// one flag twice). ll73 is the nearest neighbour on the borrowed word El and is
// cited too. Half two turns to an
// evolutionary account of religion, an "eye in the sky" and costly signalling.
// It is NOT hidden and NOT given equal weight and NOT staged as a debate
// (DR-0098): it is named plainly in one movement and answered from the Word,
// which is the third tier of DR-0100 -- the Word corrects THAT claim while every
// true datum beneath it still stands.
//
// WHAT WAS CORRECTED IN THE SOURCE BEFORE IT WAS TAUGHT (DR-0192). The source
// compresses the plow-strike and the excavation into one year; the strike was
// spring 1928 at Minet el-Beida and Schaeffer's dig and the first tablet were
// April and 14 May 1929. The source tells the decipherment anonymously; it was
// Hans Bauer, corrected and completed by Edouard Dhorme and Charles Virolleaud,
// in 1930. The source's particular "mem first" step could not be confirmed in
// that form and is carried as the source's own telling. The seven-headed-serpent
// find the source mentions is real -- a stamp seal excavated at Tel Hazor in
// 2022, published 2024, eighth century BC -- and is carried with its own
// publication's limit that it cannot be assigned Israelite or Phoenician.
//
// WHAT THE CHECKS MEASURED BEFORE THE SPLICE (scratchpad gate over the draft):
// 338 referenced spans, 0 verbatim faults; fullness 0.51 / 0.62 / 0.71 / 0.96
// against floors 0.50 / 0.60 / 0.60 / 0.60; authored-prose grades child 0.46,
// youth 6.62, teen 11.67, senior 16.22 (the ladder rises by more than one at
// each step and the child band is under 5.0); worst band overlap 0.10; every
// band names the lesson; every place carries all three directions; no generic
// "God" in our own prose in any band; no straight apostrophe inside any
// quotation. The spliced entry was then re-read from the catalog and compared
// field by field against the measured draft.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { fleschKincaidGrade, ourProseOnly, NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const verse = (book, ch, n) => {
  const p = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(p)) return null;
  const chap = JSON.parse(readFileSync(p, 'utf8')).chapters[Number(ch) - 1];
  return chap ? norm(chap[Number(n) - 1]) : null;
};
const BANDS = ['child', 'youth', 'teen', 'senior'];
const RE = /"([^"]{10,})"\s*\(([1-3]?\s?[A-Z][A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const spansOf = (L) => {
  const spans = [];
  const walk = (node, path) => {
    if (typeof node === 'string') {
      RE.lastIndex = 0;
      let g;
      while ((g = RE.exec(node))) spans.push({ path, quoted: g[1], book: g[2], ch: g[3], label: g[4].trim() });
    } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(L, '');
  return spans;
};
const verbatimFaults = (L) => {
  const bad = [];
  for (const s of spansOf(L)) {
    const nums = [];
    for (const part of s.label.split(',')) {
      const r = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
      if (r) for (let i = Number(r[1]); i <= Number(r[2]); i += 1) nums.push(i);
      else if (part.trim()) nums.push(Number(part.trim()));
    }
    const joined = nums.map((n) => verse(s.book, s.ch, n)).join(' ');
    if (!joined || !norm(joined).includes(norm(s.quoted))) bad.push(`${s.path} :: ${s.book} ${s.ch}:${s.label} :: "${s.quoted.slice(0, 70)}"`);
  }
  return bad;
};

const ID = 'll267-ugarit-and-the-words-we-read-yahweh-is-not-of-that-pantheon-he-is-its-judge';
const PREV = 'll258-he-gave-us-everything-we-need-until-we-want-what-he-wants';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const ALL = Object.keys(TEXTS);
const whole = ALL.map((k) => TEXTS[k]).join('\n');
const CLOSING = '"The grass withereth, the flower fadeth: but the word of our God shall stand for ever" (Isaiah 40:8).';

// The spine, carried in EVERY band, because a reader reads ONE band: the sea
// the Word says He made, the serpent His hand formed, the parallel named, the
// verdict on the pantheon, the Watcher who refuses signals, and the sending.
const IN_EVERY_BAND = [
  ['He created the heaven and the earth', 'Genesis', 1, 1, 'In the beginning God created the heaven and the earth'],
  ['the great sea-creatures are made, not fought', 'Genesis', 1, 21, 'And God created great whales'],
  ['the monster plays in His water', 'Psalms', 104, 26, 'there is that leviathan, whom thou hast made to play therein'],
  ['the hinge of the whole lesson', 'Job', 26, 13, 'his hand hath formed the crooked serpent'],
  ['the prophet and the Ugaritic pair', 'Isaiah', 27, 1, 'leviathan the piercing serpent, even leviathan that crooked serpent'],
  ['the psalm in the past tense', 'Psalms', 74, 14, 'Thou brakest the heads of leviathan in pieces'],
  ['the question no man can answer', 'Job', 41, 1, 'Canst thou draw out leviathan with an hook?'],
  ['the verdict on the pantheon', 'Psalms', 96, 5, 'For all the gods of the nations are idols: but the LORD made the heavens'],
  ['an idol is nothing', '1 Corinthians', 8, 4, 'an idol is nothing in the world'],
  ['the confession does not move', '1 Corinthians', 8, 6, 'But to us there is but one God, the Father'],
  ['the test that was actually run', '1 Kings', 18, 21, 'if the LORD be God, follow him: but if baal, then follow him'],
  ['the sea is His furniture', 'Psalms', 29, 10, 'The LORD sitteth upon the flood'],
  ['reading for the sense is honourable work', 'Nehemiah', 8, 8, 'gave the sense, and caused them to understand the reading'],
  ['His seeing precedes every society', 'Proverbs', 15, 3, 'The eyes of the LORD are in every place'],
  ['the answer to costly signalling', '1 Samuel', 16, 7, 'the LORD looketh on the heart'],
  ['one woman, alone, with nobody watching', 'Genesis', 16, 13, 'Thou God seest me'],
  ['what was still standing when the dust settled', 'Isaiah', 40, 8, 'but the word of our God shall stand for ever'],
  ['the four ordinary places', 'Deuteronomy', 6, 7, 'thou shalt teach them diligently unto thy children'],
  ['no blade sharpens itself', 'Proverbs', 27, 17, 'Iron sharpeneth iron'],
];
const ELSEWHERE = [
  ['He divides the sea', 'Job', 26, 12, 'He divideth the sea with his power'],
  ['the dragons in the waters', 'Psalms', 74, 13, 'thou brakest the heads of the dragons in the waters'],
  ['who can stand before Him', 'Job', 41, 10, 'who then is able to stand before me?'],
  ['all of it is His', 'Job', 41, 11, 'whatsoever is under the whole heaven is mine'],
  ['a king over creatures, not over Him', 'Job', 41, 34, 'he is a king over all the children of pride'],
  ['the sea is given a limit', 'Job', 38, 11, 'Hitherto shalt thou come, but no further'],
  ['where were you', 'Job', 38, 4, 'Where wast thou when I laid the foundations of the earth?'],
  ['Rahab and the dragon', 'Isaiah', 51, 9, 'Art thou not it that hath cut Rahab, and wounded the dragon?'],
  ['a king who thought himself untouchable', 'Ezekiel', 29, 3, 'the great dragon that lieth in the midst of his rivers'],
  ['He rules the raging', 'Psalms', 89, 9, 'Thou rulest the raging of the sea'],
  ['the voice on the waters', 'Psalms', 29, 3, 'The voice of the LORD is upon the waters'],
  ['the Son speaks to the storm', 'Mark', 4, 39, 'Peace, be still'],
  ['the question the lesson walks toward', 'Mark', 4, 41, 'What manner of man is this, that even the wind and the sea obey him?'],
  ['the old serpent is named and sentenced', 'Revelation', 12, 9, 'the great dragon was cast out, that old serpent, called the devil, and satan'],
  ['the chaos-water is simply gone', 'Revelation', 21, 1, 'there was no more sea'],
  ['gods many, lords many -- honest sociology', '1 Corinthians', 8, 5, 'as there be gods many, and lords many'],
  ['He judges the lineup', 'Psalms', 82, 1, 'he judgeth among the gods'],
  ['judgment on the gods of Egypt', 'Exodus', 12, 12, 'against all the gods of Egypt I will execute judgment: I am the LORD'],
  ['who is like Him', 'Exodus', 15, 11, 'Who is like unto thee, O LORD, among the gods?'],
  ['none like Him among them', 'Psalms', 86, 8, 'Among the gods there is none like unto thee, O Lord'],
  ['the Aramaic verse', 'Jeremiah', 10, 11, 'The gods that have not made the heavens and the earth, even they shall perish'],
  ['and who did make them', 'Jeremiah', 10, 12, 'He hath made the earth by his power'],
  ['the people said it twice', '1 Kings', 18, 39, 'The LORD, he is the God'],
  ['the Word will not flatter them', 'Deuteronomy', 32, 17, 'They sacrificed unto devils, not to God; to gods whom they knew not'],
  ['His name is His own', 'Isaiah', 42, 8, 'I am the LORD: that is my name'],
  ['none beside Him', 'Isaiah', 44, 6, 'I am the first, and I am the last; and beside me there is no God'],
  ['foreign speech reported as foreign speech', 'Isaiah', 36, 11, 'Speak, I pray thee, unto thy servants in the Syrian language'],
  ['Syriack at the court', 'Daniel', 2, 4, 'Then spake the Chaldeans to the king in Syriack'],
  ['three languages over the cross', 'John', 19, 20, 'it was written in Hebrew, and Greek, and Latin'],
  ['every man in his own tongue', 'Acts', 2, 8, 'how hear we every man in our own tongue, wherein we were born?'],
  ['the language of Canaan in Egypt', 'Isaiah', 19, 18, 'shall five cities in the land of Egypt speak the language of Canaan'],
  ['inspiration is a Who', '2 Peter', 1, 21, 'holy men of God spake as they were moved by the Holy Ghost'],
  ['all scripture', '2 Timothy', 3, 16, 'All scripture is given by inspiration of God'],
  ['not man’s wisdom', '1 Corinthians', 2, 13, 'not in the words which man’s wisdom teacheth, but which the Holy Ghost teacheth'],
  ['the worlds were framed', 'Hebrews', 11, 3, 'the worlds were framed by the word of God'],
  ['by Him all things consist', 'Colossians', 1, 17, 'by him all things consist'],
  ['prove all things', '1 Thessalonians', 5, 21, 'Prove all things; hold fast that which is good'],
  ['the Berean habit', 'Acts', 17, 11, 'searched the scriptures daily, whether those things were so'],
  ['every thought brought in', '2 Corinthians', 10, 5, 'bringing into captivity every thought to the obedience of Christ'],
  ['His words are pure', 'Psalms', 12, 6, 'The words of the LORD are pure words'],
  ['true from the beginning', 'Psalms', 119, 160, 'Thy word is true from the beginning'],
  ['the display indicted harder than any researcher does', 'Matthew', 6, 1, 'Take heed that ye do not your alms before men, to be seen of them'],
  ['the lips near, the heart far', 'Isaiah', 29, 13, 'this people draw near me with their mouth, and with their lips do honour me, but have removed their heart far from me'],
  ['the shut room with no audience', 'Matthew', 6, 6, 'thy Father which seeth in secret shall reward thee openly'],
  ['He knew the downsitting', 'Psalms', 139, 2, 'Thou knowest my downsitting and mine uprising'],
  ['not a word hidden', 'Psalms', 139, 4, 'For there is not a word in my tongue, but, lo, O LORD, thou knowest it altogether'],
  ['naked and opened', 'Hebrews', 4, 13, 'all things are naked and opened unto the eyes of him with whom we have to do'],
  ['known before formed', 'Jeremiah', 1, 5, 'Before I formed thee in the belly I knew thee'],
  ['one blood, not one signal', 'Acts', 17, 26, 'hath made of one blood all nations of men'],
  ['that they should seek Him', 'Acts', 17, 27, 'That they should seek the Lord, if haply they might feel after him, and find him'],
  ['in Him we live', 'Acts', 17, 28, 'For in him we live, and move, and have our being'],
  ['the love runs the other way', '1 John', 4, 19, 'We love him, because he first loved us'],
  ['the evidence was never missing', 'Romans', 1, 20, 'the invisible things of him from the creation of the world are clearly seen'],
  ['the refusal, not a shortage', 'Romans', 1, 21, 'when they knew God, they glorified him not as God, neither were thankful'],
  ['the trade down', 'Romans', 1, 25, 'worshipped and served the creature more than the Creator'],
  ['the short verdict on the posture', 'Psalms', 14, 1, 'The fool hath said in his heart, There is no God'],
  ['the Lamb', 'John', 1, 29, 'Behold the Lamb of God, which taketh away the sin of the world'],
  ['the Son on the throne', 'Hebrews', 1, 8, 'Thy throne, O God, is for ever and ever'],
  ['He gave Him', 'John', 3, 16, 'he gave his only begotten Son'],
  ['what He requires', 'Micah', 6, 8, 'to do justly, and to love mercy, and to walk humbly with thy God'],
];

describe('L267 exists, is numbered, and is dated the day it was built', () => {
  // DELIBERATELY NOT "is the last lesson" and NOT "268 is absent": other
  // builders hold 259 through 266 and the catalog grows under this branch.
  it('is in the catalog exactly once, after L258, with all four bands', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    const at = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const prev = LIVING_LESSONS_MODULES.findIndex((m) => m.id === PREV);
    expect(prev, 'L258 is in the catalog').toBeGreaterThan(-1);
    expect(at, 'L267 follows L258 in reading order').toBeGreaterThan(prev);
    expect(Object.keys(L.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
  });
  it('claims 267 exactly once and fills none of the numbers other builders hold', () => {
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 267)).toHaveLength(1);
    expect(Math.max(...claimed)).toBeGreaterThanOrEqual(267); // a floor, never an equality
    expect(new Set(claimed).size, 'no duplicated lesson number').toBe(claimed.length);
  });
  it('carries its build day, at or after L258', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-27');
    expect(LIVING_LESSONS_ADDED[PREV] <= LIVING_LESSONS_ADDED[ID]).toBe(true);
  });
});

describe('L267 tells the truth about its own road and its own limits', () => {
  it('names the road it came in on: sent inside the app, fetched on our own machines', () => {
    expect(L.lesson).toContain('inside the PoeTech app');
    expect(L.lesson).toContain('sent in for a lesson as a link');
    expect(L.lesson).toContain('the research road fetched what it could actually reach');
  });
  it('states the truncation limit rather than inventing the ending it does not have', () => {
    expect(L.lesson).toContain('SHORTEST piece of material in the whole intake');
    expect(L.lesson).toContain('stops in the middle of a sentence');
    expect(/the reading is cut off, not finished/.test(L.lesson)).toBe(true);
    expect(/refuses to guess at the ending it does not have/.test(L.lesson)).toBe(true);
  });
  it('states the captions limit, and therefore quotes no speaker and names none', () => {
    expect(L.lesson).toContain('machine hearing people talk');
    expect(/no sentence below is put in anyone’s mouth as a quotation/.test(L.lesson)).toBe(true);
    expect(L.lesson).toContain('The speakers are not named anywhere in what reached us');
  });
  it('corrects its own source on the dates rather than relaying them (DR-0192)', () => {
    expect(L.lesson).toContain('In the spring of 1928');
    expect(L.lesson).toContain('April of 1929');
    expect(L.lesson).toContain('fourteenth of May, 1929');
    expect(/compressed the plow and the dig into one year/.test(L.lesson)).toBe(true);
  });
  it('names the decipherers instead of leaving them anonymous, and flags the one step it could not confirm', () => {
    expect(L.lesson).toContain('Hans Bauer');
    expect(L.lesson).toContain('Charles Virolleaud');
    expect(L.lesson).toContain('Edouard Dhorme');
    expect(/is the source’s own account of the method/.test(L.lesson)).toBe(true);
    expect(/we could not confirm in that form/.test(L.lesson)).toBe(true);
  });
  it('names the three limits on the parallel itself, narrowly, rather than smearing doubt over it', () => {
    expect(L.lesson).toContain('sits in a damaged part of the tablet');
    expect(/whether Isaiah had any text in front of him cannot be shown/.test(L.lesson)).toBe(true);
    expect(/cannot be told to be Israelite or Phoenician work/.test(L.lesson)).toBe(true);
  });
  it('states the parallel as established, not as speculation (DR-0100 tier one)', () => {
    expect(/established comparative philology and not speculation/.test(L.lesson)).toBe(true);
    expect(L.lesson).toContain('the SAME NAME in two related languages');
  });
  it('keeps the second half visible, answers it from the Word, and never stages it as a debate', () => {
    expect(L.lesson).toContain('EIGHT. WHERE THE SOURCE TURNED — THE EYE IN THE SKY');
    expect(/honesty requires us to say so rather than quietly stopping the summary at the convenient place|honesty requires us to say so rather than quietly stop the summary at the convenient place/.test(L.lesson)).toBe(true);
    expect(L.lesson).toContain('costly signalling');
    expect(L.lesson).toContain('Ara Norenzayan');
    expect(/we have not read it, and we attach no motive to a living man/.test(L.lesson)).toBe(true);
    // the three tiers are worked by name, and the correction is of THAT claim
    expect(/FIRST, what is real in it is kept/.test(L.lesson)).toBe(true);
    expect(/SECOND, what is genuinely open stays open and narrow/.test(L.lesson)).toBe(true);
    expect(/THIRD, and this is the part the Word corrects/.test(L.lesson)).toBe(true);
    // no "two views, you decide"
    expect(/you decide|make up your own mind|both sides/i.test(whole)).toBe(false);
  });
  it('refuses BOTH wrong moves, and names the one that is on our own side', () => {
    expect(L.lesson).toContain('BOTH ARE WRONG');
    expect(/Do not pretend a parallel away because it frightens you/.test(L.lesson)).toBe(true);
    expect(/a shared word is not a shared deity/.test(L.lesson)).toBe(true);
  });
  it('the adult lesson walks ten movements, in order', () => {
    const order = [
      'ONE. WORD FIRST — WHO HOLDS THE SEA',
      'TWO. A PLOW HIT A ROCK',
      'THREE. THIRTY SIGNS, AND A MAN WHO COUNTED',
      'FOUR. THE WORD WAS WRITTEN IN REAL LANGUAGES, AMONG REAL NEIGHBOURS',
      'FIVE. THE SERPENT IN TWO LANGUAGES — SAID PLAINLY',
      'SIX. WHAT THE PARALLEL DOES NOT MEAN — HIS HAND FORMED IT',
      'SEVEN. NOT ONE OF THAT PANTHEON — ITS JUDGE',
      'EIGHT. WHERE THE SOURCE TURNED — THE EYE IN THE SKY',
      'NINE. HOW TO HOLD BOTH',
      'TEN. TALK ABOUT IT TOGETHER',
    ];
    let at = -1;
    for (const h of order) {
      const i = L.lesson.indexOf(h);
      expect(i, `${h} is missing or out of order`).toBeGreaterThan(at);
      at = i;
    }
  });
  it('points at the sister lessons rather than re-teaching them, and they are really there', () => {
    expect(/this course’s lesson on pride/.test(L.lesson)).toBe(true);
    expect(/works the covenant NAME itself and why we say Yahweh/.test(L.lesson)).toBe(true);
    expect(/another works the borrowed word El/.test(L.lesson)).toBe(true);
    for (const sib of ['ll77-', 'll155-', 'll73-']) {
      expect(LIVING_LESSONS_MODULES.some((m) => m.id.startsWith(sib)), `${sib} is cited but absent`).toBe(true);
    }
  });
});

describe('L267 carries the whole teaching in every band', () => {
  it.each([
    [/Ugarit/, 'the city by name'],
    [/thirty/i, 'the thirty signs'],
    [/lotan/, 'lotan by name'],
    [/leviathan/, 'leviathan by name'],
    [/1928/, 'the year of the plow'],
    [/1929/, 'the year of the dig'],
    [/pantheon|crowd of fake gods|fake gods/i, 'the pantheon'],
    [/Judge|judge/, 'the verdict'],
    [/baal/, 'the storm-figure, in lower case'],
    [/small|lower case/i, 'why we write those names small'],
  ])('%s — %s', (re, what) => {
    for (const k of ALL) expect(re.test(TEXTS[k]), `${k} drops ${what}`).toBe(true);
  });
  it.each(ALL)('%s quotes every strand of the spine', (k) => {
    for (const [why, book, ch, n] of IN_EVERY_BAND) {
      expect(TEXTS[k].includes(`(${book} ${ch}:${n}`), `${k} drops ${why} (${book} ${ch}:${n})`).toBe(true);
    }
  });
  it.each(ALL)('%s closes on Isaiah 40:8, the Word still standing', (k) => {
    expect(TEXTS[k].trim().endsWith(CLOSING), `${k} does not close on Isaiah 40:8`).toBe(true);
  });
  it.each(ALL)('%s holds BOTH halves of the hinge — the parallel conceded and the text not levelled', (k) => {
    expect(TEXTS[k].includes('(Job 26:13)'), `${k} drops the verse that settles it`).toBe(true);
    expect(TEXTS[k].includes('(Psalms 104:26)'), `${k} drops the creature made to play`).toBe(true);
    expect(/real|true/i.test(TEXTS[k]), `${k} never concedes the parallel`).toBe(true);
  });
});

describe('L267 — every quoted span is the verse, from the corpus on disk', () => {
  it.each([...IN_EVERY_BAND, ...ELSEWHERE])('%s — %s %s:%s', (_why, book, ch, n, span) => {
    const v = verse(book, ch, n);
    expect(v, `${book} ${ch}:${n} resolves in the corpus`).toBeTruthy();
    expect(v.includes(span), `the span is not in ${book} ${ch}:${n}`).toBe(true);
    expect(whole.includes(span), `the lesson does not carry ${book} ${ch}:${n}`).toBe(true);
  });
  const spans = L ? spansOf(L) : [];
  it('finds a substantial number of referenced spans', () => {
    expect(spans.length).toBeGreaterThan(300);
  });
  it('every referenced span is verbatim in the verse it cites, case and all', () => {
    const bad = verbatimFaults(L);
    expect(bad, `not His words as written:\n${bad.join('\n')}`).toEqual([]);
  });
  it('would catch an altered quotation (proven-to-catch)', () => {
    const altered = { ...L, levels: { ...L.levels, child: L.levels.child.replace('his hand hath formed the crooked serpent"', 'his hands made the twisty snake"') } };
    expect(altered.levels.child).not.toBe(L.levels.child);
    expect(verbatimFaults(altered).some((f) => f.includes('Job 26:13'))).toBe(true);
  });
  it('would catch "Yahweh" substituted into a quoted verse — the DR-0076 bright line (proven-to-catch)', () => {
    const yahwehed = { ...L, lesson: L.lesson.replace('In the beginning God created the heaven and the earth', 'In the beginning Yahweh created the heaven and the earth') };
    expect(yahwehed.lesson).not.toBe(L.lesson);
    expect(verbatimFaults(yahwehed).some((f) => f.includes('Genesis 1:1'))).toBe(true);
  });
  it('keeps the KJV "LORD" and "God" exactly as printed inside every quotation', () => {
    expect(whole).toContain('"For all the gods of the nations are idols: but the LORD made the heavens"');
    expect(whole).toContain('"In the beginning God created the heaven and the earth"');
  });
  it('uses the corpus apostrophe inside quotations', () => {
    for (const s of spans) expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a quotation`).toBe(false);
  });
  it('marks no elision and recites no record', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });
  it('every anchor reference is named in the lesson, and the hinge verse is the first anchor', () => {
    for (const ref of L.anchor.ref.split(';').map((r) => r.trim())) {
      const head = ref.replace(/-\d+$/, '');
      expect(L.lesson.includes(`(${head})`) || L.lesson.includes(`(${head}`), `${ref} is anchored but never named`).toBe(true);
    }
    expect(L.anchor.ref.startsWith('Job 26:13')).toBe(true);
  });
  it('each story’s verse is one the lesson anchors on', () => {
    for (const s of L.stories) expect(L.anchor.ref.split(';').map((r) => r.trim())).toContain(s.verse);
  });
});

describe('L267 — typographic theology, binding and senior to the source', () => {
  // The source CAPITALISES the false god's name. This house does not, and the
  // same goes for every other member of that pantheon, even where the
  // scholarship capitalises them. The KJV corpus on disk already prints
  // "baal", "satan" and "leviathan" in lower case, so a verbatim quotation
  // never forces the conflict.
  it.each(['Baal', 'Asherah', 'Mot', 'Lotan', 'Leviathan', 'Satan', 'Lucifer', 'Devil'])('never capitalises %s anywhere a reader can see it', (name) => {
    const fields = [L.lesson, L.bigIdea, L.inApp, L.anchor.theme, ...BANDS.map((b) => L.levels[b]),
      ...L.benefits, ...L.stories.map((s) => `${s.title} ${s.body}`),
      ...L.quiz.questions.flatMap((q) => [q.q, q.explain, ...q.options]),
      ...L.facilitator.talkingPoints, ...L.facilitator.discussionPrompts, L.facilitator.howToRun];
    for (const f of fields) expect(new RegExp(`\\b${name}\\b`).test(f), `"${name}" is capitalised in: ${String(f).slice(0, 90)}`).toBe(false);
  });
  it('would catch a capitalised false god (proven-to-catch)', () => {
    expect(/\bBaal\b/.test(`${L.levels.child} Then Baal answered.`)).toBe(true);
    expect(/\bBaal\b/.test(L.levels.child)).toBe(false);
  });
  it('says out loud WHY the names are written small, in every band', () => {
    for (const k of ALL) expect(/lost that honour|lost the right|forfeited|lower case|write them small|write those names small|write it small|written small|not give him a big letter|a big letter/i.test(TEXTS[k]), `${k} never says why`).toBe(true);
  });
  it.each(ALL)('%s names Him by covenant name and never the generic in our own prose', (k) => {
    const ours = ourProseOnly(TEXTS[k]);
    expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
    expect(/\bGod(?:'|’)?s?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
  });
  it('the generic-name check would catch "God" in our voice (proven-to-catch)', () => {
    expect(/\bGod(?:'|’)?s?\b/.test(ourProseOnly(`${TEXTS.child} Then God was glad.`))).toBe(true);
  });
  it('confesses Jesus as the Lamb of Yahweh and the Eternal Son of Yahweh, with John 1:29 beside it', () => {
    expect(L.lesson).toContain('the Lamb of Yahweh and the Eternal Son of Yahweh');
    expect(L.lesson).toContain('(John 1:29)');
    for (const k of ALL) expect(/Lamb of Yahweh/.test(TEXTS[k]), `${k} never confesses the Lamb of Yahweh`).toBe(true);
  });
});

describe('L267 — four bands, each carrying the whole message', () => {
  const measured = measureFullness(L);
  it.each(BANDS)('%s clears its floor', (b) => {
    expect(measured.bands[b].share).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });
  it('reports no short band, and would report one trimmed back (proven-to-catch)', () => {
    expect(shortBands(measured)).toEqual([]);
    const faked = { ...L, levels: { ...L.levels, teen: L.levels.teen.slice(0, 600) } };
    expect(shortBands(measureFullness(faked))).toContain('teen');
  });
  it('every band names its own lesson near the start', () => {
    expect(unnamedBands(L)).toEqual([]);
  });
  it('keeps the bands genuinely different', () => {
    expect(duplicatedBands(measureDifferentiation(L))).toEqual([]);
    expect(measureDifferentiation(L).worst).toBeLessThan(DIFF_CEILING);
  });
  it('the ladder rises and the child band is under the ceiling', () => {
    const g = (k) => fleschKincaidGrade(ourProseOnly(TEXTS[k]));
    expect(isInverted(measureLesson(L))).toBe(false);
    expect(g('child')).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(g('youth')).toBeGreaterThan(g('child') + 1);
    expect(g('teen')).toBeGreaterThan(g('youth') + 1);
    expect(g('senior')).toBeGreaterThan(g('teen') + 1);
  });
});

describe('L267 — sends the reader all three ways, in every place a reader reads', () => {
  it('the lesson and every band carry all three directions', () => {
    expect(placesMissingDirections(L)).toEqual([]);
    expect(hasAllThree(L)).toBe(true);
  });
  it('the PER-BAND check catches one band’s friend line removed while the pooled check still reads green (proven-to-catch, DR-0795)', () => {
    const cut = { ...L, levels: { ...L.levels, senior: L.levels.senior.replace(/Friends, tell one friend this week[^.]*\./, 'It is worth pondering alone.') } };
    expect(cut.levels.senior).not.toBe(L.levels.senior);
    const gaps = placesMissingDirections(cut);
    expect(gaps.some((p) => p.place === 'senior' && p.missing.includes('friends')), 'the per-band check must name the senior band').toBe(true);
    expect(hasAllThree(cut), 'the pooled check still reads green, which is why the per-band one exists').toBe(true);
  });
  it('the per-band check also catches a parents line removed from one band alone (proven-to-catch)', () => {
    const cut = { ...L, levels: { ...L.levels, teen: L.levels.teen.replace(/Parents, ask your children one question[^.]*\./, 'Consider the question yourself.') } };
    expect(cut.levels.teen).not.toBe(L.levels.teen);
    expect(placesMissingDirections(cut).some((p) => p.place === 'teen' && p.missing.includes('parents'))).toBe(true);
    expect(hasAllThree(cut)).toBe(true);
  });
  it('names the skill and the rhythm, not just the direction', () => {
    for (const k of ALL) {
      expect(/listen/i.test(TEXTS[k]), `${k} never names the listening skill`).toBe(true);
      expect(/one friend this week/i.test(TEXTS[k]), `${k} never names the weekly rhythm`).toBe(true);
      expect(/teach (them|one verse)/i.test(TEXTS[k]), `${k} never names teaching one verse back`).toBe(true);
    }
  });
});

describe('L267 — two stories, the full teaching shape', () => {
  it('carries two real stories, one light and one solemn, with no double-quoted span', () => {
    const real = (L.stories || []).filter((s) => s.kind === 'parable' || s.kind === 'testimony');
    expect(real.length).toBeGreaterThanOrEqual(2);
    const tones = L.stories.map((s) => s.tone);
    expect(tones).toContain('light');
    expect(tones).toContain('solemn');
    for (const s of L.stories) expect(String(s.body)).not.toMatch(/"/);
  });
  it('the stories teach THIS lesson rather than decorating it', () => {
    const [light, solemn] = ['light', 'solemn'].map((tone) => L.stories.find((s) => s.tone === tone));
    expect(light.title).toBe('The Thirty Marks');
    expect(/Thirty marks is not enough for words/.test(light.body), 'the light story must carry the counting').toBe(true);
    expect(/had not made him the author of a single recipe/.test(light.body), 'the light story must carry the point: reading is not authoring').toBe(true);
    expect(solemn.title).toBe('What the Tablet Did to Howard');
    expect(/He agreed with it/.test(solemn.body), 'the solemn story must concede the parallel, not argue with it').toBe(true);
    expect(/a defence he should never have been handed/.test(solemn.body), 'the solemn story must name the failure on our own side').toBe(true);
  });
  it('has the full teaching shape', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(L.benefits.length).toBeGreaterThanOrEqual(11);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(8);
    expect(L.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(5);
    expect(L.facilitator.howToRun.length).toBeGreaterThan(400);
    expect(L.bigIdea.length).toBeGreaterThan(400);
    expect(L.inApp).toContain('TALK ABOUT IT TOGETHER');
  });
  it('the quiz answers are not all in one position and every answer indexes a real option', () => {
    const at = L.quiz.questions.map((q) => q.answer);
    expect(new Set(at).size).toBeGreaterThan(1);
    for (const q of L.quiz.questions) expect(q.options[q.answer]).toBeTruthy();
  });
  it('the quiz tests the hinge, the limits and the second half rather than trivia', () => {
    // Measured over the whole of each question -- stem, options and the
    // explanation -- because that is what a reader actually meets, and a
    // correct answer carrying the substance is the point of the question.
    const quiz = L.quiz.questions.map((q) => `${q.q} ${q.options.join(' ')} ${q.explain}`).join(' | ');
    for (const topic of [
      /established comparative philology/, // the hinge: the parallel conceded
      /his hand hath formed the crooked serpent/, // and the text not levelled
      /ENDS MID-SENTENCE/, // limit one
      /lower case/, // limit two
      /eye in the sky/, // the second half, named
      /costly-signalling/,
      /on OUR side/, // the failure that is ours
    ]) expect(topic.test(quiz), `the quiz never reaches ${topic}`).toBe(true);
  });
});
