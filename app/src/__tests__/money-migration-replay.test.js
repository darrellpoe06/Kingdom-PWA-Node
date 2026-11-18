// The staged FOS Money Phase 1.4 column migration is proven on a throwaway
// PostgreSQL inside the required test job, on every push: applied twice,
// existing values fingerprinted unchanged, five nullable columns added and
// NULL on every existing row, and the down file removes exactly those five.
// scripts/money-migration-replay.sh does the work; this test makes CI run it.
// A laptop without PostgreSQL may skip; CI never may, because a skip there
// would be a green check that measured nothing.
import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

function replay() {
  return new Promise((resolve) => {
    const child = spawn('bash', [join(root, 'scripts', 'money-migration-replay.sh')], { cwd: root });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('close', (code) => resolve({ code, out }));
  });
}

describe('the Phase 1.4 transaction columns are proven before anyone applies them', () => {
  it('applies twice, changes no existing value, and rolls back exactly', { timeout: 120000 }, async () => {
    const r = await replay();
    if (/no PostgreSQL server binaries/.test(r.out) && !process.env.CI) return;
    expect(r.out, r.out).toMatch(/rows unchanged; five nullable columns added, NULL on every existing row/);
    expect(r.out, r.out).toMatch(/down file removes exactly the five columns; existing values unchanged/);
    expect(r.out, r.out).toMatch(/replay: OK/);
    expect(r.code).toBe(0);
    console.log(`money migration replay ran: ${r.out.trim().split('\n').slice(-3).join(' · ')}`);
  });
});
