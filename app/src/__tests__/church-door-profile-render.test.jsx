// =============================================================================
// church-door-profile-render.test.jsx — copy and behaviour tested together
// (DR-0691): the office saves what it typed, the phone refuses what the wall
// would refuse in the wall's words, the steward's form builds the one call,
// and the Give panel shows another church an honest line instead of COLG's
// list (0297, DR-1066).
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

const calls = { save: [], provision: [] };
let loadAnswer;
let saveAnswer;
let provisionAnswer;
let myProfileAnswer;

vi.mock('../lib/church-profile-sync.js', () => ({
  loadChurchProfileFor: async () => loadAnswer,
  loadMyChurchProfile: async () => myProfileAnswer,
  saveChurchProfile: async (id, parts) => { calls.save.push([id, parts]); return saveAnswer; },
  provisionChurch: async (args) => { calls.provision.push(args); return provisionAnswer; },
  amPlatformSteward: async () => ({ ok: true, steward: false }),
}));

import { ChurchDoorProfile, AddAChurch } from '../components/ChurchDoorProfile.jsx';
import { ChurchGivePanel } from '../components/ChurchGiving.jsx';
import { GIVING_CHANNELS } from '../lib/giving.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
beforeEach(() => {
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  calls.save.length = 0; calls.provision.length = 0;
  loadAnswer = { ok: true, instanceId: 'c1', slug: 'grace-church', displayName: 'Grace Church', profile: null };
  saveAnswer = { ok: true, profile: { instance_id: 'c1', profile: { name: 'Grace Church' }, giving_channels: [], is_public: false, updated_at: '2026-10-16T05:00:00Z' } };
  provisionAnswer = { ok: true, instanceId: 'i-new', slug: 'grace-church', created: true, leaderEmail: 'bishop@grace.org', leaderRole: 'owner' };
  myProfileAnswer = { ok: false, reason: 'signed-out', message: '' };
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const flush = async () => { await act(async () => { await Promise.resolve(); await Promise.resolve(); }); };
const type = async (el, value) => {
  const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set;
  await act(async () => { setter.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); });
};
const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
const gov = { governs: true, space: { instanceId: 'c1', slug: 'grace-church', displayName: 'Grace Church' }, myRole: 'owner' };

describe('ChurchDoorProfile — the office edits its own door', () => {
  it('reads the row, shows every field even when no row exists yet, and says so', async () => {
    await act(async () => root.render(createElement(ChurchDoorProfile, { gov })));
    await flush();
    expect(container.querySelector('[data-door-new]').textContent).toMatch(/Nothing has been published/);
    expect(container.querySelector('#cdp-name').value).toBe('Grace Church');
    expect(container.querySelectorAll('[data-channel-row]').length).toBe(1);
    expect(container.querySelector('[data-save-door]').disabled).toBe(false);
  });

  it('refuses an http link on the phone in the wall’s words and keeps Save shut; an https link opens it', async () => {
    await act(async () => root.render(createElement(ChurchDoorProfile, { gov })));
    await flush();
    await type(container.querySelector('#cdp-label-0'), 'Cash App');
    await type(container.querySelector('#cdp-url-0'), 'http://cash.app/$Grace');
    expect(container.querySelector('[data-door-note]').textContent).toMatch(/complete https link \(Cash App\)/);
    expect(container.querySelector('[data-save-door]').disabled).toBe(true);
    expect(calls.save.length).toBe(0);
    await type(container.querySelector('#cdp-url-0'), 'https://cash.app/$Grace');
    expect(container.querySelector('[data-save-door]').disabled).toBe(false);
  });

  it('saves exactly what the office typed — the profile, the channels, the public flag — and reports it', async () => {
    await act(async () => root.render(createElement(ChurchDoorProfile, { gov })));
    await flush();
    await type(container.querySelector('#cdp-site'), 'https://grace.org');
    await type(container.querySelector('#cdp-givePage'), 'https://grace.org/give');
    await act(async () => {
      const sel = container.querySelector('#cdp-kind-0');
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, 'cashapp'); sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await type(container.querySelector('#cdp-url-0'), 'https://cash.app/$Grace');
    await type(container.querySelector('#cdp-display-0'), '$Grace');
    await click(container.querySelector('[data-public]'));
    await click(container.querySelector('[data-save-door]'));
    await flush();
    expect(calls.save.length).toBe(1);
    const [id, parts] = calls.save[0];
    expect(id).toBe('c1');
    expect(parts.profile).toEqual({ name: 'Grace Church', site: 'https://grace.org', links: { give: 'https://grace.org/give' } });
    expect(parts.channels).toEqual([{ id: 'cashapp', label: 'Cash App', url: 'https://cash.app/$Grace', display: '$Grace', how: 'Opens the church’s Cash App.' }]);
    expect(parts.isPublic).toBe(true);
    expect(container.querySelector('[data-door-note]').textContent).toMatch(/Saved\. 1 giving channel published, and the door is public/);
    expect(container.querySelector('[data-door-updated]').textContent).toMatch(/Last saved/);
  });

  it('a refusal from the wall is shown in the wall’s words, not a generic error', async () => {
    saveAnswer = { ok: false, reason: 'refused', message: 'giving channels refused: each channel url must be a complete https link (Zelle)' };
    await act(async () => root.render(createElement(ChurchDoorProfile, { gov })));
    await flush();
    await type(container.querySelector('#cdp-label-0'), 'Zelle');
    await type(container.querySelector('#cdp-url-0'), 'https://enroll.zellepay.com/qr-codes/?data=x');
    await click(container.querySelector('[data-save-door]'));
    await flush();
    expect(container.querySelector('[data-door-note]').textContent).toMatch(/The server refused it: giving channels refused/);
  });

  it('a read that fails says so and how to recover — never a blank card', async () => {
    loadAnswer = { ok: false, reason: 'network-error', message: 'reading the church profile timed out after 15000 ms' };
    await act(async () => root.render(createElement(ChurchDoorProfile, { gov })));
    await flush();
    expect(container.querySelector('[data-door-error]').textContent).toMatch(/could not be read: reading the church profile timed out/);
    expect(container.querySelector('[data-door-error]').textContent).toMatch(/Refresh/);
    expect(container.querySelector('[data-profile-fields]')).toBeNull();
  });

  it('renders nothing for a person who does not govern (the tab never lists it for them anyway)', async () => {
    await act(async () => root.render(createElement(ChurchDoorProfile, { gov: { governs: false } })));
    await flush();
    expect(container.querySelector('[data-testid="church-door-profile"]')).toBeNull();
  });
});

describe('AddAChurch — the steward’s one call', () => {
  it('suggests the short name from the church name, keeps the button shut until the three starred fields are sound, then makes exactly one call', async () => {
    await act(async () => root.render(createElement(AddAChurch, {})));
    expect(container.querySelector('[data-add-church]').disabled).toBe(true);
    await type(container.querySelector('#aac-name'), 'Grace Church of Compton');
    expect(container.querySelector('#aac-slug').value).toBe('grace-church-of-compton');
    await type(container.querySelector('#aac-email'), 'not-an-email');
    expect(container.querySelector('[data-add-note]').textContent).toMatch(/real email/);
    expect(container.querySelector('[data-add-church]').disabled).toBe(true);
    await type(container.querySelector('#aac-email'), 'Bishop@Grace.org');
    await type(container.querySelector('#aac-site'), 'https://grace.org');
    expect(container.querySelector('[data-add-church]').disabled).toBe(false);
    await click(container.querySelector('[data-add-church]'));
    await flush();
    expect(calls.provision).toEqual([{ slug_in: 'grace-church-of-compton', display_name_in: 'Grace Church of Compton', leader_email_in: 'bishop@grace.org', leader_role_in: 'owner', profile_in: { site: 'https://grace.org' } }]);
    expect(container.querySelector('[data-add-note]').textContent).toMatch(/Grace Church of Compton is on the platform as “grace-church”/);
    expect(container.querySelector('[data-add-result]').textContent).toMatch(/i-new/);
    expect(container.querySelector('[data-door-constraint]').textContent).toMatch(/installable door/);
  });

  it('a second call for an existing church is reported as what it is — a leader added, nothing else', async () => {
    provisionAnswer = { ok: true, instanceId: 'i-old', slug: 'grace-church', created: false, leaderEmail: 'office@grace.org', leaderRole: 'admin' };
    await act(async () => root.render(createElement(AddAChurch, {})));
    await type(container.querySelector('#aac-name'), 'Grace Church');
    await type(container.querySelector('#aac-email'), 'office@grace.org');
    await click(container.querySelector('[data-add-church]'));
    await flush();
    expect(container.querySelector('[data-add-note]').textContent).toMatch(/already existed; office@grace.org was added as its admin\. Nothing else changed/);
  });

  it('the wall’s refusal of a non-steward is named', async () => {
    provisionAnswer = { ok: false, reason: 'forbidden', message: 'only a platform steward may add a church' };
    await act(async () => root.render(createElement(AddAChurch, {})));
    await type(container.querySelector('#aac-name'), 'Grace Church');
    await type(container.querySelector('#aac-email'), 'office@grace.org');
    await click(container.querySelector('[data-add-church]'));
    await flush();
    expect(container.querySelector('[data-add-note]').textContent).toMatch(/only a platform steward/);
  });
});

describe('the Give panel — whose channels', () => {
  const grace = { name: 'Grace Church', site: 'https://grace.org', links: { give: 'https://grace.org/give' } };
  it('another church with no published rows gets the honest line and ZERO channel links — never COLG’s', async () => {
    myProfileAnswer = { ok: true, instanceId: 'c1', slug: 'grace-church', displayName: 'Grace Church', profile: null };
    await act(async () => root.render(createElement(ChurchGivePanel, { church: grace, onClose: () => {} })));
    await flush();
    expect(container.querySelector('[data-giving-channels-empty]').textContent).toMatch(/not published its giving channels/);
    expect(container.querySelectorAll('[data-giving-channels] a').length).toBe(0);
    expect(container.textContent).not.toMatch(/TheLoveCorner|zellepay/);
  });
  it('the office’s rows are what the panel opens, and the provenance line says the office entered them', async () => {
    myProfileAnswer = { ok: true, instanceId: 'c1', slug: 'grace-church', displayName: 'Grace Church', profile: { giving_channels: [{ id: 'cashapp', label: 'Cash App', url: 'https://cash.app/$Grace', display: '$Grace', how: 'Opens Cash App.' }], profile: { name: 'Grace Church' } } };
    await act(async () => root.render(createElement(ChurchGivePanel, { church: grace, onClose: () => {} })));
    await flush();
    const links = [...container.querySelectorAll('[data-giving-channels="profile"] a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['https://cash.app/$Grace']);
    expect(container.querySelector('[data-giving-provenance]').textContent).toMatch(/entered by its office/);
  });
  it('COLG, signed out or with no row, still shows its slide constants exactly as before', async () => {
    const colg = { name: 'The Church of the Living God', site: 'https://thechurchofthelivinggod.com', links: { give: 'https://thechurchofthelivinggod.com' } };
    await act(async () => root.render(createElement(ChurchGivePanel, { church: colg, onClose: () => {} })));
    await flush();
    const links = [...container.querySelectorAll('[data-giving-channels="colg"] a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(GIVING_CHANNELS.map((c) => c.url));
    expect(container.querySelector('[data-giving-provenance]').textContent).toMatch(/GIVE ONLINE slide/);
  });
});
