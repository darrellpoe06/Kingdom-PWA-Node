// =============================================================================
// THE BACKLOG IS NOT A MERGE QUEUE (DR-0990; amends DR-0986)
// =============================================================================
// DR-0986 said to drain oldest-first "starting with the 8 PRs that touch 1-3
// files, because those are where a conflict resolution is reviewable in a
// sitting." Measured 2026-10-13, both proxies in that sentence are wrong:
//
//   TITLE lies      — #286 is titled "docs(hardware): ..." and carries a whole
//                     Concerns Board feature, 1,106 insertions and migration
//                     0039 while main is at 0282.
//   FILE COUNT lies — #592 is 12 files / 256 insertions; #286 is 8 files /
//                     1,106. The count measures neither size nor risk.
//
// And neither proxy can see the real hazard. #592's own monolith-budget.json
// says 5913; main's says 5302, and main's shell is exactly 5302 lines. Its
// shell hunk still carries the inline theme CSS block main has since EXTRACTED
// behind `${THEME_CSS}`. Merging it mechanically would reinstate ~611 lines the
// extraction lane peeled out AND raise the frozen ceiling to allow it — undoing
// the hybrid-modular cutover one old PR at a time, with every check green.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { classify, newestOrdinal, MONOLITH, BUDGET_FILE, ORDINAL_SLACK } from '../../../scripts/drain-triage.mjs';

const ROOT = join(__dirname, '../../..');
const NEWEST = 282;

describe('the three questions, each one a REBUILD on its own', () => {
  it('touching the frozen monolith is a rebuild', () => {
    const r = classify({ files: ['app/src/lib/x.js', MONOLITH], newest: NEWEST });
    expect(r.verdict).toBe('rebuild');
    expect(r.reasons.join(' ')).toContain('frozen monolith');
  });

  it('carrying the monolith budget is a rebuild — it moves the ratchet backwards', () => {
    const r = classify({ files: [BUDGET_FILE], newest: NEWEST });
    expect(r.verdict).toBe('rebuild');
    expect(r.reasons.join(' ')).toContain('ratchet backwards');
  });

  it('a migration far behind main is a rebuild, and the reason counts how far', () => {
    const r = classify({ files: ['infra/supabase/migrations-auto/0039-concerns-board.sql'], newest: NEWEST });
    expect(r.verdict).toBe('rebuild');
    expect(r.reasons.join(' ')).toContain('243 behind');
  });

  it('a RECENT migration still drains — the rule is staleness, not migrations', () => {
    const near = `infra/supabase/migrations-auto/0${NEWEST - 1}-something.sql`;
    expect(classify({ files: [near], newest: NEWEST }).verdict).toBe('drain');
    expect(ORDINAL_SLACK).toBe(20);
  });

  it('the slack boundary is exact', () => {
    const at = `infra/supabase/migrations-auto/0${NEWEST - ORDINAL_SLACK}-x.sql`;
    const past = `infra/supabase/migrations-auto/0${NEWEST - ORDINAL_SLACK - 1}-x.sql`;
    expect(classify({ files: [at], newest: NEWEST }).verdict).toBe('drain');
    expect(classify({ files: [past], newest: NEWEST }).verdict).toBe('rebuild');
  });

  it('names EVERY reason, not just the first — a PR can fail all three', () => {
    const r = classify({
      files: [MONOLITH, BUDGET_FILE, 'infra/supabase/migrations-auto/0039-x.sql'],
      newest: NEWEST,
    });
    expect(r.verdict).toBe('rebuild');
    expect(r.reasons).toHaveLength(3);
  });
});

describe('the shape that drains', () => {
  // PR #1217 is the proof: it drained cleanly (DR-0989) and answers no to all
  // three. Its real file list, verbatim.
  it("#1217's actual files classify as drain", () => {
    const r = classify({
      files: [
        'app/src/__tests__/authored-content-reaches-its-surface.test.js',
        'app/src/lib/godhead-study-verses.json',
        'app/src/lib/godhead-study.js',
      ],
      newest: NEWEST,
    });
    expect(r.verdict).toBe('drain');
    expect(r.reasons).toEqual([]);
  });

  it('an empty file list drains rather than throwing', () => {
    expect(classify({ files: [], newest: NEWEST }).verdict).toBe('drain');
    expect(classify({ newest: NEWEST }).verdict).toBe('drain');
  });
});

describe('the premise DR-0986 got wrong, pinned against the real files', () => {
  it('a 1-3 file PR can still be a rebuild, so file count is not the test', () => {
    // #1129 is ONE file (a GitHub Actions bump) and drains; a one-file PR that
    // edits the shell does not. Same count, opposite verdicts.
    expect(classify({ files: ['.github/workflows/ci.yml'], newest: NEWEST }).verdict).toBe('drain');
    expect(classify({ files: [MONOLITH], newest: NEWEST }).verdict).toBe('rebuild');
  });

  it('the verdict is about SAFETY, not size — a huge PR can still be drainable', () => {
    // #1255 is 110 files / 4,088 insertions and answers no to all three. The
    // three questions say whether draining is structurally SOUND; whether it is
    // small enough to review in a sitting is a separate judgment the record
    // keeps with the human.
    const big = Array.from({ length: 110 }, (_, i) => `app/src/lib/f${i}.js`);
    expect(classify({ files: big, insertions: 4088, newest: NEWEST }).verdict).toBe('drain');
  });
});

describe('the facts this rests on are read from the repository, not recalled', () => {
  it('the monolith budget equals the shell line count — the freeze is at its floor', () => {
    const budget = JSON.parse(readFileSync(join(ROOT, BUDGET_FILE), 'utf8')).budget;
    const lines = readFileSync(join(ROOT, MONOLITH), 'utf8').split('\n').length;
    expect(budget).toBe(5302);
    // The shell is AT the ceiling, which is why any addition is a decision.
    expect(lines).toBeLessThanOrEqual(budget + 1);
  });

  it('the newest migration ordinal is read from disk', () => {
    expect(newestOrdinal()).toBeGreaterThanOrEqual(282);
  });

  it('the tool explains why title and file count were rejected as proxies', () => {
    const src = readFileSync(join(ROOT, 'scripts/drain-triage.mjs'), 'utf8');
    expect(src).toContain('TITLE lies');
    expect(src).toContain('FILE COUNT lies');
    expect(src).toContain('PRE-EXTRACTION-ERA');
    // And that it is a tool, not a build gate — it reads the network.
    expect(src).toContain('NOT A BUILD GATE');
  });
});
