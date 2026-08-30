// =============================================================================
// L110 — Wolf vs Lion: the enemy's two tactics (stealth and intimidation) and the
// one Shepherd who answers both. Verbatim KJV.
// =============================================================================
// Captured from Darrell's spoken question 2026-08-30 ("wolf vs lion?") — a spoken
// teaching is build input (DR-0089). One enemy, two modes: the wolf infiltrates in
// disguise (stealth/deception, met by discernment) and the roaring lion intimidates
// from without (fear, met by steadfast faith); the hireling flees but the Good
// Shepherd fights and dies for the sheep, is the true Lion of Judah, and holds us in
// His hand. The adversary is named low (per the 2026-08-30 typographic directive);
// KJV lines fetched from the app's own (now-lowercased) KJV. Companion to L106
// (wise as serpents), L102 (discern the destroyer), L108 (why we name him low).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll110-wolf-vs-lion-the-enemys-two-tactics-and-the-one-shepherd'");
const nextId = src.indexOf("id: 'll", start + 10);
const l = src.slice(start, nextId === -1 ? start + 120000 : nextId);

const QUOTED_FRAGMENTS = [
  'I send you forth as sheep in the midst of wolves',                       // Matt 10:16
  'which come to you in sheep\\u2019s clothing, but inwardly they are ravening wolves', // Matt 7:15 (curly apostrophe)
  'Ye shall know them by their fruits',                                    // Matt 7:16
  'shall grievous wolves enter in among you, not sparing the flock',        // Acts 20:29
  'for satan himself is transformed into an angel of light',                // 2 Cor 11:14 (lowercased)
  'whose end shall be according to their works',                           // 2 Cor 11:15
  'try the spirits whether they are of God',                               // 1 John 4:1
  'your adversary the devil, as a roaring lion',                          // 1 Pet 5:8
  'Whom resist stedfast in the faith',                                     // 1 Pet 5:9
  'God hath not given us the spirit of fear',                             // 2 Tim 1:7
  'But he that is an hireling, and not the shepherd',                       // John 10:12
  'The hireling fleeth, because he is an hireling',                         // John 10:13
  'the good shepherd giveth his life for the sheep',                        // John 10:11
  'Thy servant slew both the lion and the bear',                          // 1 Sam 17:36
  'the Lion of the tribe of Juda, the Root of David, hath prevailed',      // Rev 5:5
  'neither shall any man pluck them out of my hand',                       // John 10:28
  'the sheep follow him: for they know his voice',                         // John 10:4
  'Resist the devil, and he will flee from you',                          // Jas 4:7
];

describe('L110 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Matthew 10:16; 1 Peter 5:8; John 10:11'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — two tactics, the Shepherd, the keeping', () => {
    const order = [
      '1) TWO TACTICS, ONE ENEMY',
      '2) THE WOLF',
      '3) THE ROARING LION',
      '4) THE HIRELING FLEES',
      '5) THE TRUE LION AND SHEPHERD WINS',
      '6) SO: DISCERN THE WOLF',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('answers Darrell\'s question and keeps the adversary named low (post-directive)', () => {
    expect(l).toContain('Darrell');
    expect(l).toContain('two tactics');
    expect((l.match(/\bSatan\b/g) || []).length).toBe(0);   // even the 2 Cor 11:14 quote is lowercased
    expect(l).toContain('satan himself is transformed');
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    const f = frag.replace('\\u2019', '’');
    it(`quotes verbatim: "${f.slice(0, 48)}${f.length > 48 ? '…' : ''}"`, () => {
      expect(l).toContain(f);
    });
  }
});

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };
  it('child, teen, and senior each carry the wolf and the Good Shepherd', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the wolf`).toMatch(/ravening wolves|roaring lion|wolves/);
      expect(t, `${band} carries the Shepherd`).toMatch(/good shepherd giveth his life|pluck them out of my hand/);
    }
    // teen and senior additionally carry the disguise-and-discern and steadfast threads.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toMatch(/know them by their fruits|know by FRUIT/);
      expect(t).toContain('the spirit of fear');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Matthew', 10, 16)).toContain('I send you forth as sheep in the midst of wolves');
    expect(verse('Matthew', 7, 16)).toContain('Ye shall know them by their fruits');
    expect(verse('Acts', 20, 29)).toContain('grievous wolves enter in among you, not sparing the flock');
    // the 2 Cor 11:14 corpus verse is now lowercased (the sweep) — the tamper-catch:
    expect(verse('2Corinthians', 11, 14)).toBe('And no marvel; for satan himself is transformed into an angel of light.');
    expect(verse('1John', 4, 1)).toContain('try the spirits whether they are of God');
    expect(verse('1Peter', 5, 8)).toContain('your adversary the devil, as a roaring lion');
    expect(verse('John', 10, 11)).toContain('the good shepherd giveth his life for the sheep');
    expect(verse('John', 10, 28)).toContain('neither shall any man pluck them out of my hand');
    expect(verse('1Samuel', 17, 36)).toContain('Thy servant slew both the lion and the bear');
    expect(verse('Revelation', 5, 5)).toContain('the Lion of the tribe of Juda');
  });
});
