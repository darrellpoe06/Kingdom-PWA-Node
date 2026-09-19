// @vitest-environment node
// =============================================================================
// Is the quotation the verse it NAMES? And are His names ever lowered?
// =============================================================================
// The existing quotation gate (quotation-integrity-gate.test.js) asks whether a
// quoted span carries an ellipsis and whether its pieces are real Scripture. It
// answers the second by searching one concatenated blob of the whole KJV, which
// leaves two things it cannot see, both found by measurement on 2026-09-19:
//
//   1. It never parses the reference. Four spans in L104 printed
//      "Thus saith the LORD of hosts; Consider your ways." under (Haggai 1:5).
//      That is Haggai 1:7 word for word; 1:5 opens "Now therefore thus saith".
//      The words existed SOMEWHERE, so the blob search passed them.
//   2. It never looks at a span without an ellipsis -- elidedQuotations() opens
//      with `if (!ELLIPSIS.test(m[1])) continue;`. L39 stitched John 1:1 to
//      John 1:14 with ", and" under a single "(John 1:1,14)" and no gate saw it,
//      precisely because there was no ellipsis to find.
//
// THE FIRST RUN, and what it cost. 25,192 referenced spans across 178 lessons.
// 0 references failed to resolve -- the 'Psalm' -> Psalms.json alias matters,
// because without it every psalm in the series reads as unresolvable. 18 spans
// were not the verse they named, and all 18 were repaired the same session:
// seven had lowered a capital the verse itself carries (Consider, Render, Open,
// Then, If, That); two had ADDED capitals to His words (JOY, SON) and the
// emphasis was moved into our sentence instead; one replaced "Ephraim" with a
// question mark; one put our own gerunds in His quotation marks; the rest
// dropped a word ("But", "and live", "Neither as being") or, in Matthew 24,
// cited "Watch" to verse 44 when it is verse 42.
//
// ZERO IS THE COMMITTED NUMBER -- no baseline. quotation-integrity is a ratchet
// because each of its 745 entries needs a human judgement. This is not that:
// the corpus is clean on this question today, so a baseline would be nothing but
// a place for the next defect to hide.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { LITTLE_LEARNERS_MODULES } from '../lib/little-learners-class.js';
import { readerTexts } from '../../../scripts/quotation-integrity.mjs';
import {
  bookFile, verseText, shoutedWords, loweredHolyNames, checkSpan,
  scanQuotedVerses, describeFault,
} from '../../../scripts/quoted-verse-is-the-verse.mjs';

describe('the measure is sound before anything is measured with it', () => {
  it('resolves a book the way PROSE writes it, not the way the file is named', () => {
    // The whole series says "Psalm 23:1"; the corpus file is Psalms.json. Without
    // this one alias every psalm we quote would read as an unresolvable
    // reference, and the gate would be loudest exactly where it is most wrong.
    expect(bookFile('Psalm')).toBe('Psalms');
    expect(bookFile('Psalms')).toBe('Psalms');
    expect(bookFile('John')).toBe('John');
    expect(bookFile('Hezekiah')).toBeNull();
  });

  it('fetches a verse, a comma list and a range, and refuses what does not exist', () => {
    expect(verseText('John', 11, '35')).toBe('Jesus wept.');
    expect(verseText('Psalm', 117, '1-2')).toContain('For his merciful kindness is great');
    expect(verseText('Haggai', 1, '5,7')).toBe(
      'Now therefore thus saith the LORD of hosts; Consider your ways. Thus saith the LORD of hosts; Consider your ways.',
    );
    expect(verseText('John', 11, '999')).toBeNull();
    expect(verseText('John', 99, '1')).toBeNull();
  });

  it('tells the verse it NAMES from the verse next door', () => {
    // This is the defect the blob search could not see, kept as a live example.
    const span = { quoted: 'Thus saith the LORD of hosts; Consider your ways.', book: 'Haggai', chapter: '1', verses: '5' };
    expect(checkSpan(span).kind).toBe('not-the-verse');
    expect(checkSpan({ ...span, verses: '7' })).toBeNull();
  });

  it('a span with no ellipsis is judged too -- which the old gate never did', () => {
    // "(John 1:1,14)" over ", and" reads as one sentence and has no ellipsis.
    expect(checkSpan({
      quoted: 'the Word was God, and the Word was made flesh', book: 'John', chapter: '1', verses: '1,14',
    }).kind).toBe('not-the-verse');
  });

  it('keeps the case He wrote -- in both directions', () => {
    // Lowering His capital is a fault: the imperative carries the command.
    expect(checkSpan({ quoted: 'consider your ways', book: 'Haggai', chapter: '1', verses: '7' }).kind).toBe('not-the-verse');
    // And so is adding ours. The KJV's own "LORD" is His and passes untouched.
    expect(shoutedWords('shout for JOY', 'shout for joy, all ye')).toEqual(['JOY']);
    expect(shoutedWords('Be glad in the LORD', 'Be glad in the LORD, and rejoice')).toEqual([]);
  });

  it('His names are never lowered in our voice, and the Word is never touched to match', () => {
    expect(loweredHolyNames('We follow jesus here.')).toEqual(['jesus']);
    expect(loweredHolyNames('We follow Jesus here.')).toEqual([]);
    // A quotation is stripped before the scan, so verbatim Scripture is safe.
    expect(loweredHolyNames('Peter says "thou art the Christ" and the christ is King')).toEqual(['christ']);
    // Only names with no second sense are in the set: Layer 0 itself lowercases
    // the false gods, and a parable's master is a lord.
    expect(loweredHolyNames('they served other gods, and the lord of the vineyard came')).toEqual([]);
  });
});

describe('THE LIVE SERIES — measured, not asserted', () => {
  const series = [
    ['Living Lessons', LIVING_LESSONS_MODULES],
    ['Little Learners', LITTLE_LEARNERS_MODULES],
  ];

  it('scans a real corpus, so a pass means something', () => {
    // Anti-theater: if the import broke or readerTexts stopped returning fields,
    // every assertion below would pass on nothing at all.
    const scan = scanQuotedVerses(LIVING_LESSONS_MODULES, readerTexts);
    expect(scan.measuredLessons).toBeGreaterThan(170);
    expect(scan.spans).toBeGreaterThan(20_000);
  });

  for (const [name, modules] of series) {
    it(`${name}: every quotation is the verse it names`, () => {
      const scan = scanQuotedVerses(modules, readerTexts);
      expect(
        scan.faults.map(describeFault),
        `${scan.faults.length} of ${scan.spans} quoted spans are not what they claim`,
      ).toEqual([]);
    });
  }

  it('PROVEN-TO-CATCH: each of the four faults is reported on a COPY of the real series', () => {
    // A gate is only worth its green if it goes red. Every case below is a real
    // defect this gate found and the session repaired.
    const one = LIVING_LESSONS_MODULES[0];
    // Only the bent lesson's own faults, so a defect elsewhere in the series
    // could never make this pass by accident.
    const bend = (lesson) => scanQuotedVerses(
      LIVING_LESSONS_MODULES.map((m) => (m === one ? { ...m, lesson } : m)), readerTexts,
    ).faults.filter((f) => f.id === one.id).map((f) => f.kind);

    const REAL = 'Thus saith the LORD of hosts; Consider your ways.';
    // The exact L104 defect: verbatim 1:7, cited to 1:5, which opens "Now
    // therefore thus saith". The old blob search passed this 4 times.
    expect(bend(`He says "${REAL}" (Haggai 1:5)`)).toContain('not-the-verse');
    expect(bend(`He says "${REAL}" (Haggai 1:7)`)).toEqual([]);
    expect(bend('He says "shout for JOY" (Psalm 32:11)')).toContain('shouted');
    expect(bend('He says "consider your ways" (Haggai 1:7)')).toContain('not-the-verse');
    expect(bend(`Written of jesus, who said "${REAL}" (Haggai 1:7)`)).toContain('lowered');
    expect(bend(`He says "${REAL}" (Haggai 9:9)`)).toContain('unresolvable');
  });
});
