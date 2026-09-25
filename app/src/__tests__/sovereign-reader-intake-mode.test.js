// =============================================================================
// sovereign-read's `intake` mode reads every note for the census, and prints
// none of them (DR-0625). The rows are data for scripts/intake-census.mjs on
// the runner; the log gets counts and short masked audit snippets only.
// Proven by RUNNING the cut the script uses on planted output, not by reading.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const raw = readFileSync(join(ROOT, 'scripts/sovereign-read-over-tailnet.sh'), 'utf8');
const code = raw.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
const intakeQuery = code.slice(code.indexOf('---INTAKE-JSON-BEGIN---'), code.indexOf('---INTAKE-JSON-END---'));

describe('what intake mode asks for', () => {
  it('is a mode the workflow offers and the script accepts', () => {
    expect(readFileSync(join(ROOT, '.github/workflows/sovereign-read.yml'), 'utf8')).toMatch(/options: \[feedback, definitions, tables, instances, intake\]/);
    expect(code).toMatch(/feedback\|definitions\|tables\|instances\|intake\) ;;/);
  });
  it('never selects the screenshot bytes, and withholds confidential rows in the query', () => {
    expect(intakeQuery).not.toMatch(/\bscreenshots?\b(?!_count)/);
    expect(intakeQuery).toMatch(/WHERE coalesce\(is_confidential, false\) = false/);
  });
});

describe('PROVEN TO CATCH: the rows are cut out before anything is printed (run, not read)', () => {
  // The exact two sed programs the script uses, executed.
  const extract = (s) => execFileSync('bash', ['-c', `printf '%s\\n' "$1" | sed -n '/^---INTAKE-JSON-BEGIN---$/,/^---INTAKE-JSON-END---$/p' | sed '1d;$d'`, 'bash', s]).toString();
  const cut = (s) => execFileSync('bash', ['-c', `printf '%s\\n' "$1" | sed '/^---INTAKE-JSON-BEGIN---$/,/^---INTAKE-JSON-END---$/d'`, 'bash', s]).toString();
  const planted = 'header\n---INTAKE-JSON-BEGIN---\n{"feedback":[{"feedback_text":"my private words"}]}\n---INTAKE-JSON-END---\nfooter';
  it('the census receives the rows', () => {
    expect(extract(planted).trim()).toBe('{"feedback":[{"feedback_text":"my private words"}]}');
  });
  it('the log does not', () => {
    const out = cut(planted);
    expect(out).not.toMatch(/private words/);
    expect(out).toMatch(/header/);
    expect(out).toMatch(/footer/);
  });
  it('the script uses exactly these programs', () => {
    expect(code).toContain(`sed -n '/^---INTAKE-JSON-BEGIN---$/,/^---INTAKE-JSON-END---$/p' | sed '1d;$d'`);
    expect(code).toContain(`sed '/^---INTAKE-JSON-BEGIN---$/,/^---INTAKE-JSON-END---$/d'`);
  });
});
