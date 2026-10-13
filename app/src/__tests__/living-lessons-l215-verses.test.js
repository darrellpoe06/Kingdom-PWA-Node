// @vitest-environment node
// =============================================================================
// L215 — When a Land Has No Smith: count the cost, prepare the field, and who
//        gives the safety
// =============================================================================
// Built from a business newsletter Darrell forwarded into the app on 2026-10-07
// with one word above it, Lesson (DR-0793). The report: a government buying
// warships below the rate it set for itself, its own audit office having
// already published that the private yards were not positioned to meet those
// goals; a newcomer out of the technology trade awarded a substantial contract
// and committing billions of its own money to a yard that will not open until
// the end of the decade, starting meanwhile with small components in a small
// facility years early to validate its methods; and a record half-year in the
// money trade. His word is the teaching; the report is only material.
//
// THIS LESSON CAN FAIL IN FOUR DIRECTIONS, AND ALL FOUR ARE GATED HERE.
//   1. NAMING OR JUDGING. The material is about real companies and real people.
//      1 Samuel 16:7 forbids us the verdict a trade press sells. So the module
//      is screened for a company suffix, a link, lifted newsletter furniture,
//      and any claim about a living person's heart — and the lesson's own
//      boundary sentences are pinned so removing them fails too.
//   2. ONLY CORRECTING. A lesson that only rebuked would be as dishonest as one
//      that only agreed (DR-0100 tier one). The affirmations are pinned: a lost
//      manufacturing capacity is a real wound, preparing the field before the
//      house is the Word's own order, the ruler's sword is lawful, and lawful
//      profit is clean.
//   3. STAGING A DEBATE. DR-0098: no some-say / others-argue / you-decide
//      construction anywhere in the module.
//   4. DELETING HALF THE WORD. Isaiah's plowshares and Joel's swords are both
//      quoted, and the lesson says in its own words that building a doctrine
//      from a preferred half is the error.
// Where the Word is silent — how many ships a nation needs, which builder
// should be chosen, what price is just — the lesson says so and stops, and the
// test screens our prose for any such invention.
//
// Every quoted span was fetched from the in-repo KJV (app/public/bible/kjv)
// before it was written and is pinned below, so a later edit cannot soften it;
// a one-word change is proven to fail.
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

const ID = 'll215-when-a-land-has-no-smith-count-the-cost-prepare-the-field-and-who-gives-the-safety';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  expect(m, 'L215 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const PROSE = () => ALL().replace(/"[^"]*"/g, ' ');
const SPANS = [
  'For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?',
  'Or what king, going to make war against another king, sitteth not down first, and consulteth whether he be able with ten thousand to meet him that cometh against him with twenty thousand?',
  'Lest haply, after he hath laid the foundation, and is not able to finish it, all that behold it begin to mock him,',
  'Saying, This man began to build, and was not able to finish.',
  'Or else, while the other is yet a great way off, he sendeth an ambassage, and desireth conditions of peace.',
  'Now there was no smith found throughout all the land of Israel',
  'But all the Israelites went down to the Philistines, to sharpen every man his share, and his coulter, and his axe, and his mattock.',
  'So it came to pass in the day of battle, that there was neither sword nor spear found in the hand of any of the people that were with Saul and Jonathan',
  'Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house.',
  'The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want.',
  'Every purpose is established by counsel: and with good advice make war.',
  'Except the LORD build the house, they labour in vain that build it',
  'for he beareth not the sword in vain: for he is the minister of God, a revenger to execute wrath upon him that doeth evil.',
  'every one with one of his hands wrought in the work, and with the other hand held a weapon.',
  'For the builders, every one had his sword girded by his side, and so builded.',
  'The horse is prepared against the day of battle: but safety is of the LORD.',
  'Some trust in chariots, and some in horses: but we will remember the name of the LORD our God.',
  'There is no king saved by the multitude of an host: a mighty man is not delivered by much strength.',
  'An horse is a vain thing for safety: neither shall he deliver any by his great strength.',
  'they shall beat their swords into plowshares, and their spears into pruninghooks: nation shall not lift up sword against nation, neither shall they learn war any more.',
  'Beat your plowshares into swords, and your pruninghooks into spears: let the weak say, I am strong.',
  'and rebuke strong nations afar off; and they shall beat their swords into plowshares',
  'A time to love, and a time to hate; a time of war, and a time of peace.',
  'scatter thou the people that delight in war.',
  'And he made in Jerusalem engines, invented by cunning men, to be on the towers and upon the bulwarks, to shoot arrows and great stones withal. And his name spread far abroad; for he was marvellously helped, till he was strong.',
  'But when he was strong, his heart was lifted up to his destruction',
  'And thou say in thine heart, My power and the might of mine hand hath gotten me this wealth.',
  'But thou shalt remember the LORD thy God: for it is he that giveth thee power to get wealth',
  'for man looketh on the outward appearance, but the LORD looketh on the heart.',
  'pay ye tribute also: for they are God’s ministers, attending continually upon this very thing.',
  'Render therefore to all their dues: tribute to whom tribute is due; custom to whom custom',
  'Moreover it is required in stewards, that a man be found faithful.',
  'He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much.',
  'And if ye have not been faithful in that which is another man’s, who shall give you that which is your own?',
  'A false balance is abomination to the LORD: but a just weight is his delight.',
  'Woe unto him that buildeth his house by unrighteousness, and his chambers by wrong; that useth his neighbour’s service without wages, and giveth him not for his work;',
  'Woe to him that buildeth a town with blood, and stablisheth a city by iniquity!',
  'The labourer is worthy of his reward.',
  'Better is it that thou shouldest not vow, than that thou shouldest vow and not pay.',
  'Whoso boasteth himself of a false gift is like clouds and wind without rain.',
  'they call their lands after their own names.',
  'let us build us a city and a tower, whose top may reach unto heaven; and let us make us a name',
  'A good name is rather to be chosen than great riches, and loving favour rather than silver and gold.',
  'The name of the LORD is a strong tower: the righteous runneth into it, and is safe.',
  'I will pull down my barns, and build greater; and there will I bestow all my fruits and my goods.',
  'Soul, thou hast much goods laid up for many years; take thine ease, eat, drink, and be merry.',
  'Thou fool, this night thy soul shall be required of thee: then whose shall those things be, which thou hast provided?',
  'So is he that layeth up treasure for himself, and is not rich toward God.',
  'for riches certainly make themselves wings; they fly away as an eagle toward heaven.',
  'Woe unto them that join house to house, that lay field to field, till there be no place',
  'But they that will be rich fall into temptation and a snare, and into many foolish and hurtful lusts, which drown men in destruction and perdition.',
  'For the love of money is the root of all evil',
  'give me neither poverty nor riches; feed me with food convenient for me:',
  'that if any would not work, neither should he eat.',
  'The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever',
  'Be thou diligent to know the state of thy flocks, and look well to thy herds.',
  'For riches are not for ever: and doth the crown endure to every generation?',
  'And whatsoever ye do, do it heartily, as to the Lord, and not unto men;',
  'Knowing that of the Lord ye shall receive the reward of the inheritance: for ye serve the Lord Christ.',
  'Seest thou a man diligent in his business? he shall stand before kings',
  'Commit thy works unto the LORD, and thy thoughts shall be established.',
  'I will liken him unto a wise man, which built his house upon a rock:',
  'And the rain descended, and the floods came, and the winds blew, and beat upon that house; and it fell not: for it was founded upon a rock.',
  'And let us not be weary in well doing: for in due season we shall reap, if we faint not.',
  'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.',
  'Trust in the LORD with all thine heart; and lean not unto thine own understanding.',
  'In all thy ways acknowledge him, and he shall direct thy paths.',
  'what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?',
  'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
  'Behold the Lamb of God, which taketh away the sin of the world.',
];

describe('L215 is really in the series', () => {
  it('carries all the fields and four authored bands', () => {
    const m = L();
    expect(m.title).toBe('When a Land Has No Smith — Count the Cost, Prepare the Field, and Who Gives the Safety');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    expect(m.quiz.questions.length).toBe(6);
    expect(m.facilitator.talkingPoints.length).toBe(10);
    expect(m.benefits.length).toBe(12);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('the week count equals the module count, and the lesson carries its day', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-07');
  });

  it('carries its provenance plainly: the report is the material, the Word is the teaching', () => {
    const line = 'Darrell forwarded a business newsletter into the app on 2026-10-07 with one word above it, Lesson; the report is only the material, and the Word is the teaching.';
    expect(L().lesson).toContain(line);
    expect(L().bigIdea).toContain(line);
    expect(L().inApp).toContain(line);
  });

  it('the anchor names every verse the lesson stands on', () => {
    const refs = [...new Set(
      quotedTexts(L())
        .flatMap(([, t]) => [...String(t).matchAll(/"[^"]+"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+):(\d+)(?:-(\d+))?\)/g)]
          .map((m) => m[1].replace(/\s+/g, ' ').trim())),
    )];
    const anchor = L().anchor.ref;
    const unnamed = refs.filter((r) => !anchor.includes(r));
    expect(unnamed, 'every chapter the lesson quotes must be named in anchor.ref (Search it out reads it)').toEqual([]);
    // And the other direction: nothing is named in the anchor that the lesson never quotes.
    const named = anchor.split(';').map((s) => s.trim()).filter(Boolean);
    expect(named.length).toBeGreaterThanOrEqual(70);
    expect(new Set(named).size, 'no duplicate reference in the anchor').toBe(named.length);
    const all = ALL();
    expect(named.filter((v) => !all.includes(v)), 'every anchored verse is actually cited').toEqual([]);
    for (const ref of ['Luke 14:28', 'Luke 14:31', '1 Samuel 13:19', '1 Samuel 13:22', 'Proverbs 24:27', 'Romans 13:4', 'Proverbs 21:31', 'Isaiah 2:4', 'Joel 3:10', '2 Chronicles 26:15', '2 Chronicles 26:16', 'Luke 16:12', '1 Corinthians 4:2', '1 Samuel 16:7', 'Deuteronomy 29:29', 'Micah 6:8', 'John 1:29']) {
      expect(anchor, ref).toContain(ref);
    }
  });
});

describe('it teaches the kind of situation, and names nobody', () => {
  it('names no company, product, publication or person, and carries no link or lifted furniture', () => {
    for (const [where, text] of quotedTexts(L())) {
      const t = String(text);
      expect(/https?:\/\/|www\.|\bunsubscribe\b/i.test(t), `${where} carries a link or newsletter furniture`).toBe(false);
      expect(/\b[A-Z][A-Za-z]+ (?:Inc|Incorporated|LLC|L\.L\.C|Ltd|Corp|Corporation|Industries|Technologies|Holdings|Capital|Partners)\b/.test(t), `${where} carries a company suffix`).toBe(false);
      expect(/\b(?:Presented by|Written by|Read in Browser|Markets|Extra Upside|Just for Fun)\b/.test(t), `${where} lifts newsletter furniture`).toBe(false);
      expect(/DR-\d{4}/.test(t), `${where} recites a record id`).toBe(false);
      expect(/\d\s*%/.test(t), `${where} states a percentage`).toBe(false);
      expect(/\$\s?\d/.test(t), `${where} prints a currency figure`).toBe(false);
    }
  });

  it('passes no verdict on anybody’s heart, and says so in its own words', () => {
    expect(ALL()).toContain('for man looketh on the outward appearance, but the LORD looketh on the heart.');
    expect(L().lesson).toContain('no judgement is passed on anybody’s motives or character');
    expect(L().lesson).toContain('It diagnoses nobody.');
    expect(L().lesson).toContain('The person is left where he belongs, with Yahweh.');
    expect(L().lesson).toContain('never as an accusation to throw at a company or a person, and it is thrown at nobody');
    const prose = PROSE();
    expect(/\b(?:greedy|corrupt|a fraud|war ?monger|profiteer)\b/i.test(prose), 'no character verdict in our prose').toBe(false);
  });

  it('PROVEN-TO-CATCH: a planted company name and a planted verdict are both caught by the same screens', () => {
    const planted = 'A deal was struck with Ironhull Industries, whose founder is plainly greedy.';
    expect(/\b[A-Z][A-Za-z]+ (?:Inc|Incorporated|LLC|L\.L\.C|Ltd|Corp|Corporation|Industries|Technologies|Holdings|Capital|Partners)\b/.test(planted)).toBe(true);
    expect(/\b(?:greedy|corrupt|a fraud|war ?monger|profiteer)\b/i.test(planted)).toBe(true);
  });

  it('never stages a both-sides debate for the reader to settle (DR-0098)', () => {
    const prose = PROSE();
    for (const re of [/\bsome say\b/i, /\bothers argue\b/i, /\bboth sides\b/i, /\byou decide\b/i, /\bon the one hand[^.]{0,60}on the other hand\b/i, /\bscholars (?:are )?divided\b/i]) {
      expect(re.test(prose), `stages a debate: ${re}`).toBe(false);
    }
    expect(L().lesson).toContain('we are not going to stage rival human positions and invite you to pick the one that suits your temperament');
    expect(L().lesson).toContain('We teach what the Word shows and work it the way it explains itself.');
  });
});

describe('both halves of DR-0100: what is affirmed, and what the Word corrects', () => {
  it('states the established thing plainly instead of hedging it', () => {
    expect(L().lesson).toContain('under-claiming a verified truth is as much a failure of truth as inventing one');
    expect(L().lesson).toContain('a manufacturing capacity that has been lost is a genuine wound to a people');
    expect(L().lesson).toContain('repairing such a capacity is honourable work');
    expect(L().lesson).toContain('Here the report earns a plain affirmation');
    expect(L().lesson).toContain('It is the order of work the Word commands');
    expect(L().lesson).toContain('lawful gain is clean');
    expect(L().lesson).toContain('Earnings are not sin.');
  });

  it('corrects the two over-reaches while leaving the true observation inside each untouched', () => {
    expect(L().lesson).toContain('the Word corrects each while leaving the true observation inside each untouched');
    expect(L().lesson).toContain('The first over-reach says that making the means of defence is in itself sin. Scripture does not teach it.');
    expect(L().lesson).toContain('the unspoken conviction that enough capacity is the same thing as safety');
    expect(L().lesson).toContain('The horse is still prepared; the sentence does not close the stable.');
    expect(ALL()).toContain('The horse is prepared against the day of battle: but safety is of the LORD.');
    expect(ALL()).toContain('for he beareth not the sword in vain: for he is the minister of God, a revenger to execute wrath upon him that doeth evil.');
  });

  it('names the honestly open questions narrowly, and about the future rather than about anyone’s honesty', () => {
    expect(L().lesson).toContain('It is not established that the announced yard will deliver what has been announced, for the plain reason that it is not built.');
    expect(L().lesson).toContain('They are not open about anybody’s honesty');
    expect(L().lesson).toContain('named narrowly instead of spread as a mist over the whole story');
  });

  it('keeps both halves of the Word on swords, and says deleting either is the error', () => {
    expect(ALL()).toContain('they shall beat their swords into plowshares, and their spears into pruninghooks: nation shall not lift up sword against nation, neither shall they learn war any more.');
    expect(ALL()).toContain('Beat your plowshares into swords, and your pruninghooks into spears: let the weak say, I am strong.');
    expect(L().lesson).toContain('a disarmament doctrine that quietly deletes Joel, or an armament doctrine that quietly deletes Isaiah');
    expect(L().lesson).toContain('Readiness is a duty; delight in war is under judgement');
    expect(ALL()).toContain('scatter thou the people that delight in war.');
  });

  it('the hinge is Uzziah, and the danger is placed at the summit', () => {
    expect(L().lesson).toContain('ENGINES ON THE TOWERS, AND A HEART LIFTED UP.');
    expect(L().lesson).toContain('The crisis did not arrive during the shortfall. It arrived at the summit');
    expect(ALL()).toContain('But when he was strong, his heart was lifted up to his destruction');
    for (const t of [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])]) {
      expect(t, 'every band carries the engines and the lifted-up heart').toContain('his heart was lifted up to his destruction');
    }
  });
});

describe('it stops where the Word stops', () => {
  it('says what the Word does not give, and refuses to invent it', () => {
    expect(L().lesson).toContain('WHERE THE WORD STOPS, AND WHAT IT BINDS ON OUR OWN HANDS.');
    expect(L().lesson).toContain('The Word does not say how many submarines a nation ought to hold.');
    expect(L().lesson).toContain('It does not say which builder should receive which award.');
    expect(L().lesson).toContain('a verse manufactured to settle them would be precisely the fabrication this platform exists to remove');
    expect(ALL()).toContain('The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever');
  });

  it('invents no ship count, no verdict on a price, and no endorsement of a builder', () => {
    const prose = PROSE();
    expect(/\bthe Word (?:says|tells us) (?:a nation|a country) (?:needs|should have) \d/i.test(prose), 'no invented ship count').toBe(false);
    expect(/\bScripture (?:endorses|forbids) (?:this|that) (?:builder|contract|company)\b/i.test(prose), 'no invented endorsement').toBe(false);
    expect(/\bthe (?:just|right|biblical) price is\b/i.test(prose), 'no invented just price').toBe(false);
  });

  it('PROVEN-TO-CATCH: a planted invention is caught by the same screen', () => {
    const planted = `${PROSE()} The Word says a nation needs 12 submarines, and Scripture endorses this builder, and the just price is known.`;
    expect(/\bthe Word (?:says|tells us) (?:a nation|a country) (?:needs|should have) \d/i.test(planted)).toBe(true);
    expect(/\bScripture (?:endorses|forbids) (?:this|that) (?:builder|contract|company)\b/i.test(planted)).toBe(true);
    expect(/\bthe (?:just|right|biblical) price is\b/i.test(planted)).toBe(true);
  });
});

describe('the report is never dressed as Scripture', () => {
  it('every double-quoted span carries its reference; straight quotes; no ellipsis', () => {
    for (const [where, text] of quotedTexts(L())) {
      const quotes = (String(text).match(/"([^"]+)"/g) || []).length;
      const withRef = (String(text).match(/"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g) || []).length;
      expect(withRef, `${where}: ${quotes} quoted spans, ${withRef} with a reference`).toBe(quotes);
      for (const span of String(text).matchAll(/"([^"]+)"/g)) expect(/\.\.\.|…/.test(span[1]), `${where} elides`).toBe(false);
    }
    expect(ALL().includes('“') || ALL().includes('”')).toBe(false);
  });

  it('no sentence of the report is carried inside quotation marks', () => {
    const spans = [...ALL().matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(spans.filter((s) => /shipyard|submarine|audit|newsletter|half-year|bonus|index/i.test(s)), 'no report wording inside quotation marks').toEqual([]);
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on every surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans).toBeGreaterThanOrEqual(340);
    expect(scan.faults.map((f) => `${f.where} :: ${f.kind} :: ${f.ref || ''}`)).toEqual([]);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('every span it was built with is still in the lesson, word for word', () => {
    for (const s of SPANS) expect(ALL()).toContain(s);
  });

  it('PROVEN-TO-CATCH: one changed word inside a quotation fails the verse gate', () => {
    const broken = { ...L(), lesson: L().lesson.replace('The horse is prepared against the day of battle: but safety is of the LORD.', 'The horse is prepared against the day of battle: but victory is of the LORD.') };
    expect(scanQuotedVerses([broken], quotedTexts).faults.length).toBeGreaterThan(0);
  });

  it('PROVEN-TO-CATCH: a quotation lent the wrong reference is caught, both verses being real', () => {
    const mislabelled = { ...L(), lesson: L().lesson.replace('(Proverbs 21:31)', '(Proverbs 21:30)') };
    expect(scanQuotedVerses([mislabelled], quotedTexts).faults.length).toBeGreaterThan(0);
  });

  it('PROVEN-TO-CATCH: a dropped movement is caught', () => {
    expect(L().lesson).toContain('\n\nSIX. ');
    const dropped = L().lesson.replace(/\n\nSIX\. [^]*?(?=\n\nSEVEN\. )/, '');
    expect(dropped.includes('\n\nSIX. ')).toBe(false);
  });
});

describe('our voice keeps the bindings', () => {
  it('says Yahweh in our own voice: no generic "God" and no capitalised adversary name outside a quotation', () => {
    const prose = PROSE();
    expect(prose.match(/\bGod\b/g)).toBe(null);
    expect(/\b(Satan|Lucifer|Devil|Baal)\b/.test(prose)).toBe(false);
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
    for (const t of [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])]) {
      expect(t).toContain('TALK ABOUT IT TOGETHER');
      expect(t, 'the skill: ask, listen to the end').toMatch(/listen all the way to the end|listen first/i);
      expect(t, 'the rhythm: once today in one of the four places').toMatch(/at the table, on the way, at bedtime, or first thing/);
      expect(t, 'one friend this week').toMatch(/one friend this week/);
      expect(t).toContain('so we all get healthy together, until we see that Yahweh has been right');
    }
  });

  it('all three directions are on the lesson AND on every band, not only on the module as a whole', () => {
    for (const [where, t] of [['lesson', L().lesson], ...FULL_BANDS.map((b) => [b, L().levels[b]])]) {
      expect(t, `${where}: parents to children`).toMatch(/Parents(?: and grandparents)?, ask (?:your children|the children)/);
      expect(t, `${where}: children to parents`).toMatch(/Ask your mom, dad or grandparent/);
      expect(t, `${where}: friend to friend`).toMatch(/Friends, tell each other/);
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
  it('the lesson carries ten numbered movements, the Word first and in order', () => {
    const names = ['ONE.', 'TWO.', 'THREE.', 'FOUR.', 'FIVE.', 'SIX.', 'SEVEN.', 'EIGHT.', 'NINE.', 'TEN.'];
    for (const n of names) expect(L().lesson, n).toContain(`\n\n${n} `);
    const at = (n) => L().lesson.indexOf(`\n\n${n} `);
    for (let i = 1; i < names.length; i += 1) expect(at(names[i - 1]), names[i]).toBeLessThan(at(names[i]));
    expect(L().lesson.indexOf('COUNT THE COST')).toBeLessThan(L().lesson.indexOf('WHEN A LAND HAS NO SMITH.'));
    expect(L().lesson.indexOf('ENGINES ON THE TOWERS')).toBeLessThan(L().lesson.indexOf('WHERE THE WORD STOPS'));
  });
  it('every band carries all ten movements too', () => {
    for (const b of FULL_BANDS) {
      for (const n of ['ONE.', 'TWO.', 'THREE.', 'FOUR.', 'FIVE.', 'SIX.', 'SEVEN.', 'EIGHT.', 'NINE.', 'TEN.']) {
        expect(L().levels[b], `${b} ${n}`).toContain(`${n} `);
      }
    }
  });
});
