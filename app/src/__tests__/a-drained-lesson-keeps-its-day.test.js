// =============================================================================
// A DRAINED LESSON KEEPS ITS DAY — declared, not by a loosened threshold
// (DR-0988; the blocker DR-0987 measured)
// =============================================================================
// DR-0687 records the day a lesson was created, from git: "the UTC author day
// of the earliest commit that added the line defining the lesson". Darrell's
// own words behind it: "Add all the days the lessons were created so we can
// have all of them in each course so they can get done."
//
// DR-0986 then decided the open-PR backlog is DRAINED oldest-first, and the
// first drain (PR #1217, a Godhead Study teaching authored 2026-08-09) hit a
// contradiction no single file can satisfy — measured 2026-10-13 by simulating
// the squash rather than arguing it:
//
//   on the PR head          git derives 2026-08-09   (its real commits)
//   on main after squash    git derives 2026-10-13   (those commits unreachable)
//   SQUASH_GRACE_DAYS       14; the gap is 65
//   simulated squash + `lesson-dates:check`   ->  exit 1
//
// Raising the grace to admit 65 days would weaken the "is this really a squash?"
// question for EVERY lesson, and that question is the grace's whole purpose: it
// catches a hand-edited wrong day. So the exception is DECLARED per lesson with
// its provenance — the same shape as the allow-list declarations in
// constraint-allow-list-guard, where an exception is data with a reason rather
// than a threshold moved.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { judgeEntry, SQUASHED_AWAY, SQUASH_GRACE_DAYS, daysBetween } from '../../../scripts/lesson-dates-core.mjs';

const CORE = join(__dirname, '../../../scripts/lesson-dates-core.mjs');
const reach = new Set(['aaaaaaaa']);
// The real shape of the blocker: authored 2026-08-09, first reached main's
// history 2026-10-13 in a squash, so its own commit is NOT reachable.
const DRAINED = { date: '2026-08-09', sha: '6600e1bc' };
const GIT = { date: '2026-10-13', sha: 'deadbeef' };

describe('the gap that blocked the first drain', () => {
  it('is 65 days, and the grace is 14 — so it is refused by default', () => {
    expect(daysBetween('2026-08-09', '2026-10-13')).toBe(65);
    expect(SQUASH_GRACE_DAYS).toBe(14);
    // An UNDECLARED id, so this tests the default. 'ea-gh-knowledge-and-sin' is
    // a real declaration now (DR-0989 re-landed PR #1217 through this very
    // mechanism), and using it here would test the exception, not the rule.
    const why = judgeEntry(DRAINED, GIT, reach, 'ea-gh-no-such-card');
    expect(why).toMatch(/65 days before it first reached history/);
  });

  it('and the refusal TELLS the reader what to do, naming the id', () => {
    const why = judgeEntry(DRAINED, GIT, reach, 'ea-gh-no-such-card');
    expect(why).toContain("declare 'ea-gh-no-such-card' in SQUASHED_AWAY");
    expect(why).toContain('day, pr and why');
  });

  it('with no id in hand it still refuses, just without the advice', () => {
    const why = judgeEntry(DRAINED, GIT, reach);
    expect(why).toMatch(/is not a squash$/);
  });
});

describe('a declaration admits exactly the lesson it names', () => {
  // Injected rather than shipped, so the repository's own declaration map stays
  // empty and these tests do not depend on live content.
  // SAVE AND RESTORE, never delete. The first version deleted the key in
  // `finally`, which silently removed a REAL declaration whenever the injected
  // id collided with one — and once PR #1217 re-landed through this mechanism,
  // 'ea-gh-knowledge-and-sin' became exactly such an id.
  const withDeclared = (id, decl, fn) => {
    const had = Object.prototype.hasOwnProperty.call(SQUASHED_AWAY, id);
    const prior = SQUASHED_AWAY[id];
    SQUASHED_AWAY[id] = decl;
    try { return fn(); } finally { if (had) SQUASHED_AWAY[id] = prior; else delete SQUASHED_AWAY[id]; }
  };

  it('accepts the declared lesson at the declared day', () => {
    withDeclared('ea-gh-knowledge-and-sin', { day: '2026-08-09', pr: 1217, why: 'drained from #1217' }, () => {
      expect(judgeEntry(DRAINED, GIT, reach, 'ea-gh-knowledge-and-sin')).toBe(null);
    });
  });

  it('REFUSES a day the declaration does not name — it cannot bless an unchecked day', () => {
    withDeclared('ea-gh-knowledge-and-sin', { day: '2026-08-09', pr: 1217, why: 'drained from #1217' }, () => {
      // Same lesson, a different recorded day: the declaration must not cover it.
      expect(judgeEntry({ date: '2026-07-01', sha: '6600e1bc' }, GIT, reach, 'ea-gh-knowledge-and-sin'))
        .toMatch(/is not a squash/);
    });
  });

  it('covers only the id it names — a sibling lesson is still refused', () => {
    withDeclared('ea-gh-knowledge-and-sin', { day: '2026-08-09', pr: 1217, why: 'drained from #1217' }, () => {
      expect(judgeEntry(DRAINED, GIT, reach, 'ea-gh-some-other-card')).toMatch(/is not a squash/);
    });
  });

  it('changes nothing about an entry whose commit IS in history', () => {
    withDeclared('ea-gh-knowledge-and-sin', { day: '2026-08-09', pr: 1217, why: 'drained from #1217' }, () => {
      // Reachable commit: exact match still required, declaration irrelevant.
      const git = { date: '2026-05-17', sha: 'aaaaaaaa' };
      expect(judgeEntry({ date: '2026-05-17', sha: 'aaaaaaaa' }, git, reach, 'ea-gh-knowledge-and-sin')).toBe(null);
      expect(judgeEntry({ date: '2026-05-16', sha: 'aaaaaaaa' }, git, reach, 'ea-gh-knowledge-and-sin'))
        .toMatch(/recorded 2026-05-16/);
    });
  });

  it('changes nothing about a day recorded AFTER it reached history', () => {
    withDeclared('ea-gh-late', { day: '2026-11-01', pr: 1217, why: 'x' }, () => {
      expect(judgeEntry({ date: '2026-11-01', sha: 'cccccccc' }, GIT, reach, 'ea-gh-late'))
        .toMatch(/is AFTER the day it first reached history/);
    });
  });

  it('a within-grace squash still passes with no declaration at all', () => {
    expect(judgeEntry({ date: '2026-10-10', sha: 'eeeeeeee' }, GIT, reach, 'ea-gh-ordinary')).toBe(null);
  });
});

describe('the declaration map is data with a reason, and empty is correct', () => {
  it('holds exactly the drains that happened — PR #1217 and nothing else', () => {
    // Empty WAS the correct state when the mechanism shipped alone (DR-0988).
    // DR-0989 re-landed PR #1217 through it, so the map now accounts for those
    // seven cards and must account for nothing else.
    const ids = Object.keys(SQUASHED_AWAY).sort();
    expect(ids).toEqual([
      'ea-gh-conviction-vs-condemnation',
      'ea-gh-justice-rationed-at-the-gate',
      'ea-gh-keep-yourself-by-the-word',
      'ea-gh-knowledge-and-sin',
      'ea-gh-mind-of-christ-in-the-hidden-part',
      'ea-gh-remedy-that-arrives-on-a-calendar',
      'ea-gh-word-is-4d-fact',
    ]);
    for (const d of Object.values(SQUASHED_AWAY)) {
      expect(d.pr).toBe(1217);
      expect(d.day).toMatch(/^2026-08-(09|10)$/);
    }
  });

  it('every live declaration (when there is one) carries a day, a pr and a why', () => {
    for (const [id, d] of Object.entries(SQUASHED_AWAY)) {
      expect(d.day, `${id} day`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof d.pr, `${id} pr`).toBe('number');
      expect(String(d.why || '').length, `${id} why`).toBeGreaterThan(20);
    }
  });

  it('the source explains why a declaration beats raising the threshold', () => {
    // SHORT FRAGMENTS, each on one line. My first two attempts asserted the
    // whole sentence: it wraps across comment lines, and collapsing whitespace
    // is not enough because the JSDoc `*` markers survive. A prose assertion
    // that breaks when someone re-wraps a comment is an assertion about
    // formatting, which is noise pretending to be a check.
    const src = readFileSync(CORE, 'utf8');
    expect(src).toContain('would weaken the "is this really a');
    expect(src).toContain('question for EVERY lesson');
    expect(src).toContain('it catches a hand-edited wrong day');
    expect(src).toContain('Empty is the correct state');
    // The grace itself is untouched — the whole point.
    expect(src).toContain('export const SQUASH_GRACE_DAYS = 14;');
  });
});
