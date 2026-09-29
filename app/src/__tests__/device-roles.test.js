// =============================================================================
// Each device its job, and the app knows which device it is on (DR-0678)
// =============================================================================
// Darrell 2026-09-29: "Laptop for creating... we need to be able to use the
// devices appropriately"
//
// Three things are proven here, each against a deliberate break so a green
// check means something (DR-0076 §3):
//   1. ROLE DERIVATION — measured signals decide the class; the user agent only
//      names a TV. A laptop is width AND a fine pointer; neither alone.
//   2. THE ROLES FILE IS SOUND — every class has a role, a why, real app views
//      and every station panel in its order; the registry points to it.
//   3. NEVER BLOCKED — every panel on every class, and nothing that decides
//      what a person may OPEN reads the device class.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ROLES, CLIENT_CLASSES, PANEL_KEYS, deviceClassOf, deviceClassFromWindow, orderPanels, roleFor,
  validateRoles, classOfNodeRole, shortcutTarget, handoffUrl, panelFromSearch, handoffTarget, markDeviceClass,
} from '../lib/device-roles.js';
import { VALID_VIEWS } from '../lib/nav-history.js';
import { stationPanelFrom } from '../lib/app-doors.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '../../..');
const read = (p) => readFileSync(join(REPO, p), 'utf8');
const NODES = JSON.parse(read('infra/device-availability/pipeline-nodes.json'));

const FIRE_TV = 'Mozilla/5.0 (Linux; Android 9; AFTMM Build/PS7285) AppleWebKit/537.36 (KHTML, like Gecko) Silk/112.3.1 like Chrome/112.0.5615.213 Safari/537.36';
const PIXEL = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

describe('role derivation — measured, not guessed', () => {
  it('a laptop is a wide screen WITH a fine pointer', () => {
    expect(deviceClassOf({ width: 1440, height: 900, anyFinePointer: true, userAgent: WINDOWS })).toBe('laptop');
    expect(deviceClassOf({ width: 1024, height: 768, anyFinePointer: true })).toBe('laptop');
    // A touchscreen laptop still has its trackpad.
    expect(deviceClassOf({ width: 1366, height: 768, anyFinePointer: true, maxTouchPoints: 10 })).toBe('laptop');
  });

  it('width alone is NOT a laptop: a wide touch-only screen is a tablet', () => {
    expect(deviceClassOf({ width: 1180, height: 820, anyFinePointer: false, maxTouchPoints: 5 })).toBe('tablet');
    // Unknown pointer is not promoted on a guess.
    expect(deviceClassOf({ width: 1440, height: 900, anyFinePointer: null })).toBe('tablet');
  });

  it('a fine pointer alone is NOT a laptop: a narrow window stays narrow', () => {
    expect(deviceClassOf({ width: 390, height: 844, anyFinePointer: true })).toBe('phone');
    expect(deviceClassOf({ width: 800, height: 900, anyFinePointer: true })).toBe('tablet');
  });

  it('a phone is narrow, or held sideways with only a finger to point', () => {
    expect(deviceClassOf({ width: 390, height: 844, anyFinePointer: false, maxTouchPoints: 5, userAgent: PIXEL })).toBe('phone');
    expect(deviceClassOf({ width: 360, height: 800 })).toBe('phone');
    expect(deviceClassOf({ width: 844, height: 390, anyFinePointer: false, maxTouchPoints: 5 })).toBe('phone');
  });

  it('a Fire TV is a TV at 960x540 (the user agent is read ONLY for this)', () => {
    expect(deviceClassOf({ width: 960, height: 540, anyFinePointer: false, userAgent: FIRE_TV })).toBe('tv');
    // A TV that hides its name: large, no touch, no fine pointer.
    expect(deviceClassOf({ width: 1920, height: 1080, anyFinePointer: false, maxTouchPoints: 0 })).toBe('tv');
    // A document already marked by tv-device.js.
    expect(deviceClassOf({ width: 1440, anyFinePointer: true, tvDocument: true })).toBe('tv');
    // A Windows user agent at the same size with a mouse is NOT a TV.
    expect(deviceClassOf({ width: 1920, height: 1080, anyFinePointer: true, userAgent: WINDOWS })).toBe('laptop');
  });

  it('nothing measured reads as the smallest screen, never the widest', () => {
    expect(deviceClassOf({})).toBe('phone');
    expect(deviceClassFromWindow(null)).toBeTypeOf('string');
  });

  it('reads a live window through matchMedia, and never throws', () => {
    const win = (w, fine) => ({
      innerWidth: w, innerHeight: 900, navigator: { userAgent: WINDOWS, maxTouchPoints: 0 },
      document: { documentElement: { getAttribute: () => null, setAttribute(k, v) { this[k] = v; } } },
      matchMedia: (q) => ({ matches: q === '(any-pointer: fine)' ? fine : false }),
    });
    expect(deviceClassFromWindow(win(1440, true))).toBe('laptop');
    expect(deviceClassFromWindow(win(1440, false))).toBe('tv'); // large, no touch, no pointer
    const w = win(1440, true);
    expect(markDeviceClass(w)).toBe('laptop');
    expect(w.document.documentElement['data-device-class']).toBe('laptop');
    expect(deviceClassFromWindow({ get innerWidth() { throw new Error('boom'); } })).toBe('phone');
  });

  it('PROVEN TO CATCH: a derivation that trusts width alone would misclass the tablet', () => {
    // The break this suite exists to stop: "wide = laptop". Run the same cases
    // through that rule and show it disagrees with the real derivation.
    const widthOnly = ({ width }) => (width >= 1024 ? 'laptop' : width < 600 ? 'phone' : 'tablet');
    const tabletCase = { width: 1180, height: 820, anyFinePointer: false, maxTouchPoints: 5 };
    expect(widthOnly(tabletCase)).toBe('laptop');
    expect(deviceClassOf(tabletCase)).not.toBe(widthOnly(tabletCase));
    const tvCase = { width: 960, height: 540, anyFinePointer: false, userAgent: FIRE_TV };
    expect(deviceClassOf(tvCase)).not.toBe(widthOnly(tvCase));
  });
});

describe('the roles are data, and the data is sound', () => {
  it('the device registry points to the roles file, and it exists', () => {
    expect(NODES.device_roles).toBe('device-roles.json');
    expect(existsSync(join(REPO, 'infra/device-availability', NODES.device_roles))).toBe(true);
  });

  it('the real roles file has no errors against the real app views', () => {
    expect(validateRoles(ROLES, { views: VALID_VIEWS })).toEqual([]);
  });

  it('every class Darrell named has its job', () => {
    expect(roleFor('phone').jobs).toEqual(expect.arrayContaining(['record', 'listen', 'quick approve']));
    expect(roleFor('laptop').jobs).toEqual(expect.arrayContaining(['create', 'edit', 'compare', 'merge', 'review', 'govern']));
    expect(roleFor('tv').jobs).toEqual(expect.arrayContaining(['read', 'listen', 'sign in from the phone']));
    expect(ROLES.classes.nas.jobs.join(' ')).toMatch(/data/);
    expect(ROLES.classes.tower.jobs).toContain('AI compute');
  });

  it('what comes FIRST matches the job: laptop compares, phone records, TV reads', () => {
    expect(orderPanels('laptop')[0]).toBe('your-lessons');
    expect(orderPanels('phone')[0]).toBe('record');
    expect(orderPanels('phone').slice(0, 2)).toEqual(['record', 'decide']);
    expect(orderPanels('tv')[0]).toBe('read-listen');
  });

  it('every declared pipeline node maps to a class or is honestly unassigned', () => {
    for (const n of NODES.nodes) {
      const cls = classOfNodeRole(n.role);
      if (cls) expect(['nas', 'tower']).toContain(cls);
      else expect(ROLES.unassigned_node_roles).toContain(n.role);
    }
    expect(classOfNodeRole('nas')).toBe('nas');
    expect(classOfNodeRole('gpu-worker')).toBe('tower');
  });

  it('no laptop is recorded in the fleet, and the file says so rather than inventing one', () => {
    const laptopish = NODES.nodes.filter((n) => /laptop/i.test(`${n.slug} ${n.role}`));
    expect(ROLES.laptop_recorded).toBe(laptopish.length > 0);
  });

  it('his creating station is known by name: the Samsung laptop, class laptop, not on the tailnet (2026-09-29)', () => {
    const st = (ROLES.known_stations || []).find((s) => s.name === 'Samsung laptop');
    expect(st).toBeTruthy();
    expect(st.class).toBe('laptop');
    expect(st.role).toBe('creating station');
    expect(st.tailnet).toBe('not joined');
    expect(st.in_fleet).toBe(false);
    expect(ROLES.classes[st.class].jobs).toContain('create');
    // Not joined, so it is honestly absent from the fleet the witness probes.
    expect(NODES.nodes.some((n) => /samsung/i.test(JSON.stringify(n)))).toBe(false);
    // Only these fields: a name and a job, never an address or a username.
    expect(Object.keys(st).sort()).toEqual(['class', 'in_fleet', 'name', 'recorded', 'role', 'tailnet', 'why']);
  });

  it('the public roles file carries no addresses or users (it ships in the bundle)', () => {
    const raw = read('infra/device-availability/device-roles.json');
    expect(raw).not.toMatch(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    expect(raw).not.toMatch(/ssh_user|tailnet_ip|lan_ip/);
  });

  it('PROVEN TO CATCH: the validator refuses each kind of broken roles file', () => {
    const clone = () => JSON.parse(JSON.stringify(ROLES));
    const v = (doc) => validateRoles(doc, { views: VALID_VIEWS });
    let d = clone(); delete d.classes.laptop;
    expect(v(d).join('\n')).toMatch(/"laptop" has no role/);
    d = clone(); d.classes.phone.surfaces.push({ view: 'not-a-view', why: 'x' });
    expect(v(d).join('\n')).toMatch(/not-a-view/);
    d = clone(); d.classes.tv.first = d.classes.tv.first.filter((p) => p !== 'governor');
    expect(v(d).join('\n')).toMatch(/leaves out "governor"/);
    d = clone(); d.classes.phone.blocked = ['governor'];
    expect(v(d).join('\n')).toMatch(/"blocked" is not a role field/);
    d = clone(); d.classes.laptop.why = '';
    expect(v(d).join('\n')).toMatch(/laptop: says no real why/);
    d = clone(); delete d.classes.tower.node_roles;
    expect(v(d).join('\n')).toMatch(/tower: infrastructure with no node_roles/);
  });
});

describe('never blocked by device', () => {
  it('every panel is ordered for every client class, each exactly once', () => {
    for (const cls of [...CLIENT_CLASSES, 'unknown-class']) {
      const o = orderPanels(cls);
      expect([...o].sort()).toEqual([...PANEL_KEYS].sort());
      expect(new Set(o).size).toBe(o.length);
    }
  });

  it('PROVEN TO CATCH: a role that forgets a panel still gets every panel', () => {
    const broken = { classes: { phone: { first: ['record'] } } };
    expect([...orderPanels('phone', PANEL_KEYS, broken)].sort()).toEqual([...PANEL_KEYS].sort());
  });

  it('nothing that decides what a person may OPEN reads the device class', () => {
    // The surface registry, the access requirements, the nav's route list and
    // the view parser: a device term in any of them would be a device gate.
    const gates = ['app/src/surfaces.js', 'app/src/lib/surface-access.js', 'app/src/lib/nav-history.js'];
    for (const f of gates) {
      const src = read(f);
      expect(src, f).not.toMatch(/device-roles|deviceClass|data-device-class|useDeviceClass/);
    }
    // The shell uses the class nowhere but the Create station's props.
    const shell = read('app/src/poe-financial-mvp-v28.jsx');
    expect(shell).not.toMatch(/deviceClass|useDeviceClass|device-roles/);
  });

  it('the station renders every panel for every class (no device branch drops one)', () => {
    const src = read('app/src/components/CreatingStation.jsx');
    // One map over the full order, never a filter on it.
    expect(src).toMatch(/order\.map\(\(k\) =>/);
    expect(src).not.toMatch(/order\.filter\(/);
    for (const k of PANEL_KEYS) expect(src).toContain(k.includes('-') ? `'${k}':` : `${k}:`);
  });
});

describe('the laptop keyboard and the handoff', () => {
  const order = orderPanels('laptop');
  it('Alt+1..9 names a panel in the current order; Alt+0 is the top', () => {
    expect(shortcutTarget({ altKey: true, code: 'Digit1' }, order)).toBe(order[0]);
    expect(shortcutTarget({ altKey: true, code: 'Numpad3' }, order)).toBe(order[2]);
    expect(shortcutTarget({ altKey: true, code: 'Digit0' }, order)).toBe('top');
  });
  it('plain keys, Ctrl and Cmd are left alone for typing', () => {
    expect(shortcutTarget({ altKey: false, code: 'Digit1' }, order)).toBe(null);
    expect(shortcutTarget({ altKey: true, ctrlKey: true, code: 'Digit1' }, order)).toBe(null);
    expect(shortcutTarget({ altKey: true, metaKey: true, code: 'Digit1' }, order)).toBe(null);
    expect(shortcutTarget({ altKey: true, code: 'KeyA' }, order)).toBe(null);
  });
  it('a handoff link opens the station at one panel, and carries no identity', () => {
    const u = handoffUrl({ origin: 'https://poetech.us', base: '/poetech-app/', panel: 'decide' });
    expect(u).toBe('https://poetech.us/poetech-app/?view=create&panel=decide');
    expect(handoffUrl({ origin: 'https://poetech.us/', panel: 'nope' })).toBe('https://poetech.us/?view=create&panel=your-lessons');
    expect(u).not.toMatch(/token|session|code=/i);
    expect(handoffTarget('phone')).toBe('laptop');
    expect(handoffTarget('laptop')).toBe('phone');
  });
  it('the boot read keeps the panel before nav-history drops it; the station validates it', () => {
    expect(stationPanelFrom('?view=create&panel=decide')).toBe('decide');
    expect(stationPanelFrom('?view=notes&panel=decide')).toBe('');
    expect(panelFromSearch('?panel=decide')).toBe('decide');
    expect(panelFromSearch('?panel=<script>')).toBe('');
  });
});
