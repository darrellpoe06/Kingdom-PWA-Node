// @vitest-environment jsdom
// =============================================================================
// The Poe Properties front page says what Darrell's mock-up says (2026-10-13)
// =============================================================================
// Darrell, 2026-10-13, with the picture: "redesign the front welcome page ...
// to look as close as possible to the attached image ... This is a visual
// redesign only." These pins hold the words and the wiring together (copy and
// behavior are tested together, DR-0691): the welcome lines, the six cards
// in his wording, the footer wording that must never become another slogan,
// the signed-out notice shown ONLY to someone who left, and the proof that a
// card still opens the same portal the model names.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

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
return {
  supabase: {
    auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
    from: () => queryStub(),
    rpc: async () => ({ data: null, error: null }),
  },
  onAuthChange: (cb) => { cb(null); return () => {}; },
  default: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({}),
    },
    rpc: async () => ({ data: [], error: null }),
  },
  phoneLoginEmail: () => '',
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
  readPersistedSession: () => null,
  resolveInitialSession: (emit, io) => { emit(io.readStored ? io.readStored() : null); },
  signOut: async () => ({}),
}; });
vi.mock('../modules/properties/PropertiesApp.jsx', () => ({ default: () => createElement('div', { 'data-testid': 'properties-app' }, 'module') }));
vi.mock('../modules/properties/cloud.js', () => ({
  loadPublicVacancies: async () => ({ ok: true, vacancies: [] }),
  submitApplication: async () => ({ ok: true }),
}));

import PropertiesDoor from '../components/PropertiesDoor.jsx';
import { CARD_COPY, FOOTER_WORDING, WELCOME_CSS, cardCopy } from '../components/PoePropertiesWelcome.jsx';
import { WHO_OPTIONS } from '../modules/properties/model.js';
import { DOORS, leaveDoor } from '../lib/door-session.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(PropertiesDoor)); });
  await act(async () => { for (let i = 0; i < 4; i += 1) await Promise.resolve(); });
  return container;
}
const click = (el) => act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  root = null;
  try { window.localStorage.clear(); } catch { /* noop */ }
});

describe('the front page carries the welcome from the mock-up', () => {
  it('the lock-up: "Poe" red, "Properties" beside it, PROPERTY MANAGEMENT under it', async () => {
    const el = await mount();
    const h1 = el.querySelector('h1');
    expect(h1.textContent).toBe('Poe Properties');
    expect(h1.querySelector('.pp-red')?.textContent).toBe('Poe');
    expect(el.querySelector('.pp-strap')?.textContent).toMatch(/Property Management/i);
    expect(el.querySelector('svg.pp-mark'), 'the roof mark renders beside the name').toBeTruthy();
  });

  it('the heading and its two lines, word for word', async () => {
    const el = await mount();
    const h2 = el.querySelector('#pp-welcome-heading');
    expect(h2.textContent.replace(/\s+/g, ' ').trim()).toBe('Welcome to Poe Properties');
    const leads = Array.from(el.querySelectorAll('.pp-lead')).map((p) => p.textContent);
    expect(leads).toEqual([
      'Manage your home, payments, and requests all in one place.',
      'Please select the option that best describes you.',
    ]);
    expect(el.querySelector('.pp-photo img')?.getAttribute('src')).toBe('/properties/welcome-entry.jpg');
  });

  it('six cards, in WHO_OPTIONS order, in Darrell\'s wording', async () => {
    const el = await mount();
    const cards = Array.from(el.querySelectorAll('.pp-card'));
    expect(cards).toHaveLength(WHO_OPTIONS.length);
    expect(cards.map((c) => c.getAttribute('data-portal'))).toEqual(WHO_OPTIONS.map((w) => w.id));
    expect(cards.map((c) => c.querySelector('.pp-card-title').textContent)).toEqual([
      'Looking for a Place', 'I Live Here', 'I Live Here with My Family',
      'I Do the Work (1099)', 'I Manage Properties', 'I Own Properties',
    ]);
    expect(cards.map((c) => c.querySelector('.pp-card-blurb').textContent)).toEqual([
      'View available properties and apply.',
      'Your unit, work orders, messages, and payment history.',
      'The same door as the person on the lease.',
      'Your jobs, property history, and two-step documentation.',
      'The work board, dispatch, rent, and the whole record.',
      'Run your doors here, or bring your own portfolio.',
    ]);
    // Every card copy entry names a real portal; a typo in an id would fall
    // back to the model's words in silence, so it is checked here.
    for (const id of Object.keys(CARD_COPY)) expect(WHO_OPTIONS.some((w) => w.id === id), `${id} is not a portal`).toBe(true);
    expect(cardCopy({ id: 'nope', label: 'Fallback', blurb: 'From the model.' })).toEqual({ title: 'Fallback', blurb: 'From the model.' });
  });

  it('only the one portal that needs no account says so', async () => {
    const el = await mount();
    const pills = Array.from(el.querySelectorAll('.pp-card .pp-pill'));
    expect(pills).toHaveLength(1);
    expect(pills[0].closest('.pp-card').getAttribute('data-portal')).toBe('applicant');
  });

  it('a card is still the same door: tapping "I Live Here" opens the tenant step, not a stranger\'s', async () => {
    const el = await mount();
    const tenant = el.querySelector('.pp-card[data-portal="tenant"]');
    await click(tenant);
    // The next screen is the model's own copy for that portal (unchanged).
    expect(el.textContent).toContain(WHO_OPTIONS.find((w) => w.id === 'tenant').blurb);
    expect(el.querySelector('.pp-cards'), 'the picker gave way to the portal').toBeNull();
  });

  it('every card is a real button with a visible focus ring', async () => {
    const el = await mount();
    for (const c of el.querySelectorAll('.pp-card')) {
      expect(c.tagName).toBe('BUTTON');
      expect(c.className).toMatch(/focus:outline/);
    }
  });
});

describe('the signed-out notice', () => {
  it('is NOT shown to someone who never left', async () => {
    const el = await mount();
    expect(el.querySelector('[data-testid="properties-signed-out-notice"]')).toBeNull();
    expect(el.textContent).not.toMatch(/signed out on this device/i);
  });

  it('is shown to someone who left this door, with the exact words and "Come back in"', async () => {
    leaveDoor(DOORS.properties);
    const el = await mount();
    const notice = el.querySelector('[data-testid="properties-signed-out-notice"]');
    expect(notice).toBeTruthy();
    expect(notice.textContent).toMatch(/You’re signed out on this device\./);
    expect(notice.textContent).toMatch(/Your PoeTech sign-in is still active — this door only forgot you\./);
    const cta = notice.querySelector('button');
    expect(cta.textContent).toMatch(/Come back in/i);
    await click(cta);
    expect(el.querySelector('[data-testid="properties-signed-out-notice"]'), 'Come back in clears the notice').toBeNull();
  });
});

describe('the footer', () => {
  it('says POE PROPERTIES · POWERED BY POETECH and nothing else', async () => {
    const el = await mount();
    const footer = el.querySelector('[data-testid="properties-door-footer"]');
    const said = footer.textContent.replace(/\s+/g, ' ').trim().toUpperCase().replace(/ ?· ?/g, ' · ');
    expect(said).toBe(FOOTER_WORDING);
    expect(footer.className).toMatch(/pp-footer/);
  });
});

describe('the two steps past the cards wear the same look (2026-10-13)', () => {
  it('the vacancies step: a red Back, the panel, the portal title as kicker, the shelf title', async () => {
    const el = await mount();
    await click(el.querySelector('.pp-card[data-portal="applicant"]'));
    const panel = el.querySelector('[data-testid="vacancies-panel"]');
    expect(panel, 'the vacancies panel renders').toBeTruthy();
    expect(panel.className).toMatch(/pp-panel/);
    expect(panel.querySelector('.pp-kicker').textContent).toBe('Looking for a Place');
    expect(panel.querySelector('.pp-panel-title').textContent).toMatch(/Available now/);
    const back = Array.from(el.querySelectorAll('button')).find((b) => /Back/.test(b.textContent));
    expect(back.className).toMatch(/pp-back/);
    expect(back.className).toMatch(/focus:outline/);
    // the address sentence and the apply button are still here, restyled
    expect(el.querySelector('[data-testid="address-promise"]')).toBeTruthy();
    const apply = Array.from(el.querySelectorAll('button')).find((b) => /Apply — no account needed/.test(b.textContent));
    expect(apply.className).toMatch(/pp-btn/);
    await click(apply);
    const form = el.querySelector('[data-testid="apply-form"]');
    expect(form.className).toMatch(/pp-panel/);
    expect(form.className).toMatch(/pp-form/);
    expect(Array.from(form.querySelectorAll('legend')).length).toBeGreaterThan(0);
    const send = Array.from(form.querySelectorAll('button')).find((b) => /Send my application/.test(b.textContent));
    expect(send.className).toMatch(/pp-btn/);
    expect(send.disabled, 'an empty application cannot be sent').toBe(true);
    await click(back);
    expect(el.querySelector('.pp-cards'), 'Back returns to the six cards').toBeTruthy();
  });

  it('the sign-in step: the card title, the red pill, and the same sign-in form behind it', async () => {
    const el = await mount();
    await click(el.querySelector('.pp-card[data-portal="landlord"]'));
    const panel = el.querySelector('[data-testid="sign-in-panel"]');
    expect(panel).toBeTruthy();
    expect(panel.querySelector('.pp-panel-title').textContent).toBe('I Own Properties');
    expect(panel.querySelector('.pp-panel-lead').textContent).toBe(WHO_OPTIONS.find((w) => w.id === 'landlord').blurb);
    const go = Array.from(panel.querySelectorAll('button')).find((b) => /Sign in \/ create a profile/.test(b.textContent));
    expect(go.className).toMatch(/pp-btn/);
    expect(el.querySelectorAll('input'), 'no form until asked for').toHaveLength(0);
    await click(go);
    const auth = el.querySelector('.pp-auth');
    expect(auth, 'the sign-in form sits in its own panel').toBeTruthy();
    expect(auth.querySelectorAll('input').length).toBeGreaterThan(0);
  });

  it('the brand red is a true red, in the light themes and on midnight, and the red discs are solid', () => {
    expect(WELCOME_CSS).toMatch(/\.pp-door\{[^}]*--pp-red:#E00000;/);
    expect(WELCOME_CSS).toMatch(/\[data-theme="midnight"\]\.pp-door\{[^}]*--pp-red:#FF3B3B;/);
    expect(WELCOME_CSS).toMatch(/\.pp-disc\.is-red\{background:var\(--pp-red\);color:#FFFFFF\}/);
    // the shared shelf and sign-in form wear the door's red, not their own green
    expect(WELCOME_CSS).toMatch(/\.pp-door \.text-\\\[\\#2F5D50\\\]\{color:var\(--pp-red\)!important\}/);
  });
});
