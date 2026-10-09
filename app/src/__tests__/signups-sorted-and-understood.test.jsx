// =============================================================================
// The users, sorted, and each one understood (DR-0840)
// =============================================================================
// Darrell 2026-10-09: "Want to be able to sort users... comprehensively
// understand our users... what they couldn't stop using vs..."
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { usageProfile, usageLine, sortSignupsBy, SIGNUP_SORTS } from '../lib/user-usage-profile.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({ signups: [], usage: {} }));
vi.mock('../lib/access-metrics-sync.js', () => ({
  fetchAccessSnapshot: async () => ({ signedIn: true, instances: [], members: [], presence: [], invites: [], subscriptions: [], domains: [], errors: {} }),
  currentBuild: () => ({ sha: 'test', time: null }),
  restRpc: async () => ({ data: null, error: null }),
  readSnapshotToken: () => 'tok',
}));
vi.mock('../lib/usage-events.js', () => ({
  fetchUsageFlow: async () => null, topViews: () => [], viewShare: () => 0,
  fetchUserUsage: async (userId) => (userId in H.usage ? H.usage[userId] : null),
}));
vi.mock('../lib/signup-metrics.js', async (orig) => ({ ...(await orig()), fetchSignupMetrics: async () => ({ status: 'ready', data: { summary: { total_accounts: H.signups.length }, signups: H.signups } }) }));
vi.mock('../lib/contacts-store.js', () => ({ cachedContacts: () => [], loadMyContacts: async () => ({ ok: true, rows: [], reason: '' }) }));
vi.mock('../lib/member-roles.js', async (orig) => ({ ...(await orig()), listMyAdminInstances: async () => [], addUserToSpace: async () => ({ ok: true, status: 'added', role: 'member' }) }));
vi.mock('../modules/properties/cloud.js', () => ({ inviteToProperties: async () => ({ ok: true }) }));
vi.mock('../lib/supabase.js', () => ({
  default: { auth: { getSession: async () => ({ data: { session: null } }) } },
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
  phoneLoginEmail: () => '',
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
}));

import AccessUsageMetrics from '../components/AccessUsageMetrics.jsx';

const D = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString();
const ROWS = [
  { user_id: 'u-a', display_name: 'Zed', email: 'zed@example.org', category: 'family', created_at: D(40), last_sign_in_at: D(1) },
  { user_id: 'u-b', display_name: null, email: 'amy@example.org', category: 'self-serve', created_at: D(2), last_sign_in_at: D(2) },
  { user_id: 'u-c', display_name: 'Mel', email: 'mel@example.org', category: 'church', created_at: D(10), last_sign_in_at: D(3) },
];

describe('the profile and the sort (pure)', () => {
  it('what they kept coming back to, what they tried once, and an honest line', () => {
    const p = usageProfile([
      { name: 'Bible', views: 12, last_at: D(1) }, { name: 'Books', views: 3, last_at: D(4) }, { name: 'Cameras', views: 1, last_at: D(9) }, { name: 'Choir', views: 1, last_at: D(2) }, { name: '', views: 5 },
    ]);
    expect(p.total).toBe(17);
    expect(p.kept.map((r) => r.name)).toEqual(['Bible', 'Books']);
    expect(p.once.map((r) => r.name)).toEqual(['Choir', 'Cameras']);
    expect(p.lastAt).toBe(p.rows[0].lastAt);
    expect(usageLine(p)).toBe('17 opens across 4 views in 30 days · kept coming back to Bible (12), Books (3) · tried once: Choir, Cameras.');
    expect(usageLine(usageProfile([]))).toBe('Nothing opened in the last 30 days.');
    expect(usageProfile(null)).toBeNull();
    expect(usageLine(null)).toBe('Their usage is theirs alone until they are in a space you steward.');
  });
  it('sorts by newest, last active, name, space, returned first and never returned first', () => {
    const view = (r) => ({ name: r.display_name, email: r.email, categoryLabel: r.category });
    const ids = (k) => sortSignupsBy(ROWS, k, view).map((r) => r.user_id);
    expect(ids('newest')).toEqual(['u-b', 'u-c', 'u-a']);
    expect(ids('last-active')).toEqual(['u-a', 'u-b', 'u-c']);
    expect(ids('name')).toEqual(['u-b', 'u-c', 'u-a']);          // amy, Mel, Zed
    expect(ids('space')).toEqual(['u-c', 'u-a', 'u-b']);         // church, family, self-serve
    expect(ids('returned')).toEqual(['u-a', 'u-c', 'u-b']);      // u-b signed in only at creation
    expect(ids('never')).toEqual(['u-b', 'u-c', 'u-a']);
    expect(SIGNUP_SORTS.map((s) => s.key)).toEqual(['newest', 'last-active', 'name', 'space', 'returned', 'never']);
    expect(sortSignupsBy(ROWS, 'nonsense', view).map((r) => r.user_id)).toEqual(ids('newest'));
  });
});

describe('the signups list, sorted and understood', () => {
  let container; let root;
  afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; H.signups = []; H.usage = {}; });
  async function mount() {
    container = document.createElement('div'); document.body.appendChild(container);
    await act(async () => { root = createRoot(container); root.render(createElement(AccessUsageMetrics)); });
    for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
  }
  const names = () => Array.from(container.querySelectorAll('[data-testid="signup-row-who"]')).map((n) => n.textContent.split(' · ')[0]);

  it('the sort control reorders the rows the way it says', async () => {
    H.signups = ROWS;
    await mount();
    expect(names()).toEqual(['amy@example.org', 'Mel', 'Zed']);
    const sort = container.querySelector('[data-testid="signup-sort"]');
    await act(async () => { sort.value = 'name'; sort.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(names()).toEqual(['amy@example.org', 'Mel', 'Zed']);
    await act(async () => { sort.value = 'last-active'; sort.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(names()).toEqual(['Zed', 'amy@example.org', 'Mel']);
    await act(async () => { sort.value = 'space'; sort.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(names()).toEqual(['Mel', 'Zed', 'amy@example.org']);
  });

  it('Usage opens what one person kept coming back to and tried once, and says when it is theirs alone', async () => {
    H.signups = ROWS;
    H.usage = { 'u-a': [{ name: 'Bible', views: 9, last_at: D(1) }, { name: 'Cameras', views: 1, last_at: D(5) }] };
    await mount();
    const toggles = Array.from(container.querySelectorAll('[data-testid="signup-usage-toggle"]'));
    expect(toggles.length).toBe(3);
    const zed = toggles[2];
    await act(async () => { zed.click(); });
    for (let i = 0; i < 4; i += 1) await act(async () => { await Promise.resolve(); });
    const fold = container.querySelector('[data-testid="signup-usage"]');
    expect(fold.textContent).toContain('10 opens across 2 views in 30 days');
    expect(fold.textContent).toContain('kept coming back to Bible (9)');
    expect(fold.textContent).toContain('tried once: Cameras');
    await act(async () => { zed.click(); });
    expect(container.querySelector('[data-testid="signup-usage"]')).toBeNull();
    await act(async () => { toggles[0].click(); });
    for (let i = 0; i < 4; i += 1) await act(async () => { await Promise.resolve(); });
    expect(container.querySelector('[data-testid="signup-usage"]').textContent).toContain('theirs alone until they are in a space you steward');
  });
});
