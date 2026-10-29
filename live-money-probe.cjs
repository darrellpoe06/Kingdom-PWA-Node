// Live Money check: every Money section on the Galaxy Z Fold 7 cover and inner
// screens, in the app's sample mode (?demo — no storage, no sign-in, no saves).
// Read-only. Usage: node live-money-probe.cjs <base url ending /poetech-app/> <out dir>
const { chromium } = require(process.env.PW_MODULE || 'playwright-core');
const fs = require('fs');
const BASE = process.argv[2];
const OUT = process.argv[3] || 'live-out';
fs.mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (Linux; Android 10; SM-F966U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Mobile Safari/537.36';
const SCREENS = [
  { name: 'fold7-cover', viewport: { width: 360, height: 764 }, deviceScaleFactor: 3 },
  { name: 'fold7-inner', viewport: { width: 984, height: 1016 }, deviceScaleFactor: 2 },
];
const SECTIONS = [
  ['overview', 'Overview'], ['accounts', 'Accounts'], ['transactions', 'Transactions'],
  ['budget', 'Budget'], ['bills', 'Bills'], ['goals', 'Goals'],
  ['debt-freedom', 'Debt Freedom'], ['reports', 'Reports'], ['settings', 'Settings'],
];
(async () => {
  const launch = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : (process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
  const browser = await chromium.launch(launch);
  let failures = 0;
  for (const s of SCREENS) {
    const ctx = await browser.newContext({ userAgent: UA, viewport: s.viewport, deviceScaleFactor: s.deviceScaleFactor, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.addInitScript(() => { try { localStorage.setItem('poetech.help.tour.v1', '1'); localStorage.setItem('poe-landing-seen', '1'); } catch (e) {} });
    const errors = []; page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 160)));
    const writes = []; page.on('request', (r) => { if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(r.method()) && /\/sb\/|supabase|ts\.net/.test(r.url())) writes.push(r.method() + ' ' + r.url().slice(0, 100)); });
    for (const [sub, label] of SECTIONS) {
      const errBefore = errors.length;
      await page.goto(`${BASE}?demo=family-of-4&view=books&sub=${sub}`, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => errors.push('goto: ' + e.message.slice(0, 100)));
      await page.waitForTimeout(800);
      const r = await page.evaluate(() => {
        const de = document.documentElement;
        const cur = document.querySelector('[data-testid="money-strip-current"]');
        const layout = document.querySelector('[data-testid="money-layout"]');
        const sts = document.querySelector('[data-testid="sts-amount"]');
        const build = (document.body.innerText.match(/BUILD\s+([0-9A-F]{7})/i) || [])[1] || '';
        return { overflow: de.scrollWidth - de.clientWidth, current: cur ? cur.textContent.replace(/\s+/g, ' ').trim() : '', layout: !!layout, sts: sts ? sts.textContent.trim() : '', build };
      });
      const ok = r.layout && r.current.toLowerCase().includes(label.toLowerCase()) && r.overflow <= 1 && errors.length === errBefore;
      if (!ok) failures++;
      console.log(`${ok ? 'PASS' : 'FAIL'} ${s.name} ${sub}: shows "${r.current}" · layout ${r.layout} · sideways overflow ${r.overflow}px · page errors ${errors.length - errBefore}${sub === 'overview' ? ` · Safe to Spend "${r.sts}"` : ''}${r.build ? ` · build ${r.build}` : ''}`);
      await page.screenshot({ path: `${OUT}/${s.name}-${sub}.png` });
    }
    console.log(`${s.name}: database writes attempted ${writes.length}${writes.length ? ' -> ' + writes.join(', ') : ''}`);
    if (writes.length) failures++;
    if (errors.length) console.log(`${s.name} errors: ${errors.join(' | ')}`);
    await ctx.close();
  }
  await browser.close();
  console.log(failures ? `RESULT: ${failures} failing check(s)` : 'RESULT: every check passed');
  process.exit(failures ? 1 : 0);
})();
