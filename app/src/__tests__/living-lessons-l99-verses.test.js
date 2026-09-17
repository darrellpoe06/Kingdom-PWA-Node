// =============================================================================
// L99 — Watch and Be Ready: no date-setting, a sober word on A.I. and prophecy,
// and the blessed hope. Verbatim KJV.
// =============================================================================
// Darrell 2026-08-29 brought a Trackstarz panel (AI, technology, end-time
// prophecy) and said "lesson." Held as teaching, not speculation (DR-0098):
// the day is the Father's alone (Matthew 24:36; Acts 1:7), so prophecy is for
// READINESS, not prediction; readiness is daily faithfulness "found so doing";
// handle the imagery soberly — wonder is allowed, a guess is not a doctrine, do
// not add or take away (2 Peter 1:20; Revelation 22:18-19; Deuteronomy 29:29);
// meet A.I./AGI with a sound mind, not fear (2 Timothy 1:7); neither deceived
// nor troubled (Matthew 24:4,6); live in the blessed hope that purifies (Titus
// 2:13; 1 John 3:3). Every KJV line FETCHED from the repo's own KJV this
// session — a drift fails the build.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll99-watch-and-be-ready-no-date-setting-and-a-sober-word-on-ai-and-prophecy'");
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
  // no man knows the day
  'But of that day and hour knoweth no man, no, not the angels of heaven, but my Father only',
  'no, not the angels which are in heaven, neither the Son, but the Father',
  'It is not for you to know the times or the seasons, which the Father hath put in his own power',
  // prophecy is for readiness
  'Watch therefore: for ye know not what hour your Lord doth come',
  'Therefore be ye also ready: for in such an hour as ye think not the Son of man cometh',
  'Watch therefore, for ye know neither the day nor the hour wherein the Son of man cometh',
  // readiness is daily faithfulness
  'Blessed is that servant, whom his lord when he cometh shall find so doing',
  'Occupy till I come',
  'the wise took oil in their vessels with their lamps',
  'they that were ready went in with him to the marriage: and the door was shut',
  // handle the imagery soberly
  'We have also a more sure word of prophecy',
  'no prophecy of the scripture is of any private interpretation',
  'If any man shall add unto these things',
  'The secret things belong unto the LORD our God',
  // A.I. — sober, not fearful
  'God hath not given us the spirit of fear; but of power, and of love, and of a sound mind',
  'fear not them which kill the body',
  'the beginning of knowledge',
  // not deceived, not troubled
  'Take heed that no man deceive you',
  'see that ye be not troubled: for all these things must come to pass, but the end is not yet',
  // the blessed hope
  'Looking for that blessed hope, and the glorious appearing of the great God and our Saviour Jesus Christ',
  'every man that hath this hope in him purifieth himself, even as he is pure',
  'Surely I come quickly',
  'let us watch and be sober',
];

describe('L99 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Matthew 24:36; Matthew 24:44; Titus 2:13'", 'benefits:', 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — seven movements + THE WHOLE OF IT', () => {
    const order = [
      '1) NO MAN KNOWS THE DAY',
      '2) THE POINT OF PROPHECY IS READINESS',
      '3) READINESS IS DAILY FAITHFULNESS',
      '4) HANDLE PROPHETIC IMAGERY SOBERLY',
      '5) A.I. IN THE PICTURE',
      '6) DO NOT BE DECEIVED, AND DO NOT BE TROUBLED',
      '7) THE BLESSED HOPE',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('holds it as teaching not speculation (DR-0098) and ties to the source occasion', () => {
    expect(l).toContain('DR-0098');
    expect(l).toContain('Trackstarz');
    // the panel's own core takeaway, folded in
    expect(l).toContain('stay ready so you do not have to get ready');
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
  it('child, teen, and senior each carry no-date-setting and be-ready threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries no man knows the day`).toContain('knoweth no man');
      expect(t, `${band} carries be ready`).toMatch(/be ye also ready|be READY|be ready/);
    }
    // teen and senior additionally carry the do-not-force-the-text tier and the sound-mind answer.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('no prophecy of the scripture is of any private interpretation');
      expect(t).toContain('a sound mind');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Matthew', 24, 36)).toBe('But of that day and hour knoweth no man, no, not the angels of heaven, but my Father only.');
    expect(verse('Acts', 1, 7)).toBe('And he said unto them, It is not for you to know the times or the seasons, which the Father hath put in his own power.');
    expect(verse('Matthew', 24, 44)).toBe('Therefore be ye also ready: for in such an hour as ye think not the Son of man cometh.');
    expect(verse('Matthew', 24, 46)).toContain('Blessed is that servant, whom his lord when he cometh shall find so doing');
    expect(verse('2Peter', 1, 20)).toBe('Knowing this first, that no prophecy of the scripture is of any private interpretation.');
    expect(verse('Deuteronomy', 29, 29)).toContain('The secret things belong unto the LORD our God');
    expect(verse('2Timothy', 1, 7)).toBe('For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.');
    expect(verse('Proverbs', 1, 7)).toContain('The fear of the LORD is the beginning of knowledge');
    expect(verse('Titus', 2, 13)).toBe('Looking for that blessed hope, and the glorious appearing of the great God and our Saviour Jesus Christ;');
    expect(verse('1John', 3, 3)).toContain('every man that hath this hope in him purifieth himself, even as he is pure');
    expect(verse('1Thessalonians', 5, 6)).toContain('let us watch and be sober');
  });
});

// =============================================================================
// THE CHECKS THIS GATE DID NOT HAVE (added 2026-09-17, DR-0418 pass)
// =============================================================================
// Carried from L111 down through L100 the same day. THIS LESSON PRODUCED THE
// LARGEST AND MOST CONSEQUENTIAL FIND OF THE PASS, and it was not an altered
// quotation at all — it was our own phrase presented AS Scripture, six times.
//
// `"found so doing"` appeared in quotation marks in six places (inApp, a
// benefit, a quiz explanation, two facilitator fields and a discussion
// prompt) and in EVERY case a verse reference stood immediately beside it:
// `"found so doing" (Matthew 24:46)`. The KJV does not say that. It says
// `shall find so doing` — and the adult body of this same lesson quotes
// Matthew 24:45-46 correctly. So a reader met quotation marks, a phrase, and
// a chapter-and-verse citation, and drew the only reasonable conclusion: that
// they were reading Matthew 24:46. They were reading our participial
// recasting of it, one word off.
//
// That is the L108 class at its worst. L108 had ONE phrase of our own wearing
// marks beside references; this had six, and unlike L108's the phrase is a
// near-miss of a real verse, which makes it far more likely to be believed
// and repeated. The fix is L108's: the marks come off and the phrase stays as
// ours, with the reference left as the honest allusion pointer it always was.
//
// Two genuine in-quote alterations came with it, both punctuation:
//   - Titus 2:13 in `anchor.theme` closed with a full stop where the KJV
//     carries a SEMICOLON and continues ("...Jesus Christ; Who gave himself
//     for us..."). Truncated to the verbatim clause with no terminal mark —
//     the same fix L101's Malachi 3:6 took.
//   - Revelation 22:20 in a quiz option closed with a COMMA where the KJV
//     carries a full stop. A third punctuation variant, and the mirror of the
//     L101 case: there a period was borrowed, here a period was replaced.
//
// Running total for the pass: TWELVE in-quote alterations of the Word, in
// three punctuation/typography classes (eight ASCII apostrophes, two borrowed
// full stops, one swapped-out full stop), PLUS six instances of our own
// phrase falsely attributed. The second category is the more dangerous of the
// two, because a gate that only compares quoted spans to the corpus catches
// it only when the phrase is not ALSO a corpus substring.
//
// AND THAT LIMIT IS REAL, SO IT IS NAMED RATHER THAN GLOSSED. This check
// compares each quoted span against the corpus as a SUBSTRING. A short, common
// quoted word will therefore always pass — this lesson quotes the single words
// `"when"` and `"watch"` in our own prose ("He turns every when into a watch")
// and both are corpus substrings by coincidence, not by verification. The same
// coincidence is what made `"some say"` pass in L100's draft allowlist. The
// check is strong on quotations of any length and weak on one-word quotations;
// a version that required a span to match a verse BOUNDARY, not merely appear
// somewhere in the corpus, would close that. re-review: 2026-10-08.
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

// OUR OWN QUOTED TERMS AND REPORTED REFLEXES (the L100 category 3).
// The inApp block quotes the two reflexes this subject provokes in order to
// TEST both against the Word rather than endorse either, and one discussion
// prompt quotes our own one-line summary of Deuteronomy 29:29. None of the
// three sits beside a verse reference pretending to BE that verse, which is
// the line `found so doing` crossed.
const OUR_OWN_QUOTED = [
  'this A.I. news means it is THIS year',    // reflex one, quoted to be TESTED
  'the machines, the end, it is hopeless',   // reflex two, quoted to be TESTED
  'teach the revealed, leave the secret',    // our summary of Deuteronomy 29:29
];

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the double quotes are balanced, so the spans below are real quotations', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span is verbatim KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(100);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
        if (OUR_OWN_QUOTED.includes(part)) continue;   // a reflex or our own summary, not a verse
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

  it('OUR OWN PHRASE never wears quotation marks beside a verse reference', () => {
    // The six-site defect this commit fixed, pinned so it cannot return. The
    // phrase itself is fine and still in the lesson — it is the MARKS that
    // made it a false quotation.
    expect(l, 'our recasting must not be quoted as though it were the verse')
      .not.toContain('"found so doing"');
    expect(l, 'the phrase itself stays, as ours').toContain('found so doing');
    // And the verse it was misquoting must still be present, verbatim:
    expect(l).toContain('Blessed is that servant, whom his lord when he cometh shall find so doing.');
  });

  it('is PROVEN-TO-CATCH — on all three punctuation classes this pass has found', () => {
    // The two this lesson actually shipped:
    expect(KJV_FLOW.includes('our Saviour Jesus Christ;')).toBe(true);
    expect(KJV_FLOW.includes('our Saviour Jesus Christ.')).toBe(false);
    expect(KJV_FLOW.includes('Even so, come, Lord Jesus.')).toBe(true);
    expect(KJV_FLOW.includes('Even so, come, Lord Jesus,')).toBe(false);
    // The apostrophe class (eight found elsewhere in the pass):
    expect(KJV_FLOW.includes('Judah is a lion’s whelp')).toBe(true);
    expect(KJV_FLOW.includes("Judah is a lion's whelp")).toBe(false);
    // The borrowed full stop (L101):
    expect(KJV_FLOW.includes('For I am the LORD, I change not;')).toBe(true);
    expect(KJV_FLOW.includes('For I am the LORD, I change not.')).toBe(false);
    // And the near-miss that started this lesson's finding:
    expect(KJV_FLOW.includes('shall find so doing')).toBe(true);
    expect(KJV_FLOW.includes('found so doing')).toBe(false);
    // Drifts of this lesson's own hinges, each reading perfectly:
    expect(KJV_FLOW.includes('knoweth no man, no, not the angels of heaven, but my Father only')).toBe(true);
    expect(KJV_FLOW.includes('knoweth no man, not even the angels of heaven, but my Father only')).toBe(false);
    expect(KJV_FLOW.includes('It is not for you to know the times or the seasons')).toBe(true);
    expect(KJV_FLOW.includes('It is not for us to know the times or the seasons')).toBe(false);
    expect(KJV_FLOW.includes('no prophecy of the scripture is of any private interpretation')).toBe(true);
    expect(KJV_FLOW.includes('no prophecy of the scripture is of any private interpretations')).toBe(false);
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
      expect(level(band).length, `${band} is missing or a stub`).toBeGreaterThan(3000);
    }
  });

  it('every band carries all seven movements, not a subset', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries no-man-knows`).toContain('knoweth no man, no, not the angels of heaven, but my Father only');
      expect(t, `${band} carries the times and seasons`).toContain('It is not for you to know the times or the seasons');
      expect(t, `${band} carries be-ye-also-ready`).toContain('Therefore be ye also ready');
      expect(t, `${band} carries the undramatic ready servant`).toContain('shall find so doing');
      expect(t, `${band} carries occupy till I come`).toContain('Occupy till I come');
      expect(t, `${band} carries abide`).toContain('Abide in me, and I in you');
      expect(t, `${band} carries the oil`).toContain('But the wise took oil in their vessels with their lamps');
      expect(t, `${band} carries no-private-interpretation`).toContain('no prophecy of the scripture is of any private interpretation');
      expect(t, `${band} carries the secret things`).toContain('The secret things belong unto the LORD our God');
      expect(t, `${band} carries the sound mind`).toContain('of power, and of love, and of a sound mind');
      expect(t, `${band} carries fear the right One`).toContain('rather fear him which is able to destroy both soul and body');
      expect(t, `${band} carries be-not-deceived`).toContain('Take heed that no man deceive you');
      expect(t, `${band} carries be-not-troubled`).toContain('be not troubled');
      expect(t, `${band} carries the blessed hope`).toContain('Looking for that blessed hope');
      expect(t, `${band} carries the hope that purifies`).toContain('purifieth himself, even as he is pure');
      expect(t, `${band} carries the last word`).toContain('Even so, come, Lord Jesus.');
    }
  });

  it('every band says the closed door is a DOOR, not a caution', () => {
    // The inference is the movement: if the Son in His earthly ministry did
    // not name the day, then no chart, headline or A.I. milestone does. A band
    // that quoted Matthew 24:36 and stopped would leave date-setting merely
    // discouraged rather than foreclosed.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost the closed door`).toMatch(/closed door|door that is closed/i);
      expect(level(band), `${band} lost what the closed door rules out`)
        .toMatch(/no chart|No chart|no chart says it/i);
    }
  });

  it('every band keeps readiness UNDRAMATIC, and the stay-ready line', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} made readiness dramatic`)
        .toMatch(/undramatic|not doing anything dramatic|nothing dramatic|not exciting|regular job|unremarkable/i);
      expect(level(band), `${band} lost stay-ready-so-you-do-not-have-to-get-ready`)
        .toMatch(/stay ready so you (do not|never) have to get ready|Stay ready, and then you never have to GET ready/i);
    }
  });

  it('every band holds BOTH halves on the imagery — wonder is allowed, doctrine is not', () => {
    // This is the DR-0098 move: name the question in order to teach past it.
    // A band that dropped the first half would forbid honest curiosity; one
    // that dropped the second would license speculation as teaching.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost that wondering is allowed`)
        .toMatch(/wrong to WONDER|okay to wonder|interesting thing to wonder/i);
      expect(level(band), `${band} lost that a guess is not a doctrine`)
        .toMatch(/guess into a doctrine|guess into a rule/i);
    }
  });

  it('every band names the end-time danger as a WORSHIP, not a machine', () => {
    // The sharpest observation in the lesson, and the one a compressed band
    // would drop because it is an aside rather than a verse: every apocalyptic
    // crisis is described as a question of who is worshipped. Drop it and the
    // lesson becomes a lesson about technology.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost that the danger is a worship`)
        .toMatch(/not a machine|not a MACHINE/i);
      expect(level(band), `${band} lost the allegiance framing`)
        .toMatch(/WORSHIP|allegiance|bow to it/i);
    }
  });

  it('every band keeps BOTH of the two paired commands', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost that most people manage only one`)
        .toMatch(/only one of them|usually only do one|people usually only do one/i);
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // THIRTEENTH consecutive lesson in this pass whose senior band handed the
    // reader the teacher's clipboard. It opened "Teach this as sober
    // eschatology meeting a viral tech-prophecy conversation (with L23, The
    // Blessed Hope, and the Sovereign A.I. course)" and closed on "CLOSE:".
    // It also named a specific show as the panel's source; the reader's band
    // keeps the panel generic, exactly as the adult body does, rather than
    // carrying an attribution this lesson does not verify.
    const senior = level('senior');
    expect(senior).not.toContain('Teach this as sober eschatology');
    expect(senior).not.toContain('Trackstarz');
    expect(senior).not.toMatch(/\bL\d{1,3}\b/);
    expect(senior).not.toMatch(/\bDR-\d{4}\b/);
    expect(senior).not.toContain('CLOSE:');
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });
});
