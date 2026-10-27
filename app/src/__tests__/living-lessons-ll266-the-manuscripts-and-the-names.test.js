// @vitest-environment node
// =============================================================================
// L266 — "The Manuscripts and the Names — the Word Testified First": built from
// a Wes Huff conference lecture Darrell sent into the app's research road for a
// lesson, which then waited about 91 hours in the queue. DR-1229.
// =============================================================================
// THE ROAD, NAMED (DR-1206). agent_inbox row f64f12ab-0c70-476e-a424-0ae9e03d0d68
// (Darrell's own phone account), research item 03b89afb-d00e-45d7-a813-a74d451f896a.
// The research road ANSWERED on that row: a 4,985-word youtube-asr reading,
// fetched on the NAS because the CI path is YouTube-IP-blocked, with NO
// timestamps (the fetcher joins caption segments), so a quotation can be
// attributed to the speaker but never cited to a minute mark. It is a machine's
// hearing, and this lesson renders it for meaning (DR-0331) rather than
// repeating its mis-hearings — "anom of Canterbury" is Anselm, "Ferdinand
// Bower" is Ferdinand Christian Baur, "oxar rinkus" is Oxyrhynchus, and the
// captions' "the seven books that we call the New Testament" is the same
// speaker's own 27 from earlier in the same lecture.
//
// A SECOND ROW SUPPLIED THE ASSET PLAN AND IS NOT TAUGHT HERE (DR-1206). Row
// f57f16a0-1bd9-42dd-88af-0c24f06525b1, research item
// 7bf0b019-cda2-4590-a233-1a6104cbe0ce, is a production plan for this same
// lecture — where to obtain artifact images (the Manchester LUNA viewer for
// P52, CSNTM for P66 and GA 777, the Biblical Archaeology Society library for
// the Pilate Stone and the Alexamenos graffito, codexsinaiticus.org) with
// access and copyright notes. Its research road returned NOTHING (it answered
// 413), so it carries only Darrell's own text. It is a plan, not a teaching,
// and no line of it is taught as lesson content.
//
// WORD FIRST, EVIDENCE SECOND — AND THAT ORDER IS THE LESSON. The spine is the
// Word's own claim to be eyewitness testimony in writing: Luke 1:1-4, John
// 21:24, 2 Peter 1:16, 1 John 1:1, with John 19:35, Acts 1:3, 1 Corinthians
// 15:6 and Acts 26:26 beside them, and Matthew 24:35 as the guarantee that
// needs no artifact. The four verses of the spine are pinned by name below.
//
// WHAT THIS HOUSE VERIFIED RATHER THAN RELAYED (DR-0076, DR-0192, DR-0100).
// Established, stated plainly: P52 is Greek Papyrus 457 at the John Rylands
// Library, text from John 18, written on both sides (a codex leaf), identified
// in 1934 by C. H. Roberts, among the earliest known New Testament fragments;
// the Caesarea block was found June 1961 in the theatre by Frova's expedition
// and its surviving letters give Pilate's office, standardly read as prefect of
// Judaea; Tacitus called him procurator; the Alexamenos graffito was found on
// the Palatine in 1857 and its holding museum dates it to the Severan period,
// around AD 200; Bauckham's 2006 study set the Gospel names against Tal Ilan's
// lexicon of Jewish names in Palestine and the congruence holds while Egyptian
// material differs.
// Contested, named NARROWLY: every date for P52 rests on palaeography alone —
// Roberts proposed the first half of the second century, Orsini and Clarysse
// (2012) about AD 125-175, and Nongbri (2005; 2020) argues the precision is
// unsupportable and the comparanda reach later; his view is not universally
// accepted and the second-century placement remains standard. The lesson
// therefore pins the honest formulation and NEVER the figure AD 125, because
// overselling P52 is the single commonest error in popular apologetics and
// DR-0192 exists to catch exactly it. Also narrowed: the tidy Hegelian story
// about Baur is disputed by specialists, and the popular "AD 160" is sharper
// than what he wrote.
// NOT VERIFIED, so NOT TAUGHT: the lecture's figure of 260 sheep for Codex
// Sinaiticus (the project's own description says primarily calf skin, and no
// source found gives that number); the claim that Damaris and Lydia are
// attested nowhere and that 10% of names in southern Asia Minor were unique;
// the exact day in January 1897 for P1. None of the three appears anywhere in
// this lesson, and the facilitator notes forbid asserting the omitted figure.
// NAMED AS THE SOURCE NAMES HIM (DR-1206, the World Issues 21 correction): Wes
// Huff, at the Apologetics Canada Ontario Conference. No faith label,
// affiliation or motive beyond what the material states.
//
// WHAT THE CHECKS MEASURED BEFORE COMMIT (scratchpad harness over the draft,
// before it touched the catalog): 272 referenced spans, 0 verbatim faults;
// fullness 0.67 / 0.75 / 0.72 / 1.01 against floors 0.5 / 0.6 / 0.6 / 0.6;
// authored-prose grades child 1.59, youth 6.85, teen 10.33, senior 11.40 (the
// ladder rises by more than one at each step; the child band is under 5.0);
// worst band overlap 0.24; every band names the lesson; every place carries all
// three directions; 35 straight apostrophes converted to the corpus form before
// the splice, none of them inside a quotation.
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

const ID = 'll266-the-manuscripts-and-the-names-the-word-testified-first';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const ALL = Object.keys(TEXTS);
const whole = ALL.map((k) => TEXTS[k]).join('\n');
const CLOSING = '"But these are written, that ye might believe that Jesus is the Christ, the Son of God; and that believing ye might have life through his name" (John 20:31).';

// A bare single-year ASSERTION of P52's date — the over-claim DR-0192 exists to
// catch. It is deliberately not a search for the string: see the case below.
const ASSERTS_125 = /(?:\bis\b|\bwas\b|dated to|dates to|comes from|belongs to)\s+(?:about\s+|roughly\s+|around\s+|approximately\s+|c\.\s*)?AD 125\b(?! to)/i;
// The three claims this house could not verify. A trailing \b after `%` can
// never match (a percent sign is not a word character), which the first version
// of this list got wrong and the proven-to-catch case below caught.
const UNVERIFIED = [
  [/260 sheep/i, 'the Codex Sinaiticus hide count', 'It took the hides of 260 sheep to make.'],
  [/Damaris/i, 'the unique-Greek-names claim', 'Luke names Damaris and Lydia, found nowhere else.'],
  [/\b10 ?(?:%|per cent|percent)/i, 'the Asia Minor name statistic', 'In that region 10% of people had unique names.'],
  [/January 12/i, 'an unconfirmed discovery day', 'P1 was dug up on January 12th, 1897.'],
];

// THE SPINE. The Word's own claim to be eyewitness testimony, in writing, and
// the promise that needs no artifact. Every band carries all of these.
const SPINE = [
  ['the eyewitnesses delivered it', 'Luke', 1, 2, 'which from the beginning were eyewitnesses, and ministers of the word'],
  ['a Gospel aims at certainty', 'Luke', 1, 4, 'That thou mightest know the certainty of those things, wherein thou hast been instructed'],
  ['the disciple wrote it and we know it is true', 'John', 21, 24, 'and we know that his testimony is true'],
  ['not cunningly devised fables', '2 Peter', 1, 16, 'For we have not followed cunningly devised fables'],
  ['our hands have handled', '1 John', 1, 1, 'which we have seen with our eyes, which we have looked upon, and our hands have handled, of the Word of life'],
  ['His words shall not pass away', 'Matthew', 24, 35, 'Heaven and earth shall pass away, but my words shall not pass away'],
  ['the word of our God shall stand for ever', 'Isaiah', 40, 8, 'but the word of our God shall stand for ever'],
  ['write the vision, make it plain', 'Habakkuk', 2, 2, 'Write the vision, and make it plain upon tables, that he may run that readeth it'],
  ['printed in a book', 'Job', 19, 23, 'oh that they were printed in a book'],
  ['the names carry their qualifiers', 'Matthew', 10, 2, 'The first, Simon, who is called Peter, and Andrew his brother'],
  ['a second mouth establishes a matter', 'Deuteronomy', 19, 15, 'at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established'],
  ['Pilate, the governor', 'Luke', 3, 1, 'Pontius Pilate being governor of Judaea'],
  ['Christ crucified, a stumblingblock and foolishness', '1 Corinthians', 1, 23, 'But we preach Christ crucified, unto the Jews a stumblingblock, and unto the Greeks foolishness'],
  ['the confession the mockery was aimed at', 'John', 20, 28, 'My Lord and my God'],
  ['the ceiling on evidence', 'Luke', 16, 31, 'If they hear not Moses and the prophets, neither will they be persuaded, though one rose from the dead'],
  ['faith is the evidence of things not seen', 'Hebrews', 11, 1, 'Now faith is the substance of things hoped for, the evidence of things not seen'],
  ['they searched the scriptures daily', 'Acts', 17, 11, 'and searched the scriptures daily, whether those things were so'],
  ['teach them diligently', 'Deuteronomy', 6, 7, 'And thou shalt teach them diligently unto thy children'],
  ['iron sharpeneth iron', 'Proverbs', 27, 17, 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend'],
  ['Love moved first', 'John', 3, 16, 'he gave his only begotten Son'],
  ['these are written that ye might believe', 'John', 20, 31, 'But these are written, that ye might believe that Jesus is the Christ, the Son of God'],
];

const ELSEWHERE = [
  ['many have taken in hand', 'Luke', 1, 1, 'Forasmuch as many have taken in hand to set forth in order a declaration'],
  ['perfect understanding from the very first', 'Luke', 1, 3, 'having had perfect understanding of all things from the very first'],
  ['he that saw it bare record', 'John', 19, 35, 'And he that saw it bare record, and his record is true'],
  ['many infallible proofs', 'Acts', 1, 3, 'he shewed himself alive after his passion by many infallible proofs'],
  ['above five hundred brethren at once', '1 Corinthians', 15, 6, 'he was seen of above five hundred brethren at once'],
  ['not done in a corner', 'Acts', 26, 26, 'for this thing was not done in a corner'],
  ['graven with an iron pen', 'Job', 19, 24, 'That they were graven with an iron pen and lead in the rock for ever'],
  ['the record is a selection', 'John', 21, 25, 'And there are also many other things which Jesus did'],
  ['the words in thine heart', 'Deuteronomy', 6, 6, 'And these words, which I command thee this day, shall be in thine heart'],
  ['all flesh is as grass', '1 Peter', 1, 24, 'For all flesh is as grass, and all the glory of man as the flower of grass'],
  ['the word of the Lord endureth for ever', '1 Peter', 1, 25, 'But the word of the Lord endureth for ever'],
  ['settled in heaven', 'Psalms', 119, 89, 'For ever, O LORD, thy word is settled in heaven'],
  ['purified seven times', 'Psalms', 12, 6, 'The words of the LORD are pure words: as silver tried in a furnace of earth, purified seven times'],
  ['Thou shalt preserve them', 'Psalms', 12, 7, 'Thou shalt keep them, O LORD, thou shalt preserve them from this generation for ever'],
  ['I will hasten my word', 'Jeremiah', 1, 12, 'for I will hasten my word to perform it'],
  ['magnified above all His name', 'Psalms', 138, 2, 'for thou hast magnified thy word above all thy name'],
  ['the untagged names', 'Matthew', 10, 3, 'Philip, and Bartholomew; Thomas, and Matthew the publican'],
  ['Simon the Canaanite and Judas Iscariot', 'Matthew', 10, 4, 'Simon the Canaanite, and Judas Iscariot, who also betrayed him'],
  ['a certain priest named Zacharias', 'Luke', 1, 5, 'a certain priest named Zacharias, of the course of Abia'],
  ['Annas and Caiaphas', 'Luke', 3, 2, 'Annas and Caiaphas being the high priests'],
  ['Pilate the governor', 'Matthew', 27, 2, 'and delivered him to Pontius Pilate the governor'],
  ['a decree from Caesar Augustus', 'Luke', 2, 1, 'there went out a decree from Caesar Augustus, that all the world should be taxed'],
  ['Cyrenius, governor of Syria', 'Luke', 2, 2, 'And this taxing was first made when Cyrenius was governor of Syria'],
  ['Gallio, the deputy of Achaia', 'Acts', 18, 12, 'And when Gallio was the deputy of Achaia'],
  ['the print of the nails', 'John', 20, 25, 'Except I shall see in his hands the print of the nails'],
  ['the accusation over His head', 'Matthew', 27, 37, 'And set up over his head his accusation written, THIS IS JESUS THE KING OF THE JEWS'],
  ['Pilate wrote a title', 'John', 19, 19, 'And Pilate wrote a title, and put it on the cross'],
  ['in Hebrew, and Greek, and Latin', 'John', 19, 20, 'and it was written in Hebrew, and Greek, and Latin'],
  ['the enthroned Son', 'Hebrews', 1, 8, 'Thy throne, O God, is for ever and ever'],
  ['the Lamb of Yahweh', 'John', 1, 29, 'Behold the Lamb of God, which taketh away the sin of the world'],
  ['every knee shall bow', 'Philippians', 2, 10, 'That at the name of Jesus every knee should bow'],
  ['every tongue shall confess', 'Philippians', 2, 11, 'And that every tongue should confess that Jesus Christ is Lord'],
  ['blessed are they that have not seen', 'John', 20, 29, 'blessed are they that have not seen, and yet have believed'],
  ['the worlds were framed by His word', 'Hebrews', 11, 3, 'Through faith we understand that the worlds were framed by the word of God'],
  ['spiritually discerned', '1 Corinthians', 2, 14, 'neither can he know them, because they are spiritually discerned'],
  ['without excuse', 'Romans', 1, 20, 'For the invisible things of him from the creation of the world are clearly seen'],
  ['by Him all things consist', 'Colossians', 1, 17, 'And he is before all things, and by him all things consist'],
  ['prove all things', '1 Thessalonians', 5, 21, 'Prove all things; hold fast that which is good'],
  ['ready always to give an answer', '1 Peter', 3, 15, 'and be ready always to give an answer to every man that asketh you a reason of the hope that is in you with meekness and fear'],
  ['his neighbour cometh and searcheth him', 'Proverbs', 18, 17, 'He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him'],
  ['rightly dividing the word of truth', '2 Timothy', 2, 15, 'a workman that needeth not to be ashamed, rightly dividing the word of truth'],
  ['the honour of kings', 'Proverbs', 25, 2, 'but the honour of kings is to search out a matter'],
  ['all scripture is given by inspiration', '2 Timothy', 3, 16, 'All scripture is given by inspiration of God'],
  ['thy word is truth', 'John', 17, 17, 'Sanctify them through thy truth: thy word is truth'],
  ['the word of their testimony', 'Revelation', 12, 11, 'And they overcame him by the blood of the Lamb, and by the word of their testimony'],
];

describe('L266 exists, is numbered, and is dated the day it was built', () => {
  // DELIBERATELY NOT "is the last lesson" and NOT "267 is absent": a pin on the
  // catalog never growing is the one pin certain to break, and other builders
  // are working ll259 to ll265 and ll267 in parallel with this one.
  it('is in the catalog exactly once, with all four bands', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    expect(Object.keys(L.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
  });
  it('claims 266 exactly once and fills no number that is not its own', () => {
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 266)).toHaveLength(1);
    expect(Math.max(...claimed)).toBeGreaterThanOrEqual(266); // a floor, never an equality
    for (const n of [211, 212]) expect(claimed.includes(n), `${n} is not this lesson’s to fill`).toBe(false);
  });
  it('carries 2026-10-27, the day it was built, at or after L258’s', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-27');
    expect(LIVING_LESSONS_ADDED['ll258-he-gave-us-everything-we-need-until-we-want-what-he-wants'] <= LIVING_LESSONS_ADDED[ID]).toBe(true);
  });
  it('names the road honestly: Darrell sent it into the app, and the speaker is named as the source names him', () => {
    expect(L.lesson).toContain('Darrell sent a conference lecture into the PoeTech app');
    expect(L.lesson).toContain('Wes Huff at the Apologetics Canada Ontario Conference');
    expect(L.lesson).toContain('rendered here for meaning');
    // The one thing the lesson must never do with a named real person (the
    // World Issues 21 correction): attach a label the source did not state.
    expect(/Wes Huff[^.]{0,120}\b(evangelical|protestant|catholic|apologist for|funded|paid|agenda)\b/i.test(whole)).toBe(false);
  });
  it('the adult lesson walks ten movements, Word first and evidence second', () => {
    const order = [
      'ONE. THE WORD TESTIFIED FIRST',
      'TWO. HE PUT IT IN WRITING, ON PURPOSE',
      'THREE. THE PROMISE THAT NEEDS NO ARTIFACT',
      'FOUR. A SCRAP THE SIZE OF A CARD',
      'FIVE. THE NAMES THEY COULD NOT HAVE GUESSED',
      'SIX. WHERE THE FAMOUS WRITERS MISSED',
      'SEVEN. EVEN THE MOCKERS TESTIFY',
      'EIGHT. EVIDENCE HAS A CEILING, AND HE SAID WHERE IT IS',
      'NINE. SEARCHING IT OUT IS NOT DOUBT',
      'TEN. THE PRACTICE',
    ];
    let at = -1;
    for (const h of order) {
      const i = L.lesson.indexOf(h);
      expect(i, `${h} is missing or out of order`).toBeGreaterThan(at);
      at = i;
    }
    // The order is load-bearing: no artifact is named before the Word's claim.
    expect(L.lesson.indexOf('ONE. THE WORD TESTIFIED FIRST')).toBeLessThan(L.lesson.indexOf('P52'));
  });
});

describe('L266 — the four artifacts are neither oversold nor hedged (DR-0100, DR-0192)', () => {
  it('states what is established about P52 plainly, in every band', () => {
    for (const k of ALL) {
      expect(/Rylands/.test(TEXTS[k]), `${k} drops the library that holds it`).toBe(true);
      expect(/1934/.test(TEXTS[k]), `${k} drops the year it was identified`).toBe(true);
      expect(/both sides/.test(TEXTS[k]), `${k} drops the codex detail`).toBe(true);
    }
  });
  it('names the dating dispute narrowly in every band, and never asserts AD 125', () => {
    for (const k of ALL) {
      expect(/handwriting/i.test(TEXTS[k]), `${k} never says the date rests on handwriting`).toBe(true);
      expect(/Nongbri/.test(TEXTS[k]), `${k} never names the specialist who disputes the precision`).toBe(true);
      expect(/second century|second hundred years/i.test(TEXTS[k]), `${k} never gives the standard placement`).toBe(true);
    }
    // THE BRIGHT LINE OF THIS LESSON. Overselling P52's date is the commonest
    // error in popular apologetics; the range may be reported and the figure
    // may be WARNED AGAINST, but it may never be asserted.
    //
    // THE FIRST VERSION OF THIS CHECK WAS WRONG AND THE FLAG IS KEPT (DR-0621).
    // It forbade the STRING `AD 125` anywhere, and went red on its own lesson:
    // all six occurrences are warnings — "if your confidence was riding on AD
    // 125", "an apologetic erected upon AD 125 collapses", "do not let the room
    // leave with AD 125 as a settled figure" — plus a quiz distractor that
    // exists precisely to be the wrong answer. A gate that cannot tell a
    // warning from a claim would have forced the lesson to stop warning, which
    // is the opposite of what DR-0192 wants. So the check reads for the
    // ASSERTION, in the texts a reader actually reads.
    for (const k of ALL) {
      expect(ASSERTS_125.test(TEXTS[k]), `${k} asserts a bare AD 125`).toBe(false);
    }
    expect(/(firmly|certainly|definitely|proven|precisely) dated/i.test(ourProseOnly(whole.replace(/"[^"]*"/g, ' ')) + ALL.map((k) => TEXTS[k]).join(' '))).toBe(false);
    // And the single-year option in the quiz is a distractor, never the answer.
    const q = L.quiz.questions.find((x) => x.options.some((o) => /AD 125/.test(o)));
    expect(q, 'the quiz never puts the over-claim in front of the reader to reject').toBeTruthy();
    expect(/AD 125/.test(q.options[q.answer]), 'the AD 125 option is marked correct').toBe(false);
  });
  it('the AD-125 check tells a warning from a claim (proven-to-catch, both directions)', () => {
    expect(ASSERTS_125.test('The fragment is dated to AD 125.')).toBe(true);
    expect(ASSERTS_125.test('The scrap is AD 125.')).toBe(true);
    expect(ASSERTS_125.test('It dates to about AD 125.')).toBe(true);
    // The warnings this lesson actually carries must stay legal.
    expect(ASSERTS_125.test('if your confidence was riding on AD 125, the first person who quotes Nongbri at you wins')).toBe(false);
    expect(ASSERTS_125.test('An apologetic erected upon AD 125 collapses')).toBe(false);
    expect(ASSERTS_125.test('Do not let the room leave with AD 125 as a settled figure.')).toBe(false);
    expect(ASSERTS_125.test('a range of about AD 125 to 175')).toBe(false);
  });
  it('gives the onomastic argument its real force AND its real limit, in every band', () => {
    for (const k of ALL) {
      expect(/match/i.test(TEXTS[k]), `${k} drops the congruence`).toBe(true);
      expect(/(does not prove|does not tell us whose hand|not prove which hand|not a demonstration of authorship|not authorship)/i.test(TEXTS[k]), `${k} drops the limit`).toBe(true);
    }
    expect(/Bauckham/.test(whole)).toBe(true);
    expect(/Tal Ilan/.test(whole)).toBe(true);
    expect(/Galilee/.test(whole), 'the Palestine-not-Galilee criticism is never named').toBe(true);
  });
  it('says prefect for the stone and procurator for Tacitus, and admits the restoration', () => {
    expect(L.lesson).toContain('prefect of Judaea');
    expect(L.lesson).toContain('procurator');
    expect(/restored from the (?:broken|damaged) stone/i.test(L.lesson), 'the lesson does not admit the title is partly restored').toBe(true);
    expect(/1961/.test(L.lesson)).toBe(true);
  });
  it('dates the Alexamenos graffito to around AD 200 and never calls it the earliest evidence', () => {
    for (const k of ALL) expect(/AD 200|a long time after Jesus/.test(TEXTS[k]), `${k} misdates or undates the graffito`).toBe(true);
    expect(/earliest evidence of anything|not the first proof/i.test(whole)).toBe(true);
    expect(/earliest evidence that (?:believers|Christians) worshipped/i.test(ourProseOnly(L.lesson))).toBe(false);
  });
  // Nothing a reader reads, and nothing the facilitator is handed, may carry a
  // claim this house could not verify (DR-0076 §8: omitted, not hedged).
  const EVERY_STRING = (() => {
    const out = [];
    const walk = (node) => {
      if (typeof node === 'string') out.push(node);
      else if (Array.isArray(node)) node.forEach(walk);
      else if (node && typeof node === 'object') Object.values(node).forEach(walk);
    };
    walk(L);
    return out.join('\n');
  })();
  it.each(UNVERIFIED)('teaches none of %s — %s', (re, what) => {
    expect(re.test(EVERY_STRING), `${what} is taught although it was never verified`).toBe(false);
  });
  it.each(UNVERIFIED)('would catch %s coming back (proven-to-catch)', (re, _what, smuggled) => {
    expect(re.test(`${EVERY_STRING} ${smuggled}`)).toBe(true);
  });
});

describe('L266 — every quoted span is the verse', () => {
  it.each([...SPINE, ...ELSEWHERE])('%s — %s %s:%s', (_why, book, ch, n, span) => {
    const v = verse(book, ch, n);
    expect(v, `${book} ${ch}:${n} resolves`).toBeTruthy();
    expect(v.includes(span), `the span is not in ${book} ${ch}:${n}`).toBe(true);
    expect(whole.includes(span), `the lesson does not carry ${book} ${ch}:${n}`).toBe(true);
  });
  const spans = L ? spansOf(L) : [];
  it('finds a substantial number of referenced spans', () => {
    expect(spans.length).toBeGreaterThan(250);
  });
  it('every referenced span is verbatim in the verse it cites, case and all', () => {
    const bad = verbatimFaults(L);
    expect(bad, `not His words as written:\n${bad.join('\n')}`).toEqual([]);
  });
  it('would catch an altered quotation (proven-to-catch)', () => {
    const altered = { ...L, levels: { ...L.levels, child: L.levels.child.replace('but my words shall not pass away"', 'but my words will never go away"') } };
    expect(altered.levels.child).not.toBe(L.levels.child);
    expect(verbatimFaults(altered).some((f) => f.includes('Matthew 24:35'))).toBe(true);
    // The DR-0076 bright line: Yahweh in our prose, never substituted into a quote.
    const yahwehed = { ...L, lesson: L.lesson.replace('but the word of our God shall stand for ever', 'but the word of our Yahweh shall stand for ever') };
    expect(yahwehed.lesson).not.toBe(L.lesson);
    expect(verbatimFaults(yahwehed).some((f) => f.includes('Isaiah 40:8'))).toBe(true);
  });
  it('uses the corpus apostrophe inside quotations', () => {
    for (const s of spans) expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a quotation`).toBe(false);
  });
  it('marks no elision and recites no record', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });
  it('every anchor reference is named in the lesson, and the shelf verse is the first anchor', () => {
    for (const ref of L.anchor.ref.split(';').map((r) => r.trim())) {
      const head = ref.replace(/-\d+$/, '');
      expect(L.lesson.includes(`(${head})`) || L.lesson.includes(`(${head}`), `${ref} is anchored but never named`).toBe(true);
    }
    expect(L.anchor.ref.startsWith('Luke 1:2')).toBe(true);
  });
  it('each story’s verse is one the lesson anchors on', () => {
    for (const s of L.stories) expect(L.anchor.ref.split(';').map((r) => r.trim())).toContain(s.verse);
  });
});

describe('L266 — four bands, each carrying the whole message', () => {
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
  it('sends the reader all three ways in every place, and would report a band that stops (proven-to-catch)', () => {
    expect(placesMissingDirections(L)).toEqual([]);
    const cut = { ...L, levels: { ...L.levels, youth: L.levels.youth.replace(/Friend to friend, ask one friend[^.]*\./, 'Think about it.') } };
    expect(cut.levels.youth).not.toBe(L.levels.youth);
    const gaps = placesMissingDirections(cut);
    expect(gaps.some((p) => p.place === 'youth' && p.missing.includes('friends'))).toBe(true);
    // The whole-module check still reads green on the same object, which is why
    // the per-band check has to exist (DR-0795).
    expect(hasAllThree(cut)).toBe(true);
  });
  // The close sends the reader back into the text, in every place (DR-0734).
  it.each(ALL)('%s closes on John 20:31, the reason it was written down', (k) => {
    expect(TEXTS[k].trim().endsWith(CLOSING), `${k} does not close on John 20:31`).toBe(true);
  });
  it.each(ALL)('%s carries all three directions in the lesson’s own words', (k) => {
    expect(/Parents, ask your children/.test(TEXTS[k]) || /parents, ask the children/i.test(TEXTS[k]), `${k} drops parents to children`).toBe(true);
    expect(/ask your parents/i.test(TEXTS[k]) || /Ask your own parents/i.test(TEXTS[k]), `${k} drops children to parents`).toBe(true);
    expect(/Friend to friend/.test(TEXTS[k]), `${k} drops friend to friend`).toBe(true);
    expect(/\(Deuteronomy 6:7\)/.test(TEXTS[k]), `${k} drops the rhythm verse`).toBe(true);
    expect(/\(Proverbs 27:17\)/.test(TEXTS[k]), `${k} drops the friend verse`).toBe(true);
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

describe('L266 — two stories, the full teaching shape, and Yahweh in our voice', () => {
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
    expect(light.title).toBe('The Receipt in the Coat Pocket');
    // The light parable's whole point is the order this lesson teaches.
    expect(/the receipt had not made the story true/.test(light.body)).toBe(true);
    expect(solemn.title).toBe('One More Proof');
    expect(/a place to stand while he decided not to kneel/.test(solemn.body)).toBe(true);
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
  it('the facilitator is told to hold the line on both the overclaim and the omitted figure', () => {
    expect(L.facilitator.howToRun).toContain('Do not assert a sharper date for P52');
    expect(L.facilitator.howToRun).toContain('could not be verified');
    expect(L.facilitator.howToRun).toContain('hedging a settled thing');
  });
  it.each(ALL)('%s names Him by covenant name and never the generic in our prose', (k) => {
    const ours = ourProseOnly(TEXTS[k]);
    expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
    expect(/\bGod(?:'s|’s)?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
  });
  it('the generic-name check would catch "God" in our voice (proven-to-catch)', () => {
    expect(/\bGod(?:'s|’s)?\b/.test(ourProseOnly(`${TEXTS.child} Then God was glad.`))).toBe(true);
  });
  it('confesses Jesus as the Lamb of Yahweh in our voice, with John 1:29 beside it', () => {
    expect(L.lesson).toContain('the Lamb of Yahweh');
    expect(L.lesson).toContain('(John 1:29)');
  });
  it('never capitalises an adversary name, anywhere', () => {
    for (const bad of ['Satan', 'Lucifer', 'The Devil', 'Baal']) {
      expect(whole.includes(bad), `${bad} is capitalised`).toBe(false);
    }
  });
  it('the quiz answers are not all in one position', () => {
    const at = L.quiz.questions.map((q) => q.answer);
    expect(new Set(at).size).toBeGreaterThan(1);
    for (const q of L.quiz.questions) expect(q.options[q.answer]).toBeTruthy();
  });
});
