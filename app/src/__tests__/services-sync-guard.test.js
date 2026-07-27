// @vitest-environment node
//
// services-sync-guard — the self-deploy manifest cannot rot (DR-0236/DR-0076).
// Merge-is-the-deploy only works if what the manifest points at is REAL: every
// enabled service's installer exists, every registry loop's script exists, and
// every loop carries its brake fields (a missing cap/timeout is a missing
// brake — no-go, per the nas-loops contract). Proven-to-catch: the synthetic
// cases fire each failure class the guard exists to stop.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const LOOPS_DIR = join(ROOT, 'infra/nas-loops');

// The pure checks (exported shape kept local — this guard is the only consumer).
export function manifestProblems(doc, fileExists) {
  const problems = [];
  for (const svc of (doc && doc.services) || []) {
    if (!svc.name) problems.push('service-missing-name');
    if (!svc.enabled) continue;
    if (!svc.install) problems.push(`${svc.name}:missing-install-path`);
    else if (!fileExists(svc.install)) problems.push(`${svc.name}:installer-not-found:${svc.install}`);
  }
  return problems;
}

export function registryProblems(doc, fileExists) {
  const problems = [];
  for (const loop of (doc && doc.loops) || []) {
    const name = loop.name || 'unnamed';
    if (!loop.script) problems.push(`${name}:missing-script`);
    else if (!fileExists(`loops/${loop.script}`)) problems.push(`${name}:script-not-found:${loop.script}`);
    if (!Number.isFinite(loop.max_calls_per_day) || loop.max_calls_per_day <= 0) problems.push(`${name}:missing-brake:max_calls_per_day`);
    if (!Number.isFinite(loop.timeout_seconds) || loop.timeout_seconds <= 0) problems.push(`${name}:missing-brake:timeout_seconds`);
    if (loop.kind !== 'deterministic' && loop.kind !== 'ai') problems.push(`${name}:unknown-kind`);
  }
  return problems;
}

describe('proven-to-catch — the guard flags each rot class', () => {
  it('CATCHES an enabled service whose installer does not exist', () => {
    const doc = { services: [{ name: 'ghost', enabled: true, install: 'infra/nope/install.sh' }] };
    expect(manifestProblems(doc, () => false)).toEqual(['ghost:installer-not-found:infra/nope/install.sh']);
  });
  it('a disabled service with a missing installer is NOT a failure (committed off)', () => {
    const doc = { services: [{ name: 'parked', enabled: false, install: 'infra/nope/install.sh' }] };
    expect(manifestProblems(doc, () => false)).toEqual([]);
  });
  it('CATCHES a registry loop without its brake fields', () => {
    const doc = { loops: [{ name: 'brakeless', kind: 'deterministic', script: 'x.sh' }] };
    const problems = registryProblems(doc, () => true);
    expect(problems).toContain('brakeless:missing-brake:max_calls_per_day');
    expect(problems).toContain('brakeless:missing-brake:timeout_seconds');
  });
  it('CATCHES a registry loop whose script file is missing', () => {
    const doc = { loops: [{ name: 'ghost', kind: 'deterministic', script: 'gone.sh', max_calls_per_day: 1, timeout_seconds: 1 }] };
    expect(registryProblems(doc, () => false)).toEqual(['ghost:script-not-found:gone.sh']);
  });
});

describe('the REAL manifest + registry hold', () => {
  const fileExists = (rel) => existsSync(join(rel.startsWith('loops/') ? LOOPS_DIR : ROOT, rel));
  it('services.json parses and every enabled installer exists on disk', () => {
    const doc = JSON.parse(readFileSync(join(LOOPS_DIR, 'services.json'), 'utf-8'));
    expect(doc.services.length).toBeGreaterThan(0);
    expect(manifestProblems(doc, (rel) => existsSync(join(ROOT, rel)))).toEqual([]);
  });
  it('registry.json parses, every loop script exists, every loop carries its brakes', () => {
    const doc = JSON.parse(readFileSync(join(LOOPS_DIR, 'registry.json'), 'utf-8'));
    expect(registryProblems(doc, fileExists)).toEqual([]);
    const names = doc.loops.map((l) => l.name);
    expect(names).toContain('scribe-transcribe');
    expect(names).toContain('services-sync');
  });
});
