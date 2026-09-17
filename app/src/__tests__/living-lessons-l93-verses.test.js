// =============================================================================
// L93 — Come, Let Us Reason (truth in any language, the mind rewired): verbatim KJV
// =============================================================================
// Darrell 2026-08-28 (spoken into the app): "How does Yahweh like to reason? He
// says come let us do that... All the various languages changed however the
// meaning of the Word is what I'm want to clarify... Truth is truth in any
// language... electricity is electricity in any language... Yahweh being Truth
// changes my neuroplasticity because I'm shocked and also Joyful... seems like a
// fantasy... until you keep reading and understanding... then it gets real...
// data driven real." Captured Word-first (the Spoken-Teachings rule + DR-0089).
// Every KJV line was FETCHED from the repo's own KJV this session.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll93-come-let-us-reason-truth-in-any-language-the-mind-rewired-real'");
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

const KJV = {
  'Isaiah 1:18 (fragment)': 'Come now, and let us reason together, saith the LORD',
  'Isaiah 40:8': 'The grass withereth, the flower fadeth: but the word of our God shall stand for ever.',
  'Matthew 24:35': 'Heaven and earth shall pass away, but my words shall not pass away.',
  'Psalms 119:89': 'For ever, O LORD, thy word is settled in heaven.',
  '1 Thessalonians 5:21': 'Prove all things; hold fast that which is good.',
  'Psalms 34:8': 'O taste and see that the LORD is good: blessed is the man that trusteth in him.',
  'John 7:17 (fragment)': 'If any man will do his will, he shall know of the doctrine, whether it be of God',
  'Luke 1:4': 'That thou mightest know the certainty of those things, wherein thou hast been instructed.',
  'Psalms 119:130': 'The entrance of thy words giveth light; it giveth understanding unto the simple.',
  '1 Corinthians 2:16 (fragment)': 'we have the mind of Christ.',
  'John 14:6 (fragment)': 'I am the way, the truth, and the life',
  'Hebrews 13:8': 'Jesus Christ the same yesterday, and to day, and for ever.',
  'Jeremiah 31:3 (fragment)': 'I have loved thee with an everlasting love',
  'Nehemiah 8:10 (fragment)': 'the joy of the LORD is your strength.',
};

const QUOTED_FRAGMENTS = [
  'Come now, and let us reason together, saith the LORD',
  'The grass withereth, the flower fadeth: but the word of our God shall stand for ever.',
  'Heaven and earth shall pass away, but my words shall not pass away.',
  'Thy word is true from the beginning',
  'For ever, O LORD, thy word is settled in heaven.',
  'upholding all things by the word of his power',
  'all things consist',
  'Prove all things; hold fast that which is good.',
  'O taste and see that the LORD is good: blessed is the man that trusteth in him.',
  'If any man will do his will, he shall know of the doctrine, whether it be of God',
  'Then shall we know, if we follow on to know the LORD',
  'Search the scriptures',
  'they are they which testify of me',
  'these are written, that ye might believe that Jesus is the Christ',
  'That thou mightest know the certainty of those things, wherein thou hast been instructed.',
  'The entrance of thy words giveth light; it giveth understanding unto the simple.',
  'be ye transformed by the renewing of your mind',
  'bringing into captivity every thought to the obedience of Christ',
  'we have the mind of Christ.',
  'I am the way, the truth, and the life',
  'the living God, and an everlasting king',
  'God, that cannot lie',
  'Jesus Christ the same yesterday, and to day, and for ever.',
  'I have loved thee with an everlasting love',
  'For God so loved the world, that he gave his only begotten Son',
  'the joy of the LORD is your strength.',
];

// -----------------------------------------------------------------------------
// The corpus, joined as a reader meets it.
// -----------------------------------------------------------------------------
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const KJV_FLOW = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json'))) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;
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

// TWO LEGITIMATE KINDS HERE, AND THE FIRST IS THE LESSON'S OWN HINGE.
// `"believe or else"` is quoted precisely because it is what Yahweh does NOT
// say -- the contrast that makes the invitation of Isaiah 1:18 land. Quoting a
// thing in order to deny it is the same category as L94's `"the Lord of Host"`
// and L97's `"Congressman"`. The child band's `"Come here, let us think it
// through together!"` is our plain-language GLOSS, and the band signposts it as
// one with `that means` immediately before -- the honest form DR-0076 requires
// of a paraphrase. The rest are our own coinages and one science term.
const OUR_OWN_QUOTED = [
  'believe or else', 'believe or else.', 'believe Me or else.', 'COME.',
  'Come here, let us think it through together!',
  'just believe', 'likes to reason', 'too-good-to-be-true',
  'truth is truth in any language', 'electricity in any language',
  'Truth is truth in any language; electricity is electricity in any language.',
  'it seems a fantasy until you study', 'seems a fantasy until you study',
  'neuroplasticity',
];

describe('L93 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Isaiah 1:18; John 7:17; Romans 12:2'", 'benefits:', 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the spoken spine, in order (reason → any language → law → fantasy → data-real → mind → Truth → love)', () => {
    expect(l).toContain('HOW YAHWEH LIKES TO REASON');
    expect(l).toContain('TRUTH IS TRUTH IN ANY LANGUAGE');
    expect(l).toContain('ELECTRICITY IN ANY LANGUAGE');
    expect(l).toContain('THEN IT GETS DATA-DRIVEN REAL');
    expect(l).toContain('neuroplasticity'); // Darrell's word, tied to the renewed mind
    // The discipline note: the meaning is the authority, verbatim translation kept.
    expect(l).toContain('the meaning is too valuable to distort');
    const order = [
      '1) TRUTH IS TRUTH IN ANY LANGUAGE',
      '2) A LAW OF REALITY',
      '3) IT SEEMS LIKE A FANTASY',
      '4) THEN IT GETS DATA-DRIVEN REAL',
      '5) TRUTH REWIRES THE MIND',
      '6) BECAUSE YAHWEH IS TRUTH',
      '7) AND HE ACTUALLY LOVES YOU',
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
    it(`quotes verbatim: "${frag.slice(0, 56)}${frag.length > 56 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
    });
  }
});

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the double quotes are balanced, so the spans below are real quotations', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span is verbatim KJV, or one of the listed non-Scripture spans', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(100);
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

  it('the thing He does NOT say is always marked as such, never left standing', () => {
    // The whole invitation collapses if `believe or else` is ever read as His.
    const level = (name) => {
      const i = l.indexOf(`${name}: '`);
      const j = l.indexOf("',\n", i);
      return l.slice(i, j);
    };
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} must carry the contrast`).toMatch(/believe (Me )?or else/);
      expect(t, `${band} must negate it explicitly`).toMatch(/does not (thunder|just say)/i);
      expect(t, `${band} must carry the invitation itself`)
        .toContain('Come now, and let us reason together, saith the LORD');
    }
  });

  it('the paraphrase in the child band is SIGNPOSTED as a paraphrase (DR-0076)', () => {
    const level = (name) => {
      const i = l.indexOf(`${name}: '`);
      const j = l.indexOf("',\n", i);
      return l.slice(i, j);
    };
    const child = level('child');
    const at = child.indexOf('Come here, let us think it through together');
    expect(at, 'the gloss should be present in the child band').toBeGreaterThan(-1);
    // The characters immediately before it must carry the signpost, so a reader
    // can never mistake our plain-English rendering for the verse's own words.
    expect(child.slice(Math.max(0, at - 60), at), 'the gloss must be marked as a gloss').toMatch(/means/i);
    expect(KJV_FLOW.includes('let us think it through together')).toBe(false);
  });

  it('is PROVEN-TO-CATCH — on this lesson\'s own hinges, each read from the corpus', () => {
    expect(KJV_FLOW.includes('Come now, and let us reason together, saith the LORD')).toBe(true);
    expect(KJV_FLOW.includes('Come now, and let us reason together, saith the LORD,')).toBe(false);
    expect(KJV_FLOW.includes('Prove all things; hold fast that which is good.')).toBe(true);
    expect(KJV_FLOW.includes('Prove all things, hold fast that which is good.')).toBe(false);
    expect(KJV_FLOW.includes('For ever, O LORD, thy word is settled in heaven.')).toBe(true);
    expect(KJV_FLOW.includes('For ever, O LORD, thy word is settled in heaven,')).toBe(false);
    expect(KJV_FLOW.includes('the joy of the LORD is your strength.')).toBe(true);
    expect(KJV_FLOW.includes('the joy of the LORD is my strength.')).toBe(false);
    // Titus 1:2's generic name sits INSIDE the quotation, which is correct: the
    // covenant-name rule governs OUR voice, never a quotation of the Word.
    expect(KJV_FLOW.includes('God, that cannot lie')).toBe(true);
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
      expect(level(band).length, `${band} is missing or a stub`).toBeGreaterThan(3500);
    }
  });

  it('every band carries all the movements, not a subset', () => {
    const EVERY_BAND = [
      'Come now, and let us reason together, saith the LORD: though your sins be as scarlet, they shall be as white as snow',
      'The grass withereth, the flower fadeth: but the word of our God shall stand for ever.',
      'Heaven and earth shall pass away, but my words shall not pass away.',
      'Thy word is true from the beginning: and every one of thy righteous judgments endureth for ever.',
      'For ever, O LORD, thy word is settled in heaven.',
      'upholding all things by the word of his power',
      'all things consist',
      'Prove all things; hold fast that which is good.',
      'O taste and see that the LORD is good: blessed is the man that trusteth in him.',
      'If any man will do his will, he shall know of the doctrine, whether it be of God',
      'Then shall we know, if we follow on to know the LORD',
      'Search the scriptures',
      'they are they which testify of me',
      'these are written, that ye might believe that Jesus is the Christ',
      'thou mightest know the certainty of those things, wherein thou hast been instructed.',
      'The entrance of thy words giveth light; it giveth understanding unto the simple.',
      'be ye transformed by the renewing of your mind',
      'bringing into captivity every thought to the obedience of Christ',
      'we have the mind of Christ.',
      'I am the way, the truth, and the life',
      'the LORD is the true God, he is the living God, and an everlasting king',
      'God, that cannot lie',
      'Jesus Christ the same yesterday, and to day, and for ever.',
      'Yea, I have loved thee with an everlasting love: therefore with lovingkindness have I drawn thee.',
      'For God so loved the world, that he gave his only begotten Son',
      'the joy of the LORD is your strength.',
      'neuroplasticity',
      'scarlet',
    ];
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      for (const frag of EVERY_BAND) expect(t, `${band} lost: ${frag}`).toContain(frag);
    }
  });

  it('every band keeps that invariant meaning DEMANDS accuracy rather than excusing it', () => {
    // This is the sentence a careless reader inverts: if the truth survives any
    // language, why fetch verses verbatim? Because the meaning is too valuable
    // to distort. A band that drops it hands the reader a licence this lesson
    // never grants -- and it would contradict the very discipline the gates in
    // this pass enforce.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lost that verbatim accuracy still binds`)
        .toMatch(/verbatim|word for word/i);
      expect(t, `${band} lost WHY it binds`)
        .toMatch(/too valuable to distort|too precious to bend/i);
    }
  });

  it('every band keeps the experiment ORDER — obedience before certainty', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lost that the doing comes first`)
        .toMatch(/obedience BEFORE certainty|doing comes BEFORE|before the being sure/i);
      expect(t, `${band} lost that the knowing is the result`)
        .toMatch(/the knowing is the promised result|the knowing is what you get/i);
    }
  });

  it('every band reads the shock AND the joy as evidence, not as mood', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lost the old pathway breaking`).toMatch(/old path(way)? breaking/i);
      expect(t, `${band} lost the new pathway forming`).toMatch(/new one (forming|being built)/i);
      expect(t, `${band} lost that both are evidence rather than a passing mood`)
        .toMatch(/rather than a mood passing|not just a feeling passing|rather than a feeling passing/i);
    }
  });

  it('every band keeps the neuroscience UNDER His Word, not beside it', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost that He commanded it first`)
        .toMatch(/before anybody had a name for it|before anybody had a word for it|before the term existed/i);
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // NINETEENTH consecutive lesson in this pass whose senior band handed the
    // reader the teacher's clipboard.
    const senior = level('senior');
    expect(senior).not.toMatch(/senior: 'Teach /);
    expect(senior).not.toMatch(/\bTeach this\b/);
    expect(senior).not.toMatch(/\bClose on\b/);
    expect(senior).not.toMatch(/\bDraw the\b/);
    expect(senior).not.toMatch(/\bL\d{2,3}\b/);
    expect(senior).not.toMatch(/\bDR-\d{4}\b/);
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });

  it('the senior band turns each movement toward a reader who HAS the decades', () => {
    const senior = level('senior');
    expect(senior, 'a long-held translation is reconciled, not corrected')
      .toMatch(/the treasure was never the alphabet/i);
    expect(senior, 'reversed majorities are named as evidence he already holds')
      .toMatch(/confident majorities reverse themselves/i);
    expect(senior, 'the rewiring is documented to continue late in life')
      .toMatch(/late in life/i);
    expect(senior, 'and the pathways are explicitly not sealed').toMatch(/not sealed/i);
    expect(senior, 'the everlasting love has no start date to measure against a record')
      .toMatch(/no start date|had no beginning to earn/i);
    expect(senior, 'and the joy is addressed to diminished strength')
      .toMatch(/less strength of his own/i);
  });
});

describe('tamper-catch — the pinned KJV ground truth is itself exact', () => {
  it('full-verse pins match their known text and endings', () => {
    expect(KJV['Isaiah 40:8']).toBe('The grass withereth, the flower fadeth: but the word of our God shall stand for ever.');
    expect(KJV['1 Thessalonians 5:21']).toBe('Prove all things; hold fast that which is good.');
    expect(KJV['Hebrews 13:8']).toBe('Jesus Christ the same yesterday, and to day, and for ever.');
    expect(KJV['Isaiah 1:18 (fragment)'].startsWith('Come now, and let us reason together')).toBe(true);
    expect(KJV['Psalms 119:89'].endsWith('settled in heaven.')).toBe(true);
    expect(KJV['Nehemiah 8:10 (fragment)']).toContain('joy of the LORD');
  });
});
