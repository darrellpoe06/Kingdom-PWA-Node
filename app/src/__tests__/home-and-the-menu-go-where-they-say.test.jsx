// @vitest-environment jsdom
// =============================================================================
// Home goes home, and every row of the picture's menu goes where it says (DR-1579)
// =============================================================================
// Darrell 2026-11-18, from the Love Corner door on his phone:
//   "Bottom left home button should work... bring it back home... same as the
//    logo header etc... back to the original location for the start.... When
//    you click watch... it moves... home should go back to the top..."
//   "Messages and contacts don't work... check all of them...."
//
// Traced: (1) the home's strip always has an open section and published its
// DEFAULT (Worship), so the bar lit Watch on a page nobody had moved; Home set
// the same tab again, asked for nothing and scrolled nowhere. (2) The header's
// `go` set the church sub-tab alone, so after Subscription, Admin (or now
// Messages) left the Church view, the logo, the strip and every All-sheet tile
// changed nothing on screen. (3) "Messages / Contact" opened the church's
// About section and no messages.
//
// These mount the REAL church home beside the REAL bar, and the real header
// with its menu, and tap.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act, useState } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../lib/supabase.js', () => {
  const chain = () => {
    const c = {
      select: () => c,
      eq: () => c,
      order: () => c,
      limit: () => c,
      in: () => c,
      maybeSingle: async () => ({ data: null, error: null }),
      then: (res) => Promise.resolve({ data: [], error: null }).then(res),
    };
    return c;
  };
  const fake = {
    from: () => chain(),
    rpc: async () => ({ data: null, error: null }),
    auth: { getSession: async () => ({ data: { session: null } }), getUser: async () => ({ data: { user: null } }), updateUser: async () => ({}) },
    channel: () => ({
      on() {
        return this;
      },
      subscribe() {
        return this;
      },
    }),
    removeChannel: () => {},
  };
  return {
    default: fake,
    supabase: fake,
    onAuthChange: (cb) => {
      cb(globalThis.__homeTestSession || null);
      return () => {};
    },
    signOut: vi.fn(async () => {}),
  };
});
vi.mock('../lib/profiles-sync.js', async (orig) => ({
  ...(await orig()),
  loadMyProfile: async () => ({ displayName: 'Darrell', photoThumb: null }),
}));
vi.mock('../lib/arrivals-watch.js', () => ({ startArrivalsWatch: () => () => {}, readArrivals: () => ({ count: 0, items: [] }) }));

import ChromeDock from '../components/ChromeDock.jsx';
import { ChurchHome } from '../components/ChurchHome.jsx';
import LoveCornerHeader from '../components/shell/LoveCornerHeader.jsx';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { churchSubTabs, CHURCH_BOTTOM_NAV } from '../lib/church-tabs.jsx';
import {
  requestChurchHomeSection,
  requestChurchHomeTop,
  subscribeChurchHomeTop,
  takePendingChurchHomeSection,
  readChurchHomeSection,
} from '../lib/church-home-section.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root, origMM, origW, pageScrolls, realScrollTo, realScrollIntoView;
beforeEach(() => {
  globalThis.__homeTestSession = null;
  takePendingChurchHomeSection();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  origMM = window.matchMedia;
  origW = window.innerWidth;
  window.innerWidth = 390;
  window.matchMedia = (q) => ({ matches: /max-width: (639|1023)/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  pageScrolls = [];
  realScrollTo = window.scrollTo;
  window.scrollTo = (a, b) => pageScrolls.push(typeof a === 'object' ? a.top : b);
  realScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function noLayout() {};
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.querySelectorAll('[role="dialog"]').forEach((d) => d.remove());
  window.matchMedia = origMM;
  window.innerWidth = origW;
  window.scrollTo = realScrollTo;
  if (realScrollIntoView) Element.prototype.scrollIntoView = realScrollIntoView;
  else delete Element.prototype.scrollIntoView;
});
const q = (sel) => document.querySelector(sel);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const settle = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 90));
  });
const flush = () =>
  act(async () => {
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
  });

const HOME_PROPS = {
  church: COLG_DEFAULT_CHURCH,
  prayerRequests: [],
  addPrayerRequest: () => {},
  markPrayerRequestSent: () => {},
  deletePrayerRequest: () => {},
  addEvent: () => {},
  conference: null,
  updateConference: () => {},
  addChurchVoice: () => {},
  sendToPoeTech: () => {},
  addIncident: () => {},
  addInquiry: () => {},
};
const TABS = churchSubTabs({ signedIn: true });

// The shell, as far as these controls use it: a view, a church sub-tab, the
// church home when both name it, the header and the bar.
let shell;
function Shell({ header = false }) {
  const [view, setView] = useState('church');
  const [churchView, setChurchView] = useState('home');
  shell = { view, churchView };
  const nav = {
    groups: [{ key: 'soul', label: 'Soul', items: [['church', 'Church']], links: [] }],
    view,
    churchView,
    homeView: 'current',
    churchTabs: TABS,
    onNavigate: (v, home, sub) => {
      if (sub) setChurchView(sub);
      setView(v);
    },
    money: null,
  };
  return createElement(
    'div',
    null,
    header && createElement(LoveCornerHeader, { churchTabs: TABS, churchView, setChurchView, view, setView, church: COLG_DEFAULT_CHURCH, isOffice: true, canAdmin: true, theme: 'night', setTheme: () => {} }),
    view === 'church' && churchView === 'home' && createElement(ChurchHome, HOME_PROPS),
    view !== 'church' && createElement('main', { 'data-testid': `view-${view}` }, view),
    createElement(ChromeDock, { onFeedback: () => {}, nav })
  );
}
const lit = () => CHURCH_BOTTOM_NAV.filter((t) => !t.give && q(`[data-testid="dock-tab-${t.key}"]`) && q(`[data-testid="dock-tab-${t.key}"]`).getAttribute('aria-current') === 'page').map((t) => t.words);
const tab = (key) => q(`[data-testid="dock-tab-${key}"]`);

describe('the bottom bar on the church door', () => {
  it('opens with Home lit and nothing else: the page’s default section is not somewhere the reader went', async () => {
    act(() => root.render(createElement(Shell)));
    await settle();
    expect(readChurchHomeSection(), 'an untouched home publishes no section').toBeNull();
    expect(lit()).toEqual(['Home']);
  });

  it('Watch lights Watch alone; Home then lights Home alone, puts the page at the top and the strip back on its opening section', async () => {
    act(() => root.render(createElement(Shell)));
    await settle();
    click(tab('church-watch'));
    await settle();
    expect(lit()).toEqual(['Watch']);
    expect(readChurchHomeSection()).toBe('worship');
    click(tab('church-events'));
    await settle();
    expect(lit()).toEqual(['Events']);
    expect(q('#church-tab-times').getAttribute('aria-selected')).toBe('true');
    pageScrolls.length = 0;
    click(tab('church-home'));
    await settle();
    expect(lit(), 'exactly one item reads as selected').toEqual(['Home']);
    expect(readChurchHomeSection()).toBeNull();
    expect(pageScrolls, 'the page goes to the top').toContain(0);
    expect(q('#church-tab-worship').getAttribute('aria-selected'), 'the strip is back where the door opens').toBe('true');
    expect(q('.lc-hero'), 'the Welcome hero is the page').toBeTruthy();
  });

  it('a section the reader taps on the strip lights its bar item, and Home still brings them back', async () => {
    act(() => root.render(createElement(Shell)));
    await settle();
    click(q('#church-tab-times'));
    await settle();
    expect(lit()).toEqual(['Events']);
    click(tab('church-home'));
    await settle();
    expect(lit()).toEqual(['Home']);
  });

  it('Home from another tab opens the home at its start, even with an old section request waiting', async () => {
    act(() => root.render(createElement(Shell)));
    await settle();
    click(tab('church-bible'));
    await settle();
    expect(shell.churchView).toBe('scripture');
    act(() => requestChurchHomeSection('prayer')); // no home is mounted: it waits
    click(tab('church-home'));
    await settle();
    expect(shell.churchView).toBe('home');
    expect(lit()).toEqual(['Home']);
    expect(q('#church-tab-worship').getAttribute('aria-selected')).toBe('true');
  });
});

describe('the store', () => {
  it('a Home request drops a waiting section request and tells every listener', () => {
    const seen = [];
    const off = subscribeChurchHomeTop(() => seen.push('top'));
    requestChurchHomeSection('give');
    requestChurchHomeTop();
    expect(seen).toEqual(['top']);
    expect(takePendingChurchHomeSection()).toBeNull();
    off();
    requestChurchHomeTop();
    expect(seen).toEqual(['top']);
  });
});

describe('the header’s logo and name are Home too', () => {
  it('from a section: the top of the page, no section, Home lit', async () => {
    act(() => root.render(createElement(Shell, { header: true })));
    await settle();
    click(tab('church-watch'));
    await settle();
    pageScrolls.length = 0;
    click(q('[data-testid="lch-brand"]'));
    await settle();
    expect(lit()).toEqual(['Home']);
    expect(pageScrolls).toContain(0);
  });
});

// Every row of the menu under the picture: what it is supposed to open, and
// what a tap does. A row with no entry here fails the last test.
const ROWS = {
  profile: { opens: 'the My profile dialog', check: () => expect(q('[role="dialog"][aria-label="My profile"]')).toBeTruthy() },
  church: { opens: 'the My Record tab of the church', check: () => expect([shell.view, shell.churchView]).toEqual(['church', 'my-record']) },
  notifications: { opens: 'the bell’s list', check: (spies) => expect(spies.bell).toHaveBeenCalled() },
  subscription: { opens: 'the About view, where the plans are', check: () => expect(q('[data-testid="view-about"]')).toBeTruthy() },
  messages: { opens: 'the Messages view', check: () => expect(q('[data-testid="view-messages"]')).toBeTruthy() },
  contact: {
    opens: 'the church home on its About section (address, phone, office)',
    check: () => {
      expect([shell.view, shell.churchView]).toEqual(['church', 'home']);
      expect(q('#church-tab-about').getAttribute('aria-selected')).toBe('true');
    },
  },
  give: { opens: 'the Give panel', check: () => expect(document.body.textContent).toMatch(/Zelle|Cash App|Givelify|PayPal/) },
  all: { opens: 'the All features sheet', check: () => expect(q('[data-testid="lch-all-features"]')).toBeTruthy() },
  personalize: { opens: 'the Personalize sheet', check: () => expect(q('[data-testid="lch-personalize-sheet"]')).toBeTruthy() },
  admin: { opens: 'the Admin view', check: () => expect(q('[data-testid="view-admin"]')).toBeTruthy() },
  logout: { opens: 'sign-out', check: (spies) => expect(spies.signOut).toHaveBeenCalled() },
};

describe('the menu under the picture', () => {
  const openMenu = async () => {
    globalThis.__homeTestSession = { user: { id: 'u1', email: 'd@example.com' } };
    act(() => root.render(createElement(Shell, { header: true })));
    await settle();
    click(q('[data-testid="lch-avatar"]'));
    await flush();
  };

  for (const [id, row] of Object.entries(ROWS)) {
    it(`${id} opens ${row.opens}`, async () => {
      const { signOut } = await import('../lib/supabase.js');
      signOut.mockClear();
      await openMenu();
      const bellBtn = q('[data-testid="lch-bell"] button');
      const bell = vi.fn();
      if (bellBtn) bellBtn.addEventListener('click', bell);
      click(q(`[data-testid="lch-menu-${id}"]`));
      await settle();
      row.check({ bell, signOut });
    });
  }

  it('no row is on the menu without a place it is proven to open', async () => {
    await openMenu();
    const ids = [...document.querySelectorAll('[data-testid="lch-profile-menu"] [role="menuitem"]')].map((b) => b.getAttribute('data-testid').replace('lch-menu-', ''));
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.filter((id) => !ROWS[id]), 'a row with no proven destination').toEqual([]);
    expect(Object.keys(ROWS).filter((id) => !ids.includes(id)), 'a destination with no row').toEqual([]);
  });

  it('after a row leaves the Church (Subscription, Admin, Messages), the logo, a strip tab and an All-sheet tile each bring it back', async () => {
    for (const back of ['brand', 'strip', 'tile']) {
      await openMenu();
      click(q('[data-testid="lch-menu-messages"]'));
      await settle();
      expect(shell.view).toBe('messages');
      expect(document.querySelector('.lch-strip-tab-on'), 'no church tab reads as open while the Church is not on screen').toBeNull();
      if (back === 'brand') click(q('[data-testid="lch-brand"]'));
      if (back === 'strip') click(q('[data-testid="lch-strip-tab-scripture"]'));
      if (back === 'tile') {
        click(q('[data-testid="lch-menu"]'));
        await flush();
        click(q('[data-testid="lch-tab-ministries"]'));
      }
      await settle();
      expect(shell.view, `${back} returns to the Church`).toBe('church');
      expect(shell.churchView).toBe({ brand: 'home', strip: 'scripture', tile: 'ministries' }[back]);
      act(() => root.unmount());
      root = createRoot(container);
    }
  });
});
