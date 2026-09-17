// =============================================================================
// L109 — How We Know Yahweh's Love: experienced, not only believed — taste, see,
// hear, touch, at every age. Verbatim KJV.
// =============================================================================
// Captured from Darrell's spoken question 2026-08-30 — a spoken teaching is build
// input (DR-0089). How do human beings KNOW Yahweh's Love — feel it, see it, hear
// it, taste it? Scripture answers that His Love is given to be EXPERIENCED through
// every sense He made, and known (not merely believed) at every age. Companion to
// L105 (experiential knowing) and L107 (how we receive Love). Every KJV line
// FETCHED from the repo's own KJV this session; a drift fails the build.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll109-how-we-know-yahwehs-love-taste-see-hear-touch-experienced-at-every-age'");
const nextId = src.indexOf("id: 'll", start + 10);
const l = src.slice(start, nextId === -1 ? start + 120000 : nextId);

const QUOTED_FRAGMENTS = [
  'O taste and see that the LORD is good',                                 // Psalm 34:8
  'How sweet are thy words unto my taste! yea, sweeter than honey',        // Psalm 119:103
  'If so be ye have tasted that the Lord is gracious',                      // 1 Pet 2:3
  'Behold, what manner of love the Father hath bestowed upon us',           // 1 John 3:1
  'God so loved the world, that he gave his only begotten Son',             // John 3:16
  'while we were yet sinners, Christ died for us',                         // Rom 5:8
  'The heavens declare the glory of God',                                  // Psalm 19:1
  'I have loved thee with an everlasting love',                            // Jer 31:3
  'My sheep hear my voice, and I know them',                               // John 10:27
  'faith cometh by hearing, and hearing by the word of God',               // Rom 10:17
  'he will rejoice over thee with joy',                                    // Zeph 3:17
  'the love of God is shed abroad in our hearts',                          // Rom 5:5
  'underneath are the everlasting arms',                                   // Deut 33:27
  'He healeth the broken in heart',                                        // Psalm 147:3
  'I will not leave you comfortless: I will come to you',                   // John 14:18
  'handle me, and see',                                                    // Luke 24:39
  'to know the love of Christ, which passeth knowledge',                   // Eph 3:19
  'we have known and believed the love that God hath to us',               // 1 John 4:16
  'let us not love in word, neither in tongue; but in deed and in truth',   // 1 John 3:18
  'he took them up in his arms, put his hands upon them, and blessed them', // Mark 10:16
  'even to hoar hairs will I carry you',                                   // Isa 46:4
  'We love him, because he first loved us',                                // 1 John 4:19
];

describe('L109 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Psalm 34:8; Romans 5:8; Zephaniah 3:17'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — the four senses, knowing, and every age', () => {
    const order = [
      '1) TASTE IT',
      '2) SEE IT',
      '3) HEAR IT',
      '4) TOUCH AND FEEL IT',
      '5) KNOW IT BY EXPERIENCE',
      '6) AT EVERY AGE',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('answers Darrell\'s question — experienced through the senses, at every age', () => {
    expect(l).toContain('Darrell');
    expect(l).toMatch(/feel it, see it, hear it, taste it|taste, see, hear/i);
    expect(l).toContain('every age');
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
  it('child, teen, and senior each carry taste-and-see and He-first-loved-us', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries taste and see`).toContain('taste and see that the LORD is good');
      expect(t, `${band} carries He first loved us`).toContain('We love him, because he first loved us');
    }
    // teen and senior additionally carry the sung-over-you and every-age threads.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('he will rejoice over thee with joy');
      expect(t).toContain('hoar hairs');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Psalms', 34, 8)).toBe('O taste and see that the LORD is good: blessed is the man that trusteth in him.');
    expect(verse('Romans', 5, 8)).toBe('But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.');
    expect(verse('Zephaniah', 3, 17)).toContain('he will rejoice over thee with joy');
    expect(verse('Jeremiah', 31, 3)).toContain('I have loved thee with an everlasting love');
    expect(verse('Luke', 24, 39)).toContain('handle me, and see');
    expect(verse('Ephesians', 3, 19)).toContain('to know the love of Christ, which passeth knowledge');
    expect(verse('1John', 4, 16)).toContain('we have known and believed the love that God hath to us');
    expect(verse('Mark', 10, 16)).toBe('And he took them up in his arms, put his hands upon them, and blessed them.');
    expect(verse('Isaiah', 46, 4)).toContain('even to hoar hairs will I carry you');
    expect(verse('1John', 4, 19)).toBe('We love him, because he first loved us.');
  });
});

// =============================================================================
// THE TWO CHECKS THIS GATE DID NOT HAVE (added 2026-09-17, DR-0418 pass)
// =============================================================================
// The same pair added to L111 and L110 the same day, for the same reason: the
// two classes of defect that actually occur when a lesson is authored are an
// altered quotation and the generic name slipping into our own voice. This
// lesson passed both on arrival — 109 spans verbatim and no generic name in
// our prose — and the checks are added anyway, because a property that holds
// today and is not checked is a property that breaks quietly tomorrow.
//
// The corpus is joined with each chapter's VERSES FLOWING (space-separated
// within a chapter), so a legitimate quotation of contiguous verses — this
// lesson quotes Ephesians 3:17-19 whole — is a true substring, while a phrase
// stitched from two different chapters still is not.
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
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(90);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
        if (!KJV_FLOW.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH — plausible drifts of this lesson\'s own hinges are not the text', () => {
    // Each wrong form below reads perfectly and is not what is written. The
    // corpus decides, never how a line sounds in the ear.
    expect(KJV_FLOW.includes('O taste and see that the LORD is good')).toBe(true);
    expect(KJV_FLOW.includes('O see and taste that the LORD is good')).toBe(false);
    expect(KJV_FLOW.includes('he will joy over thee with singing')).toBe(true);
    expect(KJV_FLOW.includes('he will sing over thee with joy')).toBe(false);
    expect(KJV_FLOW.includes('And we have known and believed the love')).toBe(true);
    expect(KJV_FLOW.includes('And we have believed and known the love')).toBe(false);
    expect(KJV_FLOW.includes('even to hoar hairs will I carry you')).toBe(true);
    expect(KJV_FLOW.includes('even to grey hairs will I carry you')).toBe(false);
  });
});

describe('our own authored voice says Yahweh, not the generic name (DR-0210)', () => {
  it('names Him by His covenant name in every band and every note', () => {
    // The KJV's own "God" is fetched verbatim and never touched (DR-0076's
    // bright line), so the quoted spans come out before the prose is audited.
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(5);
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

  it('every band carries all four senses, the knowing, and both ends of a life', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} tastes it`).toContain('O taste and see that the LORD is good');
      expect(t, `${band} sees it at the cross`).toMatch(/he gave his only begotten Son|while we were yet sinners/);
      expect(t, `${band} hears it sung`).toContain('joy over thee with singing');
      expect(t, `${band} feels it poured in`).toContain('shed abroad in our hearts');
      expect(t, `${band} carries the child in His arms`).toContain('took them up in his arms');
      expect(t, `${band} carries the gray head He carries`).toContain('hoar hairs will I carry you');
      expect(t, `${band} names where it starts`).toContain('because he first loved us');
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // It was the notes: "Teach as experiential knowledge of Yahweh's Love
    // (companion to L105 and L107)", ordinal movements addressed to whoever
    // was leading, and "lead the group" at the close. Those belong in
    // `facilitator`.
    const senior = level('senior');
    expect(senior).not.toContain('Teach as experiential knowledge');
    expect(senior).not.toMatch(/companion to L\d+/i);
    expect(senior).not.toContain('lead the group');
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });
});
