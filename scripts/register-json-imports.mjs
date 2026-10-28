// A loader so plain `node` can import the app's modules, which import JSON
// without an attribute (vite allows it; node 22 does not). Used as
// `node --import ./scripts/register-json-imports.mjs <script>` by the lanes
// that read the catalog outside the app (DR-1261).
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register(new URL('./json-loader-hooks.mjs', import.meta.url), pathToFileURL('./'));
