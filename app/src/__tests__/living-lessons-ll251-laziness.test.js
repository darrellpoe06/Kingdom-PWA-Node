// @vitest-environment node
// =============================================================================
// L251 — "Laziness Is a Character Matter": the four domains, the five marks of
// the sluggard, and Darrell's own three words — work is worship. DR-1091.
// =============================================================================
// WHERE IT CAME FROM, AND WHY THE GATE PINS THAT. Darrell forwarded a summary
// of a video on laziness by Jonny Ardavanis and Hank Bowen. It is a THIRD-PARTY
// VIDEO SUMMARY — not a teaching spoken into this house, not a message from
// Bishop Gwin, and no teacher of ours is identified in it (DR-0712 / DR-0719:
// never assume who taught). So the lesson credits them by name and then tests
// every point against the Word, and this file asserts both halves on every
// surface a reader meets.
//
// THE ONE CORRECTION, PINNED. The speakers call laziness and godliness
// antonyms and infer an absolute: "a mature Christian cannot be lazy." That
// absolute is THEIR wording, not the Word's statement, and the Word moves the
// other way: it COMMANDS believers "That ye be not slothful" (Hebrews 6:12) and
// "Not slothful in business" (Romans 12:11). A command addressed to believers
// presupposes they can fall into it. So the gate requires the sentence to be
// ATTRIBUTED wherever it appears and never asserted as Scripture's own — and it
// requires the command to stand beside it in every place. Not staged as two
// views (DR-0098); the Word taught, with one sentence named as the speakers'.
//
// DARRELL'S THREE WORDS (2026-10-17): work is worship. His framing, not the
// video's, and the deepest ground the lesson has — so Romans 12:11, where
// slothfulness stands opposite SERVING THE LORD, carries it, and the lesson
// says plainly in all five places that slothfulness is worship withheld. Two
// guards ride with it and are pinned per place: worship is never a purchase
// (Ephesians 2:8-9; Titus 3:5), and the measure is faithfulness with what is
// actually in your hand, not output (Ecclesiastes 9:10) — so a lesson on
// laziness never wounds the genuinely unable.
//
// WHAT THE MEASURES REPORTED WHILE WRITING, before commit: adult prose 1,857
// words; bands child 1,165 (0.63) / youth 1,524 (0.82) / teen 1,631 (0.88) /
// senior 2,032 (1.09) against floors 0.50 / 0.60 / 0.60 / 0.60; reading grades
// 1.14 / 3.63 / 6.98 / 10.11, strictly rising with the child band under the
// 5.0 ceiling a new lesson is held to; band differentiation worst pair 0.17
// (ceiling 0.50); 386 quoted spans, 386 verbatim against the repository's own
// King James corpus, 0 faults; the three TALK directions present in the lesson
// and in each of the four bands.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { fleschKincaidGrade, ourProseOnly, NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { placesMissingDirections, missingDirections } from '../lib/talk-together.js';
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

const ID = 'll251-laziness-is-a-character-matter-the-four-domains-and-the-five-marks-of-the-sluggard';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const ALL = Object.keys(TEXTS);
const whole = ALL.map((k) => TEXTS[k]).join('\n');

// The verses this lesson stands on, each pinned by a span that must be in the
// verse AND in the lesson. One per strand of the teaching.
const STRANDS = [
  ['the image of a working Maker', 'Genesis', 1, 27, 'So God created man in his own image, in the image of God created he him'],
  ['the garden job, before the fall', 'Genesis', 2, 15, 'put him into the garden of Eden to dress it and to keep it'],
  ['the sweat came later', 'Genesis', 3, 19, 'In the sweat of thy face shalt thou eat bread'],
  ['the commandment assumes labour', 'Exodus', 20, 9, 'Six days shalt thou labour, and do all thy work'],
  ['the Father has not stopped', 'John', 5, 17, 'My Father worketh hitherto, and I work'],
  ['slothful against serving the Lord', 'Romans', 12, 11, 'Not slothful in business; fervent in spirit; serving the Lord'],
  ['aimed at Him first', 'Colossians', 3, 23, 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men'],
  ['whom we actually serve', 'Colossians', 3, 24, 'for ye serve the Lord Christ'],
  ['in word or deed', 'Colossians', 3, 17, 'And whatsoever ye do in word or deed, do all in the name of the Lord Jesus'],
  ['the ordinary act included', '1 Corinthians', 10, 31, 'Whether therefore ye eat, or drink, or whatsoever ye do, do all to the glory of God'],
  ['the body as service', 'Romans', 12, 1, 'that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service'],
  ['eyeservice named', 'Ephesians', 6, 6, 'Not with eyeservice, as menpleasers; but as the servants of Christ, doing the will of God from the heart'],
  ['service as to the Lord', 'Ephesians', 6, 7, 'With good will doing service, as to the Lord, and not to men'],
  ['labour and rest in one commandment', 'Exodus', 20, 8, 'Remember the sabbath day, to keep it holy'],
  ['grounded in His own six days', 'Exodus', 20, 11, 'For in six days the LORD made heaven and earth, the sea, and all that in them is, and rested the seventh day'],
  ['establish the work of our hands', 'Psalms', 90, 17, 'establish thou the work of our hands upon us'],
  ['grace, not purchase', 'Ephesians', 2, 8, 'For by grace are ye saved through faith; and that not of yourselves'],
  ['no boasting', 'Ephesians', 2, 9, 'Not of works, lest any man should boast'],
  ['not by works of righteousness', 'Titus', 3, 5, 'Not by works of righteousness which we have done, but according to his mercy he saved us'],
  ['what is in your hand', 'Ecclesiastes', 9, 10, 'Whatsoever thy hand findeth to do, do it with thy might'],
  ['the second great commandment', 'Mark', 12, 31, 'Thou shalt love thy neighbour as thyself'],
  ['labour so he can give', 'Ephesians', 4, 28, 'let him labour, working with his hands the thing which is good, that he may have to give to him that needeth'],
  ['the idle addressed', '2 Thessalonians', 3, 10, 'if any would not work, neither should he eat'],
  ['the quiet kind of diligence', '1 Thessalonians', 4, 11, 'that ye study to be quiet, and to do your own business, and to work with your own hands'],
  ['walking honestly, lacking nothing', '1 Thessalonians', 4, 12, 'That ye may walk honestly toward them that are without, and that ye may have lack of nothing'],
  ['the household first', '1 Timothy', 5, 8, 'But if any provide not for his own, and specially for those of his own house, he hath denied the faith, and is worse than an infidel'],
  ['the same diligence to the end', 'Hebrews', 6, 11, 'And we desire that every one of you do shew the same diligence to the full assurance of hope unto the end'],
  ['the command itself', 'Hebrews', 6, 12, 'That ye be not slothful, but followers of them who through faith and patience inherit the promises'],
  ['the body is His temple', '1 Corinthians', 6, 19, 'know ye not that your body is the temple of the Holy Ghost which is in you'],
  ['bought with a price', '1 Corinthians', 6, 20, 'For ye are bought with a price: therefore glorify God in your body, and in your spirit'],
  ['the proportion kept honest', '1 Timothy', 4, 8, 'For bodily exercise profiteth little: but godliness is profitable unto all things'],
  ['the mind renewed', 'Romans', 12, 2, 'be ye transformed by the renewing of your mind'],
  ['every thought captive', '2 Corinthians', 10, 5, 'bringing into captivity every thought to the obedience of Christ'],
  ['the filter for the mind', 'Philippians', 4, 8, 'whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure'],
  ['day and night in the Word', 'Joshua', 1, 8, 'thou shalt meditate therein day and night, that thou mayest observe to do according to all that is written therein'],
  ['a workman unashamed', '2 Timothy', 2, 15, 'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth'],
  ['diligent before kings', 'Proverbs', 22, 29, 'Seest thou a man diligent in his business? he shall stand before kings'],
  ['the first mark, the lion in the way', 'Proverbs', 26, 13, 'The slothful man saith, There is a lion in the way; a lion is in the streets'],
  ['the lion relocated', 'Proverbs', 22, 13, 'The slothful man saith, There is a lion without, I shall be slain in the streets'],
  ['the second mark, the door on its hinges', 'Proverbs', 26, 14, 'As the door turneth upon his hinges, so doth the slothful upon his bed'],
  ['how long wilt thou sleep', 'Proverbs', 6, 9, 'How long wilt thou sleep, O sluggard? when wilt thou arise out of thy sleep?'],
  ['a little folding of the hands', 'Proverbs', 6, 10, 'Yet a little sleep, a little slumber, a little folding of the hands to sleep'],
  ['the arithmetic of the small answers', 'Proverbs', 6, 11, 'So shall thy poverty come as one that travelleth, and thy want as an armed man'],
  ['the cold as an excuse', 'Proverbs', 20, 4, 'The sluggard will not plow by reason of the cold; therefore shall he beg in harvest, and have nothing'],
  ['the third mark, the hand in the bosom', 'Proverbs', 19, 24, 'A slothful man hideth his hand in his bosom, and will not so much as bring it to his mouth again'],
  ['it grieveth him to bring it again', 'Proverbs', 26, 15, 'The slothful hideth his hand in his bosom; it grieveth him to bring it again to his mouth'],
  ['the hunter who never roasts', 'Proverbs', 12, 27, 'The slothful man roasteth not that which he took in hunting: but the substance of a diligent man is precious'],
  ['the fourth mark, wiser in his own conceit', 'Proverbs', 26, 16, 'The sluggard is wiser in his own conceit than seven men that can render a reason'],
  ['the fifth mark answered, go to the ant', 'Proverbs', 6, 6, 'Go to the ant, thou sluggard; consider her ways, and be wise'],
  ['no guide, overseer, or ruler', 'Proverbs', 6, 7, 'Which having no guide, overseer, or ruler'],
  ['she provides without prodding', 'Proverbs', 6, 8, 'Provideth her meat in the summer, and gathereth her food in the harvest'],
  ['the slack hand', 'Proverbs', 10, 4, 'He becometh poor that dealeth with a slack hand: but the hand of the diligent maketh rich'],
  ['desire without doing', 'Proverbs', 13, 4, 'The soul of the sluggard desireth, and hath nothing: but the soul of the diligent shall be made fat'],
  ['the talk of the lips', 'Proverbs', 14, 23, 'In all labour there is profit: but the talk of the lips tendeth only to penury'],
  ['the cost in standing', 'Proverbs', 12, 24, 'The hand of the diligent shall bear rule: but the slothful shall be under tribute'],
  ['vinegar to the teeth and smoke to the eyes', 'Proverbs', 10, 26, 'As vinegar to the teeth, and as smoke to the eyes, so is the sluggard to them that send him'],
  ['brother to a great waster', 'Proverbs', 18, 9, 'He also that is slothful in his work is brother to him that is a great waster'],
  ['no member is unneeded', '1 Corinthians', 12, 21, 'And the eye cannot say unto the hand, I have no need of thee'],
  ['the same care one for another', '1 Corinthians', 12, 25, 'that the members should have the same care one for another'],
  ['one member suffers, all suffer', '1 Corinthians', 12, 26, 'And whether one member suffer, all the members suffer with it'],
  ['the field of the slothful', 'Proverbs', 24, 30, 'I went by the field of the slothful, and by the vineyard of the man void of understanding'],
  ['the broken wall', 'Proverbs', 24, 31, 'And, lo, it was all grown over with thorns, and nettles had covered the face thereof, and the stone wall thereof was broken down'],
  ['he looked and received instruction', 'Proverbs', 24, 32, 'Then I saw, and considered it well: I looked upon it, and received instruction'],
  ['the same little folding, in the field', 'Proverbs', 24, 33, 'Yet a little sleep, a little slumber, a little folding of the hands to sleep'],
  ['poverty as an armed man', 'Proverbs', 24, 34, 'So shall thy poverty come as one that travelleth; and thy want as an armed man'],
  ['tomorrow refused', 'Proverbs', 27, 1, 'Boast not thyself of to morrow; for thou knowest not what a day may bring forth'],
  ['the plans of to morrow', 'James', 4, 13, 'Go to now, ye that say, To day or to morrow we will go into such a city, and continue there a year, and buy and sell, and get gain'],
  ['life is a vapour', 'James', 4, 14, 'It is even a vapour, that appeareth for a little time, and then vanisheth away'],
  ['inventory taken', 'Proverbs', 27, 23, 'Be thou diligent to know the state of thy flocks, and look well to thy herds'],
  ['He works the willing and the doing', 'Philippians', 2, 13, 'For it is God which worketh in you both to will and to do of his good pleasure'],
  ['the undone is sin', 'James', 4, 17, 'Therefore to him that knoweth to do good, and doeth it not, to him it is sin'],
  ['the labour is not in vain', '1 Corinthians', 15, 58, 'always abounding in the work of the Lord, forasmuch as ye know that your labour is not in vain in the Lord'],
  ['iron sharpeneth iron', 'Proverbs', 27, 17, 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend'],
];

// The literal TALK sentences, one per direction, as each place carries them.
// A reader reads ONE band, so each is asserted per place (DR-0795).
const TALK_PARENTS = /\b(?:Parents|Grandparents), ask your (?:children|grandchildren) which/i;
const TALK_CHILDREN = /ask your (?:own )?parents(?:, if they are living, or the elders above you,)? which of the five marks/i;
const TALK_FRIENDS = /Share with a friend (?:of many years )?the/i;
// The absolute is theirs, said in each band's own register. The gate asks for
// the DISCLAIMER, not for one wording of it.
const NOT_THE_WORDS = /their (?:wording|inference|words)[^.]{0,70}(?:not|rather than)[^.]{0,50}(?:Word|Scripture)/i;
const RHYTHM = 'Do it once today, in one of the four places of Deuteronomy 6:7: at the table, on the way, at bedtime, or first thing. One friend this week.';

describe('L251 exists, is numbered, and carries the day it was built', () => {
  it('is in the catalog exactly once, at its own number, as the highest', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 251)).toHaveLength(1);
    expect(Math.max(...claimed)).toBe(251);
    for (const n of [79, 211, 212]) expect(claimed.includes(n), `${n} is not this lesson's to fill`).toBe(false);
  });

  it('carries 2026-10-17, on or after L250', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-17');
    expect(LIVING_LESSONS_ADDED['ll250-they-which-do-hunger-shall-be-filled-and-the-critical-path'] <= LIVING_LESSONS_ADDED[ID]).toBe(true);
  });

  it('carries every field the schema requires, in a shape the app can read', () => {
    for (const k of ['id', 'stories', 'title', 'bigIdea', 'inApp', 'anchor', 'benefits', 'lesson', 'levels', 'quiz', 'facilitator']) {
      expect(L[k], `missing ${k}`).toBeTruthy();
    }
    expect(L.anchor.ref).toMatch(/\S/);
    expect(L.anchor.theme).toMatch(/\S/);
    expect(L.benefits.length).toBeGreaterThanOrEqual(10);
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(7);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(6);
    expect(L.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(5);
    expect(L.facilitator.howToRun).toMatch(/\S/);
  });
});

describe('L251 — the provenance is said plainly, and no teacher of ours is claimed', () => {
  it.each(ALL)('%s names Jonny Ardavanis and Hank Bowen as the source', (k) => {
    expect(/Jonny Ardavanis/.test(TEXTS[k]), `${k} does not name Ardavanis`).toBe(true);
    expect(/Hank Bowen/.test(TEXTS[k]), `${k} does not name Bowen`).toBe(true);
  });

  it.each(ALL)('%s says it is a third-party video, not spoken into this house and not Bishop Gwin', (k) => {
    const t = TEXTS[k];
    expect(/video/i.test(t), `${k} never says it is a video`).toBe(true);
    expect(/Bishop Gwin/.test(t), `${k} does not rule out Bishop Gwin`).toBe(true);
    expect(/no teacher (?:from our church|of ours)/i.test(t), `${k} does not say no teacher of ours is identified`).toBe(true);
  });

  it('the adult lesson says the Word is the only authority this lesson stands on', () => {
    expect(L.lesson).toContain('which is the only authority this lesson stands on');
  });
});

describe('L251 — work is worship: Darrell’s own three words, attributed and dated', () => {
  it.each(ALL)('%s carries the sentence, named as Darrell’s and dated the seventeenth of October', (k) => {
    const t = TEXTS[k];
    expect(/[Ww]ork is worship/.test(t), `${k} drops "work is worship"`).toBe(true);
    expect(/Darrell/.test(t), `${k} does not attribute it to Darrell`).toBe(true);
    expect(/seventeenth of October/.test(t), `${k} does not date it`).toBe(true);
  });

  it.each(ALL)('%s draws the conclusion plainly: slothfulness is worship withheld', (k) => {
    expect(/worship withheld/.test(TEXTS[k]), `${k} never says worship withheld`).toBe(true);
  });

  it.each(ALL)('%s stands it on Romans 12:11, where slothful is opposite serving the Lord', (k) => {
    expect(TEXTS[k].includes('(Romans 12:11)'), `${k} drops Romans 12:11`).toBe(true);
    expect(TEXTS[k].includes('"Not slothful in business; fervent in spirit; serving the Lord"'), `${k} drops the verse itself`).toBe(true);
  });

  it.each(ALL)('%s GUARD ONE — worship is never a purchase (no works-righteousness)', (k) => {
    expect(/work is worship, and worship is never a purchase/i.test(TEXTS[k]), `${k} drops the works-righteousness guard`).toBe(true);
    expect(TEXTS[k].includes('(Ephesians 2:8)'), `${k} drops the grace verse under the guard`).toBe(true);
  });

  it.each(ALL)('%s GUARD TWO — the measure is faithfulness with what is in your hand, not output', (k) => {
    expect(TEXTS[k].includes('The measure is faithfulness with what is actually in your hand, not output'), `${k} drops the guard for those who cannot work`).toBe(true);
    expect(TEXTS[k].includes('(Ecclesiastes 9:10)'), `${k} drops the verse under the guard`).toBe(true);
  });

  it('keeps work-before-the-fall and the sweat-after distinct, in every place', () => {
    for (const k of ALL) {
      expect(TEXTS[k].includes('(Genesis 2:15)'), `${k} drops the garden job`).toBe(true);
      expect(TEXTS[k].includes('(Genesis 3:19)'), `${k} drops the sweat`).toBe(true);
      expect(TEXTS[k].indexOf('(Genesis 2:15)')).toBeLessThan(TEXTS[k].indexOf('(Genesis 3:19)'));
    }
  });

  it('claims no Greek or Hebrew word study for "service" — the English text carries it', () => {
    expect(/latreia|abad|\bStrong(?:’|')s\b/i.test(JSON.stringify(L))).toBe(false);
    expect(whole.includes('which is your reasonable service')).toBe(true);
  });
});

describe('L251 — the speakers’ absolute is attributed, never asserted', () => {
  it.each(ALL)('%s names the antonym framing as the speakers’ own', (k) => {
    expect(/(?:Ardavanis and Bowen|two men|speakers)/.test(TEXTS[k]), `${k} does not name whose framing it is`).toBe(true);
    expect(/antonym|opposite|opposites/i.test(TEXTS[k]), `${k} drops the antonym framing`).toBe(true);
  });

  it.each(ALL)('%s carries the absolute ONLY as their wording, never as the Word’s statement', (k) => {
    const t = TEXTS[k];
    const at = t.indexOf('mature Christian cannot be lazy');
    expect(at, `${k} never names the absolute`).toBeGreaterThan(-1);
    // Attribution within the sentence that carries it.
    const sentence = t.slice(Math.max(0, t.lastIndexOf('.', at) + 1), t.indexOf('.', at) + 1);
    expect(/Ardavanis and Bowen|two men|they (?:say|said)|their/i.test(sentence), `${k} asserts the absolute without attributing it: ${sentence}`).toBe(true);
    // And it is explicitly denied as Scripture's own.
    expect(NOT_THE_WORDS.test(t), `${k} does not say the absolute is theirs rather than the Word’s`).toBe(true);
  });

  it.each(ALL)('%s teaches the Word’s own framing instead: the command presupposes we can fall into it', (k) => {
    const t = TEXTS[k];
    expect(t.includes('(Hebrews 6:12)'), `${k} drops the command`).toBe(true);
    expect(t.includes('"That ye be not slothful, but followers of them who through faith and patience inherit the promises"'), `${k} drops the verse`).toBe(true);
    expect(/called to (?:repentance|turn back)|invited to repent|summoned to repentance|Yahweh is calling you to turn back/i.test(t), `${k} does not offer repentance`).toBe(true);
  });

  it('does not stage it as two views for the reader to choose between (DR-0098)', () => {
    expect(L.lesson).toContain('We are not setting two camps in front of you to choose between');
    expect(/scholars (?:debate|disagree)|some say|you decide/i.test(whole)).toBe(false);
  });
});

describe('L251 — the four domains and the five marks, in all five places', () => {
  it.each(ALL)('%s names all four domains', (k) => {
    for (const d of ['physical', 'mental', 'spiritual', 'vocational']) {
      expect(new RegExp(d, 'i').test(TEXTS[k]), `${k} drops the ${d} domain`).toBe(true);
    }
    expect(/four domains/i.test(TEXTS[k]), `${k} never says four domains`).toBe(true);
  });

  it.each(ALL)('%s says a person can be disciplined in one domain and slothful in another', (k) => {
    expect(/(?:good at one and lazy at another|disciplined in one|strict in one and slack in another|conceal(?:s|ed)? (?:comfortable )?slothfulness)/i.test(TEXTS[k]), `${k} drops the one-domain-hides-another point`).toBe(true);
  });

  it.each(ALL)('%s carries all five marks, each on its own Proverbs text', (k) => {
    const t = TEXTS[k];
    expect(/five marks/i.test(t), `${k} never says five marks`).toBe(true);
    const marks = [
      ['the excuse', '(Proverbs 26:13)'],
      ['craving comfort', '(Proverbs 26:14)'],
      ['never finishing', '(Proverbs 19:24)'],
      ['self-deception', '(Proverbs 26:16)'],
      ['needing prodding', '(Proverbs 6:7)'],
    ];
    for (const [why, ref] of marks) expect(t.includes(ref), `${k} drops the mark of ${why} (${ref})`).toBe(true);
  });

  it('builds the fifth mark and the remedy on the ant, one verse apart', () => {
    const i = L.lesson.indexOf('TEN. THE FIFTH MARK, NO GUIDE, OVERSEER, OR RULER');
    expect(i).toBeGreaterThan(-1);
    expect(L.lesson.indexOf('(Proverbs 6:6)', i)).toBeGreaterThan(i);
    expect(L.lesson.indexOf('(Proverbs 6:7)', i)).toBeGreaterThan(i);
    expect(L.lesson).toContain('The cure for needing a boss is written into the sentence that says she has none');
  });

  it('names what it costs OTHERS, not only the sluggard, in every place', () => {
    for (const k of ALL) {
      expect(TEXTS[k].includes('(Proverbs 10:26)'), `${k} drops vinegar and smoke`).toBe(true);
      expect(TEXTS[k].includes('(1 Corinthians 12:26)'), `${k} drops the suffering member`).toBe(true);
    }
    expect(L.lesson.includes('(Proverbs 18:9)')).toBe(true);
    expect(L.lesson).toContain('Nobody has ever stumbled into one');
  });

  it('the twelve movements run in the same order in all five places', () => {
    const WORDS = ['ONE.', 'TWO.', 'THREE.', 'FOUR.', 'FIVE.', 'SIX.', 'SEVEN.', 'EIGHT.', 'NINE.', 'TEN.', 'ELEVEN.', 'TWELVE.'];
    for (const k of ALL) {
      const at = WORDS.map((w) => TEXTS[k].indexOf(` ${w} `));
      for (let i = 0; i < WORDS.length; i += 1) expect(at[i], `${k} drops ${WORDS[i]}`).toBeGreaterThan(-1);
      for (let i = 1; i < WORDS.length; i += 1) expect(at[i], `${k} has ${WORDS[i]} out of order`).toBeGreaterThan(at[i - 1]);
    }
  });
});

describe('L251 — every quoted span is the verse, byte for byte', () => {
  it.each(STRANDS)('%s — %s %s:%s', (_why, book, ch, n, span) => {
    const v = verse(book, ch, n);
    expect(v, `${book} ${ch}:${n} resolves`).toBeTruthy();
    expect(v.includes(span), `the span is not in ${book} ${ch}:${n}`).toBe(true);
    expect(whole.includes(span), `the lesson does not carry ${book} ${ch}:${n}`).toBe(true);
  });

  const spans = L ? spansOf(L) : [];
  it('finds a substantial number of referenced spans', () => {
    expect(spans.length).toBeGreaterThan(300);
  });

  it('every referenced span is verbatim in the verse it cites, case and all', () => {
    const bad = [];
    for (const s of spans) {
      const nums = [];
      for (const part of s.label.split(',')) {
        const r = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
        if (r) for (let i = Number(r[1]); i <= Number(r[2]); i += 1) nums.push(i);
        else if (part.trim()) nums.push(Number(part.trim()));
      }
      const joined = nums.map((n) => verse(s.book, s.ch, n)).join(' ');
      if (!joined || !norm(joined).includes(norm(s.quoted))) bad.push(`${s.path} :: ${s.book} ${s.ch}:${s.label} :: "${s.quoted.slice(0, 70)}"`);
    }
    expect(bad, `not His words as written:\n${bad.join('\n')}`).toEqual([]);
  });

  it('uses the corpus apostrophe inside quotations', () => {
    for (const s of spans) expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a quotation`).toBe(false);
  });

  it('marks no elision and recites no record', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });

  it('leaves "God" and "the LORD" exactly as the verses carry them', () => {
    for (const u of [
      'So God created man in his own image, in the image of God created he him',
      'And the LORD God took the man',
      'For it is God which worketh in you both to will and to do of his good pleasure',
    ]) expect(whole.includes(u), `drops: ${u}`).toBe(true);
  });

  it.each(ALL)('%s names Him by covenant name in our prose and never the generic', (k) => {
    const ours = ourProseOnly(TEXTS[k]);
    expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
    expect(/\bGod(?:'s|’s)?\b/.test(ours), `${k} uses the generic in our own voice`).toBe(false);
  });

  it('the anchor names every verse the lesson stands on (DR-0734)', () => {
    const refs = L.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
    expect(refs.length).toBeGreaterThanOrEqual(50);
    for (const [, book, ch] of STRANDS) {
      expect(refs.some((r) => r.startsWith(`${book} ${ch}:`)), `anchor.ref never names ${book} ${ch}`).toBe(true);
    }
    expect(refs.some((r) => r.startsWith('Deuteronomy 6:7'))).toBe(true);
  });
});

describe('L251 — TALK ABOUT IT TOGETHER, in the lesson AND in every band (DR-0733 / DR-0795)', () => {
  it('the catalog measure finds all three directions in every place', () => {
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it.each(ALL)('%s heads the close and carries the rhythm', (k) => {
    expect(TEXTS[k].includes('TALK ABOUT IT TOGETHER'), `${k} drops the heading`).toBe(true);
    expect(TEXTS[k].includes(RHYTHM), `${k} drops the rhythm`).toBe(true);
  });

  it.each(ALL)('%s sends parents to children, by its own words', (k) => {
    expect(TALK_PARENTS.test(TEXTS[k]), `${k} does not send parents to children`).toBe(true);
  });

  it.each(ALL)('%s sends children to parents, by its own words', (k) => {
    expect(TALK_CHILDREN.test(TEXTS[k]), `${k} does not send children to parents`).toBe(true);
  });

  it.each(ALL)('%s sends friend to friend, by its own words', (k) => {
    expect(TALK_FRIENDS.test(TEXTS[k]), `${k} does not send friend to friend`).toBe(true);
  });

  it.each(ALL)('%s names the skill — listen to the end, retell or teach a verse back', (k) => {
    expect(/listen (?:all the way )?to the (?:end|entire answer|whole answer)/i.test(TEXTS[k]), `${k} drops listening to the end`).toBe(true);
    expect(/retell/i.test(TEXTS[k]), `${k} drops the retell`).toBe(true);
    expect(/teach (?:them |one verse)/i.test(TEXTS[k]), `${k} drops teaching one verse back`).toBe(true);
  });

  it('PROVEN-TO-CATCH: stripping ONE band’s friend line names that band alone', () => {
    const cut = L.levels.teen.replace(/Share with a friend the unfinished item you are completing today, and ask them to ask you about it tomorrow\. /, '');
    expect(cut).not.toBe(L.levels.teen);
    const faked = { ...L, levels: { ...L.levels, teen: cut } };
    const places = placesMissingDirections(faked).map((p) => p.place);
    expect(places).toEqual(['teen']);
    expect(placesMissingDirections(faked)[0].missing).toContain('friends');
    expect(missingDirections(L.lesson)).toEqual([]);
  });
});

describe('L251 — four bands, each carrying the whole message', () => {
  const measured = measureFullness(L);

  it.each(BANDS)('%s clears its floor', (b) => {
    expect(measured.bands[b].share).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('reports no short band, and would report one trimmed back (proven-to-catch)', () => {
    expect(shortBands(measured)).toEqual([]);
    const faked = { ...L, levels: { ...L.levels, youth: L.levels.youth.slice(0, 500) } };
    expect(shortBands(measureFullness(faked))).toContain('youth');
  });

  it('every band names its own lesson near the start', () => {
    expect(unnamedBands(L)).toEqual([]);
  });

  it('keeps the bands genuinely different', () => {
    expect(duplicatedBands(measureDifferentiation(L))).toEqual([]);
    expect(measureDifferentiation(L).worst).toBeLessThan(DIFF_CEILING);
  });

  it('the ladder rises and the child band is under the new-lesson ceiling', () => {
    const g = (k) => fleschKincaidGrade(ourProseOnly(TEXTS[k]));
    expect(isInverted(measureLesson(L))).toBe(false);
    expect(g('child')).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(g('youth')).toBeGreaterThan(g('child') + 1);
    expect(g('teen')).toBeGreaterThan(g('youth') + 1);
    expect(g('senior')).toBeGreaterThan(g('teen') + 1);
  });

  it('the measurement written into this file’s header is the one the corpus reports', () => {
    expect(measured.adultWords).toBe(1857);
    expect([measured.bands.child.share, measured.bands.youth.share, measured.bands.teen.share, measured.bands.senior.share])
      .toEqual([0.63, 0.82, 0.88, 1.09]);
  });
});

describe('L251 — two stories that teach it, and a quiz that works', () => {
  it('carries two real stories, one light and one solemn, with no double-quoted span', () => {
    const real = (L.stories || []).filter((s) => s.kind === 'parable' || s.kind === 'testimony');
    expect(real.length).toBeGreaterThanOrEqual(2);
    const tones = L.stories.map((s) => s.tone);
    expect(tones).toContain('light');
    expect(tones).toContain('solemn');
    for (const s of L.stories) expect(String(s.body)).not.toMatch(/"/);
  });

  it('the stories teach the marks rather than decorating them', () => {
    const [light, solemn] = ['light', 'solemn'].map((tone) => L.stories.find((s) => s.tone === tone));
    // the first mark: a lion he had never once seen
    expect(/a lion he had never once seen/.test(light.body)).toBe(true);
    // what it costs OTHERS: the people who covered for him paid the bill
    expect(/Albert asked after Rochelle every Tuesday/.test(solemn.body)).toBe(true);
  });

  it('the quiz answers are not all in one position and every answer resolves', () => {
    const at = L.quiz.questions.map((q) => q.answer);
    expect(new Set(at).size).toBeGreaterThan(1);
    for (const q of L.quiz.questions) expect(q.options[q.answer]).toBeTruthy();
  });
});
