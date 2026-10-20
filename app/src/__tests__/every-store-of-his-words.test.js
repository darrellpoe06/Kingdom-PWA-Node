// @vitest-environment node
// =============================================================================
// Every store of His quoted words is checked -- not only the ones shaped like a
// course, and not only the fields a list happens to name
// =============================================================================
// DR-0987 asked, as a re-review, whether EVERY store of quoted Scripture in the
// repository is gated against the corpus, "a wider question than one drain."
// MEASURED 2026-10-20 on main d33f5d3b2, the answer was no, in three separate
// ways, each one the same shape as the defect before it -- an instrument pointed
// at a subset and trusted as though it covered the whole.
//
//   1. FILE SCOPE. every-catalog-quotes-the-verse.test.js reads the 42 lesson
//      catalogs, derived off disk, and is right about them. But quoted Scripture
//      also lives in scriptures.js, godhead-study.js, yahweh-by-century.js,
//      world-issues-class.js, study-space.js, seeing-study.js,
//      eternal-algorithms.js and nine more that are not courses: 16 modules,
//      1,850 spans, 95 faults nothing had ever read.
//
//   2. FIELD SCOPE. Inside the gated catalogs, the scan asks each module for a
//      NAMED set of fields (lesson, bigIdea, inApp, the bands, benefits, the
//      quiz, the talking points). On living-lessons-class.js that list reaches
//      43,054 spans; a walk of the module's VALUES reaches 46,556 -- and 8
//      faults live in the 3,500-span difference. This is DR-0545's own defect
//      recurring: a scope borrowed for a question it was never drawn for.
//
//   3. REFERENCE FORM. SPAN_WITH_REFERENCE required ")" immediately after the
//      verse numbers, so "(Philippians 3:12, ESV)" matched NOTHING -- 64
//      quotations stated their translation and were never compared to anything
//      for that reason alone. 26 of them claim KJV, a corpus this repository
//      holds, and six abbreviated references were hiding behind the tag where
//      no fixer could see them.
//
// WHAT THIS GATE IS. One value walk over every data module that holds a
// quotation beside a reference, the list DERIVED by modulesWithSpans() rather
// than kept by hand -- because a hand-kept list is what failed in DR-0545 and
// again in DR-0987, and twice is a pattern. The catalogs' own gate is left
// exactly as it is: DR-0545's precedent is "a second, wider scope rather than
// widening the first," and the narrow one still answers a question of its own.
//
// FAULTS AND UNCHECKABLE ARE COUNTED APART, and that is the honest part.
// SCRIPTURE-REFERENCE-STANDARD puts ESV first; 38 quotations in the data are
// tagged ESV, faithfully as far as anything here can tell, and NOT verifiable,
// because no ESV text is on disk -- only kjv and web. Measuring them against the
// KJV and calling the difference a fault would manufacture 38 corruptions out of
// sound work (DR-0076: measure, don't claim). Passing them in silence would
// claim a verification that never happened. They are pinned as `uncheckable`:
// named, held to a number, and never counted as either.
//
// THE NUMBERS ARE PINS, NOT CEILINGS, in both directions -- the discipline
// every-catalog-quotes-the-verse established and the reason this file exists at
// all. A new fault is red. A FIXED fault is also red, with a message saying to
// lower the number, because a ceiling nobody lowers stops describing the
// building, and "two catalogs" stopped being true exactly that way.
import { describe, it, expect } from 'vitest';

import { scanValueSpans, scanQuotedVerses, describeFault } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { modulesWithSpans } from '../../../scripts/quoted-sources.mjs';
import { planShoutFixes } from '../../../scripts/fix-quote-shout.mjs';
import { planAbbreviationFixes, proseName } from '../../../scripts/fix-quote-abbreviation.mjs';

// Vite resolves a dynamic import of a variable only when the shape is a literal
// glob. LAZY, deliberately: an eager glob imports every file in the folder,
// including device-voice.worker.js, whose first statement is `self.onmessage`
// and which throws on sight outside a worker. Only the modules on the derived
// list are ever loaded.
const LOADERS = import.meta.glob('../lib/*.js');
const key = (rel) => `../lib/${rel.replace('app/src/lib/', '')}`;
const load = (rel) => LOADERS[key(rel)]();

// One scan per module for the whole file. The sweeps below would otherwise each
// walk all 58 modules and all 60,955 spans again, which timed out at 5s a case.
const SCANS = new Map();
async function scanOf(rel) {
  if (!SCANS.has(rel)) SCANS.set(rel, scanValueSpans(await load(rel)));
  return SCANS.get(rel);
}

// Measured 2026-10-20 after the shouts were restored (fix-quote-shout.mjs, 50
// sites) and every abbreviation beside a quotation was written out (26 by
// fix-quote-abbreviation.mjs, 9 settled by reading the quotation).
const PINNED = {
  'broadcast-class.js': 4,
  'business-research-course.js': 1,
  'buying-terms-course.js': 4,
  'datasystems-course.js': 1,
  'economics-class.js': 13,
  'eternal-algorithms-studies.js': 3,
  // Quotes ESV throughout. The 19 here are the untagged spans, which the
  // scanner reads as KJV claims because nothing says otherwise; the 10 that say
  // ESV are in UNCHECKABLE below. Whether the untagged ones should carry a tag
  // is an authoring question for the Governor, not a gate's to decide.
  'eternal-algorithms.js': 19,
  'godhead-study.js': 5,
  // The ONE catalog whose whole debt is the open capital question DR-1031
  // declined to decide: our capital on a word sitting mid-verse.
  'historical-research-course.js': 36,
  'infrastructure-class.js': 3,
  'legacy-provisions-course.js': 1,
  // THE FIELD-SCOPE FINDING, in one number. Its own gate reports ZERO over
  // 43,054 field-scoped spans and is not wrong; these 8 sit in the 3,500 spans
  // a value walk reaches and a field list does not.
  'living-lessons-class.js': 8,
  'made-in-time-course.js': 120,
  'prophetic-voices.js': 5,
  'scripture-teaching.js': 2,
  // The largest single store outside the courses, and it was never read.
  'scriptures.js': 41,
  'seeing-study.js': 2,
  'sovereign-ai-class.js': 27,
  'story-exploration.js': 1,
  'study-space.js': 4,
  'world-issues-class.js': 8,
  'yahweh-by-century.js': 13,
};

// Spans naming a translation no corpus here holds. Not debt, not verified.
const UNCHECKABLE = {
  'eternal-algorithms.js': 10,
  'living-lessons-class.js': 13,
  'study-space.js': 15,
};

const MODULES = modulesWithSpans();

describe('the gate knows every store there is', () => {
  it('the list is derived off disk, and every module on it is really here', () => {
    // THE STRUCTURAL CLOSE, and the whole reason this is not another hand-kept
    // list. A new store makes this red the day it lands.
    expect(MODULES.length).toBeGreaterThan(50);
    for (const rel of MODULES) {
      expect(LOADERS[key(rel)], `${rel} is on the derived list but is not reachable here`).toBeTruthy();
    }
  });

  it('every module it pins is on the derived list -- so a pin cannot outlive its file', () => {
    const derived = new Set(MODULES.map((r) => r.replace('app/src/lib/', '')));
    for (const file of [...Object.keys(PINNED), ...Object.keys(UNCHECKABLE)]) {
      expect(derived.has(file), `${file} is pinned but no longer holds a referenced span`).toBe(true);
    }
  });

  it('scans a real corpus, so a pass means something', async () => {
    // Anti-theater (DR-0076 section 3). If an import broke or the walk stopped
    // yielding strings, every pin below would pass on nothing at all.
    let spans = 0;
    for (const rel of MODULES) spans += (await scanOf(rel)).spans;
    expect(spans).toBeGreaterThan(50_000);
  }, 120_000);

  it('no abbreviated reference is left beside any quotation', async () => {
    // 35 references were abbreviated past a resolver's reach, so 35 quotations
    // had never been compared to a verse. Committed at zero, not baselined --
    // the corpus settles what a book is called.
    const stuck = [];
    for (const rel of MODULES) {
      for (const f of (await scanOf(rel)).faults) {
        if (f.kind === 'unresolvable') stuck.push(`${rel}: (${f.ref})`);
      }
    }
    expect(stuck).toEqual([]);
  }, 120_000);

  it('the only quotations still shouting are the 15 the corpus cannot settle alone', async () => {
    // THE CORPUS SETTLES THE CLASS, BUT NOT EVERY SITE. His text does not shout,
    // so a shouted word is never the text -- and 50 sites were restored to the
    // verse's own casing by fix-quote-shout.mjs. These 15 differ from the verse
    // by MORE than the shout (Numbers 1:3 reads "From twenty years old", so our
    // "from TWENTY years old" is a lowered capital as well as a shout), and the
    // tool declines them by design rather than swap one fault class for another
    // and report progress that is not progress. They are counted inside
    // made-in-time-course.js's pin of 120, not held apart from it.
    //
    // Pinned, not committed at zero -- because zero is what I first asserted
    // here, and it was not true. DR-0076 section 4: measure, don't claim.
    const shouting = [];
    for (const rel of MODULES) {
      for (const f of (await scanOf(rel)).faults) {
        if (f.kind === 'shouted') shouting.push(rel.replace('app/src/lib/', ''));
      }
    }
    expect(shouting).toHaveLength(15);
    expect(new Set(shouting)).toEqual(new Set(['made-in-time-course.js']));
  }, 120_000);
});

describe('THE WHOLE SURFACE -- measured, pinned, and open about its debt', () => {
  for (const rel of MODULES) {
    const file = rel.replace('app/src/lib/', '');
    const pin = PINNED[file] || 0;
    it(`${file} holds exactly ${pin} quotation fault(s)`, async () => {
      const scan = await scanOf(rel);
      if (scan.faults.length === pin) {
        expect(scan.faults.length).toBe(pin);
        return;
      }
      const verdict = scan.faults.length > pin
        ? `${file}: ${scan.faults.length} faults, pinned at ${pin} -- a NEW fault entered this store`
        : `${file}: ${scan.faults.length} faults, pinned at ${pin} -- faults were FIXED; lower the pin to ${scan.faults.length} so the ledger stays true`;
      expect(
        scan.faults.slice(0, 12).map((f) => describeFault({ id: file, where: 'value', ...f })).join('\n'),
        verdict,
      ).toBe(`(expected exactly ${pin})`);
    });
  }
});

describe('what no corpus here can verify is named, not assumed either way', () => {
  for (const rel of MODULES) {
    const file = rel.replace('app/src/lib/', '');
    const pin = UNCHECKABLE[file] || 0;
    it(`${file} holds exactly ${pin} span(s) this repository cannot verify`, async () => {
      const scan = await scanOf(rel);
      if (scan.uncheckable.length === pin) {
        expect(scan.uncheckable.length).toBe(pin);
        return;
      }
      const verdict = scan.uncheckable.length > pin
        ? `${file}: ${scan.uncheckable.length} unverifiable spans, pinned at ${pin} -- a quotation now names a translation this repository does not hold. That is not a fault, but it is not verified either, and it does not slip in unnoticed.`
        : `${file}: ${scan.uncheckable.length} unverifiable spans, pinned at ${pin} -- fewer than before; lower the pin so the ledger stays true`;
      expect(
        scan.uncheckable.slice(0, 12).map((f) => describeFault({ id: file, where: 'value', ...f })).join('\n'),
        verdict,
      ).toBe(`(expected exactly ${pin})`);
    });
  }
});

describe('PROVEN-TO-CATCH: the three misses, each demonstrated rather than described', () => {
  const theSeries = async () => (await load('app/src/lib/living-lessons-class.js')).LIVING_LESSONS_MODULES;

  it('FIELD SCOPE: a fault outside the named fields is reported here and MISSED by the field scan', async () => {
    // The miss this gate closes, asserted in both directions at once: a field
    // the list does not name. John 1:14 reads "And the Word was made flesh",
    // not "In the beginning was the Word" -- that is verse 1.
    //
    // My first probe here cited Haggai 1:5 against "Consider your ways", on the
    // strength of a sentence in DR-0545. The corpus says BOTH 1:5 and 1:7 carry
    // that phrase, so it was no fault at all and this case was passing on
    // nothing. It is only here as a case because it was run and went red.
    const series = await theSeries();
    const real = series[0];
    const bent = { ...real, facilitator: { ...(real.facilitator || {}), closing: 'He wrote "In the beginning was the Word" (John 1:14)' } };
    // ONLY the bent span's own fault, so this lesson's eight existing faults --
    // real ones, in fields a value walk reaches -- can never make it pass by
    // accident. The same guard the catalogs' gate uses on its bent copies.
    const mine = (fs) => fs.filter((f) => String(f.ref).startsWith('John'));

    expect(mine(scanValueSpans([bent]).faults).map((f) => f.kind)).toEqual(['not-the-verse']);
    expect(mine(scanQuotedVerses([bent], quotedTexts).faults)).toEqual([]);  // the field list never looks there
  });

  it('FIELD SCOPE: the value walk genuinely reaches further than the field list', async () => {
    // If this ever collapsed back, the gate above would still be green while
    // covering less. One measurement keeps it honest.
    const series = await theSeries();
    expect(scanValueSpans(series).spans).toBeGreaterThan(scanQuotedVerses(series, quotedTexts).spans);
  });

  // The next three judge the PATTERN and the translation rule, so they use a
  // bare probe record rather than a real lesson: a lesson brings its own spans,
  // and a case meant to prove one thing should be about one thing.
  const probe = (bigIdea) => [{ id: 'probe', bigIdea }];

  it('REFERENCE FORM: a span whose reference carries a translation tag is SEEN', async () => {
    // The pattern used to require ")" straight after the numbers, so this span
    // matched nothing at all and passed by never being looked at.
    expect(scanValueSpans(probe('He wrote "In the beginning was the Word" (John 1:14, KJV)')).faults.map((f) => f.kind))
      .toEqual(['not-the-verse']);
  });

  it('REFERENCE FORM: a KJV-tagged span that IS the verse passes, so the tag is not a blanket', async () => {
    const scan = scanValueSpans(probe('He wrote "In the beginning was the Word" (John 1:1, KJV)'));
    expect(scan.faults).toEqual([]);
    expect(scan.uncheckable).toEqual([]);
    expect(scan.verbatim).toBe(1);        // and it IS counted as verified
  });

  it('TRANSLATION: an ESV-tagged span is uncheckable, NOT a fault and NOT verified', async () => {
    // Both halves matter. Counting it a fault invents a corruption out of sound
    // work; passing it silently claims a verification that never happened.
    const scan = scanValueSpans(probe('He wrote "In the beginning was the Word" (John 1:1, ESV)'));
    expect(scan.faults).toEqual([]);
    expect(scan.uncheckable.map((f) => f.kind)).toEqual(['no-corpus']);
    expect(scan.verbatim).toBe(0);
  });

  it('FILE SCOPE: the derived list reaches modules that are not courses at all', () => {
    // The 16 ungated stores. If modulesWithSpans() ever narrowed back to the
    // courses, this is what would say so.
    const files = new Set(MODULES.map((r) => r.replace('app/src/lib/', '')));
    for (const notACourse of ['scriptures.js', 'godhead-study.js', 'yahweh-by-century.js', 'study-space.js']) {
      expect(files.has(notACourse), `${notACourse} fell out of the derived list`).toBe(true);
    }
  });
});

describe('the two repair tools REFUSE what they are not entitled to decide', () => {
  // The gate above can prove a repair happened. It cannot prove a tool declined
  // to make one -- a tool that quietly rewrote more than its rule allows would
  // leave the gate green and His words altered. These are those refusals.

  it('fix-quote-shout leaves a span alone when MORE than the shout differs', () => {
    // Numbers 1:3 reads "From twenty years old and upward". Un-shouting ours
    // gives "from twenty years old and upward" -- still not the verse, because
    // the opening capital is lowered too. Rewriting it would swap one fault
    // class for another and report progress that is not progress.
    const src = 'x: \'He counted "from TWENTY years old and upward" (Numbers 1:3) of them\',';
    expect(planShoutFixes(src)).toEqual([]);
  });

  it('fix-quote-shout DOES repair a span whose only fault is the shout', () => {
    // The other half: a rule that refuses everything is not a rule.
    const src = 'x: \'He says "Have faith in GOD" (Mark 11:22) plainly\',';
    const fixes = planShoutFixes(src);
    expect(fixes).toHaveLength(1);
    expect(fixes[0].replacement).toContain('"Have faith in God"');
    expect(fixes[0].replacement).not.toContain('GOD');
  });

  it('fix-quote-shout never touches the KJV\'s own small caps', () => {
    // "the LORD" is the verse's shout, not ours. shoutedWords() compares rather
    // than assumes, and this is the case that holds it to that.
    const src = 'x: \'as it says, "The LORD said unto my Lord" (Psalm 110:1) here\',';
    expect(planShoutFixes(src)).toEqual([]);
  });

  it('fix-quote-abbreviation REFUSES an ambiguous abbreviation rather than guess', () => {
    // "Phil" is Philemon or Philippians. DR-0545 named this exact trap as the
    // reason not to teach a resolver abbreviations: it is "a place a wrong book
    // can hide". A guess here would check His words against the wrong verse.
    const src = 'x: \'he wrote "I press on" (Phil 3:12) there\',';
    const { fixes, refused } = planAbbreviationFixes(src);
    expect(fixes).toEqual([]);
    expect(refused).toHaveLength(1);
    expect(refused[0].candidates).toEqual(['Philemon', 'Philippians']);
  });

  it('fix-quote-abbreviation writes out a name only ONE book can match', () => {
    const src = 'x: \'he wrote "We have the mind of Christ" (1 Cor 2:16) there\',';
    const { fixes } = planAbbreviationFixes(src);
    expect(fixes).toHaveLength(1);
    expect(fixes[0].to).toBe('1 Corinthians 2:16');
    expect(fixes[0].replacement).toContain('(1 Corinthians 2:16)');
  });

  it('fix-quote-abbreviation keeps the translation tag it found', () => {
    // The six abbreviations hiding behind a tag are the reason the tool had to
    // learn to see tagged spans at all; losing the tag on the way out would
    // trade one defect for another.
    const src = 'x: \'he wrote "Man shall not live by bread alone" (Matthew 4:4, KJV) there\',';
    const { fixes, refused } = planAbbreviationFixes(src);
    expect(fixes).toEqual([]);                 // already written out
    expect(refused).toEqual([]);
    const abbrev = 'x: \'he wrote "the mind of Christ" (1 Cor 2:16, KJV) there\',';
    expect(planAbbreviationFixes(abbrev).fixes[0].replacement).toContain('(1 Corinthians 2:16, KJV)');
  });

  it('a reference in a COMMENT is left to the author who wrote the note', () => {
    const src = '// a note: "I press on" (1 Cor 2:16) is worth checking\nx: 1,';
    const { fixes, refused } = planAbbreviationFixes(src);
    expect(fixes).toEqual([]);
    expect(refused).toEqual([]);
  });

  it('proseName turns a corpus filename into what a facilitator would say', () => {
    expect(proseName('1Corinthians')).toBe('1 Corinthians');
    expect(proseName('SongofSolomon')).toBe('Song of Solomon');
    expect(proseName('Psalms')).toBe('Psalm');       // one psalm, as every written-out reference here reads
    expect(proseName('Habakkuk')).toBe('Habakkuk');
  });
});
