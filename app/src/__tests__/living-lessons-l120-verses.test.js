// =============================================================================
// L120 — It is written: keep the policy in your pocket. Advocacy from the
// written word, a just weight for a child, and the correction received well.
// Verbatim KJV.
// =============================================================================
// Captured from Darrell's spoken teaching, 2026-09-03, with the family's own
// documents in hand: his ten-year-old twins met a real dispute at their school
// library. The daughter lost a library book, the family paid the replacement fee
// out of HER savings, she later returned the book in good condition, and she was
// told no twice — no refund, and no, she could not have the book they had paid
// for. The library's own printed handout to families said a lost book found in
// good condition is refunded in full. Her twin brother told her to keep the
// policy in her pocket and produce it. Their mother wrote that evening quoting
// the policy; the next morning brought an apology, and the cash was in the
// child's backpack by early afternoon.
//
// The five things this lesson had to get right, and which are pinned here:
//   • THE PERSON IS NOT NAMED. This account involves a real, identifiable school
//     employee. The teaching is the ACT and its correction; the person is
//     released (Titus 3:2). The PRIVACY gate below enforces it structurally —
//     and deliberately does NOT itself embed the name it is protecting.
//   • THE METHOD IS THE LORD'S. A ten-year-old reached for the written text
//     under pressure, which is the wilderness pattern exactly — Matthew 4:4,
//     4:7, 4:10 — with Psalm 119:11 as the prerequisite: stored before needed.
//   • THE STANDARD IS A WEIGHT, AND IT CUTS BOTH WAYS. Proverbs 11:1 and
//     Leviticus 19:35-36 name the false balance; Exodus 23:6 and Proverbs
//     22:22-23 forbid bending it against the party with no leverage — and
//     Leviticus 19:15 forbids bending it FOR them. A room that learns to win by
//     leverage rather than by the written standard has drawn the wrong lesson
//     from a right outcome. That guardrail is Darrell's own point: Yahweh's
//     standard is supreme, not skin and not historical events.
//   • THE CORRECTION IS NOT OPTIONAL AND IS NOT A SOFTENING (DR-0100 both ways).
//     What is established: a written policy was not honoured and a child was
//     told no twice. Also established: it was corrected the next morning with
//     restitution the same day, which Scripture calls the WISE response
//     (Proverbs 9:8-9; 25:12; Luke 19:8). What is NOT established is motive, and
//     John 7:24 / Exodus 23:1 / Matthew 7:2 forbid supplying it. Under-claiming
//     the repentance would be as much a failure of truth as over-claiming guilt.
//   • THE WIN IS NOT THE REFUND. Ephesians 2:6, Romans 8:28,37 and Revelation
//     5:5 — the seat is already given and the Lion has already prevailed. Had
//     the answer stayed no, the children were still right and still seated.
//
// PROVEN-TO-CATCH, from THIS lesson's authoring. The whole-span sweep caught a
// real alteration in the first draft: the quiz explain opened with the word
// Wrest wearing Scripture's quotation marks as EMPHASIS. The word is genuine
// KJV vocabulary in lowercase (Exodus 23:6), which is exactly what makes the
// emphasis-quote habit dangerous — it reads as a citation. Pinned below.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll120-it-is-written-keep-the-policy-in-your-pocket-advocacy-from-the-written-word-and-a-just-weight';
const start = src.indexOf(`id: '${ID}'`);
const l = src.slice(start).split('\n  },\n];')[0];

const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const verse = (book, ch, v) => JSON.parse(readFileSync(join(KJV_DIR, `${book}.json`), 'utf8')).chapters[ch - 1][v - 1];

const WHOLE_KJV = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json'))) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;
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

// Fragment → the verse it is attributed to. Checked against THAT verse, not the
// whole corpus (the attribution gate introduced with L119).
const ATTRIBUTED = [
  ['It is written, Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God.', 'Matthew', 4, 4],
  ['It is written again, Thou shalt not tempt the Lord thy God.', 'Matthew', 4, 7],
  ['Get thee hence, satan: for it is written, Thou shalt worship the Lord thy God, and him only shalt thou serve.', 'Matthew', 4, 10],
  ['Thy word have I hid in mine heart, that I might not sin against thee.', 'Psalms', 119, 11],
  ['Train up a child in the way he should go: and when he is old, he will not depart from it.', 'Proverbs', 22, 6],
  ['And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.', 'Deuteronomy', 6, 7],
  ['bring them up in the nurture and admonition of the Lord.', 'Ephesians', 6, 4],
  ['And that from a child thou hast known the holy scriptures, which are able to make thee wise unto salvation through faith which is in Christ Jesus.', '2Timothy', 3, 15],
  ['A false balance is abomination to the LORD: but a just weight is his delight.', 'Proverbs', 11, 1],
  ['Ye shall do no unrighteousness in judgment, in meteyard, in weight, or in measure.', 'Leviticus', 19, 35],
  ['Just balances, just weights, a just ephah, and a just hin, shall ye have: I am the LORD your God, which brought you out of the land of Egypt.', 'Leviticus', 19, 36],
  ['what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?', 'Micah', 6, 8],
  ['Thou shalt not wrest the judgment of thy poor in his cause.', 'Exodus', 23, 6],
  ['Rob not the poor, because he is poor: neither oppress the afflicted in the gate:', 'Proverbs', 22, 22],
  ['For the LORD will plead their cause, and spoil the soul of those that spoiled them.', 'Proverbs', 22, 23],
  ['Defend the poor and fatherless: do justice to the afflicted and needy.', 'Psalms', 82, 3],
  ['Execute true judgment, and shew mercy and compassions every man to his brother:', 'Zechariah', 7, 9],
  ['Learn to do well; seek judgment, relieve the oppressed, judge the fatherless, plead for the widow.', 'Isaiah', 1, 17],
  ['Open thy mouth for the dumb in the cause of all such as are appointed to destruction.', 'Proverbs', 31, 8],
  ['Open thy mouth, judge righteously, and plead the cause of the poor and needy.', 'Proverbs', 31, 9],
  ['Of a truth I perceive that God is no respecter of persons:', 'Acts', 10, 34],
  ['But in every nation he that feareth him, and worketh righteousness, is accepted with him.', 'Acts', 10, 35],
  ['the LORD your God is God of gods, and Lord of lords, a great God, a mighty, and a terrible, which regardeth not persons, nor taketh reward:', 'Deuteronomy', 10, 17],
  ['thou shalt not respect the person of the poor, nor honor the person of the mighty: but in righteousness shalt thou judge thy neighbour.', 'Leviticus', 19, 15],
  ['have not the faith of our Lord Jesus Christ, the Lord of glory, with respect of persons.', 'James', 2, 1],
  ['But if ye have respect to persons, ye commit sin, and are convinced of the law as transgressors.', 'James', 2, 9],
  ['Two are better than one; because they have a good reward for their labour.', 'Ecclesiastes', 4, 9],
  ['And if one prevail against him, two shall withstand him; and a threefold cord is not quickly broken.', 'Ecclesiastes', 4, 12],
  ['at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established.', 'Deuteronomy', 19, 15],
  ['He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.', 'Proverbs', 18, 17],
  ['A soft answer turneth away wrath: but grievous words stir up anger.', 'Proverbs', 15, 1],
  ['He that is slow to anger is better than the mighty; and he that ruleth his spirit than he that taketh a city.', 'Proverbs', 16, 32],
  ['Let your speech be alway with grace, seasoned with salt, that ye may know how ye ought to answer every man.', 'Colossians', 4, 6],
  ['be ready always to give an answer to every man that asketh you a reason of the hope that is in you with meekness and fear:', '1Peter', 3, 15],
  ['go and tell him his fault between thee and him alone: if he shall hear thee, thou hast gained thy brother.', 'Matthew', 18, 15],
  ['rebuke a wise man, and he will love thee.', 'Proverbs', 9, 8],
  ['Give instruction to a wise man, and he will be yet wiser: teach a just man, and he will increase in learning.', 'Proverbs', 9, 9],
  ['As an earring of gold, and an ornament of fine gold, so is a wise reprover upon an obedient ear.', 'Proverbs', 25, 12],
  ['He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy.', 'Proverbs', 28, 13],
  ['if I have taken any thing from any man by false accusation, I restore him fourfold.', 'Luke', 19, 8],
  ['he shall recompense his trespass with the principal thereof', 'Numbers', 5, 7],
  ['Judge not according to the appearance, but judge righteous judgment.', 'John', 7, 24],
  ['Thou shalt not raise a false report', 'Exodus', 23, 1],
  ['He that answereth a matter before he heareth it, it is folly and shame unto him.', 'Proverbs', 18, 13],
  ['with what measure ye mete, it shall be measured to you again.', 'Matthew', 7, 2],
  ['thinketh no evil;', '1Corinthians', 13, 5],
  ['Beareth all things, believeth all things, hopeth all things, endureth all things.', '1Corinthians', 13, 7],
  ['To speak evil of no man, to be no brawlers, but gentle, shewing all meekness unto all men.', 'Titus', 3, 2],
  ['And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ’s sake hath forgiven you.', 'Ephesians', 4, 32],
  ['He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much.', 'Luke', 16, 10],
  ['Wealth gotten by vanity shall be diminished: but he that gathereth by labour shall increase.', 'Proverbs', 13, 11],
  ['This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night, that thou mayest observe to do according to all that is written therein: for then thou shalt make thy way prosperous, and then thou shalt have good success.', 'Joshua', 1, 8],
  ['whatsoever he doeth shall prosper.', 'Psalms', 1, 3],
  ['And hath raised us up together, and made us sit together in heavenly places in Christ Jesus:', 'Ephesians', 2, 6],
  ['And we know that all things work together for good to them that love God, to them who are the called according to his purpose.', 'Romans', 8, 28],
  ['Nay, in all these things we are more than conquerors through him that loved us.', 'Romans', 8, 37],
  ['thanks be to God, which giveth us the victory through our Lord Jesus Christ.', '1Corinthians', 15, 57],
  ['behold, the Lion of the tribe of Juda, the Root of David, hath prevailed', 'Revelation', 5, 5],
  ['Behold the Lamb of God, which taketh away the sin of the world.', 'John', 1, 29],
];

describe('L120 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of [
      'bigIdea:', 'inApp:',
      "ref: 'Matthew 4:4; Proverbs 11:1; Proverbs 22:6'",
      'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:',
    ]) {
      expect(l).toContain(key);
    }
  });

  it('is registered in the live series and the painted lesson count is the real one', () => {
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
    expect(m, 'L120 must be in LIVING_LESSONS_MODULES').toBeTruthy();
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

  it('teaches the whole arc in order — record, method, training, weight, the small, the standard, witness, soft answer, correction, speech, least, victory', () => {
    const order = [
      '1) WHAT THE RECORD ACTUALLY SHOWS',
      '2) IT IS WRITTEN - THE BOY REACHED FOR THE LORD',
      '3) TRAIN UP A CHILD - THE FRUIT SHOWS WHEN THE PARENTS ARE NOT IN THE ROOM',
      '4) A WRITTEN POLICY IS A WEIGHT, AND YAHWEH HAS AN OPINION ABOUT WEIGHTS',
      '5) DO NOT WREST THE JUDGMENT OF THE SMALL',
      '6) HIS STANDARD IS SUPREME - NOT SKIN, NOT HISTORY',
      '7) TWO ARE BETTER THAN ONE - AND SO IS A DOCUMENT',
      '8) THE SOFT ANSWER THAT ACTUALLY WON IT',
      '9) THE CORRECTION WAS RECEIVED WELL - SAY THAT PLAINLY',
      '10) SO HOW DO WE SPEAK OF HER NOW',
      '11) FAITHFUL IN THAT WHICH IS LEAST',
      '12) THE GUARANTEED WAY TO WIN - AND WHY IT DOES NOT DEPEND ON THE REFUND',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('carries every documented element of the account, and no more', () => {
    expect(l).toContain('Darrell');
    expect(l, 'the two refusals').toMatch(/told no/);
    expect(l, 'the second, unprompted request').toMatch(/have the book back|book back, since|book we (had )?already paid|book they had already paid/i);
    expect(l, 'the printed policy').toMatch(/found in good condition/);
    expect(l, 'the brother’s counsel').toMatch(/pocket/);
    expect(l, 'the letter that evening').toMatch(/that evening/);
    expect(l, 'the apology next morning').toMatch(/next morning/);
    expect(l, 'the envelope in the backpack').toMatch(/backpack/);
    expect(l, 'the household money rule').toMatch(/own accounts or work to earn it back|savings/);
    expect(l, 'the lesson adds nothing to the record').toMatch(/adds nothing to it/);
  });

  it('keeps SOURCE DISCIPLINE — a family record, never an authority beside Scripture', () => {
    expect(l).toMatch(/FAMILY RECORD|family record/);
    expect(l).toMatch(/never as an authority standing beside it|never an authority/);
  });

  it('teaches the method as the Lord’s own, with the prerequisite', () => {
    expect(l).toContain('It is written, Man shall not live by bread alone');
    expect(l).toContain('It is written again, Thou shalt not tempt the Lord thy God.');
    expect(l).toContain('Thy word have I hid in mine heart');
    expect(l, 'you cannot pull out what you never picked up').toMatch(/never picked up|before you need it|stored/i);
  });

  it('names the standard a WEIGHT and keeps it cutting both ways — the guardrail', () => {
    expect(l).toContain('A false balance is abomination to the LORD: but a just weight is his delight.');
    expect(l).toContain('Thou shalt not wrest the judgment of thy poor in his cause.');
    expect(l).toContain('For the LORD will plead their cause, and spoil the soul of those that spoiled them.');
    expect(l, 'no respecter of persons').toContain('Of a truth I perceive that God is no respecter of persons:');
    expect(l, 'and it forbids favouring the poor too').toContain('thou shalt not respect the person of the poor, nor honor the person of the mighty');
    expect(l, 'Darrell’s own guardrail — not skin, not history').toMatch(/not skin|NOT SKIN/);
  });

  it('teaches the appeal as a template — soft, private, from the document', () => {
    expect(l).toContain('A soft answer turneth away wrath: but grievous words stir up anger.');
    expect(l).toContain('go and tell him his fault between thee and him alone: if he shall hear thee, thou hast gained thy brother.');
    expect(l, 'the promise is the brother, not the case').toMatch(/gained thy brother/);
  });

  it('states the correction plainly and refuses to supply motive (DR-0100 both ways)', () => {
    expect(l).toContain('rebuke a wise man, and he will love thee.');
    expect(l).toContain('As an earring of gold, and an ornament of fine gold, so is a wise reprover upon an obedient ear.');
    expect(l, 'restitution').toContain('I restore him fourfold.');
    expect(l).toContain('Judge not according to the appearance, but judge righteous judgment.');
    expect(l).toContain('Thou shalt not raise a false report');
    expect(l, 'what is established vs what is not').toMatch(/NOT established|not established/);
    expect(l, 'the father’s anger has a righteous root, and is not flattered').toMatch(/righteous root/);
  });

  it('lands the victory off the refund — the seat is already given', () => {
    expect(l).toContain('And hath raised us up together, and made us sit together in heavenly places in Christ Jesus:');
    expect(l).toContain('all things work together for good to them that love God');
    expect(l).toContain('behold, the Lion of the tribe of Juda, the Root of David, hath prevailed');
    expect(l, 'win now or after this first life').toMatch(/after this first life|Win now, or after/);
    expect(l, 'the envelope was the visible half').toMatch(/visible half/);
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

  it('confesses Jesus as the Lamb of Yahweh (DR-0210)', () => {
    expect(l).toMatch(/Lamb of Yahweh/);
    expect(l).toContain('Behold the Lamb of God, which taketh away the sin of the world.');
  });
});

describe('PRIVACY gate — the school employee is taught as an act, never as a person', () => {
  // This gate deliberately does NOT embed the name it protects. It asserts the
  // commitment is stated, and that no identifying artefact of a real person or
  // institution survives in the lesson text.
  it('states the non-naming commitment explicitly, and cites Titus 3:2 for it', () => {
    expect(l).toMatch(/is NOT named here and is not to be named|not named/);
    expect(l).toContain('To speak evil of no man, to be no brawlers, but gentle, shewing all meekness unto all men.');
    expect(l, 'the facilitator is told to redirect the room').toMatch(/DO NOT NAME THE EMPLOYEE/);
  });

  it('carries no email address, no street address, no postal code, no institution name', () => {
    expect(l, 'an email address').not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/);
    expect(l, 'a US postal code').not.toMatch(/\b\d{5}(-\d{4})?\b/);
    expect(l, 'a street address').not.toMatch(/\b\d+\s+[NSEW]?\s?[A-Z][a-z]+\s+(St|Street|Ave|Avenue|Rd|Road)\b/);
    for (const token of ['Elementary', 'School District', 'Unit 4', 'Librarian']) {
      expect(l, `institution-identifying token: ${token}`).not.toContain(token);
    }
  });

  it('refers to the employee only by role, and to the children only by relationship', () => {
    // The only proper name in the lesson's own voice is Darrell's.
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect(ours).toMatch(/school employee|the library|at the desk/);
    expect(ours, 'children referred to by relationship, not by name').toMatch(/her twin brother|the daughter|a ten-year-old/);
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

  it('is PROVEN-TO-CATCH against the EMPHASIS-QUOTE alteration authoring actually produced', () => {
    // First draft opened a quiz explain with the word Wrest in quotation marks
    // as emphasis. The word is real KJV vocabulary in LOWERCASE (Exodus 23:6),
    // which is precisely what makes the habit dangerous: it reads as a citation.
    expect(WHOLE_KJV.includes('Wrest'), 'capitalized Wrest is NOT in the corpus').toBe(false);
    expect(WHOLE_KJV.includes('wrest the judgment'), 'the lowercase word is genuine KJV').toBe(true);
    // and the lesson no longer wears quotation marks around it
    expect(l).not.toMatch(/"Wrest"/);
  });

  it('is PROVEN-TO-CATCH against wrong-reference and cross-verse joins from this lesson’s texts', () => {
    // KJV reads "Juda", not "Judah" — the prose says Judah, the QUOTE says Juda.
    expect(WHOLE_KJV.includes('Lion of the tribe of Judah')).toBe(false);
    expect(WHOLE_KJV.includes('Lion of the tribe of Juda')).toBe(true);
    // cross-verse joins delete a verse boundary silently
    expect(WHOLE_KJV.includes('out of the mouth of God. Jesus said unto him, It is written again')).toBe(false);
    expect(WHOLE_KJV.includes('neither oppress the afflicted in the gate: For the LORD will plead their cause')).toBe(false);
    // single-character drift in the anchor
    expect(WHOLE_KJV.includes('Train up a child in the way he should go,')).toBe(false);
    expect(WHOLE_KJV.includes('Train up a child in the way he should go:')).toBe(true);
  });

  it('never lets our own framing wear Scripture’s quotation marks', () => {
    for (const ours of [
      'keep the policy in your pocket',
      'a just weight for a child',
      'the correction that was received well',
      'here is the policy, give me my money back',
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

  it('each band carries the method and the just weight', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries "It is written"`).toMatch(/It is written/);
      expect(t, `${band} carries the just weight`).toMatch(/just weight|false balance|unrighteousness in judgment/);
    }
  });

  it('each band carries the correction — the person is released, not condemned', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} releases the person`).toMatch(/forgiving one another|speak evil of no man|righteous judgment|let it GO|thinketh no evil/);
    }
  });

  it('each band lands the win off the refund', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the already-won close`).toMatch(/all things work together for good|heavenly places|hath prevailed/);
    }
  });

  it('teen and senior additionally carry the both-ways guardrail and the appeal template', () => {
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries no respecter of persons`).toMatch(/no respecter of persons/);
      expect(t, `${band} carries the symmetric law`).toMatch(/nor honor the person of the mighty/);
      expect(t, `${band} carries the private, soft appeal`).toMatch(/soft answer|between thee and him alone/);
    }
  });

  it('the child level teaches without adult weight, and is not a stub', () => {
    const child = level('child');
    expect(child.length).toBeGreaterThan(400);
    expect(child, 'no accusation language for a six-year-old').not.toMatch(/thief|steal|stole|liar/i);
    expect(child, 'the child gets the pocket picture').toMatch(/pocket/);
    expect(child, 'the child is told Yahweh stands up for them').toContain('For the LORD will plead their cause');
    expect(child, 'and is taught to forgive fast').toContain('And be ye kind one to another, tenderhearted, forgiving one another');
  });
});

describe('corpus witness — the pins are re-read from the corpus files themselves', () => {
  it('a representative set matches the repo KJV exactly', () => {
    expect(verse('Proverbs', 22, 6)).toBe('Train up a child in the way he should go: and when he is old, he will not depart from it.');
    expect(verse('Proverbs', 11, 1)).toBe('A false balance is abomination to the LORD: but a just weight is his delight.');
    expect(verse('Exodus', 23, 6)).toBe('Thou shalt not wrest the judgment of thy poor in his cause.');
    expect(verse('Proverbs', 22, 23)).toContain('For the LORD will plead their cause');
    expect(verse('Acts', 10, 34)).toContain('God is no respecter of persons');
    expect(verse('Leviticus', 19, 15)).toContain('nor honor the person of the mighty');
    expect(verse('Matthew', 18, 15)).toContain('thou hast gained thy brother.');
    expect(verse('Proverbs', 25, 12)).toContain('a wise reprover upon an obedient ear');
    expect(verse('Ephesians', 2, 6)).toContain('made us sit together in heavenly places in Christ Jesus');
    expect(verse('Revelation', 5, 5)).toContain('the Lion of the tribe of Juda');
    expect(verse('Joshua', 1, 8)).toContain('then thou shalt make thy way prosperous');
  });

  it('the corpus keeps the adversary named low in the wilderness account', () => {
    expect(verse('Matthew', 4, 10)).toContain('Get thee hence, satan');
    expect(verse('Matthew', 4, 10)).not.toContain('Satan');
  });
});
