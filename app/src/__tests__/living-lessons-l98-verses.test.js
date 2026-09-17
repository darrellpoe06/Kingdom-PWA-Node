// =============================================================================
// L98 — The Judge of All the Earth: equal justice, real partiality named, and a
// just weight for the numbers. Verbatim KJV.
// =============================================================================
// Darrell 2026-08-29 brought a sentencing-disparity reel (Willie D Live / Danny
// Collins) and said "research then lesson," asking specifically about the 19th
// Judicial Circuit and the statistics. Researched and held in two tiers
// (DR-0076/DR-0100): Tier 1 — the documented disparity is real and named as sin
// (USSC ~13-20%; the verified Legleitner/Lloyd case: same judge, same 138.2
// points, 26 years vs time served); Tier 2 — the "4.5-6.5x" overshoots the
// average, "only difference was race" omits the cited cooperation context,
// Danny Collins is the commentator, and #NolanWells is a separate case. Word
// first, non-partisan. Every KJV line FETCHED from the repo's own KJV this
// session — a drift fails the build (this catalog's KJV reads "honor," not
// "honour," in Leviticus 19:15; the lesson matches the corpus).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll98-the-just-judge-equal-justice-and-a-just-weight-for-the-numbers'");
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
  // the Just Judge
  'Shall not the Judge of all the earth do right?',
  'he shall judge the world in righteousness',
  'there is no respect of persons with God',
  // the law for every bench
  'thou shalt not respect the person of the poor, nor honor the person of the mighty',
  'ye shall hear the small as well as the great',
  'a gift doth blind the eyes of the wise',
  // partiality is sin, named
  'It is not good to have respect of persons in judgment',
  'He that justifieth the wicked, and he that condemneth the just, even they both are abomination to the LORD',
  'God is no respecter of persons',
  // a just weight for the numbers
  'He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him',
  'Prove all things; hold fast that which is good.',
  'Thou shalt not raise a false report',
  // plead the cause
  'Open thy mouth for the dumb in the cause of all such as are appointed to destruction',
  'plead the cause of the poor and needy',
  'seek judgment, relieve the oppressed',
  'Defend the poor and fatherless: do justice to the afflicted and needy',
  'let judgment run down as waters, and righteousness as a mighty stream',
  'to do justly, and to love mercy, and to walk humbly with thy God',
  // not vengeance, one blood
  'avenge not yourselves',
  'Be not overcome of evil, but overcome evil with good',
  'hath made of one blood all nations of men',
  'The heart is deceitful above all things',
  // the final court
  'he judgeth among the gods',
  'God shall bring every work into judgment, with every secret thing',
];

describe('L98 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Genesis 18:25; Leviticus 19:15; 1 Thessalonians 5:21'", 'benefits:', 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — seven movements + THE WHOLE OF IT', () => {
    const order = [
      '1) GOD IS THE JUST JUDGE',
      '2) HIS LAW COMMANDS EQUAL JUSTICE',
      '3) WHERE PARTIALITY IS REAL, IT IS SIN',
      '4) A JUST WEIGHT FOR THE NUMBERS TOO',
      '5) PLEAD THE CAUSE',
      '6) NOT VENGEANCE',
      '7) THE FINAL COURT',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('holds BOTH tiers honestly (DR-0100) and carries provenance (DR-0076)', () => {
    expect(l).toContain('DR-0100');
    expect(l).toContain('DR-0076');
    // Tier 1 — the real, verified disparity named
    expect(l).toContain('138.2');
    expect(l).toContain("19th Judicial Circuit");
    expect(l).toContain('13-20%');
    // Tier 2 — the overstatement corrected, not the injustice denied
    expect(l).toContain('overshoots');
    expect(l).toContain('inflating a true injustice');
    expect(l).toContain('separate case');
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
  it('child, teen, and senior each carry the just Judge, no-respecter, and verify-claims threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the just Judge`).toContain('the Judge of all the earth');
      expect(t, `${band} carries prove/verify`).toMatch(/[Pp]rove all things|make sure it is TRUE/);
    }
    // teen and senior additionally carry the named partiality-as-sin AND the verified case.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('God is no respecter of persons');
      expect(t).toContain('138.2');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Genesis', 18, 25)).toContain('Shall not the Judge of all the earth do right?');
    expect(verse('Romans', 2, 11)).toBe('For there is no respect of persons with God.');
    // the exact spelling this catalog carries — "honor," not "honour"
    expect(verse('Leviticus', 19, 15)).toContain('nor honor the person of the mighty');
    expect(verse('Proverbs', 17, 15)).toBe('He that justifieth the wicked, and he that condemneth the just, even they both are abomination to the LORD.');
    expect(verse('Amos', 5, 24)).toBe('But let judgment run down as waters, and righteousness as a mighty stream.');
    expect(verse('Acts', 17, 26)).toContain('hath made of one blood all nations of men');
    expect(verse('Psalms', 82, 1)).toContain('he judgeth among the gods');
    expect(verse('Ecclesiastes', 12, 14)).toContain('God shall bring every work into judgment');
    expect(verse('1Thessalonians', 5, 21)).toBe('Prove all things; hold fast that which is good.');
  });
});

// =============================================================================
// THE CHECKS THIS GATE DID NOT HAVE (added 2026-09-17, DR-0418 pass)
// =============================================================================
// Carried from L111 down through L99 the same day. Five altered quotations of
// the Word were found in this module by the parsed-module field audit, run
// BEFORE any authoring -- the order this pass settled on after L102, and the
// only reason they surfaced at all:
//
//   Deuteronomy 1:17  `is God's`          ASCII apostrophe for U+2019   x3
//   Leviticus 19:15   `...the mighty.`    borrowed full stop            x1
//   1 Thess 5:21      `Prove all things,` comma for semicolon           x1
//
// TWO CORRECTIONS TO MY OWN WORK BELONG IN THIS COMMENT, because both were
// caught by machinery in this file rather than by my reading of it.
//
// FIRST, I nearly "fixed" a correct spelling into a real alteration. The
// Leviticus span failed, and my first reading was `honor` standing where the
// KJV usually carries `honour`. That was wrong twice over: this corpus does
// carry `nor honor the person of the mighty`, so the spelling was right and
// the defect was purely the trailing full stop -- AND the header of this very
// file already recorded that fact ("this catalog's KJV reads 'honor,' not
// 'honour,' in Leviticus 19:15; the lesson matches the corpus"). The finding
// was already verified and written down where I was working. Reading a gate's
// own header before diagnosing its failures is the cheap step I skipped. Both
// directions are pinned below so the spelling can never be "corrected" into a
// drift, and so the missing-continuation defect stays caught.
//
// SECOND, my rewritten bands DROPPED verified specifics the old bands carried
// -- the 138.2 sentence points and the 19th Judicial Circuit -- and the
// pre-existing assertions at lines 102 and 136 caught it. Those specifics are
// tier-1 documented facts, and naming them is what makes the claim CHECKABLE,
// which is this lesson's entire ethic. A rewrite that makes a verified claim
// vaguer is a regression even when every word of it is true.
//
// The 1 Thessalonians comma is also a NEW variant. L99 produced
// period-for-semicolon (Titus 2:13) and comma-for-period (Revelation 22:20);
// this is comma-for-semicolon -- a third pairing of the same two marks, which
// points at a systematic cause rather than three accidents: a clause quoted
// out of a verse that keeps going, then closed with whatever punctuation the
// surrounding sentence wanted.
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

// CLAIMS QUOTED IN ORDER TO BE WEIGHED (the L100 category 3, and this lesson
// is the clearest case for why that category has to exist).
// ---------------------------------------------------------------------------
// This is a justice-statistics lesson. It quotes the reel's claims because it
// holds each one against DR-0100's tiers -- the documented range and the
// verified case stated plainly, the inflated multiple and the dropped context
// flagged rather than repeated. Quoting a claim you are about to examine is
// not asserting it; it is the opposite. Also here: a report title, a name, a
// hashtag, the two reflexes the inApp block tests against the Word, and two
// phrases of our own, one of which is the lesson's sharpest line.
//
// None of these sits beside a verse reference pretending to BE that verse,
// which is the line L99's `"found so doing" (Matthew 24:46)` crossed six times
// and L108's crossed once.
const CLAIMS_QUOTED_TO_BE_WEIGHED = [
  '4.5 to 6.5 times harsher', '4.5 to 6.5 times', '4.5 to 6.5x', '4.5-6.5x', '6.5x', '6.5x,',
  'the only difference was race', 'only difference was race', 'only difference is race', 'only race', 'only race,',
  'the white guy got 2 years', 'the Black guy got 26 years,',
  '2 years for the white guy, 26 for the Black guy, same judge.', '2 years vs 26 years, same judge',
  'Bias on the Bench', 'Danny Collins', '#NolanWellsDeath',
  'the whole system, every case, is exactly this', 'the numbers are off, so ignore it',
  'research then lesson', 'an inflated truth is handed its own dismissal',
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
        if (CLAIMS_QUOTED_TO_BE_WEIGHED.includes(part)) continue;   // a claim under examination, not a verse
        if (!KJV_FLOW.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('a verse quotation can never hide behind the allowlist', () => {
    // The largest allowlist in this pass, so this assertion matters most here.
    // Every entry must be a claim, a title, a name or our own phrase, which
    // means none may be Scripture. It is the check that caught `"some say"` in
    // L100's draft allowlist.
    for (const q of CLAIMS_QUOTED_TO_BE_WEIGHED) {
      expect(KJV_FLOW.includes(q), `allowlisted phrase IS Scripture: ${q}`).toBe(false);
    }
  });

  it('is PROVEN-TO-CATCH — on the five this lesson shipped, and the spelling I nearly broke', () => {
    // Deuteronomy 1:17, three instances:
    expect(KJV_FLOW.includes('for the judgment is God’s')).toBe(true);
    expect(KJV_FLOW.includes("for the judgment is God's")).toBe(false);
    // Leviticus 19:15 -- the verse CONTINUES, so a full stop is not verbatim:
    expect(KJV_FLOW.includes('nor honor the person of the mighty: but in righteousness')).toBe(true);
    expect(KJV_FLOW.includes('nor honor the person of the mighty.')).toBe(false);
    // ...and the spelling my first reading would have "corrected" into a drift:
    expect(KJV_FLOW.includes('nor honor the person of the mighty')).toBe(true);
    expect(KJV_FLOW.includes('nor honour the person of the mighty')).toBe(false);
    // 1 Thessalonians 5:21 -- comma for semicolon:
    expect(KJV_FLOW.includes('Prove all things;')).toBe(true);
    expect(KJV_FLOW.includes('Prove all things,')).toBe(false);
    // Drifts of this lesson's own hinges, each reading perfectly:
    expect(KJV_FLOW.includes('Shall not the Judge of all the earth do right?')).toBe(true);
    expect(KJV_FLOW.includes('Shall not the Judge of all the earth do righteously?')).toBe(false);
    expect(KJV_FLOW.includes('there is no respect of persons with God')).toBe(true);
    expect(KJV_FLOW.includes('there is no respecting of persons with God')).toBe(false);
    expect(KJV_FLOW.includes('for a gift doth blind the eyes of the wise')).toBe(true);
    expect(KJV_FLOW.includes('for a gift doth blind the eyes of the foolish')).toBe(false);
  });
});

describe('our own authored voice says Yahweh, not the generic name (DR-0210)', () => {
  it('names Him by His covenant name in every band and every note', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(3);
  });

  it('and Acts 10:34 is QUOTED rather than absorbed into our prose', () => {
    // It was used unquoted with its citation: `God is no respecter of persons
    // (Acts 10:34)`. The words are verbatim Scripture, so the fix was to quote
    // them -- which keeps the generic name correctly inside the Word and adds
    // an anchor, instead of lifting a name that was never ours to lift.
    expect(l).toContain('"God is no respecter of persons" (Acts 10:34)');
    expect(KJV_FLOW.includes('God is no respecter of persons')).toBe(true);
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
      expect(t, `${band} carries the Judge of all the earth`).toContain('Shall not the Judge of all the earth do right?');
      expect(t, `${band} carries no respect of persons`).toContain('there is no respect of persons with God');
      expect(t, `${band} carries Acts 10:34`).toContain('God is no respecter of persons');
      expect(t, `${band} carries the equal-justice command`).toContain('nor honor the person of the mighty');
      expect(t, `${band} carries small-as-well-as-great`).toContain('ye shall hear the small as well as the great');
      expect(t, `${band} carries the bribe that blinds the wise`).toContain('a gift doth blind the eyes of the wise');
      expect(t, `${band} carries partiality-is-sin`).toContain('It is not good to have respect of persons in judgment');
      expect(t, `${band} carries both-are-abomination`).toContain('even they both are abomination to the LORD');
      expect(t, `${band} carries first-in-his-own-cause`).toContain('He that is first in his own cause seemeth just');
      expect(t, `${band} carries prove all things`).toContain('Prove all things;');
      expect(t, `${band} carries no false report`).toContain('Thou shalt not raise a false report');
      expect(t, `${band} carries plead the cause`).toContain('plead the cause of the poor and needy');
      expect(t, `${band} carries judgment as waters`).toContain('let judgment run down as waters');
      expect(t, `${band} carries do justly and love mercy`).toContain('to do justly, and to love mercy');
      expect(t, `${band} carries vengeance is His`).toContain('Vengeance is mine; I will repay');
      expect(t, `${band} carries overcome evil with good`).toContain('overcome evil with good');
      expect(t, `${band} carries one blood`).toContain('hath made of one blood all nations of men');
      expect(t, `${band} carries the deceitful heart`).toContain('The heart is deceitful above all things');
      expect(t, `${band} carries He judges the judges`).toContain('he judgeth among the gods');
      expect(t, `${band} carries every secret thing`).toContain('with every secret thing');
    }
  });

  it('every band holds BOTH TIERS of the material (DR-0100)', () => {
    // Tier one plainly, tier two flagged. This lesson is the pass's clearest
    // example, because its whole fourth movement IS the second tier: a band
    // keeping only the first would read as advocacy, and one keeping only the
    // second would read as dismissal. DR-0100 names both as failures of truth,
    // in opposite directions, which is why one check holds both.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      // Tier one, stated plainly and not hedged -- INCLUDING the specifics that
      // make it checkable, which my own rewrite had dropped:
      expect(t, `${band} lost the documented Sentencing Commission range`).toMatch(/13 to 20 percent/);
      expect(t, `${band} lost the verified same-judge case`).toMatch(/same judge|SAME judge/);
      expect(t, `${band} lost the 138.2 sentence points`).toContain('138.2');
      expect(t, `${band} lost the circuit`).toContain('19th Judicial Circuit');
      expect(t, `${band} lost that the disparity is real and grievous`).toMatch(/real and grievous|really wrong/i);
      expect(t, `${band} lost that softening it would be dishonest`).toMatch(/its own dishonesty|its own kind of lying/i);
      // Tier two, flagged rather than asserted:
      expect(t, `${band} lost that the multiple overshoots`).toMatch(/overshoots|way bigger than/i);
      expect(t, `${band} lost the dropped context`).toMatch(/cooperation and remorse|helped them and was sorry/i);
      expect(t, `${band} lost that a name was misattributed`).toMatch(/belongs to the commentator|man who MADE the video/i);
    }
  });

  it('every band keeps the hinge: naming a wrong does not require inflating it', () => {
    // The sentence the whole lesson turns on. A band without it could carry
    // every verse and still leave the reader believing accuracy and advocacy
    // are rivals.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost the hinge`)
        .toMatch(/does NOT require inflating it|does NOT mean you have to make it bigger/);
      expect(level(band), `${band} lost why inflation costs you the argument`)
        .toMatch(/easiest possible way to be dismissed|easiest excuse to throw the whole thing away/i);
      expect(level(band), `${band} lost that the true measure is HARDER to dismiss`)
        .toMatch(/harder to wave away|HARDER to ignore/i);
    }
  });

  it('every band forbids partiality in BOTH directions', () => {
    // Leviticus 19:15 forbids favouring the poor as well as the mighty, and the
    // sixth movement refuses a new partiality pointed the other way. A band
    // keeping only one side would license the bias it means to correct.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost the both-directions reading`)
        .toMatch(/both directions|BOTH ways|Not nicer to rich people/i);
      expect(level(band), `${band} lost the refusal of racial payback`)
        .toMatch(/tipped scale|unfair back|partiality pointed the other way/i);
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // FOURTEENTH consecutive lesson in this pass whose senior band handed the
    // reader the teacher's clipboard. It opened "Teach this as the platform's
    // justice engine (with L37, L90, L97) meeting a viral sentencing reel" and
    // carried the DR citations and "Tier 1 / Tier 2" labels inline.
    const senior = level('senior');
    expect(senior).not.toContain("Teach this as the platform's justice engine");
    expect(senior).not.toMatch(/\bL\d{2,3}\b/);
    expect(senior).not.toMatch(/\bDR-\d{4}\b/);
    expect(senior).not.toMatch(/Tier 1|Tier 2/);
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });
});
