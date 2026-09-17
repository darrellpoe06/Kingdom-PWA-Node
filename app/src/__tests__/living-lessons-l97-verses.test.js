// =============================================================================
// L97 — A Just Weight for Work, Money, and Words: verbatim KJV
// =============================================================================
// Darrell 2026-08-28 brought a news story (The Sewing Box / Blue Angels flight
// suits) and asked for research + a lesson, flagging a title claim to verify.
// Word-first, non-partisan, two-tier honest (DR-0098/DR-0100): honor faithful
// service; a just weight with public money AND with words; no respecter of
// persons held in both tiers (name the disparity, do not convict the heart);
// plead for the one without power; verify every claim — including our own (the
// Patronis title was checked against the public record and a well-meant
// correction proved outdated); a just process, not vengeance; security in the
// Lord, not a contract. Every KJV line FETCHED from the repo's own KJV this
// session; a drift fails the build. The Sewing Box facts are carried AS REPORTED
// (DR-0076); the Patronis fact is verified against the public record.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll97-a-just-weight-for-work-money-and-words-faithful-service-and-verifying-every-claim'");
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
  // honor faithful service
  'Well done, thou good and faithful servant',
  'thou hast been faithful over a few things',
  'The labourer is worthy of his reward',
  'there was found in it a poor wise man, and he by his wisdom delivered the city; yet no man remembered that same poor man',
  'do it heartily, as to the Lord',
  // a just weight with money
  'A false balance is abomination to the LORD: but a just weight is his delight',
  'Divers weights, and divers measures, both of them are alike abomination to the LORD',
  'give an account of thy stewardship',
  // no respecter of persons — both tiers
  'God is no respecter of persons',
  'The rich and poor meet together: the LORD is the maker of them all',
  'if ye have respect to persons, ye commit sin',
  'man looketh on the outward appearance, but the LORD looketh on the heart',
  // plead for the one without power
  'Open thy mouth for the dumb in the cause of all such as are appointed to destruction.',
  'plead the cause of the poor and needy',
  'seek judgment, relieve the oppressed',
  // a just weight for words
  'Prove all things; hold fast that which is good.',
  'He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him',
  'Thou shalt not raise a false report',
  'Thou shalt not bear false witness against thy neighbour',
  // a just process, not vengeance
  'to do justly, and to love mercy, and to walk humbly with thy God',
  'avenge not yourselves',
  'Vengeance is mine; I will repay, saith the Lord',
  'Commit thy works unto the LORD, and thy thoughts shall be established',
  // security in the Lord
  'my God shall supply all your need according to his riches in glory by Christ Jesus',
  'seek ye first the kingdom of God, and his righteousness',
];

describe('L97 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Proverbs 11:1; Acts 10:34; 1 Thessalonians 5:21'", 'benefits:', 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — seven movements + THE WHOLE OF IT', () => {
    const order = [
      '1) HONOR LONG, FAITHFUL SERVICE',
      '2) A JUST WEIGHT WITH WHAT IS NOT YOURS',
      '3) NO RESPECTER OF PERSONS',
      '4) PLEAD THE CAUSE OF THE ONE WITHOUT THE POWER',
      '5) A JUST WEIGHT FOR WORDS TOO',
      '6) ASK FOR A JUST PROCESS, NOT VENGEANCE',
      '7) WHERE SECURITY FINALLY RESTS',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('carries the provenance discipline honestly (DR-0076 as-reported + DR-0100 both tiers)', () => {
    expect(l).toContain('AS REPORTED');
    expect(l).toContain('DR-0076');
    expect(l).toContain('DR-0100');
  });

  it('the Patronis title is VERIFIED against the public record, and the correction self-corrected', () => {
    // The teaching point Darrell raised — a just weight for words, checked live.
    expect(l).toContain('Florida CFO through March 2025');
    expect(l).toContain('April 1, 2025');
    expect(l).toContain("1st District");
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
  it('child, teen, and senior each carry the just weight, no-respecter, and verify-claims threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the just weight`).toContain('a just weight is his delight');
      expect(t, `${band} carries no respecter of persons`).toContain('God is no respecter of persons');
      expect(t, `${band} carries prove/verify`).toMatch(/[Pp]rove all things|find out if it is TRUE/);
    }
    // teen and senior additionally carry the do-not-judge-the-heart tier and the Patronis verification.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('the LORD looketh on the heart');
      expect(t).toMatch(/April 1?,? ?2025/);
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Proverbs', 11, 1)).toBe('A false balance is abomination to the LORD: but a just weight is his delight.');
    expect(verse('Acts', 10, 34)).toContain('God is no respecter of persons');
    expect(verse('1Samuel', 16, 7)).toContain('man looketh on the outward appearance, but the LORD looketh on the heart');
    expect(verse('Proverbs', 18, 17)).toBe('He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.');
    expect(verse('Exodus', 23, 1)).toContain('Thou shalt not raise a false report');
    expect(verse('Exodus', 20, 16)).toBe('Thou shalt not bear false witness against thy neighbour.');
    expect(verse('1Thessalonians', 5, 21)).toBe('Prove all things; hold fast that which is good.');
    expect(verse('Proverbs', 31, 9)).toContain('plead the cause of the poor and needy');
    expect(verse('Romans', 12, 19)).toContain('Vengeance is mine; I will repay, saith the Lord.');
    expect(verse('Philippians', 4, 19)).toContain('my God shall supply all your need');
    expect(verse('Micah', 6, 8)).toContain('to do justly, and to love mercy, and to walk humbly with thy God');
  });
});

// =============================================================================
// THE CHECKS THIS GATE DID NOT HAVE (added 2026-09-17, DR-0418 pass)
// =============================================================================
// Carried from L111 down through L98. Five defects in this module, and the
// audit that found them is why the pass changed method mid-stream.
//
//   Ecclesiastes 9:16  `the poor man's wisdom`  ASCII apostrophe      x1
//   Acts 10:34         `...persons.`            period for a COLON    x1
//   Acts 10:34         `...persons,`            comma for a COLON     x1
//   1 Samuel 16:7      `...on the heart,`       comma for a period    x1
//   1 Thessalonians 5:21 `Prove all things,`    comma for a semicolon x1
//
// THE LAST ONE IS WHY THE CATALOG GOT SWEPT. It is the IDENTICAL defect fixed
// in L98 one commit earlier -- the same verse, quoted the same wrong way, in
// the sibling lesson. Finding a defect twice in two adjacent lessons meant
// lesson-by-lesson auditing was the wrong instrument for a class that recurs,
// so all 163 lessons were measured at once: 28,695 quoted spans, 35 ASCII
// apostrophes in 11 lessons (fixed catalog-wide, with their own gate), and 146
// terminal-punctuation cases whose STANDARD is not yet decided -- 111 of them
// closing with a comma, which is the signature of a convention rather than an
// accident.
//
// THE POLICY THIS FILE FOLLOWS, STATED SO IT IS NOT MISTAKEN FOR INCONSISTENCY.
// A lesson entering the gated set takes the STRICT reading: a quotation ends
// where the verse's own punctuation falls, and any mark the host sentence wants
// goes outside the closing quote. The other ~157 lessons keep the convention
// until that standard is decided. The catalog is therefore mixed on purpose,
// and this lesson is on the strict side of it.
//
// AND ONE MORE OF OUR OWN PHRASES WAS WEARING QUOTATION MARKS. `"searching
// out" (Proverbs 18:17)` -- our nominalisation of a verse that actually reads
// `his neighbour cometh and searcheth him`. Marks off, phrase kept as ours,
// reference kept as the honest allusion pointer. That is the eighth false
// attribution this pass has found, after L99's six and L108's one.
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

// A QUOTED ROLE AND TWO QUOTED REFLEXES (the L100 category 3).
// `Congressman` is quoted because the lesson is literally examining whether
// that word was the right one -- the claim under test IS the term. The inApp
// block quotes the two reflexes this story provokes in order to test both
// against the Word rather than endorse either.
const OUR_OWN_QUOTED = [
  'Congressman', 'Congressman,', 'Congressman vs CFO',
  'this is obviously racism',      // reflex one, quoted to be TESTED
  'just business, move on',        // reflex two, quoted to be TESTED
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
        if (OUR_OWN_QUOTED.includes(part)) continue;   // a term under test, or a reflex
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

  it('OUR OWN nominalisation never wears quotation marks beside its reference', () => {
    // `"searching out" (Proverbs 18:17)` presented our word as the verse's.
    expect(l, 'our nominalisation must not be quoted as the verse').not.toContain('"searching out"');
    // The phrase itself is not required to survive: the rewritten bands say
    // "opened and searched" in plain words instead, which is better than a
    // nominalisation either way. What must hold is that it never returns
    // wearing marks beside the reference.
    expect(l, 'and the verse it alludes to is quoted correctly')
      .toContain('but his neighbour cometh and searcheth him');
    expect(KJV_FLOW.includes('searching out')).toBe(false);
    expect(KJV_FLOW.includes('his neighbour cometh and searcheth him')).toBe(true);
  });

  it('is PROVEN-TO-CATCH — on all five this lesson shipped', () => {
    expect(KJV_FLOW.includes('the poor man’s wisdom is despised')).toBe(true);
    expect(KJV_FLOW.includes("the poor man's wisdom is despised")).toBe(false);
    expect(KJV_FLOW.includes('God is no respecter of persons:')).toBe(true);
    expect(KJV_FLOW.includes('God is no respecter of persons.')).toBe(false);
    expect(KJV_FLOW.includes('God is no respecter of persons,')).toBe(false);
    expect(KJV_FLOW.includes('but the LORD looketh on the heart.')).toBe(true);
    expect(KJV_FLOW.includes('but the LORD looketh on the heart,')).toBe(false);
    expect(KJV_FLOW.includes('Prove all things;')).toBe(true);
    expect(KJV_FLOW.includes('Prove all things,')).toBe(false);
    // Drifts of this lesson's own hinges, each reading perfectly:
    expect(KJV_FLOW.includes('A false balance is abomination to the LORD')).toBe(true);
    expect(KJV_FLOW.includes('A false balance is an abomination to the LORD')).toBe(false);
    expect(KJV_FLOW.includes('yet no man remembered that same poor man')).toBe(true);
    expect(KJV_FLOW.includes('yet no man remembereth that same poor man')).toBe(false);
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
      expect(t, `${band} carries well-done-good-and-faithful`).toContain('Well done, thou good and faithful servant');
      expect(t, `${band} carries the labourer worthy`).toContain('The labourer is worthy of his reward');
      expect(t, `${band} carries the forgotten poor wise man`).toContain('yet no man remembered that same poor man');
      expect(t, `${band} carries the false balance`).toContain('A false balance is abomination to the LORD');
      expect(t, `${band} carries divers weights`).toContain('Divers weights, and divers measures');
      expect(t, `${band} carries the accounting`).toContain('give an account of thy stewardship');
      expect(t, `${band} carries Acts 10:34`).toContain('God is no respecter of persons');
      expect(t, `${band} carries rich-and-poor-together`).toContain('The rich and poor meet together');
      expect(t, `${band} carries respect-of-persons-is-sin`).toContain('if ye have respect to persons, ye commit sin');
      expect(t, `${band} carries the unseen heart`).toContain('but the LORD looketh on the heart');
      expect(t, `${band} carries plead the cause`).toContain('plead the cause of the poor and needy');
      expect(t, `${band} carries relieve the oppressed`).toContain('seek judgment, relieve the oppressed');
      expect(t, `${band} carries no false report`).toContain('Thou shalt not raise a false report');
      expect(t, `${band} carries prove all things`).toContain('Prove all things;');
      expect(t, `${band} carries first-in-his-own-cause`).toContain('He that is first in his own cause seemeth just');
      expect(t, `${band} carries do justly`).toContain('to do justly, and to love mercy');
      expect(t, `${band} carries vengeance is His`).toContain('Vengeance is mine; I will repay');
      expect(t, `${band} carries commit thy works`).toContain('Commit thy works unto the LORD');
      expect(t, `${band} carries the supply`).toContain('shall supply all your need according to his riches');
      expect(t, `${band} carries seek ye first`).toContain('But seek ye first the kingdom of God');
    }
  });

  it('every band keeps the SELF-correction whole, including that we were the ones corrected', () => {
    // The sharpest thing in this lesson, and the easiest to drop because it
    // costs us something: a "correction" of the video was itself out of date,
    // and we only knew because we checked it rather than accepting it. Every
    // band must carry the dates that make it checkable, and the conclusion that
    // a correction is just another claim.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lost that the correction was out of date`)
        .toMatch(/correction itself was out of date|CORRECTION was the thing that was out of date/i);
      expect(t, `${band} lost the CFO dates`).toContain('March 2025');
      expect(t, `${band} lost the House date`).toContain('April 2025');
      expect(t, `${band} lost that Congressman was correct`).toMatch(/was in fact correct|was right after all/i);
      expect(t, `${band} lost that the point is not winning the exchange`)
        .toMatch(/not who won that exchange|not who won that little argument/i);
      expect(t, `${band} lost that OUR OWN claims are checked too`).toMatch(/our own/i);
    }
  });

  it('every band holds BOTH commands at once, and says that is not fence-sitting', () => {
    // Name the real disparity AND refuse to convict a heart nobody can see.
    // Dropping either is the easy way out, in opposite directions.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lost the both-at-once instruction`)
        .toMatch(/hold both at once|do BOTH at the same time|Hold both/i);
      expect(t, `${band} lost the not-fence-sitting line`)
        .toMatch(/not fence-sitting|not being wishy-washy/i);
      expect(t, `${band} lost that it is two commands, not a hedge`)
        .toMatch(/two commands obeyed|obeying two rules at once|says two things, and refuses to drop either/i);
    }
  });

  it('every band keeps asking-for-an-accounting distinct from declaring guilt', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} blurred the accounting and the verdict`)
        .toMatch(/without yet declaring anyone guilty|asking is NOT the same|not the same act as declaring/i);
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // FIFTEENTH consecutive lesson in this pass whose senior band handed the
    // reader the teacher's clipboard. It opened "Teach this as the platform's
    // justice engine (with L37 and L90) meeting a fresh headline" and carried
    // the named business and owner plus DR citations inline.
    const senior = level('senior');
    expect(senior).not.toContain("Teach this as the platform's justice engine");
    expect(senior).not.toMatch(/\bL\d{2,3}\b/);
    expect(senior).not.toMatch(/\bDR-\d{4}\b/);
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });
});
