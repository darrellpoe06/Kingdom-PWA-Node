// A loader so plain `node` can import the app's modules, which import JSON
// without an attribute (vite allows it; node 22 does not). Used as
// `node --import ./scripts/register-json-imports.mjs <script>` by the lanes
// that read the catalog outside the app (DR-1266). It also preloads the
// per-file Living Lessons, which Vite reads with import.meta.glob (DR-1468).
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { preloadPerFileLessonsForNode } from './lib/living-lesson-files.mjs';

register(new URL('./json-loader-hooks.mjs', import.meta.url), pathToFileURL('./'));
await preloadPerFileLessonsForNode();
