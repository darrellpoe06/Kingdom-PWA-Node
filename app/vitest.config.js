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
  },
});
