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
function runProbe({ code, ctype, fnDark = 'no' }) {
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
    // What the Pages Function probe just above the Worker probe left behind:
    // its VERDICT, not its reading (DR-1291). `yes` only where that probe
    // actually declared the layer dark. It used to be the raw signature, and
    // that cost sixty red runs — an unsigned road is not a dark layer.
    //
    // The other two are only interpolated into the parked note's text, so the
    // note reports what the first door read; they decide nothing here.
    `FN_DARK='${fnDark}'`,
    "FN_ROAD=''",
    'FN_IS_SHELL=no',
    codeOnly(workerProbe()),
    'printf "FAILS %s\\n" "$fail_reasons"',
  ].join('\n'));
  chmodSync(script, 0o755);

  const out = execFileSync('/bin/sh', [script], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${dir}:${process.env.PATH}` },
  });
  const notes = out.split('\n').filter((l) => l.startsWith('NOTE ')).map((l) => l.slice(5));
  return {
    note: notes[0] || '',
    notes,
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

  // THE SECOND DOOR IS OPTIONAL WHILE THE FIRST IS OPEN (DR-1180). Measured
  // 2026-10-21: with Pages Functions back since the 2026-10-09 fault, this
  // probe failed every run and wrote a daily note on #2057 for a Worker that
  // was never deployed and that nobody was locked out by; the Edge Guard it
  // carries waits on a Cloudflare token only Darrell's dashboard can mint.
  //
  // IT ASKS THE FIRST DOOR'S VERDICT, NOT ITS HEADER (2026-10-29, DR-1291).
  // The cases below used to pass `fnRoad`, and an empty signature stood for
  // "both doors are dark". Measured: 60 consecutive site-health failures from
  // 2026-10-22T07:00Z, every one carrying ONLY this reason, while
  // cf-pages-diagnose run 40746439480 read /sb, /cams and /nas-photos at 200
  // signed `pages-function` on the live custom domain. /automation-status was
  // unsigned because the ZONE answered `error code: 502` in place of the
  // Function — a Cloudflare error page signs nothing. Unsigned is not dark.
  it('the SPA shell on /edge while the Pages layer is NOT declared dark is a parked decision: a note, no failure', () => {
    const r = runProbe({ code: '200', ctype: 'text/html; charset=utf-8', fnDark: 'no' });
    expect(r.fails).toBe('');
    const parked = r.notes.find((n) => /not deployed/.test(n));
    expect(parked, 'the reading must be written to the notes, not dropped').toBeTruthy();
    expect(parked).toMatch(/parked decision, not a fault/);
    expect(parked).toMatch(/open through Pages/);
    expect(parked).toMatch(/Workers Scripts:Edit/);
    expect(parked).toMatch(/DR-1180/);
    expect(parked).toMatch(/No daily note, no deadline/);
  });

  // THE CASE THAT WAS RED FOR SEVEN DAYS. This is the exact live reading:
  // /edge/whoami 200 text/html (Worker never deployed, parked) with the first
  // door UNSIGNED but not declared dark (its 502 came from the zone, not from
  // our shell). Before DR-1291 this produced the loud fault; it is the parked
  // note now, and nothing else in the run was failing.
  it('the live 2026-10-29 reading — Worker undeployed, first door unsigned but answering — is a note, not a fault', () => {
    const r = runProbe({ code: '200', ctype: 'text/html; charset=utf-8', fnDark: 'no' });
    expect(r.fails).toBe('');
    expect(r.notes.some((n) => /parked decision, not a fault/.test(n))).toBe(true);
  });

  it('an unset FN_DARK is treated as not-dark, so a probe that never set it cannot fire the loud fault by omission', () => {
    // The arm reads ${FN_DARK:-no}. A missing variable must not mean "dark":
    // that is the same shape as reading an absent header as an outage.
    const r = runProbe({ code: '200', ctype: 'text/html', fnDark: '' });
    expect(r.fails).toBe('');
  });

  it('PROVEN-TO-CATCH: the SPA shell on /edge while the Pages layer IS declared dark is both doors dark, and loud', () => {
    const r = runProbe({ code: '200', ctype: 'text/html; charset=utf-8', fnDark: 'yes' });
    expect(r.fails).toMatch(/THE WORKER ROADS ARE DARK TOO/);
    expect(r.notes.some((n) => /parked decision/.test(n))).toBe(false);
  });

  it('PROVEN-TO-CATCH: both doors dark names the Worker by name, so the two layers stay distinguishable', () => {
    const r = runProbe({ code: '200', ctype: 'text/html; charset=utf-8', fnDark: 'yes' });
    expect(r.fails).toMatch(/THE WORKER ROADS ARE DARK TOO/);
    expect(r.fails).toMatch(/poetech-roads Worker/);
  });

  it('PROVEN-TO-CATCH: no answer at all, with the first door dark, is the Worker dark too — not a pass', () => {
    // DR-0076: unknown never reads as healthy. curl prints 000 on a connection
    // failure and the content-type comes back empty.
    const r = runProbe({ code: '000', ctype: '', fnDark: 'yes' });
    expect(r.fails).toMatch(/THE WORKER ROADS ARE DARK TOO/);
    expect(r.fails).toMatch(/instead of the JSON 401/);
  });

  it('a 200 of JSON also reads as alive, so the probe is about the LAYER not the verdict', () => {
    // If a steward's token ever reached the runner, /edge/whoami would answer
    // 200 JSON. That must not read as an outage — even with the first door
    // dark, because a live Worker is a live Worker.
    expect(runProbe({ code: '200', ctype: 'application/json', fnDark: 'yes' }).fails).toBe('');
  });
});

// =============================================================================
// The first door declares its verdict, and that verdict is what gets read
// =============================================================================
describe('the Pages Function probe sets FN_DARK, and sets it only where it fails', () => {
  /** The first-door probe's own lines, from its GET to the end of its case. */
  function firstDoorProbe() {
    const start = WF.indexOf('FN_BODY=$(mktemp)');
    expect(start, 'the Pages Function probe is missing from site-health.yml').toBeGreaterThan(-1);
    const end = WF.indexOf('# AND THE OTHER CLASS OF ROAD', start);
    expect(end).toBeGreaterThan(start);
    return WF.slice(start, end);
  }

  it('FN_DARK starts at no, so the loud path is never the default', () => {
    expect(codeOnly(firstDoorProbe())).toMatch(/FN_DARK=no/);
  });

  it('FN_DARK=yes appears exactly once, immediately inside the arm that declares the outage', () => {
    const code = codeOnly(firstDoorProbe());
    const yeses = code.match(/FN_DARK=yes/g) || [];
    expect(yeses.length, 'one writer, so there is one place to read the verdict from').toBe(1);
    // It must sit under the both-halves-agree test, not beside it: that test is
    // the whole reason an unsigned road is not automatically an outage.
    const shellTest = code.indexOf('[ "$FN_IS_SHELL" = "yes" ]');
    expect(shellTest).toBeGreaterThan(-1);
    expect(code.indexOf('FN_DARK=yes')).toBeGreaterThan(shellTest);
  });

  it('the declaring arm still raises the reason the carve-out is keyed on, byte for byte', () => {
    // KNOWN_OUTAGES excises this reason by head AND tail. If either drifts the
    // carve-out stops working and the witness goes loud — safe, but it means
    // these two files must be checked together, which is what this pins.
    const code = codeOnly(firstDoorProbe());
    expect(code).toContain('NO PAGES FUNCTION IS RUNNING');
    expect(code).toContain('which is exactly what made the 2026-10-09 reading wrong');
  });

  it('the Worker arm reads FN_DARK and nothing else about the first door', () => {
    const probe = codeOnly(workerProbe());
    expect(probe).toMatch(/case "\$\{FN_DARK:-no\}" in/);
    // The old gate must be gone from the DECIDING position. FN_ROAD may still
    // appear in the note's text (it reports what the first door read), so this
    // asserts the absence of a case on it rather than the absence of the name.
    expect(probe).not.toMatch(/case "\$\{FN_ROAD:-\}" in/);
  });

  /**
   * RUN the first door's own lines against a stub curl, because a `case` arm
   * that sets the wrong verdict reads perfectly. The stub answers one GET with
   * `-D -` (headers to stdout) and `-o FILE` (body to the file), which is the
   * exact shape the probe uses.
   */
  function runFirstDoor({ status, road = '', ctype = 'text/html', body = 'hello' }) {
    const dir = mkdtempSync(join(tmpdir(), 'fn-probe-'));
    const curl = join(dir, 'curl');
    writeFileSync(curl, [
      '#!/bin/sh',
      'out=""',
      'prev=""',
      'for a in "$@"; do',
      '  if [ "$prev" = "-o" ]; then out="$a"; fi',
      '  prev="$a"',
      'done',
      `[ -n "$out" ] && printf '%s' ${JSON.stringify(body)} > "$out"`,
      `printf 'HTTP/1.1 ${status}\\r\\n'`,
      road ? `printf 'x-poetech-road: ${road}\\r\\n'` : 'true',
      `printf 'content-type: ${ctype}\\r\\n\\r\\n'`,
      'exit 0',
    ].join('\n'));
    chmodSync(curl, 0o755);

    const script = join(dir, 'first.sh');
    writeFileSync(script, [
      '#!/bin/sh',
      'UA=probe',
      'fail_reasons=""',
      'add_fail() { fail_reasons="${fail_reasons}${fail_reasons:+; }$1"; }',
      'note() { printf "NOTE %s\\n" "$1"; }',
      codeOnly(firstDoorProbe()),
      'printf "DARK %s\\n" "${FN_DARK:-unset}"',
      'printf "FAILS %s\\n" "$fail_reasons"',
    ].join('\n'));
    chmodSync(script, 0o755);

    const out = execFileSync('/bin/sh', [script], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}` },
    });
    return {
      dark: (out.match(/^DARK (.*)$/m) || ['', ''])[1],
      fails: (out.match(/^FAILS (.*)$/m) || ['', ''])[1],
      notes: out.split('\n').filter((l) => l.startsWith('NOTE ')).map((l) => l.slice(5)),
    };
  }

  it('THE LIVE READING: 502, unsigned, not our shell -> the layer is NOT dark and nothing fails', () => {
    // poetech.us/automation-status, 2026-10-28T18:34Z: the zone's own
    // `error code: 502` in text/plain. This is the reading that was red for
    // seven days by way of the Worker arm.
    const r = runFirstDoor({ status: '502 Bad Gateway', ctype: 'text/plain; charset=UTF-8', body: 'error code: 502' });
    expect(r.dark).toBe('no');
    expect(r.fails).toBe('');
    expect(r.notes.join(' ')).toMatch(/NOT our SPA shell/);
  });

  it('a signed answer is the layer up, whatever the status', () => {
    const r = runFirstDoor({ status: '502 Bad Gateway', road: 'pages-function', ctype: 'application/json', body: '{"error":"upstream-unreachable"}' });
    expect(r.dark).toBe('no');
    expect(r.fails).toBe('');
  });

  it('PROVEN-TO-CATCH: unsigned AND our own SPA shell is the layer dark, and it says so', () => {
    const r = runFirstDoor({ status: '200 OK', ctype: 'text/html', body: '<script src="/poetech-app/assets/x.js">' });
    expect(r.dark).toBe('yes');
    expect(r.fails).toMatch(/NO PAGES FUNCTION IS RUNNING/);
  });

  it('the status code reaches the note, for every one of those cases', () => {
    expect(runFirstDoor({ status: '502 Bad Gateway' }).notes.join(' ')).toMatch(/\*\*502\*\*/);
    expect(runFirstDoor({ status: '200 OK', road: 'pages-function' }).notes.join(' ')).toMatch(/\*\*200\*\*/);
  });

  it('the status code is written into the notes, because it is the reading that explains the others', () => {
    // Seven days of "unsigned" with no code beside it looked like a signature
    // mystery. It was a 502 from the zone the whole time.
    const code = codeOnly(firstDoorProbe());
    expect(code).toMatch(/FN_CODE=/);
    expect(code).toMatch(/GET \/automation-status\\` -> \*\*\$\{FN_CODE:-000\}\*\*/);
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
