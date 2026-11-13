// =============================================================================
// sovereign-ai-sov66-verses — the gate for sov66, "They dwelt careless, and
// there was no deliverer"
// =============================================================================
// WHAT THIS LESSON IS, AND WHAT IT DELIBERATELY IS NOT.
//
// Gmail thread `1a163a78c1d14d84`, one message, 237,780 bytes, forwarded
// 2026-10-22 12:48:01 UTC from dpoe@illinois.edu to darrellpoe06@gmail.com,
// subject `Fw: Very vulnerable` (the subject carries two emoji, dropped for the
// DR-1288 probe string and recorded here so a re-run uses the same text). The
// teaching is judged by HIS word typed above the forwarded header, which is
// `Lesson`, and never by whatever the publisher happened to put in the subject.
//
// THE ITEM TAUGHT is the issue's lead: a defect in a layer of software a very
// large share of the world's web sites is built on, emergency repairs published
// the day before the mail, and the plain fact that a repair saves nobody who
// does not install it by hand. The reading taught is NOT the obvious one. The
// obvious reading -- an old hole nobody repaired -- is where sov44 and sov47
// already LAND. What is genuinely unbuilt is why it sat unrepaired: the defect
// was ranked LOW because the ATTACKER was judged too weak to be bothered. So
// the protection was never a wall; it was the absence of somebody else's
// interest, and that is the one variable in the arrangement nobody here holds
// still. The week lands on a REPRICING and a HAND.
//
// WHERE THE NEIGHBOURS LAND, read from their own bigIdea and in-app step rather
// than from a verse count, which is the measure DR-1317 removed:
//   sov44 lands on the pit returning on the digger, and on testing whatever
//         arrives -- its in-app step ends on a page being a specimen, never a
//         master;
//   sov47 lands on naming the distress BEFORE the reproach, asking for a mind
//         to work rather than a cheque, and making an alarm TRUER rather than
//         quieter;
//   sov15 lands on cross-examining the one who profits from the warning, and on
//         one watch and one brake from a source not selling the cure.
// Three shared foundations, three different landings. Asserted below on their
// own text, in both directions: each neighbour carries its own landing marker,
// and this lesson carries none of them.
//
// A VERSE IS NEVER SPENT (DR-1317, Darrell 2026-11-05). Not one reading was
// dropped here for a collision. The anchor census ran over the whole "A.I. The
// Way" department and the prose census over 925 files and 44.4 million
// characters of `app/src/lib`; both are recorded below as MEASUREMENTS that name
// the other holder, never as a veto. ELEVEN of this lesson's chapters are
// untouched at anchor level anywhere in the department; twenty are shared
// (Isaiah 22 moved to shared on 2026-11-13 when sov78 anchored Isaiah 22:22).
//
// ONE CITATION MOVED TO THE WORD'S OTHER WITNESS, AND THE READING WAS NOT
// DROPPED. The staff of a reed that pierces the hand of the man who leans on it
// is given twice, word for word in its load-bearing half: 2 Kings 18:21 and
// Isaiah 36:6. sov65's gate asserts that EVERY chapter it stands on is free of
// every other lesson in the department, and it anchors 2 Kings 18 -- so the
// 2 Kings citation turned sov65's gate red in a file this build may not touch,
// which is exactly the cost shape DR-1316 named. DR-1317 reserves reshaping the
// free/SPENT machinery to the Governor, so neither path was taken: the TEACHING
// is kept whole and in full, carried by Isaiah 36:6, which is free at anchor
// level and appears nowhere in 44.4M characters of app/src/lib. Nothing is
// thinned; the other witness says the same thing. The sov65 gate defect is
// reported in DR-1322 rather than edited here.
//
// EVERY LESSON STANDS ALONE AND WHOLE (DR-1317's second correction). No reader
// text points at another lesson. The comparison above lives in DR-1322 and in
// this header, where a reviewer reads it and a reader does not.
//
// Every verse was fetched from the KJV corpus on disk by script BEFORE a word
// was written, and SPINE_FRAGMENTS pins the exact span the lesson quotes for
// every one of the 48 references. Recorded as DR-1322.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES, SOVEREIGN_AI_META } from '../lib/sovereign-ai-class.js';
import { MODULES } from '../lib/church-classes.js';
import { AI_LEGAL_BLUEPRINT_MODULES } from '../lib/ai-legal-blueprint-class.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { lessonCreatedDay } from '../lib/lesson-dates.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, ourProseOnly } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { findBritish } from '../../../scripts/american-spelling.mjs';
import { hasAllThree, placesMissingDirections } from '../lib/talk-together.js';
import { storyCount, quotesTheWord } from '../lib/lesson-completeness.js';
import { anchorRefs, chapterKey } from '../lib/search-it-out.js';
import { termFaults } from '../lib/plain-before-the-term.js';
import { censusLesson } from '../lib/library-census.js';
import { fourBandFaults, LADDER, fk, words, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';

const ID = 'sov66-they-dwelt-careless-and-there-was-no-deliverer';
const M = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);
/** The five places a reader actually meets this lesson. */
const PLACES = () => ({ adult: M.lesson, child: M.levels.child, youth: M.levels.youth, teen: M.levels.teen, senior: M.levels.senior });
/** Every string in the module, so no field can go unchecked. */
const allStrings = (o = M, out = []) => {
  if (typeof o === 'string') out.push(o);
  else if (Array.isArray(o)) o.forEach((v) => allStrings(v, out));
  else if (o && typeof o === 'object') Object.values(o).forEach((v) => allStrings(v, out));
  return out;
};

// --- the KJV corpus on disk ---------------------------------------------------
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const bookCache = new Map();
const bookOf = (b) => {
  const f = b.replace(/\s+/g, '');
  if (!bookCache.has(f)) bookCache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  return bookCache.get(f);
};
const verseText = (ref) => {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(String(ref).trim());
  if (!m) return null;
  const ch = bookOf(m[1]).chapters[Number(m[2]) - 1];
  return ch && ch[Number(m[3]) - 1] ? ch[Number(m[3]) - 1] : null;
};
/**
 * The whole corpus as one string, ONE CHAPTER PER LINE with a separator, so a
 * quotation claiming to be contiguous can never be satisfied by text that
 * straddles a chapter break.
 */
const BOOKS = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1Samuel', '2Samuel', '1Kings', '2Kings', '1Chronicles', '2Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'SongofSolomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1Corinthians', '2Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1Thessalonians', '2Thessalonians', '1Timothy', '2Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1Peter', '2Peter', '1John', '2John', '3John', 'Jude', 'Revelation'];
let CORPUS = null;
const corpus = () => {
  if (CORPUS) return CORPUS;
  const lines = [];
  for (const f of BOOKS) for (const ch of JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')).chapters) lines.push(ch.join(' '));
  CORPUS = lines.join('\n§\n');
  return CORPUS;
};

/**
 * THE PINNED SPINE, reference by reference, with the EXACT span this lesson
 * quotes for it. Each is asserted (a) to be a substring of that verse in the
 * corpus on disk, so it cannot have come from memory or from a neighbouring
 * verse, and (b) to be present in the ADULT lesson, so no reference can be
 * listed in `anchor.ref` without the Word actually being quoted for it.
 */
const SPINE_FRAGMENTS = {
  'Proverbs 18:11': 'The rich man’s wealth is his strong city, and as an high wall in his own conceit.',
  'Ezekiel 38:11': 'I will go up to the land of unwalled villages; I will go to them that are at rest, that dwell safely, all of them dwelling without walls, and having neither bars nor gates',
  'Jeremiah 49:31': 'Arise, get you up unto the wealthy nation, that dwelleth without care, saith the LORD, which have neither gates nor bars, which dwell alone.',
  'Judges 18:7': 'how they dwelt careless, after the manner of the Zidonians, quiet and secure; and there was no magistrate in the land, that might put them to shame in any thing; and they were far from the Zidonians, and had no business with any man',
  'Judges 18:27': 'came unto Laish, unto a people that were at quiet and secure: and they smote them with the edge of the sword, and burnt the city with fire',
  'Judges 18:28': 'And there was no deliverer, because it was far from Zidon, and they had no business with any man',
  'Judges 8:11': 'and smote the host: for the host was secure',
  'Luke 11:21': 'When a strong man armed keepeth his palace, his goods are in peace:',
  'Luke 11:22': 'But when a stronger than he shall come upon him, and overcome him, he taketh from him all his armour wherein he trusted, and divideth his spoils.',
  'Obadiah 1:3': 'thou that dwellest in the clefts of the rock, whose habitation is high; that saith in his heart, Who shall bring me down to the ground?',
  'Obadiah 1:4': 'though thou set thy nest among the stars, thence will I bring thee down, saith the LORD',
  'Nahum 3:8': 'that was situate among the rivers, that had the waters round about it, whose rampart was the sea, and her wall was from the sea?',
  'Nahum 3:11': 'thou also shalt seek strength because of the enemy',
  'Zephaniah 2:15': 'This is the rejoicing city that dwelt carelessly, that said in her heart, I am, and there is none beside me',
  'Exodus 21:29': 'But if the ox were wont to push with his horn in time past, and it hath been testified to his owner, and he hath not kept him in',
  'Deuteronomy 22:8': 'When thou buildest a new house, then thou shalt make a battlement for thy roof, that thou bring not blood upon thine house, if any man fall from thence.',
  'Isaiah 22:8': 'and thou didst look in that day to the armour of the house of the forest',
  'Isaiah 22:9': 'Ye have seen also the breaches of the city of David, that they are many: and ye gathered together the waters of the lower pool.',
  'Isaiah 22:10': 'And ye have numbered the houses of Jerusalem, and the houses have ye broken down to fortify the wall.',
  'Isaiah 22:11': 'but ye have not looked unto the maker thereof, neither had respect unto him that fashioned it long ago',
  'Isaiah 28:20': 'For the bed is shorter than that a man can stretch himself on it: and the covering narrower than that he can wrap himself in it.',
  'Job 8:14': 'whose trust shall be a spider’s web',
  'Job 8:15': 'He shall lean upon his house, but it shall not stand: he shall hold it fast, but it shall not endure.',
  'Isaiah 36:6': 'thou trustest in the staff of this broken reed, on Egypt; whereon if a man lean, it will go into his hand, and pierce it',
  '1 Thessalonians 5:3': 'For when they shall say, Peace and safety; then sudden destruction cometh upon them, as travail upon a woman with child; and they shall not escape.',
  'Amos 6:1': 'Woe to them that are at ease in Zion, and trust in the mountain of Samaria',
  '1 Corinthians 10:12': 'Wherefore let him that thinketh he standeth take heed lest he fall.',
  'Proverbs 22:3': 'A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.',
  'James 1:22': 'But be ye doers of the word, and not hearers only, deceiving your own selves.',
  'James 1:23': 'he is like unto a man beholding his natural face in a glass',
  'James 1:24': 'For he beholdeth himself, and goeth his way, and straightway forgetteth what manner of man he was.',
  'James 1:25': 'but a doer of the work, this man shall be blessed in his deed',
  'Nehemiah 3:28': 'From above the horse gate repaired the priests, every one over against his house.',
  'Nehemiah 4:6': 'So built we the wall; and all the wall was joined together unto the half thereof: for the people had a mind to work.',
  'Proverbs 18:10': 'The name of the LORD is a strong tower: the righteous runneth into it, and is safe.',
  'Psalms 20:7': 'Some trust in chariots, and some in horses: but we will remember the name of the LORD our God.',
  'Colossians 1:16': 'all things were created by him, and for him',
  'Colossians 1:17': 'And he is before all things, and by him all things consist.',
  'Isaiah 26:1': 'We have a strong city; salvation will God appoint for walls and bulwarks.',
  'Isaiah 26:2': 'Open ye the gates, that the righteous nation which keepeth the truth may enter in.',
  'Isaiah 26:3': 'Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.',
  'Isaiah 26:4': 'Trust ye in the LORD for ever: for in the LORD JEHOVAH is everlasting strength',
  'John 1:29': 'Behold the Lamb of God, which taketh away the sin of the world.',
  'John 3:16': 'For God so loved the world, that he gave his only begotten Son',
  'Hebrews 1:8': 'But unto the Son he saith, Thy throne, O God, is for ever and ever',
  'Galatians 5:22': 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith',
  'Deuteronomy 6:7': 'when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up',
  'Hebrews 3:13': 'But exhort one another daily, while it is called To day',
};
const SPINE = Object.keys(SPINE_FRAGMENTS);

describe('sov66 — the lesson is mounted and is the week it says it is', () => {
  it('is mounted as week 66, in its own place, with every reader field present', () => {
    expect(M, `${ID} is not mounted`).toBeTruthy();
    const weeks = SOVEREIGN_AI_MODULES.map((m) => Number(m.id.match(/^sov(\d+)-/)[1]));
    // FORWARD-SAFE ON PURPOSE (DR-1316): a lesson gate may not claim to be the
    // last lesson. What is durably true is that week 66 exists, it is THIS
    // lesson, it sits in the 66th place, and the weeks run contiguous from one.
    expect(weeks).toContain(66);
    expect(weeks.filter((w) => w === 66).length, 'week 66 is mounted twice').toBe(1);
    expect(SOVEREIGN_AI_MODULES[65].id, 'sov66 is not in the 66th place').toBe(ID);
    expect(Math.max(...weeks)).toBeGreaterThanOrEqual(66);
    for (let w = 1; w <= 66; w += 1) expect(weeks, `week ${w} is missing`).toContain(w);
    expect(SOVEREIGN_AI_META.weeks).toBe(SOVEREIGN_AI_MODULES.length);
    expect(String(M.title).length).toBeGreaterThan(80);
    for (const k of ['bigIdea', 'inApp', 'lesson']) expect(String(M[k]).length, k).toBeGreaterThan(200);
    for (const b of FOUR_BANDS) expect(String(M.levels[b]).length, b).toBeGreaterThan(2000);
  });

  it('carries the title it is named for, and every quoted phrase in it is really in the corpus', () => {
    expect(M.title).toContain('They dwelt careless, and there was no deliverer');
    expect(M.title).toContain('the hole that was always open');
    expect(M.title).toContain('the stronger man who came');
    expect(M.title).toContain('the walls Yahweh appoints');
    // sov64 lost its title to a misremembered verse (DR-1311). Both halves of
    // this one are read off the corpus rather than off memory.
    expect(verseText('Judges 18:7')).toContain('they dwelt careless');
    expect(verseText('Judges 18:28')).toContain('And there was no deliverer');
    expect(verseText('Luke 11:22')).toContain('a stronger than he');
  });

  it('THE LIBRARY RATCHET: this lesson is WHOLE — every component and every reading version', () => {
    // The gate that caught ll274 shipping without talkingPoints and howToRun.
    const c = censusLesson(M);
    expect(c.missingComponents, `missing: ${c.missingComponents.join(', ')}`).toEqual([]);
    expect(c.missingVersions, `missing versions: ${c.missingVersions.join(', ')}`).toEqual([]);
    expect(c.whole).toBe(true);
    expect(c.short).toBe(false);
    // PROVEN TO CATCH: strip the run of show and the ratchet names it.
    const bent = { ...M, facilitator: { ...M.facilitator, howToRun: '' } };
    expect(censusLesson(bent).missingComponents).toContain('howToRun');
    expect(censusLesson(bent).whole).toBe(false);
  });
});

describe('sov66 — every verse is the corpus on disk, and nothing is from memory', () => {
  it('ANTI-VACUITY: the sweep really reads a large number of quoted spans', () => {
    const spans = allStrings().flatMap((s) => s.match(/"[^"]+"/g) || []);
    // Measured 270 across the module and 244 across the five reader places.
    expect(spans.length).toBeGreaterThanOrEqual(255);
    const reader = Object.values(PLACES()).flatMap((s) => s.match(/"[^"]+"/g) || []);
    expect(reader.length).toBeGreaterThanOrEqual(235);
  });

  it('every double-quoted span in EVERY string of the module is verbatim corpus text', () => {
    const c = corpus();
    const faults = [];
    for (const s of allStrings()) for (const raw of s.match(/"[^"]+"/g) || []) {
      const inner = raw.slice(1, -1).trim();
      if (!c.includes(inner)) faults.push(inner.slice(0, 70));
    }
    expect(faults, `not verbatim:\n${faults.join('\n')}`).toEqual([]);
  });

  it('CARRIES NO CURLY-QUOTED SCRIPTURE, so all five house quotation gates can see every span', () => {
    // DR-1312's finding, applied before the fact: every house quotation gate
    // splits on the ASCII double quote, so a curly-quoted verse is invisible.
    const text = allStrings().join('\n');
    expect((text.match(/“/g) || []).length, 'left curly double quote present').toBe(0);
    expect((text.match(/”/g) || []).length, 'right curly double quote present').toBe(0);
    for (const [k, v] of Object.entries(PLACES())) {
      const marks = (v.match(/"/g) || []).length;
      expect(marks % 2, `${k} has an odd number of double-quote marks`).toBe(0);
      expect(marks, `${k} quotes the Word nowhere`).toBeGreaterThan(40);
    }
    // The corpus's own U+2019 apostrophes INSIDE quotations are kept verbatim.
    expect(verseText('Proverbs 18:11')).toContain('The rich man’s wealth');
    expect(M.lesson).toContain('The rich man’s wealth');
    expect(verseText('Job 8:14')).toContain('a spider’s web');
    expect(M.lesson).toContain('a spider’s web');
  });

  it('anchor.ref names every verse the lesson stands on, each resolving, and the pinned spine is EXACTLY it', () => {
    const refs = anchorRefs(M);
    expect(refs).toEqual(SPINE);
    expect(refs.length).toBe(48);
    for (const r of refs) expect(verseText(r), `${r} does not resolve`).toBeTruthy();
  });

  it('each pinned fragment is a substring of ITS OWN verse, and is quoted in the ADULT lesson', () => {
    const notInVerse = [];
    const notInLesson = [];
    for (const [ref, frag] of Object.entries(SPINE_FRAGMENTS)) {
      if (!String(verseText(ref)).includes(frag)) notInVerse.push(`${ref}: ${frag.slice(0, 50)}`);
      if (!M.lesson.includes(frag)) notInLesson.push(`${ref}: ${frag.slice(0, 50)}`);
    }
    expect(notInVerse, `fragment is not in the verse it claims:\n${notInVerse.join('\n')}`).toEqual([]);
    expect(notInLesson, `reference in anchor.ref with no quotation in the adult lesson:\n${notInLesson.join('\n')}`).toEqual([]);
  });

  it('THE CORPUS CORRECTED MEMORY THREE TIMES, and all three corrections are pinned', () => {
    // 1. Luke 11:22 has NO comma after armour. Memory, and most modern
    //    paraphrase of this verse, reads `armour, wherein he trusted`.
    expect(verseText('Luke 11:22')).toContain('all his armour wherein he trusted');
    expect(verseText('Luke 11:22')).not.toContain('armour, wherein');
    expect(allStrings().join('\n')).not.toContain('armour, wherein');
    // 2. Isaiah 22:10. Memory reads `and ye have broken down the houses, to
    //    make the wall`. The corpus inverts the clause and says FORTIFY.
    expect(verseText('Isaiah 22:10')).toContain('the houses have ye broken down to fortify the wall');
    expect(verseText('Isaiah 22:10')).not.toContain('ye have broken down the houses');
    expect(allStrings().join('\n')).not.toContain('ye have broken down the houses');
    // 3. ONE LETTER APART, AND THE TITLE DEPENDS ON IT. Judges 18:7 reads
    //    `dwelt careless`; Zephaniah 2:15 reads `dwelt carelessly`. The title
    //    takes the Judges form, so the two are pinned separately.
    expect(verseText('Judges 18:7')).toContain('they dwelt careless, after the manner');
    expect(verseText('Zephaniah 2:15')).toContain('that dwelt carelessly');
    expect(M.title).toContain('They dwelt careless, and');
    expect(M.title).not.toContain('carelessly');
  });

  it('PROVEN TO CATCH: a changed word, a straightened apostrophe and a smoothed clause each fail the sweep', () => {
    const c = corpus();
    const bends = [
      M.lesson.replace('And there was no deliverer', 'And there was no saviour'),
      M.lesson.replace('all his armour wherein he trusted', 'all his armour, wherein he trusted'),
      M.lesson.replace('The rich man’s wealth', 'The rich man\'s wealth'),
      M.lesson.replace('the houses have ye broken down to fortify the wall', 'ye have broken down the houses to make the wall'),
      M.lesson.replace('for the host was secure', 'for the host was at ease'),
    ];
    bends.forEach((bent, i) => {
      expect(bent, `bend ${i} changed nothing — the planted string was not present`).not.toBe(M.lesson);
      const faults = (bent.match(/"[^"]+"/g) || []).map((r) => r.slice(1, -1).trim()).filter((inner) => !c.includes(inner));
      expect(faults.length, `bend ${i} was not caught`).toBeGreaterThan(0);
    });
  });

  it('the KJV’s own God and LORD stay exactly as written inside every quotation, and our voice says Yahweh', () => {
    // DR-0210 / DR-0076 bright line, asserted in BOTH directions.
    expect(M.lesson).toContain('salvation will God appoint for walls and bulwarks.');
    expect(M.lesson).toContain('The name of the LORD is a strong tower');
    expect(M.lesson).toContain('for in the LORD JEHOVAH is everlasting strength');
    const generic = allStrings().map(ourProseOnly).join('\n').match(/\bGod\b|\bGOD\b|\bLORD\b/g) || [];
    expect(generic, 'generic God or LORD in our authored voice').toEqual([]);
    expect(Object.values(PLACES()).every((p) => p.includes('Yahweh'))).toBe(true);
    // And no adversary name is ever capitalised.
    const text = allStrings().join('\n');
    for (const n of ['Satan', 'Lucifer', 'The Devil', 'Baal']) expect(new RegExp(`\\b${n}\\b`).test(text), `${n} is capitalised`).toBe(false);
  });

  it('every reader place confesses Jesus as the Lamb of Yahweh and the Eternal Son of Yahweh', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} is missing the Lamb`).toMatch(/Lamb of Yahweh/);
      expect(v, `${k} is missing the Eternal Son`).toMatch(/Eternal Son of Yahweh/);
    }
  });
});

describe('sov66 — the ground is MEASURED, and no verse was dropped for being used', () => {
  const dept = () => [...SOVEREIGN_AI_MODULES, ...MODULES, ...AI_LEGAL_BLUEPRINT_MODULES];
  const chaptersOf = (mods) => {
    const out = new Map();
    for (const m of mods) for (const r of anchorRefs(m)) {
      const c = chapterKey(r);
      if (!c) continue;
      if (!out.has(c)) out.set(c, new Set());
      out.get(c).add(m.id);
    }
    return out;
  };

  // The eleven chapters measured UNTOUCHED at anchor level anywhere in the
  // department, which is where the whole spine of this teaching lives.
  const FREE = ['Ezekiel 38', 'Jeremiah 49', 'Judges 18', 'Judges 8', 'Obadiah 1', 'Nahum 3', 'Zephaniah 2', 'Isaiah 36', 'Job 8', 'Amos 6', '1 Corinthians 10'];
  // The nineteen chapters measured SHARED, each with a lesson that really holds
  // it. This is the DR-1317 shape: a shared foundation is recorded, not vetoed.
  const SHARED = {
    'Proverbs 18': 'sov15', 'Luke 11': 'sov44', 'Exodus 21': 'sov43', 'Deuteronomy 22': 'sov46',
    'Isaiah 28': 'sov18', '1 Thessalonians 5': 'sov44', 'James 1': 'sov16',
    'Nehemiah 3': 'sov40', 'Nehemiah 4': 'sov47', 'Proverbs 22': 'sov44', 'Psalms 20': 'sov35',
    'Isaiah 26': 'sov41', 'Colossians 1': 'sov41', 'John 1': 'sov44', 'John 3': 'sov44',
    'Hebrews 1': 'sov44', 'Galatians 5': 'sov44', 'Deuteronomy 6': 'sov47', 'Hebrews 3': 'sov44',
    // MOVED FROM FREE TO SHARED 2026-11-13, a measurement that changed rather
    // than a defect: sov78 (Count the cost, DR-1468) anchors Isaiah 22:22, the
    // key of the house of David that Revelation 3:7 takes up. DR-1317 records a
    // shared foundation and never vetoes it, so neither lesson's reading moved.
    'Isaiah 22': 'sov78',
  };

  it('ANTI-VACUITY: the department really holds a large chapter set, so an empty set cannot fake a pass', () => {
    const all = chaptersOf(dept());
    // Measured 491 across 79 lessons before this one; it adds 12 of its own.
    expect(all.size).toBeGreaterThan(480);
    expect(dept().length).toBeGreaterThan(75);
  });

  it('the ELEVEN chapters recorded as untouched really are untouched by every other department lesson', () => {
    const others = chaptersOf(dept().filter((m) => m.id !== ID));
    const held = FREE.filter((c) => others.has(c)).map((c) => `${c} <- ${[...others.get(c)].join(', ')}`);
    expect(held, `recorded as untouched but actually held:\n${held.join('\n')}`).toEqual([]);
    // And this lesson really stands on every one of them.
    const mine = new Set(SPINE.map(chapterKey));
    for (const c of FREE) expect(mine.has(c), `${c} is recorded as this lesson's ground and is absent`).toBe(true);
  });

  it('the TWENTY shared chapters really are shared, by the lesson named for each — and none was dropped', () => {
    const others = chaptersOf(dept().filter((m) => m.id !== ID));
    const mine = [...new Set(SPINE.map(chapterKey))];
    // The census is a MEASUREMENT (DR-1317). Every chapter of this lesson is
    // either in FREE or in SHARED, and nothing is unaccounted for.
    const unaccounted = mine.filter((c) => !FREE.includes(c) && !Object.keys(SHARED).includes(c));
    expect(unaccounted, `chapter neither recorded free nor recorded shared:\n${unaccounted.join('\n')}`).toEqual([]);
    expect(mine.length).toBe(FREE.length + Object.keys(SHARED).length);
    // And each shared chapter is really held by the lesson this header names,
    // so the recorded overlap cannot have been invented.
    const wrong = [];
    for (const [c, holder] of Object.entries(SHARED)) {
      if (!others.has(c)) { wrong.push(`${c} is recorded as shared but reads FREE`); continue; }
      if (![...others.get(c)].some((id) => id.startsWith(`${holder}-`))) wrong.push(`${c} is recorded as held by ${holder} and is not`);
    }
    expect(wrong, wrong.join('\n')).toEqual([]);
  });

  it('THE OTHER WITNESS carries the reading whole: Isaiah 36:6 says what 2 Kings 18:21 says', () => {
    // The reading was NOT dropped; its citation moved to the Word's second
    // witness, because the first turned a neighbour's gate red in a file this
    // build may not touch and DR-1317 reserves that machinery to the Governor.
    // Both halves are asserted, so the move cannot be a quiet loss.
    const a = verseText('2 Kings 18:21');
    const b = verseText('Isaiah 36:6');
    const shared = 'if a man lean, it will go into his hand, and pierce it';
    expect(a, '2 Kings 18:21 does not carry the shared clause').toContain(shared);
    expect(b, 'Isaiah 36:6 does not carry the shared clause').toContain(shared);
    expect(a).toContain('so is Pharaoh king of Egypt');
    expect(b).toContain('so is Pharaoh king of Egypt');
    // And the witness taken here is free, which is why it was available.
    const others = [...SOVEREIGN_AI_MODULES, ...MODULES, ...AI_LEGAL_BLUEPRINT_MODULES].filter((m) => m.id !== ID);
    expect(others.some((m) => anchorRefs(m).some((r) => chapterKey(r) === 'Isaiah 36'))).toBe(false);
    // And the chapter it vacated really is held by the neighbour whose gate
    // refused it, so the reason recorded above is a measurement.
    expect(others.some((m) => m.id.startsWith('sov65-') && anchorRefs(m).some((r) => chapterKey(r) === '2 Kings 18'))).toBe(true);
    // The 2 Kings wording is absent from every string, so no reader meets a
    // quotation this lesson no longer stands on.
    expect(allStrings().join('\n')).not.toContain('bruised reed');
    expect(SPINE).toContain('Isaiah 36:6');
    expect(SPINE).not.toContain('2 Kings 18:21');
  });

  it('THE PROSE CENSUS IS A MEASUREMENT AND NOT A VETO: the shared readings are KEPT and taught here', () => {
    // sov63 threw away a complete finished lesson to a census like this one
    // (DR-1310), and DR-1317 removed the rule that told it to. So the four
    // readings a spent-verse rule would have deleted from this lesson are
    // asserted PRESENT, and each is asserted to really exist elsewhere, so the
    // overlap is machine-readable rather than a claim in prose.
    const others = SOVEREIGN_AI_MODULES.filter((m) => m.id !== ID);
    const kept = {
      'Luke 11:22': 'sov44', // the strong man, in the course already
      'Proverbs 22:3': 'sov44', // the prudent man foreseeth
      'Nehemiah 4:6': 'sov47', // a mind to work
      'James 1:22': 'sov16', // doers of the word
    };
    for (const [ref, holder] of Object.entries(kept)) {
      expect(SPINE, `${ref} was dropped for a collision, which DR-1317 forbids`).toContain(ref);
      expect(M.lesson, `${ref} is listed but not quoted`).toContain(SPINE_FRAGMENTS[ref]);
      const carriers = others.filter((m) => JSON.stringify(m).includes(ref)).map((m) => m.id);
      expect(carriers.length, `${ref} is recorded as shared and nothing else carries it`).toBeGreaterThan(0);
      expect(carriers.some((id) => id.startsWith(`${holder}-`)), `${ref} is recorded as carried by ${holder} and is not`).toBe(true);
    }
  });

  it('THE LANDING COMPARISON: the three nearest lessons exist and land ELSEWHERE, asserted on their own text', () => {
    // DR-0610 as Darrell re-stated it on 2026-11-05: one teaching is decided by
    // WHERE A LESSON LANDS, never by the Scripture it stands on. So each
    // neighbour is asserted to carry its OWN landing marker, and this lesson is
    // asserted to carry none of them.
    const by = (p) => SOVEREIGN_AI_MODULES.find((m) => m.id.startsWith(p));
    const sov44 = by('sov44-');
    const sov47 = by('sov47-');
    const sov15 = by('sov15-');
    for (const [name, m] of [['sov44', sov44], ['sov47', sov47], ['sov15', sov15]]) {
      expect(m, `${name} is cited as a neighbour and does not exist`).toBeTruthy();
    }
    // sov44 lands on the pit returning on the digger and on testing what arrives.
    expect(JSON.stringify(sov44)).toContain('He that diggeth a pit shall fall into it');
    expect(sov44.inApp).toContain('never a master to be obeyed');
    // sov47 lands on naming the distress first and on a truer alarm.
    expect(sov47.inApp).toContain('QUIETER or TRUER');
    expect(JSON.stringify(sov47)).toContain('Nehemiah');
    // sov15 lands on cross-examining whoever profits from the warning.
    expect(sov15.inApp).toContain('not selling the cure');
    // AND THIS LESSON LANDS SOMEWHERE ELSE. None of their landing markers is
    // anywhere in it, and its own landing is in all five reader places.
    const mineText = allStrings().join('\n');
    for (const foreign of ['diggeth a pit', 'never a master to be obeyed', 'QUIETER or TRUER', 'not selling the cure', 'neither slumbers']) {
      expect(mineText.includes(foreign), `this lesson carries ${foreign}, which is a neighbour's landing`).toBe(false);
    }
  });

  it('the clash with the four Real Estate courses that pin EXACT sets is MEASURED, not resolved by deletion', () => {
    // A catalog course keeps its lessons behind `buildScheduleRows()`, a
    // FUNCTION, so JSON.stringify of the course object reads almost nothing —
    // the fault sov64 found and corrected. Call the function.
    const versesCited = (c) => {
      const out = new Set();
      const text = JSON.stringify(typeof c.buildScheduleRows === 'function' ? c.buildScheduleRows() : c);
      for (const r of text.match(/\b(?:[1-3] )?[A-Z][a-z]+(?: of [A-Z][a-z]+)? \d+:\d+/g) || []) out.add(r);
      return out;
    };
    for (const key of ['appraisal', 'evictions', 'inspections', 'insurance-risk']) {
      const c = LEARN_CATALOG.find((x) => x.key === key);
      expect(c, `${key} course is missing`).toBeTruthy();
      expect(versesCited(c).size, `${key} cites no verses`).toBeGreaterThan(25);
    }
    const mine = new Set(SPINE);
    const clash = [];
    for (const key of ['appraisal', 'evictions', 'inspections', 'insurance-risk']) {
      const theirs = versesCited(LEARN_CATALOG.find((x) => x.key === key));
      for (const v of mine) if (theirs.has(v)) clash.push(`${v} <- ${key}`);
    }
    // TWO CLASHES, RECORDED RATHER THAN RESOLVED BY DELETION. A clash here is
    // NOT a reason to drop a verse (DR-1317); it is a reason to RUN that
    // course's own test, because those four pin EXACT shared-verse sets and a
    // new verse elsewhere has reddened them before (PR #2528). Both were run on
    // this tree and both PASS, because the insurance course's pin is scoped to
    // the Real Estate department and this lesson is not in it. The set is
    // pinned exactly, so a THIRD clash appearing later is a finding rather than
    // a silent pass.
    expect(clash.slice().sort(), 'the recorded clash with a pinning course has changed')
      .toEqual(['Exodus 21:29 <- insurance-risk', 'Proverbs 22:3 <- insurance-risk']);
    // And the record is not invented: that course really cites both verses.
    const ins = versesCited(LEARN_CATALOG.find((x) => x.key === 'insurance-risk'));
    expect(ins.has('Exodus 21:29')).toBe(true);
    expect(ins.has('Proverbs 22:3')).toBe(true);
    // Both are KEPT here, quoted, and load-bearing.
    expect(M.lesson).toContain(SPINE_FRAGMENTS['Exodus 21:29']);
    expect(M.lesson).toContain(SPINE_FRAGMENTS['Proverbs 22:3']);
  });
});

describe('sov66 — every lesson stands alone and whole (DR-1317)', () => {
  const POINTERS = [
    /this course teaches/i, /the course teaches/i, /another lesson/i, /taught elsewhere/i,
    /elsewhere in this (course|catalog)/i, /neighbou?ring (lesson|teaching)/i,
    /\bll\d{2,3}\b/, /\bsov\d{1,2}\b/, /already taught in this/i,
  ];

  it('AND NO READER TEXT POINTS AT ANOTHER LESSON', () => {
    const watched = { ...PLACES(), bigIdea: M.bigIdea, 'anchor.theme': M.anchor.theme };
    const faults = [];
    for (const [k, v] of Object.entries(watched)) {
      for (const re of POINTERS) if (re.test(v)) faults.push(`${k}: ${re}`);
    }
    expect(faults, `a reader text points at another lesson:\n${faults.join('\n')}`).toEqual([]);
  });

  it('PROVEN TO CATCH: a cross-reference planted in the child band alone is found, and only that band', () => {
    const bent = { ...M, levels: { ...M.levels, child: `${M.levels.child}\n\nThis course teaches that already in sov44.` } };
    const watched = { adult: bent.lesson, child: bent.levels.child, youth: bent.levels.youth, teen: bent.levels.teen, senior: bent.levels.senior };
    const named = [];
    for (const [k, v] of Object.entries(watched)) if (POINTERS.some((re) => re.test(v))) named.push(k);
    expect(named).toEqual(['child']);
  });

  it('TEACHES ITS OWN FOUNDATION IN FULL, in every band, by the literal text of each movement', () => {
    // The thing that stops a foundation being thinned back down to a citation:
    // each movement must be TAUGHT where the reader meets it, not pointed at.
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not quote the plumb line`).toContain('as an high wall in his own conceit');
      expect(v, `${k} does not quote the invader's shopping list`).toContain('having neither bars nor gates');
      expect(v, `${k} does not quote the scouting report`).toContain('how they dwelt careless, after the manner of the Zidonians, quiet and secure');
      expect(v, `${k} does not quote the cause of death`).toContain('And there was no deliverer, because it was far from Zidon');
      expect(v, `${k} does not quote the secure host`).toContain('for the host was secure');
      expect(v, `${k} does not quote the strong man`).toContain('When a strong man armed keepeth his palace');
      expect(v, `${k} does not quote the stronger man`).toContain('all his armour wherein he trusted');
      expect(v, `${k} does not quote the ox statute`).toContain('it hath been testified to his owner, and he hath not kept him in');
      expect(v, `${k} does not quote the roof rail`).toContain('then thou shalt make a battlement for thy roof');
      expect(v, `${k} does not quote the verdict on the work`).toContain('but ye have not looked unto the maker thereof');
      expect(v, `${k} does not quote the broken reed`).toContain('it will go into his hand, and pierce it');
      expect(v, `${k} does not quote the hearer`).toContain('not hearers only, deceiving your own selves');
      expect(v, `${k} does not quote the doer`).toContain('this man shall be blessed in his deed');
      expect(v, `${k} does not quote the shape of the repair`).toContain('every one over against his house');
      expect(v, `${k} does not quote the tower`).toContain('The name of the LORD is a strong tower');
      expect(v, `${k} does not quote the appointed walls`).toContain('salvation will God appoint for walls and bulwarks');
    }
  });
});

describe('sov66 — all four bands, measured and not claimed', () => {
  it('the four-band ladder is clean', () => {
    expect(fourBandFaults(M), JSON.stringify(fourBandFaults(M))).toEqual([]);
    expect(shortBands(measureFullness(M))).toEqual([]);
    expect(unnamedBands(M)).toEqual([]);
  });

  it('the shares and the reading ladder are the measured numbers, not round ones', () => {
    // Measured: adult 2907 words of our prose; shares child 0.56, youth 0.79,
    // teen 0.77, senior 0.94; grades -0.15 / 3.68 / 4.15 / 8.91 against adult 6.5.
    const adult = words(M.lesson);
    const share = Object.fromEntries(FOUR_BANDS.map((b) => [b, words(M.levels[b]) / adult]));
    expect(share.child).toBeGreaterThan(LADDER.floor.child);
    expect(share.youth).toBeGreaterThan(LADDER.floor.youth);
    expect(share.teen).toBeGreaterThan(LADDER.floor.teen);
    expect(share.senior).toBeGreaterThan(LADDER.floor.senior);
    const g = Object.fromEntries(FOUR_BANDS.map((b) => [b, fk(M.levels[b])]));
    expect(g.child).toBeLessThan(g.youth);
    expect(g.youth).toBeLessThan(g.teen);
    expect(g.teen).toBeLessThan(g.senior);
    expect(g.child).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(g.teen).toBeLessThanOrEqual(LADDER.teenCeiling);
    expect(g.senior).toBeLessThanOrEqual(LADDER.seniorCeiling);
  });

  it('five independent compositions, not one re-registered five times', () => {
    // Measured worst pair 0.164 (adult~youth) against the 0.25 near-copy line.
    // NOTE for the next builder: DIFF_CEILING in band-differentiation.mjs is 0.5
    // while the ladder this gate enforces is 0.25, and a builder reading only
    // the first number will ship a near copy that fourBandFaults refuses.
    const ks = ['adult', ...FOUR_BANDS];
    const p = PLACES();
    const over = [];
    for (let i = 0; i < ks.length; i += 1) for (let j = i + 1; j < ks.length; j += 1) {
      const o = overlapOf(p[ks[i]], p[ks[j]]);
      if (o > LADDER.nearCopy) over.push(`${ks[i]}~${ks[j]} ${o.toFixed(2)}`);
    }
    expect(over, over.join(', ')).toEqual([]);
  });

  it('PROVEN TO CATCH: a band replaced by a reworded sibling fails the near-copy line', () => {
    const bent = { ...M, levels: { ...M.levels, youth: M.levels.teen.replace(/\bthe\b/g, 'that') } };
    expect(fourBandFaults(bent).join(' ')).toMatch(/near copy/);
  });

  it('TALK ABOUT IT TOGETHER carries all three directions on the lesson AND on EVERY band', () => {
    expect(hasAllThree(M)).toBe(true);
    expect(placesMissingDirections(M)).toEqual([]);
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} has no TALK ABOUT IT TOGETHER`).toContain('TALK ABOUT IT TOGETHER');
      expect(v.toLowerCase(), `${k} does not name listening to the end`).toMatch(/listen all the way to the end|listen to the end|listen all the way/);
      expect(v.toLowerCase(), `${k} does not name the retell`).toMatch(/say it back|retell/);
      expect(v, `${k} does not name Deuteronomy 6:7’s four places`).toMatch(/Deuteronomy 6:7/);
      expect(v.toLowerCase(), `${k} does not name one friend this week`).toMatch(/one friend/);
      expect(v, `${k} does not quote the four places`).toContain('when thou sittest in thine house, and when thou walkest by the way');
      expect(v, `${k} does not name the aim`).toContain('until we see that Yahweh has been right');
    }
  });

  it('PROVEN TO CATCH: stripping ONE band’s friend line alone names that band while the pooled check stays green', () => {
    // The DR-0795 shape: a reader reads ONE band, so the per-band check is the
    // one that matters and the pooled check cannot be trusted alone.
    const stripped = M.levels.senior.replace(/Then one friend this week:[^.]*\./, '');
    expect(stripped, 'the senior friend line was not found').not.toBe(M.levels.senior);
    const bent = { ...M, levels: { ...M.levels, senior: stripped } };
    expect(placesMissingDirections(bent)).toEqual([{ place: 'senior', missing: ['friends'] }]);
    expect(hasAllThree(bent), 'the pooled check should still read green, which is why the per-band check exists').toBe(true);
  });

  it('growth is measured the Word’s way in every place: the fruit, and the count of days', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} has no qualitative measure`).toContain('the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith');
      expect(v, `${k} has no quantitative measure`).toContain('But exhort one another daily, while it is called To day');
      // A MATCHER TOO NARROW, WIDENED TO THE SHARED CORE rather than hollowed
      // out: four places write `not by a score`, the senior band writes
      // `IT IS NOT MEASURED BY A SCORE`. One teaching, five registers.
      expect(v.toLowerCase(), `${k} does not refuse an imported measure`).toMatch(/not by a score|by no score|not measured by a score|not by a chart|no chart/);
    }
  });

  it('twelve numbered movements, contiguous from ONE, in every one of the five reader places', () => {
    const NUM = ['ONE.', 'TWO.', 'THREE.', 'FOUR.', 'FIVE.', 'SIX.', 'SEVEN.', 'EIGHT.', 'NINE.', 'TEN.', 'ELEVEN.', 'TWELVE.'];
    for (const [k, v] of Object.entries(PLACES())) {
      const missing = NUM.filter((n) => !v.includes(n));
      expect(missing, `${k} is missing movements: ${missing.join(' ')}`).toEqual([]);
    }
  });

  it('our prose is American, the KJV’s own spellings are untouched, and no hard term arrives unglossed', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(findBritish(ourProseOnly(v)), `${k}`).toEqual([]);
      expect(termFaults(v), `${k}`).toEqual([]);
    }
    // EVERY string, not the reader places only: `armour` and `rampart` are the
    // corpus's own and live inside quotations; our voice says armor nowhere
    // because it says weapons and gear instead.
    expect(findBritish(allStrings().map(ourProseOnly).join('\n')), 'a British spelling in our own voice').toEqual([]);
    expect(M.lesson).toContain('whose rampart was the sea');
    expect(M.lesson).toContain('all his armour wherein he trusted');
  });

  it('two declared parables and no testimony, and the Word is quoted WITH its reference inside the lesson', () => {
    expect(storyCount(M)).toBe(2);
    expect(M.stories.every((s) => s.kind === 'parable')).toBe(true);
    // DR-0811: a parable is not a testimony, and each says so in its own body.
    for (const s of M.stories) expect(s.body, s.title).toMatch(/This is a parable and not a report of anything that happened\./);
    // DR-0402: the verse is readable without leaving the lesson.
    expect(quotesTheWord(M)).toBe(true);
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} never puts a reference beside a quotation`).toMatch(/" \(Judges 18:28\)|" \(Luke 11:22\)/);
    }
  });
});

describe('sov66 — the provenance is honest in every reader place', () => {
  it('names what arrived and carries his own word above the header', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v.toLowerCase(), `${k} does not say what arrived`).toMatch(/news ?letter/);
      expect(v.toLowerCase(), `${k} does not name the university mailbox`).toMatch(/university mailbox|school mailbox/);
      expect(v, `${k} does not carry his own word`).toContain('Lesson');
      expect(v, `${k} does not name the forwarded header`).toMatch(/forwarded header/);
    }
    // WHO TAUGHT (DR-0719): the source is a forwarded newsletter and not a
    // recording, so NO teacher is identified — and the gate says so rather than
    // letting a later edit imply one.
    const text = allStrings().join('\n');
    expect(/\bthe teacher\b/i.test(text), 'the lesson says the teacher, which assumes who taught').toBe(false);
    expect(/Bishop Gwin|\bBG\b/.test(text), 'a teacher is named for a source that names none').toBe(false);
    expect(M.quiz.questions.some((q) => /No teacher is identified/.test(q.explain)), 'the exam does not state that no teacher is identified').toBe(true);
  });

  it('quotes BOTH refused roads EXACTLY rather than describing them, in every reader place (DR-0108)', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not quote the proxy refusal`).toContain('curl: (56) CONNECT tunnel failed, response 403');
      expect(v, `${k} does not quote the second road`).toContain('getaddrinfo ENOTFOUND isc.sans.edu');
      expect(v.toLowerCase(), `${k} does not say the third road worked`).toMatch(/third (road|route|way)/);
    }
    // The index host appears ONLY inside the quoted refusal, which is evidence
    // of a road we walked rather than a citation of a source we read.
    const text = allStrings().join('\n');
    expect(text.split('isc.sans.edu').length - 1, 'the evidence of the refused road has been deleted').toBeGreaterThan(0);
    for (const s of allStrings()) {
      if (!s.includes('isc.sans.edu')) continue;
      expect(s, 'isc.sans.edu appears outside the quoted refusal').toContain('getaddrinfo ENOTFOUND isc.sans.edu');
    }
  });

  it('DR-0100’s THREE TIERS are held apart in all five reader places', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      // Tier one: documented, stated plainly, never softened.
      expect(v, `${k} does not name the documented tier`).toMatch(/DOCUMENTED/);
      // Tier two: the narrow open question, named narrowly.
      expect(v, `${k} does not hold the share figure open`).toMatch(/UNCHECK/);
      expect(v.toLowerCase(), `${k} does not name the share as the open question`).toMatch(/share of the world|world's (web )?sites|world's sites/);
      // Tier three: unchecked, listed item by item.
      expect(v.toLowerCase(), `${k} does not list the unchecked items`).toMatch(/one by one|item by item|each time|enumerated/);
    }
    // AND THE HEDGE IS REFUSED, not used. `some people say` appears in all five
    // places and EVERY occurrence sits inside a refusal of it.
    for (const [k, v] of Object.entries(PLACES())) {
      const n = v.split('some people say').length - 1;
      expect(n, `${k} does not refuse the hedge`).toBeGreaterThan(0);
      for (const sentence of v.split(/(?<=[.!?])\s+/)) {
        if (!sentence.includes('some people say')) continue;
        expect(sentence.toLowerCase(), `${k} uses the hedge instead of refusing it: ${sentence.slice(0, 90)}`)
          .toMatch(/we do not say|we never|refuse|rather than|instead of|without softening|not softened|never shrink|hiding behind|diluted into/);
      }
    }
  });

  it('names NO publisher, maker, vendor, platform, nation or person the issue names', () => {
    const text = allStrings().join('\n');
    for (const n of ['Morning Brew', 'PHP', 'WordPress', 'Wikipedia', 'BBC', 'Finland', 'Netherlands', 'Luttwak', 'Wiz', 'Google', 'Musk', 'Tesla', 'SpaceX', 'Meta', 'Zuckerberg', 'Airbnb', 'Brewers', 'Netflix', 'eBay', 'Getty', 'Shutterstock', 'Koch', 'Russia', 'Putin', 'Witkoff', 'Trump', 'Hersheypark', 'Skybound', 'Cloudflare', 'Tenable', 'WNBA', 'Glee', 'Schlesinger', 'Cambridge Analytica', 'Hubbard', 'Kalshi', 'Barclays', 'Bloomberg', 'Milwaukee', 'Copenhagen', 'Hulu', 'Disney', 'Invincible', 'Turturro', 'micro1', 'Sony']) {
      expect(new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text), `${n} is named in the module`).toBe(false);
    }
    // PROVEN TO CATCH, twice: a planted vendor name is found, and the scoping
    // of the quoted refusal does not hide one.
    const planted = `${text}\nThe maintainers of PHP shipped the fix.`;
    expect(/\bPHP\b/.test(planted)).toBe(true);
    const plantedInError = `${text}\ngetaddrinfo ENOTFOUND wordpress.com`;
    expect(/\bWordPress\b/i.test(plantedInError)).toBe(true);
  });

  it('stakes NOT ONE figure from the issue, in any reader place', () => {
    // The issue carried four market closes, two share prices, a severity score,
    // a line count, a share percentage, a merger valuation, a penalty in
    // billions, a layoff percentage, a viewership count and a ticket price.
    // NONE is reproduced where a reader meets it. Scripture references, the two
    // ISO dates and the quoted error code are scrubbed first, because a pin that
    // fires on `Judges 18:28` is a pin the next builder will hollow out.
    const BOOKS_RE = /\b(?:[1-3] )?(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Proverbs|Ecclesiastes|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Hebrews|James|Peter|Jude|Revelation) \d+(?::\d+(?:-\d+)?)?/g;
    const scrub = (s) => ourProseOnly(s)
      .replace(BOOKS_RE, ' ')
      .replace(/\b20\d\d-\d\d-\d\d\b/g, ' ')
      .replace(/curl: \(56\) CONNECT tunnel failed, response 403/g, ' ');
    // A PIN THAT COULD NOT FIRE, CORRECTED BEFORE IT SHIPPED. The first
    // version ended the percent branch with `\b`, and `%` is not a word
    // character, so `70% of the world` never matched -- a pin that reads green
    // on the exact leak it exists to catch. The proven-to-catch block below is
    // what found it, which is the whole reason DR-0076 Section 3 requires one.
    const FIGURE = /\$\s?\d|\d+(?:[.,]\d+)?\s?(?:%|percent\b|billion\b|million\b|trillion\b|lines\b|points\b)|\d+(?:[.,]\d+)?\s?out of\s?\d+|\b\d{1,3}(?:,\d{3})+\b|\b\d+\.\d+\b/;
    for (const [k, v] of Object.entries(PLACES())) {
      const scrubbed = scrub(v);
      expect(FIGURE.test(scrubbed), `a figure from the issue leaked into ${k}: ${(scrubbed.match(FIGURE) || [])[0]}`).toBe(false);
    }
    // PROVEN TO CATCH: every shape a leak would take really does fire.
    for (const planted of ['the market closed at 26,702.86', 'a $25 billion penalty', 'it powers 70% of the world', 'they wrote 10,000 lines', 'graded 9.2 out of 10', 'laying off 9 percent']) {
      expect(FIGURE.test(scrub(planted)), `a planted leak was not caught: ${planted}`).toBe(true);
    }
    // And the scrubbing really is narrow: a Scripture reference and the ISO date
    // survive it invisibly, which is the half that stops the pin being loosened.
    for (const safe of ['Judges 18:28 and Luke 11:22', 'on 2026-10-22 he forwarded it', 'curl: (56) CONNECT tunnel failed, response 403']) {
      expect(FIGURE.test(scrub(safe)), `the scrub is too narrow and fires on: ${safe}`).toBe(false);
    }
  });

  it('says the advertisements were set aside, which is the standing rule in this house', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v.toLowerCase(), `${k} does not set the advertisements aside`).toMatch(/advertisement|ads|ad slots|paid (placement|item)/);
      expect(v.toLowerCase(), `${k} does not say they were set aside`).toMatch(/set (?:it |them |the ads |these )?aside|skip(?:ped)? (?:the )?ads/);
    }
  });
});

describe('sov66 — the teaching itself is pinned, in every place a reader meets it', () => {
  const uniqueCarrier = (slice, place) => {
    const hits = Object.entries(PLACES()).filter(([, v]) => v.includes(slice)).map(([k]) => k);
    expect(hits, `slice is not unique to ${place}: ${hits.join(', ')}`).toEqual([place]);
  };

  it('THE LAW is in all five: the height of the wall is in the owner’s own estimate', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not quote the plumb line`).toContain('as an high wall in his own conceit');
      expect(v.toLowerCase(), `${k} does not state the law in its own words`).toMatch(/his own conceit, which (is|means)|his own head|his own opinion|his own estimate|his own estimation/);
      expect(v.toLowerCase(), `${k} does not say the man is neither idle nor poor`).toMatch(/not lazy|not idle|neither idle|he works and he pays|he has done the work|he worked\./);
    }
  });

  it('THE HINGE is in all five: NOTHING changed about the strong man', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not quote the strong man at peace`).toContain('his goods are in peace');
      expect(v, `${k} does not quote the armour`).toContain('all his armour wherein he trusted');
      expect(v.toLowerCase(), `${k} does not say the defense was rated against a weaker man`).toMatch(/only ever rated against a weaker man|only good enough for a smaller man/);
      expect(v.toLowerCase(), `${k} does not say the rating was never written down`).toMatch(/never (written|recorded)( down)? anywhere|no one ever told him|nobody wrote that rating/);
    }
  });

  it('THE RANKING DESCRIBED THE ATTACKER, in all five, and that is the whole lesson', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not locate the ranking on the attacker`).toMatch(/ATTACKER/);
      // WIDENED FOR ONE BAND'S PHRASING, same teaching: the youth band writes
      // `you do not get to hold still` where the others write `not yours to
      // hold still`.
      expect(v.toLowerCase(), `${k} does not say the attacker is the variable we do not hold`).toMatch(/not (yours|ours) to hold (still|stationary|steady)|do not get to hold still|one piece here that is not yours|the one variable/);
    }
  });

  it('LAISH is in all five, with the two facts named as BOTH the safety and the ruin', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not carry the scouting report`).toContain('and they were far from the Zidonians, and had no business with any man');
      expect(v, `${k} does not carry the cause of death`).toContain('And there was no deliverer, because it was far from Zidon');
      expect(v, `${k} does not lift the identity of the two sentences`).toContain('THEIR DEFENSE AND THEIR DOOM WERE THE SAME SENTENCE');
      expect(v.toLowerCase(), `${k} does not say not one of the four is a wall`).toMatch(/not one of (them|those four) is a wall|none of them is a wall|not a single one of them is a wall|not one is a wall/);
    }
  });

  it('THE DUTY is in all five: known, testified, not kept in — and a rail before anybody falls', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      // TWO MATCHERS WIDENED FOR THE CHILD REGISTER, not hollowed out: four
      // places lift KNOWN and TESTIFIED; the child band lifts `They KNEW` and
      // `Some one TOLD the owner`. The teaching has to be lifted in every band;
      // the exact Latin of the statute does not.
      expect(v, `${k} does not carry the three elements`).toMatch(/\bKNOWN\b|\bKNEW\b/);
      expect(v, `${k} does not carry the testimony`).toMatch(/\bTESTIFIED\b|\bTOLD\b/);
      expect(v, `${k} does not carry the omission`).toContain('HATH NOT KEPT HIM IN');
      expect(v.toLowerCase(), `${k} does not say the statute asks about notice rather than odds`).toMatch(/asks whether he was told|it asks whether he got notice|inquires whether notice reached him|never asks what odds|does not ask whether he thought|never inquires (what probability|about his estimate)/);
      expect(v.toLowerCase(), `${k} does not say the rail is owed to a stranger`).toMatch(/has not (yet )?(come|climbed)( up)? the stairs|not yet ascended the stairs/);
    }
  });

  it('THE HARD PASSAGE is in all five: competent work that never looked at the Maker', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not carry the breach survey`).toContain('Ye have seen also the breaches of the city of David');
      expect(v, `${k} does not carry the verdict`).toContain('but ye have not looked unto the maker thereof');
      expect(v.toLowerCase(), `${k} does not say the work itself was real`).toMatch(/worked (hard|very hard)|a great deal|did a lot|labored|exerted themselves/);
    }
  });

  it('THE SHARED FOUNDATION is in all five, as a staff that goes INTO the hand', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not carry the broken reed`).toContain('thou trustest in the staff of this broken reed');
      expect(v.toLowerCase(), `${k} does not say it enters the hand rather than merely failing`).toMatch(/goes in(to)? (the|your) hand|enters the hand|it goes in your hand/);
    }
  });

  it('THE PRACTICAL HINGE is in all five: published is not applied, and the hand is your own', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not carry the hearer`).toContain('deceiving your own selves');
      expect(v, `${k} does not carry the glass`).toContain('beholding his natural face in a glass');
      expect(v, `${k} does not carry the doer`).toContain('blessed in his deed');
      expect(v, `${k} does not carry the shape of the repair`).toContain('every one over against his house');
      expect(v, `${k} does not carry the mind to work`).toContain('for the people had a mind to work');
      expect(v.toLowerCase(), `${k} does not say a remedy only read is a face in a glass`).toMatch(/only read is a (face|man) in a glass|merely read is a face|a fix you only read|a cure only read/);
    }
  });

  it('THE CLOSE is in all five: a tower no opinion sets, walls Yahweh appoints, and a breach He closed Himself', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not carry the tower`).toContain('The name of the LORD is a strong tower');
      expect(v, `${k} does not carry the ranking`).toContain('Some trust in chariots, and some in horses');
      expect(v.toLowerCase(), `${k} does not say chariots are ranked rather than condemned`).toMatch(/ranked|a rank|in order|no blame|no condemnation/);
      expect(v, `${k} does not carry the appointed walls`).toContain('salvation will God appoint for walls and bulwarks');
      expect(v, `${k} does not carry the kept mind`).toContain('whose mind is stayed on thee');
      expect(v, `${k} does not carry the foundation that consists`).toContain('by him all things consist');
      expect(v.toLowerCase(), `${k} does not say He came rather than publishing a remedy`).toMatch(/did not (publish|post|mail)|published no (patch|correction|remedy)|posted no patch|came down the road|walked the road|traveled the road/);
      expect(v.toLowerCase(), `${k} does not say He did it in His own body`).toMatch(/(?:in|inside|within) his own body/);
    }
  });

  it('THE THREE DATED ACTIONS are in all five, and each is dated and checkable', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      const u = v.toUpperCase();
      expect(u, `${k} is missing the repricing action`).toMatch(/NAME WHAT (ACTUALLY )?HOLDS IT/);
      expect(u, `${k} is missing the repair action`).toMatch(/DO ONE REPAIR WITH YOUR OWN HAND|FIX ONE THING WITH YOUR OWN HANDS/);
      expect(u, `${k} is missing the go-and-ask action`).toMatch(/GO ASK THE ONE WHO WOULD PAY FOR IT|GO ASK ONE PERSON/);
      expect(v.toLowerCase(), `${k} does not ask for a date`).toMatch(/date all three|put a date|write the day|enter the date|record his answer (together with|with) the date|write what they say/);
      expect(v.toLowerCase(), `${k} does not name the honest clause`).toMatch(/one honest clause|in one honest clause/);
      expect(v.toLowerCase(), `${k} does not name the unpriced grade`).toMatch(/not yet measured/);
      expect(v, `${k} does not lift UNPRICED`).toMatch(/UNPRICED/);
    }
  });

  it('PROVEN TO CATCH: each load-bearing line, broken at EVERY site it occurs, fires the guard that holds it', () => {
    // Each row names THE GUARD THAT HOLDS IT, because one generic catch-all
    // across heterogeneous breaks reports a real pass as a gap and a real gap
    // as a pass -- the fault sov64 found and rewrote (DR-1311). Every guard is
    // asserted to hold on the SHIPPED lesson first, so a guard that is always
    // false cannot read as a catch, and the site count is asserted greater than
    // zero so the DR-1303 no-sites failure cannot happen silently.
    const c = corpus();
    const everyPlace = (re) => (p) => Object.values(p).every((v) => re.test(v));
    const quotesAreVerbatim = (p) => Object.values(p).every((v) => (v.match(/"[^"]+"/g) || []).every((r) => c.includes(r.slice(1, -1).trim())));
    const rows = [
      // Held by the corpus sweep: these are quotations.
      ['And there was no deliverer, because it was far from Zidon', 'And there was no rescuer, because it was far from Zidon', quotesAreVerbatim, 'the verbatim sweep'],
      ['all his armour wherein he trusted', 'all his armour, wherein he trusted', quotesAreVerbatim, 'the verbatim sweep (the comma memory inserts)'],
      ['as an high wall in his own conceit', 'as a high wall in his own conceit', quotesAreVerbatim, 'the verbatim sweep'],
      ['for the host was secure', 'for the host was at ease', quotesAreVerbatim, 'the verbatim sweep'],
      ['it hath been testified to his owner, and he hath not kept him in', 'it hath been testified to his owner, and he kept him not in', quotesAreVerbatim, 'the verbatim sweep'],
      ['but ye have not looked unto the maker thereof', 'but ye have not looked unto the Maker thereof', quotesAreVerbatim, 'the verbatim sweep'],
      ['it will go into his hand, and pierce it', 'it will go into his hand and pierce it', quotesAreVerbatim, 'the verbatim sweep'],
      ['not hearers only, deceiving your own selves', 'not hearers only, deceiving yourselves', quotesAreVerbatim, 'the verbatim sweep'],
      ['every one over against his house', 'every one over against his own house', quotesAreVerbatim, 'the verbatim sweep'],
      ['salvation will God appoint for walls and bulwarks', 'salvation will God appoint for walls and towers', quotesAreVerbatim, 'the verbatim sweep'],
      ['The rich man’s wealth', 'The rich man\'s wealth', quotesAreVerbatim, 'the verbatim sweep (the corpus apostrophe)'],
      // Held by their own per-place assertions: these are OUR prose, our lifted
      // emphasis and our provenance, and breaking them breaks no quotation.
      ['THEIR DEFENSE AND THEIR DOOM WERE THE SAME SENTENCE', 'their safety was also their ruin', everyPlace(/THEIR DEFENSE AND THEIR DOOM WERE THE SAME SENTENCE/), 'the Laish pin'],
      ['ATTACKER', 'intruder', everyPlace(/ATTACKER/), 'the ranking-describes-the-attacker pin'],
      ['UNPRICED', 'not priced', everyPlace(/UNPRICED/), 'the repricing pin'],
      ['not yet measured', 'not measured yet', everyPlace(/not yet measured/), 'the honest-grade pin'],
      ['DOCUMENTED', 'confirmed', everyPlace(/DOCUMENTED/), 'DR-0100 tier one'],
      ['UNCHECK', 'UNSURE', everyPlace(/UNCHECK/), 'DR-0100 tier three'],
      ['curl: (56) CONNECT tunnel failed, response 403', 'the request was refused', everyPlace(/curl: \(56\) CONNECT tunnel failed, response 403/), 'the quoted-refusal pin (DR-0108)'],
      ['getaddrinfo ENOTFOUND isc.sans.edu', 'the second road also failed', everyPlace(/getaddrinfo ENOTFOUND isc\.sans\.edu/), 'the second-road refusal pin (DR-0108)'],
      ['Lamb of Yahweh', 'Lamb', everyPlace(/Lamb of Yahweh/), 'the DR-0210 confession'],
      ['Eternal Son of Yahweh', 'Son', everyPlace(/Eternal Son of Yahweh/), 'the DR-0210 confession'],
      ['Deuteronomy 6:7', 'the Word', everyPlace(/Deuteronomy 6:7/), 'the TALK ABOUT IT TOGETHER rhythm'],
      ['TALK ABOUT IT TOGETHER', 'ONE LAST THING', everyPlace(/TALK ABOUT IT TOGETHER/), 'the DR-0733 block'],
      ['HATH NOT KEPT HIM IN', 'did not keep him in', everyPlace(/HATH NOT KEPT HIM IN/), 'the ox-statute pin'],
    ];
    const p0 = PLACES();
    for (const [from, to, guard, name] of rows) {
      const sites = Object.values(p0).filter((v) => v.includes(from)).length;
      expect(sites, `break "${from.slice(0, 46)}" found NO SITES`).toBeGreaterThan(0);
      expect(guard(p0), `guard for "${name}" does not hold on the SHIPPED lesson`).toBe(true);
      const bent = Object.fromEntries(Object.entries(p0).map(([k, v]) => [k, v.split(from).join(to)]));
      expect(guard(bent), `break "${from.slice(0, 46)}" at all ${sites} site(s) was NOT caught by ${name}`).toBe(false);
    }
    // And the band measures are proven to catch a break of their own, since no
    // row above exercises them.
    const stripped = { ...M, levels: { ...M.levels, child: M.levels.child.slice(0, 400) } };
    expect(fourBandFaults(stripped).length, 'the band ladder catches a gutted child band').toBeGreaterThan(0);
  });

  it('the per-place slices used above are UNIQUE to their place, so no band can be reworded from a sibling', () => {
    uniqueCarrier('Safe is not always the same as strong.', 'child');
    uniqueCarrier('The title has four parts, and the fourth part is the only good news in it.', 'youth');
    uniqueCarrier('Your week has four pieces in its name', 'teen');
    uniqueCarrier("Teach this as the course's week on UNPRICED PROTECTION", 'senior');
    uniqueCarrier('This is the sixty-sixth week of Sovereign A.I.', 'adult');
  });
});

describe('sov66 — the date is derived, never typed', () => {
  it('lesson-dates records this lesson, derived from git and not from the working tree', () => {
    const d = lessonCreatedDay('sovereign-ai', ID);
    expect(d, `${ID} has no lesson-dates entry; run npm run lesson-dates`).toBeTruthy();
    expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(d).toBe('2026-11-05');
  });
});
