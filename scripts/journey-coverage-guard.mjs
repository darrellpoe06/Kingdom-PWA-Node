#!/usr/bin/env node
// =============================================================================
// journey-coverage-guard — every surface family and every module has a journey
// =============================================================================
// DR-1330 D2. The journey registry (scripts/e2e/journeys.mjs) is only a Way
// if something fails when it is not kept. This reads the real registry of
// surfaces (app/src/surfaces.js — the nav families) and the real module
// directories (app/src/modules/*) and fails the build when:
//   1. a nav family has no journey at all;
//   2. a module directory has no journey at all;
//   3. a journey is deferred without a why or a re-review date, or its
//      re-review date has passed (DR-0075: the date is the promise);
//   4. a journey names a runner that does not exist, or an app-journeys id
//      that scripts/e2e/app-journeys.mjs does not define.
// Pure functions exported for vitest (proven-to-catch: a registry missing a
// family, and a deferral past its date, each REQUIRE a finding).
// =============================================================================
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The nav families the surface registry declares (parsed, never copied). */
export function familiesIn(surfacesSource) {
  return [...new Set([...surfacesSource.matchAll(/nav:\s*'([a-z]+)'/g)].map((m) => m[1]))];
}

/** The module directories under app/src/modules (each must have an index). */
export function modulesIn(modulesDir) {
  if (!existsSync(modulesDir)) return [];
  return readdirSync(modulesDir)
    .filter((d) => statSync(join(modulesDir, d)).isDirectory())
    .sort();
}

/**
 * @param {object} p { journeys, families, modules, runners, appJourneyIds, today }
 * @returns {string[]} findings (empty = covered)
 */
export function check({ journeys, families, modules, runners, appJourneyIds, today }) {
  const out = [];
  const active = (j) => j.status === 'active';
  for (const f of families) {
    if (!journeys.some((j) => j.family === f)) out.push(`family '${f}' has no journey in scripts/e2e/journeys.mjs`);
  }
  for (const m of modules) {
    if (!journeys.some((j) => j.module === m)) out.push(`module app/src/modules/${m} has no journey in scripts/e2e/journeys.mjs`);
  }
  for (const j of journeys) {
    if (!runners.includes(j.runner)) out.push(`journey '${j.id}' names unknown runner '${j.runner}'`);
    if (j.runner === 'app-journeys' && active(j) && !appJourneyIds.includes(j.id))
      out.push(`journey '${j.id}' is registered as app-journeys but scripts/e2e/app-journeys.mjs does not define it`);
    if (j.status === 'deferred') {
      if (!j.why || !j.reReview) out.push(`journey '${j.id}' is deferred without a why and a reReview date`);
      else if (j.reReview <= today) out.push(`journey '${j.id}' passed its re-review date ${j.reReview}: build it or re-date it with a new why`);
    } else if (!active(j)) out.push(`journey '${j.id}' has status '${j.status}' (active | deferred)`);
  }
  return out;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const { JOURNEYS, FAMILIES, RUNNERS } = await import('./e2e/journeys.mjs');
  const { JOURNEY_IDS } = await import('./e2e/app-journeys.mjs');
  const surfaces = readFileSync(join(ROOT, 'app/src/surfaces.js'), 'utf8');
  const families = familiesIn(surfaces);
  for (const f of families)
    if (!FAMILIES.includes(f)) console.error(`journey-coverage-guard: surfaces.js declares nav '${f}' that journeys.mjs FAMILIES does not list`);
  const findings = check({
    journeys: JOURNEYS,
    families,
    modules: modulesIn(join(ROOT, 'app/src/modules')),
    runners: RUNNERS,
    appJourneyIds: JOURNEY_IDS,
    today: new Date().toISOString().slice(0, 10),
  });
  if (findings.length || families.some((f) => !FAMILIES.includes(f))) {
    console.error(`journey-coverage-guard: ${findings.length} finding(s):\n  ${findings.join('\n  ')}`);
    process.exit(1);
  }
  const active = JOURNEYS.filter((j) => j.status === 'active').length;
  console.log(
    `journey-coverage-guard: OK — ${families.length} families and ${modulesIn(join(ROOT, 'app/src/modules')).length} modules covered by ${active} active journeys (${JOURNEYS.length - active} deferred, dated).`
  );
}
