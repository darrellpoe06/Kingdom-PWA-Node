// =============================================================================
// A STRANGER AT THE FRONT DOOR SEES THE HOMES, NOT A PIN PAD (DR-0958)
// =============================================================================
// Darrell, 2026-10-11, holding his phone on poetech.us showing "Create your
// profile — No email needed, just your phone number and a 6-digit PIN":
//
//   "Why are you asking new users to create an account before seeing the
//    listings?!!!!!!!!!!!!"   and   "It's advertising!!!!!!!!!!!!"
//
// The signed-out gate in the shell rendered <PasswordAuth /> and NOTHING else,
// so the first thing every stranger met — from a typed address, a printed code
// or an advert — was a form asking them to invent a PIN. The merchandise was
// behind the door.
//
// PROVEN-TO-CATCH (DR-0076 section 3), each at the source of a distinct defect:
//   • rendering PasswordAuth first again fails "the homes come first";
//   • dropping the sign-in control fails "sign-in is one tap away";
//   • collapsing a failed read into "nothing available" fails the honest-empty
//     case, which on the page that sells the homes is the costliest lie here.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The shelf read is the only thing this page needs; everything else is markup.
const loadPublicVacancies = vi.fn();
vi.mock('../modules/properties/cloud.js', () => ({
  loadPublicVacancies: (...a) => loadPublicVacancies(...a),
}));
// The real card is exercised by its own suites; here it only has to render its
// label so "the homes are on the page" is a claim about what a person sees.
vi.mock('../modules/properties/Storefront.jsx', () => ({
  VacancyCard: ({ unit }) => createElement('div', { 'data-testid': `vacancy-${unit.id}` }, unit.label),
}));
vi.mock('../components/PasswordAuth.jsx', () => ({
  default: () => createElement('div', { 'data-testid': 'password-auth' }, 'Create your profile'),
}));

const { default: PublicFrontDoor } = await import('../components/PublicFrontDoor.jsx');

let container; let root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  loadPublicVacancies.mockReset();
});

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(PublicFrontDoor)); });
  for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
}

const HOMES = [
  { id: 'v1', label: 'Bed in a shared multi-family in Champaign, Illinois' },
  { id: 'v2', label: '2-bed multi-family in Champaign, Illinois' },
];

describe('the first thing a stranger meets', () => {
  it('is the homes, and NOT the create-a-profile form', async () => {
    loadPublicVacancies.mockResolvedValue({ ok: true, vacancies: HOMES });
    await mount();
    expect(container.querySelector('[data-testid="public-front-door"]')).toBeTruthy();
    // The whole complaint, as an assertion.
    expect(container.querySelector('[data-testid="password-auth"]')).toBeNull();
    expect(container.textContent).not.toMatch(/6-digit PIN|Create your profile/);
    expect(container.querySelector('[data-testid="vacancy-v1"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="vacancy-v2"]')).toBeTruthy();
    expect(container.textContent).toMatch(/2 places available/);
    expect(container.textContent).toMatch(/No account needed to look/);
  });

  it('counts one place as a place, not "1 places"', async () => {
    loadPublicVacancies.mockResolvedValue({ ok: true, vacancies: [HOMES[0]] });
    await mount();
    expect(container.textContent).toMatch(/1 place available/);
    expect(container.textContent).not.toMatch(/1 places/);
  });
});

describe('sign-in is one tap away, and never the first thing', () => {
  it('a tap opens it, and a tap comes back to the homes', async () => {
    loadPublicVacancies.mockResolvedValue({ ok: true, vacancies: HOMES });
    await mount();
    const signIn = container.querySelector('[data-testid="front-door-sign-in"]');
    expect(signIn, 'everyone who already belongs here needs a way in').toBeTruthy();

    await act(async () => { signIn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(container.querySelector('[data-testid="password-auth"]')).toBeTruthy();

    const back = container.querySelector('[data-testid="front-door-back-to-homes"]');
    expect(back, 'a person who taps sign-in by mistake is not trapped there').toBeTruthy();
    await act(async () => { back.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(container.querySelector('[data-testid="public-front-door"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="password-auth"]')).toBeNull();
  });
});

describe('what it says when it cannot say how many', () => {
  it('a FAILED read never reads as "nothing available" (DR-0946)', async () => {
    // The costliest lie this page could tell: somebody came to rent, and we
    // told them we have nothing when the truth is we could not look.
    loadPublicVacancies.mockResolvedValue({ ok: false, reason: 'read-failed' });
    await mount();
    expect(container.querySelector('[data-testid="front-door-unreadable"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="front-door-none"]')).toBeNull();
    expect(container.textContent).toMatch(/could not be loaded/);
    expect(container.textContent).not.toMatch(/Nothing is open/);
  });

  it('a thrown read is the same honest answer, not a blank page', async () => {
    loadPublicVacancies.mockRejectedValue(new Error('offline'));
    await mount();
    expect(container.querySelector('[data-testid="front-door-unreadable"]')).toBeTruthy();
  });

  it('and a genuinely empty shelf says so plainly', async () => {
    loadPublicVacancies.mockResolvedValue({ ok: true, vacancies: [] });
    await mount();
    expect(container.querySelector('[data-testid="front-door-none"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="front-door-unreadable"]')).toBeNull();
    expect(container.textContent).toMatch(/Nothing is open at this moment/);
    // Even with nothing to show, a person who belongs here can still get in.
    expect(container.querySelector('[data-testid="front-door-sign-in"]')).toBeTruthy();
  });
});

describe('the shell gate itself', () => {
  it('renders the front door, and no longer the PIN form alone', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const here = dirname(fileURLToPath(import.meta.url));
    const shell = readFileSync(join(here, '../poe-financial-mvp-v28.jsx'), 'utf8');
    expect(shell).toMatch(/__gate === 'gate' \? <PublicFrontDoor brand=/);
    // The shell reaches PasswordAuth THROUGH the front door now, so it should
    // not be importing or rendering it itself.
    expect(shell).not.toMatch(/<PasswordAuth\b/);
    expect(shell).not.toMatch(/import PasswordAuth from/);
  });
});
