// @vitest-environment node
// =============================================================================
// L252 — "This Life Is the Curriculum": what Darrell sent into the house on
// 2026-10-18, built the same session (a spoken teaching is build input).
// DR-1100.
// =============================================================================
// He sent fifty-two messages, one after another, while it was being built.
// The first began and ended with the word "Lesson": existing is Yahweh's Way
// of authoring our lives; this life is the curriculum; made in an image that
// lets a person be His temple, as the angels were not; humble yourself to His
// narrative and He directs your paths; the Godhead; deeper than a contract;
// knowing Him is the most important leadership metric; the beam in your own
// eye; the One inside His temple who knocks on the door of the heart. The
// rest followed: your life is the evidence; seated in heavenly places now;
// opposition is bread; the Godhead has never not agreed; one, like a healthy
// family; the curriculum of families, so the soul can decide about the Son;
// warning before destruction is honourable; He cannot lie, so start with the
// Word; study to show yourself; the beauty of the One who framed the worlds;
// same nature, Ways and skills; not robbery; before Abraham was, I AM; the I
// AM family adopts us; eternal and never less; humble, meek, strength under
// control, all authority, power, mighty; His Way is so high, He made us and
// we do not know how, and collectively we are still not competent to agree on
// what He said; the Truth is talking to us and obeying Him wins in this life
// and the next, so die once, not twice; the second death is our own fault for
// not doing what Jesus asks in our hearts, and no man can say He did not draw
// him; He numbers our hairs and sees the heart; metanoia the way The Way
// says; healed by obeying His voice; all are made to hear Him and must still
// choose; actions are weighed; the great cloud of witnesses, explained by the
// Word and never worshipped; press toward the mark, for the prize; no pride
// against the Word; the beam out first, using the Word; Yahweh looks for
// profit and so should we, never at the cost of the soul; He measures
// differently; our methods are still sound, but He is patient with our frame
// and not hiding; reading the Word His Way is the skill; Love covers a
// multitude of sins because it has to, if we are to survive sanctification;
// humans receive no glory; the Godhead did all the work; a mind full of
// souls; He just wants community; profitable community, His Way of life; and
// the rod: take the rod and speak (Numbers 20:8), the rod is the Word and the
// canon the standard, the rod of iron against this one, spare the rod (a
// poet's line; Proverbs 13:24 is the Word), and the rod of discipline beside
// the others: one sceptre (Hebrews 1:8), comfort, correction, iron.
// Rendered for meaning, not for his capitals (DR-0331).
//
// THE WORD EXPLAINS THE WORD (DR-0098), and this gate pins the spine in every
// place a reader reads: Acts 17:28 and Colossians 1:17 (we consist in Him),
// Genesis 1:27 and Hebrews 2:16 (the image, not angels), 1 Peter 1:12 (the
// angels desire to look into it), Romans 3:4 (let God be true, but every man
// a liar), Matthew 11:29 (meek and lowly), Matthew 28:18 (all power),
// Hebrews 9:27 with the second death (die once, not twice), John 12:32 (He
// draws all men), and every band closing on Revelation 3:20, the One who
// knocks.
//
// WHAT THE CHECKS CAUGHT WHILE WRITING, mechanical, before commit: Exodus
// 15:11 opens mid-verse in the KJV with a lower-case "who", and the first
// draft capitalised it; the verbatim check refused it. As the messages kept
// arriving the bands fell under their fullness floors against a growing adult
// lesson; the opening was compacted and the bands deepened in plainer
// sentences until they cleared (0.53 / 0.63 / 0.63 / 0.64).
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { fleschKincaidGrade, ourProseOnly, NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { placesMissingDirections } from '../lib/talk-together.js';
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

const ID = 'll252-this-life-is-the-curriculum-made-to-be-his-temple';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const ALL = Object.keys(TEXTS);
const whole = ALL.map((k) => TEXTS[k]).join('\n');
const CLOSING = '"Behold, I stand at the door, and knock: if any man hear my voice, and open the door, I will come in to him, and will sup with him, and he with me" (Revelation 3:20).';

// Every one of these is quoted in every band (the band test below pins that).
const IN_EVERY_BAND = [
  ['we live in Him', 'Acts', 17, 28, 'For in him we live, and move, and have our being'],
  ['by Him all things consist', 'Colossians', 1, 17, 'And he is before all things, and by him all things consist'],
  ['written in His book', 'Psalms', 139, 16, 'in thy book all my members were written'],
  ['the curriculum proves the heart', 'Deuteronomy', 8, 2, 'to humble thee, and to prove thee, to know what was in thine heart'],
  ['made in His image', 'Genesis', 1, 27, 'So God created man in his own image'],
  ['not the nature of angels', 'Hebrews', 2, 16, 'took not on him the nature of angels'],
  ['the angels are curious', '1 Peter', 1, 12, 'the angels desire to look into'],
  ['He directs our steps', 'Proverbs', 16, 9, 'A man’s heart deviseth his way: but the LORD directeth his steps'],
  ['every man a liar', 'Romans', 3, 4, 'let God be true, but every man a liar'],
  ['the Word stands', 'Isaiah', 40, 8, 'The grass withereth, the flower fadeth: but the word of our God shall stand for ever'],
  ['study to shew thyself', '2 Timothy', 2, 15, 'Study to shew thyself approved unto God'],
  ['the worlds were framed', 'Hebrews', 11, 3, 'the worlds were framed by the word of God'],
  ['none like Him', 'Isaiah', 46, 9, 'I am God, and there is none like me'],
  ['the Son declared Him', 'John', 1, 18, 'No man hath seen God at any time'],
  ['hear ye Him', 'Matthew', 17, 5, 'hear ye him'],
  ['seen the Father', 'John', 14, 9, 'he that hath seen me hath seen the Father'],
  ['written that ye might believe', 'John', 20, 31, 'But these are written, that ye might believe'],
  ['not robbery', 'Philippians', 2, 6, 'thought it not robbery to be equal with God'],
  ['honour the Son', 'John', 5, 23, 'even as they honour the Father'],
  ['the angels worship Him', 'Hebrews', 1, 6, 'And let all the angels of God worship him'],
  ['Jesus Christ is Lord', 'Philippians', 2, 11, 'Jesus Christ is Lord'],
  ['before Abraham, I am', 'John', 8, 58, 'Before Abraham was, I am'],
  ['the same for ever', 'Hebrews', 13, 8, 'Jesus Christ the same yesterday, and to day, and for ever'],
  ['meek and lowly', 'Matthew', 11, 29, 'for I am meek and lowly in heart'],
  ['all power', 'Matthew', 28, 18, 'All power is given unto me in heaven and in earth'],
  ['the mighty God', 'Isaiah', 9, 6, 'The mighty God'],
  ['the will of Him that sent me', 'John', 4, 34, 'My meat is to do the will of him that sent me'],
  ['We will make Our abode', 'John', 14, 23, 'we will come unto him, and make our abode with him'],
  ['the deceitful heart', 'Jeremiah', 17, 9, 'The heart is deceitful above all things'],
  ['the evidence of things not seen', 'Hebrews', 11, 1, 'the evidence of things not seen'],
  ['seated now', 'Ephesians', 2, 6, 'made us sit together in heavenly places in Christ Jesus'],
  ['they are bread for us', 'Numbers', 14, 9, 'are bread for us'],
  ['wait upon the LORD', 'Isaiah', 40, 31, 'But they that wait upon the LORD shall renew their strength'],
  ['the One who knocks', 'Revelation', 3, 20, 'Behold, I stand at the door, and knock'],
];
// Quoted somewhere in the lesson, not necessarily in every band.
const ELSEWHERE = [
  ['He cannot lie', 'Titus', 1, 2, 'that cannot lie'],
  ['not a man, that He should lie', 'Numbers', 23, 19, 'God is not a man, that he should lie'],
  ['the Shema', 'Deuteronomy', 6, 4, 'Hear, O Israel: The LORD our God is one LORD'],
  ['I and My Father are one', 'John', 10, 30, 'I and my Father are one'],
  ['that they all may be one', 'John', 17, 21, 'That they all may be one'],
  ['the Spirit of adoption', 'Romans', 8, 15, 'but ye have received the Spirit of adoption'],
  ['predestinated unto adoption', 'Ephesians', 1, 5, 'Having predestinated us unto the adoption of children'],
  ['wisdom dwells with prudence', 'Proverbs', 8, 12, 'I wisdom dwell with prudence'],
  ['know Thee', 'John', 17, 3, 'And this is life eternal, that they might know thee the only true God'],
  ['the mote and the beam', 'Matthew', 7, 3, 'And why beholdest thou the mote that is in thy brother’s eye'],
  ['your body is the temple', '1 Corinthians', 6, 19, 'know ye not that your body is the temple of the Holy Ghost'],
  ['no pleasure in the death of the wicked', 'Ezekiel', 33, 11, 'As I live, saith the Lord GOD, I have no pleasure in the death of the wicked'],
  ['He reveals before He acts', 'Amos', 3, 7, 'Surely the Lord GOD will do nothing, but he revealeth his secret unto his servants the prophets'],
  ['written in their hearts', 'Hebrews', 8, 10, 'I will put my laws into their mind, and write them in their hearts'],
  ['seen from creation', 'Romans', 1, 20, 'For the invisible things of him from the creation of the world are clearly seen'],
  ['who is like Thee', 'Exodus', 15, 11, 'who is like thee, glorious in holiness, fearful in praises, doing wonders?'],
  ['the beauty of the LORD', 'Psalms', 27, 4, 'to behold the beauty of the LORD'],
  ['twelve legions', 'Matthew', 26, 53, 'Thinkest thou that I cannot now pray to my Father'],
  ['He humbled Himself', 'Philippians', 2, 8, 'he humbled himself, and became obedient unto death, even the death of the cross'],
  ['he that ruleth his spirit', 'Proverbs', 16, 32, 'He that is slow to anger is better than the mighty'],
  // messages 23-25, sent while the lesson was being built
  ['not your ways', 'Isaiah', 55, 8, 'For my thoughts are not your thoughts, neither are your ways my ways, saith the LORD'],
  ['higher than your ways', 'Isaiah', 55, 9, 'so are my ways higher than your ways'],
  ['how the bones do grow', 'Ecclesiastes', 11, 5, 'nor how the bones do grow in the womb of her that is with child'],
  ['fearfully and wonderfully made', 'Psalms', 139, 14, 'I am fearfully and wonderfully made'],
  ['too wonderful for me', 'Psalms', 139, 6, 'Such knowledge is too wonderful for me'],
  ['His ways past finding out', 'Romans', 11, 33, 'how unsearchable are his judgments, and his ways past finding out!'],
  ['no private interpretation', '2 Peter', 1, 20, 'no prophecy of the scripture is of any private interpretation'],
  ['lean not', 'Proverbs', 3, 5, 'lean not unto thine own understanding'],
  ['through a glass, darkly', '1 Corinthians', 13, 12, 'we see through a glass, darkly'],
  ['the unity of the faith', 'Ephesians', 4, 13, 'Till we all come in the unity of the faith, and of the knowledge of the Son of God'],
  ['the way, the truth, and the life', 'John', 14, 6, 'I am the way, the truth, and the life'],
  ['ye believe Me not', 'John', 8, 45, 'And because I tell you the truth, ye believe me not'],
  ['refuse not Him that speaketh', 'Hebrews', 12, 25, 'See that ye refuse not him that speaketh'],
  ['the life that now is', '1 Timothy', 4, 8, 'having promise of the life that now is, and of that which is to come'],
  ['an hundredfold now', 'Mark', 10, 30, 'an hundredfold now in this time'],
  ['all them that obey Him', 'Hebrews', 5, 9, 'the author of eternal salvation unto all them that obey him'],
  ['once to die', 'Hebrews', 9, 27, 'appointed unto men once to die'],
  ['not hurt of the second death', 'Revelation', 2, 11, 'He that overcometh shall not be hurt of the second death'],
  ['the second death hath no power', 'Revelation', 20, 6, 'on such the second death hath no power'],
  ['shall never die', 'John', 11, 26, 'whosoever liveth and believeth in me shall never die'],
  ['He will draw all men', 'John', 12, 32, 'will draw all men unto me'],
  ['the true Light', 'John', 1, 9, 'That was the true Light, which lighteth every man that cometh into the world'],
  ['loved darkness rather than light', 'John', 3, 19, 'men loved darkness rather than light'],
  ['ye will not come', 'John', 5, 40, 'And ye will not come to me, that ye might have life'],
  ['and ye would not', 'Matthew', 23, 37, 'even as a hen gathereth her chickens under her wings, and ye would not!'],
  ['harden not your hearts', 'Hebrews', 3, 15, 'To day if ye will hear his voice, harden not your hearts'],
  ['My sheep hear My voice', 'John', 10, 27, 'My sheep hear my voice, and I know them, and they follow me'],
  // messages 26-49
  ['the hairs numbered', 'Matthew', 10, 30, 'But the very hairs of your head are all numbered'],
  ['the LORD looketh on the heart', '1 Samuel', 16, 7, 'but the LORD looketh on the heart'],
  ['commandeth all men to repent', 'Acts', 17, 30, 'but now commandeth all men every where to repent'],
  ['none other name', 'Acts', 4, 12, 'for there is none other name under heaven given among men, whereby we must be saved'],
  ['the LORD that healeth thee', 'Exodus', 15, 26, 'for I am the LORD that healeth thee'],
  ['they know His voice', 'John', 10, 4, 'the sheep follow him: for they know his voice'],
  ['choose you this day', 'Joshua', 24, 15, 'choose you this day whom ye will serve'],
  ['actions are weighed', '1 Samuel', 2, 3, 'and by him actions are weighed'],
  ['doers of the word', 'James', 1, 22, 'But be ye doers of the word, and not hearers only'],
  ['created unto good works', 'Ephesians', 2, 10, 'For we are his workmanship, created in Christ Jesus unto good works'],
  ['so great a cloud of witnesses', 'Hebrews', 12, 1, 'compassed about with so great a cloud of witnesses'],
  ['looking unto Jesus', 'Hebrews', 12, 2, 'Looking unto Jesus the author and finisher of our faith'],
  ['Him only shalt thou serve', 'Matthew', 4, 10, 'Thou shalt worship the Lord thy God, and him only shalt thou serve'],
  ['the living to the dead', 'Isaiah', 8, 19, 'for the living to the dead?'],
  ['see thou do it not', 'Revelation', 22, 9, 'See thou do it not: for I am thy fellowservant'],
  ['the prize of the high calling', 'Philippians', 3, 14, 'I press toward the mark for the prize of the high calling of God in Christ Jesus'],
  ['my reward is with me', 'Revelation', 22, 12, 'my reward is with me'],
  ['pride goeth before destruction', 'Proverbs', 16, 18, 'Pride goeth before destruction'],
  ['first the beam', 'Matthew', 7, 5, 'first cast out the beam out of thine own eye'],
  ['quick and powerful', 'Hebrews', 4, 12, 'a discerner of the thoughts and intents of the heart'],
  ['teacheth thee to profit', 'Isaiah', 48, 17, 'which teacheth thee to profit'],
  ['other five talents', 'Matthew', 25, 16, 'made them other five talents'],
  ['lose his own soul', 'Mark', 8, 36, 'For what shall it profit a man, if he shall gain the whole world, and lose his own soul?'],
  ['highly esteemed among men', 'Luke', 16, 15, 'for that which is highly esteemed among men is abomination in the sight of God'],
  ['the poor widow', 'Mark', 12, 43, 'this poor widow hath cast more in, than all they which have cast into the treasury'],
  ['a just weight', 'Proverbs', 11, 1, 'a just weight is his delight'],
  ['He knoweth our frame', 'Psalms', 103, 14, 'For he knoweth our frame; he remembereth that we are dust'],
  ['not spoken in secret', 'Isaiah', 45, 19, 'I have not spoken in secret, in a dark place of the earth'],
  ['seek and find', 'Jeremiah', 29, 13, 'when ye shall search for me with all your heart'],
  ['opened their understanding', 'Luke', 24, 45, 'that they might understand the scriptures'],
  ['open Thou mine eyes', 'Psalms', 119, 18, 'Open thou mine eyes, that I may behold wondrous things out of thy law'],
  ['charity shall cover', '1 Peter', 4, 8, 'for charity shall cover the multitude of sins'],
  ['who shall stand', 'Psalms', 130, 3, 'If thou, LORD, shouldest mark iniquities, O Lord, who shall stand?'],
  ['He that covereth his sins', 'Proverbs', 28, 13, 'He that covereth his sins shall not prosper'],
  ['your sanctification', '1 Thessalonians', 4, 3, 'For this is the will of God, even your sanctification'],
  ['a good work begun', 'Philippians', 1, 6, 'he which hath begun a good work in you will perform it'],
  ['your reasonable service', 'Romans', 12, 1, 'which is your reasonable service'],
  ['not unto us', 'Psalms', 115, 1, 'Not unto us, O LORD, not unto us, but unto thy name give glory'],
  ['unprofitable servants', 'Luke', 17, 10, 'We are unprofitable servants: we have done that which was our duty to do'],
  ['the three in one verse', '1 Peter', 1, 2, 'Elect according to the foreknowledge of God the Father, through sanctification of the Spirit'],
  ['it is finished', 'John', 19, 30, 'It is finished'],
  ['joy before the angels', 'Luke', 15, 10, 'there is joy in the presence of the angels of God over one sinner that repenteth'],
  ['mindful of him', 'Psalms', 8, 4, 'What is man, that thou art mindful of him?'],
  ['I have called you friends', 'John', 15, 15, 'but I have called you friends'],
  ['He will dwell with them', 'Revelation', 21, 3, 'he will dwell with them, and they shall be his people'],
  ['two are better than one', 'Ecclesiastes', 4, 9, 'Two are better than one; because they have a good reward for their labour'],
  ['none that lacked', 'Acts', 4, 34, 'Neither was there any among them that lacked'],
  // messages 50-52, the rod
  ['take the rod and speak', 'Numbers', 20, 8, 'and speak ye unto the rock before their eyes'],
  ['smote the rock twice', 'Numbers', 20, 11, 'with his rod he smote the rock twice'],
  ['because ye believed Me not', 'Numbers', 20, 12, 'Because ye believed me not'],
  ['a reed like unto a rod', 'Revelation', 11, 1, 'And there was given me a reed like unto a rod'],
  ['the rod of His mouth', 'Isaiah', 11, 4, 'and he shall smite the earth with the rod of his mouth'],
  ['He that spareth his rod', 'Proverbs', 13, 24, 'He that spareth his rod hateth his son'],
  ['the rod and reproof', 'Proverbs', 29, 15, 'The rod and reproof give wisdom'],
  ['thy rod and thy staff', 'Psalms', 23, 4, 'thy rod and thy staff they comfort me'],
  ['whom the LORD loveth He correcteth', 'Proverbs', 3, 12, 'For whom the LORD loveth he correcteth'],
  ['whom the Lord loveth He chasteneth', 'Hebrews', 12, 6, 'For whom the Lord loveth he chasteneth'],
  ['the peaceable fruit', 'Hebrews', 12, 11, 'the peaceable fruit of righteousness unto them which are exercised thereby'],
  ['provoke not to wrath', 'Ephesians', 6, 4, 'bring them up in the nurture and admonition of the Lord'],
  ['lest they be discouraged', 'Colossians', 3, 21, 'Fathers, provoke not your children to anger, lest they be discouraged'],
  ['a rod of iron', 'Psalms', 2, 9, 'Thou shalt break them with a rod of iron'],
  ['the sceptre of righteousness', 'Hebrews', 1, 8, 'a sceptre of righteousness is the sceptre of thy kingdom'],
];

describe('L252 exists, is numbered, and is dated the day it was sent', () => {
  it('is in the catalog exactly once, and the number is its own', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 252)).toHaveLength(1);
    expect(Math.max(...claimed)).toBeGreaterThanOrEqual(252);
    for (const n of [211, 212]) expect(claimed.includes(n), `${n} is not this lesson's to fill`).toBe(false);
  });
  it('carries the day it was sent, on or after L251', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-18');
    expect(LIVING_LESSONS_ADDED['ll251-that-rock-was-christ-identity-not-of-blood'] <= LIVING_LESSONS_ADDED[ID]).toBe(true);
  });
  it('names Darrell as the one who brought it, with all fifty-two messages', () => {
    expect(L.lesson).toContain('This lesson was brought into this house by Darrell on the eighteenth of October');
    expect(L.lesson).toContain('in fifty-two messages sent one after another while it was being built');
    expect(L.lesson).toContain('The first began and ended with the word Lesson');
  });
  it('the adult lesson walks eighteen sections, in order, the later messages in their own section before the practice', () => {
    const order = ['ONE. THIS LIFE IS THE CURRICULUM', 'TWO. THE WORD THAT WAS KEPT', 'THREE.', 'FOUR. THE BEAUTY OF THE ONE WHO FRAMED THE WORLDS', 'FIVE.', 'SIX.', 'SEVEN.', 'EIGHT.', 'NINE.', 'TEN.', 'ELEVEN.', 'TWELVE.', 'THIRTEEN.', 'FOURTEEN.', 'FIFTEEN.', 'SIXTEEN.', 'SEVENTEEN. WHAT CAME WHILE IT WAS BEING BUILT', 'The twenty-third keeps all study humble', 'profitable community, His Way of life', 'Three more came about the rod', 'a sceptre of righteousness is the sceptre of thy kingdom', 'EIGHTEEN. THE PRACTICE'];
    let at = -1;
    for (const h of order) {
      const i = L.lesson.indexOf(h, at + 1);
      expect(i, `${h} is missing or out of order`).toBeGreaterThan(at);
      at = i;
    }
  });
});

describe('L252 carries Darrell’s messages in every band', () => {
  it.each([
    [/Darrell/, 'Darrell by name'],
    [/fifty-two/, 'the count of his messages'],
    [/rod/, 'the rod'],
    [/rod of iron/, 'the rod of iron against this one'],
    [/not in the Bible|not the Bible|not from Scripture|rather than to Scripture/, 'spare the rod is not a verse'],
    [/hairs/, 'the hairs numbered'],
    [/metanoia/, 'metanoia, the way The Way says'],
    [/choose/, 'made to hear, free to choose'],
    [/weighed/, 'actions are weighed'],
    [/cloud of witnesses/, 'the great cloud of witnesses'],
    [/worship Him only|worship Yahweh only|only Yahweh|Yahweh alone/i, 'worship Yahweh alone'],
    [/prize/, 'the prize'],
    [/[Pp]ride/, 'no pride against the Word'],
    [/profit/, 'Yahweh is looking for profit'],
    [/lose his own soul/, 'never at the cost of the soul'],
    [/measures differently/, 'He measures differently'],
    [/frame/, 'He is patient with our frame'],
    [/multitude of sins/, 'Love covers a multitude of sins'],
    [/sanctification/, 'the process of sanctification'],
    [/reasonable service/, 'our reasonable service'],
    [/did all the work/, 'the Godhead did all the work'],
    [/mindful/, 'a mind full of souls'],
    [/friends/, 'He just wants community'],
    [/Two are better than one/, 'profitable community'],
    [/Way is so high/, 'His Way is so high'],
    [/agree/i, 'not competent to agree on what He said'],
    [/way, the truth, and the life/, 'the Truth is talking to us'],
    [/win/i, 'obeying Him is winning'],
    [/die once, not twice/, 'die once, not twice'],
    [/once to die/, 'appointed once to die'],
    [/second death/, 'the second death'],
    [/draw all men/, 'He draws all men'],
    [/curriculum/i, 'this life is the curriculum'],
    [/temple/i, 'made to be His temple'],
    [/angels/i, 'not the angels'],
    [/cannot lie/i, 'He cannot lie'],
    [/Dead Sea/, 'the Word that was kept'],
    [/study to shew|study to show/i, 'study to show yourself'],
    [/I AM/, 'the I AM'],
    [/robbery/i, 'not robbery'],
    [/adopt/i, 'the adoption'],
    [/famil/i, 'the curriculum of families'],
    [/warning/i, 'warning before destruction'],
    [/beam/i, 'the beam in your own eye'],
    [/evidence/i, 'your life is the evidence'],
    [/bread/i, 'opposition is bread'],
    [/meek/i, 'humble and meek'],
    [/Listen/, 'his one word, Listen'],
    [/knock/i, 'the One who knocks'],
  ])('%s — %s', (re, what) => {
    for (const k of ALL) expect(re.test(TEXTS[k]), `${k} drops ${what}`).toBe(true);
  });
  it.each(['adult', 'youth', 'teen', 'senior'])('%s carries the strands the child band tells in plainer words', (k) => {
    for (const [re, what] of [[/Godhead/, 'the Godhead'], [/Qumran/, 'Qumran'], [/contract/i, 'deeper than a contract'], [/strength under control/i, 'strength under control'], [/all authority/i, 'all authority'], [/documentation/i, 'the documentation of His skills'], [/deterministic/i, 'his word, deterministic'], [/husband/i, 'the healthy family'], [/soul/i, 'the soul decides'], [/seated/i, 'seated now'], [/canon/, 'the canon is the standard']]) {
      expect(re.test(TEXTS[k]), `${k} drops ${what}`).toBe(true);
    }
  });
  it.each(ALL)('%s closes on the One who knocks (Revelation 3:20)', (k) => {
    expect(TEXTS[k].trim().endsWith(CLOSING), `${k} does not close on Revelation 3:20`).toBe(true);
  });
  it.each(ALL)('%s quotes every strand that every band carries', (k) => {
    for (const [why, book, ch, n] of IN_EVERY_BAND) {
      expect(TEXTS[k].includes(`(${book} ${ch}:${n}`), `${k} drops ${why} (${book} ${ch}:${n})`).toBe(true);
    }
  });
  it('capitalises the Resources in our voice: Wisdom wherever a band names it, Understanding and Knowledge with it in the adult lesson', () => {
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(/\bWisdom\b/.test(ourProseOnly(TEXTS[k])), `${k} drops Wisdom`).toBe(true);
    for (const r of ['Understanding', 'Knowledge']) expect(new RegExp(`\\b${r}\\b`).test(ourProseOnly(L.lesson)), `the adult lesson drops ${r}`).toBe(true);
  });
});

describe('L252 — every quoted span is the verse', () => {
  it.each([...IN_EVERY_BAND, ...ELSEWHERE])('%s — %s %s:%s', (_why, book, ch, n, span) => {
    const v = verse(book, ch, n);
    expect(v, `${book} ${ch}:${n} resolves`).toBeTruthy();
    expect(v.includes(span), `the span is not in ${book} ${ch}:${n}`).toBe(true);
    expect(whole.includes(span), `the lesson does not carry ${book} ${ch}:${n}`).toBe(true);
  });

  const spans = L ? spansOf(L) : [];
  it('finds a substantial number of referenced spans', () => {
    expect(spans.length).toBeGreaterThan(1000);
  });
  it('every referenced span is verbatim in the verse it cites, case and all', () => {
    const bad = verbatimFaults(L);
    expect(bad, `not His words as written:\n${bad.join('\n')}`).toEqual([]);
  });
  it('would catch an altered quotation (proven-to-catch)', () => {
    const altered = { ...L, levels: { ...L.levels, child: L.levels.child.replace('for I am meek and lowly in heart"', 'for I am gentle and lowly in heart"') } };
    expect(altered.levels.child).not.toBe(L.levels.child);
    expect(verbatimFaults(altered).some((f) => f.includes('Matthew 11:29'))).toBe(true);
    const yahwehed = { ...L, lesson: L.lesson.replace('let God be true, but every man a liar"', 'let Yahweh be true, but every man a liar"') };
    expect(yahwehed.lesson).not.toBe(L.lesson);
    expect(verbatimFaults(yahwehed).some((f) => f.includes('Romans 3:4'))).toBe(true);
    const capitalised = { ...L, lesson: L.lesson.replace('"who is like thee, glorious', '"Who is like thee, glorious') };
    expect(capitalised.lesson).not.toBe(L.lesson);
    expect(verbatimFaults(capitalised).some((f) => f.includes('Exodus 15:11'))).toBe(true);
  });
  it('uses the corpus apostrophe inside quotations', () => {
    for (const s of spans) expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a quotation`).toBe(false);
  });
  it('marks no elision and recites no record', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });
  it('leaves "God" exactly as the verses carry it', () => {
    for (const u of ['Thou shalt worship the Lord thy God', 'I am the LORD thy God which teacheth thee to profit', 'let God be true, but every man a liar', 'So God created man in his own image', 'I am God, and there is none like me', 'thought it not robbery to be equal with God', 'The mighty God']) {
      expect(whole.includes(u), `drops: ${u}`).toBe(true);
    }
  });
});

describe('L252 — four bands, each carrying the whole message', () => {
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
  it('sends the reader all three ways in every place', () => {
    expect(placesMissingDirections(L)).toEqual([]);
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

describe('L252 — two stories, and Yahweh in our voice', () => {
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
    // the hard week is a unit in the curriculum, not the whole year
    expect(light.title).toBe('The Plan in the Blue Binder');
    expect(/he called it a hard unit instead\./.test(light.body)).toBe(true);
    // the changed life is the evidence, and the door was opened to the One who knocks
    expect(solemn.title).toBe('The Foreman’s Door');
    expect(/standing at the door and knocking/.test(solemn.body)).toBe(true);
    expect(/it was the best evidence they had ever seen of anything\./.test(solemn.body)).toBe(true);
  });
  it.each(ALL)('%s names Him by covenant name and never the generic in our prose', (k) => {
    const ours = ourProseOnly(TEXTS[k]);
    expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
    expect(/\bGod(?:'s|’s)?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
  });
  it('the generic-name check would catch "God" in our voice (proven-to-catch)', () => {
    const ours = ourProseOnly(`${TEXTS.child} Then God was glad.`);
    expect(/\bGod(?:'s|’s)?\b/.test(ours)).toBe(true);
  });
  it('the quiz answers are not all in one position', () => {
    const at = L.quiz.questions.map((q) => q.answer);
    expect(new Set(at).size).toBeGreaterThan(1);
    for (const q of L.quiz.questions) expect(q.options[q.answer]).toBeTruthy();
  });
});
