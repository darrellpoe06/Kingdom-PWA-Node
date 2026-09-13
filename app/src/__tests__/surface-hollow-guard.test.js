// @vitest-environment node
// PROVEN-TO-CATCH for the comprehensive quality checker (DR-0076 §3).
// =============================================================================
// Darrell 2026-09-13: "Quality checker that works comprehensively... added to
// the Ways and documentation."
//
// A gate that always passes is itself a lie. So every check inside
// surface-hollow-guard is fed a BROKEN input here and REQUIRED to report it —
// the real corpus proves the green, these fakes prove the red.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeSurfaces, runSurfaceHollowGuard, CEILINGS } from '../../../scripts/surface-hollow-guard.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PRESENTER = readFileSync(join(HERE, '..', 'components', 'Presenter.jsx'), 'utf8');

// A tiny healthy world: one lesson, two points, both on the deck, honest label.
const LESSON = 'THE FIRST POINT. ' + 'Real teaching under the first point. '.repeat(12)
  + 'THE SECOND POINT. ' + 'Real teaching under the second point. '.repeat(12);
const healthy = () => {
  const modules = [{ id: 'll-test', lesson: LESSON }];
  const sections = [
    { n: 1, label: 'THE FIRST POINT', heading: 'THE FIRST POINT.', body: 'Real teaching under the first point. '.repeat(12).trim() },
    { n: 2, label: 'THE SECOND POINT', heading: 'THE SECOND POINT.', body: 'Real teaching under the second point. '.repeat(12).trim() },
  ];
  return {
    modules,
    lessonSections: () => sections,
    lessonPoints: () => [{ label: 'THE FIRST POINT' }, { label: 'THE SECOND POINT' }],
    lessonPresentable: () => ({
      scenes: sections.map((s, i) => ({
        indexLabel: `Part ${i + 1} of 2`,
        audience: { title: s.label },
        notes: [{ kind: 'body', heading: s.label, body: `${s.heading} ${s.body}` }],
      })),
    }),
    presenterSource: "label: `${partLabel} (with your script)`,",
  };
};

describe('surface-hollow-guard — green on a healthy surface', () => {
  it('reports nothing when every part carries the lesson', () => {
    expect(analyzeSurfaces(healthy())).toEqual([]);
  });
  it('the REAL corpus is green', async () => {
    expect(await runSurfaceHollowGuard()).toEqual([]);
  });
});

describe('surface-hollow-guard — and it CATCHES every break it exists for', () => {
  it('CATCHES a presented part rendering the empty-notes card', () => {
    const d = healthy();
    const real = d.lessonPresentable;
    d.lessonPresentable = (...a) => {
      const p = real(...a);
      p.scenes[1].notes = [];        // the exact L142 defect
      return p;
    };
    const f = analyzeSurfaces(d);
    expect(f.join(' ')).toMatch(/empty-notes card/);
  });

  it('CATCHES the point detector going blind again', () => {
    const d = healthy();
    d.lessonPoints = () => [];        // the caps-heading regression
    const f = analyzeSurfaces({ ...d, ceilings: { ...CEILINGS, pointlessLessons: 0, thinPointLessons: 0 } });
    expect(f.join(' ')).toMatch(/ZERO points/);
  });

  it('CATCHES a lesson reporting a single point when it has prose', () => {
    const d = healthy();
    d.lessonPoints = () => [{ label: 'ONE' }];
    const f = analyzeSurfaces({ ...d, ceilings: { ...CEILINGS, pointlessLessons: 99, thinPointLessons: 0 } });
    expect(f.join(' ')).toMatch(/one point or none/);
  });

  it('CATCHES a play button whose label is a constant placeholder', () => {
    const d = healthy();
    d.presenterSource = "setReadTarget(owner, {\n  label: 'this part of the message',\n});";
    const f = analyzeSurfaces(d);
    expect(f.join(' ')).toMatch(/constant read-aloud label/);
  });

  it('CATCHES the lesson\'s own prose never reaching the deck', () => {
    const d = healthy();
    const real = d.lessonPresentable;
    d.lessonPresentable = (...a) => {
      const p = real(...a);
      p.scenes.forEach((s) => { s.notes = [{ kind: 'body', heading: 'x', body: 'a summary instead of the words' }]; });
      return p;
    };
    const f = analyzeSurfaces(d);
    expect(f.join(' ')).toMatch(/never reach the presenter deck/);
  });

  it('does NOT cry on a lesson whose sections are split across notes', () => {
    // The first version of check 4 sampled a 120-char window from the middle of
    // the lesson and flagged ll18 — which was correct code. A guard that cries
    // on correct code teaches people to ignore it.
    const d = healthy();
    const real = d.lessonPresentable;
    d.lessonPresentable = (...a) => {
      const p = real(...a);
      p.scenes[0].notes.push({ kind: 'list', heading: 'Say this', items: ['an interleaved note'] });
      return p;
    };
    expect(analyzeSurfaces(d)).toEqual([]);
  });

  it('the ceilings are shrink-only markers, not aspirations', () => {
    expect(CEILINGS.blankPresenterPanels).toBe(0);
    expect(CEILINGS.pointlessLessons).toBeLessThanOrEqual(50);
    expect(CEILINGS.thinPointLessons).toBeLessThanOrEqual(55);
  });

  it('the shipped Presenter carries a label built from the part, not a constant', () => {
    expect(PRESENTER).toMatch(/partLabel/);
    expect(PRESENTER).not.toContain("label: 'this part of the message'");
  });
});
