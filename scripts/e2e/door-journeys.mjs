// =============================================================================
// door-journeys — END TO END: real Chromium, the real built app, PostgREST,
// and a real PostgreSQL carrying the real migrations (DR-0911)
// =============================================================================
// Darrell, 2026-10-10: "End to end testing..."
//
// Every other proof stops short of the whole: the SQL smokes prove the walls
// on a real database with no app; the vitest suites prove the screens against
// a fake data layer. This walks the journeys a person actually walks — on the
// built app, in Chromium, against PostgREST (the same server, same version,
// production runs) over a PostgreSQL with the real migration chain — and reads
// the database afterwards to prove what the screen claimed is what happened.
//
// WHAT IS REAL: the built app (vite build), Chromium, PostgREST 12.2.12, the
// PostgreSQL schema and every RLS policy, trigger and RPC the journeys touch.
// WHAT IS STOOD IN: sign-in. Production's auth server issues a JWT; here the
// harness mints the same JWT with the stack's secret (as mint_keys.py does)
// and places the session where supabase-js keeps it. The journeys under test
// are booking, confirming and paying, not signing in; GET /auth/v1/user is
// answered from the token itself. Nothing else is mocked.
//
// Usage (CI: the door-journeys job in ci.yml; locally the same with your paths).
// Build the database first with scripts/e2e/build-door-db.sh (PG* env), then:
//   E2E_PSQL="psql -h HOST -p PORT -U postgres -d e2e" \
//   E2E_DB_URI="postgres://postgres@HOST:PORT/e2e" \
//   E2E_POSTGREST=/path/to/postgrest E2E_CHROME=/path/to/chrome \
//   node scripts/e2e/door-journeys.mjs app/dist
// The app must be built with VITE_SUPABASE_URL=http://127.0.0.1:4173/sb and
// VITE_SUPABASE_ANON_KEY=<printed by `node scripts/e2e/door-journeys.mjs --anon-key`>.
// Screenshots land in E2E_SHOTS (default e2e-shots/). Exit 0 = every journey
// passed; 1 = a journey failed (it says which, and what it saw); 2 = setup.
// --break=<street|confirm|payment|area|calendar> installs one fault and exits 0 only
// when the step it targets FAILED (proven to catch, DR-0076 §3).
// Bounded: every wait has a timeout; the whole run is capped (E2E_BUDGET_MS).
// =============================================================================
import { createServer, request as httpRequest } from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { createHmac, randomUUID } from 'node:crypto';
import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';

// A secret that exists only for this throwaway stack.
const JWT_SECRET = 'e2e-door-journeys-throwaway-secret-0123456789abcdef';
const GATEWAY_PORT = 4173;
const PGRST_PORT = 3999;
const BASE = `http://127.0.0.1:${GATEWAY_PORT}`;
const BUDGET_MS = Number(process.env.E2E_BUDGET_MS || 240000);

const b64 = (s) => Buffer.from(s).toString('base64url');
export function mintJwt(payload, secret = JWT_SECRET) {
  const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const p = b64(JSON.stringify(payload));
  return `${h}.${p}.${createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url')}`;
}
const FAR = Math.floor(Date.now() / 1000) + 3600 * 24 * 365;
export const ANON_KEY = mintJwt({ role: 'anon', iss: 'e2e', exp: FAR });

if (process.argv[2] === '--anon-key') { process.stdout.write(ANON_KEY); process.exit(0); }

const DIST = process.argv[2] || 'app/dist';
const PSQL = (process.env.E2E_PSQL || '').split(/\s+/).filter(Boolean);
const SHOTS = process.env.E2E_SHOTS || 'e2e-shots';
const CHROME = process.env.E2E_CHROME || '';
const POSTGREST = process.env.E2E_POSTGREST || 'postgrest';
const DB_URI = process.env.E2E_DB_URI || '';

function fail(code, msg) { console.error(`door-journeys: ${msg}`); process.exit(code); }
if (!existsSync(join(DIST, 'properties', 'app', 'index.html'))) fail(2, `no built Properties app in ${DIST} (vite build first)`);
if (!PSQL.length || !DB_URI) fail(2, 'set E2E_PSQL and E2E_DB_URI');
mkdirSync(SHOTS, { recursive: true });

const sql = (text) => execFileSync(PSQL[0], [...PSQL.slice(1), '-v', 'ON_ERROR_STOP=1', '-qAt', '-c', text], { encoding: 'utf8' }).trim();

// ---------------------------------------------------------------------------
// The seed: one family, one short-stay door marked to SHOW its street (the
// setting DR-0910 overrode — so the stranger's page proves it stays hidden).
// ---------------------------------------------------------------------------
const OWNER = '00000000-0000-4000-a000-00000000e2e1';
const INSTANCE = '00000000-0000-4000-b000-00000000e2e1';
const DOOR = '00000000-0000-4000-c000-00000000e2e1';
const STREET = '805 North Prospect Avenue';
function seed() {
  sql(`
    DELETE FROM door_stays WHERE rental_id = '${DOOR}';
    DELETE FROM rent_records WHERE instance_id = '${INSTANCE}';
    DELETE FROM rentals WHERE id = '${DOOR}';
    DELETE FROM instance_members WHERE instance_id = '${INSTANCE}';
    DELETE FROM instances WHERE id = '${INSTANCE}';
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
      VALUES ('00000000-0000-0000-0000-000000000000', '${OWNER}', 'authenticated', 'authenticated', 'owner@e2e.local', '', now(), now())
      ON CONFLICT (id) DO NOTHING;
    INSERT INTO instances (id, slug, display_name, instance_type) VALUES ('${INSTANCE}', 'poe-properties-e2e', 'Poe Properties E2E', 'business');
    INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES ('${INSTANCE}', '${OWNER}', 'owner', 'Owner');
    INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, city, state, property_type, status, listed_at, offering, nightly_rate, address_visibility)
      VALUES ('${DOOR}', '${INSTANCE}', '${OWNER}', 'E2E-APT2', '${STREET} Apt 2', '${STREET}', 'Apt 2', 'Champaign', 'Illinois', 'multi-family', 'vacant', now(), 'short-term', 150, 'public');
    -- (a fresh insert carries no area; the family sets it in E1)
  `);
}

// ---------------------------------------------------------------------------
// PROVEN TO CATCH (DR-0076 §3): --break=<name> installs one fault after the
// seed and REQUIRES the named step to fail; the run exits 0 only when it did.
// The fault is undone afterwards by re-applying the migration that owns it.
// ---------------------------------------------------------------------------
const MIG = 'infra/supabase/migrations-auto';
export const FAULTS = Object.freeze({
  street: {
    step: 'A1',
    sql: `CREATE OR REPLACE FUNCTION public.rental_address_is_public(p_visibility text) RETURNS boolean LANGUAGE sql IMMUTABLE AS $f$ SELECT p_visibility = 'public' $f$;`,
    restore: `${MIG}/0268-the-public-shelf-shows-where-never-the-street.sql`,
  },
  confirm: {
    step: 'B2',
    sql: 'REVOKE UPDATE ON public.door_stays FROM authenticated;',
    restore: 'GRANT UPDATE ON public.door_stays TO authenticated;',
  },
  payment: {
    step: 'D1',
    sql: 'ALTER TABLE public.rent_records ADD CONSTRAINT e2e_fault_needs_tenancy CHECK (tenancy_id IS NOT NULL) NOT VALID;',
    restore: 'ALTER TABLE public.rent_records DROP CONSTRAINT IF EXISTS e2e_fault_needs_tenancy;',
  },
  area: {
    step: 'E1',
    sql: `CREATE OR REPLACE FUNCTION public.rentals_area_rounded() RETURNS trigger LANGUAGE plpgsql AS $f$ BEGIN RAISE EXCEPTION 'e2e fault: no area' USING ERRCODE = 'check_violation'; END $f$;`,
    restore: `${MIG}/0270-the-public-shelf-shows-the-area-on-a-map.sql`,
  },
  calendar: {
    step: 'C1',
    sql: `CREATE OR REPLACE FUNCTION public.door_booked_nights(p_rental uuid, p_from date, p_to date) RETURNS TABLE (taken_from date, taken_to date) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $f$ SELECT NULL::date, NULL::date WHERE false $f$;`,
    restore: `${MIG}/0269-a-short-stay-door-has-a-booking-calendar.sql`,
  },
});
const BREAK = (process.argv.find((a) => a.startsWith('--break=')) || '').slice('--break='.length);
if (BREAK && !FAULTS[BREAK]) fail(2, `unknown --break=${BREAK} (one of: ${Object.keys(FAULTS).join(', ')})`);
function applyFile(path) { execFileSync(PSQL[0], [...PSQL.slice(1), '-v', 'ON_ERROR_STOP=1', '-q', '-f', path], { encoding: 'utf8', stdio: ['ignore', 'ignore', 'inherit'] }); }
function undoFault(f) { if (f.restore.endsWith('.sql')) applyFile(f.restore); else sql(f.restore); }

// ---------------------------------------------------------------------------
// PostgREST behind a gateway that answers the paths the app calls.
// ---------------------------------------------------------------------------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };

function startPostgrest() {
  const conf = join(SHOTS, 'postgrest.conf');
  writeFileSync(conf, [
    `db-uri = "${DB_URI}"`, 'db-schemas = "public"', 'db-anon-role = "anon"',
    `jwt-secret = "${JWT_SECRET}"`, `server-port = ${PGRST_PORT}`, 'server-host = "127.0.0.1"', 'log-level = "warn"',
  ].join('\n'));
  const p = spawn(POSTGREST, [conf], { stdio: ['ignore', 'inherit', 'inherit'] });
  return p;
}

function claims(req) {
  const m = /^Bearer\s+(.+)$/.exec(req.headers.authorization || '');
  if (!m) return null;
  try { return JSON.parse(Buffer.from(m[1].split('.')[1], 'base64url').toString()); } catch { return null; }
}

function gateway() {
  return createServer((req, res) => {
    const url = new URL(req.url, BASE);
    if (url.pathname.startsWith('/sb/rest/v1/')) {
      const target = url.pathname.slice('/sb/rest/v1'.length) + url.search;
      const headers = { ...req.headers, host: `127.0.0.1:${PGRST_PORT}` };
      const up = httpRequest({ host: '127.0.0.1', port: PGRST_PORT, path: target, method: req.method, headers }, (r) => {
        res.writeHead(r.statusCode || 502, r.headers); r.pipe(res);
      });
      up.on('error', () => { res.writeHead(502); res.end(); });
      req.pipe(up);
      return;
    }
    if (url.pathname === '/sb/auth/v1/user') {
      const c = claims(req);
      if (!c || c.role !== 'authenticated') { res.writeHead(401, { 'content-type': 'application/json' }); res.end('{"message":"no session"}'); return; }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ id: c.sub, aud: 'authenticated', role: 'authenticated', email: c.email || '', app_metadata: {}, user_metadata: {} }));
      return;
    }
    if (url.pathname.startsWith('/sb/')) { res.writeHead(404, { 'content-type': 'application/json' }); res.end('{}'); return; }
    // The built app, served the way Pages serves it; no service worker here
    // (a worker caching between journeys would blur what each one proves).
    if (url.pathname.endsWith('/sw.js')) { res.writeHead(404); res.end(); return; }
    // The build is based at /poetech-app/ (vite `base`); Pages serves dist
    // there, and the /properties/ face loads its assets from that base.
    const rel = url.pathname.startsWith('/poetech-app/') ? url.pathname.slice('/poetech-app'.length) : url.pathname;
    let file = normalize(join(DIST, decodeURIComponent(rel)));
    if (!file.startsWith(normalize(DIST))) { res.writeHead(403); res.end(); return; }
    try { if (statSync(file).isDirectory()) file = join(file, 'index.html'); } catch { /* resolved below */ }
    if (!existsSync(file) && rel !== url.pathname) { res.writeHead(404); res.end(); return; }   // a missing asset is a 404, never the page
    if (!existsSync(file)) file = url.pathname.startsWith('/properties/') ? join(DIST, 'properties', 'app', 'index.html') : join(DIST, 'index.html');
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(readFileSync(file));
  });
}

async function waitFor(fn, what, ms = 15000) {
  const until = Date.now() + ms;
  let last;
  while (Date.now() < until) {
    try { last = await fn(); if (last) return last; } catch (e) { last = e; }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`timed out waiting for ${what}${last instanceof Error ? `: ${last.message}` : ''}`);
}

const pad = (n) => String(n).padStart(2, '0');
const dayFromToday = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

// ---------------------------------------------------------------------------
// The journeys.
// ---------------------------------------------------------------------------
async function run() {
  const { chromium } = await import('playwright-core');
  const pgrst = startPostgrest();
  const server = gateway();
  await new Promise((r) => server.listen(GATEWAY_PORT, '127.0.0.1', r));
  const killer = setTimeout(() => { console.error('door-journeys: over budget'); process.exit(1); }, BUDGET_MS);
  const results = RESULTS;
  let browser;
  try {
    await waitFor(async () => {
      const r = await fetch(`http://127.0.0.1:${PGRST_PORT}/`).catch(() => null);
      return r && r.status < 500;
    }, 'PostgREST to answer', 30000);
    seed();
    if (BREAK) { console.log(`  (fault installed: ${BREAK} — step ${FAULTS[BREAK].step} must fail)`); sql(FAULTS[BREAK].sql); }
    browser = await chromium.launch({ headless: true, ...(CHROME ? { executablePath: CHROME } : { channel: 'chrome' }) });
    const IN = dayFromToday(5);
    const OUT = dayFromToday(7);

    // Every page's console errors and failed requests are kept, and a failing
    // step dumps what the page actually showed — a red step names its cause.
    const seen = [];
    const watch = (page, who) => {
      page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') seen.push(`[${who} ${m.type()}] ${m.text()}`); });
      page.on('pageerror', (e) => seen.push(`[${who} pageerror] ${e.message}`));
      page.on('requestfailed', (r) => seen.push(`[${who} requestfailed] ${r.url()} ${r.failure() && r.failure().errorText}`));
      page.on('response', (r) => { if (r.status() >= 400) seen.push(`[${who} ${r.status()}] ${r.url()}`); });
      return page;
    };
    // Map tiles are answered here: a run never calls OpenStreetMap (its tile
    // policy is for people looking at maps, not CI), and the journeys prove the
    // map is drawn, not that a third party is up.
    const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    const hermetic = async (ctx) => { await ctx.route('https://tile.openstreetmap.org/**', (r) => r.fulfill({ status: 200, contentType: 'image/png', body: PNG })); return ctx; };
    let current = null;
    const step = async (name, fn) => {
      try { await fn(); results.push([name, 'pass']); console.log(`  ✔ ${name}`); } catch (e) {
        results.push([name, 'FAIL', e.message]);
        console.log(`  ✘ ${name}\n      ${e.message}`);
        if (current) {
          const tag = name.split(' ')[0];
          await current.screenshot({ path: join(SHOTS, `${tag}-FAILED.png`), fullPage: true }).catch(() => {});
          const text = await current.locator('body').innerText().catch(() => '(no body)');
          console.log(`      url: ${current.url()}\n      page text: ${text.replace(/\s+/g, ' ').slice(0, 800)}`);
        }
        for (const line of seen.slice(-25)) console.log(`      ${line}`);
        throw e;
      }
    };

    // A. A stranger with no account books two nights — and never sees the street.
    const guest = await hermetic(await browser.newContext({ viewport: { width: 412, height: 915 } }));
    const gp = watch(await guest.newPage(), 'guest'); current = gp;
    await step('A1 the public door lists the short-stay place, without its street', async () => {
      await gp.goto(`${BASE}/properties/app/?properties=1`, { waitUntil: 'domcontentloaded' });
      await gp.getByRole('button', { name: /Looking for a place/i }).click({ timeout: 15000 });
      await gp.getByText(/Champaign/).first().waitFor({ timeout: 15000 });
      await gp.screenshot({ path: join(SHOTS, 'A1-listing.png'), fullPage: true });
      const text = await gp.locator('body').innerText();
      if (text.includes(STREET)) throw new Error(`the street "${STREET}" is on the public page (DR-0910 says never)`);
    });
    await step('A2 the short form books two nights, both attestations given', async () => {
      await gp.getByRole('button', { name: /Book a stay/i }).first().click();
      await gp.locator(`button[aria-label^="${IN}"]`).first().click({ timeout: 15000 });
      await gp.locator(`button[aria-label^="${OUT}"]`).first().click();
      await gp.getByLabel('Your name').fill('Ana Guest');
      await gp.getByLabel('Cell phone').fill('217-555-0100');
      await gp.getByLabel('What would make your stay better').fill('Coffee');
      await gp.getByLabel('I am 21 or older').check();
      await gp.getByLabel('I accept the house rules').check();
      await gp.getByTestId('book-a-stay-send').click();
      await gp.getByTestId('book-a-stay-done').waitFor({ timeout: 15000 });
      await gp.screenshot({ path: join(SHOTS, 'A2-asked.png'), fullPage: true });
      const row = sql(`SELECT status || '|' || attests_21_plus || '|' || accepts_house_rules || '|' || coalesce(stay_wishes,'') || '|' || offers_by_email FROM door_stays WHERE rental_id = '${DOOR}' AND check_in = '${IN}'`);
      if (row !== 'requested|true|true|Coffee|false') throw new Error(`the database holds "${row}", not a requested, attested stay`);
    });

    // B. The family confirms it in the door's Stays tab — and sees the full address.
    const owner = await hermetic(await browser.newContext({ viewport: { width: 1280, height: 900 } }));
    const token = mintJwt({ sub: OWNER, role: 'authenticated', aud: 'authenticated', email: 'owner@e2e.local', exp: FAR });
    const session = { access_token: token, token_type: 'bearer', expires_in: 3600 * 24 * 365, expires_at: FAR, refresh_token: 'e2e', user: { id: OWNER, aud: 'authenticated', role: 'authenticated', email: 'owner@e2e.local', app_metadata: {}, user_metadata: {} } };
    await owner.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* none */ } }, ['sb-127-auth-token', JSON.stringify(session)]);
    const op = watch(await owner.newPage(), 'owner'); current = op;
    await step('B1 the family sees the door with its full address', async () => {
      await op.goto(`${BASE}/properties/app/?properties=1`, { waitUntil: 'domcontentloaded' });
      await op.getByText(STREET).first().waitFor({ timeout: 20000 });
      await op.screenshot({ path: join(SHOTS, 'B1-family-doors.png'), fullPage: true });
    });
    await step('B2 the family confirms the ask in the Stays tab', async () => {
      await op.getByText(STREET).first().click();
      await op.getByRole('button', { name: /^Stays$/ }).first().click({ timeout: 15000 });
      await op.getByTestId('stay-ask').first().waitFor({ timeout: 15000 });
      await op.getByRole('button', { name: /^Confirm$/ }).first().click();
      await waitFor(() => sql(`SELECT status FROM door_stays WHERE rental_id = '${DOOR}' AND check_in = '${IN}'`) === 'confirmed', 'the stay to read confirmed in the database');
      await op.screenshot({ path: join(SHOTS, 'B2-confirmed.png'), fullPage: true });
      const ev = sql(`SELECT string_agg(event, ',' ORDER BY at) FROM record_events WHERE subject = 'stay' AND subject_id = (SELECT id FROM door_stays WHERE rental_id = '${DOOR}' AND check_in = '${IN}')`);
      if (ev !== 'asked,confirmed') throw new Error(`the clock reads "${ev}"`);
    });

    // D. The family records money that came to the door with no tenant on it.
    await step('D1 the family records a payment received on a door with no tenant', async () => {
      await op.getByRole('button', { name: /^Rent$/ }).first().click({ timeout: 15000 });
      await op.getByTestId('record-payment').waitFor({ timeout: 15000 });
      await op.getByLabel('Amount received').fill('300');
      await op.getByTestId('record-payment').getByRole('button', { name: /^Cash$/ }).click();
      await op.getByLabel('From whom').fill('Ana Guest');
      await op.getByTestId('record-payment').getByRole('button', { name: /^Record it$/ }).click();
      await op.getByTestId('record-payment-done').waitFor({ timeout: 15000 });
      const row = sql(`SELECT coalesce(tenancy_id::text,'none') || '|' || rental_id || '|' || amount::numeric(10,2) || '|' || method FROM rent_records WHERE instance_id = '${INSTANCE}'`);
      if (row !== `none|${DOOR}|300.00|cash`) throw new Error(`the database holds "${row}", not $300 cash on the door with no tenancy`);
      const total = sql(`SELECT received::numeric(10,2) FROM door_money_months WHERE rental_id = '${DOOR}'`);
      if (total !== '300.00') throw new Error(`the door's money reads "${total}", not 300.00`);
      await op.screenshot({ path: join(SHOTS, 'D1-payment-recorded.png'), fullPage: true });
    });

    // E. The family puts the door's area on the map; only the area is kept.
    await step('E1 the family sets the area on the map; the database keeps only the rounded area', async () => {
      await op.getByRole('button', { name: /^Doors$/ }).first().click({ timeout: 15000 });
      await op.getByRole('button', { name: /^Edit( door)?$/ }).first().click({ timeout: 15000 });
      await op.getByTestId('area-editor').waitFor({ timeout: 15000 });
      await op.getByLabel('Point from a map app').fill('https://www.google.com/maps/@40.123364,-88.25828,17z');
      await op.getByRole('button', { name: /^Use this point$/ }).click();
      await op.getByTestId('area-editor-lines').waitFor({ timeout: 15000 });
      await op.screenshot({ path: join(SHOTS, 'E1-area-editor.png'), fullPage: true });
      await op.getByRole('button', { name: /^Save the area$/ }).click();
      await waitFor(() => sql(`SELECT coalesce(area_lat::text,'') || ',' || coalesce(area_lng::text,'') FROM rentals WHERE id = '${DOOR}'`) === '40.12500,-88.26000', 'the area to read 40.12500,-88.26000 in the database');
      const lines = sql(`SELECT jsonb_array_length(nearby) || '|' || (nearby->0->>'label') FROM rentals WHERE id = '${DOOR}'`);
      if (lines !== '12|I-74 at Exit 181') throw new Error(`the nearby lines read "${lines}"`);
    });

    // C. The next stranger sees those nights dark.
    const next = await hermetic(await browser.newContext({ viewport: { width: 412, height: 915 } }));
    const np = watch(await next.newPage(), 'next'); current = np;
    await step('C1 the booked nights are dark for the next guest', async () => {
      await np.goto(`${BASE}/properties/app/?properties=1`, { waitUntil: 'domcontentloaded' });
      await np.getByRole('button', { name: /Looking for a place/i }).click({ timeout: 15000 });
      await np.getByRole('button', { name: /Book a stay/i }).first().click({ timeout: 15000 });
      await waitFor(async () => (await np.locator(`button[aria-label^="${IN}"]`).first().getAttribute('data-taken')) === 'yes', `the night of ${IN} to show taken`);
      await np.screenshot({ path: join(SHOTS, 'C1-dark-nights.png'), fullPage: true });
    });
    await step('C2 the next guest sees the area and what is nearby, never the street or the point', async () => {
      await np.getByTestId('area-map').first().waitFor({ timeout: 15000 });
      const tiles = await np.getByTestId('area-map-tile').count();
      if (tiles !== 15) throw new Error(`the map drew ${tiles} tiles, not 15`);
      const near = await np.getByTestId('nearby').first().innerText();
      if (!/University of Illinois Main Quad\s+about 2\.0 mi/.test(near)) throw new Error(`what's nearby reads "${near.replace(/\s+/g, ' ')}"`);
      const html = await np.content();
      if (html.includes(STREET)) throw new Error('the street is in the public page');
      if (/40\.1233|88\.2582/.test(html)) throw new Error('the exact point is in the public page');
      await np.getByTestId('area-map').first().scrollIntoViewIfNeeded();
      await np.screenshot({ path: join(SHOTS, 'C2-area-map.png'), fullPage: true });
    });
  } finally {
    clearTimeout(killer);
    if (BREAK) { try { undoFault(FAULTS[BREAK]); } catch (e) { console.error(`door-journeys: could not undo the ${BREAK} fault: ${e.message}`); } }
    if (browser) await browser.close().catch(() => {});
    server.close();
    pgrst.kill();
    writeFileSync(join(SHOTS, 'results.json'), JSON.stringify(results, null, 2));
  }
  return results;
}

function verdict(r) {
  if (BREAK) {
    const want = FAULTS[BREAK].step;
    const hit = r.find((x) => x[0].startsWith(`${want} `));
    if (hit && hit[1] === 'FAIL') { console.log(`door-journeys: CAUGHT — the ${BREAK} fault failed ${want}, as it must`); process.exit(0); }
    console.log(`door-journeys: NOT CAUGHT — the ${BREAK} fault left ${want} ${hit ? 'passing' : 'unreached'}; this journey proves nothing about it`);
    process.exit(1);
  }
  const bad = r.filter((x) => x[1] !== 'pass');
  console.log(`door-journeys: ${r.length - bad.length} of ${r.length} steps passed`);
  process.exit(bad.length ? 1 : 0);
}
// A failing step throws out of run(); the results so far are still the verdict.
let RESULTS = [];
run().then(verdict).catch((e) => { console.error(`door-journeys: ${e.message}`); verdict(RESULTS); });

export { randomUUID };
