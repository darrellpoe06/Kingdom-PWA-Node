// =============================================================================
// preview-isolation-probe — prove, from OUTSIDE, that a preview build cannot
// reach the family's real data, even when the browser arrives "signed in"
// =============================================================================
// MEASURED 2026-10-28: a family member on the Vercel branch preview was in
// production (real obligations in the "sample"; a test debt written to the live
// accounts table). lib/preview-isolation.js closes it; the vitest pins hold the
// code. This probe holds the LIVE ARTIFACT (DR-0076 §7 — an independent method):
// a real Chromium opens the preview with a PLANTED production session token, a
// planted NAS bridge token, a planted profile and a planted "real" snapshot in
// IndexedDB and localStorage — the exact leftovers an earlier sign-in leaves —
// and the probe watches every request the page makes.
//
// It FAILS when any of these is observed:
//   - a request to a production host (poetech.us, *.pages.dev, *.ts.net,
//     *.supabase.co) or to a NAS road on the preview origin (/sb/, /n8n/,
//     /nas-photos/, /taxes/);
//   - a planted token surviving boot (localStorage still carries it);
//   - the planted "real" snapshot rendering (its sentinel in the page) or
//     surviving in storage;
//   - no test-household banner, or a sign-in control offered;
//   - what the tester enters NOT surviving a reload (the device save), or
//     "Start over" not clearing it.
//
// Usage:
//   node scripts/preview-isolation-probe.mjs --url https://<preview>/poetech-app/
//   node scripts/preview-isolation-probe.mjs --url http://money-probe.vercel.app:4173/poetech-app/ \
//        --map money-probe.vercel.app=127.0.0.1:4173          (local build under a preview hostname)
//   --out <dir>   screenshots + a JSON report (default: ./preview-isolation-probe-out)
// Exit 0 = every check passed. Exit 1 = a check failed (the report names it).
// Requires playwright (this repo's dev dependency) or playwright-core with the
// runner's installed Chrome.
// =============================================================================
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const opt = (name, dflt = null) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : dflt; };
const URL_BASE = opt('--url');
const MAP = opt('--map');
const OUT = opt('--out', 'preview-isolation-probe-out');
if (!URL_BASE) { console.error('preview-isolation-probe: --url is required'); process.exit(2); }
mkdirSync(OUT, { recursive: true });

const FORBIDDEN_HOSTS = [/(^|\.)poetech\.us$/i, /\.pages\.dev$/i, /\.ts\.net$/i, /\.supabase\.co$/i];
const FORBIDDEN_PATHS = [/^\/sb(\/|$)/, /^\/n8n(\/|$)/, /^\/nas-photos(\/|$)/, /^\/taxes(\/|$)/, /^\/poetech-app\/sb(\/|$)/, /^\/poetech-app\/n8n(\/|$)/];
const PROD_REF = 'mjjlevhdufpaplypnqrv';
const SENTINEL = 'SENTINEL-REAL-ENTITY-9Q7';
const PLANTED_LS = {
  [`sb-${PROD_REF}-auth-token`]: JSON.stringify({ access_token: 'planted.production.token', refresh_token: 'planted-refresh', token_type: 'bearer', expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: 'planted-user-id', email: 'planted@example.com' } }),
  'poetech-chat-bridge-token': 'planted-bridge-token',
  'poe-current-profile': 'darrell',
  'poe-snapshot-marker': new Date().toISOString(),
  'poetech.help.tour.v1': '1',
  'poe-landing-seen': '1',
};
const PLANTED_SNAPSHOT = JSON.stringify({ owner: 'planted-user-id', savedAt: new Date().toISOString(), data: { entities: [{ id: 'ent-sentinel', name: SENTINEL, type: 'personal' }], accounts: [{ id: 'acct-sentinel', name: SENTINEL + ' CHECKING', balance: 12345 }], moneyPlan: { cushion: 9999 } } });

async function launch() {
  let pw = null;
  for (const name of ['playwright', 'playwright-core']) {
    try { pw = await import(name); break; } catch { /* next */ }
    try { pw = createRequire(import.meta.url)(name); break; } catch { /* next */ }
    try { pw = createRequire(process.cwd() + '/')(name); break; } catch { /* next */ }
  }
  if (!pw) throw new Error('neither playwright nor playwright-core is installed');
  const attempts = [
    process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : null,
    {},
    { channel: 'chrome' },
    { executablePath: '/opt/pw-browsers/chromium' },
  ].filter(Boolean);
  const extra = MAP ? [`--host-resolver-rules=MAP ${MAP.split('=')[0]} ${MAP.split('=')[1].split(':')[0]}`, '--proxy-server=direct://', '--ignore-certificate-errors'] : []; // a mapped host is local (served over TLS, since *.vercel.app is HSTS-preloaded): no proxy, a self-signed certificate
  let last;
  for (const a of attempts) {
    try { return { pw, browser: await pw.chromium.launch({ ...a, args: [...(a.args || []), ...extra] }) }; } catch (e) { last = e; }
  }
  throw last;
}

const checks = [];
const check = (name, ok, detail = '') => { checks.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };

const { pw, browser } = await launch();
const device = pw.devices && pw.devices['Galaxy S24'] ? pw.devices['Galaxy S24'] : { viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true };
const ctx = await browser.newContext({ ...device, ignoreHTTPSErrors: !!MAP });
const page = await ctx.newPage();
const requests = [];
page.on('request', (r) => { try { const u = new URL(r.url()); requests.push({ method: r.method(), host: u.hostname, path: u.pathname }); } catch { /* data: / blob: */ } });
const pageErrors = []; page.on('pageerror', (e) => pageErrors.push(String(e && e.message).slice(0, 160)));

// Plant the leftovers of an earlier sign-in BEFORE any app script runs.
await page.addInitScript(({ ls, snap }) => {
  try { for (const [k, v] of Object.entries(ls)) localStorage.setItem(k, v); localStorage.setItem('poe-financial-v28', snap); } catch (e) { /* blocked */ }
  try {
    const req = indexedDB.open('poetech-storage', 1);
    req.onupgradeneeded = () => { req.result.createObjectStore('kv'); };
    req.onsuccess = () => { try { req.result.transaction('kv', 'readwrite').objectStore('kv').put(snap, 'poe-financial-v28'); } catch (e) { /* ignore */ } };
  } catch (e) { /* no idb */ }
}, { ls: PLANTED_LS, snap: PLANTED_SNAPSHOT });
// Only the FIRST navigation should plant; later navigations must see the app's own purge hold.
let planted = false;
page.on('framenavigated', () => { planted = true; });

const base = URL_BASE.replace(/\/?$/, '/');
const dismiss = async () => {
  for (const sel of ['button[aria-label="Close the live service player for now"]', 'button:has-text("Show me around")', 'button:has-text("Continue")']) {
    const b = page.locator(sel).first();
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click({ force: true }).catch(() => {}); await page.waitForTimeout(200); }
  }
};
const readStorage = () => page.evaluate(async () => {
  const out = { ls: Object.keys(localStorage), idb: {} };
  try {
    const db = await new Promise((res, rej) => { const r = indexedDB.open('poetech-storage', 1); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onupgradeneeded = () => { r.result.createObjectStore('kv'); }; });
    const keys = await new Promise((res, rej) => { const r = db.transaction('kv', 'readonly').objectStore('kv').getAllKeys(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    for (const k of keys) { const v = await new Promise((res) => { const r = db.transaction('kv', 'readonly').objectStore('kv').get(k); r.onsuccess = () => res(r.result); r.onerror = () => res(null); }); out.idb[k] = typeof v === 'string' ? v.slice(0, 400) : null; }
  } catch (e) { out.idbError = String(e); }
  return out;
});

// 1. Boot the Money overview with everything planted.
await page.goto(base + '?view=books&sub=overview', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(1200); await dismiss(); await page.waitForTimeout(400);
await page.screenshot({ path: join(OUT, '01-overview.png') });
const bodyText = await page.evaluate(() => document.body.innerText);
check('test-household banner is shown', await page.locator('[data-testid="preview-test-household"]').count() > 0);
check('no sign-in control is offered', !/sign in|create your profile/i.test(bodyText.slice(0, 20000)) || (await page.locator('[data-testid="preview-test-household"]').count() > 0 && !(await page.locator('button:has-text("Sign in")').count())), 'no "Sign in" button');
check('the planted REAL snapshot is not rendered', !bodyText.includes(SENTINEL), 'sentinel absent from the page');
let st = await readStorage();
check('the planted production session token was purged', !st.ls.some((k) => /^sb-.*-auth-token$/.test(k)), `localStorage keys: ${st.ls.join(', ')}`);
check('the planted NAS bridge token was purged', !st.ls.includes('poetech-chat-bridge-token'));
check('the planted profile and snapshot marker were purged', !st.ls.includes('poe-current-profile') && !st.ls.includes('poe-snapshot-marker'));
check('the planted REAL snapshot was removed from IndexedDB and localStorage', !(st.idb['poe-financial-v28']) && !st.ls.includes('poe-financial-v28'), `idb keys: ${Object.keys(st.idb).join(', ')}`);
const sts = await page.locator('[data-testid="sts-amount"]').first().textContent().catch(() => '');
check('Safe to Spend renders from the fictional household', !!sts && sts.trim().length > 0, `amount: ${(sts || '').trim()}`);

// 2. Enter something and prove it is saved on the device (under the test key), survives a reload, and "Start over" clears it.
await page.goto(base + '?view=books&sub=settings', { waitUntil: 'networkidle', timeout: 90000 }); await dismiss();
const cushionStep = page.locator('button:has-text("Minimum cash cushion"), summary:has-text("Minimum cash cushion")').first();
if (await cushionStep.count()) { await cushionStep.evaluate((e) => e.scrollIntoView({ block: 'center' })).catch(() => {}); await cushionStep.click({ force: true }); await page.waitForTimeout(200); }
const cushion = page.locator('label:has-text("Minimum cash cushion") input').first();
const cushionFound = await cushion.count() > 0;
if (cushionFound) { await cushion.fill('731'); await page.waitForTimeout(1800); }
st = await readStorage();
const testBlob = st.idb['poe-financial-v28-test-household'] || '';
check('the entry is saved on the device under the TEST key, stamped as the test household', cushionFound && testBlob.includes('preview-test-household'), cushionFound ? `test key present: ${!!testBlob}` : 'cushion input not found');
check('the REAL key is still absent after saving', !st.idb['poe-financial-v28'] && !st.ls.includes('poe-financial-v28'));
await page.reload({ waitUntil: 'networkidle', timeout: 90000 }); await dismiss(); await page.waitForTimeout(600);
if (await cushionStep.count()) { await cushionStep.evaluate((e) => e.scrollIntoView({ block: 'center' })).catch(() => {}); await cushionStep.click({ force: true }); await page.waitForTimeout(200); }
const after = await page.locator('label:has-text("Minimum cash cushion") input').first().inputValue().catch(() => '');
check('the entry survives a reload (device save works)', after === '731', `cushion after reload: ${after}`);
await page.screenshot({ path: join(OUT, '02-settings-after-reload.png') });
await page.goto(base + '?view=books&sub=overview', { waitUntil: 'networkidle', timeout: 90000 }); await dismiss();
const resetBtn = page.locator('[data-testid="preview-test-household-reset"]').first();
if (await resetBtn.count()) { await resetBtn.click({ force: true }); await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(800); }
// After "Start over" the app reboots from the fictional seed and saves THAT, so the test key may exist again — what must be gone is the entry.
await page.goto(base + '?view=books&sub=settings', { waitUntil: 'networkidle', timeout: 90000 }); await dismiss();
if (await cushionStep.count()) { await cushionStep.evaluate((e) => e.scrollIntoView({ block: 'center' })).catch(() => {}); await cushionStep.click({ force: true }); await page.waitForTimeout(200); }
const afterReset = await page.locator('label:has-text("Minimum cash cushion") input').first().inputValue().catch(() => '');
st = await readStorage();
check('"Start over" returns the household to the fictional seed (the entry is gone)', await resetBtn.count() > 0 && afterReset !== '731' && !(st.idb['poe-financial-v28-test-household'] || '').includes('"cushion":731'), `cushion after start over: ${afterReset || '(default)'}`);

// 3. The sign-in page itself, if someone types ?login=1: it may render, but it can reach nothing.
await page.goto(base + '?login=1', { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
await page.waitForTimeout(800);
const email = page.locator('input[type="email"]').first();
if (await email.count()) {
  await email.fill('probe@example.com');
  const pass = page.locator('input[type="password"]').first(); if (await pass.count()) await pass.fill('probe-password-1');
  const submit = page.locator('button[type="submit"]').first(); if (await submit.count()) await submit.click({ force: true }).catch(() => {});
  await page.waitForTimeout(2500);
}
await page.screenshot({ path: join(OUT, '03-login-attempt.png') });

// 4. The request ledger: nothing may have reached a production host or a NAS road.
const previewHost = new URL(base).hostname;
const offenders = requests.filter((r) => FORBIDDEN_HOSTS.some((re) => re.test(r.host)) || (r.host === previewHost && FORBIDDEN_PATHS.some((re) => re.test(r.path))));
const hosts = [...new Set(requests.map((r) => r.host))].sort();
check('no request reached a production host or a NAS road', offenders.length === 0, offenders.length ? offenders.slice(0, 8).map((r) => `${r.method} ${r.host}${r.path}`).join(' | ') : `hosts seen: ${hosts.join(', ')}`);
check('no request carried the production project ref', !requests.some((r) => r.host.includes(PROD_REF) || r.path.includes(PROD_REF)));

const report = { url: URL_BASE, map: MAP, at: new Date().toISOString(), checks, hostsSeen: hosts, requestCount: requests.length, pageErrors: pageErrors.slice(0, 10) };
writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
await browser.close();
const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed · ${requests.length} requests · hosts: ${hosts.join(', ')}${pageErrors.length ? `\npage errors: ${pageErrors.join(' | ')}` : ''}`);
process.exit(failed.length ? 1 : 0);
