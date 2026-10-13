// =============================================================================
// infra-transport-guard — the witness the 2026-07-30 outage lacked (DR-0250)
// =============================================================================
// The night an installer ran `tailscale serve --set-path` on an unverified
// premise, NO gate stood between the command and the public transport. This is
// that gate: any infra/scripts shell file that MUTATES the Tailscale transport
// (a real `tailscale serve|funnel` command, not a comment) MUST cite the
// recorded baseline (a `RECORDED-STATE:` reference to
// infra/nas-transport/RECORDED-STATE.md). No citation -> the build is RED.
//
// Why a citation, not a syntax ban: the correct serve-vs-funnel call is nuanced
// (the era-0 two-step legitimately uses `serve` to map the port before
// `funnel` exposes it) — banning a verb risks a wrong rule (the very failure
// mode this exists to stop). Forcing a citation makes the author READ the
// baseline and keep it true (DR-0076 §5 characterize-before-change), which is
// exactly the step that was skipped. Pure + CLI; mirrors business-systems-guard.
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MUTATES = /^\s*[^#\n]*\btailscale\s+(serve|funnel)\b/m; // a real command line, not a comment
const CITES = /RECORDED-STATE/;

function walkSh(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const f of entries) {
    if (f === 'node_modules' || f === '.git' || f === 'dist') continue;
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) walkSh(p, out);
    else if (f.endsWith('.sh')) out.push(p);
  }
  return out;
}

// findings(files?) — inject file list for tests; defaults to the real repo.
export function transportFindings(files) {
  const list = files || [...walkSh(join(ROOT, 'infra')), ...walkSh(join(ROOT, 'scripts'))];
  const findings = [];
  for (const p of list) {
    const text = readFileSync(p, 'utf8');
    if (MUTATES.test(text) && !CITES.test(text)) {
      findings.push(`${relative(ROOT, p).replaceAll('\\', '/')}: mutates the Tailscale transport (tailscale serve/funnel) without citing RECORDED-STATE — read infra/nas-transport/RECORDED-STATE.md, keep every row true, add a "RECORDED-STATE:" reference (DR-0250; the 2026-07-30 outage class).`);
    }
  }
  return findings;
}

// Pure helper for tests: does this script text pass?
export function scriptPasses(text) {
  return !(MUTATES.test(text) && !CITES.test(text));
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const findings = transportFindings();
  if (findings.length) {
    console.error('infra-transport-guard: FAIL');
    for (const f of findings) console.error('  - ' + f);
    process.exit(1);
  }
  console.log('infra-transport-guard: OK — every transport-mutating script cites the recorded baseline.');
}
