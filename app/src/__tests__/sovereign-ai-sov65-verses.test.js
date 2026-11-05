// =============================================================================
// sovereign-ai-sov65-verses — the gate for sov65, "I go, sir: and went not"
// =============================================================================
// WHAT THIS LESSON IS, AND WHAT IT DELIBERATELY IS NOT.
//
// Gmail thread `1a1353a7df7431d4`, one message, forwarded 2026-10-13 12:26:22
// UTC from dpoe@illinois.edu to darrellpoe06@gmail.com, subject
// `Fw: 😺 Meta's Muse Wonder is here, priced like Opus`. The teaching is judged
// by HIS word typed above the forwarded header, which is `Lessons`, never by
// whatever he happened to be reading. The forward is a DAILY TECHNOLOGY
// NEWSLETTER, not a study, and all five reader texts say so and count the four
// removes between this lesson and the events.
//
// NINE READINGS OF THAT ISSUE WERE ALREADY BUILT IN THIS COURSE AND ARE REFUSED
// ON DR-0610 GROUNDS, OUT LOUD, IN ALL FIVE READER TEXTS: the price read as the
// honesty of the scale (sov17, sov35, sov37, sov52 — and sov35 already taught
// OPEN weights beside the just weight, which is the very promise the issue says
// went unshipped); the seller's clock (sov59, which is this week's MIRROR —
// sov59 is DECIDE NOW, this week is WE WILL DELIVER LATER); what a tool costs to
// run and to own (sov2, sov38); the memory feature (sov20); the keep-going
// feature read as working around a wall (sov62); the agent that could not stop
// (sov41); the setting that trains on what you paste (sov46); and the pace a
// tireless machine sets for the people beside it (sov64, one week old in the
// same lane). What was genuinely unbuilt is THE PROMISE.
//
// THE PROSE-LEVEL CENSUS WAS RUN BEFORE A WORD WAS WRITTEN, which is the finding
// sov63 paid for with an entire finished draft (DR-1310) and sov64 applied in
// advance (DR-1311). It dropped exactly one planned reference: Numbers 23:19
// reads FREE at anchor level and is carried in the PROSE of sov16, sov18 and
// sov28, so it is absent here, and Joshua 21:45, Joshua 23:14, Genesis 21:1 and
// Jeremiah 1:12 carry that movement instead. Both halves are pinned below.
//
// ANCHOR CENSUS, measured with the function the gate reads (`anchorRefs`, that
// is `anchor.ref`), over the whole "A.I. The Way" department (sovereign-ai-class
// + church-classes + ai-legal-blueprint-class): 468 distinct anchor chapters
// across 78 lessons before this one. The 24 chapters this lesson stands on were
// measured FREE in BOTH directions. Measured SPENT and declined: Proverbs 11,
// Proverbs 16, Proverbs 20, Deuteronomy 25, Leviticus 19 and Micah 6 (the just
// weight, four times over), Isaiah 55 and 2 Kings 7 (sov59's own ground),
// Luke 14 (count the cost), Ecclesiastes 5 (the vow chapter a builder reaches
// for first — spent by sov37, sov41, sov53 and sov54), Proverbs 25 (clouds
// without rain), John 19 (It is finished — sov41), Matthew 5, Joshua 9,
// 1 Samuel 1, Habakkuk 2, Luke 12 and Hebrews 11.
//
// Every verse is read from the KJV corpus on disk, and SPINE_FRAGMENTS pins the
// exact span the lesson quotes for every one of the 40 references, asserted to
// be a substring of that verse and present in the adult lesson. Recorded as
// DR-1314.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES, SOVEREIGN_AI_META } from '../lib/sovereign-ai-class.js';
import { MODULES } from '../lib/church-classes.js';
import { AI_LEGAL_BLUEPRINT_MODULES } from '../lib/ai-legal-blueprint-class.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
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

const ID = 'sov65-i-go-sir-and-went-not';
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
  "Numbers 30:2": "If a man vow a vow unto the LORD, or swear an oath to bind his soul with a bond; he shall not break his word, he shall do according to all that proceedeth out of his mouth.",
  "Deuteronomy 23:21": "thou shalt not slack to pay it: for the LORD thy God will surely require it of thee; and it would be sin in thee",
  "Deuteronomy 23:22": "But if thou shalt forbear to vow, it shall be no sin in thee.",
  "Deuteronomy 23:23": "That which is gone out of thy lips thou shalt keep and perform",
  "Psalms 15:4": "He that sweareth to his own hurt, and changeth not.",
  "Matthew 21:28": "A certain man had two sons; and he came to the first, and said, Son, go work to day in my vineyard.",
  "Matthew 21:29": "I will not: but afterward he repented, and went",
  "Matthew 21:30": "I go, sir: and went not",
  "Genesis 29:18": "I will serve thee seven years for Rachel thy younger daughter",
  "Genesis 29:20": "And Jacob served seven years for Rachel; and they seemed unto him but a few days, for the love he had to her.",
  "Genesis 29:25": "wherefore then hast thou beguiled me?",
  "Genesis 29:27": "Fulfil her week, and we will give thee this also for the service which thou shalt serve with me yet seven other years.",
  "Genesis 31:7": "And your father hath deceived me, and changed my wages ten times",
  "Genesis 31:41": "Thus have I been twenty years in thy house",
  "Malachi 1:8": "offer it now unto thy governor; will he be pleased with thee, or accept thy person?",
  "Malachi 1:14": "cursed be the deceiver, which hath in his flock a male, and voweth, and sacrificeth unto the Lord a corrupt thing",
  "2 Kings 18:14": "I have offended; return from me: that which thou puttest on me will I bear",
  "2 Kings 18:15": "And Hezekiah gave him all the silver that was found in the house of the LORD",
  "2 Kings 18:17": "with a great host against Jerusalem",
  "1 Kings 10:6": "It was a true report that I heard in mine own land of thy acts and of thy wisdom.",
  "1 Kings 10:7": "Howbeit I believed not the words, until I came, and mine eyes had seen it: and, behold, the half was not told me",
  "2 Samuel 21:1": "Then there was a famine in the days of David three years, year after year",
  "2 Samuel 21:2": "the children of Israel had sworn unto them",
  "Judges 11:31": "whatsoever cometh forth of the doors of my house to meet me, when I return in peace from the children of Ammon, shall surely be the LORD’s",
  "Judges 11:35": "I have opened my mouth unto the LORD, and I cannot go back",
  "Psalms 50:14": "pay thy vows unto the most High",
  "Psalms 66:13": "I will pay thee my vows",
  "Psalms 66:14": "Which my lips have uttered, and my mouth hath spoken, when I was in trouble.",
  "Jonah 2:9": "I will pay that that I have vowed",
  "Joshua 21:45": "There failed not ought of any good thing which the LORD had spoken unto the house of Israel; all came to pass.",
  "Joshua 23:14": "not one thing hath failed of all the good things which the LORD your God spake concerning you",
  "Genesis 21:1": "And the LORD visited Sarah as he had said, and the LORD did unto Sarah as he had spoken.",
  "Jeremiah 1:12": "I will hasten my word to perform it",
  "Deuteronomy 7:9": "the faithful God, which keepeth covenant and mercy with them that love him",
  "2 Peter 3:9": "The Lord is not slack concerning his promise, as some men count slackness",
  "Hebrews 10:23": "he is faithful that promised",
  "Titus 1:2": "which God, that cannot lie, promised before the world began",
  "Romans 4:21": "what he had promised, he was able also to perform",
  "Acts 13:32": "the promise which was made unto the fathers",
  "Acts 13:33": "God hath fulfilled the same unto us their children, in that he hath raised up Jesus again",
};
const SPINE = Object.keys(SPINE_FRAGMENTS);

describe('sov65 — the lesson is mounted and is the week it says it is', () => {
  it('is mounted as week 65, in its own place, with every reader field present', () => {
    expect(M, `${ID} is not mounted`).toBeTruthy();
    const weeks = SOVEREIGN_AI_MODULES.map((m) => Number(m.id.match(/^sov(\d+)-/)[1]));
    // FORWARD-SAFE ON PURPOSE. The first version of this line read
    // `expect(Math.max(...weeks)).toBe(65)`, which is the exact assertion in
    // sov64's gate that turned this build's CI red -- "I am the highest week"
    // is true of the tree it is written on and false the instant the next week
    // lands, so it makes every future lesson edit a file it has no business in.
    // What is durably true, and what a real regression would still break: week
    // 65 exists, it is THIS lesson, it sits in the 65th place, and the weeks
    // run contiguous from one with no gap.
    expect(weeks).toContain(65);
    expect(weeks.filter((w) => w === 65).length, 'week 65 is mounted twice').toBe(1);
    expect(SOVEREIGN_AI_MODULES[64].id, 'sov65 is not in the 65th place').toBe(ID);
    expect(Math.max(...weeks)).toBeGreaterThanOrEqual(65);
    for (let w = 1; w <= 65; w += 1) expect(weeks, `week ${w} is missing`).toContain(w);
    expect(SOVEREIGN_AI_META.weeks).toBe(SOVEREIGN_AI_MODULES.length);
    expect(String(M.title).length).toBeGreaterThan(80);
    for (const k of ['bigIdea', 'inApp', 'lesson']) expect(String(M[k]).length, k).toBeGreaterThan(200);
    for (const b of FOUR_BANDS) expect(String(M.levels[b]).length, b).toBeGreaterThan(2000);
  });

  it('carries the title it is named for, and all three of its parts', () => {
    expect(M.title).toContain('I go, sir: and went not');
    expect(M.title).toContain('the full price today and the proof coming soon');
    expect(M.title).toContain('not one thing hath failed');
    // A title may only quote a phrase the corpus really holds.
    expect(verseText('Matthew 21:30')).toContain('I go, sir: and went not');
    expect(verseText('Joshua 23:14')).toContain('not one thing hath failed');
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

describe('sov65 — every verse is the corpus on disk, and nothing is from memory', () => {
  it('ANTI-VACUITY: the sweep really reads a large number of quoted spans', () => {
    const spans = allStrings().flatMap((s) => s.match(/"[^"]+"/g) || []);
    // Measured 247 across the module and 245 across the five reader places.
    expect(spans.length).toBeGreaterThanOrEqual(230);
    const reader = Object.values(PLACES()).flatMap((s) => s.match(/"[^"]+"/g) || []);
    expect(reader.length).toBeGreaterThanOrEqual(225);
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

  it('every double-quote mark in every reader place is PAIRED, so no span can escape the sweep', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      const marks = (v.match(/"/g) || []).length;
      expect(marks, `${k} has an odd number of double-quote marks`).toBe(Math.floor(marks / 2) * 2);
      expect(marks, `${k} quotes the Word nowhere`).toBeGreaterThan(40);
    }
  });

  it('anchor.ref names every verse the lesson stands on, each resolving, and the pinned spine is EXACTLY it', () => {
    const refs = anchorRefs(M);
    expect(refs).toEqual(SPINE);
    expect(refs.length).toBe(40);
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

  it('PROVEN TO CATCH: a changed word, a straightened apostrophe and a pronoun swap each fail the sweep', () => {
    const c = corpus();
    const bends = [
      M.lesson.replace('I go, sir: and went not', 'I go, sir: and did not go'),
      M.lesson.replace('he shall not break his word', 'he must not break his word'),
      M.lesson.replace('shall surely be the LORD’s', 'shall surely be the LORD\'s'),
      M.lesson.replace('And the LORD visited Sarah as he had said', 'And the LORD visited Sarah as He had said'),
      M.lesson.replace('I will pay that that I have vowed', 'I will pay that which I have vowed'),
    ];
    bends.forEach((bent, i) => {
      expect(bent, `bend ${i} changed nothing — the planted string was not present`).not.toBe(M.lesson);
      const faults = (bent.match(/"[^"]+"/g) || []).map((r) => r.slice(1, -1).trim()).filter((inner) => !c.includes(inner));
      expect(faults.length, `bend ${i} was not caught`).toBeGreaterThan(0);
    });
  });

  it('the corpus forms a builder would smooth out are pinned exactly as the corpus holds them', () => {
    // `that that` is not a typo, and `Howbeit` is not `However`.
    expect(verseText('Jonah 2:9')).toContain('I will pay that that I have vowed');
    expect(M.lesson).toContain('I will pay that that I have vowed');
    expect(verseText('1 Kings 10:7')).toContain('Howbeit I believed not the words');
    expect(M.lesson).toContain('Howbeit I believed not the words');
    // The curly apostrophe in Judges 11:31 is the corpus's own.
    expect(verseText('Judges 11:31')).toContain('shall surely be the LORD’s');
    expect(M.lesson).toContain('shall surely be the LORD’s');
  });

  it('the KJV’s own God and LORD stay exactly as written inside every quotation, and our voice says Yahweh', () => {
    // DR-0210 / DR-0076 bright line, asserted in BOTH directions.
    expect(M.lesson).toContain('for the LORD thy God will surely require it of thee');
    expect(M.lesson).toContain('the faithful God, which keepeth covenant and mercy with them that love him');
    expect(M.lesson).toContain('which God, that cannot lie, promised before the world began');
    const generic = allStrings().map(ourProseOnly).join('\n').match(/\bGod\b/g) || [];
    expect(generic.length, 'generic God in our authored voice').toBe(0);
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

describe('sov65 — the free ground, measured in both directions', () => {
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

  it('ANTI-VACUITY: the department really holds a large chapter set, so an empty set cannot fake a pass', () => {
    const all = chaptersOf(dept());
    // Measured 468 before this lesson, across 78 lessons; it adds 24 of its own.
    expect(all.size).toBeGreaterThan(460);
    expect(dept().length).toBeGreaterThan(75);
  });

  it('every chapter this lesson stands on is FREE of every OTHER lesson in the department', () => {
    const others = chaptersOf(dept().filter((m) => m.id !== ID));
    const mine = [...new Set(SPINE.map(chapterKey))];
    expect(mine.length).toBe(24);
    const clash = mine.filter((c) => others.has(c)).map((c) => `${c} <- ${[...others.get(c)].join(', ')}`);
    expect(clash, `chapter already spent:\n${clash.join('\n')}`).toEqual([]);
  });

  it('and in the OTHER direction: no other lesson stands on a chapter this one claims', () => {
    const mine = new Set(SPINE.map(chapterKey));
    const clash = [];
    for (const m of dept()) {
      if (m.id === ID) continue;
      for (const r of anchorRefs(m)) if (mine.has(chapterKey(r))) clash.push(`${m.id} -> ${r}`);
    }
    expect(clash, clash.join('\n')).toEqual([]);
  });

  it('the chapters DECLINED AS SPENT really are spent, so the census cannot have been invented', () => {
    const all = chaptersOf(dept().filter((m) => m.id !== ID));
    // Each is a chapter a builder would reach for on a price, a scale or a vow,
    // and each is already carried. If one ever reads FREE the census in this
    // header is stale and must be re-measured, never deleted.
    for (const c of ['Proverbs 11', 'Proverbs 16', 'Proverbs 20', 'Deuteronomy 25', 'Leviticus 19', 'Micah 6', 'Isaiah 55', '2 Kings 7', 'Luke 14', 'Ecclesiastes 5', 'Proverbs 25', 'John 19', 'Matthew 5', 'Joshua 9', '1 Samuel 1', 'Habakkuk 2', 'Luke 12', 'Hebrews 11']) {
      expect(all.has(c), `${c} was declined as SPENT but reads FREE`).toBe(true);
    }
  });

  it('THE PROSE-LEVEL CENSUS: not one of the 40 references appears anywhere in another department lesson', () => {
    // Anchor-free is not prose-free — the finding sov63 lost a whole draft to.
    // This is the check run BEFORE the writing, asserted here so it stays true.
    const others = dept().filter((m) => m.id !== ID).map((m) => [m.id, JSON.stringify(m)]);
    expect(others.length, 'the department read empty').toBeGreaterThan(75);
    const hits = [];
    for (const r of SPINE) for (const [id, json] of others) if (json.includes(r)) hits.push(`${r} <- ${id}`);
    expect(hits, `reference carried in another lesson's prose:\n${hits.join('\n')}`).toEqual([]);
  });

  it('THE ONE REFERENCE THE PROSE CENSUS DROPPED is really carried elsewhere, and is absent here', () => {
    // Numbers 23:19 reads FREE at anchor level and is carried in the PROSE of
    // sov16, sov18 and sov28. It was dropped rather than kept-and-declared,
    // because Joshua 21:45, Joshua 23:14, Genesis 21:1 and Jeremiah 1:12 carry
    // the same movement on ground that is clean at both levels.
    const carriers = SOVEREIGN_AI_MODULES.filter((m) => m.id !== ID && JSON.stringify(m).includes('Numbers 23:19')).map((m) => m.id);
    expect(carriers.length, 'Numbers 23:19 was dropped for a prose collision that does not exist').toBeGreaterThanOrEqual(3);
    expect(carriers.some((id) => id.startsWith('sov16-'))).toBe(true);
    expect(carriers.some((id) => id.startsWith('sov18-'))).toBe(true);
    expect(carriers.some((id) => id.startsWith('sov28-'))).toBe(true);
    // FREE at anchor level in every one of them, which is the whole point.
    for (const id of carriers) {
      const m = SOVEREIGN_AI_MODULES.find((x) => x.id === id);
      expect(anchorRefs(m).some((r) => chapterKey(r) === 'Numbers 23'), `${id} carries Numbers 23 in anchor.ref`).toBe(false);
    }
    expect(JSON.stringify(M)).not.toContain('Numbers 23:19');
    expect(SPINE).toContain('Joshua 21:45');
    expect(SPINE).toContain('Jeremiah 1:12');
  });

  it('the NINE refused teachings all exist, and this lesson takes none of their ground', () => {
    const ids = SOVEREIGN_AI_MODULES.map((m) => m.id);
    const refused = {
      'sov17-the-judge-and-the-just-weight': 'the just weight',
      'sov35-the-new-players-open-weights-a-just-weight-and-who-setteth-up-another': 'open weights and a just weight',
      'sov37-stop-paying-a-model-to-redecide-what-is-already-settled-a-just-weight-answers-the-same-every-time': 'a just weight answers the same',
      'sov52-a-just-weight-and-the-validator-that-checks-the-file': 'a just weight and the validator',
      'sov59-last-call-the-clock-a-seller-sets': "the clock a seller sets",
      'sov2-what-a-model-costs-to-run': 'what it costs to run',
      'sov38-ai-lowered-the-cost-of-building-not-the-cost-of-owning': 'the cost of owning',
      'sov20-the-book-of-remembrance-and-the-tool-that-forgets': 'the tool that forgets',
      'sov62-nobody-told-it-to-go-around': 'the thing that learned to go around',
      'sov41-the-agent-that-drowned-in-its-own-output': 'the agent that could not stop',
      'sov46-the-helper-that-must-see-everything': 'the helper that must see everything',
      'sov64-lead-on-softly': 'the pace an instrument sets',
    };
    for (const id of Object.keys(refused)) expect(ids, `${id} (${refused[id]}) is cited as already built and does not exist`).toContain(id);
    // sov35 really does teach the just weight AND open weights, which is why the
    // headline reading is refused rather than re-taught.
    const sov35 = SOVEREIGN_AI_MODULES.find((m) => m.id.startsWith('sov35-'));
    expect(JSON.stringify(sov35)).toContain('Proverbs 11:1');
    expect(anchorRefs(M).some((r) => chapterKey(r) === 'Proverbs 11')).toBe(false);
    // And sov59 really is the clock, which is this week's mirror and not its twin.
    expect(anchorRefs(SOVEREIGN_AI_MODULES.find((m) => m.id.startsWith('sov59-'))).some((r) => chapterKey(r) === 'Isaiah 55')).toBe(true);
    expect(anchorRefs(M).some((r) => chapterKey(r) === 'Isaiah 55')).toBe(false);
  });

  it('THE CROSS-COURSE OVERLAP THAT LANDED MID-BUILD IS REAL, AND IS DECLARED RATHER THAN HIDDEN', () => {
    // ll274 (DR-1312, PR #2531) merged into main WHILE this lesson was being
    // written, and it anchors Deuteronomy 23:21, 23:22 and 23:23 -- three of
    // this lesson's forty, one of them (23:22, forbearing is no sin) its hinge.
    // It is a DIFFERENT COURSE, so `one-teaching-one-lesson` does not flag it
    // and is right not to: its own header says a theme taught in two courses is
    // the curriculum working. But an overlap a reader finds for himself looks
    // like carelessness, so the adult lesson and the senior band NAME it, name
    // ll274, and state the difference between the two questions.
    const ll274 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll274-'));
    expect(ll274, 'll274 is cited as the cross-course overlap and does not exist').toBeTruthy();
    const theirs = new Set(anchorRefs(ll274));
    const shared = SPINE.filter((r) => theirs.has(r));
    expect(shared, 'the declared overlap is not what the catalog holds').toEqual(['Deuteronomy 23:21', 'Deuteronomy 23:22', 'Deuteronomy 23:23']);
    // And it really is the ONLY chapter the two share, in both directions.
    const theirCh = new Set(anchorRefs(ll274).map(chapterKey));
    expect([...new Set(SPINE.map(chapterKey))].filter((c) => theirCh.has(c))).toEqual(['Deuteronomy 23']);
    // Declared where a teacher and an adult reader meet it.
    for (const k of ['adult', 'senior']) {
      expect(PLACES()[k], `${k} does not name ll274`).toContain('ll274');
      expect(PLACES()[k], `${k} does not name the shared statute`).toContain('Deuteronomy 23:21-23');
      expect(PLACES()[k].toLowerCase(), `${k} does not state the difference between the two questions`).toMatch(/different course|two questions, two courses/);
    }
  });

  it('every reader place NAMES the already-built readings rather than quietly repeating them', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not name sov35`).toContain('sov35');
      expect(v, `${k} does not name sov59`).toContain('sov59');
      expect(v, `${k} does not name sov64`).toContain('sov64');
    }
  });
});

describe('sov65 — no other course owns these verses', () => {
  // A catalog course keeps its lessons behind `buildScheduleRows()`, a FUNCTION,
  // so JSON.stringify of the course object reads almost nothing — the fault
  // sov64 found and corrected. Call the function.
  const versesCited = (c) => {
    const out = new Set();
    const text = JSON.stringify(typeof c.buildScheduleRows === 'function' ? c.buildScheduleRows() : c);
    for (const r of text.match(/\b(?:[1-3] )?[A-Z][a-z]+(?: of [A-Z][a-z]+)? \d+:\d+/g) || []) out.add(r);
    return out;
  };

  it('ANTI-VACUITY: the four Real Estate courses that pin EXACT shared-verse sets are present and non-empty', () => {
    for (const key of ['appraisal', 'evictions', 'inspections', 'insurance-risk']) {
      const c = LEARN_CATALOG.find((x) => x.key === key);
      expect(c, `${key} course is missing`).toBeTruthy();
      expect(versesCited(c).size, `${key} cites no verses`).toBeGreaterThan(25);
    }
  });

  it('not one of this lesson’s 40 references is cited by any of those four courses', () => {
    const mine = new Set(SPINE);
    const clash = [];
    for (const key of ['appraisal', 'evictions', 'inspections', 'insurance-risk']) {
      const theirs = versesCited(LEARN_CATALOG.find((x) => x.key === key));
      for (const v of mine) if (theirs.has(v)) clash.push(`${v} <- ${key}`);
    }
    expect(clash, `verse owned by a pinning course:\n${clash.join('\n')}`).toEqual([]);
  });
});

describe('sov65 — all four bands, measured and not claimed', () => {
  it('the four-band ladder is clean', () => {
    expect(fourBandFaults(M), JSON.stringify(fourBandFaults(M))).toEqual([]);
    expect(shortBands(measureFullness(M))).toEqual([]);
    expect(unnamedBands(M)).toEqual([]);
  });

  it('the shares and the reading ladder are the measured numbers, not round ones', () => {
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

  it('four independent compositions, not one re-registered four times', () => {
    // Measured worst pair 0.111 (teen~senior) against the 0.25 near-copy line.
    // NOTE for the next builder: DIFF_CEILING in band-differentiation.mjs is
    // 0.5 while the ladder this gate enforces is 0.25, and a builder reading
    // only the first number will ship a near copy that fourBandFaults refuses.
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
    }
  });

  it('PROVEN TO CATCH: stripping ONE band’s friend line alone names that band while the pooled check stays green', () => {
    // The DR-0795 shape: a reader reads ONE band, so the per-band check is the
    // one that matters and the pooled check cannot be trusted alone.
    const stripped = M.levels.senior.replace(/Then take one friend this[\s\S]*?Numbers 30:2 aloud\./, '');
    expect(stripped, 'the senior friend line was not found').not.toBe(M.levels.senior);
    const bent = { ...M, levels: { ...M.levels, senior: stripped } };
    expect(placesMissingDirections(bent)).toEqual([{ place: 'senior', missing: ['friends'] }]);
    expect(hasAllThree(bent), 'the pooled check should still read green, which is why the per-band check exists').toBe(true);
  });

  it('growth is measured the Word’s way in every place: the fruit, and the count of days', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} has no qualitative measure`).toContain('the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith');
      expect(v, `${k} has no quantitative measure`).toContain('But exhort one another daily, while it is called To day');
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
    // The corpus's own forms survive inside the quotations.
    expect(M.lesson).toContain('He that sweareth to his own hurt, and changeth not.');
    expect(M.lesson).toContain('I will hasten my word to perform it');
  });

  it('two declared parables and no testimony, and the Word is quoted in every reader place', () => {
    expect(storyCount(M)).toBe(2);
    expect(M.stories.every((s) => s.kind === 'parable')).toBe(true);
    // DR-0811: a parable is not a testimony, and each says so in its own body.
    for (const s of M.stories) expect(s.body, s.title).toMatch(/This is a parable and not a report of anything that happened\./);
    expect(quotesTheWord(M)).toBe(true);
  });
});

describe('sov65 — the provenance is honest in every reader place', () => {
  it('names what arrived, counts the four removes, and carries his own word above the header', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v.toLowerCase(), `${k} does not say what arrived`).toMatch(/newsletter/);
      expect(v.toLowerCase(), `${k} does not count the removes`).toMatch(/four removes/);
      expect(v.toLowerCase(), `${k} does not name the university mailbox`).toMatch(/university mailbox|school mailbox/);
      expect(v, `${k} does not carry his own word`).toContain('Lessons');
    }
  });

  it('quotes BOTH refusals EXACTLY rather than describing them, in every reader place', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not quote the proxy refusal`).toContain('curl: (56) CONNECT tunnel failed, response 403');
      expect(v, `${k} does not quote the second road`).toContain('getaddrinfo ENOTFOUND www.theneurondaily.com');
    }
  });

  it('says the figures are UNCHECKED in every reader place, and stakes NOT ONE of them', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v.toUpperCase(), `${k} does not say unchecked`).toMatch(/UNCHECK/);
    }
    // The issue carried per-million token prices, two monthly plan prices, four
    // index scores, a dollar figure one developer reportedly burned, a turn
    // count, an hour count, a survey percentage and an acquisition price. NONE
    // of them is reproduced anywhere in the module — not in a band, not in a
    // benefit, not in the quiz.
    // A PIN WITH THE WRONG SWEEP, CORRECTED. The first version matched bare
    // two-digit runs and fired on `56` inside the quoted refusal `curl: (56)`
    // and on `50` inside `Psalms 50:14` -- neither of which is a figure from the
    // issue. A pin that fires on a verse reference is a pin that will be
    // loosened by the next builder to shut it up, so it is made PRECISE rather
    // than loose: every shape a leaked figure from this issue would actually
    // take is swept, and the proven-to-catch case below plants one.
    const text = allStrings().join('\n');
    const FIGURE = /\$\s?\d|\b\d+\s?(?:per million|\/month|per month|turns|points)\b|\b(?:792|870|7\.5B|1\.5B|20M)\b|\b(?:52|30)%|\bscores? (?:58|56|53|52)\b|\bindex (?:58|56|53|52)\b/g;
    const leaked = text.match(FIGURE) || [];
    expect(leaked, `a figure from the issue leaked: ${leaked.join(', ')}`).toEqual([]);
    // PROVEN TO CATCH: each shape a leak would take really does fire.
    for (const planted of ['it costs $4 per million input tokens', 'the plans cost 50 per month', 'it spent 792 turns in a forest', 'the index scores 58 against 56', 'a 52% survey result']) {
      expect((planted.match(FIGURE) || []).length, `a planted leak was not caught: ${planted}`).toBeGreaterThan(0);
    }
  });

  it('names the FOUR paid items as set aside, and uses NOT ONE of them', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v.toLowerCase(), `${k} does not name the paid items`).toMatch(/four (paid|promotional)|four ads/);
      expect(v.toLowerCase(), `${k} does not say they were set aside`).toMatch(/set aside|skipped all four/);
    }
  });

  it('names NO publisher, maker, vendor, platform or person the issue names', () => {
    const text = allStrings().join('\n');
    for (const n of ['Meta', 'Muse', 'Wonder', 'Opus', 'Anthropic', 'OpenAI', 'Google', 'Microsoft', 'Disney', 'Epic', 'Nvidia', 'NVIDIA', 'Karpathy', 'TechCrunch', 'VentureBeat', 'Engadget', 'Bloomberg', 'Neuron', 'Character', 'Claude', 'ChatGPT', 'Huawei', 'Pokemon']) {
      expect(new RegExp(`\\b${n}\\b`).test(text), `${n} is named in the module`).toBe(false);
    }
    // theneurondaily.com appears ONLY inside the quoted refusal, which is the
    // evidence of a road we walked rather than a citation of the publisher.
    const hits = text.split('theneurondaily.com').length - 1;
    expect(hits).toBeGreaterThan(0);
    for (const s of allStrings()) {
      if (!s.includes('theneurondaily.com')) continue;
      expect(s, 'theneurondaily.com appears outside the quoted refusal').toContain('getaddrinfo ENOTFOUND www.theneurondaily.com');
    }
  });
});

describe('sov65 — the teaching itself is pinned, in every place a reader meets it', () => {
  const uniqueCarrier = (slice, place) => {
    const hits = Object.entries(PLACES()).filter(([, v]) => v.includes(slice)).map(([k]) => k);
    expect(hits, `slice is not unique to ${place}: ${hits.join(', ')}`).toEqual([place]);
  };

  it('THE LAW is in all five: a word given is a bond on the soul, payable in the thing promised', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not quote Numbers 30:2`).toContain('he shall not break his word, he shall do according to all that proceedeth out of his mouth');
      // A MATCHER TOO NARROW, WIDENED TO THE SHARED CORE rather than hollowed
      // out: the adult lesson writes `he settled it as a bond` and `what the
      // bond is fastened to ... to his soul`, the senior band `what the bond is
      // fastened to is the soul`, the child band `more like money you owe`, the
      // youth band `treats it like a debt` and the teen band `A WORD GIVEN IS A
      // DEBT`. Five places, one teaching, five registers.
      expect(v.toLowerCase(), `${k} does not state the law in its own words`).toMatch(/bond on the soul|bond is fastened to|settled it as a bond|tied to (his|your) soul|more like money you owe|like a debt|becomes a debt|a word given is a debt/);
    }
  });

  it('THE EXIT is in all five, and it is stated as NO SIN AT ALL', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not quote Deuteronomy 23:22`).toContain('But if thou shalt forbear to vow, it shall be no sin in thee.');
      // A MATCHER TOO NARROW, WIDENED: the youth band writes `the entire weight
      // of this law LANDS on the yes`, which the first pattern missed because it
      // demanded `on` or `rests on` immediately after `this law`.
      expect(v.toLowerCase(), `${k} does not say the weight falls on the yes`).toMatch(/weight of (?:this|the) law[^.]{0,40}\bon(?:to)? the yes|whole weight of the law on the yes|weight on the yes|saying maybe is not a sin|puts the whole weight of this law on the yes/);
    }
  });

  it('THE HINGE is in all five: I go, sir: and went not, and the field is the judge', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not quote Matthew 21:30`).toContain('I go, sir: and went not');
      expect(v, `${k} does not quote the son who went`).toContain('I will not: but afterward he repented, and went');
      expect(v.toLowerCase(), `${k} does not state the measure`).toMatch(/the field (is the judge|tells the truth|grades)|cannot be (negotiated|talked)/);
    }
  });

  it('THE FOUR COMING SOONS are counted in all five, against one price due today', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v.toLowerCase(), `${k} does not count the coming soons`).toMatch(/four coming soons|four i-go-sirs|four coming soon/);
      expect(v.toLowerCase(), `${k} does not set the price against them`).toMatch(/present tense|due today|ready today|payable today|price was ready today/);
    }
  });

  it('THE SUBSTITUTE DELIVERY is in all five, with Jacob’s own question left standing', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not quote the morning`).toContain('in the morning, behold, it was Leah');
      expect(v, `${k} does not leave the question standing`).toContain('wherefore then hast thou beguiled me?');
      expect(v, `${k} does not carry the extension of term`).toContain('yet seven other years');
    }
  });

  it('THE MOVING TERMS are in all five, and the offense is named as the moving', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not quote the wages`).toContain('changed my wages ten times');
      expect(v.toLowerCase(), `${k} does not name the movement as the wrong`).toMatch(/kept changing|the moving|the movement|the offense is the movement|after the work/);
    }
  });

  it('THE GOVERNOR QUESTION is in all five, and so is the located fraud', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not quote Malachi 1:8`).toContain('offer it now unto thy governor; will he be pleased with thee, or accept thy person?');
      expect(v, `${k} does not quote the verdict`).toContain('cursed be the deceiver, which hath in his flock a male, and voweth, and sacrificeth unto the Lord a corrupt thing');
      expect(v.toLowerCase(), `${k} does not locate the fraud in the gap`).toMatch(/gap (between|is)|that gap/);
      expect(v.toLowerCase(), `${k} does not say a self-graded chart is not evidence`).toMatch(/grade(s)? (his|your) own|not a real grade|not evidence|marketing/);
    }
  });

  it('THE PAYMENT THAT BOUGHT NOTHING is in all five', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not quote the tribute`).toContain('And Hezekiah gave him all the silver that was found in the house of the LORD');
      expect(v, `${k} does not carry the host`).toContain('with a great host against Jerusalem');
      expect(v.toLowerCase(), `${k} does not say the payment bought nothing`).toMatch(/came anyway|buys nothing|bought nothing|army (came|arriving)/);
    }
  });

  it('THE QUEEN’S METHOD is in all five, and the under-telling standard with it', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not carry the report`).toContain('It was a true report that I heard in mine own land of thy acts and of thy wisdom.');
      expect(v, `${k} does not carry the looking`).toContain('until I came, and mine eyes had seen it: and, behold, the half was not told me');
      expect(v.toLowerCase(), `${k} does not set the under-telling standard`).toMatch(/under-tell|tell people a little|eyes do the (selling|talking)/);
    }
  });

  it('BOTH PRICES are in all five: a broken oath and a rash one, and the text is not exceeded', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not carry the famine`).toContain('Then there was a famine in the days of David three years, year after year');
      expect(v, `${k} does not carry the oath`).toContain('the children of Israel had sworn unto them');
      expect(v, `${k} does not carry the judge`).toContain('I have opened my mouth unto the LORD, and I cannot go back');
      expect(v.toLowerCase(), `${k} does not bring it back to the exit`).toMatch(/did not have to say it|never had to open his mouth|never required to open his mouth|he never had to/);
    }
  });

  it('THE CLOSE is in all five: not one thing hath failed, and HATH FULFILLED in the past tense', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      expect(v, `${k} does not carry the audit`).toContain('not one thing hath failed of all the good things which the LORD your God spake concerning you');
      expect(v, `${k} does not carry the fulfilment`).toContain('God hath fulfilled the same unto us their children, in that he hath raised up Jesus again');
      expect(v.toLowerCase(), `${k} does not lift the past tense`).toMatch(/hath fulfilled/);
      // A MATCHER TOO NARROW, WIDENED: the adult lesson writes `was NOT left at
      // coming soon` where the pattern demanded `never left`, and the child band
      // teaches it as `Jesus is not coming soon. He came!`.
      expect(v.toLowerCase(), `${k} does not say He was not left at coming soon`).toMatch(/(?:not|never) left at coming soon|not coming soon|already happened|already done/);
    }
    // The four longer places lift it in capitals; the child band teaches the
    // phrase in its own register instead, which is measured rather than assumed.
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(PLACES()[k], `${k} does not lift HATH FULFILLED`).toContain('HATH FULFILLED');
  });

  it('THE THREE ACTIONS are in all five, and each is dated and checkable', () => {
    for (const [k, v] of Object.entries(PLACES())) {
      const u = v.toUpperCase();
      expect(u, `${k} is missing the pay-the-word action`).toMatch(/PAY ONE WORD YOU OWE/);
      expect(u, `${k} is missing the forbear action`).toMatch(/FORBEAR ONE VOW|STOP ONE PROMISE YOU KEEP MAKING/);
      expect(u, `${k} is missing the go-and-look action`).toMatch(/GO AND LOOK AT ONE THING YOU PAY FOR|CHECK ONE THING/);
      expect(v.toLowerCase(), `${k} does not ask for a date`).toMatch(/date all three|write the date|insist on the dates|put a date|each one dated|dated actions/);
    }
  });

  it('PROVEN TO CATCH: each load-bearing line, broken at EVERY site it occurs, fires the guard that holds it', () => {
    // Each row names THE GUARD THAT HOLDS IT, because a single generic
    // catch-all across heterogeneous breaks reports a real pass as a gap and a
    // real gap as a pass — the fault sov64 found and rewrote (DR-1311). Every
    // guard is asserted to hold on the SHIPPED lesson first, so a guard that is
    // always false cannot read as a catch, and the site count is asserted
    // greater than zero so the DR-1303 no-sites failure cannot happen silently.
    const c = corpus();
    const everyPlace = (re) => (p) => Object.values(p).every((v) => re.test(v));
    const quotesAreVerbatim = (p) => Object.values(p).every((v) => (v.match(/"[^"]+"/g) || []).every((r) => c.includes(r.slice(1, -1).trim())));
    const rows = [
      // Held by the corpus sweep: these are quotations.
      ['I go, sir: and went not', 'I go, sir: and never went', quotesAreVerbatim, 'the verbatim sweep'],
      ['he shall not break his word, he shall do according to all that proceedeth out of his mouth', 'he shall not break his word, he shall do all that he said', quotesAreVerbatim, 'the verbatim sweep'],
      ['But if thou shalt forbear to vow, it shall be no sin in thee.', 'But if thou shalt forbear to vow, it shall be no sin at all.', quotesAreVerbatim, 'the verbatim sweep'],
      ['He that sweareth to his own hurt, and changeth not.', 'He that sweareth to his own hurt, and changeth it not.', quotesAreVerbatim, 'the verbatim sweep'],
      ['wherefore then hast thou beguiled me?', 'wherefore then hast thou deceived me?', quotesAreVerbatim, 'the verbatim sweep'],
      ['changed my wages ten times', 'changed my wages many times', quotesAreVerbatim, 'the verbatim sweep'],
      ['offer it now unto thy governor; will he be pleased with thee, or accept thy person?', 'offer it now unto thy governor; will he be pleased with thee?', quotesAreVerbatim, 'the verbatim sweep'],
      ['with a great host against Jerusalem', 'with a great army against Jerusalem', quotesAreVerbatim, 'the verbatim sweep'],
      ['the half was not told me', 'the half was not told to me', quotesAreVerbatim, 'the verbatim sweep'],
      ['I will pay that that I have vowed', 'I will pay that which I have vowed', quotesAreVerbatim, 'the verbatim sweep (the form a builder smooths out)'],
      ['not one thing hath failed of all the good things which the LORD your God spake concerning you', 'nothing hath failed of all the good things which the LORD your God spake concerning you', quotesAreVerbatim, 'the verbatim sweep'],
      ['God hath fulfilled the same unto us their children, in that he hath raised up Jesus again', 'God hath fulfilled the same unto us their children, in that he raised up Jesus again', quotesAreVerbatim, 'the verbatim sweep'],
      // Held by their own per-place assertions: these are OUR prose, our lifted
      // emphasis and our provenance, and breaking them breaks no quotation.
      ['UNCHECK', 'UNPROVEN', everyPlace(/UNCHECK/), 'the UNCHECKED pin'],
      ['curl: (56) CONNECT tunnel failed, response 403', 'the page would not open', everyPlace(/curl: \(56\) CONNECT tunnel failed, response 403/), 'the quoted-refusal pin (DR-0108)'],
      ['getaddrinfo ENOTFOUND www.theneurondaily.com', 'the second road also failed', everyPlace(/getaddrinfo ENOTFOUND www\.theneurondaily\.com/), 'the second-road refusal pin (DR-0108)'],
      ['sov35', 'an earlier week', everyPlace(/sov35/), 'the DR-0610 refusal roll'],
      ['sov59', 'another earlier week', everyPlace(/sov59/), 'the DR-0610 refusal roll'],
      ['Lamb of Yahweh', 'Lamb', everyPlace(/Lamb of Yahweh/), 'the DR-0210 confession'],
      ['Eternal Son of Yahweh', 'Son', everyPlace(/Eternal Son of Yahweh/), 'the DR-0210 confession'],
      ['Deuteronomy 6:7', 'the Word', everyPlace(/Deuteronomy 6:7/), 'the TALK ABOUT IT TOGETHER rhythm'],
      ['TALK ABOUT IT TOGETHER', 'ONE LAST THING', everyPlace(/TALK ABOUT IT TOGETHER/), 'the DR-0733 block'],
      ['PAY ONE WORD YOU OWE', 'SETTLE SOMETHING', everyPlace(/PAY ONE WORD YOU OWE/), 'the first dated action'],
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
    uniqueCarrier('A promise is when you say you will do a thing.', 'child');
    uniqueCarrier('The title has three parts.', 'youth');
    uniqueCarrier('You will spend the next sixty years signing things', 'teen');
    uniqueCarrier("Teach this as the course's week on THE PROMISE", 'senior');
  });
});

describe('sov65 — the date is derived, never typed', () => {
  it('lesson-dates records this lesson, derived from git and not from the working tree', () => {
    const d = lessonCreatedDay('sovereign-ai', ID);
    expect(d, `${ID} has no lesson-dates entry; run npm run lesson-dates`).toBeTruthy();
    expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(d).toBe('2026-11-05');
  });
});
