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
import { readFileSync, readdirSync } from 'node:fs';
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

// =============================================================================
// THE TWO CHECKS THIS GATE DID NOT HAVE (added 2026-09-17, DR-0418 pass)
// =============================================================================
// Added to L111 the same day and carried here for the same reason: the two
// classes of defect that actually occur when a lesson is authored are an
// altered quotation and the generic name slipping into our own voice — and
// neither was checked. Both immediately found real work in this lesson: the
// span gate caught Matthew 7:15 quoted with an ASCII apostrophe where the
// corpus carries U+2019 (`sheep's` for `sheep’s`), and the voice check caught
// the generic name in the child band's prose.
//
// The corpus is joined with each chapter's VERSES FLOWING (space-separated
// within a chapter), so a legitimate quotation of contiguous verses — John
// 10:12-13 and John 10:27-28 are both quoted whole here — is a true substring,
// while a phrase stitched from two different chapters still is not.
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const KJV_FLOW = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json'))) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;   // index.json is not a book
    for (const ch of j.chapters) all += `${ch.join(' ')}\n`;
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

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the double quotes are balanced, so the spans below are real quotations', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span is verbatim KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(60);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
        if (!KJV_FLOW.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH — including the apostrophe this lesson actually carried', () => {
    // The real defect, found by this gate on the day it was added: an ASCII
    // apostrophe inside a quotation of Matthew 7:15. The corpus decides.
    expect(KJV_FLOW.includes('sheep\u2019s clothing')).toBe(true);
    expect(KJV_FLOW.includes("sheep's clothing")).toBe(false);
    // And two drifts of this lesson's own hinges that read perfectly. NOTE on
    // the first pair: "like a roaring lion" IS in the corpus (Ezekiel 22:25,
    // of the prophets in her midst), which is why the pin is the 1 Peter 5:8
    // clause as a whole rather than the phrase alone — the lesson's teaching
    // rests on the word AS in THAT verse, and a corpus-wide phrase search
    // would have called a real reading a drift.
    expect(KJV_FLOW.includes('the devil, as a roaring lion, walketh about')).toBe(true);
    expect(KJV_FLOW.includes('the devil, like a roaring lion, walketh about')).toBe(false);
    expect(KJV_FLOW.includes('I am the good shepherd')).toBe(true);
    expect(KJV_FLOW.includes('I am the Good Shepherd')).toBe(false);
  });
});

describe('our own authored voice says Yahweh, not the generic name (DR-0210)', () => {
  it('names Him by His covenant name, and never capitalizes the adversary', () => {
    // The KJV's own "God" is fetched verbatim and never touched (DR-0076's
    // bright line), so the quoted spans come out before the prose is audited.
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/\bSatan\b/g) || []).length, 'capitalized adversary name in our voice').toBe(0);
    expect((ours.match(/\bLucifer\b/g) || []).length).toBe(0);
  });
});

describe('every band is the FULL message, in that age\'s own words (DR-0418)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };

  it('youth exists beside the other three, and none is a summary', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band).length, `${band} is missing or a stub`).toBeGreaterThan(1200);
    }
  });

  it('every band carries both tactics, the asymmetry, and the Shepherd', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the wolf in wool`).toContain('sheep\u2019s clothing');
      expect(t, `${band} tests by fruit rather than costume`).toMatch(/by their fruits|fruit/i);
      expect(t, `${band} carries the roaring lion`).toContain('as a roaring lion');
      expect(t, `${band} answers the roar with courage, not fear`).toContain('hath not given us the spirit of fear');
      expect(t, `${band} carries the good shepherd`).toContain('the good shepherd giveth his life for the sheep');
      expect(t, `${band} carries the hand no one can pluck from`).toContain('pluck them out of my hand');
      expect(t, `${band} names the true Lion who prevailed`).toContain('the Lion of the tribe of Juda');
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // It was the notes: "Teach as the enemy's two-tactic doctrine...",
    // companion-lesson cross-references, and numbered movements addressed to
    // whoever was running the room. Those belong in `facilitator`.
    const senior = level('senior');
    expect(senior).not.toContain('Teach as the enemy');
    expect(senior).not.toContain('Adversary named low');
    expect(senior).not.toMatch(/companion to L\d+/i);
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });
});
