// =============================================================================
// app-journeys — a person's walks through the built app, in a real browser,
// on every push: taps, typing, a shared link landing where it says it will
// =============================================================================
// DR-1330 D2 (Darrell, 2026-11-05: "various user flows debugging tests so
// users don't have basic bugs... automated"). The sweep proves a surface
// opens; these prove the thing a person came to do can be done. Dist only:
// the built app on the same gateway the sweep uses, a trusted host (no sign-in
// wall), the stub backend. Nothing here needs a database; the walks that do
// are door-journeys (DR-0934). The registry is scripts/e2e/journeys.mjs and
// the coverage guard is scripts/journey-coverage-guard.mjs.
//
// Each journey asserts from the rendered DOM, never the URL. A failing step
// prints the page's own text and the console lines around it (door-journeys'
// pattern), so a red step names its cause.
//
// PROVEN TO CATCH (DR-0076 §3), each exits 0 only when its own journey failed
// and no other did:
//   --break=link   the lesson id in the shared link is replaced by one that
//                  does not exist; lesson-link-lands must fail.
//   --break=taps   pointer events are taken away from every tap target; the
//                  tapping journeys must fail and the typing journey may not.
//   --break=signin the signed-in stand-in is withheld, so the TLC Assistant
//                  never mounts (the tier gate shows its locked card);
//                  office-assistant-answers must fail and no other journey may.
//
// THE SIGNED-IN STAND-IN (DR-0076: say what it is). Some surfaces mount only
// for a signed-in tier. For those journeys (SIGNED_IN_JOURNEYS) the runner
// stands in for the auth server and the database the way door-journeys does:
// it MINTS a JWT with a throwaway secret that exists only in this file, for a
// fictitious person (office-standin@e2e.local, a .local address no mail
// server answers), places the session where supabase-js keeps it, and answers
// the stub Supabase origin the dist was built against (ci.yml builds with
// https://test-stub.supabase.co) from standinAnswer() below: /auth/v1/user is
// read from the token after its signature is checked, member_subscriptions
// holds one active 'business' row (the tier the Assistant's gate asks for),
// every other read is empty and every write is accepted and recorded. It is
// NOT a real account, NOT a real secret, and NOT the real auth server or
// database: it proves the app mounts and works the surface for a signed-in
// business-tier session, never that sign-in itself or the RLS walls work
// (those are door-journeys and the SQL smokes).
//
// Usage: node scripts/e2e/app-journeys.mjs [distDir] [--only=id,id] [--break=link|taps|signin]
// Exit 0 every journey passed (or the planted fault was caught); 1 a journey
// failed; 2 setup. Bounded by JOURNEYS_BUDGET_MS and per-wait timeouts.
// =============================================================================
import { createServer } from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BASE = '/poetech-app';
export const LESSON_LINK = '?view=church&sub=learn&course=made-in-time&lesson=mit5-those-who-know-their-god';
export const LESSON_LINK_COURSE = 'Made in Time';

// ── the signed-in stand-in (see the header): pure, pinned in vitest ─────────
export const STANDIN = Object.freeze({
  // The origin the dist's supabase-js talks to. ci.yml's surface-sweep leg
  // builds with this value; a dist built against another origin is answered
  // by nothing here and the signed-in journey fails signed out (honestly).
  supabaseUrl: process.env.JOURNEYS_SUPABASE_URL || 'https://test-stub.supabase.co',
  // A secret that exists only in this file, for this throwaway stand-in.
  secret: 'app-journeys-standin-throwaway-secret-not-a-real-key',
  userId: '00000000-0000-4000-8000-00000000e2e1',
  email: 'office-standin@e2e.local',
  tier: 'business',
});

const b64url = (s) => Buffer.from(s).toString('base64url');
/** An HS256 JWT signed with the stand-in's throwaway secret. */
export function mintStandinJwt(payload, secret = STANDIN.secret) {
  const h = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const p = b64url(JSON.stringify(payload));
  return `${h}.${p}.${createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url')}`;
}
/** The claims of a token this stand-in signed, or null (bad shape or signature). */
export function verifyStandinJwt(token, secret = STANDIN.secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const want = Buffer.from(createHmac('sha256', secret).update(`${parts[0]}.${parts[1]}`).digest('base64url'));
  const got = Buffer.from(parts[2]);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  } catch {
    return null;
  }
}
/** Where supabase-js v2 keeps the session for a project URL (sb-<first host label>-auth-token). */
export function standinStorageKey(url = STANDIN.supabaseUrl) {
  return `sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
}
/** The session object supabase-js reads from storage; good for a year from nowSec. */
export function standinSession(nowSec = Math.floor(Date.now() / 1000)) {
  const exp = nowSec + 3600 * 24 * 365;
  const user = { id: STANDIN.userId, aud: 'authenticated', role: 'authenticated', email: STANDIN.email, app_metadata: {}, user_metadata: {} };
  const access_token = mintStandinJwt({ sub: STANDIN.userId, role: 'authenticated', aud: 'authenticated', email: STANDIN.email, exp });
  return { access_token, token_type: 'bearer', expires_in: exp - nowSec, expires_at: exp, refresh_token: 'app-journeys-standin', user };
}
/**
 * The stand-in's answer to one request to the stub Supabase origin. Pure.
 * @returns {{status:number, body:string}}
 */
export function standinAnswer(method, pathname, authorization = '') {
  const json = (status, v) => ({ status, body: JSON.stringify(v) });
  const m = /^Bearer\s+(.+)$/.exec(authorization || '');
  const claims = m ? verifyStandinJwt(m[1]) : null;
  const signedIn = !!claims && claims.role === 'authenticated';
  if (pathname === '/auth/v1/user') {
    return signedIn ? json(200, standinSession().user) : json(401, { message: 'no session' });
  }
  if (pathname === '/auth/v1/token') return json(200, standinSession());
  if (pathname === '/auth/v1/logout') return { status: 204, body: '' };
  if (pathname.startsWith('/rest/v1/')) {
    if (pathname === '/rest/v1/member_subscriptions') {
      return json(200, signedIn ? [{ tier: STANDIN.tier, status: 'active', current_period_end: '2099-01-01T00:00:00Z' }] : []);
    }
    if (pathname.startsWith('/rest/v1/rpc/')) return json(200, null);
    return method === 'GET' || method === 'HEAD' ? json(200, []) : json(201, []);
  }
  return json(404, {});
}

export function parseArgs(argv) {
  const a = { dist: null, only: null, breakKind: '' };
  for (const x of argv) {
    if (x.startsWith('--only='))
      a.only = x
        .slice(7)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    else if (x.startsWith('--break=')) a.breakKind = x.slice(8);
    else if (!x.startsWith('--')) a.dist = x;
  }
  return a;
}

// The walks. Each is (page, t) => Promise<void>; t carries the helpers.
const JOURNEY_DEFS = {
  // DR-1664: every member (and a signed-out visitor, as here) opens Learn in the new look, so a
  // shared lesson link lands on THAT lesson's cover (title, Read, Listen); the classic lesson
  // space is the fail-safe only. Either one counts as landing on the lesson.
  async 'lesson-link-lands'(page, t) {
    await t.open(page, t.link);
    const title = await t.textOf(page, '.ls-cover .ls-cover-title, [data-testid="lesson-space-title"]', 20000);
    if (!title) throw new Error('no lesson opened: neither the new-look cover (.ls-cover-title) nor [data-testid="lesson-space-title"] rendered');
    const body = await t.body(page);
    if (!body.includes(LESSON_LINK_COURSE)) throw new Error(`the course heading "${LESSON_LINK_COURSE}" is not on the page`);
    if (await page.locator('iframe[src*="youtube"]').count()) throw new Error('a YouTube player is mounted — the link landed on the Worship tab');
  },
  // DR-1664: Learn opens in the new look for everyone. A reader taps Learn, taps the first lesson
  // picture (the Lessons list opens on Pictures), taps Read Lesson on its cover, and the lesson
  // opens in the Lesson Experience.
  async 'learn-by-taps'(page, t) {
    await t.open(page, '?view=church');
    await t.tap(page, 'button:text-is("Learn")', 'the Learn sub-tab');
    // The Learning Zone opens on its discovery front door (DR-1699); "Browse All Lessons" is the way into the existing Learn.
    await t.tap(page, '[data-testid="learn-discover"] button:text-is("Browse All Lessons")', 'Browse All Lessons on the Learning Zone front door');
    await page.locator('[data-testid="lessons-in-order"]').first().waitFor({ timeout: 20000 });
    await t.tap(page, '[data-testid="lessons-in-order"] button.ls-card', 'the first lesson picture');
    await t.tap(page, '.ls-cover button:text-is("Read Lesson")', 'Read Lesson on its cover');
    // Read opens the lesson as a page (.le-book-title); Watch puts its title on the stage (.le-title).
    const title = await t.textOf(page, '.le-root .le-book-title, .le-root .le-title', 20000);
    if (!title) throw new Error('tapping a lesson did not open it: no lesson title in the Lesson Experience');
  },
  // Darrell 2026-11-25, from the live build: "Buttons don't go anywhere for anything on this
  // screen." The Institute's buttons switched a section that sat below the fold, so a tap looked
  // dead, and nothing in CI tapped them. This walk taps every tile and counter of the redesigned
  // Institute and requires what a person requires: the section it names is ON SCREEN afterwards.
  async 'institute-buttons-by-taps'(page, t) {
    await t.open(page, '?view=church&sub=institute&instituteStudio=1');
    await page.locator('[data-testid="institute-studio"]').first().waitFor({ timeout: 20000 });
    const ids = await page
      .locator('[data-testid^="institute-studio-tile-"], [data-testid^="institute-studio-stat-"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')));
    if (ids.length < 6) throw new Error(`the Institute shows ${ids.length} tiles and counters; a person expects at least six`);
    const opened = new Set();
    for (const id of ids) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await t.tap(page, `[data-testid="${id}"]`, id);
      await page.waitForTimeout(700); // the scroll to the section is animated
      const at = await page.evaluate(() => {
        const el = document.querySelector('[data-testid="institute-sections"]');
        const tab = [...document.querySelectorAll('[role="tab"]')].find((x) => x.getAttribute('aria-selected') === 'true');
        return el ? { top: Math.round(el.getBoundingClientRect().top), h: window.innerHeight, tab: tab ? tab.textContent.trim() : '' } : null;
      });
      if (!at) throw new Error(`after tapping ${id} there is no section area on the page`);
      if (at.top < 0 || at.top > at.h * 0.6) throw new Error(`tapping ${id} left its section off screen (top ${at.top}px of a ${at.h}px screen)`);
      if (!at.tab) throw new Error(`after tapping ${id} no section is marked open`);
      opened.add(at.tab);
    }
    if (opened.size < 4) throw new Error(`the buttons opened only ${opened.size} different sections: ${[...opened].join(', ')}`);
  },
  async 'top-tabs-by-taps'(page, t) {
    await t.open(page, '?view=about');
    const tabs = await page.locator('[data-testid^="dock-tab-"]').all();
    if (tabs.length < 3) throw new Error(`the dock shows ${tabs.length} tabs; a person needs at least three to tap`);
    let last = await t.main(page);
    let walked = 0;
    for (const tab of tabs.slice(0, 6)) {
      const id = await tab.getAttribute('data-testid');
      await tab.click({ timeout: 5000 });
      await t.settle(page);
      const now = await t.main(page);
      if (now === last) throw new Error(`tapping ${id} changed nothing on the page`);
      // The dock changes shape on Money (its money sections replace the tabs),
      // so the current mark is required only while the tapped tab is still there.
      const still = await page.locator(`[data-testid="${id}"]`).count();
      const current = await page.locator(`[data-testid="${id}"][aria-current="page"]`).count();
      if (still && !current) throw new Error(`after tapping ${id} the dock does not mark it current`);
      last = now;
      walked += 1;
      if (!still) {
        await t.open(page, '?view=about');
        last = await t.main(page);
      }
    }
    if (walked < 3) throw new Error(`walked only ${walked} tabs`);
  },
  async 'money-tabs-by-taps'(page, t) {
    await t.open(page, '?view=books');
    const subs = await page.locator('[data-testid^="dock-money-"]').all();
    if (subs.length < 2) throw new Error(`the dock shows ${subs.length} money sections; a person needs at least two to tap`);
    let last = await t.main(page);
    let walked = 0;
    for (const sub of subs.slice(0, 5)) {
      const id = await sub.getAttribute('data-testid');
      // The section already open is skipped: tapping it changes nothing by design.
      if (await sub.getAttribute('aria-current')) continue;
      await sub.click({ timeout: 5000 });
      await t.settle(page);
      const now = await t.main(page);
      if (now === last) throw new Error(`tapping ${id} changed nothing on the page`);
      if (t.boundary(now)) throw new Error(`${id} rendered an error boundary`);
      last = now;
      walked += 1;
    }
    if (walked < 1) throw new Error('no money section other than the open one could be tapped');
  },
  async 'create-takes-words'(page, t) {
    // The one-voice input lives on the Lesson entry sub (DR-0679), not the canvas.
    await t.open(page, '?view=create&sub=record');
    const box = page.locator('[data-testid="one-voice-text"]').first();
    await box.waitFor({ timeout: 15000 });
    await box.fill('A note typed by the journey, so Send can wake up.');
    const value = await box.inputValue();
    if (!value.includes('typed by the journey')) throw new Error('the one-voice input did not keep the typed words');
    const send = page.locator('[data-testid="one-voice-send"]').first();
    if (await send.isDisabled()) throw new Error('Send stayed disabled after words were typed');
  },
  async 'feedback-sheet-opens'(page, t) {
    await t.open(page, '?view=about');
    // On a phone the Feedback control sits in the dock's More sheet.
    if (!(await page.locator('[data-testid="dock-feedback"]:visible').count())) await t.tap(page, '[data-testid="dock-more"]', 'the dock More control');
    await t.tap(page, '[data-testid="dock-feedback"]', 'the dock Feedback control');
    const area = page.locator('textarea').last();
    await area.waitFor({ timeout: 10000 });
    await area.fill('Words from the journey.');
    if (!(await area.inputValue()).includes('journey')) throw new Error('the feedback sheet did not take words');
  },
  async 'office-assistant-answers'(page, t) {
    // Signed in as the business-tier stand-in (header); --break=signin withholds it.
    await t.signIn(page);
    await t.open(page, '?view=tlc-assistant');
    // A first sign-in is greeted: the Arrivals list opens itself once a
    // launch (ArrivalsBell) over the once-only welcome for a non-family person
    // (SelfServeWelcome). The journey closes each the way that person would,
    // top one first; bounded, and a returning device that sees neither passes.
    const GREETINGS = [
      ['[role="dialog"][aria-label="Arrivals"] button:text-is("×")', 'the Arrivals close button'],
      ['[role="dialog"][aria-labelledby="ssw-h"] button:text-is("Get started")', 'the first-sign-in welcome'],
    ];
    for (let round = 0; round < 4; round += 1) {
      const showing = [];
      for (const g of GREETINGS) if (await page.locator(g[0]).count()) showing.push(g);
      if (!showing.length) break;
      await t.tap(page, showing[0][0], showing[0][1]);
    }
    const tabs = page.locator('[role="tablist"][aria-label="TLC Therapy Solutions assistant sections"]');
    await tabs.waitFor({ timeout: 20000 }).catch(() => {
      throw new Error('the TLC Assistant did not mount for the signed-in business-tier stand-in (no "TLC Therapy Solutions assistant sections" tablist)');
    });
    const body = await t.body(page);
    if (/The Assistant workspace is an operations space/.test(body))
      throw new Error('the locked card shows beside the Assistant: the tier gate refused the stand-in');
    if (t.boundary(body)) throw new Error('the Assistant rendered an error boundary');
    if (!/Daily report/.test(await t.main(page))) throw new Error('the Today section did not answer with its daily report');
    // The workspace takes a person's words and answers with them: an idea saved
    // in Content's ideas folder is listed back. (The surface has no model or
    // network question-and-answer to stub; this is what it actually answers.)
    await t.tap(page, '[role="tablist"][aria-label="TLC Therapy Solutions assistant sections"] [role="tab"]:has-text("Content")', 'the Content section tab');
    const words = 'An idea typed by the office journey';
    const box = page.locator('input[aria-label="Idea"]').first();
    await box.waitFor({ timeout: 10000 }).catch(() => {
      throw new Error('no idea input: the Assistant did not give the business-tier operator its write controls');
    });
    await box.fill(words);
    await t.tap(page, 'input[aria-label="Idea"] + button:text-is("Save")', 'the idea Save button');
    const listed = await page.locator(`li:text-is("${words}")`).count();
    if (!listed) throw new Error('the saved idea was not listed back in the ideas folder');
    if (await box.inputValue()) throw new Error('the idea input kept its words after Save');
  },
};
export const JOURNEY_IDS = Object.freeze(Object.keys(JOURNEY_DEFS));
export const TAP_JOURNEYS = Object.freeze(['learn-by-taps', 'institute-buttons-by-taps', 'top-tabs-by-taps', 'money-tabs-by-taps', 'feedback-sheet-opens', 'office-assistant-answers']);
export const SIGNED_IN_JOURNEYS = Object.freeze(['office-assistant-answers']);
/** Which journeys a planted fault must fail. Pure. */
export function expectedToFail(breakKind) {
  if (breakKind === 'link') return ['lesson-link-lands'];
  if (breakKind === 'taps') return [...TAP_JOURNEYS];
  if (breakKind === 'signin') return [...SIGNED_IN_JOURNEYS];
  return [];
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1]);
if (isMain) {
  // A variable, so vitest (which imports this file for its pure functions) does not resolve the package at
  // collect time, where it is not installed; and no shebang above, because vite's web transform prepends an
  // import for a non-literal dynamic import and a shebang on line 1 then no longer parses (found 2026-11-05).
  const pw = 'playwright-core';
  const { chromium } = await import(/* @vite-ignore */ pw);
  const args = parseArgs(process.argv.slice(2));
  const DIST = args.dist || fileURLToPath(new URL('../../app/dist', import.meta.url));
  const BUDGET_MS = Number(process.env.JOURNEYS_BUDGET_MS || 300000);
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error(`app-journeys: no index.html in ${DIST} — build the app first`);
    process.exit(2);
  }
  if (args.breakKind && !['link', 'taps', 'signin'].includes(args.breakKind)) {
    console.error(`app-journeys: unknown --break=${args.breakKind}`);
    process.exit(2);
  }
  const ids = args.only ? JOURNEY_IDS.filter((id) => args.only.includes(id)) : JOURNEY_IDS;
  if (args.only && ids.length !== args.only.length) {
    console.error(`app-journeys: --only names a journey that does not exist (${args.only.join(',')})`);
    process.exit(2);
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
  const killer = setTimeout(() => {
    console.error('app-journeys: over budget');
    process.exit(1);
  }, BUDGET_MS);

  const QUIET = new Date('2026-09-29T10:00:00-05:00').getTime();
  const BOUNDARY = /hit an error|something went wrong on this screen/i;
  const t = {
    link: args.breakKind === 'link' ? LESSON_LINK.replace(/lesson=[^&]+/, 'lesson=no-such-lesson-planted') : LESSON_LINK,
    boundary: (text) => BOUNDARY.test(text),
    settle: (page) => page.evaluate(() => new Promise((r) => setTimeout(r, 600))),
    main: (page) => page.evaluate(() => ((document.querySelector('main') || document.body).innerText || '').replace(/\s+/g, ' ').trim()),
    body: (page) => page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').trim()),
    async open(page, route) {
      await page.goto(`${origin}${BASE}/${route}`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
      await page.waitForSelector('main', { timeout: 15000 });
      await t.settle(page);
    },
    async tap(page, selector, what) {
      const el = page.locator(selector).first();
      await el.waitFor({ timeout: 15000 }).catch(() => {
        throw new Error(`${what} is not on the page (${selector})`);
      });
      if (process.env.JOURNEYS_DEBUG) console.log(`debug    tap ${what}: "${(await el.innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 80)}"`);
      await el.click({ timeout: 5000 }).catch((e) => {
        throw new Error(`${what} could not be tapped: ${process.env.JOURNEYS_DEBUG ? e.message : String(e.message).split('\n')[0]}`);
      });
      await t.settle(page);
      if (process.env.JOURNEYS_DEBUG) console.log(`debug    after ${what}: ${(await t.main(page)).slice(0, 300)}`);
    },
    // The signed-in stand-in (header). Withheld under --break=signin, so the
    // surface it opens must then fail to mount.
    standinSeen: [],
    async signIn(page) {
      if (args.breakKind === 'signin') return;
      const key = standinStorageKey();
      const session = JSON.stringify(standinSession());
      await page.addInitScript(
        ([k, v]) => {
          try {
            localStorage.setItem(k, v);
          } catch (_) {
            /* private mode */
          }
        },
        [key, session]
      );
      await page.context().route(`${STANDIN.supabaseUrl}/**`, (route) => {
        const req = route.request();
        const { pathname } = new URL(req.url());
        const a = standinAnswer(req.method(), pathname, req.headers()['authorization'] || '');
        t.standinSeen.push(`${req.method()} ${pathname} -> ${a.status}`);
        if (process.env.JOURNEYS_DEBUG) console.log(`debug    stand-in ${req.method()} ${pathname} -> ${a.status}`);
        return route.fulfill({ status: a.status, contentType: 'application/json', body: a.body, headers: { 'access-control-allow-origin': '*' } });
      });
    },
    async textOf(page, selector, ms) {
      const el = page.locator(selector).first();
      await el.waitFor({ timeout: ms }).catch(() => null);
      return (await el.count()) ? (await el.innerText()).trim() : '';
    },
  };

  const results = [];
  let caught = [];
  try {
    for (const id of ids) {
      const context = await browser.newContext({ viewport: { width: 412, height: 915 }, timezoneId: 'America/Chicago', serviceWorkers: 'block' });
      const page = await context.newPage();
      await page.addInitScript((target) => {
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
        // A returning device: the landing seen, the tour seen, and a household
        // profile already picked (the shell boots currentProfile from this key
        // on a trusted host). Without it the "Who's using this device?" picker
        // sits over every tap — measured on the first run: 5 of 6 journeys
        // tapped the picker's backdrop instead of the app.
        try {
          localStorage.setItem('poe-landing-seen', '1');
          localStorage.setItem('poetech.help.tour.v1', 'seen');
          localStorage.setItem('poe-current-profile', 'family');
        } catch (_) {
          /* private mode */
        }
      }, QUIET);
      if (args.breakKind === 'taps') {
        await page.addInitScript(() => {
          const s = document.createElement('style');
          s.textContent = 'main button, [data-testid^="dock-"], [role="tab"] { pointer-events: none !important; }';
          document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s));
        });
      }
      const seen = [];
      page.on('console', (m) => {
        if (m.type() === 'error') seen.push(`[console] ${m.text()}`);
      });
      page.on('pageerror', (e) => seen.push(`[pageerror] ${e.message}`));
      try {
        await JOURNEY_DEFS[id](page, t);
        results.push([id, 'pass']);
        console.log(`  ✔ ${id}`);
      } catch (e) {
        const expected = expectedToFail(args.breakKind).includes(id);
        if (expected) {
          caught.push(id);
          console.log(`  ✔ ${id} FAILED AS PLANTED — ${e.message}`);
        } else {
          results.push([id, 'FAIL', e.message]);
          const text = await t.body(page).catch(() => '(no body)');
          console.log(`  ✘ ${id}\n      ${e.message}\n      url: ${page.url()}\n      page text: ${text.slice(0, 600)}`);
          for (const line of seen.slice(-12)) console.log(`      ${line}`);
          if (SIGNED_IN_JOURNEYS.includes(id)) for (const line of t.standinSeen.slice(-12)) console.log(`      [stand-in] ${line}`);
        }
      }
      await context.close();
    }
  } finally {
    clearTimeout(killer);
    await browser.close().catch(() => {});
    server.close();
  }
  const failed = results.filter((r) => r[1] === 'FAIL');
  if (args.breakKind) {
    const expectedIds = expectedToFail(args.breakKind);
    const ran = expectedIds.filter((id) => ids.includes(id));
    const missed = ran.filter((id) => !caught.includes(id));
    if (missed.length) {
      console.error(
        `app-journeys: PLANTED FAULT ${args.breakKind} NOT CAUGHT by ${missed.join(', ')} — a journey that cannot fail is a painted gate (DR-0076 §3)`
      );
      process.exit(1);
    }
    if (failed.length) {
      console.error(`app-journeys: the planted fault also failed unrelated journeys: ${failed.map((f) => f[0]).join(', ')}`);
      process.exit(1);
    }
    console.log(`app-journeys: planted fault ${args.breakKind} CAUGHT by ${caught.join(', ')}; ${results.length} other journey(s) unaffected`);
    process.exit(0);
  }
  if (failed.length) {
    console.error(`app-journeys: ${failed.length} of ${results.length} journeys FAILED: ${failed.map((f) => f[0]).join(', ')}`);
    process.exit(1);
  }
  console.log(`app-journeys: OK — ${results.length} of ${results.length} journeys walked`);
}
