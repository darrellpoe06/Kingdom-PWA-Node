// Which tabs a person sees, and what a locked one says.
//
// Darrell 2026-09-11: "Also staff should be the only ones on certain tabs
// anyway.... views for different users... not showing tabs unless they are
// staff or it's black with instructions for access..."
//
// The `gate` field had sat on 29 of 56 surfaces as PROSE, read by nothing, since
// the registry was written. This is the pass that makes it enforce — and the
// tests that matter most are the ones about the second half of that sentence:
// a locked tile has to actually instruct, or it is just a prettier dead end.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  REQUIREMENTS, REQUIREMENT_IDS, DEFAULT_REQUIREMENT, DEFAULT_WHEN_DENIED,
  surfaceAccess, listedSurfaces, lockedSurfaces, isLocked, ACCESS_REQUEST_IS_NOT_BUILT,
} from '../lib/surface-access.js';
import { SURFACES } from '../surfaces.js';
import LockedSurface from '../components/LockedSurface.jsx';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(SRC, rel), 'utf8');

const STRANGER = { signedIn: false };
const MEMBER = { signedIn: true, instanceRole: 'member' };
const STAFF = { signedIn: true, isChurchStaff: true, instanceRole: 'member' };
const GOVERNOR = { signedIn: true, isFamilyMember: true, isChurchStaff: true, isStudyCircle: true, instanceRole: 'owner' };

const byId = (id) => SURFACES.find((s) => s.id === id);

describe('the registry declares it, so it is a decision and not an accident', () => {
  it('every surface carrying a prose gate now carries a MACHINE one too', () => {
    const gated = SURFACES.filter((s) => s.gate);
    expect(gated.length).toBeGreaterThan(20);
    for (const s of gated) {
      expect(s.requires, `${s.id} has a gate but no requires`).toBeTruthy();
      expect(REQUIREMENT_IDS, `${s.id} -> ${s.requires}`).toContain(s.requires);
      expect(['hide', 'lock'], `${s.id} -> ${s.whenDenied}`).toContain(s.whenDenied);
    }
  });

  it('every requirement names a REAL person or desk to ask — never "your administrator"', () => {
    for (const r of Object.values(REQUIREMENTS)) {
      expect(r.plain, r.id).toBeTruthy();
      expect(String(r.ask).toLowerCase(), r.id).not.toMatch(/your administrator|the administrator|system admin|it department/);
    }
    // BG is Bishop Gwin — the person Darrell named as the gate.
    expect(REQUIREMENTS['church-staff'].ask).toMatch(/Bishop Gwin/);
  });

  it('an undeclared surface is OPEN, stated rather than implied', () => {
    expect(DEFAULT_REQUIREMENT).toBe('anyone');
    expect(surfaceAccess({ id: 'x', label: 'X' }, STRANGER).allowed).toBe(true);
    expect(DEFAULT_WHEN_DENIED).toBe('lock');
  });
});

describe('the two behaviours Darrell named', () => {
  it('HIDES the surfaces whose very existence is not a member’s business', () => {
    for (const id of ['observe', 'admin', 'study', 'crm', 'forecast']) {
      const a = surfaceAccess(byId(id), MEMBER);
      expect(a.allowed, id).toBe(false);
      expect(a.listed, `${id} must not be listed to a member`).toBe(false);
      expect(a.locked, id).toBe(false);
    }
  });

  it('LOCKS the surfaces a person could legitimately want and ask for', () => {
    for (const id of ['devices', 'infra-plan', 'videowall', 'harvest', 'church-projects']) {
      const a = surfaceAccess(byId(id), MEMBER);
      expect(a.allowed, id).toBe(false);
      expect(a.listed, `${id} should stay visible so a member knows the door exists`).toBe(true);
      expect(a.locked, id).toBe(true);
      expect(a.ask, id).toMatch(/church office|Bishop Gwin/);
    }
  });

  it('opens all of them to church staff, and the family above that', () => {
    for (const id of ['devices', 'infra-plan', 'videowall', 'harvest', 'observe', 'church-projects']) {
      expect(surfaceAccess(byId(id), STAFF).allowed, id).toBe(true);
    }
    for (const id of ['admin', 'crm', 'forecast', 'study']) {
      expect(surfaceAccess(byId(id), GOVERNOR).allowed, id).toBe(true);
      expect(surfaceAccess(byId(id), STAFF).allowed, `${id} must NOT open to church staff`).toBe(false);
    }
  });

  it('REVIEWER MODE is not a key — it never hands over a staff surface', () => {
    // Reviewer mode exists to see the live build as a user meets it (DR-0104).
    // A reviewer who inherited staff powers would be reviewing the wrong app.
    const reviewer = { ...GOVERNOR, reviewerMode: true };
    for (const id of ['observe', 'admin', 'study', 'devices']) {
      expect(surfaceAccess(byId(id), reviewer).allowed, id).toBe(false);
    }
  });

  it('a signed-out visitor is told to sign in, not told off', () => {
    const a = surfaceAccess(byId('my-record'), STRANGER);
    expect(a.allowed).toBe(false);
    expect(a.why).toMatch(/Sign in first/);
    expect(a.why).not.toMatch(/denied|forbidden|not allowed|permission/i);
  });
});

describe('the list helpers a nav actually calls', () => {
  it('a member’s church nav carries the open and the locked, never the hidden', () => {
    const ids = listedSurfaces(SURFACES, 'church', MEMBER).map((s) => s.id);
    expect(ids).toContain('ministries');
    expect(ids).toContain('devices');       // locked, but listed
    expect(ids).not.toContain('observe');   // hidden outright
  });
  it('staff see everything in their own house', () => {
    const ids = listedSurfaces(SURFACES, 'church', STAFF).map((s) => s.id);
    expect(ids).toContain('observe');
    expect(lockedSurfaces(SURFACES, 'church', STAFF)).toEqual([]);
  });
  it('isLocked answers for one tab, and is false for an id that does not exist', () => {
    expect(isLocked(SURFACES, 'devices', MEMBER)).toBe(true);
    expect(isLocked(SURFACES, 'devices', STAFF)).toBe(false);
    expect(isLocked(SURFACES, 'no-such-surface', MEMBER)).toBe(false);
  });
});

describe('the locked tile instructs — the whole point of the second half', () => {
  let container, root;
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  // The registry is shell-only, so the tile takes its own entry as a prop —
  // which is why these tests can hand it a plain object below.
  const mount = (props) => act(() => { root.render(createElement(LockedSurface, props)); });

  it('says WHAT it is, WHO holds it, and WHY it is shut', () => {
    mount({ surface: byId('devices'), viewer: MEMBER, what: 'The register of what the church owns and runs.' });
    const t = container.textContent;
    expect(t).toContain('Devices');                              // what
    expect(t).toContain('The register of what the church owns'); // what, in full
    expect(t).toMatch(/Bishop Gwin/);                            // who
    expect(t).toMatch(/for church staff/i);                      // why
  });

  it('says plainly that there is no request button yet, instead of drawing one', () => {
    mount({ surface: byId('devices'), viewer: MEMBER });
    expect(ACCESS_REQUEST_IS_NOT_BUILT.built).toBe(false);
    expect(container.textContent).toContain(ACCESS_REQUEST_IS_NOT_BUILT.today);
    const labels = Array.from(container.querySelectorAll('button')).map((b) => b.textContent);
    expect(labels.join(' ')).not.toMatch(/request|ask for access/i);
  });

  it('offers a signed-out person the one thing that would actually help', () => {
    const clicks = [];
    mount({ surface: byId('devices'), viewer: STRANGER, onSignIn: () => clicks.push(1) });
    const b = Array.from(container.querySelectorAll('button')).find((x) => /Sign in/.test(x.textContent));
    act(() => b.click());
    expect(clicks).toEqual([1]);
  });

  it('is dark, as asked — and not an error colour, because a shut door is not an error', () => {
    mount({ surface: byId('devices'), viewer: MEMBER });
    const box = container.querySelector('section');
    expect(box.className).toMatch(/bg-\[#1A1815\]/);
    expect(box.className).not.toMatch(/red|#7A1F1F|#B85838/);
  });

  it('admits the database is the real wall', () => {
    mount({ surface: byId('devices'), viewer: MEMBER });
    expect(container.textContent).toMatch(/the database, and it holds whether this tab is drawn or not/);
  });

  it('survives being handed nothing at all', () => {
    mount({ viewer: MEMBER });
    expect(container.textContent).toContain('This surface');
  });
});

describe('the shell wiring — the five hand-written boxes are gone', () => {
  const shell = read('poe-financial-mvp-v28.jsx');

  it('every staff-gated church surface now falls back to the tile', () => {
    for (const id of ['harvest', 'videowall', 'devices', 'infra-plan', 'observe']) {
      expect(shell, id).toContain(`<LockedSurface surface={surfaceById['${id}']}`);
    }
  });

  it('the old "Sign in with a church staff account" boxes are removed', () => {
    // They were wrong for anybody already signed in, which is most of the
    // people who ever hit them.
    expect(shell).not.toMatch(/Sign in with a church staff account/);
  });

  it('the viewer is assembled from predicates the shell already had', () => {
    expect(shell).toMatch(/const surfaceViewer = \{ signedIn: !!authSession, isFamilyMember, isChurchStaff, isStudyCircle, instanceRole: instanceRoleState\.role \|\| '', reviewerMode \}/);
  });
});

describe('proven-to-catch (anti-theater)', () => {
  it('CATCHES a staff surface that opened to a plain member', () => {
    expect(surfaceAccess(byId('observe'), MEMBER).allowed).toBe(false);
  });
  it('CATCHES a hidden surface that started being listed', () => {
    expect(surfaceAccess({ id: 'x', label: 'X', requires: 'family', whenDenied: 'hide' }, MEMBER).listed).toBe(false);
  });
  it('CATCHES a locked tile that stopped naming anyone to ask', () => {
    const a = surfaceAccess(byId('devices'), MEMBER);
    expect(a.ask.length).toBeGreaterThan(0);
  });
  it('CATCHES this file claiming to be the wall', () => {
    const src = read('lib/surface-access.js');
    expect(src).toMatch(/THE DATABASE IS THE WALL/);
    expect(src).not.toMatch(/supabase|fetch\(|\.rpc\(/);
  });

  it('CATCHES the tile reaching into the shell-only registry', () => {
    // module-boundary-guard caught exactly this on the first draft.
    expect(read('components/LockedSurface.jsx')).not.toMatch(/from '\.\.\/surfaces\.js'/);
  });
});
