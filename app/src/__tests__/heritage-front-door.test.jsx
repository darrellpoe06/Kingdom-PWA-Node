// =============================================================================
// The Heritage front page of poetech.us (DR-1046; Christina 2026-10-15:
// "definitely the front page of poetech.us for now")
// =============================================================================
// PoeTech's own welcome opens the page; the homes follow with everything
// DR-0958 asked for intact (the sibling suite, the-front-door-shows-the-homes,
// still pins that). Copy and behavior are checked together: the button says
// Sign in and opens the sign-in; the sample link goes where the sample lives.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));

const loadPublicVacancies = vi.fn();
vi.mock('../modules/properties/cloud.js', () => ({ loadPublicVacancies: (...a) => loadPublicVacancies(...a) }));
vi.mock('../modules/properties/Storefront.jsx', () => ({
  VacancyCard: ({ unit }) => createElement('div', { 'data-testid': `vacancy-${unit.id}` }, unit.label),
}));
vi.mock('../components/PasswordAuth.jsx', () => ({
  default: () => createElement('div', { 'data-testid': 'password-auth' }, 'Create your profile'),
}));

const { default: PublicFrontDoor, FRONT_DOOR_COPY } = await import('../components/PublicFrontDoor.jsx');

let container; let root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  loadPublicVacancies.mockReset();
});
async function mount(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(PublicFrontDoor, props)); });
  for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
}
const HOMES = [{ id: 'v1', label: 'Bed in a shared multi-family in Champaign, Illinois' }];

describe('the welcome opens the page, the homes follow', () => {
  it('says who we are, in the tagline Darrell approved, before the first listing', async () => {
    loadPublicVacancies.mockResolvedValue({ ok: true, vacancies: HOMES });
    await mount();
    const welcome = container.querySelector('[data-testid="front-door-welcome"]');
    expect(welcome).toBeTruthy();
    expect(welcome.textContent).toContain('PoeTech');
    expect(welcome.textContent).toContain('Life · Soul · Money · Family');
    expect(welcome.textContent).toContain(FRONT_DOOR_COPY.headline);
    expect(welcome.textContent).toContain(FRONT_DOOR_COPY.free1);
    expect(welcome.textContent).toContain(FRONT_DOOR_COPY.free2);
    // The welcome comes BEFORE the homes in the document, and the homes are still there.
    const homes = container.querySelector('[data-testid="vacancy-v1"]');
    expect(homes).toBeTruthy();
    expect(welcome.compareDocumentPosition(homes) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.textContent).toMatch(/No account needed to look/);
  });

  it('the welcome\'s Sign in opens the same sign-in, and the way back returns to the homes', async () => {
    loadPublicVacancies.mockResolvedValue({ ok: true, vacancies: HOMES });
    await mount();
    const top = container.querySelector('[data-testid="front-door-sign-in-top"]');
    expect(top.textContent).toMatch(/Sign in/);
    await act(async () => { top.click(); });
    expect(container.querySelector('[data-testid="password-auth"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="front-door-welcome"]')).toBeNull();
    await act(async () => { container.querySelector('[data-testid="front-door-back-to-homes"]').click(); });
    expect(container.querySelector('[data-testid="front-door-welcome"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="vacancy-v1"]')).toBeTruthy();
  });

  it('the sample link goes to the family sample that exists in this app', async () => {
    loadPublicVacancies.mockResolvedValue({ ok: true, vacancies: [] });
    await mount();
    const a = container.querySelector('[data-testid="front-door-sample"]');
    expect(a.getAttribute('href')).toBe('/?demo=family-of-4');
    const shell = readFileSync(join(HERE, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(shell).toContain("'family-of-4'");
  });

  it('the church door is untouched: its own sign-in, no welcome, no homes', async () => {
    await mount({ brand: { name: 'The Love Corner', eyebrow: 'The Church of the Living God' } });
    expect(container.querySelector('[data-testid="password-auth"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="front-door-welcome"]')).toBeNull();
    expect(loadPublicVacancies).not.toHaveBeenCalled();
  });

  it('is painted, not photographed, and names no color inline on text', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'PublicFrontDoor.jsx'), 'utf8');
    expect(src).not.toMatch(/<img/);
    expect(src).not.toMatch(/unsplash|pexels/i);
    expect(src).not.toMatch(/style=\{\{[^}]*color:\s*'#/);
    for (const b of container ? [] : []) expect(b).toBeTruthy();
  });
});
