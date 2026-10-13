#!/usr/bin/env node
// =============================================================================
// surface-hollow-guard — THE COMPREHENSIVE QUALITY CHECKER for hollow surfaces.
// =============================================================================
// Darrell 2026-09-13, twice in one session, from behind the pulpit:
//   "How can there be no presenters notes with all this content?!!! Why is the
//    play button showing no actual meaning in that view of the lesson?!!!
//    Context and competence is needed!!! Fix it!"
//   "1 point for the whole lesson?!!! Very unlikely!!!"
//   "Quality checker that works comprehensively... added to the Ways and
//    documentation."
//
// THE CLASS OF DEFECT THIS EXISTS TO CATCH — a HOLLOW SURFACE: a screen that
// renders its empty state, a placeholder, or a generic label WHILE THE REAL
// CONTENT EXISTS AND IS REACHABLE. It is worse than a missing feature, because
// it looks finished. Every gate in this repo until now checked whether data was
// CORRECT; none checked whether an authored asset actually ARRIVED on the
// surface that is supposed to show it. Three real instances shipped:
//
//   1. lessonPresentable routed notes by run-of-show NAME, so six of nine parts
//      of L142 showed "No presenter notes for this one" while the lesson held
//      ~14,000 characters — and module.lesson was never read by the adapter.
//   2. The caps-lead point detector could not see a heading that closes with a
//      full stop, which is the house's commonest form, so 60 of 145 lessons
//      reported ZERO points and 93 reported one or none.
//   3. The presenter's read-aloud registered the label "this part of the
//      message" on every part of every lesson — a play button with no meaning.
//
// This guard measures all three on the REAL corpus (DR-0076 §4: measure, never
// claim) and fails the build on a regression. Proven-to-catch (DR-0076 §3) by
// src/__tests__/surface-hollow-guard.test.js, which feeds it each break and
// REQUIRES a finding.
//
// THE DEBT LISTS ARE SHRINK-ONLY. An honest zero is allowed — 44 lessons are
// flowing narrative whose author wrote no point structure, and inventing an
// outline for them would be fabricating one (DR-0076). So the ceiling is a
// measured number that may only go DOWN; raising it is the regression.
// =============================================================================
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP = join(ROOT, 'app/src');

// Measured ceilings, 2026-09-13. Shrink-only: lower them when the number drops,
// never raise them. A raise is the regression this guard exists to stop.
export const CEILINGS = {
  blankPresenterPanels: 0,   // a blank panel mid-sermon is never acceptable
  pointlessLessons: 50,      // lessons whose author wrote no point structure
  thinPointLessons: 55,      // ... or only one
};

// A label is HOLLOW when it says nothing about what it points at. These are the
// exact strings that shipped; the check is that none of them is a CONSTANT — a
// label must be built from the thing it describes.
const HOLLOW_LABELS = [
  "label: 'this part of the message'",
  "label: 'this'",
  "label: 'this page'",
];

/**
 * analyzeSurfaces(deps) — the checks as a PURE function of their inputs, so the
 * proven-to-catch test can feed each break directly instead of vandalising the
 * app to see the guard react (DR-0076 §3). runSurfaceHollowGuard() below is the
 * thin wrapper that supplies the real corpus.
 */
export function analyzeSurfaces(deps) {
  const {
    modules, lessonPresentable, lessonPoints, lessonSections, presenterSource,
    ceilings = CEILINGS,
  } = deps;
  const findings = [];
  const LIVING_LESSONS_MODULES = modules;

  // --- 1. NO PRESENTED PART MAY BE BLANK ------------------------------------
  const blank = [];
  for (const m of LIVING_LESSONS_MODULES) {
    for (const sc of lessonPresentable(m, { level: 'senior' }).scenes) {
      if (!Array.isArray(sc.notes) || sc.notes.length === 0) blank.push(`${m.id} · ${sc.indexLabel}`);
    }
  }
  if (blank.length > ceilings.blankPresenterPanels) {
    findings.push(`${blank.length} presented part(s) render the empty-notes card while the lesson has content:\n    ${blank.slice(0, 10).join('\n    ')}`);
  }

  // --- 2. A LESSON WITH REAL PROSE MUST SHOW ITS REAL POINTS ----------------
  const counts = LIVING_LESSONS_MODULES.map((m) => lessonPoints(m.lesson || '').length);
  const zero = counts.filter((c) => c === 0).length;
  const thin = counts.filter((c) => c <= 1).length;
  if (zero > ceilings.pointlessLessons) {
    findings.push(`${zero} lessons report ZERO points (ceiling ${ceilings.pointlessLessons}) — the point detector is missing the house's heading form again`);
  }
  if (thin > ceilings.thinPointLessons) {
    findings.push(`${thin} lessons report one point or none (ceiling ${ceilings.thinPointLessons})`);
  }

  // --- 3. NO CONTROL MAY DESCRIBE ITSELF WITH A CONSTANT PLACEHOLDER --------
  const presenter = presenterSource;
  for (const hollow of HOLLOW_LABELS) {
    if (presenter.includes(hollow)) {
      findings.push(`Presenter.jsx registers a constant read-aloud label ${hollow} — a play button must name what it will read`);
    }
  }

  // --- 4. THE LESSON'S LARGEST ASSET MUST REACH THE DECK --------------------
  // module.lesson went unread by lessonPresentable for its whole life. This is
  // the standing check that the biggest authored asset actually arrives.
  //
  // THE CHECK IS PER-SECTION, NOT A WINDOW INTO THE WHOLE. The first version
  // sampled 120 characters from the middle of the lesson and required them
  // contiguous on the deck. It reported ll18 on its very first run — and ll18
  // was FINE: all six of its sections were routed, and the sample had simply
  // straddled the boundary between two of them, which the deck necessarily
  // joins in note order. A guard that cries on correct code teaches people to
  // ignore it, so the property it asserts is the real one: every substantial
  // SECTION of the lesson appears verbatim somewhere in the presenter notes.
  const flat = (t) => String(t || '').replace(/\s+/g, ' ').trim();
  for (const m of LIVING_LESSONS_MODULES) {
    const sections = lessonSections(m.lesson || '').filter((sec) => sec.body.length > 200);
    if (!sections.length) continue;
    const onDeck = flat(lessonPresentable(m, { level: 'senior' }).scenes
      .flatMap((sc) => (sc.notes || []).map((n) => n.body || '')).join(' \u0000 '));
    const missing = sections.filter((sec) => !onDeck.includes(flat(sec.body)));
    if (missing.length) {
      findings.push(`${m.id}: ${missing.length} section(s) of the lesson never reach the presenter deck — ${missing.map((x) => x.label || '(opening)').slice(0, 3).join(', ')}`);
    }
  }

  return findings;
}

export async function runSurfaceHollowGuard() {
  const { LIVING_LESSONS_MODULES } = await import(pathToFileURL(join(APP, 'lib/living-lessons-class.js')).href);
  const { lessonPresentable } = await import(pathToFileURL(join(APP, 'lib/presentable.js')).href);
  const { lessonPoints, lessonSections } = await import(pathToFileURL(join(APP, 'lib/lesson-format.js')).href);
  return analyzeSurfaces({
    modules: LIVING_LESSONS_MODULES,
    lessonPresentable,
    lessonPoints,
    lessonSections,
    presenterSource: readFileSync(join(APP, 'components/Presenter.jsx'), 'utf8'),
  });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const findings = await runSurfaceHollowGuard();
  if (findings.length) {
    console.error('surface-hollow-guard: HOLLOW SURFACES FOUND\n');
    findings.forEach((f) => console.error(`  ✗ ${f}\n`));
    console.error('A surface that renders its empty state while the content exists looks finished and is not.');
    process.exit(1);
  }
  console.log('surface-hollow-guard: every presented part carries real content; no constant placeholder labels.');
}
