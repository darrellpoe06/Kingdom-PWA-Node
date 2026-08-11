// @vitest-environment node
// =============================================================================
// Living Lessons — age appropriateness, 6 through elderly (measured, not assumed)
// =============================================================================
// Darrell 2026-08-11: "are all these lessons age appropriate from 6 - elderly as
// the Ways demand?"
//
// MEASURED ANSWER (and it corrects a wrong first reading — the initial scan
// looked for lessons carrying all THREE levels and reported 18 as having "no
// levels," which was false). Per age BAND, counting lessons that fall back to
// the adult base prose:
//   • child (6-10):  0 / 76 fall back — every lesson has an authored child level.
//   • senior:        0 / 76 fall back.
//   • youth (11-14): 0 / 76 — CLOSED 2026-08-11 (was 18/76).
//   • teen  (15-17): 0 / 76 — CLOSED 2026-08-11 (was 18/76).
//   • adult:        76 / 76 "fall back" — by design; the adult band reads the
//     base lesson, which is what the base lesson IS. Not a defect.
// The teen gap (L14-L31, child + senior but no teen) is now CLOSED: Darrell,
// 2026-08-11, "fix everthing now!!!!!!" — 18 teen levels authored, every quote in
// them checked word-for-word against the in-repo KJV (60 quotes; three real
// in-quote alterations of my own were caught and fixed in the process — emphasis
// capitals inserted INSIDE a quotation, which modifies the text). Darrell had
// named this class on 2026-07-19 ("levels, leaves out teen" — ChurchLearn.jsx).
// LEGACY_NO_TEEN is now EMPTY and must stay empty: every band is a hard
// invariant with no allowance.
//
// This gate does three things, and deliberately does NOT pretend the debt is
// paid:
//   1. RATCHET — the 18 teen gaps are listed explicitly. A NEW lesson without a
//      teen level fails the build, and the list may only shrink. The child and
//      senior bands are hard invariants with NO allowance: zero fallbacks, ever.
//   2. CHILD-LEVEL CONTENT SCREEN — the series carries lessons on the sex
//      industry, the occult, coerced abortion, prison, and demonic deception.
//      Their child levels must carry the transferable truth WITHOUT the adult
//      content. This is the check that keeps that promise mechanical rather than
//      a matter of the author's good intentions, and it is proven-to-catch
//      (a deliberately bad string is asserted to trip it).
//   3. SUBSTANCE — a child level must actually teach, not be a stub.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { resolveForAge } from '../lib/learn-framework.js';

// The 18 legacy lessons carrying child + senior but NO teen level. THIS LIST MAY
// ONLY SHRINK. Each one currently serves adult prose to an 11-17 year old (see
// the fallback tests), which is why it is recorded as debt rather than hidden.
const LEGACY_NO_TEEN = [];

// Content a level written for a six-year-old must never carry. These are drawn
// from what this series actually teaches at adult level — the point is that the
// heavy lessons stay heavy for adults and become age-right for children.
const NOT_FOR_CHILDREN = [
  /\bsex industry\b/i, /\bmassage parlou?r/i, /\bporn/i, /\bprostitut/i,
  /\babortion\b/i, /\brape\b/i, /\bincest\b/i, /\bmolest/i,
  /\bsuicide\b/i, /\bkill (?:her|him)self\b/i,
  /\bvoodoo\b/i, /\bblack magic\b/i, /\bwitchcraft\b/i, /\boccult\b/i,
  /\bseance\b/i, /\bnecromanc/i, /\bsorcer/i,
  /\bheroin\b/i, /\bcocaine\b/i, /\boverdose\b/i,
];

const hasAllLevels = (m) => !!(m.levels && m.levels.child && m.levels.teen && m.levels.senior);
const hasTeen = (m) => !!(m.levels && m.levels.teen);

describe('the three-level standard — the ratchet', () => {
  it('every lesson OUTSIDE the recorded legacy list carries child, teen and senior', () => {
    const legacy = new Set(LEGACY_NO_TEEN);
    const offenders = LIVING_LESSONS_MODULES
      .filter((m) => !legacy.has(m.id) && !hasAllLevels(m))
      .map((m) => m.id);
    expect(
      offenders,
      `these lessons are missing an age level and are not recorded legacy debt: ${offenders.join(', ')}`,
    ).toEqual([]);
  });

  it('the legacy debt list may only shrink — no id in it may be fictional', () => {
    const ids = new Set(LIVING_LESSONS_MODULES.map((m) => m.id));
    const stale = LEGACY_NO_TEEN.filter((id) => !ids.has(id));
    expect(stale, `legacy ids no longer in the series: ${stale.join(', ')}`).toEqual([]);
    // If a legacy lesson gains its levels, remove it from the list above.
    const fixed = LEGACY_NO_TEEN.filter((id) => {
      const m = LIVING_LESSONS_MODULES.find((x) => x.id === id);
      return m && hasTeen(m);
    });
    expect(
      fixed,
      `these lessons now HAVE all levels — delete them from LEGACY_NO_TEEN: ${fixed.join(', ')}`,
    ).toEqual([]);
  });

  it('records the real, current numbers so the claim is never taken on trust', () => {
    const withAll = LIVING_LESSONS_MODULES.filter(hasAllLevels).length;
    expect(withAll + LEGACY_NO_TEEN.length).toBe(LIVING_LESSONS_MODULES.length);
    expect(LEGACY_NO_TEEN.length).toBe(0);
  });
});

describe('the fallback is named honestly — this is WHY the debt matters', () => {
  // NOTE ON WHICH RESOLVER MATTERS. There are two: resolveLevel() is the older
  // skill-level control, whose LEARN_LEVELS are standard/teen/senior and which
  // has no 'child' option at all (normalizeLevel('child') -> 'standard').
  // resolveForAge() is the age-band path the learner actually rides, and its
  // chain for a child is child -> teen -> standard -> base lesson. The band path
  // is therefore the one these assertions use; testing the wrong one would have
  // reported a defect that is not there, and hidden the one that is.
  it('HARD INVARIANT — no lesson falls back to adult prose for a CHILD (6-10)', () => {
    const falling = LIVING_LESSONS_MODULES
      .filter((m) => resolveForAge(m, 'child').branched === false)
      .map((m) => m.id);
    expect(falling, `children served adult prose: ${falling.join(', ')}`).toEqual([]);
  });

  it('HARD INVARIANT — no lesson falls back to adult prose for a SENIOR', () => {
    const falling = LIVING_LESSONS_MODULES
      .filter((m) => resolveForAge(m, 'senior').branched === false)
      .map((m) => m.id);
    expect(falling, `seniors served adult prose: ${falling.join(', ')}`).toEqual([]);
  });

  it('HARD INVARIANT — 11-17 no longer falls back to adult prose anywhere', () => {
    for (const band of ['youth', 'teen']) {
      const falling = LIVING_LESSONS_MODULES
        .filter((m) => resolveForAge(m, band).branched === false)
        .map((m) => m.id)
        .sort();
      expect(falling, `${band}: unrecorded teen gaps`).toEqual([...LEGACY_NO_TEEN].sort());
    }
  });

  it('a lesson WITH levels serves the child its own text', () => {
    const l74 = LIVING_LESSONS_MODULES.find((m) => m.id === 'll74-church-hurt-the-counterfeit-comfort-and-the-blood');
    const resolved = resolveForAge(l74, 'child');
    expect(resolved.branched).toBe(true);
    expect(resolved.text).toBe(l74.levels.child);
    expect(resolved.text).not.toBe(l74.lesson);
  });

  it('the youth band (11-14) reaches teen text, not adult prose', () => {
    const l76 = LIVING_LESSONS_MODULES.find((m) => m.id === 'll76-the-sky-the-speculation-and-the-test-that-works');
    const resolved = resolveForAge(l76, 'youth');
    expect(resolved.branched).toBe(true);
    expect(resolved.text).toBe(l76.levels.teen);
  });
});

describe('child-level content screen (kids use this app)', () => {
  it('no child level carries adult content from its own lesson', () => {
    const flagged = [];
    for (const m of LIVING_LESSONS_MODULES) {
      const child = (m.levels && m.levels.child) || '';
      for (const rx of NOT_FOR_CHILDREN) {
        if (rx.test(child)) flagged.push(`${m.id} :: ${rx}`);
      }
    }
    expect(flagged, `child levels carrying adult content:\n${flagged.join('\n')}`).toEqual([]);
  });

  it('the screen is PROVEN-TO-CATCH, not decorative', () => {
    const bad = 'A story for children about the occult, voodoo, and the sex industry.';
    const caught = NOT_FOR_CHILDREN.filter((rx) => rx.test(bad));
    expect(caught.length).toBeGreaterThanOrEqual(3);
  });

  it('the heaviest lessons still teach a child something real', () => {
    // The lessons whose adult material is hardest: church hurt/occult, the
    // prison-and-school gates, the conquest, and the UFO/deception study.
    const heavy = [
      'll74-church-hurt-the-counterfeit-comfort-and-the-blood',
      'll71-the-two-gates-and-the-father-of-the-fatherless',
      'll75-the-greater-yeshua',
      'll76-the-sky-the-speculation-and-the-test-that-works',
    ];
    for (const id of heavy) {
      const m = LIVING_LESSONS_MODULES.find((x) => x.id === id);
      expect(m, `${id} must exist`).toBeTruthy();
      expect(m.levels.child.length, `${id} child level is a stub`).toBeGreaterThan(400);
    }
  });

  it('no child level is a stub', () => {
    const thin = LIVING_LESSONS_MODULES
      .filter((m) => m.levels && m.levels.child)
      .filter((m) => m.levels.child.length < 200)
      .map((m) => m.id);
    expect(thin, `child levels too thin to teach: ${thin.join(', ')}`).toEqual([]);
  });
});
