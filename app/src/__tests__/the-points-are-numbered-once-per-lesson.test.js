// @vitest-environment node
// =============================================================================
// THE NUMBERS BELONG TO THE LESSON, NOT TO THE STEP ON SCREEN (DR-0520)
// =============================================================================
// Darrell 2026-09-19, with two screenshots of L175 open on his phone:
//
//   "Stop adding numbers that don't make sense!!!!!!! Make it make sense!!!!!!!
//    Why do we count from 1 - whatever each section?!!!!!!!"
//   "Obvious!!!!!!!!!!!!!!!!!!!!!"
//
// It was obvious, and he had already raised it once (the L88 screenshot: "This
// Lesson has numbers that are confusing... 1 2 3 throughout... why?"). The
// screenshots show STEP 1 OF 13 rendering headings 1, 2 and 3; STEP 2 OF 13
// opening with another heading numbered 1; STEP 3 OF 13 rendering 1 and then 2.
// Three different points visible on one screen, all called 1.
//
// THE CAUSE IS MECHANICAL, not authorial. The paced reader chunks a band into
// steps and called formatLessonText ONCE PER STEP, so the auto counter reset at
// every step boundary — and so did the hasExplicit decision, which means a step
// containing an explicit FIRST/SECOND marker used the author's numbers while
// its neighbours auto-counted.
//
// MEASURED on the real ll176 adult band, 13 segments, before the fix:
//   step:n = 1:1 1:2 1:3 2:1 3:1 3:2 4:1 5:1 6:1 7:1 8:1 9:1 10:1 11:1 12:1 12:2
// and after:
//   step:n = 1:1 1:2 1:3 2:4 3:5 3:6 4:7 5:8 5:9 6:10 7:11 8:12 9:13 10:14 11:15 12:16 12:17
//
// NOT ONE WORD OF ANY LESSON CHANGES. The formatter only chooses break points
// at existing spaces and which number is rendered beside a heading the author
// already wrote; this fix changes only the number.
import { describe, it, expect } from 'vitest';
import { formatLessonText, lessonSectionPlan, lessonShareText } from '../lib/lesson-format.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { chunkLessonForAge } from '../lib/learn-framework.js';

const headingsOf = (text, plan) =>
  formatLessonText(text, plan).items.filter((i) => i.kind === 'heading');
const numbersAcross = (segments, plan) =>
  segments.flatMap((s) => headingsOf(s, plan).map((h) => h.n));

describe('PROVEN-TO-CATCH: the defect Darrell photographed', () => {
  const L = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll176-'));
  const segments = chunkLessonForAge(L.lesson, 'adult');

  it('the old behaviour — formatting each step alone — really does restart at 1', () => {
    // This is what the screenshots show, reproduced from the live lesson. If a
    // future change made per-chunk formatting continuous by accident, this
    // would fail and the gate below would be measuring nothing.
    expect(segments.length).toBeGreaterThan(3);
    const perChunk = numbersAcross(segments, null);
    expect(perChunk.filter((n) => n === 1).length,
      'per-chunk numbering no longer restarts, so this gate proves nothing').toBeGreaterThan(1);
  });

  it('with one plan for the whole lesson, the count runs straight through', () => {
    const plan = lessonSectionPlan(segments.join(' '));
    const ns = numbersAcross(segments, plan);
    expect(ns.length).toBeGreaterThan(5);
    expect(ns).toEqual(ns.map((_, i) => i + 1));
  });
});

describe('every lesson, every band, counts once', () => {
  // The whole series, at the band that chunks hardest, so a lesson that numbers
  // itself twice cannot hide behind a band that happens to fit in one step.
  const BANDS = ['child', 'youth', 'teen', 'adult', 'senior'];
  const textFor = (m, band) => (band === 'adult' ? m.lesson : (m.levels && m.levels[band]) || '');

  it('no band of any lesson ever renders the same point number twice', () => {
    const faults = [];
    for (const m of LIVING_LESSONS_MODULES) {
      for (const band of BANDS) {
        const text = textFor(m, band);
        if (!text) continue;
        const segments = chunkLessonForAge(text, band);
        if (segments.length < 2) continue;
        const plan = lessonSectionPlan(segments.join(' '));
        // Where the AUTHOR numbered their own points, the numbers are theirs
        // and this gate does not overrule them. ll23 writes FIRST twice — once
        // opening a top-level point and once opening a sub-list inside it — so
        // its plan really does read 1, 1, 2. That is authored, it predates this
        // fix, and rewriting it would change a lesson's own structure, which
        // this change is not allowed to do. Recorded rather than silently
        // exempted: DR-0520 carries it with re-review 2026-09-26.
        if (plan.hasExplicit) continue;
        const ns = numbersAcross(segments, plan);
        const seen = new Set();
        for (const n of ns) {
          if (seen.has(n)) { faults.push(`${m.id} · ${band}: point ${n} rendered twice`); break; }
          seen.add(n);
        }
      }
    }
    expect(faults, faults.slice(0, 10).join('\n')).toEqual([]);
  });

  it('the numbers a reader sees are the lesson plan, in order, with nothing skipped', () => {
    const faults = [];
    for (const m of LIVING_LESSONS_MODULES) {
      for (const band of BANDS) {
        const text = textFor(m, band);
        if (!text) continue;
        const segments = chunkLessonForAge(text, band);
        const plan = lessonSectionPlan(segments.join(' '));
        if (plan.hasExplicit) continue; // the author's own numbers are theirs
        const ns = numbersAcross(segments, plan);
        if (!ns.length) continue;
        for (let i = 0; i < ns.length; i += 1) {
          if (ns[i] !== i + 1) { faults.push(`${m.id} · ${band}: point ${i + 1} rendered as ${ns[i]}`); break; }
        }
      }
    }
    expect(faults, faults.slice(0, 10).join('\n')).toEqual([]);
  });
});

describe('NOT ONE WORD CHANGES — the reconstruction still holds', () => {
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

  it('joining every item reproduces the text exactly, plan or no plan', () => {
    for (const m of LIVING_LESSONS_MODULES.slice(-25)) {
      const segments = chunkLessonForAge(m.lesson, 'adult');
      const plan = lessonSectionPlan(segments.join(' '));
      for (const s of segments) {
        for (const p of [null, plan]) {
          const joined = formatLessonText(s, p).items.map((i) => i.text).join(' ');
          expect(norm(joined), `${m.id} lost or gained words`).toBe(norm(s));
        }
      }
    }
  });

  it('a plan changes the NUMBER on a heading and never which words are in it', () => {
    for (const m of LIVING_LESSONS_MODULES.slice(-25)) {
      const segments = chunkLessonForAge(m.lesson, 'adult');
      const plan = lessonSectionPlan(segments.join(' '));
      for (const s of segments) {
        const plain = formatLessonText(s, null).items;
        const planned = formatLessonText(s, plan).items;
        // Headings may differ at a chunk boundary — the plan sees the sentence
        // AFTER the cut and the chunk cannot — but every heading the planned
        // pass emits is a whole sentence of this chunk, never a rewritten one.
        for (const h of planned.filter((i) => i.kind === 'heading')) {
          expect(norm(s).includes(norm(h.text)), `${m.id}: invented heading text`).toBe(true);
        }
        expect(plain.map((i) => i.text).join(' ').length).toBe(planned.map((i) => i.text).join(' ').length);
      }
    }
  });
});

// =============================================================================
// EVERY lesson's own numbers, not just the newest one's (DR-1256)
// =============================================================================
// The check below ("a single-text caller is unaffected") walks the catalog in
// REVERSE and tests the FIRST lesson with more than three sections, so the
// newest qualifying lesson inherits the seat and every earlier one goes
// unexamined. Its own comment already names that hazard for a different
// reason. MEASURED 2026-10-27, when ll267 landed and took the seat: five
// lessons ALREADY SHIPPED whose own numbers skip, and the one-subject check
// had never looked at any of them.
//
// WHAT THE RULE IS, and why it is not "contiguous 1..N". The formatter derives
// numbers from markers the AUTHOR wrote -- its own words: "The author's number
// is the number." So a lesson carrying TWO enumerated lists legitimately reads
// 1,2,3,4 then 1,2: the second list restarts, which is ordinary English and
// what three live lessons do (ll46, ll123, ll128). Demanding contiguity across
// the catalog would have forced prose rewrites on those three for no reader
// benefit -- a gate dictating style rather than catching a defect.
//
// A SKIP is the defect. 3 -> 5 is not a new list and not the next point; the
// reader sees the lesson's own count jump, as though a section were missing.
// Verified it is the text and not the formatter: ll135 contains no "FOUR",
// "SEVEN" or "NINE" anywhere, and ll165 no "SECOND", "SIXTH" or "SEVENTH" --
// the markers are absent, not merely undetected.
//
// So: a heading number must be the previous one plus one, or 1 (a new list),
// and the first must be 1.
const SKIPPED_NUMBERS_ON_DISK = [
  // Each of these five numbers its own points with gaps, in the author's own
  // text. They are NOT fixed here: renumbering an ordinal rewrites prose that
  // each lesson's own spec pins by literal string (proven on ll267 the same
  // day -- rewording three of its sentences turned its own gate red), and the
  // ordinals are cross-referenced from the age bands. Each needs its own pass
  // with its spec in hand, which is work, not a line here.
  // SHRINK-ONLY: a new offender fails below even though the count is unchanged,
  // and a fixed one must be struck from this list. re-review: 2026-11-17.
  'll135-they-called-every-one-of-them-george-the-name-they-took-the-porter-at-the-door-and-the-wage-yahweh-legislated',
  'll136-touched-with-the-feeling-the-high-priest-who-felt-the-whole-weight-and-why-his-judgment-never-needed-your-experience-to-be-true',
  'll165-i-always-had-love-gratitude-measured-against-a-real-lack-and-suffering-with-him-before-reigning-with-him',
  'll166-life-is-disrespectful-so-think-on-these-things-self-against-the-servant-king-and-the-one-who-bought-you-twice',
  'll167-be-a-g-about-it-execute-the-fourteen-love-verbs-high-or-low-because-it-is-not-about-how-you-feel',
];

/** Every number a reader would see, in order, for one lesson's own text. */
export function headingNumbers(lessonText) {
  return formatLessonText(lessonText).items.filter((i) => i.kind === 'heading').map((h) => h.n);
}

/** '' when the sequence is legal; otherwise what a reader would see go wrong. */
export function skipFault(ns) {
  if (!ns.length) return '';
  if (ns[0] !== 1) return `starts at ${ns[0]}, not 1`;
  for (let i = 1; i < ns.length; i += 1) {
    if (ns[i] === ns[i - 1] + 1) continue;
    if (ns[i] === 1) continue; // a second enumerated list, which is legitimate
    return `${ns[i - 1]} -> ${ns[i]}`;
  }
  return '';
}

describe('every lesson numbers its own points without skipping (DR-1256)', () => {
  const subjects = LIVING_LESSONS_MODULES.filter(
    (m) => typeof m.lesson === 'string' && formatLessonText(m.lesson).sectionCount > 3,
  );

  it('finds enough lessons to be worth checking (the sweep is not vacuous)', () => {
    expect(subjects.length).toBeGreaterThan(120);
  });

  it('no lesson outside the pinned list skips a number', () => {
    const faults = subjects
      .map((m) => ({ id: m.id, fault: skipFault(headingNumbers(m.lesson)) }))
      .filter((x) => x.fault);
    const unknown = faults.filter((x) => !SKIPPED_NUMBERS_ON_DISK.includes(x.id));
    expect(
      unknown.map((x) => `${x.id}: ${x.fault}`),
      'a lesson skips a point number a reader can see',
    ).toEqual([]);
  });

  it('the pinned debt may only SHRINK, never grow', () => {
    const faults = subjects.filter((m) => skipFault(headingNumbers(m.lesson)));
    expect(faults.length).toBeLessThanOrEqual(SKIPPED_NUMBERS_ON_DISK.length);
    // And every pin must still be a real offender, so a fixed lesson cannot sit
    // here forever pretending the debt is larger than it is.
    const ids = faults.map((m) => m.id);
    const stale = SKIPPED_NUMBERS_ON_DISK.filter((id) => !ids.includes(id));
    expect(stale, 'pinned as skipping but no longer does — strike it from the list').toEqual([]);
  });

  it('a second enumerated list is LEGITIMATE and is not reported', () => {
    // ll46 reads 1,2,3,4 then 1,2: two lists, the author's own numbering.
    expect(skipFault([1, 2, 3, 4, 1, 2])).toBe('');
    expect(skipFault([1, 1, 2, 3, 4])).toBe('');
    expect(skipFault([1, 2, 1, 2, 3])).toBe('');
    // and the three live lessons that do it are not in the pinned list
    for (const p of ['ll46-', 'll123-', 'll128-']) {
      const m = LIVING_LESSONS_MODULES.find((x) => x.id.startsWith(p));
      expect(skipFault(headingNumbers(m.lesson)), `${p} must read as legitimate`).toBe('');
      expect(SKIPPED_NUMBERS_ON_DISK.some((id) => id.startsWith(p))).toBe(false);
    }
  });

  it('PROVEN TO CATCH: the five real shapes, and a skip after a restart', () => {
    expect(skipFault([1, 2, 3, 5, 6, 8, 10, 11])).toBe('3 -> 5');      // ll135
    expect(skipFault([1, 2, 3, 4, 7, 8, 10, 11, 12])).toBe('4 -> 7');  // ll136
    expect(skipFault([1, 3, 4, 5, 8])).toBe('1 -> 3');                 // ll165
    expect(skipFault([1, 2, 5, 6, 7])).toBe('2 -> 5');                 // ll166
    expect(skipFault([1, 2, 3, 4, 6, 7, 8])).toBe('4 -> 6');           // ll167
    expect(skipFault([2, 3, 4])).toBe('starts at 2, not 1');
    // a restart is legal, but a skip INSIDE the second list is still caught
    expect(skipFault([1, 2, 1, 3])).toBe('1 -> 3');
  });
});

describe('a single-text caller is unaffected', () => {
  it('formats a whole lesson exactly as it always did when no plan is passed', () => {
    // THIS CHECK NOW FINDS ITS EXAMPLE RATHER THAN PINNING THE NEWEST LESSON.
    // It used to read LIVING_LESSONS_MODULES[length - 1], so whatever landed
    // last silently became its subject. ll243 is continuous prose with 2
    // sections — legitimate for that lesson, and it broke a check that is
    // about NUMBERING, not about the newest lesson's shape. Same class as the
    // three checks the L79 gap disarmed (DR-1025): a check whose evidence can
    // expire stops meaning something while still printing green. The
    // assertions below are unchanged; only their subject is now chosen
    // because it can actually exercise them.
    const m = [...LIVING_LESSONS_MODULES]
      .reverse()
      .find((x) => typeof x.lesson === 'string' && formatLessonText(x.lesson).sectionCount > 3);
    expect(m, 'no lesson in the catalog carries more than three sections').toBeTruthy();
    const { items, sectionCount } = formatLessonText(m.lesson);
    expect(sectionCount).toBeGreaterThan(3);
    const ns = items.filter((i) => i.kind === 'heading').map((i) => i.n);
    expect(ns).toEqual(ns.map((_, i) => i + 1));
  });

  it('the share text still numbers its sections and keeps every word', () => {
    const m = LIVING_LESSONS_MODULES[LIVING_LESSONS_MODULES.length - 1];
    const share = lessonShareText(m.lesson);
    expect(share).toMatch(/^1\. /m);
    expect(share.replace(/^\d+\.\s/gm, '').replace(/\s+/g, ' ').trim())
      .toBe(String(m.lesson).replace(/\s+/g, ' ').trim());
  });

  it('empty and non-string input stay inert', () => {
    expect(formatLessonText('').items).toEqual([]);
    expect(formatLessonText(null).items).toEqual([]);
    expect(lessonSectionPlan(null)).toEqual({ hasExplicit: false, headings: [], total: 0 });
  });
});
