// @vitest-environment node
// =============================================================================
// L199 — The Worker Is Worthy — The Broken Deal, the Cry Yahweh Hears, and the Master in Heaven
// =============================================================================
// Built on the NAS by the lesson builder (DR-0669; this lesson DR-0750) from
// agent_inbox row(s) 7c26592b-b596-48ab-824e-6c0c7ee0dba9.
// Written by cli-local (claude); every quoted span was re-verified against the in-repo
// KJV (app/public/bible/kjv) before the push. Every span is pinned below so a
// later edit cannot soften it, and a one-word change is proven to fail.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const ID = 'll199-the-worker-is-worthy-the-broken-deal-the-cry-yahweh-hears';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  expect(m, 'L199 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const SPANS = [
  'And the LORD God took the man, and put him into the garden of Eden to dress it and to keep it',
  'In the sweat of thy face shalt thou eat bread',
  'Thou shalt not oppress an hired servant that is poor and needy',
  'At his day thou shalt give him his hire, neither shall the sun go down upon it; for he is poor, and setteth his heart upon it: lest he cry against thee unto the LORD, and it be sin unto thee',
  'Thou shalt not defraud thy neighbour, neither rob him: the wages of him that is hired shall not abide with thee all night until the morning',
  'Thou shalt not muzzle the ox when he treadeth out the corn',
  'The labourer is worthy of his reward',
  'the labourer is worthy of his hire',
  'The husbandman that laboureth must be first partaker of the fruits',
  'setteth his heart upon it',
  'if any would not work, neither should he eat',
  'I have learned by experience that the LORD hath blessed me for thy sake',
  'For it was little which thou hadst before I came, and it is now increased unto a multitude; and the LORD hath blessed thee since my coming: and now when shall I provide for mine own house also?',
  'This twenty years have I been with thee; thy ewes and thy she goats have not cast their young, and the rams of thy flock have I not eaten',
  'Thus I was; in the day the drought consumed me, and the frost by night; and my sleep departed from mine eyes',
  'And your father hath deceived me, and changed my wages ten times; but God suffered him not to hurt me',
  'thou hast changed my wages ten times',
  'Except the God of my father, the God of Abraham, and the fear of Isaac, had been with me, surely thou hadst sent me away now empty. God hath seen mine affliction and the labour of my hands, and rebuked thee yesternight',
  'sent me away now empty',
  'And they made their lives bitter with hard bondage, in morter, and in brick',
  'Ye shall no more give the people straw to make brick, as heretofore: let them go and gather straw for themselves',
  'And the tale of the bricks, which they did make heretofore, ye shall lay upon them; ye shall not diminish ought thereof: for they be idle; therefore they cry, saying, Let us go and sacrifice to our God',
  'Ye are idle, ye are idle',
  'Go therefore now, and work; for there shall no straw be given you, yet shall ye deliver the tale of bricks',
  'Thou shalt not rule over him with rigour; but shalt fear thy God',
  'And the things that thou hast heard of me among many witnesses, the same commit thou to faithful men, who shall be able to teach others also',
  'And it came to pass in process of time, that the king of Egypt died: and the children of Israel sighed by reason of the bondage, and they cried, and their cry came up unto God by reason of the bondage',
  'And the LORD said, I have surely seen the affliction of my people which are in Egypt, and have heard their cry by reason of their taskmasters; for I know their sorrows',
  'And when thou sendest him out free from thee, thou shalt not let him go away empty',
  'Thou shalt furnish him liberally out of thy flock, and out of thy floor, and out of thy winepress: of that wherewith the LORD thy God hath blessed thee thou shalt give unto him',
  'And thou shalt remember that thou wast a bondman in the land of Egypt, and the LORD thy God redeemed thee: therefore I command thee this thing to day',
  'Cast me not off in the time of old age; forsake me not when my strength faileth',
  'And even to your old age I am he; and even to hoar hairs will I carry you: I have made, and I will bear; even I will carry, and will deliver you',
  'I have been young, and now am old; yet have I not seen the righteous forsaken, nor his seed begging bread',
  'Woe unto him that buildeth his house by unrighteousness, and his chambers by wrong; that useth his neighbour’s service without wages, and giveth him not for his work',
  'Ye have heaped treasure together for the last days',
  'Behold, the hire of the labourers who have reaped down your fields, which is of you kept back by fraud, crieth: and the cries of them which have reaped are entered into the ears of the Lord of sabaoth',
  'Ye have lived in pleasure on the earth, and been wanton; ye have nourished your hearts, as in a day of slaughter',
  'I will be a swift witness',
  'against those that oppress the hireling in his wages, the widow, and the fatherless',
  'He that oppresseth the poor to increase his riches, and he that giveth to the rich, shall surely come to want',
  'He that oppresseth the poor reproacheth his Maker: but he that honoureth him hath mercy on the poor',
  'Woe unto them that decree unrighteous decrees, and that write grievousness which they have prescribed',
  'To turn aside the needy from judgment, and to take away the right from the poor of my people, that widows may be their prey, and that they may rob the fatherless!',
  'making the ephah small, and the shekel great, and falsifying the balances by deceit',
  'Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap',
  'Withhold not good from them to whom it is due, when it is in the power of thine hand to do it',
  'Masters, give unto your servants that which is just and equal; knowing that ye also have a Master in heaven',
  'And, ye masters, do the same things unto them, forbearing threatening: knowing that your Master also is in heaven; neither is there respect of persons with him',
  'Therefore all things whatsoever ye would that men should do to you, do ye even so to them: for this is the law and the prophets',
  'Friend, I do thee no wrong: didst not thou agree with me for a penny?',
  'sweareth to his own hurt, and changeth not',
  'But let your communication be, Yea, yea; Nay, nay',
  'And whatsoever ye do, do it heartily, as to the Lord, and not unto men',
  'Knowing that of the Lord ye shall receive the reward of the inheritance: for ye serve the Lord Christ',
  'Exact no more than that which is appointed you',
  'Do violence to no man, neither accuse any falsely; and be content with your wages',
  'Be ye angry, and sin not: let not the sun go down upon your wrath',
  'the wrath of man worketh not the righteousness of God',
  'Vengeance is mine; I will repay, saith the Lord',
  'And they shall build houses, and inhabit them; and they shall plant vineyards, and eat the fruit of them',
  'They shall not build, and another inhabit; they shall not plant, and another eat: for as the days of a tree are the days of my people, and mine elect shall long enjoy the work of their hands',
  'But they shall sit every man under his vine and under his fig tree; and none shall make them afraid: for the mouth of the LORD of hosts hath spoken it',
  'every man should eat and drink, and enjoy the good of all his labour, it is the gift of God',
  'No man can serve two masters: for either he will hate the one, and love the other; or else he will hold to the one, and despise the other. Ye cannot serve God and mammon',
  'Except the LORD build the house, they labour in vain that build it',
  'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you',
  'Let your conversation be without covetousness; and be content with such things as ye have: for he hath said, I will never leave thee, nor forsake thee',
  'took upon him the form of a servant',
  'Behold the Lamb of God, which taketh away the sin of the world',
  'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up',
  'And he shall turn the heart of the fathers to the children, and the heart of the children to their fathers',
  'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend',
  'Confess your faults one to another, and pray one for another, that ye may be healed',
  'the wages of him that is hired shall not abide with thee all night until the morning',
  'my sleep departed from mine eyes',
  'the LORD hath blessed me for thy sake',
  'when shall I provide for mine own house also?',
  'God hath seen mine affliction and the labour of my hands',
  'there shall no straw be given you, yet shall ye deliver the tale of bricks',
  'commit thou to faithful men, who shall be able to teach others also',
  'I have surely seen the affliction of my people',
  'thou shalt not let him go away empty',
  'even to hoar hairs will I carry you',
  'the cries of them which have reaped are entered into the ears of the Lord of sabaoth',
  'whatsoever a man soweth, that shall he also reap',
  'ye also have a Master in heaven',
  'Be ye angry, and sin not',
  'They shall not build, and another inhabit',
  'I will never leave thee, nor forsake thee',
  'for he is poor, and setteth his heart upon it',
  'in the day the drought consumed me, and the frost by night; and my sleep departed from mine eyes',
  'and now when shall I provide for mine own house also?',
  'God hath seen mine affliction and the labour of my hands, and rebuked thee yesternight',
  'the same commit thou to faithful men, who shall be able to teach others also',
  'I have surely seen the affliction of my people which are in Egypt, and have heard their cry by reason of their taskmasters',
  'Thou shalt furnish him liberally',
  'Behold, the hire of the labourers who have reaped down your fields, which is of you kept back by fraud, crieth',
  'useth his neighbour’s service without wages',
  'against those that oppress the hireling in his wages',
  'Woe unto them that decree unrighteous decrees',
  'He that oppresseth the poor reproacheth his Maker',
  'all things whatsoever ye would that men should do to you, do ye even so to them',
  'didst not thou agree with me for a penny?',
  'They shall not build, and another inhabit; they shall not plant, and another eat',
  'Ye cannot serve God and mammon',
  'the Lamb of God, which taketh away the sin of the world',
  'for he is poor, and setteth his heart upon it: lest he cry against thee unto the LORD, and it be sin unto thee',
  'and they cried, and their cry came up unto God by reason of the bondage',
  'I have surely seen the affliction of my people which are in Egypt, and have heard their cry by reason of their taskmasters; for I know their sorrows',
  'Thou shalt furnish him liberally out of thy flock, and out of thy floor, and out of thy winepress',
  'So God created man in his own image',
  'Therefore all things whatsoever ye would that men should do to you, do ye even so to them',
  'ye serve the Lord Christ',
  'Thou shalt not oppress an hired servant that is poor and needy, whether he be of thy brethren, or of thy strangers that are in thy land within thy gates',
  'For the scripture saith, Thou shalt not muzzle the ox that treadeth out the corn. And, The labourer is worthy of his reward',
  'And the tale of the bricks, which they did make heretofore, ye shall lay upon them; ye shall not diminish ought thereof: for they be idle',
  'neither is there respect of persons with him',
  'they shall build houses, and inhabit them; and they shall plant vineyards, and eat the fruit of them',
  'mine elect shall long enjoy the work of their hands',
  'they shall sit every man under his vine and under his fig tree; and none shall make them afraid',
  'thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house',
  'turn the heart of the fathers to the children, and the heart of the children to their fathers',
  'knowing that ye also have a Master in heaven',
];

describe('L199 is really in the series', () => {
  it('carries all the fields and four authored bands', () => {
    const m = L();
    expect(m.title).toBe('The Worker Is Worthy — The Broken Deal, the Cry Yahweh Hears, and the Master in Heaven');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    expect(m.quiz.questions.length).toBe(6);
    expect(m.facilitator.talkingPoints.length).toBe(10);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('the week count equals the module count, and the lesson carries its day', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-02');
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on every surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans).toBeGreaterThanOrEqual(124);
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
    const broken = { ...L(), lesson: L().lesson.replace('And the LORD God took the man, and put him into the garden of Eden to dress it and to keep it', 'And the LORD God xyzzy the man, and put him into the garden of Eden to dress it and to keep it') };
    expect(scanQuotedVerses([broken], quotedTexts).faults.length).toBeGreaterThan(0);
  });
});

describe('our voice keeps the bindings', () => {
  it('says Yahweh in our own voice: no generic "God" and no capitalised adversary name outside a quotation', () => {
    const prose = ALL().replace(/"[^"]*"/g, ' ');
    expect(prose.match(/\bGod\b/g)).toBe(null);
    expect(/\b(Satan|Lucifer|Devil|Baal)\b/.test(prose)).toBe(false);
  });

  it('every band and the lesson end with the confession', () => {
    for (const t of [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])]) {
      expect(t.trimEnd().endsWith('Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.')).toBe(true);
    }
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
});
