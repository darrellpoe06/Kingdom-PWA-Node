// =============================================================================
// door-journeys — END TO END: real Chromium, the real built app, PostgREST,
// and a real PostgreSQL carrying the real migrations (DR-0934)
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
import { geocodeResponse } from '../../app/functions/geocode.js';

// A secret that exists only for this throwaway stack.
const JWT_SECRET = 'e2e-door-journeys-throwaway-secret-0123456789abcdef';
const GATEWAY_PORT = 4173;
const PGRST_PORT = 3999;
const PHOTO_PORT = 3998;
const PHOTO_TOKEN = 'e2e-photo-token';
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
const HEIC = process.env.E2E_HEIC || '';   // a real phone HEIC (CI downloads libheif's example, checksum pinned)

function fail(code, msg) { console.error(`door-journeys: ${msg}`); process.exit(code); }
if (!existsSync(join(DIST, 'properties', 'app', 'index.html'))) fail(2, `no built Properties app in ${DIST} (vite build first)`);
if (!PSQL.length || !DB_URI) fail(2, 'set E2E_PSQL and E2E_DB_URI');
mkdirSync(SHOTS, { recursive: true });

const sql = (text) => execFileSync(PSQL[0], [...PSQL.slice(1), '-v', 'ON_ERROR_STOP=1', '-qAt', '-c', text], { encoding: 'utf8' }).trim();

// ---------------------------------------------------------------------------
// The seed: one family, one short-stay door whose family HOLDS its street
// (DR-0977: the street shows unless the family holds it), so the stranger's
// page proves a held street stays hidden. H1 then shows it.
// ---------------------------------------------------------------------------
const OWNER = '00000000-0000-4000-a000-00000000e2e1';
const INSTANCE = '00000000-0000-4000-b000-00000000e2e1';
const DOOR = '00000000-0000-4000-c000-00000000e2e1';
const DOOR2 = '00000000-0000-4000-c000-00000000e2e2';
const STREET = '805 North Prospect Avenue';
function seed() {
  sql(`
    DELETE FROM door_stays WHERE rental_id = '${DOOR}';
    DELETE FROM property_photos WHERE rental_ref IN ('${DOOR}', '${DOOR2}');
    DELETE FROM rent_records WHERE instance_id = '${INSTANCE}';
    DELETE FROM rentals WHERE id IN ('${DOOR}', '${DOOR2}');
    DELETE FROM instance_members WHERE instance_id = '${INSTANCE}';
    DELETE FROM instances WHERE id = '${INSTANCE}';
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
      VALUES ('00000000-0000-0000-0000-000000000000', '${OWNER}', 'authenticated', 'authenticated', 'owner@e2e.local', '', now(), now())
      ON CONFLICT (id) DO NOTHING;
    INSERT INTO instances (id, slug, display_name, instance_type) VALUES ('${INSTANCE}', 'poe-properties-e2e', 'Poe Properties E2E', 'business');
    INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES ('${INSTANCE}', '${OWNER}', 'owner', 'Owner');
    INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, city, state, property_type, status, listed_at, offering, nightly_rate, address_visibility, showcase_order, monthly_rent, weekly_rate, building_note)
      VALUES ('${DOOR}', '${INSTANCE}', '${OWNER}', 'E2E-APT2', '${STREET} Apt 2', '${STREET}', 'Apt 2', 'Champaign', 'Illinois', 'multi-family', 'vacant', now(), 'short-term', 150, 'after-application', 1, 800, 200, 'Laundry in the entry');
    -- A SECOND DOOR IN THE REAL ESTATE SHAPE (DR-0999): the whole address typed
    -- into one field, no town of its own, not advertised. The family's app
    -- holds it in its parts by itself (G1 reads the row).
    INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, city, state, property_type, status, showcase_order)
      VALUES ('${DOOR2}', '${INSTANCE}', '${OWNER}', 'r-1508williamsburg', '1508 Williamsburg, Champaign, IL, 61821', '1508 Williamsburg, Champaign, IL, 61821', '', '', '', 'single-family', 'paying', 2);
    -- (a fresh insert carries no area; the family's app places it by itself, E1)
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
    sql: `CREATE OR REPLACE FUNCTION public.rental_address_is_public(p_visibility text) RETURNS boolean LANGUAGE sql IMMUTABLE AS $f$ SELECT true $f$;`,
    restore: `${MIG}/0280-the-address-shows-unless-the-family-holds-it.sql`,
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
  archive: {
    step: 'G1',
    // Refuses exactly the archive G1 picks, so the seed's own writes (B1's
    // repair names 1508Williamsburg) still land and E1 is untouched.
    sql: `CREATE OR REPLACE FUNCTION public.e2e_fault_archive() RETURNS trigger LANGUAGE plpgsql AS $f$ BEGIN IF NEW.photo_channel = '805NProspect' THEN RAISE EXCEPTION 'e2e fault: archive' USING ERRCODE = 'check_violation'; END IF; RETURN NEW; END $f$;
          DROP TRIGGER IF EXISTS e2e_fault_archive ON public.rentals;
          CREATE TRIGGER e2e_fault_archive BEFORE UPDATE ON public.rentals FOR EACH ROW EXECUTE FUNCTION public.e2e_fault_archive();`,
    restore: 'DROP TRIGGER IF EXISTS e2e_fault_archive ON public.rentals; DROP FUNCTION IF EXISTS public.e2e_fault_archive();',
  },
  source: {
    step: 'G2',
    // Without 0285's index the database files the same NAS picture twice.
    sql: 'DROP INDEX IF EXISTS public.property_photos_source_once;',
    // G2's own proof leaves the twice-filed picture behind, and a unique index
    // cannot be rebuilt over it: the rows go first, then 0285 comes back.
    restore: [
      `DELETE FROM public.property_photos WHERE source IS NOT NULL AND rental_ref IN ('${DOOR}', '${DOOR2}');`,
      `${MIG}/0285-a-nas-picture-is-filed-once.sql`,
    ],
  },
  cadence: {
    step: 'A1',
    // Without the weekly price the card has no true month to print beside it.
    sql: `UPDATE public.rentals SET weekly_rate = NULL WHERE id = '${DOOR}';`,
    restore: `UPDATE public.rentals SET weekly_rate = 200 WHERE id = '${DOOR}';`,
  },
  area: {
    step: 'E1',
    sql: `CREATE OR REPLACE FUNCTION public.rentals_area_rounded() RETURNS trigger LANGUAGE plpgsql AS $f$ BEGIN RAISE EXCEPTION 'e2e fault: no area' USING ERRCODE = 'check_violation'; END $f$;`,
    restore: [
      `${MIG}/0270-the-public-shelf-shows-the-area-on-a-map.sql`,
      `${MIG}/0273-a-shared-home-says-so-on-the-shelf.sql`,
      `${MIG}/0278-a-bed-is-not-a-bedroom.sql`,
      `${MIG}/0280-the-address-shows-unless-the-family-holds-it.sql`,
      `${MIG}/0281-a-bed-still-says-it-is-a-bed-when-the-street-shows.sql`,
      `${MIG}/0282-each-door-shows-the-apartment-in-its-own-order.sql`,
      `${MIG}/0283-a-held-door-shows-its-buildings-area.sql`,
    ],
  },
  calendar: {
    step: 'C1',
    sql: `CREATE OR REPLACE FUNCTION public.door_booked_nights(p_rental uuid, p_from date, p_to date) RETURNS TABLE (taken_from date, taken_to date) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $f$ SELECT NULL::date, NULL::date WHERE false $f$;`,
    restore: `${MIG}/0269-a-short-stay-door-has-a-booking-calendar.sql`,
  },
});
const BREAK = (process.argv.find((a) => a.startsWith('--break=')) || '').slice('--break='.length);
let undoFailed = '';
if (BREAK && !FAULTS[BREAK]) fail(2, `unknown --break=${BREAK} (one of: ${Object.keys(FAULTS).join(', ')})`);
function applyFile(path) { execFileSync(PSQL[0], [...PSQL.slice(1), '-v', 'ON_ERROR_STOP=1', '-q', '-f', path], { encoding: 'utf8', stdio: ['ignore', 'ignore', 'inherit'] }); }
// A restore may be a LIST of files: re-applying one migration can rebuild an
// object a later one owns (0270 recreates public_vacancies() without 0278's
// levels and 0280's street), so the restore replays the chain after it too.
function undoFault(f) { for (const r of [].concat(f.restore)) { if (r.endsWith('.sql')) applyFile(r); else sql(r); } }

// ---------------------------------------------------------------------------
// PostgREST behind a gateway that answers the paths the app calls.
// ---------------------------------------------------------------------------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };

// The page runs under production's own Content-Security-Policy (app/public/
// _headers), so a decoder or worker the real site would block fails here too.
// One directive is left out: upgrade-insecure-requests would move this plain
// http gateway's own requests to https, which a local harness does not serve.
const ROOT_DIR = new URL('../..', import.meta.url).pathname;
export const CSP = (() => {
  const line = readFileSync(join(ROOT_DIR, 'app/public/_headers'), 'utf8').split('\n').find((l) => /^\s+Content-Security-Policy:/.test(l));
  if (!line) throw new Error('no Content-Security-Policy in app/public/_headers');
  return line.replace(/^\s+Content-Security-Policy:\s*/, '').split(';').map((d) => d.trim()).filter((d) => d && d !== 'upgrade-insecure-requests').join('; ');
})();

// THE REAL NAS PHOTO SERVER (DR-0999; LESSONS P59). infra/nas-property-photos/
// photo_server.py itself, over real HTTP, with a fixture standing in for
// Synology Chat and a generated JPEG for the phone backup. The gateway
// proxies /nas-photos/* to it the way the Funnel mount does on the NAS.
const OVERPASS_PHOTO = { channel: '805NProspect', id: '9001', name: '20240123_144917.jpg' };
// A 64x48 solid JPEG (Pillow, q70): the last road for the fixture above.
const FIXTURE_JPEG_B64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAwAEADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDl6KKKZ5oUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAH//2Q==';
function startPhotoServer() {
  const root = join(SHOTS, 'nas');
  const pdir = join(root, 'photos', '2024', '01');
  mkdirSync(pdir, { recursive: true });
  // The phone backup's JPEG, by three roads -- the same ones photo_server.py's
  // own selftest and listing_size take: Pillow (the NAS's, and CI installs it),
  // else ImageMagick's convert, else a small JPEG held here so the run never
  // dies on its fixture (a bare GitHub runner has neither; CI's "0a0598c1b"
  // run died on "convert ENOENT"). The road is printed; E2E_NO_PIL=1 skips
  // Pillow so the other roads are proven where Pillow exists.
  const jpg = join(pdir, OVERPASS_PHOTO.name);
  let road = 'none';
  if (!process.env.E2E_NO_PIL) {
    try { execFileSync('python3', ['-c', `from PIL import Image; Image.new('RGB', (2400, 1600), (47, 93, 80)).save(${JSON.stringify(jpg)}, format='JPEG', quality=80)`], { stdio: 'ignore' }); road = 'pillow'; } catch (_) { road = 'none'; }
  }
  if (road === 'none') {
    try { execFileSync('convert', ['-size', '2400x1600', 'xc:#2F5D50', jpg], { stdio: 'ignore' }); road = 'convert'; } catch (_) { road = 'none'; }
  }
  if (road === 'none') { writeFileSync(jpg, Buffer.from(FIXTURE_JPEG_B64, 'base64')); road = 'held'; }
  console.log(`door-journeys: phone-backup fixture by the ${road} road`);
  const fixture = join(root, 'chat.json');
  writeFileSync(fixture, JSON.stringify({ channels: [
    { name: OVERPASS_PHOTO.channel, posts: [{ id: OVERPASS_PHOTO.id, create_at: 1705891200000, name: OVERPASS_PHOTO.name, text: 'the porch, winter' }] },
    { name: '709CommercialSt', posts: [] },
    { name: '1508Williamsburg', posts: [] },
  ] }));
  const tokenFile = join(root, 'token.txt');
  writeFileSync(tokenFile, `${PHOTO_TOKEN}\n`);
  const p = spawn('python3', ['infra/nas-property-photos/photo_server.py', '--serve', '--host', '127.0.0.1', '--port', String(PHOTO_PORT), '--token-file', tokenFile], {
    stdio: ['ignore', 'inherit', 'inherit'],
    env: {
      ...process.env,
      PHOTO_CHAT_FIXTURE: fixture,
      PHOTO_ROOTS: join(root, 'photos', '{y}', '{m}'),
      PHOTO_UNDATED_ROOTS: join(root, 'photos', '*', '*'),
      PHOTO_UPLOAD_ROOT: join(root, 'uploads'),
    },
  });
  return p;
}

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

// The Census geocoder's answer for 805 N Prospect, recorded (its shape:
// result.addressMatches[0].coordinates {x: longitude, y: latitude}).
const CENSUS_RECORDED = async () => ({
  ok: true, status: 200,
  json: async () => ({ result: { addressMatches: [{ matchedAddress: '805 N PROSPECT AVE, CHAMPAIGN, IL, 61820', coordinates: { x: -88.25828, y: 40.123364 } }] } }),
});
const GEOCODES = [];
// OpenStreetMap's Overpass answer around 805, recorded (DR-0998): one park the
// Champaign research does not list, and a supermarket it does (so the merge
// keeps the researched line and drops the duplicate). Every ask is counted.
const OVERPASS_RECORDED = { elements: [
  { type: 'way', center: { lat: 40.128, lon: -88.262 }, tags: { leisure: 'park', name: 'Garden Hills Park' } },
  { type: 'node', lat: 40.1372, lon: -88.2463, tags: { shop: 'supermarket', name: 'Schnucks' } },
] };
const OVERPASS_ASKS = [];
const TILE_FETCHES = {};

function gateway() {
  return createServer((req, res) => {
    const url = new URL(req.url, BASE);
    if (url.pathname.startsWith('/nas-photos/')) {
      const target = url.pathname.slice('/nas-photos'.length) + url.search;
      const headers = { ...req.headers, host: `127.0.0.1:${PHOTO_PORT}` };
      const up = httpRequest({ host: '127.0.0.1', port: PHOTO_PORT, path: target, method: req.method, headers }, (r) => {
        res.writeHead(r.statusCode || 502, r.headers); r.pipe(res);
      });
      up.on('error', () => { res.writeHead(502); res.end(); });
      req.pipe(up);
      return;
    }
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
    // THE REAL /geocode ROUTE (app/functions/geocode.js), with the Census
    // answer recorded rather than fetched: a run never calls the Census or
    // OpenStreetMap. Every lookup is counted, so a journey can prove that
    // nothing is looked up until somebody asks for a map (DR-0977).
    if (url.pathname === '/geocode') {
      GEOCODES.push(url.searchParams.get('q'));
      geocodeResponse(url.href, CENSUS_RECORDED).then(async (r) => {
        res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(await r.text());
      }, () => { res.writeHead(500); res.end(); });
      return;
    }
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
    const type = MIME[extname(file)] || 'application/octet-stream';
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store', ...(type === 'text/html' ? { 'content-security-policy': CSP } : {}) });
    res.end(readFileSync(file));
  });
}

/** The width in a JPEG's start-of-frame header (baseline or progressive). */
function jpegWidth(buf) {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker === 0xc0 || marker === 0xc2) return buf.readUInt16BE(i + 7);
    i += 2 + len;
  }
  return null;
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
  const photos = startPhotoServer();
  const server = gateway();
  await new Promise((r) => server.listen(GATEWAY_PORT, '127.0.0.1', r));
  const killer = setTimeout(() => { console.error('door-journeys: over budget'); process.exit(1); }, BUDGET_MS);
  const results = RESULTS;
  let browser;
  try {
    await waitFor(async () => {
      const r = await fetch(`http://127.0.0.1:${PGRST_PORT}/`).catch(() => null);
      const ph = await fetch(`http://127.0.0.1:${PHOTO_PORT}/healthz`).catch(() => null);
      return r && r.status < 500 && ph && ph.ok;
    }, 'PostgREST and the photo server to answer', 30000);
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
    // Every tile request is counted per context, so C2 can prove none is
    // fetched before the visitor asks for the map (DR-0977).
    const hermetic = async (ctx, name = '') => {
      await ctx.route('https://tile.openstreetmap.org/**', (r) => { if (name) TILE_FETCHES[name] = (TILE_FETCHES[name] || 0) + 1; return r.fulfill({ status: 200, contentType: 'image/png', body: PNG }); });
      // What is nearby (DR-0998) is asked of Overpass; answered here, never fetched.
      await ctx.route('https://overpass-api.de/**', (r) => { OVERPASS_ASKS.push(name || 'ctx'); return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(OVERPASS_RECORDED) }); });
      return ctx;
    };
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
    await step('A1 the public door lists the short-stay place, without the street its family holds', async () => {
      await gp.goto(`${BASE}/properties/app/?properties=1`, { waitUntil: 'domcontentloaded' });
      await gp.getByRole('button', { name: /Looking for a place/i }).click({ timeout: 15000 });
      await gp.getByText(/Champaign/).first().waitFor({ timeout: 15000 });
      await gp.screenshot({ path: join(SHOTS, 'A1-listing.png'), fullPage: true });
      const text = await gp.locator('body').innerText();
      if (text.includes(STREET)) throw new Error(`the held street "${STREET}" is on the public page (DR-0977: held until they apply or book)`);
      // ANY CADENCE, THE TRUE MONTH BESIDE EACH (DR-1003): $200 a week is
      // $867 a month on average and $1,000 in a five-week month, said on the
      // card beside the $800 month, with which is the better deal.
      const cad = await gp.getByTestId('vacancy-cadence').first().innerText({ timeout: 15000 });
      if (!cad.includes('Weekly $200 ($867 a month on average, $1,000 in a five-week month)')) throw new Error(`the true month is not beside the weekly price: "${cad}"`);
      const deal = await gp.getByTestId('vacancy-deal').first().innerText();
      if (!/Monthly is the better deal: \$67 a month less than weekly on average/.test(deal)) throw new Error(`the better deal is not said: "${deal}"`);
      const bld = await gp.getByTestId('vacancy-building').first().innerText();
      if (!bld.includes('Laundry in the entry')) throw new Error(`what the building offers is not on the card: "${bld}"`);
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
    // The family key this device holds, so the NAS reads are made (DR-0999).
    await owner.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* none */ } }, ['poetech-chat-bridge-token', PHOTO_TOKEN]);
    const op = watch(await owner.newPage(), 'owner'); current = op;
    await step('B1 the family sees the door with its full address', async () => {
      await op.goto(`${BASE}/properties/app/?properties=1`, { waitUntil: 'domcontentloaded' });
      await op.getByText(STREET).locator('visible=true').first().waitFor({ timeout: 20000 });
      await op.screenshot({ path: join(SHOTS, 'B1-family-doors.png'), fullPage: true });
    });
    await step('B2 the family confirms the ask in the Stays tab', async () => {
      await op.getByText(STREET).locator('visible=true').first().click();
      await op.getByRole('button', { name: /^Stays$/ }).first().click({ timeout: 15000 });
      await op.getByTestId('stay-ask').first().waitFor({ timeout: 15000 });
      await op.getByRole('button', { name: /^Confirm$/ }).first().click();
      await waitFor(() => sql(`SELECT status FROM door_stays WHERE rental_id = '${DOOR}' AND check_in = '${IN}'`) === 'confirmed', 'the stay to read confirmed in the database');
      await op.screenshot({ path: join(SHOTS, 'B2-confirmed.png'), fullPage: true });
      const ev = sql(`SELECT string_agg(event, ',' ORDER BY at) FROM door_events WHERE subject = 'stay' AND subject_id = (SELECT id FROM door_stays WHERE rental_id = '${DOOR}' AND check_in = '${IN}')`);
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
    await step('E1 the family\'s app places the door from its own address BY ITSELF; the database keeps the rounded area and what is near it (DR-0998)', async () => {
      // Nobody pressed anything: opening the family's app (B1) placed it.
      await waitFor(() => sql(`SELECT coalesce(area_lat::text,'') || ',' || coalesce(area_lng::text,'') FROM rentals WHERE id = '${DOOR}'`) === '40.12500,-88.26000', 'the area to read 40.12500,-88.26000 in the database', 30000);
      // One lookup per building, by the address AS HELD: the second door was
      // repaired first (G1 reads it), so it is asked for as its parts, not as
      // its one-line field. The recorded answer is 805's house, which is not
      // 1508, so that door is REFUSED a place (matchesAddress), end to end.
      // The two lookups are 1.1 s apart (placeDoorsOnTheMap's gap), and the
      // first area can be in the database before the second ask has left the
      // phone: wait for both asks, never read the list mid-flight (CI on
      // c93e3bb3f saw one ask where the sandbox always saw two).
      await waitFor(() => GEOCODES.length >= 2, 'both buildings to be looked up', 20000);
      const asked = GEOCODES.slice().sort();
      if (asked.join('|') !== ['1508 Williamsburg, Champaign, IL', `${STREET}, Champaign, Illinois`].join('|')) throw new Error(`the addresses were looked up as "${GEOCODES.join('|')}"`);
      if (OVERPASS_ASKS.length !== 1) throw new Error(`what is nearby was asked ${OVERPASS_ASKS.length} times, not once (the refused door must never reach it)`);
      if (sql(`SELECT count(*) FROM rentals WHERE id = '${DOOR2}' AND area_lat IS NOT NULL`) !== '0') throw new Error('the wrong-house answer was saved as the second door\'s area');
      // Nearest first, measured from THIS door's own point: the recorded park
      // (not in the Champaign research) leads; the research fills the rest.
      const lines = sql(`SELECT jsonb_array_length(nearby) || '|' || (nearby->0->>'label') || '|' || (nearby->1->>'label') FROM rentals WHERE id = '${DOOR}'`);
      if (lines !== '12|Garden Hills Park|I-74 at Exit 181') throw new Error(`the nearby lines read "${lines}"`);
      if (sql(`SELECT count(*) FROM rentals WHERE id = '${DOOR}' AND nearby::text ILIKE '%Schnucks (grocery)%'`) !== '0') throw new Error('the researched Schnucks line was duplicated by OpenStreetMap\'s');
      if (!sql(`SELECT notes FROM rentals WHERE id = '${DOOR}'`).includes('Placed on the map from its address (automatic)')) throw new Error('the door\'s notes carry no trace of the placement');
      await op.getByRole('button', { name: /^Doors$/ }).first().click({ timeout: 15000 });
      await op.getByRole('button', { name: /^Edit( door)?$/ }).first().click({ timeout: 15000 });
      await op.getByTestId('area-status').waitFor({ timeout: 15000 });
      const status = await op.getByTestId('area-status').innerText();
      if (!status.includes('This door is on the map')) throw new Error(`the editor says "${status}"`);
      await op.screenshot({ path: join(SHOTS, 'E1-placed-by-itself.png'), fullPage: true });
    });

    // G. One record, both doors (DR-0999): the family's app held the second
    // door's whole-line address in its parts by itself; the archive is picked
    // from the list the REAL NAS photo server serves, and lands on the row.
    await step('G1 the address is held in its parts by itself, and the archive is picked from the NAS\'s own list', async () => {
      // The repair ran on the family's first visit (B1), with its trace.
      await waitFor(() => sql(`SELECT address || '|' || city || '|' || state || '|' || coalesce(zip,'') FROM rentals WHERE id = '${DOOR2}'`) === '1508 Williamsburg|Champaign|IL|61821', 'the second door to be held in its parts', 30000);
      if (!sql(`SELECT notes FROM rentals WHERE id = '${DOOR2}'`).includes('was "1508 Williamsburg, Champaign, IL, 61821"')) throw new Error('the repair left no trace in the notes');
      if (sql(`SELECT photo_channel FROM rentals WHERE id = '${DOOR2}'`) !== '1508Williamsburg') throw new Error('the old list\'s archive was not written onto the record');
      if (sql(`SELECT count(*) FROM rentals WHERE id = '${DOOR}' AND address_held_at IS NOT NULL`) !== '1') throw new Error('the first door was not marked held');
      // The editor (still open from E1): the archive select was filled by the
      // real server, and the address line reads the one pattern.
      const sel = op.getByTestId('door-archive');
      await sel.waitFor({ timeout: 15000 });
      const options = await sel.locator('option').allInnerTexts();
      if (!options.some((o) => o.startsWith('805NProspect (1 picture)')) || !options.some((o) => o.startsWith('709CommercialSt (0 pictures)'))) throw new Error(`the archive list reads ${JSON.stringify(options)}`);
      const line = await op.getByTestId('door-address-line').innerText();
      if (!line.includes(`${STREET}, Apt 2, Champaign, Illinois`)) throw new Error(`the address line reads "${line}"`);
      await sel.selectOption('805NProspect');
      await op.getByRole('button', { name: /^Save the change$/ }).click();
      await waitFor(() => sql(`SELECT photo_channel FROM rentals WHERE id = '${DOOR}'`) === '805NProspect', 'the archive to land on the row');
      await op.screenshot({ path: join(SHOTS, 'G1-archive-picked.png'), fullPage: true });
    });

    // F. A HEIC from a phone is kept, not skipped (DR-0939). Darrell's Samsung:
    // "Skipped 14: 6660.heic (the image could not be decoded on this device".
    // Chromium has no HEIC decoder, exactly like Chrome on Android, so this is
    // the fallback, under production's CSP.
    if (HEIC) {
      await step('F1 a HEIC picture from a phone is converted and filed as a JPEG', async () => {
        await op.getByRole('button', { name: /^Pictures$/ }).first().click({ timeout: 15000 });
        await op.locator('input[type="file"][multiple]').first().setInputFiles({ name: '6660.heic', mimeType: '', buffer: readFileSync(HEIC) });
        await op.getByRole('button', { name: /^Add to the gallery$/ }).waitFor({ timeout: 90000 });
        const skipped = await op.getByText(/^Skipped/).count();
        if (skipped) throw new Error(`the picture was skipped: ${await op.getByText(/^Skipped/).first().innerText()}`);
        await op.getByRole('button', { name: /^Add to the gallery$/ }).click();
        await waitFor(() => sql(`SELECT count(*) FROM property_photos WHERE rental_ref = '${DOOR}' AND storage_path LIKE 'data:image/jpeg%' AND thumb_path LIKE 'data:image/jpeg%'`) === '1', 'a JPEG picture and thumbnail on the door', 30000);
        // Measured, not assumed: the stored JPEG's own frame header says its size.
        const full = Buffer.from(sql(`SELECT split_part(storage_path, ',', 2) FROM property_photos WHERE rental_ref = '${DOOR}'`), 'base64');
        const w = jpegWidth(full);
        if (!(w >= 1280)) throw new Error(`the full picture is ${w}px wide; the HEIC is 1280px, so it was shrunk to a thumbnail or not decoded`);
        console.log(`      (stored ${w}px wide, ${Math.round(full.length / 1024)} KB)`);
        await op.screenshot({ path: join(SHOTS, 'F1-heic-filed.png'), fullPage: true });
      });
    } else console.log('  (F1 skipped: set E2E_HEIC to a HEIC file to walk it)');

    // G2. FROM THE NAS (DR-1002): the whole library by month, read from the
    // real photo server's folders (no Synology sign-in); one picture filed
    // on the listing at listing size with its source on the row; the second
    // copy refused by the database itself.
    await step('G2 a NAS picture is filed on the listing from the whole library, once', async () => {
      await op.getByRole('button', { name: /^Pictures$/ }).first().click({ timeout: 15000 });
      await op.getByTestId('nas-shelf').waitFor({ timeout: 20000 });
      await op.getByTestId('nas-shelf-pick').selectOption('library');
      await op.getByTestId('nas-month').fill('2024-01');
      await op.getByTestId(`nas-tile-${OVERPASS_PHOTO.name}`).waitFor({ timeout: 30000 });
      const timing = await op.getByTestId('nas-shelf-timing').innerText();
      if (!/read in \d+\.\d s over the same-origin road/.test(timing)) throw new Error(`the read was not timed and named: "${timing}"`);
      await op.getByTestId(`nas-use-${OVERPASS_PHOTO.name}`).click();
      const src = `nas:library:${OVERPASS_PHOTO.name}`;
      await waitFor(() => sql(`SELECT count(*) FROM property_photos WHERE rental_ref = '${DOOR}' AND source = '${src}' AND kind = 'listing'`) === '1', 'the NAS picture to be filed on the listing with its source', 30000);
      const full = Buffer.from(sql(`SELECT split_part(storage_path, ',', 2) FROM property_photos WHERE rental_ref = '${DOOR}' AND source = '${src}'`), 'base64');
      const w = jpegWidth(full);
      if (!(w > 0 && w <= 1920)) throw new Error(`the filed picture is ${w}px wide; listing size is at most 1920`);
      if (sql(`SELECT length(thumb_path) > 100 FROM property_photos WHERE rental_ref = '${DOOR}' AND source = '${src}'`) !== 't') throw new Error('the filed picture has no thumbnail');
      await op.getByTestId(`nas-tile-${OVERPASS_PHOTO.name}-filed`).waitFor({ timeout: 20000 });
      console.log(`      (filed ${w}px wide, ${Math.round(full.length / 1024)} KB; ${timing})`);
      // NEVER TWICE: the database refuses a second copy on this door (0285).
      let refused = false;
      try {
        sql(`INSERT INTO property_photos (instance_id, rental_ref, kind, caption, storage_path, thumb_path, source) VALUES ('${INSTANCE}', '${DOOR}', 'listing', 'again', 'data:image/jpeg;base64,/9j/4AAQ', 'data:image/jpeg;base64,/9j/4AAQ', '${src}')`);
      } catch (_) { refused = true; }
      if (!refused) throw new Error('the same NAS picture was filed on the same door twice (is 0285\'s index there?)');
      await op.screenshot({ path: join(SHOTS, 'G2-nas-filed.png'), fullPage: true });
    });

    // C. The next stranger sees those nights dark.
    const next = await hermetic(await browser.newContext({ viewport: { width: 412, height: 915 } }), 'next');
    const np = watch(await next.newPage(), 'next'); current = np;
    await step('C1 the booked nights are dark for the next guest', async () => {
      await np.goto(`${BASE}/properties/app/?properties=1`, { waitUntil: 'domcontentloaded' });
      await np.getByRole('button', { name: /Looking for a place/i }).click({ timeout: 15000 });
      await np.getByRole('button', { name: /Book a stay/i }).first().click({ timeout: 15000 });
      await waitFor(async () => (await np.locator(`button[aria-label^="${IN}"]`).first().getAttribute('data-taken')) === 'yes', `the night of ${IN} to show taken`);
      await np.screenshot({ path: join(SHOTS, 'C1-dark-nights.png'), fullPage: true });
    });
    await step('C2 the next guest gets a map only when asking for it: the area and what is nearby, never the held street or the point', async () => {
      await np.getByTestId('show-map').first().waitFor({ timeout: 15000 });
      if (TILE_FETCHES.next) throw new Error(`${TILE_FETCHES.next} map tile(s) were fetched before anyone asked for the map`);
      const near = await np.getByTestId('nearby').first().innerText();
      if (!/University of Illinois Main Quad\s+about 2\.0 mi/.test(near)) throw new Error(`what's nearby reads "${near.replace(/\s+/g, ' ')}"`);
      await np.getByTestId('show-map').first().click();
      await np.getByTestId('area-map').first().waitFor({ timeout: 15000 });
      const tiles = await np.getByTestId('area-map-tile').count();
      if (tiles !== 15) throw new Error(`the map drew ${tiles} tiles, not 15`);
      const html = await np.content();
      if (html.includes(STREET)) throw new Error('the held street is in the public page');
      if (/40\.1233|88\.2582/.test(html)) throw new Error('the exact point is in the public page');
      if (await np.getByTestId('street-view').count()) throw new Error('a held street offered Street view');
      if (await np.getByTestId('area-map-pin').count()) throw new Error('a held street was given a pin');
      if (!(await np.getByTestId('area-map-circle').count())) throw new Error('the held door drew no area circle');
      await np.getByTestId('area-map').first().scrollIntoViewIfNeeded();
      await np.screenshot({ path: join(SHOTS, 'C2-area-map.png'), fullPage: true });
    });

    // H. The family shows the street (DR-0977: the default, which this door had held).
    await step('H1 the family shows the street; the next visitor gets a pin on the house and Street view at it (DR-0997)', async () => {
      await op.getByRole('button', { name: /^Doors$/ }).first().click({ timeout: 15000 });
      const edit = op.getByRole('button', { name: /^Edit( door)?$/ }).first();
      if (!(await op.getByTestId('address-visibility').count())) await edit.click({ timeout: 15000 });
      await op.getByTestId('address-visibility').selectOption('public');
      await op.getByRole('button', { name: /^Save the change$/ }).click();
      await waitFor(() => sql(`SELECT address_visibility FROM rentals WHERE id = '${DOOR}'`) === 'public', 'the door to read public');
      const third = await hermetic(await browser.newContext({ viewport: { width: 412, height: 915 } }));
      const tp = watch(await third.newPage(), 'third'); current = tp;
      await tp.goto(`${BASE}/properties/app/?properties=1`, { waitUntil: 'domcontentloaded' });
      await tp.getByRole('button', { name: /Looking for a place/i }).click({ timeout: 15000 });
      await tp.getByTestId('street-view').first().waitFor({ timeout: 15000 });
      const text = await tp.locator('body').innerText();
      if (!text.includes(STREET)) throw new Error('the shown street is not on the public page');
      const before = await tp.getByTestId('street-view').first().getAttribute('href');
      if (before !== `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${STREET}, Champaign, Illinois`)}`) throw new Error(`Street view points at ${before} before the house is known`);
      const asked = GEOCODES.length;
      await tp.getByTestId('show-map').first().click();
      await tp.getByTestId('area-map-pin').first().waitFor({ timeout: 15000 });
      if (GEOCODES.length !== asked + 1 || GEOCODES[GEOCODES.length - 1] !== `${STREET}, Champaign, Illinois`) throw new Error(`the house was looked up as "${GEOCODES.slice(asked).join('|')}"`);
      if (await tp.getByTestId('area-map-circle').count()) throw new Error('a shown street drew the area circle instead of the house');
      const after = await tp.getByTestId('street-view').first().getAttribute('href');
      if (after !== 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=40.123364,-88.258280') throw new Error(`Street view points at ${after}`);
      await tp.getByTestId('area-map').first().scrollIntoViewIfNeeded();
      await tp.screenshot({ path: join(SHOTS, 'H1-street-shown.png'), fullPage: true });
    });
  } finally {
    clearTimeout(killer);
    // A fault that stays behind makes the NEXT run prove the wrong thing
    // (DR-0076): an undo that fails is red, however the step itself went.
    if (BREAK) { try { undoFault(FAULTS[BREAK]); } catch (e) { undoFailed = `could not undo the ${BREAK} fault: ${e.message}`; console.error(`door-journeys: ${undoFailed}`); } }
    if (browser) await browser.close().catch(() => {});
    server.close();
    pgrst.kill();
    photos.kill();
    writeFileSync(join(SHOTS, 'results.json'), JSON.stringify(results, null, 2));
  }
  return results;
}

function verdict(r) {
  if (BREAK) {
    const want = FAULTS[BREAK].step;
    const hit = r.find((x) => x[0].startsWith(`${want} `));
    if (hit && hit[1] === 'FAIL') {
      console.log(`door-journeys: CAUGHT — the ${BREAK} fault failed ${want}, as it must`);
      if (undoFailed) { console.error(`door-journeys: but the fault is still in the database (${undoFailed}); the next run would prove the wrong thing`); process.exit(1); }
      process.exit(0);
    }
    console.log(`door-journeys: NOT CAUGHT — the ${BREAK} fault left ${want} ${hit ? 'passing' : 'unreached'}; this journey proves nothing about it`);
    process.exit(1);
  }
  const bad = r.filter((x) => x[1] !== 'pass');
  console.log(`door-journeys: ${r.length - bad.length} of ${r.length} steps passed`);
  // A run that reached no step proved nothing; green must mean something
  // (DR-0076 S3). CI's 0a0598c1b run printed "0 of 0 steps passed" and went
  // green after its fixture died -- never again.
  if (!r.length) { console.error('door-journeys: no step ran -- a run that proves nothing is red'); process.exit(1); }
  process.exit(bad.length ? 1 : 0);
}
// A failing step throws out of run(); the results so far are still the verdict.
let RESULTS = [];
run().then(verdict).catch((e) => { console.error(`door-journeys: ${e.message}`); verdict(RESULTS); });

export { randomUUID };
