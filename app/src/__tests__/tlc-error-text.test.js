// @vitest-environment node
// Every TLC seam says a server's failure in words (DR-0342 sweep, 2026-09-10).
// Darrell's screen at 04:45 UTC: the Roster area printed a whole Cloudflare
// 502 page. Pins: the humanizer on that exact class of body; no TLC seam
// returns a bare error message any more.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { tlcError } from '../lib/tlc-error.js';
import { humanizeServerError } from '../lib/server-error-text.js';

const here = dirname(fileURLToPath(import.meta.url));
const src = (rel) => readFileSync(join(here, '..', rel), 'utf8');
const CF_502 = '<!DOCTYPE html> <!--[if lt IE 7]> <html class="no-js ie6 oldie" lang="en-US"> <![endif]--> <html class="no-js" lang="en-US"> <head> <title>poetech.us | 502: Bad gateway</title> <meta charset="UTF-8" /></head><body><h1>Bad gateway</h1></body></html>';

describe('a TLC seam’s failure, in words', () => {
  it('the Cloudflare 502 page becomes one sentence naming the office server and the title, with no markup', () => {
    const t = tlcError({ message: CF_502 });
    expect(t).toBe('Nothing was changed — the office server could not be reached (502: Bad gateway). Try again in a moment.');
    expect(t).not.toMatch(/[<>]/);
    expect(tlcError(new Error(CF_502), 'Nothing was read')).toMatch(/^Nothing was read — the office server/);
    expect(tlcError(null)).toBe('Nothing was changed — the server did not answer. Try again in a moment.');
    expect(tlcError({ message: 'permission denied for table tlc_roster' })).toBe('Nothing was changed — permission denied for table tlc_roster');
    // the church surfaces keep their own wording
    expect(humanizeServerError({ message: CF_502 })).toMatch(/the church server could not be reached/);
  });
  it('no TLC seam returns a bare error message any more', () => {
    for (const f of ['lib/tlc-roster.js', 'lib/tlc-onboarding-sync.js', 'lib/tlc-launch-sync.js', 'lib/tlc-assignments.js']) {
      const code = src(f);
      expect(code, f).toMatch(/import \{ tlcError \} from '\.\/tlc-error\.js';/);
      expect(code, f).not.toMatch(/\b(error|e)\.message\b/);
      expect(code.match(/tlcError\(/g).length, f).toBeGreaterThan(0);
    }
  });
});
