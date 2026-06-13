// =============================================================================
// fruit-scout — deterministic low-hanging-fruit discovery (DR-0057)
// =============================================================================
// The cheapest, safest half of "the system always knows what's next": a plain
// scan — NO LLM, $0, no network, no autonomous spend — that finds exported
// functions in app/src not yet referenced by any test, and ranks them as the
// next coverage fruit. This is exactly the class of work done by hand on
// 2026-06-12 (calc engines, data-integrity, voice-worker), surfaced
// automatically so the queue is never empty and never guessed.
//
// HEURISTIC, honestly: "covered" = the export's name appears in some test file.
// Name-appears != truly tested, so this is a discovery SIGNAL (what to look at),
// not a coverage proof. It over-counts coverage if a name is merely mentioned;
// it never invents a function. Good enough to keep the fruit queue full.
//
// Run on demand:  node scripts/fruit-scout.mjs
// Exit code is always 0 (report-only — it never fails a build).
// =============================================================================
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'app/src';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(js|jsx)$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk(SRC);
const isTest = (p) => p.includes('__tests__');
const testBlob = files.filter(isTest).map(p => readFileSync(p, 'utf8')).join('\n');

const EXPORT_RE = /export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)|export\s+const\s+([A-Za-z0-9_]+)\s*=/g;

const fruit = [];
for (const p of files.filter(f => !isTest(f))) {
  const text = readFileSync(p, 'utf8');
  let m;
  while ((m = EXPORT_RE.exec(text)) !== null) {
    const name = m[1] || m[2];
    if (!name) continue;
    const covered = new RegExp(`\\b${name}\\b`).test(testBlob);
    if (!covered) {
      // Lowercase-first = utility/function (prime fruit). Capitalized =
      // likely a React component (lower priority — needs render testing).
      const kind = /^[a-z]/.test(name) ? 'fn' : 'component';
      fruit.push({ name, file: p.replace(`${SRC}/`, ''), kind });
    }
  }
}

fruit.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'fn' ? -1 : 1));
const fns = fruit.filter(f => f.kind === 'fn');
const comps = fruit.filter(f => f.kind === 'component');

console.log('# FRUIT QUEUE — untested exported names (deterministic scan)\n');
console.log(`Prime fruit (utility functions — specifiable + verifiable): ${fns.length}`);
for (const f of fns) console.log(`  - ${f.name}   (${f.file})`);
console.log(`\nComponents (need render tests; higher fruit): ${comps.length}`);
for (const f of comps.slice(0, 40)) console.log(`  - ${f.name}   (${f.file})`);
console.log(`\nTotal uncovered exports: ${fruit.length}. (Heuristic signal, not a coverage proof.)`);
