import { describe, it, expect } from 'vitest';
import { spliceAppend, LEDGER_FILES } from '../../../scripts/splice-append.mjs';

// ===========================================================================
// THE CATALOG MERGE RESOLVES ITSELF, OR IT REFUSES.
//
// Nine Living Lessons built in parallel from one queue all append at the same
// point in the catalog, so every landing conflicts there and git interleaves
// the two lesson objects into several hunks. `keep-prs-current.yml` meets the
// same files and says they are "the owner's call". Hand-stitching interleaved
// hunks inside JSON-ish lesson objects, once per lesson, is how a lesson
// silently loses a brace or an age band.
//
// The weight here is on the REFUSALS, not the happy path. A resolver that
// guesses is worse than a conflict, because a conflict is visible.
// ===========================================================================

const CATALOG = 'app/src/lib/living-lessons-class.js';

// A catalog shaped like the real one: a header, lesson objects, a closing
// anchor. The anchor is what both sides insert before.
const head = ['export const LIVING_LESSONS_MODULES = ['];
const tail = ['];', '', 'export default LIVING_LESSONS_MODULES;', ''];
const lesson = (n, title) => [
  '  {',
  `    "id": "ll${n}-${title}",`,
  `    "title": "Lesson ${n}",`,
  '    "bands": { "child": "…", "youth": "…", "teen": "…", "senior": "…" },',
  '  },',
];

const join = (...parts) => parts.flat().join('\n');

describe('splice-append keeps both appended lessons', () => {
  const base = join(head, lesson(258, 'a'), tail);
  const ours = join(head, lesson(258, 'a'), lesson(260, 'ours'), tail);
  const theirs = join(head, lesson(258, 'a'), lesson(259, 'theirs'), tail);

  it('places our lesson AFTER main’s, which is ascending order', () => {
    const r = spliceAppend({ base, ours, theirs, file: CATALOG });
    expect(r.ok, r.ok ? '' : r.reason).toBe(true);
    const at = (id) => r.text.indexOf(id);
    expect(at('ll258-a')).toBeGreaterThan(-1);
    expect(at('ll259-theirs')).toBeGreaterThan(at('ll258-a'));
    expect(at('ll260-ours')).toBeGreaterThan(at('ll259-theirs'));
  });

  it('loses nothing: every line of both sides survives', () => {
    const r = spliceAppend({ base, ours, theirs, file: CATALOG });
    for (const line of [...lesson(259, 'theirs'), ...lesson(260, 'ours'), ...tail]) {
      expect(r.text.split('\n')).toContain(line);
    }
  });

  it('keeps the closing anchor last, so the file still parses as a list', () => {
    const r = spliceAppend({ base, ours, theirs, file: CATALOG });
    expect(r.text.endsWith(tail.join('\n'))).toBe(true);
  });

  it('works when main landed SEVERAL siblings, not just one', () => {
    const many = join(head, lesson(258, 'a'), lesson(259, 'x'), lesson(261, 'y'), tail);
    const r = spliceAppend({ base, ours, theirs: many, file: CATALOG });
    expect(r.ok).toBe(true);
    expect(r.text.indexOf('ll260-ours')).toBeGreaterThan(r.text.indexOf('ll261-y'));
  });
});

describe('splice-append refuses rather than guessing', () => {
  const base = join(head, lesson(258, 'a'), tail);
  const ours = join(head, lesson(258, 'a'), lesson(260, 'ours'), tail);
  const theirs = join(head, lesson(258, 'a'), lesson(259, 'theirs'), tail);

  it('refuses a ledger file — resolve-ledger-conflicts.mjs owns the pointer', () => {
    for (const f of LEDGER_FILES) {
      const r = spliceAppend({ base, ours, theirs, file: f });
      expect(r.ok).toBe(false);
      expect(r.reason).toMatch(/resolve-ledger-conflicts/);
    }
  });

  it('refuses when our side DELETED something — not a pure insertion', () => {
    const edited = join(head, lesson(258, 'EDITED'), lesson(260, 'ours'), tail);
    const r = spliceAppend({ base, ours: edited, theirs, file: CATALOG });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/contiguous pure insertion/);
  });

  it('refuses when our change is in TWO places, not one block', () => {
    const twoSpots = join(head, lesson(257, 'extra'), lesson(258, 'a'), lesson(260, 'ours'), tail);
    const r = spliceAppend({ base, ours: twoSpots, theirs, file: CATALOG });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/contiguous pure insertion/);
  });

  it('refuses when main’s anchor region moved', () => {
    const movedAnchor = join(head, lesson(258, 'a'), lesson(259, 'x'), ['];', '', '// a new trailing comment', '']);
    const r = spliceAppend({ base, ours, theirs: movedAnchor, file: CATALOG });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/anchor region/);
  });

  it('refuses a catalog block carrying TWO lesson ids', () => {
    const twoLessons = join(head, lesson(258, 'a'), lesson(260, 'ours'), lesson(262, 'also-ours'), tail);
    const r = spliceAppend({ base, ours: twoLessons, theirs, file: CATALOG });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/holds 2 lesson ids/);
  });

  it('counts an id whose slug is NOT lowercase-kebab, so it cannot under-count', () => {
    // The original regex read `ll\d+-[a-z0-9-]+` and could not see
    // `ll262-alsoOurs` at all. An id it cannot see is an id it does not count,
    // so a two-lesson block reported "1 id" and was spliced as if it held one.
    // Real ids are lowercase-kebab, so this was never live — but a guard that
    // under-counts is a guard that waves things through.
    const odd = join(head, lesson(258, 'a'), lesson(260, 'ours'), lesson(262, 'alsoOurs'), tail);
    const r = spliceAppend({ base, ours: odd, theirs, file: CATALOG });
    expect(r.ok, 'a block holding two lessons must never splice').toBe(false);
    expect(r.reason).toMatch(/holds 2 lesson ids/);
  });

  it('refuses a catalog block carrying NO lesson id', () => {
    const noId = join(head, lesson(258, 'a'), ['  // just a comment, no lesson'], tail);
    const r = spliceAppend({ base, ours: noId, theirs, file: CATALOG });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/holds 0 lesson ids/);
  });

  it('refuses when a stage is missing — the file is not actually conflicted', () => {
    expect(spliceAppend({ base: null, ours, theirs, file: CATALOG }).ok).toBe(false);
    expect(spliceAppend({ base, ours: null, theirs, file: CATALOG }).reason).toMatch(/three-stage/);
    expect(spliceAppend({ base, ours, theirs: null, file: CATALOG }).reason).toMatch(/three-stage/);
  });

  it('refuses when our side is no longer than the base', () => {
    const r = spliceAppend({ base, ours: base, theirs, file: CATALOG });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/not a pure insertion/);
  });
});

describe('the id check cannot pass by failing to match', () => {
  // The real catalog writes `"id": "ll258-…"`. An earlier version of this
  // regex only accepted a bare `id:` with single quotes, matched nothing on
  // the real file, and so reported "0 ids" on a perfectly good block — the
  // refusal was right by accident. Both spellings are asserted.
  const anchor = ['];', ''];
  const withStyle = (q, bare) => join(
    ['const X = ['],
    ['  {', `    ${bare ? 'id' : `${q}id${q}`}: ${q}ll300-styled${q},`, '  },'],
    anchor,
  );
  it('reads the JSON spelling the catalog actually uses', () => {
    const base = join(['const X = ['], anchor);
    const r = spliceAppend({ base, ours: withStyle('"', false), theirs: base, file: CATALOG });
    expect(r.ok, r.ok ? '' : r.reason).toBe(true);
  });
  it('also reads a bare key with single quotes', () => {
    const base = join(['const X = ['], anchor);
    const r = spliceAppend({ base, ours: withStyle("'", true), theirs: base, file: CATALOG });
    expect(r.ok, r.ok ? '' : r.reason).toBe(true);
  });
});

describe('a non-catalog append file needs no lesson id', () => {
  // living-lessons-dates.js is the same shape and the same conflict, but it
  // holds dates, not lesson objects — the id rule must not fire on it.
  const DATES = 'app/src/lib/living-lessons-dates.js';
  const base = join(['export const DATES = {'], ["  'll258-a': '2026-10-20',"], ['};', '']);
  const ours = join(['export const DATES = {'], ["  'll258-a': '2026-10-20',", "  'll260-ours': '2026-10-27',"], ['};', '']);
  const theirs = join(['export const DATES = {'], ["  'll258-a': '2026-10-20',", "  'll259-theirs': '2026-10-27',"], ['};', '']);

  it('splices the dates map with no id requirement', () => {
    const r = spliceAppend({ base, ours, theirs, file: DATES });
    expect(r.ok, r.ok ? '' : r.reason).toBe(true);
    expect(r.text).toContain("'ll259-theirs'");
    expect(r.text).toContain("'ll260-ours'");
  });
});
