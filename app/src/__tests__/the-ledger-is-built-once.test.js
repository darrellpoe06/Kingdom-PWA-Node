// @vitest-environment node
// =============================================================================
// The build-time manifests are pasted once, never at every use (DR-1214)
// =============================================================================
// Measured 2026-10-22 on a real build of main: the 2.41 MB decision ledger was
// pasted six times into the shell's chunk (14.5 MB of 24 MB), because a Vite
// `define` pastes its value at every place its name is written, and thirteen
// files write `__DR_LEDGER__`. Every new decision record grew the chunk six
// times over, until #2401 (one record) crossed the 24 MiB asset limit. Held
// once in build-manifests.js, its own chunk, the shell measured 2.45 MiB.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..');
const NAMES = ['GOVERNANCE_QUEUE', 'DR_LEDGER', 'DR_PRINCIPLES', 'QUALITY_PROOF', 'INTERCONNECT_LOOPS', 'CONFLICT_LOOP', 'UIUX_REVIEWS', 'TEST_CENSUS', 'LESSONS_PRINCIPLES'];
const config = readFileSync(join(SRC, '..', 'vite.config.js'), 'utf8');

function files(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === '__tests__' ? [] : files(p);
    return /\.(js|jsx)$/.test(n) ? [p] : [];
  });
}
// A file READS a manifest when its code (not a comment) writes `typeof __NAME__`.
const readers = files(SRC).filter((p) => {
  const code = readFileSync(p, 'utf8').split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
  return NAMES.some((n) => code.includes(`typeof __${n}__`));
});

/** The rule, as a function, so the test can prove it catches a break. */
export function auditDefines(cfg) {
  const problems = [];
  for (const n of NAMES) {
    if (!new RegExp(`__${n}__: 'globalThis\\.__PT_${n}',`).test(cfg)) problems.push(`__${n}__ is not a reference to globalThis.__PT_${n}`);
    if (new RegExp(`__${n}__: JSON\\.stringify\\(`).test(cfg)) problems.push(`__${n}__ pastes its JSON at every use`);
    if (!new RegExp(`__${n}_DATA__: JSON\\.stringify\\(`).test(cfg)) problems.push(`__${n}_DATA__ is missing`);
  }
  if (!/build-manifests\\\.js\$\/\.test\(id\)\) return 'build-manifests';/.test(cfg)) problems.push('build-manifests.js has no chunk of its own');
  return problems;
}

describe('each manifest is pasted once', () => {
  it('every name the app reads is a reference to one global; the JSON lives in build-manifests.js alone', () => {
    expect(auditDefines(config)).toEqual([]);
    const mod = readFileSync(join(SRC, 'lib', 'build-manifests.js'), 'utf8');
    for (const n of NAMES) expect(mod, n).toContain(`globalThis.__PT_${n} = __${n}_DATA__;`);
  });
  it('PROVEN TO CATCH: a name defined as its JSON again (the shape that pasted the ledger six times)', () => {
    const broken = config.replace("__DR_LEDGER__: 'globalThis.__PT_DR_LEDGER',", '__DR_LEDGER__: JSON.stringify(decisionLedger),');
    expect(broken).not.toBe(config);
    expect(auditDefines(broken)).toEqual(expect.arrayContaining(['__DR_LEDGER__ is not a reference to globalThis.__PT_DR_LEDGER', '__DR_LEDGER__ pastes its JSON at every use']));
  });
});

describe('every reader loads the manifests before it reads them', () => {
  it('finds the readers (the shell, the Ops surfaces, feedback-sync)', () => {
    expect(readers.length).toBeGreaterThanOrEqual(14);
  });
  it('each reader imports build-manifests.js as its first import', () => {
    const bad = readers.filter((p) => {
      const first = readFileSync(p, 'utf8').split('\n').find((l) => l.startsWith('import '));
      return !/^import '(\.\/|\.\.\/lib\/)build-manifests\.js';/.test(first || '');
    }).map((p) => relative(SRC, p));
    expect(bad).toEqual([]);
  });
  it('PROVEN TO CATCH: a new reader that forgot the import', () => {
    const src = "import React from 'react';\nconst L = (typeof __DR_LEDGER__ !== 'undefined') ? __DR_LEDGER__ : null;";
    const first = src.split('\n').find((l) => l.startsWith('import '));
    expect(/^import '(\.\/|\.\.\/lib\/)build-manifests\.js';/.test(first)).toBe(false);
  });
});
