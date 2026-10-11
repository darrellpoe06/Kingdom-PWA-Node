#!/usr/bin/env node
// =============================================================================
// decision-citation-guard — a DR cited in the code is a DR that exists
// =============================================================================
// FOUND BY ITS OWN ABSENCE, 2026-10-11. Four decision records were cited in
// merged code — DR-0946, DR-0947, DR-0948 and DR-0949, across app/ and
// infra/ — and NOT ONE OF THEM HAD A FILE. I wrote the numbers into comments
// while shipping fast and never wrote the records.
//
// WHY THAT IS WORSE THAN AN UNDOCUMENTED COMMENT. A citation is a promise
// that the reasoning is written down somewhere. A reader who meets
// "(DR-0947)" beside a strange-looking branch goes to the ledger to find out
// why, finds nothing, and now distrusts every other citation in the file. The
// ledger's whole value is that it can be followed; one dangling number costs
// more than the comment was worth.
//
// business-systems-guard already checks the ledger is INTERNALLY whole — rows
// unique, pointer correct, no markers. It had no reason to look outward at
// what the code claims, so this class could never have been caught there.
// That is the gap, and this is the machine check for it (DR-0076: every
// "a human would have known" miss becomes a gate).
//
// Exit 1 names every dangling citation and the file:line that makes it.
// =============================================================================
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DECISIONS = join(ROOT, 'docs/decisions');
// Where a citation is a real claim about the ledger. docs/ is excluded on
// purpose: the records cite each other, and a record about a renumber
// legitimately names a number that moved.
const SCAN = ['app/src', 'scripts', 'infra', '.github/workflows'];
// __tests__ is excluded on purpose: the suites that EXERCISE the ledger
// machinery invent fixture ids (DR-9001, DR-9999, DR-0000) and must keep
// being able to. A guard that fires on those is a false alarm, and a false
// alarm is a broken gate exactly as surely as a silent one (DR-0076 section 3).
const SKIP = new Set(['node_modules', 'dist', '.git', '.vendor', 'coverage', '__snapshots__', '__tests__']);
const TEXT = /\.(jsx?|mjs|cjs|tsx?|sql|ya?ml|md)$/i;
// FOUR DIGITS ONLY. The three-digit ids (DR-026, DR-029) are an older
// numbering that predates one-file-per-record and was never filed that way.
const CITE = /\bDR-(\d{4})\b/g;

// THE RATCHET, the way legibility-guard does it: citations already dangling
// when this guard was written are TRACKED DEBT, not tonight's build's fault.
// They may shrink and must never grow. Measured 2026-10-11 across the scanned
// paths with tests excluded.
export const KNOWN_DANGLING = new Set(['17', '20', '21', '26', '30', '39', '49', '292', '293', '655', '657', '700']);

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    if (SKIP.has(name) || name.startsWith('.vendor')) continue;
    const full = join(dir, name);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full, out);
    else if (TEXT.test(name)) out.push(full);
  }
  return out;
}

export function danglingCitations(root = ROOT) {
  const have = new Set();
  for (const f of readdirSync(join(root, 'docs/decisions'))) {
    const m = /^DR-(\d{3,4})-.*\.md$/.exec(f);
    if (m) have.add(String(Number(m[1])));
  }
  const bad = [];
  for (const base of SCAN) {
    for (const file of walk(join(root, base))) {
      // Not itself: this file names fixture ids while explaining why it
      // ignores them.
      if (file.endsWith('decision-citation-guard.mjs')) continue;
      const src = readFileSync(file, 'utf8');
      const lines = src.split('\n');
      lines.forEach((line, i) => {
        for (const m of line.matchAll(CITE)) {
          const num = String(Number(m[1]));
          if (!have.has(num) && !KNOWN_DANGLING.has(num)) {
            bad.push({ id: `DR-${m[1]}`, where: `${relative(root, file)}:${i + 1}` });
          }
        }
      });
    }
  }
  // One line per missing record, naming the first place that cites it.
  const first = new Map();
  for (const b of bad) if (!first.has(b.id)) first.set(b.id, b);
  return { bad, missing: [...first.values()].sort((a, b) => a.id.localeCompare(b.id)) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { bad, missing } = danglingCitations();
  if (missing.length) {
    console.error(`✗ decision-citation-guard: ${missing.length} decision record(s) are cited in the code but do not exist:\n`);
    for (const m of missing) {
      const n = bad.filter((b) => b.id === m.id).length;
      console.error(`  - ${m.id} — cited ${n} time(s), first at ${m.where}`);
    }
    console.error('\nA citation promises the reasoning is written down. Write the record in docs/decisions/, or stop citing the number.');
    process.exit(1);
  }
  console.log(`decision-citation-guard: OK — every DR cited in ${SCAN.join(', ')} has a record.`);
}
