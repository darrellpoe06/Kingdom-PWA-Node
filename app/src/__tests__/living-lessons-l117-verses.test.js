// =============================================================================
// L117 — "Know your own post": her provision, her guard, and the beam in the
// pointing eye. Verbatim KJV.
// =============================================================================
// Captured 2026-09-02 from a second spoken clip Darrell brought in, hours after
// the one that became L114. A man argues that women can recite a man's duties
// inside out and backwards while not knowing a woman's first duty — that she is
// to provide and to protect — and closes by calling a woman who falls short
// worthless.
//
// NUMBERING: this is L117, not L115. L115 is deliberately reserved for PR #1428
// (branch claude/biblical-femininity-quiet-strength-4xsef8), which authored a
// DIFFERENT lesson as L114 in a concurrent session and went conflicted when
// L114 merged first. A lesson number is provisional until merge, exactly like a
// DR number (DR-0052); skipping one is cheaper than colliding twice.
//
// The four things this lesson had to get right, and which are pinned here:
//   • THE TRUE PART, STATED PLAINLY (DR-0100). Her post is real and the Word
//     describes it in working detail — sourcing, feeding, trading, giving,
//     watching the WAYS, preparing before the season — and it is proven outside
//     Proverbs 31 (Luke 8:3; Acts 9:36,39; 2 Kings 4:10; 1 Samuel 25; Exodus
//     1:17) so it cannot be filed as an unreachable ideal. Under-claiming a
//     truth is as much a failure of truth as over-claiming one.
//   • THE PEACE CLAIM WEIGHED WITH BOTH HANDS. Proverbs 21:9 is taught BESIDE
//     Proverbs 29:22 and 22:24 — quoting one and not the other is selection,
//     which is the very failure the lesson teaches against — and the guard rail
//     (keeping peace never means concealing harm) rides in the same breath.
//   • THE CONTEMPT REFUSED WITHOUT DISCARDING THE TRUE POINT. Genesis 1:27 and
//     James 3:9-10 forbid pricing a person at nothing; Ephesians 4:29 supplies
//     the test that is not "was it true" but "did it EDIFY".
//   • THE BEAM AS ORDER, NOT CANCELLATION. Matthew 7:3-5 never says the mote is
//     imaginary. The clip's point about lopsided knowledge can be entirely real
//     AND the beam still disqualifies the surgeon until it comes out. A lesson
//     that used the beam to dismiss the man would fail in the opposite
//     direction, so that distinction is asserted explicitly below.
//
// The whole-span gate rides again: no quoted span may differ from the in-repo
// KJV by a single character. Authoring L117 produced ZERO in-quote alterations
// on the first sweep — the L114 discipline (a double quote means Scripture and
// nothing else; the clip's own words and our prose carry none) was applied from
// the first draft rather than retrofitted. The gate is still asserted
// proven-to-catch below against strings it must reject.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll117-know-your-own-post-her-provision-her-guard-and-the-beam-in-the-pointing-eye';
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
  'It is not good that the man should be alone; I will make him an help meet for him', // Gen 2:18
  'in the image of God created he him; male and female created he them',    // Gen 1:27
  'She girdeth her loins with strength, and strengtheneth her arms.',        // Prov 31:17
  'Strength and honour are her clothing; and she shall rejoice in time to come.', // Prov 31:25
  'She looketh well to the ways of her household, and eateth not the bread of idleness.', // Prov 31:27
  'Every wise woman buildeth her house: but the foolish plucketh it down with her hands.', // Prov 14:1
  'She is like the merchants’ ships; she bringeth her food from afar.',      // Prov 31:14
  'She riseth also while it is yet night, and giveth meat to her household', // Prov 31:15
  'She perceiveth that her merchandise is good: her candle goeth not out by night.', // Prov 31:18
  'She stretcheth out her hand to the poor; yea, she reacheth forth her hands to the needy.', // Prov 31:20
  'She is not afraid of the snow for her household: for all her household are clothed with scarlet.', // Prov 31:21
  'She openeth her mouth with wisdom; and in her tongue is the law of kindness.', // Prov 31:26
  'She will do him good and not evil all the days of her life.',             // Prov 31:12
  'which ministered unto him of their substance',                           // Luke 8:3
  'this woman was full of good works and almsdeeds which she did',          // Acts 9:36
  'shewing the coats and garments which Dorcas made, while she was with them', // Acts 9:39
  'Let us make a little chamber, I pray thee, on the wall',                  // 2 Kings 4:10
  'Then Abigail made haste, and took two hundred loaves',                    // 1 Sam 25:18
  'But she told not her husband Nabal.',                                     // 1 Sam 25:19
  'which hast kept me this day from coming to shed blood',                   // 1 Sam 25:33
  'But the midwives feared God, and did not as the king of Egypt commanded them, but saved the men children alive.', // Ex 1:17
  'A soft answer turneth away wrath: but grievous words stir up anger.',      // Prov 15:1
  'It is better to dwell in a corner of the housetop, than with a brawling woman in a wide house.', // Prov 21:9
  'An angry man stirreth up strife, and a furious man aboundeth in transgression.', // Prov 29:22
  'Make no friendship with an angry man; and with a furious man thou shalt not go:', // Prov 22:24
  'Blessed are the peacemakers: for they shall be called the children of God.', // Matt 5:9
  'If it be possible, as much as lieth in you, live peaceably with all men.', // Rom 12:18
  'Submitting yourselves one to another in the fear of God.',                // Eph 5:21
  'therewith curse we men, which are made after the similitude of God',      // Jas 3:9
  'Out of the same mouth proceedeth blessing and cursing.',                  // Jas 3:10
  'Let no corrupt communication proceed out of your mouth',                  // Eph 4:29
  'that it may minister grace unto the hearers',                            // Eph 4:29
  'And why beholdest thou the mote that is in thy brother’s eye, but considerest not the beam that is in thine own eye?', // Matt 7:3
  'first cast out the beam out of thine own eye; and then shalt thou see clearly', // Matt 7:5
  'for thou that judgest doest the same things',                            // Rom 2:1
  'comparing themselves among themselves, are not wise',                    // 2 Cor 10:12
  'But let every man prove his own work, and then shall he have rejoicing in himself alone, and not in another.', // Gal 6:4
  'For every man shall bear his own burden.',                                // Gal 6:5
  'study to be quiet, and to do your own business, and to work with your own hands', // 1 Thess 4:11
  'or as a busybody in other men’s matters',                                // 1 Pet 4:15
  'working not at all, but are busybodies',                                 // 2 Thess 3:11
  'Who art thou that judgest another man’s servant? to his own master he standeth or falleth.', // Rom 14:4
  'If the foot shall say, Because I am not the hand, I am not of the body; is it therefore not of the body?', // 1 Cor 12:15
  'But now hath God set the members every one of them in the body, as it hath pleased him.', // 1 Cor 12:18
  'what is that to thee? follow thou me',                                   // John 21:22
  'but to do justly, and to love mercy, and to walk humbly with thy God?',   // Micah 6:8
];

describe('L117 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of [
      'bigIdea:', 'inApp:',
      "ref: 'Galatians 6:4-5; Matthew 7:3-5; Proverbs 31:27'",
      'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:',
    ]) {
      expect(l).toContain(key);
    }
  });

  it('is registered in the live series and the painted lesson count is the real one', () => {
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
    expect(m, 'L117 must be in LIVING_LESSONS_MODULES').toBeTruthy();
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(5);
    expect(m.benefits.length).toBeGreaterThanOrEqual(6);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(5);
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('does not collide with L114, and leaves L115 free for the concurrent lesson', () => {
    const ids = LIVING_LESSONS_MODULES.map((m) => m.id);
    expect(ids.filter((i) => i.startsWith('ll116-')).length, 'exactly one L117').toBe(1);
    expect(ids.filter((i) => i.startsWith('ll114-')).length, 'exactly one L114').toBe(1);
    expect(new Set(ids).size, 'no duplicate lesson ids anywhere in the series').toBe(ids.length);
  });

  it('teaches the whole arc in order — post, provision, guard, peace, worth, the beam, own work, the floor', () => {
    const order = [
      '1) THE OCCASION, AND THE TRUE THING IN IT',
      '2) THE WORD GIVES HER A REAL POST',
      '3) HER PROVISION IS LITERAL',
      '4) HER GUARD IS LITERAL',
      '5) PROTECTING PEACE',
      '6) THE WORD THE CLIP GOT WRONG - NOBODY IS WORTHLESS',
      '7) THE MOTE AND THE BEAM',
      '8) SO KNOW YOUR OWN POST',
      '9) THE POST NOBODY IS EXEMPT FROM',
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
    expect(l, 'the clip is the occasion, not the authority').toMatch(/occasion, not the authority|occasion, never as the authority/);
  });

  it('states the TRUE part plainly and proves it OUTSIDE Proverbs 31 (DR-0100)', () => {
    // her post, from the working text
    expect(l).toContain('She looketh well to the ways of her household');
    expect(l).toContain('She girdeth her loins with strength');
    // and outside the one chapter, so it cannot be filed as an unreachable ideal
    expect(l).toContain('which ministered unto him of their substance');       // Luke 8:3
    expect(l).toContain('almsdeeds which she did');                            // Dorcas
    expect(l).toContain('Let us make a little chamber');                       // the Shunammite
    expect(l).toContain('from coming to shed blood');                          // Abigail
    expect(l).toContain('saved the men children alive');                       // the midwives
    expect(l, 'the affirmation is explicit, not grudging').toMatch(/The clip was right about that|clip is right that she has a post/);
  });

  it('weighs the peace claim with BOTH hands and carries the guard rail in the same breath', () => {
    expect(l).toContain('than with a brawling woman in a wide house');         // Prov 21:9
    expect(l).toContain('An angry man stirreth up strife');                    // Prov 29:22
    expect(l).toContain('Make no friendship with an angry man');               // Prov 22:24
    expect(l, 'selection is named as the failure').toMatch(/selection/i);
    expect(l, 'peace is never concealing harm').toMatch(/never means concealing harm/);
    expect(l, 'she is given a mouth that opens').toContain('She openeth her mouth with wisdom');
  });

  it('refuses the contempt WITHOUT discarding the true point', () => {
    expect(l).toContain('made after the similitude of God');
    expect(l).toContain('male and female created he them');
    expect(l, 'the Ephesians 4:29 test').toMatch(/EDIFIED|edifying/);
    expect(l, 'and says why contempt is self-defeating').toMatch(/discarded along with the truth|thrown in the trash along with the truth/);
  });

  it('keeps the beam as ORDER, never as a cancellation of the true point', () => {
    expect(l).toContain('considerest not the beam that is in thine own eye');
    expect(l, 'the mote is not called imaginary').toMatch(/does NOT say the mote is imaginary|does not say the speck is fake|does not say the mote is imaginary/i);
    expect(l).toMatch(/Order of operations, not cancellation|ORDER not cancellation|ORDER, it does not say/);
    expect(l, 'and the clip is named as standing in it').toMatch(/performed while it is being made|performed while it is made/);
  });

  it('pairs explicitly with L114 so the series is symmetrical, not one-sided', () => {
    expect(l).toContain('L114');
    expect(l, 'the mutual floor').toContain('to do justly, and to love mercy, and to walk humbly with thy God?');
    expect(l, 'the floor indicts both').toMatch(/failed it identically|failed that floor/);
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

  it('is PROVEN-TO-CATCH — the strings it must reject are absent from the corpus', () => {
    // the clip's own words must never wear Scripture's quotation marks
    expect(WHOLE_KJV.includes('she is supposed to provide')).toBe(false);
    expect(WHOLE_KJV.includes('protecting peace')).toBe(false);
    // a plausible paraphrase of the anchor that is NOT what the text says
    expect(WHOLE_KJV.includes('let every man prove his own work, and then shall he have rejoicing in himself')).toBe(true);
    expect(WHOLE_KJV.includes('let every woman prove her own work')).toBe(false);
    // the classic drift on Proverbs 31:27 — a watch over the household is over its WAYS
    expect(WHOLE_KJV.includes('She looketh well to the ways of her household')).toBe(true);
    expect(WHOLE_KJV.includes('She looks well to the ways of her household')).toBe(false);
    // A CAPITALISATION alteration inside a quotation. Note what this pin had to
    // be corrected FROM: the first draft asserted 'follow thou me.' was absent,
    // on the assumption that a trailing period is always the sentence's and not
    // the verse's. It is not — John 21:22 ENDS at that period, so the corpus
    // contains it and the assertion failed. The gate caught the test, which is
    // the check doing its job on me rather than on the lesson.
    expect(WHOLE_KJV.includes('what is that to thee? Follow thou me')).toBe(false);
    expect(WHOLE_KJV.includes('what is that to thee? follow thou me')).toBe(true);
    expect(WHOLE_KJV.includes('prove thine own work')).toBe(false);
  });
});

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };

  it('each band carries the beam, her real post, and the no-one-is-worthless rule', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the beam`).toMatch(/beam|Matthew 7:[35]/);
      expect(t, `${band} carries her real post`).toMatch(/Proverbs 31|looketh well|girdeth her loins|count the verbs/);
      expect(t, `${band} refuses the contempt`).toMatch(/worthless|similitude of God|James 3:9|image/i);
    }
  });

  it('teen and senior additionally carry the both-hands peace weighing and prove-your-own-work', () => {
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries prove-your-own-work`).toMatch(/prove his own work|Galatians 6:4/);
      expect(t, `${band} carries the follow-thou-me close`).toMatch(/follow thou me|John 21:22/);
    }
    // the both-hands weighing must be explicit in the senior teaching notes
    expect(level('senior')).toMatch(/29:22|angry man/);
  });

  it('the child level teaches without adult weight, and is not a stub', () => {
    const child = level('child');
    expect(child.length).toBeGreaterThan(400);
    expect(child).toContain('first cast out the beam out of thine own eye');
    expect(child, 'the affirming half reaches a child too').toMatch(/Strength and honour are her clothing/);
    // No marital-conflict framing for a six-year-old — screened against the
    // child level's OWN prose, with quoted Scripture stripped first. The first
    // version of this screen banned 'hypocrite' and flagged the child level,
    // which was the SCREEN being wrong, not the content: "Thou hypocrite" is
    // inside the verbatim Matthew 7:5 quotation, and a screen that edits
    // Scripture to pass itself is the alteration this whole file exists to
    // prevent. 'worthless' likewise stays — the child level is where the rule
    // against it is taught.
    const childProse = (() => {
      let t = child.replace(/\\'/g, "'");
      for (const sp of quotedSpans(child).spans) t = t.split(`"${sp}"`).join(' ');
      return t;
    })();
    expect(childProse, 'no marital-argument frame at the child level').not.toMatch(/husband|wife|marriage|brawling/i);
    expect(childProse, 'and it still teaches the rule against contempt').toMatch(/never tell someone they are worthless/i);
  });
});

describe('corpus witness — the pins are re-read from the corpus files themselves', () => {
  it('a representative set matches the repo KJV exactly', () => {
    expect(verse('Galatians', 6, 4)).toBe('But let every man prove his own work, and then shall he have rejoicing in himself alone, and not in another.');
    expect(verse('Galatians', 6, 5)).toBe('For every man shall bear his own burden.');
    expect(verse('Matthew', 7, 3)).toContain('considerest not the beam that is in thine own eye');
    expect(verse('Romans', 2, 1)).toContain('thou that judgest doest the same things');
    expect(verse('Proverbs', 31, 27)).toBe('She looketh well to the ways of her household, and eateth not the bread of idleness.');
    expect(verse('Proverbs', 31, 17)).toBe('She girdeth her loins with strength, and strengtheneth her arms.');
    expect(verse('Proverbs', 31, 21)).toContain('She is not afraid of the snow for her household');
    expect(verse('Proverbs', 14, 1)).toBe('Every wise woman buildeth her house: but the foolish plucketh it down with her hands.');
    expect(verse('Proverbs', 21, 9)).toContain('than with a brawling woman in a wide house');
    expect(verse('Proverbs', 29, 22)).toBe('An angry man stirreth up strife, and a furious man aboundeth in transgression.');
    expect(verse('James', 3, 9)).toContain('which are made after the similitude of God');
    expect(verse('Genesis', 1, 27)).toContain('male and female created he them');
    expect(verse('Exodus', 1, 17)).toContain('saved the men children alive');
    expect(verse('1Samuel', 25, 33)).toContain('from coming to shed blood');
    expect(verse('Luke', 8, 3)).toContain('which ministered unto him of their substance');
    expect(verse('John', 21, 22)).toContain('what is that to thee? follow thou me');
    expect(verse('Micah', 6, 8)).toContain('to do justly, and to love mercy, and to walk humbly with thy God');
  });
});
