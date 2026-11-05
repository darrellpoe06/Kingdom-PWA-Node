// =============================================================================
// surface-sweep — every registered surface is OPENED in a real browser, on
// every push, and a surface that cannot open is caught before a person finds it
// =============================================================================
// Darrell, 2026-11-05 (DR-1330, D1): "various user flows debugging tests so
// users don't have basic bugs... automated"; "Navigating between all playwright
// automated test site.... to test our sites or pages".
//
// THE GAP, MEASURED: 1,802 vitest files mount components directly; the one
// end-to-end journey in CI walks property doors (DR-0934); about twenty
// browser probes each ask one question of one page. Nothing opened each of
// the ~70 surfaces the registry declares and asked the only question a user
// asks first: did it open? The 2026-08-13 shared-link miss (live-link-probe)
// was this class: 7,678 tests green, the shell's routing never walked.
//
// WHAT IT DOES. The registry (app/src/surfaces.js) is the list — parsed, not
// copied, so a surface is swept from the commit that registers it (HOLD-THE-
// HAND: a new workflow joins at birth). Each distinct route is opened in
// Chromium at a phone width and a laptop width, on the built dist served the
// way Pages serves it, against the stub backend CI builds with. Four things
// fail a route, each a basic bug a user would meet:
//   1. PAGE ERROR  — an uncaught exception reached the window.
//   2. BOUNDARY    — the per-surface boundary (lib/surface-boundary.jsx) or the
//                    app-wide ErrorBoundary rendered its recovery card.
//   3. FELL THROUGH — the route rendered the Overview instead of itself (a dead
//                    branch; the shell's VALID list falls back to overview).
//   4. HOLLOW SHELL — the main region rendered nothing a person could read.
// A locked tile, an upgrade prompt, or an honest "could not reach" card is a
// PASS: those are the app telling the truth about access or the backend. The
// sweep judges whether the surface OPENS, not whether its data is there —
// the data gates (RLS legs, journeys) judge that.
//
// Console errors are COUNTED and printed per route, never failed on: the stub
// backend refuses every call by design, and a sweep that fails on expected
// network noise is a gate that gets disabled (required-reading hook's own rule).
//
// PROVEN TO CATCH (DR-0076 §3), two faults, each exits 0 only when its own
// check tripped and nothing else did:
//   --break=chunk:<surface-id>  the surface's lazy chunk is answered with a
//                               module that throws on evaluation; the boundary
//                               must render and check 2 must trip.
//   --break=pageerror           an init script throws after load on the first
//                               route; check 1 must trip.
//
// COVERAGE IS COUNTED (DR-0323): the number of routes judged is asserted
// against the number parsed, and the parse must find at least MIN_SURFACES
// entries, so a parser that silently reads nothing cannot pass.
//
// Usage: node scripts/e2e/surface-sweep.mjs [distDir] [--break=...] [--widths=390,1440]
// Exit 0 every route opened (or the planted fault was caught); 1 a route
// failed (it says which, with the page's own text); 2 setup.
// Bounded: every wait has a timeout; the whole run is capped (SWEEP_BUDGET_MS).
// =============================================================================
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, normalize, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MIN_SURFACES = 60;
export const BASE = '/poetech-app';
export const DEFAULT_WIDTHS = [390, 1440];
export const BOUNDARY_SIGNS = ['hit an error', 'Something went wrong on this screen'];

/**
 * Read the registry as text and return one entry per `{ id: ... }` line.
 * Pure: no React, no import of the registry (it carries JSX and lazy loaders).
 * @returns {{id:string,label:string,nav:string,view:string,sub:string|null,loadFile:string}[]}
 */
export function parseRegistry(source) {
  const out = [];
  const re =
    /\{\s*id:\s*'([^']+)'\s*,\s*label:\s*(?:'([^']*)'|"([^"]*)")\s*,\s*nav:\s*'([^']+)'\s*,\s*view:\s*'([^']+)'\s*,\s*sub:\s*(?:'([^']+)'|null)[^}]*?import\('([^']+)'\)/g;
  let m;
  while ((m = re.exec(source))) {
    out.push({ id: m[1], label: m[2] ?? m[3] ?? m[1], nav: m[4], view: m[5], sub: m[6] || null, loadFile: basename(m[7]).replace(/\.(jsx?|mjs)$/, '') });
  }
  return out;
}

/** The URL (query only) that opens a surface: the shell reads ?view= and ?sub=. */
export function routeFor(entry) {
  return entry.sub ? `?view=${entry.view}&sub=${entry.sub}` : `?view=${entry.view}`;
}

/** Distinct routes, first entry wins (three church entries share sub=conference). */
export function distinctRoutes(entries) {
  const seen = new Map();
  for (const e of entries) {
    const r = routeFor(e);
    if (!seen.has(r)) seen.set(r, e);
  }
  return [...seen.entries()].map(([route, entry]) => ({ route, entry }));
}

/**
 * Judge one opened route from what the browser measured. Pure.
 * @param {{pageErrors:string[], bodyText:string, mainText:string, overviewMainText:string}} m
 * @returns {string[]} failures, empty when the route opened
 */
export function judge(m, label) {
  const out = [];
  if (m.pageErrors.length) out.push(`${label}: page error — ${m.pageErrors[0].slice(0, 160)}`);
  // Case-insensitive on purpose: the boundary card's heading is uppercased by
  // CSS and innerText returns the transformed text ("RENTALS HIT AN ERROR" —
  // the first chunk selftest read the card and still missed it).
  const body = (m.bodyText || '').toLowerCase();
  const sign = BOUNDARY_SIGNS.find((s) => body.includes(s.toLowerCase()));
  if (sign) out.push(`${label}: an error boundary rendered ("${sign}")`);
  const main = (m.mainText || '').replace(/\s+/g, ' ').trim();
  if (main.length < 40) out.push(`${label}: hollow — main region holds ${main.length} characters`);
  else if (m.overviewMainText && main === m.overviewMainText.replace(/\s+/g, ' ').trim() && !label.startsWith('?view=overview')) {
    out.push(`${label}: fell through to the Overview (a dead route)`);
  }
  return out;
}

export function parseArgs(argv) {
  const args = { dist: null, breakSpec: '', widths: DEFAULT_WIDTHS, only: null };
  for (const a of argv) {
    if (a.startsWith('--break=')) args.breakSpec = a.slice('--break='.length);
    // --only=<id,id> narrows the sweep to named surfaces: for the planted-fault
    // runs in CI (seconds, not minutes) and for a local look at one surface.
    // Never for the real pass — coverage is the point of the real pass.
    else if (a.startsWith('--only='))
      args.only = a
        .slice('--only='.length)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    else if (a.startsWith('--widths='))
      args.widths = a
        .slice('--widths='.length)
        .split(',')
        .map((n) => Number(n))
        .filter((n) => n > 0);
    else if (!a.startsWith('--')) args.dist = a;
  }
  return args;
}

// ─── main ──────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1]);
if (isMain) {
  // A variable, so vitest (which imports this file for its pure functions) does not resolve the package at
  // collect time, where it is not installed; and no shebang above, because vite's web transform prepends an
  // import for a non-literal dynamic import and a shebang on line 1 then no longer parses (found 2026-11-05).
  const pw = 'playwright-core';
  const { chromium } = await import(/* @vite-ignore */ pw);
  const args = parseArgs(process.argv.slice(2));
  const DIST = args.dist || fileURLToPath(new URL('../../app/dist', import.meta.url));
  const REGISTRY = fileURLToPath(new URL('../../app/src/surfaces.js', import.meta.url));
  const BUDGET_MS = Number(process.env.SWEEP_BUDGET_MS || 600000);
  const IDLE_CAP_MS = 10000;
  const started = Date.now();
  const over = () => Date.now() - started > BUDGET_MS;

  if (!existsSync(join(DIST, 'index.html'))) {
    console.error(`surface-sweep: no index.html in ${DIST} — build the app first`);
    process.exit(2);
  }
  const entries = parseRegistry(readFileSync(REGISTRY, 'utf8'));
  if (entries.length < MIN_SURFACES) {
    console.error(`surface-sweep: parsed only ${entries.length} registry entries (< ${MIN_SURFACES}) — the parser no longer reads surfaces.js`);
    process.exit(2);
  }
  const routes = distinctRoutes(args.only ? entries.filter((e) => args.only.includes(e.id)) : entries);
  if (args.only && routes.length !== args.only.length) {
    console.error(`surface-sweep: --only named ${args.only.length} surfaces but ${routes.length} resolved`);
    process.exit(2);
  }
  console.log(
    `surface-sweep: ${entries.length} registered surfaces, ${routes.length} ${args.only ? 'selected' : 'distinct'} routes, widths ${args.widths.join('/')}`
  );

  // The planted fault, if any.
  let breakKind = '',
    breakTarget = null;
  if (args.breakSpec) {
    const [kind, id] = args.breakSpec.split(':');
    breakKind = kind;
    if (kind === 'chunk') {
      breakTarget = entries.find((e) => e.id === id);
      if (!breakTarget) {
        console.error(`surface-sweep: --break=chunk:${id} names no registry entry`);
        process.exit(2);
      }
    } else if (kind !== 'pageerror') {
      console.error(`surface-sweep: unknown --break kind "${kind}"`);
      process.exit(2);
    }
  }

  const MIME = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.webmanifest': 'application/manifest+json',
    '.woff2': 'font/woff2',
    '.png': 'image/png',
  };
  const server = createServer((req, res) => {
    let path = (req.url || '/').split('?')[0];
    if (path.startsWith('/voice/') || path.startsWith('/voice-lite/') || path.startsWith('/sb/') || path.startsWith('/n8n/')) {
      res.writeHead(404);
      res.end();
      return;
    }
    if (path.startsWith(BASE)) path = path.slice(BASE.length) || '/';
    if (path === '/') path = '/index.html';
    const file = normalize(join(DIST, path));
    if (!file.startsWith(normalize(DIST)) || !existsSync(file)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(readFileSync(join(DIST, 'index.html')));
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const origin = `http://127.0.0.1:${server.address().port}`;

  const launchOpts = process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : { channel: 'chrome' };
  let browser;
  try {
    browser = await chromium.launch(launchOpts);
  } catch {
    browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  }

  // The same clock at every hour (chrome-layout-probe's lesson): a pinned
  // quiet instant in Champaign, Date only, timers untouched.
  const QUIET = new Date('2026-09-29T10:00:00-05:00').getTime();
  const pin = (page) =>
    page.addInitScript((target) => {
      const RealDate = Date;
      const off = target - RealDate.now();
      class PinnedDate extends RealDate {
        constructor(...a) {
          if (a.length === 0) super(RealDate.now() + off);
          else super(...a);
        }
        static now() {
          return RealDate.now() + off;
        }
      }
      globalThis.Date = new Proxy(PinnedDate, { apply: () => new PinnedDate().toString() });
    }, QUIET);

  const chunkFor = (entry) => `**/assets/${entry.loadFile}-*.js`;
  let failures = [],
    judged = 0,
    consoleErrors = 0,
    tripped = [];

  async function open(route, width, { plantPageError = false } = {}) {
    // Service workers are blocked: a worker-served chunk bypasses page.route,
    // which would let the planted chunk fault slip past (measured: the first
    // chunk selftest opened Rentals normally). The worker has its own gate
    // (scripts/sw-nav-check.mjs); this sweep judges the app, not the cache.
    const context = await browser.newContext({ viewport: { width, height: 900 }, timezoneId: 'America/Chicago', serviceWorkers: 'block' });
    const page = await context.newPage();
    await pin(page);
    await page.addInitScript(() => {
      try {
        localStorage.setItem('poe-landing-seen', '1');
        localStorage.setItem('poetech.help.tour.v1', 'seen');
      } catch (_) {
        /* private mode */
      }
    });
    if (plantPageError)
      await page.addInitScript(() => {
        setTimeout(() => {
          throw new Error('surface-sweep planted page error');
        }, 400);
      });
    if (breakKind === 'chunk') {
      await page.route(chunkFor(breakTarget), (r) =>
        r.fulfill({ status: 200, contentType: 'text/javascript', body: "throw new Error('surface-sweep planted chunk fault');" })
      );
    }
    const pageErrors = [];
    let errs = 0;
    page.on('pageerror', (e) => pageErrors.push(String((e && e.message) || e)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errs += 1;
    });
    await page.goto(`${origin}${BASE}/${route}`, { waitUntil: 'networkidle', timeout: IDLE_CAP_MS }).catch(() => {});
    await page.waitForSelector('main', { timeout: 15000 }).catch(() => {});
    // Lazy surfaces resolve after the shell paints; give them a settle. A
    // chunk that fails is healed by ONE reload (lib/chunk-reload-heal.js)
    // before its boundary shows, so the settle waits for a second main too.
    await page.evaluate(() => new Promise((r) => setTimeout(r, 700)));
    await page.waitForSelector('main', { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => new Promise((r) => setTimeout(r, Number(window.__SWEEP_SETTLE_MS__ || 700))));
    const m = await page.evaluate(() => ({
      bodyText: document.body ? document.body.innerText : '',
      mainText: (document.querySelector('main') || document.body || {}).innerText || '',
    }));
    if (process.env.SWEEP_DEBUG) console.log(`debug    ${route}@${width}px main: ${m.mainText.replace(/\s+/g, ' ').slice(0, 400)}`);
    await context.close();
    consoleErrors += errs;
    return { ...m, pageErrors, consoleErrors: errs };
  }

  try {
    for (const width of args.widths) {
      if (over()) {
        failures.push(`budget of ${BUDGET_MS}ms exceeded before ${width}px`);
        break;
      }
      // The Overview's own text is the fall-through fingerprint for this width.
      const overview = await open('?view=overview', width);
      for (const { route, entry } of routes) {
        if (over()) {
          failures.push(`budget of ${BUDGET_MS}ms exceeded at ${route}@${width}px`);
          break;
        }
        const plant = breakKind === 'pageerror' && judged === 0;
        const m = await open(route, width, { plantPageError: plant });
        const label = `${route}@${width}px (${entry.id})`;
        const verdict = judge({ ...m, overviewMainText: overview.mainText }, label);
        judged += 1;
        if (verdict.length) {
          if (breakKind && ((breakKind === 'chunk' && entry.id === breakTarget.id) || plant)) {
            tripped.push(...verdict);
            console.log(`caught   ${verdict[0]}`);
          } else failures.push(...verdict);
        } else console.log(`opened   ${label} — ${m.mainText.replace(/\s+/g, ' ').trim().length} chars, ${m.consoleErrors} console errors`);
      }
    }
  } finally {
    await browser.close().catch(() => {});
    server.close();
  }

  const expected = routes.length * args.widths.length;
  if (judged !== expected) failures.push(`coverage: judged ${judged} of ${expected} route×width cases`);
  if (breakKind) {
    if (!tripped.length) {
      console.error(
        `surface-sweep: PLANTED FAULT NOT CAUGHT (${args.breakSpec}) — the sweep cannot fail, which is the painted-gate class DR-0076 §3 exists to kill`
      );
      process.exit(1);
    }
    if (failures.length) {
      console.error(`surface-sweep: the planted fault also tripped unrelated routes:\n  ${failures.join('\n  ')}`);
      process.exit(1);
    }
    console.log(
      `surface-sweep: planted fault ${args.breakSpec} CAUGHT (${tripped.length} trip(s)); ${judged} cases judged, ${consoleErrors} console errors counted`
    );
    process.exit(0);
  }
  if (failures.length) {
    console.error(`surface-sweep: ${failures.length} FAILED of ${judged} cases:\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
  console.log(
    `surface-sweep: OK — ${judged} cases opened (${routes.length} routes × ${args.widths.length} widths), ${consoleErrors} console errors counted, ${Math.round((Date.now() - started) / 1000)}s`
  );
}
