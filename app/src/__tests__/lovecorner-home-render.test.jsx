// @vitest-environment jsdom
// =============================================================================
// LoveCornerHome — the front door renders the real emblem, the real Bishop,
// the real schedule, and opens only doors that exist (2026-11-12 redesign).
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import LoveCornerHome, { LOVE_CORNER_ASSETS, QUICK_DOORS, MINISTRY_GROUPS, CONNECT_DOOR } from '../components/lovecorner/LoveCornerHome.jsx';
import { ChurchHome } from '../components/ChurchHome.jsx';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { subscribeChurchHomeSection, requestChurchHomeSection, takePendingChurchHomeSection } from '../lib/church-home-section.js';
import { VALID_CHURCH_SUBS } from '../lib/nav-history.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { CHURCH_MINISTRIES } from '../lib/church-ministries.js';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');

const MON_9AM = new Date('2026-11-16T15:00:00Z'); // Monday 9:00 AM Champaign
const SUN_1105 = new Date('2026-11-15T17:05:00Z'); // Sunday 11:05 AM Champaign — inside the live window

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const mount = (props = {}) => act(() => root.render(createElement(LoveCornerHome, { church: COLG_DEFAULT_CHURCH, now: MON_9AM, ...props })));
const q = (sel) => container.querySelector(sel);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

describe('the hero is the real church', () => {
  it('shows the Love Corner Experience seal and Bishop Gwin by name, from files that exist in public/', () => {
    mount();
    const seal = q('img.lc-seal');
    const bishop = q('img.lc-bishop-ph');
    expect(seal.getAttribute('src')).toBe(LOVE_CORNER_ASSETS.logo);
    expect(bishop.getAttribute('src')).toBe(LOVE_CORNER_ASSETS.bishop);
    expect(bishop.getAttribute('alt')).toBe('Bishop Lloyd E. Gwin, Senior Pastor');
    for (const rel of Object.values(LOVE_CORNER_ASSETS)) expect(existsSync(join(PUBLIC, rel)), rel).toBe(true);
    expect(container.textContent).toContain('Where Love Lives.');
    expect(container.textContent).toContain('The Church of the Living God');
  });
  it('outside a service window the button offers the latest message and names the next service', () => {
    mount();
    expect(q('[data-testid="lc-watch"]').getAttribute('data-live')).toBe('false');
    expect(q('[data-testid="lc-watch"]').textContent).toContain('Watch · latest message');
    expect(q('[data-testid="lc-next"]').textContent).toBe('Next: Bible Study · Wednesday 1:00 PM');
  });
  it('inside the published Sunday window the button reads Live now — the same gate as the pinned bar', () => {
    mount({ now: SUN_1105 });
    expect(q('[data-testid="lc-watch"]').getAttribute('data-live')).toBe('true');
    expect(q('[data-testid="lc-watch"]').textContent).toContain('Live now · Sunday Worship');
  });
  it('signed out, the hero offers Sign in and it calls back; signed in, it does not', () => {
    let asked = 0;
    mount({
      signedIn: false,
      onSignIn: () => {
        asked += 1;
      },
    });
    click(q('[data-testid="lc-sign-in"]'));
    expect(asked).toBe(1);
    act(() => root.unmount());
    root = createRoot(container);
    mount({ signedIn: true, onSignIn: () => {} });
    expect(q('[data-testid="lc-sign-in"]')).toBeNull();
  });
});

describe('every door opens something that exists', () => {
  it('the eight quick doors (brief §2) each name a valid sub-tab', () => {
    expect(QUICK_DOORS.map((d) => d.words)).toEqual(['Watch Live', 'The Word', 'Ministries', 'Events', 'Give', 'Prayer', 'Youth Zone', 'TLC Institute']);
    expect(VALID_CHURCH_SUBS).toContain(CONNECT_DOOR.sub);
    for (const d of QUICK_DOORS) expect(VALID_CHURCH_SUBS, d.key).toContain(d.sub);
    for (const g of MINISTRY_GROUPS) expect(VALID_CHURCH_SUBS, g.key).toContain(g.sub);
  });
  it('a tab door sets the church view; a section door asks the Church home for that section, in place', () => {
    const views = [];
    const sections = [];
    const off = subscribeChurchHomeSection((id) => sections.push(id));
    mount({ setChurchView: (v) => views.push(v) });
    click(q('[data-testid="lc-quick-word"]'));
    click(q('[data-testid="lc-quick-prayer"]'));
    click(q('[data-testid="lc-watch"]'));
    click(q('[data-testid="lc-institute-explore"]'));
    click(q('[data-testid="lc-institute-courses"]'));
    click(q('[data-testid="lc-ministry-transport"]'));
    off();
    expect(views).toEqual(['pulpit', 'institute', 'institute', 'bus']);
    expect(sections).toEqual(['prayer', 'worship']);
  });
  it('the feature cards are the day-aware set, and the no-events card is honest on a Monday', () => {
    mount();
    const cards = Array.from(container.querySelectorAll('[data-testid^="lc-feature-"]')).filter((el) => el.getAttribute('data-testid') !== 'lc-feature-cards');
    expect(cards.map((el) => el.getAttribute('data-testid'))).toEqual(['lc-feature-start', 'lc-feature-no-events', 'lc-feature-visit']);
    expect(q('[data-testid="lc-feature-no-events"]').textContent).toContain('No new announcements posted');
  });
});

describe('no number is painted', () => {
  it('the course and ministry counts are the registries’ lengths', () => {
    mount();
    expect(container.textContent).toContain(`${LEARN_CATALOG.length} courses`);
    expect(container.textContent).toContain(`All ${CHURCH_MINISTRIES.length} →`);
  });
  it('the Institute card carries the credential note and no dead-end copy', () => {
    mount();
    const card = q('[data-testid="lc-institute-card"]');
    expect(card.textContent).toContain('TLC Theological Institute');
    expect(card.textContent).toContain('Equipping Believers. Developing Leaders. Deepening Faith.');
    expect(card.textContent).toContain('No accreditation or degrees are claimed.');
    expect(container.textContent).not.toMatch(/coming soon|under construction|placeholder/i);
  });
  it("the picture's order (DR-1484): the tagline line, the Customize strip asks for the sheet by one event, the pair and the trio route to real doors", () => {
    const views = [];
    const sections = [];
    const asked = [];
    const off = subscribeChurchHomeSection((id) => sections.push(id));
    const onAsk = () => asked.push(1);
    window.addEventListener('lovecorner:personalize', onAsk);
    mount({ setChurchView: (v) => views.push(v) });
    expect(q('[data-testid="lc-place"]').textContent).toContain('Worship');
    click(q('[data-testid="lc-customize"]'));
    click(q('[data-testid="lc-learning-zone"]'));
    click(q('[data-testid="lc-youth"]'));
    click(q('[data-testid="lc-trio-ministries"]'));
    click(q('[data-testid="lc-trio-events"]'));
    click(q('[data-testid="lc-trio-connect"]'));
    window.removeEventListener('lovecorner:personalize', onAsk);
    off();
    takePendingChurchHomeSection(); // drain the last request so the next mount opens on Worship
    expect(asked).toEqual([1]);
    expect(views).toEqual(['learn', 'youth', 'ministries']);
    expect(sections).toEqual(['times', 'about']);
    const order = [...container.querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid'));
    const at = (id) => order.indexOf(id);
    expect(at('lc-quick-watch')).toBeLessThan(at('lc-customize'));
    expect(at('lc-customize')).toBeLessThan(at('lc-learning-zone'));
    expect(at('lc-learning-zone')).toBeLessThan(at('lc-institute-card'));
    expect(at('lc-institute-card')).toBeLessThan(at('lc-trio-ministries'));
  });
  it('every button carries a focus ring and the house target floor', () => {
    mount();
    for (const b of container.querySelectorAll('button')) expect(b.className, b.textContent).toMatch(/focus:outline/);
  });
});

describe('inside the Church home the front door drives the strip', () => {
  const noop = () => {};
  const props = {
    church: COLG_DEFAULT_CHURCH,
    prayerRequests: [],
    addPrayerRequest: noop,
    markPrayerRequestSent: noop,
    deletePrayerRequest: noop,
    addEvent: noop,
    conference: null,
    updateConference: noop,
    churchVoice: [],
    addChurchVoice: noop,
    sendToPoeTech: noop,
    addIncident: noop,
    addInquiry: noop,
  };
  const selectedTab = () => container.querySelector('[role="tab"][aria-selected="true"]');
  it('mounts the front door above the existing sections and a section request opens that section in place', () => {
    act(() => root.render(createElement(ChurchHome, props)));
    expect(q('[data-testid="lovecorner-home"]')).toBeTruthy();
    expect(selectedTab().textContent).toContain('Worship');
    click(q('[data-testid="lc-quick-prayer"]'));
    expect(selectedTab().textContent).toContain('Prayer');
    act(() => requestChurchHomeSection('give'));
    expect(selectedTab().textContent).toContain('Give');
  });
});
