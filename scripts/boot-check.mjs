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
// NOTE innerText reflects CSS text-transform in Chrome — the gate's submit
// button reads 'CREATE PROFILE & ENTER' as rendered, and an EMBEDDED gate
// (?moore=1, ?view=church for a signed-out visitor) renders the form WITHOUT
// the 'Create your profile' heading. The 2026-07-10 daad4f3 run failed on
// exactly that: a healthy gate under 400 chars on a standalone URL.
const MOUNT_MARKERS = ['PROJECTIONS, NOT PROMISES', 'Create your profile', 'SIGNED IN AS', 'CREATE PROFILE & ENTER', 'Welcome back'];
// Recovery-screen headlines = the app did NOT boot.
const FAIL_MARKERS = ['Almost there — one more tap', 'Getting the latest version'];

const ATTEMPTS = 3;          // deploy propagation can take a beat; retry before failing
const RETRY_DELAY_MS = 20000;
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
    // Standalone boots (?moore=1, ?register=1, …) render their own surface, not
    // the app shell — for those, "no recovery screen + real content" is the bar.
    const standalone = url.includes('?');
    // Wait until the page RESOLVES — mounted, recovery screen, or real content —
    // instead of judging at a fixed instant (slow is not down).
    await page.waitForFunction(
      ({ mounts, fails, alone }) => {
        const t = document.body ? document.body.innerText || '' : '';
        if (fails.some((m) => t.includes(m))) return true;
        // A standalone URL is healthy on real content OR on any recognized
        // mount (a signed-out visitor gets the ACCESS GATE there — the gate
        // IS a healthy mount, incident #715 / the daad4f3 false alarm).
        return (alone && t.trim().length >= 400) || mounts.some((m) => t.includes(m));
      },
      { mounts: MOUNT_MARKERS, fails: FAIL_MARKERS, alone: standalone },
      { timeout: MOUNT_TIMEOUT_MS },
    ).catch(() => { /* judged below on the final state */ });
    const text = await page.evaluate(() => document.body.innerText || '');
    const failHit = FAIL_MARKERS.find((m) => text.includes(m));
    if (failHit) return { ok: false, why: `recovery screen shown ("${failHit}")`, errors };
    if (standalone) {
      if (text.trim().length < 400 && !MOUNT_MARKERS.some((m) => text.includes(m))) {
        return { ok: false, why: `standalone surface did not mount (body ${text.length} chars, no mount marker): "${text.trim().slice(0, 200)}"`, errors };
      }
      return { ok: true, errors };
    }
    if (!MOUNT_MARKERS.some((m) => text.includes(m))) {
      return { ok: false, why: `app did not mount within ${MOUNT_TIMEOUT_MS / 1000}s (no mount marker; body ${text.length} chars): "${text.trim().slice(0, 200)}"`, errors };
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
