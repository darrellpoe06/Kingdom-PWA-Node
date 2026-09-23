// =============================================================================
// live-link-probe — a real browser opens a shared lesson link on the LIVE site
// and reports what the recipient actually sees
// =============================================================================
// Darrell 2026-08-13, opening a link the app itself produced: "Sucks... doesnt
// even take the user to the actual lessons.... Only to the live stream tab with
// the player open for nothing!!!!!!! Is this tested before?"
//
// It was not. 7,678 tests mounted the Learn component DIRECTLY; nothing walked
// the shell's routing decision, so the component under test was never the
// surface the user meets (LESSONS P16). DR-0296 fixed the routing and pinned it
// in unit tests. This is the outside-in half, and it answers the one question a
// unit test structurally cannot: does the LIVE product, as served, land a
// shared link on the lesson?
//
// EVERY VERDICT IS READ FROM THE RENDERED DOM, never from the URL. A URL that
// says `sub=learn` is what the app was ASKED for; the selected tab and the
// mounted lesson card are what it DID. Reading the URL back would be the
// tautology this file exists to avoid.
//
// The bare-church case is load-bearing and must not be removed: it requires the
// YouTube player to be PRESENT on `?view=church`. Without it, a probe that only
// asserts "no player on a lesson link" would pass just as happily against a
// blank page or a dead site.
//
// Usage:  BASE=https://poetech.us/poetech-app/ node scripts/live-link-probe.mjs
// Exits non-zero when any case fails. Screenshots land in ./shots regardless.
// =============================================================================
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'https://poetech.us/poetech-app/';
const OUT = process.env.OUT_DIR || 'shots';
mkdirSync(OUT, { recursive: true });

// Course and lesson keys are the ones the catalog actually ships. A key that is
// retired must make this FAIL loudly rather than quietly assert nothing — a
// stale link opening "Learn normally" is correct product behaviour but useless
// as a probe, so `expectHeading` pins the course that must have rendered.
const CASES = [
  {
    name: '1-lesson-link',
    label: 'Lesson link — the exact shape the Share button produces',
    query: '?view=church&sub=learn&course=healthy-living&lesson=hl-w3-therapeutic-fasting',
    expectTab: 'Learn',
    expectHeadingIncludes: 'Healthy Living',
    expectLessonId: 'hl-w3-therapeutic-fasting',
    expectPlayer: false,
  },
  {
    name: '2-course-link',
    label: 'Whole-course link',
    query: '?view=church&sub=learn&course=world-issues',
    expectTab: 'Learn',
    expectHeadingIncludes: 'World Issues',
    expectLessonId: null,
    expectPlayer: false,
  },
  {
    // THE LEVEL SWITCH, OPENED IN A REAL BROWSER (2026-09-18). Darrell reported
    // "the highlighting reads only the child version no matter what is chosen".
    // Every unit test measures the level plumbing correct, and the cloud agent
    // session has NO route to poetech.us — so the honest answer was never "ask
    // him", it was THIS: a runner picks each band on the live site and compares
    // the rendered lesson body. The bodies are recorded in result.json, so the
    // evidence is readable rather than asserted (DR-0108: account for the whole
    // team's capabilities; DR-0076 §7: an independent method, not a re-read of
    // the code).
    name: '4-level-switch',
    label: 'Level switch — does picking a band change the LESSON BODY on the live site?',
    query: '?view=church&sub=learn&course=made-in-time&lesson=mit5-those-who-know-their-god',
    expectTab: 'Learn',
    expectHeadingIncludes: 'Made in Time',
    expectLessonId: 'mit5-those-who-know-their-god',
    expectPlayer: false,
    levelBands: ['Child', 'Adult'],
  },
  {
    name: '3-bare-church',
    label: 'Bare church link — the Worship tab, where the player BELONGS',
    query: '?view=church',
    expectTab: 'Church',
    expectHeadingIncludes: null,
    expectLessonId: null,
    expectPlayer: true, // the control: proves the probe can see a real page
  },
];

// A witness workflow runs ONE case without altering this probe's read-only
// posture (its own header declares that posture, and DR-0319's lesson is that a
// documented posture is not changed because something else would be convenient).
const ONLY = String(process.env.ONLY_CASE || '').split(',').map((x) => x.trim()).filter(Boolean);
const RUN = ONLY.length ? CASES.filter((c) => ONLY.includes(c.name)) : CASES;
if (ONLY.length && RUN.length !== ONLY.length) {
  console.error(`ONLY_CASE named ${ONLY.length} case(s) and ${RUN.length} matched — a renamed case must fail loudly rather than measure nothing`);
  process.exit(2);
}

const browser = await chromium.launch();
const results = [];
let failures = 0;

for (const c of RUN) {
  const url = `${BASE}${c.query}`;
  const ctx = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 '
      + '(KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
  });
  // Suppress the first-visit tour so the screenshot frames the lesson rather
  // than the welcome mat. A viewing aid only — it touches no routing.
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('poe-tour-seen', '1');
      localStorage.setItem('poe-landing-seen', '1');
    } catch (e) { /* private mode — the tour just shows */ }
  });

  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 200)));
  // WHAT KEPT THE NETWORK BUSY (2026-09-23). Both daily witnesses read
  // "page.goto: Timeout 60000ms exceeded" for four days and said nothing
  // else; the runner's own curl of the same pages answered in under a second.
  // A timeout without the names of the requests still in flight is a verdict
  // without evidence (DR-0076 §8), so every request is tracked from start to
  // finish and the failure line names the ones that never came back.
  const openedAt = Date.now();
  const inFlight = new Map();   // url -> ms since open when it started
  const settled = [];
  page.on('request', (r) => inFlight.set(r.url(), Date.now() - openedAt));
  page.on('requestfinished', (r) => { inFlight.delete(r.url()); settled.push(r.url()); });
  page.on('requestfailed', (r) => { inFlight.delete(r.url()); settled.push(`${r.url()} [failed: ${(r.failure() || {}).errorText || '?'}]`); });
  const stillInFlight = () => [...inFlight.entries()]
    .map(([u, t]) => `${u.replace(/^https?:\/\/[^/]+/, '')} (since ${t}ms)`)
    .slice(0, 12);

  const problems = [];
  let activeTabs = [];
  let heading = null;
  let lessonMounted = null;
  let player = null;
  const levelBodies = [];
  let servedBuild = { build: null, worker: null, controlled: false };

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    for (const label of ['Maybe later', "Don't show again", 'Hide']) {
      const b = page.locator(`button:has-text("${label}")`).first();
      if (await b.count() && await b.isVisible().catch(() => false)) {
        await b.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(400);
      }
    }

    activeTabs = await page.evaluate(() => [...document.querySelectorAll('button')]
      .filter((b) => /border-\[#1A1815\]/.test(b.className) && /font-medium/.test(b.className))
      .map((b) => (b.textContent || '').trim()).filter(Boolean));

    heading = await page.evaluate(() => {
      const h = document.querySelector('#learn-h');
      return h ? h.textContent.trim() : null;
    });

    player = await page.evaluate(() =>
      !!document.querySelector('iframe[src*="youtube"], iframe[src*="ytimg"]'));

    // WHICH BUILD IS THIS BROWSER ACTUALLY RUNNING (2026-09-18). When a reader
    // reports behaviour the live product does not reproduce, the first question
    // is whether his device is executing the build we think it is — an
    // installed service worker updates on its own schedule, and this app has
    // that history (the scope-shell outage). vite injects
    // globalThis.__PT_BUILD__ = "<sha>.<buildTime>" into the bundle, so the
    // running page can be ASKED rather than assumed, and the controlling
    // worker's script tells us whether a worker is serving this page at all.
    servedBuild = await page.evaluate(() => {
      const out = { build: null, worker: null, controlled: false };
      try { out.build = globalThis.__PT_BUILD__ || null; } catch (e) { /* not injected */ }
      try {
        const c = navigator.serviceWorker && navigator.serviceWorker.controller;
        out.controlled = !!c;
        out.worker = c ? String(c.scriptURL || '') : null;
      } catch (e) { /* no worker API */ }
      return out;
    });

    if (c.expectLessonId) {
      lessonMounted = await page.evaluate(
        (id) => !!document.getElementById(`learn-lesson-${id}`), c.expectLessonId);
      if (lessonMounted) {
        await page.evaluate((id) => {
          const el = document.getElementById(`learn-lesson-${id}`);
          if (el) el.scrollIntoView({ block: 'start' });
        }, c.expectLessonId);
        await page.waitForTimeout(600);
      }
    }

    // --- the level walk ----------------------------------------------------
    // Reads the lesson body once per band, with the control row stripped out so
    // a change in the CONTROL never reads as a change in the LESSON — which is
    // exactly the confusion the report needs settled.
    if (c.levelBands && lessonMounted) {
      const bodyOf = () => page.evaluate((id) => {
        const card = document.getElementById(`learn-lesson-${id}`);
        if (!card) return null;
        const clone = card.cloneNode(true);
        clone.querySelectorAll('[data-read-skip="true"]').forEach((n) => n.remove());
        return String(clone.innerText || clone.textContent || '').replace(/\s+/g, ' ').trim();
      }, c.expectLessonId);

      for (const label of c.levelBands) {
        const clicked = await page.evaluate((lab) => {
          const ctl = document.querySelector('[data-testid="lesson-level-control"]');
          if (!ctl) return 'no-control';
          const b = [...ctl.querySelectorAll('button[role="radio"]')]
            .find((x) => (x.textContent || '').trim().toLowerCase().startsWith(lab.toLowerCase()));
          if (!b) return 'no-chip';
          b.click();
          return 'clicked';
        }, label);
        if (clicked !== 'clicked') { problems.push(`could not select the ${label} level: ${clicked}`); continue; }
        await page.waitForTimeout(1200);
        const body = await bodyOf();
        levelBodies.push({ level: label, chars: body ? body.length : 0, head: body ? body.slice(0, 240) : null, body });
        await page.screenshot({ path: `${OUT}/${c.name}-${label.toLowerCase()}.png` }).catch(() => {});
      }

      // COMPARE THE WHOLE BODY, NOT ITS OPENING. The first version of this
      // check compared the first 240 characters and FIRED FALSELY on its very
      // first run against the live site: Child rendered 787 characters and
      // Adult 1968 — plainly different bodies — while both opened with the
      // same 240, because the lesson card renders shared chrome (the title,
      // the anchor, the big idea) above the band text. A witness that cries
      // wolf gets ignored, so the failure now rests on the FULL body, and the
      // first differing character index is reported so a shared header is
      // visibly a shared header rather than a mystery.
      const seen = levelBodies.filter((b) => b.body);
      if (seen.length < c.levelBands.length) {
        problems.push(`read ${seen.length} of ${c.levelBands.length} level bodies — the lesson card did not re-render`);
      } else {
        const distinct = new Set(seen.map((b) => b.body)).size;
        const divergeAt = (() => {
          if (seen.length < 2) return null;
          const [a, b] = [seen[0].body, seen[1].body];
          const n = Math.min(a.length, b.length);
          for (let i = 0; i < n; i += 1) if (a[i] !== b[i]) return i;
          return a.length === b.length ? null : n;
        })();
        for (const b of seen) b.divergesAt = divergeAt;
        if (distinct < seen.length) {
          problems.push(`THE REPORTED DEFECT IS REAL: ${seen.length} levels were selected and the rendered lesson body was BYTE-IDENTICAL — [${seen.map((b) => `${b.level}:${b.chars}ch`).join(', ')}]`);
        } else {
          console.log(`level walk: ${seen.map((b) => `${b.level}=${b.chars}ch`).join(', ')}; bodies diverge at character ${divergeAt === null ? 'n/a' : divergeAt} (a shared opening is the card's own heading, not the lesson)`);
        }
      }
    }

    if (!activeTabs.some((t) => t.includes(c.expectTab))) {
      problems.push(`expected the "${c.expectTab}" tab selected; DOM says [${activeTabs.join(', ') || 'none'}]`);
    }
    if (c.expectHeadingIncludes && !(heading || '').includes(c.expectHeadingIncludes)) {
      problems.push(`expected a course heading containing "${c.expectHeadingIncludes}"; got ${heading === null ? 'no #learn-h at all' : `"${heading}"`}`);
    }
    if (c.expectLessonId && lessonMounted === false) {
      problems.push(`the deep-linked lesson card #learn-lesson-${c.expectLessonId} never mounted`);
    }
    if (player !== c.expectPlayer) {
      problems.push(c.expectPlayer
        ? 'expected the live-stream player on the Worship tab and found none — the page may not have rendered at all'
        : 'a live-stream player is mounted on a LESSON link (the DR-0296 symptom)');
    }
  } catch (err) {
    const open = stillInFlight();
    problems.push(`navigation/render failed: ${String(err).slice(0, 200)}`
      + (open.length ? ` — ${inFlight.size} request(s) still in flight when the wait gave up: ${open.join('; ')}` : ` — no request was in flight (${settled.length} settled)`));
  }

  await page.screenshot({ path: `${OUT}/${c.name}.png` }).catch(() => {});
  await ctx.close();

  if (problems.length) failures += 1;
  results.push({
    case: c.label,
    url,
    ok: problems.length === 0,
    activeTabs,
    heading,
    lessonMounted,
    youtubePlayerMounted: player,
    servedBuild,
    levelBodies,
    pageErrors,
    problems,
  });
}

await browser.close();

// The full bodies are the evidence a person reads; cap each at 4000 characters
// so the artifact stays reviewable rather than becoming a dump.
for (const r of results) {
  for (const b of r.levelBodies || []) if (typeof b.body === 'string') b.body = b.body.slice(0, 4000);
}
writeFileSync(`${OUT}/result.json`, JSON.stringify({ base: BASE, results }, null, 2));

const lines = ['## Live link probe', '', `Base: \`${BASE}\``, ''];
for (const r of results) {
  lines.push(`### ${r.ok ? '✅' : '❌'} ${r.case}`);
  lines.push(`- URL: \`${r.url}\``);
  lines.push(`- Tab the DOM says is selected: **${r.activeTabs.join(', ') || 'none'}**`);
  if (r.heading !== null) lines.push(`- Course heading rendered: **${r.heading}**`);
  if (r.lessonMounted !== null) lines.push(`- Deep-linked lesson card mounted: **${r.lessonMounted}**`);
  lines.push(`- Live-stream player mounted: **${r.youtubePlayerMounted}**`);
  if (r.servedBuild) {
    lines.push(`- Build this browser ran: **${r.servedBuild.build || 'not injected'}** · service worker controlling: **${r.servedBuild.controlled}**${r.servedBuild.worker ? ` (\`${r.servedBuild.worker}\`)` : ''}`);
  }
  if (r.pageErrors.length) lines.push(`- Page errors: ${r.pageErrors.join(' | ')}`);
  for (const p of r.problems) lines.push(`- **FAIL:** ${p}`);
  lines.push('');
}
// Machine-readable outputs. The artifact is for eyes; these are for the witness
// step, so a finding can reach the incident ledger instead of living only in a
// run nobody can cheaply fetch.
if (process.env.GITHUB_OUTPUT) {
  const reasons = results.flatMap((r) => r.problems).join(' | ').replace(/[\r\n]+/g, ' ');
  const levels = results.flatMap((r) => (r.levelBodies || []).map((b) => `${b.level}:${b.chars}ch`)).join(', ');
  // The build the browser actually executed, and whether a service worker was
  // serving the page. When a reader reports behaviour the live site does not
  // reproduce, this is the first number to compare against his device.
  const builds = [...new Set(results.map((r) => (r.servedBuild && r.servedBuild.build) || 'unknown'))].join('/');
  const controlled = results.some((r) => r.servedBuild && r.servedBuild.controlled);
  writeFileSync(process.env.GITHUB_OUTPUT, `fail_reasons=${reasons}\nlevel_summary=${levels}\nserved_build=${builds}\nsw_controlled=${controlled}\n`, { flag: 'a' });
}

const summary = lines.join('\n');
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) {
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary, { flag: 'a' });
}

if (failures) {
  console.error(`\n${failures} of ${RUN.length} cases failed. Screenshots are in the artifact.`);
  process.exit(1);
}
console.log(`\nAll ${RUN.length} cases passed against ${BASE}`);
