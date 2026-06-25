// =============================================================================
// module-boundary-guard — deterministic hybrid-modular boundary gate (DR-0076)
// =============================================================================
// DR-0078 / MODULE-ARCHITECTURE-ADR §4.1 names a boundary law that must become a
// GREEN CHECK, not a claim: a feature module may import core; the CORE imports
// no feature; feature modules do not import each other's mount layer. This gate
// makes the Stage-1 slice of that law machine-checkable so the surface-mount
// registry (app/src/surfaces.js) cannot silently re-tangle into the monolith.
//
// Three invariants, $0, no browser — each TRUE on main today and each catching a
// real regression class (proven-to-catch in the companion vitest):
//
//   1. REGISTRY PURITY (absorbs choke-point C1). app/src/surfaces.js is core;
//      it must mount a surface ONLY through a lazy `() => import(...)` thunk and
//      must NEVER statically `import` a feature component at the top of the file.
//      A static import here re-creates the import-block collision the registry
//      exists to remove AND eagerly pulls the chunk into the shell (kills the
//      code-split). Dynamic import() inside a loader is allowed and expected.
//
//   2. REGISTRY IS SHELL-ONLY. No feature module (components/*.jsx, lib/*.js)
//      may import surfaces.js. The registry is the MOUNT layer the shell owns; a
//      feature reaching into it inverts the dependency (a surface deciding how
//      surfaces mount). Reading another module's data goes through core sync /
//      the Events spine, never the registry.
//
//   3. SHELL IS NOT IMPORTED BY FEATURES. No feature module may statically
//      import the monolith shell (poe-financial-mvp-v28.jsx). Features are
//      mounted BY the shell; a feature importing the shell is a child reaching
//      into its parent — exactly the coupling the modular split removes.
//
// Importable for vitest; CLI: node scripts/module-boundary-guard.mjs
// =============================================================================
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'app/src');
const REGISTRY = join(SRC, 'surfaces.js');
const MONOLITH_BASENAME = 'poe-financial-mvp-v28.jsx';

// BASELINE (DR-0075: a justified non-improvement is a recorded decision WITH a
// re-review date). Three feature files import shared helpers (findRelatedAuto,
// frequencyToMonthly, and the financial-calc helpers) back out of the monolith
// shell — a pre-existing coupling inversion that predates the registry. Lifting
// those helpers into a core lib (e.g. lib/financial-shared.js) is Stage 2/3
// work (peel the trapped shared helpers); doing it inside Stage 1 would over-
// reach the registry slice. The gate FREEZES this baseline: it hard-fails any
// NEW shell import while these three known edges are grandfathered, so the
// boundary is locked going forward and the debt is named, not hidden.
// re-review: 2026-08-01 (after the July conference — extract the trapped helpers
// into a core lib and delete these entries; the gate then proves zero inversions).
export const SHELL_IMPORT_BASELINE = new Set([
  'components/Practice.jsx',
  'components/Rentals.jsx',
  'lib/financial-calcs.js',
]);

// All STATIC import sources in a source string: `import ... from 'X'`.
// Deliberately does NOT match dynamic `import('X')` — that is a runtime mount,
// not a static coupling, and is the legal way the registry loads a surface.
export function staticImportSources(src) {
  const out = [];
  const re = /^\s*import\s+(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]/gm;
  let m;
  while ((m = re.exec(src)) !== null) out.push(m[1]);
  return out;
}

// Invariant 1: the registry may not statically import a feature component.
export function registryStaticFeatureImports(src) {
  return staticImportSources(src).filter((s) => /\/components\//.test(s) || /^\.\/components\//.test(s));
}

// A feature source file (a component or lib), excluding the registry + shell +
// tests + the shared-primitive core files.
function isFeatureFile(absPath) {
  const rel = absPath.slice(SRC.length + 1).replace(/\\/g, '/');
  if (rel === 'surfaces.js') return false;
  if (rel === MONOLITH_BASENAME) return false;
  if (rel.startsWith('__tests__/')) return false;
  if (rel.startsWith('shims/')) return false;
  return rel.startsWith('components/') || rel.startsWith('lib/');
}

function srcFiles(dir) {
  let out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (f === '__tests__' || f === 'node_modules' || f === 'shims') continue;
      out = out.concat(srcFiles(p));
    } else if (/\.(jsx?|mjs)$/.test(f)) {
      out.push(p);
    }
  }
  return out;
}

// Invariants 2 & 3 over every feature file.
export function featureViolations(files) {
  const importsRegistry = [];
  const importsShell = [];
  for (const file of files) {
    if (!isFeatureFile(file)) continue;
    const sources = staticImportSources(readFileSync(file, 'utf8'));
    const label = file.slice(SRC.length + 1).replace(/\\/g, '/');
    for (const s of sources) {
      if (/(^|\/)surfaces(\.js)?$/.test(s)) importsRegistry.push({ file: label, imports: s });
      if ((basename(s) === MONOLITH_BASENAME || /poe-financial-mvp-v28/.test(s)) && !SHELL_IMPORT_BASELINE.has(label)) {
        importsShell.push({ file: label, imports: s });
      }
    }
  }
  return { importsRegistry, importsShell };
}

export function scan() {
  const registrySrc = readFileSync(REGISTRY, 'utf8');
  const registryViolations = registryStaticFeatureImports(registrySrc);

  const files = srcFiles(SRC);
  const featureFileCount = files.filter(isFeatureFile).length;
  const { importsRegistry, importsShell } = featureViolations(files);

  const violations = [];
  for (const s of registryViolations) violations.push(`surfaces.js statically imports a feature component: ${s} (mount it via a lazy load thunk instead)`);
  for (const v of importsRegistry) violations.push(`${v.file} imports the registry (surfaces.js) — the registry is shell-only`);
  for (const v of importsShell) violations.push(`${v.file} imports the shell (${MONOLITH_BASENAME}) — features are mounted BY the shell, never the reverse`);

  return {
    registryViolations,
    importsRegistry,
    importsShell,
    featureFileCount,
    violations,
    ok: violations.length === 0,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = scan();
  if (r.ok) {
    console.log(`module-boundary-guard: OK — registry pure, ${r.featureFileCount} feature files respect the boundary.`);
    process.exit(0);
  }
  console.error('module-boundary-guard: BOUNDARY VIOLATION(S):');
  for (const v of r.violations) console.error('  - ' + v);
  process.exit(1);
}
