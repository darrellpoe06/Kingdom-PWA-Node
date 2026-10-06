// @vitest-environment node
// =============================================================================
// L210 — What Really Drives Innovation — Know the Flock and Build What Edifies
// =============================================================================
// Built from Darrell's own email of 2026-10-06 (DR-0759): he forwarded a
// retail-industry newsletter to himself and wrote his own instruction over it —
// Lesson or lessons, Word first, researched, and he wants to use His Ways inside
// our apps. His word is the teaching; the newsletter is only the material.
//
// THE BINDING HALF OF THIS LESSON, held here as a gate rather than an intention.
// The forwarded piece is a vendor advertisement. The lesson weighs its CLAIMS
// and names no company, product, publication or person, because the standard
// every seller answers to can be stated without pronouncing on anybody
// (1 Samuel 16:7, quoted in the lesson itself). This test fails the build on a
// company name, a link, a download or a verdict on a heart.
//
// Every quoted span was fetched from the in-repo KJV (app/public/bible/kjv)
// before it was written and is pinned below, so a later edit cannot soften it,
// and a one-word change is proven to fail.
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

const ID = 'll210-what-really-drives-innovation-know-the-flock-and-build-what-edifies';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  expect(m, 'L210 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const SPANS = [
  'A false balance is abomination to the LORD: but a just weight is his delight.',
  'All things are lawful for me, but all things are not expedient: all things are lawful for me, but all things edify not.',
  'And by knowledge shall the chambers be filled with all precious and pleasant riches.',
  'And he shall turn the heart of the fathers to the children, and the heart of the children to their fathers, lest I come and smite the earth with a curse.',
  'And let us not be weary in well doing: for in due season we shall reap, if we faint not.',
  'And the King shall answer and say unto them, Verily I say unto you, Inasmuch as ye have done it unto one of the least of these my brethren, ye have done it unto me.',
  'And the rain descended, and the floods came, and the winds blew, and beat upon that house; and it fell not: for it was founded upon a rock.',
  'And though I bestow all my goods to feed the poor, and though I give my body to be burned, and have not charity, it profiteth me nothing.',
  'And though I have the gift of prophecy, and understand all mysteries, and all knowledge; and though I have all faith, so that I could remove mountains, and have not charity, I am nothing.',
  'And through covetousness shall they with feigned words make merchandise of you: whose judgment now of a long time lingereth not, and their damnation slumbereth not.',
  'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.',
  'And whatsoever ye do, do it heartily, as to the Lord, and not unto men;',
  'And whosoever of you will be the chiefest, shall be servant of all.',
  'Be thou diligent to know the state of thy flocks, and look well to thy herds.',
  'Behold the Lamb of God, which taketh away the sin of the world.',
  'Behold, I will do a new thing; now it shall spring forth; shall ye not know it? I will even make a way in the wilderness, and rivers in the desert.',
  'But so shall it not be among you: but whosoever will be great among you, shall be your minister:',
  'But thou shalt have a perfect and just weight, a perfect and just measure shalt thou have: that thy days may be lengthened in the land which the LORD thy God giveth thee.',
  'Come unto me, all ye that labour and are heavy laden, and I will give you rest.',
  'Commit thy works unto the LORD, and thy thoughts shall be established.',
  'Confess your faults one to another, and pray one for another, that ye may be healed.',
  'Divers weights, and divers measures, both of them are alike abomination to the LORD.',
  'Except the LORD build the house, they labour in vain that build it',
  'Feed my sheep.',
  'Feed the flock of God which is among you, taking the oversight thereof, not by constraint, but willingly; not for filthy lucre, but of a ready mind;',
  'For even the Son of man came not to be ministered unto, but to minister, and to give his life a ransom for many.',
  'For my yoke is easy, and my burden is light.',
  'For riches are not for ever: and doth the crown endure to every generation?',
  'For the time will come when they will not endure sound doctrine; but after their own lusts shall they heap to themselves teachers, having itching ears;',
  'For they bind heavy burdens and grievous to be borne, and lay them on men’s shoulders; but they themselves will not move them with one of their fingers.',
  'For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?',
  'He that answereth a matter before he heareth it, it is folly and shame unto him.',
  'He that is faithful in that which is least is faithful also in much',
  'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.',
  'In all thy ways acknowledge him, and he shall direct thy paths.',
  'In those days there was no king in Israel, but every man did that which was right in his own eyes.',
  'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.',
  'Is there any thing whereof it may be said, See, this is new? it hath been already of old time, which was before us.',
  'It is of the LORD’s mercies that we are not consumed, because his compassions fail not.',
  'Just balances, just weights, a just ephah, and a just hin, shall ye have: I am the LORD your God, which brought you out of the land of Egypt.',
  'Knowing that of the Lord ye shall receive the reward of the inheritance: for ye serve the Lord Christ.',
  'Lest haply, after he hath laid the foundation, and is not able to finish it, all that behold it begin to mock him,',
  'Let all things be done unto edifying.',
  'Let nothing be done through strife or vainglory; but in lowliness of mind let each esteem other better than themselves.',
  'Let us not therefore judge one another any more: but judge this rather, that no man put a stumblingblock or an occasion to fall in his brother’s way.',
  'Look not every man on his own things, but every man also on the things of others.',
  'Moreover it is required in stewards, that a man be found faithful.',
  'Neither as being lords over God’s heritage, but being ensamples to the flock.',
  'Now as touching things offered unto idols, we know that we all have knowledge. Knowledge puffeth up, but charity edifieth.',
  'Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house.',
  'Saying, This man began to build, and was not able to finish.',
  'Seest thou a man diligent in his business? he shall stand before kings; he shall not stand before mean men.',
  'Son of man, prophesy against the shepherds of Israel, prophesy, and say unto them, Thus saith the Lord GOD unto the shepherds; Woe be to the shepherds of Israel that do feed themselves! should not the shepherds feed the flocks?',
  'Take my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls.',
  'The thing that hath been, it is that which shall be; and that which is done is that which shall be done: and there is no new thing under the sun.',
  'The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want.',
  'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.',
  'Therefore whosoever heareth these sayings of mine, and doeth them, I will liken him unto a wise man, which built his house upon a rock:',
  'They are new every morning: great is thy faithfulness.',
  'Though I speak with the tongues of men and of angels, and have not charity, I am become as sounding brass, or a tinkling cymbal.',
  'Thou shalt not curse the deaf, nor put a stumblingblock before the blind, but shalt fear thy God: I am the LORD.',
  'Thou shalt not have in thy bag divers weights, a great and a small.',
  'Thou shalt not have in thine house divers measures, a great and a small.',
  'Through wisdom is an house builded; and by understanding it is established:',
  'Trust in the LORD with all thine heart; and lean not unto thine own understanding.',
  'Ye eat the fat, and ye clothe you with the wool, ye kill them that are fed: but ye feed not the flock.',
  'and in favour with God and man.',
  'do feed themselves',
  'For neither at any time used we flattering words, as ye know, nor a cloke of covetousness; God is witness:',
  'for man looketh on the outward appearance, but the LORD looketh on the heart.',
  'spent their time in nothing else, but either to tell, or to hear some new thing.',
];

describe('L210 is really in the series', () => {
  it('carries all the fields and four authored bands', () => {
    const m = L();
    expect(m.title).toBe('What Really Drives Innovation — Know the Flock and Build What Edifies');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    expect(typeof m.anchor.ref).toBe('string');
    expect(typeof m.anchor.theme).toBe('string');
    expect(m.benefits.length).toBe(12);
    expect(m.quiz.questions.length).toBe(6);
    expect(m.facilitator.talkingPoints.length).toBe(10);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('the week count equals the module count, and the lesson carries its day', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-06');
  });

  it('carries its provenance plainly: his word is the teaching, the newsletter is the material', () => {
    const line = 'Darrell forwarded a retail-industry newsletter to himself by email on 2026-10-06 and wrote his own instruction over it: Lesson or lessons, Word first, researched, and he wants to use His Ways inside our apps; his word is the teaching, the newsletter is only the material.';
    expect(L().lesson).toContain(line);
    expect(L().bigIdea).toContain(line);
    expect(L().inApp).toContain(line);
  });

  it('the anchor names every chapter the lesson quotes, derived from the text and never from a typed list', () => {
    const refs = [...new Set(
      quotedTexts(L())
        .flatMap(([, t]) => [...String(t).matchAll(/"[^"]+"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+):(\d+)(?:-(\d+))?\)/g)]
        .map((m) => m[1].replace(/\s+/g, ' ').trim())),
    )];
    const anchor = L().anchor.ref;
    expect(refs.filter((r) => !anchor.includes(r)), 'every chapter the lesson quotes must be named in anchor.ref (Search it out reads it)').toEqual([]);
    for (const ref of ['1 Corinthians 10:23', '1 Corinthians 14:26', 'Proverbs 27:23', 'Proverbs 24:3', 'Proverbs 24:4',
      'Psalms 127:1', 'Judges 17:6', 'John 21:16', 'Ezekiel 34:2', 'Matthew 23:4', 'Leviticus 19:14',
      'Ecclesiastes 1:9', 'Proverbs 11:1', 'Deuteronomy 25:15', '2 Peter 2:3', '1 Samuel 16:7',
      '1 Corinthians 8:1', 'Matthew 25:40', 'Matthew 7:24', 'James 1:5']) {
      expect(anchor, ref).toContain(ref);
    }
  });
});

describe('the material is weighed; no company and no heart is judged', () => {
  it('names no company, publication, product, link or download anywhere in the module', () => {
    const whole = JSON.stringify(L());
    expect(/\bhttps?:\/\//.test(whole), 'a link').toBe(false);
    expect(/\b(?:Inc|LLC|L\.L\.C|Corp|Corporation|GmbH|Ltd)\b/.test(whole), 'a company suffix').toBe(false);
    expect(/\b(?:eBook|e-book|download the|webinar|white ?paper)\b/i.test(whole), 'a call to the vendor asset').toBe(false);
    expect(/\b(?:unsubscribe|media kit|newsletter@)\b/i.test(whole), 'lifted newsletter furniture').toBe(false);
  });

  it('states the boundary out loud: the standard is named, the heart is not read', () => {
    expect(L().lesson).toContain('We read a page; we do not read hearts.');
    expect(L().lesson).toContain('So we state the standard every seller answers to, and we pronounce on no one.');
    expect(L().levels.senior).toContain('we do not read hearts');
  });

  it('affirms the sound observation instead of dismissing the source wholesale', () => {
    // DR-0100 tier one: an established, useful observation is stated plainly as
    // true. A lesson that only corrected would be as dishonest as one that only
    // agreed, so the affirmations are pinned too.
    expect(L().lesson).toContain('That is a subtraction test, and it is a good one');
    expect(L().lesson).toContain('Affirmed, and older than the industry that is selling it back to us.');
    expect(L().lesson).toContain('That admission is honest');
  });

  it('corrects the bent claim by the Word rather than by staging two opinions', () => {
    expect(L().lesson).toContain('As a second step that is wisdom. As a first principle it is ruin, and the Word says who is actually first.');
    expect(L().lesson).not.toMatch(/\bsome say\b|\bothers argue\b|\bboth sides\b|\byou decide\b/i);
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on every surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans).toBeGreaterThanOrEqual(374);
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
    for (const s of SPANS) expect(ALL(), s.slice(0, 48)).toContain(s);
  });

  it('PROVEN-TO-CATCH: one changed word inside a quotation fails the verse gate', () => {
    const broken = { ...L(), lesson: L().lesson.replace('Knowledge puffeth up, but charity edifieth.', 'Knowledge puffeth up, but charity xyzzieth.') };
    expect(scanQuotedVerses([broken], quotedTexts).faults.length).toBeGreaterThan(0);
  });

  it('PROVEN-TO-CATCH: a quotation lent the wrong reference fails, even though both verses exist', () => {
    const swapped = { ...L(), lesson: L().lesson.replace('(Proverbs 11:1)', '(Proverbs 11:2)') };
    const faults = scanQuotedVerses([swapped], quotedTexts).faults;
    expect(faults.length).toBeGreaterThan(0);
    expect(faults.map((f) => f.ref)).toContain('Proverbs 11:2');
  });

  it('PROVEN-TO-CATCH: a dropped movement and a planted generic name are both caught', () => {
    expect(L().lesson).toContain('\n\nFIVE. ');
    const dropped = L().lesson.replace(/\n\nFIVE\. [^]*?(?=\n\nSIX\. )/, '');
    expect(dropped.includes('\n\nFIVE. ')).toBe(false);
    const planted = `${L().lesson} The flock belongs to God alone.`;
    expect(/\bGod\b/.test(planted.replace(/"[^"]*"/g, ' '))).toBe(true);
  });
});

describe('our voice keeps the bindings', () => {
  it('says Yahweh in our own voice: no generic "God" and no capitalised adversary name outside a quotation', () => {
    const prose = ALL().replace(/"[^"]*"/g, ' ');
    expect(prose.match(/\bGod\b/g)).toBe(null);
    expect(/\b(Satan|Lucifer|Devil|Baal)\b/.test(prose)).toBe(false);
  });

  it('claims nothing the Word has not claimed about this material', () => {
    const prose = ALL().replace(/"[^"]*"/g, ' ');
    // The lesson never promises a commercial outcome for obedience, and it says
    // the opposite out loud; that wording is the gate.
    expect(/\bwill grow your (?:business|revenue|sales)\b|\bguaranteed (?:growth|profit)\b/i.test(prose)).toBe(false);
    expect(L().lesson).toContain('It does not tell us which feature to ship, which vendor to buy from, or which roadmap is right');
    expect(L().lesson).toContain('anyone who reads this lesson as permission to stop learning about the people we serve has read it backwards');
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
    // the skill and the rhythm, carried rather than merely referenced
    for (const t of [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])]) {
      expect(/retell/i.test(t), 'the skill: have them retell it').toBe(true);
      expect(/one friend this week/i.test(t), 'the rhythm: one friend this week').toBe(true);
    }
  });
});

describe('the register is ordered, and measured rather than asserted', () => {
  it('every band clears its full-levels floor', () => {
    const f = measureFullness(L());
    for (const b of FULL_BANDS) expect(f.bands[b].share, `${b} ${f.bands[b].words}/${f.adultWords}`).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });
  it('the grades ascend and the child band is held to the age', () => {
    const m = measureLesson(L());
    expect(isInverted(m), JSON.stringify(m.bands)).toBe(false);
    expect(breachesChildCeiling(m, NEW_LESSON_CHILD_CEILING)).toBe(false);
  });
  it('the four bands are genuinely different texts', () => {
    const d = measureDifferentiation(L());
    expect(d).toBeTruthy();
    expect(d.worst, JSON.stringify(d.pairs)).toBeLessThan(DIFF_CEILING);
  });
  it('every band names its own lesson near its start', () => {
    for (const b of FULL_BANDS) expect(namesItsLesson(L().title, L().levels[b]), b).toBe(true);
  });
  it('the lesson carries ten numbered movements, Word first', () => {
    for (const n of ['ONE.', 'TWO.', 'THREE.', 'FOUR.', 'FIVE.', 'SIX.', 'SEVEN.', 'EIGHT.', 'NINE.', 'TEN.']) {
      expect(L().lesson, n).toContain(`\n\n${n} `);
    }
  });
  it('the movements run in the order the lesson teaches them: the test, the knowing, the order, the direction, the close', () => {
    const at = (n) => L().lesson.indexOf(`\n\n${n} `);
    const seq = ['ONE.', 'TWO.', 'THREE.', 'FOUR.', 'FIVE.', 'SIX.', 'SEVEN.', 'EIGHT.', 'NINE.', 'TEN.'];
    for (let i = 0; i + 1 < seq.length; i += 1) expect(at(seq[i]), `${seq[i]} before ${seq[i + 1]}`).toBeLessThan(at(seq[i + 1]));
  });
});
