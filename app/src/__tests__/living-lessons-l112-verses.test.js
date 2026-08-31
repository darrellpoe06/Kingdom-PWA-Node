// =============================================================================
// L112 — Foxes, Wolves, and Bears: why Yahweh names the enemy by creature, and
// how His servants win. Verbatim KJV.
// =============================================================================
// Captured from Darrell's spoken question 2026-08-31 ("what does Yahweh mean with
// all the enemies — little foxes, wolf, bear for David — why, and how do His
// servants win?"). A spoken teaching is build input (DR-0089). The lesson widens
// L110 (wolf vs lion) into the full graded bestiary — fox takes the FRUIT while it
// is tender and must be caught small; wolf takes the FLOCK by stealth; bear is raw
// crushing force; lion is terror before contact — closes the escape-by-relocation
// door (Amos 5:19), names the one adversary behind the four masks, and then teaches
// the training doctrine that answers the "why David" half of the question: the lion
// and the bear came BEFORE Goliath and sized him ("as one of them"), because Yahweh
// drives enemies out "by little and little... until thou be increased" and leaves
// some standing "to teach them war."
//
// THE NEW GATE IN THIS FILE (DR-0076 §3 — a class that bit becomes a machine check).
// While authoring this lesson three real in-quote alterations were caught by an
// adversarial sweep and fixed: emphasis capitals inserted INSIDE a quotation
// ("AS a roaring lion"), a sentence period pulled inside a quotation ("Take us the
// foxes."), and a transposed phrase ("little by little" for the KJV's "by little
// and little"). Each one reads fine and is a modification of the text. The
// `every double-quoted span` check below now proves, mechanically, that NO quoted
// span in this lesson differs from the in-repo KJV by even one character — and it
// is asserted proven-to-catch against those exact three alterations.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll112-foxes-wolves-and-bears-the-enemys-graded-beasts-and-how-yahwehs-servants-win';
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
  'Take us the foxes, the little foxes, that spoil the vines: for our vines have tender grapes', // Song 2:15
  'if a fox go up, he shall even break down their stone wall',              // Neh 4:3
  'thy prophets are like the foxes in the deserts',                         // Ezek 13:4
  'Go ye, and tell that fox',                                               // Luke 13:32
  'I will rebuke the devourer for your sakes',                              // Mal 3:11
  'the wolf catcheth them, and scattereth the sheep',                       // John 10:12
  'her judges are evening wolves; they gnaw not the bones till the morrow',  // Zeph 3:3
  'Let a bear robbed of her whelps meet a man, rather than a fool in his folly', // Prov 17:12
  'I will meet them as a bear that is bereaved of her whelps',              // Hos 13:8
  'He was unto me as a bear lying in wait, and as a lion in secret places',  // Lam 3:10
  'like to a bear, and it raised up itself on one side',                    // Dan 7:5
  'As a roaring lion, and a ranging bear; so is a wicked ruler over the poor people', // Prov 28:15
  'your adversary the devil, as a roaring lion, walketh about, seeking whom he may devour', // 1 Pet 5:8
  'As if a man did flee from a lion, and a bear met him',                   // Amos 5:19
  'Now the serpent was more subtil than any beast of the field',            // Gen 3:1
  'And the great dragon was cast out, that old serpent, called the devil, and satan', // Rev 12:9 (lowercased)
  'Thy servant kept his father\\u2019s sheep, and there came a lion, and a bear, and took a lamb out of the flock', // 1 Sam 17:34
  'I caught him by his beard, and smote him, and slew him',                 // 1 Sam 17:35
  'Thy servant slew both the lion and the bear',                            // 1 Sam 17:36
  'shall be as one of them, seeing he hath defied the armies of the living God', // 1 Sam 17:36
  'The LORD that delivered me out of the paw of the lion, and out of the paw of the bear', // 1 Sam 17:37
  'by little and little: thou mayest not consume them at once, lest the beasts of the field increase upon thee', // Deut 7:22
  'By little and little I will drive them out from before thee, until thou be increased', // Ex 23:30
  'these are the nations which the LORD left, to prove Israel by them',      // Judg 3:1
  'to teach them war, at the least such as before knew nothing thereof',    // Judg 3:2
  'That through them I may prove Israel',                                   // Judg 2:22
  'the battle is the LORD\\u2019s, and he will give you into our hands',      // 1 Sam 17:47
  'the battle is not yours, but God\\u2019s',                                 // 2 Chr 20:15
  'set yourselves, stand ye still, and see the salvation of the LORD',       // 2 Chr 20:17
  'the weapons of our warfare are not carnal, but mighty through God to the pulling down of strong holds', // 2 Cor 10:4
  'bringing into captivity every thought to the obedience of Christ',        // 2 Cor 10:5
  'Put on the whole armour of God, that ye may be able to stand against the wiles of the devil', // Eph 6:11
  'Submit yourselves therefore to God. Resist the devil, and he will flee from you', // Jas 4:7
  'which teacheth my hands to war, and my fingers to fight',                // Ps 144:1
  'power to tread on serpents and scorpions, and over all the power of the enemy', // Luke 10:19
  'Thou shalt tread upon the lion and adder',                               // Ps 91:13
  'And the God of peace shall bruise satan under your feet shortly',        // Rom 16:20 (lowercased)
  'they overcame him by the blood of the Lamb, and by the word of their testimony', // Rev 12:11
  'we are more than conquerors through him that loved us',                  // Rom 8:37
  'this is the victory that overcometh the world, even our faith',          // 1 John 5:4
  'No weapon that is formed against thee shall prosper',                    // Isa 54:17
  'I will restore to you the years that the locust hath eaten',             // Joel 2:25
  'But ask now the beasts, and they shall teach thee',                      // Job 12:7
  'the invisible things of him from the creation of the world are clearly seen', // Rom 1:20
  'I send you forth as sheep in the midst of wolves',                       // Matt 10:16
];

describe('L112 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of [
      'bigIdea:', 'inApp:',
      "ref: 'Song of Solomon 2:15; 1 Samuel 17:36-37; 1 Samuel 17:47'",
      'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:',
    ]) {
      expect(l).toContain(key);
    }
  });

  it('is registered in the live series and the week count matches the real module count', () => {
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
    expect(m, 'L112 must be in LIVING_LESSONS_MODULES').toBeTruthy();
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(4);
    expect(m.benefits.length).toBeGreaterThanOrEqual(5);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(3);
    // the painted number must equal the real one (no claimed count — DR-0076)
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('teaches the whole arc in order — why by creature, the four beasts, the training, the win', () => {
    const order = [
      '1) WHY YAHWEH NAMES THE ENEMY BY CREATURE',
      '2) THE LITTLE FOXES',
      '3) THE WOLF',
      '4) THE BEAR',
      '5) THE LION',
      '6) ONE ADVERSARY, FOUR MASKS',
      '7) WHY DAVID MET THE LION AND THE BEAR FIRST',
      '8) HOW HIS SERVANTS WIN',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('answers both halves of the question — what the creatures MEAN, and HOW servants win', () => {
    expect(l).toContain('Darrell');
    // the graded scale is taught as tactic + size, not as one undifferentiated dread
    expect(l).toMatch(/tender/);
    expect(l).toContain('as one of them');
    expect(l).toContain('by little and little');
    // the six moves land
    for (const move of ['NAME THE BEAST', 'CATCH THE LITTLE ONES EARLY', 'KEEP THE RECEIPTS', 'THE BATTLE IS NOT YOURS', 'USE THE WEAPONS', 'STAND ON A FINISHED VICTORY']) {
      expect(l, `missing move: ${move}`).toContain(move);
    }
  });

  it('keeps the adversary named low in our own authored voice (Layer 0 typography)', () => {
    // strip the quoted Scripture, then audit only the prose we wrote ourselves
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bSatan\b/g) || []).length, 'capitalized adversary name in our voice').toBe(0);
    expect((ours.match(/\bLucifer\b/g) || []).length).toBe(0);
    // and our voice names Yahweh rather than the generic "God" (DR-0210)
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(20);
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    const f = frag.replace(/\\u2019/g, '’');
    it(`quotes verbatim: "${f.slice(0, 48)}${f.length > 48 ? '…' : ''}"`, () => {
      expect(l).toContain(f);
    });
  }
});

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the lesson\'s double quotes are balanced (so the spans below are real quotations)', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span appears verbatim in the in-repo KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(90);
    const altered = [];
    for (const span of spans) {
      // a quote elided with "..." is checked per surviving part
      for (const part of span.split('...').map((s) => s.trim()).filter(Boolean)) {
        if (!WHOLE_KJV.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH against the three alterations actually made while authoring this lesson', () => {
    // 1. emphasis capitals inserted inside a quotation
    expect(WHOLE_KJV.includes('AS a roaring lion')).toBe(false);
    expect(WHOLE_KJV.includes('as a roaring lion')).toBe(true);
    // 2. a sentence period pulled inside the quotation
    expect(WHOLE_KJV.includes('Take us the foxes.')).toBe(false);
    expect(WHOLE_KJV.includes('Take us the foxes')).toBe(true);
    // 3. a transposed phrase that reads perfectly and is not the text
    expect(WHOLE_KJV.includes('little by little')).toBe(false);
    expect(WHOLE_KJV.includes('by little and little')).toBe(true);
  });
});

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };

  it('child, teen, and senior each carry the little foxes AND David\'s lion and bear', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the little foxes`).toMatch(/little foxes/);
      expect(t, `${band} carries the lion and the bear`).toMatch(/lion and the bear|paw of the lion/);
      expect(t, `${band} names whose battle it is`).toMatch(/battle is the LORD|battle is not yours|let Him fight/);
    }
  });

  it('teen and senior additionally carry the training doctrine and the no-exit verse', () => {
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries "by little and little"`).toContain('by little and little');
      expect(t, `${band} closes the escape-by-running door`).toContain('Amos 5:19');
    }
  });

  it('the child level teaches without the adult weight, and is not a stub', () => {
    const child = level('child');
    expect(child.length).toBeGreaterThan(400);
    expect(child).toContain('Take us the foxes');
    expect(child).toMatch(/catch/i);
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('SongofSolomon', 2, 15)).toBe('Take us the foxes, the little foxes, that spoil the vines: for our vines have tender grapes.');
    expect(verse('1Samuel', 17, 36)).toContain('Thy servant slew both the lion and the bear');
    expect(verse('1Samuel', 17, 37)).toContain('out of the paw of the lion, and out of the paw of the bear');
    expect(verse('1Samuel', 17, 47)).toContain('the battle is the LORD’s');
    expect(verse('Deuteronomy', 7, 22)).toContain('by little and little');
    expect(verse('Exodus', 23, 30)).toContain('until thou be increased');
    expect(verse('Judges', 3, 2)).toContain('to teach them war');
    expect(verse('Amos', 5, 19)).toBe('As if a man did flee from a lion, and a bear met him; or went into the house, and leaned his hand on the wall, and a serpent bit him.');
    expect(verse('Proverbs', 17, 12)).toContain('a bear robbed of her whelps');
    expect(verse('Nehemiah', 4, 3)).toContain('if a fox go up, he shall even break down their stone wall');
    expect(verse('Malachi', 3, 11)).toContain('I will rebuke the devourer for your sakes');
    expect(verse('Joel', 2, 25)).toContain('the years that the locust hath eaten');
    // the adversary stays lowercased in the corpus (the 2026-08-30 sweep) — tamper-catch:
    expect(verse('Revelation', 12, 9)).toBe('And the great dragon was cast out, that old serpent, called the devil, and satan, which deceiveth the whole world: he was cast out into the earth, and his angels were cast out with him.');
    expect(verse('Romans', 16, 20)).toContain('shall bruise satan under your feet shortly');
  });
});
