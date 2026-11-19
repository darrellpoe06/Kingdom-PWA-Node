// =============================================================================
// door-account-probe — the picture at the PoeTech door's top right, measured
// =============================================================================
// DR-1600. Darrell 2026-11-19, the PoeTech app on his tablet: "What happened
// to the image in the top right corner of PoeTech App for getting access like
// the Love Corner App?" His screenshot was the COLLAPSED header, which since
// DR-1046 is what a fresh device opens on, and where no account rendered.
//
// Measured in a real Chromium on the built app (jsdom has no layout), signed
// in through the e2e stand-in (scripts/e2e/app-journeys.mjs: a minted session
// for a fictitious .local person, answered by a stub auth origin; NOT a real
// account, so the menu's surfaces are proven to OPEN, not what a real member
// sees in them) and signed out. Invariants, at each case:
//   A1. THE PICTURE IS THERE, at the top right: signed in, the round picture
//       button; signed out, the Log in box. On screen, inside the header,
//       its right edge within 96px of the screen's right edge.
//   A2. IT IS A FULL BUTTON: 36px or more both ways at every text size (the
//       header is a chrome region, where a px size shrinks, DR-1579).
//   A3. NOTHING SITS UNDER IT: no other header control and no painted brand
//       words overlap it.
//   A4. THE MENU IS REACHABLE (signed in): one tap opens it; it is inside
//       the screen left to right; every row is 43px or more; the first and
//       last rows are the topmost thing at their centers (nothing covers them,
//       the big-text bottom bar included).
//   A5. NOTHING OVERFLOWS the page horizontally.
// Usage (full matrix, by hand): node scripts/door-account-probe.mjs [distDir] [--json=out.json] [--ci (the CI subset only)]
// The CI layout probe (chrome-layout-probe.mjs) runs DOOR_ACCOUNT_CI_CASES
// from this file, and its --selftest-break shrinks the picture and throws the
// menu off screen; A2 and A4 must trip.
// =============================================================================
import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STANDIN, standinStorageKey, standinSession, standinAnswer } from './e2e/app-journeys.mjs';

export const SIZES = ['normal', 'large', 'larger', 'largest', 'bigprint'];
export const THEMES = ['heritage', 'midnight'];
// Phones 320-412, a tablet held both ways (768, 1024), a laptop.
export const WIDTHS = [320, 360, 390, 412, 768, 1024, 1440];

/** Every case of the full matrix. */
export function fullMatrix() {
  const out = [];
  for (const width of WIDTHS) for (const size of SIZES) for (const theme of THEMES) for (const collapsed of [true, false]) for (const signedIn of [true, false]) out.push({ width, size, theme, collapsed, signedIn });
  return out;
}

// The CI subset: both header states signed in at a phone and a tablet, the two
// trapping sizes, dark, and signed out once each way.
export const DOOR_ACCOUNT_CI_CASES = Object.freeze([
  { width: 360, size: 'normal', theme: 'heritage', collapsed: true, signedIn: true },
  { width: 360, size: 'normal', theme: 'heritage', collapsed: false, signedIn: true },
  { width: 768, size: 'normal', theme: 'midnight', collapsed: true, signedIn: true },
  { width: 1024, size: 'larger', theme: 'heritage', collapsed: false, signedIn: true },
  { width: 390, size: 'bigprint', theme: 'midnight', collapsed: true, signedIn: true },
  { width: 412, size: 'largest', theme: 'heritage', collapsed: false, signedIn: true },
  { width: 320, size: 'normal', theme: 'heritage', collapsed: true, signedIn: false },
  { width: 768, size: 'bigprint', theme: 'heritage', collapsed: false, signedIn: false },
]);

export const DOOR_ACCOUNT_BREAK_CSS =
  '.acct-btn, .acct-pic { width: 13px !important; height: 13px !important; min-height: 0 !important } .acct-menu { right: auto !important; left: -400px !important }';

/** Ready a page for one case: storage set before the app boots, the stand-in answered when signed in. */
export async function prepareDoorAccountPage(page, { size, theme, collapsed, signedIn }) {
  const session = signedIn ? JSON.stringify(standinSession()) : null;
  await page.addInitScript(
    ([sz, th, col, key, sess]) => {
      try {
        localStorage.setItem('poetech.help.tour.v1', 'seen');
        // The Arrivals list opens itself once per session for a signed-in reader
        // and covers the page (components/ArrivalsBell.jsx); a person closes it
        // first, so the probe starts past it, as it starts past the help tour.
        sessionStorage.setItem('poetech:arrivals-opened-on-launch', '1');
        // The "Who's using this device?" picker covers the page until a profile
        // is chosen once (poe-current-profile); the probe has chosen Family.
        localStorage.setItem('poe-current-profile', 'family');
        // And the signed-in welcome card (SelfServeWelcome), dismissed once.
        localStorage.setItem('poe-selfserve-welcomed', '1');
        localStorage.setItem('poe-text-size', sz);
        localStorage.setItem('poe-theme-pref', th);
        localStorage.setItem('poe-header-collapsed', col ? '1' : '0');
        if (sess) localStorage.setItem(key, sess);
      } catch (_) {
        /* private mode */
      }
    },
    [size, theme, collapsed, standinStorageKey(), session]
  );
  await page.context().route(`${STANDIN.supabaseUrl}/**`, (route) => {
    const req = route.request();
    const a = standinAnswer(req.method(), new URL(req.url()).pathname, req.headers()['authorization'] || '');
    return route.fulfill({ status: a.status, contentType: 'application/json', body: a.body, headers: { 'access-control-allow-origin': '*' } });
  });
}

/** Measure one prepared, loaded page. Opens the menu when signed in. */
export async function measureDoorAccount(page, { signedIn }) {
  const sel = signedIn ? '[data-testid="door-avatar"]' : '[data-testid="door-login"]';
  await page.waitForSelector(sel, { state: 'visible', timeout: 20000 }).catch(() => {});
  const m = await page.evaluate((s) => {
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const ctl = document.querySelector(s);
    const header = ctl && ctl.closest('header');
    if (!ctl || !header) return { none: true, vw, size: document.documentElement.getAttribute('data-text-size'), theme: document.querySelector('[data-theme]')?.getAttribute('data-theme') };
    const R = (el) => el.getBoundingClientRect();
    const r = R(ctl);
    const hr = R(header);
    const pic = ctl.querySelector('.acct-pic');
    const pr = pic ? R(pic) : null;
    const visible = (el) => {
      const b = R(el);
      if (!b.width || !b.height) return false;
      const cs = getComputedStyle(el);
      return cs.visibility !== 'hidden' && cs.display !== 'none';
    };
    const account = ctl.closest('[data-testid="door-account"]');
    const under = [];
    const overlap = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
    // What is ON SCREEN of a control: its box cut by every ancestor that clips
    // (a tab scrolled out of the tab strip's scroll box is not under anything).
    const shown = (el) => {
      const b = R(el);
      let c = { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
          const ab = R(a);
          c = { left: Math.max(c.left, ab.left), right: Math.min(c.right, ab.right), top: Math.max(c.top, ab.top), bottom: Math.min(c.bottom, ab.bottom) };
        }
      }
      return c;
    };
    for (const el of header.querySelectorAll('button, a, input, select')) {
      if (account.contains(el) || el.contains(ctl) || !visible(el)) continue;
      if (overlap(r, shown(el))) under.push((el.getAttribute('data-testid') || el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 24));
    }
    for (const el of header.querySelectorAll('h1, [data-testid="top-brand-name"], [data-testid="top-brand-tagline"]')) {
      if (!el.firstChild || !visible(el)) continue;
      const range = document.createRange();
      range.selectNodeContents(el);
      const g = range.getBoundingClientRect();
      if (overlap(r, g)) under.push(`brand words "${el.textContent.trim().slice(0, 20)}"`);
    }
    return {
      vw,
      vh,
      size: document.documentElement.getAttribute('data-text-size'),
      theme: header.closest('[data-theme]')?.getAttribute('data-theme') || null,
      ctl: { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) },
      pic: pr ? { w: Math.round(pr.width), h: Math.round(pr.height) } : null,
      header: { top: Math.round(hr.top), bottom: Math.round(hr.bottom) },
      inCollapsedRow: !!ctl.closest('[data-testid="top-nav-account"]'),
      under,
      overflow: document.documentElement.scrollWidth > vw + 1,
    };
  }, sel);
  if (m.none || !signedIn) return m;
  await page.click(sel).catch(() => {});
  await page.waitForSelector('[data-testid="door-account-menu"]', { state: 'visible', timeout: 5000 }).catch(() => {});
  m.menu = await page.evaluate(() => {
    const menu = document.querySelector('[data-testid="door-account-menu"]');
    if (!menu) return null;
    const vw = document.documentElement.clientWidth;
    const b = menu.getBoundingClientRect();
    const rows = [...menu.querySelectorAll('[role="menuitem"]')];
    const topmost = (el) => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!hit && (hit === el || el.contains(hit));
    };
    return {
      left: Math.round(b.left),
      right: Math.round(b.right),
      top: Math.round(b.top),
      bottom: Math.round(b.bottom),
      inside: b.left >= -0.5 && b.right <= vw + 0.5 && b.top >= -0.5,
      rows: rows.map((r) => r.textContent.trim()),
      minRowH: Math.round(Math.min(...rows.map((r) => r.getBoundingClientRect().height))),
      firstClear: rows.length ? topmost(rows[0]) : false,
      lastClear: rows.length ? topmost(rows[rows.length - 1]) : false,
    };
  });
  return m;
}

/** The invariants for one measurement; an empty list is a pass. */
export function judgeDoorAccount(m, c) {
  const out = [];
  if (m.none) return ['A1: no account control rendered'];
  if (m.size !== c.size) return [`data-text-size="${m.size}", expected ${c.size}; nothing was measured`];
  const k = m.ctl;
  if (k.left < 0 || k.right > m.vw + 1 || k.top < 0 || k.bottom > m.vh + 1) out.push(`A1: the control is off screen (${k.left}..${k.right} x ${k.top}..${k.bottom} of ${m.vw}x${m.vh})`);
  if (k.top < m.header.top - 1 || k.bottom > m.header.bottom + 1) out.push(`A1: the control is outside the header (${k.top}..${k.bottom}, header ${m.header.top}..${m.header.bottom})`);
  if (m.vw - k.right > 96) out.push(`A1: the control is ${m.vw - k.right}px from the right edge (96px at most: the top right)`);
  if (c.collapsed !== m.inCollapsedRow) out.push(`A1: header ${c.collapsed ? 'collapsed' : 'open'} but the control ${m.inCollapsedRow ? 'is' : 'is not'} in the collapsed row`);
  if (k.w < 35.5 || k.h < 35.5) out.push(`A2: the control is ${k.w}x${k.h}px; 36px is the floor`);
  if (m.pic && (m.pic.w < 35.5 || m.pic.h < 35.5)) out.push(`A2: the picture is ${m.pic.w}x${m.pic.h}px; 36px is the floor`);
  for (const u of m.under) out.push(`A3: ${u} overlaps the account control`);
  if (c.signedIn) {
    if (!m.menu) out.push('A4: tapping the picture opened no menu');
    else {
      if (!m.menu.inside) out.push(`A4: the menu runs off screen (${m.menu.left}..${m.menu.right}, top ${m.menu.top}, of ${m.vw})`);
      if (m.menu.minRowH < 43) out.push(`A4: a menu row is ${m.menu.minRowH}px tall (44px rows)`);
      if (!m.menu.firstClear || !m.menu.lastClear) out.push('A4: something covers the menu (first or last row is not the topmost thing at its center)');
    }
  }
  if (m.overflow) out.push('A5: the page overflows horizontally');
  return out;
}

export const caseName = (c) => `door-account@${c.width}px [${c.size}, ${c.theme}, ${c.collapsed ? 'collapsed' : 'open'}, ${c.signedIn ? 'signed in' : 'signed out'}]`;

export const PROBE_PATH = '/poetech-app/?view=overview';

// ── the full matrix, by hand ──────────────────────────────────────────────────
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1]);
if (isMain) {
  const { chromium } = await import('playwright-core').catch(() => import('playwright'));
  const pos = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const jsonOut = (process.argv.find((a) => a.startsWith('--json=')) || '').slice(7);
  const DIST = pos[0] || fileURLToPath(new URL('../app/dist', import.meta.url));
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error(`door-account-probe: no index.html in ${DIST}; build the app first`);
    process.exit(2);
  }
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
  const server = createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.startsWith('/poetech-app')) p = p.slice('/poetech-app'.length) || '/';
    let file = normalize(join(DIST, p));
    if (!file.startsWith(DIST) || !existsSync(file) || p.endsWith('/')) file = join(DIST, 'index.html');
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
  } catch {
    browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  }
  const results = [];
  let failed = 0;
  const cases = process.argv.includes('--ci') ? [...DOOR_ACCOUNT_CI_CASES] : fullMatrix();
  for (const c of cases) {
    const ctx = await browser.newContext({ viewport: { width: c.width, height: c.width >= 768 ? 1024 : 800 } });
    const page = await ctx.newPage();
    await prepareDoorAccountPage(page, c);
    await page.goto(`${origin}${PROBE_PATH}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    const m = await measureDoorAccount(page, c);
    await ctx.close();
    const errs = judgeDoorAccount(m, c);
    results.push({ ...c, m, errs });
    if (errs.length) {
      failed += 1;
      for (const e of errs) console.error(`FAIL ${caseName(c)}: ${e}`);
    } else {
      console.log(`ok   ${caseName(c)} control ${m.ctl.w}x${m.ctl.h}${m.pic ? ` pic ${m.pic.w}x${m.pic.h}` : ''} right-gap ${m.vw - m.ctl.right} top ${m.ctl.top}${m.menu ? ` menu ${m.menu.rows.length} rows, ${m.menu.left}..${m.menu.right}, rows>=${m.menu.minRowH}px` : ''}`);
    }
  }
  await browser.close();
  server.close();
  if (jsonOut) writeFileSync(jsonOut, JSON.stringify(results, null, 1));
  console.log(`door-account-probe: ${cases.length - failed} of ${cases.length} cases passed`);
  process.exit(failed ? 1 : 0);
}
