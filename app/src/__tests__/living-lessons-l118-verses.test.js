// =============================================================================
// L118 — Abstention: "if I am an option, do not pick me," the refused stone, and
// the choosing that was settled before there was a list. Verbatim KJV.
// =============================================================================
// Captured from Darrell's spoken word, 2026-09-03 — a declaration against being
// weighed on a scale of convenience: do not compare me, do not bench me on your
// indecision, do not call me friend when you mean convenient; I am not the maybe
// in your sentence, I am the period; you cannot bargain with what is priceless;
// and if I am an option, do not pick me, because I was already chosen — by
// peace, by purpose, and by Yahweh.
//
// The five things this lesson had to get right, and which are pinned here:
//   • SOURCE DISCIPLINE. The spoken piece is the OCCASION for a Word-first
//     study, never an authority standing beside Scripture. What it claims is
//     tested by the Word: upheld where the Word upholds it, corrected where the
//     flesh runs past it.
//   • THE GROUND IS THE REFUSED STONE, NOT THE GRIEVANCE. Isaiah 53:3,
//     Psalm 118:22, 1 Peter 2:4 — two ledgers on one stone, and only the
//     Father's decided anything.
//   • THE QUALIFICATION IS TEMPORAL, AND IT IS THE ONE MOST READERS MISS.
//     Counting the cost is COMMANDED before a commitment (Luke 14:28;
//     Deuteronomy 30:19) and forbidden after it (Ecclesiastes 5:4-5;
//     Matthew 5:37). Movement 6 exists so nobody reads ordinary carefulness as
//     disrespect.
//   • THE CORRECTION IS NOT OPTIONAL. Movement 11 is the movement the spoken
//     piece does not contain; without it the lesson arms people. A guarded heart
//     and a long-suffering heart are the same Bible (Proverbs 4:23 beside
//     1 Corinthians 13:4-7); absence is not a sentence we pass (Romans 12:18-19);
//     and a demand to be chosen without comparison, made of a human being, seats
//     a creature where only the Creator belongs (Jeremiah 17:5,7; Psalm 118:8).
//   • DR-0098 / DR-0100. The Word teaches this; it is not staged as a debate
//     between the piece and Scripture, and the correction is stated plainly
//     rather than hedged.
//
// The whole-span gate rides again: no quoted span may differ from the in-repo KJV
// by a single character. Authoring L118 produced ZERO in-quote alterations — the
// sweep is stated honestly below rather than dressed up — but the research DID
// expose a real, NEW hole in that gate, and this file closes it.
//
// THE NEW GATE — CORRECT TEXT, WRONG REFERENCE. The whole-span gate asks only
// "does this string exist somewhere in the Bible?" It cannot see a quotation that
// is real KJV but hung on the wrong verse. This lesson walks straight through the
// trap: Scripture cites Psalm 118:22 four separate times and uses a DIFFERENT
// word each time — refused (Psalm 118:22), rejected (Matthew 21:42; Mark 12:10;
// Luke 20:17), "set at nought" (Acts 4:11), disallowed (1 Peter 2:7). Writing
// "The stone which the builders rejected" and attributing it to Psalm 118:22 is
// the single most likely error in this lesson, it is what memory reaches for, and
// the old gate passes it silently because the string is genuinely in Matthew.
// The ATTRIBUTION gate below checks each pinned fragment against THAT verse, and
// is asserted proven-to-catch on exactly that case.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll118-abstention-if-i-am-an-option-do-not-pick-me-and-the-choosing-settled-before-there-was-a-list';
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

// Fragment → the verse it is attributed to in this lesson. Every entry is checked
// against THAT verse, not merely against the whole corpus.
const ATTRIBUTED = [
  ['He is despised and rejected of men; a man of sorrows, and acquainted with grief', 'Isaiah', 53, 3],
  ['he was despised, and we esteemed him not.', 'Isaiah', 53, 3],
  ['The stone which the builders refused is become the head stone of the corner.', 'Psalms', 118, 22],
  ['The stone which the builders rejected, the same is become the head of the corner', 'Matthew', 21, 42],
  ['The stone which the builders rejected is become the head of the corner:', 'Mark', 12, 10],
  ['This is the stone which was set at nought of you builders, which is become the head of the corner.', 'Acts', 4, 11],
  ['the stone which the builders disallowed, the same is made the head of the corner,', '1Peter', 2, 7],
  ['Unto you therefore which believe he is precious', '1Peter', 2, 7],
  ['disallowed indeed of men, but chosen of God, and precious,', '1Peter', 2, 4],
  ['Behold the Lamb of God, which taketh away the sin of the world.', 'John', 1, 29],
  ['How long halt ye between two opinions? if the LORD be God, follow him: but if baal, then follow him.', '1Kings', 18, 21],
  ['And the people answered him not a word.', '1Kings', 18, 21],
  ['choose you this day whom ye will serve', 'Joshua', 24, 15],
  ['but as for me and my house, we will serve the LORD.', 'Joshua', 24, 15],
  ['No man can serve two masters: for either he will hate the one, and love the other', 'Matthew', 6, 24],
  ['Ye cannot serve God and mammon.', 'Matthew', 6, 24],
  ['I know thy works, that thou art neither cold nor hot: I would thou wert cold or hot.', 'Revelation', 3, 15],
  ['So then because thou art lukewarm, and neither cold nor hot, I will spue thee out of my mouth.', 'Revelation', 3, 16],
  ['for the LORD, whose name is Jealous, is a jealous God', 'Exodus', 34, 14],
  ['According as he hath chosen us in him before the foundation of the world', 'Ephesians', 1, 4],
  ['Having predestinated us unto the adoption of children by Jesus Christ to himself, according to the good pleasure of his will,', 'Ephesians', 1, 5],
  ['not according to our works, but according to his own purpose and grace, which was given us in Christ Jesus before the world began', '2Timothy', 1, 9],
  ['Ye have not chosen me, but I have chosen you, and ordained you', 'John', 15, 16],
  ['Before I formed thee in the belly I knew thee; and before thou camest forth out of the womb I sanctified thee', 'Jeremiah', 1, 5],
  ['I am fearfully and wonderfully made', 'Psalms', 139, 14],
  ['in thy book all my members were written', 'Psalms', 139, 16],
  ['But ye are a chosen generation, a royal priesthood, an holy nation, a peculiar people', '1Peter', 2, 9],
  ['the LORD thy God hath chosen thee to be a special people unto himself', 'Deuteronomy', 7, 6],
  ['The LORD did not set his love upon you, nor choose you, because ye were more in number than any people; for ye were the fewest of all people:', 'Deuteronomy', 7, 7],
  ['the fewest of all people:', 'Deuteronomy', 7, 7],
  ['man looketh on the outward appearance, but the LORD looketh on the heart', '1Samuel', 16, 7],
  ['measuring themselves by themselves, and comparing themselves among themselves, are not wise', '2Corinthians', 10, 12],
  ['But let every man prove his own work, and then shall he have rejoicing in himself alone, and not in another.', 'Galatians', 6, 4],
  ['For every man shall bear his own burden.', 'Galatians', 6, 5],
  ['which of you, intending to build a tower, sitteth not down first, and counteth the cost', 'Luke', 14, 28],
  ['I have set before you life and death, blessing and cursing: therefore choose life', 'Deuteronomy', 30, 19],
  ['When thou vowest a vow unto God, defer not to pay it', 'Ecclesiastes', 5, 4],
  ['Better is it that thou shouldest not vow, than that thou shouldest vow and not pay.', 'Ecclesiastes', 5, 5],
  ['But let your communication be, Yea, yea; Nay, nay', 'Matthew', 5, 37],
  ['for love is strong as death', 'SongofSolomon', 8, 6],
  ['the coals thereof are coals of fire, which hath a most vehement flame.', 'SongofSolomon', 8, 6],
  ['Many waters cannot quench love, neither can the floods drown it', 'SongofSolomon', 8, 7],
  ['if a man would give all the substance of his house for love, it would utterly be contemned.', 'SongofSolomon', 8, 7],
  ['ye were not redeemed with corruptible things, as silver and gold', '1Peter', 1, 18],
  ['But with the precious blood of Christ, as of a lamb without blemish and without spot:', '1Peter', 1, 19],
  ['know ye not that your body is the temple of the Holy Ghost which is in you, which ye have of God, and ye are not your own?', '1Corinthians', 6, 19],
  ['For ye are bought with a price', '1Corinthians', 6, 20],
  ['Ye are bought with a price; be not ye the servants of men.', '1Corinthians', 7, 23],
  ['Who, when he had found one pearl of great price, went and sold all that he had, and bought it.', 'Matthew', 13, 46],
  ['Who can find a virtuous woman? for her price is far above rubies.', 'Proverbs', 31, 10],
  ['I have called thee by thy name; thou art mine.', 'Isaiah', 43, 1],
  ['Since thou wast precious in my sight, thou hast been honourable, and I have loved thee', 'Isaiah', 43, 4],
  ['A double minded man is unstable in all his ways.', 'James', 1, 8],
  ['purify your hearts, ye double minded', 'James', 4, 8],
  ['Intreat me not to leave thee, or to return from following after thee: for whither thou goest, I will go', 'Ruth', 1, 16],
  ['the LORD do so to me, and more also, if ought but death part thee and me.', 'Ruth', 1, 17],
  ['shall cleave unto his wife: and they shall be one flesh.', 'Genesis', 2, 24],
  ['Husbands, love your wives, even as Christ also loved the church, and gave himself for it;', 'Ephesians', 5, 25],
  ['A friend loveth at all times, and a brother is born for adversity.', 'Proverbs', 17, 17],
  ['there is a friend that sticketh closer than a brother.', 'Proverbs', 18, 24],
  ['Greater love hath no man than this, that a man lay down his life for his friends.', 'John', 15, 13],
  ['Confidence in an unfaithful man in time of trouble is like a broken tooth, and a foot out of joint.', 'Proverbs', 25, 19],
  ['At my first answer no man stood with me, but all men forsook me', '2Timothy', 4, 16],
  ['Notwithstanding the Lord stood with me, and strengthened me', '2Timothy', 4, 17],
  ['When my father and my mother forsake me, then the LORD will take me up.', 'Psalms', 27, 10],
  ['Keep thy heart with all diligence; for out of it are the issues of life.', 'Proverbs', 4, 23],
  ['Charity suffereth long, and is kind; charity envieth not', '1Corinthians', 13, 4],
  ['seeketh not her own, is not easily provoked, thinketh no evil', '1Corinthians', 13, 5],
  ['Beareth all things, believeth all things, hopeth all things, endureth all things.', '1Corinthians', 13, 7],
  ['If it be possible, as much as lieth in you, live peaceably with all men.', 'Romans', 12, 18],
  ['avenge not yourselves, but rather give place unto wrath', 'Romans', 12, 19],
  ['Let all bitterness, and wrath, and anger, and clamour, and evil speaking, be put away from you, with all malice:', 'Ephesians', 4, 31],
  ['And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ’s sake hath forgiven you.', 'Ephesians', 4, 32],
  ['in lowliness of mind let each esteem other better than themselves.', 'Philippians', 2, 3],
  ['Cursed be the man that trusteth in man, and maketh flesh his arm', 'Jeremiah', 17, 5],
  ['Blessed is the man that trusteth in the LORD, and whose hope the LORD is.', 'Jeremiah', 17, 7],
  ['It is better to trust in the LORD than to put confidence in man.', 'Psalms', 118, 8],
  ['And let the peace of God rule in your hearts, to the which also ye are called in one body', 'Colossians', 3, 15],
  ['to them who are the called according to his purpose.', 'Romans', 8, 28],
  ['I will never leave thee, nor forsake thee.', 'Hebrews', 13, 5],
  ['For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers', 'Romans', 8, 38],
  ['shall be able to separate us from the love of God, which is in Christ Jesus our Lord.', 'Romans', 8, 39],
  ['they that are with him are called, and chosen, and faithful.', 'Revelation', 17, 14],
];

describe('L118 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of [
      'bigIdea:', 'inApp:',
      "ref: 'Psalm 118:22; Ephesians 1:4; Song of Solomon 8:7'",
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

  it('every quiz question has a real answer index and an explanation', () => {
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
    for (const q of m.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });

  it('teaches the whole arc in order — ground, jealousy, choosing, comparison, cost, fire, price, period, friendship, correction, settlement', () => {
    const order = [
      '1) THE WORD AS IT WAS SPOKEN',
      '2) THE ONE WHO WAS NOT PICKED',
      '3) YAHWEH HIMSELF WILL NOT BE AN OPTION',
      '4) YOU WERE CHOSEN BEFORE THERE WAS A LIST',
      '5) THE SCALE OF CONVENIENCE, AND WHO LOOKS GOOD ON PAPER',
      '6) COUNT THE COST - WHERE WEIGHING IS COMMANDED',
      '7) YOU DO NOT ANALYZE FIRE',
      '8) THE PRICE WAS ALREADY PAID, AND IT WAS NOT SILVER',
      '9) NOT THE MAYBE - THE PERIOD',
      '10) FRIEND IS NOT A WORD FOR CONVENIENCE',
      '11) WHERE THIS TURNS INTO PRIDE - THE CORRECTION',
      '12) ALREADY CHOSEN - BY PEACE, BY PURPOSE, AND BY YAHWEH',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('carries every claim of the spoken declaration that was actually given', () => {
    expect(l).toContain('Darrell');
    expect(l, 'the title claim').toMatch(/if I am an option, do not pick me|IF I AM AN OPTION, DO NOT PICK ME/);
    expect(l, 'the scale of convenience').toMatch(/scale of convenience/);
    expect(l, 'the bench of indecision').toMatch(/bench me|backup/i);
    expect(l, 'the maybe and the period').toMatch(/I am not the maybe/);
    expect(l, 'friend used for convenience').toMatch(/friend when all you mean is convenient/);
    expect(l, 'you cannot bargain with what is priceless').toMatch(/bargain/);
    expect(l, 'his closing trio, in his order').toMatch(/by peace, by purpose, and by Yahweh/);
  });

  it('keeps SOURCE DISCIPLINE — the spoken piece is the occasion, never an authority beside Scripture', () => {
    expect(l).toMatch(/SPOKEN DECLARATION|spoken declaration/);
    expect(l).toMatch(/never an authority standing beside Scripture|never the authority/i);
    expect(l, 'tested by the Word, not asserted over it').toMatch(/tested by the Word/);
    expect(l, 'the facilitator says it out loud too').toMatch(/OCCASION, NOT THE AUTHORITY|the OCCASION for/);
  });

  it('grounds the lesson on the refused stone before it is applied to any relationship', () => {
    expect(l).toContain('He is despised and rejected of men');
    expect(l).toContain('The stone which the builders refused is become the head stone of the corner.');
    expect(l).toContain('disallowed indeed of men, but chosen of God, and precious,');
    expect(l, 'two ledgers, one stone').toMatch(/two ledgers|Two ledgers/);
  });

  it('teaches the four words Scripture uses for that one act — the research the lesson turns on', () => {
    expect(l).toContain('The stone which the builders rejected, the same is become the head of the corner');
    expect(l).toContain('This is the stone which was set at nought of you builders');
    expect(l).toContain('the stone which the builders disallowed, the same is made the head of the corner,');
    expect(l).toMatch(/Refused\. Rejected\. Set at nought\. Disallowed\./);
  });

  it('puts the choosing before every comparison — the doctrinal centre', () => {
    expect(l).toContain('According as he hath chosen us in him before the foundation of the world');
    expect(l).toContain('not according to our works, but according to his own purpose and grace');
    expect(l).toContain('Ye have not chosen me, but I have chosen you');
    expect(l, 'the metric is removed on purpose').toContain('the fewest of all people:');
  });

  it('draws the qualification in TIME — weighing is commanded before, forbidden after', () => {
    expect(l).toContain('which of you, intending to build a tower, sitteth not down first, and counteth the cost');
    expect(l).toContain('Better is it that thou shouldest not vow, than that thou shouldest vow and not pay.');
    expect(l, 'the line is temporal, not emotional').toMatch(/line of TIME|TEMPORAL|temporal/);
    expect(l, 'careful thought before a yes is not an insult').toMatch(/obedience, not insult|is obedience/);
  });

  it('carries the correction the spoken piece does not contain (movement 11)', () => {
    expect(l, 'a guarded heart and a long-suffering heart are the same Bible').toContain('Keep thy heart with all diligence');
    expect(l).toContain('Beareth all things, believeth all things, hopeth all things, endureth all things.');
    expect(l, 'absence is not a sentence we pass').toContain('avenge not yourselves, but rather give place unto wrath');
    expect(l, 'the locked door wearing the clothes of peace').toContain('Let all bitterness, and wrath, and anger, and clamour, and evil speaking');
    expect(l, 'the idolatry-shaped demand').toContain('Cursed be the man that trusteth in man, and maketh flesh his arm');
  });

  it('closes on the order in Revelation 17:14 — faithfulness follows the choosing, never buys it', () => {
    expect(l).toContain('they that are with him are called, and chosen, and faithful.');
    expect(l).toMatch(/AFTER the choosing, never as its price|Faithfulness follows the choosing/);
  });

  it('keeps our authored voice on Yahweh, with no capitalized adversary or false-god name', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bSatan\b/g) || []).length).toBe(0);
    expect((ours.match(/\bLucifer\b/g) || []).length).toBe(0);
    expect((ours.match(/\bBaal\b/g) || []).length, 'the false god stays named low in our voice').toBe(0);
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(15);
  });

  it('confesses Jesus as the Lamb of Yahweh (DR-0210)', () => {
    expect(l).toMatch(/Lamb of Yahweh/);
    expect(l).toContain('Behold the Lamb of God, which taketh away the sin of the world.');
  });
});

describe('every attributed fragment is letter-for-letter KJV, in the verse it is hung on', () => {
  for (const [frag, book, ch, v] of ATTRIBUTED) {
    it(`${book} ${ch}:${v} — "${frag.slice(0, 44)}${frag.length > 44 ? '…' : ''}"`, () => {
      expect(l, 'the lesson must actually contain the fragment').toContain(frag);
      expect(verse(book, ch, v), 'the fragment must be in THAT verse').toContain(frag);
    });
  }
});

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the lesson’s double quotes are balanced', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span appears verbatim in the in-repo KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length).toBeGreaterThan(150);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((s) => s.trim()).filter(Boolean)) {
        if (!WHOLE_KJV.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });
});

describe('the ATTRIBUTION gate is proven-to-catch what the whole-span gate cannot see', () => {
  it('catches CORRECT KJV text hung on the WRONG verse — the exact trap this lesson walks through', () => {
    // "rejected" is real KJV — Matthew/Mark/Luke quoting Psalm 118:22 — so the
    // whole-corpus sweep passes it silently. It is NOT what Psalm 118:22 says,
    // and it is what memory reaches for. Only a per-verse check sees this.
    const misremembered = 'The stone which the builders rejected';
    expect(WHOLE_KJV.includes(misremembered), 'the whole-span gate would PASS this').toBe(true);
    expect(verse('Psalms', 118, 22).includes(misremembered), 'but it is not what Psalm 118:22 says').toBe(false);
    expect(verse('Psalms', 118, 22)).toContain('The stone which the builders refused');
    expect(verse('Matthew', 21, 42)).toContain(misremembered);
    // and the lesson itself never makes that mistake
    expect(l).not.toMatch(/builders rejected[^(]*\(Psalm/);
  });

  it('catches the other three words hung on the wrong citation', () => {
    expect(verse('Acts', 4, 11)).toContain('set at nought of you builders');
    expect(verse('Psalms', 118, 22).includes('set at nought')).toBe(false);
    expect(verse('1Peter', 2, 7)).toContain('the builders disallowed');
    expect(verse('Mark', 12, 10).includes('disallowed')).toBe(false);
  });

  it('is PROVEN-TO-CATCH against CROSS-VERSE joins built from this lesson’s own texts', () => {
    // Each half is real; the JOIN silently deletes a verse boundary.
    const song = 'which hath a most vehement flame. Many waters cannot quench love';
    expect(WHOLE_KJV.includes(song), 'Song of Solomon 8:6-7 joined across the boundary').toBe(false);
    expect(WHOLE_KJV.includes('which hath a most vehement flame.')).toBe(true);
    expect(WHOLE_KJV.includes('Many waters cannot quench love')).toBe(true);

    const rev = 'I would thou wert cold or hot. So then because thou art lukewarm';
    expect(WHOLE_KJV.includes(rev), 'Revelation 3:15-16 joined across the boundary').toBe(false);
    expect(WHOLE_KJV.includes('I would thou wert cold or hot.')).toBe(true);
    expect(WHOLE_KJV.includes('So then because thou art lukewarm')).toBe(true);
  });

  it('is PROVEN-TO-CATCH against single-word drift in this lesson’s hardest quotations', () => {
    // contemned/condemned is one letter apart and changes the meaning entirely.
    expect(WHOLE_KJV.includes('it would utterly be condemned')).toBe(false);
    expect(WHOLE_KJV.includes('it would utterly be contemned')).toBe(true);
    // dropping the second "and" out of the final roll
    expect(WHOLE_KJV.includes('called, chosen, and faithful')).toBe(false);
    expect(WHOLE_KJV.includes('called, and chosen, and faithful')).toBe(true);
    // "elect" for "chosen" in 1 Peter 2:4
    expect(WHOLE_KJV.includes('disallowed indeed of men, but elect of God')).toBe(false);
  });

  it('never lets our own framing wear Scripture’s quotation marks', () => {
    for (const ours of [
      'If I am an option, do not pick me',
      'a scale of convenience',
      'you do not analyze fire',
      'by peace, by purpose, and by Yahweh',
    ]) {
      expect(WHOLE_KJV.includes(ours), `our framing must not be quotable as Scripture: ${ours}`).toBe(false);
    }
  });
});

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };

  it('each band carries the refused stone and the choosing that predates the list', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the refused stone`).toMatch(/builders refused|head stone of the corner/);
      expect(t, `${band} carries the choosing before the world`).toMatch(/before the foundation of the world/);
    }
  });

  it('each band carries the correction — knowing your worth is not permission to harden', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} refuses the hardened heart`).toMatch(/be ye kind one to another|Charity suffereth long|Let all bitterness|live peaceably|Beareth all things/);
    }
  });

  it('teen and senior additionally carry the cost-timing, the fire, and the maybe', () => {
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries counting the cost`).toContain('counteth the cost');
      expect(t, `${band} carries the fire that cannot be bought`).toMatch(/utterly be contemned|most vehement flame/);
      expect(t, `${band} carries the maybe`).toMatch(/double minded|cold nor hot/);
      expect(t, `${band} refuses to seat a creature in the Creator’s seat`).toMatch(/trusteth in man|confidence in man/);
    }
  });

  it('the child level teaches without adult weight, and is not a stub', () => {
    const child = level('child');
    expect(child.length).toBeGreaterThan(400);
    // the piece is a declaration about romantic and adult relational worth; a
    // six-year-old gets being left out of a team, not a relationship post-mortem.
    expect(child).not.toMatch(/romantic|dating|boyfriend|girlfriend|marriage/i);
    expect(child, 'the child gets the being-picked frame').toMatch(/pick/i);
    expect(child, 'a child gets the bedtime verse, not just the principle').toContain('When my father and my mother forsake me, then the LORD will take me up.');
  });
});

describe('corpus witness — the pins are re-read from the corpus files themselves', () => {
  it('a representative set matches the repo KJV exactly', () => {
    expect(verse('Psalms', 118, 22)).toBe('The stone which the builders refused is become the head stone of the corner.');
    expect(verse('Isaiah', 53, 3)).toContain('he was despised, and we esteemed him not.');
    expect(verse('1Peter', 2, 4)).toBe('To whom coming, as unto a living stone, disallowed indeed of men, but chosen of God, and precious,');
    expect(verse('Ephesians', 1, 4)).toContain('before the foundation of the world');
    expect(verse('Deuteronomy', 7, 7)).toContain('for ye were the fewest of all people:');
    expect(verse('SongofSolomon', 8, 7)).toBe('Many waters cannot quench love, neither can the floods drown it: if a man would give all the substance of his house for love, it would utterly be contemned.');
    expect(verse('Luke', 14, 28)).toContain('counteth the cost');
    expect(verse('Ecclesiastes', 5, 5)).toBe('Better is it that thou shouldest not vow, than that thou shouldest vow and not pay.');
    expect(verse('James', 1, 8)).toBe('A double minded man is unstable in all his ways.');
    expect(verse('1Corinthians', 7, 23)).toBe('Ye are bought with a price; be not ye the servants of men.');
    expect(verse('Jeremiah', 17, 5)).toContain('Cursed be the man that trusteth in man');
    expect(verse('Revelation', 17, 14)).toContain('called, and chosen, and faithful.');
  });

  it('the corpus keeps the false god named low — the typography is in the text we quote', () => {
    expect(verse('1Kings', 18, 21)).toContain('but if baal, then follow him');
    expect(verse('1Kings', 18, 21)).not.toContain('Baal');
  });
});
