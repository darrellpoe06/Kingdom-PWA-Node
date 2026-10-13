// =============================================================================
// Asking the LIVE database about a function it was never hard-coded to name
// =============================================================================
// DR-0374, 2026-09-13. The definitions probe used to carry a hard-coded list of
// seven church and property functions. Asking the sovereign database about
// anything else meant editing the script -- which in practice meant nobody
// asked, and on 2026-09-13 that cost a real measurement: crm_capture_lead's
// pipeline allowlist was read off the HOSTED mirror and written up as the live
// state in a decision record that then merged.
//
// So `functions` is an argument now. It is also a string a caller supplies that
// ends up inside a SQL IN list on a database reached by ssh with admin
// credentials, which is exactly the shape that deserves a gate rather than a
// careful author. The decision was REJECT, not escape: a character class that
// cannot express a quote, a space, a semicolon or a comment marker leaves no
// string that closes the IN list.
//
// These tests RUN the real script rather than reading it. The validation sits
// ahead of the NAS_SSH_KEY check, so a rejected input is proved to touch no
// network at all.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const SCRIPT = path.resolve(__dirname, '../../../scripts/sovereign-read-over-tailnet.sh');
const raw = readFileSync(SCRIPT, 'utf8');
const code = raw.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');

// Run the real thing with NO ssh key in the environment. A rejected argument
// must fail before that is even looked at.
function run(functionsArg) {
  try {
    const stdout = execFileSync('bash', [SCRIPT, 'definitions', '30', functionsArg], {
      env: { PATH: process.env.PATH, HOME: process.env.HOME },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, out: stdout };
  } catch (e) {
    return { status: e.status, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

describe('a hostile functions argument is refused, not escaped', () => {
  const hostile = [
    ["closes the IN list and starts a statement", "x'); DROP TABLE crm_leads; --"],
    ["closes the quote alone", "crm_capture_lead'"],
    ["hides a second statement behind a semicolon", 'crm_capture_lead; SELECT 1'],
    ["smuggles a SQL comment marker", 'crm_capture_lead--'],
    ["uses whitespace to break the list", 'crm_capture_lead, pg_read_file'],
    ["tries a subquery", 'crm_capture_lead) OR (1=1'],
    ["tries a newline", 'crm_capture_lead\nSELECT 1'],
    ["is empty between commas", 'a,,b'],
    ["is just a comma", ','],
    ["uses uppercase, which the class does not allow", 'CRM_CAPTURE_LEAD'],
  ];
  for (const [why, arg] of hostile) {
    it(`rejects an argument that ${why}`, () => {
      const r = run(arg);
      expect(r.status, `"${arg}" was not rejected`).toBe(2);
      expect(r.out).toMatch(/functions must be comma-separated lowercase names/);
      // It never got as far as the network.
      expect(r.out).not.toMatch(/tailnet|ssh|NAS_SSH_KEY/i);
    });
  }

  it('a rejected argument reads nothing at all — no partial answer', () => {
    const r = run("bad';--");
    expect(r.out).toMatch(/nothing was read/);
    expect(r.out).not.toMatch(/---DEFINITIONS---|---MISSING---/);
  });
});

describe('a legitimate argument is accepted and reaches the query', () => {
  it('a single lowercase name passes validation (and then stops for want of a key)', () => {
    const r = run('crm_capture_lead');
    // Past the validator, into the honest "I could not ask" path.
    expect(r.out).not.toMatch(/functions must be comma-separated/);
    expect(r.out).toMatch(/NAS_SSH_KEY is not set|could not be asked/);
  });

  it('a comma-separated list passes too', () => {
    const r = run('crm_capture_lead,church_roll_read');
    expect(r.out).not.toMatch(/functions must be comma-separated/);
  });

  it('an omitted argument falls back to the standing list rather than reading everything', () => {
    expect(code).toMatch(/FUNCTIONS="\$DEFAULT_FUNCTIONS"/);
    expect(code).toMatch(/DEFAULT_FUNCTIONS='[a-z0-9_,]+'/);
    // The seven it has always asked about are still the default.
    for (const name of ['list_instance_members', 'church_roll_read', 'set_member_role']) {
      expect(code).toContain(name);
    }
  });
});

describe('the query is built only from the validated string', () => {
  it('the IN list is the derived variable, never the raw argument', () => {
    expect(code).toMatch(/AND p\.proname IN \(\$\{FUNC_IN\}\)/);
    expect(code).not.toMatch(/IN \(\$\{?FUNCTIONS\}?\)/);
  });

  it('validation happens before the value is ever used', () => {
    const guardAt = code.indexOf('functions must be comma-separated');
    const useAt = code.indexOf('FUNC_IN=');
    expect(guardAt).toBeGreaterThan(-1);
    expect(useAt).toBeGreaterThan(guardAt);
  });
});

describe('the answer says enough to be worth asking for', () => {
  it('reports md5 of the source, which is what proves hosted and sovereign agree', () => {
    expect(code).toMatch(/'source_md5',\s*md5\(p\.prosrc\)/);
  });

  it('names a function the database does NOT have, so silence never reads as fine', () => {
    expect(code).toContain('---MISSING---');
    expect(code).toMatch(/WHERE NOT EXISTS/);
  });

  it('still reads no user data in definitions mode', () => {
    const defBlock = code.slice(code.indexOf('---DEFINITIONS---'));
    expect(defBlock).not.toMatch(/feedback_text|display_name|FROM public\.feedback/);
  });
});
