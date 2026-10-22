// =============================================================================
// No Node past its end of life, in CI or on the NAS (DR-1218)
// =============================================================================
// 2026-10-22: eight eMudhra intermediate CA keys were found recoverable.
// Browsers blocked them through their own revocation lists, but software that
// carries its own trust store keeps trusting them until that store is updated,
// and the fixed stores shipped in Node 22.23.4, 24.22.1 and 26.12.1. Node 20
// reached its end of life in April 2026 and gets no such fix. Thirteen
// workflows and the church runner still pinned it; this holds the line so a
// copied workflow cannot bring it back.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
// The oldest Node line still receiving security fixes.
const OLDEST_SUPPORTED = 22;

/** Every Node major a text pins: setup-node `node-version:` and `node:<n>` images. */
export function pinnedNodeMajors(text) {
  const out = [];
  for (const m of String(text).matchAll(/node-version:\s*['"]?(\d+)/g)) out.push(Number(m[1]));
  for (const m of String(text).matchAll(/\bimage:\s*node:(\d+)/g)) out.push(Number(m[1]));
  return out;
}

const files = () => {
  const wf = readdirSync(join(ROOT, '.github', 'workflows')).filter((f) => /\.ya?ml$/.test(f)).map((f) => join('.github', 'workflows', f));
  const compose = [];
  for (const d of readdirSync(join(ROOT, 'infra'), { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    for (const f of readdirSync(join(ROOT, 'infra', d.name))) if (/^docker-compose.*\.ya?ml$|^compose.*\.ya?ml$/.test(f)) compose.push(join('infra', d.name, f));
  }
  return [...wf, ...compose];
};

describe('no Node past its end of life', () => {
  it('PROVEN TO CATCH: the detector reads both ways a version is pinned', () => {
    expect(pinnedNodeMajors("        with:\n          node-version: '20'\n")).toEqual([20]);
    expect(pinnedNodeMajors('node-version: 20\n')).toEqual([20]);
    expect(pinnedNodeMajors('    image: node:20-alpine\n')).toEqual([20]);
    expect(pinnedNodeMajors("node-version: '22'\nimage: node:22-alpine")).toEqual([22, 22]);
  });
  it('every workflow and every NAS compose file pins Node 22 or newer', () => {
    const old = [];
    let seen = 0;
    for (const f of files()) {
      for (const major of pinnedNodeMajors(readFileSync(join(ROOT, f), 'utf8'))) {
        seen += 1;
        if (major < OLDEST_SUPPORTED) old.push(`${f}: Node ${major}`);
      }
    }
    expect(seen, 'a low count means the scan broke').toBeGreaterThan(30);
    expect(old).toEqual([]);
  });
});
