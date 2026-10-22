// @vitest-environment node
// =============================================================================
// cams-diag prints every live end, and its printer is real shell (DR-1097)
// =============================================================================
// The twenty-first read added an `r=` column to cams-diag's live-ends printer.
// Its Python sits inside `python3 -c '...'` in a shell function, and the new
// lines said "the app's own reconnect": the apostrophe closed the shell string,
// and cams-diag 39700246848 died at `sh: line 170: syntax error near unexpected
// token '('` before printing a single end. The Python alone ran clean, which is
// how it shipped: it was tested outside the quoting it lives in. The printer sits
// inside the heredoc the runner hands the NAS over SSH, so no `sh -n` on the step
// ever reads it.
//
// So these cases RUN the workflow's own live_ends() under sh, with curl and
// scrub stubbed, exactly as the NAS shell runs it.
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const WF = readFileSync(join(HERE, '../../../.github/workflows/cams-diag.yml'), 'utf8');

/** The live_ends() function as the shell sees it: from its line to its closing brace, de-indented. */
export function liveEndsFunction(workflow) {
  const lines = workflow.split('\n');
  const start = lines.findIndex((l) => /^\s*live_ends\(\) \{\s*$/.test(l));
  if (start < 0) throw new Error('live_ends() not found in cams-diag.yml');
  const indent = lines[start].match(/^\s*/)[0];
  const end = lines.findIndex((l, i) => i > start && l === `${indent}}`);
  if (end < 0) throw new Error('live_ends() has no closing brace at its own indent');
  return lines.slice(start, end + 1).map((l) => (l.startsWith(indent) ? l.slice(indent.length) : l)).join('\n');
}

function run(fn, health) {
  const dir = mkdtempSync(join(tmpdir(), 'cams-diag-'));
  writeFileSync(join(dir, 'health.json'), JSON.stringify(health));
  const script = `WTOK=x\ncurl() { cat "${join(dir, 'health.json')}"; }\nscrub() { cat; }\n${fn}\nlive_ends\n`;
  return spawnSync('sh', ['-c', script], { encoding: 'utf8' });
}

const now = Math.floor(Date.now() / 1000);
const end = (camera, s, r, ago) => ({ camera, s, kb: 100, why: 'viewer-left', ...(r === undefined ? {} : { r }), at: now - ago });

describe('cams-diag live_ends()', () => {
  it('parses as shell and prints each end with the app reconnect count', () => {
    const r = run(liveEndsFunction(WF), { live_ends: { by_why: { 'viewer-left': 2 }, ends: [end('805_floodlight_cam_-_west_sd', 7.1, 2, 10), end('great_room_sd', 0.2, 0, 20)] } });
    expect(r.stderr).toBe('');
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/by who ended it: viewer-left=2/);
    expect(r.stdout).toMatch(/reopened by the app itself: 1 of 2/);
    expect(r.stdout).toMatch(/805_floodlight_cam_-_west_sd\s+7\.1 s\s+100 KB\s+r=2\s+viewer-left/);
    expect(r.stdout).toMatch(/great_room_sd\s+0\.2 s\s+100 KB\s+r=0\s+viewer-left/);
  });

  it('an older forwarder that keeps no count prints r=- and no reopen line', () => {
    const r = run(liveEndsFunction(WF), { live_ends: { by_why: { 'viewer-left': 1 }, ends: [end('front_cam_sd', 0.2, undefined, 5)] } });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/front_cam_sd\s+0\.2 s\s+100 KB\s+r=-\s+viewer-left/);
    expect(r.stdout).not.toMatch(/reopened by the app itself/);
  });

  it('PROVEN TO CATCH: an apostrophe in the Python, the break that killed cams-diag 39700246848, fails the shell', () => {
    const broken = liveEndsFunction(WF).replace('reopened by the app itself', "reopened by the app's own reconnect");
    const r = run(broken, { live_ends: { by_why: {}, ends: [] } });
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/syntax error|unexpected/i);
  });
});
