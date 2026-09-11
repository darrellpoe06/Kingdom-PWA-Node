// @vitest-environment node
//
// The supabase client module must be IMPORTABLE where there is no window.
//
// This failed a CI job with 929 test files passing, 13,754 tests passing and
// nothing red: three unhandled rejections, all
//
//     ReferenceError: window is not defined
//       at src/lib/supabase.js:46  ->  storage: window.localStorage
//
// The mechanism, worth writing down because the symptom pointed at the wrong
// file: a lazily-imported component's import promise resolved AFTER vitest had
// torn the jsdom environment down. By then `window` was gone, the module body
// ran anyway, and the rejection landed with no test to attach it to. The error
// named `church-learn-hostile-data.test.jsx`, which passes on its own and had
// nothing to do with it.
//
// Four other window reads in that same file are already guarded. Line 46 was
// the one that was not, and it was the one evaluated at import time — the only
// place where the guard actually matters.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('importable without a browser', () => {
  it('imports cleanly in a NODE environment — no window, no throw', async () => {
    expect(typeof globalThis.window).toBe('undefined');
    const mod = await import('../lib/supabase.js');
    expect(mod.supabase).toBeTruthy();
    expect(typeof mod.supabase.rpc).toBe('function');
  });

  it('the client OPTIONS — the only window read that runs at import — is guarded', () => {
    // Scope matters here. A window read INSIDE a function is fine: signInWithLink
    // reads window.location, and it is only ever called from a browser. The
    // defect class is a read that runs when the MODULE IS EVALUATED, because
    // that one fires on import no matter who is importing or why.
    const src = readFileSync(join(SRC, 'lib/supabase.js'), 'utf8');
    const options = src.slice(src.indexOf('createClient(SUPABASE_URL'), src.indexOf('detectSessionInUrl'));
    for (const line of options.split('\n')) {
      if (line.trim().startsWith('//') || !/\bwindow\s*\./.test(line)) continue;
      expect(/typeof window !== 'undefined'/.test(line), `unguarded at import time — ${line.trim()}`).toBe(true);
    }
    expect(options).toContain("typeof window !== 'undefined'");
  });
});

describe('proven-to-catch (anti-theater)', () => {
  it('CATCHES an unguarded window read', () => {
    const bad = '    storage: window.localStorage,';
    expect(/\bwindow\s*\./.test(bad)).toBe(true);
    expect(/typeof window !== 'undefined'/.test(bad)).toBe(false);
  });
});
