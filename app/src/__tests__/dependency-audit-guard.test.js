// =============================================================================
// dependency-audit-guard — proven to catch (DR-1330 D3, DR-0076 §3): a prod
// high with no entry, a dated entry past its date, an entry with no why, and a
// bare pip install each REQUIRE a finding; the allowlisted, dated, pinned case
// passes. The live allowlist is checked for shape and for dates in the future
// of this record.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { judge, findingsOf, unpinnedPipInstalls } from '../../../scripts/dependency-audit-guard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const LIVE = JSON.parse(readFileSync(join(ROOT, 'scripts/dependency-audit-allowlist.json'), 'utf8')).entries;

const report = (vulns) => ({ vulnerabilities: vulns, metadata: { vulnerabilities: {} } });
const high = (name, extra = {}) => ({ name, severity: 'high', isDirect: true, fixAvailable: false, via: [], ...extra });
const moderate = (name) => ({ name, severity: 'moderate', isDirect: false, fixAvailable: true, via: [] });

describe('dependency-audit-guard: proven to catch', () => {
  it('passes a prod high that is allowlisted with a why and a future date, and counts a moderate', () => {
    const r = judge({
      prod: report({ xlsx: high('xlsx') }),
      all: report({ xlsx: high('xlsx'), glob: moderate('glob') }),
      allowlist: [{ name: 'xlsx', scope: 'prod', why: 'no fix', reReview: '2026-12-05' }],
      today: '2026-11-05',
    });
    expect(r.failures).toEqual([]);
    expect(r.counted.join('\n')).toMatch(/dev moderate glob/);
    expect(r.counted.join('\n')).toMatch(/prod high xlsx .* deferred/);
  });
  it('fails a prod high with no allowlist entry', () => {
    const r = judge({ prod: report({ xlsx: high('xlsx') }), all: report({ xlsx: high('xlsx') }), allowlist: [], today: '2026-11-05' });
    expect(r.failures[0]).toMatch(/prod high xlsx .* not in the allowlist/);
  });
  it('fails a dev critical with no allowlist entry', () => {
    const r = judge({ prod: report({}), all: report({ vitest: { ...high('vitest'), severity: 'critical' } }), allowlist: [], today: '2026-11-05' });
    expect(r.failures[0]).toMatch(/dev critical vitest/);
  });
  it('fails an entry past its date, and one without a why', () => {
    const late = judge({
      prod: report({ xlsx: high('xlsx') }),
      all: report({ xlsx: high('xlsx') }),
      allowlist: [{ name: 'xlsx', why: 'x', reReview: '2026-11-01' }],
      today: '2026-11-05',
    });
    expect(late.failures[0]).toMatch(/passed its re-review date 2026-11-01/);
    const bare = judge({ prod: report({}), all: report({}), allowlist: [{ name: 'xlsx', reReview: '2026-12-05' }], today: '2026-11-05' });
    expect(bare.failures[0]).toMatch(/no why or no reReview/);
  });
  it('fails an entry whose scope does not match where the finding is', () => {
    const r = judge({
      prod: report({ xlsx: high('xlsx') }),
      all: report({ xlsx: high('xlsx') }),
      allowlist: [{ name: 'xlsx', scope: 'dev', why: 'x', reReview: '2026-12-05' }],
      today: '2026-11-05',
    });
    expect(r.failures[0]).toMatch(/allowlisted as dev, found in prod/);
  });
  it('reads fix availability the way npm reports it', () => {
    const f = findingsOf(report({ a: high('a'), b: moderate('b'), c: { ...high('c'), fixAvailable: { name: 'c', version: '9.0.0', isSemVerMajor: true } } }));
    expect(f.map((x) => x.fix)).toEqual(['none', 'patch', 'c@9.0.0 (major)']);
  });
  it('fails a bare pip install in a workflow and passes the two pinned shapes', () => {
    const wf = {
      'a.yml': '      run: pip install yt-dlp\n',
      'b.yml': '      run: pip install "$(grep \'^pillow==\' infra/requirements-ci.txt)"\n',
      'c.yml': '      run: python3 -m pip install -r infra/requirements-ci.txt\n',
      'd.yml': '      # pip install nothing, a comment\n      run: pip install pip-audit==2.10.1\n',
    };
    const u = unpinnedPipInstalls(wf);
    expect(u).toEqual(['a.yml:1: run: pip install yt-dlp']);
  });
});

describe('dependency-audit-guard: the live allowlist', () => {
  it('every entry carries a name, a scope, a why and a date after this record', () => {
    expect(LIVE.length).toBeGreaterThan(0);
    for (const e of LIVE) {
      expect(e.name, 'name').toBeTruthy();
      expect(['prod', 'dev']).toContain(e.scope);
      expect(e.why.length, `${e.name} why`).toBeGreaterThan(20);
      expect(e.reReview > '2026-11-05', `${e.name} reReview ${e.reReview}`).toBe(true);
    }
  });
  it('every workflow pip install is pinned through infra/requirements-ci.txt', () => {
    const { readdirSync } = require('node:fs');
    const dir = join(ROOT, '.github/workflows');
    const wf = Object.fromEntries(
      readdirSync(dir)
        .filter((f) => f.endsWith('.yml'))
        .map((f) => [f, readFileSync(join(dir, f), 'utf8')])
    );
    expect(unpinnedPipInstalls(wf)).toEqual([]);
  });
});
