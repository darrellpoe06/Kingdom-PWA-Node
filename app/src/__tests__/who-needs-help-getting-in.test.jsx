// =============================================================================
// Did they get in, who needs help, and finding a person fast (DR-1592)
// =============================================================================
// Darrell 2026-11-19: "How do I know who signed up and if and when they got
// in?... how do we help people when they have onboarding issues?!!!!! We should
// be able to see these issues from our data logs etc!!!!!" Each rule below has
// a case that would fail if the rule were removed (DR-0076 §3).
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { indexSignIns, signInLine, signInCoverage, needsHelp, invitesWithoutAccount, matchesSearch, indexDoors, QUIET_DAYS } from '../lib/person-onboarding.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const NOW = Date.parse('2026-11-19T18:00:00Z');
const A = (days) => new Date(NOW - days * 86400000).toISOString();
const codes = (list, id) => (list.find((h) => h.userId === id) || { reasons: [] }).reasons.map((r) => r.code);

describe('the sign-in record per person (pure)', () => {
  it('the latest success of any kind, with the method only where a record names it', () => {
    const idx = indexSignIns({
      people: [
        { user_id: 'otp', last_sign_in_at: A(9), gotrue_login_at: A(1), gotrue_method: 'email', last_password_login_at: null },
        { user_id: 'pin', last_sign_in_at: A(2), last_password_login_at: A(2), gotrue_login_at: A(2), gotrue_method: 'phone' },
        { user_id: 'pw', last_sign_in_at: A(1), last_password_login_at: A(1) },
        { user_id: 'none', last_sign_in_at: null },
      ],
    });
    expect(idx.get('otp')).toMatchObject({ successAt: A(1), method: 'email' });
    expect(idx.get('pin').method).toBe('phone');
    expect(idx.get('pw').method).toBe('password');
    expect(idx.get('none').successAt).toBeNull();
    expect(signInLine(idx.get('otp'), NOW)).toBe('Last got in yesterday by email');
    expect(signInLine(idx.get('pw'), NOW)).toBe('Last got in yesterday by password or PIN');
    expect(signInLine(idx.get('none'), NOW)).toBe('Has never got in');
    expect(signInLine(undefined, NOW)).toBe('Sign-in record: none read for this account.');
  });

  it('failures since, and a link sent and not used, are on the line', () => {
    const idx = indexSignIns({
      people: [
        { user_id: 's', last_sign_in_at: A(5), last_failed_at: A(1), failed_since_success: 3, failed_30d: 4 },
        { user_id: 'l', last_sign_in_at: null, link_sent_at: A(2) },
        { user_id: 'old', last_sign_in_at: A(1), failed_30d: 2, failed_since_success: 0 },
      ],
    });
    expect(signInLine(idx.get('s'), NOW)).toBe('Last got in 5d ago · 3 failed tries since (last yesterday)');
    expect(signInLine(idx.get('l'), NOW)).toBe('Has never got in · sign-in link sent 2d ago, not used');
    expect(signInLine(idx.get('old'), NOW)).toBe('Last got in yesterday · 2 failed in 30 days, none since');
  });

  it('says plainly which methods are and are not recorded', () => {
    expect(signInCoverage({ gotrue_audit: 'read', password_record_since: A(14) })).toContain('Password and phone+PIN tries, right or wrong, are recorded from');
    expect(signInCoverage({ gotrue_audit: 'read' })).toContain('Royalty Link or Google sign-in is read from the auth server');
    expect(signInCoverage({ gotrue_audit: 'unreadable: permission denied' })).toContain('could not be read (unreadable: permission denied)');
    expect(signInCoverage({})).toContain('Not recorded: a wrong or expired Royalty Link code, and a try with a phone or email that has no account.');
  });
});

describe('who needs help (pure, one proven-to-catch case per rule)', () => {
  const people = [
    { userId: 'never', created_at: A(6), lastActiveAt: A(6), category: 'self-serve' },
    { userId: 'nospace-failing', created_at: A(10), lastActiveAt: A(5), category: 'unprovisioned' },
    { userId: 'link', created_at: A(3), lastActiveAt: null, category: 'unprovisioned' },
    { userId: 'tenant', created_at: A(20), lastActiveAt: A(1), category: 'other' },
    { userId: 'quiet', created_at: A(60), lastActiveAt: A(QUIET_DAYS + 5), category: 'family' },
    { userId: 'fine', created_at: A(60), lastActiveAt: A(1), category: 'family' },
    { userId: 'fresh', created_at: new Date(NOW - 3600000).toISOString(), lastActiveAt: null, category: 'self-serve' },
    { userId: 'probe', created_at: A(30), lastActiveAt: A(30), category: 'our-probe' },
  ];
  const signIns = indexSignIns({
    people: [
      { user_id: 'never', last_sign_in_at: A(6), spaces: [{ slug: 'u-never', joined_at: A(6) }] },
      // Only rows with instance_id NULL in the database: no space, failing.
      {
        user_id: 'nospace-failing',
        last_sign_in_at: A(5),
        last_password_login_at: A(5),
        last_failed_at: A(1),
        failed_since_success: 3,
        failed_30d: 4,
        spaces: [],
      },
      { user_id: 'link', link_sent_at: A(2), spaces: [{ slug: 'u-link', joined_at: A(3) }] },
      {
        user_id: 'tenant',
        last_sign_in_at: A(1),
        spaces: [
          { slug: 'poe-properties', name: 'Poe Properties', joined_at: A(12) },
          { slug: 'poe-family', joined_at: A(20) },
        ],
        open_invites: [{ id: 'i1', door: 'properties', role_label: 'field_worker', created_at: A(4) }],
      },
      { user_id: 'quiet', last_sign_in_at: A(QUIET_DAYS + 5), spaces: [{ slug: 'poe-family', joined_at: A(60) }] },
      {
        user_id: 'fine',
        last_sign_in_at: A(1),
        spaces: [
          { slug: 'poe-family', joined_at: A(60) },
          { slug: 'colg', joined_at: A(50) },
        ],
      },
      { user_id: 'probe', last_sign_in_at: A(0), last_failed_at: A(0), failed_since_success: 9, spaces: [] },
    ],
  });
  const doors = {
    since: A(8),
    index: indexDoors({
      people: [
        { user_id: 'tenant', doors: [{ door: 'poetech', first_at: A(7), last_at: A(1), n: 30 }] },
        { user_id: 'fine', doors: [{ door: 'lovecorner', first_at: A(7), last_at: A(1), n: 4 }] },
      ],
    }),
  };
  const list = needsHelp(people, signIns, doors, NOW);

  it('created an account and never came back', () => {
    expect(codes(list, 'never')).toEqual(['never-back']);
    expect(list.find((h) => h.userId === 'never').reasons[0].text).toBe('Created an account 6d ago and has not been back since.');
    // A signup an hour old is not stuck yet.
    expect(codes(list, 'fresh')).toEqual([]);
  });

  it('a person whose only rows have no space still appears, failing and with no space', () => {
    expect(codes(list, 'nospace-failing')).toEqual(['failing', 'no-space']);
    const f = list.find((h) => h.userId === 'nospace-failing').reasons;
    expect(f[0].text).toBe('3 failed sign-in tries with no success since (last yesterday).');
    expect(f[1].text).toBe('Got in 5d ago but has no space yet, so there is nothing for them inside.');
  });

  it('a link emailed and never followed', () => {
    expect(codes(list, 'link')).toContain('link-unused');
    expect(list.find((h) => h.userId === 'link').reasons.find((r) => r.code === 'link-unused').text).toBe(
      'A sign-in link was emailed 2d ago and no sign-in followed.'
    );
  });

  it('in a space whose app they never opened, and an invitation not claimed', () => {
    const t = list.find((h) => h.userId === 'tenant');
    expect(t.reasons.map((r) => r.code).sort()).toEqual(['door-unopened', 'invite-open']);
    expect(t.reasons.find((r) => r.code === 'door-unopened').text).toBe(
      'In Poe Properties since 1w ago, but has not opened the Poe Properties app since door tracking began on Nov 11, 2026.'
    );
    expect(t.reasons.find((r) => r.code === 'invite-open').text).toBe('Invited to Poe Properties as field worker 4d ago; the invitation is not claimed yet.');
    // Their PoeTech space is never flagged: that is the app they do use.
    expect(t.reasons.some((r) => r.text.includes('PoeTech app'))).toBe(false);
    // Opened the Love Corner since: not flagged.
    expect(codes(list, 'fine')).toEqual([]);
  });

  it('no app is flagged before door tracking has run for the grace days, or when doors are unreadable', () => {
    const early = needsHelp(people, signIns, { since: A(1), index: new Map() }, NOW);
    expect(codes(early, 'tenant')).toEqual(['invite-open']);
    const blind = needsHelp(people, signIns, null, NOW);
    expect(codes(blind, 'tenant')).toEqual(['invite-open']);
  });

  it('was active, then went quiet', () => {
    expect(codes(list, 'quiet')).toEqual(['quiet']);
    expect(list.find((h) => h.userId === 'quiet').reasons[0].text).toBe('Was active, last seen 2w ago.');
  });

  it('our own probe is never a person who needs help', () => {
    expect(list.some((h) => h.userId === 'probe')).toBe(false);
  });

  it('with the sign-in record unreadable, only what the list itself proves is said', () => {
    const blind = needsHelp(people, null, null, NOW);
    expect(codes(blind, 'never')).toEqual(['never-back']);
    expect(codes(blind, 'nospace-failing')).toEqual([]);
  });

  it('an invitation to an address with no account is its own entry', () => {
    const o = invitesWithoutAccount(
      {
        invites_without_account: [
          { id: 'x', address: 'worker@example.org', role_label: 'field_worker', display_name: 'Worker', door: 'properties', created_at: A(6) },
        ],
      },
      NOW
    );
    expect(o).toEqual([
      {
        id: 'x',
        address: 'worker@example.org',
        name: 'Worker',
        at: A(6),
        text: 'Invited to Poe Properties as field worker 6d ago; no account with this address yet.',
      },
    ]);
    expect(invitesWithoutAccount(null, NOW)).toEqual([]);
  });
});

describe('find a person fast (pure)', () => {
  const f = ['Coreyon Poe', 'Coreyon Poe', '15555550142@phone.poetech.us', '(555) 555-0142 · signs in by phone', '15555550142'];
  it('one word of the name, the phone however typed, or the address', () => {
    expect(matchesSearch(f, 'coreyon')).toBe(true);
    expect(matchesSearch(f, 'Coreyon poe')).toBe(true);
    expect(matchesSearch(f, '555-0142')).toBe(true);
    expect(matchesSearch(f, '(555) 555 0142')).toBe(true);
    expect(matchesSearch(f, '5555550142')).toBe(true);
    expect(matchesSearch(['Amy', 'amy@example.org'], 'example.org')).toBe(true);
    expect(matchesSearch(f, '')).toBe(true);
    // PROVEN TO CATCH: a different person and a short digit run do not match.
    expect(matchesSearch(f, 'darrell')).toBe(false);
    expect(matchesSearch(f, '9142')).toBe(false);
    expect(matchesSearch(f, 'coreyon smith')).toBe(false);
  });
});

// ── the screen ───────────────────────────────────────────────────────────────
const H = vi.hoisted(() => ({ signups: [], signIns: null, doors: null }));
vi.mock('../lib/access-metrics-sync.js', () => ({
  fetchAccessSnapshot: async () => ({ signedIn: true, instances: [], members: [], presence: [], invites: [], subscriptions: [], domains: [], errors: {} }),
  currentBuild: () => ({ sha: 'test', time: null }),
  restRpc: async (fn) => {
    if (fn === 'admin_person_sign_ins')
      return H.signIns
        ? { data: H.signIns, error: null }
        : { data: null, error: { message: 'function admin_person_sign_ins() does not exist', code: '42883' } };
    if (fn === 'admin_person_doors') return H.doors ? { data: H.doors, error: null } : { data: null, error: { message: 'nope', code: '42883' } };
    return { data: null, error: null };
  },
  readSnapshotToken: () => 'tok',
}));
vi.mock('../lib/signup-metrics.js', async (orig) => ({
  ...(await orig()),
  fetchSignupMetrics: async () => ({ status: 'ready', data: { summary: { total_accounts: H.signups.length }, signups: H.signups } }),
}));
vi.mock('../lib/contacts-store.js', () => ({ cachedContacts: () => [], loadMyContacts: async () => ({ ok: true, rows: [], reason: '' }) }));
vi.mock('../lib/member-roles.js', async (orig) => ({
  ...(await orig()),
  listMyAdminInstances: async () => [{ instanceId: 'i-1', slug: 'poe-properties', displayName: 'Poe Properties', instanceType: 'business' }],
  addUserToSpace: async () => ({ ok: true, status: 'added', role: 'member' }),
}));
vi.mock('../modules/properties/cloud.js', () => ({ inviteToProperties: async () => ({ ok: true }) }));
vi.mock('../lib/supabase.js', () => ({
  default: { auth: { getSession: async () => ({ data: { session: null } }) } },
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
  phoneLoginEmail: () => '',
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
}));

import AccessUsageMetrics from '../components/AccessUsageMetrics.jsx';

const D = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString();

describe('the Signups screen: Needs help at the top, a sign-in line per row, and search', () => {
  let container;
  let root;
  afterEach(() => {
    if (root) act(() => root.unmount());
    if (container) container.remove();
    root = container = null;
    H.signups = [];
    H.signIns = null;
    H.doors = null;
  });
  async function mount() {
    container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(AccessUsageMetrics));
    });
    for (let i = 0; i < 8; i += 1)
      await act(async () => {
        await Promise.resolve();
      });
  }
  const rowsShown = () => Array.from(container.querySelectorAll('[data-testid="signup-row-who"]')).map((n) => n.textContent.split(' · ')[0]);
  const type = async (el, value) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    await act(async () => {
      setter.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };

  const SIGNUPS = [
    {
      user_id: '00000000-0000-4000-a000-00000000aa01',
      display_name: 'Tenant Stuck',
      email: '15555550142@phone.poetech.us',
      category: 'unprovisioned',
      created_at: D(10),
      last_sign_in_at: D(5),
      last_active_at: D(5),
    },
    {
      user_id: '00000000-0000-4000-a000-00000000aa02',
      display_name: 'Fam Ok',
      email: 'fam@example.org',
      category: 'family',
      created_at: D(40),
      last_sign_in_at: D(1),
      last_active_at: D(1),
    },
  ];
  const SIGNINS = {
    gotrue_audit: 'read',
    password_record_since: D(14),
    people: [
      {
        user_id: '00000000-0000-4000-a000-00000000aa01',
        last_sign_in_at: D(5),
        last_password_login_at: D(5),
        last_failed_at: D(1),
        failed_since_success: 2,
        failed_30d: 2,
        spaces: [],
      },
      {
        user_id: '00000000-0000-4000-a000-00000000aa02',
        last_sign_in_at: D(1),
        gotrue_login_at: D(1),
        gotrue_method: 'email',
        spaces: [{ slug: 'poe-family', joined_at: D(40) }],
      },
    ],
    invites_without_account: [{ id: 'x', address: 'worker@example.org', role_label: 'field_worker', door: 'properties', created_at: D(6) }],
  };

  it('the stuck person is at the top with the reasons and the help that exists', async () => {
    H.signups = SIGNUPS;
    H.signIns = SIGNINS;
    H.doors = { door_tracking_since: D(2), people: [] };
    await mount();
    const box = container.querySelector('[data-testid="needs-help"]');
    expect(box).not.toBeNull();
    // Needs help comes before the list.
    const list = container.querySelector('[data-testid="signup-row-who"]');
    expect(box.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const people = Array.from(box.querySelectorAll('[data-testid="needs-help-person"]'));
    expect(people).toHaveLength(1);
    expect(people[0].textContent).toContain('Tenant Stuck');
    expect(people[0].textContent).toContain('2 failed sign-in tries with no success since');
    expect(people[0].textContent).toContain('has no space yet');
    expect(people[0].querySelector('[data-testid="signup-add-to-space"]')).not.toBeNull();
    expect(people[0].querySelector('[data-testid="needs-help-message"]').getAttribute('href')).toContain('dm=');
    expect(people[0].querySelector('[data-testid="needs-help-call"]').getAttribute('href')).toBe('tel:+15555550142');
    expect(box.querySelector('[data-testid="needs-help-invite"]').textContent).toContain('no account with this address yet');
    // Each row says whether they got in.
    const lines = Array.from(container.querySelectorAll('[data-testid="signup-signin"]')).map((n) => n.textContent);
    expect(lines).toContain('Last got in yesterday by email');
    expect(container.querySelector('[data-testid="signup-signin-note"]').textContent).toContain('Not recorded:');
  });

  it('Find in list puts one person on the screen, and the search box finds by phone', async () => {
    H.signups = SIGNUPS;
    H.signIns = SIGNINS;
    await mount();
    expect(rowsShown()).toHaveLength(2);
    await act(async () => {
      container.querySelector('[data-testid="needs-help-find"]').click();
    });
    expect(rowsShown()).toEqual(['Tenant Stuck']);
    const search = container.querySelector('[data-testid="signup-search"]');
    await type(search, 'fam');
    expect(rowsShown()).toEqual(['Fam Ok']);
    await type(search, '555-0142');
    expect(rowsShown()).toEqual(['Tenant Stuck']);
    await type(search, 'nobody-by-this-name');
    expect(rowsShown()).toEqual([]);
    expect(container.querySelector('[data-testid="signup-search-empty"]')).not.toBeNull();
  });

  it('Mask emails masks the new places too: no phone, no address, no call or email link', async () => {
    H.signups = SIGNUPS;
    H.signIns = SIGNINS;
    await mount();
    const maskBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Mask emails');
    await act(async () => {
      maskBtn.click();
    });
    const box = container.querySelector('[data-testid="needs-help"]');
    expect(box.textContent).not.toContain('worker@example.org');
    expect(box.textContent).not.toContain('(555) 555-0142');
    expect(box.querySelector('a[href^="tel:"], a[href^="mailto:"], a[href^="sms:"]')).toBeNull();
  });

  it('an unreadable sign-in record says so and invents nobody', async () => {
    H.signups = SIGNUPS;
    H.signIns = null;
    await mount();
    expect(container.querySelector('[data-testid="needs-help"]')).toBeNull();
    expect(container.querySelector('[data-testid="needs-help-unavailable"]').textContent).toContain(
      'could not be read: function admin_person_sign_ins() does not exist'
    );
    expect(container.querySelectorAll('[data-testid="signup-signin"]').length).toBe(0);
  });

  it('every existing chip and button is still there', async () => {
    H.signups = SIGNUPS;
    H.signIns = SIGNINS;
    await mount();
    const text = container.textContent;
    for (const chip of [
      'Signups',
      'At the doors',
      'Bots & blocks',
      'People you know',
      "What's used",
      'When & by whom',
      'Who has access',
      'Counts & activity',
      'Update signals',
      'Invites & access',
    ]) {
      expect(text).toContain(chip);
    }
    expect(container.querySelectorAll('[data-testid="signup-usage-toggle"]').length).toBe(2);
    expect(container.querySelector('[data-testid="signup-sort"]')).not.toBeNull();
    const buttons = Array.from(container.querySelectorAll('button')).map((b) => b.textContent);
    expect(buttons).toContain('Mask emails');
    expect(buttons).toContain('Refresh');
  });
});
