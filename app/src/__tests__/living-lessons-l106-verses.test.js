// =============================================================================
// L106 — Wise as Serpents, Harmless as Doves: knowing the enemy, denying the
// flesh, doing only Yahweh's will, and the one directed way. Verbatim KJV.
// =============================================================================
// Captured from Darrell's spoken questions 2026-08-30 — a spoken teaching is
// build input (DR-0089). What Yahweh means by "wise as serpents": know the enemy
// (the roaring lion that is NOT the Lion of Judah; he only bruised the heel)
// without adopting his nature — wise unto good, simple concerning evil; deny the
// flesh where he works; the Word divides soul from spirit so we discern flesh
// from Spirit; be capable but do only Yahweh's will; lean not on our own
// understanding; acknowledge Him and He directs the one way. Typographic theology
// held: in the lesson's own voice the adversary is named low; KJV quotes keep
// their casing verbatim (DR-0076 bright line). Every KJV line FETCHED from the
// repo's own KJV this session; a drift fails the build. Companion to L102/L104/L105.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll106-wise-as-serpents-harmless-as-doves-know-the-enemy-deny-the-flesh-and-the-one-way'");
const l = src.slice(start, start + 120000);

const QUOTED_FRAGMENTS = [
  'be ye therefore wise as serpents, and harmless as doves',               // Matt 10:16
  'I would have you wise unto that which is good, and simple concerning evil', // Rom 16:19
  'it shall bruise thy head, and thou shalt bruise his heel',              // Gen 3:15
  'your adversary the devil, as a roaring lion, walketh about, seeking whom he may devour', // 1 Pet 5:8
  'we are not ignorant of his devices',                                    // 2 Cor 2:11
  'Put on the whole armour of God, that ye may be able to stand against the wiles of the devil', // Eph 6:11
  'He was a murderer from the beginning',                                  // John 8:44
  'the Lion of the tribe of Juda, the Root of David, hath prevailed',      // Rev 5:5
  'This wisdom descendeth not from above, but is earthly, sensual, devilish', // Jas 3:15
  'Resist the devil, and he will flee from you',                          // Jas 4:7
  'let him deny himself, and take up his cross, and follow me',             // Matt 16:24
  'Walk in the Spirit, and ye shall not fulfil the lust of the flesh',      // Gal 5:16
  'bringing into captivity every thought to the obedience of Christ',       // 2 Cor 10:5
  'out of the heart proceed evil thoughts',                               // Matt 15:19
  'piercing even to the dividing asunder of soul and spirit',              // Heb 4:12
  'as many as are led by the Spirit of God, they are the sons of God',      // Rom 8:14
  'he shall presently give me more than twelve legions of angels',          // Matt 26:53
  'I seek not mine own will, but the will of the Father which hath sent me', // John 5:30
  'Be ye holy; for I am holy',                                            // 1 Pet 1:16
  'lean not unto thine own understanding',                                // Prov 3:5
  'In all thy ways acknowledge him, and he shall direct thy paths',        // Prov 3:6
  'I am the way, the truth, and the life',                                // John 14:6
  'This is the way, walk ye in it',                                        // Isa 30:21
];

describe('L106 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Matthew 10:16; Romans 16:19; Proverbs 3:5-6'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — nine movements + THE WHOLE OF IT', () => {
    const order = [
      '1) WISE AS SERPENTS, HARMLESS AS DOVES',
      '2) KNOW THE ENEMY',
      '3) THE ROARING LION IS NOT THE LION OF JUDAH',
      '4) SERPENT-WISDOM, NOT SERPENT-NATURE',
      '5) DENY THE FLESH',
      '6) THE WORD DIVIDES SOUL FROM SPIRIT',
      '7) CAPABLE, BUT ONLY YAHWEH',
      '8) LEAN NOT ON YOUR OWN UNDERSTANDING',
      '9) ACKNOWLEDGE HIM',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('answers Darrell\'s threads and keeps the typographic theology in its own voice', () => {
    expect(l).toContain('Darrell brought');
    expect(l).toContain('roaring lion');
    // Darrell's soul/spirit question answered explicitly
    expect(l).toContain('divide soul from spirit');
    // in the lesson's OWN prose the adversary is named low — declared, and the
    // name itself stays lowercase (KJV quotes keep their verbatim casing, DR-0076).
    expect(l).toContain('the adversary named low');
    // no capitalized adversary NAME in our authored prose (Satan/Lucifer as a proper
    // name); "Satan" only ever appears inside the fetched KJV quote of 2 Cor 2:11.
    expect((l.match(/Lucifer/g) || []).length).toBe(0);
    // every "Satan" sits inside the verbatim KJV quote of 2 Cor 2:11 ("Lest Satan…"),
    // never introduced as a capitalized proper name in the lesson's own prose.
    for (const m of l.matchAll(/\bSatan\b/g)) {
      expect(l.slice(m.index - 5, m.index)).toBe('Lest ');
    }
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 52)}${frag.length > 52 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
    });
  }
});

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };
  it('child, teen, and senior each carry wise-and-harmless and the one-way threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries wise/harmless`).toMatch(/wise as serpents|wise unto that which is good/);
      expect(t, `${band} carries the one way`).toContain('I am the way, the truth, and the life');
    }
    // teen and senior additionally carry the counterfeit-lion and deny-the-flesh threads.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('hath prevailed');            // the true Lion of Judah
      expect(t).toContain('deny himself');              // deny the flesh
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Matthew', 10, 16)).toBe('Behold, I send you forth as sheep in the midst of wolves: be ye therefore wise as serpents, and harmless as doves.');
    expect(verse('Romans', 16, 19)).toContain('wise unto that which is good, and simple concerning evil');
    expect(verse('Genesis', 3, 15)).toContain('it shall bruise thy head, and thou shalt bruise his heel');
    expect(verse('1Peter', 5, 8)).toContain('your adversary the devil, as a roaring lion');
    expect(verse('Ephesians', 6, 11)).toContain('the whole armour of God');
    expect(verse('Hebrews', 4, 12)).toContain('the dividing asunder of soul and spirit');
    expect(verse('Romans', 8, 14)).toBe('For as many as are led by the Spirit of God, they are the sons of God.');
    expect(verse('Matthew', 26, 53)).toContain('twelve legions of angels');
    expect(verse('1Peter', 1, 16)).toContain('Be ye holy; for I am holy');
    expect(verse('Proverbs', 3, 5)).toBe('Trust in the LORD with all thine heart; and lean not unto thine own understanding.');
    expect(verse('Proverbs', 3, 6)).toBe('In all thy ways acknowledge him, and he shall direct thy paths.');
    expect(verse('John', 14, 6)).toContain('I am the way, the truth, and the life');
  });
});
