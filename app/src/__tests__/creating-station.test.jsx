// =============================================================================
// The Create page: a subtab bar, the Workspace first and the default on every
// device (DR-0679, amending DR-0678).
// =============================================================================
// Darrell 2026-09-29: "Why take away my type texting place?!!!!!!!!!!!! Where
// is it?!!!!!!!!!!!!!!", then "Obviously give us a actual tabs like so we can
// know!!!!!!!!!!!!!!!!", then "Subtabs".
//
// The children are the existing components (imported, never rewritten); they
// are stubbed here so this proves the PAGE: its tabs, their order, the default,
// one panel at a time, the deep link, the remembered choice, the keys, the
// D-pad, and the gates. The measured layouts are the layout probe's job
// (scripts/chrome-layout-probe.mjs, the device pass).
// =============================================================================
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../components/OneVoiceInput.jsx', () => ({ default: (p) => createElement('div', { 'data-testid': 'stub-voice', 'data-route': p.surfaceConfig && p.surfaceConfig.defaultRoute }) }));
vi.mock('../components/LessonInbox.jsx', () => ({ default: () => createElement('div', { 'data-testid': 'stub-inbox' }) }));
vi.mock('../components/MemberLessonQueue.jsx', () => ({ default: () => createElement('div', { 'data-testid': 'stub-member-queue' }) }));
vi.mock('../components/GovernanceQueue.jsx', () => ({ default: () => createElement('div', { 'data-testid': 'stub-governance' }) }));
vi.mock('../components/LessonReviewQueue.jsx', () => ({ default: () => createElement('div', { 'data-testid': 'stub-review-queue' }) }));
vi.mock('../components/TowerParity.jsx', () => ({ default: (p) => createElement('div', { 'data-testid': 'stub-tower-parity', 'data-signed-in': String(!!p.signedIn) }) }));
// The handoff link's boot read, driven by the test.
let deepPanel = '';
vi.mock('../lib/app-doors.js', () => ({ consumeStationPanel: () => { const p = deepPanel; deepPanel = ''; return p; } }));

const { default: CreatingStation, PINNED_FROM } = await import('../components/CreatingStation.jsx');
const { default: CreateSubNav, createRow } = await import('../components/CreateSubNav.jsx');
const { resetCreateSubForTest, getCreateSub } = await import('../lib/create-sub.js');
const { SURFACES } = await import('../surfaces.js');
const { PANEL_KEYS, orderPanels, CLIENT_CLASSES, createTabs, tabLabel, WORKSPACE_TAB, CREATE_TAB_KEY, readRememberedTab } = await import('../lib/device-roles.js');

const HERE = dirname(fileURLToPath(import.meta.url));
const WS = () => createElement('textarea', { 'data-testid': 'stub-canvas', defaultValue: '' });
let host = null; let root = null;
function mountEl(node) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root.render(node); });
  return host;
}
// The header's row and the page, as the shell mounts them (the row in the
// header under the main nav, the page in <main>).
const VIEWERS = {
  governor: { signedIn: true, isFamilyMember: true },
  member: { signedIn: true, isFamilyMember: false },
  none: { signedIn: false },
};
const mount = (props) => {
  const viewer = props.isGovernor ? VIEWERS.governor : props.signedIn ? VIEWERS.member : VIEWERS.none;
  return mountEl(createElement('div', null,
    createElement('header', null, createElement(CreateSubNav, { viewer, surfaces: SURFACES, deviceClass: props.deviceClass })),
    createElement('main', null, createElement(CreatingStation, { workspace: createElement(WS), ...props }))));
};
function unmount() { act(() => root && root.unmount()); if (host) host.remove(); host = null; root = null; }
beforeEach(() => { try { localStorage.clear(); } catch { /* none */ } deepPanel = ''; resetCreateSubForTest(); });
afterEach(unmount);

const tabs = (el) => [...el.querySelectorAll('[data-testid="create-subnav"] [data-create-sub]')];
const tabIds = (el) => tabs(el).map((b) => b.getAttribute('data-create-sub'));
const selected = (el) => { const b = tabs(el).find((x) => x.getAttribute('aria-current') === 'page'); return b ? b.getAttribute('data-create-sub') : null; };
const click = (el, id) => act(() => { el.querySelector(`[data-create-sub="${id}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const shownPanels = (el) => [...el.querySelectorAll('[data-create-page]')].filter((p) => !p.hidden);
const panelsMounted = (el) => [...el.querySelectorAll('[data-panel]')].map((s) => s.getAttribute('data-panel'));

// The page's own honesty, as a checker the proven-to-catch test turns on
// deliberately broken pages: a tab bar, the Workspace first and open, exactly
// one panel showing, and every station panel with a tab.
function createPageProblems(el) {
  const out = [];
  const ids = tabIds(el);
  if (!el.querySelector('[data-testid="create-subnav"]')) out.push('no tab bar');
  if (ids[0] !== WORKSPACE_TAB) out.push(`"${ids[0]}" is the first tab, not the Workspace`);
  if (selected(el) !== WORKSPACE_TAB) out.push('the Workspace is not the open tab');
  if (shownPanels(el).length !== 1) out.push(`${shownPanels(el).length} panels showing`);
  for (const k of PANEL_KEYS) if (!ids.includes(k)) out.push(`no tab for "${k}"`);
  return out;
}

describe('the Create page is a subtab bar, the Workspace first and open', () => {
  for (const cls of CLIENT_CLASSES) {
    it(`${cls}: Workspace first and the default, then every panel in the ${cls}'s order`, () => {
      const el = mount({ deviceClass: cls, signedIn: true, isGovernor: true });
      expect(el.querySelector('[data-testid="creating-station"]').getAttribute('data-device-class')).toBe(cls);
      expect(tabIds(el)).toEqual([WORKSPACE_TAB, ...orderPanels(cls)]);
      expect(tabIds(el)).toEqual(createTabs(cls));
      expect(selected(el)).toBe(WORKSPACE_TAB);
      expect(createPageProblems(el)).toEqual([]);
      // His canvas shows; no station panel is mounted until its tab is chosen.
      expect(el.querySelector('[data-testid="stub-canvas"]')).not.toBe(null);
      expect(panelsMounted(el)).toEqual([]);
      // The labels are the roles file's short tab labels.
      expect(tabs(el).map((b) => b.textContent.trim())).toEqual(createTabs(cls).map((k) => tabLabel(k)));
      expect(createRow(cls, SURFACES).map((x) => x.sub)).toEqual(createTabs(cls));
      expect(getCreateSub()).toBe(WORKSPACE_TAB);
    });
  }

  it('the tab labels are the ones he reads', () => {
    expect(PANEL_KEYS.map((k) => tabLabel(k)).sort()).toEqual(
      ['Lesson entry', 'Your lessons', 'Lessons to decide', "Governor's queue", 'Towers', 'Read and listen', 'Hand off'].sort(),
    );
    expect(tabLabel(WORKSPACE_TAB)).toBe('Workspace');
  });

  it('the role orders the tabs after the Workspace and never picks the default', () => {
    // A roles document that tries to put the Workspace later cannot: it is not
    // a panel, so orderPanels drops it and createTabs puts it first.
    const bent = { classes: { phone: { first: ['towers', 'workspace'] } }, panels: {} };
    expect(createTabs('phone', ['record', 'towers'], bent)).toEqual(['workspace', 'towers', 'record']);
  });

  it('every subtab is reachable, and only one panel shows at a time', () => {
    for (const cls of CLIENT_CLASSES) {
      const el = mount({ deviceClass: cls, signedIn: true, isGovernor: true });
      for (const k of orderPanels(cls)) {
        click(el, k);
        expect(selected(el)).toBe(k);
        expect(panelsMounted(el)).toEqual([k]);
        expect(shownPanels(el).map((p) => p.id)).toEqual([`create-sub-${k}`]);
        // The canvas is kept, hidden, so nothing he typed is lost.
        expect(el.querySelector('#create-sub-workspace').hidden).toBe(true);
      }
      click(el, WORKSPACE_TAB);
      expect(panelsMounted(el)).toEqual([]);
      expect(shownPanels(el).map((p) => p.id)).toEqual(['create-sub-workspace']);
      unmount();
      resetCreateSubForTest();
    }
  });

  it('what he typed in the Workspace survives a trip to another subtab', () => {
    const el = mount({ deviceClass: 'phone', signedIn: true });
    const ta = el.querySelector('[data-testid="stub-canvas"]');
    ta.value = 'In the beginning was the Word';
    click(el, 'record');
    click(el, WORKSPACE_TAB);
    expect(el.querySelector('[data-testid="stub-canvas"]')).toBe(ta);
    expect(ta.value).toBe('In the beginning was the Word');
  });
});

describe('the chosen subtab is remembered on this device', () => {
  it('a choice is stored and reopens next time', () => {
    const el = mount({ deviceClass: 'laptop', signedIn: true });
    click(el, 'towers');
    expect(localStorage.getItem(CREATE_TAB_KEY)).toBe('towers');
    unmount();
    resetCreateSubForTest(); // a fresh page load on the same device
    const again = mount({ deviceClass: 'laptop', signedIn: true });
    expect(selected(again)).toBe('towers');
  });

  it('a stale value, or storage that throws, opens the Workspace', () => {
    localStorage.setItem(CREATE_TAB_KEY, 'not-a-tab');
    const el = mount({ deviceClass: 'phone', signedIn: true });
    expect(selected(el)).toBe(WORKSPACE_TAB);
    const throwing = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(readRememberedTab(createTabs('tv'), throwing)).toBe(WORKSPACE_TAB);
  });
});

describe('the handoff link opens its subtab', () => {
  for (const k of PANEL_KEYS) {
    it(`?view=create&panel=${k} opens "${tabLabel(k)}"`, () => {
      deepPanel = k;
      const el = mount({ deviceClass: 'phone', signedIn: true, isGovernor: true });
      expect(selected(el)).toBe(k);
      expect(panelsMounted(el)).toEqual([k]);
      expect(el.querySelector('[data-testid="create-opened-from"]').textContent).toContain(tabLabel(k));
    });
  }
  it('a panel that is not one leaves the Workspace open', () => {
    deepPanel = 'nope';
    const el = mount({ deviceClass: 'phone', signedIn: true });
    expect(selected(el)).toBe(WORKSPACE_TAB);
  });
});

describe('Alt+digit selects a subtab on the laptop', () => {
  const alt = (d) => act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, code: `Digit${d}`, key: String(d) })); });
  it('Alt+2..8 open the panels in order, Alt+1 and Alt+0 the Workspace; the keys are shown', () => {
    const el = mount({ deviceClass: 'laptop', signedIn: true, isGovernor: true });
    const t = createTabs('laptop');
    for (let i = 2; i <= t.length; i += 1) { alt(i); expect(selected(el)).toBe(t[i - 1]); }
    alt(1); expect(selected(el)).toBe(WORKSPACE_TAB);
    alt(3); alt(0); expect(selected(el)).toBe(WORKSPACE_TAB);
    click(el, 'your-lessons');
    expect(el.querySelector('[data-testid="station-shortcuts"]').textContent).toMatch(/Alt\+1 Workspace · Alt\+2 Your lessons/);
  });
  it('plain digits are left to the typing', () => {
    const el = mount({ deviceClass: 'laptop', signedIn: true });
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit3', key: '3' })); });
    expect(selected(el)).toBe(WORKSPACE_TAB);
  });
});

// Did the row keep the key (caging it), or let it bubble on to the app's
// remote navigation? The remote-navigation listener skips any defaultPrevented
// keydown, so a prevented arrow means a D-pad can never leave the row.
const pressOn = (btn, k) => {
  const ev = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
  act(() => { btn.dispatchEvent(ev); });
  return ev;
};
function cagedKeys(buttons) {
  const caged = [];
  for (const b of buttons) {
    for (const k of ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']) {
      if (pressOn(b, k).defaultPrevented) caged.push(`${k} on ${b.textContent.trim()}`);
    }
  }
  return caged;
}

describe('the Firestick D-pad is never caged by the row', () => {
  it('no arrow is swallowed by any sub on the TV', () => {
    const el = mount({ deviceClass: 'tv', signedIn: true });
    expect(tabs(el).length).toBe(1 + PANEL_KEYS.length);
    expect(cagedKeys(tabs(el))).toEqual([]);
  });

  it('with the real remote navigation wired, Down from the row lands in the page', async () => {
    const { handleRemoteKey } = await import('../lib/remote-navigation.js');
    const el = mount({ deviceClass: 'tv', signedIn: true });
    const first = tabs(el)[0];
    first.focus();
    // jsdom has no layout: give the row and the page real, stacked geometry.
    const rectOf = (n) => (el.querySelector('[data-testid="create-subnav"]').contains(n)
      ? { left: 10 + tabs(el).indexOf(n) * 100, top: 0, width: 90, height: 40 }
      : { left: 10, top: 200, width: 600, height: 300 });
    const ev = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    first.dispatchEvent(ev);
    const moved = handleRemoteKey(ev, el, { rectOf, isVisible: () => true });
    expect(moved).not.toBe(null);
    expect(el.querySelector('[data-testid="create-subnav"]').contains(moved)).toBe(false);
  });
});

describe('proven to catch', () => {
  it('the page checker flags a Create page that opens on a panel', () => {
    localStorage.setItem(CREATE_TAB_KEY, 'towers');
    const el = mount({ deviceClass: 'phone', signedIn: true });
    expect(createPageProblems(el)).toEqual(['the Workspace is not the open tab']);
  });

  it("the page checker flags DR-0678's stack: every panel showing, no row", () => {
    const el = mountEl(createElement('div', null, ...PANEL_KEYS.map((k) => createElement('section', { key: k, 'data-create-page': k }))));
    expect(createPageProblems(el)).toEqual(expect.arrayContaining(['no tab bar', `${PANEL_KEYS.length} panels showing`]));
  });

  it('the D-pad check catches a row that swallows the arrows (the strip before DR-0679)', () => {
    // SectionTabs' own keys: Down/Up/Left/Right move along the strip and are prevented.
    const onKeyDown = (e) => { if (e.key.startsWith('Arrow')) e.preventDefault(); };
    const el = mountEl(createElement('div', null, createElement('button', { onKeyDown }, 'A')));
    expect(cagedKeys([...el.querySelectorAll('button')])).toEqual(['ArrowDown on A', 'ArrowUp on A', 'ArrowLeft on A', 'ArrowRight on A']);
  });
});

describe('the panels keep their gates and their components', () => {
  it('phone: the Lesson entry has the Lesson chip chosen, and Hand off offers the laptop', () => {
    const el = mount({ deviceClass: 'phone', signedIn: true, isGovernor: true });
    click(el, 'record');
    expect(el.querySelector('[data-testid="stub-voice"]').getAttribute('data-route')).toBe('lesson');
    click(el, 'handoff');
    expect(el.querySelector('[data-testid="station-handoff"]').textContent).toMatch(/laptop/);
    expect(el.querySelector('[data-testid="station-handoff-url"]').textContent).toMatch(/\?view=create&panel=your-lessons$/);
    expect(el.querySelector('[data-testid="station-shortcuts"]')).toBe(null);
  });

  it('TV: Read and listen is the first tab after the Workspace', () => {
    const el = mount({ deviceClass: 'tv', signedIn: true });
    expect(tabIds(el)[1]).toBe('read-listen');
    click(el, 'read-listen');
    expect(el.querySelector('[data-testid="station-read-listen"]')).not.toBe(null);
  });

  it('the laptop hands off to the phone with a QR to scan', () => {
    const el = mount({ deviceClass: 'laptop', signedIn: true });
    click(el, 'handoff');
    expect(el.querySelector('[data-testid="station-handoff-qr"] svg')).not.toBe(null);
    expect(el.querySelector('[data-testid="station-handoff-url"]').textContent).toMatch(/panel=record$/);
  });

  it('role gates are unchanged by device: a non-Governor is told, on every class', () => {
    for (const cls of CLIENT_CLASSES) {
      const el = mount({ deviceClass: cls, signedIn: true, isGovernor: false });
      for (const k of ['decide', 'governor']) {
        click(el, k);
        expect(el.querySelector('[data-testid="station-governor-only"]')).not.toBe(null);
      }
      expect(el.querySelector('[data-testid="stub-governance"]')).toBe(null);
      expect(el.querySelector('[data-testid="stub-review-queue"]')).toBe(null);
      unmount();
    }
  });

  it('the Governor gets his queues on every class', () => {
    for (const cls of CLIENT_CLASSES) {
      const el = mount({ deviceClass: cls, signedIn: true, isGovernor: true });
      click(el, 'governor');
      expect(el.querySelector('[data-testid="stub-governance"]')).not.toBe(null);
      click(el, 'decide');
      const decide = el.querySelector('#station-decide');
      expect(decide.querySelector('[data-testid="stub-review-queue"]')).not.toBe(null);
      expect(decide.querySelector('[data-testid="stub-member-queue"]')).not.toBe(null);
      unmount();
    }
  });

  it('the Towers tab mounts the real TowerParity when signed in, and asks to sign in otherwise', () => {
    const el = mount({ deviceClass: 'laptop', signedIn: true, isGovernor: true });
    click(el, 'towers');
    const tp = el.querySelector('#station-towers [data-testid="stub-tower-parity"]');
    expect(tp).not.toBe(null);
    expect(tp.getAttribute('data-signed-in')).toBe('true');
    unmount();
    const out = mount({ deviceClass: 'laptop', signedIn: false });
    click(out, 'towers');
    expect(out.querySelector('[data-testid="stub-tower-parity"]')).toBe(null);
    expect(out.querySelector('#station-towers').textContent).toMatch(/Sign in/);
  });

  it('the components from parallel work name their file and source, and exist with a default export', () => {
    expect(PINNED_FROM.decide.file).toBe('./LessonReviewQueue.jsx');
    expect(PINNED_FROM.decide.from).toMatch(/#1841/);
    expect(PINNED_FROM.towers.file).toBe('./TowerParity.jsx');
    expect(PINNED_FROM.towers.from).toMatch(/#1845/);
    const q = join(HERE, '../components/LessonReviewQueue.jsx');
    const t = join(HERE, '../components/TowerParity.jsx');
    expect(existsSync(q)).toBe(true);
    expect(existsSync(t)).toBe(true);
    expect(readFileSync(q, 'utf8')).toMatch(/export default function LessonReviewQueue\(/);
    expect(readFileSync(t, 'utf8')).toMatch(/export default function TowerParity\(/);
  });

  it('the Create page mounts the station as tabs with the canvas as the Workspace, never a stack above or below it', () => {
    const src = readFileSync(join(HERE, '../components/CreationWorkspace.jsx'), 'utf8');
    expect(src).toMatch(/<CreatingStation \{\.\.\.station\} workspace=\{canvas\} \/>/);
    expect(src.match(/<CreatingStation /g).length).toBe(1);
  });
});

describe('Create is level 2, the same row mechanism as Church (DR-0679)', () => {
  const read = (rel) => readFileSync(join(HERE, rel), 'utf8');
  const shell = read('../poe-financial-mvp-v28.jsx');
  const nav = read('../components/CreateSubNav.jsx');

  it('the row is derived from the registry: nav create, Workspace first, every panel a sub, each gated', () => {
    const create = SURFACES.filter((x) => x.nav === 'create');
    expect(create.map((x) => x.sub).sort()).toEqual([WORKSPACE_TAB, ...PANEL_KEYS].sort());
    expect(create[0].sub).toBe(WORKSPACE_TAB);
    for (const x of create) {
      expect(x.view).toBe('create');
      expect(x.requires, x.id).toBeTruthy();
      expect(['lock', 'hide'], x.id).toContain(x.whenDenied);
      expect(x.label, x.id).toBe(tabLabel(x.sub)); // the registry and the roles file say the same name
    }
    // The Governor's two queues stay the Governor's.
    expect(create.find((x) => x.sub === 'decide').requires).toBe('family');
    expect(create.find((x) => x.sub === 'governor').requires).toBe('family');
  });

  it("the shell mounts it in the header beside Church's row, and never SectionTabs", () => {
    const header = shell.slice(0, shell.indexOf('</header>'));
    expect(header).toMatch(/\{view === 'create' && <CreateSubNav viewer=\{surfaceViewer\} surfaces=\{Object\.values\(surfaceById\)\} \/>\}/);
    expect(header.indexOf('<CreateSubNav')).toBeGreaterThan(header.indexOf('</TopNavRow>'));
    expect(nav).not.toMatch(/import [^\n]*SectionTabs/);
    expect(read('../components/CreatingStation.jsx')).not.toMatch(/import [^\n]*SectionTabs/);
  });

  it("uses Church's own band, primitive and button classes", () => {
    const churchLine = shell.split('\n').find((l) => l.includes('onClick={() => setChurchView(id)}'));
    const churchCls = /className=\{`([^`]+)`\}/.exec(churchLine)[1].replace(/\$\{churchView === id \?/, '${on ?');
    expect(nav).toContain(churchCls);
    const i = shell.indexOf("{view === 'church' && (");
    const band = shell.slice(i, i + 400);
    expect(band).toContain('<div className="border-t border-[#E8E4DC] bg-white">');
    expect(band).toContain('<TabScroll chrome className="px-1 sm:px-6 lg:px-8">');
    expect(nav).toContain('className="border-t border-[#E8E4DC] bg-white"');
    expect(nav).toContain('<TabScroll chrome className="px-1 sm:px-6 lg:px-8">');
  });

  it('renders as that row, Workspace open, on every device', () => {
    for (const cls of CLIENT_CLASSES) {
      const el = mount({ deviceClass: cls, signedIn: true });
      const row = el.querySelector('[data-testid="create-subnav"]');
      expect(row.className).toBe('border-t border-[#E8E4DC] bg-white');
      expect(row.querySelector('.tab-scroll')).not.toBe(null);
      expect(tabIds(el)[0]).toBe(WORKSPACE_TAB);
      expect(selected(el)).toBe(WORKSPACE_TAB);
      expect(tabs(el)[0].className).toMatch(/border-\[#1A1815\] text-\[#1A1815\] font-medium/);
      unmount();
      resetCreateSubForTest();
    }
  });

  it('a locked sub stays in the row, marked, and its page says who it is for', () => {
    const el = mount({ deviceClass: 'laptop', signedIn: true, isGovernor: false });
    const gov = el.querySelector('[data-create-sub="governor"]');
    expect(gov).not.toBe(null);
    expect(gov.querySelector('svg')).not.toBe(null);
    click(el, 'governor');
    expect(el.querySelector('[data-testid="station-governor-only"]')).not.toBe(null);
  });
});
