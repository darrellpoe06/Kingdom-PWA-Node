// =============================================================================
// EVERY POE PROPERTIES PAGE IS REPORTABLE, AND EVERY PAGE HAS AN ADDRESS
// =============================================================================
// Darrell, 2026-10-10:
//
//   "Feedback? Should be inside for app issues... workorders for property
//    issues... make sense?"
//
//   "It's alread built into the PoeTech App... use discretion and make sure
//    thr fields and pages are all able to be linked to as the page with said
//    issue/s... make sense?"
//
// WHAT WAS MEASURED. Two things were true at once, and each made the other
// impossible to fix:
//
//   1. FEEDBACK_AREAS collapsed all 21 Poe Properties surfaces into ONE entry
//      ('properties'), while the OLDER Real Estate tab the module replaces
//      carried eleven sub-entries. So the newer surface was the LESS
//      reportable one, and a reviewer standing on Guest ready or Dispatch
//      could only file against "the Poe Properties module".
//
//   2. The module had no addressing at all. 21 surfaces lived in one React
//      state variable (`const [tab, setTab] = useState('')`), the door in
//      `activeId`, and the URL never changed. So "link to the page with the
//      issue" had nothing to link TO -- and a reload threw you back to the
//      landing tab, and the back gesture left the app from every tab.
//
// THE GATE'S SHAPE. The feedback list is now DERIVED from the module's own
// face definitions rather than hand-mirrored, so the two cannot drift. That
// is only worth anything if something proves the derivation covers every
// surface and that the keys are stable -- which is what this file does, by
// importing BOTH lists and comparing them, not by scraping source.
//
// PROVEN-TO-CATCH is in two places, both load-bearing:
//   * `addressFromSearch` must DROP a tab id that is not a real surface. A
//     version that trusted the URL would let a typed link put the app into a
//     state no face has.
//   * the derived-coverage case fails against a hand-listed version: it
//     asserts a key for EVERY id in propertiesSurfaces(), which the old
//     single-'properties' list satisfied for exactly none of them.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  propertiesSurfaces, surfaceIds, isSurface, areaKeyFor, surfaceIdFromAreaKey,
  addressFromSearch, searchWithAddress, linkToAddress, describeAddress,
  isDoorId, PARAM_TAB, PARAM_DOOR, PARAM_AREA,
} from '../modules/properties/addressing.js';
import { addressNow, writeAddress } from '../modules/properties/use-address.js';
import { FEEDBACK_AREAS } from '../components/FeedbackCenter.jsx';
import { TENANT_TABS, WORKER_TABS, MANAGER_TABS } from '../modules/properties/model.js';

const DOOR = '11111111-2222-3333-4444-555555555555';

const allKeys = () => FEEDBACK_AREAS.flatMap((g) => g.items.map(([k]) => k));

describe('the module knows what pages it has', () => {
  it('names every surface across all three faces, once each', () => {
    const ids = surfaceIds();
    expect(new Set(ids).size).toBe(ids.length);           // no duplicates
    const every = [...MANAGER_TABS, ...WORKER_TABS, ...TENANT_TABS].map((t) => t.id);
    for (const id of every) expect(ids).toContain(id);
    // 21 as measured 2026-10-10. A number here is a tripwire, not a target:
    // when a tab is added this fails, and the fix is to update it knowingly.
    // 23 from #2096: 'stays' (the family's booking desk, DR-0907) and
    // 'papers' (the tenant's own signed and filed papers, DR-0913).
    expect(ids).toHaveLength(23);
  });

  it('carries the faces that show a surface, because a report wants to say who was looking', () => {
    const history = propertiesSurfaces().find((s) => s.id === 'history');
    expect(history.faces.sort()).toEqual(['manager', 'tenant', 'worker']);
    // The same tab id is labelled differently per face; both labels survive.
    expect(history.labels).toContain('History');
    expect(history.labels).toContain('Property history');
  });

  it('a tab only one face has carries only that face', () => {
    expect(propertiesSurfaces().find((s) => s.id === 'dispatch').faces).toEqual(['manager']);
    expect(propertiesSurfaces().find((s) => s.id === 'notices').faces).toEqual(['tenant']);
  });
});

describe('every page is selectable in the feedback form', () => {
  it('PROVEN-TO-CATCH: EVERY surface has its own area key (the old list had none of them)', () => {
    const keys = allKeys();
    const missing = surfaceIds().filter((id) => !keys.includes(areaKeyFor(id)));
    expect(missing, `surfaces with no feedback area: ${missing.join(', ')}`).toEqual([]);
  });

  it('the old general key is KEPT — stored reports reference it', () => {
    // FEEDBACK_AREAS' own rule: "Existing keys are STABLE (stored feedback
    // rows reference them); only add, don't rename."
    expect(allKeys()).toContain('properties');
  });

  it('no key appears twice, so the picker cannot show one page under two options', () => {
    const keys = allKeys();
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
    expect(dupes, `duplicate feedback keys: ${dupes.join(', ')}`).toEqual([]);
  });

  it('every properties-* key maps back to a real surface (no orphans)', () => {
    const orphans = allKeys()
      .filter((k) => k.startsWith('properties-'))
      .filter((k) => !surfaceIdFromAreaKey(k));
    expect(orphans).toEqual([]);
  });

  it('they are grouped under their own heading, not buried in Real Estate', () => {
    const g = FEEDBACK_AREAS.find((x) => x.group === 'Poe Properties');
    expect(g).toBeTruthy();
    // 23 pages (21, plus stays and papers from #2096) + the general entry.
    expect(g.items).toHaveLength(24);
  });

  it('a page key is not confusable with the Real Estate tab it replaced', () => {
    for (const k of allKeys().filter((k) => k.startsWith('properties-'))) {
      expect(k.startsWith('rentals-')).toBe(false);
    }
    expect(allKeys()).toContain('rentals-rooms');   // the older surface still exists
    expect(allKeys()).toContain('properties-rooms'); // and is a different page
  });
});

describe('a page has an address that survives a round trip', () => {
  it('every surface round-trips through a query string', () => {
    for (const id of surfaceIds()) {
      const q = searchWithAddress('?properties=1', { tab: id, door: DOOR });
      expect(addressFromSearch(q)).toEqual({ tab: id, door: DOOR, area: null });
    }
  });

  it('keeps ?properties=1 — dropping it would boot the person out of the module', () => {
    // main.jsx boots the door on __params.get('properties') === '1'.
    const q = searchWithAddress('?properties=1', { tab: 'board' });
    expect(new URLSearchParams(q.slice(1)).get('properties')).toBe('1');
  });

  it('keeps any other parameter riding alongside (a reviewer or demo flag)', () => {
    const q = searchWithAddress('?properties=1&reviewer=1', { tab: 'board' });
    const p = new URLSearchParams(q.slice(1));
    expect(p.get('reviewer')).toBe('1');
    expect(p.get(PARAM_TAB)).toBe('board');
  });

  it('a null field REMOVES its parameter, so a stale door does not linger', () => {
    const withDoor = searchWithAddress('?properties=1', { tab: 'board', door: DOOR });
    expect(new URLSearchParams(withDoor.slice(1)).get(PARAM_DOOR)).toBe(DOOR);
    const without = searchWithAddress(withDoor, { tab: 'doors', door: null });
    expect(new URLSearchParams(without.slice(1)).get(PARAM_DOOR)).toBeNull();
  });

  it('carries a sub-area, for Guest ready', () => {
    const q = searchWithAddress('', { tab: 'readiness', area: 'airbnb' });
    expect(addressFromSearch(q).area).toBe('airbnb');
    expect(new URLSearchParams(q.slice(1)).get(PARAM_AREA)).toBe('airbnb');
  });

  it('builds a whole link a person can paste', () => {
    const link = linkToAddress(
      { origin: 'https://poetech.us', pathname: '/properties/app/', search: '?properties=1' },
      { tab: 'readiness', door: DOOR },
    );
    expect(link).toContain('https://poetech.us/properties/app/?properties=1');
    expect(link).toContain(`${PARAM_TAB}=readiness`);
  });
});

describe('PROVEN-TO-CATCH: the URL is never trusted', () => {
  it('drops a tab id that is not a real surface', () => {
    expect(addressFromSearch('?p=admin').tab).toBeNull();
    expect(addressFromSearch('?p=../../etc/passwd').tab).toBeNull();
    expect(addressFromSearch('?p=').tab).toBeNull();
    expect(isSurface('nope')).toBe(false);
  });

  it('drops a door that is not a uuid, rather than querying with it', () => {
    expect(addressFromSearch('?door=1 OR 1=1').door).toBeNull();
    expect(addressFromSearch('?door=abc').door).toBeNull();
    expect(isDoorId(DOOR)).toBe(true);
  });

  it('drops an area that is not a plain slug, and caps its length', () => {
    expect(addressFromSearch('?area=<script>').area).toBeNull();
    expect(addressFromSearch(`?area=${'a'.repeat(200)}`).area).toBeNull();
  });

  it('a malformed search answers empty instead of throwing', () => {
    expect(addressFromSearch(undefined)).toEqual({ tab: null, door: null, area: null });
    expect(addressFromSearch('%%%')).toEqual({ tab: null, door: null, area: null });
  });

  it('writing refuses an invalid value rather than putting it in the URL', () => {
    const q = searchWithAddress('?properties=1', { tab: 'not-a-tab', door: 'not-a-uuid' });
    expect(q).toBe('?properties=1');
  });
});

describe('the page says where it is, in words', () => {
  it('names the page and the door', () => {
    expect(describeAddress({ tab: 'readiness' }, { doorName: '805 N Prospect · Apt 2' }))
      .toBe('Guest ready, on 805 N Prospect · Apt 2');
  });

  it('names the page alone when no door is chosen', () => {
    expect(describeAddress({ tab: 'board' })).toBe('Work board');
  });

  it('includes a sub-area when there is one', () => {
    expect(describeAddress({ tab: 'readiness', area: 'airbnb' })).toContain('(airbnb)');
  });

  it('falls back to the module name rather than rendering an id', () => {
    expect(describeAddress({ tab: null })).toBe('Poe Properties');
    expect(describeAddress({ tab: 'nope' })).toBe('Poe Properties');
  });
});

describe('the browser half — nothing here may throw', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('reads the address the page was opened at', () => {
    const win = { location: { search: `?properties=1&${PARAM_TAB}=board` } };
    // addressNow defaults to the real window; the pure function is what the
    // module uses, and it is proven above. This pins the no-window case.
    expect(addressFromSearch(win.location.search).tab).toBe('board');
  });

  it('survives a document with no history (an iframe, an opaque origin)', () => {
    expect(writeAddress({ tab: 'board' }, { win: null })).toBe(false);
    expect(writeAddress({ tab: 'board' }, { win: {} })).toBe(false);
  });

  it('survives history.pushState THROWING, which is the real failure mode', () => {
    const win = {
      location: { search: '?properties=1', pathname: '/properties/app/', hash: '' },
      history: { pushState: () => { throw new Error('SecurityError'); }, replaceState: () => { throw new Error('SecurityError'); } },
    };
    expect(writeAddress({ tab: 'board' }, { mode: 'push', win })).toBe(false);
    expect(writeAddress({ tab: 'board' }, { mode: 'replace', win })).toBe(false);
  });

  it('writes nothing when the address has not changed', () => {
    const calls = [];
    const win = {
      location: { search: `?properties=1&${PARAM_TAB}=board`, pathname: '/x', hash: '' },
      history: { pushState: () => calls.push('push'), replaceState: () => calls.push('replace') },
    };
    expect(writeAddress({ tab: 'board' }, { win })).toBe(false);
    expect(calls).toEqual([]);
  });

  it('PUSHES a tab so back steps a tab instead of leaving the app', () => {
    const calls = [];
    const win = {
      location: { search: '?properties=1', pathname: '/properties/app/', hash: '' },
      history: { pushState: (a, b, url) => calls.push(['push', url]), replaceState: (a, b, url) => calls.push(['replace', url]) },
    };
    writeAddress({ tab: 'board' }, { mode: 'push', win });
    expect(calls[0][0]).toBe('push');
    expect(calls[0][1]).toBe(`/properties/app/?properties=1&${PARAM_TAB}=board`);
  });

  it('keeps the hash, which the reader and the openers use', () => {
    const calls = [];
    const win = {
      location: { search: '?properties=1', pathname: '/x', hash: '#top' },
      history: { replaceState: (a, b, url) => calls.push(url) },
    };
    writeAddress({ tab: 'board' }, { win });
    expect(calls[0].endsWith('#top')).toBe(true);
  });

  it('addressNow answers empty with no window at all', () => {
    expect(addressNow(null)).toEqual({ tab: null, door: null, area: null });
  });
});

describe('the surfaces that carry it', () => {
  const read = async (...parts) => {
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    return readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', ...parts), 'utf8');
  };

  it('the module opens AT the address rather than defaulting then correcting', async () => {
    const src = await read('modules', 'properties', 'PropertiesApp.jsx');
    // A link must land on its page with no flash of the landing tab, so the
    // initial state reads the URL — not an effect that fixes it afterwards.
    expect(src).toMatch(/useState\(opened\.tab \|\| ''\)/);
    expect(src).toMatch(/useState\(opened\.door \|\| ''\)/);
  });

  it('the URL names the page being LOOKED AT, not the empty default', async () => {
    const src = await read('modules', 'properties', 'PropertiesApp.jsx');
    expect(src).toMatch(/\{ tab: activeTab, door: activeId \|\| null/);
  });

  it('the back gesture can only land on a page THIS face has', async () => {
    const src = await read('modules', 'properties', 'PropertiesApp.jsx');
    expect(src).toMatch(/face\.tabs\.some\(\(t\) => t\.id === at\.tab\)/);
  });

  it('the report button hands over BOTH the area key and the link', async () => {
    const src = await read('modules', 'properties', 'PropertiesApp.jsx');
    expect(src).toContain('data-testid="properties-report-page"');
    expect(src).toMatch(/onFeedback\(areaKeyFor\(activeTab\)/);
    expect(src).toContain('link: linkToAddress(');
  });

  it('the report control is HIDDEN on the tenant door, where the channel would enrol them', async () => {
    const src = await read('modules', 'properties', 'PropertiesApp.jsx');
    // Gated on the prop existing, which only the PoeTech shell passes. This is
    // the tenancy boundary, not a layout choice — see the comment there.
    expect(src).toMatch(/\{onFeedback && \(/);
    const door = await read('components', 'PropertiesDoor.jsx');
    expect(door).not.toContain('onFeedback');
  });

  it('the shell passes it, and the modal receives the page', async () => {
    const shell = await read('poe-financial-mvp-v28.jsx');
    expect(shell).toMatch(/onFeedback=\{\(areaKey, where\) =>/);
    expect(shell).toContain('initialWhere=');
    const fc = await read('components', 'FeedbackCenter.jsx');
    expect(fc).toMatch(/initialWhere = null/);
    // Seeded into the body the reporter can SEE and edit, never attached
    // invisibly.
    expect(fc).toMatch(/const \[whatsNot, setWhatsNot\] = useState\(/);
  });

  it('the feedback list is DERIVED from the module, so it cannot go stale again', async () => {
    const fc = await read('components', 'FeedbackCenter.jsx');
    expect(fc).toMatch(/propertiesSurfaces\(\)\.map/);
    expect(fc).toContain("import { propertiesSurfaces, areaKeyFor } from '../modules/properties/addressing.js'");
  });
});
