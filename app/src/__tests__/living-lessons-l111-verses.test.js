// =============================================================================
// L111 — The Just Weight: Yahweh's Unchanging Measure vs the World's Shifting
// Standard. Verbatim KJV. Biblical economics.
// =============================================================================
// Captured 2026-08-30 from news Darrell forwarded to be worked as a lesson (a
// forwarded teaching/occasion is build input — DR-0089/DR-0312). The headlines:
// inflation above the 2% target for years, calls to abandon the target, and a
// coming change to the measuring METHOD that alters "what counts as a goal" —
// stated plainly as tier-1 fact (DR-0100), then answered by the Word: a measure
// that shifts to flatter its holder is what Scripture names an abomination
// (Proverbs 20:10; Micah 6:11), Yahweh commands one just weight (Deuteronomy
// 25:13-15; Leviticus 19:35-36), and He Himself does not change (Malachi 3:6;
// Hebrews 13:8; James 1:17). Every KJV line FETCHED from the repo's own KJV this
// session; a drift fails the build. Companion to L104 (Study Your Ways).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll111-the-just-weight-yahwehs-unchanging-measure-vs-the-worlds-shifting-standard'");
const nextId = src.indexOf("id: 'll", start + 10);
const l = src.slice(start, nextId === -1 ? start + 120000 : nextId);

// THE WHOLE KJV, WITH EACH CHAPTER'S VERSES FLOWING (added 2026-09-17, DR-0418
// full-levels pass). Two gates below need it, and both were learned the hard
// way on the lessons authored just before this one: a checker more lenient than
// the corpus manufactures confidence, and a quotation that crosses a verse
// boundary is still a real quotation. So verses are joined WITHIN a chapter by
// a space — a full quotation of Matthew 6:19-21 or Psalms 103:2-3 is then a
// true substring, while a phrase stitched together from two different chapters
// still is not.
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

// The lesson quotes the REPORTING as well as the Word — the news phrasing this
// lesson exists to answer. Named here so the span gate below can tell a quoted
// headline from a quoted verse, rather than being loosened for both.
const NON_SCRIPTURE_QUOTES = ['what counts as a goal.', 'what counts', 'hallelujah moment.'];

const QUOTED_FRAGMENTS = [
  'A false balance is abomination to the LORD: but a just weight is his delight',        // Prov 11:1
  'Divers weights, and divers measures, both of them are alike abomination to the LORD', // Prov 20:10
  'Divers weights are an abomination unto the LORD; and a false balance is not good',    // Prov 20:23
  'Thou shalt not have in thy bag divers weights, a great and a small',                 // Deut 25:13
  'Thou shalt not have in thine house divers measures, a great and a small',            // Deut 25:14
  'But thou shalt have a perfect and just weight, a perfect and just measure shalt thou have', // Deut 25:15
  'Ye shall do no unrighteousness in judgment, in meteyard, in weight, or in measure',  // Lev 19:35
  'Just balances, just weights, a just ephah, and a just hin, shall ye have',            // Lev 19:36
  'Shall I count them pure with the wicked balances, and with the bag of deceitful weights', // Micah 6:11
  'For I am the LORD, I change not; therefore ye sons of Jacob are not consumed',        // Mal 3:6
  'Jesus Christ the same yesterday, and to day, and for ever',                          // Heb 13:8
  'with whom is no variableness, neither shadow of turning',                            // Jas 1:17
  'A double minded man is unstable in all his ways',                                    // Jas 1:8
  'where moth and rust doth corrupt, and where thieves break through and steal',        // Matt 6:19
  'where neither moth nor rust doth corrupt, and where thieves do not break through nor steal', // Matt 6:20
  'For where your treasure is, there will your heart be also',                          // Matt 6:21
  'riches certainly make themselves wings; they fly away as an eagle toward heaven',     // Prov 23:5
  'But godliness with contentment is great gain',                                       // 1 Tim 6:6
  'And having food and raiment let us be therewith content',                            // 1 Tim 6:8
  'For the love of money is the root of all evil',                                      // 1 Tim 6:10
  'be content with such things as ye have: for he hath said, I will never leave thee, nor forsake thee', // Heb 13:5
  'He that is faithful in that which is least is faithful also in much',                // Luke 16:10
  'But seek ye first the kingdom of God, and his righteousness',                        // Matt 6:33
  'But thou art the same, and thy years shall have no end',                             // Ps 102:27
  'The grass withereth, the flower fadeth: but the word of our God shall stand for ever', // Isa 40:8
  'Who forgiveth all thine iniquities; who healeth all thy diseases',                    // Ps 103:3
];

describe('L111 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Proverbs 11:1; Deuteronomy 25:15; Malachi 3:6'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — shifting measure, just weight, the unchanging One', () => {
    const order = [
      '1) THE SHIFTING MEASURE',
      '2) THE JUST WEIGHT YAHWEH COMMANDS',
      '3) THE ONE WHO CHANGES NOT',
      '4) TREASURE MOTH AND RUST CANNOT TOUCH',
      '5) GODLINESS WITH CONTENTMENT',
      '6) THE MERCY UNDER THE HEADLINE',
      '7) SO: MEASURE BY THE UNCHANGING STANDARD',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('processes the news honestly (DR-0100 tiers) and keeps the Word as the authority', () => {
    expect(l).toContain('inflation');
    expect(l).toContain('tier 1');           // established fact stated plainly
    expect(l).toContain('just weight');
    expect(l).toContain('abomination');
    // no fabricated modern statistics dressed as scripture — the shifting-measure
    // claim is named as news, the standard comes from the Word.
    expect(l).toContain('the Word is the authority');
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
  it('child, teen, and senior each carry the just weight and the unchanging Yahweh', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the just/false weight`).toMatch(/just weight|perfect and just weight|honest measure|abomination|divers weights/i);
      expect(t, `${band} carries He changes not`).toMatch(/I change not|the same yesterday, and to day, and for ever/);
    }
    // teen and senior additionally carry the treasure-and-contentment threads.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('lay up for yourselves treasures in heaven');
      expect(t).toMatch(/godliness with contentment|love of money is the root of all evil/);
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Proverbs', 11, 1)).toBe('A false balance is abomination to the LORD: but a just weight is his delight.');
    expect(verse('Proverbs', 20, 10)).toBe('Divers weights, and divers measures, both of them are alike abomination to the LORD.');
    expect(verse('Deuteronomy', 25, 15)).toContain('a perfect and just weight, a perfect and just measure shalt thou have');
    expect(verse('Leviticus', 19, 36)).toContain('Just balances, just weights, a just ephah, and a just hin');
    expect(verse('Micah', 6, 11)).toBe('Shall I count them pure with the wicked balances, and with the bag of deceitful weights?');
    expect(verse('Malachi', 3, 6)).toBe('For I am the LORD, I change not; therefore ye sons of Jacob are not consumed.');
    expect(verse('Hebrews', 13, 8)).toBe('Jesus Christ the same yesterday, and to day, and for ever.');
    expect(verse('James', 1, 17)).toContain('with whom is no variableness, neither shadow of turning');
    expect(verse('Matthew', 6, 20)).toContain('where neither moth nor rust doth corrupt');
    expect(verse('1Timothy', 6, 8)).toBe('And having food and raiment let us be therewith content.');
    expect(verse('Hebrews', 13, 5)).toContain('I will never leave thee, nor forsake thee');
    expect(verse('Isaiah', 40, 8)).toBe('The grass withereth, the flower fadeth: but the word of our God shall stand for ever.');
    expect(verse('Psalms', 103, 3)).toBe('Who forgiveth all thine iniquities; who healeth all thy diseases;');
  });
});

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the double quotes are balanced, so the spans below are real quotations', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span is verbatim KJV, except the named news phrases', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(90);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
        if (NON_SCRIPTURE_QUOTES.includes(part)) continue;
        if (!KJV_FLOW.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH — a plausible drift of this lesson\'s own hinge verse is not the text', () => {
    // The hinge is Malachi 3:6. Each of these reads perfectly and is not what
    // is written; the corpus is what decides, not how a line sounds.
    expect(KJV_FLOW.includes('For I am the LORD, I change not')).toBe(true);
    expect(KJV_FLOW.includes('For I am the LORD; I change not')).toBe(false);
    expect(KJV_FLOW.includes('a just weight is his delight')).toBe(true);
    expect(KJV_FLOW.includes('a just weight is His delight')).toBe(false);
    expect(KJV_FLOW.includes('Divers weights, and divers measures')).toBe(true);
    expect(KJV_FLOW.includes('Diverse weights, and diverse measures')).toBe(false);
  });
});

describe('our own authored voice says Yahweh, not the generic name (DR-0210)', () => {
  it('names Him by His covenant name in every band and every note', () => {
    // Strip the quoted Scripture — the KJV's own "God" and "the LORD" are
    // fetched verbatim and never touched (DR-0076 bright line) — then audit
    // only the prose this house wrote. Caught five instances in the child and
    // teen bands on 2026-09-17, all of them rewritten rather than swept.
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(15);
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
      const t = level(band);
      expect(t.length, `${band} is missing or a stub`).toBeGreaterThan(1200);
    }
  });

  it('every band carries the just weight, the unchanging One, and the treasure', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the just/false weight`).toMatch(/just weight|divers weights|abomination/i);
      expect(t, `${band} carries He changes not`).toMatch(/I change not|the same yesterday, and to day, and for ever/);
      expect(t, `${band} carries the treasure that cannot erode`).toContain('lay up for yourselves treasures in heaven');
      expect(t, `${band} carries faithfulness in the least`).toContain('faithful in that which is least');
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // It was the notes: "Teach as biblical economics...", "Handle in DR-0100
    // tiers", numbered movements addressed to whoever was running the room.
    // The notes live in `facilitator` and `bigIdea`; the band is for the reader.
    const senior = level('senior');
    expect(senior).not.toMatch(/^senior: 'Teach as/);
    expect(senior).not.toContain('Handle in DR-0100 tiers');
    expect(senior).not.toContain('Captured 2026-08-30');
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });
});
