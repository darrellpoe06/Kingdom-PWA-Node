// =============================================================================
// THE APPLY BUTTON OPENS THE APPLICATION — tested by USING it
// =============================================================================
// Darrell, 2026-10-10, on the public listing for 805 North Prospect Apt 2:
//
//   "The image has an apply button that should open the application!!!?!!!
//    It does not do that currently!!!!!! Fix it!!!!"
//
// and then, on the first version of this file:
//
//   "Testing needs to be respected!!! Undermining ways!!!"
//
// HE IS RIGHT, AND THIS FILE IS THE CORRECTION. The first version proved the
// fix with `expect(source).toMatch(/onClick=\{\(\) => onApply\(...\)\}/)` --
// grepping my own diff back at myself. That asserts I typed certain
// characters. It would have passed if the handler were wired to the wrong
// unit, if the form never opened, if the button were disabled. A gate that
// cannot fail for the reason the user is complaining about is not a gate
// (DR-0076 section 3). So this file MOUNTS THE DOOR AND CLICKS THE BUTTON.
//
// HOW THE DEFECT SURVIVED A TEST SUITE, which is the lesson worth keeping.
// properties-door-render.test.jsx already had "an APPLICANT can apply with NO
// account" -- and it passed throughout. It clicks /Apply - no account needed/,
// and there are TWO controls with that exact label on that page: the dead one
// on the unit card, and the working green one at the bottom. The test found
// the working one. A label is not an identity; the test had no way to say
// WHICH button it meant, so it silently exercised the half that was never
// broken. Every case below addresses a control by its test id.
//
// WHAT WAS MEASURED (the defect itself, three parts in one journey):
//   1. The card's Apply was an <a> to applyUrl() -> /properties/?apply=<id>,
//      and /properties/index.html forwarded with a HARDCODED
//      <meta http-equiv="refresh" content="0; url=/properties/app/?properties=1">.
//      A meta refresh cannot see the query it was reached with, so the unit id
//      died one hop before the app could read it. readApplyTarget on the far
//      side was right all along and was simply never handed anything.
//   2. Every printed QR code encodes that same address, so every scan has been
//      landing on the generic front door. Those cards are physical.
//   3. Even a scan that worked still demanded a tap: ApplyForm opened at
//      useState(false) while its own comment said preselecting the unit "is
//      the whole point of the code".
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { applyUrl, readApplyTarget, APPLY_PARAM } from '../modules/properties/apply-link.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const here = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(here, ...p), 'utf8');
const REDIRECT_JS = () => read('..', '..', 'public', 'properties', 'redirect.js');

// Two real units, because the counter case needs a SECOND card to tap.
const UNIT_A = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const UNIT_B = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const VACANCIES = [
  { id: UNIT_A, label: '805 North Prospect Avenue', unit: 'Apt 2', city: 'Champaign', state: 'IL', property_type: 'multi-family', rent: null, nightly_rate: 150, offering: 'short-term', bedrooms: 1, address_shown: false },
  { id: UNIT_B, label: '1003 Koehn Dr', unit: '', city: 'Danville', state: 'IL', property_type: 'single-family', rent: 680, bedrooms: 3, address_shown: true },
];

vi.mock('../lib/supabase.js', () => {
  function queryStub() {
    const q = {};
    const self = () => q;
    for (const m of ['select', 'eq', 'neq', 'in', 'order', 'limit', 'range', 'gte', 'lte', 'is', 'not', 'upsert', 'insert', 'update', 'delete', 'match']) q[m] = self;
    q.maybeSingle = async () => ({ data: null, error: null });
    q.single = async () => ({ data: null, error: null });
    q.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    return q;
  }
  const rpc = async (name) => (name === 'public_vacancies'
    ? { data: VACANCIES, error: null }
    : { data: null, error: null });
  return {
    supabase: {
      auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
      from: () => queryStub(),
      rpc,
    },
    onAuthChange: (cb) => { cb(null); return () => {}; },
    default: {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
        signOut: async () => ({}),
      },
      from: () => queryStub(),
      rpc,
    },
    phoneLoginEmail: () => '',
    normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
    readPersistedSession: () => null,
    resolveInitialSession: (emit) => { emit(null); },
    signOut: async () => ({}),
  };
});

const PropertiesDoor = (await import('../components/PropertiesDoor.jsx')).default;

let container; let root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  try { window.history.replaceState(null, '', window.location.pathname); } catch { /* ignore */ }
});

async function settle(n = 4) {
  for (let i = 0; i < n; i += 1) await act(async () => { await Promise.resolve(); });
}

async function openListing() {
  container = document.createElement('div');
  document.body.appendChild(container);
  // jsdom has no scrollIntoView; the component guards it, and stubbing it lets
  // us ASSERT it was asked for rather than merely not crash.
  const scrolled = [];
  window.HTMLElement.prototype.scrollIntoView = function stub(opts) { scrolled.push({ el: this, opts }); };
  await act(async () => { root = createRoot(container); root.render(createElement(PropertiesDoor)); });
  await settle();
  // A SCAN SKIPS THE WHO-PICKER, by design: "someone who scanned a code at a
  // property has already answered 'who are you'" (PropertiesDoor.jsx:286).
  // So the picker is only there when we did NOT arrive with ?apply=, and the
  // helper must not insist on it — my first version did, and these two cases
  // failed for that reason rather than for anything wrong with the app.
  const looking = [...container.querySelectorAll('button')].find((b) => /Looking for a place/i.test(b.textContent));
  if (looking) {
    await act(async () => { looking.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await settle(6);
  } else {
    expect(container.textContent, 'no who-picker AND no listing — the door rendered neither')
      .toMatch(/Available now|Apply/i);
    await settle(4);
  }
  return scrolled;
}

const cardApplies = () => [...container.querySelectorAll('[data-testid="vacancy-apply"]')];
const form = () => container.querySelector('[data-testid="apply-form"]');
const unitSelect = () => container.querySelector('select[aria-label="Which unit"]');

const tap = async (el) => {
  await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await settle(4);
};

describe('the card on the listing — the control he tapped', () => {
  it('PROVEN-TO-CATCH: tapping the CARD’s Apply opens the application form', async () => {
    await openListing();
    const cards = cardApplies();
    expect(cards.length, 'no Apply control rendered on any unit card').toBe(2);
    // Before: the form is not on screen.
    expect(form(), 'the application was already open before anything was tapped').toBeNull();
    await tap(cards[0]);
    // After: it is. On the old code this control was an <a href> — clicking it
    // in jsdom does nothing at all, so this case fails there, which is the
    // whole point of writing it this way round.
    expect(form(), 'tapping the card’s Apply did not open the application').toBeTruthy();
  });

  it('it is a BUTTON, not a link that leaves the page the person is standing on', async () => {
    await openListing();
    expect(cardApplies()[0].tagName).toBe('BUTTON');
  });

  it('and it opens the application FOR THAT UNIT, not a blank one', async () => {
    await openListing();
    await tap(cardApplies()[0]);
    const sel = unitSelect();
    expect(sel, 'the open application has no unit picker').toBeTruthy();
    expect(sel.value).toBe(UNIT_A);
  });

  it('the SECOND card re-selects — a person comparing two units is not ignored', async () => {
    await openListing();
    await tap(cardApplies()[0]);
    expect(unitSelect().value).toBe(UNIT_A);
    // With a boolean instead of a counter the form is already open, nothing
    // visibly happens, and the selection changes under a form they are no
    // longer looking at — or does not change at all.
    await tap(cardApplies()[1]);
    expect(unitSelect().value).toBe(UNIT_B);
  });

  it('the open form is scrolled to, so it is not opened below the fold', async () => {
    const scrolled = await openListing();
    const before = scrolled.length;
    await tap(cardApplies()[0]);
    await act(async () => { await new Promise((r) => requestAnimationFrame(r)); });
    expect(scrolled.length, 'nothing was scrolled into view').toBeGreaterThan(before);
    expect(scrolled[scrolled.length - 1].el).toBe(form());
  });

  it('the real application is behind it — the background questions, and never an SSN', async () => {
    await openListing();
    await tap(cardApplies()[0]);
    const labels = [...container.querySelectorAll('label')].map((l) => l.textContent).join(' | ');
    expect(labels).toMatch(/Last name/i);
    expect(labels).toMatch(/Cell phone/i);
    expect(container.textContent).toMatch(/never ask for a Social Security number/i);
  });
});

describe('a scanned card lands ON the application, not in front of it', () => {
  it('PROVEN-TO-CATCH: arriving with ?apply=<id> opens the form already filled in', async () => {
    window.history.replaceState(null, '', `${window.location.pathname}?${APPLY_PARAM}=${UNIT_B}`);
    await openListing();
    // Before this change ApplyForm opened at useState(false): the person who
    // scanned a code ON the door of the unit they want was shown a button and
    // made to ask again.
    expect(form(), 'a scanned unit still waited behind a tap').toBeTruthy();
    expect(unitSelect().value).toBe(UNIT_B);
  });

  it('a page that merely LOADS with a scan does not also yank the view', async () => {
    window.history.replaceState(null, '', `${window.location.pathname}?${APPLY_PARAM}=${UNIT_B}`);
    const scrolled = await openListing();
    await act(async () => { await new Promise((r) => requestAnimationFrame(r)); });
    expect(scrolled, 'a plain load should not scroll; only an ASK should').toHaveLength(0);
  });

  it('a junk id in the URL lands on the ordinary listing, not a broken form', async () => {
    window.history.replaceState(null, '', `${window.location.pathname}?${APPLY_PARAM}=not-a-uuid`);
    await openListing();
    expect(form()).toBeNull();
    expect(cardApplies()).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// The forwarder is a static file served before any bundle, so it is EXECUTED
// here against a fake window — the same thing a browser does with it — rather
// than read for shapes.
// ---------------------------------------------------------------------------
describe('the hop that ate the unit id, run for real', () => {
  const run = (search, hash = '') => {
    const calls = [];
    const win = { location: { search, hash, replace: (u) => calls.push(u) } };
    new Function('window', 'URLSearchParams', REDIRECT_JS())(win, URLSearchParams);
    return calls;
  };

  it('PROVEN-TO-CATCH: a scanned unit id reaches the door', () => {
    const [to] = run(`?${APPLY_PARAM}=${UNIT_A}`);
    expect(to).toContain('/properties/app/?');
    expect(readApplyTarget(to.slice(to.indexOf('?')))).toBe(UNIT_A);
  });

  it('the door still boots, because properties=1 is forced', () => {
    const [to] = run(`?${APPLY_PARAM}=${UNIT_A}`);
    expect(new URLSearchParams(to.slice(to.indexOf('?'))).get('properties')).toBe('1');
  });

  it('a plain visit still lands on the door', () => {
    expect(run('')[0]).toBe('/properties/app/?properties=1');
  });

  it('properties=1 is never duplicated', () => {
    expect(run('?properties=1')[0]).toBe('/properties/app/?properties=1');
  });

  it('a hash is carried', () => {
    expect(run(`?${APPLY_PARAM}=${UNIT_A}`, '#apply')[0].endsWith('#apply')).toBe(true);
  });

  it('the exact string applyUrl() builds round-trips through it', () => {
    const url = applyUrl(UNIT_A);
    const [to] = run(url.slice(url.indexOf('?')));
    expect(readApplyTarget(to.slice(to.indexOf('?')))).toBe(UNIT_A);
  });

  it('it REPLACES, so back does not bounce the person forward again', () => {
    // Behavioural: a fake window whose replace is absent but assign is present
    // must not be navigated by assign.
    const calls = [];
    const win = { location: { search: '', hash: '', replace: (u) => calls.push(['replace', u]), assign: (u) => calls.push(['assign', u]) } };
    new Function('window', 'URLSearchParams', REDIRECT_JS())(win, URLSearchParams);
    expect(calls.map((c) => c[0])).toEqual(['replace']);
  });

  it('it cannot be turned into an open redirect by what a stranger prints', () => {
    for (const q of ['?next=https://evil.example', '?apply=../../etc', '?properties=0']) {
      const [to] = run(q);
      expect(to.startsWith('/properties/app/?'), `escaped the app scope on ${q}`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Two static properties of a static file. These are READ rather than executed
// because that is what they are: facts about bytes a server sends, which no
// amount of rendering can exercise.
// ---------------------------------------------------------------------------
describe('the static page that serves it', () => {
  const DOOR_HTML = () => read('..', '..', 'public', 'properties', 'index.html');

  it('the forwarder must be a FILE — the page’s CSP forbids inline script', () => {
    expect(read('..', '..', 'public', '_headers')).toMatch(/script-src 'self'/);
    expect(DOOR_HTML()).toContain('<script src="/properties/redirect.js"></script>');
    const inline = DOOR_HTML().match(/<script(?![^>]*\ssrc=)[^>]*>[\s\S]*?<\/script>/i);
    expect(inline, 'an inline script here would be silently blocked by CSP').toBeNull();
  });

  it('the meta refresh survives as the fallback if the script cannot be fetched', () => {
    expect(DOOR_HTML()).toMatch(/url=\/properties\/app\/\?properties=1/);
  });
});
