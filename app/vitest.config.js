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
    // Real values from .env.local still win when present; the calc tests
    // never touch the network — the client just has to construct.
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://test-stub.supabase.co',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'test-stub-anon-key',
    },
  },
});
