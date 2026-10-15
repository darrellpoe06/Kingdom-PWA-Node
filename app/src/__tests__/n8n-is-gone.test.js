// @vitest-environment node
// =============================================================================
// n8n-is-gone — no live n8n call in the lanes, the transport or the NAS loops
// (DR-0617; Darrell 2026-09-24: "No n8n!!!")
// =============================================================================
// Scans every file under .github/workflows, app/functions and infra/nas-loops
// for a LIVE n8n call: an n8n webhook path (/webhook/<name>), the n8n port
// (:5678), or the n8n image. Comments are stripped first, so history written in
// prose is never a finding (a noisy guard is a guard that gets deleted).
//
// HELD — the principal's rule for this removal (2026-09-24, "make sure it works
// end to end before dismantling anything"): a piece that still touches the LIVE
// NAS n8n stays until its replacement is proven end to end. Each held piece is
// named below with its reason, and each entry must STILL be present; the day a
// held piece is removed, its entry must go too, so this list can only shrink.
//
// The export library (docs/00-foundations/n8n-workflows) is gone except the
// one export a held rotation script downloads.
//
// Proven-to-catch (DR-0076 §3): the fixture block feeds the scanner the exact
// shapes it exists to catch and requires a finding for each.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
// SCAN WIDENED 2026-10-11 TO INCLUDE scripts/ (DR-0970).
//
// DR-0970 moved the ops-announce bell out of two workflows and into
// scripts/ops-announce.mjs, so its decision could be unit-tested. That move
// would have carried a TRACKED LIVE n8n CALL OUT OF THIS GUARD'S SIGHT: the
// two HELD entries went stale, and dropping them (which the shrink-only rule
// demands of a stale entry) would have left the call untracked with the
// ledger looking cleaner. A workaround that reaches a surface the guard does
// not watch is the finding, not the fix (P49).
//
// So scripts/ is scanned now. It surfaces pre-existing reality, not new
// calls: nas-update-wf18-bearer-guard.sh has printed those lines all along
// and is ALREADY held as a path below. Nothing newly calls n8n.
const SCAN_DIRS = ['.github/workflows', 'app/functions', 'infra/nas-loops', 'scripts'];

const LIVE_N8N = [
  { id: 'webhook-path', re: /\/webhook\/[A-Za-z0-9_-]+/ },
  { id: 'n8n-port', re: /:5678\b/ },
  { id: 'n8n-image', re: /n8nio\/n8n|docker\.n8n\.io|n8n\.io\b/ },
];

// Whole-line comments only (#, //, *), plus trailing ` # ...` / ` // ...`
// that are clearly comments. Conservative: it can only under-strip.
function stripComments(text) {
  return String(text || '')
    .split('\n')
    .map((line) => {
      if (/^\s*(#|\/\/|\*|\/\*)/.test(line)) return '';
      return line.replace(/\s\/\/\s.*$/, '').replace(/\s#\s.*$/, '');
    })
    .join('\n');
}

function scanText(text) {
  const out = [];
  const lines = stripComments(text).split('\n');
  lines.forEach((line, i) => {
    for (const p of LIVE_N8N) if (p.re.test(line)) out.push({ line: i + 1, id: p.id, text: line.trim() });
  });
  return out;
}

function walk(dir, acc = []) {
  let names;
  try { names = readdirSync(dir); } catch { return acc; }
  for (const n of names) {
    if (n === 'node_modules' || n.startsWith('.git')) continue;
    const full = join(dir, n);
    let st; try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(ya?ml|js|mjs|cjs|sh|py|json|toml|conf)$/.test(n)) acc.push(full);
  }
  return acc;
}

// Each held piece: the file, the pattern it still carries, and WHY it is held.
const HELD = [
  // RELEASED 2026-10-15 (DR-1043), on the condition this entry itself named:
  // "Held until a sovereign bell replaces it end to end." scripts/ops-announce.mjs
  // no longer carries an n8n webhook path -- RELAY_URL is the sovereign
  // /announce road, poetech-announce.service was proven `active` on the box by
  // nas-health run 38726513614, and install.sh mounts the Funnel path every
  // services-sync cycle. This test is what forced the removal rather than
  // letting a stale hold sit: it failed with "scripts/ops-announce.mjs#webhook-path
  // no longer present -- drop it from HELD". The ledger can only shrink, and
  // this is it shrinking by one.
  {
    path: 'scripts/nas-update-wf18-bearer-guard.sh', id: 'webhook-path',
    why: 'newly VISIBLE, not newly live: the scan widened to scripts/ on 2026-10-11 and this file has printed the operator its wf18 verification curl all along. The file itself is already held in HELD_PATHS as the rotation control for the possibly-live wf18 bank-PII webhook. Held with it.',
  },
  {
    path: 'scripts/nas-update-wf18-bearer-guard.sh', id: 'n8n-port',
    why: 'the same two printed lines name 192.168.1.26:5678 because that is where the live NAS n8n answers; it is the address the operator must check by hand. Held with the file in HELD_PATHS until the wf18 webhook is proven dead.',
  },
  {
    path: 'infra/nas-loops/loops/health-check.sh', id: 'n8n-port',
    why: 'the NAS health-check still probes n8n /healthz; n8n is still running on the NAS (DR-0591 measured the Funnel root serving n8n on 2026-09-23). Held until the container is shut down.',
  },
];

// Held as whole files/dirs (no live string to scan, but still wired to live n8n).
const HELD_PATHS = [
  { path: 'app/functions/n8n/[[path]].js', why: 'the legacy /n8n transport to the still-running NAS n8n. No app code calls it (N8N_BASE is gone), but traffic from outside the bundle cannot be measured from here. Held until proven unused.' },
  { path: 'infra/n8n', why: 'the NAS stack source: its docker-compose.yml also runs the live ntfy and Ollama containers, plus the property-history bridge script and restic backup. Held until those are proven on their own sovereign homes.' },
  { path: 'docs/00-foundations/n8n-workflows/18-imported-transactions-api.json', why: 'downloaded by the held nas-rotate-bearer.yml -> scripts/nas-update-wf18-bearer-guard.sh, the rotation control for the wf18 bank-PII webhook that may still be live.' },
  { path: '.github/workflows/nas-rotate-bearer.yml', why: 'rotation control for the possibly-live wf18 bearer; held with its script and export.' },
];

const heldKey = (h) => `${h.path}#${h.id}`;

describe('n8n-is-gone: the scanner catches every live shape (proven-to-catch)', () => {
  it('flags a webhook POST, the n8n port and the n8n image', () => {
    expect(scanText('curl -sS -X POST "https://poetech.tail5a2f35.ts.net/webhook/ops-announce"').map((f) => f.id)).toEqual(['webhook-path']);
    expect(scanText('TARGETS="n8n=http://127.0.0.1:5678/healthz"').map((f) => f.id)).toEqual(['n8n-port']);
    expect(scanText('    image: docker.n8n.io/n8nio/n8n:latest').map((f) => f.id)).toEqual(['n8n-image']);
    // Built from parts so this fixture is not itself a contained reference
    // (business-systems-guard counts the literal in app/src).
    const legacy = '/n8n' + '/webhook/link-title';
    expect(scanText(`const u = '${legacy}';`).map((f) => f.id)).toEqual(['webhook-path']);
  });
  it('does not flag history written in comments', () => {
    expect(scanText('# the old relay was Funnel -> n8n -> /webhook/ops-announce')).toEqual([]);
    expect(scanText('// ' + '/n8n' + '/webhook/foo -> FUNNEL/webhook/foo (legacy)')).toEqual([]);
    expect(scanText('  # probes 127.0.0.1:5678 no more')).toEqual([]);
  });
});

describe('n8n-is-gone: the live tree', () => {
  const findings = [];
  for (const d of SCAN_DIRS) {
    for (const f of walk(join(ROOT, d))) {
      const rel = relative(ROOT, f).split('\\').join('/');
      for (const hit of scanText(readFileSync(f, 'utf8'))) findings.push({ ...hit, path: rel });
    }
  }

  it('scans real files (the guard reads the repo, not a fixture)', () => {
    expect(walk(join(ROOT, '.github/workflows')).length).toBeGreaterThan(10);
    expect(walk(join(ROOT, 'app/functions')).length).toBeGreaterThan(5);
  });

  it('carries no live n8n call outside the HELD ledger', () => {
    const allowed = new Set(HELD.map(heldKey));
    const stray = findings.filter((f) => !allowed.has(`${f.path}#${f.id}`));
    expect(stray, stray.map((s) => `${s.path}:${s.line} ${s.id} — ${s.text}`).join('\n')).toEqual([]);
  });

  it('every HELD entry is still real and states why (the ledger can only shrink)', () => {
    for (const h of HELD) {
      expect(findings.some((f) => `${f.path}#${f.id}` === heldKey(h)), `${heldKey(h)} no longer present — drop it from HELD`).toBe(true);
      expect(h.why.length).toBeGreaterThan(40);
    }
    for (const h of HELD_PATHS) {
      expect(existsSync(join(ROOT, h.path)), `${h.path} is gone — drop it from HELD_PATHS`).toBe(true);
      expect(h.why.length).toBeGreaterThan(40);
    }
  });

  it('the export library is gone except the one held export', () => {
    const dir = join(ROOT, 'docs/00-foundations/n8n-workflows');
    const left = existsSync(dir) ? readdirSync(dir) : [];
    const heldHere = HELD_PATHS.map((h) => h.path).filter((p) => p.startsWith('docs/00-foundations/n8n-workflows/')).map((p) => p.split('/').pop());
    expect(left.filter((n) => !heldHere.includes(n))).toEqual([]);
    expect(existsSync(join(ROOT, 'docs/00-foundations/_quarantine'))).toBe(false);
  });

  it('the app source carries no n8n base resolver', () => {
    expect(existsSync(join(ROOT, 'app/src/lib/n8n-base.js'))).toBe(false);
  });
});
