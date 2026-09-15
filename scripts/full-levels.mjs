// =============================================================================
// full-levels — is every age version the FULL message, or a fragment? MEASURED.
// =============================================================================
// Darrell 2026-08-25: "full message, age-simple", "THE SHORT LESSON IS THE ONLY
// PROBLEM"; 2026-09-15: "I want all levels to be full now... why wait?!!!!!!"
//
// resolveForAge's own comment says "each age version is authored at FULL
// COVERAGE (every point of the lesson, in that age's words)". Measured
// 2026-09-15 across 153 lessons, the child level carries a median 16% of the
// adult lesson's words, teen 26%, senior 41%; 149 of 153 child levels are under
// a third. The claim was false by measurement (DR-0076 §4). This module is the
// measure, and the gate that keeps the debt from growing while it is paid.
//
// THE PROXY, NAMED. Coverage of "every point" cannot be machine-read; the word
// share of the adult lesson can, and a version under half the length of the
// message it claims to carry is not carrying it. The floors are a decision
// (DR-0418), not a finding: child ≥ 0.5 (simpler words are shorter words),
// youth / teen / senior ≥ 0.6. A band above its floor may still be thin — the
// author's eye is still the judge — but a band below it is certainly short.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ourProseOnly } from './reading-level.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const FULL_LEVELS_BASELINE_PATH = join(HERE, '..', 'app', 'src', 'lib', 'full-levels-baseline.json');

export const FULL_BANDS = ['child', 'youth', 'teen', 'senior'];
export const FULL_FLOOR = { child: 0.5, youth: 0.6, teen: 0.6, senior: 0.6 };

export function words(s) {
  return typeof s === 'string' ? s.trim().split(/\s+/).filter(Boolean).length : 0;
}

// COUNT THE TEACHING, NOT THE QUOTATIONS (amended 2026-09-15, same day).
// Writing L146's owed anchors into its body (DR-0404) grew the adult lesson
// from 1,009 to 1,724 words without a word of new teaching — every added word
// was verbatim Scripture — and the senior band, unchanged and full, fell from
// 0.83 to 0.48 of it: the gate would have called a band "shortened" that
// nobody touched. A quoted verse is the Word, carried in every version by the
// anchor work and verified by its own gates; what THIS measure asks is whether
// the message is taught in that age's own words. So both sides of the share
// are authored prose with double-quoted spans removed — the same register the
// reading-level gate scores, for the same reason (DR-0332: a proxy measures
// what it claims to).
export function proseWords(s) {
  return words(ourProseOnly(typeof s === 'string' ? s : ''));
}

/** Per-band word counts and shares for one module. */
export function measureFullness(module) {
  const m = module || {};
  const adult = proseWords(m.lesson) || proseWords(m.levels && m.levels.standard);
  const bands = {};
  for (const b of FULL_BANDS) {
    const n = proseWords(m.levels && m.levels[b]);
    bands[b] = { words: n, share: adult ? +(n / adult).toFixed(2) : null, present: n > 0 };
  }
  return { id: m.id, adultWords: adult, bands };
}

/** Which bands of a measured lesson are short (below floor) or missing. */
export function shortBands(measured, floor = FULL_FLOOR) {
  return FULL_BANDS.filter((b) => {
    const x = measured.bands[b];
    return !x.present || (measured.adultWords > 0 && x.share < floor[b]);
  });
}

export function scanFullness(modules, { floor = FULL_FLOOR } = {}) {
  const measured = (modules || []).map(measureFullness);
  const short = {};
  for (const m of measured) { const s = shortBands(m, floor); if (s.length) short[m.id] = s; }
  return { total: measured.length, measured, short };
}

export function loadFullLevelsBaseline() {
  try { return JSON.parse(readFileSync(FULL_LEVELS_BASELINE_PATH, 'utf8')); } catch { return { floor: FULL_FLOOR, short: {} }; }
}

/**
 * fresh — a lesson (or a band of a lesson) short today that the baseline does
 *         not record: FAILS. A NEW lesson ships full, and a full band may not
 *         be shortened again.
 * healed — recorded debt that is now full: the baseline must shrink.
 */
export function ratchetFullness(scan, baseline = loadFullLevelsBaseline()) {
  const was = baseline.short || {};
  const fresh = [];
  const healed = [];
  for (const [id, bands] of Object.entries(scan.short)) {
    for (const b of bands) if (!(was[id] || []).includes(b)) fresh.push(`${id} :: ${b}`);
  }
  for (const [id, bands] of Object.entries(was)) {
    for (const b of bands) if (!(scan.short[id] || []).includes(b)) healed.push(`${id} :: ${b}`);
  }
  return { fresh, healed };
}

export function buildFullLevelsBaseline(scan, { floor = FULL_FLOOR } = {}) {
  const short = {};
  for (const id of Object.keys(scan.short).sort()) short[id] = [...scan.short[id]];
  return {
    floor,
    note: 'Shrink-only debt (DR-0418). Each entry names the bands of a lesson that are missing or below the floor share of the adult lesson. A NEW short band fails the build; entries are removed as full levels are authored, never added.',
    measuredLessons: scan.total,
    lessonsShort: Object.keys(short).length,
    short,
  };
}
