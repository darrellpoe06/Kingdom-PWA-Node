// @vitest-environment node
// =============================================================================
// L260 — "The Letters of Frightened Kings: the Amarna Tablets and the Word".
// Darrell sent a video into the app's research road asking for a lesson out of
// it, Word first. DR-1220.
// =============================================================================
// WHY THIS GATE IS STRICTER THAN MOST. The material is one speaker's argument
// about archaeology, and the argument's centrepiece — that the Habiru of the
// Amarna letters ARE the Hebrew Israelites — is contested scholarship, not
// established fact. DR-0192 exists because an archaeology claim shipped wrong
// once before (L40's Sargon annals over-reach). So this file pins three things
// that a later edit could quietly undo:
//
//   1. THE WORD IS THE SPINE. Joshua and Judges carry the conquest; the tablets
//      are a second witness and nothing more. Every band must say so, and every
//      band must close on Isaiah 40:8.
//   2. THE HABIRU EQUATION IS NEVER TAUGHT AS PROOF. Every band must carry the
//      narrow true statement — the letters never name Israel, the term is read
//      by most scholars as a social description rather than a nation, and the
//      letters corroborate a shape without supplying an identification. A band
//      that starts asserting the equation fails here.
//   3. THE THREE OVERSELLS STAY NAMED. The Gezer destruction-layer claim, the
//      Tyre letter about Hazor, and the Jerusalem fragment's "same scribe" are
//      the three places the popular telling runs past its evidence, and the
//      lesson names all three. A lesson that audits only the sources it already
//      distrusts has audited nothing.
//
// WHERE THE WORD IS RETICENT THE LESSON STOPS (DR-0098). Scripture gives
// intervals (1 Kings 6:1; Judges 11:26) and no year in our reckoning, so the
// lesson refuses to settle the conquest date and says why: Deuteronomy 29:29.
// This gate pins the refusal, because "resolve it anyway" is the tempting edit.
//
// WHAT THE CHECKS CAUGHT WHILE WRITING, mechanically, before commit: the child
// band came in at 0.38 of the adult lesson, under its 0.5 floor, and was
// deepened with the city comparisons, the three oversells and a fuller practice
// (0.38 -> 0.56); and six Deuteronomy 6:7 quotations read "thou shalt talk of
// them" where the corpus reads "and shalt talk of them" — caught by the
// verbatim check, not by eye.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { fleschKincaidGrade, ourProseOnly, NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { placesMissingDirections, missingDirections, hasAllThree } from '../lib/talk-together.js';
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

const ID = 'll260-the-letters-of-frightened-kings-the-amarna-tablets-and-the-word';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const ALL = Object.keys(TEXTS);
const whole = ALL.map((k) => TEXTS[k]).join('\n');
const CLOSING = '"The grass withereth, the flower fadeth: but the word of our God shall stand for ever" (Isaiah 40:8).';

// The Word's own account of the conquest, quoted in EVERY band — because a
// reader reads ONE band, and the spine cannot be a thing only the adult sees.
const IN_EVERY_BAND = [
  ['Lachish falls on the second day', 'Joshua', 10, 32, 'And the LORD delivered Lachish into the hand of Israel, which took it on the second day'],
  ['Hazor, head of all those kingdoms', 'Joshua', 11, 10, 'for Hazor beforetime was the head of all those kingdoms'],
  ['Jerusalem not driven out', 'Judges', 1, 21, 'And the children of Benjamin did not drive out the Jebusites that inhabited Jerusalem'],
  ['Gezer not driven out', 'Judges', 1, 29, 'but the Canaanites dwelt in Gezer among them'],
  ['David takes the strong hold of Zion', '2 Samuel', 5, 7, 'Nevertheless David took the strong hold of Zion: the same is the city of David'],
  ['Pharaoh takes Gezer, generations later', '1 Kings', 9, 16, 'For Pharaoh king of Egypt had gone up, and taken Gezer, and burnt it with fire'],
  ['by little and little, announced in advance', 'Exodus', 23, 30, 'By little and little I will drive them out from before thee'],
  ['Rahab: your terror is fallen upon us', 'Joshua', 2, 9, 'your terror is fallen upon us'],
  ['the kings of Canaan, heart melted', 'Joshua', 5, 1, 'their heart melted, neither was there spirit in them any more'],
  ['He promised to send the fear', 'Exodus', 23, 27, 'I will send my fear before thee'],
  ['the name Hebrew, used of Abram', 'Genesis', 14, 13, 'told Abram the Hebrew'],
  ['the name Hebrew, confessed by Jonah', 'Jonah', 1, 9, 'I am an Hebrew; and I fear the LORD'],
  ['add nothing to His words', 'Proverbs', 30, 6, 'Add thou not unto his words, lest he reprove thee, and thou be found a liar'],
  ['intervals, not a calendar year', '1 Kings', 6, 1, 'in the four hundred and eightieth year after the children of Israel were come out of the land of Egypt'],
  ['the secret things are His', 'Deuteronomy', 29, 29, 'The secret things belong unto the LORD our God'],
  ['the law of witnesses', 'Deuteronomy', 19, 15, 'at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established'],
  ['prove all things', '1 Thessalonians', 5, 21, 'Prove all things; hold fast that which is good'],
  ['the Bereans searched', 'Acts', 17, 11, 'searched the scriptures daily, whether those things were so'],
  ['not by their own sword', 'Psalms', 44, 3, 'For they got not the land in possession by their own sword, neither did their own arm save them'],
  ['by faith the walls fell', 'Hebrews', 11, 30, 'By faith the walls of Jericho fell down, after they were compassed about seven days'],
  ['His word stands for ever', 'Isaiah', 40, 8, 'but the word of our God shall stand for ever'],
  ['the four places of talking', 'Deuteronomy', 6, 7, 'and shalt talk of them when thou sittest in thine house'],
];

// Carried somewhere in the lesson, not required of every band.
const ELSEWHERE = [
  ['Horam of Gezer comes to help', 'Joshua', 10, 33, 'Then Horam king of Gezer came up to help Lachish'],
  ['he burnt Hazor with fire', 'Joshua', 11, 11, 'he burnt Hazor with fire'],
  ['the whole land taken', 'Joshua', 11, 23, 'So Joshua took the whole land, according to all that the LORD said unto Moses'],
  ['thirty and one kings', 'Joshua', 12, 24, 'all the kings thirty and one'],
  ['much land yet to be possessed', 'Joshua', 13, 1, 'there remaineth yet very much land to be possessed'],
  ['nothing failed', 'Joshua', 21, 45, 'There failed not ought of any good thing which the LORD had spoken unto the house of Israel'],
  ['not one thing hath failed', 'Joshua', 23, 14, 'not one thing hath failed of all the good things which the LORD your God spake concerning you'],
  ['the tribes gathered to Shechem', 'Joshua', 24, 1, 'And Joshua gathered all the tribes of Israel to Shechem'],
  ['a covenant at Shechem', 'Joshua', 24, 25, 'So Joshua made a covenant with the people that day, and set them a statute and an ordinance in Shechem'],
  ['Joshua dies at a hundred and ten', 'Joshua', 24, 29, 'Joshua the son of Nun, the servant of the LORD, died, being an hundred and ten years old'],
  ['Judges opens on unfinished work', 'Judges', 1, 1, 'Now after the death of Joshua it came to pass, that the children of Israel asked the LORD'],
  ['the nations He left, to prove Israel', 'Judges', 3, 1, 'Now these are the nations which the LORD left, to prove Israel by them'],
  ['a Canaanite king in Hazor again', 'Judges', 4, 2, 'Jabin king of Canaan, that reigned in Hazor'],
  ['Israel prevails against Jabin', 'Judges', 4, 24, 'the hand of the children of Israel prospered, and prevailed against Jabin the king of Canaan'],
  ['not in one year', 'Exodus', 23, 29, 'I will not drive them out from before thee in one year'],
  ['by little and little, in the Law', 'Deuteronomy', 7, 22, 'And the LORD thy God will put out those nations before thee by little and little'],
  ['how the news reached Jericho', 'Joshua', 2, 10, 'we have heard how the LORD dried up the water of the Red sea for you'],
  ['no courage left in any man', 'Joshua', 2, 11, 'our hearts did melt, neither did there remain any more courage in any man'],
  ['the Gibeonites were sore afraid', 'Joshua', 9, 24, 'therefore we were sore afraid of our lives because of you'],
  ['his fame was noised abroad', 'Joshua', 6, 27, 'So the LORD was with Joshua; and his fame was noised throughout all the country'],
  ['the dread put upon the nations', 'Deuteronomy', 2, 25, 'This day will I begin to put the dread of thee and the fear of thee upon the nations'],
  ['Joseph: the land of the Hebrews', 'Genesis', 40, 15, 'For indeed I was stolen away out of the land of the Hebrews'],
  ['the Hebrew midwives', 'Exodus', 1, 15, 'And the king of Egypt spake to the Hebrew midwives'],
  ['the Philistine battle cry', '1 Samuel', 4, 9, 'that ye be not servants unto the Hebrews, as they have been to you'],
  ['an Hebrew of the Hebrews', 'Philippians', 3, 5, 'an Hebrew of the Hebrews'],
  ['add nothing, diminish nothing', 'Deuteronomy', 4, 2, 'Ye shall not add unto the word which I command you, neither shall ye diminish ought from it'],
  ['above that which is written', '1 Corinthians', 4, 6, 'not to think of men above that which is written'],
  ['first in his own cause', 'Proverbs', 18, 17, 'He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him'],
  ['answering before hearing', 'Proverbs', 18, 13, 'He that answereth a matter before he heareth it, it is folly and shame unto him'],
  ['three hundred years', 'Judges', 11, 26, 'three hundred years'],
  ['the times and the seasons', 'Acts', 1, 7, 'It is not for you to know the times or the seasons, which the Father hath put in his own power'],
  ['two or three witnesses, in the apostles', '2 Corinthians', 13, 1, 'In the mouth of two or three witnesses shall every word be established'],
  ['Luke worked for his certainty', 'Luke', 1, 3, 'having had perfect understanding of all things from the very first, to write unto thee in order'],
  ['that thou mightest know the certainty', 'Luke', 1, 4, 'That thou mightest know the certainty of those things, wherein thou hast been instructed'],
  ['the honour of kings', 'Proverbs', 25, 2, 'the honour of kings is to search out a matter'],
  ['let God be true', 'Romans', 3, 4, 'let God be true, but every man a liar'],
  ['the evidence of things not seen', 'Hebrews', 11, 1, 'Now faith is the substance of things hoped for, the evidence of things not seen'],
  ['all scripture is given by inspiration', '2 Timothy', 3, 16, 'All scripture is given by inspiration of God, and is profitable for doctrine'],
  ['written aforetime for our learning', 'Romans', 15, 4, 'whatsoever things were written aforetime were written for our learning'],
  ['thy word is truth', 'John', 17, 17, 'Sanctify them through thy truth: thy word is truth'],
  ['true from the beginning', 'Psalms', 119, 160, 'Thy word is true from the beginning'],
  ['my words shall not pass away', 'Matthew', 24, 35, 'Heaven and earth shall pass away, but my words shall not pass away'],
  ['our fathers have told us', 'Psalms', 44, 1, 'We have heard with our ears, O God, our fathers have told us'],
  ['we will not hide them from their children', 'Psalms', 78, 4, 'We will not hide them from their children'],
  ['ask thy father', 'Deuteronomy', 32, 7, 'Remember the days of old, consider the years of many generations: ask thy father, and he will shew thee'],
  ['hearts turned to each other', 'Malachi', 4, 6, 'he shall turn the heart of the fathers to the children, and the heart of the children to their fathers'],
  ['iron sharpeneth iron', 'Proverbs', 27, 17, 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend'],
  ['confess one to another', 'James', 5, 16, 'Confess your faults one to another, and pray one for another, that ye may be healed'],
  ['the fruit of the Spirit', 'Galatians', 5, 22, 'the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith'],
  ['growth the way He grew', 'Luke', 2, 52, 'And Jesus increased in wisdom and stature, and in favour with God and man'],
];

describe('L260 exists, is numbered, and carries the day it joined the course', () => {
  it('is in the catalog exactly once, after L258', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 260)).toHaveLength(1);
    expect(claimed.indexOf(260)).toBeGreaterThan(claimed.indexOf(258));
  });
  it('carries its added day', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-27');
  });
  it('names its road honestly — sent INSIDE the app, researched on our own machines', () => {
    expect(L.lesson).toContain('Darrell sent a video into the PoeTech app');
    expect(L.lesson).toContain('research road');
    expect(L.lesson).toContain('on our own machines');
  });
  it('names the speaker exactly as the source names him, with no faith label or motive attached', () => {
    expect(L.lesson).toContain('Joel Kramer of Expedition Bible');
    // The source states he authored a book on archaeological evidence and runs
    // the channel. It states nothing about his faith, affiliation or motive, so
    // neither do we — the World Issues 21 correction, kept.
    const blob = JSON.stringify(L);
    for (const label of ['evangelical', 'fundamentalist', 'missionary', 'apologist', 'pastor', 'grifter', 'agenda']) {
      expect(blob.toLowerCase().includes(label), `attaches "${label}" to a named real person`).toBe(false);
    }
  });
  it('the adult lesson walks its nine movements, in order', () => {
    const order = [
      'ONE. THE CONQUEST AS SCRIPTURE ITSELF TELLS IT',
      'TWO. THE WORD ALREADY TOLD US WHAT THE KINGS OF CANAAN WOULD BE SAYING',
      'THREE. WHAT THE TABLETS ACTUALLY ARE, STATED PLAINLY',
      'FOUR. THE HABIRU QUESTION, AND WHERE THE HONEST LINE RUNS',
      'FIVE. THE CITIES SIDE BY SIDE, AND THREE PLACES WHERE THE TELLING RUNS PAST ITS EVIDENCE',
      'SIX. WHERE THE WORD IS RETICENT, WE STOP',
      'SEVEN. THE WITNESS RULE, WHICH IS THE PORTABLE LESSON',
      'EIGHT. THE PRACTICE',
      'TALK ABOUT IT TOGETHER',
    ];
    let at = -1;
    for (const h of order) {
      const i = L.lesson.indexOf(h);
      expect(i, `${h} is missing or out of order`).toBeGreaterThan(at);
      at = i;
    }
  });
});

describe('L260 keeps the Word senior and the tablets subordinate, in every band', () => {
  it.each(ALL)('%s closes on Isaiah 40:8', (k) => {
    expect(TEXTS[k].trim().endsWith(CLOSING), `${k} does not close on Isaiah 40:8`).toBe(true);
  });
  it.each(ALL)('%s quotes every strand of the Word that every band carries', (k) => {
    for (const [why, book, ch, n] of IN_EVERY_BAND) {
      expect(TEXTS[k].includes(`(${book} ${ch}:${n})`), `${k} drops ${why} (${book} ${ch}:${n})`).toBe(true);
    }
  });
  it.each(ALL)('%s says plainly that the letters never name Israel', (k) => {
    expect(/(do not name Israel|does not say Israel|never name Israel|never names Israel|not say Israel)/i.test(TEXTS[k]), `${k} drops the never-names-Israel line`).toBe(true);
  });
  it.each(ALL)('%s states that only the Word says WHO gave the land', (k) => {
    expect(/[Oo]nly the Word/.test(TEXTS[k]), `${k} drops the only-the-Word sentence`).toBe(true);
    expect(TEXTS[k].includes('(Psalms 44:3)'), `${k} drops Psalms 44:3`).toBe(true);
  });
  it.each(ALL)('%s names the Habiru question and refuses to teach the equation as proof', (k) => {
    expect(/Habiru/.test(TEXTS[k]), `${k} never names the Habiru`).toBe(true);
    expect(/not (?:established|proved)/i.test(TEXTS[k]), `${k} never says the equation is not established`).toBe(true);
    expect(/social (?:description|label|term)|outsiders/i.test(TEXTS[k]), `${k} never gives the social reading`).toBe(true);
  });
  it.each(ALL)('%s refuses to settle the date the Word leaves open', (k) => {
    expect(TEXTS[k].includes('(1 Kings 6:1)'), `${k} drops the interval verse`).toBe(true);
    expect(TEXTS[k].includes('(Deuteronomy 29:29)'), `${k} drops the reticence verse`).toBe(true);
    // No band may assert a BC century for the conquest as Scripture's own.
    expect(/Scripture (?:says|gives|dates) .{0,40}(?:fifteenth|thirteenth) century/i.test(TEXTS[k]), `${k} puts a century in Scripture's mouth`).toBe(false);
  });
});

describe('L260 — the three oversells stay named (DR-0192, the point of this lesson)', () => {
  const OVERSELLS = [
    [/destruction (?:layer|level) at Gezer|burned layer at Gezer/i, 'the Gezer destruction-layer claim'],
    [/Tyre/, 'the letter from Tyre about Hazor'],
    [/same scribe|same writer/i, 'the Jerusalem fragment "same scribe" claim'],
  ];
  it.each(ALL)('%s names all three places the telling runs past its evidence', (k) => {
    for (const [re, what] of OVERSELLS) {
      expect(re.test(TEXTS[k]), `${k} drops ${what}`).toBe(true);
    }
  });
  it.each(ALL)('%s corrects the Gezer claim rather than repeating it', (k) => {
    expect(/excavators|diggers/i.test(TEXTS[k]), `${k} never cites the excavators against the claim`).toBe(true);
  });
  it.each(ALL)('%s reads the Hazor line as a ruler going over, not a city taken', (k) => {
    expect(/went over to|joined them/i.test(TEXTS[k]), `${k} drops the corrected reading of the Hazor line`).toBe(true);
  });
  it('the adult lesson states the established facts plainly, without hedging them', () => {
    for (const fact of ['1887', 'Tell el-Amarna', 'cuneiform', 'Akkadian', 'fourteenth century', 'Akhenaten', 'Knudtzon', 'Berlin']) {
      expect(L.lesson.includes(fact), `the lesson drops the established fact "${fact}"`).toBe(true);
    }
  });
  it('would catch the equation being taught as proof (proven-to-catch)', () => {
    const overclaimed = {
      ...L,
      levels: { ...L.levels, teen: L.levels.teen.replace('But it is not established', 'And it is established beyond doubt') },
    };
    expect(overclaimed.levels.teen).not.toBe(L.levels.teen);
    expect(/not (?:established|proved)/i.test(overclaimed.levels.teen)).toBe(false);
  });
  it('would catch an oversell being restored (proven-to-catch)', () => {
    const restored = { ...L, levels: { ...L.levels, youth: L.levels.youth.replace(/excavators/g, 'people') } };
    expect(restored.levels.youth).not.toBe(L.levels.youth);
    expect(/excavators|diggers/i.test(restored.levels.youth)).toBe(false);
  });
});

describe('L260 — every quoted span is the verse, exactly as the corpus has it', () => {
  it.each([...IN_EVERY_BAND, ...ELSEWHERE])('%s — %s %s:%s', (_why, book, ch, n, span) => {
    const v = verse(book, ch, n);
    expect(v, `${book} ${ch}:${n} resolves`).toBeTruthy();
    expect(v.includes(span), `the span is not in ${book} ${ch}:${n}`).toBe(true);
    expect(whole.includes(span), `the lesson does not carry ${book} ${ch}:${n}`).toBe(true);
  });
  const spans = L ? spansOf(L) : [];
  it('carries a substantial number of referenced spans', () => {
    expect(spans.length).toBeGreaterThan(300);
  });
  it('every referenced span is verbatim in the verse it cites, case and all', () => {
    const bad = verbatimFaults(L);
    expect(bad, `not His words as written:\n${bad.join('\n')}`).toEqual([]);
  });
  it('would catch an altered quotation (proven-to-catch)', () => {
    const altered = { ...L, levels: { ...L.levels, child: L.levels.child.replace('your terror is fallen upon us', 'we are all afraid of you') } };
    expect(altered.levels.child).not.toBe(L.levels.child);
    expect(verbatimFaults(altered).some((f) => f.includes('Joshua 2:9'))).toBe(true);
    // And the bright line of DR-0076: never substitute Yahweh INTO a quotation.
    const yahwehed = { ...L, lesson: L.lesson.replace('but the word of our God shall stand for ever', 'but the word of Yahweh shall stand for ever') };
    expect(yahwehed.lesson).not.toBe(L.lesson);
    expect(verbatimFaults(yahwehed).some((f) => f.includes('Isaiah 40:8'))).toBe(true);
  });
  it('uses the corpus apostrophe inside quotations', () => {
    for (const s of spans) expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a quotation`).toBe(false);
  });
  it('marks no elision and recites no record id to a reader', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });
  it('every anchor reference is named in the lesson, so Search it out can reach it', () => {
    for (const ref of L.anchor.ref.split(';').map((r) => r.trim())) {
      const head = ref.replace(/-\d+$/, '');
      expect(L.lesson.includes(`(${head})`) || L.lesson.includes(`(${head}`), `${ref} is anchored but never named`).toBe(true);
    }
  });
});

describe('L260 — four bands, each carrying the whole message', () => {
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

describe('L260 — sends the reader all three ways, in the lesson AND in every band', () => {
  it('no place is missing a direction', () => {
    expect(placesMissingDirections(L)).toEqual([]);
  });
  it.each(['lesson', ...BANDS])('%s carries all three directions by itself', (place) => {
    const text = place === 'lesson' ? L.lesson : L.levels[place];
    expect(missingDirections(text), `${place} is short a direction`).toEqual([]);
  });
  it('would name the one band whose upward line was stripped, while the module still read green (proven-to-catch)', () => {
    // The senior band carries the children-to-parents direction in exactly ONE
    // sentence, so removing that one sentence is the surgical break. (Its
    // friend and parent directions each live in two sentences, so cutting one
    // of those proves nothing — measured before this break was chosen.)
    const stripped = {
      ...L,
      levels: {
        ...L.levels,
        senior: L.levels.senior.replace('ask your parents, or tell the generation above you if it remains,', 'consider quietly'),
      },
    };
    expect(stripped.levels.senior).not.toBe(L.levels.senior);
    const named = placesMissingDirections(stripped);
    expect(named.map((x) => x.place)).toContain('senior');
    expect(named.find((x) => x.place === 'senior').missing).toContain('children');
    // The module-level view still reads green, which is exactly why the
    // per-band check had to exist (DR-0795).
    expect(hasAllThree(stripped)).toBe(true);
  });
  it('every place carries the skill and the rhythm', () => {
    for (const place of ['lesson', ...BANDS, 'inApp']) {
      const text = place === 'inApp' ? L.inApp : (place === 'lesson' ? L.lesson : L.levels[place]);
      expect(/retell/i.test(text), `${place} drops the retell skill`).toBe(true);
      expect(/listen(?:ing)? (?:all the way )?to the end|listen all the way/i.test(text), `${place} drops listening to the end`).toBe(true);
      expect(/one friend this week/i.test(text), `${place} drops the one-friend rhythm`).toBe(true);
      expect(text.includes('(Deuteronomy 6:7)'), `${place} drops the four places`).toBe(true);
    }
  });
  it('measures growth the Word’s way, qualitative and quantitative', () => {
    for (const place of ['lesson', ...BANDS]) {
      const text = place === 'lesson' ? L.lesson : L.levels[place];
      expect(text.includes('(Galatians 5:22)'), `${place} drops the fruit`).toBe(true);
      expect(text.includes('(Luke 2:52)'), `${place} drops His own measure of growing`).toBe(true);
    }
  });
});

describe('L260 — two stories, and Yahweh in our own voice', () => {
  it('carries two real stories, one light and one solemn, with no double-quoted span', () => {
    const real = (L.stories || []).filter((s) => s.kind === 'parable' || s.kind === 'testimony');
    expect(real.length).toBeGreaterThanOrEqual(2);
    const tones = L.stories.map((s) => s.tone);
    expect(tones).toContain('light');
    expect(tones).toContain('solemn');
    for (const s of L.stories) expect(String(s.body)).not.toMatch(/"/);
  });
  it('the stories teach this lesson rather than decorating it', () => {
    const [light, solemn] = ['light', 'solemn'].map((tone) => L.stories.find((s) => s.tone === tone));
    expect(light.title).toBe('The Fence and the Postcard');
    expect(/could tell them the river and the week and the lantern, and it could not tell them the name/.test(light.body)).toBe(true);
    expect(solemn.title).toBe('The Ledger at the Courthouse');
    expect(/had to buy his own credit back at full price/.test(solemn.body)).toBe(true);
  });
  it.each(ALL)('%s names Him by covenant name and never the generic in our prose', (k) => {
    const ours = ourProseOnly(TEXTS[k]);
    expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
    expect(/\bGod(?:'|’)?s?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
  });
  it('the generic-name check would catch "God" in our voice (proven-to-catch)', () => {
    expect(/\bGod(?:'|’)?s?\b/.test(ourProseOnly(`${TEXTS.child} Then God gave the land.`))).toBe(true);
  });
  it('never capitalises the adversary, anywhere in the module', () => {
    const blob = JSON.stringify(L);
    for (const bad of ['Satan', 'Lucifer', 'The Devil', 'Baal']) {
      expect(blob.includes(bad), `capitalises "${bad}"`).toBe(false);
    }
  });
  it('the quiz answers are not all in one position', () => {
    const at = L.quiz.questions.map((q) => q.answer);
    expect(new Set(at).size).toBeGreaterThan(1);
    for (const q of L.quiz.questions) expect(q.options[q.answer]).toBeTruthy();
  });
});
