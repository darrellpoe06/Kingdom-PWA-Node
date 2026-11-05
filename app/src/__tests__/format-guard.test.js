// =============================================================================
// format-guard (DR-1343, DR-1330 D10): a file born into the repo is formatted.
// The partition is pinned; Prettier is proven to catch on an unformatted
// fixture through the repo's own config; the Prettier pin and the ruff pin
// are where the guard expects them.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { partition } from '../../../scripts/format-guard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

describe('format-guard: which added files each tool judges', () => {
  it('sends app, functions, scripts and backend JavaScript to prettier and infra Python to ruff; skips vendor, dist and minified', () => {
    const { js, py } = partition([
      'app/src/lib/a.js', 'app/src/components/B.jsx', 'scripts/c.mjs', 'app/functions/api/d.js', 'backend/voice-worker/src/e.js',
      'infra/svc/server.py', 'infra/svc/vendor/x.py', 'app/dist/assets/f.js', 'app/src/lib/g.min.js', 'docs/h.md', 'app/src/lib/i.json',
    ]);
    expect(js).toEqual(['app/src/lib/a.js', 'app/src/components/B.jsx', 'scripts/c.mjs', 'app/functions/api/d.js', 'backend/voice-worker/src/e.js']);
    expect(py).toEqual(['infra/svc/server.py']);
  });
});

describe('format-guard: proven to catch', () => {
  it('prettier, through the repo config, refuses an unformatted file and accepts a formatted one', () => {
    const dir = mkdtempSync(join(tmpdir(), 'format-guard-'));
    try {
      const bad = join(dir, 'bad.js');
      writeFileSync(bad, 'const x = {a:1,b:2}\nfunction f( a,b ){return a+b}\n');
      const r1 = spawnSync('npx', ['--no-install', 'prettier', '--check', '--config', join(ROOT, '.prettierrc.json'), bad], { cwd: join(ROOT, 'app'), encoding: 'utf8' });
      expect(r1.status).not.toBe(0);
      const good = join(dir, 'good.js');
      writeFileSync(good, "const x = { a: 1, b: 2 };\nfunction f(a, b) {\n  return a + b;\n}\n");
      const r2 = spawnSync('npx', ['--no-install', 'prettier', '--check', '--config', join(ROOT, '.prettierrc.json'), good], { cwd: join(ROOT, 'app'), encoding: 'utf8' });
      expect(r2.status, r2.stdout + r2.stderr).toBe(0);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('the pins are where the guard expects them', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'app/package.json'), 'utf8'));
    expect(pkg.devDependencies.prettier).toMatch(/^\^?3\./);
    expect(readFileSync(join(ROOT, 'infra/requirements-ci.txt'), 'utf8')).toMatch(/^ruff==\d/m);
    expect(JSON.parse(readFileSync(join(ROOT, '.prettierrc.json'), 'utf8')).singleQuote).toBe(true);
  });
});
