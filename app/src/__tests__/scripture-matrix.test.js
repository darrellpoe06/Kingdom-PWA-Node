// @vitest-environment node
// =============================================================================
// scripture-matrix — the derived "Lord's Matrix" web is TRUE BY CONSTRUCTION
// =============================================================================
// The whole value of a derived web is that it cannot lie: it may only claim two
// lessons share a verse when they actually cite that verse. These tests pin the
// derivation (what counts as a reference, what does not), the honest-empty rule
// from DR-0288, the no-leak boundary (governor-only facilitator prose must never
// create a member-visible link), and one assertion against the REAL corpus so a
// regression in the live series is caught, not just in a fixture.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  extractRefs, refsForLesson, matrixFor, buildRefIndex, matrixBlockText,
  MATRIX_FRAME, MATRIX_EMPTY,
} from '../lib/scripture-matrix.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const lesson = (id, over = {}) => ({ id, title: id, bigIdea: '', lesson: '', ...over });

describe('extractRefs — only real citations count', () => {
  it('pulls parenthesised references, including numbered books and ranges', () => {
    const refs = extractRefs('as it says (Genesis 3:15) and (1 Corinthians 1:23-25) and (Matthew 27:46)');
    expect(refs).toEqual(['Genesis 3:15', '1 Corinthians 1:23', 'Matthew 27:46']);
  });

  it('keys a range on its FIRST verse, so a range and a single verse MEET', () => {
    expect(extractRefs('(Genesis 28:17-19)')).toEqual(['Genesis 28:17']);
    expect(extractRefs('(Genesis 28:17)')).toEqual(['Genesis 28:17']);
  });

  it('ignores bare numbers in prose — a statistic is not a citation', () => {
    expect(extractRefs('about 8% of 2,000,000 held, roughly 17:47 on the clock')).toEqual([]);
  });

  it('normalizes Psalm/Psalms so the same verse does not split into two keys', () => {
    expect(extractRefs('(Psalm 20:7)')).toEqual(extractRefs('(Psalms 20:7)'));
  });
});

describe('the web itself', () => {
  const a = lesson('a', { lesson: 'one (John 14:6) two (Acts 4:12) three (Psalm 20:7)' });
  const b = lesson('b', { lesson: 'also (John 14:6) and (Acts 4:12)' });
  const c = lesson('c', { lesson: 'only (John 14:6)' });
  const lone = lesson('lone', { lesson: 'nobody else cites (Obadiah 1:4)' });
  const all = [a, b, c, lone];

  it('never links a lesson to itself', () => {
    expect(matrixFor(a, all).map((k) => k.id)).not.toContain('a');
  });

  it('ranks the strongest tie first (most shared references)', () => {
    const kin = matrixFor(a, all);
    expect(kin[0].id).toBe('b');
    expect(kin[0].shared).toEqual(['Acts 4:12', 'John 14:6']);
    expect(kin[1].id).toBe('c');
  });

  it('returns an HONEST EMPTY rather than padding a lesson with no kin (DR-0288)', () => {
    expect(matrixFor(lone, all)).toEqual([]);
    const text = matrixBlockText(lone, all);
    expect(text).toContain(MATRIX_EMPTY);
    expect(text).toContain(MATRIX_FRAME);
  });

  it('cannot invent a link — a claimed pair must really share a citation', () => {
    for (const k of matrixFor(a, all)) {
      const theirs = refsForLesson(all.find((m) => m.id === k.id));
      const mine = refsForLesson(a);
      for (const ref of k.shared) {
        expect(theirs).toContain(ref);
        expect(mine).toContain(ref);
      }
    }
  });

  it('buildRefIndex maps a verse to every lesson standing on it', () => {
    expect(buildRefIndex(all).get('John 14:6')).toEqual(['a', 'b', 'c']);
  });

  it('does NOT read the governor-only facilitator guide (no-leak)', () => {
    const gated = lesson('g', {
      lesson: 'member text (Acts 4:12)',
      facilitator: { talkingPoints: ['governor-only (Obadiah 1:4)'], discussionPrompts: ['(Obadiah 1:4)'] },
    });
    expect(refsForLesson(gated)).toEqual(['Acts 4:12']);
  });

  it('reads the anchor, which is written bare rather than parenthesised', () => {
    const anchored = lesson('an', { anchor: { ref: 'Acts 4:12; Matthew 27:46', theme: 't' } });
    expect(refsForLesson(anchored).sort()).toEqual(['Acts 4:12', 'Matthew 27:46']);
  });
});

describe('against the REAL Living Lessons corpus', () => {
  const L73 = LIVING_LESSONS_MODULES.find((m) => m.id === 'll73-the-house-of-el-and-the-only-saviour');

  it('L73 exists and stands on a substantial body of Scripture', () => {
    expect(L73).toBeTruthy();
    expect(refsForLesson(L73).length).toBeGreaterThan(40);
  });

  it('L73 is integrated — it shares Scripture with other lessons in the series', () => {
    const kin = matrixFor(L73, LIVING_LESSONS_MODULES);
    expect(kin.length).toBeGreaterThan(0);
    // Every claimed share is real, verified against both lessons' own citations.
    const mine = new Set(refsForLesson(L73));
    for (const k of kin) {
      expect(k.shared.length).toBeGreaterThan(0);
      for (const ref of k.shared) expect(mine.has(ref)).toBe(true);
    }
  });

  it('no lesson in the live series is left an orphan — the web actually covers the room', () => {
    const orphans = LIVING_LESSONS_MODULES
      .filter((m) => matrixFor(m, LIVING_LESSONS_MODULES).length === 0)
      .map((m) => m.id);
    expect(orphans, `orphaned lessons: ${orphans.join(', ')}`).toEqual([]);
  });
});
