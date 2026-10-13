// place_hosted_key.sh — the hosted service key is PROVEN by hosted before it
// is written (2026-09-23). Four nas-storage-sync dispatches read a pasted
// value that was not a key of any family (57 chars, "cdn", a control byte,
// HTTP 400 from hosted over HTTP/1.1, curl 7.86 refusing to send it over
// HTTP/2); nothing at the keyboard had said so. These pins hold the guards
// that make the next paste tell the truth on the spot: strip what a terminal
// adds, name the family by prefix, refuse the publishable key, read the JWT's
// role and project, ask hosted to list its buckets, and write ONLY when a
// private bucket is listed. The value is never echoed.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');
const SCRIPT = join(ROOT, 'infra/nas-supabase/place_hosted_key.sh');
const README = join(ROOT, 'infra/nas-supabase/README.md');
const sh = readFileSync(SCRIPT, 'utf8');

describe('place_hosted_key.sh — a paste that is proven before it is placed', () => {
  it('exists and parses as bash', () => {
    expect(existsSync(SCRIPT)).toBe(true);
    expect(() => execFileSync('bash', ['-n', SCRIPT])).not.toThrow();
  });

  it('reads the paste silently and strips what a terminal adds (CR, LF, quotes, spaces, "Bearer ")', () => {
    expect(sh).toMatch(/read -r -s -p/);
    expect(sh).toMatch(/tr -d '\\r\\n\\t "'/);
    expect(sh).toMatch(/K=\$\{K#Bearer\}/);
  });

  it('names the family by prefix and refuses the publishable key and any non-key', () => {
    expect(sh).toMatch(/eyJ\*\)\s+FAMILY="legacy-jwt"/);
    expect(sh).toMatch(/sb_secret_\*\)\s+FAMILY="secret"/);
    expect(sh).toMatch(/sb_publishable_\*\)[^\n]*PUBLISHABLE[^\n]*Nothing written/);
    expect(sh).toMatch(/not a Supabase API key of any family[^\n]*Nothing written/);
  });

  it('reads a legacy JWT\'s role and project ref and refuses a non-service_role or foreign-project key', () => {
    expect(sh).toMatch(/role=service_role/);
    expect(sh).toMatch(/ref=\$EXPECTED_REF/);
    expect(sh).toMatch(/not the service_role key[^\n]*Nothing written/);
    expect(sh).toMatch(/different project[^\n]*Nothing written/);
  });

  it('asks hosted to list its buckets over HTTP/1.1 and writes only when a private bucket is listed', () => {
    expect(sh).toMatch(/--http1\.1/);
    expect(sh).toMatch(/\/storage\/v1\/bucket/);
    expect(sh).toMatch(/if \[ "\$\{1:-\}" != "listed" \] \|\| \[ "\$\{3:-0\}" -lt 1 \]/);
    expect(sh).toMatch(/did not list a private bucket[^\n]*Nothing written/);
    // The write comes AFTER the hosted check in the file.
    expect(sh.indexOf('hosted answers:')).toBeLessThan(sh.indexOf("printf 'HOSTED_SERVICE_ROLE_KEY=%s\\n'"));
  });

  it('never echoes the value: no echo/printf of $K to the screen, only its length and prefix', () => {
    const screenLines = sh.split('\n').filter((l) => /^\s*echo /.test(l));
    for (const l of screenLines) {
      expect(l, l).not.toMatch(/\$K\b|\$\{K\}|\$RAW/);
    }
    expect(sh).toMatch(/LEN=\$\{#K\}/);
    expect(sh).toMatch(/PREFIX=\$\(printf '%\.3s' "\$K"\)/);
  });

  it('writes through a 0600 temp file and replaces the existing line rather than appending a second', () => {
    expect(sh).toMatch(/chmod 600 "\$TMP"/);
    expect(sh).toMatch(/startswith\("HOSTED_SERVICE_ROLE_KEY="\) and not done/);
    expect(sh).toMatch(/grep -c '\^HOSTED_SERVICE_ROLE_KEY='/);
  });

  it('the README points at the script, so the next placement is not a raw paste', () => {
    const readme = readFileSync(README, 'utf8');
    expect(readme).toMatch(/place_hosted_key\.sh/);
  });
});
