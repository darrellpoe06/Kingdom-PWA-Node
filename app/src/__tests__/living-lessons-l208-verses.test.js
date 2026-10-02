// @vitest-environment node
// =============================================================================
// L208 — The Gift Does Not Expire — The Skill Is Yahweh’s, the Paper Is a Witness, and a Witness Must Be True
// =============================================================================
// Built from Darrell's own email of 2026-10-02 (DR-0751): he forwarded a
// certification-expiry notice with his teaching above it; his words are the
// teaching, the notice is the occasion. Every quoted span was fetched from the
// in-repo KJV (app/public/bible/kjv) before it was written and is pinned below
// so a later edit cannot soften it, and a one-word change is proven to fail.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';
import { hasAllThree, ownPrompts } from '../lib/talk-together.js';

const ID = 'll208-the-gift-does-not-expire-the-skill-is-yahwehs-the-paper-is-a-witness';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  expect(m, 'L208 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const SPANS = [
  'And the LORD spake unto Moses, saying,',
  'See, I have called by name Bezaleel the son of Uri, the son of Hur, of the tribe of Judah:',
  'And I have filled him with the spirit of God, in wisdom, and in understanding, and in knowledge, and in all manner of workmanship,',
  'To devise cunning works, to work in gold, and in silver, and in brass,',
  'And in cutting of stones, to set them, and in carving of timber, to work in all manner of workmanship.',
  'And I, behold, I have given with him Aholiab, the son of Ahisamach, of the tribe of Dan: and in the hearts of all that are wise hearted I have put wisdom, that they may make all that I have commanded thee;',
  'And he hath put in his heart that he may teach',
  'was filled with wisdom, and understanding, and cunning to work all works in brass',
  'God gave them knowledge and skill in all learning and wisdom',
  'For his God doth instruct him to discretion, and doth teach him.',
  'For the LORD giveth wisdom: out of his mouth cometh knowledge and understanding.',
  'Every good gift and every perfect gift is from above, and cometh down from the Father of lights, with whom is no variableness, neither shadow of turning.',
  'for it is he that giveth thee power to get wealth',
  'Seest thou a man diligent in his business? he shall stand before kings; he shall not stand before mean men.',
  'A man’s gift maketh room for him, and bringeth him before great men.',
  'Can we find such a one as this is, a man in whom the Spirit of God is?',
  'because an excellent spirit was in him',
  'found them ten times better than all the magicians and astrologers that were in all his realm',
  'The hand of the diligent shall bear rule',
  'the hand of the diligent maketh rich',
  'Well done, thou good and faithful servant: thou hast been faithful over a few things, I will make thee ruler over many things',
  'Thou shalt not bear false witness against thy neighbour.',
  'A false witness shall not be unpunished, and he that speaketh lies shall not escape.',
  'Lying lips are abomination to the LORD: but they that deal truly are his delight.',
  'A false witness that speaketh lies',
  'A false balance is abomination to the LORD: but a just weight is his delight.',
  'Divers weights, and divers measures, both of them are alike abomination to the LORD.',
  'Thou shalt not have in thy bag divers weights, a great and a small.',
  'But thou shalt have a perfect and just weight, a perfect and just measure shalt thou have',
  'Just balances, just weights, a just ephah, and a just hin, shall ye have',
  'A just weight and balance are the LORD’s: all the weights of the bag are his work.',
  'And through covetousness shall they with feigned words make merchandise of you: whose judgment now of a long time lingereth not, and their damnation slumbereth not.',
  'he offered them money',
  'Thy money perish with thee, because thou hast thought that the gift of God may be purchased with money.',
  'the priests thereof teach for hire, and the prophets thereof divine for money',
  'supposing that gain is godliness',
  'for filthy lucre’s sake',
  'come, buy wine and milk without money and without price',
  'freely ye have received, freely give.',
  'Buy the truth, and sell it not; also wisdom, and instruction, and understanding.',
  'for the LORD seeth not as man seeth; for man looketh on the outward appearance, but the LORD looketh on the heart.',
  'bind heavy burdens and grievous to be borne, and lay them on men’s shoulders; but they themselves will not move them with one of their fingers',
  'Wealth gotten by vanity shall be diminished: but he that gathereth by labour shall increase.',
  'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.',
  'Do we begin again to commend ourselves? or need we, as some others, epistles of commendation to you, or letters of commendation from you?',
  'Ye are our epistle written in our hearts, known and read of all men:',
  'written not with ink, but with the Spirit of the living God',
  'they measuring themselves by themselves, and comparing themselves among themselves, are not wise',
  'For not he that commendeth himself is approved, but whom the Lord commendeth.',
  'perceived that they were unlearned and ignorant men, they marvelled; and they took knowledge of them, that they had been with Jesus',
  'the carpenter',
  'How knoweth this man letters, having never learned?',
  'taught them as one having authority, and not as the scribes',
  'for by their occupation they were tentmakers',
  'Wherefore by their fruits ye shall know them.',
  'And whatsoever ye do, do it heartily, as to the Lord, and not unto men;',
  'Knowing that of the Lord ye shall receive the reward of the inheritance: for ye serve the Lord Christ.',
  'Moreover it is required in stewards, that a man be found faithful.',
  'Whatsoever thy hand findeth to do, do it with thy might',
  'Let another man praise thee, and not thine own mouth',
  'For the gifts and calling of God are without repentance.',
  'For I am the LORD, I change not',
  'Jesus Christ the same yesterday, and to day, and for ever.',
  'My covenant will I not break, nor alter the thing that is gone out of my lips.',
  'hath he said, and shall he not do it? or hath he spoken, and shall he not make it good?',
  'The grass withereth, the flower fadeth: but the word of our God shall stand for ever.',
  'because he continueth ever, hath an unchangeable priesthood',
  'I will put my law in their inward parts, and write it in their hearts',
  'For we are his workmanship, created in Christ Jesus unto good works',
  'Neglect not the gift that is in thee',
  'stir up the gift of God, which is in thee',
  'As every man hath received the gift, even so minister the same one to another',
  'Prove all things; hold fast that which is good.',
  'And let these also first be proved',
  'Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding.',
  'the excellency of knowledge is, that wisdom giveth life to them that have it',
  'Speak ye every man the truth to his neighbour',
  'A good name is rather to be chosen than great riches',
  'He that is faithful in that which is least is faithful also in much',
  'Behold the Lamb of God, which taketh away the sin of the world.',
  'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.',
  'And he shall turn the heart of the fathers to the children, and the heart of the children to their fathers',
  'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.',
  'Confess your faults one to another, and pray one for another, that ye may be healed.',
  'and in the hearts of all that are wise hearted I have put wisdom',
  'Every good gift and every perfect gift is from above',
  'Well done, thou good and faithful servant',
  'And through covetousness shall they with feigned words make merchandise of you',
  'the LORD looketh on the heart',
  'were unlearned and ignorant men',
  'heavy burdens and grievous to be borne',
  'or need we, as some others, epistles of commendation to you, or letters of commendation from you?',
  'and in the hearts of all that are wise hearted I have put wisdom, that they may make all that I have commanded thee;',
  'bind heavy burdens and grievous to be borne, and lay them on men’s shoulders',
  'not he that commendeth himself is approved, but whom the Lord commendeth',
  'for ye serve the Lord Christ',
  'Every good gift and every perfect gift is from above, and cometh down from the Father of lights',
  'when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up',
  'turn the heart of the fathers to the children, and the heart of the children to their fathers',
  'I have called by name Bezaleel',
  'I have filled him with the spirit of God, in wisdom, and in understanding, and in knowledge, and in all manner of workmanship',
  'Seest thou a man diligent in his business? he shall stand before kings',
  'A man’s gift maketh room for him, and bringeth him before great men',
  'Thou shalt not bear false witness against thy neighbour',
  'A false balance is abomination to the LORD',
  'Divers weights, and divers measures, both of them are alike abomination to the LORD',
  'Study to shew thyself approved unto God, a workman that needeth not to be ashamed',
  'For the gifts and calling of God are without repentance',
];

describe('L208 is really in the series', () => {
  it('carries all the fields and four authored bands', () => {
    const m = L();
    expect(m.title).toBe('The Gift Does Not Expire — The Skill Is Yahweh’s, the Paper Is a Witness, and a Witness Must Be True');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    expect(m.quiz.questions.length).toBe(6);
    expect(m.facilitator.talkingPoints.length).toBe(10);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('the week count equals the module count, and the lesson carries its day', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-02');
  });

  it('carries its provenance in the lesson and in the in-app line: his words are the teaching, the notice is the occasion', () => {
    const line = 'Darrell sent this teaching by email on 2026-10-02 with a certification notice he had received; his own words are the teaching, the notice is the occasion.';
    expect(L().lesson).toContain(line);
    expect(L().inApp).toContain(line);
  });

  it('the anchor names every verse the lesson stands on', () => {
    for (const ref of ['Exodus 31:1-6', 'Proverbs 22:29', 'Proverbs 18:16', 'Proverbs 11:1', 'Proverbs 20:10', 'Exodus 20:16', '2 Peter 2:3', '2 Timothy 2:15', 'Romans 11:29']) {
      expect(L().anchor.ref, ref).toContain(ref);
    }
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on every surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans).toBeGreaterThanOrEqual(318);
    expect(scan.faults.map((f) => `${f.where} :: ${f.kind} :: ${f.ref || ''}`)).toEqual([]);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('every double-quoted span carries its reference; straight quotes; no ellipsis, record id or percentage', () => {
    for (const [where, text] of quotedTexts(L())) {
      const quotes = (String(text).match(/"([^"]+)"/g) || []).length;
      const withRef = (String(text).match(/"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g) || []).length;
      expect(withRef, `${where}: ${quotes} quoted spans, ${withRef} with a reference`).toBe(quotes);
      for (const span of String(text).matchAll(/"([^"]+)"/g)) expect(/\.\.\.|…/.test(span[1]), `${where} elides`).toBe(false);
      expect(/DR-\d{4}/.test(text), `${where} recites a record id`).toBe(false);
      expect(/\d\s*%/.test(text), `${where} states a percentage`).toBe(false);
    }
    expect(ALL().includes('“') || ALL().includes('”')).toBe(false);
  });

  it('every span it was built with is still in the lesson, word for word', () => {
    for (const s of SPANS) expect(ALL()).toContain(s);
  });

  it('PROVEN-TO-CATCH: one changed word inside a quotation fails the verse gate', () => {
    const broken = { ...L(), lesson: L().lesson.replace('For the gifts and calling of God are without repentance.', 'For the gifts and calling of God are without xyzzy.') };
    expect(scanQuotedVerses([broken], quotedTexts).faults.length).toBeGreaterThan(0);
  });
});

describe('our voice keeps the bindings', () => {
  it('says Yahweh in our own voice: no generic "God" and no capitalised adversary name outside a quotation', () => {
    const prose = ALL().replace(/"[^"]*"/g, ' ');
    expect(prose.match(/\bGod\b/g)).toBe(null);
    expect(/\b(Satan|Lucifer|Devil|Baal)\b/.test(prose)).toBe(false);
  });

  it('states only what the notice itself says and what Darrell said: no statistics, no "not verified"', () => {
    const prose = ALL().replace(/"[^"]*"/g, ' ');
    expect(/not verified/i.test(prose)).toBe(false);
    expect(/\bpercent\b/i.test(prose)).toBe(false);
  });

  it('every band and the lesson end with the confession', () => {
    for (const t of [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])]) {
      expect(t.trimEnd().endsWith('Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.')).toBe(true);
    }
  });

  it('the lesson and every band send the reader to talk about it together, in its own words, all three directions', () => {
    expect(hasAllThree(L())).toBe(true);
    const o = ownPrompts(L());
    expect(o.parents).toMatch(/^Parents, ask your children/);
    expect(o.children).toMatch(/^Ask your mom, dad or grandparent/);
    expect(o.friends).toMatch(/^Friends, tell each other/);
    for (const t of [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])]) expect(t).toContain('TALK ABOUT IT TOGETHER');
  });
});

describe('the register is ordered, and measured rather than asserted', () => {
  it('every band clears its full-levels floor', () => {
    const f = measureFullness(L());
    for (const b of FULL_BANDS) expect(f.bands[b].share, b).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });
  it('the grades ascend and the child band is held to the age', () => {
    const m = measureLesson(L());
    expect(isInverted(m), JSON.stringify(m.bands)).toBe(false);
    expect(breachesChildCeiling(m, NEW_LESSON_CHILD_CEILING)).toBe(false);
  });
  it('the four bands are genuinely different texts', () => {
    const d = measureDifferentiation(L());
    expect(d).toBeTruthy();
    expect(d.worst).toBeLessThan(DIFF_CEILING);
  });
  it('every band names its own lesson near its start', () => {
    for (const b of FULL_BANDS) expect(namesItsLesson(L().title, L().levels[b]), b).toBe(true);
  });
  it('the lesson carries at least six numbered movements, Word first', () => {
    for (const n of ['ONE.', 'TWO.', 'THREE.', 'FOUR.', 'FIVE.', 'SIX.', 'SEVEN.']) expect(L().lesson).toContain(`\n\n${n} `);
  });
});
