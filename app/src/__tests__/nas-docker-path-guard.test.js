// nas-docker-path-guard.test.js — a NAS script never assumes docker is on the
// PATH (DR-0314's three-places rule: the Way, the GATE, the exception list).
//
// PROVEN-TO-CATCH is the point of this file. The guard is fed the EXACT source
// that broke db-migrate run 33695466498 — replay_migrations.sh's original two
// lines — and is required to flag it. A guard that has never been red is not
// evidence (DR-0076 §3).
import { describe, it, expect } from 'vitest';
import {
  scanSource, scanAll, stripComments, shellSources, PATH_IS_FINE,
} from '../../../scripts/nas-docker-path-guard.mjs';

// Verbatim from infra/nas-supabase/replay_migrations.sh at commit e4982c6 —
// the code that made the replay exit 1 with "sudo: docker: command not found"
// before a single migration ran.
const THE_REAL_DEFECT = `set -e
DOCKER="docker"
docker ps >/dev/null 2>&1 || DOCKER="sudo -n docker"
`;

describe('nas-docker-path-guard: proven-to-catch on the real defect', () => {
  it('flags the exact two lines that broke the sovereign replay lane', () => {
    const findings = scanSource('infra/nas-supabase/replay_migrations.sh.fixture', THE_REAL_DEFECT);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].message).toMatch(/assumes it is on the PATH/);
  });

  it('flags the probe-and-fallback shape too — both halves were unreachable', () => {
    const wrapper = 'if ! docker ps >/dev/null 2>&1 && sudo -n docker ps >/dev/null 2>&1; then DOCKER="sudo -n docker"; fi';
    expect(scanSource('a.sh', wrapper).length).toBeGreaterThan(0);
  });

  it('accepts every RESOLVED form, so the fix is what turns it green', () => {
    const resolved = [
      'DOCKER_BIN=$(command -v docker 2>/dev/null || true)',
      '"$DOCKER_BIN" ps >/dev/null 2>&1 || DOCKER="sudo -n $DOCKER_BIN"',
      '/usr/local/bin/docker exec n8n n8n list:workflow',
      'exec $DOCKER run --rm python:3.12-slim sh -c "true"',
      'if [ -x /usr/bin/docker ]; then DOCKER_BIN=/usr/bin/docker; fi',
    ].join('\n');
    expect(scanSource('a.sh', resolved)).toEqual([]);
  });
});

describe('nas-docker-path-guard: it does not fire where it should not', () => {
  it('ignores docker mentioned in prose — noise is how a guard gets deleted', () => {
    const commented = [
      '# slow sibling (docker pulls, the choir-dates drain) can never starve it',
      'echo "hello"  # docker ps would be wrong here',
    ].join('\n');
    expect(scanSource('a.sh', commented)).toEqual([]);
  });

  it('strips only comments, never a # inside quotes', () => {
    expect(stripComments('echo "a # b"')).toBe('echo "a # b"');
    // The cut happens at the '#'; whatever whitespace preceded it is not
    // meaningful to the scan, so the assertion is on the content.
    expect(stripComments('echo hi # trailing').trimEnd()).toBe('echo hi');
    expect(stripComments('   # whole line')).toBe('');
  });

  it('honors the named exception list, and every entry states its reason', () => {
    for (const [file, reason] of Object.entries(PATH_IS_FINE)) {
      expect(file, 'exception key is a repo-relative path').toMatch(/\.sh$/);
      expect(String(reason).length, `${file} must state WHY`).toBeGreaterThan(40);
    }
  });
});

describe('nas-docker-path-guard: the live tree is clean', () => {
  it('scans real shell sources (the guard reads the repo, not a fixture)', () => {
    expect(shellSources().length).toBeGreaterThan(10);
  });

  it('no shell script under infra/ or scripts/ assumes docker is on the PATH', () => {
    const findings = scanAll();
    expect(findings.map((f) => f.message).join('\n')).toBe('');
  });
});
