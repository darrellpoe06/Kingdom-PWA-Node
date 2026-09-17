// =============================================================================
// L95 — Know the State of Thy Flocks (Best Buy, reading the times, the fickle
// rally): verbatim KJV
// =============================================================================
// Darrell 2026-08-28 (forwarded a retail piece + "Lesson."): Best Buy beat
// earnings and raised its outlook through tariff chaos and weak sentiment — the
// CEO named the trick as following consumers' lead wherever they wanted to go;
// its stock, up ~50%, fell 4% on the good news (our own idiom: "buy the hype,
// sell the news"). Captured Word-first (the Spoken-Teachings rule + DR-0089; the
// beat carried AS REPORTED, DR-0076). Every KJV line was FETCHED from the repo's
// own KJV this session; a drifted quote fails the build.
//
// NOTE THIS HEADER WAS ITSELF CORRECTED (2026-09-17). It previously wrote the
// CEO's words as `its "trick" was following consumers' lead` -- the very
// misquotation the gate below now forbids. The paraphrase is unquoted here for
// the same reason it is unquoted in the lesson: we hold no transcript.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll95-know-the-state-of-thy-flocks-best-buy-and-the-fickle-rally'");
// Bound the slice to THIS lesson rather than to a fixed character window. A
// fixed window is fragile in BOTH directions: too small and it misses the end of
// the lesson (which is how adding adult-depth prose pushed `quiz:` out of view),
// too large and it sweeps into the NEXT lesson and judges someone else's prose.
const l = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();

const QUOTED_FRAGMENTS = [
  // Hard times forge good ones
  'we glory in tribulations also: knowing that tribulation worketh patience',
  'And patience, experience; and experience, hope',
  'count it all joy when ye fall into divers temptations',
  'the trying of your faith worketh patience',
  // Know the flock / read the times
  'Be thou diligent to know the state of thy flocks, and look well to thy herds',
  'had understanding of the times, to know what Israel ought to do',
  // Meet people where they are
  'I am made all things to all men, that I might by all means save some',
  'I am the good shepherd, and know my sheep, and am known of mine',
  // Presence
  'Not forsaking the assembling of ourselves together, as the manner of some is; but exhorting one another',
  // Diligence bears rule, as worship
  'Seest thou a man diligent in his business? he shall stand before kings',
  'The hand of the diligent shall bear rule: but the slothful shall be under tribute',
  'And whatsoever ye do, do it heartily, as to the Lord, and not unto men',
  // Don't chase the hype / uncertain riches
  'Labour not to be rich: cease from thine own wisdom',
  'riches certainly make themselves wings; they fly away as an eagle toward heaven',
  'nor trust in uncertain riches, but in the living God, who giveth us richly all things to enjoy',
  'Boast not thyself of to morrow; for thou knowest not what a day may bring forth',
  // Build on Yahweh
  'Except the LORD build the house, they labour in vain that build it',
  'Commit thy works unto the LORD, and thy thoughts shall be established',
];

// -----------------------------------------------------------------------------
// The corpus, joined the way a reader meets it: verses joined with a SPACE
// inside each chapter, so a contiguous-verse quotation is a true substring.
// -----------------------------------------------------------------------------
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

// OUR OWN WORDS, and nobody else's. Every entry here is a market idiom or a
// term this lesson coined; not one is attributed to a person or to Scripture.
// `best-buying the hype` is our pun on the company's name. The checks below
// assert each is absent from the corpus AND that no entry is a person's speech.
const OUR_OWN_QUOTED = [
  'buy the hype, sell the news',
  'best-buying the hype and selling the news.',
  'good quarter',
];

describe('L95 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Proverbs 27:23; 1 Corinthians 9:22; Proverbs 23:5'", 'benefits:', 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the spoken spine, in order (hard times → flocks → meet people → presence → diligence → not the hype → build on Yahweh)', () => {
    expect(l).toContain('THE STEWARD ABOVE IT');
    expect(l).toContain('carried as reported'); // DR-0076 honesty
    const order = [
      '1) HARD TIMES CAN FORGE GOOD ONES',
      '2) KNOW THE STATE OF THY FLOCKS',
      '3) MEET PEOPLE WHERE THEY ARE',
      '4) PRESENCE STILL MATTERS',
      '5) DILIGENCE PROSPERS AND BEARS RULE',
      '6) BUT DO NOT CHASE THE CROWD',
      '7) BUILD IT ON YAHWEH, NOT ON THE RALLY',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
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

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the double quotes are balanced, so the spans below are real quotations', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span is verbatim KJV, or one of OUR OWN listed phrases', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(60);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
        if (OUR_OWN_QUOTED.includes(part)) continue;
        if (!KJV_FLOW.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('a verse quotation can never hide behind the allowlist', () => {
    for (const q of OUR_OWN_QUOTED) {
      expect(KJV_FLOW.includes(q), `allowlisted phrase IS Scripture: ${q}`).toBe(false);
    }
  });

  // ---------------------------------------------------------------------------
  // A CLASS THIS PASS HAD NOT MET BEFORE: a LIVING PERSON'S words misquoted.
  //
  // Every earlier false attribution in this pass put our own phrasing inside
  // quotation marks beside a VERSE reference. This lesson did it to a named
  // company's chief executive, and the proof needed no outside source: the same
  // sentence appeared in TWO different forms in the same catalog --
  //
  //     bigIdea   "Following consumers' lead, wherever they may want to go"
  //     teen      "following consumers' lead, wherever they may want to go."
  //
  // different capital, different terminal punctuation. A verbatim quotation
  // cannot have two forms, so at most one could be right, and no transcript
  // exists in this repo for either. The one-word `"trick,"` was attributed to
  // him the same way.
  //
  // The fix required no research, because the lesson already contained the
  // correct pattern in its own base prose: paraphrase him UNQUOTED and say the
  // claim is carried as reported. That discipline now holds everywhere, and it
  // is arguably owed more strictly here than for Scripture -- a misquoted verse
  // can be checked by any reader against the text, while a misquoted person has
  // words placed in his mouth that he cannot retrieve.
  // ---------------------------------------------------------------------------
  it('no words are attributed to the CEO inside quotation marks', () => {
    const { spans } = quotedSpans(l);
    const attributed = spans.filter((s) => /consumers|customer|trick/i.test(s));
    expect(
      attributed,
      `a person's speech inside quotation marks without a source:\n${attributed.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`,
    ).toEqual([]);
    // And the two exact forms that were there, named so they cannot return.
    expect(l).not.toContain('"Following consumers');
    expect(l).not.toContain('"following consumers');
    expect(l).not.toContain('"trick,"');
    expect(l).not.toContain('"trick"');
  });

  it('the paraphrase says it IS a paraphrase, and that we hold no transcript', () => {
    expect(l, 'the reported-not-quoted marker').toContain('carried as reported');
    expect(l, 'named as a paraphrase').toContain('paraphrased');
    expect(l, 'and the absence of a source stated plainly').toMatch(/no transcript/i);
  });

  it('every entry on the allowlist is OURS — not a person\'s speech', () => {
    // The allowlist may only ever hold our own words. An entry sitting next to
    // an attribution would be this same defect wearing an exemption.
    for (const q of OUR_OWN_QUOTED) {
      expect(/said|told|according to/i.test(q), `allowlist entry reads as attributed speech: ${q}`).toBe(false);
    }
  });

  it('is PROVEN-TO-CATCH — the Scripture in this lesson reads exactly', () => {
    expect(KJV_FLOW.includes('Labour not to be rich: cease from thine own wisdom.')).toBe(true);
    expect(KJV_FLOW.includes('Labour not to be rich; cease from thine own wisdom.')).toBe(false);
    expect(KJV_FLOW.includes('Be thou diligent to know the state of thy flocks')).toBe(true);
    expect(KJV_FLOW.includes('Be thou diligent to know the state of thy flock')).toBe(true); // substring of the plural — see below
    expect(KJV_FLOW.includes('Boast not thyself of to morrow')).toBe(true);
    expect(KJV_FLOW.includes('Boast not thyself of tomorrow')).toBe(false);   // the KJV spells it as two words
    expect(KJV_FLOW.includes('And patience, experience; and experience, hope')).toBe(true);
    expect(KJV_FLOW.includes('And patience experience; and experience, hope')).toBe(false);
    expect(KJV_FLOW.includes('Except the LORD build the house, they labour in vain that build it')).toBe(true);
    expect(KJV_FLOW.includes('Except the LORD builds the house, they labour in vain that build it')).toBe(false);
  });
});

describe('our own authored voice says Yahweh, not the generic name (DR-0210)', () => {
  it('names Him by His covenant name in every band and every note', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(2);
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
      expect(level(band).length, `${band} is missing or a stub`).toBeGreaterThan(2500);
    }
  });

  it('every band carries all seventeen movements, not a subset', () => {
    const EVERY_BAND = [
      'we glory in tribulations also: knowing that tribulation worketh patience',  // 1 hard times
      'count it all joy when ye fall into divers temptations',
      'the trying of your faith worketh patience',
      'Be thou diligent to know the state of thy flocks, and look well to thy herds',  // 2 the flock
      'had understanding of the times, to know what Israel ought to do',
      'I am made all things to all men, that I might by all means save some',     // 3 meet them there
      'I am the good shepherd, and know my sheep, and am known of mine',
      'Not forsaking the assembling of ourselves together, as the manner of some is; but exhorting one another',  // 4 presence
      'Seest thou a man diligent in his business? he shall stand before kings',   // 5 diligence as worship
      'The hand of the diligent shall bear rule',
      'And whatsoever ye do, do it heartily, as to the Lord, and not unto men',
      'Labour not to be rich: cease from thine own wisdom.',                      // 6 not the hype
      'make themselves wings',
      'nor trust in uncertain riches, but in the living God, who giveth us richly all things to enjoy',
      'Boast not thyself of to morrow; for thou knowest not what a day may bring forth.',
      'Except the LORD build the house, they labour in vain that build it',       // 7 build on Yahweh
      'Commit thy works unto the LORD, and thy thoughts shall be established.',
    ];
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      for (const frag of EVERY_BAND) expect(t, `${band} lost: ${frag}`).toContain(frag);
    }
  });

  it('every band keeps the ORDER of the Romans 5 chain, which is the instruction', () => {
    // Tribulation does not yield hope directly. Naming the chain without its
    // order loses the only thing that explains why people quit in the middle.
    //
    // THIS CHECK WAS TOO WEAK ON ITS FIRST WRITING, and its own break test is
    // what exposed it. It asserted only the DISCLAIMER ("does not produce hope
    // directly") and the quit-in-the-middle consequence. Deleting the sentence
    // that actually walks the sequence left the suite green, because the
    // disclaimer survived -- so the check was testing a label rather than the
    // teaching. Worse, the chain words all appear inside the Romans 5:3-4
    // quotation itself, so any naive search finds them whether or not WE ever
    // explain the order. The fix: strip every quoted span first, then require
    // the ordered chain in OUR OWN prose.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      const { spans } = quotedSpans(t);
      let ours = t.replace(/\\'/g, "'");
      for (const s of spans) ours = ours.split(`"${s}"`).join(' § ');
      expect(ours, `${band} never walks the chain in our own words`)
        .toMatch(/patience[^§]{0,160}experience[^§]{0,160}hope/i);
      expect(t, `${band} lost that hope does not come first`)
        .toMatch(/not hand you hope|does not hand you hope|does not yield hope directly|does not produce hope directly/i);
      expect(t, `${band} lost why people quit in the middle`).toMatch(/quit in the middle|abandon the process in the middle/i);
    }
  });

  it('every band keeps reading-the-times DISTINCT from trend-chasing', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} blurred discernment into trend-chasing`)
        .toMatch(/not copying whatever is popular|not trend-chasing|difference from trend-chasing|Trend-chasing/i);
    }
  });

  it('every band keeps meeting-people-where-they-are DISTINCT from compromise', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost the compromise boundary`)
        .toMatch(/not giving up what is right|not compromise/i);
      expect(level(band), `${band} lost what makes it not compromise`).toMatch(/useful to them|use to them/i);
    }
  });

  it('every band holds BOTH halves of the money teaching (DR-0100)', () => {
    // Under-claiming is as much a failure of truth as over-claiming. The beat
    // is real and is said to be real; earning is not treated as sin; and the
    // crowd's verdict is still refused as a foundation.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lost that the good report is real`).toMatch(/the beat is real|is real and we are glad/i);
      expect(t, `${band} lost that tomorrow is His`).toMatch(/tomorrow (still )?(belongs to Him|is His)/i);
    }
    for (const band of ['teen', 'senior']) {
      expect(level(band), `${band} lost that earning is not being called wrong`)
        .toMatch(/earning is (not )?(wrong|illegitimate)/i);
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // SEVENTEENTH consecutive lesson in this pass whose senior band handed the
    // reader the teacher's clipboard. It opened "Teach this the..." and
    // instructed the teacher rather than addressing the reader.
    const senior = level('senior');
    expect(senior).not.toMatch(/senior: 'Teach /);
    expect(senior).not.toMatch(/\bTeach this\b/);
    expect(senior).not.toMatch(/\bClose on\b/);
    expect(senior).not.toMatch(/\bL\d{2,3}\b/);
    expect(senior).not.toMatch(/\bDR-\d{4}\b/);
    expect(l, 'the facilitator notes must still exist somewhere').toContain('discussionPrompts');
  });

  it('the senior band speaks to the years rather than ignoring them', () => {
    // Removing the teacher's instructions does not by itself address anyone.
    // Each movement is turned toward a reader who has the decades: the Romans 5
    // chain is the one thing a long life can VERIFY, the compromise boundary
    // has a mirror-image failure that long conviction invites, and gathering is
    // read as a service rendered rather than a benefit collected.
    const senior = level('senior');
    expect(senior, 'the chain is verifiable from a long life').toMatch(/positioned to verify/i);
    expect(senior, 'the mirror-image of compromise is named').toMatch(/mirror image/i);
    expect(senior, 'gathering read as a service rendered').toMatch(/service rendered/i);
    expect(senior, 'and work for Him does not lose value with a smaller audience')
      .toMatch(/fewer people are watching/i);
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Proverbs', 27, 23)).toBe('Be thou diligent to know the state of thy flocks, and look well to thy herds.');
    expect(verse('1Corinthians', 9, 22)).toContain('I am made all things to all men, that I might by all means save some');
    expect(verse('John', 10, 14)).toBe('I am the good shepherd, and know my sheep, and am known of mine.');
    expect(verse('Proverbs', 23, 5)).toContain('riches certainly make themselves wings; they fly away as an eagle toward heaven');
    expect(verse('Proverbs', 22, 29)).toContain('he shall stand before kings');
    expect(verse('Hebrews', 10, 25)).toContain('Not forsaking the assembling of ourselves together');
    expect(verse('Psalms', 127, 1)).toContain('Except the LORD build the house, they labour in vain that build it');
    expect(verse('Colossians', 3, 23)).toBe('And whatsoever ye do, do it heartily, as to the Lord, and not unto men;');
    expect(verse('Proverbs', 16, 3)).toBe('Commit thy works unto the LORD, and thy thoughts shall be established.');
  });
});
