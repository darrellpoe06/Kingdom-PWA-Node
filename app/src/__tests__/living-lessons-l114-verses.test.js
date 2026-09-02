// =============================================================================
// L114 — "What makes having you better?": covenant vs contract, and the value a
// paycheck cannot cover. Verbatim KJV.
// =============================================================================
// Captured 2026-09-02 from a recorded exchange Darrell brought in (Darwynn
// McPherson, shared from Facebook) with a single instruction: lesson. Two men
// argue about a household — if I pay every bill, why would I cook and clean —
// and the argument ends on a question the Word has always put to a husband: if
// she can already survive without your paycheck, what makes having you in her
// life better?
//
// The four things this lesson had to get right, and which are pinned here:
//   • THE FRAME. Every question in the clip is a CONTRACT question (inputs,
//     outputs, who owes whom). Scripture never frames a marriage that way — it
//     is a covenant with a Witness (Malachi 2:14) between one flesh (Genesis
//     2:24). Fix the frame or the lesson just picks a side in the argument.
//   • BOTH MONEY TIERS IN ONE BREATH (DR-0100). Provision is commanded, heavy
//     and honourable (1 Timothy 5:8; Genesis 3:19; James 2:15-16) — stated
//     plainly, never shamed — AND it does not discharge the rest of the husband
//     commands. The reverse over-reach (money does not matter) dies on the same
//     page. The contested causal claim under the clip's politics is flagged
//     NARROWLY as contested rather than smeared over the whole subject.
//   • THE WORD IS SENIOR (DR-0098). The outside argument is NAMED only to be
//     educated past it; it is never staged as a co-equal view to pick between.
//   • MUTUAL, NOT ONE-SIDED. A lesson that only indicts husbands is a talking
//     point, not the Word (1 Corinthians 7:3-4; Proverbs 14:1; 31:12,27;
//     Ephesians 5:33) — and Proverbs 31:11,16,23,28 is taught so no one calls an
//     earning wife a modern problem.
//
// The whole-span gate from L112/L113 rides again: no quoted span in this lesson
// may differ from the in-repo KJV by a single character. Authoring L114 produced
// one real in-quote alteration (a comma pulled inside the wife of thy covenant)
// plus sixteen places where the CLIP's words or our own prose were wearing
// Scripture's quotation marks — all caught by that sweep and fixed, so in this
// lesson a double quote means Scripture and nothing else.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll114-what-makes-having-you-better-covenant-not-contract-and-the-value-a-paycheck-cannot-cover';
const start = src.indexOf(`id: '${ID}'`);
const l = src.slice(start).split('\n  },\n];')[0];

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
  'Husbands, love your wives, even as Christ also loved the church, and gave himself for it;', // Eph 5:25
  'So ought men to love their wives as their own bodies',                    // Eph 5:28
  'For no man ever yet hated his own flesh; but nourisheth and cherisheth it', // Eph 5:29
  'even as a nurse cherisheth her children',                                // 1 Thess 2:7
  'dwell with them according to knowledge, giving honour unto the wife',     // 1 Pet 3:7
  'that your prayers be not hindered',                                      // 1 Pet 3:7
  'Husbands, love your wives, and be not bitter against them.',              // Col 3:19
  'Submitting yourselves one to another in the fear of God.',                // Eph 5:21
  'yet is she thy companion, and the wife of thy covenant',                  // Mal 2:14
  'the LORD hath been witness between thee and the wife of thy youth',       // Mal 2:14
  'he hateth putting away: for one covereth violence with his garment',      // Mal 2:16
  'and shall cleave unto his wife: and they shall be one flesh',             // Gen 2:24
  'It is not good that the man should be alone; I will make him an help meet for him', // Gen 2:18
  'he hath denied the faith, and is worse than an infidel',                  // 1 Tim 5:8
  'In the sweat of thy face shalt thou eat bread',                           // Gen 3:19
  'If a brother or sister be naked, and destitute of daily food',            // Jas 2:15
  'notwithstanding ye give them not those things which are needful to the body; what doth it profit?', // Jas 2:16
  'He riseth from supper, and laid aside his garments; and took a towel, and girded himself.', // John 13:4
  'began to wash the disciples’ feet',                                  // John 13:5
  'ye also ought to wash one another’s feet',                           // John 13:14
  'For I have given you an example, that ye should do as I have done to you.', // John 13:15
  'whosoever will be great among you, shall be your minister',              // Mark 10:43
  'And whosoever of you will be the chiefest, shall be servant of all.',     // Mark 10:44
  'came not to be ministered unto, but to minister',                        // Mark 10:45
  'Neither as being lords over God’s heritage, but being ensamples to the flock.', // 1 Pet 5:3
  'in lowliness of mind let each esteem other better than themselves',       // Phil 2:3
  'Look not every man on his own things, but every man also on the things of others.', // Phil 2:4
  'Bear ye one another’s burdens, and so fulfil the law of Christ.',    // Gal 6:2
  'by love serve one another',                                              // Gal 5:13
  'seeketh not her own, is not easily provoked, thinketh no evil',           // 1 Cor 13:5
  'Be thou diligent to know the state of thy flocks, and look well to thy herds.', // Prov 27:23
  'he shall be free at home one year, and shall cheer up his wife which he hath taken', // Deut 24:5
  'let us not love in word, neither in tongue; but in deed and in truth',    // 1 John 3:18
  'forbearing threatening: knowing that your Master also is in heaven',      // Eph 6:9
  'The heart of her husband doth safely trust in her',                       // Prov 31:11
  'She considereth a field, and buyeth it',                                  // Prov 31:16
  'Her husband is known in the gates, when he sitteth among the elders of the land.', // Prov 31:23
  'her husband also, and he praiseth her',                                   // Prov 31:28
  'She will do him good and not evil all the days of her life.',             // Prov 31:12
  'She looketh well to the ways of her household, and eateth not the bread of idleness.', // Prov 31:27
  'Every wise woman buildeth her house: but the foolish plucketh it down with her hands.', // Prov 14:1
  'Let the husband render unto the wife due benevolence',                    // 1 Cor 7:3
  'The wife hath not power of her own body, but the husband',                // 1 Cor 7:4
  'and the wife see that she reverence her husband',                        // Eph 5:33
  'Two are better than one; because they have a good reward for their labour.', // Eccl 4:9
  'woe to him that is alone when he falleth; for he hath not another to help him up', // Eccl 4:10
  'a threefold cord is not quickly broken',                                  // Eccl 4:12
  'Whoso findeth a wife findeth a good thing, and obtaineth favour of the LORD.', // Prov 18:22
  'Therefore all things whatsoever ye would that men should do to you, do ye even so to them', // Matt 7:12
];

describe('L114 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of [
      'bigIdea:', 'inApp:',
      "ref: 'Ephesians 5:25; 1 Peter 3:7; Philippians 2:3-4'",
      'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:',
    ]) {
      expect(l).toContain(key);
    }
  });

  it('is registered in the live series and the painted lesson count is the real one', () => {
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
    expect(m, 'L114 must be in LIVING_LESSONS_MODULES').toBeTruthy();
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(5);
    expect(m.benefits.length).toBeGreaterThanOrEqual(6);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(5);
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('teaches the whole arc in order — question, frame, commands, money, contradiction, towel, ledger, outsourcing, leverage, mutual, answer', () => {
    const order = [
      '1) THE QUESTION UNDER THE ARGUMENT',
      '2) THE FRAME FIRST - COVENANT, NOT CONTRACT',
      '3) WHAT THE WORD ACTUALLY COMMANDS A HUSBAND',
      '4) MONEY IS REAL',
      '5) THE CONTRADICTION, NAMED',
      '6) THE TOWEL',
      '7) NOT FIFTY-FIFTY',
      '8) WHAT CANNOT BE OUTSOURCED',
      '9) LEVERAGE IS NOT COVENANT',
      '10) HER SIDE OF THE SAME COVENANT',
      '11) SO - WHAT MAKES HAVING YOU BETTER?',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('names its occasion and attributes the clip rather than asserting it (DR-0190)', () => {
    expect(l).toContain('Darrell');
    expect(l).toContain('Darwynn McPherson');
    expect(l, 'the clip is the occasion, not the authority').toMatch(/occasion, not the authority|occasion, never as the authority/);
  });

  it('holds BOTH money tiers — provision honoured, and never left to settle the account (DR-0100)', () => {
    expect(l).toContain('he hath denied the faith, and is worse than an infidel');
    expect(l).toContain('what doth it profit?');
    expect(l).toMatch(/never shamed|not let a room shame|is lying to him/);
    expect(l).toMatch(/does not repeal|does not discharge|not the whole account/i);
    expect(l).toMatch(/reverse over-reach/i);
  });

  it('flags the contested causal claim narrowly instead of smearing the subject (DR-0100 tier 2)', () => {
    expect(l).toMatch(/genuinely contested/);
    expect(l, 'and says why it need not be settled').toMatch(/do not need it settled|never licenses/);
  });

  it('keeps the Word senior — the outside argument is named to educate past it (DR-0098)', () => {
    expect(l).toMatch(/Word first|from His Word first/i);
    expect(l).toMatch(/educated past it|educate past it/);
    expect(l).toMatch(/co-equal view/);
  });

  it('settles the household-work question by the Example, not by culture', () => {
    expect(l).toContain('took a towel, and girded himself');
    expect(l).toContain('ye also ought to wash one another’s feet');
    expect(l, 'the conclusion the Example forces').toMatch(/it would have unmanned Him/);
    expect(l, 'headship is responsibility, not exemption').toMatch(/responsibility for the house/);
  });

  it('names leverage as treachery with the Witness present, and refuses to soften it', () => {
    expect(l).toContain('one covereth violence with his garment');
    expect(l).toMatch(/hostage, not a covenant|has a hostage/);
    expect(l).toContain('forbearing threatening');
  });

  it('keeps the covenant mutual so the lesson teaches rather than indicts', () => {
    expect(l).toContain('Let the husband render unto the wife due benevolence');
    expect(l).toContain('Every wise woman buildeth her house');
    expect(l).toContain('and the wife see that she reverence her husband');
    expect(l, 'an earning wife is Proverbs 31, not a modern problem').toContain('She considereth a field, and buyeth it');
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

  it('is PROVEN-TO-CATCH against the alterations actually made while authoring THIS lesson', () => {
    // the comma pulled inside the quotation
    expect(WHOLE_KJV.includes('the wife of thy covenant,')).toBe(false);
    expect(WHOLE_KJV.includes('the wife of thy covenant')).toBe(true);
    // the CLIP's own words wearing Scripture's quotation marks
    expect(WHOLE_KJV.includes('If I pay every bill, why would I cook and clean?')).toBe(false);
    expect(WHOLE_KJV.includes('what makes having you in her life better?')).toBe(false);
    // and our own prose wearing them
    expect(WHOLE_KJV.includes('therefore the account is settled.')).toBe(false);
    expect(WHOLE_KJV.includes('I paid, therefore I am done')).toBe(false);
  });
});

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };

  it('each band carries the towel, the covenant answer to alone, and real service', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the Example`).toMatch(/towel|John 13/);
      expect(t, `${band} carries the answer to alone`).toMatch(/alone|Genesis 2:18|Ecclesiastes 4/);
      expect(t, `${band} carries the making-life-easier question`).toMatch(/easier|helps|help/i);
    }
  });

  it('teen and senior additionally carry both money tiers and the leverage warning', () => {
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} states provision plainly`).toMatch(/1 Timothy 5:8|worse than an infidel/);
      expect(t, `${band} keeps the rest of the list`).toMatch(/according to knowledge|Ephesians 5:2[589]/);
      expect(t, `${band} names leverage`).toMatch(/Malachi 2:1[46]|leaving is too expensive|leverage/);
    }
  });

  it('the child level teaches without adult weight, and is not a stub', () => {
    const child = level('child');
    expect(child.length).toBeGreaterThan(400);
    expect(child).toMatch(/everybody helps|In a home/);
    expect(child).toContain('For I have given you an example');
    expect(child).not.toMatch(/leverage|divorce|treachery|paycheck/i);
  });
});

describe('corpus witness — the pins are re-read from the corpus files themselves', () => {
  it('a representative set matches the repo KJV exactly', () => {
    expect(verse('Ephesians', 5, 25)).toBe('Husbands, love your wives, even as Christ also loved the church, and gave himself for it;');
    expect(verse('1Peter', 3, 7)).toContain('dwell with them according to knowledge');
    expect(verse('Colossians', 3, 19)).toBe('Husbands, love your wives, and be not bitter against them.');
    expect(verse('1Timothy', 5, 8)).toContain('worse than an infidel');
    expect(verse('Malachi', 2, 14)).toContain('the wife of thy covenant');
    expect(verse('Malachi', 2, 16)).toContain('one covereth violence with his garment');
    expect(verse('John', 13, 4)).toBe('He riseth from supper, and laid aside his garments; and took a towel, and girded himself.');
    expect(verse('John', 13, 15)).toBe('For I have given you an example, that ye should do as I have done to you.');
    expect(verse('Mark', 10, 45)).toContain('came not to be ministered unto, but to minister');
    expect(verse('Philippians', 2, 4)).toBe('Look not every man on his own things, but every man also on the things of others.');
    expect(verse('Proverbs', 27, 23)).toBe('Be thou diligent to know the state of thy flocks, and look well to thy herds.');
    expect(verse('Deuteronomy', 24, 5)).toContain('shall cheer up his wife which he hath taken');
    expect(verse('Proverbs', 31, 16)).toContain('She considereth a field, and buyeth it');
    expect(verse('Ecclesiastes', 4, 12)).toContain('a threefold cord is not quickly broken');
    expect(verse('Genesis', 2, 18)).toContain('It is not good that the man should be alone');
  });
});
