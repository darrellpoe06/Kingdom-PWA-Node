// @vitest-environment jsdom
// =============================================================================
// exposure-is-ranked-before-any-fix — the four elements, the report-only
// workflow, and the strip in the app (DR-1408)
// =============================================================================
// Darrell 2026-11-10: "workflows that make sure we are secure as we can without
// undermining our processes and conditions report before and location should be
// inside the PoeTech App space". Pinned here:
//   * the ranking uses all four elements, and severity alone never decides;
//   * unknown threat intelligence never ranks anything as safe;
//   * the workflow can only READ and REPORT (no fix, no PR, no push), and a
//     pull request never publishes;
//   * the app says each state as itself, and shows the conditions on screen.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rank, buildReport, networkReachable, advisoriesOf, TIERS } from '../../../scripts/exposure-report.mjs';
import { parseExposureBody, exposureVerdict, EXPOSURE_STALE_MS } from '../lib/exposure-report.js';
import ExposureStrip from '../components/ExposureStrip.jsx';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const today = '2026-11-10';
const NOW = Date.parse('2026-11-10T12:00:00Z');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const pkg = (name, severity, vector, ghsa, direct = true) => ({ name, severity, direct, fixAvailable: true, advisories: [{ ghsa, vector, severity }] });
const intel = {
  kev: new Set(['CVE-KEV']),
  cveOf: new Map([
    ['G-KEV', 'CVE-KEV'],
    ['G-QUIET', 'CVE-QUIET'],
    ['G-LIKELY', 'CVE-LIKELY'],
  ]),
  epss: new Map([
    ['CVE-KEV', 0.4],
    ['CVE-QUIET', 0.0004],
    ['CVE-LIKELY', 0.25],
  ]),
};
const NONE = { kev: null, cveOf: null, epss: null };

describe('the four elements decide the rank, not severity alone', () => {
  it('a shipped moderate that is exploited in the wild is Act now', () => {
    expect(rank(pkg('a', 'moderate', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N', 'G-KEV'), { scope: 'prod', intel, today }).tier).toBe('act-now');
  });
  it('a shipped finding likely to be exploited (EPSS 25%) is Act now', () => {
    const r = rank(pkg('b', 'low', null, 'G-LIKELY'), { scope: 'prod', intel, today });
    expect(r.tier).toBe('act-now');
    expect(r.elements.threat).toContain('EPSS 25.0%');
  });
  it('a critical in a build tool, with no exploitation, is only Watch', () => {
    expect(rank(pkg('c', 'critical', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N', 'G-QUIET'), { scope: 'dev', intel, today }).tier).toBe('watch');
  });
  it('PROVEN TO CATCH: a severity-only ranking would put the build-tool critical first', () => {
    const all = {
      vulnerabilities: {
        a: { severity: 'moderate', isDirect: true, via: [{ url: 'https://github.com/advisories/G-KEV', cvss: { vectorString: 'AV:N/PR:N/UI:N' } }] },
        c: { severity: 'critical', isDirect: true, via: [{ url: 'https://github.com/advisories/G-QUIET' }] },
      },
    };
    const prod = { vulnerabilities: { a: all.vulnerabilities.a } };
    const report = buildReport({ prod, all, allowlist: [], intel, today, readAt: 'x', sources: {} });
    const bySeverity = [...report.items].sort((x, y) => (x.severity === 'critical' ? -1 : 1) - (y.severity === 'critical' ? -1 : 1));
    expect(bySeverity[0].name).toBe('c');
    expect(report.items[0].name).toBe('a');
    expect(report.counts).toEqual({ 'act-now': 1, plan: 0, watch: 1 });
  });
  it('unknown threat intelligence never ranks anything as Watch (DR-0076)', () => {
    const shipped = rank(pkg('d', 'low', null, 'G-X'), { scope: 'prod', intel: NONE, today });
    const tool = rank(pkg('e', 'low', null, 'G-X'), { scope: 'dev', intel: NONE, today });
    expect([shipped.tier, tool.tier]).toEqual(['plan', 'plan']);
    expect(shipped.elements.threat).toMatch(/^unknown/);
  });
  it('an advisory with no CVE is unknown, never scored as zero (the runner found one on 2026-11-10)', () => {
    const r = rank(pkg('n', 'moderate', null, 'G-NOCVE'), { scope: 'dev', intel, today });
    expect(r.tier).toBe('plan');
    expect(r.elements.threat).toMatch(/^unknown: an advisory has no CVE/);
  });
  it('a package listed only for a vulnerable dependency says so, and prints no score of its own', () => {
    const r = rank({ name: 'p', severity: 'moderate', direct: true, fixAvailable: true, advisories: [] }, { scope: 'dev', intel, today });
    expect(r.elements.threat).toMatch(/^no advisory of its own/);
    expect(r.elements.threat).not.toMatch(/EPSS/);
    expect(r.tier).toBe('watch');
  });
  it('control validation names the dated decision that holds it, or says nothing does', () => {
    const allowlist = [
      { name: 'f', why: 'no fixed release', reReview: '2026-12-05' },
      { name: 'g', why: 'old', reReview: '2026-01-01' },
    ];
    expect(rank(pkg('f', 'high', null, 'G-QUIET'), { scope: 'prod', allowlist, intel, today }).elements.control).toContain(
      'held by a dated decision until 2026-12-05'
    );
    expect(rank(pkg('g', 'high', null, 'G-QUIET'), { scope: 'prod', allowlist, intel, today }).elements.control).toContain('lapsed');
    expect(rank(pkg('h', 'high', null, 'G-QUIET'), { scope: 'prod', allowlist, intel, today }).elements.control).toBe('nothing holds it yet');
  });
  it('exploitability reads the attack vector: network, no privileges, no user', () => {
    expect(networkReachable('CVSS:3.1/AV:N/AC:L/PR:N/UI:N')).toBe(true);
    expect(networkReachable('CVSS:3.1/AV:L/AC:L/PR:N/UI:R')).toBe(false);
    expect(networkReachable(null)).toBeNull();
    expect(TIERS).toEqual(['act-now', 'plan', 'watch']);
    expect(advisoriesOf({ vulnerabilities: { z: { severity: 'low', via: ['z-dep'] } } })[0].advisories).toEqual([]);
  });
});

describe('the workflow reads and reports; it never changes anything', () => {
  const wf = read('.github/workflows/exposure-report.yml');
  const script = read('scripts/exposure-report.mjs');
  it('has no fix, no PR, no push, no lockfile write', () => {
    for (const forbidden of [/npm audit fix/, /gh pr /, /git push/, /git commit/, /npm (ci|install)\b/]) {
      expect(wf).not.toMatch(forbidden);
    }
    expect(script).not.toMatch(/['"]fix['"]/);
    expect(script).not.toMatch(/package-lock\.json/);
  });
  it('can only read the code and write its own report issue, one run at a time, under a ceiling', () => {
    expect(wf).toMatch(/permissions:\n\s+contents: read\n\s+issues: write\n/);
    expect(wf).toMatch(/concurrency:\n\s+group: exposure-report\n\s+cancel-in-progress: false/);
    expect(wf).toMatch(/timeout-minutes: 10/);
  });
  it('a pull request proves the runner can read the feeds but never publishes', () => {
    expect(wf).toMatch(/if: github\.event_name != 'pull_request'/);
    expect(wf).toContain('--selftest');
    expect(wf).toContain('--fetch');
  });
  it('the workflow and the app name the same issue: the newest by creation, sorted explicitly (P62)', () => {
    expect(wf).toContain('--search "sort:created-desc"');
    expect(read('app/src/lib/exposure-report.js')).toContain('sort=created&direction=desc');
  });
});

const body = (doc) => `Exposure conditions\n\n\`\`\`json\n${JSON.stringify(doc)}\n\`\`\``;
const doc = (counts, extra = {}) => ({
  kind: 'exposure-report',
  readAt: '2026-11-09T14:17:00Z',
  sources: { kev: 'read 1400 entries' },
  counts,
  items: [],
  ...extra,
});

describe('the app says each state as itself', () => {
  it('no block, a broken block and the wrong document are each unreadable, never clear', () => {
    expect(parseExposureBody('just words')).toMatchObject({ ok: false });
    expect(parseExposureBody('```json\n{nope\n```').why).toMatch(/does not parse/);
    expect(parseExposureBody(body({ kind: 'fleet' })).why).toMatch(/not an exposure report/);
    expect(exposureVerdict(parseExposureBody('just words'), { now: NOW }).tone).toBe('unknown');
  });
  it('a stale report is unknown, not current', () => {
    const p = parseExposureBody(body(doc({ 'act-now': 0, plan: 0, watch: 3 }, { readAt: new Date(NOW - EXPOSURE_STALE_MS - 1000).toISOString() })));
    expect(exposureVerdict(p, { now: NOW })).toMatchObject({ tone: 'unknown' });
  });
  it('Act now is bad, Plan is a warning, only an all-Watch report reads clear', () => {
    expect(exposureVerdict(parseExposureBody(body(doc({ 'act-now': 1, plan: 1, watch: 2 }))), { now: NOW }).tone).toBe('bad');
    expect(exposureVerdict(parseExposureBody(body(doc({ 'act-now': 0, plan: 1, watch: 2 }))), { now: NOW }).tone).toBe('warn');
    expect(exposureVerdict(parseExposureBody(body(doc({ 'act-now': 0, plan: 0, watch: 2 }))), { now: NOW }).tone).toBe('ok');
  });
  it('a feed that could not be read keeps the verdict from reading clear', () => {
    const v = exposureVerdict(parseExposureBody(body(doc({ 'act-now': 0, plan: 0, watch: 2 }, { sources: { kev: 'unknown: 503' } }))), { now: NOW });
    expect(v.tone).toBe('warn');
    expect(v.line).toContain('could not read: kev');
  });
});

let container;
let root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});
async function mount(load) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(ExposureStrip, { load }));
  });
  for (let i = 0; i < 3; i += 1)
    await act(async () => {
      await Promise.resolve();
    });
}

describe('the conditions are on screen in the app', () => {
  it('lists Act now and Plan with all four elements, and counts Watch without listing it', async () => {
    const items = [
      {
        name: 'shipped-thing',
        scope: 'prod',
        severity: 'moderate',
        tier: 'act-now',
        elements: { threat: 'on the KEV list', asset: 'ships', exploit: 'reachable over the network', control: 'nothing holds it yet' },
      },
      { name: 'tool-thing', scope: 'dev', severity: 'critical', tier: 'watch', elements: { threat: 'not on KEV', asset: 'tool', exploit: 'x', control: 'y' } },
    ];
    const parsed = parseExposureBody(body(doc({ 'act-now': 1, plan: 0, watch: 1 }, { items })));
    await mount(async () => ({ ok: true, parsed, verdict: exposureVerdict(parsed, { now: NOW }), reportUrl: 'https://example.test/r' }));
    const strip = container.querySelector('[data-testid="exposure-strip"]');
    expect(strip.getAttribute('data-tone')).toBe('bad');
    expect(strip.textContent).toContain('Report only: this check changes nothing.');
    const listed = [...container.querySelectorAll('[data-testid="exposure-item"]')];
    expect(listed.map((li) => li.getAttribute('data-tier'))).toEqual(['act-now']);
    expect(listed[0].textContent).toContain('Threat: on the KEV list');
    expect(listed[0].textContent).toContain('Holds it: nothing holds it yet');
  });
  it('a failed read says so and lists nothing', async () => {
    await mount(async () => {
      throw new Error('offline');
    });
    const strip = container.querySelector('[data-testid="exposure-strip"]');
    expect(strip.getAttribute('data-tone')).toBe('unknown');
    expect(container.querySelector('[data-testid="exposure-items"]')).toBeNull();
  });
});
