// =============================================================================
// L114 — Meek and Quiet Strength: the ornament of great price, what meek and
// quiet actually mean, and why Jael is not the blueprint. Verbatim KJV.
// =============================================================================
// Captured 2026-09-02: Darrell brought in a widely-shared teaching on biblical
// femininity, plus its comment thread, with one word — lesson. A brought-in
// teaching is build input — the CLAUDE.md rule "Spoken Teachings Are Build Input —
// Always Add It" (2026-07-03) is the capture mandate; DR-0089 (standing consent)
// is what authorises shipping it the same session without a fresh yes.
//
// WHY THIS LESSON NEEDED A GATE OF ITS OWN. The source teaching is two-thirds
// right (the ornament of 1 Peter 3:4 is real; meek is strength under control;
// quiet is interior peace) and rests on a claim that is FALSE — that there are no
// harsh, godly women in the Word — plus three textual drifts in its Jael
// illustration (warm milk, a blanket, and femininity rather than a treaty drawing
// Sisera in). Under DR-0100 an established textual fact is stated plainly, not
// hedged; under DR-0098 the comment thread is answered from Scripture rather than
// staged as a debate. That makes the verbatim-quote gate load-bearing here: a
// lesson whose whole point is that the retelling drifted cannot itself drift.
//
// AUTHORING RECORD (DR-0076 §8 — provenance, honestly stated). Every quotation was
// pulled from the in-repo KJV corpus before the module was written, and the
// whole-span sweep below was run against the module block BEFORE it was spliced
// into the series: 94 quoted spans, zero alterations. The proven-to-catch block is
// therefore aimed where the real errors live — at the source teaching's own
// three drifts, each asserted absent from the corpus and each paired with the
// wording the corpus actually carries.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll114-meek-and-quiet-strength-the-ornament-of-great-price-and-why-jael-is-not-the-blueprint';
const start = src.indexOf(`id: '${ID}'`);
const l = src.slice(start).split('\n  },\n];')[0];

const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const corpus = (book) => JSON.parse(readFileSync(join(KJV_DIR, `${book}.json`), 'utf8'));
const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];

// The whole KJV as one haystack — the ground truth the quoted spans are checked against.
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

// Pull every double-quoted span out of the lesson source, in strict pair order.
const quotedSpans = (text) => {
  const unescaped = text.replace(/\\'/g, "'");
  const at = [...unescaped.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(unescaped.slice(at[i] + 1, at[i + 1]));
  return { spans: out, balanced: at.length % 2 === 0 };
};

const QUOTED_FRAGMENTS = [
  'even the ornament of a meek and quiet spirit, which is in the sight of God of great price', // 1 Pet 3:4
  'that outward adorning of plaiting the hair, and of wearing of gold, or of putting on of apparel', // 1 Pet 3:3
  'Even as Sara obeyed Abraham, calling him lord',                          // 1 Pet 3:6
  'are not afraid with any amazement',                                      // 1 Pet 3:6
  'let him refrain his tongue from evil, and his lips that they speak no guile', // 1 Pet 3:10
  'giving honour unto the wife, as unto the weaker vessel',                 // 1 Pet 3:7
  'that your prayers be not hindered',                                      // 1 Pet 3:7
  'be ye all of one mind, having compassion one of another, love as brethren, be pitiful, be courteous', // 1 Pet 3:8
  'Now the man Moses was very meek, above all the men which were upon the face of the earth', // Num 12:3
  'for I am meek and lowly in heart: and ye shall find rest unto your souls', // Matt 11:29
  'he drove them all out of the temple, and the sheep, and the oxen',       // John 2:15
  'Blessed are the meek: for they shall inherit the earth',                 // Matt 5:5
  'Meekness, temperance: against such there is no law',                     // Gal 5:23
  'restore such an one in the spirit of meekness',                          // Gal 6:1
  'in quietness and in confidence shall be your strength',                  // Isa 30:15
  'that we may lead a quiet and peaceable life in all godliness and honesty', // 1 Tim 2:2
  'Surely I have behaved and quieted myself, as a child that is weaned of his mother', // Ps 131:2
  'And when Sarai dealt hardly with her, she fled from her face',           // Gen 16:6
  'Cast out this bondwoman and her son',                                    // Gen 21:10
  'hearken unto her voice; for in Isaac shall thy seed be called',          // Gen 21:12
  'And Deborah, a prophetess, the wife of Lapidoth, she judged Israel at that time', // Judg 4:4
  'the LORD shall sell Sisera into the hand of a woman',                    // Judg 4:9
  'that I arose a mother in Israel',                                        // Judg 5:7
  'Then Zipporah took a sharp stone, and cut off the foreskin of her son',  // Ex 4:25
  'I am a woman of a sorrowful spirit',                                     // 1 Sam 1:15
  'Count not thine handmaid for a daughter of belial',                      // 1 Sam 1:16
  'But she told not her husband Nabal',                                     // 1 Sam 25:19
  'And blessed be thy advice, and blessed be thou',                         // 1 Sam 25:33
  'and if I perish, I perish',                                              // Est 4:16
  'He hath put down the mighty from their seats, and exalted them of low degree', // Luke 1:52
  // — the Jael account, read line by line against the retelling —
  'for there was peace between Jabin the king of Hazor and the house of Heber the Kenite', // Judg 4:17
  'she covered him with a mantle',                                          // Judg 4:18
  'And she opened a bottle of milk, and gave him drink, and covered him',   // Judg 4:19
  'that thou shalt say, No',                                                // Judg 4:20
  'took a nail of the tent, and took an hammer in her hand, and went softly unto him', // Judg 4:21
  'Blessed above women shall Jael the wife of Heber the Kenite be',         // Judg 5:24
  'He asked water, and she gave him milk; she brought forth butter in a lordly dish', // Judg 5:25
  'she smote off his head, when she had pierced and stricken through his temples', // Judg 5:26
  // — the measure is not volume —
  'She is loud and stubborn; her feet abide not in her house',              // Prov 7:11
  'Wisdom crieth without; she uttereth her voice in the streets',           // Prov 1:20
  'A foolish woman is clamorous: she is simple, and knoweth nothing',       // Prov 9:13
  'than with a brawling woman in a wide house',                             // Prov 21:9
  'Let all bitterness, and wrath, and anger, and clamour, and evil speaking, be put away from you', // Eph 4:31
  'She girdeth her loins with strength, and strengtheneth her arms',        // Prov 31:17
  'Strength and honour are her clothing',                                   // Prov 31:25
  'She openeth her mouth with wisdom; and in her tongue is the law of kindness', // Prov 31:26
  'Every wise woman buildeth her house: but the foolish plucketh it down with her hands', // Prov 14:1
  'Open thy mouth for the dumb in the cause of all such as are appointed to destruction', // Prov 31:8
  'Open thy mouth, judge righteously, and plead the cause of the poor and needy', // Prov 31:9
  // — the pattern is a Person, and the rails —
  'Let this mind be in you, which was also in Christ Jesus',                // Phil 2:5
  'But made himself of no reputation, and took upon him the form of a servant', // Phil 2:7
  'Who, when he was reviled, reviled not again; when he suffered, he threatened not', // 1 Pet 2:23
  'He shall not strive, nor cry; neither shall any man hear his voice in the streets', // Matt 12:19
  'A bruised reed shall he not break, and smoking flax shall he not quench', // Matt 12:20
  'A soft answer turneth away wrath: but grievous words stir up anger',     // Prov 15:1
  'first pure, then peaceable, gentle, and easy to be intreated, full of mercy and good fruits, without partiality, and without hypocrisy', // Jas 3:17
  'But speaking the truth in love',                                         // Eph 4:15
  'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind', // 2 Tim 1:7
  'Husbands, love your wives, and be not bitter against them',              // Col 3:19
  'Husbands, love your wives, even as Christ also loved the church, and gave himself for it', // Eph 5:25
  'be clothed with humility: for God resisteth the proud, and giveth grace to the humble', // 1 Pet 5:5
  'to do justly, and to love mercy, and to walk humbly with thy God',       // Mic 6:8
];

describe('L114 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of [
      'bigIdea:', 'inApp:',
      "ref: '1 Peter 3:4; Isaiah 30:15; Numbers 12:3'",
      'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:',
    ]) {
      expect(l).toContain(key);
    }
  });

  it('is registered in the live series and the week count matches the real module count', () => {
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
    expect(m, 'L114 must be in LIVING_LESSONS_MODULES').toBeTruthy();
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(4);
    expect(m.benefits.length).toBeGreaterThanOrEqual(5);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(3);
    // the painted number must equal the real one (no claimed count — DR-0076)
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('teaches the whole arc in order — affirm, define, correct, re-anchor, rail', () => {
    const order = [
      '1) THE VERSE IS TRUE, AND IT IS PRICELESS',
      '2) MEEK DOES NOT MEAN WEAK',
      '3) QUIET DOES NOT MEAN SILENT',
      '4) THE CLAIM THAT IS NOT TRUE',
      '5) JAEL IS NOT THE BLUEPRINT',
      '6) THE MEASURE WAS NEVER VOLUME',
      '7) THE PRICE IS REAL, AND THE BLUEPRINT IS A PERSON',
      '8) THE GUARD RAILS',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('AFFIRMS what the source teaching got right before it corrects anything (DR-0098 posture)', () => {
    // the affirmation must land in the FIRST movement, ahead of the correction
    const affirm = l.indexOf('THE VERSE IS TRUE');
    const correct = l.indexOf('THE CLAIM THAT IS NOT TRUE');
    expect(affirm).toBeGreaterThan(-1);
    expect(correct).toBeGreaterThan(affirm);
    // and the facilitator is told to open by affirming, not correcting
    expect(l).toContain('OPEN BY AFFIRMING, NOT BY CORRECTING');
  });

  it('states the false claim plainly rather than hedging it into an opinion (DR-0100)', () => {
    expect(l).toMatch(/[Ii]t makes the sentence FALSE/);
    // …and immediately bounds it, so the correction is never heard as a licence
    expect(l).toMatch(/None of this makes harshness a virtue|it does not commend harshness/);
  });

  it('corrects meekness from a female accessory back to a universal command', () => {
    expect(l).toMatch(/never issued as a female accessory|gendering of meekness|gendering meekness/);
    for (const ref of ['Numbers 12:3', 'Matthew 11:29', 'Matthew 5:5', 'Galatians 5:23', 'Galatians 6:1']) {
      expect(l, `missing the universal-meekness witness ${ref}`).toContain(ref);
    }
  });

  it('reads Jael from the account, and names the transfer error', () => {
    expect(l).toContain('Judges 4:17');   // a treaty, not femininity, brought him in
    expect(l).toContain('Judges 4:20');   // the requested lie the retelling omits
    expect(l).toMatch(/CONCEALMENT IN A WAR|wartime concealment/);
    expect(l).toContain('1 Peter 3:10');  // the guileless answer to the thread
  });

  it('carries the guard rails IN the lesson, not deferred to a later session', () => {
    for (const rail of ['2 Timothy 1:7', 'Proverbs 31:8', 'Ephesians 4:15', '1 Peter 3:7', 'Colossians 3:19', '1 Peter 3:8']) {
      expect(l, `missing guard rail ${rail}`).toContain(rail);
    }
    expect(l).toMatch(/SAME session|not safe/);
  });

  it('keeps the typography of Layer 0 in our own authored voice', () => {
    // strip the quoted Scripture, then audit only the prose we wrote ourselves
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bSatan\b/g) || []).length, 'capitalized adversary name in our voice').toBe(0);
    expect((ours.match(/\bLucifer\b/g) || []).length).toBe(0);
    // our voice names Yahweh rather than the generic "God" (DR-0210)
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(15);
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 48)}${frag.length > 48 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
    });
  }
});

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the lesson\'s double quotes are balanced (so the spans below are real quotations)', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span appears verbatim in the in-repo KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(80);
    const altered = [];
    for (const span of spans) {
      // a quote elided with "..." is checked per surviving part
      for (const part of span.split('...').map((s) => s.trim()).filter(Boolean)) {
        if (!WHOLE_KJV.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH against the source teaching\'s own three textual drifts', () => {
    // 1. warm milk — the retelling's most-repeated detail, and it is not in the text
    expect(WHOLE_KJV.includes('warm milk')).toBe(false);
    expect(WHOLE_KJV.includes('she gave him milk')).toBe(true);
    expect(WHOLE_KJV.includes('butter in a lordly dish')).toBe(true);
    // 2. a blanket — the text gives a mantle
    expect(WHOLE_KJV.includes('covered him with a blanket')).toBe(false);
    expect(WHOLE_KJV.includes('she covered him with a mantle')).toBe(true);
    // 3. the drifted pricing of 1 Peter 3:4, and the modernized Genesis 16:6
    expect(WHOLE_KJV.includes('in the sight of God a great price')).toBe(false);
    expect(WHOLE_KJV.includes('in the sight of God of great price')).toBe(true);
    expect(WHOLE_KJV.includes('dealt harshly with her')).toBe(false);
    expect(WHOLE_KJV.includes('dealt hardly with her')).toBe(true);
  });
});

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };

  it('child, teen, and senior each teach meek-is-not-weak AND quiet-is-not-silent', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries meek is not weak`).toMatch(/meek (?:means|is)|MEEK|meekness/i);
      expect(t, `${band} carries the meekest man on earth`).toMatch(/Numbers 12:3|Moses/);
      expect(t, `${band} carries quiet is not silence`).toMatch(/quiet/i);
    }
  });

  it('teen and senior additionally carry the correction and the fear rail', () => {
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} corrects the false claim via Peter's own Sara`).toContain('Genesis 16:6');
      expect(t, `${band} reads Jael from the account`).toMatch(/Judges 4:1[789]|Judges 4:2[01]/);
      expect(t, `${band} carries the not-afraid rail`).toContain('2 Timothy 1:7');
    }
  });

  it('the child level teaches without the adult weight, and is not a stub', () => {
    const child = level('child');
    expect(child.length).toBeGreaterThan(400);
    // it must NOT carry the tent-peg killing, the strange woman, or the marriage frame
    for (const heavy of [/nail/i, /hammer/i, /Jael/, /strange woman/i, /husband/i, /deceit/i]) {
      expect(child, `child level carries adult content: ${heavy}`).not.toMatch(heavy);
    }
    // and it must still actually teach the two words
    expect(child).toContain('Numbers 12:3');
    expect(child).toContain('Psalm 131:2');
    expect(child).toMatch(/law of kindness/);
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('1Peter', 3, 4)).toBe('But let it be the hidden man of the heart, in that which is not corruptible, even the ornament of a meek and quiet spirit, which is in the sight of God of great price.');
    expect(verse('1Peter', 3, 6)).toContain('are not afraid with any amazement');
    expect(verse('1Peter', 3, 10)).toContain('his lips that they speak no guile');
    expect(verse('Numbers', 12, 3)).toBe('(Now the man Moses was very meek, above all the men which were upon the face of the earth.)');
    expect(verse('Isaiah', 30, 15)).toContain('in quietness and in confidence shall be your strength');
    expect(verse('Psalms', 131, 2)).toContain('as a child that is weaned of his mother');
    expect(verse('Genesis', 16, 6)).toContain('And when Sarai dealt hardly with her, she fled from her face');
    expect(verse('Genesis', 21, 12)).toContain('hearken unto her voice');
    // the Jael account, exactly as it stands — the whole point of movement 5
    expect(verse('Judges', 4, 17)).toContain('for there was peace between Jabin the king of Hazor and the house of Heber the Kenite');
    expect(verse('Judges', 4, 18)).toContain('she covered him with a mantle');
    expect(verse('Judges', 4, 19)).toBe('And he said unto her, Give me, I pray thee, a little water to drink; for I am thirsty. And she opened a bottle of milk, and gave him drink, and covered him.');
    expect(verse('Judges', 4, 20)).toContain('that thou shalt say, No');
    expect(verse('Judges', 5, 25)).toBe('He asked water, and she gave him milk; she brought forth butter in a lordly dish.');
    expect(verse('Judges', 5, 26)).toContain('she smote off his head');
    // the two loud women — same volume, opposite spirits
    expect(verse('Proverbs', 7, 11)).toContain('She is loud and stubborn');
    expect(verse('Proverbs', 1, 20)).toBe('Wisdom crieth without; she uttereth her voice in the streets:');
    expect(verse('Proverbs', 31, 26)).toBe('She openeth her mouth with wisdom; and in her tongue is the law of kindness.');
  });
});
