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

// A healthy front door renders ONE of these (incident #715 taught us the hard
// way that production shows the ACCESS GATE to a fresh visitor, not the
// marketing welcome — the gate IS a healthy mount):
//   - the disclaimer bar (signed-in and welcome views)
//   - the profile-creation / sign-in wall (fresh visitor on production)
const MOUNT_MARKERS = ['PROJECTIONS, NOT PROMISES', 'Create your profile', 'SIGNED IN AS'];
// Recovery-screen headlines = the app did NOT boot.
const FAIL_MARKERS = ['Almost there — one more tap', 'Getting the latest version'];

// The propagation gate in deploy-cloudflare-pages.yml already waits for every
// boot chunk to serve as JavaScript before this runs, so a failure here is
// meant to be real. These retries are the last cushion for edge-cache lag on a
// URL the gate didn't name (a deep-link's own chunk): a generous budget keeps a
// transient miss from filing a bogus incident + phone push.
const ATTEMPTS = 5;
const RETRY_DELAY_MS = 25000;
// The app HEALS ITSELF by navigating (the stale-build ladder: reload, then
// cache-clear + cache-busted fresh URL — DR-0137/DR-0145). Right after a deploy
// the edge can still serve the previous index for a few minutes, so the ladder
// fires exactly while this check watches — and a judge that dies on "Execution
// context was destroyed by a navigation" FAILS the very behavior we shipped
// (the 10:04Z run after #724: pages.dev green, every poetech.us URL killed
// mid-heal). Follow the ladder's navigations, bounded, and judge the page it
// LANDS on: a mounted app after a self-heal is BOOT OK; the manual recovery
// screen is still an honest FAIL. A ladder that never converges runs out of
// follows and fails loudly.
const NAV_FOLLOWS = 4;
const isNavTornDown = (e) => /Execution context was destroyed|frame was detached|Target closed|navigation/i
  .test(String((e && e.message) || e || ''));
// How long a cold boot may take before we call it failed: the monolith is ~3.2MB
// and the shell makes real auth roundtrips before first paint. A fixed short
// settle read "slow" as "down" (the 04:51Z f41e619 run — the serve was healthy,
// the instrument was impatient). We now WAIT FOR the mount/fail marker.
const MOUNT_TIMEOUT_MS = 30000;

async function checkOnce(browser, url) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 300)}`); });
  // Name the exact failing file (issue #715: "module answered as text/html"
  // told us the class but not WHICH asset — the fix hunt needs the URL).
  page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()} — ${r.failure()?.errorText}`));
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`);
    else if (/\/assets\/.*\.js/.test(r.url()) && !(r.headers()['content-type'] || '').includes('javascript')) {
      errors.push(`wrong mime (${r.headers()['content-type'] || 'none'}): ${r.url()}`);
    }
  });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    // Standalone boots (?moore=1, ?view=church, …) render their own surface OR —
    // for a fresh signed-out visitor deep-linking into a gated tab — the ACCESS
    // GATE. The gate IS a healthy mount (incident #715's lesson; the ?view=church
    // first run re-taught it at 08:09Z: the app mounted the profile gate
    // perfectly and the >=400-chars-only bar called it a failure). So: a mount
    // marker OR real content passes; only the recovery screen / a thin blank fails.
    const standalone = url.includes('?');
    // Judge in a follow-the-heal loop: wait until the page RESOLVES — mounted,
    // recovery screen, or real content — instead of judging at a fixed instant
    // (slow is not down), and when the app's own ladder navigates mid-judgment,
    // settle on the new document and judge THAT (healed is not down either).
    for (let follow = 0; ; follow += 1) {
      try {
        await page.waitForFunction(
          ({ mounts, fails, alone }) => {
            const t = document.body ? document.body.innerText || '' : '';
            if (fails.some((m) => t.includes(m))) return true;
            if (mounts.some((m) => t.includes(m))) return true;
            return alone ? t.trim().length >= 400 : false;
          },
          { mounts: MOUNT_MARKERS, fails: FAIL_MARKERS, alone: standalone },
          { timeout: MOUNT_TIMEOUT_MS },
        );
      } catch (e) {
        if (isNavTornDown(e) && follow < NAV_FOLLOWS) {
          await page.waitForLoadState('domcontentloaded', { timeout: 45000 }).catch(() => {});
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        // A plain timeout falls through — judged below on the final state.
      }
      let text;
      try {
        text = await page.evaluate(() => document.body.innerText || '');
      } catch (e) {
        if (isNavTornDown(e) && follow < NAV_FOLLOWS) {
          await page.waitForLoadState('domcontentloaded', { timeout: 45000 }).catch(() => {});
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        throw e;
      }
      const failHit = FAIL_MARKERS.find((m) => text.includes(m));
      if (failHit) return { ok: false, why: `recovery screen shown ("${failHit}")`, errors };
      if (standalone) {
        if (!MOUNT_MARKERS.some((m) => text.includes(m)) && text.trim().length < 400) {
          return { ok: false, why: `standalone surface did not mount (no gate/mount marker; body ${text.length} chars): "${text.trim().slice(0, 200)}"`, errors };
        }
        return { ok: true, errors };
      }
      if (!MOUNT_MARKERS.some((m) => text.includes(m))) {
        return { ok: false, why: `app did not mount within ${MOUNT_TIMEOUT_MS / 1000}s (no mount marker; body ${text.length} chars): "${text.trim().slice(0, 200)}"`, errors };
      }
      // `await` is load-bearing: a bare `return` would let this function's
      // finally-block close the page while the controlled pass still runs.
      return await swControlledPass(page, url, errors);
    }
  } finally {
    await page.close().catch(() => {});
  }
}

// Second visit, WORKER-CONTROLLED (2026-07-10, the #750 outage): the first
// visit above is never service-worker-controlled, so a worker whose fetch
// handler kills navigations passes the mount check while every INSTALLED
// device gets ERR_FAILED on every visit. After a healthy mount, wait (bounded)
// for the app's worker to take control of this very page, then navigate again
// — the navigation every family phone actually makes — and judge it. Standalone
// windows (?moore=1 etc.) opt out of SW registration on purpose (main.jsx), so
// a page that never becomes controlled is skipped, not failed; the plain app
// URLs always register, and CI's sw-nav-check gate is the pre-merge brake.
async function swControlledPass(page, url, errors) {
  const controlled = await page
    .waitForFunction(() => !!(navigator.serviceWorker && navigator.serviceWorker.controller), null, { timeout: 15000 })
    .then(() => true, () => false);
  if (!controlled) return { ok: true, errors }; // standalone opt-out or SW still installing — first-visit judgment stands
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const text = await page.evaluate(() => (document.body ? document.body.innerText : '')).catch(() => '');
    const failHit = FAIL_MARKERS.find((m) => text.includes(m));
    if (failHit) return { ok: false, why: `SW-controlled navigation landed on a recovery screen ("${failHit}")`, errors };
    return { ok: true, errors };
  } catch (e) {
    return { ok: false, why: `SW-controlled navigation DIED (${String(e.message).split('\n')[0]}) — every installed device hits this on every visit`, errors };
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
