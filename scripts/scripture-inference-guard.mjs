#!/usr/bin/env node
// =============================================================================
// scripture-inference-guard — the gate for REASONING ACROSS verses, not merely
// quoting them (DR-0076 §2 gate-the-class; born 2026-08-07, DR-0281).
// =============================================================================
// THE MISS THIS ENDS. The verse-verbatim gates (godhead-study, world-issues)
// prove every quoted fragment matches the KJV exactly. They cannot see an error
// that lives BETWEEN two correct quotes. Issue 8 shipped a sentence saying
// Yahweh announced "four hundred years" (Genesis 15:13) and then "hit the date"
// at "four hundred and thirty years" (Exodus 12:41). Both quotes were verbatim.
// Both passed every gate. The reasoning ACROSS them was wrong — 400 is the
// affliction (Gen 15:13; Acts 7:6), 430 the sojourning (Exod 12:40; Gal 3:17) —
// and it shipped inside a lesson whose whole point is that a wrong number inside
// a true case gets the case dismissed. Darrell caught it by asking whether we had
// reviewed the historical accuracy of the WORD itself, not only the secular
// record. Quoting correctly and REASONING correctly are different disciplines,
// and only the first one had a machine check.
//
// WHAT THIS IS, STATED HONESTLY (DR-0076 — no overclaiming). This is NOT a
// universal inference checker; no such thing exists and pretending otherwise
// would be the theater DR-0076 §3 forbids. It is a REGISTRY-DRIVEN gate: the
// known places where Scripture carries a real numeric or factual tension that a
// careless reading collapses. Wherever a registered pair is cited as one claim,
// the prose MUST name what each side actually measures. The registry grows every
// time a new tension bites us — the same way every other gate in this repo grew.
//
// An earlier draft tried to auto-detect ANY numeric disagreement between
// co-cited verses. It produced 205 false positives on existing, correct lessons
// (incidental cardinals inside quoted verses — "one of these my brethren", "ten
// days" — and chapter:verse digits read as quantities). A noisy gate gets
// switched off, and a switched-off gate protects nothing. Registry-driven is the
// honest instrument.
//
// PROVEN-TO-CATCH: `--selftest-break` injects the exact defective sentence that
// shipped and asserts the guard fails on it, then asserts the corrected form
// passes. A gate that always passes is itself a lie.
//
// Usage:
//   node scripts/scripture-inference-guard.mjs                # scan + report
//   node scripts/scripture-inference-guard.mjs --selftest-break
// =============================================================================

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Authored content scanned by this guard. Add a file when it starts carrying
// Scripture-derived reasoning.
export const SCANNED = [
  'app/src/lib/world-issues-class.js',
  'app/src/lib/godhead-study.js',
  'app/src/lib/eternal-algorithms.js',
  'app/src/lib/living-lessons-class.js',
  'app/src/lib/seeing-study.js',
  'app/src/lib/economics-class.js',
  'app/src/lib/prophetic-voices.js',
  'app/src/lib/succession-class.js',
];

// ---------------------------------------------------------------------------
// THE REGISTRY — known cross-verse tensions we teach. Each entry names the two
// (or more) references, what a careless reading collapses, and the words the
// prose must carry so the reader is told the distinction instead of inheriting
// our blur. `mustName` is ALL-required, not any: naming one side and omitting
// the other is precisely how the original defect passed review.
// ---------------------------------------------------------------------------
export const REGISTRY = [
  {
    id: 'egypt-400-vs-430',
    collapse: 'Reading the 400 years of Genesis 15:13 and the 430 years of Exodus 12:40-41 as one figure, so the announcement appears to be "hit" by a number it never named.',
    distinction: 'Genesis 15:13 measures the AFFLICTION ("they shall afflict them four hundred years"; so Acts 7:6, "entreat them evil four hundred years"). Exodus 12:40-41 measures the SOJOURNING ("the sojourning of the children of Israel, who dwelt in Egypt, was four hundred and thirty years"), the same 430 Paul measures from the confirmed promise to the law (Galatians 3:17). Two clocks, two subjects, both kept exactly.',
    // SIDES, not a flat ref list. Citing two refs from the SAME side (e.g.
    // Exodus 12:40 with Galatians 3:17 — both the 430-year sojourning) asserts
    // no tension and needs no distinction. Only a CROSS-SIDE co-citation can
    // collapse the two clocks, so only that is gated.
    sides: [
      { name: 'affliction (400)', refs: ['Genesis 15:13', 'Acts 7:6'], mustName: 'affliction' },
      { name: 'sojourning (430)', refs: ['Exodus 12:40', 'Exodus 12:41', 'Galatians 3:17'], mustName: 'sojourning' },
    ],
  },
];

// Citations as our prose writes them: "(Genesis 15:13)", "Exodus 12:41", "1 Kings 21:19".
const CITE = /\b((?:[1-3]\s*)?[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(\d{1,3}):(\d{1,3})\b/g;

/** Normalize "1  Kings 21:19" → "1 Kings 21:19". */
const norm = (book, ch, v) => `${book.replace(/\s+/g, ' ').trim()} ${ch}:${v}`;

/**
 * Scan authored prose. A "window" is a sentence — co-citation inside one
 * sentence is what "asserted as a single claim" means.
 * @returns {{code,label,message,window}[]}
 */
export function scanProse(prose, label = 'prose') {
  const violations = [];
  const src = String(prose);
  // A `scripture:` field is a REFERENCE INDEX, not prose — it lists every verse
  // a lesson touches and asserts no relationship between them. Gating it would
  // punish complete citation, which is the opposite of the goal.
  const cleaned = src.replace(/scripture:\s*'[^']*'/g, (mm) => ' '.repeat(mm.length));

  const windows = [];
  { // sentence windows, with their offsets so context can be widened
    const re = /[^.!?]+[.!?]+/g; let mm;
    while ((mm = re.exec(cleaned))) windows.push({ text: mm[0], start: mm.index });
    if (!windows.length) windows.push({ text: cleaned, start: 0 });
  }

  const CONTEXT = 900; // a teaching may explain the distinction across a few sentences

  for (const w of windows) {
    CITE.lastIndex = 0;
    const cited = new Set();
    let m;
    while ((m = CITE.exec(w.text))) cited.add(norm(m[1], m[2], m[3]));
    if (cited.size < 2) continue;

    for (const entry of REGISTRY) {
      // Which SIDES of the tension appear in this one claim?
      const present = entry.sides.filter((s) => s.refs.some((r) => cited.has(r)));
      if (present.length < 2) continue; // same-side citation asserts no tension

      // Look for the distinction in the surrounding passage, not only this
      // sentence — a lesson is allowed to explain across a few sentences.
      const from = Math.max(0, w.start - CONTEXT);
      const ctx = cleaned.slice(from, w.start + w.text.length + CONTEXT).toLowerCase();
      const missing = present.map((s) => s.mustName).filter((k) => !ctx.includes(k.toLowerCase()));
      if (!missing.length) continue;

      const hits = entry.sides.flatMap((s) => s.refs.filter((r) => cited.has(r)));
      violations.push({
        code: `inference/${entry.id}`,
        label,
        message:
          `${hits.join(' + ')} are cited as one claim across both sides of a known tension, but the passage never names: ${missing.join(', ')}. `
          + `COLLAPSE RISK: ${entry.collapse} THE DISTINCTION: ${entry.distinction}`,
        window: w.text.replace(/\s+/g, ' ').trim().slice(0, 220),
      });
    }
  }
  return violations;
}

function scanFile(rel) {
  const f = join(ROOT, rel);
  if (!existsSync(f)) return [];
  return scanProse(readFileSync(f, 'utf8'), rel);
}

// ---------------------------------------------------------------------------
function selftest() {
  // The exact defect that shipped in Issue 8, reconstructed as ONE claim.
  const broken = 'He gave Abram the duration before the affliction started: "they shall afflict them four hundred years" (Genesis 15:13), and then He hit the date exactly: "at the end of the four hundred and thirty years, even the selfsame day" (Exodus 12:41).';
  const caught = scanProse(broken, 'selftest');
  if (!caught.length) {
    console.error('SELFTEST FAILED: the guard did NOT catch the 400/430 defect it exists to catch.');
    process.exit(1);
  }
  console.log(`selftest OK — caught the shipped defect [${caught[0].code}]:`);
  console.log(`  missing distinction → ${caught[0].message.split('COLLAPSE RISK')[0].trim()}`);

  // The corrected form — which names BOTH sides — must pass.
  const fixed = 'Genesis 15:13 measures the affliction at four hundred years, while Exodus 12:41 marks the end of the sojourning at four hundred and thirty years — two clocks, both kept.';
  const ok = scanProse(fixed, 'selftest-fixed');
  if (ok.length) {
    console.error('SELFTEST FAILED: the guard rejects the CORRECT, distinction-naming form:', ok[0].message);
    process.exit(1);
  }
  console.log('selftest OK — the corrected, distinction-naming form passes.');

  // Naming only ONE side must still fail (the exact hole in the first draft).
  const halfway = 'Genesis 15:13 names the affliction of four hundred years and Exodus 12:41 closes it at four hundred and thirty years.';
  const half = scanProse(halfway, 'selftest-halfway');
  if (!half.length) {
    console.error('SELFTEST FAILED: naming only one side passed; the gate must require BOTH.');
    process.exit(1);
  }
  console.log('selftest OK — naming only one side still fails, as it must.');
  process.exit(0);
}

function main() {
  if (process.argv.includes('--selftest-break')) return selftest();
  const all = SCANNED.flatMap(scanFile);
  if (all.length) {
    console.error(`scripture-inference-guard: ${all.length} violation(s)\n`);
    for (const v of all) {
      console.error(`  [${v.code}] ${v.label}`);
      console.error(`    ${v.message}`);
      console.error(`    …${v.window}…\n`);
    }
    process.exit(1);
  }
  console.log(`scripture-inference-guard: clean — ${SCANNED.length} files scanned, ${REGISTRY.length} registered tension(s) enforced.`);
}

if (process.argv[1] && process.argv[1].endsWith('scripture-inference-guard.mjs')) main();
