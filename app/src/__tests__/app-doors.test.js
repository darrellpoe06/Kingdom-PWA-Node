// @vitest-environment node
// =============================================================================
// app-doors — the door a space lives behind, and the deep link a tap carries
// =============================================================================
// WHY IT EXISTS. Darrell, 2026-09-16, twice in one sitting:
//   "The messages notifications don't work fully... the open the app to the
//    welcome instead of the text message."
//   "I text Christina from the Love Corner App and receive a text from the
//    PoeTech App... I also need the message to be sent from and received from
//    the group it belongs to originally."
//
// Both were one line of push-announce.js: `/poetech-app/?tab=messages`. The
// `?tab=` half made every tap land on the default view (the welcome screen);
// the `/poetech-app/` half handed a church thread to the family door.
//
// PROVEN-TO-CATCH (DR-0076 §3). Four cases below fail if the fix is reverted:
// the `?tab=` regression guard, the `/poetech-app/` hard-code guard, the
// church-door landing, and the served-page check that a door path is real.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DOORS, PERSONAL_DOOR, doorForInstanceSlug, doorPathForInstanceSlug, currentDoor,
  messageLanding, liveLanding, dmPeerFrom, captureDeepLink, consumeDmPeer,
  resetDeepLinkForTests, doorLabelForInstanceSlug, spaceLabel,
} from '../lib/app-doors.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, '..', '..');
const PEER = '11111111-2222-3333-4444-555555555555';

describe('every door in the registry is a real, served page', () => {
  it('has a served index.html on disk — a typo here is a 404 in a pocket', () => {
    for (const d of DOORS) {
      const rel = d.path === PERSONAL_DOOR ? 'index.html' : d.path.replace(/^\//, '') + 'index.html';
      expect(existsSync(join(APP, rel)), `${d.path} has no served page at app/${rel}`).toBe(true);
    }
  });

  it('is an MPA input in vite.config.js, so the build actually emits it', () => {
    const vite = readFileSync(join(APP, 'vite.config.js'), 'utf8');
    for (const d of DOORS) {
      if (d.path === PERSONAL_DOOR) continue;
      const entry = d.path.replace(/^\//, '') + 'index.html';
      expect(vite, `${entry} is not a rollup input — the door would not be built`).toContain(entry);
    }
  });

  it('claims each instance slug for exactly one door', () => {
    const seen = new Map();
    for (const d of DOORS) {
      for (const slug of d.instances) {
        expect(seen.has(slug), `${slug} is claimed by two doors`).toBe(false);
        seen.set(slug, d.path);
      }
    }
  });
});

describe('a space resolves to its own door', () => {
  it('sends the church to the Love Corner door (slug colg, migration 0012)', () => {
    expect(doorPathForInstanceSlug('colg')).toBe('/lovecorner/app/');
    expect(doorForInstanceSlug('colg').label).toBe('The Love Corner');
  });

  it('sends the family to the personal door', () => {
    expect(doorPathForInstanceSlug('poe-family')).toBe(PERSONAL_DOOR);
  });

  it('sends a space with no door of its own to the personal door, never nowhere', () => {
    expect(doorPathForInstanceSlug('some-trust')).toBe(PERSONAL_DOOR);
    expect(doorPathForInstanceSlug(null)).toBe(PERSONAL_DOOR);
    expect(doorPathForInstanceSlug('')).toBe(PERSONAL_DOOR);
  });

  it('is case- and whitespace-tolerant about a slug', () => {
    expect(doorPathForInstanceSlug(' COLG ')).toBe('/lovecorner/app/');
  });
});

describe('the landing a notification tap carries', () => {
  it('routes on ?view= and NEVER on ?tab= — the welcome-screen defect', () => {
    const url = messageLanding({ instanceSlug: 'colg', peerUserId: PEER });
    expect(url).toContain('?view=messages');
    expect(url).not.toContain('tab=');
  });

  it('opens the thread, not just the list', () => {
    expect(messageLanding({ instanceSlug: 'colg', peerUserId: PEER })).toContain(`dm=${PEER}`);
  });

  it("lands in the THREAD'S door — a church message never opens the family app", () => {
    expect(messageLanding({ instanceSlug: 'colg', peerUserId: PEER }))
      .toBe(`/lovecorner/app/?view=messages&dm=${PEER}`);
    expect(messageLanding({ instanceSlug: 'moore-divahs', peerUserId: PEER }))
      .toBe(`/moore/app/?view=messages&dm=${PEER}`);
  });

  it('drops a peer that is not a uuid rather than writing a dead link', () => {
    expect(messageLanding({ instanceSlug: 'colg', peerUserId: 'not-a-uuid' }))
      .toBe('/lovecorner/app/?view=messages');
    expect(messageLanding({ instanceSlug: 'colg' })).toBe('/lovecorner/app/?view=messages');
  });

  it('sends a live announcement to the church surface of that space door', () => {
    expect(liveLanding({ instanceSlug: 'colg' })).toBe('/lovecorner/app/?view=church');
    expect(liveLanding({})).toBe(`${PERSONAL_DOOR}?view=church`);
  });

  it('every landing is a same-origin path, which is all push-send will accept', () => {
    for (const slug of ['colg', 'poe-family', 'moore-divahs', 'unknown']) {
      for (const u of [messageLanding({ instanceSlug: slug, peerUserId: PEER }), liveLanding({ instanceSlug: slug })]) {
        expect(u.charAt(0)).toBe('/');
        expect(u.charAt(1)).not.toBe('/');
      }
    }
  });
});

describe('which door THIS page booted as', () => {
  it('reads the path first', () => {
    expect(currentDoor('/lovecorner/app/', '').key).toBe('lovecorner');
    expect(currentDoor('/moore/app/index.html', '').key).toBe('moore');
    expect(currentDoor('/poetech-app/', '').key).toBe('poetech');
  });

  it('honors the legacy launch param, so a printed QR still opens the church door', () => {
    expect(currentDoor('/', '?lovecorner=1').key).toBe('lovecorner');
  });

  it('never treats the in-app Church TAB as the church door (install identity)', () => {
    expect(currentDoor('/poetech-app/', '?view=church').key).toBe('poetech');
  });

  it('defaults to the personal door on junk input', () => {
    expect(currentDoor(null, null).key).toBe('poetech');
    expect(currentDoor('/', '?%%%').key).toBe('poetech');
  });
});

describe('the boot snapshot is taken once and consumed once', () => {
  beforeEach(() => resetDeepLinkForTests());

  it('reads the dm peer out of the boot URL', () => {
    captureDeepLink(`?view=messages&dm=${PEER}`);
    expect(consumeDmPeer()).toBe(PEER);
  });

  it('cannot be re-read after the surface has used it', () => {
    captureDeepLink(`?view=messages&dm=${PEER}`);
    expect(consumeDmPeer()).toBe(PEER);
    expect(consumeDmPeer()).toBe(null);
  });

  it('ignores a rewritten URL — the first read wins (the lazy-mount race)', () => {
    captureDeepLink(`?view=messages&dm=${PEER}`);
    captureDeepLink('?view=messages');
    expect(consumeDmPeer()).toBe(PEER);
  });

  it('refuses a non-uuid peer', () => {
    expect(dmPeerFrom('?dm=../../etc/passwd')).toBe(null);
    expect(dmPeerFrom('?dm=')).toBe(null);
    expect(dmPeerFrom('')).toBe(null);
  });
});

describe('the defect cannot come back', () => {
  // Comments are stripped first: both defects are named at length in this
  // file's own prose (that is the point of the prose), and a guard that reads
  // the explanation as the offence would be theatre. This reads the CODE.
  const codeOf = (rel) => readFileSync(join(APP, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  const announce = codeOf(join('src', 'lib', 'push-announce.js'));

  it('push-announce ships no ?tab= landing', () => {
    expect(announce).not.toMatch(/\?tab=/);
  });

  it('push-announce hard-codes no door path — the landing is derived', () => {
    expect(announce).not.toMatch(/'\/poetech-app\//);
    expect(announce).toMatch(/messageLanding\(/);
  });

  it('the shell and parseNav both still accept ?tab= for the notifications already on phones', () => {
    for (const f of ['src/poe-financial-mvp-v28.jsx', 'src/lib/nav-history.js']) {
      expect(readFileSync(join(APP, f), 'utf8')).toMatch(/sp\.get\('view'\) \|\| sp\.get\('tab'\)/);
    }
  });
});

// THE NAME A PERSON RECOGNIZES (DR-0447). Darrell 2026-09-16: "Messages don't
// give an option for the Love Corner" — of a list that held that very space
// under its registry name. A space must be sayable as the door it is.
describe('a space is named by its door', () => {
  it('names the church door', () => {
    expect(doorLabelForInstanceSlug('colg')).toBe('The Love Corner');
    expect(spaceLabel({ slug: 'colg', displayName: 'The Church of the Living God' }))
      .toBe('The Love Corner \u00b7 The Church of the Living God');
  });

  it('says a space that is its own door once', () => {
    expect(spaceLabel({ slug: 'tlc', displayName: 'TLC Therapy Solutions' })).toBe('TLC Therapy Solutions');
    expect(spaceLabel({ slug: 'poe-properties', displayName: 'Poe Properties' })).toBe('Poe Properties');
  });

  it('keeps the record name when there is no slug to read a door from', () => {
    expect(spaceLabel({ slug: null, displayName: 'Poe Family' })).toBe('Poe Family');
    expect(spaceLabel({ slug: '', displayName: 'Moore Divahs' })).toBe('Moore Divahs');
  });

  it('falls back to the door when a space has no name at all', () => {
    expect(spaceLabel({ slug: 'colg', displayName: '' })).toBe('The Love Corner');
    expect(spaceLabel({})).toBe('PoeTech');
  });

  it('an unknown slug is the personal door, never a blank', () => {
    expect(doorLabelForInstanceSlug('nobody-knows')).toBe('PoeTech');
  });
});
