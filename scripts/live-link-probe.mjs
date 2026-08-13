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
    name: '3-bare-church',
    label: 'Bare church link — the Worship tab, where the player BELONGS',
    query: '?view=church',
    expectTab: 'Church',
    expectHeadingIncludes: null,
    expectLessonId: null,
    expectPlayer: true, // the control: proves the probe can see a real page
  },
];

const browser = await chromium.launch();
const results = [];
let failures = 0;

for (const c of CASES) {
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

  const problems = [];
  let activeTabs = [];
  let heading = null;
  let lessonMounted = null;
  let player = null;

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
    problems.push(`navigation/render failed: ${String(err).slice(0, 200)}`);
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
    pageErrors,
    problems,
  });
}

await browser.close();

writeFileSync(`${OUT}/result.json`, JSON.stringify({ base: BASE, results }, null, 2));

const lines = ['## Live link probe', '', `Base: \`${BASE}\``, ''];
for (const r of results) {
  lines.push(`### ${r.ok ? '✅' : '❌'} ${r.case}`);
  lines.push(`- URL: \`${r.url}\``);
  lines.push(`- Tab the DOM says is selected: **${r.activeTabs.join(', ') || 'none'}**`);
  if (r.heading !== null) lines.push(`- Course heading rendered: **${r.heading}**`);
  if (r.lessonMounted !== null) lines.push(`- Deep-linked lesson card mounted: **${r.lessonMounted}**`);
  lines.push(`- Live-stream player mounted: **${r.youtubePlayerMounted}**`);
  if (r.pageErrors.length) lines.push(`- Page errors: ${r.pageErrors.join(' | ')}`);
  for (const p of r.problems) lines.push(`- **FAIL:** ${p}`);
  lines.push('');
}
const summary = lines.join('\n');
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) {
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary, { flag: 'a' });
}

if (failures) {
  console.error(`\n${failures} of ${CASES.length} cases failed. Screenshots are in the artifact.`);
  process.exit(1);
}
console.log(`\nAll ${CASES.length} cases passed against ${BASE}`);
