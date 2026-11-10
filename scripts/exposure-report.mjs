#!/usr/bin/env node
// =============================================================================
// exposure-report — prioritize what an attacker would actually use, and say the
// conditions BEFORE anything is changed (DR-1408)
// =============================================================================
// Darrell 2026-11-10, forwarding Gartner's "Prioritize What Attackers Will
// Exploit: 4 Elements of Strong Exposure Prioritization" (via a sponsor's email):
// "workflows that make sure we are secure as we can without undermining our
// processes and conditions report before and location should be inside the
// PoeTech App space". The research's four elements, applied to what we ship:
//
//   1. THREAT INTELLIGENCE   — is it being used against people right now? CISA's
//      Known Exploited Vulnerabilities catalog (KEV), and FIRST's EPSS score
//      (the probability of exploitation in the next 30 days).
//   2. ASSET CONTEXT         — does it reach a person? `prod` = in the shipped
//      bundle (npm audit --omit=dev); `dev` = a build or test tool that never
//      runs on a device. Direct or transitive.
//   3. EXPLOITABILITY        — can it be reached from the network (CVSS AV:N)
//      without privileges or a user's help?
//   4. CONTROL VALIDATION    — what already holds it: a dated decision in
//      scripts/dependency-audit-allowlist.json that the CI guard enforces, or
//      nothing.
//
// SEVERITY ALONE DOES NOT RANK (the research's point): a "critical" in a test
// tool that never runs on a device sorts below a "moderate" that ships and is
// on the KEV list. UNKNOWN NEVER RANKS LOW (DR-0076): a shipped finding whose
// threat intelligence could not be read is held at "plan", never "watch".
//
// READ-ONLY BY CONSTRUCTION. It runs `npm audit`, reads public feeds, and
// writes a report. It never runs `npm audit fix`, opens a PR, edits a lockfile
// or touches anything running. The report comes first; mobilizing a fix is a
// separate, human-governed step through the normal lane.
//
//   node scripts/exposure-report.mjs              offline: audit + context only
//   node scripts/exposure-report.mjs --fetch      also read KEV and EPSS (runner)
//   node scripts/exposure-report.mjs --selftest   pure checks
// =============================================================================
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const KEV_URLS = [
  'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
  'https://raw.githubusercontent.com/cisagov/kev-data/main/known_exploited_vulnerabilities.json',
];
export const EPSS_URL = 'https://api.first.org/data/v1/epss?cve=';
export const EPSS_LIKELY = 0.1; // 10% chance of exploitation within 30 days
export const TIERS = ['act-now', 'plan', 'watch'];

/** Advisories behind each vulnerable package in one npm audit JSON report. */
export function advisoriesOf(report) {
  const v = (report && report.vulnerabilities) || {};
  return Object.entries(v).map(([name, x]) => {
    const via = (x.via || []).filter((a) => a && typeof a === 'object');
    return {
      name,
      severity: x.severity,
      direct: !!x.isDirect,
      fixAvailable: x.fixAvailable !== false,
      advisories: via.map((a) => ({
        ghsa:
          String(a.url || '')
            .split('/')
            .pop() || null,
        title: a.title || '',
        severity: a.severity || x.severity,
        vector: (a.cvss && a.cvss.vectorString) || null,
      })),
    };
  });
}

/** CVSS vector -> reachable from the network with no privileges and no user. */
export function networkReachable(vector) {
  if (!vector) return null;
  const v = String(vector);
  return /AV:N/.test(v) && /PR:N/.test(v) && /UI:N/.test(v);
}

/**
 * Rank one package. `intel` = { kev: Set|null, epss: Map|null, cveOf: Map|null };
 * null means that source could not be read (unknown, never "no").
 */
export function rank(pkg, { scope, allowlist = [], intel = {}, today }) {
  const cves = intel.cveOf ? pkg.advisories.map((a) => intel.cveOf.get(a.ghsa)).filter(Boolean) : [];
  // A package listed only because a dependency it uses is vulnerable has no
  // advisory of its own: its risk is ranked on that dependency's own row.
  const inherited = pkg.advisories.length === 0;
  // An advisory with no CVE cannot be looked up in KEV or EPSS: unknown, never 0.
  const noCve = !inherited && !!intel.cveOf && pkg.advisories.some((a) => !intel.cveOf.get(a.ghsa));
  const kevKnown = intel.kev instanceof Set && !!intel.cveOf && !noCve;
  const onKev = inherited ? false : kevKnown ? cves.some((c) => intel.kev.has(c)) : null;
  const epssKnown = intel.epss instanceof Map && !!intel.cveOf && !noCve;
  const epss = inherited ? 0 : epssKnown ? Math.max(0, ...cves.map((c) => intel.epss.get(c) || 0)) : null;
  const reach = pkg.advisories.map((a) => networkReachable(a.vector));
  const reachable = reach.some((r) => r === true) ? true : reach.every((r) => r === false) && reach.length ? false : null;
  const entry = allowlist.find((e) => e.name === pkg.name);
  const held = !!(entry && entry.why && entry.reReview && entry.reReview > today);

  const threat =
    onKev === true
      ? 'on the KEV list: exploited in the wild'
      : epss != null && epss >= EPSS_LIKELY
        ? `EPSS ${(epss * 100).toFixed(1)}%: likely to be exploited`
        : inherited
          ? 'no advisory of its own: listed because a dependency it uses is vulnerable, ranked on that row'
          : noCve
            ? 'unknown: an advisory has no CVE, so the threat feeds cannot speak to it'
            : onKev === null || epss === null
              ? 'unknown: the threat feeds could not be read'
              : `not on KEV; EPSS ${((epss || 0) * 100).toFixed(1)}%`;
  const asset = `${scope === 'prod' ? 'ships to people' : 'build or test tool only'}, ${pkg.direct ? 'direct' : 'transitive'}`;
  const exploit =
    reachable === true
      ? 'reachable over the network, no privileges, no user action'
      : reachable === false
        ? 'needs local access, privileges or a user action'
        : 'no attack vector published';
  const control = held
    ? `held by a dated decision until ${entry.reReview}: ${entry.why}`
    : entry
      ? `a decision exists but has lapsed (${entry.reReview || 'no date'})`
      : 'nothing holds it yet';

  const exploited = onKev === true || (epss != null && epss >= EPSS_LIKELY);
  const intelUnknown = onKev === null || epss === null;
  let tier = 'watch';
  if (scope === 'prod' && exploited) tier = 'act-now';
  else if (scope === 'prod' && (['high', 'critical'].includes(pkg.severity) || intelUnknown || reachable === true)) tier = 'plan';
  else if (scope === 'dev' && (exploited || intelUnknown)) tier = 'plan';

  return { name: pkg.name, scope, severity: pkg.severity, tier, cves, fixAvailable: pkg.fixAvailable, held, elements: { threat, asset, exploit, control } };
}

/** The whole report: every package ranked, sorted by tier then severity. */
export function buildReport({ prod, all, allowlist, intel, today, readAt, sources }) {
  const prodNames = new Set(advisoriesOf(prod).map((p) => p.name));
  const SEV = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 };
  const items = advisoriesOf(all)
    .map((p) => rank(p, { scope: prodNames.has(p.name) ? 'prod' : 'dev', allowlist, intel, today }))
    .sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier) || (SEV[a.severity] ?? 9) - (SEV[b.severity] ?? 9) || a.name.localeCompare(b.name));
  const counts = Object.fromEntries(TIERS.map((t) => [t, items.filter((i) => i.tier === t).length]));
  return { kind: 'exposure-report', readAt, sources, counts, items };
}

async function getJson(url, headers = {}) {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'poetech-exposure-report', Accept: 'application/json', ...headers },
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error(`${url} answered ${r.status}`);
  return r.json();
}

/** Read KEV, the CVE behind each advisory, and EPSS. Each failure is said, never guessed. */
export async function readIntel(ghsas, { token } = {}) {
  const sources = {};
  let kev = null;
  for (const u of KEV_URLS) {
    try {
      const d = await getJson(u);
      kev = new Set((d.vulnerabilities || []).map((x) => x.cveID));
      sources.kev = `read ${kev.size} entries from ${new URL(u).host}`;
      break;
    } catch (e) {
      sources.kev = `unknown: ${String(e.message).slice(0, 120)}`;
    }
  }
  let cveOf = new Map();
  const epss = new Map();
  let cveFails = 0;
  for (const g of ghsas) {
    try {
      const a = await getJson(`https://api.github.com/advisories/${g}`, token ? { Authorization: `Bearer ${token}` } : {});
      if (a.cve_id) cveOf.set(g, a.cve_id);
      const e = Array.isArray(a.epss) ? a.epss[0] : a.epss;
      if (a.cve_id && e && e.percentage != null) epss.set(a.cve_id, Number(e.percentage));
    } catch {
      cveFails += 1;
    }
  }
  sources.advisories = `${cveOf.size} of ${ghsas.length} advisories carry a CVE${cveFails ? `; ${cveFails} could not be read` : ''}`;
  if (cveFails === ghsas.length && ghsas.length) cveOf = null;
  const missing = cveOf ? [...cveOf.values()].filter((c) => !epss.has(c)) : [];
  let epssOk = !!cveOf;
  if (missing.length) {
    try {
      const d = await getJson(EPSS_URL + missing.join(','));
      for (const row of d.data || []) epss.set(row.cve, Number(row.epss));
    } catch (e) {
      epssOk = false;
      sources.epss = `unknown: ${String(e.message).slice(0, 120)}`;
    }
  }
  if (epssOk) sources.epss = `scored ${epss.size} CVE(s)`;
  return { intel: { kev, cveOf, epss: epssOk ? epss : null }, sources };
}

function audit(args) {
  try {
    return JSON.parse(execFileSync('npm', ['audit', '--json', ...args], { cwd: join(ROOT, 'app'), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  } catch (e) {
    // npm audit exits non-zero when it finds anything; its JSON is still on stdout.
    if (e.stdout) return JSON.parse(e.stdout);
    throw e;
  }
}

function selftest() {
  const today = '2026-11-10';
  const pkg = (name, severity, vector, ghsa) => ({ name, severity, direct: true, fixAvailable: true, advisories: [{ ghsa, vector, severity }] });
  const intel = {
    kev: new Set(['CVE-1']),
    cveOf: new Map([
      ['G1', 'CVE-1'],
      ['G2', 'CVE-2'],
    ]),
    epss: new Map([
      ['CVE-1', 0.9],
      ['CVE-2', 0.001],
    ]),
  };
  const shippedExploited = rank(pkg('a', 'moderate', 'AV:N/PR:N/UI:N', 'G1'), { scope: 'prod', intel, today });
  const devCritical = rank(pkg('b', 'critical', 'AV:N/PR:N/UI:N', 'G2'), { scope: 'dev', intel, today });
  const shippedUnknown = rank(pkg('c', 'moderate', null, 'G9'), { scope: 'prod', intel: { kev: null, cveOf: null, epss: null }, today });
  const checks = [
    ['a shipped moderate on KEV is act-now', shippedExploited.tier === 'act-now'],
    ['a critical in a test tool with no exploitation is only watch', devCritical.tier === 'watch'],
    ['severity alone does not rank: the moderate outranks the critical', TIERS.indexOf(shippedExploited.tier) < TIERS.indexOf(devCritical.tier)],
    ['unknown threat intel never ranks a shipped finding as watch', shippedUnknown.tier === 'plan' && /unknown/.test(shippedUnknown.elements.threat)],
    [
      'unknown threat intel never ranks a build tool as watch either',
      rank(pkg('d', 'moderate', null, 'G9'), { scope: 'dev', intel: { kev: null, cveOf: null, epss: null }, today }).tier === 'plan',
    ],
    ['an advisory with no CVE is unknown, never scored as zero', rank(pkg('e', 'moderate', null, 'G-NOCVE'), { scope: 'dev', intel, today }).tier === 'plan'],
    [
      'a package with no advisory of its own says so instead of printing a score',
      /no advisory of its own/.test(
        rank({ name: 'f', severity: 'moderate', direct: true, fixAvailable: true, advisories: [] }, { scope: 'dev', intel, today }).elements.threat
      ),
    ],
    ['network reach needs AV:N, PR:N and UI:N', networkReachable('AV:N/PR:N/UI:R') === false && networkReachable(null) === null],
  ];
  let bad = 0;
  for (const [what, ok] of checks) {
    console.log(`${ok ? 'ok  ' : 'FAIL'}  ${what}`);
    if (!ok) bad += 1;
  }
  return bad ? 1 : 0;
}

async function main() {
  if (process.argv.includes('--selftest')) return selftest();
  const today = new Date().toISOString().slice(0, 10);
  const allowlist = JSON.parse(readFileSync(join(ROOT, 'scripts', 'dependency-audit-allowlist.json'), 'utf8')).entries || [];
  const prod = audit(['--omit=dev']);
  const all = audit([]);
  const ghsas = [
    ...new Set(
      advisoriesOf(all)
        .flatMap((p) => p.advisories.map((a) => a.ghsa))
        .filter(Boolean)
    ),
  ];
  let intel = { kev: null, cveOf: null, epss: null };
  let sources = { kev: 'not read (offline run)', advisories: 'not read (offline run)', epss: 'not read (offline run)' };
  if (process.argv.includes('--fetch')) ({ intel, sources } = await readIntel(ghsas, { token: process.env.GITHUB_TOKEN }));
  sources.audit = `npm audit: ${advisoriesOf(all).length} package(s), ${advisoriesOf(prod).length} in the shipped bundle`;
  const report = buildReport({ prod, all, allowlist, intel, today, readAt: new Date().toISOString(), sources });
  const out = process.argv.find((a) => a.startsWith('--out='));
  if (out) writeFileSync(out.slice(6), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`exposure-report: act-now ${report.counts['act-now']}, plan ${report.counts.plan}, watch ${report.counts.watch}`);
  for (const [k, v] of Object.entries(sources)) console.log(`  source ${k}: ${v}`);
  for (const i of report.items)
    console.log(`  ${i.tier.padEnd(7)} ${i.scope} ${i.severity.padEnd(8)} ${i.name} — ${i.elements.threat}; ${i.elements.exploit}; ${i.elements.control}`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().then(
    (c) => process.exit(c),
    (e) => {
      console.error(`exposure-report: ${e.message}`);
      process.exit(2);
    }
  );
}
