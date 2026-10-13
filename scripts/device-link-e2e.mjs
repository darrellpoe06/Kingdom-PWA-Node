#!/usr/bin/env node
// =============================================================================
// device-link-e2e — the television signs in from the phone, for real (DR-0658)
// =============================================================================
// Darrell on the Fire TV, 2026-09-25 02:30 UTC: "Hard to sign in on a
// Firestick... what happened to the qr code ways?"
//
// This drives the BUILT app in two browsers against a real GoTrue + PostgREST
// + Postgres (the NAS's own image versions: supabase/postgres 15.8.1.060,
// supabase/gotrue v2.177.0, postgrest v12.2.12), with the REAL Pages Functions
// (functions/api/device-link.js, functions/link.js) mounted on the same origin
// the way Cloudflare Pages mounts them. Nothing here is a mock.
//
//   TV     960x540, a Fire TV Stick's user agent, no touch, no speech voices
//   PHONE  390x844, touch, an iPhone's user agent
//
// Scenarios, each of which must hold:
//   approve   TV: Log in -> focus is on "Sign in with your phone" -> Enter ->
//             QR + code, dialog fits 960x540. PHONE: /link?c=<code, typed
//             sloppily> -> signs in with phone + PIN -> "Sign in the TV in
//             front of you?" -> Approve. TV becomes signed in as that person.
//   deny      same, Deny: the TV says it was turned down and stays signed out.
//   expired   the link passes its deadline: the TV says so, the phone cannot
//             approve it, and /api/device-link will not hand over a session.
//   once      approve, claim -> a session; claim again -> refused (consumed).
//   usercode  the user_code, sent where the device_code belongs, claims
//             nothing; anon cannot call device_link_claim even with the hash.
//
// PROVEN TO CATCH (DR-0076 §3): --break=<deny|expiry|once|grant> installs the
// matching fault in the database first and REQUIRES that scenario to fail.
//
// Usage (after `npm run build` in app/ with VITE_SUPABASE_URL=http://127.0.0.1:8787/sb):
//   E2E_DB_URL=postgres://postgres:postgres@127.0.0.1:54322/postgres \
//   E2E_AUTH_URL=http://127.0.0.1:9999 E2E_REST_URL=http://127.0.0.1:3000 \
//   E2E_ANON=<jwt> E2E_SERVICE=<jwt> PLAYWRIGHT_CHROMIUM_PATH=<chrome> \
//   node scripts/device-link-e2e.mjs [--only=approve,deny,...] [--break=deny]
// =============================================================================
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { webcrypto } from 'node:crypto';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = process.env.E2E_DIST || join(ROOT, 'app/dist');
const PORT = Number(process.env.E2E_PORT || 8787);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const { E2E_DB_URL: DB, E2E_AUTH_URL: AUTH, E2E_REST_URL: REST, E2E_ANON: ANON, E2E_SERVICE: SERVICE } = process.env;
const SHOTS = process.env.E2E_SHOTS || '';
const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] || '';
const ONLY = arg('only') ? arg('only').split(',') : ['approve', 'deny', 'expired', 'once', 'usercode'];
const BREAK = arg('break');

for (const [k, v] of Object.entries({ E2E_DB_URL: DB, E2E_AUTH_URL: AUTH, E2E_REST_URL: REST, E2E_ANON: ANON, E2E_SERVICE: SERVICE })) {
  if (!v) { console.error(`device-link-e2e: ${k} is required`); process.exit(2); }
}
if (!existsSync(join(DIST, 'index.html'))) { console.error(`device-link-e2e: no build at ${DIST}`); process.exit(2); }

const { onRequestPost: claimPost, onRequestGet: claimGet } = await import(join(ROOT, 'app/functions/api/device-link.js'));
const { onRequest: linkRoute } = await import(join(ROOT, 'app/functions/link.js'));
const { hashDeviceCode, newDeviceCode, newUserCode } = await import(join(ROOT, 'app/src/lib/device-link.js'));

const FIRE_TV = 'Mozilla/5.0 (Linux; Android 9; AFTKA Build/PS7633.3445N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.102 Silk/130.4.1 like Chrome/130.0.6723.102 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const PHONE_NUMBER = '5555550158';
const PIN = '482915';
const LOGIN_EMAIL = `1${PHONE_NUMBER}@phone.poetech.us`;

// ── the database ─────────────────────────────────────────────────────────────
const psql = (sql) => execFileSync('psql', [DB, '-v', 'ON_ERROR_STOP=1', '-qAtc', sql], { encoding: 'utf8' }).trim();
const psqlFile = (f) => execFileSync('psql', [DB, '-v', 'ON_ERROR_STOP=1', '-q', '--single-transaction', '-f', f], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const reload = () => psql("NOTIFY pgrst, 'reload schema'");

function applyMigrations() {
  const dir = join(ROOT, 'infra/supabase/migrations-auto');
  psqlFile(join(dir, '0222-sign-in-to-the-television-from-the-phone-in-your-hand.sql'));
  psqlFile(join(dir, '0239-the-television-signs-in-from-the-phone-in-your-hand.sql'));
  psql('DELETE FROM public.device_link; DELETE FROM public.device_link_rate;');
  reload();
}

// Each fault is the smallest change that breaks exactly one promise.
const FAULTS = {
  // Deny approves anyway.
  deny: `CREATE OR REPLACE FUNCTION public.device_link_decide(p_user_code text, p_approve boolean)
    RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
    BEGIN UPDATE public.device_link SET approved_at = now(), user_id = auth.uid() WHERE user_code = upper(p_user_code); RETURN true; END $$;`,
  // Claim forgets the deadline.
  expiry: `CREATE OR REPLACE FUNCTION public.device_link_claim(p_device_hash text) RETURNS TABLE (user_id uuid)
    LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public, auth AS $$
    UPDATE public.device_link d SET consumed_at = now() WHERE d.device_hash = p_device_hash
      AND d.approved_at IS NOT NULL AND d.user_id IS NOT NULL AND d.consumed_at IS NULL RETURNING d.user_id; $$;`,
  // Claim forgets it was already used.
  once: `CREATE OR REPLACE FUNCTION public.device_link_claim(p_device_hash text) RETURNS TABLE (user_id uuid)
    LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public, auth AS $$
    UPDATE public.device_link d SET consumed_at = now() WHERE d.device_hash = p_device_hash
      AND d.approved_at IS NOT NULL AND d.user_id IS NOT NULL AND d.expires_at > now() RETURNING d.user_id; $$;`,
  // A browser may claim directly again (0222's grant).
  grant: 'GRANT EXECUTE ON FUNCTION public.device_link_claim(text) TO anon, authenticated;',
};

async function ensureUser() {
  const h = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'content-type': 'application/json' };
  const list = await (await fetch(`${AUTH}/admin/users?per_page=200`, { headers: h })).json();
  const found = (list.users || []).find((u) => u.email === LOGIN_EMAIL);
  if (found) return found.id;
  const res = await fetch(`${AUTH}/admin/users`, {
    method: 'POST', headers: h,
    body: JSON.stringify({ email: LOGIN_EMAIL, password: PIN, email_confirm: true, user_metadata: { phone: `1${PHONE_NUMBER}`, login_method: 'phone-pin', display_name: 'TV Test' } }),
  });
  const u = await res.json();
  if (!u.id) throw new Error(`could not create the test user: ${JSON.stringify(u)}`);
  return u.id;
}

// ── the same-origin server: the built app + /sb + the Pages Functions ───────
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.png': 'image/png', '.wasm': 'application/wasm' };
const readBody = (req) => new Promise((ok) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => ok(Buffer.concat(c))); });
async function sendResponse(res, r) {
  const headers = {};
  r.headers.forEach((v, k) => { if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(k)) headers[k] = v; });
  res.writeHead(r.status, headers);
  res.end(Buffer.from(await r.arrayBuffer()));
}
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, ORIGIN);
    const p = url.pathname;
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await readBody(req);
    const headers = Object.fromEntries(Object.entries(req.headers).filter(([k]) => !['host', 'connection', 'content-length', 'accept-encoding'].includes(k)));
    if (p.startsWith('/sb/auth/v1/') || p.startsWith('/sb/rest/v1/')) {
      const up = p.startsWith('/sb/auth/v1/') ? AUTH + p.slice('/sb/auth/v1'.length) : REST + p.slice('/sb/rest/v1'.length);
      return sendResponse(res, await fetch(up + url.search, { method: req.method, headers, body }));
    }
    if (p.startsWith('/sb/')) { res.writeHead(404); return res.end(); }
    const env = { SUPABASE_URL: `${ORIGIN}/sb`, SUPABASE_SERVICE_KEY: SERVICE };
    const request = new Request(url, { method: req.method, headers, body });
    if (p === '/api/device-link') return sendResponse(res, await (req.method === 'POST' ? claimPost : claimGet)({ request, env }));
    if (p === '/link') return sendResponse(res, await linkRoute({ request, env }));
    if (p === '/' || p === '') { res.writeHead(302, { location: '/poetech-app/' }); return res.end(); }
    if (p.startsWith('/poetech-app/')) {
      const rel = normalize(p.slice('/poetech-app/'.length)).replace(/^(\.\.[/\\])+/, '');
      let file = join(DIST, rel);
      if (!rel || !existsSync(file) || !extname(file)) file = join(DIST, 'index.html');
      res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      return res.end(readFileSync(file));
    }
    res.writeHead(404); res.end();
  } catch (e) {
    res.writeHead(500); res.end(String(e && e.stack));
  }
});

// ── helpers ─────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// A session is never printed: a minted pair reads as "session issued".
const shown = (b) => (b && b.access_token ? 'session issued' : JSON.stringify(b));
const results = [];
function check(name, ok, detail = '') { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`); }

const NO_VOICES = () => {
  try {
    if (window.speechSynthesis) {
      Object.defineProperty(window.speechSynthesis, 'getVoices', { value: () => [] });
    }
  } catch (_) { /* ignore */ }
};

async function tvContext(browser) {
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 }, userAgent: FIRE_TV, hasTouch: false, isMobile: false, deviceScaleFactor: 1 });
  await ctx.addInitScript(NO_VOICES);
  // A returning visitor, like Darrell's TV: the first-visit scenario picker
  // (poe-financial-mvp-v28.jsx markLandingSeen) is already behind them.
  await ctx.addInitScript(() => { try { localStorage.setItem('poe-landing-seen', '1'); } catch (_) { /* ignore */ } });
  await ctx.addInitScript(() => { try { navigator.serviceWorker && Object.defineProperty(navigator, 'serviceWorker', { value: undefined }); } catch (_) { /* ignore */ } });
  return ctx;
}
async function phoneContext(browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: IPHONE, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => { try { navigator.serviceWorker && Object.defineProperty(navigator, 'serviceWorker', { value: undefined }); } catch (_) { /* ignore */ } });
  return ctx;
}
const tvToken = (page) => page.evaluate(() => {
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (/^sb-.*-auth-token$/.test(k)) { try { const v = JSON.parse(localStorage.getItem(k)); return v && v.user ? v.user.id : null; } catch (_) { return null; } }
  }
  return null;
});

/** Open the real app on the TV, press Log in, press OK on the focused door. Returns the code shown. */
async function tvStart(page, label) {
  // The church door (poetech.us/lovecorner -> ?view=church) is the TV's front
  // door; its "Log in / Create account" opens the same AuthModal as the header.
  await page.goto(`${ORIGIN}/poetech-app/?view=church`, { waitUntil: 'domcontentloaded' });
  const login = page.getByRole('button', { name: /^Log in/ }).first();
  await login.waitFor({ state: 'visible', timeout: 60000 });
  await login.click();
  await page.locator('[role="dialog"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForFunction(() => document.activeElement && document.activeElement.getAttribute('data-testid') === 'phone-signin-button', null, { timeout: 5000 });
  check(`${label}: focus lands on "Sign in with your phone"`, true);
  await page.keyboard.press('Enter');
  const codeEl = page.locator('[data-testid="phone-signin-code"]');
  await codeEl.waitFor({ state: 'visible', timeout: 15000 });
  const code = (await codeEl.textContent()).trim();
  check(`${label}: the TV shows a QR and an 8-character code`, /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code) && await page.locator('[data-testid="phone-signin-qr"] svg').count() === 1, code);
  return code;
}

async function measureFit(page, label) {
  const m = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    const r = d.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, scrollH: d.scrollHeight, clientH: d.clientHeight, vw: innerWidth, vh: innerHeight };
  });
  const fits = m.top >= 0 && m.bottom <= m.vh && m.left >= 0 && m.right <= m.vw && m.scrollH <= m.clientH + 1;
  check(`${label}: the whole dialog fits ${m.vw}x${m.vh} with no scrolling`, fits, `dialog ${Math.round(m.left)},${Math.round(m.top)} to ${Math.round(m.right)},${Math.round(m.bottom)}; content ${m.scrollH}px in ${m.clientH}px`);
  return m;
}

/** On the phone: open /link with the code typed sloppily, sign in if needed, then decide. */
async function phoneDecide(page, code, approve, label) {
  const sloppy = code.toLowerCase().replace('-', ' - ');
  await page.goto(`${ORIGIN}/link?c=${encodeURIComponent(sloppy)}`, { waitUntil: 'domcontentloaded' });
  check(`${label}: /link lands on the approval screen with the code cleaned`, page.url().endsWith(`/poetech-app/?link=${code.replace('-', '')}`), page.url());
  const ask = page.locator('[data-testid="link-ask"], [data-testid="link-stale"]');
  const phoneInput = page.locator('#pa-phone');
  await Promise.race([ask.first().waitFor({ timeout: 20000 }), phoneInput.waitFor({ timeout: 20000 })]);
  if (await phoneInput.isVisible().catch(() => false)) {
    // The same phone + PIN door the rest of the app uses (PasswordAuth).
    await phoneInput.fill(PHONE_NUMBER);
    await page.locator('#pa-pin').fill(PIN);
    await page.getByRole('button', { name: /^Sign in/ }).first().click();
    check(`${label}: the phone signed in with phone number + PIN`, true);
  }
  await ask.first().waitFor({ timeout: 20000 });
  if (await page.locator('[data-testid="link-stale"]').count()) return 'stale';
  const device = (await page.locator('[data-testid="link-device"]').textContent()) || '';
  check(`${label}: the phone asks "Sign in the TV in front of you?" and names the Fire TV`, /Fire TV/.test(device) && await page.getByText('Sign in the TV in front of you?').count() === 1, device.trim());
  await page.locator(approve ? '[data-testid="link-approve"]' : '[data-testid="link-deny"]').click();
  await page.locator(approve ? '[data-testid="link-approved"]' : '[data-testid="link-denied"]').waitFor({ timeout: 15000 });
  return approve ? 'approved' : 'denied';
}

// Node-level helpers for the claim scenarios: exactly what a TV sends.
const rpc = async (name, args, jwt = ANON) => fetch(`${ORIGIN}/sb/rest/v1/rpc/${name}`, {
  method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${jwt}`, 'content-type': 'application/json' }, body: JSON.stringify(args),
});
async function userJwt() {
  const r = await fetch(`${AUTH}/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, 'content-type': 'application/json' }, body: JSON.stringify({ email: LOGIN_EMAIL, password: PIN }) });
  return (await r.json()).access_token;
}
async function nodeStart() {
  const deviceCode = newDeviceCode(webcrypto);
  const deviceHash = await hashDeviceCode(deviceCode, webcrypto);
  const userCode = newUserCode(webcrypto);
  const r = await rpc('device_link_start', { p_device_hash: deviceHash, p_user_code: userCode, p_label: 'Fire TV' });
  if (!r.ok) throw new Error(`start ${r.status} ${await r.text()}`);
  return { deviceCode, deviceHash, userCode };
}
const claim = async (deviceCode) => {
  const r = await fetch(`${ORIGIN}/api/device-link`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ device_code: deviceCode }) });
  return { status: r.status, body: await r.json() };
};

// ── run ─────────────────────────────────────────────────────────────────────
applyMigrations();
const userId = await ensureUser();
if (BREAK) {
  if (!FAULTS[BREAK]) { console.error(`unknown --break=${BREAK}`); process.exit(2); }
  psql(FAULTS[BREAK]); reload();
  console.log(`-- fault installed: ${BREAK}`);
}
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: join(SHOTS, `${name}.png`) }); };

try {
  const readiness = await (await fetch(`${ORIGIN}/api/device-link`)).json();
  check('the endpoint reports ready against real GoTrue + PostgREST (status codes only)', readiness.ready === true, JSON.stringify(readiness));
  const phoneCtx = await phoneContext(browser);
  const phone = await phoneCtx.newPage();

  if (ONLY.includes('approve')) {
    const tvCtx = await tvContext(browser);
    const tv = await tvCtx.newPage();
    const code = await tvStart(tv, 'approve');
    await measureFit(tv, 'approve');
    await shot(tv, '1-tv-code');
    const t0 = Date.now();
    await phoneDecide(phone, code, true, 'approve');
    await shot(phone, '2-phone-approved');
    let id = null;
    for (let i = 0; i < 40 && !id; i += 1) { await sleep(500); id = await tvToken(tv); }
    await sleep(500);
    const dialogGone = (await tv.locator('[aria-labelledby="auth-modal-h"]').count()) === 0;
    check('approve: the TV becomes signed in as the phone\'s person, and the sign-in dialog closes', id === userId && dialogGone, `signed in ${id ? 'as ' + id : 'NOT'} ${((Date.now() - t0) / 1000).toFixed(1)}s after Approve; dialog ${dialogGone ? 'closed' : 'still open'}`);
    await shot(tv, '3-tv-signed-in');
    await tvCtx.close();
  }

  if (ONLY.includes('deny')) {
    const tvCtx = await tvContext(browser);
    const tv = await tvCtx.newPage();
    const code = await tvStart(tv, 'deny');
    await phoneDecide(phone, code, false, 'deny');
    await shot(phone, '4-phone-denied');
    await tv.locator('[data-testid="phone-signin-error"]').waitFor({ timeout: 10000 }).catch(() => {});
    await sleep(4000);
    const id = await tvToken(tv);
    const said = (await tv.locator('[data-testid="phone-signin-error"]').textContent().catch(() => '')) || '';
    check('deny: the TV stays signed out and says it was turned down', !id && /turned down/i.test(said), `token ${id ? 'PRESENT' : 'none'}; TV says "${said.trim()}"`);
    await shot(tv, '5-tv-denied');
    await tvCtx.close();
  }

  if (ONLY.includes('expired')) {
    const tvCtx = await tvContext(browser);
    const tv = await tvCtx.newPage();
    const code = await tvStart(tv, 'expired');
    psql(`UPDATE public.device_link SET expires_at = now() - interval '1 second' WHERE user_code = '${code.replace('-', '')}'`);
    await tv.locator('[data-testid="phone-signin-error"]').waitFor({ timeout: 10000 }).catch(() => {});
    const said = (await tv.locator('[data-testid="phone-signin-error"]').textContent().catch(() => '')) || '';
    check('expired: the TV says the code has expired', /expired/i.test(said), said.trim());
    const outcome = await phoneDecide(phone, code, true, 'expired');
    check('expired: the phone cannot approve it', outcome === 'stale', outcome);
    await shot(phone, '6-phone-expired');
    await tvCtx.close();
    // And the endpoint will not hand one over, even if it was approved first.
    const l = await nodeStart();
    const jwt = await userJwt();
    await rpc('device_link_decide', { p_user_code: l.userCode, p_approve: true }, jwt);
    psql(`UPDATE public.device_link SET expires_at = now() - interval '1 second' WHERE user_code = '${l.userCode}'`);
    const c = await claim(l.deviceCode);
    check('expired: an approved link past its deadline cannot be claimed', c.status === 409 && !c.body.access_token, `${c.status} ${shown(c.body)}`);
  }

  if (ONLY.includes('once')) {
    const l = await nodeStart();
    await rpc('device_link_decide', { p_user_code: l.userCode, p_approve: true }, await userJwt());
    const first = await claim(l.deviceCode);
    const second = await claim(l.deviceCode);
    check('once: the first claim gets a session', first.status === 200 && !!first.body.access_token, `${first.status}`);
    check('once: a second claim is refused', second.status === 409 && !second.body.access_token, `${second.status} ${shown(second.body)}`);
  }

  if (ONLY.includes('usercode')) {
    const l = await nodeStart();
    await rpc('device_link_decide', { p_user_code: l.userCode, p_approve: true }, await userJwt());
    const viaEndpoint = await claim(l.userCode);
    check('usercode: the user_code sent as a device_code claims nothing', viaEndpoint.status === 400 && !viaEndpoint.body.access_token, `${viaEndpoint.status} ${shown(viaEndpoint.body)}`);
    const anonHash = await rpc('device_link_claim', { p_device_hash: l.deviceHash });
    const anonCode = await rpc('device_link_claim', { p_device_hash: l.userCode });
    check('usercode: anon cannot call device_link_claim, with the hash or the code', !anonHash.ok && !anonCode.ok, `hash ${anonHash.status}, code ${anonCode.status}`);
    const still = await claim(l.deviceCode);
    check('usercode: the real TV can still collect its own approved link afterwards', still.status === 200, `${still.status}`);
  }
} finally {
  await browser.close();
  server.close();
  if (BREAK) { applyMigrations(); console.log(`-- fault removed: ${BREAK}`); }
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed${BREAK ? ` with fault "${BREAK}" installed` : ''}`);
process.exit(failed.length ? 1 : 0);
