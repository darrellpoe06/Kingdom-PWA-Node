// =============================================================================
// L123 — "Would you sign that contract?": the answer, the qualification, and the
// manner that forfeited the argument. Verbatim KJV.
// =============================================================================
// Captured 2026-09-02 from a fourth clip Darrell brought in — a panel debate
// between an unmarried man opposing the LEGAL half of modern marriage and a
// married man defending it. This is the CAPSTONE of four (L114, L121, L122,
// L123): what a man brings, what her post actually is, the warmth that keeps a
// house, and finally how to argue about all of it without forfeiting.
//
// NAMES ARE DELIBERATELY ABSENT, and that is a gate, not an oversight. The
// transcript reaches us through automatic captioning that garbles both speakers'
// names into several different spellings across the same clip. Attaching real,
// identifiable men to an unflattering account on a guess is exactly the
// fabrication DR-0076 forbids, so the lesson says UNMARRIED SPEAKER and MARRIED
// SPEAKER throughout and states why. The assertions below enforce it.
//
// The five things this lesson had to get right, and which are pinned here:
//   • ANSWER THE QUESTION, do not dodge it as the married speaker does. As a
//     CONTRACT, no — and that is exactly why Yahweh never made marriage one.
//     He covenanted with a party He had ALREADY announced would break it
//     (Deuteronomy 31:16), called it a wedding (Ezekiel 16:8), and died for
//     people with no incentive to keep anything (Romans 5:8).
//   • THE THREE TIERS, MIDDLE ONE INCLUDED (DR-0100). Tier 1 stated plainly so
//     the man raising it is not called a coward; tier 2 named as UNMEASURED BY
//     BOTH speakers and deliberately not adjudicated; tier 3 corrected — bad
//     civil terms and withholding a covenant are two different decisions.
//   • BOTH SIDES CORRECTED, NOT ONE. A lesson that only indicted the cruder man
//     would become the thing it is correcting. The married speaker's
//     self-contradiction and his status attack are named; the unmarried
//     speaker's false premise and non-sequitur are named.
//   • THE QUALIFICATION ANSWER ENDS ON PAUL (1 Corinthians 7:8) — the rule that
//     would silence the unmarried would delete the very chapters being quoted.
//   • THE MANNER IS THE LARGEST THING IN THE CLIP (Proverbs 18:13; 18:2; James
//     1:19-20; Matthew 5:22; 1 Corinthians 13:1).
//
// Whole-span gate. Authoring L123 produced TWO real in-quote alterations, both
// caught before splicing: two verses WELDED into one quoted span (James 1:19
// ends at "slow to wrath:"; v20 is its own verse, so the joined string exists
// nowhere in the corpus), and a comma pulled inside the Deuteronomy 31:16 quote,
// which ends on a period. Both are pinned below as absent from the corpus.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll123-would-you-sign-that-contract-the-answer-the-qualification-and-the-manner-that-forfeited-it';
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
  'and break my covenant which I have made with them',                      // Deut 31:16
  'I sware unto thee, and entered into a covenant with thee',                // Ezek 16:8
  'Surely as a wife treacherously departeth from her husband',               // Jer 3:20
  'Go, take unto thee a wife of whoredoms and children of whoredoms',        // Hos 1:2
  'while we were yet sinners, Christ died for us',                          // Rom 5:8
  'Render therefore unto Caesar the things which are Caesar’s; and unto God the things that are God’s.', // Matt 22:21
  'yet is she thy companion, and the wife of thy covenant',                  // Mal 2:14
  'She considereth a field, and buyeth it: with the fruit of her hands she planteth a vineyard.', // Prov 31:16
  'She is like the merchants’ ships; she bringeth her food from afar.',      // Prov 31:14
  'She perceiveth that her merchandise is good: her candle goeth not out by night.', // Prov 31:18
  'which ministered unto him of their substance.',                          // Luke 8:3
  'He that sweareth to his own hurt, and changeth not.',                     // Ps 15:4
  'he shall not break his word, he shall do according to all that proceedeth out of his mouth', // Num 30:2
  'Better is it that thou shouldest not vow, than that thou shouldest vow and not pay.', // Eccl 5:5
  'Let no man despise thy youth; but be thou an example of the believers',   // 1 Tim 4:12
  'Ye shall know them by their fruits. Do men gather grapes of thorns, or figs of thistles?', // Matt 7:16
  'One that ruleth well his own house, having his children in subjection with all gravity;', // 1 Tim 3:4
  'I say therefore to the unmarried and widows, It is good for them if they abide even as I.', // 1 Cor 7:8
  'He that answereth a matter before he heareth it, it is folly and shame unto him.', // Prov 18:13
  'A fool hath no delight in understanding, but that his heart may discover itself.', // Prov 18:2
  'let every man be swift to hear, slow to speak, slow to wrath:',           // Jas 1:19
  'For the wrath of man worketh not the righteousness of God.',              // Jas 1:20
  'whosoever shall say to his brother, Raca, shall be in danger of the council', // Matt 5:22
  'Now the man Moses was very meek, above all the men which were upon the face of the earth.', // Num 12:3
  'in the image of God created he him; male and female created he them',    // Gen 1:27
  'And the servant of the Lord must not strive; but be gentle unto all men, apt to teach, patient,', // 2 Tim 2:24
  'In meekness instructing those that oppose themselves',                    // 2 Tim 2:25
  'Let your speech be alway with grace, seasoned with salt',                 // Col 4:6
  'It is an honour for a man to cease from strife: but every fool will be meddling.', // Prov 20:3
  'I am become as sounding brass, or a tinkling cymbal',                    // 1 Cor 13:1
  'Whoso findeth a wife findeth a good thing, and obtaineth favour of the LORD.', // Prov 18:22
  'and they shall be one flesh',                                            // Gen 2:24
];

describe('L123 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of [
      'bigIdea:', 'inApp:',
      "ref: 'Psalm 15:4; Matthew 22:21; Proverbs 18:13'",
      'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:',
    ]) {
      expect(l).toContain(key);
    }
  });

  it('is registered in the live series and the painted lesson count is the real one', () => {
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
    expect(m, 'L123 must be in LIVING_LESSONS_MODULES').toBeTruthy();
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(5);
    expect(m.benefits.length).toBeGreaterThanOrEqual(6);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(5);
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('no duplicate lesson id anywhere in the series', () => {
    const ids = LIVING_LESSONS_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('DOES NOT NAME THE SPEAKERS, and says why (DR-0076 — no provenance on a guess)', () => {
    expect(l, 'the refusal is stated in the lesson itself').toMatch(/A NOTE ON NAMES|not named here/);
    expect(l, 'and the reason is the garbled captioning').toMatch(/automatic captioning|garbles/);
    expect(l).toContain('UNMARRIED SPEAKER');
    expect(l).toContain('MARRIED SPEAKER');
    // the facilitator notes must carry the instruction forward to whoever teaches it
    expect(l).toMatch(/DO NOT NAME THE SPEAKERS/);
  });

  it('teaches the whole arc in order', () => {
    const order = [
      '1) WHAT IS ACTUALLY BEING ASKED',
      '2) THE ANSWER: YAHWEH SIGNED EXACTLY THAT CONTRACT, KNOWINGLY',
      '3) CONTRACT AND COVENANT ARE TWO DIFFERENT INSTRUMENTS',
      '4) THE PRINCIPLE THAT ENDS THE SPIRITUAL-OR-LEGAL FIGHT',
      '5) THE PREMODERN PREMISE IS FALSE',
      '6) THE LEGAL CLAIM, IN THREE HONEST TIERS',
      '7) A VOW THAT DEPENDS ON THE OTHER PARTY’S INCENTIVES WAS NEVER A VOW',
      '8) WHO IS QUALIFIED TO SPEAK',
      '9) THE MANNER FORFEITED THE ARGUMENT',
      '10) THE QUESTION NEITHER MAN ASKED',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('ANSWERS the question rather than dodging it, in both halves', () => {
    expect(l, 'the honest concession to the asker').toMatch(/no rational businessman signs it|nobody rational signs terms/);
    expect(l, 'and the reason the frame is wrong').toMatch(/which is exactly why Yahweh never made (marriage )?(it )?one|why Yahweh never made it one/);
    // the answer sequence, in the order the facilitator notes require
    expect(l).toContain('and break my covenant which I have made with them');
    expect(l).toContain('I sware unto thee, and entered into a covenant with thee');
    expect(l).toContain('while we were yet sinners, Christ died for us');
    expect(l, 'and the married speaker is named as having dodged it').toMatch(/never answers it/);
  });

  it('does not stretch Matthew 22:21 past its occasion — the REASONED pass (DR-0281)', () => {
    // Found by running COMPREHENSIVE-REVIEW-STANDARD dimension 8 question (c) by
    // hand: the first draft said Jesus "ALREADY SETTLED" the spiritual-or-legal
    // fight, but that verse answers a question about TRIBUTE MONEY. The PRINCIPLE
    // transfers; the ruling was not about a marriage licence, and the lesson now
    // says which is which instead of borrowing the Lord's authority for a claim
    // He did not make there.
    expect(l, 'the occasion is disclosed').toMatch(/TRIBUTE MONEY/);
    expect(l, 'and what transfers is named as the principle').toMatch(/What transfers is the PRINCIPLE/);
    expect(l, 'and the over-claim is explicitly withdrawn').toMatch(/did not rule on marriage law in that moment/);
  });

  it('licenses the divine-covenant → human-marriage transfer instead of assuming it', () => {
    // Same pass, question (c). L122 carried its Ephesians 5:32 licence for
    // Revelation 2; this lesson made the same kind of move from Yahweh's covenant
    // with Israel to a human marriage and did NOT carry it. Without the licence
    // the whole answer is an analogy we assembled.
    expect(l).toContain('This is a great mystery: but I speak concerning Christ and the church.');
    expect(l).toMatch(/which is the licence/);
    expect(l).toMatch(/an analogy we assembled/);
  });

  it('keeps the Paul claim to the size 1 Corinthians 7:8 actually supports', () => {
    // Same pass, question (a). The first draft said Paul was unmarried "when he
    // wrote" the New Testament's marriage instruction and named Ephesians 5. No
    // text states his situation at that writing; 1 Corinthians 7 states it in the
    // chapter itself. The claim is now scoped to what the verse carries.
    expect(l).toContain('I say therefore to the unmarried and widows, It is good for them if they abide even as I.');
    expect(l, 'the scope is stated out loud').toMatch(/Keep the claim exactly that size/);
    expect(l, 'and the unsupported half is withdrawn').toMatch(/no text tells us his situation when Ephesians was written/);
    expect(l, 'so the consequence names only the supported chapter').toMatch(/would strike out 1 Corinthians 7 -/);
  });

  it('separates the two instruments with Matthew 22:21', () => {
    expect(l).toContain('Render therefore unto Caesar the things which are Caesar’s; and unto God the things that are God’s.');
    expect(l).toMatch(/Caesar keeps a register/);
    expect(l).toMatch(/two jurisdictions can each hold what is theirs/);
    expect(l).toMatch(/refusing the paper does not make the covenant holier/i);
  });

  it('falsifies the load-bearing premise from the WORD, not from statistics', () => {
    expect(l).toContain('She considereth a field, and buyeth it');
    expect(l).toContain('which ministered unto him of their substance.');
    expect(l).toMatch(/the Word contradicts it|the Word is what falsifies it/i);
  });

  it('holds all THREE tiers, including the middle one it refuses to adjudicate (DR-0100)', () => {
    expect(l, 'tier 1 said plainly, and the asker is not called a coward').toMatch(/is not a coward/);
    expect(l, 'tier 2 named as unmeasured BY BOTH').toMatch(/NEITHER speaker measured|neither speaker measured|measured by NEITHER/);
    expect(l, 'and explicitly not adjudicated').toMatch(/does not adjudicate/);
    expect(l, 'tier 3 — the non-sequitur').toMatch(/the conclusion does not follow/i);
    expect(l).toMatch(/two different decisions/);
  });

  it('puts the vow where Scripture puts it — the costly case', () => {
    expect(l).toContain('He that sweareth to his own hurt, and changeth not.');
    expect(l).toContain('Better is it that thou shouldest not vow, than that thou shouldest vow and not pay.');
    expect(l, 'the costly case is emphasised').toMatch(/own HURT/);
    expect(l, 'and it takes the caution MORE seriously, not less').toMatch(/more seriously than he does|MORE seriously than the clip does/i);
  });

  it('settles the qualification fight all four ways, ending on Paul', () => {
    expect(l).toContain('Let no man despise thy youth');
    expect(l).toContain('Ye shall know them by their fruits');
    expect(l).toContain('One that ruleth well his own house');
    expect(l).toContain('I say therefore to the unmarried and widows, It is good for them if they abide even as I.');
    expect(l, 'the decisive consequence').toMatch(/would (strike out|silence|delete)/);
    expect(l, 'and the married speaker is granted what he was reaching for').toMatch(/reaching for something real|genuinely reaching for/);
  });

  it('names what the MANNER cost — and indicts BOTH men, not one', () => {
    expect(l).toContain('He that answereth a matter before he heareth it, it is folly and shame unto him.');
    expect(l).toContain('but that his heart may discover itself');
    expect(l).toContain('For the wrath of man worketh not the righteousness of God.');
    expect(l).toContain('Raca, shall be in danger of the council');
    expect(l).toContain('I am become as sounding brass, or a tinkling cymbal');
    expect(l, 'the verdict').toMatch(/You can hold the correct position and still be noise|right in the wrong spirit/);
    expect(l, 'both, not one — or the lesson becomes the thing it corrects').toMatch(/Both men were noise|BOTH men lost|both men lost/);
  });

  it('answers the feminine-as-slur move from the Word, not from etiquette', () => {
    expect(l).toContain('Now the man Moses was very meek, above all the men which were upon the face of the earth.');
    expect(l).toContain('male and female created he them');
    expect(l, 'pairs with L115, which established it').toContain('L115');
  });

  it('closes on the question neither man asked, and hands back to L114 and L122', () => {
    expect(l).toMatch(/what a man is FOR/);
    expect(l).toContain('L114');
    // The favourite-person lesson. This assertion went stale through the
    // renumber cascades — each pass fixed a file's OWN number and missed the
    // SIBLING references, which is exactly how a cross-reference rots. Fixed by
    // auditing every L-number in all three lessons and gates rather than
    // blanket-replacing, since L114/L115/L117/L118 legitimately point at other
    // sessions' merged lessons and must not move.
    expect(l).toContain('L122');
    expect(l).toContain('Whoso findeth a wife findeth a good thing, and obtaineth favour of the LORD.');
    expect(l, 'and names the irony without sneering').toMatch(/quoted correctly and then failed to live/);
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

  it('is PROVEN-TO-CATCH against the two alterations actually made while authoring THIS lesson', () => {
    // 1. Two verses WELDED into one span. James 1:19 ends at "slow to wrath:" and
    //    v20 is its own verse, so the joined string is nowhere in the corpus —
    //    a class of alteration that reads perfectly and is still not the text.
    expect(WHOLE_KJV.includes('slow to wrath: For the wrath of man worketh not')).toBe(false);
    expect(WHOLE_KJV.includes('let every man be swift to hear, slow to speak, slow to wrath:')).toBe(true);
    expect(WHOLE_KJV.includes('For the wrath of man worketh not the righteousness of God.')).toBe(true);
    // 2. A comma pulled inside — Deuteronomy 31:16 ends that clause on a period.
    expect(WHOLE_KJV.includes('break my covenant which I have made with them,')).toBe(false);
    expect(WHOLE_KJV.includes('break my covenant which I have made with them')).toBe(true);
  });
});

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };

  it('each band carries the manner lesson — hear it out, and being right is not enough', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries answering-before-hearing`).toMatch(/before he heareth it|Proverbs 18:13/);
      expect(t, `${band} carries the sounding-brass verdict`).toMatch(/sounding brass|1 Corinthians 13:1/);
    }
  });

  it('teen and senior additionally carry the answer sequence and the qualification ending', () => {
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the covenant-with-a-breaker answer`).toMatch(/Deuteronomy 31:16|break my covenant/);
      expect(t, `${band} carries the two instruments`).toMatch(/Matthew 22:21|Caesar/);
      expect(t, `${band} carries the vow in the costly case`).toMatch(/Psalm 15:4|own hurt/);
      expect(t, `${band} ends the qualification fight on Paul`).toMatch(/1 Corinthians 7:8|unmarried when he wrote/);
    }
  });

  it('the child level teaches the transferable truth without the adult argument', () => {
    const child = level('child');
    expect(child.length).toBeGreaterThan(400);
    expect(child, 'it teaches testing the claim, not the person').toContain('Ye shall know them by their fruits');
    const childProse = (() => {
      let t = child.replace(/\\'/g, "'");
      for (const sp of quotedSpans(child).spans) t = t.split(`"${sp}"`).join(' ');
      return t;
    })();
    expect(childProse, 'no marriage/legal/contract weight for a six-year-old')
      .not.toMatch(/marriage|divorce|alimony|contract|wife|husband|feminine/i);
  });
});

describe('corpus witness — the pins are re-read from the corpus files themselves', () => {
  it('a representative set matches the repo KJV exactly', () => {
    expect(verse('Deuteronomy', 31, 16)).toContain('break my covenant which I have made with them');
    expect(verse('Ezekiel', 16, 8)).toContain('I sware unto thee, and entered into a covenant with thee');
    expect(verse('Romans', 5, 8)).toContain('while we were yet sinners, Christ died for us');
    expect(verse('Matthew', 22, 21)).toContain('Render therefore unto Caesar the things which are Caesar');
    expect(verse('Psalms', 15, 4)).toContain('He that sweareth to his own hurt, and changeth not.');
    expect(verse('Ecclesiastes', 5, 5)).toBe('Better is it that thou shouldest not vow, than that thou shouldest vow and not pay.');
    expect(verse('Numbers', 30, 2)).toContain('he shall not break his word');
    expect(verse('1Timothy', 4, 12)).toContain('Let no man despise thy youth');
    expect(verse('Matthew', 7, 16)).toContain('Ye shall know them by their fruits');
    expect(verse('1Corinthians', 7, 8)).toBe('I say therefore to the unmarried and widows, It is good for them if they abide even as I.');
    expect(verse('Proverbs', 18, 13)).toBe('He that answereth a matter before he heareth it, it is folly and shame unto him.');
    expect(verse('Proverbs', 18, 2)).toBe('A fool hath no delight in understanding, but that his heart may discover itself.');
    expect(verse('James', 1, 19)).toContain('swift to hear, slow to speak, slow to wrath');
    expect(verse('James', 1, 20)).toBe('For the wrath of man worketh not the righteousness of God.');
    expect(verse('Matthew', 5, 22)).toContain('Raca, shall be in danger of the council');
    expect(verse('1Corinthians', 13, 1)).toContain('I am become as sounding brass, or a tinkling cymbal');
    expect(verse('Numbers', 12, 3)).toContain('Now the man Moses was very meek');
  });
});
