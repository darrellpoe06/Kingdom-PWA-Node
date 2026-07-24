#!/usr/bin/env node
// =============================================================================
// large-print-guard — fixed-px font sizes must not exist on church/lesson surfaces
// =============================================================================
// WHY (COMMUNITY-FIRST-MISSION + DR-0145/DR-0147): the large-print control
// (lib/text-size.js, A / A+ / A++ / A+++ / A44) scales the document ROOT
// font-size, so only rem/em-based text grows. A fixed-px font size —
// `text-[10px]` or `style={{ fontSize: '11px' }}` — stays tiny at EVERY step,
// which is exactly the failure COLG staff reported from the church computer
// (2026-07-24, Eldris Moore's feedback with screenshots: "the print is so
// small you can't see no matter what font you have it at"). The fix pattern is
// established (2026-06-17 coverage rule): author the same size in rem at the
// 16px baseline (text-[10px] -> text-[0.625rem]) — pixel-identical at Normal,
// scaling at every larger step.
//
// This guard makes that class of miss a BUILD FAILURE (DR-0076 §2: gates over
// claims) for every surface reachable from the Church tab plus the lesson /
// presentation surfaces and the shared building blocks they render. The paired
// test (app/src/__tests__/large-print-guard.test.js) proves it catches.
//
// CLI: node scripts/large-print-guard.mjs   (exit 1 on violations)
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTS_DIR = join(ROOT, 'app', 'src', 'components');

// Every component rendered under view === 'church' (all churchView branches in
// poe-financial-mvp-v28.jsx), the lesson/presentation surfaces ChurchLearn
// renders, and the shared primitives those surfaces compose. Keep this list in
// sync when a new church sub-view lands — adding the file here is part of
// shipping the surface.
export const GUARDED_FILES = [
  // church sub-views
  'ChurchHome.jsx',
  'Engagement.jsx',
  'Choir.jsx',
  'ChoirRenditions.jsx',
  'ChoirSongbook.jsx',
  'ChoirSongWorkshop.jsx',
  'ServiceProgram.jsx',
  'Pulpit.jsx',
  'ScriptureLibrary.jsx',
  'EternalAlgorithmsStudy.jsx',
  'EventManagement.jsx',
  'EventCenterModule.jsx',
  'ConferenceModule.jsx',
  'ConferenceVariance.jsx',
  'HarvestLedger.jsx',
  'ChurchVideoWall.jsx',
  'DeviceInventory.jsx',
  'ChurchInfraPlan.jsx',
  'ChurchObservation.jsx',
  'ChurchLearn.jsx',
  'ChurchGiving.jsx',
  'ChurchProjects.jsx',
  'ChurchOneVoice.jsx',
  'BusMinistry.jsx',
  // lesson / presentation surfaces ChurchLearn composes
  'StoryLibrary.jsx',
  'LessonFlow.jsx',
  'BiblicalTimeline.jsx',
  'Presenter.jsx',
  'DiscernmentStages.jsx',
  'SectionTabs.jsx',
  'FollowAlong.jsx',
  'games/StoryExplorer.jsx',
  // shared primitives these surfaces render
  'shared.jsx',
  'SectionBoundary.jsx',
  'Lightbox.jsx',
];

// A fixed-px font size, in either authoring form:
//   1. Tailwind arbitrary font-size class: text-[10px] (word-boundary so
//      colors/tracking/etc. never match)
//   2. Inline style px: fontSize: '11px' / "11px" / fontSize: 11 (a bare
//      numeric literal is px in React). rem/em values never match.
const PX_CLASS_RE = /\btext-\[\d+(?:\.\d+)?px\]/g;
const PX_INLINE_RE = /fontSize:\s*(?:['"]\d+(?:\.\d+)?px['"]|\d+(?:\.\d+)?\s*[,}])/g;

/**
 * Scan one source string for fixed-px font sizes. Returns violations as
 * { line, match } records. Pure — unit-testable without the filesystem.
 */
export function scanSourceForFixedPx(src) {
  const violations = [];
  const lines = String(src).split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const re of [PX_CLASS_RE, PX_INLINE_RE]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(lines[i])) !== null) {
        violations.push({ line: i + 1, match: m[0].trim() });
      }
    }
  }
  return violations;
}

/**
 * Scan every guarded church/lesson surface file. Returns
 * { scanned: string[], missing: string[], violations: {file,line,match}[] }.
 * A guarded file that has been deleted/renamed lands in `missing` so the list
 * can never rot into vacuous green silently.
 */
export function scanGuardedSurfaces(dir = COMPONENTS_DIR) {
  const scanned = [];
  const missing = [];
  const violations = [];
  for (const f of GUARDED_FILES) {
    const p = join(dir, f);
    if (!existsSync(p)) { missing.push(f); continue; }
    scanned.push(f);
    for (const v of scanSourceForFixedPx(readFileSync(p, 'utf8'))) {
      violations.push({ file: f, ...v });
    }
  }
  return { scanned, missing, violations };
}

// CLI entry
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { scanned, missing, violations } = scanGuardedSurfaces();
  if (missing.length) {
    console.error(`large-print-guard: guarded files missing (update GUARDED_FILES): ${missing.join(', ')}`);
  }
  if (violations.length) {
    for (const v of violations) console.error(`  ${v.file}:${v.line}  ${v.match}`);
    console.error(`large-print-guard: ${violations.length} fixed-px font size(s) on church/lesson surfaces — these ignore the large-print control. Author in rem (px/16).`);
    process.exit(1);
  }
  console.log(`large-print-guard: OK — ${scanned.length} church/lesson surfaces, no fixed-px font sizes.`);
}
