import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base set so built assets resolve under the Synology Web Station alias portal
// at /poetech-app/ on the shared QuickConnect URL.
export default defineConfig({
  base: '/poetech-app/',
  plugins: [react()],
});
