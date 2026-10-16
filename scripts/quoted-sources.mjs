// =============================================================================
// quoted-sources — WHERE the Scripture instruments are allowed to look
// =============================================================================
// THE DEFECT THIS FILE EXISTS TO CLOSE, measured 2026-10-15. Two instruments in
// this repository check that a quotation is the verse it names, and both were
// pointed at a hand-written list of files:
//
//   scripts/scripture-provenance-audit.mjs  SCANNED = 2 files
//   scripts/quoted-verse-is-the-verse.test  series  = 2 catalogs
//
// There are 42 course catalogs. Pointed at all of them, the existing scanner
// reported 403 faults in 13 catalogs that nothing had ever read -- including ten
// quotations in the Sovereign A.I. course whose only difference from the verse
// was a straight apostrophe where the corpus carries U+2019, on surfaces a
// student reads (the lesson body, the big idea, the teen and senior bands, and a
// talking point the facilitator reads aloud).
//
// The lesson is not that a new check was needed. The checks existed and were
// looking at two files. So the list stops being hand-written here:
//
//   - QUOTED_SOURCES is DERIVED by walking the tree, so a new file is covered
//     the day it lands, with nobody remembering to add it.
//   - CATALOGS is explicit, because a module gate must import a named export --
//     but `everyCatalogExport()` reads the exports back off disk, and the test
//     that compares the two is what makes a new catalog impossible to leave
//     unguarded. That test, not this list, is the real close.
// =============================================================================
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIB = join(ROOT, 'app/src/lib');
const COMPONENTS = join(ROOT, 'app/src/components');

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (e !== '__tests__' && e !== 'node_modules') walk(p, out);
    } else if (/\.(js|jsx)$/.test(e)) {
      out.push(relative(ROOT, p));
    }
  }
  return out;
}

/**
 * Every source file that could carry a quoted verse, derived rather than listed.
 * The source-text instruments (fix-quote-case, fix-quote-apostrophe) read this,
 * so they reach a comment as well as a string -- a header that quotes Scripture
 * is still quoting Scripture.
 */
export const QUOTED_SOURCES = Object.freeze([...walk(LIB), ...walk(COMPONENTS)].sort());

/**
 * The course catalogs, as [file, exported name]. Explicit because the gate
 * imports the export; kept honest by everyCatalogExport() below.
 */
export const CATALOGS = Object.freeze([
  ['ai-legal-blueprint-class.js', 'AI_LEGAL_BLUEPRINT_MODULES'],
  ['appraisal-course.js', 'APPRAISAL_MODULES'],
  ['banking-course.js', 'BANKING_MODULES'],
  ['bonds-course.js', 'BONDS_MODULES'],
  ['broadcast-class.js', 'BROADCAST_MODULES'],
  ['business-research-course.js', 'BUSINESS_RESEARCH_MODULES'],
  ['buying-terms-course.js', 'BUYING_TERMS_MODULES'],
  ['car-research-course.js', 'CAR_RESEARCH_MODULES'],
  ['church-classes.js', 'MODULES'],
  ['church-offices-course.js', 'CHURCH_OFFICES_MODULES'],
  ['datasystems-course.js', 'DATASYSTEMS_MODULES'],
  ['development-class.js', 'DEVELOPMENT_MODULES'],
  ['economics-class.js', 'ECON_MODULES'],
  ['evictions-course.js', 'EVICTIONS_MODULES'],
  ['financing-debt-course.js', 'FINANCING_DEBT_MODULES'],
  ['historical-research-course.js', 'HISTORICAL_RESEARCH_MODULES'],
  ['history-course.js', 'HISTORY_MODULES'],
  ['infrastructure-class.js', 'INFRA_MODULES'],
  ['inspections-course.js', 'INSPECTIONS_MODULES'],
  ['insurance-risk-course.js', 'INSURANCE_RISK_MODULES'],
  ['investing-course.js', 'INVESTING_MODULES'],
  ['leasing-tenants-course.js', 'LEASING_TENANTS_MODULES'],
  ['legacy-provisions-course.js', 'LEGACY_PROVISIONS_MODULES'],
  ['little-learners-class.js', 'LITTLE_LEARNERS_MODULES'],
  ['living-lessons-class.js', 'LIVING_LESSONS_MODULES'],
  ['made-in-time-course.js', 'MADE_IN_TIME_MODULES'],
  ['maintenance-trades-course.js', 'MAINTENANCE_TRADES_MODULES'],
  ['management-stewardship-course.js', 'MANAGEMENT_STEWARDSHIP_MODULES'],
  ['mathematics-class.js', 'MATHEMATICS_MODULES'],
  ['partnerships-course.js', 'PARTNERSHIPS_MODULES'],
  ['project-management-course.js', 'PROJECT_MANAGEMENT_MODULES'],
  ['property-principle-course.js', 'PROPERTY_PRINCIPLE_MODULES'],
  ['prophetic-voices.js', 'PV_MODULES'],
  ['rent-to-own-business-class.js', 'RTO_BUSINESS_MODULES'],
  ['software-project-management-course.js', 'SOFTWARE_PM_MODULES'],
  ['sound-board-class.js', 'SOUND_BOARD_MODULES'],
  ['sovereign-ai-class.js', 'SOVEREIGN_AI_MODULES'],
  ['stocks-course.js', 'STOCKS_MODULES'],
  ['succession-class.js', 'SUCCESSION_MODULES'],
  ['taxes-records-course.js', 'TAXES_RECORDS_MODULES'],
  ['who-he-is-course.js', 'WHO_HE_IS_MODULES'],
  ['word-out-course.js', 'WORD_OUT_MODULES'],
  ['world-market-course.js', 'WORLD_MARKET_MODULES'],
]);

/**
 * Every `export const <NAME>MODULES` in app/src/lib, read off disk as
 * `file.js:NAME`. This is the half CATALOGS is checked against: a new course
 * shows up here the moment its file is written, so the test fails until the
 * catalog is added to the gate. Read with a regex on purpose -- importing every
 * catalog to discover the catalogs is a circle, and the export line is a stable
 * one-line shape in all 42 files.
 *
 * The name is matched as "anything ending in MODULES", not "SOMETHING_MODULES":
 * church-classes.js exports it as a bare `MODULES`, and a pattern that demands a
 * prefix drops exactly one catalog -- silently, which is the failure this whole
 * file is about.
 */
export function everyCatalogExport() {
  const found = [];
  for (const f of readdirSync(LIB)) {
    if (!f.endsWith('.js')) continue;
    const src = readFileSync(join(LIB, f), 'utf8');
    for (const m of src.matchAll(/^export const ([A-Z][A-Z_]*)\s*=/gm)) {
      if (/MODULES$/.test(m[1])) found.push(`${f}:${m[1]}`);
    }
  }
  return found.sort();
}
