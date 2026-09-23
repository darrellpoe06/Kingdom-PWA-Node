#!/usr/bin/env node
/* global process, console */
// =============================================================================
// native/stage.mjs — stage ONE brand's local app for Capacitor (DR-0570)
// =============================================================================
// The web build (dist/) is published at the site root, with /poetech-app/
// rewritten onto it by _redirects. The native shell has no rewrite layer, so
// its bundle is built at base '/' (PT_NATIVE_SHELL=1, vite.config.js) and
// served from the device as-is. This script:
//
//   1. copies dist/ to native/www/<brand>/ (one copy — the APK is the bundle);
//   2. opens the brand's DOOR: if the brand starts anywhere but '/', the root
//      index.html gets a one-line script that sends the first load to the
//      brand's own served HTML (DR-0258) — named as a FILE, because
//      Capacitor's local server routes an extension-less path to the ROOT
//      index.html, never a folder's;
//   3. writes app/capacitor.config.json for `cap add android` / `cap sync`.
//
// Pure helpers are exported for the test; the CLI runs only under `isMain`.
// Usage (from app/):  node native/stage.mjs <brand> [--dist dist]
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const APP_ROOT = resolve(HERE, '..');

export function readBrands(file = join(HERE, 'brands.json')) {
  const raw = JSON.parse(readFileSync(file, 'utf8'));
  return raw.brands;
}

export function brandFor(key, brands = readBrands()) {
  return brands.find((b) => b.key === key) || null;
}

/** The path (no query) of the brand's start page, relative to dist. '/' → index.html. */
export function startFile(start) {
  const path = String(start || '/').split('?')[0];
  return path === '/' ? 'index.html' : path.replace(/^\//, '');
}

/** The door script for a root index.html. Empty for a brand that starts at '/'.
 *  Fires ONLY on the bare first load (root path, no query): any later reload
 *  with a query — the app's own navigation state — boots in place. */
export function doorScript(start) {
  const s = String(start || '/');
  if (s === '/') return '';
  const lit = JSON.stringify(s);
  return `<script>/* native shell door (DR-0570) */(function(){if(location.pathname==='/'&&!location.search)location.replace(${lit});})();</script>`;
}

/** Insert the door script right after <head>. Idempotent: a second call
 *  leaves one script, not two. */
export function injectDoor(html, start) {
  const script = doorScript(start);
  if (!script) return html;
  const clean = String(html).replace(/<script>\/\* native shell door \(DR-0570\) \*\/[\s\S]*?<\/script>/, '');
  const i = clean.indexOf('<head>');
  if (i < 0) throw new Error('stage: index.html has no <head>');
  return clean.slice(0, i + 6) + '\n    ' + script + clean.slice(i + 6);
}

/** The per-brand Capacitor config. CapacitorHttp ON is what lets the
 *  re-homed requests (src/lib/native-shell.js) leave without a browser
 *  origin check; https scheme keeps localStorage / IndexedDB on a secure
 *  origin like the web (the bridge key and the voice sample live there). */
export function capacitorConfigFor(brand) {
  return {
    appId: brand.appId,
    appName: brand.appName,
    webDir: `native/www/${brand.key}`,
    server: { androidScheme: 'https' },
    android: { allowMixedContent: false },
    plugins: { CapacitorHttp: { enabled: true } },
  };
}

export function stage(key, { dist = join(APP_ROOT, 'dist'), out = join(APP_ROOT, 'native', 'www'), brands = readBrands() } = {}) {
  const brand = brandFor(key, brands);
  if (!brand) throw new Error(`stage: unknown brand "${key}" — brands.json knows ${brands.map((b) => b.key).join(', ')}`);
  if (!existsSync(join(dist, 'index.html'))) throw new Error(`stage: no built app at ${dist} — run PT_NATIVE_SHELL=1 npm run build first`);
  const entry = join(dist, startFile(brand.start));
  if (!existsSync(entry)) throw new Error(`stage: ${brand.key} starts at ${brand.start} but ${entry} is not in the build`);

  const www = join(out, brand.key);
  rmSync(www, { recursive: true, force: true });
  mkdirSync(www, { recursive: true });
  cpSync(dist, www, { recursive: true });

  const indexPath = join(www, 'index.html');
  writeFileSync(indexPath, injectDoor(readFileSync(indexPath, 'utf8'), brand.start));

  const config = capacitorConfigFor(brand);
  writeFileSync(join(APP_ROOT, 'capacitor.config.json'), JSON.stringify(config, null, 2) + '\n');
  return { brand, www, config };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const key = args.find((a) => !a.startsWith('--'));
  const di = args.indexOf('--dist');
  const dist = di >= 0 ? resolve(args[di + 1]) : undefined;
  try {
    const { brand, www, config } = stage(key, dist ? { dist } : {});
    console.log(`staged ${brand.key} (${config.appId}) → ${www}; starts at ${brand.start}`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
