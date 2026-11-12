#!/usr/bin/env node
// =============================================================================
// love-corner-comfort-probe — the Love Corner's new surfaces MEASURED on a built
// page (DR-1459): overflow, the 36px floor, section names, alt text, heading
// order, the large-print cap, a keyboard walk, the More sheet by keyboard.
// =============================================================================
// Run against a served dist (the way chrome-layout-probe.mjs does), e.g.
//   cd app && npx vite build && ln -sfn ../dist dist/poetech-app && \
//   (python3 -m http.server 4173 --directory dist &) && node ../scripts/love-corner-comfort-probe.mjs
// Prints every finding and a FINDINGS count; exits 1 when any remain. Nothing
// here is a claim: the table in DR-1459 is this script's output.
// Needs playwright (the CI runner and the cloud sandbox both carry it).
import { chromium } from 'playwright';
const BASE = (process.env.PROBE_BASE || 'http://127.0.0.1:4173') + '/lovecorner/app/?lovecorner=1&view=church';
const SURFACES = [
  { key: 'home', url: BASE, region: '[data-testid="lovecorner-home"]' },
  { key: 'youth', url: BASE + '&sub=youth', region: '[data-testid="youth-zone"]' },
  { key: 'institute', url: BASE + '&sub=institute', region: '[data-testid="church-institute"]' },
  { key: 'ministries', url: BASE + '&sub=ministries', region: '[data-testid="ministry-landing"]' },
];
const WIDTHS = [360, 390, 768, 1440];
const SIZES = ['normal', 'largest', 'bigprint'];
(async () => {
  const b = await chromium.launch();
  const findings = [];
  const note = (s) => {
    findings.push(s);
    console.log('  !', s);
  };
  for (const size of SIZES) {
    for (const w of WIDTHS) {
      const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, isMobile: w < 700, hasTouch: w < 700 });
      await ctx.addInitScript((k) => {
        try {
          localStorage.setItem('poe-text-size', k);
        } catch {}
      }, size);
      for (const s of SURFACES) {
        const p = await ctx.newPage();
        const errs = [];
        p.on('pageerror', (e) => errs.push(e.message));
        await p.goto(s.url, { waitUntil: 'networkidle', timeout: 60000 });
        await p.waitForTimeout(1500);
        const r = await p.evaluate(
          ({ region }) => {
            const root = document.querySelector(region);
            if (!root) return { missing: true };
            const out = {
              overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
              small: [],
              noName: [],
              noAlt: [],
              headings: [],
              h1px: null,
              ppx: null,
              hidden: [],
            };
            const ctrls = root.querySelectorAll('button, a[href], input, [role="tab"]');
            for (const el of ctrls) {
              const r = el.getBoundingClientRect();
              const st = getComputedStyle(el);
              if (st.display === 'none' || st.visibility === 'hidden') continue;
              if (r.width === 0 && r.height === 0) continue;
              if (r.height < 36 || r.width < 36)
                out.small.push(
                  `${el.tagName.toLowerCase()}[${el.getAttribute('data-testid') || el.textContent.trim().slice(0, 24)}] ${Math.round(r.width)}x${Math.round(r.height)}`
                );
            }
            for (const sec of root.querySelectorAll('section')) {
              const lb = sec.getAttribute('aria-labelledby');
              const al = sec.getAttribute('aria-label');
              if (!al && !(lb && document.getElementById(lb))) out.noName.push(sec.className.slice(0, 40));
            }
            for (const img of root.querySelectorAll('img')) if (!img.hasAttribute('alt')) out.noAlt.push(img.src.slice(-40));
            out.headings = [...root.querySelectorAll('h1,h2,h3,h4')].map((h) => h.tagName);
            const h1 = root.querySelector('.lc-h1');
            const pp = root.querySelector('.lc-p');
            out.h1px = h1 ? parseFloat(getComputedStyle(h1).fontSize) : null;
            out.ppx = pp ? parseFloat(getComputedStyle(pp).fontSize) : null;
            out.rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
            return out;
          },
          { region: s.region }
        );
        const tag = `${s.key}@${w}/${size}`;
        if (r.missing) {
          note(`${tag}: region not found`);
          await p.close();
          continue;
        }
        if (errs.length) note(`${tag}: page errors ${JSON.stringify(errs.slice(0, 2))}`);
        if (r.overflow > 1) note(`${tag}: horizontal overflow ${r.overflow}px`);
        for (const sm of r.small) note(`${tag}: target under 36px: ${sm}`);
        for (const n of r.noName) note(`${tag}: section without a name: ${n}`);
        for (const a of r.noAlt) note(`${tag}: img without alt: ${a}`);
        // heading order: no level skipped going deeper
        let last = 1;
        for (const h of r.headings) {
          const lvl = Number(h[1]);
          if (lvl > last + 1) {
            note(`${tag}: heading skips ${last}→${lvl}`);
            break;
          }
          last = lvl;
        }
        console.log(`${tag}: ok overflow=${r.overflow} ctrlsSmall=${r.small.length} h1=${r.h1px}px p=${r.ppx}px root=${r.rootPx}px`);
        await p.close();
      }
      await ctx.close();
    }
  }
  // keyboard walk on the home at 390 normal
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(1500);
  await p.focus('[data-testid="lc-sign-in"]');
  const order = [];
  let noRing = 0;
  for (let i = 0; i < 40; i += 1) {
    await p.keyboard.press('Tab');
    const f = await p.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const st = getComputedStyle(el);
      return {
        id: el.getAttribute('data-testid') || el.getAttribute('aria-label') || el.textContent.trim().slice(0, 20),
        ring: st.outlineStyle !== 'none' && parseFloat(st.outlineWidth) > 0,
        tag: el.tagName,
      };
    });
    if (!f) break;
    order.push(f.id);
    if (!f.ring && f.tag === 'BUTTON') noRing += 1;
  }
  console.log('tab order (first 40):', order.join(' > '));
  if (noRing) note(`keyboard: ${noRing} focused buttons showed no outline`);
  // More sheet: open by keyboard, Escape closes, focus returns
  await p.focus('[data-testid="dock-more"]');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(300);
  const opened = await p.evaluate(() => document.querySelector('[data-testid="dock-more"]').getAttribute('aria-expanded') === 'true');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  const after = await p.evaluate(() => ({
    closed: document.querySelector('[data-testid="dock-more"]').getAttribute('aria-expanded') !== 'true',
    focus: document.activeElement && document.activeElement.getAttribute('data-testid'),
  }));
  console.log('More sheet: opened', opened, 'closed on Escape', after.closed, 'focus after', after.focus);
  if (!opened) note('More sheet did not open from the keyboard');
  if (!after.closed) note('More sheet did not close on Escape');
  if (after.focus !== 'dock-more') note(`focus after Escape landed on ${after.focus}, not the More button`);
  await b.close();
  console.log(`\nFINDINGS ${findings.length}`);
  if (findings.length) process.exit(1);
})().catch((e) => {
  console.error('FAILED', e.message);
  process.exit(1);
});
