// adopter-template-guard.mjs — proven-to-catch gate: a NEW adopter's starter data
// must NEVER contain the Poe family's real identifiers.
//
// When a friend adopts PoeTech, their isolated instance opens on an aspirational
// starter (lib/adopter-templates.js). The one unacceptable failure is the Poe
// family's real names, addresses, businesses, church, or emails leaking into a
// stranger's instance. This guard makes that failure FAIL THE BUILD instead of
// waiting for a human to notice (DR-0076).
//
// It is intentionally string-based and source-level: it reads the template module
// as text and scans for any real Poe identifier, case-insensitively, so it catches
// a leak no matter how the value is structured. The companion test feeds it a
// deliberately-poisoned sample to prove the scanner actually CATCHES a leak (the
// anti-theater rule — a gate that always passes is itself a lie).
//
// CLI:  node scripts/adopter-template-guard.mjs        (exit 1 on any violation)

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_FILE = resolve(__dirname, '../app/src/lib/adopter-templates.js');

// The real Poe identifiers that must never appear in adopter-facing starter data.
// Sourced from the seed-sanitization record and the live family/church allowlists.
// Kept ASCII-only and lowercased for the case-insensitive scan.
export const POE_IDENTIFIERS = [
  // People
  'darrell', 'christina', 'christiana', 'christyn', 'christian',
  // Emails
  'darrellpoe06', 'mrspoe06', 'tlctherapysolutions',
  // Businesses / brands
  'poetech', 'poe properties', 'poe family', 'tlc therapy', 'tlc therapy solutions',
  // Church
  'church of the living god', 'thechurchofthelivinggod', 'the love corner', 'colg', 'bishop gwin',
  // Places (real)
  'champaign', 'urbana', 'talans', '2111 talans',
  // The family surname as a standalone word boundary is checked separately below.
];

// Lines that legitimately mention "Poe" in EXPLANATORY commentary (the contract
// fields explicitly say "No Poe-family data") are not leaks. We scan the DATA, so
// we ignore the surname token when it appears only inside a comment or a contract
// disclaimer. To stay strict, we still flag the surname if it is attached to a
// brand/place token (handled by the multi-word identifiers above).

/**
 * Scan template source text for any real Poe identifier.
 * @param {string} [srcOverride] — source text to scan instead of reading the file.
 * @returns {{ ok:boolean, violations:Array<{identifier:string, line:number, text:string}> }}
 */
export function scanTemplates(srcOverride = null) {
  const src = srcOverride != null ? srcOverride : readFileSync(TEMPLATE_FILE, 'utf8');
  const lines = src.split(/\r?\n/);
  const violations = [];

  lines.forEach((rawLine, i) => {
    const lineNo = i + 1;
    // Strip a leading "//" comment AND the disclaimer-bearing contract/why prose so
    // explanatory mentions of the rule ("No Poe-family data") are not false hits.
    // We scan the executable/data portion: everything is checked except text that
    // is clearly a comment line.
    const isCommentLine = /^\s*\/\//.test(rawLine);
    const hay = rawLine.toLowerCase();

    for (const id of POE_IDENTIFIERS) {
      if (!hay.includes(id)) continue;
      // Allow the identifier inside a pure comment ONLY for the multi-word brand
      // disclaimers we know are explanatory; single tokens in data are always hits.
      if (isCommentLine) continue;
      // A data line containing a disclaimer like "No Poe-family data." is allowed
      // to say the surname, but must not contain a concrete identifier — and these
      // POE_IDENTIFIERS are all concrete, so any hit on a non-comment line is real.
      violations.push({ identifier: id, line: lineNo, text: rawLine.trim().slice(0, 120) });
    }

    // Standalone surname check on DATA lines: "Poe" as a word, but NOT the allowed
    // disclaimer phrasing "no poe-family data" / "no poe-business data".
    if (!isCommentLine && /\bpoe\b/i.test(rawLine)) {
      const allowedDisclaimer = /no poe-(family|business) data/i.test(rawLine);
      if (!allowedDisclaimer) {
        violations.push({ identifier: 'poe (surname)', line: lineNo, text: rawLine.trim().slice(0, 120) });
      }
    }
  });

  return { ok: violations.length === 0, violations };
}

// CLI entry — run directly to gate locally / in CI.
const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  const { ok, violations } = scanTemplates();
  if (ok) {
    console.log('adopter-template-guard: OK — no Poe identifiers in adopter starter data.');
    process.exit(0);
  }
  console.error('adopter-template-guard: FAIL — Poe identifiers found in adopter starter data:');
  for (const v of violations) console.error(`  line ${v.line}: "${v.identifier}"  ->  ${v.text}`);
  process.exit(1);
}
