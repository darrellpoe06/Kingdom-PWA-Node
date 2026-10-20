// @vitest-environment node
// =============================================================================
// The witness sees the WORKER roads, not only the Pages Functions (DR-1124)
// =============================================================================
// site-health.yml already names one whole class of outage in one line: a
// content-type reading of /automation-status that says "NO PAGES FUNCTION IS
// RUNNING" and lists every NAS-backed road that goes dark with it -- /sb, /n8n,
// /cams, /taxes, /openers, /llm, /reviews, /voice, /nas-photos, /ways, /scribe.
// It is right about all of them.
//
// MEASURED 2026-10-20: `grep -c edge site-health.yml` returns 13, and all
// THIRTEEN are the word "ledger". Nothing in the witness had ever probed
// /edge/*, which is not a Pages Function at all -- it is the poetech-roads
// WORKER, bound by zone route in infra/cf-roads-worker/wrangler.toml, running
// before Pages. So across ten days of #2057 nobody could say whether the Worker
// roads were dark too, and the Edge Guard and the Admin visitor count
// (VisitorDoors.jsx, wired by DR-1072) are the two surfaces that ride them.
//
// WHY AN UNAUTHENTICATED PROBE IS THE RIGHT ONE. edge.js refuses a caller with
// no bearer token by returning JSON 401 {"reason":"signed-out"} BEFORE it looks
// anything up, so only a running Worker writes that -- a dead road gives the SPA
// shell, a 404 or nothing. The runner holds no steward token and needs none.
//
// These cases RUN the probe's own lines against a stub curl rather than only
// reading them, because a `case` arm that classifies wrongly reads perfectly.
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdtempSync, chmodSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const WF = readFileSync(join(HERE, '../../../.github/workflows/site-health.yml'), 'utf8');

/** Shell code with `#` comments removed — prose must never be measured as code. */
const codeOnly = (text) => text.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');

/** Just the Worker probe, so a match elsewhere in the file cannot stand in. */
function workerProbe() {
  const start = WF.indexOf('EDGE_CODE=');
  expect(start, 'the /edge Worker probe is missing from site-health.yml').toBeGreaterThan(-1);
  const end = WF.indexOf('# WHICH SIGN-IN DOORS ARE ACTUALLY ON', start);
  expect(end).toBeGreaterThan(start);
  return WF.slice(start, end);
}

/**
 * Run the probe's real lines with a stub `curl` that answers with the given
 * code and content-type, and report which branch fired.
 */
function runProbe({ code, ctype }) {
  const dir = mkdtempSync(join(tmpdir(), 'edge-probe-'));
  const curl = join(dir, 'curl');
  // The probe asks for one -w format at a time; answer whichever it asked for.
  writeFileSync(curl, [
    '#!/bin/sh',
    'for a in "$@"; do',
    `  case "$a" in '%{http_code}') echo '${code}'; exit 0 ;; '%{content_type}') echo '${ctype}'; exit 0 ;; esac`,
    'done',
    'exit 0',
  ].join('\n'));
  chmodSync(curl, 0o755);

  const script = join(dir, 'probe.sh');
  writeFileSync(script, [
    '#!/bin/sh',
    'fail_reasons=""',
    'add_fail() { fail_reasons="${fail_reasons}${fail_reasons:+; }$1"; }',
    'note() { printf "NOTE %s\\n" "$1"; }',
    codeOnly(workerProbe()),
    'printf "FAILS %s\\n" "$fail_reasons"',
  ].join('\n'));
  chmodSync(script, 0o755);

  const out = execFileSync('/bin/sh', [script], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${dir}:${process.env.PATH}` },
  });
  return {
    note: (out.match(/^NOTE (.*)$/m) || ['', ''])[1],
    fails: (out.match(/^FAILS (.*)$/m) || ['', ''])[1],
  };
}

describe('the Worker roads are probed, and classified by what only a live Worker writes', () => {
  it('a JSON 401 is the Worker ALIVE — the refusal edge.js gives an unauthenticated caller', () => {
    const r = runProbe({ code: '401', ctype: 'application/json' });
    expect(r.fails).toBe('');
    expect(r.note).toMatch(/edge\/whoami/);
    expect(r.note).toMatch(/401/);
  });

  it('PROVEN-TO-CATCH: the SPA shell on that road is the Worker DARK', () => {
    const r = runProbe({ code: '200', ctype: 'text/html; charset=utf-8' });
    expect(r.fails).toMatch(/THE WORKER ROADS ARE DARK TOO/);
    expect(r.fails).toMatch(/poetech-roads Worker/);
  });

  it('PROVEN-TO-CATCH: no answer at all is the Worker dark, not a pass', () => {
    // DR-0076: unknown never reads as healthy. curl prints 000 on a connection
    // failure and the content-type comes back empty.
    const r = runProbe({ code: '000', ctype: '' });
    expect(r.fails).toMatch(/THE WORKER ROADS ARE DARK TOO/);
    expect(r.fails).toMatch(/instead of the JSON 401/);
  });

  it('a 200 of JSON also reads as alive, so the probe is about the LAYER not the verdict', () => {
    // If a steward's token ever reached the runner, /edge/whoami would answer
    // 200 JSON. That must not read as an outage.
    expect(runProbe({ code: '200', ctype: 'application/json' }).fails).toBe('');
  });
});

describe('what the probe is careful NOT to claim', () => {
  it('the alive arm does nothing but note it — being up is not being usable', () => {
    // edge.js verifies a session by calling /sb/auth/v1/user, a Pages Function.
    // While /sb is dark the Worker answers and still cannot admit anybody, so a
    // live Worker must never be reported as "a steward can read the count".
    // Asserted by SHAPE rather than by slicing: my first cut cut the arm with
    // indexOf('*)'), which finds the `*)` inside `*application/json*)` itself
    // and silently measured half a pattern.
    const probe = codeOnly(workerProbe());
    expect(probe).toMatch(/\*application\/json\*\)\s*:\s*;;/);   // the arm is a bare `:`
    expect(probe.slice(probe.indexOf('*application/json*)'), probe.indexOf('*)', probe.indexOf('*application/json*)') + 20))).not.toMatch(/add_fail/);
  });

  it('it is a SEPARATE reading from the Pages Function probe, and says so', () => {
    // The two must stay distinguishable: one cause would otherwise be read as
    // the other, which is the mistake this probe exists to make impossible.
    expect(workerProbe()).toMatch(/DIFFERENT layer/);
    expect(WF).toMatch(/NO PAGES FUNCTION IS RUNNING/);           // still there
    expect(WF.indexOf('NO PAGES FUNCTION IS RUNNING')).toBeLessThan(WF.indexOf('EDGE_CODE='));
  });

  it('the Pages Function probe does not list /edge among its dark roads, correctly', () => {
    // codeOnly, because this record's OWN comment block between the two probes
    // names /edge/* repeatedly -- measuring prose as code failed this on its
    // first run, which is the rule the helper exists for.
    const fn = codeOnly(WF.slice(WF.indexOf('NO PAGES FUNCTION IS RUNNING'), WF.indexOf('EDGE_CODE=')));
    expect(fn).toMatch(/\/sb sign-in/);
    expect(fn).not.toMatch(/\/edge/);
  });
});

describe('the road it probes is the road the app calls', () => {
  it('the app reaches the Edge Guard at /edge, and the Worker owns that route', () => {
    const lib = readFileSync(join(HERE, '../lib/edge-guard.js'), 'utf8');
    expect(lib).toMatch(/EDGE_BASE = '\/edge'/);
    const wrangler = readFileSync(join(HERE, '../../../infra/cf-roads-worker/wrangler.toml'), 'utf8');
    expect(wrangler).toMatch(/poetech\.us\/edge\/\*/);
  });

  it('and the Admin visitor count rides it, which is why it is worth watching', () => {
    // DR-1072 wired visitor-funnel.js to Access & Usage through VisitorDoors,
    // which reads getTraffic() -> /edge/traffic. A library with no caller was
    // DR-1072's whole complaint; a caller with no witness is this one's.
    const doors = readFileSync(join(HERE, '../components/VisitorDoors.jsx'), 'utf8');
    expect(doors).toMatch(/getTraffic/);
    expect(doors).toMatch(/visitor-funnel/);
    expect(readFileSync(join(HERE, '../lib/edge-guard.js'), 'utf8')).toMatch(/getTraffic = \(hours = 24\) => edgeCall\(`\/traffic/);
  });
});
