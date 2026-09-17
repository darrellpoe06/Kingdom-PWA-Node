// =============================================================================
// L103 — His Kings: reigning under the King of Kings — two paths, wealth Yahweh's
// Way not confusion, winning souls through excellence, and skill from His Word.
// Verbatim KJV.
// =============================================================================
// Captured from Darrell's spoken teaching 2026-08-29, flowing straight out of
// L102 (Bold as a Lion) — a spoken teaching is build input (DR-0089). His kings
// are bold and HIS (received, not self-made); two paths, and the tell of which
// king rules you is obedience, not the word "Lord"; you cannot be His king unless
// born again and serving; the King of Kings we worship; life and death in the
// tongue; wealth Yahweh's Way not confusion; win souls through excellence; the
// necessary skill drawn from His Word comprehensively studied; the destination
// already written. Every KJV line FETCHED from the repo's own KJV this session; a
// drift fails the build. Pairs with L102, the Excellence Standard, the Test.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll103-his-kings-reigning-under-the-king-of-kings-two-paths-wealth-and-souls'");
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
  'And hath made us kings and priests unto God and his Father',            // Rev 1:6
  'a chosen generation, a royal priesthood, an holy nation',               // 1 Pet 2:9
  'wide is the gate, and broad is the way, that leadeth to destruction',   // Matt 7:13
  'narrow is the way, which leadeth unto life, and few there be that find it', // Matt 7:14
  'And why call ye me, Lord, Lord, and do not the things which I say',      // Luke 6:46
  'choose you this day whom ye will serve',                                // Josh 24:15
  'Except a man be born again, he cannot see the kingdom of God',           // John 3:3
  'confess with thy mouth the Lord Jesus',                                 // Rom 10:9
  'whosoever will be chief among you, let him be your servant',             // Matt 20:27
  'and we shall reign on the earth',                                       // Rev 5:10
  'KING OF KINGS, AND LORD OF LORDS',                                       // Rev 19:16
  'cast their crowns before the throne',                                   // Rev 4:10
  'Death and life are in the power of the tongue',                          // Prov 18:21
  'For by thy words thou shalt be justified, and by thy words thou shalt be condemned', // Matt 12:37
  'it is he that giveth thee power to get wealth',                          // Deut 8:18
  'God is not the author of confusion, but of peace',                      // 1 Cor 14:33
  'The blessing of the LORD, it maketh rich, and he addeth no sorrow with it', // Prov 10:22
  'he that winneth souls is wise',                                         // Prov 11:30
  'because an excellent spirit was in him',                                // Dan 6:3
  'do it heartily, as to the Lord, and not unto men',                      // Col 3:23
  'we are ambassadors for Christ',                                        // 2 Cor 5:20
  'I am the way, the truth, and the life',                                 // John 14:6
  'rightly dividing the word of truth',                                    // 2 Tim 2:15
  'searched the scriptures daily, whether those things were so',           // Acts 17:11
  'All scripture is given by inspiration of God',                          // 2 Tim 3:16
  'Declaring the end from the beginning',                                  // Isa 46:10
  'my reward is with me, to give every man according as his work shall be', // Rev 22:12
];

describe('L103 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Revelation 1:6; Matthew 7:13-14; Deuteronomy 8:18'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — nine movements + THE WHOLE OF IT', () => {
    const order = [
      '1) HIS KINGS ARE BOLD',
      '2) TWO PATHS',
      '3) YOU CANNOT BE HIS KING UNLESS',
      '4) THE KING OF KINGS',
      '5) LIFE AND DEATH IN THE POWER OF THE TONGUE',
      '6) CREATING WEALTH IS THE GOAL',
      '7) WINNING SOULS',
      '8) THE NECESSARY SKILL',
      '9) THE DESTINATION IS ALREADY WRITTEN',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('carries the distinctive teaching threads Darrell brought (bridged from L102)', () => {
    expect(l).toContain('Darrell brought');
    expect(l).toContain('L102');
    expect(l).toContain('not confusion');   // "wealth Yahweh's Way, not confusion"
    expect(l).toContain('excellence');
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
  it('child, teen, and senior each carry the two-paths and His-kings threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the narrow way`).toContain('narrow is the way, which leadeth unto life');
      expect(t, `${band} carries kings and priests`).toMatch(/kings and priests|King of kings|KING OF KINGS/);
    }
    // teen and senior additionally carry the "unless" (new birth) and wealth-Yahweh's-way.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('Except a man be born again');
      expect(t).toContain('power to get wealth');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Revelation', 1, 6)).toContain('And hath made us kings and priests unto God and his Father');
    expect(verse('Matthew', 7, 14)).toBe('Because strait is the gate, and narrow is the way, which leadeth unto life, and few there be that find it.');
    expect(verse('Luke', 6, 46)).toBe('And why call ye me, Lord, Lord, and do not the things which I say?');
    expect(verse('John', 3, 3)).toContain('Except a man be born again, he cannot see the kingdom of God');
    expect(verse('Matthew', 20, 27)).toBe('And whosoever will be chief among you, let him be your servant:');
    expect(verse('Deuteronomy', 8, 18)).toContain('it is he that giveth thee power to get wealth');
    expect(verse('1Corinthians', 14, 33)).toContain('God is not the author of confusion, but of peace');
    expect(verse('Proverbs', 11, 30)).toBe('The fruit of the righteous is a tree of life; and he that winneth souls is wise.');
    expect(verse('Proverbs', 18, 21)).toBe('Death and life are in the power of the tongue: and they that love it shall eat the fruit thereof.');
    expect(verse('John', 14, 6)).toContain('I am the way, the truth, and the life');
    expect(verse('2Timothy', 2, 15)).toContain('rightly dividing the word of truth');
    expect(verse('Isaiah', 46, 10)).toContain('Declaring the end from the beginning');
  });
});

// =============================================================================
// THE TWO CHECKS THIS GATE DID NOT HAVE (added 2026-09-17, DR-0418 pass)
// =============================================================================
// Carried from L111 down through L104 the same day. The module's quotations
// arrived clean; the voice check found the generic name in two places, both
// in bands rewritten anyway.
//
// The span checker also caught ME before the apply, for the second time in
// this pass: the new teen and senior bands were written with `Christ's stead`
// where 2 Corinthians 5:20 carries `Christ’s`. Typed rather than pasted —
// the same mechanism as L106's Galatians 5:24 — and it never reached the file.
// Running the checker on the DRAFTS, not only on the applied module, is what
// makes that cheap.
//
// The corpus is joined with each chapter's VERSES FLOWING (space-separated
// within a chapter), so a quotation of contiguous verses — 2 Timothy 3:16-17
// is quoted whole here — is a true substring, while a phrase stitched from
// two chapters still is not.
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

// DARRELL'S OWN WORDS ARE QUOTED HERE, AND THEY STAY QUOTED.
// ---------------------------------------------------------------------------
// This lesson was captured from what he said on 2026-08-29, and `bigIdea` and
// the facilitator notes quote him directly. Those are real quotations of a
// real person — the source the lesson was built from — so the quotation marks
// are correct and removing them would erase the attribution (DR-0331: his
// words are rendered for meaning, and quoted). They are named here one by one
// so the span gate can tell a quoted SPEAKER from a quoted VERSE, rather than
// being loosened for both. This is the L111 pattern (that lesson quotes the
// reporting it answers), and the opposite of L108's, where a phrase of OUR
// OWN wore quotation marks beside verse references and had them removed.
const DARRELL_QUOTED = [
  'Kings are also bold',
  'His kings',
  'creating wealth is the goal, not confusion',
  "Yahweh's Way",
  'winning souls, because souls respect excellence, and we kings respect The Living Yahweh',
  "King of kings - can't be His king unless",
  '? Two paths: how to know whose king is your King, or are you your own king - destination already written in the biblical scriptures',
  'necessary skill from His Way, Truth, Light, Life, Father - psychological actions data-driven inside His Word',
  'comprehensive understanding evaluation of the scriptures',
  'life and death in the power of the tongue.',
  "can't be His king unless",
  'Whose king is your King - or are you your own?',
];

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the double quotes are balanced, so the spans below are real quotations', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span is verbatim KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(150);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
        if (DARRELL_QUOTED.includes(part)) continue;   // a quoted speaker, not a quoted verse
        if (!KJV_FLOW.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH — including the apostrophe caught in this lesson\'s own drafts', () => {
    expect(KJV_FLOW.includes('we pray you in Christ\u2019s stead')).toBe(true);
    expect(KJV_FLOW.includes("we pray you in Christ's stead")).toBe(false);
    // Drifts of this lesson's own hinges, each reading perfectly:
    expect(KJV_FLOW.includes('he that winneth souls is wise')).toBe(true);
    expect(KJV_FLOW.includes('he that winneth souls is blessed')).toBe(false);
    expect(KJV_FLOW.includes('it maketh rich, and he addeth no sorrow with it')).toBe(true);
    expect(KJV_FLOW.includes('it maketh rich, and addeth no sorrow with it')).toBe(false);
    expect(KJV_FLOW.includes('because an excellent spirit was in him')).toBe(true);
    expect(KJV_FLOW.includes('because an excellent spirit was upon him')).toBe(false);
  });
});

describe('our own authored voice says Yahweh, not the generic name (DR-0210)', () => {
  it('names Him by His covenant name in every band and every note', () => {
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
      expect(level(band).length, `${band} is missing or a stub`).toBeGreaterThan(1700);
    }
  });

  it('every band carries all nine movements, not a subset', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} says HE made us kings`).toContain('made us kings and priests');
      expect(t, `${band} carries the broad way`).toContain('broad is the way, that leadeth to destruction');
      expect(t, `${band} carries the narrow way`).toContain('narrow is the way, which leadeth unto life');
      expect(t, `${band} carries the Lord-Lord test`).toContain('why call ye me, Lord, Lord');
      expect(t, `${band} carries the new-birth unless`).toContain('Except a man be born again');
      expect(t, `${band} carries confessing Him Lord`).toContain('confess with thy mouth the Lord Jesus');
      expect(t, `${band} carries serve-before-reign`).toContain('let him be your minister');
      expect(t, `${band} names the KING OF KINGS`).toContain('KING OF KINGS, AND LORD OF LORDS');
      expect(t, `${band} carries the crowns cast down`).toContain('cast their crowns before the throne');
      expect(t, `${band} carries life and death in the tongue`).toContain('Death and life are in the power of the tongue');
      expect(t, `${band} carries wealth under covenant`).toContain('giveth thee power to get wealth');
      expect(t, `${band} carries the blessing with no sorrow`).toContain('he addeth no sorrow with it');
      expect(t, `${band} carries winning souls`).toContain('winneth souls is wise');
      expect(t, `${band} carries Daniel's excellent spirit`).toContain('an excellent spirit was in him');
      expect(t, `${band} carries the skill rightly divided`).toContain('rightly dividing the word of truth');
      expect(t, `${band} carries the written end`).toContain('Declaring the end from the beginning');
    }
  });

  it('every band keeps the edge: being your own king IS the broad way', () => {
    // The observation that gives this lesson its bite rather than merely its
    // correctness — it does not FEEL like rebellion, it feels like
    // independence. A band that dropped it would flatter the reader.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost the broad-way edge`)
        .toMatch(/own king IS the broad way|own boss IS the wide road|being your own/i);
      expect(level(band), `${band} lost why the broad way is comfortable`)
        .toMatch(/feels like independence|feels like being free/i);
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // It was the notes: "Teach as the kingship sequel to L102 (His kings are
    // bold), tied to the Excellence Standard (representatives of the King)".
    const senior = level('senior');
    expect(senior).not.toContain('Teach as the kingship sequel');
    expect(senior).not.toMatch(/\bL10[0-9]\b/);
    expect(senior).not.toContain('Excellence Standard');
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });
});

describe('his own words stay in the lesson, and stay attributed', () => {
  it('the capture line and every quoted phrase of his are present', () => {
    // Unescape first: an apostrophe inside a JS single-quoted string is
    // stored as \\' in the source, so "Yahweh's Way" is only findable once
    // the escaping is undone — the same normalisation quotedSpans() does.
    const text = l.replace(/\\'/g, "'");
    expect(text).toContain('Darrell brought the word (2026-08-29)');
    for (const q of DARRELL_QUOTED) {
      expect(text, `Darrell's quoted words went missing: ${q}`).toContain(q);
    }
  });

  it('a verse quotation can never hide behind that allowlist', () => {
    // Every entry is his speech. None of them is Scripture, so none of them
    // may appear in the corpus — if one ever did, the allowlist would be
    // excusing a real quotation from the gate.
    for (const q of DARRELL_QUOTED) {
      expect(KJV_FLOW.includes(q), `allowlisted phrase IS Scripture: ${q}`).toBe(false);
    }
  });
});
