// =============================================================================
// The author's lessons are exactly as they were before the Learn redesign
// =============================================================================
// Phase 1 of the Learn presentation redesign. The committed baseline
// (lib/learn-presentation/learn-integrity-baseline.json) was measured from the
// mounted catalog at commit cd21ca0 (2026-11-24): 13 departments, 51 courses,
// 994 lessons, 4,258 age readings. Every lesson's exact title, whole raw
// content, position, course, department and every age version is hashed.
//
// This test fails the build if ANY of those changes. New lessons pass (the
// author keeps writing); they are listed, not failed.
//
// When the AUTHOR deliberately edits a lesson, re-measure on purpose:
//   LEARN_BASELINE_WRITE=1 npx vitest run src/__tests__/learn-integrity-baseline.test.js
// and commit the new baseline in its own commit that names the lesson changed.
// The redesign itself must never need a re-baseline.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { learnInventory, snapshotInventory, compareSnapshots } from '../lib/learn-presentation/integrity.js';

const sha = (s) => createHash('sha256').update(String(s), 'utf8').digest('hex');
const BASELINE = join(process.cwd(), 'src/lib/learn-presentation/learn-integrity-baseline.json');

const now = snapshotInventory(learnInventory(), sha);

describe('Learn content integrity baseline', () => {
  if (process.env.LEARN_BASELINE_WRITE === '1') {
    it('writes the baseline (explicit re-measure only)', () => {
      writeFileSync(BASELINE, `${JSON.stringify({ measuredAt: new Date().toISOString(), ...now }, null, 1)}\n`);
      expect(existsSync(BASELINE)).toBe(true);
    });
    return;
  }

  const base = JSON.parse(readFileSync(BASELINE, 'utf8'));
  const diff = compareSnapshots(base, now);

  it('no lesson was removed', () => expect(diff.removed).toEqual([]));
  it('no original title changed by a single character', () => expect(diff.retitled).toEqual([]));
  it('no lesson content changed', () => expect(diff.rewritten).toEqual([]));
  it('no lesson moved course, department or position', () => expect(diff.moved).toEqual([]));
  it('no age version was lost or altered', () => {
    expect(diff.versionsLost).toEqual([]);
    expect(diff.versionsChanged).toEqual([]);
  });
  it('no course was removed or re-departmented', () => {
    expect(diff.coursesRemoved).toEqual([]);
    expect(diff.coursesRedepartmented).toEqual([]);
  });
  it('the catalog is never smaller than the baseline', () => {
    expect(now.counts.departments).toBeGreaterThanOrEqual(base.counts.departments);
    expect(now.counts.courses).toBeGreaterThanOrEqual(base.counts.courses);
    expect(now.counts.lessons).toBeGreaterThanOrEqual(base.counts.lessons);
    expect(now.counts.readings).toBeGreaterThanOrEqual(base.counts.readings);
  });
  // 4,258 readings at Phase 1; +2 each as an Eternal pattern becomes a full lesson
  // with child and youth versions it never had (Darrell 2026-11-26): joy-three-days,
  // genesis-holds-the-whole-plan, spirit-formed-and-returns, eyes-opened-by-prayer, the-door, one-mediator, spirit-bears-witness-with,
  // whole-spirit-soul-body, el-elyon-possessor, el-shaddai-almighty,
  // i-am-that-i-am, babel-make-us-a-name, nations-divided-portion,
  // borrowed-crown, they-that-make-them, inscription-that-asked-eternity,
  // before-abraham-i-am, name-that-saves, all-power-is-his,
  // without-me-nothing, triumph-already-public, will-worship-frees-no-one,
  // jesus-i-know-who-are-ye, presence-is-the-liberty, submit-then-resist,
  // not-bondage-again, obedience-blessing (#2905), credit-vs-worship,
  // yahweh-gets-both, glory-refused-or-taken, keep-yourself-by-the-word,
  // knowledge-and-sin, conviction-vs-condemnation, mind-of-christ-in-the-hidden-part,
  // word-is-4d-fact, justice-rationed-at-the-gate, remedy-that-arrives-on-a-calendar,
  // fruit-no-law, god-not-colorblind, own-your-faith, made-in-his-image,
  // thief-targets-identity, testing-not-temptation, pray-for-protection,
  // see-father-in-son, he-already-knew.
  it('the baseline is the measured Phase 1 catalog (13 / 51 / 994 / 4,350)', () => {
    expect(base.counts).toEqual({ departments: 13, courses: 51, lessons: 994, readings: 4350 });
  });
});
