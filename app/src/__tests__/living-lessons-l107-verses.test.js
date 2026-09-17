// =============================================================================
// L107 — What the Word Gives: Love, Truth, Light, Knowledge, Understanding — the
// thoughts to think, what to experience, how we receive it, and Yahweh's strategy
// vs the enemy. Verbatim KJV.
// =============================================================================
// Captured from Darrell's spoken questions 2026-08-30 (positive companion to
// L106) — a spoken teaching is build input (DR-0089). The specific thoughts (the
// Test, Philippians 4:8); what the Word wants us to experience (fruit, abundant
// life, full joy, peace); the Word as Love/Truth/Light/Knowledge/Understanding and
// how each is received; the one receiving posture (receive the Word, welcome the
// Spirit, ask in faith, do it); and Yahweh's strategy (give/free/enlighten/order)
// vs the enemy's tactics (steal/blind/lie/confuse). Typographic theology held: in
// the lesson's own voice the adversary is named low; KJV quotes keep verbatim
// casing (DR-0076). Every KJV line FETCHED from the repo's own KJV this session.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll107-what-the-word-gives-love-truth-light-knowledge-and-how-we-receive-it-vs-the-enemy'");
// Bound the slice to THIS module only — so a later lesson's own "Satan" quote
// cannot bleed into L107's low-naming check.
const nextId = src.indexOf("id: 'll", start + 10);
const l = src.slice(start, nextId === -1 ? start + 120000 : nextId);

const QUOTED_FRAGMENTS = [
  'whatsoever things are true, whatsoever things are honest',              // Phil 4:8
  'Set your affection on things above, not on things on the earth',        // Col 3:2
  'Thou wilt keep him in perfect peace, whose mind is stayed on thee',      // Isa 26:3
  'the fruit of the Spirit is love, joy, peace, longsuffering',            // Gal 5:22
  'I am come that they might have life, and that they might have it more abundantly', // John 10:10
  'the peace of God, which passeth all understanding',                     // Phil 4:7
  'joy unspeakable and full of glory',                                    // 1 Pet 1:8
  'righteousness, and peace, and joy in the Holy Ghost',                   // Rom 14:17
  'He that loveth not knoweth not God; for God is love',                   // 1 John 4:8
  'the love of God is shed abroad in our hearts',                          // Rom 5:5
  'If ye keep my commandments, ye shall abide in my love',                 // John 15:10
  'Sanctify them through thy truth: thy word is truth',                    // John 17:17
  'ye shall know the truth, and the truth shall make you free',            // John 8:32
  'The entrance of thy words giveth light; it giveth understanding unto the simple', // Ps 119:130
  'I am the light of the world',                                          // John 8:12
  'For the LORD giveth wisdom: out of his mouth cometh knowledge and understanding', // Prov 2:6
  'In whom are hid all the treasures of wisdom and knowledge',             // Col 2:3
  'If any of you lack wisdom, let him ask of God',                         // Jas 1:5
  'The fear of the LORD is the beginning of wisdom',                       // Prov 9:10
  'receive with meekness the engrafted word',                             // Jas 1:21
  'the Comforter, which is the Holy Ghost',                               // John 14:26
  'Ask, and it shall be given you; seek, and ye shall find',               // Matt 7:7
  'without faith it is impossible to please him',                         // Heb 11:6
  'the god of this world hath blinded the minds of them which believe not', // 2 Cor 4:4
  'Every good gift and every perfect gift is from above',                  // Jas 1:17
  'There is therefore now no condemnation to them which are in Christ Jesus', // Rom 8:1
  'God is not the author of confusion, but of peace',                     // 1 Cor 14:33
  'they overcame him by the blood of the Lamb, and by the word of their testimony', // Rev 12:11
];

describe('L107 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Philippians 4:8; 1 John 4:8; James 1:5'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — eight movements + THE WHOLE OF IT', () => {
    const order = [
      '1) THE SPECIFIC THOUGHTS TO THINK',
      '2) WHAT THE WORD WANTS US TO EXPERIENCE',
      '3) THE WORD IS LOVE',
      '4) THE WORD IS TRUTH',
      '5) THE WORD IS LIGHT',
      '6) KNOWLEDGE AND UNDERSTANDING',
      '7) HOW WE RECEIVE ALL OF THESE',
      '8) YAHWEH',   // "8) YAHWEH'S STRATEGY vs THE ENEMY'S TACTICS"
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
    expect(l).toContain('two strategies');       // the Yahweh-vs-enemy contrast
    expect(l).toContain('HOW WE RECEIVE');       // movement 7 header
    expect((l.match(/Lucifer/g) || []).length).toBe(0);
    // "Satan" only inside the verbatim KJV quote of 2 Cor 11:14 ("Satan himself is transformed…")
    for (const m of l.matchAll(/\bSatan\b/g)) {
      expect(l.slice(m.index, m.index + 21)).toBe('Satan himself is tran');
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
  it('child, teen, and senior each carry God-is-love and the ask-to-receive threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries God is love`).toContain('for God is love');
      expect(t, `${band} carries ask/receive`).toMatch(/Ask, and it shall be given you|let him ask of God/);
    }
    // teen and senior additionally carry the abundant-life experience and the two-strategy contrast.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('have it more abundantly');
      expect(t).toContain('the blood of the Lamb');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('1John', 4, 8)).toBe('He that loveth not knoweth not God; for God is love.');
    expect(verse('John', 17, 17)).toBe('Sanctify them through thy truth: thy word is truth.');
    expect(verse('John', 8, 32)).toBe('And ye shall know the truth, and the truth shall make you free.');
    expect(verse('Psalms', 119, 130)).toContain('The entrance of thy words giveth light');
    expect(verse('Proverbs', 2, 6)).toBe('For the LORD giveth wisdom: out of his mouth cometh knowledge and understanding.');
    expect(verse('James', 1, 5)).toContain('If any of you lack wisdom, let him ask of God');
    expect(verse('Matthew', 7, 7)).toContain('Ask, and it shall be given you');
    expect(verse('2Corinthians', 4, 4)).toContain('the god of this world hath blinded the minds');
    expect(verse('James', 1, 17)).toContain('Every good gift and every perfect gift is from above');
    expect(verse('1Corinthians', 14, 33)).toContain('God is not the author of confusion, but of peace');
    expect(verse('Revelation', 12, 11)).toContain('they overcame him by the blood of the Lamb, and by the word of their testimony');
    expect(verse('Philippians', 4, 7)).toContain('the peace of God, which passeth all understanding');
  });
});

// =============================================================================
// THE TWO CHECKS THIS GATE DID NOT HAVE (added 2026-09-17, DR-0418 pass)
// =============================================================================
// Carried from L111/L110/L109/L108 the same day, and they found two real
// things here too: John 15:10 was quoted with an ASCII apostrophe where the
// corpus carries U+2019 (`Father's` for `Father’s`) — the third in-quote
// alteration this pass has caught — and the generic name stood in our own
// prose in six places, five in the child band and one in a facilitator
// talking point.
//
// The corpus is joined with each chapter's VERSES FLOWING (space-separated
// within a chapter), so a legitimate quotation of contiguous verses — this
// lesson quotes Galatians 5:22-23 whole — is a true substring while a phrase
// stitched from two chapters still is not.
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
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(120);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
        if (!KJV_FLOW.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH — including the apostrophe this lesson actually carried', () => {
    // The real defect this gate found on the day it was added, in John 15:10.
    expect(KJV_FLOW.includes('I have kept my Father\u2019s commandments')).toBe(true);
    expect(KJV_FLOW.includes("I have kept my Father's commandments")).toBe(false);
    // And drifts of this lesson's own hinges that read perfectly:
    expect(KJV_FLOW.includes('The entrance of thy words giveth light')).toBe(true);
    expect(KJV_FLOW.includes('The entrance of thy word giveth light')).toBe(false);
    expect(KJV_FLOW.includes('giveth to all men liberally, and upbraideth not')).toBe(true);
    expect(KJV_FLOW.includes('giveth to all men liberally, and upbraideth them not')).toBe(false);
    expect(KJV_FLOW.includes('he is a liar, and the father of it')).toBe(true);
    expect(KJV_FLOW.includes('he is a liar, and the father of lies')).toBe(false);
  });
});

describe('our own authored voice says Yahweh, not the generic name (DR-0210)', () => {
  it('names Him by His covenant name in every band and every note', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/\bSatan\b/g) || []).length, 'capitalized adversary name in our voice').toBe(0);
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
      expect(level(band).length, `${band} is missing or a stub`).toBeGreaterThan(1400);
    }
  });

  it('every band carries all eight movements, not a subset', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the eight-question filter`).toContain('whatsoever things are true');
      expect(t, `${band} carries the thought taken captive`).toContain('captivity every thought');
      expect(t, `${band} carries the fruit that grows`).toContain('the fruit of the Spirit');
      expect(t, `${band} sets abundant life against the thief`).toContain('more abundantly');
      expect(t, `${band} carries the Love poured in`).toContain('shed abroad in our hearts');
      expect(t, `${band} carries truth that frees`).toContain('the truth shall make you free');
      expect(t, `${band} carries the ENTRANCE that gives light`).toContain('The entrance of thy words giveth light');
      expect(t, `${band} carries wisdom given liberally and without reproach`).toContain('upbraideth not');
      expect(t, `${band} carries ask, seek, knock`).toContain('Ask, and it shall be given you');
      expect(t, `${band} names the liar and the father of it`).toContain('the father of it');
      expect(t, `${band} names what Yahweh gives`).toContain('Every good gift and every perfect gift');
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // It was the notes: "Teach as the positive companion to L106 (know the
    // enemy)...", the capture date, and a checklist of what to cover. Those
    // belong in `facilitator`.
    const senior = level('senior');
    expect(senior).not.toContain('Teach as the positive companion');
    expect(senior).not.toMatch(/\bL10[0-9]\b/);
    expect(senior).not.toContain('2026-08-30');
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });
});
