// =============================================================================
// install-health — prove the live site is INSTALLABLE as a PWA (DR-0076 rule 7)
// =============================================================================
// The gap this closes (2026-07-10, Darrell: "I can't download the PoeTech app —
// it should be one button"): boot-check proves the app BOOTS; site-health proves
// it's UP and FRESH; nothing ever asked the browser the question the install
// button lives or dies on — "does Chrome consider this page installable?"
// Chrome exposes its own verdict via the DevTools protocol
// (Page.getInstallabilityErrors): the exact, named reasons it refuses to offer
// the install prompt (bad manifest, unreachable icon, out-of-scope start_url…).
// This script loads the REAL url in headless Chrome and reports that verdict,
// plus a direct fetch of every install-critical artifact (manifest, each icon,
// sw.js) with status + content-type — so a failure names the broken link in
// the chain instead of "it doesn't work."
//
// Used by .github/workflows/install-health.yml and runnable locally:
//   node scripts/install-health.mjs https://poetech.us/poetech-app/
import { chromium } from 'playwright-core';

const url = process.argv[2] || 'https://poetech.us/poetech-app/';
const origin = new URL(url).origin;
// Name the target up front so a multi-door run (each brand door is its own
// installable app — DR-0125) reads clearly in the step summary.
console.log(`INSTALL-HEALTH target: ${url}`);

const launchOpts = process.env.PLAYWRIGHT_CHROMIUM_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH, headless: true }
  : { channel: 'chrome', headless: true };
const browser = await chromium.launch(launchOpts);
const page = await browser.newPage();

let bipFired = false;
await page.exposeFunction('__bipHit', () => { bipFired = true; });
await page.addInitScript(() => {
  window.addEventListener('beforeinstallprompt', () => window.__bipHit && window.__bipHit());
});

let failed = false;
const fail = (msg) => { failed = true; console.error(`INSTALL FAIL  ${msg}`); };
const ok = (msg) => console.log(`INSTALL OK    ${msg}`);

await page.goto(url, { waitUntil: 'load', timeout: 45000 });
// Give the manifest fetch + install-criteria evaluation a moment to settle.
await page.waitForTimeout(8000);

// 1. Chrome's own installability verdict — the ground truth for the prompt.
const cdp = await page.context().newCDPSession(page);
let verdict = null;
try {
  verdict = await cdp.send('Page.getInstallabilityErrors');
} catch (e) {
  console.log(`NOTE          Page.getInstallabilityErrors unavailable (${e.message}) — falling back to artifact checks only`);
}
// Errors caused by the PROBE's own environment, not the site: a fresh
// headless/automation profile reports `in-incognito`, which no real phone
// browsing poetech.us ever hits. Measured on run 29080848009 (2026-07-10):
// every site-side criterion passed and this was the sole error. Filtering it
// keeps the instrument honest instead of permanently red (anti-theater,
// DR-0076 rule 3 — a check that always fails is as meaningless as one that
// always passes).
const ENV_ARTIFACTS = new Set(['in-incognito']);
if (verdict) {
  const real = verdict.installabilityErrors.filter((e) => !ENV_ARTIFACTS.has(e.errorId));
  const skipped = verdict.installabilityErrors.filter((e) => ENV_ARTIFACTS.has(e.errorId));
  for (const err of skipped) console.log(`NOTE          Chrome reported "${err.errorId}" — an artifact of the headless probe context, not the site`);
  if (!real.length) {
    ok('Chrome reports ZERO site-side installability errors for this page');
  } else {
    for (const err of real) {
      const args = (err.errorArguments || []).map((a) => `${a.name}=${a.value}`).join(' ');
      fail(`Chrome installability error: ${err.errorId}${args ? ` (${args})` : ''}`);
    }
  }
}
console.log(`NOTE          beforeinstallprompt fired in headless: ${bipFired} (headless Chrome often withholds it — informational only, the verdict above is the measure)`);

// 2. The manifest the page actually links, fetched as the browser would.
const manifestHref = await page.evaluate(() => {
  const l = document.querySelector('link[rel="manifest"]');
  return l ? l.href : null;
});
if (!manifestHref) {
  fail('page has NO <link rel="manifest"> in the served DOM');
} else {
  const res = await page.request.get(manifestHref);
  const ct = res.headers()['content-type'] || 'none';
  if (!res.ok()) {
    fail(`manifest ${manifestHref} -> HTTP ${res.status()}`);
  } else {
    ok(`manifest ${manifestHref} -> ${res.status()} (${ct})`);
    let manifest = null;
    try { manifest = JSON.parse(await res.text()); } catch (e) { fail(`manifest is not valid JSON: ${e.message}`); }
    if (manifest) {
      // Scope sanity: the page and start_url must live inside scope.
      const scope = new URL(manifest.scope || '.', manifestHref).href;
      const start = new URL(manifest.start_url || '.', manifestHref).href;
      const pageUrl = page.url();
      if (!pageUrl.startsWith(scope)) fail(`page ${pageUrl} is OUTSIDE manifest scope ${scope}`);
      else ok(`page is inside scope ${scope}`);
      if (!start.startsWith(scope)) fail(`start_url ${start} is OUTSIDE scope ${scope}`);
      const startRes = await page.request.get(start, { maxRedirects: 0 }).catch(() => null);
      if (!startRes) fail(`start_url ${start} did not answer`);
      else if (startRes.status() >= 300 && startRes.status() < 400) fail(`start_url ${start} REDIRECTS (${startRes.status()} -> ${startRes.headers().location}) — Chrome treats a redirecting start_url as non-installable`);
      else if (!startRes.ok()) fail(`start_url ${start} -> HTTP ${startRes.status()}`);
      else ok(`start_url ${start} -> ${startRes.status()}`);
      // Every icon must be fetchable with an image content-type.
      for (const icon of manifest.icons || []) {
        const iconUrl = new URL(icon.src, manifestHref).href;
        const ir = await page.request.get(iconUrl).catch(() => null);
        const ict = ir ? (ir.headers()['content-type'] || 'none') : 'none';
        if (!ir || !ir.ok()) fail(`icon ${iconUrl} -> HTTP ${ir ? ir.status() : 'no answer'} (${icon.sizes || '?'} ${icon.purpose || 'any'})`);
        else if (!ict.startsWith('image/')) fail(`icon ${iconUrl} served as "${ict}", not an image (${icon.sizes || '?'})`);
        else ok(`icon ${iconUrl} -> ${ir.status()} (${ict}, ${icon.sizes || '?'} ${icon.purpose || 'any'})`);
      }
      if (!(manifest.icons || []).some((i) => /192|any/.test(i.sizes || '') && (i.type || '').includes('png') || /\.png$/.test(i.src))) {
        console.log('NOTE          no obviously-PNG 192px icon matched by the quick scan — Chrome requires a 192px and 512px PNG; the verdict above is authoritative');
      }
    }
  }
}

// 3. The service worker: registered on the live page, and its file served.
const swState = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return 'unsupported';
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return 'none';
  const w = reg.active || reg.waiting || reg.installing;
  return `${w ? w.state : 'registered-empty'} scope=${reg.scope}`;
});
console.log(`NOTE          service worker on live page: ${swState}`);
for (const swPath of ['/sw.js', '/poetech-app/sw.js']) {
  const sr = await page.request.get(origin + swPath).catch(() => null);
  const sct = sr ? (sr.headers()['content-type'] || 'none') : 'none';
  if (!sr || !sr.ok()) fail(`${swPath} -> HTTP ${sr ? sr.status() : 'no answer'}`);
  else if (!/javascript|ecmascript/.test(sct)) fail(`${swPath} served as "${sct}", not JavaScript`);
  else ok(`${swPath} -> ${sr.status()} (${sct})`);
}

// 4. The naked domain lands inside scope (the 2026-07-07 lesson).
const rootRes = await page.request.get(origin + '/', { maxRedirects: 0 }).catch(() => null);
if (rootRes && rootRes.status() >= 300 && rootRes.status() < 400) {
  const loc = rootRes.headers().location || '';
  if (loc.includes('/poetech-app/')) ok(`root / -> ${rootRes.status()} into scope (${loc})`);
  else fail(`root / redirects OUT of scope: ${rootRes.status()} -> ${loc}`);
} else {
  console.log(`NOTE          root / -> ${rootRes ? rootRes.status() : 'no answer'} (no redirect)`);
}

await browser.close();
console.log(failed ? '\nINSTALL-HEALTH: FAILING — the named lines above are the broken links.' : '\nINSTALL-HEALTH: GREEN — the live site meets the install chain end-to-end.');
process.exit(failed ? 1 : 0);
