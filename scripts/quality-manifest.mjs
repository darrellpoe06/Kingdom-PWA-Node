// =============================================================================
// quality-manifest — the REAL proof feed behind the in-app Quality / Proof panel
// =============================================================================
// Darrell, 2026-06-16: "proof should show up inside the app somewhere ... all
// loops return and inform inside." This is the build-time half of that: it reads
// the repo's ACTUAL verification artifacts and emits a render-ready manifest. It
// fabricates nothing — every row points at a real file on disk, and the build
// VERIFIES that file exists. Delete a gate's test and this manifest drops it to
// `verified:false` (proven-to-catch); it can never paint a green it didn't earn.
//
// Three real sources, all on disk in this repo:
//   1. GATES   — the deterministic, adversarial "break-it" checks that run inside
//                the required CI suite (`npm run verify` = lint + vitest). Each is
//                a guard script PLUS a vitest that proves the guard catches the
//                break (DR-0076 proven-to-catch). Both files must exist.
//   2. LOOPS   — the closed-loop tests: a real outcome flows through the app and
//                a test asserts it RETURNS and INFORMS (the save persisted, the
//                feed rendered, the orchestration outcome surfaced). One test file
//                each, verified present.
//   3. CONTRAST— the live WCAG 2.1 AA contrast measurement (contrast-guard's
//                scanContrast over the real theme CSS). A measured number, not a
//                claim.
//
// Per-row PASS/FAIL is NOT asserted here (existence != pass — Verification
// Doctrine). The live pass/fail is the CI conclusion for the served SHA, fetched
// in the browser (lib/quality-proof.js + lib/github-ops.js). This manifest proves
// the checks EXIST and are WIRED into the merge gate; the live CI says they were
// green on the build you are looking at.
//
// Importable (buildQualityManifest) so vite.config bakes it into __QUALITY_PROOF__
// and a vitest gates it. CLI: `node scripts/quality-manifest.mjs` prints it.
// =============================================================================
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanContrast } from './contrast-guard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP_TESTS = 'app/src/__tests__';

// --- the curated registries (each entry NAMES a real file we then verify) -----
//
// The text (name / catches / proves) is documentation; the truth is the path.
// Adding a row without its file => the build marks it unverified, loudly.

// Adversarial "break-it" / deterministic gates wired into `npm run verify`.
// Each has a guard script AND a vitest that proves the guard catches the break.
const GATE_REGISTRY = [
  { id: 'contrast',     name: 'Per-theme WCAG 2.1 AA contrast', catches: 'Unreadable text on any theme; a comment claiming AA while the real ratio fails.', script: 'scripts/contrast-guard.mjs',        test: `${APP_TESTS}/contrast-guard.test.js` },
  { id: 'legibility',   name: 'Per-page legibility (dark-on-dark)', catches: 'A NEW page shipping dark-on-dark text via an un-themeable inline color (the recipe-on-black bug). Per-page, recursive, baseline-ratcheted.', script: 'scripts/legibility-guard.mjs',     test: `${APP_TESTS}/legibility-guard.test.js` },
  { id: 'tenancy',      name: 'Tenancy / data-isolation guard',  catches: 'A query that could read across instances (one family seeing another). DR-0060.', script: 'scripts/tenancy-guard.mjs',         test: `${APP_TESTS}/tenancy-guard.test.js` },
  { id: 'grant',        name: 'DB authenticated-grant guard',     catches: 'A new table missing its authenticated GRANT (the 42501 that 403d Choir saves).', script: 'scripts/grant-guard.mjs',           test: `${APP_TESTS}/grant-guard.test.js` },
  { id: 'conf-rls',     name: 'Conference RLS no-leak',           catches: 'Conference rows readable outside their instance (cross-tenant event leak).',   script: 'scripts/conference-rls-guard.mjs', test: `${APP_TESTS}/conference-rls-noleak.test.js` },
  { id: 'conf-link',    name: 'Conference link-safety / no-leak', catches: 'A registration->account link that reads the roll, hijacks a claimed row, or sets a non-caller user.', script: 'scripts/conference-link-guard.mjs', test: `${APP_TESTS}/conference-signup-funnel.test.js` },
  { id: 'fab-overlap',  name: 'Floating-action overlap guard',   catches: 'Stacked floating controls overlapping into an untappable / hidden target.',     script: 'scripts/fab-overlap-guard.mjs',     test: `${APP_TESTS}/fab-overlap-guard.test.js` },
  { id: 'feedback-area',name: 'Feedback area-coverage guard',    catches: 'A nav tab / sub-tab shipped with no feedback area pointing at it.',             script: 'scripts/feedback-area-guard.mjs',   test: `${APP_TESTS}/feedback-area-coverage.test.js` },
  { id: 'pin-plaintext',name: 'PIN never-plaintext guard',       catches: 'A PIN written to storage in plaintext instead of hashed.',                      script: null,                                test: `${APP_TESTS}/pin-no-plaintext.test.js` },
  { id: 'portable-fresh',name:'Portable-bundle freshness gate',  catches: 'The client-handoff orchestrator bundle silently drifting from canon.',          script: 'scripts/portable-manifest.mjs',     test: `${APP_TESTS}/portable-bundle-fresh.test.js` },
  { id: 'entity-poll',  name: 'Entity-pollution guard',          catches: 'Seed / demo entities bleeding into a real signed-in world.',                    script: null,                                test: `${APP_TESTS}/entity-pollution.test.js` },
  { id: 'sync-safety',  name: 'Sync data-safety guard',          catches: 'A sync that replaces instead of merges and could drop a users real rows.',      script: null,                                test: `${APP_TESTS}/sync-data-safety.test.js` },
  { id: 'surface-audit',name: 'Proactive surface audit (DR-0086)',catches: 'A served surface shipping a static tile, an endless-scroll list, a dead-end / coming-soon, or an unreachable registered surface -- the class Darrell had to name on 2026-07-01. Files findings to the Concerns board.', script: 'scripts/surface-audit.mjs',         test: `${APP_TESTS}/surface-audit.test.js` },
];

// Closed-loop tests: a real outcome flows through the app and a test asserts it
// RETURNS and INFORMS in-app. "Loop silently failed / outcome did not return"
// is exactly what these lock against.
const LOOP_REGISTRY = [
  { id: 'choir-save',     name: 'Choir save loop',            proves: 'A choir schedule/sermon save persists and reports saved:true (the 2026-06-16 incident lane).', test: `${APP_TESTS}/choir-sync-writes.test.js` },
  { id: 'conf-funnel',    name: 'Conference signup funnel loop', proves: 'Open register works without an account; opt-in links the registration to the new account; skip stays fully registered.', test: `${APP_TESTS}/conference-signup-funnel.test.js` },
  { id: 'family-voice',   name: 'One Voice (family input) loop', proves: 'A family member speaks/types once and the words route to the right destination and come back.',  test: `${APP_TESTS}/one-voice-routing.test.js` },
  { id: 'one-voice-disp', name: 'One Voice -> dispatch loop',  proves: 'A One Voice need becomes a real dispatch work order, not a dropped message.',                    test: `${APP_TESTS}/one-voice-dispatch.test.js` },
  { id: 'feedback',       name: 'Feedback loop',              proves: 'Feedback (with screenshots) is captured and every surface has somewhere to send it.',           test: `${APP_TESTS}/feedback-screenshots.test.js` },
  { id: 'orch-outcome',   name: 'Orchestration-outcome loop', proves: 'The branch/merge orchestration outcome (PRs, lanes, SHAs) returns into the app honestly.',      test: `${APP_TESTS}/github-ops.test.js` },
  { id: 'workflow-status',name: 'Automation-status loop',     proves: 'The real n8n workflow run-status returns into the app (or degrades honestly offline).',         test: `${APP_TESTS}/workflow-status.test.js` },
  { id: 'review-feed',    name: 'Governor review loop',       proves: 'The Governor review feed reads the real freshness signal and renders it in-app.',               test: `${APP_TESTS}/review-feed.test.js` },
  { id: 'loop-health',    name: 'Loop self-review loop',      proves: 'The app reviews its OWN loops for stagnation and surfaces keep/retire.',                        test: `${APP_TESTS}/loop-health.test.js` },
  { id: 'governance',     name: 'Governance-decision loop',   proves: 'Open governance decisions parse from the real queue file and surface in-app.',                  test: `${APP_TESTS}/governance-queue.test.js` },
  { id: 'llm-review',     name: 'Local-LLM review loop',      proves: 'The local-model diff review returns into the app as advisory findings (or says it is offline).', test: `${APP_TESTS}/llm-review.test.js` },
  { id: 'conflict-eval',  name: 'Conflict-evaluation loop',   proves: 'Orchestration conflicts are recorded as events; the loop ranks hot files + decomposition so conflicts trend DOWN as we grow.', test: `${APP_TESTS}/conflict-analytics.test.js` },
];

// --- verification (the only source of truth for a row's status) ---------------
function verifyRow(row) {
  const testOk = !!row.test && existsSync(join(ROOT, row.test));
  const scriptOk = row.script ? existsSync(join(ROOT, row.script)) : true; // null = no separate script
  return { ...row, verified: testOk && scriptOk, testExists: testOk, scriptExists: row.script ? scriptOk : null };
}

// --- the CI floor, read from the REAL workflow file --------------------------
// So the panel can say "these run on every merge" sourced from ci.yml, not typed.
function readCiFloor() {
  const out = { workflow: '.github/workflows/ci.yml', exists: false, steps: [] };
  try {
    const raw = readFileSync(join(ROOT, out.workflow), 'utf8');
    out.exists = true;
    if (/npm run lint/.test(raw)) out.steps.push('lint (eslint, 0 warnings)');
    if (/vitest run/.test(raw)) out.steps.push('vitest (full suite)');
    if (/wf36|quality-gatekeeper/i.test(raw)) out.steps.push('wf36 quality-gatekeeper harness');
  } catch { /* exists stays false */ }
  return out;
}

// --- live WCAG contrast measurement (real numbers) ---------------------------
function measureContrast() {
  try {
    const { themes, violations } = scanContrast();
    const names = Object.keys(themes);
    return {
      ok: true,
      pass: violations.length === 0,
      themes: names,
      themeCount: names.length,
      violations: violations.map((v) => ({ theme: v.theme, what: v.what, fg: v.fg, bg: v.bg, ratio: v.ratio || null, error: v.error || null })),
      standard: 'WCAG 2.1 AA (4.5:1 normal text)',
    };
  } catch (e) {
    return { ok: false, pass: false, themes: [], themeCount: 0, violations: [], error: (e && e.message) || 'contrast scan unavailable' };
  }
}

// --- assemble ----------------------------------------------------------------
export function buildQualityManifest() {
  const gates = GATE_REGISTRY.map(verifyRow);
  const loops = LOOP_REGISTRY.map(verifyRow);
  const contrast = measureContrast();
  const ci = readCiFloor();
  return {
    ok: true,
    gates,
    loops,
    contrast,
    ci,
    summary: {
      gatesVerified: gates.filter((g) => g.verified).length,
      gatesTotal: gates.length,
      loopsVerified: loops.filter((l) => l.verified).length,
      loopsTotal: loops.length,
      contrastPass: contrast.pass === true,
      allVerified: gates.every((g) => g.verified) && loops.every((l) => l.verified),
    },
  };
}

// --- CLI ---------------------------------------------------------------------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const m = buildQualityManifest();
  const miss = [...m.gates, ...m.loops].filter((r) => !r.verified);
  console.log('# QUALITY MANIFEST (real, file-verified)\n');
  console.log(`Gates verified: ${m.summary.gatesVerified}/${m.summary.gatesTotal}`);
  console.log(`Loops verified: ${m.summary.loopsVerified}/${m.summary.loopsTotal}`);
  console.log(`Contrast (WCAG 2.1 AA): ${m.contrast.pass ? 'PASS' : 'FAIL'} over themes [${m.contrast.themes.join(', ')}]`);
  if (m.contrast.violations.length) for (const v of m.contrast.violations) console.log(`  - [${v.theme}] ${v.what}: ${v.fg} on ${v.bg} = ${v.ratio || v.error}`);
  if (miss.length) {
    console.log(`\nUNVERIFIED (${miss.length}) — a listed check is missing its file:`);
    for (const r of miss) console.log(`  - ${r.id}: ${!r.testExists ? `test ${r.test} MISSING` : ''}${r.scriptExists === false ? ` script ${r.script} MISSING` : ''}`);
    process.exit(1);
  }
  console.log('\nAll listed gates + loops are present and wired.');
}
