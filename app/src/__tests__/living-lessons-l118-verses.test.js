// =============================================================================
// L118 — "Ninety-Seven Percent": testing a viral number against the Word, and
// against the real research. Verbatim KJV.
// =============================================================================
// Captured 2026-09-02 from a circulating clip Darrell brought in with one
// instruction — lesson — and one standard: "Word first. And all lessons should
// be independently researched then as well." The clip asserts that 97% of women
// who attend college are unfit to marry, prefaced with "studies have shown."
//
// The five things this lesson had to get right, and which are pinned here:
//   • ORDER. Word FIRST, research SECOND. Scripture sets the test (movements
//     2-3) before a single statistic is examined (movements 4-7). A lesson that
//     opens on the data has started a statistics debate and lost the Word.
//   • THE NUMBER'S PROVENANCE (DR-0190). The 97% traces to no study, no survey,
//     no dataset and no researcher; "studies have shown" is a permission slip,
//     not a citation. The lesson says so and hands the reader the four questions
//     that expose the next one: who counted, how many, when, where can I read it.
//   • ALL THREE TIERS, IN ONE BREATH (DR-0100). Tier 1 stated plainly and
//     ATTRIBUTED: on both things such a claim would have to mean, the reported
//     research runs the OTHER way (Pew/Census on ever-married by 40; BLS/NLSY79
//     on divorce). Also tier 1, and equally plain: the later marriage age, the
//     lower birth rate, and the Monto-and-Carey finding of a real shift toward
//     casual and away from committed partners — even though the same study
//     refutes the clip's volume claim. Tier 2 flagged NARROWLY: why the pattern
//     exists is unsettled. Tier 3 corrected by the Word.
//   • BOTH PANS OF THE SAME SCALE. The clip's closing advice — look for one
//     without a degree — makes ignorance a proxy for godliness, which is the
//     same false weight inverted (Hosea 4:6; Proverbs 4:7; Luke 10:42). A lesson
//     that only reversed the filter would have failed its own just-weight test.
//   • THE WORD IS SENIOR (DR-0098). The clip is NAMED only to educate past it,
//     never staged as a co-equal view to pick a side of.
//
// The whole-span gate from L112/L113/L114/L115/L116/L117 rides again: no quoted span in this
// lesson may differ from the in-repo KJV by a single character. Authoring L118
// produced two real would-be alterations, both caught by fetching rather than
// remembering: Proverbs 31:30 reads "Favour is deceitful", NOT the modern
// "Charm is deceitful"; and Matthew 7:20 reads "Wherefore by their fruits ye
// shall know them.", not the familiar clipped form. Both are pinned as negatives
// below, along with the clip's own words and our prose, so that in this lesson a
// double quote means Scripture and nothing else.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll118-ninety-seven-percent-testing-a-viral-number-against-the-word-and-the-real-research';
const start = src.indexOf(`id: '${ID}'`);
// Bound the slice to THIS lesson. It previously ran to the END of the array,
// so every lesson added after this one was silently swept by this file's
// gates — checks written for one lesson judging another's prose. Each
// lesson carries its own verses test; this one tests only its own.
const l = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();

const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const verse = (book, ch, v) => JSON.parse(readFileSync(join(KJV_DIR, `${book}.json`), 'utf8')).chapters[ch - 1][v - 1];

const WHOLE_KJV = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json'))) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;   // index.json is not a book
    for (const ch of j.chapters) all += `${ch.join('\n')}\n`;
  }
  return all;
})();

const quotedSpans = (text) => {
  const unescaped = text.replace(/\\'/g, "'");
  const at = [...unescaped.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(unescaped.slice(at[i] + 1, at[i + 1]));
  return { spans: out, balanced: at.length % 2 === 0 };
};

const QUOTED_FRAGMENTS = [
  'The simple believeth every word: but the prudent man looketh well to his going.',          // Prov 14:15
  'Favour is deceitful, and beauty is vain: but a woman that feareth the LORD, she shall be praised.', // Prov 31:30
  'for man looketh on the outward appearance, but the LORD looketh on the heart.',            // 1 Sam 16:7
  'Judge not according to the appearance, but judge righteous judgment.',                     // John 7:24
  'Thou shalt not bear false witness against thy neighbour.',                                 // Ex 20:16
  'A false witness shall not be unpunished, and he that speaketh lies shall not escape.',      // Prov 19:5
  'Thou shalt not go up and down as a talebearer among thy people',                           // Lev 19:16
  'He that answereth a matter before he heareth it, it is folly and shame unto him.',          // Prov 18:13
  'A false balance is abomination to the LORD: but a just weight is his delight.',             // Prov 11:1
  'Divers weights, and divers measures, both of them are alike abomination to the LORD.',      // Prov 20:10
  'A just weight and balance are the LORD’s: all the weights of the bag are his work.',   // Prov 16:11
  'with what measure ye mete, it shall be measured to you again',                             // Matt 7:2
  'Flee fornication.',                                                                        // 1 Cor 6:18
  'It is not good that the man should be alone; I will make him an help meet for him.',        // Gen 2:18
  'Our soul waiteth for the LORD: he is our help and our shield.',                            // Ps 33:20
  'was mine help, and delivered me from the sword of Pharaoh',                                // Ex 18:4
  'And Deborah, a prophetess, the wife of Lapidoth, she judged Israel at that time.',          // Judg 4:4
  'the children of Israel came up to her for judgment',                                       // Judg 4:5
  'went unto Huldah the prophetess',                                                          // 2 Kgs 22:14
  'now she dwelt in Jerusalem in the college',                                                // 2 Kgs 22:14
  'she was a woman of good understanding',                                                    // 1 Sam 25:3
  'And blessed be thy advice, and blessed be thou, which hast kept me this day from coming to shed blood', // 1 Sam 25:33
  'they took him unto them, and expounded unto him the way of God more perfectly',            // Acts 18:26
  'And a certain woman named Lydia, a seller of purple, of the city of Thyatira',             // Acts 16:14
  'come into my house, and abide there. And she constrained us.',                             // Acts 16:15
  'She considereth a field, and buyeth it: with the fruit of her hands she planteth a vineyard.', // Prov 31:16
  'She maketh fine linen, and selleth it; and delivereth girdles unto the merchant.',          // Prov 31:24
  'She openeth her mouth with wisdom; and in her tongue is the law of kindness.',              // Prov 31:26
  'The heart of her husband doth safely trust in her',                                        // Prov 31:11
  'her husband also, and he praiseth her',                                                    // Prov 31:28
  'My people are destroyed for lack of knowledge',                                            // Hos 4:6
  'Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding.', // Prov 4:7
  'Buy the truth, and sell it not; also wisdom, and instruction, and understanding.',          // Prov 23:23
  'And she had a sister called Mary, which also sat at Jesus’ feet, and heard his word.', // Luke 10:39
  'Mary hath chosen that good part, which shall not be taken away from her',                  // Luke 10:42
  'Let the woman learn in silence with all subjection.',                                      // 1 Tim 2:11
  'not false accusers, not given to much wine, teachers of good things;',                     // Titus 2:3
  'That they may teach the young women to be sober, to love their husbands, to love their children,', // Titus 2:4
  'Be not deceived: evil communications corrupt good manners.',                               // 1 Cor 15:33
  'He that walketh with wise men shall be wise: but a companion of fools shall be destroyed.', // Prov 13:20
  'And be not conformed to this world: but be ye transformed by the renewing of your mind',   // Rom 12:2
  'Prove all things; hold fast that which is good.',                                          // 1 Thess 5:21
  'yet is she thy companion, and the wife of thy covenant',                                   // Mal 2:14
  'he hateth putting away: for one covereth violence with his garment',                       // Mal 2:16
  'Whoso findeth a wife findeth a good thing, and obtaineth favour of the LORD.',              // Prov 18:22
  'House and riches are the inheritance of fathers: and a prudent wife is from the LORD.',     // Prov 19:14
  'Husbands, love your wives, even as Christ also loved the church, and gave himself for it;', // Eph 5:25
  'Speak not evil one of another, brethren.',                                                 // Jas 4:11
  'Ye shall know them by their fruits. Do men gather grapes of thorns, or figs of thistles?',  // Matt 7:16
  'Wherefore by their fruits ye shall know them.',                                            // Matt 7:20
  'Every wise woman buildeth her house: but the foolish plucketh it down with her hands.',     // Prov 14:1
  'She will do him good and not evil all the days of her life.',                              // Prov 31:12
  'She looketh well to the ways of her household, and eateth not the bread of idleness.',      // Prov 31:27
  'even the ornament of a meek and quiet spirit',                                             // 1 Pet 3:4
];

describe('L118 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of [
      'bigIdea:', 'inApp:',
      "ref: 'Proverbs 31:30; 1 Samuel 16:7; Proverbs 11:1'",
      'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:',
    ]) {
      expect(l).toContain(key);
    }
  });

  it('is registered in the live series and the painted lesson count is the real one', () => {
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
    expect(m, 'L118 must be in LIVING_LESSONS_MODULES').toBeTruthy();
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(5);
    expect(m.benefits.length).toBeGreaterThanOrEqual(6);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(5);
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('teaches the whole arc in order — claim, Word, measure, provenance, data, true parts, open, follower, inverse weight, mirror, the man, method', () => {
    const order = [
      '1) WHAT WAS ACTUALLY CLAIMED',
      '2) THE WORD FIRST - THE TEST YAHWEH ACTUALLY GIVES',
      '3) A CLAIM ABOUT PEOPLE IS UNDER THE NINTH COMMANDMENT',
      '4) WHERE THE NUMBER CAME FROM',
      '5) WHAT THE RESEARCH ACTUALLY REPORTS',
      '6) WHAT IS TRUE IN IT',
      '7) WHAT IS GENUINELY OPEN',
      '8) A WOMAN’S NATURAL INSTINCT IS TO FOLLOW',
      '9) THE MIRROR-IMAGE FALSE WEIGHT',
      '10) THE ONE THING THE CLIP HAS RIGHT',
      '11) THE MAN IN THE MIRROR',
      '12) SO HOW DO YOU ACTUALLY KNOW?',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('runs the Word BEFORE the research, which is the standard Darrell set', () => {
    expect(l).toContain('Darrell');
    expect(l, 'the order is declared').toMatch(/Word first, and independently researched|WORD FIRST, THEN INDEPENDENTLY RESEARCHED/);
    // the test Yahweh gives is established before the first statistic is examined
    expect(l.indexOf('2) THE WORD FIRST')).toBeLessThan(l.indexOf('5) WHAT THE RESEARCH ACTUALLY REPORTS'));
    expect(l.indexOf('Favour is deceitful')).toBeLessThan(l.indexOf('Pew Research Center'));
  });

  it('names the clip as the occasion and refuses to assert its number (DR-0190)', () => {
    expect(l, 'the clip is the occasion, not the authority').toMatch(/occasion, not the authority|occasion, never as the authority/);
    expect(l, 'the 97% is reported as sourceless, never asserted').toMatch(/traces to no study/);
    expect(l).toMatch(/no study, no survey, no dataset and no researcher|no study, no survey, no researcher/);
    expect(l, 'the four questions that expose the next one').toMatch(/who counted, how many, when, and where can I read it/i);
    // every statistic in the lesson carries an attributing organisation
    for (const org of ['Pew Research Center', 'Bureau of Labor Statistics', 'Centers for Disease Control and Prevention', 'General Social Survey', 'National Center for Health Statistics']) {
      expect(l, `statistic source missing: ${org}`).toContain(org);
    }
  });

  it('states tier 1 PLAINLY — the reported research runs opposite to the claim (DR-0100)', () => {
    expect(l).toMatch(/marry MORE and divorce LESS|marry more and divorce less/);
    expect(l).toContain('eighteen percent');
    expect(l).toContain('forty-one percent');
    expect(l, 'and refuses to under-claim a verified truth').toMatch(/Under-claiming a verified truth|under-claiming a verified truth/);
    expect(l).toMatch(/pointed the arrow backwards/);
  });

  it('states what is TRUE in the clip just as plainly — no answering a false weight with a false weight', () => {
    expect(l, 'the delay is real').toContain('30.8');
    expect(l, 'the birth-rate gap is real').toContain('2.79');
    expect(l, 'the relational shift is real even though the volume claim is not').toMatch(/casual/);
    expect(l).toMatch(/Monto and Carey/);
    expect(l, 'the volume claim is what actually fails').toMatch(/NOT having more sex or more partners|not having more sex or more partners/);
    expect(l).toMatch(/we do not answer a false weight with a false weight|We do not answer a false weight with a false weight/);
  });

  it('flags the genuinely open question NARROWLY rather than smearing the subject (DR-0100 tier 2)', () => {
    expect(l).toMatch(/genuinely (open|unsettled)|is not settled here/);
    expect(l, 'and says why it does not change the direction').toMatch(/changes nothing about (movement 5|the direction)/);
    expect(l, 'exactly one place gets the uncertainty flag').toMatch(/the only place in this lesson that gets it/);
  });

  it('treats a claim about people as testimony and an invented statistic as a false balance', () => {
    expect(l).toContain('Thou shalt not bear false witness against thy neighbour.');
    expect(l).toContain('A false balance is abomination to the LORD');
    expect(l).toMatch(/A statistic is a weight/);
    expect(l, 'no exemption for false witness delivered as a percentage').toMatch(/no exemption for testimony delivered as a percentage|exemption for false witness delivered as a decimal/);
  });

  it('answers the follower-by-nature claim from Scripture, not from argument', () => {
    expect(l).toMatch(/is not in Scripture/);
    for (const witness of ['Deborah', 'Huldah', 'Abigail', 'Priscilla', 'Lydia']) {
      expect(l, `witness missing: ${witness}`).toContain(witness);
    }
    expect(l, 'the help-meet word is used of Yahweh Himself helping His people').toContain('Our soul waiteth for the LORD: he is our help and our shield.');
    expect(l, 'and the KJV "college" is NOT built on — the Hebrew is named honestly').toMatch(/translation artifact/);
  });

  it('corrects the INVERSE filter too — ignorance is not godliness', () => {
    expect(l).toMatch(/same false weight with the pans swapped|its own false weight/);
    expect(l).toContain('My people are destroyed for lack of knowledge');
    expect(l).toContain('Mary hath chosen that good part');
    expect(l, 'the neutral conclusion the Word forces').toMatch(/A degree does not make a woman godly and its absence does not either|a degree does not make a woman godly/i);
  });

  it('keeps the one true insight and applies it to BOTH pans, including the feed', () => {
    expect(l).toContain('Be not deceived: evil communications corrupt good manners.');
    expect(l).toMatch(/ENVIRONMENTS DISCIPLE PEOPLE|environments disciple people/);
    expect(l, 'the same rule reaches the content that carried the claim').toMatch(/a feed|the feed/);
    expect(l).toMatch(/does not get an exemption/);
  });

  it('turns the question back on the man holding the filter', () => {
    expect(l).toContain('Whoso findeth a wife findeth a good thing');
    expect(l).toContain('Husbands, love your wives, even as Christ also loved the church, and gave himself for it;');
    expect(l, 'a demand for fewer options is leverage, not covenant').toMatch(/leverage, not covenant|leverage standard/);
    expect(l).toContain('one covereth violence with his garment');
  });

  it('keeps our authored voice on Yahweh, with no capitalized adversary name', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bSatan\b/g) || []).length).toBe(0);
    expect((ours.match(/\bLucifer\b/g) || []).length).toBe(0);
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(15);
  });

  it('discloses its own verification limit rather than hiding it (DR-0076 §8)', () => {
    expect(l).toMatch(/primary pages were unreachable/);
    expect(l, 'and says why disclosing it is part of the teaching').toMatch(/hid its own limitation|which is the whole point of attribution/);
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 48)}${frag.length > 48 ? '…' : ''}"`, () => {
      expect(WHOLE_KJV, 'the pin itself must be real KJV').toContain(frag);
      expect(l).toContain(frag);
    });
  }
});

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the lesson\'s double quotes are balanced', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span appears verbatim in the in-repo KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length).toBeGreaterThan(60);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((s) => s.trim()).filter(Boolean)) {
        if (!WHOLE_KJV.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH against the alterations remembering would have made HERE', () => {
    // Proverbs 31:30 — the modern-translation word this lesson turns on. KJV says Favour.
    expect(WHOLE_KJV.includes('Charm is deceitful, and beauty is vain')).toBe(false);
    expect(WHOLE_KJV.includes('Favour is deceitful, and beauty is vain')).toBe(true);
    // Matthew 7:20 — the familiar clipped misquote drops "Wherefore".
    expect(WHOLE_KJV.includes('By their fruits ye shall know them.')).toBe(false);
    expect(WHOLE_KJV.includes('Wherefore by their fruits ye shall know them.')).toBe(true);
    // the CLIP's own words must never wear Scripture's quotation marks
    expect(WHOLE_KJV.includes('Ninety-seven percent of women that go to college are not wifeable')).toBe(false);
    expect(WHOLE_KJV.includes('studies have shown')).toBe(false);
    // and neither may our own prose
    expect(WHOLE_KJV.includes('a rumour with a decimal point')).toBe(false);
    expect(WHOLE_KJV.includes('who counted, how many, when, and where can I read it')).toBe(false);
  });
});

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };

  it('each band carries the check-the-number habit, the heart, and fruit', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} teaches checking a claim`).toMatch(/who counted|WHO counted|traces to no study|How do you know|HOW DO YOU KNOW/i);
      expect(t, `${band} sends the reader to the heart, not the surface`).toMatch(/looketh on the heart|outward appearance/);
      expect(t, `${band} gives the method Yahweh gave`).toMatch(/fruit|fruits/i);
    }
  });

  it('teen and senior additionally carry the real research, both directions', () => {
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} states the tier-1 finding`).toMatch(/Pew Research Center/);
      expect(t, `${band} states it with its counterpart`).toMatch(/Bureau of Labor Statistics/);
      expect(t, `${band} states the true parts too`).toMatch(/30\.8|fewer children|Monto and Carey/);
      expect(t, `${band} carries testimony and the weights`).toMatch(/false witness|false balance|talebearer/);
    }
  });

  it('the child level teaches without adult weight, and is not a stub', () => {
    const child = level('child');
    expect(child.length).toBeGreaterThan(400);
    expect(child, 'the child level teaches the number check plainly').toMatch(/HOW DO YOU KNOW/);
    expect(child).toContain('Wherefore by their fruits ye shall know them.');
    expect(child, 'learning is taught as a gift').toContain('Wisdom is the principal thing');
    expect(child).not.toMatch(/wifeable|marriage|marry|divorce|fornication|hookup|sex/i);
  });
});

describe('corpus witness — the pins are re-read from the corpus files themselves', () => {
  it('a representative set matches the repo KJV exactly', () => {
    expect(verse('Proverbs', 31, 30)).toBe('Favour is deceitful, and beauty is vain: but a woman that feareth the LORD, she shall be praised.');
    expect(verse('Proverbs', 14, 15)).toBe('The simple believeth every word: but the prudent man looketh well to his going.');
    expect(verse('Proverbs', 11, 1)).toBe('A false balance is abomination to the LORD: but a just weight is his delight.');
    expect(verse('Proverbs', 20, 10)).toBe('Divers weights, and divers measures, both of them are alike abomination to the LORD.');
    expect(verse('Exodus', 20, 16)).toBe('Thou shalt not bear false witness against thy neighbour.');
    expect(verse('Leviticus', 19, 16)).toContain('as a talebearer among thy people');
    expect(verse('1Samuel', 16, 7)).toContain('but the LORD looketh on the heart');
    expect(verse('John', 7, 24)).toBe('Judge not according to the appearance, but judge righteous judgment.');
    expect(verse('Matthew', 7, 20)).toBe('Wherefore by their fruits ye shall know them.');
    expect(verse('Judges', 4, 4)).toBe('And Deborah, a prophetess, the wife of Lapidoth, she judged Israel at that time.');
    expect(verse('2Kings', 22, 14)).toContain('now she dwelt in Jerusalem in the college');
    expect(verse('Acts', 18, 26)).toContain('expounded unto him the way of God more perfectly');
    expect(verse('Hosea', 4, 6)).toContain('My people are destroyed for lack of knowledge');
    expect(verse('Luke', 10, 42)).toContain('Mary hath chosen that good part');
    expect(verse('1Timothy', 2, 11)).toBe('Let the woman learn in silence with all subjection.');
    expect(verse('Proverbs', 4, 7)).toBe('Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding.');
    expect(verse('1Corinthians', 15, 33)).toBe('Be not deceived: evil communications corrupt good manners.');
    expect(verse('Proverbs', 19, 14)).toBe('House and riches are the inheritance of fathers: and a prudent wife is from the LORD.');
  });
});
