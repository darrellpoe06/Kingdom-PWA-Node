// =============================================================================
// funnel-actuation-guard — a same-origin route that reaches nothing is a lie
// =============================================================================
// PROVEN-TO-CATCH witness for the 2026-09-06 defect (DR-0330). Darrell: "I am
// also unable to upload my taxes." Nothing was wrong with the app. The Books ->
// Taxes screen called `/poetech-app/taxes/upload`, the Pages Function existed
// and faithfully forwarded to the Funnel's `/taxes` — and the Funnel had no
// `/taxes` mount, no service was ever started, and the Caddy route lived only
// in a docstring. Every layer the repo could see was green.
//
// client-path-parity.test.js already guards the FIRST hop (does a path the
// client calls have a Pages Function?). It passed, because the Function was
// there. This guard is the SECOND hop, the one nothing watched: does the route
// that Function forwards to actually terminate at something real?
//
// A Funnel-proxied prefix is ACTUATED when the repo contains BOTH:
//   1. a row in infra/nas-transport/RECORDED-STATE.md naming the prefix — the
//      declared intended state, and
//   2. an installer that mounts it (`--set-path <prefix>`), so the intent is
//      actuated by the NAS on its own clock rather than by a remembered hand.
//
// Prefixes that are knowingly un-actuated are listed in the UNACTUATED ledger
// in RECORDED-STATE.md with a re-review date (DR-0075: a non-improvement is
// allowed only with a why and a date). That ledger is the point — it converts
// an invisible gap into a counted one. What this guard forbids is a NEW route
// that is neither actuated nor declared: silence is what cost seven weeks.
// =============================================================================
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoPath = (rel) => fileURLToPath(new URL('../' + rel, import.meta.url));

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    const full = join(dir, name);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full, out);
    else if (full.endsWith('.js')) out.push(full);
  }
  return out;
}

// Every prefix a Pages Function forwards to the Funnel. The empty prefix is the
// LEGACY n8n root (DR-0218, being removed to zero) and is not a sovereign row.
export function proxiedPrefixes(files) {
  const found = new Set();
  const re = /upstreamPrefix:\s*'([^']*)'/g;
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    // Skip the factory itself — its matches are documentation, not routes.
    if (f.endsWith(join('_lib', 'funnel-proxy.js'))) continue;
    let m;
    while ((m = re.exec(src))) {
      if (m[1]) found.add(m[1]);
    }
  }
  return found;
}

/** Prefixes any installer actually mounts (`--set-path <prefix> <backend>`). */
export function mountedPrefixes(scripts) {
  const found = new Set();
  const re = /--set-path\s+(\/[A-Za-z0-9._-]+)/g;
  for (const f of scripts) {
    const src = readFileSync(f, 'utf8');
    let m;
    while ((m = re.exec(src))) found.add(m[1]);
  }
  return found;
}

/** Prefixes named by a row of the RECORDED-STATE table. */
export function recordedPrefixes(recordedState) {
  const found = new Set();
  const re = /^\|\s*`(\/[A-Za-z0-9._-]+)`\s*\|/gm;
  let m;
  while ((m = re.exec(recordedState))) found.add(m[1]);
  return found;
}

/**
 * Prefixes the baseline explicitly declares un-actuated, each of which MUST
 * carry a re-review date on its line. A row without a date is not a declared
 * gap, it is an undated promise — so it is deliberately not collected here and
 * the prefix reports as unguarded.
 */
export function declaredUnactuated(recordedState) {
  const found = new Set();
  const re = /^-\s*`(\/[A-Za-z0-9._-]+)`[^\n]*re-review:\s*\d{4}-\d{2}-\d{2}/gm;
  let m;
  while ((m = re.exec(recordedState))) found.add(m[1]);
  return found;
}

export function actuationFindings({
  functionsDir = repoPath('app/functions'),
  infraDir = repoPath('infra'),
  recordedStateFile = repoPath('infra/nas-transport/RECORDED-STATE.md'),
} = {}) {
  const proxied = proxiedPrefixes(walk(functionsDir));
  const mounted = mountedPrefixes(collectSh(infraDir));
  const recorded = readFileSync(recordedStateFile, 'utf8');
  const recordedSet = recordedPrefixes(recorded);
  const declared = declaredUnactuated(recorded);

  const findings = [];
  for (const prefix of [...proxied].sort()) {
    if (declared.has(prefix)) continue;            // a counted, dated gap
    const isRecorded = recordedSet.has(prefix);
    const isMounted = mounted.has(prefix);
    if (isRecorded && isMounted) continue;         // fully actuated
    findings.push({
      prefix,
      recorded: isRecorded,
      mounted: isMounted,
      detail: !isRecorded && !isMounted
        ? 'a Pages Function forwards here, but the Funnel has no recorded row and no installer mounts it — this route reaches nothing'
        : !isMounted
          ? 'recorded as intended state, but no installer mounts it — the intent is never actuated'
          : 'mounted by an installer, but absent from RECORDED-STATE.md (rule 2: every mutation updates the baseline in the same merge)',
    });
  }
  return findings;
}

function collectSh(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    const full = join(dir, name);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) collectSh(full, out);
    else if (full.endsWith('.sh') || full.endsWith('.py')) out.push(full);
  }
  return out;
}
