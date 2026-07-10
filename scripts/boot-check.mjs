// =============================================================================
// boot-check — prove the served app BOOTS in a real browser (DR-0139)
// =============================================================================
// The gap this closes (2026-07-10, live): the site-health probe curls the shell
// and its first asset — it never EXECUTES the JavaScript. The family photographed
// the app down (boot-fallback / error-boundary screens) while every probe and
// deploy run was green. "Intact" must mean "boots": this script loads the real
// URL in headless Chrome, waits for React to mount, and fails loudly if the page
// shows a recovery screen (or nothing) instead of the app.
//
// Used by .github/workflows/deploy-cloudflare-pages.yml (post-deploy verify job)
// and runnable locally: node scripts/boot-check.mjs <url> [url2 ...]
// Requires playwright-core; launches the runner's installed Chrome (channel) or
// PLAYWRIGHT_CHROMIUM_PATH when set (the sandbox's /opt/pw-browsers build).
import { chromium } from 'playwright-core';

// The app's own disclaimer bar — rendered by the mounted shell on every entry
// surface (signed-in or welcome). The recovery screens never contain it.
const MOUNT_MARKER = 'PROJECTIONS, NOT PROMISES';
// Recovery-screen headlines = the app did NOT boot.
const FAIL_MARKERS = ['Almost there — one more tap', 'Getting the latest version'];

const ATTEMPTS = 3;          // deploy propagation can take a beat; retry before failing
const RETRY_DELAY_MS = 20000;
const SETTLE_MS = 6000;      // give the monolith chunk time to evaluate + mount

async function checkOnce(browser, url) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 300)}`); });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(SETTLE_MS);
    const text = await page.evaluate(() => document.body.innerText || '');
    const failHit = FAIL_MARKERS.find((m) => text.includes(m));
    if (failHit) return { ok: false, why: `recovery screen shown ("${failHit}")`, errors };
    // Standalone boots (?moore=1, ?register=1, …) render their own surface, not
    // the app shell — for those, "no recovery screen + real content" is the bar.
    const standalone = url.includes('?');
    if (standalone) {
      if (text.trim().length < 400) return { ok: false, why: `standalone surface did not mount (body ${text.length} chars)`, errors };
      return { ok: true, errors };
    }
    if (!text.includes(MOUNT_MARKER)) {
      return { ok: false, why: `app did not mount (marker "${MOUNT_MARKER}" absent; body ${text.length} chars)`, errors };
    }
    return { ok: true, errors };
  } finally {
    await page.close().catch(() => {});
  }
}

const urls = process.argv.slice(2);
if (!urls.length) {
  console.error('usage: node scripts/boot-check.mjs <url> [url2 ...]');
  process.exit(2);
}

const launchOpts = process.env.PLAYWRIGHT_CHROMIUM_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH, headless: true }
  : { channel: 'chrome', headless: true };
const browser = await chromium.launch(launchOpts);

let failed = false;
for (const url of urls) {
  let result = null;
  for (let i = 1; i <= ATTEMPTS; i += 1) {
    result = await checkOnce(browser, url).catch((e) => ({ ok: false, why: `load failed: ${e.message}`, errors: [] }));
    if (result.ok) break;
    if (i < ATTEMPTS) {
      console.log(`RETRY ${url} (attempt ${i}/${ATTEMPTS} failed: ${result.why}) — waiting ${RETRY_DELAY_MS / 1000}s`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  if (result.ok) {
    console.log(`BOOT OK   ${url}`);
  } else {
    failed = true;
    console.error(`BOOT FAIL ${url} — ${result.why}`);
    for (const e of result.errors.slice(0, 8)) console.error(`  ${e}`);
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
