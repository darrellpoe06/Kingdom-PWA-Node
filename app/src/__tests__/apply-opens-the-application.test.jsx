// =============================================================================
// THE APPLY BUTTON OPENS THE APPLICATION
// =============================================================================
// Darrell, 2026-10-10, standing on the public listing for 805 North Prospect
// Apt 2 at poetech.us/properties/app/?properties=1:
//
//   "The image has an apply button that should open the application!!!?!!!
//    It does not do that currently!!!!!! Fix it!!!!"
//
// THREE DEFECTS IN ONE JOURNEY. Only the first is the one he could see.
//
// 1. THE CARD'S APPLY WENT NOWHERE. It was an <a> to applyUrl(), which builds
//    /properties/?apply=<rentalId>. /properties/index.html is a STATIC page
//    whose only job is a link preview, and it forwarded with
//        <meta http-equiv="refresh" content="0; url=/properties/app/?properties=1" />
//    A meta refresh cannot see the query it was reached with, so the id was
//    DESTROYED one hop before the app could read it. The person left the page
//    they were on and came back to it with nothing opened.
//
// 2. EVERY PRINTED QR CODE HAD THE SAME FATE, and that is the bigger half.
//    apply-link.js exists so that "someone standing at the door of a vacant
//    unit points a camera at a card in the window and lands on the
//    application FOR THAT UNIT". Those cards encode the same /properties/
//    address and are physical — they cannot be recalled. So the fix had to be
//    at the hop they all pass through, not only in what new links look like.
//
// 3. EVEN A SCAN THAT WORKED STILL DEMANDED A TAP. ApplyForm rendered its own
//    "Apply — no account needed" button and waited, while its own comment
//    said preselecting the unit "is the whole point of the code". Same extra
//    tap he named on the lessons: "users have to click again!!! Why?"
//
// WHAT THIS PINS, and why each case would have passed before and fails now:
//   * the redirect FORWARDS the query (it could not, being a hardcoded meta);
//   * the card asks its caller instead of navigating, when a caller exists;
//   * a named unit opens the form rather than waiting for a tap.
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyUrl, readApplyTarget, APPLY_PARAM } from '../modules/properties/apply-link.js';

const here = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(here, ...p), 'utf8');
const DOOR_HTML = () => read('..', '..', 'public', 'properties', 'index.html');
const REDIRECT_JS = () => read('..', '..', 'public', 'properties', 'redirect.js');

const UNIT = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

describe('PROVEN-TO-CATCH: the hop that ate the unit id', () => {
  it('the front door loads a forwarder — a bare meta refresh cannot carry a query', () => {
    const html = DOOR_HTML();
    expect(html).toContain('<script src="/properties/redirect.js"></script>');
  });

  it('the meta refresh survives as the fallback, and still names the same door', () => {
    // Kept deliberately: if the script 404s, the page must still move. The
    // existing properties-door gate asserts this url too.
    expect(DOOR_HTML()).toMatch(/url=\/properties\/app\/\?properties=1/);
  });

  it('the forwarder carries the WHOLE query, not a fixed string', () => {
    const js = REDIRECT_JS();
    expect(js).toContain('loc.search');
    expect(js).toContain('URLSearchParams');
    // It must still guarantee the flag the door boots on.
    expect(js).toMatch(/params\.set\('properties', '1'\)/);
  });

  it('the destination path is FIXED — this can never become an open redirect', () => {
    const js = REDIRECT_JS();
    expect(js).toMatch(/var target = '\/properties\/app\/'/);
    // The path is never read from the URL; only the query and hash are carried.
    expect(js).not.toMatch(/loc\.pathname/);
  });

  it('it replaces rather than pushes, so back does not bounce forward again', () => {
    expect(REDIRECT_JS()).toMatch(/loc\.replace\(/);
  });

  it('the forwarder is a FILE, because the page’s CSP forbids inline script', () => {
    // Measured policy, app/public/_headers: script-src 'self' ...
    const headers = read('..', '..', 'public', '_headers');
    expect(headers).toMatch(/script-src 'self'/);
    // So the page must reference a same-origin file and carry no inline code.
    const html = DOOR_HTML();
    const inline = html.match(/<script(?![^>]*\ssrc=)[^>]*>[\s\S]*?<\/script>/i);
    expect(inline, 'an inline script here would be silently blocked by CSP').toBeNull();
  });
});

describe('the forwarder, run for real', () => {
  afterEach(() => { vi.resetModules(); });

  // Execute redirect.js against a fake window, which is exactly how it runs.
  const run = (search, hash = '') => {
    const calls = [];
    const win = {
      location: {
        search,
        hash,
        replace: (u) => calls.push(u),
      },
    };
    // eslint-disable-next-line no-new-func
    const fn = new Function('window', 'URLSearchParams', REDIRECT_JS());
    fn(win, URLSearchParams);
    return calls;
  };

  it('PROVEN-TO-CATCH: a scanned unit id reaches the door', () => {
    const [to] = run(`?${APPLY_PARAM}=${UNIT}`);
    expect(to).toContain('/properties/app/?');
    // The whole point: the id is still there on the other side.
    expect(readApplyTarget(to.slice(to.indexOf('?')))).toBe(UNIT);
  });

  it('and the door still boots, because properties=1 is forced', () => {
    const [to] = run(`?${APPLY_PARAM}=${UNIT}`);
    expect(new URLSearchParams(to.slice(to.indexOf('?'))).get('properties')).toBe('1');
  });

  it('a plain visit with no query still lands on the door', () => {
    const [to] = run('');
    expect(to).toBe('/properties/app/?properties=1');
  });

  it('properties=1 is never duplicated when the link already carries it', () => {
    const [to] = run('?properties=1');
    expect(to).toBe('/properties/app/?properties=1');
  });

  it('a hash is carried too', () => {
    const [to] = run(`?${APPLY_PARAM}=${UNIT}`, '#apply');
    expect(to.endsWith('#apply')).toBe(true);
  });

  it('a junk apply value is carried but lands harmlessly — the app drops it', () => {
    const [to] = run('?apply=not-a-uuid');
    expect(to).toContain('/properties/app/?');
    expect(readApplyTarget(to.slice(to.indexOf('?')))).toBeNull();
  });

  it('the real link applyUrl builds round-trips through it', () => {
    const url = applyUrl(UNIT);
    const [to] = run(url.slice(url.indexOf('?')));
    expect(readApplyTarget(to.slice(to.indexOf('?')))).toBe(UNIT);
  });
});

describe('the card asks, instead of travelling', () => {
  const STOREFRONT = () => read('..', 'modules', 'properties', 'Storefront.jsx');

  it('PROVEN-TO-CATCH: with a caller that can open the form, it is a BUTTON', () => {
    const src = STOREFRONT();
    expect(src).toMatch(/export function VacancyCard\(\{ unit, onApply = null \}\)/);
    expect(src).toMatch(/onClick=\{\(\) => onApply\(unit\.rentalId\)\}/);
  });

  it('with no caller it keeps the plain link — a QR sheet has nowhere local to open', () => {
    const src = STOREFRONT();
    expect(src).toMatch(/href=\{applyUrl\(unit\.rentalId\)\}/);
    expect(src).toMatch(/\{onApply \? \(/);
  });

  it('either way the control carries the same test id, so a journey can find it', () => {
    const hits = STOREFRONT().match(/data-testid="vacancy-apply"/g) || [];
    expect(hits).toHaveLength(2);
  });
});

describe('the door opens its own form', () => {
  const DOOR = () => read('..', 'components', 'PropertiesDoor.jsx');

  it('the listing hands the card a way to open the form', () => {
    expect(DOOR()).toContain('onApply={applyFor}');
  });

  it('it is a COUNTER, so a second card re-opens and re-scrolls', () => {
    const src = DOOR();
    // A boolean would silently change the selection under a form the person
    // is no longer looking at.
    expect(src).toMatch(/pick: p\.pick \+ 1/);
    expect(src).toMatch(/openFor=\{picked\.pick \|\| \(scan\.matched \? 1 : 0\)\}/);
  });

  it('a tapped card wins over a stale scanned id', () => {
    expect(DOOR()).toMatch(/preselect=\{picked\.id \|\| \(scan\.matched \? scan\.unit\.id : ''\)\}/);
  });

  it('PROVEN-TO-CATCH: a named unit opens the form instead of waiting for a tap', () => {
    const src = DOOR();
    expect(src).toMatch(/function ApplyForm\(\{ vacancies, preselect = '', openFor = 0 \}\)/);
    expect(src).toMatch(/useState\(openFor > 0\)/);
  });

  it('the form is scrolled to, with the reader’s own motion setting', () => {
    const src = DOOR();
    expect(src).toContain('data-testid="apply-form"');
    expect(src).toMatch(/behavior: motionBehavior\(\)/);
    // Next frame: the form has to exist before it can be scrolled to.
    expect(src).toMatch(/requestAnimationFrame/);
  });

  it('a page that merely LOADS with a scan does not also fire a scroll', () => {
    // The initial state covers that case; the effect must only run on a change.
    expect(DOOR()).toMatch(/if \(openFor === asked\.current\) return;/);
  });
});
