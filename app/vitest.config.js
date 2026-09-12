// Vitest config — financial-accuracy audit Pass 2 (per docs/05-financial-os/CALC-INVENTORY.md).
// Tests live alongside source under src/__tests__/.
//
// We use jsdom (not node) because the calc-function imports transitively
// pull in supabase.js → AuthBanner.jsx, which touch `window.localStorage`
// at module load. The pure-math tests don't NEED a DOM, but the import
// chain breaks without one. A future refactor will extract the calc
// functions out of the MVP file entirely into a standalone module with
// zero React imports, at which point this can move back to environment:
// 'node' for faster startup.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.{js,jsx}'],
    environment: 'jsdom',
    globals: false,
    // Stub Supabase env so the suite runs on a clean checkout (CI, remote
    // sessions, new machines) where app/.env.local does not exist. Without
    // these, the import chain test -> financial-calcs -> MVP -> supabase.js
    // throws "supabaseUrl is required" at collection and zero tests run.
    // Real values from .env.local still win when present.
    //
    // WHY THE URL IS A LOOPBACK PORT AND NOT A HOSTNAME (P54, 2026-09-12).
    // The tests never reach Supabase on purpose — but the component trees
    // DO reach the client (a get_profile lookup on render), and whatever
    // this URL points at is what those calls actually dial. It used to be
    // https://test-stub.supabase.co: a host that does not resolve, so every
    // such call waited on a DNS FAILURE first. Measured on the full suite,
    // 936 files: 18 test files paid `getaddrinfo ENOTFOUND test-stub.supabase.co`
    // — ~93ms each idle here, and UNBOUNDED under load, because a resolver's
    // timeout is not ours to bound. That is what made tlc-onboarding-render
    // fail 11 tests at exactly ~5002ms in a loaded suite and pass alone in 1.7s.
    //
    // Port 1 on loopback has nothing listening, so the kernel refuses the
    // connection immediately: no resolver, no retry, no timeout to inherit.
    // Measured side by side: 93ms -> 0ms. The OUTCOME is identical — the call
    // fails and the code degrades exactly as before — only the wait is gone.
    // This is the class fix P54 dated; it needs no test to cooperate, which a
    // global fetch stub would have.
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:1',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'test-stub-anon-key',
    },
  },
});
