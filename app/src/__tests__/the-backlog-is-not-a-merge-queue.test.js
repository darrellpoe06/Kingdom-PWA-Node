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
    // The record was written at 5,302 (2026-10-14). DR-1046 moved the top-level
    // tab array out of the shell and re-froze the ratchet LOWER (5,193 on
    // 2026-10-15); the fact this rests on is that the freeze sits at the
    // shell's floor, so it is asserted from the two files, not as a literal
    // that every honest extraction would break.
    expect(budget).toBeLessThanOrEqual(5302);
    // The shell is AT the ceiling, which is why any addition is a decision.
    expect(lines).toBeLessThanOrEqual(budget + 1);
    expect(lines).toBeGreaterThanOrEqual(budget - 1);
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

// ── THE FOURTH QUESTION (DR-0991), added after PR #789. Its own body said
// "shipped via PR #787", which merged 2026-07-11T21:49:37Z — the same day #789
// was opened. Every line of it was on main, and main had moved PAST it (its
// test differs by 165 lines, church-own-door.js by 66, in main's favour), so
// merging it would have dragged the church's door back to its July shape.
//
// Neither existing tool sees this: pr-janitor closes only PROVABLY EMPTY PRs
// and #789 is not empty — its diff against its own merge-base is real; it is
// MAIN that moved. And the three structural questions ask about the monolith,
// the budget and migration ordinals, none of which notices work that shipped.
describe('a superseded pull request is not a drain', () => {
  it('flags a PR whose every added file is already on main', () => {
    const r = classify({ files: ['a', 'b'], added: { total: 2, alreadyOnMain: 2 }, newest: NEWEST });
    expect(r.verdict).toBe('superseded?');
    expect(r.reasons.join(' ')).toContain('already exists on main');
    expect(r.reasons.join(' ')).toContain('could REGRESS');
  });

  it('is a QUESTION, not a verdict — the mark is deliberate', () => {
    // Only a reader can say whether the PR still carries something main lacks,
    // so the tool asks rather than decides.
    expect(classify({ files: ['a'], added: { total: 1, alreadyOnMain: 1 }, newest: NEWEST }).verdict)
      .toMatch(/\?$/);
    expect(classify({ files: ['a'], added: { total: 1, alreadyOnMain: 1 }, newest: NEWEST }).reasons.join(' '))
      .toContain('read it before any merge');
  });

  it('does NOT flag a PR that adds something main lacks', () => {
    expect(classify({ files: ['a', 'b'], added: { total: 2, alreadyOnMain: 1 }, newest: NEWEST }).verdict).toBe('drain');
    expect(classify({ files: ['a'], added: { total: 1, alreadyOnMain: 0 }, newest: NEWEST }).verdict).toBe('drain');
  });

  it('does not flag a PR that adds NO files at all — it only modifies', () => {
    expect(classify({ files: ['a'], added: { total: 0, alreadyOnMain: 0 }, newest: NEWEST }).verdict).toBe('drain');
  });

  it('still works when the caller knows nothing about added files', () => {
    expect(classify({ files: ['a'], newest: NEWEST }).verdict).toBe('drain');
    expect(classify({ files: [MONOLITH], newest: NEWEST }).verdict).toBe('rebuild');
  });

  // The flaw in the FIRST version of this question, caught by reading the
  // tool's own output: it returned early, so a PR that is both superseded-
  // looking AND structurally unsafe reported only the supersession — throwing
  // away exactly what a reader who RULES OUT supersession needs next.
  it('reports the structural reasons TOO, not instead', () => {
    const r = classify({
      files: [MONOLITH, 'infra/supabase/migrations-auto/0039-x.sql'],
      added: { total: 2, alreadyOnMain: 2 },
      newest: NEWEST,
    });
    expect(r.verdict).toBe('superseded?');
    expect(r.reasons).toHaveLength(3);
    expect(r.reasons.join(' ')).toContain('frozen monolith');
    expect(r.reasons.join(' ')).toContain('243 behind');
  });

  it('the tool records why neither pr-janitor nor the three questions caught it', () => {
    const src = readFileSync(join(ROOT, 'scripts/drain-triage.mjs'), 'utf8');
    expect(src).toContain('NEITHER EXISTING TOOL SEES THIS');
    expect(src).toContain('PROVABLY EMPTY');
    expect(src).toContain('shipped via PR #787');
    expect(src).toContain('a question mark, deliberately');
  });
});
