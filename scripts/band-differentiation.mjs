// =============================================================================
// band-differentiation — are the four age versions DIFFERENT, or one repeated?
// =============================================================================
// Darrell 2026-09-18: "Last lessons don't have diversity of lessons for all
// reading levels... why not? Fill up the lessons and don't stop."
//
// He was right, and nothing in the house could have told him so. The
// full-levels gate measures each band's word-count SHARE against the adult
// lesson. The reading-level gate measures FK grade and monotonicity. NEITHER
// EVER COMPARES THE BANDS TO EACH OTHER. So ll173 passes every check in the
// house — shares 0.97 / 1.00 / 1.08 / 1.26, ladder 3.2 / 7.1 / 7.2, monotone —
// while its youth and teen bands are THE SAME TEXT. One band wearing four
// labels. A check that never looks passes for ever (DR-0481, DR-0483).
//
// THE PROXY, NAMED. "Is this written for a different reader?" cannot be
// machine-read. Whether the two bands are the same sentences can. Overlap is
// the share of 8-word phrases the smaller band shares with the larger: long
// enough that ordinary English collocations do not register, short enough that
// a reworded sentence still does.
//
// MEASURED ON AUTHORED PROSE, QUOTATIONS REMOVED, and that choice is the
// difference between a measure and a nuisance. Every band quotes the SAME
// verses — it is the same lesson — so counting quoted Scripture would punish a
// well-differentiated lesson for carrying the Word in all four versions. On
// raw text ll174 reads 0.42 and ll175 0.31; on authored prose they read 0.20
// and 0.17, while ll173 and ll172 stay at 0.99 because their defect was never
// the quotations. Same register the other two measures score, for the same
// reason (DR-0332: a proxy measures what it claims to).
//
// THE CEILING IS A DECISION, NOT A FINDING. Measured across the 94 lessons
// carrying all four bands, the median worst pair is 0.15 and the best run 0.03
// to 0.07; the offenders run 0.75 to 0.99. 0.50 is set as the line for a NEW
// lesson — more than three times the median, so it condemns nothing that is
// merely economical, and it is nowhere near the 0.75+ cluster that is the real
// debt. A lesson under the ceiling may still be thin; the author's eye is
// still the judge. A lesson over it is certainly repeating itself.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ourProseOnly } from './reading-level.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const BAND_DIFF_BASELINE_PATH = join(HERE, '..', 'app', 'src', 'lib', 'band-differentiation-baseline.json');

export const DIFF_BANDS = ['child', 'youth', 'teen', 'senior'];
// Adjacent rungs plus the two ends: adjacent pairs are where re-registering the
// same prose shows up, and child~senior is the sanity check that the ladder
// spans a real distance rather than drifting one step at a time.
export const BAND_PAIRS = [['child', 'youth'], ['youth', 'teen'], ['teen', 'senior'], ['child', 'senior']];
export const SHINGLE = 8;
export const DIFF_CEILING = 0.5;

export function shingles(text, n = SHINGLE) {
  const w = String(text || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const out = new Set();
  for (let i = 0; i + n <= w.length; i += 1) out.add(w.slice(i, i + n).join(' '));
  return out;
}

// Over the SMALLER set, not the union. A short child band that is wholly
// contained in the senior band is fully duplicated whatever the lengths are,
// and a union denominator would score that as half-different and let it pass.
export function overlap(a, b) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const x of a) if (b.has(x)) shared += 1;
  return shared / Math.min(a.size, b.size);
}

export function measureDifferentiation(module) {
  const levels = module && module.levels;
  if (!levels || DIFF_BANDS.some((b) => !levels[b])) return null;
  const sets = Object.fromEntries(DIFF_BANDS.map((b) => [b, shingles(ourProseOnly(levels[b]))]));
  const pairs = {};
  let worst = 0;
  for (const [x, y] of BAND_PAIRS) {
    const v = Number(overlap(sets[x], sets[y]).toFixed(2));
    pairs[`${x}~${y}`] = v;
    if (v > worst) worst = v;
  }
  return { id: module.id, pairs, worst };
}

export function duplicatedBands(measured, ceiling = DIFF_CEILING) {
  if (!measured) return [];
  return Object.entries(measured.pairs).filter(([, v]) => v >= ceiling).map(([k]) => k);
}

export function scanDifferentiation(modules, { ceiling = DIFF_CEILING } = {}) {
  const rows = [];
  for (const m of modules) {
    const measured = measureDifferentiation(m);
    if (!measured) continue;
    rows.push({ ...measured, over: duplicatedBands(measured, ceiling) });
  }
  return { measuredLessons: rows.length, rows };
}

export function loadBandDiffBaseline(path = BAND_DIFF_BASELINE_PATH) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// Shrink-only, like its four siblings. A lesson already over the ceiling is
// recorded; a lesson that goes over having not been is FRESH and fails the
// build. Entries leave as bands are re-authored and never arrive.
export function ratchetDifferentiation(scan, baseline = loadBandDiffBaseline()) {
  const known = baseline.duplicated || {};
  const fresh = [];
  const healed = [];
  for (const r of scan.rows) {
    if (r.over.length && !(r.id in known)) fresh.push(r.id);
    if (!r.over.length && r.id in known) healed.push(r.id);
  }
  return { fresh, healed };
}

export function buildBandDiffBaseline(scan, { ceiling = DIFF_CEILING } = {}) {
  const duplicated = {};
  for (const r of scan.rows) if (r.over.length) duplicated[r.id] = { worst: r.worst, pairs: r.pairs };
  const worstFirst = Object.entries(duplicated).sort((a, b) => b[1].worst - a[1].worst);
  return {
    ceiling,
    shingle: SHINGLE,
    note: 'Shrink-only debt (Darrell 2026-09-18: "Last lessons don\'t have diversity of lessons for all reading levels... why not?"). Overlap is the share of 8-word phrases the smaller band shares with the larger, measured on AUTHORED PROSE with quotations removed — every band quotes the same verses, so counting them would punish a well-differentiated lesson. A lesson newly over the ceiling FAILS the build; entries are removed as bands are genuinely re-authored, never added. Differentiation is not abbreviation: the full-levels floor and the reading ladder stay in force at the same time (DR-0418).',
    measuredLessons: scan.measuredLessons,
    lessonsDuplicated: Object.keys(duplicated).length,
    duplicated: Object.fromEntries(worstFirst),
  };
}
