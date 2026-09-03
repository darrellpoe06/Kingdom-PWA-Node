// =============================================================================
// L117 — No two children grow up in the same house: why siblings differ, what
// the research cannot explain, and the one Parent who is the same to all of
// them. Verbatim KJV.
// =============================================================================
// Brought in by Darrell, 2026-09-02: a Dr. Gabor Maté clip from The Mel Robbins
// Podcast — no siblings grow up in the same house, the same family, or the same
// childhood — with one instruction: "lesson… research and Word first."
//
// The five things this lesson had to get right, and which are pinned here:
//   • THE TRUE PART IS STATED PLAINLY, NOT HEDGED (DR-0100 tier 1). The
//     nonshared-environment finding is established — Plomin & Daniels 1987
//     (Behavioral and Brain Sciences), Dunn & Plomin, Separate Lives (1990) —
//     as is temperament (Thomas & Chess, the New York Longitudinal Study, and
//     "goodness of fit"). Hedging a verified truth is as much a failure of
//     truth as over-claiming an unverified one.
//   • THE LIMIT IS MARKED JUST AS PLAINLY (DR-0076 §8). The CAUSES are not
//     established: Plomin's own thirty-year summary is "Nonshared environment:
//     real but random" (JCPP Advances, 2024), and differential parental
//     treatment accounts for only a small share once genetic influence is
//     controlled. Birth order, family finances and marital phase are taught as
//     HYPOTHESES, never as findings.
//   • THE WORD IS SENIOR TO BOTH, AND IT SAID IT FIRST. Genesis 4:2; 25:27-28;
//     37:3-4; 1 Samuel 16:11; 17:28; Luke 15 — and unlike the clip, Scripture
//     does not stop at description: it RULES on parental preference
//     (Deuteronomy 21:16; Ephesians 6:4; Colossians 3:21; James 2:9).
//   • SHAPED, NOT SENTENCED. The damage is named, and the determinism the wider
//     frame carries is refused (Ezekiel 18:20; 1 Peter 1:18; 2 Corinthians
//     5:17), with "forgetting" explicitly distinguished from denying.
//   • THE GUARD RAIL RIDES WITH THE FORGIVENESS STEP, in the same session, never
//     deferred — because Exodus 20:12 is routinely used to keep people quiet.
//
// The whole-span gate from L112/L113/L116 rides again: no quoted span in this
// lesson may differ from the in-repo KJV by a single character. Authoring L117
// produced two real in-quote alterations, both caught by the sweep before the
// module was spliced and both asserted below as proven-to-catch:
//   1. a CROSS-VERSE span — Psalm 103:13-14 quoted as one continuous quotation,
//      which silently deletes the verse boundary;
//   2. a CAPITALIZATION change inside a quotation — 2 Corinthians 10:12 begins
//      mid-verse with a lowercase "but", and the draft had raised it to "But"
//      to make the sentence read better. That is editing Scripture.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll117-no-two-children-grow-up-in-the-same-house-why-siblings-differ-and-the-one-parent-who-is-the-same';
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
  'And Abel was a keeper of sheep, but Cain was a tiller of the ground.',                      // Gen 4:2
  'And Cain was very wroth, and his countenance fell.',                                        // Gen 4:5
  'If thou doest well, shalt thou not be accepted? and if thou doest not well, sin lieth at the door.', // Gen 4:7
  'Am I my brother’s keeper?',                                                                 // Gen 4:9
  'And the boys grew: and Esau was a cunning hunter, a man of the field; and Jacob was a plain man, dwelling in tents.', // Gen 25:27
  'And Isaac loved Esau, because he did eat of his venison: but Rebekah loved Jacob.',         // Gen 25:28
  'Now Israel loved Joseph more than all his children, because he was the son of his old age: and he made him a coat of many colours.', // Gen 37:3
  'And when his brethren saw that their father loved him more than all his brethren, they hated him, and could not speak peaceably unto him.', // Gen 37:4
  'And his brethren envied him; but his father observed the saying.',                          // Gen 37:11
  'And Esau ran to meet him, and embraced him, and fell on his neck, and kissed him: and they wept.', // Gen 33:4
  'But as for you, ye thought evil against me; but God meant it unto good',                    // Gen 50:20
  'he may not make the son of the beloved firstborn before the son of the hated, which is indeed the firstborn', // Deut 21:16
  'Honour thy father and thy mother: that thy days may be long upon the land',                 // Ex 20:12
  'There remaineth yet the youngest, and, behold, he keepeth the sheep.',                      // 1 Sam 16:11
  'for the LORD seeth not as man seeth; for man looketh on the outward appearance, but the LORD looketh on the heart.', // 1 Sam 16:7
  'And Eliab his eldest brother heard when he spake unto the men; and Eliab’s anger was kindled against David', // 1 Sam 17:28
  'When my father and my mother forsake me, then the LORD will take me up.',                   // Ps 27:10
  'A father of the fatherless, and a judge of the widows, is God in his holy habitation.',     // Ps 68:5
  'Like as a father pitieth his children, so the LORD pitieth them that fear him.',            // Ps 103:13
  'For he knoweth our frame; he remembereth that we are dust.',                                // Ps 103:14
  'I will praise thee; for I am fearfully and wonderfully made',                               // Ps 139:14
  'Thine eyes did see my substance, yet being unperfect; and in thy book all my members were written', // Ps 139:16
  'Train up a child in the way he should go: and when he is old, he will not depart from it.', // Prov 22:6
  'even so thou knowest not the works of God who maketh all.',                                 // Eccl 11:5
  'yea, they may forget, yet will I not forget thee',                                          // Isa 49:15
  'Before I formed thee in the belly I knew thee',                                             // Jer 1:5
  'The son shall not bear the iniquity of the father, neither shall the father bear the iniquity of the son', // Ezek 18:20
  'For I am the LORD, I change not',                                                           // Mal 3:6
  'For if ye forgive men their trespasses, your heavenly Father will also forgive you:',       // Matt 6:14
  'took his journey into a far country',                                                       // Luke 15:13
  'when he was yet a great way off, his father saw him, and had compassion, and ran, and fell on his neck, and kissed him', // Luke 15:20
  'And he was angry, and would not go in: therefore came his father out, and intreated him.',  // Luke 15:28
  'Lo, these many years do I serve thee, neither transgressed I at any time thy commandment',  // Luke 15:29
  'Son, thou art ever with me, and all that I have is thine.',                                 // Luke 15:31
  'Behold the Lamb of God, which taketh away the sin of the world.',                           // John 1:29
  'Of a truth I perceive that God is no respecter of persons',                                 // Acts 10:34
  'For there is no respect of persons with God.',                                              // Rom 2:11
  'And be not conformed to this world: but be ye transformed by the renewing of your mind',    // Rom 12:2
  'Having then gifts differing according to the grace that is given to us',                    // Rom 12:6
  'Rejoice with them that do rejoice, and weep with them that weep.',                          // Rom 12:15
  'Now there are diversities of gifts, but the same Spirit.',                                  // 1 Cor 12:4
  'But all these worketh that one and the selfsame Spirit, dividing to every man severally as he will.', // 1 Cor 12:11
  'But now hath God set the members every one of them in the body, as it hath pleased him.',   // 1 Cor 12:18
  'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.', // 2 Cor 5:17
  'but they measuring themselves by themselves, and comparing themselves among themselves, are not wise.', // 2 Cor 10:12
  'But let every man prove his own work, and then shall he have rejoicing in himself alone, and not in another.', // Gal 6:4
  'For every man shall bear his own burden.',                                                  // Gal 6:5
  'But speaking the truth in love',                                                            // Eph 4:15
  'even as God for Christ’s sake hath forgiven you',                                           // Eph 4:32
  'Honour thy father and mother; which is the first commandment with promise',                 // Eph 6:2
  'And, ye fathers, provoke not your children to wrath: but bring them up in the nurture and admonition of the Lord.', // Eph 6:4
  'forgetting those things which are behind, and reaching forth unto those things which are before', // Phil 3:13
  'Forbearing one another, and forgiving one another, if any man have a quarrel against any',  // Col 3:13
  'Fathers, provoke not your children to anger, lest they be discouraged.',                    // Col 3:21
  'For they verily for a few days chastened us after their own pleasure; but he for our profit', // Heb 12:10
  'with whom is no variableness, neither shadow of turning',                                   // Jas 1:17
  'But if ye have respect to persons, ye commit sin, and are convinced of the law as transgressors.', // Jas 2:9
  'For where envying and strife is, there is confusion and every evil work.',                  // Jas 3:16
  'from your vain conversation received by tradition from your fathers',                       // 1 Pet 1:18
];

describe('L117 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of [
      'bigIdea:', 'inApp:',
      "ref: 'Genesis 25:27-28; 1 Corinthians 12:18; Acts 10:34'",
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

  it('every quiz question has a real answer index and an explanation', () => {
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
    for (const q of m.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });

  it('teaches the whole arc in order — concede, Word, ruling, limit, assignment, the same Parent, the wounded, determinism, forgiveness, the ledger', () => {
    const order = [
      '1) WHAT WAS BROUGHT IN, AND WHAT IS TRUE IN IT',
      '2) THE WORD SAID IT FIRST - SAME HOUSE, DIFFERENT CHILDHOOD',
      '3) THE PARENT REALLY DOES SHOW UP DIFFERENTLY - AND THE WORD RULES ON IT',
      '4) WHERE THE RESEARCH ACTUALLY STOPS - AND WHY WE SAY SO OUT LOUD',
      '5) NOT A DEFECT - AN ASSIGNMENT',
      '6) THE ONE PARENT WHO IS THE SAME TO ALL OF THEM',
      '7) THE ONE WHO GOT THE SHORTER END',
      '8) SHAPED, NOT SENTENCED',
      '9) FORGIVING THE PARENT WHO COULD NOT BE THE SAME',
      '10) STOP MEASURING BY YOUR BROTHER',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('carries every element of the brought-in claim that was actually given', () => {
    expect(l).toContain('Darrell');
    expect(l, 'the source is named, not laundered').toContain('Gabor Maté');
    expect(l, 'the venue is named').toContain('The Mel Robbins Podcast');
    expect(l, 'his instruction').toMatch(/research and Word first/);
    expect(l, 'birth order').toMatch(/birth order/);
    expect(l, 'the economic situation').toMatch(/economic situation|finances/);
    expect(l, 'the phase of the parents’ relationship').toMatch(/phase/);
    expect(l, 'each child evokes a different response').toMatch(/evokes/);
    expect(l, 'temperament').toMatch(/temperament/);
    expect(l, 'the careful distinction he drew').toMatch(/does not experience the parents’ love/);
    expect(l, 'Darrell’s own two sons and a daughter').toMatch(/two sons and a daughter/);
  });
});

describe('DR-0100 — the true part is STATED, and the limit is MARKED (neither hedged nor over-claimed)', () => {
  it('states the established finding plainly and attributes it to the real sources', () => {
    expect(l).toMatch(/established/);
    for (const cite of [
      'Plomin', 'Daniels', 'Behavioral and Brain Sciences', '1987',
      'Dunn', 'Separate Lives', '1990',
      'Thomas', 'Chess', 'New York Longitudinal Study', 'goodness of fit',
    ]) {
      expect(l, `missing attribution: ${cite}`).toContain(cite);
    }
  });

  it('does NOT hedge the established part into both-sides', () => {
    for (const hedge of ['some say', 'scholars debate', 'no one really knows', 'you decide']) {
      expect(l.toLowerCase().includes(hedge), `hedge found: ${hedge}`).toBe(false);
    }
  });

  it('marks where the research actually STOPS — the causes are not pinned', () => {
    expect(l, 'Plomin’s own thirty-year summary').toContain('real but random');
    expect(l).toContain('JCPP Advances');
    expect(l, 'the hypotheses are labelled as hypotheses').toMatch(/hypotheses, not findings|are hypotheses/);
    expect(l, 'differential treatment is not the settled mechanism').toMatch(/small share once genetic|small portion once genetic|small slice once you account for genetics/);
  });

  it('hands the unexplained part to Yahweh rather than to a shrug', () => {
    expect(l).toContain('even so thou knowest not the works of God who maketh all.');
    expect(l).toContain('in thy book all my members were written');
    expect(l).toContain('Before I formed thee in the belly I knew thee');
    expect(l).toMatch(/signature of Yahweh, who does not run copies/);
  });
});

describe('the Word is senior to the clip — it said it first AND it rules', () => {
  it('shows same-house-different-childhood from the text itself', () => {
    expect(l).toContain('And Abel was a keeper of sheep, but Cain was a tiller of the ground.');
    expect(l).toContain('and Jacob was a plain man, dwelling in tents.');
    expect(l).toContain('There remaineth yet the youngest, and, behold, he keepeth the sheep.');
    expect(l, 'one father, two irreconcilable accounts').toContain('Lo, these many years do I serve thee');
  });

  it('goes where the clip does not — parental preference is JUDGED, not merely described', () => {
    expect(l).toContain('And Isaac loved Esau, because he did eat of his venison: but Rebekah loved Jacob.');
    expect(l, 'the fruit is stated with the favouritism').toContain('they hated him, and could not speak peaceably unto him.');
    expect(l, 'the law removes preference from inheritance').toContain('he may not make the son of the beloved firstborn');
    expect(l).toContain('provoke not your children to wrath');
    expect(l).toContain('lest they be discouraged.');
    expect(l, 'partiality is sin, not temperament').toContain('ye commit sin, and are convinced of the law as transgressors.');
  });

  it('keeps the pastoral hinge — different treatment is not the sin; unequal worth, access and honesty are', () => {
    expect(l).toMatch(/Responding identically to different children is/);
    expect(l).toMatch(/unequal WORTH, unequal ACCESS, and unequal HONESTY|unequal worth, unequal access and unequal honesty/);
  });

  it('lands the sameness on Yahweh, and models His two different deliveries in one night', () => {
    expect(l).toContain('For I am the LORD, I change not');
    expect(l).toContain('with whom is no variableness, neither shadow of turning');
    expect(l).toContain('Of a truth I perceive that God is no respecter of persons');
    expect(l).toContain('chastened us after their own pleasure; but he for our profit');
    expect(l, 'He ran to the younger').toContain('his father saw him, and had compassion, and ran, and fell on his neck, and kissed him');
    expect(l, 'and walked out to the elder').toContain('therefore came his father out, and intreated him.');
  });

  it('answers the seat of the one who got the shorter end', () => {
    expect(l).toContain('but the LORD looketh on the heart.');
    expect(l).toContain('When my father and my mother forsake me, then the LORD will take me up.');
    expect(l).toContain('yet will I not forget thee');
    expect(l).toContain('but God meant it unto good');
  });
});

describe('shaped, not sentenced — the determinism is refused without denying the damage', () => {
  it('names the damage as real', () => {
    expect(l).toContain('provoke not your children to wrath');
    expect(l).toContain('lest they be discouraged.');
  });

  it('refuses the verdict', () => {
    expect(l).toContain('The son shall not bear the iniquity of the father');
    expect(l).toContain('from your vain conversation received by tradition from your fathers');
    expect(l).toContain('old things are passed away; behold, all things are become new.');
  });

  it('distinguishes forgetting from denying — the misuse in both directions', () => {
    expect(l).toContain('forgetting those things which are behind');
    expect(l).toMatch(/forgetting is not denying/);
  });
});

describe('the forgiveness step carries its guard rail in the SAME session', () => {
  it('teaches the release', () => {
    expect(l).toContain('Forbearing one another, and forgiving one another, if any man have a quarrel against any');
    expect(l).toContain('even as God for Christ’s sake hath forgiven you');
    expect(l).toContain('Honour thy father and thy mother: that thy days may be long upon the land');
  });

  it('and the guard rail, so the passage is never used to silence anyone', () => {
    expect(l).toContain('But speaking the truth in love');
    expect(l, 'honour never meant calling harm harmless').toMatch(/call harm harmless|calling harm harmless/);
    expect(l, 'and never meant restoring access to someone dangerous').toMatch(/still-dangerous parent access|still dangerous/);
    expect(l, 'released from the accurate account, not a rewritten one').toMatch(/accurate account/);
  });
});

describe('the sibling’s own assignment — the ledger is closed, not merely explained', () => {
  it('names comparison as the first sin between brothers, and gives the instruction', () => {
    expect(l).toContain('And Cain was very wroth, and his countenance fell.');
    expect(l).toContain('Am I my brother’s keeper?');
    expect(l).toContain('but they measuring themselves by themselves');
    expect(l).toContain('But let every man prove his own work');
    expect(l).toContain('Rejoice with them that do rejoice, and weep with them that weep.');
    expect(l, 'the father’s answer to the elder son').toContain('Son, thou art ever with me, and all that I have is thine.');
  });

  it('closes on the reconciled brothers, in the verbs the Lord later reused', () => {
    expect(l).toContain('And Esau ran to meet him, and embraced him, and fell on his neck, and kissed him: and they wept.');
  });
});

describe('typographic theology', () => {
  it('keeps our authored voice on Yahweh, with no capitalized adversary name', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bSatan\b/g) || []).length).toBe(0);
    expect((ours.match(/\bLucifer\b/g) || []).length).toBe(0);
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(18);
  });

  it('confesses Jesus as the Lamb of Yahweh (DR-0210)', () => {
    expect(l).toMatch(/Lamb of Yahweh/);
    expect(l).toContain('Behold the Lamb of God, which taketh away the sin of the world.');
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 48)}${frag.length > 48 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
      expect(WHOLE_KJV, 'the pin itself must exist in the corpus').toContain(frag);
    });
  }
});

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the lesson’s double quotes are balanced', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span appears verbatim in the in-repo KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length).toBeGreaterThan(100);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((s) => s.trim()).filter(Boolean)) {
        if (!WHOLE_KJV.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH against the two alterations actually made while authoring THIS lesson', () => {
    // 1. CROSS-VERSE. Psalm 103:13-14 written as one continuous quotation. Each
    //    half is real; the JOIN deletes the verse boundary and is not Scripture.
    const psalm = 'so the LORD pitieth them that fear him. For he knoweth our frame';
    expect(WHOLE_KJV.includes(psalm), 'Psalm 103:13-14 joined across the verse boundary').toBe(false);
    expect(WHOLE_KJV.includes('Like as a father pitieth his children, so the LORD pitieth them that fear him.')).toBe(true);
    expect(WHOLE_KJV.includes('For he knoweth our frame; he remembereth that we are dust.')).toBe(true);

    // 2. CAPITALIZATION INSIDE A QUOTATION. 2 Corinthians 10:12 is quoted from
    //    mid-verse, where the KJV has a lowercase "but". Raising it to "But" so
    //    the sentence reads better is editing the text.
    const raised = 'But they measuring themselves by themselves';
    expect(WHOLE_KJV.includes(raised), '2 Corinthians 10:12 with the "but" raised to a capital').toBe(false);
    expect(WHOLE_KJV.includes('but they measuring themselves by themselves')).toBe(true);

    // and neither the clip's own words nor our framing may wear Scripture's marks
    expect(WHOLE_KJV.includes('no siblings grow up in the same house')).toBe(false);
    expect(WHOLE_KJV.includes('real but random')).toBe(false);
  });
});

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };

  it('each band shows same-house-different-childhood from the Word itself', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries Genesis 25:27`).toMatch(/dwelling in tents|Genesis 25:27/);
    }
  });

  it('each band lands on the Parent who does not vary', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the unchanging Father`).toMatch(/I change not|shadow of turning|no respecter of persons|no respect of persons|Malachi 3:6|Acts 10:34/);
    }
  });

  it('each band answers the one who got the shorter end', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the wounded seat`).toMatch(/looketh on the heart|take me up|1 Samuel 16:7|Psalm 27:10/);
    }
  });

  it('teen and senior additionally carry the research limit and shaped-not-sentenced', () => {
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} marks where the research stops`).toMatch(/real but random|hypothes/);
      expect(t, `${band} refuses the verdict`).toMatch(/The son shall not bear the iniquity of the father|all things are become new|Ezekiel 18:20/);
    }
  });

  it('the child level teaches without adult weight, and is not a stub', () => {
    const child = level('child');
    expect(child.length).toBeGreaterThan(400);
    // the family failures stay adult: no killing, no hatred, no favouritism blame
    expect(child).not.toMatch(/slew|murder|killed|hated|envied/i);
    // and it still teaches the doctrinal centre a six-year-old can hold
    expect(child, 'you were made on purpose').toContain('I will praise thee; for I am fearfully and wonderfully made');
    expect(child, 'there is enough love — the ledger is closed for a child too').toContain('Son, thou art ever with me, and all that I have is thine.');
    expect(child, 'both siblings can be telling the truth').toMatch(/BOTH telling the truth|both telling the truth/);
  });
});

describe('corpus witness — the pins are re-read from the corpus files themselves', () => {
  it('a representative set matches the repo KJV exactly', () => {
    expect(verse('Genesis', 25, 27)).toBe('And the boys grew: and Esau was a cunning hunter, a man of the field; and Jacob was a plain man, dwelling in tents.');
    expect(verse('Genesis', 25, 28)).toBe('And Isaac loved Esau, because he did eat of his venison: but Rebekah loved Jacob.');
    expect(verse('Genesis', 37, 4)).toContain('they hated him, and could not speak peaceably unto him.');
    expect(verse('Genesis', 33, 4)).toBe('And Esau ran to meet him, and embraced him, and fell on his neck, and kissed him: and they wept.');
    expect(verse('Deuteronomy', 21, 16)).toContain('he may not make the son of the beloved firstborn before the son of the hated');
    expect(verse('1Samuel', 16, 7)).toContain('but the LORD looketh on the heart.');
    expect(verse('Psalms', 103, 13)).toBe('Like as a father pitieth his children, so the LORD pitieth them that fear him.');
    expect(verse('Psalms', 103, 14)).toBe('For he knoweth our frame; he remembereth that we are dust.');
    expect(verse('Ecclesiastes', 11, 5)).toContain('even so thou knowest not the works of God who maketh all.');
    expect(verse('Ezekiel', 18, 20)).toContain('The son shall not bear the iniquity of the father');
    expect(verse('Malachi', 3, 6)).toContain('For I am the LORD, I change not');
    expect(verse('Luke', 15, 28)).toBe('And he was angry, and would not go in: therefore came his father out, and intreated him.');
    expect(verse('Acts', 10, 34)).toContain('God is no respecter of persons');
    expect(verse('1Corinthians', 12, 18)).toBe('But now hath God set the members every one of them in the body, as it hath pleased him.');
    expect(verse('2Corinthians', 10, 12)).toContain('but they measuring themselves by themselves');
    expect(verse('Colossians', 3, 21)).toBe('Fathers, provoke not your children to anger, lest they be discouraged.');
    expect(verse('Hebrews', 12, 10)).toContain('chastened us after their own pleasure; but he for our profit');
  });

  it('the two consecutive-verse pairs really ARE separate verses in the corpus', () => {
    // the exact shape that produced this lesson’s cross-verse alteration
    expect(verse('Psalms', 103, 13).endsWith('them that fear him.')).toBe(true);
    expect(verse('Psalms', 103, 14).startsWith('For he knoweth our frame')).toBe(true);
    expect(verse('Galatians', 6, 4).endsWith('not in another.')).toBe(true);
    expect(verse('Galatians', 6, 5)).toBe('For every man shall bear his own burden.');
  });
});
