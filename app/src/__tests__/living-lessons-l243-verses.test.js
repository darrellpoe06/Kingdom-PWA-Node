// @vitest-environment node
// =============================================================================
// L243 — Earth Stewardship: the stork knows her appointed times (DR-1026)
// =============================================================================
// WHERE IT CAME FROM, AND WHY IT WAS NEARLY LOST. This teaching was written on
// 2026-08-16 inside PR #1255, as that branch's own "L80", against a catalog of
// 81 modules. main's ll80 is a different lesson entirely, so the module could
// never merge as a file and sat unmined for two months while #1255 stayed open.
// It was found by running L79's `re-review: 2026-10-17` EARLY — the same move
// that found L242's four missing strands a day earlier — and checking every
// lesson commit on #1255 against main rather than trusting the PR's title.
//
// THE ABSENCE WAS MEASURED, NOT ASSUMED (DR-0076). Against main at 7e6f254ca:
// "stork" appeared NOWHERE in app/src, Jeremiah 8:7 appeared in no lesson (the
// Jeremiah 8 hits are 8:11 and 8:22, in two unrelated lessons), and neither
// "Earth Stewardship" nor "appointed times" was carried by any module. L77 of
// that sitting IS in main as ll77; this one was not. So the four strands below
// are pinned BY VERSE, exactly as L242's are, so that losing them again fails
// the build instead of going quiet for another two months.
//
// WHAT THE 2026-08 MODULE WAS SHORT OF, measured on splice and fixed here:
//
//   1. A MISSING BAND. It carried child, teen and senior and NO youth band.
//      The four-band floor did not exist when it was written. A missing band
//      is a hole, not a style, so youth was authored here (0.93 of adult
//      prose) and sits between child and teen on the ladder by measurement.
//   2. THREE BANDS UNDER THE FLOOR. child 0.19, teen 0.35, senior 0.49 of
//      adult prose against floors of 0.50/0.60/0.60. Every band was expanded
//      to carry every movement of the adult lesson, not trimmed to fit.
//   3. FOUR STRAIGHT APOSTROPHES INSIDE QUOTATIONS — "the LORD's" three times
//      in Psalms 24:1 and "your enemies' land" in Leviticus 26:34 — where the
//      corpus carries the curly form (U+2019). The same class that bit L242.
//      Caught by the repo's gate, NOT by my own walk, which normalises both
//      sides and therefore cannot see it; that is recorded in DR-1026 as a
//      limitation of the ad-hoc tool rather than a near miss.
//   4. THREE ELIDED QUOTATIONS, closed the way DR-0459 prescribes — by quoting
//      MORE of the verse. Leviticus 19:9 and 19:10 are now two contiguous
//      spans with the reason ("I am the LORD your God") restored.
//   5. SIX RECITED RECORD IDS read at a reader, in the adult lesson, the
//      senior band and a benefit. Lifted out; the prose says the thing instead.
//   6. TALK DIRECTIONS ABSENT FROM ALL FIVE PLACES. The talk-together rule
//      post-dates the module (2026-10-01), so all three directions were
//      authored into the lesson and each of the four bands.
//   7. THREE QUOTED SPANS CARRYING THE HOST SENTENCE'S OWN PUNCTUATION, in
//      the quiz and the facilitator notes: "the poor of thy people may eat,"
//      (Exodus 23:11 reads a colon there), "a sabbath for the LORD."
//      (Leviticus 25:4 continues with a colon), and "some say." (our own
//      phrase, our own period). CAUGHT BY CI, NOT BY ME — I ran the 20 gates,
//      the curriculum gates, this file and six related suites locally, but
//      pushed while the full suite was still running, and
//      living-lessons-quoted-terminal.test.js is in it. The lesson is right
//      now; the process note is that "the gates I thought to run" is not the
//      same set as "the gates that exist".
//   8. NO STORIES AT ALL. Darrell set the standard 2026-07-21 — "Add at least
//      2 stories to each 25 minute lesson" (DR-0215 / DR-0855) — and this
//      module carried none. Two parables were authored, one light and one
//      solemn, which is the house pattern across the catalog. Neither body
//      contains a double quote, deliberately: the terminal-punctuation ratchet
//      records our OWN short dialogue tripping it by coincidence against
//      28,737 spans of corpus text, so a parable with no quoted spans cannot
//      add to that debt.
//   9. TWO CHECKS DISARMED BY THIS LESSON BEING APPENDED, not by anything
//      wrong in it. living-lessons-stories' proof case and
//      the-points-are-numbered-once-per-lesson both read
//      MODULES[length - 1] — so the newest lesson silently became their
//      subject. The first broke on `stories` being undefined; the second
//      asserted sectionCount > 3 against a lesson that is legitimately
//      2-section prose. The same class the L79 record named, from the other
//      direction: filling a gap disarmed three checks, appending past the end
//      disarmed two. The numbering check now FINDS a lesson that can exercise
//      it (ll242, 11 sections) instead of assuming the last one does.
//  10. TWO STALE CROSS-REFERENCES. The senior band cited "L79" for the
//      three-bucket discipline, which is #1255's OWN numbering; ll79 does not
//      exist on main at all (it is the held lesson of #2166, a different
//      teaching). On main that discipline is ll213, and the citation now says
//      so. This is the specific hazard of mining a module across branches.
//
// THE NUMBER WAS CHOSEN TO AVOID A COLLISION, not by taking the next one. main
// ends at DR-1024; the held #2166 holds DR-1025 unmerged. So this record takes
// DR-1026 and skips 1025 deliberately, rather than creating the collision
// renumber-decision-record.mjs (DR-1021) exists to clear.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { fleschKincaidGrade, ourProseOnly, NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { placesMissingDirections } from '../lib/talk-together.js';
// The Living Lessons days are RECORDED here by hand, not derived into
// lesson-dates.json — that file covers the other 49 courses and carries no
// living-lessons key at all. Reading the wrong one is how this test first
// failed, and it is worth the comment.
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';

const ID = 'll243-the-stork-knows-her-appointed-times';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];
const TEXTS = { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) };
const ALL = Object.keys(TEXTS);

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const bookFile = (book) => {
  const k = String(book).replace(/\s+/g, '');
  return k === 'Psalm' ? 'Psalms' : k;
};
const verse = (book, ch, n) => {
  const p = join(KJV, `${bookFile(book)}.json`);
  if (!existsSync(p)) return null;
  const chap = JSON.parse(readFileSync(p, 'utf8')).chapters[Number(ch) - 1];
  return chap ? norm(chap[Number(n) - 1]) : null;
};

// Every strand that was ABSENT from main's whole series, pinned by verse: the
// lesson text must carry a real span of each, and the span must be in the verse.
const STRANDS = [
  ['the stork keeping an appointment she was never taught', 'Jeremiah', 8, 7, 'the stork in the heaven knoweth her appointed times'],
  ['the covenant people who did not keep theirs', 'Jeremiah', 8, 7, 'but my people know not the judgment of the LORD'],
  ['the seventh-year rest, and WHO eats from it', 'Exodus', 23, 11, 'that the poor of thy people may eat: and what they leave the beasts of the field shall eat'],
  ['the rest named as worship, not as lost yield', 'Leviticus', 25, 4, 'a sabbath of rest unto the land, a sabbath for the LORD'],
  ['margin commanded: do not reap the corners', 'Leviticus', 19, 9, 'thou shalt not wholly reap the corners of thy field'],
  ['and the reason given for the margin', 'Leviticus', 19, 10, 'thou shalt leave them for the poor and stranger'],
  ['the forgotten sheaf, and where the blessing is fastened', 'Deuteronomy', 24, 19, 'that the LORD thy God may bless thee in all the work of thine hands'],
  ['the breeding female spared, with a long-life promise', 'Deuteronomy', 22, 7, 'thou shalt in any wise let the dam go'],
  ['rain promised as a schedule, never as a quantity', 'Deuteronomy', 11, 14, 'the rain of your land in his due season'],
  ['a season for every purpose', 'Ecclesiastes', 3, 1, 'To every thing there is a season'],
  ['the refused sabbaths collected in one block', '2Chronicles', 36, 21, 'to fulfil threescore and ten years'],
  ['the ownership question, settled first', 'Psalms', 24, 1, 'The earth is the LORD’s, and the fulness thereof'],
  ['the charge given as TWO verbs', 'Genesis', 2, 15, 'to dress it and to keep it'],
  ['the Father already feeding these birds', 'Matthew', 6, 26, 'yet your heavenly Father feedeth them'],
  ['the beast and the young ravens', 'Psalms', 147, 9, 'He giveth to the beast his food, and to the young ravens which cry'],
  ['regard for an animal as a diagnostic', 'Proverbs', 12, 10, 'A righteous man regardeth the life of his beast'],
  ['the seasons held in place by covenant', 'Genesis', 8, 22, 'seedtime and harvest, and cold and heat, and summer and winter'],
];

const whole = ALL.map((k) => TEXTS[k]).join('\n');

describe('L243 exists, is numbered, and is dated', () => {
  it('is in the catalog exactly once', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
  });

  it('takes 243 — a number no other module holds', () => {
    const claimed = LIVING_LESSONS_MODULES
      .map((m) => /^ll(\d+)-/.exec(m.id))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 243)).toHaveLength(1);
  });

  it('does NOT take 211 or 212, and leaves 79 to the lesson that fills it', () => {
    // 211 and 212 are still open and recorded as KNOWN_GAPS. Filling one by
    // accident here would disarm those checks.
    const claimed = new Set(LIVING_LESSONS_MODULES.map((m) => (/^ll(\d+)-/.exec(m.id) || [])[1]).map(Number));
    for (const n of [211, 212]) expect(claimed.has(n), `${n} is not this lesson's to fill`).toBe(false);
    // 79 IS NO LONGER A HOLE. It was one when this check was written -- the
    // comment on the original said so: "79 is #2166's held lesson". That
    // lesson (DR-1025) is on this branch and fills it, so asserting 79 is
    // UNCLAIMED now fails for a reason that has nothing to do with this
    // lesson. The question the check actually means is still asked, and more
    // strictly: 211 and 212 are still open holes nobody may fill by
    // accident, and 79 is claimed EXACTLY ONCE, by the lesson whose number
    // it is. A lesson that drifted onto 79 would make that count 2.
    expect(
        LIVING_LESSONS_MODULES.filter((m) => /^ll79-/.test(m.id)).length,
        '79 is claimed exactly once, by the lesson whose number it is',
    ).toBe(1);
  });

  it('carries a day, and it is the COMMIT day rather than the August writing day', () => {
    expect(LIVING_LESSONS_ADDED[ID], 'a new lesson joins at birth (DR-0621)').toBe('2026-10-14');
  });

  it('is dated no earlier than the lesson numbered before it', () => {
    // The whole reason the commit day was chosen over the 2026-08-16 writing
    // day: this module sits at the END of the series, so an August day would
    // make 243 older than 242 and split "by number, oldest first" into two.
    const before = Object.entries(LIVING_LESSONS_ADDED).find(([k]) => k.startsWith('ll242-'));
    expect(before, 'll242 is dated').toBeTruthy();
    expect(LIVING_LESSONS_ADDED[ID] >= before[1], `${LIVING_LESSONS_ADDED[ID]} must not precede ll242's ${before[1]}`).toBe(true);
  });
});

describe('every strand that was missing from the whole series is here, and is His words', () => {
  it.each(STRANDS)('%s — %s %s:%s', (_why, book, ch, n, span) => {
    const v = verse(book, ch, n);
    expect(v, `${book} ${ch}:${n} resolves in the local corpus`).toBeTruthy();
    expect(v.includes(span), `the span is not in ${book} ${ch}:${n}`).toBe(true);
    expect(whole.includes(span), `the lesson does not carry ${book} ${ch}:${n}`).toBe(true);
  });

  it('names the stork, which appeared nowhere in the series before this', () => {
    expect(/\bstork\b/i.test(whole)).toBe(true);
  });

  it('carries Jeremiah 8:7 in EVERY place, because the rebuke is the lesson', () => {
    for (const k of ALL) {
    expect(/appointed times/i.test(TEXTS[k]), `${k} drops the appointed times`).toBe(true);
    }
  });
});

describe('every quoted span is the verse, with no elision anywhere', () => {
  const RE = /"([^"]{10,})"\s*\(([1-3]?\s?[A-Z][A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
  const spans = [];
  const walk = (node, path) => {
    if (typeof node === 'string') {
      RE.lastIndex = 0;
      let g;
      while ((g = RE.exec(node))) spans.push({ path, quoted: g[1], book: g[2], ch: g[3], label: g[4].trim() });
    } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(L, '');

  it('finds a substantial number of referenced spans to check', () => {
    expect(spans.length).toBeGreaterThan(60);
  });

  it('every referenced span is verbatim in the verse it cites', () => {
    const bad = [];
    for (const s of spans) {
      const nums = [];
      for (const part of s.label.split(',')) {
        const r = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
        if (r) for (let i = Number(r[1]); i <= Number(r[2]); i += 1) nums.push(i);
        else if (part.trim()) nums.push(Number(part.trim()));
      }
      const joined = nums.map((n) => verse(s.book, s.ch, n)).join(' ');
      if (!joined || !norm(joined).includes(norm(s.quoted))) {
        bad.push(`${s.path} :: ${s.book} ${s.ch}:${s.label} :: "${s.quoted.slice(0, 70)}"`);
      }
    }
    expect(bad, `not His words as written:\n${bad.join('\n')}`).toEqual([]);
  });

  it('uses the corpus apostrophe, not the straight one, inside quotations (proven-to-catch)', () => {
    // The real defect: "the LORD's" and "enemies' land" were written with a
    // straight apostrophe where the corpus carries U+2019, three and one time
    // over. My own walk normalises both sides and could not see it.
    for (const s of spans) {
    expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a quotation`).toBe(false);
    }
    // And the same text with the curly form swapped back out stops matching.
    const real = verse('Psalms', 24, 1);
    expect(real.includes('The earth is the LORD’s')).toBe(true);
    expect(real.includes("The earth is the LORD's"), 'the straight form is NOT the verse').toBe(false);
  });

  it('marks no elision in any reader field', () => {
    expect(elidedQuotations(L)).toEqual([]);
  });

  it('would still catch an elision if one were reintroduced (proven-to-catch)', () => {
    const faked = { ...L, lesson: 'He said "the stork in the heaven... observe the time of their coming" (Jeremiah 8:7).' };
    expect(elidedQuotations(faked).length).toBeGreaterThan(0);
  });

  it('recites no decision record at a reader', () => {
    expect(recitedRecords(L)).toEqual([]);
  });

  it('would still catch a recited record (proven-to-catch)', () => {
    const faked = { ...L, bigIdea: 'Stated plainly rather than hedged (DR-0100).' };
    expect(recitedRecords(faked).length).toBeGreaterThan(0);
  });
});

describe('four bands, each carrying the whole message', () => {
  const measured = measureFullness(L);

  it('carries a youth band at all — the hole the 2026-08 module had', () => {
    expect(typeof L.levels.youth).toBe('string');
    expect(measured.bands.youth.words).toBeGreaterThan(900);
  });

  it.each(BANDS)('%s clears its floor as a share of adult prose', (b) => {
    expect(measured.bands[b].share).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('reports no short band', () => {
    expect(shortBands(measured)).toEqual([]);
  });

  it('would still report a band cut back below its floor (proven-to-catch)', () => {
    const faked = { ...L, levels: { ...L.levels, teen: L.levels.teen.slice(0, 400) } };
    expect(shortBands(measureFullness(faked))).toContain('teen');
  });

  it('every band names its own lesson near the start', () => {
    expect(unnamedBands(L)).toEqual([]);
  });

  it('keeps the bands genuinely different from one another', () => {
    expect(duplicatedBands(measureDifferentiation(L))).toEqual([]);
    for (const v of Object.values(measureDifferentiation(L))) {
      if (typeof v === 'number') expect(v).toBeLessThan(DIFF_CEILING);
    }
  });

  it('sends the reader all three ways in every place', () => {
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it('would still catch a band that stopped sending the reader anywhere (proven-to-catch)', () => {
    const faked = { ...L, levels: { ...L.levels, child: 'The stork knows her appointed times and the land keeps a sabbath.' } };
    const gaps = placesMissingDirections(faked).find((g) => g.place === 'child');
    expect(gaps && gaps.missing.length).toBeGreaterThan(0);
  });
});

describe('it carries its two stories, which the mined module had none of', () => {
  it('carries at least two real stories', () => {
    const real = (L.stories || []).filter((s) => s.kind === 'parable' || s.kind === 'testimony');
    expect(real.length).toBeGreaterThanOrEqual(2);
  });

  it('follows the house pattern of one light and one solemn', () => {
    const tones = (L.stories || []).map((s) => s.tone);
    expect(tones).toContain('light');
    expect(tones).toContain('solemn');
  });

  it('every story says truthfully what it is, and carries a title and a body', () => {
    for (const s of L.stories) {
    expect(['parable', 'testimony']).toContain(s.kind);
    expect(String(s.title).length).toBeGreaterThan(8);
    expect(String(s.body).trim().split(/\s+/).length).toBeGreaterThan(120);
    }
  });

  it('holds no double-quoted span at all, so it cannot grow the terminal debt', () => {
    // Deliberate: the terminal ratchet records our own short dialogue matching
    // corpus text by coincidence ("some say", "when", "watch"). A parable with
    // no quoted spans cannot add to that debt.
    for (const s of L.stories) expect(String(s.body)).not.toMatch(/"/);
  });

  it('teaches the lesson rather than decorating it', () => {
    const bodies = L.stories.map((s) => s.body).join(' ').toLowerCase();
    expect(/margin/.test(bodies), 'neither story reaches the margin').toBe(true);
    expect(/rest|tired/.test(bodies), 'neither story reaches the rest').toBe(true);
  });
});

describe('the reading ladder rises and never inverts', () => {
  const g = (k) => fleschKincaidGrade(ourProseOnly(TEXTS[k]));

  it('is not inverted', () => {
    expect(isInverted(measureLesson(L)), 'the ladder inverts').toBe(false);
  });

  it('keeps the child band under the ceiling a new lesson is held to', () => {
    expect(g('child')).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
  });

  it('puts youth a clear step above child, and senior a clear step above teen', () => {
    expect(g('youth')).toBeGreaterThan(g('child') + 1);
    expect(g('teen')).toBeGreaterThan(g('youth') + 1);
    expect(g('senior')).toBeGreaterThan(g('teen') + 1);
  });
});

describe('the mining hazards this module actually carried', () => {
  it('cites L213 for the three-bucket discipline, never #1255’s own L79', () => {
    // ll79 does not exist on main; it is #2166's held lesson, a different
    // teaching. A cross-reference mined from another branch's numbering points
    // at nothing, or worse, at the wrong lesson.
    expect(/\bL213\b/.test(L.levels.senior)).toBe(true);
    expect(/\bL79\b/.test(whole), 'a stale cross-reference survived the mining').toBe(false);
  });

  it('keeps the three buckets apart rather than claiming a prediction', () => {
    for (const k of ['adult', 'teen', 'senior', 'youth']) {
    expect(/STATES|states/.test(TEXTS[k]), `${k} drops the bucket sort`).toBe(true);
    expect(/MEASURED|measured/.test(TEXTS[k])).toBe(true);
    expect(/REASONED|reasoned/.test(TEXTS[k])).toBe(true);
    }
  });

  it('refuses the proof-text reading out loud, in every band that can carry it', () => {
    for (const k of ['adult', 'teen', 'senior', 'youth']) {
    expect(/not\b[^.]{0,60}(predicted|anticipated|science book)/i.test(TEXTS[k]), `${k} never refuses the proof-text`).toBe(true);
    }
  });

  it('preaches the sober half, not only the win-win', () => {
    for (const k of ALL) {
      // "seventy-year block" and "threescore and ten years" both count: the
      // first version of this check said "seventy years" and failed the senior
      // band, which preaches the ledger in the hyphenated form. The regex was
      // narrower than the prose, so the regex was wrong, not the band.
    expect(/threescore and ten|seventy[- ]year/i.test(TEXTS[k]), `${k} drops the exile ledger`).toBe(true);
    }
  });

  it('keeps BOTH verbs of the garden mandate in every place', () => {
    for (const k of ALL) {
    expect(/dress/i.test(TEXTS[k]), `${k} drops "dress it"`).toBe(true);
    expect(/keep it/i.test(TEXTS[k]), `${k} drops "keep it"`).toBe(true);
    }
  });

  it('says the timing hinge, which is the transferable half', () => {
    for (const k of ALL) {
    expect(/due season/i.test(TEXTS[k]), `${k} drops the due season`).toBe(true);
    }
  });

  it('names Yahweh in our own voice and leaves the quotations alone (DR-0210)', () => {
    for (const k of ALL) {
      const ours = ourProseOnly(TEXTS[k]);
    expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
    expect(/\bGod(?:'s|’s)?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
    }
    // And the quoted text is untouched: Leviticus 19:10 ends "I am the LORD
    // your God", and it stays exactly that.
    expect(whole.includes('I am the LORD your God')).toBe(true);
  });
});
