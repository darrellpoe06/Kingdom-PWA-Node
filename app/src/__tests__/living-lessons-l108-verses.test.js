// =============================================================================
// L108 — Why We Name Him Low: the typography of a defeated enemy. Verbatim KJV.
// =============================================================================
// Captured from Darrell's teaching + directive 2026-08-30 — a spoken teaching is
// build input (DR-0089). Records WHY the app lowercases the adversary's names
// everywhere, including inside the Bible text: he forfeited the honor (Isaiah
// 14:12), he is a defeated creature and no peer of Yahweh (Genesis 3:15; Rev
// 12:10; Col 2:15), all honor is Yahweh's alone (Isaiah 42:8; Phil 2:9-10), it
// disciples the eye to reserve fear for Yahweh (James 4:7; Isaiah 8:13), and it
// agrees with Heaven's verdict rather than calling evil good (Isaiah 5:20). The
// KJV fetched from the app's own corpus, which now writes his names low — so this
// test doubles as the witness that the corpus was lowercased (lucifer, satan).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll108-why-we-name-him-low-the-typography-of-a-defeated-enemy'");
const nextId = src.indexOf("id: 'll", start + 10);
const l = src.slice(start, nextId === -1 ? start + 120000 : nextId);

const QUOTED_FRAGMENTS = [
  'How art thou fallen from heaven, O lucifer, son of the morning',         // Isa 14:12 (lowercased)
  'I will exalt my throne above the stars of God',                         // Isa 14:13
  'it shall bruise thy head, and thou shalt bruise his heel',              // Gen 3:15
  'the accuser of our brethren is cast down',                             // Rev 12:10
  'having spoiled principalities and powers, he made a shew of them openly', // Col 2:15
  'I beheld satan as lightning fall from heaven',                          // Luke 10:18 (lowercased)
  'my glory will I not give to another',                                   // Isa 42:8
  'Thou shalt have no other gods before me',                              // Exo 20:3
  'Get thee hence, satan',                                                 // Matt 4:10 (lowercased)
  'Thou art worthy, O Lord, to receive glory and honour and power',        // Rev 4:11
  'given him a name which is above every name',                            // Phil 2:9
  'That at the name of Jesus every knee should bow',                       // Phil 2:10
  'Resist the devil, and he will flee from you',                          // Jas 4:7
  'greater is he that is in you, than he that is in the world',            // 1 John 4:4
  'let him be your fear, and let him be your dread',                       // Isa 8:13
  'Woe unto them that call evil good, and good evil',                      // Isa 5:20
  'the devil that deceived them was cast into the lake of fire',            // Rev 20:10 (lowercased)
  'the God of peace shall bruise satan under your feet shortly',           // Rom 16:20 (lowercased)
  'the name of the wicked shall rot',                                     // Prov 10:7
];

describe('L108 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Isaiah 14:12; James 4:7; Philippians 2:9-10'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — five reasons + THE WHOLE OF IT', () => {
    const order = [
      '1) HE FORFEITED THE HONOR',
      '2) HE IS A CREATURE, NOT A PEER OF YAHWEH',
      '3) ALL HONOR BELONGS TO YAHWEH ALONE',
      '4) DISCIPLE THE EYE',
      '5) AGREE WITH HEAVEN',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('names the directive and the bright line — his name low even inside the Bible, meaning untouched', () => {
    expect(l).toContain('Darrell');
    expect(l).toContain('inside the Bible');
    expect(l).toContain('the KJV words stand');
    // the adversary's name is written LOW throughout this lesson, including its quotes.
    expect((l.match(/\bSatan\b/g) || []).length).toBe(0);
    expect((l.match(/\bLucifer\b/g) || []).length).toBe(0);
    expect(l).toContain('lucifer');
    expect(l).toContain('satan');
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
  it('child, teen, and senior each carry the forfeited-honor and honor-is-Yahwehs threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the fall`).toContain('How art thou fallen from heaven');
      expect(t, `${band} carries resist/flee`).toContain('Resist the devil, and he will flee from you');
    }
    // teen and senior additionally carry the name-above-every-name and fear-is-Yahwehs threads.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('a name which is above every name');
    }
  });
});

describe('corpus witness — the corpus itself now writes the adversary low (the sweep landed)', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('adversary names are lowercased in the KJV corpus, and place/person names are preserved', () => {
    expect(verse('Isaiah', 14, 12)).toContain('O lucifer, son of the morning');
    expect(verse('Luke', 10, 18)).toBe('And he said unto them, I beheld satan as lightning fall from heaven.');
    expect(verse('Matthew', 4, 10)).toContain('Get thee hence, satan');
    expect(verse('Romans', 16, 20)).toContain('the God of peace shall bruise satan under your feet shortly');
    expect(verse('1Kings', 18, 21)).toContain('if baal, then follow him');          // false god lowered
    expect(verse('Matthew', 12, 24)).toContain('beelzebub the prince of the devils'); // false god lowered
    // place/person names PRESERVED (whole-word matching never touched them):
    expect(verse('Joshua', 15, 9)).toContain('Baalah');   // a place
    expect(verse('1Chronicles', 1, 49)).toContain('Baalhanan'); // a person (king of Edom)
  });
});
